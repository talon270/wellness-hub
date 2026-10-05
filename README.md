# Wellness Hub

A whole-body personal health app: **fitness, desk & movement, mobility &
recovery, eye care, dental care, body care, daily wellness, reproductive health
and health records** — wrapped in trackers, guided timers, browser reminders and
a light streak/badge layer.

It asks who's using it on first run — six questions, all skippable — and turns
the answers into suggested reminders, timed around your own day, plus whichever
modules are actually relevant to you.

Vanilla HTML/CSS/JS. No build step, no npm install, no backend.
Everything is stored in your browser's `localStorage` and works fully offline.
Syncing between devices is optional and off until you link something — a
folder, Google Drive, or a Supabase account. That last one is the only place an
account enters the picture, and `localStorage` stays the canonical copy either
way.

**Open `index.html` and it runs.**

**A week of runs you didn't log is never skipped for you.** The running plan
used to count weeks by the calendar alone: two weeks with nothing logged put a
9-week plan on week 3, with no question asked. Now, when the week behind you has
a run with nothing logged on its day, the Running tab asks **Repeat week N** or
**Move on**, and the dashboard says it is waiting. Repeat shifts every later
week back by one (stored as `running.weekOffset`) and can be undone from the
foot of the page; Move on changes nothing and stops the question for that
week. Elapsed time alone never answers it: a week after repeating, with still
nothing logged, the plan is on week 2, not 3, and asks again. Limits: only a
log on the planned day ticks a run off, so a run done on another day is in
Recent runs but not credited to the plan; after a repeat, the week preview
shows earlier weeks a week later and unticked, though their logs are intact;
and `running` merges between devices with this device winning, so answer on one
device.

**A hard run on a squat or hinge day says so, on both cards.** Runs sit on fixed
weekdays (Wed, Sat, Sun); the lifting follows your last session instead, so the
old promise that runs "never clash with a strength day" was false. Reproduced on
the previous build: the VO2 plan's 30/30 intervals on Wed 21 Oct, with Full
body B (a hinge), Upper / lower's Lower, or the rotation's Pull all due that
day — three templates, no warning anywhere, and the Today tab said "fit it in
before or after your lift". Now the run card and the workout card both name the
session, and **Move run to tomorrow** shifts the run a day (`running.moved`, put
back from its row). Hard means tempo, intervals, sprints, VO2 max or a test;
long and easy runs aren't flagged. Limits: only today's session and your next
one are known, because when you train after that is your call, so a clash later
in the week isn't flagged, and a run moved to tomorrow isn't checked against
tomorrow's lifting.

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

**A workout belongs to the day it began.** The day is decided once, when you
press Begin — from the logging date and the day-start hour — and saved on the
session as `dayKey`. Nothing re-derives it from a timestamp afterwards. It used
to be worked out three ways: a workout finished at 05:00 IST is `23:30Z` the day
before, so the fitness streak (which sliced the UTC date) filed it on the wrong
day and showed the day not done; one finished at 00:20 with the day starting at
4:00 was 2 Oct in Fitness and 1 Oct everywhere else; and a workout logged while
backfilling 29 Sep was stamped with the moment you saved it. Now begun at 23:50
and finished at 00:20, it is the day it began, and backfilling 29 Sep files it on
29 Sep. Sessions saved before `dayKey` existed fall back to their local day with
the same day-start hour, never the UTC date. One limit: a PR or pain flag from a
backfilled workout still carries the time you saved it, so it can read "today".

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

**The muscle map is sized to this app, not borrowed.** Every one of the 150
movements is mapped to the muscles it trains, at three weights: primary, real
assistance, and bracing. Bracing is priced low on purpose — counting the core in
a squat as 40% of squat volume made abs level three times faster than chest
while barely being trained. There are 22 groups, and every one has at least one
movement that trains it as a primary mover: a calf raise, a tibialis raise and a
neck isometric are in the library now, so calves, shins and neck have tiles that
can move. `node tools/check-muscle-map.js` enforces both halves — every
exercise mapped, and every group actually reachable.

**Direct sets against a floor catch what a template target can't.** "Vs. your
template" is circular by construction: it is built from your template's own
slots, so a group the template skips gets a tiny target and reads **On target**.
Biceps in a rows-only week showed exactly that — assisting every row, never
the prime mover, 0 direct sets. The Muscles screen now also counts **direct
sets in 7 days** (a logged set where the group is a primary mover; secondary
and bracing work counts for nothing here) against a weekly floor: 3 for the
seven groups only your main slots train, 6 for the twelve a coverage slot tops
up (quads among them, which squats also reach), 3 for rotator cuff, neck and
shins. **Neglected** means below the floor, furthest short
first — 20 of 22 groups after a week of rows. The floors are product choices,
not validated minimums, and the screen says so beside the column.

**The finisher and the Accessory session top up what the week is short on.**
Both pick from 15 coverage slots (curl, lateral raise, rear delt, rotator cuff,
traps, neck, grip, quad, hamstring, calf, shin, adductor, abductor,
anti-rotation, back extension), 64 movements in all, each a ladder with an
equipment-free first rung under the same step-up rule as the main slots. The
**finisher** is a tick on the Workout screen, off until you turn it on: four
picks after the main slots for the groups furthest below their floor, skipping
any trained directly in the last 48 hours, each with its reason ("Biceps: 0 of 6
direct sets this week"). Remove or swap one, or put it back. The **Accessory
session** is a card on the ready, done-today and rest screens: 2 to 6 of the same
picks on their own, on any day. It moves no rotation, rest day or attendance —
the report counts it on its own line — and it does count for muscles, PRs,
evidence, the BASALT streak and the fitness habit. Program's **Coverage** card
lists each slot's movement and the week's count, and *Pin to* puts a slot first
on chosen weekdays whatever its shortfall, though never past your equipment,
exclusions or limits. Limits: the picks are a rule of thumb from your own logs,
not a prescription; the minutes shown use the same 2.5 min a set plus rest as the
main session, which overstates short isometric work; and "Full Sweep" and
"Balanced Build" now span 22 groups, so they are harder (earned badges keep their
date).

**The Exercises section is the one place a movement is explained.** It lists all
150 movements, one page each: a written guide (set up, one rep, breathing,
tempo, where you should and shouldn't feel it, mistakes with their fix, when to
stop), the muscles in three tiers on a front-and-back drawing, easier and harder
moves taken from the ladder, and what your own program and log say about it —
the slot's current prescription, your last three sessions (with the weight, on
a loaded movement), your best. *How to do
this* in a workout opens the same page, and Back returns to the workout with
your draft as you left it. Three actions sit on the page: **Train this in my
slot** (the same call as Program's picker, so a refused choice says why on the
page, and like the picker it isn't offered on a slot you left out), **Exclude** and **Include again**, and, for coverage movements, **Pin**.
Search reads names, muscles, the slot and an alias list: "knuckle" finds the six
push-ups that take that grip. **The guides never state a rep range, a set count
or a hold time** — the app's rule is the only source of those, and
`node tools/check-exercise-content.js` fails on 14 phrasings that would restate
one. Limits worth knowing:
- The 150 guides were written from the app's own cues and general knowledge, not
  by a coach; the planche, handstand, front-lever, L-sit, Copenhagen and neck
  guides are the ones to read critically.
- The drawing is simplified: on a phone each muscle shape is 9–30 px, and the
  side-delt strip is about 3 px wide on the back view. The **Muscle** select
  beside the map does the same job, so no one needs to hit it.
- **Where on its path** is a position on the slot's ladder, not a strength
  rating, and the **joint load** line is scored by judgement at the setup the
  movement starts at: it filters movements, and can't assess an injury.
- The figure is the male one from the source drawing; the profile's `sex` field
  doesn't switch it yet.
- Offline works from the service worker's cache. `file://` can't register one,
  so open it over localhost to install it (see "Running it").

**Weekly targets follow your template.** "Above target" compares your week
against what a week of *your* template delivers to that group: its slots, its
sessions a week, 3 sets at steady-state reps, worked out when the Muscles view
draws, from the slots the app would build for you. So the same chest reads a
target of 54 on Full body ×3, 36 on ×2, 120 on Upper / lower and 84 on the
rotation, and Upper / lower's lats read 48 with no pull-up bar (one row a day)
and 96 with one (a row and a pull-up). The rotation's numbers fell 12.5% when
this landed — chest 96 → 84 — because the old ones assumed four sessions a week
and its own rest rule allows 3.5. A guessed target would have left three groups
permanently reading "well above — check recovery" on the plan the app wrote for
you, which is the app arguing with itself. Limits: the reps per set (12 for
push, 8 for pulling, 14 for squat and hinge, a 30 s core hold) are an
assumption, not a measure of you; the standard-length session is used, so Short
and Full read as under or over it; and a slot you switch off adds nothing.
`node tools/check-muscle-map.js` runs the same arithmetic over every template it
reads out of `basalt.js` and fails if a slot has no entry or a group is never
trained — the first run of it found that the row had neither.

**Units are display-only.** Everything is stored in metric, always. Switching
between kg/cm/°C and lb/in/°F changes what you type and what you see, and can
never alter, round or corrupt a reading you already saved. A backup exported on
one setting reads correctly on the other.

**Sync merges your fitness history instead of picking a side.** Sessions, pain
flags, goals and run logs are joined by their ids, and each exercise keeps one
PR per kind at the higher value. It used to replace the whole list with the
local one: log one workout on the phone and one on the desktop and each device
kept only its own, so the sync file held whichever device wrote last. Now both
keep both, and the higher schema version wins. An edit travels too: a
session's notes or volume, a goal ticked or pinned, and a run re-logged on the
same day carry the time of the edit, so the newer one wins on both devices. Two
limits, stated where they bite: a session you delete comes back from any device that still has it, and
keeps coming back until you delete it on every device; and the logs with no
ids — bodyweight, measurements, sleep, nutrition — still merge whole, with this
device winning.

**A recovery block cuts sets for a week, and nothing else.** The old deload cut a
target by 25% and then applied a floor of 20 s for holds and 6 reps for
everything else, so the smallest targets went *up*: a 15 s hollow hold became
20 s, a 10 s L-sit became 20 s, a 5-rep pull-up became 6 — a harder recovery
week for the people least able to take one. Targets are ranges now, so the block
doesn't touch them. For 7 days working sets are cut to 60%, rounded, never below
1 (3 become 2, 4 become 2). Ranges and rest stay, nothing steps up and the "+1
set" mode is off, so no number can rise. A session done inside it is stamped and
is never evidence: at one set the block leaves the count alone, so the set count
can't be what excludes it. The first session after day 7 is a normal one. A
banner shows on every day of it with an **End block now** button, and ending it
the day it started means it never applied. It is offered after a sharp pain flag
or when two movements' totals have fallen over their last three sessions each,
with the numbers that triggered it and a **Not now** that holds until something
new happens — or you start one yourself from Phase review. Limits: the 7 days
and the 60% are product choices, and the offer can't see pain you don't flag.

**The phase report has three readings and no grade.** It used to blend
completion, rep ratio, sleep, effort and weight into one S–D score and then
advance, consolidate or deload your program on it — and the rep ratio compared
every session to a target the points system had set, which no longer exists. It
now reports **adherence** (sessions attended out of the template's planned
sessions), **performance** (per movement, comparable sessions this period and
steps taken) and **recovery** (pain flags, exercises rated Failed, recovery
blocks), each with its own sample size and its own limit written beneath it:
effort is rated per exercise, not per set, so "Failed" counts exercises, and a
period part-way through is read against the sessions planned so far. Bodyweight
is charted beside them and feeds nothing. Closing a phase changes no
prescription. Phases closed before this build keep their grade in the history.

**A step up needs evidence, and your yes.** Each movement is a range — 3 sets
of 6–12 reps, or a hold range like 10–20 s for an L-sit — and it steps up only
after two sessions on different days with every set at the top, both rated easy
or just right. Then the Workout card asks, naming the sessions: "Ready: 3 × 12
on 24 Sept and 27 Sept — step up to table height (~75 cm)?", with **Step up**
and **Repeat**. It used to run on points, and points paid for work that wasn't
done: one logged wall push-up set advanced shoulder, dip and core by 13 points
each, and eight sessions of 3 × 1 against an 8-rep target reached Level 2. The
card's "when to step up" sentence is generated from the same constants the
decision uses, so it can't disagree with it; the old per-movement "ready to
advance when…" lines no longer render. The limit sits on the card itself: 6–12, three sets and
two sessions are product choices, not validated thresholds, and the rule reads
your logged sets and ratings — it can't see your form.

**Old sessions are history, never evidence.** A session saved before the
upgrade carries no record of the prescription it was done at, and its "just
right" can't be told from no answer — the old build saved `moderate` for a
blank rating, so a workout with nothing rated saved four of them. Those
sessions still show in your history, but the session log reads their rating as
"unknown — older log", and no step is ever offered from them. Effort now has a
**Not sure** button, and a blank stays blank; neither counts toward a step. The
first workout after the upgrade shows one card saying all of this, once per
device.

**The program follows the equipment you have.** The default profile owns no
pull-up bar and still got Dead Hang, so a beginner's pull day was Dead Hang,
Glute Bridge and Plank — no pulling at all. Without a bar the row now carries
pulling, and the card says why. With one, a row is offered on your first pull
day as a ticked checkbox, applied only if you save it ticked, and reversible in
Program. Loaded movements are no longer locked behind Era II: anyone who owns
dumbbells or kettlebells finds them in Swap, with the weight marked per hand or
total.

**You can overrule the ladder, and your choice stays.** Program → a slot →
*Change exercise* lists every movement in that slot in three groups — *On your
path*, *Branches* (Archer Push-up, Shrimp Squat) and *Weighted* — each tagged
with why it might not work today: gear you lack, an exclusion, a joint you
avoid. The pick is saved as the slot's prescription at the bottom of its range,
marked "chosen by you", and stays until a step or another choice moves it. Before
this, no slot could ever hold a branch move or a weighted one, so a path's end
was a dead end: Decline Push-up could only be "swapped" for one session. Skill
attempts (planche, lever, handstand, L-sit) aren't offered here; they stay in
Skills. At the end of a path the card's optional next moves are now buttons
(*Step into Archer Push-up*), and stepping back from a branch move goes to the
movement that offers it.

**Knuckle push-ups are a grip, not a rung.** Program → *Push-ups on: Palms /
Knuckles* sets a standing grip for the six push-ups where a fist on the floor is
a real option (Wall, Incline, Push-up, Decline, Wide, Negative); Diamond, Archer
and Pseudo Planche stay on palms because the hand position is the point of
them. The Today preview has a *Knuckles today* tick for one session. Knuckles
count as slightly harder: a knuckles session is evidence for a palms
prescription, a palms session isn't evidence for a knuckles one, and switching
to knuckles starts that evidence again. That ordering is a product rule, not a
measurement. A wrist pain swap named "Fist Push-up" used to relabel Push-up and
flag it, so a knuckles user couldn't progress and their report filled with pain
they didn't have; it now keeps the exercise on knuckles, and is still a pain
swap — flagged, not evidence.

**Exclusions and joint limits filter movements; they don't assess you.**
*Exclude* in Change exercise takes a movement out of prescriptions, steps and
Swap lists (Swap shows it behind *Show excluded*, and a one-off swap still
works); Program's *Excluded movements* card is the way back. Settings → *Joint
limits* sets each of eight joints to *Careful* or *Avoid*. Avoid removes the
movements that load that joint heavily; careful only warns and ranks them lower;
*Allow anyway* lets one movement past an avoid. A step, a swap list and the
assessment all route round a blocked movement to the nearest one you allow. The
scores behind this are a rubric applied by hand — 368 scores across the 150
movements, 161 of them "heavy" — not a measurement, and the app can't see an
injury or your form. If something hurts, stop.

**Hold, and your own sets and range.** *Hold* pauses step-ups on one slot while
leaving step-back offers on: the card says "Holding at 3 × 12 … step-ups are
paused". *Sets & range* sets your own count (1–6) and range (top at least 2 above
the bottom, up to 50 reps or 300 s) and survives a goal change; changing the sets
starts that slot's evidence again, because a different number of sets is a
different prescription.

**Equipment is finer, and weights are the ones you have.** "Pull-up bar" used to
stand for four things, so a doorway-bar owner was told Parallel Bar Dip and
Band-Assisted Pull-up were ready. Dip bars, a waist-height bar, resistance bands
and parallettes are now their own items in setup and Settings. The upgrade turned
on only those your own sessions or slots show you have (a logged Parallel Bar Dip
turns on dip bars), and a one-time *Check your equipment* card lists all four with
the reason, per device. Settings → *Weights you have* sets, per implement,
either an adjustable step and heaviest weight or a fixed list; a load step goes to
the next weight you have. With nothing set, the steps are what they were:
dumbbells +2.5 kg, kettlebells +4 kg, no limit.

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

### The desktop app

`src-tauri/` wraps the same files in a Tauri v2 window — a real binary on the
system webview (WebKitGTK on Linux, WebView2 on Windows), not a bundled browser.
The app code is unchanged; only the final "show a notification" call branches.

| | |
|---|---|
| **Closes to the tray** | Closing the window hides it and the reminder scheduler keeps ticking. Quit from the tray menu |
| **Native notifications** | Reminders go through the OS notification daemon, not the web Notification API |
| **Single instance** | A second launch focuses the running window instead of opening another |
| **Autostart** | Registers a login item once; turning it off later sticks |

```sh
sh src-tauri/copy-assets.sh                  # curated copy of the runtime files into src-tauri/dist
(cd src-tauri && cargo build --release)      # needs the Rust toolchain
sh src-tauri/install.sh                      # binary, icons and a .desktop launcher into ~/.local
```

After that, **Settings → Desktop app → Check for updates** runs the same three
steps in place whenever a source file is newer than the running binary. Pushing
a `v*` tag builds the Windows `.exe` and a Linux AppImage in GitHub Actions
(`.github/workflows/build.yml`).

**The desktop window starts empty.** Its storage is a different origin from your
browser's, so your history isn't in it yet. Link the same sync in both, or
import a backup once — the first-run note says so, because "where's my data" is
the wrong first impression.

### The Android app

The same `src-tauri/` project builds an Android APK (Tauri v2, the system WebView).
It is **sideloaded only** — no Play Store — and signed with a key that lives in
`~/.android-keys/`, outside this repo and outside `SyncedWork`. Android will only
replace an installed copy with an APK signed by the same key, so that folder
needs a backup somewhere you choose: without it, updating means uninstalling,
and uninstalling wipes the app's local storage.

```sh
cargo tauri android build --apk --target aarch64                            # signed release APK, arm64 only (12.4 MB; all four ABIs is 40.7 MB)
adb install -r src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

**The first build with the updater has to be installed by hand.** An updater
can't install itself. After that, **Settings → Reminders & devices → Android app**
checks GitHub Releases and installs new builds through Android's own installer.

| | |
|---|---|
| **Where updates come from** | GitHub Releases on `talon270/wellness-hub`, tags named `android-vMAJOR.MINOR.PATCH`. The phone compares that number to its own `versionCode` (`major×1,000,000 + minor×1,000 + patch`, so `1.0.0` is `1000000`) |
| **When it checks** | Once a day when the app opens, if the switch in the card is on (it is by default; the first check says so in a toast), and whenever you tap the button. One request to `api.github.com`; nothing about you is sent |
| **What it prints** | *Up to date* only with the time of a check that succeeded. A failed check says why and shows the last good one; it never overwrites it |
| **What Android asks of you** | Allow **Install unknown apps** for Wellness Hub once, and tap **Update** on the system dialog for every install. Android then closes the app while it replaces it, and can't reopen it — use the launcher or the installer's **Open** |

**What has been run, and what has not.** The card and every state it can be in were
driven with a mocked bridge and a mocked GitHub; the Kotlin compiles into a signed APK;
the release script's dry run builds and verifies one (arm64 only: 12.4 MB, against 40.7 MB
for all four ABIs). **Nothing has run on a phone** — the download, the install permission,
the confirmation dialog, and whether your history survives an update byte for byte are
all unchecked, which is why the card does not say "your data stays".

Publishing is one script, dry-run by default:

```sh
# set "version" in src-tauri/tauri.conf.json and Cargo.toml, commit, push — then:
sh tools/release-android.sh 1.0.2              # builds, verifies the signature and versionCode, prints size + SHA-256
sh tools/release-android.sh 1.0.2 --publish    # the same, refusing on any problem, then creates the PUBLIC release
```

### The things most sideload updaters get wrong

**Trust the signature, not the hash.** The release notes carry a `sha256:` line and
the phone checks the download against it — but whoever can edit the release can edit
the hash, so it only catches a truncated or corrupt file. What authenticates an update
is Android refusing any APK not signed with the installed copy's key
(`INSTALL_FAILED_UPDATE_INCOMPATIBLE`). That is why the keystore never goes near a
release or CI, and why the script refuses to publish an unsigned APK.

**A refused install has to say so.** The update goes through `PackageInstaller` and
not a plain "open this file" intent, because the first reports success or the exact
refusal and the second reports nothing — a refused update would look like a button that
does nothing, which is what the desktop Relaunch button did until it was fixed.

**The tag must name what was built.** The script edits nothing. It refuses unless the
version files already hold the version, everything tracked is committed, and `HEAD` is on
`origin`; a script that bumped the files itself would build a tree the tag doesn't point at.

**The release is public.** Anyone can download the APK. It contains no data of yours — it
does contain the app's code and your Supabase project URL, both already in this public
repo — and they would need your credentials to sync anything.

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

The desktop app gets one step further: closing its window hides it to the tray,
so interval reminders keep firing. Quit it from the tray and they stop.
Reminders that survive a full quit need an OS-level timer (a `systemd` timer
calling `notify-send`) or a push server, and this app has neither by design.

---

## Keeping your data

Health history you've spent a year building deserves better than an unprotected
`localStorage` key. Settings → **Keeping your data** offers two layers:

**1. Eviction protection.** The app calls `navigator.storage.persist()`, which
asks the browser to exempt this origin from the automatic clean-up it performs
when disk space runs low. Chrome usually grants this silently once the app is
installed; Firefox asks. The card reports the real answer either way.

**2. A sync transport.** Link one per machine and the app rewrites it a few
seconds after anything changes — no prompts, no remembering. Your history then
lives outside the browser entirely.

| Transport | Where the data lives | Needs |
|---|---|---|
| **Linked folder** | `wellness-hub.json` plus rolling backups in a folder you pick — ideally one Syncthing or a backup already covers | Chrome, Edge or Opera (File System Access) |
| **Google Drive** | `Helth Sync/wellness-hub.json` plus a `backups/` folder in your Drive | A Google sign-in |
| **Supabase** | One row per account in `wellness_state`; the last 10 snapshots, at most one per 5 minutes, in `wellness_backups` | An email and password on your Supabase project. Works in the desktop app and the browser |

Connecting a second transport on the same machine unlinks the first, with a
toast saying so — two transports writing the same history would fight.

**Linking pulls before it pushes.** Every transport reads what is already there,
merges it into this device, and only then writes. The first version of the
Supabase transport didn't: it wrote straight after sign-in, so signing in from a
fresh desktop install — empty storage — PATCHed a 30-day cloud row down to 0
days. The same sign-in now brings all 30 days down to the new device and leaves
the cloud at 30. If the existing copy can't be read at all (a cold free-tier
project, a corrupt file), nothing is written over it, and a later write that
finds a Drive file or Supabase row it has never read merges instead of
overwriting.

The payoff is the recovery path: if site data is ever cleared, the app notices
it's empty on next launch, finds the linked file still there, and offers to
restore from it before you lose anything. A Drive or Supabase sign-in lives in
site data too, so it goes with everything else — sign in again and linking
merges the history back down.

Firefox and Safari can't link a folder. With no transport linked, the app falls
back to manual export and nags you if it's been more than a fortnight — it says
so plainly rather than pretending the two are equivalent.

**What's solid and what's assumed about Supabase.** The publishable key ships
inside every copy of the app, by design; Row Level Security
(`user_id = auth.uid()`) is the whole security model. It is also the one
deviation from "no backend, no accounts", and it's contained: sync only,
`localStorage` stays canonical, and the app opens and works with the network
unplugged and the account signed out.

| Solid — checked 2026-09-14 | Assumed — not yet tested |
|---|---|
| Signed out, both tables read back `[]` and an anonymous insert is refused (`42501 new row violates row-level security policy`) — probed against the live project | A **second signed-in account** reading zero of your rows. That's the real RLS test (`PLAN-desktop-supabase.md` §B1) and it needs a second account |
| Signing in from an empty device keeps a 30-day cloud row at 30 and brings it down; a failed first read writes nothing, and the next write merges — mocked PostgREST, same script run before and after the fix | Behaviour against a **paused** free-tier project after ~7 idle days — expected to show as disconnected and recover on the next focus, not observed |

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
  build-palettes.py         Reads ../Themes/*.txt, writes css/palettes.css + js/palettes.data.js (stdlib only)
  install-service.sh        Installs it as a systemd user service
  uninstall-service.sh      Removes that service
css/
  hub.css                   Layout shell and all hub components (its Gruvbox :root is now only a fallback)
  basalt-gruvbox.css        Re-skins the calisthenics app onto the Gruvbox palette
  basalt-makeover.css       Fixes how that skin is USED: surface ramp, quieter accent
  muscles.css               The Muscles section: coverage table, heat dots, today strip
  palettes.css              GENERATED — one token block per palette, default (Selene) also :root
  neumorph.css              Soft raised/sunk shape and the motion every palette is drawn with
js/
  core.js                   Store, router, dates, toasts, modals, timers, reminders
  theme.js                  Palette switching: the data-theme attribute, the crossfade, the list
  palettes.data.js          GENERATED — swatch metadata for the Settings picker
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
    settings.js             Four groups: daily use, reminders & devices, appearance, data
fitness/
  basalt.css                The original calisthenics app's stylesheet
  basalt.js                 The original calisthenics app's logic
  training.data.js          The catalogue: slots, ladders, setups, grips, joint stress
  training.js               The step-up / repeat / step-back rules, pure
  muscles.data.js           Exercise -> muscle map, the 22 groups and their weekly floors
  muscles.js                The Muscles section
  coverage.js               Direct sets per group, and which coverage slots a finisher picks
  bodymap.data.js           GENERATED — the front and back drawing, one region per group
  bodymap.js                Draws it: tiers for one movement, heat for the week
  directory.js              The Exercises section
  content/                  The written guides, in four batch files, and STYLE.md
  ironframe_original.html   Untouched original, kept for reference only
vendor/
  chart.umd.min.js          Chart.js, vendored locally so the app stays offline
  inter/                    Inter (latin subset, 48 KB) and its OFL licence — unreferenced since the Ochre palettes were retired
```

### Palettes

Twenty-one, switchable from **Settings → Appearance → Palette**: the twenty
terminal themes in the `Themes/` folder (Selene is the default) and **Selene
Day**, a light palette derived from Selene because the folder has none. Every
one is drawn in the same soft raised-and-sunk shape.

The mechanism is one attribute. `css/palettes.css` defines every token the app
reads — once per palette, under `html[data-theme="…"]` — and the default is also
`:root`, so the page is right before any script has run. `css/hub.css` still
carries a Gruvbox `:root` ramp, but only as a fallback the generated sheet
overrides. Every other stylesheet resolves through those tokens, so the Fitness
tab, the muscle heat map and the charts follow without a component rule changing.
`js/theme.js` owns the attribute, keeps `<meta name="theme-color">` in step, and
rebuilds any open chart, since Chart.js needs literal colour strings and
therefore caches whatever palette was in force when it drew.

**Both generated files come from one script.** Run `python3 tools/build-palettes.py`
after changing a file in `Themes/`; it needs no `.venv` (standard library only),
prints a contrast table, and **writes nothing and exits 1 if any palette misses
its floors** — 4.5:1 for every text colour on every surface it can sit on, 3:1 for
a control's edge. `Themes/` lives outside this repo, so the values are baked in;
the app never reads it.

### The things most terminal-theme ports get wrong

**The theme file's ground is black, and neumorphism can't be drawn on black.**
`background` and `surface` are `#000000` in 20 of 20 files. Soft UI is a
highlight on one edge and a shade on the opposite one; on `#000` the shade has
nowhere to go. Measured on Selene with the same shadow recipe: shade-to-ground
separation is 0.00 L\* on `#000000`, −3.6 on the file's own `surfaceVariant`
(`#0E1418`), −10.3 on that hue lifted to L\* 16 (`#202930`). So the ground is
each file's own `surfaceVariant`, saturation capped at 20% (uncapped, akira's
came out `#441A24`, a maroon) and lifted to L\* 16. **The ground is therefore
computed, not the file's** — the picker's swatch draws the lifted value so a tile
matches what you get.

**The files have no status colours.** `error`, `success` and `primary` are the
same value in 20 of 20 (Selene: all `CFD8DC`), so done, warning, danger and info
are one fixed set in every palette, nudged only until each clears 4.5:1 on that
palette's surfaces. Five accents also sit within 25° of danger red — akira,
andromeda, arasaka, basalt, quasar — so on those a filled primary button is close
to red; destructive buttons are outlined instead of filled and always carry their
label, which is the only thing telling them apart there.

**The files' "on" colours are unreadable.** `onPrimary` reaches 4.5:1 on
`primary` in 1 of 20 files; Selene's is 1.25:1 (light text on a light accent).
Text on an accent fill is black or white, whichever scores higher, and an accent
used as text is mixed toward the page text colour until it passes — 5 of 20
accents fail as text on the lifted ground without that.

**A soft shadow is not a control boundary.** On Selene, highlight/ground is
1.24:1 and shade/ground 1.27:1; WCAG 1.4.11 asks 3:1. Inputs, buttons, switches
and chips therefore keep a 1px hairline generated at ≥3:1, focus is a 3px accent
ring, and selection is sunk *and* accent-coloured rather than shadow alone. This is
less pure than the classic look; the pure look fails contrast.

**Muted text has to clear the floor on the worst surface, not the base one.**
On Selene Day, muted text that passed on the card ground measured 4.15:1 on the
darker `bg1` tint that notes and metric buttons sit on. The generator checks the
ground, the hover tint and the well tint, and takes the worst.

Two details worth knowing before you change one:

- **Translucent fills go through `--*-rgb` triplets.** A rule that writes
  `rgba(254,128,25,.14)` stays one palette's orange forever;
  `rgba(var(--orange-bright-rgb),.14)` follows the theme.
- **Every shadow is a four-layer list** — outer highlight, outer shade, inset
  shade, inset highlight, with unused layers as transparent zeros — so raised ↔
  sunk interpolates layer by layer. Lists with different layer counts jump
  instead of animating, which is how a press ends up snapping.

### Motion

**Press is the whole interaction language: raised → sunk in 120ms.** Buttons,
quick-log tiles, switches, nav items and the date arrows sink when pressed. It
is a `box-shadow` transition, so it is used only on small controls and never on a
card; cards and view content move with `transform` and `opacity` only.

| What | Trigger | Motion | Why it exists |
|---|---|---|---|
| Press | every tap, dozens a day | 120ms shadow raised → sunk, 2% scale | feedback that the tap registered |
| Tab switch | tens a day | children rise 4px, 45ms apart, 200ms each | the new view arrives in order instead of all at once |
| Palette switch | rare | 220ms crossfade of the page | the colours change without a flash |
| Modal, toast | occasional | existing entrances, on the strong ease-out; modal scales from 97% | unchanged behaviour, one curve |

Two guards that matter: the tab cascade runs only while `Hub.show()` has flagged
the view `is-entering` (450ms), because `refresh()` re-renders a view on every
logged glass of water and a permanent class would replay the cascade each time;
and under `prefers-reduced-motion` the cascade is switched off outright, since a
stagger's *delay* is not a duration and would otherwise leave content invisible for
up to 180ms. The palette crossfade uses `document.startViewTransition`, so where
an engine lacks it the switch is instant — which is also correct. Nothing
animates from a keyboard shortcut or runs a hundred times a day.

### What was measured, and what wasn't

The same script — every visible text element, its real composited background, WCAG
ratio, 3:1 for large text — ran on a copy of the pre-change tree rebuilt from git
and on the new one, across the 12 hub tabs at 1440px:

| Palette | Text elements | Below the floor |
|---|---|---|
| Gruvbox Dark (old default) | 1,051 | **108** — 67 on Achievements, 38 on Insights |
| Paper Ochre (old light) | 1,047 | 1 |
| Charcoal Ochre (old dark) | 1,047 | 0 |
| Selene (new default) | 1,057 | **0** |
| Selene Day | 1,057 | **0** |
| Selene, 60 days of seeded data | 1,272 | **0** |

The verification suite also switched through **all 21 palettes** by clicking each
tile in Settings and audited 8 tabs per palette: 0 below the floor, and on every
palette the 146 controls sampled (Health and Settings) had their edge at ≥3:1. 21 switches left the saved logs
byte-identical (30,855 bytes before and after). A saved preference from any of
the retired palettes, from an id that never existed, or from nothing loads Selene
with no console error. At 390px no horizontal overflow was introduced (none
before, none after); at 1920px the content is centred beside the sidebar on all
12 tabs (worst left/right difference 0.0px).

The first light-palette run found 11 elements at 4.15:1 and 3.91:1 — muted text
that passed on the card ground and failed on the darker tint under notes and
metric buttons. That is why the generator now checks three surfaces.

**Not covered:** an installed desktop shell (the Update button rebuilds it, and
whether `startViewTransition` exists in its WebKitGTK is unchecked — the palette
switch is instant there if not), the Android WebView and any physical device,
frame rate of the press animation on a low-end phone, hover on anything but the primary button (that one is driven per palette — it caught the
white label on arasaka and andromeda falling to 4.31:1 and 4.37:1, now fixed), the keyboard focus ring (verified in the CSS, not on screen), print
output, Fitness with real training history, and how any of the motion *feels* —
that needs a person, at 2–5× duration and again the next day.

The choice lives in `wellnessHub.ui`, outside the versioned schema: it isn't in a
backup and a data reset won't clear it. Because it is outside the schema, replacing
the palette list needed no migration — a saved id that is no longer in the list
falls back to Selene. An inline script in `<head>` stamps it before the first paint.

### Why the Fitness tab is separate files

The calisthenics app (`ironframe_improved.html`, now `fitness/ironframe_original.html`)
was a complete 8,800-line application with its own router, storage layer, six
sections and settings modal. Inlining that into `index.html` would have produced
a single unmaintainable file, so its CSS and JS were extracted verbatim into
`fitness/basalt.{css,js}` and linked, and its markup was folded into the Fitness
view in `index.html`.

It is **not** an iframe. It runs in the same document, shares the page, and its
data feeds the hub's fitness streak directly.

### How Fitness navigation works

**Nine destinations, one registry, two layouts.** `App.SECTIONS` in
`fitness/basalt.js` holds every destination — id, label, group, order, one-line
description — and both the full bar and the compact picker are generated from it,
so Muscles and Exercises (registered by `fitness/muscles.js` and
`fitness/directory.js`) appear in both without either being edited. **Ids never change, labels do:** `today` reads *Workout*,
`evaluation` reads *Phase review*, `dashboard` reads *Overview*, `skills` reads
*Skills & mobility*; the stored section (`ironframe.ui.section`), the workout
draft (`today.workout`), the Progress subview (`progTab`) and every `data-go`
link are untouched, so nothing saved before this change points at a name that
moved.

**The layout is chosen by the width the bar has, not the width of the window.** A
container query on the app bar (`css/basalt-gruvbox.css` §5) shows the full bar
at 720px of content or more and the picker below it. That distinction matters:
the hub's 232px sidebar, the phone layout and 200% zoom each change the room
independently. Measured on this machine on 2026-10-06, in all 21 palettes, where
the system font runs wide: the nine destinations fit one row at 1440px and
1920px and wrap at 1366px and 1280px, and *Training setup* sits on a second row
at all four widths instead of scrolling. Nine fit at 1440px only because the
buttons' side padding is 8px (`css/basalt-makeover.css`, which overrides §5's):
at 12px they needed 1,153px of the bar's 1,120. The picker is what you get at
360, 390, 412, 768 and 1024. Only one layout is ever
displayed, so only one is ever in the tab order. Where container queries are
unsupported the full bar simply stays, as it was.

**The picker is a disclosure, not a menu.** A labelled toggle shows where you are
(`Progress ▾`), a shortcut beside it reads *Workout* and becomes *Resume* while a
session draft exists, and the panel lists every destination by group with
*Training setup* at the end. Escape closes it and returns focus to the toggle —
and is handled there, because the rest timer listens for Escape on the whole
document and closing a menu used to be able to cancel a rest. **Resume reopens
the draft that exists; it never builds a replacement** (checked: the stored draft
is byte-identical before and after).

**Four defects the plan confirmed, each reproduced on the pre-change copy first:**

| | Before | After |
|---|---|---|
| Setup boundary (F2) | On a fresh profile `#appbar` was `display:flex` and `#app` `display:block` while onboarding was open — the whole shell live above the wizard | both `none` until setup finishes |
| Complete session (F1) | Button at y 759–828 on a 390 × 844 phone; the hub's navigation began at y 782; a hit test at the button's centre reached the *Daily* tab | y 718–766, hit test reaches the button at every scroll position; the rest timer and toasts sit above the bar |
| Phase review (F4) | `grid-template-columns:1fr 1.1fr` inline; document 504px wide at 390 | a class with one column below 1000px; 390 wide |
| Progress focus (F3) | Enter on a subview tab rebuilt the whole view; focus fell to `<body>` | the control stays mounted; focus stays on the tab (or the phone select) |

Progress also puts its subview control directly under the heading and moves the
four headline figures into *Overview*, two-up on a phone. Its five subviews are
real tabs (roving tabindex, arrows, Home/End, Enter and Space) at desktop widths
and a native *Progress view* select below 560px. **What this did not attempt:**
the active-workout screen still lists warm-up before the main sets — putting sets
first means deciding whether warm-up folds away by default, which changes how a
session is done and is not a layout decision.

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
