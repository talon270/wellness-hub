# Fitness control and coverage — progress log

The hand-off between chat windows for `PLAN-fitness-control-and-coverage.md`. One entry per window, newest last.

Each entry covers:
- the date, window and step;
- the files changed, with their backups;
- the harness lines before → after;
- any deviation from the plan, and why;
- anything left for the next window.

Re-read the log before appending. Never edit another window's entry.

## 2026-10-03 · W1 · step 1.1 harness and v4 fixture

**Where.** `~/helth`, branch `fitness-plan` at `c7015a2`. Part H's setup was already done on this machine except the browser: `python3 -m playwright install chromium` ran in this window (Chrome Headless Shell 153.0.8010.12, `~/.cache/ms-playwright`) and `check-workout.py` launches. No app file was edited, so `git diff -- fitness js index.html service-worker.js` is empty. Nothing committed.

**Files.**
- `tools/check-training.js` (+68 / −3): cases H1a, H2a, H2b, H2c, H5, H9, and a `kg` option on `sess()`. Backup: `tools/check-training.backup-20261003-054201.js`.
- `tools/check-workout.py` (+67): cases H1b and H6, and the header lines that list them. Backup: `tools/check-workout.backup-20261003-054201.py`.
- `tools/fixtures/v4-midworkout.json` (new, 19.5 KB): see below.
- `plans/PROGRESS-fitness-control-and-coverage.md` (this file, new). `plans/PLAN-fitness-control-and-coverage.md` was already in place from Part H's setup, untracked, and I didn't touch it.

**The "before" record: every new case FAILs with Part F's numbers, 0 errors.**

| Case | Where | Measured on this tree | Part F's "Before" |
|---|---|---|---|
| H1a | Node | `ready/ready`, load step to **12.5 kg**, 2 comparable of 2 logged at 5 kg against a 10 kg rx | `ready`, step to 12.5 kg ✓ |
| H1b | Playwright | logged 5 kg on every set by clicks; saved rx load **10 kg** (prescribed 10) | saved `rx` load 10 ✓ |
| H2a | Node | `reduce/declining` → Incline Push-up (step), totals 45 → 42 → 39 | `reduce` → Incline ✓ |
| H2b | Node | `reduce/declining` → Incline Push-up (step), totals 36 → 35 → 34 | `reduce` ✓ |
| H2c | Node | `reduce/declining` → Incline Push-up, totals 36 → 29 → 22 | `reduce` ✓ — **the control: PASSes before and after, on purpose** |
| H9 | Node | `ready/ready`, `double` undefined, lands Incline Push-up at **counter** | one step (counter) ✓ |
| H5 | Node | `owns({dumbbells}, "dip_6")` → **true** (dumbbells + bar → true) | true ✓ |
| H6 | Playwright | Goblet Squat's badge reads **"NEEDS KETTLEBELLS"** (dumbbells owned, no kettlebells) | "needs kettlebells" ✓ |

**Old cases still pass.**

| Check | Result |
|---|---|
| `check-workout.py`, before any edit | 44 pass, 0 fail, 0 error |
| `check-workout.py`, after (final run, exit 1) | 44 pass, **2 fail (H1b, H6)**, 0 error |
| `check-training.js` | 28 old cases PASS, plus H2c PASS; H1a, H2a, H2b, H5, H9 FAIL (exit 1) |
| `check-training-data.js` | OK |
| `check-muscle-map.js` | OK |
| `check-syncmerge.js` | 6 pass |

**Each new case can pass.** A case that can't pass is also a harness defect, so I built a scratch copy of the tree (in the session scratchpad, not in the repo) with a crude version of each fix, and ran the new cases against it:
- Node (`check-training.js` run from the scratch tree): H1a, H2a, H2b, H2c, H5 and H9 all PASS, and every old case still passes.
- Playwright (`--only H1b,H6` from the scratch tree): H1b PASS (saved load 5 kg) and H6 PASS (badge reads "READY").

The scratch fixes were throwaway and **are not W2's answer**. What they did, so W2 can see the shape the cases accept:
- `exposures` gained `weights`, and `comparable` rejected a loaded exposure whose working sets weren't all at its `rx` load.
- The step-back rule needed totals falling twice, the latest not at the top on every set, and either a total ≥ 10% below the best of the three or a set below the range's bottom.
- `recommend` set `double: true` and `steps: [first, second]` when both sessions were ≥ 1.5× the top, leaving `step` as the first.
- `dip_6`'s equipment became `["pullupBar", ["dumbbells", "kettlebells"]]`.
- `rxAsLogged` saved a uniform logged weight even when the load was known.
- The preview swap's `missingFor` used `Training.owns`.

**The v4 fixture.** `tools/fixtures/v4-midworkout.json` has the same two keys as the v3 one (`ironframe.state.v1`, `ironframe.ui`) plus a `_note`. It was written by this build (no fix applied), by real clicks with the clock set to Asia/Kolkata dates; `evaluate` was used only to read `localStorage`.
- Onboarded 27 Sep on the rotation, with a pull-up bar, dumbbells, bench and kettlebells.
- Assessment answers: Push-up, Dead Hang, Pause Squat, Hip Thrust, Hollow Body Hold, Pike Push-up, **Parallel Bar Dip**. The row isn't answered, so it starts at its first movement.
- A finished push workout on 27 Sep and a finished pull workout on 29 Sep, every set rated Just right, so both carry an `rx`.
- The next workout (Legs: Pause Squat, Hip Thrust, Hollow Body Hold) begun 07:30 IST on 1 Oct with 7 / 8 / 9 logged on its first movement, not finished.

I chose the Parallel Bar Dip answer so that K9's "`dipBars` inferred from a logged Parallel Bar Dip" can be tested from the fixture alone. Checked: seeded into the app it boots at version 4, resumes the draft (7, 8, 9), leaves all eight slots unchanged and logs 0 page errors. That was a one-off check, not a harness case: K9 belongs to Stage 2.

**Deviations from the plan.**
1. **`sess()` in `check-training.js` now logs the prescribed load by default** (`weight: o.kg ?? o.loadKg ?? 0`). It used to log weight 0 for every set. That changes nothing today, but F1's fix makes `comparable` read the weights, and the scratch run showed `C2-load` then failing because its fixtures "lifted" 0 kg against a 10 kg rx, which the app can't produce (it pre-fills the weight). Without this edit W2 would have had to touch a case that isn't theirs.
2. **H9 reads the landing from `r.steps` when it exists, else `r.step`.** Part B says `recommend` returns `double: true` and two steps without naming the field, so the case accepts either and says which it found.
3. **H1a and the Playwright H1b check the saved/offered numbers only.** The card text "logged at 5 kg, not 10 kg" and the *Set slot to 5 kg* choice are screen copy W2 writes; I didn't pin their wording.
4. **The old Node suite is 28 cases, not 29.** R3's entry says 29; counting `PASS` lines in the backup copy gives 28. Nothing was removed.

**Left for W2 and R1.**
- **H2c is a control**: it passes today and must still pass after F2's fix. Don't read it as a harness defect.
- **The cases pin behaviour, not field names**, apart from the `double` flag Part B names. If W2 shapes the two steps differently from `steps` / `step`, adjust H9's one-line reader in the same diff and say so here.
- **Not run:** the Android and desktop shells, and themes by eye (no UI changed).
- **Before committing for the handoff:** `tools/__pycache__/` and the two `*.backup-20261003-054201.*` files are untracked. Part H's `git add -A -- . ':!*.backup-*' ':!*__pycache__*'` leaves them out. The plan file in `plans/` is also still untracked and will be included.

## 2026-10-03 · W2 · step 1.2 rule and data fixes

**Where.** `~/helth`, branch `fitness-plan`, on W1's uncommitted tree. Nothing committed.

**Files.** Backups are `*.backup-20261003-055617.*` beside each file.
- `fitness/training.js`:
  - **F1:** `exposures` carries `weights`. `comparable` rejects a loaded exposure unless every performed set (value > 0) was at its `rx` load. A new `why: "off-load"` (with `loggedKg`) reports that the latest session was lifted at one weight that isn't the `rx` load.
  - **F2:** the new step-back rule.
  - **F9:** `double` / `steps`.
- `fitness/training.data.js`: `REDUCE_MIN_DROP = 0.10` and `DOUBLE_STEP_AT = 1.5`. `dip_6` now needs `["pullupBar", ["dumbbells", "kettlebells"]]`.
- `fitness/basalt.js`:
  - `EXERCISE_DB` `dip_6` now matches the catalogue.
  - `rxAsLogged` saves a uniform logged weight even when the load is known, and mixed weights as `null`.
  - `decide` gains `"load"` and `"step2"`.
  - The card has the off-load line with *Set slot to X kg* / *Keep Y kg*, and the double-step line with *Step up two* / *One step* / *Repeat*.
  - The Program status lines; the report counts a double step as 2.
  - F6: a new `gearMissing` (`Training.owns`, then `missingGear`) is used by all three badges.
  - F10: the comment is corrected. The state-shape comment documents the new decision fields.
- `service-worker.js`: `CACHE_VERSION` v50 → v51.
- `tools/check-workout.py`: T23 only (see deviation 1).

**Harness lines, before → after.**

| Check | Before (W1's record) | After |
|---|---|---|
| `check-training.js` | 29 PASS, 5 FAIL (H1a, H2a, H2b, H5, H9) | **all passed**, 34 PASS |
| H1a | `ready/ready`, load to 12.5 kg | `repeat/off-load`, no step, 0 comparable |
| H2a | `reduce` → Incline | `repeat/effort` |
| H2b | `reduce` → Incline | `repeat/below-top` |
| H2c (control) | `reduce` → Incline | `reduce` → Incline |
| H9 | one step, counter | `ready`, `double true`, lands Incline at **table** |
| H5 | dumbbells only → true | dumbbells only → **false**; + bar → true |
| `check-workout.py` | 44 pass, 2 fail (H1b, H6), 0 error | **46 pass, 0 fail, 0 error** (exit 0) |
| H1b | saved rx load 10 | saved rx load **5** |
| H6 | "NEEDS KETTLEBELLS" | "READY" |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK | OK / OK |
| `check-syncmerge.js` | 6 pass | 6 pass |

**The new screens, driven by clicks** (scratch `w2_screens.py`, not a harness case; 0 page errors in both runs):
- **Off-load:** a 10 kg Dumbbell Overhead Press slot logged at 5 kg.
  - The card reads "Logged at 5 kg, not 10 kg, on 1 Oct — set this slot to 5 kg?" with *Set slot to 5 kg* and *Keep 10 kg*.
  - Program reads "logged at 5 kg, not 10 kg — see Workout".
  - The click sets the slot to 5 kg (`why: "set to the weight you logged"`) and stores `{ choice: "load", kg: 5, at }`.
- **Double:** Wall Push-up logged at 18 / 18 / 18 twice.
  - The card reads "…far past the top both times — step up two, to Incline Push-up, table height (~75 cm)?" with three buttons.
  - *Step up two* lands Incline at table height and stores `{ choice: "step", steps: 2, at }`.

**Deviations, and choices the plan left open.**
1. **T23 (an old case) now gives its user a pull-up bar.** It did Weighted Dip from the v3 fixture, which has dumbbells and no bar: exactly the F5 bug. After the fix the dip slot falls back to an owned unloaded dip, so there's no weight box, and the case ERRORed. Its own checks are unchanged and pass.
2. **Off-load is a new reason, `"off-load"`.** It comes right after `no-load` and before everything else, so the card asks about the load instead of showing ready or step-back evidence from older sessions at the slot's load. Its `key` and `evidence` are the off-load session, so *Keep 10 kg* is a normal `repeat` decision and the next session asks again. Mixed weights aren't off-load: that session simply isn't evidence.
3. **Sessions saved before this build with an off-load weight stay non-comparable, even after *Set slot to 5 kg*.** Their saved rx says 10 kg. Only sessions from this build on (which save 5 kg) count. Today no slot can hold a loaded exercise (F3), so no real history is affected.
4. **Shape of the double step:** `step` stays the first step, `steps` is `[first, second]` and `double: true`. Otherwise `double: false`, `steps: null`. H9's reader is untouched.
5. **Step-back with no top** (a skill without a standard): only the 10% fall decides, because there's no top to be at and no bottom.
6. ***Set slot to X kg* is allowed during a recovery block.** It records what you lifted; it isn't a step the app offers.
7. **The swap badges' wording** now comes from `missingGear` ("needs dumbbells or kettlebells", "needs a pull-up bar and …") instead of a comma list of every token. The preview's "needs gear" badge is unchanged.

**Left for R1.**
- **Not run:** the Android and desktop shells. The two new button rows weren't checked by eye in both themes or at 390 px. They reuse the existing `btn--sm` row with `flex-wrap`.
- **Noticed, not touched:** two guide lines (`basalt.js` "Equipment:" in the exercise modal, and the skills list's `equip`) print raw tokens joined by commas. Weighted Dip now shows "pullupBar, dumbbells, kettlebells" there, as Goblet Squat already did. That's display only; Stage 4's directory replaces it.
- **Before committing for the handoff:** the five new `*.backup-20261003-055617.*` files (three in `fitness/`, `service-worker.backup-…js`, and `tools/check-workout.backup-…py`; plus W1's two) are untracked, and Part H's `git add` excludes them.

## 2026-10-03 · R1 · step 1.3 review

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon). W1 and W2 ran on fatty and their tree came over as a plain copy in `up/`, not a bundle. Before merging I checked that this checkout had no edits to tracked files and sat on `c7015a2`. I also checked that `up/` differed from it only in W1/W2's six files plus the plan, this log and the v4 fixture, and that every `*.backup-*` in `up/` was byte-identical to `c7015a2` or to W1's harness. Then I created branch `fitness-plan` off `android` at `c7015a2`, copied those nine files in, and deleted `up/` (including the seed plan copy at its root, which was identical to `plans/`'s). Fatty's backups weren't kept: git has every one of them. Nothing committed. No code changed by this window.

**Harnesses, re-run on the merged tree.**

| Check | Result |
|---|---|
| `check-training.js` | all passed, 34 PASS (H1a, H2a, H2b, H2c, H5, H9 as W2 recorded) |
| `check-workout.py` | 46 pass, 0 fail, 0 error (H1b saved load 5 kg; H6 "READY"; T23 PASS) |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK |
| `check-syncmerge.js` | 6 pass, 0 fail |
| `check-androidupdate.js` | 17 passed, 0 failed |

**Findings.**

### R1-1 · BUG (medium; high once Stage 2 makes loaded slots common): after a load step, the card says you logged the old weight and "chose to keep" the new one
`offLoad` (`fitness/training.js`, new in W2) takes the latest session of the exercise whose setup matches **with `loadKg` stripped**, and fires when that session's weight differs from the slot's load. After *Step up* from 10 kg to 12.5 kg, the latest such session is the 10 kg one that earned the step, so the slot reads off-load straight away. The decision key is the same one the step was stored under, so the card finds a decision and phrases it as a *Keep*.
- **Node** (scratch `probe.js`, Weighted Dip, 10 kg, 3 × 12 twice, step, then `recommend` on the 12.5 kg rx): HEAD `repeat/no-history`; this tree `repeat/off-load`, `loggedKg` 10.
- **By clicks** (scratch `r1_loadstep.py`, v3 fixture, dip level 6 + bar, 10 kg at the top on 1 and 3 Oct, *Step up* on 5 Oct, card read on 7 Oct):
  - HEAD: no card line; Program status "0 of 2 at 3 × 12".
  - This tree: "Logged at 10 kg, not 12.5 kg, on 3 Oct — you chose to keep 12.5 kg. Your next session asks again." Program status "logged at 10 kg — you chose to keep 12.5 kg". 0 page errors.
- **Effect:** a statement about a choice you never made, until the first session at 12.5 kg. No data is written. A load *Step back* and the first step of a loaded double hit the same path. Today a loaded slot exists only after a v4 migration from tier 5–6 (F3), so this is rare now; Stage 2 makes it routine.
- **Smallest fix (not applied):** `offLoad` ignores exposures from sessions dated before the slot rx's `acceptedAt` (they belong to an earlier prescription), and still treats a null `acceptedAt` as no limit. That's one filter in one function, and every caller (card, Program status, `decide("load")`) routes through `recommend`. Add a Node case: load step, then `recommend` → `no-history`. It FAILs on this tree with `off-load`.

**Checked, nothing found.**
- **Off-load and double-step rows at 390 px in Selene and Selene Day** (scratch `r1_screens2.py`, real clicks): both rows wrap inside the card, 0 horizontal overflow, 0 buttons outside the viewport, primary/ghost contrast reads in both themes, 0 page errors. The text: "…far past the top both times — step up two, to Incline Push-up, table height (~75 cm)?" and "Logged at 5 kg, not 10 kg, on 3 Oct — set this slot to 5 kg?"
- **The preview's "needs gear" badge:** `gearMissing(ex.id, …)` gets an exercise id (`exerciseFromRx` sets `id: r.exerciseId`).
- **Sync:** `decisions` merge as whole records by `at` (`js/syncmerge.js:354`), so `kg` and `steps: 2` travel.
- **F2's rule** against H2a/H2b/H2c and the no-top branch; `decide` refusing `step2` in a recovery block while allowing `load` (W2 deviation 6, a reasonable call).
- **T23's change** (W2 deviation 1) is correct: the v3 fixture has no bar, and Weighted Dip now needs one.

**Not run:** the Android and desktop shells. Themes other than Selene / Selene Day.

**Decided (you, 2026-10-03):** R1-1 is folded into W4 (step 2.2), and the plan's 2.2 bullet now says so. Stage 1 is committed with R1-1 still open. Scratch scripts are in this session's scratchpad, not in the repo.

## 2026-10-03 · W3 · step 2.1 catalogue data

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan`, on R1's uncommitted tree. Nothing committed. Run on Sonnet 5.5.

**Files.** Backups are `*.backup-20261003-125741.*` beside each file.
- `fitness/training.data.js`:
  - `GRIPS`, `SUBSTITUTION_SETUPS`, `JOINT_STRESS` (86 rows) and `JOINTS`, all exported on `window.TRAINING_DATA`.
  - Catalogue `equipment` moved onto the four new tokens as plan C5 lists them.
  - The header documents the nine tokens.
- `fitness/basalt.js`: `EXERCISE_DB` `equipment` changed to match, and four labels added to `EQUIP_LABEL`. Nothing else.
- `tools/check-training-data.js`: sections 8 (equipment tokens), 9 (grips) and 10 (joint stress), and the token set widened to nine.
- `tools/check-training.js`, `tools/check-workout.py`: two old cases updated (deviation 1).
- `service-worker.js`: `CACHE_VERSION` v51 → v52.

**Harness lines, before → after.**

| Check | Before (this tree, run first) | After |
|---|---|---|
| `check-training-data.js` | OK, 7 sections | OK, **10 sections**; new ones 16 exercises on C5's tokens and 9 tokens used and labelled; 6 push-ups take a grip and 2 pain swaps name one; 86 exercises scored on 8 joints (239 scores, 130 of them 2) |
| `check-training.js` | all passed, 34 PASS | all passed, 34 PASS (after deviation 1; **2 FAIL without it**, below) |
| `check-workout.py` | 46 pass, 0 fail, 0 error | 46 pass, 0 fail, 0 error (after deviation 1; **1 error without it**) |
| `check-muscle-map.js` / `check-syncmerge.js` / `check-androidupdate.js` | OK / 6 pass / 17 pass | OK / 6 pass / 17 pass |

**The new sections can fail.** I planted four errors in `training.data.js` one at a time, each restored afterwards: a deleted joint-stress row, Diamond Push-up listed as grip-capable, `"Fist Push-up"` mapped to grip `"fist"`, and a joint score of 3. Each made `check-training-data.js` exit 1; the restored file exits 0.

**What the token change does to the app until W5/W7 (expected, not a regression to fix here).** `owns()` reads `equipment[token]`, and no save has the four new keys yet, so they read false:
- Band-Assisted Pull-up, Straight Bar Dip, Parallel Bar Dip, Korean Dip, Weighted Dip and Australian Row are all "not owned" for every existing user, including one with only a pull-up bar. That is F5's fix taking effect early.
- Measured: the v4 fixture's dip slot (`dip_3`, Parallel Bar Dip) reads `owned: false`; the other seven slots read true. Its slot record is unchanged. W5's `toV5` infers `dipBars` from the logged Parallel Bar Dip (K9), and the Equipment check card covers the rest.
- The Settings and onboarding equipment lists don't offer the new tokens yet (step 2.5), so until then a user can't switch them on by hand.
- Do not commit-and-ship between W3 and W7 without that in mind. Hand-offs between windows are fine.

**Deviations, and choices the plan left open.**
1. **Two old cases encoded the old tokens, so I updated them.**
   - `check-training.js`: `ALL` and `NO_BAR` gain the four tokens (true / false). H5's second leg now tests dip bars: dumbbells only → false, + pull-up bar → **false**, + dip bars → true. Without this, H5 and `C2-predecessor` FAIL.
   - `check-workout.py` T23: the user gets `dipBars` instead of a pull-up bar. Without this, T23 ERRORs on the missing weight box. The assertions themselves are unchanged.
2. **Seven hold moves, not two, take "bench or parallettes".** Plan C5 names Tuck L-Sit and L-Sit; I applied it to `core_3`, `core_4` and the four `skill_lsit_*` / `skill_vsit` entries too (Foot-Supported, Tuck, Full L-Sit, V-Sit) because they are the same hand position. `core_5` and `core_6` (Dragon Flag) stay bench-only.
3. **Front Lever 1–4 are `[["pullupBar","rings"]]`, so they still need a bar or rings.** That is C5 as written.
4. **`EQUIP_LABEL` edit is outside "data", but "needs lowBar" would print otherwise.** Labels: "resistance bands", "parallettes", "dip bars", "waist-height bar". `missingGear` reads them.
5. **The grip's wrist relief lives on the grip** (`GRIPS.values[1].relief = { wrist: 1 }`), not in a separate constant. W4 applies it when it computes stress. The check requires every grip-capable push-up to have a wrist score, so the relief always has something to subtract from.
6. **Grips exclude nothing by equipment**: Decline Push-up (bench) is capable, so the check allows `bench` and nothing else.

**Joint-stress rubric, and the borderline calls.** The rubric is in the code comment: 2 is heavy or end-range load (most of bodyweight, a loaded position near the end of range, or a long hold); 1 is moderate; zeros are omitted. **Scored at the setup the exercise starts at**, so a joint limit never hides the gentle end of a ladder; harder setups further along (a lower incline, a lighter band) aren't re-scored. That is a limit worth knowing: Incline Push-up reads wrist 1 though its step height is close to a push-up.

Calls I'd want a second opinion on (all judgment, none measured):

| Exercise | Score | Why it's borderline |
|---|---|---|
| Push-up and every floor press | wrist 2 | Counts full wrist extension under ~65% of bodyweight as heavy. The 130 twos split shoulder 43, wrist 32, elbow 26, knee 13, hip 8, lower back 5, ankle 3. More than half of all scores are 2, so "avoid shoulder" removes a lot, by design |
| Decline Push-up, Wide Push-up | shoulder 2 | Raised feet and end-range horizontal abduction |
| Negative Push-up | elbow 2 | A 3–5 s lowering is the tendon load |
| Pull-up, Negative Pull-up | shoulder 2, elbow 2 | Full bodyweight overhead; Chin-up is elbow 2, shoulder 1 |
| Bent-Over Dumbbell Row | lower back 2 | Unsupported loaded hinge; the bench-supported Dumbbell Row is 1 |
| Pause Squat | knee 2 | Holding the bottom |
| Goblet Squat | knee 2 | Loaded squat to depth; Bodyweight Squat is knee 1 |
| Bench Dip, Chair Bench Dip | shoulder 2, wrist 1 | The extension-behind-the-body position |
| Dragon Flag and its negative | neck 1 | The shoulders and upper back carry it, but the neck takes some |
| Handstand and HSPU work | wrist 2, shoulder 2 | Hardest standard in `SKILL_STANDARD_SEC` |

**Not touched.** `Fist Pike Push-up` (a shoulder-pattern pain swap, `basalt.js:2013`) also names a fist grip, but plan C1 covers the push family only, so it still keeps the original exercise. Nothing outside the files above changed.

**Left for W4.**
- `training.js` still reads none of the new data. `owns` handles the new tokens already (it is generic), but nothing uses `GRIPS`, `JOINT_STRESS` or `SUBSTITUTION_SETUPS` yet.
- R1-1 (the `offLoad` / `acceptedAt` fix) is W4's, as the plan says.
- Not run: the Android and desktop shells, and the screens by eye (no UI changed).
- Untracked `*.backup-20261003-125741.*` files (training.data, basalt, check-training-data, check-training, check-workout, service-worker) are excluded by Part H's `git add`.

## 2026-10-03 · W4 · step 2.2 pure rules

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan`, on W3's uncommitted tree. Nothing committed. Run on Opus 5.5.

**Files.** Backups are `*.backup-20261003-132424.*` beside each file.
- `fitness/training.js` (+217 / −59):
  - **Grip evidence (C1).** A new `sameWork` compares setups with the grip left out, then requires the session's grip to be at least as hard as the rx's (the `GRIPS.values` order; absent is palms; an unknown grip matches nothing). `comparable` and `offLoad` both use it.
  - **Grip on new rx.** `startOf` takes `o.grip` or `o.setup.grip`, and keeps it only on a `GRIPS.exercises` id when it isn't palms.
  - **Grip carry.** Every step carries the grip: your standing grip (`o.grip`, either `training.grip` keyed by slot or a grip id), else the rx's own.
  - **`allowed` / `blocked` / `stress` (C3).** `stress(id, grip)` subtracts the grip's `relief`. `blocked` returns `"equipment"`, `"excluded"`, the first avoided joint at stress 2, or null. An exclusion record in state `"allowed"` is *Allow anyway*: it lets the exercise past a limitation.
  - **Routing (C3).** `stepUp` walks `next` breadth-first, nearest first, past any blocked rung. `stepDown` walks predecessors the same way, and a predecessor now includes **offer parents** (C2). Ties go to the most recently trained, then to a `next` parent over an offer parent.
  - **Offer adoption (C2).** `recommend` returns `optionSteps: [{ kind: "option", rx }]` for the allowed, non-skill offers. `options` (ids) is unchanged in shape, but is now filtered by `allowed`, not `owns`.
  - **Hold (C4).** `rx.hold` turns what would be `ready` into `repeat` / `why: "hold"`, with the evidence and no step, options or double. Step back is unaffected.
  - **Custom sets/range (C4).** `startOf(id, { custom })` applies the in-bounds parts and stores `rx.custom = { sets?, range?, unit }`. A step carries it, the range only into the same unit. `customError(custom, unit)` returns the inline message for W6's `setCustom` (sets 1–6; lo ≥ 1, hi ≥ lo + 2, hi ≤ 50 reps / 300 s; named constants `CUSTOM_SETS`, `CUSTOM_MAX`).
  - **Owned weights (C5).** `o.loads` (`equipmentLoads`) is read by `loadSpec` / `loadAfter`. Fixed weights step to the next listed one; adjustable weights step by `stepKg` up to `maxKg`. With no `o.loads` you get today's +2.5 / +4 kg. A new `heaviest: true` flag on a ready loaded rx means you have no heavier weight. At your heaviest, a step goes on to the next movement.
  - **R1-1.** `exposures` carries `at` (the session's `dateISO`, its finish time). `offLoad` ignores exposures finished before the rx's `acceptedAt`, and a null `acceptedAt` has no limit.
  - **Exports added:** `allowed`, `blocked`, `stress`, `customError`. `stepUp` / `stepDown` now take `(rx, o)` / `(rx, sessions, o)`. They're internal; `basalt.js` never called them.
- `tools/check-training.js` (+134): `sess()` takes a whole `rx`. New cases K1–K8, R1-1 and K-hold.
- `service-worker.js`: `CACHE_VERSION` v52 → v53.

**Harness lines, before → after.**

| Case | Before (this tree, cases written first) | After |
|---|---|---|
| K1 | palms rx from 2 knuckle sessions `repeat/no-history`; knuckles rx from palms `repeat/no-history` | `ready/ready`; `repeat/no-history`, 0 comparable |
| K2 | Push-up → push_3 palms → push_4 **palms**; down Decline → push_3, Diamond → push_2 **palms** | → push_3 palms → push_4 **knuckles**; down → push_3 palms, → push_2 **knuckles** |
| K3 | Diamond excluded: step → push_3 | step → **push_4** |
| K4 | knees avoid: up → squat_2; back from Bulgarian → squat_split; Pause Squat allowed → squat_2 | up → **no step**; back → **squat_1**; allowed → squat_2 |
| K5 | optionSteps `[]`; Archer declining `repeat/below-top`, no step | `[option:push_5]` (Pseudo Planche not, a skill); `reduce` → **push_4** |
| K6 | held, ready: `ready` → push_3 | `repeat/hold`, no step; held, declining: `reduce` → push_incline |
| K7 | rx 3 × 6–12; 4 at 10 `below-top`; 3-set sessions 2 comparable; `customError` absent | rx **4 × 8–10**; `ready` → 4 × 8–10; one at 9 `below-top`; 3-set 0 comparable; Dead Hang 4 × 20–40 s → **4 × 6–12 reps**; 3 bad customs rejected, 1 good accepted |
| K8 | fixed 7.5 → 10, 12.5 → 15; adjustable 18 → 20.5, 20 → 22.5 | fixed 7.5 → **12.5**, 12.5 → none (`heaviest` true), back 12.5 → **7.5**; adjustable 18 → **20**, 20 → none (`heaviest` true) |
| R1-1 | after the step `repeat/off-load` | `repeat/no-history`; a 10 kg session after the step still `off-load`, 10 kg |
| K-hold | PASS: 3 × 20–40 s at 16 kg, 40 s twice → load 20 kg | PASS, the same. **A control**: it confirms a loaded hold already works, as 2.2 asked, so it isn't a harness defect |

| Check | Before | After |
|---|---|---|
| `check-training.js` | 34 old PASS + K-hold; **9 FAIL** (K1–K8, R1-1) | **all passed, 44 PASS** |
| `check-workout.py` | 46 pass (W3) | **46 pass, 0 fail, 0 error**, exit 0, final tree |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK | OK / OK |
| `check-syncmerge.js` / `check-androidupdate.js` | 6 pass / 17 passed | 6 pass / 17 passed |

**Before/after sweep** (scratch `sweep.js`, not a harness case). Every catalogue exercise, at its start rx (loaded at 10 kg), against six equipment sets, run through the old and the new `recommend` with no exclusions, limits, grip or loads. Each got ready evidence and a 36 → 31 → ~lo−1 decline. **1032 comparisons, 104 differ.**
- **103 are step-backs, all intended.** Most are offer parents: Archer → Decline, Shrimp/Assisted Pistol → Bulgarian, Nordic → Single-Leg Hip Thrust, L-Sit → Tuck L-Sit, Wall Handstand → Elevated Pike, Korean Dip → Parallel Bar Dip, and skill entries → the exercise that offers them. The rest walk back past rungs you don't own: no bench, Single-Leg Hip Thrust → Glute Bridge.
- **One loaded step-back falls through to the movement** when no lighter weight is owned: Weighted Dip at 10 kg with no weights listed → the dip path.
- **1 is a step up** (below, deviation 1).
- **The tie that the first sweep exposed is fixed:** Archer Pull-up stepped back to Pull-up instead of Chin-up, a tie settled by `Object.keys` order. A `next` parent now wins ties. After the fix, pull_6 matches the old result in all 3 cases where it differed.

**Deviations, and choices the plan left open.**
1. **Routing walks past equipment you lack too, as C3 defines `allowed` (owned + not excluded + not avoided).** In today's data that changes exactly one step up: Korean Dip with dip bars, weights and no rings now steps to **Weighted Dip** (load unknown), past Ring Dip, which stays in `unowned`. That skips a rung of difficulty. R2 should say whether equipment should stop routing instead of being walked past; the change would be one line in `stepUp`.
2. **A loaded step-back with no lighter weight goes to the predecessor movement.** Before, it was null. This mirrors the plan's "at your heaviest it goes to the next movement".
3. **"Careful" isn't in the pure rules.** `blocked` handles only `avoid`. Warning, ranking lower and suggesting knuckles are W6's, from `stress()` and `training.limitations`.
4. **Hold replaces only `ready`.** Below-top, effort and the other reasons show as usual. The "holding — step-ups paused" copy reads `rx.hold` (W6/W7).
5. **`rx.custom` stores `unit`**, so a carried range can be dropped when the unit changes. `startOf` ignores out-of-bounds parts rather than throwing; the engine shows `customError`'s message first.
6. **R1-1 compares `dateISO` (finish time), not `dayKey`.** A session backdated to before the step but finished after it was done under the new rx, so it still counts.
7. **The K cases build session rx by hand** (`sess(..., { rx })`), so they don't depend on the `startOf` under test.

**Left for W5/W6.**
- **`basalt.js` passes none of the new inputs yet:** `exclusions`, `limitations`, `grip`, `loads`, `hold`, `custom`. Until W6 wires `recommendFor`, the app behaves as before except offer-parent step-backs, routing past unowned rungs (the sweep) and R1-1. Playwright 46/46 on this tree.
- **Not run:** the Android and desktop shells, and the screens by eye (no UI changed).
- **A test-runner subagent's second Playwright run stopped mid-suite** with an EPIPE: a pipe cut off by its shell timeout, after 5 minutes of wall time. I re-ran the suite directly with a 15-minute timeout, and the 46/0/0 above is that run.
- **Untracked `*.backup-20261003-132424.*` files** (training, check-training, service-worker) are excluded by Part H's `git add`.

## 2026-10-03 · W5 · step 2.3 schema v5 and sync

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan`, on W4's uncommitted tree. Nothing committed. Run on Opus 5.5 at xhigh.

**Files.** Backups are `*.backup-20261003-135714.*` beside each file.
- `fitness/basalt.js`:
  - **Version and defaults.** `SCHEMA_VERSION` 4 → 5.
    - `equipment` gains `bands`, `parallettes`, `dipBars` and `lowBar`, all false.
    - A new top-level `equipmentLoads: {}` (deviation 1).
    - `training` gains `exclusions: {}`, `limitations: null`, `grip: null` and `equipmentCheck: null`.
    - The state-shape comment documents all of them.
  - **`toV5`**, run by `migrate` after `toV4`. It turns a new token on when your own data says you have it (rule below), and an onboarded save gets `training.equipmentCheck = { at, inferred: { token: { id, from: "session" | "slot" } } }`. Nothing else changes. Like `toV4`, it throws without `training.data.js`, so `load()` keeps the raw save and opens Fitness read-only.
  - **`healState`.**
    - `equipmentLoads` must be an object; it falls back to the default.
    - `training.exclusions` must be an object map.
    - `limitations`, `grip` and `equipmentCheck` must be an object or null.
- `js/syncmerge.js`:
  - **`mergeTraining`.** `exclusions` merge by `at`, record by record, as `decisions` do. `grip` and `limitations` take the newer `at`, as `assessment` does. Each is written only when one side has it, so a merge of two v4 saves keeps v4's shape (deviation 6).
  - **`mergeIronframe`.** `equipmentLoads` merges per implement: each record travels whole, and local wins (deviation 2).
  - Both comments document the rules, including `equipmentCheck` (local's whenever local has the key).
- `tools/check-syncmerge.js`: **K10** and **K10b**.
- `tools/check-workout.py`: **K9** (three legs), plus T11 and T12's version checks (deviation 5).
- `service-worker.js`: `CACHE_VERSION` v53 → v54.

**The inference rule.** A token is turned on when an exercise needs it and nothing you already own meets that requirement. Australian Row with rings owned infers no low bar. Two sources count:
- **A performed exercise in a logged session:** not skipped, at least one set above 0. You did it, so you had the equipment.
- **A slot's exercise**, only when you own the v4 token the new one was split from (`V5_SPLIT_FROM`: dip bars, low bar and bands ← `pullupBar`; parallettes ← `bench`, checked against `git show c7015a2:fitness/training.data.js`). Sessions are read first, so `from` says "session" when both apply. Off slots are ignored.

**Harness lines, before → after.** "Before" is the pre-change app rebuilt from the backups in the session scratchpad and run with the new harness (`HELTH_INDEX` / `SYNCMERGE_JS`).

| Case | Before | After |
|---|---|---|
| K9, as saved | version 4; no `dipBars`; no record; dip slot owned **false** | version 5; `{"dipBars": {"id": "dip_3", "from": "session"}}`; dip slot owned **true** |
| K9, no logged dip, bar owned | version 4; owned false | `{"dipBars": {"id": "dip_3", "from": "slot"}}`; owned true |
| K9, no logged dip, no bar | version 4; owned false | `{}`; owned **false** (the workout is unchanged) |
| K9, as saved, other checks | — | slots, sessions, PRs, tiers, phases, benchmarks, flags, decisions and assessment unchanged; v5 defaults present; migrated twice is identical |
| K10 | A keeps **excluded** push_3 and has no limitations; B loses squat_4 and keeps **palms** | both: push_3 allowed (B's 6 Oct), squat_4 excluded (A's), grip knuckles (A's 6 Oct), limits wrist + knee (B's only record); a stamp tie keeps local; two v4 saves gain no v5 keys |
| K10b | A dumbbells `{"mode":"fixed","stepKg":2,"kg":[5,7.5,12.5]}`; B `{"mode":"adjustable","kg":[5,7.5,12.5],"stepKg":2,"maxKg":null}` (mixed) | A `{"mode":"fixed","kg":[5,7.5,12.5]}`; B `{"mode":"adjustable","stepKg":2,"maxKg":null}`; A takes B's kettlebells |

| Check | Before | After |
|---|---|---|
| `check-workout.py` | 46 pass, **1 fail (K9)**, 0 error, exit 1 | **47 pass, 0 fail, 0 error**, exit 0 (~7 min) |
| `check-syncmerge.js` | 6 pass, **2 fail (K10, K10b)** | **8 pass, 0 fail** |
| `check-training.js` | all passed, 44 PASS (W4) | all passed, 44 PASS |
| `check-training-data.js` / `check-muscle-map.js` / `check-androidupdate.js` | OK / OK / 17 passed | OK / OK / 17 passed |

The full suites were run by a test-runner subagent; I read both output files myself. Two comment-only edits landed during that run, so I re-ran K9 and `check-syncmerge.js` on the final tree: 1 pass and 8 pass.

**The cases can fail where it matters.** Two planted faults, both in scratch copies:
- **Stand-in condition removed from `toV5`:** K9 FAILs on exactly the no-bar leg. `dipBars` gets inferred from the slot and the dip slot flips to owned.
- **"Only when a side has them" guard removed from `mergeTraining`:** T13 FAILs ("V4 keeps its own training") and so does K10's v4-shape check.

**Deviations, and choices the plan left open.**
1. **`equipmentLoads` defaults to `{}`, not explicit per-implement records.** `training.js`'s `loadSpec` already treats a missing implement as today's steps (`LOAD_STEP_KG`, no maximum), so `{}` *is* "as today's steps", with the number in one place. Explicit defaults would have three costs:
   - they'd copy 2.5 / 4 into every save;
   - `deepMerge` on every load would mix default keys into a fixed-list record (`{mode: "fixed", stepKg, maxKg, kg}`);
   - an implement you never set up could never take the other device's setting.
2. **"Field by field, local winning, like `equipment`" is read as per implement.** Each implement's record is one field and travels whole. `mergeFields` goes one level deeper and pairs one device's fixed list with the other's step (K10b's before), and its "non-empty wins" rule means a cleared maximum (`maxKg: null`) comes back from the other device on every sync.
3. **Slot inference needs the v4 stand-in** (rule above). The plan says "the current slot's exercise … needs it". Read literally, that turns on dip bars for a no-bar user whose carried-over dip slot was already falling back (`prescriptionFor` → `nearestOwned`), so their workout would change on upgrade. The planted fault shows exactly that.
4. **The card's queue is a state record; dismissing it is W7's, per device.** `training.equipmentCheck` is written for onboarded saves only, and even when nothing was inferred, because the user may own bands or parallettes the app never asked about. The house pattern is v4's upgrade card: it's derived from state, and `UPGRADE_SEEN_KEY` in `ironframe.ui` marks it dismissed per device. W7 should do the same with a new key, e.g. `v5.equipmentCheckSeen`. **K9's "the card shows once" leg is W7's:** the card doesn't exist yet. The case's comment says so.
5. **T11 and T12 hard-coded version 4, so they now read `App.SCHEMA_VERSION`**, as S9 already does (`schema >= 4` and equal to the build). Without this both FAIL on v5. Their other assertions are unchanged.
6. **The v5 training keys are added to a merge only when one side has them.** Without that, two v4 saves merge into a training with `exclusions: {}`, and T13 fails (planted fault above).
7. **`healState` covers only the new keys.** `assessment` would take the same object-or-null rule, but it's a v4 key, so I left it.

**Finding for R2, confirmed by a probe (scratch `edge_merge.js` + `edge_load.py`, not a harness case):**

### W5-1 · DESIGN RISK (medium): a sync before the device's first write skips `toV5` on that device
`load()` migrates in memory but writes nothing until the first save. `js/storage.js` `payload()` builds the local half of a sync from **raw** `localStorage`. So when a device opens the v5 build and a sync runs before it logs anything, the merge sees:
- local: still v4;
- file: another device that's already on v5.

`mergeIronframe` gives the merge version 5 (the max). `migrate` then takes the same-version branch, so `toV5` never runs over this device's own data, and the new tokens come from the other device: local lacks the keys, so `mergeFields` takes the file's.

| | Device B (this one) | Device A (already v5) |
|---|---|---|
| Owns | pull-up bar | no bar, no dip bars |
| Dip history | one logged Parallel Bar Dip | none |
| Equipment check record | none | present, nothing inferred |

Result on B after the merge and a load: version 5, `dipBars` false, `Training.owns(dip_3)` false, and the dip slot trains **Two-Chair Dip**. B also carries A's check record, with `inferred: {}`. 0 page errors.

- **Who it hits:** anyone with two devices who updates one first. The Hub syncs at startup, before any workout is logged, so this is the likely path for the second device, not a corner.
- **The window isn't new;** `toV4` has it too. v5 is the first migration whose output is per-device data that a sync can't supply.
- **Smallest fix (not applied):** in `load()`, once `migrate` succeeds on a save whose version is below `SCHEMA_VERSION` and nothing set `READ_ONLY`, write the migrated state back at once. That's one condition in the one function every load goes through, and it closes the window for every migration.
  - **Cost:** a rollback to the v4 build is read-only from the first open of v5, not from the first workout logged on it.
  - **Why it isn't applied:** it changes boot for every migration and has that trade-off, and the window predates this step. Yours to decide.
- **Mitigation W7 can apply regardless:** the Equipment check card lists all four new items with their current state, not only the inferred ones, so B sees "Dip bars: off" and can tick it.

**Left for W6.**
- Pass `S.equipmentLoads` as `o.loads`. `{}` is valid and means today's steps.
- `setGrip` and `setLimitations` must clear by writing a stamped record (e.g. `{ at }` or `{ push: "palms", at }`), **never `null`**. `newerRecord` lets any record beat `null`, so a null clear comes back from the other device.
- Exclusions are re-stamped, never deleted.

**Left for W7.**
- The Equipment check card reads `training.equipmentCheck`; dismissing it is per device, in `ironframe.ui`. Extend K9 with "shows once" (dismiss, reload, absent) the way T20 does.
- Settings' "Weights you have" shows `LOAD_STEP_KG` / no maximum for an implement with no record, and saving writes the whole record.
- The v5 fixture.

**Not run:** the Android and desktop shells, and screens by eye (no UI changed).

**Untracked:** the five `*.backup-20261003-135714.*` files (basalt, syncmerge, check-syncmerge, check-workout, service-worker), which Part H's `git add` excludes.

## 2026-10-03 · W6 · step 2.4 engine wiring

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan`, on W5's uncommitted tree. Nothing committed. Run on Opus 5.5.

**Files.** Backups are `*.backup-20261003-143827.*` beside each file.
- `fitness/basalt.js` (+383 / −112):
  - **One context.** `trainingCtx(s)` builds what Training reads (equipment, decisions, goal, exclusions, limitations, grip, `equipmentLoads` as `loads`), exposed as `engine.ctx()`. `recommendFor` passes all of it, so owned weights, standing grip and exclusions reach the card.
  - **`prescriptionFor`** uses `Training.blocked` with the rx's own grip. A blocked slot exercise falls back to `nearestAllowed` (replaces `nearestOwned`), else the first allowed entry point. It returns `{ rx, note, blocked }`, where `blocked` is `"equipment" | "excluded" | a joint`, and the note says which. The stored slot is never changed.
  - **`nearestAllowed`** walks predecessors through `next` **and `offer`** within the slot, skips skill-kind, takes the hardest setup, and carries grip and custom.
  - **`buildWorkout(day, mode, length, overrides, grips)`.** `grips` (slot → grip) is the *Knuckles today* override. It keeps the same prescription on that grip, so it isn't a swap. Custom sets replace the base count; +1 set, deload and recovery apply to them. A swap carries today's or the standing grip.
  - **`cardRec`** ignores the grip when it matches a workout exercise to its slot, so a knuckles-today session still shows the slot's card.
  - **`decide(slot, choice, to)`:**
    - `"option"` steps into one of `rec.optionSteps` and stores `{ choice: "option", to, at }`. It's refused inside a recovery block, like any step up.
    - Any choice outside step / step2 / load / repeat / option is now refused. Before, it was silently stored (measured below).
    - A held slot stays held through a step back.
  - **`setGoal`** leaves a slot with `custom.range` alone.
  - **New calls.** `chooseExercise`, `setExcluded`, `setLimitations`, `setGrip`, `setHold`, `setCustom`. Each stamps and saves, and a refusal returns `{ error }` with an inline sentence. Shapes are in their comments and in the state-shape comment.
  - **Swap lists (preview and active).** One `swapRows` renders both. Excluded movements are hidden behind *Show excluded (n)* (`data-pvswap-excluded` / `data-swap-excluded`), and choosing one is still a one-off swap. Badges:
    - current;
    - excluded;
    - needs ⟨gear⟩;
    - avoiding your ⟨joint⟩;
    - careful: ⟨joint⟩ beside the others.

    `engine.slotOptions` ranks allowed, then careful (+500), then blocked (+1000). `engine.swapStatus(slot, id)` gives `{ missing, blocked, careful }`.
  - **Pain swaps.** A `SUBSTITUTION_SETUPS` name (Fist Push-up, Knuckle/Parallette Push-up) on a grip-capable exercise keeps the exercise and sets `rx.setup.grip`. Clear restores it from the snapshot, and the exercise stays flagged. On Diamond and other non-capable exercises it relabels, as before.
  - **Assessment, `setSlotOn`, the row offer and `setTemplate`'s row** use `Training.allowed` (`assessCtx`, `firstAllowed`) instead of `owns`.
  - **`slotStatus`'s fallback line** names the reason ("excluded — …", "avoiding your wrist — …").
  - **The phase report** counts an `option` decision as a step.
  - **`wireDecide`** passes `data-to` through, so W7's option buttons need markup only.
- `tools/check-workout.py` (+307): K11–K18, and the helpers `eng`, `preview_rows`, `preview_note`, `push_today`, `onboard_push` and `push_sets_and_complete`.
- `service-worker.js`: `CACHE_VERSION` v54 → v55.

**Harness lines, before → after.** "Before" is the pre-change app, rebuilt in the session scratchpad from the backup (`index.html` checked byte-identical) and run through `HELTH_INDEX`. The cases were written first.

| Case | Before | After |
|---|---|---|
| K11 | call absent; slot push_2; preview/workout push_2; level 2 | slot **push_5** "chosen by you" after a reload; preview and workout push_5; level 5; a skill refused inline |
| K12 | knuckles: grip None; pain swap: relabelled "Fist Push-up", grip None, 1 flag | knuckles: rx and slot grip **knuckles**, 0 flags; pain swap: push_2 on **knuckles**, 1 flag |
| K13 | PASS (W3's `dipBars` already did it): "Parallel Bar Dip needs dip bars", 0 steps | PASS, unchanged. **A guard**, not a harness defect |
| K14 | preview push_2, no note; Swap lists it; no Show excluded | preview **push_incline**, note "…on your excluded list…"; hidden, then shown as "excluded"; a one-off swap works; included again → push_2, record `none` |
| K15 | every leg push_2; badges `CURRENT` | avoid → push_incline; knuckles → push_2 on knuckles; palms → push_incline; Allow anyway → push_2; careful → push_2 with `CAREFUL: WRIST`; "toes" refused, nothing written |
| K16 | 3 × 6–12; +1 → 4 × 6–12; range after Strength [6, 12]; `below-top` | **4 × 8–10**; +1 → **5 × 8–10**; "at least 2 above" refused; range after Strength **[8, 10]**; held: 0 Step up (`hold`); unheld: 1 |
| K17 | `decide("option", skill)` **stored `{choice: "option"}`** and returned the slot; slot push_4 | skill refused (null); slot **push_5**, `{choice: "option", to: "push_5"}`; level 5; report steps **1** (0 with the report line reverted, below) |
| K18 | step to **12.5 kg** | step to **15 kg** (dumbbells listed 10, 15) |

| Check | Before | After (final tree) |
|---|---|---|
| `check-workout.py` K11–K18 | 1 pass (K13), 7 fail, 0 error, exit 1 | 8 pass |
| `check-workout.py`, full | 47 pass (W5) | **55 pass, 0 fail, 0 error**, exit 0 |
| `check-training.js` / `check-training-data.js` / `check-muscle-map.js` | all passed / OK / OK | the same |
| `check-syncmerge.js` / `check-androidupdate.js` | 8 pass / 17 passed | the same |

A test-runner subagent ran the full suite twice. The first run, before the last two edits, gave 55/0/0. The second, on the final tree, also gave 55/0/0. I read both output files myself.

**The new K17 check can fail.** I made a scratch copy of the final tree with only the report line reverted (`d.choice === "step"`). K17 FAILs there with "report steps 0".

**Before/after sweep of `prescriptionFor`** (scratch `sweep_pr.py`, not a harness case). Every non-skill slot exercise was placed in its slot under six equipment sets, with no exclusions or limits. **22 of 414 differ, all the same kind:** a branch move you can't do used to fall back to the slot's first entry point, and now falls back to the nearest exercise that names it.
- L-Sit, Dragon Flag and its negative: Plank (core_1) → **core_2**.
- Korean, Ring and Weighted Dip: Chair Dip or Bench Dip → **Two-Chair Dip**, or **Parallel Bar Dip** when you own dip bars.
- 0 page errors either side.

**Deviations, and choices the plan left open.**
1. **The six calls are reached by direct calls in K11–K18 until W7 adds their controls.** The harness header says so. K11 and K12 are written against step 2.4's engine. W7 should swap the `eng(...)` calls for clicks, as Part F's K11 and K12 describe (Program → Change; *Push-ups on*).
2. **Including an exclusion again is state `"none"`.** The plan names only "excluded" and "allowed", and "allowed" is *Allow anyway*, which also lets the exercise past a joint limit. Using it for "include again" would quietly switch off your limitations for that exercise. `training.js`'s `blocked` already treats any other state as no exclusion, so `"none"` needed no change there. Never deleted, as W5 required.
3. **"Careful" warns at stress 2** (`CAREFUL_AT`, a named constant, the same threshold "avoid" uses). At ≥ 1 it would fire on all 239 joint scores instead of the 130 at 2. *Allow anyway* silences it too.
4. **`chooseExercise` refuses a blocked exercise** with an inline sentence (needs ⟨gear⟩ / excluded / avoided joint) instead of saving a slot that `prescriptionFor` would silently replace. Skill-kind exercises are refused too. A grip given in `o.setup` wins over the standing grip, and the joint check uses it.
5. **`setGrip` keeps every slot's grip in one record** (`{ push: "knuckles", at }`) and writes "palms" explicitly. It moves the slot's rx onto the grip only when the exercise takes one.
6. **`setHold`, `setCustom` and `setGrip` re-stamp `acceptedAt`**, because the slot syncs by that stamp. Side effect: `offLoad` (R1-1) ignores sessions finished before `acceptedAt`, so after one of these edits a pending "logged at 5 kg, not 10 kg" question disappears until the next session. It applies only to loaded slots; R2 should judge it. `setHold` writes nothing when the state is unchanged.
7. **`setCustom` replaces the whole custom.** A part left out goes back to the goal's. A slot without a top (a skill, `range[1] == null`) is refused.
8. **The fallback carries custom sets/range and grip** (from `nearestAllowed` or the first entry point), as a step does. `nearestOwned` carried neither.
9. **The pain-swap grip keeps the exercise's own name**, with "Swapped: Fist Push-up" on the flag badge. Before, the exercise was renamed "Fist Push-up" while keeping push_2's id.

**Left for W7.**
- **The Today card has no `"hold"` case.** A held slot at the top reads "Repeat: no session at this prescription yet", which is wrong, and Program shows "2 of 2 at 4 × 10". That's "the holding copy" in 2.5. Unreachable until *Hold* has a control.
- **Option buttons.** Render `rec.optionSteps` as `data-decide="<slot>" data-choice="option" data-to="<id>"`; `wireDecide` and its toast already handle them. The "Optional next: …, from Swap." line is still there (T24 reads it).
- ***Knuckles today*** is `buildWorkout`'s fifth argument: keep a `chosen.grips` beside `chosen.overrides` in the Today preview.
- **"Careful" on Today and in the picker:** `engine.swapStatus(slot, id).careful`. Suggesting knuckles for wrists is UI.
- **Excluding the current exercise:** `prescriptionFor(slot).rx.exerciseId` is the nearest allowed easier movement, for the picker's preselection.

**Noticed, not touched.**
- `css/themes.css` is referenced by `index.html` but doesn't exist on this tree, so every page load logs one ERR_FILE_NOT_FOUND. It's pre-existing and not a page error.
- **The first test-runner's "before" run is void.** After I built the scratch copy, its `index.html` was replaced with an older 27.7 KB version, and all 8 cases ERRORed on onboarding. The subagent read that as "not yet functional". I rebuilt the copy, checked it byte-identical, and ran the before record myself (the table above).

**Not run:** the Android and desktop shells, and the swap lists by eye in both themes or at 390 px. The *Show excluded* button and the extra badge reuse the existing `btn--ghost btn--sm` and `badge` classes.

**Untracked:** the three `*.backup-20261003-143827.*` files (basalt, check-workout, service-worker), which Part H's `git add` excludes.

## 2026-10-03 · W7 · step 2.5 screens and close-out

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan`, on W6's uncommitted tree. Nothing committed. Run on Sonnet 5.5.

**Files.** Backups are `*.backup-20261003-151554.*` beside each file.
- `fitness/basalt.js`:
  - **Program.**
    - Per slot: *Change exercise*, *Hold* / *Resume step-ups*, *Sets & range*, with "holding" and "your sets & range" tags.
    - *Push-ups on: Palms / Knuckles*, the *Excluded movements* card, and the *Check your equipment* card at the top.
    - The picker groups *On your path*, *Branches* and *Weighted*, with no skill attempts. Each row has its badges (current, excluded, allowed anyway, needs ⟨gear⟩, avoiding your ⟨joint⟩, careful) and *Exclude* / *Include again* / *Allow anyway*. Setup selects (grip, surface / angle / band) and an optional starting load sit below the list.
    - An open panel survives `App.refresh()` (module `PK`).
  - **Today.**
    - *Knuckles today* tick under a grip-capable row in the preview (`chosen.grips` → `buildWorkout`'s fifth argument).
    - A `careful: ⟨joint⟩` badge, and "your wrist is marked careful — knuckles keep it straight".
    - The `hold` case on the card, option buttons (*Step into Archer Push-up*, `data-to`), and a "heaviest weight you've listed" line.
    - "Knuckles" in the exercise line (`setupText`, so Program and the workout show it too).
  - **Settings.** The four new items, *Weights you have* (per implement: adjustable step and heaviest, or a fixed list) and *Joint limits* (a select per joint). Setup's equipment step lists the four items.
  - **Equipment check card** (`equipCheckHtml`): Program and the ready Today screen, dismissed per device by `v5.equipmentCheckSeen` in `ironframe.ui`. A tick saves at once.
  - **Slot status.** A held slot says "step-ups paused".
- `fitness/basalt.css` (+15), `index.html` (+11): panel and row styles; Settings containers `#set-weights`, `#set-limits`, `#set-err`.
- `README.md`: five paragraphs under "The program follows the equipment you have" (choose and keep, knuckles, exclusions and limits, hold and custom, equipment and weights).
- `service-worker.js`: `CACHE_VERSION` v55 → v56. No new precached file.
- `tools/check-workout.py`: K9's "shows once" leg, K11 / K12 / K17 now by clicks, new K19–K22, and `tap` / `put` / `tick` / `choose` on `Session`.
- `tools/fixtures/v5-midworkout.json` (new, 20 KB): see below.

**Harness lines, before → after.** "Before" is the pre-change app (`basalt.js`, `basalt.css`, `index.html` from the backups, the rest of the tree as is) run through `HELTH_INDEX`. The cases were written first.

| Case | Before | After |
|---|---|---|
| K9 (card leg) | card 0, no ticks | card 1, `dipBars` ticked and the other three not; gone after *Looks right* and a reload |
| K11 | slot push_2; 0 skills; no groups | slot push_5 "chosen by you" after a reload; preview and workout push_5; level 5; 0 skills listed; the three groups in order |
| K12 | standing knuckles: grip None, no control | rx grip and slot grip knuckles, 0 flags; the wrist pain swap still knuckles, flagged |
| K17 | 0 buttons; slot push_4 | one button, *Step into Archer Push-up*; slot push_5, option decision, report steps 1 |
| K19 | no controls: hold None, slot 3 × 6–12, no card | hold on and off; "at least 2 above" inline, nothing written; 4 × 8–10; excluding Push-up preselects Incline; picking it says "on your excluded list"; the card lists it, *Include again* re-stamps `none` |
| K20 | no tick; hint '' | knuckles on the same movement; careful-wrist hint; held reason "Holding at 3 × 12 …" with 0 buttons; the workout line "Push · knuckles · 3 × 6–12 reps"; no standing grip written |
| K21 | items []; nothing saved | four items; "kilograms" error inline; `{"mode":"fixed","kg":[5,7.5,12.5]}`; no kettlebell record; wrist avoid + knee careful stamped; the form reopens with them; Push-up falls back to Incline |
| K22 | items [] | the four items; `dipBars` and `bands` saved |

| Check | Before | After (final tree) |
|---|---|---|
| `check-workout.py`, K9 / K11 / K12 / K17 / K19–K22 | 0 pass, 8 fail, 0 error (before-run 2 plus 3) | 8 pass |
| `check-workout.py`, full | 55 pass (W6) | **59 pass, 0 fail, 0 error**, exit 0 |
| `check-training.js` / `check-training-data.js` / `check-muscle-map.js` | all passed / OK / OK | the same |
| `check-syncmerge.js` / `check-androidupdate.js` | 8 pass / 17 passed | the same |

The first before-run had K20 and K21 ERROR, and the first after-run had K11, K19 and K20 wrong. All were harness defects, fixed in this file. Two causes: `#discard-session` opens a confirm modal, and a hidden control is clicked after a save closes the modal. `tap` and its siblings now treat an absent or hidden control as absent, so a before-run FAILs with numbers. K19's first assertion was also wrong about the wording; the row says "step-ups paused", which is what the screen shows. The suite files are in the session scratchpad, not the repo.

**The v5 fixture.** `tools/fixtures/v5-midworkout.json` has the same two keys as v4 plus a `_note`. It was written by this build with real clicks, the clock set to Asia/Kolkata dates, and `evaluate` only to read `localStorage`.
- Onboarded 27 Sep on the rotation with pull-up bar, dip bars, dumbbells, bench and kettlebells; assessment answers as in v4 (Parallel Bar Dip for the dip slot).
- A finished push workout on 27 Sep and a finished pull workout on 29 Sep, every set Just right.
- On 30 Sep: *Push-ups on Knuckles*, Diamond Push-up excluded, push set to 4 × 8–10, Hold on the shoulder slot, fixed dumbbells 5 / 7.5 / 12.5 kg, knee careful.
- The Legs workout begun 07:30 IST on 1 Oct, 7 / 8 / 9 on its first movement, not finished.
- Every v5 key is populated except `training.equipmentCheck`, which is `null` because a new profile is not upgraded. Stage 3's v5 → v6 test seeds it if it needs it.
- Checked: seeded into the app it boots at version 5, resumes the draft (7, 8, 9), leaves the slots unchanged and logs 0 page errors. That was a one-off check, not a harness case.

**Looked at by eye.** Scratch screenshots (picker, Sets & range, Program, Today preview, Settings) in Selene and Selene Day at 390 and 1440 px: 0 horizontal overflow, 0 page errors. They found two defects, both fixed:
- The `hidden` attribute lost to `.field { display }`, so both of a weight form's modes showed at once.
- The three-column Program row left 130 px for three buttons at 390 px.

Other themes weren't looked at.

**Deviations, and choices the plan left open.**
1. **Weights aren't offered in setup,** only in Settings. Setup lists the four new items. Plan C5 reads "the Settings modal list the new items, with 'Weights you have' below"; I read the weights as Settings'. A new profile has no record, which is today's steps.
2. **The Equipment check card shows in Program and on the ready Today screen,** not inside an active workout. K9's fixture has a draft, so its "shows once" leg runs on Program.
3. **The "Optional next: …, from Swap." line lost "from Swap"** now that the options are buttons. T24 reads "end of this path" and passes.
4. **`setupText` gained "knuckles".** It is also what `stepText` and `landText` print, so a step that carries the grip says "… · knuckles".
5. **Held slots read "· step-ups paused" in Program's status line** whatever else the line says, so the Hold button's state is never a guess.
6. **Settings writes only what changed.** A weight record is written only if it differs from what applies now, and limits only if they differ (each call re-stamps).
7. **K14–K16 and K18 still call the engine to set up** (`eng(...)`). Part F asks for clicks only in K11 and K12; K17 was converted too. K19–K21 cover those controls by clicks.
8. **Exclude is offered on every picker row, Allow anyway only where a joint blocks the movement,** and an excluded movement stays in the picker with *Include again*. Swap lists keep hiding excluded movements behind *Show excluded*.

**Left for R2.**
- **Not run:** the Android and desktop shells, and the screens in themes other than Selene and Selene Day.
- **Noticed, not touched:**
  - At 390 px `#btn-settings` is not visible, so Settings is reached some other way on a phone. I opened it with a script in the screenshots and did not check how a user does.
  - *Discard* is a confirm modal; that predates this step.
  - The picker for Push lists 18 rows. Long, but one tap per row; I didn't add a search.
- **W5-1 (sync before the first write) stays open;** the card lists all four tokens, which is its mitigation.
- W4's open question (routing walks past equipment you lack) and W6's *Set / Hold re-stamps `acceptedAt`* side effect are R2's to judge. A Hold or Sets & range edit on a loaded slot hides a pending "logged at 5 kg" question until the next session.

**Untracked:** the six `*.backup-20261003-151554.*` files (basalt js and css, README, index, service-worker, check-workout), which Part H's `git add` excludes.

## 2026-10-03 · R2 · step 2.6 review

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan`, on W7's uncommitted tree. Nothing committed. No code changed by this window. Run on Opus 5.5. Scratch probes (`r2_probes.py`, `r2_limits_sync.js`) and screenshots are in this session's scratchpad, not the repo.

**Harnesses, re-run on this tree** (full suite by a test-runner subagent; I read the output files myself).

| Check | Result |
|---|---|
| `check-workout.py` | **59 pass, 0 fail, 0 error**, exit 0 (K9, K11–K22, H1b, H6 all PASS) |
| `check-training.js` | all passed, **44 PASS** (the subagent's summary said 47; the file has 44) |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK |
| `check-syncmerge.js` | 8 pass, 0 fail (K10, K10b PASS) |
| `check-androidupdate.js` | 17 passed |

**Findings, each reproduced by clicks or Node against this tree.**

### R2-1 · BUG (medium): an untouched Settings save re-stamps your joint limits once you have two or more, so a stale device overwrites the other's newer limits
`saveSettings` (`fitness/basalt.js:1332`) writes limits only when they changed, by comparing `JSON.stringify(readLimits())` with the stored record. `readLimits` returns joints in form order (wrist … knee); the stored side is rebuilt with its keys **sorted** (knee, wrist). Two limits in a different order than the alphabet never compare equal, so every Save calls `setLimitations` and re-stamps `at`.
- **By clicks:** wrist avoid + knee careful, save; then open Settings and Save untouched 30 min later → `at` 06:30:06 → **07:00:00**. With wrist alone: `at` unchanged.
- **Sync (Node, the real `mergePayload`):** both devices at T0; the desktop clears the knee at T1; the phone saves Settings for anything else at T2. Merged on both: `{"wrist":"avoid","knee":"careful"}` — the desktop's change is lost. Without the re-stamp: `{"wrist":"avoid"}` on both.
- **Smallest fix (not applied):** compare with the same key order on both sides, e.g. sort `limits`' keys before stringifying. One expression on one line; `setLimitations` and the merge stay as they are.

### R2-2 · BUG (medium): the picker's *Grip: Palms* is ignored when your standing grip is knuckles
The *Use* handler (`basalt.js:8351`) writes `o.setup.grip` only for knuckles. `chooseExercise` (`basalt.js:3235`) reads `(o.setup && o.setup.grip) || standingGrip(…)`, so a missing palms falls back to the standing knuckles — the opposite of its own comment ("a grip the picker set wins").
- **By clicks:** *Push-ups on: Knuckles*; *Change exercise* → Decline Push-up → Grip **Palms** → *Use* → saved `push_4` with grip **knuckles**; the row reads "Decline Push-up · knuckles". 0 page errors.
- **Smallest fix (not applied):** write `o.setup.grip = PK.grip` for palms too. `startOf` already drops palms (absent is palms) and `blocked` reads it correctly.
- **Left for you:** even fixed, the next step carries the standing grip (`carry` puts standing before the rx's own), so a palms choice under standing knuckles lasts one rung. That's C1's rule as written; say if the picker's grip should win past a step.

### R2-3 · INCONSISTENCY (low): Hold, Sets & range and Push-ups on drop a pending "logged at 5 kg, not 10 kg" question
W6's deviation 6, now measured. These edits re-stamp `acceptedAt` for sync, and R1-1's `offLoad` (`training.js:174`) ignores sessions finished before `acceptedAt`.
- **By clicks:** Weighted Dip chosen at 10 kg, a session logged at 5 kg → `off-load`, Program "logged at 5 kg, not 10 kg — see Workout". *Hold* → `no-history`, "0 of 2 at 3 × 12 · step-ups paused". *Resume step-ups* → still `no-history`. The question is gone until the next session at 5 kg asks again; nothing is written wrongly.
- **Smallest fix (not applied):** a separate `loadAt`, stamped only by writes that change the load (a step, *Set slot to X kg*, a choice), and `offLoad` reads `rx.loadAt || rx.acceptedAt`. Or accept it as is; it only touches loaded slots.

### R2-4 · INCONSISTENCY (low): ticking the Equipment check card on Today doesn't rebuild the preview, so Begin trains the old fallback
`wireEquipCheck`'s change handler (`basalt.js:5241`) saves and toasts "Your slots follow the equipment you list", but nothing re-renders, and Begin starts `chosen.workout`, built before the tick.
- **By clicks:** v4 fixture with no bar, no logged dip, no draft → card on Today; push day previews Two-Chair Dip; tick *Dip bars* → `dipBars` true and `prescriptionFor("dip")` is now `dip_3`, but the preview still shows `dip_alt_twochair` and *Begin* trains **Two-Chair Dip**.
- **Smallest fix (not applied):** `App.refresh()` after the save in that handler. Program's status lines have the same staleness and the same fix.

**Judged, nothing to fix.**
- **W4's routing question:** walking past a rung you don't own (Korean Dip → Weighted Dip, past Ring Dip without rings) is C3's `allowed` as written, and the skipped rung can't be trained anyway. Keep it.
- **Screens, 3 themes (Selene, Selene Day, Nostromo) × 390 and 1920 px:** Program with the picker and Sets & range open, Today, Settings' weights and limits. `scrollWidth` equals the viewport in all 6, 0 page errors. Off-screen elements are the toast and a hidden drawer only. Picker rows, badges and *Exclude* / *Allow anyway* read by eye at 390 px in Nostromo.
- **W7's open note on Settings at 390 px:** reachable. The Fitness menu's setup item (`data-fitsetup`) opens it, measured by clicks.

**Carried open, not re-run here.** W5-1 (a sync before the first write skips `toV5`) is still yours to decide. The raw tokens in the Skills list and the guide modal's "Equipment:" line (W2's note) now also print `dipBars`, `lowBar` and any-of lists such as "pullupBar, rings" as if all-of. Display only; Stage 4's directory replaces both.

**Not run:** the Android and desktop shells.

## 2026-10-03 · W8 · step 3.1 taxonomy and upper-body coverage data

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan`, on R2's uncommitted tree. Nothing committed. Run on Sonnet 5.5. **The window was cut off after its last edit (16:23) before it wrote this entry; a second session on 2026-10-05 wrote it from the diffs against the backups and by re-running every check.** The numbers below were measured on this tree, not recalled.

**Files.** Backups are `*.backup-20261003-161754.*` beside `basalt.js`, `muscles.data.js` and `training.data.js`. The check scripts and `exercise-ids.tsv` were not backed up (git holds their pre-W8 state).
- `fitness/muscles.data.js` (+~190):
  - **22 groups.** The 14 kept, plus `delts_rear`, `traps`, `rotator_cuff`, `neck`, `abductors`, `adductors`, `calves`, `shins`. `lower_back` and `obliques` lose `assist`.
  - **`MUSCLE_FLOORS`** beside `MUSCLE_WEEK`, exported as `window.MUSCLE_FLOORS`:

    | Floor (direct sets / 7 d) | Groups |
    |---|---|
    | 3, `via: "main"` | chest, front delts, triceps, lats, upper back, abs, glutes |
    | 6, `via: "coverage"` | quads, hamstrings, biceps, side delts, rear delts, traps, forearms, obliques, lower back, calves, adductors, abductors |
    | 3, `via: "coverage"` | rotator cuff, neck, shins |

    **These are product choices, not validated minimums.** The header comment says so; the Muscles screen must say so beside the number (step 3.5).
  - **Existing rows (D1):** rear delts and traps added as secondary on the rows and handstand/overhead-press rows (`shoulder_4–6`, `shoulder_e2_ohp`, `skill_handstand_1–4`, the pull rows); adductors added as secondary on `squat_1`, `squat_alt_deep`, `squat_alt_cossack`.
  - **29 new rows**, every one with its slot's group as a primary.
- `fitness/training.data.js` (+~180): the curl, lateral, reardelt, cuff, traps, neck and grip slots with `coverage: true`, their catalogue rows, joint-stress rows and hold ranges. 29 `acc_*` ids.
- `fitness/basalt.js` (+~190): 29 `EXERCISE_DB` entries (`pattern: "accessory"`, cues, mistakes, readiness, injury), plus a two-line filter in Program's slot list.
- `tools/check-muscle-map.js`, `tools/check-training-data.js`, `tools/exercise-ids.tsv` (+29).
- `service-worker.js`: `CACHE_VERSION` v56 → v57. No new precached file.

**Harness lines.** Before is R2's entry; after is this tree, re-run on 2026-10-05.

| Check | Before (R2) | After |
|---|---|---|
| `check-workout.py` | 59 pass, 0 fail, 0 error | **59 pass, 0 fail, 0 error**, exit 0 |
| `check-training.js` | 44 PASS | **44 PASS**, all passed |
| `check-training-data.js` | OK | OK — "7 coverage slots, 29 exercises, each at the plan's count"; 115 exercises scored on 8 joints |
| `check-muscle-map.js` | OK | OK — 22 groups, id list matches the DB |
| `check-syncmerge.js` | 8 pass | 8 pass, 0 fail |
| `check-androidupdate.js` | 17 passed | 17 passed |

A subagent's first summary of `check-workout.py` read "27 passed" because its output file held only the T-cases; the full run is 59. Quote the run, not the summary.

**Deviations from the plan, and why.**
1. **`check-muscle-map.js` has a `PENDING_PRIMARY` list** (quads, hamstrings, obliques, lower back, adductors, abductors, calves, shins). The plan says the check fails on any group without a primary, but 3.1 only writes the upper-body slots, so eight groups can't have one yet. The check prints the list on every run and **fails once a listed group has a coverage slot**, so step 3.2 can't forget to empty it. Same for `check-training-data.js`'s PENDING slot list (quad … backext).
2. **`check-muscle-map.js` now loads `basalt.js` blocks 2 and 7** to read `EXERCISE_DB`, and fails if `exercise-ids.tsv` and the DB disagree.
3. **Program hides coverage slots** (`basalt.js` ~8016, `mainSlots`). Nothing builds a workout from them until 3.3 on, and they would list as eight-plus rows of "—". Step 3.5's Coverage card replaces this.
4. **Floors carry `via`.** The plan only said `MUSCLE_FLOORS` goes beside `MUSCLE_WEEK`; `via` records whether a main slot or a coverage slot is meant to clear it, so 3.5's "Neglected" copy can say which.

**Not run.** Dark mode and the 390 / 1920 px screens: W8 changed no screen except the filtered Program list, and I didn't open it. The check scripts' `PENDING` lines are the only visible change. The Android and desktop shells.

**For W9 (3.2).** Add quad, hamstring, calf, shin, adductor, abductor, antirot and backext (35 exercises) and **empty both PENDING lists in the same window** — each check fails the moment one listed group gets a slot. Every new exercise needs the same five things as W8's (`EXERCISE_DB`, catalogue row, muscle row with the slot's group as primary, joint-stress row, hold range for holds) plus a `exercise-ids.tsv` line. Suitcase Hold is the first loaded hold: `rangeFor` and `stepUp` must handle `kind: hold` with `loadMode` (plan 2.2's note; `K-hold` already passes).

## 2026-10-05 · W9 · step 3.2 lower-body and trunk coverage data

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan`, on W8's uncommitted tree. Nothing committed. Run on Sonnet 5.5.

**Files.** Backups are `*.backup-20261005-195019.*` beside `training.data.js`, `muscles.data.js`, `basalt.js`, `check-training-data.js` and `check-muscle-map.js`.
- `fitness/training.data.js`:
  - **Eight slots:** quad, hamstring, calf, shin, adductor, abductor, antirot, backext, each `coverage: true`.
  - **35 exercises:** `acc_<slot>_<slug>` rows, in the plan's counts (6, 5, 4, 2, 4, 4, 6, 4).
  - **Seven new hold ranges:** `HOLD_RANGES`.
  - **Seven band and lean setups:** `SETUPS`.
  - **35 joint-stress rows:** `JOINT_STRESS`.
- `fitness/muscles.data.js`: 35 rows, the slot's group primary on every one.
- `fitness/basalt.js`: 35 `EXERCISE_DB` entries (`pattern: "accessory"`, 4 cues each, 2 mistakes, readiness, injury).
- `tools/exercise-ids.tsv` (+35, now 64 `acc_` ids), `tools/check-training-data.js`, `tools/check-muscle-map.js`.
- `service-worker.js`: `CACHE_VERSION` v57 → v58. No new precached file.

**The two PENDING lists are empty.** `check-muscle-map.js`'s `PENDING_PRIMARY` is `[]` (the machinery stays, so a listed group still fails once a slot trains it). `check-training-data.js` now requires all fifteen slots, and the 64 total is checked unconditionally.

**Harness lines, before → after.** Both checks were edited first and run on W8's tree by a test-runner subagent.

| Check | Before (W8 tree, checks edited) | After (final tree) |
|---|---|---|
| `check-training-data.js` | exit 1: 8 slots "doesn't exist", 3 branch moves and Suitcase Hold missing, "29 coverage exercises, plan D2 says 64" | OK: **15 coverage slots, 64 exercises**; 150 exercises scored on 8 joints (368 scores, 161 of them 2) |
| `check-muscle-map.js` | exit 1: lower back, obliques, abductors, adductors, calves, shins "never a primary target"; 8 groups "a coverage group with no coverage slot" | OK: all 150 ids in DB, tsv and map; 22 floors, 15 slots each train a group they are primary for |
| `check-training.js` | all passed | all passed, 44 PASS (counted from the output file; a subagent summary said 45) |
| `check-workout.py` | 59 pass (W8) | **59 pass, 0 fail, 0 error**, exit 0 |
| `check-syncmerge.js` / `check-androidupdate.js` | 8 pass / 17 passed | 8 pass / 17 passed |

**The new checks can fail.** Two planted faults in a scratch copy of `fitness/` and `tools/`, nothing in the repo:
- Bent-Knee Calf Raise made a main exercise and Suitcase Hold's `loadMode` removed: `check-training-data.js` FAILs on four lines (offer not on the skill branch, unreachable from first, "a branch move is branch skill", "calls it a loaded hold").
- Pallof Press with obliques demoted to secondary: `check-muscle-map.js` FAILs ("obliques is not a primary there, so its sets would not count as direct obliques work").

**Walked by the engine** (scratch `walk.js`, not a harness case): from each slot's first rung, two sessions at the top, `recommend`, follow the step, under four equipment sets. Bands route past unowned rungs and arrive at the band move (quad ends Spanish Squat heavy; adductor ends Band Adduction heavy). Weights alone reach Suitcase Hold, which then reads `repeat / no-load` until you set a weight, as any loaded rung does. Shin walks Wall Tibialis through close, mid, far, then Single-Leg. With no equipment every slot ends at its last bodyweight rung (`ready`, no step).

**Deviations, and choices the plan left open.**
1. **Per-side holds are timed per side, but the catalogue can't say so.** Side planks, Copenhagen planks and Suitcase Hold take a seconds range, and `rangeFor` returns `perSide: false` for any hold (`check-training-data.js` also forbids `perSide` on non-loaded kinds). The cues say "repeat on the other side", as W8's Isometric Lateral Raise does. **W10 decides** whether one set means a hold on each side when it counts direct sets; I assumed yes.
2. **Where the plan's "with equipment" moves sit.** The check requires every main non-loaded exercise to be reachable by `next`, so:
   - Spanish Squat, Band Leg Curl, Band Adduction, Banded Lateral Walk, Banded Clamshell and Pallof Press sit at the end of their paths, like W8's band moves;
   - Pallof Press and Suitcase Hold are both `next` of Side Plank, Top Leg Raised, in that order, so band owners go to Pallof and weight owners to Suitcase.
3. **Offers.** Single-Leg RDL (bodyweight) is offered by Sliding Leg Curl, Bent-Knee Calf Raise by Calf Raise, and Dead Bug by Side Plank from Knees, because it asks nothing of the wrist or shoulder. The plan doesn't say which rung offers each.
4. **Dumbbell Split Squat, Single-Leg RDL with Dumbbell and Weighted Single-Leg Calf Raise are `perSide`, and the single-weight ones are `loadMode: "total"`.** Dumbbell Split Squat is `perHand`. Weighted Calf Raise takes dumbbells or kettlebells.
5. **A chair, a step or a stair isn't a token,** the way Two-Chair Dip isn't. Step-Up, Calf Raise on a Step and both Copenhagen planks are `BWT`.
6. **Dead Bug is primary for abs and obliques.** The slot needs obliques primary on every member. The plan's pain-swap name "Dead Bug" is unchanged and still maps to no id (`SUBSTITUTION_IDS`).
7. **The raised leg in Side Plank, Top Leg Raised counts abductors as secondary, not primary,** so the abductor floor isn't padded by a hold bought for obliques. The same reasoning put Reverse Hyperextension's and Good Morning's glutes and hamstrings in the secondary tier.
8. **Shin's setup is the plan's "feet close → far,"** as the `lean` key with three values (close, mid, far).
9. **I ran the quick Node checks myself between edits and for the planted faults;** the before and after records above come from test-runner subagents, and I read their output files.

**Joint-stress borderline calls (all judgment, none measured).** Rubric as in W3's entry.

| Exercise | Score | Why it's borderline |
|---|---|---|
| Reverse Lunge, Step-Up, Spanish Squat | knee 2 | Most of bodyweight through one knee near 90°, as Split Squat is. Wall Sit is knee 1 so "avoid knee" still leaves a quad rung |
| Assisted Sissy Squat | knee 2, ankle 2 | End-range knee flexion and a deep ankle angle |
| Single-Leg RDL with Dumbbell, Dumbbell Good Morning, Reverse Hyperextension | lower back 2 | Loaded or end-range spine. Bird Dog and Prone Back Extension stay at 1 so "avoid lower back" leaves two rungs |
| Suitcase Hold | lower back 2 | One-sided load is the point; Farmer Hold is 1 |
| Side Plank and Top Leg Raised, Side Plank Abduction, Copenhagen foot | shoulder 2 | All of the side body on one forearm. The knee versions are 1 |
| Single-Leg Calf Raise, Weighted, Single-Leg Tibialis | ankle 2 | All of bodyweight on one ankle |

**Not run.** The Android and desktop shells, and the screens by eye: nothing builds a workout from a coverage slot until step 3.3 on, and Program still hides them (W8's filter). Dark mode and the 390 / 1920 px screens aren't affected.

**For W10 (3.3).** The first loaded holds are Farmer Hold and Suitcase Hold; both read `no-load` until a weight is set, which is the existing rule. The selector needs the per-side decision in deviation 1. Every group now has a primary and a slot, so the 22 floors are all reachable.

**Untracked:** the five `*.backup-20261005-195019.*` files, which Part H's `git add` excludes.

## 2026-10-05 · W10 · step 3.3 coverage logic

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan`, on W9's uncommitted tree. Nothing committed. Run on Opus 5.5.

**Files.** Backups are `*.backup-20261005-203727.*` beside `index.html` and `service-worker.js`. The two new files have no backup; they didn't exist.
- `fitness/coverage.js` (new, 152 lines, `window.Coverage`). It's pure: no App, no DOM, no clock.
  - **`status(sessions, today, planned)`.** Gives each of the 22 groups `{ key, label, floor, direct, planned, shortfall, lastDay, daysSince }`.
  - **`pick(sessions, today, { rxFor, planned, pins, n })`.** Returns `[{ slot, group, rx, pinned, shortfall, reason }]`, best first.
  - **Named constants:** `WINDOW_DAYS = 7`, `REST_DAYS = 2` (the 48 h rule in training days) and `DEFAULT_PICKS = 4`.
- `tools/check-coverage.js` (new): cases V2a–V2i.
- `index.html`: a script tag after `muscles.data.js`. `service-worker.js`: `fitness/coverage.js` in `PRECACHE`, and `CACHE_VERSION` v58 → v59 (rule 8). Nothing in the app calls the module yet; W11 does.

**Harness lines, before → after.** The check was written first and run before `coverage.js` existed.

| Check | Before | After |
|---|---|---|
| `check-coverage.js` | `V2 FAIL — window.Coverage is missing`, exit 1 | **9 PASS**, all passed, exit 0 |
| `check-workout.py` | 59 pass (W9) | **59 pass, 0 fail, 0 error**, exit 0 |
| `check-training.js` | 44 PASS | 44 PASS, all passed |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK | OK / OK |
| `check-syncmerge.js` / `check-androidupdate.js` | 8 pass / 17 passed | 8 pass / 17 passed |

The full suite was run by a test-runner subagent, and I counted the results from its output files myself. Its summary said 10 coverage and 49 training PASSes; the files have 9 and 44.

| Case | Measured after |
|---|---|
| V2a direct | biceps 2 of 6, short 4, last 6 Oct (1 d): a 0 set, a skipped session, a session 7 days ago and a row (biceps secondary) don't count. Side plank 2 sets = obliques 2. 22 groups |
| V2b planned | squat 3 + wall sit 2 planned → quads planned 5, short 1 |
| V2c 48 h | curl skipped (trained yesterday), neck skipped (today), lateral picked (2 d ago), quad picked (planned squats only) |
| V2d rank | no history → curl, lateral, reardelt, cuff, "Biceps: 0 of 6 direct sets this week"; biceps at 5 of 6 ranks last of 15 |
| V2e deterministic | the same 15-slot order three times and with the history reversed |
| V2f pins | Wednesday pin on backext (7 of 6, trained yesterday) comes first, "Pinned for Wed — Lower back: 7 of 6 …"; a Mon/Fri pin and a `days: []` pin are no pin; 5 pins with n 4 → 5 picks |
| V2g allowed | neck "avoid" and an excluded Door-Frame Curl → 13 picks, neck and curl out, even when neck is pinned |
| V2h at floor | biceps 6 of 6 → curl not picked, 14 picks |
| V2i days since | biceps and side delts both 1 of 6; side delts (6 d) ranks before biceps (3 d) |

**The cases can fail.** I planted seven faults in a scratch copy of `coverage.js` (`COVERAGE_JS=`), one at a time:

| Fault | Fails |
|---|---|
| Secondary sets counted as direct | V2a, V2d, V2h |
| 48 h rule removed | V2c |
| Skipped exercises counted | V2a |
| Slots without a prescription kept | V2g |
| Pins not put first | V2f |
| Days-since tiebreak removed | V2i |

The tiebreak fault passed every case at first, which is why V2i exists. V2e also started at n 6, where slot order alone decides, so I widened it to all 15 slots.

**In the real page** (scratch `w10_probe.py`, not a harness case; `evaluate` read state only). I seeded the v5 fixture, then called `Coverage.pick(s.sessions, App.lib.today(), { rxFor: slot => engine.prescriptionFor(slot)?.rx })`.
- **Result:** version 5, 0 page errors, and picks curl → Door-Frame Curl, lateral → Isometric Lateral Raise, reardelt → Prone T-Raise, cuff → Wall Slide with Lift-Off. 19 groups below their floor.
- **`prescriptionFor` already serves coverage slots with no record.** It falls through to `firstAllowed`, so W11 doesn't need a record before picking.

**Choices the plan left open.**
1. **The 48 h rule reads logged sessions only. Today's planned main work counts toward the shortfall, not the rule.** On full body ×3 every session squats; counting the plan as "trained today" would mean quads, at 4.5 direct sets against a floor of 6, could never be topped up on a training day. The rule works in training days: a group trained today or yesterday is skipped, two days ago is fine.
2. **A per-side or unilateral set counts as one set** (W9's deviation 1, decided yes). The cue says "repeat on the other side", so one logged set means both sides.
3. **Pins.** `training.pins[slot].days` are weekdays (0 = Sunday), and an empty list is no pin, so a clear is a stamped record, never `null` (W5's sync lesson). A pin skips the shortfall and the 48 h rule, because it's your choice, but never the allowed check. Pins count toward `n` and aren't cut by it: dropping a pin silently would be destructive by surprise.
4. **`rxFor` is passed in as `engine.prescriptionFor(slot).rx`,** instead of `coverage.js` re-implementing the fallback (`nearestAllowed`, `firstAllowed`). A `null` rx means off, or nothing allowed, so every pick can be trained. The Node check uses a stand-in that applies the same rule to a slot with no record.
5. **`daysSince` covers all history, not just 7 days,** so "never trained" ranks ahead of "trained 20 days ago".
6. **Sessions are read the way `muscles.js` reads them:** `completed !== false`, a duplicate session id counts once, and future days are ignored. A session with no `dayKey` falls back to the calendar date of its timestamp, without the Hub's rollover hour (as `training.js` does). Since the v4 migration wrote `dayKey` everywhere, that fallback only covers un-migrated input.
7. **Not added:** a "replace a removed pick" option. If removing a finisher pick in the preview should bring in the next one, W11 or W12 can filter the result list.

**For W11 (3.4).**
- Call `Coverage.pick(sessions, App.lib.today(), { rxFor, planned, pins: training.pins, n })`.
  - `planned` is the main workout's `[{ id: ex.id, sets }]` for a finisher, and `[]` for a mini-session.
  - `n` is 4 for a finisher, and 2–6 for a mini (a clamp W11 owns).
- A coverage slot's record is created on first pick from the pick's `rx` (`why: "added for coverage"`).
- **D4 (W12):** the Muscles screen's *Direct sets (7 d) vs floor* column should read `Coverage.status`, so the screen and the selector can't disagree.

**Not run:** the Android and desktop shells. No screen changed, so themes and 390 / 1920 px weren't affected.

**Untracked:** the two `*.backup-20261005-203727.*` files, which Part H's `git add` excludes. The two new files are untracked and *are* included.

## 2026-10-05 · W11 · step 3.4 sessions and schema v6

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan`, on W10's uncommitted tree. Nothing committed. Run on Opus 5.5.

**Files.** Backups are `*.backup-20261005-205612.*` beside each file.
- `fitness/basalt.js` (+183 / −38):
  - **Schema v6.** `SCHEMA_VERSION` 5 → 6. The defaults gain `prefs.finisher: "off"` and `training.pins: {}`. The migration is the deep merge (comment in `migrate`), with no `toV6` function: there is nothing to infer, and a session with no `kind` is a main one. `healState` requires `pins` to be an object map. The state-shape comment documents both, plus coverage slot records and `session.kind`.
  - **`engine.mainSessions()`** and **`engine.isMini(x)`**. `recommendedDayType`, `restDayInfo`, `doneTodayInfo` and `nextSession` read main sessions. `liftOn` and the run clash follow through them.
  - **`buildWorkout(dayType, mode, length, overrides, grips, o)`** builds the finisher and the mini-session (D3) from `Coverage.pick`, for the logging day (`Hub.viewDate()`):
    - **Finisher.** With `prefs.finisher === "on"` (`o.finisher` overrides it), four picks follow the main slots as `finisher: true`. The main slots' sets count as `planned`.
    - **Mini-session.** `dayType: "mini"` builds picks only: `o.n`, clamped to `MINI_PICKS` [2, 6], default `Coverage.DEFAULT_PICKS` (4). The workout gets `kind: "mini"`.
    - **Shared rules.** Every pick carries `reason` and sits at the base set count (`countFor(rx, true)`: custom sets, deload and the recovery block apply, +1 set doesn't). A pick swaps through `overrides[slot]` like any slot, and `overrides[slot] === false` leaves it out. The main-slot code moved into a local `make()` that both paths use; nothing about main slots changed.
  - **`finalizeSession`.**
    - Saves `kind: "mini"` and `finisher: true` per exercise.
    - Gives a coverage slot its record on the first finished workout that trains one of its picks. The record is `prescriptionFor(slot).rx`, i.e. the first allowed rung, with `why: "added for coverage"` and `acceptedAt: null`.
    - A discarded workout writes no record.
  - **`engine.setPins(slot, days)`.** Coverage slots only; days are 0–6, de-duplicated and sorted. Stamped, and never deleted: no days means no pin.
  - **Attendance.**
    - `completedThisWeek` and `completedThisPhase` take a `mini` flag. Called without it they count main sessions only.
    - The "This week" tile adds "· +n accessory".
    - The phase card adds "Accessory sessions n · not counted above".
    - `evaluate`'s adherence (`sampleSize`, `expected`, `attended`) reads main sessions, and `adherence.accessory` is the mini count. The report gains an "Accessory sessions n" row, and its note says they never count as attended. Performance and recovery still read every session.
  - **Labels and warm-ups.**
    - `WARMUPS.mini` (3 drills, 145 s) and `COOLDOWNS.mini` (2 stretches, 85 s).
    - `DAY_LABEL.mini` "Accessory session", the session log's label "Accessory session", and the calendar's `DAY_TYPE_LABEL.mini` "Mini" (see "Looked at by eye").
    - "Preview all days" passes `{ finisher: false }`, because the picks are today's, not that day's.
- `js/syncmerge.js` (+8 / −3): `mergeTraining` merges `pins` per slot by `at`, only when a side has them. The comment covers coverage slots and mini-sessions, which the existing slot and session rules already handle.
- `tools/check-syncmerge.js`: **V6**. `tools/check-workout.py`: **V3, V4, V5, V8**, the helpers `v5_fixture`, `mini_workout`, `finisher_session`, `preview_order` and `stat_tile`, and the header.
- `service-worker.js`: `CACHE_VERSION` v59 → v60. No new file.

**Harness lines, before → after.** The cases were written first and run on this tree before any app edit.

| Case | Before | After |
|---|---|---|
| V3 | rest day true → **false**; next pull → **push**, 3 Oct → **4 Oct**; attended 1 → **2**, This week **2**; rest card 0; saved type mini, **kind none**, slots push/row/squat/core (a full-body day); warm-up 0, cool-down 0; streak 1 → 2, habit false → true | rest day stays true, card shown; next pull / 3 Oct unchanged; attended 1 → 1, This week **1**; kind **mini**, slots curl/lateral/reardelt/cuff; warm-up 3, cool-down 2; streak 1 → 2, habit false → true |
| V4 | finisher on adds nothing (`+[]`); no records; `setPins` absent; curl `None` | `+[curl, lateral, reardelt, cuff]`, 3 sets each, saved `finisher: true`, 4 records "added for coverage"; pin `{days: [6]}`; 3 Oct picks curl, traps, neck, grip; curl **ready/ready, 2 comparable** |
| V5 | version **5**, finisher None, pins None | version **6**, finisher "off", pins `{}`; the eight main slots, sessions, PRs, tiers, decisions, exclusions, limits, grip, loads and equipment check unchanged; migrated twice identical; the Legs draft resumes and finishes with **0 coverage records** |
| V8 | attended **3 of 3**; rows Sessions attended, Plan | attended **1 of 2** (`expectedSessions(phase, 1)` = 2); rows Sessions attended "1 of 2", **Accessory sessions "2"**, Plan |
| V6 | A's pins curl [1,3] (older), neck; B's curl [], calf: each kept its own | both: calf [5], curl [] (B's newer clear), neck [2]; a stamp tie keeps local; sessions s_1, s_2, s_3 with s_2 and s_3 still `kind: "mini"`; two v5 saves gain no `pins` |

| Check | Before (W10) | After |
|---|---|---|
| `check-workout.py`, V3/V4/V5/V8 | 0 pass, **4 fail**, 0 error | 4 pass |
| `check-workout.py`, full | 59 pass | **63 pass, 0 fail, 0 error**, exit 0 |
| `check-syncmerge.js` | 8 pass, then **V6 FAIL** with the case added | **9 pass, 0 fail** |
| `check-training.js` / `check-coverage.js` | 44 PASS / 9 PASS | 44 PASS / 9 PASS, all passed |
| `check-training-data.js` / `check-muscle-map.js` / `check-androidupdate.js` | OK / OK / 17 passed | OK / OK / 17 passed |

A test-runner subagent ran the full suite, and I read the seven output files myself (63 / 44 / 9 / 9 counted from the files). Two string-only edits landed after or during that run: removing an unread `DAY_DESC.mini`, and the calendar label below. So I re-ran V3, V4, V5, V8, T17 and P4d, plus `check-syncmerge.js`, `check-training.js` and `check-coverage.js`, on the final tree: 6 pass, 9 pass, all passed, all passed.

**The cases fail where it matters.** I planted eight faults in a scratch copy of the tree (`HELTH_INDEX`), one at a time:

| Fault | Fails |
|---|---|
| `restDayInfo` reads every session | V3: still a rest day; next main day |
| `recommendedDayType` reads every session | V3: next main day |
| `doneTodayInfo` reads every session | V3: rest card gone, next session moves to 4 Oct |
| `session.kind` not saved | V3 (four legs), V8 (all three) |
| No coverage record at finalize | V4: records; ready |
| The report counts minis as attended | V8: all three |
| "This week" counts minis | V3: attendance |
| `prefs.finisher` ignored | V4: six of eight legs |

**The 46 session readers, classified.** The plan's grep (`\.sessions\b|completedSessions\(` over `fitness/*.js` and `js/*.js`) gives 46 lines at `c7015a2` and 50 on this tree. The four new ones are `toV5`'s (W5), `mainSessions`' definition, the pick call and `coverage.js`'s header comment. Lines are this tree's.

| Class | Reader (`basalt.js` unless named) | What it decides |
|---|---|---|
| **Main only** (scheduling) | 2673 `recommendedDayType` | the rotation's next day |
| | 3084 `restDayInfo` | the rest gate, on Today and the dashboard hero |
| | 3113 `doneTodayInfo` | done-today, and tomorrow's rest |
| | 3136 `nextSession` | the next session, the calendar's projection and the banner |
| | through those: `liftOn` (3156), `run.clashFor` (10050) | the run clash note |
| **Main only, mini on its own line** (attendance) | 5977 `completedThisWeek` | the "This week" tile, + "n accessory" |
| | 5984 `completedThisPhase` | the phase card, + "Accessory sessions n" |
| | 7777 `evaluate` (`main`, from `sess`) | adherence, `sampleSize` → `closePeriod`'s `attended`, the review badge, the "Accessory sessions" row |
| **All** (history) | 4160, 4196, 4240 | the Last session card on the rest, done and ready screens |
| | 5501 `streakStripCard`, 6107 `heatStrip`, 7080 `buildCalendar` | heat strips, calendar cells |
| | 6152 (`done.length` for the first-run tips), 6687 `weeklyVolume`, 6948 notes, 7000 notes count | dashboard and progress history |
| | 7223, 7248 session log; 7303, 7313, 7328, 7343 its edit and delete | history |
| | 7451, 8094, 8272 | lifetime counts in footers |
| | `js/insights.js:177` | the Hub's volume-by-day chart |
| **All** (evidence) | 3169 `recommendFor`, 5242 `rxLinesHtml` | steps and the card's last sets |
| | 7777 `evaluate`'s `all` / `sess` for performance and recovery; 7886 the recovery sample | comparable sessions, rated and failed, block sessions |
| **All** (muscles and coverage) | `muscles.js:151`, `:158` (cache signature), `:357` (the "Worked …" toast) | the Muscles screen |
| | 2886 `Coverage.pick(s.sessions, …)` | direct sets per group for the picks |
| **All** (streaks) | 341 `recountStreak` | the BASALT streak |
| | `js/gamify.js:240` `fitnessDates`, `js/app.js:249` (re-sync when the count changes) | the Hub's fitness habit |
| **Data plumbing** (not read by kind) | 445 `toV4`, 504 `toV5`, 670–682 `healState`, 3053 `push`, 2650 `completedSessions`, 2665 `mainSessions` | |
| **Not a BASALT session** | 10195 `m.sessions` (a run week's count); comments `muscles.js:10`, `coverage.js:28` | |

PRs need no reader: `finalizeSession` checks every workout, mini included.

**Looked at by eye.** Scratch `w11_screens.py`: a main session on 1 Oct, a mini-session on 2 Oct, in Selene and Selene Day at 390 and 1920 px.
- **Measured.** Dashboard, Today (rest) and the report: 0 horizontal overflow, 0 page errors.
- **Read by eye.** The tile reads "1 · sessions · every other day · +1 accessory". The phase card reads "Accessory sessions 1 · not counted above". The report rows are "Sessions attended 1 of 1", "Accessory sessions 1" and Plan.
- **One defect, found and fixed.** The calendar's first label for a mini day, "Accessory", widened the Sat/Sun columns: the dashboard overflowed by **87 px** at 390 px. It was 0 px with no mini on this tree, and 0 px on the pre-change build. The cell label is now "Mini" (4 characters, like Push and Legs), and the overflow is 0.
- **Not new.** A mini-session's movements are all first-time PRs, so four PR toasts stack after it, and at 390 px the stack sits partly off the left edge (R2 noted the toast off-screen). That is existing toast behaviour.

**Choices the plan left open.**
1. **Records are made at finalize, not at Begin.** "On first pick" read as the first finished workout that trains a pick. A discarded draft or a preview render writes nothing. A swapped pick still makes the record at the first allowed rung, because the swap is for the day, as in main slots.
2. **`acceptedAt: null` on a coverage record**, as a carried-over slot has. Nobody chose it, so a choice made on another device wins the sync, and R1-1's `offLoad` has no cut-off.
3. **Mini-sessions sit at the base set count and never take +1 set.** The workout's `volumeMode` is "standard". The finisher's picks also sit at the base count while the main slots take +1.
4. **`setPins` is added here**, ahead of 3.5's Coverage card, because V4's "two sessions at the top" needs the same slot picked twice. Without a pin, the 48 h rule and the ranking never pick curl two sessions running (W10's V2c and V2d).
5. **Recovery stays all sessions in the report.** Effort and pain in a mini-session are still effort and pain. Only adherence is main-only.
6. **Removing a finisher pick doesn't bring in the next one** (W10's open note 7). `overrides[slot] === false` drops it, and W12 decides whether the preview should refill.

**For W12 (3.5).**
- **Finisher toggle:** write `prefs.finisher` ("on" / "off") and re-render. `buildWorkout` reads it, so Begin starts what the preview shows. Each finisher row already has a Swap button (`data-pvswap`). Removing one is `chosen.overrides[slot] = false`. Show `ex.reason` on the row.
- **Mini-session entry:** `w = engine.buildWorkout("mini", null, null, overrides, grips, { n })`, `w.dayKey = Hub.viewDate()`, then `setWorkout(w)`. That's what V3 and V8's `mini_workout` seed. Swap them for clicks once the button exists.
- **Program's Coverage card:** `engine.prescriptionFor(slot)` for every coverage slot (no record is needed), and `engine.setPins`. W8's filter that hides coverage slots in Program is still in place.
- **Active workout:** finisher exercises render after the main ones under "Main session". A "Finisher" heading is 3.5's to add.

**Not run:** the Android and desktop shells; themes other than Selene and Selene Day.

**Untracked:** the five `*.backup-20261005-205612.*` files (basalt, syncmerge, check-workout, check-syncmerge, service-worker), which Part H's `git add` excludes.

## 2026-10-05 · W12 · step 3.5 screens and close-out

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan`, on W11's uncommitted tree. Nothing committed. Run on Sonnet 5.5.

**Files.** Backups are `*.backup-20261005-212522.*` beside `basalt.js`, `basalt.css`, `muscles.js`, `css/muscles.css`, `README.md`, `service-worker.js` and `tools/check-workout.py`.
- `fitness/basalt.js`:
  - **Today, ready screen.** A *Finisher* tick (`data-finisher`) writes `prefs.finisher` at once. The preview lists the picks under a "Finisher · about +n min" heading, each with its reason, *Swap* and *Remove*. A removed pick shows an *Add back* line.
  - **Accessory session card** (`miniCardHtml`, `wireMini`): on the ready, done-today and rest screens. It lists the picks with their reasons, a 2-6 select (remembered per device in `ironframe.ui`, `mini.n`) and *Start accessory session*. With no picks it says why and has no button.
  - **Active workout.** A "Finisher" heading before the first finisher exercise, "Why this one: …" on every pick, and "Accessory session" in place of "Main session" for a mini.
  - **Program, Coverage card.** The slot-row builder is now `slotRow`, shared by the main slots and the 15 coverage slots. A coverage row shows its movement, "not started" until a first pick, the week's direct-set count for its group, *Change exercise* (works before a record exists) and *Pin to* Mon-Sun toggles. Hold and Sets & range appear once the slot has a record.
  - **Preview minutes** are now per exercise (a finisher pick at its own set count). Main-only previews are unchanged.
- `fitness/muscles.js`, `css/muscles.css`: a *Direct sets (7 d)* column, "Vs. target" renamed *Vs. your template*, *Neglected* = below the weekly floor (furthest short first, "0 of 6 direct"), a *Direct sets (7 d)* cell in the detail modal, and the floors named as product choices in the footnote. The count is `Coverage.status`, the selector's own, so the screen and the picks can't disagree.
- `fitness/basalt.css`: `.pg-pins`.
- `README.md`: the muscle-map paragraph (86 → 150 movements, 22 groups, the "no calf tile" claim removed as false), the joint-stress counts (368 scores, 161 heavy), and two new paragraphs: direct sets against a floor, and the finisher / Accessory session / Coverage card.
- `service-worker.js`: `CACHE_VERSION` v60 → v61. No new file.
- `tools/check-workout.py`: V3, V4, V8 now click (the card's button, the tick); new V7, V9, V10, V11, V12.

**Harness lines, before → after.** Cases written first and run on W11's tree.

| Case | Before | After |
|---|---|---|
| V3 | no card: saved type push, no kind; streak 1 → 1, habit false | saved mini, kind mini, curl/lateral/reardelt/cuff; rest day, next pull and attendance unchanged; streak 1 → 2, habit false → true |
| V4 | no tick: `+[]`, no records, 3 Oct picks `[]` | `+[curl, lateral, reardelt, cuff]`, 3 sets each, 4 records, pin puts curl first, ready with 2 comparable |
| V8 | rows `Accessory sessions 0` | attended 1 of 2, `Accessory sessions 2` |
| V7 | Neglected tile 16, no direct column, header "VS. TARGET" | tile **20** = the groups below floor; biceps "0 of 6", lats "9 of 3"; header "DIRECT SETS (7 D) · VS. YOUR TEMPLATE"; the detail shows the cell |
| V9 | 0 rows, no card | 15 rows; Saturday pin stored, pressed after reload; backext first with the pin; clearing leaves `{days: [], at}` |
| V10 | no tick, 0 rows | 4 picks with reasons; unticking saves off; Remove → 3 with *Add back*; Swap changes one; Begin starts the 3 kept (swap included), 1 heading, 3 reasons |
| V11 | no card on any screen | 1 start button on each of ready, done-today and rest; 4 / 2 / 6 picks by select; mini draft kind mini; empty state (1 message, 0 buttons) when every group has its floor |
| V12 | passes before and after: a **guard**, not a fix | 22 groups, "0/22 this week", an earned Balanced Build keeps its date |

| Check | Before (W11) | After |
|---|---|---|
| `check-workout.py` | 63 pass | **68 pass, 0 fail, 0 error** (read from the file's last line) |
| `check-training.js` / `check-coverage.js` | 44 PASS / 9 PASS | 44 PASS / 9 PASS, all passed |
| `check-training-data.js` / `check-muscle-map.js` / `check-androidupdate.js` | OK / OK / 17 | OK / OK / 17 passed |
| `check-syncmerge.js` | 9 pass | 9 pass |

**The cases fail where it matters.** Three planted faults in a scratch copy (`HELTH_INDEX`): Neglected back on the 7-day rule, Remove deleting the override instead of setting `false`, and the pin handler not calling `setPins`. V7, V9 and V10 each FAIL on the lines they own. V12 can't be shown to fail: it guards what W8 already did.

**By eye** (scratch `w12_screens.py`, clicks only; `evaluate` measured): Today with the finisher on and a pick removed, the active workout, Program's Coverage card, Muscles and its detail modal, in Selene and Selene Day at 390 and 1920 px. **0 horizontal overflow and 0 page errors in all 16 runs.** Two defects found and fixed: the Accessory select stretched across 1920 px, and the finisher label said "about 20 min" while the preview said +41.

**Deviations, and choices the plan left open.**
1. **No "about 20 min" claim anywhere.** The plan says a finisher is about 20 minutes; the app's own formula (2.5 min a set plus rest) gives +41 min for three picks and ~54 for four. Showing both would contradict itself, so the screen shows the formula's number. The formula overstates short isometric work, and the README says so. Yours to retune.
2. **Neglected is "below the floor" only.** "Or no direct work in 7+ days" is the same test, since every floor is above 0. After one week of rows only, **20 of 22 groups** are Neglected. That's the measurement the plan asked for, but the card is long for a new user.
3. **Removing a finisher pick doesn't pull in the next one** (W10/W11's open question). Four is a ceiling; *Add back* restores it.
4. **The mini-session starts straight from the card,** with no separate preview step: the card is the preview. A pick can be swapped in the active workout, not before.
5. **A coverage slot with no record gets *Change exercise* only.** Choosing creates its record (`why: "chosen by you"`); *Hold* and *Sets & range* need a record to edit.
6. **V9-V12 are mine;** Part F lists only V7 for this step.
7. **Badges needed no code.** They read `GROUPS.length`, so they already span 22. Their descriptions are unchanged and still true.

**Left for R3.**
- **A subagent's first report was wrong:** it called `check-workout.py` "10 PASS" and "139 passed" while the suite was at case 16 of 68. I waited for the real summary line. Quote the file, not the summary.
- **Not run:** the Android and desktop shells; themes other than Selene and Selene Day.
- **Noticed, not touched:** the Muscles "Last" column prints "-2d ago" for a session dated after the clock. My scratch fixtures caused it, not the app, but the column has no guard for future days.
- **W5-1** (a sync before the first write skips `toV5`) and **R2-1 to R2-4** are still open from earlier reviews.
- **Untracked:** the `*.backup-20261005-212522.*` files, which Part H's `git add` excludes.

## 2026-10-05 · R3 · step 3.6 review

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan`, on W12's uncommitted tree. Nothing committed: HEAD is still `c7015a2`, so `git diff` holds Stages 1–3 together (R1's entry says Stage 1 was committed; git says otherwise). The paste named "the Stage 2 diff"; this window reviewed Stage 3, the plan's 3.6, with W8–W12's backups as the before. No code changed by this window. Run on Opus 5.5. Scratch probes (`r3_probes.py`, `r3_screens.py`) and screenshots are in this session's scratchpad.

**Harnesses, re-run on this tree** (a test-runner subagent wrote the output files; counts read from the files).

| Check | Result |
|---|---|
| `check-workout.py` | **68 pass, 0 fail, 0 error**, exit 0 (V3, V4, V5, V7–V12 PASS) |
| `check-training.js` | all passed, 44 PASS |
| `check-coverage.js` | all passed, 9 PASS (V2a–V2i) |
| `check-syncmerge.js` | 9 pass, 0 fail (V6 PASS) |
| `check-training-data.js` | OK: 150 exercises, 15 coverage slots, 64 exercises; 368 joint scores, 161 of them 2 |
| `check-muscle-map.js` | OK: 150 exercises, 22 groups, each with a primary (V1) |
| `check-androidupdate.js` | 17 passed |

**Findings, each reproduced by clicks against this tree.**

### R3-1 · DESIGN RISK (medium): none of the 64 coverage exercises can take a pain flag or be skipped
`openFlagPanel` (`fitness/basalt.js:5085`) reads `DB.bodyPartsFor(ex.pattern)`, and `SUBSTITUTIONS` has no `accessory` key. Before Stage 3 only skill entries lacked a map, and they never sit in a workout.
- **By clicks:** finisher on, Begin, *Flag* on Door-Frame Curl → "No substitution map for this pattern — rest if needed." *Flag* on Push-up in the same workout → Wrist / Shoulder / Elbow, Mild / Moderate / Sharp. 0 page errors.
- **Effect:** pain in a finisher or Accessory session never reaches `flagsHistory` or the report's recovery count, and *Skip it today* doesn't exist for it. That includes the neck slot, whose own copy says "stop at dizziness, pain or tingling".
- **Smallest fix (not applied):** when a pattern has no map, the panel offers *Skip it today* with the body part from the exercise's joint-stress row, instead of returning. That's one branch in one function, so skills get it too. A full `SUBSTITUTIONS.accessory` map is the larger option.

### R3-2 · INCONSISTENCY (low): a pick with no logged set still gets a coverage record
The record loop in `finalizeSession` (`basalt.js` ~2992) walks every session exercise of a coverage slot. Its comment says "the first time a finished workout **trains** one of its picks".
- **By clicks:** finisher on, one main set logged, 0 sets on all four picks, Complete → records for curl, lateral, reardelt and cuff, all "added for coverage". Program's curl row now reads "0 of 2 at 3 × 15", not "not started". 0 page errors.
- **Effect:** cosmetic today. The record is the first rung either way, but *Hold* and *Sets & range* appear for slots you never trained.
- **Smallest fix (not applied):** skip an exercise that is `engine.skipped` or has no set above 0, in that loop.

### R3-3 · INCONSISTENCY (low): the Coverage card says "Needs equipment you don't have" for a slot your joint limit blocks
`slotRow` falls back to `SLOTS[slot].none || "Needs equipment you don't have"` when `prescriptionFor` returns null. On a coverage slot with no record, the status line is replaced with "not started", which hides `slotStatus`'s reason.
- **By clicks:** Settings → Neck *avoid* → Save → Program. The neck row reads "Needs equipment you don't have · not started — the first finisher or accessory session that picks it starts it", with *Pin to* still offered. `prescriptionFor("neck")` is null; the picker correctly says "avoiding your neck" on all three rungs.
- **Effect:** a wrong reason, and a promise that the slot will start when it never can.
- **Smallest fix (not applied):** when `cov && !rx`, name the reason from `Training.blocked` on the slot's first rung, as `slotStatus` already does for main slots.

### R3-4 · COSMETIC (low): "What today works" counts a finisher pick you removed
`muscles.js` `previewExercises` rebuilds the workout from prefs, so it can't see `chosen.overrides`. The comment already accepts that for swaps; a removal is new, because it shows a muscle that won't be trained at all.
- **By clicks:** finisher on, *Remove* Door-Frame Curl → the strip still lists **Biceps 13%** (screenshot, Selene Day, 390 px).
- **Fix:** accept it, or have Today pass its built workout to the strip. Not one line, so I'd accept it.

### R3-5 · COSMETIC (low): the README's floor sentence is false for quads
"6 for the groups only coverage work reaches": quads are a primary mover on 12 main exercises, hamstrings on 5, forearms on 3, biceps and side delts on 1 each (Node over `muscles.data.js`). **Fix:** "6 for the 12 groups a coverage slot tops up", the plan's wording.

**Checked, nothing found.**
- **Screens:** Nostromo, Selene Day and Chernobyl × 390 and 1920 px. Done-today and rest with the Accessory card, ready with the finisher on and one pick removed, the active workout, Program's Coverage card, Muscles and the dashboard all measured `scrollWidth` equal to the viewport, with 0 page errors in all 6 runs. Coverage card and ready screen read by eye at 390 px. The Coverage card is long (15 rows, 7 pin buttons each), but nothing is clipped.
- **A mini-session first on a training day:** Push stays up, with Begin shown and the next session still 1 Oct.
- **Plumbing:** the neck safety line is on all three neck entries. `fitness/coverage.js` is in `index.html` and `PRECACHE`, and `CACHE_VERSION` is v61. Pins merge by `at`.
- **Session readers:** `buildWorkout`'s other callers are `muscles.js`'s strip (R3-4) and Preview all days (`finisher: false`).

**Carried open, not re-run here:** W5-1, and R2-1 to R2-4.

**Not run:** the Android and desktop shells.

## 2026-10-05 · R3 fixes · R3-1, R3-2, R3-3, R3-5 applied

**Where.** The same session as R3, at your request ("apply fixes"), on the same uncommitted tree. Nothing committed.

**Files.** Backups are `*.backup-20261005-222115.*` beside each file.
- `fitness/basalt.js`:
  - **R3-1.** `openFlagPanel`: an exercise with no swap list (all 64 coverage movements) now lists the joints it loads, from `JOINT_STRESS`, else every joint. Mild and moderate read *Flag it*: the pain is recorded and the sets aren't evidence. Sharp reads *Skip it today*. The toast says which.
  - **R3-1, the same class.** A `flagsHistory` id was `f_<time>_<pattern>`. Every coverage movement shares the pattern `accessory`, so two flags in one session got one id, and a sync unions flags by id. The id now carries the exercise's position.
  - **R3-2.** `finalizeSession` makes a coverage record only for a pick with a set above 0 that wasn't skipped.
  - **R3-3.** `engine.unavailableReason(slot)` returns what blocks the slot's own movement, else its first rung. `ui.noneText` words it, and both `slotStatus` and Program's rows use it. The class was wider than the Coverage card: main slots also said "needs equipment you don't have" whatever the reason. A coverage slot with nothing allowed reads "never picked while nothing here is allowed". A status line that only repeats the row's name is dropped; that doubling already happened in the equipment case.
- `README.md` (R3-5): "3 for the seven groups only your main slots train, 6 for the twelve a coverage slot tops up (quads among them, which squats also reach)".
- `service-worker.js`: `CACHE_VERSION` v61 → v62.
- `tools/check-workout.py`: R3a, R3b, R3c, the `finisher_begun` helper, and a header line.

**R3-4 not applied,** as recommended: the strip can't see the preview's removals without passing the built workout across modules.

**Harness lines, before → after.** The cases were written first.

| Case | Before | After |
|---|---|---|
| R3a | parts `[]`, no button, no flags, history `[]` | parts wrist, elbow; *Flag it*; mild kept, sharp skipped; both in history, ids distinct |
| R3b | records cuff, curl, lateral, reardelt (one pick trained) | records **curl** only |
| R3c | "Needs equipment you don't have … starts it" | "Avoiding your neck — no movement here you allow · never picked while nothing here is allowed" |

**Planted fault:** the old flag id in a scratch copy of the page (`HELTH_INDEX`) makes R3a FAIL on "ids distinct False" alone.

| Check | Result (final tree, read from the output files) |
|---|---|
| `check-workout.py` | **71 pass, 0 fail, 0 error**, exit 0 |
| `check-training.js` / `check-coverage.js` | all passed, 44 PASS / all passed, 9 PASS |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK |
| `check-syncmerge.js` / `check-androidupdate.js` | 9 pass / 17 passed |

**By eye:** the coverage flag panel and the neck row in Nostromo at 390 px, 0 overflow, 0 page errors. A recorded neck slot under *avoid* also reads "avoiding your neck" once (probe, not a case).

**Noted, not touched:** a scratch copy of the whole repo filled `/tmp`, because `src-tauri/` is 12 GB. Copy only `index.html`, `css`, `js`, `fitness` and `vendor` for `HELTH_INDEX` runs.

**Untracked:** the four `*.backup-20261005-222115.*` files, which Part H's `git add` excludes.

## 2026-10-05 · W13 · step 4.1 body-map asset

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan` at `da63ab1` (Stage 3 committed). Nothing committed. Run on Opus 5.5. The source clone, scratch renderers and screenshots are in this session's scratchpad, not the repo.

**Source.** `react-native-body-highlighter` (MIT, © 2022 ELABBASSI Hicham), pinned at **`8ed39ac2ae9cb46fb79d77eedec7e5b029a75174`** (master, 2026-09-13). Used: `assets/bodyFront.ts`, `assets/bodyBack.ts` and the two outline paths in `components/SvgMaleWrapper.tsx`.

**Files.** Backups are `*.backup-20261005-225213.*` beside `index.html` and `service-worker.js`. The four new files have no backup.
- `fitness/bodymap.data.js` (new, 65 KB, generated): `window.BODY_MAP = { source, viewBox, front, back, outline }`.
  - `front` and `back` are `[{ id, group, d }]`: 29 front and 30 back regions, one per group and body side, ids like `f-delts_front-l`.
  - `viewBox` holds one box per view, in source units, trimmed to the figure plus 8.
  - `outline` per view is `{ body, parts }`: the silhouette, plus the head, hair, hands, feet, knees and ankles (44 shapes). They're drawn and never tappable.
- `vendor/LICENSES/react-native-body-highlighter.txt` (new): the MIT text verbatim, under a line naming the repo, the commit and the three files.
- `tools/build-bodymap.py` (new): rebuilds both outputs from a clone at the pinned commit, and refuses any other commit. It uses Python Playwright (Chromium measures the curves), so it adds no dependency. Two runs give byte-identical output.
- `tools/check-bodymap.js` (new): case D1.
- `index.html`: a script tag after `coverage.js`. `service-worker.js`: the file added to `PRECACHE`, `CACHE_VERSION` v62 → v63 (rule 8). Nothing reads `BODY_MAP` yet; W14 does.

**Mapping to the 22 groups.**

| Group(s) | From the source | How |
|---|---|---|
| front delts / side delts | front `deltoids` | cut by a line, (240, 300) → (210, 398): the medial piece is front, the lateral strip side |
| rear delts / side delts | back `deltoids` | cut by a line, (934, 300) → (926, 400): the medial piece is rear, the lateral strip side |
| traps / upper back | back `trapezius` | cut at y = 340: above is traps (what a shrug trains), below is the middle and lower fibres (upper back) |
| rotator cuff / upper back / lats | back `upper-back`, three shapes per side | by position, top to bottom: the shape on the shoulder blade (infraspinatus) is rotator cuff, the crescent under it (teres major) is upper back, the big one is lats |
| abductors / glutes | back `gluteal`, two shapes per side | the upper one (gluteus medius) is abductors |
| the other 14 | one slug each | `trapezius` front → traps, `tibialis` → shins, `quadriceps` → quads, and so on |

The right side of each figure is cut by the mirror image of the left's line, and every cut leaves a 4-unit gutter like the source's own.

**Harness lines.**

| Check | Before | After |
|---|---|---|
| `check-bodymap.js` | first run, before the wiring: **paths FAIL** (2 outline parts "outside the box"), **shipped FAIL** (no script tag, no PRECACHE entry), exit 1 | **all passed**: 59 regions, 22 groups, 105 paths parse inside their box, licence and commit present, shipped |
| `check-workout.py` | 71 pass (R3 fixes) | **71 pass, 0 fail, 0 error**, exit 0 |
| `check-training.js` / `check-coverage.js` | 44 PASS / 9 PASS | all passed, 44 PASS / all passed, 9 PASS |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK | OK / OK |
| `check-syncmerge.js` / `check-androidupdate.js` | 9 pass / 17 passed | 9 pass / 17 passed |

A test-runner subagent ran the full suite. I read the eight output files myself and took the counts from them. The paths FAIL was a harness defect, not bad data. The box bound put a full radius around every arc, and the source draws near-flat arcs with radius 910, which threw the box out to −701. A small arc now counts as bulging at most half its chord. After the suite, a comment-only regeneration landed; the map's JSON is identical to the tested one (compared in Node), and `check-bodymap.js` still passes.

**The check can fail.** Six faults planted in scratch copies (`BODYMAP_JS=`), each exiting 1 on its own line:

| Fault | What failed |
|---|---|
| Biceps renamed `bicep` | groups |
| A duplicate id | ids |
| A truncated path | paths: "'c' needs 6 values" |
| An arc flag of 2 | paths |
| A back shape added to the front view | paths: outside the box |
| The SHA changed | licence |

**Screens.** There is one scratch screenshot per group, alone, in Selene and Selene Day at 390 px: 44 shots, 0 page errors, 0 horizontal overflow. They used a scratch renderer on the app's palette tokens, not W14's component. Every group lights up where it should in both themes. Measured at 390 px, each figure is 175 × 344 px.

**Regions that look wrong, or will be hard to use.**

| Region | Problem |
|---|---|
| Side delts | A strip on both views: bounding box 11 × 23 px at 390 px, and the back strip is about 3 px wide. You can see it, but you can't tap it |
| **Every group** | Under 24 px in at least one dimension at 390 px. The smallest are shins 10 × 62, traps 21 × 11 and biceps 11 × 24; the largest is upper back 34 × 36. W14's tap-to-list needs a fallback: a group list, or hit areas larger than the shapes |
| Lower back | Includes two small shapes above the hips that sit where quadratus lumborum and the posterior obliques are. This is the source's call, kept |
| Upper back | The lower trapezius plus teres major. The rhomboids sit under the trapezius and aren't drawn |
| Rotator cuff | Infraspinatus only. Supraspinatus and subscapularis can't be seen from behind |
| Abductors | Back view only (gluteus medius). The source draws no TFL on the front |
| Front-view triceps | The inner-arm strip next to the biceps. This is the source's call |

**Deviations from the plan, and why.**
1. **Rotator cuff reuses the source's shape on the shoulder blade** instead of a newly drawn region. The source's `upper-back` already holds that shape separately, so reusing it involves no new drawing and no overlap.
2. **Upper back isn't cut from the source's `upper-back`.** It's the teres crescent plus the lower part of the trapezius. Plan E1 said "upper-back → lats and upper back", but that slug's big shape is the whole lat, and the area between the shoulder blades is drawn as trapezius.
3. **The source has no abductor region.** Plan E1's table assumed one (`react-body-highlighter` has one; this repo doesn't). The upper gluteal shape is used instead.
4. **The male figure only.** The same commit has a female figure (`bodyFemaleFront.ts`, `bodyFemaleBack.ts`), and BASALT's profile has a `sex` field (`basalt.js:119`). Under the identity-picks-defaults rule, the figure should follow that field. The plan's data shape holds one figure, and adding the second means re-doing the cuts on its geometry. That's a decision for you, and it would go in W14 or later.
5. **A generator is checked in** (`tools/build-bodymap.py`). The plan only asked for the data. Without the script, the cuts would be hand edits to 65 KB of path data that nobody could redo or move.
6. **Cut pieces are polygons, not curves.** They're sampled every 1.5 units and simplified to within 0.35 units, which is well under a pixel at any size the app draws.
7. **The licence file isn't in `PRECACHE`.** The page never loads it. W14's credit line can link to it.

**For W14.** `BODY_MAP.viewBox[view]` is per view (the back view's x runs from about 761). Draw `outline[view].body` and `.parts` as non-interactive shapes, then the regions. Several ids share a group, so colour by `group`. The credit line and the licence link are W14's. Tap targets are the open problem (above).

**Not run:** the Android and desktop shells; themes other than Selene and Selene Day; the map inside the app (no screen renders it yet).

**Untracked:** the two `*.backup-20261005-225213.*` files, which Part H's `git add` excludes. The four new files are untracked and *are* included.

## 2026-10-05 · W14 · step 4.2 body-map component and its two placements

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan` at `da63ab1`, on W13's uncommitted tree. Nothing committed. Run on Sonnet 5.5. Scratch scripts and screenshots are in this session's scratchpad.

**Files.** Backups are `*.backup-20261005-231037.*` beside each file (`css/muscles.backup-20261005-231336.css` for the stylesheet).
- `fitness/bodymap.js` (new, ~170 lines): `App.bodymap.render(host, spec, opts)` per plan E1.
  - `{ mode: "tiers", profile }` or `{ mode: "heat", values }`, with `opts.onTap(group)`.
  - Front and back SVGs, a legend, and a credit line naming the repo, the licence and the cuts.
  - A tappable map adds a transparent 14 px hit pad under every region, so a region always wins the area it fills.
- `fitness/phases.js`: exports `opacityFor` and `tier` on `App.phases` (one definition of what "secondary" looks like). `renderStatic` draws the map in tiers above its bars.
- `fitness/muscles.js`: a *Last 7 days* card between the tiles and the table, the heat map beside a *Furthest below the floor* list (six buttons that open the same detail modal).
- `fitness/basalt.css` (`.bm-*`, `.phz-map`), `css/muscles.css` (`.ms-map`, `.ms-gap*`).
- `index.html` (script tag after `phases.js`), `service-worker.js` (`PRECACHE` entry, `CACHE_VERSION` v63 → v64).
- `tools/check-workout.py`: B1, B2, B3 and a header block.

**Harness lines, before → after.** The cases were written first and run against a scratch copy of the pre-change tree (backups restored, no `bodymap.js`).

| Case | Before | After |
|---|---|---|
| B1 guide modal, Wall Push-up (no phases) | FAIL: 0 figures, 0 lit groups. The phased movement (Pike Push-up) has 5 tabs either way | PASS: 2 figures; lit abs, chest, front delts, triceps = the profile exactly, each labelled with its tier; 4 text rows kept; the phased movement keeps its tabs and gets no map |
| B2 Muscles, 3 sessions of rows | FAIL: no body map | PASS: lit lats ("9 of 3 direct sets, 7 d") and upper back; biceps unlit ("0 of 6"); a click on lats and Enter on biceps open their detail modals; one tab stop per group and view |
| B3 390 and 1920 px × Selene, Selene Day | FAIL: no body map, all four runs | PASS: 0 overflow in all four, figures 153 × 301 at 390 and 230 × 452 at 1920, map left and list right at 1920 |

| Check | Result |
|---|---|
| `check-workout.py` (full, read from the output file) | **74 pass, 0 fail, 0 error**, exit 0 (71 + B1–B3) |
| `check-training.js` / `check-coverage.js` | all passed / all passed |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK |
| `check-syncmerge.js` / `check-androidupdate.js` | 9 pass / 17 passed |
| `check-bodymap.js` | all passed (the script tag and `PRECACHE` entry are found) |

A test-runner subagent ran the suite and reported "8 of 8 passed" before its Playwright run had finished; its output file held 3 cases at that point. I took the counts from the finished files, not from that report. After the run I narrowed one grid column (below) and re-ran B1–B3, which pass.

**A defect found by the first B2 run, fixed before the numbers above.** A heat value of 0 was drawn as a faint grey-fill region labelled lit, so all 22 groups counted as lit. A zero now has its label ("Biceps — 0 of 6 direct sets, 7 d") and the unlit style.

**By eye.** Muscles at 390, 1440 and 1920 px and the guide modal at 390, in Selene and Selene Day: 0 page errors, 0 horizontal overflow. The first Muscles layout was a 1,300 px card with a 480 px map in its middle, so the list beside the map was added (layout rule in `memory.md`). The guide modal's host is 268 px wide at 390, so the two figures stacked at 150 px minimum; the minimum is now 120 px and they sit side by side at 128 px.

**Hit pads, measured at 390 px** (scratch probe, bounding-box sampling, not a harness case). A point 4 px outside the edge still resolves to the same group's pad for 19 of 22 groups; lats, obliques and part of triceps read lower because the sampled point lands on a neighbour or a gap. Pad hits are not tested by clicking.

**Deviations from the plan, and choices it left open.**
1. **The guide modal keeps its tier bars under the map.** Plan E1 says the map replaces the static fallback. The bars stay as the text list: colour alone can't say "secondary", and the 9–30 px shapes can't be read at 390 px.
2. **No group chip list inside `bodymap.js`.** W13 asked for a fallback for the small shapes. On Muscles the table and the new gaps list are the fallback. **W20 (the directory) must supply its own**, such as the muscle filter, because the map there is also tappable.
3. **The heat map's value is direct sets ÷ weekly floor, capped at 1**, not the template-relative work. The template column is circular (F7), and this is the number *Neglected* uses. It ignores the 7/30-day selector, and the card says so.
4. **Non-interactive regions aren't focusable.** Plan E1 says every region can be focused. Only tappable maps are: one tab stop per group and view (left and right are the same group). Every region carries an `aria-label`; unlit ones in a non-tappable map are `aria-hidden`.
5. **The credit line is text, with no link to the licence file.** A link to a `.txt` in the Android WebView has no back path. The file stays out of `PRECACHE`.
6. **API additions:** `spec.label(group, value)` and `spec.legend` on heat mode, for the aria text and the end labels. The plan's shape is unchanged.
7. **The male figure only**, as in W13 (its deviation 4 is still your decision).

**Left for W15 and later.**
- `App.bodymap.render` is ready for the directory's exercise page (tiers) and `onTap` (muscle filter).
- Not run: the Android and desktop shells; themes other than Selene and Selene Day; the offline install of the new file (D7 belongs to 4.8).

**Untracked:** the new `*.backup-20261005-231037.*` and `css/muscles.backup-20261005-231336.css` files, which Part H's `git add` excludes. `fitness/bodymap.js` is new and *is* included.

## 2026-10-06 · W15 · step 4.3 guide schema, style guide, checker and 12 exemplars

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan` at `da63ab1`, on W14's uncommitted tree. Nothing committed. Run on Opus 5.5. Scratch scripts (`plant.py`, `w15_page.py`) and suite output are in this session's scratchpad.

**Files.** Backups are `*.backup-20261006-003650.*` beside `index.html` and `service-worker.js`. The new files have no backup.
- `fitness/content/STYLE.md` (new): the schema table, the ten style rules, the batch-file shape and the batch → slot map. Each rule says whether the checker enforces it.
- `fitness/content/batch-a.js` (new, 4 guides): Push-up and Incline Push-up, each with a knuckles section; Pike Push-up; Parallel Bar Dip.
- `fitness/content/batch-b.js` (new, 8 guides): Pull-up, Table / Door-Edge Row, Bodyweight Squat, Bulgarian Split Squat, Hip Thrust, Nordic Curl Negative, Plank, Dumbbell Romanian Deadlift.
- `fitness/content/batch-c1.js`, `batch-c2.js` (new, empty, `"pending"`).
- `tools/check-exercise-content.js` (new): case D2.
- `index.html`: four script tags after `bodymap.data.js`. `service-worker.js`: four `PRECACHE` entries, `CACHE_VERSION` v64 → v65.

**The schema, as built.** `window.EXERCISE_CONTENT[id] = { summary, setup[], steps[], breathing, tempo, feel: { should, shouldnt }, mistakes: [{ mistake, fix }], safety[], variations?: { grip?: { knuckles: [] }, alternatives?: [{ id, text }] } }`. Bounds are in `STYLE.md` and the checker. Each batch file marks itself with `window.EXERCISE_CONTENT_BATCHES.<batch> = "pending" | "complete"`.

**Harness lines, before → after.** The checker was written first and run before any content existed.

| Check | Before | After (final tree) |
|---|---|---|
| `check-exercise-content.js` | **files FAIL** (4 batch files missing), **shipped FAIL** (no script tags, no `PRECACHE`), exit 1 | **all passed**: 12 of 150 (a 4/39, b 8/47, c1 0/29, c2 0/35, all pending); 235 strings, 14 banned patterns, 0 hits; 2 grip sections; 4 alternatives resolve; shipped |
| `check-workout.py` | 74 pass (W14) | **74 pass, 0 fail, 0 error** (read from the file's last line) |
| `check-training.js` / `check-coverage.js` / `check-bodymap.js` | all passed ×3 | all passed ×3 |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK | OK / OK |
| `check-syncmerge.js` / `check-androidupdate.js` | 9 pass / 17 passed | 9 pass, 0 fail / 17 passed, 0 failed |

A test-runner subagent ran the suite and reported back while `check-workout.py` was still at case 65, so I waited for the file's summary line myself. Three wording edits to `batch-a.js` and `batch-b.js` landed during that run (below). Afterwards I re-ran `check-exercise-content.js` and the page probe on the final tree: all passed, and 0 page errors.

**In the page** (scratch `w15_page.py`, not a harness case; `evaluate` reads globals only). At 390 and 1920 px: `EXERCISE_CONTENT` holds the 12 ids, all four batches read `"pending"`, Push-up has its grip section, `scrollWidth` equals the viewport, and there were **0 page errors**. Nothing renders the guides yet; W20 does.

**The checker can fail.** I planted 13 faults in scratch copies (`CONTENT_DIR=`), one at a time. Each exits 1 on the check that owns it:

| Fault | Fails |
|---|---|
| "12 reps" in a step · "prevents injury" · "12 inches" · "Advance once" · "3 s" in tempo | phrases (each named) |
| A grip section on Parallel Bar Dip · Incline's knuckles section renamed · an unknown alternative id | variations |
| A push guide written in batch-b | placement (and variations: it lacks knuckles) |
| `tempo` misspelled | fields: unknown field, `tempo` missing |
| A sentence without a full stop | fields |
| Batch A marked complete at 4 of 39 | coverage, naming the 35 missing |
| A neck guide without dizziness or tingling | safety |

**Deviations, and choices the plan left open.**
1. **The style guide is a file, `fitness/content/STYLE.md`,** not precached and not loaded. Plan E2 lists only the four batch files, but W16–W19 need the rules written down somewhere they will read.
2. **Coverage is per batch, with a pending or complete flag in each batch file.** The plan's D2 (every id covered) is the end state, so it can't pass at 4.3. W8 solved the same problem with a `PENDING` list inside the check, but here that list would be one shared file edited by four windows. Instead each batch flips its own flag, so W16–W19 still each write **only their own file**. A pending batch with every guide written fails, so a window can't forget the flag. **D2 is met when all four read `"complete"`.**
3. **The checker owns the batch → slot map** (plan E2's counts: 39 / 47 / 29 / 35, measured as 150 in total). Skill-kind entries count in their slot's batch: 5 in push, 4 in row, 4 in shoulder, 4 in core.
4. **Prescriptions are banned by pattern:** digits or number words with reps, sets or seconds, any digit time, "sets of", and "advance / progress / step up at·when·once". Tempo is therefore written in words ("about two seconds down"). That catches restated rules but would also block a harmless "2 s pause". I chose to block, to keep one source for every number.
5. **`variations.grip` is required on every grip-capable id,** not just allowed. C1 says each capable exercise gets a knuckles section. `alternatives` is for sideways swaps only, so the ladder's easier and harder moves aren't duplicated. I used it on 4 exemplars: Push-up → Wide, Table Row → Towel Door Row, Bodyweight Squat → Narrow-Stance, Dumbbell RDL → Single-Leg RDL with Dumbbell.
6. **The neck safety rule is checked** (slow, dizziness, tingling), from plan D2's neck copy. No neck guide exists yet; a planted one proves the check fails.
7. **Three lines changed after the first pass**, on a re-read against the cues:
   - The knuckles note claimed why the app ranks knuckles harder; it now states only the geometry.
   - Pike Push-up's lockout said "shoulders toward your ears", which contradicted "keep the neck long"; it now says "back over your hands", as the cue does.
   - Plank had an advice line in `safety`; it is now a stop sign.

**For W16–W19.** Read `STYLE.md`, then the exemplars in your batch file, which are the bar. Write only your own `batch-*.js`, set it to `"complete"` in the edit that writes your last guide, and run `node tools/check-exercise-content.js`. The checker can't read for originality or for consistency with `EXERCISE_DB` cues, so say in your entry where a cue looked wrong instead of contradicting it. W18 writes the three neck guides with the safety copy.

**Not run:** the Android and desktop shells; themes (no screen changed); D7 offline (step 4.8).

**Untracked:** the two `*.backup-20261006-003650.*` files, which Part H's `git add` excludes. `fitness/content/` and `tools/check-exercise-content.js` are new and *are* included.

## 2026-10-06 · W16 · step 4.4 guide batch A (push, shoulder, dip)

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan` at `da63ab1`, on W15's uncommitted tree. Nothing committed. Run on Sonnet 5.5. Scratch scripts (`dump2.js`, `p1.js`–`p3.js`, `w16_page.py`) and the `check-workout.py` output are in this session's scratchpad.

**Files.** Backups are `fitness/content/batch-a.backup-20261006-012606.js` and `service-worker.backup-20261006-012927.js`.
- `fitness/content/batch-a.js` (+35 guides, 4 → 39): by slot, push 18 (13 exercises plus 5 planche skills), shoulder 10 (6 plus 4 handstand skills), dip 7 (5 plus 2 chair variants). Flag flipped `"pending"` → `"complete"` in the same edit. The four W15 exemplars are untouched.
- `service-worker.js`: `CACHE_VERSION` v65 → v66, since a precached file changed.
- No other file edited. `batch-b.js`, `batch-c1.js`, `batch-c2.js`, `STYLE.md` and the checker are as W15 left them.

**Harness lines, before → after.**

| Check | Before (W15's tree) | After |
|---|---|---|
| `check-exercise-content.js` coverage | 12 of 150, `a 4/39 pending` | **47 of 150, `a 39/39 complete`** (b 8/47, c1 0/29, c2 0/35 still pending) |
| same, fields / phrases | 235 strings, 0 hits | **870 strings, 14 banned patterns, 0 hits** |
| same, variations | 2 grip sections, 4 alternatives | **6 grip sections** (push_2, push_incline, push_1, push_4, push_alt_wide, push_alt_negative), 4 alternatives, all resolve |
| same, overall | all passed | **all passed** (first run, no fix loop) |
| `check-workout.py` | 74 pass | **74 pass, 0 fail, 0 error**, read from the file's last line |
| `check-training.js` / `check-coverage.js` / `check-bodymap.js` | all passed ×3 | all passed ×3 |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK | OK / OK |
| `check-syncmerge.js` / `check-androidupdate.js` | 9 pass / 17 passed | 9 pass, 0 fail / 17 passed, 0 failed |

I ran every Node check and `check-workout.py` myself, because the test-runner subagent went 20 minutes with no process alive and I stopped waiting; its later report agreed (all clean, 74 pass).

**In the page** (scratch `w16_page.py`, not a harness case). At 390 and 1920 px: `EXERCISE_CONTENT` holds 47 ids, batch states are `a: complete, b/c1/c2: pending`, `scrollWidth` equals the viewport, **0 page errors**. Nothing renders the guides yet; W20 does.

**Review pass after the first green run.** The checker can't read for sense, so I re-read the 35 against their `EXERCISE_DB` cues and fixed nine lines (two unclear mistake fixes, a dip depth line that made no sense, Planche Lean's hand position, which contradicted the cue, a "your coach" line in Wall Handstand Hold, a Scapular Push-up safety line that suggested knuckles on an exercise that takes no grip, a protective-sounding phrase in Chest-to-Wall Handstand, and splitting Dumbbell Press's two-idea mistake per rule 10). Checker re-run after: all passed.

**Deviations and choices.**
1. **Push-up knuckles on the wall version.** Wall Push-up is grip-capable, so the checker demands a knuckles section. Pressing bare knuckles into a wall makes little sense, so it says to hang a folded towel on the wall first and stand slightly further back. Say if you'd rather drop `push_1` from `GRIPS.exercises`; that's a data change outside this step.
2. **Skill-kind holds use steps as enter, hold, exit** rather than one rep. Hold times are left to the app, as the style guide requires.
3. **Tempo words stay inside the checker's patterns.** "Four to five seconds" appears once (Negative Push-up) because its cue says the same; "about two seconds" elsewhere. Neither is a digit.

**Cues that look wrong or loose (not contradicted in the guides).**
- `push_e2_weighted` cue says "Press explosively", while the exercise is a loaded slow-strength lift. The guide says "press up with intent" and "without jerking".
- `shoulder_3` cue says "chest facing the wall (or back to it)" without saying which suits a beginner; the guide leans toward chest-to-wall.
- `push_alt_scapula` injury note ("protects the joint") is a protective claim the style guide would reject; the guide doesn't repeat it.
- `shoulder_2` cue says "Press up powerfully", a banned hype word in guides; the guide avoids it.

**Not confirmed.** Originality of wording (no source was open while writing, but nobody has compared it against any). Anatomical and coaching accuracy of the six planche and four handstand guides, which I wrote from the cues and general knowledge, not from a coach; a reviewer should read those first.

**Not run:** the Android and desktop shells; themes (no screen changed); D7 offline (step 4.8).

**Untracked:** `batch-a.backup-20261006-012606.js` and `service-worker.backup-20261006-012927.js`, which Part H's `git add` excludes.

**For W17–W19.** Same recipe: write only your own `batch-*.js`, flip your flag in the edit that writes your last guide, run the checker. `STYLE.md` and the exemplars hold; I found nothing to change in them.

## 2026-10-06 · W17 · step 4.5 guide batch B (row, pull, squat, hinge, core)

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan` at `da63ab1`, on W16's uncommitted tree. Nothing committed. Run on Sonnet 5.5. Scratch scripts (`dumpb.js`, `w17_page.py`), the draft parts and the suite output are in this session's scratchpad.

**Files.** Backups are `fitness/content/batch-b.backup-20261006-021152.js` and `service-worker.backup-20261006-021332.js`.
- `fitness/content/batch-b.js` (+39 guides, 8 → 47): row 8 (4 exercises plus 4 front-lever skills), pull 7, squat 10, hinge 5, core 9 (5 plus 4 L-sit and V-sit skills). Flag flipped `"pending"` → `"complete"` in the same edit. The eight W15 exemplars are untouched.
- `service-worker.js`: `CACHE_VERSION` v66 → v67, since a precached file changed.
- No other file edited. `batch-a.js`, `batch-c1.js`, `batch-c2.js`, `STYLE.md` and the checker are as W16 left them.

**Harness lines, before → after.**

| Check | Before (W16's tree, run first) | After |
|---|---|---|
| `check-exercise-content.js` coverage | 47 of 150, `b 8/47 pending` | **86 of 150, `b 47/47 complete`** (c1 0/29, c2 0/35 still pending) |
| same, fields / phrases | 870 strings, 0 hits | **1574 strings, 14 banned patterns, 0 hits** |
| same, variations | 6 grip sections, 4 alternatives | 6 grip sections (none new: no batch-B exercise takes a grip), **11 alternatives**, all resolve |
| same, overall | all passed | **all passed** (first run, no fix loop) |
| `check-workout.py` | 74 pass | **74 pass, 0 fail, 0 error**, read from the file's last line (a test-runner subagent ran it, 16 min) |
| `check-training.js` / `check-coverage.js` / `check-bodymap.js` | all passed ×3 | all passed ×3 |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK | OK / OK |
| `check-syncmerge.js` / `check-androidupdate.js` | 9 pass / 17 passed | 9 pass, 0 fail / 17 passed, 0 failed |

**In the page** (scratch `w17_page.py`, not a harness case). At 390 and 1920 px: `EXERCISE_CONTENT` holds 86 ids, batch states are `a, b: complete; c1, c2: pending`, `scrollWidth` equals the viewport, **0 page errors**. Nothing renders the guides yet; W20 does.

**The completeness check can fail.** Three planted faults in a scratch copy: a guide id renamed (placement FAIL: not an exercise; coverage FAIL: "marked complete but lacks core_6"), and "30 seconds" in a breathing line (phrases FAIL). The repo copy exits 0.

**Review pass after the first green run.** The checker can't read for sense, so I re-read the 39 against their `EXERCISE_DB` cues and changed two lines: Passive Hang said to hold "until your grip starts to tire", which competes with the app's hold rule, so it now says to hold until the end of the hold; and L-Sit's third setup line duplicated step 1, so it now says to warm up wrists and hip flexors. Checker re-run after: all passed.

**Deviations and choices.**
1. **Skill-kind holds use steps as enter, hold, exit**, as W16 did. Hold times are left to the app.
2. **Tuck L-Sit (`core_3`) and L-Sit (`core_4`) duplicate `skill_lsit_2` and `skill_lsit_3` in movement.** The DB lists them as separate ids, so each has its own guide, worded differently but teaching the same position.
3. **Alternatives added on 7 guides** (towel row, Australian row, bent-over row, one-arm row, dead hang, narrow squat, kettlebell swing), all sideways swaps.

**Cues that look wrong or loose (not contradicted in the guides).**
- `core_2` (Hollow Body Hold) says to "lower the arms/legs to make it easier, raise them to make it harder". That looks backwards: a lower leg angle lengthens the lever and is harder. The guide says to bend the knees or raise the legs slightly if your lower back lifts.
- `pull_alt_towel` says "feet either side of the door", which doesn't fit a closed, latched door. The guide uses the safer reading: a door that opens away from you, so the pull presses it into its frame. Worth a look on a real door.
- `core_5` says "grip behind your head for an anchor" without naming what you grip. The guide says the bench behind your head.
- `squat_2` and `pull_3` cues state hold and lowering times in digits, which the guides can't repeat; they say "about two seconds" or "as slowly as you can control".
- `hinge_e2_swing` cue says "explosively", `pull_2`, `squat_2` and `pull_alt_passivehang` injury lines make protective claims ("protects", "decompress"); the guides repeat neither.

**Not confirmed.** Originality of wording (no source was open while writing, but nobody has compared it against any). Coaching accuracy of the four front-lever, four L-sit and V-sit guides, written from the cues and general knowledge, not from a coach; a reviewer should read those first, along with Dragon Flag and the Nordic variants.

**Not run:** the Android and desktop shells; themes (no screen changed); D7 offline (step 4.8).

**Untracked:** `batch-b.backup-20261006-021152.js` and `service-worker.backup-20261006-021332.js`, which Part H's `git add` excludes.

**For W18, W19.** Same recipe: write only your own `batch-*.js`, flip your flag in the edit that writes your last guide, run the checker. W18 writes the three neck guides with the safety copy.

## 2026-10-06 · W18 · step 4.6 guide batch C1 (curl, lateral, reardelt, cuff, traps, neck, grip)

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan` at `da63ab1`, on W17's uncommitted tree. Nothing committed. Run on Sonnet 5.5. Scratch scripts (`w18_page.py`, the planted-fault runs) and the suite output are in this session's scratchpad.

**Files.** Backups are `fitness/content/batch-c1.backup-20261006-023538.js` and `service-worker.backup-20261006-023538.js`.
- `fitness/content/batch-c1.js` (0 → 29 guides): curl 5, lateral 4, reardelt 5, cuff 4, traps 3, neck 3, grip 5. Flag flipped `"pending"` → `"complete"` in the same edit.
- `service-worker.js`: `CACHE_VERSION` v67 → v68, since a precached file changed.
- No other file edited. `batch-a.js`, `batch-b.js`, `batch-c2.js`, `STYLE.md` and the checker are as W17 left them.

**Harness lines, before → after.**

| Check | Before (W17's tree, run first) | After |
|---|---|---|
| `check-exercise-content.js` coverage | 86 of 150, `c1 0/29 pending` | **115 of 150, `c1 29/29 complete`** (c2 0/35 still pending) |
| same, fields / phrases | 1574 strings, 0 hits | **2085 strings, 14 banned patterns, 0 hits** |
| same, variations | 6 grip sections, 11 alternatives | 6 grip sections (none new: no batch-C1 exercise takes a grip), **31 alternatives**, all resolve |
| same, safety | neck check had nothing to read | the three neck guides say slow, and stop at dizziness or tingling |
| same, overall | all passed | **all passed** (one fix loop: a 13-character step in Prone W Raise, lengthened) |
| `check-workout.py` | 74 pass | **74 pass, 0 fail, 0 error**, exit 0 (read from the output file's last line) |
| `check-training.js` / `check-coverage.js` / `check-bodymap.js` | all passed ×3 | all passed ×3 (44 PASS / 9 PASS counted from the files) |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK | OK / OK |
| `check-syncmerge.js` / `check-androidupdate.js` | 9 pass / 17 passed | 9 pass, 0 fail / 17 passed, 0 failed |

A test-runner subagent ran the suite; I read the output files myself.

**In the page** (scratch `w18_page.py`, not a harness case). At 390 and 1920 px: `EXERCISE_CONTENT` holds 115 ids, batch states are `a, b, c1: complete; c2: pending`, `scrollWidth` equals the viewport, **0 page errors**. Nothing renders the guides yet; W20 does.

**The checks can fail on this batch.** Six faults planted in a scratch copy of `fitness/content/` (`CONTENT_DIR=`), one at a time, each exiting 1 on its own check: "12 reps" in a step (phrases), "heals" in a safety line (phrases), the neck guide's stop-at-dizziness line cut (safety), an unknown alternative id (variations), the flag left `"pending"` with all 29 written (coverage), and a guide id renamed (placement and coverage). The repo copy exits 0.

**Review pass.** The checker can't read for sense, so I re-read all 29 against their `EXERCISE_DB` cues. I changed nothing after the first green run beyond the length fix above. Two lines go slightly beyond the cues and are mine: Isometric Lateral Raise says "elbow nearly straight", and Lean-Away Lateral Raise's *shouldn't feel* names the lower back on the leaning side. Both are signs, not claims.

**Deviations and choices.**
1. **Alternatives on 17 guides**, all sideways swaps (same job, different equipment or angle): band ↔ dumbbell curl and lateral, Hammer ↔ Dumbbell Curl, Face Pull ↔ Pull-Apart, T-Raise ↔ Reverse Fly, band ↔ side-lying external rotation, band ↔ weighted shrug, and the three grip holds to each other.
2. **Neck guides each carry the same stop line** ("slow, never jerk, stop at dizziness, pain or tingling in your neck, arms or hands"). Chin Tuck Hold and Four-Way Neck Isometric also tell you to get advice with a neck condition or recent injury or to keep the effort moderate; the first is advice, not a claim.
3. **Per-side holds and one-arm moves say "swap sides once you finish the set"** and avoid any count, as W15's rules require. The app, not the guide, decides whether one set means both sides (W10 decided yes).
4. **Tempo is in words**: "about two seconds" appears where a cue says it; holds read "no movement".

**Cues that look wrong or loose (not contradicted in the guides).**
- `acc_curl_invrow`'s injury line says to switch to a palms-down grip if the elbow aches. That makes it an ordinary row, not a curl, so it stops training the slot's muscle. The guide repeats the advice, because it is the safe reading.
- `acc_traps_pike`'s injury line says "rest on your fists", but Pike Shrug isn't grip-capable in `GRIPS`. The guide says to end the set instead.
- `acc_cuff_walllift` and `acc_cuff_pronew` both hold "a beat" at the top with no time. Fine for a guide; noting it because the app gives these reps, not holds.
- `acc_neck_fourway` says "Each direction counts for the seconds you hold it", which is a prescription detail. The guide says nothing about times.
- `acc_lateral_leanaway`'s cue doesn't say which arm holds the support, so the guide says "swap sides" without naming it.
- `acc_cuff_sidelying`'s readiness line (2.5 kg is a big jump) is the app's, not the guide's; the guide only says "lighter than you think you need".
- `acc_reardelt_bandpull` and `acc_reardelt_facepull` have no injury line that mentions the anchor beyond the face pull's; the guide's anchor line is mine.

**Not confirmed.** Originality of wording (no source was open while writing, but nobody has compared it against any). Coaching accuracy of the neck, cuff and wall-slide guides, written from the cues and general knowledge and not from a coach; a reviewer should read the three neck guides first.

**Not run:** the Android and desktop shells; themes (no screen changed); D7 offline (step 4.8).

**For W19.** Same recipe: write only `batch-c2.js` (35 guides: quad, hamstring, calf, shin, adductor, abductor, antirot, backext), flip its flag in the edit that writes the last one, and run the checker. After W19, D2 is met when all four read `"complete"`.

**Untracked:** `batch-c1.backup-20261006-023538.js` and `service-worker.backup-20261006-023538.js`, which Part H's `git add` excludes.

## 2026-10-06 · W19 · step 4.7 guide batch C2 (quad, hamstring, calf, shin, adductor, abductor, antirot, backext)

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan` at `da63ab1`, on W18's uncommitted tree. Nothing committed. Run on Sonnet 5.5. Scratch scripts (`w19_page.py`, the planted-fault copies) and the suite output are in this session's scratchpad.

**Files.** Backups are `fitness/content/batch-c2.backup-20261006-025838.js` and `service-worker.backup-20261006-025838.js`.
- `fitness/content/batch-c2.js` (0 → 35 guides): quad 6, hamstring 5, calf 4, shin 2, adductor 4, abductor 4, antirot 6, backext 4. Flag flipped `"pending"` → `"complete"` in the same edit.
- `service-worker.js`: `CACHE_VERSION` v68 → v69, since a precached file changed.
- No other file edited. `batch-a.js`, `batch-b.js`, `batch-c1.js`, `STYLE.md` and the checker are as W18 left them.

**Harness lines, before → after.**

| Check | Before (W18's tree) | After |
|---|---|---|
| `check-exercise-content.js` coverage | 115 of 150, `c2 0/35 pending` | **150 of 150, all four batches complete** (a 39/39, b 47/47, c1 29/29, c2 35/35) |
| same, fields / phrases | 2085 strings, 0 hits | **2729 strings, 14 banned patterns, 0 hits** |
| same, variations | 6 grip sections, 31 alternatives | 6 grip sections (none new: no C2 exercise takes a grip), **38 alternatives**, all resolve |
| same, overall | all passed | **all passed** (first run, no fix loop). **D2 is met** |
| `check-workout.py` | 74 pass | **74 pass, 0 fail, 0 error**, exit 0 (read from the output file's last line) |
| `check-training.js` / `check-coverage.js` / `check-bodymap.js` | all passed ×3 | all passed ×3 (44 PASS counted from the training file) |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK | OK / OK |
| `check-syncmerge.js` / `check-androidupdate.js` | 9 pass / 17 passed | 9 pass, 0 fail / 17 passed, 0 failed |

A test-runner subagent ran the suite. I read the output files myself and the counts above come from them.

**In the page** (scratch `w19_page.py`, not a harness case). At 390 and 1920 px: `EXERCISE_CONTENT` holds **150** ids, 35 of them in this batch, all four batch states read `complete`, `scrollWidth` equals the viewport, **0 page errors**. Nothing renders the guides yet; W20 does.

**The checks can fail on this batch.** Four faults planted in a scratch copy of `fitness/content/` (`CONTENT_DIR=`), one at a time, each exiting 1 on its own check: a guide id renamed (placement and coverage), "30 seconds" in a step (phrases), the flag left `"pending"` with all 35 written (coverage), and "prevents injury" in a mistake fix (phrases). The repo copy exits 0. My first attempt at this ran against an empty scratch directory and was void; the numbers above are from the rerun.

**Review pass.** The checker can't read for sense, so I re-read all 35 against their `EXERCISE_DB` cues. One line changed after the first green run: Bent-Knee Calf Raise's *should feel* now reads "a little deeper than you feel it with straight knees".

**Deviations and choices.**
1. **Alternatives on 7 guides**, all sideways swaps by equipment: Sliding Leg Curl ↔ Band Leg Curl, Side-Lying Adduction ↔ Band Adduction, Side-Lying Abduction ↔ Banded Clamshell, Calf Raise → Bent-Knee Calf Raise.
2. **Per-side moves say "do the set on one side, then switch"** and never give a count, so the app, not the guide, decides what one set means (W10: one set covers both sides).
3. **Holds use steps as enter, hold, exit**, as W16–W18 did. Hold times are left to the app.
4. **Spanish Squat's setup says to face the post.** The cue doesn't say which way you face; the band runs from the post to the backs of your knees, so facing it is the only arrangement where the band pulls your knees forward.

**Cues that look wrong or loose (not contradicted in the guides).**
- `acc_calf_bentknee`'s injury line says the bent knee "moves more of the work into the lower calf". The muscle that takes over is the soleus, which sits under the main calf muscle, not strictly lower. The guide repeats "lower calf".
- `acc_antirot_deadbug`'s cue says "One rep is one arm and leg on each side", and the batch-C1 per-side moves count one side. The guide says to alternate sides and gives no count.
- `acc_abductor_bandwalk`'s cue says "Count each step as a rep" while its slot's other moves count per side. The guide doesn't count.
- `acc_adductor_copknee` and `acc_adductor_copfoot` both say the lower leg "hangs free beneath you". In a Copenhagen plank it's usually the lower leg that is lifted toward the top one. The guides follow the cue and say only that it hangs free.
- `acc_hamstring_slidecurl`'s cue says "about three seconds out and two back". The guide writes it in words as the style guide requires.
- `acc_shin_single`'s readiness line ("it is the last step in this slot") and `acc_calf_weighted`'s "list the weights you own in Settings" are the app's rules, not the guide's.
- `acc_quad_sissy`'s injury line says the position "loads the front of the knee and the ankles hard". The guide says this in its safety list, as a reason to start with a short range, not as a claim about injury.

**Not confirmed.** Originality of wording (no source was open while writing, but nobody has compared it against any). Coaching accuracy of the Copenhagen planks, Sissy Squat and the two single-leg hinges, written from the cues and general knowledge and not from a coach; a reviewer should read those first.

**Not run:** the Android and desktop shells; themes (no screen changed); D7 offline (step 4.8).

**For W20.** All 150 guides exist and all four batches read `complete`. The directory can render every exercise's guide, and `check-exercise-content.js` already asserts the four script tags and `PRECACHE` entries.

**Untracked:** `batch-c2.backup-20261006-025838.js` and `service-worker.backup-20261006-025838.js`, which Part H's `git add` excludes.

## 2026-10-06 · W20 · step 4.8 Exercises section and close-out

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan` at `da63ab1`, on W19's uncommitted tree. Nothing committed. Run on Sonnet 5.5. Scratch scripts (`w20_shots.py`, `w20_nav.py`), the pre-change tree (`before/`), the planted-fault trees and every suite output are in this session's scratchpad.

**Files.** Backups are `*.backup-20261006-031833.*` beside `index.html`, `service-worker.js`, `README.md`, `fitness/basalt.js`, `fitness/basalt.css`, `tools/check-workout.py` and `tools/check-exercise-content.js` (the last was backed up and not edited).
- `fitness/directory.js` (new, 637 lines, `App.directory = { has, open }`): the **Exercises** section, registered in group *Plan* after Muscles.
  - **List.** Search over name, an alias list (only the knuckle grip has aliases), slot, primary muscles and the guide's summary. Filters: Muscle, Slot, Kind, *Where on its path*, *Doable with my equipment*, *Show excluded (n)*. The body map is the muscle filter (tap to select, tap again to clear) and the *Muscle* select does the same job, which is the group-list fallback W13 and W14 asked for. Ordered by slot then ladder depth; with a muscle chosen, by tier, then the slot built for that muscle, then slot order.
  - **Page.** Tags, the written guide (set up, one rep, breathing, tempo, feel, mistakes, safety, *On your knuckles*, sideways swaps), the muscles in tiers on the body map plus a text list, the phase animation on the 14 animated movements, joint load, easier and harder moves from the ladder, and *In your program* (the slot's current prescription, last three sessions, best).
  - **Actions.** *Train this in my ⟨slot⟩* (`engine.chooseExercise`), *Exclude* / *Include again* / *Allow anyway* (`engine.setExcluded`), and *Pin* weekday toggles on coverage movements (`engine.setPins`). Results and refusals show inline on the page; no `alert` or `confirm`.
- `fitness/basalt.js`: `openGuideModal` hands off to `App.directory.open` first, so a workout's *How to do this* and Skills open the page. The modal and its code stay as the fallback if `directory.js` fails to load.
- `fitness/basalt.css` (+~50, `.dx-*`), `index.html` (a `view-exercises` container and the script tag), `service-worker.js` (`fitness/directory.js` in `PRECACHE`; `CACHE_VERSION` v69 → v70).
- `README.md`: a paragraph on the section with its limits, `Nine destinations`, the measured nav wrap, and Layout entries for the Stage 3 and 4 `fitness/` files, which were missing.
- `tools/check-workout.py`: D3–D7, `open_exercises`, and B1 retargeted at the page (deviation 1).

**Harness lines, before → after.** "Before" is the pre-change app (the backups of `index.html`, `service-worker.js`, `basalt.js`, `basalt.css`, and no `directory.js`) run through `HELTH_INDEX`. Cases were written against the plan's Part F; every number is read from the output file.

| Case | Before | After |
|---|---|---|
| B1 | FAIL: 0 figures, 0 lit groups, 0 phase tabs (the modal opens instead of the page) | PASS: 2 figures, lit abs / chest / front delts / triceps, 3 rows; Pike's phase tabs kept |
| D3 | FAIL: no Exercises section in the navigation | PASS: "knuckle" lists exactly `push_1`, `push_incline`, `push_2`, `push_4`, `push_alt_wide`, `push_alt_negative`; Biceps lists 16 of 16, first four are curls, secondary starts at the sixth, tapping again returns 150 |
| D4 | FAIL: no Exercises section | PASS: slot `push_5` "chosen by you"; Weighted Dip refused with "needs dip bars", slot unchanged; Diamond excluded, hidden, shown as *excluded* with Show excluded, 0 rows in Today's Swap; 0 dialogs |
| D5 | FAIL: the Exercises section didn't open, the old modal did | PASS: page opens, "← Back to Workout", the workout resumes with the typed 9 still in set 1; 14 of 14 animated pages keep their tabs and the tiers map |
| D6 | FAIL: no section, all four runs | PASS: 0 overflow in 12 runs (2 themes × 390 / 1920 × list, page, animated page), 2 figures each, the layout spans its view (416–1736 at 1920) |
| D7 | FAIL: 0 guides, no page offline | PASS: 7 new files served 200 from the worker offline, none missing from `PRECACHE`; Push-up's page, 150 guides and the map work |

| Check | Result (final tree, read from the files) |
|---|---|
| `check-workout.py`, full | **79 pass, 0 fail, 0 error**, exit 0 (74 + D3–D7) |
| `check-training.js` / `check-coverage.js` | all passed, 44 PASS / all passed, 9 PASS |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK |
| `check-syncmerge.js` / `check-androidupdate.js` | 9 pass / 17 passed |
| `check-bodymap.js` / `check-exercise-content.js` | all passed / all passed |

Test-runner subagents ran everything. I read the output files; two subagent summaries were wrong (one described a planted fault backwards, one repeated a first run from before a fix), so the numbers above come from the files.

**One defect found by the harness, fixed:** D3's first run FAILed on "curls come first": under plain slot order the Pull slot's chin-ups (biceps primary) led, ahead of the curls. Within a tier the slot whose `trains` names the muscle now leads.

**The new cases can fail.** Three faults, each in a scratch copy of the tree:

| Fault | Fails |
|---|---|
| `fitness/directory.js` removed from `PRECACHE` | D7: "missing from PRECACHE ['fitness/directory.js']" |
| Back never returns to the section you left | D5: "Back returns to the running workout", `resumed 0` |
| Slot order only, no muscle-first ordering | D3: "curls come first", first slots `['pull', 'curl', 'curl', 'curl']` (the real first run) |

**By eye.** Scratch `w20_shots.py`: the list at 1440 px and a Push-up page at 390 px (full page) in Selene and Selene Day, 0 page errors. Other themes weren't looked at.

**Deviations, and choices the plan left open.**
1. **B1 now reads the exercise page.** It drove the guide modal, which *How to do this* no longer opens (plan E1: the page replaces the modal). Its assertions are the same (tiers on the map, the legend, the muscle rows, the animation kept), and its selectors changed. The old modal is unchanged and unreachable unless `directory.js` fails to load.
2. **"Difficulty" is *Where on its path*:** starting rung, on the path, or branch or optional. The catalogue has no difficulty rating, and the DB's `level` is null for most branches. The screen says it is a position and not a strength rating.
3. **D7 serves the app over localhost** (`python3 -m http.server`), because a service worker can't register from `file://` and every other case blocks workers. It is the one case that doesn't use a `Session`.
4. **The nine-destination nav bar wraps at 1440 px.** Measured by distinct button tops in Selene: before, 8 buttons on 1 row at 1440 and 1920; now 9 buttons on **2 rows at 1440** (Phase review drops under) and 1 row at 1920. The 1440 wrap is new with this section. README says so. A fix would change `css/basalt-gruvbox.css` §5's threshold or a label, and I didn't.
5. **The map is the male figure only,** as W13 and W14 left it. The profile's `sex` field doesn't switch it. Still your decision.
6. **"Pin to my finisher" is the Coverage card's weekday pin,** on coverage movements only. Pins belong to a slot, not to one movement, and the page says "Pin the ⟨slot⟩ slot".
7. **Search matches the guide's summary,** so a word in a summary can surface an exercise the name doesn't suggest. Only the six grip-capable push-ups have the knuckle alias.

**Not confirmed.** Coaching accuracy of the 150 guides (the earlier windows' note stands; the README says it). The screens in themes other than Selene and Selene Day. The Android and desktop shells.

**Carried open, not touched.** W5-1 (a sync before a device's first write skips `toV5`), R2-1 to R2-4, R3-4.

**Untracked:** the seven `*.backup-20261006-031833.*` files, which Part H's `git add` excludes. `fitness/directory.js` is new and *is* included.

## 2026-10-06 · R4 · step 4.9 review

**Where.** `/home/talon/SyncedWork/Claude/Helth` (Talon), branch `fitness-plan` at `da63ab1`, on W20's uncommitted tree. The paste named "the Stage 2 diff", the template's wording; this window reviewed Stage 4, the plan's 4.9, as R3 did for its stage. The before is `git archive da63ab1` (the committed Stage 3 tree), extracted to the scratchpad and run through `HELTH_INDEX`. No code changed by this window. Run on Opus 5.5. Scratch probes (`r4_probes.py`, `r4_more.py`, `r4_nav.py`), screenshots and the suite output are in this session's scratchpad. Backup: `PROGRESS-fitness-control-and-coverage.backup-20261006-041454.md`.

**Harnesses, re-run on this tree** (a test-runner subagent ran them; counts read from the output files).

| Check | Result |
|---|---|
| `check-workout.py` | **79 pass, 0 fail, 0 error**, exit 0 (B1–B3, D3–D7 PASS) |
| `check-training.js` / `check-coverage.js` | all passed, 44 PASS / all passed |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK |
| `check-syncmerge.js` / `check-androidupdate.js` | 9 pass, 0 fail / 17 passed, 0 failed |
| `check-bodymap.js` (D1) / `check-exercise-content.js` (D2) | all passed / all passed |

**Findings, each reproduced by clicks against this tree.**

### R4-1 · INCONSISTENCY (medium): *Train this* puts a left-out slot back into your program without saying so
Program hides *Change exercise* on a left-out slot on purpose ("a left-out slot has nothing to control; Add brings it back", `basalt.js` `slotRow`). The page's button (`directory.js:493`) has no such guard, and `chooseExercise` overwrites the `off` record.
- **By clicks:** Program → Dip → *Leave out* (`off: true`, 0 *Change exercise* buttons) → Exercises → Bench Dip. The page says "Your Dip slot has nothing prescribed — it is off, or nothing in it is allowed", then offers *Train this in my Dip slot*. Clicked: the record is `dip_1`, `off: null`, "chosen by you"; Program's row reads "Bench Dip … Leave out". The message says only "Bench Dip is now your Dip slot's exercise, at the bottom of its range." 0 page errors.
- **Effect:** silent configuration: dips come back into every dip day, and nothing on the page says so.
- **Smallest fix (not applied):** show the button under Program's own condition (a live record, or a coverage slot with none); otherwise say "Left out — Add it in Program first". One condition in `actionsHtml`.

### R4-2 · INCONSISTENCY (medium): Back goes to the wrong section once a page was left by the nav instead of Back
`openPage` sets `V.from` only when `V.page` is empty (`directory.js:598`), and only `back()` empties it. Leave a page any other way and both stay stale.
- **By clicks, shape 1:** Skills → a skill rung's page ("← Back to Skills & mobility") → Begin a workout from the nav → log 7 in set 1 → *How to do this*. The page says **"← Back to Skills & mobility"**, and Back lands on Skills, not the running workout. The draft survives (Workout still shows Complete, set 1 still 7), so nothing is lost; you have to find the workout yourself.
- **By clicks, shape 2:** Workout → *How to do this* → nav to Muscles → nav to Exercises. The section opens on the old Wall Push-up page, still reading "← Back to Workout", with 0 list rows; pressing the Exercises nav button again leaves it there. The list is reachable only by Back (out of the section) and then the nav.
- **Effect:** README's "Back returns to the workout" is false in shape 1.
- **Smallest fix (not applied):** in `openPage`, set `V.from` whenever the current section isn't `exercises` (drop the `!V.page` guard): one line, fixes shape 1. Shape 2 also needs `V.page` cleared when the section is entered from elsewhere, which `renderExercises` can't tell from a refresh today; a flag set by `openPage` would do it.

### R4-3 · INCONSISTENCY (low): a loaded movement's history and best print without the weight
`historyFor` (`directory.js:450`) keeps `reps` and drops each set's `weight`.
- **By clicks:** two Dumbbell Curl sessions seeded, 3 × 12 at **5 kg** and 3 × 12 at **12.5 kg** → the page reads "Last 2 sessions: 2 Oct — 12 / 12 / 12; 1 Oct — 12 / 12 / 12. Best: 12 reps." The two read the same.
- **Effect:** against the house rule of printing the raw quantity beside the number; on a loaded movement the load is the progression. The PR record itself is reps only (`_checkPR`, pre-existing); the page shows that as-is.
- **Smallest fix (not applied):** carry the sets' weight in `historyFor` and append "at X kg" when it's uniform and above 0, as `rxLine` already does for the prescription.

### R4-4 · DESIGN RISK (low): every list render adds another click listener to the section
`renderList` calls `el.addEventListener("click", …)` on `#view-exercises` (`directory.js:357`), which persists across renders; the page uses `el.onclick`, which then also stays live on the list.
- **Measured** (`App.refresh` wrapped to count): one row click after k Backs → **1, 3, 4, 5** refreshes, and **13 after 11 Backs**, each a full page render. Time per click with the 150 ms wait went 210 → 273 ms over those 11. 0 page errors; nothing visibly wrong yet.
- **Effect:** grows with every Back for the life of the tab, which on an installed PWA is days.
- **Smallest fix (not applied):** `el.onclick = function (e) {…}` in `renderList`, as `renderPage` does. One line, and it also replaces the page's stale handler.

### R4-5 · COSMETIC (low): the nav bar wraps at 1440 px in all 21 palettes, not just Selene
**Measured** by distinct button tops in `#nav` plus `#btn-settings`, before (`da63ab1`) and after:

| Width | Before | After |
|---|---|---|
| 1440 | 21 of 21: one row of 8, *Training setup* below | 21 of 21: *Phase review* drops to row 2, *Training setup* below |
| 1920 | 21 of 21: one row of 8, *Training setup* below | 21 of 21: one row of 9, *Training setup* below |

W20 disclosed the wrap for Selene; README says "in Selene". It's every palette. **Pre-existing, separate:** README's older sentence that the bar plus *Training setup* "fits one row … at 1920px in all seven" was already false at `da63ab1` (21 of 21 put *Training setup* on its own row, Nostromo screenshot at 1920 shows it).
**Fix:** your call, as W20 said: a shorter label or §5's threshold. At least correct README's "in Selene".

### R4-6 · COSMETIC (low): the directory's map reads "not worked" and doubles the selected name for a screen reader
The directory passes `values` for the selected muscle only, and its `label` returns the group name, which `bodymap.js` already prefixes.
- **By DOM, after tapping Biceps:** "Biceps — Biceps — selected"; every other region "Chest — not worked", "Abs — not worked" — a filter, not a week. The legend shows a grey → amber → red ramp between "Not selected" and "Selected" for a two-state choice.
- **Smallest fix (not applied):** pass `0` for every group and have `label` return "selected" / "not selected". Two lines in `renderMap`.

**Checked, nothing found.**
- **Every page:** all 150 opened in turn: an `h1` matching the DB name, a guide summary, two figures with at least one lit region, and no "undefined", "NaN" or "[object" anywhere. 0 page errors.
- **Themes and widths:** Nostromo and Chernobyl × 390, 1440 and 1920, list and page: `scrollWidth` equals the viewport, and the layout spans its view (264–1408 of main 232–1440; 416–1736 of 232–1920, centred). D6 already covers Selene and Selene Day.
- **Muscles map card:** a *Furthest below the floor* row opens the group's detail ("Side delts … 0 of 6"). `neg` is always the 7-day model, so the list beside the 7-day map can't disagree with it under the 30-day selector.
- **Skills:** all 5 rungs shown open the page, none fall back to the old modal.
- **Guides, mechanically:** every equipment word in a guide sits in a sideways-swap line about the other movement. One alternative crosses slots (Dumbbell RDL → Single-Leg RDL with Dumbbell, hinge → hamstring), deliberately (W15). The three neck guides read slow, no jerking, stop at dizziness, pain or tingling.
- **Engine shapes the page reads:** session sets are `{ reps, weight }` and keyed by `key` (`finalizeSession`), and PRs are one record per id and kind updated in place, so `filter()[0]` is the best.

**Not confirmed.** Coaching accuracy of the 150 guides beyond the neck three (read, not checked by a coach), and originality of the wording. The pre-existing cue notes W16–W19 raised (`core_2`'s easier/harder direction looks backwards) are in `EXERCISE_DB`, not Stage 4.

**Carried open, not re-run here:** W5-1, R2-1 to R2-4, R3-4.

**Not run:** the Android and desktop shells.

**Untracked:** this entry's backup, `PROGRESS-fitness-control-and-coverage.backup-20261006-041454.md`, which Part H's `git add` excludes. `plans/.Rhistory` (empty, 1 Oct) is untracked and *would* be included by Part H's `git add -A`; it isn't Stage 4's.

## 2026-10-06 · R4 fixes · R4-1 to R4-6 applied

**Where.** The same session as R4, at your request ("make all the fixes"), on the same uncommitted tree. Nothing committed. Run on Opus 5.5.

**Files.** Backups are `*.backup-20261006-042316.*` beside each file.
- `fitness/directory.js`:
  - **R4-1.** `actionsHtml` offers *Train this* only under Program's own rule: a live record, or a coverage slot with none. A left-out slot's page says "Your Dip slot is left out of your program. Add it under **Your prescriptions** in Program to train anything here." and has no button.
  - **R4-2.** `openPage` records where you came from every time it's called from another section, not only when no page was open. A `MutationObserver` on the view's class forgets the page whenever the section is hidden, so leaving by the nav or Begin opens the list next time. The router only toggles `hide`, so that is the one signal every route shares.
  - **R4-3.** `historyFor` keeps each set's weight. A uniform session reads "12 / 12 / 12 at 5 kg per hand", a mixed one "12 at 12.5 kg / 12 at 12.5 kg / 12 at 10 kg per hand". *Best* on a loaded movement adds "at any weight: the record counts reps, not load".
  - **R4-4.** `renderList` sets `el.onclick` instead of adding a listener, which also replaces the page's handler.
  - **R4-6.** The filter map passes 0 or 1 for every group, labels them "selected" / "not selected", and draws no legend.
- `fitness/bodymap.js` (R4-6): `spec.legend: false` draws no legend; documented in the header.
- `css/basalt-makeover.css` (R4-5): `.nav__btn` side padding 12 → 8 px. **Deviation from R4's note:** R4 named `basalt-gruvbox.css` §5, but `basalt-makeover.css` loads after it and sets the padding, so §5's `padding-inline` was already dead. The first edit went to §5 and R4e still measured 1153 px; it was reverted (the file is byte-identical to HEAD and its backup was removed) and the rule that applies was changed.
- `README.md`: the nav measurement paragraph re-measured (21 palettes: one row at 1440 and 1920, wraps at 1366 and 1280, *Training setup* on its own row at all four, and why 8 px), W20's "in Selene" sentence removed, and the Exercises paragraph says the left-out rule and that history carries the weight. **Pre-existing, fixed with it:** the old claim that the bar plus *Training setup* fits one row at 1920 px, false at `da63ab1` in 21 of 21.
- `service-worker.js`: `CACHE_VERSION` v70 → v71.
- `tools/check-workout.py`: R4a–R4f, helpers `visible_views` and `open_page`, a header line.

**Harness lines, before → after.** The cases were written first and run on the unfixed tree. Two harness defects were caught there and fixed before the numbers below: R4a's coverage control used Door-Frame Curl, which is that slot's prescription (so no button is correct), and is now Four-Way Neck Isometric; R4b's second shape ran while still on Skills, and now opens Workout first.

| Case | Before | After |
|---|---|---|
| R4a | FAIL: offered 1; dip after `dip_1`, `off` None | PASS: offered 0; dip stays `off`; coverage and live controls 1 and 1 |
| R4b | FAIL: "← Back to Skills & mobility", landed Skills; from the nav 0 rows, 1 Back button | PASS: "← Back to Workout", landed Workout, set 7 kept; from the nav 150 rows, 0 Back buttons |
| R4c | FAIL: "12 / 12 / 12" twice; "Best: 12 reps (1 Oct)" | PASS: both weights printed; "at any weight" |
| R4d | FAIL: refreshes per click after 0–5 Backs `[1, 3, 4, 5, 6, 7]` | PASS: `[1, 1, 1, 1, 1, 1]` |
| R4e | FAIL: 21 of 21 palettes wrapped; 1153 of 1120 px | PASS: 0 wrapped; 1081 of 1120 px |
| R4f | FAIL: "Biceps — Biceps — selected", "Chest — not worked"; 1 ramp | PASS: "Biceps — selected", "Chest — not selected"; 0 ramps |

| Check | Result (final tree, read from the output files) |
|---|---|
| `check-workout.py` | **85 pass, 0 fail, 0 error**, exit 0 (79 + R4a–R4f) |
| `check-training.js` / `check-coverage.js` | all passed, 44 PASS / all passed |
| `check-training-data.js` / `check-muscle-map.js` | OK / OK |
| `check-syncmerge.js` / `check-androidupdate.js` | 9 pass, 0 fail / 17 passed, 0 failed |
| `check-bodymap.js` / `check-exercise-content.js` | all passed / all passed |

A test-runner subagent ran the suite and said the Playwright run took about 4 minutes; the file timestamps say 04:30 → 04:44. The counts above are from the files.

**By eye.** The nav at 1440 px in Selene and Selene Day: nine on one row, *Training setup* below as before. At 390 px in both: the left-out Dip page, the Dumbbell Curl history line ("12 / 12 / 12 at 7.5 kg per hand"), and the filter map with Biceps selected and no legend. 0 overflow, 0 page errors.

**Not run:** the Android and desktop shells.

**Carried open, not touched:** W5-1, R2-1 to R2-4, R3-4.

**Untracked:** the seven `*.backup-20261006-042316.*` files, which Part H's `git add` excludes.
