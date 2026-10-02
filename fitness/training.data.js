/* ============================================================================
   BASALT · TRAINING DATA  (pure data module — no UI, no storage, no App)
   ----------------------------------------------------------------------------
   What each exercise is FOR in a progression, so training.js can answer "what
   comes next" and "how many reps is enough" from one table instead of from the
   level number on the old tiers.

   · SLOTS            the eight things a workout trains, and where each starts
   · EXERCISES        id -> { slot, branch, kind, equipment, next, offer, … }
   · RANGES           rep ranges by kind, and the hold ranges per exercise
   · GOAL_RANGES      rep ranges by goal, and GOAL_REST_SEC, rest by goal
   · SETUPS           what changes difficulty without changing the movement
   · SUBSTITUTION_IDS pain-swap names -> the real exercise they correspond to
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
    pull_alt_passivehang: [30, 60]
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
     bottom of its range. */
  var LOAD_STEP_KG = { dumbbells: 2.5, kettlebells: 4 };

  /* Ready to step up needs this many comparable sessions, on different days,
     with every working set at the top of the range and an effort in
     READY_EFFORTS. "moderate" is the stored value of the button labelled
     "Just right". */
  var EVIDENCE_SESSIONS = 2;
  var READY_EFFORTS = ["easy", "moderate"];

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
    ] }
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
    dip:      { label: "Dip",      first: ["dip_1", "dip_alt_chair"], loaded: [], optional: true }
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
     ------------------------------------------------------------------------ */
  var EXERCISES = {};
  function x(id, slot, branch, kind, equipment, next, offer, extra) {
    var rec = { slot: slot, branch: branch, kind: kind, equipment: equipment,
                next: next, offer: offer || [] };
    if (extra) for (var k in extra) rec[k] = extra[k];
    EXERCISES[id] = rec;
  }
  var BAR = ["pullupBar"], BENCH = ["bench"], DB = ["dumbbells"], BWT = [];

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
  x("pull_alt_australian", "row", "main", "reps", BAR, [], ["skill_frontlever_1"]);
  x("pull_alt_row",  "row", "main", "loaded", DB, [], [], { loadMode: "perHand" });
  x("pull_e2_dbrow", "row", "main", "loaded", ["dumbbells", "bench"], [], [], { loadMode: "perHand", perSide: true });
  x("skill_frontlever_1", "row", "skill", "skill", BAR, ["skill_frontlever_2"]);
  x("skill_frontlever_2", "row", "skill", "skill", BAR, ["skill_frontlever_3"]);
  x("skill_frontlever_3", "row", "skill", "skill", BAR, ["skill_frontlever_4"]);
  x("skill_frontlever_4", "row", "skill", "skill", BAR, []);

  /* ---- PULL: vertical, needs a bar. Chin-up is a grip option, not a rung ---- */
  x("pull_1", "pull", "main", "hold", BAR, ["pull_2"]);
  x("pull_2", "pull", "main", "reps", BAR, ["pull_3", "pull_alt_bandassist"]);
  x("pull_3", "pull", "main", "eccentric", BAR, ["pull_4"]);
  x("pull_alt_bandassist", "pull", "main", "reps", BAR, ["pull_4"]);
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
  x("core_3", "core", "main", "hold", BENCH, [], ["core_4", "skill_lsit_1"]);
  x("core_4", "core", "skill", "hold", BENCH, ["core_5"]);
  x("core_5", "core", "skill", "eccentric", BENCH, ["core_6"]);
  x("core_6", "core", "skill", "reps", BENCH, []);
  x("skill_lsit_1", "core", "skill", "skill", BENCH, ["skill_lsit_2"]);
  x("skill_lsit_2", "core", "skill", "skill", BENCH, ["skill_lsit_3"]);
  x("skill_lsit_3", "core", "skill", "skill", BENCH, ["skill_vsit"]);
  x("skill_vsit",   "core", "skill", "skill", BENCH, []);

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
  x("dip_2",           "dip", "main", "reps", BAR,   ["dip_3"]);
  x("dip_3",           "dip", "main", "reps", BAR,   [], ["dip_4"]);
  x("dip_4", "dip", "skill", "reps", BAR, ["dip_5"]);
  x("dip_5", "dip", "skill", "reps", ["rings"], ["dip_6"]);
  x("dip_6", "dip", "skill", "loaded", DB, [], [], { loadMode: "total" });

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
     `lowerSec`. `goal` ("strength" | "size" | "both") picks GOAL_RANGES for
     the rep kinds; omitted, the range is RANGES'.
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
      return h ? { kind: e.kind, unit: "sec", sets: SETS, lo: h[0], hi: h[1], perSide: false } : null;
    }
    var r = RANGES[e.kind];
    if (GOAL_RANGES[goal] && GOAL_KINDS.indexOf(e.kind) >= 0 &&
        (goal !== "strength" || e.loadMode || SETUPS[id])) r = GOAL_RANGES[goal];
    var out = { kind: e.kind, unit: "reps", sets: SETS, lo: r[0], hi: r[1], perSide: perSide };
    if (e.kind === "eccentric") out.lowerSec = ECCENTRIC_LOWER_SEC.slice();
    return out;
  }

  window.TRAINING_DATA = {
    SETS: SETS, RANGES: RANGES, ECCENTRIC_LOWER_SEC: ECCENTRIC_LOWER_SEC,
    GOAL_RANGES: GOAL_RANGES, GOAL_KINDS: GOAL_KINDS, GOAL_REST_SEC: GOAL_REST_SEC,
    HOLD_RANGES: HOLD_RANGES, SKILL_ATTEMPTS: SKILL_ATTEMPTS,
    SKILL_STANDARD_SEC: SKILL_STANDARD_SEC, LOAD_STEP_KG: LOAD_STEP_KG,
    EVIDENCE_SESSIONS: EVIDENCE_SESSIONS, READY_EFFORTS: READY_EFFORTS,
    RECOVERY_BLOCK: RECOVERY_BLOCK,
    SETUPS: SETUPS, SLOTS: SLOTS, EXERCISES: EXERCISES,
    SUBSTITUTION_IDS: SUBSTITUTION_IDS, rangeFor: rangeFor
  };
})();
