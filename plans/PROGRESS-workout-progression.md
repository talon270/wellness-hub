# Workout progression — progress log

The hand-off between chat windows for `PLAN-workout-progression.md`. One entry per window, newest last.

Each entry covers:
- the date, window and step;
- the files changed, with their backups;
- the harness lines before → after;
- any deviation from the plan, and why;
- anything left for the next window.

Re-read the log before appending. Never edit another window's entry.

## 2026-10-01 · W1 · step 1.1 harness

**Files.** Added `tools/check-workout.py` (S1–S5, S8–S21) and `tools/check-syncmerge.js` (S6–S7). No existing file edited, so no backups. Nothing committed.

**Harness lines, untouched tree (commit `0d878b1`) — every case FAILS, 0 errors:**

| Case | Measured before | Plan's "Before" |
|---|---|---|
| S1 | 1 Oct streak done=False, dayKey=None | matches |
| S2 | BASALT 2 Oct, Hub 1 Oct, isRest at 05:00 on 2 Oct=False | matches |
| S3 | filed on 1 Oct, dayKey=None | matches |
| S4 | filed 2 Oct, isRest=False, lastKey/nextKey=None | new case |
| S5 | filed on 2 Oct, dayKey=None | new case |
| S6 | desktop keeps `s_desk+s_shared`, push_2 PR 25; phone keeps `s_phone+s_shared`, PR 20 | matches |
| S7 | version 3 | matches |
| S8 | onboarding=True, key changed, no copy, no banner | matches |
| S9 | key changed, no banner | matches |
| S10 | push +17, shoulder +13, dip +13, core +13 | matches |
| S11 | push Level 2, progress 0 | matches |
| S12 | push +13, skipped=None, 3 set inputs shown | matches |
| S13 | push L5 @8, pull L3 @5, squat L6 @12, core L5 @30, shoulder L4 @6, dip L4 @8 | matches |
| S14 | pull L6 Archer Pull-up | matches |
| S15 | Push-up target 10, "below target last session" | matches |
| S16 | Dragon Flag Negative target 7 | matches |
| S17 | rep ratio 0.667 | matches |
| S18 | 20, 20, 6, 6, 20, 6 | matches |
| S19 | 16 expected, 87.5% | matches |
| S20 | "moderate" x4 | matches |
| S21 | 3 sets, `_adaptSets` is a function | matches |

**Proof the cases can pass.** `HELTH_INDEX=<other index.html>` runs the browser harness against another copy of the app. Against a scratch copy (session scratchpad, not the project) with the one-line fixes for A3, A7, A14, A16, the evaluate floor and A11 applied, S10, S17, S18, S19, S20 and S21 PASS and S11 passes too (7 of 7). S1–S5, S8, S9, S12–S16 and S6–S7 were not run against a fix — their "after" conditions are unproven until the matching step lands, so a first FAIL there after a fix means check the harness as well as the fix.

**Deviations from the plan.**
- S4 fails before because the 03:00 session is filed on 2 Oct, not because the day-key arithmetic is wrong. It still guards the trap: after the fix it asserts `lastKey` 2026-10-01 and `nextKey` 2026-10-03 under rollover 6.
- S12's "no PR" check passes before the fix: the plan's fixture logs no push set, so no push PR exists. The case still fails on the other three checks.
- S6 also covers `flagsHistory`; goals and running logs are not in it. W2 inventories the arrays in `defaultState()`.
- S11, S15, S16, S17, S18, S19 and S21 seed state or call the engine directly, as the plan allows. S1–S5, S8–S10, S12–S14 and S20 use real clicks.
- Playwright's Python clock reads a bare number as seconds, not milliseconds; the harness passes datetimes.

**Left for the next window.** W2 (1.2 data safety): S6–S9 should go green. The banner text is matched by regex (`couldn.t be read`, `newer version`), so keep those phrases from the plan.

## 2026-10-01 · W2 · step 1.2 data safety

**Files.** Nothing committed.
- `js/syncmerge.js` (backup `js/syncmerge.backup-20261001-181557.js`): `mergeIronframe(file, local)` replaces `mergeFields(file.ironframe, local.ironframe, true)` in `mergePayload`.
- `fitness/basalt.js` (backup `fitness/basalt.backup-20261001-181557.js`):
  - `READ_ONLY` guard, `keepUnreadable()` and `renderReadOnlyBanner()` beside `load()`;
  - guards in `saveState`, `resetState`, `importData` and `completeSession`;
  - `bootstrap` and `reloadFromRemote` render the banner and skip onboarding;
  - `App.readOnly()` exported.

**Harness lines, before → after:**

| Case | Before (this tree, before editing) | After |
|---|---|---|
| S6 | FAIL — desktop keeps `s_desk+s_shared`, PR 25, flags `f_desk`; phone keeps `s_phone+s_shared`, PR 20, flags `f_phone` | PASS — both keep `s_desk+s_phone+s_shared`, push_2 PR 25, flags `f_desk+f_phone` |
| S7 | FAIL — version 3 | PASS — version 4 |
| S8 | FAIL (W1's run) | PASS — onboarding=False, key unchanged=True, copy saved=True, banner=True |
| S9 | FAIL (W1's run) | PASS — key unchanged=True, banner=True |

The full `check-workout.py` run after the change: 2 pass (S8, S9), 17 fail, 0 errors. Every failing case reads exactly as W1's "before" numbers, so nothing else moved.

**Extra checks** (scratch only: `w2_checks.py` and `merge_extra.js` in this session's scratchpad), 28 of 28 pass:
- **Merge:** goals and `running.runLog` union by id. `running.goal` keeps the non-empty side. A shared session id keeps the local copy, and a PR tie keeps the local record. The inputs are never mutated, a `running` present on one side only still unions, and a null local returns the file's copy.
- **Fresh profile:** onboard, then one workout. It saves, no banner, 0 errors.
- **Seeded v3 profile:** loads and logs a workout. The save stays version 3, 0 errors.
- **Banner:** unreadable and newer, in Selene (dark) and Selene Day (light), at 390, 1440 and 1920 px. Visible each time, no horizontal overflow, 0 errors. Screenshots checked by eye.
- **Blocked workout:** completing a workout while read-only keeps the draft in `ironframe.ui` and shows "this workout wasn't saved". The save key is unchanged.
- **Repeat loads:** reloading reuses the one `.unreadable-` copy instead of adding a second.
- **Sync, unreadable then readable:** `reloadFromRemote` with a readable save clears read-only and removes the banner.
- **Sync, newer save:** `reloadFromRemote` with a v4 save sets "newer" and shows the banner. That includes a fresh device in the middle of onboarding: the app replaces onboarding.

**`defaultState()` array inventory** (`basalt.js:99`):

| Array | Merge now | Why |
|---|---|---|
| `sessions`, `flagsHistory`, `goals`, `running.runLog` | Union by id, local wins a shared id | Every record carries an `s_` / `f_` / `g_` / `run_` id |
| `prs` | One per `exerciseId` + `kind`, the higher `value`; a tie keeps local | Each device mints its own `pr_` id. A PR with no `exerciseId` falls back to `exercise`, then to its id |
| `bodyweightLog`, `measurements`, `sleepLog`, `nutritionLog` | Whole, local wins (unchanged) | No ids. Already in the plan's Out of scope |
| `phaseHistory` | Whole, local wins (unchanged) | **Not covered by the plan.** No id. Its natural key is `number`, but two devices can each close a "phase 3" with different scores, so it needs a rule rather than a guess |
| `currentPhase.weighIns` | Whole, local wins (unchanged) | No id. It sits inside `currentPhase`, which has no per-record rule either |
| `running.runDays` | Whole, local wins (unchanged) | A setting, not a log |

**Deviations from the plan.**
- **Valid JSON that isn't an object** (`null`, a number) counts as unreadable too. `migrate()` would have quietly turned it into defaults, which is the A8 failure by another route.
- **The copy is reused,** not re-made: a load whose raw string matches an existing `.unreadable-` copy takes that key. Without this, every reload of a broken save adds another full-size copy until storage fills.
- **If the copy doesn't fit,** the banner says so instead of naming a key: "there wasn't room in storage to save a second copy". The original key is still untouched while read-only.
- **`completeSession` refuses** before `finalizeSession` runs. Otherwise the draft is cleared and the next toast says "Session logged" after a save that never happened. The sets stay in the draft.
- **`saveState()` toasts when it refuses** ("Not saved — fitness is read-only…"), at most once per 5 s. The plan said "write nothing". Writing nothing *silently* would let every other logging path (bodyweight, goals, nutrition) look like it worked.
- **BASALT's own `importData`** refuses a newer backup with a toast. A readable older or same-version backup clears read-only and is saved: it's the recovery the banner points to, and the raw copy already exists. The Hub's Settings import is unchanged: it writes the key and reloads, and the reload re-decides.
- **`reloadFromRemote`** checks whether `#app` is on screen, not `meta.onboarded`, because a read-only device shows the app over an un-onboarded default state.

**Left over, unconfirmed or out of scope:**
- **No copy, then a sync.** If the copy didn't fit and a sync then runs, `storage.js` `payload()` still reads the unreadable key as `null`, and the merge writes the remote copy over it. Not reproduced, and not fixed: it needs a broken save and a full localStorage at the same time.
- **An unreadable save shows the app on default state** ("Welcome back", Push Day, streak 0). The banner sits directly above it on every section. Showing nothing at all would hide the import path.
- **Other logging paths** (bodyweight, goals, nutrition) can still show their own success toast next to the "Not saved" toast. The save itself is blocked: the key stayed unchanged in S8 and S9.
- **For W3:** `fitness/basalt.js` grew by about 110 lines, so every line number the plan cites after line 300 is now about 110 higher. Grep for the function names instead of trusting the numbers.

## 2026-10-01 · W3 · step 1.3 training day

**Files.** Nothing committed. Backups are `<name>.backup-20261001-183414.js` for the first five files, and `tools/check-workout.backup-20261001-184406.py`.
- `js/core.js`: `dayOf(v)` sits beside `today()` and is exported as `Hub.dayOf`. `today()` is now `dayOf(Date.now())`, so the two rules can't drift apart.
- `fitness/basalt.js`:
  - `lib.today()` returns `Hub.today()`.
  - New `lib.sessionDay(s)` returns `s.dayKey || Hub.dayOf(s.dateISO)`, and `completedSessions()` sorts by it, then by `dateISO`.
  - `#begin-session` stamps `workout.dayKey = Hub.viewDate()`, and `finalizeSession` writes `dayKey: workout.dayKey || Hub.viewDate()`.
  - When the draft's day isn't today, the workout screen shows "Saving to Tue, 29 Sept · 2d ago" and the completion toast says "Session logged on Tue, 29 Sept."
  - Every reader below.
- `js/gamify.js:242` and `js/insights.js:179` read `s.dayKey || Hub.dayOf(s.dateISO)`. `js/insights.js:192` reads `Hub.dayOf(e.dateISO)`.
- `fitness/muscles.js`: its two session readers and two "now" reads. The plan doesn't name this file; see deviations.
- `tools/check-workout.py`: new case S5b, plus a runner fix (see deviations).

**Call sites, classified before editing.** Counted by occurrence with `grep -o`, so a line with two calls counts twice, and each helper's own definition counts once.

| Helper | Sites | Now | A session's day → `sessionDay` | Another record's day → `Hub.dayOf` | A timestamp of now, stored | Day-key arithmetic |
|---|---|---|---|---|---|---|
| `lib.today()` | 33 | 33 | | | | |
| `lib.dayKey(` | 38 | 1 | 7 | 18 | | 12 |
| `lib.iso()` | 12 | | | | 12 | |
| `todayLocal(` | 5 | 5 | | | | |
| `keyOf(` | 5 | | | | | 5 |
| **93** | | **39** | **7** | **18** | **12** | **17** |

- **Now (39): one edit, `lib.today()`'s body.** Its 33 callers follow it, and so do the 5 `todayLocal` sites, because `todayLocal` wraps `lib.today()`. The old body's own `lib.dayKey(Date.now())` is the one "now" in the `lib.dayKey(` row.
- **A session's day (7):**
  - `_bumpStreak`, which now takes the day key instead of a timestamp;
  - `restDayInfo` and `doneTodayInfo`;
  - `streakStripCard`, which counts twice (one line, two calls);
  - `heatStrip` and `buildCalendar`.
- **Another record's day (18):**
  - `relTime`;
  - nutrition ×2;
  - in both copies of the writers: bodyweight ×2, sleep ×2, and measurements ×1;
  - the sleep card and the sleep chart;
  - the phase start ×3 (`evaluate`, `reportHTML`, `drawEvalChart`) and the in-phase weigh-ins;
  - the run log ×4 (`logByDay`, `logRun` ×2, `thisWeekRuns`).
- **A timestamp of now (12), unchanged:** `lib.iso()` creates each `dateISO`, `startISO` and `endedISO`. The timestamp keeps the real time, and readers decide its day.
- **Day-key arithmetic (17), unchanged:** `lib.dayKey(lib.addDays(key, n))`, `weekStartKey`, `lastNDayKeys`, `weekKey`, `keyOf`, and the calendar grid's `lib.dayKey(dateObj.toISOString())`. That last one is a local midnight, so a rollover-aware reader would move every cell back a day.

**Session-day readers outside the five helpers, changed to the same rule:**
- `completedThisWeek`, `weeklyVolume` (`weekStartKey(sessionDay)`);
- `completedThisPhase` and the report card's session count (phase start via `Hub.dayOf`, session via `sessionDay`);
- `evaluate`'s in-phase filter;
- `relTime` in the last-session card, the session log and session detail;
- the notes archive's date.

`inPhase` now reads `Hub.dayOf`, so in-phase weigh-ins, sleep and flags follow the rollover too.

**Harness lines, before → after.** "Before" is the same script run against a scratchpad copy of W2's tree (`HELTH_INDEX`):

| Case | Before | After |
|---|---|---|
| S1 | FAIL — streak 1 Oct done=False, dayKey=None | PASS — done=True, dayKey=2026-10-01 |
| S2 | FAIL — BASALT 2026-10-02, Hub 2026-10-01, isRest at 05:00 on 2 Oct=False | PASS — BASALT 2026-10-01, Hub 2026-10-01, isRest=True |
| S3 | FAIL — filed on 2026-10-01, dayKey=None | PASS — filed on 2026-09-29, dayKey=2026-09-29 |
| S4 | FAIL — filed 2026-10-02, isRest=False, lastKey=None, nextKey=None | PASS — filed 2026-10-01, isRest=True, lastKey=2026-10-01, nextKey=2026-10-03 |
| S5 | FAIL — filed on 2026-10-02, dayKey=None | PASS — filed on 2026-10-01, dayKey=2026-10-01 |
| S5b (new) | FAIL — bodyweight entries [71.5, 72], nutrition entries after 3 calls 1. On the half-switch tree: FAIL — bodyweight [72], nutrition 3 | PASS — bodyweight [72], nutrition 1 |

Full `check-workout.py` run after the change: **8 pass, 12 fail, 0 errors**. S1–S5b and S8–S9 pass. S10–S21 fail with exactly the numbers they had before, line for line. `check-syncmerge.js` wasn't re-run, because `js/syncmerge.js` is untouched: sessions merge by id, so `dayKey` travels with its session.

**Extra checks.** These are scratch only, in this session's scratchpad (`w3_checks.py`), and 31 of 31 pass. They call `Hub.dayOf`, which doesn't exist before this change, so they have no "before" run; S1–S5b carry the before/after.
- **Trap 1, day keys:** with rollover 6, `Hub.dayOf("2026-10-01")` is still 2026-10-01, and a 03:00 timestamp on 2 Oct gives 2026-10-01. On the calendar at 12:00 on 2 Oct, the visible today cell is "2" and the trained cell is "1".
- **Trap 2, records created now:** at 00:30 with rollover 4, three `todayNutrition()` calls give one entry, on 1 Oct. Bodyweight logged twice through clicks gives one entry (72 kg). Two runs give one, keyed 1 Oct.
- **The notice:**
  - absent for a workout begun today;
  - shown when the workout begins while backfilling 29 Sep;
  - still shown after a reload, which resets the logging date to today;
  - the toast reads "Session logged on Tue, 29 Sept.";
  - begun at 23:50, shown after midnight.
- **The notice on screen:** visible and inside the viewport in Selene and Selene Day at 390, 1440 and 1920 px, with no horizontal overflow and 0 errors. Screenshots were checked by eye.
- **Backfill:** 29 Sep (backfilled), then 1 Oct, then 30 Sep (backfilled, via "Train again anyway").
  - Saved `dayKey`s: 29 Sep, 1 Oct, 30 Sep.
  - `completedSessions()` order: 29, 30, 1.
  - BASALT streak: count 2, last 1 Oct, live 2.
  - The Hub counts fitness done on all three days.
  - 2 Oct is the rest day, with lastKey 1 Oct.
- **Legacy session:** no `dayKey`, finished 05:00 IST (`2026-09-30T23:30:00.000Z`), seeded into a real v3 save.
  - At 12:00 on 1 Oct: done today, Hub done 1 Oct (not 30 Sep), insights volume 42 on 1 Oct, weight 70 on 1 Oct.
  - The Muscles view renders with 0 errors.
- **Seeded v3 save:** logs a workout; the save gets `dayKey` 2026-10-01, stays version 3, 0 errors.
- **The 05:00 workout on the BASALT calendar** (probe): trained on 1 Oct. It was already 1 Oct before the change, since BASALT used the local date; the part that was wrong was the Hub streak, which S1 covers.

**Deviations from the plan.**
- **`Hub.dayOf` returns a bare `YYYY-MM-DD` unchanged.** Trap 1 is closed by construction, not by every caller remembering it. `relTime` and `inPhase` receive both timestamps and keys.
- **`fitness/muscles.js` changed too.** It read sessions with `lib.dayKey(x.dateISO)` and "now" with `lib.dayKey(lib.iso())` — the same class, one file over. Leaving it would put the muscle map's recency a day off the rest of the app.
- **Session readers beyond the 93** are listed above. They answer "which day was this workout", so they follow the plan's "every reader" rule.
- **`_bumpStreak` takes the day key.** A day backfilled to before the streak's last day returns early: the counter can't insert into the past, and moving `lastISO` back would break a live streak. The Hub's streak recounts from session days and does include that day. This is marked with a `ponytail:` comment.
- **The completion toast names the day when it isn't today,** using `Hub.dayWord`, the Hub's own helper for exactly that.
- **New harness case S5b** for trap 2, which the plan lists without a case. Before the change it fails on bodyweight (two entries). On a "half-switch" scratch tree (`lib.today()` switched, `todayNutrition`'s reader not), it fails on nutrition. After the change it passes.
- **Runner fix in `tools/check-workout.py`.** `--only` upper-cased the requested ids but not the registered ones, so `S5b` never ran, and an empty selection printed "0 pass, 0 fail" with exit code 0. Ids now compare case-insensitively, and an unknown id exits 2.
- **The notice reuses W2's `wh-advice wh-advice--warn` classes,** so it already has both themes.

**Left over, unconfirmed or out of scope:**
- **PRs and flags from a backfilled workout carry the save time.** `_checkPR` and `flagsHistory` take `session.dateISO`, so a PR set in a workout backfilled to 29 Sep shows "today", and its flag counts in the phase by save time. Source only, not reproduced.
- **The running streak has no backfill guard.** `run._bumpStreak` moves `lastISO` back when a past run is logged. This predates W3: the run dialog already accepted past day keys. Not reproduced.
- **The rest and done-today gates follow today, not the logging date.** To backfill a session after training today, you click "Train again anyway". Seen while running the backfill check; unchanged.
- **Key → Date helpers parse keys as UTC midnight.** `lib.parse("2026-10-01")` is UTC midnight, so `lib.addDays`, `lib.fmtDate` and `weekStartKey` read a key a day early in timezones west of UTC. IST is unaffected. Source only, not reproduced.
- **Fitness keeps a hidden earlier render of the training calendar** (two `#cal-inner` in the DOM). A harness that queries `.cal-day--today` should filter to visible elements.
- **For W4:** `basalt.js` grew by another 29 lines (8,478 → 8,507), so grep for function names rather than trusting line numbers. The README entry for the training-day rule (1.4 close-out) can use S1's numbers. A 05:00 IST workout is `23:30Z` the day before, so the UTC slice filed it on 30 Sep.

## 2026-10-01 · W4 · step 1.4 training fixes and close-out

**Files.** Nothing committed. Backups are `<name>.backup-20261001-185221.<ext>`, taken before the first edit.
- `fitness/basalt.js` (8,507 → 8,565 lines): every finding below.
- `README.md`: three new entries in "The things most habit trackers get wrong" — the training-day rule, the sync rule and the deload floor — each with the numbers from Part A and its limits stated inline.
- `service-worker.js`: `CACHE_VERSION` v40 → v41. Stage 1 adds no files, so `PRECACHE` is unchanged.
- No change to `tools/check-workout.py`, so no backup of it.

**What changed, by finding** (function names, since line numbers moved):

| Finding | Change |
|---|---|
| A3 | `_progress`: `if (!hit) return null;` after `hit` is computed |
| A4 | New `engine.flagged(ex)` (any pain flag) and `engine.skipped(ex)` (sharp). Flagged exercises are skipped in `finalizeSession`'s progression loop and PR loop, in `_adaptTarget`'s history and in `evaluate`'s rep ratio. Sharp saves `skipped: true` with zeroed sets and a `null` rating, hides the set inputs and the rating buttons, and shows the substitution's cue under a "Skipped today · <part>" badge. "SAFE SWAP" → "Suggested swap" ("Suggested — skip it" and a "Skip it today" button on sharp). `doSwap` restarts the target when the unit changes (`holdStart` / `BASE_REPS`) |
| A5 | `PLACEMENT_CAP` beside `computePlacement`: push 2, pull 3, squat 3, core 3, hinge 3, shoulder 2, dip 1. `finishOnboarding` sets `repsTarget` for any tier placed above L1 the way a level-up does |
| A6 | `_adaptTarget` matches history on `ex.key === movementFor(pattern).id`; `cur` is computed before the filter. `evaluate` drops `Math.max(target, 30)` |
| A7 | `applyAdvancement`: `Math.min(base, Math.max(isHold ? 20 : 6, round(base × 0.75)))` |
| A11 | `DAYS_PER_WEEK = 4` replaced by `SESSION_GAP_DAYS = 2`; `expectedSessions` uses `Math.ceil(dur / SESSION_GAP_DAYS)`. Copy: the "This week" tile, the phase card's pace line, the "Inconsistent attendance" flag and the Program badge now say "every other day" |
| A14 | `finalizeSession` saves `ex.difficulty \|\| null` |
| A16 | `_adaptSets`, its call and `setCountDelta` (its two readers in `renderActive`) deleted |

**Harness lines, before → after.** "Before" is the same script against a scratchpad copy of W3's tree, taken before the first edit (`HELTH_INDEX`); "after" is the live tree.

| Case | Before | After |
|---|---|---|
| S1–S5b, S8, S9 | PASS | PASS, same numbers |
| S10 | FAIL — push +17, shoulder +13, dip +13, core +13 | PASS — push +17, shoulder +0, dip +0, core +0 |
| S11 | FAIL — push Level 2, progress 0 | PASS — push Level 1, progress 0 |
| S12 | FAIL — push +13, skipped=None, 3 set inputs | PASS — push +0, skipped=True, 0 set inputs, 0 PRs under push_1 |
| S13 | FAIL — push L5 @8, pull L3 @5, squat L6 @12, core L5 @30, shoulder L4 @6, dip L4 @8 | PASS — push L2 @12, pull L3 @8, squat L3 @14, hinge L3 @14, core L3 @15, shoulder L2 @8, dip L1 @8 |
| S14 | FAIL — pull L6 Archer Pull-up | PASS — pull L3 Negative Pull-up |
| S15 | FAIL — Push-up 10, "below target last session" | PASS — 12, no reason |
| S16 | FAIL — Dragon Flag Negative 7 | PASS — 5 |
| S17 | FAIL — rep ratio 0.667 | PASS — 1.000 |
| S18 | FAIL — 20, 20, 6, 6, 20, 6 | PASS — 15, 10, 5, 5, 20, 6 |
| S19 | FAIL — 16 expected, 87.5% | PASS — 14 expected, 100.0% |
| S20 | FAIL — "moderate" ×4 | PASS — null ×4 |
| S21 | FAIL — 3 sets, `_adaptSets` is function | PASS — 3 sets, `_adaptSets` is undefined |

Before: **8 pass, 12 fail, 0 error**. After: **20 pass, 0 fail, 0 error**. `check-syncmerge.js` 2 of 2 and `check-muscle-map.js` OK (84 exercises, 14 groups), both on the live tree.

**Extra checks** (scratch only, `w4_checks.py` and `w4_visual.py` in this session's scratchpad), 26 of 26 plus 9 of 9. They have no "before" run: they read fields that don't exist before this change.
- **Fresh profile:** onboard, one workout, 0 errors. All-zero tests keep every L1 default (push 8, pull 5, squat 12, hinge 12, core 30, shoulder 6, dip 8).
- **Seeded v3 profile** (a legacy session with `difficulty: "moderate"`, no `dayKey`, no `skipped`): loads and logs, version stays 3, the legacy fields are untouched, 0 errors. The session log reads "just right" for the legacy session and "not rated" for new ones.
- **Moderate flag** (wrist): the exercise relabels to Knuckle/Parallette Push-up, the 3 set inputs stay, and it earns +0, no PR and `skipped: false`.
- **Sharp flag:**
  - no set inputs, no rating buttons, the cue is shown and the name is kept;
  - a workout whose only typed values are in the skipped exercise is refused ("log at least one set");
  - Clear brings the inputs and the real name back, and a mild flag then Clear restores the name;
  - a value typed before flagging saves as 0, and the session volume is 6, the plank alone;
  - `flagsHistory` still records the flag;
  - the session detail reads "skipped — pain flag".
- **Swap:** plank → Dragon Flag Negative restarts at 5 reps (not 30), → Tuck L-Sit at 15 s, and hold → hold keeps the target.
- **Flagged history:** two flagged sessions of 14 × 3 leave the Push-up target at 8 and the rep ratio at 0; the same history unflagged raises it to 10 ("well past target").
- **Placement:** tests of 10, 0, 12 s, 8 and 0 place push L2 @12, pull L1 @5, squat L2 @14, hinge L2 @14, core L2 @15, shoulder L2 @8 and dip L1 @8.
- **Backup and restore:** BASALT's own export → reset → import keeps `dayKey` (2026-10-01), `skipped` and the flag, and the version.
- **Themes and widths:** the skipped exercise block in Selene and Selene Day at 390, 1440 and 1920 px — badge visible, no horizontal overflow, 0 errors. Screenshots checked by eye at 390 px (dark) and 1440 px (light).
- **Offline:** served over HTTP with the service worker allowed, the only cache is `wellness-hub-v41`; after a reload under the worker and then with the network off, the Hub and `App.engine.flagged` load and there are 0 errors.

**Deviations from the plan.**
- **`DAYS_PER_WEEK` is gone, not edited.** Its only readers were the four copy sites and `expectedSessions`; the 4 was the rotation length, not a pace. `SESSION_GAP_DAYS` replaces it. The Program view still says "A rolling 4-day rotation", which is true of the rotation.
- **The "This week" tile no longer shows x/4.** At every other day a calendar week holds 3 or 4 sessions, so it shows the count and reads "on pace" from 3.
- **Sharp keeps the exercise's own name.** The flag panel's apply handler used to relabel it "Skip push pattern today"; the saved record should say which movement was skipped. Clear on any flag now restores the real name (`restoreName`), which the plan doesn't name — Clear used to leave a relabelled name on an unflagged exercise.
- **A skipped exercise saves zeroed sets and a `null` rating,** and `sessionVolume` and `completeSession`'s "log at least one set" check ignore it. Without that, a value typed before flagging sharp would still count as volume and let an empty workout save.
- **The session detail reads "not rated" for `null` and "skipped" for skipped.** The plan names only the save. Without this, A14's `null` would render as "just right".
- **A flagged exercise is any flag, not only sharp.** The plan lists "a flagged exercise" for the four readers; the sets of a mild or moderate swap are a different movement too (C2 above).
- **`_adaptSets` removal also removed `setCountDelta`** and its two lines in `renderActive`, which could only ever read 0.
- **README: three entries, as named.** A3, A4, A11 and A5 changed what you see but have no entry; add them if you want the section to cover Stage 1 whole.
- **The cue shows twice on a skipped exercise** (under the badge, and inside the closed "Form cues" panel). The panel is the plan's "in place of the original cues"; the visible line is needed because the inputs it replaces are gone.

**Left over, unconfirmed or out of scope:**
- **`evaluate` still compares every session's reps to the current tier's `repsTarget`,** whatever movement it was. After a level-up mid-phase, last week's wall push-ups (20) read against the Push-up target (12). Same class as A6, source only, not reproduced. Stage 2 replaces the report.
- **A swap still credits the tier.** `doSwap` keeps the pattern, so a swapped exercise still advances the tier's points. Not flagged, so `engine.flagged` doesn't catch it; the plan's "swapping to real exercise ids" is Stage 2.
- **The pace tile's 3 is one constant in a copy string,** not a named value. It is the fewest sessions a full week holds at every other day.
- **Not run:** the Android and desktop shells, and a 300-session profile. Nothing in this step changes how many sessions are read.
- **For R1:** `fitness/basalt.js` is 8,565 lines, so every number in the plan after line ~2,100 is stale. Re-run `tools/check-workout.py` (20 cases) and the syncmerge and muscle-map checks.

## 2026-10-01 · R1 · step 1.5 review

**Files.** No code changed. This entry is the only edit. Scratch scripts are in this session's scratchpad: `r1_sync.js`, `r1_browser.py`, `r1_streak.py`.

**Harnesses on the live tree:** `check-workout.py` 20 pass, 0 fail, 0 error; `check-syncmerge.js` 2 of 2; `check-muscle-map.js` OK (84 exercises, 14 groups). Every number matches W4's "after" column.

**Driven by clicks, 0 page errors:**
- Sharp wrist flag on Wall Push-up with 10 typed first. The button reads "Skip it today", and it leaves 0 set inputs, 0 rating buttons and one "Skipped today" badge. It saves `skipped: true`, zeroed sets, `difficulty: null`, volume 30 (the plank alone) and `dayKey` 2026-10-01. Session history reads "skipped".
- Moderate flag, then Clear: the name goes to Knuckle/Parallette Push-up and back to Wall Push-up, and the 3 inputs return.
- Truncated save: the banner names `…unreadable-20261001-180000`, onboarding doesn't open, and a completed workout is refused. The key is unchanged.

**Findings, ranked:**

| # | Label | Finding | Measured | Smallest fix |
|---|---|---|---|---|
| R1-1 | BUG (medium), new in 1.2 | Re-logging a run on the same day doubles it after a sync. `logRun` replaces the day's run under a new id, and union-by-id brings the old one back | Same script, HEAD vs tree: 1 run / 6 km → **2 runs / 11 km** on 30 Sep | `logRun` reuses the replaced record's id, so the union collapses it |
| R1-2 | INCONSISTENCY (medium), visible since 1.2 | The BASALT streak doesn't follow merged sessions. `streak` merges field-wise with local winning, while `sessions` now union | Phone trained Mon 28 Sep, desktop Wed 30 Sep, merged. On Fri 2 Oct the Streak tile reads **0**, but the Hub counts 30 Sep done | Recount `s.streak` from `sessionDay`s on load. This also closes W3's backfill `ponytail:` note |
| R1-3 | INCONSISTENCY (medium), pre-existing | Session edits (volume, notes: session log → Edit) and goal toggles never reach the other device. The new `mergeIronframe` comment says BASALT edits a session "in exactly one place (deleting it)", which is wrong | Identical before and after: desktop notes `""`, goal `done: false` | Stamp `updatedAt` in the three writers and let `unionById` prefer the newer one, tie → local (the Hub's `mergeById` rule) |
| R1-4 | DESIGN RISK (medium) | A deleted session keeps coming back. It doesn't stop "until both have synced", as the README and plan say: it returns until it is deleted on every device | Both devices hold `s_bad`, the phone deletes it, desktop then phone sync: the phone has `s_ok,s_bad`. At HEAD it stayed deleted, but sessions weren't shared then | Correct the README sentence and the plan's decision row. Tombstones stay out of scope unless you say so |

**Not run:** the Android and desktop shells, a 300-session profile, and offline (W4 ran it). Light theme was checked by W2 and W4, not by R1.

**Before committing Stage 1:** the tree also holds 12 `PLAN-*.md` files moved into `plans/` (git sees deletions plus an untracked folder), 19 deleted tracked backups and `tools/__pycache__/`. `TODO.md` still links the old root `PLAN-` paths.

## 2026-10-01 · R1 follow-up · R1-1 fix and README wording

**Files.** Nothing committed. Backups: `fitness/basalt.backup-20261001-192042.js`, `README.backup-20261001-192042.md`.
- `fitness/basalt.js`, `run.logRun`: re-logging a day reuses the id of the run it replaces, instead of minting a new `run_` id.
- `README.md`: the sync entry now says a deleted session "comes back from any device that still has it, and keeps coming back until you delete it on every device".

**Proof** (`r1_fix_run.py` in this session's scratchpad). The script logs 5 km on 30 Sep through the Running dialog, then 6 km on the same day, then runs a desktop → phone round trip through `Hub.syncMerge`. "Before" is a scratchpad copy of the tree with the backup `basalt.js` (`HELTH_INDEX`):

| | Runs on 30 Sep | km |
|---|---|---|
| Before | 2 | 11 |
| After | 1 | 6 |

0 page errors in both runs. Regression on the live tree: `check-workout.py` 20 pass, 0 fail, 0 error; `check-syncmerge.js` 2 of 2; `check-muscle-map.js` OK.

**Limit, stated plainly.** The fix stops the double count but doesn't converge. Same id means each device keeps its own copy, local winning, so the desktop still shows 5 km. Convergence needs R1-3's `updatedAt` rule.

**Not changed:** the old "until both have merged" wording in `PLAN-workout-progression.md` (lines 26, 54, 618). Only the README was asked for.

## 2026-10-01 · W5 · step 2.1 catalogue and data

**Files.** Nothing committed. Backups are `<name>.backup-20261001-193226.<ext>`, taken before the first edit.
- `fitness/training.data.js` (new, 328 lines): `window.TRAINING_DATA` with `SLOTS`, `EXERCISES` (all 86), `RANGES`, `HOLD_RANGES`, `SETUPS`, `SUBSTITUTION_IDS`, the C1/C2 constants and `rangeFor(id)`.
- `fitness/basalt.js`: `push_incline` and `squat_split` appended to Part 7's `EXTRA` block (cues, mistakes, readiness, injury).
- `fitness/muscles.data.js`: a map row for each new id; "84" → "86" in three comments.
- `fitness/phases.data.js`: a five-phase entry for each new id.
- `tools/exercise-ids.tsv`: +2 rows. `README.md`: "84" → "86" in the muscle-map entry.
- `tools/check-training-data.js` (new).
- Not touched: `index.html`, `service-worker.js`. Loading the new file, `PRECACHE` and `CACHE_VERSION` are step 2.5, so the edited shipped files (`basalt.js`, `muscles.data.js`, `phases.data.js`) won't reach an installed copy until then.

**Harness lines.**

| Check | Before | After |
|---|---|---|
| `check-muscle-map.js` | OK, 84 exercises, 14 groups | OK, 86 exercises, 14 groups |
| `check-training-data.js` | did not exist | OK, 8 sections, exit 0 |
| `check-workout.py` | 20 pass (R1) | 20 pass, 0 fail, 0 error |
| `check-syncmerge.js` | 2 of 2 | 2 of 2 |
| App load, fresh profile | not run | 86 exercises, both new ids in DB, muscle map and phase map, 0 page errors |

**Proof the new check can fail.** Seven deliberate breakages, each in a scratch copy: a `next` typo, a deleted entry, the plan's spelling of a substitution name, a drifted hold range (`core_4` 10–25 against the engine's 10–20), a wrong equipment list, a slot with no equipment-free option and no `none`, and a misspelled muscle group in a phase entry. All seven exit 1 with a line naming the cause.

**Deviations from the plan.**
- **"Negative Pull-up" is `"Negative Pull-up (slow)"`.** C3's substitution table uses a name that isn't in `SUBSTITUTIONS`; the check caught it. The key is the DB's spelling and still maps to `pull_3`.
- **Five fields the plan doesn't name,** needed to walk a slot:
  - `next` is an array, because C3 has "or" steps (`pull_2` → `pull_3` or the band pull-up; `dip_1` or the chair dip → two-chair or bar dip).
  - `offer` holds the optional branch entries a main exercise shows when mastered (T7's "L-Sit offered").
  - `SLOTS[slot].first` lists the entry points, `.loaded` the weighted options, and `.none` is the explicit "no equipment-free option" (pull only).
- **`branch: "skill"` covers variations as well as `skill_*`.** Wide Push-up, Cossack Squat, Passive Hang and similar sit off the path and are optional, and the plan allows only `main | skill`.
- **Loaded options aren't on a `next` chain.** The e2 movements are `main`, `kind: "loaded"`, listed in `SLOTS[slot].loaded`. Whether they replace or sit beside the bodyweight path is W8's call.
- **`equipment` allows any-of.** `squat_6` and `squat_e2_goblet` list two implements in the DB; they are `[["dumbbells", "kettlebells"]]`, one of the two. The check compares the flattened tokens to the DB.
- **Two numbers are not from the engine.** `pull_alt_passivehang` (30–60 s) and each `SKILL_STANDARD_SEC` come from the DB's `readiness` text; where it names no number (full planche, full front lever, back-to-wall handstand, V-sit) the standard is `null` and the card never offers a step from it. Taking the upper end of "15–20 s" and "20–30 s" is my choice.
- **`EVIDENCE_SESSIONS` and `READY_EFFORTS` are in the data file** (decision row: "change the constants in `training.data.js`"). `READY_EFFORTS` is `["easy", "moderate"]`, because "Just right" is stored as `moderate`.
- **The check also validates all 14 existing phase entries,** not only the new two. They were already well formed.

**Left for the next window.**
- **54 of 65 substitution names keep the original exercise,** as the plan says. Several are the same movement at a different setup, load or range, and could map to a real id if you want them to earn evidence: `Inverted Row (high)` and `(feet down)` (`pull_alt_australian`), `Dumbbell Floor Press` (`push_e2_dbpress`), `DB Overhead Press` (`shoulder_e2_ohp`), `Kettlebell Swing (light)` (`hinge_e2_swing`), `Bench Dip (…)` ×5 (`dip_1`). Not mapped: it changes which sessions count as evidence, so it is your call.
- **`squat_split` is drawn with the bilateral squat rig.** The rig is per pattern; the phase text says so. A split-stance rig would be new art.
- **Nothing renders the two new movements yet.** They aren't on a skill track, so the guide modal reaches them only by id. Not driven by clicks; there is no screen to drive until 2.5.
- **For W6:** read ranges through `TRAINING_DATA.rangeFor(id)` and steps through `SETUPS` (easiest first, the list's end falls to `next`). Loaded step size is `LOAD_STEP_KG` for whichever owned implement appears in `equipment`.

## 2026-10-01 · W6 · step 2.2 progression rules

**Files.** Nothing committed. Two new files, no existing file edited, so no backups.
- `fitness/training.js` (new, 258 lines): `window.Training` with `comparable`, `exposures`, `recommend` and `startOf`. Pure: it reads only `window.TRAINING_DATA` and its arguments. No DOM, no storage, no `App`, no `Hub`, no clock.
- `tools/check-training.js` (new): T1–T10, plus 13 C2 cases the T cases don't reach. `TRAINING_JS=<path>` runs it against another copy.
- Not touched: `index.html`, `service-worker.js`. Nothing loads `training.js` yet; that is step 2.5.

**Harness lines.**

| Check | Before | After |
|---|---|---|
| `check-training.js` | did not exist | 23 pass, 0 fail, exit 0 |
| `check-training-data.js` | OK (W5) | OK, exit 0 |
| `check-muscle-map.js` | OK (W5) | OK |
| `check-syncmerge.js` | 2 of 2 | 2 of 2 |
| `check-workout.py` | 20 pass (W5) | not re-run: no file it loads changed |

The T lines, as printed:
- T1 ready, setup → `push_incline` chair, evidence 2026-09-24 + 2026-09-27
- T2 repeat, below-top, set 2 below 12
- T3 repeat, effort
- T4 repeat, one-session, 1 comparable of 2
- T5 repeat, same-day
- T6 repeat, one-session, 1 comparable at chair
- T7 ready, no step, optional: `core_4`, `skill_lsit_1`
- T8 09-29/s_900, 10-01/s_400, 10-01/s_500
- T9 2 comparable from 3 records
- T10 reduce, setup → table, totals 34 → 30 → 27

**Proof the check can fail.** There is no "before" for a new module, so the check was run against ten scratchpad copies of `training.js`, each with one rule removed. Every copy fails at least one case:

| Rule removed | Caught by |
|---|---|
| Different days | T5 |
| Flagged excluded | T4 |
| Dedupe by session id | T9 |
| Order by day first | T8 |
| Effort in `READY_EFFORTS` | T3, C2-effort |
| Same setup | T6 |
| Equipment owned | C2-equipment |
| No `rx` = not evidence | C2-legacy |
| Reduce needs three sessions | T2, C2-blank-set |
| Decision key includes the session id | C2-decision |

**Deviations from the plan.**
- **`recommend` returns codes, not sentences.** It returns `why` (ready, declining, no-history, one-session, same-day, below-top with `belowSet` and `hi`, effort, no-standard), `atTop` ("1 of 2 at 3 × 12"), `history` and `evidence` with their day keys. The card's wording and date format are C5, step 2.5.
- **Reduce reads as three sessions with two drops.** T10 says "two declining comparable sessions", and C2 says "each of the two most recent… totals less than the one before it". Three sessions satisfy both. With two sessions and one drop, the answer is Repeat (T2).
- **Same day is strict.** If the two most recent comparable sessions fall on the same day, the offer waits until a session on another day. It errs toward Repeat.
- **Ready can come with no step.** At the end of a path, or when the next movement needs equipment you don't own, the action is still `ready`: the evidence is real. In that case `step` is null, `options` lists the optional branches you own, and `unowned` lists the successors you can't do.
- **Readiness is judged against the current prescription's range,** not the range saved in each session. Comparable doesn't include the range, because the plan's list doesn't. When Stage 3's goals change a range, older sessions get judged against the new top. W10 decides whether range joins the comparable key.
- **Stepping back** goes to the previous setup, then −one load step, then a predecessor at its hardest setup. Where there are several predecessors (`pull_3` or `pull_alt_bandassist` before `pull_4`), it picks the one trained most recently. There is no step back from the first movement of a path, so the answer there is Repeat.
- **The load step follows the first owned implement** in the exercise's list. The setup doesn't record which implement was held, so a goblet squat with both owned steps by kettlebell (+4 kg).
- **Sessions without `dayKey` fall back to the local calendar date,** without the rollover hour. That covers un-migrated input only: Stage 1 writes `dayKey`, and 2.3 writes it onto legacy sessions.
- **No recovery-block exclusion.** No recovery record exists until 3.2. This is marked with a `ponytail:` comment in `comparable`.
- **"Not sure" has no stored value yet.** Any effort outside `READY_EFFORTS` reads as unknown, so 2.5 can pick the value (the check uses `"unsure"`).

**Not run:** no browser. The module isn't loaded by the app until 2.5. It runs in a bare `vm` sandbox, which is also what proves it pure.

**For W7 (2.3):**
- Each session exercise needs `rx: { exerciseId, setup, sets, range, unit, acceptedAt, why }`. `exposures` matches on `rx.exerciseId`, else on `key`.
- `setup` is `{}` when nothing changes difficulty. `startOf(id, { setup, loadKg, why, at })` builds a fresh prescription.
- `decisions` is a flat map, `"<exerciseId>|<sessionId>" → { choice, at }`, as C2 describes.

**For W8 (2.4):** call `recommend(sessions, rx, { equipment: APP_STATE.equipment, decisions })`. A swap to a real id must save `rx.exerciseId` as that id, or its history stays with the original exercise.

## 2026-10-01 · W7 · step 2.3 schema v4

**Read this first: the Stage 1 release has to carry this window's `js/syncmerge.js`.** A Stage 1 device running W2's merge corrupts v4 prescriptions on its second sync, and a v4 device that pulls its file afterwards adopts the corrupted one. Measured below (T13). This window's merge is inert on v3 saves: S6 and S7 pass, and a v3-only merge adds no `training` key. Separately, Stage 1 is still uncommitted (HEAD `0d878b1`). A device on `0d878b1` has no read-only guard at all, so A9's protection exists only once Stage 1 reaches every device before any v4 build does.

**Files.** Nothing committed. Backups are `<name>.backup-20261001-195922.<ext>`, taken before the first edit.
- `fitness/basalt.js` (8,585 → 8,653 lines):
  - `SCHEMA_VERSION` 4, and `defaultState().training = { slots: {}, decisions: {}, assessment: null }`;
  - `toV4()` in `migrate()`, after `repairTargets`, plus `slotsFromTiers()`, exported as `App.slotsFromTiers`;
  - `healState` repairs a malformed `training`;
  - `importData` migrates before it lifts read-only;
  - `finishOnboarding` writes slots.
- `js/syncmerge.js`: `mergeTraining()`, called from `mergeIronframe`.
- `fitness/training.js`: the read-time effort rule in `exposures`.
- `index.html`: loads `fitness/training.data.js` and `fitness/training.js` before `basalt.js`.
- `service-worker.js`: both files are in `PRECACHE`, and `CACHE_VERSION` goes v41 → v42.
- `tools/check-workout.py`: new T11 and T12. S9 now seeds the build's version + 1, where it had a literal 4.
- `tools/check-syncmerge.js`: new C6 and T13, and a `SYNCMERGE_JS=<path>` override like `HELTH_INDEX`.
- `tools/check-training.js`: new C6-legacy-effort.
- `tools/fixtures/v3-midworkout.json` (new, 9.6 KB): `ironframe.state.v1` and `ironframe.ui` as the Stage 1 build wrote them, captured by real clicks.
  - Onboarded with tests 10 / 0 / 12 s / 8 / 0, and one workout on 28 Sep.
  - A push workout begun 07:30 IST on 1 Oct, with sets 11, 10 and 7 logged and not finished.
  - It holds no `rx` and nothing personal: the profile is blank.

**What the migration does.**

| Part | Rule | Why this way |
|---|---|---|
| Slots | One per tier, `Training.startOf("<pattern>_<level>")`: that exercise's range, 3 sets, `why: "carried over from Level N"`, `acceptedAt: null`. No row slot | `null` because nobody accepted it. Stamping the migration time would let a device that upgrades later outrank a step-up already accepted on another device |
| Existing slots | Kept | A v3 save can already hold v4 slots if an older build merged a v4 file into it. Additive is what makes "twice changes nothing" hold |
| `dayKey` | Written onto every session without one, as `Hub.dayOf(dateISO)` — the rule its readers already apply | The Hub's `boot()` runs `Hub.load()` in an earlier DOMContentLoaded listener than BASALT's `bootstrap()`, so the rollover hour is known when this runs |
| Everything else | Tiers, sets, PRs, phases and benchmarks untouched. No `rx` or effort is invented | Plan C6 and Out of scope |
| `training.js` missing | `toV4` throws, `load()` keeps the raw save and opens read-only, and the next load with the file migrates | A v4 save without slots would be a save every later version has to second-guess |

**The sync rule (`mergeTraining`).** Every record travels whole: a slot by newer `acceptedAt`, decisions as a union by key with the newer `at`, and the assessment by newer `at`. A tie, or no stamp on either side, keeps local. The reason it can't stay with `mergeFields`: that function recurses into nested objects. It filled a carried-over slot's empty `setup` and null `acceptedAt` from the other device's step-up, and kept the old exercise.

**Harness lines, before → after.** For T11–T12, "before" is the same script against a scratchpad copy of the tree taken before the first edit (`HELTH_INDEX`). For the Node cases, it is the backup module (`SYNCMERGE_JS`, `TRAINING_JS`).

| Case | Before | After |
|---|---|---|
| T11 | FAIL — version 3, no slots, legacy dayKeys None, None | PASS — push_2, pull_1, squat_2, hinge_2, core_4 (10–20 s), shoulder_2, dip_6 (`loadKg` null, total); legacy dayKeys 2026-09-26 (05:00 IST, the UTC slice says 25 Sep) and 2026-09-23 (00:30 IST on 24 Sep, rollover 4); migrated twice is identical |
| T12 | FAIL — saved at v3. It already resumed 11/10/7, saved no `rx` and kept dayKey 2026-10-01 | PASS — the same, saved at v4 |
| T13 (Node) | FAIL — C's push slot `push_2 {"surface":"counter"}` @ 6 Oct: the old exercise with the step-up's setup and stamp | PASS — `push_incline {"surface":"counter"}` on S1, V4 and C. Decisions union; `rx` intact; all four sessions on C |
| C6 (Node) | FAIL — "accepted beats carried over" | PASS — every rule, inputs unchanged |
| C6-legacy-effort | FAIL — legacy "moderate" → "moderate" | PASS — → null; legacy "easy" stays "easy"; with `rx`, "moderate" stays |
| S9 | Literal version 4 (now the current version) | PASS — build version + 1: key unchanged, banner shown |

**Full regression on the live tree:**

| Check | Result |
|---|---|
| `check-workout.py` | 22 pass, 0 fail, 0 error (S1–S21, S5b, T11, T12) |
| `check-syncmerge.js` | 4 pass (S6, S7, C6, T13) |
| `check-training.js` | all passed (24 cases) |
| `check-training-data.js` | OK |
| `check-muscle-map.js` | OK |

**T13 with mixed builds** (`t13_mixed.js`): only the Stage 1 device runs W2's merge, and V4 and C run this one. S1's file holds `push_2 {"surface":"counter"}` stamped 6 Oct, and C adopts it. V4 keeps its own (a tie keeps local). With this window's merge on S1, all three hold `push_incline`. That is the finding at the top of this entry.

**T13 across real builds** (`w7_checks.py`, 19 of 19, 0 page errors). A v4 save from the live build was merged on the Stage 1 snapshot through its own `Hub.syncMerge` and the apply path `storage.js` uses. The live build then pulled it back.
- **Stage 1 device:** `App.readOnly()` is "newer" and the banner shows. Its save holds V4's `training` byte-for-byte, at version 4, with both devices' sessions. The key is unchanged after a logging attempt.
- **v4 device:** its training is unchanged and it stays writable, and the Stage 1 device's session arrives.

The permanent T13 is the Node case. Its "goes read-only" half is S9's mechanism, which this window doesn't change.

**Extra checks** (scratch only: `w7_checks.py`, `w7_themes.py`, `w7_offline.py` in this session's scratchpad):
- **Fresh profile:** the wizard (10 / 0 / 12 s / 8 / 0) writes 7 slots, `why: "placed at Level N"`; one workout saves at v4.
- **BASALT import of a v3 backup** (the Settings file input): migrated and saved at v4, with 7 slots and every session holding a `dayKey`.
- **Combined Hub import** (Settings → Import from file → Import and replace): migrated on the reload. The raw key stays v3 until the first save. That matches v2 → v3: `load()` has never written.
- **`training.js` deleted** from a scratch copy: a seeded v3 save opens read-only "unreadable", stays byte-identical after a logging attempt, and shows the banner. 0 page errors: the missing file is a failed resource load, not a page error.
- **Themes:** a v3-seeded profile in Selene (dark, body `rgb(32, 41, 48)`) and Selene Day (light, `rgb(229, 233, 235)`). Dashboard, Workout, Program, Progress, Phase review and Muscles all render and save at v4, with 0 errors. This step changes no screen, so nothing visual was compared.
- **Offline** (served over HTTP with the worker allowed): the only cache is `wellness-hub-v42`, with 58 entries including both training files. After going offline and reloading, `Training` loads, the schema is 4, nothing is read-only, and there are 0 errors.

**Deviations from the plan.**
- **`index.html`, `PRECACHE` and `CACHE_VERSION` moved here from 2.5.** The migration needs `training.js` at load, and the worker is cache-first for scripts. Without the precache, an install could serve the new `basalt.js` without it, and Fitness would open read-only. W9 still bumps `CACHE_VERSION` for its own changes.
- **Fresh onboarding writes slots.** The plan only migrates existing users. Without this, a profile onboarded on this tree is a v4 save with no prescriptions. W8's assessment replaces it.
- **The read-time "moderate" rule lives in `training.js` `exposures`,** the one reader that judges effort. Legacy sessions are already never evidence, so it changes no recommendation today. The session log still shows a legacy "moderate" as "just right"; that screen is 2.5's.
- **The assessment has a sync rule** (newer `at`) though the plan names none. `mergeFields` would have blended it field by field.
- **`importData` migrates before lifting read-only.** `toV4` can throw, and the old order cleared the guard first, which would leave the defaults on screen writable over an unreadable save. Source only, not reproduced: it needs an unreadable save and a missing `training.js` at once.
- **S9 is version-relative.** It seeded a literal 4, which this change makes the current version, so it would have tested nothing.

**Left over, unconfirmed or out of scope:**
- **The banner wording when `training.js` is missing.** The read-only banner says the data "couldn't be read" and suggests restoring a backup, but a restore fails the same way until the file is back. Nothing is lost, and only a broken install can reach it. Not reworded.
- **Late legacy sessions get no frozen `dayKey`.** A pre-Stage 1 session that arrives by sync after this device migrated keeps none; readers fall back to `Hub.dayOf`, as they did before.
- **For W8 (2.4):**
  - `finalizeSession` must copy `rx` from the draft exercise (put there by `buildWorkout`), never rebuild it from the current slot. That is what keeps T12 true: an old draft has no `rx` to copy.
  - Replace `finishOnboarding`'s `App.slotsFromTiers(tiers, {}, "placed at")` with the assessment, and stamp `training.assessment.at`.
  - Turning a slot off (the optional dip, a declined row) must be a record with an `acceptedAt`, not a deleted key. The union brings a deleted key back from the other device.
  - `basalt.js` grew by 68 lines.
- **Not run:** the Android and desktop shells, and a 300-session profile.

## 2026-10-01 · W8 · step 2.4 wiring

**Files.** Nothing committed. Backups are `<name>.backup-20261001-230821.<ext>` for `fitness/basalt.js`, `fitness/training.js` and `tools/check-workout.py`, taken before the first edit.
- `fitness/basalt.js` (8,653 → 8,590 lines):
  - **Builder.** `buildWorkout` builds from `training.slots` through three new engine functions. `prescriptionFor(slot)` applies equipment: an unowned exercise falls back to the nearest owned predecessor at its hardest setup, then to the slot's first owned entry, with a note naming the missing gear. `slotsFor(day, length)` turns pull-without-a-bar into the row and adds an accepted row slot to the pull day. `exerciseFromRx` makes the workout exercise.
  - **Finalize.** Copies `rx` from the draft exercise and never rebuilds it. A loaded movement with an unknown load takes the logged weight when every set used one weight (`rxAsLogged`).
  - **Points off.** `_progress`, `_adaptTarget`, `STEP_BANDS` and `stepFor` are deleted. New `recommendFor(slot)` and `decide(slot, "step" | "repeat")` are the only way a slot or a tier level changes.
  - **Flags and swaps.** Both use real ids: `applyMovement`, `snapshotMovement`, `restoreMovement`, and `slotOptions(slot)` for both swap lists.
  - **Assessment onboarding** replaces the benchmark test and placement: `stepAssess`, `assessPath`, `assessedSlots`, and a new `stepPlacement` summary. `PLACEMENT_CAP` and `computePlacement` are gone.
  - **Era gate removed.** The Era II accessory goes, swap lists lose the Era filter, and loaded movements get a weight input marked per hand or total.
  - **Phases.** `applyAdvancement` sets volume only.
  - **Copy.** Corrected where it described removed behaviour: the welcome and equipment steps, the volume-mode descriptions, the advance and deload blurbs, both "Era II unlocked" toasts and the two Era II panels.
- `fitness/training.js`: exports `owns`.
- `tools/check-workout.py`: the `onboard()` helper drives the assessment. New T14–T18. Seven cases retired (below). T14 and T17 tolerate a missing note or `rx`, so the old tree FAILs with numbers instead of ERRORing.

**Retired cases, with the reason:**

| Case | Measured | Why it can't pass now |
|---|---|---|
| S10, S11 | Tier points from one workout / eight 3 × 1 workouts | Points are off: `_progress` is deleted. T18 asserts a workout moves no tier |
| S13, S14 | Benchmark wizard → tier levels | The benchmark test places nothing (C4). The assessment answers set slots directly; T15 and T18 drive it |
| S15, S16 | `_adaptTarget`'s next target | Deleted. Prescriptions are ranges from `training.data.js` (C1) |
| S18 | Targets after a deload | `applyAdvancement` writes no targets (C6). T18 asserts advance + deload leave every tier unchanged |

**Harness lines.** "Before" is the same script against a scratchpad copy of the tree with the two backed-up files (`HELTH_INDEX`).

| Case | Before | After |
|---|---|---|
| T14 | FAIL — pull day `pull_1, hinge_1, core_1` fresh and `pull_1, hinge_2, core_2` on the v3 fixture; no note | PASS — `row:pull_alt_tabledoor, hinge:hinge_1, core:core_1`; legacy `row:pull_alt_tabledoor, hinge:hinge_2, core:core_2`; note "Needs a pull-up bar…" on the preview and the card; Dead Hang in no day, either profile, either length |
| T15 | ERROR — no assessment to select push_2 | PASS — now `push_1` [6, 12], target 6, 3 inputs; saved `push_1`; exposures push_1 / push_2 = 1 / 0; flag on `push_2` |
| T16 | ERROR — `recommendFor` didn't exist | PASS — legacy only: repeat (no-history); control with two `rx` sessions: ready |
| T17 | FAIL — 0 prescriptions shown, 4 in the workout | PASS — 4 shown, 4 in the workout, identical; first `push_incline` × 5 (Max effort + a preview swap) |
| T18 | ERROR — no assessment | PASS — push L3 → step → `push_4`, L4, decision "step"; workout, advance and deload moved no tier |

**Full regression on the live tree:**

| Check | Result |
|---|---|
| `check-workout.py` | 20 pass, 0 fail, 0 error (S1–S5b, S8, S9, S12, S17, S19–S21, T11, T12, T14–T18) |
| `check-syncmerge.js` | 4 pass (S6, S7, C6, T13) |
| `check-training.js` | all passed |
| `check-training-data.js` | OK |
| `check-muscle-map.js` | OK |

**Extra check** (scratch only: `w8_visual.py` in this session's scratchpad). The run covers the assessment, the program summary, the pull-day preview note, and the workout card's note and kg label. It ran in Selene (body `rgb(32, 41, 48)`) and Selene Day (`rgb(229, 233, 235)`) at 390 and 1440 px, with 0 overflow and 0 page errors in all four. Two screenshots were checked by eye. The 390 px select clipped "Not sure — start at Wall Push-up", so the option is now "Not sure".

**Decisions this step made, as the plan left them to W8:**
- **Loaded movements sit beside the path.** The Era II accessory appended to every Era II session is removed: it was the Era gate (A10). Loaded work is in every slot's Swap list for anyone with the gear. A save already in Era II loses that one appended movement. It never drove progression.
- **A swap or a mapped pain swap is that exercise at the bottom of its range, for this session only.** The slot is unchanged.
- **A mapped pain swap is still flagged,** so it is history for the new exercise but never evidence (C2's "not flagged" over C3's looser wording). It earns no PR either. Unmapped substitutes keep the original id, as in Stage 1.
- **The session's `rx.sets` is the session's set count.** Deload, Extended and Max effort sessions are therefore never comparable with standard ones, which matches D3's "inside a recovery block doesn't count".
- **Volume modes no longer add reps.** A range has no single number to add to. The descriptions drop "+N reps" (D4 replaces the modes).
- **`target` is the bottom of the range.** It is what a ticked-but-untyped set logs and what the hold timer counts. Pre-filling the top would let ticking boxes create Ready evidence.
- **Full-length accessory work carries `rx` and can be evidence.** It is the same exercise at the same prescription, and a step still needs your yes.
- **The assessment offers movements, not setups.** Choosing Incline Push-up starts at counter height (startOf's easiest). Under-placement errs safe.
- **Assessment answers are stamped `acceptedAt`** — they are your choices. Leaving dips out is `{ off: true, acceptedAt }`, as W7 asked. Pull without a bar still gets `pull_1` ("needs equipment you didn't have at setup"), so a bar bought later has a start. The builder swaps it for the row until then.
- **`decide("step")` with nothing on offer writes nothing.** T18's first run found it recording a "step" decision with no step.

**Left for W9 (2.5):**
- **The cards.** Step up / Repeat buttons call `App.engine.decide(slot, choice)`. `recommendFor(slot)` gives the evidence. "Unverified" means `why` begins "your assessment" and `Training.comparable` is empty.
- **"Not sure" as an effort button**: any value outside `READY_EFFORTS` reads as unknown.
- **The upgrade card and the opt-in row card** (C6) are not built. For Era II users, the upgrade card must not say "nothing in your program changed": the Era II accessory is gone.
- **Screens still showing the old model:**
  - the Progress ladder's Era II rungs read "locked" by Era;
  - the Program view shows `tiers.repsTarget`;
  - the exercise card's E1/E2 badge;
  - the 84 `readiness` strings (C5).
- **`CACHE_VERSION` is not bumped.** An installed copy still serves W7's `basalt.js` and `training.js`, a consistent pair, until W9 bumps it. No files were added.

**Not run:** the Android and desktop shells, a 300-session profile, offline (no file list changed), keyboard-only use of the assessment selects.

## 2026-10-01 · W9 · step 2.5 screens and close-out

**Run on Opus 5.5, not the Sonnet 5.5 the plan assigns.** Nothing else about the window differs.

**Files.** Nothing committed. Backups are `<name>.backup-20261001-233415.<ext>`, taken before the first edit.
- `fitness/basalt.js` (8,590 → 8,884 lines):
  - **The card** (C5), beside `rangeText`:
    - `setupText`, `topText`, `ruleText`, `cardRec`, `reasonHtml`, `rxLinesHtml` and `wireDecide`;
    - `exerciseCounts` and `countsText` (complete, partial and skipped);
    - `upgradeCardHtml` and `wireUpgradeCard` (C6);
    - `setSlotOn`, `rowOfferHtml` and `wireRowOffer` (C6);
    - `slotStatus`.
    - The shared ones are exported on `App.ui` for the Progress and Program parts.
  - **Workout card:** the meta line shows the setup. Under it: the last comparable sets with their date, the reason line, Step up (or Step back) and Repeat when there's a step to take, and the generated rule. Five effort buttons, with "Not sure" saved as `unsure`. The readiness prose, the E1/E2 badge, `LEVEL n` and the dead `targetDelta` tag are gone.
  - **Preview:** each row shows its reason line and buttons. The row offer sits under the movements on a pull day.
  - **The upgrade card** shows on the ready and active screens.
  - **The finished card** (`renderDoneToday`) and the completion toast count complete, partial and skipped exercises. The session detail does the same in its meta line. It reads `unsure` as "not sure", and a no-`rx` `moderate` as "unknown — older log".
  - **Program:** "Current targets" (`tiers.repsTarget`) becomes "Your prescriptions". There's one row per slot, with the exercise, setup, range, equipment note and `slotStatus`, plus Add / Leave out for the row and the dip. The weekly split's chips come from `slotsFor`. The benchmark copy no longer says it unlocks anything, and the loaded-tools chips say "needs gear", not "locked".
  - **Progress ladders:** the points bar ("progress to L3 · 0%") is gone, and `slotStatus` takes its place. "Next unlock" (the next numbered level) becomes "Next step" (`next` from `training.data.js`). Rungs off the main path are marked optional. Era II rungs are now "KG" rungs, marked "in Swap" or "needs gear" by equipment, not by Era.
  - **Guide modal:** "When to step up" shows `ruleText`, not the readiness string. The level badge uses `swapLevel`, so Incline Push-up no longer reads "E2".
- `fitness/muscles.js`:
  - The strip goes after `#ex-list` (active) or `.hero` (ready), below the prescriptions.
  - `previewExercises` is `buildWorkout(day).exercises`, so a no-bar pull day's strip shows the row, not Dead Hang.
- `fitness/basalt.css`:
  - an `is-on` style for the `unsure` effort button;
  - `.pg-trow__n` wraps instead of truncating with `nowrap`.
- `index.html`: the guide's "Ready to advance when…" heading is now "When to step up".
- `service-worker.js`: `CACHE_VERSION` v42 → v43. No files added, so `PRECACHE` is unchanged.
- `README.md`: three entries in "The things most habit trackers get wrong": evidence and your yes, old sessions as history, and equipment.
- `tools/check-workout.py`: new T19–T21, and an `open_section` helper (`open_today` now calls it).

**Harness lines, before → after.** "Before" is the same script against a scratchpad copy of the tree with the backed-up files (`HELTH_INDEX`).

| Case | Before | After |
|---|---|---|
| T19 | FAIL: reason '', last '', slot `push_incline` counter, effort None, counts '' | PASS: "Ready: 3 × 12 on 24 Sept and 27 Sept — step up to table height (~75 cm)?". "Last: 12 / 12 / 12 · 27 Sept". The click steps the slot and today's draft to `{surface: table}`. Effort `unsure`. Counts "0 complete · 1 partial · 3 skipped". Muscle strip below the list |
| T20 | FAIL: era1 0 chars, era2 0 chars | PASS: shown after a v3 upgrade. The Era II text says what changed and omits "Nothing in your program changed". Gone after Got it and after a reload; never shown on a fresh profile |
| T21 | FAIL: no offer; pull day `pull_1, hinge_2, core_2` | PASS: offered on pull, not push. Unticked → `{off: true, acceptedAt}`. Ticked → `pull_alt_tabledoor` joins the pull day. Program's Leave out → off |

**Full regression on the live tree, after the last edit:**

| Check | Result |
|---|---|
| `check-workout.py` | 23 pass, 0 fail, 0 error (S1–S5b, S8, S9, S12, S17, S19–S21, T11, T12, T14–T21) |
| `check-syncmerge.js` | 4 pass (S6, S7, C6, T13) |
| `check-training.js` | all passed (T1–T10 and the C2 cases) |
| `check-training-data.js` | OK |
| `check-muscle-map.js` | OK |

Every T case in Part E passes in this one set of runs. T1–T10 are Node, T13 is Node, and T11, T12 and T14–T21 are browser cases.

**Standing checklist** (scratch only: `w9_visual.py`, `w9_offline.py` in this session's scratchpad):
- **Themes and widths:** Selene (body `rgb(32, 41, 48)`) and Selene Day (`rgb(229, 233, 235)`) at 390, 1440 and 1920 px. Each run covers the ready screen with the upgrade card and the row offer, the active card with Step up, Program (8 slot rows) and the Progress ladders (7 status lines). All six runs: 0 horizontal overflow, 0 page errors.
- **Screenshots checked by eye:** the card at 390 (dark) and 1440 (light), Program at 390 in both themes and at 1440 (light), the ladders at 1920 (dark), and the ready screen at 390 (light). The first look at Program at 390 px found names truncated ("Elevated Pike …") and "Bench Dip" broken mid-word. The fix (wrap, and the toggle moved under the name) was re-run and checked by eye again.
- **Effort buttons:** one row at 1440 and 1920, two rows at 390.
- **Keyboard only:** Tab reaches Step up on the active card (36 presses), and Enter steps push to `push_3`. Tab reaches the row checkbox; Space unticks it, Tab moves to Save, and Enter writes `{off: true}`. 0 errors.
- **300-session profile** (301 sessions with `rx` on push): Today 91 ms, Program 62 ms, Progress 198 ms per navigation, and `App.refresh` 29 ms. 0 errors.
- **Offline:** served over HTTP with the worker. The only cache is `wellness-hub-v43`, with 58 entries including both training files. After going offline and reloading, `Training` and `App.ui.slotStatus` load, the schema is 4, and there are 0 errors.
- **Fresh and seeded v3 profiles:** 0 errors (T19 fresh, T20 and T21 seeded v3).
- **No `alert` or `confirm`** in anything added. **Not run:** backup/restore and CSV round trips, because nothing stored changed shape. The only new stored values are `difficulty: "unsure"` and an `off` row record, both already handled by W7's merge.

**Deviations from the plan.**
- **Step up is offered on the active card as well as the preview.** On the card, a step applies to today's draft only while nothing is logged on that exercise. Otherwise it starts next session, so logged sets are never re-filed under a movement you didn't do.
- **The card's recommendation is the slot's, at the slot's set count.** An Extended or Max session still shows the standard prescription's evidence. A swapped, pain-swapped or equipment-fallback exercise shows its own history and a "swapped" line, never an offer.
- **"Skipped" in the counts** means a sharp flag *or* nothing logged on that exercise. The plan doesn't define it, and an untouched exercise is skipped in fact.
- **The upgrade card is dismissed per device** (`ironframe.ui`, `v4.upgradeSeen`), not in the synced save, so it shows once on each device. It's shown to any save with a "carried over" slot.
- **The row offer is ticked by default** (house rule: suggest, explain, let it be unticked). Nothing is written until Save, and Program can reverse the choice either way. That Add / Leave out also covers the dip, which the assessment could leave out with no way back.
- **The Progress ladders still show L1–L6 rungs and the "Plateau" badge.** Levels are history now, but they move only on an accepted step (W8), so the badge is still true.

**Left over, unconfirmed or out of scope:**
- **`prompt()` on the per-exercise Rest button** (`wireActive`, "Rest for this exercise (seconds)"). It's pre-existing and not touched, but it breaks the no-modal rule; flagging it for your call.
- **Light theme, by eye, at 1920:** only the dark ladders were looked at. The automated overflow and visibility checks ran for both.
- **README line 135** still says the ladders' levels "measure something real". They now move only on an accepted step; left as is.
- **`exerciseFromRx` and `applyMovement` still copy `readiness` onto the draft.** It's data, never rendered now. Removing it is a cleanup, not a fix.
- **Not run:** the Android and desktop shells.
- **For R2:** `fitness/basalt.js` is 8,884 lines. Re-run all five checks, then drive the card's Step up and the row offer by hand.

## 2026-10-02 · R2 · step 2.6 review

**Files.** No code changed. This entry is the only edit (backup `plans/PROGRESS-workout-progression.backup-20261002-001754.md`). The scratch script is `r2_drive.py` in this session's scratchpad. It imports `tools/check-workout.py`'s helpers, so it drives the app the same way.

**What was read.** The plan and this log. Stage 1 is still uncommitted (HEAD `0d878b1`), so `git diff` mixes both stages. Stage 2 was read against W5's pre-edit backups instead (`*.backup-20261001-193226.*`), plus W7's backups for files W5 didn't touch. That covers `fitness/basalt.js` (2,059 diff lines), `fitness/training.js`, `fitness/training.data.js`, the `js/syncmerge.js` training merge and the two `fitness/muscles.js` hunks.

**Harnesses on the live tree.** Every number matches W9's "after" column.

| Check | Result |
|---|---|
| `check-workout.py` | 23 pass, 0 fail, 0 error (S1–S5b, S8, S9, S12, S17, S19–S21, T11, T12, T14–T21) |
| `check-syncmerge.js` | 4 pass (S6, S7, C6, T13) |
| `check-training.js` | all passed (T1–T10 and 14 C2/C6 cases) |
| `check-training-data.js` | OK, 86 exercises, 8 slots |
| `check-muscle-map.js` | OK, 86 exercises, 14 groups |

**Driven by clicks.** The harness proves the card with `rx` sessions seeded through `evaluate` (`rx_sessions`). This review ran the whole loop by hand instead, with 0 page errors in every run:
- Two real workouts on 1 and 3 Oct (clock 12:00 IST), every set of one slot at 12 and rated **Just right**, everything else at 5.
- The card was then read on 5 Oct.
- **Control, fresh profile on Push-up:** "Ready: 3 × 12 on 1 Oct and 3 Oct — step up to Diamond Push-up?", with one Step up button.
- **Control, fresh no-bar profile on the table row:** "…step up to body straight?", with Step up.

The loop works for a profile set up by the assessment.

**Findings, ranked:**

| # | Label | Finding | Measured | Smallest fix |
|---|---|---|---|---|
| R2-1 | BUG (high), new in 2.4 | **An upgraded user with no pull-up bar can never step up their pulling.** Their pull day trains the table row, but `toV4` writes no `row` slot (`slotsFromTiers` skips it, by C6's "offered, not added"). `rowOfferHtml` hides the offer when there's no bar, because the row already replaces the pull. `recommendFor("row")` reads only the stored record, so it returns `null`. That covers the default profile (A10: `pullupBar: false`) and the v3 fixture | v3 fixture, two pull days at 12 / 12 / 12, Just right. The row line shows **no reason line and no button**. `recommendFor('row')` is `null`. Program's row reads "— · not on your plan — offered on a pull day · Add", although the row is the first movement on every pull day. The fresh no-bar control, which gets a `row` record from `assessedSlots`, reads Ready with Step up | In `toV4`, when the profile owns no bar and has no `row` record, write `row` from `SLOTS.row.first`'s first owned id, with `acceptedAt: null` and `why: "carried over — rows replace pull-ups without a bar"`. That is what `assessedSlots` already does for new users; it isn't "adding" a slot, because the row already replaces the pull. **Residual:** a bar removed later, after a row was declined, still leaves the pull day with no record. Not reproduced |
| R2-2 | BUG (medium), new in 2.4 | **A loaded slot with no load set never steps up, and says something false when you leave the weight blank.** `rxAsLogged` writes your logged weight onto the session's `rx` only, never onto the slot. `comparable` then sees `loadKg: 10` against the slot's `null` and counts nothing. Reached by migrated dip or squat at L6 (Weighted Dip, Weighted Pistol: T11 shows `dip_6 loadKg null`) and by any step onto those movements (`startOf` leaves the load null) | v3 fixture, dip L6, two push days at 3 × 12 × **10 kg**, Just right. The card reads "Repeat: no session at this prescription yet", Program reads "Weighted Dip · load not set yet · 0 of 2 at 3 × 12", and the sessions saved `loadKg: 10`. The same with the **weight left blank**: "Ready: 3 × 12 on 1 Oct and 3 Oct — **the end of this path**", with no button. Weighted Dip has a +2.5 kg step; it's the unknown load that stops `stepUp` | In `finalizeSession`, when the slot's record is the same exercise with `loadKg == null` and `rxAsLogged` found one weight, copy that weight onto the record's `setup.loadKg`. In `comparable`, a loaded `rx` with `loadKg == null` is not evidence, and the reason line says "log the weight you use". Both edits sit where the load is decided |
| R2-3 | INCONSISTENCY (low), new in 2.5 | **Program and Progress say "ready to step up — see Workout" when the Workout offers no step.** `slotStatus` reads `action === "ready"` and ignores `step: null`, which is the normal end of a main path | Fresh profile on Decline Push-up (`push_4`), two days at 3 × 12. The Workout card reads "Ready… — the end of this path. Optional next: Archer Push-up, Planche Lean, from Swap.", with 0 buttons. Program reads "ready to step up — see Workout". R2-2's blank-weight run shows the same mismatch | In `slotStatus`, `ready` with no `step` returns "at the top — end of the path" |
| R2-4 | INCONSISTENCY (low), new in 2.4 | **Swapped sessions do count as evidence, and the card says they don't.** The active card's swapped line reads "logged as this movement's history, not as evidence for your program". `comparable` doesn't exclude swaps, and W8 decided they're real history | Fresh profile on Wall Push-up. Two push days swapped in the preview to Incline Push-up (counter) at 3 × 12, then two Wall Push-up days at the top and Step up by click. **Straight after the step to counter**, the card offers "step up to table height", citing the two swapped days (1 and 3 Oct) | Change the copy: "…logged as this movement's history. If your program reaches it, these sessions count." The evidence itself is genuine (the same movement, setup and set count), so the rule stays |
| R2-5 | COSMETIC (low) | **The upgrade card says every movement is "3 sets of 6–12 reps (or a hold range)".** Eccentrics are 3–6 | v3 fixture at pull L3 with a bar: the slot is `pull_3`, range `[3, 6]`, and the card text is as quoted | "…6–12 reps for most movements, 3–6 for negatives, or a hold range" |

**Checked, and nothing found:**
- **No modals.** No `alert(`, `confirm(` or `prompt(` in any added line. The `prompt()` on the per-exercise Rest button is pre-existing (W9).
- **The sync rule** for `training` (`mergeTraining`) does what its comment says, and C6 and T13 cover it.
- **`decide("step")` with nothing on offer** writes nothing (W8's T18 fix holds).
- **The preview and Begin** share one object (T17), and a step taken on the preview rebuilds it.

**Not run:**
- the Android and desktop shells;
- light theme by eye;
- backup/restore and CSV round trips;
- 390 / 1920 px. This review changed no screen, and W9 ran the widths.

The R1 findings still open (R1-2, R1-3, R1-4's plan wording) were not re-checked.

**Before committing Stage 2:** R2-1 is the one finding that stops a real user's progression on day one of the upgrade. R2-2 reaches only L6 dip and squat. R2-3 to R2-5 are copy. Everything from R1's "before committing" note still applies: the `plans/` move, the deleted tracked backups and `tools/__pycache__/`.

## 2026-10-02 · R2 follow-up · R2-1 and R2-2 fixed

**Files.** Nothing committed. Backups are `<name>.backup-20261002-004011.<ext>`, taken before the first edit.
- `fitness/basalt.js`:
  - **`rowWithoutBar(state)`**, called at the end of `migrate()` (R2-1).
    - When the profile owns no bar and has no `row` record, it writes one from `SLOTS.row.first`'s first owned id: `acceptedAt: null`, `why: "carried over — rows replace pull-ups without a bar"`.
    - It sits in `migrate()`, not `toV4`, so it runs on every load. That covers a save this tree already migrated to v4, and a bar removed later.
  - **`finalizeSession` copies a logged load onto the slot** when the slot is the same exercise with `loadKg == null`, and stamps `acceptedAt` (R2-2).
  - **The `no-load` reason line** on the card, and the matching `slotStatus` text.
- `fitness/training.js`:
  - `noLoad(rx)`: a loaded `rx` with no `loadKg` is never comparable.
  - `recommend` returns `why: "no-load"` for such a prescription, before `no-history`.
- `service-worker.js`: `CACHE_VERSION` v43 → v44. Two cached scripts changed.
- `tools/check-workout.py`:
  - T11 now expects the no-bar fixture's `row` record. It read "no row", which was the defect.
  - New T22 and T23, driven by clicks end to end, with the helpers `workout_at_top` and `card_after_two`.
- `tools/check-training.js`: new C2-no-load.

**Before → after.** "Before" is the same scripts against a scratchpad tree holding the backed-up `basalt.js` and `training.js` (`HELTH_INDEX`, `TRAINING_JS`).

| Case | Before | After |
|---|---|---|
| T11 | FAIL — 7 slots, no row | PASS — 8 slots, row `pull_alt_tabledoor` |
| T22 | FAIL — row record None; no reason line on the row; 0 Step up buttons | PASS — "Ready: 3 × 12 on 1 Oct and 3 Oct — step up to body straight?", 1 button |
| T23 | FAIL — 10 kg twice: slot load None, 0 buttons; blank: "Ready… — the end of this path." | PASS — 10 kg: slot load 10, "…step up to 12.5 kg total?", 1 button; blank: "Log the weight you use…" |
| C2-no-load | FAIL — ready, 2 comparable | PASS — repeat, no-load, 0 comparable |

**Probe** (`r2_v4probe.py`, scratchpad). A v3 save is migrated and saved by the pre-fix build: version 4, row record `None`. The fixed build loads it with a `pull_alt_tabledoor` row record, status "0 of 2 at 3 × 12", and 0 page errors.

**Full regression on the live tree:**

| Check | Result |
|---|---|
| `check-workout.py` | 25 pass, 0 fail, 0 error |
| `check-syncmerge.js` | 4 pass |
| `check-training.js` | all passed (25 cases) |
| `check-training-data.js` | OK |
| `check-muscle-map.js` | OK |

**Left over:**
- **A no-bar profile can still leave the row out** (Program → Leave out), and then its pull day has no pulling at all. Pre-existing in 2.5, a choice the user makes visibly, not fixed.
- **A no-bar user who later buys a bar** keeps the row on pull days beside pull-ups, without C6's offer. That is what the assessment already does for a new user with a bar, and Program's Leave out reverses it.
- **R2-3 to R2-5 are untouched.**

## 2026-10-02 · R2 follow-up · R2-3 to R2-5 fixed

**Files.** Nothing committed. Backups are `<name>.backup-20261002-021958.<ext>`, taken before the first edit.
- `fitness/basalt.js`:
  - **`slotStatus`**: `ready` with no `step` now reads "at the top — end of the path" (R2-3).
  - **The active card's swapped line** now reads "…logged as this movement's history. If your program reaches it, these sessions count." (R2-4). The rule stays as it is; only the copy was wrong.
  - **The upgrade card** now reads "Every movement is 3 sets: 6–12 reps for most, 3–6 for negatives, or a hold range, not one number." (R2-5). 3–6 is `training.data.js`'s `eccentric` range.
- `service-worker.js`: `CACHE_VERSION` v44 → v45.
- `tools/check-workout.py`:
  - `card_after_two` also returns `App.ui.slotStatus(slot)`.
  - New case T24: v3 fixture at push L4 (`push_4`), two workouts at the top, driven by clicks.

**Before → after.** "Before" means the same scripts run against a scratchpad tree that holds the backed-up `basalt.js` (`HELTH_INDEX`).

| Case | Before | After |
|---|---|---|
| T24 (R2-3) | FAIL: card "Ready… — the end of this path", 0 buttons, status "ready to step up — see Workout" | PASS: same card, status "at the top — end of the path" |
| R2-4 swapped line, read on screen (`copy_probe.py`, scratchpad) | "…not as evidence for your program." | "…If your program reaches it, these sessions count." |
| R2-5 upgrade card, read on screen | "Each movement is 3 sets of 6–12 reps (or a hold range)…" | "Every movement is 3 sets: 6–12 reps for most, 3–6 for negatives, or a hold range…" |

**Full regression on the live tree:** `check-workout.py` 26 pass, 0 fail, 0 error · `check-syncmerge.js` 4 pass · `check-training.js` all passed (25 cases) · `check-training-data.js` OK · `check-muscle-map.js` OK.

**Not run:** light/dark by eye (copy only, no new colours), the Android and desktop shells.

## 2026-10-02 · R1 follow-up · R1-2, R1-3 and R1-4 fixed

**Files.** Nothing committed. Backups are `<name>.backup-20261002-022632.<ext>`, taken before the first edit.
- `fitness/basalt.js`:
  - **`recountStreak(state)`** (R1-2) rebuilds `streak` from the completed sessions' days with the same 3-day gap rule. `best` never drops. It runs at the end of `migrate()`, so on every load and after every sync, which goes through `reloadFromRemote` → `load()`. `finalizeSession` and session delete also call it, through `App.recountStreak`. An undated session is skipped, not thrown on: a throw in `migrate()` would open the save read-only.
  - **`engine._bumpStreak` deleted.** It had no other caller, and its backfill `ponytail:` note (W3) is closed: a backfilled workout now counts. The running streak's own `_bumpStreak` is untouched.
  - **`updatedAt` stamped in the three writers** (R1-3): session log → Edit → Save, `toggleGoal` (done and pinned), and `run.logRun`.
- `js/syncmerge.js`:
  - **`unionById`** keeps the newer `updatedAt` for a shared id, and a tie keeps local. Read order is file, then local, so `>=` gives local the tie. This is the Hub's `mergeById` rule.
  - The `mergeIronframe` comment no longer says BASALT edits a session "in exactly one place (deleting it)".
- `plans/PLAN-workout-progression.md` (R1-4): the decision row (line 26), A-finding fix (line 54) and Out of scope (line 618) now say a deleted session comes back "until it is deleted on every device". Tombstones stay out of scope.
- `README.md`: the sync entry says edits travel, newer winning.
- `service-worker.js`: `CACHE_VERSION` v45 → v46.
- `tools/check-workout.py`: new T25 and T26, both driven by clicks; the header lists T22–T26. `tools/check-syncmerge.js`: new case R1-3.

**Before → after.** "Before" means the same scripts run against a scratchpad tree that holds the backed-up `basalt.js` and `syncmerge.js` (`HELTH_INDEX`, `SYNCMERGE_JS`).

| Case | Before | After |
|---|---|---|
| T25 (R1-2): workouts 28 and 30 Sep, streak left as a merge leaves it, read 2 Oct | FAIL: streak `{count 1, lastISO 28 Sep}`, tile **0** | PASS: `{count 2, lastISO 30 Sep, best 2}`, tile **2** |
| T26 (R1-3 writers): edit notes, tick a goal, log 5 km then 6 km | FAIL: all three `updatedAt` None | PASS: all three stamped; one run, 6 km |
| syncmerge R1-3: phone edited, desktop not | FAIL: desktop keeps notes `""`, goal not done, 5 km | PASS: both devices end on "felt strong", done, 6 km; a tie keeps local |

**Full regression on the live tree:** `check-workout.py` 28 pass, 0 fail, 0 error · `check-syncmerge.js` 5 pass · `check-training.js` all passed (25 cases) · `check-training-data.js` OK · `check-muscle-map.js` OK.

**Left over:**
- **R1-1's run now converges.** The re-log keeps the id and carries a stamp, so the newer run wins on both devices. The "Limit, stated plainly" in R1-1's follow-up no longer holds.
- **A record edited before this build has no stamp,** so an old edit still loses a tie to the other device's unedited copy, local winning. Only edits from now on travel.
- **Not run:** the Android and desktop shells, and themes by eye (no UI changed). A real two-device sync was not run: the merge is proven in `check-syncmerge.js`, and the recount through a reload in T25.

## 2026-10-02 · W10 · step 3.1 templates, rest rule, attendance, goals, modes

**Files.** Nothing committed. Backups are `<name>.backup-20261002-025631.<ext>`, taken before the first edit. The "before" tree is a scratchpad copy taken at the same moment (`HELTH_INDEX`).
- `fitness/basalt.js` (8,925 → 9,220 lines):
  - **Templates (D1).** `TEMPLATES` and `TEMPLATE_ORDER` beside `DAY_PATTERNS`: `fullbody3`, `fullbody2`, `upperlower` and `rotation`, each with `order`, `perWeek` and `rest`. There are four new day types (`fullA`, `fullB`, `upper`, `lower`) with labels, descriptions, Full-length accessories, and borrowed warm-ups and cool-downs. `prefs.template` defaults to null, which means the rotation.
  - **Rest rule by template.** `restOn(tpl, done, key)` decides it. `afterEach` rests the day after any session. `sameType` rests only when the day the template trains next has already been trained since your last day off. `restDayInfo` uses it, and `doneTodayInfo` gains `restTomorrow`, with `nextKey` set to tomorrow when Upper → Lower can follow. `recommendedDayType` follows the template's order.
  - **Attendance.** `expectedSessions` is `ceil(day × perWeek / 7)` from `phase.template`, falling back to the rotation. `SESSION_GAP_DAYS` is deleted. The "This week" tile, the phase card's pace line and the "Inconsistent attendance" flag all use the template's wording.
  - **Switching template.** `engine.setTemplate(id)` calls the new `App.evaluation.closePeriod(action, closedBy)`, which `applyAdvancement` now also goes through. Every closed period stores `template`, `attended`, `planned`, `startISO` and `closedBy`, and each new period stores `template`.
  - **Goals (D2).** `rxStart(id, o, goal)` builds every new prescription in the running app, and `recommendFor` passes the goal. `engine.setGoal(goal)` re-ranges the slots and stamps `acceptedAt`. New profiles get `prefs.restDefaultSec` from `GOAL_REST_SEC`. A new `Short` length drops the day's last slot.
  - **Bodyweight direction (D2).** It's a new setting, `profile.weightDirection` (null, gain, hold or lose). `weightDir` replaces `isBulk`, and `gainPace` reads the direction. Weight leaves the grade (details below).
  - **Volume modes (D4).** There are two now: `standard` and `extended` ("+1 set"). `volumeModeOf` reads a saved `"max"` as `extended`. The extra set goes on main slots only, and the accessory keeps the base count. No mode and no consolidation phase changes rest.
  - **Screens.**
    - Onboarding's goal step adds the template cards and goal copy that names each range.
    - Today's day picker and "Preview all days" follow the template.
    - The rest-day, done-today and dashboard hero copy comes from `restReason` and `nextAfterToday`.
    - The hero chips come from `slotsFor`, so the row shows.
    - Program's "Weekly split" becomes "Template", with the template's days, Change template, an inline preview and Switch / Keep.
    - The calendar, notes, session log and skill-reminder maps know the new day types.
- `fitness/training.data.js`: adds `GOAL_RANGES`, `GOAL_KINDS`, `GOAL_REST_SEC` and `rangeFor(id, goal)`.
- `fitness/training.js`: the goal goes through `startOf`, `stepUp`, `stepDown` and `recommend`. The `comparable` comment records why range isn't part of the key.
- `index.html`: Settings gets a goal note, a bodyweight direction `<select>`, "+1 set" in place of Extended / Max effort, and Short.
- `service-worker.js`: `CACHE_VERSION` v46 → v47. No files added.
- `tools/check-workout.py`: `onboard()` takes `template` (default `"rotation"`) and `goal`. New P1, P2, P3, P5 and P6. T17 updated (see deviations).

**Harness lines, before → after.**

| Case | Before | After |
|---|---|---|
| P1 | FAIL: day 28, 12 of 14 planned, 85.7%; types push/pull/legs/fullbody | PASS: day 28, 12 of 12 planned, 100.0%; A/B alternating |
| P2 | FAIL: day 2 begin=False (rest block); types ['push'] | PASS: day 2 trains Lower; types upper, lower; day 3 rests ("Upper and Lower ran back to back…"); day 1 says "Lower tomorrow" |
| P3 | FAIL: no template control; phase 1, 7/7 | PASS: closed {rotation, 5 attended, 5 planned, template}; phase 2 fullbody3, 2/2 |
| P5 | FAIL: strength and size both push [6, 12], squat [6, 12]; rest 90 | PASS: strength push [4, 8], squat [6, 12], rest 150; size [8, 15], [8, 15], rest 120; plank [30, 60] both; Settings Strength → Size re-ranges to [8, 15] |
| P6 | FAIL: "MAX EFFORT", 5 sets on every exercise, rest 54 s / 36 s | PASS: "+1 SET", main 4 sets, accessory 3, rest 90 s / 60 s under a consolidate phase |

**Full regression on the live tree, after the last edit:** `check-workout.py` 33 pass, 0 fail, 0 error · `check-syncmerge.js` 5 pass · `check-training.js` all passed · `check-training-data.js` OK · `check-muscle-map.js` OK.

**Extra checks** (scratch only: `w10_visual.py`, `w10_checks.py`, `w10_offline.py`, `sweep.py`, `wdir.py` and `rows.py` in this session's scratchpad), 0 page errors in every run:
- **Themes and widths:** Selene and Selene Day at 390, 1440 and 1920 px. Each run covers the onboarding goal step with the template cards, the dashboard, done-today, Today, the rest day, the dashboard on a rest day, Program with the template preview open, and Settings. Horizontal overflow was 0 everywhere.
  - Screenshots were checked by eye: onboarding at 390 (light), Program at 390 (dark), the rest day at 1440 (light), and Settings at 390 (light).
  - The first look found "Lose" wrapping onto a second row of a four-button segment at 390, so bodyweight direction is now a `<select>`. It also found "· every other day" wrapping in a template card title, so the short label moved to the description.
- **Grade, same fixture:** five sessions and four flat weigh-ins, goal Both. Before: "Bodyweight stalled" and score **71**. After: no flag and **80** with no direction; flag shown and still **80** with Gain.
- **Backup → restore:** BASALT's export after a template switch, imported into a fresh profile. `prefs.template`, `currentPhase.template`, the closed period's `[rotation, 1, 2, template]` and the weight direction were identical. BASALT has no CSV export, so there's no CSV round trip to run.
- **Bodyweight direction:** Gain is saved, shown again on reopening Settings, and cleared back to null.
- **300 sessions (Upper/Lower):** Today 54 ms, dashboard 181 ms, Program 63 ms and Progress 51 ms per navigation; `restDayInfo` + `doneTodayInfo` take 0.10 ms.
- **v3 fixture:** `prefs.template` null reads as the rotation; Program's badge reads "Current rotation · every other day"; 2 expected on day 3.
- **Every Fitness section** opened after a Full Body A session: 0 errors. The calendar's next-session banner reads "Full Body B", and the hero reads "Next up is Full Body B on Sat, 3 Oct — tomorrow is your rest day."
- **Offline** (HTTP with the worker): the only cache is `wellness-hub-v47`, with 58 entries. After going offline and reloading, `TEMPLATES` and `GOAL_RANGES` load, and the schema is 4.
- **Modals:** no `alert(`, `confirm(` or `prompt(` in any added line. The one hit is a comment.

**Decisions this step made.**
- **No schema bump.** No record needed a migration. `prefs.template` null means the rotation, a phase without `template` ran the rotation, and `"max"` is aliased when read.
- **Range is not part of the comparable key** (W6's open question). Three sets of 12 at table height is the same work whatever range it was aimed at, so older sessions are judged against the current top. Switching Size → Strength makes a 3 × 15 history clear 8, which is the right answer.
- **Strength's 4–8 applies per exercise.** It applies where the exercise has `SETUPS` or a `loadMode`, otherwise 6–12. Eccentrics stay 3–6 under every goal: the plan's table names rep ranges only, and 15 slow negatives would be endurance.
- **New users get Full body ×3 preselected,** visibly, on the goal step. Existing saves keep the rotation. The harness's `onboard()` clicks the rotation by default, so every case written before templates still measures its own schedule.
- **Short is a new length mode.** D2's "Short session drops the last slot" had no existing option to attach to.
- **Bodyweight left the grade now,** because D2 says so. The weight sub-score's 0.14 is removed and the other four are rescaled to a whole. "Bodyweight stalled" appears only with Gain and costs no points. The loss pace (−0.4 kg/wk) is a new product choice, marked as one in the comment.
- **Switching template keeps the current phase's action and volume factor,** so switching doesn't end a deload.
- **A template that names the row writes a row record** when there is none, stamped with `acceptedAt`. A row you left out stays out, and the preview says so. Without a record, a row trained by Full Body A could never step up (R2-1's class).
- **The accepted row joins only the rotation's pull day.** Full Body B would otherwise get five slots. Templates name the row where they want it.
- **Full-length accessories:** Full Body A adds hinge, B adds squat, and Upper adds core. Lower gets none, because an upper-body extra would break the back-to-back recovery that Upper/Lower relies on.
- **Warm-ups and cool-downs are borrowed:** Full Body A and B use the full-body set, Upper uses push (pull's opens with a dead hang, which needs a bar), and Lower uses legs.
- **The goal sets rest only for a new profile.** Changing goal in Settings re-ranges your prescriptions, the toast says how many changed, and rest stays where it is.

**Deviations from the plan.**
- **T17 changed.** It clicked `[data-volmode="max"]`, which no longer exists, and expected 5 sets. It now clicks "+1 set" and expects 4. It passes on both trees, because the old Extended was already +1 set. What it tests (preview = workout) is unchanged.
- **`SESSION_GAP_DAYS` is deleted,** replaced by each template's `perWeek`. The rotation's 3.5 gives the same `ceil(day / 2)`, so S19 still reads 14 of 14.

**Left over, unconfirmed or out of scope:**
- **Sync of a template switch.** `prefs` and `currentPhase` merge field by field with local winning, and `phaseHistory` merges whole with local winning (W2's inventory). So a switch on one device doesn't reach the other, and the closed period's entry can be lost if the other device writes last. Source only, not reproduced.
- **A switch during a deload starts a fresh 28-day deload period.** 3.2 replaces the deload with the 7-day recovery block.
- **A period closed by a switch is graded on its partial days,** the same numbers the live Phase review already shows mid-period.
- **For W11 / W12:**
  - Muscle-map weekly targets (`muscles.data.js`, `check-muscle-map.js`) still come from the rotation. That's D7.
  - The Running copy still says runs fall on "the days the lifting rotation leaves open". That's D6.
  - No README entries yet; they belong to 3.3's close-out.
- **Pre-existing, seen while testing:**
  - "Training setup" is hidden at 390 px (`.appbar__io` is `display:none`). I didn't check whether another path reaches BASALT's settings on a phone.
  - Clicking the Today tab while it's already open doesn't re-render after the clock passes midnight. The scratch scripts go through the dashboard to work around it. Whether a real phone left open overnight shows the stale screen is unconfirmed.
- **Not run:** the Android and desktop shells; a real two-device sync; keyboard-only use of the template picker (it uses native buttons, but this wasn't driven).

## 2026-10-02 · W11 · step 3.2 recovery block and phase report

**Files.** Nothing committed. Backups are `<name>.backup-20261002-035107.<ext>`, taken before the first edit; the "before" tree is a scratchpad copy taken at the same moment (`HELTH_INDEX`).
- `fitness/basalt.js` (9,220 → 9,087 lines):
  - **Recovery block (D3).** `recoveryBlocks` is a new id-keyed array in the save: `{ id, startKey, startedISO, days, reason, endedKey, updatedAt }`. Engine: `recoveryOn(day)`, `recoveryEnd`, `startRecovery(reason)`, `endRecovery()` and `recoveryOffer()`. `buildWorkout` cuts every count through `Training.recoverySets` and drops the "+1 set" mode while a block is on, and stamps `workout.recovery`; `finalizeSession` copies it onto the session. `decide("step")` refuses a step up inside a block. The card's Step up button is replaced by "the step waits until your recovery block ends".
  - **Screens.** `recoveryHtml` and `wireRecovery`: a persistent banner with **End block now** (plain, no button, inside a workout), and the offer card, on the ready, rest-day, done-today and Phase review screens.
  - **Phase report (D5).** `evaluate` returns `adherence`, `performance` and `recovery`, each with its own sample size. `reportHTML` (the modal) and `renderEvaluation` (the screen) render the same `sectionsHTML`. `closePeriod(closedBy)` stores the counts; it writes no prescription.
  - **Deleted:** the blended score and grade, `recommendAction`, `coachFeedback`, the advance / consolidate / deload override, `applyAdvancement`, `weightScore`, `weightDir`, `REF_TARGET`, `phaseDiffHTML`, the ring and the metric bars.
- `fitness/training.data.js`: `RECOVERY_BLOCK = { days: 7, setFactor: 0.6, minSets: 1, offerSlots: 2, offerWindowDays: 7 }`.
- `fitness/training.js`: `recoverySets(n)`; `exposures` carries `recovery`, and `comparable` excludes it. The 3.1 `ponytail:` note on that gap is closed.
- `js/syncmerge.js`: `recoveryBlocks` joins the union-by-id arrays, so an early end (newer `updatedAt`) travels.
- `service-worker.js`: `CACHE_VERSION` v47 → v48. No files added.
- `README.md`: the stale "A deload never raises a target" entry is replaced by two (recovery block, phase report).
- `tools/check-workout.py`: new P4, P4b, P4c, P4d; `click_if` and `n_visible` helpers; S17 retired; T18 and `phase_attendance` updated. `tools/check-training.js`: P4-sets, P4-evidence, P4-reduce. `tools/check-syncmerge.js`: P4-sync.

**Harness lines, before → after.** "Before" is the same script against the scratchpad tree (vendor and icons copied in). 0 errors in either run.

| Case | Before | After |
|---|---|---|
| P4 | FAIL: sets [3,3,3,3] → [3,3,3,3] → [3,3,3,3]; step buttons 1/1/0; comparable 3; block None | PASS: sets [3,3,3,3] → [2,2,2,2] → [3,3,3,3]; rest and ranges same; step buttons 1/0/1; comparable 2 (the block session excluded); block `rb_…` |
| P4b | FAIL: offer '', blocks [], sets 3 → 3 | PASS: offer names the sharp wrist flag; Not now holds; a second flag offers again; block `('2026-10-06', 'flag', '2026-10-06')`; sets [2,2,2,2] → [3,3,3,3] |
| P4c | FAIL: offer '', block reason None | PASS: one falling slot offers nothing; two do, showing "30 → 27 → 24"; reason `reduce` |
| P4d | FAIL: samples [], closed entry has no counts | PASS: samples `5 sessions planned · day 9 of 28`, `1 comparable session this period · 0 steps taken`, `0 rated exercises in 2 sessions`; closed attended 2, planned 5, blocks 1, no `grade`; slots and tiers unchanged |
| P4-sets / P4-evidence / P4-reduce (Node, against the backup `training.js`) | FAIL, FAIL, FAIL | PASS: 1..6 sets → 1,1,2,2,3,4; block-only 0 comparable; 2 around it |
| P4-sync (Node, against the backup `syncmerge.js`) | FAIL: phone keeps `rb_a:open,rb_b:open` | PASS: both `rb_a:2026-10-03,rb_b:open` |

**Full regression on the live tree, after the last edit:** `check-workout.py` 36 pass, 0 fail, 0 error · `check-syncmerge.js` 6 pass · `check-training.js` all passed · `check-training-data.js` OK · `check-muscle-map.js` OK.

**Extra checks** (scratch only: `w11_visual.py`, `w11_extra.py`, `w11_rt.py`, `w11_offline.py`, `dbg*.py` in this session's scratchpad), 0 page errors in every run:
- **Themes and widths:** Selene (body `rgb(32, 41, 48)`) and Selene Day (`rgb(229, 233, 235)`) at 390, 1440 and 1920 px. Each run covers the offer card on the rest-day screen, the banner, Phase review and the report modal. Overflow 0 in all six. Screenshots checked by eye: the offer at 390 (light), the review at 1440 (dark) and the modal at 390 in both themes. The first look at the modal at 390 showed each row's figure wrapping to three lines, so rows now wrap with the figure right-aligned beneath.
- **Legacy state:** a phase closed with a grade still shows "B · Phase 1 · Consolidate · score 74"; a phase saved mid-deload (`volumeFactor` 0.6) still builds 2-set workouts and shows "deload from before recovery blocks".
- **Backup → restore:** a block survives BASALT's import (`2026-10-01`, 7 days, still active). BASALT has no CSV export.
- **Offline** (HTTP with the worker): the only cache is `wellness-hub-v48`, with 58 entries. After going offline and reloading, `Training.recoverySets` and `RECOVERY_BLOCK` load, the schema is 4 and there are 0 errors.
- **Modals:** no `alert(`, `confirm(` or `prompt(` in any added line. The deload's `ui.confirm` dialog is gone; starting and ending a block are one click each, reversible.

**Decisions this step made, as the plan left them to W11:**
- **"Ends with a normal session"** is read as: the first session after day 7 is a normal one, with no ramp. The block is 7 calendar days from the day it starts (`startKey` to `startKey + 7`, not including the last), and ends on its own.
- **"Two reduce recommendations in a week"** is two different slots, each reading Reduce with its latest evidence in the last 7 days. The plan doesn't say whether one slot twice counts.
- **A sharp flag** offers a block for 7 days after it. **"Not now"** is stored per device (`ironframe.ui`, `rb.dismissed`), keyed by the trigger, so a new flag or new evidence asks again. Only flags and evidence after the previous block began count.
- **A block is a record, not a phase action.** It lives beside the period, not inside it, so a period closing mid-block doesn't end it, and two devices union their blocks.
- **Ending a block the day it started voids it** (`endedKey == startKey`); the report doesn't count it.
- **A block stamps its sessions at build time** (`workout.recovery`), so the stamp always matches the sets that were prescribed.
- **Stepping back is allowed inside a block**; only a step up is refused. "Nothing raised" is read as nothing in the prescription rising.
- **"+1 set" is off inside a block.** The result is the same as the mode being on (4 × 0.6 rounds to 2), but the card says "standard".
- **The phase report keeps no sleep or difficulty rows.** D5 lists three sections and names none of them. Sleep still lives in the Hub's Sleep view; the old "Under-recovering" and "Bodyweight stalled" flags went with the grade.
- **"Failed sets" counts exercises rated Failed.** The app records effort per exercise, not per set, and the report says so.
- **A comparable session in the report needs something logged on that exercise.** `Training.comparable` itself still counts an exercise with every set blank (it is never at the top, so never Ready); the report filters it so one logged exercise doesn't read as four.
- **A save mid-deload at upgrade keeps its volume** until its period closes. A template switch carries it, as W10 did; a report no longer creates one.
- **`phaseHistory` entries lose `score`, `grade`, `action`, `metrics`, `feedback` and `plateaus` going forward.** Old entries keep theirs and still render. No schema bump: no record needed a migration.
- **Phase day-28 copy:** the "auto-grades" sentences now say a report is ready on day 28. Nothing auto-opens, as before.

**Deviations from the plan.**
- **S17 retired.** It measured the report's rep ratio against tier targets, which D5 removes. P4d covers the report.
- **T18 updated:** it called `applyAdvancement`, now `closePeriod('report')`. It tests the same thing, that closing a period moves no tier.
- **`phaseDiffHTML`'s "What changed this phase" is gone.** It was a fourth section the plan doesn't list; steps taken per slot carry the same information.
- **The offer and banner also show on the rest-day and done-today screens.** The plan says "offered"; a sharp flag is most often seen on the rest day, which is when the Today tab shows no Begin screen.

**Left over, unconfirmed or out of scope:**
- **Sync of the report's counts.** `phaseHistory` still merges whole with local winning (W2's inventory), so a closed period on one device doesn't reach the other. Unchanged.
- **The Android and desktop shells, and a real two-device sync,** were not run. The block's merge is proven in `check-syncmerge.js`.
- **A block started on one device reaches the other only after a sync,** and sessions the other device logged before then are not stamped. They carry full sets, so they aren't evidence-contaminating in the other direction either: they are simply normal sessions.
- **Steps taken counts up and back together.** A stored decision records "step" for both, so the report can't tell them apart.
- **Phase review's "Plateau" and cross-phase stall flags are gone with the grade,** and the Progress ladders' "Plateau" badge (W9) is unchanged.
- **README line 26** still says "phase evaluation" in the Fitness row; left as true enough.
- **For W12 (3.3):** running (D6) and the muscle-map targets (D7) are untouched. The Running copy still says runs fall on "the days the lifting rotation leaves open". `fitness/basalt.js` is 9,087 lines; grep for function names. No README entry for the running or muscle work yet.

## 2026-10-02 · W12 · step 3.3 running, muscles and close-out

**Files.** Nothing committed. Backups are `<name>.backup-20261002-043815.<ext>`, taken before the first edit; the "before" tree is a scratchpad copy of the app taken at the same moment (`HELTH_INDEX`), with the old `tools/check-muscle-map.js` beside it.
- `fitness/basalt.js` (9,087 → 9,253 lines), running engine:
  - **A13 reproduced first, on the pre-change copy.** Claim 1: a 9-week plan started 5 Oct with nothing logged read week 2 on 12 Oct and week 3 on 19 Oct, and asked nothing. Claim 2 (the earlier draft's unconfirmed one): the VO2 plan's 30/30 intervals fall on Wed 21 Oct, and Full body B (hinge), Upper / lower's Lower (squat, hinge) and the rotation's Pull (hinge) were each due that day, with no note anywhere. Both claims held, so neither was dropped.
  - **Missed week (D6).** `running.weekOffset` (weeks repeated) and `running.askedWeek` (calendar week answered); `weekIndexFor` is the calendar week less the offset. `missedWeek()`, `answerMissed(choice)`, `undoRepeat()`. A card on the Running tab asks Repeat week N / Move on; the dashboard banner says it is waiting; the footer shows the repeat count with **Undo the last repeat**. `start()` and `clear()` reset all of it.
  - **Same-day note (D6).** `engine.liftOn(key)`, `run.clashFor(item, type)`, `run.moveRun` / `unmoveRun`, `running.moved` (planned date → new date). The note (`clashHtml`) is on the Running tab's next-run card, the Today tab's "Also scheduled today" card and the Today preview card (judged against the day being previewed). A moved run's row says so and has **Put it back**.
  - **Copy.** Removed every claim that runs fall on days the lifting leaves open: the module header, the `defaultState` comment, the goal picker's intro, its "How it interlocks with strength" card (a fictional Mon/Tue/Thu/Fri block, with `weekMapRow`, now deleted), the dashboard invite, the plan footer and the start-confirm text.
- `fitness/muscles.data.js`: `weeklyTarget` is gone from every group; `MUSCLE_WEEK` (3 sets, units per set per slot, row reads the pull profile) is new.
- `fitness/muscles.js`: `weeklyTargets(s)` works the target out from the active template's `engine.slotsFor(day, "focused")`; `model()` uses it; `App.muscles.weeklyTargets()` is public; the detail card names the template and says "assumes 3 sets a slot".
- `tools/check-muscle-map.js`: no longer holds the 4-day rotation. It reads `ROTATION`, `DAY_PATTERNS` and `TEMPLATES` out of `basalt.js` and audits every template: each slot has a units entry and a profile, and no group is left untrained. `--targets` is gone (nothing is stored to regenerate).
- `tools/check-workout.py`: P7, P8, P9, and `click_visible`, `start_run_plan`, `run_state`. `service-worker.js`: `CACHE_VERSION` v48 → v49, no files added. `README.md`: "Weekly targets follow your template" replaces "measured, not guessed"; two new entries for the missed week and the same-day note.

**Harness lines, before → after.** "Before" is the same script against the scratchpad tree; 0 page errors in either.

| Case | Before | After |
|---|---|---|
| P7 | FAIL: offset None; asks 0; plan on week 2 (index 1) on 12 Oct and index 2 on 19 Oct | PASS: asks 1, naming week 1 and 10 Oct; before {week 1, offset 0}; after Repeat {week 0, offset 1, asked 1}, 0 asks; 19 Oct {week 1, offset 1}, asks again; after Move on {week 1, offset 1, asked 2}; a fully logged week asks 0 |
| P8 | FAIL: Today notes 0, Running 0, `moved` None | PASS: Today notes 2 (preview 1), Running 1; Move run to tomorrow stores `{2026-10-21: 2026-10-22}`; 0 notes after; put back leaves `{}`; push day 0, easy run 0 |
| P9 | FAIL: lats 48 under every template; the tool lists 0 templates | PASS: lats 72 / 48 / 48 / 42 for Full body ×3, ×2, Upper / lower and the rotation, 96 for Upper / lower with a pull-up bar (hand-derived in the case); the tool audits 4 templates |

**Full regression on the live tree:** `check-workout.py` 39 pass, 0 fail, 0 error (two commands); `check-syncmerge.js` 6 pass; `check-training.js` all passed; `check-training-data.js` OK; `check-muscle-map.js` OK. One edit came after that run: `missedWeek` counts only planned days already past, because a run moved over the week's end (Sun 11 → Mon 12 Oct) was read as missed on the Monday it was due. Reproduced before the fix by reading, shown after it by `w12_edge.py` (asks False on the Monday, True a day later). P7, P8, P9 and `check-muscle-map.js` were rerun on the final tree: 3 pass, 0 fail, 0 error, and the same lines as the table. The other 36 cases were not rerun after that one-line filter.

**Extra checks** (scratch only: `w12_visual.py`, `w12_extra.py`, `w12_edge.py`, `w12_targets.py`), 0 page errors:
- **Themes and widths:** Selene (body `rgb(32, 41, 48)`) and Selene Day (`rgb(229, 233, 235)`) at 390, 1440 and 1920 px. The missed-week card, the note on Running (1) and on Today (2) all render; overflow 0 in all six. Screenshots checked by eye at 390 (dark), 390 (light, Today) and 1440 (light, Running). Transient toasts from the scripted flow overlap them; that is the script, not the page.
- **Legacy save:** a mid-plan save written by the previous build (running keys: goal, runDays, runLog, startISO, streak) opens in this one with `weekOffset` 0, `moved` `{}`, its run kept, and the missed card shown.
- **Backup → restore:** `weekOffset` 2, `askedWeek` 2 and a moved run survive BASALT's import.
- **300 sessions:** `App.muscles.model(7)` 2.0 ms average; the Running page renders.
- **No `alert(`, `confirm(` or `prompt(` in any added line** (diffed against the backups). The goal picker's existing start-plan dialog is untouched.

**Decisions this step made, as the plan left them to W12:**
- **Two integers, not one.** Move on needs memory or the question returns on every render, so `askedWeek` sits beside `weekOffset`. Neither needs a migration: absent reads as 0 and null. The schema stays v4.
- **"Elapsed time alone advances nothing"** is read as: the calendar never skips a week with an unlogged run without asking. After Repeat, a week of nothing asks again.
- **Hard** is tempo, interval, sprint, VO2 and test. The plan listed "tempo, intervals/vo2, test"; sprint runs are the same kind of load. Long runs are not hard.
- **A moved run is checked against nothing tomorrow.** Only today's finished session and `nextSession` are known, which is the same limit the calendar already states. The button is withheld when tomorrow already has a run.
- **Weekly targets are computed at run time, not stored per template.** A table of 14 × 4 numbers was tried first and was wrong for anyone without a pull-up bar: Upper's row and pull collapse into one slot, so its lats target was 96 for a profile that can only do 48. The tool then caught that `MUSCLE_FALLBACK` has no `row`, which silently dropped the row's work from my first numbers. Runtime targets read `slotsFor`, so equipment and switched-off slots count.
- **The rotation's targets fall 12.5%** (chest 96 → 84, abs 122 → 107, lats 48 → 42): the old numbers assumed 4 sessions a week, and the rotation's own rest rule allows 3.5 (W10's A11 fix). Existing users' bars read about 14% higher. Override by setting the rotation's `perWeek` in the model, not by editing numbers.
- **The standard-length session sets the target,** so Short and Full read as under or over it.
- **`unitsPerSet` is an assumption** (core a 30 s hold at 5 s = 1 unit, so 6). basalt.js's `BASE_REPS` seeds tier targets and is not read.

**Deviations from the plan.**
- **D7 says muscles.js "stops duplicating" the rotation.** It never did; the duplicate was in the tool. Both now read the templates, the tool from the source and the app from the engine.
- **D6's one integer became two** (above), and a `running.moved` record was added for "Move run to tomorrow", which the plan names but gives no storage.

**Left over, unconfirmed or out of scope:**
- **After a repeat, earlier weeks shift a week later in the week preview,** and their logs no longer tick them off. History is intact (Recent runs); only the preview and the calendar's planned markers move. One integer can't say which weeks sat where. Seen in the code and reasoned, not drawn.
- **`running` merges with this device winning** (`mergeFields`), so a repeat answered on a second device before a sync can be overwritten. Not run on two devices.
- **Only a log on the planned day ticks a run off.** A run done on Thursday for Wednesday's slot reads as missed. This predates the change; the prompt says so.
- **Pre-existing, seen while reading:** `js/views/health.js:467` reads `next.sess` and `next.dateISO` from `App.run.nextRun()`, which returns `{ week, item }`, so the "Next:" line on the VO2 card can never show. Source only, not run. The dashboard banner prints "x/3 runs this week" even in the plan weeks that have a rest slot.
- **Not run:** the Android and desktop shells; keyboard-only use of the two new cards (native buttons).

## 2026-10-02 · R3 · step 3.4 review

**Files.** No code changed. This entry is the only edit (backup `plans/PROGRESS-workout-progression.backup-20261002-053051.md`). Scratch scripts are `r3_probe.py` and `r3_visual.py` in this session's scratchpad; both import `tools/check-workout.py`'s helpers, so they drive the app the way the harness does.

**What was read.** The plan and this log. Stage 3 was read against W10's pre-edit backups (`*.backup-20261002-025631.*`), plus W11's for `js/syncmerge.js` and `README.md` and W12's for `fitness/muscles*.js` and `tools/check-muscle-map.js`, which W10 didn't touch. That is 2,550 diff lines in `fitness/basalt.js`, plus `training.js`, `training.data.js`, `syncmerge.js`, `muscles.js`, `muscles.data.js` and `index.html`.

**Harnesses on the live tree.** Every number matches W12's "after" column, and the 36 cases W12 didn't rerun after its last `missedWeek` edit pass too.

| Check | Result |
|---|---|
| `check-workout.py` | 39 pass, 0 fail, 0 error |
| `check-syncmerge.js` | 6 pass |
| `check-training.js` | all passed (29 cases) |
| `check-training-data.js` | OK |
| `check-muscle-map.js` | OK |

**Findings, ranked.** Each is reproduced by `r3_probe.py`, 0 page errors. All four are new in Stage 3, because the feature they sit in didn't exist before it, so there is no "before" run to quote.

| # | Label | Finding | Measured | Smallest fix |
|---|---|---|---|---|
| R3-1 | INCONSISTENCY (medium), new in 3.1 | **Following Full body ×2 exactly breaks the BASALT streak every week.** `recountStreak` and `liveStreak` allow a gap of `STREAK_GAP_DAYS = 3`, which was sized for every other day. Two sessions a week always leave one gap of 4 days or more, so the streak can never pass 2 | Full body ×2 on Mon/Thu, 5–22 Oct, by clicks: liveStreak before → after each session is 0→1, 1→2, **0→1**, 1→2, **0→1**, 1→2, best 2, while attendance reads **6 of 6**. The control, Full body ×3 on Mon/Wed/Fri, reaches 6 | In both readers, the gap is `Math.max(STREAK_GAP_DAYS, Math.ceil(7 / template.perWeek))`: 4 for ×2, and 3 for every other template, so nothing else moves. Smallest because both readers already sit on the one constant |
| R3-2 | INCONSISTENCY (low), new in 3.2 | **A recovery block that spans a period close vanishes from the new period's report.** `evaluate` counts only blocks with `startKey >= startKey` of the period | Block started 5 Oct; template switched 6 Oct (Phase 2); a workout on 7 Oct saves 2 sets per exercise and the `rb_` stamp. The banner shows, but Phase 2's Recovery section reads "Recovery blocks **0**", and the "sessions at reduced sets" count is hidden because it renders only when blocks > 0. A period closing on day 28 mid-block does the same | Count blocks that overlap the period (`recoveryEnd(b) > startKey`), with days clipped from `max(startKey, b.startKey)`. A spanning block then counts in both periods, which is true of it |
| R3-3 | INCONSISTENCY (low), new in 3.1 | **Switching to Upper / lower the day after a rotation session drops that rest day.** `restOn`'s `sameType` branch looks for an earlier session of the next day type; a Push from the rotation isn't one, so it returns "train" | Push logged 5 Oct; on 6 Oct `isRest` is true, then `setTemplate("upperlower")` makes it **false**, next Upper: pushing, shoulders and dips two days running. Switching to Full body ×3 instead keeps the rest day | In `restOn`, when the last session's type isn't in `tpl.order`, rest as `afterEach` does. One line, and it only acts on the day after a switch |
| R3-4 | INCONSISTENCY (low), new in 3.2 | **While backfilling during a block, the card offers Step up under a banner that says nothing steps up.** `decide` and the card check `recoveryOn(Hub.viewDate())`; the banner checks today. The decision is made today, whatever day is being logged | Block on 1 Oct, push at 3 × 12 twice. On today's push card: 0 Step up buttons, 2 sets. Logging to 30 Sep: the banner still shows, the card reads "Ready… step up to table height (~75 cm)?" with **1** Step up button, and 3 sets. The 3 sets are right, because 30 Sep predates the block | Pass `lib.today()` to `recoveryOn` in `decide` and in the card's reason line. The set cut keeps `viewDate` |
| R3-5 | COSMETIC (low), new in 3.1 | **Settings says bodyweight direction "isn't part of the phase grade".** W11 deleted the grade | Read on screen: "Optional. Only judges your weigh-in trend; it isn't part of the phase grade." The same phrase is in the `defaultState` comment for `weightDirection` | "Optional. Only judges your weigh-in trend; the phase report doesn't use it." |

**Checked, and nothing found:**
- **A hard Sunday run moved to Monday,** suspected of falling out of `nextRun` on Monday, because Monday is the next calendar week. Of the four plans, only the sprint plan has one: its last week, 13 Dec. There the week index is clamped, so on Monday the moved run is still the next run, the Today card says "Also scheduled today", and the row is visible with Put it back. Not reachable as shipped. It would become reachable if a plan ever puts a hard run on a Sunday before its last week.
- **Onboarding's `prefs` and `currentPhase` patch** goes through `deepMerge`, so the rest of each record survives.
- **Screens:** the missed-week card, the run clash note, the recovery banner, the three-section report and the template preview are visible in Selene (body `rgb(32, 41, 48)`) and Selene Day (`rgb(229, 233, 235)`) at 390 and 1920 px. Horizontal overflow is 0 in all four runs, with 0 errors. The light-theme report at 390 px was checked by eye. Element screenshots are partly covered by the script's own toasts, as W12 noted.
- **Modals:** no new `alert(`, `confirm(` or `prompt(` (W10–W12 diffed; not re-grepped here).

**Not run:** the Android and desktop shells; a real two-device sync (template switch, `running` offsets and `phaseHistory` still merge local-wins, as W10–W12 state); keyboard-only use of the new cards; backup/restore (W10–W12 ran it).

**Pre-existing, unconfirmed:** the Hub's fitness habit (`gamify.js` `CATEGORIES.fitness.done`) is "a session on that day", so a planned rest day may read as missed in the Hub's daily streak, under every template. It predates Stage 3. This is source only: it wasn't run, and grace days weren't traced.

**Before committing Stage 3:** R3-1 is the one that a user following the app as told sees every week. R3-2 to R3-5 are each a line or two. R1's and R2's notes on the `plans/` move, the deleted tracked backups and `tools/__pycache__/` still apply, and now so do the Stage 3 `.backup-*` files.

## 2026-10-02 · R3 follow-up · R3-1 to R3-5 fixed

**Files.** Nothing committed. Backups are `<name>.backup-20261002-125613.<ext>`, taken before the first edit; the "before" tree is a scratchpad copy of the app taken at the same moment (`HELTH_INDEX`).
- `fitness/basalt.js` (+36 / −15 lines):
  - **`streakGap(state)`** beside `recountStreak` (R3-1): `max(STREAK_GAP_DAYS, ceil(7 / template.perWeek))`, which is 4 for Full body ×2 and 3 for every other template. `recountStreak` and `engine.liveStreak` both read it, and `setTemplate` recounts, because the stored count was made under the old gap.
  - **`evaluate`'s blocks** count every block that overlaps the period, with its days counted from the later of the two starts (R3-2). A block running when a period closes counts in both periods.
  - **`restOn`** rests as `afterEach` when the last session's type isn't in the template's order (R3-3). `restDayInfo` returns `rule: "switched"` for that case, and `restReason` says "You trained Push Day yesterday under your previous template, so today rests before Upper starts the new one." Without the new text, the `sameType` sentence would have read "Upper and Push Day ran back to back".
  - **`decide` and the card's reason line** check `recoveryOn(lib.today())` (R3-4). The set cut in `buildWorkout` keeps `Hub.viewDate()`, so a backfilled day before the block keeps its full sets.
  - **The `weightDirection` comment** no longer mentions a phase grade (R3-5).
- `index.html`: the bodyweight direction note now reads "Optional. Only judges your weigh-in trend; the phase report doesn't use it." (R3-5).
- `service-worker.js`: `CACHE_VERSION` v49 → v50. No files added.
- `tools/check-workout.py`: new T27–T31, all driven by clicks except `Hub.setViewDate` and one direct `decide` call in T30, and an engine read for T28's counts. The header lists them.

**Before → after.** Same script, before tree versus live tree, with 0 page errors in each run.

| Case | Before | After |
|---|---|---|
| T27 (R3-1): Full body ×2, Mon/Thu, 5–15 Oct | FAIL: streak before each session 0, 1, **0**, 1; count 2, best 2 | PASS: 0, 1, 2, 3; count 4, best 4. Rotation control, a 4-day gap: still resets to 1 |
| T28 (R3-2): block 5 Oct, switch 6 Oct, workout 7 Oct | FAIL: Phase 2 blocks 0; row "Recovery blocks 0" | PASS: 1 block, 2 days, 1 session; row "Recovery blocks 1 · 2 days · 1 session at reduced sets" |
| T29 (R3-3): Push 5 Oct, switch to Upper / lower 6 Oct | FAIL: 6 Oct isRest False, 1 Begin button | PASS: 6 Oct isRest True, rule `switched`, 0 Begin buttons, the reason names the switch; 7 Oct trains Upper |
| T30 (R3-4): block 1 Oct, logging to 30 Sep | FAIL: 1 Step up button; `decide` stepped to table | PASS: 0 buttons, "…the step waits until your recovery block ends"; `decide` null, still counter; sets 3, 3, 3, 3 |
| T31 (R3-5): Settings note | FAIL: "…it isn't part of the phase grade." | PASS: "…the phase report doesn't use it." |

**Full regression on the live tree:** `check-workout.py` 44 pass, 0 fail, 0 error; `check-syncmerge.js` 6 pass; `check-training.js` all passed; `check-training-data.js` OK; `check-muscle-map.js` OK.

**Left over:**
- **The streak gap reads today's template,** so a history trained under the rotation and recounted under Full body ×2 gets the wider gap retroactively. `best` never drops, so nothing is lost; an old 4-day gap can join two runs that used to be separate.
- **Not run:** themes by eye (copy only, no new colours), the Android and desktop shells, a real two-device sync.
