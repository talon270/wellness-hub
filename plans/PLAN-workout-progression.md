# Workout coaching and progression — plan

Written **2026-10-01**, against the working tree at commit `0d878b1`, BASALT schema **v3**. `fitness/basalt.js`, `js/syncmerge.js`, `js/gamify.js`, `js/insights.js` and `js/core.js` are unchanged since that commit. Replaces the 2026-09-30 draft, kept as `PLAN-workout-progression.backup-20261001-173054.md`; every finding in it still holds and is renumbered here.

**Method:** line-level re-read of every function the earlier draft cited (all 18 line references matched), plus the date helpers in `js/core.js`, the Hub's readers of BASALT data (`js/gamify.js`, `js/insights.js`), the sync merge (`js/syncmerge.js`), the 84-movement exercise DB and its 63 pain substitutions. **Reproduced** means run on 2026-09-30 or 2026-10-01: Playwright against `index.html` in fresh profiles, timezone Asia/Kolkata, clock set per case, real clicks for onboarding and every workout, `page.evaluate` only for fixtures and direct engine calls, zero page errors; the sync case in Node against the real `js/syncmerge.js`. **Source** means traced in the code, not run. Native Android and desktop shells were not exercised.

**Nothing below is implemented — this is the plan.** Approval is per stage: approving Stage 1 approves nothing in Stage 2 or 3.

## The three stages

| Stage | What it does | Schema | Approve |
|---|---|---|---|
| **1 · Fixes** | Wrong-day logging, sync loss, the two ways a save gets destroyed, and the training bugs — each by its smallest fix | stays v3 | now |
| **2 · Progression** | Per-exercise prescriptions and evidence, movement families, equipment, assessment, the Workout screen | v4 | after Stage 1's review |
| **3 · Schedule** | Templates, attendance, goals, recovery block, phase report, running | v5 only if a record needs it | after Stage 2's review |

**Stage 1 goes first because two of its fixes only work if they ship before v4 exists** (A9). Each stage ends with a review window whose report is the evidence for approving the next one. Part F maps every step to a chat window, a model and an effort level.

## Decisions this plan makes for you

Each has a default. Override any of them when you approve the stage it belongs to.

| Decision | Default | Alternative |
|---|---|---|
| Stage 1 adds an optional `session.dayKey` | No version bump: nothing needs migrating, and every reader falls back for sessions without it | Bump to v4 now; Stage 2 becomes v5 |
| A session deleted on one device, after sync | Comes back from any device that still has it, until it is deleted on every device — the cost of union by id without tombstones (corrected in R1-4) | Tombstones (out of scope) |
| Onboarding placement until Stage 2 | Capped at the movement each test covers (1.4) | Keep the proxies until Stage 2 replaces them |
| Old sessions as evidence for a step-up | Never count: they carry no saved prescription, and their "moderate" may mean "not rated" | Count old sessions whose exercise id matches |
| Ranges, the two-session rule, load steps | C1–C2, as named constants | Change the constants in `training.data.js` |
| The new row slot | Offered on the first pull day, applied only if ticked | Added for everyone at upgrade |
| Points | Stop in Stage 2; levels become history | Keep points running beside the evidence rule |
| Templates | You choose; the current rotation stays until you do | Move everyone to full body ×3 |

## Part A — findings, ranked

### A1 · BUG (high): workouts are filed on the wrong day, three ways

**Reproduced.** BASALT, the Hub and the Hub's streaks each work out a session's day differently:

| Case | BASALT files it on | Hub's day | What breaks |
|---|---|---|---|
| Finished 05:00 IST, default settings | 1 Oct | 1 Oct | The fitness streak shows 1 Oct **not done**: `gamify.js:242` keys sessions by `dateISO.slice(0, 10)`, the UTC date, so every workout finished 00:00–05:29 IST counts for the day before. `insights.js:179` (volume) and `:192` (weigh-ins) do the same |
| Finished 00:20, `dayStartHour` 4 | 2 Oct | 1 Oct | `lib.today` and `lib.dayKey` (`basalt.js:1905–1909`) use the calendar date, so "done today", the rest day and the next session all shift a day late |
| Logged while backfilling 29 Sep | 1 Oct | 29 Sep | The bar on the Fitness view reads "Logging for Tue 29 Sept · 2d ago" while `finalizeSession` stamps the current time (2378) |

`context.md` names wrong-day logging as the one thing Wellness Hub must never get wrong. `basalt.js` has 33 `lib.today()` and 38 `lib.dayKey(` call sites; none applies the rollover hour.

**Fix:** decide the training day once, when the workout begins — `Hub.viewDate()` already applies both the rollover hour and the logging date. Carry it on the draft, save it as `session.dayKey`, and give every reader one rule: `s.dayKey`, else the timestamp's local day with the rollover applied, never the UTC slice. Smallest because the day is decided at the one place that knows both inputs, instead of teaching 71 call sites the rule. → **1.3**

### A2 · BUG (high): sync keeps one device's workouts and drops the other's

**Reproduced** in Node against the real module. `syncmerge.js:285` merges BASALT with `mergeFields(file.ironframe, local.ironframe, true)`. `mergeFields` doesn't recurse into arrays, so the local array replaces the file's whole, and `preferB` is hard-coded, so local wins every tie. Phone logs `s_phone`, desktop logs `s_desk`: the desktop merge keeps `[s_shared, s_desk]`, the phone merge keeps `[s_shared, s_phone]`, and PRs behave the same. The sync file holds whichever device wrote last; a new or reset device inherits one device's history. The comment's reason — "nothing in it is keyed by id" — is wrong: sessions (`s_`), flags (`f_`), PRs (`pr_`), goals (`g_`) and runs (`run_`) all carry ids. Every transport goes through this function (`storage.js:306, 316, 326, 349`).

**Fix:** a BASALT merge inside `mergePayload` — union by id for the id-keyed arrays, one PR per exercise and kind keeping the higher value, and the higher `version` (A9). Everything else merges as today. A session deleted on one device (`basalt.js:5647`) comes back from any device that still has it, until it is deleted on every device (corrected in R1-4: "until both have merged" was wrong). The Hub's own `mergeById` has the same cost. → **1.2**

### A3 · BUG (high): progression credits work that wasn't done

**Reproduced.** `_progress` (2567) pays half its base even when no set reached the target, so an untouched, unrated exercise earns `round(26 × 0.5)` = **13** points. One logged wall push-up set advanced shoulder, dip and core by 13 each; eight sessions of 3 × 1 against an 8-rep target reached Level 2. **Fix:** no points when no set reached the target — `if (!hit) return null;` after 2569. Smallest because it is one guard where the points are computed, and every caller goes through it. → **1.4**

### A4 · BUG (high): a pain flag relabels the exercise and trains it anyway

**Reproduced** through clicks. None of the 63 pain substitutions (`SUBSTITUTIONS`, 1605, one copy per Era) carries an exercise id. All 21 "sharp" entries read "Skip <pattern> pattern today", yet the original movement's set inputs, cues and target stay on screen. A flagged exercise still earns progression (+13 after a sharp wrist flag), sets a PR under the original exercise's id (`_checkPR`, 2600) and feeds the next target (`_adaptTarget`, 2248). The panel calls every substitution "SAFE SWAP" (3826). Separately, `doSwap` (3790) keeps the target across a change of unit: 8 reps becomes 8 seconds.

**Fix:** one rule in four readers — a flagged exercise is excluded from `_progress`, `_checkPR`, `_adaptTarget`'s history and `evaluate`'s rep ratio. Severity `sharp` means skip, since every sharp entry already says so: the set inputs disappear and the exercise saves as `skipped: true`. "SAFE SWAP" becomes "Suggested swap". A swap that changes unit restarts the target the way a level-up does (`holdStart` / `BASE_REPS`). Swapping to real exercise ids with recalibrated prescriptions needs Stage 2. → **1.4**, completed in **2.4**

### A5 · BUG (high): onboarding places untested skills and leaks seconds into reps

**Reproduced** through the wizard with 35 push-ups, 5 pull-ups, a 45 s tuck L-sit, 25 Bulgarian split squats per leg and a 30 s hollow hold:

| Pattern | Placed at | Target |
|---|---|---|
| push | L5 Archer Push-up | 8 reps |
| pull | L3 Negative Pull-up | 5 reps |
| squat | L6 Weighted Pistol Squat | 12 reps |
| core | L5 Dragon Flag Negative | **30 reps** |
| shoulder | L4 Kick-to-Handstand | 6 reps |
| dip | L4 Korean Dip | 8 reps |

The pull field's label is "5 pull-ups / 20 inverted rows"; entering 20 places a profile that owns no pull-up bar at **L6 Archer Pull-up**. `computePlacement` (2826) uses each test as a proxy for rungs it never tested. `finishOnboarding` (2930) sets levels but not targets, so the default plank seconds leak into reps — the exact number the v3 `repairTargets` migration was written to repair, recreated for every new user with a 45 s or longer L-sit. The hollow-hold test is collected and never used.

**Fix:** cap each pattern at the movement its test actually covers (table in 1.4), and start each placed tier the way a level-up does. Under-placement (5 pull-ups → negatives) errs safe and waits for Stage 2's assessment. → **1.4**, replaced in **2.4**

### A6 · BUG (high): targets are adapted from a different exercise's history

**Reproduced.**
- After 3 × 8 wall push-ups, levelling to Push-up stores 12, and `_adaptTarget` prescribes **10** with the reason "below target last session" — a sentence about a different exercise.
- A 20 s L-sit history raises a new Dragon Flag Negative target from 5 to **7** reps.
- `evaluate` floors every hold target at 30 s (6146), so three perfect 20 s L-sit sessions score **66.7%**.

**Fix:** `_adaptTarget` matches history by exercise key, not pattern (2260), and skips flagged exercises; `evaluate` drops the floor. The earlier draft's stale-base case (9 recommended again after hitting 9) is how the current model is built — per-session nudges off a per-level base — so Stage 2 replaces it rather than patching it. → **1.4**

### A7 · BUG (high): a deload raises the smallest targets

**Reproduced.** `applyAdvancement` (6387) applies its floor after the 25% cut: `max(isHold ? 20 : 6, round(base × 0.75))`. Every hold under 20 s rises to 20 s, and every rep target of 5 or less rises to 6:

| Movement | Target | After a deload |
|---|---|---|
| Hollow Body Hold | 15 s | **20 s** |
| L-Sit | 10 s | **20 s** |
| Dragon Flag Negative | 5 | **6** |
| Pull-up | 5 | **6** |
| Dead Hang | 25 s | 20 s |
| Parallel Bar Dip | 7 | 6 |

Hollow Body Hold and L-Sit start at exactly 15 s and 10 s (`holdStart`), so anyone who just levelled into them gets a harder deload. **Fix:** the result can't exceed the current target — wrap it in `Math.min(base, …)`. The 28-day deload length, consolidation's 20% shorter rest (2156) and the stacked "Max effort" mode (2070) belong to Stage 3. → **1.4**

### A8 · DESIGN RISK (high): an error while loading erases fitness history

**Reproduced** with a truncated save. `load()` (302) runs `JSON.parse`, `migrate` and `healState` in one `try`, and the catch (312) resets to defaults with a console warning. A returning user got first-run onboarding, and finishing it overwrote the save with `sessions: []`; no copy existed anywhere. The sync path makes it worse: `storage.js:241–251` reads an unreadable save as `null`, so the next merge writes the remote copy straight over it (`storage.js:553, 873`). Not reproduced with a throwing migration — none exists yet — but Stage 2's migration runs inside this `try`.

**Fix:** in the catch, first copy the raw string to `ironframe.state.v1.unreadable-<YYYYMMDD-HHMMSS>`, then put BASALT in read-only mode (`saveState` refuses to write) and show a persistent banner instead of onboarding. The success path doesn't change. → **1.2**

### A9 · DESIGN RISK (high): an older build would use and rewrite a newer save

**Source.** `migrate()` (216) deep-merges a save whose version is newer than its own and carries on, so the build that ships Stage 1 would write v3-shaped sessions into a v4 save from any device not yet updated. The Android app updates through its own updater, so devices running different builds is normal. The guard has to live in the old build, which means it has to ship before v4 exists. **Fix:** a save newer than the running build loads read-only, with a banner saying to update the device (the same mechanism as A8), and the BASALT merge keeps the higher `version`. → **1.2**

### A10 · DESIGN RISK (high): ladders mix different qualities and ignore equipment

**Source** (`PROGRESSIONS`, 54; the exercise DB):
- **hinge:** Glute Bridge > Hip Thrust > Single-Leg Hip Thrust > **Nordic Curl Negative** > Nordic Curl > Shaking Nordic — hip extension turns into knee flexion at L4.
- **shoulder:** Pike > Elevated Pike > **Wall Handstand Hold > Kick-to-Handstand** > HSPU Negative > HSPU — pressing turns into balance at L3.
- **pull:** … Pull-up > **Chin-up** > Archer Pull-up — a grip choice ranked as a level.
- **dip:** … Parallel Bar Dip > **Korean Dip** > Ring Dip > Weighted Dip.
- Every pull rung needs a bar. The default profile has none (`equipment.pullupBar: false`) and still gets Dead Hang. Two no-equipment rows (`pull_alt_tabledoor`, `pull_alt_towel`) exist and are never prescribed.
- A beginner's pull day is Dead Hang, Glute Bridge and Plank — no pulling movement.
- Dumbbell, kettlebell and bench movements (`*_e2_*`) unlock only after every Era I benchmark (`era2Accessory`, 2133).

The catalogue already holds most of what the program lacks: inverted, table and towel rows; band-assisted pull-ups; dumbbell rows; goblet squat; dumbbell RDL; overhead press; assisted pistol; a 17-movement skill track. Two things are genuinely missing: an incline push-up between wall and floor — the largest jump in any ladder — and a split squat that needs no bench. → **Stage 2**

### A11 · INCONSISTENCY (medium): attendance expects 16 sessions in 28 days; the rest rule allows 14

**Reproduced** (`expectedSessions` returns 16) and **source** (`restDayInfo`, 2499: the day after every session is rest). Following the app exactly reads 87.5%. The copy repeats it: "Aim for 4/week" (6202), the `x/4` tile (4535), "aim for 4 sessions this week" (4661), the "4 days / week" badge (6799). **Fix:** `Math.ceil(dur / 2)` at 2675, and copy that says "every other day". → **1.4**; Stage 3 replaces it with template-based planning.

### A12 · INCONSISTENCY (medium): two answers to "ready to advance"

**Source.** All 84 movements carry `readiness` prose that the Workout card renders ("Ready to advance when you can do 20 slow, flawless reps…" on Wall Push-up), while advancement actually runs on points. Stage 2's rule would disagree with the card on screen. `HOLD_ADVANCE_AT` was created to close exactly this gap for holds (comment at 2038). → **Stage 2**: the card shows a sentence generated from `training.data.js`.

### A13 · INCONSISTENCY (medium): running advances by calendar, lifting by sessions

**Source.** `weekIndexFor` (7740) is `floor(days since start / 7)`, so a missed week still moves the running plan on; runs use fixed weekdays while lifting follows the last session. The earlier draft's hard-run/leg-day conflict is unconfirmed. → **Stage 3**, reproduce first.

### A14 · DESIGN RISK (medium): unrated effort is saved as "moderate"

**Reproduced.** `finalizeSession` saves `ex.difficulty || "moderate"` (2394): a workout with nothing rated saved four "moderate"s. So every old "moderate" is indistinguishable from "didn't answer". **Fix:** save `null` when unrated — every reader already supplies its own default. Stage 2 reads every old "moderate" as unknown. → **1.4** and **2.3**

### A15 · MODEL GAP (medium): goals don't change workouts; one grade advances every pattern

**Reproduced.** Strength and size goals build identical prescriptions; `buildWorkout` never reads `profile.goal`. `isBulk` (6098) treats "both" as bulking and folds bodyweight change into the grade, and `applyAdvancement` raises every pattern's target once the blended rep ratio reaches 0.9. → **Stage 3**

### A16 · NOISE (low): set-count adaptation never runs

**Reproduced.** `_adaptSets` (2348) reads a session-level `difficulty` that `finalizeSession` never writes; two all-"easy" push sessions still give 3 sets. **Fix:** delete it and its call (2165) — behaviour is unchanged. → **1.4**

## Part B — Stage 1: fixes (schema stays v3)

Every bug in Part A that is reproduced and has a small fix, shipped with no migration and with before/after proof. Each step ships on its own, in this order.

### 1.1 · Harness, and the "before" record

- `tools/check-workout.py` (Playwright, Python): one function per case in Part E's Stage 1 table, each printing `S<n> PASS|FAIL` with its measured numbers; exit code 1 if any case fails. A fresh browser context per case, `timezone_id="Asia/Kolkata"`, `page.clock.install()` for timed cases, network routed to abort, real clicks for onboarding and workouts, and `page.evaluate` only to seed fixtures or call engine functions directly.
- `tools/check-syncmerge.js` (Node): loads `js/syncmerge.js` in a `vm` context and runs S6–S7.
- Both are permanent regression checks, like `check-muscle-map.js`. Scratch output stays in the session scratchpad.

**Handles verified on 2026-10-01:**

| Area | Handles |
|---|---|
| Hub and onboarding | The button named "Explore first", then "Fitness". `#onb-body [data-onb="next"]` four times. `[data-stepper="bench-<pushups\|pull\|lsit\|bulgarian\|hollow>"] input`. `#onb-body [data-onb="next"]`, then `[data-onb="finish"]` |
| Navigation | `#nav [data-section="today"]`, or `#fit-toggle` then `#fit-panel [data-section="today"]` |
| Workout | `#begin-session`. `[data-stepper="set-<exercise>-<set>"] input` (fill, then Tab). `#complete-session` |
| Pain flag | `[data-flag="<i>"]`, `#flag-sev-<i>`, `#flag-apply-<i>` |
| Engine | `App.defaultState()`, `App.getState()`, `App.engine` (`_progress`, `_adaptTarget`, `buildWorkout`, `finalizeSession`, `expectedSessions`), `App.evaluation.evaluate` and `.applyAdvancement`, `App.lib.dayKey` |
| Hub | `Hub.today()`, `Hub.setViewDate(key)`, `Hub.state.settings.dayStartHour` + `Hub.save()`, `Hub.gamify.invalidate()`, `Hub.gamify.CATEGORIES.fitness.done(key)` |

The scripts that produced Part E's "Before" numbers may still exist at `/tmp/claude-1000/-home-talon-SyncedWork-Claude-Helth/66a7b077-cb31-40af-adab-9ce3abcdfa2b/scratchpad/` (`verify_plan.py`, `verify_more.py`, `verify_merge.js`). `/tmp` doesn't survive a reboot, so don't depend on it.

**Done when:** against the untouched tree, every Stage 1 case FAILS with the numbers in Part E's "Before" column. A case that passes before any fix is a harness bug.

### 1.2 · Data safety: A2, A8, A9

**`js/syncmerge.js`:** inside `mergePayload`, replace `mergeFields(file.ironframe, local.ironframe, true)` with `mergeIronframe(file, local)`:

| Field | Rule |
|---|---|
| `sessions`, `flagsHistory`, `goals`, the running `runLog` | Union by `id`; same id → the local copy |
| `prs` | One record per `exerciseId` + `kind`, keeping the higher `value` and its date |
| `version` | The higher of the two |
| Everything else | Today's `mergeFields(…, true)` |

Inventory every array in `defaultState()` (`basalt.js:99`); list any that doesn't fit these rules in the progress log rather than guessing.

**`fitness/basalt.js`:**
- In `load()`'s catch (312), copy the raw string to `ironframe.state.v1.unreadable-<YYYYMMDD-HHMMSS>`, then set `READ_ONLY = "unreadable"`.
- After `migrate`, a stored version above `SCHEMA_VERSION` sets `READ_ONLY = "newer"`.
- `saveState()` and `resetState()` write nothing while `READ_ONLY` is set.
- `bootstrap()` skips onboarding while `READ_ONLY` is set and shows a persistent banner, in both themes, with no `alert()`. For unreadable: "Your fitness data couldn't be read. It's untouched, and a copy is saved as `<key>`. Restore a backup from Settings, or keep using Fitness read-only." For newer: "This fitness data was saved by a newer version of the app. Update this device to keep logging here — until then it's read-only."
- `reloadFromRemote()` re-checks both conditions, since a sync can bring in a newer save.

**Done when:** S6–S9 pass, and a fresh profile and a seeded v3 profile both load with zero errors and save normally.

### 1.3 · The training day: A1

**`js/core.js`:** add `dayOf(isoOrMs)` beside `today()` (544), and export it. It returns the local date of a timestamp with the rollover hour applied — the same rule `today()` applies to now.

**`fitness/basalt.js`:**
- The `#begin-session` handler (3289) stamps `w.dayKey = Hub.viewDate()` on the draft. The workout screen shows that day whenever it isn't today. `finalizeSession` writes `session.dayKey = w.dayKey || Hub.viewDate()`.
- One helper: `sessionDay(s)` returns `s.dayKey || Hub.dayOf(s.dateISO)`. `completedSessions()` sorts by it, then by `dateISO`.
- `lib.today()` returns `Hub.today()`.
- Before editing, classify every one of the 33 `lib.today()`, 38 `lib.dayKey(`, 12 `lib.iso()`, 5 `todayLocal()` and 5 `keyOf(` call sites, and record the count per class in the progress log:
  - **now** → `Hub.today()`;
  - **a record's timestamp** → `sessionDay` or `Hub.dayOf`;
  - **a day-key string, or a Date built from one** → unchanged calendar arithmetic.

**`js/gamify.js:242`** and **`js/insights.js:179`** read `s.dayKey || Hub.dayOf(s.dateISO)`; **`js/insights.js:192`** reads `Hub.dayOf(e.dateISO)`.

**Traps, each with a harness case:**
- `new Date("2026-10-01")` is 05:30 IST. With `dayStartHour` 6, a rollover-aware reader would move it to 30 Sep. Day keys, and Dates built from them, never get the rollover (S4).
- `lib.today()` and the day of a record created "now" must change together. Switch only `lib.today()` and `todayNutrition` (2633) misses its own entry between midnight and the rollover hour, then adds a new one on every render.
- The day is fixed when the workout begins. Started 23:50 and finished 00:20 with rollover 0, it belongs to the day it began (S5).

**Done when:** S1–S5 pass, and the 05:00 workout counts for 1 Oct in BASALT, the streak and the calendar.

### 1.4 · Training fixes, then close-out: A3–A7, A11, A14, A16

| Finding | Change | Where |
|---|---|---|
| A3 | `if (!hit) return null;` | `_progress`, after 2569 |
| A4 | Skip flagged exercises in finalize's progression loop, `_checkPR`, `_adaptTarget`'s filter and `evaluate`'s rep ratio | 2418, 2600, 2260, 6143 |
| A4 | A `sharp` flag saves `skipped: true`, hides the set inputs and shows the substitution's cue in place of the original cues | `openFlagPanel` 3810, workout render |
| A4 | "SAFE SWAP" → "Suggested swap" | 3826 |
| A4 | A swap that changes unit restarts the target (`holdStart` / `BASE_REPS`) | `doSwap` 3790 |
| A5 | Placement caps below; a tier placed above L1 starts the way a level-up does | `computePlacement` 2826, `finishOnboarding` 2930 |
| A6 | Match by exercise key; compute `cur` before the filter | `_adaptTarget` 2260 |
| A6 | Drop `Math.max(target, 30)` | `evaluate` 6146 |
| A7 | `Math.min(base, …)` | `applyAdvancement` 6387 |
| A11 | `Math.ceil(dur / 2)`; the copy at 4535, 4661, 6202 and 6799 says "every other day" | `expectedSessions` 2675 |
| A14 | Save `ex.difficulty \|\| null` | `finalizeSession` 2394 |
| A16 | Delete `_adaptSets` and its call | 2348, 2165 |

Placement caps for A5:

| Pattern | What places it | Cap | Why |
|---|---|---|---|
| push | Push-up test | L2 Push-up | The movement tested |
| pull | "5 pull-ups / 20 inverted rows" | L3 Negative Pull-up | The field can hold rows, which don't prove a pull-up |
| squat | Bulgarian split squat test | L3 Bulgarian Split Squat | The movement tested |
| core | Tuck L-sit test | L3 Tuck L-Sit | The movement tested |
| hinge | Follows squat | L3 | Unchanged; L4 and above is Nordic work |
| shoulder | Follows push | L2 Elevated Pike Push-up | L3 and above is the handstand track |
| dip | Follows push | L1 Bench Dip | Every higher rung needs bars or rings the profile may not own |

**Close-out, in the same window:**
- **README:** add entries to the "things most X get wrong" section for the training-day rule, the sync rule and the deload floor. Each is a bolded claim, the reason, and the real numbers from Part A.
- **Service worker:** bump `CACHE_VERSION` in `service-worker.js` (v40 → v41). Stage 1 adds no files.
- **Standing checklist:**
  - fresh and seeded v3 profiles load with zero errors;
  - the read-only banner and the skipped exercise checked in both themes at 390, 1440 and 1920 px;
  - offline reload works;
  - a Settings backup → restore round trip keeps `dayKey`.

**Done when:** S10–S21 pass, S1–S9 still pass, and the checklist is done.

### 1.5 · Review

A fresh window reads this plan, the progress log and `git diff` for Stage 1's files. It re-runs both harnesses, drives the changed screens itself, and reports findings ranked with the house labels, each verified by running. It changes no code. Its report is what you approve Stage 2 against.

## Part C — Stage 2: per-exercise progression (schema v4)

**Each recommendation comes from comparable sessions of the same exercise, and says which ones.**

### C1 · The prescription

Each slot (push, row, pull, squat, hinge, core, shoulder, dip) holds one accepted prescription:

```
{ exerciseId, setup, sets, range: [lo, hi], unit, acceptedAt, why }
```

`setup` holds only what changes difficulty:
- `surface` for the incline push-up;
- `bodyAngle` for rows;
- `band` for the assisted pull-up;
- `loadKg` plus `loadMode` (`perHand` or `total`) for loaded movements.

Every session saves a copy of the prescription on each exercise (`rx`), which is never edited afterwards. Rest stays a setting (90 s for reps and 60 s for holds today); Stage 3 adds goal defaults.

The defaults below are named constants in `training.data.js`. They are product choices, not validated thresholds, and the Workout card says so:

| Kind | Range | Sets | When ready |
|---|---|---|---|
| Reps, bodyweight | 6–12 | 3 | Next setup or movement, starting at the bottom of its range |
| Reps, loaded | 6–12 | 3 | +2.5 kg per dumbbell or +4 kg per kettlebell, back to 6 |
| Unilateral | 6–12 per side | 3 | As above |
| Eccentric (negatives) | 3–6, lowering for 3–5 s | 3 | Next movement |
| Hold | `holdStart` to `HOLD_ADVANCE_AT` (L-Sit 10–20 s, Plank 30–60 s) | 3 | Next movement |
| Skill (`skill_*`) | Its own success standard | 3–5 attempts | Optional branch, never compulsory |

### C2 · When to step up: double progression, per exercise

- **Comparable:** same `exerciseId`, `unit`, `setup` and set count. Not flagged, not skipped, and not inside a recovery block. Ordered by `sessionDay`, then `id`.
- **Ready:** every working set reached the top of the range in the two most recent comparable sessions, on different days, each rated "just right" or "easy". The card offers the step with both dates; you choose **Step up** or **Repeat**.
- **Repeat** is the default for everything else. The card shows the range and last time's sets: "Last: 10 / 9 / 8 — aim to add a rep."
- **Reduce:** when each of the two most recent comparable sessions totals less than the one before it, offer the previous setup; you choose.
- **Unknown:** effort left blank or "not sure", and every legacy session without `rx`. Logging still works, but these never count toward Ready.

The recommendation is recomputed from history every time. Only your choice is stored, as `{ choice, at }` under `exerciseId|<id of the latest evidence session>`. New evidence means a new key, so nothing ever needs invalidating or merging.

### C3 · Movement families and the catalogue: A10

Slots keep their pattern names, and `row` is new. In `training.data.js`, every exercise gets `{ slot, branch: "main" | "skill", next, equipment, kind }`. The old level number stays on `tiers` as history; progression now follows `next`.

| Slot | Main path (existing ids unless **new**) | With equipment | No equipment | Optional skill branch |
|---|---|---|---|---|
| push | push_1 → **push_incline** (counter → table → chair → step) → push_2 → push_3 → push_4 (bench) | push_e2_weighted, push_e2_dbpress | push_1, push_incline, push_2, push_3 | push_5, push_6, push_alt_onearm, skill_planche_1–5 |
| row (new) | pull_alt_tabledoor (knees bent → body straight) | pull_alt_australian (bar), pull_alt_row, pull_e2_dbrow | pull_alt_tabledoor, pull_alt_towel | skill_frontlever_1–4 |
| pull | pull_1 → pull_2 → pull_alt_bandassist or pull_3 → pull_4; pull_5 Chin-up is a grip option of pull_4, not a rung | Needs a bar | None — the card says so, and the row slot carries pulling | pull_6 |
| squat | squat_1 → squat_2 → **squat_split** → squat_3 (bench) | squat_e2_goblet | squat_1, squat_2, squat_split | squat_4, squat_alt_assistedpistol → squat_5 → squat_6 |
| hinge | hinge_1 → hinge_2 (bench) → hinge_3 | hinge_e2_rdl, hinge_e2_swing | hinge_1 | hinge_4 → hinge_5 → hinge_6 |
| core | core_1 → core_2 → core_3 (bench) | — | core_1, core_2 | core_4, core_5, core_6, skill_lsit_1–3, skill_vsit |
| shoulder | shoulder_1 → shoulder_2 (bench) | shoulder_e2_ohp | shoulder_1 | shoulder_3–6, skill_handstand_1–4 |
| dip (optional) | dip_1 or dip_alt_chair → dip_alt_twochair or dip_2 → dip_3 | — | dip_alt_chair, dip_alt_twochair | dip_4, dip_5, dip_6 |

**Two new movements, and only two:**
- `push_incline`, with `surface` set to counter (~90 cm), table (~75 cm), chair (~45 cm) or step (~20 cm).
- `squat_split`, a static split squat with no equipment.

Each needs a DB entry (cues, mistakes, an injury note), a `muscles.data.js` mapping at all three weights, and a `phases.data.js` entry; `node tools/check-muscle-map.js` must pass.

**Equipment.** A slot's exercise must use equipment you own; otherwise the no-equipment option is prescribed and the card says why. The Era gate on `*_e2_*` movements goes; Era graduation stays as an achievement. Loaded movements show a weight input regardless of Era, marked per hand or total.

**Pain substitutions** (finishing A4). `training.data.js` maps each substitution name to an exercise id where one exists:

| Substitution name | Exercise id |
|---|---|
| Wall Push-up | `push_1` |
| Incline Push-up | `push_incline` |
| Wide Push-up | `push_alt_wide` |
| Scapular Pull | `pull_2` |
| Negative Pull-up | `pull_3` |
| Inverted Row | `pull_alt_australian` |
| Glute Bridge | `hinge_1` |
| Hip Thrust | `hinge_2` |
| Single-Leg Hip Thrust | `hinge_3` |
| Plank | `core_1` |
| Pike Push-up | `shoulder_1` |

Applying one swaps to that id at the bottom of its range. Names with no matching movement (Fist Push-up, Box Squat, Dead Bug, …) keep the original exercise with the substitute's cue, and earn no evidence.

### C4 · Placement becomes assessment: A5

For new users, onboarding asks about equipment first. Then, per slot, it asks for "the hardest of these you can do for 6 clean reps (or the hold) without pain", offering the main path for the equipment you own plus "Not sure".

- **The answer** becomes the starting prescription at the bottom of its range, marked "unverified" until the first comparable session.
- **"Not sure"** starts at the first main-path movement.
- **The pull test** splits into pull-ups and rows.
- **Era I benchmarks** stay as achievements and no longer place anything.
- **Existing users** skip this.

### C5 · The Workout screen: A12

- **Prescription first:** exercise, setup, sets × range. Then the last comparable sets with their date, then the reason line, either "Repeat: set 3 below 12" or "Ready: 3 × 12 on 24 and 27 Sep — step up to table height?" with **Step up** / **Repeat**. The muscle-share graphic moves below.
- **Effort:** Easy / Just right / Hard / Failed / Not sure. A blank saves as unknown.
- **When to advance:** the card shows a generated sentence ("Step up after two days at 3 × 12, rated just right or easy"). The 84 `readiness` strings stop rendering; their form standards already live in the cues.
- **Skips:** a sharp flag shows "Skipped — <cue>" with no inputs. The finished card counts complete, partial and skipped exercises separately.
- **Program view:** each slot's exercise and range, and its comparable sessions so far ("1 of 2 at 3 × 12").

### C6 · Schema v4

**What's added:** `training: { slots, decisions, assessment }`, plus `rx` on every exercise of every session from now on.

**Migration v3 → v4:**
- each slot comes from the current tier: same exercise as today, range from `training.data.js`, 3 sets, `why: "carried over from Level N"`;
- `dayKey` is written onto every legacy session using Stage 1's rule, so a later rollover change can't move old workouts;
- `tiers` (level, frozen progress), sessions, PRs, phases and benchmarks stay untouched.

**Rules applied when reading, not marks written during migration:** no `rx` means unknown evidence, and a legacy `difficulty: "moderate"` means unknown effort. This covers sessions written later by a device still on Stage 1, which the migration never sees.

**Behaviour changes:**
- **Points stop.** `_progress` no longer runs; levels change only when a main-path step is accepted. `applyAdvancement` stops writing targets (Stage 3 replaces it).
- **The first workout after upgrading** shows one card: targets are now ranges, step-ups need evidence, nothing in your program changed, and old sessions don't count as evidence.
- **The row slot is offered, not added.** A card on the first pull day explains why, and applies only if ticked.

**Running the migration:** it runs through first load, BASALT import, combined Hub import and `reloadFromRemote()`. It must be idempotent: running it twice changes nothing.

**Sync:** `training.slots[slot]` takes the newest `acceptedAt`, `decisions` are a union keeping the newest `at`, and two prescriptions are never blended.

**Old drafts:** an `ironframe.ui` draft started before the upgrade resumes with its logged sets and saves without `rx`.

### C7 · Stage 2 steps

| Step | Work | Done when |
|---|---|---|
| 2.1 | `fitness/training.data.js`; the two new movements (DB, muscles, phases); the substitution map; `tools/check-training-data.js` — every id exists, every `next` resolves, every slot has a no-equipment option or an explicit `none`, every substitution id exists | Both checks pass; the app loads with zero errors (data not yet used) |
| 2.2 | `fitness/training.js` (`window.Training`): `comparable`, `exposures`, `recommend`, `startOf`. Pure — no DOM, no storage, no `App`. `tools/check-training.js` runs C2 and T1–T10 | All pass |
| 2.3 | v4 migration, read-time rules, sync of the new records, survival of old drafts | T11–T13 pass |
| 2.4 | `buildWorkout` builds from slots with equipment applied; finalize writes `rx`; flags and swaps use real ids; assessment onboarding; Era gate removed; points off; `applyAdvancement` stops writing targets | T14–T17 pass; Stage 1 cases pass, or are retired with a reason in the log |
| 2.5 | Workout, Program and Progress screens; `index.html` loads both new files before `basalt.js`; `PRECACHE` + `CACHE_VERSION`; README; standing checklist at 390 / 1440 / 1920 px, both themes, keyboard | Every T case passes in one run; checklist done |
| 2.6 | Review, as in 1.5 | Report delivered |

## Part D — Stage 3: schedule and reporting

**Stage 3 moves to v5 only if one of its records needs a migration; the defaults below avoid one where they can.**

### D1 · Templates — chosen, never imposed

| Template | Order | Slots per session | Rest rule |
|---|---|---|---|
| Full body, 2 or 3 per week | A / B alternating | A: push, row, squat, core · B: shoulder, pull (row with no bar), hinge, core | A rest day after each session (today's rule) |
| Upper / lower, 4 per week | U L U L | U: push, row, shoulder, pull (+ dip) · L: squat, hinge, core | U and L can be back to back; rest before repeating the same type |
| Current rotation | push / pull / legs / full body | As today, plus the row if accepted | As today |

New users choose. Existing users keep the current rotation until they choose, with a preview of what would change. Attendance is sessions attended ÷ the template's planned sessions for the period, so following it exactly reads 100%. Changing template closes the reporting period, so no planned-session ids or schedule revisions are stored.

### D2 · Goals

| Goal | Rep range | Sets | Rest for new profiles |
|---|---|---|---|
| Strength | 4–8 where a harder setup or load exists, else 6–12 | 3 | 150 s |
| Size | 8–15 | 3 | 120 s |
| Both (default) | 6–12 | 3 | 120 s |

Holds and skills don't change with goal. Bodyweight direction (gain, hold or lose) becomes its own optional setting and leaves the training grade (A15). "Short session" drops the last slot of the day; it never cuts rest.

### D3 · Recovery block, replacing the 28-day deload

A recovery block lasts 7 days:
- working sets × 0.6, rounded, minimum 1 (3 → 2);
- ranges and rest don't change, and nothing rises;
- sessions inside it don't count as evidence;
- it ends with a normal session.

It's offered after two "reduce" recommendations in a week, after a sharp flag, or when you ask. 28 days stays as the reporting period.

### D4 · Volume modes

"Max effort" (+2 sets, +3 reps, 25% less rest) and "Extended" (+1 set, +2 reps, 15% less rest) become one option: "+1 set on main slots", with rest unchanged. A saved `volumeMode: "max"` reads as that option, so no migration is needed. Consolidation stops shortening rest.

### D5 · Phase report

The report has three separate sections, each with its sample count:
- **adherence:** attended out of planned;
- **performance:** per slot, comparable sessions and steps taken;
- **recovery:** flags, failed sets and recovery blocks.

No blended grade, no bodyweight in the grade, and no global change to targets.

### D6 · Running (A13), reproduce first

- **Missed week:** when the previous plan week has unlogged runs, the Running view asks "Repeat week N / Move on". The answer is stored as one integer, `run.weekOffset`, which `weekIndexFor` subtracts.
- **Same day:** a hard run (tempo, intervals/vo2, test) on the same day as a squat or hinge session gets a note on both cards, with "Move run to tomorrow". Adjacent days aren't flagged.
- **If a claim doesn't reproduce,** this step shrinks to the claims that do.

### D7 · Muscles

`tools/check-muscle-map.js` (170–183) and `fitness/muscles.js` stop duplicating the 4-day rotation and read the active template's slots. Weekly targets are recomputed per template.

### D8 · Stage 3 steps

| Step | Work | Done when |
|---|---|---|
| 3.1 | D1, D2, D4: templates, rest rule by template, attendance, goals, volume modes | P1–P3, P5, P6 pass |
| 3.2 | D3, D5: recovery block and phase report | P4 passes; the report shows three sections with sample counts |
| 3.3 | D6, D7: running and muscles; README; `CACHE_VERSION`; standing checklist | P7–P9 pass |
| 3.4 | Review, as in 1.5 | Report delivered |

## Part E — verification

### Stage 1 — `tools/check-workout.py`, `tools/check-syncmerge.js`

"Before" is what was measured on 2026-09-30 and 2026-10-01; "(new)" marks a case not yet run.

| # | Case | Before | After |
|---|---|---|---|
| S1 | Workout finished 05:00 IST, rollover 0 | Streak: 1 Oct not done | 1 Oct done; `dayKey` 2026-10-01 |
| S2 | Finished 00:20, rollover 4 | BASALT 2 Oct, Hub 1 Oct | Both 1 Oct; the next day is the rest day |
| S3 | Logged while backfilling 29 Sep | Saved on 1 Oct | `dayKey` 2026-09-29 |
| S4 | Rollover 6; the rest-day key after a session | (new) | Plain calendar arithmetic, no shift |
| S5 | Begun 23:50, finished 00:20, rollover 0 | (new) | The day it began |
| S6 | Phone and desktop each log one session (Node) | Each keeps only its own | Both keep both; one PR per exercise and kind, at the higher value |
| S7 | v3 local merged with a v4 file (Node) | `version` 3 | `version` 4 |
| S8 | Truncated save, then finish onboarding | `sessions: []`, no copy | Banner and no onboarding; copy saved; key unchanged after any action |
| S9 | A save at version 4 | Used and rewritten by v3 code | Read-only banner; key unchanged after a logging attempt |
| S10 | One wall push-up set logged, the rest blank | Shoulder, dip, core +13 each | +0 each; push +17 |
| S11 | 8 sessions of 3 × 1 against 8, moderate | Level 2 | Level 1, progress 0 |
| S12 | Sharp wrist flag on push, plank logged | Push +13; inputs shown | Push +0, `skipped: true`, no inputs, no PR |
| S13 | Wizard: 35 / 5 / 45 s / 25 / 30 s | Archer, Negative, Weighted Pistol @ 12, Dragon Flag Negative @ 30, Kick-to-Handstand, Korean Dip | Push L2, pull L3, squat L3, core L3 (15 s hold), hinge L3, shoulder L2, dip L1; no rep target above 25 |
| S14 | Pull field 20 | L6 Archer Pull-up | L3 |
| S15 | Wall → Push-up after 3 × 8 | 10, "below target last session" | 12, no reason shown |
| S16 | 20 s L-sit history, then Dragon Flag Negative | 7 | 5 |
| S17 | Three perfect 20 s L-sit sessions | Rep ratio 0.667 | 1.0 |
| S18 | Deload of 15 s, 10 s, 5, 5, 25 s, 7 | 20 s, 20 s, 6, 6, 20 s, 6 | 15 s, 10 s, 5, 5, 20 s, 6 |
| S19 | 28 days at every other day | 16 expected, 87.5% | 14 expected, 100% |
| S20 | Nothing rated, one set logged | "moderate" ×4 | `null` ×4 |
| S21 | Two all-easy push sessions | 3 sets | 3 sets, `_adaptSets` gone |

### Stage 2 — `tools/check-training.js` plus browser cases

| # | Case | Required result |
|---|---|---|
| T1 | Incline push-up at table, 12/12/12 on two days, "just right" | Step to chair offered, with both dates |
| T2 | 12/9/6 | Repeat |
| T3 | 12/12/12 twice, effort blank | No offer (unknown) |
| T4 | 12/12/12 twice, one flagged | No offer |
| T5 | 12/12/12 twice on the same day | No offer |
| T6 | 12/12/12 at table, then 12/12/12 at chair | Not comparable; no offer |
| T7 | Tuck L-Sit 30/30/30 twice | L-Sit offered as an optional branch; no compulsory step |
| T8 | A backdated session saved after a newer one | Ordered by day, then id |
| T9 | The same session id from two devices | Counted once |
| T10 | Two declining comparable sessions | Previous setup offered |
| T11 | v3 save migrated twice | Identical result; sessions, PRs, levels, phases and benchmarks unchanged; every legacy session has `dayKey` |
| T12 | v3 draft in `ironframe.ui` across the upgrade | Resumes with its logged sets; saves without `rx` |
| T13 | A device on the Stage 1 build syncs with a v4 device | The Stage 1 device goes read-only; v4 data intact on both |
| T14 | No pull-up bar | Row slot from `pull_alt_tabledoor`; the pull card explains the bar; Dead Hang never prescribed |
| T15 | Moderate shoulder flag on push | Swaps to `push_1` at the bottom of its range; the history belongs to `push_1` |
| T16 | Upgrade with existing history | No step offered from legacy sessions |
| T17 | Preview vs active workout | The same prescription object |

### Stage 3

| # | Case | Required result |
|---|---|---|
| P1 | Full body ×3 followed exactly for 28 days | Attendance 100% |
| P2 | Upper/lower: U then L on consecutive days | No rest-day block |
| P3 | Template changed mid-period | A new period starts; the old one keeps its denominator |
| P4 | Recovery block | 3 sets → 2; ranges and rest unchanged; nothing counted as evidence; nothing raised |
| P5 | Strength vs size on the same slot | Different ranges |
| P6 | Saved `volumeMode: "max"` | Reads as "+1 set", rest unchanged |
| P7 | A missed run week | Asks Repeat / Move on; elapsed time alone advances nothing |
| P8 | Hard run and a leg session on the same day | A note on both cards |
| P9 | Muscle-map targets for each template | `check-muscle-map.js` passes for each |

**Every stage also runs the standing checklist from `skills.md`:**
- a backup before editing;
- zero errors on a fresh profile and on one seeded with the old schema;
- both themes;
- empty, single-session and 300-session profiles;
- no `alert` or `confirm`;
- every estimated number marked as estimated;
- backup/restore and CSV round trips;
- nothing personal in fixtures.

## Part F — chat windows, models and effort

### Rules for every window

1. **Set the model and effort first.** In the new window, before pasting anything, run `/model <name>`, then `/effort <level>`. `/model` saves itself as the default for new windows, so set both every time.
2. **Start in** `/home/talon/SyncedWork/Claude/Helth`.
3. **Read first:** this plan and `plans/PROGRESS-workout-progression.md`, before anything else.
4. **Do only your step,** and stop at its "Done when".
5. **Back up first:** a timestamped backup of every file over ~200 lines before editing it.
6. **Prove it:** quote the harness lines before and after. A claim that wasn't run is labelled unconfirmed.
7. **Don't commit or push.**
8. **Hand off:** append an entry to the progress log — date, window, files changed, harness lines, deviations from this plan, anything left over — then stop.

**Run the windows one at a time.** Each starts from the previous window's tree, and every window from W2 on edits `fitness/basalt.js`.

| Window | Step | Model | Effort | Starts after | Why this setting |
|---|---|---|---|---|---|
| W1 | 1.1 harness | Sonnet 5.5 | high | You approve Stage 1 | Fully specified; the numbers to hit are in Part E |
| W2 | 1.2 data safety | Opus 5.5 | high | W1 | Merge rules and the read-only guard decide whether data survives |
| W3 | 1.3 training day | Opus 5.5 | xhigh | W2 | 93 date call sites to classify, two traps, the app's first rule |
| W4 | 1.4 fixes and close-out | Sonnet 5.5 | high | W3 | Every change is named down to the line |
| R1 | 1.5 review | Opus 5.5 | high | W4 | Fresh eyes on the stage with the most at stake; verifies by running |
| — | **You:** read R1, commit Stage 1, approve Stage 2 | | | | |
| W5 | 2.1 catalogue and data | Sonnet 5.5 | high | Stage 2 approved | Data entry against fixed tables; two checks catch mistakes |
| W6 | 2.2 progression rules | Opus 5.5 | high | W5 | The core logic, with many edge cases |
| W7 | 2.3 schema v4 | Opus 5.5 | xhigh | W6 | A migration over months of real history, plus sync |
| W8 | 2.4 wiring | Opus 5.5 | high | W7 | Builder, finalize and onboarding in an 8,368-line file |
| W9 | 2.5 screens and close-out | Sonnet 5.5 | high | W8 | UI to a fixed spec |
| R2 | 2.6 review | Opus 5.5 | high | W9 | As R1 |
| — | **You:** read R2, commit Stage 2, approve Stage 3 | | | | |
| W10 | 3.1 templates, rest rule, attendance, goals, modes | Opus 5.5 | high | Stage 3 approved | Scheduling rules interact with dates and the rest gate |
| W11 | 3.2 recovery block and phase report | Sonnet 5.5 | high | W10 | Specified in D3 and D5 |
| W12 | 3.3 running, muscles, close-out | Sonnet 5.5 | high | W11 | Reproduce first; small model changes |
| R3 | 3.4 review | Opus 5.5 | high | W12 | As R1 |

`max` isn't assigned anywhere. If a review sends W3 or W7 back, rerun that window at `max`.

**What to paste.** Use the same text in every build window, changing only the window and the step:

```
You are window W3 of plans/PLAN-workout-progression.md. Read that plan and
plans/PROGRESS-workout-progression.md in full, then do step 1.3 and nothing
else, following Part F's rules. Append your progress entry when you're done,
then stop.
```

Review windows get this instead:

```
You are review window R1 of plans/PLAN-workout-progression.md. Read the plan,
the progress log and the Stage 1 diff (git diff -- fitness js tools
service-worker.js README.md). Re-run tools/check-workout.py and
tools/check-syncmerge.js, drive the changed screens yourself, and report
findings ranked with the house severity labels, each verified by running.
Change no code.
```

## Evidence and assumptions

- **ACSM 2026 resistance-training guidelines** — [acsm.org/resistance-training-guidelines-update-2026](https://acsm.org/resistance-training-guidelines-update-2026/), 17 March 2026, verified 2026-10-01. Training to failure "did not consistently impact outcomes for the average healthy adult", and bodyweight and home routines "yield marked benefits". This supports simple, consistent progression with no routine failure training.
- **IUSCA hypertrophy position stand** (Schoenfeld et al., 2021) — [journal.iusca.org/…/article/view/81](https://journal.iusca.org/index.php/Journal/article/view/81). The earlier draft's download link returns 404. Its rest guidance wasn't checked against the full text, and it addresses an athletic population, so no rest default here leans on it.

| Solid: measured or in the code | Assumed: product choices you can change |
|---|---|
| Every number in Part A and the "Before" column | The ranges in C1 |
| Which movements need which equipment (`equipment` in the DB) | Two comparable sessions on different days before a step |
| How `Hub.today()` and `Hub.viewDate()` handle rollover and backfill | Load steps: 2.5 kg per dumbbell, 4 kg per kettlebell |
| | The placement caps in 1.4 |
| | Recovery block: 7 days, sets × 0.6 |
| | Rest by goal in D2 |

The app can't judge technique, diagnose an injury or measure recovery; effort and form are self-reports. Each card says so next to the number it qualifies.

## Out of scope

- **BASALT's logs without ids** (bodyweight, measurements, sleep, nutrition) still merge wholesale after Stage 1. Each needs its own rule: nutrition, for example, holds one record per day with the meals inside. They're listed here so they aren't forgotten.
- **Tombstones.** A session deleted on one device comes back from any device that still has it, until it is deleted on every device.
- **Rewriting old history:** recomputing old report cards, or inventing prescriptions or effort for legacy sessions.
- **New movements beyond `push_incline` and `squat_split`.** That includes anti-rotation core work: no side plank exists, and adding one is a catalogue project of its own.
- **A knee-flexion regression below Nordic negatives.** The Nordic branch becomes optional instead.
- **Medical work:** diagnosis, rehab plans, camera form checks or recovery predictions.
- **A nutrition overhaul.** Only bodyweight direction leaves the training grade.
- **A visual redesign,** a framework or build step, or replacing the timer system.
- **Release work:** the Android updater, signing and releases. Commits and pushes also stay out, unless you ask.
