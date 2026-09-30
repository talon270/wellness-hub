# Wellness Hub — what is left to do

Written 2026-09-30, after commits `671d4c3` (Relaunch fix), `8a4ce7c` (neumorphic restyle), `93bb0c9` (hover contrast fix) and `38bf95d` (Android updater). Branch `android` is ahead of `origin/android` by those four commits and the one that adds this file; **nothing has been pushed** (`git status -sb` shows the current count).

**Everything below is unfinished.** The Android updater and the desktop fixes were verified in a browser and by compiling, not on a device or in the installed app, so most of this list is "run it for real". Each row says who can do it and what blocks it. Nothing is ranked by effort; it is ordered by what stops the updater from being usable.

## A · The Android updater — needs the phone and you

Steps A2–A5 are B6 of `PLAN-android-updater.md`. They have to run in this order.

| # | What | Who · blocked by | Done when |
|---|---|---|---|
| A1 | Read the M13's ABI: `adb shell getprop ro.product.cpu.abilist`. The release script builds **arm64 only** (12.4 MB); a phone without arm64 needs `TARGETS="aarch64 armv7"` | You + the M13 · a paired phone | The value is written here, and the script default is kept or changed to match |
| A2 | Cut the first release. Set `version` to `1.0.1` in `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`, commit, **push** (the script refuses an unpushed `HEAD`), then `sh tools/release-android.sh 1.0.1`, and only then `--publish` | You · your call to publish: the release is **public** | `gh release view android-v1.0.1` shows one `.apk` and a `sha256:` line |
| A3 | Install that build once: `adb install -r` on the 2a. An updater cannot install itself | You + the 2a · wireless debugging switched on again | The app opens as 1.0.1 (build 1000001) in Settings → Android app |
| A4 | Publish `1.0.2` the same way, then update **through the card**. On the phone: allow *Install unknown apps* for Wellness Hub, tap **Update** on Android's dialog, tap **Open** | You + the 2a · A3 | The card reads 1.0.2 and says up to date, with a time |
| A5 | Compare `wellnessHub.v1` before and after that update, byte for byte (`PLAN-android-updater.md` A4) | You + me · A4 | The bytes match. **Only then** add "your data stays" to the card; it is deliberately absent now |
| A6 | On the device, confirm what was reasoned but never seen: that Settings really showed the desktop "Rebuilds this window" card before this change (A2); that the app cannot reopen itself after installing (A5); that locking the phone mid-download and returning shows the "Show the installer again" button, and that it works; that `api.github.com` answers from the WebView's own origin (checked with `curl` and an `Origin` header only) | You + the 2a · A4 | Each is written down as seen or not seen |
| A7 | `--publish` has never run, so its read-back ("the asset GitHub serves has the same SHA-256") is untested | You · A2 | The read-back line prints on the real publish, or the failure is quoted |
| A8 | Back up `~/.android-keys/` somewhere outside `SyncedWork`. Without that key, no build can replace an installed copy and the fallback is uninstall, which wipes the app's storage (`PLAN-android.md` A11) | **Only you** | You have said where the copy is |

## B · The desktop app — needs one real run

| # | What | Who · blocked by | Done when |
|---|---|---|---|
| B1 | Press **Update** in the desktop app once (it rebuilds with the restyle, the Relaunch fix and the updater files), then **quit from the tray and reopen**. The binary you are running still has the old `relaunch`, so the first Relaunch after this will do nothing | You | The app opens in Selene |
| B2 | Press Update once more and click **Relaunch now**. The fix was verified against a stand-in process and `cargo test` (4 of 4), never with a real click | You | The app closes and comes back once, and a failed relaunch shows a message in the card |
| B3 | Check whether the desktop shell's WebKitGTK has `document.startViewTransition`. If not, a palette switch is instant, which is correct, but it should be known | You + me | Yes or no, written down |

## C · The restyle — checked in Chromium only

| # | What | Done when |
|---|---|---|
| C1 | Open it on the phone (Android WebView). Frame rate of the press animation on a low-end phone: `box-shadow` repaints, and the fix if it drops frames is named in `PLAN-neumorphism.md` Part C | It was watched on the 2a and on the M13 |
| C2 | Drive hover on controls **other than the primary button**. Only that one is covered, and it was where a real defect was hiding | A real pointer over each control class, audited |
| C3 | The keyboard focus ring: verified in the CSS, not on screen | Screenshot with Tab focus on a button, an input and a switch |
| C4 | Print output | One printed (or PDF) page per view |
| C5 | Fitness with real training history; only fresh onboarding data was used | Reviewed with a populated profile |
| C6 | How the motion feels. That needs a person, at 2–5× duration, and again the next day | You have said it is right or what is wrong |

## D · Your decisions

| # | Question | Default if you say nothing |
|---|---|---|
| D1 | Delete `vendor/inter/` (56 KB)? Nothing loads it since the Ochre palettes were retired | Kept |
| D2 | The **72 untracked `.backup-*` files** show in every `git status`. Leave them, add a `.gitignore` line, or prune the old ones? | Left alone |
| D3 | Palette limits, all stated in the README: five accents sit near danger red (akira, andromeda, arasaka, basalt, quasar); three are green like "done" (borealis, chernobyl, nostromo); Selene's own primary button is a pale fill. Accept or tune? | Accepted |
| D4 | Push `android` and merge to `main`? `release-android.sh` needs `HEAD` on `origin` | Not pushed |
| D5 | A12 in `PLAN-android.md`: a timer that ends while the app is dead is logged at the next open, with that moment's time. Its own small plan? | Not started |

## E · Small clean-ups

| # | What |
|---|---|
| E1 | `.claude/agents/android-js.md` line 20 still says colours are defined "in `css/themes.css`", which is deleted. It should point at `css/palettes.css` (generated by `tools/build-palettes.py`). `android-mech` should also be told that a `*.backup-*.kt` inside `gen/android/app/src/` breaks the build |
| E2 | `PLAN-android.md` B11 asked for "things most apps get wrong" entries for A1, A2 (the countdown running past zero), A4 (double delivery) and A6 (the 24h horizon). The README has the updater's entries, not those four |
| E3 | At 390px the active *More* item in the bottom bar reads "Setun" (the label is clipped). Seen in the card screenshots; **not checked whether it predates the restyle** |
| E4 | The Android card's opening paragraph runs to about eight lines at 390px. It carries the source, the signature rule and the confirmation step, so it is long on purpose; folding it into a `<details>` is a design call |

## F · Still open from `PLAN-android.md`

Copied from its last status, **not re-checked today**: "the 4a, the M13, B8, B10 and B11 are still open". That is the Nothing Phone (4a) and the Galaxy M13, B8 (the verification sweep against B5–B7), B10 (retiring the PWA on each phone, after signing in to Supabase) and B11 (the README entries, of which only part is written: see E2).
