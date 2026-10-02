#!/usr/bin/env node
/**
 * Audits fitness/training.data.js against the exercise library.
 *
 *   node tools/check-training-data.js
 *
 * The catalogue is hand-entered against fixed tables, so this is what catches a
 * typo, and it checks each fact against the place it came from:
 *
 *   1. Every exercise in EXERCISE_DB has exactly one catalogue entry, and the
 *      catalogue invents no ids.
 *   2. Every `next` and `offer` resolves, `next` never leaves its branch, and
 *      no chain loops.
 *   3. Every slot can be walked: its entry points resolve, every main exercise
 *      is reachable from them (or listed as a loaded option), and each slot
 *      has an equipment-free exercise or an explicit `none`.
 *   4. Equipment tokens, and hold-vs-reps, match EXERCISE_DB; hold ranges match
 *      engine.HOLD_ADVANCE_AT / holdStart in basalt.js.
 *   5. Every pain substitution key is a real SUBSTITUTIONS name and every id
 *      it maps to exists.
 *   6. The two Stage 2 movements have a DB entry, a muscle map row and a phase
 *      entry, and every phase entry is well formed.
 *
 * Reads the DB by running basalt.js's two data blocks in a sandbox. Exits
 * non-zero on any failure, so it can gate a commit.
 */

"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

/* -- load: the DB lives in basalt.js blocks 2 and 7; the rest are IIFEs
      that write to `window`. Blocks 3-6 and 8 need a real DOM, so skip them. */
const sandbox = { window: {}, console, document: { readyState: "complete", addEventListener() {} } };
sandbox.window.App = { util: { escapeHtml: (s) => s }, registerView() {} };
vm.createContext(sandbox);
const basalt = read("fitness/basalt.js");
for (const part of basalt.split(/(?=\/\* ===== BASALT script block \d)/)) {
  if (/^\/\* ===== BASALT script block (2|7) /.test(part)) vm.runInContext(part, sandbox);
}
for (const f of ["fitness/muscles.data.js", "fitness/phases.data.js", "fitness/training.data.js"]) {
  vm.runInContext(read(f), sandbox, { filename: f });
}
const W = sandbox.window;
const DB = W.EXERCISE_DB, TD = W.TRAINING_DATA;
const EX = TD.EXERCISES, SLOTS = TD.SLOTS;

let failed = false;
const fail = (msg) => { failed = true; console.error("  ✗ " + msg); };
const ok = (msg) => console.log("  ✓ " + msg);
const section = (t) => console.log("\n" + t);
const flat = (eq) => [].concat(...eq.map((t) => (Array.isArray(t) ? t : [t])));
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

console.log(`\ntraining data audit — ${Object.keys(DB).length} exercises, ${Object.keys(SLOTS).length} slots\n`);

/* -- 1. ids -------------------------------------------------------------- */
section("ids");
{
  const missing = Object.keys(DB).filter((id) => !EX[id]);
  const orphan = Object.keys(EX).filter((id) => !DB[id]);
  missing.forEach((id) => fail(`no catalogue entry: ${id} (${DB[id].name})`));
  orphan.forEach((id) => fail(`catalogue entry for unknown exercise: ${id}`));
  if (!missing.length && !orphan.length) ok(`all ${Object.keys(DB).length} exercises have exactly one entry`);

  const SLOT_KEYS = new Set(Object.keys(SLOTS));
  const KINDS = new Set(["reps", "loaded", "unilateral", "eccentric", "hold", "skill"]);
  const bad = [];
  for (const [id, e] of Object.entries(EX)) {
    if (!SLOT_KEYS.has(e.slot)) bad.push(`${id}: slot "${e.slot}"`);
    if (e.branch !== "main" && e.branch !== "skill") bad.push(`${id}: branch "${e.branch}"`);
    if (!KINDS.has(e.kind)) bad.push(`${id}: kind "${e.kind}"`);
  }
  bad.forEach(fail);
  if (!bad.length) ok("every slot, branch and kind is a known value");
}

/* -- 2. next / offer ------------------------------------------------------ */
section("next and offer");
{
  const bad = [];
  for (const [id, e] of Object.entries(EX)) {
    for (const n of e.next) {
      const t = EX[n];
      if (!t) bad.push(`${id}.next → "${n}" does not exist`);
      else if (t.branch !== e.branch) bad.push(`${id}.next → ${n} leaves the ${e.branch} branch`);
      else if (t.slot !== e.slot) bad.push(`${id}.next → ${n} is in slot ${t.slot}, not ${e.slot}`);
    }
    for (const n of e.offer) {
      const t = EX[n];
      if (!t) bad.push(`${id}.offer → "${n}" does not exist`);
      else if (t.branch !== "skill") bad.push(`${id}.offer → ${n} is not on the skill branch`);
      else if (t.slot !== e.slot) bad.push(`${id}.offer → ${n} is in slot ${t.slot}, not ${e.slot}`);
    }
    if (e.branch === "skill" && e.offer.length) bad.push(`${id}: only main exercises offer`);
  }
  bad.forEach(fail);
  if (!bad.length) ok("every next and offer resolves and stays in its slot and branch");

  const loops = [];
  const walk = (id, seen) => {
    if (seen.includes(id)) { loops.push([...seen, id].join(" → ")); return; }
    EX[id].next.forEach((n) => EX[n] && walk(n, [...seen, id]));
  };
  Object.keys(EX).forEach((id) => walk(id, []));
  loops.forEach((l) => fail(`loop: ${l}`));
  if (!loops.length) ok("no chain loops");
}

/* -- 3. slots ------------------------------------------------------------- */
section("slots");
{
  for (const [key, s] of Object.entries(SLOTS)) {
    const reach = new Set();
    const go = (id) => { if (reach.has(id) || !EX[id]) return; reach.add(id); EX[id].next.forEach(go); };
    let broken = false;
    s.first.forEach((id) => {
      const e = EX[id];
      if (!e) { fail(`${key}: first "${id}" does not exist`); broken = true; }
      else if (e.slot !== key || e.branch !== "main") { fail(`${key}: first ${id} is not a main exercise of the slot`); broken = true; }
      else go(id);
    });
    s.loaded.forEach((id) => {
      const e = EX[id];
      if (!e || e.slot !== key || e.kind !== "loaded" || e.branch !== "main") { fail(`${key}: loaded "${id}" is not a main loaded exercise of the slot`); broken = true; }
    });
    const stray = Object.keys(EX).filter((id) =>
      EX[id].slot === key && EX[id].branch === "main" && !reach.has(id) && !s.loaded.includes(id));
    stray.forEach((id) => { fail(`${key}: main exercise ${id} is unreachable from first and not listed as loaded`); broken = true; });
    const loadedUnlisted = Object.keys(EX).filter((id) =>
      EX[id].slot === key && EX[id].branch === "main" && EX[id].kind === "loaded" && !s.loaded.includes(id));
    loadedUnlisted.forEach((id) => { fail(`${key}: ${id} is loaded but not in the slot's loaded list`); broken = true; });

    const free = [...reach].filter((id) => flat(EX[id].equipment).length === 0);
    if (!s.none && !free.length) { fail(`${key}: no equipment-free exercise on the main path and no explicit "none"`); broken = true; }
    if (s.none && free.length) { fail(`${key}: says "none" but ${free.join(", ")} needs no equipment`); broken = true; }
    if (!s.none && !s.first.some((id) => EX[id] && flat(EX[id].equipment).length === 0)) {
      fail(`${key}: no entry point is equipment-free`); broken = true;
    }
    if (!broken) ok(`${key}: ${reach.size} on the path, ${s.loaded.length} loaded, ` +
      (s.none ? "no equipment-free option (stated)" : `${free.length} need no equipment`));
  }
}

/* -- 4. equipment, units, ranges ------------------------------------------ */
section("equipment, units and ranges");
{
  const TOKENS = new Set(["pullupBar", "dumbbells", "bench", "kettlebells", "rings"]);
  const bad = [];
  for (const [id, e] of Object.entries(EX)) {
    const d = DB[id];
    if (!d) continue;
    const tokens = flat(e.equipment);
    tokens.forEach((t) => { if (!TOKENS.has(t)) bad.push(`${id}: unknown equipment token "${t}"`); });
    if (!same(tokens, d.equipment || [])) bad.push(`${id}: equipment ${JSON.stringify(e.equipment)} ≠ DB ${JSON.stringify(d.equipment)}`);
    const timed = e.kind === "hold" || e.kind === "skill";
    if (timed !== (d.mode === "hold")) bad.push(`${id}: kind ${e.kind} but DB mode "${d.mode}"`);
    if (e.kind === "loaded") {
      if (e.loadMode !== "perHand" && e.loadMode !== "total") bad.push(`${id}: loaded needs loadMode perHand|total`);
      if (!tokens.some((t) => TD.LOAD_STEP_KG[t])) bad.push(`${id}: loaded but no implement with a load step`);
    } else if (e.loadMode) bad.push(`${id}: loadMode on a ${e.kind} exercise`);
    if (e.perSide && e.kind !== "loaded") bad.push(`${id}: perSide is only for loaded; unilateral implies it`);
    const r = TD.rangeFor(id);
    if (!r) bad.push(`${id}: rangeFor returned null`);
    else if (r.kind !== "skill" && !(r.lo > 0 && r.lo < r.hi)) bad.push(`${id}: range ${r.lo}–${r.hi}`);
    else if (r.kind === "skill" && r.hi !== null && !(r.hi > 0)) bad.push(`${id}: skill standard ${r.hi}`);
  }
  bad.forEach(fail);
  if (!bad.length) ok("equipment, hold-vs-reps, loaded fields and every range check out against EXERCISE_DB");

  // hold ranges: exactly the hold exercises, and the engine's numbers
  const holds = Object.keys(EX).filter((id) => EX[id].kind === "hold");
  const hr = Object.keys(TD.HOLD_RANGES);
  const diff = holds.filter((i) => !hr.includes(i)).concat(hr.filter((i) => !holds.includes(i)));
  diff.forEach((id) => fail(`HOLD_RANGES and hold exercises disagree on ${id}`));
  const m = basalt.match(/var HOLD_ADVANCE_AT = (\{[\s\S]*?\});/);
  if (!m) fail("could not find HOLD_ADVANCE_AT in basalt.js");
  else {
    const eng = vm.runInNewContext("(" + m[1] + ")");
    // engine.holdStart(): half the advance point, to the nearest 5 s, at least 10 s
    const start = (cap) => Math.max(10, Math.round((cap * 0.5) / 5) * 5);
    let drift = 0;
    for (const [id, cap] of Object.entries(eng)) {
      const h = TD.HOLD_RANGES[id];
      if (!h || h[1] !== cap || h[0] !== start(cap)) {
        drift++; fail(`${id}: engine says ${start(cap)}–${cap}, HOLD_RANGES says ${h ? h.join("–") : "nothing"}`);
      }
    }
    if (!drift && !diff.length) ok(`${Object.keys(eng).length} hold ranges match engine.HOLD_ADVANCE_AT and holdStart`);
  }

  const skills = Object.keys(EX).filter((id) => EX[id].kind === "skill");
  const sk = Object.keys(TD.SKILL_STANDARD_SEC);
  const sd = skills.filter((i) => !sk.includes(i)).concat(sk.filter((i) => !skills.includes(i)));
  sd.forEach((id) => fail(`SKILL_STANDARD_SEC and skill exercises disagree on ${id}`));
  if (!sd.length) ok(`${skills.length} skills each have a standard entry (` +
    `${skills.filter((i) => TD.SKILL_STANDARD_SEC[i] === null).length} with none)`);
}

/* -- 5. setups ------------------------------------------------------------ */
section("setups");
{
  const bad = [];
  for (const [id, s] of Object.entries(TD.SETUPS)) {
    if (!EX[id]) bad.push(`${id}: no such exercise`);
    if (!["surface", "bodyAngle", "band"].includes(s.key)) bad.push(`${id}: setup key "${s.key}"`);
    if (s.values.length < 2) bad.push(`${id}: a setup needs at least two values`);
    if (new Set(s.values.map((v) => v.id)).size !== s.values.length) bad.push(`${id}: duplicate setup ids`);
  }
  const cm = (TD.SETUPS.push_incline || { values: [] }).values.map((v) => v.cm);
  if (!cm.every((v, i) => i === 0 || v < cm[i - 1])) bad.push("push_incline: surfaces must get lower, easiest first");
  bad.forEach(fail);
  if (!bad.length) ok(`${Object.keys(TD.SETUPS).length} setups, each with 2+ ordered values`);
}

/* -- 6. pain substitutions ------------------------------------------------ */
section("pain substitutions");
{
  const names = new Set();
  for (const p of Object.values(W.SUBSTITUTIONS))
    for (const b of Object.values(p))
      for (const s of Object.values(b)) { names.add(s.era1.name); names.add(s.era2.name); }
  const bad = [];
  for (const [name, id] of Object.entries(TD.SUBSTITUTION_IDS)) {
    if (!names.has(name)) bad.push(`"${name}" is not a substitution name`);
    if (!EX[id]) bad.push(`"${name}" → ${id} does not exist`);
  }
  bad.forEach(fail);
  const skip = (n) => /^Skip /.test(n);
  const unmapped = [...names].filter((n) => !skip(n) && !(n in TD.SUBSTITUTION_IDS));
  if (!bad.length) ok(`${Object.keys(TD.SUBSTITUTION_IDS).length} names map to real ids; ` +
    `${unmapped.length} of ${[...names].filter((n) => !skip(n)).length} keep the original exercise`);
}

/* -- 7. the two new movements, and every phase entry ---------------------- */
section("Stage 2 movements and phases");
{
  const bad = [];
  for (const id of ["push_incline", "squat_split"]) {
    if (!DB[id]) bad.push(`${id}: not in EXERCISE_DB`);
    if (!W.MUSCLE_MAP[id]) bad.push(`${id}: not in MUSCLE_MAP`);
    if (!W.PHASE_MAP[id]) bad.push(`${id}: not in PHASE_MAP`);
    const d = DB[id] || {};
    if (!(d.cues || []).length || !(d.mistakes || []).length || !d.injury || !d.readiness) bad.push(`${id}: DB entry is missing cues, mistakes, readiness or injury`);
  }
  const groups = new Set(W.MUSCLE_GROUPS.map((g) => g.key));
  for (const [id, p] of Object.entries(W.PHASE_MAP)) {
    if (!DB[id]) bad.push(`PHASE_MAP: unknown exercise ${id}`);
    for (const [g, arr] of Object.entries(p.muscles)) {
      if (!groups.has(g)) bad.push(`PHASE_MAP ${id}: "${g}" is not a muscle group`);
      if (arr.length !== p.phases.length) bad.push(`PHASE_MAP ${id}.${g}: ${arr.length} values for ${p.phases.length} phases`);
      if (arr.some((v) => !(v >= 0 && v <= 1))) bad.push(`PHASE_MAP ${id}.${g}: a value outside 0–1`);
    }
  }
  bad.forEach(fail);
  if (!bad.length) ok(`push_incline and squat_split are complete; ${Object.keys(W.PHASE_MAP).length} phase entries well formed`);
}

console.log(failed ? "\nFAILED\n" : "\nOK\n");
process.exit(failed ? 1 : 0);
