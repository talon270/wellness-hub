# Yellow Dude catalogue — progress log

One entry per window, appended in order. The plan is `plans/PLAN-yellow-dude.md`.

## 2026-10-06 · W1 · step 1.1 pure rules

**Where.** Branch `yellow-dude`, created from `fitness-plan` at `b0bae7a`. Opus 5.5, in the same session that wrote the plan, after you approved Stage 1 with the defaults. Nothing committed.

**Files.** Backups are `*.backup-20261006-155943.*` beside each file over 200 lines.
- `fitness/training.data.js`:
  - `REP_RANGES = {}`, with its comment. `rangeFor` reads it first, for `reps` and `unilateral` only, ahead of the coverage and goal ranges. Exported on `TRAINING_DATA`.
  - `rangeFor` puts `timed: true` on a hold's output when the record has it. The `x()` comment documents the flag.
  - `LOAD_STEP_KG` gains `vest: 2.5` and `barbell: 5`, with the reason in the comment.
- `fitness/coverage.js`: `pick` takes a `conditioning: true` slot only when it's pinned for today, as a row with `group: null`, `shortfall: 0` and the reason "Pinned for Wed — conditioning, not counted against any one muscle". The header says so. The workout builder reads only `slot`, `rx` and `reason` from a pick (`basalt.js:2902-2907`), so the null group is safe there.
- `tools/check-training-data.js` (section 4): every `REP_RANGES` key must be a real `reps` or `unilateral` exercise with whole numbers, the bottom at least 1 and the top at least 2 above it. `timed` may only sit on a hold.
- `tools/check-training.js`: cases Y1-rep-range, Y2-timed and Y3-vest-barbell, on synthetic entries removed after each case, like K-hold. A header line.
- `tools/check-coverage.js`: case Y4-conditioning, on a synthetic slot removed after.
- `service-worker.js`: `CACHE_VERSION` v71 → v72 (two precached files changed).
- `plans/PLAN-yellow-dude.md`: records the approval, and the two moves below in steps 1.1, 1.2 and 2.4.

**Deviations from the plan.**
1. **The six equipment tokens move to W2.** `check-training-data.js:303` fails any token in `TOKENS` without an `EQUIP_LABEL` entry, and that map is UI in `basalt.js`, which is W2's. Naming them in the EQUIPMENT header before they exist would be wrong too. W2's step text now carries both.
2. **The real `conditioning` slot moves to W7, complete with its 13 exercises.** Program renders every coverage slot (`basalt.js:8300-8323`). An empty slot would show "Needs equipment you don't have" in your prescriptions from Stage 1's commit until W7, and its `trains.map` "covers" line would be blank. W1 proves the rule on a synthetic slot instead. W7's step text now names the checker exemption, the Program row, and `dip_6`'s entry in section 8's plan C5 table.

**Check lines.** Run by a test-runner agent. "Before" is `b0bae7a` (via `git archive`) with the three new check files copied in.

| Case | Before (`b0bae7a`) | After |
|---|---|---|
| Y1-rep-range | FAIL — pull_4 strength/size/none 6–12 / 8–15 / 6–12, coverage curl 10–15, eccentric pull_3 3–6; startOf 8–15 | PASS — pull_4 1–5 / 1–5 / 1–5, coverage curl 1–5, eccentric pull_3 3–6; startOf 1–5 |
| Y2-timed | FAIL — core_1 timed undefined, hold 30–60 | PASS — core_1 timed true, hold 30–60; core_2 timed absent; startOf 30–60 sec |
| Y3-vest-barbell | FAIL — vest 10 kg → null kg; barbell 10 kg → null kg | PASS — vest 10 kg → 12.5 kg; barbell 10 kg → 15 kg |
| Y4-conditioning | FAIL — threw: Cannot read properties of undefined (reading 'shortfall') | PASS — unpinned: not picked; pinned Mon: not picked; pinned Wed: picked first, group null |

**The new validation, against bad data.** This used a copy of the new tree with `REP_RANGES = { pull_3: [3, 6], push_2: [4, 5], nope_1: [1, 5] }` and `timed` on `push_2`. `check-training-data.js` exits 1 with all four:
- push_2: timed is only for a hold, not reps
- REP_RANGES: pull_3 is eccentric; only reps and unilateral take one
- REP_RANGES: push_2 is [4,5]
- REP_RANGES: nope_1 is not an exercise

| Check (final tree) | Result |
|---|---|
| `check-training.js` | all passed, exit 0 |
| `check-training-data.js` | OK, "0 REP_RANGES entries", exit 0 |
| `check-muscle-map.js` / `check-coverage.js` | OK / all passed |
| `check-syncmerge.js` / `check-androidupdate.js` | 9 pass, 0 fail / 17 passed, 0 failed |
| `check-exercise-content.js` / `check-bodymap.js` | all passed / all passed |

**Not run:** `check-workout.py`. Part F doesn't ask it of W1, and nothing W1 changed renders: `REP_RANGES` is empty and no record is `timed` or `conditioning` yet.

**Left for later windows.**
- W2: the six tokens (header, `TOKENS`, `EQUIP_LABEL`, default state, Settings, onboarding), then everything else in 1.2.
- W3: the `timed` labels. `rangeFor` carries the flag, and `TRAINING_DATA.EXERCISES[id].timed` is there for any label site that has only an id.
- W7: the real slot, the checker exemption for `trains: []`, and Program's conditioning row.

**Untracked:** the four `*.backup-20261006-155943.*` files, which the handoff's `git add` excludes.

## 2026-10-06 · W2 · step 1.2 schema v7 and equipment

**Where.** Branch `yellow-dude`, on top of W1's tree. Opus 5.5. Nothing committed.

**Files.** Backups are `*.backup-20261006-161220.*` beside each file over 200 lines (the seven below, plus `check-coverage.js`).
- `fitness/basalt.js`:
  - `SCHEMA_VERSION = 7`, with the comment. Six keys in `defaultState().equipment`, all `false`.
  - `toV7` in `migrate`, after `toV5`. It turns `nordicAnchor` on when a logged session performed `hinge_4/5/6` (a set above 0, not skipped) or a slot that is on holds one. These are v5's two sources, read in v5's order. The walk is `eachTrained`, extracted from `toV5` unchanged, so both migrations read history the same way. It needs no training.js, because it infers by id.
  - An onboarded save gets `equipmentCheck = { at, inferred, tokens }`. `tokens` is the six. A save from v4 or older runs `toV5` in the same load, so its tokens are v5's four plus the six, and its `inferred` keeps v5's. One card covers both upgrades.
  - The card lists `chk.tokens`, or v5's four when a record has none. It has its own per-device key, `v7.equipmentCheckSeen`, so a device that dismissed v5's card still sees v7's once. A second paragraph explains the six.
  - Labels added in `EQUIP_LABEL`, Settings (`EQUIP_META`) and setup (`EQUIP`). `nordicAnchor` reads **"ankle anchor"**: "Ankle anchor (Nordic curls)" in Settings, "An ankle anchor for Nordic curls" in setup, and "a strap, a partner or heavy furniture" on the card. `box` reads "Sturdy box" / "A sturdy box or step".
- `fitness/training.data.js`: the EQUIPMENT header names the six, says what each is, and says furniture is never a token.
- `tools/check-training-data.js`: the six are in `TOKENS`, and the header now says fifteen. The "used by an exercise" check still covers C5's four, as the plan says. The ok line now says what it checks: "all four used; all 15 tokens labelled".
- `tools/check-syncmerge.js`: case **Y5**.
- `tools/check-workout.py`: cases **Y6–Y8**, an optional `url` on `Session`, and updates to K9 and V5 (see Deviations).
- `tools/fixtures/v6-midworkout.json` (new). The b0bae7a build wrote it by real clicks. The profile is onboarded with a pull-up bar. Nordic Curl Negative went into the hinge slot through *Train this in my slot*. Curl is pinned to Saturdays and the finisher is on. It holds a finished Legs workout with `hinge_4` at 4 / 4 / 4 plus four finisher picks, a mini-session, and a Push workout begun but not finished. The capture script is in the session scratchpad. `_note` says all of this.
- `tools/check-training.js`, `tools/check-coverage.js`: the six added to the `ALL` / `NO_BAR` fixtures (Deviations 3).
- `service-worker.js`: `CACHE_VERSION` v72 → v73.

**Deviations from the plan.**
1. **`js/syncmerge.js` is unchanged.** `equipment` already merges key by key through `mergeFields`, with local winning. A v6 device has none of the six keys, so it takes the v7 device's six, plus version 7. Y5 confirms this, and it passes against b0bae7a's module too. It is a guard, not a fix.
2. **K9 and V5 changed what they compare.**
   - K9 runs v4 → v7 in one load, so its card now lists ten tokens (v5's four, then the six), all six off.
   - V5 no longer compares the whole `equipment` object, or `equipmentCheck`, with the v5 fixture. The v6 → v7 step changes both, and Y6 checks them. V5 now checks that v5's ten equipment keys are unchanged.
3. **`ALL` / `NO_BAR` in check-training.js and check-coverage.js gained the six.** Otherwise "every token owned" would quietly stop meaning that once W6 gives Nordic curls the anchor. Nothing uses the six yet, so no result changes.
4. **The round trip also differs in `meta.updatedAt`.** `saveState` stamps every save, so Y6 leaves that one field out by name. Everything else is compared as JSON text: sessions, slots, PRs, decisions, pins, tiers, streak, the rest of `meta`, and the mid-workout draft in `ironframe.ui`. Y6 found it identical: "differs in nothing, extra none".
5. **Y7 extracts b0bae7a with `git archive` when it runs.** Without git or that commit it ERRORs, which this harness counts as a harness defect, never as a bug.

**Check lines.** I ran the before/after for the browser cases. A test-runner agent ran the full suite and the Node before. "Before" is b0bae7a, through `git archive`.

| Case | Before (`b0bae7a`) | After |
|---|---|---|
| Y5 (Node) | PASS: same merge, no code change (Deviation 1) | PASS — B after: abWheel true, nordicAnchor true, other four false, own dumbbells/rings kept, v7; v7 pair: each keeps its own vest and anchor |
| `check-training-data.js` tokens | FAIL — "EQUIP_LABEL has no label for" each of vest, abWheel, jumpRope, box, barbell, nordicAnchor | ✓ 16 exercises carry plan C5's tokens, all four used; all 15 tokens labelled |
| Y6 | FAIL — version 6 on all three legs; anchor None; no card | PASS — as saved: anchor true, from session ("you logged Nordic Curl Negative"). Slot only: anchor true, from slot ("your hinge slot is Nordic Curl Negative"). No Nordic: anchor false, card shown with nothing ticked. Round trip identical; 2 sessions, 16 slots, 11 PRs; card gone after Looks right |
| Y7 | FAIL — "saved at v6 with vest None; key unchanged=False, banner=False" | PASS — "saved at v7 with vest True; opened by a v6 build: key unchanged=True, banner=True" |
| Y8 | FAIL — setup [], Settings [] | PASS — setup lists the six before "Just the floor", saves box and anchor; Settings shows those two pressed, saves vest on and anchor off |

The other Node checks gave the same "before" picture as W1: Y1–Y3 and Y4 fail on b0bae7a; muscle-map, exercise-content, bodymap and androidupdate pass there too.

| Check (final tree) | Result |
|---|---|
| `check-training.js` / `check-training-data.js` | all passed / OK |
| `check-muscle-map.js` / `check-coverage.js` | OK / all passed |
| `check-syncmerge.js` / `check-androidupdate.js` | 10 pass, 0 fail / 17 passed, 0 failed |
| `check-exercise-content.js` / `check-bodymap.js` | all passed / all passed |
| `python3 tools/check-workout.py` | **88 pass, 0 fail, 0 error** (K9, V5, Y6–Y8 included) |

**Screens.** I screenshotted the v7 card on Program at 390 and 1440 px, in selene and selene-day. Both themes read correctly, with 0 page errors and no horizontal scroll.

**Left over.**
- **COSMETIC (low), pre-existing:** the Era II "Available equipment" chips (`eraPanel`) print raw keys through `ui.cap(k)`. Today that gives "DipBars" and "LowBar"; a ticked vest or anchor will give "Vest" and "NordicAnchor". The fix is `EQUIP_LABEL`, which lives in a later block. Not touched — your call whether it's in scope.
- W3: the `timed` labels, as W1 left them.
- W6: `nordicAnchor` on `hinge_4/5/6`. From then on, `toV7`'s inference is what keeps a Nordic user's slot trainable.

**Untracked:** the eight `*.backup-20261006-161220.*` files, and `tools/fixtures/v6-midworkout.json`, which is meant to be committed.

## 2026-10-06 · W3 · step 1.3 labels, Before you start, batch D

**Where.** Branch `yellow-dude`, on top of W2's tree. Sonnet 5.5. Nothing committed.

**Files.** Backups are `*.backup-20261006-165040.*` beside each file over 200 lines (the seven below, plus `index.html`).
- `fitness/basalt.js`: `isTimed(id)` beside `TD()`, reading `EXERCISES[id].timed`. Where a record is timed, it prints:

| Site | Hold | Timed |
|---|---|---|
| Workout card range (`rangeText`) | 3 × 30–60 s | 3 sets for 30–60 s |
| Timer button | "Time this hold" / "Start hold timer" | "Time this set" / "Start set timer" |
| Countdown label, toast on done | "Hold · Plank", "Hold logged: 30s." | "Timed · Plank", "Set logged: 30s." |
| New-PR toast | "New hold PR" | "New longest-set PR" |
| Records rows (Progress, PR timeline) | "max hold" | "longest set" |
| Setup assessment bar (`assessBar`) | 30 s hold | for 30 s |
| Swap list, exercise guide mode line | timed hold | timed work |

- `fitness/directory.js`: `kindLabel(e)` ("Timed work") on list rows and page tags; `rxLine` ("3 sets for 30–60 s"); the Best line ("45 s hold" → "45 s, longest set"); and `prereq` rendered first on the page as **Before you start**, nothing when absent.
- `fitness/basalt.css`: `.dx-block + .dx-summary` gap. Without it the summary read as a second bullet under the prereq list (seen in a screenshot).
- `fitness/content/STYLE.md`: `prereq` row, a paragraph (no numbers, name a support by what it must do, required from step 3.5), a `batch-d.js` row.
- `tools/check-exercise-content.js`: `prereq` is a list of 1–3, optional, usual string rules plus no digits; `d: ["conditioning"]` in `BATCHES`; the "shipped" line counts batches instead of saying 4.
- `fitness/content/batch-d.js` (new): `B.d = "complete"`, no guides. It is complete because the slot has no exercises until W7, whose edit must flip it to `"pending"` with its first ID. In `index.html` and `PRECACHE`.
- `service-worker.js`: `CACHE_VERSION` v73 → v74.

**Deviations from the plan.**
1. **Wording is "for" where a range is printed, not on every history line.** A history line ("Last: 40 / 35 s", the directory's session list) never printed "hold", so there is nothing to replace; the plan's "history line" is covered by the PR rows, which did.
2. **The directory's kind filter still says "Timed hold".** Every rule treats the two alike, so one filter entry keeps timed work findable. Rows and pages say "Timed work".
3. **Not touched, because they aren't a record's range, target or PR:** Settings' "After holds (sec)" rest label; the Phases panel line "a hold has no rep cycle"; guide prose. The guide prose is the guide windows' to write.

**Check lines.** The timed record is a scratch copy of the tree with `if (kind === "hold") rec.timed = true` added to `x()` and a `prereq` on `core_1`'s guide. It never touched the tree. Both runs are real clicks through the check-workout.py `Session` helpers: onboard, begin, press the timer, log 45 s on the Plank, finish, open the page.

| Case | Before (pre-change `basalt.js`, `directory.js`, `basalt.css` in the same scratch tree) | After |
|---|---|---|
| Timer countdown label | HOLD · PLANK | TIMED · PLANK |
| PR toast | New hold PR · Plank: 45s | New longest-set PR · Plank: 45s |
| Progress record row | max hold · today | longest set · today |
| Directory Best line | Best: 45 s hold (6 Oct). | Best: 45 s, longest set (6 Oct). |
| Directory slot line | n/a (no timed wording) | Your Core slot trains this now: 3 sets for 30–60 s. |
| Workout card | n/a | Core · 3 sets for 30–60 s; button "Time this set" ×3 |
| Directory row / tag | Timed hold / Timed hold | Timed work / TIMED WORK |
| First block on the page | Set up | Before you start |

On the untouched tree (no timed record, no prereq) the page still says "Timed hold" and starts at Set up. Page errors: 0 in every run. Screenshot of the page in both themes (selene, selene-day) reads correctly; the new block uses existing `dx-` styles, so no colour was added.

`check-exercise-content.js` against a scratch content dir with a `prereq` on `core_1`: before (pre-change checker) FAIL — "core_1.prereq isn't a guide field"; after PASS. Bad prereqs after: a digit ("30 seconds") fails fields and phrases; 0 items, 4 items and a missing full stop each fail fields.

| Check (final tree, run by a test-runner agent) | Result |
|---|---|
| `check-training.js` / `check-training-data.js` | all passed / OK |
| `check-muscle-map.js` / `check-coverage.js` | OK / all passed |
| `check-syncmerge.js` / `check-androidupdate.js` | 10 pass, 0 fail / 17 passed, 0 failed |
| `check-exercise-content.js` / `check-bodymap.js` | all passed (5 batches, 150/150, d 0/0 complete, "5 script tags and 5 PRECACHE entries") / all passed |
| `python3 tools/check-workout.py` | **88 pass, 0 fail, 0 error** |

**Left over.**
- W7: flip `B.d` to `"pending"` in the edit that adds the conditioning exercises. A complete batch with a missing guide fails the checker.
- W12: make `prereq` required in the checker.
- Untracked: the seven `*.backup-20261006-165040.*` files plus `index.backup-20261006-165040.html` and `fitness/basalt.backup-20261006-165040.css`, which the handoff's `git add` excludes; `fitness/content/batch-d.js` is meant to be committed.

## 2026-10-06 · R1 · step 1.4 review, then two of its fixes

**Where.** Branch `yellow-dude`, on top of W3's tree. Opus 5.5. The review changed no code; you then asked for F1 and F3 fixed and F2 left for W6. Nothing committed.

**Review.** Part F re-run: the eight Node checks pass, `check-workout.py` 88 pass, 0 fail, 0 error, and Y1–Y4 plus the six token labels fail on `b0bae7a`. Driven by clicks: the timed wording on a scratch copy with every hold `timed` (Workout card, timer, PR toast, Progress, assessment, Swap, directory); setup, Settings, the v7 card and the directory page at 390 / 1440 / 1920 px in selene and selene-day, with no horizontal scroll and 0 page errors.

| Finding | Severity | Status |
|---|---|---|
| F1 · `toV7` replaced a v5 Equipment check record whenever the save was v5 or v6, so a v5 card a device hadn't shown yet lost its four tokens and why dip bars were turned on | INCONSISTENCY (medium) | fixed |
| F2 · The Nordic inference runs only at upgrade. A v7 device that pulls a Nordic session from a v6 device keeps `nordicAnchor: false` (run in Node against `js/syncmerge.js`). Harmless until W6 gives `hinge_4/5/6` the anchor | DESIGN RISK (low) | **left for W6**: re-running the inference after a merge would undo a deliberate untick, so W6 decides |
| F3 · The Settings tile "Ankle anchor (Nordic curls)" wrapped to 69 px against 48 px for the other 14 | COSMETIC (low) | fixed |

**Files.** Backups are `*.backup-20261006-180521.*` (basalt.js, check-workout.py, this log).
- `fitness/basalt.js`:
  - `toV7` keeps v5's record whenever it has no `tokens`, not only when `version < 5`.
  - `equipCheckHtml` drops v5's four on a device whose `v5.equipmentCheckSeen` is set. The comments at the state header, `toV7` and the card say so.
  - The Settings label is "Nordic anchor": one line, and it still names Nordic, which Y8 asserts. The card ("An ankle anchor") and setup ("An ankle anchor for Nordic curls") are unchanged.
- `tools/check-workout.py`: cases **Y9** (the v6 fixture plus a v5 record, shown and not shown on this device) and **Y10** (every Settings equipment tile is the same height, at 390 and 1440 px), with a header line.
- `service-worker.js`: `CACHE_VERSION` v74 → v75.

**Check lines.** "Before" is a scratch tree with the pre-fix `basalt.js`, run through `HELTH_INDEX`.

| Case | Before | After |
|---|---|---|
| Y9 | FAIL: card ['vest', 'abWheel', 'jumpRope', 'box', 'barbell', 'nordicAnchor'] whether or not v5's card was shown; record lost v5's four | PASS: not shown → ten rows, "Dip bars · turned on for you: you logged Parallel Bar Dip"; shown → the six |
| Y10 | FAIL: nordicAnchor 69 px at 390 and 1440 px | PASS: 15 tiles, all 48 px |
| K9, Y6, Y8 | — | PASS |

**Left over.** F2, for W6. W2's pre-existing Era II chip COSMETIC is still your call.
