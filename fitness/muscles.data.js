/* ============================================================================
   BASALT · MUSCLE DATA  (pure data module — no UI, no state writes)
   ----------------------------------------------------------------------------
   The one thing BASALT could never say: which muscles an exercise trains.
   `pattern` is a MOVEMENT taxonomy, not an anatomical one — "pull" covers both a
   Dead Hang (grip) and a Chin-up (lats + biceps) — so this maps by exercise id.

   GLOBALS EXPOSED
     window.MUSCLE_GROUPS   ordered [{ key, label, short, region }]
     window.MUSCLE_MAP      exerciseId -> { primary[], secondary[], stabiliser[] }
     window.MUSCLE_FALLBACK pattern -> same shape (safety net for future ids)
     window.MUSCLE_WEEK     the model behind each group's weekly target (1b)
     window.MUSCLE_FLOORS   the weekly floor of direct sets per group (1c)
     window.MUSCLE_RANKS    ordered rank names, index 0 = level 1

   THE TAXONOMY IS 22 GROUPS, EACH WITH A MOVEMENT THAT TRAINS IT
     The first 14 were sized to the 86-movement library: five groups an imported
     taxonomy had brought in (neck, calves, adductors, traps, rear delts) were
     cut because nothing in it trained them, and a group that can never level up
     is a dead tile and an unearnable badge. Stage 3 (plan D1) brought them back
     together with the rotator cuff, abductors and shins, because it wrote the
     movements that train them: 64 coverage exercises, each in a slot that tops
     up one group (training.data.js SLOTS[x].coverage). So the rule is the same
     and the library moved: a group exists only if some exercise has it as a
     PRIMARY mover. `tools/check-muscle-map.js` enforces that, and there is no
     `assist` exemption any more.

     Adding a group later? Add the exercise, map it to the group, and the check
     will confirm the group is reachable. Everything that says "every group"
     reads this list.

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
     A group has no stored weekly target. It is worked out when the Muscles
     view draws, from the template you train on (section 1b), so the target
     cannot describe a schedule the app has stopped offering.
     ------------------------------------------------------------------------ */
  var MUSCLE_GROUPS = [
    { key: "chest",       label: "Chest",            short: "Chest",  region: "front" },
    { key: "delts_front", label: "Front delts",      short: "F.delt", region: "front" },
    { key: "delts_side",  label: "Side delts",       short: "S.delt", region: "front" },
    { key: "triceps",     label: "Triceps",          short: "Tri",    region: "back" },
    { key: "lats",        label: "Lats",             short: "Lats",   region: "back" },
    { key: "upper_back",  label: "Upper back",       short: "U.back", region: "back" },
    /* Was assist-only (it braced on hinges, rows and deep squats and nothing
       led with it). Stage 3's back-extension slot gives it a primary. */
    { key: "lower_back",  label: "Lower back",       short: "L.back", region: "back" },
    { key: "biceps",      label: "Biceps",           short: "Bi",     region: "front" },
    { key: "forearms",    label: "Forearms & grip",  short: "Grip",   region: "front" },
    { key: "abs",         label: "Abs",              short: "Abs",    region: "front" },
    /* Was assist-only for the same reason: there was no side plank, Pallof
       press or suitcase hold. Stage 3's anti-rotation slot adds them. */
    { key: "obliques",    label: "Obliques",         short: "Obl",    region: "front" },
    { key: "glutes",      label: "Glutes",           short: "Glute",  region: "back" },
    { key: "quads",       label: "Quads",            short: "Quad",   region: "front" },
    { key: "hamstrings",  label: "Hamstrings",       short: "Ham",    region: "back" },
    /* Stage 3 (plan D1). Traps and rear delts used to fold into upper_back; they
       are their own groups now, so a row credits them separately. */
    { key: "delts_rear",  label: "Rear delts",       short: "R.delt", region: "back" },
    { key: "traps",       label: "Traps",            short: "Traps",  region: "back" },
    { key: "rotator_cuff",label: "Rotator cuff",     short: "Cuff",   region: "back" },
    { key: "neck",        label: "Neck",             short: "Neck",   region: "front" },
    { key: "abductors",   label: "Abductors",        short: "Abd",    region: "back" },
    { key: "adductors",   label: "Adductors",        short: "Add",    region: "front" },
    { key: "calves",      label: "Calves",           short: "Calf",   region: "back" },
    { key: "shins",       label: "Shins",            short: "Shin",   region: "front" }
  ];

  /* --------------------------------------------------------------------------
     1b) THE WEEKLY TARGET MODEL
     "On target" has to mean "you followed your template", or the bars argue
     with the program: a guessed size-class target once left three groups
     permanently in a recovery warning. So the target is what a week of the
     active template delivers, worked out by App.muscles.weeklyTargets from
       · the template's slots (engine.slotsFor, so a profile with no pull-up bar
         rows where the pull would be, and a slot you left off adds nothing),
       · its sessions a week (perWeek), split evenly across its day types
         because they alternate,
       · `sets` working sets of each slot at `unitsPerSet`,
       · the slot's MUSCLE_FALLBACK profile at the contribution tiers above.
     Profiles come from the pattern, not from the exercise you are on now, so
     a target does not move when you climb from Wall Push-up to Archer Push-up.
     The standard session is used: Short and Full length show as being under or
     over it, rather than moving the goalposts with them.

     `unitsPerSet` is a steady-state assumption, not a measurement of you:
     reps per set, and for core a 30 s hold at 5 s = 1 unit (sessionVolume's
     conversion), which is 6. The row is a slot, not a pattern: its exercises are
     catalogued under `pull`, so it reads the pull profile.
     tools/check-muscle-map.js runs the same arithmetic over every template
     read from basalt.js and fails if a slot has no entry here or a group is
     never trained.
     ------------------------------------------------------------------------ */
  var MUSCLE_WEEK = {
    sets: 3,
    unitsPerSet: { push: 12, row: 8, pull: 8, squat: 14, hinge: 14, core: 6, shoulder: 8, dip: 8 },
    profileOf: { row: "pull" }
  };

  /* --------------------------------------------------------------------------
     1c) WEEKLY FLOORS — direct sets, not template-relative targets
     The weekly target above is built from the template's own slots, so a group
     the template neglects gets a tiny target and reads "On target" (plan F7).
     A floor is the other gauge: the least DIRECT work a group should get in 7
     days, counted in performed sets where the group is a primary mover.

       sets  the floor. 6 where a coverage slot tops the group up; 3 for the
             rotator cuff, neck and shins, which are done at 12–20 reps and
             aren't built up the way a muscle is; 3 for the seven groups only
             the main slots train, so any template followed clears it. These
             are product choices, not validated minimums — the Muscles screen
             says so beside the number.
       via   "main"      only the main slots train it; every template has to
                         clear it, and tools/check-muscle-map.js checks that.
             "coverage"  a coverage slot tops it up, and the check requires one
                         whose exercises all count as direct work for it.

     Groups a main slot already trains as a secondary (quads, hamstrings) are
     still "coverage" here: the main slots reach them through secondary work, and
     a floor counts primaries. */
  var MUSCLE_FLOORS = {
    chest:        { sets: 3, via: "main" },
    delts_front:  { sets: 3, via: "main" },
    triceps:      { sets: 3, via: "main" },
    lats:         { sets: 3, via: "main" },
    upper_back:   { sets: 3, via: "main" },
    abs:          { sets: 3, via: "main" },
    glutes:       { sets: 3, via: "main" },
    quads:        { sets: 6, via: "coverage" },
    hamstrings:   { sets: 6, via: "coverage" },
    biceps:       { sets: 6, via: "coverage" },
    delts_side:   { sets: 6, via: "coverage" },
    delts_rear:   { sets: 6, via: "coverage" },
    traps:        { sets: 6, via: "coverage" },
    forearms:     { sets: 6, via: "coverage" },
    obliques:     { sets: 6, via: "coverage" },
    lower_back:   { sets: 6, via: "coverage" },
    calves:       { sets: 6, via: "coverage" },
    adductors:    { sets: 6, via: "coverage" },
    abductors:    { sets: 6, via: "coverage" },
    rotator_cuff: { sets: 3, via: "coverage" },
    neck:         { sets: 3, via: "coverage" },
    shins:        { sets: 3, via: "coverage" }
  };

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
     4) THE MAP — every id in EXERCISE_DB (86 + the 64 coverage exercises), explicitly.
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
  m("push_incline", ["chest", "triceps"], ["delts_front"], ["abs"]);        /* same muscles as a push-up, less of the load */
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
  m("pull_e2_dbrow", ["upper_back", "lats"], ["biceps", "delts_rear", "traps"], ["lower_back"]);
  m("pull_alt_passivehang", ["forearms"], [], ["upper_back"]);
  m("pull_alt_australian", ["upper_back"], ["lats", "biceps", "delts_rear", "traps"], ["abs"]);
  m("pull_alt_bandassist", ["lats", "upper_back"], ["biceps", "forearms"], ["abs"]);
  m("pull_alt_row", ["upper_back", "lats"], ["biceps", "delts_rear", "traps"], ["lower_back"]);
  m("pull_alt_tabledoor", ["upper_back"], ["lats", "biceps", "delts_rear", "traps"], ["abs"]);
  m("pull_alt_towel", ["upper_back", "forearms"], ["lats", "biceps", "delts_rear", "traps"], ["abs"]);

  /* ---- SQUAT: knee-dominant ---- */
  m("squat_1", ["quads", "glutes"], ["hamstrings", "adductors"], ["abs"]);
  m("squat_2", ["quads", "glutes"], ["hamstrings"], ["abs"]);
  m("squat_3", ["quads", "glutes"], ["hamstrings"], ["abs", "obliques"]);   /* unilateral */
  m("squat_split", ["quads", "glutes"], ["hamstrings"], ["abs", "obliques"]); /* unilateral, rear foot on the floor */
  m("squat_4", ["quads", "glutes"], ["hamstrings"], ["abs", "obliques"]);
  m("squat_5", ["quads", "glutes"], ["hamstrings"], ["abs", "obliques"]);
  m("squat_6", ["quads", "glutes"], ["hamstrings"], ["abs", "obliques"]);
  m("squat_e2_goblet", ["quads", "glutes"], ["hamstrings"], ["abs", "upper_back"]);
  m("squat_alt_narrow", ["quads"], ["glutes"], ["abs"]);
  m("squat_alt_deep", ["quads", "glutes"], ["hamstrings", "adductors"], ["abs", "lower_back"]);
  m("squat_alt_cossack", ["quads", "glutes"], ["hamstrings", "adductors"], ["abs", "obliques"]);
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
  m("shoulder_1", ["delts_front", "triceps"], ["delts_side"], ["abs", "traps"]);
  m("shoulder_2", ["delts_front", "triceps"], ["delts_side"], ["abs", "traps"]);
  m("shoulder_3", ["delts_front"], ["delts_side", "triceps"], ["abs", "forearms", "traps"]);
  m("shoulder_4", ["delts_front"], ["delts_side", "triceps"], ["abs", "forearms", "traps"]);
  m("shoulder_5", ["delts_front", "triceps"], ["delts_side"], ["abs", "forearms", "traps"]);
  m("shoulder_6", ["delts_front", "triceps"], ["delts_side"], ["abs", "forearms", "traps"]);
  m("shoulder_e2_ohp", ["delts_front", "delts_side"], ["triceps"], ["abs", "traps"]);

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
  m("skill_handstand_1", ["delts_front", "abs"], ["triceps"], ["forearms", "traps"]);
  m("skill_handstand_2", ["delts_front"], ["triceps", "abs"], ["forearms", "traps"]);
  m("skill_handstand_3", ["delts_front"], ["triceps", "abs"], ["forearms", "traps"]);
  m("skill_handstand_4", ["delts_front"], ["triceps", "abs"], ["forearms", "traps"]);
  m("skill_lsit_1", ["abs"], ["quads"], ["triceps"]);
  m("skill_lsit_2", ["abs"], ["quads", "obliques"], ["triceps", "forearms"]);
  m("skill_lsit_3", ["abs"], ["quads", "obliques"], ["triceps", "forearms"]);
  m("skill_vsit", ["abs"], ["quads", "obliques"], ["triceps", "forearms"]);

  /* ---- COVERAGE (Stage 3, plan D2): upper body, neck and grip ----
     Each slot tops up one group, so every exercise in it lists that group as a
     PRIMARY: the weekly floor counts performed sets where the group is primary,
     and tools/check-muscle-map.js fails on a slot member that doesn't. Anything
     else the movement really does goes in the lower tiers. */
  /* curl → biceps */
  m("acc_curl_doorframe", ["biceps"], ["forearms"], ["abs"]);
  m("acc_curl_invrow", ["biceps", "lats"], ["upper_back", "forearms", "delts_rear"], ["abs"]);  /* underhand: the biceps share the pull with the lats */
  m("acc_curl_band", ["biceps"], ["forearms"], []);
  m("acc_curl_db", ["biceps"], ["forearms"], []);
  m("acc_curl_hammer", ["biceps"], ["forearms"], []);                       /* neutral grip: brachialis and forearm take more */
  /* lateral → side delts */
  m("acc_lateral_iso", ["delts_side"], ["rotator_cuff"], ["traps"]);
  m("acc_lateral_band", ["delts_side"], ["rotator_cuff", "traps"], []);
  m("acc_lateral_db", ["delts_side"], ["traps", "rotator_cuff"], ["forearms"]);
  m("acc_lateral_leanaway", ["delts_side"], ["traps", "rotator_cuff"], ["obliques", "forearms"]);
  /* reardelt → rear delts */
  m("acc_reardelt_tdraise", ["delts_rear"], ["upper_back", "traps"], ["lower_back"]);
  m("acc_reardelt_snowangel", ["delts_rear"], ["upper_back", "traps"], ["lower_back"]);
  m("acc_reardelt_bandpull", ["delts_rear"], ["upper_back", "traps", "rotator_cuff"], []);
  m("acc_reardelt_facepull", ["delts_rear"], ["rotator_cuff", "traps", "upper_back"], []);
  m("acc_reardelt_dbfly", ["delts_rear"], ["upper_back", "traps"], ["lower_back", "forearms"]);
  /* cuff → rotator cuff */
  m("acc_cuff_walllift", ["rotator_cuff"], ["traps", "delts_rear"], []);
  m("acc_cuff_pronew", ["rotator_cuff"], ["delts_rear", "upper_back", "traps"], ["lower_back"]);
  m("acc_cuff_bander", ["rotator_cuff"], ["delts_rear"], []);
  m("acc_cuff_sidelying", ["rotator_cuff"], ["delts_rear"], []);
  /* traps → traps */
  m("acc_traps_pike", ["traps"], ["delts_front"], ["abs", "triceps"]);
  m("acc_traps_band", ["traps"], ["forearms"], []);
  m("acc_traps_shrug", ["traps"], ["forearms"], ["abs"]);
  /* neck → neck */
  m("acc_neck_chintuck", ["neck"], [], []);
  m("acc_neck_fourway", ["neck"], ["traps"], []);
  m("acc_neck_lyingraise", ["neck"], ["traps"], []);
  /* grip → forearms */
  m("acc_grip_wring", ["forearms"], ["biceps"], []);
  m("acc_grip_towelhang", ["forearms"], ["lats"], ["upper_back"]);
  m("acc_grip_farmer", ["forearms"], ["traps"], ["abs", "obliques", "lower_back"]);
  m("acc_grip_wristcurl", ["forearms"], [], []);
  m("acc_grip_revwristcurl", ["forearms"], [], []);

  /* ---- COVERAGE (Stage 3, plan D2): lower body and trunk ----
     Same rule: the slot's group is a PRIMARY on every member. Where a movement
     really works a second group about as hard (the dead bug, the reverse
     hyper), the second group is still kept in a lower tier, so its floor isn't
     padded by work that was bought for another group. */
  /* quad → quads */
  m("acc_quad_wallsit", ["quads"], ["glutes"], ["abs"]);
  m("acc_quad_revlunge", ["quads", "glutes"], ["hamstrings", "adductors"], ["abs", "obliques"]);
  m("acc_quad_stepup", ["quads", "glutes"], ["hamstrings", "calves"], ["abs", "obliques"]);
  m("acc_quad_sissy", ["quads"], [], ["abs", "calves"]);
  m("acc_quad_spanish", ["quads"], ["glutes"], ["abs"]);
  m("acc_quad_dbsplit", ["quads", "glutes"], ["hamstrings", "adductors"], ["abs", "obliques", "forearms"]);
  /* hamstring → hamstrings */
  m("acc_hamstring_slidecurl", ["hamstrings"], ["glutes"], ["abs", "lower_back"]);
  m("acc_hamstring_slidecurl1", ["hamstrings"], ["glutes"], ["abs", "lower_back", "obliques"]);
  m("acc_hamstring_bandcurl", ["hamstrings"], ["calves"], ["abs"]);
  m("acc_hamstring_slrdl", ["hamstrings", "glutes"], ["lower_back"], ["abs", "obliques"]);
  m("acc_hamstring_slrdldb", ["hamstrings", "glutes"], ["lower_back"], ["abs", "obliques", "forearms"]);
  /* calf → calves */
  m("acc_calf_raise", ["calves"], [], ["abs"]);
  m("acc_calf_single", ["calves"], [], ["abs", "obliques"]);
  m("acc_calf_bentknee", ["calves"], [], ["quads", "abs"]);               /* knee bent: the lower calf takes it */
  m("acc_calf_weighted", ["calves"], [], ["abs", "obliques", "forearms"]);
  /* shin → shins */
  m("acc_shin_wall", ["shins"], [], []);
  m("acc_shin_single", ["shins"], [], ["abs"]);
  /* adductor → adductors */
  m("acc_adductor_sidelying", ["adductors"], [], ["abs"]);
  m("acc_adductor_copknee", ["adductors"], ["obliques", "abs"], []);
  m("acc_adductor_copfoot", ["adductors"], ["obliques", "abs"], []);
  m("acc_adductor_band", ["adductors"], [], ["abductors", "abs"]);        /* the standing leg's abductors hold you up */
  /* abductor → abductors */
  m("acc_abductor_sidelying", ["abductors"], ["glutes"], ["obliques"]);
  m("acc_abductor_sideplank", ["abductors"], ["obliques", "glutes"], ["abs"]);
  m("acc_abductor_bandwalk", ["abductors"], ["glutes", "quads"], ["abs"]);
  m("acc_abductor_clamshell", ["abductors"], ["glutes"], ["obliques"]);
  /* antirot → obliques */
  m("acc_antirot_knees", ["obliques"], ["abs"], ["abductors"]);
  m("acc_antirot_sideplank", ["obliques"], ["abs", "abductors"], []);
  m("acc_antirot_leg", ["obliques"], ["abs", "abductors"], []);           /* the raised leg abducts, but it's a hold: secondary */
  m("acc_antirot_deadbug", ["abs", "obliques"], [], ["lower_back"]);      /* anti-extension and anti-rotation in one */
  m("acc_antirot_pallof", ["obliques"], ["abs"], []);
  m("acc_antirot_suitcase", ["obliques"], ["forearms", "traps"], ["abs", "lower_back"]);
  /* backext → lower back */
  m("acc_backext_birddog", ["lower_back"], ["glutes"], ["abs", "obliques"]);
  m("acc_backext_prone", ["lower_back"], ["glutes", "upper_back"], []);
  m("acc_backext_revhyper", ["lower_back"], ["glutes", "hamstrings"], ["abs"]);
  m("acc_backext_goodmorning", ["lower_back"], ["hamstrings", "glutes"], ["abs"]);

  /* --------------------------------------------------------------------------
     5) EXPORT
     ------------------------------------------------------------------------ */
  window.MUSCLE_GROUPS   = MUSCLE_GROUPS;
  window.MUSCLE_MAP      = MUSCLE_MAP;
  window.MUSCLE_FALLBACK = MUSCLE_FALLBACK;
  window.MUSCLE_WEEK     = MUSCLE_WEEK;
  window.MUSCLE_FLOORS   = MUSCLE_FLOORS;
  window.MUSCLE_RANKS    = MUSCLE_RANKS;

})();
