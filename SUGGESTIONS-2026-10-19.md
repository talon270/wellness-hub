# Wellness Hub — suggestions

Written 2026-10-19, against branch `android` at `cfa7908` plus 82 uncommitted
changes (the neumorphic and fitness work in progress).
Method: headless Chromium on `file://` with the welcome dialog dismissed,
light and dark, at 390, 1440 and 1920 px, with 16 nav clicks. An
unreadable-data probe on both stores (`wellnessHub.v1`, and BASALT's
`ironframe.state.v1` by reading). A two-tab probe with real Log water taps. A
fake-clock check at 01:00 IST. The service worker's cleanup was read and run
on one local origin next to `vis`. `TODO.md` and
`FITNESS-ALGORITHM-REVIEW-HANDOFF.md` were read so as not to repeat them.

**Three fixes applied in this pass (A1, A2, A4). Everything else is a
suggestion and is not implemented.** Backups:
`js/core.backup-20261019-085715.js` and
`fitness/basalt.backup-20261019-090323.js`. `CACHE_VERSION` is bumped
`v97 → v98`, as the worker's header asks for any precached change.
`src-tauri/dist/` was **not** refreshed. The desktop app gets these when you
next press Update or run `tools/sync-deploy.sh`.

## Result

Zero page errors and console errors, both themes, all three widths. No
sideways scroll at 390 px. The worker already deletes only `wellness-hub-*`
caches, so Helth was a victim of the other apps' cache wipes (fixed in their
folders), not a cause. BASALT's store already handles an unreadable save
properly: the copy is kept, the store opens read-only, and a banner shows.

## Part A — findings, ranked

### A1 · BUG (high): unreadable Hub data was overwritten as the app loaded — FIXED

`core.js` `load()` caught a parse error with `console.warn(...)` and
`defaultState()`, and boot saves straight away. So months of health history
were replaced by a fresh profile before you could do anything, and the only
trace was a console line.

| | `wellnessHub.v1` original kept | Message |
|---|---|---|
| Before | **no**, overwritten during boot | console only |
| After | yes, `wellnessHub.v1.unreadable-YYYYMMDD-HHMMSS` (identical copies reused) | danger toast naming the key |

**Fix (applied):** BASALT's `keepUnreadable()` scheme, ported into the catch,
without BASALT's read-only lock: the Hub stays usable. That is 24 lines.

### A2 · BUG (high): a second open tab erased logs from the first — FIXED

No `storage` listener existed for the Hub store. Reproduced with two tabs on
the dashboard: A taps Log water twice, then the stale tab B taps it once.

| | Water stored for today (correct: 3) |
|---|---|
| Before | **1** |
| After | 3 |

**Fix (applied):** a `storage` listener after `save()` adopts the other tab's
copy through `migrate()`. It reseeds the sync index from it, so this tab's
next save doesn't stamp those records as its own edits, then calls `refresh()`
and `updateChrome()`. 12 lines.

### A3 · DESIGN RISK (medium, unconfirmed here): BASALT's store has the same two-tab gap

`ironframe.state.v1` has no `storage` listener either, and `saveState()`
writes the whole object. **Suggested fix:** `load()` then `refresh()` on
`storage` for that key. `load()` already handles unreadable and newer-version
saves. Not applied: BASALT keeps mid-workout state, and re-rendering the live
session view while you're typing reps could drop the entry. Decide whether to
skip the repaint while a session is active.

### A4 · COSMETIC (low): fitness backups exported before 05:30 were named for the day before — FIXED

`exportData()` stamped the filename with `toISOString().slice(0, 10)`, which
is UTC. On a fake clock at 01:00 IST on 20 Oct, that gives `2026-10-19`, and
`Hub.today()` gives `2026-10-20`. **Fix (applied):** `Hub.today()`, with the
old expression as a fallback if BASALT ever runs without the Hub.

## Out of scope

- Everything in `TODO.md`: device runs, the Android release, desktop
  Relaunch. Those need the phone or you.
- The fitness algorithm itself: `FITNESS-ALGORITHM-REVIEW-HANDOFF.md` is set
  up for its own review.

## Check log

- Earlier today (before this pass's edits): the 8 `tools/check-*.js` checks
  all passed, `check-workout.py` passed 106 of 106 cases and
  `check-weekly-workouts.py` passed 9 of 9. The re-run after the edits is in
  the final cross-app test run, appended below when it finishes.
