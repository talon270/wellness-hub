# Wellness app review

Reviewed 6–7 October 2026 against the current working tree. The requested weekly strength choice is implemented. The items below are suggestions for the next pass.

## What changed

Open **Fitness → Program → Strength days per week**, choose a count, then apply the preview. The choice is also available during Fitness setup.

| Strength days | Suggested program | Days without planned strength |
|---|---|---|
| 1 | Whole body | 6 |
| 2 | Full Body A / B | 5 |
| 3 | Full Body A / B, alternating | 4 |
| 4 | Upper / Lower | 3 |
| 5 | Upper / Lower / Push / Pull / Legs | 2 |
| 6 | Push / Pull / Legs, twice | 1 |

Workout and Fitness Overview show completed strength days in the Monday–Sunday week. A second main session on the same day does not count as a second day. Accessory sessions do not use up the strength-day target. Reaching the target suggests recovery until Monday; **Train anyway** remains available. Missed days do not become a backlog.

Recovery also follows the work actually logged. For a selected weekly plan, yesterday's performed sets, including accessories and finishers, can delay the next session when primary muscle targets overlap. A new week does not erase that check. Extra exercises can therefore require more recovery than the example week shows. Old saves keep their flexible template until the user selects a weekly target. Changing plans preserves prescriptions, history and an unfinished workout; changing the template closes the current reporting phase using the existing flow.

**Rest guidance:** leave one full day between hard sessions for the same muscles, roughly 48 hours if exercising at the same time of day. Easy walking or gentle mobility can fit on recovery days. This is a starting guideline; the app uses calendar days and logged primary muscle groups and cannot determine personal readiness. It also shows the user's existing rest timers between sets. Mayo Clinic recommends at least two strength days and a full day between work for the same muscle group; ACSM emphasizes consistency and individualization. [Mayo Clinic](https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/strength-training/art-20046670), [ACSM 2026](https://acsm.org/resistance-training-guidelines-update-2026/).

## Recommended next improvements

| Priority | Improvement | Evidence and proposed change |
|---|---|---|
| 1 | Put the next workout on the main Home screen | The Hub dashboard shows quick habit logs, timers and a Fitness streak, but no next-workout or recovery action. Add one compact card using the existing Fitness planner: **Resume**, **Start workout**, or **Recovery today**, plus weekly progress. Keep its date and workout identical to Fitness Overview. See [dashboard](../js/views/dashboard.js) and `App.engine.nextSession` in [BASALT](../fitness/basalt.js). |
| 2 | Coordinate running and strength changes | Existing hard-run warnings cover today and the next known lifting session. The Running code and README explicitly leave a run moved to tomorrow unchecked against tomorrow's lifting. Recheck when moving a run and when applying a weekly plan. Then offer a simple weekly calendar distinguishing sample days from booked/logged activities. See [running behavior and limitations](../README.md) and `App.run` / `liftOn` in [BASALT](../fitness/basalt.js). |
| 3 | Shorten Program on mobile | At 390 px, all main prescriptions and 16 coverage slots expand into a long page alongside templates, phase controls and benchmarks. Keep weekly days, next session and active prescriptions first; fold optional coverage and benchmarks behind summaries. The new recovery explanation already uses an expandable detail. See `renderProgram` in [BASALT](../fitness/basalt.js). |
| 4 | Make warm-ups respect equipment | Confirmed in Chromium: with `pullupBar: false`, a Pull workout in the existing rotation still asks for **Active Dead Hang** and hanging **Scapular Shrugs**. The main exercises can adapt to gear while `DB.warmup` returns a fixed list. Select equivalent preparation from the available equipment and keep an already-started checklist stable. The new split Pull day uses preparation without hanging. See `WARMUPS.pull` and `DB.warmup` in [BASALT](../fitness/basalt.js). |
| 5 | Connect the two setup flows | After completing Fitness setup, Home can still show “Set this up for you” with a separate six-question flow. Explain the remaining optional wellness setup, reuse shared profile answers when appropriate, and show one setup status. Fitness placement questions still serve a separate purpose. See [Hub onboarding](../js/onboarding.js), `setupPrompt` in [dashboard](../js/views/dashboard.js), and `stepProfile` in [BASALT](../fitness/basalt.js). |

## Verification and limits

- Browser walkthrough of nine Fitness sections and twelve Hub sections using synthetic local data; no page errors in the completed walkthrough.
- New frequency controls checked in Selene and Selene Day at 390, 1440 and 1920 px; no horizontal page overflow. Both mobile themes inspected visually.
- Browser checks in [check-weekly-workouts.py](../tools/check-weekly-workouts.py) cover setup, all six choices, saved preferences, weekly rollover, repeated same-day sessions, five- and six-day sequences, accessory recovery, unfinished workouts, local dates in Los Angeles, and overlap from longer Upper sessions.
- All nine focused checks passed. Thirteen distinct existing browser regressions passed across the targeted runs, including offline loading and v6/v7 save migration. The ten sync cases, training rules, coverage rules, training-data audit and muscle-map audit also passed; JavaScript syntax and `git diff --check` passed.
- Existing schedule, phase switching, saved-data migration, sync and offline checks are included in verification. The original snapshot fails the new setup/Program checks because those controls are absent.
- This was a product and workflow review, not a clinical audit of every health recommendation. Native Android packaging, real-device sync and every reminder notification were not exercised. Recovery checks use primary muscle targets; they do not estimate fatigue, elapsed-hour recovery or total stress from every sport.
