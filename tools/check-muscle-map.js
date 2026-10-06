#!/usr/bin/env node
/**
 * Audits fitness/muscles.data.js against the exercise library.
 *
 *   node tools/check-muscle-map.js
 *
 * Three assertions, and the second one is the important one:
 *
 *   1. Every exercise id in EXERCISE_DB has an explicit entry in MUSCLE_MAP.
 *      (The pattern fallback is a safety net, not a substitute.) The id list
 *      in tools/exercise-ids.tsv must match the DB, so a new exercise can't
 *      slip past this audit by being left out of the list.
 *
 *   2. Every group in MUSCLE_GROUPS is reachable — it appears as `primary` on
 *      at least one exercise. A group nothing can train is a dead tile in the
 *      UI and an unearnable badge. Writing this check FIRST is what would have
 *      caught the five phantom groups (neck, calves, adductors, traps, rear
 *      delts) that an imported taxonomy brought in. Stage 3 (plan D1) brought
 *      those five back with three more, each with a coverage slot that trains
 *      it, so there is no `assist` exemption any more: a group with no primary
 *      fails, unless it is listed in PENDING_PRIMARY below.
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

// muscles.data.js and training.data.js are plain IIFEs that write to `window`.
// The DB lives in basalt.js blocks 2 and 7 (the same trick check-training-data.js
// uses); the other blocks need a real DOM, so they are skipped.
const sandbox = { window: {}, console, document: { readyState: "complete", addEventListener() {} } };
sandbox.window.App = { util: { escapeHtml: (s) => s }, registerView() {} };
vm.createContext(sandbox);
const basaltSrc = fs.readFileSync(path.join(root, "fitness/basalt.js"), "utf8");
for (const part of basaltSrc.split(/(?=\/\* ===== BASALT script block \d)/)) {
  if (/^\/\* ===== BASALT script block (2|7) /.test(part)) vm.runInContext(part, sandbox);
}
for (const f of ["fitness/muscles.data.js", "fitness/phases.data.js", "fitness/training.data.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), sandbox, { filename: f });
}
const DBIDS = Object.keys(sandbox.window.EXERCISE_DB);
const TD = sandbox.window.TRAINING_DATA;

const GROUPS = sandbox.window.MUSCLE_GROUPS;
const MAP = sandbox.window.MUSCLE_MAP;
const FALLBACK = sandbox.window.MUSCLE_FALLBACK;

let failed = false;
const fail = (msg) => { failed = true; console.error("  ✗ " + msg); };
const ok = (msg) => console.log("  ✓ " + msg);

const groupKeys = new Set(GROUPS.map((g) => g.key));

/* Plan D1: the 22 groups, in the plan's words. A group added or dropped
   without changing this list (and the plan) is a decision nobody made. */
const PLAN_D1_GROUPS = [
  "chest", "delts_front", "delts_side", "upper_back", "lats", "triceps", "biceps",
  "forearms", "abs", "obliques", "lower_back", "glutes", "quads", "hamstrings",
  "delts_rear", "traps", "rotator_cuff", "neck", "abductors", "adductors", "calves", "shins"
];

/* Groups still waiting for a coverage slot. Step 3.2 wrote the last eight
   (quads, hamstrings, obliques, lower back, adductors, abductors, calves,
   shins), so every group has a primary movement and this list is empty. The
   machinery stays: a listed group fails the moment a coverage slot trains it,
   so an entry can't go stale. */
const PENDING_PRIMARY = [];

console.log(`\nmuscle map audit — ${ids.length} exercises, ${GROUPS.length} groups\n`);

/* -- 0. the taxonomy is the plan's, and the id list is the DB's ------------ */
{
  const want = new Set(PLAN_D1_GROUPS);
  const extra = [...groupKeys].filter((k) => !want.has(k));
  const absent = PLAN_D1_GROUPS.filter((k) => !groupKeys.has(k));
  extra.forEach((k) => fail(`group "${k}" is not in plan D1's 22`));
  absent.forEach((k) => fail(`plan D1 group "${k}" is missing from MUSCLE_GROUPS`));
  if (GROUPS.length !== groupKeys.size) fail("duplicate group key in MUSCLE_GROUPS");
  GROUPS.filter((g) => g.assist).forEach((g) => fail(`group "${g.key}" is still flagged assist:true; plan D1 removes the flag`));
  GROUPS.filter((g) => g.region !== "front" && g.region !== "back").forEach((g) => fail(`group "${g.key}": region "${g.region}"`));
  if (!extra.length && !absent.length) ok(`the ${GROUPS.length} groups are plan D1's, none flagged assist`);

  const tsv = new Set(ids.map((e) => e.id)), db = new Set(DBIDS);
  const notInTsv = DBIDS.filter((id) => !tsv.has(id)), notInDb = [...tsv].filter((id) => !db.has(id));
  notInTsv.forEach((id) => fail(`${id} is in EXERCISE_DB but not in tools/exercise-ids.tsv`));
  notInDb.forEach((id) => fail(`${id} is in tools/exercise-ids.tsv but not in EXERCISE_DB`));
  if (!notInTsv.length && !notInDb.length) ok(`tools/exercise-ids.tsv lists exactly the ${DBIDS.length} ids in EXERCISE_DB`);
}

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
   not enough — that is a dead tile wearing a number. */
const pending = new Set(PENDING_PRIMARY);
const dead = [...groupKeys].filter((k) => primaryCount[k] === 0 && !pending.has(k));
if (dead.length) {
  dead.forEach((k) => fail(`group "${k}" is never a primary target, so it can never level up honestly`));
} else {
  ok(`every group is the primary target of at least one exercise, except the pending ones (${pending.size} awaiting step 3.2's slots)`);
}

const unreachable = [...groupKeys].filter((k) => secondaryCount[k] === 0 && primaryCount[k] === 0 && !pending.has(k));
if (unreachable.length) {
  unreachable.forEach((k) =>
    fail(`group "${k}" only ever appears as a stabiliser (0.15 share) — it cannot realistically level`)
  );
} else {
  ok("every group accrues at primary or secondary rate somewhere");
}

// the pending list can't go stale: a listed group that is already served must come off it
const coverSlots = Object.entries(TD.SLOTS).filter(([, sl]) => sl.coverage);
const slotFor = (k) => coverSlots.filter(([, sl]) => (sl.trains || []).includes(k)).map(([key]) => key);
for (const k of pending) {
  if (!groupKeys.has(k)) fail(`PENDING_PRIMARY names "${k}", which is not a group`);
  else if (slotFor(k).length)
    fail(`"${k}" is in PENDING_PRIMARY but coverage slot [${slotFor(k)}] already trains it — delete it from the list`);
}
if (pending.size) {
  console.log("\n  PENDING (step 3.2 writes their slots; this list must be empty then): " + [...pending].join(", "));
}

/* Plan D1 + D3: every group has a weekly floor of direct (primary) sets, and
   says who tops it up. `main` groups only ever train through the main slots, so
   every template has to clear them. `coverage` groups are topped up by a
   coverage slot, so each needs a slot that names it in `trains`, and every
   exercise of that slot has to count as direct work for it. */
const FLOORS = sandbox.window.MUSCLE_FLOORS;
if (!FLOORS) fail("fitness/muscles.data.js has no MUSCLE_FLOORS");
else {
  const bad = [];
  for (const k of groupKeys) {
    const f = FLOORS[k];
    if (!f) { bad.push(`${k}: no floor`); continue; }
    if (!(Number.isInteger(f.sets) && f.sets > 0)) bad.push(`${k}: sets ${f.sets}`);
    if (f.via !== "main" && f.via !== "coverage") bad.push(`${k}: via "${f.via}"`);
    if (f.via === "coverage" && !pending.has(k) && !slotFor(k).length) bad.push(`${k}: a coverage group with no coverage slot that trains it`);
    if (f.via === "main" && slotFor(k).length) bad.push(`${k}: a main group, but coverage slot ${slotFor(k)} trains it`);
  }
  Object.keys(FLOORS).filter((k) => !groupKeys.has(k)).forEach((k) => bad.push(`${k}: a floor for a group that doesn't exist`));
  for (const [key, sl] of coverSlots) {
    const trains = sl.trains || [];
    /* A conditioning slot tops up no muscle (plan A5): it is pinned-only, so it
       has no group to be primary for. It must say so with `trains: []`, and its
       members are still mapped to the muscles they work (check 5 below). */
    if (sl.conditioning) {
      if (trains.length) bad.push(`slot ${key}: conditioning slots train no group, but trains is [${trains}]`);
    } else if (!trains.length) bad.push(`slot ${key}: coverage slot with no \`trains\``);
    trains.forEach((g) => { if (!groupKeys.has(g)) bad.push(`slot ${key}: trains unknown group "${g}"`); });
    const members = Object.entries(TD.EXERCISES).filter(([, e]) => e.slot === key).map(([id]) => id);
    for (const id of members)
      for (const g of trains)
        if (!(MAP[id] && MAP[id].primary.includes(g))) bad.push(`${id}: in slot ${key} but ${g} is not a primary there, so its sets would not count as direct ${g} work`);
    const free = (id) => [].concat(...TD.EXERCISES[id].equipment).length === 0;
    if (!sl.first.some(free)) bad.push(`slot ${key}: no equipment-free first rung`);
  }
  bad.forEach(fail);
  if (!bad.length) {
    const by = (v) => Object.values(FLOORS).filter((f) => f.via === v).length;
    ok(`${groupKeys.size} floors (${by("main")} main, ${by("coverage")} coverage); ${coverSlots.length} coverage slots each train a group they are primary for`);
  }
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
  /* Only the groups the main slots train have to clear the template: a
     coverage group has no template target, because its floor is what measures
     it (plan F7: a target built from the template's own slots is circular). */
  const mainGroups = [...groupKeys].filter((k) => FLOORS && FLOORS[k] && FLOORS[k].via === "main");
  const untrained = mainGroups.filter((k) => !(measured[id][k] > 0));
  if (untrained.length) {
    untrained.forEach((k) => fail(`${id}: ${tpl.label} never trains ${k}, so its target would be 0`));
  } else {
    ok(`${pad(id, 11)} ${tpl.perWeek}/wk over ${tpl.order.join(" + ")} — all ${mainGroups.length} main groups trained`);
  }
});
console.log("\n  " + pad("group", 18) + templateIds.map((id) => pad(id, 12)).join(""));
GROUPS.forEach((g) =>
  console.log("  " + pad(g.label, 18) + templateIds.map((id) => pad(measured[id][g.key], 12)).join(""))
);
console.log("");

console.log(failed ? "\nFAILED\n" : "\nOK\n");
process.exit(failed ? 1 : 0);
