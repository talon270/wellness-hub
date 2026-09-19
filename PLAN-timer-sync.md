# Timers that disagree with each other — plan

Written 2026-09-19, against `js/timers.js`, `js/core.js`, `js/views/desk.js`,
`js/views/eyecare.js` as of commit `fc001b2`.

**Method:** line-level read of every `Hub.Timer`, `setInterval`, `Hub.onTick`
and `reminders.reset` call site in `js/` and `fitness/`, then a Playwright
script (`scratchpad/probe.py`, `probe2.py`) driving the real buttons on
`index.html` to confirm each disagreement. Every finding below quotes what
that run actually produced. Nothing is reported from reading alone.

**Implemented 2026-09-19.** Parts A1–A5 and the cheap A4 fix are in the
working tree; A6 went in with A2 since it was one line in the same function.
Before/after numbers for every finding are in the "Verification" section at the
foot of this file. The findings below are left in their original wording so the
record of what was wrong survives the fix.

---

## The one sentence

The app has **three independent clock systems for two habits**, and none of
them tells the others when it advances:

| System | Storage | Who sees it | Who resets it |
|---|---|---|---|
| `Hub.reminders` intervals | `nextAt` (in-memory) | "Next reminder" card, sidebar line, the OS notification | `reminders.reset(key)` — 18 call sites, all correct |
| `Hub.timers` rack | `wellnessHub.ui → timers` | the dashboard card only | its own row buttons, nothing else |
| `deskSession` sitting clock | `wellnessHub.v1 → logs.deskSession` | Desk tab, global "At Desk" button | the Desk tab's own buttons |

`Hub.reminders.reset(key)` is already the universal "I just did this habit"
call — every quick-log tile, every guided flow, every settings change routes
through it. The other two systems simply don't listen to it. That is the root
cause, and it is one seam.

---

## Part A — findings, ranked

### A1 · BUG (high): doing the habit does not restart the visible countdown

`js/timers.js` CATALOGUE rows `eye20` and `deskreset` hold their own `endAt`
stamp in the UI store. Nothing outside `js/timers.js` ever writes it.
`js/views/eyecare.js:297` (`runBreak`'s `onDone`) and `js/views/desk.js:90`
(`logStand`) both call `Hub.reminders.reset(...)` and stop there.

**Concrete failure, from the run:**

```
B. take the 20s look-away in Eye tab; does rack eye20 reset?
   eye20 endAt before look-away: 1789809981760
   eye20 endAt after  look-away: 1789809981760
   restarted by the habit being done?: False
   eye2020 today: 1

F. rack deskreset endAt before/after 'Log a stand break':
   1789811591802  1789811591802   changed: False
```

So: start the Eye break timer on the dashboard at 14:00. Take the look-away
from the Eye Care tab at 14:05 — it counts, the streak moves, the reminder
resets. The dashboard still fires "time for a 20-second look-away" at 14:20,
fifteen minutes after you already did it. Same for stand breaks.

**Fix:** give each CATALOGUE row a `remKey` (`"eye"`, `"stand"`) and have
`reminders.reset(key)` call back into the rack to restart any **live** row
carrying that key. One edit in `core.js`, one in `timers.js`. Smallest because
`reset()` is already the chokepoint every one of the 18 paths goes through —
patching `eyecare.js` and `desk.js` individually would leave the other sixteen
still wrong, including any added later.

Symmetrically, the rack's own `start`/`restart` should call
`reminders.reset(remKey)`, so pressing Start on the dashboard also lines up
the sidebar and the "Next reminder" card instead of leaving two countdowns
drifting toward two separate notifications.

---

### A2 · BUG (high): the desk has two clocks for one chair

`timers.js`'s `deskreset` row (45-minute countdown) and `desk.js`'s
`deskSession` (count-up sitting clock, alerting at `sitAlertMin`) model the
identical event. Neither knows the other exists.

**Concrete failure, from the run:**

```
C. start the sitting clock in Desk, then look at the dashboard:
   deskSession: {startedAt: '2026-09-19T09:06:48.207Z', alertedAt: 0}
   rack deskreset clock reads: 45:00
   rack deskreset row class:   wh-timer          (idle — not running)
   rack store: {eye20: {...}}                    (no deskreset key at all)

D. start 'Desk reset' on the dashboard, then look at Desk:
   deskSession: None
   sitting-clock chip: "stopped"
   At Desk button text: "At Desk"                (not running)
   rack deskreset still counting: True
```

Worse than cosmetic: run both and you get two independent "stand up" nudges,
from `desk.js:106`'s tick handler and from `timers.js`'s `sweep()`.

**Fix:** delete the `deskreset` clock record and make that rack row a
**projection of `Hub.desk`** — its toggle calls `Hub.desk.startSitting()` /
`stopSitting()`, its digits count down from `sitAlertMin` using
`Hub.desk.sittingMinutes()`. `Hub.desk` already exposes all four functions
(`desk.js:692`). Smallest because it is a net **deletion**: the row's `log`
function, its `endAt` record and its half of the double-nudge all go away, and
"am I at my desk" keeps exactly one answer. The row loses Pause, which the
sitting clock never had — you are either in the chair or you aren't.

---

### A3 · INCONSISTENCY (medium): the rack ignores your own interval setting

`timers.js:36` hard-codes `sec: 20 * 60` and `sec: 45 * 60`. The comment says
these mirror `REMINDER_META.eye` and `settings.sitAlertMin` — they did, at the
defaults, and then stopped.

**Concrete failure, from the run:**

```
E. set eye interval to 30 min in Settings:
   eyecare chip says:  "every 30 min"  /  "Remind me every 30 minutes"
   rack eye20 idle reads: 20:00
```

**Fix:** read the duration from `settings.reminders[remKey].intervalMin`
(desk from `sitAlertMin`) at start time, keeping the current numbers as the
fallback. Smallest because the constants already exist and are already
validated in `core.js:398-401`.

---

### A4 · DESIGN RISK (medium): `sitAlertMin` and `reminders.stand.intervalMin`
are two settings for one nudge

Both default to 45. `desk.js:113` uses `sitAlertMin` for the on-screen "X min
until your next break is due"; `core.js`'s reminder loop uses
`reminders.stand.intervalMin` for the notification. Settings exposes both, on
different screens (`settings.js:599` and the reminder table at `:931`), with no
hint they are the same idea. Change one and the screen disagrees with the
notification, silently.

**Fix:** keep `sitAlertMin` as the one the sitting clock reads, and have the
Settings/Desk writer for either field write both. No schema change, no
migration, one number to think about. **This one needs your call** — the
alternative is dropping `sitAlertMin` from the schema, which is a
`SCHEMA_VERSION` bump and a migration for a field that only saves a line of
code. I'd take the cheap version.

---

### A5 · MODEL GAP (medium): five tabs show a dead number where a live one belongs

Every tab that owns an interval reminder prints it as static text and never
counts down. Only the dashboard's "Next reminder" card and the sidebar show a
live figure, and only for the single soonest reminder of the fifteen.

| View | Line | Currently reads | Should read |
|---|---|---|---|
| `eyecare.js:340` | 20-20-20 card chip | `every 20 min` | `next break in 12:43` |
| `eyecare.js:350` | switch label | `Remind me every 20 minutes` | unchanged (it's a setting) |
| `wellness.js:108` | hydration card | `Nudge me every 60 minutes` | + live countdown |
| `wellness.js:226` | posture card | `Check in every 60 minutes` | + live countdown |
| `bodycare.js:132` | sunscreen card | `Remind me every 120 minutes` | + live countdown |
| `desk.js:448` | stand card chip | `every 45 min` | + live countdown |

This is the other half of "it doesn't reflect in the eye tab": even with A1
fixed, the Eye Care tab has nowhere for the countdown to appear.

**Fix:** add `Hub.reminders.dueIn(key)` (returns seconds, or `null` when that
reminder is off) — three lines beside `reminders.next()`, which already does
the arithmetic. Then each view paints one span from its existing `Hub.onTick`
subscription. Fixing the class, not the instance: one accessor, six identical
call sites, and any future interval reminder gets it free.

---

### A6 · COSMETIC (low): the rack repaints on every tab

`show()` hides views with `.wh-hide` rather than unmounting them, so
`timers.js`'s `tickPaint()` finds `#wh-timers` and rewrites the digits once a
second regardless of which tab you're on. Harmless, and it is what makes A2's
cross-tab reading work at all. **Fix:** gate on `Hub.activeView() ===
"dashboard"`, the way `dashboard.js:556` already does. Low value; include it
or don't.

---

### Checked and found correct — not findings

- **BASALT's rest timer** (`fitness/basalt.js:3931`) appends its bar to
  `document.body`, so it already follows you onto every Hub tab. It is
  in-memory only, so a reload mid-workout loses it — real, but a different
  problem from this plan's, and out of scope below.
- **Guided flows** (eye exercises, brushing, mobility holds, breathing,
  movement snacks) all drive the single `#wh-focus` overlay and are exclusive
  by construction. No two can disagree.
- **Hydration, posture, SPF** reset their reminders correctly from every
  logging path — they have no rack row to fall out of step with. A5 is a
  missing display, not a desync.

---

## Part B — the build

Each step is independently shippable and independently verifiable.

1. **`Hub.reminders.dueIn(key)`** in `core.js` — seconds until an interval
   reminder is due, `null` when it's off. No behaviour change on its own.
2. **A1 · the sync hook.** `remKey` on both CATALOGUE rows;
   `reminders.reset()` restarts a live rack row; rack `start`/`restart` calls
   `reminders.reset()`. Verify: the `probe.py` B and F assertions flip to
   `True`.
3. **A3 · duration from settings.** Verify: `probe.py` E reads `30:00`.
4. **A2 · one desk clock.** Rack row becomes a projection of `Hub.desk`;
   `deskreset` record and its `log` deleted. Verify: `probe.py` C and D
   assertions agree in both directions, and only one stand notification fires.
5. **A5 · live countdowns in the five tabs.** Eye Care first, then the other
   four as identical repeats.
6. **A4 · one sitting-limit number** — after you pick cheap or migration.
7. **A6**, if wanted.

Verification for every step, per `skills.md` Phase 4: the same Playwright
script run against the pre-change file and the post-change file, both numbers
quoted; zero console errors on a fresh profile and a seeded one; both themes.
Timestamped backups of each file touched before the first edit.

---

## Out of scope

- **Persisting BASALT's rest timer across a reload.** Real, but it belongs to
  the fitness engine's own state, not to this plan's seam.
- **Merging `Hub.Timer` and the rack into one implementation.** The header
  comment in `timers.js` already argues why they're separate — overlay-exclusive
  vs. many-in-background — and that argument still holds.
- **Adding rows back to the rack.** It was deliberately cut to two; this plan
  makes those two honest rather than growing the list.
- **Making the rack start a reminder that is switched off.** Starting a
  countdown must not silently flip a Settings switch. Where a reminder is off,
  the rack row keeps its own clock and the tab's countdown line reads "off".
- **Any schema change**, unless you pick the migration option in A4.


---

## Verification

Same Playwright script (`scratchpad/verify.py`) run against `git archive HEAD`
(`fc001b2`) and the working tree, driving real clicks rather than
`page.evaluate` on the handlers.

| Check | Before | After |
|---|---|---|
| A1 · look-away in Eye Care restarts the running rack eye row | `False` — endAt delta 0ms | `True` — delta 22,537ms |
| A1 · Quick-log stand break restarts the sitting clock | `False` | `True`, one credit not two (`stand: 1`) |
| A2 · sitting clock started in Desk, read on the dashboard | `45:00`, class `wh-timer` (idle) | `44:57`, class `wh-timer is-running` |
| A2 · rack Desk row toggled off, read in `logs.deskSession` | session still open | `None` |
| A2 · rack Desk row toggled on, read in Desk tab + At Desk | chip `stopped`, button `At Desk` | chip `running`, button `0m at desk` |
| A3 · rack eye row with the interval set to 30 min | `20:00` | `30:00` |
| A4 · `setSitLimit(60)` → `[standInterval, sitAlertMin]` | function absent | `[60, 60]` |
| A4 · `setSitLimit(10)`, ranges differ (10 vs 15 floor) | — | `[10, 15]`, mirrored value clamped |
| A5 · live countdown present in eyecare/desk/wellness×2/bodycare | all `False` | all `True` |
| A5 · Eye Care chip counts down | element absent | `19:56 → 19:54` |

Standing checklist (`skills.md` Phase 4):

- Backup — git tree was clean at `fc001b2`, so `git archive HEAD` is the
  restore point. No `.backup` files added to a tracked repo.
- All 11 views render with **zero** console errors and zero page errors, in
  both a light and a dark theme (`gruvbox`, `rose-pine`), on a fresh profile
  **and** on a seeded one.
- **Old schema survives:** a hand-built `version: 1` save with 200 day records
  migrates to v4 with all 200 intact, `water` on a sampled day unchanged,
  `reminders.eye.days` backfilled to 7, and `quietHours.enabled` left `false`
  exactly as the v1→v2 migration intends. No `SCHEMA_VERSION` bump was needed —
  A4 mirrors two existing fields rather than merging them.
- **A pre-existing divergence is left alone and declared.** That seeded save
  had `sitAlertMin: 50` against `stand.intervalMin: 35`, and it still does
  after loading: silently rewriting a setting the user chose would be exactly
  the "never silently configure" failure. The Settings row instead says the two
  currently differ, names both numbers, and says the next edit of either will
  bring them together.
- No horizontal page scroll at 1500px in either theme.
- No `alert()` / `confirm()` anywhere in the diff.
- Backup/restore round-trips: export → `localStorage.clear()` → import →
  reload returns `water 6 / eye2020 3 / stand 4 / sitAlert 55 / standInterval
  55 / version 4`. The export still contains **no** running-timer state, which
  is the point of keeping the rack in the unversioned UI store.
- A leftover `timers.deskreset` record seeded into the UI store is pruned on
  load (`staleRackKey: false`), so the row that no longer keeps a clock leaves
  nothing dead behind.
- `node tools/check-muscle-map.js` → `OK` (untouched by this change, run
  because it is the repo's one standing data guard).

### Not done

- **A4's migration option.** You picked the cheap fix, so `sitAlertMin` and
  `reminders.stand.intervalMin` remain two stored fields kept in step by
  `Hub.setSitLimit()`. Collapsing them is still available and still costs a
  `SCHEMA_VERSION` bump.
- Everything in **Out of scope** above, unchanged — in particular BASALT's
  rest timer, which is still lost on a reload mid-workout.


---

## Follow-up, same session — audit beyond the plan

Asked "what else needs fixing", so the whole app got the same treatment. Two
further bugs found and fixed, plus a defect in the morning's own change.

### F1 · BUG (high): an abandoned guided flow logged itself and hijacked the screen

`focusLayer.open()` (`js/core.js`) replaced the overlay's `innerHTML` and
overwrote `focusOnClose` **without ever calling it**. Every guided flow passes
an onClose whose only job is "I was dismissed — kill my timer"; that callback
was being thrown away, so the outgoing flow's `Hub.Timer` kept running against
a DOM that no longer existed, then reached its `onDone` minutes later, logged a
session the user had abandoned, and reopened its own completion screen over
whatever was on screen by then.

Reachable from the app's own UI, via a button added the same day:

```
t=+4s   overlay: 🤲 Palming                 (60-second exercise running)
        → "Look away now"  (the eye rack timer's modal)
t=+5s   overlay: 👁️ Look 20 feet away
t=+27s  overlay: (none)             counts: [eye 0, eye2020 1]   correct
t=+63s  overlay: ✓ Palming complete counts: [eye 1, eye2020 1]   WRONG
```

**Fix:** `open()` calls the outgoing `focusOnClose` before installing the new
content, clearing it first so a callback that closes the overlay can't run
twice, and wrapped so a throwing callback can't block the incoming flow.
Smallest because all five drivers already supply the correct callback —
`open()` was the only thing discarding it — and every one is idempotent
(`Timer.prototype.stop` guards on `_id`; `mobility.js`/`desk.js` `stopPlayer`
guard on `player`), so a deliberate swap to a completion screen stays a no-op.

**After:** `t=+63s counts: [0, 1]`, no overlay.

### F2 · BUG (medium): a real-time completion filed itself under the backfilled day and called it "today"

Backfilled to 2026-09-14, then did the 20-second look-away *now*: it landed on
2026-09-14 and the toast read "Eye break done — 1 today." The backfill banner
was visible the whole time, so the state was not hidden — the confirmation
simply contradicted the banner above it.

**Fix, in two halves.**

`Hub.editToday()` — the writable record for the actual current day, ignoring
the backfill date. Applied to the eleven writes reached from a timer's
`onDone`, and to nothing else: `eyecare` finishExercise + runBreak, `dental`
finishBrush + its "log flossing too", `mobility` routine finish + single hold,
`wellness` desk stretch + logMindful, `desk` snack finish + logStandQuiet. Tap
tiles stay on `viewDate()`, because filling in the past is what the date picker
is for and a timer is not that. `sit.stop()` already drew this exact line for
sitting sessions; this is the same rule for everything `Hub.Timer` drives.

`Hub.dayWord()` — "today", or "on Mon 14 Sept" when the write went elsewhere.
Applied to the fourteen confirmation strings that hard-coded "today" across
dashboard, desk, wellness, bodycare and health.

**After:**

| | on today | backfilled to 14 Sept |
|---|---|---|
| Water tile | `Water logged — 1/8 cups today.` | `… on Mon 14 Sept.` → lands on 14 Sept |
| Eye tile | `Eye break logged today.` | `… on Mon 14 Sept.` → lands on 14 Sept |
| Stand tile | `Stand break logged — 1 today.` | `… 1 on Mon 14 Sept.` |
| 20s look-away | `Eye break done — 2 today.` | `… 2 today.` → **lands on today**, not 14 Sept |

### F3 · DEFECT in the morning's change: service worker not bumped

`service-worker.js` still read `CACHE_VERSION = "v28"` while seven precached
files had changed. Its own header says to bump it; git history confirms the
convention is live (v25→v26→v27→v28, one per shipping change). An installed PWA
would have kept serving v28's JS and never seen the timer fix at all.
**Fixed:** v29, which covers every file touched in this session.

### Checked and clean — not findings

- **Layout.** Symmetric 184px gutters on all eleven views at 1920px, and no
  horizontal page scroll at 1920, 1440 or 390. The stranded-space failure mode
  from the Study Tracker is not present here.
- **Interaction sweep.** Eleven views × every pill × a seeded 120-day +
  60-night profile: zero page errors, zero console errors, and no `NaN`,
  `Infinity`, `undefined` or `[object Object]` reaching rendered text.
- **The backfill bar is visible on every tab**, so the state was never silent —
  only the wording was wrong, which is what F2 fixed.
- **`today()` vs `calendarToday()`** are deliberately separate and used
  correctly by the clock-kind reminders.
- **BASALT's rest timer** already follows you across tabs (`document.body`).
  Still in-memory only, so a reload mid-workout loses it — real, still a
  different seam, still not done.

### Regression, after all of the above

- Every timer-sync assertion from the table above still passes.
- Eleven views × two themes, fresh profile and v1-seeded 200-day profile: no
  render failures, no console errors, no page errors.
- Backup/restore still round-trips (`water 6 / eye2020 3 / stand 4 /
  sitAlert 55 / standInterval 55 / version 4`) and still carries no timer state.
- `node --check` clean on all nine changed files.


---

## Second follow-up — the gaps in the audit itself

Asked again what still needed checking, so the areas the earlier sweeps had
never touched got covered. One more bug, one fix to my own verification, and an
honest list of what still cannot be tested from here.

### F4 · BUG (medium): an onboarding suggestion silently reset an interval you had customised

`js/onboarding.js`'s `enableInterval(key, mins, days)` was called three times,
and every call passed a `mins` **identical to that reminder's own schema
default** — stand 45, eye 20, posture 60. So the argument could never set
anything on a fresh profile. Its only reachable effect was to overwrite a value
the user had already chosen.

It was also a fourth writer of the stand interval, bypassing `Hub.setSitLimit`
entirely — so accepting the suggestion re-split the pair that F-A4 had just
joined.

Proven, same probe against `git archive HEAD` and the working tree, starting
from a sitting limit of 60 and a customised 35-minute eye interval:

| `[stand, sitAlertMin, eye]` | before applying | after applying both suggestions |
|---|---|---|
| at `fc001b2` | `[60, 60, 35]` | `[45, 60, 20]` — reset, and re-split |
| working tree | `[60, 60, 35]` | `[60, 60, 35]` |

Both reminders still switch on, which is what the suggestion is actually for.

**Fix:** delete the `mins` parameter. Deletion rather than routing it through
`Hub.setSitLimit`, because the argument had no legitimate use — the schema
default already is the number it was passing. `days` stays: weekdays-only is a
real part of what these suggestions propose, and their own reasoning text says
so.

### F5 · my own verification had a hole: the Fitness tab was never tested

Every sweep in this session listed the views explicitly and **omitted
`fitness`** — the largest module in the app. Corrected: all eight BASALT
sections now walked through their real router (`App.showSection`), before and
after, with identical results and no console errors.

```
              before (fc001b2)        after (working tree)
dashboard     len=2396                len=2396
today         len=983                 len=983
program       len=1301                len=1301
skills        len=667                 len=667
muscles       len=197                 len=197
running       len=1626                len=1626
progress      len=704                 len=704
evaluation    len=1402                len=1402
```

No placeholder/render-error text, no horizontal scroll, no errors either side.
`Hub.editToday()` is not reachable from BASALT — it keeps its own session log —
so this is a no-regression check, not a fix.

### Also newly checked, and clean

- **A reminder actually fires end to end.** Never tested before. Eye reminder
  at a 1-minute interval: `dueIn` reads 60 at sync, the in-app reminder appears
  at 63s with its Snooze and Open actions, and `dueIn` re-seeds to 57. That
  exercises the `dueIn` accessor added this morning.
- **The deep-link / notification-action path** (`js/pwa.js markDone`) already
  used `Hub.editDay(Hub.today())` with the comment *"Always today, never the
  backfill date — this came from a live reminder."* So F2 was not a new rule —
  it was **the app's own existing rule, applied in one place and missed in
  eleven**. Routed through `Hub.editToday()` so the rule has one name.
- **CSV export.** Every set with data builds and re-parses with a uniform
  column count, including a day record seeded with embedded quotes, commas and
  a newline: `days` 40 rows × 32 cols, `sleep` 20 × 7, `vo2max` 1 × 4. The
  empty sets correctly refuse rather than emit a header-only file.
- **`.ics` export.** Valid `VCALENDAR`, balanced `VEVENT`, carries an `RRULE`.
- **Service worker, the v29 bump verified for real over `http://`.** All 49
  `PRECACHE` entries exist on disk; nothing `index.html` loads is missing from
  the list (its `addAll` is atomic, so one 404 would break offline entirely);
  registers and activates; caches **49/49** as `wellness-hub-v29`; reports
  `v29`; and after `set_offline(true)` the app still boots with the dashboard
  rendered and the timer rack present.
- **Sync cannot re-split the sitting-limit pair.** `syncmerge.js:250` merges
  settings with one `mergeFields(file, local, localNewer)` decision applied
  uniformly, not per-field last-write-wins, and its only asymmetry is the
  `isEmpty` branch — which cannot trigger for two fields that `normalise()`
  guarantees are numbers. So A4 holds across devices.

### Still not verified — and why

| Area | Why not |
|---|---|
| Sync transports: `vendor/sync.js`, `js/syncdrive.js` (Drive), `js/syncsupabase.js` (Supabase), and the conflict UI | Needs real credentials and a remote. **The highest-stakes code in the app** — `fc001b2` was itself a sync data-loss fix. Untouched by this session; only the merge interaction above was reasoned about, and only that one claim is verified. |
| Desktop shell, `src-tauri/` | Needs a Rust toolchain and a build. |
| OS-level notification permission and delivery | Headless Chromium cannot grant it. The in-app reminder path is proven above; `Hub.notify.os` is not. |
| BASALT rest-timer persistence | Known, named three times, still in-memory only — a reload mid-workout loses it. Deliberately out of scope. |


---

## Third follow-up — the last named item: BASALT's rest timer

The one outstanding item named three times in this document and left undone.
Fixed, and one hypothesis about it tested and **rejected**.

### F6 · BUG (medium): a running rest timer was lost on reload

`fitness/basalt.js`'s rest timer kept all its state in a module-local `RT`
object and nothing else, so a reload — or the browser discarding a
backgrounded tab, which is routine on a phone mid-workout — lost it silently.

Proven at `fc001b2`:

```
before reload: 1:59   ironframe.ui keys: ['muscle.seenLevels']
after reload : (no bar)     rest bar restored: False
```

**Fix:** an absolute end stamp in the same `ironframe.ui` store the section and
workout drafts already use, restored from `mount()`. An absolute stamp rather
than a seconds-remaining count, for the reason `Hub.Timer` (`js/core.js`) and
the dashboard rack (`js/timers.js`) both already do it: storing "42 seconds
left" would silently pause the clock across the reload gap, handing back time
you had not actually rested.

Two deliberate limits, both stated in the code:

- **`onDone` is not persisted and cannot be.** The hold-timer caller closes
  over the live workout object and the DOM nodes it rendered; after a reload
  those are different objects, so re-running it would write a logged hold into
  stale references. A restored hold timer counts down and chimes but does not
  auto-log the set.
- **A timer whose stamp has already passed is dropped, not fired.** Chiming
  "complete" for a rest that ended twenty minutes ago while the tab was shut
  would be announcing something that is not news.

It also removed a duplicate: the bar's Pause button and the Space key each had
their own copy of the pause logic, which is two places for the button label and
the clock to disagree. Both now call one `rtTogglePause()`.

**Verified, after:**

| Check | Result |
|---|---|
| Reload mid-rest | `1:57` → `1:51` across a 5.8s reload gap — the clock moved 6s, so it counts the gap honestly rather than pausing through it |
| `+30` / `−15` | `111→140`, `140→123`, and both hold after the next tick (they move the end stamp, not just the digits) |
| Pause | frozen across 3s; survives a reload still paused, button still reads "Resume"; resumes counting on click |
| Expired while away | bar not shown, record cleared — nothing fired |
| `Done ✕` | bar cleared and stored record removed |
| Completion | still chimes, label reads "complete", record cleared |
| Leakage | `fullPayload()` contains no `endAt` and no `"rt"` — `ironframe.ui` is a different store from the `ironframe.state.v1` that backup and sync carry |

### Hypothesis tested and REJECTED: tick drift

`rtTick` decremented `RT.remaining` by one per firing rather than reading a
clock, which by inspection should drift in a throttled background tab — the
exact thing `js/core.js` says `Hub.Timer` was made wall-clock to avoid. It does
not reproduce. Freezing the page for 15.0s of real time via
`Page.setWebLifecycleState`, the clock advanced **16s** — no loss:

```
DRIFT TEST — page frozen 15.0s of real time
  clock before freeze: 1:59 -> after: 1:43
  clock advanced by  : 16 s   (real time elapsed: 15s)
  LOST: False
```

So drift is **not** claimed as a bug and was not the reason for this change.
The end-stamp rewrite was required by persistence on its own; making the tick
derived rather than decremented is a consequence of that, not a fix for
something observed.
