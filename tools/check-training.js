#!/usr/bin/env node
/**
 * Checks fitness/training.js — the step-up / repeat / reduce rules — against
 * plan Part C2 and cases T1–T10.
 *
 *   node tools/check-training.js
 *   TRAINING_JS=/path/to/other/training.js node tools/check-training.js
 *
 * Prints one `<case> PASS|FAIL — <what was measured>` line per case and exits 1
 * if any fails. The module is pure, so it runs in a bare vm sandbox with only
 * training.data.js beside it: no browser, no basalt.js, no clock.
 */

"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const target = process.env.TRAINING_JS || path.join(root, "fitness/training.js");
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of [path.join(root, "fitness/training.data.js"), target]) {
  vm.runInContext(fs.readFileSync(f, "utf8"), sandbox, { filename: f });
}
const T = sandbox.window.Training;
const plain = (x) => JSON.parse(JSON.stringify(x));   // out of the vm's realm

/* -- fixtures ------------------------------------------------------------ */
let seq = 100;
/* One session holding one exercise. o: { setup, loadKg, effort, flag,
   skipped, id, legacy (no rx), sets (rx set count) } */
function sess(day, exId, values, o = {}) {
  const rx = T.startOf(exId, { setup: o.setup, loadKg: o.loadKg });
  if (o.sets) rx.sets = o.sets;
  const ex = {
    key: exId, sets: values.map((v) => ({ reps: v, weight: 0 })),
    difficulty: "effort" in o ? o.effort : "moderate",
    skipped: !!o.skipped, flag: o.flag ? { bodyPart: o.flag, severity: "moderate" } : null
  };
  if (!o.legacy) ex.rx = rx;
  return { id: o.id || "s_" + seq++, dayKey: day, dateISO: day + "T12:00:00.000Z", exercises: [ex] };
}
const rxOf = (exId, o = {}) => T.startOf(exId, o);
const TOP = [12, 12, 12];
const ALL = { pullupBar: true, dumbbells: true, bench: true, kettlebells: true, rings: true };
const NO_BAR = { pullupBar: false, dumbbells: true, bench: true, kettlebells: true, rings: false };

/* -- runner --------------------------------------------------------------- */
let failed = 0;
function check(name, fn) {
  let ok, msg;
  try { [ok, msg] = fn(); } catch (e) { ok = false; msg = "threw: " + e.message; }
  if (!ok) failed++;
  console.log(`${name} ${ok ? "PASS" : "FAIL"} — ${msg}`);
}
const days = (r) => r.evidence.map((e) => e.day).join(" + ");
const stepOf = (r) => (r.step ? `${r.step.kind} → ${r.step.rx.exerciseId} ${JSON.stringify(plain(r.step.rx.setup))}` : "no step");

console.log(`\ntraining rules — ${path.relative(root, target)}\n`);

/* -- T1–T10 (plan Part E, Stage 2) ---------------------------------------- */
check("T1", () => {
  const H = [sess("2026-09-24", "push_incline", TOP, { setup: { surface: "table" } }),
             sess("2026-09-27", "push_incline", TOP, { setup: { surface: "table" } })];
  const r = T.recommend(H, rxOf("push_incline", { setup: { surface: "table" } }));
  return [r.action === "ready" && r.step && r.step.rx.setup.surface === "chair" && days(r) === "2026-09-24 + 2026-09-27",
          `${r.action}, ${stepOf(r)}, evidence ${days(r)}`];
});
check("T2", () => {
  const H = [sess("2026-09-24", "push_incline", TOP), sess("2026-09-27", "push_incline", [12, 9, 6])];
  const r = T.recommend(H, rxOf("push_incline"));
  return [r.action === "repeat" && r.why === "below-top" && r.belowSet === 1 && r.hi === 12,
          `${r.action}, ${r.why}, set ${r.belowSet + 1} below ${r.hi}`];
});
check("T3", () => {
  const H = [sess("2026-09-24", "push_2", TOP, { effort: null }), sess("2026-09-27", "push_2", TOP, { effort: null })];
  const r = T.recommend(H, rxOf("push_2"));
  return [r.action === "repeat" && r.why === "effort", `${r.action}, ${r.why}`];
});
check("T4", () => {
  const H = [sess("2026-09-24", "push_2", TOP, { flag: "wrist" }), sess("2026-09-27", "push_2", TOP)];
  const r = T.recommend(H, rxOf("push_2"));
  return [r.action === "repeat" && r.history.length === 1, `${r.action}, ${r.why}, ${r.history.length} comparable of 2`];
});
check("T5", () => {
  const H = [sess("2026-09-27", "push_2", TOP), sess("2026-09-27", "push_2", TOP)];
  const r = T.recommend(H, rxOf("push_2"));
  return [r.action === "repeat" && r.why === "same-day", `${r.action}, ${r.why}`];
});
check("T6", () => {
  const H = [sess("2026-09-24", "push_incline", TOP, { setup: { surface: "table" } }),
             sess("2026-09-27", "push_incline", TOP, { setup: { surface: "chair" } })];
  const r = T.recommend(H, rxOf("push_incline", { setup: { surface: "chair" } }));
  return [r.action === "repeat" && r.history.length === 1 && r.why === "one-session",
          `${r.action}, ${r.why}, ${r.history.length} comparable at chair`];
});
check("T7", () => {
  const H = [sess("2026-09-24", "core_3", [30, 30, 30]), sess("2026-09-27", "core_3", [30, 30, 30])];
  const r = T.recommend(H, rxOf("core_3"), { equipment: ALL });
  return [r.action === "ready" && !r.step && r.options.includes("core_4"),
          `${r.action}, ${stepOf(r)}, optional: ${r.options.join(", ")}`];
});
check("T8", () => {
  /* s_900 was saved after s_500 but is backdated to an earlier day. */
  const H = [sess("2026-10-01", "push_2", TOP, { id: "s_500" }), sess("2026-09-29", "push_2", [10, 10, 10], { id: "s_900" }),
             sess("2026-10-01", "push_2", TOP, { id: "s_400" })];
  const order = T.exposures(H, "push_2").map((e) => `${e.day.slice(5)}/${e.sessionId}`).join(", ");
  return [order === "09-29/s_900, 10-01/s_400, 10-01/s_500", order];
});
check("T9", () => {
  const a = sess("2026-09-24", "push_2", TOP, { id: "s_dup" });
  const H = [a, plain(a), sess("2026-09-27", "push_2", TOP)];
  const r = T.recommend(H, rxOf("push_2"));
  return [r.history.length === 2 && r.action === "ready", `${r.history.length} comparable from 3 records, ${r.action}`];
});
check("T10", () => {
  const H = [sess("2026-09-20", "push_incline", [12, 12, 10], { setup: { surface: "chair" } }),
             sess("2026-09-22", "push_incline", [11, 10, 9], { setup: { surface: "chair" } }),
             sess("2026-09-24", "push_incline", [10, 9, 8], { setup: { surface: "chair" } })];
  const r = T.recommend(H, rxOf("push_incline", { setup: { surface: "chair" } }));
  return [r.action === "reduce" && r.step && r.step.rx.setup.surface === "table" && r.evidence.length === 3,
          `${r.action}, ${stepOf(r)}, totals ${r.evidence.map((e) => e.total).join(" → ")}`];
});

/* -- C2 rules the T cases don't reach -------------------------------------- */
check("C2-legacy", () => {
  const H = [sess("2026-09-24", "push_2", TOP, { legacy: true }), sess("2026-09-27", "push_2", TOP, { legacy: true })];
  const r = T.recommend(H, rxOf("push_2"));
  return [T.exposures(H, "push_2").length === 2 && r.history.length === 0 && r.why === "no-history" && r.key === null,
          `${T.exposures(H, "push_2").length} exposures, ${r.history.length} comparable, ${r.why}`];
});
check("C6-legacy-effort", () => {
  /* Read-time rule: without rx, "moderate" is unknown; any other rating, and
     every rating with rx, reads as saved. */
  const eff = (o) => T.exposures([sess("2026-09-24", "push_2", TOP, o)], "push_2")[0].effort;
  const got = [eff({ legacy: true }), eff({ legacy: true, effort: "easy" }), eff({ legacy: true, effort: null }), eff({})];
  return [JSON.stringify(got) === '[null,"easy",null,"moderate"]',
          `legacy moderate → ${got[0]}, legacy easy → ${got[1]}, legacy blank → ${got[2]}, with rx moderate → ${got[3]}`];
});
check("C2-decision", () => {
  const H = [sess("2026-09-24", "push_2", TOP, { id: "s_a" }), sess("2026-09-27", "push_2", TOP, { id: "s_b" })];
  const dec = { "push_2|s_b": { choice: "repeat", at: "2026-09-27T18:00:00.000Z" } };
  const r1 = T.recommend(H, rxOf("push_2"), { decisions: dec });
  const r2 = T.recommend(H.concat(sess("2026-09-29", "push_2", TOP, { id: "s_c" })), rxOf("push_2"), { decisions: dec });
  return [r1.key === "push_2|s_b" && r1.decision && r1.decision.choice === "repeat" && r1.action === "ready" &&
          r2.key === "push_2|s_c" && r2.decision === null && r2.action === "ready",
          `${r1.key} → ${r1.decision && r1.decision.choice}; after s_c: ${r2.key} → ${r2.decision}`];
});
check("C2-effort", () => {
  const out = ["hard", "failed", "unsure", "easy"].map((eff) => {
    const H = [sess("2026-09-24", "push_2", TOP), sess("2026-09-27", "push_2", TOP, { effort: eff })];
    return `${eff}:${T.recommend(H, rxOf("push_2")).action}`;
  }).join(" ");
  return [out === "hard:repeat failed:repeat unsure:repeat easy:ready", out];
});
check("C2-one-of-two", () => {
  const H = [sess("2026-09-24", "push_2", [12, 11, 10]), sess("2026-09-27", "push_2", TOP)];
  const r = T.recommend(H, rxOf("push_2"));
  return [r.action === "repeat" && r.why === "one-session" && r.atTop === 1, `${r.why}, ${r.atTop} of 2 at the top`];
});
check("C2-blank-set", () => {
  const H = [sess("2026-09-24", "push_2", TOP), sess("2026-09-27", "push_2", [12, 12])];
  const r = T.recommend(H, rxOf("push_2"));
  return [r.why === "below-top" && r.belowSet === 2, `${r.why}, set ${r.belowSet + 1} missing`];
});
check("C2-setup-end", () => {
  const H = [sess("2026-09-24", "push_incline", TOP, { setup: { surface: "step" } }),
             sess("2026-09-27", "push_incline", TOP, { setup: { surface: "step" } })];
  const r = T.recommend(H, rxOf("push_incline", { setup: { surface: "step" } }));
  return [r.step && r.step.kind === "movement" && r.step.rx.exerciseId === "push_2", stepOf(r)];
});
check("C2-load", () => {
  const up = (id, kg, eq) => {
    const H = [sess("2026-09-24", id, TOP, { loadKg: kg }), sess("2026-09-27", id, TOP, { loadKg: kg })];
    const r = T.recommend(H, rxOf(id, { loadKg: kg }), { equipment: eq });
    return r.step ? r.step.rx.setup.loadKg : null;
  };
  const got = [up("hinge_e2_rdl", 20, ALL), up("hinge_e2_swing", 16, ALL),
               up("squat_e2_goblet", 16, { kettlebells: true }), up("squat_e2_goblet", 10, { dumbbells: true })];
  return [JSON.stringify(got) === "[22.5,20,20,12.5]", `RDL 20→${got[0]}, swing 16→${got[1]}, goblet kb 16→${got[2]}, goblet db 10→${got[3]}`];
});
check("C2-no-load", () => {
  /* R2-2: a loaded prescription with no weight logged is never evidence —
     3 × 12 at an unknown load says nothing, and there's no load to step from. */
  const H = [sess("2026-09-24", "dip_6", TOP), sess("2026-09-27", "dip_6", TOP)];
  const r = T.recommend(H, rxOf("dip_6"), { equipment: ALL });
  const n = T.comparable(H, rxOf("dip_6")).length;
  return [r.action === "repeat" && r.why === "no-load" && !r.step && n === 0, `${r.action}, ${r.why}, ${n} comparable`];
});
check("C2-equipment", () => {
  const H = [sess("2026-09-24", "push_3", TOP), sess("2026-09-27", "push_3", TOP)];
  const r = T.recommend(H, rxOf("push_3"), { equipment: { bench: false } });
  const R = [sess("2026-09-24", "pull_alt_tabledoor", TOP, { setup: { bodyAngle: "straight" } }),
             sess("2026-09-27", "pull_alt_tabledoor", TOP, { setup: { bodyAngle: "straight" } })];
  const q = T.recommend(R, rxOf("pull_alt_tabledoor", { setup: { bodyAngle: "straight" } }), { equipment: NO_BAR });
  return [r.action === "ready" && !r.step && r.unowned.join() === "push_4" && !q.step && q.unowned.join() === "pull_alt_australian",
          `no bench: ${stepOf(r)}, needs ${r.unowned}; no bar: ${stepOf(q)}, needs ${q.unowned}`];
});
check("C2-predecessor", () => {
  /* Pull-up declining, and the band-assisted pull-up trained more recently
     than the negative: step back to the band, at its hardest setup. */
  const H = [sess("2026-09-01", "pull_3", [6, 6, 6]), sess("2026-09-10", "pull_alt_bandassist", TOP, { setup: { band: "light" } }),
             sess("2026-09-20", "pull_4", [8, 7, 6]), sess("2026-09-22", "pull_4", [7, 6, 5]), sess("2026-09-24", "pull_4", [6, 5, 4])];
  const r = T.recommend(H, rxOf("pull_4"), { equipment: ALL });
  return [r.action === "reduce" && r.step.rx.exerciseId === "pull_alt_bandassist" && r.step.rx.setup.band === "light", stepOf(r)];
});
check("C2-floor", () => {
  /* Declining at the first movement of a path: nothing easier to offer. */
  const H = [sess("2026-09-20", "push_1", [12, 12, 10]), sess("2026-09-22", "push_1", [11, 10, 9]), sess("2026-09-24", "push_1", [10, 9, 8])];
  const r = T.recommend(H, rxOf("push_1"));
  return [r.action === "repeat" && !r.step, `${r.action}, ${stepOf(r)}`];
});
check("C2-start", () => {
  const a = plain(T.startOf("push_incline")), b = plain(T.startOf("hinge_e2_rdl")), c = plain(T.startOf("core_1"));
  const d = plain(T.startOf("skill_planche_5"));
  const ok = a.setup.surface === "counter" && a.range.join() === "6,12" && a.sets === 3 && a.unit === "reps" &&
             b.setup.loadKg === null && b.setup.loadMode === "perHand" && c.unit === "sec" && c.range.join() === "30,60" &&
             d.range[1] === null && T.startOf("nope") === null;
  return [ok, `incline ${a.setup.surface} ${a.range}, RDL ${JSON.stringify(b.setup)}, plank ${c.range} ${c.unit}, planche_5 hi ${d.range[1]}`];
});
check("C2-skill", () => {
  const H = [sess("2026-09-24", "skill_planche_5", [20, 20, 20]), sess("2026-09-27", "skill_planche_5", [20, 20, 20])];
  const r = T.recommend(H, rxOf("skill_planche_5"));
  return [r.action === "repeat" && r.why === "no-standard", `${r.action}, ${r.why}`];
});
check("C2-pure", () => {
  const src = fs.readFileSync(target, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
  const hits = ["document", "localStorage", "App.", "Hub.", "Date.now", "new Date()"].filter((w) => src.includes(w));
  const H = [sess("2026-09-24", "push_2", TOP), sess("2026-09-27", "push_2", TOP)];
  const before = JSON.stringify(H), rx = rxOf("push_2"), rxBefore = JSON.stringify(rx);
  T.recommend(H, rx, { equipment: ALL, decisions: {} });
  const same = JSON.stringify(H) === before && JSON.stringify(rx) === rxBefore;
  return [!hits.length && same, `forbidden: ${hits.join(", ") || "none"}; inputs unchanged: ${same}`];
});

check("P4-sets", () => {
  /* A recovery block cuts sets x 0.6, rounded, floor 1, and never raises a count. */
  const got = [1, 2, 3, 4, 5, 6].map((n) => T.recoverySets(n));
  return [got.join() === "1,1,2,2,3,4", `1..6 sets -> ${got.join(", ")}`];
});
check("P4-evidence", () => {
  /* A session saved inside a block is never evidence, even at a set count the
     block left unchanged (one set), and the sessions around it still count. */
  const inBlock = sess("2026-09-29", "push_2", TOP); inBlock.recovery = "rb_1";
  const H = [sess("2026-09-24", "push_2", TOP), inBlock, sess("2026-09-27", "push_2", TOP)];
  const r = T.recommend(H, rxOf("push_2"));
  const only = T.comparable([inBlock], rxOf("push_2")).length;
  return [only === 0 && r.history.length === 2 && r.action === "ready", `block-only ${only} comparable; around it ${r.history.length}, ${r.action}`];
});
check("P4-reduce", () => {
  /* Reduced sets inside a block can't read as a decline: only the sessions
     outside it feed the Reduce rule. */
  const mk = (d, v, b) => { const x = sess(d, "push_2", v); if (b) x.recovery = "rb_1"; return x; };
  const H = [mk("2026-09-20", [10, 10, 10]), mk("2026-09-22", [9, 9, 9], true), mk("2026-09-24", [8, 8, 8], true)];
  const r = T.recommend(H, rxOf("push_2"));
  return [r.action === "repeat", `${r.action}, ${r.history.length} comparable of 3`];
});

console.log(`\n${failed ? failed + " failed" : "all passed"}`);
process.exit(failed ? 1 : 0);
