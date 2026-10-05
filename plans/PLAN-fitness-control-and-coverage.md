# Fitness: exercise control, full-body coverage and an exercise directory — plan

Written **2026-10-03** against GitHub `talon270/wellness-hub`, branch `android` at `c7015a2` (2026-10-02), BASALT schema **v4**. The line numbers in `FITNESS-ALGORITHM-REVIEW-HANDOFF.md` match that commit exactly, so it's taken to be your working tree. If `/home/talon/SyncedWork/Claude/Helth` has uncommitted changes, W1 re-anchors every line reference before anything else.

**Before W1:** copy this file into the repo as `plans/PLAN-fitness-control-and-coverage.md` (Part H has the setup). It was written on the fatty machine in `~/claude`, a Syncthing folder shared with Talon, next to the handoff. Once it's in the repo, edit only the repo copy: that's the one that travels between machines.

**Method.**
- **Read in full:** `fitness/training.data.js`, `training.js`, `muscles.data.js` and `muscles.js`.
- **Read in `fitness/basalt.js`:** the engine, onboarding and assessment, Today (preview, swap, pain flag, guide modal), Program, Skills and the exercise DB. Also read: the `training` merge in `js/syncmerge.js`, the badge code in `js/gamify.js`, the check tools, `index.html` and `service-worker.js`.
- **Reproduced:** a Node probe that loads the real `training.data.js` and `training.js` and calls `Training.recommend` and `Training.owns`.
- **Computed:** the coverage table, from `muscles.data.js` plus the templates copied from `basalt.js:2238-2272`.
- **Ran:** the four Node checks, all passing on this tree (`check-training.js` all passed, `check-training-data.js` OK, `check-muscle-map.js` OK, `check-syncmerge.js` 6 pass).
- **Not run:** `tools/check-workout.py` (Playwright), the app's screens, and the Android and desktop shells.

**Nothing below is implemented — this is the plan.** Approval is per stage, as in your last plan.

## What you asked for, and your answers (2026-10-03)

| Ask | Your answer |
|---|---|
| Knuckle push-ups instead of normal ones | **Push-up family.** Knuckles count as **slightly harder** than palms, and you can sub them in for normal push-ups |
| More control over exercises | **All four:** choose and keep a slot's exercise · exclude exercises · joint limitations · hold or tune a prescription |
| No muscle group left out | **All four areas:** arms and shoulder health · fuller legs · trunk · neck and grip |
| Session time | **No constraint:** allow **+20 min** finishers **and** separate **mini-sessions** |
| Exercise directory body map | **Adapted MIT drawing** (front and back, shaded primary, secondary and stabiliser; tap a muscle to list its exercises) |
| How the directory teaches | **Detailed written guide** |
| Models for the windows | **Opus 5.5 + Sonnet 5.5** |

## The four stages

| Stage | What it does | Schema | Approve |
|---|---|---|---|
| **1 · Fixes** | The review's bugs: logged weight ignored, the step-back rule, Weighted Dip's equipment, the swap badge, a stale comment; plus a double step for big overshoots | stays v4 | now |
| **2 · Control** | Knuckle grip; choose and keep a slot's exercise (weighted and branch moves included, past the end of a ladder); exclusions; joint limitations; hold and custom sets/range; finer equipment and the weights you own | **v5** | after R1 |
| **3 · Coverage** | 14 → 22 muscle groups; 15 coverage slots with 64 new exercises; the +20 min finisher and mini-sessions; coverage measured in direct sets | **v6** | after R2 |
| **4 · Directory** | An Exercises section: search and filters, an anatomical body map, a detailed written guide for every exercise, and a body-map heat view on Muscles | none | after R3 |

**Stage 1 goes first** because Stage 2 makes loaded exercises reachable, and F1 (the logged-weight bug) is harmless only while they aren't. Stages 2 and 3 each bump the schema so an older build opens a newer save read-only, which is the existing guard (`basalt.js:249-254`, `437-449`). Part G maps every step to a window, a model and an effort level.

## Decisions this plan makes for you

The table above records your answers. Every row below is a default that fills in what they left open: override any of them when you approve the stage it belongs to.

| Decision | Default | Alternative |
|---|---|---|
| Knuckle-capable exercises | Wall (`push_1`), Incline (`push_incline`), Push-up (`push_2`), Decline (`push_4`), Wide (`push_alt_wide`), Negative (`push_alt_negative`) | Only the four you were shown (wall, incline, standard, decline), or add Archer and Pseudo Planche |
| What "slightly harder" means | Grip is a setup ordered palms < knuckles. A **knuckle session counts as evidence for a palms prescription**; a palms session doesn't count for a knuckles one | Count both ways |
| How you sub them in | A standing choice, *Push-ups on: Palms / Knuckles*, plus a per-session *Knuckles today* toggle. **Never a compulsory rung** of the ladder | Make knuckles a rung: palms → knuckles → next exercise |
| Your grip across steps | Kept in both directions. Diamond, Archer and Pseudo Planche are done on palms ("knuckles resume at Decline") | Step back from knuckles to palms first |
| Handles / parallettes as a third grip | Not added. Parallettes become equipment only (they unlock L-sits) | Add a *Handles* grip |
| Skill-kind moves (planche, lever, handstand, L-sit attempts) as a slot's exercise | Not allowed; they stay in Skills | Allow |
| Excluded exercises in Swap lists | Hidden behind *Show excluded*; a one-off swap to one still works | Never selectable |
| Joint limitations | Per joint (wrist, elbow, shoulder, neck, lower back, hip, knee, ankle): **careful** warns, ranks the exercise lower and suggests knuckles for wrists; **avoid** excludes exercises that load that joint heavily, with *Allow anyway* per exercise. Copy says it filters exercises and can't assess an injury | *Avoid* only |
| *Hold* on a slot | Pauses Step up only. Step back offers still show | Pause both |
| Custom sets and range | Survive a goal change. Changing sets starts fresh evidence, as today | A goal change resets them |
| New equipment | `bands`, `parallettes`, `dipBars` (parallel bars or a dip station), `lowBar` (a bar or table edge at waist or hip height). On upgrade each is inferred from your current slots and logged sessions, else off, with a one-time *Equipment check* card | All off, card only |
| Weights you own | Per implement: adjustable (step and maximum) or a fixed list. The default is today's behaviour: dumbbells +2.5 kg, kettlebells +4 kg, no maximum | Ask at upgrade |
| Step-back rule (F2) | Offered only when totals fell twice **and** the latest isn't at the top on every set **and** (the latest total is ≥ 10% below the best of the three, **or** a set fell below the bottom of the range) | Keep today's rule |
| Double step (F9) | When both evidence sessions are ≥ 1.5× the top on every set, offer two steps | Never |
| Coverage slots | 15 slots, each a ladder under the same evidence rules (Part D) | Fewer slots, or fixed prescriptions without progression |
| Coverage ranges | Reps 10–15 whatever your goal; rotator cuff, neck and shins 12–20; holds per exercise | Follow the goal ranges |
| Weekly floors, in direct (primary) sets | **6** for the 12 groups a coverage slot can top up: quads, hamstrings, biceps, side delts, rear delts, traps, forearms, obliques, lower back, calves, adductors, abductors. **3** for rotator cuff, neck and shins. **3** for chest, front delts, triceps, lats, upper back, abs and glutes, which only main slots train, so every template clears it when followed; their template target stays the main gauge. Product choices, named constants | Your numbers, e.g. 8 for quads and hamstrings |
| Finisher | A Workout-screen toggle, **off until you turn it on**. Four coverage exercises, about 20 min, picked by the biggest weekly shortfall, skipping any group trained directly in the last 48 h. Swap, remove or pin each one | On by default |
| Mini-sessions | Any day, rest days included; 2–6 coverage exercises (4 by default). They **don't** move the rotation, rest days or attendance. They **do** count for muscles, PRs, evidence, the BASALT streak and the Hub's fitness habit | Not counted for streaks |
| Muscle groups | 14 → 22 (Part D). `upper_back` loses rear-delt and trap work to the new groups, so its derived level may drop. Earned badges stay earned (`gamify.js:891-899` stores them), but "every group" badges get harder | Keep 14 groups |
| Directory | A new **Exercises** section (group *Plan*, after Muscles) listing every exercise in the DB. Warm-ups, cool-downs and mobility routines aren't included | Put it inside Muscles |
| Body-map art | `react-native-body-highlighter` (MIT), at a pinned commit, with its licence shipped and a credit line. Deltoid and upper-back regions are split, and a rotator-cuff region is drawn | Original drawing |
| Guide text | Original text written for the app. No medical claims. Never restates a rep range (the app's rule is the only source) | — |
| Stage order | 1 → 2 → 3 → 4 | 4 before 3; the coverage exercises' guides then follow Stage 3 |
| Schema | v5 in Stage 2, v6 in Stage 3 | One v5, only if both stages are approved together |
| Moving work between machines | One branch, `fitness-plan`, off `android`. Hand off between windows with a `git bundle` through the synced `~/claude` folder (Part H). Windows still don't commit; you do, at the handoff | Push the branch to GitHub: the repo is public, so half-finished work would be public, and the push needs a GitHub login |

## Part A — review findings, ranked

Severity labels follow your last plan. **Reproduced** means run against the real `training.js` in Node on 2026-10-03. **Source** means traced in the code, not run.

### F1 · BUG (high, latent until Stage 2): logged weight is ignored once a slot's load is known
`rxAsLogged` (`basalt.js:3062-3069`) only fills `loadKg` when it's null, and `comparable` (`training.js:110-117`) compares the saved `rx`, never the sets' weights. **Reproduced:** Dumbbell Overhead Press prescribed at 10 kg; two sessions logged at **5 kg**, 3 × 12, "just right" → `ready`, step up to **12.5 kg**. It's latent today only because no slot can hold a loaded exercise (F3), and Stage 2 changes that.
**Fix (Stage 1):**
- `exposures` carries each set's weight.
- `comparable` rejects a loaded exposure whose working sets weren't all at its `rx` load.
- `rxAsLogged` saves a uniform logged weight as the session's load; mixed weights save as unknown.
- The card says "logged at 5 kg, not 10 kg" and offers to set the slot to 5 kg.

### F2 · BUG (medium): the step-back rule fires on one-rep noise and on overshooting the top
`training.js:272-281` offers *reduce* after any two consecutive drops in total.

| Reproduced | Result |
|---|---|
| Push-up 3 × 6–12: 12/12/12 → 12/12/11 → 12/11/11 (one rep less each time) | `reduce` → Incline Push-up |
| 15/15/15 → 14/14/14 → 13/13/13, **every set above the top**, rated hard | `reduce` → Incline Push-up |
| 10/10/10 → 9/9/9 → (6 weeks off) → 8/8/8 | `reduce` (reasonable, and kept) |

**Fix (Stage 1):** the rule in the decisions table.

### F3 · DESIGN GAP (high): every ladder dead-ends, and load progression can't be reached
Every write to a slot was checked:

| Writer | Lines | What it can put in a slot |
|---|---|---|
| Onboarding | `basalt.js:3418` | Main-path exercises only |
| v4 migration | `409` | One-time: a save whose old tier level was 5–6 could carry a branch exercise such as Archer Push-up |
| Day-to-day code | `321`, `2854`, `2931`, `2952`, `4708`, `4711` | Main-path exercises only |

So since v4, a branch move reaches a slot only through that migration, and **nothing ever puts a loaded exercise in one**.

- **Steps:** a step follows `next` only. Branch moves are offered as "Optional next: …, from Swap" (`basalt.js:4529-4533`), which is a one-session swap.
- **Loaded options:** `SLOTS[slot].loaded` is read only by `tools/check-training-data.js`.
- **Load progression:** the +2.5 kg / +4 kg steps, the `no-load` reason and the load stamping at `basalt.js:2664-2675` are tested in Node but can't happen in the app.

| Slot | The path ends at | You can't move on to |
|---|---|---|
| push | Decline Push-up | Archer, Pseudo Planche, One-Arm, weighted |
| row | Australian Row | weighted rows |
| pull | Pull-up | Chin-up, Archer Pull-up |
| squat | Bulgarian Split Squat | Shrimp, Pistol, Goblet |
| hinge | Single-Leg Hip Thrust | Nordics, RDL, Swing |
| core | Tuck L-Sit | L-Sit, Dragon Flag |
| shoulder | Elevated Pike Push-up | Handstand work, Overhead Press |
| dip | Parallel Bar Dip | Korean, Ring, Weighted Dip |

**Fix (Stage 2):** choose and keep, and actionable options at the end of a path.

### F4 · DESIGN GAP (high): knuckle push-ups exist only as a wrist pain swap
"Fist Push-up" and "Knuckle/Parallette Push-up" are `SUBSTITUTIONS.push.wrist` names (`basalt.js:1867-1871`) with no exercise id. Applying one relabels `push_2` and flags it (`basalt.js:4386-4391`). Flagged work is never evidence (`training.js:113`), and each flag lands in `flagsHistory` (`basalt.js:2697-2712`) and in the report's pain-flag count. So a knuckle push-up user **can't progress**, and their report fills with pain they don't have. **Fix (Stage 2):** grip.

### F5 · DATA BUG (medium): "pull-up bar" stands for three different things
**Reproduced** with only `pullupBar` owned: `owns()` is **true** for Band-Assisted Pull-up (no band), Straight Bar Dip, Parallel Bar Dip, Korean Dip and Australian Row, and Weighted Dip is owned with dumbbells alone. **Source:** a doorway-bar owner on the dip path steps from Two-Chair Dip to Parallel Bar Dip (`training.data.js:285`), and the row path's only step, Table Row → Australian Row (`:213-215`), needs a waist-height bar.

**Fix:** Stage 1 makes Weighted Dip need the bar (data only). Stage 2 adds the four tokens.

### F6 · INCONSISTENCY (low, source): the swap badge disagrees with ownership
Swap lists and the preview's "needs gear" badge read `EXERCISE_DB`'s flat list as all-of (`basalt.js:3693-3695`, `3840`, `4263-4267`); ranking reads the catalogue's any-of lists (`training.js:132-137`). A dumbbell-only user sees Goblet Squat ranked as owned but tagged "needs kettlebells". **Fix (Stage 1):** use `Training.owns` and `missingGear` (`basalt.js:3093-3099`) in all three places.

### F7 · MEASUREMENT GAP (high for your goal): the Muscles screen can't see neglect
- **The weekly target is circular.** It's built from the template's own slots (`muscles.js:194-211`), so a group the template neglects gets a tiny target and reads **"On target"**.
- **"Neglected" hides groups with no direct work.** It counts every tier (`muscles.js:244-247`), so biceps that only ever assist in rows never show up.

**Fix (Stage 3):** direct sets against a floor.

### F8 · CATALOGUE GAP (high for your goal): six groups get zero direct work; eight aren't in the app at all
Weekly sets for a typical home setup (bench and doorway bar, no weights, dips on; the rotation without its optional row): Push-up, Table Row, Pull-up, Split Squat, Hip Thrust, Hollow Hold, Pike Push-up, Bench Dip, 3 sets each. Each cell is **direct (primary) sets | weighted sets** (secondary counts 0.5).

| Group | Full body ×3 | Full body ×2 | Upper / lower | Rotation |
|---|---|---|---|---|
| Triceps | 9.0 \| 9.0 | 6.0 \| 6.0 | **18.0** \| 18.0 | 10.5 \| 10.5 |
| Glutes | 9.0 \| 9.0 | 6.0 \| 6.0 | 12.0 \| 12.0 | 10.5 \| 10.5 |
| Upper back | 9.0 \| 9.0 | 6.0 \| 6.0 | 12.0 \| 12.0 | 5.3 \| 5.3 |
| Abs | 9.0 \| 9.0 | 6.0 \| 6.0 | 6.0 \| 6.0 | 10.5 \| 10.5 |
| Chest | 4.5 \| 4.5 | 3.0 \| 3.0 | 6.0 \| 9.0 | 5.3 \| 6.6 |
| Front delts | 4.5 \| 6.8 | 3.0 \| 4.5 | 6.0 \| 12.0 | 2.6 \| 6.6 |
| Lats | 4.5 \| 6.8 | 3.0 \| 4.5 | 6.0 \| 9.0 | 5.3 \| 5.3 |
| Quads | 4.5 \| 4.5 | 3.0 \| 3.0 | 6.0 \| 6.0 | 5.3 \| 5.3 |
| **Side delts** | **0** \| 2.3 | **0** \| 1.5 | **0** \| 3.0 | **0** \| 1.3 |
| **Biceps** | **0** \| 4.5 | **0** \| 3.0 | **0** \| 6.0 | **0** \| 2.6 |
| **Forearms** | **0** \| 2.3 | **0** \| 1.5 | **0** \| 3.0 | **0** \| 2.6 |
| **Obliques** | **0** \| 4.5 | **0** \| 3.0 | **0** \| 3.0 | **0** \| 5.3 |
| **Hamstrings** | **0** \| 4.5 | **0** \| 3.0 | **0** \| 6.0 | **0** \| 5.3 |
| **Lower back** | **0** \| 0 | **0** \| 0 | **0** \| 0 | **0** \| 0 |

- **Never a primary mover on any main path:** biceps, obliques and lower back.
- **Hamstrings:** the equipment-free hinge path is glute-led. Glute Bridge, Hip Thrust and Single-Leg Hip Thrust all map hamstrings as secondary, and Nordics are an optional branch you can't adopt (F3).
- **Not in the taxonomy at all:** calves, adductors, abductors, rear delts and traps (folded into upper back), neck, rotator cuff and shins (`muscles.data.js:15-21`).

**Fix:** Stage 3.

### F9 · SLOW RAMP (low): no fast track for a big overshoot
**Reproduced:** 20/20/20 rated easy twice on a 6–12 range → a single step. "Not sure" starts Push at Wall Push-up, and reaching Push-up then takes five steps (wall, counter, table, chair, step), each needing two sessions. On Full body ×3 that's at least 10 push sessions, about 7 weeks. **Fix:** Stage 1's double step; Stage 2's choose and keep also lets you place yourself.

### F10 · COSMETIC (low): a stale comment
`DAY_ACCESSORY`'s comment (`basalt.js:2309-2318`) says Full-length accessories are excluded from progression, but W8 made them evidence (`PROGRESS-workout-progression.md` line 585). **Fix (Stage 1):** correct the comment.

### F11 · CONSTRAINT for Stage 3: any extra kind of session would break scheduling today
Nothing is broken today; this is a constraint on Stage 3.
- **Rotation:** `nextDayAfter` (`basalt.js:2279-2282`) restarts the template when the last session's type isn't in it.
- **Rest days:** `restOn` (`2293-2307`) rests the day after *any* session.
- **Attendance and habits:** attendance (`7020-7085`), the Hub's fitness habit (`js/gamify.js:236-249`) and the streak all count every completed session.

Mini-sessions need a session kind and a classification of every reader: 46 lines read `sessions` or `completedSessions()` across `fitness/` and `js/`.

**Checked, and nothing new found:** the evidence rules' handling of same-day sessions, legacy sessions without `rx`, goal changes, swaps, pain flags and recovery blocks. Full-length accessories counting as evidence is a recorded decision, not a bug.

**Not re-reviewed:** dates, sync, recovery offers and running (handoff items 3–4). R1–R3 covered them on 2026-10-01/02 and their fixes are in this tree. On heuristic labels (item 5), the Program and Muscles copy read as product rules ("a rule of thumb… it can't see your form", "not a strength measurement").

## Part B — Stage 1: fixes (schema stays v4)

### 1.1 · Harness and the "before" record
Case ids are `H` plus the finding they test, so H9 tests F9.
- **Node, in `tools/check-training.js`:** H1a, H2a–H2c, H9 and H5 (Part F).
- **Playwright, in `tools/check-workout.py`:** H1b (log 5 kg against a seeded 10 kg loaded slot; read the saved `rx`) and H6 (Goblet Squat's badge for a dumbbell-only user).
- **Fixture:** write `tools/fixtures/v4-midworkout.json` from **this** build. Stage 2's upgrade test needs a save written by a real v4 build, the way the v3 fixture was made.
- Every new case must FAIL with the numbers in Part F's "Before" column. A case that passes before its fix is a harness defect.

**Done when:** the before record is in the progress log, and the old cases still pass (44 Playwright plus the Node checks).

### 1.2 · Rule and data fixes
- **`training.js`** (F1, F2, F9):
  - `exposures` gains `weights`; `comparable` applies F1.
  - The new step-back condition.
  - `recommend` returns `double: true` and two steps when both evidence sessions are ≥ 1.5× the top. The first step is the normal one; the second is `stepUp` applied to it. If no second step exists, it's one step.
  - Named constants in `training.data.js`: `REDUCE_MIN_DROP = 0.10`, `DOUBLE_STEP_AT = 1.5`.
- **`basalt.js`:**
  - `rxAsLogged` saves a uniform logged weight (F1).
  - The card's "logged at X kg" line, and a *Set slot to X kg* choice stored as a decision `{ choice: "load", kg, at }`.
  - F6's three badges; F10's comment.
- **`training.data.js`:** `dip_6` needs `[BAR, [dumbbells or kettlebells]]`, and `EXERCISE_DB` matches it.
- **`service-worker.js`:** bump `CACHE_VERSION`.

**Done when:** every H case passes and every old case still passes.

### 1.3 · Review (R1)

## Part C — Stage 2: control (schema v5)

### C1 · Grip
- **Data:** `GRIPS = { values: [palms, knuckles], exercises: [the six ids] }`. `rx.setup.grip` is absent for palms, so all history stays palms.
- **Evidence:** a knuckle exposure is comparable to a palms `rx` (all other setup equal); the reverse isn't.
- **Steps:** `startOf(id, { grip })` sets the grip only on a capable id. `stepUp` and `stepDown` carry your standing grip to the next capable exercise.
- **Standing choice:** `training.grip = { push: "knuckles", at }`, a stamped record. Setting it rewrites the push slot's grip (stamped) when the current exercise is capable.
- **Per-session toggle:** *Knuckles today* is a build override, like Swap's.
- **Pain swaps** (finishing F4): a new `SUBSTITUTION_SETUPS` maps "Fist Push-up" and "Knuckle/Parallette Push-up" to `{ grip: "knuckles" }` on the same exercise. A pain swap is still flagged and still not evidence.
- **Guide text** (Stage 4) gets a knuckle section on each capable exercise: front two knuckles, wrist straight, start on a mat.

### C2 · Choose and keep
- **Picker:** Program → a slot → *Change exercise*, grouped as *On your path*, *Branches* (not skill-kind) and *Weighted*. Each shows equipment, exclusion and limitation status.
- **What gets saved:** a stamped `rx` (`why: "chosen by you"`). The setup (surface, angle, band, grip) can be set, and a starting load is optional; otherwise the first session's uniform weight sets it, as today.
- **Ready at a branch point:** the card's options become buttons, *Step into Archer Push-up*, stored as a decision `{ choice: "option", to, at }`.
- **Stepping back from a branch move:** `stepDown` also walks **offer parents**, so Archer → Decline.

### C3 · Exclusions and joint limitations
- **Exclusions:** `training.exclusions[id] = { state: "excluded" | "allowed", at, why }`. Stamped, never deleted (the `off` pattern).
- **Joint stress:** `JOINT_STRESS[id]` holds `{ wrist, elbow, shoulder, neck, lowerBack, hip, knee, ankle }` at 1 or 2; zeros are omitted.
  - Rubric: 2 means heavy or end-range load on that joint; 1 means moderate.
  - Knuckles lower wrist stress by 1.
- **Limitations:** `training.limitations = { wrist: "careful" | "avoid", …, at }`.
- **One `allowed(ctx, id)`** (owned, not excluded, not avoided) replaces `owns` wherever a prescription is chosen:
  - `prescriptionFor` and its fallback;
  - `stepUp` and `stepDown`, which **route around** a blocked rung by walking `next` until an allowed exercise appears;
  - assessment, swap lists and coverage picks.
- **Excluding your current exercise** opens the picker, with the nearest allowed easier movement preselected.

### C4 · Hold and custom sets/range
- **Hold:** `slot.hold = true` shows the evidence and the reason "holding — step-ups paused", with no Step up button.
- **Custom sets and range:** `slot.custom = { sets: 1–6, range: [lo, hi] }`.
  - Bounds: `lo ≥ 1`, `hi ≥ lo + 2`, reps ≤ 50, seconds ≤ 300.
  - `buildWorkout` uses the custom sets; "+1 set" adds to them; a recovery block cuts them ×0.6.
- **Both are stamped edits** of the slot record, so they sync by `acceptedAt` like any slot change.

### C5 · Equipment and the weights you own
- **New tokens and data:**
  - Band-Assisted Pull-up → bar + `bands`.
  - Straight Bar Dip and Korean Dip → `lowBar`.
  - Parallel Bar Dip → `dipBars`; Weighted Dip → `dipBars` + dumbbells or kettlebells.
  - Australian Row → `lowBar` or `rings`.
  - Front Lever 1–4 → `pullupBar` or `rings`.
  - Tuck L-Sit and L-Sit → `bench` or `parallettes`.
  - Bands get a tension setup (light → medium → heavy) wherever they load a movement.
- **Weights:** `equipmentLoads = { dumbbells: { mode: "adjustable", stepKg, maxKg } | { mode: "fixed", kg: [...] }, kettlebells: … }`. A load step goes to the next weight you have; at your heaviest it goes to the next movement, or the card says "heaviest you've listed".
- **Screens:** onboarding's equipment step and the Settings modal (`index.html:320`) list the new items, with "Weights you have" below.

### C6 · Schema v5 and sync
- **Version:** `SCHEMA_VERSION` = 5.
- **Defaults:** the four tokens false; `equipmentLoads` as today's steps; `training.exclusions = {}`; `training.limitations = null`; `training.grip = null`.
- **`toV5`:**
  - Infers each new token as true when the current slot's exercise or any logged session needs it (logged Parallel Bar Dips → `dipBars`).
  - Queues the *Equipment check* card.
  - Changes nothing else; it's additive.
- **`js/syncmerge.js` `mergeTraining`:** `exclusions` by `at` (as `decisions`); `grip` and `limitations` by `at` (as `assessment`). `equipmentLoads` merges field by field, local winning, like `equipment`, and that's documented.
- **Fixture:** Stage 2's close-out writes `tools/fixtures/v5-midworkout.json` from the Stage 2 build, for Stage 3.

### Stage 2 steps
- **2.1 Catalogue data:** grips, tokens on exercises and in `EXERCISE_DB`, `JOINT_STRESS` for all 86, `SUBSTITUTION_SETUPS`. Extend `check-training-data.js` with sections for grips, tokens and joint-stress completeness. The rubric is applied per exercise, and borderline calls are listed in the progress entry.
- **2.2 Pure rules (`training.js`):** grip evidence and carry, `allowed`, routing round blocked rungs, offer adoption and offer parents, hold, custom sets/range, owned weights, and a loaded *hold*. Stage 3's Suitcase Hold is the first loaded hold; check that `rangeFor` and `stepUp` handle `kind: hold` with `loadMode`.
  - **Also R1-1** (folded in 2026-10-03): `offLoad` ignores sessions dated before the slot rx's `acceptedAt`, so a load step no longer reads as off-load. A Node case first: a load step, then `recommend` → `no-history`; it FAILs before the fix with `off-load`. Details are in the progress log's R1 entry.
- **2.3 Schema v5 and sync** (C6), with `check-syncmerge.js` cases.
- **2.4 Engine wiring:** `prescriptionFor`, `buildWorkout` overrides, finalize (the grip goes into `rx`), `decide`'s new choices, swap lists, pain swaps, assessment. New engine calls: `chooseExercise`, `setExcluded`, `setLimitations`, `setGrip`, `setHold` and `setCustom`. Each stamps and saves.
- **2.5 Screens and close-out:**
  - **Program:** *Change exercise*, *Hold*, *Sets & range*, *Push-ups on*, the *Excluded exercises* card, the *Equipment check* card.
  - **Today:** option buttons, the holding copy, the *Knuckles today* toggle, "Knuckles" in the exercise line.
  - **Settings:** equipment, weights, limitations.
  - **Close-out:** README, service-worker bump, the v5 fixture.
- **2.6 Review (R2).**

## Part D — Stage 3: coverage (schema v6)

### D1 · 22 muscle groups
- **Groups:**
  - Kept: chest, front delts, side delts, upper back, lats, triceps, biceps, forearms, abs, obliques, lower back, glutes, quads, hamstrings.
  - New: **rear delts**, **traps**, **rotator cuff**, **neck**, **abductors**, **adductors**, **calves**, **shins**.
- **Assist flags:** lower back and obliques lose `assist` (they get primaries).
- **`MUSCLE_FLOORS`** (decisions table) goes beside `MUSCLE_WEEK`.
- **Existing rows** change only where the new group is a real prime or secondary mover, and every change is logged:
  - rows add rear delts and traps as secondary;
  - overhead pressing and handstands add traps as stabiliser;
  - Cossack, Deep and Bodyweight Squat add adductors as secondary.
- **`check-muscle-map.js`** now fails if any group lacks a primary somewhere.

### D2 · Coverage slots and exercises (64 new)
Each is a slot like the main eight: a `next` path whose first rung needs no equipment, plus loaded and banded options, all under the same evidence rules. `SLOTS[x].coverage = true` (not "accessory": that word already means Full length's extra). Every new exercise needs:
- an `EXERCISE_DB` entry with `pattern: "accessory"`, cues, mistakes and an injury line;
- a catalogue row;
- a muscle-map row;
- a joint-stress row;
- for holds, a hold range.

| Slot | Trains | Path (no equipment first) | With equipment |
|---|---|---|---|
| curl | biceps | Door-Frame Curl (lean: slight → moderate → deep) → Underhand Inverted Row (low bar / rings) | Band Curl · Dumbbell Curl · Hammer Curl |
| lateral | side delts | Isometric Lateral Raise in a door frame (hold) | Band Lateral Raise · Dumbbell Lateral Raise · Lean-Away Lateral Raise |
| reardelt | rear delts | Prone T-Raise → Reverse Snow Angel | Band Pull-Apart · Band Face Pull · Bent-Over Reverse Fly |
| cuff | rotator cuff | Wall Slide with Lift-Off → Prone W Raise | Band External Rotation · Side-Lying External Rotation |
| traps | traps | Pike Shrug | Shrug (dumbbells or kettlebells) · Band Shrug |
| neck | neck | Chin Tuck Hold → Four-Way Neck Isometric (hand resistance, seconds per direction) → Lying Neck Raise | — |
| grip | forearms | Towel Wring Hold → Towel Hang (bar) | Farmer Hold · Wrist Curl · Reverse Wrist Curl |
| quad | quads | Wall Sit → Reverse Lunge → Step-Up (stair or sturdy step) → Assisted Sissy Squat | Dumbbell Split Squat · Spanish Squat (band) |
| hamstring | hamstrings | Sliding Leg Curl (towel or socks on a smooth floor) → Single-Leg Sliding Leg Curl | Single-Leg RDL, bodyweight (branch) · Single-Leg RDL with dumbbell · Band Leg Curl |
| calf | calves | Calf Raise on a step → Single-Leg Calf Raise | Bent-Knee Calf Raise (branch) · Weighted Single-Leg Calf Raise |
| shin | shins | Wall Tibialis Raise (feet close → far) → Single-Leg Tibialis Raise | — |
| adductor | adductors | Side-Lying Adduction → Copenhagen Plank, knee on a chair (hold) → Copenhagen Plank, foot on a chair (hold) | Band Adduction |
| abductor | abductors | Side-Lying Abduction → Side Plank Abduction | Banded Lateral Walk · Banded Clamshell |
| antirot | obliques | Side Plank from Knees → Side Plank → Side Plank, top leg raised (holds) | Dead Bug (branch) · Pallof Press (band) · Suitcase Hold (loaded hold) |
| backext | lower back | Bird Dog → Prone Back Extension → Reverse Hyperextension (bench) | Dumbbell Good Morning |

Ids follow `acc_<slot>_<slug>`. Neck work carries its own safety copy: slow, no jerking, stop at dizziness, pain or tingling. *Avoid neck* excludes the whole slot.

### D3 · Finisher, mini-sessions and selection
- **The selector:** `fitness/coverage.js` is pure and Node-tested. It computes, per group:
  - **direct sets in 7 days:** performed sets where the group is primary, from every session;
  - **shortfall:** floor − (direct sets + today's planned direct sets);
  - **last direct day.**
  It picks coverage slots whose primaries fall short and weren't trained directly in 48 h, and whose prescription is allowed (C3). Ranking is shortfall ÷ floor, then days since last trained, then slot order. Pins come first: `training.pins[slot] = { days: [...], at }`. Each pick carries its reason, e.g. "Biceps: 0 of 6 direct sets this week".
- **Finisher:** `prefs.finisher` is `"off"` or `"on"`. `buildWorkout` appends the picks after the main slots as `finisher: true` exercises at the base set count. They're swappable and removable in the preview.
- **Mini-session:** an *Accessory session* button on the rest-day, done-today and ready screens. It builds 2–6 picks (`type: "mini"`, `kind: "mini"`) with a short warm-up and cool-down (new `WARMUPS.mini` and `COOLDOWNS.mini`). The recovery block applies.
- **Coverage slot records** are created on first pick at their first allowed rung (`why: "added for coverage"`). Choose and keep applies to them as to any slot.
- **Session readers:** add `engine.mainSessions()` and classify all 46 reads.
  - **Main only:** scheduling (rotation, rest gate, done-today, next session, `liftOn`, the run clash).
  - **Main only, with mini counted on its own line:** attendance.
  - **All sessions:** history, PRs, evidence, muscles, the BASALT streak and the Hub's fitness habit.
- **Phase report:** gains "Accessory sessions *n*".

### D4 · Measuring coverage
- **Muscles screen:**
  - gains a **Direct sets (7 d) vs floor** column;
  - "Neglected" means below the floor, or no direct work in 7+ days;
  - the template-relative column stays, renamed "vs your template".
- **Badges:** check `js/gamify.js:574-595`. *Full Coverage* and *all groups at L3* now span 22 groups; earned badges keep their stored date.

### D5 · Schema v6
- **Version:** `SCHEMA_VERSION` = 6.
- **Defaults:** `prefs.finisher = "off"`, `training.pins = {}`.
- **`toV6`** is additive. The bump exists so a v5 build opens a save holding coverage slots and mini-sessions read-only instead of misreading them. A v5 `recoveryOffer` would call `recommend` on an exercise id it doesn't know.
- **Sync:** `pins` merge by `at`. Coverage slots and mini-sessions use the existing slot and session rules.

### Stage 3 steps
- **3.1 Taxonomy and upper-body coverage data:** D1, plus the curl, lateral, reardelt, cuff, traps, neck and grip slots (29 exercises). Extend `check-training-data.js` (coverage slots) and `check-muscle-map.js` (22 groups, a primary for every group).
- **3.2 Lower-body and trunk coverage data:** quad, hamstring, calf, shin, adductor, abductor, antirot and backext (35 exercises). The same checks pass.
- **3.3 Coverage logic:** `fitness/coverage.js` and `tools/check-coverage.js`.
- **3.4 Sessions and schema v6:** D3's builder, session kind, the classification of all 46 readers (each listed with its class in the progress entry), the report line, D5, and sync cases.
- **3.5 Screens and close-out:**
  - **Workout screen:** the finisher toggle and preview.
  - **Mini-session entry points.**
  - **Program:** a *Coverage* card with each slot's prescription and pins.
  - **Muscles:** the D4 columns and the badge check.
  - **Close-out:** README and the service-worker bump.
- **3.6 Review (R3).**

## Part E — Stage 4: the exercise directory (no schema change)

### E1 · Body map
- **Source:** `react-native-body-highlighter` (MIT; front and back SVG paths with named regions; verified on GitHub 2026-10-03). `react-body-highlighter` (also MIT) credits its polygons to it, and neither repo names the original artist.
- **Data:** fetch it at a pinned commit and record the SHA. Ship its licence as `vendor/LICENSES/react-native-body-highlighter.txt`. Build `fitness/bodymap.data.js` (`window.BODY_MAP = { viewBox, front: [{ id, group, d }], back: [...], outline }`).
- **Mapping to the 22 groups:**

| Region | Becomes |
|---|---|
| deltoids, front view | front delts and side delts |
| deltoids, back view | rear delts and side delts |
| upper-back | lats and upper back |
| trapezius | traps |
| abductors | abductors |
| tibialis | shins |
| rotator cuff | a new region over the scapula |
| head, hair, hands, feet, knees | outline only |

- **Renderer:** `fitness/bodymap.js`, `App.bodymap.render(host, { mode: "tiers", profile } | { mode: "heat", values }, { onTap })`.
  - Shows front and back, stacked when narrow, with a legend.
  - Every region has an `aria-label` ("Biceps — primary") and can be focused.
  - Colours come from palette tokens, in both themes.
- **Where it appears:**
  - the guide modal, replacing the static-bar fallback for every exercise without authored phases (the 14 animated ones stay);
  - the Muscles screen, as a 7-day heat map that opens the existing detail modal;
  - every exercise page.

### E2 · The written guide
`window.EXERCISE_CONTENT[id]` holds:

| Field | Contents |
|---|---|
| `summary` | One sentence |
| `setup` | 2–5 steps |
| `steps` | 3–6 steps, start to finish of a rep |
| `breathing` | — |
| `tempo` | — |
| `feel` | Where you should and shouldn't feel it |
| `mistakes` | 2–4 `{ mistake, fix }` |
| `safety` | 1–3: who should skip or modify it, and when to stop |
| `variations` | Optional; push family gets a `grip.knuckles` section |

Easier and harder versions, muscles and "in your program" come from the catalogue and history; they aren't written.

The style guide (written in step 4.3):
- original wording, never copied;
- plain English, second person, metric;
- no medical claims ("prevents injury", "fixes posture");
- never restates a rep range;
- consistent with each exercise's cues.

`tools/check-exercise-content.js` checks:
- every DB id is covered;
- required fields and length bounds;
- a banned-phrase list;
- variation ids resolve;
- grip sections appear only on capable ids.

**Files** (so the batches never touch each other): `fitness/content/batch-a.js` (push, shoulder, dip: 39), `batch-b.js` (row, pull, squat, hinge, core: 47), `batch-c1.js` (upper-body coverage: 29) and `batch-c2.js` (lower-body and trunk coverage: 35). The 12 exemplars in step 4.3 live in their batch's file. Step 4.3 adds all four script tags and service-worker entries up front.

### E3 · The Exercises section
`fitness/directory.js` registers `exercises` in `App.SECTIONS`.
- **List:** search (name, aliases such as "knuckle push-up") and filters (muscle by tapping the map, slot, *doable with my equipment*, kind, difficulty, *show excluded*), ordered by slot then ladder position.
- **Exercise page:** tags, a joint-stress chip, the body map in tiers with a muscle list, the written guide, easier/harder links from the graph, and *In your program* (current prescription, last three sessions, PR).
- **Actions:** *Train this in my ⟨slot⟩* (choose and keep), *Exclude / Allow*, *Pin to my finisher*.
- **Workout link:** "How to do this" opens the same page.

### Stage 4 steps
- **4.1 Body-map asset:** E1's data, plus `tools/check-bodymap.js` (every group has a region, regions map to known groups, ids are unique, paths parse, the licence and SHA are present). Take a screenshot per group, alone, in both themes at 390 px, and list any region that looks wrong.
- **4.2 Body-map component and its two placements.**
- **4.3 Guide schema, style guide, checker and 12 exemplars:** Push-up (with knuckles), Incline Push-up, Pull-up, Table Row, Bodyweight Squat, Bulgarian Split Squat, Hip Thrust, Nordic Curl Negative, Plank, Pike Push-up, Parallel Bar Dip, Dumbbell RDL.
- **4.4–4.7 Guide batches A, B, C1 and C2.** Each writes only its own file.
- **4.8 The Exercises section and close-out:** README and the service-worker bump.
- **4.9 Review (R4).**

## Part F — verification

The house rule holds: every new case FAILs with the "Before" numbers before its fix, and an ERROR is a harness defect, never evidence.

| Case | Where | What | Before | After |
|---|---|---|---|---|
| H1a | Node | 10 kg prescribed, two sessions logged at 5 kg, 3 × 12 just right | `ready`, step to 12.5 kg | `repeat`, "logged at 5 kg, not 10 kg" |
| H1b | Playwright | Seeded 10 kg slot; log 5 kg × 3 by clicks | saved `rx` load 10 | saved `rx` load 5 |
| H2a | Node | 15/15/15 → 14/14/14 → 13/13/13, hard | `reduce` → Incline | `repeat` (effort) |
| H2b | Node | 12/12/12 → 12/12/11 → 12/11/11 | `reduce` | `repeat` |
| H2c | Node | 12/12/12 → 10/10/9 → 8/7/7 (control) | `reduce` | `reduce` |
| H9 | Node | Wall Push-up 20/20/20 easy, twice | one step (counter) | two steps (table), `double: true` |
| H5 | Node | `owns({ dumbbells }, "dip_6")` | true | false |
| H6 | Playwright | Dumbbells only; Goblet Squat's swap badge | "needs kettlebells" | "ready" |
| K1 | Node | Palms `rx`, two knuckle sessions at the top / knuckles `rx`, two palm sessions | — | `ready` / `repeat` |
| K2 | Node | Knuckles carried Push-up → Diamond (palms) → Decline (knuckles) | — | as stated |
| K3 | Node | Diamond excluded: step from Push-up | — | Decline |
| K4 | Node | Knees "avoid": squat steps skip knee-stress-2 rungs | — | as stated |
| K5 | Node | Decline ready → *Step into Archer*; step back from Archer | — | Archer; Decline |
| K6 | Node | Hold: ready evidence / declining evidence | — | no step; step back still offered |
| K7 | Node | Custom 4 × 8–10 | — | ready needs 4 sets at 10 |
| K8 | Node | Fixed dumbbells 5, 7.5, 12.5: steps from 7.5, then from 12.5 | — | 12.5; no load step |
| K9 | Playwright | v4 fixture → v5 | — | slots unchanged; `dipBars` inferred from a logged Parallel Bar Dip; the card shows once |
| K10 | Node sync | Exclude on A, then allow on B; grip and limitations by stamp | — | newer stamp wins on both devices |
| K11 | Playwright | Program → Change → Archer Push-up; reload; build | — | persists; the workout trains Archer |
| K12 | Playwright | Push-ups on Knuckles; finish a session / pain swap for the wrist on palms | — | `rx` grip knuckles, 0 pain flags / knuckle grip, flagged |
| K13 | Playwright | Doorway bar only, Two-Chair Dip ready | Parallel Bar Dip offered | no Parallel Bar Dip; "needs dip bars" |
| V1 | Node | `check-muscle-map.js`: 22 groups, each with a primary; every coverage slot has an equipment-free rung | — | OK |
| V2 | Node | `check-coverage.js`: shortfalls, the 48 h rule, deterministic picks, pins first | — | as fixtures say |
| V3 | Playwright | Mini-session on a rest day | — | still a rest day; next main type unchanged; attendance unchanged; the Hub habit and streak count it |
| V4 | Playwright | Finisher on: 4 picks after the main slots; two sessions at the top → ready | — | as stated |
| V5 | Playwright | v5 fixture → v6 | — | main program unchanged; no coverage slot until picked |
| V6 | Node sync | Pins by stamp; mini-sessions union by id | — | as stated |
| V7 | Playwright | Rows only, no curls, for 7 days: Muscles | — | Biceps "Neglected", 0 of 6 direct |
| V8 | Playwright | Report with 2 mini-sessions | — | adherence unchanged; "Accessory sessions 2" |
| D1 | Node | `check-bodymap.js` | — | OK |
| D2 | Node | `check-exercise-content.js`, every id | — | OK |
| D3 | Playwright | Search "knuckle" / tap Biceps | — | Push-up's knuckle section / curls first, then rows |
| D4 | Playwright | *Train this in my push slot*; *Exclude* | — | slot set; gone from Swap |
| D5 | Playwright | "How to do this" from a workout; the 14 animated entries | — | the same page; animation still renders |
| D6 | Playwright | Selene and Selene Day, 390 and 1920 px | — | 0 overflow, 0 page errors, map visible |
| D7 | Playwright | Offline after install | — | every new file served from cache |

Every stage reruns the full suite: `check-workout.py`, `check-syncmerge.js`, `check-training.js`, `check-training-data.js`, `check-muscle-map.js` and that stage's new checks.

## Part G — chat windows, models and effort

### Rules for every window
1. **Set the model and effort first.** In the new window, run `/model <name>`, then `/effort <level>`, before pasting anything. `/model` saves itself as the default for new windows, so set both every time.
2. **Start in** your checkout of the repo on the machine you're using, on branch `fitness-plan` (Part H). On Talon that is `/home/talon/SyncedWork/Claude/Helth`, the path your last plan used.
3. **Read first:** this plan and `plans/PROGRESS-fitness-control-and-coverage.md`. W1 creates the progress log.
4. **Do only your step,** and stop at its "Done when".
5. **Back up first:** a timestamped backup of every file over ~200 lines before editing it.
6. **Prove it:** quote the harness lines before and after. A claim that wasn't run is labelled unconfirmed.
7. **Don't commit or push.** The handoff commit in Part H is yours to make, between windows.
8. **Ship it:** a changed precached file means a `CACHE_VERSION` bump. A new file goes in `PRECACHE` and `index.html`.
9. **Hand off:** append to the progress log: date, window, files changed, harness lines, deviations from this plan, anything left over. Then stop.

**Run the windows one at a time, on one machine at a time.** Each starts from the previous window's tree. You can move to the other machine between any two windows (Part H), never in the middle of one.

| Window | Step | Model | Effort | Starts after | Why this setting |
|---|---|---|---|---|---|
| W1 | 1.1 harness and v4 fixture | Sonnet 5.5 | high | You approve Stage 1 | Cases fully specified in Part F |
| W2 | 1.2 rule and data fixes | Opus 5.5 | high | W1 | Evidence rules: small diffs, subtle edges |
| R1 | 1.3 review | Opus 5.5 | high | W2 | Fresh eyes; verifies by running |
| — | **You:** read R1, commit Stage 1, approve Stage 2 | | | | |
| W3 | 2.1 catalogue data | Sonnet 5.5 | high | Stage 2 approved | Data to fixed tables; the checks catch typos |
| W4 | 2.2 pure rules | Opus 5.5 | high | W3 | Grip, routing, options and loads interact |
| W5 | 2.3 schema v5 and sync | Opus 5.5 | **xhigh** | W4 | A migration over real history, plus merge rules |
| W6 | 2.4 engine wiring | Opus 5.5 | high | W5 | Builder, finalize and swaps in a 9,275-line file |
| W7 | 2.5 screens and close-out | Sonnet 5.5 | high | W6 | UI to a fixed spec; README; v5 fixture |
| R2 | 2.6 review | Opus 5.5 | high | W7 | As R1 |
| — | **You:** read R2, commit Stage 2, approve Stage 3 | | | | |
| W8 | 3.1 taxonomy and upper-body coverage data | Sonnet 5.5 | high | Stage 3 approved | Data entry to Part D's tables |
| W9 | 3.2 lower-body and trunk coverage data | Sonnet 5.5 | high | W8 | As W8 |
| W10 | 3.3 coverage logic | Opus 5.5 | high | W9 | The selection rule and its edge cases |
| W11 | 3.4 sessions and schema v6 | Opus 5.5 | **xhigh** | W10 | 46 session readers to classify; the rotation and rest gate must not move |
| W12 | 3.5 screens and close-out | Sonnet 5.5 | high | W11 | UI to a fixed spec |
| R3 | 3.6 review | Opus 5.5 | high | W12 | As R1 |
| — | **You:** read R3, commit Stage 3, approve Stage 4 | | | | |
| W13 | 4.1 body-map asset | Opus 5.5 | high | Stage 4 approved | SVG region surgery, judged visually |
| W14 | 4.2 body-map component | Sonnet 5.5 | high | W13 | A renderer to a fixed API |
| W15 | 4.3 guide schema and 12 exemplars | Opus 5.5 | high | W14 | Sets the bar every batch copies |
| W16 | 4.4 guides A (push, shoulder, dip) | Sonnet 5.5 | high | W15 | Writing to the style guide; the checker gates it |
| W17 | 4.5 guides B (row, pull, squat, hinge, core) | Sonnet 5.5 | high | W15 | As W16 |
| W18 | 4.6 guides C1 (upper-body coverage) | Sonnet 5.5 | high | W15 | As W16 |
| W19 | 4.7 guides C2 (lower-body and trunk) | Sonnet 5.5 | high | W15 | As W16 |
| W20 | 4.8 Exercises section and close-out | Sonnet 5.5 | high | W16–W19 | UI to E3's spec |
| R4 | 4.9 review | Opus 5.5 | high | W20 | As R1 |

`max` isn't assigned anywhere. If a review sends W5 or W11 back, rerun that window at `max`.

**What to paste.** Use the same text in every build window, changing only the window and the step:

```
You are window W10 of plans/PLAN-fitness-control-and-coverage.md. Read that
plan and plans/PROGRESS-fitness-control-and-coverage.md in full, then do step
3.3 and nothing else, following Part G's rules. Append your progress entry
when you're done, then stop.
```

In W1 only, add one sentence: *The progress log doesn't exist yet, so create it.*

Review windows get this instead:

```
You are review window R2 of plans/PLAN-fitness-control-and-coverage.md. Read
the plan, the progress log and the Stage 2 diff (git diff -- fitness js tools
service-worker.js index.html README.md). Re-run every harness in Part F, drive
the changed screens yourself, and report findings ranked with the house
severity labels, each verified by running. Change no code.
```

## Part H — working across two machines

You start on this machine (fatty) and carry on from the main one, one window at a time. A window starts from the plan and the progress log, never from chat memory, so you can hand off between any two windows. A Claude session can't move machines, so never hand off in the middle of one. If a window stops half-way, finish it where it is, or throw its changes away and run it again.

**One branch.** All the work goes on `fitness-plan`, branched from `android` at `c7015a2`. The stage commits after R1–R4 go there too. `android` isn't touched until you choose to merge.

### Setup, once per machine

| Where | Do |
|---|---|
| This machine (fatty) | `git clone https://github.com/talon270/wellness-hub.git ~/helth`, then `cd ~/helth && git checkout android && git checkout -b fitness-plan`, then `cp ~/claude/PLAN-fitness-control-and-coverage.md plans/`. Keep the clone **outside** `~/claude`: that folder syncs to Talon. Then run `python3 -m playwright install chromium`. Python Playwright is installed here but has no browser, so `tools/check-workout.py` cannot launch (checked 2026-10-03), and W1, W2 and every stage end need it |
| Main machine | In the existing checkout, `git cat-file -t c7015a2` must print `commit` (the first bundle builds on it), and `git status` should show no uncommitted edits to tracked files: stash or commit them first, or they ride into your next handoff commit. Leave this checkout alone while you work here |

If git has no name and email on a machine, it asks on the first commit: `git config user.name …` and `git config user.email …`.

### Handing off

At the end of any window, on the machine you're leaving:

```
cd ~/helth
git add -A -- . ':!*.backup-*' ':!*__pycache__*'
git commit -m "WIP: W3 done"        # name the last window you finished
git bundle create ~/claude/fitness-plan.bundle android..fitness-plan
```

The two `:!` parts matter. `.gitignore` covers neither backups nor `__pycache__`, so a bare `git add -A` would commit every `.backup-*` copy the windows make. Backups stay on the machine that made them, which is fine: they're a local safety net.

On the machine you're moving to, once Syncthing shows the bundle up to date on both sides (if `verify` fails, the sync hasn't finished: wait and retry):

```
# the first time
git bundle verify <synced folder>/fitness-plan.bundle
git fetch <synced folder>/fitness-plan.bundle fitness-plan:fitness-plan
git checkout fitness-plan

# every time after that
git checkout fitness-plan
git bundle verify <synced folder>/fitness-plan.bundle
git pull --ff-only <synced folder>/fitness-plan.bundle fitness-plan
```

`<synced folder>` is `~/claude` here and wherever the "Soomaries" folder lands on Talon. `--ff-only` is the safety net: if both machines have committed since the last handoff, it stops with "Not possible to fast-forward" and merges nothing.

**What doesn't travel:** backups, Claude sessions and their memory, anything uncommitted.

**Rules**
1. One machine at a time. Don't start a window on the other machine until `git log -1` there shows the handoff commit.
2. Edit the plan only in the repo copy. The copy in `~/claude` is just the seed and goes stale.
3. Instead of a bundle you could push the branch to GitHub and pull it on the other machine. The repo is public, so the half-finished work would be public too.

## Evidence and assumptions

| Solid: measured, or in the code | Assumed: product choices you can change |
|---|---|
| F1, F2, F5 and F9: Node probes against `training.js`, 2026-10-03 | Floors, coverage ranges, the 10% step-back drop, the 1.5× double step |
| The coverage table: `muscles.data.js` plus the templates at `basalt.js:2238-2272`, for the exercises named above it | 4 picks, the 48 h rule, mini-session size |
| F3, F4, F6, F7, F10 and F11: the lines cited; F3's slot writers and F11's 46 session reads re-counted by grep over `fitness/` and `js/` | `JOINT_STRESS` scores (a rubric, applied by judgment) |
| Both body-map repos are MIT (GitHub, 2026-10-03) | Region splits on the map |
| The Part H commands, run end to end in a throwaway copy on 2026-10-03: commit, bundle, first fetch, hand-back, and the refusal when both sides commit. Launching Chromium through Python Playwright fails on the fatty machine: no browser is downloaded | The branch name, and a bundle over a GitHub push. `playwright install chromium` is not yet run, so it is untested on this machine |
| Model prices from the `claude-api` skill's model table (cached 2026-09-25): Fable 5.1 $10/$50, Opus 5.5 $4/$20, Sonnet 5.5 $2/$10 per million tokens | Which existing muscle rows gain the new groups |

The app can't judge technique, diagnose an injury or measure recovery. Limitations, effort and form are self-reports, and every screen that uses them says so next to the number or filter it qualifies.

## Out of scope
- **Your own custom exercises,** and fully custom day templates (choosing which main slots a day trains). Pins cover coverage work only.
- **Photos, video,** and an animated figure for every exercise.
- **Warm-ups, cool-downs and mobility routines** in the directory.
- **Left/right logging** for unilateral work.
- **Medical work:** diagnosis, rehab plans, form checking.
- **Running, tombstones, release work,** and commits or pushes unless you ask.
