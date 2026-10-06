# Yellow Dude catalogue: every missing movement, a conditioning slot and two new skill tracks — plan

Written **2026-10-06** against branch `fitness-plan` at `b0bae7a`, BASALT schema **v6**, 150 exercises. Source catalogue: `yellow-dude-exercise-requirements.md` (218 cards) and `yellow-dude-app-integration.md`, both in the synced Soomaries folder (`/home/talon/soomaries/helth/fitness/` on this machine).

**Method.**
- **Read in full:** both catalogue docs' structure and all 218 cards' name, difficulty, gear and mapping lines; `fitness/training.data.js`; `fitness/content/STYLE.md`; the headers of `directory.js`, `coverage.js`, `phases.data.js` and every check tool.
- **Read in `fitness/basalt.js`:** the header and default state (`:1-200`), `migrate` (`:285-320`), EXERCISE_DB's entry format (`:1663-1760`), `HOLD_ADVANCE_AT` (`:2593`), the EXTRA block and `SKILL_TRACKS` (`:9440-9505`), the Running engine and `planSprint` (`:9723-10052`). Also read: `js/views/mobility.js` (ROUTINES, the flexibility holds, how a routine renders), the load-step lookup in `training.js:242-250`, and `Coverage.pick` (`coverage.js:124-150`).
- **Computed:** a Node script loads the real EXERCISE_DB and TRAINING_DATA in the same sandbox `check-exercise-content.js` uses, then cross-references every card's mapping line against them. All 75 IDs the catalogue mapped still exist, and 0 point at removed exercises.
- **Ran:** the eight Node checks, all passing on this tree: `check-training.js` all passed, `check-training-data.js` OK, `check-muscle-map.js` OK, `check-coverage.js` all passed, `check-syncmerge.js` 9 pass, `check-exercise-content.js` all passed, `check-bodymap.js` all passed, `check-androidupdate.js` 17 passed.
- **Not run:** `tools/check-workout.py` (Playwright), the screens, and the Android and desktop shells.
- **Not checked:** what each source video actually demonstrates. A card's timestamp marks where the name was spoken (the catalogue says so itself), so every movement below is defined by its card text and the guide that gets written for it, not by footage.

**Nothing below is implemented — this is the plan.** Approval is per stage, as in your last plan.

## What you asked for (2026-10-06)

"Implement everything that is missing from the app, split between windows and specify models and efforts." **Stage 1 approved 2026-10-06, with every default in the Decisions table.** Missing means a movement, a setup or a surface the live app doesn't have. Against the live tree (not the older copy the integration doc was written against):

| Cards | Count | Where they go |
|---|---:|---|
| Already in the app, as the same movement | 89 | No new exercise. Each gains a "Before you start" list on its guide (Stage 3) |
| New exercises | 114 cards → **113 IDs** | Stage 2 data, Stage 3 guides. L10 and L13 (box pistol, high-box pistol) are one exercise with a box-height setup |
| New Mobility routine steps | 6 | One new routine, M04–M09 (Stage 4) |
| Already in Mobility | 4 | M01 Wrist Prep, M02 Shoulder rolls and CARs, M03 Deep squat hold, M10 Doorway chest opener |
| Running | 2 | CO04 sprint is in the Sprint plan; CO05 hill sprint gets one line (Stage 4) |
| Out of scope | 3 | P24, C23, C16 (see Out of scope) |

The 89 already in the app: the 75 cards the catalogue mapped, minus R29 and C11 (which become new exercises), plus 16 it marked unmapped that exist now. Of those 16, 13 came with Stage 3's coverage work: S01, R33, R34, G01, C04, C07, C08, L16, L20, L23, L27, L28, L29. The other 3 are the same movement under another name: R02 → Chin-up, R23 → Australian Row on rings, FL01 → Dead Hang. R30 (underhand table row) is re-pointed from `pull_alt_tabledoor` to `acc_curl_invrow`, whose `lowBar` already means "a bar or table edge".

## The four stages

| Stage | What it does | Schema | Approve |
|---|---|---|---|
| **1 · Rules** | Per-exercise rep ranges for low-rep moves; continuous timed work; 6 new equipment items, with the Nordic anchor inferred from your history; loads for a vest and a barbell; the pinned-only rule a conditioning slot needs; the "Before you start" field | **v7** | now |
| **2 · Catalogue** | 113 exercises: DB entry, catalogue record, joint stress, muscle map, ID list | stays v7 | after R1 |
| **3 · Guides** | A written guide for each of the 113, and "Before you start" on all 263 | none | after R2 |
| **4 · Tracks and close-out** | Back lever and muscle-up tracks in Skills, the new steps in the planche, front lever and handstand tracks, the Mobility routine, the hill-sprint line, README, harness and fixture | none | after R3 |

**Stage 1 goes first** because Stage 2's records need its fields to exist: `REP_RANGES` for 26 of them, `timed` for 9, the six tokens for 19, and the pinned-only rule for the 13 in Conditioning. **v7 is a guard, not a reshape.** Stage 2 lets a slot hold an exercise a v6 build has never heard of, and a v6 build's `recoveryOffer` would call `recommend` on it. v6 bumped for the same reason (`basalt.js:308-313`).

## Decisions this plan makes for you

Override any row when you approve the stage it belongs to.

| Decision | Default | Alternative |
|---|---|---|
| A variant of an existing movement (feet-elevated row, floor L-sit, deficit split squat, floor calf raise) | **Its own ID.** No existing exercise gains a setup or a setup value | Setup values. Needs the multi-key setup schema the integration doc describes, and old sessions without the new key stop counting as evidence |
| How new exercises join the ladders | **Off the path** (`branch: "skill"`). A main exercise *offers* a new one only where it's a progression from it. Sideways variants (grip widths, parallette, slider, fingertip, crunch, sit-up…) are offered by nothing: you reach them from Exercises, Swap or *Train this in my slot*. No existing `next` changes its first entry, and no `first` changes | Insert them as rungs. That moves people mid-ladder: someone on Incline would step to Knee Push-up instead of Push-up |
| Existing exercises that gain a step | A skill-branch exercise can't offer (`check-training-data.js:112`), so it gains entries **appended** to `next`. Four sit at the end of a path today and so **gain a first step-up**: Pseudo Planche Push-up → Weighted Pseudo Planche, Archer Pull-up → One-Arm Pull-up, Freestanding Handstand → three expert holds, Cossack Squat → Weighted Cossack | Leave those four at the end of their paths |
| Low-rep movements (muscle-up, planche push-up, jumps) | `REP_RANGES`, a per-exercise range that ignores goal and coverage ranges: **1–5** or **3–6** (table in Part B). Product choices, like every range here | 6–12 for everything, which no one meets on a first muscle-up |
| Continuous timed work (rope, jumping jacks, flutter kicks, rice bucket) | A hold with **`timed: true`**. The logic is identical; only the words change ("for 30–45 s", not "hold") | A new `kind`, which means auditing the 58 places basalt.js reads `"hold"` |
| Conditioning (CO01–CO03, CO06–CO15) | **A coverage-style slot with no muscle group.** It runs only when you pin it to the finisher or a mini-session, and is never auto-picked, because no muscle shortfall can ask for it. Its sets still count for the muscles they train | Leave conditioning out |
| New equipment | Six items, **all off**: `vest`, `abWheel`, `jumpRope`, `box`, `barbell`, `nordicAnchor`. On upgrade, `nordicAnchor` is **on if any of `hinge_4/5/6` is in your slots or your logged sessions**, otherwise off. A one-time *Equipment check* card names all six | All off, card only. A Nordic user's slot would then read "gear missing" until they tick it |
| Nordic curls' equipment | `hinge_4/5/6` require `nordicAnchor` (today: none, so anyone can be prescribed one) | Leave them needing nothing |
| Weighted Push-up and Weighted Dip | Accept a vest as well: `push_e2_weighted` [["dumbbells","vest"]], `dip_6` ["dipBars", ["dumbbells","kettlebells","vest"]]. Widens who qualifies; narrows no one | Unchanged |
| Load steps | `LOAD_STEP_KG` gains **vest 2.5 kg** and **barbell 5 kg** (a 2.5 kg plate a side). Product choices; *weights you own* overrides them as it does today | Ask at first use |
| Furniture (chair, table, door, wall) | **Still not equipment tokens,** as your last plan decided. "Before you start" says what a support must be | Tokens for each |
| Prerequisites | A **"Before you start"** list on every guide: 1–3 lines, no numbers, at the top of the page. Text, never a gate | None |
| The catalogue's draft doses ("2 sets of 6–10") | **Not imported.** TRAINING_DATA stays the only prescription source, and STYLE.md rule 4 bans them in guides | — |
| The catalogue's YouTube links | **Not shipped.** A link marks where a name was spoken, not a demonstration, and only opens online | Ship as "mentioned in this video (online)" |
| Context-only cards (R18, C20, C21, C22, PL09, HS09, CO15) | Included as ordinary exercises. The source only mentions them in critique, but the app doesn't cite sources | Drop them |
| New Mobility routine | **Hip Rotation** (M04–M09) in Mobility → Routines. It carries an emoji like the other five, because the tile and the player print `routine.emoji` (`mobility.js:145, 622`) and would show "undefined" without one | Append the steps to Hips & Shoulders |
| Skills view | Two new tracks, **Back Lever** and **Muscle-up**; new steps inserted into Planche, Front Lever and Handstand. The *Variations* track is unchanged: Exercises is where variations are browsed | Add the new variations to it |
| Branch | `yellow-dude`, off `fitness-plan` at `b0bae7a`. Handoff by bundle, as in Part H of your last plan | Keep working on `fitness-plan` |
| Models | Opus 5.5 + Sonnet 5.5, as your last plan | — |

## Part A — findings, ranked

**Reproduced** means run against the live tree on 2026-10-06. **Source** means traced in the code, not run.

### A1 · DESIGN RISK (medium): Nordic curls need nothing, so anyone can be prescribed one
**Source.** `training.data.js`: `x("hinge_4", "hinge", "skill", "eccentric", BWT, …)`, and `hinge_5` and `hinge_6` are the same. A Nordic curl can't be done without something holding the ankles. The equipment check is meant to stop the app prescribing what you can't do, and here it can't.
**Fix:** the `nordicAnchor` token, inferred on upgrade (Decisions). This is the smallest fix that doesn't hide a Nordic someone already trains: a token alone, defaulting off, would.

### A2 · INCONSISTENCY (low): Weighted Push-up's only load is dumbbells
**Source.** `push_e2_weighted` needs `dumbbells`, but its cue says "a plate/dumbbell across the upper back", and the catalogue's P10 uses a vest or backpack. `loadMode: "total"` is already right for a vest.
**Fix:** any-of dumbbells or vest. It changes one equipment list and no history.

### A3 · MODEL GAP: no range below 6 reps outside eccentrics
**Source.** `rangeFor` (`training.data.js:553-574`) takes reps from `RANGES[kind]`, `GOAL_RANGES` or `COVERAGE_RANGES`. The lowest non-eccentric floor is Strength's 4. A muscle-up would read 6–12, or 4–8 under Strength.
**Fix:** `REP_RANGES[id]`, checked first, for the rep kinds only. This is the smallest fix: one table, one line in `rangeFor`, and no existing exercise is listed.

### A4 · MODEL GAP: no word for continuous timed work
**Source.** A jump-rope set is seconds of movement. The app's only seconds-based kinds are `hold` and `skill`, and the screens call it a hold.
**Fix:** `timed: true` on the catalogue record, passed through `rangeFor`, read only where a label is printed. It is smaller than a new kind: one flag and the label sites, instead of 58 logic branches.

### A5 · MODEL GAP: a coverage slot must train a muscle
**Source.** `Coverage.pick` takes `SLOTS[slot].trains.map(…)[0]` and reads `g.shortfall` (`coverage.js:131-135`). A slot with `trains: []` throws.
**Fix:** a slot flagged `conditioning: true` is considered only when pinned. One guard in `pick`; `status` is unchanged.

### A6 · MODEL GAP: a vest or barbell has no load step
**Source.** `training.js:248` picks the first equipment token with a `LOAD_STEP_KG` entry. A loaded exercise needing only `vest` gets no implement and so no step.
**Fix:** two `LOAD_STEP_KG` entries (Decisions).

### A7 · NOISE (low): the integration doc is stale
It counts 86 exercises (live: 150) and 5 equipment items (live: 9). Three of its seven equipment mismatches are already fixed: band-assisted pull-up needs bands, `dip_3` needs `dipBars`, and L-sits take a bench or parallettes. Its step 2, a searchable library with fuller guides, shipped in `b0bae7a`. This plan follows the live tree, not the doc.

## Part B — the build

### How a new exercise is made (every Stage 2 window)

Each ID in the tables below gets **all** of these in the same window, or the checks fail:

| Where | What | Rule |
|---|---|---|
| `basalt.js` EXTRA block (`:8842+`) | The EXERCISE_DB entry: `id, pattern, name, level: null, era, mode, unit, equipment, cues[3-5], mistakes[1-2], readiness, injury` | `pattern`: `skill` for anything in a Skills track, `accessory` for coverage and conditioning, otherwise the slot's pattern (`row` → `pull`). `mode`/`unit` are `hold`/`sec` for hold, skill and timed. `equipment` flattens the catalogue's list. Cues are original wording; facts can come from the card |
| `training.data.js` EXERCISES | `x(id, slot, branch, kind, equipment, next, offer, extra)` | As in the tables. Loaded work carries `loadMode`, and `perSide` where marked |
| `training.data.js` | `offer` on the main exercise, or the appended `next` on the skill one, named in the *Joins by* column | Appended means after the existing entries |
| `training.data.js` | `REP_RANGES`, `HOLD_RANGES`, `SKILL_STANDARD_SEC`, `SETUPS`, `SLOTS[x].loaded` as each row needs | `HOLD_RANGES` and `SKILL_STANDARD_SEC` values: compare with the nearest existing entry, and log each as a product guess, as Stage 3 did |
| `training.data.js` JOINT_STRESS | One entry | The rubric at `:603-616`, scored at the start setup |
| `muscles.data.js` | One MUSCLE_MAP row: primary, assistance, bracing | A coverage slot's `trains` group must be primary. Bracing stays priced low (context.md) |
| `tools/exercise-ids.tsv` | One line: id, pattern, name | `check-muscle-map.js` compares it to the DB |
| `fitness/content/batch-*.js` | Flip the batch flag to `"pending"` when you add its first new ID | The guide windows flip it back. A pending batch with a missing guide passes; a complete one fails |
| `tools/check-training-data.js` | Update the coverage slot counts (section 10) when you add to a coverage slot | Say so in the progress log |

**No phase entry** for any new ID. `phases.data.js` holds 29 illustrations, and a guess drawn as a bar chart is what that file's header forbids.

### Group A — push, shoulder, dip (W4 data · W8 guides · `batch-a.js`) — 27

Branch is `skill` unless marked. "—" is no equipment. "bar or rings" is `HANG`.

| Card | ID | Name | Kind | Equipment | Joins by |
|---|---|---|---|---|---|
| P04 | `push_alt_knee` | Knee Push-up | reps | — | offered by `push_incline` |
| P05 | `push_alt_kneeassist` | Knee-Assisted Push-up | reps | — | `push_alt_knee.next` |
| P07 | `push_alt_partial` | Partial-Range Push-up | reps | — | not offered |
| P11 | `push_alt_staggered` | Staggered-Hand Push-up | unilateral | — | offered by `push_3`; next `push_5` |
| P12 | `push_alt_onearmassist` | Assisted One-Arm Push-up | unilateral | — | appended to `push_5.next`; next `push_alt_onearm` |
| P16 | `push_alt_pseudoweighted` | Weighted Pseudo Planche Push-up | loaded (total) | vest | `push_6.next` (was empty) |
| P17 | `push_alt_parallette` | Parallette Push-up | reps | parallettes | not offered |
| P18 | `push_alt_slider` | Towel Squeeze Push-up | reps | — | not offered |
| P19 | `push_alt_ringcross` | Ring Crossover Press | reps | rings | not offered |
| P36 | `push_alt_fingertip` | Fingertip Push-up | reps | — | not offered |
| PL01 | `skill_planche_band` | Band-Assisted Planche Lean | skill | bands | offered by `push_4`; next `skill_planche_2` |
| PL04 | `skill_planche_boxtuck` | Box-Supported Tuck Planche | skill | parallettes, box | appended to `skill_planche_1.next`; next `skill_planche_3` |
| PL07 | `skill_planche_boxpushup` | Box-Supported Straddle Planche Push-up | reps | parallettes, box | appended to `skill_planche_3.next` |
| PL09 | `skill_planche_pushup` | Planche Push-up | reps | — | appended to `skill_planche_4.next` |
| P21 | `shoulder_alt_pikeneg` | Negative Pike Push-up | eccentric | — | not offered |
| HS01 | `skill_handstand_pike` | Pike Hold | skill | — | offered by `shoulder_1`; next `skill_handstand_pikeelev` |
| HS02 | `skill_handstand_pikeelev` | Feet-Elevated Pike Hold | skill | bench | next `skill_handstand_1` |
| HS03 | `skill_handstand_wallwalk` | Wall Walk | reps | — | appended to `skill_handstand_1.next` |
| HS10 | `skill_handstand_cartwheel` | Cartwheel Exit Drill | reps | — | appended to `skill_handstand_2.next` |
| HS05 | `skill_handstand_toetap` | Split-Leg Wall Toe Tap | unilateral | — | appended to `skill_handstand_3.next`; next `skill_handstand_split` |
| HS06 | `skill_handstand_split` | Split-Leg Handstand Hold | skill | — | next `skill_handstand_4` |
| HS08 | `skill_handstand_parallette` | Parallette Handstand | skill | parallettes | `skill_handstand_4.next` (was empty) |
| HS11 | `skill_handstand_bentarm` | Bent-Arm Handstand Hold | skill | — | `skill_handstand_4.next` |
| HS09 | `skill_handstand_onearm` | One-Arm Handstand | skill | — | `skill_handstand_4.next` |
| P39 | `dip_alt_negative` | Dip Negative | eccentric | dipBars or lowBar | offered by `dip_alt_twochair` |
| S03 | `dip_alt_support` | Parallel Bar Support Hold | hold | dipBars | offered by `dip_alt_twochair`; next `dip_alt_negative` |
| S04 | `dip_alt_ringsupport` | Ring Support Hold | hold | rings | offered by `dip_3`; next `dip_5` |

### Group B — row and pull (W5 data · W9 guides · `batch-b.js`) — 30

| Card | ID | Name | Kind | Equipment | Joins by |
|---|---|---|---|---|---|
| R21 | `pull_alt_australianfe` | Feet-Elevated Inverted Row | reps | lowBar or rings, bench | offered by `pull_alt_australian` |
| R22 | `pull_alt_archerrow` | Archer Row | unilateral | lowBar or rings | offered by `pull_alt_australian` |
| R29 | `pull_alt_tableweighted` | Weighted Table Row | **main**, loaded (total) | vest | `SLOTS.row.loaded` |
| R31 | `pull_alt_bandrow` | Band Bent-Over Row | reps, band setup | bands | offered by `pull_alt_tabledoor` |
| FL09 | `skill_frontlever_band` | Band-Assisted Front Lever | skill | pullupBar, bands | offered by `pull_alt_australian`; next `skill_frontlever_2` |
| FL08 | `skill_frontlever_negative` | Front Lever Negative | eccentric | bar or rings | appended to `skill_frontlever_1.next` |
| FL04 | `skill_frontlever_oneleg` | One-Leg Front Lever | skill | bar or rings | appended to `skill_frontlever_2.next`; next `skill_frontlever_3` |
| FL07 | `skill_frontlever_raise` | Front Lever Raise | reps | bar or rings | appended to `skill_frontlever_2.next` |
| R10 | `pull_alt_ringassist` | Feet-Assisted Ring Pull-up | reps | rings | offered by `pull_2` |
| R12 | `pull_alt_neutral` | Neutral-Grip Pull-up | reps | bar or rings | not offered |
| R13 | `pull_alt_wide` | Wide-Grip Pull-up | reps | pullupBar | not offered |
| R14 | `pull_alt_close` | Close-Grip Pull-up | reps | pullupBar | not offered |
| R15 | `pull_alt_hollow` | Hollow-Body Pull-up | reps | pullupBar | not offered |
| R16 | `pull_alt_arched` | Arched-Back Pull-up | reps | pullupBar | not offered |
| R41 | `pull_alt_towelgrip` | Towel-Grip Pull-up | reps | pullupBar | not offered |
| R36 | `pull_alt_c2b` | Chest-to-Bar Pull-up | reps | pullupBar | offered by `pull_4` |
| R18 | `pull_alt_onearm` | One-Arm Pull-up | unilateral | pullupBar | `pull_6.next` (was empty) |
| R19 | `pull_alt_weighted` | Weighted Pull-up | **main**, loaded (total) | pullupBar, vest | `SLOTS.pull.loaded` |
| R37 | `skill_muscleup_explosive` | High Pull-up | reps | pullupBar | offered by `pull_4`; next `skill_muscleup_turnover` |
| R38 | `skill_muscleup_turnover` | Bar Turnover Drill | reps | pullupBar | next `skill_muscleup_band` |
| R39 | `skill_muscleup_band` | Band-Assisted Muscle-up | reps | pullupBar, bands | next `skill_muscleup_full` |
| R40 | `skill_muscleup_full` | Muscle-up | reps | pullupBar | — |
| BL01 | `skill_backlever_skinthecat` | Skin the Cat | reps | bar or rings | offered by `pull_4`; next `skill_backlever_1` |
| BL02 | `skill_backlever_1` | Tuck Back Lever | skill | bar or rings | next `skill_backlever_2`, `skill_backlever_transition` |
| BL03 | `skill_backlever_transition` | Tuck-to-Straddle Transition | reps | bar or rings | — |
| BL04 | `skill_backlever_2` | Advanced Tuck Back Lever | skill | bar or rings | next `skill_backlever_straddleneg` |
| BL05 | `skill_backlever_straddleneg` | Straddle Back Lever Negative | eccentric | bar or rings | next `skill_backlever_3` |
| BL06 | `skill_backlever_3` | Straddle Back Lever | skill | bar or rings | next `skill_backlever_fullneg` |
| BL07 | `skill_backlever_fullneg` | Full Back Lever Negative | eccentric | bar or rings | next `skill_backlever_4` |
| BL08 | `skill_backlever_4` | Full Back Lever | skill | bar or rings | — |

`pull_alt_bandrow` gets `SETUPS` `{ key: "band", values: BAND_TENSION }`, like every band move.

### Group C — squat, hinge, core (W6 data · W10 guides · `batch-b.js`) — 29

| Card | ID | Name | Kind | Equipment | Joins by |
|---|---|---|---|---|---|
| L02 | `squat_alt_box` | Box Squat | reps | — | not offered |
| L04 | `squat_alt_jump` | Jump Squat | reps | — | offered by `squat_2` |
| L07 | `squat_alt_bulgarianw` | Weighted Bulgarian Split Squat | **main**, loaded (perHand, perSide) | bench, dumbbells | `SLOTS.squat.loaded` |
| L08 | `squat_alt_deficit` | Deficit Bulgarian Split Squat | unilateral | bench | offered by `squat_3` |
| L10 + L13 | `squat_alt_boxpistol` | Box Pistol Squat | unilateral | — | offered by `squat_3`; next `squat_5`. `SETUPS { key: "box", values: [high, low] }` |
| L14 | `squat_alt_pistolneg` | Negative Pistol Squat | eccentric | — | offered by `squat_3`; next `squat_5` |
| L24 | `squat_alt_barbell` | Barbell Back Squat | **main**, loaded (total) | barbell | `SLOTS.squat.loaded` |
| L33 | `squat_alt_cossackw` | Weighted Cossack Squat | loaded (total, perSide) | dumbbells or kettlebells | `squat_alt_cossack.next` (was empty) |
| L39 | `squat_alt_dragonassist` | Assisted Dragon Squat | unilateral | — | appended to `squat_5.next`; next `squat_alt_dragon` |
| L38 | `squat_alt_dragon` | Dragon Squat | unilateral | — | — |
| L36 | `hinge_alt_nordicband` | Band-Assisted Nordic Curl | reps, band setup heavy → light | bands, nordicAnchor | offered by `hinge_3`; next `hinge_5` |
| L37 | `hinge_alt_nordicarm` | Arm-Assisted Nordic Curl | reps | nordicAnchor | offered by `hinge_3`; next `hinge_5` |
| C02 | `core_alt_onefoot` | Single-Foot Plank | hold | — | offered by `core_1` |
| C03 | `core_alt_plankweighted` | Weighted Plank | **main**, hold, loaded (total) | vest | `SLOTS.core.loaded` |
| C06 | `core_alt_hollowrock` | Hollow Body Rock | reps | — | offered by `core_2` |
| C11 | `core_alt_floorlsit` | Floor L-Sit | hold | — | appended to `core_4.next` |
| C13 | `core_alt_chairlegraise` | Two-Chair Leg Raise | reps | — | not offered |
| C14 | `core_alt_pikelift` | Seated Pike Leg Lift | reps | — | offered by `core_3` |
| C15 | `core_alt_hangknee` | Hanging Knee Raise | reps | pullupBar | offered by `core_2`; next `core_alt_hangleg` |
| C17 | `core_alt_hangleg` | Hanging Straight-Leg Raise | reps | pullupBar | next `core_alt_t2b` |
| C19 | `core_alt_t2b` | Toes-to-Bar | reps | pullupBar | — |
| C18 | `core_alt_lyingleg` | Lying Leg Raise | reps | — | not offered |
| C20 | `core_alt_situp` | Sit-up | reps | — | not offered |
| C21 | `core_alt_crunch` | Crunch | reps | — | not offered |
| C22 | `core_alt_bicycle` | Bicycle Crunch | reps | — | not offered |
| C24 | `core_alt_legshold` | Straight-Leg Hold | hold | — | not offered |
| C25 | `core_alt_flutter` | Flutter Kicks | hold, **timed** | — | not offered |
| C28 | `core_alt_abwheelknee` | Kneeling Ab Wheel Rollout | reps | abWheel | offered by `core_2`; next `core_alt_abwheelstand` |
| C29 | `core_alt_abwheelstand` | Standing Ab Wheel Rollout | reps | abWheel | — |

Also in W6: `hinge_4`, `hinge_5` and `hinge_6` gain `nordicAnchor` (A1), in both the DB and the catalogue.

### Group D — coverage and conditioning (W7 data · W11 guides · `batch-c1.js`, `batch-c2.js`, new `batch-d.js`) — 27

| Card | ID | Name | Slot | Kind | Equipment | Joins by |
|---|---|---|---|---|---|---|
| R01 | `acc_curl_pelican` | Ring Pelican Curl | curl | reps | rings | offered by `acc_curl_invrow` |
| R03 | `acc_curl_ring` | Ring Biceps Curl | curl | reps | rings | offered by `acc_curl_invrow` |
| S02 | `acc_reardelt_ringfacepull` | Ring Face Pull | reardelt | reps | rings | offered by `acc_reardelt_snowangel` |
| R32 | `acc_traps_proney` | Prone Y Raise | traps | reps | — | offered by `acc_traps_pike` |
| G02 | `acc_grip_falsegrip` | False-Grip Ring Hang | grip | hold | rings | offered by `acc_grip_towelhang` |
| G03 | `acc_grip_ricebucket` | Rice Bucket Hand Drill | grip | hold, **timed** | — | offered by `acc_grip_wring` |
| R35 | `acc_backext_superman` | Superman Hold | backext | hold | — | offered by `acc_backext_prone` |
| C26 | `acc_antirot_hipraise` | Side Plank Hip Raise | antirot | unilateral | — | offered by `acc_antirot_sideplank` |
| L17 | `acc_quad_wallsit1` | Single-Leg Wall Sit | quad | hold | — | offered by `acc_quad_wallsit` |
| L18 | `acc_quad_wallsitw` | Weighted Wall Sit | quad | **main**, hold, loaded (total) | dumbbells, kettlebells or vest | `SLOTS.quad.loaded` |
| L19 | `acc_quad_lunge` | Forward Lunge | quad | unilateral | — | offered by `acc_quad_revlunge` |
| L21 | `acc_quad_stepupw` | Weighted Step-Up | quad | **main**, loaded (perHand, perSide) | dumbbells | `SLOTS.quad.loaded` |
| L26 | `acc_calf_floor` | Floor Calf Raise | calf | reps | — | not offered |
| L40 | `acc_calf_wallsit` | Wall-Sit Calf Raise | calf | reps | — | offered by `acc_calf_raise` |
| CO15 | `cond_jacks` | Jumping Jack | conditioning | **main**, hold, timed | — | `SLOTS.conditioning.first`; next `cond_ropeless` |
| CO03 | `cond_ropeless` | Ropeless Jump Rope | conditioning | **main**, hold, timed | — | next `cond_rope` |
| CO01 | `cond_rope` | Jump Rope | conditioning | **main**, hold, timed | jumpRope | next `cond_ropealt` |
| CO10 | `cond_ropealt` | Alternating-Foot Jump Rope | conditioning | **main**, hold, timed | jumpRope | next `cond_ropeboxer` |
| CO11 | `cond_ropeboxer` | Boxer-Step Jump Rope | conditioning | **main**, hold, timed | jumpRope | next `cond_doubleunder` |
| CO12 | `cond_doubleunder` | Double-Under Jump Rope | conditioning | **main**, hold, timed | jumpRope | — |
| CO02 | `cond_ropeweighted` | Weighted Jump Rope | conditioning | hold, timed | jumpRope | offered by `cond_rope` |
| CO07 | `cond_burpeenojump` | No-Jump Burpee | conditioning | reps | — | offered by `cond_jacks`; next `cond_burpee` |
| CO06 | `cond_burpee` | Burpee | conditioning | reps | — | next `cond_burpeetuck` |
| CO08 | `cond_burpeetuck` | Tuck-Jump Burpee | conditioning | reps | — | — |
| CO09 | `cond_burpeevest` | Weighted Vest Burpee | conditioning | **main**, loaded (total) | vest | `SLOTS.conditioning.loaded` |
| CO13 | `cond_boxjump` | Box Jump | conditioning | reps | box | offered by `cond_ropeless` |
| CO14 | `cond_broadjump` | Broad Jump | conditioning | reps | — | offered by `cond_ropeless` |

`cond_ropeweighted` needs only `jumpRope`, so the equipment check can't tell a weighted rope from a plain one. The data window marks this with a `ponytail:` comment: one token per implement is the upgrade, if it ever matters.

### REP_RANGES (added with the IDs in Stage 2)

| Range | IDs | Why |
|---|---|---|
| **1–5** | `skill_muscleup_turnover`, `skill_muscleup_band`, `skill_muscleup_full`, `pull_alt_onearm`, `skill_planche_pushup`, `skill_planche_boxpushup`, `skill_frontlever_raise` | Expert or single-limb: one clean rep is the first real milestone |
| **3–6** | `push_alt_onearmassist`, `push_alt_fingertip`, `push_alt_ringcross`, `skill_handstand_wallwalk`, `skill_handstand_cartwheel`, `skill_handstand_toetap`, `skill_muscleup_explosive`, `skill_backlever_skinthecat`, `skill_backlever_transition`, `pull_alt_c2b`, `pull_alt_towelgrip`, `squat_alt_jump`, `squat_alt_dragon`, `squat_alt_dragonassist`, `core_alt_t2b`, `core_alt_abwheelstand`, `cond_boxjump`, `cond_broadjump`, `cond_burpeetuck` | Power or near-maximal moves: quality falls off past about six |

These are product choices, like everything in `training.data.js`. No existing exercise is listed. Putting Explosive Push-up on 3–6 would move evidence thresholds under sessions you have already logged.

### Stage 1 — rules (W1–W3)

**1.1 · Pure rules (W1).** In `training.data.js`: `REP_RANGES = {}` with its header comment and the check in `rangeFor` (rep kinds only, ahead of the coverage and goal branches); `timed` copied into `rangeFor`'s hold output; `LOAD_STEP_KG.vest = 2.5`, `LOAD_STEP_KG.barbell = 5`. In `coverage.js`: `pick` skips a `conditioning` slot unless it's pinned (A5). In `check-training-data.js`: `REP_RANGES` keys must be real reps or unilateral exercises with a valid range, and `timed` only sits on a hold. Add cases to `check-training.js`: `REP_RANGES` ignores goal, `timed` passes through, and vest and barbell loads step 2.5 and 5 kg. Add one to `check-coverage.js`: an unpinned conditioning slot is never picked and a pinned one is.
*Moved out of W1 on 2026-10-06 (see the progress log).* The six tokens go to **W2**, because `check-training-data.js:303` fails any token without an `EQUIP_LABEL`, and labels are UI. The real `conditioning` slot goes to **W7**, complete with its exercises, because Program renders every coverage slot (`basalt.js:8300-8323`) and an empty one would read "Needs equipment you don't have" from Stage 1's commit until W7.
**Done when:** all eight Node checks pass and the new cases fail on the pre-change files.

**1.2 · Schema v7 and equipment (W2).** In `training.data.js`: the six tokens named in the EQUIPMENT header comment. In `check-training-data.js`: the six in `TOKENS` (the "used by an exercise" check covers only plan C5's four, so tokens no exercise uses yet pass). In `basalt.js`: `SCHEMA_VERSION = 7` with the comment; the six keys in `defaultState().equipment`, all `false`, and in `EQUIP_LABEL`; `toV7(state)` in `migrate`, after `toV5`, setting `nordicAnchor` to true when `hinge_4`, `hinge_5` or `hinge_6` is in `training.slots` or any logged session, and queuing the one-time *Equipment check* card (reuse v5's `equipmentCheck` mechanism) naming the six. Add labels in the equipment label map (`:5026`), the Settings equipment list and onboarding's equipment step. In `js/syncmerge.js`: confirm the six keys merge field-wise like the existing nine, and extend `check-syncmerge.js` with one case. Fixture: a v6 save with a Nordic session in `tools/fixtures/`, plus `check-workout.py` cases. A v6 save opens as v7 with `nordicAnchor: true`; one without Nordic history opens with it false and the card showing; a v7 save opened by the v6 build (`git show b0bae7a:fitness/basalt.js`) is read-only.
**Done when:** those cases pass, and the v6 → v7 round trip keeps every session, slot and PR byte-identical apart from `version`, `equipment` and the card flag.

**1.3 · Labels, Before you start, batch D (W3).** The `timed` wording: find every place a hold's range, target, history line or PR is printed (`grep -n '"hold"\|Hold\b\|hold' fitness/basalt.js fitness/directory.js`). Where the record is `timed`, print "for 30–45 s" / "longest set" instead of "hold" / "longest hold". Logic untouched. In `STYLE.md` and `check-exercise-content.js`, add `prereq`: a list of 1–3 items, the usual string rules, no numbers, **optional until W12**. In `directory.js`, render it first on the page as **Before you start**, and print nothing when it's absent. Add batch `d: ["conditioning"]` to the checker's `BATCHES`, create `fitness/content/batch-d.js` (`B.d = "complete"`, no guides yet), and add it to `index.html` and `PRECACHE`.
**Done when:** the checks pass, and a hand-made timed record (pinned in a scratch copy, never in the tree) renders "for", not "hold", on the Workout card, the history line and the directory page.

**1.4 · Review (R1).**

### Stage 2 — catalogue (W4–W7)

**2.1 (W4)** Group A. **2.2 (W5)** Group B. **2.3 (W6)** Group C, plus `nordicAnchor` on `hinge_4/5/6`. Before it lands, settle R1's F2 (progress log): a Nordic session that arrives by sync after a device's upgrade leaves that device's anchor off, so its hinge slot would read "gear missing". Decide whether a merge re-runs the inference, given that it would undo an untick made on purpose, and say so in the log. **2.4 (W7)** Group D, plus the slot itself: `conditioning: { label: "Conditioning", coverage: true, conditioning: true, trains: [], first: ["cond_jacks"], loaded: ["cond_burpeevest"] }`, added in the same edit as its 13 exercises. The checks must accept a slot with no `trains`: `check-training-data.js` section 10 and `check-coverage.js` exempt `conditioning: true` from "the slot's group is primary on every member". Program's coverage row reads `trains.map` for its "covers" line and pins (`basalt.js:8307-8310`), so give a conditioning slot its own line ("Conditioning — runs only on the days you pin it"). Also: `push_e2_weighted` and `dip_6` take a vest (Decisions), and section 8's plan C5 table (`check-training-data.js`) gets `dip_6`'s new list.
**Each is done when** `check-training-data.js`, `check-training.js`, `check-muscle-map.js`, `check-coverage.js` and `check-exercise-content.js` pass (the batch pending), and the progress log lists every `HOLD_RANGES` and `SKILL_STANDARD_SEC` value chosen and why.

**2.5 · Review (R2).** It checks the equipment AND/OR against each card's gear line, every coverage primary, the joint scores against the rubric, and the four existing exercises that gain a first step-up. Then it drives a workout to confirm that Swap, *Train this in my slot* and the directory list reach the not-offered moves.

### Stage 3 — guides (W8–W12)

**3.1 (W8)** Group A guides in `batch-a.js`. **3.2 (W9)** Group B in `batch-b.js`. **3.3 (W10)** Group C in `batch-b.js`. **3.4 (W11)** Group D in `batch-c1.js`, `batch-c2.js` and `batch-d.js`. Each guide follows `STYLE.md` and includes `prereq`. Write it from the card's Prerequisites, Setup, Cues, Errors and Pain lines in original words, and never from its Practice line. Each window marks its batch `"complete"` in the edit that writes its last guide.
**3.5 (W12)** `prereq` on the 150 existing guides. Where an existing ID has a card (the 89), use its Prerequisites line; otherwise use the rung before it on the ladder. Then make `prereq` **required** in the checker.
**Each is done when** `check-exercise-content.js` passes with the batch complete.

**3.6 · Review (R3).** It reads ten guides per window against STYLE.md, plus every "Before you start" on a skill track, and opens all 263 pages.

### Stage 4 — tracks and close-out (W13)

- **`SKILL_TRACKS`** (`basalt.js:9481`): add `backlever` (skin the cat → tuck → transition → advanced tuck → straddle negative → straddle → full negative → full) and `muscleup` (high pull-up → turnover → band-assisted → muscle-up), with intros in the house voice. Insert the new steps into `planche` (band lean before the lean; box tuck, box push-up and planche push-up after their rungs), `frontlever` (band, negative, one-leg, raise) and `handstand` (pike hold and elevated pike hold first; wall walk, cartwheel exit, toe tap and split hold in order; the three expert holds last). Check that `renderSkills` shows rep-kind entries correctly: *Variations* already lists rep exercises, so it should.
- **Mobility:** the routine `hip-rotation`, **Hip Rotation**, tag "Hips that won't turn", six steps from M04–M09 in original words, timed like the other routines. It uses the existing player and completion log, so the fitness view needs no change.
- **Running:** one sentence in the Sprint goal's `desc`: a short hill works for any sprint session. No plan change, since a plan rebuilt mid-way changes someone's current week.
- **README:** what the catalogue added and what it didn't. Two paragraphs for "the things most X get wrong": why variants are their own IDs, and why conditioning is never auto-picked.
- `CACHE_VERSION` bump; the v7 fixture; `check-workout.py` cases. Pin Conditioning and see it in the finisher. Open a muscle-up page and read 1–5. Open a timed page and read "for". Start the Hip Rotation routine and finish it once, with one completion logged.
**Done when:** every check in Part F passes.

**4.2 · Review (R4).**

## Part F — harness

| Check | Must pass after |
|---|---|
| `node tools/check-training.js`, `check-training-data.js`, `check-muscle-map.js`, `check-coverage.js`, `check-syncmerge.js`, `check-exercise-content.js`, `check-bodymap.js`, `check-androidupdate.js` | every window |
| `python3 tools/check-workout.py` (Playwright, ~4 min: hand it to the test-runner agent) | W2, W3, every review, W13 |
| Same scripts against `b0bae7a` | W1 and W2: each new case fails there, and passes here |

## Part G — chat windows, models and effort

### Rules for every window
1. **Set the model and effort first.** In the new window, run `/model <name>`, then `/effort <level>`, before pasting anything.
2. **Start in** `/home/talon/SyncedWork/Claude/Helth`, on branch `yellow-dude` (W1 creates it: `git checkout -b yellow-dude` from `fitness-plan` at `b0bae7a`).
3. **Read first:** this plan, `plans/PROGRESS-yellow-dude.md` (W1 creates it), and for Stage 2–3 windows the catalogue cards for your group in `yellow-dude-exercise-requirements.md`.
4. **Do only your step,** and stop at its "Done when".
5. **Back up first:** a timestamped backup of every file over ~200 lines before editing it.
6. **Prove it:** quote the check lines before and after. A claim that wasn't run is labelled unconfirmed.
7. **Don't commit or push.** The stage commit is yours, after each review.
8. **Ship it:** a changed precached file means a `CACHE_VERSION` bump. A new file goes in `PRECACHE` and `index.html`.
9. **Hand off:** append to the progress log: date, window, files changed, check lines, deviations from this plan, anything left over. Then stop.

**Run the windows one at a time.** Each starts from the previous window's tree. Stage 2 and 3 windows touch the same files (`basalt.js` EXTRA, `training.data.js`, `muscles.data.js`, the batch files), so two at once would collide.

| Window | Step | Model | Effort | Starts after | Why this setting |
|---|---|---|---|---|---|
| W1 | 1.1 pure rules | Opus 5.5 | high | You approve Stage 1 | Range precedence and the coverage pick: small diffs, subtle edges |
| W2 | 1.2 schema v7 and equipment | Opus 5.5 | **xhigh** | W1 | A migration over real history, inference from sessions, sync |
| W3 | 1.3 labels, Before you start, batch D | Sonnet 5.5 | high | W2 | Label sites to a fixed rule; a field to a fixed schema |
| R1 | 1.4 review | Opus 5.5 | high | W3 | Fresh eyes; verifies by running |
| — | **You:** read R1, commit Stage 1, approve Stage 2 | | | | |
| W4 | 2.1 Group A data (27) | Sonnet 5.5 | high | Stage 2 approved | Data to fixed tables; the checks catch typos |
| W5 | 2.2 Group B data (30) | Sonnet 5.5 | high | W4 | As W4 |
| W6 | 2.3 Group C data (29) and Nordic token | Sonnet 5.5 | high | W5 | As W4 |
| W7 | 2.4 Group D data (27) and the conditioning slot | Opus 5.5 | high | W6 | First no-muscle slot, timed and loaded holds together, coverage counts |
| R2 | 2.5 review | Opus 5.5 | high | W7 | As R1, plus each record against its card |
| — | **You:** read R2, commit Stage 2, approve Stage 3 | | | | |
| W8 | 3.1 Group A guides | Sonnet 5.5 | high | Stage 3 approved | Writing to STYLE.md; the checker gates it |
| W9 | 3.2 Group B guides | Sonnet 5.5 | high | W8 | As W8 |
| W10 | 3.3 Group C guides | Sonnet 5.5 | high | W9 | As W8 |
| W11 | 3.4 Group D guides | Sonnet 5.5 | high | W10 | As W8 |
| W12 | 3.5 Before you start × 150, then required | Sonnet 5.5 | medium | W11 | Short lists from the card or the ladder |
| R3 | 3.6 review | Opus 5.5 | high | W12 | Reads for coaching sense, not just the checker |
| — | **You:** read R3, commit Stage 3, approve Stage 4 | | | | |
| W13 | 4.1 tracks, Mobility, Running, close-out | Sonnet 5.5 | high | Stage 4 approved | UI and data to a fixed spec; README |
| R4 | 4.2 review | Opus 5.5 | high | W13 | As R1, all screens, both themes, 390 / 1440 / 1920 px |

`max` isn't assigned anywhere. If R1 sends W2 back, rerun it at `max`.

**What to paste.** Use the same text in every build window, changing only the window and the step:

```
You are window W8 of plans/PLAN-yellow-dude.md. Read that plan and
plans/PROGRESS-yellow-dude.md in full, then do step 3.1 and nothing else,
following Part G's rules. Append your progress entry when you're done, then
stop.
```

In W1 only, add: *Create branch `yellow-dude` from `fitness-plan` at `b0bae7a`, and create the progress log; it doesn't exist yet.*

Review windows get this instead:

```
You are review window R2 of plans/PLAN-yellow-dude.md. Read the plan, the
progress log and this stage's diff (git diff -- fitness js tools
service-worker.js index.html README.md). Re-run every check in Part F, drive
the changed screens yourself, and report findings ranked with the house
severity labels, each verified by running. Change no code.
```

**Moving machines:** Part H of `plans/PLAN-fitness-control-and-coverage.md`, with branch `yellow-dude` and base `fitness-plan`: `git bundle create ~/claude/yellow-dude.bundle fitness-plan..yellow-dude`.

## Evidence and assumptions

| Solid: measured, or in the code | Assumed: product choices you can change |
|---|---|
| 218 cards; 75 mapped IDs all live; 89 / 113 / 6 / 4 / 2 / 3 split — Node cross-reference, 2026-10-06 | Which new moves are offered and which are only browsable |
| `hinge_4/5/6` need no equipment; `push_e2_weighted` needs dumbbells — read from the loaded TRAINING_DATA | `REP_RANGES`, `HOLD_RANGES` and skill standards for the new IDs |
| Only main exercises may offer, and `next` can't leave its branch — `check-training-data.js:99-112` | Vest 2.5 kg and barbell 5 kg steps |
| `Coverage.pick` throws on `trains: []` — `coverage.js:131-135`, read, not run | That a partner counts as a Nordic anchor, so the token is usually true |
| The eight Node checks pass on `b0bae7a` + this working tree | Movement definitions for the 113: from card text, not footage |

The app can't judge technique, measure readiness or diagnose pain. "Before you start" is a self-check written down, and the page doesn't pretend otherwise.

## Out of scope
- **P24 Pike lift-off and C23 Crucifix crunch.** Both cards say "pending exact-variant review", and a guide can't be written for a movement nobody has defined. Watch the clip and describe it, and each becomes one more row in Group A or C.
- **C16 Leg raise.** A generic name for C15, C17 and C18, which are all in.
- **The catalogue's doses, video links, evidence labels and review dates.** See Decisions.
- **Multi-key setups,** and new setup values on existing exercises.
- **Readiness self-assessments as saved state.** "Before you start" is text; it never gates anything.
- **Phase illustrations** for the new IDs.
- **Changing an existing exercise's path, range or setup.** The only existing records that change are the equipment of `hinge_4/5/6`, `push_e2_weighted` and `dip_6`, and the appended `next` and `offer` lists named above.
- **A hill-sprint running plan.** One sentence, not a new plan.
- **Commits and pushes,** unless you ask.
