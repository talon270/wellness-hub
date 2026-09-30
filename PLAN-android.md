# Wellness Hub on Android — plan

Written 2026-09-23, against `src-tauri/` (Tauri v2 desktop shell, `a3ee5fd`
onward), `js/core.js` (`notify` ~1486, `tauriNotify` ~1701, `reminders` ~1799,
`startTick` ~2024), `js/timers.js` (`start`/`pause`/`restart`/`clear` 230–283,
`onHabitDone` 328, `sweep` 354), `js/storage.js` (`linkSupabase` 438) as of
commit `5923137`.

**Method:** interviewed by `/grilling` in five rounds, with answers below. The
code facts come from a line-level read of the files named above. The platform
facts come from two docs subagents that read primary sources:
`tauri-plugin-notification`'s Android source (`NotificationPlugin.kt`,
`TauriNotificationManager.kt`, `guest-js/index.ts`, its
`AndroidManifest.xml`), developer.android.com (Live Updates, exact alarms,
Doze), Nothing's `Glyph-Developer-Kit` and `GlyphMatrix-Developer-Kit`
READMEs, and GSMArena/SamMobile for the M13. Anything they could not confirm
from a primary source is marked UNCONFIRMED where it appears. No code has been
run for this plan.

**Status 2026-09-23:** B0–B7 are built. B9 passes on the 2a:

| Test | Result |
|---|---|
| Locked phone | alert at +1.8 s |
| `am kill` | +1.4 s |
| Force-stop, then reopen | +1.1 s |
| Reboot | 43 ms |

Tapping a notification opens the right tab. That was tested with the app
already running; a tap that launches the app from closed hasn't been tried.
The 4a, the M13, B8, B10 and B11 are still open. A13 was added after B4, and
you approved it ("continue working on the app").

Found on the device and fixed:
- The 2 s lead time cancelled alarms that were about to fire.
- The alarm receiver crashed reading a stored notification.
- A force-stop left the app with a stale record of what it had armed, so it
  re-armed nothing.

Stated limits:
- After a force-stop, nothing rings until the app is opened again. Android
  wipes every alarm the app owns.
- After a reboot, alarms return only once the phone has been unlocked.

---

## What was decided in the interview

| Question | Answer |
|---|---|
| Wrapper | Tauri v2 Android, the same `src-tauri/` project as desktop. No Capacitor, no second shell |
| Sync | The existing Supabase transport, unchanged. Each phone signs in and `adopt()` merges |
| Old phone PWA | Sign it into Supabase first, then sign the app in, then uninstall the PWA |
| Phones | **Nothing Phone (2a)** (primary, Nothing OS 4.0 / Android 16), **Nothing Phone (4a)**, **Samsung Galaxy M13** (Android 12 or 13, whichever it's on, read over `adb`). AOD work applies to the two Nothing phones only |
| Getting builds onto the phones | The 2a's port carries no data, so it uses **wireless debugging** (pair once with a code, then `adb` over Wi-Fi). The other two use USB or wireless, whichever works |
| Which timers notify the phone | Only timers started **on the phone**. Timer state already lives in `wellnessHub.ui`, which is per device and never synced |
| Timer alert | A heads-up notification at the exact second, with sound and vibration. It respects Do Not Disturb |
| Live countdown | **Running timers only.** An Android 16 Live Update countdown that disappears when the timer ends or pauses. Reminders never occupy the AOD |
| AOD route | **Live Update first, proven by a spike on the 2a** (B4). The Glyph SDK is added only if the spike shows the back lights don't follow on their own |
| Interval / clock reminders | A per-device on/off, **not synced**. Intervals, times, days and quiet hours stay synced |
| Reminders while the app is closed | Pre-scheduled natively for the next 24h and re-armed whenever the app runs |
| First run | A suggestion card: each reminder with the reason it does or doesn't suit a phone, ticked by default, untickable. It also covers the permissions and battery settings each phone needs |
| Tapping a notification | Opens the relevant view. A timer notification opens the countdown face. Nothing logs from the notification itself |
| Countdown design | **Dot row**: see Part C |
| Where the face lives | Tapping a running timer opens it full-screen, on every device. The dashboard timer card is unchanged |
| Build | Local JDK and Android SDK on this Arch machine, a signed APK, `adb install -r` |
| Work split | Opus orchestrates from this session and hands the mechanical and UI chunks to Sonnet subagents |

---

## Phase 0 — shape

1. **Who opens this and when?** You, many times a day, mostly on the 2a. It's
   the same data as the Windows and Arch desktops. The 4a and M13 are
   occasional, and that's exactly the case where Samsung puts an app to sleep
   (A8).
2. **What must it never get wrong?** A notification that silently doesn't fire.
   A timer alert that never comes looks exactly like a timer that hasn't
   finished, so you can't notice the failure from the phone. A1–A8 each turn a
   silent miss into a visible state.
3. **Honest confidence of its central claim?** The claim is "this phone will
   ping you." Settings shows what the phone can actually back up: whether
   notifications are allowed, whether exact alarms are available, whether the
   app is exempt from sleeping (Samsung), and **"reminders armed until 14:20
   tomorrow"**. It never shows a bare green tick.
4. **What happens when the source dies?** Sync failing degrades exactly as it
   does on desktop (`PLAN-desktop-supabase.md` A3), and `localStorage` stays
   canonical. The alarms and the countdown need no network. If the app isn't
   opened for more than 24h, the reminder horizon runs out, and the next
   launch re-arms it and says so.

---

## Part A — findings and design risks, ranked

### A1 · DESIGN RISK (high): the plugin silently downgrades to inexact alarms
`TauriNotificationManager.kt` checks `alarmManager.canScheduleExactAlarms()`.
When that returns false, it falls back to `setAndAllowWhileIdle` / `set`
without an error. The plugin's manifest declares `POST_NOTIFICATIONS`,
`WAKE_LOCK` and `RECEIVE_BOOT_COMPLETED`, but no exact-alarm permission.
**Concrete failure:** a 20-minute eye timer's alert lands 5–10 minutes late.
Nothing says why, and you can't tell that apart from a working timer.
**Fix:** two lines in the app's own `AndroidManifest.xml`:
`SCHEDULE_EXACT_ALARM` with `android:maxSdkVersion="32"` (auto-granted on
Android 12, which covers an un-updated M13), and `USE_EXACT_ALARM` (Android
13+, granted at install). The Play Store restricts `USE_EXACT_ALARM` to alarm
apps, which doesn't apply to a sideloaded APK. A2's Kotlin patch also exposes
`canScheduleExactAlarms()` to JS, so Settings reports the real state instead
of assuming it.

### A2 · DESIGN RISK (high): the plugin can't show a live countdown, and one naive countdown would run past zero
The plugin's `Options` (`guest-js/index.ts`) exposes `ongoing` and
`autoCancel`, but no chronometer, countdown or promotion fields. A Live
Update needs `setUsesChronometer(true)`, `setChronometerCountDown(true)`,
`setWhen(endAt)`, `setOngoing(true)`, `setRequestPromotedOngoing(true)`, a
`contentTitle`, and the `POST_PROMOTED_NOTIFICATIONS` permission
(developer.android.com, Live Updates).
**Concrete failure the docs don't mention:** a countdown chronometer doesn't
stop at zero. If the app is dead when the timer ends, the AOD shows `-00:01`,
`-00:02`… until you open the app.
**Fix:** vendor the plugin into `src-tauri/plugins/notification/`, wired in
through `[patch.crates-io]`. Patch `TauriNotificationManager.kt` to read three
optional fields (`countdownTo`, `promoted`, `timeoutAfterMs`) and call the
matching builder setters. `setTimeoutAfter(endAt - now)` makes Android itself
remove the countdown exactly at `endAt`, with no app process needed. The same
patch adds a `canScheduleExactAlarms` command (A1). This is the smallest
route: one shared builder call gains three optional fields, rather than a
second notification path running beside the first.
`// ponytail: vendored plugin fork — re-apply the patch if the plugin is upgraded.`

### A3 · BUG (high, latent): notification permission is hardcoded to "granted" under Tauri
`js/core.js:1506`: `permission()` returns `"granted"` whenever
`window.__TAURI__` exists. `request()` (`:1517`) fires
`plugin:notification|request_permission`, ignores the result, and toasts
"Reminders enabled." That's correct on Linux and Windows, and wrong on Android
13+, where `POST_NOTIFICATIONS` is a real runtime permission. The plugin
implements the real dialog; this app just doesn't read the answer.
**Concrete failure:** you deny the prompt, or later turn notifications off in
system settings. The app still says reminders are on, and every alarm fires
into nothing.
**Fix:** under Tauri, `permission()` and `request()` use the plugin's
`isPermissionGranted` / `requestPermission` results. On desktop these still
return granted, so behaviour there is unchanged. Both functions are the ones
every caller already goes through.

### A4 · DESIGN RISK (high): double delivery while the app is open
While the webview is alive, the in-page tick (`core.js` ~1930/1942/1955)
calls `notify.fire` → `tauriNotify`, and a native alarm for the same reminder
fires as well.
**Concrete failure:** the app is open on the phone, the eye reminder comes
due, and you get two heads-up notifications a second apart.
**Fix:** on Android, the native schedule is the **only** OS-notification path
for reminders and timers. `notify.fire` skips `tauriNotify` under Android and
keeps the in-app toast and cue. The guard sits in `notify.fire` because all
three tick call sites route through it.

### A5 · DESIGN RISK (high): the native schedule drifts from the in-page clocks
Interval reminders re-anchor on every `reminders.reset(key)` (18 call sites
route there, per `PLAN-timer-sync.md`), on `snooze`, and on
`reminders.sync()`. Timers change on `start`, `pause`, `restart`, `clear`,
`stopAll`, `startAll` and `onHabitDone`.
**Concrete failure:** you do a look-away at 14:05, which resets the eye clock
in-page. The alarm armed at 14:00 for 14:20 still fires. A paused timer's
AOD countdown keeps ticking.
**Fix:** one idempotent `Hub.native.rearm()`: cancel every id and every
active countdown this app owns, then rebuild from current state. Running
timers get an alarm at `endAt` plus their Live Update countdown. Reminders get
the next 24h of fires, skipping quiet hours, off-days and snoozes. It's called
from the existing seams (`reminders.reset`, `snooze`, `sync`, the timer
mutators and boot), with no call-site sprawl.
`// ponytail: cancel-all + re-arm; diff only if alarm count ever makes it slow.`
Ids come from stable ranges (countdowns `900 + catalogue index`, timer alarms
`1000 + index`, reminders `2000 + key index × 100 + n`) so a cancel never
hits a foreign id.

### A6 · DESIGN RISK (medium): the 24h horizon runs out if the app isn't opened
Opening the app, logging, or changing settings re-arms. The plugin re-arms
after a reboot through its `LocalNotificationRestoreReceiver`.
**Stated limit:** leave the app closed for more than 24h and reminders stop
until you open it. Settings shows "armed until …", and the last fire of each
horizon says "open Wellness Hub to keep reminders coming."

### A7 · DESIGN RISK (medium): per-device reminders touch 20 read sites
`settings.reminders[key]` is read at **20 sites across 7 files** (`core.js`,
`timers.js`, `settings.js`, `onboarding.js`, `calendar.js`, `bodycare.js`,
`wellness.js`). The per-device choice lives in `wellnessHub.ui →
deviceReminders` (`{ key: true|false }`), so there's no `SCHEMA_VERSION`
bump.
**Concrete failure if done naively:** writing the phone's choice into
`STATE.settings.reminders[key].enabled` syncs it to the PC, so turning desk
reset off on the phone turns it off at your desk.
**Fix:** one accessor, `Hub.reminders.on(key)`, returning the device
override when present and `cfg.enabled` otherwise. The firing paths and the
Settings toggle use it. The display sites get audited in B6 and switched
only where they claim a reminder is on or off. Desktop never writes an
override, so its behaviour is unchanged.

### A8 · DESIGN RISK (medium): Samsung puts a rarely-opened app to sleep, and its alarms stop
One UI's "Put unused apps to sleep" moves an app you haven't opened in about
3 days into Sleeping or Deep sleeping. dontkillmyapp.com (an aggregator, not
Samsung) says: "After 3 days any unused app will not be able to start from
background (e.g. alarms will not work anymore)." That's exactly the M13's
usage pattern. UNCONFIRMED from a Samsung primary source.
**Fix:** on Samsung only, the first-run card and Settings link straight to
Battery → Background usage limits → **Never sleeping apps**. Settings keeps a
visible warning until you confirm it's done, because Android offers no API
to read Samsung's sleep lists. Plain battery "Unrestricted" is requested on
all three phones.

### A9 · UNCONFIRMED (high impact): does Nothing OS show a third-party Live Update on the AOD, and on the Glyphs?
Nothing announced that OS 4.0's Live Updates stay visible "across the
Always-on Display, Status Bar, Lock Screen" and are tied into Glyph Progress.
That's feature-level marketing, not developer documentation, and it may only
cover Nothing's own and partner apps.
**Fix:** B4 is a spike that answers it before any UI is built on the
assumption. There are three outcomes, each already decided:

| Spike result | What happens |
|---|---|
| AOD shows it, Glyphs follow | Done. No Glyph SDK |
| AOD shows it, Glyphs don't | Keep it, and ask you then whether the Glyph SDK is worth a Kotlin foreground service |
| AOD doesn't show it | The countdown still works on the lock screen, status bar and shade. You get told plainly, and the Glyph SDK (`displayProgress()`, confirmed supported on the 2a and 4a) becomes the AOD-adjacent route, again your call |

### A10 · UNCONFIRMED: service worker under the Tauri Android scheme
`js/pwa.js:45` registers `service-worker.js` without checking for
`window.__TAURI__`. On the Android custom scheme, registration may fail or be
meaningless, since the assets are already inside the APK. Checked in B3 and
fixed only if it throws.

### A11 · DESIGN RISK (medium): losing the signing keystore
`adb install -r` only works over an APK signed with the same key. Lose the
key, and updating means uninstall and reinstall, which wipes the app's
`localStorage`. The cloud copy survives, but anything not yet synced is lost.
**Fix:** the keystore goes in `~/.android-keys/wellness-hub.jks`, outside the
repo and outside `SyncedWork` (a synced keystore is a leaked keystore). You
back it up once, in step B2.

### A12 · INCONSISTENCY (low, pre-existing): a timer auto-logs at next open, not at end
`timers.js` `sweep()` runs `t.log()` from the in-page tick. If the app was
killed when the timer ended, the alert and the AOD countdown are on time, but
the log entry is written the next time you open the app, with that moment's
time. On the wrong side of midnight it lands on the wrong day. This already
happens on desktop after a full quit, and will happen far more often on a
phone. Out of scope below; you decide whether it's in.

### A13 · DESIGN RISK (high): no route onto the real AOD exists on the 2a's firmware
**B4 result, 2026-09-23, run on the 2a:** build `B4.0-260225-1817`, API level
`36.0`. `POST_PROMOTED_NOTIFICATIONS` isn't defined on the phone at all, and
no notification on it carries a promoted flag, so a Live Update can't be
posted. Nothing's AOD with `doze_always_on=1` shows notification icons only.
The patched countdown does show, labelled and ticking, on the lock screen and
in the shade, once posted `PUBLIC`. The Glyph SDK lights the back of the
phone, not the screen. That makes the AOD row of A9's table the outcome, and
you ruled that a timer on the AOD is a core feature.
My understanding is that promotion arrives with a later Android 16 release.
That's UNCONFIRMED from a primary source. The 4a may already have it: check
with `dumpsys package permission android.permission.POST_PROMOTED_NOTIFICATIONS`
when it's paired.
**Fix: an app-drawn AOD.** While the countdown face (Part C) is open, the
app shows over the lock screen (`setShowWhenLocked`), keeps the display awake
(`FLAG_KEEP_SCREEN_ON`) and drops to near-minimum brightness. It's a pure
black screen with dim digits, and it works on every Android from 8.1, so on all
three phones. The countdown notification keeps `promoted: true`, so it
becomes a real Live Update by itself once an OS update allows it.
**Stated limits:**
- The screen is on, not dozing, so it draws more power than real AOD.
- Pressing power turns it off until the next wake. The face then comes back
  over the lock screen.
- While the face is up the phone doesn't auto-lock.

---

## Part B — the build

Each step is independently shippable and ends with a check that was run.

| Step | What | Who | Model · effort | Done when |
|---|---|---|---|---|
| B0 | Two subagent definitions in `.claude/agents/`: `android-mech` (Sonnet, effort low) and `android-js` (Sonnet, effort medium). Effort per subagent is set in its definition file, not per call | Opus (this session) | — | Files exist |
| B1 | Toolchain: JDK 17, Android SDK command-line tools in `~/Android/Sdk`, platform-tools, build-tools, platform, NDK, the four Rust Android targets, cargo `tauri-cli`. `JAVA_HOME`/`ANDROID_HOME`/`NDK_HOME` set in fish | `android-mech` + **you** for the one `sudo` | Sonnet · low | `sdkmanager --list_installed` and `cargo tauri android --help` run |
| B2 | `#[cfg(desktop)]` on tray, single-instance, autostart, updater and close-to-tray in `main.rs`, and those crates target-gated in `Cargo.toml`. `lib.rs` split with a mobile entry point. `cargo tauri android init`. The A1 manifest lines plus `POST_PROMOTED_NOTIFICATIONS`. Keystore and signing | `android-mech` | Sonnet · low | **Desktop still builds** on Linux, and a signed release APK builds |
| B3 | Skeleton on all three phones: pair wireless debugging, install, open, sign in, history arrives. Read each phone's Android version. Check A10 | `android-mech` + **you** with the phones | Sonnet · low | `adb logcat` shows no JS errors on any phone, and each dashboard shows your real history |
| B4 | **A2 plugin patch + A9 spike.** Vendor and patch the plugin, then post a 2-minute countdown on the 2a and lock it. Check whether it shows on the AOD and whether the Glyphs move. Report the result against A9's table and stop for your call if the Glyph SDK comes into play | Opus (this session) + **you** watching the 2a | Opus · high | The spike result is quoted and the next step is decided |
| B5 | A3 permission fix, A4 single delivery path, A5 `Hub.native.rearm()` with id ranges, countdowns and quiet hours, tap routing via the plugin's `onAction` using an `extra.view` payload, cold start included | Opus (this session) | Opus · high | Playwright with a mocked `__TAURI__` asserts the exact `schedule`/`cancel`/countdown calls for start, pause, reset, snooze and quiet hours, and desktop behaves the same |
| B6 | A7 accessor and `deviceReminders`, the first-run card (with the A8 Samsung and battery steps chosen per phone make), Settings: per-device toggles, permission state, exact-alarm state, "armed until" | `android-js` | Sonnet · medium | Playwright: both themes at 390px and 1920px, the card's ticks become overrides, the PC profile is unaffected |
| B7 | Countdown face (Part C) and the notification icon. The face is also the app-drawn AOD (A13): `Hub.native.face(on)` on open, pause and close | `android-js` | Sonnet · medium | Playwright: both themes, 390px and 1920px, the last-minute red state, reduced motion, pause and reset wired to the same `timers.js` functions |
| B8 | Verification sweep: the standing checklist from `skills.md`, run against B5–B7 | `test-runner` | Sonnet · medium | Failures are reported with output, and none remain open |
| B9 | On-device alarm test on each phone: a 1-minute timer with the screen locked, the same after `adb shell am force-stop`, the same after a reboot (re-pair wireless debugging on the 2a afterwards), and `adb shell dumpsys alarm` showing the armed ids. On the M13, the app is also left unopened for 3 days | Opus drives `adb` + **you** watch the phones | Opus · high | Each alarm fires within ±5s, and every result is quoted per phone |
| B10 | PWA retirement: the PWA signs in and syncs, the app signs in, then the PWA is uninstalled. Then the other phones | **you** | — | All three phones show the same history |
| B11 | README: an Android section, plus "things most apps get wrong" entries for A1, A2 (the countdown running past zero), A4 and A6 | `android-js` | Sonnet · medium | — |

Backups before any edit: `js/core.js`, `js/timers.js`,
`js/views/settings.js`, `src-tauri/src/main.rs` and `src-tauri/Cargo.toml`
get timestamped copies in the same change, per house rule.

---

## Part C — the countdown face

**Chosen direction: dot row.** Minimal and quiet, with the Nothing influence
limited to type and restraint.

```
┌──────────────────────────────┐
│                              │
│  EYE BREAK            14:20  │   label + end time: small grey monospace caps
│                              │
│                              │
│    1  2  :  4  7             │   Doto dot-matrix numerals, the only large type
│                              │
│  ●●●●●●●●●●●●○○○○○○○○        │   20 dots; one drops out per 5% elapsed
│                              │
│                              │
│  PAUSE              RESET    │   text buttons, no fills
└──────────────────────────────┘
```

| Rule | Value | Why |
|---|---|---|
| Background | `#000` dark, `#F2F2F2` light | True black matches the AOD and costs nothing on OLED. Light mode is a full theme, not an afterthought |
| Ink | `#FFF` / `#000`, with labels at 55% opacity | Two tones plus one accent is the whole palette |
| Accent | `#D71921`, **only** in the last minute, on the remaining dots | One red moment reads as urgency. Red all the time reads as noise |
| Numerals | Doto (SIL Open Font License), vendored as a local `woff2` | Dot-matrix without Nothing's proprietary Ndot. Offline, with no CDN |
| Motion | A dot drops out per step, with no pulse and no glow. `prefers-reduced-motion` removes the fade | "Not too loud" means the screen changes about 20 times in a whole timer |
| Entry | Tap a running timer on the dashboard, or tap its notification | The dashboard card is unchanged. The face is opt-in on every device |
| Theme tokens | Defined in `css/themes.css` for both themes | House rule |

**On the AOD itself** the app controls only two things, so both get the same
restraint:
- **Icon:** a 24dp monochrome icon of five dots in an arc, which Android
  tints.
- **Text:** lowercase title `eye break` and body `ends 14:20`.

Nothing OS draws the ticking numbers in its own system type.

---

## What you have to do yourself

Everything else is orchestrated from this session.

| When | What | Why it can't be done from here |
|---|---|---|
| Now | Approve this plan | Gate 1 |
| B1 | Run `! sudo pacman -S jdk17-openjdk` when asked | Needs your password |
| Before B3 | On each phone: Settings → About phone → tap **Build number** 7× → Developer options → **Wireless debugging** on → **Pair device with pairing code**, then read me the IP:port and code. The phone and this PC must be on the same Wi-Fi | Physical access to the phone. The 2a has no USB data |
| After any reboot or Wi-Fi change | Switch Wireless debugging back on and read me the new port | Android turns it off by itself |
| B2 | Copy `~/.android-keys/` somewhere safe, but not into `SyncedWork` | A11 — only you know where "safe" is |
| B3, B10 | Type your Supabase email and password on each phone | Your credentials never pass through this session |
| B3 | On each phone: allow notifications when asked, and set Battery → **Unrestricted**. On the M13, also add the app to **Never sleeping apps** | Android only lets the user grant these |
| B4 | Lock the 2a during the spike and say what the AOD and the Glyphs show | Only you can see it |
| B9 | Watch each phone during the alarm tests. Leave the M13 alone for 3 days | Same |
| Throughout | Approve Claude Code permission prompts for `adb`, `sdkmanager` and `cargo` | Your permission settings |

---

## Out of scope

| Not doing | Why |
|---|---|
| Alerts for timers started on the PC | Needs FCM push and a server, which breaks the no-backend rule. Decided in the interview |
| A countdown for the next reminder | Would keep something on the AOD all day. Running timers only, as decided |
| Glyph SDK, unless B4 calls for it | The Live Update may drive Glyph Progress on its own. Decided after the spike, not before |
| Glyph Matrix | Only on the Phone (3) and 4a **Pro**, not the plain 4a or the 2a |
| A "Done" button on notifications | Rust writing into webview storage while the page may be dead is a second write path that bypasses the merge. It's a risk to your history |
| A foreground service or alarm-clock-style alerts | Kotlin, a permanent notification and extra permissions, for more volume than a 20-minute eye break needs |
| Nothing's Ndot font | Proprietary. Doto is the open-licence equivalent |
| Play Store, iOS | Sideload only. *(An in-app APK updater was in this row. It was added on 2026-09-30: see `PLAN-android-updater.md`. `adb install -r` remains the way to install the first build.)* |
| A12: logging a timer at its end time when the app was dead | Pre-existing behaviour. Worth its own small plan if you want it |
| Background sync while the app is closed | Sync runs on open and focus, as on desktop. Alarms and countdowns don't need it |
