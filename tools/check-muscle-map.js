#!/usr/bin/env node
/**
 * Audits fitness/muscles.data.js against the exercise library.
 *
 *   node tools/check-muscle-map.js
 *
 * Three assertions, and the second one is the important one:
 *
 *   1. Every exercise id in EXERCISE_DB has an explicit entry in MUSCLE_MAP.
 *      (The pattern fallback is a safety net, not a substitute.)
 *
 *   2. Every group in MUSCLE_GROUPS is reachable — it appears as `primary` on
 *      at least one exercise. A group nothing can train is a dead tile in the
 *      UI and an unearnable badge. Writing this check FIRST is what would have
 *      caught the five phantom groups (neck, calves, adductors, traps, rear
 *      delts) that an imported taxonomy brought in.
 *
 *   3. The weekly-target model (MUSCLE_WEEK) covers every slot of every
 *      template in fitness/basalt.js, and no template leaves a group untrained
 *      (section 6). The templates are read from basalt.js, so a new one is
 *      audited the day it is added.
 *
 * Exits non-zero on any failure, so it can gate a commit.
 */

"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const ids = fs
  .readFileSync(path.join(root, "tools/exercise-ids.tsv"), "utf8")
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [id, pattern, name] = line.split("\t");
    return { id, pattern, name };
  });

// muscles.data.js is a plain IIFE that writes to `window`. Give it one.
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "fitness/muscles.data.js"), "utf8"), sandbox);

const GROUPS = sandbox.window.MUSCLE_GROUPS;
const MAP = sandbox.window.MUSCLE_MAP;
const FALLBACK = sandbox.window.MUSCLE_FALLBACK;

let failed = false;
const fail = (msg) => { failed = true; console.error("  ✗ " + msg); };
const ok = (msg) => console.log("  ✓ " + msg);

const groupKeys = new Set(GROUPS.map((g) => g.key));

console.log(`\nmuscle map audit — ${ids.length} exercises, ${GROUPS.length} groups\n`);

/* -- 1. every exercise mapped ------------------------------------------- */
const unmapped = ids.filter((e) => !MAP[e.id]);
if (unmapped.length) {
  unmapped.forEach((e) => fail(`unmapped exercise: ${e.id} (${e.name})`));
} else {
  ok(`all ${ids.length} exercises have an explicit map entry`);
}

/* -- 2. no map entries for exercises that don't exist -------------------- */
const known = new Set(ids.map((e) => e.id));
const orphans = Object.keys(MAP).filter((id) => !known.has(id));
if (orphans.length) {
  orphans.forEach((id) => fail(`map entry for unknown exercise: ${id}`));
} else {
  ok("no orphaned map entries");
}

/* -- 3. every referenced muscle is a real group -------------------------- */
const badRefs = [];
for (const [id, prof] of Object.entries(MAP)) {
  for (const tier of ["primary", "secondary", "stabiliser"]) {
    (prof[tier] || []).forEach((k) => {
      if (!groupKeys.has(k)) badRefs.push(`${id}.${tier} → "${k}"`);
    });
  }
}
for (const [pattern, prof] of Object.entries(FALLBACK)) {
  for (const tier of ["primary", "secondary", "stabiliser"]) {
    (prof[tier] || []).forEach((k) => {
      if (!groupKeys.has(k)) badRefs.push(`fallback.${pattern}.${tier} → "${k}"`);
    });
  }
}
if (badRefs.length) badRefs.forEach((r) => fail(`unknown muscle group: ${r}`));
else ok("every referenced muscle group exists");

/* -- 4. every group is reachable as a primary ---------------------------- */
const primaryCount = {};
const secondaryCount = {};
const anyCount = {};
groupKeys.forEach((k) => { primaryCount[k] = 0; secondaryCount[k] = 0; anyCount[k] = 0; });
for (const prof of Object.values(MAP)) {
  (prof.primary || []).forEach((k) => { if (k in primaryCount) primaryCount[k]++; });
  (prof.secondary || []).forEach((k) => { if (k in secondaryCount) secondaryCount[k]++; });
  ["primary", "secondary", "stabiliser"].forEach((t) =>
    (prof[t] || []).forEach((k) => { if (k in anyCount) anyCount[k]++; })
  );
}
/* A group must be reachable at a rate that can actually level it, which means
   appearing as primary or secondary somewhere. Stabiliser-only (0.15 share) is
   not enough — that is a dead tile wearing a number.

   Groups explicitly flagged `assist: true` are exempt from needing a PRIMARY
   movement, because in a calisthenics library some muscles genuinely never lead
   — the spinal erectors and obliques brace, they are not trained directly. The
   flag has to be deliberate, which is the point: it is a claim someone made on
   purpose, not a gap nobody noticed. */
const assistOnly = new Set(GROUPS.filter((g) => g.assist).map((g) => g.key));

const dead = [...groupKeys].filter(
  (k) => primaryCount[k] === 0 && !assistOnly.has(k)
);
if (dead.length) {
  dead.forEach((k) =>
    fail(`group "${k}" is never a primary target and is not flagged assist:true — it can never level up honestly`)
  );
} else {
  ok("every non-assist group is the primary target of at least one exercise");
}

const unreachable = [...groupKeys].filter((k) => secondaryCount[k] === 0 && primaryCount[k] === 0);
if (unreachable.length) {
  unreachable.forEach((k) =>
    fail(`group "${k}" only ever appears as a stabiliser (0.15 share) — it cannot realistically level`)
  );
} else {
  ok("every group accrues at primary or secondary rate somewhere");
}

if (assistOnly.size) {
  console.log(
    "\n  note: assist-only groups (no primary movement exists in this library): " +
    [...assistOnly].join(", ")
  );
}

/* -- 5. every exercise reaches at least one group ------------------------ */
const empty = Object.entries(MAP).filter(([, p]) => !(p.primary || []).length);
if (empty.length) empty.forEach(([id]) => fail(`exercise "${id}" has no primary muscle`));
else ok("every exercise has at least one primary muscle");

/* -- coverage report ------------------------------------------------------ */
console.log("\ncoverage (exercises touching each group):\n");
const rows = GROUPS.map((g) => ({
  group: g.label,
  primary: primaryCount[g.key],
  total: anyCount[g.key]
})).sort((a, b) => b.total - a.total);
const pad = (s, n) => String(s).padEnd(n);
console.log("  " + pad("group", 18) + pad("primary", 9) + "any");
rows.forEach((r) =>
  console.log("  " + pad(r.group, 18) + pad(r.primary, 9) + r.total)
);

/* -- 6. the weekly-target model, over every template -----------------------
   App.muscles.weeklyTargets works a group's target out at run time from the
   active template's slots (fitness/muscles.js). This runs the same arithmetic
   for every template in fitness/basalt.js, on the default day patterns with
   every slot on, which is what a profile that owns a pull-up bar and has the
   dip switched on trains. It fails on the two ways the model goes quiet:
     · a slot with no unitsPerSet entry or no profile (the row had neither
       until this check was written, and its work counted as nothing);
     · a template that never trains a group, which would pin its target at 0.
   The templates are read out of basalt.js, never copied, so a new one is
   audited the day it is added (plan D7). The numbers it prints are for you to
   eyeball: the app's own targets are per profile (equipment, optional slots),
   so they can be lower than these. */
const SHARE = { primary: 1.0, secondary: 0.4, stabiliser: 0.15 };   // fitness/muscles.js
const WEEK = sandbox.window.MUSCLE_WEEK;

const basalt = fs.readFileSync(path.join(root, "fitness/basalt.js"), "utf8");
function fromBasalt(name, open, close) {
  const m = basalt.match(new RegExp("\\n  var " + name + "\\s*=\\s*(\\" + open + "[\\s\\S]*?\\" + close + ");\\n"));
  if (!m) { fail(`could not find ${name} in fitness/basalt.js`); return null; }
  return m[1];
}
const rotationSrc = fromBasalt("ROTATION", "[", "]");
const patternsSrc = fromBasalt("DAY_PATTERNS", "{", "}");
const templatesSrc = fromBasalt("TEMPLATES", "{", "}");
let TEMPLATES = {}, DAY_PATTERNS = {};
if (rotationSrc && patternsSrc && templatesSrc) {
  const ctx = vm.createContext({});
  vm.runInContext("var ROTATION = " + rotationSrc + ";", ctx);
  DAY_PATTERNS = vm.runInContext("(" + patternsSrc + ")", ctx);
  TEMPLATES = vm.runInContext("(" + templatesSrc + ")", ctx);
}
if (!WEEK) fail("fitness/muscles.data.js has no MUSCLE_WEEK");

function measure(tpl) {
  const perType = tpl.perWeek / tpl.order.length;
  const work = {};
  groupKeys.forEach((k) => { work[k] = 0; });
  tpl.order.forEach((day) => (DAY_PATTERNS[day] || []).forEach((slot) => {
    const units = WEEK.unitsPerSet[slot];
    const prof = FALLBACK[WEEK.profileOf[slot] || slot];
    if (!units) { fail(`MUSCLE_WEEK.unitsPerSet has no "${slot}" (day ${day})`); return; }
    if (!prof) { fail(`MUSCLE_FALLBACK has no profile for "${slot}" (day ${day})`); return; }
    for (const tier of ["primary", "secondary", "stabiliser"]) {
      (prof[tier] || []).forEach((k) => {
        if (k in work) work[k] += units * WEEK.sets * perType * SHARE[tier];
      });
    }
  }));
  const out = {};
  groupKeys.forEach((k) => { out[k] = Math.round(work[k]); });
  return out;
}

const measured = {};
const templateIds = Object.keys(TEMPLATES);
console.log(`\nweekly-target model — ${templateIds.length} templates read from fitness/basalt.js\n`);
templateIds.forEach((id) => {
  const tpl = TEMPLATES[id];
  measured[id] = measure(tpl);
  const untrained = [...groupKeys].filter((k) => !(measured[id][k] > 0));
  if (untrained.length) {
    untrained.forEach((k) => fail(`${id}: ${tpl.label} never trains ${k}, so its target would be 0`));
  } else {
    ok(`${pad(id, 11)} ${tpl.perWeek}/wk over ${tpl.order.join(" + ")} — all ${groupKeys.size} groups trained`);
  }
});
console.log("\n  " + pad("group", 18) + templateIds.map((id) => pad(id, 12)).join(""));
GROUPS.forEach((g) =>
  console.log("  " + pad(g.label, 18) + templateIds.map((id) => pad(measured[id][g.key], 12)).join(""))
);
console.log("");

console.log(failed ? "\nFAILED\n" : "\nOK\n");
process.exit(failed ? 1 : 0);
