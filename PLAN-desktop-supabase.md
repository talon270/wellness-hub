# Wellness Hub as a desktop app with Supabase sync — plan

Written 2026-09-10, against `index.html`, `js/storage.js`, `vendor/sync.js`,
`js/syncdrive.js` as of the working tree of this date.
Method: line-level re-read of the sync stack (`vendor/sync.js`,
`js/syncdrive.js`, `js/storage.js`), plus the notification path in `js/core.js`
(`setInterval` tick at line ~1847, `new Notification` / `reg.showNotification`
at ~1557-1606). Transport contract and selector confirmed from source, not
assumed.
**Nothing below is implemented — this is the plan.**

---

## Phase 0 — shape

1. **Who opens this and when?** You, every day, on a Windows PC and an Arch PC —
   and the same data on your phone, which keeps running the existing PWA. Daily
   use, so onboarding matters once (first sign-in + first data import) and speed
   matters every day after.
2. **What must it never get wrong?** Two things, ranked. It must never leak your
   health data (the anon key ships inside the `.exe`; Row Level Security is the
   only thing standing between it and a stranger). And it must never lose logged
   history to a bad merge across devices — the same guarantee the folder/Drive
   transports already hold, reused unchanged.
3. **Honest confidence of its central number?** Not a numeric app here — the
   "central claim" is *this device is in sync*. It ships with a visible
   last-synced indicator and a reconnecting state, never a silent green.
4. **What does it do when the data source dies?** Supabase free tier sleeps
   after ~7 days idle and can throttle. The app stays fully usable offline
   (`localStorage` is canonical); only sync degrades, and it degrades **visibly**
   — "last synced 3 days ago", not a lie of freshness.

---

## The frame

**The app is not being ported — it is being wrapped in a real native binary and
given a third sync transport.** Your 13 MB of HTML/CSS/JS ships as-is. Two
things get built around it:

- **A Tauri v2 desktop shell** → `wellness-hub.exe` on Windows (uses WebView2,
  already part of Win10/11), an AppImage/binary on Arch (uses system WebKitGTK).
  A few MB each, no bundled browser. This is a genuine `.exe`, not the Electron
  blob you rejected.
- **`js/syncsupabase.js`** → `window.SyncSupabase.create(opts)`, a third
  transport with the *identical* contract to `SyncDrive.create` /
  `Sync.create` (same `merge`, `serialize`, `onStatus`, `onRemoteChange`; same
  `connect` / `save` / `refresh` / `init` surface). It plugs into
  `js/storage.js` beside `folderSync` and `driveSync`. `syncmerge.js` is
  reused untouched.

Everything the folder and Drive transports do — read-merge-write, stamped with
`deviceId` + `writtenAt`, rolling backups, refresh-on-focus, bounded
revision-race retry — the Supabase transport does the same way, against a
Postgres row instead of a file.

---

## Part A — findings and design risks, ranked

Each names the exact code it touches and the smallest correct guard.

### A1 · DESIGN RISK (high): the anon key ships inside a distributed `.exe`
The Supabase URL and anon key are embedded in the client, exactly like
`DRIVE_CLIENT_ID` at `js/syncdrive.js:39`. That is normal and safe **only** if
Row Level Security is on — the anon key is public by design. Get RLS wrong and
your health log is readable by anyone holding a key that ships in every copy of
the binary.
**Concrete failure:** RLS policy written as `USING (true)` instead of
`USING (user_id = auth.uid())` → a second Supabase account reads your row.
**Fix (this is the Phase-0-Q2 guard, built first, not last):** one table, RLS
`user_id = auth.uid()` on select/insert/update, and a verification step that
signs in as a *second* account and confirms it reads zero rows of yours. No
transport code lands until that test passes.

### A2 · DESIGN RISK (high): a fully-quit `.exe` cannot send a reminder
Reminders fire from an in-page `setInterval` tick (`js/core.js:~1847`) calling
`new Notification` / `reg.showNotification`. That only runs while the webview is
alive. There is no push server, by design (your "no backend" rule), so a closed
app is silent — same as a closed desktop PWA today.
**Fix:** the shell is **tray-resident** — closing the window minimizes to the
system tray, the webview stays alive, the existing scheduler keeps ticking, and
notifications route through Tauri's native notification plugin (real OS toasts).
**Stated ceiling:** if you fully *quit* the app from the tray, reminders stop
until you reopen it. Making reminders survive a full quit needs an OS-level
scheduled task or a push server — both out of scope, named here so it is a
documented contract, not a surprise. `<!-- ponytail: tray-alive scheduler;
OS-level scheduling only if "notify while quit" is ever actually wanted -->`

### A3 · DESIGN RISK (medium): free-tier pause makes the first sync after a gap fail
After ~7 days idle the project pauses; the first request cold-starts with a
delay or a transient error.
**Fix:** the sync-status indicator (reused from the folder/Drive status surface
in `storage.js` `snapshot()`, lines ~712-720) shows `reconnecting` and a
`last synced` time. A failed sync never overwrites local and never claims
success — the same contract `readFile()`'s parse-error handling already enforces
in `vendor/sync.js:275`.

### A4 · INCONSISTENCY (medium): Supabase deviates from "offline forever, no accounts"
The app's stated ethos is no backend, no accounts. Supabase adds both.
**This is your deliberate choice, recorded, not a defect** — and it is contained:
Supabase is *sync only*. `localStorage` stays canonical, the app opens and works
with the network unplugged and the account signed out. The deviation is one
login and one cloud row, not a rewrite of where data lives. README section 5
(assumed-vs-solid) states it plainly.

### A5 · DESIGN RISK (medium): two devices writing at once
Same race the Drive transport already solves. Drive re-checks the file revision
and does a bounded read-merge-write retry (`WRITE_RETRY_LIMIT = 3`,
`js/syncdrive.js:49`).
**Fix:** the row carries `written_at` (and a `rev bigint`); a write that finds
the row changed since it read re-pulls, re-merges via `syncmerge.js`, and retries
up to 3 times. Postgres does the compare-and-set with a `WHERE rev = $expected`
guard, so the loser of a race merges instead of clobbering.

### A6 · MODEL GAP (low): the exe starts with empty storage
A fresh Tauri origin (`tauri://localhost`) has empty `localStorage` — your
months of history are in your browser's origin, not the exe's.
**Fix:** first run imports your existing backup JSON via the Settings
backup/restore that already exists. One import, once per new device, then
Supabase keeps it current. Named in onboarding so it is not a "where's my data"
panic.

### A7 · NOISE (low): the transport count goes two → three
`storage.js` enforces one active transport at a time via the swap logic in
`link()` / `linkDrive()` (lines ~328, ~367). Adding `supabase` to
`TRANSPORT_KEY` (`"folder" | "drive"` at line 299) and an equivalent
`linkSupabase()` must keep that mutual exclusion. Small, mechanical, but it is
where a careless edit would let two transports fight.

---

## Part B — the build (vertical slices, each shippable and run before the next)

### B1 · Supabase schema + RLS (the A1 guard, first)
One table `wellness_state`: `user_id uuid` (PK, = `auth.uid()`), `doc jsonb`,
`device_id text`, `written_at timestamptz`, `rev bigint`. RLS
`user_id = auth.uid()` on select/insert/update. Optional `wellness_backups`
table (capped rows) mirroring the transports' rolling backups.
**Verify:** sign in as a second account, confirm zero rows of yours are
readable. Quote the result. No further code until this passes.

### B2 · `js/syncsupabase.js` — the transport
`window.SyncSupabase.create(opts)`, contract-identical to `SyncDrive`. **Raw
REST via `fetch`, no `supabase-js` dependency** — the Drive transport proves raw
REST works, and it keeps the no-npm/no-CDN rule. Auth: Supabase
`/auth/v1/token` (email+password → JWT), token cached by the client, refreshed
via the refresh-token endpoint. Reads/writes `wellness_state` through PostgREST
with `apikey` + `Authorization: Bearer`. Read-merge-write with the A5 retry,
refresh-on-focus reusing the `watch()` pattern. Wire into `storage.js`:
`supabaseSync = window.SyncSupabase.create({...})`, extend `activeSync()`, add
`linkSupabase()`, add a `supabase` card to `snapshot()`.
**Verify:** two profiles (or the exe + the PWA) converge on the same state after
a cross-write, with a running timer *not* synced (proves `syncmerge.js` still
governs).
`<!-- ponytail: raw fetch, no supabase-js; add the SDK only if realtime push
beats refresh-on-focus, which for a daily-use tracker it does not -->`

### B3 · Tauri v2 shell
`frontendDist` points at this folder — **no build step for the app itself**,
only the Rust shell compiles (on my side, once per release). Tray-resident,
close-to-tray, `tauri-plugin-notification`. A tiny bridge: `Hub`'s notification
call feature-detects `window.__TAURI__` and routes to the native plugin in the
exe, falling back to web `Notification` in the browser/PWA — the whole existing
reminder engine is reused, only the final "show" call branches.
**Verify:** launch the exe, minimize to tray, confirm a scheduled reminder fires
as a native OS toast with the window hidden. Both platforms.

### B4 · Build artifacts
`wellness-hub.exe` (Windows, WebView2) and an AppImage/binary (Arch, WebKitGTK).
**Verify:** clean launch, zero console errors, seeded profile survives, both
themes — the standing Gate-2 checklist, run on each artifact.

### B5 · First-run + Settings
Settings gets a Supabase card (sign in / sign out, last-synced, device name) and
a first-run prompt to import a backup JSON (A6).
**Verify:** import a real backup, confirm history appears, confirm sync then
carries it to the second device.

---

## Prerequisites (you provide, before B1)
- A Supabase project (free tier) — its URL and anon key.
- One account you will sign in with on each device.
- Confirmation you want tray-resident behaviour (close = minimize to tray). If
  you would rather close = quit, say so and A2's contract changes (reminders
  only while the window is open).

---

## Out of scope (so the plan stays finishable)
- **Realtime websocket push.** Refresh-on-focus + optional interval poll, same as
  the existing transports. Add `supabase-js` realtime later only if wanted.
- **Multi-user / sharing.** One account, your own devices.
- **Packaging the phone as a native app.** The phone keeps the PWA and syncs
  through the same Supabase project — no mobile build.
- **Rewriting the folder or Drive transports.** Kept exactly as they are;
  Supabase is purely additive.
- **Auto-update for the exe.** Manual re-download per release for now.
- **Reminders that fire while the app is fully quit.** Needs OS scheduling or a
  push server (A2 ceiling).
