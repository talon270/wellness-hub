# Fitness tab: dashboard calendar + longer workouts — plan

Written 2026-08-26, against `fitness/basalt.js` as of the fitness-onboarding
fix earlier this session. Method: read `renderDashboard` (~line 3733),
`trainingCalendarCard`/`buildCalendar`/`wireCalendar` (~4540–4784), the
`DAY_PATTERNS`/`VOLUME_MODES`/`buildWorkout` engine (~1750–1900), and
`fitness/basalt.backup-20260824-085617.js` to see what the calendar's
placement looked like before the Progress-tabbing refactor.

**Implemented 2026-08-26.** The plan text below is unchanged from before the
work started; what actually shipped, and where it departed from this, is in
the section immediately following.

---

## Implemented — results and deviations

All of Part B, plus the six additions found by re-reading the code against
this plan before building. Verified by driving the real UI, zero console
errors in both themes.

| Check | Result |
|---|---|
| v1 → v2 migration | `version: 2`, `sessionLength: "focused"` backfilled, `volumeMode: "extended"` / `restDefaultSec: 120` / profile name all preserved byte-for-byte |
| Focused push (unchanged) | `push, shoulder, dip, core` — identical to pre-change |
| Full push / pull / legs / fullbody | `+pull` / `+push` / `+dip` / `+hinge`, accessory flag on the last entry only |
| Full + Max effort combine | 5 sets vs 3 focused+standard — the two prefs stack as intended |
| Dashboard calendar | renders, month nav works from the Dashboard instance, no horizontal overflow at 1500px |
| Progress → Calendar | still present and working |
| Preview badge | `3 PATTERNS · ~36 MIN` → `4 PATTERNS · ~48 MIN` on switching to Full |
| Accessory marked in UI | `accessory` badge renders on the added movement |

**The bug that only running found.** `finalizeSession` (`basalt.js:2078`)
copies `era2` into the stored session record but was never going to copy
`accessory` — and `_adaptTarget` reads its history out of `s.sessions`, not
out of the live workout object. So the flag existed exactly until the moment
it mattered. Proof, same script both sides: a max-effort accessory-pull
session on push day moved the real pull rep target **5 → 6** before the
persistence fix, and **5 → 5** after. Reading the code would not have caught
this; the exclusion logic looked correct in both places it was written.

| Plan said | Built instead | Why |
|---|---|---|
| Accessory excluded from `_progress` and `_adaptTarget` | Same, **plus** persisted into the stored session record | The exclusion is a no-op without it — see above |
| — | Full length **replaces** the era-2 accessory instead of stacking | Both add one movement. Stacking makes an Era-II push day 6 exercises at up to 6 sets |
| — | Accessory identified by **position** (last), not pattern name | No day currently has both a primary and accessory of the same pattern, but a name test would break silently the day one does |
| — | Accessory holds its ladder's plain base target | It neither reads adaptation nor feeds it — otherwise support work still drags the number around, just one step removed |
| — | PRs deliberately **not** excluded | Progression and adaptation change your future program; a PR only describes a rep you actually performed |
| Calendar called directly from `renderDashboard` | Published as `App.calendarCard` / `App.wireCalendar` | Dashboard is IIFE 3622–4204, the calendar lives in Progress's 4226–5287 — not in scope, so it is exposed rather than duplicated |
| — | `heroCard` shows a live session's real movements, and only uses the length preference for an upcoming one | It was reading `DAY_PATTERNS` for both, so a session in progress would have listed movements it did not contain |

Not proven, not claimed: nothing has been run across a real device sync, so
whether `prefs.sessionLength` behaves well when two machines disagree is
reasoned (`mergeFields`, non-empty-newest-wins) rather than observed.

---

## Part A — what's actually there today

### A1 · The calendar isn't broken, it's two clicks deeper than it used to be

`trainingCalendarCard(s)` (full month grid + legend, `buildCalendar`) is real,
complete, and renders correctly — confirmed by running it headlessly, zero
console errors. It currently only renders inside **Progress → Calendar**, one
of five tabs (`PROG_TABS`, line 4945). The Aug 24 backup shows it used to
render unconditionally, inline, every time you opened that page — the
tabbing refactor (its own comment: "Progress used to be one 6,000px scroll")
moved it behind a click along with everything else on that page. Confirmed
by you: you want it back on the actual **Dashboard** (the home screen —
`renderDashboard`, hero card + stat tiles + quick log + PRs), not just
promoted within Progress.

**Fix:** add the calendar card, as-is, to the bottom of `renderDashboard`'s
output. Zero new calendar code — `trainingCalendarCard`, `buildCalendar`, and
`wireCalendar` are reused verbatim; the only change is calling them from a
second place. `wireCalendar(el, s)` is already idempotent per render call
(it rebinds `#cal-prev`/`#cal-next`/`#cal-today` against whatever `#cal-inner`
is currently on screen), so having it wired from both Dashboard and Progress
in the same session is safe — only one of the two is ever in the DOM at once,
since `showSection` replaces `#app`'s content wholesale.

**Cost, stated plainly:** the Dashboard gets meaningfully longer — a full
month grid plus a seven-item legend, added after the PRs/goals row. That's
the faithful restoration of what was there before, not a redesign. If it
turns out too long in practice, the follow-up is a compact week-strip
variant — deliberately not building that now, since you asked for the
calendar back, not a new smaller one.

### A2 · Volume modes change intensity, never the exercise count

`VOLUME_MODES` (line 1765) has exactly three levers: `sets` (bonus sets on
each already-scheduled exercise), `reps` (bonus reps per set), `restMul`
(shorter rest = denser session). `DAY_PATTERNS` (line 1750) — the actual list
of *which* movements a session contains — is fixed per day type and never
reads `volumeMode` at all:

```
push:     ["push", "shoulder", "dip", "core"]      — always 4 patterns
pull:     ["pull", "hinge", "core"]                 — always 3
legs:     ["squat", "hinge", "core"]                 — always 3
fullbody: ["push", "pull", "squat", "core"]          — always 4
```

So "Max effort" today means the same 3–4 exercises with more sets, more reps,
shorter rest — a harder version of the same session, never a longer one with
more distinct movements. That's exactly the gap named in the request.

**Fix:** a second, independent preference — `s.prefs.sessionLength`,
`"focused" | "full"`, default `"focused"` (byte-identical to today's
behavior until changed). `"full"` adds one extra pattern per day type,
chosen from movements *already real and populated in the exercise DB* for
balance rather than pure addition:

| Day | Focused (today, unchanged) | Full (+1 pattern) |
|---|---|---|
| Push | push, shoulder, dip, core | + **pull** (light antagonist work — real push/pull balance programming, not a new pattern) |
| Pull | pull, hinge, core | + **push** |
| Legs | squat, hinge, core | + **dip** (an upper-body finisher, since legs day is otherwise lower-body-only) |
| Full body | push, pull, squat, core | + **hinge** (the one major pattern full body doesn't already cover) |

This is the one design choice in this plan most worth you pushing back on —
adding a "pull" accessory to every push day changes weekly per-pattern volume
distribution, which interacts with `_adaptSets` and `weeklyVolume`
(Progress's volume chart). I chose antagonist-pattern accessories because
they're a real, defensible training convention and need zero new exercise
content — every added pattern already has a full tier ladder in `DB`, used
on its own dedicated day. The alternative (inventing new "accessory" pattern
types like carries or curls) would need real new exercise definitions, which
is a much bigger, separately-scoped piece of work.

**Independent of volume mode, combinable with it.** "Full + Max effort" is a
real, valid combination (more exercises, and more sets/reps on each) — the
two prefs don't overlap or need reconciling against each other.

**Where it's picked:** same place `volumeMode` already is — the pre-session
picker (`~line 2588`, where `chosen.volumeMode` is set) gets a second control
alongside it, and `Settings` gets a default toggle next to the existing
volume-mode default (mirroring `wireSettings`'s existing `[data-voldefault]`
pattern with a new `[data-lengthdefault]`).

---

## Part B — the build

### B1 · Dashboard calendar

1. `renderDashboard` (line 3733): append `'<div class="mt-6">' +
   trainingCalendarCard(s) + '</div>'` after the PRs/goals row.
2. `renderDashboard`'s existing `wireDashboard(el, s)` call gains a sibling
   `wireCalendar(el, s)` call, same as `renderProgress` already does.
3. No CSS changes expected — `.cal-*` classes are already defined for the
   Progress context and are not scoped to it specifically (confirm during
   build; adjust only if the Dashboard's narrower card width clips anything).

### B2 · `sessionLength` preference + engine change

1. `defaultState().prefs`: add `sessionLength: "focused"`.
2. `SCHEMA_VERSION` in `fitness/basalt.js` (separate from Wellness Hub's) —
   check current value and bump with a migration: existing saves get
   `sessionLength: "focused"` backfilled, so nobody's program silently gets
   longer the day this ships.
3. New `DAY_PATTERNS_FULL` map (the table in A2), alongside `DAY_PATTERNS`.
4. `buildWorkout` (line 1832): pick the pattern list from
   `(s.prefs.sessionLength === "full" ? DAY_PATTERNS_FULL : DAY_PATTERNS)[dayType]`
   instead of always reading `DAY_PATTERNS[dayType]`.
5. Same swap wherever else `DAY_PATTERNS[...]` is read for *planning* rather
   than historical display — `engine.era2Accessory` (1820), the pre-session
   picker (2600, 2632), `heroCard`'s pattern chips (3828), skill-reminder
   day lookups (5906). Read-only historical/labeling uses (calendar day-type
   labels, session log) stay on the plain `DAY_PATTERNS` map since a past
   session's actual pattern list is what it is, not what today's preference
   says.
6. Settings: a "Full" / "Focused" toggle next to the existing volume-mode
   default picker, same `wireSettings`/`saveSettings` pattern.
7. Pre-session picker: a visible control alongside volume mode, so the
   choice is made per-session (mirroring how volume mode already works),
   with the Settings toggle only setting the *default* that picker opens on.

---

## Verification plan

- Dashboard: seeded profile with completed sessions and a `run` plan active,
  confirm the calendar renders below PRs/goals with correct trained/planned/
  run-day markers, `#cal-prev`/`#cal-next`/`#cal-today` all work from the
  Dashboard instance.
- Both Dashboard and Progress calendars live in the same session (navigate
  Dashboard → Progress → Dashboard), confirm no duplicate-id console errors
  and each shows the currently-correct month independently is **not**
  required — `calState` is shared module state, so navigating between them
  should show the same month/nav position on both, which is the expected,
  simpler behavior, not a bug.
- `sessionLength` migration: seed a pre-migration save, load, confirm
  `prefs.sessionLength === "focused"` and every existing session record is
  untouched.
- Build a "focused" push session and a "full" push session back to back,
  confirm focused is unchanged (push/shoulder/dip/core, same as today) and
  full includes a real pull movement at the correct tier.
- `weeklyVolume`/Progress's volume chart with a mix of focused and full
  sessions logged, confirm the extra pattern's reps count toward its own
  pattern's volume, not toward the day's push volume — i.e., the accessory
  pull work shows up as pull volume.
- Both themes, zero console errors, no `alert()`/`confirm()`.

## Out of scope

- A compact/collapsed calendar variant for the Dashboard. Ship the full
  restoration first; revisit only if it's actually too long in practice.
- New exercise content (carries, curls, isolation work) as a third
  session-length tier. `"full"` reuses existing patterns only.
- Retroactively relabeling past sessions logged under the old fixed
  `DAY_PATTERNS` — they keep whatever they actually were.
