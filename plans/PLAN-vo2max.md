# VO2 max tracking — plan

Written 2026-08-23, against `Helth/` as of the current `main` state (no VO2max
code anywhere in the repo — confirmed by grep across `js/`, `fitness/`,
`index.html`).

Method: read `js/views/health.js` in full, `js/core.js`'s state shape,
migration and `heal()` array-coercion pattern, and `fitness/basalt.js`'s
`running` module (it already logs distance + duration per run). No running
script — this is a fresh-build plan, not an audit.

**Nothing below is implemented — this is the plan.**

## Part 0 — shape

1. **Who opens this and when?** Occasionally — after a watch/app gives an
   estimate, after a lab VO2max test, or after a Cooper-test run. Not a daily
   habit, so it belongs next to Vitals/Labs, not the daily checklist views.
2. **What must never get wrong?** The app must never present a guessed number
   as if it were measured. Every entry carries a `source` (device estimate /
   field-test estimate / lab-measured) and the source stays visible next to
   the number everywhere it's shown — same rule as the gold-tag pattern
   elsewhere in this codebase for estimate-derived numbers.
3. **Honest confidence of the central number:** a Cooper 12-minute-run
   estimate has a real error band (commonly cited ±3.5 ml/kg/min against
   lab-measured VO2max). The calculator states that range inline on the result,
   not in a footnote.
4. **Data source dying:** N/A — everything here is user-entered, there's no
   external fetch to fail.

## Part A — data model

Add to `js/core.js` `defaultState().logs`:

```js
/* VO2max readings: [{ id, date, value, source, note }]
   source: "device" | "field" | "lab" — device/watch estimate,
   field-test estimate (e.g. Cooper test), or a lab-measured value. */
vo2max: [],
```

Add `"vo2max"` to the array-coercion list in `heal()` (same line as `"vitals"`,
`"labs"`, etc.). No `SCHEMA_VERSION` bump — this follows the same additive
pattern already used for `labs` and `breathTests`: `deepMerge` against
`defaultState()` fills the new key with `[]` for every existing save, and
`heal()` guards the type. There is no old shape to migrate away from.

## Part B — UI: a new pill in Health Records

`js/views/health.js` currently has five pills: vitals, labs, checkups,
meds, profile. Add a sixth, `vo2max` → label "VO2 Max", between `vitals` and
`labs` (it's a physiological reading, same family as vitals).

**Log form** (mirrors the vitals form): date, value (ml/kg/min), a `source`
select (Device/watch estimate · Field-test estimate · Lab-measured), optional
note. Same future-date guard as vitals.

**Cooper test calculator**, inline above the form: one input, distance
covered in 12 minutes running (km, matching `fitness/basalt.js`'s existing
running-log convention — no imperial toggle for distance there either).
`VO2max = (distance_m - 504.9) / 44.73`. Shows the result with "±3.5 ml/kg/min
against a lab test" stated next to it, and a button that fills the value field
with `source` pre-set to "field" — it doesn't save on its own, so a bad number
never gets committed without being reviewable first.

**Reference band**, shown against the latest reading: Cooper-Institute-style
age/sex categories (Very poor / Poor / Fair / Good / Excellent / Superior),
five age bands (20s/30s/40s/50s/60+) × sex. Age comes from
`Hub.state.logs.profile.dob` (already used by the Profile pill). Sex comes
from `Hub.state.settings.profile.gender`. If gender is `null`/"other" — per
the identity rule already in this codebase, an identity answer picks a
default and never gates content — show **both** the male and female category
for that age band side by side instead of guessing, with a one-line note
saying why two are shown.

**Trend**: reuse the existing `sparkline()` helper already in this file, same
as every other vitals metric.

**History list**: date, value, source chip, note, delete — same shape as the
vitals history rows.

**Disclaimer**: same tone as the existing vitals/labs disclaimers — general
population bands, not a diagnosis, formula has a real margin of error, a
device estimate and a lab test are not the same precision and the source chip
is there so you can tell them apart later.

## Part C — wiring

- `SECTIONS` map and `PILLS` array both get the new `vo2max` entry.
- Save handler validates: date not in the future, value present and in a
  sane range (say 10–95 ml/kg/min — below/above that is almost certainly a
  data-entry error, not a real reading), source required.
- Delete follows the existing `Hub.confirm()` pattern used for vitals deletes.

## Addendum, 2026-08-23 — audit and integration points

Implemented, then audited. The audit found seven lapses; all are fixed and
verified by running. The root cause was that this plan's "Out of scope"
section listed *features* I was skipping but never listed the *integration
surfaces* a new `logs.*` type has to touch — which produced four of the seven.

**A new entry under `logs` is not done until these five are wired.** This is
the checklist that was missing:

| Surface | File | Why it's not optional |
|---|---|---|
| `PRECACHE` cache version | `service-worker.js` `CACHE_VERSION` | An installed PWA serves the old JS until it's bumped — the feature is invisible on a phone |
| CSV export set + button | `js/storage.js` `CSV_SETS`, `js/views/settings.js` | Every other reading type is exportable; parity or the data is second-class |
| Appointment summary | `printSummary()` in `js/views/health.js` | The tab's stated purpose is a page a clinician will read |
| Insights day bundle + its renderer | `js/insights.js` `dayDetail`, `js/views/insights.js` | Adding to the bundle without a render line is dead data |
| Old-schema seed test | Playwright, key `wellnessHub.v1` | Reasoning that `deepMerge` back-fills the key is a guess until run |

Two specific corrections to what this plan originally claimed:

- **The "gold-tag pattern" cited in Part 0 does not exist in Helth.** `grep -rn
  "gold" css/ js/` returns zero hits. That convention is Bob the Builder's; it
  was imported here and asserted as local precedent. The source-tagging is
  still right, it just doesn't have that citation.
- **The Cooper calculator needed the same range guard as the save path.** As
  first built it printed **−6.8 ml/kg/min** for 0.2 km (the formula's 504.9 m
  intercept goes negative below ~505 m) and **53644** for `2400` typed into a
  field labelled km. Both now refuse, and the metres case suggests the km
  value. `VO2_MIN`/`VO2_MAX` are one named constant used by the input
  attributes, the calculator and the save validation.

## Out of scope

- **Rockport walk test / non-exercise regression formulas.** Cooper test only
  for this pass — it needs just a distance, no weight/heart-rate inputs, and
  covers the "no watch" case. Can add more calculators later if wanted.
- **Auto-pulling an estimate from `fitness/basalt.js`'s running log.** The
  running module already stores distance+duration per run; a future pass
  could offer "estimate from a recent run" as a shortcut into this same form,
  but that's a second change touching a different, much larger file. Not
  touched here.
- **Any change to `fitness/basalt.js`.** This plan only touches
  `js/core.js` and `js/views/health.js`.
- **Badges/gamification hooks.** No new achievement for logging a VO2max
  reading — `js/gamify.js` is untouched.
