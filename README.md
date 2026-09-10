# Wellness Hub

A whole-body personal health app: **fitness, desk & movement, mobility &
recovery, eye care, dental care, body care, daily wellness, reproductive health
and health records** — wrapped in trackers, guided timers, browser reminders and
a light streak/badge layer.

It asks who's using it on first run — six questions, all skippable — and turns
the answers into suggested reminders, timed around your own day, plus whichever
modules are actually relevant to you.

Vanilla HTML/CSS/JS. No build step, no npm install, no backend, no accounts.
Everything is stored in your browser's `localStorage` and works fully offline.

**Open `index.html` and it runs.**

## What it covers

| Tab | What's in it |
|---|---|
| **Dashboard** | Every streak, a date navigator for backfilling, a next-reminder countdown, one-tap quick logs (including your own habits), recent badges, a rotating tip |
| **Fitness** | The full BASALT calisthenics OS — programming, progressions, PRs, phase evaluation, running plans, and a **Muscles** view: which muscle groups your training actually hit, which have gone cold, and a conditioning level per group |
| **Desk & Movement** | A **sitting clock** that nudges you when one stretch runs too long, stand-break goal and streak, interval stand-up reminders, 6 **movement snacks** (60–120s, guided), and a one-off desk-ergonomics checklist |
| **Mobility** | 5 guided joint routines (wrist prep, morning flow, desk reset, hips & shoulders, spine decompression), 6 flexibility holds, rest-day marker, 12-point soreness map, **niggle/injury log** with severity tracking and a **photo series** |
| **Eye Care** | 20-20-20 rule with a break timer, 5 animated guided exercises |
| **Dental** | 2-minute quadrant brushing timer, floss log, toothbrush replacement tracker, tips library |
| **Body Care** | Skin & sun (AM/PM routines, sunscreen re-apply counter, monthly ABCDE self-exam, **mole photo log with before/after compare**), hair & scalp, nails, hands & grip/callus care, feet, **hearing** (60/60 rule, loud-exposure log, tinnitus tracking) |
| **Wellness** | Hydration, posture, **sleep** (times *or* just hours, naps, debt, 14-night chart), mindfulness, **breathwork** (+ BOLT CO₂ test), mood with gratitude, nutrition, **intake** (caffeine, alcohol, screen wind-down), and **your own habits** |
| **Reproductive Health** | Periods, flow and symptoms with honest predictions and phase notes, the **monthly self-check** (breast or testicular, guided, with what to get looked at), **age-related screening** that drops into the check-up schedule, and **contraception** including a pill tick, pack-day counter and its own punctual reminder. Appears when your profile says it's relevant; switchable either way in Settings |
| **Health Records** | Vitals with trend sparklines, **lab results** with markers tracked across years, recurring check-up scheduler, medication & supplement tracker with **supply counts and as-needed items**, **medical profile**, and a **printable appointment summary** |
| **Insights** | Multi-metric trend charts, a clickable year-at-a-glance heatmap, plain-language pattern findings **with a multiple-comparison caveat**, week/month/quarter scorecards, a **day-by-day history**, and workout↔recovery advice |
| **Achievements** | 53 badges across 17 categories, with progress on the locked ones |
| **Settings** | **Your profile** and the suggestions it produced, 17 configurable reminders with **per-weekday scheduling and quiet hours**, day-boundary and unit preferences, grace days, per-habit cadence, goals, full backup/restore, CSV export, reset |

Calisthenics-specific care is deliberately weighted: **wrist prep**, **grip and
callus maintenance**, and **shoulder/hip mobility** each get real estate,
because those are what actually gate progress and what people skip.

---

## The things most habit trackers get wrong

These are the design decisions that took the most thought, and the reasons.

**It asks who's using it, then explains every suggestion.** The first-run
wizard collects six things: name, birth year, gender, the shape of your working
day, height/weight, and what you're here for. Nothing is required, nothing is
gated behind an answer, and the app is fully usable with a blank profile. What
the answers produce is a **list of suggestions with their reasoning attached** —
"stand-up reminders every 45 minutes, because you said you're seated for 8
hours" — each with a checkbox, applied only if you leave it ticked. It never
silently configures itself, and everything it does switch on is in Settings
afterwards, where you can see and reverse it.

**Gender is asked once, and only picks defaults.** It drives exactly three
things: which monthly self-check the app prompts for, which screenings have an
age band you're inside, and whether cycle tracking is worth putting in front of
you. **Other** and **prefer not to say** are both real answers and behave the
same way — the self-check panel offers both checks, and the screening list stops
filtering — because offering everything is the right response to not knowing.
Nothing is ever hidden from you on the strength of that answer: every module
stays reachable, and Settings can force the Reproductive Health tab on or off
regardless of what the profile says.

**Sitting is tracked as an explicit session, not a guess.** A browser tab cannot
know whether you're in your chair, so the sitting clock only runs when you tell
it you sat down. It nudges at a configurable limit (45 minutes by default) and
keeps nudging every 45 after that, from a global handler so it reaches you on
whatever tab you're on. Being wrong about it costs you a number in a log and
nothing else. The separate interval reminder is the belt-and-braces version for
people who won't remember to start a clock.

**Period predictions state their own error bars.** The next date is given as a
window, not a day, derived from the spread in *your* logged cycles, and it says
how many cycles it's working from. The one thing it will never do is imply it's
a contraceptive method — that's stated where a fertile-window number would
otherwise appear, not buried in a footer.

**You can log for any past day.** Everything writes to a *logging date*, which
is normally today but can be pointed at any day in the past year from the date
navigator on the Dashboard or Wellness tab. A bright banner sits across the top
of the app the whole time it isn't today, because silently logging into the
wrong day would be worse than not having the feature. Vitals, sleep, labs,
photos and periods all take an explicit date too. Forgetting to log Tuesday is
no longer permanent.

**Your day doesn't have to start at midnight.** Settings → *My day starts at*
shifts the boundary to any hour up to 6am. Train at 23:00, log it at 00:20, and
it still lands on the day you actually trained instead of quietly breaking the
streak. Every date key in the app derives from that one setting.

**A missed day doesn't have to reset a hundred.** Each calendar month grants a
small allowance of **grace days** (one by default, configurable, 0 for the
strict version). A missed day inside a run doesn't count as done — the number
stays honest — but it doesn't zero the streak either. The Dashboard says how
much grace is left and how much a streak has used.

**Not everything is a daily habit.** Any category can be set to *N times a
week* instead. Weekly-cadence streaks count consecutive weeks that hit the
target, and the current week is never counted as failed while it's still
running.

**You can add your own habits.** Name, icon, colour, daily or weekly. They
register as real categories: same streaks, same heatmap, same grace days, same
weekly review, a tile in the Dashboard quick log, and their own badges.

**Reminders respect when you're asleep.** Interval reminders are silent inside
quiet hours (22:00–07:00 by default), each reminder has a weekday mask, and
every reminder — desktop notification *or* in-app toast — carries **Snooze** and
**Done** buttons. "Done" logs the thing without opening the app.

**Muscle conditioning is volume, and says so.** The Muscles view gives every
muscle group a level and a rank — Kindled, Tempered, Forged — because a number
that only goes up is more motivating with a name on it. But a rank is a claim,
and the claim here is small: it counts reps. So the work-unit total renders
next to the rank *every* time, in the table, in the detail panel and in the
level-up toast, and the caption says it in one line. It is called
**conditioning**, not strength, and not "level" — the app already has levels,
on the progression ladders, and those measure something real.

**The muscle map is sized to this app, not borrowed.** Every one of the 84
movements is mapped to the muscles it trains, at three weights: primary, real
assistance, and bracing. Bracing is priced low on purpose — counting the core in
a squat as 40% of squat volume made abs level three times faster than chest
while barely being trained. Groups this library cannot reach aren't listed:
there is no calf raise in calisthenics, so there is no calf tile to stare at
forever. `node tools/check-muscle-map.js` enforces both halves of that — every
exercise mapped, and every group actually reachable.

**Weekly targets are measured, not guessed.** "Above target" compares your week
against what the app's own 4-day rotation delivers to that group, computed from
the program itself. A guessed target would have left three groups permanently
reading "well above — check recovery" on the plan the app wrote for you, which
is the app arguing with itself.

**Units are display-only.** Everything is stored in metric, always. Switching
between kg/cm/°C and lb/in/°F changes what you type and what you see, and can
never alter, round or corrupt a reading you already saved. A backup exported on
one setting reads correctly on the other.

---

## Running it

Two ways, both supported:

```bash
# 1. Just open the file
xdg-open index.html          # or double-click it

# 2. Serve it locally  (recommended — see "Notifications" below)
python3 -m http.server 8000
# then visit http://localhost:8000
```

### Better: install it as an app

Once served, the app is a **PWA** — install it and you get an icon in your app
menu, its own window with no browser chrome, and the whole thing cached for
offline use. No file to open, no tab to hunt for.

```bash
./tools/install-service.sh          # serve at localhost:8777 from login onward
```

That installs a systemd **user** service, so the app is always there after you
log in. Then open `http://localhost:8777` once and install it:

| Browser | How |
|---|---|
| Chrome / Chromium / Edge | ⋮ → Cast, save and share → **Install page as app** |
| Firefox | No install support — pin the tab instead |
| Safari (macOS/iOS) | Share → **Add to Dock / Home Screen** |

Settings → **App & offline** shows an Install button when your browser offers
one, and reports whether the offline cache is ready.

To undo it all: `./tools/uninstall-service.sh`.

Once installed, the app **works with the server stopped** — everything is served
from the service worker's cache. The server only matters for picking up code
changes and for the first install.

### The one difference between file:// and served

| | `file://` (opened directly) | `http://localhost` (served) |
|---|---|---|
| All trackers, timers, streaks, badges | ✅ | ✅ |
| `localStorage` persistence | ✅ | ✅ |
| Export / import backups | ✅ | ✅ |
| In-app reminders (corner toasts) | ✅ | ✅ |
| **Desktop notifications** | ❌ | ✅ |

Browsers only grant the Notification API to *secure origins*, and a page loaded
from disk isn't one. The app detects this and says so in Settings rather than
failing silently — reminders still fire, just as in-app toasts instead of OS
notifications. Serving the folder over `http://localhost` is enough to unlock
them; you don't need HTTPS or a real domain.

### How reminders actually work

Reminders are `setInterval`-based and generated by the page itself. That means:

- They fire while the app is **open**, including when it's backgrounded or the
  window is minimised.
- They stop when you **close it**, and resume when you open it again.

Three things shape *when* one is allowed to fire:

| Gate | Applies to | Behaviour |
|---|---|---|
| **Quiet hours** | interval reminders only | Silent inside the window. The countdown still restarts, so it doesn't ambush you the second the window ends. A reminder set for a *specific time* inside quiet hours still fires — a 22:00 skin routine set deliberately for 22:00 is an instruction, not an accident. |
| **Weekday mask** | all reminders | Per reminder, seven toggles. A reminder can't be left with zero days: that would be enabled and permanently silent, which is the worst possible state because it looks like it's working. |
| **Snooze** | all reminders | Pushes one reminder out by the configured interval. A snooze that comes due fires regardless of quiet hours — you asked for it back. |

Notifications carry **Snooze** and **Done** action buttons, and so do the in-app
toasts, so both work identically on `file://` and on a machine where
notifications are blocked. "Done" logs the thing directly — a water reminder
ticks a cup, a brushing reminder ticks the brush — without opening the app. It
always logs to *today*, never to a backfill date, because it came from a live
reminder.

Installing it as an app does **not** change this. A service worker is only woken
for events the browser sends it, and the web platform has no reliable
scheduled-notification API — `Notification Triggers` never shipped, and
`Periodic Background Sync` is Chrome-only with a minimum interval measured in
hours. Neither can drive a 20-minute eye-break timer.

### Reminders when the app is closed

The honest workaround, built in: **Settings → Reminders when the app is closed →
Export reminders (.ics)**.

That writes your enabled *daily, clock-based* reminders — brushing, flossing,
skin routine, medication, mobility, mood — plus any upcoming check-ups into a
standard calendar file. Import it once into GNOME Calendar, Thunderbird, Google
Calendar, Outlook or Apple Calendar and those reminders fire through the
notification system your OS already runs, whether or not this app is open.

The event UIDs are stable, so re-exporting after changing a time **updates** the
existing entries rather than duplicating them.

Interval reminders (eye breaks every 20 min, sunscreen every 2 h) are
deliberately excluded — a calendar entry every 20 minutes would be unusable, and
those only make sense while you're actually sitting at a screen with the app open.

If you want true always-on reminders with no app running at all, the options are
an OS-level timer (a `systemd` timer calling `notify-send`) or wrapping this in
Electron/Tauri. Both are outside what a web app can do.

---

## Keeping your data

Health history you've spent a year building deserves better than an unprotected
`localStorage` key. Settings → **Keeping your data** offers two layers:

**1. Eviction protection.** The app calls `navigator.storage.persist()`, which
asks the browser to exempt this origin from the automatic clean-up it performs
when disk space runs low. Chrome usually grants this silently once the app is
installed; Firefox asks. The card reports the real answer either way.

**2. A linked backup file.** On Chrome, Edge and Opera you can pick a real file
on disk once. From then on the app rewrites it automatically a few seconds after
anything changes — no prompts, no remembering. Put it somewhere already synced
or backed up and your history lives outside the browser entirely.

The payoff is the recovery path: if site data is ever cleared, the app notices
it's empty on next launch, finds the linked file still there, and offers to
restore from it before you lose anything.

Firefox and Safari don't support that API yet. There, the app falls back to
manual export and nags you if it's been more than a fortnight — it says so
plainly rather than pretending the two are equivalent.

The linked file and the manual export contain **everything**: habits, streaks,
badges, health records, your training data, and your photos. (Photo *bytes* live
in IndexedDB rather than `localStorage`, which would be full after four of them —
but they're folded into the backup payload on the way out and restored on the way
back in, so a backup is never quietly incomplete.)

### Getting the data out in a form something else can read

Settings → **Export as a spreadsheet** writes CSV: one wide row per day for
habits, or one row per reading for vitals, sleep and labs. JSON is the honest
backup format, but nobody opens JSON, and no clinician will.

Health Records → Profile → **Summary for an appointment** opens a one-page
printable summary: allergies, conditions, current medication with doses and
timings, the latest of each vital *with its date*, recent labs, vaccinations and
check-up status. It carries a plain statement at the bottom that everything on
it is self-reported and measured with consumer devices — because handing a
clinician a document that looks like a clinical record without saying so would
be actively harmful.

---

## Insights, and how much to trust them

The Insights tab does five things:

- **Trends** — any of 16 metrics on one chart, each on its own hidden axis so
  sleep hours and training volume don't flatten each other.
- **Heatmap** — a year of done/not-done per category. Every square is clickable
  and opens that day in full.
- **Patterns** — splits your history at the median of one metric and compares
  another on either side, with optional day lag.
- **Review** — every category against the previous window, at **week, month or
  quarter**, plus averages and badges. A week is short enough that one bad night
  dominates it; a month is where drift becomes visible.
- **Day by day** — every logged day, newest first. Open one to see everything
  on it, or jump straight to filling in something you missed.

**On the patterns specifically.** These are associations in your own small,
self-reported sample. They cannot separate cause from coincidence and they
adjust for nothing. So the app is deliberately conservative:

- Nothing is reported below **10 paired days**.
- A "clear signal" needs **n ≥ 30, |r| ≥ 0.35, and a median-split gap ≥ 20%** of
  the metric's own range. All three, not any one.
- The direction is stated in words. A card asking "does a longer night lift the
  next day's mood?" will say *"The opposite, in fact"* if that's what your data
  shows, rather than leaving you to spot it in the numbers.
- "No signal" is reported as a real result, not hidden.
- **It tells you how many questions it asked.** The tab tests fourteen pairs at
  once, and ask enough questions of noise and some come back positive anyway. A
  card at the top states how many comparisons ran, how many cleared each bar,
  and roughly how many would be expected to clear it by luck — and says
  explicitly when a lone "clear" result is about what chance predicts. These are
  not corrected p-values and the app doesn't pretend to compute one; it's the
  order of magnitude that matters. One positive out of fourteen is not a
  discovery.

The workout↔recovery advice above it is **rules, not a model** — eight
conservative checks over your soreness map, training dates, sleep and open
niggles. Each states its reasoning and links to the thing that would fix it.

---

## Layout

```
index.html                  Shell + every view container + the Fitness markup
manifest.webmanifest        PWA metadata: name, icons, shortcuts, display mode
service-worker.js           Offline shell cache + notification click handling
icons/                      App icons (SVG source + PNG at 192/512, maskable)
tools/
  serve.py                  Tiny localhost-only static server
  install-service.sh        Installs it as a systemd user service
  uninstall-service.sh      Removes that service
css/
  hub.css                   Gruvbox tokens, layout shell, all hub components
  basalt-gruvbox.css        Re-skins the calisthenics app onto the Gruvbox palette
  basalt-makeover.css       Fixes how that skin is USED: surface ramp, quieter accent
  muscles.css               The Muscles section: coverage table, heat dots, today strip
  themes.css                The four alternate palettes (see "Palettes" below)
js/
  core.js                   Store, router, dates, toasts, modals, timers, reminders
  theme.js                  Palette switching: the data-theme attribute and the list
  gamify.js                 Streak + badge engine
  insights.js               Series, correlations, heatmap, review, recovery advice
  storage.js                Persistent storage, on-disk backup, photos, CSV
  photos.js                 Shared photo log UI (skin series, niggle series)
  pwa.js                    Install prompt, offline registration, deep links
  calendar.js               .ics export of clock reminders and check-ups
  onboarding.js             First-run profile wizard + the suggestion engine
  app.js                    Boot, first-run note, fitness bridge, keyboard
  views/
    dashboard.js            Landing view: date navigator, streaks, quick log
    desk.js                 Sitting clock · stand breaks · movement snacks · ergonomics
    mobility.js             Routines · flexibility · recovery · niggles · photos
    eyecare.js              20-20-20 + five guided exercises
    dental.js               Brushing timer, floss log, brush tracker, tips
    bodycare.js             Skin & sun · hair · nails · hands & grip · feet · hearing
    wellness.js             Hydration · posture · sleep · mindfulness · breathwork ·
                            mood · nutrition · intake · your own habits
    repro.js                Cycle · self-exam · screening · contraception
    health.js               Vitals · labs · check-ups · meds · profile · print summary
    insights.js             Trends · heatmap · patterns · review · day-by-day history
    achievements.js         Trophy case
    settings.js             Reminders, quiet hours, counting rules, goals, backup, reset
fitness/
  basalt.css                The original calisthenics app's stylesheet
  basalt.js                 The original calisthenics app's logic
  ironframe_original.html   Untouched original, kept for reference only
vendor/
  chart.umd.min.js          Chart.js, vendored locally so the app stays offline
```

### Palettes

Five, switchable from **Settings → Palette**: Gruvbox Dark (the default),
Gruvbox Material, Everforest, Rosé Pine Moon and Tokyo Night.

The mechanism is one attribute. `css/hub.css` declares the Gruvbox ramp on
`:root`; `css/themes.css` re-points the same token names under
`html[data-theme="…"]`, and every other stylesheet resolves through those
tokens — so the Fitness tab, the muscle heat map and the charts all follow
without a single component rule changing. `js/theme.js` owns the attribute,
keeps `<meta name="theme-color">` in step, and rebuilds any open chart, since
Chart.js needs literal colour strings and therefore caches whatever palette was
in force when it drew.

Two details worth knowing before you add one:

- **Translucent fills go through `--*-rgb` triplets.** A rule that writes
  `rgba(254,128,25,.14)` stays Gruvbox orange forever; `rgba(var(--orange-bright-rgb),.14)`
  follows the theme. Everything in `css/` was converted to the token form.
- **The category accents aren't copied between themes.** Gruvbox's seven bright
  accents span hues 2°–170° and then stop, which leaves thirteen tabs sharing
  four hue neighbourhoods — `desk` and `insights` are literally the same colour,
  as are `bodycare` and `achievements`. The alternate themes assign accents on a
  fixed semantic plan instead, using the palette's own colour where one lands
  near the target hue and generating the rest at that palette's mean OKLCH
  lightness and chroma. The default theme is left exactly as it was.

The choice lives in `wellnessHub.ui`, outside the versioned schema: it isn't in
a backup and a data reset won't clear it. An inline script in `<head>` stamps it
before the first paint.

### Why the Fitness tab is separate files

The calisthenics app (`ironframe_improved.html`, now `fitness/ironframe_original.html`)
was a complete 8,800-line application with its own router, storage layer, six
sections and settings modal. Inlining that into `index.html` would have produced
a single unmaintainable file, so its CSS and JS were extracted verbatim into
`fitness/basalt.{css,js}` and linked, and its markup was folded into the Fitness
view in `index.html`.

It is **not** an iframe. It runs in the same document, shares the page, and its
data feeds the hub's fitness streak directly.

---

## How the integration works

**Styling.** The calisthenics app was already fully token-driven — every colour
it paints resolves through a CSS custom property. `css/basalt-gruvbox.css` simply
re-points those tokens at the Gruvbox palette, so the whole tab re-skins itself.
Its sticky app bar is restyled into an in-tab sub-navigation strip and its
full-screen onboarding overlay becomes an in-tab setup panel, so it reads as a
tab rather than a second application.

Its own class names (`.btn`, `.card`, `.modal`, …) are left alone; every hub
class is prefixed `wh-`, so the two can't collide.

**Data.** The calisthenics app keeps its own `localStorage` key. Rather than
duplicating workout state, the hub *derives* the fitness streak from its session
log — one workout record, one source of truth. A backup exported from Settings
contains both stores.

---

## Data model

One namespaced object, `wellnessHub.v1` (schema v3):

```jsonc
{
  "version": 3,
  "meta":     { "createdAt": "…", "firstRunSeen": true, "lastFired": {} },
  "settings": {
    // who's using this — collected by the first-run wizard, all of it optional
    "profile": { "gender": "female",        // female | male | other | null
                 "birthYear": 1994, "heightCm": 168, "weightKg": 64,
                 "workStyle": "desk", "sittingHours": 8,
                 "goals": ["move","sleep","pain"],
                 "wakeTime": "06:30", "bedTime": "22:30",
                 "completedAt": "…", "skipped": false },
    "dismissedSuggestions": { "posture": true },
    "standGoal": 8, "sitAlertMin": 45, "ergoChecklist": { "screenHeight": true },
    "reproTab": null,              // null = follow the profile; true/false = explicit
    "contraception": { "method": "pill-combined", "packDays": 21, "breakDays": 7,
                       "packStartISO": "2026-08-01", "note": "" },
    "hydrationGoalCups": 8, "sleepTargetHours": 8,
    "dayStartHour": 0,             // 0–6: when your day rolls over
    "units": "metric",             // display only; storage is always metric
    "graceDaysPerMonth": 1,        // missed days a streak may survive
    "cadence": { "floss": { "type": "weekly", "perWeek": 3 } },
    "cycleTracking": false, "cycleAvgLength": 28,
    "quietHours": { "enabled": true, "from": "22:00", "to": "07:00" },
    "snoozeMin": 15,
    "reminders": { "eye": { "enabled": true, "intervalMin": 20, "days": [0,1,2,3,4,5,6] }, … }
  },
  "logs": {
    // one record per day; only the fields you actually logged exist
    "days": {
      "2026-08-09": {
        "water": 5, "eye": 1, "eye2020": 4, "brushAM": true, "floss": true,
        "posture": 3, "stretch": 1, "mobility": 1, "restDay": false,
        "stand": 7, "sitMin": 320, "sitLongest": 78, "moveMin": 6.5,
        "soreness": { "wrists": 2 },            // body part -> 1..5
        "body": { "skinAM": true, "spf": true }, // body-care checklist keys
        "spfReapply": 2,
        "mood": { "mood": 4, "energy": 3, "stress": 2, "gratitude": [ … ] },
        "meds": { "m1:am": true, "prn:m2": 2 },  // "<medId>:<slot>", or a PRN count
        "mindful": [ { "type": "box", "sec": 180 } ],
        "nutrition": { "veg": true },
        "custom": { "h1": true },                // your own habits
        "caffeineMg": 190, "alcoholUnits": 2, "screenOff": "22:40",
        "cycle": { "flow": "medium", "symptoms": { "cramps": true } },
        "repro": { "pill": true }                // contraceptive pill taken
      }
    },
    // nights and naps share one list, distinguished by `kind`
    "sleep":  [ { "id": "s1", "kind": "night", "date": "2026-08-09", "bed": "23:15",
                  "wake": "07:05", "hours": 7.8, "quality": 4, "note": null },
                { "id": "s2", "kind": "nap", "date": "2026-08-09", "hours": 0.33 } ],
    "vitals": [ { "id": "v1", "date": "2026-08-09", "sys": 118, "dia": 76, "hr": 54, … } ],
    "labs":   [ { "id": "l1", "date": "2026-08-01", "panel": "Annual bloods", "note": "fasting",
                  "values": [ { "key": "hba1c", "label": "HbA1c", "value": 34,
                                "unit": "mmol/mol", "ref": "20–41" } ] } ],
    "profile": { "dob": "…", "bloodType": "O+", "heightCm": 178, "organDonor": true,
                 "allergies": [ … ], "conditions": [ … ],
                 "emergency": [ … ], "vaccinations": [ … ], "notes": "" },
    "cycles": [ { "id": "cy1", "startISO": "2026-07-14", "endISO": "2026-07-19" } ],
    "customHabits": [ { "id": "h1", "name": "Read 20 pages", "icon": "star",
                        "color": "var(--blue-bright)",
                        "cadence": { "type": "daily" }, "active": true } ],
    // metadata only — the image bytes live in IndexedDB
    "photos": [ { "id": "ph1", "date": "2026-08-09", "kind": "skin",
                  "subject": "left shoulder", "note": "", "w": 1024, "h": 768 } ],
    "checkups": [ { "id": "dental", "name": "…", "intervalMonths": 6, "lastISO": "2026-02-01" } ],
    "meds":     [ { "id": "m1", "name": "Vitamin D3", "dose": "1000 IU", "slots": ["am"],
                    "active": true, "prn": false, "perDose": 1, "supply": 42, "packSize": 60 } ],
    // "last done" dates for anything tracked on an interval rather than daily
    "toothbrushISO": "2026-06-06", "skinCheckISO": null, "haircutISO": null,
    "nailsHandsISO": null, "nailsFeetISO": null, "callusISO": null, "shoesISO": null,
    "breastExamISO": "2026-08-01", "testisExamISO": null,
    // the sitting stretch currently running, cleared on a day rollover
    "deskSession": { "startedAt": "2026-08-12T09:14:00.000Z" }
  },
  "streaks":  { "hydration": { "current": 6, "best": 11, "doneToday": true,
                               "unit": "day", "graceUsed": 0, "graceLeft": 1 }, … },
  "badges":   { "first-steps": "2026-08-09T10:22:00.000Z", … }
}
```

A v1 save upgrades in place on first load: reminders gain an every-day weekday
mask, sleep entries gain an id and `kind: "night"`, and the new stores appear
empty. A **v2 save** gains an empty profile, the desk fields (which default to
`0`, including on day records written before v3), and the two new reminders.
The wizard is *offered* to an existing user, not forced — `completedAt` stays
null and the Dashboard shows a dismissible card instead of a takeover. Anyone
who had already switched cycle tracking on gets the Reproductive Health tab
without being asked, since that switch answered the only question it depends on.

An early v3 build asked for sex-at-birth alongside a free-text gender and
pronouns; there is now a single `gender` question doing that job. Saves from
that build are carried across rather than re-asked: a recognisable free-text
gender wins, otherwise the recorded sex, and anything else becomes `"other"`
rather than being dropped. The old `sex` and `pronouns` keys are removed.

**Quiet hours are switched off by an upgrade**, deliberately — silently
suppressing reminders someone already relies on would be the wrong default for
an existing user, even though it's the right one for a new install.

The calisthenics app keeps `ironframe.state.v1` alongside it. Settings → Backup
exports both in one file.

**Streaks and badges are derived, not stored as counters.** They're recomputed
from the logs on every write, so they can't drift, an imported backup is instantly
correct, and deleting a log entry adjusts history honestly. `streaks` is a cache
of that computation, persisted only so `best` survives and so an exported file is
readable on its own.

Day records use **local-time** `YYYY-MM-DD` keys, never UTC — a day boundary that
disagrees with your clock would silently break every streak. `Hub.today()` applies
`dayStartHour` on top of that, and everything else in the app derives from it, so
there is exactly one answer to "what day is it?".

**Writes go to `Hub.viewDate()`, not to today.** It normally *is* today, but the
date navigator can point it at any past day, and every existing call to
`Hub.editDay()` backfills that day instead. It is deliberately not persisted
across reloads — waking up tomorrow still editing last Tuesday would be a quiet
way to corrupt a month of data — and it snaps back to today, with a toast, if the
day rolls over while you're mid-backfill.

---

## Notes for extending it

- **Views** register themselves: `Hub.registerView("name", function (el, state) { … })`.
  Each renders its whole subtree on every call; `Hub.delegate(el, sel, fn)` handles
  events so nothing needs re-binding.
- **Mutations** go through `Hub.commit()`, which recomputes streaks, re-evaluates
  badges, saves, and re-renders — in that order.
- **Timers** all use one implementation, `Hub.Timer`. It's driven by wall-clock
  deltas rather than by counting ticks, so a backgrounded tab (where intervals get
  throttled) still finishes on schedule instead of drifting minutes behind.
- **Guided exercises** are data. Adding a sixth eye exercise means adding one
  object to `EXERCISES` in `eyecare.js` — a `stage()` returning markup and a
  `frame(el, elapsed, total)` doing the per-frame update. The overlay, countdown
  and completion bookkeeping are shared.
- **Badges** are data too: add an entry to `BADGES` in `gamify.js` with a
  `test(ctx)` and an optional `progress(ctx)` for the locked tile.
- **Mobility routines** are pure data: an entry in `ROUTINES` (mobility.js) is a
  list of `{ name, sec, cue }` steps. One player drives all of them, chimes on
  every transition, and any step whose cue mentions "swap" gets a mid-point cue.
- **Insight metrics** are one definition each in `SERIES` (insights.js): a label,
  a colour and a `get(dateKey)` returning a number or null. Add one and it shows
  up in the chart, the picker and the correlation engine at once.
- **Pattern pairs** are curated in `PAIRS` — `{ a, b, lag, question }`. The lag
  is how many days after the cause to look for the effect.
- **Recovery advice** lives in `RULES` (insights.js). Each is a function
  returning null or a card with a priority and an action; nothing shared, so a
  broken rule can't take the others down.
- **Body-care checklists** bind to keys inside `day.body` — adding an item is one
  line in the relevant array.
- **Streak categories** live in `CATEGORIES` (gamify.js). Each answers one
  question: "was this done on date D?" Everything else follows from that —
  which is why user-defined habits get registered as categories rather than
  bolted on, and inherit the heatmap, review and grace rules for free.
- **Cadence and grace** are in gamify.js: `streakFor(key)` returns the whole
  picture (`current`, `best`, `unit`, `graceUsed`, `graceLeft`), and a weekly
  category counts consecutive weeks rather than days. Check `unit` before
  writing "days" next to a number.
- **Units**: never convert at the storage boundary. `Hub.units.massIn/massOut`
  and friends convert only at the edges — what a field displays and what a
  typed number means. Everything in `logs` is metric.
- **Photos** go through `Hub.storage.addPhoto(file, meta)`, which downscales to
  ~1024px JPEG and stores the bytes in IndexedDB; `Hub.photoUI.card()` renders
  the whole series/compare UI for a `kind`.
- **Adding a tab**: append to `Hub.NAV` in core.js, add a `<section
  id="wh-view-<id>">` to index.html, add a `--wh-c-<id>` token, and register a
  renderer. Mark it `primary: true` only if it belongs on the mobile bar — the
  rest fall into the "More" sheet automatically. Give it a `shown()` predicate
  to make it conditional: `Hub.visibleNav()` filters the nav and the keyboard
  shortcuts, while `Hub.show()` still routes to it, so a hidden tab must render
  its own "this is switched off" panel rather than nothing (see `repro.js`).
- **Suggestions** are one entry each in `allSuggestions()` (onboarding.js):
  `{ id, title, why, done(), apply() }`, plus `optional: true` to leave it
  unticked by default. `why` is shown verbatim — a suggestion whose reasoning
  you can't read is just an app changing your settings. `done()` is what makes
  a suggestion disappear once it's been acted on, from anywhere.
- **The sitting clock** is one persisted record, `logs.deskSession`. Its alert
  lives in a `Hub.onTick` handler registered at module load in `desk.js`, *not*
  in the view, which is why it fires while you're on another tab. Anything else
  needing a background nudge should follow that shape.
- **Icons** come from `Hub.icon(name)` — inline stroke SVG, no icon font.
  Add paths to `PATHS` in `core.js`.
- **Colours**: use the semantic aliases (`--wh-accent`, `--wh-text-muted`, …)
  rather than raw palette values. Each tab sets `--wh-accent` via the router, so
  components inherit the right accent automatically.
- **Keyboard**: `Alt`+`1`–`9` switches to the first nine *visible* tabs,
  `Alt`+`0` to the tenth, `Alt`+`-` to the eleventh and `Alt`+`=` to the
  twelfth; `Esc` closes the topmost overlay, and
  `Tab` is trapped inside whichever overlay is on top.
- **Changing any file?** Bump `CACHE_VERSION` in `service-worker.js`, or an
  installed copy will keep serving the old one. Adding a file also means adding
  it to `PRECACHE` — a file the app loads but the worker doesn't cache is a
  404 the moment you go offline.
- **App shortcuts** (long-press the app icon) come from `manifest.webmanifest`
  and route through `?go=<view>`. A shortcut can also fire a named action —
  see `Hub.registerAction` and the brushing timer for the pattern.

### Changes made to the original calisthenics file

Its behaviour and content are unchanged, but a few things were fixed or adjusted
during integration:

- Removed the Google Fonts and Chart.js CDN links — Chart.js is vendored locally
  and fonts fall back to system stacks, so the app works offline.
- Replaced 83 hardcoded `rgba()` colours with token references, so the Gruvbox
  re-skin reaches its charts, glows and hairlines.
- Repointed the two Chart.js colour palettes to Gruvbox.
- Removed its three alternate colour schemes. A stale `ironframe.theme` value in
  localStorage would otherwise override the Gruvbox skin.
- Fixed a pre-existing `ReferenceError: lib is not defined` in its placeholder
  dashboard, which threw on every load and briefly flashed an error panel.
- `<main id="app">` became `<div id="app">` so the document has exactly one `<main>`.
- Added one integration hook in `completeSession()` that notifies the hub when a
  workout is logged. It's guarded, so the file still runs standalone.

---

## Health disclaimer

Everything here is **general wellness information, not medical or dental advice**.
The tips, exercises and checklists can't diagnose anything and aren't a substitute
for professional care.

Specifically:

- **Vitals reference bands** are general adult ranges shown for context only. They
  don't account for your age, medication, conditions or the accuracy of your
  device. The app never interprets a reading for you.
- **Check-up intervals** are common defaults, all editable. Your clinician's
  advice overrides them. The age-related screenings on the Reproductive Health
  tab are the same kind of default — see below.
- **The medication tracker** is a reminder checklist. It doesn't know your doses
  and won't check interactions. Never start, stop or change anything based on it.
  The supply count is arithmetic on a number you typed — don't let it be the
  reason you run out.
- **Lab results** are stored exactly as your lab printed them, reference ranges
  included, and the app never judges a value against them. Ranges are
  lab-specific, assay-specific and often age- and sex-specific; a result outside
  one is frequently normal for the person, and one inside it can still matter.
  Only the clinician who ordered the test can interpret it.
- **The medical profile** is your own note to yourself, not a medical record.
  Nobody else can see it and no emergency service can read it off your phone. If
  you rely on something in it — a severe allergy, an implanted device — carry it
  on a card or a bracelet too.
- **The printable summary** is self-reported data from consumer devices, and
  says so on its face. It's useful for dates, trends and what you're taking; it
  is not a source of clinical measurements.
- **Photo logs** are a memory aid. No app, and no photograph, can tell a
  harmless mole from a melanoma. Anything new, changing, itching, bleeding or
  simply unlike your others should be seen — not photographed again next month.
- **Cycle tracking is not contraception and cannot be used as one.** The phase
  and the predicted date are arithmetic on your own past cycles: they don't
  measure ovulation and know nothing about illness, stress, travel or
  medication. Calendar-based fertile-window estimates are wrong often enough to
  be unsafe. For contraception or conception, use a method designed for it.
- **Self-exams** — breast and testicular — are about knowing your own normal so
  a change is obvious, not about clearing yourself on any one occasion. They are
  not screening, they don't replace it, and the steps given are the standard
  general ones. Anything on the "get it looked at" list is worth an appointment
  even if the last check felt fine.
- **Screening intervals vary by country, programme and personal risk**, often
  considerably. The list in the app is a prompt that a check exists and roughly
  when — if your health service has invited you on a different schedule, theirs
  is the one to follow. Nothing here books, replaces or overrides an invitation.
- **The contraception tracker is a checklist, not clinical guidance.** It won't
  tell you what to do about a missed pill, deliberately: the answer depends on
  which pill, how late, and where in the pack you are. Read the leaflet in the
  pack or ring a pharmacist.
- **The desk module is general ergonomics and movement advice.** Persistent
  back, neck, wrist or shoulder pain — especially with numbness, tingling or
  weakness — is a reason to see someone, not to do another two-minute stretch.
- **The mood log** is self-reflection, not a mental-health screen.
- **Nutrition and intake** are habit tracking, not a diet plan. Caffeine figures
  are rough averages per drink — a strong flat white can be double what's shown —
  and alcohol units vary enormously with size and strength. Treat both as an
  estimate you compare against yourself, not a measurement. If cutting down is
  hard, that's a conversation with a GP, not a tracker.
- **Soreness, niggle logs and skin self-exams** are prompts to get something
  looked at, not assessments. A diary is not a diagnosis.
- **Pattern findings** are associations in a small self-reported sample. They
  cannot establish cause and must not drive a medical decision.
- **Breath-hold work** isn't for everyone. Never in water, while driving, or
  standing. Avoid entirely with pregnancy, epilepsy, uncontrolled blood
  pressure, heart conditions or a history of fainting — ask a doctor first.
- **Hearing**: sudden hearing loss is a medical emergency — treated within days
  it often recovers, left alone it frequently doesn't.

If something hurts, bleeds, changes, or doesn't settle, see a professional. If
you're in crisis, contact your local emergency number or a crisis line.
