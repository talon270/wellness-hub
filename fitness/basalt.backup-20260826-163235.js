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
  var SCHEMA_VERSION = 2;                    // v2: prefs.sessionLength

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

  /* Ordered nav / section metadata — single source of truth for the router. */
  var SECTIONS = [
    { id: "dashboard",  label: "Dashboard",  icon: "grid" },
    { id: "today",      label: "Today",      icon: "flame" },
    { id: "program",    label: "Program",    icon: "list" },
    { id: "skills",     label: "Skills",     icon: "skill" },
    { id: "running",    label: "Running",    icon: "run" },
    { id: "progress",   label: "Progress",   icon: "chart" },
    { id: "evaluation", label: "Evaluation", icon: "award" }
  ];

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
        goal: "both",             // "strength" | "size" | "both"
        activity: "moderate",
        bmi: null,
        tdee: 2800,
        surplusTarget: 3300,      // +500 kcal aggressive clean-bulk target
        macros: { protein: 116, carbs: 413, fat: 92 },  // g/day
        hydrationTargetL: 3.2
      },

      /* — Equipment (pre-checks per spec) — */
      equipment: {
        pullupBar: false,
        dumbbells: true,
        bench: true,
        kettlebells: true,
        rings: false,
        nothing: false
      },

      /* — User preferences (editable in Settings) — */
      prefs: {
        restDefaultSec: 90,       // default between-set rest timer
        restHoldSec: 60,          // default rest after a timed hold
        volumeMode: "standard",   // "standard" | "extended" | "max"
        /* How MANY movements a session contains, as opposed to how hard each
           one is — volumeMode only ever adds sets/reps/density to the same
           3-4 exercises. Independent of it and combinable with it. */
        sessionLength: "focused"  // "focused" | "full"
      },

      /* — Running program (complements the lifting rotation on off-days) —
         goal:    null until the user picks one ("base" | "stamina" | "sprint")
         startISO: anchor date the week-by-week plan counts from
         runLog:   [{ id, dateISO, kind, distanceKm, durationSec, rpe, notes }] */
      running: {
        goal: null,
        startISO: null,
        runDays: [3, 6, 0],   // Wed, Sat, Sun — the days the lifting rotation leaves open
        runLog: [],
        streak: { count: 0, lastISO: null, best: 0 }
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
        action: "start",        // start | advance | consolidate | deload
        weighIns: []            // up to 4 weekly weights used by the evaluator
      },

      /* — Logged collections (filled by Parts 2,4,5,6) — */
      sessions: [],         // { id, dateISO, type, exercises:[{key,pattern,sets:[{reps,weight}],difficulty}], difficulty, notes, completed, warmupDone, cooldownDone, flags:[] }
      bodyweightLog: [],    // { dateISO, kg }
      measurements: [],     // { dateISO, chest, waist, hips, arms, thighs }
      sleepLog: [],         // { dateISO, hours, quality }
      nutritionLog: [],     // { dateISO, meals:[{name,kcal,protein,carbs,fat}], waterL }
      prs: [],              // { id, exercise, kind:"reps|hold|weight", value, dateISO }
      goals: [],            // { id, text, target, byPhase, metric, pinned, done }
      streak: { count: 0, lastISO: null, best: 0 },
      flagsHistory: [],     // { id, dateISO, exerciseKey, pattern, bodyPart, severity, substitutedTo }
      phaseHistory: []      // { number, score, grade, metrics{}, feedback, action, endedISO }
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
      // Unknown / future schema — fall back to a deep-merged default to stay safe.
      return deepMerge(defaultState(), state);
    }
    if (state.version < SCHEMA_VERSION) {
      /* v1 -> v2 adds prefs.sessionLength. It is additive with a default of
         "focused", which is exactly today's behaviour, so the deep-merge
         below IS the migration: every pre-v2 save keeps the session shape it
         already had and nobody's program silently gets longer on upgrade. */
      state = deepMerge(defaultState(), state);
      state.version = SCHEMA_VERSION;
    } else {
      // Same version: still backfill keys added during development.
      state = deepMerge(defaultState(), state);
    }
    return state;
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

  function load() {
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); }
    catch (e) { raw = null; }
    if (!raw) { STATE = defaultState(); return STATE; }
    try {
      STATE = migrate(JSON.parse(raw));
      healState(STATE);   // validate & repair shape before any view touches it
    } catch (e) {
      console.warn("IRONFRAME: corrupt save, starting fresh.", e);
      STATE = defaultState();
    }
    return STATE;
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
    ["sessions","bodyweightLog","measurements","sleepLog","nutritionLog","prs","goals","flagsHistory","phaseHistory"].forEach(function (key) {
      if (!Array.isArray(s[key])) { s[key] = []; fixed++; }
    });

    // 2) Core objects must exist with required sub-keys (backfill from defaults).
    ["profile","equipment","prefs","tiers","benchmarks","currentPhase","streak","meta","running"].forEach(function (key) {
      if (!s[key] || typeof s[key] !== "object" || Array.isArray(s[key])) { s[key] = def[key]; fixed++; }
    });
    // running.runLog must be an array
    if (s.running && !Array.isArray(s.running.runLog)) { s.running.runLog = []; fixed++; }

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

  function showSection(name) {
    if (!SECTIONS.some(function (s) { return s.id === name; })) name = "dashboard";
    activeSection = name;
    uiSet("section", name);

    SECTIONS.forEach(function (s) {
      var view = document.getElementById("view-" + s.id);
      if (view) view.classList.toggle("hide", s.id !== name);
    });
    // re-trigger entrance animation on the active view
    var active = document.getElementById("view-" + name);
    if (active) { active.classList.remove("view"); void active.offsetWidth; active.classList.add("view"); }

    document.querySelectorAll(".nav__btn").forEach(function (b) {
      var active = b.dataset.section === name;
      b.classList.toggle("is-active", active);
      if (active) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });

    renderInto(name);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
  function buildNav() {
    var nav = document.getElementById("nav");
    nav.innerHTML = SECTIONS.map(function (s) {
      return '<button class="nav__btn" data-section="' + s.id + '" type="button">' +
        '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[s.icon] + '</svg>' +
        '<span>' + s.label + '</span></button>';
    }).join("");
    nav.querySelectorAll(".nav__btn").forEach(function (b) {
      b.addEventListener("click", function () { showSection(b.dataset.section); });
    });
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
        STATE = migrate(parsed);
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
     js/theme.js and css/themes.css, where the palettes actually live. Writing
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
    { key: "rings",      label: "Gymnastic rings" }
  ];

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
    var curVol = (s.prefs && s.prefs.volumeMode) || "standard";
    document.querySelectorAll("[data-voldefault]").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.voldefault === curVol);
    });
    /* default length */
    var curLen = (s.prefs && s.prefs.sessionLength) || "focused";
    document.querySelectorAll("[data-lengthdefault]").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.lengthdefault === curLen);
    });
    populateThemePicker();

    // goal segment
    document.querySelectorAll("#set-goal .seg__btn").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.goal === (s.profile.goal || "both"));
    });

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

    var goalBtn = document.querySelector("#set-goal .seg__btn.is-active");
    if (goalBtn) s.profile.goal = goalBtn.dataset.goal;

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

    /* save selected colour scheme */
    var selTheme = document.querySelector("#set-theme-grid [data-settheme].is-active");
    if (selTheme) applyTheme(selTheme.dataset.settheme, true);
    else applyTheme("default", true);

    saveState();
    closeModal("modal-settings");
    if (App.refresh) App.refresh();
    toast("Settings saved.", "success");
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
          '<p class="muted text-sm mt-4">A new Phase Report Card auto-generates at day ' + phase.lengthDays + ', grading completion, rep ratios, bodyweight trend, recovery and plateaus — then advances, consolidates or deloads your program.</p>' +
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

    if (!STATE.meta.onboarded) {
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
    var wasOnboarded = STATE.meta.onboarded;
    load();
    if (STATE.meta.onboarded && !wasOnboarded) {
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
    if (STATE.meta.onboarded) refresh();
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
    deepMerge: deepMerge,
    reloadFromRemote: reloadFromRemote,

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

  def({ id:"push_e2_weighted", pattern:"push", name:"Weighted Push-up", level:null, era:2, mode:"reps", unit:"reps", equipment:["dumbbells"],
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

  def({ id:"hinge_4", pattern:"hinge", name:"Nordic Curl Negative", level:4, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["Kneel with ankles anchored (under a sofa/partner/loaded bar).","Keep hips extended and the body in one rigid line from knee to head.","Lower forward as slowly as possible, resisting with the hamstrings.","Catch with the hands and push back to the start."],
    mistakes:["Bending at the hips to cheat the lowering.","Dropping fast once the hamstrings start to give."],
    readiness:"Advance once you can resist smoothly past the halfway point for 5 reps.",
    injury:"Extremely demanding — start with a high catch point and few reps to protect the hamstrings." });

  def({ id:"hinge_5", pattern:"hinge", name:"Nordic Curl", level:5, era:1, mode:"reps", unit:"reps", equipment:[],
    cues:["Same setup; lower under full control through the whole range.","Pull yourself back up using only the hamstrings.","Maintain the rigid hip-to-head line throughout.","Minimise any push-off from the hands."],
    mistakes:["Folding at the hips on the way up.","Relying on the arms to do most of the concentric."],
    readiness:"Advance at 5 full reps with no hand assistance.",
    injury:"Never train Nordics to failure cold — warm the hamstrings thoroughly." });

  def({ id:"hinge_6", pattern:"hinge", name:"Shaking Nordic", level:6, era:1, mode:"reps", unit:"reps", equipment:[],
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

  def({ id:"core_3", pattern:"core", name:"Tuck L-Sit", level:3, era:1, mode:"hold", unit:"sec", equipment:["bench"],
    cues:["Support on parallettes, bench edges, or the floor.","Depress the shoulders and lock the elbows straight.","Lift the hips and tuck the knees toward the chest.","Hold with the shoulders pulled down, chest tall."],
    mistakes:["Shrugging the shoulders up to the ears.","Bending the elbows to fake the lift."],
    readiness:"Advance at a 30-sec tuck hold (also the Era I L-sit benchmark).",
    injury:"Strong wrist demand on the floor — use parallettes if wrists complain." });

  def({ id:"core_4", pattern:"core", name:"L-Sit", level:4, era:1, mode:"hold", unit:"sec", equipment:["bench"],
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

  def({ id:"dip_2", pattern:"dip", name:"Straight Bar Dip", level:2, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
    cues:["Support on a straight bar at hip height, arms locked.","Lean slightly forward, keeping the bar close to the body.","Lower until the bar reaches the lower chest.","Press up to a strong lockout, chest proud."],
    mistakes:["Letting the bar drift away from the torso.","Collapsing the chest forward at the bottom."],
    readiness:"Advance at 10 controlled reps to chest depth.",
    injury:"Keep the shoulders packed down to avoid impingement." });

  def({ id:"dip_3", pattern:"dip", name:"Parallel Bar Dip", level:3, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
    cues:["Support on parallel bars, arms locked, body slightly forward.","Lower until the shoulders are just below the elbows.","Keep the elbows tracking back, not flaring wide.","Press to a full lockout, depressing the shoulders."],
    mistakes:["Dropping below safe depth and stressing the shoulder.","Flaring the elbows out to the sides."],
    readiness:"Advance at 12 strict reps to parallel depth.",
    injury:"Build depth gradually — the bottom is the vulnerable position." });

  def({ id:"dip_4", pattern:"dip", name:"Korean Dip", level:4, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
    cues:["On a straight bar, position the body behind the bar.","Lower with the bar tracking up toward the upper chest/neck.","Keep tension through the shoulders and lats.","Press back to lockout under control."],
    mistakes:["Losing shoulder control in the deep stretched position.","Using momentum to bounce out of the bottom."],
    readiness:"Advance at 8 controlled reps with the stretched setup.",
    injury:"Advanced shoulder stretch position — earn it with solid bar dips first." });

  def({ id:"dip_5", pattern:"dip", name:"Ring Dip", level:5, era:1, mode:"reps", unit:"reps", equipment:["rings"],
    cues:["Support on rings with the wrists turned slightly out (RTO).","Stabilise the rings tight to the body before lowering.","Descend under control, fighting the rings' wobble.","Press to lockout and turn the rings out at the top."],
    mistakes:["Letting the rings drift wide and unstable.","Rushing reps and losing control of the wobble."],
    readiness:"Advance at 8 controlled reps with a turned-out lockout.",
    injury:"The instability is the point — but back off if the shoulders feel unstable." });

  def({ id:"dip_6", pattern:"dip", name:"Weighted Dip", level:6, era:1, mode:"reps", unit:"reps", equipment:["dumbbells"],
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
    today: function () { return lib.dayKey(Date.now()); },
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
      var diff = lib.daysBetween(lib.dayKey(v), lib.today());
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
  var DAY_LABEL = { push: "Push Day", pull: "Pull Day", legs: "Leg Day", fullbody: "Full Body" };
  var DAY_DESC = {
    push: "Press, shoulders, dips & core — anterior chain power.",
    pull: "Pulls, posterior chain & core — build the back.",
    legs: "Squat & hinge patterns with bracing core work.",
    fullbody: "One push, one pull, one squat, one core — balanced."
  };
  var DAY_PATTERNS = {
    push: ["push", "shoulder", "dip", "core"],
    pull: ["pull", "hinge", "core"],
    legs: ["squat", "hinge", "core"],
    fullbody: ["push", "pull", "squat", "core"]
  };

  /* "Full" session length — one extra movement per day, chosen as the
     antagonist the day is otherwise missing. Every added pattern already has
     a complete tier ladder in DB, so this adds no new exercise content.

     The added movement is marked `accessory: true` and is deliberately
     EXCLUDED from tier progression and rep-target adaptation, exactly as
     era-2 accessories already are. Without that, three sets of accessory
     pull on push day would advance your real pull ladder and move your real
     pull rep target — you would be levelling a pattern from support work
     while never doing a dedicated session for it. */
  var DAY_ACCESSORY = {
    push: "pull",       // antagonist balance for a push-dominant day
    pull: "push",
    legs: "dip",        // legs is otherwise entirely lower-body
    fullbody: "hinge"   // the one major pattern full body doesn't cover
  };

  function patternsFor(dayType, sessionLength) {
    var base = DAY_PATTERNS[dayType] || DAY_PATTERNS.fullbody;
    if (sessionLength !== "full") return base;
    var extra = DAY_ACCESSORY[dayType];
    return extra ? base.concat([extra]) : base;
  }

  /* Session-length modes — parallel to VOLUME_MODES, and independent of it.
     "Full + Max effort" is a real combination: more movements, and more
     sets/reps on each. */
  var LENGTH_MODES = {
    focused: { label: "Focused", desc: "3-4 movements — the core of the day" },
    full:    { label: "Full",    desc: "+1 antagonist movement, doesn't affect your ladders" }
  };
  var BASE_REPS    = { push: 12, pull: 8, squat: 14, hinge: 14, core: 30, shoulder: 8, dip: 8 };
  var TARGET_SETS  = 3;
  var DAYS_PER_WEEK = 4;

  /* Volume modes — applied on top of phase volumeFactor and session adaptation.
     sets:    bonus sets added to the adapted count
     reps:    flat bonus added to every adapted rep target
     restMul: multiplier on rest times (< 1 = shorter rest = more intensity)
     label / desc: shown in the Today UI */
  var VOLUME_MODES = {
    standard: { sets: 0,  reps: 0,  restMul: 1.00, label: "Standard",   desc: "Adaptive defaults — 3 sets, normal rest" },
    extended: { sets: 1,  reps: 2,  restMul: 0.85, label: "Extended",   desc: "+1 set, +2 reps, 15% shorter rest" },
    max:      { sets: 2,  reps: 3,  restMul: 0.75, label: "Max effort", desc: "+2 sets, +3 reps, 25% shorter rest" }
  };

  var engine = {
    ROTATION: ROTATION, DAY_LABEL: DAY_LABEL, DAY_DESC: DAY_DESC,
    DAY_PATTERNS: DAY_PATTERNS, TARGET_SETS: TARGET_SETS, DAYS_PER_WEEK: DAYS_PER_WEEK,
    VOLUME_MODES: VOLUME_MODES,
    DAY_ACCESSORY: DAY_ACCESSORY, LENGTH_MODES: LENGTH_MODES,
    patternsFor: patternsFor,

    completedSessions: function () {
      return App.getState().sessions.filter(function (s) { return s.completed; });
    },

    recommendedDayType: function () {
      var done = engine.completedSessions();
      if (done.length) {
        var last = done[done.length - 1].type;
        var i = ROTATION.indexOf(last);
        return ROTATION[(i + 1) % ROTATION.length];
      }
      return ROTATION[0];
    },

    /* current movement for a pattern (respects tier level) */
    movementFor: function (pattern) {
      var t = App.getState().tiers[pattern];
      return DB.byLevel(pattern, t.level) || DB.ladder(pattern)[0];
    },

    /* Cross-phase plateau detection: a pattern is "stalled" when its level has
       not increased across the last 2 completed phases (and it's not maxed at L6). */
    tierStalls: function () {
      var s = App.getState();
      var hist = (s.phaseHistory || []).filter(function (h) { return h.tierLevels; });
      var out = {};
      if (hist.length < 2) return out;
      var a = hist[hist.length - 2].tierLevels;
      var b = hist[hist.length - 1].tierLevels;
      (s.tiers ? Object.keys(s.tiers) : []).forEach(function (p) {
        var cur = (s.tiers[p] || {}).level || 1;
        var la = a[p], lb = b[p];
        /* stalled = held the same level across the last two phases, above L1, not maxed */
        if (la != null && lb != null && cur > 1 && cur < 6 && cur === lb && lb === la) {
          out[p] = true;
        }
      });
      return out;
    },

    /* Optional Era-II accessory for a workout (only if graduated + equipped) */
    era2Accessory: function (dayType) {
      var s = App.getState();
      if (s.era !== 2) return null;
      var pats = DAY_PATTERNS[dayType];
      for (var i = 0; i < pats.length; i++) {
        var adds = DB.era2Addons(pats[i]);
        for (var j = 0; j < adds.length; j++) {
          var a = adds[j];
          var ok = (a.equipment || []).every(function (e) { return s.equipment[e]; });
          if (ok) return a;
        }
      }
      return null;
    },

    buildWorkout: function (dayType, overrideMode, overrideLength) {
      var s = App.getState();
      var lengthName = overrideLength || (s.prefs && s.prefs.sessionLength) || "focused";
      var pats = patternsFor(dayType, lengthName);
      var accessoryPattern = lengthName === "full" ? DAY_ACCESSORY[dayType] : null;
      var ph = s.currentPhase || {};
      var vf = Number(ph.volumeFactor) || 1;                 // deload phases < 1
      var baseSetCount = Math.max(2, Math.round(TARGET_SETS * vf));
      var restMul = ph.action === "consolidate" ? 0.8 : 1;   // density: shorter rest

      /* Volume mode — user-selected intensity multiplier.
         Deload phases always cap to standard to protect recovery. */
      var modeName = vf < 1 ? "standard" : (overrideMode || (s.prefs && s.prefs.volumeMode) || "standard");
      var mode = VOLUME_MODES[modeName] || VOLUME_MODES.standard;
      restMul = restMul * mode.restMul;

      /* Adapt set count from last session, then apply mode bonus */
      var adaptedSetCount = engine._adaptSets(s, dayType, baseSetCount);
      var setCount = Math.min(6, Math.max(2, adaptedSetCount + mode.sets));

      var exercises = pats.map(function (p, i) {
        /* The accessory is always the appended last entry, identified by
           position rather than by pattern name — a name test would go wrong
           the day an accessory duplicates a pattern already in the day. */
        var isAccessory = accessoryPattern != null && i === pats.length - 1;
        var t = s.tiers[p];
        var ex = DB.byLevel(p, t.level) || DB.ladder(p)[0];
        /* Adapt rep target from last session, then apply mode rep bonus.
           An accessory holds its ladder's plain base target: it neither reads
           adaptation nor feeds it, so support work can't drag a real
           pattern's target around. */
        var adapt = isAccessory
          ? { target: t.repsTarget, delta: 0, reason: "" }
          : engine._adaptTarget(s, p, t.repsTarget);
        var finalTarget = adapt.target + mode.reps;
        return {
          pattern: p, id: ex.id, name: ex.name, level: t.level,
          mode: ex.mode, unit: ex.unit, equipment: ex.equipment || [],
          cues: ex.cues || [], mistakes: ex.mistakes || [],
          readiness: ex.readiness || "", injury: ex.injury || "",
          target: finalTarget, targetDelta: adapt.delta, targetReason: adapt.reason,
          era2: false, accessory: isAccessory,
          restSec: Math.round((ex.mode === "hold" ? restHoldPref(s) : restRepPref(s)) * restMul),
          sets: newSets(setCount),
          difficulty: null, flag: null
        };
      });
      /* Full length REPLACES the era-2 accessory rather than stacking on it.
         Both exist to add one extra movement to the day; stacking them makes
         an Era-II push day six exercises at up to six sets, which is how a
         40-minute session quietly becomes a 75-minute one. */
      var acc = accessoryPattern ? null : engine.era2Accessory(dayType);
      if (acc) {
        exercises.push({
          pattern: acc.pattern, id: acc.id, name: acc.name, level: null,
          mode: acc.mode, unit: acc.unit, equipment: acc.equipment || [],
          cues: acc.cues || [], mistakes: acc.mistakes || [],
          readiness: acc.readiness || "", injury: acc.injury || "",
          target: (acc.mode === "hold" ? 30 : 10) + mode.reps, targetDelta: 0, targetReason: "",
          era2: true, restSec: Math.round(restRepPref(s) * restMul),
          sets: newSets(setCount), difficulty: null, flag: null
        });
      }
      return {
        dayType: dayType,
        startedISO: lib.iso(),
        warmup: DB.warmup(dayType).map(function () { return false; }),
        cooldown: DB.cooldown(dayType).map(function () { return false; }),
        exercises: exercises,
        notes: "",
        setCount: setCount,
        setCountDelta: adaptedSetCount - baseSetCount,
        volumeMode: modeName
      };
    },

    /* -----------------------------------------------------------------------
       Adaptive target — reads the last 2 sessions containing this pattern,
       compares logged reps to the prescribed target, and nudges the rep target
       up or down for the next session.

       Rules (applied in order, first match wins):
         • Any set rated "failed" last session             → −1 rep
         • Avg reps < 80% of target last session           → −1 rep
         • Avg reps ≥ target AND rated "easy" last session → +1 rep
         • Avg reps ≥ 110% of target last session          → +1 rep (over-performing)
         • Hit target in both of last 2 sessions           → +1 rep (consistent)
         • Otherwise                                       → 0 (hold)

       Target is always clamped between (baseTarget / 2) and (baseTarget + 4).
       ----------------------------------------------------------------------- */
    _adaptTarget: function (s, pattern, baseTarget) {
      var sessions = (s.sessions || [])
        .filter(function (x) { return x.completed; })
        .slice(-8);  // only look at recent history

      /* find the last 2 sessions that worked this pattern */
      var relevant = [];
      for (var i = sessions.length - 1; i >= 0 && relevant.length < 2; i--) {
        var found = (sessions[i].exercises || []).filter(function (ex) {
          /* Accessories are excluded for the same reason era-2 add-ons are:
             support work done on another pattern's day is not evidence about
             how this pattern's real sessions are going. */
          return ex.pattern === pattern && !ex.era2 && !ex.accessory;
        })[0];
        if (found) relevant.push(found);
      }

      if (!relevant.length) return { target: baseTarget, delta: 0, reason: "" };

      var last = relevant[0];
      var vals = (last.sets || []).map(function (st) { return Number(st.reps) || 0; }).filter(function (v) { return v > 0; });
      if (!vals.length) return { target: baseTarget, delta: 0, reason: "" };

      var avgReps = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
      var ratio = avgReps / baseTarget;
      var lastDiff = last.difficulty || "moderate";
      var floor = Math.max(3, Math.round(baseTarget * 0.5));
      var cap   = baseTarget + 4;

      var delta = 0, reason = "";

      if (lastDiff === "failed" || (last.sets || []).some(function (st) { return st.reps === 0; })) {
        delta = -1;
        reason = "failed last session";
      } else if (ratio < 0.8) {
        delta = -1;
        reason = "below target last session";
      } else if ((lastDiff === "easy") && ratio >= 1.0) {
        delta = +1;
        reason = "felt easy and hit target";
      } else if (ratio >= 1.1) {
        delta = +1;
        reason = "exceeded target";
      } else if (relevant.length >= 2) {
        /* check 2nd-last session too */
        var prev = relevant[1];
        var prevVals = (prev.sets || []).map(function (st) { return Number(st.reps) || 0; }).filter(Boolean);
        var prevAvg  = prevVals.length ? prevVals.reduce(function (a, b) { return a + b; }, 0) / prevVals.length : 0;
        if (ratio >= 1.0 && prevAvg >= baseTarget) {
          delta = +1;
          reason = "hit target consistently";
        }
      }

      var newTarget = lib.clamp(baseTarget + delta, floor, cap);
      /* if the clamp absorbed the delta, report 0 change to avoid misleading UI */
      var actualDelta = newTarget - baseTarget;
      return { target: newTarget, delta: actualDelta, reason: actualDelta !== 0 ? reason : "" };
    },

    /* -----------------------------------------------------------------------
       Adaptive set count — looks at the last 2 sessions of this day-type:
         • Both rated "easy"   → +1 set (cap at 5)
         • Last rated "failed" → −1 set (floor at 2)
         • Otherwise           → base count
       ----------------------------------------------------------------------- */
    _adaptSets: function (s, dayType, base) {
      var past = (s.sessions || [])
        .filter(function (x) { return x.completed && x.type === dayType; })
        .slice(-2);
      if (!past.length) return base;
      var last = past[past.length - 1];
      if (last.difficulty === "failed") return Math.max(2, base - 1);
      if (past.length >= 2) {
        var allEasy = past.every(function (x) { return x.difficulty === "easy"; });
        if (allEasy) return Math.min(5, base + 1);
      }
      return base;
    },

    /* total reps performed (weighted reps count 1.5x as a rough volume proxy) */
    sessionVolume: function (session) {
      var v = 0;
      (session.exercises || []).forEach(function (ex) {
        (ex.sets || []).forEach(function (st) {
          var val = Number(st.value) || 0;
          if (ex.mode === "hold") v += Math.round(val / 5); // 5s ≈ 1 "rep unit"
          else v += val * (Number(st.weight) > 0 ? 1.5 : 1);
        });
      });
      return Math.round(v);
    },

    /* Persisted finalize: streak, progression, PRs, flags, push to sessions[] */
    finalizeSession: function (workout) {
      var s = App.getState();
      var nowISO = lib.iso();
      var session = {
        id: "s_" + Date.now(),
        dateISO: nowISO,
        type: workout.dayType,
        exercises: workout.exercises.map(function (ex) {
          return {
            /* `accessory` must persist alongside `era2`: _adaptTarget reads
               its history out of s.sessions, so a flag that only existed on
               the live workout object would be gone by the time it matters,
               and support work would silently drive the real pattern's
               targets after all. */
            key: ex.id, pattern: ex.pattern, name: ex.name,
            era2: !!ex.era2, accessory: !!ex.accessory,
            mode: ex.mode, unit: ex.unit,
            sets: ex.sets.map(function (st) { return { reps: num(st.value), weight: num(st.weight) }; }),
            difficulty: ex.difficulty || "moderate",
            flag: ex.flag || null
          };
        }),
        warmupDone: workout.warmup.every(Boolean),
        cooldownDone: workout.cooldown.every(Boolean),
        notes: workout.notes || "",
        volume: 0,
        completed: true,
        flags: []
      };
      session.volume = engine.sessionVolume({ exercises: workout.exercises });

      var result = { levelUps: [], prs: [], flags: [] };

      /* 1) streak */
      engine._bumpStreak(s, session.dateISO);

      /* 2) progression per pattern-exercise */
      workout.exercises.forEach(function (ex) {
        if (ex.era2) return;      // era-2 accessories don't drive Era-I tier progress
        /* Nor does full-length accessory work. Levelling your pull ladder off
           support sets done on push day would advance a pattern you never
           trained a dedicated session for. */
        if (ex.accessory) return;
        var lvl = engine._progress(s, ex);
        if (lvl) result.levelUps.push(lvl);
      });

      /* 3) PRs. Accessories are NOT excluded here, deliberately: progression
         and target adaptation change your future program and must not be
         driven by support work, but a PR only describes a rep you actually
         performed. If you really did hit a best on an accessory set, that
         happened. */
      workout.exercises.forEach(function (ex) {
        var pr = engine._checkPR(s, ex, session.dateISO);
        if (pr) result.prs.push(pr);
      });

      /* 4) injury flags -> flagsHistory */
      workout.exercises.forEach(function (ex) {
        if (ex.flag && ex.flag.bodyPart) {
          var f = {
            id: "f_" + Date.now() + "_" + ex.pattern,
            dateISO: session.dateISO,
            exerciseKey: ex.id, pattern: ex.pattern,
            bodyPart: ex.flag.bodyPart, severity: ex.flag.severity,
            substitutedTo: ex.flag.substitutedTo || null
          };
          s.flagsHistory.push(f);
          session.flags.push(ex.flag.bodyPart);
          result.flags.push(f);
        }
      });

      s.sessions.push(session);
      App.saveState();
      return result;
    },

    _bumpStreak: function (s, dateISO) {
      var k = lib.dayKey(dateISO);
      var st = s.streak;
      if (!st.lastISO) { st.count = 1; }
      else {
        var diff = lib.daysBetween(st.lastISO, k);
        if (diff === 0) { /* same day — keep count */ }
        else if (diff <= 3) {
          /* Allow up to 3 calendar days between sessions — the program runs
             4 days/week with 3 rest days, so Mon→Wed (diff=2) or
             Fri→Mon (diff=3) are both normal scheduled rest gaps. Only a
             diff > 3 means a session was genuinely missed. */
          st.count += 1;
        } else {
          st.count = 1;   // genuinely missed — reset
        }
      }
      st.best = Math.max(st.best || 0, st.count);
      st.lastISO = k;
    },

    /* liveStreak — call this at render time to get the *current* streak value,
       accounting for sessions missed since the last training day.
       Returns 0 if the last session was more than 3 days ago (streak broken). */
    liveStreak: function (s) {
      var st = s.streak;
      if (!st.lastISO || !st.count) return 0;
      var daysSinceLast = lib.daysBetween(st.lastISO, lib.today());
      /* Still alive: trained today, yesterday, or within a normal rest block */
      if (daysSinceLast <= 3) return st.count;
      /* Streak is broken — hasn't trained within a rest-day-adjusted window */
      return 0;
    },

    _progress: function (s, ex) {
      var t = s.tiers[ex.pattern]; if (!t) return null;
      var hit = ex.sets.filter(function (st) { return (Number(st.value) || 0) >= ex.target; }).length;
      var ratio = ex.sets.length ? hit / ex.sets.length : 0;
      var base = { easy: 40, moderate: 26, hard: 12, failed: 0 }[ex.difficulty || "moderate"];
      var inc = Math.round(base * (0.5 + 0.5 * ratio));
      t.progress = lib.clamp((t.progress || 0) + inc, 0, 100);
      if (t.progress >= 100 && t.level < 6) {
        t.level += 1; t.progress = 0;
        var nx = DB.byLevel(ex.pattern, t.level);
        t.repsTarget = (nx && nx.mode === "hold") ? 30 : BASE_REPS[ex.pattern];
        return { pattern: ex.pattern, level: t.level, name: nx ? nx.name : "" };
      }
      return null;
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
      var e = s.nutritionLog.filter(function (n) { return lib.dayKey(n.dateISO) === k; })[0];
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
        if (sinceKey && lib.dayKey(n.dateISO) < sinceKey) return;
        var t = engine.nutritionTotals(n);
        if (t.kcal <= 0) return;
        var kc = lib.clamp(1 - Math.abs(t.kcal - kt) / kt, 0, 1);
        var pc = pTarget ? lib.clamp(t.protein / pTarget, 0, 1) : 0.5;
        sum += kc * 0.7 + pc * 0.3; days++;
      });
      return { score: days ? sum / days : null, loggedDays: days };
    },

    expectedSessions: function (phase, loggedCount) {
      var dur = Math.min(App.util.phaseDayInfo(phase).day, phase.lengthDays);
      var calc = Math.max(1, Math.round((DAYS_PER_WEEK / 7) * dur));
      /* Never show x/y where x > y — if the phase just started, scale expected
         up to at least what's been logged so completion never exceeds 100%. */
      return loggedCount ? Math.max(calc, loggedCount) : calc;
    }
  };

  function newSets(n) { var a = []; for (var i = 0; i < n; i++) a.push({ value: null, weight: null, done: false }); return a; }
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
  var GOALS = [
    { id: "strength", t: "Strength", d: "Max control & harder progressions" },
    { id: "size", t: "Size", d: "Lean mass on a clean surplus" },
    { id: "both", t: "Both", d: "Recommended — build strength while gaining" }
  ];
  var EQUIP = [
    { id: "pullupBar", t: "Pull-up bar" }, { id: "dumbbells", t: "Dumbbells" },
    { id: "bench", t: "Bench" }, { id: "kettlebells", t: "Kettlebells" },
    { id: "rings", t: "Rings" }, { id: "nothing", t: "Just the floor" }
  ];

  function startDraft() {
    var s = App.getState();
    onb.draft = {
      profile: JSON.parse(JSON.stringify(s.profile)),
      equipment: JSON.parse(JSON.stringify(s.equipment)),
      benchmarks: JSON.parse(JSON.stringify(s.benchmarks))
    };
  }

  function renderOnboarding() {
    if (!onb.draft) startDraft();
    var host = document.getElementById("onboarding");
    var steps = [stepWelcome, stepProfile, stepGoal, stepEquip, stepTest, stepPlacement];
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
      'control and clean reps. Dumbbells &amp; kettlebells unlock only once you clear the five Era I benchmarks.</p>' +
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
    return '<div><div class="eyebrow">Objective</div><h2 class="display h3">What are you chasing?</h2></div>' +
      '<div class="stack">' + cards + '</div>' +
      '<p class="faint text-xs">This shapes how aggressively the evaluator advances you and how it reads your bodyweight trend.</p>' +
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
      '<p class="muted text-sm">Era I is bodyweight regardless — this just tunes substitutions and the Era II toolkit you unlock later.</p>' +
      '<div class="grid grid-2">' + cards + '</div>' +
      '<div class="row" style="gap:var(--sp-3)">' +
        '<button class="btn btn--ghost" data-onb="back">Back</button>' +
        '<button class="btn btn--primary grow" data-onb="next">Continue →</button>' +
      '</div>';
  }

  function stepTest() {
    var b = onb.draft.benchmarks;
    var rows = Object.keys(b).map(function (k) {
      var x = b[k];
      return '<div class="card" style="padding:var(--sp-4)">' +
        '<div class="row between"><div class="grow"><div class="drow__title">' + x.label + '</div>' +
        '<div class="drow__sub">target ' + x.target + ' ' + x.metric + (x.altTarget ? " (or " + x.altTarget + " alt)" : "") + '</div></div>' +
        stepperHtml("bench-" + k, x.current, 0, 200) + '</div></div>';
    }).join("");
    return '<div><div class="eyebrow">Fitness test</div><h2 class="display h3">Where do you stand?</h2></div>' +
      '<p class="muted text-sm">Log honest current bests. Clearing all five graduates you to Era II. Leave at 0 if untested — you can update anytime in <b>Program</b>.</p>' +
      '<div class="stack">' + rows + '</div>' +
      '<div class="row" style="gap:var(--sp-3)">' +
        '<button class="btn btn--ghost" data-onb="back">Back</button>' +
        '<button class="btn btn--primary grow" data-onb="next">See my placement →</button>' +
      '</div>';
  }

  /* Map fitness-test results to a starting level (1–6) per movement pattern.
     Patterns without a direct test inherit from the closest tested pattern. */
  function computePlacement(b) {
    function num(k) { return Number(b[k] && b[k].current) || 0; }
    function tier(val, cuts) {            // cuts ascending; returns 1..6
      var lvl = 1; for (var i = 0; i < cuts.length; i++) { if (val >= cuts[i]) lvl = i + 2; } return Math.min(lvl, 6);
    }
    var push = tier(num("pushups"),   [5, 15, 25, 35, 45]);   // wall→pseudo-planche
    var pull = tier(num("pull"),      [1, 3, 6, 10, 14]);     // dead-hang→archer
    var core = tier(num("lsit"),      [10, 20, 30, 45, 60]);  // plank→dragon (sec proxy)
    var squat = tier(num("bulgarian"),[5, 10, 15, 20, 25]);   // bw squat→weighted pistol
    return {
      push: push,
      pull: Math.max(1, pull),
      squat: squat,
      hinge: Math.max(1, Math.min(squat, 3)),   // posterior chain tracks lower-body base, capped
      core: core,
      shoulder: Math.max(1, Math.min(push, 4)), // vertical press tracks push, capped at HSPU-negative
      dip: Math.max(1, Math.min(push, 4))       // dip strength tracks push, bench available
    };
  }

  function stepPlacement() {
    var b = onb.draft.benchmarks;
    var place = computePlacement(b);
    onb.draft._placement = place;
    var labels = { push: "Push", pull: "Pull", squat: "Squat", hinge: "Hinge", core: "Core", shoulder: "Shoulder", dip: "Dip" };
    var grad = Object.keys(b).every(function (k) { return (Number(b[k].current) || 0) >= b[k].target; });
    var rows = Object.keys(place).map(function (p) {
      var lvl = place[p];
      var ex = (window.DB && DB.byLevel(p, lvl)) || null;
      return '<div class="card" style="padding:var(--sp-3) var(--sp-4)">' +
        '<div class="row between"><div><div class="drow__title">' + labels[p] + '</div>' +
        '<div class="drow__sub">' + (ex ? esc(ex.name) : "Level " + lvl) + '</div></div>' +
        '<span class="badge badge--primary">L' + lvl + ' / 6</span></div></div>';
    }).join("");
    return '<div><div class="eyebrow">Placement</div><h2 class="display h3">Your starting tiers</h2></div>' +
      '<p class="muted text-sm">Based on your test, the OS places each movement pattern at the right rung. You can re-test or adjust any tier later in <b>Program</b>.</p>' +
      '<div class="badge ' + (grad ? "badge--era2" : "badge--era1") + '" style="align-self:flex-start"><span class="dot"></span>' +
        (grad ? "All benchmarks cleared — starting in Era II" : "Starting in Era I — Calisthenics Foundation") + '</div>' +
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
    body.querySelectorAll("[data-equip]").forEach(function (c) {
      c.addEventListener("click", function (e) {
        e.preventDefault();
        var id = c.dataset.equip; onb.draft.equipment[id] = !onb.draft.equipment[id];
        renderOnboarding();
      });
    });
    wireSteppers(body, function (id, val) {
      if (id.indexOf("bench-") === 0) {
        var key = id.slice(6); onb.draft.benchmarks[key].current = val;
      }
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
    Object.keys(d.benchmarks).forEach(function (k) {
      var x = d.benchmarks[k]; x.complete = (Number(x.current) || 0) >= x.target;
    });
    /* graduate immediately if they already cleared everything */
    var grad = Object.keys(d.benchmarks).every(function (k) { return d.benchmarks[k].complete; });

    /* apply test-based tier placement */
    var place = d._placement || computePlacement(d.benchmarks);
    var baseState = App.getState();
    var tiers = JSON.parse(JSON.stringify(baseState.tiers));
    Object.keys(place).forEach(function (p) {
      if (tiers[p]) { tiers[p].level = place[p]; tiers[p].progress = 0; }
    });

    var patch = { profile: d.profile, equipment: d.equipment, benchmarks: d.benchmarks, era: grad ? 2 : 1, tiers: tiers };
    onb.draft = null; onb.step = 0;
    App.completeOnboarding(patch);
    if (grad) App.toast("All benchmarks cleared — you start in Era II!", "success", 4200);
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
  function stepperHtml(id, val, min, max, small) {
    return '<span class="stepper ' + (small ? "stepper--sm" : "") + '" data-stepper="' + id + '" data-min="' + min + '" data-max="' + max + '">' +
      '<button class="stepper__btn" data-step="-1" type="button">–</button>' +
      '<input class="stepper__inp" type="number" value="' + (val == null ? "" : val) + '" inputmode="numeric">' +
      '<button class="stepper__btn" data-step="1" type="button">+</button></span>';
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
  App.ui = { stepperHtml: stepperHtml, wireSteppers: wireSteppers, field: field, opt: opt };

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
      '</div></div>';
  }

  /* Skill-in-Today: a low-key nudge to train a long-term skill fresh, early in
     the session, mapped to the recommended day. Relies on App.skills (Part 7);
     returns "" if that module isn't present or no day is recommended. */
  function skillReminderCard(s, dayType) {
    var sk = App.skills;
    if (!sk || !sk.suggestFor || !dayType) return "";
    var pick = sk.suggestFor(dayType);
    if (!pick) return "";
    return '<div class="card mt-4" data-skill-card style="border-color:var(--line-2)">' +
      '<div class="row between wrap" style="gap:var(--sp-3)">' +
        '<div style="min-width:0"><div class="eyebrow">Skill work · optional</div>' +
          '<div class="card__title" style="margin:2px 0 0">Train ' + esc(pick.label) + ' first</div>' +
          '<p class="faint text-xs" style="margin:4px 0 0;max-width:48ch">' + esc(pick.line) +
            ' A few quality attempts while fresh beats grinding them tired after the main work.</p></div>' +
        '<button class="btn btn--ghost btn--sm" data-go-skill="' + esc(pick.id) + '" type="button">Open skill \u2192</button>' +
      '</div></div>';
  }

  function renderReady(el, s) {
    var rec = engine.recommendedDayType();
    var done = engine.completedSessions();
    var last = done[done.length - 1];
    var segBtns = ROTATION.map(function (d) {
      return '<button class="seg__btn ' + (d === rec ? "is-active" : "") + '" data-day="' + d + '">' + DAY_LABEL[d] + '</button>';
    }).join("");

    el.innerHTML =
      head("Today", "Session engine", rec ? DAY_LABEL[rec] + " is up next" : "Let's train") +
      '<div class="card card--accent card--pad-lg hero stack">' +
        '<div class="row between wrap"><div><div class="eyebrow">Recommended</div>' +
        '<h2 class="display h2" id="today-title">' + DAY_LABEL[rec] + '</h2>' +
        '<p class="muted text-sm" id="today-desc" style="max-width:46ch">' + DAY_DESC[rec] + '</p></div>' +
        eraBadge(s) + '</div>' +
        '<div><div class="field__label mb-2">Choose your focus</div><div class="seg" id="day-seg">' + segBtns + '</div></div>' +
        '<div class="vol-mode-row mt-4"><div class="field__label mb-2">Intensity</div><div class="vol-mode-grid" id="vol-mode-grid">' +
          Object.keys(VOLUME_MODES).map(function (k) {
            var m = VOLUME_MODES[k];
            var cur = (s.prefs && s.prefs.volumeMode) || "standard";
            return '<button class="vol-mode-btn ' + (k === cur ? "is-active" : "") + '" data-volmode="' + k + '" type="button">' +
              '<span class="vol-mode-btn__label">' + m.label + '</span>' +
              '<span class="vol-mode-btn__desc">' + m.desc + '</span>' +
            '</button>';
          }).join("") +
        '</div></div>' +
        /* Length sits beside intensity, not inside it: one decides how many
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
        '<div id="today-preview"></div>' +
        '<button class="btn btn--ghost btn--sm btn--block" id="preview-all-toggle" type="button" style="margin-top:var(--sp-2)">Preview all days ▾</button>' +
        '<div id="all-days-preview" style="display:none"></div>' +
        '<button class="btn btn--primary btn--lg btn--block" id="begin-session">' +
          '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>' +
          'Begin session</button>' +
      '</div>' +
      todayRunCard(s) +
      skillReminderCard(s, rec) +
      (last ? lastSessionCard(last) : "") +
      streakStripCard(s);

    var chosen = {
      day: rec, overrides: {},
      volumeMode: (s.prefs && s.prefs.volumeMode) || "standard",
      sessionLength: (s.prefs && s.prefs.sessionLength) || "focused"
    };
    function previewMissing(ex) {
      return (ex.equipment || []).filter(function (e) { return !s.equipment[e]; });
    }
    function previewMovement(p) {
      if (chosen.overrides[p]) {
        var ov = DB.getExercise(chosen.overrides[p]);
        if (ov) return ov;
      }
      return engine.movementFor(p);
    }
    function renderPreview() {
      /* Both the pattern count and the time estimate derive from this list,
         so switching length updates the "~N min" badge with no separate
         estimate logic to keep in step. */
      var pats = engine.patternsFor(chosen.day, chosen.sessionLength);
      var accPat = chosen.sessionLength === "full" ? engine.DAY_ACCESSORY[chosen.day] : null;
      var mode = (engine.VOLUME_MODES || {})[chosen.volumeMode] || { sets: 0, reps: 0, restMul: 1 };
      var baseSetCount = 3 + mode.sets;
      var restMin = Math.round((90 * (mode.restMul || 1)) / 60 * 10) / 10;
      var estMins = Math.round(pats.length * (baseSetCount * 2.5 + restMin * baseSetCount));
      document.getElementById("today-preview").innerHTML =
        '<div class="card card--glass"><div class="card__head"><div class="card__title">Today\'s movements</div>' +
        '<span class="badge">' + pats.length + ' patterns · ~' + estMins + ' min</span></div>' +
        pats.map(function (p, i) {
          var isAcc = accPat != null && i === pats.length - 1;
          var m = previewMovement(p);
          var missing = previewMissing(m);
          var baseTarget = (s.tiers[p] && s.tiers[p].repsTarget) || 8;
          var dispTarget = baseTarget + mode.reps;
          var warn = missing.length ? ' <span class="badge badge--warn" style="padding:1px 7px">needs gear</span>' : "";
          var ovTag = chosen.overrides[p] ? ' <span class="badge badge--secondary" style="padding:1px 7px">swapped</span>' : "";
          /* Marked in the UI as well as in the data — an accessory that
             looked identical to primary work would leave you wondering why
             your ladder never moved. */
          var accTag = isAcc ? ' <span class="badge" style="padding:1px 7px" title="Support work — does not affect your ladder or rep targets">accessory</span>' : "";
          return '<div class="kv" style="align-items:center"><span class="kv__k">' + cap(p) + ' · L' + s.tiers[p].level + '</span>' +
            '<span class="kv__v" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end">' +
            esc(m.name) + ' <span class="faint text-xs mono">' + baseSetCount + '×' + dispTarget + '</span>' +
            warn + ovTag + accTag +
            '<button class="btn btn--ghost btn--sm" data-pvswap="' + p + '" type="button" style="padding:2px 10px">Swap</button></span></div>';
        }).join("") + '</div>';
      document.querySelectorAll("[data-pvswap]").forEach(function (b) {
        b.addEventListener("click", function () { openPreviewSwap(b.dataset.pvswap, chosen, renderPreview); });
      });
    }
    renderPreview();

    /* preview of every training day, not just the selected one */
    function renderAllDays() {
      var box = document.getElementById("all-days-preview");
      if (!box) return;
      box.innerHTML = ROTATION.map(function (d) {
        var pats = engine.patternsFor(d, chosen.sessionLength);
        var moves = pats.map(function (p) {
          var m = engine.movementFor(p);
          return '<div class="kv"><span class="kv__k">' + cap(p) + ' · L' + s.tiers[p].level + '</span>' +
            '<span class="kv__v">' + esc(m.name) + '</span></div>';
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
        document.querySelectorAll("#day-seg .seg__btn").forEach(function (x) { x.classList.toggle("is-active", x === b); });
        document.getElementById("today-title").textContent = DAY_LABEL[chosen.day];
        document.getElementById("today-desc").textContent = DAY_DESC[chosen.day];
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

      var workout = engine.buildWorkout(chosen.day, chosen.volumeMode, chosen.sessionLength);
      Object.keys(chosen.overrides).forEach(function (p) {
        var alt = DB.getExercise(chosen.overrides[p]);
        if (!alt) return;
        workout.exercises.forEach(function (ex) {
          if (ex.pattern === p && !ex.era2) {
            ex.id = alt.id; ex.name = alt.name; ex.mode = alt.mode; ex.unit = alt.unit;
            ex.equipment = alt.equipment || []; ex.cues = alt.cues || []; ex.mistakes = alt.mistakes || [];
            ex.readiness = alt.readiness || ""; ex.injury = alt.injury || ""; ex.swapped = true;
          }
        });
      });
      setWorkout(workout);
      App.refresh();
      App.toast(DAY_LABEL[chosen.day] + " · " +
        ((engine.LENGTH_MODES[chosen.sessionLength] || {}).label || "") + " · " +
        ((engine.VOLUME_MODES[chosen.volumeMode] || {}).label || "") +
        " started. Warm up first.", "info");
    });

    /* Running-in-Today + skill-reminder buttons */
    var goRun = el.querySelector("[data-go-run]");
    if (goRun) goRun.addEventListener("click", function () { App.showSection("running"); });
    var goSkill = el.querySelector("[data-go-skill]");
    if (goSkill) goSkill.addEventListener("click", function () {
      if (App.skills && App.skills.openTrack) App.skills.openTrack(goSkill.dataset.goSkill);
      else App.showSection("skills");
    });
  }

  /* Preview swap: choose an alternative movement before the session starts. */
  function openPreviewSwap(pattern, chosen, rerender) {
    var s = App.getState();
    var all = (DB.listByPattern ? DB.listByPattern(pattern) : []).filter(function (alt) {
      return alt.era !== 2 || s.era === 2;
    });
    function missingFor(ex) { return (ex.equipment || []).filter(function (e) { return !s.equipment[e]; }); }
    all.sort(function (a, b) {
      var am = missingFor(a).length, bm = missingFor(b).length;
      if ((am === 0) !== (bm === 0)) return am === 0 ? -1 : 1;
      return (a.level || 99) - (b.level || 99);
    });
    var current = chosen.overrides[pattern] || (engine.movementFor(pattern) || {}).id;
    var rows = all.map(function (alt) {
      var missing = missingFor(alt);
      var doable = missing.length === 0;
      var isCur = alt.id === current;
      var tag = isCur ? '<span class="badge badge--primary" style="padding:2px 8px">current</span>'
        : (doable ? '<span class="badge badge--success" style="padding:2px 8px">ready</span>'
                  : '<span class="badge badge--warn" style="padding:2px 8px">needs ' + missing.map(function (m) { return (window.EQUIP_LABEL_GLOBAL && window.EQUIP_LABEL_GLOBAL[m]) || m; }).join(", ") + '</span>');
      var lvl = alt.level ? ("L" + alt.level) : "E2";
      return '<button class="swap-opt' + (isCur ? " is-current" : "") + (doable ? "" : " is-locked") + '" data-pvswapto="' + alt.id + '" type="button">' +
        '<span class="swap-opt__lvl">' + lvl + '</span>' +
        '<span class="swap-opt__main"><span class="swap-opt__name">' + App.util.escapeHtml(alt.name) + '</span>' +
        '<span class="swap-opt__sub">' + (alt.mode === "hold" ? "timed hold" : "reps") + '</span></span>' + tag +
      '</button>';
    }).join("");

    ensureSwapModal();
    var body = document.getElementById("pvswap-body");
    body.innerHTML = '<p class="faint text-xs" style="margin:0 0 var(--sp-3)">Pick a ' + pattern + ' movement to use for this session. "Ready" means you have the gear for it.</p>' +
      '<div class="swap-list">' + rows + '</div>';
    document.getElementById("pvswap-title").textContent = "Swap " + pattern.charAt(0).toUpperCase() + pattern.slice(1) + " movement";
    body.querySelectorAll("[data-pvswapto]").forEach(function (b) {
      b.addEventListener("click", function () {
        var defId = (engine.movementFor(pattern) || {}).id;
        if (b.dataset.pvswapto === defId) delete chosen.overrides[pattern];
        else chosen.overrides[pattern] = b.dataset.pvswapto;
        App.closeModal("modal-pvswap");
        if (rerender) rerender();
      });
    });
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

  function renderActive(el, s, w) {
    var warm = DB.warmup(w.dayType), cool = DB.cooldown(w.dayType);

    /* Build a short adaptive context note for the session header */
    var modeLabel = ((engine.VOLUME_MODES || {})[w.volumeMode] || {}).label || "";
    var adaptNotes = [];
    if (modeLabel && w.volumeMode !== "standard") adaptNotes.push(modeLabel + " intensity selected");
    if (w.setCountDelta > 0) adaptNotes.push("+" + w.setCountDelta + " set from last session");
    if (w.setCountDelta < 0) adaptNotes.push(Math.abs(w.setCountDelta) + " fewer set — take it steady");
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

    el.innerHTML =
      head("Today", DAY_LABEL[w.dayType], "Log every set — the OS adapts from this") +
      adaptBanner +
      /* warmup */
      section("Warm-up", warm.length + " drills", checklist(warm, w.warmup, "warm")) +
      /* exercises */
      '<div class="page-head" style="margin-top:var(--sp-8)"><div class="eyebrow">Work</div>' +
      '<h2 class="display h3">Main session</h2></div>' +
      '<div id="ex-list">' + w.exercises.map(function (ex, i) { return exerciseBlock(ex, i, s); }).join("") + '</div>' +
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

  function exerciseBlock(ex, i, s) {
    var unit = ex.mode === "hold" ? "sec" : "reps";
    var showW = (s.era === 2) || ex.era2;
    var isHold = ex.mode === "hold";
    var sets = ex.sets.map(function (st, j) {
      var holdBtn = isHold ? '<button class="mini-timer mini-timer--hold" data-holdtimer="' + i + "-" + j + '" type="button" title="Time this hold" aria-label="Start hold timer">' +
        '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>Time it</button>' : "";
      return '<div class="setrow" data-ex="' + i + '" data-set="' + j + '">' +
        '<span class="setrow__n">SET ' + (j + 1) + '</span>' +
        '<div class="row" style="gap:var(--sp-2)">' +
          stepperHtml("set-" + i + "-" + j, st.value, 0, 600, true) +
          '<span class="faint text-xs">' + unit + '</span>' +
          (showW ? '<span class="stepper stepper--sm" data-wt="' + i + "-" + j + '" data-min="0" data-max="200">' +
            '<button class="stepper__btn" data-wstep="-2.5" type="button">–</button>' +
            '<input class="stepper__inp" type="number" value="' + (st.weight == null ? "" : st.weight) + '" placeholder="kg" inputmode="decimal">' +
            '<button class="stepper__btn" data-wstep="2.5" type="button">+</button></span>' : "") +
          holdBtn +
        '</div>' +
        '<button class="setrow__done ' + (st.done ? "is-on" : "") + '" data-donebtn="' + i + "-" + j + '" type="button">' +
          '<svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg></button>' +
      '</div>';
    }).join("");

    var diff = ["easy", "moderate", "hard", "failed"].map(function (d) {
      return '<button class="diff-btn ' + (ex.difficulty === d ? "is-on" : "") + '" data-diff="' + i + '" data-d="' + d + '">' + cap(d === "moderate" ? "just right" : d) + '</button>';
    }).join("");

    var flagged = ex.flag && ex.flag.bodyPart;
    var deltaTag = "";
    if (ex.targetDelta && ex.targetDelta !== 0) {
      var up = ex.targetDelta > 0;
      deltaTag = ' <span style="color:' + (up ? "var(--success)" : "var(--warn)") + ';font-weight:700">' +
        (up ? "▲" : "▼") + " " + Math.abs(ex.targetDelta) + " " + (up ? "more" : "less") +
        (ex.targetReason ? " · " + ex.targetReason : "") + "</span>";
    }
    return '<div class="exq ' + (flagged ? "is-flagged" : "") + '" data-block="' + i + '">' +
      '<div class="exq__top"><div><div class="exq__name">' + esc(ex.name) + '</div>' +
        '<div class="exq__meta">' + cap(ex.pattern) + (ex.era2 ? " · ERA II" : " · LEVEL " + ex.level) +
        ' · TARGET ' + ex.target + ' ' + unit + ' × ' + ex.sets.length + deltaTag +
        ' · REST ' + (ex.restSec || 90) + 's</div>' +
        '<button class="exq__rest" data-rest="' + i + '" type="button" title="Start rest timer">' +
          '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>Rest</button></div>' +
        (ex.era2 ? '<span class="badge badge--era2">E2</span>' : '<span class="badge badge--era1">E1</span>') +
      '</div>' +
      '<div class="exq__body stack">' +
        (flagged ? '<div class="badge badge--warn" style="align-self:flex-start"><span class="dot"></span>Swapped: ' + esc(ex.flag.substitutedTo || "modified") + '</div>' : "") +
        (ex.swapped ? '<div class="badge badge--secondary" style="align-self:flex-start"><span class="dot"></span>Swapped movement</div>' : "") +
        '<div>' + sets + '</div>' +
        '<div class="collapsible" data-coach="' + i + '"><button class="collapsible__head" data-collapsible type="button" aria-expanded="false">' +
          'Form cues &amp; coaching' +
          '<svg class="collapsible__chev ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button>' +
          '<div class="collapsible__body"><div class="collapsible__inner"><div class="collapsible__pad">' +
            '<ul style="margin:0;padding-left:18px;display:grid;gap:6px">' + ex.cues.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + '</ul>' +
            (ex.mistakes.length ? '<p class="mt-4" style="color:var(--warn)"><b>Avoid:</b> ' + esc(ex.mistakes[0]) + '</p>' : "") +
            (ex.readiness ? '<p class="mt-2 faint text-xs">' + esc(ex.readiness) + '</p>' : "") +
          '</div></div></div>' +
        '</div>' +
        '<div class="row between wrap" style="gap:var(--sp-3)">' +
          '<div><div class="field__label mb-2">How did it feel?</div><div class="diff-grp">' + diff + '</div></div>' +
          '<button class="btn btn--ghost btn--sm" data-guide="' + i + '" data-exid="' + ex.id + '" type="button">' +
            '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>' +
            'How to do this</button>' +
          '<button class="btn btn--ghost btn--sm" data-swap="' + i + '" type="button">' +
            '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7"/></svg>' +
            'Swap exercise</button>' +
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
    /* checklists — click the box or the text body toggles done */
    el.querySelectorAll("[data-check]").forEach(function (c) {
      c.addEventListener("click", function (e) {
        if (e.target.closest(".mini-timer")) return; // timer button handled separately
        var kind = c.dataset.check, idx = Number(c.dataset.idx);
        var arr = w[kind === "warm" ? "warmup" : "cooldown"];
        arr[idx] = !arr[idx];
        var row = c.closest(".check");
        if (row) row.classList.toggle("is-done", arr[idx]);
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
        rtStart(target, "Hold · " + ex.name, function () {
          // auto-log the achieved hold + mark the set done
          var stt = ex.sets[si];
          if (stt.value == null || stt.value === "") stt.value = target;
          stt.done = true;
          setWorkout(w);
          var doneBtn = el.querySelector('[data-donebtn="' + ei + "-" + si + '"]');
          if (doneBtn) doneBtn.classList.add("is-on");
          var inp = el.querySelector('[data-stepper="set-' + ei + "-" + si + '"] .stepper__inp');
          if (inp && (inp.value === "" || inp.value == null)) inp.value = target;
          App.toast("Hold logged: " + target + "s.", "success");
        });
      });
    });

    /* rep steppers */
    wireSteppers(el, function (id, val) {
      var m = id.match(/^set-(\d+)-(\d+)$/);
      if (m) { w.exercises[+m[1]].sets[+m[2]].value = val; setWorkout(w); }
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
    /* set-done toggles (auto-fill target if empty) */
    el.querySelectorAll("[data-donebtn]").forEach(function (b) {
      b.addEventListener("click", function () {
        var ref = b.dataset.donebtn.split("-"); var ei = +ref[0], si = +ref[1];
        var stt = w.exercises[ei].sets[si];
        stt.done = !stt.done;
        if (stt.done && (stt.value == null || stt.value === "")) {
          stt.value = w.exercises[ei].target;
          var inp = el.querySelector('[data-stepper="set-' + ei + '-' + si + '"] .stepper__inp');
          if (inp) inp.value = stt.value;
        }
        b.classList.toggle("is-on", stt.done);
        setWorkout(w);
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
        el.querySelectorAll('[data-diff="' + ei + '"]').forEach(function (x) { x.classList.toggle("is-on", x === b); });
        setWorkout(w);
      });
    });
    /* exercise guide modal */
    el.querySelectorAll("[data-guide]").forEach(function (b) {
      b.addEventListener("click", function () { openGuideModal(b.dataset.exid); });
    });
    /* swap exercise */
    el.querySelectorAll("[data-swap]").forEach(function (b) {
      b.addEventListener("click", function () { openSwapPanel(+b.dataset.swap, w); });
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
    var ex = (window.EXERCISE_DB && window.EXERCISE_DB[exId]) || (DB && DB.getExercise && DB.getExercise(exId));
    if (!ex) {
      // Fallback: try looking up by pattern + level from DB
      App.toast("Exercise guide not found for: " + exId, "warn");
      return;
    }

    var prog = App.PROGRESSIONS[ex.pattern] || {};
    var levelLabel = ex.level ? ("Level " + ex.level + " · " + (prog.label || ex.pattern)) : ("Era II · " + (prog.label || ex.pattern));
    var modeStr = ex.mode === "hold" ? "Timed hold (" + ex.unit + ")" : "Reps-based (" + ex.unit + ")";
    var equipStr = (ex.equipment && ex.equipment.length) ? ex.equipment.join(", ") : "Bodyweight only";

    document.getElementById("guide-pattern").textContent = (prog.label || ex.pattern).toUpperCase();
    document.getElementById("guide-level-badge").textContent = ex.level ? ("L" + ex.level) : "E2";
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

    // Readiness
    var readinessWrap = document.getElementById("guide-readiness-wrap");
    var readinessTxt = document.getElementById("guide-readiness");
    if (ex.readiness) {
      readinessTxt.textContent = ex.readiness;
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
    kettlebells: "kettlebells", rings: "rings"
  };
  window.EQUIP_LABEL_GLOBAL = EQUIP_LABEL;
  function equipNeeded(ex) {
    var s = App.getState();
    var missing = (ex.equipment || []).filter(function (e) { return !s.equipment[e]; });
    return missing;
  }
  function openSwapPanel(i, w) {
    var ex = w.exercises[i];
    var panel = document.getElementById("swap-panel-" + i);
    if (!panel) return;
    // Toggle closed if already open
    if (panel.getAttribute("data-open") === "1") { panel.innerHTML = ""; panel.removeAttribute("data-open"); return; }
    panel.setAttribute("data-open", "1");

    var all = (DB.listByPattern ? DB.listByPattern(ex.pattern) : []).filter(function (alt) {
      return alt.era !== 2 || App.getState().era === 2;   // hide Era-II tools until graduated
    });
    // Sort: doable (no missing gear) first, then by level/name
    all.sort(function (a, b) {
      var am = equipNeeded(a).length, bm = equipNeeded(b).length;
      if ((am === 0) !== (bm === 0)) return am === 0 ? -1 : 1;
      return (a.level || 99) - (b.level || 99);
    });

    var rows = all.map(function (alt) {
      var missing = equipNeeded(alt);
      var doable = missing.length === 0;
      var isCurrent = alt.id === ex.id;
      var tag = isCurrent ? '<span class="badge badge--primary" style="padding:2px 8px">current</span>'
        : (doable ? '<span class="badge badge--success" style="padding:2px 8px">ready</span>'
                  : '<span class="badge badge--warn" style="padding:2px 8px">needs ' + missing.map(function (m) { return EQUIP_LABEL[m] || m; }).join(", ") + '</span>');
      var lvl = alt.level ? ("L" + alt.level) : "E2";
      return '<button class="swap-opt' + (isCurrent ? " is-current" : "") + (doable ? "" : " is-locked") + '" data-swapto="' + i + "|" + alt.id + '" type="button"' + (isCurrent ? " disabled" : "") + '>' +
        '<span class="swap-opt__lvl">' + lvl + '</span>' +
        '<span class="swap-opt__main"><span class="swap-opt__name">' + esc(alt.name) + '</span>' +
        '<span class="swap-opt__sub">' + (alt.mode === "hold" ? "timed hold" : "reps") + '</span></span>' +
        tag +
      '</button>';
    }).join("");

    panel.innerHTML =
      '<div class="card card--glass stack mt-2" style="border-color:rgba(204,0,0,.25)">' +
        '<div class="row between"><div class="field__label">Swap ' + cap(ex.pattern) + ' movement</div>' +
          '<button class="btn btn--ghost btn--sm" data-swapclose="' + i + '" type="button">Close</button></div>' +
        '<p class="faint text-xs" style="margin:0">Movements you can do with your current equipment are marked <b style="color:var(--success)">ready</b>. Swapping keeps your ' + cap(ex.pattern) + ' progression on track.</p>' +
        '<div class="swap-list">' + rows + '</div>' +
      '</div>';

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
    if (!alt) { App.toast("Couldn't find that movement.", "warn"); return; }
    var ex = w.exercises[i];
    // Replace the movement but keep pattern, sets, target & rest so progression still works.
    ex.id = alt.id;
    ex.name = alt.name;
    ex.mode = alt.mode;
    ex.unit = alt.unit;
    ex.equipment = alt.equipment || [];
    ex.cues = alt.cues || [];
    ex.mistakes = alt.mistakes || [];
    ex.readiness = alt.readiness || "";
    ex.injury = alt.injury || "";
    ex.swapped = true;
    setWorkout(w);
    App.refresh();
    App.toast("Swapped to " + alt.name + ".", "success");
  }

  function openFlagPanel(i, w) {
    var ex = w.exercises[i];
    var parts = DB.bodyPartsFor(ex.pattern);
    var panel = document.getElementById("flag-panel-" + i);
    if (!parts.length) { panel.innerHTML = '<p class="faint text-xs mt-2">No substitution map for this pattern — rest if needed.</p>'; return; }
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
          (sub ? '<div class="card" style="padding:var(--sp-3)"><div class="drow__sub">SAFE SWAP</div>' +
            '<div class="drow__title">' + esc(sub.name) + '</div><p class="muted text-xs mt-2">' + esc(sub.cue) + '</p></div>' : "") +
          '<div class="row" style="gap:var(--sp-2)">' +
            '<button class="btn btn--secondary btn--sm grow" id="flag-apply-' + i + '">Apply swap</button>' +
            (ex.flag ? '<button class="btn btn--ghost btn--sm" id="flag-clear-' + i + '">Clear</button>' : "") +
          '</div>' +
        '</div>';
      document.getElementById("flag-bp-" + i).addEventListener("change", function (e) { f.bodyPart = e.target.value; draw(); });
      document.getElementById("flag-sev-" + i).addEventListener("change", function (e) { f.severity = e.target.value; draw(); });
      document.getElementById("flag-apply-" + i).addEventListener("click", function () {
        var sub2 = DB.substitute(ex.pattern, f.bodyPart, f.severity, App.getState().era);
        ex.flag = { bodyPart: f.bodyPart, severity: f.severity, substitutedTo: sub2 ? sub2.name : null };
        if (sub2) { ex.name = sub2.name; }
        setWorkout(w); App.refresh();
        App.toast("Swapped to a joint-friendly variation.", "warn");
      });
      var clr = document.getElementById("flag-clear-" + i);
      if (clr) clr.addEventListener("click", function () { ex.flag = null; setWorkout(w); App.refresh(); });
    }
    draw();
  }

  function completeSession(w) {
    /* require at least one logged value */
    var any = w.exercises.some(function (ex) { return ex.sets.some(function (st) { return Number(st.value) > 0; }); });
    if (!any) { App.toast("Log at least one set before completing.", "warn"); return; }

    var res = engine.finalizeSession(w);
    clearWorkout(); rtStop();

    /* celebrate */
    res.prs.forEach(function (p) {
      App.toast("New " + p.kind + " PR · " + p.exercise + ": " + p.value + (p.kind === "hold" ? "s" : ""), "success", 4200);
    });
    res.levelUps.forEach(function (l) {
      App.toast("Level up! " + cap(l.pattern) + " → L" + l.level + " · " + l.name, "success", 4600);
    });
    var grad = engine.checkGraduation();
    if (grad) App.toast("Era II unlocked — weighted tools are live.", "success", 5000);

    App.toast("Session logged. " + (res.prs.length || res.levelUps.length ? "Strong work." : "Recovery counts too."), "info");

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
        '<span class="check__box" data-check="' + kind + '" data-idx="' + i + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg></span>' +
        '<div class="grow" data-check="' + kind + '" data-idx="' + i + '"><div class="row between"><span class="check__name">' + esc(it.name) + '</span>' +
        '<span class="check__detail">' + esc(it.detail) + '</span></div>' +
        '<div class="check__cue">' + esc(it.cue) + '</div></div>' +
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
      '<span class="badge">' + lib.relTime(last.dateISO) + '</span></div>' +
      '<div class="kv"><span class="kv__k">' + DAY_LABEL[last.type] + '</span>' +
      '<span class="kv__v">' + (last.exercises || []).length + ' movements · vol ' + (last.volume || 0) + '</span></div></div>';
  }
  function streakStripCard(s) {
    var days = 21, today = lib.today();
    var doneKeys = {};
    s.sessions.forEach(function (x) { if (x.completed) doneKeys[lib.dayKey(x.dateISO)] = (doneKeys[lib.dayKey(x.dateISO)] || 0) + 1; });
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

  /* expose a couple of shared bits for later parts */
  App.ui.head = head;
  App.ui.confirm = ensureConfirm;
  App.ui.cap = cap;
  App.ui.eraBadge = eraBadge;

  /* ======================================================================
     MOUNT (after the core's own DOMContentLoaded registration)
     ==================================================================== */
  App.renderOnboarding = renderOnboarding;   // set now; core calls it in bootstrap()

  /* ======================================================================
     REST TIMER — between-set countdown with audio beep.
     Auto-starts when a set is marked done; adjustable per exercise.
     Default 90s; remembers the last duration the user set in this session.
     ==================================================================== */
  var RT = { id: null, remaining: 0, total: 90, paused: false, last: 90, label: "Rest", done: false, onDone: null };

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
      else if (a === "pause") { RT.paused = !RT.paused; var pb = document.getElementById("rt-pause"); if (pb) pb.textContent = RT.paused ? "Resume" : "Pause"; }
      else { var d = Number(a); RT.remaining = lib.clamp(RT.remaining + d, 0, 1800); RT.total = Math.max(RT.total, RT.remaining); RT.last = RT.remaining || RT.last; RT.done = false; bar.classList.remove("is-done"); rtPaint(); }
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
    RT.remaining -= 1;
    if (RT.remaining <= 0) {
      RT.remaining = 0; RT.done = true;
      rtPaint(); rtBeep();
      var bar = document.getElementById("rest-timer");
      if (bar) bar.classList.add("is-done");
      if (RT.id) { clearInterval(RT.id); RT.id = null; }
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
    var pb = document.getElementById("rt-pause"); if (pb) pb.textContent = "Pause";
    bar.classList.add("is-on"); bar.classList.remove("is-done");
    rtPaint();
    if (RT.id) clearInterval(RT.id);
    RT.id = setInterval(rtTick, 1000);
  }

  function rtStop() {
    if (RT.id) { clearInterval(RT.id); RT.id = null; }
    RT.done = false; RT.onDone = null;
    var bar = document.getElementById("rest-timer");
    if (bar) bar.classList.remove("is-on", "is-done", "rt--final");
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
    if (e.code === "Space") { e.preventDefault(); RT.paused = !RT.paused; var pb = document.getElementById("rt-pause"); if (pb) pb.textContent = RT.paused ? "Resume" : "Pause"; }
    else if (e.code === "Escape") { rtStop(); }
  });

  function mount() {
    App.registerView("today", renderToday);
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
     reads it against the user's goal. For a clean bulk the sweet spot is
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
    var goal = (s.profile && s.profile.goal) || "both";
    var bulk = (goal === "size" || goal === "both");
    if (bulk) {
      if (perWk <= -0.1) return { kgWk: perWk, color: "danger",  text: "Losing weight on a bulk — add ~250 kcal/day." };
      if (perWk <   0.1) return { kgWk: perWk, color: "warn",    text: "Barely moving — nudge the surplus up to start gaining." };
      if (perWk <=  0.5) return { kgWk: perWk, color: "success", text: "Ideal lean-gain pace. Hold this." };
      if (perWk <= 0.75) return { kgWk: perWk, color: "warn",    text: "A touch fast — fine for a hard gainer, but watch the mirror." };
      return { kgWk: perWk, color: "danger", text: "Gaining fast — likely some fat. Trim the surplus a little." };
    }
    /* strength-only / recomp / cut goals: holding bodyweight is the win */
    if (perWk >  0.3) return { kgWk: perWk, color: "warn", text: "Gaining quicker than your goal calls for." };
    if (perWk < -0.7) return { kgWk: perWk, color: "warn", text: "Dropping fast — ease the deficit to protect strength." };
    return { kgWk: perWk, color: "success", text: "Bodyweight steady — on track for your goal." };
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
  function completedThisWeek(s) {
    var wk = weekStartKey(lib.today());
    return engine.completedSessions().filter(function (x) { return weekStartKey(x.dateISO) === wk; }).length;
  }

  function completedThisPhase(s) {
    var start = s.currentPhase.startISO;
    return engine.completedSessions().filter(function (x) { return lib.daysBetween(start, x.dateISO) >= 0; }).length;
  }

  /* ======================================================================
     B. STATE WRITERS  (public contract only)
     ==================================================================== */
  function logBodyweight(kg) {
    kg = lib.round(kg, 1);
    if (!(kg > 0)) { App.toast("Enter a valid bodyweight.", "warn"); return; }
    var s = App.getState(), k = lib.today();
    var todayEntry = s.bodyweightLog.filter(function (b) { return lib.dayKey(b.dateISO) === k; })[0];
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
    var entry = s.sleepLog.filter(function (x) { return lib.dayKey(x.dateISO) === k; })[0];
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
      if (x.completed) { var k = lib.dayKey(x.dateISO); per[k] = (per[k] || 0) + 1; }
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
      'Hit <b>Today</b> and tap <b>Begin session</b> — the plan auto-builds from your starting levels.',
      'Log every set honestly. The OS reads your reps and difficulty to decide when to make things harder.',
      (hasBar ? 'Anything you can\'t do? Use <b>Swap exercise</b> to pick an alternative for the same muscle group.'
              : 'No pull-up bar yet? When you swap a pull or dip, bar-free options like rows and chair dips show as <b>ready</b>.'),
      'Weigh in weekly and log sleep — both feed your monthly Phase Report Card.'
    ];
    /* Day-one guidance sits BELOW the real call to action, and its button is a
       ghost — the "Up next" card owns the one primary action on this screen.
       Two full-width orange buttons meaning the same thing made neither read
       as the thing to press. */
    return '<div class="card stack">' +
      '<div class="row between wrap"><div><div class="eyebrow">Day one</div>' +
      '<h2 class="display h3">Welcome to the frame</h2></div>' +
      '<span class="badge badge--era1"><span class="dot"></span>Era I begins</span></div>' +
      '<p class="muted text-sm" style="max-width:60ch">You\'re set up and ready. Here\'s how to get the most out of your first few weeks:</p>' +
      '<ol class="frun-list">' + tips.map(function (t) { return '<li>' + t + '</li>'; }).join("") + '</ol>' +
      '<button class="btn btn--ghost btn--block" data-go="today">' +
        '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>' +
        'Start your first session</button>' +
    '</div>';
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
      heroCard(s, rec, wip) +

      /* ---- day-one coaching (only before the first session) ----
         Below the hero: on day one the thing to do is start, and the four
         tips are support for that action rather than a gate in front of it. */
      (done.length === 0 ? firstRunBanner(s) : "") +

      /* ---- top stat tiles ---- */
      '<div class="grid grid-4 mt-6">' +
        util.statTile("Phase day", dayInfo.day + "/" + phase.lengthDays, dayInfo.remaining + " days to report card") +
        util.statTile("Streak", String(engine.liveStreak(s)), (s.streak.best ? "best " + s.streak.best + " 🔥" : (engine.liveStreak(s) > 0 ? "keep going" : "start one today"))) +
        util.statTile("Bodyweight", (bw == null ? "—" : bw) + '<small>kg</small>', bw == null ? "not logged yet" : (bwDelta == null ? "log to track trend" : (bwDelta > 0 ? "+" + bwDelta + " kg/wk" : (bwDelta < 0 ? bwDelta + " kg/wk" : "holding steady")))) +
        util.statTile("This week", weekN + "/" + engine.DAYS_PER_WEEK, weekN >= engine.DAYS_PER_WEEK ? "target hit ✔" : "sessions logged") +
      '</div>' +

      /* ---- phase progress + era panel ---- */
      '<div class="grid grid-tier-dash mt-4" style="grid-template-columns:1.5fr 1fr">' +
        phaseCard(s, phase, dayInfo, phaseN, expected) +
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
  function heroCard(s, rec, wip) {
    /* A session in progress shows what it actually contains; an upcoming one
       shows what the current length preference would build. */
    var chips = (wip
      ? (wip.exercises || []).map(function (ex) {
          return '<span class="chip">' + ui.cap(ex.pattern) + ' · ' + esc(ex.name) + "</span>";
        })
      : engine.patternsFor(rec, (s.prefs && s.prefs.sessionLength) || "focused").map(function (p) {
          var m = engine.movementFor(p);
          return '<span class="chip">' + ui.cap(p) + ' · ' + esc(m.name) + "</span>";
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
  function phaseCard(s, phase, dayInfo, phaseN, expected) {
    var cadencePct = lib.pct(phaseN, expected);
    var onTrack = phaseN >= Math.round(expected * (dayInfo.pct / 100));
    return '<div class="card card--notch">' +
      '<div class="card__head"><div class="card__title">Phase ' + phase.number + " progress</div>" +
        '<span class="badge">' + dayInfo.pct + "% of cycle</span></div>" +
      '<div class="progress" style="height:12px"><div class="progress__bar" style="width:' + dayInfo.pct + '%"></div></div>' +
      '<div class="progress__meta mt-4"><span>Sessions completed</span><span><b>' + phaseN + "</b> / " + expected + " expected</span></div>" +
      '<div class="progress progress--cyan progress--thin metric-bar"><div class="progress__bar" style="width:' + cadencePct + '%"></div></div>' +
      '<p class="muted text-xs mt-2">' +
        (onTrack ? "On pace for this phase — keep the cadence steady." : "A little behind pace — aim for " + engine.DAYS_PER_WEEK + " sessions this week to catch up.") +
      '</p>' +
      '<div class="divider"></div>' +
      '<div class="row between"><div class="field__label">Last 4 weeks</div>' +
        '<span class="badge badge--primary"><span class="dot"></span>' + engine.liveStreak(s) + " day streak</span></div>" +
      '<div class="mt-2">' + heatStrip(s, 28) + "</div>" +
      '<p class="faint text-xs mt-4">A Phase Report Card auto-generates at day ' + phase.lengthDays +
        ', grading completion, rep ratios, bodyweight trend and recovery — then advances, consolidates or deloads you.</p>' +
    '</div>';
  }

  /* ---- era panel: benchmarks (Era I) or toolkit (Era II) ---- */
  function eraPanel(s) {
    if (s.era === 2) {
      var owned = Object.keys(s.equipment).filter(function (k) { return k !== "nothing" && s.equipment[k]; });
      var acc = engine.era2Accessory(engine.recommendedDayType());
      var chips = owned.length
        ? owned.map(function (k) { return '<span class="chip">' + ui.cap(k) + "</span>"; }).join("")
        : '<span class="chip">bodyweight only</span>';
      return '<div class="card">' +
        '<div class="card__head"><div class="card__title">Era II toolkit</div>' +
          '<span class="badge badge--era2"><span class="dot"></span>unlocked</span></div>' +
        '<p class="muted text-sm">Weighted overload is live. The engine slots an accessory into eligible sessions when your gear allows.</p>' +
        '<div class="field__label mt-4 mb-2">Available equipment</div><div class="chips">' + chips + "</div>" +
        (acc ? '<div class="kv mt-4"><span class="kv__k">Next accessory</span><span class="kv__v">' + esc(acc.name) + "</span></div>" : "") +
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
            '<div class="drow__sub">' + (p.kind === "hold" ? "max hold" : (p.kind === "weight" ? "top weight" : "best set")) +
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
     • "progress"  — bodyweight + volume + sleep charts (Chart.js), the 7-pattern
                     movement tier ladder, PR timeline, and a measurements logger.
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
  /* delta of latest vs a reference ~7+ days back (else earliest) — kg/wk feel */
  function weekDelta(s) {
    var log = s.bodyweightLog || [];
    if (log.length < 2) return null;
    var latest = log[log.length - 1], ref = log[0];
    for (var i = log.length - 2; i >= 0; i--) {
      ref = log[i];
      if (lib.daysBetween(log[i].dateISO, latest.dateISO) >= 7) break;
    }
    return lib.round(latest.kg - ref.kg, 1);
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
      var wk = weekStartKey(x.dateISO);
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
    var todayEntry = (s.bodyweightLog || []).filter(function (b) { return lib.dayKey(b.dateISO) === k; })[0];
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
    var entry = (s.sleepLog || []).filter(function (x) { return lib.dayKey(x.dateISO) === k; })[0];
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
    var todayEntry = (s.measurements || []).filter(function (x) { return lib.dayKey(x.dateISO) === k; })[0];
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
    var arrow = (wk == null || wk === 0) ? "\u2192" : (wk > 0 ? "\u25b2" : "\u25bc");
    var arrCls = (wk == null || wk === 0) ? "dash-delta--flat" : (wk > 0 ? "dash-delta--up" : "dash-delta--down");
    var wkPill = (wk == null)
      ? '<span class="dash-delta dash-delta--flat">' + arrow + ' baseline</span>'
      : '<span class="dash-delta ' + arrCls + '">' + arrow + ' ' + (wk > 0 ? "+" : "") + wk + ' kg / wk</span>';
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
      : chartEmpty(240, "Finish sessions in Today to build your weekly volume history.");
    return '<div class="card">' +
      '<div class="card__head"><div class="card__title">Training volume \u00b7 last 8 weeks</div>' + pill + '</div>' +
      body +
      '<p class="faint text-xs mt-4 mono">Volume = rep-units across all sets (weighted reps \u00d71.5; holds \u00f75s). Weekly avg ' +
        (nonZero.length ? avg : "\u2014") + '.</p>' +
    '</div>';
  }

  function tierLadderCard(s) {
    var patterns = (DB && DB.PATTERNS) || ["push", "pull", "squat", "hinge", "core", "shoulder", "dip"];
    var stalls = (engine.tierStalls && engine.tierStalls()) || {};
    var cards = patterns.map(function (p) {
      var t = s.tiers[p] || { level: 1, progress: 0 };
      var prog = App.PROGRESSIONS[p] || { label: ui.cap(p), levels: [], era2: [] };
      var cur = engine.movementFor(p);
      var nextEx = (t.level < 6) ? DB.byLevel(p, t.level + 1) : null;
      var nextName = nextEx ? nextEx.name : "Top of ladder";

      /* 6 calisthenics rungs */
      var rungs = "";
      for (var lvl = 1; lvl <= 6; lvl++) {
        var ex = DB.byLevel(p, lvl);
        var nm = ex ? ex.name : (prog.levels[lvl - 1] || ("Level " + lvl));
        var cls = lvl < t.level ? "is-done" : (lvl === t.level ? "is-current" : "is-locked");
        rungs += '<div class="rung ' + cls + '"><span class="rung__lvl">L' + lvl + '</span>' +
          '<span class="rung__name">' + esc(nm) + '</span>' +
          (lvl === t.level ? '<span class="badge badge--primary" style="padding:2px 7px">now</span>' : '') + '</div>';
      }
      /* optional Era II unlock rungs (dashed) */
      (prog.era2 || []).forEach(function (nm2) {
        var unlocked = s.era === 2;
        rungs += '<div class="rung is-era2 ' + (unlocked ? "is-unlocked" : "is-locked") + '">' +
          '<span class="rung__lvl">E2</span><span class="rung__name">' + esc(nm2) + '</span>' +
          '<span class="badge ' + (unlocked ? "badge--era2" : "") + '" style="padding:2px 7px">' + (unlocked ? "unlocked" : "locked") + '</span></div>';
      });

      return '<div class="card stack' + (stalls[p] ? " is-stalled" : "") + '">' +
        '<div class="card__head"><div class="card__title">' + esc(prog.label) +
          (stalls[p] ? ' <span class="badge badge--warn badge--stall" title="No level gain across the last 2 phases"><span class="dot"></span>Plateau</span>' : '') +
          '</div>' +
          '<span class="badge badge--primary">L' + t.level + ' / 6</span></div>' +
        '<div><div class="tier-card__cur">' + esc(cur ? cur.name : nextName) + '</div>' +
          '<div class="tier-card__nxt">' + (t.level < 6 ? ("Next unlock: " + esc(nextName)) : "Mastered \u2014 ladder complete") + '</div></div>' +
        '<div class="progress"><div class="progress__bar" style="width:' + lib.clamp(t.progress || 0, 0, 100) + '%"></div></div>' +
        '<div class="progress__meta" style="margin-bottom:0"><span>progress to L' + Math.min(t.level + 1, 6) + '</span><b>' + lib.clamp(t.progress || 0, 0, 100) + '%</b></div>' +
        (stalls[p] ? '<p class="faint text-xs" style="margin:0;color:var(--warn)">Stalled 2+ phases — try an accessory, extra set, or drop a level to rebuild clean volume.</p>' : '') +
        '<div class="ladder">' + rungs + '</div>' +
      '</div>';
    }).join("");
    return '<div class="page-head" style="margin-top:var(--sp-8)"><div class="eyebrow">Movement mastery</div>' +
      '<h2 class="display h3">Tier ladders</h2></div>' +
      '<div class="tier-grid">' + cards + '</div>';
  }

  function prTimelineCard(s) {
    var prs = (s.prs || []).slice().sort(function (a, b) { return new Date(b.dateISO) - new Date(a.dateISO); });
    var body = prs.length
      ? prs.map(function (p) {
          var val = p.kind === "hold" ? (p.value + "s") : (p.kind === "weight" ? (p.value + " kg") : (p.value + " reps"));
          var kindL = p.kind === "hold" ? "max hold" : (p.kind === "weight" ? "top weight" : "best set");
          return '<div class="pr-row">' +
            '<span class="pr-row__dot"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 0 12 0V3H6z"/><path d="M6 4H3v2a3 3 0 0 0 3 3M18 4h3v2a3 3 0 0 1-3 3M9 21h6M12 15v6"/></svg></span>' +
            '<div class="pr-row__main"><div class="pr-row__t">' + esc(p.exercise) + '</div>' +
              '<div class="pr-row__s">' + kindL + ' \u00b7 ' + lib.relTime(p.dateISO) + ' \u00b7 ' + lib.fmtShort(p.dateISO) + '</div></div>' +
            '<div class="pr-row__v">' + val + '</div></div>';
        }).join("")
      : '<p class="empty-mini">No personal records yet. Finish a session in Today and the OS captures your best set or hold per movement.</p>';
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
    log.forEach(function (x) { byDay[lib.dayKey(x.dateISO)] = x; });
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
    var DAY_LABEL = { push: "Push", pull: "Pull", legs: "Legs & Hips", fullbody: "Full Body & Core" };
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
                '<span class="note-item__date mono">' + lib.fmtShort(x.dateISO) + ' \u00b7 ' + lib.relTime(x.dateISO) + '</span></div>' +
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
      upcomingDaysCard(s) +
    '</div>';
  }

  /* Project the next training days from the rotation. The program runs 4
     days/week; we lay the rotation onto a Mon/Tue/Thu/Fri-style cadence,
     continuing the Push→Pull→Legs→Full cycle.

     TODAY COUNTS. The cursor is tested before it advances, so a training day
     you haven't logged yet is the next session rather than being skipped.
     Advancing first — which is what this did — meant that on a Mon/Tue/Thu/Fri
     cadence, four days in seven opened the calendar to a blank today and a
     "next session" of tomorrow. */
  function projectUpcoming(s, count) {
    var rotation = engine.ROTATION;
    var done = engine.completedSessions();
    var last = done.length ? done[done.length - 1] : null;
    var idx = last ? rotation.indexOf(last.type) : -1;       // next = idx+1
    // training weekdays (Mon=1,Tue=2,Thu=4,Fri=5) — 4 sessions/week
    var trainDows = [1, 2, 4, 5];
    var out = [];
    var todayKey = lib.today();
    /* Already trained today? Then today is behind you and the next session is
       the following training day. */
    var doneToday = done.some(function (x) { return lib.dayKey(x.dateISO) === todayKey; });
    var cursor = lib.addDays(lib.parse(todayKey), doneToday ? 1 : 0);
    var guard = 0;
    while (out.length < count && guard < 60) {
      guard++;
      var dow = cursor.getDay(); // 0=Sun..6=Sat
      if (trainDows.indexOf(dow) !== -1) {
        idx = (idx + 1) % rotation.length;
        var k = lib.dayKey(cursor.toISOString());
        out.push({ dateISO: cursor.toISOString(), key: k, type: rotation[idx], isToday: k === todayKey });
      }
      cursor = lib.addDays(cursor, 1);
    }
    return out;
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
  function typeCls(t) { return t === "legs" ? "is-legs" : (t === "fullbody" ? "is-full" : ""); }

  /* The single most-asked question of this page, answered before the grid
     rather than under it. */
  function nextSessionBanner(s) {
    var up = projectUpcoming(s, 1);
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

  function upcomingDaysCard(s) {
    var up = projectUpcoming(s, 6);
    if (!up.length) return "";
    var rows = up.map(function (u, i) {
      return '<div class="upcoming__row' + (i === 0 ? " is-next" : "") + '">' +
        '<span class="upcoming__when">' + esc(whenLabel(u.key)) +
          '<small>' + esc(shortDate(u.dateISO)) + '</small></span>' +
        '<span class="upcoming__type ' + typeCls(u.type) + '">' +
          esc(engine.DAY_LABEL[u.type] || u.type) + '</span>' +
      '</div>';
    }).join("");
    return '<div class="upcoming mt-5">' +
      '<div class="upcoming__head">Upcoming sessions</div>' +
      '<p class="faint text-xs" style="margin:0 0 var(--sp-3)">Projected from your Push → Pull → Legs → Full rotation. Actual days adapt as you log sessions.</p>' +
      rows +
    '</div>';
  }

  var DAY_TYPE_COLOR = {
    push:     "cal-day--trained",
    pull:     "cal-day--trained",
    legs:     "cal-day--trained cal-day--easy",
    fullbody: "cal-day--trained cal-day--hard"
  };
  var DAY_TYPE_LABEL = {
    push: "Push", pull: "Pull", legs: "Legs", fullbody: "Full"
  };
  var MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DOW = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  function buildCalendar(s) {
    var yr = calState.year, mo = calState.month;
    var sessions = engine.completedSessions();

    // Index sessions by day key
    var byDay = {};
    sessions.forEach(function (sess) {
      var k = lib.dayKey(sess.dateISO);
      if (!byDay[k]) byDay[k] = [];
      byDay[k].push(sess);
    });

    // Project upcoming planned sessions (only show future ones on this month)
    var planned = {};
    var upcoming = projectUpcoming(s, 12);
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
      '<div class="cal-legend__item"><span class="cal-legend__swatch cal-legend__swatch--next"></span>Next session</div>' +
      '<div class="cal-legend__item"><span class="cal-legend__swatch cal-legend__swatch--planned"></span>Planned</div>' +
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
      body = '<div class="empty-mini">No sessions logged yet. Finish a workout in Today and it\'ll appear here to review, edit or remove.</div>';
    } else {
      body = '<div class="sess-log">' + done.map(function (x) {
        var dayLabel = ({ push: "Push", pull: "Pull", legs: "Legs", fullbody: "Full Body" })[x.type] || cap(x.type || "session");
        return '<div class="sess-log__row" data-sid="' + esc(x.id) + '">' +
          '<div class="grow"><div class="sess-log__t">' + dayLabel + '</div>' +
            '<div class="sess-log__s">' + lib.relTime(x.dateISO) + ' · ' + (x.exercises || []).length + ' movements · vol ' + (x.volume || 0) +
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
    var exs = (sess.exercises || []);
    var rows = exs.length ? exs.map(function (ex) {
      var unit = (ex.mode === "hold" || ex.unit === "sec") ? "sec" : "reps";
      var sets = (ex.sets || []).map(function (st, j) {
        var rep = (st.reps == null || st.reps === "") ? "—" : st.reps;
        var wt  = (st.weight != null && st.weight !== "" && Number(st.weight) > 0) ? (" × " + st.weight + " kg") : "";
        return '<span class="setpill"><b>S' + (j + 1) + '</b> ' + esc(String(rep)) + ' ' + unit + wt + '</span>';
      }).join("");
      var d = ex.difficulty || "moderate";
      var dLabel = d === "moderate" ? "just right" : d;
      var diff = '<span class="mono" style="color:' + (DIFF_C[d] || "var(--text-300)") + ';font-size:var(--fs-2xs);text-transform:uppercase;letter-spacing:.05em">' + esc(dLabel) + '</span>';
      var flag = (ex.flag && ex.flag.bodyPart)
        ? '<span class="badge badge--warn" style="padding:1px 7px;margin-left:6px"><span class="dot"></span>' + esc(ex.flag.bodyPart) + (ex.flag.severity ? " · " + esc(ex.flag.severity) : "") + '</span>' : "";
      return '<div class="sdet-ex">' +
        '<div class="row between" style="gap:var(--sp-2)"><div class="sdet-ex__name">' + esc(ex.name || cap(ex.pattern || "Movement")) +
          (ex.era2 ? ' <span class="faint text-xs">· Era II</span>' : '') + flag + '</div>' + diff + '</div>' +
        '<div class="sdet-sets">' + (sets || '<span class="faint text-xs">no sets logged</span>') + '</div>' +
      '</div>';
    }).join("") : '<div class="empty-mini">No exercise data was captured for this session.</div>';

    var meta = [];
    meta.push((exs.length) + " movements");
    meta.push("vol " + (sess.volume || 0));
    if (sess.warmupDone)   meta.push("warm-up ✓");
    if (sess.cooldownDone) meta.push("cool-down ✓");

    return '<div class="card card--glass stack mt-2 sdet">' +
      '<div class="row between wrap"><div class="eyebrow">Logged session</div>' +
        '<span class="faint text-xs mono">' + lib.relTime(sess.dateISO) + '</span></div>' +
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
     everything you didn't want" into one tap. The stat tiles stay above the
     tabs so the headline numbers survive every switch. */
  var PROG_TABS = [
    { id: "overview",     label: "Overview" },
    { id: "ladders",      label: "Ladders" },
    { id: "calendar",     label: "Calendar" },
    { id: "log",          label: "Log" },
    { id: "body",         label: "Body" }
  ];
  function progTab() {
    var t = util.uiGet("progTab", "overview");
    return PROG_TABS.some(function (x) { return x.id === t; }) ? t : "overview";
  }

  function progTabBody(tab, s) {
    if (tab === "ladders")  return tierLadderCard(s);
    if (tab === "calendar") return trainingCalendarCard(s);
    if (tab === "log")      return '<div id="session-log-wrap">' + sessionLogCard(s) + '</div>' +
                                   '<div class="mt-4">' + notesArchiveCard(s) + '</div>';
    if (tab === "body")     return measurementsCard(s) +
                                   '<div class="mt-4">' + sleepCard(s) + '</div>';
    return '<div class="grid grid-2 grid-bias">' +
             bodyweightCard(s) + volumeCard(s) +
           '</div>' +
           '<div class="mt-4">' + prTimelineCard(s) + '</div>';
  }

  function renderProgress(el, s) {
    var bw = latestBodyweight(s);
    var ph = phaseDelta(s);
    var v = weeklyVolume(s, 8);
    var totalVol = lib.sum(v.data);
    var sleep = s.sleepLog || [];
    var sleepAvg = sleep.length ? lib.round(lib.sum(lib.lastN(sleep, 7), function (x) { return x.hours; }) / Math.min(sleep.length, 7), 1) : 0;
    var tab = progTab();

    el.innerHTML =
      '<div class="page-head row between wrap">' +
        '<div><div class="eyebrow">Trajectory</div><h1 class="display h2">Progress</h1></div>' +
        ui.eraBadge(s) +
      '</div>' +

      '<div class="grid grid-4">' +
        util.statTile("Bodyweight", lib.round(bw, 1) + '<small>kg</small>', ph == null ? "log to track phase" : ("phase " + (ph > 0 ? "+" + ph : ph) + " kg")) +
        util.statTile("Total volume", String(totalVol), "rep-units \u00b7 last 8 wks") +
        util.statTile("Records", String((s.prs || []).length), "PRs captured") +
        util.statTile("Sleep avg", sleep.length ? (sleepAvg + '<small>h</small>') : "\u2014", sleep.length ? "last 7 nights" : "not logged yet") +
      '</div>' +

      '<div class="seg mt-4" role="tablist" aria-label="Progress sections">' +
        PROG_TABS.map(function (t) {
          return '<button class="seg__btn' + (t.id === tab ? " is-active" : "") + '" role="tab" ' +
            'aria-selected="' + (t.id === tab) + '" data-progtab="' + t.id + '" type="button">' +
            esc(t.label) + '</button>';
        }).join("") +
      '</div>' +

      '<div class="mt-4" id="prog-body">' + progTabBody(tab, s) + '</div>' +

      '<p class="faint text-xs mt-6 mono">PROGRESS ONLINE \u00b7 ' + (s.bodyweightLog || []).length + ' weigh-ins \u00b7 ' +
        (s.measurements || []).length + ' measurement sets \u00b7 ' + engine.completedSessions().length + ' sessions \u00b7 stored locally.</p>';

    el.querySelectorAll("[data-progtab]").forEach(function (b) {
      b.addEventListener("click", function () {
        util.uiSet("progTab", b.dataset.progtab);
        renderProgress(el, s);
        /* Jump to the tab strip, not the top \u2014 switching tabs shouldn't cost
           you the scroll position you already chose. */
        var strip = el.querySelector(".seg");
        if (strip) strip.scrollIntoView({ block: "nearest" });
      });
    });

    wireProgress(el, s);
    wireCalendar(el, s);
    drawProgressCharts(el, s);
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
    slog.forEach(function (x) { byDay[lib.dayKey(x.dateISO)] = x; });
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
   The intelligence layer: phase evaluation, the animated Report Card, phase
   advancement (advance / consolidate / deload), the Era-transition flow, plus
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
  var REF_TARGET = { push: 12, pull: 8, squat: 14, hinge: 14, core: 30, shoulder: 6, dip: 8 };
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
  function inPhase(startKey, dateISO) {
    /* Use local date parts to avoid UTC-offset misclassification in UTC+ timezones.
       "2026-06-02T18:30:00.000Z" is June 3 in IST — new Date(iso).getDate() is correct,
       but new Date(iso).toISOString().slice(0,10) is UTC and could be June 2. */
    var d = new Date(dateISO);
    var lk = d.getFullYear() + "-" + (d.getMonth() < 9 ? "0" : "") + (d.getMonth() + 1) + "-" + (d.getDate() < 10 ? "0" : "") + d.getDate();
    return lib.daysBetween(startKey, lk) >= 0;
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
  function isBulk(s) { return ((s.profile && s.profile.goal) || "both") !== "strength"; }

  function weightScore(s, perWk) {
    if (perWk == null) return 0.5;
    if (!isBulk(s)) return lib.clamp(1 - Math.abs(perWk) / 0.35, 0, 1);  // strength: hold weight
    return lib.clamp(1 - Math.abs(perWk - 0.3) / 0.45, 0, 1);            // clean bulk: ~+0.3 kg/wk ideal
  }
  function diffScore(avg) { if (!avg) return 0.5; return lib.clamp(1 - Math.abs(avg - 2.3) / 1.1, 0, 1); } // moderate→hard sweet spot
  function sleepScore(h) {
    if (!h) return 0.5;
    if (h >= 7 && h <= 9) return 1;
    if (h < 7) return lib.clamp(1 - (7 - h) / 3, 0, 1);
    return lib.clamp(1 - (h - 9) / 3, 0.2, 1);
  }
  function gradeFor(score) { return score >= 88 ? "S" : score >= 76 ? "A" : score >= 63 ? "B" : score >= 50 ? "C" : "D"; }
  /* Grade ramp: gold → green → aqua → orange → red, resolved from the active
     palette rather than pinned to Gruvbox. Two names for one thing because
     both are called from separate parts of this file. */
  var GRADE_VAR = { S: "--yellow-bright", A: "--green-bright", B: "--aqua-bright",
                    C: "--orange-bright", D: "--red-bright" };
  var GRADE_FALLBACK = { S: "#fabd2f", A: "#b8bb26", B: "#8ec07c", C: "#fe8019", D: "#fb4934" };
  function gradeColor(g) {
    if (!GRADE_VAR[g]) return "#928374";
    var v = "";
    try { v = getComputedStyle(document.documentElement).getPropertyValue(GRADE_VAR[g]).trim(); } catch (e) {}
    return v || GRADE_FALLBACK[g];
  }
  function gradeHex(g) { return gradeColor(g); }

  function evaluate(s) {
    var phase = s.currentPhase;
    var startKey = lib.dayKey(phase.startISO);
    var dayInfo = util.phaseDayInfo(phase);

    var sess = (s.sessions || []).filter(function (x) { return x.completed && inPhase(startKey, x.dateISO); });

    /* 1 · completion */
    var expected = engine.expectedSessions(phase, sess.length);
    var completionRate = expected ? sess.length / expected : 0;
    var subCompletion = lib.clamp(completionRate, 0, 1);

    /* 2 · rep ratio vs prescribed target */
    var rSum = 0, rN = 0;
    sess.forEach(function (x) {
      (x.exercises || []).forEach(function (ex) {
        if (ex.era2) return;
        var tier = s.tiers[ex.pattern];
        var target = (tier && tier.repsTarget) || REF_TARGET[ex.pattern] || 10;
        if (ex.mode === "hold") target = Math.max(target, 30);
        var vals = (ex.sets || []).map(function (st) { return Number(st.reps) || 0; }).filter(function (v) { return v > 0; });
        if (!vals.length) return;
        var avg = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
        rSum += lib.clamp(avg / target, 0, 1.5); rN++;
      });
    });
    var avgRepsRatio = rN ? rSum / rN : 0;
    /* sub-score clamps at 1.0; raw ratio can exceed 1 (over-performing) but we
       don't reward that — it just means it's time to advance */
    var subReps = rN ? lib.clamp(avgRepsRatio, 0, 1) : 0;

    /* minimum-data ramp: rep ratio only counts fully once 3+ sessions are logged.
       Prevents a single bad day from triggering a premature deload recommendation. */
    var dataConfidence = Math.min(sess.length / 3, 1);
    subReps = subReps * dataConfidence + 0.5 * (1 - dataConfidence);

    /* 3 · weight trend — linear regression on in-phase weigh-ins */
    var pts = [];
    (s.bodyweightLog || []).forEach(function (b) {
      var k = lib.dayKey(b.dateISO);
      if (inPhase(startKey, b.dateISO)) pts.push({ x: lib.daysBetween(startKey, k), y: Number(b.kg) || 0 });
    });
    pts.sort(function (a, b) { return a.x - b.x; });
    var lr = pts.length >= 2 ? linreg(pts) : null;
    var weightTrend = lr ? lr.slope * 7 : null;             // kg / week
    var subWeight = weightScore(s, weightTrend);

    /* 4 · difficulty — prefer exercise-level rating, fall back to session-level so
       the metric isn't perpetually "not rated" when only the session is rated. */
    var dSum = 0, dN = 0, failed = 0;
    sess.forEach(function (x) {
      var sessD = x.difficulty;
      var exWithRating = 0;
      (x.exercises || []).forEach(function (ex) {
        var d = DIFF_NUM[ex.difficulty];
        if (d) { dSum += d; dN++; exWithRating++; if (ex.difficulty === "failed") failed++; }
      });
      /* no exercise-level ratings — count session-level difficulty once per session */
      if (!exWithRating && sessD && DIFF_NUM[sessD]) {
        dSum += DIFF_NUM[sessD]; dN++; if (sessD === "failed") failed++;
      }
    });
    var avgDifficulty = dN ? dSum / dN : 0;
    var subDiff = dN ? diffScore(avgDifficulty) : 0.5;

    /* 5 · sleep */
    var hrs = (s.sleepLog || []).filter(function (z) { return inPhase(startKey, z.dateISO); })
      .map(function (z) { return Number(z.hours) || 0; }).filter(function (h) { return h > 0; });
    var avgSleep = hrs.length ? hrs.reduce(function (a, b) { return a + b; }, 0) / hrs.length : 0;
    var subSleep = hrs.length ? sleepScore(avgSleep) : 0.5;

    /* 6 · plateau flags */
    var flags = [];
    if (sess.length && completionRate < 0.6) {
      flags.push({ title: "Inconsistent attendance",
        body: "Logged " + sess.length + " of ~" + expected + " planned sessions. Aim for " + engine.DAYS_PER_WEEK + "/week so the stimulus stays continuous." });
    }
    if (rN && avgRepsRatio < 0.8) {
      flags.push({ title: "Rep targets slipping",
        body: "Average reps sit below prescribed. Add rest between sets, or drop one level on the stalling pattern to rebuild clean volume." });
    }
    if (dN && (avgDifficulty >= 3.1 || failed >= 3)) {
      flags.push({ title: "Over-reaching",
        body: "Most sets felt hard or failed. Trim volume ~20% next block and bank an extra rest day — strength is built in recovery." });
    }
    if (weightTrend != null && pts.length >= 3 && isBulk(s) && weightTrend <= 0.03) {
      flags.push({ title: "Bodyweight stalled",
        body: "No upward trend despite a surplus target. Add ~150–250 kcal/day, mostly carbs around training, and re-check in a week." });
    }
    if (hrs.length && avgSleep < 6.5) {
      flags.push({ title: "Under-recovering",
        body: "Average sleep " + r1(avgSleep) + "h. Protecting 7–9h does more for progress than any extra set." });
    }
    var partCount = {};
    (s.flagsHistory || []).filter(function (f) { return inPhase(startKey, f.dateISO); })
      .forEach(function (f) { partCount[f.bodyPart] = (partCount[f.bodyPart] || 0) + 1; });
    Object.keys(partCount).forEach(function (bp) {
      if (partCount[bp] >= 2) {
        flags.push({ title: "Recurring " + prettyPart(bp) + " flag",
          body: "Flagged " + partCount[bp] + "× this phase. Keep the joint-friendly swap and add light prehab before loading it again." });
      }
    });

    /* cross-phase plateau: if a pattern's tier level hasn't changed in the last
       3 consecutive phase-history entries, it's genuinely stuck — flag it with
       a targeted prescription rather than a generic deload. */
    var hist = (s.phaseHistory || []).filter(function (h) { return h.tierLevels; });
    if (hist.length >= 2) {
      PATTERNS.forEach(function (p) {
        var snapshots = hist.slice(-3).map(function (h) { return h.tierLevels[p]; }).filter(function (v) { return typeof v === "number"; });
        var currentLevel = (s.tiers[p] || {}).level || 1;
        snapshots.push(currentLevel);
        if (snapshots.length >= 3) {
          var allSame = snapshots.every(function (v) { return v === snapshots[0]; });
          if (allSame && snapshots[0] < 6) {
            /* only flag if not already flagged by rep-ratio check */
            var alreadyFlagged = flags.some(function (f) { return /Rep targets/.test(f.title); });
            if (!alreadyFlagged) {
              flags.push({
                title: cap(p) + " pattern stalled",
                body: p + " has been at Level " + currentLevel + " for " + snapshots.length + " phases. Try adding extra volume (one more set per session), reducing rest by 15 seconds, or swapping to the next variation to break the adaptation plateau."
              });
            }
          }
        }
      });
    }

    /* score — era-aware weighted blend.
       Sleep gets more weight than a generic formula would give it — for a
       58kg athlete in a caloric surplus, sleep IS the adaptation mechanism.
       Flags penalise 3pts each; flag count is capped at 4 to avoid cliff-edges. */
    var W = { completion: 0.28, reps: 0.24, weight: 0.14, diff: 0.14, sleep: 0.20 };
    var raw = subCompletion * W.completion + subReps * W.reps + subWeight * W.weight + subDiff * W.diff + subSleep * W.sleep;
    var score = lib.clamp(Math.round(raw * 100) - Math.min(flags.length, 4) * 3, 0, 100);
    var grade = gradeFor(score);
    var recommendation = recommendAction(score, avgDifficulty, failed, flags, dN, dataConfidence);

    return {
      score: score, grade: grade, recommendation: recommendation, sampleSize: sess.length,
      expected: expected, dayInfo: dayInfo, points: pts, trendLine: lr,
      dataConfidence: dataConfidence,
      metrics: { completionRate: completionRate, avgRepsRatio: avgRepsRatio, weightTrend: weightTrend, avgDifficulty: avgDifficulty, avgSleep: avgSleep, hasReps: rN > 0, hasDiff: dN > 0, hasSleep: hrs.length > 0 },
      subs: { completion: subCompletion, reps: subReps, weight: subWeight, diff: subDiff, sleep: subSleep },
      plateauFlags: flags
    };
  }

  function recommendAction(score, avgDiff, failed, flags, dN, dataConfidence) {
    var overreach = (dN && (avgDiff >= 3.1 || failed >= 3)) || flags.some(function (f) { return /Over-reaching|Under-recovering/.test(f.title); });
    var criticalFlags = flags.filter(function (f) { return /Over-reaching|Under-recovering|Recurring/.test(f.title); }).length;
    /* never deload if we don't have enough data — at least 3 sessions needed */
    if ((dataConfidence || 1) < 0.67) return "consolidate";
    if (overreach || score < 50) return "deload";
    /* advance at 70+ with no critical health flags — was 78, which was too hard to reach */
    if (score >= 70 && criticalFlags === 0) return "advance";
    return "consolidate";
  }

  /* metric display rows (label, raw value string, sub-score 0-1, colour) */
  function metricRows(ev) {
    var m = ev.metrics, sub = ev.subs;
    return [
      { l: "Completion", v: Math.min(Math.round(m.completionRate * 100), 100) + "% · " + ev.sampleSize + "/" + ev.expected, p: sub.completion },
      { l: "Rep ratio", v: m.hasReps ? (m.avgRepsRatio > 1 ? "above target ✔" : Math.round(m.avgRepsRatio * 100) + "% of target") : "no sets", p: sub.reps },
      { l: "Weight trend", v: m.weightTrend == null ? "need 2 weigh-ins" : (m.weightTrend >= 0 ? "+" : "") + r1(m.weightTrend) + " kg/wk", p: sub.weight },
      { l: "Difficulty", v: m.hasDiff ? diffLabel(m.avgDifficulty) : "not rated", p: sub.diff },
      { l: "Sleep", v: m.hasSleep ? r1(m.avgSleep) + " h avg" : "not logged", p: sub.sleep }
    ];
  }
  function diffLabel(a) {
    if (a < 1.6) return "too easy";
    if (a < 2.4) return "dialled in";
    if (a < 3.1) return "challenging";
    return "brutal";
  }
  function subColor(p) { return p >= 0.8 ? "var(--success)" : p >= 0.6 ? "var(--secondary)" : p >= 0.4 ? "var(--warn)" : "var(--danger)"; }

  function coachFeedback(ev, s) {
    var rows = metricRows(ev).filter(function (r) { return !/need|no sets|not /.test(r.v); });
    rows.sort(function (a, b) { return b.p - a.p; });
    var best = rows[0], worst = rows[rows.length - 1];
    var open;
    if (ev.score >= 90) open = "Outstanding phase — this is a peak block.";
    else if (ev.score >= 80) open = "Strong, well-executed phase.";
    else if (ev.score >= 68) open = "Solid work with clear room to sharpen.";
    else if (ev.score >= 55) open = "A mixed phase — the signal is in the gaps.";
    else open = "A tough phase, and that's useful data.";
    var parts = [open];
    if (best && best !== worst) parts.push(best.l.toLowerCase() + " was your anchor (" + best.v + ")");
    if (worst && best !== worst) parts.push("the lever to pull is " + worst.l.toLowerCase() + " (" + worst.v + ")");
    var rec = { advance: "You've earned a step up — Phase " + (s.currentPhase.number + 1) + " adds load.",
                consolidate: "Repeat the block to lock in these levels before pushing.",
                deload: "Back off next block, recover hard, then resume the climb." }[ev.recommendation];
    return parts.join("; ") + ". " + rec;
  }

  /* ----------------------------------------------------------------------
     3. PHASE ADVANCEMENT — generate + save the next phase.
     -------------------------------------------------------------------- */
  function actionLabel(a) { return { advance: "Advance", consolidate: "Consolidate", deload: "Deload" }[a] || cap(a); }
  function actionBlurb(s, a) {
    var n = s.currentPhase.number + 1;
    return {
      advance: "Phase " + n + " nudges rep targets up by 1 where you're hitting them and keeps your hard-won levels. Progressive overload, continued.",
      consolidate: "Phase " + n + " repeats your current movements and targets but tightens rest ~20% — more density to bank the adaptation before reaching for the next level.",
      deload: "Phase " + n + " is a back-off block: working sets drop ~40% and rep targets ease, same movements at lighter intent. Recover, then resume."
    }[a];
  }

  function applyAdvancement(action) {
    var s = App.getState();
    var ev = evaluate(s);
    var phase = s.currentPhase;

    var entry = {
      number: phase.number,
      score: ev.score,
      grade: ev.grade,
      action: action,
      metrics: {
        completionRate: r1(ev.metrics.completionRate),
        avgRepsRatio: r1(ev.metrics.avgRepsRatio),
        weightTrend: ev.metrics.weightTrend == null ? null : r1(ev.metrics.weightTrend),
        avgDifficulty: r1(ev.metrics.avgDifficulty),
        avgSleep: r1(ev.metrics.avgSleep)
      },
      tierLevels: (function () { var o = {}; PATTERNS.forEach(function (p) { o[p] = (s.tiers[p] || {}).level || 1; }); return o; })(),
      plateaus: ev.plateauFlags.map(function (f) { return f.title; }),
      feedback: coachFeedback(ev, s),
      endedISO: lib.iso()
    };
    s.phaseHistory.push(entry);

    /* apply action to the training targets */
    var canOverload = ev.metrics.avgRepsRatio >= 0.9;
    var volumeFactor = 1;
    var wasDeload = phase.action === "deload";   // recovering from a deload — be gentler
    PATTERNS.forEach(function (p) {
      var t = s.tiers[p]; if (!t) return;
      var cur = engine.movementFor(p);
      var isHold = cur && cur.mode === "hold";
      if (action === "advance" && canOverload && !isHold) {
        /* If we just came out of a deload, give +2 rep target to recover faster */
        var bump = wasDeload ? 2 : 1;
        var capTo = (REF_TARGET[p] || 10) + 6;
        t.repsTarget = Math.min((t.repsTarget || REF_TARGET[p] || 10) + bump, capTo);
      } else if (action === "deload") {
        /* Deload: ease rep targets ~30% (was 40%) and only halve progress (not wipe it).
           Gentler reduction means faster recovery in the following phase. */
        t.progress = Math.round((t.progress || 0) * 0.6);   // was 0.5 — keeps more progress
        var base = t.repsTarget || REF_TARGET[p] || 10;
        t.repsTarget = Math.max(isHold ? 20 : 6, Math.round(base * 0.75));  // was 0.7
      }
    });
    if (action === "deload") volumeFactor = 0.6;        // ~40% fewer working sets
    else if (action === "consolidate") volumeFactor = 1; // density handled via shorter rest

    s.currentPhase = { number: phase.number + 1, startISO: lib.iso(), lengthDays: 28, action: action, weighIns: [], volumeFactor: volumeFactor };
    App.saveState();
    return entry;
  }

  /* ----------------------------------------------------------------------
     4. PHASE REPORT CARD modal — animated reveal + advancement controls.
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

  function phaseDiffHTML(s) {
    var hist = (s.phaseHistory || []).filter(function (h) { return h.tierLevels; });
    if (!hist.length) return "";   // need a prior phase to diff against
    var prev = hist[hist.length - 1].tierLevels;
    var changes = [];
    PATTERNS.forEach(function (p) {
      var was = prev[p];
      var now = (s.tiers[p] || {}).level || 1;
      if (typeof was === "number" && now !== was) {
        var up = now > was;
        var nm = (engine.movementFor(p) || {}).name || "";
        changes.push('<div class="rc-diff__row">' +
          '<span class="rc-diff__arrow" style="color:' + (up ? "var(--success)" : "var(--warn)") + '">' + (up ? "▲" : "▼") + '</span>' +
          '<span class="grow">' + cap(p) + ' L' + was + ' → <b>L' + now + '</b>' + (nm ? ' · ' + esc(nm) : "") + '</span></div>');
      }
    });
    // sessions logged this phase
    var phaseStart = s.currentPhase && s.currentPhase.startISO;
    var sessThisPhase = phaseStart ? engine.completedSessions().filter(function (x) {
      return lib.daysBetween(phaseStart, x.dateISO) >= 0;
    }).length : 0;

    var body = changes.length
      ? '<div class="rc-diff">' + changes.join("") + '</div>'
      : '<div class="rc-flag" style="border-left-color:var(--secondary);background:var(--secondary-soft)"><div class="rc-flag__b">No tier level changes this phase — you held your ground. Consistency now sets up the next jump.</div></div>';

    return '<div class="rc-section"><div class="rc-section__h">What changed this phase</div>' +
      '<p class="rc-sub" style="margin-bottom:var(--sp-2)">' + sessThisPhase + ' session' + (sessThisPhase === 1 ? "" : "s") + ' logged since the last report card.</p>' +
      body + '</div>';
  }

  function reportHTML(ev, s) {
    var phase = s.currentPhase;
    var range = keyLabel(lib.dayKey(phase.startISO)) + " → " + keyLabel(lib.today());
    var g = ev.grade, gc = gradeColor(g);

    var rows = metricRows(ev).map(function (r) {
      var c = subColor(r.p);
      return '<div class="ev-metric">' +
        '<span class="ev-metric__l">' + r.l + '</span>' +
        '<span class="ev-bar"><span class="ev-bar__fill" data-w="' + Math.round(r.p * 100) + '" style="--c:' + c + '"></span></span>' +
        '<span class="ev-metric__v">' + r.v + '</span></div>';
    }).join("");

    var flags = ev.plateauFlags.length
      ? '<div class="rc-section"><div class="rc-section__h">Plateau interventions</div>' +
          ev.plateauFlags.map(function (f) {
            return '<div class="rc-flag"><div class="rc-flag__t">' + esc(f.title) + '</div><div class="rc-flag__b">' + esc(f.body) + '</div></div>';
          }).join("") + '</div>'
      : '<div class="rc-section"><div class="rc-flag" style="border-left-color:var(--success);background:var(--success-soft)">' +
          '<div class="rc-flag__t" style="color:var(--success)">No plateaus detected</div>' +
          '<div class="rc-flag__b">Recovery, volume and progression are all tracking. Keep stacking clean reps.</div></div></div>';

    var era = (s.era === 2)
      ? '<div class="rc-section"><div class="rc-era"><div class="rc-era__t">Era II · Hybrid Strength active</div>' +
          '<p class="text-sm muted" style="margin-top:4px">All Era I benchmarks cleared — weighted overload tools are unlocked and now seed your sessions automatically.</p></div></div>'
      : '';

    var rec = ev.recommendation;
    var seg = ["advance", "consolidate", "deload"].map(function (a) {
      return '<button class="seg__btn ' + (a === rec ? "is-active" : "") + '" data-rc-act="' + a + '">' + actionLabel(a) + '</button>';
    }).join("");

    var next =
      '<div class="rc-section"><div class="rc-section__h">Next phase preview</div>' +
        '<div class="rc-next">' +
          '<div class="row between wrap" style="align-items:flex-start;gap:var(--sp-2)">' +
            '<div><div class="rc-sub">Recommended</div><div class="rc-next__act" style="color:' + gradeColor(g) + '">' + actionLabel(rec) + ' → Phase ' + (phase.number + 1) + '</div></div>' +
            '<span class="badge badge--' + (rec === "advance" ? "success" : rec === "deload" ? "warn" : "primary") + '">' + actionLabel(rec) + '</span>' +
          '</div>' +
          '<p class="text-sm muted mt-2" id="rc-blurb">' + esc(actionBlurb(s, rec)) + '</p>' +
          '<div class="field__label mt-4 mb-2">Override the call</div>' +
          '<div class="seg rc-actionseg" id="rc-seg">' + seg + '</div>' +
        '</div></div>';

    return '<div class="modal__head">' +
        '<div><div class="eyebrow">Phase ' + phase.number + ' · ' + range + '</div>' +
        '<h3 class="display h3">Phase Report Card</h3></div>' +
        '<button class="modal__close" data-close aria-label="Close">' +
          '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button></div>' +

      '<div class="rc-head">' +
        '<div class="ring rc-ring" id="rc-ring" style="--p:0;--c:' + gc + '"><div class="ring__in">' +
          '<div class="ring__v" id="rc-score-num" style="color:' + gc + '">0</div>' +
          '<div class="ring__l">score</div></div></div>' +
        '<div class="rc-grade" style="color:' + gc + '">' + g + '</div>' +
        '<div class="rc-sub">' + ev.sampleSize + ' session' + (ev.sampleSize === 1 ? "" : "s") + ' graded · day ' + ev.dayInfo.day + '/' + phase.lengthDays +
          (ev.dataConfidence < 1 ? ' · <span style="color:var(--warn)">partial data — grade provisional</span>' : '') + '</div>' +
      '</div>' +

      '<div class="rc-section"><div class="rc-section__h">Metric breakdown</div><div class="ev-mgrid">' + rows + '</div></div>' +
      phaseDiffHTML(s) +
      '<div class="rc-section"><div class="rc-section__h">Coach feedback</div><div class="rc-fb">' + esc(coachFeedback(ev, s)) + '</div></div>' +
      flags + era + next +

      '<div class="modal__foot">' +
        '<button class="btn btn--ghost" data-close>Not yet</button>' +
        '<button class="btn btn--primary" id="rc-apply">Begin Phase ' + (phase.number + 1) + ' →</button>' +
      '</div>';
  }

  function animateReport(dlg, ev) {
    var ring = dlg.querySelector("#rc-ring");
    if (ring) ring.style.setProperty("--p", ev.score);
    dlg.querySelectorAll(".ev-bar__fill").forEach(function (el) {
      el.style.width = (Number(el.dataset.w) || 0) + "%";
    });
    var numEl = dlg.querySelector("#rc-score-num");
    if (numEl) {
      var start = null, dur = 750, target = ev.score;
      function step(ts) {
        if (start == null) start = ts;
        var t = Math.min((ts - start) / dur, 1);
        numEl.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step); else numEl.textContent = target;
      }
      requestAnimationFrame(step);
    }
  }

  function openReportCard() {
    var s = App.getState();
    var ev = evaluate(s);
    var phase = s.currentPhase;
    var m = ensureReportModal();
    var dlg = m.querySelector(".modal__dialog");
    dlg.innerHTML = reportHTML(ev, s);

    var chosen = { action: ev.recommendation };
    dlg.querySelectorAll("[data-rc-act]").forEach(function (b) {
      b.addEventListener("click", function () {
        chosen.action = b.dataset.rcAct;
        dlg.querySelectorAll("[data-rc-act]").forEach(function (x) { x.classList.toggle("is-active", x === b); });
        var blurb = dlg.querySelector("#rc-blurb");
        if (blurb) blurb.textContent = actionBlurb(s, chosen.action);
      });
    });
    var applyBtn = dlg.querySelector("#rc-apply");
    if (applyBtn) {
      applyBtn.addEventListener("click", function () {
        var a = chosen.action;
        applyAdvancement(a);
        App.closeModal("modal-report");
        App.toast("Phase " + phase.number + " closed · grade " + ev.grade + " · Phase " + (phase.number + 1) + " (" + actionLabel(a).toLowerCase() + ") begins.", "success", 4800);
        App.showSection("evaluation");
      });
    }

    App.openModal("modal-report");
    requestAnimationFrame(function () { animateReport(dlg, ev); });
  }

  /* ----------------------------------------------------------------------
     5. EVALUATION VIEW
     -------------------------------------------------------------------- */
  function renderEvaluation(el, s) {
    var ev = evaluate(s);
    var phase = s.currentPhase;
    var info = ev.dayInfo;
    var phaseDone = info.day >= phase.lengthDays;
    var gc = gradeColor(ev.grade);

    var rows = metricRows(ev).map(function (r) {
      return '<div class="ev-metric">' +
        '<span class="ev-metric__l">' + r.l + '</span>' +
        '<span class="ev-bar"><span class="ev-bar__fill" style="width:' + Math.round(r.p * 100) + '%;--c:' + subColor(r.p) + '"></span></span>' +
        '<span class="ev-metric__v">' + r.v + '</span></div>';
    }).join("");

    var hist = (s.phaseHistory || []).slice().reverse();
    var histHtml = hist.length
      ? '<div class="ev-hist">' + hist.map(function (h) {
          return '<div class="ev-hist__row">' +
            '<div class="ev-hist__g" style="color:' + gradeColor(h.grade) + '">' + h.grade + '</div>' +
            '<div class="grow"><div class="ev-hist__t">Phase ' + h.number + ' · ' + actionLabel(h.action) + '</div>' +
            '<div class="ev-hist__s">score ' + h.score + ' · ' + lib.relTime(h.endedISO) + (h.plateaus && h.plateaus.length ? ' · ' + h.plateaus.length + ' flag' + (h.plateaus.length === 1 ? "" : "s") : "") + '</div></div>' +
            '<span class="badge">' + h.score + '</span></div>';
        }).join("") + '</div>'
      : '<div class="empty-mini">No phases closed yet. Train through this block, then close it out here to bank a report card.</div>';

    var chart = ev.points.length >= 2 ? chartBox("ev-bw-chart", 220)
      : chartEmpty(220, "Log bodyweight on two days this phase to chart the trend used for grading.");

    el.innerHTML =
      '<div class="page-head row between wrap">' +
        '<div><div class="eyebrow">Phase intelligence</div><h1 class="display h2">Evaluation</h1></div>' +
        ui.eraBadge(s) +
      '</div>' +

      '<div class="card card--accent card--pad-lg ev-hero stack">' +
        '<div class="row between wrap" style="align-items:flex-start">' +
          '<div><div class="eyebrow">Phase ' + phase.number + ' · ' + actionLabel(phase.action || "start") + '</div>' +
          '<h2 class="display h2">' + (phaseDone ? "Phase complete" : "Day " + info.day + " of " + phase.lengthDays) + '</h2>' +
          '<p class="muted text-sm" style="max-width:48ch">' +
            (phaseDone
              ? "This block is up — close it out to grade your work and generate the next phase."
              : info.remaining + " days until this phase auto-grades. You can preview your standing any time.") +
          '</p></div>' +
          '<div class="ring" style="--p:' + ev.score + ';--c:' + gc + '"><div class="ring__in">' +
            '<div class="ring__v" style="color:' + gc + '">' + ev.score + '</div><div class="ring__l">grade ' + ev.grade + '</div></div></div>' +
        '</div>' +
        '<div class="progress" style="height:12px"><div class="progress__bar" style="width:' + info.pct + '%"></div></div>' +
        '<button class="btn btn--primary btn--lg btn--block" id="ev-open">' +
          '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M8.5 13l-1.5 8 5-3 5 3-1.5-8"/></svg>' +
          (phaseDone ? "Open Phase Report Card" : "Preview Phase Report Card") + '</button>' +
      '</div>' +

      '<div class="card mt-4 stack"><div class="card__head"><div class="card__title">Manual controls</div>' +
        '<span class="badge">your call</span></div>' +
        '<p class="muted text-sm">The phase auto-grades on day ' + phase.lengthDays + ', but life doesn\'t run on a schedule. Close this phase early to bank a report card now, or jump straight into a recovery block when you\'re run down.</p>' +
        '<div class="row" style="gap:var(--sp-2);flex-wrap:wrap">' +
          '<button class="btn btn--secondary btn--sm grow" id="ev-close-now">' +
            '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
            'Close phase &amp; grade now</button>' +
          '<button class="btn btn--ghost btn--sm grow" id="ev-deload-now">' +
            '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6M12 22v-6M4.9 4.9l4.2 4.2M14.9 14.9l4.2 4.2M2 12h6M22 12h-6"/></svg>' +
            'Start a deload block</button>' +
        '</div>' +
        '<p class="faint text-xs">A deload reduces working volume by ~40% for one block so you can recover, then you re-evaluate as normal.</p>' +
      '</div>' +

      '<div class="grid grid-2 mt-4" style="grid-template-columns:1fr 1.1fr">' +
        '<div class="card stack">' +
          '<div class="card__head"><div class="card__title">Live metrics</div>' +
          '<span class="badge">' + ev.sampleSize + ' session' + (ev.sampleSize === 1 ? "" : "s") + '</span></div>' +
          '<div class="ev-mgrid">' + rows + '</div>' +
          '<div class="collapsible" data-coach="scoring"><button class="collapsible__head" data-collapsible type="button" aria-expanded="false">How scoring works' +
            '<svg class="collapsible__chev ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button>' +
            '<div class="collapsible__body"><div class="collapsible__inner"><div class="collapsible__pad">' +
              '<p class="text-sm muted">Score = completion 28% · rep ratio 22% · weight trend 14% · difficulty 12% · sleep 12% · nutrition 12%, minus 4 points per plateau flag. ' +
              'Grades: S 90+ · A 80+ · B 68+ · C 55+ · D below. Each metric scores highest in its healthy band — difficulty peaks at "dialled in", weight at a gentle clean-bulk gain, sleep at 7–9h.</p>' +
            '</div></div></div></div>' +
        '</div>' +
        '<div class="card stack">' +
          '<div class="card__head"><div class="card__title">Bodyweight this phase</div>' +
          '<span class="badge badge--' + (ev.metrics.weightTrend == null ? "info" : ev.metrics.weightTrend > 0 ? "success" : "warn") + '">' +
            (ev.metrics.weightTrend == null ? "baseline" : (ev.metrics.weightTrend >= 0 ? "+" : "") + r1(ev.metrics.weightTrend) + " kg/wk") + '</span></div>' +
          chart +
          '<p class="faint text-xs mono">Dashed line is the least-squares trend feeding the weight-trend metric.</p>' +
        '</div>' +
      '</div>' +

      (ev.plateauFlags.length
        ? '<div class="card mt-4 stack"><div class="card__head"><div class="card__title">Active plateau flags</div>' +
            '<span class="badge badge--warn">' + ev.plateauFlags.length + '</span></div>' +
            ev.plateauFlags.map(function (f) {
              return '<div class="rc-flag"><div class="rc-flag__t">' + esc(f.title) + '</div><div class="rc-flag__b">' + esc(f.body) + '</div></div>';
            }).join("") + '</div>'
        : '') +

      '<div class="page-head" style="margin-top:var(--sp-8)"><div class="eyebrow">Track record</div><h2 class="display h3">Phase history</h2></div>' +
      histHtml +

      '<p class="faint text-xs mt-6 mono">EVALUATION ONLINE · ' + (s.phaseHistory || []).length + ' phases closed · grading from ' + engine.completedSessions().length + ' lifetime sessions · stored locally.</p>';

    var openBtn = document.getElementById("ev-open");
    if (openBtn) openBtn.addEventListener("click", openReportCard);

    var closeNow = document.getElementById("ev-close-now");
    if (closeNow) closeNow.addEventListener("click", openReportCard);

    var deloadNow = document.getElementById("ev-deload-now");
    if (deloadNow) deloadNow.addEventListener("click", function () {
      ui.confirm(
        "Start a deload block?",
        "This closes the current phase and begins a recovery block with working volume cut by about 40%. Use it when you're run down, sore, or short on sleep — your progressions are preserved.",
        "Start deload", "primary",
        function () {
          applyAdvancement("deload");
          App.toast("Deload block started. Train lighter, recover, then re-evaluate.", "success", 4800);
          App.showSection("evaluation");
        }
      );
    });

    drawEvalChart(s, ev);
  }

  function drawEvalChart(s, ev) {
    if (ev.points.length < 2) return;
    var startKey = lib.dayKey(s.currentPhase.startISO);
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

    /* weekly split */
    var split = engine.ROTATION.map(function (d) {
      var pats = engine.patternsFor(d, (s.prefs && s.prefs.sessionLength) || "focused");
      return '<div class="pg-day' + (d === rec ? " is-next" : "") + '">' +
        '<div class="row between"><span class="pg-day__t">' + engine.DAY_LABEL[d] + '</span>' +
          (d === rec ? '<span class="badge badge--primary" style="padding:2px 7px">up next</span>' : '') + '</div>' +
        '<p class="faint text-xs">' + esc(engine.DAY_DESC[d]) + '</p>' +
        '<div class="pg-day__pats">' + pats.map(function (p) { return '<span class="chip">' + cap(p) + '</span>'; }).join("") + '</div>' +
      '</div>';
    }).join("");

    /* current targets */
    var targets = PATTERNS.map(function (p) {
      var t = s.tiers[p] || { level: 1, repsTarget: REF_TARGET[p], progress: 0 };
      var ex = engine.movementFor(p);
      var unit = ex && ex.mode === "hold" ? "s" : "reps";
      return '<div class="pg-trow">' +
        '<span class="pg-trow__p">' + p + ' · L' + t.level + '</span>' +
        '<span class="pg-trow__n">' + esc(ex ? ex.name : (PROG[p] && PROG[p].label) || cap(p)) + '</span>' +
        '<span class="kv__v">' + t.repsTarget + unit + '</span></div>';
    }).join("");

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
          tools.push('<span class="chip" style="' + (ok ? "" : "opacity:.5") + '">' + esc(a.name) + (ok ? "" : " · locked") + '</span>');
        });
      });
      era2Tools = '<div class="card rc-era stack mt-4"><div class="rc-era__t">Era II · Hybrid Strength unlocked</div>' +
        '<p class="text-sm muted">Weighted accessories now seed your sessions when the kit is available.</p>' +
        (tools.length ? '<div class="pg-day__pats">' + tools.join("") + '</div>' : '') + '</div>';
    }

    el.innerHTML =
      '<div class="page-head row between wrap">' +
        '<div><div class="eyebrow">Training plan</div><h1 class="display h2">Program</h1></div>' +
        ui.eraBadge(s) +
      '</div>' +

      '<div class="card card--notch stack">' +
        '<div class="card__head"><div class="card__title">Current phase</div>' +
          '<span class="badge badge--primary">P' + phase.number + ' · ' + actionLabel(phase.action || "start") + '</span></div>' +
        '<div class="row between wrap"><div class="dash-big">Day ' + info.day + '<small>/ ' + phase.lengthDays + '</small></div>' +
          '<span class="dash-delta dash-delta--flat">' + info.remaining + ' days to evaluation</span></div>' +
        '<div class="progress" style="height:12px"><div class="progress__bar" style="width:' + info.pct + '%"></div></div>' +
        '<div class="row" style="gap:var(--sp-2)">' +
          '<button class="btn btn--secondary btn--sm grow" data-go="evaluation">Open Evaluation →</button>' +
          '<button class="btn btn--ghost btn--sm" id="pg-report">Report card</button>' +
        '</div>' +
      '</div>' +

      '<div class="card mt-4 stack"><div class="card__head"><div class="card__title">Weekly split</div>' +
        '<span class="badge">' + engine.DAYS_PER_WEEK + ' days / week</span></div>' +
        '<p class="muted text-sm">A rolling 4-day rotation. Each session auto-builds from your current tier levels in Today.</p>' +
        '<div class="pg-split">' + split + '</div></div>' +

      '<div class="card mt-4 stack"><div class="card__head"><div class="card__title">Current targets</div>' +
        '<span class="badge badge--era1">' + PATTERNS.length + ' patterns</span></div>' +
        '<div class="pg-targets">' + targets + '</div>' +
        '<button class="btn btn--ghost btn--sm btn--block mt-2" data-go="progress">See full progression ladders in Progress →</button></div>' +

      '<div class="card mt-4 stack"><div class="card__head"><div class="card__title">Era I benchmarks</div>' +
        '<span class="badge badge--era1" id="bench-count">' + benchDone + '/' + benchKeys.length + '</span></div>' +
        '<p class="muted text-sm">Clear all five to graduate into Era II and unlock weighted overload. Update your current bests below.</p>' +
        '<div class="progress progress--era1"><div class="progress__bar" id="bench-bar" style="width:' + Math.round(benchDone / benchKeys.length * 100) + '%"></div></div>' +
        '<div class="mt-2">' + benches + '</div></div>' +

      era2Tools +

      '<p class="faint text-xs mt-6 mono">PROGRAM ONLINE · ' + engine.completedSessions().length + ' sessions logged · ' + (s.phaseHistory || []).length + ' phases archived · ' + benchDone + '/' + benchKeys.length + ' benchmarks cleared.</p>';

    wireProgram(el, s);
  }

  function wireProgram(el, s) {
    /* nav buttons */
    el.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () { App.showSection(b.dataset.go); });
    });
    var rb = el.querySelector("#pg-report");
    if (rb) rb.addEventListener("click", openReportCard);

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
        App.toast("Era II unlocked — weighted tools are live. Welcome to Hybrid Strength.", "success", 5000);
        App.refresh();
      }
    );
  }

  /* ----------------------------------------------------------------------
     7. PUBLIC (additive) HOOK + MOUNT
     -------------------------------------------------------------------- */
  App.evaluation = { evaluate: evaluate, openReportCard: openReportCard, applyAdvancement: applyAdvancement };

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

    pull_alt_australian: { id:"pull_alt_australian", pattern:"pull", name:"Australian Row (Inverted Row)", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
      cues:["Set a bar at hip height and lie underneath it, gripping shoulder-width.","Keep the body in a straight plank line, heels on the floor.","Pull the chest up to the bar by driving the elbows down and back.","Lower with control to fully extended arms; raise the bar or bend the knees to scale difficulty."],
      mistakes:["Letting the hips sag so the body bends.","Shrugging instead of leading with the shoulder blades."],
      readiness:"A horizontal pull that builds the back for vertical pulling — aim for 12 strict reps.",
      injury:"Great low-skill entry to pulling; keep the neck neutral." },

    pull_alt_bandassist: { id:"pull_alt_bandassist", pattern:"pull", name:"Band-Assisted Pull-up", level:null, era:1, mode:"reps", unit:"reps", equipment:["pullupBar"],
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
    skill_frontlever_1: { id:"skill_frontlever_1", pattern:"skill", name:"Tuck Front Lever", level:1, era:1, mode:"hold", unit:"sec", equipment:["pullupBar"],
      cues:["Hang from a bar with an overhand grip, arms straight.","Pull the shoulder blades down and back to engage the lats.","Tuck the knees to the chest and lift the hips until the back is horizontal.","Keep the arms locked straight and the body facing the ceiling."],
      mistakes:["Bending the elbows to pull into position.","Letting the shoulders shrug up toward the ears."],
      readiness:"Hold a tuck for 20 seconds with straight arms before opening the body.",
      injury:"Demands strong straight-arm lats; build the passive hang and scapular pulls first." },

    skill_frontlever_2: { id:"skill_frontlever_2", pattern:"skill", name:"Advanced Tuck Front Lever", level:2, era:1, mode:"hold", unit:"sec", equipment:["pullupBar"],
      cues:["From a tuck front lever, open the hips so the torso and thighs form a flat line.","Keep the knees bent but move them away from the chest.","Maintain straight arms and depressed, retracted shoulders.","Keep the body horizontal and facing up."],
      mistakes:["Piking the hips up to reduce the load.","Losing lat tension so the chest drops."],
      readiness:"Hold 15 seconds flat-backed before extending a leg.",
      injury:"Progress gradually to protect the shoulders and elbows." },

    skill_frontlever_3: { id:"skill_frontlever_3", pattern:"skill", name:"Straddle Front Lever", level:3, era:1, mode:"hold", unit:"sec", equipment:["pullupBar"],
      cues:["Extend both legs into a wide straddle from the advanced tuck.","The wide legs shorten the lever compared to a full front lever.","Keep arms straight, lats engaged, body horizontal.","Point the toes and keep the hips level with the shoulders."],
      mistakes:["Letting the hips sag below the shoulders.","Bending the arms to hold the line."],
      readiness:"A 10-second straddle hold leads into the full front lever.",
      injury:"Keep the elbows soft-locked, not hyperextended, to protect the joint." },

    skill_frontlever_4: { id:"skill_frontlever_4", pattern:"skill", name:"Full Front Lever", level:4, era:1, mode:"hold", unit:"sec", equipment:["pullupBar"],
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
    skill_lsit_1: { id:"skill_lsit_1", pattern:"skill", name:"Foot-Supported L-Sit", level:1, era:1, mode:"hold", unit:"sec", equipment:["bench"],
      cues:["Sit on the floor or between two raised supports, hands pressing down.","Depress the shoulders and lock the elbows straight.","Keep the heels lightly on the floor and lift the hips off the ground.","Hold with the chest tall and shoulders pushed down."],
      mistakes:["Shrugging the shoulders up to the ears.","Bending the elbows to hold the lift."],
      readiness:"Hold 20-30 seconds before lifting the feet into a tuck.",
      injury:"Use parallettes if pressing on flat ground bothers the wrists." },

    skill_lsit_2: { id:"skill_lsit_2", pattern:"skill", name:"Tuck L-Sit", level:2, era:1, mode:"hold", unit:"sec", equipment:["bench"],
      cues:["Press up on supports, depress the shoulders, lock the elbows.","Lift the hips and tuck both knees toward the chest, feet off the floor.","Hold the body weight entirely on the hands.","Keep the chest tall and the shoulders driven down."],
      mistakes:["Letting the shoulders rise toward the ears.","Leaning back to make the balance easier."],
      readiness:"A 30-second tuck hold sets up extending the legs.",
      injury:"Stretch the hip flexors before and after; cramping is common." },

    skill_lsit_3: { id:"skill_lsit_3", pattern:"skill", name:"Full L-Sit", level:3, era:1, mode:"hold", unit:"sec", equipment:["bench"],
      cues:["From a tuck L-sit, extend both legs straight out parallel to the floor.","Push the supports down hard and keep the shoulders depressed.","Point the toes and squeeze the legs together.","Hold without leaning back to fake the angle."],
      mistakes:["Bending the knees as the core fatigues.","Dropping the hips below the hands."],
      readiness:"Hold 20 seconds with locked legs before chasing the V-sit.",
      injury:"Strong hip-flexor and core demand — build gradually." },

    skill_vsit: { id:"skill_vsit", pattern:"skill", name:"V-Sit", level:4, era:1, mode:"hold", unit:"sec", equipment:["bench"],
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
      injury:"Make sure both chairs are rock-solid; place them against a wall if unsure." }
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
      intro: "A straight-arm pushing skill where the body floats parallel to the floor on the hands alone. Built over months: master each leverage step before opening the body further.",
      ids: ["skill_planche_1","skill_planche_2","skill_planche_3","skill_planche_4","skill_planche_5"]
    },
    frontlever: {
      label: "Front Lever", icon: "skill",
      intro: "A straight-arm pulling skill: the body holds horizontal beneath a bar, facing the ceiling. Progress by lengthening the lever — tuck, advanced tuck, straddle, then full.",
      ids: ["skill_frontlever_1","skill_frontlever_2","skill_frontlever_3","skill_frontlever_4"]
    },
    handstand: {
      label: "Handstand", icon: "skill",
      intro: "The foundational inversion. Build shoulder endurance against a wall, learn the stacked line, then transfer balance to your hands for a free hold.",
      ids: ["skill_handstand_1","skill_handstand_2","skill_handstand_3","skill_handstand_4"]
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
  var TAB_ORDER = ["planche","frontlever","handstand","lsit","variations","mobility"];

  /* Public skills API — lets the Today view suggest a skill and jump straight
     to the right track. suggestFor() maps a lifting day to a skill that pairs
     well and is trainable with the user's current equipment. */
  App.skills = {
    tracks: SKILL_TRACKS,
    openTrack: function (id) {
      if (SKILL_TRACKS[id] || id === "mobility") skillUi.tab = id;
      App.showSection("skills");
    },
    suggestFor: function (dayType) {
      var st = App.getState();
      var hasBar = !!(st.equipment && st.equipment.pullupBar);
      var map = {
        push:     { track: "handstand",  line: "Train a handstand hold while your shoulders are fresh." },
        pull:     hasBar
                    ? { track: "frontlever", line: "Hit a front-lever progression first — pulling skills need a fresh back." }
                    : { track: "lsit",       line: "No bar today? Open with an L-sit hold while you're fresh." },
        legs:     { track: "lsit",       line: "Open with an L-sit / compression hold while your core is fresh." },
        fullbody: { track: "handstand",  line: "Start with a handstand or L-sit hold before the circuit." }
      };
      var pick = map[dayType] || map.push;
      var t = SKILL_TRACKS[pick.track];
      return t ? { id: pick.track, label: t.label, line: pick.line } : null;
    }
  };

  function renderSkills(el, s) {
    var tabs = TAB_ORDER.map(function (id) {
      var label = id === "mobility" ? "Mobility" : SKILL_TRACKS[id].label;
      return '<button class="skill-tab ' + (skillUi.tab === id ? "is-active" : "") + '" data-skilltab="' + id + '" type="button">' + esc(label) + '</button>';
    }).join("");

    el.innerHTML =
      '<div class="page-head row between wrap">' +
        '<div><div class="eyebrow">Beyond the basics</div><h1 class="display h2">Skills & Mobility</h1></div>' +
        App.ui.eraBadge(s) +
      '</div>' +
      '<p class="muted text-sm" style="max-width:60ch;margin-bottom:var(--sp-5)">Long-term bodyweight skills and the mobility work that supports them. These run alongside your main program — train a skill fresh, early in a session, when you\'re strong. Tap any movement for the full guide.</p>' +
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
      return '<button class="skill-rung" data-skillguide="' + id + '" type="button">' +
        '<span class="skill-rung__lvl"' + badgeStyle + '>' + badge + '</span>' +
        '<span class="skill-rung__main">' +
          '<span class="skill-rung__name">' + esc(ex.name) + '</span>' +
          '<span class="skill-rung__sub">' + unit + ' · ' + equip + '</span>' +
        '</span>' +
        '<svg class="skill-rung__chev ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>' +
      '</button>';
    }).join("");

    body.innerHTML =
      '<div class="skill-intro"><p>' + esc(track.intro) + '</p></div>' +
      '<div class="skill-track">' + rungs + '</div>';
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
     - generates a week-by-week progressive plan that COMPLEMENTS the lifting
       rotation: runs land on Wed / Sat / Sun, the days the Push->Pull->Legs->Full
       block (Mon/Tue/Thu/Fri) leaves open, so legs & CNS are never double-booked
     - schedules every run on a real date counted from the program start
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
      desc: "Lay a short aerobic base, then layer in strides and progressively sharper sprint repeats to build raw speed and power from nothing.",
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
    if (!s.running) s.running = { goal: null, startISO: null, runDays: [3, 6, 0], runLog: [], streak: { count: 0, lastISO: null, best: 0 } };
    if (!s.running.runDays) s.running.runDays = [3, 6, 0];
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
      App.saveState();
    },

    clear: function () { var r = R(); r.goal = null; r.startISO = null; App.saveState(); },

    weekIndexFor: function (date) {
      var r = R(); if (!r.startISO) return 0;
      var diff = lib.daysBetween(r.startISO, keyOf(date));
      return Math.floor(diff / 7);
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
      var weekMonday = addDaysLocal(localFromKey(r.startISO), clampIdx * 7);
      var byKey = run.logByDay();
      return r.runDays.map(function (dow, i) {
        var off = (dow + 6) % 7;          // Mon=0 .. Sun=6
        var d = addDaysLocal(weekMonday, off);
        var k = keyOf(d);
        return { date: d, key: k, dow: dow, session: week[i] || rest(), done: !!byKey[k], log: byKey[k] || null };
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
      (R().runLog || []).forEach(function (l) { map[lib.dayKey(l.dateISO)] = l; });
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
        notes: entry.notes || ""
      };
      var k = lib.dayKey(nowISO);
      r.runLog = (r.runLog || []).filter(function (l) { return lib.dayKey(l.dateISO) !== k; });
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
          return log.filter(function (x) { return lib.dayKey(x.dateISO) >= monday; }).length;
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
          '<p class="muted text-sm" style="max-width:48ch;margin:0">Build endurance or speed from nothing — BASALT schedules runs on your off-days (Wed/Sat/Sun) so they complement your lifting instead of fighting it.</p></div>' +
          '<button class="btn btn--secondary btn--sm" data-go="running">Choose a goal →</button>' +
        '</div></div>';
    }
  };

  App.run = run;

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
        'Pick a goal and BASALT builds a week-by-week plan that <b>complements your lifting</b>. ' +
        'Runs are scheduled on Wednesday, Saturday and Sunday - the days your Push -> Pull -> Legs -> Full ' +
        'rotation (Mon / Tue / Thu / Fri) leaves open - so your legs and nervous system are never double-booked. ' +
        'Every plan starts from walking and easy efforts, no base required.' +
      '</p>' +
      '<div class="run-goal-grid">' + cards + '</div>' +
      '<div class="card card--glass mt-6">' +
        '<div class="card__head"><div class="card__title">How it interlocks with strength</div></div>' +
        '<div class="run-week" style="gap:var(--sp-2)">' +
          weekMapRow("Mon", "Push / Pull", "lift") +
          weekMapRow("Tue", "Pull / Legs", "lift") +
          weekMapRow("Wed", "Run - easy / speed", "run") +
          weekMapRow("Thu", "Legs / Full", "lift") +
          weekMapRow("Fri", "Full / Push", "lift") +
          weekMapRow("Sat", "Run - long / key", "run") +
          weekMapRow("Sun", "Run - easy / rest", "run") +
        '</div>' +
        '<p class="faint text-xs mt-4">Hard running stays away from leg-strength days, long runs land on the weekend with no lift the next morning, and easy Sunday miles aid recovery. You can still run whenever you like - this is just the backbone.</p>' +
      '</div>';

    wireGoalPicker(el, s);
  }

  function weekMapRow(dow, label, kind) {
    var k = kind === "run" ? "run-kind--easy" : "run-kind--rest";
    var tag = kind === "run" ? "RUN" : "LIFT";
    return '<div class="row between" style="padding:var(--sp-2) var(--sp-3);border:1px solid var(--line);border-radius:var(--r-sm);background:var(--ink-850)">' +
      '<div class="row" style="gap:var(--sp-3)"><span class="run-day__dow" style="width:34px">' + dow + '</span>' +
      '<span class="text-sm" style="color:var(--text-200)">' + esc(label) + '</span></div>' +
      '<span class="run-kind ' + k + '">' + tag + '</span>' +
    '</div>';
  }

  function wireGoalPicker(el, s) {
    el.querySelectorAll("[data-rungoal]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.dataset.rungoal;
        var g = GOALS[id];
        App.ui.confirm(
          "Start the " + g.name + " plan?",
          g.tag + ". Runs schedule onto Wed / Sat / Sun around your lifting, starting this week from easy efforts.",
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
        '<p class="faint text-xs mt-3">Tap a week to preview its sessions. Runs sit on Wed / Sat / Sun so they never clash with a strength day.</p>' +
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
      '<p class="faint text-xs mt-6 mono">RUNNING ONLINE - ' + totals.runs + ' runs logged - ' + totals.km + ' km lifetime - plan anchored ' + R().startISO + ' - stored locally.</p>';

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
