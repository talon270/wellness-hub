/* ===== BASALT script block 1 (source lines 863-1813) ===== */
/* ============================================================================
   IRONFRAME CORE  —  PART 1
   Global namespace: window.App
   ----------------------------------------------------------------------------
   PUBLIC CONTRACT (consumed by Parts 2–6):
     App.STATE                      -> live in-memory APP_STATE object
     App.getState()                 -> returns App.STATE
     App.saveState()                -> persists App.STATE to Local Storage
     App.updateState(path, value)   -> dot-path set + persist (+ re-render)
     App.resetState()               -> wipe + restart onboarding
     App.readOnly()                 -> null | "unreadable" | "newer" (no writes while set)
     App.defaultState()             -> fresh default-state factory
     App.showSection(name)          -> router (dashboard|today|program|
                                       nutrition|progress|evaluation)
     App.registerView(name, fn)     -> Parts 2–6 mount their renderers
     App.refresh()                  -> re-render the active view
     App.openModal(id)/closeModal   -> modal helpers
     App.toast(msg, type, ms)       -> transient notification
     App.renderOnboarding()         -> overridable onboarding hook (Part 2)
     App.completeOnboarding()       -> mark onboarded + enter main app
     App.PROGRESSIONS               -> Level 1–6 movement tables per pattern
     App.SECTIONS                   -> ordered section metadata (nav source)
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     STORAGE CONSTANTS
     -------------------------------------------------------------------- */
  var STORAGE_KEY   = "ironframe.state.v1";
  var THEME_KEY     = "ironframe.theme";     // persisted colour scheme id

  /* ---- Colour scheme ----
     Inside the Wellness Hub the palette is owned by css/basalt-gruvbox.css, so
     the original four-scheme picker is gone and only this descriptor remains
     (it still feeds the meta theme-color and Chart.js defaults). Any stale
     `ironframe.theme` value from a previous standalone run resolves back to
     this entry rather than reapplying a scheme whose CSS no longer exists. */
  var THEMES = [
    {
      id: "default", label: "Gruvbox Dark",
      primary: "#fe8019", secondary: "#8ec07c", text: "#ebdbb2",
      glow: "rgba(254,128,25,.45)"
    }
  ];
  var UI_KEY        = "ironframe.ui";        // tiny, non-schema UI prefs
  var SCHEMA_VERSION = 9;                    // v9: skill tracks trained in workouts, the mobility block; older builds must not drop them

  /* ----------------------------------------------------------------------
     STATIC PROGRAM DATA — Level 1–6 progressions per movement pattern.
     Era 2 unlock movements are appended after the calisthenics ladder.
     Shared by Program (Part 3), Today (Part 2), Evaluation (Part 6).
     -------------------------------------------------------------------- */
  var PROGRESSIONS = {
    push:     { label: "Push",     levels: ["Wall Push-up","Push-up","Diamond Push-up","Decline Push-up","Archer Push-up","Pseudo Planche Push-up"], era2: ["Weighted Push-up","Dumbbell Press"] },
    pull:     { label: "Pull",     levels: ["Dead Hang","Scapular Pull","Negative Pull-up","Pull-up","Chin-up","Archer Pull-up"], era2: ["Dumbbell Row (volume)"] },
    squat:    { label: "Squat",    levels: ["Bodyweight Squat","Pause Squat","Bulgarian Split Squat","Shrimp Squat","Pistol Squat","Weighted Pistol"], era2: ["Kettlebell Goblet Squat"] },
    hinge:    { label: "Hinge",    levels: ["Glute Bridge","Hip Thrust","Single-Leg Hip Thrust","Nordic Curl Negative","Nordic Curl","Shaking Nordic"], era2: ["Dumbbell RDL","Kettlebell Swing"] },
    core:     { label: "Core",     levels: ["Plank","Hollow Body Hold","Tuck L-Sit","L-Sit","Dragon Flag Negative","Dragon Flag"], era2: [] },
    shoulder: { label: "Shoulder", levels: ["Pike Push-up","Elevated Pike","Wall Handstand Hold","Kick-to-Handstand","Handstand Push-up Negative","Handstand Push-up"], era2: ["Dumbbell Overhead Press"] },
    dip:      { label: "Dip",      levels: ["Bench Dip","Straight Bar Dip","Parallel Bar Dip","Korean Dip","Ring Dip","Weighted Dip"], era2: [] }
  };

  /* Ordered nav / section metadata — the single source of truth for the router AND
     for both navigation layouts: the full bar and the compact picker are generated
     from this array, so a section registered later (Muscles, by fitness/muscles.js)
     appears in both without either being edited.
       id     stored in ironframe.ui.section, used by data-go links and App.showSection —
              never renamed
       label  what a person reads (PLAN-neobrutal-ui.md, "Fitness navigation")
       group  which heading it sits under in the picker
       rank   left-to-right order in the full bar: the four everyday destinations first
       blurb  one line under the name in the picker */
  var SECTIONS = [
    { id: "dashboard",  label: "Overview",          icon: "grid",  group: "Start",  rank: 1, blurb: "Summary and your next action" },
    { id: "today",      label: "Workout",           icon: "flame", group: "Train",  rank: 2, blurb: "Prepare or resume the current session" },
    { id: "program",    label: "Program",           icon: "list",  group: "Plan",   rank: 3, blurb: "Rotation and workout targets" },
    /* Off the wide bar (bar: false): ten buttons wrap at 1440 px (R4e). The
       compact picker still lists it, Program links to it, and the bar lights
       Program while it is open (parent). */
    { id: "progression",label: "Progression",       icon: "chart", group: "Plan",   rank: 3.5, blurb: "Every exercise step and where it leads", bar: false, parent: "program" },
    { id: "skills",     label: "Skills & mobility", icon: "skill", group: "Train",  rank: 6, blurb: "Practice and movement library" },
    { id: "running",    label: "Running",           icon: "run",   group: "Train",  rank: 5, blurb: "Run plan and logging" },
    { id: "progress",   label: "Progress",          icon: "chart", group: "Review", rank: 4, blurb: "Trends, calendar and session history" },
    { id: "evaluation", label: "Phase review",      icon: "award", group: "Review", rank: 8, blurb: "Phase score and report cards" }
  ];
  var SECTION_GROUPS = ["Start", "Train", "Plan", "Review"];

  var ICONS = {
    grid:  '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
    flame: '<path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-3 .5 2 2 2 2 2-1-3 1-5 1-7z"/><path d="M8.5 14a3.5 3.5 0 1 0 7 0c0-2-2-3-2-3"/>',
    list:  '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M8.5 13l-1.5 8 5-3 5 3-1.5-8"/>',
    skill: '<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="3"/>',
    run:   '<path d="M13 4a1.5 1.5 0 1 0 0-.01M9 21l2.5-5 2-2.5 1.5 3 3 1.5M7 13l1.5-4.5L13 7l3 2 2.5-.5M5 9l3-1"/>'
  };

  /* ----------------------------------------------------------------------
     DEFAULT-STATE FACTORY
     Produces the full APP_STATE contract used across every part.
     -------------------------------------------------------------------- */
  function defaultState() {
    var nowISO = new Date().toISOString();
    return {
      version: SCHEMA_VERSION,
      meta: {
        createdAt: nowISO,
        updatedAt: nowISO,
        onboarded: false          // bootstrap routes to onboarding while false
      },

      /* — User profile — name/age/height/weight are unknown until the user
         enters them in onboarding's "About you" step. They used to default to
         a fake 186cm/58kg/21-year-old "Athlete" that rendered as though it
         were already known before you'd typed anything — null here, and every
         display site below treats null as "not logged yet" (same pattern
         sleepWidget already uses), never as zero or a fabricated number. — */
      profile: {
        name: "",
        age: null,
        sex: "male",
        heightCm: null,
        weightKg: null,
        goal: "both",             // "strength" | "size" | "both" — sets rep ranges (training.data.js GOAL_RANGES)
        /* Bodyweight direction, its own optional setting (plan D2): "gain" |
           "hold" | "lose", or null for no direction. The training goal no
           longer implies one, and the phase report doesn't use either. */
        weightDirection: null,
        activity: "moderate",
        bmi: null,
        tdee: 2800,
        surplusTarget: 3300,      // +500 kcal aggressive clean-bulk target
        macros: { protein: 116, carbs: 413, fat: 92 },  // g/day
        hydrationTargetL: 3.2
      },

      /* — Equipment (pre-checks per spec) — bands to lowBar (v5) split what
         "pull-up bar" and "bench" used to stand for, and vest to
         nordicAnchor (v7) came with the Yellow Dude catalogue
         (training.data.js, EQUIPMENT) — */
      equipment: {
        pullupBar: false,
        dumbbells: true,
        bench: true,
        kettlebells: true,
        rings: false,
        nothing: false,
        bands: false,
        parallettes: false,
        dipBars: false,
        lowBar: false,
        vest: false,
        abWheel: false,
        jumpRope: false,
        box: false,
        barbell: false,
        nordicAnchor: false
      },

      /* — The weights you own (v5, plan C5), per implement: { mode:
         "adjustable", stepKg, maxKg } or { mode: "fixed", kg: [...] }. An
         implement with no record steps as it always did, by
         TRAINING_DATA.LOAD_STEP_KG with no maximum — so {} is today's
         behaviour, and that number lives in one place. — */
      equipmentLoads: {},

      /* — User preferences (editable in Settings) — */
      prefs: {
        restDefaultSec: 90,       // default between-set rest timer
        restHoldSec: 60,          // default rest after a timed hold
        volumeMode: "standard",   // "standard" | "extended" (+1 set); an old "max" reads as "extended"
        /* How MANY movements a session contains, as opposed to how hard each
           one is — volumeMode only ever adds sets to the same 3-4
           exercises. Independent of it and combinable with it. */
        sessionLength: "focused", // "short" | "focused" | "full"
        /* The template (engine TEMPLATES). null is the rotation, which every
           save had before templates existed; it stays until you choose. */
        template: null,
        weeklyDays: null,        // v8: chosen strength days, 1–6; null preserves the legacy flexible schedule
        /* v6: "on" appends about 20 minutes of coverage work to every main
           workout (engine.buildWorkout, plan D3). Off until you turn it on. */
        finisher: "off",
        /* v9: "on" adds one Mobility-view routine to every main workout
           (plans/PLAN-skills-mobility-in-workouts.md B6). Off until you tick
           it, like the finisher: the preview suggests a routine and says why. */
        mobilityBlock: "off"
      },

      /* — Running program (fixed run days; the lifting follows your last session, so the two can land together) —
         goal:    null until the user picks one ("base" | "stamina" | "sprint")
         startISO: anchor date the week-by-week plan counts from
         runLog:   [{ id, dateISO, kind, distanceKm, durationSec, rpe, notes }]
         weekOffset  weeks you chose to repeat: the plan week is the calendar week minus this
         askedWeek   the calendar week whose "repeat or move on" was answered (null: none)
         moved       { "YYYY-MM-DD": "YYYY-MM-DD" } a run moved off its day, by its planned date
         The last three are absent in older saves and read as 0, null and {}. */
      running: {
        goal: null,
        startISO: null,
        runDays: [3, 6, 0],   // Wed, Sat, Sun: fixed weekdays, unlike the lifting
        runLog: [],
        streak: { count: 0, lastISO: null, best: 0 },
        weekOffset: 0,
        askedWeek: null,
        moved: {}
      },

      /* — Era state: 1 = Calisthenics Foundation, 2 = Hybrid Strength — */
      era: 1,

      /* — Era 1 graduation benchmarks — */
      benchmarks: {
        pushups:   { label: "15 clean push-ups",            metric: "reps", target: 15, current: 0, complete: false },
        pull:      { label: "5 pull-ups / 20 inverted rows", metric: "reps", target: 5, altTarget: 20, current: 0, complete: false },
        lsit:      { label: "30s L-sit tuck hold",          metric: "sec",  target: 30, current: 0, complete: false },
        bulgarian: { label: "10 Bulgarian split squats /leg", metric: "reps", target: 10, current: 0, complete: false },
        hollow:    { label: "30s hollow body hold",         metric: "sec",  target: 30, current: 0, complete: false }
      },

      /* — Movement tiers (level 1–6 + % progress to next unlock) — */
      tiers: {
        push:     { level: 1, repsTarget: 8, progress: 0 },
        pull:     { level: 1, repsTarget: 5, progress: 0 },
        squat:    { level: 1, repsTarget: 12, progress: 0 },
        hinge:    { level: 1, repsTarget: 12, progress: 0 },
        core:     { level: 1, repsTarget: 30, progress: 0 },
        shoulder: { level: 1, repsTarget: 6, progress: 0 },
        dip:      { level: 1, repsTarget: 8, progress: 0 }
      },

      /* — Current open-ended 4-week phase — */
      currentPhase: {
        number: 1,
        startISO: nowISO,
        lengthDays: 28,
        action: "start",        // legacy label (advance | consolidate | deload); only volumeFactor < 1 still does anything
        weighIns: []            // up to 4 weekly weights used by the evaluator
      },

      /* — Logged collections (filled by Parts 2,4,5,6) — */
      sessions: [],         // { id, dateISO, type, exercises:[{key,pattern,sets:[{reps,weight}],difficulty}], difficulty, notes, completed, warmupDone, cooldownDone, flags:[] }
                            // v6: kind "mini" (type "mini") is a mini-session, absent is a main one; a finisher exercise carries finisher: true
      bodyweightLog: [],    // { dateISO, kg }
      measurements: [],     // { dateISO, chest, waist, hips, arms, thighs }
      sleepLog: [],         // { dateISO, hours, quality }
      nutritionLog: [],     // { dateISO, meals:[{name,kcal,protein,carbs,fat}], waterL }
      prs: [],              // { id, exercise, kind:"reps|hold|weight", value, dateISO }
      goals: [],            // { id, text, target, byPhase, metric, pinned, done }
      streak: { count: 0, lastISO: null, best: 0 },
      flagsHistory: [],     // { id, dateISO, exerciseKey, pattern, bodyPart, severity, substitutedTo }
      phaseHistory: [],     // { number, template, attended, planned, steps, flags, failed, blocks, tierLevels, endedISO } — entries from before the report lost its grade also carry score, grade, action

      /* — Prescriptions (v4, plans/PLAN-workout-progression.md C1, C2, C6) —
         slots       slot name -> { exerciseId, setup, sets, range, unit,
                     acceptedAt, why }: the one prescription each slot trains
         decisions   "exerciseId|sessionId" -> { choice, at }: your Step up /
                     Repeat answer to the evidence ending at that session.
                     A double step adds `steps: 2`; "Set slot to X kg" is
                     { choice: "load", kg, at } (engine.decide)
         assessment  null until the Stage 2 onboarding records one
         Sessions copy the prescription onto each exercise as `rx` from v4 on;
         a session without `rx` is never evidence (fitness/training.js).
         v5 (plans/PLAN-fitness-control-and-coverage.md C3, C1, C6):
         exclusions  exerciseId -> { state: "excluded" | "none" | "allowed",
                     at, why }: excluded, included again, or Allow anyway
                     past a joint limit. Never deleted: each re-stamps it
         slots (v5)  a slot's rx may also carry hold: true (step-ups paused)
                     and custom: { sets, range, unit } (plan C4), and a push
                     rx setup.grip "knuckles" (absent is palms)
         limitations null, or { wrist: "careful" | "avoid", …, at }
         grip        null, or { push: "knuckles" | "palms", at }
         equipmentCheck  null, or what the v5 upgrade turned on and why:
                     { at, inferred: { dipBars: { id, from: "session" | "slot" } } }.
                     The Equipment check card (step 2.5) reads it; dismissing
                     the card belongs in ironframe.ui, per device, like v4's
                     upgrade card (UPGRADE_SEEN_KEY).
                     v7 rewrites it with `tokens`, the items its card names:
                     v7's six, after v5's four whenever the save still held
                     v5's record. A record without `tokens` is v5's four.
         A cleared limitations or grip is a stamped record, never null: null
         has no stamp and loses every sync (js/syncmerge.js).
         v6 (plan D3, D5):
         slots (v6)  a coverage slot (TRAINING_DATA.SLOTS[x].coverage) gets
                     its record the first time a finished workout trains one
                     of its picks, at its first allowed rung, why "added for
                     coverage" and acceptedAt null, like a carried-over slot
         pins        slot -> { days: [0-6, 0 = Sunday], at }: coverage slots
                     the finisher and mini-sessions put first on those
                     weekdays (fitness/coverage.js). No days is no pin, so a
                     clear is a stamped record too
         v9 (plans/PLAN-skills-mobility-in-workouts.md):
         skills      track -> { exerciseId, setup, acceptedAt, every, at, off }:
                     the skill tracks (App.skills.tracks) trained in their own
                     block before the main slots. Never a slot: their sets
                     save with `skill`, no `slot`, so no slot's evidence reads
                     them. `every` puts the track in every session instead of
                     only the days that train its family. Stopping writes a
                     stamped { off: true, at }, never a deleted key, so a sync
                     carries it, as pins do */
      training: { slots: {}, decisions: {}, assessment: null,
                  exclusions: {}, limitations: null, grip: null, equipmentCheck: null, pins: {}, skills: {} },

      /* — Recovery blocks (plan D3) — one record per block, so two devices
         union them by id: { id, startKey, startedISO, days, reason:
         "reduce" | "flag" | "asked", endedKey, updatedAt }. Active on a day
         from startKey up to (not including) endedKey, or startKey + days.
         Ending early stamps endedKey and updatedAt, and the newer stamp wins
         the merge. A block started and ended the same day never applied. — */
      recoveryBlocks: []
    };
  }

  /* ----------------------------------------------------------------------
     MIGRATION — bump-and-transform older saved states. Stub for v1.
     -------------------------------------------------------------------- */
  function migrate(state) {
    if (!state || typeof state !== "object") return defaultState();
    // Example pattern for the future:
    //   if (state.version < 2) { /* transform */ state.version = 2; }
    if (typeof state.version !== "number" || state.version > SCHEMA_VERSION) {
      // Unknown / future schema — deep-merged so the views can render it. A
      // future version is also opened read-only by load(), so this shape is
      // only ever displayed, never written back.
      return deepMerge(defaultState(), state);
    }
    if (state.version < SCHEMA_VERSION) {
      /* v1 -> v2 adds prefs.sessionLength. It is additive with a default of
         "focused", which is exactly today's behaviour, so the deep-merge
         below IS the migration: every pre-v2 save keeps the session shape it
         already had and nobody's program silently gets longer on upgrade. */
      state = deepMerge(defaultState(), state);
      if (state.version < 3) repairTargets(state);   // v2 -> v3, see below
      if (state.version < 4) toV4(state);            // v3 -> v4, after the repaired targets
      if (state.version < 5) toV5(state);            // v4 -> v5, after v4's slots exist
      /* v5 -> v6 is additive: prefs.finisher ("off") and training.pins ({})
         come from the defaults above, and a session with no `kind` is a main
         one, which every session before v6 was. The bump is the guard: a v5
         build opens a save holding coverage slots and mini-sessions
         read-only instead of misreading them — its recoveryOffer would call
         recommend on a coverage exercise it doesn't know. */
      if (state.version < 7) toV7(state);            // v6 -> v7, after toV5's record
      /* v7 -> v8 is additive: weeklyDays stays null until selected. Existing
         templates, phase denominators, history and prescriptions stay intact.
         The version guard protects saves with the new whole/split day types. */
      /* v8 -> v9 is additive too: training.skills ({}) and prefs.mobilityBlock
         ("off") come from the defaults, so nothing trains a skill or a routine
         until you choose one. The bump is the guard: a v8 build keeps unknown
         keys but never acts on them, so its workouts would leave your skills
         and routine out without a word. It opens the save read-only instead. */
      state.version = SCHEMA_VERSION;
    } else {
      // Same version: still backfill keys added during default development.
      state = deepMerge(defaultState(), state);
    }
    rowWithoutBar(state);
    recountStreak(state);
    return state;
  }

  /* The streak is a cache of the session days, so it is recounted from them
     on every load and after every workout rather than bumped in place. A
     running count can't follow a sync (sessions union, but `streak` merges
     field-wise with local winning) or a workout backfilled to an earlier day
     (R1-2). Up to 3 days between sessions keeps it alive, and longer when
     your template plans fewer sessions: two a week always leaves one gap of 4
     days or more, so at 3 Full body x2 followed exactly could never pass 2
     (R3-1). `best` never drops — a deleted session doesn't take a past best
     with it. */
  var STREAK_GAP_DAYS = 3;
  function streakGap(state) {
    var T = window.App && App.engine && App.engine.TEMPLATES;
    var tpl = T && (T[state && state.prefs && state.prefs.template] || T.rotation);
    return tpl ? Math.max(STREAK_GAP_DAYS, Math.ceil(7 / tpl.perWeek)) : STREAK_GAP_DAYS;
  }
  function recountStreak(state) {
    var days = {};
    (state.sessions || []).forEach(function (x) {
      /* An undated one is healState's to drop; here it must not throw, or
         load() would open the whole save read-only over it. */
      if (x && x.completed && (x.dayKey || x.dateISO)) days[x.dayKey || Hub.dayOf(x.dateISO)] = 1;
    });
    var keys = Object.keys(days).sort(), count = 0, best = 0, last = null, gap = streakGap(state);
    keys.forEach(function (k) {
      count = last && Hub.daysBetween(last, k) <= gap ? count + 1 : 1;
      best = Math.max(best, count);
      last = k;
    });
    var st = state.streak || (state.streak = {});
    st.count = count;
    st.lastISO = last;
    st.best = Math.max(st.best || 0, best);
  }

  /* Without a pull-up bar the pull day trains the row (engine.slotsFor), so
     the row needs a slot record like any trained slot: without one,
     recommendFor("row") is null and the row can never step up (R2-1). The
     assessment writes one for new users; this gives every other save the
     same, on every load — a save migrated before this existed, or a bar
     removed later. It isn't C6's offer: that is for a profile with a bar,
     where the row would be extra. acceptedAt stays null, so a choice made on
     another device outranks it. A no-op without training.js — toV4 is the
     one that refuses. */
  function rowWithoutBar(state) {
    var T = window.Training, TDATA = window.TRAINING_DATA;
    var slots = state.training && state.training.slots;
    if (!T || !TDATA || !isObj(slots) || slots.row || T.owns(state.equipment, "pull_1")) return;
    var id = TDATA.SLOTS.row.first.filter(function (x) { return T.owns(state.equipment, x); })[0];
    if (id) slots.row = T.startOf(id, { why: "carried over — rows replace pull-ups without a bar",
                                        goal: state.profile && state.profile.goal });
  }

  /* v2 -> v3 · REPAIR TARGETS LEFT BY THE OLD PROGRESSION CODE
     ----------------------------------------------------------------------
     Two defects wrote real, wrong numbers into saved state, so fixing the
     algorithm alone would leave existing users on the damage:

       1. BASE_REPS.core was 30 — a SECONDS value — and levelling core from
          L4 (L-Sit, hold) to L5 (Dragon Flag Negative, reps) copied it
          straight across as a REP target. Anyone who made that jump is
          carrying "30 reps of dragon flag negatives".
       2. Hold targets could climb past the point their own progression says
          to advance at, one second per session, with nothing to stop them.

     Targets are only ever moved DOWN here, and only when they are impossible
     for the movement actually prescribed — a target you legitimately earned
     is never touched.

     This runs in the FIRST IIFE, where the exercise DB and the engine's
     tables do not exist as locals — they are defined in later blocks. It
     therefore reads them off the globals they publish (window.DB,
     App.engine), and no-ops if it is somehow called before they exist rather
     than throwing on every legacy load. */
  function repairTargets(state) {
    var tiers = state.tiers; if (!tiers) return;
    var db = window.DB;
    var eng = window.App && window.App.engine;
    if (!db || !db.byLevel || !eng) return;
    var caps = eng.HOLD_ADVANCE_AT || {};
    var baseReps = { push: 12, pull: 8, squat: 14, hinge: 14, core: 5, shoulder: 8, dip: 8 };

    Object.keys(tiers).forEach(function (p) {
      var t = tiers[p]; if (!t || typeof t.repsTarget !== "number") return;
      var ex = db.byLevel(p, t.level || 1);
      if (!ex) return;
      if (ex.mode === "hold") {
        var cap = caps[ex.id];
        if (cap && t.repsTarget > cap) t.repsTarget = cap;
      } else if (t.repsTarget > 25) {
        /* No reps-mode movement in this library is a 25+ rep prescription;
           a number that high against a reps movement is leaked seconds. */
        t.repsTarget = baseReps[p] || 8;
      }
    });
  }

  /* v3 -> v4 · PRESCRIPTIONS (plans/PLAN-workout-progression.md, C6)
     ----------------------------------------------------------------------
       1. Each tier's slot becomes the exercise its level prescribes today, at
          the range training.data.js gives it, 3 sets. Nothing in your program
          changes; the level stays on `tiers` as history.
       2. Every session without a dayKey gets the one its readers already
          compute — the Hub's rollover rule — so changing the rollover hour
          later can't move an old workout to another day.
     Tiers, sets, PRs, phases and benchmarks are not touched, and no `rx` or
     effort is invented for a legacy session: training.js reads "no rx" as
     unknown evidence at the point of use.

     Additive only. A slot that already exists is kept — a v3 save can carry
     one if an older build merged a v4 file into it — so running this twice,
     or on a save that already has prescriptions, changes nothing.

     Throws when training.js didn't load: a v4 save without its slots would be
     a save every later version has to second-guess. load() catches it, keeps
     the raw save untouched and opens Fitness read-only; the next load with
     the file present migrates normally. */
  function toV4(state) {
    if (!window.Training || !window.Hub || !window.Hub.dayOf) {
      throw new Error("v4 migration needs fitness/training.js and the Hub's dayOf()");
    }
    slotsFromTiers(state.tiers, state.training.slots, "carried over from", state.profile && state.profile.goal);
    state.sessions.forEach(function (s) {
      if (s && !s.dayKey && s.dateISO) s.dayKey = window.Hub.dayOf(s.dateISO);
    });
  }

  /* Fills `slots` with one prescription per tier, at the exercise that tier's
     level prescribes (DB.byLevel's `<pattern>_<level>` id). acceptedAt stays
     null — nobody accepted it — so in a sync any real choice made on another
     device outranks it (js/syncmerge.js). The row slot is never added here:
     it is offered, not imposed (C6). */
  function slotsFromTiers(tiers, slots, verb, goal) {
    Object.keys(tiers || {}).forEach(function (p) {
      var lvl = tiers[p] && tiers[p].level;
      if (slots[p] || !lvl) return;
      var rx = window.Training.startOf(p + "_" + lvl, { why: verb + " Level " + lvl, goal: goal });
      if (rx) slots[p] = rx;
    });
    return slots;
  }

  /* v4 -> v5 · THE EQUIPMENT SPLIT (plans/PLAN-fitness-control-and-coverage.md, C6)
     ----------------------------------------------------------------------
     Four tokens now say what "pull-up bar" and "bench" used to stand for
     (training.data.js, F5). Read as false, a save that trained Parallel Bar
     Dips on v4 would open on v5 owning no dip bars, and its dip slot would
     quietly fall back to an easier movement. So each one is turned on when
     your own data says you have it:
       · a logged session performed an exercise that needs it, or
       · a slot holds one that needs it AND you own the v4 token it was split
         from (V5_SPLIT_FROM), so the slot was trainable before the upgrade.
         Without a pull-up bar the v4 dip slot was already falling back;
         turning dip bars on would change that workout, not keep it.
     "Needs it" means your other equipment doesn't already meet that
     requirement: Australian Row with rings owned infers no low bar.

     Everything else is additive. v5's other keys come from the defaults
     (the deep merge above), and slots, sessions and decisions are untouched.
     An onboarded save also records what was turned on and why, for the
     one-time Equipment check card; a new profile picks its equipment in
     onboarding instead.

     Throws without training.data.js, as toV4 does: load() keeps the raw
     save and opens Fitness read-only. */
  var V5_SPLIT_FROM = { bands: "pullupBar", dipBars: "pullupBar", lowBar: "pullupBar", parallettes: "bench" };
  function toV5(state) {
    var TDATA = window.TRAINING_DATA;
    if (!TDATA || !TDATA.EXERCISES) throw new Error("v5 migration needs fitness/training.data.js");
    var eq = state.equipment, tr = state.training, inferred = {};
    if (!isObj(eq) || !isObj(tr)) return;   // healState replaces both with defaults
    eachTrained(state, function (id, from) {
      ((TDATA.EXERCISES[id] || {}).equipment || []).forEach(function (t) {
        var any = Array.isArray(t) ? t : [t];
        if (any.some(function (u) { return eq[u]; })) return;
        var tok = any.filter(function (u) { return u in V5_SPLIT_FROM; })[0];
        if (!tok || (from === "slot" && !eq[V5_SPLIT_FROM[tok]])) return;
        eq[tok] = true;
        inferred[tok] = { id: id, from: from };
      });
    });
    if (state.meta && state.meta.onboarded) tr.equipmentCheck = { at: new Date().toISOString(), inferred: inferred };
  }

  /* What your own data says you train, in the order v5 and v7 read it:
     every exercise a logged session performed (a set above 0, not skipped),
     then the exercise in every slot that is on. */
  function eachTrained(state, fn) {
    (Array.isArray(state.sessions) ? state.sessions : []).forEach(function (s) {
      (s && Array.isArray(s.exercises) ? s.exercises : []).forEach(function (ex) {
        if (ex && !ex.skipped && Array.isArray(ex.sets) &&
            ex.sets.some(function (st) { return Number(st && st.reps) > 0; })) fn(ex.key, "session");
      });
    });
    var slots = isObj(state.training.slots) ? state.training.slots : {};
    Object.keys(slots).forEach(function (k) {
      if (slots[k] && !slots[k].off) fn(slots[k].exerciseId, "slot");
    });
  }

  /* v6 -> v7 · SIX MORE EQUIPMENT ITEMS (plans/PLAN-yellow-dude.md, step 1.2)
     ----------------------------------------------------------------------
     The Yellow Dude catalogue needs gear no token named: a weighted vest, an
     ab wheel, a jump rope, a box, a barbell, and something that holds your
     ankles for a Nordic curl. All six start off but one. Nordic curls
     (hinge_4-6) needed no equipment before v7, and plan A1 gives them the
     anchor; read as false, a save that trains them would open owning no
     anchor, and its hinge slot would quietly fall back to an easier
     movement. So `nordicAnchor` is turned on when a logged session performed
     one, or a slot that is on holds one: v5's two sources, in v5's order. A
     slot needs no second condition, as v5's did: before v7 every profile
     could be prescribed a Nordic.

     Everything else is additive. The six keys come from the defaults (the
     deep merge above), and sessions, slots, decisions and PRs are untouched.
     An onboarded save records what was turned on and why, and the tokens
     the one-time Equipment check card names. A save that still holds v5's
     record (from toV5 in this same load, or from an earlier one) keeps v5's
     four and what v5 inferred: one card for both upgrades. Replacing it
     would erase a v5 card a device hasn't shown yet; a device that did
     show it drops the four from the card instead (equipCheckHtml).

     No dependency on training.js: the inference is by id. */
  var V7_TOKENS = ["vest", "abWheel", "jumpRope", "box", "barbell", "nordicAnchor"];
  var V7_NORDIC = ["hinge_4", "hinge_5", "hinge_6"];
  function toV7(state) {
    var eq = state.equipment, tr = state.training, inferred = {};
    if (!isObj(eq) || !isObj(tr)) return;   // healState replaces both with defaults
    eachTrained(state, function (id, from) {
      if (eq.nordicAnchor || V7_NORDIC.indexOf(id) < 0) return;
      eq.nordicAnchor = true;
      inferred.nordicAnchor = { id: id, from: from };
    });
    if (!state.meta || !state.meta.onboarded) return;
    var v5 = isObj(tr.equipmentCheck) && !Array.isArray(tr.equipmentCheck.tokens) && tr.equipmentCheck;
    tr.equipmentCheck = {
      at: new Date().toISOString(),
      inferred: Object.assign({}, v5 && v5.inferred, inferred),
      tokens: (v5 ? ["dipBars", "lowBar", "bands", "parallettes"] : []).concat(V7_TOKENS)
    };
  }

  /* Deep-merge `source` onto a fresh `base` so newly-added schema keys are
     always present even on older saves (arrays/values from source win). */
  function deepMerge(base, source) {
    if (Array.isArray(base) || Array.isArray(source)) {
      return source === undefined ? base : source;
    }
    if (isObj(base) && isObj(source)) {
      var out = {};
      Object.keys(base).forEach(function (k) { out[k] = base[k]; });
      Object.keys(source).forEach(function (k) {
        out[k] = (k in base) ? deepMerge(base[k], source[k]) : source[k];
      });
      return out;
    }
    return source === undefined ? base : source;
  }
  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }

  /* ----------------------------------------------------------------------
     LOCAL STORAGE LAYER
     -------------------------------------------------------------------- */
  var STATE = defaultState();   // live in-memory state

  /* READ-ONLY GUARD
     null, or why this device must not write STORAGE_KEY:
       "unreadable"  the save failed to parse, migrate or heal. It used to be
                     replaced by defaults, and finishing the onboarding that
                     followed wrote `sessions: []` over months of history.
       "newer"       the save's version is above SCHEMA_VERSION — written by a
                     newer build, which an old one would rewrite in its own
                     shape. The Android updater makes mixed builds normal.
     saveState() and resetState() write nothing while it is set, and a
     persistent banner says so. load() re-decides it on every read, so a sync
     or an import that brings a readable save clears it. */
  var READ_ONLY = null;
  var UNREADABLE_COPY = null;   // the key holding the raw copy, or null if it wouldn't fit
  var lastBlockedToast = 0;

  function load() {
    READ_ONLY = null;
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); }
    catch (e) { raw = null; }
    if (!raw) { STATE = defaultState(); return STATE; }
    var parsed;
    try {
      parsed = JSON.parse(raw);
      /* Valid JSON that isn't an object ("null", a number) is as unreadable
         as a truncated string — migrate() would quietly turn it into defaults. */
      if (!isObj(parsed)) throw new Error("save is not an object");
      STATE = migrate(parsed);
      healState(STATE);   // validate & repair shape before any view touches it
    } catch (e) {
      console.warn("IRONFRAME: unreadable save, kept untouched and opened read-only.", e);
      UNREADABLE_COPY = keepUnreadable(raw);
      READ_ONLY = "unreadable";
      STATE = defaultState();
      return STATE;
    }
    if (typeof parsed.version === "number" && parsed.version > SCHEMA_VERSION) READ_ONLY = "newer";
    return STATE;
  }

  /* Copy the raw string to `<key>.unreadable-YYYYMMDD-HHMMSS`, local time. A
     copy with identical contents is reused, so reopening the app doesn't add
     another full-size copy on every load. Returns the key, or null when the
     copy wouldn't fit — the original is still untouched either way. */
  function keepUnreadable(raw) {
    var prefix = STORAGE_KEY + ".unreadable-";
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(prefix) === 0 && localStorage.getItem(k) === raw) return k;
      }
      var d = new Date();
      var p = function (n) { return (n < 10 ? "0" : "") + n; };
      var key = prefix + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" +
                p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
      localStorage.setItem(key, raw);
      return key;
    } catch (e) { return null; }
  }

  /* The banner sits above BASALT's own appbar, so it shows on every fitness
     section and while the app is hidden. Reuses the Hub's .wh-advice callout,
     which every palette already themes in light and dark. */
  function renderReadOnlyBanner() {
    var host = document.getElementById("wh-view-fitness") || document.body;
    var el = document.getElementById("fit-readonly");
    if (!READ_ONLY) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement("div");
      el.id = "fit-readonly";
      el.setAttribute("role", "alert");
      host.insertBefore(el, host.firstChild);
    }
    var body = READ_ONLY === "newer"
      ? "This fitness data was saved by a newer version of the app. Update this device to keep logging here — until then it's read-only."
      : "Your fitness data couldn't be read. It's untouched" +
        (UNREADABLE_COPY
          ? ", and a copy is saved as <code>" + escapeHtml(UNREADABLE_COPY) + "</code>."
          : ", but there wasn't room in storage to save a second copy.") +
        " Restore a backup from Settings, or keep using Fitness read-only.";
    el.className = "wh-advice wh-advice--" + (READ_ONLY === "newer" ? "warn" : "bad");
    el.style.margin = "0 0 var(--wh-s4, 16px)";
    el.innerHTML =
      '<span class="wh-advice__ic"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        TOAST_ICONS.warn + "</svg></span>" +
      '<div><div class="wh-advice__title">Fitness is read-only on this device</div>' +
      '<p class="wh-advice__body">' + body + "</p></div>";
  }

  /* Validate and repair the saved state in place so a single malformed record
     can't blank a whole view. Returns the number of issues fixed. Defensive:
     every collection becomes a clean array, every record gets its required
     fields, and obviously-broken records are dropped rather than left to throw. */
  function healState(s) {
    if (!s || typeof s !== "object") return 0;
    var fixed = 0;
    var def = defaultState();

    // 1) Collections must be arrays.
    ["sessions","bodyweightLog","measurements","sleepLog","nutritionLog","prs","goals","flagsHistory","phaseHistory","recoveryBlocks"].forEach(function (key) {
      if (!Array.isArray(s[key])) { s[key] = []; fixed++; }
    });

    // 2) Core objects must exist with required sub-keys (backfill from defaults).
    ["profile","equipment","equipmentLoads","prefs","tiers","benchmarks","currentPhase","streak","meta","running","training"].forEach(function (key) {
      if (!s[key] || typeof s[key] !== "object" || Array.isArray(s[key])) { s[key] = def[key]; fixed++; }
    });
    // running.runLog must be an array
    if (s.running && !Array.isArray(s.running.runLog)) { s.running.runLog = []; fixed++; }
    // training's maps must be objects (a sync can deliver anything)
    ["slots", "decisions", "exclusions", "pins", "skills"].forEach(function (key) {
      if (!isObj(s.training[key])) { s.training[key] = {}; fixed++; }
    });
    // ...and its single records an object or null
    ["limitations", "grip", "equipmentCheck"].forEach(function (key) {
      if (s.training[key] != null && !isObj(s.training[key])) { s.training[key] = null; fixed++; }
    });

    // 3) Every tier needs numeric level/progress and a reps target.
    if (s.tiers) {
      Object.keys(def.tiers).forEach(function (p) {
        var t = s.tiers[p];
        if (!t || typeof t !== "object") { s.tiers[p] = def.tiers[p]; fixed++; return; }
        if (typeof t.level !== "number" || t.level < 1 || t.level > 6) { t.level = 1; fixed++; }
        if (typeof t.progress !== "number" || t.progress < 0 || t.progress > 100) { t.progress = 0; fixed++; }
        if (typeof t.repsTarget !== "number" || t.repsTarget <= 0) { t.repsTarget = def.tiers[p].repsTarget; fixed++; }
      });
    }

    // 4) Sessions must each have an exercises array and a date; drop the broken ones.
    if (Array.isArray(s.sessions)) {
      var before = s.sessions.length;
      s.sessions = s.sessions.filter(function (sess) {
        return sess && typeof sess === "object" && sess.dateISO;
      });
      s.sessions.forEach(function (sess) {
        if (!Array.isArray(sess.exercises)) { sess.exercises = []; fixed++; }
        if (!Array.isArray(sess.flags)) sess.flags = [];
        sess.exercises.forEach(function (ex) {
          if (ex && !Array.isArray(ex.sets)) ex.sets = [];
        });
      });
      if (s.sessions.length !== before) fixed += (before - s.sessions.length);
    }

    // 5) Bodyweight/sleep/measurement entries must have a date + sane number.
    s.bodyweightLog = s.bodyweightLog.filter(function (e) { return e && e.dateISO && typeof e.kg === "number" && e.kg > 0; });
    s.sleepLog = s.sleepLog.filter(function (e) { return e && e.dateISO; });
    s.measurements = s.measurements.filter(function (e) { return e && e.dateISO; });

    // 6) Era must be 1 or 2.
    if (s.era !== 1 && s.era !== 2) { s.era = 1; fixed++; }

    return fixed;
  }

  function getState() { return STATE; }

  function saveState() {
    if (READ_ONLY) {
      /* Throttled: some actions save several times in a row. */
      if (Date.now() - lastBlockedToast > 5000) {
        lastBlockedToast = Date.now();
        toast("Not saved — fitness is read-only on this device. See the banner above.", "danger", 5000);
      }
      return STATE;
    }
    try {
      STATE.meta.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
    } catch (e) {
      console.error("IRONFRAME: save failed.", e);
      toast("Couldn't save — storage may be full or blocked.", "danger");
    }
    return STATE;
  }

  /* Dot-path setter supporting "a.b.c" and array indices "a.b.2.c".
     Auto-creates intermediate objects/arrays. Persists + re-renders. */
  function updateState(path, value, opts) {
    opts = opts || {};
    var keys = String(path).split(".");
    var node = STATE;
    for (var i = 0; i < keys.length - 1; i++) {
      var k = keys[i];
      var nextIsIndex = /^\d+$/.test(keys[i + 1]);
      if (node[k] === undefined || node[k] === null) node[k] = nextIsIndex ? [] : {};
      node = node[k];
    }
    node[keys[keys.length - 1]] = value;
    if (opts.save !== false) saveState();
    if (opts.render !== false) refresh();
    return STATE;
  }

  function resetState() {
    if (READ_ONLY) { saveState(); return; }   // writes nothing; says why
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    STATE = defaultState();
    saveState();
  }

  /* tiny non-schema UI prefs (last viewed section) */
  function uiGet(key, fallback) {
    try { var o = JSON.parse(localStorage.getItem(UI_KEY) || "{}"); return (key in o) ? o[key] : fallback; }
    catch (e) { return fallback; }
  }
  function uiSet(key, val) {
    try { var o = JSON.parse(localStorage.getItem(UI_KEY) || "{}"); o[key] = val; localStorage.setItem(UI_KEY, JSON.stringify(o)); }
    catch (e) {}
    /* The compact picker's shortcut reads "Resume" while a draft exists. Every
       write to the draft goes through here, so this is the one place to hear it. */
    if (key === "today.workout") updateNavState();
  }

  /* ----------------------------------------------------------------------
     VIEW REGISTRY + ROUTER
     Parts 2–6 call App.registerView(name, renderFn). The router toggles
     the matching <section> and invokes the registered renderer.
     -------------------------------------------------------------------- */
  var VIEWS = {};                 // name -> render function
  var activeSection = "dashboard";

  function registerView(name, fn) {
    VIEWS[name] = fn;
    // If this view is the one currently on screen, render it immediately.
    if (name === activeSection && !document.getElementById("app").hidden) {
      renderInto(name);
    }
  }

  function renderInto(name) {
    var el = document.getElementById("view-" + name);
    if (!el) return;
    var fn = VIEWS[name];
    if (typeof fn === "function") {
      try { fn(el, STATE); }
      catch (e) {
        console.error("View render error [" + name + "]:", e);
        placeholder(el, name, e);
      }
    } else {
      placeholder(el, name, null);
    }
  }

  /* Focus only follows a deliberate change. If focus is already inside Fitness (a nav
     click, a data-go button, the picker) the person did this, and the new heading is
     where they are now; at startup, after a saved-section restore or a background
     refresh focus is on <body>, and nothing here may take it. */
  function focusIsInFitness() {
    var host = document.getElementById("wh-view-fitness"), a = document.activeElement;
    return !!(host && a && a !== document.body && host.contains(a));
  }
  function focusHeading(name) {
    var h = document.querySelector("#view-" + name + " h1");
    if (!h) return;
    h.setAttribute("tabindex", "-1");
    h.focus({ preventScroll: true });
  }
  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function showSection(name, opts) {
    if (!SECTIONS.some(function (s) { return s.id === name; })) name = "dashboard";
    var followFocus = !!(opts && opts.focus) || focusIsInFitness();
    activeSection = name;
    uiSet("section", name);

    SECTIONS.forEach(function (s) {
      var view = document.getElementById("view-" + s.id);
      if (view) view.classList.toggle("hide", s.id !== name);
    });
    // re-trigger entrance animation on the active view
    var active = document.getElementById("view-" + name);
    if (active) { active.classList.remove("view"); void active.offsetWidth; active.classList.add("view"); }

    var parent = (SECTIONS.filter(function (x) { return x.id === name; })[0] || {}).parent;
    document.querySelectorAll(".nav__btn").forEach(function (b) {
      var active = b.dataset.section === name;
      b.classList.toggle("is-active", active || b.dataset.section === parent);
      if (active) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    closePicker();
    updateNavState();

    renderInto(name);
    window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
    if (followFocus) focusHeading(name);
  }

  function refresh() {
    if (!document.getElementById("app").hidden) renderInto(activeSection);
  }

  /* Default placeholder for any section a later part hasn't registered yet. */
  function placeholder(el, name, err) {
    var meta = SECTIONS.find(function (s) { return s.id === name; }) || { label: name };
    if (err) {
      // A registered view threw at render time — make the failure legible and recoverable.
      el.innerHTML =
        '<div class="page-head"><div class="eyebrow" style="color:var(--danger)">Section error</div>' +
        '<h1 class="display h2">' + meta.label + '</h1></div>' +
        '<div class="placeholder placeholder--error">' +
          '<svg class="placeholder__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="color:var(--danger)">' +
          '<path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>' +
          '<h4>This section hit an error</h4>' +
          '<p class="text-sm">Something in your saved data stopped this view from rendering. Your other data is safe. Export a backup, then try Repair — it validates and fixes your saved records without wiping progress.</p>' +
          '<p class="faint text-xs mono" style="margin-top:var(--sp-2);word-break:break-word">' + escapeHtml(String(err && err.message || err)) + '</p>' +
          '<div class="row" style="gap:var(--sp-2);justify-content:center;margin-top:var(--sp-4);flex-wrap:wrap">' +
            '<button class="btn btn--secondary btn--sm" id="ph-export-' + name + '">Export backup</button>' +
            '<button class="btn btn--primary btn--sm" id="ph-repair-' + name + '">Repair data</button>' +
          '</div>' +
        '</div>';
      var ex = document.getElementById("ph-export-" + name);
      if (ex) ex.addEventListener("click", exportData);
      var rp = document.getElementById("ph-repair-" + name);
      if (rp) rp.addEventListener("click", function () {
        var fixes = healState(STATE);
        saveState();
        toast(fixes > 0 ? ("Repaired " + fixes + " issue" + (fixes === 1 ? "" : "s") + ". Reloading view…") : "No issues found — reloading view…", fixes > 0 ? "success" : "info");
        renderInto(name);
      });
      return;
    }
    el.innerHTML =
      '<div class="page-head"><div class="eyebrow">Section</div>' +
      '<h1 class="display h2">' + meta.label + '</h1></div>' +
      '<div class="placeholder">' +
        '<svg class="placeholder__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
        '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/></svg>' +
        '<h4>' + meta.label + ' module ready to mount</h4>' +
        '<p class="text-sm">The foundation is wired. This section\'s widgets are delivered in a later build part and will appear here automatically once registered.</p>' +
      '</div>';
  }

  /* ----------------------------------------------------------------------
     NAVBAR BUILDER
     -------------------------------------------------------------------- */
  function navIcon(sec) {
    return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + ICONS[sec.icon] + '</svg>';
  }
  function navOrder() {
    return SECTIONS.slice().sort(function (a, b) { return (a.rank || 99) - (b.rank || 99); });
  }

  function buildNav() {
    var nav = document.getElementById("nav");
    var ordered = navOrder();
    nav.innerHTML = ordered.filter(function (s) { return s.bar !== false; }).map(function (s) {
      return '<button class="nav__btn" data-section="' + s.id + '" type="button">' + navIcon(s) +
        '<span>' + s.label + '</span></button>';
    }).join("");
    nav.querySelectorAll(".nav__btn").forEach(function (b) {
      b.addEventListener("click", function () { showSection(b.dataset.section, { focus: true }); });
    });
    buildPicker(ordered);
    updateNavState();
  }

  /* ----------------------------------------------------------------------
     COMPACT SECTION PICKER (PLAN-neobrutal-ui.md F5)
     Eight destinations in a 332px strip meant only two were ever fully visible,
     and the horizontal scrollbar was hidden. Below the width the full bar needs
     (a container query on .appbar, so the hub's sidebar and browser zoom count),
     CSS swaps it for this: a labelled toggle showing where you are, a
     Workout/Resume shortcut, and a panel listing every destination by group with
     Training setup at the end. A disclosure with ordinary buttons, not a menu:
     Tab walks the items, Escape closes and returns to the toggle, choosing one
     closes it and focuses the new page's heading.
     -------------------------------------------------------------------- */
  var pickerWired = false;

  function buildPicker(ordered) {
    var panel = document.getElementById("fit-panel");
    if (!panel) return;
    var gear = document.querySelector("#btn-settings svg");
    panel.innerHTML = SECTION_GROUPS.map(function (g) {
      var items = ordered.filter(function (s) { return (s.group || "Train") === g; });
      if (!items.length) return "";
      return '<div class="fitbar__group"><p class="fitbar__gt">' + g + '</p>' + items.map(function (s) {
        return '<button type="button" class="fitbar__item" data-section="' + s.id + '">' + navIcon(s) +
          '<span class="fitbar__name">' + s.label + '</span>' +
          '<span class="fitbar__blurb">' + (s.blurb || "") + '</span>' +
          '<span class="fitbar__mark"></span></button>';
      }).join("") + '</div>';
    }).join("") +
      '<div class="fitbar__group"><button type="button" class="fitbar__item" data-fitsetup>' +
        (gear ? gear.outerHTML : "") +
        '<span class="fitbar__name">Training setup</span>' +
        '<span class="fitbar__blurb">Goal, kit, session length and backup</span></button></div>';
    if (!pickerWired) { wirePicker(); pickerWired = true; }
  }

  function closePicker() {
    var panel = document.getElementById("fit-panel"), toggle = document.getElementById("fit-toggle");
    var picker = document.getElementById("fit-picker");
    if (panel) panel.hidden = true;
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (picker) picker.classList.remove("is-open");
  }

  function wirePicker() {
    var picker = document.getElementById("fit-picker"), toggle = document.getElementById("fit-toggle");
    var panel = document.getElementById("fit-panel"), go = document.getElementById("fit-go");
    if (!picker || !toggle || !panel || !go) return;

    toggle.addEventListener("click", function () {
      var open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      picker.classList.toggle("is-open", open);
      /* A tall list on a short phone scrolls; open it with the current row in view
         rather than leaving "you are here" below the fold of the panel. */
      var here = open && panel.querySelector('[aria-current="page"]');
      if (here) panel.scrollTop = Math.max(0, here.offsetTop - (panel.clientHeight - here.offsetHeight) / 2);
    });
    /* Workout opens preparation (or the draft, as Resume). It never starts a
       session and never builds a replacement: Today renders whichever exists. */
    go.addEventListener("click", function () { closePicker(); showSection("today", { focus: true }); });

    panel.addEventListener("click", function (e) {
      var item = e.target.closest(".fitbar__item");
      if (!item) return;
      closePicker();
      if (item.hasAttribute("data-fitsetup")) { document.getElementById("btn-settings").click(); return; }
      var id = item.dataset.section;
      /* The current destination: close and land on its heading, without re-rendering
         a form the person may be in the middle of. */
      if (id === activeSection) focusHeading(id);
      else showSection(id, { focus: true });
    });

    picker.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || panel.hidden) return;
      /* Handled here and stopped here: the rest timer listens for Escape on the
         document and would otherwise be cancelled by closing a menu. */
      e.stopPropagation(); e.preventDefault();
      closePicker(); toggle.focus();
    });
    picker.addEventListener("focusout", function (e) {
      if (!panel.hidden && e.relatedTarget && !picker.contains(e.relatedTarget)) closePicker();
    });
    document.addEventListener("click", function (e) {
      if (!panel.hidden && !picker.contains(e.target)) closePicker();
    });
  }

  /* Everything the two layouts show about "where am I" and "what is the shortcut". */
  function updateNavState() {
    var meta = SECTIONS.filter(function (s) { return s.id === activeSection; })[0] || SECTIONS[0];
    var cur = document.getElementById("fit-cur");
    if (cur) cur.textContent = meta.label;
    document.querySelectorAll(".fitbar__item[data-section]").forEach(function (b) {
      if (b.dataset.section === activeSection) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    var go = document.getElementById("fit-go");
    if (go) {
      var w = uiGet("today.workout", null);
      go.textContent = (w && w.dayType) ? "Resume" : "Workout";
    }
  }

  /* ----------------------------------------------------------------------
     MODAL HELPERS
     -------------------------------------------------------------------- */
  function openModal(id) {
    var m = document.getElementById(id);
    if (m) { m.classList.add("is-open"); document.body.style.overflow = "hidden"; }
  }
  function closeModal(id) {
    var m = id ? document.getElementById(id) : document.querySelector(".modal.is-open");
    if (m) m.classList.remove("is-open");
    if (!document.querySelector(".modal.is-open")) document.body.style.overflow = "";
  }
  function wireModals() {
    document.addEventListener("click", function (e) {
      var closer = e.target.closest("[data-close]");
      if (closer) { closeModal(closer.closest(".modal").id); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  /* ----------------------------------------------------------------------
     COLLAPSIBLE (event-delegated; any [data-collapsible] header toggles)
     -------------------------------------------------------------------- */
  function wireCollapsibles() {
    document.addEventListener("click", function (e) {
      var head = e.target.closest("[data-collapsible]");
      if (!head) return;
      var box = head.closest(".collapsible");
      if (box) {
        var open = box.classList.toggle("is-open");
        head.setAttribute("aria-expanded", open ? "true" : "false");
      }
    });
  }

  /* ----------------------------------------------------------------------
     TOAST
     -------------------------------------------------------------------- */
  var TOAST_ICONS = {
    success: '<path d="M20 6 9 17l-5-5"/>',
    warn:    '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    danger:  '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
    info:    '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>'
  };
  function toast(msg, type, ms) {
    type = type || "info";
    var host = document.getElementById("toast-host");
    var el = document.createElement("div");
    el.className = "toast toast--" + type;
    el.innerHTML =
      '<svg class="toast__ic ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      (TOAST_ICONS[type] || TOAST_ICONS.info) + '</svg><span>' + msg + '</span>';
    host.appendChild(el);
    var t = setTimeout(remove, ms || 3200);
    el.addEventListener("click", remove);
    function remove() { clearTimeout(t); el.classList.add("out"); setTimeout(function () { el.remove(); }, 300); }
  }

  /* ----------------------------------------------------------------------
     EXPORT / IMPORT / RESET
     -------------------------------------------------------------------- */
  function exportData() {
    var blob = new Blob([JSON.stringify(STATE, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var stamp = new Date().toISOString().slice(0, 10);
    a.href = url; a.download = "basalt-backup-" + stamp + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("Backup exported.", "success");
  }

  function importData(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        if (!isObj(parsed)) throw new Error("not an object");
        if (typeof parsed.version === "number" && parsed.version > SCHEMA_VERSION) {
          toast("That backup is from a newer version of the app. Update this device, then import it.", "danger", 6000);
          return;
        }
        /* Migrated before read-only is lifted: a migration that throws must
           leave the guard up, not clear it over the defaults on screen. */
        var next = migrate(parsed);
        /* An import is the recovery the unreadable banner points to. The raw
           copy already exists, so this is the one write allowed over it. */
        READ_ONLY = null;
        renderReadOnlyBanner();
        STATE = next;
        saveState();
        closeModal("modal-settings");
        if (STATE.meta && STATE.meta.onboarded) { enterApp(); refresh(); }
        else { bootstrap(); }
        toast("Data restored successfully.", "success");
      } catch (e) {
        toast("Import failed — not a valid BASALT backup.", "danger");
      }
    };
    reader.onerror = function () { toast("Couldn't read that file.", "danger"); };
    reader.readAsText(file);
  }

  function activeThemeId() {
    try { return localStorage.getItem(THEME_KEY) || "default"; } catch(e) { return "default"; }
  }

  /* The hub owns both `data-theme` and <meta name="theme-color"> now — see
     js/theme.js and css/palettes.css, where the palettes actually live. Writing
     the attribute from here would wipe the user's choice on every Fitness boot,
     so this only keeps the legacy `ironframe.theme` key in step for the picker
     below, which is itself vestigial (the standalone app's theme grid isn't in
     index.html). Kept rather than deleted so the exported API stays intact. */
  function applyTheme(id, save) {
    if (save) { try { localStorage.setItem(THEME_KEY, id); } catch(e) {} }
  }

  function populateThemePicker() {
    var cur = activeThemeId();
    var grid = document.getElementById("set-theme-grid");
    if (!grid) return;
    grid.innerHTML = THEMES.map(function (t) {
      var active = t.id === cur;
      return '<button class="set-theme-card' + (active ? " is-active" : "") + '" data-settheme="' + t.id + '" type="button" aria-pressed="' + active + '">' +
        '<div class="set-theme-preview">' +
          '<div class="set-theme-preview__glow" style="background:radial-gradient(80% 80% at 30% 30%,' + t.glow + ',transparent 70%)"></div>' +
          '<div class="set-theme-preview__dots">' +
            '<span class="set-theme-preview__dot" style="background:' + t.primary + ';opacity:.9"></span>' +
            '<span class="set-theme-preview__dot" style="background:' + t.secondary + ';opacity:.75"></span>' +
            '<span class="set-theme-preview__dot" style="background:' + t.text + ';opacity:.45"></span>' +
          '</div>' +
          '<div class="set-theme-preview__bar" style="background:linear-gradient(90deg,' + t.primary + ',' + t.secondary + ')"></div>' +
        '</div>' +
        '<div class="set-theme-label">' + t.label + '</div>' +
        '<div class="set-theme-card__tick">' +
          '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>' +
        '</div>' +
      '</button>';
    }).join("");

    grid.querySelectorAll("[data-settheme]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.dataset.settheme;
        applyTheme(id, false);   // live preview — don't save yet
        grid.querySelectorAll("[data-settheme]").forEach(function (x) {
          var on = x.dataset.settheme === id;
          x.classList.toggle("is-active", on);
          x.setAttribute("aria-pressed", on);
        });
      });
    });
  }

  var EQUIP_META = [
    { key: "pullupBar",  label: "Pull-up bar" },
    { key: "dumbbells",  label: "Dumbbells" },
    { key: "bench",      label: "Bench" },
    { key: "kettlebells",label: "Kettlebells" },
    { key: "rings",      label: "Gymnastic rings" },
    { key: "bands",      label: "Resistance bands" },
    { key: "parallettes",label: "Parallettes" },
    { key: "dipBars",    label: "Dip bars" },
    { key: "lowBar",     label: "Waist-height bar" },
    { key: "vest",       label: "Weighted vest" },
    { key: "abWheel",    label: "Ab wheel" },
    { key: "jumpRope",   label: "Jump rope" },
    { key: "box",        label: "Sturdy box" },
    { key: "barbell",    label: "Barbell and rack" },   // a back squat is unracked: the token means both
    { key: "nordicAnchor", label: "Nordic anchor" }   // one line, like the other tiles; the card says what it is
  ];
  var WEIGHT_IMPLEMENTS = [["dumbbells", "Dumbbells"], ["kettlebells", "Kettlebells"]];
  var LIMIT_JOINTS = [["wrist", "Wrist"], ["elbow", "Elbow"], ["shoulder", "Shoulder"], ["neck", "Neck"],
                      ["lowerBack", "Lower back"], ["hip", "Hip"], ["knee", "Knee"], ["ankle", "Ankle"]];

  /* Weights you have (plan C5): per implement, adjustable (a step and an
     optional heaviest) or a fixed list. No record is today's behaviour, so the
     form shows that rather than inventing one. */
  function weightSpec(impl) {
    var rec = (STATE.equipmentLoads || {})[impl];
    return rec || { mode: "adjustable", stepKg: window.TRAINING_DATA.LOAD_STEP_KG[impl], maxKg: null };
  }
  function populateWeights() {
    var host = document.getElementById("set-weights");
    if (!host) return;
    host.innerHTML = WEIGHT_IMPLEMENTS.map(function (w) {
      var sp = weightSpec(w[0]), fixed = sp.mode === "fixed";
      return '<div class="field" data-w="' + w[0] + '"><span class="field__label">' + w[1] + '</span>' +
        '<div class="seg" data-w-mode="' + w[0] + '">' +
          '<button class="seg__btn' + (fixed ? "" : " is-active") + '" data-wm="adjustable" type="button">Adjustable</button>' +
          '<button class="seg__btn' + (fixed ? " is-active" : "") + '" data-wm="fixed" type="button">Fixed weights</button></div>' +
        '<div class="set-grid mt-2" data-w-adj="' + w[0] + '"' + (fixed ? " hidden" : "") + '>' +
          '<label class="field"><span class="field__label">Step (kg)</span><input class="input" id="set-w-' + w[0] + '-step" type="number" min="0.5" max="50" step="0.5" inputmode="decimal" value="' + (sp.stepKg != null ? sp.stepKg : "") + '"></label>' +
          '<label class="field"><span class="field__label">Heaviest (kg)</span><input class="input" id="set-w-' + w[0] + '-max" type="number" min="0.5" max="200" step="0.5" inputmode="decimal" placeholder="no limit" value="' + (sp.maxKg != null ? sp.maxKg : "") + '"></label></div>' +
        '<label class="field mt-2" data-w-fix="' + w[0] + '"' + (fixed ? "" : " hidden") + '><span class="field__label">Weights you have (kg, commas)</span>' +
          '<input class="input" id="set-w-' + w[0] + '-list" type="text" inputmode="decimal" placeholder="5, 7.5, 12.5" value="' + escapeHtml((sp.kg || []).join(", ")) + '"></label></div>';
    }).join("");
    host.querySelectorAll("[data-w-mode]").forEach(function (seg) {
      seg.querySelectorAll("[data-wm]").forEach(function (b) {
        b.addEventListener("click", function () {
          var impl = seg.dataset.wMode, fixed = b.dataset.wm === "fixed";
          seg.querySelectorAll("[data-wm]").forEach(function (x) { x.classList.toggle("is-active", x === b); });
          host.querySelector('[data-w-adj="' + impl + '"]').hidden = fixed;
          host.querySelector('[data-w-fix="' + impl + '"]').hidden = !fixed;
        });
      });
    });
  }
  /* The records the form describes, or { error } with the sentence to show
     inline. Nothing is written here. */
  function readWeights() {
    var out = {}, v = function (id) { return document.getElementById(id).value.trim(); };
    for (var i = 0; i < WEIGHT_IMPLEMENTS.length; i++) {
      var impl = WEIGHT_IMPLEMENTS[i][0], name = WEIGHT_IMPLEMENTS[i][1].toLowerCase();
      var fixed = document.querySelector('[data-w-mode="' + impl + '"] .is-active').dataset.wm === "fixed";
      if (fixed) {
        var kg = v("set-w-" + impl + "-list").split(/[,\s]+/).filter(Boolean).map(Number);
        if (!kg.length || kg.some(function (x) { return !(x > 0 && x <= 200); }))
          return { error: "List the " + name + " you have as kilograms between 0.5 and 200, separated by commas." };
        out[impl] = { mode: "fixed", kg: kg.filter(function (x, j) { return kg.indexOf(x) === j; }).sort(function (a, b) { return a - b; }) };
      } else {
        var step = Number(v("set-w-" + impl + "-step")), max = v("set-w-" + impl + "-max");
        if (!(step >= 0.5 && step <= 50)) return { error: "The " + name + " step is between 0.5 and 50 kg." };
        if (max !== "" && !(Number(max) >= step && Number(max) <= 200)) return { error: "The heaviest " + name + " can't be lighter than one step, or over 200 kg. Leave it blank for no limit." };
        out[impl] = { mode: "adjustable", stepKg: step, maxKg: max === "" ? null : Number(max) };
      }
    }
    return out;
  }

  /* Joint limits (plan C3): a select per joint. */
  function populateLimits() {
    var host = document.getElementById("set-limits"), L = STATE.training.limitations || {};
    if (!host) return;
    host.innerHTML = LIMIT_JOINTS.map(function (j) {
      var cur = L[j[0]] || "none";
      return '<label class="field"><span class="field__label">' + j[1] + '</span><select class="select" data-limit="' + j[0] + '" aria-label="' + j[1] + ' limit">' +
        [["none", "No limit"], ["careful", "Careful"], ["avoid", "Avoid"]].map(function (o) {
          return '<option value="' + o[0] + '"' + (cur === o[0] ? " selected" : "") + '>' + o[1] + '</option>';
        }).join("") + '</select></label>';
    }).join("");
  }
  function readLimits() {
    var out = {};
    document.querySelectorAll("#set-limits [data-limit]").forEach(function (sel) { if (sel.value !== "none") out[sel.dataset.limit] = sel.value; });
    return out;
  }
  function setSettingsError(msg) {
    var el = document.getElementById("set-err");
    if (!el) return;
    el.textContent = msg || "";
    el.hidden = !msg;
    if (msg) el.scrollIntoView({ block: "nearest" });
  }

  function populateSettings() {
    var s = STATE;
    document.getElementById("settings-version").textContent = s.version;
    document.getElementById("set-name").value = s.profile.name || "";
    document.getElementById("set-age").value = s.profile.age || "";
    document.getElementById("set-height").value = s.profile.heightCm || "";
    document.getElementById("set-weight").value = s.profile.weightKg || "";
    document.getElementById("set-rest").value = (s.prefs && s.prefs.restDefaultSec) || 90;
    document.getElementById("set-rest-hold").value = (s.prefs && s.prefs.restHoldSec) || 60;
    /* default intensity */
    var curVol = App.engine.volumeModeOf(s.prefs && s.prefs.volumeMode);   // an old "max" shows as +1 set
    document.querySelectorAll("[data-voldefault]").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.voldefault === curVol);
    });
    /* default length */
    var curLen = (s.prefs && s.prefs.sessionLength) || "focused";
    document.querySelectorAll("[data-lengthdefault]").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.lengthdefault === curLen);
    });
    populateThemePicker();
    populateWeights();
    populateLimits();
    setSettingsError("");

    // goal segment
    document.querySelectorAll("#set-goal .seg__btn").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.goal === (s.profile.goal || "both"));
    });
    document.getElementById("set-weightdir").value = s.profile.weightDirection || "";

    // equipment grid
    var grid = document.getElementById("set-equip");
    grid.innerHTML = EQUIP_META.map(function (e) {
      var on = !!s.equipment[e.key];
      return '<button class="set-equip__item ' + (on ? "is-on" : "") + '" data-equip="' + e.key + '" type="button" aria-pressed="' + on + '">' +
        '<span class="set-equip__check"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>' +
        '<span>' + e.label + '</span>' +
      '</button>';
    }).join("");
    grid.querySelectorAll("[data-equip]").forEach(function (b) {
      b.addEventListener("click", function () {
        var on = b.classList.toggle("is-on");
        b.setAttribute("aria-pressed", on);
      });
    });
  }

  function saveSettings() {
    var s = STATE;
    /* Read first, so a bad weight list stops the save before anything else
       is written, and says why where you're looking. */
    var weights = readWeights();
    if (weights.error) { setSettingsError(weights.error); return; }
    setSettingsError("");
    var name = document.getElementById("set-name").value.trim();
    var age = parseInt(document.getElementById("set-age").value, 10);
    var h = parseFloat(document.getElementById("set-height").value);
    var wt = parseFloat(document.getElementById("set-weight").value);
    var rest = parseInt(document.getElementById("set-rest").value, 10);
    var restHold = parseInt(document.getElementById("set-rest-hold").value, 10);

    if (name) s.profile.name = name.slice(0, 24);
    if (age >= 13 && age <= 100) s.profile.age = age;
    if (h >= 120 && h <= 230) s.profile.heightCm = h;
    if (wt >= 30 && wt <= 250) s.profile.weightKg = wt;
    // recompute BMI
    var hM = (Number(s.profile.heightCm) || 0) / 100;
    if (hM > 0) s.profile.bmi = Math.round(((Number(s.profile.weightKg) || 0) / (hM * hM)) * 10) / 10;

    /* A new goal re-ranges your prescriptions (engine.setGoal); the toast
       below says how many changed. */
    var goalBtn = document.querySelector("#set-goal .seg__btn.is-active"), reRanged = null;
    if (goalBtn && goalBtn.dataset.goal !== (s.profile.goal || "both")) reRanged = App.engine.setGoal(goalBtn.dataset.goal);
    s.profile.weightDirection = document.getElementById("set-weightdir").value || null;

    if (!s.prefs) s.prefs = {};
    if (rest >= 15 && rest <= 600) s.prefs.restDefaultSec = rest;
    if (restHold >= 15 && restHold <= 600) s.prefs.restHoldSec = restHold;
    var volBtn = document.querySelector("[data-voldefault].is-active");
    if (volBtn) s.prefs.volumeMode = volBtn.dataset.voldefault;
    var lenBtn = document.querySelector("[data-lengthdefault].is-active");
    if (lenBtn) s.prefs.sessionLength = lenBtn.dataset.lengthdefault;

    // equipment
    document.querySelectorAll("#set-equip [data-equip]").forEach(function (b) {
      s.equipment[b.dataset.equip] = b.classList.contains("is-on");
    });

    /* weights: only a record that differs from what applies now is written,
       so an untouched form leaves a save with no record as it was */
    if (!s.equipmentLoads) s.equipmentLoads = {};
    Object.keys(weights).forEach(function (impl) {
      if (JSON.stringify(weights[impl]) !== JSON.stringify(weightSpec(impl))) s.equipmentLoads[impl] = weights[impl];
    });
    /* limits are stamped, and re-stamped only when they change */
    var limits = readLimits(), had = s.training.limitations || {};
    if (JSON.stringify(limits) !== JSON.stringify(Object.keys(had).filter(function (k) { return k !== "at"; }).sort().reduce(function (o, k) { o[k] = had[k]; return o; }, {}))) {
      var lr = App.engine.setLimitations(limits);
      if (lr && lr.error) { setSettingsError(lr.error); return; }
    }

    /* save selected colour scheme */
    var selTheme = document.querySelector("#set-theme-grid [data-settheme].is-active");
    if (selTheme) applyTheme(selTheme.dataset.settheme, true);
    else applyTheme("default", true);

    saveState();
    closeModal("modal-settings");
    if (App.refresh) App.refresh();
    toast(reRanged ? "Settings saved. " + (reRanged.length ? reRanged.length + " prescription" + (reRanged.length === 1 ? "" : "s") +
      " moved to your new goal's range." : "No prescription's range changes with this goal.") : "Settings saved.", "success");
  }

  function wireSettings() {
    document.getElementById("btn-settings").addEventListener("click", function () {
      populateSettings();
      openModal("modal-settings");
    });
    /* vol mode default */
    document.querySelectorAll("[data-voldefault]").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("[data-voldefault]").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      });
    });
    /* session length default */
    document.querySelectorAll("[data-lengthdefault]").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("[data-lengthdefault]").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      });
    });
    document.getElementById("btn-settings-save").addEventListener("click", saveSettings);
    document.querySelectorAll("#set-goal .seg__btn").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#set-goal .seg__btn").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      });
    });

    document.getElementById("btn-export").addEventListener("click", exportData);
    document.getElementById("btn-import").addEventListener("click", function () {
      document.getElementById("file-import").click();
    });
    document.getElementById("file-import").addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) importData(e.target.files[0]);
      e.target.value = "";
    });
    document.getElementById("btn-reset").addEventListener("click", function () {
      closeModal("modal-settings"); openModal("modal-reset");
    });
    document.getElementById("btn-reset-confirm").addEventListener("click", function () {
      resetState(); closeModal("modal-reset"); bootstrap();
      toast("Program reset. Let's set you up again.", "info");
    });
  }

  /* ----------------------------------------------------------------------
     ONBOARDING HOOK (Part 2 overrides App.renderOnboarding)
     The default below is a minimal stub so the app is fully usable now.
     -------------------------------------------------------------------- */
  function renderOnboarding() {
    var host = document.getElementById("onboarding");
    var p = STATE.profile;
    host.innerHTML =
      '<div class="onb-wrap"><div class="card card--accent card--pad-lg onb-card stack">' +
        '<div><div class="eyebrow">First launch</div>' +
        '<h1 class="display h1">Welcome to<br>BASALT</h1></div>' +
        '<p class="muted">Your adaptive, bodyweight-first training operating system. ' +
        'You begin in <b style="color:var(--era1)">Era I — Calisthenics Foundation</b>: pure bodyweight work to build tendons, control and clean reps. ' +
        'Dumbbells &amp; kettlebells unlock only once you clear the Era I benchmarks.</p>' +
        '<div class="grid grid-2">' +
          '<div class="card stat"><div class="stat__label">Height</div><div class="stat__value" style="font-size:var(--fs-2xl)">' + p.heightCm + '<small>cm</small></div></div>' +
          '<div class="card stat"><div class="stat__label">Weight</div><div class="stat__value" style="font-size:var(--fs-2xl)">' + p.weightKg + '<small>kg</small></div></div>' +
          '<div class="card stat"><div class="stat__label">Goal</div><div class="stat__value" style="font-size:var(--fs-lg)">Lean mass + strength</div></div>' +
          '<div class="card stat"><div class="stat__label">Surplus target</div><div class="stat__value" style="font-size:var(--fs-2xl)">' + p.surplusTarget + '<small>kcal</small></div></div>' +
        '</div>' +
        '<p class="faint text-xs">The full 5-step fitness test &amp; Era-placement flow attaches here in a later build part. For now, enter the OS to explore the foundation.</p>' +
        '<button class="btn btn--primary btn--lg btn--block" id="onb-begin">Enter the OS →</button>' +
      '</div></div>';
    document.getElementById("onb-begin").addEventListener("click", function () { completeOnboarding(); });
  }

  function completeOnboarding(patch) {
    if (patch && typeof patch === "object") STATE = deepMerge(STATE, patch);
    STATE.meta.onboarded = true;
    saveState();
    document.getElementById("onboarding").classList.remove("is-open");
    document.getElementById("onboarding").setAttribute("aria-hidden", "true");
    enterApp();
    showSection("dashboard");
    toast("You're in. Era I begins now — let's build the frame.", "success");
  }

  /* ----------------------------------------------------------------------
     STARTER DASHBOARD (Part 4 replaces with the full dashboard).
     Rendered from live state so the storage contract is demonstrably wired.
     -------------------------------------------------------------------- */
  function renderStarterDashboard(el, s) {
    var phase = s.currentPhase;
    var dayInfo = phaseDayInfo(phase);
    var eraBadge = s.era === 1
      ? '<span class="badge badge--era1"><span class="dot"></span>Era I · Calisthenics</span>'
      : '<span class="badge badge--era2"><span class="dot"></span>Era II · Hybrid</span>';
    var benchKeys = Object.keys(s.benchmarks);
    var benchDone = benchKeys.filter(function (k) { return s.benchmarks[k].complete; }).length;

    el.innerHTML =
      '<div class="page-head row between wrap">' +
        '<div><div class="eyebrow">Command center</div>' +
        '<h1 class="display h2">Welcome back, ' + escapeHtml(s.profile.name) + '</h1></div>' +
        eraBadge +
      '</div>' +

      '<div class="grid grid-4 mb-4">' +
        statTile("Current phase", "P" + phase.number, "of an open-ended ladder") +
        statTile("Phase day", dayInfo.day + "/" + phase.lengthDays, dayInfo.remaining + " days to evaluation") +
        statTile("Streak", String(streakIfFresh(s.streak)), (s.streak.best ? "best " + s.streak.best + " 🔥" : "start one today")) +
        statTile("Bodyweight", String(latestWeight(s)), "kg · target " + s.profile.surplusTarget + " kcal") +
      '</div>' +

      '<div class="grid" style="grid-template-columns:1.4fr 1fr">' +
        '<div class="card card--notch">' +
          '<div class="card__head"><div class="card__title">Phase ' + phase.number + ' progress</div>' +
          '<span class="badge">' + dayInfo.pct + '% complete</span></div>' +
          '<div class="progress" style="height:14px"><div class="progress__bar" style="width:' + dayInfo.pct + '%"></div></div>' +
          '<p class="muted text-sm mt-4">A phase report is ready at day ' + phase.lengthDays + ': attendance, progress per movement and recovery, as three separate readings with their sample sizes and no overall grade. Closing it changes nothing in your program.</p>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card__head"><div class="card__title">Era I benchmarks</div>' +
          '<span class="badge badge--era1">' + benchDone + '/' + benchKeys.length + '</span></div>' +
          '<div class="progress progress--era1"><div class="progress__bar" style="width:' + Math.round(benchDone / benchKeys.length * 100) + '%"></div></div>' +
          '<p class="muted text-sm mt-4">Clear all five to graduate into Era II and unlock weighted overload tools.</p>' +
        '</div>' +
      '</div>' +

      '<p class="faint text-xs mt-6 mono">FOUNDATION ACTIVE · storage, router &amp; design system online · richer dashboard widgets mount in a later build part.</p>';
  }

  /* ---- small render helpers ---- */

  /* A streak only counts if it was touched within the last few days. Kept
     self-contained: Part 1 must not depend on helpers from later parts. */
  function streakIfFresh(streak) {
    if (!streak || !streak.lastISO || !streak.count) return 0;
    var last = new Date(streak.lastISO);
    if (isNaN(last)) return 0;
    var days = Math.floor((Date.now() - last.getTime()) / 86400000);
    return days <= 3 ? streak.count : 0;
  }

  function statTile(label, value, sub) {
    return '<div class="card stat">' +
      '<div class="stat__label">' + label + '</div>' +
      '<div class="stat__value">' + value + '</div>' +
      '<div class="stat__sub">' + sub + '</div></div>';
  }
  function phaseDayInfo(phase) {
    var start = new Date(phase.startISO).getTime();
    var elapsed = Math.floor((Date.now() - start) / 86400000);
    var day = Math.min(Math.max(elapsed + 1, 1), phase.lengthDays);
    var remaining = Math.max(phase.lengthDays - day, 0);
    var pct = Math.min(Math.round(day / phase.lengthDays * 100), 100);
    return { day: day, remaining: remaining, pct: pct };
  }
  function latestWeight(s) {
    if (s.bodyweightLog.length) return s.bodyweightLog[s.bodyweightLog.length - 1].kg;
    return s.profile.weightKg;
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ----------------------------------------------------------------------
     BOOTSTRAP — first-launch detection & app entry
     -------------------------------------------------------------------- */
  function enterApp() {
    document.getElementById("appbar").hidden = false;
    document.getElementById("app").hidden = false;
  }

  function bootstrap() {
    load();
    buildNav();
    renderReadOnlyBanner();

    /* A read-only save never routes to onboarding: finishing it is the write
       that used to erase an unreadable history. */
    if (!STATE.meta.onboarded && !READ_ONLY) {
      // First launch (or post-reset) -> onboarding overlay.
      document.getElementById("appbar").hidden = true;
      document.getElementById("app").hidden = true;
      var onb = document.getElementById("onboarding");
      onb.classList.add("is-open");
      onb.setAttribute("aria-hidden", "false");
      App.renderOnboarding();
      return;
    }

    // Returning user -> main app, restore last section.
    enterApp();
    var last = uiGet("section", "dashboard");
    showSection(last);
  }

  /* Called by Hub.storage (js/storage.js's applyMerged) once a sync merge —
     folder or Drive — has written fresh data into this key. BASALT boots from
     its own DOMContentLoaded handler, which fires and reads localStorage
     before Hub.storage's async merge has any chance to finish, so a second
     machine's fitness history used to land correctly in localStorage while
     the already-rendered app never noticed — the same "stale tab" failure
     the sync system exists to prevent, just one layer this app was never
     wired into. */
  function reloadFromRemote() {
    /* Whether the app was on screen, not STATE.meta.onboarded: a read-only
       device shows the app with an un-onboarded default state. */
    var wasInApp = !document.getElementById("app").hidden;
    load();   // re-decides READ_ONLY: a sync can bring in a newer save, or a readable one
    renderReadOnlyBanner();
    var inApp = STATE.meta.onboarded || READ_ONLY;
    if (inApp && !wasInApp) {
      // Another device had already finished onboarding — adopt that instead
      // of making you repeat a setup flow you've already done elsewhere.
      var onb = document.getElementById("onboarding");
      onb.classList.remove("is-open");
      onb.setAttribute("aria-hidden", "true");
      buildNav();
      enterApp();
      showSection(uiGet("section", "dashboard"));
      return;
    }
    if (inApp || wasInApp) refresh();
    // Still not onboarded on this machine either: nothing arrived that
    // should replace the onboarding overlay currently on screen.
  }

  /* ----------------------------------------------------------------------
     PUBLIC NAMESPACE
     -------------------------------------------------------------------- */
  var App = window.App = {
    // constants / data
    STORAGE_KEY: STORAGE_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    PROGRESSIONS: PROGRESSIONS,
    SECTIONS: SECTIONS,
    ICONS: ICONS,

    // state layer
    get STATE() { return STATE; },
    getState: getState,
    saveState: saveState,
    updateState: updateState,
    resetState: resetState,
    defaultState: defaultState,
    migrate: migrate,
    slotsFromTiers: slotsFromTiers,
    deepMerge: deepMerge,
    reloadFromRemote: reloadFromRemote,
    recountStreak: recountStreak,
    streakGap: streakGap,
    readOnly: function () { return READ_ONLY; },   // null | "unreadable" | "newer"

    // routing / views
    showSection: showSection,
    registerView: registerView,
    refresh: refresh,

    // UI helpers (reusable by all parts)
    openModal: openModal,
    closeModal: closeModal,
    toast: toast,

    // onboarding (overridable by Part 2)
    renderOnboarding: renderOnboarding,
    completeOnboarding: completeOnboarding,

    // shared utilities
    util: {
      escapeHtml: escapeHtml,
      phaseDayInfo: phaseDayInfo,
      latestWeight: latestWeight,
      statTile: statTile,
      uiGet: uiGet,
      uiSet: uiSet
    },

    // colour theme API
    applyTheme: applyTheme,
    activeThemeId: activeThemeId,
    THEMES: THEMES
  };

  /* ----------------------------------------------------------------------
     INIT
     -------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    // Apply saved colour scheme before anything renders
    applyTheme(activeThemeId(), false);
    wireModals();
    wireCollapsibles();
    wireSettings();
    // Register the starter dashboard. Part 4 overrides via registerView("dashboard", …).
    registerView("dashboard", renderStarterDashboard);
    bootstrap();
  });

})();

/* ===== BASALT script block 2 (source lines 1816-2501) ===== */
/* ============================================================================
   IRONFRAME — PART 2 · CONTENT DATABASE  (pure data module)
   ----------------------------------------------------------------------------
   No UI. No state writes. Just the constants every other part consumes.

   GLOBALS EXPOSED:
     EXERCISE_DB   { id -> exercise }   7 patterns x 6 levels + Era-2 add-ons
     WARMUPS       { dayType -> [steps] }
     COOLDOWNS     { dayType -> [stretches] }
     SUBSTITUTIONS { pattern -> bodyPart -> severity -> {era1,era2} }
     FOODS         [ {id, macros...} ]   high-calorie clean-bulk list

   ID CONVENTIONS (referenced by Parts 3–6):
     • Ladder movements:  "<pattern>_<level>"        e.g. push_1 … push_6
     • Era-2 add-ons:     "<pattern>_e2_<slug>"       e.g. push_e2_weighted
     • Day types:         push | pull | legs | fullbody
     • Patterns:          push pull squat hinge core shoulder dip
     • Body parts:        wrist shoulder elbow knee hip ankle lowerBack
                          hamstring neck hipFlexor grip
     • Severities:        mild | moderate | sharp
   ========================================================================== */
(function () {
  "use strict";

  /* ==========================================================================
     1) EXERCISE_DB
     Each entry:
       id, pattern, name, level (1-6 | null for e2), era (1|2),
       mode "reps"|"hold", unit "reps"|"sec",
       equipment [] (tokens match APP_STATE.equipment keys; [] = bodyweight),
       cues[3-5], mistakes[1-2], readiness, injury
     ========================================================================== */
  var EXERCISE_DB = {};
  function def(e) { EXERCISE_DB[e.id] = e; }

  /* ----- PUSH ----- */
  def({ id:"push_1", pattern:"push", name:"Wall Push-up", level:1, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["Stand arm's length from a wall, hands at shoulder height and width.","Brace your abs and squeeze glutes so the body is one rigid line.","Lower your chest to the wall under control, elbows tracking ~45°.","Press away fully and protract the shoulder blades at the top."],
    mistakes:["Letting the hips sag or pike instead of staying plank-tight.","Flaring elbows straight out to the sides, stressing the shoulders."],
    readiness:"Ready to advance when you can do 20 slow, flawless reps with a 2-second lowering phase.",
    injury:"Keep wrists warm; if they ache, use a slight fist or push-up handles." });

  def({ id:"push_2", pattern:"push", name:"Push-up", level:2, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["Hands just outside shoulder width, fingers spread, index forward.","Maintain a straight line from ears to ankles — no sagging hips.","Lower until elbows reach ~90°, keeping them at a 45° angle to the torso.","Drive the floor away and finish with shoulder blades spread."],
    mistakes:["Dropping the head/hips first so the body bends instead of moving as a unit.","Half-repping — not lowering the chest near the floor."],
    readiness:"Advance at 15 clean unbroken reps to full depth (also an Era I benchmark).",
    injury:"Wrist discomfort? Switch to fists or parallettes to keep the joint neutral." });

  def({ id:"push_3", pattern:"push", name:"Diamond Push-up", level:3, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["Form a diamond with thumbs and index fingers under the sternum.","Keep elbows tucked tight to the ribs throughout.","Lower the chest to touch the hands, body rigid.","Press up and fully extend, emphasising the triceps."],
    mistakes:["Letting elbows flare wide, turning it into a regular push-up.","Hiking the hips to shorten the range."],
    readiness:"Advance at 12 strict reps with elbows staying tucked the entire set.",
    injury:"Stop if you feel sharp inner-elbow pain — widen the hands slightly." });

  def({ id:"push_4", pattern:"push", name:"Decline Push-up", level:4, era:1, mode:"reps", unit:"reps", equipment:["bench"],
    cues:["Place feet on a bench so the body is angled head-down.","Hands slightly wider than shoulders, core braced hard.","Lower until the chest nears the floor, elbows ~45°.","Press through and keep the spine neutral, not arched."],
    mistakes:["Overarching the lower back as the feet elevate.","Letting the head crane forward instead of staying packed."],
    readiness:"Advance at 12 controlled reps with the chest reaching the floor.",
    injury:"Higher decline loads the shoulders — keep blades down and back." });

  def({ id:"push_5", pattern:"push", name:"Archer Push-up", level:5, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["Take a wide hand stance, one arm bent, the other straight.","Lower toward the bent (working) arm; the straight arm only assists.","Keep the body square to the floor — resist rotating.","Press back to centre and alternate sides each rep."],
    mistakes:["Twisting the torso to cheat the working arm.","Bending the support arm so it shares too much load."],
    readiness:"Advance at 6–8 reps per side with minimal assistance from the straight arm.",
    injury:"Demands shoulder stability — pause if the front shoulder pinches." });

  def({ id:"push_6", pattern:"push", name:"Pseudo Planche Push-up", level:6, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["Place hands at hip level, fingers pointing back or out.","Lean the shoulders well forward past the hands.","Maintain protracted scapulae and a hollow body line.","Lower and press while keeping the aggressive forward lean."],
    mistakes:["Losing the lean mid-rep, reverting to a normal push-up.","Letting the lower back arch as the shoulders fatigue."],
    readiness:"Mastery: 8+ reps with a deep lean — gateway to full planche work.",
    injury:"Heavy wrist load; build gradually and stretch wrists between sets." });

  def({ id:"push_e2_weighted", pattern:"push", name:"Weighted Push-up", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells","vest"],
    cues:["Have a partner or yourself place a plate/dumbbell across the upper back.","Keep the same rigid plank line as a bodyweight push-up.","Lower under control; the load should not shift your form.","Press explosively while keeping the weight centred."],
    mistakes:["Letting the weight slide toward the neck or hips.","Reducing depth to handle the extra load."],
    readiness:"Progress the load ~2.5kg once you hit 12 clean reps at the current weight.",
    injury:"Only an overload tool once Era I push form is dialled in." });

  def({ id:"push_e2_dbpress", pattern:"push", name:"Dumbbell Floor/Bench Press", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells","bench"],
    cues:["Lie on the bench (or floor), dumbbells over the chest.","Lower with elbows ~45°, stretching the chest.","Keep wrists stacked over elbows the whole time.","Press up and slightly together at the top without clanging."],
    mistakes:["Bouncing the dumbbells or flaring elbows to 90°.","Arching the back off the bench excessively."],
    readiness:"Add load when 12 reps feel controlled with a 2-sec lowering.",
    injury:"Great low-wrist-stress option when push-ups aggravate the wrists." });

  /* ----- PULL ----- */
  def({ id:"pull_1", pattern:"pull", name:"Dead Hang", level:1, era:1, mode:"hold", unit:"sec", equipment:["pullupBar"],
    cues:["Grip the bar slightly wider than shoulders, full grip.","Let the body hang long but keep shoulders 'active' — slightly engaged.","Brace the core so you don't swing.","Breathe steadily and build grip endurance."],
    mistakes:["Hanging completely passive with shrugged-up, dead shoulders.","Swinging or kipping to extend the time."],
    readiness:"Advance at a 45-second controlled hang with active shoulders.",
    injury:"Build grip slowly to protect the elbows and forearm tendons." });

  def({ id:"pull_2", pattern:"pull", name:"Scapular Pull", level:2, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
    cues:["Start in an active dead hang, arms straight.","Without bending the elbows, pull the shoulder blades down and together.","Lift the body a few centimetres using only the scapulae.","Pause at the top, then lower with control."],
    mistakes:["Bending the elbows and turning it into a partial pull-up.","Rushing — the move should be slow and deliberate."],
    readiness:"Advance at 12 crisp reps owning the scapular retraction.",
    injury:"This builds the shoulder health that protects later pulling." });

  def({ id:"pull_3", pattern:"pull", name:"Negative Pull-up", level:3, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
    cues:["Jump or step to the top position, chin over the bar.","Lower yourself as slowly as possible — aim for 3–5 seconds.","Keep the core tight and avoid swinging.","Reset to the top for each rep."],
    mistakes:["Dropping fast instead of resisting the descent.","Letting the shoulders fully disengage at the bottom."],
    readiness:"Advance once you can lower for a full 5 seconds for 5+ reps.",
    injury:"Don't fully relax at the bottom — keep tension to protect the shoulder." });

  def({ id:"pull_4", pattern:"pull", name:"Pull-up", level:4, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
    cues:["Overhand grip just outside shoulder width.","Initiate by depressing the shoulder blades, then pull.","Drive elbows down and back, leading with the chest to the bar.","Lower fully to a straight-arm active hang each rep."],
    mistakes:["Kipping or swinging the legs to generate momentum.","Half reps — chin not clearing the bar or arms not extending."],
    readiness:"Advance at 5 strict reps (also the Era I pull benchmark).",
    injury:"Always control the lowering to spare the elbow tendons." });

  def({ id:"pull_5", pattern:"pull", name:"Chin-up", level:5, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
    cues:["Underhand (supinated) grip, shoulder width.","Pull with the biceps and back, chest to the bar.","Keep the body hollow — don't let the legs swing forward.","Full lockout at the bottom each rep."],
    mistakes:["Letting elbows drift forward and losing back engagement.","Cutting the range short at the bottom."],
    readiness:"Advance at 10 strict chin-ups before tackling unilateral work.",
    injury:"If the inner elbow flares, reduce volume and ice afterward." });

  def({ id:"pull_6", pattern:"pull", name:"Archer Pull-up", level:6, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
    cues:["Take a wide grip; pull up toward one hand.","The far arm stays straight, acting as a guide only.","Keep both shoulders packed and the core braced.","Alternate the working side each rep."],
    mistakes:["Bending the guide arm so both arms share the load.","Shrugging the working shoulder up to the ear."],
    readiness:"Mastery: 5 reps per side — direct stepping stone to the one-arm pull-up.",
    injury:"High unilateral shoulder demand — stop on any sharp joint pain." });

  def({ id:"pull_e2_dbrow", pattern:"pull", name:"Dumbbell Row", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells","bench"],
    cues:["One knee and hand on a bench, opposite foot planted.","Keep a flat back, hips square, dumbbell hanging straight down.","Row the elbow toward the hip, squeezing the lat.","Lower fully to a stretch without rotating the torso."],
    mistakes:["Yanking with the lower back and twisting the spine.","Rowing high to the shoulder instead of toward the hip."],
    readiness:"Volume supplement — add load when 12 reps/side stay strict.",
    injury:"Brace the core to keep the lumbar spine neutral and safe." });

  /* ----- SQUAT ----- */
  def({ id:"squat_1", pattern:"squat", name:"Bodyweight Squat", level:1, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["Feet shoulder-width, toes slightly out.","Brace the core and sit the hips back and down.","Drive the knees out in line with the toes.","Descend to at least parallel, then stand tall and squeeze glutes."],
    mistakes:["Knees collapsing inward (valgus).","Heels lifting or rounding the lower back at depth."],
    readiness:"Advance at 25 deep reps with the heels flat and torso tall.",
    injury:"Keep weight mid-foot to protect the knees." });

  def({ id:"squat_2", pattern:"squat", name:"Pause Squat", level:2, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["Descend into a full squat as normal.","Hold the bottom position for 3 seconds, staying tight.","Keep the chest up and knees tracking the toes during the pause.","Drive up explosively out of the hole."],
    mistakes:["Relaxing or 'bouncing' in the bottom instead of holding tension.","Letting the chest fall forward during the pause."],
    readiness:"Advance at 15 reps with a controlled 3-sec pause each.",
    injury:"The pause builds control that protects the knees in deeper variations." });

  def({ id:"squat_3", pattern:"squat", name:"Bulgarian Split Squat", level:3, era:1, mode:"reps", unit:"reps", equipment:["bench"],
    cues:["Rear foot elevated on a bench, front foot far enough forward.","Keep the torso slightly forward and the front shin near-vertical.","Lower until the back knee nearly touches the floor.","Drive through the front heel to stand."],
    mistakes:["Front knee caving inward or shooting far past the toes.","Putting too much weight through the rear foot."],
    readiness:"Advance at 10 reps/leg (also the Era I leg benchmark).",
    injury:"Stop if the front knee feels pinchy — shorten the range slightly." });

  def({ id:"squat_4", pattern:"squat", name:"Shrimp Squat", level:4, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["Stand on one leg, bend the other knee and hold the rear foot.","Sit back and down, lowering the rear knee toward the floor.","Keep the chest proud and balance over the standing foot.","Touch the rear knee lightly, then drive back up."],
    mistakes:["Falling forward and losing balance.","Slamming the rear knee into the floor."],
    readiness:"Advance at 6–8 reps/leg with a soft, controlled knee touch.",
    injury:"Use a pad under the rear knee while learning." });

  def({ id:"squat_5", pattern:"squat", name:"Pistol Squat", level:5, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["Stand on one leg, the other extended straight in front.","Sit all the way down, keeping the heel planted.","Arms forward as a counterbalance, chest up.","Drive through the heel to stand without touching the free foot down."],
    mistakes:["Heel popping up at the bottom.","Collapsing forward or using momentum to bounce up."],
    readiness:"Advance at 5 clean reps/leg before adding load.",
    injury:"Demands ankle mobility — warm up ankles to spare the knee." });

  def({ id:"squat_6", pattern:"squat", name:"Weighted Pistol Squat", level:6, era:1, mode:"reps", unit:"reps", equipment:["dumbbells","kettlebells"],
    cues:["Hold a dumbbell or kettlebell at the chest as a counterbalance.","Perform a strict pistol with the added load.","Keep the heel down and torso as upright as the load allows.","Control the descent fully before driving up."],
    mistakes:["Letting the load pull you off balance.","Using the weight's momentum instead of leg strength."],
    readiness:"Mastery: progress the load while keeping 5 strict reps/leg.",
    injury:"Added load magnifies any knee issue — back off at the first twinge." });

  def({ id:"squat_e2_goblet", pattern:"squat", name:"Kettlebell Goblet Squat", level:null, era:2, mode:"reps", unit:"reps", equipment:["kettlebells","dumbbells"],
    cues:["Hold a kettlebell or dumbbell at the chest, elbows tucked.","Squat between the knees to full depth, chest tall.","Keep the heels down and core braced against the load.","Stand and squeeze the glutes at the top."],
    mistakes:["Letting the elbows drift forward and the chest collapse.","Rounding the back at depth under load."],
    readiness:"Quad overload tool — add load when 12 reps stay upright and deep.",
    injury:"Excellent for loading the legs without spinal compression." });

  /* ----- HINGE ----- */
  def({ id:"hinge_1", pattern:"hinge", name:"Glute Bridge", level:1, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["Lie on your back, knees bent, feet flat and close to the hips.","Drive through the heels and lift the hips to a straight line.","Squeeze the glutes hard at the top — don't arch the lower back.","Lower with control without resting on the floor."],
    mistakes:["Pushing through the toes instead of the heels.","Overarching the lumbar spine to fake height."],
    readiness:"Advance at 20 reps with a strong 2-sec glute squeeze at the top.",
    injury:"Initiate from the glutes, not the lower back." });

  def({ id:"hinge_2", pattern:"hinge", name:"Hip Thrust", level:2, era:1, mode:"reps", unit:"reps", equipment:["bench"],
    cues:["Upper back on a bench, feet flat, shins vertical at the top.","Tuck the chin and ribs down to keep a neutral spine.","Drive the hips up until the torso is parallel to the floor.","Pause and squeeze the glutes, then lower under control."],
    mistakes:["Hyperextending the back instead of finishing with the glutes.","Letting the knees cave in on the way up."],
    readiness:"Advance at 15 reps with a full lockout and pause.",
    injury:"Keep the chin tucked to avoid loading the neck/lumbar." });

  def({ id:"hinge_3", pattern:"hinge", name:"Single-Leg Hip Thrust", level:3, era:1, mode:"reps", unit:"reps", equipment:["bench"],
    cues:["Set up as a hip thrust but extend one leg straight out.","Drive through the planted heel to lift the hips level.","Keep the pelvis square — don't let one side dip.","Squeeze at the top, then lower with control."],
    mistakes:["Hips tilting/rotating toward the working side.","Using the extended leg to swing for momentum."],
    readiness:"Advance at 12 reps/leg with a level, controlled pelvis.",
    injury:"Prep for Nordic work — builds hamstring/glute resilience." });

  def({ id:"hinge_4", pattern:"hinge", name:"Nordic Curl Negative", level:4, era:1, mode:"reps", unit:"reps", equipment:["nordicAnchor"],
    cues:["Kneel with ankles anchored (under a sofa/partner/loaded bar).","Keep hips extended and the body in one rigid line from knee to head.","Lower forward as slowly as possible, resisting with the hamstrings.","Catch with the hands and push back to the start."],
    mistakes:["Bending at the hips to cheat the lowering.","Dropping fast once the hamstrings start to give."],
    readiness:"Advance once you can resist smoothly past the halfway point for 5 reps.",
    injury:"Extremely demanding — start with a high catch point and few reps to protect the hamstrings." });

  def({ id:"hinge_5", pattern:"hinge", name:"Nordic Curl", level:5, era:1, mode:"reps", unit:"reps", equipment:["nordicAnchor"],
    cues:["Same setup; lower under full control through the whole range.","Pull yourself back up using only the hamstrings.","Maintain the rigid hip-to-head line throughout.","Minimise any push-off from the hands."],
    mistakes:["Folding at the hips on the way up.","Relying on the arms to do most of the concentric."],
    readiness:"Advance at 5 full reps with no hand assistance.",
    injury:"Never train Nordics to failure cold — warm the hamstrings thoroughly." });

  def({ id:"hinge_6", pattern:"hinge", name:"Shaking Nordic", level:6, era:1, mode:"reps", unit:"reps", equipment:["nordicAnchor"],
    cues:["Perform full Nordic curls with deliberate mid-range pauses.","Hold positions where the hamstrings shake under maximal tension.","Keep the line rigid even as the muscles fatigue.","Control both phases — no bailing."],
    mistakes:["Avoiding the hardest mid-range by speeding through it.","Breaking the hip line when it gets heavy."],
    readiness:"Mastery: elite hamstring strength — the top of the hinge ladder.",
    injury:"Reserve for well-conditioned hamstrings; deload at any strain sensation." });

  def({ id:"hinge_e2_rdl", pattern:"hinge", name:"Dumbbell Romanian Deadlift", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
    cues:["Hold dumbbells in front of the thighs, soft knees.","Hinge at the hips, pushing them back, keeping a flat back.","Lower the weights along the legs until you feel a hamstring stretch.","Drive the hips forward to stand, squeezing the glutes."],
    mistakes:["Rounding the back or turning it into a squat.","Letting the dumbbells drift away from the legs."],
    readiness:"Supplements Nordic progression — add load when 12 reps stay crisp.",
    injury:"Keep the bar path close and back flat to protect the lumbar spine." });

  def({ id:"hinge_e2_swing", pattern:"hinge", name:"Kettlebell Swing", level:null, era:2, mode:"reps", unit:"reps", equipment:["kettlebells"],
    cues:["Hinge and hike the kettlebell back between the legs.","Snap the hips forward explosively to float the bell to chest height.","Keep the arms relaxed — it's a hip drive, not an arm lift.","Let the bell fall and load the next hinge."],
    mistakes:["Squatting the swing instead of hinging.","Lifting with the shoulders/lower back."],
    readiness:"Posterior-chain power tool — focus on crisp hip snap over weight.",
    injury:"Master the hinge first; a squatty swing strains the lower back." });

  /* ----- CORE ----- */
  def({ id:"core_1", pattern:"core", name:"Plank", level:1, era:1, mode:"hold", unit:"sec", equipment:[],
    cues:["Forearms under shoulders, body in one straight line.","Brace the abs and squeeze the glutes — posteriorly tilt the pelvis.","Push the floor away to keep the upper back broad.","Breathe shallow but steady; don't let the hips sag."],
    mistakes:["Hips sagging or piking up.","Holding the breath and losing the brace."],
    readiness:"Advance at a 60-second rock-solid hold.",
    injury:"If the lower back aches, tuck the pelvis harder and shorten the hold." });

  def({ id:"core_2", pattern:"core", name:"Hollow Body Hold", level:2, era:1, mode:"hold", unit:"sec", equipment:[],
    cues:["Lie on your back, press the lower back flat into the floor.","Lift the shoulders and legs, arms overhead.","Hold a shallow 'banana' shape with constant abdominal tension.","Lower the arms/legs to make it easier, raise them to make it harder."],
    mistakes:["Lower back arching off the floor (the cardinal sin).","Holding the breath instead of staying braced."],
    readiness:"Advance at a 30-sec hold with legs low (also the Era I core benchmark).",
    injury:"Keep the lumbar pinned — arching turns this into a back exercise." });

  def({ id:"core_3", pattern:"core", name:"Tuck L-Sit", level:3, era:1, mode:"hold", unit:"sec", equipment:["bench","parallettes"],
    cues:["Support on parallettes, bench edges, or the floor.","Depress the shoulders and lock the elbows straight.","Lift the hips and tuck the knees toward the chest.","Hold with the shoulders pulled down, chest tall."],
    mistakes:["Shrugging the shoulders up to the ears.","Bending the elbows to fake the lift."],
    readiness:"Advance at a 30-sec tuck hold (also the Era I L-sit benchmark).",
    injury:"Strong wrist demand on the floor — use parallettes if wrists complain." });

  def({ id:"core_4", pattern:"core", name:"L-Sit", level:4, era:1, mode:"hold", unit:"sec", equipment:["bench","parallettes"],
    cues:["From a tuck L-sit, extend both legs straight out, parallel to the floor.","Push the floor down hard and keep the shoulders depressed.","Point the toes and keep the legs locked together.","Hold without leaning back to cheat the angle."],
    mistakes:["Bending the knees as fatigue sets in.","Rounding back and dropping the hips below the hands."],
    readiness:"Advance at a 20-sec full L-sit with locked legs.",
    injury:"Hip-flexor cramps are common — stretch them before and after." });

  def({ id:"core_5", pattern:"core", name:"Dragon Flag Negative", level:5, era:1, mode:"reps", unit:"reps", equipment:["bench"],
    cues:["Lie on a bench, grip behind your head for an anchor.","Lift the whole body to vertical, supported only on the shoulders.","Lower as one rigid plank as slowly as possible.","Keep the hips from piking — the body stays straight."],
    mistakes:["Bending at the hips to make the lowering easier.","Dropping fast instead of resisting."],
    readiness:"Advance once you can lower slowly with a straight body for 5 reps.",
    injury:"Keep the neck neutral and the lumbar braced to protect the spine." });

  def({ id:"core_6", pattern:"core", name:"Dragon Flag", level:6, era:1, mode:"reps", unit:"reps", equipment:["bench"],
    cues:["Raise and lower the rigid body through the full range.","Maintain a perfectly straight line from shoulders to toes.","Control both the lift and the descent.","Anchor hard with the hands and keep the core maximally braced."],
    mistakes:["Piking at the hips at any point.","Using momentum to swing through the bottom."],
    readiness:"Mastery: 5 full controlled reps — the top of the core ladder.",
    injury:"Elite-level core load; never attempt cold or with a fatigued back." });

  /* ----- SHOULDER ----- */
  def({ id:"shoulder_1", pattern:"shoulder", name:"Pike Push-up", level:1, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["Start in a downward-dog pike, hips high, hands shoulder-width.","Bend the elbows to lower the crown of the head toward the floor.","Keep the elbows tracking back, not flaring wide.","Press back up to the pike, shoulders over the hands."],
    mistakes:["Letting the hips drop so it becomes a flat push-up.","Flaring the elbows straight out."],
    readiness:"Advance at 12 reps with the head lightly touching the floor.",
    injury:"Builds the vertical pressing base — keep the neck long, not crunched." });

  def({ id:"shoulder_2", pattern:"shoulder", name:"Elevated Pike Push-up", level:2, era:1, mode:"reps", unit:"reps", equipment:["bench"],
    cues:["Place the feet on a bench to make the torso more vertical.","Keep the hips stacked over the shoulders.","Lower the head toward the floor between the hands.","Press up powerfully, fully extending the arms."],
    mistakes:["Losing the vertical stack and shifting weight back to the feet.","Shortening the range near the floor."],
    readiness:"Advance at 10 reps with a near-vertical torso.",
    injury:"More overhead load — warm the shoulders thoroughly first." });

  def({ id:"shoulder_3", pattern:"shoulder", name:"Wall Handstand Hold", level:3, era:1, mode:"hold", unit:"sec", equipment:[],
    cues:["Kick up to a handstand with the chest facing the wall (or back to it).","Stack wrists, shoulders and hips in one line.","Push tall through the shoulders and point the toes.","Hold a hollow body — don't let the back arch (banana)."],
    mistakes:["Overarching into a banana shape.","Shrugging into the shoulders instead of pushing tall."],
    readiness:"Advance at a 45-sec stable hold with a straight line.",
    injury:"Press the floor away actively to protect the shoulders and wrists." });

  def({ id:"shoulder_4", pattern:"shoulder", name:"Kick-to-Handstand", level:4, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["From a lunge, kick up and aim to balance briefly off the wall.","Find balance with small finger-pressure adjustments.","Keep the body tight and hollow on the way up.","Step down under control; repeat the entrance."],
    mistakes:["Kicking too hard and crashing over.","Banana-ing the moment balance is found."],
    readiness:"Advance once you can hold a few seconds of free balance reliably.",
    injury:"Practise bailing safely (cartwheel out) to avoid falls." });

  def({ id:"shoulder_5", pattern:"shoulder", name:"Handstand Push-up Negative", level:5, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["Kick to a wall handstand in a straight line.","Lower the head toward the floor as slowly as possible.","Keep the elbows tracking forward, not flaring.","Touch lightly and reset for the next negative."],
    mistakes:["Dropping fast instead of resisting.","Arching the back to shorten the range."],
    readiness:"Advance once you can lower for 3–5 seconds for several reps.",
    injury:"Stack mats under the head while learning the descent." });

  def({ id:"shoulder_6", pattern:"shoulder", name:"Handstand Push-up", level:6, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["From a wall handstand, lower the head to the floor.","Press back to full lockout, pushing tall at the top.","Keep a tight hollow line throughout.","Control both the descent and the press."],
    mistakes:["Bailing the range or kipping with the legs off the wall.","Letting the elbows flare wide under load."],
    readiness:"Mastery: 5 strict reps — the top of the vertical-press ladder.",
    injury:"Significant shoulder/wrist load; never grind cold." });

  def({ id:"shoulder_e2_ohp", pattern:"shoulder", name:"Dumbbell Overhead Press", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
    cues:["Stand or sit tall, dumbbells at shoulder height.","Brace the core and glutes to lock the ribcage down.","Press straight overhead until the arms lock out.","Lower under control to the shoulders."],
    mistakes:["Leaning back and turning it into an incline press.","Flaring the elbows and losing the brace."],
    readiness:"Runs alongside pike progressions — add load when 12 reps stay strict.",
    injury:"Don't overarch the lower back to push the weight up." });

  /* ----- DIP (bench available from day 1) ----- */
  def({ id:"dip_1", pattern:"dip", name:"Bench Dip", level:1, era:1, mode:"reps", unit:"reps", equipment:["bench"],
    cues:["Hands on a bench edge behind you, legs out front.","Keep the chest up and shoulders down, away from the ears.","Lower until the elbows reach ~90°.","Press back up to a full lockout."],
    mistakes:["Letting the shoulders shrug up toward the ears.","Going too deep and overstretching the shoulder."],
    readiness:"Advance at 15 reps with the elbows bending to 90°.",
    injury:"Stop before the shoulders roll forward — limit depth to protect them." });

  def({ id:"dip_2", pattern:"dip", name:"Straight Bar Dip", level:2, era:1, mode:"reps", unit:"reps", equipment:["lowBar"],
    cues:["Support on a straight bar at hip height, arms locked.","Lean slightly forward, keeping the bar close to the body.","Lower until the bar reaches the lower chest.","Press up to a strong lockout, chest proud."],
    mistakes:["Letting the bar drift away from the torso.","Collapsing the chest forward at the bottom."],
    readiness:"Advance at 10 controlled reps to chest depth.",
    injury:"Keep the shoulders packed down to avoid impingement." });

  def({ id:"dip_3", pattern:"dip", name:"Parallel Bar Dip", level:3, era:1, mode:"reps", unit:"reps", equipment:["dipBars"],
    cues:["Support on parallel bars, arms locked, body slightly forward.","Lower until the shoulders are just below the elbows.","Keep the elbows tracking back, not flaring wide.","Press to a full lockout, depressing the shoulders."],
    mistakes:["Dropping below safe depth and stressing the shoulder.","Flaring the elbows out to the sides."],
    readiness:"Advance at 12 strict reps to parallel depth.",
    injury:"Build depth gradually — the bottom is the vulnerable position." });

  def({ id:"dip_4", pattern:"dip", name:"Korean Dip", level:4, era:1, mode:"reps", unit:"reps", equipment:["lowBar"],
    cues:["On a straight bar, position the body behind the bar.","Lower with the bar tracking up toward the upper chest/neck.","Keep tension through the shoulders and lats.","Press back to lockout under control."],
    mistakes:["Losing shoulder control in the deep stretched position.","Using momentum to bounce out of the bottom."],
    readiness:"Advance at 8 controlled reps with the stretched setup.",
    injury:"Advanced shoulder stretch position — earn it with solid bar dips first." });

  def({ id:"dip_5", pattern:"dip", name:"Ring Dip", level:5, era:1, mode:"reps", unit:"reps", equipment:["rings"],
    cues:["Support on rings with the wrists turned slightly out (RTO).","Stabilise the rings tight to the body before lowering.","Descend under control, fighting the rings' wobble.","Press to lockout and turn the rings out at the top."],
    mistakes:["Letting the rings drift wide and unstable.","Rushing reps and losing control of the wobble."],
    readiness:"Advance at 8 controlled reps with a turned-out lockout.",
    injury:"The instability is the point — but back off if the shoulders feel unstable." });

  def({ id:"dip_6", pattern:"dip", name:"Weighted Dip", level:6, era:1, mode:"reps", unit:"reps", equipment:["dipBars","dumbbells","kettlebells","vest"],
    cues:["Add load via a dip belt or a dumbbell held between the feet.","Keep the same strict parallel-bar mechanics.","Lower under full control with the added weight.","Press to a complete lockout each rep."],
    mistakes:["Reducing depth to manage the load.","Swinging the legs/weight for momentum."],
    readiness:"Mastery: progress load while keeping 6–8 strict reps.",
    injury:"Load amplifies shoulder stress — never add weight until form is perfect." });

  /* ==========================================================================
     2) WARMUPS  (dynamic, per day type; each step is a timed, checkable card)
        step: { name, detail, seconds, cue }
     ========================================================================== */
  var WARMUPS = {
    push: [
      { name:"Wrist Circles & Rocks", detail:"30 sec each direction", seconds:60, cue:"On hands and knees, rock gently over the wrists to prep the joint." },
      { name:"Shoulder CARs", detail:"5 slow circles each arm", seconds:60, cue:"Controlled articular rotations — draw the biggest circle you can." },
      { name:"Band Pull-aparts (or door-frame)", detail:"15 reps", seconds:45, cue:"Squeeze the shoulder blades; use a towel/door frame if no band." },
      { name:"Scapular Push-ups", detail:"12 reps", seconds:45, cue:"In a plank, protract and retract only the shoulder blades." },
      { name:"Arm Swings", detail:"30 sec", seconds:30, cue:"Big forward/back and across-body swings to flush the shoulders." }
    ],
    pull: [
      { name:"Active Dead Hang", detail:"30 sec", seconds:30, cue:"Engage the shoulders slightly; wake up the grip and lats." },
      { name:"Scapular Shrugs", detail:"12 reps", seconds:45, cue:"From a hang, shrug the body up and down using only the scapulae." },
      { name:"Thoracic Rotations", detail:"8 each side", seconds:60, cue:"Quadruped, hand behind head, rotate the upper back open." },
      { name:"Face-pull Simulation", detail:"15 reps", seconds:45, cue:"Pull a band/towel to the forehead, elbows high — rear delts on." },
      { name:"Wrist & Forearm Prep", detail:"30 sec", seconds:30, cue:"Flex/extend and circle the wrists; prep grip tendons." }
    ],
    legs: [
      { name:"Hip Circles", detail:"8 each direction", seconds:60, cue:"Hands on hips, draw big circles to open the joint." },
      { name:"Ankle Mobility Rocks", detail:"10 each side", seconds:60, cue:"Knee-over-toe rocks in a lunge to free the ankles." },
      { name:"Pigeon Stretch (active)", detail:"30 sec each side", seconds:60, cue:"Open the hips and glutes with gentle pulses, not a dead hold." },
      { name:"Leg Swings", detail:"12 each leg, both planes", seconds:60, cue:"Front-back and side-to-side to loosen the hips and hamstrings." },
      { name:"Bodyweight Good Mornings", detail:"12 reps", seconds:45, cue:"Hands behind head, hinge and feel the hamstrings switch on." }
    ],
    fullbody: [
      { name:"Cat-Cow Flow", detail:"10 cycles", seconds:60, cue:"Move the whole spine through flexion and extension." },
      { name:"World's Greatest Stretch", detail:"5 each side", seconds:90, cue:"Lunge, drop the elbow inside, then reach to the sky and rotate." },
      { name:"Hollow Body Practice", detail:"3 x 10 sec", seconds:60, cue:"Pin the lower back; rehearse the brace you'll use all session." },
      { name:"Deep Squat Hold", detail:"45 sec", seconds:45, cue:"Sit in the bottom of a squat, prying the knees open gently." }
    ]
  };

  /* ==========================================================================
     3) COOLDOWNS  (static stretches, 30–45 sec each, muscle-group specific)
        step: { name, detail, seconds, cue }
     ========================================================================== */
  var COOLDOWNS = {
    push: [
      { name:"Doorway Chest Stretch", detail:"40 sec", seconds:40, cue:"Forearm on the frame, step through to open the chest." },
      { name:"Overhead Triceps Stretch", detail:"30 sec each", seconds:60, cue:"Elbow behind the head, gently ease it down." },
      { name:"Cross-body Shoulder Stretch", detail:"30 sec each", seconds:60, cue:"Pull the arm across the chest to release the rear delt." },
      { name:"Child's Pose", detail:"45 sec", seconds:45, cue:"Sink the hips back and breathe into the shoulders and lats." }
    ],
    pull: [
      { name:"Lat Hang/Stretch", detail:"40 sec", seconds:40, cue:"Hang or reach overhead and side-bend to lengthen the lats." },
      { name:"Biceps Wall Stretch", detail:"30 sec each", seconds:60, cue:"Palm on the wall behind you, turn away gently." },
      { name:"Forearm/Flexor Stretch", detail:"30 sec each", seconds:60, cue:"Extend the arm, pull the fingers back to ease the forearm." },
      { name:"Seated Thoracic Twist", detail:"30 sec each", seconds:60, cue:"Rotate the upper back and hold to decompress." }
    ],
    legs: [
      { name:"Standing Quad Stretch", detail:"30 sec each", seconds:60, cue:"Heel to glute, knees together, push the hip forward." },
      { name:"Seated Hamstring Stretch", detail:"40 sec each", seconds:80, cue:"Reach toward the toes with a flat back." },
      { name:"Figure-4 Glute Stretch", detail:"30 sec each", seconds:60, cue:"Ankle over knee, draw the legs in to open the glute." },
      { name:"Calf/Wall Stretch", detail:"30 sec each", seconds:60, cue:"Back heel down against a wall to lengthen the calf." }
    ],
    fullbody: [
      { name:"Child's Pose", detail:"45 sec", seconds:45, cue:"Reset the spine and shoulders with slow breathing." },
      { name:"Cobra / Cat-Cow", detail:"45 sec", seconds:45, cue:"Mobilise the spine gently after core work." },
      { name:"Standing Forward Fold", detail:"40 sec", seconds:40, cue:"Hang the torso to release the back and hamstrings." },
      { name:"Supine Spinal Twist", detail:"30 sec each", seconds:60, cue:"Knees fall to one side, arms wide, breathe and relax." }
    ]
  };

  /* The templates' days (plan D1) borrow the warm-up and cool-down of the
     rotation day they resemble: Full Body A and B the full-body set, Upper the
     push set (the pull set opens with a dead hang, which needs a bar), Lower
     the leg set. */
  [["fullA", "fullbody"], ["fullB", "fullbody"], ["upper", "push"], ["lower", "legs"],
   ["whole", "fullbody"], ["splitpush", "push"], ["splitpull", "fullbody"], ["splitlegs", "legs"]].forEach(function (p) {
    WARMUPS[p[0]] = WARMUPS[p[1]];
    COOLDOWNS[p[0]] = COOLDOWNS[p[1]];
  });
  /* A mini-session (plan D3) is 2–6 light coverage movements on any day,
     upper or lower body, so its warm-up is short and touches both: about
     two and a half minutes in, a minute and a half out. */
  WARMUPS.mini = [
    { name:"Cat-Cow Flow", detail:"8 cycles", seconds:45, cue:"Move the whole spine slowly through flexion and extension." },
    { name:"Arm Circles", detail:"10 each direction", seconds:40, cue:"Small circles growing to big ones, to warm the shoulders before the small muscles work." },
    { name:"Hip Circles & Leg Swings", detail:"8 each, both legs", seconds:60, cue:"Open the hips, then swing front to back to loosen the hamstrings." }
  ];
  COOLDOWNS.mini = [
    { name:"Child's Pose", detail:"45 sec", seconds:45, cue:"Sink the hips back and breathe slowly." },
    { name:"Standing Forward Fold", detail:"40 sec", seconds:40, cue:"Let the torso hang to ease the back and hamstrings." }
  ];

  /* ==========================================================================
     4) SUBSTITUTIONS
        SUBSTITUTIONS[pattern][bodyPart][severity] = { era1:{name,cue}, era2:{name,cue} }
        Sharp severity routes to the gentlest option / rest, and the injury
        system (Part 4) flags repeated areas toward physio in the Report Card.
     ========================================================================== */
  var SUBSTITUTIONS = {
    push: {
      wrist: {
        mild:     { era1:{ name:"Fist Push-up", cue:"Make fists on a soft surface to keep the wrist neutral." },
                    era2:{ name:"Dumbbell Floor Press", cue:"Neutral-grip dumbbells remove the wrist extension entirely." } },
        moderate: { era1:{ name:"Knuckle/Parallette Push-up", cue:"Use handles so the wrist stays straight." },
                    era2:{ name:"Dumbbell Floor Press", cue:"Press from the floor with neutral wrists, no loading on the joint." } },
        sharp:    { era1:{ name:"Skip push pattern today", cue:"Rest the wrist; do gentle pain-free mobility only." },
                    era2:{ name:"Skip push pattern today", cue:"Rest the wrist; resume with neutral-grip pressing once pain-free." } }
      },
      shoulder: {
        mild:     { era1:{ name:"Incline Push-up", cue:"Hands elevated reduces the shoulder load." },
                    era2:{ name:"Light DB Floor Press", cue:"Floor limits the range and protects the shoulder." } },
        moderate: { era1:{ name:"Wall Push-up", cue:"Drop right back to the lowest-load push variation." },
                    era2:{ name:"Banded/Light Press", cue:"Stay well within a pain-free range." } },
        sharp:    { era1:{ name:"Skip push pattern today", cue:"Stop loading the shoulder; ice and rest." },
                    era2:{ name:"Skip push pattern today", cue:"Stop loading the shoulder; ice and rest." } }
      },
      elbow: {
        mild:     { era1:{ name:"Wide Push-up", cue:"A wider hand stance eases inner-elbow stress." },
                    era2:{ name:"Neutral DB Press", cue:"Neutral grip is kinder to the elbow tendons." } },
        moderate: { era1:{ name:"Incline Push-up", cue:"Reduce load and avoid full lockout snapping." },
                    era2:{ name:"Light DB Press", cue:"Lighten the load and control the lockout." } },
        sharp:    { era1:{ name:"Skip push pattern today", cue:"Rest the elbow tendons; avoid all pressing." },
                    era2:{ name:"Skip push pattern today", cue:"Rest the elbow tendons; avoid all pressing." } }
      }
    },

    pull: {
      shoulder: {
        mild:     { era1:{ name:"Scapular Pull", cue:"Drop to scapular-only work to keep the shoulder healthy." },
                    era2:{ name:"Light Dumbbell Row", cue:"Supported rowing with a controlled, pain-free range." } },
        moderate: { era1:{ name:"Inverted Row (high)", cue:"A higher bar reduces the load through the shoulder." },
                    era2:{ name:"Chest-supported DB Row", cue:"Support the torso to isolate the back, sparing the joint." } },
        sharp:    { era1:{ name:"Skip pull pattern today", cue:"Rest the shoulder; gentle mobility only." },
                    era2:{ name:"Skip pull pattern today", cue:"Rest the shoulder; gentle mobility only." } }
      },
      elbow: {
        mild:     { era1:{ name:"Neutral-grip Pull (towel)", cue:"Neutral grip eases the inner-elbow tendons." },
                    era2:{ name:"Neutral-grip DB Row", cue:"Neutral grip rowing reduces tendon strain." } },
        moderate: { era1:{ name:"Negative Pull-up (slow)", cue:"Reduce volume; control the lowering only." },
                    era2:{ name:"Light DB Row", cue:"Lighten the load and avoid hard end-range pulls." } },
        sharp:    { era1:{ name:"Skip pull pattern today", cue:"Rest the elbow; ice if swollen." },
                    era2:{ name:"Skip pull pattern today", cue:"Rest the elbow; ice if swollen." } }
      },
      grip: {
        mild:     { era1:{ name:"Inverted Row", cue:"Row from a bar at waist height — far less grip demand." },
                    era2:{ name:"Dumbbell Row (straps)", cue:"Use straps to take the forearms out of the equation." } },
        moderate: { era1:{ name:"Inverted Row (feet down)", cue:"Easier angle, minimal grip stress." },
                    era2:{ name:"Light DB Row (straps)", cue:"Strapped, light, controlled rows." } },
        sharp:    { era1:{ name:"Skip pull pattern today", cue:"Rest the grip/forearm tendons fully." },
                    era2:{ name:"Skip pull pattern today", cue:"Rest the grip/forearm tendons fully." } }
      }
    },

    squat: {
      knee: {
        mild:     { era1:{ name:"Box Squat", cue:"Squat to a bench to control depth and knee stress." },
                    era2:{ name:"Light Goblet Box Squat", cue:"Counterbalanced and depth-limited to a box." } },
        moderate: { era1:{ name:"Pause Squat (half)", cue:"Half-depth pause squats stay in a pain-free range." },
                    era2:{ name:"Light Goblet (half)", cue:"Reduce range and load." } },
        sharp:    { era1:{ name:"Skip squat pattern today", cue:"Rest the knee; pain-free mobility only." },
                    era2:{ name:"Skip squat pattern today", cue:"Rest the knee; pain-free mobility only." } }
      },
      hip: {
        mild:     { era1:{ name:"Box Squat", cue:"Control depth to keep the hip comfortable." },
                    era2:{ name:"Goblet Box Squat", cue:"Counterbalance helps you stay upright and comfortable." } },
        moderate: { era1:{ name:"Bodyweight Squat (partial)", cue:"Reduce range to what's pain-free." },
                    era2:{ name:"Light Goblet (partial)", cue:"Light and shallow." } },
        sharp:    { era1:{ name:"Skip squat pattern today", cue:"Rest the hip; gentle mobility only." },
                    era2:{ name:"Skip squat pattern today", cue:"Rest the hip; gentle mobility only." } }
      },
      ankle: {
        mild:     { era1:{ name:"Heel-elevated Squat", cue:"Elevate the heels to reduce ankle demand." },
                    era2:{ name:"Heel-elevated Goblet Squat", cue:"Heels up + counterbalance for comfort." } },
        moderate: { era1:{ name:"Box Squat", cue:"Sit to a box to limit ankle dorsiflexion." },
                    era2:{ name:"Light Goblet Box Squat", cue:"Box-limited, light load." } },
        sharp:    { era1:{ name:"Skip squat pattern today", cue:"Rest the ankle; do mobility only." },
                    era2:{ name:"Skip squat pattern today", cue:"Rest the ankle; do mobility only." } }
      }
    },

    hinge: {
      lowerBack: {
        mild:     { era1:{ name:"Glute Bridge", cue:"Floor bridge keeps the spine supported." },
                    era2:{ name:"Hip Thrust (light)", cue:"Supported thrust with a tucked chin and neutral spine." } },
        moderate: { era1:{ name:"Single-Leg Glute Bridge", cue:"Low-load, floor-supported glute work." },
                    era2:{ name:"Light Hip Thrust", cue:"Minimal load, strict neutral spine." } },
        sharp:    { era1:{ name:"Skip hinge pattern today", cue:"Rest the lower back; avoid all loaded hinging." },
                    era2:{ name:"Skip hinge pattern today", cue:"Rest the lower back; avoid all loaded hinging." } }
      },
      hamstring: {
        mild:     { era1:{ name:"Single-Leg Hip Thrust", cue:"Shifts emphasis to the glutes, easing the hamstring." },
                    era2:{ name:"Light Dumbbell RDL", cue:"Reduce range to a pain-free hamstring stretch." } },
        moderate: { era1:{ name:"Glute Bridge", cue:"Low-strain glute-dominant work." },
                    era2:{ name:"Very Light RDL", cue:"Minimal stretch, controlled tempo." } },
        sharp:    { era1:{ name:"Skip hinge pattern today", cue:"Rest a tweaked hamstring — do not load it." },
                    era2:{ name:"Skip hinge pattern today", cue:"Rest a tweaked hamstring — do not load it." } }
      },
      knee: {
        mild:     { era1:{ name:"Hip Thrust", cue:"Thrust loads the hips, not the knees." },
                    era2:{ name:"Kettlebell Swing (light)", cue:"Hip-driven, minimal knee stress." } },
        moderate: { era1:{ name:"Glute Bridge", cue:"Floor-based, easy on the knees." },
                    era2:{ name:"Light Hip Thrust", cue:"Hip-dominant and gentle on the knees." } },
        sharp:    { era1:{ name:"Skip hinge pattern today", cue:"Rest; avoid any knee-loading hinge." },
                    era2:{ name:"Skip hinge pattern today", cue:"Rest; avoid any knee-loading hinge." } }
      }
    },

    core: {
      lowerBack: {
        mild:     { era1:{ name:"Dead Bug", cue:"Keep the back flat; move opposite limbs slowly." },
                    era2:{ name:"Dead Bug", cue:"Keep the back flat; move opposite limbs slowly." } },
        moderate: { era1:{ name:"Plank (short holds)", cue:"Strong pelvic tuck, brief pain-free holds." },
                    era2:{ name:"Plank (short holds)", cue:"Strong pelvic tuck, brief pain-free holds." } },
        sharp:    { era1:{ name:"Skip core pattern today", cue:"Rest the lower back; avoid flexion/loading." },
                    era2:{ name:"Skip core pattern today", cue:"Rest the lower back; avoid flexion/loading." } }
      },
      neck: {
        mild:     { era1:{ name:"Plank", cue:"Keep the neck long and neutral; avoid crunching." },
                    era2:{ name:"Plank", cue:"Keep the neck long and neutral; avoid crunching." } },
        moderate: { era1:{ name:"Hollow Hold (head down)", cue:"Rest the head to remove neck strain." },
                    era2:{ name:"Hollow Hold (head down)", cue:"Rest the head to remove neck strain." } },
        sharp:    { era1:{ name:"Skip core pattern today", cue:"Rest the neck; gentle mobility only." },
                    era2:{ name:"Skip core pattern today", cue:"Rest the neck; gentle mobility only." } }
      },
      hipFlexor: {
        mild:     { era1:{ name:"Plank", cue:"Anti-extension work that spares the hip flexors." },
                    era2:{ name:"Plank", cue:"Anti-extension work that spares the hip flexors." } },
        moderate: { era1:{ name:"Hollow Hold (bent knees)", cue:"Bend the knees to reduce hip-flexor pull." },
                    era2:{ name:"Hollow Hold (bent knees)", cue:"Bend the knees to reduce hip-flexor pull." } },
        sharp:    { era1:{ name:"Skip core pattern today", cue:"Rest the hip flexor; stretch gently only." },
                    era2:{ name:"Skip core pattern today", cue:"Rest the hip flexor; stretch gently only." } }
      }
    },

    shoulder: {
      shoulder: {
        mild:     { era1:{ name:"Pike Push-up (high hips)", cue:"Reduce the overhead load with a shallower angle." },
                    era2:{ name:"Light DB Overhead Press", cue:"Control a pain-free overhead range." } },
        moderate: { era1:{ name:"Incline Pike", cue:"Hands elevated to lighten the shoulder." },
                    era2:{ name:"Light Lateral Raise", cue:"Low-load isolation within a comfortable range." } },
        sharp:    { era1:{ name:"Skip shoulder pattern today", cue:"Stop overhead work; ice and rest." },
                    era2:{ name:"Skip shoulder pattern today", cue:"Stop overhead work; ice and rest." } }
      },
      wrist: {
        mild:     { era1:{ name:"Fist Pike Push-up", cue:"Fists keep the wrist neutral overhead." },
                    era2:{ name:"DB Overhead Press", cue:"Dumbbells remove wrist extension entirely." } },
        moderate: { era1:{ name:"Parallette Pike", cue:"Handles keep the wrist straight." },
                    era2:{ name:"Light DB Press", cue:"Neutral-grip pressing, light load." } },
        sharp:    { era1:{ name:"Skip shoulder pattern today", cue:"Rest the wrist; mobility only." },
                    era2:{ name:"Skip shoulder pattern today", cue:"Rest the wrist; mobility only." } }
      },
      neck: {
        mild:     { era1:{ name:"Pike Push-up", cue:"Avoid head-on-floor variations; keep the neck neutral." },
                    era2:{ name:"Seated DB Press", cue:"Supported pressing keeps the neck stable." } },
        moderate: { era1:{ name:"Incline Pike", cue:"Lower load, no head contact." },
                    era2:{ name:"Light Seated Press", cue:"Light, supported, pain-free range." } },
        sharp:    { era1:{ name:"Skip shoulder pattern today", cue:"Rest the neck; gentle mobility only." },
                    era2:{ name:"Skip shoulder pattern today", cue:"Rest the neck; gentle mobility only." } }
      }
    },

    dip: {
      shoulder: {
        mild:     { era1:{ name:"Bench Dip (limited depth)", cue:"Keep depth shallow to spare the shoulder." },
                    era2:{ name:"Close-grip DB Press", cue:"Press instead of dip to ease the shoulder." } },
        moderate: { era1:{ name:"Bench Dip (very shallow)", cue:"Minimal range, shoulders packed down." },
                    era2:{ name:"Light DB Press", cue:"Triceps-focused press, no deep stretch." } },
        sharp:    { era1:{ name:"Skip dip pattern today", cue:"Stop dipping; rest the shoulder." },
                    era2:{ name:"Skip dip pattern today", cue:"Stop dipping; rest the shoulder." } }
      },
      wrist: {
        mild:     { era1:{ name:"Bench Dip (fists/handles)", cue:"Neutral wrist on handles or fists." },
                    era2:{ name:"DB Triceps Extension", cue:"Neutral grip removes wrist load." } },
        moderate: { era1:{ name:"Parallette Dip", cue:"Handles keep the wrist straight." },
                    era2:{ name:"Light DB Extension", cue:"Neutral-grip, light load." } },
        sharp:    { era1:{ name:"Skip dip pattern today", cue:"Rest the wrist; mobility only." },
                    era2:{ name:"Skip dip pattern today", cue:"Rest the wrist; mobility only." } }
      },
      elbow: {
        mild:     { era1:{ name:"Bench Dip (half range)", cue:"Avoid a hard lockout to spare the elbow." },
                    era2:{ name:"Light DB Press", cue:"Controlled lockout, lighter load." } },
        moderate: { era1:{ name:"Bench Dip (shallow)", cue:"Reduce range and volume." },
                    era2:{ name:"Very Light Press", cue:"Minimal load, no snapping lockouts." } },
        sharp:    { era1:{ name:"Skip dip pattern today", cue:"Rest the elbow tendons fully." },
                    era2:{ name:"Skip dip pattern today", cue:"Rest the elbow tendons fully." } }
      }
    }
  };

  /* ==========================================================================
     5) FOODS — high-calorie clean-bulk list with per-serving macros (grams).
        item: { id, name, serving, kcal, protein, carbs, fat, tags[] }
        (kcal ≈ 4P + 4C + 9F, rounded to realistic values)
     ========================================================================== */
  var FOODS = [
    { id:"rice_white",   name:"White Rice (cooked)",     serving:"1 cup (185g)",  kcal:240, protein:4,  carbs:53, fat:0,  tags:["carb","cheap","easy-cals"] },
    { id:"rice_brown",   name:"Brown Rice (cooked)",     serving:"1 cup (195g)",  kcal:248, protein:5,  carbs:52, fat:2,  tags:["carb","fiber"] },
    { id:"oats",         name:"Rolled Oats (dry)",       serving:"100g",          kcal:389, protein:13, carbs:66, fat:7,  tags:["carb","breakfast","fiber"] },
    { id:"egg",          name:"Whole Egg",               serving:"1 large (50g)", kcal:78,  protein:6,  carbs:1,  fat:5,  tags:["protein","fat"] },
    { id:"egg_white",    name:"Egg Whites",              serving:"3 whites",      kcal:51,  protein:11, carbs:1,  fat:0,  tags:["protein","lean"] },
    { id:"chicken",      name:"Chicken Breast (cooked)", serving:"150g",          kcal:248, protein:47, carbs:0,  fat:5,  tags:["protein","lean"] },
    { id:"beef_lean",    name:"Lean Ground Beef (cooked)",serving:"150g",         kcal:332, protein:38, carbs:0,  fat:20, tags:["protein","fat","iron"] },
    { id:"salmon",       name:"Salmon (cooked)",         serving:"150g",          kcal:312, protein:34, carbs:0,  fat:20, tags:["protein","fat","omega3"] },
    { id:"tuna",         name:"Canned Tuna (in water)",  serving:"1 can (120g)",  kcal:130, protein:29, carbs:0,  fat:1,  tags:["protein","lean","cheap"] },
    { id:"milk_whole",   name:"Whole Milk",              serving:"1 cup (240ml)", kcal:150, protein:8,  carbs:12, fat:8,  tags:["protein","carb","fat","easy-cals"] },
    { id:"yogurt_greek", name:"Greek Yogurt (full-fat)", serving:"170g",          kcal:160, protein:15, carbs:8,  fat:8,  tags:["protein","easy-cals"] },
    { id:"cottage",      name:"Cottage Cheese",          serving:"1 cup (226g)",  kcal:206, protein:28, carbs:8,  fat:6,  tags:["protein","casein"] },
    { id:"cheese",       name:"Cheddar Cheese",          serving:"30g",           kcal:120, protein:7,  carbs:1,  fat:10, tags:["fat","protein","easy-cals"] },
    { id:"peanut_butter",name:"Peanut Butter",           serving:"2 tbsp (32g)",  kcal:188, protein:8,  carbs:6,  fat:16, tags:["fat","easy-cals","cheap"] },
    { id:"almonds",      name:"Almonds",                 serving:"30g (~23)",     kcal:174, protein:6,  carbs:6,  fat:15, tags:["fat","snack"] },
    { id:"walnuts",      name:"Walnuts",                 serving:"30g",           kcal:196, protein:5,  carbs:4,  fat:20, tags:["fat","omega3","snack"] },
    { id:"olive_oil",    name:"Olive Oil",               serving:"1 tbsp (14g)",  kcal:120, protein:0,  carbs:0,  fat:14, tags:["fat","easy-cals","cooking"] },
    { id:"avocado",      name:"Avocado",                 serving:"1/2 (100g)",    kcal:160, protein:2,  carbs:9,  fat:15, tags:["fat","fiber"] },
    { id:"banana",       name:"Banana",                  serving:"1 medium (118g)",kcal:105,protein:1,  carbs:27, fat:0,  tags:["carb","pre-workout","cheap"] },
    { id:"sweet_potato", name:"Sweet Potato (baked)",    serving:"1 medium (130g)",kcal:112,protein:2,  carbs:26, fat:0,  tags:["carb","fiber"] },
    { id:"potato",       name:"White Potato (baked)",    serving:"1 medium (170g)",kcal:160,protein:4,  carbs:37, fat:0,  tags:["carb","cheap"] },
    { id:"pasta",        name:"Pasta (cooked)",          serving:"1 cup (140g)",  kcal:220, protein:8,  carbs:43, fat:1,  tags:["carb","easy-cals"] },
    { id:"lentils",      name:"Lentils (cooked)",        serving:"1 cup (198g)",  kcal:230, protein:18, carbs:40, fat:1,  tags:["carb","protein","fiber"] },
    { id:"quinoa",       name:"Quinoa (cooked)",         serving:"1 cup (185g)",  kcal:222, protein:8,  carbs:39, fat:4,  tags:["carb","protein","fiber"] },
    { id:"whey",         name:"Whey Protein",            serving:"1 scoop (30g)", kcal:120, protein:24, carbs:3,  fat:2,  tags:["protein","post-workout"] },
    { id:"trail_mix",    name:"Trail Mix",               serving:"50g",           kcal:240, protein:7,  carbs:22, fat:14, tags:["fat","carb","snack","easy-cals"] },
    { id:"dark_choc",    name:"Dark Chocolate (70%)",    serving:"30g",           kcal:170, protein:2,  carbs:13, fat:12, tags:["fat","treat"] },
    { id:"dates",        name:"Medjool Dates",           serving:"2 (48g)",       kcal:133, protein:1,  carbs:36, fat:0,  tags:["carb","pre-workout","treat"] }
  ];

  /* ==========================================================================
     EXPORTS — globals (per contract) + optional read-only accessors.
     ========================================================================== */
  window.EXERCISE_DB   = EXERCISE_DB;
  window.WARMUPS       = WARMUPS;
  window.COOLDOWNS     = COOLDOWNS;
  window.SUBSTITUTIONS = SUBSTITUTIONS;
  window.FOODS         = FOODS;

  /* Pure (stateless) helpers used by Parts 3–6. Soft-attached to App if present. */
  var DB = {
    PATTERNS: ["push","pull","squat","hinge","core","shoulder","dip"],
    getExercise: function (id) { return EXERCISE_DB[id] || null; },
    ladder: function (pattern) {
      var out = [];
      for (var lvl = 1; lvl <= 6; lvl++) {
        var ex = EXERCISE_DB[pattern + "_" + lvl];
        if (ex) out.push(ex);
      }
      return out;
    },
    byLevel: function (pattern, level) { return EXERCISE_DB[pattern + "_" + level] || null; },
    era2Addons: function (pattern) {
      return Object.keys(EXERCISE_DB)
        .filter(function (id) { return id.indexOf(pattern + "_e2_") === 0; })
        .map(function (id) { return EXERCISE_DB[id]; });
    },
    listByPattern: function (pattern) {
      return Object.keys(EXERCISE_DB)
        .filter(function (id) { return EXERCISE_DB[id].pattern === pattern; })
        .map(function (id) { return EXERCISE_DB[id]; });
    },
    /* Era-aware substitution lookup. era defaults to 1. */
    substitute: function (pattern, bodyPart, severity, era) {
      var p = SUBSTITUTIONS[pattern]; if (!p) return null;
      var b = p[bodyPart]; if (!b) return null;
      var s = b[severity]; if (!s) return null;
      return (era === 2 ? s.era2 : s.era1) || s.era1;
    },
    bodyPartsFor: function (pattern) {
      return SUBSTITUTIONS[pattern] ? Object.keys(SUBSTITUTIONS[pattern]) : [];
    },
    warmup: function (dayType) { return WARMUPS[dayType] || []; },
    cooldown: function (dayType) { return COOLDOWNS[dayType] || []; },
    foodById: function (id) { return FOODS.filter(function (f) { return f.id === id; })[0] || null; }
  };
  window.DB = DB;
  if (window.App) window.App.data = DB;   // soft hook, not a hard dependency

})();

/* ===== BASALT script block 3 (source lines 2930-4736) ===== */
/* ============================================================================
   IRONFRAME — PART 3 · SHARED ENGINE + ONBOARDING + SESSION ENGINE (Today)
   ----------------------------------------------------------------------------
   Mounts via App.registerView and overrides App.renderOnboarding.
   Exposes two reusable namespaces consumed by Parts 4–6:
     App.lib     -> pure formatting / date / math helpers (no state writes)
     App.engine  -> training-domain logic (reads + writes APP_STATE)
   Touches the core only through its public contract.
   ========================================================================== */
(function () {
  "use strict";

  var U = (window.App && App.util) || {};
  var esc = U.escapeHtml || function (s) { return String(s); };

  /* ======================================================================
     A. App.lib — pure helpers
     ==================================================================== */
  var lib = {
    iso: function () { return new Date().toISOString(); },
    parse: function (v) { return (v instanceof Date) ? v : new Date(v); },
    dayKey: function (v) {
      var d = lib.parse(v || Date.now());
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    },
    /* dayKey is plain calendar arithmetic, for keys and Dates built from them.
       "Now" and a record's own day honour the Hub's rollover hour instead —
       train at 23:00, log at 00:20 with rollover 4, and both say yesterday. */
    today: function () { return Hub.today(); },
    /* The training day a session is filed on: the day its workout began,
       saved since 2026-10-01; older sessions fall back to their timestamp's
       day. Every reader that asks "which day was this workout" goes here. */
    sessionDay: function (s) { return s.dayKey || Hub.dayOf(s.dateISO); },
    /* whole-day difference between two day-keys / dates (b - a) */
    daysBetween: function (a, b) {
      var da = midnight(a), db = midnight(b);
      return Math.round((db - da) / 86400000);
    },
    addDays: function (v, n) { var d = lib.parse(v); d.setDate(d.getDate() + n); return d; },
    fmtDate: function (v) {
      var d = lib.parse(v);
      return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    },
    fmtShort: function (v) {
      var d = lib.parse(v);
      return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
    },
    fmtFull: function (v) {
      var d = lib.parse(v);
      return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    },
    relTime: function (v) {
      var diff = lib.daysBetween(Hub.dayOf(v), lib.today());
      if (diff <= 0) return "today";
      if (diff === 1) return "yesterday";
      if (diff < 7) return diff + " days ago";
      if (diff < 14) return "a week ago";
      return Math.floor(diff / 7) + " weeks ago";
    },
    round: function (n, dp) { var f = Math.pow(10, dp || 0); return Math.round((Number(n) || 0) * f) / f; },
    clamp: function (n, lo, hi) { return Math.max(lo, Math.min(hi, n)); },
    pct: function (n, d) { if (!d) return 0; return lib.clamp(Math.round((n / d) * 100), 0, 100); },
    sum: function (arr, f) { return (arr || []).reduce(function (a, x, i) { return a + (f ? Number(f(x, i)) || 0 : Number(x) || 0); }, 0); },
    lastN: function (arr, n) { arr = arr || []; return arr.slice(Math.max(0, arr.length - n)); },
    /* Monday-based week key for grouping */
    weekKey: function (v) {
      var d = midnight(v); var day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day);
      return lib.dayKey(d);
    },
    esc: esc
  };
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function midnight(v) { var d = lib.parse(v); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }

  /* ======================================================================
     B. App.engine — training domain logic
     ==================================================================== */
  var DB = window.DB;

  var ROTATION = ["push", "pull", "legs", "fullbody"];
  /* "mini" is a mini-session's type (plan D3): never in a template's order,
     so it's labelled here and nowhere else in the schedule. */
  var DAY_LABEL = { push: "Push Day", pull: "Pull Day", legs: "Leg Day", fullbody: "Full Body",
                    fullA: "Full Body A", fullB: "Full Body B", upper: "Upper", lower: "Lower",
                    whole: "Whole body", splitpush: "Push", splitpull: "Pull", splitlegs: "Legs",
                    mini: "Accessory session" };
  var DAY_DESC = {
    push: "Press, shoulders, dips & core — anterior chain power.",
    pull: "Pulls, posterior chain & core — build the back.",
    legs: "Squat & hinge patterns with bracing core work.",
    fullbody: "One push, one pull, one squat, one core — balanced.",
    fullA: "Push, row, squat and core — every major pattern in one session.",
    fullB: "Shoulders, pull, hinge and core — the other half of the body.",
    upper: "Push, row, shoulders and pull, plus dips if they're on your plan.",
    lower: "Squat, hinge and core — the legs get the whole session.",
    whole: "Push, row, squat, hinge and core in one session.",
    splitpush: "Chest, shoulders and triceps; pulling and legs have their own days.",
    splitpull: "Rows and vertical pulls; hinges stay on leg day.",
    splitlegs: "Squat, hinge and core; upper-body work has its own days."
  };
  /* `row` names the row slot explicitly; slotsFor turns `pull` into the row
     when you have no bar, so a no-bar Full Body B rows as well. */
  var DAY_PATTERNS = {
    push: ["push", "shoulder", "dip", "core"],
    pull: ["pull", "hinge", "core"],
    legs: ["squat", "hinge", "core"],
    fullbody: ["push", "pull", "squat", "core"],
    fullA: ["push", "row", "squat", "core"],
    fullB: ["shoulder", "pull", "hinge", "core"],
    upper: ["push", "row", "shoulder", "pull", "dip"],
    lower: ["squat", "hinge", "core"],
    whole: ["push", "row", "squat", "hinge", "core"],
    splitpush: ["push", "shoulder", "dip"],
    splitpull: ["row", "pull"],
    splitlegs: ["squat", "hinge", "core"]
  };

  /* Templates (plan D1) — chosen, never imposed. A save without one keeps
     the rotation it has always had, until you pick another in Program.
       order     the day types, repeating
       perWeek   planned sessions a week: attendance is attended ÷ planned, so
                 following the template exactly reads 100%. The rotation's 3.5
                 is "every other day": 14 in 28 days, the most its rest rule
                 allows. (It was DAYS_PER_WEEK = 4 before Stage 1, which
                 expected 16 and read 87.5% for following the rule exactly.)
       rest      "afterEach": the day after any session is a rest day.
                 "sameType": two different days can run back to back, but a
                 rest day has to fall between two sessions of the same type —
                 Upper, Lower, rest, Upper, Lower
     2 or 3 full-body sessions a week is the same template at a different
     plan: the rest rule already allows either, so only perWeek differs. */
  var TEMPLATES = {
    fullbody1:  { label: "Full body ×1", short: "1 a week", order: ["whole"], perWeek: 1, rest: "afterEach",
                  desc: "One whole-body session a week. A manageable start; two days is the general strength-training guideline." },
    fullbody3:  { label: "Full body ×3", short: "3 a week", order: ["fullA", "fullB"], perWeek: 3, rest: "afterEach",
                  desc: "A and B alternating, three sessions a week, a rest day after each." },
    fullbody2:  { label: "Full body ×2", short: "2 a week", order: ["fullA", "fullB"], perWeek: 2, rest: "afterEach",
                  desc: "A and B alternating, two sessions a week, a rest day after each." },
    upperlower: { label: "Upper / lower", short: "4 a week", order: ["upper", "lower"], perWeek: 4, rest: "sameType",
                  desc: "Upper and Lower can run back to back; a rest day comes before repeating either." },
    split5:    { label: "Upper / lower + split", short: "5 a week", order: ["upper", "lower", "splitpush", "splitpull", "splitlegs"], perWeek: 5, rest: "split",
                  desc: "Upper, Lower, Push, Pull and Legs, with two days off strength work. Build up to this frequency." },
    split6:    { label: "Push / pull / legs", short: "6 a week", order: ["splitpush", "splitpull", "splitlegs"], perWeek: 6, rest: "split",
                  desc: "Push, Pull and Legs twice, with one day off strength work. Intended for established training habits." },
    rotation:   { label: "Current rotation", short: "every other day", order: ROTATION, perWeek: 3.5, rest: "afterEach",
                  desc: "Push, Pull, Legs, Full Body in turn, a rest day after each." }
  };
  var TEMPLATE_ORDER = ["fullbody3", "fullbody2", "upperlower", "fullbody1", "split5", "split6", "rotation"];
  var WEEKLY_TEMPLATES = { 1: "fullbody1", 2: "fullbody2", 3: "fullbody3", 4: "upperlower", 5: "split5", 6: "split6" };
  /* Examples, not fixed appointments. Sessions still follow actual logs. */
  var WEEKLY_EXAMPLES = { 1: "Mon: Whole body. Tue–Sun: rest or light activity.",
    2: "Mon: Full Body A. Thu: Full Body B. Other days: rest or light activity.",
    3: "Mon: A. Wed: B. Fri: A. Alternate A/B next week; other days are recovery days.",
    4: "Mon: Upper. Tue: Lower. Thu: Upper. Fri: Lower. Wed, Sat and Sun: recovery.",
    5: "Mon: Upper. Tue: Lower. Wed: Push. Thu: Pull. Fri: Legs. Weekend: recovery.",
    6: "Mon/Thu: Push. Tue/Fri: Pull. Wed/Sat: Legs. Sun: recovery." };
  function templateOf(s) { return TEMPLATES[s && s.prefs && s.prefs.template] || TEMPLATES.rotation; }
  function templateId(s) { return TEMPLATES[s && s.prefs && s.prefs.template] ? s.prefs.template : "rotation"; }
  function weeklyGoal(s) {
    var n = s && s.prefs && s.prefs.weeklyDays;
    /* A merge with a device using an older template cannot pair that template
       with an incompatible day target. Unset or mismatched stays flexible. */
    return Number.isInteger(n) && WEEKLY_TEMPLATES[n] === templateId(s) ? n : null;
  }
  /* A day key is a local calendar date, not UTC midnight (which falls on
     the previous evening in timezones west of UTC). Noon avoids DST edges. */
  function calendarDate(key) { return lib.parse(key + "T12:00:00"); }
  function shiftKey(key, days) { return lib.dayKey(lib.addDays(calendarDate(key), days)); }
  function weekProgress(s, key) {
    var start = shiftKey(key, -((calendarDate(key).getDay() + 6) % 7)), seen = {};
    (s.sessions || []).forEach(function (x) {
      var d = lib.sessionDay(x);
      if (x.completed && x.kind !== "mini" && d >= start && d <= key) seen[d] = true;
    });
    return { start: start, days: Object.keys(seen).length, goal: weeklyGoal(s) };
  }

  /* Selected weekly plans and the new splits check primary muscles of
     performed sets, including accessories. Bracing alone is not treated as
     another hard workout. Calendar-day spacing does not measure recovery. */
  function splitOverlap(tpl, done, key) {
    var next = nextDayAfter(tpl, done), wanted = {}, recent = {};
    var primary = function (id, pattern) {
      var map = (window.MUSCLE_MAP || {})[id] || (window.MUSCLE_FALLBACK || {})[pattern];
      return map ? map.primary : [];
    };
    engine.slotsFor(next, (App.getState().prefs || {}).sessionLength).forEach(function (it) {
      primary(it.rx.exerciseId, it.slot).forEach(function (g) { wanted[g] = true; });
    });
    engine.completedSessions().forEach(function (x) {
      if (lib.daysBetween(lib.sessionDay(x), key) !== 1) return;
      (x.exercises || []).forEach(function (ex) {
        if (engine.skipped(ex) || !(ex.sets || []).some(function (st) { return Number(st.reps) > 0; })) return;
        primary(ex.key, ex.pattern).forEach(function (g) { recent[g] = true; });
      });
    });
    return Object.keys(wanted).some(function (g) { return recent[g]; });
  }

  function restRule(tpl, done, key) {
    var before = done.filter(function (x) { return lib.sessionDay(x) < key; });
    var week = weekProgress(App.getState(), shiftKey(key, -1));
    var monday = calendarDate(key).getDay() === 1;
    if (week.goal && !monday && week.days >= week.goal) return "weekly";
    if ((week.goal || tpl.rest === "split") && splitOverlap(tpl, before, key)) return "overlap";
    if (restOn(tpl, done, key)) return before.length && tpl.order.indexOf(before[before.length - 1].type) < 0 ? "switched" : tpl.rest;
    return null;
  }
  function nextAvailable(tpl, done, key) {
    /* At most the remainder of this week plus a recovery day into the next. */
    for (var i = 0; i < 9 && restRule(tpl, done, key); i++) key = shiftKey(key, 1);
    return key;
  }

  /* The day after the last of `done` in the template's order; the first day
     when the last session isn't one of the template's (or there is none). */
  function nextDayAfter(tpl, done) {
    var last = done.length ? done[done.length - 1].type : null;
    return tpl.order[(tpl.order.indexOf(last) + 1) % tpl.order.length];
  }

  /* Whether `key` is a rest day under the template's rule, judged from the
     sessions before it (`done`, sorted by training day). Only the day right
     after a session can be one — a longer break is your call, not a debt.
       afterEach  it is.
       sameType   only if the day the template trains next was already
                  trained since your last day off: Upper, Lower, then rest.
                  A last session from another template (you just switched)
                  rests as afterEach does: a Push then Upper the next day
                  would press two days running (R3-3). */
  function restOn(tpl, done, key) {
    var before = done.filter(function (x) { return lib.sessionDay(x) < key; });
    if (!before.length) return false;
    var lastKey = lib.sessionDay(before[before.length - 1]);
    if (lib.daysBetween(lastKey, key) !== 1) return false;
    if (tpl.rest === "split" && tpl.order.indexOf(before[before.length - 1].type) >= 0) return false;
    if (tpl.rest !== "sameType" || tpl.order.indexOf(before[before.length - 1].type) < 0) return true;
    var next = nextDayAfter(tpl, before), trained = {};
    before.forEach(function (x) { trained[lib.sessionDay(x)] = true; });
    var same = before.filter(function (x) { return x.type === next; });
    if (!same.length) return false;
    for (var d = lib.sessionDay(same[same.length - 1]); d < key; d = shiftKey(d, 1)) {
      if (!trained[d]) return false;            // a day off since then
    }
    return true;
  }

  /* "Full" session length — one extra movement per day, chosen as the
     antagonist the day is otherwise missing. Every added pattern already has
     a complete tier ladder in DB, so this adds no new exercise content.

     The added movement is marked `accessory: true` (a badge in the preview)
     and carries its slot's `rx`, so it IS evidence for that slot's step
     (PROGRESS-workout-progression.md, W8): it is the same exercise at the
     same prescription, done the same way. Nothing changes on its own — a
     step is offered and still needs your yes. Its set count is the base
     one, so it compares with the slot's own sessions. */
  var DAY_ACCESSORY = {
    push: "pull",       // antagonist balance for a push-dominant day
    pull: "push",
    legs: "dip",        // legs is otherwise entirely lower-body
    fullbody: "hinge",  // the one major pattern full body doesn't cover
    fullA: "hinge",     // A's missing pattern; B trains it
    fullB: "squat",     // B's missing pattern; A trains it
    upper: "core"       // Lower has no extra: an upper-body accessory there
                        // would break the back-to-back recovery Upper/Lower is for
  };

  function patternsFor(dayType, sessionLength) {
    var base = DAY_PATTERNS[dayType] || DAY_PATTERNS.fullbody;
    if (sessionLength !== "full") return base;
    var extra = DAY_ACCESSORY[dayType];
    return extra ? base.concat([extra]) : base;
  }

  /* Session-length modes — parallel to VOLUME_MODES, and independent of it.
     "Full + 1 set" is a real combination: more movements, and more sets on
     each. Short is how a session gets shorter (plan D2): it drops the day's
     last slot and never cuts rest, because rest is what makes the sets you do
     keep count. */
  var LENGTH_MODES = {
    short:   { label: "Short",   desc: "Drops the day's last movement — rest stays the same" },
    focused: { label: "Focused", desc: "3-4 movements — the core of the day" },
    full:    { label: "Full",    desc: "+1 antagonist movement, doesn't affect your ladders" }
  };
  /* Reps-mode starting targets. `core: 30` USED to live here too and was the
     source of a real bug: core's ladder switches from holds (L1-L4) to reps
     (L5 Dragon Flag Negative), and levelling into L5 read this table and
     prescribed 30 REPS of dragon flag negatives. A seconds value cannot
     double as a reps value; holds get HOLD_START below instead. */
  var BASE_REPS    = { push: 12, pull: 8, squat: 14, hinge: 14, core: 5, shoulder: 8, dip: 8 };
  var TARGET_SETS  = 3;

  /* Where each ladder hold stops being worth extending, promoted from the
     `readiness` prose that already shipped in the exercise DB — the text and
     the algorithm were previously free to disagree, and did.

     These are NOT uniform on purpose: 60s is a respectable plank and 20s is a
     respectable full L-sit. A flat cap would prescribe a 60-second L-sit,
     which is an elite hold, and simultaneously let a plank crawl past the
     point where a harder variation is the better use of the time. */
  var HOLD_ADVANCE_AT = {
    core_1: 60,        // Plank
    core_2: 30,        // Hollow Body Hold
    core_3: 30,        // Tuck L-Sit
    core_4: 20,        // L-Sit
    pull_1: 45,        // Dead Hang
    shoulder_3: 45     // Wall Handstand Hold
  };

  /* Opening target for a hold, as a fraction of its own advance point rather
     than a flat 30s. Levelling into the L-Sit used to prescribe 30s when its
     advance point is 20s — arriving at a new progression already past the
     threshold that means "you have mastered this". */
  function holdStart(exId) {
    var cap = HOLD_ADVANCE_AT[exId];
    if (!cap) return 30;
    return Math.max(10, Math.round((cap * 0.5) / 5) * 5);
  }

  /* Volume modes — applied on top of the phase's volumeFactor (plan D4).
     sets:    bonus sets on the day's main slots; the Full-length accessory
              keeps the base count, since it is support work
     label / desc: shown in the Today UI
     "Extended" (+1 set, 15% less rest) and "Max effort" (+2 sets, 25% less
     rest) are one option now, and no mode touches rest: shorter rest buys
     fewer good reps, not more work. Extra sets make a different
     prescription, so a +1 set session is never evidence for a standard one
     (training.js comparable). A save that still says "max" reads as +1 set
     (volumeModeOf) — nothing is rewritten. */
  var VOLUME_MODES = {
    standard: { sets: 0, label: "Standard", desc: "Your prescription — 3 sets" },
    extended: { sets: 1, label: "+1 set",   desc: "One more set on each main movement, same rest" }
  };
  function volumeModeOf(name) { return name === "extended" || name === "max" ? "extended" : "standard"; }

  /* A mini-session's size (plan D3): 2 to 6 coverage movements, the
     finisher's four (Coverage.DEFAULT_PICKS) unless you ask for another. */
  var MINI_PICKS = [2, 6];

  var engine = {
    ROTATION: ROTATION, DAY_LABEL: DAY_LABEL, DAY_DESC: DAY_DESC,
    DAY_PATTERNS: DAY_PATTERNS, TARGET_SETS: TARGET_SETS,
    VOLUME_MODES: VOLUME_MODES, volumeModeOf: volumeModeOf,
    TEMPLATES: TEMPLATES, TEMPLATE_ORDER: TEMPLATE_ORDER,
    WEEKLY_TEMPLATES: WEEKLY_TEMPLATES, WEEKLY_EXAMPLES: WEEKLY_EXAMPLES,
    weeklyGoal: weeklyGoal,
    weekProgress: function (s) { return weekProgress(s, lib.today()); },
    template: function () { return templateOf(App.getState()); },
    templateId: function () { return templateId(App.getState()); },
    DAY_ACCESSORY: DAY_ACCESSORY, LENGTH_MODES: LENGTH_MODES,
    patternsFor: patternsFor,
    HOLD_ADVANCE_AT: HOLD_ADVANCE_AT, holdStart: holdStart,

    /* Sorted by training day, then time saved — not by insertion order. Every caller that reads
       `done[done.length - 1]` means "my most recent session" — but sessions
       are appended in the order you LOG them, and the app lets you log a past
       day. Backdate yesterday's session after today's and the unsorted tail
       is yesterday, which told you to rest on a day you had already trained
       and advanced the rotation off the wrong session. */
    completedSessions: function () {
      return App.getState().sessions.filter(function (s) { return s.completed; })
        .sort(function (a, b) {
          var da = lib.sessionDay(a), db = lib.sessionDay(b);
          return da < db ? -1 : da > db ? 1 : new Date(a.dateISO) - new Date(b.dateISO);
        });
    },

    /* Completed main sessions, in the same order: every session except
       mini-sessions (plan D3). Scheduling reads these — the rotation, the
       rest gate, done-today, the next session, and liftOn and the run clash
       through them — and so does attendance, which counts mini-sessions on
       a line of their own. So a mini-session on a rest day leaves it a rest
       day and the next session where it was. History, PRs, evidence,
       muscles, the streak and the Hub's fitness habit read every session. */
    mainSessions: function () {
      return engine.completedSessions().filter(function (x) { return !engine.isMini(x); });
    },
    isMini: function (x) { return !!x && x.kind === "mini"; },

    /* The template's next day after your last session. A last session from
       another template (you just switched) starts the new one at its first
       day. */
    recommendedDayType: function () {
      return nextDayAfter(templateOf(App.getState()), engine.mainSessions());
    },

    /* The movement a pattern trains now: its slot's prescription (v4), else
       the tier's level. Screens that still show the old ladder read this, so
       they name what the workout will actually prescribe. */
    movementFor: function (pattern) {
      var s = App.getState(), rx = (s.training && s.training.slots || {})[pattern];
      var t = s.tiers[pattern];
      return (rx && !rx.off && DB.getExercise(rx.exerciseId)) ||
             (t && DB.byLevel(pattern, t.level)) || DB.ladder(pattern)[0];
    },

    /* What Training's rules read from your save: equipment, decisions,
       goal, exclusions, limitations, grip and the weights you own. */
    ctx: function () { return trainingCtx(App.getState()); },

    /* The prescription a slot trains today, with your equipment,
       exclusions and joint limits applied (plan C3). Returns { rx, note,
       blocked } — a copy, never the stored record — or null when the slot is
       turned off or nothing on it is possible (the pull slot without a bar).
       When the slot's own exercise isn't allowed, the nearest easier movement
       you're allowed is prescribed instead; `blocked` says why
       ("equipment" | "excluded" | a joint) and `note` says it in a sentence.
       The stored slot is never changed: buy the gear or lift the exclusion
       and it's back. */
    prescriptionFor: function (slot) {
      var s = App.getState(), ctx = trainingCtx(s);
      var rec = s.training.slots[slot], t = s.tiers[slot];
      if (rec && rec.off) return null;
      var rx = rec || (t ? rxStart(slot + "_" + t.level, { why: "carried over from Level " + t.level }) : null);
      var why = rx ? window.Training.blocked(ctx, rx.exerciseId, gripOf(rx)) : null;
      if (rx && !why) return { rx: JSON.parse(JSON.stringify(rx)), note: "", blocked: null };
      var alt = rx ? nearestAllowed(rx, ctx) : null;
      var first = firstAllowed(slot, ctx);
      if (!alt && first) alt = rxStart(first, { grip: standingGrip(s, slot), custom: rx && rx.custom });
      if (!alt) return null;
      var note = rx ? blockedNote(rx.exerciseId, why, s.equipment) : "";
      alt.why = note || alt.why;
      return { rx: alt, note: note, blocked: why };
    },

    /* Why prescriptionFor has nothing (R3-3): what blocks the slot's own
       movement, else its first rung — "equipment" | "excluded" | a joint.
       Equipment isn't the only reason: avoid neck empties the neck slot. */
    unavailableReason: function (slot) {
      var s = App.getState(), rec = s.training.slots[slot], live = rec && !rec.off;
      return window.Training.blocked(trainingCtx(s), live ? rec.exerciseId : TD().SLOTS[slot].first[0],
        live ? gripOf(rec) : undefined);
    },

    /* The slots a day trains, in order, each with its prescription.
         · pull without a bar becomes the row, and the card says why (T14);
         · an accepted row slot joins the rotation's pull day beside the
           pull-ups (the templates name the row where they want it);
         · a slot that is off (the optional dip) is left out;
         · Short drops the day's last slot (D2).
       `accessory` marks the Full-length extra, as before. */
    slotsFor: function (dayType, sessionLength) {
      var s = App.getState(), pats = patternsFor(dayType, sessionLength);
      var accAt = sessionLength === "full" ? pats.length - 1 : -1;
      var out = [], seen = {};
      function add(slot, pr, accessory, note) {
        if (!pr || seen[slot]) return;
        seen[slot] = true;
        out.push({ slot: slot, rx: pr.rx, accessory: accessory, note: note || pr.note });
      }
      pats.forEach(function (p, i) {
        var pr = engine.prescriptionFor(p);
        if (!pr && p === "pull") {
          var row = engine.prescriptionFor("row");
          if (row && !row.rx.why) row.rx.why = "no pull-up bar";
          return add("row", row, i === accAt, TD().SLOTS.pull.none);
        }
        add(p, pr, i === accAt);
        var rowRec = s.training.slots.row;
        if (dayType === "pull" && p === "pull" && pr && i !== accAt && rowRec && !rowRec.off) add("row", engine.prescriptionFor("row"), false);
      });
      if (sessionLength === "short" && out.length > 1) out.pop();
      return out;
    },

    /* Every exercise a slot can swap to, for the swap lists: allowed first,
       then those a careful joint warns on, then blocked ones (gear you lack,
       excluded, a joint you avoid); within each, main path before optional,
       then by level. No Era gate — loaded movements show to anyone whose
       equipment covers them. The lists hide excluded ones until you ask. */
    slotOptions: function (slot) {
      var EXS = TD().EXERCISES;
      var list = Object.keys(EXS).filter(function (id) { return EXS[id].slot === slot && DB.getExercise(id); })
        .map(function (id) { return DB.getExercise(id); });
      var rank = function (x) {
        var st = engine.swapStatus(slot, x.id);
        return (st.blocked ? 1000 : st.careful.length ? 500 : 0) + (EXS[x.id].branch === "main" ? 0 : 100) + (x.level || 50);
      };
      return list.sort(function (a, b) { return rank(a) - rank(b); });
    },

    /* One swap-list row's standing for you, at the grip the slot would use:
       { missing: the gear you lack ("" when owned), blocked: "equipment" |
       "excluded" | a joint | null, careful: [joints] }. */
    swapStatus: function (slot, id) {
      var s = App.getState(), ctx = trainingCtx(s), rec = s.training.slots[slot];
      var grip = gripCapable(id) ? standingGrip(s, slot) || gripOf(rec) : null;
      return { missing: gearMissing(id, s.equipment), blocked: window.Training.blocked(ctx, id, grip),
               careful: carefulFor(ctx, id, grip) };
    },

    /* One workout exercise from a prescription. Its rx is the copy the
       session saves, with this session's set count: a deload or Max effort
       session is a different prescription and is never comparable with a
       standard one. The target — what a set logs when you tick it without
       typing — is the bottom of the range, where a fresh prescription starts. */
    exerciseFromRx: function (slot, rx, setCount, restMul, o) {
      o = o || {};
      var s = App.getState(), db = DB.getExercise(rx.exerciseId) || {};
      var r = JSON.parse(JSON.stringify(rx));
      r.sets = setCount;
      var load = r.setup && r.setup.loadKg;
      return {
        slot: slot, pattern: db.pattern || slot, id: r.exerciseId, name: db.name || r.exerciseId,
        level: db.level || null, mode: db.mode, unit: db.unit, equipment: db.equipment || [],
        cues: db.cues || [], mistakes: db.mistakes || [],
        readiness: db.readiness || "", injury: db.injury || "",
        rx: r, range: r.range, target: r.range[0] != null ? r.range[0] : r.range[1],
        era2: false, accessory: !!o.accessory, note: o.note || "", swapped: !!o.swapped,
        restSec: Math.round((db.mode === "hold" ? restHoldPref(s) : restRepPref(s)) * (restMul || 1)),
        sets: newSets(setCount, load), difficulty: null, flag: null
      };
    },

    /* A plateau needs repeated, comparable work under the current
       prescription. Frozen legacy level numbers are not performance evidence. */
    tierStalls: function () {
      var s = App.getState();
      var out = {};
      Object.keys((s.training && s.training.slots) || {}).forEach(function (slot) {
        var rx = s.training.slots[slot], rec = rx && !rx.off && !rx.hold && engine.recommendFor(slot);
        if (!rec || rec.action !== "repeat" || rec.decision || rec.why === "off-load") return;
        var last = (rec.history || []).slice(-4);
        if (last.length < 4 || lib.daysBetween(last[0].day, last[3].day) < 14 ||
            lib.daysBetween(last[3].day, lib.today()) > 21 ||
            Object.keys(last.reduce(function (seen, x) { seen[x.day] = true; return seen; }, {})).length < 4) return;
        if (!last.slice(-2).every(function (x) { return x.effort === "hard" || x.effort === "failed"; })) return;
        var earlier = Math.max(last[0].total, last[1].total);
        if (Math.max(last[2].total, last[3].total) <= earlier) out[slot] = true;
      });
      return out;
    },

    /* A workout is the day's slots, each at its prescription (slotsFor).
       `overrides` maps a slot to an exercise id chosen in the preview's Swap:
       that exercise at the bottom of its range, for this session only.
       `grips` maps a slot to today's grip ("knuckles" | "palms"), the
       Knuckles today toggle (plan C1): the same prescription on that grip,
       so it isn't a swap, and a knuckles session is evidence for palms.

       Custom sets (plan C4) replace the base count for that slot; +1 set
       adds to them, a deload phase scales them and a recovery block cuts
       them ×0.6, as with everyone else's three.

       The Era-II accessory that used to be appended here is gone with the Era
       gate (plan C3): it appeared only once every Era I benchmark was
       cleared. Loaded movements are in every slot's Swap list instead, for
       anyone who owns the gear.

       Coverage (plan D3), picked by fitness/coverage.js for the day you're
       logging to, each at its slot's prescription and the base set count,
       carrying `reason` ("Biceps: 0 of 6 direct sets this week"):
         · the finisher: with prefs.finisher "on" (o.finisher overrides it),
           four picks after the main slots, marked `finisher: true`, with the
           main slots' sets counted toward each group's week;
         · a mini-session: dayType "mini" is picks only — o.n of them, 2 to 6,
           four by default — with its own short warm-up and cool-down, and
           the workout says kind: "mini".
       A pick swaps through `overrides` like any slot, and overrides[slot]
       === false leaves it out for this session. A recovery block cuts them
       too. */
    buildWorkout: function (dayType, overrideMode, overrideLength, overrides, grips, o) {
      o = o || {};
      var s = App.getState(), mini = dayType === "mini";
      var lengthName = overrideLength || (s.prefs && s.prefs.sessionLength) || "focused";
      var ph = s.currentPhase || {};
      var vf = Number(ph.volumeFactor) || 1;                 // deload phases < 1
      var baseSetCount = Math.max(2, Math.round(TARGET_SETS * vf));

      /* Volume mode — "+1 set" on the main slots, or standard. Deload phases
         always cap to standard to protect recovery. Nothing here shortens
         rest any more: not the mode, and not a consolidation phase (D4). */
      /* A recovery block (D3) cuts every count to x 0.6 and drops the mode:
         nothing rises inside it. */
      var dayKey = Hub.viewDate(), rb = engine.recoveryOn(dayKey);
      var modeName = vf < 1 || rb || mini ? "standard" : volumeModeOf(overrideMode || (s.prefs && s.prefs.volumeMode));
      var mode = VOLUME_MODES[modeName];

      var setCount = Math.min(6, Math.max(2, baseSetCount + mode.sets));
      if (rb) { baseSetCount = window.Training.recoverySets(baseSetCount); setCount = window.Training.recoverySets(setCount); }

      /* A slot's count: custom sets in place of the base three, then the
         same mode, phase and block rules. */
      var countFor = function (rx, accessory) {
        var c = rx.custom && rx.custom.sets;
        if (!c) return accessory ? baseSetCount : setCount;
        var base = Math.max(1, Math.round(c * vf)), n = accessory ? base : Math.min(6, base + mode.sets);
        return rb ? window.Training.recoverySets(n) : n;
      };
      /* One exercise from a slot's prescription, with this session's swap
         and grip; `count` is its set count before them. */
      var make = function (slot, baseRx, count, accessory, note) {
        var rx = baseRx, pick = overrides && overrides[slot], grip = (grips && grips[slot]) || null;
        var swapped = !!(pick && pick !== rx.exerciseId && window.TRAINING_DATA.EXERCISES[pick]);
        if (swapped) rx = rxStart(pick, { why: "swapped for this session", grip: grip || standingGrip(s, slot) });
        else rx = withGrip(rx, grip);
        return engine.exerciseFromRx(slot, rx, count, 1, { accessory: accessory, note: swapped ? "" : note, swapped: swapped });
      };
      var exercises = mini ? [] : engine.slotsFor(dayType, lengthName).map(function (it) {
        return make(it.slot, it.rx, countFor(it.rx, it.accessory), it.accessory, it.note);
      });
      /* The skill block (plans/PLAN-skills-mobility-in-workouts.md B4): first,
         while you're fresh, at the base set count like coverage work — the
         volume mode doesn't add attempts, and a deload or recovery block cuts
         them like everything else. overrides["skill:<track>"] === false
         leaves one out for this session. */
      var skills = engine.skillsFor(dayType, lengthName, exercises.map(function (ex) { return ex.id; }))
        .filter(function (p) { return !(overrides && overrides["skill:" + p.track] === false); })
        .map(function (p) {
          var ex = engine.exerciseFromRx(null, p.rx, countFor(p.rx, true), 1, {});
          ex.skill = p.track;
          ex.reason = p.reason;
          return ex;
        });
      exercises = skills.concat(exercises);
      var finisher = !mini && (o.finisher != null ? !!o.finisher : (s.prefs && s.prefs.finisher) === "on");
      if (mini || finisher) {
        var notes = {};
        var picks = window.Coverage.pick(s.sessions, dayKey, {
          rxFor: function (slot) { var pr = engine.prescriptionFor(slot); if (pr) notes[slot] = pr.note; return pr && pr.rx; },
          planned: exercises.map(function (ex) { return { id: ex.id, sets: ex.sets.length }; }),
          pins: s.training.pins || {},
          n: mini ? lib.clamp(Math.round(Number(o.n) || window.Coverage.DEFAULT_PICKS), MINI_PICKS[0], MINI_PICKS[1])
                  : window.Coverage.DEFAULT_PICKS
        });
        picks.forEach(function (p) {
          if (overrides && overrides[p.slot] === false) return;
          var ex = make(p.slot, p.rx, countFor(p.rx, true), false, notes[p.slot]);
          if (finisher) ex.finisher = true;
          ex.reason = p.reason;
          exercises.push(ex);
        });
      }
      var w = {
        dayType: dayType,
        startedISO: lib.iso(),
        warmup: DB.warmup(dayType).map(function () { return false; }),
        cooldown: DB.cooldown(dayType).map(function () { return false; }),
        exercises: exercises,
        notes: "",
        setCount: mini ? baseSetCount : setCount,
        volumeMode: modeName,
        /* The block this workout was cut for; finalize stamps the session so
           it is never evidence. Set here, not at save time, so the flag
           always matches the sets that were prescribed. */
        recovery: rb ? rb.id : null
      };
      if (mini) w.kind = "mini";
      var mob = engine.mobilityFor(dayType, lengthName, skills.map(function (ex) { return ex.skill; }), o.mobility);
      if (mob) w.mobility = mob;
      return w;
    },

    /* A pain flag on an exercise: what was logged is a substitute movement, so
       it counts toward no progression, PR, target or rep ratio. */
    flagged: function (ex) { return !!(ex && ex.flag && ex.flag.bodyPart); },
    /* Sharp means skip: every sharp substitution already reads "Skip ... today". */
    skipped: function (ex) { return !!(ex && ex.flag && ex.flag.bodyPart && ex.flag.severity === "sharp"); },

    /* total reps performed (weighted reps count 1.5x as a rough volume proxy) */
    sessionVolume: function (session) {
      var v = 0;
      (session.exercises || []).forEach(function (ex) {
        if (engine.skipped(ex)) return;
        (ex.sets || []).forEach(function (st) {
          var val = Number(st.value) || 0;
          if (ex.mode === "hold") v += Math.round(val / 5); // 5s ≈ 1 "rep unit"
          else v += val * (Number(st.weight) > 0 ? 1.5 : 1);
        });
      });
      return Math.round(v);
    },

    /* Persisted finalize: streak, PRs, flags, the prescription each exercise
       was done at, push to sessions[] */
    finalizeSession: function (workout) {
      var s = App.getState();
      var nowISO = lib.iso();
      var session = {
        id: "s_" + Date.now(),
        dateISO: nowISO,
        /* Decided when the workout began (#begin-session), never now: begun at
           23:50 and finished at 00:20, it belongs to the day it began. A draft
           from before dayKey existed falls back to the logging date. */
        dayKey: workout.dayKey || Hub.viewDate(),
        type: workout.dayType,
        exercises: workout.exercises.map(function (ex) {
          /* A sharp pain flag means the exercise was skipped: whatever was
             typed into its sets before the flag is not a performed set. */
          var skipped = engine.skipped(ex);
          var out = {
            key: ex.id, pattern: ex.pattern, name: ex.name,
            era2: !!ex.era2, accessory: !!ex.accessory,
            mode: ex.mode, unit: ex.unit,
            sets: ex.sets.map(function (st) { return skipped ? { reps: 0, weight: 0 } : { reps: num(st.value), weight: num(st.weight) }; }),
            /* null, not "moderate", when unrated: a saved "moderate" can't be
               told from "didn't answer". Every reader supplies its own default. */
            difficulty: skipped ? null : (ex.difficulty || null),
            skipped: skipped,
            flag: ex.flag || null
          };
          /* The prescription is copied from the draft, never rebuilt from the
             current slot: a draft begun before the v4 upgrade has none, and
             saves without one (T12) — it is history, never evidence. */
          if (ex.slot) out.slot = ex.slot;
          if (ex.skill) out.skill = ex.skill;
          if (ex.finisher) out.finisher = true;
          if (ex.rx) out.rx = rxAsLogged(ex, out.sets);
          return out;
        }),
        warmupDone: workout.warmup.every(Boolean),
        cooldownDone: workout.cooldown.every(Boolean),
        notes: workout.notes || "",
        volume: 0,
        completed: true,
        flags: []
      };
      if (workout.kind === "mini") session.kind = "mini";
      if (workout.recovery) session.recovery = workout.recovery;
      /* The mobility block (plan B6): what was done is saved on the session,
         and a routine ticked to the last step counts once in the Mobility
         view's day — on the session's training day, never today's date, so a
         session begun at 23:50 counts on the day it began. A partial routine
         counts for nothing there, as a quit routine does in Mobility. */
      if (workout.mobility && Array.isArray(workout.mobility.done)) {
        var md = workout.mobility.done;
        session.mobility = { routine: workout.mobility.routine, done: md.filter(Boolean).length, of: md.length };
        if (md.length && session.mobility.done === md.length && window.Hub && Hub.editDay) {
          var hd = Hub.editDay(session.dayKey);
          hd.mobility = (Number(hd.mobility) || 0) + 1;
          Hub.commit();
          if (Hub.gamify && Hub.gamify.checkMilestone) Hub.gamify.checkMilestone("mobility");
        }
      }
      session.volume = engine.sessionVolume({ exercises: workout.exercises });

      /* A coverage slot gets its record the first time a finished workout
         trains one of its picks (plan D3): its first allowed rung, which is
         what prescriptionFor gives a slot with no record, so it's the pick
         itself unless you swapped it for the day. acceptedAt stays null —
         nobody chose it — so a choice made on another device outranks it in
         a sync. From here a coverage slot is a slot like any other: its
         card, steps and Change exercise. A discarded workout writes none,
         and neither does a pick left at 0 sets or skipped (R3-2). */
      session.exercises.forEach(function (ex) {
        var def = ex.slot && TD().SLOTS[ex.slot];
        if (!def || !def.coverage || s.training.slots[ex.slot]) return;
        if (ex.skipped || !ex.sets.some(function (st) { return st.reps > 0; })) return;
        var pr = engine.prescriptionFor(ex.slot);
        if (!pr) return;
        pr.rx.acceptedAt = null;
        pr.rx.why = "added for coverage";
        s.training.slots[ex.slot] = pr.rx;
      });

      /* A loaded slot whose load isn't known yet takes the weight you just
         logged (rxAsLogged) onto the slot itself. Left on the session alone,
         every session said 10 kg against a slot that said unknown, so none
         ever compared and the slot could never step up (R2-2). Stamped: it is
         the load you chose, and a sync should carry it. */
      session.exercises.forEach(function (ex) {
        var rec = ex.slot && s.training.slots[ex.slot];
        if (!rec || rec.off || !rec.setup || !rec.setup.loadMode || rec.setup.loadKg != null) return;
        if (!ex.rx || ex.rx.exerciseId !== rec.exerciseId || ex.rx.setup.loadKg == null || ex.skipped || engine.flagged(ex)) return;
        rec.setup.loadKg = ex.rx.setup.loadKg;
        rec.acceptedAt = nowISO;
      });

      var result = { levelUps: [], prs: [], flags: [] };

      /* 1) streak: recounted below, once the session is in the list. */

      /* 2) No points. Progression is the evidence in the saved rx (plan C2):
         a level changes only when you accept a step (engine.decide). */

      /* 3) PRs. Accessories are NOT excluded here, deliberately: progression
         and target adaptation change your future program and must not be
         driven by support work, but a PR only describes a rep you actually
         performed. If you really did hit a best on an accessory set, that
         happened. */
      workout.exercises.forEach(function (ex) {
        /* Except a flagged one: its sets were a substitute, and a PR would be
           filed under the original exercise's id. */
        if (engine.flagged(ex)) return;
        var pr = engine._checkPR(s, ex, session.dateISO);
        if (pr) result.prs.push(pr);
      });

      /* 4) injury flags -> flagsHistory */
      workout.exercises.forEach(function (ex, i) {
        if (ex.flag && ex.flag.bodyPart) {
          var f = {
            /* The position keeps two flags in one session apart: every
               coverage movement shares the pattern "accessory", and a sync
               unions flags by id. */
            id: "f_" + Date.now() + "_" + i + "_" + ex.pattern,
            dateISO: session.dateISO,
            /* The exercise that hurt, not the one a pain swap moved to. */
            exerciseKey: ex.flag.fromId || ex.id, pattern: ex.pattern,
            bodyPart: ex.flag.bodyPart, severity: ex.flag.severity,
            substitutedTo: ex.flag.substitutedTo || null
          };
          s.flagsHistory.push(f);
          session.flags.push(ex.flag.bodyPart);
          result.flags.push(f);
        }
      });

      s.sessions.push(session);
      App.recountStreak(s);
      App.saveState();
      return result;
    },

    /* liveStreak — call this at render time to get the *current* streak value,
       accounting for sessions missed since the last training day.
       Returns 0 if the last session was more than 3 days ago (streak broken). */
    liveStreak: function (s) {
      var st = s.streak;
      if (!st.lastISO || !st.count) return 0;
      var daysSinceLast = lib.daysBetween(st.lastISO, lib.today());
      /* Still alive: within the gap your template's pace allows (App.streakGap) */
      if (daysSinceLast <= App.streakGap(s)) return st.count;
      /* Streak is broken — hasn't trained within a rest-day-adjusted window */
      return 0;
    },

    /* Recovery follows completed training days and, when explicitly chosen,
       the Monday–Sunday target. Flexible legacy templates keep their original
       spacing rule. Train anyway remains available; missed days add no debt. */
    restDayInfo: function (s) {
      var done = engine.mainSessions(), tpl = templateOf(App.getState()), today = lib.today();
      var last = done[done.length - 1], lastKey = last && lib.sessionDay(last);
      /* Trained today already: doneTodayInfo's state, not this gate. Past
         that, the template's rule decides (restOn): after any session, or
         before repeating a day type. */
      var rule = restRule(tpl, done, today);
      if (lastKey >= today || !rule) return { isRest: false };
      return {
        isRest: true, lastKey: lastKey,
        lastType: last && last.type,
        rule: rule,
        nextKey: nextAvailable(tpl, done, today)
      };
    },

    /* "Train anyway" / "Train again anyway" is remembered for today only, and
       both the Today tab and the dashboard hero have to read the same flag or
       overriding on one leaves the other still saying you're done. Derived
       here because those two live in different IIFEs and a duplicated key
       string is how they'd drift apart. */
    overrideKey: function (kind) { return kind + "Override:" + lib.today(); },

    /* doneTodayInfo — the gap-0 case restDayInfo deliberately leaves alone.
       Its comment said that state was "handled elsewhere (resume/already-done)";
       nothing anywhere actually handled it, so after finishing a session the
       app went on recommending the very session you had just logged while the
       calendar had already moved on to the day after your rest day. */
    doneTodayInfo: function (s) {
      var done = engine.mainSessions();
      if (!done.length) return { isDone: false };
      var todayKey = lib.today();
      var todays = done.filter(function (x) { return lib.sessionDay(x) === todayKey; });
      if (!todays.length) return { isDone: false };
      /* Find the next date allowed by both recovery and the weekly target. */
      var tomorrow = shiftKey(todayKey, 1);
      var nextKey = nextAvailable(templateOf(App.getState()), done, tomorrow);
      var restTomorrow = nextKey !== tomorrow;
      return {
        isDone: true,
        todayType: todays[todays.length - 1].type,
        count: todays.length,
        restTomorrow: restTomorrow,
        nextKey: nextKey
      };
    },

    /* One next available date, shared by Workout, Overview and the calendar.
       Recovery and the selected weekly target constrain it; later sessions
       depend on when the user actually trains. */
    nextSession: function (s) {
      var todayKey = lib.today();
      var type = engine.recommendedDayType();
      var doneToday = engine.doneTodayInfo(s);
      var nextKey;
      if (doneToday.isDone) {
        nextKey = doneToday.nextKey;
      } else {
        var restInfo = engine.restDayInfo(s);
        nextKey = restInfo.isRest ? restInfo.nextKey : todayKey;
      }
      return { dateISO: calendarDate(nextKey).toISOString(), key: nextKey, type: type, isToday: nextKey === todayKey };
    },

    /* The session on `key`, for the only days the app can stand behind (the
       comment above): one already finished today, or the next one. Anything
       later is your call, so it answers null. { type, done } or null. */
    liftOn: function (key) {
      var s = App.getState(), info = engine.doneTodayInfo(s);
      if (key === lib.today() && info.isDone) return { type: info.todayType, done: true };
      var n = engine.nextSession(s);
      return n && n.key === key ? { type: n.type, done: false } : null;
    },

    /* The recommendation for one slot, from every completed session (plan
       C2). Recomputed on every call, never stored. null for a slot with no
       prescription or one that is off. */
    recommendFor: function (slot) {
      var s = App.getState(), rx = engine.recordOf(slot);
      if (!rx || rx.off) return null;
      return window.Training.recommend(s.sessions.filter(function (x) { return x.completed; }), rx, trainingCtx(s));
    },

    /* Your answer to a slot's recommendation: "step" takes the step it
       offers (up when ready, back when reducing), "repeat" keeps the
       prescription. Only the choice is stored, under the evidence's key, so
       new evidence asks again. Taking a step replaces the slot's prescription
       with a stamped one, and a numbered ladder movement moves the old tier
       level with it — the only way a level changes now that points are off.
       "step2" takes both steps of a double offer (F9), stored as a "step"
       with `steps: 2`. "load" answers an off-load reading (F1): the slot keeps
       everything but its load, which becomes the weight you logged, stored
       as { choice: "load", kg, at }. "option" steps into one of a ready
       slot's optional branch moves (`to`, an id in rec.optionSteps — plan
       C2), stored as { choice: "option", to, at }.
       Returns the new slot prescription, the unchanged one, or null. */
    decide: function (slot, choice, to) {
      var s = App.getState(), rec = engine.recommendFor(slot);
      var option = choice === "option" && rec && rec.optionSteps.filter(function (o) { return o.rx.exerciseId === to; })[0];
      /* Nothing to answer, an answer this card never offers, or a step with
         no step on offer: write nothing. */
      if (!rec || !rec.key || ["step", "step2", "load", "repeat", "option"].indexOf(choice) < 0 ||
          (choice === "step" && !rec.step) || (choice === "step2" && !rec.double) ||
          (choice === "load" && rec.why !== "off-load") || (choice === "option" && !option)) return null;
      /* Nothing rises inside a recovery block (D3). Stepping back is allowed,
         and so is setting the load you actually lifted. */
      /* Today, not the logging date: the choice is made now (R3-4). */
      if ((choice === "step" || choice === "step2" || choice === "option") && rec.action === "ready" &&
          engine.recoveryOn(lib.today())) return null;
      var at = lib.iso(), from = engine.recordOf(slot), skill = engine.skillKey(slot);
      if (choice === "load") {
        var kept = JSON.parse(JSON.stringify(from));
        kept.setup.loadKg = rec.loggedKg;
        kept.acceptedAt = at;
        kept.why = "set to the weight you logged";
        s.training.decisions[rec.key] = { choice: "load", kg: rec.loggedKg, at: at };
        s.training.slots[slot] = kept;
        App.saveState();
        return kept;
      }
      s.training.decisions[rec.key] = choice === "step2" ? { choice: "step", steps: 2, at: at }
        : choice === "option" ? { choice: "option", to: to, at: at } : { choice: choice, at: at };
      if (choice === "step" || choice === "step2" || choice === "option") {
        var rx = (choice === "option" ? option : choice === "step2" ? rec.steps[1] : rec.step).rx;
        var name = (DB.getExercise(from.exerciseId) || {}).name || from.exerciseId;
        rx.acceptedAt = at;
        rx.why = (choice === "option" ? "stepped into it from " : rec.action === "reduce" ? "stepped back from " : "stepped up from ") + name;
        /* Hold is the slot's, not the movement's: it stays on through a step back. */
        if (from.hold) rx.hold = true;
        if (skill) {
          /* A skill step keeps the track's tick and stamps the record, so a
             sync carries it like any other change to the track. */
          rx.every = !!from.every; rx.at = at;
          s.training.skills[skill] = rx;
        } else {
          s.training.slots[slot] = rx;
          var lvl = ladderLevel(slot, rx.exerciseId);
          if (lvl && s.tiers[slot]) s.tiers[slot].level = lvl;
        }
      }
      App.saveState();
      return engine.recordOf(slot);
    },

    /* ---- Skill tracks in workouts (plans/PLAN-skills-mobility-in-workouts.md)
       A track trained in workouts has a record in training.skills, addressed
       by the key "skill:<track>" wherever the slot rules take a slot name
       (recommendFor, decide, the card's Step / Repeat). It is never a slot:
       its exercises carry `skill`, no `slot`, so no slot's evidence, Progress
       card or step reads them (A1). */
    skillKey: function (key) { var m = /^skill:(.+)$/.exec(key || ""); return m ? m[1] : null; },
    /* The stored record behind a key: a slot's, or a live skill track's. */
    recordOf: function (key) {
      var s = App.getState(), sk = engine.skillKey(key);
      if (!sk) return s.training.slots[key];
      var r = (s.training.skills || {})[sk];
      return r && !r.off && r.exerciseId ? r : null;
    },
    /* The tracks you can train (Skills' tabs, minus Variations, which is a
       browsing list and not a ladder). */
    skillTracks: function () {
      var t = (App.skills && App.skills.tracks) || {};
      return Object.keys(t).filter(function (k) { return k !== "variations"; });
    },
    /* A track's family, read from its rungs' slots: push, pull or core. */
    skillFamily: function (track) {
      var t = (App.skills && App.skills.tracks || {})[track], EXS = TD().EXERCISES, fam = null;
      (t ? t.ids : []).some(function (id) { return (fam = SKILL_FAMILY[(EXS[id] || {}).slot] || null); });
      return fam;
    },
    /* Does the day train the track's family? The pairing rule (B2): derived
       from the slots the day trains, so every template, including ones added
       later, gets it without a list of day names. */
    skillRides: function (track, dayType, lengthName) {
      var fam = engine.skillFamily(track);
      if (!fam || !dayType || dayType === "mini") return false;
      return engine.slotsFor(dayType, lengthName || (App.getState().prefs || {}).sessionLength || "focused")
        .some(function (it) { return SKILL_FAMILY[it.slot] === fam; });
    },
    /* The first rung of a track your equipment, exclusions and joint limits
       allow, or null. */
    skillFirstAllowed: function (track) {
      var t = (App.skills && App.skills.tracks || {})[track], ctx = trainingCtx(App.getState());
      return (t ? t.ids : []).filter(function (id) { return TD().EXERCISES[id] && window.Training.allowed(ctx, id); })[0] || null;
    },
    /* Start a track at a rung (null: its first allowed one), change its rung,
       toggle `every`, or stop it (exerciseId false). The only writer of
       training.skills. Returns the record, or { error }. */
    setSkill: function (track, exerciseId, o) {
      o = o || {};
      var s = App.getState(), t = (App.skills && App.skills.tracks || {})[track];
      if (!t || engine.skillTracks().indexOf(track) < 0) return { error: "That isn't a skill track." };
      var map = s.training.skills || (s.training.skills = {}), cur = engine.recordOf("skill:" + track), at = lib.iso();
      if (exerciseId === false) { map[track] = { off: true, at: at }; App.saveState(); return map[track]; }
      if (exerciseId == null && cur && o.every != null) {
        cur.every = !!o.every; cur.at = at; App.saveState(); return cur;
      }
      var id = exerciseId || (cur && cur.exerciseId) || engine.skillFirstAllowed(track);
      if (!id) return { error: "Nothing on this track is open to you: check your equipment and joint limits." };
      if (t.ids.indexOf(id) < 0) return { error: "That movement isn't on the " + t.label + " track." };
      if (cur && cur.exerciseId === id && o.every == null) return cur;
      var rx = rxStart(id, { why: cur ? "chosen in Skills" : "started in Skills" });
      rx.acceptedAt = at; rx.at = at;
      rx.every = o.every != null ? !!o.every : !!(cur && cur.every);
      map[track] = rx;
      App.saveState();
      return rx;
    },
    /* Today's skill block: every live track that rides on the day (or is
       ticked Every session) and is allowed, each { track, rx, reason }.
       A track whose rung is also a main slot's exercise today is left out:
       one session logging one exercise twice would make its evidence
       ambiguous (Training.exposures reads the first). */
    skillsFor: function (dayType, lengthName, mainIds) {
      if (!dayType || dayType === "mini") return [];
      var ctx = trainingCtx(App.getState()), out = [];
      engine.skillTracks().forEach(function (track) {
        var rec = engine.recordOf("skill:" + track);
        if (!rec) return;
        var rides = engine.skillRides(track, dayType, lengthName);
        if (!rides && !rec.every) return;
        if (!window.Training.allowed(ctx, rec.exerciseId)) return;
        if ((mainIds || []).indexOf(rec.exerciseId) >= 0) return;
        var label = App.skills.tracks[track].label, std = rec.range && rec.range[1];
        out.push({ track: track, rx: JSON.parse(JSON.stringify(rec)),
          reason: label + (rides ? ", on days that train its " + engine.skillFamily(track) + " muscles" : ", ticked for every session") +
            (rec.unit === "sec" && std ? ". The " + std + " s standard is a product guess from this rung's guide." : ".") });
      });
      return out;
    },

    /* ---- The mobility block (plan B6): one Mobility-view routine in a
       session. The suggestion is a rule on the day's slots and today's
       skills, printed with its reason; you can pick another. */
    mobilitySuggest: function (dayType, lengthName, skillTracks) {
      var slots = engine.slotsFor(dayType, lengthName || (App.getState().prefs || {}).sessionLength || "focused")
        .map(function (it) { return it.slot; });
      var hands = (skillTracks || []).some(function (t) { return t === "planche" || t === "handstand"; });
      if (hands || slots.some(function (x) { return SKILL_FAMILY[x] === "push"; }))
        return { id: "wrist-prep", why: "Today loads your wrists (pushing or hand balancing), and wrists carry load they aren't used to." };
      if (slots.indexOf("squat") >= 0 || slots.indexOf("hinge") >= 0)
        return { id: "hip-rotation", why: "Leg day: hips that only hinge and squat lose their turn in and out." };
      return { id: "hip-shoulder", why: "Hips and shoulders are the two joints that gate most calisthenics skills." };
    },
    /* The session's routine, or null: off unless prefs.mobilityBlock is "on".
       `choice` is a routine id picked in the preview; anything else takes the
       suggestion. Needs Hub.mobility (js/views/mobility.js): without it there
       is no block, and the workout still begins. */
    mobilityFor: function (dayType, lengthName, skillTracks, choice) {
      var lib2 = window.Hub && Hub.mobility;
      if (!lib2 || !dayType || dayType === "mini" || (App.getState().prefs || {}).mobilityBlock !== "on") return null;
      var sug = engine.mobilitySuggest(dayType, lengthName, skillTracks);
      var id = choice && lib2.byId[choice] ? choice : sug.id, r = lib2.byId[id];
      if (!r) return null;
      return { routine: id, when: r.when === "before" ? "before" : "after", suggested: id === sug.id,
               why: id === sug.id ? sug.why : "Your choice for this session.",
               done: r.steps.map(function () { return false; }) };
    },

    /* The recovery block (plan D3) active on a day (default: the day you're
       logging to), or null. Working sets x 0.6 for 7 days; ranges and rest
       are untouched, nothing steps up, and its sessions are never evidence.
       It ends on its own — the first session after it is a normal one — or
       when you end it. */
    recoveryEnd: function (b) { return b.endedKey || lib.dayKey(lib.addDays(b.startKey, b.days)); },
    recoveryOn: function (dayKey) {
      var k = dayKey || Hub.viewDate();
      return (App.getState().recoveryBlocks || []).filter(function (b) {
        return b.startKey <= k && k < engine.recoveryEnd(b);
      })[0] || null;
    },
    startRecovery: function (reason) {
      var s = App.getState(), today = lib.today();
      if (engine.recoveryOn(today)) return null;
      var b = { id: "rb_" + Date.now(), startKey: today, startedISO: lib.iso(), days: TD().RECOVERY_BLOCK.days,
                reason: reason, endedKey: null, updatedAt: lib.iso() };
      s.recoveryBlocks.push(b);
      App.saveState();
      return b;
    },
    endRecovery: function () {
      var b = engine.recoveryOn(lib.today());
      if (!b) return null;
      b.endedKey = lib.today(); b.updatedAt = lib.iso();
      App.saveState();
      return b;
    },

    /* Why a block might help, or null (D3): a sharp pain flag in the last
       week, or two slots whose totals have been falling, with the latest
       evidence in the last week. Only what came after the previous block
       began counts, and an offer you declined stays declined until something
       new happens (its `key`). Returns { kind, key, flag | slots }. */
    recoveryOffer: function () {
      var s = App.getState(), R = TD().RECOVERY_BLOCK, today = lib.today();
      if (engine.recoveryOn(today)) return null;
      var last = (s.recoveryBlocks || []).slice().sort(function (a, b) { return a.startedISO < b.startedISO ? 1 : -1; })[0];
      var recent = function (day) { return lib.daysBetween(day, today) <= R.offerWindowDays; };
      var flag = (s.flagsHistory || []).filter(function (f) {
        return f.severity === "sharp" && recent(Hub.dayOf(f.dateISO)) && (!last || f.dateISO > last.startedISO);
      }).pop();
      var offer = flag ? { kind: "flag", key: "flag:" + flag.id, flag: flag } : null;
      if (!offer) {
        var down = Object.keys(s.training.slots).map(function (slot) {
          var rec = engine.recommendFor(slot), e = rec && rec.action === "reduce" && rec.evidence[rec.evidence.length - 1];
          return e && recent(e.day) && (!last || e.day > last.startKey) ? { slot: slot, day: e.day, totals: rec.evidence.map(function (x) { return x.total; }) } : null;
        }).filter(Boolean);
        if (down.length >= R.offerSlots) {
          offer = { kind: "reduce", slots: down, key: "reduce:" + down.map(function (d) { return d.slot + "@" + d.day; }).sort().join(",") };
        }
      }
      return offer && App.util.uiGet("rb.dismissed", "") !== offer.key ? offer : null;
    },

    /* Switch template (plan D1). The reporting period closes here and the
       next one runs the new template, so a period has one template and one
       denominator, and no planned-session ids or schedule revisions are ever
       stored. A template that names the row gets a row record if you have
       none, so the row it trains can step up; a row you left out stays out
       (Program's Add brings it back). Returns the closed period, or null when
       nothing changed. */
    setTemplate: function (id, weeklyDays) {
      var s = App.getState();
      if (!TEMPLATES[id]) return null;
      var days = WEEKLY_TEMPLATES[weeklyDays] === id ? Number(weeklyDays) : null;
      if (id === templateId(s)) {
        if (weeklyGoal(s) === days) return null;
        s.prefs.weeklyDays = days;
        App.saveState();
        return { weeklyOnly: true };
      }
      (s.prefs || (s.prefs = {})).template = id;
      s.prefs.weeklyDays = days;
      var names = TEMPLATES[id].order.some(function (d) { return DAY_PATTERNS[d].indexOf("row") >= 0; });
      if (names && !s.training.slots.row) {
        var first = firstAllowed("row", trainingCtx(s));
        if (first) s.training.slots.row = rxStart(first, { at: lib.iso(), why: "part of the " + TEMPLATES[id].label + " template" });
      }
      App.recountStreak(s);                     // the gap follows the template's pace (R3-1)
      return App.evaluation.closePeriod("template");
    },

    /* A goal change re-ranges every slot whose range the goal sets (D2): the
       same exercise and setup with the goal's range, stamped so a sync keeps
       it. Holds, skills and eccentrics come back unchanged and aren't
       touched, and neither is rest — GOAL_REST_SEC is for new profiles.
       Neither is a range you set yourself (plan C4): it survives a goal
       change. Doesn't save; Settings does. Returns the slots that changed. */
    setGoal: function (goal) {
      var s = App.getState(), changed = [], at = lib.iso();
      if (!TD().GOAL_RANGES[goal]) return changed;
      s.profile.goal = goal;
      Object.keys(s.training.slots).forEach(function (slot) {
        var rx = s.training.slots[slot], r = rx && !rx.off && rx.range && !(rx.custom && rx.custom.range) && TD().rangeFor(rx.exerciseId, goal);
        if (!r || (r.lo === rx.range[0] && r.hi === rx.range[1])) return;
        rx = JSON.parse(JSON.stringify(rx));
        rx.range = [r.lo, r.hi];
        rx.acceptedAt = at;
        s.training.slots[slot] = rx;
        changed.push(slot);
      });
      return changed;
    },

    /* --- Your control over the plan (plan C1–C4) ---
       Each call stamps what it writes, so a sync keeps the newer, and saves.
       A refusal writes nothing and returns { error } with the sentence to
       show inline, never a modal. */

    /* Choose and keep (C2): `id` becomes the slot's prescription, at the
       bottom of its range, until a step or another choice moves it. Any of
       the slot's exercises except a skill attempt — branches and loaded ones
       too, past the end of a path. o: { setup, loadKg }; a setup the
       exercise doesn't have falls back to its first, and without a load the
       first session's weight sets it, as before. Your grip, custom
       sets/range and hold carry over. Returns the new prescription. */
    chooseExercise: function (slot, id, o) {
      o = o || {};
      var s = App.getState(), e = TD().EXERCISES[id], from = s.training.slots[slot];
      var name = (DB.getExercise(id) || {}).name || id;
      if (!TD().SLOTS[slot] || !e || e.slot !== slot) return { error: "That movement isn't part of this slot." };
      if (e.kind === "skill") return { error: name + " is a skill attempt — it stays in Skills." };
      /* A grip the picker set wins over your standing one: it's what you'll do. */
      var grip = gripCapable(id) ? (o.setup && o.setup.grip) || standingGrip(s, slot) : null;
      var why = window.Training.blocked(trainingCtx(s), id, grip);
      if (why === "equipment") return { error: name + " needs " + missingGear(id, s.equipment) + ", which isn't in your equipment." };
      if (why === "excluded") return { error: name + " is on your excluded list — include it again first." };
      if (why) return { error: name + " loads your " + jointWord(why) + " heavily, which you asked to avoid — use Allow anyway on it first." };
      var kg = Number(o.loadKg);
      var rx = rxStart(id, { setup: o.setup, loadKg: e.loadMode && kg > 0 ? kg : null, grip: grip,
                             custom: from && !from.off ? from.custom : null, at: lib.iso(), why: "chosen by you" });
      if (from && from.hold) rx.hold = true;
      s.training.slots[slot] = rx;
      var lvl = ladderLevel(slot, id);
      if (lvl && s.tiers[slot]) s.tiers[slot].level = lvl;
      App.saveState();
      return rx;
    },

    /* Exclude an exercise, include it again, or let it past a joint limit
       (C3): training.exclusions[id] = { state, at, why }, state "excluded",
       "none" (included again) or "allowed" (Allow anyway). Never deleted: a
       deleted key comes back with the next sync. Excluding the exercise a
       slot trains leaves the slot alone — prescriptionFor gives the nearest
       easier movement you allow, which is what the picker preselects. */
    setExcluded: function (id, state, why) {
      var s = App.getState();
      if (!TD().EXERCISES[id]) return { error: "That movement isn't in the catalogue." };
      if (EXCLUSION_STATES.indexOf(state) < 0) return { error: "Exclude, include or allow — nothing else." };
      var rec = { state: state, at: lib.iso(), why: why || null };
      (s.training.exclusions || (s.training.exclusions = {}))[id] = rec;
      App.saveState();
      return rec;
    },

    /* Joint limitations (C3), the whole set at once: { wrist: "careful" |
       "avoid", … }; a joint left out (or "none") has no limit. Clearing all of
       them writes { at }, never null — null has no stamp and loses a sync.
       Avoid removes what loads a joint heavily (training.js blocked);
       careful only warns and ranks lower (carefulFor). A filter by exercise,
       not an assessment of an injury. */
    setLimitations: function (map) {
      var s = App.getState(), out = {};
      var bad = Object.keys(map || {}).filter(function (j) {
        return TD().JOINTS.indexOf(j) < 0 || (map[j] && map[j] !== "none" && LIMIT_LEVELS.indexOf(map[j]) < 0);
      });
      if (bad.length) return { error: "Unknown joint or limit: " + bad.join(", ") + "." };
      Object.keys(map || {}).forEach(function (j) { if (LIMIT_LEVELS.indexOf(map[j]) >= 0) out[j] = map[j]; });
      out.at = lib.iso();
      s.training.limitations = out;
      App.saveState();
      return out;
    },

    /* Your standing grip for a slot (C1): training.grip = { push: "knuckles",
       at }, kept for every slot in one record. Palms is written, not
       cleared. When the slot's exercise takes a grip, its prescription moves
       onto it, stamped: knuckles sessions count for palms, so going to
       palms keeps your evidence; going to knuckles starts it again. */
    setGrip: function (slot, grip) {
      var s = App.getState(), at = lib.iso();
      if (!TD().GRIPS.values.some(function (v) { return v.id === grip; })) return { error: "Palms or knuckles." };
      if (!TD().GRIPS.exercises.some(function (id) { return TD().EXERCISES[id].slot === slot; }))
        return { error: "This slot's movements don't take a grip." };
      var old = s.training.grip || {}, rec = {};
      Object.keys(old).forEach(function (k) { if (k !== "at") rec[k] = old[k]; });
      rec[slot] = grip; rec.at = at;
      s.training.grip = rec;
      var rx = s.training.slots[slot];
      if (rx && !rx.off && gripCapable(rx.exerciseId) && gripOf(rx) !== (grip === "palms" ? null : grip)) {
        rx = withGrip(rx, grip);
        rx.acceptedAt = at;
        s.training.slots[slot] = rx;
      }
      App.saveState();
      return rec;
    },

    /* Hold (C4): step-ups pause on the slot; step-back offers still show
       (training.js). Stamped on the slot's record like any slot edit, and
       kept through a step back or a new choice. Returns the prescription. */
    setHold: function (slot, on) {
      var s = App.getState(), rx = s.training.slots[slot];
      if (!rx || rx.off) return { error: "There's no movement on this slot to hold." };
      if (!!rx.hold === !!on) return rx;
      rx = JSON.parse(JSON.stringify(rx));
      if (on) rx.hold = true; else delete rx.hold;
      rx.acceptedAt = lib.iso();
      s.training.slots[slot] = rx;
      App.saveState();
      return rx;
    },

    /* Custom sets and range (C4): { sets, range: [lo, hi] }, either part
       optional; null goes back to the goal's. Out of bounds is refused with
       training.js customError's sentence. Changing sets starts fresh
       evidence (a different set count never compares); a new range judges
       the same sessions against the new top. Kept through steps, choices
       and goal changes. Returns the prescription. */
    setCustom: function (slot, custom) {
      var s = App.getState(), rx = s.training.slots[slot];
      if (!rx || rx.off) return { error: "There's no movement on this slot to set." };
      if (!rx.range || rx.range[1] == null) return { error: "This movement names no number to set a range against." };
      var c = {};
      if (custom && custom.sets != null && custom.sets !== "") c.sets = Number(custom.sets);
      if (custom && custom.range) c.range = [Number(custom.range[0]), Number(custom.range[1])];
      var err = window.Training.customError(c, rx.unit);
      if (err) return { error: err };
      var r = TD().rangeFor(rx.exerciseId, (s.profile || {}).goal || "both");
      rx = JSON.parse(JSON.stringify(rx));
      rx.sets = c.sets != null ? c.sets : r.sets;
      rx.range = c.range ? c.range : [r.lo, r.hi];
      if (Object.keys(c).length) { c.unit = rx.unit; rx.custom = c; } else delete rx.custom;
      rx.acceptedAt = lib.iso();
      s.training.slots[slot] = rx;
      App.saveState();
      return rx;
    },

    /* Pins (plan D3): a coverage slot goes first in the finisher and a
       mini-session on these weekdays (0 = Sunday), whatever its shortfall,
       though never past your equipment, exclusions or limits.
       training.pins[slot] = { days, at }; no days is no pin, written as a
       stamped record rather than deleted, so a sync carries the clear.
       Returns the record. */
    setPins: function (slot, days) {
      var s = App.getState(), def = TD().SLOTS[slot];
      if (!def || !def.coverage) return { error: "Only coverage slots take pins." };
      var list = (days || []).map(Number);
      if (list.some(function (d) { return !(d >= 0 && d <= 6 && d === Math.floor(d)); }))
        return { error: "Days run from 0 (Sunday) to 6 (Saturday)." };
      var rec = { days: list.filter(function (d, i) { return list.indexOf(d) === i; }).sort(function (a, b) { return a - b; }),
                  at: lib.iso() };
      (s.training.pins || (s.training.pins = {}))[slot] = rec;
      App.saveState();
      return rec;
    },

    _checkPR: function (s, ex, dateISO) {
      var best = 0, kind = ex.mode === "hold" ? "hold" : "reps";
      ex.sets.forEach(function (st) { best = Math.max(best, Number(st.value) || 0); });
      if (best <= 0) return null;
      var existing = s.prs.filter(function (p) { return p.exerciseId === ex.id && p.kind === kind; })[0];
      if (existing) {
        if (best > existing.value) { existing.value = best; existing.dateISO = dateISO; return mkPR(ex, kind, best, dateISO, true); }
        return null;
      }
      var rec = { id: "pr_" + Date.now() + "_" + ex.id, exerciseId: ex.id, exercise: ex.name, kind: kind, value: best, dateISO: dateISO };
      s.prs.push(rec);
      return mkPR(ex, kind, best, dateISO, false);
    },

    /* benchmark editing + Era-I -> Era-II graduation */
    setBenchmark: function (key, current) {
      var s = App.getState();
      var b = s.benchmarks[key]; if (!b) return;
      b.current = Math.max(0, Number(current) || 0);
      b.complete = b.current >= b.target;
      App.saveState();
      return engine.checkGraduation();
    },
    checkGraduation: function () {
      var s = App.getState();
      if (s.era === 2) return false;
      var keys = Object.keys(s.benchmarks);
      var all = keys.every(function (k) { return s.benchmarks[k].complete; });
      if (all) { s.era = 2; App.saveState(); return true; }
      return false;
    },

    /* nutrition: one entry per calendar day */
    todayNutrition: function () {
      var s = App.getState(); var k = lib.today();
      var e = s.nutritionLog.filter(function (n) { return Hub.dayOf(n.dateISO) === k; })[0];
      if (!e) { e = { dateISO: lib.iso(), meals: [], waterL: 0 }; s.nutritionLog.push(e); }
      return e;
    },
    nutritionTotals: function (entry) {
      var m = entry && entry.meals || [];
      return {
        kcal: lib.sum(m, function (x) { return x.kcal; }),
        protein: lib.sum(m, function (x) { return x.protein; }),
        carbs: lib.sum(m, function (x) { return x.carbs; }),
        fat: lib.sum(m, function (x) { return x.fat; }),
        waterL: entry ? (Number(entry.waterL) || 0) : 0
      };
    },

    /* Nutrition compliance 0..1 over a date range.
       Per logged day: 70% how close kcal is to surplus target, 30% protein target.
       Days with no food logged are skipped (so it reflects logging quality, not gaps). */
    nutritionCompliance: function (sinceKey) {
      var s = App.getState();
      var kt = (function () {
        var m = s.profile.macros || {};
        var fm = (Number(m.protein) || 0) * 4 + (Number(m.carbs) || 0) * 4 + (Number(m.fat) || 0) * 9;
        return Math.round(Number(s.profile.surplusTarget) || fm || 2500);
      })();
      var pTarget = Number((s.profile.macros || {}).protein) || 0;
      var days = 0, sum = 0;
      (s.nutritionLog || []).forEach(function (n) {
        if (sinceKey && Hub.dayOf(n.dateISO) < sinceKey) return;
        var t = engine.nutritionTotals(n);
        if (t.kcal <= 0) return;
        var kc = lib.clamp(1 - Math.abs(t.kcal - kt) / kt, 0, 1);
        var pc = pTarget ? lib.clamp(t.protein / pTarget, 0, 1) : 0.5;
        sum += kc * 0.7 + pc * 0.3; days++;
      });
      return { score: days ? sum / days : null, loggedDays: days };
    },

    /* Planned sessions so far in a period, from the template the period ran
       under (phase.template; a phase from before templates ran the rotation).
       28 days of Full body ×3 plan 12, so following it exactly reads 100%. */
    expectedSessions: function (phase, loggedCount) {
      var dur = Math.min(App.util.phaseDayInfo(phase).day, phase.lengthDays);
      var perWeek = (TEMPLATES[phase.template] || TEMPLATES.rotation).perWeek;
      var calc = Math.max(1, Math.ceil(dur * perWeek / 7));
      /* Never show x/y where x > y — if the phase just started, scale expected
         up to at least what's been logged so completion never exceeds 100%. */
      return loggedCount ? Math.max(calc, loggedCount) : calc;
    }
  };

  function newSets(n, kg) { var a = []; for (var i = 0; i < n; i++) a.push({ value: null, weight: kg != null ? kg : null, done: false }); return a; }
  function TD() { return window.TRAINING_DATA; }
  /* Which family a skill rides with, by the slots of its rungs (plan B2):
     a day that trains any slot of the family carries the skill. A product
     rule, not an exercise-science claim: Skills says so. */
  var SKILL_FAMILY = { push: "push", shoulder: "push", dip: "push", row: "pull", pull: "pull", core: "core" };
  /* Seconds per attempt in the preview's time estimate when a skill names no
     standard, or counts reps (a muscle-up). A guess, used only for minutes. */
  var SKILL_EST_SEC = 20;
  /* A timed record is continuous movement (jump rope), not a still position.
     Every rule treats it as a hold; only the words differ, so a rope set never
     reads "hold" (plan 1.3). */
  function isTimed(id) { return !!(TD().EXERCISES[id] || {}).timed; }

  /* A fresh prescription in the range your goal sets (plan D2). Every new
     prescription in the running app goes through here, so no call site can
     forget the goal. `goal` overrides the saved one: onboarding's draft and
     the migration have their own. */
  function rxStart(id, o, goal) {
    var opt = {}, src = o || {};
    Object.keys(src).forEach(function (k) { opt[k] = src[k]; });
    opt.goal = goal || (App.getState().profile || {}).goal || "both";
    return window.Training.startOf(id, opt);
  }

  /* The saved copy of a prescription. A loaded movement saves the weight you
     logged, when every logged set used the same one, whatever was
     prescribed: prescribed 10 kg and lifted at 5 kg is a 5 kg session (F1).
     Mixed weights save the load as unknown, so a 10 kg session and a 20 kg
     one never compare as the same setup. With nothing logged, the
     prescription is saved as it was. */
  function rxAsLogged(ex, sets) {
    var rx = JSON.parse(JSON.stringify(ex.rx));
    if (rx.setup && rx.setup.loadMode) {
      var kgs = sets.filter(function (st) { return st.reps > 0; }).map(function (st) { return st.weight; });
      if (kgs.length) {
        rx.setup.loadKg = kgs[0] > 0 && kgs.every(function (k) { return k === kgs[0]; }) ? kgs[0] : null;
      }
    }
    return rx;
  }

  /* What Training's rules read from a save (training.js, SHAPES), built in
     one place so a prescription, a recommendation and a swap list can't
     disagree about what you own, exclude or avoid. */
  function trainingCtx(s) {
    var tr = s.training || {};
    return { equipment: s.equipment, decisions: tr.decisions || {}, goal: (s.profile || {}).goal || "both",
             exclusions: tr.exclusions || {}, limitations: tr.limitations || null, grip: tr.grip || null,
             loads: s.equipmentLoads || {} };
  }
  function gripCapable(id) { return TD().GRIPS.exercises.indexOf(id) >= 0; }
  /* An rx's grip, null for palms: the one the joint filter reads for it. */
  function gripOf(rx) { return (rx && rx.setup && rx.setup.grip) || null; }
  /* Your standing grip for a slot ("palms" | "knuckles"), or null. */
  function standingGrip(s, slot) { var g = s.training && s.training.grip; return (g && g[slot]) || null; }
  /* A copy of rx on `grip`, on a push-up that takes one; any other rx as is. */
  function withGrip(rx, grip) {
    if (!grip || !gripCapable(rx.exerciseId)) return rx;
    var r = JSON.parse(JSON.stringify(rx));
    r.setup = r.setup || {};
    if (grip === "palms") delete r.setup.grip; else r.setup.grip = grip;
    return r;
  }
  /* A slot's first entry point that's allowed for you (owned, not excluded,
     not avoided), or undefined. */
  function firstAllowed(slot, ctx) {
    return (TD().SLOTS[slot].first || []).filter(function (x) { return window.Training.allowed(ctx, x); })[0];
  }
  /* The joint names a limitation uses, as a sentence says them. */
  function jointWord(j) { return j === "lowerBack" ? "lower back" : j; }
  /* The stress that "careful" warns at: the same heavy load "avoid" removes.
     A product choice, like the rubric it reads. */
  var CAREFUL_AT = 2;
  /* What the control calls accept (engine.setExcluded, setLimitations). */
  var EXCLUSION_STATES = ["excluded", "none", "allowed"];
  var LIMIT_LEVELS = ["careful", "avoid"];
  /* Joints you marked careful that an exercise loads heavily, at a grip:
     the swap lists' warning and their lower rank. Avoid is Training.blocked's.
     Allow anyway silences both. */
  function carefulFor(ctx, id, grip) {
    var L = ctx.limitations || {}, x = (ctx.exclusions || {})[id];
    if (x && x.state === "allowed") return [];
    var st = window.Training.stress(id, gripCapable(id) ? grip : null);
    return TD().JOINTS.filter(function (j) { return L[j] === "careful" && st[j] >= CAREFUL_AT; });
  }

  /* The nearest easier movement you're allowed, walking back from an
     exercise you can't do through every exercise whose `next` or `offer`
     names it (so Archer → Decline), within its slot, at its hardest setup:
     one step below where you were. Your grip, custom sets/range and the
     rest carry, as a step's do. Skill attempts are never a slot's exercise.
     null when nothing before it is possible. */
  function nearestAllowed(rx, ctx) {
    var EXS = TD().EXERCISES, slot = EXS[rx.exerciseId].slot, seen = {}, queue = [rx.exerciseId];
    var grip = gripOf(rx);
    seen[rx.exerciseId] = true;
    while (queue.length) {
      var cur = queue.shift();
      var preds = Object.keys(EXS).filter(function (p) {
        return !seen[p] && EXS[p].slot === slot && (EXS[p].next.indexOf(cur) >= 0 || EXS[p].offer.indexOf(cur) >= 0);
      });
      for (var i = 0; i < preds.length; i++) {
        seen[preds[i]] = true;
        if (EXS[preds[i]].kind !== "skill" && window.Training.allowed(ctx, preds[i], gripCapable(preds[i]) ? grip : null)) {
          var S = TD().SETUPS[preds[i]], hard = {};
          if (S) hard[S.key] = S.values[S.values.length - 1].id;
          return rxStart(preds[i], { setup: hard, grip: grip, custom: rx.custom });
        }
        queue.push(preds[i]);
      }
    }
    return null;
  }

  /* Why a slot's own exercise isn't the one prescribed, in a sentence. */
  function blockedNote(id, why, eq) {
    var name = (DB.getExercise(id) || {}).name || id;
    if (why === "equipment") return name + " needs " + missingGear(id, eq) +
      ", which isn't in your equipment — this is the closest movement you can do without it.";
    if (why === "excluded") return name + " is on your excluded list — this is the closest easier movement you allow.";
    return name + " loads your " + jointWord(why) + " heavily, which you asked to avoid — this is the closest easier " +
      "movement that doesn't. A filter by exercise, not a check of your " + jointWord(why) + ".";
  }

  /* "a bench", "a pull-up bar and rings", "dumbbells or kettlebells" */
  function missingGear(id, eq) {
    var label = function (t) { return EQUIP_LABEL[t] || t; };
    var miss = (TD().EXERCISES[id].equipment || []).filter(function (t) {
      return Array.isArray(t) ? !t.some(function (u) { return eq[u]; }) : !eq[t];
    }).map(function (t) { return Array.isArray(t) ? t.map(label).join(" or ") : label(t); });
    return miss.join(" and ") || "equipment";
  }

  /* What a preview or swap badge says you lack, or "" when you own it. Read
     through Training.owns, so an any-of list ("dumbbells or kettlebells")
     reads as any-of: EXERCISE_DB's flat list can't say that (F6). An id
     outside the catalogue (an old draft) falls back to the DB list, all-of. */
  function gearMissing(id, eq) {
    if (TD().EXERCISES[id]) return window.Training.owns(eq, id) ? "" : missingGear(id, eq);
    return ((DB.getExercise(id) || {}).equipment || []).filter(function (t) { return !eq[t]; })
      .map(function (t) { return EQUIP_LABEL[t] || t; }).join(" and ");
  }

  /* The old ladder's level for an exercise: `<pattern>_<n>` is level n; an
     unnumbered main-path movement (Incline Push-up, Split Squat) takes the
     level of the numbered one before it. null off the ladder. Levels are
     history now; they keep the Progress ladder and phase snapshots honest. */
  function ladderLevel(slot, id) {
    var EXS = TD().EXERCISES, seen = {};
    while (id && !seen[id]) {
      seen[id] = true;
      var m = new RegExp("^" + slot + "_(\\d)$").exec(id);
      if (m) return Number(m[1]);
      id = Object.keys(EXS).filter(function (p) { return EXS[p].slot === slot && EXS[p].next.indexOf(id) >= 0; })[0];
    }
    return null;
  }
  function restRepPref(s) { return (s && s.prefs && s.prefs.restDefaultSec) || 90; }
  function restHoldPref(s) { return (s && s.prefs && s.prefs.restHoldSec) || 60; }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function mkPR(ex, kind, value, dateISO, beat) { return { exerciseId: ex.id, exercise: ex.name, kind: kind, value: value, dateISO: dateISO, improved: beat }; }

  /* expose */
  App.lib = lib;
  App.engine = engine;

  /* ======================================================================
     C. ONBOARDING — 5-step fitness test & Era placement
     ==================================================================== */
  var onb = {
    step: 0,
    draft: null
  };
  /* What each goal changes (plan D2), said on the card that sets it. */
  var GOALS = [
    { id: "strength", t: "Strength", d: "4–8 reps where a harder setup or load exists, else 6–12 · 150 s rest" },
    { id: "size", t: "Size", d: "8–15 reps · 120 s rest" },
    { id: "both", t: "Both", d: "6–12 reps · 120 s rest — the default" }
  ];
  var EQUIP = [
    { id: "pullupBar", t: "Pull-up bar" }, { id: "dumbbells", t: "Dumbbells" },
    { id: "bench", t: "Bench" }, { id: "kettlebells", t: "Kettlebells" },
    { id: "rings", t: "Rings" }, { id: "bands", t: "Resistance bands" },
    { id: "parallettes", t: "Parallettes" }, { id: "dipBars", t: "Dip bars" },
    { id: "lowBar", t: "A waist-height bar" }, { id: "vest", t: "A weighted vest" },
    { id: "abWheel", t: "An ab wheel" }, { id: "jumpRope", t: "A jump rope" },
    { id: "box", t: "A sturdy box or step" }, { id: "barbell", t: "A barbell and a squat rack" },
    { id: "nordicAnchor", t: "An ankle anchor for Nordic curls" }, { id: "nothing", t: "Just the floor" }
  ];

  function startDraft() {
    var s = App.getState();
    onb.draft = {
      profile: JSON.parse(JSON.stringify(s.profile)),
      equipment: JSON.parse(JSON.stringify(s.equipment)),
      benchmarks: JSON.parse(JSON.stringify(s.benchmarks)),
      /* Preselected, visibly, on the goal step: three full-body sessions a
         week is the plan most people can keep. Any card changes it. */
      template: "fullbody3",
      weeklyDays: 3
    };
  }

  function renderOnboarding() {
    if (!onb.draft) startDraft();
    var host = document.getElementById("onboarding");
    var steps = [stepWelcome, stepProfile, stepGoal, stepEquip, stepAssess, stepPlacement];
    var total = steps.length;
    var dots = "";
    for (var i = 0; i < total; i++) {
      dots += '<span class="onb-dot ' + (i === onb.step ? "is-active" : (i < onb.step ? "is-done" : "")) + '"></span>';
    }
    host.innerHTML =
      '<div class="onb-wrap"><div class="onb-card stack">' +
        '<div class="row between"><div class="brand">' +
          '<div class="brand__mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5z"/><path d="M12 2.5V21.5M3.5 7l8.5 5 8.5-5"/></svg></div><div><div class="brand__name">BASALT</div>' +
          '<div class="brand__tag">Setup</div></div></div>' +
          '<span class="badge badge--primary"><span class="dot"></span>Step ' + (onb.step + 1) + ' / ' + total + '</span>' +
        '</div>' +
        '<div class="card card--accent card--pad-lg stack" id="onb-body">' + steps[onb.step]() + '</div>' +
        '<div class="onb-dots">' + dots + '</div>' +
      '</div></div>';
    wireOnbStep();
  }

  function stepWelcome() {
    /* No stat tiles here on purpose — this screen runs before "About you"
       has asked you anything, so there is nothing real to show yet. It used
       to show a fake 186cm/58kg/2800kcal "you" here, which read as already
       knowing your stats before you'd typed a single number. */
    return '<div><div class="eyebrow">First launch</div>' +
      '<h1 class="display h1">Build the<br>frame.</h1></div>' +
      '<p class="muted">BASALT is an adaptive, bodyweight-first training OS. You start in ' +
      '<b style="color:var(--era1)">Era I — Calisthenics Foundation</b>: pure bodyweight work to forge tendons, ' +
      'control and clean reps. Loaded work with dumbbells or kettlebells is there from day one if you own them.</p>' +
      '<button class="btn btn--primary btn--lg btn--block" data-onb="next">Begin setup →</button>';
  }

  function stepProfile() {
    var p = onb.draft.profile;
    var v = function (x) { return x == null ? "" : x; };   // null -> blank input, never the literal text "null"
    return '<div><div class="eyebrow">About you</div><h2 class="display h3">The basics</h2></div>' +
      '<div class="grid grid-2">' +
        field("Name", '<input class="input" data-bind="name" value="' + esc(v(p.name)) + '">') +
        field("Age", '<input class="input" type="number" data-bind="age" value="' + v(p.age) + '" placeholder="years">') +
        field("Height (cm)", '<input class="input" type="number" data-bind="heightCm" value="' + v(p.heightCm) + '" placeholder="cm">') +
        field("Weight (kg)", '<input class="input" type="number" data-bind="weightKg" value="' + v(p.weightKg) + '" placeholder="kg">') +
      '</div>' +
      field("Biological sex", '<select class="select" data-bind="sex">' +
        opt("male", "Male", p.sex) + opt("female", "Female", p.sex) + '</select>') +
      '<div class="row" style="gap:var(--sp-3)">' +
        '<button class="btn btn--ghost" data-onb="back">Back</button>' +
        '<button class="btn btn--primary grow" data-onb="next">Continue →</button>' +
      '</div>';
  }

  function stepGoal() {
    var g = onb.draft.profile.goal;
    var cards = GOALS.map(function (o) {
      return '<div class="choice ' + (g === o.id ? "is-sel" : "") + '" data-goal="' + o.id + '">' +
        '<div><div class="choice__t">' + o.t + '</div><div class="choice__d">' + o.d + '</div></div>' +
        '<svg class="choice__tick ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>' +
      '</div>';
    }).join("");
    var E = App.engine, tpl = onb.draft.template;
    var tcards = E.TEMPLATE_ORDER.map(function (id) {
      var o = E.TEMPLATES[id];
      return '<div class="choice ' + (tpl === id ? "is-sel" : "") + '" data-template="' + id + '">' +
        '<div><div class="choice__t">' + o.label + '</div>' +
        '<div class="choice__d">' + o.short + ' — ' + o.desc + '</div></div>' +
        '<svg class="choice__tick ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>' +
      '</div>';
    }).join("");
    return '<div><div class="eyebrow">Objective</div><h2 class="display h3">What are you chasing?</h2></div>' +
      '<div class="stack">' + cards + '</div>' +
      '<p class="faint text-xs">Your goal sets your rep ranges and the rest timer after rep sets. Bodyweight (gain, hold or lose) is a separate, optional setting.</p>' +
      '<div><h2 class="display h3">How do you want to train?</h2></div>' +
      '<div class="field"><span class="field__label">Strength days per week</span>' +
        frequencyChoicesHtml(onb.draft.weeklyDays, "data-onb-days") + '</div>' +
      restGuidanceHtml(E.TEMPLATES[tpl], onb.draft.weeklyDays) +
      '<div class="stack" id="onb-templates">' + tcards + '</div>' +
      '<p class="faint text-xs">Or choose a flexible template above. A weekly choice sets your strength-day target; specific weekdays remain flexible. Change it later in Program.</p>' +
      '<div class="row" style="gap:var(--sp-3)">' +
        '<button class="btn btn--ghost" data-onb="back">Back</button>' +
        '<button class="btn btn--primary grow" data-onb="next">Continue →</button>' +
      '</div>';
  }

  function stepEquip() {
    var eq = onb.draft.equipment;
    var cards = EQUIP.map(function (o) {
      return '<label class="choice ' + (eq[o.id] ? "is-sel" : "") + '" data-equip="' + o.id + '">' +
        '<div class="choice__t">' + o.t + '</div>' +
        '<svg class="choice__tick ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>' +
      '</label>';
    }).join("");
    return '<div><div class="eyebrow">Inventory</div><h2 class="display h3">What do you have?</h2></div>' +
      '<p class="muted text-sm">Your program only prescribes movements this gear allows. Without a pull-up bar, rows carry your pulling.</p>' +
      '<div class="grid grid-2">' + cards + '</div>' +
      '<div class="row" style="gap:var(--sp-3)">' +
        '<button class="btn btn--ghost" data-onb="back">Back</button>' +
        '<button class="btn btn--primary grow" data-onb="next">Continue →</button>' +
      '</div>';
  }

  /* ---- Assessment (plan C4) ----
     Per slot: "the hardest of these you can do for 6 clean reps (or the
     hold) without pain", from that slot's main path for the equipment you
     own, plus "Not sure". The answer becomes the starting prescription at the
     bottom of its range. It is unverified — nobody watched you do it — until
     the first comparable session; the Workout card says so. The Era I
     benchmarks place nothing now: they stay as achievements in Program. */
  var ASSESS_SLOTS = ["push", "row", "pull", "squat", "hinge", "core", "shoulder", "dip"];

  /* A slot's main path you can do, easiest first: from its entry points
     along `next`, stopping at the first movement your equipment can't
     cover. Loaded movements and optional branches are never offered, and
     nor is one you excluded or whose joint you avoid (plan C3) — a fresh
     profile has neither, so that's the equipment alone. */
  function assessCtx(d) {
    var tr = App.getState().training || {};
    return { equipment: d.equipment, exclusions: tr.exclusions || {}, limitations: tr.limitations || null };
  }
  function assessPath(slot, ctx) {
    var EXS = TD().EXERCISES, out = [], queue = TD().SLOTS[slot].first.slice();
    while (queue.length) {
      var id = queue.shift(), e = EXS[id];
      if (out.indexOf(id) >= 0 || e.slot !== slot || e.branch !== "main" || e.loadMode ||
          !window.Training.allowed(ctx, id)) continue;
      out.push(id);
      queue = queue.concat(e.next);
    }
    return out;
  }

  /* What "6 clean reps (or the hold)" means for one movement: the bottom of
     its range. */
  function assessBar(id) {
    var r = TD().rangeFor(id);
    return r.unit === "sec" ? (r.timed ? "for " + r.lo + " s" : r.lo + " s hold") : r.lo + " clean reps" + (r.perSide ? " per side" : "");
  }

  function stepAssess() {
    var ctx = assessCtx(onb.draft), a = onb.draft.assess || (onb.draft.assess = {});
    var rows = ASSESS_SLOTS.map(function (slot) {
      var label = TD().SLOTS[slot].label, path = assessPath(slot, ctx);
      if (!path.length) {
        return '<div class="card" style="padding:var(--sp-3) var(--sp-4)"><div class="drow__title">' + label + '</div>' +
          '<div class="drow__sub">' + esc(TD().SLOTS[slot].none || "Nothing on this slot fits your equipment.") + '</div></div>';
      }
      var cur = a[slot] || "";
      var opts = opt("", "Not sure", cur) +
        path.map(function (id) { return opt(id, DB.getExercise(id).name + " · " + assessBar(id), cur); }).join("") +
        (TD().SLOTS[slot].optional ? opt("off", "Leave " + label.toLowerCase() + "s out", cur) : "");
      return field(label, '<select class="select" data-assess="' + slot + '">' + opts + '</select>');
    }).join("");
    return '<div><div class="eyebrow">Assessment</div><h2 class="display h3">What can you do today?</h2></div>' +
      '<p class="muted text-sm">For each one, pick the hardest you can do for the reps or hold shown, with clean form and no pain. ' +
        'Not sure starts you at the easiest. Every answer is unverified until you log it — the app can\'t see your form, so it takes your word and checks it against your first session.</p>' +
      '<div class="stack">' + rows + '</div>' +
      '<div class="row" style="gap:var(--sp-3)">' +
        '<button class="btn btn--ghost" data-onb="back">Back</button>' +
        '<button class="btn btn--primary grow" data-onb="next">See my program →</button>' +
      '</div>';
  }

  /* The starting prescription per slot from the answers. A slot with no
     answer starts at its first movement; dips can be left out, as a stamped
     record so a sync can't bring the slot back. Pull without a bar still
     gets its first rung, so a bar bought later has somewhere to start; the
     builder swaps it for the row until then. */
  function assessedSlots(d, at) {
    var ctx = assessCtx(d), a = d.assess || {}, out = {};
    ASSESS_SLOTS.forEach(function (slot) {
      var path = assessPath(slot, ctx), pick = a[slot];
      if (pick === "off") { out[slot] = { off: true, acceptedAt: at, why: "left out at setup" }; return; }
      var id = path.indexOf(pick) >= 0 ? pick : (path[0] || TD().SLOTS[slot].first[0]);
      var why = path.indexOf(pick) >= 0 ? "your assessment — unverified until you log it"
              : path.length ? "not sure at setup — the first movement" : "needs equipment you didn't have at setup";
      out[slot] = rxStart(id, { why: why, at: at }, d.profile.goal);
    });
    return out;
  }

  function stepPlacement() {
    var slots = assessedSlots(onb.draft, null);
    var rows = ASSESS_SLOTS.map(function (slot) {
      var rx = slots[slot], label = TD().SLOTS[slot].label;
      var owned = rx && !rx.off && window.Training.allowed(assessCtx(onb.draft), rx.exerciseId);
      var body = !rx || rx.off ? "Left out" : !owned ? esc(TD().SLOTS[slot].none || "Needs equipment you don't have") :
        esc(DB.getExercise(rx.exerciseId).name) + ' <span class="faint mono">' + rx.sets + ' × ' + rx.range[0] + '–' + rx.range[1] +
        (rx.unit === "sec" ? " s" : "") + '</span>';
      return '<div class="card" style="padding:var(--sp-3) var(--sp-4)">' +
        '<div class="row between"><div><div class="drow__title">' + label + '</div>' +
        '<div class="drow__sub">' + body + '</div></div></div></div>';
    }).join("");
    return '<div><div class="eyebrow">Your program</div><h2 class="display h3">Where you start</h2></div>' +
      '<p class="muted text-sm">Each movement starts at the bottom of its range. It steps up when two sessions on different days reach the top of the range and felt easy or just right — and you say yes.</p>' +
      '<div class="stack">' + rows + '</div>' +
      '<div class="row" style="gap:var(--sp-3)">' +
        '<button class="btn btn--ghost" data-onb="back">Back</button>' +
        '<button class="btn btn--primary grow" data-onb="finish">Enter the OS →</button>' +
      '</div>';
  }

  function wireOnbStep() {
    var body = document.getElementById("onb-body");
    if (!body) return;

    body.querySelectorAll("[data-onb]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        captureStep();
        var a = btn.dataset.onb;
        if (a === "next") { onb.step = Math.min(onb.step + 1, 5); renderOnboarding(); }
        else if (a === "back") { onb.step = Math.max(onb.step - 1, 0); renderOnboarding(); }
        else if (a === "finish") { finishOnboarding(); }
      });
    });
    body.querySelectorAll("[data-goal]").forEach(function (c) {
      c.addEventListener("click", function () { onb.draft.profile.goal = c.dataset.goal; renderOnboarding(); });
    });
    body.querySelectorAll("[data-template]").forEach(function (c) {
      c.addEventListener("click", function () { onb.draft.template = c.dataset.template; onb.draft.weeklyDays = null; renderOnboarding(); });
    });
    body.querySelectorAll("[data-onb-days]").forEach(function (c) {
      c.addEventListener("click", function () {
        onb.draft.weeklyDays = Number(c.dataset.onbDays);
        onb.draft.template = WEEKLY_TEMPLATES[onb.draft.weeklyDays];
        renderOnboarding();
      });
    });
    body.querySelectorAll("[data-equip]").forEach(function (c) {
      c.addEventListener("click", function (e) {
        e.preventDefault();
        var id = c.dataset.equip; onb.draft.equipment[id] = !onb.draft.equipment[id];
        renderOnboarding();
      });
    });
    body.querySelectorAll("[data-assess]").forEach(function (sel) {
      sel.addEventListener("change", function () { onb.draft.assess[sel.dataset.assess] = sel.value; });
    });
  }

  function captureStep() {
    var body = document.getElementById("onb-body"); if (!body) return;
    body.querySelectorAll("[data-bind]").forEach(function (inp) {
      var key = inp.dataset.bind;
      var v = inp.value;
      /* Blank stays null, not 0 — an unanswered height field must not turn
         into a real, wrong measurement of zero. */
      if (inp.type === "number") v = v === "" ? null : Number(v);
      onb.draft.profile[key] = v;
    });
  }

  function finishOnboarding() {
    captureStep();
    var d = onb.draft;
    /* recompute simple BMI + targets from entered stats */
    var hM = (Number(d.profile.heightCm) || 0) / 100;
    if (hM > 0) d.profile.bmi = lib.round((Number(d.profile.weightKg) || 0) / (hM * hM), 1);

    /* The assessment writes the prescriptions. Tier levels follow them as
       history — the Progress ladder and phase snapshots still read levels. */
    var at = lib.iso();
    var slots = assessedSlots(d, at);
    var tiers = JSON.parse(JSON.stringify(App.getState().tiers));
    Object.keys(tiers).forEach(function (p) {
      var rx = slots[p], lvl = rx && !rx.off ? ladderLevel(p, rx.exerciseId) : null;
      if (!lvl) return;
      tiers[p].level = lvl; tiers[p].progress = 0;
      /* A level above 1 starts its target the way a level-up did, so the L1
         plank's 30 s can't leak into reps (A5). */
      var mv = DB.byLevel(p, lvl);
      if (lvl > 1) tiers[p].repsTarget = (mv && mv.mode === "hold") ? holdStart(mv.id) : BASE_REPS[p];
    });

    /* The template and the goal's rest go in with the profile: the first
       period runs the template you chose, and a new profile's rest follows
       its goal (GOAL_REST_SEC). */
    var template = App.engine.TEMPLATES[d.template] ? d.template : "rotation";
    var patch = { profile: d.profile, equipment: d.equipment, benchmarks: d.benchmarks, era: 1, tiers: tiers,
                  training: { slots: slots, decisions: {}, assessment: { at: at, answers: d.assess || {} } },
                  prefs: { template: template, weeklyDays: d.weeklyDays || null, restDefaultSec: TD().GOAL_REST_SEC[d.profile.goal] || 120 },
                  currentPhase: { template: template } };
    onb.draft = null; onb.step = 0;
    App.completeOnboarding(patch);
  }

  /* small onboarding html helpers */
  function miniStat(l, v, u) {
    return '<div class="card stat"><div class="stat__label">' + l + '</div>' +
      '<div class="stat__value" style="font-size:var(--fs-2xl)">' + v + '<small>' + u + '</small></div></div>';
  }
  function field(label, inner) {
    return '<label class="field"><span class="field__label">' + label + '</span>' + inner + '</label>';
  }
  function opt(val, label, cur) { return '<option value="' + val + '"' + (cur === val ? " selected" : "") + '>' + label + '</option>'; }

  /* ======================================================================
     Shared stepper widget (used in onboarding, today, nutrition, program)
     ==================================================================== */
  function stepperHtml(id, val, min, max, small, label) {
    var words = label ? esc(label) : "Value";
    return '<span class="stepper ' + (small ? "stepper--sm" : "") + '" data-stepper="' + id + '" data-min="' + min + '" data-max="' + max + '">' +
      '<button class="stepper__btn" data-step="-1" type="button" aria-label="Decrease ' + words + '">–</button>' +
      '<input class="stepper__inp" type="number" value="' + (val == null ? "" : val) + '" inputmode="numeric" aria-label="' + words + '">' +
      '<button class="stepper__btn" data-step="1" type="button" aria-label="Increase ' + words + '">+</button></span>';
  }
  function wireSteppers(root, onChange) {
    root.querySelectorAll("[data-stepper]").forEach(function (st) {
      var id = st.dataset.stepper;
      var min = Number(st.dataset.min), max = Number(st.dataset.max);
      var inp = st.querySelector(".stepper__inp");
      st.querySelectorAll("[data-step]").forEach(function (b) {
        b.addEventListener("click", function () {
          var cur = Number(inp.value) || 0;
          cur = lib.clamp(cur + Number(b.dataset.step), min, max);
          inp.value = cur; if (onChange) onChange(id, cur);
        });
      });
      inp.addEventListener("change", function () {
        var cur = lib.clamp(Number(inp.value) || 0, min, max);
        inp.value = cur; if (onChange) onChange(id, cur);
      });
    });
  }
  /* share with later parts */
  App.ui = { stepperHtml: stepperHtml, wireSteppers: wireSteppers, field: field, opt: opt,
    frequencyChoicesHtml: frequencyChoicesHtml, restGuidanceHtml: restGuidanceHtml, weeklySummaryHtml: weeklySummaryHtml };

  function frequencyChoicesHtml(value, attr) {
    return '<div class="row wrap" role="group" aria-label="Strength days per week" style="gap:var(--sp-2)">' +
      [1, 2, 3, 4, 5, 6].map(function (n) {
        return '<button type="button" class="btn btn--sm ' + (n === value ? 'btn--primary' : 'btn--ghost') + '" ' + attr + '="' + n +
          '" aria-pressed="' + (n === value) + '">' + n + (n === 1 ? ' day' : ' days') + '</button>';
      }).join('') + '</div>';
  }
  function restGuidanceHtml(tpl, days) {
    var s = App.getState(), n = Number(days), chosen = n >= 1 && n <= 6;
    return '<div class="stack" data-rest-guidance style="gap:var(--sp-2)">' +
      '<p class="text-sm" style="margin:0"><b>' + (chosen ? (7 - n) + (n === 6 ? ' day' : ' days') + ' without planned strength work each week.' : 'Recovery between strength sessions.') + '</b> ' +
        (tpl.rest === 'afterEach' ? 'Leave a full rest day between these sessions.' : 'Different muscle groups can train on consecutive days; leave a full day before training the same muscles hard again.') + '</p>' +
      (chosen ? '<p class="faint text-xs" style="margin:0" data-week-example><b>Example week:</b> ' + esc(WEEKLY_EXAMPLES[n]) + ' Your actual next session follows your logs.</p>' : '') +
      '<details><summary class="text-sm">How much rest? Between sessions and sets</summary><div class="stack mt-2">' +
      '<p class="muted text-sm" style="margin:0">One full day between hard sessions for the same muscles is a starting guideline, roughly 48 hours at the same workout time. The app uses calendar-day spacing; it cannot measure recovery. Take longer or reduce the work if unusually tired or still sore; stop a painful movement. Easy walking and gentle mobility can fit on rest days.</p>' +
      '<p class="faint text-xs" style="margin:0">Want to move all seven days? Use the extra day for light activity. ' +
        (chosen && n >= 5 ? 'Five or six strength days need an established routine; more days do not automatically mean better results. ' : '') +
        '<a href="https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/strength-training/art-20046670" target="_blank" rel="noopener noreferrer">Rest guidance</a> · ' +
        '<a href="https://acsm.org/resistance-training-guidelines-update-2026/" target="_blank" rel="noopener noreferrer">Training frequency</a></p>' +
      '<p class="faint text-xs" style="margin:0">Between sets, your current timers are ' + restRepPref(s) + ' seconds after reps and ' + restHoldPref(s) +
        ' seconds after holds. Rest longer if needed to repeat clean technique; adjust the timers in Fitness settings.</p></div></details></div>';
  }
  function weeklySummaryHtml(s) {
    var week = engine.weekProgress(s);
    if (!week.goal) return '';
    return '<div class="card stack mt-4" data-weekly-summary><div class="row between wrap"><b class="text-sm">' + week.days + ' of ' + week.goal +
      ' strength days this week</b><span class="badge">Mon–Sun</span></div>' +
      '<p class="muted text-sm" style="margin:0">' + (week.days >= week.goal ? 'Weekly target reached. More strength work is optional; recovery is part of your plan.' :
        (week.goal - week.days) + ' more planned. Keep recovery between sessions; missed days do not become a debt.') +
      ' Your weekly plan reserves ' + (7 - week.goal) + ((7 - week.goal) === 1 ? ' day' : ' days') + ' for rest or light activity.</p>' +
      '<p class="faint text-xs" style="margin:0">Leave one full day before working the same muscles hard again. Extra accessory work and hard runs also need recovery. Change days and see the rest guide in Program.</p></div>';
  }

  /* ======================================================================
     D. TODAY — the live session engine
     ==================================================================== */
  var WORK_KEY = "today.workout";

  function getWorkout() {
    var w = App.util.uiGet(WORK_KEY, null);
    return (w && w.dayType) ? w : null;
  }
  function setWorkout(w) { App.util.uiSet(WORK_KEY, w); }
  function clearWorkout() { App.util.uiSet(WORK_KEY, null); }

  function renderToday(el, s) {
    var w = getWorkout();
    if (!w) return renderReady(el, s);
    return renderActive(el, s, w);
  }

  /* Running-in-Today: if an active plan has a run scheduled for today that
     hasn't been logged, surface it here so it isn't forgotten while the user
     is looking at the recommended lift. Returns "" when nothing is due. */
  function todayRunCard(s) {
    var run = App.run;
    if (!run || !run.isActive || !run.isActive()) return "";
    var next = run.nextRun ? run.nextRun() : null;
    if (!next || !next.item || next.item.key !== lib.today()) return "";
    var sess = next.item.session || {};
    var bits = [];
    if (sess.distanceKm)  bits.push(sess.distanceKm + " km");
    if (sess.durationSec) bits.push(Math.round(sess.durationSec / 60) + " min");
    var meta = bits.length ? ' <span class="faint text-sm mono">· ' + bits.join(" · ") + '</span>' : "";
    return '<div class="card mt-4" style="border-color:rgba(var(--secondary-rgb),.3)">' +
      '<div class="row between wrap" style="gap:var(--sp-3)">' +
        '<div style="min-width:0"><div class="eyebrow" style="color:var(--secondary)">Also scheduled today</div>' +
          '<div class="card__title" style="margin:2px 0 0">' + esc(sess.title || "Run") + meta + '</div>' +
          '<p class="faint text-xs" style="margin:4px 0 0;max-width:48ch">' +
            esc(sess.sub || "A run is on your plan for today — fit it in before or after your lift.") + '</p></div>' +
        '<button class="btn btn--secondary btn--sm" data-go-run type="button">Open run \u2192</button>' +
      '</div>' + run.clashHtml(run.clashFor(next.item)) + '</div>';
  }

  /* Skill-in-Today: a low-key nudge to train a long-term skill fresh, early in
     the session, mapped to the recommended day. Relies on App.skills (Part 7);
     returns "" if that module isn't present or no day is recommended. */
  function skillReminderCard(s, dayType) {
    var sk = App.skills;
    if (!sk || !sk.suggestFor || !dayType) return "";
    /* With a track in your workouts, the block itself is the reminder. */
    if (engine.skillTracks().some(function (t) { return engine.recordOf("skill:" + t); })) return "";
    var pick = sk.suggestFor(dayType);
    if (!pick) return "";
    return '<div class="card mt-4" data-skill-card style="border-color:var(--line-2)">' +
      '<div class="row between wrap" style="gap:var(--sp-3)">' +
        '<div style="min-width:0"><div class="eyebrow">Skill work · optional</div>' +
          '<div class="card__title" style="margin:2px 0 0">Train ' + esc(pick.label) + ' first</div>' +
          '<p class="faint text-xs" style="margin:4px 0 0;max-width:48ch">' + esc(pick.line) +
            ' A few quality attempts while fresh beats grinding them tired after the main work. Add a track in Skills and it trains here, first, on the days that suit it.</p></div>' +
        '<button class="btn btn--ghost btn--sm" data-go-skill="' + esc(pick.id) + '" type="button">Train it in workouts \u2192</button>' +
      '</div></div>';
  }

  /* Overriding "train anyway" is remembered for today only — a decision made
     once this morning shouldn't have to be repeated on every render, but it
     also shouldn't quietly carry into tomorrow, which is a real training day
     regardless. */
  function restOverrideKey() { return engine.overrideKey("rest"); }

  /* The rest-day view. Deliberately much smaller than renderReady's — no
     picker, no intensity/length controls, nothing to configure for a session
     you're not supposed to start. "Train anyway" is one click away rather
     than hidden, because a genuinely flexible schedule beats a rigid one
     that argues with you (PLAN discussion, 2026-08-26): this only ever
     blocks the single day right after a session, and you can always say no. */
  /* Why today is a rest day, in the words of your template's rule. */
  function restReason(restInfo) {
    var next = engine.recommendedDayType();
    if (restInfo.rule === "weekly") return "You reached your chosen strength-day target for this week. Use the remaining days for recovery or light activity; the weekly count starts again on Monday.";
    if (restInfo.rule === "overlap") return "Yesterday's logged work trained muscles used by " + DAY_LABEL[next] + ". Leave a full day before loading them again; take longer if you still need recovery.";
    if (restInfo.rule === "sameType") {
      return DAY_LABEL[next] + " and " + DAY_LABEL[restInfo.lastType] + " ran back to back, so a rest day comes before " +
        DAY_LABEL[next] + " again.";
    }
    if (restInfo.rule === "switched") {
      return "You trained " + (DAY_LABEL[restInfo.lastType] || "a session") + " yesterday under your previous template, so today rests before " +
        DAY_LABEL[next] + " starts the new one.";
    }
    return "You trained " + (DAY_LABEL[restInfo.lastType] || "a session") + " yesterday, and your template rests the day after each session.";
  }
  /* When the next session is, after training today. */
  function nextAfterToday(doneInfo, rec) {
    return doneInfo.restTomorrow
      ? "Next up is " + (DAY_LABEL[rec] || "") + " on " + lib.fmtDate(doneInfo.nextKey) + " — tomorrow is your rest day."
      : "Next up is " + (DAY_LABEL[rec] || "") + " tomorrow — your template lets it follow today's session straight away.";
  }

  /* A snapshot of the next strength day. Its date is known after a finished
     session or on a rest day; before starting, the rotation is known but the
     date still depends on when this session is completed. */
  function followingDayType(day) {
    var order = engine.template().order, i = order.indexOf(day);
    return i < 0 ? engine.recommendedDayType() : order[(i + 1) % order.length] || day;
  }
  function nextWorkoutCard(s, day, when, length, mode) {
    if (!day) return "";
    var w = engine.buildWorkout(day, mode || null, length || (s.prefs || {}).sessionLength, {}, {}, { finisher: false });
    var rows = w.exercises.map(function (ex) {
      var key = ex.skill ? "skill:" + ex.skill : ex.slot;
      return '<li class="next-workout__row"><div><b>' + esc(ex.name) + '</b>' +
        '<span class="faint text-xs">' + esc(exLabel(ex)) + ' · ' + rangeText(ex) + '</span></div>' +
        (key ? '<button class="btn btn--ghost btn--sm" type="button" data-next-roadmap="' + esc(key) +
          '" aria-label="View ' + esc(ex.name) + ' progression roadmap">Roadmap</button>' : '') +
        '</li>';
    }).join("");
    return '<div class="card mt-4 next-workout" data-next-workout><div class="card__head"><div>' +
      '<div class="eyebrow">Next training day</div><div class="card__title">' + esc(DAY_LABEL[day] || day) + '</div></div>' +
      '<span class="badge">' + esc(when || "After this session") + '</span></div>' +
      '<p class="muted text-sm">Planned exercises from your current program. Your prescription may change after you log this session.' +
        ((s.prefs || {}).finisher === "on" ? ' Balancing exercises will be chosen on that training day.' : '') + '</p>' +
      '<ol class="next-workout__list">' + (rows || '<li class="next-workout__row">No exercises are available with your current plan and equipment.</li>') + '</ol></div>';
  }
  function wireNextWorkoutCard(el) {
    if (el._nextWorkoutWired) return;
    el._nextWorkoutWired = true;
    el.addEventListener("click", function (event) {
      var b = event.target.closest("[data-next-roadmap]");
      if (!b || !el.contains(b)) return;
      App.util.uiSet("roadmap.slot", b.dataset.nextRoadmap);
      App.showSection("progression", { focus: true });
    });
  }

  /* The Accessory session card (plan D3): coverage work on any day, rest
     days included. It lists the picks the finisher would make, so what you
     read is what starts. A mini-session moves no rotation, rest gate or
     attendance (they read main sessions); muscles, PRs, evidence, the
     streak and the Hub's habit all count it. How many movements (2-6) is
     remembered on this device. */
  function miniN() {
    var n = Math.round(Number(App.util.uiGet("mini.n", null)));
    return n >= MINI_PICKS[0] && n <= MINI_PICKS[1] ? n : window.Coverage.DEFAULT_PICKS;
  }
  function miniCardHtml() {
    var s = App.getState(), n = miniN(), w = engine.buildWorkout("mini", null, null, {}, {}, { n: n });
    var restMin = Math.round(restRepPref(s) / 60 * 10) / 10;
    var mins = Math.round(w.exercises.reduce(function (m, ex) { return m + ex.sets.length * (2.5 + restMin); }, 0));
    var rows = w.exercises.map(function (ex) {
      return '<div data-mini-pick="' + ex.slot + '"><div class="kv"><span class="kv__k">' + esc(TD().SLOTS[ex.slot].label) + '</span>' +
        '<span class="kv__v">' + esc(ex.name) + ' <span class="faint text-xs mono">' + rangeText(ex) + '</span></span></div>' +
        '<p class="faint text-xs" style="margin:0 0 var(--sp-2)">' + esc(ex.reason) + '</p></div>';
    }).join("");
    return '<div class="card mt-4 stack" id="mini-card"><div class="card__head"><div class="card__title">Accessory session</div>' +
      '<span class="badge">' + (w.exercises.length ? w.exercises.length + ' movements · ~' + mins + ' min' : 'nothing to add') + '</span></div>' +
      '<p class="muted text-sm">A short session of coverage work on any day, rest days included — the groups your week is shortest on. It doesn\'t move your rotation, a rest day or your attendance. It does count for muscles, PRs, progression evidence and your streak.</p>' +
      (w.exercises.length
        ? '<label class="field" style="max-width:8rem"><span class="field__label">Movements</span><select class="select" data-mini-n aria-label="Movements in the accessory session">' +
            [2, 3, 4, 5, 6].map(function (k) { return '<option value="' + k + '"' + (k === n ? " selected" : "") + '>' + k + '</option>'; }).join("") + '</select></label>' +
          rows + '<button class="btn btn--secondary btn--block" data-mini-start type="button">Start accessory session</button>'
        : '<p class="faint text-sm" data-mini-empty>Nothing to add today: every group is at its weekly floor of direct sets or was trained directly in the last 48 hours, or no coverage movement fits your equipment and limits.</p>') +
    '</div>';
  }
  function wireMini(el) {
    var card = el.querySelector("#mini-card");
    if (!card) return;
    var sel = card.querySelector("[data-mini-n]"), go = card.querySelector("[data-mini-start]");
    if (sel) sel.addEventListener("change", function () {
      App.util.uiSet("mini.n", Number(sel.value));
      card.outerHTML = miniCardHtml();
      wireMini(el);
    });
    if (go) go.addEventListener("click", function () {
      var w = engine.buildWorkout("mini", null, null, {}, {}, { n: miniN() });
      w.startedISO = lib.iso();
      w.dayKey = Hub.viewDate();
      setWorkout(w);
      App.refresh();
      App.toast("Accessory session started. Warm up first.", "info");
    });
  }

  function renderRestDay(el, s, restInfo) {
    var done = engine.completedSessions();
    var last = done[done.length - 1];
    var tomorrow = lib.daysBetween(lib.today(), restInfo.nextKey) === 1;
    var whenLabel = tomorrow ? "tomorrow" : lib.fmtDate(restInfo.nextKey);

    el.innerHTML =
      head("Workout", "Session engine", "Resting today") +
      '<div class="card card--accent card--pad-lg hero stack">' +
        '<div class="row between wrap"><div><div class="eyebrow">Rest day</div>' +
        '<h2 class="display h2">Next exercise day is ' + esc(whenLabel) + '</h2>' +
        '<p class="muted text-sm" style="max-width:46ch">' + esc(restReason(restInfo)) +
          ' It\'s part of the program, not a delay — this is where the adaptation actually happens.' +
        '</p></div>' +
        '<span class="badge"><span class="dot"></span>rest</span></div>' +
        '<button class="btn btn--ghost btn--sm" id="rest-train-anyway" type="button">Train anyway →</button>' +
      '</div>' +
      nextWorkoutCard(s, engine.recommendedDayType(), lib.fmtDate(restInfo.nextKey)) +
      weeklySummaryHtml(s) +
      recoveryHtml(s) +
      miniCardHtml() +
      (last ? lastSessionCard(last) : "") +
      streakStripCard(s);

    wireRecovery(el);
    wireMini(el);
    wireNextWorkoutCard(el);
    var anyway = document.getElementById("rest-train-anyway");
    if (anyway) anyway.addEventListener("click", function () {
      App.util.uiSet(restOverrideKey(), true);
      renderReady(el, s);
    });
  }

  function doneOverrideKey() { return engine.overrideKey("done"); }

  /* You already logged a session today. Same treatment as the rest day —
     state what you did, say when the next one is, and keep the override one
     click away — because the alternative (which is what shipped) was the app
     recommending the exact session you had just finished, with no sign it
     knew you had trained at all. */
  function renderDoneToday(el, s, doneInfo) {
    var done = engine.completedSessions();
    var last = done[done.length - 1];
    var rec = engine.recommendedDayType();

    el.innerHTML =
      head("Workout", "Session engine", "Done for today") +
      '<div class="card card--accent card--pad-lg hero stack">' +
        '<div class="row between wrap"><div><div class="eyebrow">Done today</div>' +
        '<h2 class="display h2">You trained ' + esc(DAY_LABEL[doneInfo.todayType] || "") + ' today</h2>' +
        '<p class="muted text-sm" style="max-width:46ch">' +
          esc(nextAfterToday(doneInfo, rec)) + ' ' +
          (doneInfo.count > 1 ? 'You have logged ' + doneInfo.count + ' sessions today. ' : '') +
          'Nothing more is required of you today.' +
        '</p>' +
        (last ? '<p class="text-sm mono" data-done-counts style="margin:var(--sp-2) 0 0">' + countsText(exerciseCounts(last.exercises)) + '</p>' : '') +
        '</div>' +
        '<span class="badge badge--primary"><span class="dot"></span>complete</span></div>' +
        '<button class="btn btn--ghost btn--sm" id="done-train-anyway" type="button">Train again anyway →</button>' +
      '</div>' +
      nextWorkoutCard(s, rec, lib.fmtDate(doneInfo.nextKey)) +
      weeklySummaryHtml(s) +
      recoveryHtml(s) +
      miniCardHtml() +
      (last ? lastSessionCard(last) : "") +
      streakStripCard(s);

    wireRecovery(el);
    wireMini(el);
    wireNextWorkoutCard(el);
    var anyway = document.getElementById("done-train-anyway");
    if (anyway) anyway.addEventListener("click", function () {
      App.util.uiSet(doneOverrideKey(), true);
      renderReady(el, s);
    });
  }

  function renderReady(el, s) {
    /* Trained today outranks the rest gate: restDayInfo returns isRest:false
       on a day you have already trained, so this has to be tested first or
       the state is never reached. */
    var doneInfo = engine.doneTodayInfo(s);
    if (doneInfo.isDone && !App.util.uiGet(doneOverrideKey(), false)) {
      return renderDoneToday(el, s, doneInfo);
    }
    var restInfo = engine.restDayInfo(s);
    if (restInfo.isRest && !App.util.uiGet(restOverrideKey(), false)) {
      return renderRestDay(el, s, restInfo);
    }
    var rec = engine.recommendedDayType();
    var done = engine.completedSessions();
    var last = done[done.length - 1];
    var segBtns = engine.template().order.map(function (d) {
      return '<button class="seg__btn ' + (d === rec ? "is-active" : "") + '" data-day="' + d + '">' + DAY_LABEL[d] + '</button>';
    }).join("");

    el.innerHTML =
      head("Workout", "Session engine", rec ? DAY_LABEL[rec] + " is up next" : "Let's train") +
      '<div class="card card--accent card--pad-lg hero stack">' +
        '<div class="row between wrap"><div><div class="eyebrow">Recommended</div>' +
        '<h2 class="display h2" id="today-title">' + DAY_LABEL[rec] + '</h2>' +
        '<p class="muted text-sm" id="today-desc" style="max-width:46ch">' + DAY_DESC[rec] + '</p></div>' +
        eraBadge(s) + '</div>' +
        '<div id="today-summary" class="today-summary" aria-live="polite"></div>' +
        '<button class="btn btn--primary btn--lg btn--block" id="begin-session">' +
          '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>' +
          'Start workout</button>' +
        '<details class="workout-disclosure" id="workout-adjust"><summary>Adjust workout</summary><div class="stack mt-3">' +
        '<div><div class="field__label mb-2">Choose your focus</div><div class="seg" id="day-seg">' + segBtns + '</div></div>' +
        '<div class="vol-mode-row mt-4"><div class="field__label mb-2">Sets</div><div class="vol-mode-grid" id="vol-mode-grid">' +
          Object.keys(VOLUME_MODES).map(function (k) {
            var m = VOLUME_MODES[k];
            var cur = volumeModeOf(s.prefs && s.prefs.volumeMode);
            return '<button class="vol-mode-btn ' + (k === cur ? "is-active" : "") + '" data-volmode="' + k + '" type="button">' +
              '<span class="vol-mode-btn__label">' + m.label + '</span>' +
              '<span class="vol-mode-btn__desc">' + m.desc + '</span>' +
            '</button>';
          }).join("") +
        '</div></div>' +
        /* Length sits beside sets, not inside it: one decides how many
           movements, the other how hard each one is, and they combine. */
        '<div class="vol-mode-row mt-4"><div class="field__label mb-2">Length</div><div class="vol-mode-grid" id="len-mode-grid">' +
          Object.keys(LENGTH_MODES).map(function (k) {
            var m = LENGTH_MODES[k];
            var cur = (s.prefs && s.prefs.sessionLength) || "focused";
            return '<button class="vol-mode-btn ' + (k === cur ? "is-active" : "") + '" data-lenmode="' + k + '" type="button">' +
              '<span class="vol-mode-btn__label">' + m.label + '</span>' +
              '<span class="vol-mode-btn__desc">' + m.desc + '</span>' +
            '</button>';
          }).join("") +
        '</div></div>' +
        /* The finisher (plan D3) is off until you tick this; the pref is what
           buildWorkout reads, so the preview and Begin can't disagree. */
        '<div class="vol-mode-row mt-4" id="finisher-row"><div class="field__label mb-2">Finisher</div>' +
          '<label class="row text-sm" style="gap:var(--sp-2);align-items:center"><input type="checkbox" data-finisher' +
            ((s.prefs && s.prefs.finisher) === "on" ? " checked" : "") + '> <span>Add balancing exercises</span></label>' +
          '<p class="faint text-xs" style="margin:6px 0 0">Four coverage movements for the groups furthest below their weekly floor of direct sets, skipping any you trained directly in the last 48 hours. Off until you tick it. Remove or swap each one in the list below.</p></div>' +
        /* The mobility block (plan B6): off until ticked, like the finisher.
           Drawn only when the Mobility view's routines loaded. */
        (window.Hub && Hub.mobility ? '<div class="vol-mode-row mt-4" id="mobility-row"><div class="field__label mb-2">Mobility</div>' +
          '<label class="row text-sm" style="gap:var(--sp-2);align-items:center"><input type="checkbox" data-mobility-block' +
            ((s.prefs && s.prefs.mobilityBlock) === "on" ? " checked" : "") + '> <span>Add a mobility routine</span></label>' +
          '<div id="mobility-pick"></div>' +
          '<p class="faint text-xs" style="margin:6px 0 0">One routine from Mobility, before or after the main work. Off until you tick it. Tick every step and it counts in Mobility for the day the session began.</p></div>' : "") +
        '</div></details>' +
        '<details class="workout-disclosure" id="workout-preview"><summary>Full exercise preview and swaps</summary><div class="mt-3" id="today-preview"></div>' +
        '<button class="btn btn--ghost btn--sm btn--block" id="preview-all-toggle" type="button" style="margin-top:var(--sp-2)">Preview all days ▾</button>' +
        '<div id="all-days-preview" style="display:none"></div></details>' +
      '</div>' +
      '<div id="next-workout-preview">' + nextWorkoutCard(s, followingDayType(rec), "After this session") + '</div>' +
      weeklySummaryHtml(s) +
      recoveryHtml(s) +
      upgradeCardHtml(s) +
      equipCheckHtml(s) +
      todayRunCard(s) +
      skillReminderCard(s, rec) +
      miniCardHtml() +
      (last ? lastSessionCard(last) : "") +
      streakStripCard(s);
    if (App.run && App.run.wireNotes) App.run.wireNotes(el);
    wireMini(el);

    var chosen = {
      day: rec, overrides: {}, grips: {}, workout: null,
      volumeMode: volumeModeOf(s.prefs && s.prefs.volumeMode),
      sessionLength: (s.prefs && s.prefs.sessionLength) || "focused"
    };
    function refreshNextPreview() {
      document.getElementById("next-workout-preview").innerHTML = nextWorkoutCard(App.getState(),
        followingDayType(chosen.day), "After this session", chosen.sessionLength, chosen.volumeMode);
    }
    function previewMissing(ex) { return gearMissing(ex.id, s.equipment); }
    function renderPreview() {
      /* The preview IS the workout Begin starts: one buildWorkout call whose
         object Begin saves as the draft, so the two can't disagree about a
         prescription (T17). Rebuilt on every change of day, mode, length or
         swap. */
      var w = chosen.workout = engine.buildWorkout(chosen.day, chosen.volumeMode, chosen.sessionLength, chosen.overrides, chosen.grips,
        { mobility: chosen.mobility });
      var restMin = Math.round(restRepPref(s) / 60 * 10) / 10;
      var mobRoutine = w.mobility && Hub.mobility.byId[w.mobility.routine];
      var mobSec = mobRoutine ? mobRoutine.steps.reduce(function (n, st) { return n + st.sec; }, 0) : 0;
      var estMins = Math.round(w.exercises.reduce(function (n, ex) {
        /* A skill attempt is its standard (or SKILL_EST_SEC) plus its rest. */
        if (ex.skill) return n + ex.sets.length * (((ex.rx.unit === "sec" && ex.range && ex.range[1]) || SKILL_EST_SEC) + ex.restSec) / 60;
        return n + (ex.finisher ? ex.sets.length : w.setCount) * (2.5 + restMin);
      }, 0) + mobSec / 60);
      document.getElementById("today-summary").innerHTML =
        '<strong>' + w.exercises.length + ' exercises · about ' + estMins + ' min</strong>' +
        '<span class="muted text-sm">' + esc(w.exercises.map(function (ex) { return ex.name; }).join(' · ')) + '</span>';
      var pick = document.getElementById("mobility-pick");
      if (pick) pick.innerHTML = w.mobility
        ? '<div class="row wrap mt-2" style="gap:var(--sp-2);align-items:center"><select class="select" data-mobility-routine aria-label="Mobility routine">' +
            Hub.mobility.routines.map(function (r) {
              return '<option value="' + esc(r.id) + '"' + (r.id === w.mobility.routine ? " selected" : "") + '>' + esc(r.name) + '</option>';
            }).join("") + '</select>' +
            '<span class="faint text-xs">' + Math.round(mobSec / 60) + ' min · ' + (w.mobility.when === "before" ? "before" : "after") + ' the main work</span></div>' +
          '<p class="faint text-xs" data-mobility-why style="margin:6px 0 0">' + (w.mobility.suggested ? "Suggested: " : "") + esc(w.mobility.why) + '</p>'
        : "";
      var sel = pick && pick.querySelector("[data-mobility-routine]");
      if (sel) sel.addEventListener("change", function () { chosen.mobility = sel.value; renderPreview(); });
      /* The lifting card's half of the A13 note: the run planned for today,
         against the day being previewed rather than the recommended one. */
      var todaysRun = App.run && App.run.isActive() ? App.run.nextRun() : null;
      var clash = todaysRun && todaysRun.item.key === lib.today() ? App.run.clashFor(todaysRun.item, chosen.day) : null;
      var finShown = false;
      var finMins = Math.round(w.exercises.filter(function (ex) { return ex.finisher; }).reduce(function (n, ex) {
        return n + ex.sets.length * (2.5 + restMin);
      }, 0));
      /* Picks you removed for this session, each one tap from coming back. A
         removal doesn't pull in the next-best pick: four is a ceiling. */
      var removedHtml = function () {
        var fin = (App.getState().prefs.finisher) === "on";
        var gone = Object.keys(chosen.overrides).filter(function (k) {
          return chosen.overrides[k] === false && (fin || engine.skillKey(k));
        });
        return gone.length ? '<p class="faint text-xs" data-pv-removed style="margin:var(--sp-2) 0 0">Removed for this session: ' + gone.map(function (k) {
          var sk = engine.skillKey(k);
          return esc(sk ? exLabel({ skill: sk }) : TD().SLOTS[k].label) + ' <button class="btn btn--ghost btn--sm" data-pv-addback="' + k + '" type="button" style="padding:1px 8px">Add back</button>';
        }).join(" · ") + '</p>' : "";
      };
      document.getElementById("today-preview").innerHTML =
        (clash ? App.run.clashHtml(clash) : "") +
        '<div class="card card--glass"><div class="card__head"><div class="card__title">Today\'s movements</div>' +
        '<span class="badge">' + w.exercises.length + ' movements · ~' + estMins + ' min</span></div>' +
        w.exercises.map(function (ex) {
          var missing = previewMissing(ex);
          var warn = missing ? ' <span class="badge badge--warn" style="padding:1px 7px">needs gear</span>' : "";
          var ovTag = ex.swapped ? ' <span class="badge badge--secondary" style="padding:1px 7px">swapped</span>' : "";
          /* Marked in the UI as well as in the data — an accessory that
             looked identical to primary work would leave you wondering why
             it sits outside the day's usual movements. */
          var accTag = ex.accessory ? ' <span class="badge" style="padding:1px 7px" title="Full length\'s extra movement">accessory</span>' : "";
          var careful = carefulFor(trainingCtx(s), ex.id, gripCapable(ex.id) ? gripOf(ex.rx) : null);
          var carTag = careful.length ? ' <span class="badge badge--secondary" style="padding:1px 7px" title="You marked this joint careful; this movement loads it heavily">careful: ' + careful.map(jointWord).join(", ") + '</span>' : "";
          var gripTag = gripOf(ex.rx) === "knuckles" ? ' <span class="badge" style="padding:1px 7px">knuckles</span>' : "";
          var finHead = ex.finisher && !finShown ? (finShown = true,
            '<div class="eyebrow" data-pv-fin-head style="margin:var(--sp-4) 0 var(--sp-2)">Finisher · about +' + finMins + ' min · coverage work</div>') : "";
          return finHead + '<div class="kv" style="align-items:center" data-pv-ex="' + esc(ex.id) + '" data-pv-rx="' + esc(JSON.stringify(ex.rx)) + '"' +
            (ex.finisher ? ' data-pv-fin="' + ex.slot + '"' : "") + (ex.skill ? ' data-pv-skill="' + esc(ex.skill) + '"' : "") + '>' +
            '<span class="kv__k">' + esc(exLabel(ex)) + (ex.level ? ' · L' + ex.level : '') + '</span>' +
            '<span class="kv__v" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end">' +
            esc(ex.name) + ' <span class="faint text-xs mono">' + rangeText(ex) + '</span>' +
            warn + ovTag + accTag + gripTag + carTag +
            /* A skill changes rung in Skills, never by a one-off swap. */
            (ex.skill ? "" : '<button class="btn btn--ghost btn--sm" data-pvswap="' + ex.slot + '" type="button" style="padding:2px 10px">Swap</button>') +
            (ex.finisher || ex.skill ? '<button class="btn btn--ghost btn--sm" data-pv-remove="' + exKey(ex) + '" type="button" style="padding:2px 10px">Remove</button>' : "") + '</span></div>' +
            ((ex.finisher || ex.skill) && ex.reason ? '<p class="faint text-xs" data-pv-cover style="margin:0 0 var(--sp-2)">' + esc(ex.reason) + '</p>' : "") +
            (ex.note ? '<p class="faint text-xs" data-pv-note style="margin:0 0 var(--sp-2)">' + esc(ex.note) + '</p>' : "") +
            knucklesToday(ex, careful) +
            rxLinesHtml(ex, true);
        }).join("") + removedHtml() + '</div>' +
        rowOfferHtml(App.getState(), chosen.day);
      document.querySelectorAll("[data-pvswap]").forEach(function (b) {
        b.addEventListener("click", function () { openPreviewSwap(b.dataset.pvswap, chosen, renderPreview); });
      });
      document.querySelectorAll("[data-pv-remove]").forEach(function (b) {
        b.addEventListener("click", function () { chosen.overrides[b.dataset.pvRemove] = false; renderPreview(); });
      });
      document.querySelectorAll("[data-pv-addback]").forEach(function (b) {
        b.addEventListener("click", function () { delete chosen.overrides[b.dataset.pvAddback]; renderPreview(); });
      });
      document.querySelectorAll("[data-knuckles-today]").forEach(function (b) {
        b.addEventListener("change", function () {
          chosen.grips[b.dataset.knucklesToday] = b.checked ? "knuckles" : "palms";
          renderPreview();
        });
      });
      var pv = document.getElementById("today-preview");
      if (clash) App.run.wireNotes(pv);
      wireDecide(pv, null, renderPreview);
      wireRowOffer(pv, renderPreview);
    }
    renderPreview();

    /* Finisher: the pref buildWorkout reads. Saved at once, so a reload or
       Begin starts what the list shows. */
    var mobTick = el.querySelector("[data-mobility-block]");
    if (mobTick) mobTick.addEventListener("change", function () {
      var st = App.getState();
      st.prefs.mobilityBlock = mobTick.checked ? "on" : "off";
      App.saveState();
      renderPreview();
    });
    var fin = el.querySelector("[data-finisher]");
    if (fin) fin.addEventListener("change", function () {
      var st = App.getState();
      st.prefs.finisher = fin.checked ? "on" : "off";
      App.saveState();
      renderPreview();
      refreshNextPreview();
    });

    /* preview of every training day, not just the selected one */
    function renderAllDays() {
      var box = document.getElementById("all-days-preview");
      if (!box) return;
      box.innerHTML = engine.template().order.map(function (d) {
        /* Without the finisher: its picks are today's, not that day's. */
        var pats = engine.buildWorkout(d, chosen.volumeMode, chosen.sessionLength, null, null, { finisher: false }).exercises;
        var moves = pats.map(function (ex) {
          return '<div class="kv"><span class="kv__k">' + esc(exLabel(ex)) + (ex.level ? ' · L' + ex.level : '') + '</span>' +
            '<span class="kv__v">' + esc(ex.name) + '</span></div>';
        }).join("");
        return '<div class="card card--glass mt-2">' +
          '<div class="card__head"><div class="card__title">' + DAY_LABEL[d] + (d === rec ? ' <span class="badge badge--primary" style="padding:1px 7px">next up</span>' : "") + '</div>' +
          '<span class="badge">' + pats.length + ' patterns · ~' + (pats.length * 12) + ' min</span></div>' +
          '<p class="faint text-xs" style="margin:0 0 var(--sp-2)">' + esc(DAY_DESC[d]) + '</p>' +
          moves + '</div>';
      }).join("");
    }

    var allOpen = false;
    var allToggle = document.getElementById("preview-all-toggle");
    if (allToggle) allToggle.addEventListener("click", function () {
      allOpen = !allOpen;
      var box = document.getElementById("all-days-preview");
      if (allOpen) { renderAllDays(); box.style.display = ""; allToggle.textContent = "Hide all days ▴"; }
      else { box.style.display = "none"; allToggle.textContent = "Preview all days ▾"; }
    });

    document.querySelectorAll("#day-seg .seg__btn").forEach(function (b) {
      b.addEventListener("click", function () {
        chosen.day = b.dataset.day;
        chosen.overrides = {};
        chosen.grips = {};
        chosen.mobility = null;   // a new day gets its own suggestion
        document.querySelectorAll("#day-seg .seg__btn").forEach(function (x) { x.classList.toggle("is-active", x === b); });
        document.getElementById("today-title").textContent = DAY_LABEL[chosen.day];
        document.getElementById("today-desc").textContent = DAY_DESC[chosen.day];
        refreshNextPreview();
        renderPreview();
      });
    });

    /* Volume mode selector */
    document.querySelectorAll("[data-volmode]").forEach(function (b) {
      b.addEventListener("click", function () {
        chosen.volumeMode = b.dataset.volmode;
        document.querySelectorAll("[data-volmode]").forEach(function (x) {
          x.classList.toggle("is-active", x === b);
        });
        renderPreview();
        refreshNextPreview();
      });
    });

    /* Session length selector */
    document.querySelectorAll("[data-lenmode]").forEach(function (b) {
      b.addEventListener("click", function () {
        chosen.sessionLength = b.dataset.lenmode;
        document.querySelectorAll("[data-lenmode]").forEach(function (x) {
          x.classList.toggle("is-active", x === b);
        });
        renderPreview();
        refreshNextPreview();
        renderAllDays();
      });
    });

    document.getElementById("begin-session").addEventListener("click", function () {
      /* persist the chosen volume mode + length so they're the defaults next time */
      var st = App.getState();
      if (!st.prefs) st.prefs = {};
      st.prefs.volumeMode = chosen.volumeMode;
      st.prefs.sessionLength = chosen.sessionLength;
      App.saveState();

      /* The previewed object itself, swaps included — not a second build. */
      var workout = chosen.workout;
      workout.startedISO = lib.iso();
      /* The training day is fixed here, once: the logging date (rollover and
         backfill already applied), not whatever day it is when you finish. */
      workout.dayKey = Hub.viewDate();
      setWorkout(workout);
      App.refresh();
      App.toast(DAY_LABEL[chosen.day] + " · " +
        ((engine.LENGTH_MODES[chosen.sessionLength] || {}).label || "") + " · " +
        ((engine.VOLUME_MODES[chosen.volumeMode] || {}).label || "") +
        " started. Warm up first.", "info");
    });

    wireUpgradeCard(el);
    wireEquipCheck(el);
    wireRecovery(el);
    wireNextWorkoutCard(el);

    /* Running-in-Today + skill-reminder buttons */
    var goRun = el.querySelector("[data-go-run]");
    if (goRun) goRun.addEventListener("click", function () { App.showSection("running"); });
    var goSkill = el.querySelector("[data-go-skill]");
    if (goSkill) goSkill.addEventListener("click", function () {
      if (App.skills && App.skills.openTrack) App.skills.openTrack(goSkill.dataset.goSkill);
      else App.showSection("skills");
    });
  }

  /* Knuckles today (plan C1): one tick under a push-up row, for this session
     only. It builds the same prescription on the other grip, so it isn't a
     swap; a knuckles session still counts as evidence for a palms rx. Your
     standing choice is Program's Push-ups on. `careful` is the joints this
     row warns on, to say why knuckles might help. */
  function knucklesToday(ex, careful) {
    if (!gripCapable(ex.id) || engine.flagged(ex)) return "";
    var on = gripOf(ex.rx) === "knuckles", standing = standingGrip(App.getState(), ex.slot) === "knuckles";
    var hint = on && standing ? "your standing grip is knuckles — untick for palms today"
      : on ? "front two knuckles, wrist straight"
      : careful.indexOf("wrist") >= 0 ? "your wrist is marked careful — knuckles keep it straight"
      : "front two knuckles, wrist straight; counts as evidence for palms";
    return '<label class="row text-sm" data-pv-grip style="gap:var(--sp-2);align-items:center;margin:0 0 var(--sp-2)">' +
      '<input type="checkbox" data-knuckles-today="' + ex.slot + '"' + (on ? " checked" : "") + '> <span>Knuckles today</span> ' +
      '<span class="faint text-xs">— ' + esc(hint) + '</span></label>';
  }

  /* A swap list's rows for a slot (plan C3): excluded movements are left
     out unless `showExcluded`, and still a one-off swap away when shown.
     Each row's badges say why it isn't simply "ready": current, excluded,
     the gear it needs, a joint you avoid, a joint you're careful with.
     `attr(alt)` is the row's data attribute. Returns { html, hidden }. */
  function swapRows(slot, curId, showExcluded, attr) {
    var hidden = 0;
    var html = engine.slotOptions(slot).map(function (alt) {
      var st = engine.swapStatus(slot, alt.id), isCur = alt.id === curId;
      if (st.blocked === "excluded" && !isCur && !showExcluded) { hidden++; return ""; }
      var b = function (cls, t) { return '<span class="badge ' + cls + '" style="padding:2px 8px">' + esc(t) + '</span>'; };
      var tag = isCur ? b("badge--primary", "current")
        : st.blocked === "excluded" ? b("badge--warn", "excluded")
        : st.missing ? b("badge--warn", "needs " + st.missing)
        : st.blocked ? b("badge--warn", "avoiding your " + jointWord(st.blocked))
        : b("badge--success", "ready");
      var warn = st.careful.length && !st.blocked ? b("badge--secondary", "careful: " + st.careful.map(jointWord).join(", ")) : "";
      return '<button class="swap-opt' + (isCur ? " is-current" : "") + (st.blocked ? " is-locked" : "") + '" ' + attr(alt) + ' type="button">' +
        '<span class="swap-opt__lvl">' + swapLevel(alt) + '</span>' +
        '<span class="swap-opt__main"><span class="swap-opt__name">' + esc(alt.name) + '</span>' +
        '<span class="swap-opt__sub">' + swapSub(alt) + '</span></span>' + warn + tag +
      '</button>';
    }).join("");
    return { html: html, hidden: hidden };
  }
  function showExcludedHtml(n, attr) {
    return n ? '<button class="btn btn--ghost btn--sm" ' + attr + ' type="button">Show excluded (' + n + ')</button>' : "";
  }

  /* Preview swap: choose an alternative movement before the session starts. */
  function openPreviewSwap(slot, chosen, rerender, showExcluded) {
    var defId = ((engine.prescriptionFor(slot) || {}).rx || {}).exerciseId;
    var current = chosen.overrides[slot] || defId;
    var rows = swapRows(slot, current, showExcluded, function (alt) { return 'data-pvswapto="' + alt.id + '"'; });
    var pattern = TD().SLOTS[slot].label.toLowerCase();

    ensureSwapModal();
    var body = document.getElementById("pvswap-body");
    body.innerHTML = '<p class="faint text-xs" style="margin:0 0 var(--sp-3)">Pick a ' + pattern + ' movement to use for this session. "Ready" means you have the gear for it and nothing you set rules it out.</p>' +
      '<div class="swap-list">' + rows.html + '</div>' + showExcludedHtml(rows.hidden, "data-pvswap-excluded");
    document.getElementById("pvswap-title").textContent = "Swap " + pattern.charAt(0).toUpperCase() + pattern.slice(1) + " movement";
    body.querySelectorAll("[data-pvswapto]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.pvswapto === defId) delete chosen.overrides[slot];
        else chosen.overrides[slot] = b.dataset.pvswapto;
        App.closeModal("modal-pvswap");
        if (rerender) rerender();
      });
    });
    var more = body.querySelector("[data-pvswap-excluded]");
    if (more) more.addEventListener("click", function () { openPreviewSwap(slot, chosen, rerender, true); });
    App.openModal("modal-pvswap");
  }

  function ensureSwapModal() {
    if (document.getElementById("modal-pvswap")) return;
    var div = document.createElement("div");
    div.className = "modal";
    div.id = "modal-pvswap";
    div.setAttribute("role", "dialog");
    div.setAttribute("aria-modal", "true");
    div.innerHTML =
      '<div class="modal__backdrop" data-close></div>' +
      '<div class="modal__dialog" style="max-width:460px">' +
        '<div class="modal__head"><div><div class="eyebrow">Session setup</div>' +
        '<h3 class="display h3" id="pvswap-title">Swap movement</h3></div>' +
        '<button class="modal__close" data-close aria-label="Close">' +
          '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button></div>' +
        '<div id="pvswap-body" class="stack"></div>' +
      '</div>';
    document.body.appendChild(div);
    div.querySelectorAll("[data-close]").forEach(function (c) {
      c.addEventListener("click", function () { App.closeModal("modal-pvswap"); });
    });
  }

  /* The session's mobility routine as a checklist section, or "" when the
     workout has none, or the routine data didn't load. */
  function mobilitySection(w, when) {
    var m = w.mobility, r = m && m.when === when && window.Hub && Hub.mobility && Hub.mobility.byId[m.routine];
    if (!r) return "";
    var items = r.steps.map(function (st) { return { name: st.name, detail: st.sec + " s", seconds: st.sec, cue: st.cue }; });
    return '<div data-mob-block="' + esc(m.routine) + '">' +
      section("Mobility · " + r.name, items.length + " steps · " + (when === "before" ? "before the main work" : "after the main work"),
        checklist(items, m.done, "mob")) + '</div>';
  }

  function renderActive(el, s, w) {
    var warm = DB.warmup(w.dayType), cool = DB.cooldown(w.dayType);

    /* Build a short adaptive context note for the session header */
    var modeLabel = ((engine.VOLUME_MODES || {})[w.volumeMode] || {}).label || "";
    var adaptNotes = [];
    if (modeLabel && w.volumeMode !== "standard") adaptNotes.push(modeLabel + " intensity selected");
    w.exercises.forEach(function (ex) {
      if (ex.targetDelta > 0) adaptNotes.push(cap(ex.pattern) + " target ▲" + ex.targetDelta);
      if (ex.targetDelta < 0) adaptNotes.push(cap(ex.pattern) + " target ▼" + Math.abs(ex.targetDelta));
    });
    var adaptBanner = adaptNotes.length
      ? '<div class="card card--glass mt-4" style="border-color:rgba(var(--primary-rgb),.25);padding:var(--sp-3) var(--sp-4)">' +
          '<div class="eyebrow" style="color:var(--primary);margin-bottom:4px">Adapted from last session</div>' +
          '<div class="text-sm muted">' + adaptNotes.join(" · ") + '</div>' +
        '</div>'
      : "";

    /* The draft outlives the backfill bar (the logging date resets on reload)
       and midnight, so the screen itself says where this workout will land. */
    var dayNote = (w.dayKey && w.dayKey !== lib.today())
      ? '<div class="wh-advice wh-advice--warn mt-4" role="status">' +
          '<div><div class="wh-advice__title">Saving to ' + esc(Hub.prettyDate(w.dayKey)) + ' · ' + esc(Hub.relDay(w.dayKey)) + '</div>' +
          '<p class="wh-advice__body">This workout began on that day, so that\'s where it\'s filed. Discard it to log one for today instead.</p></div>' +
        '</div>'
      : "";

    el.innerHTML =
      head("Workout", DAY_LABEL[w.dayType], "Log every set — the OS adapts from this") +
      dayNote +
      '<div id="workout-progress" class="card workout-progress" aria-live="polite">' + activeProgressHtml(w) + '</div>' +
      '<details class="workout-disclosure mt-4"><summary>See exercises for the next training day</summary>' +
        nextWorkoutCard(s, followingDayType(w.dayType), "After this session") + '</details>' +
      recoveryHtml(s, true) +
      upgradeCardHtml(s) +
      adaptBanner +
      /* warmup */
      section("Warm-up", warm.length + " drills", checklist(warm, w.warmup, "warm")) +
      mobilitySection(w, "before") +
      /* exercises */
      '<div class="page-head" style="margin-top:var(--sp-8)"><div class="eyebrow">Work</div>' +
      '<h2 class="display h3">' + (w.kind === "mini" ? "Accessory session" : "Main session") + '</h2></div>' +
      '<div id="ex-list">' + w.exercises.map(function (ex, i) {
        /* The finisher's picks follow the main slots under their own heading. */
        var fh = ex.finisher && !(i && w.exercises[i - 1].finisher)
          ? '<div class="eyebrow" data-finisher-head style="margin:var(--sp-6) 0 var(--sp-2)">Finisher · coverage work</div>' : "";
        /* The skill block opens the work, while you're fresh, under its own heading. */
        if (ex.skill && !i) fh = '<div class="eyebrow" data-skill-head style="margin:0 0 var(--sp-2)">Skill work · first, while you\'re fresh</div>';
        if (!ex.skill && i && w.exercises[i - 1].skill) fh = '<div class="eyebrow" data-main-head style="margin:var(--sp-6) 0 var(--sp-2)">Main slots</div>' + fh;
        return fh + exerciseBlock(ex, i, s);
      }).join("") + '</div>' +
      mobilitySection(w, "after") +
      /* cooldown */
      section("Cool-down", cool.length + " stretches", checklist(cool, w.cooldown, "cool")) +
      /* notes */
      '<div class="card mt-6"><label class="field"><span class="field__label">Session notes</span>' +
        '<textarea class="textarea" id="sess-notes" placeholder="Energy, sleep, anything notable…">' + esc(w.notes || "") + '</textarea></label></div>' +
      /* footer */
      '<div class="session-bar">' +
        '<button class="btn btn--ghost" id="discard-session">Discard</button>' +
        '<button class="btn btn--ghost no-print" id="print-session" title="Print / save as PDF" aria-label="Print session">' +
          '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg></button>' +
        '<button class="btn btn--primary" id="complete-session">' +
          '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
          'Complete session</button>' +
      '</div>';

    wireActive(el, w);
  }

  function activeProgressHtml(w) {
    var total = 0, done = 0, next = null;
    w.exercises.forEach(function (ex, i) {
      if (engine.skipped(ex)) return;
      ex.sets.forEach(function (st, j) {
        total++;
        if (Number(st.value) > 0) done++;
        else if (!next) next = { name: ex.name, exercise: i, set: j + 1 };
      });
    });
    return '<div class="row between wrap"><div><div class="eyebrow">Session progress</div>' +
      '<div class="card__title">' + done + ' of ' + total + ' sets have values</div></div>' +
      '<span class="badge">' + w.exercises.length + ' exercises</span></div>' +
      (next ? '<button class="btn btn--secondary btn--sm mt-3" type="button" data-workout-continue="' + next.exercise + '" data-workout-continue-set="' + (next.set - 1) + '">Continue: ' +
        esc(next.name) + ' · set ' + next.set + ' →</button>' :
        '<p class="muted text-sm">All planned sets have values. Review your entries, then finish the session.</p>') +
      '<p class="faint text-xs">Enter the reps or seconds you completed. The checkmark marks a set complete and starts rest.</p>';
  }
  function updateActiveProgress(el, w) {
    var box = el.querySelector("#workout-progress");
    if (box) box.innerHTML = activeProgressHtml(w);
  }

  function exerciseBlock(ex, i, s) {
    var unit = ex.mode === "hold" ? "sec" : "reps";
    /* Loaded work always gets a weight input, whatever the Era (plan C3). */
    var loadMode = (TD().EXERCISES[ex.id] || {}).loadMode;
    var showW = !!loadMode || (s.era === 2) || ex.era2;
    var isHold = ex.mode === "hold";
    var timed = isHold && isTimed(ex.id);
    var sets = ex.sets.map(function (st, j) {
      var holdBtn = isHold ? '<button class="mini-timer mini-timer--hold" data-holdtimer="' + i + "-" + j + '" type="button" title="' + (timed ? "Time this set" : "Time this hold") + '" aria-label="' + (timed ? "Start set timer" : "Start hold timer") + '">' +
        '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>Time it</button>' : "";
      return '<div class="setrow" data-ex="' + i + '" data-set="' + j + '">' +
        '<span class="setrow__n">SET ' + (j + 1) + '</span>' +
        '<div class="row" style="gap:var(--sp-2)">' +
          stepperHtml("set-" + i + "-" + j, st.value, 0, 600, true, ex.name + " set " + (j + 1) + " " + unit) +
          '<span class="faint text-xs">' + unit + '</span>' +
          (showW ? '<span class="stepper stepper--sm" data-wt="' + i + "-" + j + '" data-min="0" data-max="200">' +
            '<button class="stepper__btn" data-wstep="-2.5" type="button" aria-label="Decrease ' + esc(ex.name) + ' set ' + (j + 1) + ' weight">–</button>' +
            '<input class="stepper__inp" type="number" value="' + (st.weight == null ? "" : st.weight) + '" placeholder="kg" inputmode="decimal" aria-label="' + esc(ex.name) + ' set ' + (j + 1) + ' weight in kilograms">' +
            '<button class="stepper__btn" data-wstep="2.5" type="button" aria-label="Increase ' + esc(ex.name) + ' set ' + (j + 1) + ' weight">+</button></span>' +
            (loadMode ? '<span class="faint text-xs">' + (loadMode === "perHand" ? "kg per hand" : "kg total") + '</span>' : "") : "") +
          holdBtn +
        '</div>' +
        '<button class="setrow__done ' + (st.done ? "is-on" : "") + '" data-donebtn="' + i + "-" + j + '" type="button" aria-label="' +
          (st.done ? 'Unmark ' : 'Mark ') + esc(ex.name) + ' set ' + (j + 1) + ' complete" aria-pressed="' + !!st.done + '">' +
          '<svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg></button>' +
      '</div>';
    }).join("");

    /* "moderate" is the stored value of Just right. A blank saves as null and
       "Not sure" as "unsure": both read as unknown effort, never evidence. */
    var diff = EFFORTS.map(function (d) {
      return '<button class="diff-btn ' + (ex.difficulty === d[0] ? "is-on" : "") + '" data-diff="' + i + '" data-d="' + d[0] + '" type="button" aria-pressed="' + (ex.difficulty === d[0]) + '">' + d[1] + '</button>';
    }).join("");

    var flagged = ex.flag && ex.flag.bodyPart;
    var skipped = engine.skipped(ex);
    /* A skipped exercise shows the substitution's advice where the set inputs
       and the original cues were: logging into it would be logging pain. */
    var skipSub = skipped ? DB.substitute(ex.pattern, ex.flag.bodyPart, "sharp", s.era) : null;
    var skipCue = skipSub ? skipSub.cue : "Rest it today; do gentle pain-free mobility only.";
    var cueHtml = skipped
      ? '<p style="margin:0">' + esc(skipCue) + '</p>'
      : '<ul style="margin:0;padding-left:18px;display:grid;gap:6px">' + ex.cues.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + '</ul>' +
        (ex.mistakes.length ? '<p class="mt-4" style="color:var(--warn)"><b>Avoid:</b> ' + esc(ex.mistakes[0]) + '</p>' : "");
    /* Prescription first: exercise, setup, sets × range (C5). A draft from
       before v4 has one target and no prescription. */
    var setup = ex.rx ? setupText(ex.rx) : "";
    return '<div class="exq ' + (flagged ? "is-flagged" : "") + '" id="workout-ex-' + i + '" data-block="' + i + '">' +
      '<div class="exq__top"><div><div class="exq__name">' + esc(ex.name) + '</div>' +
        '<div class="exq__meta">' + esc(exLabel(ex)) +
        (setup ? ' · ' + esc(setup) : "") +
        (ex.range ? ' · ' + rangeText(ex) : ' · TARGET ' + ex.target + ' ' + unit + ' × ' + ex.sets.length) +
        ' · REST ' + (ex.restSec || 90) + 's</div>' +
        '<button class="exq__rest" data-rest="' + i + '" type="button" title="Start rest timer">' +
          '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>Rest</button></div>' +
      '</div>' +
      '<div class="exq__body stack">' +
        (skipped ? '<div class="badge badge--warn" style="align-self:flex-start"><span class="dot"></span>Skipped today · ' + esc(prettyPart(ex.flag.bodyPart)) + '</div>' + '<p class="muted text-sm" style="margin:0">' + esc(skipCue) + '</p>'
          : flagged ? '<div class="badge badge--warn" style="align-self:flex-start"><span class="dot"></span>Swapped: ' + esc(ex.flag.substitutedTo || "modified") + '</div>' : "") +
        (ex.swapped ? '<div class="badge badge--secondary" style="align-self:flex-start"><span class="dot"></span>Swapped movement</div>' : "") +
        (ex.reason ? '<p class="muted text-sm" data-ex-reason style="margin:0">Why this one: ' + esc(ex.reason) + '</p>' : "") +
        (ex.note ? '<p class="muted text-sm" data-ex-note style="margin:0">' + esc(ex.note) + '</p>' : "") +
        (skipped ? "" : rxLinesHtml(ex, false)) +
        (skipped ? "" : '<div>' + sets + '</div>') +
        '<div class="collapsible" data-coach="' + i + '"><button class="collapsible__head" data-collapsible type="button" aria-expanded="false">' +
          'Form cues &amp; coaching' +
          '<svg class="collapsible__chev ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button>' +
          '<div class="collapsible__body"><div class="collapsible__inner"><div class="collapsible__pad">' +
            cueHtml +
          '</div></div></div>' +
        '</div>' +
        '<div class="row between wrap" style="gap:var(--sp-3)">' +
          (skipped ? "" : '<div><div class="field__label mb-2">How did it feel?</div><div class="diff-grp">' + diff + '</div></div>') +
          '<button class="btn btn--ghost btn--sm" data-guide="' + i + '" data-exid="' + ex.id + '" type="button">' +
            '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>' +
            'How to do this</button>' +
          /* A skill's rung is chosen in Skills; a one-off swap would log a
             movement the track's evidence can't read. */
          (ex.skill ? '<button class="btn btn--ghost btn--sm" data-skill-rung="' + esc(ex.skill) + '" type="button">Change rung in Skills</button>'
          : '<button class="btn btn--ghost btn--sm" data-swap="' + i + '" type="button">' +
            '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7"/></svg>' +
            'Swap exercise</button>') +
          '<button class="btn btn--ghost btn--sm" data-flag="' + i + '">' +
            '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 22V4M4 4h13l-2 4 2 4H4"/></svg>' +
            (flagged ? "Edit pain flag" : "Something hurts?") + '</button>' +
        '</div>' +
        '<div id="swap-panel-' + i + '"></div>' +
        '<div id="flag-panel-' + i + '"></div>' +
      '</div>' +
    '</div>';
  }

  function wireActive(el, w) {
    wireNextWorkoutCard(el);
    if (!el._workoutContinueWired) {
      el._workoutContinueWired = true;
      el.addEventListener("click", function (event) {
        var b = event.target.closest("[data-workout-continue]");
        if (!b) return;
        var target = el.querySelector('[data-ex="' + b.dataset.workoutContinue + '"][data-set="' + b.dataset.workoutContinueSet + '"]') ||
          el.querySelector("#workout-ex-" + b.dataset.workoutContinue);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    /* The whole labelled button toggles the drill; its timer is separate. */
    el.querySelectorAll("[data-check]").forEach(function (c) {
      c.addEventListener("click", function (e) {
        if (e.target.closest(".mini-timer")) return; // timer button handled separately
        var kind = c.dataset.check, idx = Number(c.dataset.idx);
        var arr = kind === "mob" ? w.mobility.done : w[kind === "warm" ? "warmup" : "cooldown"];
        arr[idx] = !arr[idx];
        var row = c.closest(".check");
        if (row) row.classList.toggle("is-done", arr[idx]);
        c.setAttribute("aria-pressed", String(arr[idx]));
        setWorkout(w);
      });
    });

    /* mini timers on warm-up / cool-down drills */
    el.querySelectorAll(".mini-timer").forEach(function (b) {
      if (b.dataset.holdtimer) return; // hold timers wired separately below
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        rtStart(Number(b.dataset.timer) || 30, b.dataset.timerLabel || "Drill");
      });
    });

    /* hold-timer buttons on timed-hold exercise sets */
    el.querySelectorAll("[data-holdtimer]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var m = b.dataset.holdtimer.match(/^(\d+)-(\d+)$/); if (!m) return;
        var ei = +m[1], si = +m[2], ex = w.exercises[ei];
        var target = Number(ex.target) || 30;
        var timed = isTimed(ex.id);
        rtStart(target, (timed ? "Timed · " : "Hold · ") + ex.name, function () {
          // auto-log the achieved hold + mark the set done
          var stt = ex.sets[si];
          if (stt.value == null || stt.value === "") stt.value = target;
          stt.done = true;
          setWorkout(w);
          updateActiveProgress(el, w);
          var doneBtn = el.querySelector('[data-donebtn="' + ei + "-" + si + '"]');
          if (doneBtn) { doneBtn.classList.add("is-on"); doneBtn.setAttribute("aria-pressed", "true"); }
          var inp = el.querySelector('[data-stepper="set-' + ei + "-" + si + '"] .stepper__inp');
          if (inp && (inp.value === "" || inp.value == null)) inp.value = target;
          App.toast((timed ? "Set logged: " : "Hold logged: ") + target + "s.", "success");
        });
      });
    });

    /* rep steppers */
    wireSteppers(el, function (id, val) {
      var m = id.match(/^set-(\d+)-(\d+)$/);
      if (m) { w.exercises[+m[1]].sets[+m[2]].value = val; setWorkout(w); updateActiveProgress(el, w); }
    });
    /* weight steppers (decimal) */
    el.querySelectorAll("[data-wt]").forEach(function (st) {
      var ref = st.dataset.wt.split("-"); var ei = +ref[0], si = +ref[1];
      var inp = st.querySelector(".stepper__inp");
      st.querySelectorAll("[data-wstep]").forEach(function (b) {
        b.addEventListener("click", function () {
          var cur = Number(inp.value) || 0; cur = lib.clamp(cur + Number(b.dataset.wstep), 0, 200);
          inp.value = cur; w.exercises[ei].sets[si].weight = cur; setWorkout(w);
        });
      });
      inp.addEventListener("change", function () { w.exercises[ei].sets[si].weight = Number(inp.value) || 0; setWorkout(w); });
    });
    /* A check confirms the entered result; it must not invent target reps. */
    el.querySelectorAll("[data-donebtn]").forEach(function (b) {
      b.addEventListener("click", function () {
        var ref = b.dataset.donebtn.split("-"); var ei = +ref[0], si = +ref[1];
        var stt = w.exercises[ei].sets[si];
        if (!stt.done && !(Number(stt.value) > 0)) {
          var inp = el.querySelector('[data-stepper="set-' + ei + '-' + si + '"] .stepper__inp');
          if (inp) inp.focus();
          App.toast("Enter the reps or seconds you completed before marking this set complete.", "info");
          return;
        }
        stt.done = !stt.done;
        b.classList.toggle("is-on", stt.done);
        b.setAttribute("aria-pressed", String(stt.done));
        b.setAttribute("aria-label", (stt.done ? "Unmark " : "Mark ") + w.exercises[ei].name + " set " + (si + 1) + " complete");
        setWorkout(w);
        updateActiveProgress(el, w);
        if (stt.done) rtStart(w.exercises[ei].restSec || RT.last || 90, "Rest · " + w.exercises[ei].name);
      });
    });
    /* per-exercise rest control: prompt for duration, remember it, start */
    el.querySelectorAll("[data-rest]").forEach(function (b) {
      b.addEventListener("click", function () {
        var ei = +b.dataset.rest, ex = w.exercises[ei];
        var cur = ex.restSec || RT.last || 90;
        var v = prompt("Rest for this exercise (seconds):", cur);
        if (v == null) { rtStart(cur, "Rest · " + ex.name); return; }
        var n = lib.clamp(parseInt(v, 10) || cur, 5, 600);
        ex.restSec = n; setWorkout(w); rtStart(n, "Rest · " + ex.name);
        var meta = b.parentNode.querySelector(".exq__meta");
        if (meta) meta.innerHTML = meta.innerHTML.replace(/REST \d+s/, "REST " + n + "s");
      });
    });
    /* difficulty */
    el.querySelectorAll("[data-diff]").forEach(function (b) {
      b.addEventListener("click", function () {
        var ei = +b.dataset.diff;
        w.exercises[ei].difficulty = b.dataset.d;
        el.querySelectorAll('[data-diff="' + ei + '"]').forEach(function (x) {
          x.classList.toggle("is-on", x === b); x.setAttribute("aria-pressed", String(x === b));
        });
        setWorkout(w);
      });
    });
    /* Step up / Repeat, and the one-time upgrade card */
    wireDecide(el, w, function () { App.refresh(); });
    wireUpgradeCard(el);
    wireRecovery(el);
    /* exercise guide modal */
    el.querySelectorAll("[data-guide]").forEach(function (b) {
      b.addEventListener("click", function () { openGuideModal(b.dataset.exid); });
    });
    /* swap exercise */
    el.querySelectorAll("[data-swap]").forEach(function (b) {
      b.addEventListener("click", function () { openSwapPanel(+b.dataset.swap, w); });
    });
    /* The draft is saved on every set, so leaving for Skills loses nothing. */
    el.querySelectorAll("[data-skill-rung]").forEach(function (b) {
      b.addEventListener("click", function () { App.skills.openTrack(b.dataset.skillRung); });
    });
    /* flag pain */
    el.querySelectorAll("[data-flag]").forEach(function (b) {
      b.addEventListener("click", function () { openFlagPanel(+b.dataset.flag, w); });
    });
    /* notes */
    var nt = document.getElementById("sess-notes");
    if (nt) nt.addEventListener("input", function () { w.notes = nt.value; setWorkout(w); });

    /* discard / complete */
    document.getElementById("discard-session").addEventListener("click", function () {
      App.openModal && ensureConfirm("Discard this session?", "Nothing will be logged.", "Discard", "danger", function () {
        clearWorkout(); rtStop(); App.refresh(); App.toast("Session discarded.", "info");
      });
    });
    document.getElementById("complete-session").addEventListener("click", function () { completeSession(w); });
    var printBtn = document.getElementById("print-session");
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
  }


  /* -----------------------------------------------------------------------
     EXERCISE GUIDE MODAL
     ----------------------------------------------------------------------- */
  function openGuideModal(exId) {
    /* The Exercises section is the guide now (plan E3): the workout, Skills and
       the directory open the same page. The modal below stays as the fallback
       for a build where directory.js didn't load. */
    if (window.App && App.directory && App.directory.has(exId) && App.directory.open(exId)) return;
    var ex = (window.EXERCISE_DB && window.EXERCISE_DB[exId]) || (DB && DB.getExercise && DB.getExercise(exId));
    if (!ex) {
      // Fallback: try looking up by pattern + level from DB
      App.toast("Exercise guide not found for: " + exId, "warn");
      return;
    }

    var prog = App.PROGRESSIONS[ex.pattern] || {};
    var modeStr = ex.mode === "hold" ? (isTimed(ex.id) ? "Timed work (" : "Timed hold (") + ex.unit + ")" : "Reps-based (" + ex.unit + ")";
    var equipStr = (ex.equipment && ex.equipment.length) ? ex.equipment.join(", ") : "Bodyweight only";

    document.getElementById("guide-pattern").textContent = (prog.label || ex.pattern).toUpperCase();
    document.getElementById("guide-level-badge").textContent = swapLevel(ex);
    document.getElementById("guide-title").textContent = ex.name;
    document.getElementById("guide-sub").textContent = modeStr + "  ·  " + equipStr;

    /* Phase visualiser. Rendered fresh each open rather than cached: it owns
       a rAF tween and SVG bound to one exercise's rig, and reusing that across
       exercises is how a pull-up ends up drawn as a squat. */
    var phaseHost = document.getElementById("guide-phases");
    var phaseWrap = document.getElementById("guide-phases-wrap");
    if (phaseHost) {
      if (App.phases) {
        App.phases.render(phaseHost, exId);
        if (phaseWrap) phaseWrap.hidden = !phaseHost.firstChild;
      } else if (phaseWrap) {
        phaseWrap.hidden = true;
      }
    }

    // Technique cues
    var cuesList = document.getElementById("guide-cues");
    cuesList.innerHTML = (ex.cues || []).map(function (c) {
      return "<li>" + App.util.escapeHtml(c) + "</li>";
    }).join("");

    // Mistakes
    var mistakesWrap = document.getElementById("guide-mistakes-wrap");
    var mistakesList = document.getElementById("guide-mistakes");
    if (ex.mistakes && ex.mistakes.length) {
      mistakesList.innerHTML = ex.mistakes.map(function (m) {
        return "<li>" + App.util.escapeHtml(m) + "</li>";
      }).join("");
      mistakesWrap.style.display = "";
    } else {
      mistakesWrap.style.display = "none";
    }

    /* When to step up: the generated rule, never the DB's readiness prose,
       which predates the ranges and would contradict the card (A12). */
    var readinessWrap = document.getElementById("guide-readiness-wrap");
    var readinessTxt = document.getElementById("guide-readiness");
    var rule = window.Training && window.TRAINING_DATA.EXERCISES[exId] ? ruleText(rxStart(exId)) : null;
    if (rule) {
      readinessTxt.textContent = rule;
      readinessWrap.style.display = "";
    } else {
      readinessWrap.style.display = "none";
    }

    // Injury
    var injuryWrap = document.getElementById("guide-injury-wrap");
    var injuryTxt = document.getElementById("guide-injury");
    if (ex.injury) {
      injuryTxt.textContent = ex.injury;
      injuryWrap.style.display = "";
    } else {
      injuryWrap.style.display = "none";
    }

    App.openModal("modal-guide");
  }

  /* Expose globally so other parts (e.g. the Skills view) can open the guide. */
  window.openGuideModalGlobal = openGuideModal;

  /* -----------------------------------------------------------------------
     SWAP EXERCISE — pick a different movement for the same pattern, with
     equipment availability shown so you can avoid gear you don't have.
     ----------------------------------------------------------------------- */
  var EQUIP_LABEL = {
    pullupBar: "pull-up bar", dumbbells: "dumbbells", bench: "bench",
    kettlebells: "kettlebells", rings: "rings", bands: "resistance bands",
    parallettes: "parallettes", dipBars: "dip bars", lowBar: "waist-height bar",
    vest: "weighted vest", abWheel: "ab wheel", jumpRope: "jump rope", box: "sturdy box",
    barbell: "barbell and rack", nordicAnchor: "ankle anchor"
  };
  window.EQUIP_LABEL_GLOBAL = EQUIP_LABEL;
  function openSwapPanel(i, w, showExcluded) {
    var ex = w.exercises[i];
    var panel = document.getElementById("swap-panel-" + i);
    if (!panel) return;
    // Toggle closed if already open (Show excluded redraws it open)
    if (!showExcluded && panel.getAttribute("data-open") === "1") { panel.innerHTML = ""; panel.removeAttribute("data-open"); return; }
    panel.setAttribute("data-open", "1");

    /* The slot's movements, allowed first. A draft from before v4 has no
       slot; its pattern is the slot it trained. The current one can't be
       picked again. */
    var rows = swapRows(ex.slot || ex.pattern, ex.id, showExcluded, function (alt) {
      return 'data-swapto="' + i + "|" + alt.id + '"' + (alt.id === ex.id ? " disabled" : "");
    });

    panel.innerHTML =
      '<div class="card card--glass stack mt-2" style="border-color:rgba(204,0,0,.25)">' +
        '<div class="row between"><div class="field__label">Swap ' + cap(ex.pattern) + ' movement</div>' +
          '<button class="btn btn--ghost btn--sm" data-swapclose="' + i + '" type="button">Close</button></div>' +
        '<p class="faint text-xs" style="margin:0">Movements you have the gear for, and nothing you set rules out, are marked <b style="color:var(--success)">ready</b>. A swapped movement starts at the bottom of its own range, and what you log counts as its history, not the original\'s.</p>' +
        '<div class="swap-list">' + rows.html + '</div>' + showExcludedHtml(rows.hidden, 'data-swap-excluded="' + i + '"') +
      '</div>';
    var more = panel.querySelector("[data-swap-excluded]");
    if (more) more.addEventListener("click", function () { openSwapPanel(i, w, true); });

    panel.querySelectorAll("[data-swapto]").forEach(function (b) {
      b.addEventListener("click", function () {
        var parts = b.dataset.swapto.split("|");
        doSwap(+parts[0], parts[1], w);
      });
    });
    var closeBtn = panel.querySelector("[data-swapclose]");
    if (closeBtn) closeBtn.addEventListener("click", function () { panel.innerHTML = ""; panel.removeAttribute("data-open"); });
  }

  function doSwap(i, newId, w) {
    var alt = DB.getExercise ? DB.getExercise(newId) : window.EXERCISE_DB[newId];
    if (!alt || !TD().EXERCISES[newId]) { App.toast("Couldn't find that movement.", "warn"); return; }
    var ex = w.exercises[i];
    /* A real id with its own prescription: the sets you log belong to the
       movement you did, at the bottom of its range. Keeping the old target
       turned 8 reps into 8 seconds; keeping the old id filed the history
       under a movement you didn't do. */
    applyMovement(ex, rxStart(newId, { why: "swapped for this session", grip: standingGrip(App.getState(), ex.slot) }));
    ex.swapped = true;
    ex.note = "";
    setWorkout(w);
    App.refresh();
    App.toast("Swapped to " + alt.name + ".", "success");
  }

  /* Point a workout exercise at another movement and prescription, keeping
     its slot, set count, rest, rating and flag. */
  var MOVEMENT_FIELDS = ["id", "name", "pattern", "level", "mode", "unit", "equipment", "cues", "mistakes",
                         "readiness", "injury", "rx", "range", "target", "targetDelta", "targetReason"];
  function applyMovement(ex, rx) {
    var db = DB.getExercise(rx.exerciseId);
    rx.sets = ex.sets.length;
    ex.id = rx.exerciseId; ex.name = db.name; ex.pattern = db.pattern || ex.pattern;
    ex.level = db.level || null; ex.mode = db.mode; ex.unit = db.unit;
    ex.equipment = db.equipment || []; ex.cues = db.cues || []; ex.mistakes = db.mistakes || [];
    ex.readiness = db.readiness || ""; ex.injury = db.injury || "";
    ex.rx = rx; ex.range = rx.range;
    ex.target = rx.range[0] != null ? rx.range[0] : rx.range[1];
    ex.targetDelta = 0; ex.targetReason = "";
  }
  function snapshotMovement(ex) {
    var o = {};
    MOVEMENT_FIELDS.forEach(function (k) { if (k in ex) o[k] = JSON.parse(JSON.stringify(ex[k])); });
    return o;
  }

  function openFlagPanel(i, w) {
    var ex = w.exercises[i];
    var parts = DB.bodyPartsFor(ex.pattern);
    var panel = document.getElementById("flag-panel-" + i);
    /* No swap list (coverage work, R3-1): the joints the movement loads, else
       every joint. The flag still records the pain and keeps the sets out of
       evidence, and sharp still skips — there is just nothing to swap to. */
    if (!parts.length) {
      var load = TD().JOINT_STRESS[ex.id] || {};
      parts = TD().JOINTS.filter(function (j) { return load[j]; });
      if (!parts.length) parts = TD().JOINTS.slice();
    }
    var f = ex.flag || { bodyPart: parts[0], severity: "mild" };
    function draw() {
      var sub = DB.substitute(ex.pattern, f.bodyPart, f.severity, App.getState().era);
      panel.innerHTML =
        '<div class="card card--glass stack mt-2" style="border-color:rgba(204,0,0,.3)">' +
          '<div class="grid grid-2">' +
            field("Where does it hurt?", '<select class="select" id="flag-bp-' + i + '">' +
              parts.map(function (p) { return opt(p, prettyPart(p), f.bodyPart); }).join("") + '</select>') +
            field("How bad?", '<select class="select" id="flag-sev-' + i + '">' +
              ["mild", "moderate", "sharp"].map(function (sv) { return opt(sv, cap(sv), f.severity); }).join("") + '</select>') +
          '</div>' +
          (sub ? '<div class="card" style="padding:var(--sp-3)"><div class="drow__sub">' + (f.severity === "sharp" ? "Suggested — skip it" : "Suggested swap") + '</div>' +
            '<div class="drow__title">' + esc(sub.name) + '</div><p class="muted text-xs mt-2">' + esc(sub.cue) + '</p></div>' : "") +
          '<div class="row" style="gap:var(--sp-2)">' +
            '<button class="btn btn--secondary btn--sm grow" id="flag-apply-' + i + '">' + (f.severity === "sharp" ? "Skip it today" : sub ? "Apply swap" : "Flag it") + '</button>' +
            (ex.flag ? '<button class="btn btn--ghost btn--sm" id="flag-clear-' + i + '">Clear</button>' : "") +
          '</div>' +
        '</div>';
      document.getElementById("flag-bp-" + i).addEventListener("change", function (e) { f.bodyPart = e.target.value; draw(); });
      document.getElementById("flag-sev-" + i).addEventListener("change", function (e) { f.severity = e.target.value; draw(); });
      document.getElementById("flag-apply-" + i).addEventListener("click", function () {
        restoreMovement();   // re-flagging starts from the movement that hurt
        var sub2 = DB.substitute(ex.pattern, f.bodyPart, f.severity, App.getState().era);
        ex.flag = { bodyPart: f.bodyPart, severity: f.severity, substitutedTo: sub2 ? sub2.name : null };
        /* A substitute that is a real exercise you can do becomes that
           exercise, at the bottom of its range, so its sets are its history
           (plan C3, T15). They still aren't evidence for a step: a flagged
           exercise never is (C2). Any other substitute keeps the original
           id with the substitute's name and cue. Sharp means skip, so the
           exercise keeps its own name: the saved record says which movement
           was skipped, not "Skip push pattern".
           A substitute that names a grip (Fist Push-up — plan C1) is the
           same exercise on that grip: its rx says so, it keeps its name, and
           the flag still keeps it out of evidence and in your flag history. */
        var toId = sub2 && f.severity !== "sharp" && TD().SUBSTITUTION_IDS[sub2.name];
        var asSetup = sub2 && f.severity !== "sharp" && TD().SUBSTITUTION_SETUPS[sub2.name];
        if (toId && toId !== ex.id && window.Training.owns(App.getState().equipment, toId)) {
          ex.unswapped = snapshotMovement(ex);
          ex.flag.fromId = ex.id;
          applyMovement(ex, rxStart(toId, { why: "pain swap from " + ex.name }));
        } else if (asSetup && asSetup.grip && ex.rx && gripCapable(ex.id)) {
          ex.unswapped = snapshotMovement(ex);
          ex.rx = withGrip(ex.rx, asSetup.grip);
          restoreName();
        } else if (sub2 && f.severity !== "sharp") { ex.name = sub2.name; } else { restoreName(); }
        setWorkout(w); App.refresh();
        App.toast(f.severity === "sharp" ? "Skipping this exercise today." : sub2 ? "Swapped to a joint-friendly variation."
          : "Flagged — today's sets won't count toward a step.", "warn");
      });
      var clr = document.getElementById("flag-clear-" + i);
      if (clr) clr.addEventListener("click", function () { restoreMovement(); ex.flag = null; restoreName(); setWorkout(w); App.refresh(); });
    }
    /* A relabel keeps the id, so the DB still knows the real name. */
    function restoreName() { var base = DB.getExercise && DB.getExercise(ex.id); if (base) ex.name = base.name; }
    /* A real-id pain swap is undone from the snapshot taken before it. */
    function restoreMovement() {
      if (!ex.unswapped) return;
      var o = ex.unswapped;
      Object.keys(o).forEach(function (k) { ex[k] = o[k]; });
      delete ex.unswapped;
    }
    draw();
  }

  function completeSession(w, partialConfirmed) {
    /* Read-only: refuse before finalizing, so the logged sets stay in the
       draft (a separate key) instead of being cleared after a save that
       never happened. */
    if (App.readOnly()) {
      App.toast("Fitness is read-only on this device — this workout wasn't saved. Your sets stay in the draft.", "danger", 6000);
      return;
    }
    /* require at least one logged value */
    var any = w.exercises.some(function (ex) { return !engine.skipped(ex) && ex.sets.some(function (st) { return Number(st.value) > 0; }); });
    if (!any) { App.toast("Log at least one set before completing.", "warn"); return; }
    var planned = 0, entered = 0;
    w.exercises.forEach(function (ex) {
      if (engine.skipped(ex)) return;
      ex.sets.forEach(function (st) { planned++; if (Number(st.value) > 0) entered++; });
    });
    if (!partialConfirmed && entered < planned) {
      ensureConfirm("Finish a partial session?", entered + " of " + planned +
        " planned sets have a value. The remaining sets will be recorded as zero. You can keep logging instead.",
        "Finish partial", "primary", function () { completeSession(w, true); });
      return;
    }

    var res = engine.finalizeSession(w);
    clearWorkout(); rtStop();

    /* celebrate */
    res.prs.forEach(function (p) {
      App.toast("New " + (p.kind === "hold" && isTimed(p.exerciseId) ? "longest-set" : p.kind) + " PR · " + p.exercise + ": " + p.value + (p.kind === "hold" ? "s" : ""), "success", 4200);
    });
    res.levelUps.forEach(function (l) {
      App.toast("Level up! " + cap(l.pattern) + " → L" + l.level + " · " + l.name, "success", 4600);
    });
    var grad = engine.checkGraduation();
    if (grad) App.toast("Era II reached — all five benchmarks cleared.", "success", 5000);

    App.toast("Session logged" + (w.dayKey && w.dayKey !== lib.today() ? " " + Hub.dayWord(w.dayKey) : "") + ": " +
      countsText(exerciseCounts(w.exercises)) + ".", "info");

    /* WELLNESS HUB INTEGRATION
       Tell the hub a workout just landed so the fitness streak, the dashboard
       and any fitness badges update immediately rather than on the next tab
       change. Guarded so this file still runs standalone. */
    if (window.WellnessHub && window.WellnessHub.onWorkoutLogged) {
      window.WellnessHub.onWorkoutLogged(res);
    }

    App.showSection("dashboard");
  }

  /* ---- Today html helpers ---- */
  /* "3 × 6–12 reps", "3 × 10–20 s", "3 × 6–12 reps /side". A draft from before v4 has
     one target and no range. */
  function rangeText(ex) {
    var n = ex.sets.length, r = ex.range;
    if (!r) return n + " × " + ex.target;
    var sec = (ex.rx ? ex.rx.unit === "sec" : ex.mode === "hold") ? " s" : " reps";
    var side = (TD().rangeFor(ex.id) || {}).perSide ? " /side" : "";
    var body = r[0] != null ? r[0] + "–" + r[1] : r[1] != null ? "up to " + r[1] : "attempts";
    if (sec === " s" && isTimed(ex.id)) return n + " sets for " + body + sec + side;
    return n + " × " + body + sec + side;
  }
  /* The left tag in the swap lists: the ladder level, KG for loaded work,
     a dash for the unnumbered movements (Incline Push-up, the rows). */
  function swapLevel(alt) {
    var e = TD().EXERCISES[alt.id];
    return alt.level ? "L" + alt.level : (e && e.loadMode ? "KG" : "—");
  }
  function swapSub(alt) {
    var e = TD().EXERCISES[alt.id] || {};
    return (alt.mode === "hold" ? (isTimed(alt.id) ? "timed work" : "timed hold") : "reps") +
      (e.loadMode ? " · loaded, " + (e.loadMode === "perHand" ? "kg per hand" : "kg total") : "") +
      (e.branch === "skill" ? " · optional" : "");
  }

  /* ---- The prescription card (plan C5) ----
     Every line is read from Training.recommend, recomputed on each render;
     nothing here is stored except the choice a Step up / Repeat button makes
     through engine.decide. */

  /* "Table height (~75 cm)", "Knees bent", "12.5 kg per hand" — or "". */
  function setupText(rx) {
    var S = TD().SETUPS[rx.exerciseId], st = rx.setup || {}, out = [];
    if (S) {
      var v = S.values.filter(function (x) { return x.id === st[S.key]; })[0];
      if (v) out.push(v.label + (S.key === "surface" ? " height" : "") + (v.cm ? " (~" + v.cm + " cm)" : ""));
    }
    if (st.loadMode) out.push(st.loadKg != null ? st.loadKg + " kg " + (st.loadMode === "perHand" ? "per hand" : "total") : "load not set yet");
    if (st.grip === "knuckles") out.push("knuckles");
    return out.join(" · ");
  }
  /* "3 × 12", "3 × 20 s": every set at the top of the range. */
  function topText(rx) { return rx.sets + " × " + rx.range[1] + (rx.unit === "sec" ? " s" : ""); }
  function stepText(step) {
    if (step.kind === "movement") return (DB.getExercise(step.rx.exerciseId) || {}).name || step.rx.exerciseId;
    return setupText(step.rx).toLowerCase();
  }
  /* Where a double step lands, named in full when it leaves `from`'s
     movement: "Incline Push-up, table height (~75 cm)". */
  function landText(from, step) {
    var setup = setupText(step.rx).toLowerCase();
    if (step.rx.exerciseId === from.exerciseId) return setup;
    var name = (DB.getExercise(step.rx.exerciseId) || {}).name || step.rx.exerciseId;
    return name + (setup ? ", " + setup : "");
  }
  var NUM_WORD = ["no", "one", "two", "three", "four", "five"];
  var EFFORTS = [["easy", "Easy"], ["moderate", "Just right"], ["hard", "Hard"], ["failed", "Failed"], ["unsure", "Not sure"]];

  /* The rule as a sentence, from the same constants recommend() uses, so the
     card can't disagree with the decision (A12). null where there's no top. */
  function ruleText(rx) {
    if (!rx || !rx.range || rx.range[1] == null) return null;
    return "Step up after " + (NUM_WORD[TD().EVIDENCE_SESSIONS] || TD().EVIDENCE_SESSIONS) + " days at " + topText(rx) +
      ", rated easy or just right. A rule of thumb from your own logs, not a test — it can't see your form.";
  }

  /* The slot's recommendation, when this workout exercise IS the slot's
     prescription. A swap, a pain swap or an equipment fallback is a
     different prescription: it shows its history, never an offer. The slot's
     own set count is what's compared, so an Extended session still shows the
     standard prescription's evidence. Knuckles today is the same
     prescription on another grip (plan C1), so the grip isn't compared. */
  function cardRec(ex) {
    var key = exKey(ex);
    if (!key || !ex.rx || ex.swapped || engine.flagged(ex)) return null;
    var stored = engine.recordOf(key);
    var noGrip = function (setup) { var o = JSON.parse(JSON.stringify(setup || {})); delete o.grip; return JSON.stringify(o); };
    if (!stored || stored.off || stored.exerciseId !== ex.rx.exerciseId || noGrip(stored.setup) !== noGrip(ex.rx.setup)) return null;
    return engine.recommendFor(key);
  }

  /* The reason line, and the Step / Repeat buttons when there's a step to
     take and you haven't answered this evidence yet. */
  function reasonHtml(rec, rx, slot) {
    var top = topText(rx), N = TD().EVIDENCE_SESSIONS, line = "", asks = [];
    var days = rec.evidence.map(function (e) { return lib.fmtShort(e.day); });
    var stored = engine.recordOf(slot) || {};
    var REPEAT = ["repeat", "Repeat"];
    switch (rec.why) {
      case "ready":
        line = "Ready: " + top + " on " + days.join(" and ") + (rec.double && !rec.decision ? ", far past the top both times" : "");
        if (rec.decision) line += " — you chose to repeat. Your next session asks again.";
        else if (rec.double) {
          line += " — step up two, to " + landText(rx, rec.steps[1]) + "?";
          asks = [["step2", "Step up two"], ["step", "One step"], REPEAT];
        }
        else if (rec.step) { line += " — step up to " + stepText(rec.step) + "?"; asks = [["step", "Step up"], REPEAT]; }
        else {
          line += rec.heaviest ? " — the heaviest weight you've listed, and the end of this path." : " — the end of this path.";
          if (rec.options.length) line += " Optional next: " + rec.options.map(function (id) { return (DB.getExercise(id) || {}).name || id; }).join(", ") + ".";
          if (rec.unowned.length) line += " " + rec.unowned.map(function (id) { return (DB.getExercise(id) || {}).name + " needs " + missingGear(id, App.getState().equipment); }).join("; ") + ".";
        }
        /* A branch entry is a step you can take (plan C2), one button each. */
        if (!rec.decision && !rec.step) asks = rec.optionSteps.map(function (o) {
          return ["option", "Step into " + ((DB.getExercise(o.rx.exerciseId) || {}).name || o.rx.exerciseId), o.rx.exerciseId];
        }).concat(rec.optionSteps.length ? [REPEAT] : []);
        break;
      case "hold":
        /* Hold (plan C4): the evidence stands, the offer waits. */
        line = "Holding at " + top + " — you reached it on " + days.join(" and ") + ", and step-ups are paused on this slot. Turn Hold off in Program to be asked again.";
        break;
      case "declining":
        line = "Your totals fell " + rec.evidence.map(function (e) { return e.total; }).join(" → ") + " over your last " + rec.evidence.length + " sessions";
        if (rec.decision) line += " — you chose to repeat. Your next session asks again.";
        else { line += " — step back to " + stepText(rec.step) + "?"; asks = [["step", "Step back"], REPEAT]; }
        break;
      case "off-load":
        /* F1: the latest session was lifted at another weight, so nothing
           at the slot's load is evidence. Keep it, or take what you lift. */
        var was = rx.setup.loadKg + " kg", now = rec.loggedKg + " kg";
        line = "Logged at " + now + ", not " + was + ", on " + days[0];
        if (rec.decision) line += " — you chose to keep " + was + ". Your next session asks again.";
        else { line += " — set this slot to " + now + "?"; asks = [["load", "Set slot to " + now], ["repeat", "Keep " + was]]; }
        break;
      case "below-top": line = "Repeat: set " + (rec.belowSet + 1) + " below " + rec.hi + (rx.unit === "sec" ? " s" : ""); break;
      case "one-session": line = "Repeat: " + rec.atTop + " of " + N + " at " + top; break;
      case "same-day": line = "Repeat: your sessions at " + top + " were on one day — the next one needs another day"; break;
      case "effort": line = "Repeat: " + top + " reached, but not rated easy or just right each time"; break;
      case "no-standard": line = "This skill names no number to step up from — move on when it feels owned."; break;
      case "no-load": line = "Log the weight you use: a step up needs to know the load, so sessions without one don't count."; break;
      default:
        line = /^your assessment/.test(stored.why || "")
          ? "Unverified: you chose this at setup. Your first session here confirms it."
          : "Repeat: no session at this prescription yet";
    }
    /* Nothing rises inside a recovery block (D3): the evidence stands, the
       offer waits. */
    if (rec.action === "ready" && asks.length && engine.recoveryOn(lib.today())) {
      line = line.replace(/ — step up.*$/, " — the step waits until your recovery block ends.");
      asks = [];
    }
    return '<p class="text-sm" data-rx-reason style="margin:0">' + esc(line) + '</p>' +
      (asks.length ? '<div class="row" style="gap:var(--sp-2);flex-wrap:wrap">' + asks.map(function (a, i) {
        return '<button class="btn ' + (i ? "btn--ghost" : "btn--primary") + ' btn--sm" data-decide="' + slot + '" data-choice="' + a[0] + '"' +
          (a[2] ? ' data-to="' + esc(a[2]) + '"' : "") + ' type="button">' + esc(a[1]) + '</button>';
      }).join("") + '</div>' : "");
  }

  /* The card's lines under the exercise name: last comparable sets with
     their date, the reason, and (full) the rule. `compact` is the preview row. */
  function rxLinesHtml(ex, compact) {
    if (!ex.rx || !ex.rx.range) return "";
    var rec = cardRec(ex);
    var hist = rec ? rec.history : window.Training.comparable(engine.completedSessions(), ex.rx);
    var last = hist[hist.length - 1];
    var lastLine = last
      ? "Last: " + last.values.join(" / ") + (ex.rx.unit === "sec" ? " s" : "") + " · " + lib.fmtShort(last.day) +
        (rec && rec.why === "below-top" ? " — aim to add a rep." : "")
      : "";
    var slotRx = rec ? engine.recordOf(exKey(ex)) : ex.rx;
    if (compact) return rec ? '<div class="faint" data-pv-reason style="margin:0 0 var(--sp-2)">' + reasonHtml(rec, slotRx, exKey(ex)) + '</div>' : "";
    var rule = ruleText(slotRx);
    return '<div class="stack" data-rx-lines style="gap:var(--sp-2)">' +
      (lastLine ? '<p class="muted text-sm mono" data-rx-last style="margin:0">' + esc(lastLine) + '</p>' : "") +
      (rec ? reasonHtml(rec, slotRx, exKey(ex))
           : ex.swapped || engine.flagged(ex) ? '<p class="faint text-xs" style="margin:0">Swapped for this session — logged as this movement\'s history. If your program reaches it, these sessions count.</p>' : "") +
      (rule ? '<p class="faint text-xs" data-rx-rule style="margin:0">' + esc(rule) + '</p>' : "") +
    '</div>';
  }

  /* Step / Repeat. In a workout, a step applies to today only while nothing
     is logged on that exercise; otherwise it starts with your next session,
     so logged sets are never re-filed under a movement you didn't do. */
  function wireDecide(root, w, after) {
    root.querySelectorAll("[data-decide]").forEach(function (b) {
      b.addEventListener("click", function () {
        var slot = b.dataset.decide, choice = b.dataset.choice;
        var rec = engine.recommendFor(slot), from = engine.recordOf(slot);
        var next = engine.decide(slot, choice, b.dataset.to);
        if (!next) return;
        var msg = choice === "repeat" && rec.why === "off-load" ? "Keeping " + from.setup.loadKg + " kg — new sessions will ask again."
          : choice === "repeat" ? "Repeating " + ((DB.getExercise(next.exerciseId) || {}).name || "") + " — new sessions will ask again."
          : choice === "load" ? "Slot set to " + rec.loggedKg + " kg."
          : choice === "step2" ? "Stepped up two, to " + landText(from, rec.steps[1]) + "."
          : choice === "option" ? "Stepped into " + ((DB.getExercise(next.exerciseId) || {}).name || next.exerciseId) + "."
          : (rec.action === "reduce" ? "Stepped back to " : "Stepped up to ") + stepText(rec.step) + ".";
        if (w && choice !== "repeat") {
          var later = false;
          w.exercises.forEach(function (ex) {
            if (exKey(ex) !== slot || ex.swapped || engine.flagged(ex)) return;
            if (ex.sets.some(function (st) { return Number(st.value) > 0; })) { later = true; return; }
            applyMovement(ex, JSON.parse(JSON.stringify(next)));
            var kg = next.setup && next.setup.loadKg;
            if (kg != null) ex.sets.forEach(function (st) { st.weight = kg; });
          });
          setWorkout(w);
          if (later) msg += " It starts next session — this one keeps the sets you've logged.";
        }
        App.toast(msg, "success", 4200);
        if (after) after();
      });
    });
  }

  /* Complete, partial and skipped, counted separately (C5): a set counts as
     done when it holds a value above 0. Skipped means a sharp pain flag or
     nothing logged at all. Takes saved exercises ({ reps }) or a draft's
     ({ value }). */
  function exerciseCounts(exercises) {
    var c = { complete: 0, partial: 0, skipped: 0 };
    (exercises || []).forEach(function (ex) {
      var sets = ex.sets || [];
      var n = sets.filter(function (st) { return Number(st.reps != null ? st.reps : st.value) > 0; }).length;
      if (ex.skipped || engine.skipped(ex) || !n) c.skipped++;
      else if (n < sets.length) c.partial++;
      else c.complete++;
    });
    return c;
  }
  function countsText(c) { return c.complete + " complete · " + c.partial + " partial · " + c.skipped + " skipped"; }

  /* C6: the first workout after the v4 upgrade gets one card, until you
     dismiss it on this device. Only a migrated save has "carried over"
     slots; a new profile set up by the assessment never sees it. */
  var UPGRADE_SEEN_KEY = "v4.upgradeSeen";
  function upgradeCardHtml(s) {
    var slots = s.training.slots, migrated = Object.keys(slots).some(function (k) { return /^carried over/.test((slots[k] || {}).why || ""); });
    if (!migrated || App.util.uiGet(UPGRADE_SEEN_KEY, false)) return "";
    var item = function (b, t) { return '<li><b>' + b + '</b> ' + t + '</li>'; };
    return '<div class="wh-advice wh-advice--info mt-4" data-upgrade-card role="status"><div>' +
      '<div class="wh-advice__title">Workouts progress differently now</div>' +
      '<ul class="wh-advice__body" style="margin:var(--sp-2) 0;padding-left:18px;display:grid;gap:6px">' +
        item("Targets are ranges.", "Every movement is 3 sets: 6–12 reps for most, 3–6 for negatives, or a hold range, not one number. Aim to add a rep; the top of the range is the finish line.") +
        item("A step up needs evidence.", "Two sessions on different days with every set at the top, rated easy or just right — then the card asks, and you choose. Points no longer move anything.") +
        item("Your old sessions don't count as evidence.", "They didn't save the prescription they were done at, and an old \"just right\" can't be told from no answer. They stay in your history.") +
        (s.era === 2
          ? item("One thing did change.", "The Era II movement that was added to the end of each session is gone. Loaded movements are in every slot's Swap list instead, for any equipment you own.")
          : item("Nothing in your program changed.", "Each movement is the one you were already on.")) +
      '</ul>' +
      '<button class="btn btn--ghost btn--sm" data-upgrade-ok type="button">Got it</button></div></div>';
  }
  function wireUpgradeCard(el) {
    var b = el.querySelector("[data-upgrade-ok]");
    if (b) b.addEventListener("click", function () {
      App.util.uiSet(UPGRADE_SEEN_KEY, true);
      var card = el.querySelector("[data-upgrade-card]");
      if (card) card.remove();
    });
  }

  /* Equipment check (plan C6): the v5 upgrade split "pull-up bar" into four
     tokens and turned on the ones your own history shows you have. This is
     the one card that says so, with every token's state, so a token the app
     couldn't infer can be ticked here. Dismissed per device, like the v4
     card; the record it reads (training.equipmentCheck) syncs. A tick saves
     at once: it changes which movements your slots can use.
     v7 (plans/PLAN-yellow-dude.md) reuses it for six more items. Its record
     names the tokens to list, and it has its own dismissal key, so a device
     that already dismissed v5's card still sees v7's once, without v5's
     four. A record without `tokens` is v5's: the four, under v5's key. */
  var EQCHECK_V5 = ["dipBars", "lowBar", "bands", "parallettes"];
  var EQCHECK_TOKENS = [["dipBars", "Dip bars"], ["lowBar", "A waist-height bar"], ["bands", "Resistance bands"], ["parallettes", "Parallettes"],
    ["vest", "A weighted vest"], ["abWheel", "An ab wheel"], ["jumpRope", "A jump rope"], ["box", "A sturdy box"],
    ["barbell", "A barbell and a squat rack"], ["nordicAnchor", "An ankle anchor"]];
  function eqCheckSeenKey(chk) { return chk.tokens ? "v7.equipmentCheckSeen" : "v5.equipmentCheckSeen"; }
  function equipCheckHtml(s) {
    var chk = s.training && s.training.equipmentCheck;
    if (!chk || App.util.uiGet(eqCheckSeenKey(chk), false)) return "";
    var inf = chk.inferred || {}, list = Array.isArray(chk.tokens) ? chk.tokens : EQCHECK_V5;
    if (chk.tokens && App.util.uiGet("v5.equipmentCheckSeen", false))
      list = list.filter(function (k) { return EQCHECK_V5.indexOf(k) < 0; });
    var rows = EQCHECK_TOKENS.filter(function (t) { return list.indexOf(t[0]) >= 0; }).map(function (t) {
      var on = !!s.equipment[t[0]], from = inf[t[0]], ex = from && TD().EXERCISES[from.id];
      var why = from && ex
        ? "turned on for you: " + (from.from === "session" ? "you logged " : "your " + TD().SLOTS[ex.slot].label.toLowerCase() + " slot is ") + ((DB.getExercise(from.id) || {}).name || from.id)
        : on ? "on" : "off — tick it if you have it";
      return '<label class="row" style="gap:var(--sp-2);align-items:center"><input type="checkbox" data-eqcheck-tok="' + t[0] + '"' + (on ? " checked" : "") + '> ' +
        '<span class="text-sm"><b>' + esc(t[1]) + '</b> <span class="faint">· ' + esc(why) + '</span></span></label>';
    }).join("");
    return '<div class="wh-advice wh-advice--info mt-4" data-eqcheck role="status"><div>' +
      '<div class="wh-advice__title">Check your equipment</div>' +
      '<p class="wh-advice__body" style="margin:var(--sp-2) 0">' +
        (list.indexOf("dipBars") >= 0 ? '"Pull-up bar" used to stand for four different things. They\'re separate now: dip bars, a waist-height bar (for rows and straight-bar dips), resistance bands and parallettes. ' : "") +
        (list.indexOf("nordicAnchor") >= 0 ? 'Six more items can be listed now: a weighted vest, an ab wheel, a jump rope, a sturdy box or step, a barbell with a squat rack, and an ankle anchor — a strap, a partner or heavy furniture that holds your ankles for Nordic curls. ' : "") +
        'The app turned on what your own sessions show you have. Untick anything you don\'t, and tick what it couldn\'t know. Ticking saves at once.</p>' +
      '<div class="stack" style="gap:var(--sp-2);margin-bottom:var(--sp-3)">' + rows + '</div>' +
      '<button class="btn btn--ghost btn--sm" data-eqcheck-ok type="button">Looks right</button></div></div>';
  }
  function wireEquipCheck(el) {
    el.querySelectorAll("[data-eqcheck-tok]").forEach(function (b) {
      b.addEventListener("change", function () {
        var st = App.getState(), name = b.parentNode.querySelector("b").textContent;
        st.equipment[b.dataset.eqcheckTok] = b.checked;
        App.saveState();
        App.toast(name + (b.checked ? " on." : " off.") + " Your slots follow the equipment you list.", "info");
      });
    });
    var ok = el.querySelector("[data-eqcheck-ok]");
    if (ok) ok.addEventListener("click", function () {
      App.util.uiSet(eqCheckSeenKey(App.getState().training.equipmentCheck || {}), true);
      var card = el.querySelector("[data-eqcheck]");
      if (card) card.remove();
    });
  }

  /* Recovery block (plan D3), always visible while one is on: it changes
     your sets without a prompt on each workout, so it gets a persistent
     banner, and ending it is one click, not a dialog. With no block, the
     offer card appears after a sharp flag or two slots trending down, with
     the numbers that triggered it and a "Not now" that holds until
     something new happens. `plain` is the in-workout banner: the sets are
     already built, so it offers no buttons. */
  function recoveryHtml(s, plain) {
    var R = TD().RECOVERY_BLOCK, b = engine.recoveryOn(lib.today()), icon = '<span class="wh-advice__ic"></span>';
    if (b) {
      var day = lib.daysBetween(b.startKey, lib.today()) + 1, lastKey = lib.dayKey(lib.addDays(engine.recoveryEnd(b), -1));
      return '<div class="wh-advice wh-advice--warn mt-4" data-rb-banner role="status"><div>' +
        '<div class="wh-advice__title">Recovery block · day ' + day + ' of ' + b.days + '</div>' +
        '<p class="wh-advice__body" style="margin:var(--sp-2) 0">Working sets are cut to ' + Math.round(R.setFactor * 100) + '% (3 become 2) until ' + esc(lib.fmtShort(lastKey)) +
          '. Movements, ranges and rest are unchanged, nothing steps up, and these sessions don\'t count as evidence. The first session after it is a normal one.</p>' +
        (plain ? "" : '<button class="btn btn--ghost btn--sm" data-rb-end type="button">End block now</button>') + '</div></div>';
    }
    var o = plain ? null : engine.recoveryOffer();
    if (!o) return "";
    var why = o.kind === "flag"
      ? 'You flagged sharp ' + esc(prettyPart(o.flag.bodyPart).toLowerCase()) + ' pain on ' + esc(lib.fmtShort(Hub.dayOf(o.flag.dateISO))) + '.'
      : 'Your totals have fallen over the last three sessions on ' + o.slots.map(function (d) {
          var rx = s.training.slots[d.slot];
          return esc((DB.getExercise(rx.exerciseId) || {}).name || d.slot) + ' (' + d.totals.join(' → ') + ')';
        }).join(' and ') + '.';
    return '<div class="wh-advice wh-advice--info mt-4" data-rb-offer role="status"><div>' +
      '<div class="wh-advice__title">Start a ' + R.days + '-day recovery block?</div>' +
      '<p class="wh-advice__body" style="margin:var(--sp-2) 0">' + why + ' A block cuts working sets to ' + Math.round(R.setFactor * 100) + '% for ' + R.days +
        ' days (3 become 2) so you can recover. Movements, ranges and rest stay, nothing steps up, and the sessions don\'t count as evidence. It is a product rule, not a diagnosis: the app can\'t see pain you don\'t log.</p>' +
      '<div class="row" style="gap:var(--sp-2);flex-wrap:wrap"><button class="btn btn--secondary btn--sm" data-rb-start="' + o.kind + '" type="button">Start the block</button>' +
      '<button class="btn btn--ghost btn--sm" data-rb-no="' + esc(o.key) + '" type="button">Not now</button></div></div></div>';
  }
  function wireRecovery(el) {
    var go = function (sel, fn) { var b = el.querySelector(sel); if (b) b.addEventListener("click", fn); };
    go("[data-rb-start]", function () {
      var b = engine.startRecovery(this.dataset.rbStart);
      if (b) App.toast("Recovery block started for " + b.days + " days. End it any time from the banner.", "success", 4800);
      App.refresh();
    });
    go("[data-rb-no]", function () { App.util.uiSet("rb.dismissed", this.dataset.rbNo); App.refresh(); });
    go("[data-rb-end]", function () { engine.endRecovery(); App.toast("Recovery block ended. Your next session is a normal one.", "info"); App.refresh(); });
  }

  /* An optional slot (the row, the dip) on or off. Off is a stamped record,
     never a deleted key: the sync union would bring a deleted key back. */
  function setSlotOn(slot, on, why) {
    var s = App.getState(), at = lib.iso();
    if (!on) { s.training.slots[slot] = { off: true, acceptedAt: at, why: why || "left out" }; App.saveState(); return true; }
    var id = firstAllowed(slot, trainingCtx(s));
    if (!id) return false;
    s.training.slots[slot] = rxStart(id, { at: at, why: why || "added" });
    App.saveState();
    return true;
  }

  /* C6: the row is offered, not added. Shown on a pull day while the row has
     no record and you own the bar (without one, the row already replaces the
     pull). Ticked by default; nothing is written until you save. */
  function rowOfferHtml(s, day) {
    if (day !== "pull" || s.training.slots.row || !engine.prescriptionFor("pull")) return "";
    var id = firstAllowed("row", trainingCtx(s));
    if (!id) return "";
    var rx = rxStart(id), name = (DB.getExercise(id) || {}).name || id;
    return '<div class="card mt-4 stack" data-row-offer>' +
      '<div class="card__title">Add a row to your pull days?</div>' +
      '<p class="muted text-sm" style="margin:0">Pull-ups pull down from overhead. A row pulls toward your chest — the other half of pulling, and nothing on your plan trains it now. It adds one movement to pull days: ' +
        esc(name) + ', ' + esc(setupText(rx).toLowerCase()) + ', ' + rx.sets + ' × ' + rx.range[0] + '–' + rx.range[1] + '.</p>' +
      '<label class="row" style="gap:var(--sp-2);align-items:center"><input type="checkbox" id="row-offer-tick" checked> <span class="text-sm">Add ' + esc(name) + ' to pull days</span></label>' +
      '<div class="row" style="gap:var(--sp-2);align-items:center;flex-wrap:wrap"><button class="btn btn--secondary btn--sm" id="row-offer-save" type="button">Save choice</button>' +
      '<span class="faint text-xs">Either way, change it later in Program.</span></div></div>';
  }
  function wireRowOffer(el, after) {
    var b = el.querySelector("#row-offer-save");
    if (b) b.addEventListener("click", function () {
      var on = el.querySelector("#row-offer-tick").checked;
      setSlotOn("row", on, on ? "added on a pull day" : "left out on a pull day");
      App.toast(on ? "Row added to pull days." : "Row left out. Add it any time in Program.", "info");
      if (after) after();
    });
  }
  function head(eyebrow, kicker, title) {
    return '<div class="page-head"><div class="eyebrow">' + eyebrow + '</div>' +
      '<h1 class="display h2">' + title + '</h1></div>';
  }
  function section(title, meta, inner) {
    return '<div class="card mt-6"><div class="card__head"><div class="card__title">' + title + '</div>' +
      '<span class="badge">' + meta + '</span></div>' + inner + '</div>';
  }
  function checklist(items, state, kind) {
    if (!items.length) return '<p class="empty-mini">No drills for this day.</p>';
    return items.map(function (it, i) {
      var secs = Number(it.seconds) || 0;
      var timerBtn = secs ? '<button class="mini-timer" data-timer="' + secs + '" data-timer-label="' + esc(it.name) + '" type="button" title="Time this drill" aria-label="Start timer for ' + esc(it.name) + '">' +
        '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>' +
        fmtClock(secs) + '</button>' : "";
      return '<div class="check ' + (state[i] ? "is-done" : "") + '">' +
        '<button class="check__action grow" data-check="' + kind + '" data-idx="' + i + '" type="button" aria-pressed="' + !!state[i] + '">' +
          '<span class="check__box"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg></span>' +
          '<span class="check__body"><span class="check__heading"><span class="check__name">' + esc(it.name) + '</span>' +
          '<span class="check__detail">' + esc(it.detail) + '</span></span>' +
          '<span class="check__cue">' + esc(it.cue) + '</span></span></button>' +
        timerBtn +
      '</div>';
    }).join("");
  }
  function eraBadge(s) {
    return s.era === 1
      ? '<span class="badge badge--era1"><span class="dot"></span>Era I</span>'
      : '<span class="badge badge--era2"><span class="dot"></span>Era II</span>';
  }
  function lastSessionCard(last) {
    return '<div class="card mt-4"><div class="card__head"><div class="card__title">Last session</div>' +
      '<span class="badge">' + lib.relTime(lib.sessionDay(last)) + '</span></div>' +
      '<div class="kv"><span class="kv__k">' + DAY_LABEL[last.type] + '</span>' +
      '<span class="kv__v">' + (last.exercises || []).length + ' movements · vol ' + (last.volume || 0) + '</span></div></div>';
  }
  function streakStripCard(s) {
    var days = 21, today = lib.today();
    var doneKeys = {};
    s.sessions.forEach(function (x) { if (x.completed) doneKeys[lib.sessionDay(x)] = (doneKeys[lib.sessionDay(x)] || 0) + 1; });
    var cells = "";
    for (var i = days - 1; i >= 0; i--) {
      var k = lib.dayKey(lib.addDays(today, -i));
      var c = doneKeys[k] || 0;
      var lv = c >= 2 ? "lv3" : (c === 1 ? "lv2" : "");
      cells += '<span class="heat__d ' + lv + '" title="' + k + '"></span>';
    }
    return '<div class="card mt-4"><div class="card__head"><div class="card__title">Last 3 weeks</div>' +
      '<span class="badge badge--primary"><span class="dot"></span>' + engine.liveStreak(s) + ' day streak</span></div>' +
      '<div class="heat">' + cells + '</div></div>';
  }
  function ensureConfirm(title, body, okLabel, kind, onOk) {
    var m = document.getElementById("modal-confirm");
    if (!m) {
      m = document.createElement("div");
      m.className = "modal"; m.id = "modal-confirm"; m.setAttribute("role", "dialog");
      m.innerHTML = '<div class="modal__backdrop" data-close></div><div class="modal__dialog" style="max-width:420px">' +
        '<div class="modal__head"><div><div class="eyebrow" id="cf-eye">Confirm</div>' +
        '<h3 class="display h3" id="cf-title"></h3></div></div><p class="muted text-sm" id="cf-body"></p>' +
        '<div class="modal__foot"><button class="btn btn--ghost" data-close>Cancel</button>' +
        '<button class="btn btn--danger" id="cf-ok"></button></div></div>';
      document.body.appendChild(m);
    }
    document.getElementById("cf-title").textContent = title;
    document.getElementById("cf-body").textContent = body;
    var ok = document.getElementById("cf-ok");
    ok.textContent = okLabel;
    ok.className = "btn " + (kind === "danger" ? "btn--danger" : "btn--primary");
    var fresh = ok.cloneNode(true); ok.parentNode.replaceChild(fresh, ok);
    fresh.addEventListener("click", function () { App.closeModal("modal-confirm"); onOk(); });
    App.openModal("modal-confirm");
  }

  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
  function prettyPart(p) { return ({ lowerBack: "Lower back", hipFlexor: "Hip flexor" })[p] || cap(p); }
  /* A workout exercise's label: its skill track, its slot, else its pattern.
     A skill exercise has no slot, so nothing may index SLOTS with it. */
  function exLabel(ex) {
    if (ex.skill) { var tr = ((App.skills && App.skills.tracks) || {})[ex.skill]; return "Skill · " + (tr ? tr.label : ex.skill); }
    return ex.slot && TD().SLOTS[ex.slot] ? TD().SLOTS[ex.slot].label : cap(ex.pattern || "");
  }
  /* The key the slot rules address an exercise's record by (engine.recordOf). */
  function exKey(ex) { return ex.skill ? "skill:" + ex.skill : ex.slot; }

  /* expose a couple of shared bits for later parts */
  App.ui.head = head;
  App.ui.confirm = ensureConfirm;
  App.ui.cap = cap;
  App.ui.eraBadge = eraBadge;
  App.ui.exerciseCounts = exerciseCounts;
  App.ui.countsText = countsText;
  App.ui.setupText = setupText;
  App.ui.topText = topText;
  App.ui.ruleText = ruleText;
  App.ui.setSlotOn = setSlotOn;
  App.ui.equipCheckHtml = equipCheckHtml;
  App.ui.wireEquipCheck = wireEquipCheck;
  App.ui.jointWord = jointWord;
  App.ui.gearMissing = gearMissing;
  App.ui.gripCapable = gripCapable;
  App.ui.gripOf = gripOf;
  App.ui.carefulFor = carefulFor;
  App.ui.slotStatus = slotStatus;
  App.ui.noneText = noneText;
  App.ui.recoveryHtml = recoveryHtml;
  App.ui.wireRecovery = wireRecovery;
  App.ui.restReason = restReason;
  App.ui.nextAfterToday = nextAfterToday;

  /* One slot's evidence in a few words, for Program and the Progress
     ladders: "1 of 2 at 3 × 12", "ready to step up", "left out". */
  /* The Program row's status line. A held slot (plan C4) says so whatever
     else the line says, so the Hold button's state is never a guess. */
  function slotStatus(slot) {
    var t = slotStatusCore(slot), rx = App.getState().training.slots[slot];
    return rx && !rx.off && rx.hold && !/step-ups paused/.test(t) ? t + " · step-ups paused" : t;
  }
  /* What a slot with nothing to prescribe says, by its real reason (R3-3). */
  function noneText(slot) {
    var why = engine.unavailableReason(slot);
    return why === "excluded" ? "excluded — no movement here you allow"
      : why && why !== "equipment" ? "avoiding your " + jointWord(why) + " — no movement here you allow"
      : "needs equipment you don't have";
  }
  function slotStatusCore(slot) {
    var s = App.getState(), rx = s.training.slots[slot];
    if (!rx) return slot === "row" ? "not on your plan — offered on a pull day" : "no prescription";
    if (rx.off) return "left out";
    var pr = engine.prescriptionFor(slot);
    if (!pr) return noneText(slot);
    if (pr.rx.exerciseId !== rx.exerciseId) return pr.blocked === "excluded" ? "excluded — an easier movement until you choose one"
      : pr.blocked && pr.blocked !== "equipment" ? "avoiding your " + jointWord(pr.blocked) + " — an easier movement for now"
      : "an easier movement until you have the gear";
    var rec = engine.recommendFor(slot);
    if (!rec || rx.range[1] == null) return "no number to step up from";
    if (rec.why === "no-load") return "log the weight you use — no load set yet";
    if (rec.why === "off-load") return rec.decision ? "logged at " + rec.loggedKg + " kg — you chose to keep " + rx.setup.loadKg + " kg"
      : "logged at " + rec.loggedKg + " kg, not " + rx.setup.loadKg + " kg — see Workout";
    if (rec.why === "hold") return "holding at the top — step-ups paused";
    if (rec.action === "ready") return rec.decision ? "at the top — you chose to repeat" : !rec.step ? "at the top — end of the path" : rec.double ? "ready to step up two — see Workout" : "ready to step up — see Workout";
    if (rec.action === "reduce") return rec.decision ? "totals falling — you chose to repeat" : "totals falling — see Workout";
    if (rec.why === "no-history" && /^your assessment/.test(rx.why || "")) return "unverified — chosen at setup";
    return rec.atTop + " of " + TD().EVIDENCE_SESSIONS + " at " + topText(rx);
  }

  /* ======================================================================
     MOUNT (after the core's own DOMContentLoaded registration)
     ==================================================================== */
  App.renderOnboarding = renderOnboarding;   // set now; core calls it in bootstrap()

  /* ======================================================================
     REST TIMER — between-set countdown with audio beep.
     Auto-starts when a set is marked done; adjustable per exercise.
     Default 90s; remembers the last duration the user set in this session.
     ==================================================================== */
  /* `endAt` is the authority while running; `remaining` is derived from it and
     is only authoritative while paused. That split is what lets the countdown
     survive a reload — see rtSave/rtRestore below. */
  var RT = { id: null, endAt: 0, remaining: 0, total: 90, paused: false, last: 90, label: "Rest", done: false, onDone: null };

  /* ----------------------------------------------------------------------
     PERSISTENCE
     ----------------------------------------------------------------------
     A rest timer used to live only in memory, so reloading — or the browser
     discarding a backgrounded tab, which is routine on a phone — lost it
     silently mid-workout. It now keeps an absolute end stamp in the same
     `ironframe.ui` store the section and workout drafts use.

     An absolute stamp rather than a countdown of seconds, for the same reason
     `Hub.Timer` in js/core.js and the dashboard rack in js/timers.js both do
     it: storing "42 seconds left" would silently pause the clock across the
     reload gap, so you'd come back with time you hadn't actually rested.

     `onDone` is deliberately NOT persisted and cannot be. The hold-timer
     caller above closes over the live workout object and the DOM nodes it
     rendered; after a reload those are different objects, so re-running it
     would write a logged hold into stale references. A restored hold timer
     therefore still counts down and chimes, but does not auto-log the set.
     -------------------------------------------------------------------- */
  var RT_KEY = "rt";

  function rtSave() {
    if (!App.util || !App.util.uiSet) return;
    App.util.uiSet(RT_KEY, {
      endAt: RT.endAt, remaining: RT.remaining, total: RT.total,
      label: RT.label, paused: RT.paused
    });
  }

  function rtClear() {
    if (App.util && App.util.uiSet) App.util.uiSet(RT_KEY, null);
  }

  /* Seconds left: from the end stamp while running, from the frozen value
     while paused. One reader, so paint, tick and save can't disagree. */
  function rtLeft() {
    if (RT.paused) return Math.max(0, RT.remaining);
    return Math.max(0, Math.round((RT.endAt - Date.now()) / 1000));
  }

  /* One implementation of pause, shared by the bar's button and the Space
     key — they each had their own copy, which is two places for the button
     label and the clock to drift apart. */
  function rtTogglePause() {
    RT.paused = !RT.paused;
    if (RT.paused) RT.remaining = Math.max(0, Math.round((RT.endAt - Date.now()) / 1000));
    else RT.endAt = Date.now() + Math.max(0, RT.remaining) * 1000;
    var pb = document.getElementById("rt-pause");
    if (pb) pb.textContent = RT.paused ? "Resume" : "Pause";
    rtSave();
  }

  function rtBeep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!RT.ac) RT.ac = new Ctx();
      var ac = RT.ac;
      if (ac.state === "suspended") ac.resume();
      [0, 0.18, 0.36].forEach(function (offset, i) {
        var osc = ac.createOscillator(), g = ac.createGain();
        var t0 = ac.currentTime + offset;
        osc.type = "sine";
        osc.frequency.setValueAtTime(i === 2 ? 1320 : 880, t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.32, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
        osc.connect(g); g.connect(ac.destination);
        osc.start(t0); osc.stop(t0 + 0.16);
      });
    } catch (e) {}
  }
  /* soft single tick for the final 3-second countdown */
  function rtTickBeep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!RT.ac) RT.ac = new Ctx();
      var ac = RT.ac; if (ac.state === "suspended") ac.resume();
      var osc = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime;
      osc.type = "sine"; osc.frequency.setValueAtTime(660, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
      osc.connect(g); g.connect(ac.destination);
      osc.start(t0); osc.stop(t0 + 0.13);
    } catch (e) {}
  }

  function fmtClock(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m > 0 ? (m + ":" + (s < 10 ? "0" : "") + s) : String(s);
  }

  function rtEnsureBar() {
    var bar = document.getElementById("rest-timer");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "rest-timer"; bar.className = "rt"; bar.setAttribute("aria-live", "polite"); bar.setAttribute("role", "timer");
    bar.innerHTML =
      '<div class="rt__ring"><svg viewBox="0 0 44 44"><circle class="rt__track" cx="22" cy="22" r="19"/>' +
        '<circle class="rt__prog" cx="22" cy="22" r="19"/></svg><span class="rt__num" id="rt-num">90</span></div>' +
      '<div class="rt__mid"><div class="rt__label" id="rt-label">Rest</div>' +
        '<div class="rt__ctrls">' +
          '<button class="rt__btn" data-rt="-15" type="button" aria-label="Subtract 15 seconds">−15</button>' +
          '<button class="rt__btn" data-rt="+15" type="button" aria-label="Add 15 seconds">+15</button>' +
          '<button class="rt__btn" data-rt="+30" type="button" aria-label="Add 30 seconds">+30</button>' +
          '<button class="rt__btn" data-rt="pause" type="button" id="rt-pause">Pause</button>' +
          '<button class="rt__btn rt__btn--replay" data-rt="replay" type="button" id="rt-replay" aria-label="Restart timer">↻</button>' +
        '</div></div>' +
      '<button class="rt__skip" data-rt="skip" type="button" aria-label="Dismiss timer">Done ✕</button>';
    document.body.appendChild(bar);
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-rt]"); if (!b) return;
      var a = b.dataset.rt;
      if (a === "skip") rtStop();
      else if (a === "replay") rtStart(RT.last || RT.total || 90, RT.label, RT.onDone);
      else if (a === "pause") { rtTogglePause(); }
      else {
        var d = Number(a);
        RT.remaining = lib.clamp(rtLeft() + d, 0, 1800);
        /* ±15/+30 move the finish line, not just the digits — the end stamp is
           what the tick reads, so adjusting `remaining` alone would be undone
           a second later. */
        if (!RT.paused) RT.endAt = Date.now() + RT.remaining * 1000;
        RT.total = Math.max(RT.total, RT.remaining);
        RT.last = RT.remaining || RT.last; RT.done = false;
        bar.classList.remove("is-done"); rtPaint(); rtSave();
      }
    });
    return bar;
  }

  function rtPaint() {
    var bar = document.getElementById("rest-timer"); if (!bar) return;
    var num = document.getElementById("rt-num");
    if (num) num.textContent = fmtClock(RT.remaining);
    var lbl = document.getElementById("rt-label");
    if (lbl) lbl.textContent = RT.done ? (RT.label + " complete") : RT.label;
    var prog = bar.querySelector(".rt__prog");
    if (prog) {
      var C = 2 * Math.PI * 19;
      var frac = RT.total ? RT.remaining / RT.total : 0;
      prog.style.strokeDasharray = C;
      prog.style.strokeDashoffset = C * (1 - frac);
    }
    bar.classList.toggle("rt--final", !RT.done && RT.remaining > 0 && RT.remaining <= 3);
  }

  function rtTick() {
    if (RT.paused) return;
    /* Read from the end stamp rather than decrementing, so the digits are a
       function of the clock and not of how many times this fired. */
    RT.remaining = rtLeft();
    if (RT.remaining <= 0) {
      RT.remaining = 0; RT.done = true;
      rtPaint(); rtBeep();
      var bar = document.getElementById("rest-timer");
      if (bar) bar.classList.add("is-done");
      if (RT.id) { clearInterval(RT.id); RT.id = null; }
      /* A finished timer is an acknowledgement on screen, not state worth
         restoring — drop it so a later reload doesn't resurrect it. */
      rtClear();
      if (typeof RT.onDone === "function") { try { RT.onDone(); } catch (e) {} }
      return;
    }
    if (RT.remaining <= 3) rtTickBeep();
    rtPaint();
  }

  /* rtStart(seconds, label?, onDone?) — label shows what's being timed. */
  function rtStart(seconds, label, onDone) {
    var bar = rtEnsureBar();
    RT.total = seconds; RT.remaining = seconds; RT.paused = false; RT.last = seconds;
    RT.label = label || "Rest"; RT.done = false; RT.onDone = onDone || null;
    RT.endAt = Date.now() + seconds * 1000;
    var pb = document.getElementById("rt-pause"); if (pb) pb.textContent = "Pause";
    bar.classList.add("is-on"); bar.classList.remove("is-done");
    rtPaint();
    if (RT.id) clearInterval(RT.id);
    RT.id = setInterval(rtTick, 1000);
    rtSave();
  }

  function rtStop() {
    if (RT.id) { clearInterval(RT.id); RT.id = null; }
    RT.done = false; RT.onDone = null; RT.endAt = 0;
    var bar = document.getElementById("rest-timer");
    if (bar) bar.classList.remove("is-on", "is-done", "rt--final");
    rtClear();
  }

  /* Rebuild a timer that was running when the page went away.

     A timer whose end stamp has already passed is dropped rather than fired:
     chiming and flashing "complete" for a rest that ended twenty minutes ago
     while the tab was shut would be announcing something that isn't news. */
  function rtRestore() {
    if (!App.util || !App.util.uiGet) return;
    var s = App.util.uiGet(RT_KEY, null);
    if (!s || !s.total) return;

    var left = s.paused ? Math.max(0, Number(s.remaining) || 0)
                        : Math.round(((Number(s.endAt) || 0) - Date.now()) / 1000);
    if (!(left > 0)) { rtClear(); return; }

    RT.total = Number(s.total) || left;
    RT.remaining = left;
    RT.last = RT.total;
    RT.label = s.label || "Rest";
    RT.paused = !!s.paused;
    RT.done = false;
    RT.onDone = null;                    // see the note on rtSave above
    RT.endAt = RT.paused ? 0 : Date.now() + left * 1000;

    var bar = rtEnsureBar();
    bar.classList.add("is-on");
    bar.classList.remove("is-done", "rt--final");
    var pb = document.getElementById("rt-pause");
    if (pb) pb.textContent = RT.paused ? "Resume" : "Pause";
    rtPaint();
    if (RT.id) clearInterval(RT.id);
    RT.id = setInterval(rtTick, 1000);
  }
  /* expose so discard/complete can clear a running timer + others can start one */
  App.stopRestTimer = rtStop;
  App.startTimer = function (seconds, label, onDone) { rtStart(seconds, label, onDone); };

  /* keyboard: space pauses, Esc dismisses while a timer is visible */
  document.addEventListener("keydown", function (e) {
    var bar = document.getElementById("rest-timer");
    if (!bar || !bar.classList.contains("is-on")) return;
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    /* Space on a focused button, link, select or tab is that control's own
       activation; taking it here paused the timer instead of, and sometimes as
       well as, doing what the control says. Escape still dismisses from anywhere. */
    var owns = /^(BUTTON|SELECT|A|SUMMARY)$/.test(tag) || (e.target.getAttribute && e.target.getAttribute("role") === "tab");
    if (e.code === "Space") { if (owns) return; e.preventDefault(); rtTogglePause(); }
    else if (e.code === "Escape") { rtStop(); }
  });

  function mount() {
    App.registerView("today", renderToday);
    /* Pick a rest timer back up if one was running when the page went away. */
    rtRestore();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

})();

/* ===== BASALT script block 4 (source lines 4776-5345) ===== */
/* ============================================================================
   IRONFRAME — PART 4 · DASHBOARD & TRACKER WIDGETS
   ----------------------------------------------------------------------------
   Overrides the `dashboard` view with the full command center and mounts the
   quick-log tracker widgets (bodyweight · sleep · water) plus the PR & goals
   surfaces. Touches the core ONLY through its public contract and REUSES the
   Part-3 shared namespaces (App.lib / App.engine / App.ui) — never redefines.

   Registration race: the core registers its starter dashboard inside its own
   DOMContentLoaded handler, so this part also registers on DOMContentLoaded
   (added last → fires last → wins) to install the real dashboard.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.App) return;

  var App    = window.App;
  var lib    = App.lib;
  var engine = App.engine;
  var ui     = App.ui;
  var util   = App.util;
  var esc    = (lib && lib.esc) || function (s) { return String(s); };

  var WORK_KEY   = "today.workout"; // mirror Part 3's in-progress workout key

  /* ======================================================================
     A. DERIVED READS (pure)
     ==================================================================== */
  function latestBodyweight(s) {
    var log = s.bodyweightLog;
    return log.length ? log[log.length - 1].kg : s.profile.weightKg;
  }

  /* delta of latest vs a reference ~7+ days back (else earliest logged) */
  function bodyweightDelta(s) {
    var log = s.bodyweightLog;
    if (log.length < 2) return null;
    var latest = log[log.length - 1], ref = log[0];
    for (var i = log.length - 2; i >= 0; i--) {
      ref = log[i];
      if (lib.daysBetween(log[i].dateISO, latest.dateISO) >= 7) break;
    }
    return lib.round(latest.kg - ref.kg, 1);
  }

  /* Weight-gain pace — normalises the recent weigh-in trend to kg/week and
     reads it against your bodyweight direction (Settings, plan D2) — not the
     training goal, which used to stand in for it. For a clean bulk the sweet spot is
     roughly +0.25 to +0.5 kg/week: faster usually means added fat, while flat
     or negative means under-eating. Returns null until there are two weigh-ins
     at least a day apart. */
  function gainPace(s) {
    var log = s.bodyweightLog || [];
    if (log.length < 2) return null;
    var latest = log[log.length - 1], ref = log[0];
    for (var i = log.length - 2; i >= 0; i--) {
      ref = log[i];
      if (lib.daysBetween(log[i].dateISO, latest.dateISO) >= 7) break;
    }
    var days = lib.daysBetween(ref.dateISO, latest.dateISO);
    if (days < 1) return null;
    var perWk = lib.round((latest.kg - ref.kg) / days * 7, 2);
    var dir = s.profile && s.profile.weightDirection;
    if (!dir) return { kgWk: perWk, color: "", text: "No bodyweight direction set — choose gain, hold or lose in Settings to have this pace judged." };
    if (dir === "lose") {
      if (perWk >  0.1) return { kgWk: perWk, color: "warn",    text: "Gaining while you aim to lose — check the intake." };
      if (perWk > -0.2) return { kgWk: perWk, color: "warn",    text: "Barely moving — a slightly bigger deficit would start the loss." };
      if (perWk >= -0.7) return { kgWk: perWk, color: "success", text: "A steady loss pace that protects strength. Hold this." };
      return { kgWk: perWk, color: "warn", text: "Dropping fast — ease the deficit to protect strength." };
    }
    if (dir === "gain") {
      if (perWk <= -0.1) return { kgWk: perWk, color: "danger",  text: "Losing weight on a bulk — add ~250 kcal/day." };
      if (perWk <   0.1) return { kgWk: perWk, color: "warn",    text: "Barely moving — nudge the surplus up to start gaining." };
      if (perWk <=  0.5) return { kgWk: perWk, color: "success", text: "Ideal lean-gain pace. Hold this." };
      if (perWk <= 0.75) return { kgWk: perWk, color: "warn",    text: "A touch fast — fine for a hard gainer, but watch the mirror." };
      return { kgWk: perWk, color: "danger", text: "Gaining fast — likely some fat. Trim the surplus a little." };
    }
    /* hold: a steady bodyweight is the win */
    if (perWk >  0.3) return { kgWk: perWk, color: "warn", text: "Gaining quicker than holding weight calls for." };
    if (perWk < -0.7) return { kgWk: perWk, color: "warn", text: "Dropping fast — ease the deficit to protect strength." };
    return { kgWk: perWk, color: "success", text: "Bodyweight steady — on track for holding weight." };
  }

  /* Small coloured strip that explains the gain pace under the bodyweight widget. */
  function gainPaceRow(p) {
    if (!p) return "";
    var cmap = { success: "var(--success)", warn: "var(--warn)", danger: "var(--danger)", secondary: "var(--secondary)" };
    var c = cmap[p.color] || "var(--text-300)";
    var sign = p.kgWk > 0 ? "+" : "";
    return '<div style="display:flex;gap:var(--sp-2);align-items:flex-start;padding:var(--sp-2) var(--sp-3);' +
      'border:1px solid var(--line);border-left:3px solid ' + c + ';border-radius:var(--r-sm);background:var(--ink-800)">' +
      '<span class="mono" style="color:' + c + ';font-weight:700;font-size:var(--fs-sm);white-space:nowrap">' + sign + p.kgWk + ' kg/wk</span>' +
      '<span style="color:var(--text-300);font-size:var(--fs-xs);line-height:1.45">' + esc(p.text) + '</span>' +
    '</div>';
  }

  function latestSleep(s) { return s.sleepLog.length ? s.sleepLog[s.sleepLog.length - 1] : null; }

  function workoutInProgress() {
    var w = util.uiGet(WORK_KEY, null);
    return (w && w.dayType) ? w : null;
  }

  /* Monday-anchored week key. NOTE: we intentionally do NOT call the shared
     App.lib.weekKey here — in this build it crashes (its internal midnight()
     returns a timestamp number, then weekKey calls .getDay() on it). We avoid
     touching Part 3 and compute the week start locally via lib.addDays/dayKey. */
  function weekStartKey(v) {
    var d = lib.parse(v);
    var mondayOffset = (d.getDay() + 6) % 7;
    return lib.dayKey(lib.addDays(d, -mondayOffset));
  }
  /* Attendance counts main sessions. `mini` counts mini-sessions instead,
     for the line of their own beside it (plan D3): they're never added to
     attendance, which is measured against the template's plan. */
  function completedThisWeek(s, mini) {
    var wk = weekStartKey(lib.today());
    return engine.completedSessions().filter(function (x) {
      return engine.isMini(x) === !!mini && weekStartKey(lib.sessionDay(x)) === wk;
    }).length;
  }

  function completedThisPhase(s, mini) {
    var start = Hub.dayOf(s.currentPhase.startISO);
    return engine.completedSessions().filter(function (x) {
      return engine.isMini(x) === !!mini && lib.daysBetween(start, lib.sessionDay(x)) >= 0;
    }).length;
  }

  /* ======================================================================
     B. STATE WRITERS  (public contract only)
     ==================================================================== */
  function logBodyweight(kg) {
    kg = lib.round(kg, 1);
    if (!(kg > 0)) { App.toast("Enter a valid bodyweight.", "warn"); return; }
    var s = App.getState(), k = lib.today();
    var todayEntry = s.bodyweightLog.filter(function (b) { return Hub.dayOf(b.dateISO) === k; })[0];
    if (todayEntry) todayEntry.kg = kg;
    else s.bodyweightLog.push({ dateISO: lib.iso(), kg: kg });
    s.profile.weightKg = kg;                  // keep profile in sync (used by Nutrition/Eval)
    App.saveState();
    App.toast("Bodyweight logged · " + kg + " kg", "success");
    App.refresh();
  }

  function logSleep(hours, quality) {
    hours = lib.round(hours, 1);
    if (!(hours > 0)) { App.toast("Enter your sleep hours.", "warn"); return; }
    var s = App.getState(), k = lib.today();
    var entry = s.sleepLog.filter(function (x) { return Hub.dayOf(x.dateISO) === k; })[0];
    if (entry) { entry.hours = hours; entry.quality = quality; }
    else s.sleepLog.push({ dateISO: lib.iso(), hours: hours, quality: quality });
    App.saveState();
    App.toast("Sleep logged · " + hours + "h · " + quality, "success");
    App.refresh();
  }

  function addGoal(text) {
    text = String(text || "").trim();
    if (!text) return;
    var s = App.getState();
    s.goals.push({
      id: "g_" + Date.now(), text: text, target: null,
      byPhase: null, metric: null, pinned: false, done: false
    });
    App.saveState();
    App.toast("Goal added.", "success");
    App.refresh();
  }

  function toggleGoal(id, field) {
    var s = App.getState();
    var g = s.goals.filter(function (x) { return x.id === id; })[0];
    if (!g) return;
    g[field] = !g[field];
    g.updatedAt = new Date().toISOString();   // sync: the newer edit wins (R1-3)
    App.saveState();
    App.refresh();
  }

  function removeGoal(id) {
    var s = App.getState();
    s.goals = s.goals.filter(function (x) { return x.id !== id; });
    App.saveState();
    App.refresh();
  }

  /* ======================================================================
     C. SMALL HTML HELPERS  (Part-4 local)
     ==================================================================== */
  function deltaPill(delta) {
    if (delta == null) return '<span class="dash-delta dash-delta--flat">— baseline</span>';
    if (delta === 0)   return '<span class="dash-delta dash-delta--flat">±0.0 kg · holding</span>';
    var up = delta > 0;
    var cls = up ? "dash-delta--up" : "dash-delta--down";
    var arrow = up ? "▲" : "▼";
    return '<span class="dash-delta ' + cls + '">' + arrow + " " + Math.abs(delta) + " kg / wk</span>";
  }

  /* tiny stretch-to-width sparkline from a numeric series */
  function sparkline(vals, h, stroke) {
    vals = (vals || []).map(Number).filter(function (n) { return isFinite(n); });
    if (vals.length < 2) return '<div class="dash-spark dash-spark--empty">log a few days to see your trend</div>';
    var w = 100, pad = 4;
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var range = (max - min) || 1;
    var step = (w - 2 * pad) / (vals.length - 1);
    var pts = vals.map(function (v, i) {
      var x = pad + i * step;
      var y = pad + (h - 2 * pad) * (1 - (v - min) / range);
      return lib.round(x, 1) + "," + lib.round(y, 1);
    });
    var last = pts[pts.length - 1].split(",");
    var area = "0," + h + " " + pts.join(" ") + " " + w + "," + h;
    return '<svg class="dash-spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<polygon points="' + area + '" fill="' + stroke + '" opacity=".10"/>' +
      '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + stroke + '" stroke-width="2" ' +
      'stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
      '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="2.6" fill="' + stroke + '"/></svg>';
  }

  function decStepper(inputId, val, min, max, step) {
    return '<span class="stepper stepper--sm" data-dec data-min="' + min + '" data-max="' + max + '" data-step="' + step + '">' +
      '<button class="stepper__btn" data-dstep="-1" type="button">–</button>' +
      '<input id="' + inputId + '" class="stepper__inp" type="number" inputmode="decimal" step="' + step + '" value="' + (val == null ? "" : val) + '">' +
      '<button class="stepper__btn" data-dstep="1" type="button">+</button></span>';
  }
  function wireDec(root) {
    root.querySelectorAll("[data-dec]").forEach(function (st) {
      var min = Number(st.dataset.min), max = Number(st.dataset.max), step = Number(st.dataset.step);
      var inp = st.querySelector(".stepper__inp");
      function clamp() { inp.value = lib.clamp(lib.round(Number(inp.value) || 0, 2), min, max); }
      st.querySelectorAll("[data-dstep]").forEach(function (b) {
        b.addEventListener("click", function () { inp.value = (Number(inp.value) || 0) + Number(b.dataset.dstep) * step; clamp(); });
      });
      inp.addEventListener("change", clamp);
    });
  }

  function prValue(pr) {
    if (pr.kind === "hold")   return pr.value + "s";
    if (pr.kind === "weight") return pr.value + " kg";
    return pr.value + " reps";
  }

  function heatStrip(s, days) {
    var today = lib.today(), per = {};
    s.sessions.forEach(function (x) {
      if (x.completed) { var k = lib.sessionDay(x); per[k] = (per[k] || 0) + 1; }
    });
    var cells = "";
    for (var i = days - 1; i >= 0; i--) {
      var k = lib.dayKey(lib.addDays(today, -i));
      var c = per[k] || 0;
      var lv = c >= 2 ? "lv3" : (c === 1 ? "lv2" : "");
      cells += '<span class="heat__d ' + lv + '" title="' + k + (c ? " · " + c + " session" + (c > 1 ? "s" : "") : "") + '"></span>';
    }
    return '<div class="heat">' + cells + "</div>";
  }

  /* ======================================================================
     D. DASHBOARD VIEW
     ==================================================================== */
  function firstRunBanner(s) {
    var hasBar = s.equipment && s.equipment.pullupBar;
    var tips = [
      'Open <b>Workout</b> and tap <b>Begin session</b> — the plan auto-builds from your starting levels.',
      'Log every set honestly. The OS reads your reps and difficulty to decide when to make things harder.',
      (hasBar ? 'Anything you can\'t do? Use <b>Swap exercise</b> to pick an alternative for the same muscle group.'
              : 'No pull-up bar yet? When you swap a pull or dip, bar-free options like rows and chair dips show as <b>ready</b>.'),
      'Weigh in weekly — the trend is charted in your phase review, reported and never graded.'
    ];
    /* Day-one guidance sits BELOW the real call to action, and is folded: the "Up next"
       card owns the one action on this screen, and a second "Start your first session"
       button under a paragraph of tips said the same thing twice (PLAN-neobrutal-ui.md,
       Fitness content hierarchy). The tips are still one tap away. */
    return '<details class="card fit-fold">' +
      '<summary class="fit-fold__sum"><span><span class="eyebrow">Day one</span> ' +
        '<strong class="fit-fold__t">Welcome to the frame — four tips for your first weeks</strong></span>' +
        '<span class="badge badge--era1"><span class="dot"></span>Era I begins</span></summary>' +
      '<div class="stack mt-4">' +
        '<p class="muted text-sm" style="max-width:60ch">You\'re set up and ready. Here\'s how to get the most out of your first few weeks:</p>' +
        '<ol class="frun-list">' + tips.map(function (t) { return '<li>' + t + '</li>'; }).join("") + '</ol>' +
      '</div>' +
    '</details>';
  }

  function renderDashboard(el, s) {
    var rec      = engine.recommendedDayType();
    var wip      = workoutInProgress();
    var phase    = s.currentPhase;
    var dayInfo  = util.phaseDayInfo(phase);
    var done     = engine.completedSessions();
    var bw       = latestBodyweight(s);
    var bwDelta  = bodyweightDelta(s);
    var weekN    = completedThisWeek(s);
    var weekMini = completedThisWeek(s, true);
    var phaseN   = completedThisPhase(s);
    var expected = engine.expectedSessions(phase, phaseN);

    el.innerHTML =
      /* ---- page head ---- */
      '<div class="page-head row between wrap">' +
        '<div><div class="eyebrow">Command center · ' + esc(lib.fmtFull(lib.today())) + '</div>' +
        '<h1 class="display h2">Welcome back' + (s.profile.name ? ", " + esc(s.profile.name) : "") + '</h1></div>' +
        ui.eraBadge(s) +
      '</div>' +

      /* ---- hero / next-session CTA ---- */
      heroCard(s, rec, wip, engine.restDayInfo(s), engine.doneTodayInfo(s)) +
      ui.weeklySummaryHtml(s) +

      /* ---- day-one coaching (only before the first session) ----
         Below the hero: on day one the thing to do is start, and the four
         tips are support for that action rather than a gate in front of it. */
      (done.length === 0 ? firstRunBanner(s) : "") +

      /* ---- top stat tiles ---- */
      '<div class="grid grid-4 mt-6">' +
        util.statTile("Phase day", dayInfo.day + "/" + phase.lengthDays, dayInfo.remaining + " days to report card") +
        util.statTile("Streak", String(engine.liveStreak(s)), (s.streak.best ? "best " + s.streak.best + " 🔥" : (engine.liveStreak(s) > 0 ? "keep going" : "start one today"))) +
        util.statTile("Bodyweight", (bw == null ? "—" : bw) + '<small>kg</small>', bw == null ? "not logged yet" : (bwDelta == null ? "log to track trend" : (bwDelta > 0 ? "+" + bwDelta + " kg/wk" : (bwDelta < 0 ? bwDelta + " kg/wk" : "holding steady")))) +
        /* On pace at the whole sessions the template plans a week: the
           rotation's 3.5 is 3, the fewest a full week holds at every other day. */
        util.statTile("This week", String(weekN), (weekN >= Math.floor(engine.template().perWeek) ? "on pace ✔ · " : "sessions · ") + engine.template().short +
          (weekMini ? " · +" + weekMini + " accessory" : "")) +
      '</div>' +

      /* ---- phase progress + era panel ---- */
      '<div class="grid grid-tier-dash mt-4" style="grid-template-columns:1.5fr 1fr">' +
        phaseCard(s, phase, dayInfo, phaseN, expected, completedThisPhase(s, true)) +
        eraPanel(s) +
      '</div>' +

      /* ---- running plan banner ---- */
      (App.run ? App.run.dashboardBanner(s) : "") +

      /* ---- quick log ---- */
      '<div class="page-head" style="margin-top:var(--sp-8)"><div class="eyebrow">Quick log</div>' +
        '<h2 class="display h3">Track the inputs</h2></div>' +
      '<div class="grid grid-3">' +
        bodyweightWidget(s, bw, bwDelta) +
        sleepWidget(s) +
      '</div>' +

      /* ---- PRs + goals ---- */
      '<div class="grid grid-2 mt-4">' +
        prCard(s) +
        goalsCard(s) +
      '</div>' +

      /* ---- training calendar ----
         Back on the dashboard, where it was before Progress was split into
         tabs and it ended up two clicks deep. Same card, same code — Progress
         keeps its copy as the "study it" view, this one is the glance.
         `calState` is module-level, so the month you navigate to on one is
         the month the other opens on. That is shared deliberately: two
         calendars disagreeing about which month you were looking at is worse
         than them agreeing. */
      (App.calendarCard ? '<div class="mt-6">' + App.calendarCard(s) + '</div>' : "") +

      '<p class="faint text-xs mt-6 mono">DASHBOARD ONLINE · ' + done.length + ' session' + (done.length === 1 ? "" : "s") +
        ' logged · phase ' + phase.number + ' · era ' + (s.era === 1 ? "I" : "II") + ' · all data stored locally in this browser.</p>';

    wireDashboard(el, s);
    if (App.wireCalendar) App.wireCalendar(el, s);
  }

  /* ---- hero ---- */
  function heroCard(s, rec, wip, restInfo, doneInfo) {
    /* Already trained today — checked before rest, since restDayInfo reports
       isRest:false on a day you have trained. Mirrors the Today tab so the
       two can't disagree about whether you are done. */
    if (!wip && doneInfo && doneInfo.isDone && !util.uiGet(engine.overrideKey("done"), false)) {
      return '<div class="card card--accent card--pad-lg hero stack">' +
        '<div class="row between wrap">' +
          '<div><div class="eyebrow">Done today</div>' +
          '<h2 class="display h2" style="margin-top:var(--sp-1)">You trained ' + esc(engine.DAY_LABEL[doneInfo.todayType] || "") + ' today</h2>' +
          '<p class="muted text-sm" style="max-width:50ch">' + esc(ui.nextAfterToday(doneInfo, rec)) + '</p></div>' +
          '<span class="badge badge--primary"><span class="dot"></span>complete</span>' +
        '</div>' +
        '<button class="btn btn--ghost btn--lg btn--block" data-go="today">Open Workout →</button>' +
      '</div>';
    }

    /* Resting today, per the same gate the Today tab uses (restDayInfo) — a
       session in progress always wins over rest (you already said "train
       anyway"), otherwise the hero must not invite you to start the very
       session Today would refuse. */
    var resting = !wip && restInfo && restInfo.isRest &&
                  !util.uiGet(engine.overrideKey("rest"), false);
    if (resting) {
      var tomorrow = lib.daysBetween(lib.today(), restInfo.nextKey) === 1;
      var whenLabel = tomorrow ? "tomorrow" : lib.fmtDate(restInfo.nextKey);
      return '<div class="card card--accent card--pad-lg hero stack">' +
        '<div class="row between wrap">' +
          '<div><div class="eyebrow">Resting today</div>' +
          '<h2 class="display h2" style="margin-top:var(--sp-1)">Next up: ' + esc(engine.DAY_LABEL[rec]) + ' ' + esc(whenLabel) + '</h2>' +
          '<p class="muted text-sm" style="max-width:50ch">' + esc(ui.restReason(restInfo)) + '</p></div>' +
          '<span class="badge"><span class="dot"></span>rest</span>' +
        '</div>' +
        '<button class="btn btn--ghost btn--lg btn--block" data-go="today">Train anyway →</button>' +
      '</div>';
    }

    /* A session in progress shows what it actually contains; an upcoming one
       shows what the current length preference would build. */
    var chips = (wip
      ? (wip.exercises || []).map(function (ex) {
          return '<span class="chip">' + ui.cap(ex.pattern) + ' · ' + esc(ex.name) + "</span>";
        })
      : engine.slotsFor(rec, (s.prefs && s.prefs.sessionLength) || "focused").map(function (it) {
          var m = window.DB.getExercise(it.rx.exerciseId) || {};
          return '<span class="chip">' + esc(window.TRAINING_DATA.SLOTS[it.slot].label) + ' · ' + esc(m.name || it.rx.exerciseId) + "</span>";
        })
    ).join("");

    var title = wip ? engine.DAY_LABEL[wip.dayType] : engine.DAY_LABEL[rec];
    var desc  = wip ? "You have a session underway — pick up right where you left off." : engine.DAY_DESC[rec];
    var btn   = wip
      ? '<button class="btn btn--primary btn--lg btn--block" data-go="today"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>Resume session →</button>'
      : '<button class="btn btn--primary btn--lg btn--block" data-go="today"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>Start ' + title + ' →</button>';

    return '<div class="card card--accent card--pad-lg hero stack">' +
      '<div class="row between wrap">' +
        '<div><div class="eyebrow">' + (wip ? "In progress" : "Up next") + '</div>' +
        '<h2 class="display h2" style="margin-top:var(--sp-1)">' + title + '</h2>' +
        '<p class="muted text-sm" style="max-width:50ch">' + desc + "</p></div>" +
        (wip ? '<span class="badge badge--warn"><span class="dot"></span>resume</span>' : '<span class="badge badge--primary"><span class="dot"></span>recommended</span>') +
      '</div>' +
      (chips ? '<div class="chips">' + chips + "</div>" : "") +
      btn +
      '<div class="row wrap" style="gap:var(--sp-2)">' +
        '<button class="btn btn--ghost btn--sm" data-go="progress">View progress</button>' +
        '<button class="btn btn--ghost btn--sm" data-go="program">Adjust program</button>' +
      '</div>' +
    '</div>';
  }

  /* ---- phase progress ---- */
  function phaseCard(s, phase, dayInfo, phaseN, expected, minis) {
    var cadencePct = lib.pct(phaseN, expected);
    var onTrack = phaseN >= Math.round(expected * (dayInfo.pct / 100));
    return '<div class="card card--notch">' +
      '<div class="card__head"><div class="card__title">Phase ' + phase.number + " progress</div>" +
        '<span class="badge">' + dayInfo.pct + "% of cycle</span></div>" +
      '<div class="progress" style="height:12px"><div class="progress__bar" style="width:' + dayInfo.pct + '%"></div></div>' +
      '<div class="progress__meta mt-4"><span>Sessions completed</span><span><b>' + phaseN + "</b> / " + expected + " expected</span></div>" +
      '<div class="progress progress--cyan progress--thin metric-bar"><div class="progress__bar" style="width:' + cadencePct + '%"></div></div>' +
      (minis ? '<div class="progress__meta mt-2"><span>Accessory sessions</span><span><b>' + minis + '</b> · not counted above</span></div>' : "") +
      '<p class="muted text-xs mt-2">' +
        (onTrack ? "On pace for this phase — keep the cadence steady." :
          "A little behind pace — " + engine.template().label + " plans " + engine.template().short + ".") +
      '</p>' +
      '<div class="divider"></div>' +
      '<div class="row between"><div class="field__label">Last 4 weeks</div>' +
        '<span class="badge badge--primary"><span class="dot"></span>' + engine.liveStreak(s) + " day streak</span></div>" +
      '<div class="mt-2">' + heatStrip(s, 28) + "</div>" +
      '<p class="faint text-xs mt-4">A phase report is ready at day ' + phase.lengthDays +
        ': attendance, progress per movement and recovery, as three separate readings with their sample sizes and no overall grade. Closing it changes nothing in your program.</p>' +
    '</div>';
  }

  /* ---- era panel: benchmarks (Era I) or toolkit (Era II) ---- */
  function eraPanel(s) {
    if (s.era === 2) {
      var owned = Object.keys(s.equipment).filter(function (k) { return k !== "nothing" && s.equipment[k]; });
      var chips = owned.length
        ? owned.map(function (k) { return '<span class="chip">' + ui.cap(k) + "</span>"; }).join("")
        : '<span class="chip">bodyweight only</span>';
      return '<div class="card">' +
        '<div class="card__head"><div class="card__title">Era II toolkit</div>' +
          '<span class="badge badge--era2"><span class="dot"></span>unlocked</span></div>' +
        '<p class="muted text-sm">All five Era I benchmarks cleared. Loaded movements are in every Swap list for the gear you own — at any Era.</p>' +
        '<div class="field__label mt-4 mb-2">Available equipment</div><div class="chips">' + chips + "</div>" +
      '</div>';
    }
    var keys = Object.keys(s.benchmarks);
    var doneN = keys.filter(function (k) { return s.benchmarks[k].complete; }).length;
    var rows = keys.map(function (k) {
      var b = s.benchmarks[k];
      var p = lib.pct(b.current, b.target);
      return '<div class="kv" style="margin-top:var(--sp-3)"><span class="kv__k">' +
          (b.complete ? '<span style="color:var(--success)">✔ </span>' : "") + esc(b.label) + "</span>" +
          '<span class="kv__v">' + b.current + "/" + b.target + " " + b.metric + "</span></div>" +
        '<div class="progress progress--era1 progress--thin" style="margin-top:6px"><div class="progress__bar" style="width:' + (b.complete ? 100 : p) + '%"></div></div>';
    }).join("");
    return '<div class="card">' +
      '<div class="card__head"><div class="card__title">Era I benchmarks</div>' +
        '<span class="badge badge--era1">' + doneN + "/" + keys.length + "</span></div>" +
      '<div class="progress progress--era1"><div class="progress__bar" style="width:' + lib.pct(doneN, keys.length) + '%"></div></div>' +
      rows +
      '<button class="btn btn--ghost btn--sm btn--block mt-4" data-go="program">Update benchmarks in Program →</button>' +
    '</div>';
  }

  /* ---- bodyweight widget ---- */
  function bodyweightWidget(s, bw, bwDelta) {
    var series = lib.lastN(s.bodyweightLog, 14).map(function (b) { return b.kg; });
    var known = bw != null;
    /* No weight logged yet and none entered at onboarding: the stepper still
       needs a starting number to count up/down from, same as sleepWidget
       defaulting to 8 hours when nothing's logged. 70 is just a workable
       middle-of-range start for the control — never shown as "your weight". */
    return '<div class="card stack" data-w="bw">' +
      '<div class="card__head"><div class="card__title">Bodyweight</div>' +
        '<span class="icon-pill icon-pill--cyan"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18M6 7l1.5 12.5a2 2 0 0 0 2 1.5h5a2 2 0 0 0 2-1.5L18 7"/><path d="M9 7V4h6v3"/></svg></span></div>' +
      '<div class="row between"><div class="dash-big' + (known ? "" : " dash-big--muted") + '">' + (known ? bw : "—") + '<small>kg</small></div>' + deltaPill(bwDelta) + "</div>" +
      sparkline(series, 46, "var(--secondary)") +
      gainPaceRow(gainPace(s)) +
      '<div class="row" style="gap:var(--sp-2)">' +
        decStepper("bw-input", lib.round(known ? bw : 70, 1), 30, 250, 0.1) +
        '<button class="btn btn--secondary btn--sm grow" id="bw-log">Log today</button>' +
      '</div>' +
    '</div>';
  }

  /* ---- sleep widget ---- */
  function sleepWidget(s) {
    var last = latestSleep(s);
    var QUALS = ["poor", "fair", "good", "great"];
    var curQ = (last && QUALS.indexOf(last.quality) >= 0) ? last.quality : "good";
    var hrs  = last ? last.hours : 8;
    var quals = QUALS.map(function (q) {
      return '<button class="seg__btn ' + (q === curQ ? "is-active" : "") + '" data-q="' + q + '" type="button">' + ui.cap(q) + "</button>";
    }).join("");
    return '<div class="card stack" data-w="sleep">' +
      '<div class="card__head"><div class="card__title">Sleep</div>' +
        '<span class="icon-pill"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></span></div>' +
      (last
        ? '<div class="row between"><div class="dash-big">' + last.hours + '<small>h</small></div>' +
            '<span class="dash-delta dash-delta--flat">' + ui.cap(last.quality) + " · " + lib.relTime(last.dateISO) + "</span></div>"
        : '<div class="row between"><div class="dash-big dash-big--muted">—<small>h</small></div><span class="dash-delta dash-delta--flat">not logged yet</span></div>') +
      '<div><div class="field__label mb-2">Hours slept</div>' +
        '<div class="row" style="gap:var(--sp-2)">' + decStepper("sleep-input", hrs, 0, 14, 0.5) + '<span class="faint text-xs">hrs</span></div></div>' +
      '<div><div class="field__label mb-2">Quality</div><div class="seg seg--cyan" id="sleep-qual">' + quals + "</div></div>" +
      '<button class="btn btn--secondary btn--sm btn--block" id="sleep-log">Log sleep</button>' +
    '</div>';
  }

  /* ---- personal records ---- */
  function prCard(s) {
    var prs = s.prs.slice().sort(function (a, b) { return new Date(b.dateISO) - new Date(a.dateISO); }).slice(0, 6);
    var body = prs.length
      ? prs.map(function (p) {
          return '<div class="drow"><div class="drow__main"><div class="drow__title">' + esc(p.exercise) + "</div>" +
            '<div class="drow__sub">' + (p.kind === "hold" ? ((window.TRAINING_DATA.EXERCISES[p.exerciseId] || {}).timed ? "longest set" : "max hold") : (p.kind === "weight" ? "top weight" : "best set")) +
            " · " + lib.relTime(p.dateISO) + "</div></div>" +
            (p.improved ? '<span class="badge badge--success" style="margin-right:var(--sp-2)"><span class="dot"></span>new</span>' : "") +
            '<span class="kv__v" style="font-size:var(--fs-lg)">' + prValue(p) + "</span></div>";
        }).join("")
      : '<p class="empty-mini">No records yet. Finish a session and the OS captures your best set or hold per movement automatically.</p>';
    return '<div class="card">' +
      '<div class="card__head"><div class="card__title">Personal records</div>' +
        '<span class="badge">' + s.prs.length + " tracked</span></div>" + body +
    '</div>';
  }

  /* ---- goals ---- */
  function goalsCard(s) {
    var goals = s.goals.slice().sort(function (a, b) {
      if (!!a.done !== !!b.done) return a.done ? 1 : -1;
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return 0;
    });
    var list = goals.length
      ? goals.map(function (g) {
          return '<div class="goal ' + (g.done ? "is-done" : "") + '" data-goal="' + g.id + '">' +
            '<button class="goal__chk" data-gtoggle="done" type="button" aria-label="Toggle done">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg></button>' +
            '<div class="goal__t">' + esc(g.text) + (g.byPhase ? ' <span class="faint text-xs">· by P' + g.byPhase + "</span>" : "") + "</div>" +
            '<button class="goal__pin ' + (g.pinned ? "is-on" : "") + '" data-gtoggle="pinned" type="button" aria-label="Pin goal">' +
              '<svg width="15" height="15" viewBox="0 0 24 24" fill="' + (g.pinned ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.4 5.8 20.9l1.6-6.8L2.2 9.5l6.9-.6L12 2z"/></svg></button>' +
            '<button class="drow__x" data-gdel type="button" aria-label="Delete goal">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
          '</div>';
        }).join("")
      : '<p class="empty-mini">No goals pinned. Set one to give the OS a north star.</p>';
    return '<div class="card">' +
      '<div class="card__head"><div class="card__title">Goals</div>' +
        '<span class="badge">' + s.goals.filter(function (g) { return !g.done; }).length + " active</span></div>" +
      list +
      '<div class="row" style="gap:var(--sp-2);margin-top:var(--sp-3)">' +
        '<input class="input" id="goal-input" placeholder="Add a goal — e.g. First clean pull-up" style="flex:1" maxlength="80">' +
        '<button class="btn btn--primary btn--sm" id="goal-add">Add</button>' +
      '</div>' +
    '</div>';
  }

  /* ======================================================================
     E. WIRING
     ==================================================================== */
  function wireDashboard(el, s) {
    /* navigation buttons */
    el.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () { App.showSection(b.dataset.go); });
    });

    /* decimal steppers (bodyweight + sleep) */
    wireDec(el);

    /* bodyweight log */
    var bwLog = el.querySelector("#bw-log");
    if (bwLog) bwLog.addEventListener("click", function () {
      var v = Number((el.querySelector("#bw-input") || {}).value);
      logBodyweight(v);
    });

    /* sleep quality segmented control */
    var qual = el.querySelector("#sleep-qual");
    if (qual) qual.querySelectorAll("[data-q]").forEach(function (b) {
      b.addEventListener("click", function () {
        qual.querySelectorAll("[data-q]").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      });
    });
    /* sleep log */
    var slLog = el.querySelector("#sleep-log");
    if (slLog) slLog.addEventListener("click", function () {
      var hrs = Number((el.querySelector("#sleep-input") || {}).value);
      var active = qual ? qual.querySelector(".is-active") : null;
      logSleep(hrs, active ? active.dataset.q : "good");
    });



    /* goals */
    var addBtn = el.querySelector("#goal-add"), input = el.querySelector("#goal-input");
    function commitGoal() { if (input) { addGoal(input.value); } }
    if (addBtn) addBtn.addEventListener("click", commitGoal);
    if (input) input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); commitGoal(); } });
    el.querySelectorAll(".goal").forEach(function (row) {
      var id = row.dataset.goal;
      row.querySelectorAll("[data-gtoggle]").forEach(function (b) {
        b.addEventListener("click", function () { toggleGoal(id, b.dataset.gtoggle); });
      });
      var del = row.querySelector("[data-gdel]");
      if (del) del.addEventListener("click", function () { removeGoal(id); });
    });
  }

  /* ======================================================================
     F. MOUNT — register on DOMContentLoaded so we win the race with the
     core's starter dashboard (our listener is added last → fires last).
     ==================================================================== */
  function mount() { App.registerView("dashboard", renderDashboard); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

})();


/* ===== BASALT script block 5 (source lines 5412-6372) ===== */
/* ============================================================================
   IRONFRAME — PART 5 · NUTRITION & PROGRESS
   ----------------------------------------------------------------------------
   Registers two views via App.registerView:
     • "nutrition" — macro rings, meal logger, water tracker, weekly summary,
                     filterable food browser. Writes nutritionLog[] meals/water.
     • "progress"  — bodyweight + volume + sleep charts (Chart.js), exercise
                     prescription evidence and trends, PRs, and measurements.
                     Writes bodyweightLog[], sleepLog[], measurements[].

   Reuses the Part-3 shared namespaces (App.lib / App.engine / App.ui) and the
   Part-2 content globals (FOODS / DB). Touches the core ONLY via its public
   contract. All Chart.js wiring lives here.

   Registration race: mount on DOMContentLoaded (added after the core's own
   handler → fires after it) so the views are registered the moment the app
   boots, exactly as Parts 2–4 do.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.App) return;

  var App    = window.App;
  var lib    = App.lib;
  var engine = App.engine;
  var ui     = App.ui;
  var util   = App.util;
  var DB     = window.DB;
  var FOODS  = window.FOODS || [];
  var TDATA  = window.TRAINING_DATA;
  var esc    = (lib && lib.esc) || function (s) { return String(s); };
  var cap    = (ui && ui.cap) || function (s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); };

  /* transient (non-persisted) UI state for filters / search */
  var uiState = { foodTag: "all", mealSearch: "", customOpen: false, noteSearch: "" };

  /* ----------------------------------------------------------------------
     SHARED DATE / WEEK HELPERS (Monday-anchored). These power the volume,
     sleep and chart label calculations used across the Progress view.
     -------------------------------------------------------------------- */
  function weekStartKey(v) {
    var d = lib.parse(v);
    var mondayOffset = (d.getDay() + 6) % 7;
    return lib.dayKey(lib.addDays(d, -mondayOffset));
  }
  function lastNDayKeys(n) {
    var keys = [];
    for (var i = n - 1; i >= 0; i--) keys.push(lib.dayKey(lib.addDays(lib.today(), -i)));
    return keys;
  }
  function keyLabel(k) {
    var p = String(k).split("-");
    if (p.length === 3) {
      return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]))
        .toLocaleDateString(undefined, { day: "numeric", month: "short" });
    }
    return lib.fmtShort(k);
  }

  /* ======================================================================
     0. CHART.JS THEME + LIFECYCLE
     ==================================================================== */
  /* Chart.js needs literal colour strings, so these can't BE custom properties
     — but they can be read FROM them. Resolving against the live cascade is
     what lets a palette switch (js/theme.js) reach the charts; the Gruvbox
     values stay as fallbacks for a stylesheet that never loaded. */
  var THEME = {};
  function readChartTheme() {
    var cs = getComputedStyle(document.documentElement);
    function v(name, fallback) { return (cs.getPropertyValue(name) || "").trim() || fallback; }
    THEME.text        = v("--fg2", "#d5c4a1");
    THEME.strong      = v("--fg0", "#fbf1c7");
    THEME.faint       = v("--fg4", "#a89984");
    THEME.grid        = "rgba(" + v("--fg4-rgb", "168,153,132") + ",.10)";
    THEME.line2       = "rgba(" + v("--fg4-rgb", "168,153,132") + ",.20)";
    THEME.surf        = v("--bg0", "#282828");
    THEME.primary     = v("--orange-bright", "#fe8019");
    THEME.primarySoft = "rgba(" + v("--orange-bright-rgb", "254,128,25") + ",.55)";
    THEME.cyan        = v("--aqua-bright", "#8ec07c");
    THEME.cyanSoft    = "rgba(" + v("--aqua-bright-rgb", "142,192,124") + ",.16)";
    THEME.success     = v("--green-bright", "#b8bb26");
    THEME.warn        = v("--yellow-bright", "#fabd2f");
    THEME.info        = v("--blue-bright", "#83a598");
    THEME.era2        = THEME.primary;
    return THEME;
  }
  readChartTheme();
  /* A palette switch invalidates every cached hex above, and Chart.js only
     applies its defaults once — so drop the guard and let them be reapplied. */
  document.addEventListener("wh:themechange", function () {
    readChartTheme();
    if (window.Chart) window.Chart.__ironframeThemed = false;
  });

  function themeChart() {
    if (!window.Chart || Chart.__ironframeThemed) return;
    try {
      Chart.defaults.font.family = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
      Chart.defaults.font.size = 11;
      Chart.defaults.color = THEME.text;
      Chart.defaults.plugins.legend.display = false;
      var tt = Chart.defaults.plugins.tooltip;
      tt.backgroundColor = THEME.surf; tt.borderColor = THEME.line2; tt.borderWidth = 1;
      tt.titleColor = THEME.strong; tt.bodyColor = THEME.text;
      tt.padding = 10; tt.cornerRadius = 8; tt.displayColors = false;
    } catch (e) {}
    Chart.__ironframeThemed = true;
  }

  /* track instances by canvas id so re-renders never collide */
  var CHARTS = {};
  function makeChart(id, cfg) {
    if (!window.Chart) return null;
    var cv = document.getElementById(id);
    if (!cv) return null;
    if (CHARTS[id]) { try { CHARTS[id].destroy(); } catch (e) {} delete CHARTS[id]; }
    var existing = (Chart.getChart ? Chart.getChart(cv) : null);
    if (existing) { try { existing.destroy(); } catch (e) {} }
    try { CHARTS[id] = new Chart(cv, cfg); } catch (e) { console.error("chart " + id, e); }
    return CHARTS[id];
  }
  function axes(opts) {
    opts = opts || {};
    return {
      x: { grid: { display: false, drawBorder: false }, ticks: { color: THEME.faint, maxRotation: 0, autoSkip: true, maxTicksLimit: opts.xTicks || 8 } },
      y: { beginAtZero: opts.zero !== false, grace: opts.grace || 0, grid: { color: THEME.grid, drawBorder: false }, ticks: { color: THEME.faint, precision: opts.precision } }
    };
  }
  function chartBox(id, h) {
    return '<div class="chart-box" style="height:' + h + 'px"><canvas id="' + id + '"></canvas></div>';
  }
  function chartEmpty(h, msg) {
    return '<div class="chart-box" style="height:' + h + 'px"><div class="chart-empty">' + msg + '</div></div>';
  }

  /* ======================================================================
     6. PROGRESS — derived reads
     ==================================================================== */
  function latestBodyweight(s) {
    var log = s.bodyweightLog || [];
    return log.length ? log[log.length - 1].kg : s.profile.weightKg;
  }
  /* The closest logged reference at least seven calendar days back. Shorter
     spans report their actual duration, never a weekly rate. */
  function weekDelta(s) {
    var log = (s.bodyweightLog || []).slice().sort(function (a, b) { return a.dateISO < b.dateISO ? -1 : a.dateISO > b.dateISO ? 1 : 0; });
    if (log.length < 2) return null;
    var latest = log[log.length - 1], ref = log[0];
    for (var i = log.length - 2; i >= 0; i--) {
      ref = log[i];
      if (lib.daysBetween(log[i].dateISO, latest.dateISO) >= 7) break;
    }
    var days = lib.daysBetween(ref.dateISO, latest.dateISO);
    if (days < 1) return null;
    return { change: lib.round(latest.kg - ref.kg, 1), days: days,
      perWeek: days >= 7 ? lib.round((latest.kg - ref.kg) * 7 / days, 1) : null };
  }
  /* delta over the current phase (latest vs first weigh-in on/after phase start) */
  function phaseDelta(s) {
    var log = s.bodyweightLog || [];
    if (!log.length) return null;
    var start = s.currentPhase.startISO;
    var base = null;
    for (var i = 0; i < log.length; i++) {
      if (lib.daysBetween(start, log[i].dateISO) >= 0) { base = log[i]; break; }
    }
    if (!base) base = log[0];
    return lib.round(log[log.length - 1].kg - base.kg, 1);
  }
  /* 7-day trailing average aligned to each entry */
  function rollingAvg(log) {
    return log.map(function (cur, i) {
      var acc = 0, n = 0;
      for (var j = i; j >= 0; j--) {
        if (lib.daysBetween(log[j].dateISO, cur.dateISO) > 6) break;
        acc += log[j].kg; n++;
      }
      return n ? lib.round(acc / n, 2) : cur.kg;
    });
  }
  function weeklyVolume(s, weeks) {
    var done = engine.completedSessions();
    var thisMon = weekStartKey(lib.today());
    var keys = [];
    for (var i = weeks - 1; i >= 0; i--) keys.push(lib.dayKey(lib.addDays(thisMon, -7 * i)));
    var byWeek = {};
    done.forEach(function (x) {
      var wk = weekStartKey(lib.sessionDay(x));
      byWeek[wk] = (byWeek[wk] || 0) + (Number(x.volume) || 0);
    });
    return { keys: keys, data: keys.map(function (k) { return byWeek[k] || 0; }) };
  }

  /* ======================================================================
     7. PROGRESS — writers
     ==================================================================== */
  function logBodyweight(kg) {
    kg = lib.round(kg, 1);
    if (!(kg > 0)) { App.toast("Enter a valid bodyweight.", "warn"); return; }
    var s = App.getState(), k = lib.today();
    var todayEntry = (s.bodyweightLog || []).filter(function (b) { return Hub.dayOf(b.dateISO) === k; })[0];
    if (todayEntry) todayEntry.kg = kg;
    else s.bodyweightLog.push({ dateISO: lib.iso(), kg: kg });
    s.profile.weightKg = kg;                       // keep profile in sync (Nutrition/Eval read it)
    App.saveState();
    App.toast("Bodyweight logged \u00b7 " + kg + " kg", "success");
    App.refresh();
  }
  function logSleep(hours, quality) {
    hours = lib.round(hours, 1);
    if (!(hours > 0)) { App.toast("Enter your sleep hours.", "warn"); return; }
    var s = App.getState(), k = lib.today();
    var entry = (s.sleepLog || []).filter(function (x) { return Hub.dayOf(x.dateISO) === k; })[0];
    if (entry) { entry.hours = hours; entry.quality = quality; }
    else s.sleepLog.push({ dateISO: lib.iso(), hours: hours, quality: quality });
    App.saveState();
    App.toast("Sleep logged \u00b7 " + hours + "h \u00b7 " + quality, "success");
    App.refresh();
  }
  var MEAS_KEYS = [
    { k: "chest",  label: "Chest" },
    { k: "waist",  label: "Waist" },
    { k: "hips",   label: "Hips" },
    { k: "arms",   label: "Arms" },
    { k: "thighs", label: "Thighs" }
  ];
  function logMeasurements(vals) {
    var s = App.getState(), k = lib.today();
    var any = MEAS_KEYS.some(function (m) { return Number(vals[m.k]) > 0; });
    if (!any) { App.toast("Enter at least one measurement.", "warn"); return; }
    var rec = { dateISO: lib.iso() };
    MEAS_KEYS.forEach(function (m) { rec[m.k] = Number(vals[m.k]) > 0 ? lib.round(Number(vals[m.k]), 1) : null; });
    var todayEntry = (s.measurements || []).filter(function (x) { return Hub.dayOf(x.dateISO) === k; })[0];
    if (todayEntry) {
      MEAS_KEYS.forEach(function (m) { if (rec[m.k] != null) todayEntry[m.k] = rec[m.k]; });
      todayEntry.dateISO = rec.dateISO;
    } else {
      s.measurements.push(rec);
    }
    App.saveState();
    App.toast("Measurements logged.", "success");
    App.refresh();
  }

  /* ======================================================================
     8. PROGRESS — html builders
     ==================================================================== */
  function bodyweightCard(s) {
    var log = s.bodyweightLog || [];
    var bw = latestBodyweight(s);
    var wk = weekDelta(s);
    var ph = phaseDelta(s);
    var change = wk && (wk.perWeek == null ? wk.change : wk.perWeek);
    var arrow = (change == null || change === 0) ? "\u2192" : (change > 0 ? "\u25b2" : "\u25bc");
    var arrCls = (change == null || change === 0) ? "dash-delta--flat" : (change > 0 ? "dash-delta--up" : "dash-delta--down");
    var wkPill = (wk == null)
      ? '<span class="dash-delta dash-delta--flat">' + arrow + ' baseline</span>'
      : '<span class="dash-delta ' + arrCls + '">' + arrow + ' ' +
        (change > 0 ? "+" : "") + change + (wk.perWeek == null ? ' kg in ' + wk.days + (wk.days === 1 ? ' day' : ' days') : ' kg / wk · over ' + wk.days + ' days') + '</span>';
    var phStr = (ph == null) ? "\u2014" : (ph > 0 ? "+" + ph : "" + ph) + " kg";
    var chart = (log.length >= 2) ? chartBox("bw-chart", 260)
      : chartEmpty(260, "Log your bodyweight on two days to chart the trend + 7-day average.");
    return '<div class="card stack">' +
      '<div class="card__head"><div class="card__title">Bodyweight</div>' +
        '<span class="icon-pill icon-pill--cyan"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18M6 7l1.5 12.5a2 2 0 0 0 2 1.5h5a2 2 0 0 0 2-1.5L18 7"/><path d="M9 7V4h6v3"/></svg></span></div>' +
      '<div class="row between wrap"><div class="dash-big">' + lib.round(bw, 1) + '<small>kg</small></div>' + wkPill + '</div>' +
      chart +
      '<div class="kv"><span class="kv__k">Phase delta</span><span class="kv__v">' + phStr + '</span></div>' +
      '<div class="row" style="gap:var(--sp-2)">' +
        '<input class="minput" id="bw-input" type="number" inputmode="decimal" step="0.1" min="30" max="250" value="' + lib.round(bw, 1) + '" style="flex:1">' +
        '<button class="btn btn--secondary btn--sm" id="bw-log">Log today</button>' +
      '</div>' +
    '</div>';
  }

  function volumeCard(s) {
    var v = weeklyVolume(s, 8);
    var total = lib.sum(v.data);
    var nonZero = v.data.filter(function (x) { return x > 0; });
    var avg = nonZero.length ? Math.round(lib.sum(nonZero) / nonZero.length) : 0;
    var thisWk = v.data[v.data.length - 1] || 0;
    var pill = !nonZero.length
      ? '<span class="dash-delta dash-delta--flat">no volume yet</span>'
      : (thisWk >= avg
          ? '<span class="dash-delta dash-delta--up">this week ' + thisWk + ' \u00b7 \u2265 avg</span>'
          : '<span class="dash-delta dash-delta--down">this week ' + thisWk + ' \u00b7 < avg ' + avg + '</span>');
    var body = (total > 0) ? chartBox("vol-chart", 240)
      : chartEmpty(240, "Finish sessions in Workout to build your weekly volume history.");
    return '<div class="card">' +
      '<div class="card__head"><div class="card__title">Training volume \u00b7 last 8 weeks</div>' + pill + '</div>' +
      body +
      '<p class="faint text-xs mt-4 mono">Volume = rep-units across all sets (weighted reps \u00d71.5; holds \u00f75s). Weekly avg ' +
        (nonZero.length ? avg : "\u2014") + '.</p>' +
    '</div>';
  }

  function progressRxText(rx) {
    if (!rx) return "No prescription";
    var range = rx.range || [];
    return rx.sets + ' × ' + (range[0] == null ? '' : range[0] + '–') +
      (range[1] == null ? '?' : range[1]) + (rx.unit === 'sec' ? ' s' : ' reps') +
      (ui.setupText(rx) ? ' · ' + ui.setupText(rx) : '');
  }
  function progressReason(rec, rx) {
    if (!rec) return 'No saved prescription to assess.';
    var n = TDATA.EVIDENCE_SESSIONS, top = rx.range && rx.range[1];
    if (rec.why === 'no-history') return 'No comparable session yet. Log this exercise at the prescribed setup and set count.';
    if (rec.why === 'no-load') return 'Log the weight used on every set before a load step can be assessed.';
    if (rec.why === 'off-load') return 'The latest work used ' + rec.loggedKg + ' kg; your prescription says ' + rx.setup.loadKg + ' kg.';
    if (rec.why === 'below-top') return 'The latest comparable session stopped below ' + top + ' on set ' + (rec.belowSet + 1) + '.';
    if (rec.why === 'one-session') return 'One qualifying session is logged. A second session on another day is needed.';
    if (rec.why === 'same-day') return 'The top range was reached, but the last ' + n + ' comparable sessions were not on different days.';
    if (rec.why === 'effort') return 'The sets reached the top. Rate both sessions easy or just right before stepping up.';
    if (rec.why === 'hold') return 'Step-ups are paused on this prescription.';
    if (rec.why === 'declining') return 'Comparable totals fell enough for Workout to offer a step back.';
    if (rec.action === 'ready') return rec.step ? 'The required sessions reached the top on different days. Decide in Workout.' : 'The top was reached; this path has no further step.';
    if (rec.why === 'no-standard') return 'This exercise has no numeric step-up standard.';
    return 'Keep logging comparable sessions to see the next decision.';
  }
  function progressPathHtml(slot, currentId) {
    var data = TDATA, seen = {}, ids = [];
    function visit(id) {
      if (!id || seen[id] || !data.EXERCISES[id] || data.EXERCISES[id].slot !== slot) return;
      seen[id] = true; ids.push(id);
      (data.EXERCISES[id].next || []).forEach(visit);
    }
    (data.SLOTS[slot].first || []).forEach(visit);
    if (currentId && !seen[currentId]) ids.unshift(currentId);
    return ids.map(function (id) {
      var current = id === currentId, ex = DB.getExercise(id);
      return '<div class="rung' + (current ? ' is-current' : '') + '"><span class="rung__name">' +
        esc(ex ? ex.name : id) + '</span>' + (current ? '<span class="badge badge--primary">current</span>' : '') + '</div>';
    }).join('');
  }
  function progressLoadHistory(s, rx) {
    if (!rx.setup || !rx.setup.loadMode) return [];
    var setup = function (x) {
      var st = x || {};
      return JSON.stringify(Object.keys(st).filter(function (k) { return k !== 'loadKg'; }).sort()
        .map(function (k) { return [k, st[k]]; }));
    };
    var wanted = setup(rx.setup);
    return window.Training.exposures(s.sessions.filter(function (x) { return x.completed; }), rx.exerciseId)
      .filter(function (x) {
        var used = x.weights.filter(function (w, i) { return x.values[i] > 0; });
        return x.rx && !x.flagged && !x.skipped && !x.recovery && x.rx.unit === rx.unit &&
          x.rx.sets === rx.sets && setup(x.rx.setup) === wanted && used.length &&
          used[0] > 0 && used.every(function (w) { return w === used[0]; });
      }).slice(-12).map(function (x) {
        return { day: x.day, kg: x.weights.filter(function (w, i) { return x.values[i] > 0; })[0] };
      });
  }
  function progressEvidenceHtml(rec, rx, slot, s) {
    var hist = rec && rec.history || [], top = rx.range && rx.range[1];
    var unit = rx.unit === 'sec' ? ' s' : ' reps';
    var rows = hist.slice(-5).reverse().map(function (x) {
      var reached = top != null && x.values.length >= rx.sets && x.values.slice(0, rx.sets).every(function (v) { return v >= top; });
      return '<div class="prog-evidence-row"><b>' + esc(x.day) + '</b><span>' + esc(x.values.join(' / ') + unit) +
        '</span><span>' + esc(x.effort === 'moderate' ? 'just right' : x.effort || 'unrated') +
        (top == null ? ' · no numeric target' : reached ? ' · top reached' : ' · below top') + '</span></div>';
    }).join('');
    var accepted = hist.length ? '<p class="faint text-xs">Only this exercise with a matching setup, load and set count counts toward the current step. Recovery sessions and pain-flagged work are excluded.</p>' : '';
    var all = window.Training.exposures(s.sessions.filter(function (x) { return x.completed; }), rx.exerciseId);
    var other = all.length > hist.length ? '<p class="faint text-xs">' + (all.length - hist.length) + ' other logged appearances of this exercise do not match this prescription or were excluded from progression evidence.</p>' : '';
    var chart = hist.length > 1 ? chartBox('prog-trend-' + slot, 180) : '<p class="faint text-xs">Log two comparable sessions to see a trend.</p>';
    var loadRows = progressLoadHistory(s, rx);
    var load = rx.setup && rx.setup.loadMode ? '<div class="mt-3">' +
      '<div class="field__label">Weight used with this exercise</div>' +
      (loadRows.length ? chartBox('prog-load-' + slot, 150) : chartEmpty(150, 'No weight logged with this movement and setup yet.')) +
      (loadRows.length ? '<div class="prog-load-history">' + loadRows.slice(-6).map(function (x) {
        return '<span>' + esc(x.day) + ': ' + x.kg + ' kg</span>';
      }).join('') + '</div>' : '') +
      '<p class="faint text-xs">' + loadRows.length + ' logged loads with the same movement, setup and set count. Each weight is separate for rep evidence.</p></div>' : '';
    return '<details class="prog-evidence" data-prog-slot="' + esc(slot) + '"><summary>Evidence and trend · ' + hist.length + ' comparable sessions</summary>' +
      '<div class="stack mt-3"><p class="text-sm">' + esc(progressReason(rec, rx)) + '</p>' +
      (rows || '<p class="faint text-xs">Not enough data from this prescription yet.</p>') +
      accepted + other + '<div class="field__label">Total ' + (rx.unit === 'sec' ? 'seconds' : 'reps') + ' in matching sessions</div>' + chart +
      load + '<details class="prog-path"><summary>Explore the movement path</summary><div class="ladder mt-2">' + progressPathHtml(slot, rx.exerciseId) + '</div></details>' +
      '<button class="btn btn--ghost btn--sm" data-prog-workout type="button">Open Workout →</button></div></details>';
  }
  function progressSlotCard(s, slot, stalled) {
    var saved = s.training.slots[slot], prescribed = engine.prescriptionFor(slot);
    if (!saved || saved.off) return '';
    var info = TDATA.SLOTS[slot], ex = DB.getExercise(saved.exerciseId);
    var actual = prescribed && DB.getExercise(prescribed.rx.exerciseId);
    var rec = engine.recommendFor(slot);
    var status = ui.slotStatus(slot);
    var next = rec && rec.action === 'ready' && rec.step;
    var nextName = next && (DB.getExercise(next.rx.exerciseId) || {}).name || next && next.rx.exerciseId;
    var nextText = next ? (next.kind === 'movement' ? nextName :
      (nextName + (ui.setupText(next.rx) ? ' · ' + ui.setupText(next.rx) : ''))) : '';
    return '<div class="card stack prog-slot' + (stalled[slot] ? ' is-stalled' : '') + '" data-progress-slot="' + esc(slot) + '">' +
      '<div class="card__head"><div class="card__title">' + esc(info.label) +
        (stalled[slot] ? ' <span class="badge badge--warn">No recent gain</span>' : '') + '</div>' +
        '<span class="badge">' + (info.coverage ? 'Accessory' : 'Main') + '</span></div>' +
      '<div class="tier-card__cur">' + esc(prescribed && actual ? actual.name : ex ? ex.name : saved.exerciseId) + '</div>' +
      '<div class="muted text-sm">Your prescription: ' + esc(progressRxText(saved)) + '</div>' +
      (prescribed && prescribed.rx.exerciseId !== saved.exerciseId ? '<p class="text-sm">Saved choice: ' + esc(ex ? ex.name : saved.exerciseId) + '. Workout uses the movement above because that choice is unavailable.</p>' : '') +
      (!prescribed ? '<p class="text-sm">Workout has no available movement for this slot with your current equipment and limits.</p>' : '') +
      '<p class="text-sm" data-ladder-status>' + esc(status) + '</p>' +
      (next ? '<p class="faint text-xs">Step offered: ' + esc(nextText) + '</p>' : '') +
      (stalled[slot] ? '<p class="faint text-xs">Four comparable sessions over at least 14 days had no increase in total reps or seconds, with the last two rated hard or failed. Review recovery and form before changing the plan.</p>' : '') +
      progressEvidenceHtml(rec, saved, slot, s) + '</div>';
  }
  function tierLadderCard(s) {
    var main = ['push', 'row', 'pull', 'squat', 'hinge', 'core', 'shoulder', 'dip'];
    var saved = s.training && s.training.slots || {}, stalled = engine.tierStalls();
    var mains = main.filter(function (slot) { return saved[slot] && !saved[slot].off; });
    var extras = Object.keys(TDATA.SLOTS).filter(function (slot) { return TDATA.SLOTS[slot].coverage && saved[slot] && !saved[slot].off; });
    return '<div class="page-head mt-6"><div class="eyebrow">Your current plan</div><h2 class="display h3">Strength progress</h2></div>' +
      '<p class="muted text-sm">Each card follows the exercise and prescription you have chosen. A step is offered after two comparable sessions on different days; you decide in Workout.</p>' +
      '<div class="prog-slot-grid">' + mains.map(function (slot) { return progressSlotCard(s, slot, stalled); }).join('') + '</div>' +
      (extras.length ? '<details class="prog-extra mt-4"><summary>Accessory and conditioning progress · ' + extras.length + ' active</summary>' +
        '<div class="prog-slot-grid mt-3">' + extras.map(function (slot) { return progressSlotCard(s, slot, stalled); }).join('') + '</div></details>' :
        '<p class="faint text-xs mt-4">Accessory prescriptions appear here after they are first picked or added in Program.</p>');
  }

  function prTimelineCard(s) {
    var prs = (s.prs || []).slice().sort(function (a, b) { return new Date(b.dateISO) - new Date(a.dateISO); });
    var body = prs.length
      ? prs.map(function (p) {
          var val = p.kind === "hold" ? (p.value + "s") : (p.kind === "weight" ? (p.value + " kg") : (p.value + " reps"));
          var kindL = p.kind === "hold" ? ((window.TRAINING_DATA.EXERCISES[p.exerciseId] || {}).timed ? "longest set" : "max hold") : (p.kind === "weight" ? "top weight" : "best set");
          return '<div class="pr-row">' +
            '<span class="pr-row__dot"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 0 12 0V3H6z"/><path d="M6 4H3v2a3 3 0 0 0 3 3M18 4h3v2a3 3 0 0 1-3 3M9 21h6M12 15v6"/></svg></span>' +
            '<div class="pr-row__main"><div class="pr-row__t">' + esc(p.exercise) + '</div>' +
              '<div class="pr-row__s">' + kindL + ' \u00b7 ' + lib.relTime(p.dateISO) + ' \u00b7 ' + lib.fmtShort(p.dateISO) + '</div></div>' +
            '<div class="pr-row__v">' + val + '</div></div>';
        }).join("")
      : '<p class="empty-mini">No personal records yet. Finish a session in Workout and the OS captures your best set or hold per movement.</p>';
    return '<div class="card">' +
      '<div class="card__head"><div class="card__title">PR timeline</div>' +
        '<span class="badge">' + prs.length + ' record' + (prs.length === 1 ? "" : "s") + '</span></div>' +
      body +
    '</div>';
  }

  function measurementsCard(s) {
    var log = s.measurements || [];
    var latest = log.length ? log[log.length - 1] : null;
    var first = log.length ? log[0] : null;
    var tiles = MEAS_KEYS.map(function (m) {
      var lv = latest ? latest[m.k] : null;
      var fv = first ? first[m.k] : null;
      var delta = (lv != null && fv != null) ? lib.round(lv - fv, 1) : null;
      var dCls = delta == null ? "flat" : (delta > 0 ? "up" : (delta < 0 ? "down" : "flat"));
      var dStr = delta == null ? "\u2014" : (delta > 0 ? "+" + delta : "" + delta) + " cm";
      return '<div class="meas-tile"><div class="meas-tile__l">' + m.label + '</div>' +
        '<div class="meas-tile__v">' + (lv != null ? lv : "\u2014") + '<small>cm</small></div>' +
        '<div class="meas-tile__d ' + dCls + '">' + (delta == null ? "no baseline" : dStr) + '</div></div>';
    }).join("");

    var inputs = MEAS_KEYS.map(function (m) {
      var v = latest && latest[m.k] != null ? latest[m.k] : "";
      return '<label class="mfield"><span>' + m.label + ' cm</span>' +
        '<input class="minput" data-meas="' + m.k + '" type="number" inputmode="decimal" step="0.1" min="0" max="250" value="' + v + '" placeholder="0"></label>';
    }).join("");

    return '<div class="card stack">' +
      '<div class="card__head"><div class="card__title">Body measurements</div>' +
        '<span class="badge">' + log.length + ' logged' + (latest ? " \u00b7 " + lib.relTime(latest.dateISO) : "") + '</span></div>' +
      (latest ? '<div class="meas-grid">' + tiles + '</div>' : '<p class="empty-mini">No measurements yet \u2014 log your first set below to start tracking deltas.</p>') +
      '<div class="field__label mt-4">Log today (cm)</div>' +
      '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:var(--sp-3)">' + inputs + '</div>' +
      '<button class="btn btn--primary btn--sm btn--block" id="meas-log">Save measurements</button>' +
    '</div>';
  }

  function sleepCard(s) {
    var log = s.sleepLog || [];
    var keys = lastNDayKeys(14);
    var byDay = {};
    log.forEach(function (x) { byDay[Hub.dayOf(x.dateISO)] = x; });
    var hours = keys.map(function (k) { return byDay[k] ? byDay[k].hours : 0; });
    var loggedHours = hours.filter(function (h) { return h > 0; });
    var avgH = loggedHours.length ? lib.round(lib.sum(loggedHours) / loggedHours.length, 1) : 0;
    var QV = { poor: 1, fair: 2, good: 3, great: 4 };
    var QN = ["", "poor", "fair", "good", "great"];
    var qVals = keys.map(function (k) { return byDay[k] ? (QV[byDay[k].quality] || 0) : 0; }).filter(function (q) { return q > 0; });
    var avgQ = qVals.length ? QN[Math.round(lib.sum(qVals) / qVals.length)] : "\u2014";
    var QUALS = ["poor", "fair", "good", "great"];
    var last = log.length ? log[log.length - 1] : null;
    var curQ = (last && QUALS.indexOf(last.quality) >= 0) ? last.quality : "good";
    var quals = QUALS.map(function (q) {
      return '<button class="seg__btn ' + (q === curQ ? "is-active" : "") + '" data-sq="' + q + '" type="button">' + ui.cap(q) + '</button>';
    }).join("");
    var chart = (loggedHours.length) ? chartBox("sleep-chart", 200)
      : chartEmpty(200, "Log sleep to chart the last 14 nights.");

    return '<div class="card stack">' +
      '<div class="card__head"><div class="card__title">Sleep \u00b7 last 14 nights</div>' +
        '<span class="badge badge--info"><span class="dot"></span>avg ' + (loggedHours.length ? avgH + "h" : "\u2014") + '</span></div>' +
      chart +
      '<div class="row between"><span class="faint text-xs mono">Avg quality: ' + (qVals.length ? ui.cap(avgQ) : "\u2014") + '</span>' +
        '<span class="faint text-xs mono">' + loggedHours.length + ' / 14 nights logged</span></div>' +
      '<div class="field__label mt-2">Log last night</div>' +
      '<div class="row" style="gap:var(--sp-2)">' +
        '<input class="minput" id="sleep-hours" type="number" inputmode="decimal" step="0.5" min="0" max="14" value="' + (last ? last.hours : 8) + '" style="width:90px">' +
        '<span class="faint text-xs">hrs</span>' +
        '<div class="seg seg--cyan" id="sleep-qual" style="flex:1">' + quals + '</div>' +
      '</div>' +
      '<button class="btn btn--secondary btn--sm btn--block" id="sleep-log">Log sleep</button>' +
    '</div>';
  }

  /* ======================================================================
     9. PROGRESS VIEW
     ==================================================================== */
  function notesArchiveCard(s) {
    var q = (uiState.noteSearch || "").trim().toLowerCase();
    var DAY_LABEL = { push: "Push", pull: "Pull", legs: "Legs & Hips", fullbody: "Full Body & Core",
                      fullA: "Full Body A", fullB: "Full Body B", upper: "Upper", lower: "Lower" };
    var withNotes = (s.sessions || []).filter(function (x) {
      return x.completed && x.notes && x.notes.trim();
    }).slice().sort(function (a, b) { return new Date(b.dateISO) - new Date(a.dateISO); });

    var matched = q
      ? withNotes.filter(function (x) {
          return x.notes.toLowerCase().indexOf(q) >= 0 ||
            (DAY_LABEL[x.type] || x.type || "").toLowerCase().indexOf(q) >= 0;
        })
      : withNotes;

    function hl(text) {
      var safe = esc(text);
      if (!q) return safe;
      try {
        var re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
        return safe.replace(re, '<mark class="note-hl">$1</mark>');
      } catch (e) { return safe; }
    }

    var body = withNotes.length === 0
      ? '<p class="empty-mini">No session notes yet. Add notes when you complete a session and they\u2019ll archive here.</p>'
      : (matched.length === 0
          ? '<p class="empty-mini">No notes match \u201c' + esc(uiState.noteSearch) + '\u201d.</p>'
          : matched.map(function (x) {
              return '<div class="note-item"><div class="note-item__head">' +
                '<span class="note-item__day">' + (DAY_LABEL[x.type] || cap(x.type || "Session")) + '</span>' +
                '<span class="note-item__date mono">' + lib.fmtShort(lib.sessionDay(x)) + ' \u00b7 ' + lib.relTime(lib.sessionDay(x)) + '</span></div>' +
                '<p class="note-item__body">' + hl(x.notes) + '</p></div>';
            }).join(""));

    return '<div class="card stack">' +
      '<div class="card__head"><div class="card__title">Notes archive</div>' +
        '<span class="badge">' + withNotes.length + ' note' + (withNotes.length === 1 ? "" : "s") + '</span></div>' +
      '<input class="input" id="note-search" placeholder="Search notes by keyword or day type\u2026" value="' + esc(uiState.noteSearch) + '">' +
      '<div class="note-list">' + body + '</div>' +
    '</div>';
  }


  /* ======================================================================
     TRAINING CALENDAR
     Full monthly calendar view showing training sessions coloured by
     day type. Includes previous and next month navigation.
     ==================================================================== */
  var calState = { year: new Date().getFullYear(), month: new Date().getMonth() };

  function trainingCalendarCard(s) {
    return '<div class="card stack">' +
      '<div class="card__head">' +
        '<div><div class="card__title">Training Calendar</div>' +
        '<div class="cal-today-label">Today · ' + esc(lib.fmtFull(lib.today())) + '</div></div>' +
        '<span class="badge">' + engine.completedSessions().length + ' sessions logged</span>' +
      '</div>' +
      nextSessionBanner(s) +
      '<div id="cal-inner">' + buildCalendar(s) + '</div>' +
    '</div>';
  }

  /* Project the next session — just the one. Past the suggested recovery,
     when you train next is your call, not a fixed cadence, so this doesn't
     pretend to forecast a schedule; it defers to engine.nextSession, the same
     rule the start area's rest-day gate uses. Returns an array of 0 or 1
     entries so the three call sites below stay simple. */
  function projectUpcoming(s) {
    var n = engine.nextSession(s);
    return n ? [n] : [];
  }

  /* "in 3 days" beats "Thu 27 Aug" for the only question this card exists to
     answer. The absolute date stays alongside it — relative alone is useless
     for anything past the next couple of days. */
  function daysUntil(key) {
    var a = lib.parse(lib.today()), b = lib.parse(key);
    return Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()) -
                       new Date(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
  }
  function whenLabel(key) {
    var n = daysUntil(key);
    if (n <= 0) return "Today";
    if (n === 1) return "Tomorrow";
    if (n < 7) return "In " + n + " days";
    if (n < 14) return "Next week";
    return "In " + Math.round(n / 7) + " weeks";
  }
  function shortDate(dateISO) {
    var d = lib.parse(dateISO);
    return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()] + " " +
           d.getDate() + " " + MONTH_NAMES[d.getMonth()].slice(0, 3);
  }
  function typeCls(t) { return t === "legs" || t === "lower" ? "is-legs" : (t === "fullbody" || t === "fullA" || t === "fullB" ? "is-full" : ""); }

  /* The single most-asked question of this page, answered before the grid
     rather than under it. */
  function nextSessionBanner(s) {
    var up = projectUpcoming(s);
    if (!up.length) return "";
    var u = up[0];
    var when = whenLabel(u.key);
    return '<div class="nextsess' + (u.isToday ? " is-today" : "") + '">' +
      '<div class="nextsess__when">' + esc(when) + '</div>' +
      '<div class="nextsess__main">' +
        '<div class="nextsess__type ' + typeCls(u.type) + '">' + esc(engine.DAY_LABEL[u.type] || u.type) + '</div>' +
        '<div class="nextsess__date">' + esc(shortDate(u.dateISO)) + '</div>' +
      '</div>' +
      (u.isToday
        ? '<button class="btn btn--primary btn--sm" data-go="today" type="button">Start it</button>'
        : '<span class="nextsess__tag">next session</span>') +
    '</div>';
  }


  var DAY_TYPE_COLOR = {
    push:     "cal-day--trained",
    pull:     "cal-day--trained",
    legs:     "cal-day--trained cal-day--easy",
    fullbody: "cal-day--trained cal-day--hard",
    fullA:    "cal-day--trained cal-day--hard",
    fullB:    "cal-day--trained cal-day--hard",
    upper:    "cal-day--trained",
    lower:    "cal-day--trained cal-day--easy"
  };
  var DAY_TYPE_LABEL = {
    push: "Push", pull: "Pull", legs: "Legs", fullbody: "Full",
    fullA: "Full A", fullB: "Full B", upper: "Upper", lower: "Lower",
    mini: "Mini"   // a calendar cell's label: "Accessory" overflows the grid at 390 px
  };
  var MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DOW = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  function buildCalendar(s) {
    var yr = calState.year, mo = calState.month;
    var sessions = engine.completedSessions();

    // Index sessions by day key
    var byDay = {};
    sessions.forEach(function (sess) {
      var k = lib.sessionDay(sess);
      if (!byDay[k]) byDay[k] = [];
      byDay[k].push(sess);
    });

    // Project upcoming planned sessions (only show future ones on this month)
    var planned = {};
    var upcoming = projectUpcoming(s);
    upcoming.forEach(function (u) { planned[u.key] = u.type; });
    /* The next one is the only one you act on, so it gets its own treatment
       rather than looking identical to a session three weeks out. */
    var nextKey = upcoming.length ? upcoming[0].key : null;

    // Running plan overlay — scheduled run days + completed run logs, so the
    // run plan and lifting rotation visibly interlock on one calendar.
    var runPlanned = (App.run && App.run.isActive()) ? App.run.plannedByDay() : {};
    var runDone = (App.run && App.run.logByDay) ? App.run.logByDay() : {};

    // First day of month (0=Sun,1=Mon…) converted to Mon-anchor offset
    var firstDay = new Date(yr, mo, 1);
    var startOffset = (firstDay.getDay() + 6) % 7; // 0=Mon, 6=Sun
    var daysInMonth = new Date(yr, mo + 1, 0).getDate();
    var todayKey = lib.today();

    // Build day cells
    var cells = "";
    // Day-of-week headers
    cells += DOW.map(function (d) { return '<div class="cal-dow">' + d + '</div>'; }).join("");

    // Empty cells before the 1st
    for (var e = 0; e < startOffset; e++) {
      cells += '<div class="cal-day cal-day--empty"></div>';
    }

    // Day cells
    for (var day = 1; day <= daysInMonth; day++) {
      var dateObj = new Date(yr, mo, day);
      var dateKey = lib.dayKey(dateObj.toISOString());
      var isToday = dateKey === todayKey;
      var sessArr = byDay[dateKey] || [];
      var trained = sessArr.length > 0;
      var dayType = trained ? (sessArr[0].type || "push") : null;
      var plannedType = !trained ? planned[dateKey] : null;
      var typeCls = dayType ? (DAY_TYPE_COLOR[dayType] || "cal-day--trained") : "";

      // running overlay for this day
      var runLogged = !!runDone[dateKey];
      var runPlan = runPlanned[dateKey];
      var runCls = runLogged ? " cal-day--run-done" : (runPlan ? " cal-day--run" : "");
      var runDot = (runLogged || runPlan) ? '<span class="cal-day__run' + (runLogged ? " is-done" : "") + '"></span>' : "";

      var isNext = !trained && dateKey === nextKey;
      var cls = "cal-day" + (isToday ? " cal-day--today" : "") + (trained ? (" " + typeCls) : "") +
                (plannedType ? " cal-day--planned" : "") + (isNext ? " cal-day--next" : "") + runCls;
      var dot = trained ? '<span class="cal-day__dot"></span>' : "";
      var shownType = dayType || plannedType;
      /* Was 9px at .55 opacity — under the legibility floor for the label that
         says which session a day actually is. */
      var label = shownType ? '<span class="cal-day__type">' + (DAY_TYPE_LABEL[shownType] || "") + '</span>' : "";
      var liftTitle = trained ? sessArr.map(function(x){ return DAY_TYPE_LABEL[x.type]||x.type; }).join(", ")
                    : (plannedType ? (isNext ? "Next session: " : "Planned: ") + (DAY_TYPE_LABEL[plannedType] || plannedType) +
                        " · " + whenLabel(dateKey) : "");
      var runTitle = runLogged ? "Run logged" : (runPlan ? "Run planned: " + runPlan : "");
      var titleTxt = [liftTitle, runTitle].filter(Boolean).join(" + ");
      cells += '<div class="' + cls + '" title="' + titleTxt + '">' +
        '<span class="cal-day__num">' + day + '</span>' +
        dot + label + runDot +
      '</div>';
    }

    var legend = '<div class="cal-legend mt-4">' +
      '<div class="cal-legend__item"><span class="cal-legend__swatch" style="background:var(--primary-soft);border-color:rgba(204,0,0,.35)"></span>Push / Pull</div>' +
      '<div class="cal-legend__item"><span class="cal-legend__swatch" style="background:rgba(200,160,96,.12);border-color:rgba(200,160,96,.3)"></span>Legs & Hips</div>' +
      '<div class="cal-legend__item"><span class="cal-legend__swatch" style="background:rgba(204,0,0,.22);border-color:rgba(204,0,0,.5)"></span>Full Body</div>' +
      '<div class="cal-legend__item"><span class="cal-legend__swatch cal-legend__swatch--run"></span>Run day</div>' +
      '<div class="cal-legend__item"><span class="cal-legend__swatch" style="background:transparent;border-color:var(--secondary)"></span>Today</div>' +
      /* No "Planned" swatch: the next session is the only day the app marks
         ahead of time, so `cal-day--planned` and `cal-day--next` always land
         on the same cell. A legend key that can never appear on its own is
         just a thing to look for and not find. */
      '<div class="cal-legend__item"><span class="cal-legend__swatch cal-legend__swatch--next"></span>Next session</div>' +
    '</div>';

    return '<div class="cal-month">' +
      '<div class="cal-month__head">' +
        '<div class="cal-month__title">' + MONTH_NAMES[mo] + ' ' + yr + '</div>' +
        '<div class="cal-nav">' +
          '<button class="btn btn--ghost btn--sm btn--icon" id="cal-prev" type="button" aria-label="Previous month">' +
            '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>' +
          '</button>' +
          '<button class="btn btn--ghost btn--sm btn--icon" id="cal-next" type="button" aria-label="Next month">' +
            '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>' +
          '</button>' +
          '<button class="btn btn--ghost btn--sm" id="cal-today" type="button">Today</button>' +
        '</div>' +
      '</div>' +
      '<div class="cal-grid">' + cells + '</div>' +
      legend +
    '</div>';
  }

  function wireCalendar(el, s) {
    var prev = el.querySelector("#cal-prev");
    var next = el.querySelector("#cal-next");
    var today = el.querySelector("#cal-today");
    /* The banner's "Start it" sits outside #cal-inner, so it survives a
       month re-draw and only needs wiring once per render of the card. */
    el.querySelectorAll(".nextsess [data-go]").forEach(function (b) {
      if (b.dataset.wired) return;
      b.dataset.wired = "1";
      b.addEventListener("click", function () { App.showSection(b.dataset.go); });
    });
    function reDraw() {
      var inner = el.querySelector("#cal-inner");
      if (inner) { inner.innerHTML = buildCalendar(s); wireCalendar(el, s); }
    }
    if (prev) prev.addEventListener("click", function () {
      calState.month -= 1;
      if (calState.month < 0) { calState.month = 11; calState.year -= 1; }
      reDraw();
    });
    if (next) next.addEventListener("click", function () {
      calState.month += 1;
      if (calState.month > 11) { calState.month = 0; calState.year += 1; }
      reDraw();
    });
    if (today) today.addEventListener("click", function () {
      calState.year = new Date().getFullYear();
      calState.month = new Date().getMonth();
      reDraw();
    });
  }

  /* ----------------------------------------------------------------------
     SESSION LOG — recent completed sessions with edit (notes/volume) + delete.
     Basic data hygiene: fix a mis-logged session or remove a bad one.
     -------------------------------------------------------------------- */
  function sessionLogCard(s) {
    var done = engine.completedSessions().slice().reverse().slice(0, 12);
    var body;
    if (!done.length) {
      body = '<div class="empty-mini">No sessions logged yet. Finish a workout in Workout and it\'ll appear here to review, edit or remove.</div>';
    } else {
      body = '<div class="sess-log">' + done.map(function (x) {
        var dayLabel = ({ push: "Push", pull: "Pull", legs: "Legs", fullbody: "Full Body",
                          fullA: "Full Body A", fullB: "Full Body B", upper: "Upper", lower: "Lower", mini: "Accessory session" })[x.type] || cap(x.type || "session");
        return '<div class="sess-log__row" data-sid="' + esc(x.id) + '">' +
          '<div class="grow"><div class="sess-log__t">' + dayLabel + '</div>' +
            '<div class="sess-log__s">' + lib.relTime(lib.sessionDay(x)) + ' · ' + (x.exercises || []).length + ' movements · vol ' + (x.volume || 0) +
            (x.notes ? ' · has notes' : '') + '</div></div>' +
          '<div class="row" style="gap:6px">' +
            '<button class="btn btn--ghost btn--sm" data-sview="' + esc(x.id) + '" type="button">View</button>' +
            '<button class="btn btn--ghost btn--sm" data-sedit="' + esc(x.id) + '" type="button">Edit</button>' +
            '<button class="btn btn--ghost btn--sm" data-sdel="' + esc(x.id) + '" type="button" aria-label="Delete session">' +
              '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            '</button>' +
          '</div>' +
          '<div class="sess-log__detail" id="sview-' + esc(x.id) + '"></div>' +
          '<div class="sess-log__edit" id="sedit-' + esc(x.id) + '"></div>' +
        '</div>';
      }).join("") + '</div>';
    }
    return '<div class="card stack"><div class="card__head"><div class="card__title">Session log</div>' +
      '<span class="badge">' + engine.completedSessions().length + ' total</span></div>' +
      '<p class="muted text-sm">Your most recent sessions. Edit a mis-logged volume or note, or delete one entirely. Deleting also rolls its volume back out of your stats.</p>' +
      body + '</div>';
  }

  /* Read-only set-by-set breakdown of a logged session — what you actually did,
     so you can review last week's pull work without opening the volume editor. */
  function sessionDetailHtml(sess) {
    if (!sess) return '<div class="empty-mini">Session not found.</div>';
    var DIFF_C = { easy: "var(--success)", moderate: "var(--secondary)", hard: "var(--warn)", failed: "var(--danger)" };
    var DIFF_L = { moderate: "just right", unsure: "not sure" };
    var exs = (sess.exercises || []);
    var rows = exs.length ? exs.map(function (ex) {
      var unit = (ex.mode === "hold" || ex.unit === "sec") ? "sec" : "reps";
      var sets = (ex.sets || []).map(function (st, j) {
        var rep = (st.reps == null || st.reps === "") ? "—" : st.reps;
        var wt  = (st.weight != null && st.weight !== "" && Number(st.weight) > 0) ? (" × " + st.weight + " kg") : "";
        return '<span class="setpill"><b>S' + (j + 1) + '</b> ' + esc(String(rep)) + ' ' + unit + wt + '</span>';
      }).join("");
      /* Without a saved prescription, "moderate" is unknown (plan C6): the
         build before Stage 1 saved it for a blank rating. */
      var d = !ex.rx && ex.difficulty === "moderate" ? "legacy" : ex.difficulty;
      var dLabel = !d ? (ex.skipped ? "skipped" : "not rated") : d === "legacy" ? "unknown — older log" : (DIFF_L[d] || d);
      var diff = '<span class="mono" style="color:' + (DIFF_C[d] || "var(--text-300)") + ';font-size:var(--fs-2xs);text-transform:uppercase;letter-spacing:.05em">' + esc(dLabel) + '</span>';
      var flag = (ex.flag && ex.flag.bodyPart)
        ? '<span class="badge badge--warn" style="padding:1px 7px;margin-left:6px"><span class="dot"></span>' + esc(ex.flag.bodyPart) + (ex.flag.severity ? " · " + esc(ex.flag.severity) : "") + '</span>' : "";
      return '<div class="sdet-ex">' +
        '<div class="row between" style="gap:var(--sp-2)"><div class="sdet-ex__name">' + esc(ex.name || cap(ex.pattern || "Movement")) +
          (ex.era2 ? ' <span class="faint text-xs">· Era II</span>' : '') + flag + '</div>' + diff + '</div>' +
        '<div class="sdet-sets">' + (ex.skipped ? '<span class="faint text-xs">skipped — pain flag</span>' : (sets || '<span class="faint text-xs">no sets logged</span>')) + '</div>' +
      '</div>';
    }).join("") : '<div class="empty-mini">No exercise data was captured for this session.</div>';

    var meta = [];
    meta.push(ui.countsText(ui.exerciseCounts(exs)));
    meta.push("vol " + (sess.volume || 0));
    if (sess.warmupDone)   meta.push("warm-up ✓");
    if (sess.cooldownDone) meta.push("cool-down ✓");

    return '<div class="card card--glass stack mt-2 sdet">' +
      '<div class="row between wrap"><div class="eyebrow">Logged session</div>' +
        '<span class="faint text-xs mono">' + lib.relTime(lib.sessionDay(sess)) + '</span></div>' +
      '<div class="faint text-xs mono" style="margin-top:-4px">' + meta.join(" · ") + '</div>' +
      rows +
      (sess.notes ? '<div class="sdet-notes"><span class="field__label">Notes</span><p class="text-sm" style="margin:4px 0 0;color:var(--text-200)">' + esc(sess.notes) + '</p></div>' : '') +
    '</div>';
  }

  function wireSessionLog(el, s) {
    el.querySelectorAll("[data-sview]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.dataset.sview;
        var box = document.getElementById("sview-" + id);
        if (!box) return;
        if (box.getAttribute("data-open") === "1") { box.innerHTML = ""; box.removeAttribute("data-open"); return; }
        var sess = (App.getState().sessions || []).filter(function (x) { return x.id === id; })[0];
        box.setAttribute("data-open", "1");
        box.innerHTML = sessionDetailHtml(sess);
      });
    });
    el.querySelectorAll("[data-sdel]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.dataset.sdel;
        ui.confirm("Delete this session?", "This permanently removes the logged session and its volume from your history. This can't be undone.", "Delete", "danger", function () {
          var st = App.getState();
          st.sessions = (st.sessions || []).filter(function (x) { return x.id !== id; });
          App.recountStreak(st);
          App.saveState();
          App.toast("Session deleted.", "info");
          App.refresh();
        });
      });
    });
    el.querySelectorAll("[data-sedit]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.dataset.sedit;
        var box = document.getElementById("sedit-" + id);
        if (!box) return;
        if (box.getAttribute("data-open") === "1") { box.innerHTML = ""; box.removeAttribute("data-open"); return; }
        box.setAttribute("data-open", "1");
        var sess = (App.getState().sessions || []).filter(function (x) { return x.id === id; })[0];
        if (!sess) return;
        box.innerHTML =
          '<div class="card card--glass stack mt-2" style="border-color:rgba(204,0,0,.25)">' +
            '<label class="field"><span class="field__label">Volume</span>' +
              '<input class="input" id="se-vol-' + id + '" type="number" min="0" max="9999" inputmode="numeric" value="' + (Number(sess.volume) || 0) + '" /></label>' +
            '<label class="field"><span class="field__label">Notes</span>' +
              '<textarea class="textarea" id="se-notes-' + id + '" rows="2">' + esc(sess.notes || "") + '</textarea></label>' +
            '<div class="row" style="gap:var(--sp-2)">' +
              '<button class="btn btn--primary btn--sm grow" data-ssave="' + id + '" type="button">Save</button>' +
              '<button class="btn btn--ghost btn--sm" data-scancel="' + id + '" type="button">Cancel</button>' +
            '</div>' +
          '</div>';
        box.querySelector("[data-ssave]").addEventListener("click", function () {
          var st = App.getState();
          var target = (st.sessions || []).filter(function (x) { return x.id === id; })[0];
          if (target) {
            var v = parseInt(document.getElementById("se-vol-" + id).value, 10);
            if (v >= 0 && v <= 9999) target.volume = v;
            target.notes = document.getElementById("se-notes-" + id).value;
            target.updatedAt = new Date().toISOString();   // sync: the newer edit wins (R1-3)
            App.saveState();
            App.toast("Session updated.", "success");
            App.refresh();
          }
        });
        box.querySelector("[data-scancel]").addEventListener("click", function () {
          box.innerHTML = ""; box.removeAttribute("data-open");
        });
      });
    });
  }

  /* Progress used to be one 6,000px scroll: the seven tier ladders alone ate
     the first three screens, and the session log sat at 5,000px. Splitting it
     the way the rest of the app already splits dense views turns "scroll past
     everything you didn't want" into one tap. (The headline tiles used to stay
     above the tabs on every subview; they now open Overview only — F6.) Display
     names describe contents; the ids are what is stored in progTab and never change. */
  var PROG_TABS = [
    { id: "overview",     label: "Overview" },
    { id: "ladders",      label: "Exercise progress" },
    { id: "calendar",     label: "Calendar" },
    { id: "log",          label: "Session history" },
    { id: "body",         label: "Measurements & sleep" }
  ];
  function progTab() {
    var t = util.uiGet("progTab", "overview");
    return PROG_TABS.some(function (x) { return x.id === t; }) ? t : "overview";
  }

  /* The four headline figures. They used to sit above the subview strip on every
     subview, which pushed the strip to y=766 on a 390 x 844 phone — reaching Session
     history meant scrolling past four unrelated tiles (PLAN-neobrutal-ui.md F6).
     They now open the Overview subview and nothing else; two columns on a phone. */
  function progSummary(s) {
    var bw = latestBodyweight(s);
    var ph = phaseDelta(s);
    var v = weeklyVolume(s, 8);
    var totalVol = lib.sum(v.data);
    var sleep = s.sleepLog || [];
    var sleepAvg = sleep.length ? lib.round(lib.sum(lib.lastN(sleep, 7), function (x) { return x.hours; }) / Math.min(sleep.length, 7), 1) : 0;
    return '<div class="grid grid-4 prog-stats">' +
      util.statTile("Bodyweight", lib.round(bw, 1) + '<small>kg</small>', ph == null ? "log to track phase" : ("phase " + (ph > 0 ? "+" + ph : ph) + " kg")) +
      util.statTile("Total volume", String(totalVol), "rep-units \u00b7 last 8 wks") +
      util.statTile("Records", String((s.prs || []).length), "PRs captured") +
      util.statTile("Sleep avg", sleep.length ? (sleepAvg + '<small>h</small>') : "\u2014", sleep.length ? "last 7 nights" : "not logged yet") +
    '</div>';
  }

  function progTabBody(tab, s) {
    if (tab === "ladders")  return tierLadderCard(s);
    if (tab === "calendar") return trainingCalendarCard(s);
    if (tab === "log")      return '<div id="session-log-wrap">' + sessionLogCard(s) + '</div>' +
                                   '<div class="mt-4">' + notesArchiveCard(s) + '</div>';
    if (tab === "body")     return measurementsCard(s) +
                                   '<div class="mt-4">' + sleepCard(s) + '</div>';
    return progSummary(s) +
           '<div class="grid grid-2 grid-bias mt-4">' +
             bodyweightCard(s) + volumeCard(s) +
           '</div>' +
           '<div class="mt-4">' + prTimelineCard(s) + '</div>';
  }

  /* One control, two presentations, both driven by the same stored progTab:
     five real tabs where they fit, and a native <select> labelled "Progress view"
     where they don't (css/basalt-gruvbox.css shows exactly one, so the other adds
     nothing to the tab order). Both stay mounted while the panel below them is
     swapped — the old code rebuilt the whole view on every click, which dropped
     keyboard focus to <body> (F3). */
  function progNav(tab) {
    return '<div class="prog-nav mt-4">' +
      '<div class="seg prog-tabs" role="tablist" aria-label="Progress views">' +
        PROG_TABS.map(function (t) {
          var on = t.id === tab;
          return '<button class="seg__btn' + (on ? " is-active" : "") + '" role="tab" id="progtab-' + t.id + '" ' +
            'aria-selected="' + on + '" aria-controls="prog-body" tabindex="' + (on ? "0" : "-1") + '" ' +
            'data-progtab="' + t.id + '" type="button">' + esc(t.label) + '</button>';
        }).join("") +
      '</div>' +
      '<label class="field prog-select"><span class="field__label">Progress view</span>' +
        '<select class="select" id="prog-select">' +
          PROG_TABS.map(function (t) {
            return '<option value="' + t.id + '"' + (t.id === tab ? " selected" : "") + '>' + esc(t.label) + '</option>';
          }).join("") +
        '</select></label>' +
    '</div>';
  }

  function renderProgress(el, s) {
    var tab = progTab();

    el.innerHTML =
      '<div class="page-head row between wrap">' +
        '<div><div class="eyebrow">Trajectory</div><h1 class="display h2">Progress</h1></div>' +
        ui.eraBadge(s) +
      '</div>' +

      progNav(tab) +

      '<div class="mt-4" id="prog-body" role="tabpanel" aria-labelledby="progtab-' + tab + '">' + progTabBody(tab, s) + '</div>' +

      '<p class="faint text-xs mt-6 mono">PROGRESS ONLINE \u00b7 ' + (s.bodyweightLog || []).length + ' weigh-ins \u00b7 ' +
        (s.measurements || []).length + ' measurement sets \u00b7 ' + engine.completedSessions().length + ' sessions \u00b7 stored locally.</p>';

    var tabs = el.querySelectorAll("[data-progtab]");
    tabs.forEach(function (b) {
      b.addEventListener("click", function () { showProgTab(el, s, b.dataset.progtab); });
      /* Arrow keys move between tabs (one tab stop for the group); Enter and
         Space activate through the button's own click. */
      b.addEventListener("keydown", function (e) {
        var i = Array.prototype.indexOf.call(tabs, b), to = -1;
        if (e.key === "ArrowRight") to = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") to = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") to = 0;
        else if (e.key === "End") to = tabs.length - 1;
        if (to < 0) return;
        e.preventDefault();
        tabs.forEach(function (x) { x.tabIndex = -1; });
        tabs[to].tabIndex = 0;
        tabs[to].focus();
      });
    });
    var sel = el.querySelector("#prog-select");
    if (sel) sel.addEventListener("change", function () { showProgTab(el, s, sel.value); });

    wireProgBody(el, s);
  }

  /* Swap the panel; leave the control — and whatever has focus in it — alone. */
  function showProgTab(el, s, tab) {
    util.uiSet("progTab", tab);
    el.querySelectorAll("[data-progtab]").forEach(function (b) {
      var on = b.dataset.progtab === tab;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    var sel = el.querySelector("#prog-select");
    if (sel) sel.value = tab;
    var body = el.querySelector("#prog-body");
    body.setAttribute("aria-labelledby", "progtab-" + tab);
    body.innerHTML = progTabBody(tab, s);
    wireProgBody(el, s);
  }

  function wireProgBody(el, s) {
    wireProgress(el, s);
    wireCalendar(el, s);
    drawProgressCharts(el, s);
  }

  function drawProgressSlotCharts(s, slot) {
    var rx = s.training.slots[slot], rec = rx && engine.recommendFor(slot);
    if (!rx || !rec) return;
    var hist = (rec.history || []).slice(-8);
    if (hist.length >= 2) makeChart('prog-trend-' + slot, {
      type: 'line',
      data: { labels: hist.map(function (x) { return keyLabel(x.day); }), datasets: [{
        label: rx.unit === 'sec' ? 'Total seconds' : 'Total reps',
        data: hist.map(function (x) { return x.total; }), borderColor: THEME.primary,
        backgroundColor: THEME.primarySoft, borderWidth: 2, pointRadius: 4, fill: true
      }] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { tooltip: { callbacks: { label: function (c) {
          var x = hist[c.dataIndex];
          return x.values.join(' / ') + (rx.unit === 'sec' ? ' s' : ' reps') +
            (rx.setup && rx.setup.loadKg != null ? ' at ' + rx.setup.loadKg + ' kg' : '');
        } } } }, scales: axes({ zero: true, precision: 0, xTicks: 6 }) }
    });
    var loads = progressLoadHistory(s, rx);
    if (loads.length) makeChart('prog-load-' + slot, {
      type: 'line',
      data: { labels: loads.map(function (x) { return keyLabel(x.day); }), datasets: [{
        label: 'Weight used', data: loads.map(function (x) { return x.kg; }),
        borderColor: THEME.info, backgroundColor: THEME.primarySoft, borderWidth: 2,
        pointRadius: 4, fill: false
      }] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { tooltip: { callbacks: { label: function (c) { return c.parsed.y + ' kg'; } } } },
        scales: axes({ zero: false, precision: 1, xTicks: 6 }) }
    });
  }

  function drawProgressCharts(el, s) {
    /* bodyweight line + 7-day rolling average */
    var log = s.bodyweightLog || [];
    if (log.length >= 2) {
      var avg = rollingAvg(log);
      makeChart("bw-chart", {
        type: "line",
        data: {
          labels: log.map(function (b) { return lib.fmtShort(b.dateISO); }),
          datasets: [
            { label: "Bodyweight", data: log.map(function (b) { return b.kg; }),
              borderColor: THEME.cyan, backgroundColor: THEME.cyanSoft, borderWidth: 2, tension: 0.3,
              pointRadius: 2.5, pointBackgroundColor: THEME.cyan, fill: true },
            { label: "7-day avg", data: avg,
              borderColor: THEME.primary, borderWidth: 2, borderDash: [5, 4], tension: 0.3, pointRadius: 0, fill: false }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: true, position: "top", labels: { boxWidth: 12, color: THEME.text, usePointStyle: true } },
            tooltip: { callbacks: { label: function (c) { return c.dataset.label + ": " + c.parsed.y + " kg"; } } } },
          scales: axes({ zero: false, grace: "12%", precision: 1 })
        }
      });
    }

    /* weekly volume bars */
    var v = weeklyVolume(s, 8);
    if (lib.sum(v.data) > 0) {
      makeChart("vol-chart", {
        type: "bar",
        data: {
          labels: v.keys.map(function (k) { return keyLabel(k); }),
          datasets: [{ label: "Volume", data: v.data, backgroundColor: THEME.primarySoft, borderColor: THEME.primary,
            borderWidth: 1, borderRadius: 5, maxBarThickness: 40 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { tooltip: { callbacks: { label: function (c) { return c.parsed.y + " rep-units"; },
            title: function (items) { return "Week of " + items[0].label; } } } },
          scales: axes({ zero: true, precision: 0, xTicks: 8 })
        }
      });
    }

    /* sleep bars (last 14) + 8h goal line */
    var slog = s.sleepLog || [];
    var keys = lastNDayKeys(14);
    var byDay = {};
    slog.forEach(function (x) { byDay[Hub.dayOf(x.dateISO)] = x; });
    var hours = keys.map(function (k) { return byDay[k] ? byDay[k].hours : 0; });
    if (hours.some(function (h) { return h > 0; })) {
      var colors = hours.map(function (h) { return h === 0 ? "rgba(240,222,180,.05)" : (h >= 7 ? THEME.success : THEME.warn); });
      makeChart("sleep-chart", {
        data: {
          labels: keys.map(function (k) { return keyLabel(k); }),
          datasets: [
            { type: "bar", label: "Hours", data: hours, backgroundColor: colors, borderRadius: 4, maxBarThickness: 22, order: 2 },
            { type: "line", label: "Goal", data: keys.map(function () { return 8; }),
              borderColor: THEME.info, borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, fill: false, order: 1 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { tooltip: { callbacks: { label: function (c) { return c.dataset.label === "Goal" ? "goal 8h" : (c.parsed.y + " h"); } } } },
          scales: { x: { grid: { display: false }, ticks: { color: THEME.faint, maxRotation: 0, autoSkip: true, maxTicksLimit: 7 } },
            y: { beginAtZero: true, suggestedMax: 10, grid: { color: THEME.grid }, ticks: { color: THEME.faint, stepSize: 2 } } }
        }
      });
    }
  }

  function wireProgress(el, s) {
    wireSessionLog(el, s);
    el.querySelectorAll('.prog-evidence').forEach(function (details) {
      details.addEventListener('toggle', function () {
        if (details.open) drawProgressSlotCharts(s, details.dataset.progSlot);
      });
    });
    el.querySelectorAll('[data-prog-workout]').forEach(function (button) {
      button.addEventListener('click', function () { App.showSection('today'); });
    });
    /* bodyweight */
    var bwLog = el.querySelector("#bw-log");
    if (bwLog) bwLog.addEventListener("click", function () {
      logBodyweight(Number((el.querySelector("#bw-input") || {}).value));
    });

    /* sleep quality segmented control */
    var qual = el.querySelector("#sleep-qual");
    if (qual) qual.querySelectorAll("[data-sq]").forEach(function (b) {
      b.addEventListener("click", function () {
        qual.querySelectorAll("[data-sq]").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      });
    });
    var slLog = el.querySelector("#sleep-log");
    if (slLog) slLog.addEventListener("click", function () {
      var hrs = Number((el.querySelector("#sleep-hours") || {}).value);
      var active = qual ? qual.querySelector(".is-active") : null;
      logSleep(hrs, active ? active.dataset.sq : "good");
    });

    /* measurements */
    var measLog = el.querySelector("#meas-log");
    if (measLog) measLog.addEventListener("click", function () {
      var vals = {};
      MEAS_KEYS.forEach(function (m) { vals[m.k] = (el.querySelector('[data-meas="' + m.k + '"]') || {}).value; });
      logMeasurements(vals);
    });

    /* notes archive search — re-render the card in place, keep focus */
    var noteSearch = el.querySelector("#note-search");
    if (noteSearch) noteSearch.addEventListener("input", function () {
      uiState.noteSearch = noteSearch.value;
      var card = noteSearch.closest(".card");
      if (!card) return;
      var fresh = document.createElement("div");
      fresh.innerHTML = notesArchiveCard(s);
      card.replaceWith(fresh.firstChild);
      var ns = el.querySelector("#note-search");
      if (ns) { ns.focus(); try { ns.setSelectionRange(ns.value.length, ns.value.length); } catch (e) {} }
      wireProgress(el, s);
    });
  }

  /* ======================================================================
     10. MOUNT — register on DOMContentLoaded (after the core handler).
     ==================================================================== */
  function mount() {
    themeChart();
    App.registerView("progress", renderProgress);
    /* The calendar is defined in this part but rendered from the dashboard
       too, and the two live in separate IIFEs — so it is published rather
       than duplicated. Both callers get the same card and the same month
       state. */
    App.calendarCard = trainingCalendarCard;
    App.wireCalendar = wireCalendar;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

})();

/* ===== BASALT script block 6 (source lines 6438-7313) ===== */
/* ============================================================================
   IRONFRAME — PART 6
   The intelligence layer: the three-section phase report, closing a period,
   the Era-transition flow, plus
   the Program control view that completes the navigation. Backup / restore /
   reset already ship in Part 1 (wireSettings) — this part wires what remained.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.App) return;

  var App    = window.App;
  var lib    = App.lib;
  var engine = App.engine;
  var ui     = App.ui;
  var util   = App.util;
  var DB     = window.DB;
  var PROG   = App.PROGRESSIONS || {};
  var esc    = (lib && lib.esc) || function (s) { return String(s); };

  var PATTERNS = (DB && DB.PATTERNS) || ["push", "pull", "squat", "hinge", "core", "shoulder", "dip"];
  var TDATA = window.TRAINING_DATA;
  var DIFF_NUM = { easy: 1, moderate: 2, hard: 3, failed: 4 };

  /* ----------------------------------------------------------------------
     0. CHART.JS — local theme + safe create (Part 5's layer is out of scope;
        re-declare an equivalent, keeping the one-time theming guard).
     -------------------------------------------------------------------- */
  /* Chart.js needs literal colour strings, so these can't BE custom properties
     — but they can be read FROM them. Resolving against the live cascade is
     what lets a palette switch (js/theme.js) reach the charts; the Gruvbox
     values stay as fallbacks for a stylesheet that never loaded. */
  var THEME = {};
  function readChartTheme() {
    var cs = getComputedStyle(document.documentElement);
    function v(name, fallback) { return (cs.getPropertyValue(name) || "").trim() || fallback; }
    THEME.text        = v("--fg2", "#d5c4a1");
    THEME.strong      = v("--fg0", "#fbf1c7");
    THEME.faint       = v("--fg4", "#a89984");
    THEME.grid        = "rgba(" + v("--fg4-rgb", "168,153,132") + ",.10)";
    THEME.line2       = "rgba(" + v("--fg4-rgb", "168,153,132") + ",.20)";
    THEME.surf        = v("--bg0", "#282828");
    THEME.primary     = v("--orange-bright", "#fe8019");
    THEME.primarySoft = "rgba(" + v("--orange-bright-rgb", "254,128,25") + ",.55)";
    THEME.cyan        = v("--aqua-bright", "#8ec07c");
    THEME.cyanSoft    = "rgba(" + v("--aqua-bright-rgb", "142,192,124") + ",.16)";
    THEME.success     = v("--green-bright", "#b8bb26");
    THEME.warn        = v("--yellow-bright", "#fabd2f");
    THEME.info        = v("--blue-bright", "#83a598");
    THEME.era2        = THEME.primary;
    return THEME;
  }
  readChartTheme();
  /* A palette switch invalidates every cached hex above, and Chart.js only
     applies its defaults once — so drop the guard and let them be reapplied. */
  document.addEventListener("wh:themechange", function () {
    readChartTheme();
    if (window.Chart) window.Chart.__ironframeThemed = false;
  });
  function themeChart() {
    if (!window.Chart || window.Chart.__ironframeThemed) return;
    try {
      var C = window.Chart;
      C.defaults.font.family = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
      C.defaults.font.size = 11;
      C.defaults.color = THEME.text;
      C.defaults.plugins.legend.display = false;
      var tt = C.defaults.plugins.tooltip;
      tt.backgroundColor = THEME.surf; tt.borderColor = THEME.line2; tt.borderWidth = 1;
      tt.titleColor = THEME.strong; tt.bodyColor = THEME.text; tt.padding = 10; tt.cornerRadius = 8; tt.displayColors = false;
    } catch (e) {}
    window.Chart.__ironframeThemed = true;
  }
  var CHARTS = {};
  function makeChart(id, cfg) {
    if (!window.Chart) return null;
    var cv = document.getElementById(id);
    if (!cv) return null;
    if (CHARTS[id]) { try { CHARTS[id].destroy(); } catch (e) {} delete CHARTS[id]; }
    var existing = (window.Chart.getChart ? window.Chart.getChart(cv) : null);
    if (existing) { try { existing.destroy(); } catch (e) {} }
    try { CHARTS[id] = new window.Chart(cv, cfg); } catch (e) { console.error("chart " + id, e); }
    return CHARTS[id];
  }
  function axes(opts) {
    opts = opts || {};
    return {
      x: { grid: { display: false, drawBorder: false }, ticks: { color: THEME.faint, maxRotation: 0, autoSkip: true, maxTicksLimit: opts.xTicks || 7 } },
      y: { beginAtZero: opts.zero !== false, grace: opts.grace || 0, grid: { color: THEME.grid, drawBorder: false }, ticks: { color: THEME.faint, precision: opts.precision } }
    };
  }
  function chartBox(id, h) { return '<div class="chart-box" style="height:' + h + 'px"><canvas id="' + id + '"></canvas></div>'; }
  function chartEmpty(h, msg) { return '<div class="chart-box" style="height:' + h + 'px"><div class="chart-empty">' + msg + '</div></div>'; }

  /* ----------------------------------------------------------------------
     1. DATE / FORMAT HELPERS (local; App.lib.weekKey is broken so unused).
     -------------------------------------------------------------------- */
  function keyLabel(k) {
    var p = String(k).split("-");
    if (p.length === 3) {
      return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]))
        .toLocaleDateString(undefined, { day: "numeric", month: "short" });
    }
    return lib.fmtShort(k);
  }
  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
  function prettyPart(p) { return ({ lowerBack: "lower back", hipFlexor: "hip flexor" })[p] || p; }
  function r1(n) { return lib.round(n, 1); }
  function inPhase(startKey, v) {
    /* v is a record's timestamp or a session's day key. Hub.dayOf takes the
       local day with the rollover applied, never the UTC slice:
       "2026-06-02T18:30:00.000Z" is 3 June in IST, not 2 June. */
    return lib.daysBetween(startKey, Hub.dayOf(v)) >= 0;
  }

  /* ----------------------------------------------------------------------
     2. EVALUATION ENGINE
     completionRate · avgRepsRatio · weightTrend (linear regression) ·
     avgDifficulty · avgSleep · plateauFlags  ->  score 0-100, grade S/A/B/C/D.
     -------------------------------------------------------------------- */
  function linreg(pts) {
    var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
    pts.forEach(function (p) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; });
    var d = n * sxx - sx * sx;
    if (!d) return { slope: 0, intercept: n ? sy / n : 0 };
    var slope = (n * sxy - sx * sy) / d;
    return { slope: slope, intercept: (sy - slope * sx) / n };
  }
  /* The phase report has no grade (plan D5). Three sections, each with its
     own sample size, so you can judge how far to trust each one:
       adherence    main sessions attended out of the template's planned
                    sessions; mini-sessions are a line of their own (plan D3),
                    never attendance
       performance  per slot: comparable sessions this period, steps taken
       recovery     pain flags, exercises rated Failed, recovery blocks
     Bodyweight is reported beside them and feeds nothing. Nothing here
     changes a target: prescriptions move only on their own evidence. */
  function evaluate(s) {
    var phase = s.currentPhase;
    var startKey = Hub.dayOf(phase.startISO);
    var dayInfo = util.phaseDayInfo(phase);
    var all = (s.sessions || []).filter(function (x) { return x.completed; });
    var sess = all.filter(function (x) { return inPhase(startKey, lib.sessionDay(x)); });
    var main = sess.filter(function (x) { return !engine.isMini(x); });

    /* 1 · adherence — main sessions only. Recovery below reads every
       session: effort and pain in a mini-session are still effort and pain. */
    var expected = engine.expectedSessions(phase, main.length);
    var tpl = engine.TEMPLATES[phase.template] || engine.TEMPLATES.rotation;

    /* 2 · performance — comparable sessions are the ones the step rule would
       count (same exercise, setup and sets, as prescribed), so this reads
       against today's prescription: sessions before a step, and sessions
       inside a recovery block, aren't in it, and neither is an exercise
       with nothing logged on it. Steps count up and back, and stepping
       into an optional branch move (an "option" decision) is a step too. */
    var decisions = s.training.decisions || {};
    var slots = Object.keys(TDATA.SLOTS).map(function (slot) {
      var rx = s.training.slots[slot];
      if (!rx || rx.off) return null;
      var n = window.Training.comparable(all, rx).filter(function (e) { return e.day >= startKey && e.total > 0; }).length;
      /* A double step is two steps taken. */
      var steps = Object.keys(decisions).filter(function (k) {
        var ex = TDATA.EXERCISES[k.split("|")[0]], d = decisions[k];
        return (d.choice === "step" || d.choice === "option") && ex && ex.slot === slot && inPhase(startKey, d.at);
      }).reduce(function (n, k) { return n + (decisions[k].steps === 2 ? 2 : 1); }, 0);
      return { slot: slot, rx: rx, comparable: n, steps: steps };
    }).filter(Boolean);

    /* 3 · recovery — effort is rated per exercise, not per set, so "failed"
       counts exercises. */
    var rated = 0, failed = 0;
    sess.forEach(function (x) {
      (x.exercises || []).forEach(function (ex) {
        if (ex.skipped || !DIFF_NUM[ex.difficulty]) return;
        rated++; if (ex.difficulty === "failed") failed++;
      });
    });
    var parts = {}, flagN = 0, sharp = 0;
    (s.flagsHistory || []).filter(function (f) { return inPhase(startKey, f.dateISO); }).forEach(function (f) {
      parts[f.bodyPart] = (parts[f.bodyPart] || 0) + 1; flagN++;
      if (f.severity === "sharp") sharp++;
    });
    var today = lib.today();
    /* Every block that overlaps the period, counted by its days inside it: a
       block running when a period closes belongs to both (R3-2). */
    var blocks = (s.recoveryBlocks || []).filter(function (b) {
      return engine.recoveryEnd(b) > startKey && engine.recoveryEnd(b) > b.startKey;
    }).map(function (b) {
      var from = b.startKey > startKey ? b.startKey : startKey;
      return { id: b.id, startKey: b.startKey, reason: b.reason,
               days: Math.min(lib.daysBetween(from, engine.recoveryEnd(b)), lib.daysBetween(from, today) + 1) };
    });
    var blockSessions = sess.filter(function (x) { return x.recovery; }).length;

    /* Bodyweight: reported, never graded. Linear regression on in-phase weigh-ins. */
    var pts = [];
    (s.bodyweightLog || []).forEach(function (b) {
      if (inPhase(startKey, b.dateISO)) pts.push({ x: lib.daysBetween(startKey, Hub.dayOf(b.dateISO)), y: Number(b.kg) || 0 });
    });
    pts.sort(function (a, b) { return a.x - b.x; });
    var lr = pts.length >= 2 ? linreg(pts) : null;

    return {
      sampleSize: main.length, expected: expected, dayInfo: dayInfo, points: pts, trendLine: lr,
      weightTrend: lr ? lr.slope * 7 : null,                      // kg / week
      adherence: { attended: main.length, planned: expected, rate: expected ? main.length / expected : 0, template: tpl,
                   accessory: sess.length - main.length },
      performance: { slots: slots, comparable: slots.reduce(function (a, r) { return a + r.comparable; }, 0),
                     steps: slots.reduce(function (a, r) { return a + r.steps; }, 0) },
      recovery: { flags: flagN, sharp: sharp, parts: parts, rated: rated, failed: failed,
                  blocks: blocks, blockSessions: blockSessions, sessions: sess.length }
    };
  }

  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }

  /* One section of the report: a heading, its sample size, one row per line
     (left text, right figure) and the limit of what it can say. */
  function sectionHTML(key, title, sample, rows, note) {
    return '<div class="rc-section" data-ev-section="' + key + '"><div class="rc-section__h">' + title + '</div>' +
      '<p class="rc-sub" data-ev-sample style="margin-bottom:var(--sp-2)">' + sample + '</p>' +
      '<div class="rc-diff">' + rows.map(function (r) {
        return '<div class="rc-diff__row" style="flex-wrap:wrap"><span style="flex:1 1 14ch">' + r[0] + '</span><span class="mono" style="margin-left:auto;text-align:right">' + r[1] + '</span></div>';
      }).join("") + '</div>' +
      '<p class="faint text-xs" style="margin:var(--sp-2) 0 0">' + note + '</p></div>';
  }

  function sectionsHTML(ev, s) {
    var a = ev.adherence, p = ev.performance, r = ev.recovery, phase = s.currentPhase;
    var partial = ev.dayInfo.day < phase.lengthDays;
    var adh = sectionHTML("adherence", "Adherence",
      plural(a.planned, "session") + " planned · day " + ev.dayInfo.day + " of " + phase.lengthDays + (a.planned < 3 ? " — too few to say much" : ""),
      [["Sessions attended", a.attended + " of " + a.planned],
       ["Accessory sessions", String(a.accessory)],
       ["Plan", esc(a.template.label) + " · " + esc(a.template.short)]],
      (partial ? "Planned is counted up to today, so a period part-way through is read against fewer sessions." : "Planned comes from the template this period ran under.") +
        " Accessory sessions are extra work, so they never count as attended.");

    var perf = sectionHTML("performance", "Performance",
      plural(p.comparable, "comparable session") + " this period · " + plural(p.steps, "step") + " taken",
      p.slots.length ? p.slots.map(function (x) {
        var setup = ui.setupText ? ui.setupText(x.rx) : "";
        return [esc(((DB.getExercise(x.rx.exerciseId) || {}).name || x.rx.exerciseId) + (setup ? " · " + setup : "")) + ' <span class="faint text-xs">' + esc(cap(x.slot)) + '</span>',
                x.comparable + " comparable · " + plural(x.steps, "step")];
      }) : [["No prescriptions yet", "—"]],
      "Comparable means the same exercise, setup and sets, done as prescribed: sessions before a step, flagged or skipped, or inside a recovery block aren't counted. Steps count both up and back. This isn't a grade, and it can't see your form.");

    var partList = Object.keys(r.parts).map(function (k) { return esc(prettyPart(k)) + " ×" + r.parts[k]; }).join(", ");
    var rec = sectionHTML("recovery", "Recovery",
      plural(r.rated, "rated exercise") + " in " + plural(r.sessions, "session"),
      [["Pain flags", r.flags + (r.flags ? " · " + plural(r.sharp, "sharp", "sharp") + (partList ? " · " + partList : "") : "")],
       ["Exercises rated Failed", r.failed + " of " + r.rated],
       ["Recovery blocks", r.blocks.length + (r.blocks.length ? " · " + plural(r.blocks.reduce(function (n, b) { return n + b.days; }, 0), "day") + " · " + plural(r.blockSessions, "session") + " at reduced sets" : "")]],
      "Effort is rated per exercise, not per set, so Failed counts exercises. Pain and effort are self-reports: the app can't see pain you don't log or measure recovery.");
    return adh + perf + rec;
  }

  /* ----------------------------------------------------------------------
     3. CLOSING A PERIOD — generate + save the next phase.
     -------------------------------------------------------------------- */
  /* "Phase N", plus a note for a save that was mid-deload when recovery
     blocks replaced the 28-day deload: that phase still runs its volume. */
  function phaseTag(phase) {
    return "Phase " + phase.number + ((Number(phase.volumeFactor) || 1) < 1 ? " · deload from before recovery blocks" : "");
  }

  /* Closes the current period into phaseHistory and opens the next. The entry
     keeps the template the period ran under, what it planned and what you
     attended, so its attendance never changes afterwards (P3), and the three
     sections' counts. `closedBy` is "report" at the end of a period, or
     "template" when switching template closed it early (engine.setTemplate).
     The next period runs the template you're on now. It changes no
     prescription: closing a period is reporting, not progression (D5). A
     phase saved before this build can carry a deload volumeFactor, and a
     template switch keeps it; a report never creates one. */
  function closePeriod(closedBy) {
    var s = App.getState();
    var ev = evaluate(s);
    var phase = s.currentPhase;

    var entry = {
      number: phase.number,
      template: phase.template || "rotation",
      attended: ev.sampleSize,
      planned: ev.expected,
      startISO: phase.startISO,
      closedBy: closedBy,
      comparable: ev.performance.comparable,
      steps: ev.performance.steps,
      flags: ev.recovery.flags,
      failed: ev.recovery.failed,
      rated: ev.recovery.rated,
      blocks: ev.recovery.blocks.length,
      tierLevels: (function () { var o = {}; PATTERNS.forEach(function (p) { o[p] = (s.tiers[p] || {}).level || 1; }); return o; })(),
      endedISO: lib.iso()
    };
    s.phaseHistory.push(entry);

    var carry = closedBy === "template";
    s.currentPhase = { number: phase.number + 1, startISO: lib.iso(), lengthDays: 28, action: carry ? (phase.action || "start") : "start",
                       weighIns: [], volumeFactor: carry ? Number(phase.volumeFactor) || 1 : 1, template: engine.templateId() };
    App.saveState();
    return entry;
  }

  /* ----------------------------------------------------------------------
     4. PHASE REPORT modal.
     -------------------------------------------------------------------- */
  function ensureReportModal() {
    var m = document.getElementById("modal-report");
    if (!m) {
      m = document.createElement("div");
      m.className = "modal"; m.id = "modal-report"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
      m.innerHTML = '<div class="modal__backdrop" data-close></div><div class="modal__dialog"></div>';
      document.body.appendChild(m);
    }
    return m;
  }

  function reportHTML(ev, s) {
    var phase = s.currentPhase;
    var range = keyLabel(Hub.dayOf(phase.startISO)) + " → " + keyLabel(lib.today());

    var era = (s.era === 2)
      ? '<div class="rc-section"><div class="rc-era"><div class="rc-era__t">Era II · Hybrid Strength reached</div>' +
          '<p class="text-sm muted" style="margin-top:4px">All Era I benchmarks cleared — an achievement. Loaded movements are in every slot\'s Swap list for any equipment you own.</p></div></div>'
      : '';

    return '<div class="modal__head">' +
        '<div><div class="eyebrow">' + phaseTag(phase) + ' · ' + range + '</div>' +
        '<h3 class="display h3">Phase report</h3></div>' +
        '<button class="modal__close" data-close aria-label="Close">' +
          '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button></div>' +
      '<p class="muted text-sm" style="margin:0">Three separate readings, each with its sample size. There is no overall grade: they measure different things.</p>' +
      sectionsHTML(ev, s) + era +
      '<div class="rc-section"><div class="rc-section__h">Closing this phase</div>' +
        '<p class="text-sm muted" style="margin:0">Phase ' + (phase.number + 1) + ' runs under ' + esc(engine.template().label) + '. Nothing in your program changes: every prescription keeps its range and steps up on its own evidence, when you say yes.</p></div>' +
      '<div class="modal__foot">' +
        '<button class="btn btn--ghost" data-close>Not yet</button>' +
        '<button class="btn btn--primary" id="rc-apply">Begin Phase ' + (phase.number + 1) + ' →</button>' +
      '</div>';
  }

  function openReportCard() {
    var s = App.getState();
    var ev = evaluate(s);
    var phase = s.currentPhase;
    var m = ensureReportModal();
    var dlg = m.querySelector(".modal__dialog");
    dlg.innerHTML = reportHTML(ev, s);

    var applyBtn = dlg.querySelector("#rc-apply");
    if (applyBtn) {
      applyBtn.addEventListener("click", function () {
        closePeriod("report");
        App.closeModal("modal-report");
        App.toast("Phase " + phase.number + " closed · " + ev.sampleSize + " of " + ev.expected + " sessions attended · Phase " + (phase.number + 1) + " begins.", "success", 4800);
        App.showSection("evaluation");
      });
    }
    App.openModal("modal-report");
  }

  /* ----------------------------------------------------------------------
     5. EVALUATION VIEW
     -------------------------------------------------------------------- */
  function historyRow(h) {
    /* A phase closed before this build has a grade and an action; keep it
       as it was. Later ones show their counts. */
    if (h.grade) {
      return '<div class="ev-hist__row">' +
        '<div class="ev-hist__g" style="color:' + gradeColor(h.grade) + '">' + h.grade + '</div>' +
        '<div class="grow"><div class="ev-hist__t">Phase ' + h.number + ' · ' + actionLabel(h.action) + '</div>' +
        '<div class="ev-hist__s">score ' + h.score + ' · ' + lib.relTime(h.endedISO) + (h.plateaus && h.plateaus.length ? ' · ' + h.plateaus.length + ' flag' + (h.plateaus.length === 1 ? "" : "s") : "") + '</div></div>' +
        '<span class="badge">' + h.score + '</span></div>';
    }
    return '<div class="ev-hist__row">' +
      '<div class="ev-hist__g" style="font-size:var(--fs-md)">' + h.attended + '/' + h.planned + '</div>' +
      '<div class="grow"><div class="ev-hist__t">Phase ' + h.number + ' · ' + esc((engine.TEMPLATES[h.template] || engine.TEMPLATES.rotation).label) + '</div>' +
      '<div class="ev-hist__s">' + plural(h.steps || 0, "step") + ' · ' + plural(h.flags || 0, "flag") + ' · ' + plural(h.blocks || 0, "recovery block") + ' · ' + lib.relTime(h.endedISO) + '</div></div></div>';
  }

  /* Legacy history rows still need their colour and label. */
  var GRADE_VAR = { S: "--yellow-bright", A: "--green-bright", B: "--aqua-bright", C: "--orange-bright", D: "--red-bright" };
  function gradeColor(g) {
    var v = "";
    try { v = getComputedStyle(document.documentElement).getPropertyValue(GRADE_VAR[g] || "").trim(); } catch (e) {}
    return v || "var(--text-400)";
  }
  function actionLabel(a) { return { advance: "Advance", consolidate: "Consolidate", deload: "Deload" }[a] || cap(a || "start"); }

  function renderEvaluation(el, s) {
    var ev = evaluate(s);
    var phase = s.currentPhase;
    var info = ev.dayInfo;
    var phaseDone = info.day >= phase.lengthDays;

    var hist = (s.phaseHistory || []).slice().reverse();
    var histHtml = hist.length
      ? '<div class="ev-hist">' + hist.map(historyRow).join("") + '</div>'
      : '<div class="empty-mini">No phases closed yet. Train through this block, then close it out here to bank a report.</div>';

    var chart = ev.points.length >= 2 ? chartBox("ev-bw-chart", 220)
      : chartEmpty(220, "Log bodyweight on two days this phase to chart the trend.");
    var blockOn = !!engine.recoveryOn(lib.today());

    el.innerHTML =
      '<div class="page-head row between wrap">' +
        '<div><div class="eyebrow">Phase intelligence</div><h1 class="display h2">Phase review</h1></div>' +
        ui.eraBadge(s) +
      '</div>' +

      '<div class="card card--accent card--pad-lg ev-hero stack">' +
        '<div><div class="eyebrow">' + phaseTag(phase) + '</div>' +
        '<h2 class="display h2">' + (phaseDone ? "Phase complete" : "Day " + info.day + " of " + phase.lengthDays) + '</h2>' +
        '<p class="muted text-sm" style="max-width:52ch">' +
          (phaseDone
            ? "This block is up — close it out to bank its report and start the next."
            : info.remaining + " days left. You can preview the report any time.") +
        '</p></div>' +
        '<div class="progress" style="height:12px"><div class="progress__bar" style="width:' + info.pct + '%"></div></div>' +
        '<button class="btn btn--primary btn--lg btn--block" id="ev-open">' +
          '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M8.5 13l-1.5 8 5-3 5 3-1.5-8"/></svg>' +
          (phaseDone ? "Open the phase report" : "Preview the phase report") + '</button>' +
      '</div>' +

      ui.recoveryHtml(s) +

      '<div class="card mt-4 stack" id="ev-live"><div class="card__head"><div class="card__title">This phase so far</div>' +
        '<span class="badge">' + plural(ev.sampleSize, "session") + '</span></div>' + sectionsHTML(ev, s) + '</div>' +

      '<div class="card mt-4 stack"><div class="card__head"><div class="card__title">Bodyweight this phase</div>' +
        '<span class="badge badge--' + (ev.weightTrend == null ? "info" : "primary") + '">' +
          (ev.weightTrend == null ? "baseline" : (ev.weightTrend >= 0 ? "+" : "") + r1(ev.weightTrend) + " kg/wk") + '</span></div>' +
        chart +
        '<p class="faint text-xs mono">Reported, never graded. Dashed line is the least-squares trend of this phase\'s weigh-ins.</p>' +
      '</div>' +

      '<div class="card mt-4 stack"><div class="card__head"><div class="card__title">Manual controls</div>' +
        '<span class="badge">your call</span></div>' +
        '<p class="muted text-sm">Close this phase early to bank its report now' + (blockOn ? "" : ', or start a recovery block when you\'re run down') + '.</p>' +
        '<div class="row" style="gap:var(--sp-2);flex-wrap:wrap">' +
          '<button class="btn btn--secondary btn--sm grow" id="ev-close-now">' +
            '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
            'Close phase &amp; report now</button>' +
          (blockOn ? "" :
          '<button class="btn btn--ghost btn--sm grow" id="ev-rb-now">' +
            '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6M12 22v-6M4.9 4.9l4.2 4.2M14.9 14.9l4.2 4.2M2 12h6M22 12h-6"/></svg>' +
            'Start a recovery block</button>') +
        '</div>' +
        (blockOn ? "" : '<p class="faint text-xs">A recovery block cuts working sets to 60% for 7 days (3 become 2). It keeps your movements, ranges and rest, steps nothing up, and its sessions don\'t count as evidence. End it any time from its banner.</p>') +
      '</div>' +

      '<div class="page-head" style="margin-top:var(--sp-8)"><div class="eyebrow">Track record</div><h2 class="display h3">Phase history</h2></div>' +
      histHtml +

      '<p class="faint text-xs mt-6 mono">PHASE REVIEW ONLINE · ' + (s.phaseHistory || []).length + ' phases closed · ' + engine.completedSessions().length + ' lifetime sessions · stored locally.</p>';

    var openBtn = document.getElementById("ev-open");
    if (openBtn) openBtn.addEventListener("click", openReportCard);

    var closeNow = document.getElementById("ev-close-now");
    if (closeNow) closeNow.addEventListener("click", openReportCard);

    var rbNow = document.getElementById("ev-rb-now");
    if (rbNow) rbNow.addEventListener("click", function () {
      var b = engine.startRecovery("asked");
      if (b) App.toast("Recovery block started for " + b.days + " days. End it any time from the banner.", "success", 4800);
      App.showSection("evaluation");
    });
    ui.wireRecovery(el);

    drawEvalChart(s, ev);
  }

  function drawEvalChart(s, ev) {
    if (ev.points.length < 2) return;
    var startKey = Hub.dayOf(s.currentPhase.startISO);
    var labels = ev.points.map(function (p) { return keyLabel(lib.dayKey(lib.addDays(startKey, p.x))); });
    var trend = ev.trendLine ? ev.points.map(function (p) { return r1(ev.trendLine.slope * p.x + ev.trendLine.intercept); }) : null;
    makeChart("ev-bw-chart", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "Bodyweight", data: ev.points.map(function (p) { return p.y; }),
            borderColor: THEME.cyan, backgroundColor: THEME.cyanSoft, borderWidth: 2, tension: 0.25,
            pointRadius: 3, pointBackgroundColor: THEME.cyan, fill: true },
          (trend ? { label: "Trend", data: trend, borderColor: THEME.primary, borderWidth: 2, borderDash: [5, 4], tension: 0, pointRadius: 0, fill: false } : null)
        ].filter(Boolean)
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, position: "top", labels: { boxWidth: 12, color: THEME.text, usePointStyle: true } },
          tooltip: { callbacks: { label: function (c) { return c.dataset.label + ": " + c.parsed.y + " kg"; } } } },
        scales: axes({ zero: false, grace: "14%", precision: 1 })
      }
    });
  }

  /* ----------------------------------------------------------------------
     6. PROGRAM VIEW — phase control, weekly split, targets, Era-I benchmarks
        (the "Adjust program" / "Update benchmarks" destination) + Era flow.
     -------------------------------------------------------------------- */
  function renderProgram(el, s) {
    var phase = s.currentPhase;
    var info = util.phaseDayInfo(phase);
    var rec = engine.recommendedDayType();

    var benchKeys = Object.keys(s.benchmarks);
    var benchDone = benchKeys.filter(function (k) { return s.benchmarks[k].complete; }).length;
    var graduated = s.era === 2;

    /* The template's days, each with the slots it actually trains: the row in
       place of pull without a bar, a left-out dip left out. */
    var tpl = engine.template(), tplId = engine.templateId();
    var split = templateDaysHtml(tpl, rec);
    var others = engine.TEMPLATE_ORDER.filter(function (id) { return id !== tplId; }).map(function (id) {
      return '<button class="btn btn--ghost btn--sm" data-tpl-pick="' + id + '" type="button">' + esc(engine.TEMPLATES[id].label) + '</button>';
    }).join("");

    /* Each slot's prescription and its evidence so far (plan C5). What the
       workout will actually build, so an equipment fallback shows here too. */
    /* Coverage slots (Stage 3) are topped up by the finisher and mini-sessions.
       They get their own card below, built from the same row. A coverage slot
       has no record until its first pick, but still has a prescription: the
       first movement you can do. */
    var mainSlots = Object.keys(TDATA.SLOTS).filter(function (k) { return !TDATA.SLOTS[k].coverage; });
    var covSlots = Object.keys(TDATA.SLOTS).filter(function (k) { return TDATA.SLOTS[k].coverage; });
    var covStatus = window.Coverage.status(s.sessions, lib.today(), []), pins = s.training.pins || {};
    var WEEK_DAYS = [[1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"]];
    /* The week's count for the groups a slot tops up, and the weekday pins. */
    var covExtra = function (slot) {
      var on = (pins[slot] || {}).days || [];
      /* Conditioning tops up no muscle, so it has no weekly count to show: it
         says when it runs instead (plan A5). */
      return '<span class="faint text-xs" data-pg-cover style="display:block">' + (TDATA.SLOTS[slot].conditioning
        ? 'Conditioning — runs only on the days you pin it'
        : TDATA.SLOTS[slot].trains.map(function (k) {
          var g = covStatus[k]; return esc(g.label) + ': ' + g.direct + ' of ' + g.floor + ' direct sets this week';
        }).join('; ')) + '</span>' +
        '<span class="pg-pins" role="group" aria-label="Pin ' + esc(TDATA.SLOTS[slot].label) + ' to weekdays">' +
          '<span class="faint text-xs">Pin to</span> ' + WEEK_DAYS.map(function (d) {
            var is = on.indexOf(d[0]) >= 0;
            return '<button class="btn btn--ghost btn--sm' + (is ? ' is-on' : '') + '" data-pin-day="' + slot + ':' + d[0] + '" aria-pressed="' + is + '" type="button" style="padding:1px 8px">' + d[1] + '</button>';
          }).join('') + '</span>';
    };
    var slotRow = function (slot) {
      var cov = !!TDATA.SLOTS[slot].coverage;
      /* No record (a row never offered yet) or off: nothing is prescribed. */
      var stored = s.training.slots[slot], pr = (stored ? !stored.off : cov) ? engine.prescriptionFor(slot) : null, rx = pr && pr.rx;
      var optional = slot === "row" || TDATA.SLOTS[slot].optional;
      var none = !rx && engine.unavailableReason(slot) !== "equipment" ? ui.noneText(slot) : null;
      var name = !stored && !cov ? "—" : stored && stored.off ? "Left out" : rx ? (DB.getExercise(rx.exerciseId) || {}).name || rx.exerciseId
        : none ? ui.cap(none) : TDATA.SLOTS[slot].none || "Needs equipment you don't have";
      /* The status line, unless it only repeats the name ("Needs equipment you
         don't have" twice). */
      var status = cov && !stored ? (rx ? (TDATA.SLOTS[slot].conditioning ? "not started — it starts the first time a session runs on a day you pinned it"
          : "not started — the first finisher or accessory session that picks it starts it")
        : "never picked while nothing here is allowed") : ui.slotStatus(slot);
      var setup = rx ? ui.setupText(rx) : "";
      var toggle = optional
        ? '<button class="btn btn--ghost btn--sm" data-slot-toggle="' + slot + '" data-on="' + (!stored || stored.off ? "1" : "0") + '" type="button">' +
            (!stored || stored.off ? "Add" : "Leave out") + '</button>' : "";
      /* Your controls over the slot (plan C2, C4): change the movement, pause
         step-ups, set your own sets and range. A left-out or never-offered
         slot has nothing to control; Add brings it back. */
      var live = stored && !stored.off;
      /* A coverage slot with no record can still be chosen for; the choice
         creates its record. Hold and Sets & range need one to edit. */
      var acts = live || (cov && !stored)
        ? '<button class="btn btn--ghost btn--sm" data-pg-change="' + slot + '" type="button">Change exercise</button>' +
          (!live ? '' : '<button class="btn btn--ghost btn--sm" data-pg-hold="' + slot + '" data-on="' + (stored.hold ? "0" : "1") + '" type="button" aria-pressed="' + !!stored.hold + '">' + (stored.hold ? "Resume step-ups" : "Hold") + '</button>' +
          (stored.range && stored.range[1] != null ? '<button class="btn btn--ghost btn--sm" data-pg-custom="' + slot + '" type="button">Sets &amp; range</button>' : ''))
        : "";
      var tags = (live && stored.hold ? ' <span class="badge" style="padding:1px 7px">holding</span>' : '') +
        (live && stored.custom ? ' <span class="badge" style="padding:1px 7px" title="You set this; a goal change leaves it alone">your sets &amp; range</span>' : '');
      return '<div class="pg-slot">' +
        '<div class="pg-trow" data-pg-slot="' + slot + '">' +
        '<span class="pg-trow__p">' + esc(TDATA.SLOTS[slot].label) + '</span>' +
        '<span class="pg-trow__n">' + esc(name) + (setup ? ' <span class="faint text-xs">· ' + esc(setup) + '</span>' : '') + tags +
          (pr && pr.note ? '<span class="faint text-xs" style="display:block">' + esc(pr.note) + '</span>' : '') +
          (status.toLowerCase() === name.toLowerCase() ? '' : '<span class="faint text-xs" data-pg-status style="display:block">' + esc(status) + '</span>') +
          (cov ? covExtra(slot) : '') +
          ((toggle || acts) ? '<span class="pg-acts">' + toggle + acts + '</span>' : '') + '</span>' +
        '<span class="kv__v">' + (rx ? rx.sets + ' × ' + (rx.range[0] != null ? rx.range[0] + '–' : '') + (rx.range[1] != null ? rx.range[1] : '') + (rx.unit === "sec" ? ' s' : '') : '') + '</span></div>' +
        (PK && PK.slot === slot ? '<div class="pg-panel" data-pg-panel="' + slot + '">' + (PK.mode === "custom" ? customHtml(slot) : pickerHtml(slot)) + '</div>' : '') +
        '</div>';
    };
    var targets = mainSlots.map(slotRow).join("");
    var covRows = covSlots.map(slotRow).join("");

    /* Era-I benchmarks */
    var benches = benchKeys.map(function (k) {
      var b = s.benchmarks[k];
      var maxV = Math.max(b.target * 2, b.target + 10);
      var sub = "target " + b.target + (b.altTarget ? " (or " + b.altTarget + " alt)" : "") + " " + b.metric;
      return '<div class="bench-row">' +
        '<div class="bench-row__meta grow"><div class="bench-row__t">' + esc(b.label) + '</div>' +
          '<div class="bench-row__s" id="bench-sub-' + k + '">' + sub + ' · now ' + b.current + '</div></div>' +
        '<div class="row" style="gap:var(--sp-2);align-items:center">' +
          ui.stepperHtml("bench-" + k, b.current, 0, maxV, true) +
          '<span class="bench-check ' + (b.complete ? "is-on" : "") + '" id="bench-chk-' + k + '">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg></span>' +
        '</div></div>';
    }).join("");

    var era2Tools = "";
    if (graduated) {
      var tools = [];
      PATTERNS.forEach(function (p) {
        (DB.era2Addons(p) || []).forEach(function (a) {
          var ok = (a.equipment || []).every(function (e) { return s.equipment[e]; });
          tools.push('<span class="chip" style="' + (ok ? "" : "opacity:.5") + '">' + esc(a.name) + (ok ? "" : " · needs gear") + '</span>');
        });
      });
      era2Tools = '<div class="card rc-era stack mt-4"><div class="rc-era__t">Era II · Hybrid Strength unlocked</div>' +
        '<p class="text-sm muted">Loaded movements you can swap in with the kit you own.</p>' +
        (tools.length ? '<div class="pg-day__pats">' + tools.join("") + '</div>' : '') + '</div>';
    }

    el.innerHTML =
      '<div class="page-head row between wrap">' +
        '<div><div class="eyebrow">Training plan</div><h1 class="display h2">Program</h1></div>' +
        '<div class="row" style="gap:var(--sp-2);align-items:center">' +
          '<button class="btn btn--ghost btn--sm" data-go-progression type="button">Progression map \u2192</button>' +
          ui.eraBadge(s) + '</div>' +
      '</div>' +

      ui.equipCheckHtml(s) +

      '<div class="card mt-4 stack" id="pg-weekly"><div class="card__head"><div class="card__title">Strength days per week</div>' +
        '<span class="badge" data-weekly-current>' + (engine.weeklyGoal(s) ? engine.weeklyGoal(s) + (engine.weeklyGoal(s) === 1 ? ' day' : ' days') : 'Flexible template') + '</span></div>' +
        '<p class="muted text-sm">Choose a weekly target. Preview the split and recovery days, then apply it. Completed main workouts count once per day, Monday through Sunday.</p>' +
        ui.frequencyChoicesHtml(engine.weeklyGoal(s), 'data-weekly-days') +
        ui.restGuidanceHtml(tpl, engine.weeklyGoal(s)) + '<div id="pg-week-preview" aria-live="polite"></div></div>' +

      '<div class="card card--notch stack">' +
        '<div class="card__head"><div class="card__title">Current phase</div>' +
          '<span class="badge badge--primary">P' + phase.number + ((Number(phase.volumeFactor) || 1) < 1 ? ' · legacy deload' : '') + '</span></div>' +
        '<div class="row between wrap"><div class="dash-big">Day ' + info.day + '<small>/ ' + phase.lengthDays + '</small></div>' +
          '<span class="dash-delta dash-delta--flat">' + info.remaining + ' days to evaluation</span></div>' +
        '<div class="progress" style="height:12px"><div class="progress__bar" style="width:' + info.pct + '%"></div></div>' +
        '<div class="row" style="gap:var(--sp-2)">' +
          '<button class="btn btn--secondary btn--sm grow" data-go="evaluation">Open Phase review →</button>' +
          '<button class="btn btn--ghost btn--sm" id="pg-report">Report card</button>' +
        '</div>' +
      '</div>' +

      '<div class="card mt-4 stack" id="pg-template"><div class="card__head"><div class="card__title">Template</div>' +
        '<span class="badge" data-tpl-current>' + esc(tpl.label) + ' · ' + esc(tpl.short) + '</span></div>' +
        '<p class="muted text-sm">' + esc(tpl.desc) + ' Attendance counts against ' + planned28(tpl) + ' planned sessions in a 28-day phase. Each session builds from the prescriptions below.</p>' +
        '<div class="pg-split">' + split + '</div>' +
        '<div class="field__label">Change template</div>' +
        '<div class="row wrap" style="gap:var(--sp-2)">' + others + '</div>' +
        '<div id="pg-tpl-preview"></div></div>' +

      '<div class="card mt-4 stack"><div class="card__head"><div class="card__title">Your prescriptions</div>' +
        '<span class="badge badge--era1">' + mainSlots.length + ' slots</span></div>' +
        '<p class="muted text-sm">Each slot is one movement at a range of reps or seconds. It steps up after ' + TDATA.EVIDENCE_SESSIONS + ' sessions on different days with every set at the top, rated easy or just right, and only when you say yes. A rule of thumb from your own logs, not a test — it can\'t see your form.</p>' +
        gripHtml(s) +
        '<div class="pg-targets">' + targets + '</div>' +
        '<button class="btn btn--ghost btn--sm btn--block mt-2" data-go="progress">See exercise progress →</button></div>' +

      '<div class="card mt-4 stack" id="pg-coverage"><div class="card__head"><div class="card__title">Coverage</div>' +
        '<span class="badge badge--era1">' + covSlots.length + ' slots</span></div>' +
        '<p class="muted text-sm">Work the main program only brushes: biceps, side and rear delts, rotator cuff, neck, calves and the rest. Your finisher and Accessory session pick from these slots by how far each group is below its weekly floor of direct sets, and each slot steps up on the same rule as the slots above. Pin a slot to weekdays to put it first on those days whatever its shortfall; a pin never goes past your equipment, exclusions or limits. "Direct" counts only exercises where the group is a primary mover, and the floors are product choices, not validated minimums.</p>' +
        '<div class="pg-targets">' + covRows + '</div></div>' +

      excludedHtml(s) +

      '<div class="card mt-4 stack"><div class="card__head"><div class="card__title">Era I benchmarks</div>' +
        '<span class="badge badge--era1" id="bench-count">' + benchDone + '/' + benchKeys.length + '</span></div>' +
        '<p class="muted text-sm">Clear all five to graduate into Era II — an achievement. Benchmarks don\'t place or unlock anything: loaded movements are in Swap for anyone with the gear. Update your current bests below.</p>' +
        '<div class="progress progress--era1"><div class="progress__bar" id="bench-bar" style="width:' + Math.round(benchDone / benchKeys.length * 100) + '%"></div></div>' +
        '<div class="mt-2">' + benches + '</div></div>' +

      era2Tools +

      '<p class="faint text-xs mt-6 mono">PROGRAM ONLINE · ' + engine.completedSessions().length + ' sessions logged · ' + (s.phaseHistory || []).length + ' phases archived · ' + benchDone + '/' + benchKeys.length + ' benchmarks cleared.</p>';

    wireProgram(el, s);
  }

  /* ---- Your controls over the plan (plan C1-C4) ----------------------
     Every control calls one engine function, which stamps and saves; a
     refusal comes back as { error } and is shown inline, never in a modal.
     `PK` is the one open panel (Change exercise or Sets & range), kept
     across App.refresh() so a button that re-renders the page doesn't close
     it: { slot, mode: "pick" | "custom", sel, grip, setup, load, error }. */
  var PK = null;
  var nameOf = function (id) { return (DB.getExercise(id) || {}).name || id; };
  var cap1 = function (t) { return t.charAt(0).toUpperCase() + t.slice(1); };

  /* Push-ups on Palms / Knuckles (plan C1): the standing grip. */
  function gripHtml(s) {
    var push = s.training.slots.push;
    if (!push || push.off) return "";
    var cur = (s.training.grip || {}).push || "palms";
    return '<div class="field" id="pg-grip"><span class="field__label">Push-ups on</span>' +
      '<div class="seg">' + TDATA.GRIPS.values.map(function (v) {
        return '<button class="seg__btn' + (v.id === cur ? " is-active" : "") + '" data-grip-set="' + v.id + '" type="button" aria-pressed="' + (v.id === cur) + '">' + esc(v.label) + '</button>';
      }).join("") + '</div>' +
      '<p class="faint text-xs" style="margin:6px 0 0">Knuckles count as slightly harder than palms and keep the wrist straight. They apply to ' +
        TDATA.GRIPS.exercises.map(nameOf).join(", ") + '; Diamond, Archer and Pseudo Planche stay on palms. A knuckles session counts as evidence for a palms prescription, but a palms session doesn\'t count for knuckles. Switching to knuckles starts that evidence again.</p></div>';
  }

  /* Excluded movements (plan C3): everything you excluded or allowed past a
     joint limit, with the way back. Re-stamped, never deleted. */
  function excludedHtml(s) {
    var ex = s.training.exclusions || {};
    var rows = Object.keys(ex).filter(function (id) { return ex[id].state === "excluded" || ex[id].state === "allowed"; })
      .sort(function (a, b) { return nameOf(a).localeCompare(nameOf(b)); }).map(function (id) {
        var allowed = ex[id].state === "allowed", slot = (TDATA.EXERCISES[id] || {}).slot;
        return '<div class="row between wrap" data-excl-row="' + esc(id) + '" style="gap:var(--sp-2);align-items:center">' +
          '<span class="text-sm"><b>' + esc(nameOf(id)) + '</b> <span class="faint text-xs">· ' + esc(slot ? TDATA.SLOTS[slot].label : "") + ' · ' +
            (allowed ? "allowed past your joint limit" : "excluded") + '</span></span>' +
          '<button class="btn btn--ghost btn--sm" data-excl-undo="' + esc(id) + '" type="button">' + (allowed ? "Stop allowing" : "Include again") + '</button></div>';
      });
    return '<div class="card mt-4 stack" id="pg-excluded"><div class="card__head"><div class="card__title">Excluded movements</div>' +
      '<span class="badge">' + rows.length + '</span></div>' +
      '<p class="muted text-sm">An excluded movement is never prescribed, stepped to or offered in a swap list unless you ask to see it. Your slots fall back to the nearest easier movement you allow. Exclude one from Change exercise.</p>' +
      (rows.length ? '<div class="stack" style="gap:var(--sp-2)">' + rows.join("") + '</div>' : '<p class="faint text-sm">None.</p>') + '</div>';
  }

  /* Change exercise (plan C2): every movement in the slot except skill
     attempts, as On your path, Branches and Weighted, each with the reasons
     it might not be usable right now. Choosing one keeps it until a step or
     another choice moves it. */
  function pickerHtml(slot) {
    var s = App.getState(), EXS = TDATA.EXERCISES, stored = s.training.slots[slot], ctx = engine.ctx();
    var pr = engine.prescriptionFor(slot), cur = stored && stored.exerciseId;
    var opts = engine.slotOptions(slot).filter(function (a) { return EXS[a.id].kind !== "skill"; });
    var group = function (a) { var e = EXS[a.id]; return e.loadMode ? 2 : e.branch === "main" ? 0 : 1; };
    var titles = ["On your path", "Branches", "Weighted"];
    var note = ["", "Optional moves that branch off a path — a harder variation, not the next rung.", "These need a weight. Leave the load blank and your first session's weight sets it."];
    var body = [0, 1, 2].map(function (g) {
      var inG = opts.filter(function (a) { return group(a) === g; });
      if (!inG.length) return "";
      return '<div class="field__label" style="margin-top:var(--sp-2)">' + titles[g] + '</div>' +
        (note[g] ? '<p class="faint text-xs" style="margin:0">' + note[g] + '</p>' : '') +
        inG.map(function (a) {
          var st = engine.swapStatus(slot, a.id), x = (ctx.exclusions[a.id] || {}).state;
          var b = function (cls, t) { return '<span class="badge ' + cls + '" style="padding:1px 7px">' + esc(t) + '</span>'; };
          var tags = (a.id === cur ? b("badge--primary", "current") : "") +
            (x === "excluded" ? b("badge--warn", "excluded") : "") +
            (x === "allowed" ? b("badge--secondary", "allowed anyway") : "") +
            (st.missing ? b("badge--warn", "needs " + st.missing) : "") +
            (st.blocked && st.blocked !== "excluded" && st.blocked !== "equipment" ? b("badge--warn", "avoiding your " + ui.jointWord(st.blocked)) : "") +
            (st.careful.length && !st.blocked ? b("badge--secondary", "careful: " + st.careful.map(ui.jointWord).join(", ")) : "");
          var acts = (x === "excluded" ? '<button class="btn btn--ghost btn--sm" data-pk-include="' + a.id + '" type="button">Include again</button>'
            : '<button class="btn btn--ghost btn--sm" data-pk-exclude="' + a.id + '" type="button">Exclude</button>') +
            (st.blocked && st.blocked !== "excluded" && st.blocked !== "equipment" && x !== "allowed"
              ? '<button class="btn btn--ghost btn--sm" data-pk-allow="' + a.id + '" type="button">Allow anyway</button>' : "");
          return '<div class="pk-row"><button class="swap-opt' + (PK.sel === a.id ? " is-current" : "") + (st.blocked ? " is-locked" : "") + '" data-pick="' + a.id + '" type="button" aria-pressed="' + (PK.sel === a.id) + '">' +
            '<span class="swap-opt__lvl">' + (a.level ? "L" + a.level : EXS[a.id].loadMode ? "KG" : "—") + '</span>' +
            '<span class="swap-opt__main"><span class="swap-opt__name">' + esc(a.name) + '</span></span>' +
            '<span class="pk-tags">' + tags + '</span></button><span class="pk-acts">' + acts + '</span></div>';
        }).join("");
    }).join("");

    /* Setup for the picked movement: grip, surface/angle/band, a load. */
    var sel = PK.sel, e = sel && EXS[sel], S = sel && TDATA.SETUPS[sel], sameAsStored = stored && !stored.off && stored.exerciseId === sel;
    var fields = "";
    if (sel && ui.gripCapable(sel)) {
      var g = PK.grip || "palms";
      fields += '<label class="field"><span class="field__label">Grip</span><select class="select" data-pk-grip>' +
        TDATA.GRIPS.values.map(function (v) { return '<option value="' + v.id + '"' + (v.id === g ? " selected" : "") + '>' + esc(v.label) + '</option>'; }).join("") + '</select></label>';
    }
    if (S) {
      var key = S.key, label = { surface: "Surface", bodyAngle: "Body angle", band: "Band" }[key] || cap1(key);
      var at = PK.setup || (sameAsStored && stored.setup && stored.setup[key]) || S.values[0].id;
      fields += '<label class="field"><span class="field__label">' + label + '</span><select class="select" data-pk-setup>' +
        S.values.map(function (v) { return '<option value="' + v.id + '"' + (v.id === at ? " selected" : "") + '>' + esc(v.label + (v.cm ? " (~" + v.cm + " cm)" : "")) + '</option>'; }).join("") + '</select></label>';
    }
    if (e && e.loadMode) {
      var kg = PK.load != null ? PK.load : (sameAsStored && stored.setup && stored.setup.loadKg) || "";
      fields += '<label class="field"><span class="field__label">Starting load, kg ' + (e.loadMode === "perHand" ? "per hand" : "total") + ' (optional)</span>' +
        '<input class="input" data-pk-load type="number" min="0.5" max="200" step="0.5" inputmode="decimal" value="' + esc(String(kg)) + '"></label>';
    }
    var fell = pr && stored && !stored.off && pr.rx.exerciseId !== stored.exerciseId;
    return '<div class="stack" style="gap:var(--sp-2)">' +
      '<p class="faint text-xs" style="margin:0">' + (fell ? esc(nameOf(stored.exerciseId)) + ' is blocked for you, so ' + esc(nameOf(pr.rx.exerciseId)) + ' is preselected: the nearest easier movement you allow. ' : '') +
        'The start is the bottom of the movement\'s range. Steps and evidence work as before from there.</p>' +
      body +
      (fields ? '<div class="set-grid">' + fields + '</div>' : '') +
      (PK.error ? '<p class="text-sm" data-pg-err role="alert" style="color:var(--danger);margin:0">' + esc(PK.error) + '</p>' : '') +
      '<div class="row" style="gap:var(--sp-2)"><button class="btn btn--primary btn--sm" data-pk-use type="button"' + (sel ? "" : " disabled") + '>Use ' + (sel ? esc(nameOf(sel)) : "this movement") + '</button>' +
      '<button class="btn btn--ghost btn--sm" data-pk-cancel type="button">Cancel</button></div></div>';
  }

  /* Sets & range (plan C4): your own count and range for one slot. */
  function customHtml(slot) {
    var rx = App.getState().training.slots[slot], sec = rx.unit === "sec";
    var c = PK.form || (PK.form = { sets: rx.sets, lo: rx.range[0], hi: rx.range[1] });
    return '<div class="stack" style="gap:var(--sp-2)">' +
      '<p class="faint text-xs" style="margin:0">Your own sets and ' + (sec ? "seconds" : "rep") + ' range for ' + esc(nameOf(rx.exerciseId)) + '. It survives a goal change. Changing the sets starts that slot\'s evidence again, because a different number of sets is a different prescription. Sets 1–6; the top at least 2 above the bottom, up to ' + (sec ? "300 s" : "50 reps") + '.</p>' +
      '<div class="set-grid" style="grid-template-columns:repeat(3,1fr)">' +
        '<label class="field"><span class="field__label">Sets</span><input class="input" data-cu="sets" type="number" min="1" max="6" inputmode="numeric" value="' + esc(String(c.sets)) + '"></label>' +
        '<label class="field"><span class="field__label">From</span><input class="input" data-cu="lo" type="number" min="1" inputmode="numeric" value="' + esc(String(c.lo)) + '"></label>' +
        '<label class="field"><span class="field__label">To</span><input class="input" data-cu="hi" type="number" min="3" inputmode="numeric" value="' + esc(String(c.hi)) + '"></label></div>' +
      (PK.error ? '<p class="text-sm" data-pg-err role="alert" style="color:var(--danger);margin:0">' + esc(PK.error) + '</p>' : '') +
      '<div class="row" style="gap:var(--sp-2);flex-wrap:wrap"><button class="btn btn--primary btn--sm" data-cu-save type="button">Save</button>' +
      '<button class="btn btn--ghost btn--sm" data-cu-reset type="button">Back to my goal\'s</button>' +
      '<button class="btn btn--ghost btn--sm" data-pk-cancel type="button">Cancel</button></div></div>';
  }

  /* Wires the slot rows' controls and the open panel. `again` re-renders. */
  function wireControls(el, s) {
    var again = function () { App.refresh(); };
    var open = function (slot, mode) {
      var stored = s.training.slots[slot], pr = engine.prescriptionFor(slot);
      var rx = pr ? pr.rx : stored;
      PK = { slot: slot, mode: mode, error: "" };
      if (mode === "pick") {
        /* Excluded or avoided: the nearest easier movement you allow is
           preselected, which is what the workout would use now. */
        PK.sel = rx && rx.exerciseId;
        PK.grip = (rx && rx.setup && rx.setup.grip) || ((s.training.grip || {})[slot]) || "palms";
      }
      again();
    };
    el.querySelectorAll("[data-pg-change]").forEach(function (b) { b.addEventListener("click", function () { open(b.dataset.pgChange, "pick"); }); });
    el.querySelectorAll("[data-pg-custom]").forEach(function (b) { b.addEventListener("click", function () { open(b.dataset.pgCustom, "custom"); }); });
    el.querySelectorAll("[data-pg-hold]").forEach(function (b) {
      b.addEventListener("click", function () {
        var on = b.dataset.on === "1", r = engine.setHold(b.dataset.pgHold, on);
        if (r && r.error) { App.toast(r.error, "warn"); return; }
        App.toast(on ? "Holding — this slot won't be offered a step up. Step-back offers still show." : "Step-ups are back on for this slot.", "info");
        again();
      });
    });
    el.querySelectorAll("[data-grip-set]").forEach(function (b) {
      b.addEventListener("click", function () {
        var r = engine.setGrip("push", b.dataset.gripSet);
        if (r && r.error) { App.toast(r.error, "warn"); return; }
        App.toast("Push-ups on " + b.dataset.gripSet + "." + (b.dataset.gripSet === "knuckles" ? " Evidence for knuckles starts from your next session." : ""), "info");
        again();
      });
    });
    el.querySelectorAll("[data-pin-day]").forEach(function (b) {
      b.addEventListener("click", function () {
        var m = b.dataset.pinDay.split(":"), d = Number(m[1]);
        var cur = ((App.getState().training.pins || {})[m[0]] || {}).days || [];
        var r = engine.setPins(m[0], cur.indexOf(d) >= 0 ? cur.filter(function (x) { return x !== d; }) : cur.concat(d));
        if (r && r.error) { App.toast(r.error, "warn"); return; }
        again();
      });
    });
    el.querySelectorAll("[data-excl-undo]").forEach(function (b) {
      b.addEventListener("click", function () {
        var r = engine.setExcluded(b.dataset.exclUndo, "none");
        if (r && r.error) { App.toast(r.error, "warn"); return; }
        App.toast(nameOf(b.dataset.exclUndo) + " is back in your options.", "info");
        again();
      });
    });
    ui.wireEquipCheck(el);

    var panel = el.querySelector("[data-pg-panel]");
    if (!panel || !PK) return;
    var cancel = panel.querySelector("[data-pk-cancel]");
    if (cancel) cancel.addEventListener("click", function () { PK = null; again(); });
    if (PK.mode === "custom") {
      var read = function () {
        PK.form = { sets: panel.querySelector('[data-cu="sets"]').value, lo: panel.querySelector('[data-cu="lo"]').value, hi: panel.querySelector('[data-cu="hi"]').value };
        return PK.form;
      };
      panel.querySelector("[data-cu-save]").addEventListener("click", function () {
        var f = read(), r = engine.setCustom(PK.slot, { sets: f.sets, range: [f.lo, f.hi] });
        if (r && r.error) { PK.error = r.error; again(); return; }
        App.toast("Sets and range saved for " + TDATA.SLOTS[PK.slot].label.toLowerCase() + ".", "success");
        PK = null; again();
      });
      panel.querySelector("[data-cu-reset]").addEventListener("click", function () {
        var r = engine.setCustom(PK.slot, null);
        if (r && r.error) { PK.error = r.error; again(); return; }
        App.toast("Back to your goal's sets and range.", "info");
        PK = null; again();
      });
      return;
    }
    var keep = function () {
      var g = panel.querySelector("[data-pk-grip]"), st = panel.querySelector("[data-pk-setup]"), ld = panel.querySelector("[data-pk-load]");
      if (g) PK.grip = g.value;
      if (st) PK.setup = st.value;
      if (ld) PK.load = ld.value;
    };
    panel.querySelectorAll("[data-pick]").forEach(function (b) {
      b.addEventListener("click", function () { keep(); PK.sel = b.dataset.pick; PK.setup = null; PK.load = null; PK.error = ""; again(); });
    });
    var change = function (attr, state) {
      panel.querySelectorAll("[" + attr + "]").forEach(function (b) {
        b.addEventListener("click", function () {
          keep();
          var id = b.getAttribute(attr), r = engine.setExcluded(id, state);
          if (r && r.error) { PK.error = r.error; again(); return; }
          /* Excluding what the slot trains: preselect what it falls back to. */
          if (state === "excluded") {
            var pr = engine.prescriptionFor(PK.slot);
            if (PK.sel === id && pr) { PK.sel = pr.rx.exerciseId; PK.setup = null; PK.load = null; }
          }
          PK.error = "";
          App.toast(nameOf(id) + (state === "excluded" ? " excluded." : state === "allowed" ? " allowed past your joint limit." : " included again."), "info");
          again();
        });
      });
    };
    change("data-pk-exclude", "excluded");
    change("data-pk-include", "none");
    change("data-pk-allow", "allowed");
    var use = panel.querySelector("[data-pk-use]");
    if (use) use.addEventListener("click", function () {
      keep();
      var o = {}, S = TDATA.SETUPS[PK.sel];
      if (S && PK.setup) { o.setup = {}; o.setup[S.key] = PK.setup; }
      if (ui.gripCapable(PK.sel)) { o.setup = o.setup || {}; if (PK.grip === "knuckles") o.setup.grip = "knuckles"; }
      if (PK.load !== "" && PK.load != null) o.loadKg = PK.load;
      var r = engine.chooseExercise(PK.slot, PK.sel, o);
      if (r && r.error) { PK.error = r.error; again(); return; }
      App.toast(nameOf(PK.sel) + " is your " + TDATA.SLOTS[PK.slot].label.toLowerCase() + " now. It stays until a step or another choice moves it.", "success");
      PK = null; again();
    });
    panel.scrollIntoView({ block: "nearest" });
  }

  function planned28(tpl) { return Math.ceil(28 * tpl.perWeek / 7); }

  function templateDaysHtml(tpl, rec) {
    var len = (App.getState().prefs || {}).sessionLength || "focused";
    return tpl.order.map(function (d) {
      var slots = engine.slotsFor(d, len);
      return '<div class="pg-day' + (d === rec ? " is-next" : "") + '">' +
        '<div class="row between"><span class="pg-day__t">' + engine.DAY_LABEL[d] + '</span>' +
          (d === rec ? '<span class="badge badge--primary" style="padding:2px 7px">up next</span>' : '') + '</div>' +
        '<p class="faint text-xs">' + esc(engine.DAY_DESC[d]) + '</p>' +
        '<div class="pg-day__pats">' + slots.map(function (it) { return '<span class="chip">' + esc(TDATA.SLOTS[it.slot].label) + '</span>'; }).join("") + '</div>' +
      '</div>';
    }).join("");
  }

  /* What switching to `id` would change, shown before anything changes: its
     days and slots, what attendance would count against, and that the
     current phase closes with what it has. The Switch button is the only
     thing that applies it — no confirm(). */
  function templatePreviewHtml(id, days) {
    var s = App.getState(), tpl = engine.TEMPLATES[id], phase = s.currentPhase;
    var ev = evaluate(s), row = s.training.slots.row;
    var changing = id !== engine.templateId();
    var namesRow = tpl.order.some(function (d) { return engine.DAY_PATTERNS[d].indexOf("row") >= 0; });
    return '<div class="card card--glass stack mt-2" data-tpl-preview="' + id + '">' +
      '<div class="card__head"><div class="card__title">' + esc(tpl.label) + '</div><span class="badge">' + esc(tpl.short) + '</span></div>' +
      '<p class="muted text-sm">' + esc(tpl.desc) + ' Attendance would count against ' + planned28(tpl) + ' planned sessions in a 28-day phase.</p>' +
      ui.restGuidanceHtml(tpl, days) +
      '<div class="pg-split">' + templateDaysHtml(tpl, null) + '</div>' +
      (namesRow && row && row.off ? '<p class="faint text-xs">You left the row out, so it stays out of these days. Add it under Your prescriptions to train it.</p>' : '') +
      (changing ? '<p class="text-sm" data-tpl-close>Switching closes Phase ' + phase.number + ' today, on day ' + ev.dayInfo.day + ', with ' +
        ev.sampleSize + ' of ' + ev.expected + ' planned sessions, and starts Phase ' + (phase.number + 1) + ' under ' + esc(tpl.label) +
        '. Your prescriptions and history don\'t change.</p>' : '<p class="text-sm" data-tpl-close>Your split and phase stay the same. ' +
          (days ? 'After ' + days + ' strength days in a week, recovery is suggested until Monday.' : 'The weekly target is removed; your template\'s recovery rule still applies.') + '</p>') +
      '<div class="row" style="gap:var(--sp-2)">' +
        '<button class="btn btn--primary btn--sm grow" data-tpl-apply="' + id + '" data-tpl-days="' + (days || '') + '" type="button">' +
          (days ? 'Use ' + days + ' days per week' : 'Switch to ' + esc(tpl.label)) + '</button>' +
        '<button class="btn btn--ghost btn--sm" data-tpl-cancel type="button">Keep ' + esc(engine.template().label) + '</button>' +
      '</div></div>';
  }

  function wireProgram(el, s) {
    var pm = el.querySelector("[data-go-progression]");
    if (pm) pm.addEventListener("click", function () { App.showSection("progression", { focus: true }); });
    /* template: preview first, then Switch */
    el.querySelectorAll("[data-tpl-pick], [data-weekly-days]").forEach(function (b) {
      b.addEventListener("click", function () {
        var days = Number(b.dataset.weeklyDays) || null;
        el.querySelector('#pg-tpl-preview').innerHTML = '';
        el.querySelector('#pg-week-preview').innerHTML = '';
        var pv = el.querySelector(days ? '#pg-week-preview' : '#pg-tpl-preview');
        pv.innerHTML = templatePreviewHtml(days ? engine.WEEKLY_TEMPLATES[days] : b.dataset.tplPick, days);
        var cancel = pv.querySelector("[data-tpl-cancel]");
        cancel.addEventListener("click", function () { pv.innerHTML = ""; });
        pv.querySelector("[data-tpl-apply]").addEventListener("click", function () {
          var id = this.dataset.tplApply, days = Number(this.dataset.tplDays) || null, closed = engine.setTemplate(id, days);
          if (!closed) { pv.innerHTML = ''; return; }
          App.toast(closed.weeklyOnly ? (days ? days + ' strength days per week selected.' : 'Flexible template selected.') :
            "Switched to " + engine.TEMPLATES[id].label + ". Phase " + closed.number + " closed at " +
            closed.attended + " of " + closed.planned + " planned; Phase " + (closed.number + 1) + " starts today.", "success");
          App.refresh();
        });
      });
    });

    wireControls(el, s);

    /* nav buttons */
    el.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () { App.showSection(b.dataset.go); });
    });
    var rb = el.querySelector("#pg-report");
    if (rb) rb.addEventListener("click", openReportCard);

    /* the optional row and dip, on or off */
    el.querySelectorAll("[data-slot-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var slot = b.dataset.slotToggle, on = b.dataset.on === "1";
        if (!ui.setSlotOn(slot, on, on ? "added in Program" : "left out in Program")) {
          App.toast("No " + TDATA.SLOTS[slot].label.toLowerCase() + " movement fits your equipment.", "warn"); return;
        }
        App.toast(TDATA.SLOTS[slot].label + (on ? " added." : " left out."), "info");
        App.refresh();
      });
    });

    /* benchmark steppers — update in place; trigger Era-transition flow on full clear */
    ui.wireSteppers(el, function (id, val) {
      var m = id.match(/^bench-(.+)$/);
      if (!m) return;
      var key = m[1];
      var st = App.getState();
      var b = st.benchmarks[key]; if (!b) return;
      b.current = Math.max(0, Number(val) || 0);
      b.complete = b.current >= b.target;
      App.saveState();

      /* in-place UI updates (no full re-render → steppers keep their listeners) */
      var chk = document.getElementById("bench-chk-" + key);
      if (chk) chk.classList.toggle("is-on", b.complete);
      var sub = document.getElementById("bench-sub-" + key);
      if (sub) sub.textContent = "target " + b.target + (b.altTarget ? " (or " + b.altTarget + " alt)" : "") + " " + b.metric + " · now " + b.current;
      var keys = Object.keys(st.benchmarks);
      var done = keys.filter(function (k) { return st.benchmarks[k].complete; }).length;
      var cnt = document.getElementById("bench-count"); if (cnt) cnt.textContent = done + "/" + keys.length;
      var bar = document.getElementById("bench-bar"); if (bar) bar.style.width = Math.round(done / keys.length * 100) + "%";

      if (done === keys.length && st.era === 1) promptGraduation();
    });
  }

  function promptGraduation() {
    ui.confirm(
      "Graduate to Era II?",
      "Every Era I benchmark is cleared. Era II — Hybrid Strength layers weighted overload onto your bodyweight base. You can keep training either way; this just unlocks the heavier tools.",
      "Unlock Era II", "primary",
      function () {
        var st = App.getState();
        st.era = 2;
        App.saveState();
        App.toast("Era II reached — all five benchmarks cleared. Welcome to Hybrid Strength.", "success", 5000);
        App.refresh();
      }
    );
  }

  /* ----------------------------------------------------------------------
     7. PUBLIC (additive) HOOK + MOUNT
     -------------------------------------------------------------------- */
  App.evaluation = { evaluate: evaluate, openReportCard: openReportCard,
                     closePeriod: closePeriod };

  function mount() {
    themeChart();
    App.registerView("evaluation", renderEvaluation);
    App.registerView("program", renderProgram);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

})();

/* ===== BASALT script block 7 (source lines 7369-7859) ===== */
/* ============================================================================
   IRONFRAME — PART 7 · SKILLS & MOBILITY LIBRARY
   ----------------------------------------------------------------------------
   Pure addition. Registers one new view ("skills") and appends extra movement
   entries to the global EXERCISE_DB so the guide modal can surface them.

   All instructional text here is ORIGINAL — written for IRONFRAME, not copied
   from any source. Categories: Skills (planche, lever, handstand, L-sit) and a
   Mobility / warm-up library plus expanded push/pull/squat variations.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.App) return;

  var App = window.App;
  var esc = App.util.escapeHtml;

  /* ----------------------------------------------------------------------
     1) EXTRA EXERCISES — appended to window.EXERCISE_DB
     Same shape as Part 2: id, pattern, name, level, era, mode, unit,
     equipment, cues[], mistakes[], readiness, injury.
     These are alternative / supplementary movements surfaced in the guide.
     -------------------------------------------------------------------- */
  var EXTRA = {

    /* ---- expanded PUSH variations ---- */
    push_alt_scapula: { id:"push_alt_scapula", pattern:"push", name:"Scapular Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Set up in a tall plank with arms locked straight the whole time.","Without bending the elbows, let your chest sink so the shoulder blades pinch together.","Then push the floor away hard, spreading the blades apart and rounding the upper back.","Move slowly — this is a small range that trains scapular control, not the chest."],
      mistakes:["Bending the elbows and turning it into a tiny push-up.","Rushing so the shoulder blades never fully protract and retract."],
      readiness:"Own 15 controlled reps before relying on it as your pressing warm-up staple.",
      injury:"Foundational shoulder-health drill — protects the joint before heavier pressing." },

    push_alt_wide: { id:"push_alt_wide", pattern:"push", name:"Wide Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Set the hands noticeably wider than shoulder width, fingers turned slightly out.","Keep the plank line rigid from head to heels.","Lower until the chest nears the floor, feeling more load across the pecs.","Press back up without letting the hips sag."],
      mistakes:["Going so wide the shoulders feel pinched at the bottom.","Letting the elbows bow straight out and the chest collapse."],
      readiness:"A horizontal-emphasis variation — rotate it in once standard push-ups feel easy for 15 reps.",
      injury:"If the front of the shoulder pinches, narrow the hands slightly." },

    push_alt_negative: { id:"push_alt_negative", pattern:"push", name:"Negative Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Start at the top of a push-up in a tight plank.","Lower toward the floor as slowly as you can — aim for a 4-5 second descent.","Keep the elbows tracking back at roughly 45 degrees the whole way down.","Once your chest touches, reset to the top however you can and repeat the slow lowering."],
      mistakes:["Letting the descent speed up near the bottom.","Allowing the hips to drop so the body bends instead of staying rigid."],
      readiness:"A bridge toward full push-ups — when you can do 5 clean negatives, test full reps.",
      injury:"Controlled eccentrics build tendon strength; stop if the elbows ache." },

    push_alt_explosive: { id:"push_alt_explosive", pattern:"push", name:"Explosive Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Begin in a strong push-up position, core braced tight.","Lower under control to the bottom.","Drive up so forcefully that the hands leave the floor (a clap is optional).","Land softly with bent elbows and immediately absorb into the next rep."],
      mistakes:["Landing with locked, stiff arms — absorb the impact instead.","Sacrificing depth or form to chase height."],
      readiness:"Power variation — only program once 15+ strict push-ups are easy and pain-free.",
      injury:"High wrist and shoulder demand; skip if any joint is irritated." },

    push_alt_onearm: { id:"push_alt_onearm", pattern:"push", name:"One-Arm Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Take a wide foot stance for a stable base and place one hand under the chest.","Tuck the free arm behind the back or along the side.","Brace hard against the urge to rotate — keep the hips and shoulders square.","Lower under full control, then press back up through the single working arm."],
      mistakes:["Twisting the torso open to cheat the press.","Flaring the working elbow far from the body."],
      readiness:"The summit of horizontal pressing — chase it after archer push-ups feel solid.",
      injury:"Enormous single-shoulder load; build slowly with elevated-hand versions first." },

    push_alt_tricep: { id:"push_alt_tricep", pattern:"push", name:"Bench Tricep Extension", level:null, era:1, mode:"reps", unit:"reps", equipment:["bench"],
      cues:["Place your hands on a bench edge and walk the feet back into a plank lean.","Keeping the upper arms fixed, bend only at the elbows to lower the head toward the bench.","Feel the triceps stretch, then extend the elbows to press back up.","Keep the body rigid — only the forearms move."],
      mistakes:["Letting the shoulders do the work instead of isolating the triceps.","Sagging the hips out of the plank line."],
      readiness:"A triceps-focused accessory — add it when you want extra lockout strength for dips and presses.",
      injury:"Ease the range if the elbows feel tender at full stretch." },

    /* ---- expanded PULL variations ---- */
    pull_alt_passivehang: { id:"pull_alt_passivehang", pattern:"pull", name:"Passive Hang", level:null, era:1, mode:"hold", unit:"sec", equipment:["pullupBar"],
      cues:["Take a full grip on the bar slightly wider than the shoulders.","Let the body hang completely relaxed, arms straight, shoulders rising toward the ears.","Breathe slowly and let the spine decompress.","Build time gradually to develop grip endurance and shoulder mobility."],
      mistakes:["Gripping nervously and tensing the whole body — the point is to relax.","Swinging instead of hanging still."],
      readiness:"A recovery and grip-prep staple — work toward a relaxed 60-second hang.",
      injury:"Eases into bar work gently; back off if the shoulders feel unstable rather than loose." },

    pull_alt_australian: { id:"pull_alt_australian", pattern:"pull", name:"Australian Row (Inverted Row)", level:null, era:1, mode:"reps", unit:"reps", equipment:["lowBar","rings"],
      cues:["Set a bar at hip height and lie underneath it, gripping shoulder-width.","Keep the body in a straight plank line, heels on the floor.","Pull the chest up to the bar by driving the elbows down and back.","Lower with control to fully extended arms; raise the bar or bend the knees to scale difficulty."],
      mistakes:["Letting the hips sag so the body bends.","Shrugging instead of leading with the shoulder blades."],
      readiness:"A horizontal pull that builds the back for vertical pulling — aim for 12 strict reps.",
      injury:"Great low-skill entry to pulling; keep the neck neutral." },

    pull_alt_bandassist: { id:"pull_alt_bandassist", pattern:"pull", name:"Band-Assisted Pull-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar","bands"],
      cues:["Loop a resistance band over the bar and place a foot or knee in the loop.","Start from a full dead hang with the band providing a boost at the bottom.","Pull with the back and arms, leading the chest to the bar.","Lower under control to a straight-arm hang each rep."],
      mistakes:["Relying on a band so thick it does most of the work — pick the lightest you can manage.","Bouncing out of the bottom using band recoil alone."],
      readiness:"The on-ramp to unassisted pull-ups — drop to a lighter band as you get stronger.",
      injury:"Control the lowering; the band tempts you to drop fast." },

    pull_alt_row: { id:"pull_alt_row", pattern:"pull", name:"Bent-Over Dumbbell Row", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
      cues:["Hinge at the hips with a flat back, dumbbells hanging beneath the shoulders.","Brace the core and keep the spine neutral throughout.","Row both elbows toward the hips, squeezing the back at the top.","Lower fully to a stretch without rounding the spine."],
      mistakes:["Heaving with the lower back instead of rowing with the back muscles.","Standing too upright so it becomes a shrug."],
      readiness:"A loaded volume builder for the back — add weight when 12 reps stay strict.",
      injury:"Keep the back flat and braced to protect the lumbar spine." },

    /* ---- expanded SQUAT variations ---- */
    squat_alt_narrow: { id:"squat_alt_narrow", pattern:"squat", name:"Narrow-Stance Squat", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Stand with the feet close together, about hip-width or narrower.","Keep the heels down and brace as you sit straight down.","Expect a balance challenge — move slowly and stay controlled.","Drive up through the whole foot, keeping the chest tall."],
      mistakes:["Rushing and losing balance forward.","Letting the heels lift to reach more depth."],
      readiness:"Builds the balance and quad emphasis needed for single-leg work — aim for 15 controlled reps.",
      injury:"If the knees feel stressed, widen the stance slightly." },

    squat_alt_deep: { id:"squat_alt_deep", pattern:"squat", name:"Deep (Ass-to-Grass) Squat", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Squat as low as your mobility allows, aiming for hamstrings on calves.","Keep the heels planted and the chest as upright as possible.","Spend a beat in the bottom, prying the knees open with the elbows if needed.","Stand all the way up and squeeze the glutes."],
      mistakes:["Heels popping up at the bottom — work on ankle mobility instead.","Rounding the lower back in the hole."],
      readiness:"A mobility and strength builder for the deep range — own 15 full-depth reps.",
      injury:"Build depth gradually; never force past a pain-free range." },

    squat_alt_cossack: { id:"squat_alt_cossack", pattern:"squat", name:"Cossack Squat", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Take a very wide stance, toes pointing slightly out.","Shift your weight onto one leg and squat down over it, keeping the other leg straight.","Keep the squatting heel down and the chest proud.","Push back to center and shift to the other side."],
      mistakes:["Letting the bent-leg heel lift off the floor.","Collapsing the chest toward the floor."],
      readiness:"A unilateral mobility-strength hybrid — work to 8 smooth reps per side.",
      injury:"Demands hip and ankle mobility; ease the depth if the knees complain." },

    squat_alt_assistedpistol: { id:"squat_alt_assistedpistol", pattern:"squat", name:"Assisted Pistol Squat", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Hold a doorframe, pole, or rings for light support.","Extend one leg in front and sit straight down on the standing leg.","Use the hands only as much as needed for balance, not to pull yourself up.","Drive through the heel to stand without touching the free foot down."],
      mistakes:["Pulling hard with the arms instead of letting the leg do the work.","Letting the standing heel lift at the bottom."],
      readiness:"The direct stepping stone to a free pistol — wean off the assistance as you strengthen.",
      injury:"Warm the ankles and knees well; stop at any sharp knee sensation." },

    /* ---- SKILL CATEGORY: PLANCHE ---- */
    skill_planche_1: { id:"skill_planche_1", pattern:"skill", name:"Planche Lean", level:1, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Start in a push-up plank with hands turned out slightly.","Lean the shoulders forward well past the hands, rising onto the front of the feet.","Push the floor away hard and round the upper back into a protracted, hollow shape.","Hold the lean — the more your shoulders pass the hands, the harder it gets."],
      mistakes:["Letting the hips pike up instead of staying in a straight line.","Bending the elbows to cheat the lean."],
      readiness:"Build to a 30-second strong lean before progressing toward the tuck planche.",
      injury:"Heavy wrist load — warm the wrists thoroughly and build gradually." },

    skill_planche_2: { id:"skill_planche_2", pattern:"skill", name:"Tuck Planche", level:2, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["From the planche lean, lift both feet and tuck the knees tight to the chest.","Balance entirely on the hands with the shoulders leaning forward.","Protract the shoulder blades hard and round the back.","Keep the hips at shoulder height — don't let them sag."],
      mistakes:["Resting the knees on the elbows instead of holding with the shoulders.","Letting the shoulders drift back behind the hands."],
      readiness:"Aim for a 15-20 second clean tuck hold before opening the hips.",
      injury:"Significant wrist and shoulder demand; stop on any joint pain." },

    skill_planche_3: { id:"skill_planche_3", pattern:"skill", name:"Advanced Tuck Planche", level:3, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Hold a tuck planche but open the hips so the back is flat and parallel to the floor.","Keep the knees tucked but move them away from the chest.","Maintain a strong forward lean and protracted shoulders.","The flatter the back, the greater the leverage challenge."],
      mistakes:["Keeping the hips piked high to make it easier.","Losing the protraction and sinking between the shoulders."],
      readiness:"Hold 15 seconds with a flat back before extending one leg.",
      injury:"Build wrist and bicep-tendon resilience slowly at this stage." },

    skill_planche_4: { id:"skill_planche_4", pattern:"skill", name:"Straddle Planche", level:4, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["From an advanced tuck, extend both legs out wide into a straddle.","The wide leg position shortens the leverage versus a full planche.","Keep the body parallel to the floor, shoulders well forward.","Point the toes and keep everything rigid."],
      mistakes:["Letting the hips rise above shoulder height.","Bending the elbows under the load."],
      readiness:"A 10-15 second straddle hold sets up the full planche.",
      injury:"Elite-level load; never train it cold or fatigued." },

    skill_planche_5: { id:"skill_planche_5", pattern:"skill", name:"Full Planche", level:5, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Bring the legs together and extend fully into a straight-body hold.","The entire body floats parallel to the floor, supported only on the hands.","Maximal forward lean and aggressive shoulder protraction throughout.","Squeeze glutes, point toes, and keep one rigid line."],
      mistakes:["Any pike at the hips breaks the position.","Allowing the shoulders to fall back behind the hands."],
      readiness:"The pinnacle of straight-arm pushing strength — a multi-year goal for most.",
      injury:"Only attempt with fully conditioned wrists, elbows, and shoulders." },

    /* ---- SKILL CATEGORY: FRONT LEVER ---- */
    skill_frontlever_1: { id:"skill_frontlever_1", pattern:"skill", name:"Tuck Front Lever", level:1, era:1, mode:"hold", unit:"sec", equipment:["pullupBar","rings"],
      cues:["Hang from a bar with an overhand grip, arms straight.","Pull the shoulder blades down and back to engage the lats.","Tuck the knees to the chest and lift the hips until the back is horizontal.","Keep the arms locked straight and the body facing the ceiling."],
      mistakes:["Bending the elbows to pull into position.","Letting the shoulders shrug up toward the ears."],
      readiness:"Hold a tuck for 20 seconds with straight arms before opening the body.",
      injury:"Demands strong straight-arm lats; build the passive hang and scapular pulls first." },

    skill_frontlever_2: { id:"skill_frontlever_2", pattern:"skill", name:"Advanced Tuck Front Lever", level:2, era:1, mode:"hold", unit:"sec", equipment:["pullupBar","rings"],
      cues:["From a tuck front lever, open the hips so the torso and thighs form a flat line.","Keep the knees bent but move them away from the chest.","Maintain straight arms and depressed, retracted shoulders.","Keep the body horizontal and facing up."],
      mistakes:["Piking the hips up to reduce the load.","Losing lat tension so the chest drops."],
      readiness:"Hold 15 seconds flat-backed before extending a leg.",
      injury:"Progress gradually to protect the shoulders and elbows." },

    skill_frontlever_3: { id:"skill_frontlever_3", pattern:"skill", name:"Straddle Front Lever", level:3, era:1, mode:"hold", unit:"sec", equipment:["pullupBar","rings"],
      cues:["Extend both legs into a wide straddle from the advanced tuck.","The wide legs shorten the lever compared to a full front lever.","Keep arms straight, lats engaged, body horizontal.","Point the toes and keep the hips level with the shoulders."],
      mistakes:["Letting the hips sag below the shoulders.","Bending the arms to hold the line."],
      readiness:"A 10-second straddle hold leads into the full front lever.",
      injury:"Keep the elbows soft-locked, not hyperextended, to protect the joint." },

    skill_frontlever_4: { id:"skill_frontlever_4", pattern:"skill", name:"Full Front Lever", level:4, era:1, mode:"hold", unit:"sec", equipment:["pullupBar","rings"],
      cues:["Bring the legs together and hold the whole body horizontal under the bar.","Arms stay straight; the lats and core do the work.","Keep the body in one rigid line, facing the ceiling.","Squeeze everything — glutes, core, legs — to hold the line."],
      mistakes:["Any sag at the hips breaks the lever.","Pulling with bent arms instead of straight-arm scapular strength."],
      readiness:"A hallmark straight-arm pulling skill — a long-term goal built over months.",
      injury:"Requires resilient shoulders and elbows; never grind it cold." },

    /* ---- SKILL CATEGORY: HANDSTAND ---- */
    skill_handstand_1: { id:"skill_handstand_1", pattern:"skill", name:"Wall Plank (Toes on Wall)", level:1, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Start in a plank with your feet against the base of a wall.","Walk the feet up the wall while walking the hands closer in.","Stop at a comfortable incline and hold a tight, hollow body.","This builds the shoulder endurance and overhead position for handstands."],
      mistakes:["Letting the lower back overarch.","Shrugging instead of pushing tall through the shoulders."],
      readiness:"Hold 45 seconds comfortably before progressing to a chest-to-wall handstand.",
      injury:"Eases into being inverted safely; come down if the wrists tire." },

    skill_handstand_2: { id:"skill_handstand_2", pattern:"skill", name:"Chest-to-Wall Handstand", level:2, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Face the wall and walk up into a handstand with the chest and toes touching it.","Stack the wrists, shoulders, and hips in a tall, straight line.","Push the floor away hard and keep the ribs tucked.","Hold the hollow line without banana-ing the back."],
      mistakes:["Arching the back into a banana shape.","Sinking into the shoulders instead of pushing tall."],
      readiness:"A 45-second stable hold prepares you to balance freely.",
      injury:"Actively push through the shoulders to protect them and the wrists." },

    skill_handstand_3: { id:"skill_handstand_3", pattern:"skill", name:"Back-to-Wall Handstand", level:3, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Kick up to a handstand with your back to the wall, heels resting lightly on it.","Find the tall, stacked line and take pressure off the wall.","Make small balance corrections through the fingers.","Practice holding with only the lightest wall contact."],
      mistakes:["Leaning the whole body weight into the wall.","Letting the hips pike away from the wall."],
      readiness:"When you can balance off the wall for a few seconds, try a free handstand.",
      injury:"Learn to bail safely (step or cartwheel out) before going free." },

    skill_handstand_4: { id:"skill_handstand_4", pattern:"skill", name:"Freestanding Handstand", level:4, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Kick up to balance with no wall support.","Balance comes from the fingertips and wrists, not the whole arm.","Keep a tall, hollow line — squeeze the glutes and point the toes.","Make constant micro-adjustments through the hands to stay up."],
      mistakes:["Stiffening up instead of making fluid balance corrections.","Holding the breath, which kills your balance control."],
      readiness:"A 30-second free hold is a strong intermediate milestone.",
      injury:"Always know your bail-out; practice on a soft surface while learning." },

    /* ---- SKILL CATEGORY: L-SIT & CORE SKILLS ---- */
    skill_lsit_1: { id:"skill_lsit_1", pattern:"skill", name:"Foot-Supported L-Sit", level:1, era:1, mode:"hold", unit:"sec", equipment:["bench","parallettes"],
      cues:["Sit on the floor or between two raised supports, hands pressing down.","Depress the shoulders and lock the elbows straight.","Keep the heels lightly on the floor and lift the hips off the ground.","Hold with the chest tall and shoulders pushed down."],
      mistakes:["Shrugging the shoulders up to the ears.","Bending the elbows to hold the lift."],
      readiness:"Hold 20-30 seconds before lifting the feet into a tuck.",
      injury:"Use parallettes if pressing on flat ground bothers the wrists." },

    skill_lsit_2: { id:"skill_lsit_2", pattern:"skill", name:"Tuck L-Sit", level:2, era:1, mode:"hold", unit:"sec", equipment:["bench","parallettes"],
      cues:["Press up on supports, depress the shoulders, lock the elbows.","Lift the hips and tuck both knees toward the chest, feet off the floor.","Hold the body weight entirely on the hands.","Keep the chest tall and the shoulders driven down."],
      mistakes:["Letting the shoulders rise toward the ears.","Leaning back to make the balance easier."],
      readiness:"A 30-second tuck hold sets up extending the legs.",
      injury:"Stretch the hip flexors before and after; cramping is common." },

    skill_lsit_3: { id:"skill_lsit_3", pattern:"skill", name:"Full L-Sit", level:3, era:1, mode:"hold", unit:"sec", equipment:["bench","parallettes"],
      cues:["From a tuck L-sit, extend both legs straight out parallel to the floor.","Push the supports down hard and keep the shoulders depressed.","Point the toes and squeeze the legs together.","Hold without leaning back to fake the angle."],
      mistakes:["Bending the knees as the core fatigues.","Dropping the hips below the hands."],
      readiness:"Hold 20 seconds with locked legs before chasing the V-sit.",
      injury:"Strong hip-flexor and core demand — build gradually." },

    skill_vsit: { id:"skill_vsit", pattern:"skill", name:"V-Sit", level:4, era:1, mode:"hold", unit:"sec", equipment:["bench","parallettes"],
      cues:["From a strong L-sit, lean back slightly and raise the legs above hip height.","Aim to form a V shape with the torso and legs.","Keep the arms straight and the shoulders pushed down.","Squeeze the legs together and point the toes."],
      mistakes:["Bending the knees to lift the legs higher.","Rounding the back instead of compressing from the hips."],
      readiness:"An advanced compression skill built on a solid full L-sit.",
      injury:"Demands serious hip-flexor and hamstring flexibility; warm up well." },

    /* ---- NO-EQUIPMENT PULL fallbacks (no bar needed) ---- */
    pull_alt_tabledoor: { id:"pull_alt_tabledoor", pattern:"pull", name:"Table / Door-Edge Row", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Find a sturdy, heavy table (or a solid door braced fully open on its hinge side).","Lie underneath, reach up and grip the edge with both hands.","Keep the body in a straight plank line, heels on the floor.","Pull your chest up toward the edge, squeezing the back, then lower with control."],
      mistakes:["Using a light table that could tip — only use something that won't move.","Letting the hips sag instead of holding a rigid line."],
      readiness:"A no-bar horizontal pull — bend the knees to make it easier, straighten the body to make it harder.",
      injury:"Test the surface is rock-solid before loading it; keep the neck neutral." },

    pull_alt_towel: { id:"pull_alt_towel", pattern:"pull", name:"Towel Door Row", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Loop a strong towel around a securely latched door handle on both sides.","Stand close, feet either side of the door, and lean back holding both towel ends.","Keep the arms straight to start, body angled back in a straight line.","Pull your chest toward the door by driving the elbows back, then lower slowly."],
      mistakes:["Using a flimsy towel or an unlatched door.","Bending at the hips instead of keeping a straight body angle."],
      readiness:"An accessible rowing option anywhere there's a solid door — the more horizontal your body, the harder it is.",
      injury:"Check the door is fully latched and the towel is strong before leaning back." },

    /* ---- NO-EQUIPMENT DIP fallbacks (no bar/parallettes needed) ---- */
    dip_alt_chair: { id:"dip_alt_chair", pattern:"dip", name:"Chair Bench Dip", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Sit on the edge of a stable chair and place your hands beside your hips, fingers forward.","Walk the feet out and slide your hips off the front edge.","Keep the shoulders down and chest up as you bend the elbows to lower.","Press back up to a full lockout; bend the knees to make it easier, extend the legs to make it harder."],
      mistakes:["Letting the shoulders shrug up toward the ears.","Dropping too deep and overstretching the shoulders."],
      readiness:"A no-equipment triceps-and-chest dip using any sturdy chair — aim for 15 controlled reps.",
      injury:"Limit the depth so the shoulders stay comfortable; use a chair that won't slide." },

    dip_alt_twochair: { id:"dip_alt_twochair", pattern:"dip", name:"Two-Chair Dip", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Set two sturdy chairs of equal height facing each other, a shoulder-width apart.","Place a hand on each seat and support your weight with arms locked.","Keep the body slightly forward and the shoulders down.","Lower until the elbows reach about 90 degrees, then press back to lockout."],
      mistakes:["Using light chairs that can tip or slide — only use heavy, stable ones.","Going too deep and stressing the shoulders."],
      readiness:"A parallel-bar dip substitute when you have no bars — build to 12 strict reps.",
      injury:"Make sure both chairs are rock-solid; place them against a wall if unsure." },

    /* ---- STAGE 2 additions: the two movements the progression catalogue
       (training.data.js) needs and the app never had. Neither is on a skill
       track yet; nothing reads them until Stage 2's builder is wired. ---- */
    push_incline: { id:"push_incline", pattern:"push", name:"Incline Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Set your hands on a firm, immovable surface: a counter (~90 cm), a table (~75 cm), a chair seat (~45 cm) or a step (~20 cm). The lower the surface, the harder the push-up.","Walk the feet back until the body is one straight line from ears to heels.","Lower the chest to the edge of the surface, elbows tracking about 45° from the torso.","Press away fully and spread the shoulder blades at the top."],
      mistakes:["Letting the hips sag or pike, so the surface height stops meaning anything.","Using a surface that can slide or tip; test it with your weight before the first rep."],
      readiness:"Step down to the next lower surface once 12 clean reps feel easy on two different days.",
      injury:"Keep wrists neutral on the edge; a lower surface loads the wrists and shoulders more, so drop one step at a time." },

    squat_split: { id:"squat_split", pattern:"squat", name:"Split Squat", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Stand in a long stride, front foot flat and back heel lifted, feet hip-width apart so you don't balance on a tightrope.","Keep the torso tall and drop the back knee straight down toward the floor.","Stop when the back knee hovers just above the ground and the front shin is near vertical.","Drive through the whole front foot to stand, without pushing off the back leg."],
      mistakes:["Stepping too short so the front knee is shoved far past the toes.","Leaning the torso forward and letting the front heel come off the floor."],
      readiness:"Add reps per side before moving to the rear-foot-elevated Bulgarian split squat.",
      injury:"If the front knee complains, lengthen the stride and shorten the depth. A hand on a wall is fine." },

    /* ---- STAGE 3 · coverage, upper body, neck and grip (plan D2, step 3.1).
       pattern "accessory": not one of the seven movement patterns, so it has no
       SUBSTITUTIONS and no legacy level ladder; the progression catalogue
       (training.data.js) gives each its slot and its steps, and muscles.data.js
       its muscles. Nothing builds a workout from these yet (step 3.3 on). ---- */
    acc_curl_doorframe: { id:"acc_curl_doorframe", pattern:"accessory", name:"Door-Frame Curl", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Stand facing a solid, fixed door frame and take hold of its edge with both hands at chest height, palms turned toward you.", "Walk your feet forward and lean back with straight arms and a rigid body, so your weight hangs on your hands. The further back, the harder the curl.", "Bend your elbows and curl your chest toward the frame, keeping the elbows close to your ribs.", "Straighten the arms slowly until you are leaning back again before the next rep."],
      mistakes:["Letting the hips sag or bend so the body stops being one line.", "Swinging the hips forward to cheat the pull instead of bending the elbows."],
      readiness:"Lean further back once the current angle is easy on two different days; it is the same movement made harder.",
      injury:"Lean back gently first to check the frame doesn't flex. If the front of the elbow aches, stand more upright and ease the pull." },

    acc_curl_invrow: { id:"acc_curl_invrow", pattern:"accessory", name:"Underhand Inverted Row", level:null, era:1, mode:"reps", unit:"reps", equipment:["lowBar", "rings"],
      cues:["Set a bar at waist height, or hang rings low, and lie underneath it with an underhand grip, hands shoulder-width apart.", "Hold the body in one straight line with your heels on the floor; bend the knees to make it easier.", "Pull your chest to the bar by bending the elbows, keeping them close to your sides.", "Lower until the arms are straight, under control."],
      mistakes:["Letting the hips sag so the body bends in the middle.", "Shrugging toward the ears instead of bending the elbows."],
      readiness:"Straighten the body, then lower the bar, once the current angle is easy on two different days.",
      injury:"The underhand grip puts more work through the front of the elbow than a normal row. Stop if it aches, and use a palms-down grip instead." },

    acc_curl_band: { id:"acc_curl_band", pattern:"accessory", name:"Band Curl", level:null, era:1, mode:"reps", unit:"reps", equipment:["bands"],
      cues:["Stand on the middle of a band with your feet hip-width apart and hold an end in each hand, palms forward.", "Keep your elbows beside your ribs and your shoulders down.", "Curl your hands to your shoulders against the band's pull.", "Lower slowly; the band pulls hardest at the top, so don't let it snap back."],
      mistakes:["Swinging the torso back to get the hands up.", "Letting the elbows drift forward so the shoulders do the lifting."],
      readiness:"Move to a heavier band once the current one is easy on two different days.",
      injury:"Check the band for nicks before each session, and stand on it with the whole foot so it can't slip out." },

    acc_curl_db: { id:"acc_curl_db", pattern:"accessory", name:"Dumbbell Curl", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
      cues:["Stand tall with a dumbbell in each hand, palms forward.", "Pin your elbows beside your ribs.", "Curl the weights to your shoulders without swinging.", "Lower for about two seconds until the arms are straight."],
      mistakes:["Rocking the torso to heave the weight up.", "Cutting the lowering short, so only the top half of the range is worked."],
      readiness:"Add weight only when every set reaches the top of the range on two different days.",
      injury:"Pick a weight you can lower under control. If the front of the elbow aches, drop the weight." },

    acc_curl_hammer: { id:"acc_curl_hammer", pattern:"accessory", name:"Hammer Curl", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
      cues:["Hold a dumbbell in each hand with your palms facing your thighs.", "Keep the palms facing in the whole way up, as if holding a hammer.", "Curl without letting the elbows move forward.", "Lower slowly until the arms are straight."],
      mistakes:["Letting the wrists bend back under the weight.", "Swinging the shoulders to get the weights moving."],
      readiness:"Add weight only when every set reaches the top of the range on two different days.",
      injury:"A neutral grip is gentler on some elbows than a palms-up curl. The rule for adding weight is the same." },

    acc_lateral_iso: { id:"acc_lateral_iso", pattern:"accessory", name:"Isometric Lateral Raise", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Stand inside a doorway with one arm hanging by your side and the back of your wrist against the frame.", "Press the back of the hand into the frame as if raising the arm out to the side, without letting it move.", "Keep your shoulder down, away from your ear, and your body upright.", "Hold the push steady and keep breathing, then repeat on the other arm."],
      mistakes:["Hiking the shoulder toward the ear.", "Leaning the whole body into the frame."],
      readiness:"Move to the band raise when the hold is steady for the full time on two different days.",
      injury:"Push firmly, not with everything you have. Ease off if the top of the shoulder pinches." },

    acc_lateral_band: { id:"acc_lateral_band", pattern:"accessory", name:"Band Lateral Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:["bands"],
      cues:["Stand on the middle of a band with an end in each hand and your arms by your sides.", "Raise both arms out to the sides to about shoulder height, with a slight bend at the elbows.", "Lead with the elbows rather than the hands, and keep the shoulders down.", "Lower slowly against the pull."],
      mistakes:["Shrugging the shoulders to get the arms up.", "Raising above shoulder height, where the neck and traps take over."],
      readiness:"Move to a heavier band once the current one is easy on two different days.",
      injury:"Stop at shoulder height. If the top of the shoulder pinches on the way up, shorten the range." },

    acc_lateral_db: { id:"acc_lateral_db", pattern:"accessory", name:"Dumbbell Lateral Raise", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
      cues:["Stand tall with a light dumbbell in each hand at your sides.", "With a soft bend at the elbows, raise both arms out to the sides to shoulder height.", "Let the elbows lead and the hands follow.", "Lower for about two seconds."],
      mistakes:["Swinging the body to get the weights up.", "Using a weight the shoulders can't lift without the traps taking over."],
      readiness:"Light weights are the point. Add weight only when every set reaches the top of the range on two different days.",
      injury:"The arms are at their longest lever here, so use a weight you can lift without shrugging and stop at shoulder height." },

    acc_lateral_leanaway: { id:"acc_lateral_leanaway", pattern:"accessory", name:"Lean-Away Lateral Raise", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
      cues:["Hold a door frame or an upright post with one hand and lean your body away from it, with that arm straight.", "Hold a light dumbbell in the other hand, hanging by your side.", "Raise it out to the side to shoulder height, elbow leading.", "Lower slowly and keep the leaning body still, then swap sides."],
      mistakes:["Letting the hips swing out to get the weight up.", "Pulling on the frame instead of just holding it."],
      readiness:"Add weight only when every set reaches the top of the range on two different days.",
      injury:"Check the frame or post is solid before you lean on it, and keep the weight light enough that the neck stays out of it." },

    acc_reardelt_tdraise: { id:"acc_reardelt_tdraise", pattern:"accessory", name:"Prone T-Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Lie face down on the floor with your arms straight out to the sides in a T, thumbs pointing up and forehead near the floor.", "Lift both arms off the floor by squeezing the shoulder blades together and back.", "Keep your head in line with your spine and look at the floor.", "Lower with control."],
      mistakes:["Cranking the neck up to look forward.", "Lifting from the lower back instead of the shoulder blades."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Keep the lift small and smooth. If the lower back pinches, put a folded towel under your hips." },

    acc_reardelt_snowangel: { id:"acc_reardelt_snowangel", pattern:"accessory", name:"Reverse Snow Angel", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Lie face down with your arms by your hips, palms down and forehead near the floor.", "Lift the arms and chest slightly, then sweep the arms out and up overhead in a wide arc, keeping them off the floor.", "Sweep back to your hips with the shoulder blades pulling down and in.", "Keep the neck long throughout."],
      mistakes:["Letting the arms drop to the floor halfway through the arc.", "Lifting the chest high by arching the lower back."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Keep the sweep inside a range that stays smooth, and stop if the shoulder pinches overhead." },

    acc_reardelt_bandpull: { id:"acc_reardelt_bandpull", pattern:"accessory", name:"Band Pull-Apart", level:null, era:1, mode:"reps", unit:"reps", equipment:["bands"],
      cues:["Hold a band in front of you at shoulder height with straight arms and your hands about shoulder-width apart.", "Pull the band apart by moving your hands out to the sides, squeezing the shoulder blades together.", "Keep your ribs down and your arms level with your shoulders.", "Return slowly until the band is taut but not slack."],
      mistakes:["Shrugging up toward the ears.", "Leaning back to finish the pull."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Check the band for nicks before each session; an end that slips snaps back." },

    acc_reardelt_facepull: { id:"acc_reardelt_facepull", pattern:"accessory", name:"Band Face Pull", level:null, era:1, mode:"reps", unit:"reps", equipment:["bands"],
      cues:["Anchor a band at about face height on a door anchor or a post, and hold an end in each hand with straight arms.", "Step back until the band is taut.", "Pull your hands toward your face with the elbows high and wide, so the hands finish beside your ears.", "Squeeze the shoulder blades together, then return slowly."],
      mistakes:["Pulling to the chest with low elbows, which turns it into a row.", "Letting the anchor slide or the band unwind."],
      readiness:"Move to a heavier band once the current one is easy on two different days.",
      injury:"Make sure the anchor is closed and sound, and test it with a gentle tug before you step back." },

    acc_reardelt_dbfly: { id:"acc_reardelt_dbfly", pattern:"accessory", name:"Bent-Over Reverse Fly", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
      cues:["Hold a light dumbbell in each hand and hinge at the hips until your back is nearly flat, knees soft.", "Let the arms hang beneath your shoulders with the palms facing each other.", "Raise the arms out to the sides with a slight bend at the elbows, squeezing the shoulder blades.", "Lower slowly without letting the torso drop."],
      mistakes:["Rounding the back or letting the torso rise as the weights go up.", "Using a weight so heavy that the arms swing it."],
      readiness:"Light weights, strictly. Add weight only when every set reaches the top of the range on two different days.",
      injury:"The held hinge is the demanding part for the lower back. Keep the weights light, and rest your forehead on a chair if the back tires first." },

    acc_cuff_walllift: { id:"acc_cuff_walllift", pattern:"accessory", name:"Wall Slide with Lift-Off", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Stand with your back, head and hips against a wall and your feet a short step out. Bend the elbows to 90° with the forearms and the backs of the hands on the wall.", "Slide the arms up the wall into a Y, keeping them in contact.", "At the top, lift the hands a few centimetres off the wall and hold for a beat.", "Lower with the arms still against the wall."],
      mistakes:["Letting the lower back arch away from the wall as the arms rise.", "Shrugging the shoulders toward the ears."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Stay inside the range where the forearms still touch the wall. The work is in the small, controlled lift, not the reach." },

    acc_cuff_pronew: { id:"acc_cuff_pronew", pattern:"accessory", name:"Prone W Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Lie face down with your elbows bent and your hands beside your head, so the arms make a W and the forehead is near the floor.", "Lift the elbows and hands off the floor by drawing the shoulder blades down and back.", "Hold a beat at the top with the thumbs pointing up and slightly back.", "Lower slowly."],
      mistakes:["Cranking the neck up to look forward.", "Letting the elbows flare so wide that it becomes a T-raise."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Keep the lift small. A short, smooth range is better than a big, shaky one." },

    acc_cuff_bander: { id:"acc_cuff_bander", pattern:"accessory", name:"Band External Rotation", level:null, era:1, mode:"reps", unit:"reps", equipment:["bands"],
      cues:["Anchor a band at elbow height and stand sideways to it, holding the end with the hand farthest from the anchor.", "Tuck that elbow against your side, bent to 90°, with a folded towel between the elbow and your ribs if you like.", "Rotate the forearm outward, away from your belly, keeping the elbow where it is.", "Return slowly, then change sides."],
      mistakes:["Letting the elbow drift away from the ribs.", "Turning the whole torso instead of the arm."],
      readiness:"Move to a heavier band once the current one is easy on two different days.",
      injury:"Keep the band light. This is a small muscle, and a pull that makes the shoulder pinch is too much." },

    acc_cuff_sidelying: { id:"acc_cuff_sidelying", pattern:"accessory", name:"Side-Lying External Rotation", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
      cues:["Lie on one side with your head on your lower arm and a light dumbbell in the top hand, the elbow bent to 90° against your ribs.", "Rest the forearm across your belly.", "Rotate the forearm up toward the ceiling, keeping the elbow on your side.", "Lower slowly. Finish all the reps, then roll over."],
      mistakes:["Lifting the elbow away from the ribs.", "Using a weight so heavy that the body twists to lift it."],
      readiness:"Add weight only when every set reaches the top of the range on two different days. If 2.5 kg is a big jump for this movement, list the weights you own in Settings.",
      injury:"Start lighter than feels necessary, and stop if the shoulder pinches rather than tires." },

    acc_traps_pike: { id:"acc_traps_pike", pattern:"accessory", name:"Pike Shrug", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Start in a pike: hands on the floor, hips high, legs straight or knees slightly bent, so your body makes an inverted V.", "Keep the arms straight and push the floor away so the shoulders rise toward your ears.", "Let the shoulders sink between the arms, then shrug up again.", "Keep your head between your arms and your neck relaxed."],
      mistakes:["Bending the elbows, which turns it into a pike push-up.", "Moving at the hips instead of the shoulders."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"It loads the wrists like a pike push-up. Warm them up first, or rest on your fists if they complain." },

    acc_traps_band: { id:"acc_traps_band", pattern:"accessory", name:"Band Shrug", level:null, era:1, mode:"reps", unit:"reps", equipment:["bands"],
      cues:["Stand on the middle of a band with your feet hip-width apart, an end in each hand and your arms straight by your sides.", "Lift the shoulders straight up toward your ears, as high as they go.", "Hold a beat, then lower under control.", "Keep the head still and the elbows straight."],
      mistakes:["Rolling the shoulders, which adds nothing.", "Bending the elbows to help."],
      readiness:"Move to a heavier band once the current one is easy on two different days.",
      injury:"Check the band for nicks before each session, and stand on it with the whole foot." },

    acc_traps_shrug: { id:"acc_traps_shrug", pattern:"accessory", name:"Shrug", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells", "kettlebells"],
      cues:["Hold a weight in each hand at your sides, feet hip-width apart, standing tall.", "Lift the shoulders straight up toward your ears without bending the elbows.", "Hold a beat at the top.", "Lower slowly. Don't let the weights drag the shoulders down."],
      mistakes:["Rolling the shoulders instead of lifting them straight up.", "Letting the head jut forward as the weight gets heavier."],
      readiness:"Add weight only when every set reaches the top of the range on two different days.",
      injury:"Heavy shrugs load the neck as well as the traps. Stop adding weight when the head starts to jut forward." },

    acc_neck_chintuck: { id:"acc_neck_chintuck", pattern:"accessory", name:"Chin Tuck Hold", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Sit or stand tall with your eyes level.", "Draw the chin straight back, as if making a double chin, without tilting the head up or down.", "Hold the position with the back of the neck long, and keep breathing.", "Release slowly."],
      mistakes:["Tilting the head down instead of sliding it back.", "Clenching the jaw and holding your breath."],
      readiness:"Ready to move on when the hold is steady for the full time on two different days.",
      injury:"Move slowly and never jerk; stop at dizziness, pain or tingling in the neck, arms or hands." },

    acc_neck_fourway: { id:"acc_neck_fourway", pattern:"accessory", name:"Four-Way Neck Isometric", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Sit tall and put a palm against your forehead.", "Push your head into the hand while the hand pushes back, so nothing moves. Build the push over about two seconds.", "Hold, then release over two seconds. Repeat with the hand on each side of the head, then on the back of it.", "Each direction counts for the seconds you hold it. The effort is moderate, never maximal."],
      mistakes:["Pushing hard and fast, which is how a neck gets strained.", "Letting the head drift while you push."],
      readiness:"Ready to move on when every direction holds for the full time on two different days.",
      injury:"Move slowly and never jerk; stop at dizziness, pain or tingling in the neck, arms or hands." },

    acc_neck_lyingraise: { id:"acc_neck_lyingraise", pattern:"accessory", name:"Lying Neck Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Lie face up on a mat or bed with your knees bent.", "Tuck your chin, then lift your head a few centimetres, keeping the chin tucked.", "Hold a beat at the top, then lower slowly.", "Keep your shoulders on the floor and your jaw relaxed."],
      mistakes:["Jutting the chin forward as the head lifts.", "Lifting the shoulders and shrugging."],
      readiness:"The neck tires before it feels hard, so add reps slowly and keep every one smooth.",
      injury:"Move slowly and never jerk; stop at dizziness, pain or tingling in the neck, arms or hands." },

    acc_grip_wring: { id:"acc_grip_wring", pattern:"accessory", name:"Towel Wring Hold", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Take a dry hand towel and grip it with both hands, a fist's width apart.", "Twist your hands in opposite directions as if wringing out water.", "Hold the squeeze hard and steady, with your arms straight in front of you.", "Release, and swap the twist direction between sets."],
      mistakes:["Wringing in short bursts instead of holding the squeeze.", "Locking the wrists bent so the wrist tires before the forearm does."],
      readiness:"Ready to move on when the hold is steady for the full time on two different days.",
      injury:"Use a strong, dry towel and keep the wrists straight. Stop if they ache sharply." },

    acc_grip_towelhang: { id:"acc_grip_towelhang", pattern:"accessory", name:"Towel Hang", level:null, era:1, mode:"hold", unit:"sec", equipment:["pullupBar"],
      cues:["Drape a strong towel over a pull-up bar and hold one end in each hand.", "Lift your feet and hang with your arms straight and the shoulders pulled slightly down.", "Hold for the set's time. The towel makes the grip much harder than a bare bar.", "Step down while you still can, not after the grip has gone."],
      mistakes:["Letting the shoulders shrug up to the ears.", "Using a thin or worn towel."],
      readiness:"Ready to move on when the hold is steady for the full time on two different days.",
      injury:"Check the towel and the bar first, keep a stool or step under your feet, and end the set while you can still step down." },

    acc_grip_farmer: { id:"acc_grip_farmer", pattern:"accessory", name:"Farmer Hold", level:null, era:2, mode:"hold", unit:"sec", equipment:["dumbbells", "kettlebells"],
      cues:["Pick up a weight in each hand and stand tall with your shoulders down and back.", "Squeeze the handles hard and stay put, arms straight by your sides.", "Keep your ribs down and don't lean to one side.", "Put the weights down while you still control them."],
      mistakes:["Shrugging the shoulders up and forward.", "Leaning back to take the weight off the hands."],
      readiness:"Add weight only when every set reaches the full time on two different days.",
      injury:"Lift and lower with a flat back and bent knees, and set the weights down while you still control them." },

    acc_grip_wristcurl: { id:"acc_grip_wristcurl", pattern:"accessory", name:"Wrist Curl", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
      cues:["Sit with a dumbbell in one hand, the forearm resting along your thigh and the hand hanging past the knee, palm up.", "Let the weight roll down to your fingertips, then curl the fingers closed and lift the wrist.", "Raise only the hand; the forearm stays on your leg.", "Lower slowly, then swap arms."],
      mistakes:["Lifting the forearm off the thigh.", "Bouncing the weight at the bottom."],
      readiness:"Add weight only when every set reaches the top of the range on two different days.",
      injury:"Light weights are enough. Stop if the wrist or the inside of the elbow aches." },

    acc_grip_revwristcurl: { id:"acc_grip_revwristcurl", pattern:"accessory", name:"Reverse Wrist Curl", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
      cues:["Sit with a dumbbell in one hand, the forearm resting along your thigh and the hand hanging past the knee, palm down.", "Lift the back of the hand toward the ceiling by bending the wrist up.", "Raise only the hand; the forearm stays on your leg.", "Lower slowly, then swap arms."],
      mistakes:["Lifting the forearm off the thigh.", "Letting the weight drop instead of lowering it."],
      readiness:"Add weight only when every set reaches the top of the range on two different days.",
      injury:"Use a lighter weight than for the palm-up curl. Stop if the wrist or the outside of the elbow aches." },

    /* ---- STAGE 3 · coverage, lower body and trunk (plan D2, step 3.2). Same shape
       as the block above: pattern "accessory", no SUBSTITUTIONS, steps in
       training.data.js, muscles in muscles.data.js. Side planks, Copenhagen
       planks and the suitcase hold are timed per side, and the per-side reps
       are per leg. ---- */
    acc_quad_wallsit: { id:"acc_quad_wallsit", pattern:"accessory", name:"Wall Sit", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Stand with your back flat against a wall and walk your feet forward about 60 cm, hip-width apart.", "Slide down until your thighs are as close to parallel with the floor as you can manage, knees over your ankles.", "Press your lower back and shoulders into the wall, with your arms hanging by your sides rather than resting on your thighs.", "Hold for the set's time, breathing normally, then slide up slowly."],
      mistakes:["Resting your hands on your thighs, which takes the load off them.", "Letting the knees drift inward or sit far past the toes."],
      readiness:"Ready to move on when the hold is steady for the full time on two different days.",
      injury:"Sit higher if the front of the knee aches; a shallower angle is still the same exercise. Stand up before your legs shake hard." },

    acc_quad_revlunge: { id:"acc_quad_revlunge", pattern:"accessory", name:"Reverse Lunge", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Stand tall with your feet hip-width apart. Hold a wall or a chair back if you need balance.", "Step one foot back a long stride and lower until the back knee hovers just above the floor.", "Keep the front foot flat, most of your weight through the front heel, and your torso upright.", "Press through the front foot to bring the back foot to meet it. Finish one leg, then switch."],
      mistakes:["Stepping back too short, which pushes the front knee far past the toes.", "Pushing off the back foot instead of driving through the front one."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Stepping back is usually kinder to the front knee than stepping forward. Shorten the depth if the knee complains, and keep a hand on a wall until it feels steady." },

    acc_quad_stepup: { id:"acc_quad_stepup", pattern:"accessory", name:"Step-Up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Stand facing a stair or a sturdy step. A low step is easy; one around knee height is hard.", "Put your whole front foot on the step so the heel doesn't hang off.", "Press through that foot to stand tall on the step, using the back leg only for balance.", "Lower slowly until the back foot just touches the floor, then repeat. Finish one leg, then switch."],
      mistakes:["Pushing off the back foot so the front leg does little.", "Letting the front knee cave inward as you stand up."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Check that the step can't slide or tip before the first rep. Use a lower step if the front knee aches." },

    acc_quad_sissy: { id:"acc_quad_sissy", pattern:"accessory", name:"Assisted Sissy Squat", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Stand beside a door frame or a solid post and hold it with one hand, feet about hip-width apart.", "Rise onto the balls of both feet.", "Bend the knees forward and lower your hips a short way while your torso leans back, so the knees travel far in front of the toes.", "Go only as low as stays smooth, then push the knees back and stand tall."],
      mistakes:["Dropping the hips back as in a normal squat, which skips the point of it.", "Pulling on the frame instead of just steadying yourself."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"The knees travel far past the toes on purpose, which loads the front of the knee and the ankles hard. Start with a short range and stop if either aches." },

    acc_quad_dbsplit: { id:"acc_quad_dbsplit", pattern:"accessory", name:"Dumbbell Split Squat", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
      cues:["Hold a dumbbell in each hand at your sides and stand in a long stride, front foot flat and back heel lifted.", "Keep the torso tall and drop the back knee straight down toward the floor.", "Stop just above the ground with the front shin near vertical.", "Drive through the whole front foot to stand. Finish one leg, then switch."],
      mistakes:["Stepping too short so the front knee is shoved far past the toes.", "Leaning forward and letting the front heel come off the floor."],
      readiness:"Add weight only when every set reaches the top of the range on two different days.",
      injury:"Rest a light hand on a wall until the weights feel steady. If the front knee complains, lengthen the stride and shorten the depth." },

    acc_quad_spanish: { id:"acc_quad_spanish", pattern:"accessory", name:"Spanish Squat", level:null, era:1, mode:"reps", unit:"reps", equipment:["bands"],
      cues:["Anchor a band at knee height on a sturdy post, loop it around the backs of your knees and step away until it is taut.", "Stand with your feet about hip-width apart and let the band pull your knees forward as you sit back, so your shins stay upright.", "Sink until your thighs are about parallel with the floor, torso tall.", "Press through your whole foot to stand, keeping the band taut throughout."],
      mistakes:["Letting the shins tilt forward, which shifts the work to the hips.", "Rising so far that the band goes slack at the top."],
      readiness:"Move to a heavier band once the current one is easy on two different days.",
      injury:"Check the anchor and the band for nicks before you step back. The band pulls your knees forward, so stop if the front of the knee aches." },

    acc_hamstring_slidecurl: { id:"acc_hamstring_slidecurl", pattern:"accessory", name:"Sliding Leg Curl", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Lie on your back with your heels on a towel on a smooth floor (tile or wood), or in socks on a polished one, knees bent, and lift your hips into a bridge.", "Keep the hips up and slide both heels away until your legs are nearly straight.", "Pull the heels back toward your glutes without letting the hips drop.", "Move slowly: about three seconds out and two back."],
      mistakes:["Letting the hips sag as the legs straighten.", "Pulling back by bending at the hips instead of at the knees."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"The lengthening part is the demanding one for the back of the thigh, so go slowly and stop short of straight if it pulls sharply." },

    acc_hamstring_slidecurl1: { id:"acc_hamstring_slidecurl1", pattern:"accessory", name:"Single-Leg Sliding Leg Curl", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Set up as for the two-leg version, bridged on a smooth floor, but with only one heel on the towel and the other leg held in the air.", "Keep the hips level and high.", "Slide the working heel out until the leg is nearly straight, then pull it back under control.", "Finish one leg, then switch."],
      mistakes:["Letting the hips tilt or drop toward the working side.", "Using the free leg to push."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"This is a hard load on one hamstring. Slide out only as far as you can pull back smoothly." },

    acc_hamstring_slrdl: { id:"acc_hamstring_slrdl", pattern:"accessory", name:"Single-Leg RDL (Bodyweight)", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Stand on one foot with the knee slightly bent and your hands in front of you or on your hips.", "Hinge forward from the hip, sending the other leg straight back as your torso tips toward parallel with the floor.", "Keep your back flat and your hips square to the floor.", "Stand by pushing the floor away through the standing foot. Finish one leg, then switch."],
      mistakes:["Rounding the back to reach lower.", "Opening the hips so the free leg swings out to the side."],
      readiness:"Add reps until every set reaches the top of the range on two different days.",
      injury:"Hold a wall or a chair back with one hand until your balance is steady, and stop the hinge before the back starts to round." },

    acc_hamstring_slrdldb: { id:"acc_hamstring_slrdldb", pattern:"accessory", name:"Single-Leg RDL with Dumbbell", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
      cues:["Hold one dumbbell in one hand and stand on the opposite leg, knee slightly bent.", "Hinge from the hip with the free leg sweeping straight back and the dumbbell hanging under your shoulder.", "Keep your back flat and your hips square to the floor.", "Stand by driving through the standing foot. Finish one leg, then switch."],
      mistakes:["Rounding the back as the dumbbell drops.", "Twisting the hips toward the side holding the weight."],
      readiness:"Add weight only when every set reaches the top of the range on two different days.",
      injury:"Start lighter than feels necessary: the balance is the limit. Touch a wall with the free hand if you need to, and stop the hinge before the back rounds." },

    acc_hamstring_bandcurl: { id:"acc_hamstring_bandcurl", pattern:"accessory", name:"Band Leg Curl", level:null, era:1, mode:"reps", unit:"reps", equipment:["bands"],
      cues:["Anchor a band low on a sturdy post or heavy furniture, loop the other end around both heels and lie face down facing the anchor.", "Start with your legs straight and the band taut.", "Bend your knees to bring the heels toward your glutes against the pull.", "Lower slowly until the legs are straight."],
      mistakes:["Lifting the hips off the floor to help.", "Letting the band yank the legs straight."],
      readiness:"Move to a heavier band once the current one is easy on two different days.",
      injury:"Check the anchor and the band for nicks, and loop it so it can't slip off your heels. If the back of the knee pinches, shorten the range." },

    acc_calf_raise: { id:"acc_calf_raise", pattern:"accessory", name:"Calf Raise on a Step", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Stand on the edge of a step with the balls of your feet on it and your heels hanging off. Hold a wall or a rail for balance.", "Lower your heels below the step until you feel a stretch in the calves.", "Rise as high as you can onto your toes and pause for a beat.", "Lower for about two seconds. Keep your knees straight, not locked."],
      mistakes:["Bouncing out of the bottom instead of pausing.", "Rolling the ankles outward as you rise."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Use a firm step and keep a hand on a rail. Take the bottom stretch gently; if the tendon above the heel aches, shorten the range." },

    acc_calf_single: { id:"acc_calf_single", pattern:"accessory", name:"Single-Leg Calf Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Stand on one foot on the edge of a step, the other foot hooked behind the ankle or held off the floor, with a hand on a wall or a rail.", "Lower the heel below the step until you feel the stretch.", "Rise as high as you can on that foot and pause.", "Lower slowly. Finish one leg, then switch."],
      mistakes:["Leaning on the rail so the leg does less of the work.", "Dropping fast into the stretch."],
      readiness:"Add reps until every set reaches the top of the range on two different days.",
      injury:"All of your bodyweight is on one ankle, so build up the reps gradually. Stop if the tendon above the heel or the heel itself aches." },

    acc_calf_bentknee: { id:"acc_calf_bentknee", pattern:"accessory", name:"Bent-Knee Calf Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Stand on the edge of a step with the balls of your feet on it, a hand on a wall, and your knees bent to about 30 degrees.", "Keep that knee bend the whole time; don't straighten as you rise.", "Rise onto your toes and pause, then lower your heels below the step.", "Lower for about two seconds."],
      mistakes:["Straightening the knees as you rise, which turns it into the straight-knee version.", "Cutting the range short at the bottom."],
      readiness:"Add reps until every set reaches the top of the range on two different days.",
      injury:"The bent knee moves more of the work into the lower calf. Go gently until it's familiar, and shorten the range if the tendon above the heel aches." },

    acc_calf_weighted: { id:"acc_calf_weighted", pattern:"accessory", name:"Weighted Single-Leg Calf Raise", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells", "kettlebells"],
      cues:["Hold a dumbbell or kettlebell in one hand and a wall or a rail with the other.", "Stand on one foot on the edge of a step with the heel hanging off.", "Lower the heel below the step, then rise as high as you can and pause.", "Lower slowly. Finish one leg, then switch."],
      mistakes:["Leaning away from the weight so the standing leg does less.", "Bouncing out of the bottom."],
      readiness:"Add weight only when every set reaches the top of the range on two different days. If 2.5 kg is a big jump for this movement, list the weights you own in Settings.",
      injury:"Add weight in small steps; the tendon above the heel is slow to adapt. Stop if it or the heel aches." },

    acc_shin_wall: { id:"acc_shin_wall", pattern:"accessory", name:"Wall Tibialis Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Stand with your back against a wall and your feet shoulder-width apart, a short way from it. The farther out the feet, the harder it gets.", "Keep your legs straight and your hips and shoulders against the wall.", "Lift the front of both feet toward your shins as high as you can, heels staying on the floor.", "Pause at the top, then lower slowly."],
      mistakes:["Bending the knees, which takes the work out of the shins.", "Rushing, so the feet flop down."],
      readiness:"Move your feet farther from the wall once every set reaches the top of the range on two different days.",
      injury:"Move slowly. A burn along the front of the shin is the target; stop for a sharp pain on the bone itself." },

    acc_shin_single: { id:"acc_shin_single", pattern:"accessory", name:"Single-Leg Tibialis Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Stand with your back against a wall, one foot on the floor a short way from it and the other foot held just off the floor.", "Keep your standing leg straight and your hips against the wall.", "Lift the front of the standing foot toward your shin as high as it goes, heel staying down, and pause.", "Lower slowly. Finish one leg, then switch."],
      mistakes:["Leaning away from the wall so the foot has less to lift.", "Letting the foot flop down after each rep."],
      readiness:"Add reps until every set reaches the top of the range on two different days; it is the last step in this slot.",
      injury:"Move slowly. A burn along the front of the shin is the target; stop for a sharp pain on the bone itself." },

    acc_adductor_sidelying: { id:"acc_adductor_sidelying", pattern:"accessory", name:"Side-Lying Adduction", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Lie on your side with the bottom leg straight and the top leg bent, its foot on the floor in front of the bottom knee. Rest your head on your arm.", "Lift the bottom leg off the floor toward the top one, as high as you can without rolling your hips.", "Pause at the top, then lower slowly.", "Finish one side, then roll over."],
      mistakes:["Rolling the hips back to swing the leg up.", "Dropping the leg quickly instead of lowering it."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Keep the lift small if the groin pulls. It is a smooth, short movement, not a swing." },

    acc_adductor_copknee: { id:"acc_adductor_copknee", pattern:"accessory", name:"Copenhagen Plank, Knee on a Chair", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Set a sturdy chair on a non-slip floor. Lie on your side with the forearm of your lower arm on the floor, elbow under the shoulder, and your top knee on the seat.", "Lift your hips until your body makes a straight line from the top knee to your shoulder, the lower leg hanging free beneath you.", "Press the top knee down into the seat and keep the hips from sagging or turning forward.", "Hold for the set's time, then lower. Repeat on the other side."],
      mistakes:["Letting the hips sag toward the floor.", "Rotating the chest toward the floor or the ceiling."],
      readiness:"Ready to move on when the hold is steady for the full time on both sides on two different days.",
      injury:"This loads the inner thigh hard. Start with short holds and stop if the groin pulls sharply. Make sure the chair can't slide." },

    acc_adductor_copfoot: { id:"acc_adductor_copfoot", pattern:"accessory", name:"Copenhagen Plank, Foot on a Chair", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Set a sturdy chair on a non-slip floor. Lie on your side with your forearm under your shoulder and the inside of your top foot on the seat, leg straight.", "Lift your hips until your body is one straight line from the top foot to your shoulder, the lower leg hanging free beneath the seat.", "Press the top foot into the seat and hold the line without letting the hips sag or turn forward.", "Hold for the set's time, then lower. Repeat on the other side."],
      mistakes:["Letting the hips sag toward the floor.", "Rotating the chest toward the floor or the ceiling."],
      readiness:"Ready to move on when the hold is steady for the full time on both sides on two different days.",
      injury:"This is the hardest bodyweight adductor work in the slot. Build the holds slowly, and stop if the groin pulls sharply." },

    acc_adductor_band: { id:"acc_adductor_band", pattern:"accessory", name:"Band Adduction", level:null, era:1, mode:"reps", unit:"reps", equipment:["bands"],
      cues:["Anchor a band low on a sturdy post, loop the other end around one ankle and stand sideways to the anchor, with the looped leg farther from it.", "Hold a wall or a chair for balance and stand tall on the other leg.", "Sweep the looped leg across in front of the standing leg against the band's pull.", "Return slowly. Finish one leg, then switch."],
      mistakes:["Leaning the torso away to get the leg across.", "Letting the band snap the leg back out."],
      readiness:"Move to a heavier band once the current one is easy on two different days.",
      injury:"Check the anchor and the band for nicks, and loop it so it can't slip off the ankle. Keep the sweep smooth and stop if the groin pulls." },

    acc_abductor_sidelying: { id:"acc_abductor_sidelying", pattern:"accessory", name:"Side-Lying Abduction", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Lie on your side with your hips stacked, the bottom knee bent for balance and the top leg straight in line with your torso.", "Lift the top leg toward the ceiling, leading with the heel and keeping the toes level or slightly down.", "Stop when your hips start to roll back.", "Lower slowly. Finish one side, then roll over."],
      mistakes:["Rolling the hips backward to swing the leg higher.", "Pointing the toes up so the front of the hip takes over."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Keep it smooth and small. If the outside of the hip pinches, shorten the range." },

    acc_abductor_sideplank: { id:"acc_abductor_sideplank", pattern:"accessory", name:"Side Plank Abduction", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Set up in a side plank on your forearm, with your body in one line and your feet stacked.", "Lift the top leg toward the ceiling without letting the hips drop or turn.", "Pause at the top, then lower the leg until the feet are stacked again.", "Finish one side, then switch."],
      mistakes:["Letting the hips sag as the leg lifts.", "Lifting the leg by tilting the torso."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"The shoulder under you holds your weight, so stay on the forearm, not the hand, and stop if it pinches. Rest the bottom knee on the floor if a full side plank is too much." },

    acc_abductor_bandwalk: { id:"acc_abductor_bandwalk", pattern:"accessory", name:"Banded Lateral Walk", level:null, era:1, mode:"reps", unit:"reps", equipment:["bands"],
      cues:["Loop a band around both legs just above the knees. Ankles are harder.", "Stand with your feet hip-width apart and your knees slightly bent, in a quarter squat.", "Step sideways with the leading foot, then follow with the other, keeping the band tight the whole time.", "Count each step as a rep, and walk out and back along a line."],
      mistakes:["Letting the knees fall in as you step.", "Standing up tall so the band goes slack."],
      readiness:"Move to a heavier band once the current one is easy on two different days.",
      injury:"Check the band for nicks and give yourself room to move. A band on the ankles loads the hips and knees more, so start above the knees." },

    acc_abductor_clamshell: { id:"acc_abductor_clamshell", pattern:"accessory", name:"Banded Clamshell", level:null, era:1, mode:"reps", unit:"reps", equipment:["bands"],
      cues:["Lie on your side with a band looped around both legs just above the knees, hips stacked and knees bent with the feet together.", "Keep your feet touching and lift the top knee as far as it goes without rolling the hips backward.", "Pause for a beat, then close slowly against the band.", "Finish one side, then roll over."],
      mistakes:["Rolling the pelvis back so the lower back does the lifting.", "Letting the knee drop quickly."],
      readiness:"Move to a heavier band once the current one is easy on two different days.",
      injury:"A small range with no rolling is the target. Use a lighter band if the hip pinches." },

    acc_antirot_knees: { id:"acc_antirot_knees", pattern:"accessory", name:"Side Plank from Knees", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Lie on your side with your knees bent behind you and your forearm on the floor, elbow directly under your shoulder.", "Lift your hips until your body makes a straight line from your knees to your head.", "Keep your top hip stacked over the bottom one, and breathe.", "Hold for the set's time, then lower. Repeat on the other side."],
      mistakes:["Letting the hips sag toward the floor.", "Rolling the chest toward the floor."],
      readiness:"Ready to move on when the hold is steady for the full time on both sides on two different days.",
      injury:"Keep the elbow right under the shoulder. If the shoulder pinches, put a folded towel under the forearm or end the set early." },

    acc_antirot_sideplank: { id:"acc_antirot_sideplank", pattern:"accessory", name:"Side Plank", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Lie on your side with your legs straight and stacked and your forearm on the floor, elbow under your shoulder.", "Lift your hips until your body is one straight line from your ears to your ankles.", "Keep the top hip stacked over the bottom one and your neck long.", "Hold for the set's time, then lower. Repeat on the other side."],
      mistakes:["Letting the hips sag toward the floor.", "Rolling the chest toward the floor."],
      readiness:"Ready to move on when the hold is steady for the full time on both sides on two different days.",
      injury:"Stay on the forearm, not the hand. If the shoulder pinches, go back to the knees version." },

    acc_antirot_leg: { id:"acc_antirot_leg", pattern:"accessory", name:"Side Plank, Top Leg Raised", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:["Get into a side plank on your forearm with your legs straight and stacked.", "Lift your hips into a straight line, then raise the top leg a little above the bottom one and keep it there.", "Keep the hips stacked and don't let the top leg drift forward or back.", "Hold for the set's time, then lower. Repeat on the other side."],
      mistakes:["Letting the hips sag as the leg lifts.", "Swinging the top leg forward so the hips twist."],
      readiness:"Ready to move on when the hold is steady for the full time on both sides on two different days.",
      injury:"If the shoulder pinches or the bottom hip aches, go back to a plain side plank. End the set early rather than twist." },

    acc_antirot_deadbug: { id:"acc_antirot_deadbug", pattern:"accessory", name:"Dead Bug", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Lie on your back with your arms pointing at the ceiling and your hips and knees bent to 90 degrees, shins parallel to the floor.", "Press your lower back gently into the floor and keep it there.", "Lower the opposite arm and leg slowly toward the floor without letting the lower back lift.", "Return to the start and switch sides. One rep is one arm and leg on each side."],
      mistakes:["Letting the lower back arch away from the floor as the limbs lower.", "Moving fast, which hides the arch."],
      readiness:"Add reps until every set reaches the top of the range on two different days.",
      injury:"Lower only as far as the back stays flat. If your neck tires, rest your head on a folded towel." },

    acc_antirot_pallof: { id:"acc_antirot_pallof", pattern:"accessory", name:"Pallof Press", level:null, era:1, mode:"reps", unit:"reps", equipment:["bands"],
      cues:["Anchor a band at chest height on a sturdy post and stand sideways to it, a step away, holding the band in both hands at your chest.", "Stand tall with your feet hip-width apart, knees soft and ribs down.", "Press your hands straight out in front of you without letting the band turn your body toward the anchor.", "Pause, bring the hands back in and finish one side before you switch."],
      mistakes:["Letting the shoulders rotate toward the anchor as the arms extend.", "Leaning away to counter the pull."],
      readiness:"Move to a heavier band once the current one is easy on two different days.",
      injury:"Check the anchor and the band for nicks. Step farther from the anchor for a harder pull, but not so far that you have to lean." },

    acc_antirot_suitcase: { id:"acc_antirot_suitcase", pattern:"accessory", name:"Suitcase Hold", level:null, era:2, mode:"hold", unit:"sec", equipment:["dumbbells", "kettlebells"],
      cues:["Stand tall with one dumbbell or kettlebell in one hand, held at your side like a suitcase.", "Keep your shoulders level and your ribs over your hips; don't lean toward or away from the weight.", "Hold for the set's time, breathing normally, with a firm grip.", "Put the weight down while you still control it, then repeat with the other hand."],
      mistakes:["Leaning away from the weight to make it lighter.", "Shrugging the loaded shoulder toward the ear."],
      readiness:"Add weight only when every set reaches the full time on both hands on two different days. If 2.5 kg is a big jump for this movement, list the weights you own in Settings.",
      injury:"Lift and lower the weight with a flat back and bent knees. A one-sided load tires the side of the trunk before the grip, so end the set when you start to lean." },

    acc_backext_birddog: { id:"acc_backext_birddog", pattern:"accessory", name:"Bird Dog", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Start on hands and knees with your hands under your shoulders and your knees under your hips, back flat.", "Reach one arm forward and the opposite leg straight back until both are level with your torso.", "Keep your hips and shoulders square to the floor, as if a glass of water sat on your lower back.", "Pause, return, and finish one side before you switch."],
      mistakes:["Lifting the leg higher than the torso, which arches the lower back.", "Letting the hips twist open as the leg rises."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Keep the back flat and the reach level. Put a folded towel under your knees, or rest on your fists, if they complain." },

    acc_backext_prone: { id:"acc_backext_prone", pattern:"accessory", name:"Prone Back Extension", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:["Lie face down with your legs straight and your toes on the floor, hands beside your head or crossed on your chest.", "Lift your chest a few centimetres off the floor by squeezing the muscles along your spine.", "Keep your gaze on the floor and your neck long.", "Pause at the top, then lower slowly."],
      mistakes:["Lifting the head high, which loads the neck instead of the back.", "Swinging up with momentum and arching hard at the top."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Lift only as high as stays smooth; a few centimetres is enough. Put a folded towel under your hips if the lower back pinches." },

    acc_backext_revhyper: { id:"acc_backext_revhyper", pattern:"accessory", name:"Reverse Hyperextension", level:null, era:1, mode:"reps", unit:"reps", equipment:["bench"],
      cues:["Lie face down across a bench with your hips at the edge and your legs hanging straight down. Hold the sides of the bench.", "Squeeze your glutes and lift your legs until they are level with your torso.", "Pause at the top without arching the lower back.", "Lower slowly until the legs hang again."],
      mistakes:["Swinging the legs up with momentum.", "Lifting well above the torso, which arches the lower back."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Make sure the bench can't slide or tip. Lift only to the level of your torso, and use a shorter range if the lower back pinches." },

    acc_backext_goodmorning: { id:"acc_backext_goodmorning", pattern:"accessory", name:"Dumbbell Good Morning", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
      cues:["Hold one dumbbell upright against your chest with both hands, feet shoulder-width apart and knees slightly bent.", "Push your hips back and let your torso tip forward with a flat back, until you feel the backs of your thighs stretch.", "Keep the dumbbell against your chest and your gaze a little ahead of your feet.", "Drive the hips forward to stand tall, squeezing your glutes at the top."],
      mistakes:["Rounding the back to reach lower.", "Bending the knees so much that it becomes a squat."],
      readiness:"Add weight only when every set reaches the top of the range on two different days.",
      injury:"Keep the dumbbell light until the movement is smooth, and stop the lowering before the back rounds." },

    /* ---- Yellow Dude, Group A: push, planche, handstand and dip (plans/PLAN-yellow-dude.md) ---- */
    push_alt_knee: { id:"push_alt_knee", pattern:"push", name:"Knee Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Kneel with your hands just wider than your shoulders, then walk your knees back until your body is one line from knees to head.",
        "Squeeze your glutes and brace your stomach so the hips stay in that line.",
        "Bend your elbows to lower your chest toward the floor, elbows about 45 degrees from your sides.",
        "Press the floor away until your arms are straight, without letting the hips pike up."
      ],
      mistakes:["Folding at the hips so the line from knees to head breaks.", "Dropping onto the knees at the bottom instead of lowering under control."],
      readiness:"A step between the incline push-up and the floor push-up — own the incline first, then move on once the body stays in one line for every rep.",
      injury:"Pad the knees with a mat or folded towel, and ease off if the wrists ache." },

    push_alt_kneeassist: { id:"push_alt_kneeassist", pattern:"push", name:"Knee-Assisted Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Start in a full plank on your toes, hands just wider than your shoulders.",
        "Lower your whole body in one line over about three seconds, until your chest nears the floor.",
        "Settle your knees onto the floor while your hands stay planted, then press up from the knees.",
        "Return to the toes plank and repeat — the lowering is the work, and the knees only help the press."
      ],
      mistakes:["Crashing down at the bottom instead of lowering under control.", "Shuffling the hands when the knees go down."],
      readiness:"Use it when knee push-ups are easy and you want the lowering of a full push-up before the full press.",
      injury:"A long lowering loads the elbows and wrists; stop if either turns sharp." },

    push_alt_partial: { id:"push_alt_partial", pattern:"push", name:"Partial-Range Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Set up in a plank with a visible depth marker under your chest, such as a folded towel or a book.",
        "Lower until your chest touches the marker, keeping the body in one rigid line.",
        "Press back up to straight arms, using the same depth on every rep.",
        "Make the range a little deeper only once the current depth feels easy."
      ],
      mistakes:["Changing depth from rep to rep, so no two reps compare.", "Bouncing off the marker instead of touching it and pressing."],
      readiness:"Use it to build toward a full push-up when the full range isn't there yet — deepen the range before adding reps.",
      injury:"Stay inside a range that feels strong at the shoulders and elbows; the range should grow, never be forced." },

    push_alt_staggered: { id:"push_alt_staggered", pattern:"push", name:"Staggered-Hand Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Set one hand under your chest and the other a hand's length ahead, so the two sides share the load unevenly.",
        "Keep your hips and shoulders level and facing the floor, without twisting toward the forward hand.",
        "Lower your chest between the hands, then press up evenly.",
        "Do the same number of reps with each hand forward."
      ],
      mistakes:["Setting the hands so far apart that the body twists.", "Doing all the reps with a favourite hand forward."],
      readiness:"A bridge toward one-arm work — use it once standard push-ups are solid and you want one arm to do more.",
      injury:"The forward-loaded shoulder takes more strain; shorten the stagger if it pinches." },

    push_alt_onearmassist: { id:"push_alt_onearmassist", pattern:"push", name:"Assisted One-Arm Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Take a wide foot stance and put your working hand under your chest, with the other hand resting on a low support beside your torso.",
        "Keep your hips and shoulders square — the free side should not turn you open.",
        "Lower under control on the working arm, using the helper hand only as a light prop.",
        "Press up through the working arm and let the helper hand do less as you get stronger."
      ],
      mistakes:["Pressing mostly through the helper hand so the working arm does little.", "Twisting the torso open to get up."],
      readiness:"A step toward the one-arm push-up — use it after staggered push-ups feel strong, and reduce the help gradually.",
      injury:"A heavy single-shoulder load; keep the helper hand on its support until the working arm controls the whole lowering." },

    push_alt_pseudoweighted: { id:"push_alt_pseudoweighted", pattern:"push", name:"Weighted Pseudo Planche Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["vest"],
      cues:[
        "Wear a snug vest, or a packed backpack worn high on the back, so the load sits close to your torso.",
        "Set your hands beside your hips with the fingers turned out, and lean your shoulders well ahead of them — the same lean as your unweighted pseudo planche push-up.",
        "Lower with the elbows tight to your ribs, then press up while holding that lean.",
        "Fix the lean first and add load in small steps, changing one thing at a time."
      ],
      mistakes:["Adding lean and load in the same session.", "Arching the lower back to push up."],
      readiness:"Only once the unweighted pseudo planche push-up is controlled on every rep — then add the smallest load you can.",
      injury:"High load on the wrists, elbows and the front of the shoulder; stop on any sharp pain." },

    push_alt_parallette: { id:"push_alt_parallette", pattern:"push", name:"Parallette Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["parallettes"],
      cues:[
        "Set the parallettes shoulder-width apart on level, non-slip ground and grip the handles with your wrists straight.",
        "Brace in a plank and lower between the handles, elbows about 45 degrees from your sides.",
        "Stop where your shoulders still feel in control, then press up without letting the handles rock.",
        "Grip firmly, but don't clamp so hard that the shoulders shrug up."
      ],
      mistakes:["Setting up on handles that wobble or sit unevenly.", "Going deeper than your shoulders control just because the handles allow it."],
      readiness:"A variation that is as much about the wrists as the chest — fine once standard push-ups are comfortable.",
      injury:"The handles keep the wrists straight, but the extra depth stretches the front of the shoulder; stay inside your range." },

    push_alt_slider: { id:"push_alt_slider", pattern:"push", name:"Towel Squeeze Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "On a smooth floor, set a towel or slider under each hand and take a push-up plank.",
        "Lower your chest while keeping the hands from sliding apart — think of drawing them toward each other.",
        "Press back up and let the hands return to shoulder width under control.",
        "Keep the body straight and the ribs from sagging."
      ],
      mistakes:["Letting the hands slide out and the chest collapse.", "Using a floor so slick or so grippy that the two sides don't slide evenly."],
      readiness:"An advanced chest variation — use it when floor push-ups are controlled and you want the chest squeezing inward.",
      injury:"A sudden slide can wrench the shoulder; keep the slide short and controlled." },

    push_alt_ringcross: { id:"push_alt_ringcross", pattern:"push", name:"Ring Crossover Press", level:null, era:1, mode:"reps", unit:"reps", equipment:["rings"],
      cues:[
        "Set the rings at equal height and take a ring push-up plank, with most of your weight still on your feet.",
        "Lower with control, then press up and reach one ring across your body toward the other side, only as far as you can keep it steady.",
        "Bring it back and cross the other side next, with both rings controlled the whole time.",
        "Keep the hips square — the reach comes from the shoulder, not from twisting the body."
      ],
      mistakes:["Letting the rings fly apart or swing as you cross.", "Twisting the hips to make the reach."],
      readiness:"Advanced — start from a steady ring push-up with no crossover, keeping your feet carrying most of the load.",
      injury:"Unstable rings load the shoulders from awkward angles; keep the crossing small." },

    push_alt_fingertip: { id:"push_alt_fingertip", pattern:"push", name:"Fingertip Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Start against a wall or a high support with your fingers spread and the weight on the finger pads.",
        "Spread your load across all your fingers, not just the thumbs and index fingers.",
        "Lower with control, keeping the fingers from collapsing flat, and press back up.",
        "Move to a lower surface only when the finger joints feel comfortable at the current one."
      ],
      mistakes:["Letting the finger joints cave in at the bottom.", "Jumping straight to the floor with your full bodyweight."],
      readiness:"Expert grip work — it asks a lot of the finger joints and tendons, so lower the surface slowly over weeks.",
      injury:"Stop if the finger joints or tendons ache; they adapt more slowly than muscle." },

    skill_planche_band: { id:"skill_planche_band", pattern:"skill", name:"Band-Assisted Planche Lean", level:null, era:1, mode:"hold", unit:"sec", equipment:["bands"],
      cues:[
        "Secure an intact band to a solid anchor so it takes part of your weight as you lean.",
        "Take a straight-arm plank on the floor or on parallettes, with the band supporting you.",
        "Lean your shoulders forward past your hands, elbows locked, pushing the floor away.",
        "Lean only as far as you can hold with the elbows straight, and put your feet down before the band slackens."
      ],
      mistakes:["Bending the elbows to reach a deeper lean.", "Letting the band recoil suddenly when you come out."],
      readiness:"Use it when the plank feels easy and you want a deeper lean than the floor allows.",
      injury:"Heavy wrist loading — build the lean a little at a time, and check the band for wear before every session." },

    skill_planche_boxtuck: { id:"skill_planche_boxtuck", pattern:"skill", name:"Box-Supported Tuck Planche", level:null, era:1, mode:"hold", unit:"sec", equipment:["parallettes", "box"],
      cues:[
        "Set the parallettes in front of a sturdy box so your feet can rest on it behind you.",
        "Support yourself on straight arms with your hands fixed, and let the feet rest lightly on the box.",
        "Lean forward and tuck your knees toward your chest, taking as little weight on the box as you can.",
        "Keep the elbows locked and push the floor away."
      ],
      mistakes:["Pushing hard off the box with the feet so the arms do little.", "Using a box that slides or tips."],
      readiness:"A bridge to the free tuck planche — use it when the lean is steady and you want to feel the tuck with some help.",
      injury:"Check that the box and parallettes are stable, and stop on wrist or elbow pain." },

    skill_planche_boxpushup: { id:"skill_planche_boxpushup", pattern:"skill", name:"Box-Supported Straddle Planche Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["parallettes", "box"],
      cues:[
        "Set the parallettes in front of a stable box and rest your feet lightly on it in a straddle.",
        "Lean forward over your hands with the elbows straight and take most of the weight on your arms.",
        "Bend the elbows to a depth you can reverse, then press back up.",
        "Reduce the box support before you increase the depth."
      ],
      mistakes:["Letting the box slide, or pushing off it with the feet.", "Elbows flaring or collapsing during the descent."],
      readiness:"Expert — only after a steady straddle planche support and a controlled bent-arm descent in easier versions.",
      injury:"Very high wrist, elbow and shoulder load; stop on any sharp pain, and never train it tired." },

    skill_planche_pushup: { id:"skill_planche_pushup", pattern:"skill", name:"Planche Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "From a full planche, with your body parallel to the floor and your shoulders well ahead of your hands, bend the elbows.",
        "Lower in one rigid line, without letting the hips rise to make the press easier.",
        "Reverse the descent without kicking or dropping into the bottom.",
        "Press back to a straight-arm planche."
      ],
      mistakes:["Dropping into the bottom instead of lowering under control.", "Hips rising to ease the press."],
      readiness:"Expert — only after a stable full planche and controlled pseudo planche push-ups; coaching is advised.",
      injury:"Elite load on the wrists, elbows and shoulders; never train it cold or fatigued." },

    shoulder_alt_pikeneg: { id:"shoulder_alt_pikeneg", pattern:"shoulder", name:"Negative Pike Push-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Set up in a pike with your hips high and your hands on the floor shoulder-width apart, head between your arms.",
        "Bend the elbows and lower your head slowly toward the floor over about four seconds.",
        "Keep the floor ahead of your hands clear for your head, and stop before you lose control.",
        "Reset to the top by pressing up or walking your feet back, and repeat the slow lowering."
      ],
      mistakes:["Dropping onto the head instead of lowering under control.", "Elbows flaring and the shoulders losing position."],
      readiness:"A bridge to the pike push-up — start with a shallow range and deepen it as control improves.",
      injury:"Keep the landing area clear and the range shallow at first; stop if your neck or wrists complain." },

    skill_handstand_pike: { id:"skill_handstand_pike", pattern:"skill", name:"Pike Hold", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:[
        "Set your hands shoulder-width apart and walk your feet in until your hips are high and your body makes an upside-down V.",
        "Press your hands into the floor and push your shoulders tall, away from your ears.",
        "Stack your hips toward being over your shoulders, without forcing the back to round.",
        "Breathe steadily and keep the chest from sagging."
      ],
      mistakes:["Shrugging into the neck.", "Letting the trunk sag so the hips drop."],
      readiness:"The first rung toward a handstand — hold a steady, shoulder-stacked pike before putting your feet up on something.",
      injury:"Heavy on the wrists; shift the weight back toward your feet if they complain." },

    skill_handstand_pikeelev: { id:"skill_handstand_pikeelev", pattern:"skill", name:"Feet-Elevated Pike Hold", level:null, era:1, mode:"hold", unit:"sec", equipment:["bench"],
      cues:[
        "Put your feet on a stable low platform such as a bench, with your hands on the floor so your hips rise above your shoulders.",
        "Press through your hands and push your shoulders tall, hips stacked over them.",
        "Keep the feet planted on the platform and the platform steady.",
        "Hold the position without letting the shoulders collapse."
      ],
      mistakes:["A platform that shifts under your feet.", "Collapsing through the shoulders as the load builds."],
      readiness:"Move on from the floor pike hold when it is steady and you want more load — the wall walk comes next.",
      injury:"More weight on the wrists and shoulders than the floor pike; come down if either feels unstable." },

    skill_handstand_wallwalk: { id:"skill_handstand_wallwalk", pattern:"skill", name:"Wall Walk", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Start in a plank on the floor with your feet at the base of a wall.",
        "Walk your feet up the wall while your hands walk toward it, in small steps.",
        "Keep your arms straight and your core braced, stopping where you still feel in control.",
        "Walk back down the same way, knowing which side you'd step out to."
      ],
      mistakes:["Walking too close to the wall before you're ready.", "Holding your breath on the way up."],
      readiness:"Use it once a strong plank and the elevated pike hold are steady — it leads toward the chest-to-wall handstand.",
      injury:"The walk back down loads the wrists and shoulders heavily; stay in a range you can reverse." },

    skill_handstand_cartwheel: { id:"skill_handstand_cartwheel", pattern:"skill", name:"Cartwheel Exit Drill", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Practise on open floor with a clear lane to one side, starting at low height.",
        "From a low or wall-supported handstand position, turn your body sideways toward the open space.",
        "Place one foot down at a time and come out like a cartwheel.",
        "Never aim to roll into a wall — the exit goes sideways."
      ],
      mistakes:["Trying to roll toward the wall.", "Crossing the legs without turning the body."],
      readiness:"Learn the exit before you balance away from the wall — low height and open floor first.",
      injury:"Keep the floor clear of objects, and use a non-slip floor or a mat that doesn't slide." },

    skill_handstand_toetap: { id:"skill_handstand_toetap", pattern:"skill", name:"Split-Leg Wall Toe Tap", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Hold a stable chest-to-wall handstand with your toes against the wall.",
        "Lift one toe lightly off the wall while your shoulders stay stacked over your hands.",
        "Tap it back and switch sides.",
        "Keep the hips square and don't kick away from the wall."
      ],
      mistakes:["Kicking away from the wall.", "Twisting the pelvis as the leg lifts."],
      readiness:"The step between the chest-to-wall hold and a split-leg hold — start only when the wall hold is steady and a small release is controlled.",
      injury:"Know a safe exit first, and step down if the wrists tire." },

    skill_handstand_split: { id:"skill_handstand_split", pattern:"skill", name:"Split-Leg Handstand Hold", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:[
        "Go up to a handstand with one leg near the wall for control and the other held forward.",
        "Keep your shoulders tall and push the floor away.",
        "Hold the legs in a gentle split rather than scissoring them.",
        "Plan your exit before you go, and look at the floor between your hands."
      ],
      mistakes:["Scissoring the legs wildly.", "Looking far ahead of your hands."],
      readiness:"A partial free balance — start only once the wall handstand is steady and you have a safe exit.",
      injury:"Practise on a non-slip surface with clear space to the side." },

    skill_handstand_parallette: { id:"skill_handstand_parallette", pattern:"skill", name:"Parallette Handstand", level:null, era:1, mode:"hold", unit:"sec", equipment:["parallettes"],
      cues:[
        "Set the parallettes on non-slip ground with plenty of space on both sides.",
        "Grip the handles evenly and go up to a handstand with your shoulders stacked over them.",
        "Keep the handles still and balance through your fingers and grip.",
        "Don't grip so hard that your shoulders collapse."
      ],
      mistakes:["Handles rocking from an uneven setup.", "Over-gripping while the shoulder line collapses."],
      readiness:"Expert — only after a steady freestanding handstand on the floor and a safe exit from raised handles.",
      injury:"A fall from raised handles is higher; choose a stable floor and know your exit." },

    skill_handstand_bentarm: { id:"skill_handstand_bentarm", pattern:"skill", name:"Bent-Arm Handstand Hold", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:[
        "Go up to a stable handstand on a padded surface, with a wall or a spotter available.",
        "Bend your elbows slowly through a controlled range, keeping your head clear of the floor.",
        "Keep your shoulders active and push the floor away rather than sinking into it.",
        "Press back up before you tire."
      ],
      mistakes:["Dropping onto the head.", "Elbows flaring out of control."],
      readiness:"Advanced — start from a strong handstand and controlled pike push-ups, and train with a coach where you can.",
      injury:"The head and neck are at risk if control goes; train on a padded surface and keep the range small." },

    skill_handstand_onearm: { id:"skill_handstand_onearm", pattern:"skill", name:"One-Arm Handstand", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:[
        "From a steady freestanding handstand, shift your weight gradually over the supporting hand.",
        "Keep the free shoulder up and don't let it drop.",
        "Know your cartwheel exit before you go.",
        "Work with a coach or a spotter where you can."
      ],
      mistakes:["Dropping the free shoulder.", "Twisting out of control."],
      readiness:"The far end of the handstand path, with no fixed standard — individual practice only.",
      injury:"Very high single-wrist and shoulder load; keep sessions short and always know the exit." },

    dip_alt_negative: { id:"dip_alt_negative", pattern:"dip", name:"Dip Negative", level:null, era:1, mode:"reps", unit:"reps", equipment:["dipBars", "lowBar"],
      cues:[
        "Start in a straight-arm support on dip bars or a straight bar, stepping or jumping up to get there.",
        "Lower yourself slowly over about four seconds, to a depth you can control.",
        "Keep your shoulders from shrugging and your elbows pointing back.",
        "Step down or reset on a step rather than dropping."
      ],
      mistakes:["Jumping into an unstable support.", "Losing control and dropping at the bottom."],
      readiness:"Use it when dips are close but you can't yet press back up — build the slow lowering first.",
      injury:"The bottom of a dip stretches the front of the shoulder; stay above the depth where it pinches." },

    dip_alt_support: { id:"dip_alt_support", pattern:"dip", name:"Parallel Bar Support Hold", level:null, era:1, mode:"hold", unit:"sec", equipment:["dipBars"],
      cues:[
        "Take a straight-arm support on parallel bars with your hands beside your hips, feet off the floor or lightly on it.",
        "Press down into the bars so your shoulders stay away from your ears.",
        "Lock your elbows without collapsing into them, and keep your body still.",
        "Use bars low enough that you can step down safely."
      ],
      mistakes:["Shrugging up into your ears.", "Hanging on the joints at the end of their range."],
      readiness:"The first rung for the arms in dips — hold steady before lowering into them.",
      injury:"The wrists take the load; stop if they or the shoulders ache." },

    dip_alt_ringsupport: { id:"dip_alt_ringsupport", pattern:"dip", name:"Ring Support Hold", level:null, era:1, mode:"hold", unit:"sec", equipment:["rings"],
      cues:[
        "Set the rings at equal height, with safe access to the floor or a step.",
        "Take a straight-arm support with your hands beside your hips and the rings close to your body.",
        "Press down and keep the rings from drifting apart or rotating.",
        "Don't force your hands outward — let them turn out only as far as is comfortable."
      ],
      mistakes:["Letting the rings drift apart.", "Forcing the hands to turn out."],
      readiness:"A harder support than bars because the rings move — hold bars steadily first.",
      injury:"Unstable rings load the shoulders and elbows from awkward angles; step down if control goes." },

    /* ---- Yellow Dude, Group B: rows, front-lever steps, pull-up variants, muscle-up and back lever (plans/PLAN-yellow-dude.md) ---- */

    pull_alt_australianfe: { id:"pull_alt_australianfe", pattern:"pull", name:"Feet-Elevated Inverted Row", level:null, era:1, mode:"reps", unit:"reps", equipment:["lowBar", "rings", "bench"],
      cues:[
        "Set a bar or rings at about hip height and rest your heels on a bench or other platform that can't slide.",
        "Take the bar overhand at shoulder width and brace until your body is one line from heels to head.",
        "Pull your chest to the bar by driving the elbows back, without letting the hips fold.",
        "Lower to straight arms under control, and keep the feet planted on the platform."
      ],
      mistakes:["Folding at the hips so the body line breaks.", "Feet sliding off the platform as you pull."],
      readiness:"A harder row than the floor-footed one — own a strict inverted row first, then raise the feet.",
      injury:"Back and shoulder strain rise with the height of the feet; use a lower platform if the lower back or shoulder complains." },

    pull_alt_archerrow: { id:"pull_alt_archerrow", pattern:"pull", name:"Archer Row", level:null, era:1, mode:"reps", unit:"reps", equipment:["lowBar", "rings"],
      cues:[
        "Set up for an inverted row on a low bar or rings, with room to move sideways.",
        "Shift your weight toward one hand as you pull and let the other arm straighten out to the side as a helper.",
        "Keep your hips square and your body in one line, with the working elbow driving back.",
        "Lower under control, return to centre, and do the same number of reps to each side."
      ],
      mistakes:["Twisting the hips toward the working side.", "Yanking through the working elbow instead of pulling smoothly."],
      readiness:"Own the inverted row first, then practise shifting your weight toward one hand before you let the other arm straighten.",
      injury:"One arm takes most of your weight; stop on sharp shoulder or elbow pain, and keep the helper arm bent if you need more help." },

    pull_alt_tableweighted: { id:"pull_alt_tableweighted", pattern:"pull", name:"Weighted Table Row", level:null, era:2, mode:"reps", unit:"reps", equipment:["vest"],
      cues:[
        "Use a heavy, stable table, and fix a vest or a packed backpack high on your back so it can't slide.",
        "Lie under the table edge, grip it at shoulder width and hold your body straight from heels to head.",
        "Pull your chest to the table edge, driving the elbows back.",
        "Lower to straight arms with the load still, and stop if the table shifts."
      ],
      mistakes:["The bag sliding toward your neck or hips.", "A table that creeps across the floor while you pull."],
      readiness:"Add load only once the unweighted table row with a straight body is smooth on every rep, and then add the smallest step.",
      injury:"The table has to hold your body plus the load; check it before every set and stop if it moves." },

    pull_alt_bandrow: { id:"pull_alt_bandrow", pattern:"pull", name:"Band Bent-Over Row", level:null, era:1, mode:"reps", unit:"reps", equipment:["bands"],
      cues:[
        "Stand on the middle of an intact band with both feet and take an end in each hand.",
        "Hinge at the hips until your torso leans forward, with a flat back and soft knees.",
        "Pull your hands toward your ribs, driving the elbows back, while your torso stays still.",
        "Lower slowly until your arms are straight and the band is still taut."
      ],
      mistakes:["Rounding the back to get the band moving.", "The band slipping out from under the feet — reset before the next rep."],
      readiness:"Pick a band that lets the torso stay still for every rep; step to a stronger band at the same range, not a longer pull.",
      injury:"Check the band for nicks before each session, and stop if the lower back aches from the forward lean." },

    skill_frontlever_band: { id:"skill_frontlever_band", pattern:"skill", name:"Band-Assisted Front Lever", level:null, era:1, mode:"hold", unit:"sec", equipment:["pullupBar", "bands"],
      cues:[
        "Fix an intact band to the bar or an anchor so it can take your weight at the waist, and check both before you hang.",
        "Hang with straight arms, pull your shoulder blades down, and lift your body toward horizontal with the band under your hips.",
        "Lengthen your body past a tuck, only as far as you can keep the elbows straight.",
        "Hold a level body, then lower out before the line breaks."
      ],
      mistakes:["Bending the elbows to pull into position.", "Bouncing off the band instead of holding the position."],
      readiness:"Hold a tuck front lever with straight arms first — the band is there to let you try a longer lever, not to cover a bent-arm pull.",
      injury:"A taut band can slide or fail; inspect it and the anchor before every set, and keep the landing area clear." },

    skill_frontlever_negative: { id:"skill_frontlever_negative", pattern:"skill", name:"Front Lever Negative", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar", "rings"],
      cues:[
        "Start from a secure inverted position under a rated bar or rings, with your body above the bar and in line with it.",
        "Lower toward horizontal slowly, keeping the arms straight and the shoulder blades pulled down.",
        "Stop where the line would break, then return to a hang and reset.",
        "Use a shorter lever, such as a tuck, if you can't control the whole descent."
      ],
      mistakes:["Dropping through the hardest part of the range instead of controlling it.", "Arching the lower back to slow the fall."],
      readiness:"Use it when you can hold a front lever progression and want to build toward a longer lever by lowering slowly.",
      injury:"Straight-arm lowering is hard on the shoulders and elbow tendons; stop on pain, and don't try a lever longer than you can control." },

    skill_frontlever_oneleg: { id:"skill_frontlever_oneleg", pattern:"skill", name:"One-Leg Front Lever", level:null, era:1, mode:"hold", unit:"sec", equipment:["pullupBar", "rings"],
      cues:[
        "Take an advanced tuck front lever with straight arms and level hips.",
        "Extend one leg straight out while the other stays tucked, without letting the hips twist.",
        "Hold the line, then tuck again and swap the leg that extends.",
        "Keep your shoulder blades down and your body horizontal."
      ],
      mistakes:["Twisting the hips as the leg goes out.", "The extended leg dropping below the line of the body."],
      readiness:"A bridge between the advanced tuck and the straddle — own the advanced tuck, with slow one-leg extensions, before you hold this.",
      injury:"Each extension makes the lever longer; stop on shoulder, elbow or wrist pain, and go back to a shorter lever." },

    skill_frontlever_raise: { id:"skill_frontlever_raise", pattern:"skill", name:"Front Lever Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar", "rings"],
      cues:[
        "Start from an active hang with your shoulder blades pulled down, under a rated bar or rings.",
        "Lift your body toward horizontal in a tuck or advanced tuck, with straight arms and no kick.",
        "Pause with a level body, then lower back to the hang with control.",
        "Keep the arms straight, and don't swing into the first rep."
      ],
      mistakes:["Swinging into the raise to get started.", "Bending the elbows to help the lift."],
      readiness:"Dynamic work for the lever — use it once you can hold a tuck or advanced tuck for the skill standard.",
      injury:"Stop when the shoulders shrug up or the elbows start to bend; a shorter lever beats a ragged one." },

    pull_alt_ringassist: { id:"pull_alt_ringassist", pattern:"pull", name:"Feet-Assisted Ring Pull-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["rings"],
      cues:[
        "Hang the rings low enough that your feet can rest on the floor or a firm support, and hold them with a steady grip.",
        "Pull yourself up with the feet taking only as much weight as you need, keeping the rings level and quiet.",
        "Lower to straight arms in control, with the same amount of help on every rep.",
        "Use less foot help as you get stronger, rather than adding reps."
      ],
      mistakes:["Changing how much the feet help from rep to rep.", "Letting the rings twist or drift apart."],
      readiness:"A bridge between scapular pulls and full pull-ups — use it to practise the pulling path with some help.",
      injury:"Rings load the wrists and shoulders from changing angles; stop on pain, and check the straps and anchor before you start." },

    pull_alt_neutral: { id:"pull_alt_neutral", pattern:"pull", name:"Neutral-Grip Pull-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar", "rings"],
      cues:[
        "Take parallel handles, or rings held at the same height, with your palms facing each other.",
        "Start from a straight-arm hang with your shoulder blades pulled down.",
        "Pull until your chin passes the handles, keeping your palms facing and your body still.",
        "Lower under control to straight arms."
      ],
      mistakes:["Swinging to get over the handles.", "Letting the grip slip as you tire."],
      readiness:"A grip change, not a harder step — fine once you have a strict pull-up and want a friendlier angle at the shoulder and wrist.",
      injury:"Stop on elbow, shoulder or wrist pain; a neutral grip is often more comfortable, but it isn't automatically pain-free." },

    pull_alt_wide: { id:"pull_alt_wide", pattern:"pull", name:"Wide-Grip Pull-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
      cues:[
        "Take the bar wider than your shoulders, but only as wide as your shoulders tolerate.",
        "Hang from straight arms with your shoulder blades pulled down.",
        "Pull until your chin clears the bar, with the elbows driving down and out.",
        "Lower slowly to a full hang."
      ],
      mistakes:["Going wider than the shoulders tolerate.", "Cutting the range short at the top or the bottom."],
      readiness:"Strict pull-ups first — the wide grip makes the same pull harder, so choose a width you can repeat.",
      injury:"A wide grip stresses the shoulders more; narrow it at the first pinch." },

    pull_alt_close: { id:"pull_alt_close", pattern:"pull", name:"Close-Grip Pull-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
      cues:[
        "Take the bar with your hands closer than shoulder width, at a spacing where the wrists stay straight.",
        "Hang with straight arms and your shoulder blades pulled down.",
        "Pull your chin over the bar with the trunk steady and the elbows close to your body.",
        "Lower to a full hang under control."
      ],
      mistakes:["Forcing the wrists inward to get the hands close.", "Swinging to start the first rep."],
      readiness:"Strict pull-ups first — the narrow grip puts more work on the arms, so pick a spacing the wrists accept.",
      injury:"Stop on wrist or elbow pain, and widen the grip a little if the wrists complain." },

    pull_alt_hollow: { id:"pull_alt_hollow", pattern:"pull", name:"Hollow-Body Pull-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
      cues:[
        "Hang from the bar and set a hollow shape: ribs down, glutes squeezed, legs together and slightly forward.",
        "Pull with the whole body moving as one unit and the hollow shape intact.",
        "Bring your chin over the bar without kicking.",
        "Lower to a full hang and reset the hollow before the next rep."
      ],
      mistakes:["Kicking the legs to get up.", "Losing the ribs-down position and arching."],
      readiness:"A pull-up with the trunk held in a fixed shape — you need a strict pull-up and a steady hollow hold before you combine them.",
      injury:"Stop on shoulder or elbow pain; if the hollow shape tires you before the pull does, practise each on its own." },

    pull_alt_arched: { id:"pull_alt_arched", pattern:"pull", name:"Arched-Back Pull-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
      cues:[
        "Hang from the bar with a firm grip and your shoulder blades pulled down.",
        "Pull while letting the upper back extend a little, leading with your chest toward the bar.",
        "Aim your chest at the bar rather than your chin, with the elbows driving down and back.",
        "Lower in control to a full hang."
      ],
      mistakes:["Arching from the lower back instead of the upper back.", "Jerking the shoulders back to gain height."],
      readiness:"A way to pull higher, ahead of the chest-to-bar pull-up — use it after strict pull-ups, with the extension coming from the upper back.",
      injury:"Too much arch loads the lower back; stop if the lower back is doing the work." },

    pull_alt_towelgrip: { id:"pull_alt_towelgrip", pattern:"pull", name:"Towel-Grip Pull-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
      cues:[
        "Drape two strong towels of equal length over a fixed bar and take one in each fist.",
        "Pull your shoulder blades down and keep the towels hanging evenly.",
        "Pull until your hands are near your chest, without swinging.",
        "Lower before your grip fades, and step down rather than letting go."
      ],
      mistakes:["The towels slipping through the fists.", "Hanging on after the grip has gone."],
      readiness:"A grip challenge on top of a strict pull-up — use it once towel hangs and pull-ups are both comfortable.",
      injury:"The grip demand loads the elbows; stop on elbow pain, and check the towels aren't frayed." },

    pull_alt_c2b: { id:"pull_alt_c2b", pattern:"pull", name:"Chest-to-Bar Pull-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
      cues:[
        "Hang from a bar high enough that your chest and head clear it, with a firm grip.",
        "Pull your chest, not your chin, toward the bar, driving the elbows down and back.",
        "Touch or come close to the bar with your chest each rep, without craning the neck.",
        "Lower in control to a full hang, and keep each rep strict rather than kipping."
      ],
      mistakes:["Craning the neck up toward the bar.", "Letting the body swing into a kip."],
      readiness:"A higher pull for people with strict pull-ups — you should be able to get your chin over the bar with control and lower slowly first.",
      injury:"The higher pull loads the shoulders more; stop on pain, and make sure the bar structure doesn't block your chest or head." },

    pull_alt_onearm: { id:"pull_alt_onearm", pattern:"pull", name:"One-Arm Pull-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
      cues:[
        "Set up a step and a form of help you can reduce over time — the free hand on the bar, a band, or a hand on your wrist.",
        "Hang from the working arm with that shoulder blade pulled down and your body from twisting.",
        "Pull until your chin passes the bar, limiting how much your trunk rotates.",
        "Lower slowly under control, and reduce the help as you get stronger."
      ],
      mistakes:["Dropping onto the working elbow at the bottom.", "Jerking out of the hang to start the pull."],
      readiness:"Expert work — it follows a long build of archer pull-ups and slow one-arm lowering, and it isn't a step to rush.",
      injury:"The working elbow and shoulder take your whole bodyweight; stop on pain, and keep the help until you can control the lowering." },

    pull_alt_weighted: { id:"pull_alt_weighted", pattern:"pull", name:"Weighted Pull-up", level:null, era:2, mode:"reps", unit:"reps", equipment:["pullupBar", "dumbbells", "kettlebells", "vest"],
      cues:[
        "Wear a snug vest or belt so the load is fixed and can't swing.",
        "Hang from straight arms and pull your shoulder blades down before you pull.",
        "Pull until your chin passes the bar, then lower fully, keeping the same range you use without load.",
        "Add load in small steps, and end the set before the range shrinks."
      ],
      mistakes:["Letting the weight swing under you.", "Shortening the range as the load goes up."],
      readiness:"Strict pull-ups at full range come first — add load only once the plain version is clean on every rep.",
      injury:"The bar has to hold your weight plus the load; stop on elbow or shoulder pain." },

    skill_muscleup_explosive: { id:"skill_muscleup_explosive", pattern:"skill", name:"High Pull-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
      cues:[
        "Hang from a high bar with clear space above and in front of it, so you can pull past it.",
        "Pull fast from a straight-arm hang while you're fresh, aiming to bring your lower chest toward the bar.",
        "Lower under control instead of dropping.",
        "End the set when the pull slows or the swing starts."
      ],
      mistakes:["Repeating high pulls while tired, so the speed fades.", "Letting the body swing out of control."],
      readiness:"Strict pull-ups first — this is speed work, so it goes early in a session, in short sets.",
      injury:"Fast pulling loads the elbows and shoulders; stop on pain, and don't chase height once the pull slows." },

    skill_muscleup_turnover: { id:"skill_muscleup_turnover", pattern:"skill", name:"Bar Turnover Drill", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
      cues:[
        "Use a bar you can reach with your feet on the floor or a step, so the drill is partly assisted.",
        "From a deep pull, bring your chest over the bar slowly and let your wrists rotate over it.",
        "Settle in a supported position at the top, with your chest over the bar and your arms straight.",
        "Move through the turnover at a speed you control, not as a jump."
      ],
      mistakes:["Slamming the wrists over the bar.", "Jumping through a range you aren't ready for."],
      readiness:"Needs a strong high pull and a stable straight-bar dip — practise the turnover with help before doing it free.",
      injury:"The wrists, elbows and shoulders are loaded as you rotate over the bar; stop on pain, or when the turn gets out of control." },

    skill_muscleup_band: { id:"skill_muscleup_band", pattern:"skill", name:"Band-Assisted Muscle-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar", "bands"],
      cues:[
        "Fix an intact band so it supports you through the turnover, and check it before you hang.",
        "Pull high, bring your chest over the bar, and press into support.",
        "Make the pull and the turnover one smooth movement rather than two jerks.",
        "Lower down in control, and let the band assist but never do the turnover for you."
      ],
      mistakes:["The band's rebound doing the transition for you.", "One shoulder turning over before the other."],
      readiness:"Needs a strong high pull and a bar dip — a lighter band over time is the progression, not more reps.",
      injury:"Check the band for wear before every set; stop on wrist, elbow or shoulder pain." },

    skill_muscleup_full: { id:"skill_muscleup_full", pattern:"skill", name:"Muscle-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
      cues:[
        "Use a fixed, bodyweight-rated high bar with plenty of room above it and a safe landing below.",
        "Pull high and fast, leading with your chest toward the bar.",
        "Turn over smoothly and press to a straight-arm support on the bar.",
        "Lower with control and reset between reps, rather than kipping."
      ],
      mistakes:["A chicken-wing turnover, with one arm trailing.", "Kipping to get through the sticking point."],
      readiness:"Expert work — you need a high pull to the lower chest, a controlled turnover and a straight-bar dip before the full movement.",
      injury:"The shoulders, elbows and wrists take heavy load; stop on pain, and step down from the bar if you lose control at the top." },

    skill_backlever_skinthecat: { id:"skill_backlever_skinthecat", pattern:"skill", name:"Skin the Cat", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar", "rings"],
      cues:[
        "Hang from a rated bar or rings over a padded landing, with a spotter for the first attempts.",
        "Tuck your knees and rotate backward slowly, letting your legs pass between your arms.",
        "Go only as far as your shoulders allow comfortably, then come back the same way.",
        "Keep the movement slow enough that you can stop at any point."
      ],
      mistakes:["Dropping into the stretch at the bottom.", "Twisting while you're upside down."],
      readiness:"Practise a passive hang and gentle shoulder mobility first — the shoulders need to be comfortable in a deep stretch, and you need a way back.",
      injury:"Forcing the shoulders into extension is the main risk; use a smaller range, and stop on shoulder, elbow or neck pain." },

    skill_backlever_1: { id:"skill_backlever_1", pattern:"skill", name:"Tuck Back Lever", level:null, era:1, mode:"hold", unit:"sec", equipment:["pullupBar", "rings"],
      cues:[
        "Get into a tucked, inverted position under a rated bar or rings, with a padded landing below.",
        "Rotate until your body faces the floor, with your hips level with your shoulders and your knees tucked.",
        "Keep your elbows straight and your shoulders from sinking.",
        "Hold, then come down or reverse out with control."
      ],
      mistakes:["Over-extending the shoulders into the stretch.", "Letting the hips drop below the shoulders."],
      readiness:"Be comfortable with skin the cat, including a controlled way back out — the tuck back lever starts there.",
      injury:"Stop on shoulder, elbow or neck pain, and use a smaller range if the front of the shoulder feels stretched." },

    skill_backlever_transition: { id:"skill_backlever_transition", pattern:"skill", name:"Tuck-to-Straddle Transition", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar", "rings"],
      cues:[
        "Take a tuck back lever with straight arms and a padded landing below.",
        "Open your legs slowly, one stage at a time, toward a straddle.",
        "Keep your hips from twisting as the legs separate.",
        "Close back to the tuck at the same speed, and rest before the next rep."
      ],
      mistakes:["Flinging the legs open.", "The shoulder position drifting as the legs move."],
      readiness:"A stable tuck back lever and slow leg opening come first.",
      injury:"A longer lever loads the shoulders more; stop when control goes, or on shoulder pain." },

    skill_backlever_2: { id:"skill_backlever_2", pattern:"skill", name:"Advanced Tuck Back Lever", level:null, era:1, mode:"hold", unit:"sec", equipment:["pullupBar", "rings"],
      cues:[
        "Start from a stable tuck back lever and open the knees away from your chest a little at a time.",
        "Keep your body line near horizontal, with the hips level with the shoulders.",
        "Hold your elbows straight.",
        "Return to the tuck before the hips begin to drop."
      ],
      mistakes:["Arching the lower back to hold the line.", "Bending the elbows."],
      readiness:"Hold the tuck back lever with ease, and make sure the shoulders tolerate a longer lever before you open it further.",
      injury:"Stop on shoulder, elbow or neck pain; the longer lever stretches the front of the shoulder more." },

    skill_backlever_straddleneg: { id:"skill_backlever_straddleneg", pattern:"skill", name:"Straddle Back Lever Negative", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar", "rings"],
      cues:[
        "Start from a secure inverted position and open your legs in a wide, even straddle.",
        "Lower slowly toward horizontal with your elbows straight.",
        "Keep the legs equally apart and the hips level.",
        "Stop where you lose control, and exit safely."
      ],
      mistakes:["Free-falling through the lowering.", "Letting the shoulders extend further than is comfortable."],
      readiness:"Needs a stable advanced tuck back lever and a controlled straddle lowering from a shorter lever.",
      injury:"A slow lowering loads the shoulders heavily; stop on pain, and keep a padded landing below." },

    skill_backlever_3: { id:"skill_backlever_3", pattern:"skill", name:"Straddle Back Lever", level:null, era:1, mode:"hold", unit:"sec", equipment:["pullupBar", "rings"],
      cues:[
        "Take a wide, even straddle from a controlled straddle lowering.",
        "Keep your hips and trunk level and your arms straight.",
        "Stop your chest and hips from dropping.",
        "Leave by closing the legs back into a tuck."
      ],
      mistakes:["Legs spread unevenly.", "The chest or hips sinking."],
      readiness:"A controlled straddle negative first, with a steady straight-arm shoulder position.",
      injury:"Stop on shoulder, elbow or neck pain; don't force the shoulders further back than they go comfortably." },

    skill_backlever_fullneg: { id:"skill_backlever_fullneg", pattern:"skill", name:"Full Back Lever Negative", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar", "rings"],
      cues:[
        "Start from a secure inverted position with your legs together.",
        "Lower slowly with straight elbows and the legs together.",
        "Keep your body in one even line, without arching.",
        "Stop and exit when control fades."
      ],
      mistakes:["Dropping too fast.", "Arching through the back."],
      readiness:"A stable straddle back lever first, then control of the full-length lowering.",
      injury:"A full-length lowering is very demanding on the shoulders; stop on pain, and keep a padded landing below." },

    skill_backlever_4: { id:"skill_backlever_4", pattern:"skill", name:"Full Back Lever", level:null, era:1, mode:"hold", unit:"sec", equipment:["pullupBar", "rings"],
      cues:[
        "Take a controlled full-length lever with your legs together.",
        "Keep your body level and your arms straight.",
        "Plan a deliberate exit before you start.",
        "Hold only as long as the line stays."
      ],
      mistakes:["Over-stretching the shoulders.", "Letting the hips drop."],
      readiness:"A controlled full negative and a stable straight-arm straddle hold come first.",
      injury:"Stop on shoulder, elbow or neck pain; the full lever is the longest and hardest on the shoulders." },

    /* ---- Yellow Dude, Group C: squat, hinge and core variants. Era II for the
       three loaded mains (a barbell, a weighted vest, dumbbells on a bench), as
       the existing `_e2_` rows are. ---- */
    squat_alt_box: { id:"squat_alt_box", pattern:"squat", name:"Box Squat", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Set a stable box or sturdy chair behind you, at a height you can sit onto and rise from with control.",
        "Stand about shoulder-width apart and sit your hips back and down until you touch the box.",
        "Touch it lightly with your torso braced instead of dropping onto it.",
        "Stand by pressing through your whole foot, without rocking back first."
      ],
      mistakes:["Dropping onto the box and bouncing off it.", "Rocking back to build momentum before you stand."],
      readiness:"Use it when a free squat is still wobbly at the bottom; a lower box, and then the squat itself, is the next step.",
      injury:"The box must not slide. Pick a height your knees and hips tolerate and go higher if they complain." },

    squat_alt_jump: { id:"squat_alt_jump", pattern:"squat", name:"Jump Squat", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Clear the space above and around you and stand on a non-slip floor.",
        "Squat down to a depth you control, then jump straight up by driving through the floor.",
        "Land softly on the whole foot with your hips back and your knees tracking over your toes.",
        "Reset between reps instead of chaining them whenever your landings get loud."
      ],
      mistakes:["Landing stiff-legged.", "Letting the knees cave inward on the landing."],
      readiness:"A controlled bodyweight squat and a quiet landing from small hops come first; end the set when the landings get worse.",
      injury:"Jumping loads the knees, ankles and Achilles. If any of them hurts, stop jumping and do a plain squat instead." },

    squat_alt_bulgarianw: { id:"squat_alt_bulgarianw", pattern:"squat", name:"Weighted Bulgarian Split Squat", level:null, era:2, mode:"reps", unit:"reps", equipment:["bench", "dumbbells"],
      cues:[
        "Rest the top of your back foot on a bench behind you and hold a dumbbell in each hand at your sides.",
        "Step the front foot far enough forward that the shin stays near vertical at the bottom.",
        "Lower under control until the back knee is just above the floor, with the dumbbells hanging clear of the bench.",
        "Drive through the whole front foot to stand, keeping the weights level and still."
      ],
      mistakes:["Adding weight while the front foot is still wobbling.", "Cutting the depth short once the weights get heavy."],
      readiness:"Be steady on the unweighted Bulgarian split squat first, then add the smallest step in weight at the same depth.",
      injury:"Fix the bench so it can't slide and keep the dumbbells out of its way. Stop and shorten the range if the knee, hip or back complains." },

    squat_alt_deficit: { id:"squat_alt_deficit", pattern:"squat", name:"Deficit Bulgarian Split Squat", level:null, era:1, mode:"reps", unit:"reps", equipment:["bench"],
      cues:[
        "Put the top of your back foot on a bench and your front foot on a low, solid riser so it sits a little above the floor.",
        "Lower slowly through the extra depth, keeping the whole front foot pressed into the riser.",
        "Stay upright and let the front knee travel over the toes at an angle you can control.",
        "Stand by driving through the front foot, and step off the riser to reset between sets."
      ],
      mistakes:["Stacking unstable risers to chase more depth.", "Letting the front heel lift at the bottom."],
      readiness:"Own the Bulgarian split squat first, then deepen the range a little at a time before you think about load.",
      injury:"A riser that tips is a fall, so use a solid one. Shorten the range, or lower the riser, if the knee or hip complains." },

    squat_alt_boxpistol: { id:"squat_alt_boxpistol", pattern:"squat", name:"Box Pistol Squat", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Stand with a stable box or bench behind your hips, one foot on the floor and the other leg held out in front.",
        "Sit down onto the box on one leg, slowly, with your weight over the middle of the foot.",
        "Touch the box gently instead of dropping onto it, then stand up on the same leg.",
        "Start with a high box and lower it a little at a time as your control improves."
      ],
      mistakes:["Falling onto the box at the bottom.", "Swinging the free leg or rocking to get up."],
      readiness:"Be comfortable with an assisted pistol squat and a controlled sit onto the box before you go lower.",
      injury:"Single-leg squats twist the knee if the foot or hip drifts. Stop at knee, hip or ankle pain, and go back to a higher box or more support." },

    squat_alt_pistolneg: { id:"squat_alt_pistolneg", pattern:"squat", name:"Negative Pistol Squat", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Stand on one leg beside a rail or a box you can use to reset, with the other leg held out in front.",
        "Lower slowly on that leg, with the heel flat and the knee tracking over the toes.",
        "Use the rail, the box or your free foot to get back up, not the working leg.",
        "Stop the descent where your control ends instead of dropping through the last part."
      ],
      mistakes:["Dropping through the bottom of the squat.", "Forcing a depth that hurts."],
      readiness:"An assisted pistol squat first, and a one-leg lowering you can slow down on purpose.",
      injury:"Warm the ankles and knees. Stop at knee, hip or ankle pain, or if the knee twists under you, and keep a rail or box in reach." },

    squat_alt_barbell: { id:"squat_alt_barbell", pattern:"squat", name:"Barbell Back Squat", level:null, era:2, mode:"reps", unit:"reps", equipment:["barbell"],
      cues:[
        "Set the rack safeties just below your lowest squat, and load the bar evenly with the collars on.",
        "Brace before you unrack, then walk the bar out with short steps and a settled stance.",
        "Brace again, sit down and back, and keep the bar over the middle of your foot.",
        "Stand by driving through the floor, and re-rack only when the bar is clearly touching the rack."
      ],
      mistakes:["Losing the brace at the bottom.", "Squatting without safeties or a spotter."],
      readiness:"Squat well with no load first, and have the rack and the bar set up with someone who has used them before you add weight.",
      injury:"A loaded bar is the heaviest thing in this app. Use the safeties, and stop at knee, hip or back pain." },

    squat_alt_cossackw: { id:"squat_alt_cossackw", pattern:"squat", name:"Weighted Cossack Squat", level:null, era:1, mode:"reps", unit:"reps", equipment:["dumbbells", "kettlebells"],
      cues:[
        "Hold one dumbbell or kettlebell against your chest with both hands and take a wide stance, toes turned slightly out.",
        "Shift onto one leg and squat down over it while the other leg stays long.",
        "Keep the weight close to you so it doesn't pull your chest forward.",
        "Push back to the middle and shift to the other side, with a clear space to put the weight down."
      ],
      mistakes:["Letting the weight drag your torso forward.", "Forcing more depth than the hip can give."],
      readiness:"Be smooth on the unweighted Cossack squat first, then add the smallest step in weight at the same depth.",
      injury:"Stop at groin, knee or hip pain. Shorten the range instead of forcing the hip." },

    squat_alt_dragonassist: { id:"squat_alt_dragonassist", pattern:"squat", name:"Assisted Dragon Squat", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Stand on one leg next to a fixed rail or post you can hold with one hand.",
        "Sit down on the standing leg and sweep the other leg behind it, slowly, so you can practise the path.",
        "Let the rail take some of your weight, and note how much help you used.",
        "Keep the standing knee over its toes instead of letting it turn inward."
      ],
      mistakes:["Twisting the planted knee as the other leg passes behind.", "Letting the support slip, or hanging on it."],
      readiness:"A controlled pistol or split squat first, and a leg path you can run slowly with a hand on the support.",
      injury:"The planted knee turns under load here. Stop at knee, hip or ankle pain, and shrink the range instead of forcing it." },

    squat_alt_dragon: { id:"squat_alt_dragon", pattern:"squat", name:"Dragon Squat", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Stand on one leg in open space with a support within reach.",
        "Sit down on the standing leg while the other leg sweeps behind it.",
        "Keep the working knee over its toes and control the depth.",
        "Stand back up without hopping or swinging the free leg."
      ],
      mistakes:["Forcing the knee to twist.", "Losing balance because the free leg swung."],
      readiness:"A strong assisted dragon squat, with steady balance and knee control, comes first.",
      injury:"An expert move that rotates the knee and hip under load. Stop at any knee, hip or ankle pain, and never force the rotation." },

    hinge_alt_nordicband: { id:"hinge_alt_nordicband", pattern:"hinge", name:"Band-Assisted Nordic Curl", level:null, era:1, mode:"reps", unit:"reps", equipment:["bands", "nordicAnchor"],
      cues:[
        "Pad your knees, fix your ankles under a secure anchor, and attach a band in front of you so it takes part of your weight.",
        "Keep your body in one line from knees to head and lower forward with your hamstrings holding you back.",
        "Let the band slow the descent, and use the same band and the same setup on every rep.",
        "Catch yourself with your hands if you need to, and push back up."
      ],
      mistakes:["The band recoiling you upward faster than you can control.", "Changing the assistance from one rep to the next."],
      readiness:"Hold a controlled Nordic lowering with steady knees first, and start with a heavier band.",
      injury:"Inspect the ankle anchor and the band's anchor before each set. Stop at a pulling feeling in a hamstring, or at knee pain." },

    hinge_alt_nordicarm: { id:"hinge_alt_nordicarm", pattern:"hinge", name:"Arm-Assisted Nordic Curl", level:null, era:1, mode:"reps", unit:"reps", equipment:["nordicAnchor"],
      cues:[
        "Pad your knees, fix your ankles under a secure anchor, and leave clear floor in front of your hands.",
        "Lower forward in one line from knees to head, holding back with your hamstrings.",
        "Catch the floor softly and use your hands only as much as you need.",
        "Push back to the start and ask your hands for a little less each time."
      ],
      mistakes:["Collapsing onto the hands.", "Letting the return become a push-up with the hamstrings idle."],
      readiness:"A controlled Nordic lowering where your hands catch you comes first, then use them less.",
      injury:"Inspect the ankle anchor before each set. Stop at a pulling feeling in a hamstring, or at knee pain." },

    core_alt_onefoot: { id:"core_alt_onefoot", pattern:"core", name:"Single-Foot Plank", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:[
        "Take a standard plank with your hands or forearms under your shoulders.",
        "Lift one foot a few centimetres off the floor, no higher.",
        "Keep your hips level so the pelvis doesn't rotate toward the lifted side.",
        "Swap feet between sets so both sides get the same work."
      ],
      mistakes:["Rotating the pelvis open as the foot lifts.", "Raising the leg high, which arches the lower back."],
      readiness:"A steady standard plank first, with your hips still when you shift.",
      injury:"Stop at low-back pain or neck strain, and go back to the plain plank." },

    core_alt_plankweighted: { id:"core_alt_plankweighted", pattern:"core", name:"Weighted Plank", level:null, era:2, mode:"hold", unit:"sec", equipment:["vest"],
      cues:[
        "Fit a weighted vest snugly so it can't shift as you move.",
        "Brace your trunk first, then take your plank position.",
        "Keep your pelvis level and your ribs down so the lower back doesn't sag.",
        "Come down before the form goes, not after."
      ],
      mistakes:["A loose load sliding across your back.", "Letting the lower back arch under the weight."],
      readiness:"A solid standard plank first, then a small secured load; add the smallest step in weight.",
      injury:"Stop at low-back pain or neck strain, take the weight off, and go back to the plain plank." },

    core_alt_hollowrock: { id:"core_alt_hollowrock", pattern:"core", name:"Hollow Body Rock", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Lie on your back in a hollow hold: lower back flat, arms overhead, legs straight and low.",
        "Rock forward and back as one rigid shape, keeping the brace.",
        "Keep your head and neck relaxed instead of snapping them with each rock.",
        "Use a firm, lightly padded floor with room behind you."
      ],
      mistakes:["Kicking the legs independently of the trunk.", "Snapping the neck on every rock."],
      readiness:"A steady hollow body hold first, and rocking only once the shape stays together.",
      injury:"Stop at low-back pain or neck strain, and go back to the hollow body hold." },

    core_alt_floorlsit: { id:"core_alt_floorlsit", pattern:"core", name:"Floor L-Sit", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:[
        "Sit on a flat floor with your legs straight and your fingers pointing forward beside your hips.",
        "Press the floor down hard and straighten your elbows.",
        "Lift your thighs actively to get your heels off the floor.",
        "Lower under control; a short clean hold is better than a long one with dragging heels."
      ],
      mistakes:["Dragging the heels along the floor.", "Forcing the wrists past a comfortable bend."],
      readiness:"A steady L-sit on parallettes or a bench comes first, with enough hip compression to lift from the floor.",
      injury:"Stop at wrist or shoulder pain, or pinching at the front of the hip. Bend the knees, or lift in a smaller range." },

    core_alt_chairlegraise: { id:"core_alt_chairlegraise", pattern:"core", name:"Two-Chair Leg Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Set two heavy, non-slip chairs at the same height, a little wider than your hips, with room for your legs to travel.",
        "Press down through locked arms with your hands on the seats.",
        "Raise your legs without swinging, with the knees bent at first.",
        "Lower under control and keep your torso still."
      ],
      mistakes:["Bending the elbows as the legs rise.", "Swinging the legs for momentum."],
      readiness:"A steady support on two chairs and a controlled knee raise come first.",
      injury:"Check that the chairs can't slide or tip before you take your weight. Stop at wrist or shoulder pain, or pinching at the hip." },

    core_alt_pikelift: { id:"core_alt_pikelift", pattern:"core", name:"Seated Pike Leg Lift", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Sit tall on the floor with your legs straight and your hands beside your thighs, on the floor or on blocks.",
        "Lift one leg, keeping it straight, without leaning far back.",
        "Lower it without bouncing the heel, then lift the other leg.",
        "Alternate legs, and bend the knee if the lift won't stay clean."
      ],
      mistakes:["Rounding your back to fake height.", "Bouncing the heel off the floor."],
      readiness:"Sit tall with your legs out and lift one actively, then ask for the same control with both legs together.",
      injury:"Stop at wrist or shoulder pain, or pinching at the front of the hip, and bend the knee." },

    core_alt_hangknee: { id:"core_alt_hangknee", pattern:"core", name:"Hanging Knee Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
      cues:[
        "Hang from a fixed bar with a step nearby for getting down.",
        "Tilt your pelvis gently and raise your knees toward your chest.",
        "Lift without kicking, so the body doesn't swing.",
        "Lower the knees under control before the next rep."
      ],
      mistakes:["Kipping through the reps.", "Letting go because the grip gave out before the abs did."],
      readiness:"A comfortable hang first, and the ability to raise your knees without swinging.",
      injury:"Stop at shoulder or wrist pain, a failing grip, or low-back pain, and do a floor leg raise instead." },

    core_alt_hangleg: { id:"core_alt_hangleg", pattern:"core", name:"Hanging Straight-Leg Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
      cues:[
        "Hang from a fixed bar with clear space in front of your legs.",
        "Lift straight legs as high as you can control, without swinging.",
        "Keep your shoulders from shrugging up toward your ears.",
        "Lower slowly and let the swing settle before the next rep."
      ],
      mistakes:["Throwing the legs up with momentum.", "Passively shrugging into the shoulders."],
      readiness:"Steady hanging knee raises come first.",
      injury:"Stop at shoulder or wrist pain, a failing grip, or low-back pain, and do a floor leg raise instead." },

    core_alt_t2b: { id:"core_alt_t2b", pattern:"core", name:"Toes-to-Bar", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
      cues:[
        "Hang from a high bar with clear space in front of and behind your legs.",
        "Compress your hips and lift straight legs until your toes reach the bar.",
        "Lower under control instead of dropping.",
        "Keep it strict: no deliberate kip."
      ],
      mistakes:["Kipping by accident as the legs drop.", "Yanking on the shoulders to pull the feet up."],
      readiness:"A stable hanging straight-leg raise comes first, with enough flexibility to reach the bar.",
      injury:"Stop at shoulder or wrist pain, a failing grip, or low-back pain, and use a controlled floor variation." },

    core_alt_lyingleg: { id:"core_alt_lyingleg", pattern:"core", name:"Lying Leg Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Lie on your back on a firm floor with your arms by your sides or your hands under your hips.",
        "Press your lower back toward the floor and raise your legs.",
        "Lower them slowly, only as far as your lower back stays down.",
        "Bend your knees to shorten the lever whenever the back lifts."
      ],
      mistakes:["Letting the lower back lift off the floor on the way down.", "Swinging the legs up with momentum."],
      readiness:"You can lie flat and lower your legs without the trunk shifting.",
      injury:"Stop at low-back pain or neck strain, and bend the knees." },

    core_alt_situp: { id:"core_alt_situp", pattern:"core", name:"Sit-up", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Lie on your back with your knees bent and your feet flat, with no one holding them down.",
        "Curl up smoothly to sitting, with your arms crossed or your hands lightly by your ears.",
        "Keep your neck relaxed and don't pull on your head.",
        "Lower with the same control, without bouncing off the floor."
      ],
      mistakes:["Pulling on the head or neck.", "Bouncing off the floor to get started."],
      readiness:"You can curl your trunk up from the floor without neck strain; if not, use a crunch.",
      injury:"Stop at neck or back pain, avoid pulling on your head, and choose a shorter range." },

    core_alt_crunch: { id:"core_alt_crunch", pattern:"core", name:"Crunch", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Lie on your back with your knees bent and your hands lightly by your ears or across your chest.",
        "Lift just your head, neck and shoulders, breathing out as you curl.",
        "Keep your neck long and don't pull on it with your hands.",
        "Lower slowly without letting your head drop."
      ],
      mistakes:["Pulling the head forward with the hands.", "Turning the crunch into a full sit-up."],
      readiness:"You can curl your upper trunk gently without pulling on your neck.",
      injury:"Stop at neck or back pain, avoid pulling on your head, and choose a shorter range." },

    core_alt_bicycle: { id:"core_alt_bicycle", pattern:"core", name:"Bicycle Crunch", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Lie on your back with your hands lightly by your ears and your knees raised.",
        "Curl up and turn your chest toward the opposite knee as it comes in.",
        "Extend the other leg and switch sides slowly.",
        "Keep your neck long and your elbows wide, not dragged toward the knee."
      ],
      mistakes:["Yanking an elbow toward the knee.", "Pedalling fast with no trunk rotation."],
      readiness:"A controlled crunch first, and comfortable turning your trunk with the hips still.",
      injury:"Stop at neck or back pain, avoid pulling on your head, and slow down." },

    core_alt_legshold: { id:"core_alt_legshold", pattern:"core", name:"Straight-Leg Hold", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:[
        "Lie on your back with your legs straight and raised to an angle you can hold with your lower back comfortable.",
        "Brace your trunk so the lower back stays where it started.",
        "Breathe through the hold instead of tensing your neck.",
        "Lower legs are harder, so note the angle you used and keep it the same."
      ],
      mistakes:["Letting the lower back arch as the legs tire.", "Tensing the neck."],
      readiness:"Hold your legs straight and raised with a comfortable back first, then lower them a little at a time.",
      injury:"Stop at low-back pain or neck strain, and bend the knees or raise the legs." },

    core_alt_flutter: { id:"core_alt_flutter", pattern:"core", name:"Flutter Kicks", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:[
        "Lie on your back with your legs straight and raised just off the floor, with your hands under your hips if it helps.",
        "Kick the legs up and down in small, alternating beats.",
        "Keep the trunk still and your lower back where it started.",
        "Note how high you hold the legs and keep it the same from set to set."
      ],
      mistakes:["Making large swinging kicks.", "Letting the lower back arch as the legs tire."],
      readiness:"A controlled straight-leg hold comes first, with the lower back still as the legs alternate.",
      injury:"Stop at low-back pain or neck strain, and raise the legs or bend the knees." },

    core_alt_abwheelknee: { id:"core_alt_abwheelknee", pattern:"core", name:"Kneeling Ab Wheel Rollout", level:null, era:1, mode:"reps", unit:"reps", equipment:["abWheel"],
      cues:[
        "Kneel on a pad with the wheel on a non-slip floor under your shoulders.",
        "Brace your trunk before you roll and keep your ribs and hips in line.",
        "Roll out only as far as your back stays flat; a wall in front can set the limit.",
        "Pull back with your trunk, not by pushing your hips back."
      ],
      mistakes:["Rolling out further than you can pull back from.", "Sagging through the lower back."],
      readiness:"A steady plank first, and a short rollout where the back doesn't sag.",
      injury:"The wheel loads the wrists and shoulders as well. Stop at low-back, wrist or shoulder pain, and shorten the roll." },

    core_alt_abwheelstand: { id:"core_alt_abwheelstand", pattern:"core", name:"Standing Ab Wheel Rollout", level:null, era:1, mode:"reps", unit:"reps", equipment:["abWheel"],
      cues:[
        "Stand with the wheel on a non-slip floor in front of your feet and a clear path ahead.",
        "Brace, and keep your ribs and pelvis connected as you roll.",
        "Stop short of where the brace goes; a mark on the floor or a wall can set the limit.",
        "Pull back with your trunk and stand up without a sudden arch."
      ],
      mistakes:["Suddenly arching the lower back.", "The wheel slipping on a slick floor."],
      readiness:"Strong kneeling rollouts with full trunk control come first; lengthen the roll only as control holds.",
      injury:"Stop at low-back, wrist or shoulder pain, and shorten the roll." },

    /* ---- Yellow Dude, Group D: coverage additions and conditioning ---- */
    acc_curl_pelican: { id:"acc_curl_pelican", pattern:"accessory", name:"Ring Pelican Curl", level:null, era:1, mode:"reps", unit:"reps", equipment:["rings"],
      cues:[
        "Set the rings low and walk your feet forward until the angle is one you can control.",
        "Start with the arms long and the shoulders pulled back, not hanging loose.",
        "Bend the elbows to bring the hands toward you, with the upper arms doing little.",
        "Let the arms straighten slowly, and stop the lowering short of the point where the shoulders are forced back."
      ],
      mistakes:["Forcing the shoulders back at the bottom of every rep.", "Dropping fast into a straight arm, which loads the biceps tendon suddenly."],
      readiness:"A comfortable ring row and an easy ring curl first; flatten the angle only when the range stays smooth on two different days.",
      injury:"This loads the biceps tendon and the front of the shoulder at a long length. Stop at pain there or in the elbow, and raise the rings before trying again." },

    acc_curl_ring: { id:"acc_curl_ring", pattern:"accessory", name:"Ring Biceps Curl", level:null, era:1, mode:"reps", unit:"reps", equipment:["rings"],
      cues:[
        "Set the rings at about chest height and lean back with the body in one line.",
        "Hold the rings with your palms facing you and your arms straight out in front.",
        "Curl the rings toward your forehead, keeping the upper arms where they are.",
        "Lower until the arms are straight again, and walk your feet closer to make it easier or farther to make it harder."
      ],
      mistakes:["Driving with the hips instead of the arms.", "Letting the elbows wander wide or drop as you curl."],
      readiness:"A controlled ring row first; make it harder by moving your feet forward once every set reaches the top of the range on two different days.",
      injury:"Stop at pain in the elbow or the front of the shoulder. Stand more upright to take load off the arms." },

    acc_reardelt_ringfacepull: { id:"acc_reardelt_ringfacepull", pattern:"accessory", name:"Ring Face Pull", level:null, era:1, mode:"reps", unit:"reps", equipment:["rings"],
      cues:[
        "Set the rings at about face height and lean back with the body straight.",
        "Pull the rings toward your face, with the elbows high and wide.",
        "Finish with the hands beside your ears and the shoulder blades pulled back and down.",
        "Return slowly until the arms are straight. Walk your feet closer to make it easier."
      ],
      mistakes:["Poking the chin forward to meet the rings.", "Flaring the ribs and arching the lower back."],
      readiness:"A controlled ring row and comfortable high elbows first; make it harder by stepping your feet forward once every set tops the range on two different days.",
      injury:"Stop at pain in the shoulder or the neck. Shorten the range, or stand more upright, if the shoulder pinches." },

    acc_traps_proney: { id:"acc_traps_proney", pattern:"accessory", name:"Prone Y Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Lie face down on the floor with your arms reaching overhead in a Y and your forehead just off the floor.",
        "Turn your thumbs up and lift both arms a few centimetres, leading with the shoulder blades.",
        "Keep your neck long and your ribs on the floor.",
        "Pause at the top, then lower slowly."
      ],
      mistakes:["Shrugging the shoulders up toward the ears.", "Lifting the arms by arching the lower back."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Lift only as high as the arms move smoothly, and drop the range if the neck or the shoulder pinches. Stop at persistent pain." },

    acc_grip_falsegrip: { id:"acc_grip_falsegrip", pattern:"accessory", name:"False-Grip Ring Hang", level:null, era:1, mode:"hold", unit:"sec", equipment:["rings"],
      cues:[
        "Set the rings low enough to keep your feet on the floor at first.",
        "Put the heel of the palm over the ring so the wrist sits on top of it, not under it.",
        "Take your weight onto your hands slowly, with the shoulders drawn down.",
        "Put your feet back on the floor before the grip gives."
      ],
      mistakes:["Taking the full bodyweight at once.", "Pinching the skin of the palm between the ring and the hand."],
      readiness:"A comfortable ring hang, with the wrists used to gradual load, first. Lengthen the hang once it is steady for the full time on two different days.",
      injury:"Stop at pain or numbness in the hand, wrist, elbow or shoulder, and keep your feet on the floor to take weight off. Build the time slowly." },

    acc_grip_ricebucket: { id:"acc_grip_ricebucket", pattern:"accessory", name:"Rice Bucket Hand Drill", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:[
        "Fill a bucket with clean, dry rice, sit beside it and put one hand in up to the wrist.",
        "Open the fingers wide against the rice, then close them into a fist.",
        "Mix in turning the wrist, spreading the fingers and squeezing, one motion after another.",
        "Keep the movements gentle and steady for the set's time, then swap hands."
      ],
      mistakes:["Pushing through wrist pain.", "Doing a lot of it every day."],
      readiness:"Ready to move on when the hands stay comfortable for the full time on two different days.",
      injury:"Stop at pain, numbness or skin irritation in the hand or the wrist. Keep the rice clean and dry, and cut the time if the hands are sore the next day." },

    acc_backext_superman: { id:"acc_backext_superman", pattern:"accessory", name:"Superman Hold", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:[
        "Lie face down on a mat with your arms reaching ahead and your legs straight.",
        "Lift your arms and legs only a little off the floor.",
        "Keep your gaze down and your neck in line with your spine.",
        "Breathe normally for the set's time, then lower."
      ],
      mistakes:["Arching the back as high as it will go.", "Holding the breath."],
      readiness:"Ready to move on when the hold is steady for the full time on two different days.",
      injury:"A small lift is enough. Stop at back pain or any pain that travels down a leg, and go back to the prone back extension." },

    acc_antirot_hipraise: { id:"acc_antirot_hipraise", pattern:"accessory", name:"Side Plank Hip Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Get into a side plank on your forearm, elbow under your shoulder, with your padded elbow on the floor.",
        "Lower the hip toward the floor without resting on it.",
        "Raise the hips back up by squeezing the side of your trunk.",
        "Keep the shoulder stacked and the body facing forward. Finish one side, then switch."
      ],
      mistakes:["Twisting the chest toward the floor or the ceiling.", "Dropping onto the elbow at the bottom."],
      readiness:"A steady side plank first. Ready to move on when every set reaches the top of the range on both sides on two different days.",
      injury:"Stop at pain in the supporting shoulder, the elbow or the back. Shorten the range, or go back to the side plank held still." },

    acc_quad_wallsit1: { id:"acc_quad_wallsit1", pattern:"accessory", name:"Single-Leg Wall Sit", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:[
        "Set up in a two-leg wall sit with your back flat on the wall and your feet on a non-slip floor.",
        "Shift your weight onto one leg, then lift the other foot a short way off the floor.",
        "Keep your hips level and the knee over the ankle.",
        "Hold for the set's time, put the foot down before the leg gives, and repeat on the other side."
      ],
      mistakes:["Letting the pelvis drop on the lifted side.", "Letting the supporting foot slip."],
      readiness:"A steady two-leg wall sit and a brief one-leg balance first. Ready to move on when the hold is steady for the full time on both sides on two different days.",
      injury:"Stop at knee pain, or if you feel dizzy or the foot slips. Sit higher for a shallower angle, which is still the same exercise." },

    acc_quad_wallsitw: { id:"acc_quad_wallsitw", pattern:"accessory", name:"Weighted Wall Sit", level:null, era:2, mode:"hold", unit:"sec", equipment:["dumbbells", "kettlebells", "vest"],
      cues:[
        "Put on a fitted vest, or hold a weight against your thighs so it can't slide.",
        "Slide down the wall until your thighs are near parallel, with the knees over the ankles.",
        "Press your back into the wall and keep the knee angle the same from set to set.",
        "Hold for the set's time, then slide up slowly."
      ],
      mistakes:["Holding a loose weight that slides or swings.", "Holding the breath."],
      readiness:"Add weight only when every set reaches the full time on two different days.",
      injury:"Choose a load that is secure. Stop at knee pain, or if you feel dizzy or the feet slip, and sit higher for a shallower angle." },

    acc_quad_lunge: { id:"acc_quad_lunge", pattern:"accessory", name:"Forward Lunge", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Stand tall with your feet hip-width apart, with a wall or a rail within reach if you need it.",
        "Step forward a long stride and land with the whole foot flat.",
        "Lower until the back knee hovers just above the floor, with the torso upright.",
        "Push back off the front foot to stand. Finish one leg, then switch."
      ],
      mistakes:["Over-striding, so the front knee pushes far past the toes.", "Letting the front foot wobble or the heel lift."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"The forward step loads the front knee more than a step back. Shorten the stride and the depth if the knee complains, or go back to the reverse lunge." },

    acc_quad_stepupw: { id:"acc_quad_stepupw", pattern:"accessory", name:"Weighted Step-Up", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
      cues:[
        "Hold a dumbbell in each hand at your sides and stand facing a fixed step that is about knee height or lower.",
        "Place the whole foot on the step and drive through it to stand tall.",
        "Keep your torso upright and the knee over the toes, not caving in.",
        "Lower under control to the floor. Finish one leg, then switch."
      ],
      mistakes:["Pushing off the trailing foot instead of the one on the step.", "Dropping from the top without control."],
      readiness:"Add weight only when every set reaches the top of the range on two different days.",
      injury:"Use a step that cannot slide, and a height you can control. Stop at knee, hip or back pain, and start with light weights." },

    acc_calf_floor: { id:"acc_calf_floor", pattern:"accessory", name:"Floor Calf Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Stand on a firm level floor with your feet hip-width apart, a fingertip on a wall for balance.",
        "Rise up through the balls of your feet as high as you can.",
        "Pause for a beat at the top.",
        "Lower slowly, taking about two seconds."
      ],
      mistakes:["Rolling the ankles outward as you rise.", "Bouncing off the floor instead of lowering under control."],
      readiness:"Ready to move on when every set reaches the top of the range on two different days.",
      injury:"There is no step, so the range is short and kind to the heel. Stop at pain in the Achilles tendon, the heel or the ankle." },

    acc_calf_wallsit: { id:"acc_calf_wallsit", pattern:"accessory", name:"Wall-Sit Calf Raise", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Sit in a wall sit with your back flat on the wall and the knees over your ankles, on a non-slip floor.",
        "Keep that knee angle fixed while you raise both heels together.",
        "Pause at the top, then lower the heels slowly.",
        "Slide up the wall when you finish."
      ],
      mistakes:["Letting the feet slide or the knee angle change as you rise.", "Raising one heel higher than the other."],
      readiness:"A steady wall sit and a controlled calf raise first. Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Stop at knee pain, or if you feel dizzy or the feet slip. Sit higher for a shallower angle." },

    cond_jacks: { id:"cond_jacks", pattern:"accessory", name:"Jumping Jack", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:[
        "Stand tall with your feet together and your arms by your sides, on a flat non-slip floor.",
        "Hop your feet out wide as your arms swing overhead.",
        "Hop them back together as your arms return to your sides.",
        "Land softly through the whole foot and keep a pace you can hold for the full time."
      ],
      mistakes:["Landing stiff-legged.", "Raising the arms far enough to pinch the shoulder."],
      readiness:"Ready to move on when the full time is easy at a steady pace on two different days.",
      injury:"Stop at chest pain, faintness, or breathlessness that is out of the ordinary. Stop at sharp joint pain, and if a shoulder or leg complains, step out the feet and shorten the arm swing." },

    cond_ropeless: { id:"cond_ropeless", pattern:"accessory", name:"Ropeless Jump Rope", level:null, era:1, mode:"hold", unit:"sec", equipment:[],
      cues:[
        "Stand on a flat non-slip floor with a hand at each side, as if holding the rope handles.",
        "Hop on the balls of your feet, low, with a small circle of the wrists as if turning the rope.",
        "Keep the rhythm even and land softly.",
        "Work up to a faster pace only once the rhythm is steady."
      ],
      mistakes:["Landing stiff-legged.", "Speeding up before the rhythm is steady."],
      readiness:"Ready to move on when the full time is steady at an even pace on two different days.",
      injury:"Stop at chest pain, faintness, or breathlessness that is out of the ordinary. If the calf or the foot hurts, march in place instead of hopping." },

    cond_rope: { id:"cond_rope", pattern:"accessory", name:"Jump Rope", level:null, era:1, mode:"hold", unit:"sec", equipment:["jumpRope"],
      cues:[
        "Size the rope so the handles reach your armpits when you stand on its middle.",
        "Turn it mainly from the wrists, with the elbows by your ribs.",
        "Hop just high enough for the rope to pass, and land softly on the balls of your feet.",
        "Keep the rhythm even for the set's time."
      ],
      mistakes:["Jumping much higher than the rope needs.", "Landing stiff-legged."],
      readiness:"Ready to move on when the full time stays smooth, without the rope catching, on two different days.",
      injury:"Stop at chest pain, faintness, or breathlessness that is out of the ordinary. If the calf, the Achilles or the foot hurts, march in place and cut the impact." },

    cond_ropealt: { id:"cond_ropealt", pattern:"accessory", name:"Alternating-Foot Jump Rope", level:null, era:1, mode:"hold", unit:"sec", equipment:["jumpRope"],
      cues:[
        "Start with the basic jump until the rhythm is steady.",
        "Step over the rope with one foot at a time, as if running on the spot.",
        "Keep the steps small and the arms close to the body.",
        "Hold an even beat for the set's time."
      ],
      mistakes:["Bounding high on each step.", "Letting the arms drift wide."],
      readiness:"The basic jump first. Ready to move on when the full time stays smooth on two different days.",
      injury:"Stop at chest pain, faintness, or breathlessness that is out of the ordinary. If the calf or the foot hurts, march without hopping." },

    cond_ropeboxer: { id:"cond_ropeboxer", pattern:"accessory", name:"Boxer-Step Jump Rope", level:null, era:1, mode:"hold", unit:"sec", equipment:["jumpRope"],
      cues:[
        "Start from the basic jump with a steady rhythm.",
        "Shift your weight from one foot to the other, letting each foot take a turn, with one landing for each turn of the rope.",
        "Stay low and relaxed through the shoulders.",
        "Keep an even beat for the set's time."
      ],
      mistakes:["Jumping wide from side to side.", "Crossing the feet by accident."],
      readiness:"The basic jump and an easy weight shift first. Ready to move on when the full time stays smooth on two different days.",
      injury:"Stop at chest pain, faintness, or breathlessness that is out of the ordinary. If the calf or the ankle hurts, lower the hop or march." },

    cond_doubleunder: { id:"cond_doubleunder", pattern:"accessory", name:"Double-Under Jump Rope", level:null, era:1, mode:"hold", unit:"sec", equipment:["jumpRope"],
      cues:[
        "Start from steady single jumps with a rope that clears the floor cleanly.",
        "Jump just high enough for the rope to pass twice under your feet.",
        "Spin the rope with the wrists and keep the arms close, not flailing.",
        "Land softly with the knees bending. Stop the set when the rhythm breaks down."
      ],
      mistakes:["Jumping with the knees locked.", "Whipping the arms wide to make the rope faster."],
      readiness:"Steady single jumps with a controlled landing first. Ready to move on when the full time stays clean on two different days.",
      injury:"Stop at chest pain, faintness, or breathlessness that is out of the ordinary. If the Achilles or the calf hurts, go back to single jumps." },

    cond_ropeweighted: { id:"cond_ropeweighted", pattern:"accessory", name:"Weighted Jump Rope", level:null, era:1, mode:"hold", unit:"sec", equipment:["jumpRope"],
      cues:[
        "Use a weighted rope with handles that suit your hands, and size it like a normal rope.",
        "Turn it from the wrists and keep the shoulders relaxed.",
        "Hop low and land softly on the balls of your feet.",
        "Keep an even beat for the set's time."
      ],
      mistakes:["Using a heavy rope with poor form.", "Whipping the rope with the shoulders."],
      readiness:"A comfortable basic jump with a plain rope first. Ready to move on when the full time stays smooth on two different days.",
      injury:"Stop at chest pain, faintness, or breathlessness that is out of the ordinary. If the shoulder, the wrist or the calf hurts, go back to the plain rope or march." },

    cond_burpeenojump: { id:"cond_burpeenojump", pattern:"accessory", name:"No-Jump Burpee", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Stand on a flat floor with room to step back.",
        "Squat and put your hands on the floor, then step one foot back at a time into a plank.",
        "Keep the trunk braced so the hips don't sag, then step the feet back in.",
        "Stand up without jumping."
      ],
      mistakes:["Letting the hips drop in the plank.", "Rushing the stand-up."],
      readiness:"A step-back plank and an easy get-up from the floor first. Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Stop at chest pain, faintness, or breathlessness that is out of the ordinary. If the wrists or the knees complain, put your hands on something higher or squat shallower." },

    cond_burpee: { id:"cond_burpee", pattern:"accessory", name:"Burpee", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Squat down and put your hands on the floor in front of you.",
        "Step or jump your feet back into a plank, with the trunk braced.",
        "Bring the feet back in under your hips.",
        "Stand, with a small hop at the top if it feels good."
      ],
      mistakes:["Sagging through the middle in the plank.", "Landing hard on stiff legs."],
      readiness:"A solid squat, plank and get-up from the floor first. Ready to move on when every set reaches the top of the range on two different days.",
      injury:"Stop at chest pain, faintness, or breathlessness that is out of the ordinary. If the wrist, the shoulder or the knee hurts, step back instead of jumping, or go back to the no-jump burpee." },

    cond_burpeetuck: { id:"cond_burpeetuck", pattern:"accessory", name:"Tuck-Jump Burpee", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Do a full burpee with the trunk braced, then stand.",
        "Jump straight up and pull the knees toward the chest.",
        "Open the legs before you land and land softly with the knees in line with the toes.",
        "Reset on the ground before the next rep."
      ],
      mistakes:["Tucking by folding the torso forward.", "Landing hard."],
      readiness:"A controlled burpee and soft tuck-jump landings first. Stop the set when the landings get heavy.",
      injury:"Stop at chest pain, faintness, or breathlessness that is out of the ordinary. If the knee, the ankle or the Achilles hurts, drop the tuck jump." },

    cond_burpeevest: { id:"cond_burpeevest", pattern:"accessory", name:"Weighted Vest Burpee", level:null, era:2, mode:"reps", unit:"reps", equipment:["vest"],
      cues:[
        "Fit the vest snugly so it doesn't bounce or shift.",
        "Squat, put your hands down and step or jump back into a braced plank.",
        "Bring the feet in, and stand tall.",
        "Slow down when the trunk starts to give out."
      ],
      mistakes:["Wearing a loose vest that shifts.", "Collapsing through the trunk as you tire."],
      readiness:"A controlled plain burpee before adding a light, secure vest. Add weight only when every set reaches the top of the range on two different days.",
      injury:"Stop at chest pain, faintness, or breathlessness that is out of the ordinary. If the wrist, the back or the knee hurts, take the vest off or go back to the no-jump burpee." },

    cond_boxjump: { id:"cond_boxjump", pattern:"accessory", name:"Box Jump", level:null, era:1, mode:"reps", unit:"reps", equipment:["box"],
      cues:[
        "Set a stable box that cannot slide, below the height you can jump, with space to land and step down.",
        "Swing the arms and jump, landing softly with the whole foot on the box.",
        "Stand tall on top, then step down rather than jump down.",
        "Reset before the next jump."
      ],
      mistakes:["Choosing a box higher than you can land on.", "Jumping down to go again."],
      readiness:"A squat jump with a soft landing at a low height first. Raise the box only when the landings stay quiet on two different days.",
      injury:"Stop at chest pain, faintness, or breathlessness that is out of the ordinary. If the knee, the ankle or the Achilles hurts, use a step-up instead." },

    cond_broadjump: { id:"cond_broadjump", pattern:"accessory", name:"Broad Jump", level:null, era:1, mode:"reps", unit:"reps", equipment:[],
      cues:[
        "Stand on a flat non-slip surface with clear ground ahead.",
        "Swing your arms back, then forward as you jump out and up.",
        "Land with the knees and hips bending together and the feet under you.",
        "Walk back and reset before the next jump."
      ],
      mistakes:["Reaching the feet out in front on landing.", "Landing with straight legs."],
      readiness:"A squat jump and a controlled forward landing first. Stop the set when the landings get loud.",
      injury:"Stop at chest pain, faintness, or breathlessness that is out of the ordinary. If the knee, the ankle or the Achilles hurts, use a low step-up instead." }
  };

  /* Append to the global DB (created in Part 2). */
  if (window.EXERCISE_DB) {
    Object.keys(EXTRA).forEach(function (k) { window.EXERCISE_DB[k] = EXTRA[k]; });
  }

  /* ----------------------------------------------------------------------
     2) SKILL TRACKS — ordered ladders for the Skills view
     -------------------------------------------------------------------- */
  var SKILL_TRACKS = {
    planche: {
      label: "Planche", icon: "skill",
      intro: "A straight-arm pushing skill where the body floats parallel to the floor on the hands alone. Built over months: master each leverage step before opening the body further. A band or a box takes some of the weight at the early rungs, and the two push-up rungs come after the holds they build on.",
      ids: ["skill_planche_band","skill_planche_1","skill_planche_boxtuck","skill_planche_2","skill_planche_3","skill_planche_boxpushup","skill_planche_4","skill_planche_pushup","skill_planche_5"]
    },
    frontlever: {
      label: "Front Lever", icon: "skill",
      intro: "A straight-arm pulling skill: the body holds horizontal beneath a bar, facing the ceiling. Progress by lengthening the lever — tuck, advanced tuck, straddle, then full. A band, a slow negative, one leg out and raises between the holds fill the gaps between rungs.",
      ids: ["skill_frontlever_band","skill_frontlever_1","skill_frontlever_negative","skill_frontlever_2","skill_frontlever_oneleg","skill_frontlever_raise","skill_frontlever_3","skill_frontlever_4"]
    },
    backlever: {
      label: "Back Lever", icon: "skill",
      intro: "The front lever's mirror: the body holds horizontal beneath a bar, facing the floor, with the shoulders stretched behind you. It loads the shoulders and elbows in a position you rarely train, so the rungs are slow on purpose — skin the cat first, then tuck, straddle and full, with a slow negative before the straddle and before the full lever.",
      ids: ["skill_backlever_skinthecat","skill_backlever_1","skill_backlever_transition","skill_backlever_2","skill_backlever_straddleneg","skill_backlever_3","skill_backlever_fullneg","skill_backlever_4"]
    },
    muscleup: {
      label: "Muscle-up", icon: "skill",
      intro: "A pull-up that carries on over the bar into a dip, in one smooth line. It is two skills — a pull that reaches your chest and a turnover that gets the elbows above the bar — so the rungs train each before you join them. Rep ranges here start at 1, because a single clean rep is the first real milestone.",
      ids: ["skill_muscleup_explosive","skill_muscleup_turnover","skill_muscleup_band","skill_muscleup_full"]
    },
    handstand: {
      label: "Handstand", icon: "skill",
      intro: "The foundational inversion. Build shoulder endurance against a wall, learn the stacked line, then transfer balance to your hands for a free hold. Pike holds come first, wall walks and the cartwheel exit teach you to get in and out, and the parallette, bent-arm and one-arm holds after the free hold are optional extras.",
      ids: ["skill_handstand_pike","skill_handstand_pikeelev","skill_handstand_1","skill_handstand_wallwalk","skill_handstand_2","skill_handstand_cartwheel","skill_handstand_3","skill_handstand_toetap","skill_handstand_split","skill_handstand_4","skill_handstand_parallette","skill_handstand_bentarm","skill_handstand_onearm"]
    },
    lsit: {
      label: "L-Sit & Compression", icon: "skill",
      intro: "A pressing-and-compression hold that builds serious core and hip-flexor strength. Progress from supported, to tuck, to a full L-sit, then the V-sit.",
      ids: ["skill_lsit_1","skill_lsit_2","skill_lsit_3","skill_vsit"]
    },
    variations: {
      label: "Variations", icon: "skill",
      intro: "Extra push, pull and squat variations to round out your main ladders — drop them in for variety, weak-point work, or as stepping stones toward the harder progressions.",
      ids: ["push_alt_scapula","push_alt_wide","push_alt_negative","push_alt_explosive","push_alt_onearm","push_alt_tricep","pull_alt_passivehang","pull_alt_australian","pull_alt_tabledoor","pull_alt_towel","pull_alt_bandassist","pull_alt_row","dip_alt_chair","dip_alt_twochair","squat_alt_narrow","squat_alt_deep","squat_alt_cossack","squat_alt_assistedpistol"]
    }
  };

  /* ----------------------------------------------------------------------
     3) MOBILITY / WARM-UP LIBRARY (original routines)
     -------------------------------------------------------------------- */
  /* Parse a mobility time-label (e.g. "2 min", "45 sec", "30 sec each") into
     seconds for the timer button. Rep-based labels ("10 each", "8 cycles")
     return 0 and get no timer. */
  function mobSeconds(label) {
    if (!label) return 0;
    var s = String(label).toLowerCase();
    var minM = s.match(/(\d+(?:\.\d+)?)\s*min/);
    if (minM) return Math.round(parseFloat(minM[1]) * 60);
    var secM = s.match(/(\d+)\s*sec/);
    if (secM) return parseInt(secM[1], 10);
    return 0;
  }

  var MOBILITY = [
    {
      title: "General Warm-up",
      dur: "5-8 min · before any session",
      items: [
        { t: "2 min", d: "Light cardio — jog in place, jumping jacks, or skipping to raise the heart rate." },
        { t: "10 each", d: "Arm circles forward and back to open the shoulders." },
        { t: "10 each", d: "Leg swings front-to-back and side-to-side to loosen the hips." },
        { t: "8 cycles", d: "Cat-cow to mobilise the spine through flexion and extension." },
        { t: "5 each", d: "World's greatest stretch — lunge, drop the elbow inside, rotate and reach up." }
      ]
    },
    {
      title: "Wrist & Elbow Prep",
      dur: "3-4 min · before pushing or skill work",
      items: [
        { t: "30 sec", d: "Palms-down wrist rocks on the floor, gently shifting weight forward and back." },
        { t: "30 sec", d: "Palms-up (fingers-toward-you) rocks to stretch the forearm flexors." },
        { t: "10 each", d: "Wrist circles in both directions." },
        { t: "20 reps", d: "Finger lifts — press the palm down and lift each set of fingers." },
        { t: "30 sec", d: "Gentle prayer stretch, easing the heels of the hands together." }
      ]
    },
    {
      title: "Shoulder Activation (Banded)",
      dur: "4-5 min · before pulling",
      items: [
        { t: "15 reps", d: "Banded pull-aparts — arms straight, squeeze the shoulder blades together." },
        { t: "15 reps", d: "Overhead banded pull-aparts to open the overhead range." },
        { t: "12 reps", d: "Band pull-downs, driving the elbows to the ribs to wake up the lats." },
        { t: "30 sec", d: "Active dead hang to prime the grip and shoulders." },
        { t: "12 reps", d: "Scapular pulls from a hang — move only the shoulder blades." }
      ]
    },
    {
      title: "Hip & Ankle Mobility",
      dur: "5-6 min · before legs",
      items: [
        { t: "8 each", d: "Deep hip circles, hands on hips, drawing big slow circles." },
        { t: "10 each", d: "Knee-over-toe ankle rocks in a lunge to free the ankles." },
        { t: "30 sec", d: "Deep squat hold, prying the knees open with the elbows." },
        { t: "30 sec each", d: "Pigeon stretch with gentle pulses to open the glutes." },
        { t: "12 reps", d: "Bodyweight good mornings to switch on the hamstrings." }
      ]
    },
    {
      title: "Full-Body Cool-down",
      dur: "5-7 min · after any session",
      items: [
        { t: "45 sec", d: "Child's pose, breathing slowly to reset the spine and shoulders." },
        { t: "30 sec each", d: "Cross-body shoulder stretch to release the rear delts." },
        { t: "40 sec each", d: "Seated hamstring stretch, reaching toward the toes with a flat back." },
        { t: "30 sec each", d: "Standing quad stretch, heel to glute, hips pushed forward." },
        { t: "30 sec each", d: "Supine spinal twist, knees falling to one side, arms wide." }
      ]
    }
  ];

  /* ----------------------------------------------------------------------
     4) VIEW STATE + RENDER
     -------------------------------------------------------------------- */
  var skillUi = { tab: "planche" };
  var TAB_ORDER = ["planche","frontlever","backlever","muscleup","handstand","lsit","variations","mobility"];

  /* Public skills API — lets the Today view suggest a skill and jump straight
     to the right track. suggestFor() picks a skill that rides on the day by
     the pairing rule (engine.skillRides: the day trains the skill's family)
     and that your equipment and limits allow. It used to map day names, and
     every day type added after it (the split templates) fell back to Push's
     handstand (plans/PLAN-skills-mobility-in-workouts.md A2). */
  var SUGGEST_ORDER = ["handstand", "frontlever", "lsit", "planche", "backlever", "muscleup"];
  var FAMILY_LINE = {
    push: "Hand balancing first, while your shoulders and wrists are fresh.",
    pull: "Pulling skills need a fresh back: do them before the main pulls.",
    core: "Open with a compression hold while your core is fresh."
  };
  App.skills = {
    tracks: SKILL_TRACKS,
    openTrack: function (id) {
      if (SKILL_TRACKS[id] || id === "mobility") skillUi.tab = id;
      App.showSection("skills");
    },
    suggestFor: function (dayType) {
      var eng = App.engine;
      var id = SUGGEST_ORDER.filter(function (t) {
        return SKILL_TRACKS[t] && eng.skillRides(t, dayType) && eng.skillFirstAllowed(t);
      })[0];
      return id ? { id: id, label: SKILL_TRACKS[id].label, line: FAMILY_LINE[eng.skillFamily(id)] } : null;
    }
  };

  /* ----------------------------------------------------------------------
     4b) IN YOUR WORKOUTS — the panel on each track tab
     (plans/PLAN-skills-mobility-in-workouts.md B3). Start a track at any rung
     you're allowed, change its rung, tick Every session, or stop it. All
     writes go through App.engine.setSkill. Messages are inline, never alerts.
     -------------------------------------------------------------------- */
  var panelMsg = null;
  function rungAllowed(id) {
    var st = App.engine.swapStatus(null, id);
    return !st.blocked;
  }
  function trainPanelHtml(trackId, s) {
    var eng = App.engine, track = SKILL_TRACKS[trackId], rec = eng.recordOf("skill:" + trackId);
    var fam = eng.skillFamily(trackId);
    var days = eng.template().order.filter(function (d) { return eng.skillRides(trackId, d); })
      .map(function (d) { return eng.DAY_LABEL[d] || d; });
    var dayText = days.length ? days.join(", ") : "no day of your current template";
    var open = track.ids.filter(function (id) { return window.TRAINING_DATA.EXERCISES[id] && rungAllowed(id); });
    var options = function (cur) {
      return open.map(function (id) {
        return '<option value="' + id + '"' + (id === cur ? " selected" : "") + '>' + esc((window.EXERCISE_DB[id] || {}).name || id) + '</option>';
      }).join("");
    };
    var msg = panelMsg && panelMsg.track === trackId
      ? '<p class="dx-msg dx-msg--' + panelMsg.kind + '" role="status" data-skill-msg>' + esc(panelMsg.text) + '</p>' : "";
    panelMsg = null;
    var rule = '<p class="faint text-xs" style="margin:0">A ' + esc(fam || "") + ' skill rides on days whose slots train its ' + esc(fam || "") +
      ' muscles. That is a product rule on your template, not a coaching claim.</p>';
    if (!rec) {
      return '<div class="card stack mb-4" data-skill-panel="' + trackId + '" style="gap:var(--sp-3)">' +
        '<div class="eyebrow">In your workouts</div>' + msg +
        '<p class="text-sm" style="margin:0">Not training. Add it and it opens the work, while you\'re fresh, on ' + esc(dayText) + '.</p>' +
        (open.length
          ? '<div class="row wrap" style="gap:var(--sp-2);align-items:center"><label class="text-sm row" style="gap:var(--sp-2);align-items:center">Start at ' +
              '<select class="select" data-skill-start aria-label="Starting rung">' + options(open[0]) + '</select></label>' +
              '<button class="btn btn--primary btn--sm" data-skill-add="' + trackId + '" type="button">Train in my workouts</button></div>'
          : '<p class="muted text-sm" style="margin:0">No rung on this track is open to you: check your equipment and joint limits.</p>') +
        rule + '</div>';
    }
    var ex = window.EXERCISE_DB[rec.exerciseId] || {}, hi = rec.range && rec.range[1];
    var amount = rec.sets + " × " + (hi != null ? "up to " + hi + (rec.unit === "sec" ? " s" : " reps") : "attempts");
    var hist = window.Training.exposures(s.sessions.filter(function (x) { return x.completed; }), rec.exerciseId);
    var last = hist[hist.length - 1];
    var lastLine = last ? "Last: " + last.values.join(" / ") + (rec.unit === "sec" ? " s" : "") + " · " + App.lib.fmtShort(last.day)
      : "Not logged at this rung yet.";
    var blocked = !rungAllowed(rec.exerciseId);
    var stdNote = rec.unit === "sec" && hi ? " The " + hi + " s standard is a product guess from the rung's guide." : "";
    return '<div class="card stack mb-4" data-skill-panel="' + trackId + '" style="gap:var(--sp-3)">' +
      '<div class="eyebrow">In your workouts</div>' + msg +
      '<p class="text-sm" style="margin:0" data-skill-status><b>Training: ' + esc(ex.name || rec.exerciseId) + '</b> · ' + esc(amount) + ' · ' +
        esc(rec.every ? "every session" : "on " + dayText) + '.' + esc(stdNote) + '</p>' +
      '<p class="muted text-sm mono" style="margin:0" data-skill-last>' + esc(lastLine) + '</p>' +
      (blocked ? '<p class="text-sm" style="margin:0;color:var(--warn)">This rung isn\'t open to you now (equipment, an exclusion or a joint limit), so workouts leave it out until it is.</p>' : "") +
      '<label class="row text-sm" style="gap:var(--sp-2);align-items:center"><input type="checkbox" data-skill-every="' + trackId + '"' + (rec.every ? " checked" : "") +
        '> <span>Every session, not only the days that train its ' + esc(fam || "") + ' muscles</span></label>' +
      '<div class="row wrap" style="gap:var(--sp-2);align-items:center">' +
        (open.length ? '<label class="text-sm row" style="gap:var(--sp-2);align-items:center">Rung ' +
          '<select class="select" data-skill-start aria-label="Rung">' + options(rec.exerciseId) + '</select></label>' +
          '<button class="btn btn--ghost btn--sm" data-skill-set="' + trackId + '" type="button">Set rung</button>' : "") +
        '<button class="btn btn--ghost btn--sm" data-skill-stop="' + trackId + '" type="button">Stop training</button>' +
      '</div>' + rule + '</div>';
  }
  function wireTrainPanel(el, s, trackId) {
    var panel = el.querySelector("[data-skill-panel]");
    if (!panel) return;
    var eng = App.engine, label = SKILL_TRACKS[trackId].label;
    var nameOf = function (id) { return (window.EXERCISE_DB[id] || {}).name || id; };
    var redraw = function (kind, text) { panelMsg = { track: trackId, kind: kind, text: text }; drawSkillBody(el, App.getState()); wireSkillGuides(el); };
    var sel = panel.querySelector("[data-skill-start]");
    var on = function (attr, fn) { var b = panel.querySelector("[" + attr + "]"); if (b) b.addEventListener(b.type === "checkbox" ? "change" : "click", fn); };
    on("data-skill-add", function () {
      var r = eng.setSkill(trackId, sel ? sel.value : null);
      redraw(r.error ? "bad" : "ok", r.error || label + " trains in your workouts from " + nameOf(r.exerciseId) + ", first, before the main slots.");
    });
    on("data-skill-set", function () {
      var r = eng.setSkill(trackId, sel.value);
      redraw(r.error ? "bad" : "ok", r.error || label + " is at " + nameOf(r.exerciseId) + " now, from the bottom of its range.");
    });
    on("data-skill-every", function (e) {
      var r = eng.setSkill(trackId, null, { every: e.target.checked });
      redraw(r.error ? "bad" : "ok", r.error || (r.every ? label + " trains in every session." : label + " trains only on the days that suit it."));
    });
    on("data-skill-stop", function () {
      eng.setSkill(trackId, false);
      redraw("ok", label + " is out of your workouts. Its logged sessions stay in your history.");
    });
  }

  function renderSkills(el, s) {
    var tabs = TAB_ORDER.map(function (id) {
      var label = id === "mobility" ? "Mobility" : SKILL_TRACKS[id].label;
      return '<button class="skill-tab ' + (skillUi.tab === id ? "is-active" : "") + '" data-skilltab="' + id + '" type="button">' + esc(label) + '</button>';
    }).join("");

    el.innerHTML =
      '<div class="page-head row between wrap">' +
        '<div><div class="eyebrow">Beyond the basics</div><h1 class="display h2">Skills & mobility</h1></div>' +
        App.ui.eraBadge(s) +
      '</div>' +
      '<p class="muted text-sm" style="max-width:60ch;margin-bottom:var(--sp-5)">Long-term bodyweight skills and the mobility work that supports them. These run alongside your main program — train a skill fresh, early in a session, when you\'re strong. Add a track to your workouts and it opens the work on the days that suit it. Tap any movement for the full guide.</p>' +
      '<div class="skill-cat-tabs">' + tabs + '</div>' +
      '<div id="skill-body"></div>';

    drawSkillBody(el, s);
    wireSkills(el, s);
  }

  function drawSkillBody(el, s) {
    var body = el.querySelector("#skill-body");
    if (!body) return;

    if (skillUi.tab === "mobility") {
      body.innerHTML =
        '<div class="skill-intro"><p>Original warm-up, activation and cool-down routines. Use the general warm-up before every session, the targeted blocks before the matching training day, and the cool-down to finish. Tap the clock on any timed move to start a countdown.</p></div>' +
        '<div class="mob-grid">' + MOBILITY.map(function (m) {
          return '<div class="mob-card">' +
            '<div class="mob-card__title">' + esc(m.title) + '</div>' +
            '<div class="mob-card__dur">' + esc(m.dur) + '</div>' +
            '<ul class="mob-list">' + m.items.map(function (it) {
              var secs = mobSeconds(it.t);
              var btn = secs ? '<button class="mini-timer mob-timer" data-mobsecs="' + secs + '" data-moblabel="' + esc(it.d.split(/[—.]/)[0].trim().slice(0, 32)) + '" type="button" aria-label="Start timer">' +
                '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg></button>' : "";
              return '<li><b>' + esc(it.t) + '</b><span>' + esc(it.d) + '</span>' + btn + '</li>';
            }).join("") + '</ul>' +
          '</div>';
        }).join("") + '</div>';
      var mobBody = body;
      mobBody.querySelectorAll(".mob-timer").forEach(function (b) {
        b.addEventListener("click", function () {
          if (App.startTimer) App.startTimer(Number(b.dataset.mobsecs) || 30, b.dataset.moblabel || "Mobility");
        });
      });
      return;
    }

    var track = SKILL_TRACKS[skillUi.tab];
    var isVariations = skillUi.tab === "variations";
    var PAT_ABBR = { push: "PSH", pull: "PUL", squat: "SQT", hinge: "HIN", core: "COR", shoulder: "SHL", dip: "DIP" };
    var rungs = track.ids.map(function (id, i) {
      var ex = window.EXERCISE_DB[id];
      if (!ex) return "";
      var unit = ex.mode === "hold" ? "hold" : "reps";
      var equip = (ex.equipment && ex.equipment.length) ? ex.equipment.join(", ") : "bodyweight";
      var badge = isVariations ? (PAT_ABBR[ex.pattern] || "·") : String(i + 1);
      var badgeStyle = isVariations ? ' style="font-size:var(--fs-2xs);font-family:var(--font-mono);letter-spacing:.04em"' : '';
      var cur = !isVariations && (App.engine.recordOf("skill:" + skillUi.tab) || {}).exerciseId === id;
      return '<button class="skill-rung' + (cur ? ' is-current' : '') + '" data-skillguide="' + id + '" type="button"' + (cur ? ' aria-current="step"' : '') + '>' +
        '<span class="skill-rung__lvl"' + badgeStyle + '>' + badge + '</span>' +
        '<span class="skill-rung__main">' +
          '<span class="skill-rung__name">' + esc(ex.name) + '</span>' +
          '<span class="skill-rung__sub">' + unit + ' · ' + equip + (cur ? ' · <b>your rung</b>' : '') + '</span>' +
        '</span>' +
        '<svg class="skill-rung__chev ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>' +
      '</button>';
    }).join("");

    body.innerHTML =
      (isVariations ? "" : trainPanelHtml(skillUi.tab, s)) +
      '<div class="skill-intro"><p>' + esc(track.intro) + '</p></div>' +
      '<div class="skill-track">' + rungs + '</div>';
    if (!isVariations) wireTrainPanel(el, s, skillUi.tab);
  }

  function wireSkills(el, s) {
    el.querySelectorAll("[data-skilltab]").forEach(function (b) {
      b.addEventListener("click", function () {
        skillUi.tab = b.dataset.skilltab;
        el.querySelectorAll("[data-skilltab]").forEach(function (x) { x.classList.toggle("is-active", x === b); });
        drawSkillBody(el, s);
        wireSkillGuides(el);
      });
    });
    wireSkillGuides(el);
  }

  function wireSkillGuides(el) {
    el.querySelectorAll("[data-skillguide]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (typeof window.openGuideModalGlobal === "function") {
          window.openGuideModalGlobal(b.dataset.skillguide);
        }
      });
    });
  }

  /* ----------------------------------------------------------------------
     5) MOUNT
     -------------------------------------------------------------------- */
  function mount() { App.registerView("skills", renderSkills); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

})();

/* ===== BASALT script block 8 (source lines 7950-8801) ===== */
/* ============================================================================
   IRONFRAME — PART 7 · RUNNING ENGINE
   ----------------------------------------------------------------------------
   A self-contained running coach that:
     - lets the user pick a goal ("from nothing"): Base/5K, Stamina, or Sprint
     - generates a week-by-week progressive plan on FIXED weekdays (Wed / Sat /
       Sun). The lifting does not use fixed weekdays — it follows your last
       session — so the two are not kept apart by construction: a hard run that
       lands on a squat or hinge day says so, and can move a day (plan D6)
     - schedules every run on a real date counted from the program start; a week
       you did not log is never skipped silently: you repeat it or move on
     - logs completed runs (distance, time, effort), tracks a running streak
     - drives interval sessions with the shared App.startTimer countdown
     - surfaces the plan into the Progress training calendar so lift + run days
       sit side by side and visibly interlock

   Reuses App.lib / App.engine / App.ui / App.util - adds App.run as its API.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.App) { console.error("[running] App core missing"); return; }

  var App  = window.App;
  var lib  = App.lib;
  var esc  = (App.util && App.util.escapeHtml) ? App.util.escapeHtml : function (x) { return String(x == null ? "" : x); };

  /* ----------------------------------------------------------------------
     0) LOCAL DATE HELPERS (local-midnight safe, mirrors the Part-5 calendar fix)
     -------------------------------------------------------------------- */
  function localFromKey(key) {                // "YYYY-MM-DD" -> local-midnight Date
    var p = String(key).split("-");
    return new Date(+p[0], (+p[1]) - 1, +p[2]);
  }
  function todayLocal() { return localFromKey(lib.today()); }
  function addDaysLocal(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function keyOf(d) { return lib.dayKey(d); }
  var DOW_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var MONTHS_3  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function fmtClock(sec) { sec = Math.max(0, Math.round(sec)); var m = Math.floor(sec / 60), s = sec % 60; return m + ":" + (s < 10 ? "0" : "") + s; }
  function fmtDur(sec) {
    sec = Math.max(0, Math.round(sec)); var m = Math.round(sec / 60);
    if (m < 60) return m + " min";
    var h = Math.floor(m / 60); return h + "h " + (m % 60) + "m";
  }

  /* ----------------------------------------------------------------------
     1) GOAL DEFINITIONS + PLAN GENERATORS
     Every plan is built "from nothing": week 1 always opens with walk/run or
     very easy efforts. A plan is an array of WEEKS; each week is an array of
     three sessions matching runDays [Wed, Sat, Sun]. A session is:
       { kind, title, sub, distanceKm, durationSec, intervals:[{label,detail,sec}] }
     intervals (optional) power the in-app interval timer.
     -------------------------------------------------------------------- */

  function walkRun(runSec, walkSec, rounds, note) {
    var ivls = [{ label: "Warm-up walk", detail: "brisk, loosen up", sec: 300 }];
    for (var i = 0; i < rounds; i++) {
      ivls.push({ label: "Run " + (i + 1), detail: "easy, conversational", sec: runSec });
      if (i < rounds - 1 || walkSec) ivls.push({ label: "Walk " + (i + 1), detail: "recover", sec: walkSec });
    }
    ivls.push({ label: "Cool-down walk", detail: "ease the heart rate down", sec: 300 });
    var work = rounds * (runSec + walkSec);
    return {
      kind: "walkrun",
      title: "Walk / Run intervals",
      sub: note || (rounds + " x (" + Math.round(runSec / 60 * 10) / 10 + " min run / " + Math.round(walkSec / 60 * 10) / 10 + " min walk)"),
      durationSec: work + 600,
      distanceKm: Math.round((work / 60) * 0.13 * 10) / 10,
      intervals: ivls
    };
  }

  function easyRun(min, label, kind) {
    return {
      kind: kind || "easy",
      title: label || "Easy continuous run",
      sub: "Hold a pace you could talk through the whole way.",
      durationSec: min * 60,
      distanceKm: Math.round((min / 6.2) * 10) / 10,
      intervals: [
        { label: "Warm-up walk/jog", detail: "ease in", sec: 180 },
        { label: "Easy run", detail: "conversational pace", sec: min * 60 },
        { label: "Cool-down walk", detail: "settle", sec: 180 }
      ]
    };
  }

  function tempoRun(easyMin, tempoMin) {
    return {
      kind: "tempo",
      title: "Tempo run",
      sub: easyMin + " min easy -> " + tempoMin + " min steady-hard -> " + easyMin + " min easy.",
      durationSec: (easyMin * 2 + tempoMin) * 60,
      distanceKm: Math.round(((easyMin * 2) / 6.2 + tempoMin / 5.2) * 10) / 10,
      intervals: [
        { label: "Warm-up", detail: easyMin + " min easy", sec: easyMin * 60 },
        { label: "Tempo block", detail: "comfortably hard, controlled", sec: tempoMin * 60 },
        { label: "Cool-down", detail: easyMin + " min easy", sec: easyMin * 60 }
      ]
    };
  }

  function longRun(min) {
    return {
      kind: "long",
      title: "Long easy run",
      sub: "The week's key session - keep it slow, build time on feet.",
      durationSec: min * 60,
      distanceKm: Math.round((min / 6.5) * 10) / 10,
      intervals: [
        { label: "Warm-up walk/jog", detail: "ease in", sec: 300 },
        { label: "Long easy run", detail: "relaxed, steady breathing", sec: min * 60 },
        { label: "Cool-down walk", detail: "settle", sec: 300 }
      ]
    };
  }

  function intervals(repSec, recSec, reps, label, kind) {
    var ivls = [{ label: "Warm-up jog", detail: "easy, then 3-4 strides", sec: 600 }];
    for (var i = 0; i < reps; i++) {
      ivls.push({ label: "Rep " + (i + 1), detail: label || "fast & controlled", sec: repSec });
      ivls.push({ label: "Recovery " + (i + 1), detail: "walk / slow jog", sec: recSec });
    }
    ivls.push({ label: "Cool-down jog", detail: "easy", sec: 600 });
    var work = reps * (repSec + recSec);
    return {
      kind: kind || "interval",
      title: (label || "Intervals"),
      sub: reps + " x " + (repSec >= 60 ? Math.round(repSec / 60 * 10) / 10 + " min" : repSec + "s") + " hard, " + (recSec >= 60 ? Math.round(recSec / 60) + " min" : recSec + "s") + " recovery.",
      durationSec: work + 1200,
      distanceKm: Math.round((reps * repSec / 60 * 0.27 + (work) / 60 * 0.08) * 10) / 10,
      intervals: ivls
    };
  }

  function rest(note) { return { kind: "rest", title: "Optional rest / cross-train", sub: note || "Walk, mobility or full rest. Listen to the legs.", distanceKm: 0, durationSec: 0, intervals: null }; }

  /* ----------------------------------------------------------------------
     VO2 MAX SESSIONS
     The two protocols with the most evidence behind them, kept structurally
     honest rather than "hard bits with a stopwatch":

       4x4   4 min at 90-95% / 3 min easy, x4. The most-studied VO2 max
             session there is - Helgerud et al. (2007) measured roughly a 7%
             gain over 8 weeks against matched-volume continuous running.
             The 3 minutes is not padding: dropping it shortens the time
             spent near VO2 max on the rep that follows.

       30/30 30s hard / 30s easy. Billat's protocol. Accumulates time near
             VO2 max at a fraction of the perceived cost of 4x4, which makes
             it the way IN to interval work rather than a weaker version.

     Effort is prescribed by breathing, not pace or heart rate - the target
     is reachable on any terrain and needs no hardware. `hrHint` carries the
     optional zone text, which the view fills in only when a date of birth
     is on file.
     -------------------------------------------------------------------- */
  var HARD_FEEL = "a sentence breaks into 2-3 pieces";

  function fourByFour(reps) {
    reps = reps || 4;
    var ivls = [{ label: "Warm-up", detail: "10 min easy, finish with 3 strides", sec: 600 }];
    for (var i = 0; i < reps; i++) {
      ivls.push({ label: "Hard " + (i + 1) + "/" + reps, detail: "90-95% - " + HARD_FEEL, sec: 240 });
      ivls.push({ label: "Recover " + (i + 1), detail: "slow jog, let the breathing come back", sec: 180 });
    }
    ivls.push({ label: "Cool-down", detail: "5 min easy", sec: 300 });
    var hardMin = reps * 4, easyMin = (600 + reps * 180 + 300) / 60;
    return {
      kind: "vo2", title: "Norwegian 4x4",
      sub: reps + " x 4 min hard / 3 min easy. The session that does the most for VO2 max.",
      durationSec: 600 + reps * 420 + 300,
      distanceKm: Math.round((hardMin * 0.22 + easyMin * 0.12) * 10) / 10,
      hrHint: "90-95% of max",
      intervals: ivls
    };
  }

  function thirtyThirty(reps) {
    reps = reps || 12;
    var ivls = [{ label: "Warm-up", detail: "10 min easy, finish with 3 strides", sec: 600 }];
    for (var i = 0; i < reps; i++) {
      ivls.push({ label: "Hard " + (i + 1) + "/" + reps, detail: "fast but repeatable - " + HARD_FEEL, sec: 30 });
      ivls.push({ label: "Easy " + (i + 1), detail: "jog, stay moving", sec: 30 });
    }
    ivls.push({ label: "Cool-down", detail: "5 min easy", sec: 300 });
    var hardMin = reps * 0.5, easyMin = (600 + reps * 30 + 300) / 60;
    return {
      kind: "vo2", title: "30/30 intervals",
      sub: reps + " x 30s hard / 30s easy. Same territory as 4x4, far kinder on the head.",
      durationSec: 600 + reps * 60 + 300,
      distanceKm: Math.round((hardMin * 0.28 + easyMin * 0.12) * 10) / 10,
      hrHint: "88-95% of max",
      intervals: ivls
    };
  }

  /* Week 8. Writes into the VO2 Max pill in Health Records rather than being
     a number the running module keeps to itself. */
  function cooperTest() {
    return {
      kind: "test", title: "Cooper test - re-measure",
      sub: "Run as far as you can in 12 minutes, then log the distance under Health Records -> VO2 Max.",
      durationSec: 12 * 60 + 900,
      distanceKm: 2.4,
      isTest: true,
      intervals: [
        { label: "Thorough warm-up", detail: "10 min easy + 4 strides, then 5 min settle", sec: 900 },
        { label: "12 minutes - go", detail: "even effort you can hold, empty the tank in the last 2", sec: 720 },
        { label: "Cool-down", detail: "5 min very easy walk/jog", sec: 300 }
      ]
    };
  }

  /* ---- BASE / FIRST 5K - 9 weeks ---- */
  function planBase() {
    return [
      [ walkRun(60, 90, 8), walkRun(60, 90, 8, "Repeat - let it feel a touch easier"), rest("A gentle 15-20 min walk if you feel fresh.") ],
      [ walkRun(90, 90, 6), walkRun(90, 90, 7), rest() ],
      [ walkRun(120, 90, 6), walkRun(180, 90, 5), easyRun(12, "Very easy run/walk") ],
      [ walkRun(180, 90, 5), walkRun(300, 150, 4), easyRun(15, "Very easy run") ],
      [ walkRun(300, 120, 3), easyRun(20, "Steady continuous run"), easyRun(15, "Easy run") ],
      [ easyRun(20, "Continuous run"), easyRun(25, "Continuous run"), easyRun(18, "Easy run") ],
      [ easyRun(25, "Continuous run"), easyRun(28, "Continuous run"), easyRun(20, "Easy run") ],
      [ easyRun(28, "Continuous run"), longRun(32), easyRun(22, "Easy run") ],
      [ easyRun(25, "Shake-out run"), longRun(35), { kind: "long", title: "First 5K", sub: "Run the full 5K continuously - settle in and finish strong.", distanceKm: 5, durationSec: 33 * 60, intervals: [ { label: "Warm-up walk/jog", detail: "ease in", sec: 300 }, { label: "5K - go", detail: "steady, then push the last km", sec: 33 * 60 }, { label: "Cool-down walk", detail: "celebrate", sec: 300 } ] } ]
    ];
  }

  /* ---- STAMINA / AEROBIC BASE - 12 weeks ---- */
  function planStamina() {
    var weeks = [];
    var longMin = 20;
    var easyMin = 15;
    for (var w = 0; w < 12; w++) {
      var isCut = (w + 1) % 4 === 0;
      var wed = (w < 2)
        ? easyRun(easyMin, "Easy run")
        : (w % 2 === 0 ? tempoRun(8, Math.min(8 + Math.floor(w / 2) * 2, 20)) : easyRun(easyMin + 2, "Easy run"));
      var sat = longRun(isCut ? Math.round(longMin * 0.7) : longMin);
      var sun = easyRun(Math.max(15, Math.round(easyMin * (isCut ? 0.8 : 1))), "Easy recovery run");
      weeks.push([wed, sat, sun]);
      if (!isCut) { longMin += 6; easyMin += 1; }
    }
    return weeks;
  }

  /* ---- SPRINT / SPEED - 10 weeks ---- */
  function planSprint() {
    return [
      [ easyRun(15, "Easy run + 4 strides"), easyRun(18, "Easy run"), rest() ],
      [ easyRun(18, "Easy run + 6 strides"), easyRun(20, "Easy run"), easyRun(15, "Easy run") ],
      [ intervals(20, 100, 6, "Strides - build to fast", "interval"), easyRun(22, "Easy run"), easyRun(15, "Easy run") ],
      [ intervals(30, 120, 6, "30s fast", "interval"), easyRun(22, "Easy run + strides"), easyRun(15, "Easy run") ],
      [ intervals(45, 150, 6, "150-200m efforts", "interval"), easyRun(24, "Easy run"), easyRun(16, "Easy run") ],
      [ intervals(30, 120, 8, "30s near-max", "sprint"), easyRun(24, "Easy run + strides"), easyRun(16, "Easy run") ],
      [ intervals(20, 120, 8, "100m sprints", "sprint"), tempoRun(8, 10), easyRun(16, "Easy run") ],
      [ intervals(20, 150, 10, "100m sprints", "sprint"), easyRun(24, "Easy run + strides"), easyRun(18, "Easy run") ],
      [ intervals(15, 150, 10, "60-80m max sprints", "sprint"), easyRun(22, "Easy run"), easyRun(16, "Easy run") ],
      [ intervals(15, 180, 8, "Max sprints - sharp & rested", "sprint"), easyRun(18, "Shake-out + strides"), { kind: "sprint", title: "Time-trial", sub: "Test day: a flat-out 100m and a 400m, fully rested between.", distanceKm: 1.5, durationSec: 20 * 60, intervals: [ { label: "Thorough warm-up", detail: "jog + drills + strides", sec: 900 }, { label: "100m - flat out", detail: "max effort", sec: 18 }, { label: "Full recovery", detail: "walk it off", sec: 300 }, { label: "400m - flat out", detail: "controlled then empty the tank", sec: 80 }, { label: "Cool-down jog", detail: "easy", sec: 600 } ] } ]
    ];
  }

  /* ---- VO2 MAX - 8 weeks ----
     Two base weeks before anything hard, one hard session a week until week 6,
     never two hard days in a row, a deload at week 4, and a re-test at week 8.
     The ordering is the safety guard: 4x4 in week 1 on no base is how people
     get hurt or quit, so the intervals are earned rather than offered. */
  function planVo2max() {
    return [
      /* Wed                                  Sat                          Sun */
      [ easyRun(25, "Easy run"),              longRun(40),                 easyRun(25, "Easy recovery run") ],
      [ easyRun(30, "Easy run + 4 strides"),  longRun(50),                 easyRun(25, "Easy recovery run") ],
      [ thirtyThirty(12),                     longRun(50),                 easyRun(25, "Easy recovery run") ],
      [ easyRun(20, "Easy run + strides"),    longRun(45),                 rest("Deload week - the adaptation happens now, not in another session.") ],
      [ fourByFour(4),                        longRun(55),                 easyRun(30, "Easy recovery run") ],
      [ thirtyThirty(16),                     tempoRun(8, 20),             easyRun(30, "Easy recovery run") ],
      [ fourByFour(4),                        longRun(60),                 easyRun(30, "Easy recovery run") ],
      [ easyRun(20, "Shake-out + strides"),   cooperTest(),                rest("Rest, then log the test if you haven't.") ]
    ];
  }

  /* Optional heart-rate overlay for the hard sessions. Tanaka (208 - 0.7*age)
     rather than 220-age, which drifts badly at both ends of the age range.
     Either formula still scatters about +/-10 bpm around a person's true
     HRmax, so this renders as a labelled estimate beside a feel-based target,
     never as the target itself. Returns null when there's no date of birth on
     file, in which case the session just says what it should feel like. */
  function hrZone(hint) {
    if (!hint || !window.Hub || !Hub.state) return null;
    var dob = ((Hub.state.logs || {}).profile || {}).dob;
    if (!dob) return null;
    var age = Math.floor(Hub.daysBetween(dob, Hub.today()) / 365.25);
    if (!(age > 0 && age < 120)) return null;
    var pct = /(\d+)\s*-\s*(\d+)%/.exec(hint);
    if (!pct) return null;
    var hrmax = 208 - 0.7 * age;
    return {
      lo: Math.round(hrmax * (+pct[1]) / 100),
      hi: Math.round(hrmax * (+pct[2]) / 100),
      hrmax: Math.round(hrmax)
    };
  }

  var GOALS = {
    vo2max: {
      id: "vo2max", name: "VO2 Max", tag: "Aerobic ceiling - 8 weeks",
      desc: "Raise the size of the engine itself with 4x4 and 30/30 intervals, on a base of easy running. Ends with a Cooper re-test so you find out whether it worked on you.",
      weeks: 8, sessionsHint: "3 runs / week",
      entryHint: "needs a light running base",
      icon: '<path d="M12 21a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM12 9v4l2.5 2.5M12 5V2M9 2h6"/>',
      build: planVo2max
    },
    base: {
      id: "base", name: "First 5K", tag: "Couch to 5K - 9 weeks",
      desc: "Start with walk/run intervals and build, week by week, to running 5K non-stop. The gentlest on-ramp if you're starting from zero.",
      weeks: 9, sessionsHint: "3 runs / week", icon: '<path d="M13 4a1.5 1.5 0 1 0 0-.01M9 21l2.5-5 2-2.5 1.5 3 3 1.5M7 13l1.5-4.5L13 7l3 2 2.5-.5M5 9l3-1"/>',
      build: planBase
    },
    stamina: {
      id: "stamina", name: "Stamina", tag: "Aerobic base - 12 weeks",
      desc: "Build deep endurance: easy mileage plus a steadily growing long run and light tempo work. The engine behind every distance goal.",
      weeks: 12, sessionsHint: "3 runs / week", icon: '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
      build: planStamina
    },
    sprint: {
      id: "sprint", name: "Sprint", tag: "Speed - 10 weeks",
      desc: "Lay a short aerobic base, then layer in strides and progressively sharper sprint repeats to build raw speed and power from nothing. A short hill works for any sprint session.",
      weeks: 10, sessionsHint: "3 runs / week", icon: '<path d="M5 12h14M13 5l7 7-7 7"/>',
      build: planSprint
    }
  };

  /* ----------------------------------------------------------------------
     2) RUNNING ENGINE - App.run
     -------------------------------------------------------------------- */
  function S() { return App.getState(); }
  function R() {
    var s = S();
    if (!s.running) s.running = { goal: null, startISO: null, runDays: [3, 6, 0], runLog: [], streak: { count: 0, lastISO: null, best: 0 }, weekOffset: 0, askedWeek: null, moved: {} };
    if (!s.running.runDays) s.running.runDays = [3, 6, 0];
    if (typeof s.running.weekOffset !== "number") s.running.weekOffset = 0;
    if (!s.running.moved) s.running.moved = {};
    if (!s.running.runLog) s.running.runLog = [];
    if (!s.running.streak) s.running.streak = { count: 0, lastISO: null, best: 0 };
    return s.running;
  }

  var run = {
    GOALS: GOALS,

    isActive: function () { return !!(R().goal && R().startISO); },
    goalDef: function () { var g = R().goal; return g ? GOALS[g] : null; },
    plan: function () { var g = run.goalDef(); return g ? g.build() : []; },

    start: function (goalId) {
      if (!GOALS[goalId]) return;
      var r = R();
      r.goal = goalId;
      var t = todayLocal();
      var mondayOffset = (t.getDay() + 6) % 7;
      r.startISO = keyOf(addDaysLocal(t, -mondayOffset));
      r.weekOffset = 0; r.askedWeek = null; r.moved = {};
      App.saveState();
    },

    clear: function () {
      var r = R(); r.goal = null; r.startISO = null;
      r.weekOffset = 0; r.askedWeek = null; r.moved = {};
      App.saveState();
    },

    /* Weeks since the start, by the calendar alone. */
    calendarWeekFor: function (date) {
      var r = R(); if (!r.startISO) return 0;
      return Math.floor(lib.daysBetween(r.startISO, keyOf(date)) / 7);
    },

    /* The plan week a date falls in: the calendar week less the weeks you
       chose to repeat. Time alone moves it only until a week goes unlogged;
       then missedWeek() asks, and the plan waits for the answer's effect. */
    weekIndexFor: function (date) {
      return run.calendarWeekFor(date) - R().weekOffset;
    },

    currentWeek: function () {
      var idx = run.weekIndexFor(todayLocal());
      var plan = run.plan();
      return lib.clamp(idx, 0, Math.max(0, plan.length - 1));
    },

    totalWeeks: function () { return run.plan().length; },

    isComplete: function () {
      if (!run.isActive()) return false;
      return run.weekIndexFor(todayLocal()) >= run.totalWeeks();
    },

    weekSchedule: function (weekIdx) {
      var r = R(); var plan = run.plan();
      if (!plan.length || !r.startISO) return [];
      var clampIdx = lib.clamp(weekIdx, 0, plan.length - 1);
      var week = plan[clampIdx];
      /* A repeated week pushes every later week back, so plan week w sits
         at calendar week w + weekOffset. Weeks from before a repeat shift
         with it: their logged runs still show in Recent runs, but the week
         preview no longer ticks them off. */
      var weekMonday = addDaysLocal(localFromKey(r.startISO), (clampIdx + r.weekOffset) * 7);
      var byKey = run.logByDay();
      return r.runDays.map(function (dow, i) {
        var off = (dow + 6) % 7;          // Mon=0 .. Sun=6
        var d = addDaysLocal(weekMonday, off);
        var planned = keyOf(d), k = planned;
        var to = r.moved[planned];
        if (to) { d = localFromKey(to); k = to; }
        return { date: d, key: k, dow: d.getDay(), plannedKey: planned, moved: !!to,
                 session: week[i] || rest(), done: !!byKey[k], log: byKey[k] || null };
      }).sort(function (a, b) { return a.date - b.date; });
    },

    thisWeek: function () { return run.weekSchedule(run.currentWeek()); },

    nextRun: function () {
      var plan = run.plan(); if (!plan.length) return null;
      var todayKey = lib.today();
      for (var w = run.currentWeek(); w < plan.length; w++) {
        var sched = run.weekSchedule(w);
        for (var i = 0; i < sched.length; i++) {
          var item = sched[i];
          if (item.session.kind === "rest") continue;
          if (item.key < todayKey) continue;
          if (item.done) continue;
          return { week: w, item: item };
        }
      }
      return null;
    },

    logByDay: function () {
      var map = {};
      (R().runLog || []).forEach(function (l) { map[Hub.dayOf(l.dateISO)] = l; });
      return map;
    },

    plannedByDay: function () {
      var out = {};
      if (!run.isActive()) return out;
      var plan = run.plan();
      for (var w = 0; w < plan.length; w++) {
        run.weekSchedule(w).forEach(function (item) {
          if (item.session.kind !== "rest") out[item.key] = item.session.kind;
        });
      }
      return out;
    },

    /* ---- A13: the plan moves on only when you say so (plan D6) ---- */

    /* The week just behind you, when it holds runs with nothing logged on
       their day: { week, sessions, missed } (week is the plan week index).
       null when there is nothing to ask. Answering stores the calendar week,
       so the question is asked once per week, on every screen. */
    missedWeek: function () {
      if (!run.isActive()) return null;
      var r = R(), cal = run.calendarWeekFor(todayLocal()), cur = cal - r.weekOffset;
      if (cur < 1 || r.askedWeek === cal) return null;
      var prev = cur - 1;
      if (prev >= run.totalWeeks()) return null;
      var sched = run.weekSchedule(prev).filter(function (i) { return i.session.kind !== "rest"; });
      /* Only days already past: a run moved over the week's end is still due. */
      var missed = sched.filter(function (i) { return !i.done && i.key < lib.today(); });
      return missed.length ? { week: prev, sessions: sched.length, missed: missed } : null;
    },

    /* "repeat" runs the missed week again from this week, so every later
       week moves back by one; "move" carries on as the calendar would. */
    answerMissed: function (choice) {
      var r = R();
      if (!run.missedWeek()) return false;
      if (choice === "repeat") r.weekOffset += 1;
      r.askedWeek = run.calendarWeekFor(todayLocal());
      App.saveState();
      return true;
    },

    /* Undo the last repeat: the plan returns to where it was, and asks again. */
    undoRepeat: function () {
      var r = R();
      if (r.weekOffset < 1) return false;
      r.weekOffset -= 1; r.askedWeek = null;
      App.saveState();
      return true;
    },

    /* ---- A13: a hard run on a squat or hinge day (plan D6) ---- */

    HARD_KINDS: { tempo: 1, interval: 1, sprint: 1, vo2: 1, test: 1 },

    /* { item, type, done, patterns, canMove } when `item` is a hard run that
       shares its day with a squat or hinge session; null otherwise. Only
       today's and the next session are known (App.engine.liftOn). Adjacent days
       are not flagged, so moving a run to tomorrow is not checked against
       tomorrow's lifting. */
    clashFor: function (item, type) {
      if (!item || item.done || !run.HARD_KINDS[item.session.kind]) return null;
      /* `type` is a day the workout screen is previewing; without it, the
         session the engine says is on that day. */
      var lift = type ? { type: type, done: false } : App.engine.liftOn(item.key);
      if (!lift) return null;
      var legs = App.engine.patternsFor(lift.type, (S().prefs || {}).sessionLength).filter(function (p) {
        return p === "squat" || p === "hinge";
      });
      if (!legs.length) return null;
      var tomorrow = lib.dayKey(lib.addDays(item.key, 1));
      return { item: item, type: lift.type, done: lift.done, chosen: !!type, patterns: legs,
               tomorrow: tomorrow, canMove: !run.plannedByDay()[tomorrow] && !run.logByDay()[tomorrow] };
    },

    /* Move a planned run to the day after the day it is on now. */
    moveRun: function (plannedKey, fromKey) {
      R().moved[plannedKey] = lib.dayKey(lib.addDays(fromKey, 1));
      App.saveState();
    },
    unmoveRun: function (plannedKey) { delete R().moved[plannedKey]; App.saveState(); },

    logRun: function (entry) {
      var r = R();
      var nowISO = entry.dateISO || lib.iso();
      var rec = {
        id: "run_" + Date.now(),
        dateISO: nowISO,
        kind: entry.kind || "easy",
        title: entry.title || "Run",
        distanceKm: Math.max(0, Number(entry.distanceKm) || 0),
        durationSec: Math.max(0, Math.round(Number(entry.durationSec) || 0)),
        rpe: entry.rpe || null,
        notes: entry.notes || "",
        updatedAt: new Date().toISOString()   // a re-log keeps the id; this makes it win on sync
      };
      var k = Hub.dayOf(nowISO);
      /* Re-logging a day replaces its run under the SAME id. A new id made the
         replacement a delete plus an add, and sync's union by id brought the
         old run back beside the new one: 5 km re-logged as 6 km read 11 km. */
      var prev = (r.runLog || []).filter(function (l) { return Hub.dayOf(l.dateISO) === k; })[0];
      if (prev && prev.id) rec.id = prev.id;
      r.runLog = (r.runLog || []).filter(function (l) { return Hub.dayOf(l.dateISO) !== k; });
      r.runLog.push(rec);
      run._bumpStreak(k);
      App.saveState();
      return rec;
    },

    deleteRun: function (id) {
      var r = R();
      r.runLog = (r.runLog || []).filter(function (l) { return l.id !== id; });
      App.saveState();
    },

    _bumpStreak: function (k) {
      var st = R().streak;
      if (!st.lastISO) { st.count = 1; }
      else {
        var diff = lib.daysBetween(st.lastISO, k);
        if (diff === 0) { /* same day */ }
        else if (diff <= 4) { st.count += 1; }
        else { st.count = 1; }
      }
      st.best = Math.max(st.best || 0, st.count);
      st.lastISO = k;
    },

    totals: function () {
      var log = R().runLog || [];
      return {
        runs: log.length,
        km: Math.round(lib.sum(log, function (x) { return x.distanceKm; }) * 10) / 10,
        sec: lib.sum(log, function (x) { return x.durationSec; }),
        thisWeekRuns: (function () {
          var monday = (function () { var t = todayLocal(); return keyOf(addDaysLocal(t, -((t.getDay() + 6) % 7))); })();
          return log.filter(function (x) { return Hub.dayOf(x.dateISO) >= monday; }).length;
        })()
      };
    },

    /* Dashboard banner — surfaces the active plan or invites starting one. */
    dashboardBanner: function (s) {
      if (run.isActive()) {
        var g = run.goalDef();
        var next = run.nextRun();
        var t = run.totals();
        var curWeek = run.currentWeek();
        var complete = run.isComplete();
        var line;
        if (complete) line = g.name + " plan complete — log freestyle runs or pick a new goal.";
        else if (next) {
          var sess = next.item.session;
          var when = next.item.key === lib.today() ? "today" : (DOW_SHORT[next.item.dow]);
          line = "Next run " + when + ": " + sess.title + (sess.distanceKm ? " · " + sess.distanceKm + " km" : "") + ".";
        } else line = "All caught up this week — nice work.";
        if (run.missedWeek()) line = "Week " + (run.missedWeek().week + 1) + " has runs you did not log: open Running to repeat it or move on. " + line;
        return '<div class="card mt-4" style="border-color:rgba(208,139,208,.28)">' +
          '<div class="card__head"><div class="card__title">Running · ' + esc(g.name) + '</div>' +
            '<span class="badge">week ' + (curWeek + 1) + ' / ' + run.totalWeeks() + '</span></div>' +
          '<div class="row between wrap" style="gap:var(--sp-3)">' +
            '<p class="muted text-sm" style="max-width:46ch;margin:0">' + esc(line) + ' <span class="faint">' + t.thisWeekRuns + '/3 runs this week · ' + t.km + ' km logged.</span></p>' +
            '<button class="btn btn--secondary btn--sm" data-go="running">Open running →</button>' +
          '</div></div>';
      }
      return '<div class="card mt-4" style="border-color:rgba(208,139,208,.28)">' +
        '<div class="row between wrap" style="gap:var(--sp-3)">' +
          '<div><div class="card__title" style="margin-bottom:4px">Add a running plan</div>' +
          '<p class="muted text-sm" style="max-width:48ch;margin:0">Build endurance or speed from nothing — BASALT schedules runs on Wed / Sat / Sun and tells you when a hard one lands on a squat or hinge day.</p></div>' +
          '<button class="btn btn--secondary btn--sm" data-go="running">Choose a goal →</button>' +
        '</div></div>';
    }
  };

  App.run = run;

  /* ----------------------------------------------------------------------
     2b) THE TWO A13 NOTES, shared by the Running view and the Today tab
     -------------------------------------------------------------------- */
  function dayText(key) { return key === lib.today() ? "today" : lib.fmtDate(key); }

  /* The note for a hard run on a squat or hinge day (run.clashFor), with
     the move button. It sits on the run's card and on the lifting card. */
  function clashHtml(c) {
    if (!c) return "";
    var sess = c.item.session, label = App.engine.DAY_LABEL[c.type] || c.type, legs = c.patterns.join(" and ");
    var lead = c.done ? 'You trained ' + label + ' today, which works ' + legs + '.'
      : c.chosen ? 'Today\'s ' + label + ' session trains ' + legs + '.'
      : label + ' is your next session, ' + dayText(c.item.key) + ', and it trains ' + legs + '.';
    var move = c.canMove
      ? '<button class="btn btn--secondary btn--sm" data-run-move="' + esc(c.item.plannedKey) + '|' + esc(c.item.key) + '" type="button">Move run to ' +
        (c.item.key === lib.today() ? "tomorrow" : esc(lib.fmtDate(c.tomorrow))) + '</button>'
      : '<span class="faint text-xs">The next day already has a run, so there is no move to offer.</span>';
    return '<div class="wh-advice wh-advice--warn mt-4" data-run-clash role="status"><div>' +
      '<div class="wh-advice__title">A hard run on a ' + esc(legs) + ' day</div>' +
      '<p class="wh-advice__body" style="margin:var(--sp-2) 0">' + esc(lead) + ' ' + esc(sess.title) + ' (' + esc(kindLabel(sess.kind)) + ') is planned for the same day, ' +
        'and a hard run takes from the same legs. Only today\'s and your next session are checked, not the day after.</p>' +
      move + '</div></div>';
  }

  /* The question for an unlogged week (run.missedWeek). */
  function missedHtml(m) {
    var days = m.missed.map(function (i) { return esc(lib.fmtDate(i.key)); }).join("; ");
    return '<div class="wh-advice wh-advice--info mt-4" data-run-missed role="status"><div>' +
      '<div class="wh-advice__title">Week ' + (m.week + 1) + ' has runs you did not log</div>' +
      '<p class="wh-advice__body" style="margin:var(--sp-2) 0">Nothing is logged on the day for ' + days + ' (' + m.missed.length + ' of ' + m.sessions +
        ' sessions). The plan does not skip a week by itself. <b>Repeat week ' + (m.week + 1) + '</b> runs it again from this week and moves every later week back by one; ' +
        '<b>Move on</b> goes to week ' + (m.week + 2) + '. A run you logged on another day is in Recent runs, but only a log on the planned day ticks it off.</p>' +
      '<div class="row" style="gap:var(--sp-2);flex-wrap:wrap"><button class="btn btn--secondary btn--sm" data-run-repeat type="button">Repeat week ' + (m.week + 1) + '</button>' +
      '<button class="btn btn--ghost btn--sm" data-run-moveon type="button">Move on</button></div></div></div>';
  }

  function wireNotes(el) {
    var go = function (sel, fn) { el.querySelectorAll(sel).forEach(function (b) { b.addEventListener("click", function () { fn(b); }); }); };
    go("[data-run-move]", function (b) {
      var p = b.getAttribute("data-run-move").split("|");
      run.moveRun(p[0], p[1]);
      App.toast("Run moved to " + lib.fmtDate(R().moved[p[0]]) + ". Put it back from its row on the Running tab.", "success", 4800);
      runUi.weekView = null; App.refresh();
    });
    go("[data-run-unmove]", function (b) { run.unmoveRun(b.getAttribute("data-run-unmove")); runUi.weekView = null; App.refresh(); });
    go("[data-run-repeat]", function () {
      var m = run.missedWeek();
      if (m && run.answerMissed("repeat")) App.toast("Repeating week " + (m.week + 1) + ". Every later week moves back by one.", "success", 4800);
      runUi.weekView = null; App.refresh();
    });
    go("[data-run-moveon]", function () {
      var m = run.missedWeek();
      if (m && run.answerMissed("move")) App.toast("Moving on to week " + (m.week + 2) + ".", "info");
      runUi.weekView = null; App.refresh();
    });
  }
  run.clashHtml = clashHtml; run.wireNotes = wireNotes;

  /* ----------------------------------------------------------------------
     3) VIEW STATE
     -------------------------------------------------------------------- */
  var runUi = { weekView: null };

  /* ----------------------------------------------------------------------
     4) RENDER
     -------------------------------------------------------------------- */
  function renderRunning(el, s) {
    if (!run.isActive()) { renderGoalPicker(el, s); return; }
    renderPlan(el, s);
  }

  function pageHead(s) {
    return '<div class="page-head row between wrap">' +
      '<div><div class="eyebrow">Cardio engine</div><h1 class="display h2">Running</h1></div>' +
      App.ui.eraBadge(s) +
    '</div>';
  }

  /* ---- GOAL PICKER ---- */
  function renderGoalPicker(el, s) {
    var cards = Object.keys(GOALS).map(function (id) {
      var g = GOALS[id];
      return '<button class="run-goal" data-rungoal="' + id + '" type="button">' +
        '<div class="run-goal__ic"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + g.icon + '</svg></div>' +
        '<div class="run-goal__name">' + esc(g.name) + '</div>' +
        '<div class="run-goal__tag">' + esc(g.tag) + '</div>' +
        '<div class="run-goal__desc">' + esc(g.desc) + '</div>' +
        '<div class="run-goal__meta">' +
          '<span class="run-goal__chip">' + g.weeks + ' weeks</span>' +
          '<span class="run-goal__chip">' + esc(g.sessionsHint) + '</span>' +
          '<span class="run-goal__chip">' + esc(g.entryHint || "starts from zero") + '</span>' +
        '</div>' +
      '</button>';
    }).join("");

    el.innerHTML =
      pageHead(s) +
      '<p class="muted text-sm" style="max-width:64ch;margin-bottom:var(--sp-5)">' +
        'Pick a goal and BASALT builds a week-by-week plan on Wednesday, Saturday and Sunday. ' +
        'Every plan starts from walking and easy efforts, no base required.' +
      '</p>' +
      '<div class="run-goal-grid">' + cards + '</div>' +
      '<div class="card card--glass mt-6">' +
        '<div class="card__head"><div class="card__title">How it sits beside your lifting</div></div>' +
        '<p class="faint text-xs"><b>Runs have fixed days; lifting does not.</b> Runs fall on Wed, Sat and Sun. Your lifting follows your last session and your template\'s rest rule, so it can land on any weekday, and a hard run (tempo, intervals, sprints, VO2 max or a test) can share a day with a squat or hinge session. ' +
        'When that is true for today or your next session, the run card and the workout card both say so, and the run can move a day. Later lifting days are your call and are not projected, so they are not checked. ' +
        'A week you did not log is never skipped by the calendar alone: the plan asks whether to repeat it. Long runs and easy runs are not treated as hard.</p>' +
      '</div>';

    wireGoalPicker(el, s);
  }

  function wireGoalPicker(el, s) {
    el.querySelectorAll("[data-rungoal]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.dataset.rungoal;
        var g = GOALS[id];
        App.ui.confirm(
          "Start the " + g.name + " plan?",
          g.tag + ". Runs schedule onto Wed / Sat / Sun, starting this week from easy efforts.",
          "Start plan", "primary",
          function () {
            run.start(id);
            App.toast(g.name + " plan started - first run is on the schedule.", "success");
            renderRunning(el, App.getState());
          }
        );
      });
    });
  }

  /* ---- LIVE PLAN ---- */
  function renderPlan(el, s) {
    var g = run.goalDef();
    var curWeek = run.currentWeek();
    if (runUi.weekView == null) runUi.weekView = curWeek;
    var totals = run.totals();
    var complete = run.isComplete();
    var next = run.nextRun();

    el.innerHTML =
      pageHead(s) +
      (run.missedWeek() ? missedHtml(run.missedWeek()) : "") +
      heroRun(g, next, complete, curWeek) +
      '<div class="run-stat-row mt-6">' +
        App.util.statTile("Plan", g.name, complete ? "plan complete" : "week " + (curWeek + 1) + " / " + run.totalWeeks()) +
        App.util.statTile("Run streak", String(R().streak.count), R().streak.best ? "best " + R().streak.best : "log a run") +
        App.util.statTile("This week", totals.thisWeekRuns + "/3", totals.thisWeekRuns >= 3 ? "all done" : "runs logged") +
        App.util.statTile("Total", totals.km + '<small>km</small>', totals.runs + " runs - " + fmtDur(totals.sec)) +
      '</div>' +
      '<div class="card mt-6">' +
        '<div class="card__head"><div class="card__title">' + esc(g.name) + ' - plan weeks</div>' +
          '<span class="badge">' + esc(g.tag) + '</span></div>' +
        '<div class="run-ladder">' + ladder(curWeek) + '</div>' +
        '<p class="faint text-xs mt-3">Tap a week to preview its sessions. Runs sit on Wed / Sat / Sun. Your lifting follows your last session instead, so a hard run can land on a squat or hinge day; the card says so when it does.</p>' +
      '</div>' +
      '<div class="card mt-4">' +
        '<div class="card__head"><div class="card__title">Sessions - week ' + (runUi.weekView + 1) + '</div>' +
          '<span class="badge badge--primary"><span class="dot"></span>Wed - Sat - Sun</span></div>' +
        '<div class="run-week" id="run-week-body">' + weekRows(runUi.weekView) + '</div>' +
      '</div>' +
      recentRunsCard(s) +
      '<div class="row wrap mt-6" style="gap:var(--sp-2)">' +
        '<button class="btn btn--ghost btn--sm" data-rungo="progress">See it on the calendar -></button>' +
        '<button class="btn btn--ghost btn--sm" id="run-log-free">Log a freestyle run</button>' +
        '<button class="btn btn--ghost btn--sm" id="run-change-goal">Change goal</button>' +
      '</div>' +
      '<p class="faint text-xs mt-6 mono">RUNNING ONLINE - ' + totals.runs + ' runs logged - ' + totals.km + ' km lifetime - plan anchored ' + R().startISO + (R().weekOffset ? ' - ' + R().weekOffset + ' week' + (R().weekOffset > 1 ? 's' : '') + ' repeated' : '') + ' - stored locally.</p>' +
      (R().weekOffset ? '<button class="btn btn--ghost btn--sm mt-3" id="run-unrepeat" type="button">Undo the last repeat</button>' : '');

    wirePlan(el, s);
  }

  function heroRun(g, next, complete, curWeek) {
    if (complete) {
      return '<div class="card card--accent card--pad-lg stack">' +
        '<div><div class="eyebrow">Plan complete</div>' +
        '<h2 class="display h2" style="margin-top:var(--sp-1)">' + esc(g.name) + ' - done</h2>' +
        '<p class="muted text-sm" style="max-width:52ch">You finished every week. Log runs freely, restart this plan, or pick a new goal to keep the engine building.</p></div>' +
        '<div class="row wrap" style="gap:var(--sp-2)">' +
          '<button class="btn btn--primary" id="run-log-free"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>Log a run</button>' +
          '<button class="btn btn--ghost" id="run-restart">Restart plan</button>' +
          '<button class="btn btn--ghost" id="run-change-goal-2">New goal</button>' +
        '</div>' +
      '</div>';
    }
    if (!next) {
      return '<div class="card card--accent card--pad-lg stack">' +
        '<div><div class="eyebrow">Up next</div><h2 class="display h2" style="margin-top:var(--sp-1)">All caught up</h2>' +
        '<p class="muted text-sm">Nothing outstanding before today. Log a freestyle run any time.</p></div>' +
        '<button class="btn btn--primary" id="run-log-free"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>Log a run</button>' +
      '</div>';
    }
    var item = next.item, sess = item.session;
    var whenTxt = item.key === lib.today() ? "Today" : (DOW_SHORT[item.dow] + " " + item.date.getDate() + " " + MONTHS_3[item.date.getMonth()]);
    return '<div class="card card--accent card--pad-lg stack">' +
      '<div class="row between wrap">' +
        '<div><div class="eyebrow">Next run - ' + esc(whenTxt) + '</div>' +
        '<h2 class="display h2" style="margin-top:var(--sp-1)">' + esc(sess.title) + '</h2>' +
        '<p class="muted text-sm" style="max-width:52ch">' + esc(sess.sub) + '</p></div>' +
        '<span class="run-kind run-kind--' + sess.kind + '">' + kindLabel(sess.kind) + '</span>' +
      '</div>' +
      '<div class="run-day__metrics" style="margin-top:0">' +
        (sess.distanceKm ? '<div class="run-day__metric"><b>' + sess.distanceKm + ' km</b>target distance</div>' : '') +
        (sess.durationSec ? '<div class="run-day__metric"><b>' + fmtDur(sess.durationSec) + '</b>est. time</div>' : '') +
        (next.week !== curWeek ? '<div class="run-day__metric"><b>W' + (next.week + 1) + '</b>plan week</div>' : '') +
      '</div>' +
      clashHtml(run.clashFor(item)) +
      '<button class="btn btn--primary btn--lg btn--block" data-runstart=\'' + encodeSession(item) + '\'>' +
        '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>Start this run -></button>' +
    '</div>';
  }

  function kindLabel(kind) {
    return ({ easy: "Easy", tempo: "Tempo", long: "Long", interval: "Intervals", sprint: "Sprint",
              walkrun: "Walk/Run", rest: "Rest", vo2: "VO2 max", test: "Test" })[kind] || cap(kind);
  }
  function cap(x) { return String(x).charAt(0).toUpperCase() + String(x).slice(1); }

  function ladder(curWeek) {
    var total = run.totalWeeks();
    var out = "";
    for (var w = 0; w < total; w++) {
      var cls = "run-ladder__w" + (w < curWeek ? " is-done" : "") + (w === runUi.weekView ? " is-cur" : "");
      out += '<button class="' + cls + '" data-runweek="' + w + '" type="button">' + (w + 1) + '</button>';
    }
    return out;
  }

  function weekRows(weekIdx) {
    var sched = run.weekSchedule(weekIdx);
    var todayKey = lib.today();
    if (!sched.length) return '<p class="faint text-sm">No sessions for this week.</p>';
    return sched.map(function (item) {
      var sess = item.session;
      var isToday = item.key === todayKey;
      var isRest = sess.kind === "rest";
      var doneCls = item.done ? " is-done" : "";
      var todayCls = isToday ? " is-today" : "";
      var metrics = "";
      if (item.done && item.log) {
        metrics = '<div class="run-day__metrics">' +
          '<div class="run-day__metric"><b>' + (item.log.distanceKm || 0) + ' km</b>logged</div>' +
          '<div class="run-day__metric"><b>' + fmtDur(item.log.durationSec) + '</b>time</div>' +
          (item.log.rpe ? '<div class="run-day__metric"><b>' + item.log.rpe + '/10</b>effort</div>' : '') +
        '</div>';
      } else if (!isRest) {
        metrics = '<div class="run-day__metrics">' +
          (sess.distanceKm ? '<div class="run-day__metric"><b>' + sess.distanceKm + ' km</b>target</div>' : '') +
          (sess.durationSec ? '<div class="run-day__metric"><b>' + fmtDur(sess.durationSec) + '</b>est.</div>' : '') +
        '</div>';
      }
      var act = "";
      if (item.done) {
        act = '<span class="badge badge--success"><span class="dot"></span>done</span>';
      } else if (isRest) {
        act = '<span class="run-kind run-kind--rest">REST</span>';
      } else {
        act = '<button class="btn btn--primary btn--sm" data-runstart=\'' + encodeSession(item) + '\'>Start</button>' +
              '<button class="btn btn--ghost btn--sm" data-runquick=\'' + encodeSession(item) + '\'>Log</button>';
      }
      return '<div class="run-day' + doneCls + todayCls + '">' +
        '<div class="run-day__when"><span class="run-day__dow">' + DOW_SHORT[item.dow] + '</span>' +
          '<span class="run-day__date">' + item.date.getDate() + '</span></div>' +
        '<div class="run-day__main">' +
          '<div class="run-day__title">' + esc(sess.title) + ' <span class="run-kind run-kind--' + sess.kind + '">' + kindLabel(sess.kind) + '</span></div>' +
          '<div class="run-day__sub">' + esc(sess.sub) + '</div>' +
          (item.moved ? '<div class="run-day__sub">Moved from ' + esc(lib.fmtDate(item.plannedKey)) + ' <button class="btn btn--ghost btn--sm" data-run-unmove="' + esc(item.plannedKey) + '" type="button">Put it back</button></div>' : '') +
          metrics +
        '</div>' +
        '<div class="run-day__act">' + act + '</div>' +
      '</div>';
    }).join("");
  }

  function recentRunsCard(s) {
    var log = (R().runLog || []).slice().sort(function (a, b) { return new Date(b.dateISO) - new Date(a.dateISO); }).slice(0, 6);
    if (!log.length) {
      return '<div class="card mt-4"><div class="card__head"><div class="card__title">Recent runs</div></div>' +
        '<p class="faint text-sm">No runs logged yet. Start your next scheduled run above, or log one freestyle.</p></div>';
    }
    var rows = log.map(function (l) {
      var d = lib.parse(l.dateISO);
      return '<div class="run-day" style="padding:var(--sp-3) var(--sp-4)">' +
        '<div class="run-day__when" style="flex-basis:48px"><span class="run-day__dow">' + DOW_SHORT[d.getDay()] + '</span>' +
          '<span class="run-day__date" style="font-size:var(--fs-xl)">' + d.getDate() + '</span></div>' +
        '<div class="run-day__main">' +
          '<div class="run-day__title">' + esc(l.title || kindLabel(l.kind)) + ' <span class="run-kind run-kind--' + l.kind + '">' + kindLabel(l.kind) + '</span></div>' +
          '<div class="run-day__metrics">' +
            '<div class="run-day__metric"><b>' + (l.distanceKm || 0) + ' km</b>distance</div>' +
            '<div class="run-day__metric"><b>' + fmtDur(l.durationSec) + '</b>time</div>' +
            (l.distanceKm > 0 && l.durationSec > 0 ? '<div class="run-day__metric"><b>' + pace(l.distanceKm, l.durationSec) + '</b>/km</div>' : '') +
            (l.rpe ? '<div class="run-day__metric"><b>' + l.rpe + '/10</b>effort</div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="run-day__act"><button class="btn btn--ghost btn--sm" data-rundel="' + l.id + '" aria-label="Delete run">X</button></div>' +
      '</div>';
    }).join("");
    return '<div class="card mt-4"><div class="card__head"><div class="card__title">Recent runs</div>' +
      '<span class="badge">' + (R().runLog || []).length + ' total</span></div>' +
      '<div class="run-week">' + rows + '</div></div>';
  }

  function pace(km, sec) {
    if (!km || !sec) return "-";
    var per = sec / km; var m = Math.floor(per / 60), s = Math.round(per % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function encodeSession(item) {
    var sess = item.session;
    return esc(JSON.stringify({
      key: item.key, dow: item.dow,
      kind: sess.kind, title: sess.title, sub: sess.sub,
      distanceKm: sess.distanceKm, durationSec: sess.durationSec,
      /* Whitelisted, so anything new on a session has to be added here too —
         hrHint drives the effort line in the session modal. */
      hrHint: sess.hrHint || null,
      isTest: sess.isTest || false,
      intervals: sess.intervals || null
    }));
  }
  function decodeSession(str) { try { return JSON.parse(str); } catch (e) { return null; } }

  /* ----------------------------------------------------------------------
     5) WIRING
     -------------------------------------------------------------------- */
  function wirePlan(el, s) {
    wireNotes(el);
    var ur = el.querySelector("#run-unrepeat");
    if (ur) ur.addEventListener("click", function () {
      run.undoRepeat(); runUi.weekView = null;
      App.toast("Last repeat undone. The plan is back where it was.", "info");
      renderRunning(el, App.getState());
    });
    el.querySelectorAll("[data-runweek]").forEach(function (b) {
      b.addEventListener("click", function () {
        runUi.weekView = Number(b.dataset.runweek);
        renderPlan(el, App.getState());
      });
    });
    el.querySelectorAll("[data-runstart]").forEach(function (b) {
      b.addEventListener("click", function () {
        var sess = decodeSession(b.getAttribute("data-runstart"));
        if (sess) openRunSession(sess, el);
      });
    });
    el.querySelectorAll("[data-runquick]").forEach(function (b) {
      b.addEventListener("click", function () {
        var sess = decodeSession(b.getAttribute("data-runquick"));
        if (sess) openLogModal(sess, el);
      });
    });
    el.querySelectorAll("[data-rundel]").forEach(function (b) {
      b.addEventListener("click", function () {
        run.deleteRun(b.dataset.rundel);
        renderRunning(el, App.getState());
      });
    });
    el.querySelectorAll("[data-rungo]").forEach(function (b) {
      b.addEventListener("click", function () { App.showSection(b.dataset.rungo); });
    });
    var lf = el.querySelector("#run-log-free");
    if (lf) lf.addEventListener("click", function () { openLogModal(null, el); });
    var rs = el.querySelector("#run-restart");
    if (rs) rs.addEventListener("click", function () {
      run.start(run.goalDef().id); runUi.weekView = 0;
      App.toast("Plan restarted from week 1.", "success");
      renderRunning(el, App.getState());
    });
    ["#run-change-goal", "#run-change-goal-2"].forEach(function (sel) {
      var cg = el.querySelector(sel);
      if (cg) cg.addEventListener("click", function () {
        App.ui.confirm("Change running goal?", "Your logged runs are kept, but the current plan schedule is cleared so you can pick a new goal.", "Pick new goal", "primary", function () {
          run.clear(); runUi.weekView = null;
          renderRunning(el, App.getState());
        });
      });
    });
  }

  /* ----------------------------------------------------------------------
     6) RUN SESSION MODAL - interval timer + log-on-finish
     -------------------------------------------------------------------- */
  function ensureModal() {
    var m = document.getElementById("modal-run");
    if (m) return m;
    m = document.createElement("div");
    m.className = "modal"; m.id = "modal-run"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    m.innerHTML = '<div class="modal__backdrop" data-close></div><div class="modal__dialog" id="modal-run-dialog"></div>';
    document.body.appendChild(m);
    m.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) App.closeModal("modal-run");
    });
    return m;
  }

  function openRunSession(sess, el) {
    var m = ensureModal();
    var dlg = m.querySelector("#modal-run-dialog");
    var ivls = sess.intervals || [];
    var ivlHtml = ivls.length
      ? '<div class="ivl-list">' + ivls.map(function (iv, i) {
          var timer = iv.sec ? '<button class="mini-timer ivl__timer" data-ivl="' + iv.sec + '" data-ivl-label="' + esc(iv.label) + '" type="button" aria-label="Start timer">' +
            '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg> ' + fmtClock(iv.sec) + '</button>' : "";
          return '<div class="ivl"><span class="ivl__n">' + (i + 1) + '</span>' +
            '<div class="ivl__main"><div class="ivl__label">' + esc(iv.label) + '</div>' +
            '<div class="ivl__detail">' + esc(iv.detail || "") + '</div></div>' + timer + '</div>';
        }).join("") + '</div>'
      : '<p class="muted text-sm mt-4">Head out and run it by feel - there are no fixed intervals for this session.</p>';

    dlg.innerHTML =
      '<div class="modal__head"><div><div class="eyebrow">' + kindLabel(sess.kind) + ' session</div>' +
        '<h3 class="display h3">' + esc(sess.title) + '</h3></div>' +
        '<button class="modal__close" data-close aria-label="Close"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>' +
      '<p class="muted text-sm">' + esc(sess.sub) + '</p>' +
      '<div class="run-day__metrics" style="margin-top:var(--sp-4)">' +
        (sess.distanceKm ? '<div class="run-day__metric"><b>' + sess.distanceKm + ' km</b>target distance</div>' : '') +
        (sess.durationSec ? '<div class="run-day__metric"><b>' + fmtDur(sess.durationSec) + '</b>est. time</div>' : '') +
        (sess.hrHint ? '<div class="run-day__metric"><b>' + esc(sess.hrHint) + '</b>effort on the hard reps</div>' : '') +
      '</div>' +
      (function () {
        if (!sess.hrHint) return '';
        var z = hrZone(sess.hrHint);
        return '<p class="faint text-xs mt-4">Go by breathing first: ' + HARD_FEEL + '. ' +
          (z
            ? 'If you watch heart rate, that is roughly <b>' + z.lo + '-' + z.hi + ' bpm</b> for you — ' +
              'estimated from your date of birth (Tanaka, max about ' + z.hrmax + '), and individual ' +
              'true max sits around ±10 bpm either side of any formula. Treat it as a guide, not a target.'
            : 'Add a date of birth under Health Records → Profile and a rough heart-rate range appears here too.') +
        '</p>';
      })() +
      '<p class="faint text-xs mt-4">Tap the clock on any step to start a countdown - it runs in the corner so you can lock your phone and go.</p>' +
      ivlHtml +
      '<div class="modal__foot">' +
        '<button class="btn btn--ghost" data-close>Close</button>' +
        '<button class="btn btn--primary" id="run-finish">Finish &amp; log -></button>' +
      '</div>';

    dlg.querySelectorAll("[data-ivl]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (App.startTimer) App.startTimer(Number(b.dataset.ivl) || 60, b.dataset.ivlLabel || "Run");
      });
    });
    var fin = dlg.querySelector("#run-finish");
    if (fin) fin.addEventListener("click", function () {
      App.closeModal("modal-run");
      openLogModal(sess, el);
    });

    App.openModal("modal-run");
  }

  function openLogModal(sess, el) {
    var m = ensureModal();
    var dlg = m.querySelector("#modal-run-dialog");
    var defKm = sess && sess.distanceKm ? sess.distanceKm : "";
    var defMin = sess && sess.durationSec ? Math.round(sess.durationSec / 60) : "";
    var title = sess ? sess.title : "Freestyle run";
    var kind = sess ? sess.kind : "easy";

    dlg.innerHTML =
      '<div class="modal__head"><div><div class="eyebrow">Log run</div>' +
        '<h3 class="display h3">' + esc(title) + '</h3></div>' +
        '<button class="modal__close" data-close aria-label="Close"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="set-grid" style="grid-template-columns:1fr 1fr">' +
        '<label class="field"><span class="field__label">Distance (km)</span>' +
          '<input class="input" id="rl-km" type="number" inputmode="decimal" step="0.1" min="0" value="' + defKm + '" placeholder="0.0" /></label>' +
        '<label class="field"><span class="field__label">Time (min)</span>' +
          '<input class="input" id="rl-min" type="number" inputmode="numeric" step="1" min="0" value="' + defMin + '" placeholder="0" /></label>' +
      '</div>' +
      '<div class="field mt-4"><span class="field__label">Effort (RPE 1-10)</span>' +
        '<div class="seg" id="rl-rpe" style="flex-wrap:wrap">' +
          [2,4,6,8,10].map(function (n) { return '<button class="seg__btn" data-rpe="' + n + '" type="button">' + n + '</button>'; }).join("") +
        '</div></div>' +
      '<label class="field mt-4"><span class="field__label">Notes (optional)</span>' +
        '<textarea class="textarea" id="rl-notes" placeholder="How did it feel? Route, weather, niggles..."></textarea></label>' +
      '<input type="hidden" id="rl-kind" value="' + esc(kind) + '" />' +
      '<input type="hidden" id="rl-title" value="' + esc(title) + '" />' +
      '<input type="hidden" id="rl-date" value="' + esc(sess && sess.key ? sess.key : lib.today()) + '" />' +
      '<div class="modal__foot"><button class="btn btn--ghost" data-close>Cancel</button>' +
        '<button class="btn btn--primary" id="rl-save">Save run</button></div>';

    var rpeWrap = dlg.querySelector("#rl-rpe");
    rpeWrap.querySelectorAll("[data-rpe]").forEach(function (b) {
      b.addEventListener("click", function () {
        rpeWrap.querySelectorAll("[data-rpe]").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      });
    });

    dlg.querySelector("#rl-save").addEventListener("click", function () {
      var km = Number(dlg.querySelector("#rl-km").value) || 0;
      var min = Number(dlg.querySelector("#rl-min").value) || 0;
      if (km <= 0 && min <= 0) { App.toast("Add a distance or time to log this run.", "warn"); return; }
      var active = rpeWrap.querySelector(".is-active");
      var dateKey = dlg.querySelector("#rl-date").value || lib.today();
      var iso = (dateKey === lib.today()) ? lib.iso() : (dateKey + "T12:00:00.000Z");
      run.logRun({
        dateISO: iso,
        kind: dlg.querySelector("#rl-kind").value || "easy",
        title: dlg.querySelector("#rl-title").value || "Run",
        distanceKm: km,
        durationSec: min * 60,
        rpe: active ? Number(active.dataset.rpe) : null,
        notes: dlg.querySelector("#rl-notes").value || ""
      });
      App.closeModal("modal-run");
      App.toast("Run logged - nice work.", "success");
      renderRunning(el, App.getState());
    });

    App.openModal("modal-run");
  }

  /* ----------------------------------------------------------------------
     7) MOUNT
     -------------------------------------------------------------------- */
  function mount() { App.registerView("running", renderRunning); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

})();
