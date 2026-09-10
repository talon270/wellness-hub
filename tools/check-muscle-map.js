#!/usr/bin/env node
/**
 * Audits fitness/muscles.data.js against the exercise library.
 *
 *   node tools/check-muscle-map.js
 *
 * Two assertions, and the second one is the important one:
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
  total: anyCount[g.key],
  target: g.weeklyTarget
})).sort((a, b) => b.total - a.total);
const pad = (s, n) => String(s).padEnd(n);
console.log("  " + pad("group", 18) + pad("primary", 9) + pad("any", 6) + "weekly target");
rows.forEach((r) =>
  console.log("  " + pad(r.group, 18) + pad(r.primary, 9) + pad(r.total, 6) + r.target)
);

/* -- --targets: compute the weekly volume the default program delivers ----
   This is what makes `weeklyTarget` a measurement rather than a guess. The
   model is the app's own defaults, read straight out of fitness/basalt.js:
     DAY_PATTERNS  the 4-day rotation (one push/pull/legs/fullbody per week)
     BASE_REPS     steady-state rep targets per pattern
     TARGET_SETS   3
   Holds convert at 5s = 1 unit, matching engine.sessionVolume.

   Profiles come from MUSCLE_FALLBACK, not from a specific exercise, because a
   target describes what "a push day" trains — it should not move when the user
   climbs from Wall Push-up to Archer Push-up. */
if (process.argv.includes("--targets")) {
  const DAY_PATTERNS = {
    push: ["push", "shoulder", "dip", "core"],
    pull: ["pull", "hinge", "core"],
    legs: ["squat", "hinge", "core"],
    fullbody: ["push", "pull", "squat", "core"]
  };
  const BASE_REPS = { push: 12, pull: 8, squat: 14, hinge: 14, core: 30, shoulder: 8, dip: 8 };
  const HOLD_PATTERNS = new Set(["core"]);
  const TARGET_SETS = 3;
  const SHARE = { primary: 1.0, secondary: 0.4, stabiliser: 0.15 };

  const perWeek = {};
  Object.values(DAY_PATTERNS).forEach((pats) =>
    pats.forEach((p) => { perWeek[p] = (perWeek[p] || 0) + 1; })
  );

  const work = {};
  groupKeys.forEach((k) => { work[k] = 0; });
  Object.entries(perWeek).forEach(([pattern, times]) => {
    const reps = BASE_REPS[pattern];
    const unitsPerSet = HOLD_PATTERNS.has(pattern) ? Math.round(reps / 5) : reps;
    const units = unitsPerSet * TARGET_SETS * times;
    const prof = FALLBACK[pattern];
    if (!prof) return;
    for (const tier of ["primary", "secondary", "stabiliser"]) {
      (prof[tier] || []).forEach((k) => {
        if (k in work) work[k] += units * SHARE[tier];
      });
    }
  });

  console.log("measured weekly targets (default 4-day rotation, 3 sets, steady-state BASE_REPS):\n");
  GROUPS.forEach((g) => {
    const measured = Math.round(work[g.key]);
    const flag = measured === g.weeklyTarget ? "" : `   <-- data file says ${g.weeklyTarget}`;
    console.log(`    { key: "${g.key}", weeklyTarget: ${measured} }${flag}`);
  });
  console.log("");
}

console.log(failed ? "\nFAILED\n" : "\nOK\n");
process.exit(failed ? 1 : 0);
