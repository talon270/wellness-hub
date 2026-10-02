# Google Drive sync — plan

Written 2026-08-26, against `js/storage.js` (sync object built around
`window.Sync.create`, `SCHEMA_VERSION = 4`), `js/syncmerge.js`, `vendor/sync.js`,
and `js/views/settings.js`'s `durabilityCard()`.

Method: interviewed by `/grilling` — three rounds, seven questions, answers
below. Cross-checked against `Hub/PLAN-sync-and-hub.md` and
`Hub/HOW-SYNC-WORKS.md` (the Syncthing folder-sync system this sits beside,
phase two shipped 2026-08-26) and `README.md` (confirms the app is already
routinely served at `http://localhost:<port>` via `tools/install-service.sh`
for notifications — the same origin this design needs for OAuth).

**Nothing below is implemented — this is the plan.**

---

## What was decided in the interview

| Question | Answer |
|---|---|
| Relationship to the Syncthing plan | Additive. Syncthing sync stays exactly as built; Drive is a second, independent transport |
| Phone/tablet access | Not required — desktop only, same three machines |
| Scope | Helth only. Docket and the Hub are untouched |
| Motivation | Don't want a background daemon running on all three machines — Arch has no official Google Drive Desktop client, so the "point the folder-picker at a Drive-mirrored folder" route would trade Syncthing for `rclone mount`, which is the same category of thing |
| Mechanism | Real Google Drive REST API sync — OAuth in the browser, no daemon anywhere |
| Coexistence | One transport per machine: folder-link or Drive-link, never both at once |
| Where the file lives in Drive | A real, visible folder (`Helth Sync/wellness-hub.json`) using the `drive.file` scope — not the hidden `appDataFolder`. Matches the house rule that a user's data must be findable and extractable without the app |

---

## What this reuses unchanged

`js/syncmerge.js`'s `mergePayload()` doesn't know or care what moved the bytes —
it takes two payloads and returns one. Nothing in it changes. `SCHEMA_VERSION`
stays at 4; Drive carries the exact same payload shape the local sync file
already uses (`storage.js`'s `fullPayload()`), so there is no migration.

`js/storage.js` currently owns exactly one `sync` object (`window.Sync.create`,
storage.js:275). It becomes a small dispatcher over **whichever transport is
currently connected** — folder or Drive — so every call site
(`writeNow`, `init`, `link`, `unlink`, `ensurePermission`) keeps working
whichever one is active, and the two transports stay mutually exclusive by
construction rather than by a UI convention that could be bypassed.

---

## Part A — design decisions that need stating explicitly

### A1 · New house-rule exception: an external script, and a Google account

Every other app here runs with no CDN and no account. Google Identity Services
(the token client that gets an OAuth access token without a client secret) is
only available as a live script from `accounts.google.com/gsi/client` — it
cannot be vendored, because it's an auth flow tied to Google's own session
state, not a static library. Loading it is a deliberate, named exception, the
same category as Study Tracker's Supabase break
(`Hub/HOW-SYNC-WORKS.md § Why not just use a server`).

**Consequence stated plainly:** the first time each machine connects Drive,
Google shows an **"unverified app"** interstitial (`Advanced → Go to Helth
Wellness Hub (unsafe)`), because getting an OAuth client through Google's
review process is disproportionate for a single-user tool. The OAuth client is
configured in "Testing" mode with your own Google account as the only test
user — this is permanent, not a bug to fix later.

### A2 · Access tokens expire; the reconnect UX already has the shape for this

GIS's token client issues access tokens valid for roughly one hour, with no
refresh token available to pure client-side code. On expiry, the first attempt
is a **silent reauth** (`prompt: ''`) — invisible if the browser still holds an
active Google session, which it normally will. If that fails (session
genuinely logged out, third-party storage blocked), the same
"permission dropped, click Reconnect" pattern `settings.js:763–767` already
uses for a lapsed folder grant applies here, word-for-word in shape if not in
label.

### A3 · Drive has one mutable file; Syncthing's safety net doesn't carry over

Syncthing's answer to two machines writing at once is to keep **both** files
and rename one — nothing is ever silently lost, and the Hub is what surfaces
the collision. Drive's API updates a single file in place; there is no
built-in "reject this write if the file changed since I read it."

Naively doing read → merge → write reintroduces the exact failure
`Hub/PLAN-sync-and-hub.md` §A2 already named and fixed once (Helth's file used
to be a one-way backup: whichever machine wrote second won outright). The fix
here is the same shape, done with what Drive's API actually offers:

**Fix:** before writing, re-fetch the file's `headRevisionId`. If it matches
what was read at the start of this merge cycle, write. If it does not — another
machine wrote in the gap — redo the read-merge-write cycle against the new
version instead of overwriting it blindly. Bounded to 3 retries, then a toast
("Couldn't sync — another device is writing at the same time, try again in a
moment") rather than a silent loss. The rolling backups (A4) are the recovery
path if this is ever wrong in practice.

### A4 · Rolling backups, same shape as the folder transport

`Helth Sync/backups/` inside the Drive folder, same naming
(`helth.backup-<millisecond-timestamp>.json`), same cap (10) and same 5-minute
minimum spacing as `vendor/sync.js`'s `BACKUP_KEEP` / `BACKUP_MIN_INTERVAL_MS`.
Reasoning identical to the original: ten snapshots taken inside one burst of
edits are ten copies of the same minute, not ten different recovery points.

### A5 · Duplicate-file race on first connect

Two machines connecting Drive for the first time within the same window could
each create their own `wellness-hub.json`, since Drive doesn't enforce unique
names in a folder. **Fix:** `connect()` always searches
(`files.list` with `q: name='wellness-hub.json' and 'FOLDER_ID' in parents`)
before creating, and only creates when the search returns nothing.

---

## Part B — the build

### B1 · `js/syncdrive.js`

New file, same public shape as `window.Sync.create(...)`'s return value so
`storage.js` can hold either behind one interface:

```
connect(opts)   // OAuth popup, folder+file lookup-or-create, first write
forget()        // drop the stored token + file id, revoke if possible
reconnect()     // silent reauth, falls back to a visible prompt
init(getPayload)      // startup read → merge → write
watch(getPayload, onMerged, isBusy)   // visibilitychange/focus re-check
hasFile()
deviceId()      // same generation/storage as vendor/sync.js — one id, shared
                // between whichever transport is active, so the Hub's later
                // "written by mac" reading (if Docket/Hub ever add Drive) is
                // consistent
status()        // { connected, fileName, lastWrite, lastError, account }
```

Internally: GIS token client for auth, `fetch()` against
`www.googleapis.com/drive/v3/files` and `www.googleapis.com/upload/drive/v3/files`
for the folder/file/content operations, the revision-check from A3 around every
write, the backup rotation from A4 on the same cadence as writes.

### B2 · `js/storage.js` — the transport dispatcher

Replace the single module-level `sync` object with a small `activeSync()`
resolver reading which transport is currently connected (persisted choice, not
re-derived every call). `link()` / `unlink()` / `linkDrive()` / `unlinkDrive()`
become the four entry points; connecting one while the other is active unlinks
the first with an inline explanation, never silently.

### B3 · `js/views/settings.js` — the connect UI

`durabilityCard()`'s `linkBlock` becomes two independent blocks side by side —
"Linked folder" and "Google Drive" — each rendering its own connected /
disconnected / needs-reconnect state using the existing pattern
(`settings.js:753–781`). Connecting either while the other is live shows the
swap explanation from B2 before the OAuth popup opens, not after.

### B4 · Service worker

No caching of `accounts.google.com` or `www.googleapis.com` — those are live,
cross-origin, and opaque to the service worker anyway. Confirm
`service-worker.js`'s fetch handler doesn't accidentally intercept them (it
currently scopes to same-origin requests; this is a check, not expected to need
a change).

### B5 · One-time setup — yours to do, cannot be done from here

A Google Cloud Console project, an OAuth 2.0 Client ID (Web application),
authorized JavaScript origins added for each machine's
`http://localhost:<port>` (from `tools/install-service.sh`) and the GitHub
Pages deploy origin if you ever connect Drive from the hosted copy, and your
own Google account added as a test user. I'll write the exact console steps
into `README.md` once B1–B3 are built and there's a real client ID to point at.

---

## Verification plan

Per the standing checklist, plus what's specific to this feature:

| Check | How |
|---|---|
| Connect flow | Real OAuth popup (not `page.evaluate`), folder+file created, confirm via Drive API directly (not just app state) that exactly one file exists |
| Two machines connecting simultaneously | A5's search-before-create — two profiles connecting inside the same few seconds, assert one file, not two |
| Concurrent write | A3's revision check — two profiles editing different days, both flush within the token-refresh window, assert both edits present and no retry-exhaustion toast |
| Token expiry | Force an expired token, assert silent reauth succeeds when a Google session exists, assert the Reconnect banner appears when it doesn't |
| Folder/Drive mutual exclusion | Connect folder, then connect Drive on the same profile, assert folder is unlinked with the inline explanation shown, not silently |
| Backups | Ten mutations, assert `backups/` in Drive holds one file, spaced, capped at 10 over many bursts |
| Offline | Disconnect network, confirm the app still reads/writes localStorage normally and shows a plain "can't reach Drive right now" status, not a blank state or a thrown error |
| Both themes | Settings' two connect blocks, light and dark |
| Zero console errors | Fresh profile, profile with an active Drive link |
| No `alert()` / `confirm()` | Grep the diff |
| Nothing personal committed | No OAuth client secret in any file — GIS's browser flow needs none; confirm `js/syncdrive.js` has no embedded credential beyond the public client ID, which is not a secret |

---

## Out of scope

- **Docket and the Hub.** Explicitly Helth-only per the interview. If Docket
  wants Drive later, `js/syncdrive.js`'s shape (matching `window.Sync`) is what
  makes vendoring it a follow-up rather than a rewrite — but that is a future
  decision, not this one.
- **Phones.** Not requested. Note for later: unlike the folder transport, the
  Drive REST API itself works fine from a mobile browser — the blocker would
  only be building a mobile-appropriate connect UI, not the transport. Worth
  remembering if the phone answer ever changes.
- **`appDataFolder`.** Rejected in the interview in favor of a visible,
  user-browsable folder.
- **Migrating Syncthing users to Drive, or vice versa.** The two transports are
  independent; nothing here moves data from one to the other automatically.
- **Google's app verification process.** The unverified-app interstitial is
  accepted as permanent (A1), not queued as a follow-up.
