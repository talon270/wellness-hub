#!/usr/bin/env node
/**
 * Checks fitness/coverage.js — which coverage slots a finisher or a
 * mini-session picks — against plan D3 and case V2.
 *
 *   node tools/check-coverage.js
 *   COVERAGE_JS=/path/to/other/coverage.js node tools/check-coverage.js
 *
 * Prints one `<case> PASS|FAIL — <what was measured>` line per case and exits 1
 * if any fails. The module is pure, so it runs in a bare vm sandbox with the
 * real training and muscle data beside it: no browser, no basalt.js, no clock.
 */

"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const target = process.env.COVERAGE_JS || path.join(root, "fitness/coverage.js");
const sandbox = { window: {}, console };
vm.createContext(sandbox);
for (const f of ["fitness/training.data.js", "fitness/training.js", "fitness/muscles.data.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), sandbox, { filename: f });
}
if (fs.existsSync(target)) vm.runInContext(fs.readFileSync(target, "utf8"), sandbox, { filename: target });
const W = sandbox.window, T = W.Training, SLOTS = W.TRAINING_DATA.SLOTS;
const C = W.Coverage;
const plain = (x) => JSON.parse(JSON.stringify(x));   // out of the vm's realm

/* -- fixtures ------------------------------------------------------------ */
const TODAY = "2026-10-07";                            // a Wednesday
const ALL = { pullupBar: true, dumbbells: true, bench: true, kettlebells: true, rings: true,
              bands: true, parallettes: true, dipBars: true, lowBar: true,
              vest: true, abWheel: true, jumpRope: true, box: true, barbell: true, nordicAnchor: true };
let seq = 1;
/* A session on `day` holding [exerciseId, values, extra] entries. */
function sess(day, entries) {
  return { id: "s_" + seq++, dayKey: day, dateISO: day + "T12:00:00.000Z", completed: true,
           exercises: entries.map(([key, values, x = {}]) =>
             Object.assign({ key, sets: values.map((v) => ({ reps: v, weight: 0 })), skipped: false }, x)) };
}
/* The app passes engine.prescriptionFor(slot).rx. This stand-in is the same
   rule for a slot with no record: its first entry point, if Training allows it. */
const rxFor = (ctx = { equipment: ALL }) => (slot) => {
  const id = SLOTS[slot].first.filter((x) => T.allowed(ctx, x))[0];
  return id ? T.startOf(id) : null;
};
const slotsOf = (picks) => picks.map((p) => p.slot).join(",");

/* -- runner --------------------------------------------------------------- */
let failed = 0;
function check(name, fn) {
  let ok, msg;
  try { [ok, msg] = fn(); } catch (e) { ok = false; msg = "threw: " + e.message; }
  if (!ok) failed++;
  console.log(`${name} ${ok ? "PASS" : "FAIL"} — ${msg}`);
}

if (!C) {
  console.log("V2 FAIL — window.Coverage is missing (" + path.relative(root, target) + ")");
  process.exit(1);
}

/* -- V2a: direct sets and shortfall ---------------------------------------
   Counts sets where the group is PRIMARY, logged in the last 7 days, value
   above 0, not skipped. Rows (biceps secondary) don't count for biceps. */
check("V2a-direct", () => {
  const sessions = [
    sess("2026-10-06", [["acc_curl_doorframe", [12, 12, 0]],           // 2 performed sets
                        ["pull_alt_tabledoor", [10, 10, 10]]]),        // biceps secondary only
    sess("2026-10-03", [["acc_curl_doorframe", [12, 12, 12], { skipped: true }]]),
    sess("2026-09-30", [["acc_curl_doorframe", [12, 12, 12]]]),        // 7 days ago: outside
    sess("2026-10-01", [["acc_antirot_sideplank", [30, 30]]])          // a per-side hold: 2 sets
  ];
  const st = plain(C.status(sessions, TODAY));
  const b = st.biceps, o = st.obliques, ub = st.upper_back;
  const ok = b.direct === 2 && b.floor === 6 && b.shortfall === 4 && b.lastDay === "2026-10-06" &&
             b.daysSince === 1 && o.direct === 2 && o.daysSince === 6 && ub.direct === 3 &&
             st.neck.direct === 0 && st.neck.daysSince === null && Object.keys(st).length === 22;
  return [ok, `biceps ${b.direct} of ${b.floor}, short ${b.shortfall}, last ${b.lastDay} (${b.daysSince} d); ` +
              `obliques ${o.direct} (${o.daysSince} d); upper back ${ub.direct}; neck ${st.neck.direct}, ` +
              `last ${st.neck.daysSince}; ${Object.keys(st).length} groups`];
});

/* -- V2b: today's planned direct sets reduce the shortfall ---------------- */
check("V2b-planned", () => {
  const st = plain(C.status([], TODAY, [{ id: "squat_1", sets: 3 }, { id: "acc_quad_wallsit", sets: 2 }]));
  const q = st.quads;
  return [q.direct === 0 && q.planned === 5 && q.shortfall === 1 && q.daysSince === null,
          `quads direct ${q.direct}, planned ${q.planned}, short ${q.shortfall}, last ${q.daysSince}`];
});

/* -- V2c: the 48 h rule ----------------------------------------------------
   A group trained directly today or yesterday is skipped; two days ago is
   fine. Today's PLANNED main work doesn't trigger it, or a full-body squat
   day could never top up quads. */
check("V2c-48h", () => {
  const sessions = [sess("2026-10-06", [["acc_curl_doorframe", [12]]]),    // yesterday
                    sess("2026-10-05", [["acc_lateral_iso", [20]]]),       // 2 days ago
                    sess("2026-10-07", [["acc_neck_chintuck", [10]]])];    // today
  const picks = plain(C.pick(sessions, TODAY, { rxFor: rxFor(), n: 15, planned: [{ id: "squat_1", sets: 3 }] }));
  const s = picks.map((p) => p.slot);
  const ok = s.indexOf("curl") < 0 && s.indexOf("neck") < 0 && s.indexOf("lateral") >= 0 && s.indexOf("quad") >= 0;
  return [ok, `curl ${s.indexOf("curl") >= 0 ? "picked" : "skipped"} (yesterday), neck ` +
              `${s.indexOf("neck") >= 0 ? "picked" : "skipped"} (today), lateral ` +
              `${s.indexOf("lateral") >= 0 ? "picked" : "skipped"} (2 d), quad ` +
              `${s.indexOf("quad") >= 0 ? "picked" : "skipped"} (planned squats only)`];
});

/* -- V2d: ranking — shortfall ÷ floor, then days since, then slot order ----
   No history: every coverage group is at 0 of its floor (ratio 1), never
   trained, so slot order decides. Then biceps at 5 of 6 falls to the back,
   and lateral, last trained 6 days ago, ranks behind the never-trained. */
check("V2d-rank", () => {
  const empty = plain(C.pick([], TODAY, { rxFor: rxFor() }));
  const cov = Object.keys(SLOTS).filter((k) => SLOTS[k].coverage);
  const sessions = [sess("2026-10-03", [["acc_curl_doorframe", [12, 12, 12, 12, 12]]]),
                    sess("2026-10-01", [["acc_lateral_iso", [20]]])];
  const full = plain(C.pick(sessions, TODAY, { rxFor: rxFor(), n: 15 }));
  const s = full.map((p) => p.slot);
  const ok = slotsOf(empty) === cov.slice(0, 4).join(",") && empty[0].reason === "Biceps: 0 of 6 direct sets this week" &&
             s[s.length - 1] === "curl" && s.indexOf("lateral") === s.length - 2 && s.length === 15;
  return [ok, `no history: ${slotsOf(empty)} ("${empty[0].reason}"); with history the last two are ` +
              `${s.slice(-2).join(", ")}, ${s.length} picks`];
});

/* -- V2e: deterministic ---------------------------------------------------- */
check("V2e-deterministic", () => {
  const sessions = [sess("2026-10-02", [["acc_calf_raise", [15, 15]], ["acc_shin_wall", [15]]]),
                    sess("2026-10-04", [["acc_grip_wring", [30, 30, 30]]])];
  const runs = [0, 1, 2].map(() => slotsOf(C.pick(sessions, TODAY, { rxFor: rxFor(), n: 15 })));
  const rev = slotsOf(C.pick(sessions.slice().reverse(), TODAY, { rxFor: rxFor(), n: 15 }));
  return [runs[0] === runs[1] && runs[1] === runs[2] && rev === runs[0], `${runs[0]} ×3, reversed history ${rev}`];
});

/* -- V2f: pins first ------------------------------------------------------
   A pin for today's weekday comes first, even when its group is above the
   floor or trained yesterday. A pin for another day, or with no days, is no
   pin. Pins aren't capped by n. */
check("V2f-pins", () => {
  const sessions = [sess("2026-10-06", [["acc_backext_birddog", [12, 12, 12, 12, 12, 12, 12]]])];
  const pins = { backext: { days: [3], at: "x" }, calf: { days: [1, 5], at: "x" }, neck: { days: [], at: "x" } };
  const p = plain(C.pick(sessions, TODAY, { rxFor: rxFor(), pins, n: 4 }));
  const many = { curl: { days: [3] }, lateral: { days: [3] }, reardelt: { days: [3] }, cuff: { days: [3] }, traps: { days: [3] } };
  const p5 = plain(C.pick([], TODAY, { rxFor: rxFor(), pins: many, n: 4 }));
  const ok = slotsOf(p) === "backext,curl,lateral,reardelt" && p[0].pinned === true &&
             p.slice(1).every((x) => !x.pinned) && p[0].reason.indexOf("Pinned") === 0 &&
             p5.length === 5 && p5.every((x) => x.pinned);
  return [ok, `${slotsOf(p)}; first "${p[0].reason}"; five pins with n 4 → ${p5.length} picks`];
});

/* -- V2g: only allowed prescriptions ---------------------------------------
   A slot whose prescription is null (avoided, excluded, off) is never picked:
   neck "avoid" takes out the neck slot, an excluded first rung the curl slot. */
check("V2g-allowed", () => {
  const ctx = { equipment: ALL, limitations: { neck: "avoid" },
                exclusions: { acc_curl_doorframe: { state: "excluded", at: "x" } } };
  const p = plain(C.pick([], TODAY, { rxFor: rxFor(ctx), n: 15 }));
  const s = p.map((x) => x.slot);
  const pinned = plain(C.pick([], TODAY, { rxFor: rxFor(ctx), pins: { neck: { days: [3] } }, n: 2 }));
  return [s.indexOf("neck") < 0 && s.indexOf("curl") < 0 && s.length === 13 && pinned[0].slot !== "neck" &&
          p.every((x) => x.rx && T.allowed(ctx, x.rx.exerciseId)),
          `${s.length} picks, neck ${s.indexOf("neck") >= 0 ? "in" : "out"}, curl ${s.indexOf("curl") >= 0 ? "in" : "out"}; ` +
          `a pinned neck slot ${pinned[0].slot === "neck" ? "picked" : "still out"}`];
});

/* -- V2h: groups at the floor aren't topped up ----------------------------- */
check("V2h-at-floor", () => {
  const sessions = [sess("2026-10-03", [["acc_curl_doorframe", [12, 12, 12, 12, 12, 12]]])];
  const st = plain(C.status(sessions, TODAY));
  const s = plain(C.pick(sessions, TODAY, { rxFor: rxFor(), n: 15 })).map((x) => x.slot);
  return [st.biceps.shortfall === 0 && s.indexOf("curl") < 0 && s.length === 14,
          `biceps 6 of 6, short ${st.biceps.shortfall}; curl ${s.indexOf("curl") >= 0 ? "picked" : "not picked"}, ${s.length} picks`];
});

/* -- V2i: equal shortfall, the longer-untrained group first ----------------
   Biceps and side delts both at 1 of 6; side delts last trained 6 days ago,
   biceps 3. Slot order alone would put curl first. */
check("V2i-days-since", () => {
  const sessions = [sess("2026-10-01", [["acc_lateral_iso", [20]]]),
                    sess("2026-10-04", [["acc_curl_doorframe", [12]]])];
  const s = plain(C.pick(sessions, TODAY, { rxFor: rxFor(), n: 15 })).map((x) => x.slot);
  return [s.indexOf("lateral") < s.indexOf("curl") && s.indexOf("curl") === 14,
          `lateral at ${s.indexOf("lateral")}, curl at ${s.indexOf("curl")} of ${s.length}`];
});

/* -- Y4: a conditioning slot runs only when pinned (plans/PLAN-yellow-dude.md
   A5). The real slot arrives with its exercises in Stage 2, so this injects a
   synthetic one and removes it after. It trains no group, so no shortfall can
   pick it; pinned for today, it is picked with group null. */
check("Y4-conditioning", () => {
  SLOTS.test_cond = { label: "Test conditioning", coverage: true, conditioning: true, trains: [],
                      first: ["push_1"], loaded: [] };
  try {
    const loose = plain(C.pick([], TODAY, { rxFor: rxFor(), n: 20 }));
    const pinned = plain(C.pick([], TODAY, { rxFor: rxFor(), n: 20, pins: { test_cond: { days: [3] } } }));
    const other = plain(C.pick([], TODAY, { rxFor: rxFor(), n: 20, pins: { test_cond: { days: [1] } } }));
    const row = pinned.filter((p) => p.slot === "test_cond")[0];
    return [!loose.some((p) => p.slot === "test_cond") && !other.some((p) => p.slot === "test_cond") &&
            !!row && row.group === null && row.pinned && pinned[0].slot === "test_cond" && /^Pinned for Wed — /.test(row.reason),
            `unpinned: ${loose.some((p) => p.slot === "test_cond") ? "picked" : "not picked"}; pinned Mon: ` +
            `${other.some((p) => p.slot === "test_cond") ? "picked" : "not picked"}; pinned Wed: ` +
            (row ? `picked first=${pinned[0].slot === "test_cond"}, group ${row.group}, "${row.reason}"` : "not picked")];
  } finally { delete SLOTS.test_cond; }
});

console.log(failed ? `${failed} FAILED` : "all passed");
process.exit(failed ? 1 : 0);
