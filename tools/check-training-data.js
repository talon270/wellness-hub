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
 *   7. The nine equipment tokens, and the exercises plan C5 moved onto the four
 *      new ones (bands, parallettes, dipBars, lowBar), exactly as written.
 *   8. Grips: the capable exercises exist, are push-ups, and carry no setup
 *      that would clash with a grip; the pain swaps that name a grip.
 *   9. Joint stress: every exercise has an entry, every joint is reachable,
 *      and every score is 1 or 2 on a known joint.
 *  10. Coverage slots (plan D2, Stage 3): each slot has the plan's number of
 *      exercises, all `accessory` in the DB with cues, mistakes and an injury
 *      line; the coverage rep ranges ignore your goal; band moves have a
 *      tension setup; the neck carries its safety copy. A slot the plan
 *      lists for a later step is reported as pending, not skipped silently.
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
const TOKENS = new Set(["pullupBar", "dumbbells", "bench", "kettlebells", "rings",
  "bands", "parallettes", "dipBars", "lowBar"]);
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
  const bad = [];
  for (const [id, e] of Object.entries(EX)) {
    const d = DB[id];
    if (!d) continue;
    const tokens = flat(e.equipment);
    tokens.forEach((t) => { if (!TOKENS.has(t)) bad.push(`${id}: unknown equipment token "${t}"`); });
    if (!same(tokens, d.equipment || [])) bad.push(`${id}: equipment ${JSON.stringify(e.equipment)} ≠ DB ${JSON.stringify(d.equipment)}`);
    const timed = e.kind === "hold" || e.kind === "skill";
    if (timed !== (d.mode === "hold")) bad.push(`${id}: kind ${e.kind} but DB mode "${d.mode}"`);
    /* A hold can be loaded too (a farmer hold: seconds at a weight). Training
       reads loadMode on any kind, and K-hold in check-training.js runs one. */
    if (e.kind === "loaded" || (e.kind === "hold" && e.loadMode)) {
      if (e.loadMode !== "perHand" && e.loadMode !== "total") bad.push(`${id}: ${e.kind} with a load needs loadMode perHand|total`);
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
    if (!["surface", "bodyAngle", "band", "lean"].includes(s.key)) bad.push(`${id}: setup key "${s.key}"`);
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

/* -- 8. the equipment split (plan C5) -------------------------------------- */
section("equipment tokens");
{
  // Plan C5, verbatim. An array entry is any-of.
  const C5 = {
    pull_alt_bandassist: ["pullupBar", "bands"],
    dip_2: ["lowBar"], dip_4: ["lowBar"], dip_3: ["dipBars"],
    dip_6: ["dipBars", ["dumbbells", "kettlebells"]],
    pull_alt_australian: [["lowBar", "rings"]],
    skill_frontlever_1: [["pullupBar", "rings"]], skill_frontlever_2: [["pullupBar", "rings"]],
    skill_frontlever_3: [["pullupBar", "rings"]], skill_frontlever_4: [["pullupBar", "rings"]],
    core_3: [["bench", "parallettes"]], core_4: [["bench", "parallettes"]],
    skill_lsit_1: [["bench", "parallettes"]], skill_lsit_2: [["bench", "parallettes"]],
    skill_lsit_3: [["bench", "parallettes"]], skill_vsit: [["bench", "parallettes"]]
  };
  const bad = [];
  for (const [id, want] of Object.entries(C5))
    if (JSON.stringify(EX[id].equipment) !== JSON.stringify(want))
      bad.push(`${id}: ${JSON.stringify(EX[id].equipment)}, plan C5 says ${JSON.stringify(want)}`);
  // every new token is used, and the old catch-all is only used by real bars
  for (const t of ["bands", "parallettes", "dipBars", "lowBar"])
    if (!Object.values(EX).some((e) => flat(e.equipment).includes(t))) bad.push(`token ${t} is used by no exercise`);
  // EQUIP_LABEL lives in a UI block the sandbox doesn't run, so read its keys from the text.
  const lm = basalt.match(/var EQUIP_LABEL = (\{[\s\S]*?\});/);
  const labels = lm ? vm.runInNewContext("(" + lm[1] + ")") : {};
  if (!lm) bad.push("could not find EQUIP_LABEL in basalt.js");
  for (const t of TOKENS) if (!labels[t]) bad.push(`EQUIP_LABEL has no label for ${t}`);
  bad.forEach(fail);
  if (!bad.length) ok(`${Object.keys(C5).length} exercises carry plan C5's tokens; all ${TOKENS.size} tokens are used and labelled`);
}

/* -- 9. grips --------------------------------------------------------------- */
section("grips");
{
  const G = TD.GRIPS, bad = [];
  const ids = G.values.map((v) => v.id);
  if (ids.join() !== "palms,knuckles") bad.push(`grip values ${ids.join()}, expected palms,knuckles in that order`);
  if (new Set(G.exercises).size !== G.exercises.length) bad.push("duplicate grip exercise");
  for (const id of G.exercises) {
    const e = EX[id];
    if (!e) { bad.push(`${id}: no such exercise`); continue; }
    if (e.slot !== "push") bad.push(`${id}: a grip is for the push slot, not ${e.slot}`);
    if (e.kind !== "reps" && e.kind !== "eccentric") bad.push(`${id}: kind ${e.kind} can't take a grip`);
    if (flat(e.equipment).some((t) => t !== "bench")) bad.push(`${id}: needs ${flat(e.equipment).join(", ")}, but a grip is a floor push-up`);
    if (SETUPS_HAS(id, "grip")) bad.push(`${id}: setup already uses the key grip`);
  }
  // the ones the plan keeps on palms
  for (const id of ["push_3", "push_5", "push_6"]) if (G.exercises.includes(id)) bad.push(`${id} must stay on palms`);
  // only knuckles relieve a joint, and only by a whole point on a known joint
  for (const v of G.values) for (const [j, n] of Object.entries(v.relief || {}))
    if (!TD.JOINTS.includes(j) || n !== 1) bad.push(`grip ${v.id}: relief ${j}:${n}`);
  if (G.values[0].relief) bad.push("palms is the baseline and relieves nothing");
  // pain swaps that are a grip
  const names = new Set();
  for (const p of Object.values(W.SUBSTITUTIONS)) for (const b of Object.values(p)) for (const s of Object.values(b)) { names.add(s.era1.name); names.add(s.era2.name); }
  for (const [name, setup] of Object.entries(TD.SUBSTITUTION_SETUPS)) {
    if (!names.has(name)) bad.push(`SUBSTITUTION_SETUPS "${name}" is not a substitution name`);
    if (name in TD.SUBSTITUTION_IDS) bad.push(`"${name}" is in both SUBSTITUTION_IDS and SUBSTITUTION_SETUPS`);
    if (!ids.includes(setup.grip)) bad.push(`"${name}": grip "${setup.grip}"`);
    if (Object.keys(setup).length !== 1) bad.push(`"${name}": a substitution setup carries only a grip`);
  }
  for (const n of ["Fist Push-up", "Knuckle/Parallette Push-up"])
    if (!TD.SUBSTITUTION_SETUPS[n]) bad.push(`F4: "${n}" must map to a knuckles grip`);
  bad.forEach(fail);
  if (!bad.length) ok(`${G.exercises.length} push-ups take a grip; ${Object.keys(TD.SUBSTITUTION_SETUPS).length} pain swaps now name one`);
  function SETUPS_HAS(id, key) { return TD.SETUPS[id] && TD.SETUPS[id].key === key; }
}

/* -- 10. joint stress ------------------------------------------------------- */
section("joint stress");
{
  const J = TD.JOINT_STRESS, bad = [];
  const joints = TD.JOINTS;
  if (joints.join() !== "wrist,elbow,shoulder,neck,lowerBack,hip,knee,ankle") bad.push(`JOINTS is ${joints.join()}`);
  for (const id of Object.keys(EX)) if (!J[id]) bad.push(`${id} (${DB[id].name}): no joint-stress entry`);
  for (const id of Object.keys(J)) if (!EX[id]) bad.push(`joint-stress entry for unknown exercise ${id}`);
  const used = new Set();
  for (const [id, row] of Object.entries(J)) {
    const keys = Object.keys(row);
    if (!keys.length) bad.push(`${id}: empty entry (every exercise loads some joint)`);
    for (const [j, n] of Object.entries(row)) {
      if (!joints.includes(j)) bad.push(`${id}: unknown joint "${j}"`);
      else used.add(j);
      if (n !== 1 && n !== 2) bad.push(`${id}.${j}: score ${n} (only 1 or 2; omit zeros)`);
    }
  }
  joints.filter((j) => !used.has(j)).forEach((j) => bad.push(`no exercise loads ${j}: a limitation on it would filter nothing`));
  // sanity ordering the rubric implies, so a typo can't invert it
  const order = [["push_1", "push_2", "wrist"], ["push_incline", "push_2", "wrist"], ["push_2", "push_3", "elbow"],
    ["squat_1", "squat_5", "ankle"], ["pull_alt_bandassist", "pull_4", "shoulder"], ["pull_2", "pull_3", "elbow"]];
  for (const [lo, hi, j] of order)
    if (!((J[lo][j] || 0) <= (J[hi][j] || 0))) bad.push(`${lo} loads ${j} more than ${hi}`);
  // a grip that relieves a joint has to be one the capable exercises load
  for (const id of TD.GRIPS.exercises)
    if (!J[id].wrist) bad.push(`${id}: takes a knuckles grip but loads no wrist`);
  bad.forEach(fail);
  const twos = Object.values(J).reduce((n, r) => n + Object.values(r).filter((v) => v === 2).length, 0);
  const all = Object.values(J).reduce((n, r) => n + Object.keys(r).length, 0);
  if (!bad.length) ok(`${Object.keys(J).length} exercises scored on ${joints.length} joints (${all} scores, ${twos} of them 2)`);
}

/* -- 11. coverage slots (plan D2) ------------------------------------------- */
section("coverage slots");
{
  /* Plan D2's table, counted: how many exercises each coverage slot holds. The
     first seven are step 3.1, the other eight step 3.2, so all fifteen must
     exist now and the 64 total is checked. */
  const PLAN_D2 = {
    curl: 5, lateral: 4, reardelt: 5, cuff: 4, traps: 3, neck: 3, grip: 5,
    quad: 6, hamstring: 5, calf: 4, shin: 2, adductor: 4, abductor: 4, antirot: 6, backext: 4
  };
  const STEP_3_1 = ["curl", "lateral", "reardelt", "cuff", "traps", "neck", "grip"];
  const STEP_3_2 = ["quad", "hamstring", "calf", "shin", "adductor", "abductor", "antirot", "backext"];
  const MUST_EXIST = STEP_3_1.concat(STEP_3_2);
  const LIGHT = ["cuff", "neck", "shin"];              // 12–20 reps, the rest 10–15
  const bad = [];
  const covSlots = Object.entries(SLOTS).filter(([, s]) => s.coverage).map(([k]) => k);
  const present = covSlots.filter((k) => k in PLAN_D2);
  MUST_EXIST.filter((k) => !covSlots.includes(k)).forEach((k) => bad.push(`coverage slot "${k}" (step ${STEP_3_1.includes(k) ? "3.1" : "3.2"}) doesn't exist`));
  covSlots.filter((k) => !(k in PLAN_D2)).forEach((k) => bad.push(`coverage slot "${k}" is not in plan D2`));
  Object.keys(SLOTS).filter((k) => k in PLAN_D2 && !SLOTS[k].coverage).forEach((k) => bad.push(`slot "${k}" is a plan D2 slot but isn't marked coverage: true`));

  let total = 0;
  for (const slot of present) {
    const ids = Object.keys(EX).filter((id) => EX[id].slot === slot);
    total += ids.length;
    if (ids.length !== PLAN_D2[slot]) bad.push(`${slot}: ${ids.length} exercises, plan D2 says ${PLAN_D2[slot]}`);
    if (!Array.isArray(SLOTS[slot].trains) || !SLOTS[slot].trains.length) bad.push(`${slot}: no \`trains\``);
    for (const id of ids) {
      const d = DB[id] || {};
      if (!id.startsWith(`acc_${slot}_`)) bad.push(`${id}: coverage ids are acc_${slot}_<slug>`);
      if (d.pattern !== "accessory") bad.push(`${id}: DB pattern "${d.pattern}", plan D2 says accessory`);
      if (!((d.cues || []).length >= 3 && d.cues.length <= 5)) bad.push(`${id}: ${(d.cues || []).length} cues (3–5)`);
      if (!((d.mistakes || []).length >= 1 && d.mistakes.length <= 2)) bad.push(`${id}: ${(d.mistakes || []).length} mistakes (1–2)`);
      if (!d.readiness || !d.injury) bad.push(`${id}: missing readiness or injury`);
      if (EX[id].kind === "skill") bad.push(`${id}: a skill-kind move can't be a coverage exercise (plan decisions table)`);
      // plan decisions table: coverage reps are 10–15 whatever your goal, 12–20 for cuff, neck and shins
      if (["reps", "loaded", "unilateral"].includes(EX[id].kind)) {
        const want = LIGHT.includes(slot) ? [12, 20] : [10, 15];
        for (const goal of [undefined, "strength", "size", "both"]) {
          const r = TD.rangeFor(id, goal);
          if (r.lo !== want[0] || r.hi !== want[1]) bad.push(`${id}: ${goal || "no goal"} → ${r.lo}–${r.hi}, plan says ${want.join("–")}`);
        }
      }
      // a band loads a movement, so it carries a tension setup, light to heavy (plan C5)
      if (flat(EX[id].equipment).includes("bands") && EX[id].kind === "reps") {
        const st = TD.SETUPS[id];
        if (!st || st.key !== "band" || st.values.map((v) => v.id).join() !== "light,medium,heavy") bad.push(`${id}: a band move needs a band setup light,medium,heavy`);
      }
    }
  }
  // the three moves plan D2 marks "(branch)": off the path, offered by a main exercise, never a skill
  for (const id of ["acc_hamstring_slrdl", "acc_calf_bentknee", "acc_antirot_deadbug"]) {
    const e = EX[id];
    if (!e) { bad.push(`${id}: plan D2 names it as a branch move and it doesn't exist`); continue; }
    if (e.branch !== "skill" || e.kind === "skill") bad.push(`${id}: a branch move is branch "skill" with a non-skill kind (got ${e.branch}/${e.kind})`);
    if (!Object.values(EX).some((o) => o.branch === "main" && o.offer.includes(id))) bad.push(`${id}: no main exercise offers it`);
  }
  // the first catalogue hold you load by the side: seconds at a weight (plan 2.2's note)
  { const e = EX.acc_antirot_suitcase;
    if (!e || e.kind !== "hold" || !e.loadMode) bad.push("acc_antirot_suitcase: plan D2 calls it a loaded hold (kind hold with a loadMode)"); }
  // the neck's safety copy, and "avoid neck" excluding the whole slot (plan D2, C3)
  if (present.includes("neck"))
    for (const id of Object.keys(EX).filter((i) => EX[i].slot === "neck")) {
      const inj = (DB[id] || {}).injury || "";
      if (!/dizz/i.test(inj) || !/tingl/i.test(inj) || !/jerk/i.test(inj)) bad.push(`${id}: the neck injury line must mention jerking, dizziness and tingling`);
      if (TD.JOINT_STRESS[id].neck !== 2) bad.push(`${id}: neck stress must be 2 so "avoid neck" excludes the slot`);
    }
  if (total !== 64) bad.push(`${total} coverage exercises, plan D2 says 64`);
  bad.forEach(fail);
  if (!bad.length) ok(`${present.length} coverage slots, ${total} exercises, each at the plan's count`);
}

console.log(failed ? "\nFAILED\n" : "\nOK\n");
process.exit(failed ? 1 : 0);
