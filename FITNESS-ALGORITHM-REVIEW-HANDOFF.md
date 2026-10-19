# Helth fitness algorithm: review handoff

This describes the current BASALT fitness code on the `android` branch. It is a map for an independent code review, not a claim that the training thresholds are clinically validated. Read the linked source before judging behavior; older comments and the historical progression plan include mechanisms that have since been removed.

## Where the algorithm lives

| Area | Current source | Responsibility |
| --- | --- | --- |
| Exercise and rule data | [`fitness/training.data.js`](fitness/training.data.js) | Eight slots, exercise graph, equipment requirements, ranges, load increments, recovery constants. |
| Pure progression rules | [`fitness/training.js`](fitness/training.js) | Read logged evidence; return `ready`, `repeat`, or `reduce`; calculate one harder or easier prescription. No storage, DOM, or clock. |
| Workout engine and screens | [`fitness/basalt.js`](fitness/basalt.js) | Onboarding, templates, session generation and logging, user decisions, recovery blocks, 28-day reports, running plans. |
| Muscle accounting | [`fitness/muscles.data.js`](fitness/muscles.data.js), [`fitness/muscles.js`](fitness/muscles.js) | Exercise-to-muscle mapping, work units, weekly targets and levels. This is display logic; it does not advance prescriptions. |
| Integration | [`index.html`](index.html), [`js/gamify.js`](js/gamify.js), [`js/syncmerge.js`](js/syncmerge.js) | Script load order, Hub streaks, cross-device state merge. |

`index.html` loads training data before `training.js`, then `basalt.js`; the modules expose `window.TRAINING_DATA`, `window.Training`, and `window.App.engine`. Source locations below refer to these files, not the `*.backup-*` copies.

## Core data model

The app stores BASALT state in `localStorage` under `ironframe.state.v1`; the current schema is version 4. The relevant fields are `profile.goal`, `equipment`, `prefs.template`, `prefs.sessionLength`, `prefs.volumeMode`, `training.slots`, `training.decisions`, `sessions`, `flagsHistory`, `recoveryBlocks`, `currentPhase`, `phaseHistory`, and `running` (`fitness/basalt.js`, beginning of file). A live workout draft is separate UI state in `ironframe.ui`.

Each of the eight training slots—`push`, `row`, `pull`, `squat`, `hinge`, `core`, `shoulder`, `dip`—has a current prescription:

```js
{ exerciseId, setup, sets, range: [low, high], unit, acceptedAt, why }
```

`dip` may be explicitly off. Exercises are nodes in a catalogue: `next` gives the main path and `offer` gives optional branches. Equipment requirements use AND across the outer list and OR within a nested list (`training.data.js:155-205`, `training.js:132-143`). Numbered `tiers` remain for ladder displays and phase snapshots; they are updated when a step is accepted, not from old training points (`basalt.js:2827-2860`).

## From onboarding to a workout

1. The user chooses a lifting goal (`strength`, `size`, `both`), a template, owned equipment, and the hardest main-path movement they believe they can do cleanly and without pain for each slot. **Not sure** chooses the easiest available movement. The assessment starts each prescription at its range minimum and remains unverified until it is logged; benchmark achievements do not place the user (`basalt.js:3254-3423`).
2. Standard prescriptions have **3 working sets**. Plain rep movements use **6–12** for Both, **8–15** for Size, or **4–8** for Strength when the movement has a harder setup or load; otherwise Strength keeps 6–12. Eccentrics use **3–6**; holds have exercise-specific second ranges; skills have their own standards. New profiles get rep-set rest of **150 seconds** for Strength or **120 seconds** for Size/Both. Changing goal re-ranges eligible slot prescriptions but keeps the user's rest setting (`training.data.js:45-120,326-344`; `basalt.js:2937-2956`).
3. A template decides day types and the minimum rest between sessions. `fullbody3` alternates A/B at 3 sessions/week; `fullbody2` uses the same rotation at 2/week; `upperlower` alternates Upper/Lower at 4/week; `rotation` cycles Push/Pull/Legs/Full Body at about 3.5/week. The next type follows the **last completed type**, ordered by saved training day, not fixed weekdays. Full-body and rotation require the following day off. Upper/Lower permits consecutive different types but inserts a rest day before repeating a type. The app only projects the next eligible date, and the user can override a rest or already-trained day (`basalt.js:2263-2307,2415-2428,2744-2822`).
4. Equipment can replace an unavailable prescription with the nearest owned predecessor. Without a pull-up bar, the row slot carries pulling. `short` removes the final movement, `focused` uses the core 3–4 movements, and `full` adds one support movement. `extended` adds one set to main movements, while leaving rest unchanged. A legacy `max` setting reads as `extended` (`basalt.js:2382-2398,2440-2490,2557-2597`).
5. The workout copies each slot prescription into its exercise record, with the session's actual set count; the initial target shown for a set is the range minimum. A preview swap applies only to that session. The logging `dayKey` is fixed when the session begins, so a session finished after midnight stays on its start day (`basalt.js:2506-2597,3799-3817`).
6. Completion requires at least one positive logged set. A completed record saves `dateISO`, `dayKey`, type, each exercise's copied `rx`, actual `sets: [{reps, weight}]`, effort rating, flag and skip state. Holds store seconds in `reps`. A sharp pain flag skips the exercise. Other flagged swaps can save a real substitute exercise ID, but flagged work is excluded from progression. The app also records PRs, pain flags and a streak (`basalt.js:2601-2717,4360-4450`).

## Progression decision, precisely

`Training.recommend(sessions, rx, options)` is recalculated from completed session history when a slot card is read (`training.js:215-282`; `basalt.js:2827-2860`). It does not automatically change the prescription.

An exposure is **comparable** only when it has a saved `rx` and matches the current exercise ID, setup, unit and set count. It must not be skipped, pain-flagged, in a recovery block, or at an unknown load. A session without a saved `rx` is visible as history but cannot justify a step. Duplicate session IDs count once. Historical set values are judged against the **current** range after a goal change; the old range is not part of the comparison key (`training.js:49-118`).

The current prescription is **ready** only when its two most recent comparable sessions are on different training days, **every prescribed set** in both reached or exceeded the current upper range, and both exercise effort ratings are `easy` or `moderate` (UI: “Just right”). An unrated exercise does not qualify. The result names its evidence and offers a harder step. In other cases it normally says **repeat**, with a reason such as no history, one session, a set below the top, same day, unsuitable effort, unknown load, or no numeric skill standard (`training.js:215-264`).

A **reduce** recommendation overrides a repeat when the latest three comparable exposures have strictly falling total reps or seconds across both transitions, and an easier step exists. It is a heuristic based on totals; it does not measure form, sleep, pain that was not flagged, or the reason for the decline (`training.js:265-282`).

One step up tries the next harder setup first. A loaded movement then adds one load increment (**+2.5 kg dumbbells**, **+4 kg kettlebells**) if its load is known; an unloaded movement can instead move to an owned `next` exercise. One step down reverses setup/load or selects an owned predecessor, preferring the one most recently trained. A new step starts at the bottom of its range. Optional branch exercises are offered separately (`training.js:145-209`). At the end of a path, `ready` can have no compulsory step.

The user answers **Step** or **Repeat**. A decision is saved under `exerciseId|latestComparableSessionId`, so fresh evidence can create a fresh offer. Only accepting Step replaces the slot prescription and updates any numbered ladder display. An upward Step is blocked during an active recovery block (`basalt.js:2827-2860`).

**Example:** A 3 × 6–12 push prescription logs 12/12/12 rated Just right on Monday and again on Wednesday with the same setup. The card offers the next harder setup. If the user chooses Repeat, the prescription stays put. Three comparable sessions totaling 34, 31, then 27 instead offer one easier step, if one exists.

## Recovery, reports and secondary calculations

A **recovery block** lasts 7 days. It reduces working sets to `round(sets × 0.6)`, minimum 1, while keeping ranges and rest. It is offered after a sharp pain flag in the past week or declining evidence in at least two slots in the past week; the user chooses whether to start it. Sessions made in the block are stamped and never count as comparable progression evidence. Steps up are blocked while it is active (`training.data.js:117-120`; `training.js:119-126`; `basalt.js:2862-2915`).

Every **28-day phase** produces a report with adherence (completed versus expected from the active template), performance (comparable sessions and accepted steps by slot), and recovery (pain flags, Failed ratings, blocks). Expected sessions are `ceil(elapsedDays × template.perWeek / 7)`, with a floor of 1 and at least the actual completed count. Bodyweight trend is a separate linear regression on logged weigh-ins. The report has no grade and does not alter prescriptions. A template change closes the current phase early and opens one under the new template (`basalt.js:3034-3042,7013-7091,7152-7180`).

The **Muscles** screen maps performed reps to 14 muscle groups. Holds convert to roughly one work unit per 5 seconds. Primary, secondary and stabilizer shares are **1.0, 0.4, 0.15**. Lifetime work reaches level `L` at `round(120 × (L-1)^1.7)`, capped at 10. Seven-day work is compared with a weekly target derived from the current lifting template's slots, 3 sets, and fixed assumed units per set. It is an activity visualization, not a physiological strength estimate or an input to progression (`muscles.js:52-142,194-295`; `muscles.data.js:36-105`).

The **running plan is separate** from lifting progression. It offers First 5K (9 weeks), Stamina (12), Sprint (10), and VO2 Max (8). Each plan generates Wednesday/Saturday/Sunday sessions from a Monday anchor. Missed planned runs prompt the user to repeat the prior week or move on; repeat increments a week offset. A hard run on a scheduled squat/hinge day shows a clash note and can be moved to the next day. This does not automatically move lifting sessions or change their prescriptions (`basalt.js:8350-8465,8483-8670`).

## Review focus and reproduction

Please independently review the **current source**, especially:

1. Whether the two-session and three-session evidence rules handle missing sets, unknown or mixed weights, same-day sessions, legacy sessions, goal changes, session swaps, accessories, pain flags, and recovery blocks as intended.
2. Whether equipment fallback, optional branches and end-of-path behavior can offer an impossible or misleading next step.
3. Whether backdated sessions, local day boundaries, template changes, multiple sessions on one day, and cross-device merges preserve rotation, rest days, decisions and reporting counts.
4. Whether a recovery offer or decline can be repeated or missed, and whether the running missed-week and clash behavior matches what the screens promise.
5. Whether the hard-coded training thresholds, muscle work units and running estimates are appropriately labelled as product heuristics and kept out of claims about health outcomes.

Report concrete findings with file/line references, a reproducible scenario, impact, and a suggested fix. Distinguish a source-confirmed bug from a proposed product change. Useful checks from the repo root:

```sh
node tools/check-training.js
node tools/check-training-data.js
node tools/check-muscle-map.js
node tools/check-syncmerge.js
python3 tools/check-workout.py
```

The Python harness uses Playwright and its browser runtime. Its header documents the cases and exit codes. The Node checks cover the pure training rules, catalogue integrity, muscle map, and sync merge.

Baseline checked on 2026-10-03: all four Node commands above passed on the current tree (including 86 catalogued exercises and 14 muscle groups). The browser harness was not run for this documentation change.
