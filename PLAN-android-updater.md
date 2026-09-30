# Wellness Hub — Android in-app updater — plan

Written 2026-09-30, against commit `8a4ce7c`: `src-tauri/gen/android/app/build.gradle.kts`, `AndroidManifest.xml` and `MainActivity.kt`, `js/native.js`, `js/views/settings.js` (`desktopCard`, `phoneCard`, `appCard`), `src-tauri/tauri.conf.json`, `.github/workflows/build.yml`, and `PLAN-android.md`.

Method: read the files above; ran `gh repo view` (the repo is **public**), `gh release list` (no releases yet), `git ls-files` (no keystore, `.jks` or `.apk` is tracked), `curl` against `api.github.com` with an `Origin: http://tauri.localhost` header (CORS `access-control-allow-origin: *`, 60 requests/hour unauthenticated), `adb devices` (**no phone is connected**) and a toolchain check (JDK, `adb`, NDK 27, `tauri-cli` 2.11.4, build-tools 35.0.0 with `apksigner`; no emulator image is installed). Nothing has been run on a phone, and no Kotlin has been compiled for this plan.

**Nothing below is implemented — this is the plan.**

This **reverses one row of `PLAN-android.md`'s Out of scope** ("an in-app APK updater — sideload only, updates are `adb install -r` from this machine"). That row should be struck when this lands.

## Decisions already made — overturn any of them

**The phone pulls its update from a GitHub Release, checks in JavaScript, and installs through Android's own installer.**

| # | Decision | Why | Cost of reversing |
|---|---|---|---|
| 1 | Host: **GitHub Releases** on `talon270/wellness-hub`, tag `android-vMAJOR.MINOR.PATCH`, one `.apk` asset, and a `sha256: <64 hex>` line in the release body | The repo is already public and `gh` is signed in; the phone needs nothing but HTTPS. A LAN server needs this PC on; Supabase Storage puts a binary in the sync backend and adds a second failure domain; Drive needs a Google sign-in to fetch a public file | One constant (`RELEASES_URL`) |
| 2 | The **check** is a `fetch` in JS; the **download and install** are Kotlin | The check is testable with a mocked `fetch` in Playwright; only the install needs the OS | Move the check native: ~40 lines of Kotlin and no Playwright coverage |
| 3 | Install through **`PackageInstaller`**, not `ACTION_VIEW` on a file | It reports success or the exact refusal reason, which the card can print; `ACTION_VIEW` returns nothing, so a refused install looks like a button that does nothing — the failure the desktop Relaunch button just had | Swap to `ACTION_VIEW` + the existing `FileProvider`: less code, no result |
| 4 | Version identity is the **`versionCode`** Tauri derives from `tauri.conf.json` (`1.0.0` → `1000000`, `1.0.1` → `1000001`); the tag carries the same numbers | Every build so far is `1000000`, so "is there an update?" has no answer yet | — |
| 5 | The publish side is one script, **`tools/release-android.sh`**, dry-run by default | An updater with nothing to fetch is half a feature, and a public release is outward-facing and hard to take back | Publish by hand with `gh release create` |
| 6 | The daily auto-check is **ticked by default**, per device, with its reason beside it, and the first one announces itself in a toast | An updater nobody remembers to press does not update; "silent" is the failure, so it is announced and reversible | Default unticked: the manual button is all there is |

## Part A — findings, ranked

### A1 · DESIGN RISK (high): an updater is code that installs code

Anything that can put an APK in front of the installer can replace the app on the phone.

**Fix:** the trust root is **Android's own signature check** — the OS refuses any APK not signed with the key the installed copy carries (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`), so a hostile or tampered release cannot replace this app unless the keystore is also stolen. On top: HTTPS at every redirect hop, the SHA-256 in the release body checked before the installer is invoked, and only `versionCode` greater than the installed one is offered. **Limit, stated where it bites:** the hash detects a corrupt or truncated download; it does **not** authenticate, because whoever can edit the release can edit the hash too. The signature is what authenticates.

### A2 · BUG (medium, pre-existing, UNCONFIRMED on a device): the phone shows the desktop update card

`desktopCard()` in `js/views/settings.js` gates on `window.__TAURI__`. `tauri.conf.json` sets `withGlobalTauri: true`, and Tauri defines that global on Android too, while `check_update`, `run_update` and `relaunch` are `#[cfg(desktop)]` in `lib.rs`. So on the phone the "Desktop app" card should render with a button whose commands don't exist. I have not seen it on a device — that needs one.

**Fix:** gate `desktopCard()` on `!window.WHNative` and the new card on `window.WHNative` (the bridge `MainActivity` adds, absent everywhere else). One condition either way, so it is the smallest fix.

### A3 · DESIGN RISK (high): losing the keystore turns into an Update button that fails on the phone

`PLAN-android.md` A11: without `~/.android-keys/wellness-hub.jks`, no build can replace the installed app, and uninstalling wipes its `localStorage`. Today that surfaces at a terminal; with this feature it surfaces as a button.

**Fix:** print Android's refusal reason in the card, and say that saved data is untouched and that nothing was installed. The card never suggests uninstalling.

### A4 · DESIGN RISK (high): an update must not cost you history — UNCONFIRMED until run

Same package name and same key means Android keeps the app's data directory, so `localStorage` should survive. That is standard behaviour, but the sentence "your data stays" is a claim about your phone, and it is not printed in the card until it has been checked.

**Fix:** step B6 installs an update over a seeded app on the 2a and compares `wellnessHub.v1` before and after, byte for byte.

### A5 · DESIGN RISK (medium): three things only you can grant, and the app cannot reopen itself

1. **"Install unknown apps"** for Wellness Hub (`REQUEST_INSTALL_PACKAGES` in the manifest, then a per-app switch in Settings). The card reads `canRequestPackageInstalls()` and opens that screen.
2. **A confirmation tap on every update.** A sideloaded app cannot update itself silently, so each update is one tap on the system dialog.
3. **No auto-reopen.** Installing kills the app's process, and Android 10+ blocks starting an activity from the background. The installer's own "Open" button is the way back. This is the same shape as the desktop Relaunch fix, but here the OS forbids the fix.

### A6 · INCONSISTENCY (medium): version numbers do not move

`tauri.properties` says `versionCode=1000000` and is autogenerated from `tauri.conf.json`'s `version`. **Fix:** the release script bumps `version` in `tauri.conf.json` and `Cargo.toml` and refuses a version that is not greater than the last `android-v*` tag. It never edits `tauri.properties`.

### A7 · DESIGN RISK (medium): the APK becomes downloadable by anyone

A Release on a public repo is public. The APK holds no data of yours; it does contain the app's code (already public) and your Supabase project URL (`js/syncsupabase.js:39`, already in the public repo). Anyone could *install* it, and they would need your credentials to sync anything. **Limit:** if that is not acceptable, the GitHub route is off the table; the fallback is the LAN server, which needs this PC on.

**Fix:** the keystore never goes near a release or CI. The script refuses to publish an unsigned APK (`apksigner verify`) and refuses if `HEAD` is not on `origin`, so the tag names the exact source that was built.

### A8 · DESIGN RISK (medium): "up to date" must never be a guess

A failed check that leaves "up to date" on screen is the stale-looks-fresh failure.

**Fix:** five states, each printed with its time — *never checked*, *checking*, *up to date as of 14:02*, *update available: 1.0.2 (12.4 MB)*, *couldn't check (offline, or GitHub's 60 requests/hour limit) — last good check 3 days ago*. A failed check never overwrites the last good one.

### A9 · COSMETIC (low): the existing desktop CI will not fire

`.github/workflows/build.yml` triggers on tags `v*`. `android-v1.0.1` starts with `a`, so it does not match and cutting a release starts no desktop build. Nothing to change; recorded so the tag prefix is not "simplified" later.

## Part B — the build

Each step ships alone and ends with a check that is run.

| Step | What | Done when |
|---|---|---|
| **B0** | Timestamped backups of `js/views/settings.js`, `js/native.js`, `MainActivity.kt`, `AndroidManifest.xml`, `src-tauri/tauri.conf.json`, `service-worker.js` | files exist |
| **B1** | `js/androidupdate.js` (new, `"use strict"` IIFE, namespace `Hub.androidUpdate`): `parseTag()`, `compare()`, `check()` (the five states, last good result kept separately), the daily gate, and `install()` polling `WHNative.installStatus()` at 500ms only while installing. Pure functions first, with a `node` self-check | `node` asserts `android-v1.0.2` → `1000002`, that `1.0.10` outranks `1.0.9` as a number rather than a string, and that a failed check keeps the last good result |
| **B2** | Settings: the **Android app** card in *Reminders & devices*, `desktopCard()` re-gated (A2). Installed version, the state line, size and release notes, the install-permission state with a button to it, progress, the last result. A per-device checkbox, stored in `wellnessHub.ui` and never synced | Playwright at 390 and 1920, both palettes, with a mocked `WHNative` and a mocked `fetch`, one screenshot per state; the desktop card is absent when `WHNative` exists |
| **B3** | Kotlin in the existing `Bridge`: `versionCode()`, `versionName()`, `canInstall()`, `openInstallSettings()`, `install(url, sha256, size)` on a background thread (download to `cacheDir/updates/`, https-only redirects, size and SHA-256 verified, a `PackageInstaller` session, a dynamic receiver for the result), `installStatus()` returning JSON. The manifest gains `REQUEST_INSTALL_PACKAGES`. Partial files are deleted on failure and on next launch | `cargo tauri android build --apk` compiles and `apksigner verify` passes. **Compiles, not runs** — see below |
| **B4** | `tools/release-android.sh <version> [--publish]`: refuses a dirty tracked tree, an unpushed `HEAD`, a version not above the last tag, or an unsigned APK; bumps the two version files; builds; prints file, size, SHA-256 and `versionCode`. With `--publish` it runs `gh release create` with the hash in the body. No `--publish` means nothing leaves this machine | a dry run prints all of that and changes nothing on GitHub |
| **B5** | `service-worker.js` precaches `js/androidupdate.js`, `CACHE_VERSION` bumped | every precached path exists |
| **B6** | **On the 2a, by you:** `adb install -r` the B3 build once (an updater cannot install itself), then publish a second version and update through the card. Compare `wellnessHub.v1` before and after (A4) and read what Android says if the version is a downgrade | each result is quoted; the "your data stays" sentence is added to the card only if the bytes match |
| **B7** | README: an Android section (the build and release commands are not written down anywhere today), plus a "things most sideload updaters get wrong" entry for A1 and A5. Strike the Out-of-scope row in `PLAN-android.md` | — |

Backups before any edit, as your house rule says. **No `SCHEMA_VERSION` change:** the only new stored value is a per-device preference in `wellnessHub.ui`, outside the versioned state, so there is no migration to write.

**What can and cannot be verified from this session.** The JavaScript, the card and the script's dry run can be run here, against a mocked bridge and a mocked `fetch`. The Kotlin can be **compiled** here but not **run**: no phone is connected and there is no emulator, so the download, the install-permission flow, the confirmation dialog and A4 all wait for you and the 2a.

## What you have to do yourself

| When | What | Why it can't be done from here |
|---|---|---|
| Before B6 | Connect the 2a (wireless debugging, as in `PLAN-android.md`) and read me the address | Physical access |
| B6, once | Settings → Apps → Wellness Hub → **Install unknown apps** → allow | Android only lets the user grant it |
| Every update | Tap **Update** on the system dialog, then **Open** | A5 |
| B6 | Approve publishing the test release (`--publish`) — it is public | Outward-facing; your call each time |
| Before you rely on it | Confirm `~/.android-keys/` is backed up outside `SyncedWork` | A3 |

## Out of scope

| Not doing | Why |
|---|---|
| Silent or background install | Android does not allow it for a sideloaded app without device-owner status |
| Auto-reopen after install | A5: blocked since Android 10 |
| Delta patches or a Wi-Fi-only download rule | The APK is 12.97 MB; the card shows the size before you tap, and that is the whole rule |
| Play Store or iOS | Already out in `PLAN-android.md` |
| Desktop releases or changes to `build.yml` | A9; the desktop updater is unchanged |
| Building or signing in CI | The keystore must never leave this machine (A3, A7) |
| Deriving `versionCode` from the git commit count | One number per release, set by the version, is enough and is what Tauri already does |
| A background download while the card is closed | Needs a foreground service and a permanent notification; `PLAN-android.md` already ruled that out |

## Status, 2026-09-30 (later the same day): B0–B5 and B7 built and run; **B6 has not been run and needs the phone**

The paragraphs above are left as written.

**Built.** `js/androidupdate.js` (the check, the five states, the daily gate, install polling), an "Android app" card in *Settings → Reminders & devices* with `desktopCard()` re-gated on `!window.WHNative` (A2), `Updater.kt` plus seven bridge methods in `MainActivity.kt`, `REQUEST_INSTALL_PACKAGES` in the manifest, `tools/release-android.sh`, `tools/check-androidupdate.js`, the README's Android sections, and a service-worker precache entry (`v39` → `v40`).

**Departures from the plan.**

| # | What | Why |
|---|---|---|
| 1 | `release-android.sh` **edits nothing**; it refuses unless `tauri.conf.json` and `Cargo.toml` already hold the version, tracked files are committed, and `HEAD` is on `origin` | A script that bumped the files itself builds a tree the tag does not point at; refusing needs no restore-after-dry-run logic |
| 2 | It builds **arm64 only** by default (`TARGETS="aarch64 armv7"` overrides) | The default `cargo tauri android build --apk` builds four ABIs: 40.7 MB against 13.05 MB (12.4 MB), and every update is a full download. The September APK was 12.97 MB, which is one arm64 library, so it was arm64-only. The build fell from about 15 minutes to 88 seconds. **The M13's ABI has not been read over `adb`** (`getprop ro.product.cpu.abilist`) |
| 3 | A `reshow()` bridge method and a "Show the installer again" button | Android can refuse to open the confirmation screen from the background, silently; relaunching it from `onResume` would reopen a dialog you just cancelled |
| 4 | The download's status is set by `Updater.start()` before it returns | Found while testing: a status that lags the call reads as "idle", which is terminal, and stops the polling |

**Verified by running.**
- **`node tools/check-androidupdate.js`: 17 of 17.** It caught a real bug in my first version: `pickRelease` compared against `best.code`, which does not exist, so it kept whichever release it saw first.
- **Kotlin compiles**, the APK is signed, and `aapt2` reports `versionCode 1000000` against the expected `1000000`. Dry run of `release-android.sh 1.0.0`: 13,051,546 bytes, `arm64-v8a` only, and it lists exactly the two refusals that were true (uncommitted changes, `HEAD` not on `origin`). Its argument refusals (bad version, component ≥ 1000, unknown flag) fire without building.
- **The card, with the bridge and GitHub mocked (41 of 41 in one end-to-end run, 239 s):** which card shows where (Android, desktop, plain browser); every check state including offline-after-a-good-check keeping the last good result, the rate limit, an unusable release and a downgrade; the install flow, the permission state and a refusal; the daily check (announced once, off means nothing is requested, not hammered when offline, never touches the network off Android); and seven states on both palettes at 390 and 1440px, text at or above 4.5:1 with no overflow.

**Found and fixed on the way (not part of this feature).** The restyle committed earlier had a real contrast defect nothing had driven: a primary button's fill was lightened toward `fg0` on hover, which *lowered* a white label to **4.31:1 on arasaka and 4.37:1 on andromeda** (measured on the committed tree, same script, then 0 after). The generator now emits `--wh-accent-hover`, moving the fill away from its label, and refuses any palette where the hovered label is under 4.5:1. The danger button's hover wash went from 12% to 10% (Selene Day measured 4.44:1 at 12%). The suite gained a real hover check per palette. Both changes touch files in the restyle commit and are uncommitted.

**Not verified — all of it needs the phone.** The download, the SHA-256 check on a real 12 MB file, `PackageInstaller`, the "Install unknown apps" flow, the confirmation dialog, `reshow()`, whether the app really cannot reopen itself (A5), that **`wellnessHub.v1` survives an update byte for byte (A4)** — which is why the card does not say "your data stays" — that A2 is really what the phone shows, and `api.github.com` from the WebView's own origin (checked by `curl` with an `Origin` header only). `--publish` has never been run, so its read-back of the uploaded asset is untested. B6 also needs two published versions: the first installed with `adb install -r`, the second through the card.

