# Plan — Muscle Map, Muscle-Group Exercise Choice & Muscle Levels

**Target:** the Wellness Hub in this repo (`index.html` + `fitness/basalt.js`).
**Inspiration:** [workout.cool](https://workout.cool) — specifically its idea of muscle
groups as first-class objects you select against, rather than an implicit consequence of
"push day". Its 3-step builder was prototyped in this plan and then deliberately dropped in
favour of extending the swap flow this app already has (§6, §12).

**Scope guard — this stays a calisthenics app.** Nothing here adds an exercise, an
equipment type, or a training modality. The muscle filter can only ever surface what
`EXERCISE_DB` already contains: **76 Era-I bodyweight movements** and **8 Era-II loaded
accessories** already gated behind benchmark graduation. Equipment stays the five tokens
BASALT already knows (`pullupBar`, `rings`, `bench`, `dumbbells`, `kettlebells`) — no
barbell, bands, plates or machines. What is borrowed from workout.cool is the muscle-group
framing, not its equipment list or its exercise library. The
muscle taxonomy in §3 is likewise sized to what 84 calisthenics movements can actually
train — five candidate groups were cut for having no exercise that reaches them (§3.2).

Three things are being added:

1. **Muscle map** — see which muscle groups a session (or a week) actually worked.
2. **Muscle-group exercise choice** — pick exercises by the muscle they train, filtered by
   equipment, inside the swap flow the program already has.
3. **Muscle levels** — every muscle group has its own XP bar, level and rank, fed by
   logged work.

---

## 1. What already exists (and what it does *not* have)

| Thing | Where | Notes |
|---|---|---|
| 84 exercises | `fitness/basalt.js` Part 2 + Part 7 (`EXERCISE_DB`) | each has `id, pattern, name, level, era, mode, unit, equipment[], cues[], mistakes[], readiness, injury` |
| 7 movement patterns | `PROGRESSIONS` (`basalt.js:54`) | push, pull, squat, hinge, core, shoulder, dip (+ `skill` from Part 7) |
| Day types | `DAY_PATTERNS` (`basalt.js:1719`) | push / pull / legs / fullbody → arrays of patterns |
| Session log | `App.STATE.sessions[]` | each exercise stores `{key, pattern, name, era2, mode, unit, sets:[{reps,weight}], difficulty, flag}` |
| Tier progression | `engine._progress` (`basalt.js:2065`) | per **pattern**, 1–6, driven by hitting `target` + self-rated `difficulty` |
| PRs | `engine._checkPR` (`basalt.js:2081`) | per **exercise id** |
| Volume math | `engine.sessionVolume` (`basalt.js:1954`) | reps × 1.5 if weighted; holds = `sec / 5` |
| Hub badges | `js/gamify.js` (`BADGES`) | 48 badges, all **derived** from logs, never stored counters |
| Backup | `js/storage.js` | wraps the whole `ironframe.state.v1` blob, so anything derived from `sessions` survives export/import for free |

**The gap:** nothing in the app knows that a Pull-up trains lats and biceps. `pattern` is
the closest thing to muscle data, and it is a *movement* taxonomy, not an anatomical one —
"pull" covers both a Dead Hang (grip/forearms) and a Chin-up (lats + biceps).

So the first deliverable is a **muscle map**: a new data layer keyed by exercise id.

---

## 2. Design principles (borrowed from the codebase, not invented)

1. **Derive, don't store.** `js/gamify.js` recomputes every streak from the logs on each
   write, specifically so a streak can't drift and an imported backup is instantly
   correct. Muscle XP follows the same rule: it is a pure function of
   `App.STATE.sessions`. Nothing to migrate, nothing to keep in sync, and **every user's
   existing training history retro-fills their muscle levels the moment this ships.**
2. **One source of truth per fact.** The muscle map lives in exactly one table. Views read
   it; nothing copies it.
3. **Additive, not invasive.** New files, one new registered view, and an extension to an
   existing modal. After the §6 revision, `basalt.js` needs **no** engine edits at all.
4. **Offline-first, no build step.** Plain classic scripts, local assets, `file://`-safe —
   same as every other file here.
5. **Honest numbers.** A muscle "level" is a training-volume counter with a name on it, not
   a strength measurement — so the count renders next to the rank every single time, the way
   this app states a caveat where the number is rather than in a footer (§7.2).

---

## 3. The muscle taxonomy

The **candidate** list below is 19 groups. Five of them turned out to be untrainable by this
app's 84 exercises and were cut — see §3.2, which is the authoritative taxonomy at **14
groups**. The full candidate table is kept here because the cut is the interesting part:

| Key | Label | Side | Size class |
|---|---|---|---|
| `neck` | Neck | both | small |
| `traps` | Traps | back | medium |
| `delts_front` | Front delts | front | small |
| `delts_side` | Side delts | front | small |
| `delts_rear` | Rear delts | back | small |
| `chest` | Chest | front | large |
| `lats` | Lats | back | large |
| `upper_back` | Upper back | back | medium |
| `lower_back` | Lower back | back | medium |
| `biceps` | Biceps | front | small |
| `triceps` | Triceps | back | medium |
| `forearms` | Forearms & grip | front | small |
| `abs` | Abs | front | medium |
| `obliques` | Obliques | front | small |
| `glutes` | Glutes | back | large |
| `quads` | Quads | front | large |
| `hamstrings` | Hamstrings | back | large |
| `calves` | Calves | back | small |
| `adductors` | Adductors | front | small |

(19 rows. The original justification for splitting `delts` three ways was "a Pike Push-up and
a Face Pull are not the same shoulder" — but there is no Face Pull in this app, which is
exactly the imported-taxonomy problem §3.2 unpicks.)

### 3.1 The exercise → muscle map

New file `fitness/muscles.data.js`:

```js
window.MUSCLE_MAP = {
  push_2:  { primary: ["chest", "triceps"], secondary: ["delts_front", "abs"] },
  pull_4:  { primary: ["lats", "upper_back"], secondary: ["biceps", "forearms", "abs"] },
  squat_5: { primary: ["quads", "glutes"], secondary: ["hamstrings", "adductors", "abs"] },
  // … one entry per exercise id
};
```

All **84** ids get an explicit entry — no exceptions, because the fallback below is a
safety net, not a shortcut. A generated checklist of every id lives at
`tools/exercise-ids.tsv` so the map can be audited against the DB.

**Pattern fallback** (used only if an id is missing — e.g. a future exercise added to
`EXERCISE_DB` before its map entry):

| pattern | primary | secondary |
|---|---|---|
| push | chest, triceps | delts_front, abs |
| pull | lats, upper_back | biceps, forearms |
| squat | quads, glutes | hamstrings, abs |
| hinge | glutes, hamstrings | lower_back, abs |
| core | abs | obliques, lower_back |
| shoulder | delts_front, delts_side | triceps, abs |
| dip | chest, triceps | delts_front |
| skill | abs | delts_front, lats |

A console warning fires once per unmapped id in dev so gaps surface instead of silently
degrading. A `tools/check-muscle-map.js` one-liner (node, no deps) diffs `EXERCISE_DB`
against `MUSCLE_MAP` and exits non-zero — run it after adding exercises.

---

### 3.2 The taxonomy is derived from the DB, not imported

**Review finding (blocker).** The first draft of this plan lifted a 19-group
taxonomy from workout.cool. Checked against all 84 exercises, **five of those groups
can never be trained by this app**: `neck` (zero exercises), `calves` (zero — no calf
raise exists), `traps` (absent from every fallback row), `delts_rear` (only Australian
Row, which has `level: null` and is never auto-selected), and `adductors` (only Cossack
Squat, same problem). The tell was in the plan's own justification — "a Pike Push-up and
a Face Pull are not the same shoulder" — **there is no Face Pull in this app.** That
sentence was reasoning about a gym library.

Consequences had it shipped: `muscle-balanced` and `muscle-full-week` permanently
unearnable, five undismissable entries in the Neglected list from day one, and a "Plan
this" button leading to a planner with zero candidates.

**So:** the taxonomy is **14 groups**, and it is generated from `MUSCLE_MAP` rather than
declared ahead of it. `tools/check-muscle-map.js` asserts *both* directions — every
exercise id is mapped, **and** every group appears as `primary` on at least one exercise.
That second assertion, written first, is what would have caught this.

Dropped: `neck`, `calves`, `adductors`, `traps` (folded into `upper_back`), `delts_rear`
(folded into `upper_back`). Remaining 14: `delts_front`, `delts_side`, `chest`, `lats`,
`upper_back`, `lower_back`, `biceps`, `triceps`, `forearms`, `abs`, `obliques`, `glutes`,
`quads`, `hamstrings`.

Anything defining "every group" — the balance badges, the Neglected list — reads that
generated list, so adding a calf raise later re-enables `calves` with no other edit.

---

## 4. Where the work units come from

**Read `reps`, not `value`.** `engine.sessionVolume` uses `Number(st.value)` because it is
only ever called with the **live** workout object, whose sets are `{value, weight, done}`.
What `finalizeSession` persists into `sessions[]` is a different shape —
`{ reps: num(st.value), weight: num(st.weight) }`. Since all muscle XP derives from
`sessions[]`, copying that formula literally yields `undefined / 5` → `NaN` for every set,
every muscle, forever — a silent zero, not a crash. The two existing history consumers get
this right and are the reference: `_adaptTarget` and `evaluate` both read `Number(st.reps)`.
Hold seconds are stored under the `reps` key too.

```
setWork(set, mode) = mode === "hold" ? Math.round(set.reps / 5)   // 5 s ≈ 1 rep-unit
                                     : set.reps
```

**No weight multiplier.** `sessionVolume` applies `× 1.5` when `weight > 0` — a *binary*
flag, not a load-proportional one. Typing `1` in the weight field would buy +50% work, and
because everything is derived, it would **retroactively re-level the user's entire
history** with no event to notice. Twelve reps is twelve reps; this is a volume counter, so
it counts volume. This is a deliberate divergence from `sessionVolume`, stated as one.

Per-muscle attribution, three tiers rather than two:

```
work(muscle) = Σ setWork × contribution
contribution = 1.00  (primary)
             = 0.40  (secondary)      SECONDARY_SHARE
             = 0.15  (stabiliser)     STABILISER_SHARE
```

The third tier exists because of a real modelling failure caught in review: with `abs` as a
0.4 secondary on 5 of 8 patterns, **59% of all ab volume was spillover from squats,
hinges, presses and pike push-ups**, and `abs` levelled ~3× faster than `chest` on the app's
own default program. Bracing during a squat is not ab training at 40% of squat volume. It
is stabiliser work, and it is now priced as such.

Two exclusions, both deliberate:

- **Incomplete sets don't count.** Only sets with a logged value > 0.
- **`completed !== false` sessions only** — matching `gamify.fitnessDates()`.

### 4.1 Weekly targets are measured, not guessed

The first draft set weekly heat targets from a size class (large 90 / medium 60 / small 40).
Modelled against the app's own 4-day rotation, no group hit 1.0 cleanly and **three sat
permanently in the `peak` "check recovery" bucket** — the app would have spent every week
telling the user that the program it generated was overtraining them. That is the app
arguing with itself, and it's the failure mode the README's Insights section exists to
avoid.

Instead: compute each group's actual weekly work under the default program once, and use
that as its target. Ratio ≈ 1.0 then means "you followed the program" **by construction**,
and `peak` becomes a real signal rather than a standing false alarm. The numbers land in
`muscles.data.js` as a generated table with the script that produced them.

---

## 5. Feature 1 — the muscle map ("what am I actually working?")

New BASALT section: **Muscles**.

### 5.1 Body diagram

Two hand-authored SVG silhouettes (front + back), each `viewBox="0 0 220 420"`, with one
`<path data-muscle="chest">` per region. Schematic, not anatomical illustration — rounded
blocked-in shapes, which read better at phone size anyway and keep this to ~40 paths total.
Fill colour comes from the heat scale.

**This is the single largest asset in the plan.** It is isolated in `muscles.data.js` as
one exported string constant, so it can be replaced or improved without touching logic.

### 5.2 Window selector

`Session · 7 days · 30 days · All time`. Default **7 days** — the question "which muscles am
I working out" is a weekly-balance question. `Session` shows the last completed session and
is also embedded live in the Today view (§5.5).

### 5.3 Heat scale

Heat is *relative to a weekly target*, not to the biggest number on screen, so a light week
looks light instead of being normalised into looking fine:

```
target(muscle) = { large: 90, medium: 60, small: 40 }[sizeClass]   // work units / week
ratio = work7d / target
```

| Ratio | Bucket | Meaning |
|---|---|---|
| 0 | `cold` | not trained this week |
| 0 – 0.5 | `low` | some work, under target |
| 0.5 – 1.0 | `on` | on track |
| 1.0 – 1.75 | `high` | above target |
| > 1.75 | `peak` | well above — check recovery |

Rendered as a Gruvbox-native sequential ramp (`bg2 → yellow → orange → red-bright`).
**Colour is never the only channel:** every region carries a `<title>` with the exact
numbers, the list below the diagram states them, and the `peak` bucket gets a hatch
pattern. Before writing any of this, load the `dataviz` skill — this is a heatmap and it
should follow the house palette/legend rules rather than ad-hoc colours.

### 5.4 Below the diagram

- **Neglected** — groups at `cold` for 7+ days, each with a one-tap **"Plan this"** button
  that opens the muscle-filtered swap modal on that group (§6). This is the loop that makes the
  heatmap actionable instead of decorative.
- **Per-group list** — level, XP bar, last trained, 7d work, top 3 exercises that fed it.
- Clicking any region or row opens a **group detail modal**: history sparkline, the
  exercises that hit it (deep-linking to the existing `#modal-guide`), and its level path.

### 5.5 Two embedded surfaces

- **Today view** — a compact horizontal muscle strip above the exercise list showing what
  today's session will hit, updating as sets are logged. Injected via a hook, not by
  rewriting `renderActive`.
- **Post-session summary** — after `finalizeSession`, the existing completion screen gains
  "Worked: chest, triceps, front delts · +142 XP · Chest reached L4 — Tempered".

---

## 6. Feature 2 — muscle-group exercise choice

**Revised after review: this is no longer a standalone 3-step wizard.** The reasoning is
in §12; the short version is that a freeform session builder is a second programming system
competing with the one this app is built around, and it needed eight guard edits across
`basalt.js` to stop it corrupting rep targets, the rotation, the 12-day projection and the
phase grade. The capability people actually want from it — *choose exercises by muscle
group* — already has a home.

### What already exists

`engine.openPreviewSwap` (`basalt.js:2678`), reachable from the Program preview via a
per-pattern **Swap** button (`:2586`), already:

- lists every exercise in a pattern via `DB.listByPattern`
- filters Era-II movements by graduation status
- sorts equipment-satisfied first, then by ladder level
- badges each row `ready` / `needs dumbbells` / `current`

That is Step 1 and most of Step 3 of the old wizard, already built, already shipped, and
already inside the program rather than beside it.

### What gets added to it

1. **Muscle chips on every row.** Each exercise shows its primary and secondary groups,
   read from `MUSCLE_MAP`. This is the thing the app fundamentally could not say before.
2. **A muscle-group filter** across the top — the 14 trainable groups, collapsed to 6
   section headers. Selecting `triceps` narrows the list to movements that train triceps,
   *across patterns*, not just within the one you clicked Swap on.
3. **A "Plan this" entry point.** Every group in the Muscles view's Neglected list gets a
   button that opens this modal pre-filtered to that group. That closes the loop the whole
   feature exists for: the heatmap shows you a gap, one tap shows you what fills it.
4. **A coverage line** at the top of the modal: what the current day's exercises work, and
   how the highlighted swap would change it.

### What this costs, and what it gives up

**Costs:** roughly a day, entirely additive, and **none** of the `custom` machinery — no
`dayType: "custom"`, no `isProgramSession` predicate, no `_adaptTarget` / `evaluate` /
`recommendedDayType` / `projectUpcoming` guards, no `WARMUPS`/`DAY_LABEL`/`DAY_PATTERNS`
entries. `basalt.js` drops from eight surgical edits to zero. The riskiest part of this
plan disappears.

**Gives up — state it plainly:** you can pick a *different exercise for a slot the program
chose*, but you cannot compose an arbitrary session from scratch. There is no "build me a
shoulders-and-triceps day" flow. The program still decides that today is Push Day and that
Push Day has four slots; the muscle filter decides what goes in them.

If that turns out to be the wrong trade, §12 records the full wizard design and the eight
edits it needs. Nothing here forecloses it — the muscle map, the ranking rule and the
coverage preview are the same components either way.

### Session-scoped equipment (kept)

The one piece of the wizard worth carrying over verbatim. The swap modal reads
`App.STATE.equipment`, and gains a session-scoped override — "training somewhere else
today" — that never writes back to the saved profile. Shown with its reason inline
("session only — change it for good in Settings"), the way the backfill banner and the
onboarding suggestions already explain themselves. It is a direct application of the
README's *"It never silently configures itself."*

Two upstream inconsistencies this surfaces, both worth fixing while in here:

- **`buildWorkout` does not filter by equipment** (`:1820`) — it takes `DB.byLevel(p, level)`
  unconditionally. So a user with no pull-up bar is *prescribed* Pull-ups in Today but
  cannot select them in the swap modal. The direction is backwards.
- **Rep defaults disagree.** `buildWorkout` uses `s.tiers[p].repsTarget` (8/5/12/12/30/6/8);
  the old wizard spec said `BASE_REPS` (12/8/14/14/30/8/8). The tier value is correct.


## 7. Feature 3 — muscle levels

### 7.1 Curve

```
xpForLevel(L) = round(120 * Math.pow(L - 1, 1.7))   // cumulative
```

| Level | Rank | Cumulative work units |
|---|---|---|
| 1 | Dormant | 0 |
| 2 | Waking | 120 |
| 3 | Kindled | 390 |
| 4 | Tempered | 776 |
| 5 | Forged | 1,272 |
| 6 | Hardened | 1,848 |
| 7 | Honed | 2,520 |
| 8 | Granite | 3,276 |
| 9 | Basalt | 4,116 |
| 10 | Obsidian | 5,028 |

Calibration: a push day contributes roughly 40 work units to the chest; at 2 push sessions a
week that's L5 (Forged) in about four months and L10 in a bit over a year of consistent
training. Both constants (`120`, `1.7`) are named and adjacent, so retuning is one edit.

**Levels never decay.** Volume you did is volume you did. Freshness is a *separate* signal
(the heat scale + "last trained N days ago"), which is the honest way to say "you've earned
this but you haven't touched it lately" without deleting someone's history.

### 7.2 Naming: put the number next to the rank

Review pushed back hard here, correctly. The README's house rule is that a caveat lives
**where the number appears**, not in a footer — period predictions carry their own cycle
count, the printable summary states on its face that it's self-reported, the patterns tab
puts its multiple-comparison warning in a card at the top. Against that, "the UI says so
once, in plain words" is not the standard.

The problem is specific: **"Chest — Forged"** is a metallurgical hardness claim attached to
a number that is literally `Σ reps`. Nothing about "Granite" says "you have accumulated
3,280 rep-units", and a user with groups sitting at "Dormant" will read it as a body
assessment.

So every rendering of a rank carries its count adjacent — tile, detail modal, and the
level-up toast:

> **Chest · L4 Tempered** · 1,248 work units

The number *is* the disclaimer, and it costs nothing.

Second naming problem: `s.tiers[pattern].level` is already a 1–6 "level" in this app, and it
*is* a genuine progression measure. Two different "levels" with different scales and
different honesty properties will be read as the same fact. Muscle levels are therefore
labelled **"conditioning"** in the UI (`Chest conditioning · L4`), leaving "level" to mean
the ladder it already means.

### 7.3 Level-up celebration

XP is derived, but "have I already celebrated this?" is state. Per review, it goes in
`ironframe.ui` via the existing `App.util.uiSet` — **not** `App.STATE`:

```js
App.util.uiSet("muscle.seenLevels", { chest: 4, lats: 3, … });   // cache, not truth
```

That removes the `defaultState` / `healState` / `migrate` / backup-round-trip surface
entirely, and matches how `today.workout` and `section` already live. The only thing lost is
survival across a backup restore — and for a celebration-dedupe cache that is the *better*
behaviour: a restored backup should re-celebrate rather than swallow the levels.

**Seed silently on first run.** Otherwise the plan's best property — a year of history
retro-filling instantly — collides with this one and fires ~14 level-up celebrations plus
three badges the moment the user opens the update. If the cache is absent, compute, store,
and celebrate nothing.

### 7.3 Badges

Added to `js/gamify.js` `BADGES` (new cat `"Muscles"`), all reading through the public
`App.muscles` API with a null-guard for a browser where BASALT hasn't booted:

| id | emoji | Name | Test |
|---|---|---|---|
| `muscle-first` | 🩻 | Anatomy Lesson | any group reaches L2 |
| `muscle-forged` | 🔨 | Forged | **median** group reaches L5 |
| `muscle-obsidian` | 🌋 | Obsidian | **median** group reaches L10 |
| `muscle-balanced` | ⚖️ | Balanced Build | every *trainable* group at L3+ |
| `muscle-full-week` | 🗺️ | Full Sweep | every *trainable* group trained in one 7-day window |

`Balanced Build` and `Full Sweep` are the two that make the whole feature point somewhere:
they reward fixing the gaps the heatmap shows you. Both now read the generated trainable-group
list from §3.2 rather than a hardcoded taxonomy, which is what makes them earnable at all.

Three changes from the first draft, all from review:

- **Median, not "any".** Keyed on *any* group, `Forged` and `Obsidian` were both won by
  whichever group the secondary-spray inflated — three badges for "you used the app", which
  `first-workout` / `twenty-workouts` already cover. Median rewards balance, which is the
  thing the feature is actually about.
- **`muscle-planner` is cut.** "Finish 5 planner-built sessions" paid the user to do the
  exact thing this plan's own risk table rates High severity. Whatever guards ship, a badge
  is a standing invitation to route around the program.
- **All five get a `progress()` string.** Every one of the existing 48 badges has one;
  `"11/14 groups at L3+"` is how this codebase makes a locked tile honest.

---

## 8. File-by-file change list

### New files

| File | ~Lines | Contents |
|---|---|---|
| `fitness/muscles.data.js` | 400 | `MUSCLE_GROUPS` (14, generated), `MUSCLE_MAP` (84 ids), pattern fallback, measured weekly targets, rank names |
| `fitness/muscles.js` | 600 | Engine (`workByMuscle`, `xp`, `level`, `heat`, `neglected`) + **Muscles** view + Today strip + finalize hook + `window.App.muscles` public API |
| `css/muscles.css` | 260 | Heat ramp, level cards, swap-modal muscle filter — all on existing Gruvbox tokens |
| `tools/check-muscle-map.js` | 40 | Audits `MUSCLE_MAP` against `EXERCISE_DB`; non-zero exit on gaps |

### Edited files

**`index.html`** — 4 lines:
- `<link rel="stylesheet" href="css/muscles.css" />` after `basalt-makeover.css`
- one section inside `#app > .container`:
  `<section class="view hide" id="view-muscles" data-view="muscles"></section>`
- two `<script>` tags **after** `fitness/basalt.js`

**`fitness/basalt.js`** — **no engine edits.**

This is the payoff from the §6 revision. The first draft needed three; review raised that to
eight, all of them guards against a freeform session leaking into the program's brain
(`_adaptTarget`, `recommendedDayType`, `projectUpcoming`, `evaluate`, `_progress`, plus four
`DAY_*` map entries). Extending the swap modal instead of building a parallel session engine
removes every one of them. The full list is preserved in §12 in case the wizard is ever
revived.

The two additions to `openPreviewSwap` (muscle chips, muscle filter) are made by wrapping
it at parse time, not by editing it — `App.engine` is a public object and its methods are
resolved by property lookup at call time.

*Not* edited: `SECTIONS` and `ICONS`. Both are exposed on `window.App` as live references,
and `bootstrap()` → `buildNav()` runs on the core's `DOMContentLoaded` handler — which is
registered *before* our scripts even parse. So `muscles.js` pushes its **one** nav entry at
**parse time** (not inside a `DOMContentLoaded` handler) and it is present when the nav
is built. Views then register via the standard `mount()` pattern Parts 4–8 already use;
`registerView` re-renders if its section is already on screen, so the boot race is already
solved. *(Both reviewers verified this independently against the boot order.)*

**Two things §5.5 claimed exist, and don't:**
- There is **no render hook** for the Today-view muscle strip — `renderActive` does a
  wholesale `el.innerHTML =` and `VIEWS`/`renderToday` are IIFE-private. Workable mechanism:
  wrap `App.registerView` at parse time to capture Part 3's `renderToday` as it registers.
  For the finalize hook, monkey-patch `App.engine.finalizeSession` — `App.engine` is public
  and `completeSession` resolves it by property lookup at call time.
- There is **no post-session completion screen** to extend. `completeSession` fires toasts
  then routes to the dashboard. The muscle summary needs its own surface.

*Not* edited: `SECTIONS` and `ICONS`. Both are exposed on `window.App` as live references,
and `bootstrap()` → `buildNav()` runs on the core's `DOMContentLoaded` handler — which is
registered *before* our scripts even parse. So `muscles.js` pushes its **one** nav entry at
**parse time** (not inside a `DOMContentLoaded` handler) and it is present when the nav
is built. Views then register via the standard `mount()` pattern Parts 4–8 already use;
`registerView` re-renders if its section is already on screen, so the boot race is already
solved.

**`js/gamify.js`** — the five badges above. The category *order* lives in
`js/views/achievements.js:26`, not here, and is optional — unknown categories are appended
automatically. Bump the README's "48 badges across 16 categories" to 53/17 in both places it
appears.

**`service-worker.js`** — 3 new paths in `PRECACHE`, and another `CACHE_VERSION` bump
(`v9` → `v10`; `v9` already shipped with the BASALT makeover). Missing
this ships a broken offline app, so it is a checklist item, not a footnote.

**`README.md`** — the tab table gains the Muscles section; a short "muscle levels are volume,
not strength" note in the design-decisions section.

---

## 9. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| ~~Planner sessions corrupting the program~~ | ~~**High**~~ → **eliminated** | Was the largest risk in this plan, across five leak sites. Removed by not building a parallel session engine (§6). No `custom` flag, no `dayType`, no guards. |
| SVG body map is a lot of hand-drawing | Low — descoped | Moved to optional Phase 6. Phase 2 ships the sorted table, which is the accessible representation anyway. |
| Muscle filter surfaces an exercise the user can't do | Low | Equipment badges (`ready` / `needs dumbbells`) already exist in the swap modal and are reused unchanged. |
| Muscle attribution is opinionated | Low | Stated in the UI; one table, easy to disagree with and edit. |
| Recompute cost on every render | Low | Linear in sets; memoised per `sessions.length` + last id, invalidated on write — same shape as `gamify._fitnessDates`. |
| Colour-only encoding | Low — table-first | Phase 2 is a table with numbers; colour is decoration on top of text, not the channel. If Phase 6 ships, regions get `<title>` numbers, a hatch on `peak`, and keyboard focus. |
| Service-worker cache not bumped | Medium — silent stale app | Explicit checklist item in §8. |
| `Hub.gamify` badges reading `window.App` before boot | Low | Null-guarded, and `recompute` already re-runs after BASALT boots. |

---

## 10. Phasing

**Phase 1 — the data layer.** `muscles.data.js` (map + taxonomy, no SVG),
`muscles.js` engine + public API, `tools/check-muscle-map.js`. Nothing user-visible.
*Done when:* `App.muscles.levels()` returns sane numbers for existing session history.

**Phase 2 — the Muscles view, as a table.** Sorted group list (group · conditioning level ·
7d work · target · last trained), window selector, detail modal, Neglected list, nav entry,
CSS. *Done when:* the last session's worked muscles are visible.

The body diagram moves to **Phase 6**. Review made the case and it holds: accessibility
already requires that every number the SVG encodes also appear in a text list beneath it, so
the diagram carries no information the list doesn't — at 14 regions, a sorted table conveys
strictly more, because you can rank rows and you cannot rank colours. It was also the single
largest asset in the plan. It becomes a genuinely optional flourish rather than a
schedule risk, and it defers the `dataviz` palette work behind something already useful.

**Phase 3 — levels & badges.** Rank curve, conditioning bars, `seenLevels` cache, level-up
celebration, post-session summary, five badges. *Done when:* finishing a session pops a
level-up.

**Phase 4 — muscle-group exercise choice.** Muscle chips and the muscle filter on
`openPreviewSwap`, session-scoped equipment override, coverage line, "Plan this" from the
Neglected list. *Done when:* the Muscles view can hand you straight to the movements that
fill a gap. **~1 day, and no `basalt.js` engine edits** — this was a 550-line wizard plus
the eight riskiest changes in the plan before §6 was revised.

**Phase 5 — polish.** Today-view strip, README, service-worker bump, offline check.

**Phase 6 — the body diagram (optional).** Front/back SVG over the Phase-2 data, heat ramp,
`dataviz` palette rules. Ships or doesn't; nothing depends on it.

Phases 1–2 answer "which muscles am I working out"; 3 answers "gamified level-up"; 4
answers "choose exercises by muscle group". Each phase is independently shippable, and
1–3 deliver the two headline features without touching the training engine at all.

---

## 11. Decisions worth a second opinion

1. **Does non-BASALT work count?** The hub also logs mobility routines, movement snacks and
   runs. Current plan: **no** — muscle XP comes from lifting sessions only, because that is
   where set-level data exists. Note the tension review flagged: `calves` was cut for having
   no calisthenics coverage, and running is precisely what would train it. So this decision
   and the taxonomy are the same decision. If running ever counts, `calves` comes back.
2. ~~**Are 19 groups too many for a phone?**~~ **Resolved** — 14 trainable groups, generated
   from the map (§3.2), collapsed to 6 section headers in the swap modal's muscle filter.
3. **`SECONDARY_SHARE = 0.4` / `STABILISER_SHARE = 0.15`** — both defensible a notch either
   way. Two named constants; worth re-checking against real sessions after phase 1, since
   the whole per-group balance turns on them (§4).
4. **Level cap at 10.** Beyond that, prestige stars per 5,000 further work units, or just
   let it sit at Obsidian. Current plan: sit at Obsidian, revisit once someone gets there.

---

## 12. What review changed

Two independent reviews ran against this plan and the codebase: one on technical
integration, one on product and data-model soundness. They converged on the same two
blockers from opposite directions, which is the strongest signal in the whole exercise.

**Blockers found and fixed above:**

1. **The `custom` guard covered one of five leak sites.** Planner sessions would still have
   rewritten rep targets (`_adaptTarget`), reset the training rotation to Push Day every
   time (`recommendedDayType`, `projectUpcoming`), and skewed the phase grade that decides
   advance/consolidate/**deload** (`evaluate`). Replaced the flag with a session-level
   predicate — §6, §8 edit 1.
2. **Muscle XP would have computed to exactly zero.** §4 copied `sessionVolume`'s `st.value`,
   but persisted sets store `st.reps`. A silent `NaN`, not a crash, and it would have taken
   the plan's best property — instant retro-fill of existing history — down with it. §4.
3. **Five of nineteen muscle groups were untrainable by this app**, making two badges
   permanently unearnable and the Neglected list a standing false alarm. Taxonomy is now
   generated from the map and asserted in both directions. §3.2.
4. **Weekly heat targets put three groups permanently in "check recovery"** on the program
   the app itself generates. Targets are now measured from the default program. §4.1.

**Also changed:** the `1.5×` weighted multiplier dropped (a binary flag that would let a
`1` in the weight field retroactively re-level all history); a `stabiliser` contribution
tier added because `abs` was 59% spillover and levelled ~3× faster than `chest`;
`seenLevels` moved to `ironframe.ui` and seeded silently on first run to prevent a
fourteen-celebration barrage on upgrade; rank names now always render with their work-unit
count, and "level" renamed to "conditioning" to stop colliding with the ladder levels that
already exist; badges rekeyed to the median group and given `progress()` strings;
`muscle-planner` cut for paying users to route around the program; the body diagram
demoted to an optional Phase 6.

**Verified correct and unchanged:** derive-don't-store; the parse-time `SECTIONS`/`ICONS`
nav injection; `sessions[].exercises[].key` being the exercise id; unknown state keys
surviving `migrate`/`healState`/backup/restore; PRs staying live for planner sessions;
session-scoped equipment; colour never being the only channel; the service-worker
checklist; and the phase boundaries.

### The planner decision — taken

Review's product reviewer recommended cutting the 3-step wizard, on the grounds that
`openPreviewSwap` already does equipment filtering, Era-II gating, ladder-level sorting and
`ready` / `needs dumbbells` badging — so muscle-driven exercise choice is a filter away,
not a feature away.

**Taken.** §6 is now the swap-modal extension; §8 has no `basalt.js` engine edits; Phase 4
went from ~550 lines plus the eight riskiest changes in this plan down to about a day.

What that buys: the single largest risk here — a self-planned session leaking into
`_adaptTarget`, `recommendedDayType`, `projectUpcoming`, `evaluate` and `_progress` — stops
being a risk to mitigate and becomes a thing that cannot happen, because there is no
parallel session engine to leak from.

What it gives up, stated plainly so it isn't discovered later: **you can choose a different
exercise for a slot the program picked, but you cannot compose a session from scratch.**
There is no "build me a shoulders-and-triceps day". The program still decides that today is
Push Day with four slots; the muscle filter decides what fills them.

### If the full wizard is ever revived

Everything it needs is recorded here, so this is a reversible decision rather than a lost
design:

**The flow.** Step 1 equipment (pre-checked from `App.STATE.equipment`, session-scoped
override). Step 2 the 14 groups under 6 section headers, `cold` groups badged *Neglected*
and sorted first. Step 3 candidates = muscle ∩ equipment ∩ Era gate
(`ex.era === 1 || App.STATE.era === 2`), ranked primary-match > secondary-match > distance
from the user's tier level for that pattern, with a live coverage bar above.

**The hand-off.** Emit a `buildWorkout`-shaped object to `App.util.uiSet("today.workout", w)`
with `dayType: "custom"`, then `App.showSection("today")`. Note `warmup`/`cooldown` are
**parallel boolean arrays**, not content — and `[].every(Boolean)` is `true`, so omitting
`WARMUPS.custom` silently logs every session as `warmupDone: true`.

**The eight guards it requires:**

1. `isProgramSession(x)` = `ROTATION.indexOf(x.type) >= 0`, applied at `_adaptTarget`
   (`:1877`), `recommendedDayType` (`:1751`), `projectUpcoming` (`:4506`), `evaluate` (`:5122`)
2. `finalizeSession` (`:1999`) — `if (ex.era2 || ex.custom) return;` + persist `custom` on
   both the exercise and the session record
3. `evaluate` (`:5133`) — same per-exercise guard
4. `engine.DAY_LABEL` (`:1712`) gains `custom` — without it `heroCard` renders
   *"Start undefined →"*
5. `WARMUPS` / `COOLDOWNS` gain `custom`, aliasing `fullbody`
6. `DAY_TYPE_LABEL` (`:4545`) gains `custom` — **not** `DAY_TYPE_COLOR`, which is already
   fallback-guarded
7. `DAY_PATTERNS` gains `custom` — `era2Accessory` (`:1789`) reads `pats.length` unguarded
8. `newSets` (`:2163`) exported or reimplemented; live sets use `value`, persisted use `reps`

Plus: `uiSet` is size-blind and swallows every failure, and re-serialises the whole workout
on every stepper tick — a 12-exercise custom session carrying full `cues`/`mistakes` text is
a large round-trip per interaction, and a quota overflow drops the workout *and* the saved
section with no error. Cap the builder at ~8 exercises.
