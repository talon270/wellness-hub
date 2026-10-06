# Progress evidence — implementation plan

Written 7 October 2026 against the current Wellness Hub working tree. Method: source review of BASALT's Progress view, Training's comparable evidence and recommendation rules, and a browser walkthrough with a fresh profile plus a saved v7 fixture. The user's request to implement the preceding review authorizes this work.

## Findings and changes

1. **BUG (high): the Strength levels ladder contradicts the selected exercise.** A saved Muscle-up prescription renders beside a frozen L1 Dead Hang marked “NOW”; row and coverage slots are absent. Replace the seven frozen ladders with cards generated from the active prescriptions, grouped into main and accessory work. Show the real prescribed exercise, its sets and range, the next path choice, and an expandable reference path. Keep equipment fallback and paused slots visible with their real status.
2. **BUG (medium): a plateau can be declared without performed work.** The old check compares only two archived tier numbers. Detect stagnation from comparable logged exposures under the current prescription, and call missing evidence “Not enough data.” This uses the training engine's own evidence rules.
3. **MODEL GAP: “1 of 2” hides what counted.** Expand each card to list the dated comparable sessions, performed sets and the specific reason for a repeat, step or reduction. Link to Workout when a decision is available. Do not infer evidence from PRs or older incompatible sets.
4. **DESIGN RISK: aggregate volume obscures individual progress.** Add a per-exercise trend on the selected card. Plot comparable sessions only, separated by exact exercise/setup/set count/load under the current prescription. Show total reps or seconds, with the set results and dates beside the chart. Label an empty or one-session trend plainly.
5. **BUG (medium): bodyweight change is labelled per week without dividing by elapsed time.** Compute kg per seven days from two dated entries at least seven days apart, rounded to 0.1. With a shorter interval, show the raw change and number of days, without a weekly claim.

## Data and delivery

All Progress numbers are derived from existing saved sessions and prescriptions; no save schema change is needed. Preserve the current five Progress sections and their keyboard navigation. Add only view code and CSS using existing theme tokens. Bump the service worker cache version after asset changes. Update README with the new Progress behavior.

Verification: run an isolated browser with fresh and saved profiles, confirm the Muscle-up mismatch disappears, and check all five sections in both themes at mobile and desktop widths. Use synthetic comparable histories for evidence, plateau and trend; verify 70→72 kg over 14 days reads +1 kg/week. Run the targeted existing schedule, migration and offline checks after the code change.

## Implemented and checked

- The stored `ladders` subview is labelled **Exercise progress**. It reads each active main prescription, including Row, and folds active accessory and conditioning prescriptions underneath. The old L1–L6 display is gone; a movement path remains an expandable reference.
- An open card shows the reason for the training engine's current decision, dated comparable sets and effort, and a total-reps/seconds trend for matching work. Loaded exercises also show weights used with the same exercise, setup and set count. The chart's exact dated weights are available as text.
- “No recent gain” uses four comparable sessions on different days spanning at least 14 days, with the latest within 21 days, no increase in the last two totals and the last two efforts rated hard or failed. It never comes from frozen tier levels alone.
- Bodyweight changes of at least seven days are normalized to kg per week; shorter spans show the number of elapsed days. No saved data shape changed. The service-worker cache was advanced to v90.
- Browser verification: Overview opened with a fresh profile, and all five Progress sections opened with a v7 fixture save; Muscle-up, Row and accessory cards appeared correctly. Both themes at 390, 1440 and 1920 px had no horizontal overflow. The same synthetic sample changed from `+2 kg / wk` before to `+1 kg / wk` after 14 days; a three-day sample displayed `+2 kg in 3 days`. A two-load sample charted 5 and 7.5 kg while counting only the matching load as step evidence. The isolated four-session case showed the label; unchanged legacy phase levels with zero sessions did not.
- Existing offline and v7 saved-workout browser checks passed: `D7`, `Y15`. JavaScript syntax and whitespace checks passed. Timestamped backups of the four edited assets are dated `20261007-014646`.
