/* ============================================================================
   BASALT · MUSCLE DATA  (pure data module — no UI, no state writes)
   ----------------------------------------------------------------------------
   The one thing BASALT could never say: which muscles an exercise trains.
   `pattern` is a MOVEMENT taxonomy, not an anatomical one — "pull" covers both a
   Dead Hang (grip) and a Chin-up (lats + biceps) — so this maps by exercise id.

   GLOBALS EXPOSED
     window.MUSCLE_GROUPS   ordered [{ key, label, short, region, weeklyTarget }]
     window.MUSCLE_MAP      exerciseId -> { primary[], secondary[], stabiliser[] }
     window.MUSCLE_FALLBACK pattern -> same shape (safety net for future ids)
     window.MUSCLE_RANKS    ordered rank names, index 0 = level 1

   THE TAXONOMY IS SIZED TO THIS APP
     An earlier draft imported 19 groups from a general-purpose fitness site.
     Five of them — neck, calves, adductors, traps, rear delts — have no
     exercise in this 84-movement calisthenics library that meaningfully trains
     them. A group that can never level up is a dead tile and an unearnable
     badge, so they are not groups here. Traps and rear delts fold into
     `upper_back`, which is honest for rows and scapular work.

     Adding a calf raise later? Add the exercise, map it to a new group, and
     `tools/check-muscle-map.js` will confirm the group is reachable. Nothing
     else needs to change: everything that says "every group" reads this list.

   CONTRIBUTION TIERS
     primary    1.00  — the movement's actual target
     secondary  0.40  — real assisting work
     stabiliser 0.15  — isometric bracing (the core in a squat, the grip in a
                        hang). This tier exists because pricing bracing at 0.4
                        made `abs` 59% spillover and levelled it ~3x faster than
                        chest on the app's own default program.
   ========================================================================== */
(function () {
  "use strict";

  /* --------------------------------------------------------------------------
     1) GROUPS
     `weeklyTarget` is in work units and is MEASURED, not guessed: it is what
     the app's own 4-day rotation (one push / pull / legs / fullbody per week,
     3 sets, steady-state BASE_REPS) actually delivers to that group. Ratio 1.0
     therefore means "you followed the program" by construction, instead of a
     size-class guess that left three groups permanently in a recovery warning.
     Regenerate with:  node tools/check-muscle-map.js --targets
     (which also reports any row that has drifted from the computed value)
     ------------------------------------------------------------------------ */
  var MUSCLE_GROUPS = [
    { key: "chest",       label: "Chest",            short: "Chest",  region: "front", weeklyTarget: 96 },
    { key: "delts_front", label: "Front delts",      short: "F.delt", region: "front", weeklyTarget: 62 },
    { key: "delts_side",  label: "Side delts",       short: "S.delt", region: "front", weeklyTarget: 10 },
    { key: "triceps",     label: "Triceps",          short: "Tri",    region: "back",  weeklyTarget: 120 },
    { key: "lats",        label: "Lats",             short: "Lats",   region: "back",  weeklyTarget: 48 },
    { key: "upper_back",  label: "Upper back",       short: "U.back", region: "back",  weeklyTarget: 48 },
    /* Assist-only: no movement in an 84-exercise calisthenics library targets
       the spinal erectors directly — they brace on hinges, rows and deep squats
       and that is the whole of it. The group is kept because that work is real
       and worth seeing, but it is marked so the audit and the balance badge
       treat it honestly rather than expecting a primary movement that does not
       and should not exist here. */
    { key: "lower_back",  label: "Lower back",       short: "L.back", region: "back",  weeklyTarget: 57, assist: true },
    { key: "biceps",      label: "Biceps",           short: "Bi",     region: "front", weeklyTarget: 19 },
    { key: "forearms",    label: "Forearms & grip",  short: "Grip",   region: "front", weeklyTarget: 19 },
    { key: "abs",         label: "Abs",              short: "Abs",    region: "front", weeklyTarget: 122 },
    /* Assist-only for the same reason: there is no side plank, Russian twist,
       windshield wiper or suitcase carry in this library. The obliques get
       genuine anti-rotation work from archer and one-arm variants, unilateral
       squats and every hollow-body hold — 19 exercises touch them — but none of
       those is an oblique exercise. */
    { key: "obliques",    label: "Obliques",         short: "Obl",    region: "front", weeklyTarget: 29, assist: true },
    { key: "glutes",      label: "Glutes",           short: "Glute",  region: "back",  weeklyTarget: 168 },
    { key: "quads",       label: "Quads",            short: "Quad",   region: "front", weeklyTarget: 84 },
    { key: "hamstrings",  label: "Hamstrings",       short: "Ham",    region: "back",  weeklyTarget: 118 }
  ];

  /* --------------------------------------------------------------------------
     2) RANKS — BASALT's own rock/forge vocabulary.
     These are NEVER shown without the underlying work-unit count beside them.
     "Granite" says nothing about 3,280 rep-units on its own, and a rank alone
     reads as a body assessment rather than a volume counter.
     ------------------------------------------------------------------------ */
  var MUSCLE_RANKS = [
    "Dormant", "Waking", "Kindled", "Tempered", "Forged",
    "Hardened", "Honed", "Granite", "Basalt", "Obsidian"
  ];

  /* --------------------------------------------------------------------------
     3) PATTERN FALLBACK — only reached if an exercise id is missing from the
     map below (e.g. a movement added to EXERCISE_DB before it was mapped).
     `tools/check-muscle-map.js` exists so this stays unreachable.
     ------------------------------------------------------------------------ */
  var MUSCLE_FALLBACK = {
    push:     { primary: ["chest", "triceps"],        secondary: ["delts_front"],             stabiliser: ["abs"] },
    pull:     { primary: ["lats", "upper_back"],      secondary: ["biceps", "forearms"],      stabiliser: ["abs"] },
    squat:    { primary: ["quads", "glutes"],         secondary: ["hamstrings"],              stabiliser: ["abs", "lower_back"] },
    hinge:    { primary: ["glutes", "hamstrings"],    secondary: ["lower_back"],              stabiliser: ["abs"] },
    core:     { primary: ["abs"],                     secondary: ["obliques"],                stabiliser: ["lower_back"] },
    shoulder: { primary: ["delts_front", "triceps"],  secondary: ["delts_side"],              stabiliser: ["abs"] },
    dip:      { primary: ["triceps", "chest"],        secondary: ["delts_front"],             stabiliser: ["abs"] },
    skill:    { primary: ["abs"],                     secondary: ["delts_front", "lats"],     stabiliser: ["forearms"] }
  };

  /* --------------------------------------------------------------------------
     4) THE MAP — every one of the 84 ids in EXERCISE_DB, explicitly.
     `m(primary, secondary, stabiliser)` keeps the rows readable.
     ------------------------------------------------------------------------ */
  var MUSCLE_MAP = {};
  function m(id, primary, secondary, stabiliser) {
    MUSCLE_MAP[id] = {
      primary: primary || [],
      secondary: secondary || [],
      stabiliser: stabiliser || []
    };
  }

  /* ---- PUSH: horizontal pressing ---- */
  m("push_1", ["chest", "triceps"], ["delts_front"], ["abs"]);
  m("push_2", ["chest", "triceps"], ["delts_front"], ["abs"]);
  m("push_3", ["triceps", "chest"], ["delts_front"], ["abs"]);              /* diamond → triceps lead */
  m("push_4", ["chest", "delts_front"], ["triceps"], ["abs"]);              /* decline → upper chest / shoulder */
  m("push_5", ["chest", "triceps"], ["delts_front"], ["abs", "obliques"]);  /* archer resists rotation */
  m("push_6", ["chest", "delts_front"], ["triceps"], ["abs"]);              /* pseudo planche → anterior delt */
  m("push_e2_weighted", ["chest", "triceps"], ["delts_front"], ["abs"]);
  m("push_e2_dbpress", ["chest"], ["triceps", "delts_front"], []);          /* supported — no bracing demand */
  m("push_alt_scapula", ["upper_back"], ["delts_front"], ["abs"]);          /* scapular protraction/retraction */
  m("push_alt_wide", ["chest"], ["delts_front", "triceps"], ["abs"]);
  m("push_alt_negative", ["chest", "triceps"], ["delts_front"], ["abs"]);
  m("push_alt_explosive", ["chest", "triceps"], ["delts_front"], ["abs"]);
  m("push_alt_onearm", ["chest", "triceps"], ["delts_front"], ["obliques", "abs"]);
  m("push_alt_tricep", ["triceps"], [], ["abs"]);                           /* isolation */

  /* ---- PULL: vertical + horizontal pulling ---- */
  m("pull_1", ["forearms"], ["lats"], ["upper_back"]);                      /* dead hang is grip work */
  m("pull_2", ["upper_back"], ["lats", "forearms"], []);                    /* scapular pull */
  m("pull_3", ["lats", "upper_back"], ["biceps", "forearms"], ["abs"]);
  m("pull_4", ["lats", "upper_back"], ["biceps", "forearms"], ["abs"]);
  m("pull_5", ["lats", "biceps"], ["upper_back", "forearms"], ["abs"]);     /* chin-up → biceps lead */
  m("pull_6", ["lats", "upper_back"], ["biceps", "forearms"], ["abs", "obliques"]);
  m("pull_e2_dbrow", ["upper_back", "lats"], ["biceps"], ["lower_back"]);
  m("pull_alt_passivehang", ["forearms"], [], ["upper_back"]);
  m("pull_alt_australian", ["upper_back"], ["lats", "biceps"], ["abs"]);    /* the one true rear-delt/row movement */
  m("pull_alt_bandassist", ["lats", "upper_back"], ["biceps", "forearms"], ["abs"]);
  m("pull_alt_row", ["upper_back", "lats"], ["biceps"], ["lower_back"]);
  m("pull_alt_tabledoor", ["upper_back"], ["lats", "biceps"], ["abs"]);
  m("pull_alt_towel", ["upper_back", "forearms"], ["lats", "biceps"], ["abs"]);

  /* ---- SQUAT: knee-dominant ---- */
  m("squat_1", ["quads", "glutes"], ["hamstrings"], ["abs"]);
  m("squat_2", ["quads", "glutes"], ["hamstrings"], ["abs"]);
  m("squat_3", ["quads", "glutes"], ["hamstrings"], ["abs", "obliques"]);   /* unilateral */
  m("squat_4", ["quads", "glutes"], ["hamstrings"], ["abs", "obliques"]);
  m("squat_5", ["quads", "glutes"], ["hamstrings"], ["abs", "obliques"]);
  m("squat_6", ["quads", "glutes"], ["hamstrings"], ["abs", "obliques"]);
  m("squat_e2_goblet", ["quads", "glutes"], ["hamstrings"], ["abs", "upper_back"]);
  m("squat_alt_narrow", ["quads"], ["glutes"], ["abs"]);
  m("squat_alt_deep", ["quads", "glutes"], ["hamstrings"], ["abs", "lower_back"]);
  m("squat_alt_cossack", ["quads", "glutes"], ["hamstrings"], ["abs", "obliques"]);
  m("squat_alt_assistedpistol", ["quads", "glutes"], ["hamstrings"], ["abs", "obliques"]);

  /* ---- HINGE: hip-dominant ---- */
  m("hinge_1", ["glutes"], ["hamstrings"], ["abs"]);
  m("hinge_2", ["glutes"], ["hamstrings"], ["abs"]);
  m("hinge_3", ["glutes"], ["hamstrings"], ["abs", "obliques"]);
  m("hinge_4", ["hamstrings"], ["glutes"], ["abs", "lower_back"]);          /* nordics are hamstring-led */
  m("hinge_5", ["hamstrings"], ["glutes"], ["abs", "lower_back"]);
  m("hinge_6", ["hamstrings"], ["glutes"], ["abs", "lower_back"]);
  m("hinge_e2_rdl", ["hamstrings", "glutes"], ["lower_back"], ["forearms", "upper_back"]);
  m("hinge_e2_swing", ["glutes", "hamstrings"], ["lower_back"], ["forearms", "abs"]);

  /* ---- CORE ---- */
  m("core_1", ["abs"], ["obliques"], ["lower_back", "delts_front"]);
  m("core_2", ["abs"], ["obliques"], ["quads"]);
  m("core_3", ["abs"], ["obliques"], ["triceps", "forearms"]);
  m("core_4", ["abs"], ["obliques", "quads"], ["triceps", "forearms"]);
  m("core_5", ["abs"], ["obliques", "lower_back"], []);
  m("core_6", ["abs"], ["obliques", "lower_back"], []);

  /* ---- SHOULDER: vertical pressing ---- */
  m("shoulder_1", ["delts_front", "triceps"], ["delts_side"], ["abs"]);
  m("shoulder_2", ["delts_front", "triceps"], ["delts_side"], ["abs"]);
  m("shoulder_3", ["delts_front"], ["delts_side", "triceps"], ["abs", "forearms"]);
  m("shoulder_4", ["delts_front"], ["delts_side", "triceps"], ["abs", "forearms"]);
  m("shoulder_5", ["delts_front", "triceps"], ["delts_side"], ["abs", "forearms"]);
  m("shoulder_6", ["delts_front", "triceps"], ["delts_side"], ["abs", "forearms"]);
  m("shoulder_e2_ohp", ["delts_front", "delts_side"], ["triceps"], ["abs"]);

  /* ---- DIP: triceps-led vertical pressing ---- */
  m("dip_1", ["triceps"], ["chest", "delts_front"], ["abs"]);
  m("dip_2", ["triceps", "chest"], ["delts_front"], ["abs"]);
  m("dip_3", ["triceps", "chest"], ["delts_front"], ["abs"]);
  m("dip_4", ["chest", "delts_front"], ["triceps"], ["abs"]);               /* korean dip → shoulder extension */
  m("dip_5", ["triceps", "chest"], ["delts_front"], ["abs", "forearms"]);   /* rings add stabilising demand */
  m("dip_6", ["triceps", "chest"], ["delts_front"], ["abs"]);
  m("dip_alt_chair", ["triceps"], ["chest", "delts_front"], ["abs"]);
  m("dip_alt_twochair", ["triceps", "chest"], ["delts_front"], ["abs"]);

  /* ---- SKILLS: straight-arm strength, mostly isometric ---- */
  m("skill_planche_1", ["delts_front"], ["chest", "abs"], ["forearms"]);
  m("skill_planche_2", ["delts_front", "abs"], ["chest"], ["forearms"]);
  m("skill_planche_3", ["delts_front", "abs"], ["chest"], ["forearms"]);
  m("skill_planche_4", ["delts_front", "abs"], ["chest", "glutes"], ["forearms"]);
  m("skill_planche_5", ["delts_front", "abs"], ["chest", "glutes"], ["forearms"]);
  m("skill_frontlever_1", ["lats", "abs"], ["upper_back"], ["forearms"]);
  m("skill_frontlever_2", ["lats", "abs"], ["upper_back"], ["forearms"]);
  m("skill_frontlever_3", ["lats", "abs"], ["upper_back", "glutes"], ["forearms"]);
  m("skill_frontlever_4", ["lats", "abs"], ["upper_back", "glutes"], ["forearms"]);
  m("skill_handstand_1", ["delts_front", "abs"], ["triceps"], ["forearms"]);
  m("skill_handstand_2", ["delts_front"], ["triceps", "abs"], ["forearms"]);
  m("skill_handstand_3", ["delts_front"], ["triceps", "abs"], ["forearms"]);
  m("skill_handstand_4", ["delts_front"], ["triceps", "abs"], ["forearms"]);
  m("skill_lsit_1", ["abs"], ["quads"], ["triceps"]);
  m("skill_lsit_2", ["abs"], ["quads", "obliques"], ["triceps", "forearms"]);
  m("skill_lsit_3", ["abs"], ["quads", "obliques"], ["triceps", "forearms"]);
  m("skill_vsit", ["abs"], ["quads", "obliques"], ["triceps", "forearms"]);

  /* --------------------------------------------------------------------------
     5) EXPORT
     ------------------------------------------------------------------------ */
  window.MUSCLE_GROUPS   = MUSCLE_GROUPS;
  window.MUSCLE_MAP      = MUSCLE_MAP;
  window.MUSCLE_FALLBACK = MUSCLE_FALLBACK;
  window.MUSCLE_RANKS    = MUSCLE_RANKS;

})();
