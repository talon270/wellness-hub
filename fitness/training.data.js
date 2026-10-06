/* ============================================================================
   BASALT · TRAINING DATA  (pure data module — no UI, no storage, no App)
   ----------------------------------------------------------------------------
   What each exercise is FOR in a progression, so training.js can answer "what
   comes next" and "how many reps is enough" from one table instead of from the
   level number on the old tiers.

   · SLOTS            the eight things a workout trains, and where each starts,
                      plus the coverage slots (Stage 3) that top up one muscle
   · EXERCISES        id -> { slot, branch, kind, equipment, next, offer, … }
   · RANGES           rep ranges by kind, and the hold ranges per exercise
   · REP_RANGES       a rep range for one exercise, ahead of goal and kind
   · GOAL_RANGES      rep ranges by goal, and GOAL_REST_SEC, rest by goal
   · COVERAGE_RANGES  rep ranges for coverage slots, which ignore the goal
   · SETUPS           what changes difficulty without changing the movement
   · SUBSTITUTION_IDS pain-swap names -> the real exercise they correspond to
   · GRIPS            palms / knuckles, and the push-ups that take a grip
   · SUBSTITUTION_SETUPS  pain-swap names that are a grip, not a movement
   · JOINT_STRESS     how hard each exercise loads each joint (1 or 2)
   · rangeFor(id, goal) the prescription range for one exercise

   GLOBALS EXPOSED
     window.TRAINING_DATA

   THE NUMBERS HERE ARE PRODUCT CHOICES, NOT VALIDATED THRESHOLDS
     6–12 reps, three sets, two sessions on different days, +2.5 kg per
     dumbbell: each is a default that has to start somewhere, and each is a
     named constant below so changing it is one edit. The Workout card says so
     next to the range. Nothing in this file is measured from the user.

   BRANCH
     "main"  the path a slot walks by default, from `SLOTS[slot].first`
             through `next`.
     "skill" optional — never compulsory. It holds the skill_* movements and
             also the variations (Wide Push-up, Cossack Squat…) that sit off the
             path. A main exercise offers branch entries through `offer`.

   EQUIPMENT
     Every entry in an `equipment` array is required (AND). An entry that is
     itself an array means any one of those will do: [["dumbbells",
     "kettlebells"]] needs one or the other. The tokens match
     APP_STATE.equipment. `tools/check-training-data.js` compares them to the
     tokens on EXERCISE_DB, which is where they came from.

     The tokens are pullupBar, dumbbells, bench, kettlebells and rings, plus
     four that split what "pull-up bar" used to stand for (F5): `bands`,
     `parallettes`, `dipBars` (parallel bars or a dip station) and `lowBar` (a
     bar or table edge at waist or hip height).

     Six more came with schema v7 (plans/PLAN-yellow-dude.md): `vest` (a
     weighted vest or a loaded backpack), `abWheel`, `jumpRope`, `box` (a
     sturdy box or step to sit to, step on or jump onto), `barbell` (with
     plates) and `nordicAnchor` (whatever holds your ankles for a Nordic
     curl: a strap, a partner, heavy furniture). Furniture itself — a chair,
     a table, a door, a wall — is never a token.

   COVERAGE SLOTS (plan D2)
     A slot with `coverage: true` tops up ONE muscle the eight main slots barely
     touch. `trains` names it, and every exercise in the slot lists that group as
     a primary mover in muscles.data.js, because the weekly floor counts
     performed sets where the group is primary. The word is "coverage", not
     "accessory": `accessory` already means Full length's extra movement. A
     coverage slot is a ladder like any other — the same evidence rules, the
     same steps — whose first rung needs no equipment; its loaded options sit
     beside the path and its band moves sit at the end of it. Its exercises are
     `pattern: "accessory"` in the DB and `acc_<slot>_<slug>` here.
   ========================================================================== */
(function () {
  "use strict";

  /* --------------------------------------------------------------------------
     1) CONSTANTS
     ------------------------------------------------------------------------ */
  var SETS = 3;

  /* Reps by kind. Wide enough that the bottom is reachable on a bad day and
     the top is a real finish; narrow enough that "reached the top" means
     something. Eccentrics are shorter because each rep is a 3–5 s lowering. */
  var RANGES = {
    reps:       [6, 12],
    loaded:     [6, 12],
    unilateral: [6, 12],   // per side
    eccentric:  [3, 6]
  };
  var ECCENTRIC_LOWER_SEC = [3, 5];

  /* Rep ranges by goal (plan D2). Only the plain rep kinds change. Eccentrics
     stay 3–6 under every goal, because each rep is a 3–5 s lowering and 15 of
     them is endurance, not size. Holds and skills keep their own standard.
     Strength's 4–8 needs somewhere to go once 8 is easy — a harder setup or a
     heavier load — so a movement with neither keeps 6–12 under Strength. */
  var GOAL_RANGES = {
    strength: [4, 8],
    size:     [8, 15],
    both:     [6, 12]
  };
  var GOAL_KINDS = ["reps", "loaded", "unilateral"];

  /* Coverage work is top-up volume, not a goal: 10–15 reps whatever your goal,
     and 12–20 for the three slots that are done light (the rotator cuff, the
     neck and the shins). A rep range is where an exercise stops being
     stabilising work and starts being a fatiguing one, and that doesn't move
     with the goal that suits a push-up. Holds keep their own range below. */
  var COVERAGE_RANGES = { standard: [10, 15], light: [12, 20] };
  var COVERAGE_LIGHT_SLOTS = ["cuff", "neck", "shin"];

  /* One exercise's own rep range, for moves no one meets at 6–12 on the day
     they step to them: a muscle-up, a planche push-up, a box jump. It beats
     the goal and coverage ranges, because a first muscle-up is one rep under
     every goal. Only the plain rep kinds (reps, unilateral) take one:
     eccentrics already sit at 3–6, and loaded work progresses by weight.
     Empty until the catalogue adds its first entry; the check refuses a key
     that isn't a reps or unilateral exercise. */
  var REP_RANGES = {};

  /* Rest after a rep set for a NEW profile, by goal. A profile that already
     exists keeps the rest it has: changing your goal never rewrites a setting
     you may have tuned. Rest after holds doesn't change with goal. */
  var GOAL_REST_SEC = { strength: 150, size: 120, both: 120 };

  /* Holds are per exercise, not per kind: 60 s is a respectable plank and 20 s
     a respectable L-Sit. [start, advance-at] mirrors engine.holdStart() and
     engine.HOLD_ADVANCE_AT in basalt.js, and the check fails if they drift.
     pull_alt_passivehang has no engine entry; its 60 s comes from its own
     readiness text and its 30 s start is the engine's default for a hold with
     no advance point. */
  var HOLD_RANGES = {
    core_1:               [30, 60],   // Plank
    core_2:               [15, 30],   // Hollow Body Hold
    core_3:               [15, 30],   // Tuck L-Sit
    core_4:               [10, 20],   // L-Sit
    pull_1:               [25, 45],   // Dead Hang
    shoulder_3:           [25, 45],   // Wall Handstand Hold
    pull_alt_passivehang: [30, 60],
    /* Coverage holds (Stage 3). Start and advance point are guesses in the same
       spirit as the rest: an isometric into a door frame and a loaded carry
       fatigue faster than a plank, and the neck is held short on purpose. The
       four-way neck isometric is seconds per direction. */
    acc_lateral_iso:   [15, 30],
    acc_neck_chintuck: [10, 20],
    acc_neck_fourway:  [8, 15],
    acc_grip_wring:    [15, 30],
    acc_grip_towelhang:[15, 30],
    acc_grip_farmer:   [20, 40],
    /* Lower body and trunk (step 3.2). Same spirit: the wall sit starts like a
       plank; the side planks and Copenhagen planks are harder per second than a
       front plank, so they start shorter. Side planks, Copenhagen planks and the
       suitcase hold are timed per side: a set is the same hold on each side. */
    acc_quad_wallsit:     [30, 60],
    acc_adductor_copknee: [15, 30],
    acc_adductor_copfoot: [10, 20],
    acc_antirot_knees:    [20, 40],
    acc_antirot_sideplank:[20, 40],
    acc_antirot_leg:      [15, 30],
    acc_antirot_suitcase: [20, 40]
  };

  /* A skill is judged against its own standard, taken from the exercise's
     readiness text, and is never a compulsory step. A skill whose text names
     no number is null: the card never offers a step from it. */
  var SKILL_ATTEMPTS = [3, 5];
  var SKILL_STANDARD_SEC = {
    skill_planche_1: 30,  skill_planche_2: 20,  skill_planche_3: 15,
    skill_planche_4: 15,  skill_planche_5: null,
    skill_frontlever_1: 20, skill_frontlever_2: 15, skill_frontlever_3: 10,
    skill_frontlever_4: null,
    skill_handstand_1: 45, skill_handstand_2: 45, skill_handstand_3: null,
    skill_handstand_4: 30,
    skill_lsit_1: 30, skill_lsit_2: 30, skill_lsit_3: 20, skill_vsit: null
  };

  /* Per implement, not per exercise: a dumbbell comes in 2.5 kg steps, a
     kettlebell in 4 kg ones. Loaded work steps up by this and drops back to the
     bottom of its range. A vest (or a dip belt, or a loaded backpack) steps
     like a dumbbell; a barbell by 5 kg, a 2.5 kg plate a side. All four are
     guesses at the common case, and the weights you own override them. */
  var LOAD_STEP_KG = { dumbbells: 2.5, kettlebells: 4, vest: 2.5, barbell: 5 };

  /* Ready to step up needs this many comparable sessions, on different days,
     with every working set at the top of the range and an effort in
     READY_EFFORTS. "moderate" is the stored value of the button labelled
     "Just right". */
  var EVIDENCE_SESSIONS = 2;
  var READY_EFFORTS = ["easy", "moderate"];

  /* Step back needs more than a falling total: one rep less a session is
     noise. Totals fall twice AND the latest isn't at the top on every set AND
     either the latest total is at least this share below the best of the
     three, or a set fell below the bottom of the range. */
  var REDUCE_MIN_DROP = 0.10;

  /* Both evidence sessions at this multiple of the top on every set (20 reps
     on a 6–12 range) offer two steps instead of one. */
  var DOUBLE_STEP_AT = 1.5;

  /* Recovery block (plan D3). Product choices, not validated thresholds: a
     week, sets x 0.6 rounded with a floor of 1 (3 -> 2), and it is offered
     after two slots read Reduce within a week, or after a sharp flag. */
  var RECOVERY_BLOCK = { days: 7, setFactor: 0.6, minSets: 1, offerSlots: 2, offerWindowDays: 7 };

  /* --------------------------------------------------------------------------
     2) SETUPS
     Only what changes difficulty. Values run easiest first, so the next setup
     is the next entry and the end of the list falls through to `next`.
     ------------------------------------------------------------------------ */
  var BODY_ANGLE = [
    { id: "kneesBent", label: "Knees bent" },
    { id: "straight",  label: "Body straight" }
  ];
  /* A band's tension is a setup, light to heavy, wherever it loads a movement
     (plan C5). Backwards from pull_alt_bandassist, where a heavy band helps. */
  var BAND_TENSION = [
    { id: "light",  label: "Light band" },
    { id: "medium", label: "Medium band" },
    { id: "heavy",  label: "Heavy band" }
  ];
  var SETUPS = {
    push_incline: { key: "surface", values: [
      { id: "counter", label: "Counter", cm: 90 },
      { id: "table",   label: "Table",   cm: 75 },
      { id: "chair",   label: "Chair",   cm: 45 },
      { id: "step",    label: "Step",    cm: 20 }
    ] },
    pull_alt_tabledoor:  { key: "bodyAngle", values: BODY_ANGLE },
    pull_alt_towel:      { key: "bodyAngle", values: BODY_ANGLE },
    pull_alt_australian: { key: "bodyAngle", values: BODY_ANGLE },
    pull_alt_bandassist: { key: "band", values: [
      { id: "heavy",  label: "Heavy band" },
      { id: "medium", label: "Medium band" },
      { id: "light",  label: "Light band" }
    ] },
    /* Coverage (Stage 3). The door-frame curl gets harder by leaning further
       back; the underhand row by straightening the body, as every row does. */
    acc_curl_doorframe: { key: "lean", values: [
      { id: "slight",   label: "Slight lean" },
      { id: "moderate", label: "Moderate lean" },
      { id: "deep",     label: "Deep lean" }
    ] },
    acc_curl_invrow:      { key: "bodyAngle", values: BODY_ANGLE },
    acc_curl_band:        { key: "band", values: BAND_TENSION },
    acc_lateral_band:     { key: "band", values: BAND_TENSION },
    acc_reardelt_bandpull:{ key: "band", values: BAND_TENSION },
    acc_reardelt_facepull:{ key: "band", values: BAND_TENSION },
    acc_cuff_bander:      { key: "band", values: BAND_TENSION },
    acc_traps_band:       { key: "band", values: BAND_TENSION },
    /* Lower body and trunk (step 3.2). Feet farther from the wall lean the body
       further back, which is what makes the tibialis raise harder. */
    acc_shin_wall: { key: "lean", values: [
      { id: "close", label: "Feet close to the wall" },
      { id: "mid",   label: "Feet a half-stride out" },
      { id: "far",   label: "Feet far from the wall" }
    ] },
    acc_quad_spanish:       { key: "band", values: BAND_TENSION },
    acc_hamstring_bandcurl: { key: "band", values: BAND_TENSION },
    acc_adductor_band:      { key: "band", values: BAND_TENSION },
    acc_abductor_bandwalk:  { key: "band", values: BAND_TENSION },
    acc_abductor_clamshell: { key: "band", values: BAND_TENSION },
    acc_antirot_pallof:     { key: "band", values: BAND_TENSION }
  };

  /* --------------------------------------------------------------------------
     3) SLOTS
     `first` lists the entry points in order of preference; the builder takes
     the first whose equipment you own. `loaded` lists the weighted options
     that run beside the bodyweight path. `none` is the explicit "no
     equipment-free option": a slot has one of those or this, never neither.
     ------------------------------------------------------------------------ */
  var SLOTS = {
    push:     { label: "Push",     first: ["push_1"],
                loaded: ["push_e2_weighted", "push_e2_dbpress"] },
    row:      { label: "Row",      first: ["pull_alt_tabledoor", "pull_alt_towel"],
                loaded: ["pull_alt_row", "pull_e2_dbrow"] },
    pull:     { label: "Pull",     first: ["pull_1"], loaded: [],
                none: "Needs a pull-up bar. Without one, the row slot carries pulling." },
    squat:    { label: "Squat",    first: ["squat_1"], loaded: ["squat_e2_goblet"] },
    hinge:    { label: "Hinge",    first: ["hinge_1"],
                loaded: ["hinge_e2_rdl", "hinge_e2_swing"] },
    core:     { label: "Core",     first: ["core_1"], loaded: [] },
    shoulder: { label: "Shoulder", first: ["shoulder_1"], loaded: ["shoulder_e2_ohp"] },
    dip:      { label: "Dip",      first: ["dip_1", "dip_alt_chair"], loaded: [], optional: true },

    /* Coverage slots (Stage 3). `trains` is the one group each tops up. Upper
       body, neck and grip are step 3.1; lower body and trunk are step 3.2. */
    curl:     { label: "Curl",          coverage: true, trains: ["biceps"],
                first: ["acc_curl_doorframe"], loaded: ["acc_curl_db", "acc_curl_hammer"] },
    lateral:  { label: "Lateral raise", coverage: true, trains: ["delts_side"],
                first: ["acc_lateral_iso"], loaded: ["acc_lateral_db", "acc_lateral_leanaway"] },
    reardelt: { label: "Rear delt",     coverage: true, trains: ["delts_rear"],
                first: ["acc_reardelt_tdraise"], loaded: ["acc_reardelt_dbfly"] },
    cuff:     { label: "Rotator cuff",  coverage: true, trains: ["rotator_cuff"],
                first: ["acc_cuff_walllift"], loaded: ["acc_cuff_sidelying"] },
    traps:    { label: "Traps",         coverage: true, trains: ["traps"],
                first: ["acc_traps_pike"], loaded: ["acc_traps_shrug"] },
    neck:     { label: "Neck",          coverage: true, trains: ["neck"],
                first: ["acc_neck_chintuck"], loaded: [] },
    grip:     { label: "Grip",          coverage: true, trains: ["forearms"],
                first: ["acc_grip_wring"], loaded: ["acc_grip_wristcurl", "acc_grip_revwristcurl"] },
    quad:     { label: "Quad",          coverage: true, trains: ["quads"],
                first: ["acc_quad_wallsit"], loaded: ["acc_quad_dbsplit"] },
    hamstring:{ label: "Hamstring",     coverage: true, trains: ["hamstrings"],
                first: ["acc_hamstring_slidecurl"], loaded: ["acc_hamstring_slrdldb"] },
    calf:     { label: "Calf",          coverage: true, trains: ["calves"],
                first: ["acc_calf_raise"], loaded: ["acc_calf_weighted"] },
    shin:     { label: "Shin",          coverage: true, trains: ["shins"],
                first: ["acc_shin_wall"], loaded: [] },
    adductor: { label: "Adductor",      coverage: true, trains: ["adductors"],
                first: ["acc_adductor_sidelying"], loaded: [] },
    abductor: { label: "Abductor",      coverage: true, trains: ["abductors"],
                first: ["acc_abductor_sidelying"], loaded: [] },
    antirot:  { label: "Anti-rotation", coverage: true, trains: ["obliques"],
                first: ["acc_antirot_knees"], loaded: [] },
    backext:  { label: "Back extension",coverage: true, trains: ["lower_back"],
                first: ["acc_backext_birddog"], loaded: ["acc_backext_goodmorning"] }
  };

  /* --------------------------------------------------------------------------
     4) EXERCISES
     x(id, slot, branch, kind, equipment, next, offer, extra)
       kind   reps | loaded | unilateral | eccentric | hold | skill
       next   main-path successors, or this branch's own chain, in preference
              order; [] at the end of a path
       offer  optional branch entries shown when this exercise is mastered
       extra  { loadMode: "perHand" | "total", perSide: true } for loaded work.
              perHand: the number is what each hand holds. total: the whole
              load, a vest or one kettlebell held in both hands.
              { timed: true } on a hold that is continuous movement, not a
              still position (jump rope, flutter kicks). Every rule treats it
              as a hold; only the words on screen change, so a rope set never
              reads "hold".
     ------------------------------------------------------------------------ */
  var EXERCISES = {};
  function x(id, slot, branch, kind, equipment, next, offer, extra) {
    var rec = { slot: slot, branch: branch, kind: kind, equipment: equipment,
                next: next, offer: offer || [] };
    if (extra) for (var k in extra) rec[k] = extra[k];
    EXERCISES[id] = rec;
  }
  var BAR = ["pullupBar"], BENCH = ["bench"], DB = ["dumbbells"], BWT = [];
  /* The tokens that replaced "pull-up bar" as a catch-all (F5), and the two
     any-of lists. Front levers hang from a bar or rings; an L-Sit needs
     something to press down on, a bench or parallettes. */
  var LOWBAR = ["lowBar"], DIPBARS = ["dipBars"], BANDS = ["bands"];
  var HANG = [["pullupBar", "rings"]], SEAT = [["bench", "parallettes"]];

  /* ---- PUSH: wall → incline (counter, table, chair, step) → floor → bench ---- */
  x("push_1",        "push", "main", "reps", BWT,   ["push_incline"]);
  x("push_incline",  "push", "main", "reps", BWT,   ["push_2"]);
  x("push_2",        "push", "main", "reps", BWT,   ["push_3"]);
  x("push_3",        "push", "main", "reps", BWT,   ["push_4"]);
  x("push_4",        "push", "main", "reps", BENCH, [], ["push_5", "skill_planche_1"]);
  x("push_5",        "push", "skill", "unilateral", BWT, ["push_6", "push_alt_onearm"]);
  x("push_6",        "push", "skill", "reps", BWT,  []);
  x("push_alt_onearm",    "push", "skill", "unilateral", BWT, []);
  x("push_alt_scapula",   "push", "skill", "reps", BWT,   []);
  x("push_alt_wide",      "push", "skill", "reps", BWT,   []);
  x("push_alt_negative",  "push", "skill", "eccentric", BWT, []);
  x("push_alt_explosive", "push", "skill", "reps", BWT,   []);
  x("push_alt_tricep",    "push", "skill", "reps", BENCH, []);
  x("push_e2_weighted", "push", "main", "loaded", DB, [], [], { loadMode: "total" });
  x("push_e2_dbpress",  "push", "main", "loaded", ["dumbbells", "bench"], [], [], { loadMode: "perHand" });
  x("skill_planche_1", "push", "skill", "skill", BWT, ["skill_planche_2"]);
  x("skill_planche_2", "push", "skill", "skill", BWT, ["skill_planche_3"]);
  x("skill_planche_3", "push", "skill", "skill", BWT, ["skill_planche_4"]);
  x("skill_planche_4", "push", "skill", "skill", BWT, ["skill_planche_5"]);
  x("skill_planche_5", "push", "skill", "skill", BWT, []);

  /* ---- ROW: the horizontal pull, new in Stage 2 ---- */
  x("pull_alt_tabledoor",  "row", "main", "reps", BWT, ["pull_alt_australian"]);
  x("pull_alt_towel",      "row", "main", "reps", BWT, ["pull_alt_australian"]);
  x("pull_alt_australian", "row", "main", "reps", [["lowBar", "rings"]], [], ["skill_frontlever_1"]);
  x("pull_alt_row",  "row", "main", "loaded", DB, [], [], { loadMode: "perHand" });
  x("pull_e2_dbrow", "row", "main", "loaded", ["dumbbells", "bench"], [], [], { loadMode: "perHand", perSide: true });
  x("skill_frontlever_1", "row", "skill", "skill", HANG, ["skill_frontlever_2"]);
  x("skill_frontlever_2", "row", "skill", "skill", HANG, ["skill_frontlever_3"]);
  x("skill_frontlever_3", "row", "skill", "skill", HANG, ["skill_frontlever_4"]);
  x("skill_frontlever_4", "row", "skill", "skill", HANG, []);

  /* ---- PULL: vertical, needs a bar. Chin-up is a grip option, not a rung ---- */
  x("pull_1", "pull", "main", "hold", BAR, ["pull_2"]);
  x("pull_2", "pull", "main", "reps", BAR, ["pull_3", "pull_alt_bandassist"]);
  x("pull_3", "pull", "main", "eccentric", BAR, ["pull_4"]);
  x("pull_alt_bandassist", "pull", "main", "reps", ["pullupBar", "bands"], ["pull_4"]);
  x("pull_4", "pull", "main", "reps", BAR, [], ["pull_5", "pull_6"]);
  x("pull_5", "pull", "skill", "reps", BAR, ["pull_6"]);
  x("pull_6", "pull", "skill", "unilateral", BAR, []);
  x("pull_alt_passivehang", "pull", "skill", "hold", BAR, []);

  /* ---- SQUAT: bodyweight → pause → split squat → rear foot raised ---- */
  x("squat_1",     "squat", "main", "reps", BWT, ["squat_2"]);
  x("squat_2",     "squat", "main", "reps", BWT, ["squat_split"]);
  x("squat_split", "squat", "main", "unilateral", BWT, ["squat_3"]);
  x("squat_3",     "squat", "main", "unilateral", BENCH, [], ["squat_4", "squat_alt_assistedpistol"]);
  x("squat_4",     "squat", "skill", "unilateral", BWT, ["squat_5"]);
  x("squat_alt_assistedpistol", "squat", "skill", "unilateral", BWT, ["squat_5"]);
  x("squat_5",     "squat", "skill", "unilateral", BWT, ["squat_6"]);
  x("squat_6",     "squat", "skill", "loaded", [["dumbbells", "kettlebells"]], [], [], { loadMode: "total", perSide: true });
  x("squat_alt_narrow",  "squat", "skill", "reps", BWT, []);
  x("squat_alt_deep",    "squat", "skill", "reps", BWT, []);
  x("squat_alt_cossack", "squat", "skill", "unilateral", BWT, []);
  x("squat_e2_goblet", "squat", "main", "loaded", [["kettlebells", "dumbbells"]], [], [], { loadMode: "total" });

  /* ---- HINGE: the Nordic branch is optional, never compulsory ---- */
  x("hinge_1", "hinge", "main", "reps", BWT, ["hinge_2"]);
  x("hinge_2", "hinge", "main", "reps", BENCH, ["hinge_3"]);
  x("hinge_3", "hinge", "main", "unilateral", BENCH, [], ["hinge_4"]);
  x("hinge_4", "hinge", "skill", "eccentric", BWT, ["hinge_5"]);
  x("hinge_5", "hinge", "skill", "reps", BWT, ["hinge_6"]);
  x("hinge_6", "hinge", "skill", "reps", BWT, []);
  x("hinge_e2_rdl",   "hinge", "main", "loaded", DB, [], [], { loadMode: "perHand" });
  x("hinge_e2_swing", "hinge", "main", "loaded", ["kettlebells"], [], [], { loadMode: "total" });

  /* ---- CORE ---- */
  x("core_1", "core", "main", "hold", BWT, ["core_2"]);
  x("core_2", "core", "main", "hold", BWT, ["core_3"]);
  x("core_3", "core", "main", "hold", SEAT, [], ["core_4", "skill_lsit_1"]);
  x("core_4", "core", "skill", "hold", SEAT, ["core_5"]);
  x("core_5", "core", "skill", "eccentric", BENCH, ["core_6"]);
  x("core_6", "core", "skill", "reps", BENCH, []);
  x("skill_lsit_1", "core", "skill", "skill", SEAT, ["skill_lsit_2"]);
  x("skill_lsit_2", "core", "skill", "skill", SEAT, ["skill_lsit_3"]);
  x("skill_lsit_3", "core", "skill", "skill", SEAT, ["skill_vsit"]);
  x("skill_vsit",   "core", "skill", "skill", SEAT, []);

  /* ---- SHOULDER ---- */
  x("shoulder_1", "shoulder", "main", "reps", BWT, ["shoulder_2"]);
  x("shoulder_2", "shoulder", "main", "reps", BENCH, [], ["shoulder_3", "skill_handstand_1"]);
  x("shoulder_3", "shoulder", "skill", "hold", BWT, ["shoulder_4"]);
  x("shoulder_4", "shoulder", "skill", "reps", BWT, ["shoulder_5"]);
  x("shoulder_5", "shoulder", "skill", "eccentric", BWT, ["shoulder_6"]);
  x("shoulder_6", "shoulder", "skill", "reps", BWT, []);
  x("shoulder_e2_ohp", "shoulder", "main", "loaded", DB, [], [], { loadMode: "perHand" });
  x("skill_handstand_1", "shoulder", "skill", "skill", BWT, ["skill_handstand_2"]);
  x("skill_handstand_2", "shoulder", "skill", "skill", BWT, ["skill_handstand_3"]);
  x("skill_handstand_3", "shoulder", "skill", "skill", BWT, ["skill_handstand_4"]);
  x("skill_handstand_4", "shoulder", "skill", "skill", BWT, []);

  /* ---- DIP (optional slot): bench or chair → two chairs or bar → parallel bars ---- */
  x("dip_1",           "dip", "main", "reps", BENCH, ["dip_alt_twochair", "dip_2"]);
  x("dip_alt_chair",   "dip", "main", "reps", BWT,   ["dip_alt_twochair", "dip_2"]);
  x("dip_alt_twochair","dip", "main", "reps", BWT,   ["dip_3"]);
  x("dip_2",           "dip", "main", "reps", LOWBAR, ["dip_3"]);
  x("dip_3",           "dip", "main", "reps", DIPBARS, [], ["dip_4"]);
  x("dip_4", "dip", "skill", "reps", LOWBAR, ["dip_5"]);
  x("dip_5", "dip", "skill", "reps", ["rings"], ["dip_6"]);
  /* Weighted on the same bars as the dips before it: a weight alone isn't a
     place to dip. */
  x("dip_6", "dip", "skill", "loaded", ["dipBars", ["dumbbells", "kettlebells"]], [], [], { loadMode: "total" });

  /* ---- COVERAGE, upper body (Stage 3 · step 3.1) ----
     Each path runs equipment-free first, and a rung you can't do is walked
     past (stepUp routes round it), so a user with only bands goes from the
     first rung to the band move. Loaded options sit beside the path, in
     SLOTS[x].loaded. A slot's `trains` group is a primary on every member. */
  /* curl → biceps */
  x("acc_curl_doorframe", "curl", "main", "reps", BWT, ["acc_curl_invrow"]);
  x("acc_curl_invrow",    "curl", "main", "reps", [["lowBar", "rings"]], ["acc_curl_band"]);
  x("acc_curl_band",      "curl", "main", "reps", BANDS, []);
  x("acc_curl_db",        "curl", "main", "loaded", DB, [], [], { loadMode: "perHand" });
  x("acc_curl_hammer",    "curl", "main", "loaded", DB, [], [], { loadMode: "perHand" });
  /* lateral → side delts */
  x("acc_lateral_iso",      "lateral", "main", "hold", BWT, ["acc_lateral_band"]);
  x("acc_lateral_band",     "lateral", "main", "reps", BANDS, []);
  x("acc_lateral_db",       "lateral", "main", "loaded", DB, [], [], { loadMode: "perHand" });
  x("acc_lateral_leanaway", "lateral", "main", "loaded", DB, [], [], { loadMode: "perHand", perSide: true });
  /* reardelt → rear delts */
  x("acc_reardelt_tdraise",   "reardelt", "main", "reps", BWT, ["acc_reardelt_snowangel"]);
  x("acc_reardelt_snowangel", "reardelt", "main", "reps", BWT, ["acc_reardelt_bandpull"]);
  x("acc_reardelt_bandpull",  "reardelt", "main", "reps", BANDS, ["acc_reardelt_facepull"]);
  x("acc_reardelt_facepull",  "reardelt", "main", "reps", BANDS, []);
  x("acc_reardelt_dbfly",     "reardelt", "main", "loaded", DB, [], [], { loadMode: "perHand" });
  /* cuff → rotator cuff */
  x("acc_cuff_walllift",  "cuff", "main", "reps", BWT, ["acc_cuff_pronew"]);
  x("acc_cuff_pronew",    "cuff", "main", "reps", BWT, ["acc_cuff_bander"]);
  x("acc_cuff_bander",    "cuff", "main", "reps", BANDS, []);
  x("acc_cuff_sidelying", "cuff", "main", "loaded", DB, [], [], { loadMode: "perHand", perSide: true });
  /* traps → traps */
  x("acc_traps_pike",  "traps", "main", "reps", BWT, ["acc_traps_band"]);
  x("acc_traps_band",  "traps", "main", "reps", BANDS, []);
  x("acc_traps_shrug", "traps", "main", "loaded", [["dumbbells", "kettlebells"]], [], [], { loadMode: "perHand" });
  /* neck → neck */
  x("acc_neck_chintuck",  "neck", "main", "hold", BWT, ["acc_neck_fourway"]);
  x("acc_neck_fourway",   "neck", "main", "hold", BWT, ["acc_neck_lyingraise"]);
  x("acc_neck_lyingraise","neck", "main", "reps", BWT, []);
  /* grip → forearms. The farmer hold is the first catalogue hold with a load:
     seconds at a weight. */
  x("acc_grip_wring",       "grip", "main", "hold", BWT, ["acc_grip_towelhang"]);
  x("acc_grip_towelhang",   "grip", "main", "hold", BAR, ["acc_grip_farmer"]);
  x("acc_grip_farmer",      "grip", "main", "hold", [["dumbbells", "kettlebells"]], [], [], { loadMode: "perHand" });
  x("acc_grip_wristcurl",   "grip", "main", "loaded", DB, [], [], { loadMode: "perHand" });
  x("acc_grip_revwristcurl","grip", "main", "loaded", DB, [], [], { loadMode: "perHand" });

  /* ---- COVERAGE, lower body and trunk (Stage 3 · step 3.2) ----
     Same shape as above. Three moves are off the path (`branch: "skill"`, never
     kind "skill"): a bodyweight single-leg RDL, a bent-knee calf raise and the
     dead bug, each offered by a main rung. The suitcase hold is the first hold
     you load by the side: seconds at a weight, one hand. */
  /* quad → quads */
  x("acc_quad_wallsit", "quad", "main", "hold", BWT, ["acc_quad_revlunge"]);
  x("acc_quad_revlunge","quad", "main", "unilateral", BWT, ["acc_quad_stepup"]);
  x("acc_quad_stepup",  "quad", "main", "unilateral", BWT, ["acc_quad_sissy"]);
  x("acc_quad_sissy",   "quad", "main", "reps", BWT, ["acc_quad_spanish"]);
  x("acc_quad_spanish", "quad", "main", "reps", BANDS, []);
  x("acc_quad_dbsplit", "quad", "main", "loaded", DB, [], [], { loadMode: "perHand", perSide: true });
  /* hamstring → hamstrings */
  x("acc_hamstring_slidecurl",  "hamstring", "main", "reps", BWT, ["acc_hamstring_slidecurl1"], ["acc_hamstring_slrdl"]);
  x("acc_hamstring_slidecurl1", "hamstring", "main", "unilateral", BWT, ["acc_hamstring_bandcurl"]);
  x("acc_hamstring_bandcurl",   "hamstring", "main", "reps", BANDS, []);
  x("acc_hamstring_slrdl",      "hamstring", "skill", "unilateral", BWT, []);
  x("acc_hamstring_slrdldb",    "hamstring", "main", "loaded", DB, [], [], { loadMode: "total", perSide: true });
  /* calf → calves */
  x("acc_calf_raise",    "calf", "main", "reps", BWT, ["acc_calf_single"], ["acc_calf_bentknee"]);
  x("acc_calf_single",   "calf", "main", "unilateral", BWT, []);
  x("acc_calf_bentknee", "calf", "skill", "reps", BWT, []);
  x("acc_calf_weighted", "calf", "main", "loaded", [["dumbbells", "kettlebells"]], [], [], { loadMode: "total", perSide: true });
  /* shin → shins */
  x("acc_shin_wall",   "shin", "main", "reps", BWT, ["acc_shin_single"]);
  x("acc_shin_single", "shin", "main", "unilateral", BWT, []);
  /* adductor → adductors. A chair is not a token, like the two-chair dip. */
  x("acc_adductor_sidelying", "adductor", "main", "unilateral", BWT, ["acc_adductor_copknee"]);
  x("acc_adductor_copknee",   "adductor", "main", "hold", BWT, ["acc_adductor_copfoot"]);
  x("acc_adductor_copfoot",   "adductor", "main", "hold", BWT, ["acc_adductor_band"]);
  x("acc_adductor_band",      "adductor", "main", "unilateral", BANDS, []);
  /* abductor → abductors */
  x("acc_abductor_sidelying", "abductor", "main", "unilateral", BWT, ["acc_abductor_sideplank"]);
  x("acc_abductor_sideplank", "abductor", "main", "unilateral", BWT, ["acc_abductor_bandwalk", "acc_abductor_clamshell"]);
  x("acc_abductor_bandwalk",  "abductor", "main", "reps", BANDS, []);
  x("acc_abductor_clamshell", "abductor", "main", "unilateral", BANDS, []);
  /* antirot → obliques. The dead bug is offered from the first rung because it
     asks nothing of the wrist or shoulder, which every side plank does. */
  x("acc_antirot_knees",     "antirot", "main", "hold", BWT, ["acc_antirot_sideplank"], ["acc_antirot_deadbug"]);
  x("acc_antirot_sideplank", "antirot", "main", "hold", BWT, ["acc_antirot_leg"]);
  x("acc_antirot_leg",       "antirot", "main", "hold", BWT, ["acc_antirot_pallof", "acc_antirot_suitcase"]);
  x("acc_antirot_deadbug",   "antirot", "skill", "reps", BWT, []);
  x("acc_antirot_pallof",    "antirot", "main", "unilateral", BANDS, []);
  x("acc_antirot_suitcase",  "antirot", "main", "hold", [["dumbbells", "kettlebells"]], [], [], { loadMode: "total" });
  /* backext → lower back */
  x("acc_backext_birddog",     "backext", "main", "unilateral", BWT, ["acc_backext_prone"]);
  x("acc_backext_prone",       "backext", "main", "reps", BWT, ["acc_backext_revhyper"]);
  x("acc_backext_revhyper",    "backext", "main", "reps", BENCH, []);
  x("acc_backext_goodmorning", "backext", "main", "loaded", DB, [], [], { loadMode: "total" });

  /* --------------------------------------------------------------------------
     5) PAIN SUBSTITUTIONS
     A substitution is a name in SUBSTITUTIONS (basalt.js) with a cue. Where a
     real exercise of that name exists, applying the swap moves to it and its
     history belongs to it. Names with no entry here — Fist Push-up, Box Squat,
     Dead Bug, the "(light)" and "(half)" forms — keep the original exercise
     with the substitute's cue and earn no evidence.

     "Negative Pull-up (slow)" is the DB's spelling for pull_3; the plan wrote
     it without the suffix, and the check fails on any key that isn't a real
     substitution name.
     ------------------------------------------------------------------------ */
  var SUBSTITUTION_IDS = {
    "Wall Push-up":            "push_1",
    "Incline Push-up":         "push_incline",
    "Wide Push-up":            "push_alt_wide",
    "Scapular Pull":           "pull_2",
    "Negative Pull-up (slow)": "pull_3",
    "Inverted Row":            "pull_alt_australian",
    "Glute Bridge":            "hinge_1",
    "Hip Thrust":              "hinge_2",
    "Single-Leg Hip Thrust":   "hinge_3",
    "Plank":                   "core_1",
    "Pike Push-up":            "shoulder_1"
  };

  /* --------------------------------------------------------------------------
     6) rangeFor(id, goal)
     { kind, unit, sets, lo, hi, perSide } for one exercise, or null for an
     unknown id. A skill returns lo null, hi its standard (null if it has none)
     and `attempts` in place of a fixed set count. An eccentric also carries
     `lowerSec`, and a timed hold `timed: true`. An exercise in REP_RANGES
     takes that range whatever the goal; otherwise `goal` ("strength" |
     "size" | "both") picks GOAL_RANGES for the rep kinds, and omitted, the
     range is RANGES'.
     ------------------------------------------------------------------------ */
  function rangeFor(id, goal) {
    var e = EXERCISES[id];
    if (!e) return null;
    var perSide = e.kind === "unilateral" || !!e.perSide;
    if (e.kind === "skill") {
      return { kind: e.kind, unit: "sec", sets: SETS, attempts: SKILL_ATTEMPTS.slice(),
               lo: null, hi: SKILL_STANDARD_SEC[id], perSide: false };
    }
    if (e.kind === "hold") {
      var h = HOLD_RANGES[id];
      if (!h) return null;
      var hold = { kind: e.kind, unit: "sec", sets: SETS, lo: h[0], hi: h[1], perSide: false };
      if (e.timed) hold.timed = true;
      return hold;
    }
    var r = RANGES[e.kind];
    if (REP_RANGES[id] && (e.kind === "reps" || e.kind === "unilateral")) r = REP_RANGES[id];
    else if (SLOTS[e.slot] && SLOTS[e.slot].coverage && GOAL_KINDS.indexOf(e.kind) >= 0)
      r = COVERAGE_RANGES[COVERAGE_LIGHT_SLOTS.indexOf(e.slot) >= 0 ? "light" : "standard"];
    else if (GOAL_RANGES[goal] && GOAL_KINDS.indexOf(e.kind) >= 0 &&
        (goal !== "strength" || e.loadMode || SETUPS[id])) r = GOAL_RANGES[goal];
    var out = { kind: e.kind, unit: "reps", sets: SETS, lo: r[0], hi: r[1], perSide: perSide };
    if (e.kind === "eccentric") out.lowerSec = ECCENTRIC_LOWER_SEC.slice();
    return out;
  }

  /* --------------------------------------------------------------------------
     7) GRIPS, JOINT STRESS AND PAIN-SWAP SETUPS  (Stage 2 · control)
     ------------------------------------------------------------------------ */

  /* Knuckles are a grip, not a rung (plan C1): the same movement done on two
     knuckles, wrist straight. They count as slightly harder than palms, so the
     order below is the order of difficulty, and a palms prescription is
     satisfied by a knuckles session but not the other way round. Only the six
     push-ups where a fist on the floor is a real option are listed: Diamond,
     Archer and Pseudo Planche stay on palms because the hand position is the
     point of them. `relief` is how many points of JOINT_STRESS the grip takes
     off a joint. */
  var GRIPS = {
    values: [
      { id: "palms",    label: "Palms" },
      { id: "knuckles", label: "Knuckles", relief: { wrist: 1 } }
    ],
    exercises: ["push_1", "push_incline", "push_2", "push_4", "push_alt_wide", "push_alt_negative"]
  };

  /* The pain swaps that name a grip, not a different movement. Applying one
     keeps the exercise and sets this setup; it is still a pain swap, so it is
     still flagged and still not evidence. */
  var SUBSTITUTION_SETUPS = {
    "Fist Push-up":               { grip: "knuckles" },
    "Knuckle/Parallette Push-up": { grip: "knuckles" }
  };

  /* How hard each exercise loads each joint, for the limitation filter
     (plan C3). A product rubric applied by judgment, not a measurement, and the
     app says so wherever it uses it:
       2  heavy or end-range load: most of your bodyweight through the joint,
          a loaded position near the end of its range, or a long hold on it
       1  moderate: a share of bodyweight, or a mid-range load
       —  incidental; left out
     Scored at the setup the exercise starts at, so a limit never hides the
     gentle end of a ladder; the harder setups further along it (a lower
     incline, a lighter band) are not re-scored. Skills and holds are scored at
     the standard in HOLD_RANGES / SKILL_STANDARD_SEC. */
  var JOINT_STRESS = {
    // push
    push_1:  { wrist: 1, shoulder: 1 },
    push_incline: { wrist: 1, elbow: 1, shoulder: 1 },
    push_2:  { wrist: 2, elbow: 1, shoulder: 1 },
    push_3:  { wrist: 2, elbow: 2, shoulder: 1 },
    push_4:  { wrist: 2, elbow: 1, shoulder: 2 },
    push_5:  { wrist: 2, elbow: 2, shoulder: 2 },
    push_6:  { wrist: 2, elbow: 2, shoulder: 2 },
    push_e2_weighted: { wrist: 2, elbow: 1, shoulder: 1 },
    push_e2_dbpress:  { wrist: 1, elbow: 1, shoulder: 1 },
    push_alt_scapula:   { wrist: 2, shoulder: 1 },
    push_alt_wide:      { wrist: 2, elbow: 1, shoulder: 2 },
    push_alt_negative:  { wrist: 2, elbow: 2, shoulder: 1 },
    push_alt_explosive: { wrist: 2, elbow: 2, shoulder: 1 },
    push_alt_onearm:    { wrist: 2, elbow: 2, shoulder: 2 },
    push_alt_tricep:    { wrist: 1, elbow: 2, shoulder: 1 },
    skill_planche_1: { wrist: 2, elbow: 1, shoulder: 2 },
    skill_planche_2: { wrist: 2, elbow: 2, shoulder: 2 },
    skill_planche_3: { wrist: 2, elbow: 2, shoulder: 2 },
    skill_planche_4: { wrist: 2, elbow: 2, shoulder: 2 },
    skill_planche_5: { wrist: 2, elbow: 2, shoulder: 2 },
    // pull and row
    pull_1:  { elbow: 1, shoulder: 2 },
    pull_2:  { elbow: 1, shoulder: 1 },
    pull_3:  { elbow: 2, shoulder: 2 },
    pull_4:  { elbow: 2, shoulder: 2 },
    pull_5:  { elbow: 2, shoulder: 1 },
    pull_6:  { elbow: 2, shoulder: 2 },
    pull_alt_passivehang: { elbow: 1, shoulder: 2 },
    pull_alt_bandassist:  { elbow: 1, shoulder: 1 },
    pull_alt_tabledoor:   { elbow: 1, shoulder: 1 },
    pull_alt_towel:       { elbow: 1, shoulder: 1 },
    pull_alt_australian:  { elbow: 1, shoulder: 1 },
    pull_alt_row:  { elbow: 1, shoulder: 1, lowerBack: 2 },
    pull_e2_dbrow: { elbow: 1, shoulder: 1, lowerBack: 1 },
    skill_frontlever_1: { elbow: 1, shoulder: 2 },
    skill_frontlever_2: { elbow: 2, shoulder: 2 },
    skill_frontlever_3: { elbow: 2, shoulder: 2 },
    skill_frontlever_4: { elbow: 2, shoulder: 2 },
    // squat
    squat_1: { hip: 1, knee: 1, ankle: 1 },
    squat_2: { hip: 1, knee: 2, ankle: 1 },
    squat_split: { hip: 1, knee: 2, ankle: 1 },
    squat_3: { hip: 2, knee: 2, ankle: 1 },
    squat_4: { hip: 1, knee: 2, ankle: 1 },
    squat_5: { hip: 2, knee: 2, ankle: 2 },
    squat_6: { hip: 2, knee: 2, ankle: 2, lowerBack: 1 },
    squat_alt_narrow:  { hip: 1, knee: 2, ankle: 1 },
    squat_alt_deep:    { hip: 2, knee: 2, ankle: 2, lowerBack: 1 },
    squat_alt_cossack: { hip: 2, knee: 1, ankle: 1 },
    squat_alt_assistedpistol: { hip: 1, knee: 2, ankle: 1 },
    squat_e2_goblet: { hip: 1, knee: 2, ankle: 1, lowerBack: 1 },
    // hinge
    hinge_1: { hip: 1, lowerBack: 1 },
    hinge_2: { hip: 1, lowerBack: 1 },
    hinge_3: { hip: 2, lowerBack: 1 },
    hinge_4: { knee: 2 },
    hinge_5: { knee: 2 },
    hinge_6: { knee: 2 },
    hinge_e2_rdl:   { hip: 1, lowerBack: 2 },
    hinge_e2_swing: { hip: 2, lowerBack: 2, shoulder: 1 },
    // core
    core_1: { shoulder: 1, lowerBack: 1 },
    core_2: { hip: 1, lowerBack: 1 },
    core_3: { wrist: 2, elbow: 1, shoulder: 1, hip: 1 },
    core_4: { wrist: 2, elbow: 1, shoulder: 2, hip: 1 },
    core_5: { neck: 1, shoulder: 2, lowerBack: 2 },
    core_6: { neck: 1, shoulder: 2, lowerBack: 2 },
    skill_lsit_1: { wrist: 2, elbow: 1, shoulder: 1 },
    skill_lsit_2: { wrist: 2, elbow: 1, shoulder: 1, hip: 1 },
    skill_lsit_3: { wrist: 2, elbow: 1, shoulder: 2, hip: 1 },
    skill_vsit:   { wrist: 2, elbow: 1, shoulder: 2, hip: 2, lowerBack: 1 },
    // shoulder
    shoulder_1: { wrist: 2, elbow: 1, shoulder: 2 },
    shoulder_2: { wrist: 2, elbow: 1, shoulder: 2 },
    shoulder_3: { wrist: 2, shoulder: 2 },
    shoulder_4: { wrist: 2, shoulder: 2, lowerBack: 1 },
    shoulder_5: { wrist: 2, elbow: 2, shoulder: 2, neck: 1 },
    shoulder_6: { wrist: 2, elbow: 2, shoulder: 2, neck: 1 },
    shoulder_e2_ohp: { wrist: 1, elbow: 1, shoulder: 2, lowerBack: 1 },
    skill_handstand_1: { wrist: 2, shoulder: 2 },
    skill_handstand_2: { wrist: 2, shoulder: 2, lowerBack: 1 },
    skill_handstand_3: { wrist: 2, shoulder: 2, lowerBack: 1 },
    skill_handstand_4: { wrist: 2, shoulder: 2, lowerBack: 1 },
    // dip
    dip_1: { wrist: 1, elbow: 1, shoulder: 2 },
    dip_alt_chair:    { wrist: 1, elbow: 1, shoulder: 2 },
    dip_alt_twochair: { wrist: 1, elbow: 2, shoulder: 2 },
    dip_2: { wrist: 1, elbow: 2, shoulder: 2 },
    dip_3: { wrist: 1, elbow: 2, shoulder: 2 },
    dip_4: { wrist: 1, elbow: 2, shoulder: 2 },
    dip_5: { wrist: 1, elbow: 2, shoulder: 2 },
    dip_6: { wrist: 1, elbow: 2, shoulder: 2 },
    // coverage, upper body (step 3.1). Scored at the start rung like the rest;
    // the neck is 2 across the slot so that "avoid neck" excludes all of it.
    acc_curl_doorframe: { elbow: 1, wrist: 1 },
    acc_curl_invrow:    { elbow: 1, shoulder: 1, wrist: 1 },
    acc_curl_band:      { elbow: 1, wrist: 1 },
    acc_curl_db:        { elbow: 1 },
    acc_curl_hammer:    { elbow: 1, wrist: 1 },
    acc_lateral_iso:      { shoulder: 1 },
    acc_lateral_band:     { shoulder: 1 },
    acc_lateral_db:       { shoulder: 2 },
    acc_lateral_leanaway: { shoulder: 2 },
    acc_reardelt_tdraise:   { shoulder: 1 },
    acc_reardelt_snowangel: { shoulder: 1, lowerBack: 1 },
    acc_reardelt_bandpull:  { shoulder: 1 },
    acc_reardelt_facepull:  { shoulder: 1 },
    acc_reardelt_dbfly:     { shoulder: 1, lowerBack: 2 },
    acc_cuff_walllift:  { shoulder: 1 },
    acc_cuff_pronew:    { shoulder: 1 },
    acc_cuff_bander:    { shoulder: 1 },
    acc_cuff_sidelying: { shoulder: 1 },
    acc_traps_pike:  { wrist: 2, shoulder: 1 },
    acc_traps_band:  { shoulder: 1, neck: 1 },
    acc_traps_shrug: { shoulder: 1, neck: 1 },
    acc_neck_chintuck:   { neck: 2 },
    acc_neck_fourway:    { neck: 2 },
    acc_neck_lyingraise: { neck: 2 },
    acc_grip_wring:       { wrist: 1, elbow: 1 },
    acc_grip_towelhang:   { elbow: 1, shoulder: 2, wrist: 1 },
    acc_grip_farmer:      { wrist: 1, shoulder: 1, lowerBack: 1 },
    acc_grip_wristcurl:   { wrist: 2, elbow: 1 },
    acc_grip_revwristcurl:{ wrist: 2, elbow: 1 },
    // coverage, lower body and trunk (step 3.2). Same rubric, scored at the start
    // setup. A rung's stress climbs with the ladder, so "avoid knee" leaves the
    // wall sit, "avoid lower back" leaves the bird dog and the prone extension.
    acc_quad_wallsit:  { hip: 1, knee: 1 },
    acc_quad_revlunge: { hip: 1, knee: 2, ankle: 1 },
    acc_quad_stepup:   { hip: 1, knee: 2, ankle: 1 },
    acc_quad_sissy:    { hip: 1, knee: 2, ankle: 2 },
    acc_quad_dbsplit:  { hip: 1, knee: 2, ankle: 1, lowerBack: 1 },
    acc_quad_spanish:  { hip: 1, knee: 2 },
    acc_hamstring_slidecurl:  { hip: 1, knee: 1, lowerBack: 1 },
    acc_hamstring_slidecurl1: { hip: 1, knee: 2, lowerBack: 1 },
    acc_hamstring_slrdl:      { hip: 1, knee: 1, lowerBack: 1, ankle: 1 },
    acc_hamstring_slrdldb:    { hip: 2, knee: 1, lowerBack: 2, ankle: 1 },
    acc_hamstring_bandcurl:   { knee: 1, lowerBack: 1 },
    acc_calf_raise:    { ankle: 1 },
    acc_calf_single:   { ankle: 2 },
    acc_calf_bentknee: { knee: 1, ankle: 1 },
    acc_calf_weighted: { ankle: 2 },
    acc_shin_wall:   { ankle: 1 },
    acc_shin_single: { ankle: 2 },
    acc_adductor_sidelying: { hip: 1 },
    acc_adductor_copknee:   { hip: 2, knee: 1, shoulder: 1 },
    acc_adductor_copfoot:   { hip: 2, knee: 1, shoulder: 2 },
    acc_adductor_band:      { hip: 1 },
    acc_abductor_sidelying: { hip: 1 },
    acc_abductor_sideplank: { hip: 1, shoulder: 2, lowerBack: 1 },
    acc_abductor_bandwalk:  { hip: 1, knee: 1, ankle: 1 },
    acc_abductor_clamshell: { hip: 1, knee: 1 },
    acc_antirot_knees:     { shoulder: 1, hip: 1, lowerBack: 1 },
    acc_antirot_sideplank: { shoulder: 2, hip: 1, lowerBack: 1 },
    acc_antirot_leg:       { shoulder: 2, hip: 1, lowerBack: 1 },
    acc_antirot_deadbug:   { hip: 1, lowerBack: 1 },
    acc_antirot_pallof:    { shoulder: 1, lowerBack: 1 },
    acc_antirot_suitcase:  { wrist: 1, shoulder: 1, lowerBack: 2 },
    acc_backext_birddog:     { wrist: 1, shoulder: 1, knee: 1, lowerBack: 1 },
    acc_backext_prone:       { neck: 1, lowerBack: 1 },
    acc_backext_revhyper:    { hip: 1, lowerBack: 2 },
    acc_backext_goodmorning: { hip: 1, lowerBack: 2 }
  };
  var JOINTS = ["wrist", "elbow", "shoulder", "neck", "lowerBack", "hip", "knee", "ankle"];

  window.TRAINING_DATA = {
    SETS: SETS, RANGES: RANGES, REP_RANGES: REP_RANGES, ECCENTRIC_LOWER_SEC: ECCENTRIC_LOWER_SEC,
    GOAL_RANGES: GOAL_RANGES, GOAL_KINDS: GOAL_KINDS, GOAL_REST_SEC: GOAL_REST_SEC,
    COVERAGE_RANGES: COVERAGE_RANGES, COVERAGE_LIGHT_SLOTS: COVERAGE_LIGHT_SLOTS,
    HOLD_RANGES: HOLD_RANGES, SKILL_ATTEMPTS: SKILL_ATTEMPTS,
    SKILL_STANDARD_SEC: SKILL_STANDARD_SEC, LOAD_STEP_KG: LOAD_STEP_KG,
    EVIDENCE_SESSIONS: EVIDENCE_SESSIONS, READY_EFFORTS: READY_EFFORTS,
    REDUCE_MIN_DROP: REDUCE_MIN_DROP, DOUBLE_STEP_AT: DOUBLE_STEP_AT,
    RECOVERY_BLOCK: RECOVERY_BLOCK,
    SETUPS: SETUPS, SLOTS: SLOTS, EXERCISES: EXERCISES,
    SUBSTITUTION_IDS: SUBSTITUTION_IDS, SUBSTITUTION_SETUPS: SUBSTITUTION_SETUPS,
    GRIPS: GRIPS, JOINT_STRESS: JOINT_STRESS, JOINTS: JOINTS, rangeFor: rangeFor
  };
})();
