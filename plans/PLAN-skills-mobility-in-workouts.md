# Skills and mobility inside normal workouts — plan

Written 2026-10-07, against branch `yellow-dude` at `9b0de28` (schema v8).
Method: line-level reads of `fitness/basalt.js` (workout builder, Today view, active workout, finalize, Skills view), `fitness/training.js` (`recommend`, `exposures`), `fitness/training.data.js` (`rangeFor`, `SKILL_STANDARD_SEC`), `fitness/directory.js` (actions), `js/views/mobility.js` (routines, player, counter) and `js/syncmerge.js` (`mergeTraining`). Two Playwright probes against the real app, onboarded through the wizard (scratchpad `probe.py`, `probe2.py`): `App.skills.suggestFor` for every day type, `App.engine.chooseExercise` on a skill, the slots each day trains, and the slot of every rung in every skill track.
**Nothing below is implemented — this is the plan.**

## Status — approved and built 2026-10-07

Approved as written. Built on `yellow-dude` on top of `9b0de28`, with a second agent's Today redesign and Progression view landing in the same files mid-build (reviewed below). Nothing committed.

**Deviations from the plan.**
1. **The mobility tick sits under *Adjust workout*.** The redesign folded the preview controls into two `<details>`; the row went with the finisher.
2. **Push/Pull/Legs pull day without a bar gets no suggestion**, not an L-sit. That day trains only the row, so no core-family skill rides on it by the B2 rule, and the card is not drawn. With a bar it suggests Front Lever (SM5).
3. **The harness follows the redesign in two helpers.** `open_today` opens both `<details>`; `complete` answers the new "Finish a partial session?" dialog with *Finish partial*, which is what every older case measured. V5 and Y6 exclude v9's two default keys by name and assert their defaults, as v8 did for `weeklyDays`.
4. **No second cache bump.** `service-worker.js` is already v95 against `HEAD`'s v94 from the other agent's change, and nothing shipped between.

**Check lines.** "Before" is `9b0de28` through `git archive`.

| Check | Before | After |
|---|---|---|
| SM1–SM7 | 0 pass, 7 fail (SM5: `['handstand', 'handstand', 'handstand']` for the three split days) | 7 pass |
| SM8 | — | pass: 0 px overflow on Skills, Today and the workout at 390 / 1440 / 1920 in Selene and Selene Day, 0 page errors |
| SM9 (Node) | FAIL: A keeps `handstand:skill_handstand_1`, loses `lsit` | PASS |
| Skill-track checker section | — | passes; on a copy with `skill_planche_1.next → push_alt_wide` it fails "leaves the track" |
| Full `check-workout.py` | — | 101 pass, 3 fail (V5, Y6, R4e), 0 error; after the V5 / Y6 update those two rerun alone and pass, leaving R4e (below) |
| Eight Node checks | — | all exit 0 |

## Review of the other agent's changes (2026-10-07)

Its changes: a read-only Progression view (`fitness/roadmap.js`, a nav entry, `Training.stepUp` exported); Today folded into *Start workout*, *Adjust workout* and *Full exercise preview*; a "Next training day" card; an active-workout progress card and aria labels; the set ✓ no longer fills in the target; completing with blank sets asks first. It builds on this plan's `training.skills` and `skill:` keys and reads them correctly.

| Finding | Severity | Status |
|---|---|---|
| R1 · The Fitness nav now has 10 buttons and wraps to two rows at 1440 px in all 21 palettes (R4e: "Selene 10 buttons, 2 rows, 1217 of 1120 px"). The Progression entry is the tenth | BUG (medium) | open — your call |
| R2 · Every `check-workout.py` case that clicked into the folded preview or completed a partly logged session failed: the stopped run had about 45 ERROR from `TimeoutError` and `IndexError` before being cut short. The harness wasn't updated with the redesign | BUG (high), harness only | fixed by deviation 3 |
| R3 · Two behaviour changes without a plan: the set ✓ refuses an empty set and toasts, and Complete opens an in-app "Finish a partial session?" dialog. It's the app's own modal, not `confirm()`, but it is a confirmation gate on a common path | DESIGN RISK | open — confirm you want both |
| R4 · At 390 px a hold set's ✓ sits past the card's right edge: 10 px on `9b0de28` (Plank), 20 px now, since the ✓ grew to 44 px. Skill holds inherit it | COSMETIC, pre-existing, made worse | open |
| R5 · The roadmap prints a skill as "3 sets × 45 sec"; the standard is a ceiling ("up to 45 s" in Skills and the workout) | COSMETIC (low) | open |

## Shape

| Question | Answer |
|---|---|
| Who opens this and when? | You, at the start of every strength session, in the Begin preview. Speed matters more than onboarding: the skill and mobility blocks must already be filled in when the preview opens |
| The one thing it must never get wrong | A skill block must never cost a main slot its progression. Skill sets save with no `slot`, so no slot's evidence, Progress card or step-up can read them |
| Honest confidence of the central number | Skill standards (`SKILL_STANDARD_SEC`) are product guesses from each rung's readiness text, and the file says so. The workout card prints "up to 15 s, a product guess" beside the range, the same way slot ranges do |
| When the data source dies | Nothing external. If `Hub.mobility` is missing (the Mobility script failed), the mobility row is not drawn and the workout still begins. The skill block needs only `TRAINING_DATA` |

## Part A — findings, ranked

### A1 · MODEL GAP (high): a skill rung can never be logged anywhere

Four guards keep `kind: "skill"` movements out of every workout:

| Where | What it does |
|---|---|
| `basalt.js:3500` `chooseExercise` | "is a skill attempt — it stays in Skills." |
| `basalt.js:8838` Change exercise | filters `kind !== "skill"` out of the picker |
| `basalt.js:3820` `nearestAllowed` | skips skill rungs when a slot falls back |
| `directory.js:523` actions | "Skill attempts stay in Skills, so they can't be a slot's exercise." |

The Skills view (`basalt.js:11232–11329`) only lists rungs and opens guides. It has no logger. So "stays in Skills" means "is never logged". Measured on a fresh profile: 0 sessions hold a `skill_*` exercise, and `chooseExercise` returns an error.

The consequence is a whole progression system that is built but unreachable. `rangeFor` (`training.data.js:888`) prescribes skills as 3 sets up to a standard. `SKILL_STANDARD_SEC` holds 34 standards. `recommend` has a `no-standard` branch for skills. None of it ever runs, and no skill hold can ever set a PR.

The guards were right to exist. `PLAN-fitness-control-and-coverage.md` decided "skill-kind moves as a slot's exercise: not allowed". A planche tuck in the push slot would replace push-up progression. This plan keeps that decision. Skills get their own block **beside** the slots, never inside one.

**Fix:** Part B. The four guards stay as they are.

### A2 · BUG (medium): Push/Pull/Legs and the 5-day split get the wrong skill suggestion

`App.skills.suggestFor` (`basalt.js:11205`) maps day types by name. Its map predates the v8 templates. Every day type it does not list falls back to `map.push`. Measured:

| Day | Trains | Suggested | Should be |
|---|---|---|---|
| `splitpull` | row | Handstand ("while your shoulders are fresh") | Front Lever, or L-sit with no bar |
| `splitlegs` | squat, hinge, core | Handstand | L-sit (as `legs` gets) |
| `whole` | push, row, squat, hinge, core | Handstand | Handstand (correct by luck) |

So on a 6-day Push/Pull/Legs week, all three days suggest a handstand.

**Fix:** derive the pairing from the slots the day trains (B2), not from its name. That fixes every template now and every template added later. Matching names would fix only today's four.

### A3 · MODEL GAP (medium): workout mobility is fixed, and it counts for nothing in Mobility

A workout's mobility is the day's `WARMUPS` / `COOLDOWNS` checklist (`basalt.js:2070–2155`): four fixed drills per day type. The six Hub routines in `js/views/mobility.js` cannot be attached to a session. These are Wrist Prep, Morning Joint Flow, Desk Reset, Hip & Shoulder, Spine Decompression and Hip Rotation.

Also, the Hub's daily mobility count (`d.mobility`) is written only at `mobility.js:238` and `:331`, by the Mobility view's own players. A workout cool-down done to the last tick never reaches the Mobility stats or its badges (`gamify.js:463`).

**Fix:** B6. A routine attached to a session, counted on the session's day when every step is ticked.

### A4 · INCONSISTENCY (low): two mobility libraries

Skills → Mobility (`basalt.js:11139`, `MOBILITY`) is a second set of five static routines. It has its own wording, no player and no counter. Its "General Warm-up" overlaps Morning Joint Flow. The "Hip & Ankle" routine overlaps Hip Rotation.

**Fix:** not in this plan (see Out of scope). It is listed so that B6 is not mistaken for it. B6 draws only from the Hub's six.

## Decisions this plan makes for you

Override any row when you approve.

| Decision | Default | Alternative |
|---|---|---|
| Where skill work sits | First, after the warm-up, before the main slots. The Skills page already says "train a skill fresh, early in a session" | Last, or your choice per track |
| Which days a skill rides on | **Days that train its family**, derived from the day's slots (table in B2). One per-track tick, *Every session*, overrides that | Weekday pins, like coverage. These break on the every-other-day rotation, whose days don't fall on fixed weekdays |
| How many tracks at once | No cap. The preview's time estimate counts each one, and each has a per-session *Remove* | Cap at two |
| Sets | `rangeFor`'s: 3 attempts, up to the rung's standard. Volume mode (+1 set) doesn't touch them. A deload phase or recovery block cuts them like coverage work | Ignore deloads |
| Step up | The existing evidence rule: 2 sessions on different days, every attempt at the standard, rated Easy or Just right. The card offers Step up / Repeat. A rung with no standard never offers one | Manual only |
| Do skill sets count for muscles | Yes. Coverage counts them as direct sets for their primary muscles (`muscles.data.js` maps 46 skill entries), as it does every hold | No — skill sets are practice |
| Mobility block | **Off until you tick it**, like the finisher. When on, the preview pre-selects a suggested routine and prints why. You can pick another or untick it for the session | On by default |
| Where the routine sits | Wrist Prep and Morning Joint Flow go **before** the main work, after the warm-up. The other four go **after**, before the cool-down | Always after |
| Mobility counts in the Hub | Once per session, when every step is ticked, on the session's `dayKey`. Never today's date: a session begun at 23:50 and finished at 00:20 belongs to the day it began | Count partial routines |

## Part B — the build

Each step can ship on its own. Backups (`*.backup-YYYYMMDD-HHMMSS.*`) are taken before any file over 200 lines is edited.

### B1 · Schema v9 and sync

- `SCHEMA_VERSION = 9`, with `toV9` in `migrate`. It adds `training.skills = {}` and `prefs.mobilityBlock = "off"`. It is additive: nothing existing changes shape.
- `training.skills[track] = { exerciseId, setup, acceptedAt, every, at, off }`. This is a slot record's shape plus `every` (the tick) and `off`. *Stop training* writes a stamped `{ off: true, at }`, never a deleted key, so a sync carries it. This is how pins clear (`basalt.js:3621`).
- `healState` adds `"skills"` to the training maps it repairs (`basalt.js:714`).
- `js/syncmerge.js` `mergeTraining`: `skills: recordsByStamp(f.skills, l.skills, "at")`, written only when a side has it, like `pins`.
- A v8 build that opens a v9 save shows the read-only banner and leaves the key untouched. That is the existing version guard, re-checked as a case.

### B2 · The pairing rule: one function, used by the block and by the suggestion

`skillFamily(track)` is read from the track's rungs' slots: `push`/`shoulder`/`dip` → push, `row`/`pull` → pull, `core` → core. A track rides on a day when the day's `slotsFor(day)` holds a slot of its family. With today's data (probe 2):

| Track (family) | Rides on |
|---|---|
| Planche, Handstand (push) | push, fullA, fullB, upper, whole, splitpush |
| Front Lever, Back Lever, Muscle-up (pull) | pull, fullA, fullB, upper, whole, splitpull |
| L-sit (core) | push, pull, legs, fullA, fullB, lower, whole, splitlegs |

`suggestFor(dayType)` is rewritten on the same rule. It picks the first track in `TAB_ORDER` that rides on the day and that you can train with your equipment. That fixes A2. The table is a product rule, not an exercise-science claim, and the Skills page says so in one line.

### B3 · Choosing a skill to train (Skills view and Exercises)

- Each track tab gains one panel at the top:
  - **Not training:** *Train in my workouts*, which starts at the first rung your equipment and joint limits allow (`Training.allowed`). It also shows a *Start at* select of every allowed rung.
  - **Training:** "Training: Tuck Planche · 3 × up to 15 s · rides on Push, Upper and Full Body days". It shows the *Every session* tick, *Stop training*, and the latest session's values.
- The current rung is marked in the rung list.
- `directory.js:523`: the skill line becomes "Skill attempts train in their own block, before your main work". It adds a *Train this skill from here* button that sets the track at this rung. The result shows as an inline message, never `alert()`.
- `engine.setSkill(track, exerciseId | null, o)` writes the record and is the only writer.

### B4 · The skill block in the workout

- `buildWorkout` prepends one exercise per active track that rides on the day. It uses `rxStart(exerciseId, setup)` and `exerciseFromRx(null, rx, count)`, with `skill: track` and **no `slot`**. The preview's *Remove* writes `overrides["skill:" + track] = false`, for this session only.
- The active workout renders it with the existing `exerciseBlock`: hold timer, effort and pain flag. *Swap* is replaced by "Change rung in Skills". The meta label reads the track's name, not the pattern.
- `finalizeSession` saves `skill: track` on the exercise. `_checkPR` already records hold PRs.
- `cardRec(ex)` gains one branch: `ex.skill` → `engine.skillRecommend(track)`, which is `Training.recommend` on the track's rx. *Step up* writes the next rung through `setSkill`. A step is taken only to a rung in the same track. `tools/check-training-data.js` asserts that every `next` of a track rung stays inside its track, so drift fails the check instead of jumping tracks.
- The skill reminder card stays for anyone training no skill. Its button becomes *Add to my workouts* (B3's panel). With a track active, the card is not drawn: the block replaces it.

### B5 · Time estimate

The preview's minutes (`basalt.js:4583`) add each skill at sets × (standard, or 20 s with none) plus the hold rest. They also add the routine's total seconds. The 20 s fallback is a named constant, with "a guess" in its comment.

### B6 · The mobility block

- `mobility.js` exposes `Hub.mobility = { routines: ROUTINES, byId: ROUTINE_BY_ID }`. That is data only, and the player is not exposed. Each routine gains `when: "before" | "after"` (Decisions table).
- The Begin preview gets a *Mobility* row beside *Finisher*. It has a tick (`prefs.mobilityBlock`), a routine select and a reason line:

| Day contains | Suggested | Reason printed |
|---|---|---|
| a push-family slot, or a Planche/Handstand rides today | Wrist Prep | "Push day — wrists carry load they aren't used to" |
| squat or hinge, no push | Hip Rotation | "Leg day — hips that only hinge and squat lose their turn" |
| anything else | Hip & Shoulder | "The two limiters" |

- The workout shows it as a section, *before* or *after* per `when`. It uses the existing `checklist()` and its mini timers, with the routine's steps as `{ name, detail: sec + " s", seconds, cue }`.
- `finalizeSession` saves `mobility: { routine, done, of }`. When `done === of`, it runs `Hub.editDay(session.dayKey).mobility++`, `Hub.commit()` and `Hub.gamify.checkMilestone("mobility")`. The session log line reads "Wrist Prep 7/7".

### B7 · Verify (Gate 2)

`tools/check-workout.py` gets new cases. Each is run against `9b0de28` first, through `git archive`, and must FAIL there:

| Case | Asserts |
|---|---|
| SM1 | v8 save → v9: `training.skills` `{}`, `mobilityBlock` "off"; sessions, slots, pins and the mid-workout draft are byte-identical apart from `meta.updatedAt` (fixture `v6-midworkout.json` plus a v8 one) |
| SM2 | Click *Train in my workouts* on Handstand → Push day preview lists it first; Legs day doesn't; *Every session* puts it on Legs |
| SM3 | Log 3 attempts, finish → session exercise has `skill`, no `slot`; the push slot's `recommendFor` evidence is unchanged; a PR row appears |
| SM4 | Two sessions at the standard on different days, Just right → card offers Step up; clicking it moves the track to the next rung in the same track |
| SM5 | Recommended skill on `splitpull` / `splitlegs` (A2) |
| SM6 | Mobility ticked on Push → Wrist Prep before the main work; all steps ticked and finished → Hub `mobility` +1 on the session's `dayKey`, also across midnight; 6 of 7 → +0 |
| SM7 | v8 build opens a v9 save → read-only banner, key unchanged |
| SM8 | 390 / 1440 / 1920 px, both themes: no horizontal scroll, 0 page errors |

Plus a `check-syncmerge.js` case (stop on one device beats an older start on the other) and the full existing suite: the eight Node checks and `check-workout.py`, quoted. All clicks are real clicks, not `evaluate`.

### B8 · Ship

The service worker gets `CACHE_VERSION` +1. The README gains two section-4 entries: "A skill trains beside your slots, never in one", and "Mobility done in a workout counts in Mobility". There is no commit until you ask.

## Out of scope

| Not doing | Why |
|---|---|
| Merging Skills → Mobility's five static routines into the Hub's six (A4) | A content decision: which wording survives. It is separate from wiring a routine into a session |
| The guided full-screen player inside a workout | The checklist already has per-step timers. The player's own `finish()` counts in the Hub too, so it would double-count with B6 |
| Flexibility long holds (couch, pancake…) in workouts | The ask is routines. They are separate data with a separate timer |
| A Progress tab card per skill | Directory pages already show each rung's history and best. Add one when there is real skill history to look at |
| Weekday pins for skills | They don't fit the rotation (Decisions table) |
| Lifting the "not a slot's exercise" rule | It is still right. B4 is the alternative to lifting it |
