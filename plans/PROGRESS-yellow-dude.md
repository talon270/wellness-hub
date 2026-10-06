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

## 2026-10-06 · W4 · step 2.1 Group A data (27 exercises)

**Where.** Branch `yellow-dude`, on top of R1's tree. Sonnet 5.5. Nothing committed.

**Files.** Backups are `*.backup-20261006-183057.*` beside each file over 200 lines (`basalt.js`, `training.data.js`, `muscles.data.js`, `batch-a.js`, `service-worker.js`, `check-training.js`, this log).
- `fitness/basalt.js` (EXTRA block): 27 DB entries, all `level: null`, `era: 1`, 4 cues and 1–2 mistakes each, in original wording. The card's Prerequisites, Gear, Cues and Errors lines were the source; the Practice lines were not used.
- `fitness/training.data.js`: the 27 `x()` records; `offer` on `push_incline`, `push_3`, `push_4`, `shoulder_1`, `dip_alt_twochair`, `dip_3`; `next` appended on `push_5`, `skill_planche_1/3/4`, `skill_handstand_1/2/3`; `push_6` and `skill_handstand_4` gain a first step-up (the plan's four-at-the-end-of-a-path rule); 27 `JOINT_STRESS` rows; 8 `REP_RANGES`; 2 `HOLD_RANGES`; 8 `SKILL_STANDARD_SEC`.
- `fitness/muscles.data.js`: 27 rows in a new block after `skill_vsit`. `tools/exercise-ids.tsv`: 27 lines.
- `fitness/content/batch-a.js`: `B.a` flipped to `"pending"`. `service-worker.js`: `CACHE_VERSION` v75 → v76.
- `tools/check-training.js`: K5 changed (Deviation 1).

**Choices to review (all product guesses, not measured).**

| ID | Value | Why |
|---|---|---|
| `dip_alt_support` | hold 20–40 s | Engine formula (start = half the advance point): a straight-arm support on fixed bars is held like a plank |
| `dip_alt_ringsupport` | hold 15–30 s | Shorter, because the rings have to be steadied as well |
| `skill_planche_band` | standard 30 s | An assisted rung, held as long as the lean it assists (`skill_planche_1`, 30) |
| `skill_planche_boxtuck` | 20 s | Same as the tuck planche (`skill_planche_2`, 20), with the box taking some weight |
| `skill_handstand_pike` | 45 s | Same as `skill_handstand_1`: beginner shoulder endurance |
| `skill_handstand_pikeelev` | 30 s | More load than the floor pike, so shorter |
| `skill_handstand_split` / `_parallette` | 20 s each | Shorter than the free handstand's 30 s: one leg off the wall, or unstable handles |
| `skill_handstand_bentarm` | 10 s | A static bent-arm position is hard to hold |
| `skill_handstand_onearm` | none | The card names no number, so the app never offers a step from it, as with `skill_vsit` |

`REP_RANGES` are the plan's table: 1–5 for `skill_planche_boxpushup` and `skill_planche_pushup`; 3–6 for `push_alt_onearmassist`, `push_alt_fingertip`, `push_alt_ringcross`, `skill_handstand_wallwalk`, `_cartwheel` and `_toetap`. No existing exercise is listed. The 27 joint scores follow the rubric at the start setup; `push_alt_fingertip` is wrist 2 because the rubric has no finger joint.

**Deviations from the plan.**
1. **K5 in `check-training.js` now seeds a Decline session.** `push_alt_staggered.next = push_5` (the plan's join) gives Archer a second predecessor. `stepDown` breaks a tie by most recent training, then prefers a `next` over an `offer` (`training.js:362-370`), so with no history declining on Archer now steps back to Staggered-Hand, not Decline. **Reproduced:** the unchanged K5 failed — "Archer declining: reduce/declining, movement → push_alt_staggered". With a Decline session in the history, it goes to `push_4`, and I ran that before editing K5. A real user on Archer has trained Decline, so the shipped behaviour is unchanged for them; only a profile with no Decline history now steps back differently. If you want it unchanged for that profile too, the smallest fix is `push_alt_staggered.next = []`, which leaves Staggered a dead end. Your call.
2. **`era: 1` on all 27**, including `push_alt_pseudoweighted`. Era II tools are hidden until you graduate (`alt.era !== 2 || s.era === 2`), and `dip_6` (weighted) is Era I.
3. **The same tie exists for the other new `next` joins** (for example `skill_handstand_split` → `skill_handstand_4`) and no check covers it. Not reproduced for them: I only ran Archer.

**Check lines.** Run by a test-runner agent after the K5 edit. "Before" proof: the new `training.data.js` copied onto a `HEAD` tree fails `check-training-data.js` with 28 failing lines, starting "catalogue entry for unknown exercise: push_alt_knee".

| Check | Result |
|---|---|
| `check-training.js` | all passed (K5 failed once before the edit, above) |
| `check-training-data.js` | OK — 177 exercises each with one entry; "8 REP_RANGES entries"; "6 hold ranges match engine"; "25 skills each have a standard entry (5 with none)"; "177 exercises scored on 8 joints" |
| `check-muscle-map.js` | OK — 177 exercises; the id list matches the DB |
| `check-coverage.js` / `check-bodymap.js` | all passed / all passed |
| `check-syncmerge.js` / `check-androidupdate.js` | 10 pass, 0 fail / 17 passed, 0 failed |
| `check-exercise-content.js` | all passed; batch a **39/66 pending**, b, c1, c2 and d complete |

A spot check through `rangeFor` under goal Strength: `skill_planche_pushup` 1–5, `push_alt_fingertip` 3–6, `skill_handstand_toetap` 3–6 per side, `dip_alt_support` 20–40 s, `skill_handstand_pike` standard 45 s, `push_alt_knee` 6–12.

**Not run:** `check-workout.py` (Part F doesn't ask for it of W4), and no screen. The exercises reach the screens through Swap, Train this in my slot and the directory, which R2 drives.

**Left over.** W5: Group B. W8: the 27 Group A guides, which flip `B.a` back to `"complete"`. No coverage slot counts changed, so section 10 of `check-training-data.js` is untouched.

**Untracked:** the seven `*.backup-20261006-183057.*` files, which the handoff's `git add` excludes.

**Decision on Deviation 1 (W4).** You chose to leave `push_alt_staggered.next = push_5` as the plan has it, so the seeded K5 stands. A profile with no Decline history now steps back from Archer to Staggered-Hand.

## 2026-10-06 · W5 · step 2.2 Group B data (30 exercises)

**Where.** Branch `yellow-dude`, on top of W4's tree. Sonnet 5.5. Nothing committed.

**Files.** Backups are `*.backup-20261006-184101.*` beside each file over 200 lines (`basalt.js`, `training.data.js`, `muscles.data.js`, `batch-b.js`, `service-worker.js`, `check-training-data.js`, this log). `check-training-data.js` needed no change, so its backup is unused.
- `fitness/basalt.js` (EXTRA block): 30 DB entries, all `level: null`, `era: 1` (two loaded mains `era: 2`, see Deviations), 4 cues and 2 mistakes each, in original wording from each card's Prerequisites, Gear, Cues and Errors lines, never the Practice line. Pattern is `pull` for the 4 rows and the 14 pull-up variants (the row slot's existing entries use `pull`), `skill` for the front lever, muscle-up and back lever steps.
- `fitness/training.data.js`:
  - 30 `x()` records, and `offer` added on `pull_alt_australian` (feet-elevated row, archer row, band front lever), `pull_alt_tabledoor` (band row), `pull_2` (ring-assisted), `pull_4` (chest-to-bar, high pull-up, skin the cat).
  - `next` appended: `skill_frontlever_1` → negative; `skill_frontlever_2` → one-leg, raise; `pull_6` → `pull_alt_onearm` (its first step-up, per the Decisions table).
  - `SLOTS.row.loaded` gains `pull_alt_tableweighted`; `SLOTS.pull.loaded` goes from empty to `pull_alt_weighted`. `SETUPS.pull_alt_bandrow` is `band` / `BAND_TENSION`.
  - 10 `REP_RANGES`, 6 `SKILL_STANDARD_SEC`, 30 `JOINT_STRESS` rows. No `HOLD_RANGES`: Group B has no hold-kind exercise.
- `fitness/muscles.data.js`: 30 rows. `tools/exercise-ids.tsv`: 30 lines (207 total).
- `fitness/content/batch-b.js`: `B.b` flipped to `"pending"`. `service-worker.js`: `CACHE_VERSION` v76 → v77.

**Choices to review (product guesses, not measured).**

| ID | Value | Why |
|---|---|---|
| `skill_frontlever_band` | standard 15 s | The rung it leads to (advanced tuck): the band takes weight, so a longer lever is reachable at the same standard |
| `skill_frontlever_oneleg` | 10 s | Between advanced tuck (15) and straddle (10); takes the straddle's |
| `skill_backlever_1` / `_2` / `_3` | 20 / 15 / 10 s | Mirrors the front lever's tuck / advanced tuck / straddle |
| `skill_backlever_4` | none | Nothing follows it, as with the full front lever |
| REP_RANGES | the plan's table, 10 of its 26 entries | 1–5: `skill_muscleup_turnover`, `_band`, `_full`, `pull_alt_onearm`, `skill_frontlever_raise`. 3–6: `skill_muscleup_explosive`, `skill_backlever_skinthecat`, `_transition`, `pull_alt_c2b`, `pull_alt_towelgrip`. No existing exercise listed |
| JOINT_STRESS | at the start setup | Pull-up variants copy `pull_4` (elbow 2, shoulder 2); neutral and close grip drop shoulder to 1 as the kinder angle; back-lever steps add neck 1 from the card's pain line; muscle-up steps add wrist 1 |

**Deviations from the plan.**
1. **`era: 1` on 28, `era: 2` on the two loaded mains** (`pull_alt_tableweighted`, `pull_alt_weighted`). You chose Era II for them to match the existing dumbbell rows, after I first wrote all 30 as Era I. Era II hides a tool until you graduate. The four Node checks that read the DB (`check-training-data.js`, `check-muscle-map.js`, `check-exercise-content.js`, `check-training.js`) still exit 0; the Era II hiding itself was not driven on a screen.
2. **Two moves gain a second predecessor.** Computed from `next` lists before and after: `skill_frontlever_2` (from `skill_frontlever_1` and `skill_frontlever_band`) and `skill_frontlever_3` (from `skill_frontlever_2` and `skill_frontlever_oneleg`). Both are `next` joins, so the step-back tie-break is "most recently trained", then list order. **Unconfirmed:** `stepDown` isn't exported and I did not drive a skill through it, so I don't know if a skill can step back at all. W4's K5 case is the one that did.
3. **The two cards the catalogue marks unresolved are in, as the plan says.** R10 (`pull_alt_ringassist`) says "confirm assistance method from demo" and R18 (`pull_alt_onearm`) is "reference only". Both are defined by the plan's name and the card text, not footage.
4. **No band setup on `skill_frontlever_band`, `skill_muscleup_band`.** The plan gives a `SETUPS` entry to `pull_alt_bandrow` only, and `check-training-data.js` lets a setup key apply to reps moves, not necessarily skills. Not tried.

**Check lines.** Run by a test-runner agent.

| Check (final tree) | Result |
|---|---|
| `check-training.js` / `check-training-data.js` | all passed / OK |
| `check-muscle-map.js` / `check-coverage.js` | OK / all passed |
| `check-syncmerge.js` / `check-androidupdate.js` | 10 pass, 0 fail / 17 passed, 0 failed |
| `check-exercise-content.js` / `check-bodymap.js` | all passed / all passed |

Quoted from `check-training-data.js`: "18 REP_RANGES entries"; "6 hold ranges match engine"; "31 skills each have a standard entry (6 with none)"; "207 exercises scored on 8 joints"; "row: 3 on the path, 3 loaded, 2 need no equipment"; "pull: 5 on the path, 1 loaded, no equipment-free option (stated)". `check-exercise-content.js`: "150 of 207 exercises (a 39/66 pending, b 47/77 pending, c1 and c2 complete, d 0/0 complete)".

**Before.** The new `training.data.js` over W4's `basalt.js` fails `check-training-data.js` with 30 lines, starting "catalogue entry for unknown exercise: pull_alt_tableweighted". `check-muscle-map.js` passed on that tree too, so it does not prove the 30 map rows: it reads the DB, which lacked the entries.

**Not run:** `check-workout.py` (Part F doesn't ask it of W5) and no screen. The exercises reach the screens through Swap, Train this in my slot and the directory, which R2 drives.

**Left over.** W6: Group C and `nordicAnchor` on `hinge_4/5/6`, plus R1's F2 decision. W9: the 30 Group B guides, which flip `B.b` back to `"complete"`. No coverage slot counts changed.

**Untracked:** the seven `*.backup-20261006-184101.*` files, which the handoff's `git add` excludes.

## 2026-10-06 · W6 · step 2.3 Group C data (29 exercises) and the Nordic token

**Where.** Branch `yellow-dude`, on top of W5's tree. Sonnet 5.5. Nothing committed.

**Files.** Backups are `*.backup-20261006-185041.*` beside each file over 200 lines (`basalt.js`, `training.data.js`, `muscles.data.js`, `batch-b.js`, `service-worker.js`, `check-training.js`, `check-training-data.js`, this log). The `batch-b.js` and `check-training.js` backups are unused: batch b was already `"pending"` and `check-training.js` needed no change.
- `fitness/basalt.js`: 29 DB entries in the EXTRA block after `skill_backlever_4`, each with 4 cues and 2 mistakes in original wording from the card's Prerequisites, Gear, Cues, Errors and Pain lines, never its Practice line. `hinge_4`, `hinge_5` and `hinge_6` now list `equipment:["nordicAnchor"]`. `pattern` is the slot's (`squat`, `hinge`, `core`): none of the 29 sits in a Skills track yet, so none is `skill`.
- `fitness/training.data.js`:
  - 29 `x()` records and a `NORDIC = ["nordicAnchor"]` shorthand. `hinge_4/5/6` take it.
  - `offer` added on `squat_2` (jump), `squat_3` (deficit, box pistol, negative pistol), `hinge_3` (both assisted Nordics), `core_1` (single-foot plank), `core_2` (hollow rock, hanging knee raise, kneeling wheel), `core_3` (seated pike lift). `next` appended on `squat_5` (assisted dragon) and `core_4` (floor L-sit). `squat_alt_cossack` gains a first step-up, the weighted Cossack squat (the plan's rule for a path that used to end).
  - `SLOTS.squat.loaded` gains `squat_alt_bulgarianw` and `squat_alt_barbell`; `SLOTS.core.loaded` goes from empty to `core_alt_plankweighted`.
  - `SETUPS`: `squat_alt_boxpistol` (box, high to low) and `hinge_alt_nordicband` (band, heavy to light, backwards like `pull_alt_bandassist`).
  - 5 `REP_RANGES` (23 in all), 5 `HOLD_RANGES`, 29 `JOINT_STRESS` rows. No `SKILL_STANDARD_SEC`: Group C has no skill-kind exercise.
- `fitness/muscles.data.js`: 29 rows. `tools/exercise-ids.tsv`: 29 lines (236 total).
- `tools/check-training-data.js`: two edits (Deviations 2 and 3).
- `service-worker.js`: `CACHE_VERSION` v77 → v78.

**Choices to review (product guesses, not measured).**

| ID | Value | Why |
|---|---|---|
| `core_alt_onefoot`, `core_alt_plankweighted` | hold 20–40 s | Harder per second than the plank (30–60 s); the side planks' range |
| `core_alt_legshold` | hold 15–30 s | Hollow body's range: the same long lever on the lower back |
| `core_alt_flutter` | hold 20–40 s, `timed` | Continuous movement, so 20–40 s of it |
| `core_alt_floorlsit` | hold 5–15 s | No handles to lift on, so even 5 s is a real hold; below the parallette L-sit's 10–20 s |
| REP_RANGES 3–6 | `squat_alt_jump`, `squat_alt_dragon`, `squat_alt_dragonassist`, `core_alt_t2b`, `core_alt_abwheelstand` | The plan's table. No existing exercise listed |
| MUSCLE_MAP | crunch, sit-up and bicycle crunch list `obliques` as secondary | The card names them, but a primary credit would count every crunch set toward the obliques' weekly floor |
| JOINT_STRESS | at the start setup; `squat_alt_barbell` lowerBack 2, `squat_alt_jump` knee 2 and ankle 2, `core_alt_lyingleg` and `core_alt_legshold` lowerBack 1 | The rubric by judgment. The two leg-lever scores are the least certain: the real stress depends on the angle, which the app doesn't know |

**R1's F2: decided, no code.** A merge does not re-run the Nordic inference.
- **The case.** A v7 device pulls a Nordic session from a v6 device and keeps `nordicAnchor: false`. Reproduced on this tree with the v6 fixture: anchor off, the hinge slot still Nordic Curl Negative. Program reads "Nordic Curl Negative needs ankle anchor, which isn't in your equipment — this is the closest movement you can do without it." with "an easier movement until you have the gear" beside Single-Leg Hip Thrust. It is visible, not silent.
- **Why not re-run it.** The same end state is what you get from unticking the anchor on purpose, and a merge that re-ticked it would undo that. The mixed-build case is a transient of the Android updater's rollout, and one tap in Settings fixes it. It follows "never silently configure".
- **The limit.** A v7 device that lost its anchor to a merge shows the easier movement until the tile is ticked. The prescription isn't wrong, it is gated on gear the app can't know you have.

**Deviations from the plan.**
1. **Era II on three loaded mains**: `squat_alt_bulgarianw`, `squat_alt_barbell`, `core_alt_plankweighted`. W5 set the precedent for `pull_alt_tableweighted` and `pull_alt_weighted` (the existing `_e2_` rows). The loaded skill-branch `squat_alt_cossackw` is Era I, as `squat_6` and `dip_6` are. Era II hiding was not driven on a screen.
2. **`check-training-data.js` accepts a loaded hold in `SLOTS[x].loaded`.** The check said an entry must be `kind: "loaded"`, so the plan's weighted plank (a hold with `loadMode`, as `acc_grip_farmer` is) failed: "core: loaded "core_alt_plankweighted" is not a main loaded exercise of the slot". The relaxed line says so in a comment; the "loaded but not listed" check still means kind `loaded`. W7's `acc_quad_wallsitw` needs the same.
3. **`check-training-data.js` accepts the setup key `box`.** The plan specifies it for the box pistol, and the check allowed four keys. It failed: "squat_alt_boxpistol: setup key "box"".
4. **Step-back ties, checked.** `squat_5` gains two `next`-predecessors (box pistol, negative pistol) and `hinge_5` two (the assisted Nordics), the tie W4 found on Archer. I declared the new records after the existing ones, so a tie goes to the old predecessor. Run through `Training.recommend` with a declining history and no other sessions: `squat_5` → `squat_4`, `hinge_5` → `hinge_4`, `core_4` → `core_3`, identical on the pre-W6 data file and the new one. Someone who last trained a new predecessor steps back to it, as intended.

**Check lines.** Run by test-runner agents. "Before" is the pre-W6 tree (the `*.backup-20261006-185041.*` files).

| Check | Result |
|---|---|
| Before | The new `training.data.js` over the old `basalt.js` fails `check-training-data.js` on 32 lines, starting "catalogue entry for unknown exercise: squat_alt_box". `check-muscle-map.js` passes on that tree too, as in W5 |
| `check-training-data.js`, first run | FAIL on exactly Deviations 2 and 3 |
| Final tree | `check-training.js` all passed · `check-training-data.js` OK · `check-muscle-map.js` OK · `check-coverage.js` all passed · `check-syncmerge.js` 10 pass, 0 fail · `check-exercise-content.js` all passed · `check-bodymap.js` all passed · `check-androidupdate.js` 17 passed, 0 failed |

Quoted from `check-training-data.js`: "23 REP_RANGES entries"; "6 hold ranges match engine"; "31 skills each have a standard entry (6 with none)"; "236 exercises scored on 8 joints"; "squat: 4 on the path, 3 loaded, 3 need no equipment"; "hinge: 3 on the path, 2 loaded, 1 need no equipment"; "core: 3 on the path, 1 loaded, 2 need no equipment". Through `startOf`: `squat_alt_jump` 3–6 reps, `core_alt_flutter` 20–40 s (timed), `core_alt_floorlsit` 5–15 s, `squat_alt_boxpistol` setup box high, `hinge_alt_nordicband` setup band heavy.

**`check-workout.py` (not asked of W6): 87 pass, 3 fail, 0 error. All three fail identically before W6.** I ran K11, D3 and R4b against the pre-W6 tree through `HELTH_INDEX`: 0 pass, 3 fail, with the same messages. They are stale assertions that W4 and W5 broke and no window ran:
- **D3 and R4b** compare the exercise count to a literal `150`. Before W6 they read 207; now 236.
- **K11** counts `[data-pick^="skill_"]` as skill attempts. W4 added `skill_planche_boxpushup` and `skill_planche_pushup`, which are reps, so the picker lists them correctly and the proxy is wrong.

Not changed, as they are outside step 2.3. **Smallest fix** (W7 or R2 to decide): replace `150` with `Object.keys(EXERCISE_DB).length`, and count `kind === "skill"` in K11.

**Not run:** no screen was driven for the 29 new exercises. They reach the screens through Swap, Train this in my slot and the directory, which R2 drives. Era II hiding is likewise unconfirmed.

**Left over.**
- W7: Group D and the conditioning slot. `acc_quad_wallsitw` is a loaded hold and needs Deviation 2's allowance. `cond_burpeevest` is a loaded main of the conditioning slot; confirm the checker's loaded-list rule accepts its kind.
- W10: the 29 Group C guides in `batch-b.js`, which flip `B.b` back to `"complete"`. No coverage slot counts changed.

**Untracked:** the eight `*.backup-20261006-185041.*` files, which the handoff's `git add` excludes.

## 2026-10-06 · W7 · step 2.4 Group D data (27 exercises) and the conditioning slot

**Where.** Branch `yellow-dude`, on top of W6's tree. Sonnet 5.5 (the plan assigns W7 to Opus 5.5; you asked for it in this session). Nothing committed.

**Files.** Backups are `*.backup-20261006-193129.*` beside each file over 200 lines (`basalt.js`, `training.data.js`, `muscles.data.js`, `batch-c1.js`, `batch-c2.js`, `batch-d.js`, `service-worker.js`, `check-training-data.js`, `check-coverage.js`, `check-training.js`, `coverage.js`, this log). The `check-coverage.js` and `check-training.js` backups are unused apart from a one-string edit in `check-coverage.js`.
- `fitness/training.data.js`:
  - `SLOTS.conditioning = { label: "Conditioning", coverage: true, conditioning: true, trains: [], first: ["cond_jacks"], loaded: ["cond_burpeevest"] }`, in the same edit as its 13 exercises. `SLOTS.quad.loaded` gains `acc_quad_wallsitw` and `acc_quad_stepupw`.
  - 27 `x()` records: 14 coverage (`curl` 2, `reardelt` 1, `traps` 1, `grip` 2, `backext` 1, `antirot` 1, `quad` 4, `calf` 2) and 13 `cond_*`. `offer` added on `acc_curl_invrow`, `acc_reardelt_snowangel`, `acc_traps_pike`, `acc_grip_wring`, `acc_grip_towelhang`, `acc_quad_wallsit`, `acc_quad_revlunge`, `acc_calf_raise` (appended after `bentknee`), `acc_antirot_sideplank`, `acc_backext_prone`, and on `cond_jacks`, `cond_ropeless` and `cond_rope` inside the slot.
  - `push_e2_weighted` takes `[["dumbbells","vest"]]` and `dip_6` takes `["dipBars", ["dumbbells","kettlebells","vest"]]`; their DB records in `basalt.js` list `vest` too. No history changes.
  - 3 `REP_RANGES` (26 in all), 7 `HOLD_RANGES`, 27 `JOINT_STRESS` rows. No `SKILL_STANDARD_SEC`: Group D has no skill-kind exercise.
  - A `ponytail:` comment on `cond_ropeweighted`: it needs only `jumpRope`, so the equipment check can't tell a weighted rope from a plain one. One token per implement is the upgrade, if it ever matters.
- `fitness/basalt.js`: 27 DB entries after `core_alt_abwheelstand`, each with 4 cues and 1–2 mistakes in original wording from the card's Prerequisites, Setup, Cues, Errors and Pain lines, never its Practice line. Program's coverage row reads `trains.map`, so a conditioning slot now prints "Conditioning — runs only on the days you pin it" in its place, and its not-started line says it starts the first time a session runs on a day you pinned it.
- `fitness/muscles.data.js`: 27 rows. `tools/exercise-ids.tsv`: 27 lines (263 total).
- `fitness/coverage.js`: one string. W1's reason for a pinned conditioning pick said "not counted against any one muscle", which is false once the sets count for the muscles they work (see Choices). It now says "not picked for any one muscle".
- `fitness/content/batch-c1.js`, `batch-c2.js`, `batch-d.js`: flipped to `"pending"`. `batch-d.js`'s header said the slot had no exercises; it now says its 13 have no guides.
- `tools/check-muscle-map.js` (no backup: unchanged since HEAD, so `git show HEAD:tools/check-muscle-map.js` is the before): a `conditioning: true` slot must have `trains: []`, and is exempt from "no `trains`" and from "the slot's group is primary on every member".
- `tools/check-training-data.js`: C5's `dip_6` list; section 11's counts and total (see Deviations); new section 12 for the conditioning slot.
- `service-worker.js`: `CACHE_VERSION` v78 → v79.

**HOLD_RANGES chosen (all product guesses).** `SKILL_STANDARD_SEC` has no new entries.

| ID | Range | Why |
|---|---|---|
| `acc_quad_wallsit1` | 15–30 s | The two-leg wall sit's 30–60 halved; a single leg is far harder |
| `acc_quad_wallsitw` | 20–40 s | Starts shorter than the unweighted sit, like the farmer hold (20–40); it then progresses by weight |
| `acc_grip_falsegrip` | 10–20 s | Harder than the towel hang (15–30), and the card asks for gradual loading |
| `acc_grip_ricebucket` | 30–60 s, timed | Low-load, beginner endurance: the plank's range |
| `acc_backext_superman` | 15–30 s | A small lift held, like hollow body (15–30) |
| `cond_jacks`, `cond_ropeless`, `cond_rope`, `cond_ropealt`, `cond_ropeboxer` | 30–60 s, timed | Continuous low-load work, the plank's range. Footwork variants don't change the length of a set |
| `cond_doubleunder` | 10–20 s, timed | A skill that breaks down early: shorter sets |
| `cond_ropeweighted` | 20–40 s, timed | The rope loads the shoulders as well |

`REP_RANGES` are the plan's table: 3–6 for `cond_burpeetuck`, `cond_boxjump` and `cond_broadjump`. No existing exercise is listed.

**Choices to review (not measured).**
- **Conditioning sets count for muscles, as the plan says, so they can move a floor.** `cond_rope*`, `cond_jacks` and `cond_ropeless` list `calves` as primary; the burpees `quads`; `cond_burpeetuck`, `cond_boxjump` and `cond_broadjump` quads and glutes. A pinned day of rope work therefore reduces the calf shortfall the coverage picker sees. A jumping jack is a thin primary for the calves; it is there because every exercise needs one (`check-muscle-map.js`). Your call whether conditioning should be secondary-only for the floors.
- **The three non-jump conditioning rep moves read 10–15 reps** (the coverage range, since the slot is a coverage slot): `cond_burpeenojump`, `cond_burpee`, `cond_burpeevest`. A weighted vest burpee at 10–15 is on the high side. `REP_RANGES` takes only `reps` and `unilateral`, so a loaded one can't be pinned lower without a new rule.
- **Joint scores** follow the rubric at the start setup. Every rope and jump carries `ankle` 1–2 from the landing, and the burpees `wrist` and `knee`. The jump and burpee scores are the least certain: the real stress depends on landing height, which the app doesn't know.
- **Era II on three loaded mains** (`acc_quad_wallsitw`, `acc_quad_stepupw`, `cond_burpeevest`), as W5 and W6 did and as the existing `acc_grip_farmer` and `acc_quad_dbsplit` are. Era II hiding was not driven on a screen.
- `acc_calf_wallsit` lists `quads` secondary and `acc_quad_wallsit1` and `_wallsitw` `glutes` secondary; the jump and burpee rows list the chest and triceps secondary (the card's burpee has no push-up).

**Deviations from the plan.**
1. **Section 11 of `check-training-data.js` counts changed.** The plan said to update "section 10"; coverage counts live in section 11. Its Plan D2 table is now curl 7, reardelt 6, traps 4, grip 7, quad 10, calf 6, antirot 7, backext 5 (the others unchanged), and the total is 78, not 64. The conditioning slot is excluded from that loop and counted in a new section 12: flags, `trains: []`, `first`, `loaded`, 13 members named `cond_*` with pattern `accessory`, 3–5 cues, 1–2 mistakes, a readiness and injury line that names chest pain and faintness, no skill kind, every hold timed, and nothing outside the slot leading into it.
2. **No change was needed to Deviation 2's loaded-hold allowance or the loaded-list rule.** `acc_quad_wallsitw` (a hold with a load) and `cond_burpeevest` (kind `loaded`) both pass as they stand.
3. **`check-coverage.js` needed no exemption.** Its slot loop doesn't read `trains`. Its Y4 string follows the reason wording above.
4. **Step-back ties, not re-run.** Group D adds no second `next`-predecessor to an existing exercise, so W4's tie (two `next` joins into one exercise) doesn't arise. Within the slot, `cond_burpee` and `cond_ropeless` each have one predecessor.

**Check lines.** Node checks run by a test-runner agent; I re-ran four after the last string edit. "Before" is a scratch copy of the tree with the pre-W7 `basalt.js`, `training.data.js` and `muscles.data.js` (the `*.backup-20261006-193129.*` files).

| Check | Before (new checkers, old data) | After |
|---|---|---|
| `check-training-data.js` | FAIL — `dip_6` lacks the vest; curl 5 not 7, reardelt 5 not 6, traps 3 not 4, grip 5 not 7, quad 6 not 10, calf 4 not 6, antirot 6 not 7; no conditioning slot | OK — "26 REP_RANGES entries"; "263 exercises scored on 8 joints"; "15 coverage slots, 78 exercises, each at the plan's count"; "conditioning: 6 on the path, 1 loaded, 2 need no equipment"; "conditioning: trains no group, pinned-only, 13 cond_ exercises…" |
| New data over the old `basalt.js` | FAIL — 150 lines, starting "catalogue entry for unknown exercise: acc_curl_pelican" | — |
| `check-muscle-map.js` | FAIL — "acc_curl_pelican is in tools/exercise-ids.tsv but not in EXERCISE_DB" | OK — 263 ids, all mapped |
| `check-training.js`, `check-coverage.js` | — | all passed, exit 0 (Y4: "pinned Wed: picked first=true, group null, … not picked for any one muscle") |
| `check-syncmerge.js`, `check-bodymap.js`, `check-androidupdate.js` | — | exit 0 (10 pass, all passed, 17 passed) |
| `check-exercise-content.js` | — | all passed — "150 of 263 exercises (a 39/66 pending, b 47/106 pending, c1 29/35 pending, c2 35/43 pending, d 0/13 pending)" |

**Screen run, by clicks (a scratch script in the session scratchpad, not in the tree).** Clock set to a Wednesday, fresh profile, onboarded through the wizard.
- Program's Conditioning row reads "Jumping Jack — not started — it starts the first time a session runs on a day you pinned it — Conditioning — runs only on the days you pin it — Pin to Mon … Sun — 3 × 30–60 s". It reads the pin and Change exercise controls like every coverage row.
- Pin Wed by click: stored as `{ days: [3] }`. Today → Push, finisher on: the first finisher row is `cond_jacks` with "Pinned for Wed — conditioning, not counted against any one muscle" (the string W7 then changed), and the preview reads "3 sets for 30–60 s", not "hold".
- Unpinned, finisher on: the picks are curl, lateral, reardelt, cuff. No conditioning, as the plan says.
- 0 page errors in the run.

**Selected `check-workout.py` cases, run by a test-runner agent: 14 pass, 0 fail, 0 error** (V3, V4, V7, V9, V10, V11, K11, K19–K22, D3, R4b, Y8). V9 now sees 16 coverage rows (its title still says 15; it compares against the live slot list, so it passes). D3 lists 263 exercises and R4b opens 263 rows.

**Not run:** the whole of `check-workout.py` (Part F doesn't ask it of W7), and no screen for the 14 coverage exercises, which reach the screens through Swap, Train this in my slot and the directory, which R2 drives. A timed conditioning page and a set logged by clicking the timer were not driven either.

**Left over.**
- R2: the equipment AND/OR check against each card's gear line (`cond_ropeweighted` is the known gap), the joint scores, and a screen run of the 27.
- W11: the 27 Group D guides in `batch-c1.js` (14 of them), `batch-c2.js` and `batch-d.js`, which flip those batches back to `"complete"`. Every `cond_*` guide must name the red flags, as its DB injury line does.
- **W6's three stale `check-workout.py` assertions (D3, R4b, K11) now pass.** `tools/check-workout.py` was edited at 19:17 on 6 Oct, after W6's entry and before W7 began; I did not change it. The diff is W6's smallest fix: D3 and R4b compare against the live exercise count, and K11 counts `kind === "skill"`.
- **Unconfirmed:** that a conditioning prescription can step up through a rung you can't do (stepUp routes round it). Not driven; the Node checks only confirm the path is well formed.

**Untracked:** the twelve `*.backup-20261006-193129.*` files, which the handoff's `git add` excludes.

## 2026-10-06 · R2 · step 2.5 review, then two of its fixes

**Where.** Branch `yellow-dude`, on top of W7's tree. Opus 5.5. The review changed no code; you then asked for the bugs fixed. Nothing committed.

**A second session edited the tree during this review.** `plans/PLAN-weekly-workouts.md` (20:33) rewrote `fitness/basalt.js` and `service-worker.js` at 20:38: schema **v8**, `CACHE_VERSION` v80. That work is not part of this plan. On the live tree `check-workout.py` is 88 pass, 2 fail: Y6 "round trip: differs in ['prefs']", Y7 "saved at v8". Its backup `fitness/basalt.backup-20261006-203345.js` (and `service-worker.backup-20261006-203345.js`) is W7's tree exactly, schema v7 and v79. Rebuilt there, Y6 and Y7 PASS and the eight Node checks pass. **Committing Stage 2 from the working tree would bundle v8 with it. Your call.**

**Review.** Every one of the 113 records matched the plan's tables (kind, equipment, joins, ranges, setups, map rows); coverage primaries and joint scores against the rubric are consistent. Driven by clicks on the Stage 2 tree, 0 page errors throughout: the Exercises list holds and opens all 113 with no "undefined", "NaN" or "null"; Train this in my slot takes all 21 moves nothing offers; Swap reaches 20 of them (Floor Calf Raise is coverage, reached by Train this); Muscle-up previews 3 × 1–5 reps, Flutter Kicks "3 sets for 20–40 s"; Conditioning pinned to Wednesday appears in the finisher with "Time this set", and the timer logged a set. Node: the four first step-ups step as planned, and name the missing gear without it. **W5's Deviation 2 is now confirmed:** a skill steps back, to the rung you trained most recently; with no history, to the original one (`skill_frontlever_2` → `_1`, `skill_frontlever_3` → `_2`, `skill_handstand_4` → `_3`).

| Finding | Severity | Status |
|---|---|---|
| F1 · The v8 edit above shares files with Stage 2 | process | **yours**: commit Stage 2 from the 203345 state, or wait for that session |
| F2 · `barbell` named no rack. Card L24 needs "Rack with safeties" and Barbell Back Squat's cues set the rack safeties, so a barbell owner without a rack could be given it | DESIGN RISK (medium) | fixed: the token reads "Barbell and rack" (Settings, needs-line), "A barbell and a squat rack" (setup, card), the card's paragraph and the EQUIPMENT header say so. Labels only; no saved equipment changes |
| F3 · Weighted Pull-up needed a vest, while Weighted Dip takes dumbbells or kettlebells on a belt and card R19 says "vest or dip belt" | INCONSISTENCY (low) | fixed: `["pullupBar", ["dumbbells", "kettlebells", "vest"]]`, the shape `dip_6` has, in the record and the DB entry. Its cue already said "a snug vest or belt" |
| F4 · W5, W6 and W7 say Era II hides a tool until you graduate. Nothing reads an exercise's `era` any more (`alt.era !== 2` survives only in 1 Oct backups). An Era I profile's Swap lists five of the new Era II moves, as it lists `pull_e2_dbrow`, so the behaviour matches the existing rows | INCONSISTENCY (low) | recorded here; no code change. The Era II choices you made on that premise change nothing at runtime |
| F5 · `tools/check-workout.py` was edited at 19:17 by no window (D3, R4b, K11). It is W6's proposed fix, and those cases pass | NOISE (low) | recorded here |

**Files.** Backups are `*.backup-20261006-212234.*` (`basalt.js`, `training.data.js`, `service-worker.js`, this log).
- `fitness/basalt.js`: the five barbell labels; `pull_alt_weighted`'s DB equipment.
- `fitness/training.data.js`: `pull_alt_weighted`'s equipment, with a comment; the barbell line in the EQUIPMENT header.
- `service-worker.js`: `CACHE_VERSION` v80 → v81 (on top of the other session's v80).

**Check lines.** "Before" is a scratch copy of the live tree with the two 212234 backups, driven by the same click script.

| Case | Before | After |
|---|---|---|
| Pull-up bar + dumbbells, Train this Weighted Pull-up | refused: "needs weighted vest, which isn't in your equipment" | taken: "is now your Pull slot's exercise" |
| No barbell, Train this Barbell Back Squat | "needs barbell, which isn't in your equipment" | "needs barbell and rack, which isn't in your equipment" |
| `recommend` at the top, 10 kg | — | dumbbells → 12.5 kg, kettlebells → 14 kg, vest → 12.5 kg (`dip_6` with dumbbells: 12.5 kg) |
| Y8, Y9, Y10, K9 | — | 4 pass, 0 fail; setup lists "A barbell and a squat rack"; 15 Settings tiles all 48 px at 390 and 1440 |
| Eight Node checks | — | all pass |

Labels only, no colour, so neither theme changes. **Not re-run after the fix:** the whole of `check-workout.py`. Y6 and Y7 fail on the live tree for the v8 reason above, not this change.

**Still yours, from W7:** Weighted Vest Burpee at 10–15 reps, and conditioning sets counting toward the calf floor.
