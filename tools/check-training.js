#!/usr/bin/env node
/**
 * Checks fitness/training.js — the step-up / repeat / reduce rules — against
 * plan Part C2 and cases T1–T10, and the rules plans/PLAN-yellow-dude.md
 * adds to training.data.js (Y1–Y3).
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
/* One session holding one exercise. o: { setup, loadKg, kg (the weight
   actually logged on every set: the prescribed load unless given, as the app
   pre-fills it, else 0), effort, flag, skipped, id, legacy (no rx), sets (rx
   set count), rx (the whole saved prescription, used as given) } */
function sess(day, exId, values, o = {}) {
  const rx = o.rx ? plain(o.rx) : T.startOf(exId, { setup: o.setup, loadKg: o.loadKg });
  if (o.sets) rx.sets = o.sets;
  const ex = {
    key: exId, sets: values.map((v) => ({ reps: v, weight: o.kg != null ? o.kg : o.loadKg || 0 })),
    difficulty: "effort" in o ? o.effort : "moderate",
    skipped: !!o.skipped, flag: o.flag ? { bodyPart: o.flag, severity: "moderate" } : null
  };
  if (!o.legacy) ex.rx = rx;
  return { id: o.id || "s_" + seq++, dayKey: day, dateISO: day + "T12:00:00.000Z", exercises: [ex] };
}
const rxOf = (exId, o = {}) => T.startOf(exId, o);
const TOP = [12, 12, 12];
const ALL = { pullupBar: true, dumbbells: true, bench: true, kettlebells: true, rings: true,
              bands: true, parallettes: true, dipBars: true, lowBar: true,
              vest: true, abWheel: true, jumpRope: true, box: true, barbell: true, nordicAnchor: true };
const NO_BAR = { pullupBar: false, dumbbells: true, bench: true, kettlebells: true, rings: false,
                 bands: false, parallettes: false, dipBars: false, lowBar: false,
                 vest: false, abWheel: false, jumpRope: false, box: false, barbell: false, nordicAnchor: false };

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

/* -- H cases: the Stage 1 fixes (plans/PLAN-fitness-control-and-coverage.md,
   Part F). Written BEFORE the fixes, so each one FAILs on this tree with the
   numbers in Part F's "Before" column; H2c is the control and passes on both
   sides. A case that passes before its fix is a harness defect. ------------- */
const ready = (r) => `${r.action}/${r.why}`;
const loadOf = (r) => (r.step && r.step.rx.setup ? r.step.rx.setup.loadKg : null);

check("H1a", () => {
  /* F1: prescribed at 10 kg, logged at 5 kg, 3 × 12 just right, twice. The
     weight actually lifted must count: nothing was done at 10 kg. */
  const rx = rxOf("shoulder_e2_ohp", { loadKg: 10 });
  const H = [sess("2026-09-24", "shoulder_e2_ohp", TOP, { loadKg: 10, kg: 5 }),
             sess("2026-09-27", "shoulder_e2_ohp", TOP, { loadKg: 10, kg: 5 })];
  const r = T.recommend(H, rx, { equipment: ALL });
  return [r.action === "repeat" && !r.step,
          `${ready(r)}, ${r.step ? r.step.kind + " to " + loadOf(r) + " kg" : "no step"}, ${r.history.length} comparable of 2 logged at 5 kg against a 10 kg rx`];
});
check("H2a", () => {
  /* F2: every set above the top, but rated hard: effort, not a drop in form. */
  const H = [sess("2026-09-20", "push_2", [15, 15, 15], { effort: "hard" }),
             sess("2026-09-22", "push_2", [14, 14, 14], { effort: "hard" }),
             sess("2026-09-24", "push_2", [13, 13, 13], { effort: "hard" })];
  const r = T.recommend(H, rxOf("push_2"));
  return [r.action === "repeat", `${ready(r)}, ${stepOf(r)}, totals ${r.history.map((e) => e.total).join(" → ")}`];
});
check("H2b", () => {
  /* F2: one rep less each session is noise, not a decline. */
  const H = [sess("2026-09-20", "push_2", [12, 12, 12]), sess("2026-09-22", "push_2", [12, 12, 11]),
             sess("2026-09-24", "push_2", [12, 11, 11])];
  const r = T.recommend(H, rxOf("push_2"));
  return [r.action === "repeat", `${ready(r)}, ${stepOf(r)}, totals ${r.history.map((e) => e.total).join(" → ")}`];
});
check("H2c", () => {
  /* F2's control: a real decline (36 → 29 → 22, sets below the range) still
     steps back, before and after. */
  const H = [sess("2026-09-20", "push_2", [12, 12, 12]), sess("2026-09-22", "push_2", [10, 10, 9]),
             sess("2026-09-24", "push_2", [8, 7, 7])];
  const r = T.recommend(H, rxOf("push_2"));
  return [r.action === "reduce" && r.step && r.step.rx.exerciseId === "push_incline",
          `${ready(r)}, ${stepOf(r)}, totals ${r.history.map((e) => e.total).join(" → ")} (control: passes before and after)`];
});
check("H9", () => {
  /* F9: 20/20/20 rated easy twice on a 6–12 range is at least 1.5× the top: two
     steps, landing at table height. Read the landing from `steps` when
     recommend returns the list, else from `step`. */
  const H = [sess("2026-09-24", "push_1", [20, 20, 20], { effort: "easy" }),
             sess("2026-09-27", "push_1", [20, 20, 20], { effort: "easy" })];
  const r = T.recommend(H, rxOf("push_1"));
  const landing = r.steps && r.steps.length ? r.steps[r.steps.length - 1] : r.step;
  const lands = landing && landing.rx.exerciseId === "push_incline" ? landing.rx.setup.surface : null;
  return [r.action === "ready" && r.double === true && lands === "table",
          `${ready(r)}, double ${r.double}, lands ${landing ? landing.rx.exerciseId + " " + lands : "nowhere"}`];
});
check("H5", () => {
  /* F5: Weighted Dip is done on parallel bars, so dumbbells alone don't own it,
     and neither does a doorway pull-up bar (plan C5: dipBars). */
  const got = T.owns({ dumbbells: true }, "dip_6");
  const doorway = T.owns({ dumbbells: true, pullupBar: true }, "dip_6");
  const withBars = T.owns({ dumbbells: true, dipBars: true }, "dip_6");
  return [got === false && doorway === false && withBars === true,
          `dumbbells only → ${got}; + pull-up bar → ${doorway}; + dip bars → ${withBars}`];
});

/* -- K cases and R1-1: Stage 2's pure rules (plan Part F, step 2.2). Written
   BEFORE the rules, so each FAILs on the Stage 1 tree; K-hold is a control
   (the plan asks to confirm a loaded hold works, not to fix it). ----------- */
const id = (r) => (r && r.rx ? r.rx.exerciseId : "none");
const gripOf = (r) => (r && r.rx && r.rx.setup && r.rx.setup.grip) || "palms";
const withSetup = (rx, extra) => Object.assign(plain(rx), { setup: Object.assign(plain(rx.setup), extra) });
const readyOn = (exId, rx, o, vals = TOP) =>
  T.recommend([sess("2026-09-24", exId, vals, { rx }), sess("2026-09-27", exId, vals, { rx })], rx, o);
const fallOn = (exId, rx, o) =>
  T.recommend([sess("2026-09-20", exId, [12, 12, 12], { rx }), sess("2026-09-22", exId, [10, 10, 9], { rx }),
               sess("2026-09-24", exId, [8, 7, 7], { rx })], rx, o);

check("K1", () => {
  /* Knuckles are slightly harder: knuckle sessions count for a palms rx;
     palm sessions don't count for a knuckles rx. */
  const palms = rxOf("push_2"), knuck = withSetup(palms, { grip: "knuckles" });
  const a = T.recommend([sess("2026-09-24", "push_2", TOP, { rx: knuck }), sess("2026-09-27", "push_2", TOP, { rx: knuck })], palms);
  const b = T.recommend([sess("2026-09-24", "push_2", TOP, { rx: palms }), sess("2026-09-27", "push_2", TOP, { rx: palms })], knuck);
  return [a.action === "ready" && b.action === "repeat" && b.history.length === 0,
          `palms rx from 2 knuckle sessions: ${ready(a)}; knuckles rx from 2 palm sessions: ${ready(b)}, ${b.history.length} comparable`];
});
check("K2", () => {
  /* Standing grip knuckles, carried both ways; Diamond is palms-only. */
  const o = { equipment: ALL, grip: { push: "knuckles", at: "2026-09-01T00:00:00.000Z" } };
  const up1 = readyOn("push_2", withSetup(rxOf("push_2"), { grip: "knuckles" }), o).step;
  const up2 = readyOn("push_3", rxOf("push_3"), o).step;
  const dn1 = fallOn("push_4", withSetup(rxOf("push_4"), { grip: "knuckles" }), o).step;
  const dn2 = fallOn("push_3", rxOf("push_3"), o).step;
  const got = [id(up1), gripOf(up1), id(up2), gripOf(up2), id(dn1), gripOf(dn1), id(dn2), gripOf(dn2)].join(" ");
  return [got === "push_3 palms push_4 knuckles push_3 palms push_2 knuckles",
          `up: Push-up → ${id(up1)} ${gripOf(up1)} → ${id(up2)} ${gripOf(up2)}; down: Decline → ${id(dn1)} ${gripOf(dn1)}, Diamond → ${id(dn2)} ${gripOf(dn2)}`];
});
check("K3", () => {
  /* An excluded rung is walked round, not stopped at. */
  const r = readyOn("push_2", rxOf("push_2"), { equipment: ALL, exclusions: { push_3: { state: "excluded", at: "x" } } });
  return [r.action === "ready" && id(r.step) === "push_4", `Diamond excluded: ${ready(r)}, ${stepOf(r)}`];
});
check("K4", () => {
  /* Knees "avoid": every squat rung after Bodyweight Squat is knee stress 2.
     Stepping up finds nothing; stepping back from the split squat with the
     rear foot raised walks back past them; "Allow anyway" lets one through. */
  const o = { equipment: ALL, limitations: { knee: "avoid", at: "x" } };
  const up = readyOn("squat_1", rxOf("squat_1"), o);
  const dn = fallOn("squat_3", rxOf("squat_3"), o);
  const al = readyOn("squat_1", rxOf("squat_1"), Object.assign({ exclusions: { squat_2: { state: "allowed", at: "x" } } }, o));
  return [up.action === "ready" && !up.step && dn.action === "reduce" && id(dn.step) === "squat_1" && id(al.step) === "squat_2",
          `up from Bodyweight Squat: ${stepOf(up)}; back from Bulgarian: ${stepOf(dn)}; Pause Squat allowed: ${stepOf(al)}`];
});
check("K5", () => {
  /* Ready at Decline: Archer is a step you can take (Pseudo Planche, a
     skill, is not); declining on Archer steps back to Decline, its offer
     parent. */
  const r = readyOn("push_4", rxOf("push_4"), { equipment: ALL });
  const into = (r.optionSteps || []).map((s) => `${s.kind}:${s.rx.exerciseId}`).join(", ");
  /* Declining on Archer follows the trained one of its two predecessors, and
     Decline is the one you came from. With no Decline session in the history
     the tie goes to Staggered-Hand (it names Archer in `next`, Decline only
     offers it), so the case seeds the Decline session a real user has. */
  const rxA = rxOf("push_5");
  const back = T.recommend([sess("2026-09-10", "push_4", [12, 12, 12], { rx: rxOf("push_4") }),
    sess("2026-09-20", "push_5", [12, 12, 12], { rx: rxA }), sess("2026-09-22", "push_5", [10, 10, 9], { rx: rxA }),
    sess("2026-09-24", "push_5", [8, 7, 7], { rx: rxA })], rxA, { equipment: ALL });
  return [into === "option:push_5" && back.action === "reduce" && id(back.step) === "push_4",
          `options ${r.options.join(", ")} → steps [${into}]; Archer declining: ${ready(back)}, ${stepOf(back)}`];
});
check("K6", () => {
  /* Hold pauses step-ups only. */
  const rx = Object.assign(plain(rxOf("push_2")), { hold: true });
  const a = readyOn("push_2", rx), b = fallOn("push_2", rx);
  return [a.action === "repeat" && a.why === "hold" && !a.step && a.evidence.length === 2 &&
          b.action === "reduce" && id(b.step) === "push_incline",
          `held, ready evidence: ${ready(a)}, ${stepOf(a)}; held, declining: ${ready(b)}, ${stepOf(b)}`];
});
check("K7", () => {
  /* Custom 4 × 8–10: ready needs four sets at 10, and the custom carries to
     the step (the range only while the unit stays the same). */
  const rx = T.startOf("push_2", { custom: { sets: 4, range: [8, 10] } });
  const a = readyOn("push_2", rx, { equipment: ALL }, [10, 10, 10, 10]);
  const b = readyOn("push_2", rx, { equipment: ALL }, [10, 10, 10, 9]);
  const c = T.recommend([sess("2026-09-24", "push_2", [10, 10, 10]), sess("2026-09-27", "push_2", [10, 10, 10])], rx);
  const h = readyOn("pull_1", T.startOf("pull_1", { custom: { sets: 4, range: [20, 40] } }), { equipment: ALL }, [40, 40, 40, 40]);
  const bad = [T.customError && T.customError({ sets: 4, range: [8, 9] }, "reps"),
               T.customError && T.customError({ range: [10, 60] }, "reps"),
               T.customError && T.customError({ sets: 7 }, "reps"),
               T.customError && T.customError({ sets: 2, range: [30, 300] }, "sec")];
  const st = a.step ? `${a.step.rx.sets} × ${a.step.rx.range.join("–")}` : "none";
  const hs = h.step ? `${h.step.rx.sets} × ${h.step.rx.range.join("–")} ${h.step.rx.unit}` : "none";
  return [rx.sets === 4 && a.action === "ready" && b.why === "below-top" && c.history.length === 0 &&
          st === "4 × 8–10" && hs === "4 × 6–12 reps" && !!bad[0] && !!bad[1] && !!bad[2] && bad[3] === null,
          `rx ${rx.sets} × ${rx.range.join("–")}; 4 at 10: ${ready(a)} → ${st}; one at 9: ${b.why}; 3-set sessions: ${c.history.length} comparable; ` +
          `Dead Hang 4 × 20–40 s → ${hs}; bad: ${bad.map((x) => (x ? "err" : x)).join(", ")}`];
});
check("K8", () => {
  /* The weights you own: fixed 5 / 7.5 / 12.5 kg dumbbells step 7.5 → 12.5,
     then nothing heavier ("heaviest you've listed"); back from 12.5 → 7.5.
     Adjustable to 20 kg in 2 kg steps: 18 → 20, then nothing. */
  const fixed = { equipment: ALL, loads: { dumbbells: { mode: "fixed", kg: [5, 7.5, 12.5] } } };
  const adj = { equipment: ALL, loads: { dumbbells: { mode: "adjustable", stepKg: 2, maxKg: 20 } } };
  const ohp = (kg) => rxOf("shoulder_e2_ohp", { loadKg: kg });
  const H = (kg) => [sess("2026-09-24", "shoulder_e2_ohp", TOP, { loadKg: kg }), sess("2026-09-27", "shoulder_e2_ohp", TOP, { loadKg: kg })];
  const D = (kg) => [12, 10, 8].map((n, i) => sess("2026-09-2" + (i * 2), "shoulder_e2_ohp", [n, n, n - 1], { loadKg: kg }));
  const a = T.recommend(H(7.5), ohp(7.5), fixed), b = T.recommend(H(12.5), ohp(12.5), fixed);
  const c = T.recommend(D(12.5), ohp(12.5), fixed);
  const d = T.recommend(H(18), ohp(18), adj), e = T.recommend(H(20), ohp(20), adj);
  const got = [loadOf(a), b.step ? loadOf(b) : "none", b.heaviest, loadOf(c), loadOf(d), e.step ? loadOf(e) : "none", e.heaviest];
  return [JSON.stringify(got) === '[12.5,"none",true,7.5,20,"none",true]',
          `fixed: 7.5 → ${got[0]}, 12.5 → ${got[1]} (heaviest ${got[2]}), back from 12.5 → ${got[3]}; adjustable: 18 → ${got[4]}, 20 → ${got[5]} (heaviest ${got[6]})`];
});
check("R1-1", () => {
  /* A load step is not off-load: the 10 kg sessions that earned the step to
     12.5 kg were done before it was accepted. A 10 kg session after it still
     is off-load. */
  const at = "2026-10-05T10:00:00.000Z";
  const old = [sess("2026-10-01", "dip_6", TOP, { loadKg: 10 }), sess("2026-10-03", "dip_6", TOP, { loadKg: 10 })];
  const rx = rxOf("dip_6", { loadKg: 12.5, at });
  const a = T.recommend(old, rx, { equipment: ALL });
  const b = T.recommend(old.concat(sess("2026-10-07", "dip_6", TOP, { loadKg: 10 })), rx, { equipment: ALL });
  return [a.why === "no-history" && b.why === "off-load" && b.loggedKg === 10,
          `after the step: ${ready(a)}; after a 10 kg session on 7 Oct: ${ready(b)}${b.loggedKg ? ", logged " + b.loggedKg + " kg" : ""}`];
});
check("K-hold", () => {
  /* Stage 3's Suitcase Hold will be the first loaded hold: a synthetic one
     here confirms rangeFor, startOf and stepUp treat kind "hold" with a
     loadMode as seconds at a load. A control, not a fix. */
  sandbox.window.TRAINING_DATA.EXERCISES.test_loadedhold = { slot: "core", branch: "main", kind: "hold",
    equipment: [["dumbbells", "kettlebells"]], next: [], offer: [], loadMode: "perHand" };
  sandbox.window.TRAINING_DATA.HOLD_RANGES.test_loadedhold = [20, 40];
  try {
    const rx = rxOf("test_loadedhold", { loadKg: 16 });
    const r = T.recommend([sess("2026-09-24", "test_loadedhold", [40, 40, 40], { loadKg: 16 }),
                           sess("2026-09-27", "test_loadedhold", [40, 40, 40], { loadKg: 16 })], rx, { equipment: { kettlebells: true } });
    return [rx.unit === "sec" && rx.range.join() === "20,40" && rx.setup.loadMode === "perHand" && r.action === "ready" && loadOf(r) === 20,
            `${rx.sets} × ${rx.range.join("–")} ${rx.unit} at ${rx.setup.loadKg} kg; 40 s twice: ${ready(r)}, ${stepOf(r)}`];
  } finally {
    delete sandbox.window.TRAINING_DATA.EXERCISES.test_loadedhold;
    delete sandbox.window.TRAINING_DATA.HOLD_RANGES.test_loadedhold;
  }
});

/* -- Yellow Dude Stage 1 (plans/PLAN-yellow-dude.md, step 1.1) -------------
   The catalogue's records arrive in Stage 2, so these run on synthetic
   entries and remove them after, like K-hold. */
const TDX = sandbox.window.TRAINING_DATA;
check("Y1-rep-range", () => {
  /* An exercise's own range beats goal and coverage ranges, for reps and
     unilateral only: an eccentric keeps 3–6. */
  const RR = TDX.REP_RANGES = TDX.REP_RANGES || {};
  RR.pull_4 = [1, 5]; RR.acc_curl_doorframe = [1, 5]; RR.pull_3 = [1, 5];
  try {
    const r = (id, goal) => { const x = TDX.rangeFor(id, goal); return x.lo + "–" + x.hi; };
    const seen = [r("pull_4", "strength"), r("pull_4", "size"), r("pull_4"), r("acc_curl_doorframe", "both"), r("pull_3")];
    const rx = rxOf("pull_4", { goal: "size" });
    return [seen.join() === "1–5,1–5,1–5,1–5,3–6" && rx.range.join() === "1,5",
            `pull_4 strength/size/none ${seen.slice(0, 3).join(" / ")}, coverage curl ${seen[3]}, eccentric pull_3 ${seen[4]}; startOf ${rx.range.join("–")}`];
  } finally { delete RR.pull_4; delete RR.acc_curl_doorframe; delete RR.pull_3; }
});
check("Y2-timed", () => {
  /* A timed hold is a hold to every rule; rangeFor only adds the flag. */
  TDX.EXERCISES.core_1.timed = true;
  try {
    const t = TDX.rangeFor("core_1"), u = TDX.rangeFor("core_2"), rx = rxOf("core_1");
    return [t.timed === true && t.kind === "hold" && t.lo === 30 && t.hi === 60 && !("timed" in u) &&
            rx.unit === "sec" && rx.range.join() === "30,60",
            `core_1 timed ${t.timed}, ${t.kind} ${t.lo}–${t.hi}; core_2 timed ${"timed" in u ? u.timed : "absent"}; startOf ${rx.range.join("–")} ${rx.unit}`];
  } finally { delete TDX.EXERCISES.core_1.timed; }
});
check("Y3-vest-barbell", () => {
  /* A vest steps 2.5 kg and a barbell 5 kg, each the only implement listed. */
  const add = (id, tok) => { TDX.EXERCISES[id] = { slot: "push", branch: "main", kind: "loaded",
    equipment: [tok], next: [], offer: [], loadMode: "total" }; };
  add("test_vest", "vest"); add("test_barbell", "barbell");
  try {
    const step = (id, tok) => T.recommend([sess("2026-09-24", id, TOP, { loadKg: 10 }), sess("2026-09-27", id, TOP, { loadKg: 10 })],
                                          rxOf(id, { loadKg: 10 }), { equipment: { [tok]: true } });
    const v = step("test_vest", "vest"), b = step("test_barbell", "barbell");
    return [v.action === "ready" && loadOf(v) === 12.5 && b.action === "ready" && loadOf(b) === 15,
            `vest 10 kg: ${ready(v)} → ${loadOf(v)} kg; barbell 10 kg: ${ready(b)} → ${loadOf(b)} kg`];
  } finally { delete TDX.EXERCISES.test_vest; delete TDX.EXERCISES.test_barbell; }
});

console.log(`\n${failed ? failed + " failed" : "all passed"}`);
process.exit(failed ? 1 : 0);
