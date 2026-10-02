#!/usr/bin/env node
/* ==========================================================================
   WELLNESS HUB · SYNC MERGE REGRESSION CHECK

     · S6   two devices each log a session; neither may lose the other's
     · S7   a v3 save merged with a v4 file keeps version 4
     · C6   the v4 `training` records: each one whole, the newer stamp wins
     · T13  a Stage 1 device and two v4 devices sync in rounds; v4 data intact
     · R1-3 an edited session, goal or re-logged run reaches the other device

   plans/PLAN-workout-progression.md, Part E. The browser cases (S1-S5, S8-S21,
   T11-T12) live in tools/check-workout.py. T13's other half — the Stage 1
   device opening the merged save read-only — is S9's mechanism there.

   Run it from anywhere:   node tools/check-syncmerge.js
                           SYNCMERGE_JS=/path/to/other/syncmerge.js node tools/check-syncmerge.js
   Output, one line per case:   <id> PASS|FAIL  <title> -- <measured>
   Exit code:   0 all pass · 1 at least one FAIL · 2 the module would not load

   Loads the real js/syncmerge.js into a bare vm context — no DOM, no browser —
   and calls Hub.syncMerge.mergePayload exactly as storage.js does, in both
   directions: each device merges the file the other one wrote.
   ========================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const MODULE = process.env.SYNCMERGE_JS
  ? path.resolve(process.env.SYNCMERGE_JS)
  : path.join(__dirname, "..", "js", "syncmerge.js");

function loadMerge() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(MODULE, "utf8"), sandbox, { filename: MODULE });
  return sandbox.window.Hub.syncMerge;
}

const session = (id, day) => ({ id, dateISO: day + "T10:00:00.000Z", type: "push", completed: true });
const flag = (id) => ({ id, dateISO: "2026-09-30T10:00:00.000Z", exerciseKey: "push_1", bodyPart: "wrist", severity: "mild" });
const pr = (exerciseId, kind, value) =>
  ({ id: "pr_" + exerciseId + "_" + value, exerciseId, kind, value, dateISO: "2026-09-30T10:00:00.000Z" });

/* The BASALT half of a sync payload, as storage.js writes it. */
const payload = (iron) => ({ app: "wellness-hub", formatVersion: 1, ironframe: iron });
const ids = (arr) => (arr || []).map((x) => x.id).sort();

const CASES = [];
const test = (id, title, fn) => CASES.push({ id, title, fn });

/* The phone and the desktop both start from one shared session, then each logs
   one more. Each merges the file the other wrote, so both directions run. */
test("S6", "Phone and desktop each log one session", (M) => {
  const phone = payload({
    version: 3,
    sessions: [session("s_shared", "2026-09-28"), session("s_phone", "2026-09-30")],
    flagsHistory: [flag("f_phone")],
    prs: [pr("push_2", "reps", 20), pr("pull_1", "hold", 30)],
  });
  const desk = payload({
    version: 3,
    sessions: [session("s_shared", "2026-09-28"), session("s_desk", "2026-10-01")],
    flagsHistory: [flag("f_desk")],
    prs: [pr("push_2", "reps", 25), pr("pull_1", "hold", 20)],
  });
  const onDesk = M.mergePayload(phone, desk).ironframe;    // desktop pulls the phone's file
  const onPhone = M.mergePayload(desk, phone).ironframe;   // phone pulls the desktop's file

  const want = ["s_desk", "s_phone", "s_shared"];
  const best = (iron, exerciseId, kind) =>
    iron.prs.filter((p) => p.exerciseId === exerciseId && p.kind === kind).map((p) => p.value);
  const prOk = (iron) =>
    JSON.stringify(best(iron, "push_2", "reps")) === "[25]" &&
    JSON.stringify(best(iron, "pull_1", "hold")) === "[30]";
  const flagsOk = (iron) => JSON.stringify(ids(iron.flagsHistory)) === '["f_desk","f_phone"]';

  const ok = [onDesk, onPhone].every((i) => JSON.stringify(ids(i.sessions)) === JSON.stringify(want) &&
    prOk(i) && flagsOk(i));
  const show = (i) => "sessions " + ids(i.sessions).join("+") +
    ", push_2 PR " + best(i, "push_2", "reps").join("/") +
    ", flags " + ids(i.flagsHistory).join("+");
  return { ok, measured: "desktop keeps [" + show(onDesk) + "]; phone keeps [" + show(onPhone) + "]" };
});

test("S7", "v3 local merged with a v4 file", (M) => {
  const file = payload({ version: 4, sessions: [session("s_shared", "2026-09-28")], prs: [] });
  const local = payload({ version: 3, sessions: [session("s_shared", "2026-09-28")], prs: [] });
  const version = M.mergePayload(file, local).ironframe.version;
  return { ok: version === 4, measured: "version " + version };
});

/* ---- v4 · training (plan C6) ---------------------------------------------- */
const T5 = "2026-10-05T09:00:00.000Z", T6 = "2026-10-06T09:00:00.000Z";
/* A slot as basalt.js writes it: carried over (acceptedAt null) or accepted. */
const slot = (exerciseId, acceptedAt, setup = {}) => ({
  exerciseId, setup, sets: 3, range: [6, 12], unit: "reps", acceptedAt,
  why: acceptedAt ? "stepped up" : "carried over from Level 2"
});
const training = (slots, decisions = {}, assessment = null) => ({ slots, decisions, assessment });
const v4session = (id, day, exerciseId) => Object.assign(session(id, day), {
  dayKey: day, exercises: [{ key: exerciseId, sets: [{ reps: 12 }], rx: slot(exerciseId, null) }]
});
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

test("C6", "training records merge whole, newer stamp wins", (M) => {
  const file = payload({ version: 4, training: training(
    { push: slot("push_incline", T5, { surface: "counter" }), core: slot("core_1", T5), squat: slot("squat_2", null) },
    { "push_2|s_a": { choice: "step", at: T5 }, "core_1|s_b": { choice: "repeat", at: T5 } },
    { at: T5, answers: { push: "push_2" } }) });
  const local = payload({ version: 4, training: training(
    { push: slot("push_2", null), core: slot("core_2", T6), squat: slot("squat_1", null), hinge: slot("hinge_2", null) },
    { "core_1|s_b": { choice: "step", at: T6 }, "hinge_2|s_c": { choice: "repeat", at: T5 } },
    null) });
  const before = JSON.stringify([file, local]);
  const t = M.mergePayload(file, local).ironframe.training;
  const ft = file.ironframe.training, lt = local.ironframe.training;
  const checks = {
    "accepted beats carried over": same(t.slots.push, ft.slots.push),
    "newer accepted wins": same(t.slots.core, lt.slots.core),
    "tie keeps local": same(t.slots.squat, lt.slots.squat),
    "one-sided slot kept": same(t.slots.hinge, lt.slots.hinge),
    "decisions union, newer at": Object.keys(t.decisions).sort().join() === "core_1|s_b,hinge_2|s_c,push_2|s_a" &&
      t.decisions["core_1|s_b"].choice === "step",
    "assessment from the side that has one": same(t.assessment, ft.assessment),
    "inputs unchanged": JSON.stringify([file, local]) === before,
    "v3 merge adds no training": !("training" in M.mergePayload(payload({ version: 3 }), payload({ version: 3 })).ironframe)
  };
  const bad = Object.keys(checks).filter((k) => !checks[k]);
  return { ok: !bad.length, measured: bad.length ? "failed: " + bad.join("; ") :
    "push " + t.slots.push.exerciseId + " " + JSON.stringify(t.slots.push.setup) + ", core " + t.slots.core.exerciseId +
    ", squat " + t.slots.squat.exerciseId + ", " + Object.keys(t.decisions).length + " decisions" };
});

/* Three devices, merging in rounds through one sync file. S1 is on the
   Stage 1 build: v3, no training, and (in the browser) read-only once the
   merged save is v4. V4 and C are on this build; C migrated on its own, so
   its slots are carried over. Every device runs THIS module — the case holds
   only if the Stage 1 release ships it (see the progress log, W7). */
test("T13", "Stage 1 device syncs with two v4 devices, in rounds", (M) => {
  let v4 = payload({ version: 4, training: training({ push: slot("push_2", null), core: slot("core_1", null) }),
    sessions: [session("s_shared", "2026-09-28"), v4session("s_v4", "2026-09-30", "push_2")] });
  let s1 = payload({ version: 3, sessions: [session("s_shared", "2026-09-28"), session("s_s1", "2026-09-29")] });
  const c = payload({ version: 4, training: training({ push: slot("push_2", null), core: slot("core_1", null) },
    { "core_1|s_c": { choice: "repeat", at: T5 } }),
    sessions: [session("s_shared", "2026-09-28"), v4session("s_c", "2026-09-27", "core_1")] });

  s1 = M.mergePayload(v4, s1);                                   // round 1: S1 pulls V4's file
  const round1 = s1.ironframe.version === 4 && same(s1.ironframe.training, v4.ironframe.training);

  v4 = JSON.parse(JSON.stringify(v4));                           // V4 steps up and writes again
  v4.ironframe.training.slots.push = slot("push_incline", T6, { surface: "counter" });
  v4.ironframe.training.decisions["push_2|s_v4"] = { choice: "step", at: T6 };
  s1 = M.mergePayload(v4, s1);                                   // round 2: S1 pulls again

  const onV4 = M.mergePayload(s1, v4).ironframe;                // V4 pulls S1's file
  const onC = M.mergePayload(s1, c).ironframe;                  // C pulls S1's file
  const rxOf = (iron, id) => JSON.stringify((iron.sessions.find((x) => x.id === id) || { exercises: [{}] }).exercises[0].rx);
  const want = ["s_c", "s_s1", "s_shared", "s_v4"];
  const checks = {
    "round 1: S1 holds V4's training, version 4": round1,
    "S1 holds V4's slots exactly": same(s1.ironframe.training.slots, v4.ironframe.training.slots),
    "V4 keeps its own training": same(onV4.training, v4.ironframe.training),
    "C takes V4's step-up whole": same(onC.training.slots.push, v4.ironframe.training.slots.push),
    "C keeps its own decision too": !!onC.training.decisions["core_1|s_c"] && !!onC.training.decisions["push_2|s_v4"],
    "rx intact": rxOf(onV4, "s_v4") === JSON.stringify(slot("push_2", null)) &&
      rxOf(onC, "s_v4") === JSON.stringify(slot("push_2", null)),
    "version 4 everywhere": s1.ironframe.version === 4 && onV4.version === 4 && onC.version === 4,
    "S1's session survives": ids(onV4.sessions).includes("s_s1"),
    "C holds all four sessions": same(ids(onC.sessions), want)
  };
  const bad = Object.keys(checks).filter((k) => !checks[k]);
  const p = onC.training.slots.push;
  return { ok: !bad.length,
    measured: (bad.length ? "failed: " + bad.join("; ") + " | " : "") +
      "C's push slot " + p.exerciseId + " " + JSON.stringify(p.setup) + " @" + p.acceptedAt +
      ", S1's push slot " + s1.ironframe.training.slots.push.exerciseId + " " + JSON.stringify(s1.ironframe.training.slots.push.setup) +
      ", C sessions " + ids(onC.sessions).join("+") };
});

/* The phone edits a session's notes, ticks a goal and re-logs a run (same id,
   R1-1); the desktop holds the unedited copies. Both directions must end on the
   phone's edits, and two copies with one stamp keep the local one. */
test("R1-3", "An edit reaches the other device; a tie keeps local", (M) => {
  const T1 = "2026-09-30T10:00:00.000Z", T2 = "2026-10-01T09:00:00.000Z";
  const s1 = session("s_1", "2026-09-30");
  const run = (km, at) => ({ id: "run_1", dateISO: T1, distanceKm: km, updatedAt: at });
  const desk = payload({ version: 4, sessions: [Object.assign({}, s1, { notes: "" })],
    goals: [{ id: "g_1", text: "10 pull-ups", done: false }],
    running: { runLog: [run(5, T1)] } });
  const phone = payload({ version: 4, sessions: [Object.assign({}, s1, { notes: "felt strong", updatedAt: T2 })],
    goals: [{ id: "g_1", text: "10 pull-ups", done: true, updatedAt: T2 }],
    running: { runLog: [run(6, T2)] } });
  const view = (i) => ({ notes: i.sessions[0].notes, done: i.goals[0].done, km: i.running.runLog[0].distanceKm,
    n: i.sessions.length + i.goals.length + i.running.runLog.length });
  const onDesk = view(M.mergePayload(phone, desk).ironframe);
  const onPhone = view(M.mergePayload(desk, phone).ironframe);
  const tieA = payload({ version: 4, sessions: [Object.assign({}, s1, { notes: "A", updatedAt: T2 })] });
  const tieB = payload({ version: 4, sessions: [Object.assign({}, s1, { notes: "B", updatedAt: T2 })] });
  const tie = M.mergePayload(tieA, tieB).ironframe.sessions;
  const want = JSON.stringify({ notes: "felt strong", done: true, km: 6, n: 3 });
  const ok = JSON.stringify(onDesk) === want && JSON.stringify(onPhone) === want &&
    tie.length === 1 && tie[0].notes === "B";
  return { ok, measured: "desktop " + JSON.stringify(onDesk) + ", phone " + JSON.stringify(onPhone) +
    ", tie keeps " + tie.map((x) => x.notes).join("+") };
});

/* A recovery block is a record with an id. Two devices union them, and ending
   one early (endedKey + updatedAt) on one device reaches the other. */
test("P4-sync", "Recovery blocks union by id; an early end travels", (M) => {
  const T1 = "2026-10-01T09:00:00.000Z", T2 = "2026-10-03T09:00:00.000Z";
  const blk = (id, extra) => Object.assign({ id, startKey: "2026-10-01", startedISO: T1, days: 7, reason: "asked", endedKey: null, updatedAt: T1 }, extra);
  const desk = payload({ version: 4, recoveryBlocks: [blk("rb_a", { endedKey: "2026-10-03", updatedAt: T2 })] });
  const phone = payload({ version: 4, recoveryBlocks: [blk("rb_a"), blk("rb_b", { startKey: "2026-10-09" })] });
  const view = (i) => i.recoveryBlocks.map((b) => b.id + ":" + (b.endedKey || "open")).sort().join(",");
  const onDesk = view(M.mergePayload(phone, desk).ironframe), onPhone = view(M.mergePayload(desk, phone).ironframe);
  const want = "rb_a:2026-10-03,rb_b:open";
  return { ok: onDesk === want && onPhone === want, measured: "desktop " + onDesk + ", phone " + onPhone };
});

function main() {
  let M;
  try { M = loadMerge(); } catch (e) {
    console.log("ERROR could not load js/syncmerge.js: " + e.message);
    return 2;
  }
  let failed = 0;
  CASES.forEach((c) => {
    const r = c.fn(M);
    if (!r.ok) failed++;
    console.log(c.id.padEnd(4) + " " + (r.ok ? "PASS" : "FAIL") + "  " + c.title + " -- " + r.measured);
  });
  console.log("\n" + (CASES.length - failed) + " pass, " + failed + " fail");
  return failed ? 1 : 0;
}

process.exit(main());
