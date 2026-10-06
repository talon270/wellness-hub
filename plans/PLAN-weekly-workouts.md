# Weekly workout choice and recovery guidance

Written 6 October 2026; implementation completed 7 October. Method: source reads of the planner, onboarding, attendance, sync and muscle targets; browser inspection of the Fitness screens; primary guidance from Mayo Clinic and ACSM. The user's request authorizes implementing the weekly choice and reviewing the wider app.

**Choose one to six strength days per week in Program and setup.** Two or three days use the existing full-body templates, four uses Upper / lower, one gets a whole-body session, five uses Upper / Lower / Push / Pull / Legs, and six uses Push / Pull / Legs. New split days keep hinges on leg days and avoid the existing rotation's opposite-body accessory additions. The existing rotation stays available.

**The weekly choice must affect the workout recommendation.** Count distinct completed main-workout days in the local Monday–Sunday week. Once the chosen count is reached, suggest recovery until the next week; keep the existing Train anyway choice. Recovery also follows the actual preceding training day, so a new week cannot erase muscle overlap. Do not turn missed workouts into a debt. Overview, Workout and the calendar share the next-session result.

**Recovery is guidance, with its basis visible.** State one full day between hard work for the same muscles, approximately 48 hours when training at the same time, and explain that the app checks calendar days rather than measuring recovery. Show the number of days without planned strength work, a sample week, and existing between-set timer settings. More soreness, unusual fatigue or pain may require changing the session. Sources: [Mayo Clinic](https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/strength-training/art-20046670) and [ACSM 2026](https://acsm.org/resistance-training-guidelines-update-2026/).

**Existing saves keep their chosen plan.** Schema v8 adds an optional weekly-day choice, initially unset for older saves. New template IDs require the version guard so old builds cannot silently reinterpret them. Switching frequency uses the existing phase-close flow when the template changes; prior reports retain their denominator, and prescriptions and workout history stay intact. A workout already in progress stays intact.

Verification covers real setup and Program clicks, every frequency, weekly rollover, repeated same-day sessions, recovery after split sessions, template changes, migration, sync and offline loading; existing training, muscle-map and relevant workout regressions are rerun. Review suggestions for the wider app go in `wellness-app-review.md`; unrelated product changes are outside this implementation.

## Implementation record

- Schema v8 adds `prefs.weeklyDays: null`; choosing a count pairs it with a compatible template. Older builds retain their existing newer-save protection.
- New templates: `fullbody1`, `split5`, `split6`. Dedicated split day types keep hinges on leg days.
- One next-session calculation supplies weekly caps and recovery to Workout, Overview and the calendar. Selected weekly plans check primary muscle overlap from performed sets, including accessory sessions; flexible legacy templates retain their original rules.
- Day-key arithmetic for the planner uses local calendar dates, including in timezones west of UTC.
- Program and setup expose the six choices, rest-day counts, examples and an expandable explanation with sources and current set timers. Existing history, prescriptions and unfinished workouts are preserved.
- Service-worker cache version advanced for delivery. Timestamped pre-change backups remain alongside edited files; the original app snapshot used for comparison is in `/tmp/wellness-weekly-review/before`.
- Review findings and verification scope: [wellness-app-review.md](wellness-app-review.md). Reproducible focused checks: `python3 tools/check-weekly-workouts.py`.
- Result: nine focused browser checks pass, thirteen existing browser regressions pass across targeted runs, and ten sync cases pass. Training, coverage, data and muscle-map audits pass. Both themes fit at 390/1440/1920 px. The two control-presence checks fail as expected against the original snapshot.
- Integration, 7 October (Claude, on branch `yellow-dude` after Stages 3 and 4 of `PLAN-yellow-dude.md`): two `check-workout.py` cases still asserted the pre-v8 shape. **P9** expected exactly four templates; it now counts against `App.engine.TEMPLATE_ORDER` and checks lats targets for the three new ones, worked by hand rather than read from the app (no bar: `fullbody1` 24, `split5` 48, `split6` 48), which the app matches. **V5** compared every pref with the v5 fixture; it now leaves out `weeklyDays` and asserts that v8 adds it unset, as Y6 does. Run against the committed v7 tree, the new P9 fails as it should (four templates offered, seven expected) and V5 still passes there.
