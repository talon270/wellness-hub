/* ============================================================================
   WELLNESS HUB · GAMIFICATION
   ----------------------------------------------------------------------------
   Streaks and badges are DERIVED from the logs, never stored as counters that
   have to be kept in sync. Recomputing from source on every write means a
   streak can't drift, an imported backup is instantly correct, and deleting a
   log entry adjusts history honestly instead of leaving a phantom streak.

   The result is cached into `state.streaks` so views can read it cheaply and so
   an exported backup is legible on its own.

   Public: Hub.gamify
   ========================================================================== */
(function () {
  "use strict";

  var Hub = window.Hub;

  /* ======================================================================
     1. HABIT DEFINITIONS
     ----------------------------------------------------------------------
     Each category answers one question: "was this done on date D?"
     ====================================================================== */
  var CATEGORIES = {
    fitness: {
      label: "Fitness",
      color: "var(--wh-c-fitness)",
      icon: "fitness",
      view: "fitness",
      /* Sourced from the calisthenics app's own session log rather than a
         duplicate flag — one workout record, one source of truth. */
      done: function (dateKey) { return fitnessDates().has(dateKey); }
    },
    eye: {
      label: "Eye care",
      color: "var(--wh-c-eyecare)",
      icon: "eye",
      view: "eyecare",
      /* Either a guided exercise session, or three honest 20-20-20 breaks. */
      done: function (dateKey) {
        var d = Hub.day(dateKey);
        return d.eye >= 1 || d.eye2020 >= 3;
      }
    },
    dental: {
      label: "Dental",
      color: "var(--wh-c-dental)",
      icon: "dental",
      view: "dental",
      done: function (dateKey) {
        var d = Hub.day(dateKey);
        return !!(d.brushAM && d.brushPM);
      }
    },
    floss: {
      label: "Flossing",
      color: "var(--aqua)",
      icon: "dental",
      view: "dental",
      done: function (dateKey) { return !!Hub.day(dateKey).floss; }
    },
    hydration: {
      label: "Hydration",
      color: "var(--blue-bright)",
      icon: "water",
      view: "wellness",
      done: function (dateKey) {
        return Hub.day(dateKey).water >= (Hub.state.settings.hydrationGoalCups || 8);
      }
    },
    sleep: {
      label: "Sleep logged",
      color: "var(--purple)",
      icon: "moon",
      view: "wellness",
      done: function (dateKey) { return sleepDates().has(dateKey); }
    },
    mindful: {
      label: "Mindfulness",
      color: "var(--purple-bright)",
      icon: "wind",
      view: "wellness",
      done: function (dateKey) { return (Hub.day(dateKey).mindful || []).length > 0; }
    },
    mobility: {
      label: "Mobility",
      color: "var(--wh-c-mobility)",
      icon: "stretchIc",
      view: "mobility",
      /* A deliberate rest day still counts — recovery is part of the training,
         and a streak that punishes it would push people to train through. */
      done: function (dateKey) {
        var d = Hub.day(dateKey);
        return d.mobility >= 1 || d.stretch >= 1 || !!d.restDay;
      }
    },
    desk: {
      label: "Stand breaks",
      color: "var(--wh-c-desk)",
      icon: "stand",
      view: "desk",
      /* Meeting the day's break target. Finishing a movement snack counts too,
         since it credits a break on the way through — one behaviour, one
         number, rather than two competing counters. */
      done: function (dateKey) {
        return Hub.day(dateKey).stand >= (Hub.state.settings.standGoal || 8);
      }
    },
    bodycare: {
      label: "Body care",
      color: "var(--wh-c-bodycare)",
      icon: "bodycare",
      view: "bodycare",
      /* Both ends of the day — a morning-only routine skips the half that
         actually matters most for skin. */
      done: function (dateKey) {
        var b = Hub.day(dateKey).body || {};
        return !!(b.skinAM && b.skinPM);
      }
    },
    mood: {
      label: "Mood log",
      color: "var(--yellow)",
      icon: "mood",
      view: "wellness",
      done: function (dateKey) { return !!Hub.day(dateKey).mood; }
    },
    meds: {
      label: "Medication",
      color: "var(--wh-c-health)",
      icon: "pill",
      view: "health",
      /* Only meaningful once something is being tracked — an empty list would
         otherwise read as a perfect streak you never earned. */
      done: function (dateKey) {
        var defs = activeMeds();
        if (!defs.length) return false;
        var ticks = Hub.day(dateKey).meds || {};
        return defs.every(function (m) {
          return (m.slots || ["am"]).every(function (slot) { return !!ticks[m.id + ":" + slot]; });
        });
      }
    }
  };

  /* Medication definitions currently switched on. */
  function activeMeds() {
    return (Hub.state.logs.meds || []).filter(function (m) { return m && m.active !== false; });
  }

  /* ======================================================================
     1b. CUSTOM HABITS
     ----------------------------------------------------------------------
     User-defined habits are first-class: once registered they behave exactly
     like the built-ins — streaks, heatmap, weekly review, the lot — because
     everything downstream only ever asks a category "was this done on D?".
     ====================================================================== */
  function customHabits() {
    return (Hub.state.logs.customHabits || []).filter(function (h) { return h && h.active !== false; });
  }

  /* Rebuilt on every recompute so adding or deleting a habit takes effect
     without a reload. Custom ids are namespaced to make a collision with a
     built-in category impossible. */
  function syncCustomCategories() {
    Object.keys(CATEGORIES).forEach(function (k) {
      if (k.indexOf("custom:") === 0) delete CATEGORIES[k];
    });
    customHabits().forEach(function (h) {
      CATEGORIES["custom:" + h.id] = {
        label: h.name,
        color: h.color || "var(--wh-c-wellness)",
        icon: h.icon || "check",
        view: "wellness",
        custom: true,
        habitId: h.id,
        done: function (dateKey) { return !!(Hub.day(dateKey).custom || {})[h.id]; }
      };
    });
  }

  /* ======================================================================
     1c. CADENCE — daily, or N times a week
     ----------------------------------------------------------------------
     "Floss every single day or your streak dies" is a rule that makes people
     abandon the app in week three. A weekly-cadence habit is judged on the
     week: the streak counts consecutive WEEKS that hit the target, and the
     current week is never counted as failed until it's actually over.
     ====================================================================== */
  function cadenceFor(catKey) {
    var cat = CATEGORIES[catKey];
    if (cat && cat.custom) {
      var h = customHabits().filter(function (x) { return x.id === cat.habitId; })[0];
      if (h && h.cadence) return normaliseCadence(h.cadence);
    }
    return normaliseCadence((Hub.state.settings.cadence || {})[catKey]);
  }

  function normaliseCadence(c) {
    if (!c || c.type !== "weekly") return { type: "daily" };
    var n = Math.round(Number(c.perWeek) || 3);
    return { type: "weekly", perWeek: Math.min(7, Math.max(1, n)) };
  }

  function isWeekly(catKey) { return cadenceFor(catKey).type === "weekly"; }

  /* The Monday of the week `dateKey` falls in. Weeks are Monday-based because
     "3 times a week" almost always means a working week, not a Sunday one. */
  function weekStart(dateKey) {
    var d = Hub.parseYmd(dateKey);
    var dow = (d.getDay() + 6) % 7;          // 0 = Monday
    return Hub.shiftDay(dateKey, -dow);
  }

  /* How many days in that week met the habit. */
  function weekCount(doneFn, mondayKey) {
    var n = 0;
    for (var i = 0; i < 7; i++) if (doneFn(Hub.shiftDay(mondayKey, i))) n++;
    return n;
  }

  /* The "perfect day" set. Fitness is deliberately excluded — rest days are
     part of training, and a streak that punishes them would be wrong. */
  var PERFECT_PARTS = ["eye", "dental", "hydration", "mindful"];

  function isPerfect(dateKey) {
    return PERFECT_PARTS.every(function (k) { return CATEGORIES[k].done(dateKey); });
  }

  /* ======================================================================
     2. CROSS-MODULE DATA SOURCES (memoised per recompute)
     ====================================================================== */
  var _fitnessDates = null, _sleepDates = null;

  /* Dates on which the calisthenics app recorded a completed session. */
  function fitnessDates() {
    if (_fitnessDates) return _fitnessDates;
    var set = new Set();
    try {
      var sessions = (window.App && window.App.STATE && window.App.STATE.sessions) || [];
      sessions.forEach(function (s) {
        if (s && s.dateISO && s.completed !== false) set.add(String(s.dateISO).slice(0, 10));
      });
    } catch (e) { /* BASALT not booted yet — recompute runs again once it is */ }
    _fitnessDates = set;
    return set;
  }

  function sleepDates() {
    if (_sleepDates) return _sleepDates;
    var set = new Set();
    (Hub.state.logs.sleep || []).forEach(function (e) { if (e && e.date) set.add(e.date); });
    _sleepDates = set;
    return set;
  }

  function invalidate() { _fitnessDates = null; _sleepDates = null; }

  /* ======================================================================
     3. STREAK MATH
     ====================================================================== */

  /* The earliest date we have any record of — the floor for a "best" scan. */
  function earliestDate() {
    var keys = Hub.dayKeys();
    var candidates = keys.slice(0, 1);
    var sleep = Hub.state.logs.sleep || [];
    if (sleep.length) candidates.push(sleep.map(function (s) { return s.date; }).sort()[0]);
    var fit = Array.from(fitnessDates()).sort();
    if (fit.length) candidates.push(fit[0]);
    candidates = candidates.filter(Boolean).sort();
    return candidates[0] || Hub.today();
  }

  /* ---- GRACE DAYS -------------------------------------------------------
     A missed day inside a long run is usually a forgotten log or a genuinely
     unusual day, not the end of a habit. Each calendar month grants a small
     allowance of misses a streak may walk over. The day still isn't counted as
     done — the streak simply doesn't reset — so the number stays honest about
     how much you actually did.

     The allowance is per calendar month of the missed day, which keeps it
     bounded no matter how long the streak gets.
     -------------------------------------------------------------------- */
  function graceAllowance() {
    var n = Number(Hub.state.settings.graceDaysPerMonth);
    return isFinite(n) && n >= 0 ? Math.min(10, Math.round(n)) : 0;
  }

  function monthOf(dateKey) { return String(dateKey).slice(0, 7); }

  /* Current streak: consecutive completed days ending today, or ending
     yesterday if today isn't done yet (the day isn't over — don't punish it).
     Returns { current, graceUsed } so the UI can be honest about the assist. */
  function currentStreakInfo(doneFn) {
    var td = Hub.today();
    var cursor = doneFn(td) ? td : Hub.shiftDay(td, -1);
    if (!doneFn(cursor)) {
      /* Yesterday missed too — but a grace day may still be holding the run
         together, so only give up if the day before that is also empty. */
      if (graceAllowance() < 1 || !doneFn(Hub.shiftDay(cursor, -1))) {
        return { current: 0, graceUsed: 0, graceLeft: graceLeftThisMonth(doneFn) };
      }
    }

    var n = 0, guard = 0, used = {}, graceUsed = 0;
    var allowance = graceAllowance();

    while (guard++ < 4000) {
      if (doneFn(cursor)) {
        n++;
      } else {
        var m = monthOf(cursor);
        var spent = used[m] || 0;
        if (spent >= allowance) break;          // out of grace — the run ends here
        /* Never let a streak *start* on a grace day: if nothing before it is
           done either, this is just the end of the record. */
        if (!doneFn(Hub.shiftDay(cursor, -1))) break;
        used[m] = spent + 1;
        graceUsed++;
      }
      cursor = Hub.shiftDay(cursor, -1);
    }
    return { current: n, graceUsed: graceUsed, graceLeft: graceLeftThisMonth(doneFn) };
  }

  function currentStreak(doneFn) { return currentStreakInfo(doneFn).current; }

  /* How much of this month's allowance is still available for this habit. */
  function graceLeftThisMonth(doneFn) {
    var allowance = graceAllowance();
    if (!allowance) return 0;
    var td = Hub.today();
    var month = monthOf(td);
    var used = 0;
    var cursor = Hub.shiftDay(td, -1);        // today isn't a miss until it's over
    while (monthOf(cursor) === month) {
      if (!doneFn(cursor)) used++;
      cursor = Hub.shiftDay(cursor, -1);
    }
    return Math.max(0, allowance - used);
  }

  /* Longest run anywhere in the record, under the same grace rule. */
  function bestStreak(doneFn) {
    var start = earliestDate(), end = Hub.today();
    var total = Hub.daysBetween(start, end);
    if (total < 0 || total > 4000) return currentStreak(doneFn);

    var allowance = graceAllowance();
    var best = 0, run = 0, cursor = start, used = {}, prevDone = false;
    for (var i = 0; i <= total; i++) {
      if (doneFn(cursor)) {
        run++;
        if (run > best) best = run;
        prevDone = true;
      } else {
        var m = monthOf(cursor);
        var spent = used[m] || 0;
        /* Same rule as above: grace can bridge a gap, never open one. */
        if (run > 0 && prevDone && spent < allowance) used[m] = spent + 1;
        else { run = 0; used = {}; }
        prevDone = false;
      }
      cursor = Hub.shiftDay(cursor, 1);
    }
    return best;
  }

  /* ---- WEEKLY-CADENCE STREAKS ------------------------------------------
     Same idea, one week at a time. The in-progress week counts as met the
     moment it hits target, and is never counted as missed while it's still
     running — otherwise every Monday would wipe the streak.
     -------------------------------------------------------------------- */
  function weeklyStreakInfo(doneFn, perWeek) {
    var thisMonday = weekStart(Hub.today());
    var weeks = 0;
    var cursor = thisMonday;

    /* The current week only contributes once it's actually met. */
    if (weekCount(doneFn, cursor) >= perWeek) weeks++;
    cursor = Hub.shiftDay(cursor, -7);

    var guard = 0;
    while (guard++ < 600 && weekCount(doneFn, cursor) >= perWeek) {
      weeks++;
      cursor = Hub.shiftDay(cursor, -7);
    }
    return { current: weeks, graceUsed: 0, graceLeft: 0 };
  }

  function weeklyBest(doneFn, perWeek) {
    var start = weekStart(earliestDate());
    var total = Math.floor(Hub.daysBetween(start, Hub.today()) / 7);
    if (total < 0 || total > 600) return 0;
    var best = 0, run = 0, cursor = start;
    for (var i = 0; i <= total; i++) {
      if (weekCount(doneFn, cursor) >= perWeek) { run++; if (run > best) best = run; }
      else if (cursor !== weekStart(Hub.today())) run = 0;
      cursor = Hub.shiftDay(cursor, 7);
    }
    return best;
  }

  /* Last N days as booleans, oldest first — for the little activity strips. */
  function recentDays(doneFn, n) {
    var out = [], td = Hub.today();
    for (var i = n - 1; i >= 0; i--) {
      var key = Hub.shiftDay(td, -i);
      out.push({ date: key, done: doneFn(key) });
    }
    return out;
  }

  /* ======================================================================
     4. TOTALS (lifetime, for badge thresholds)
     ====================================================================== */
  function totals() {
    var t = {
      water: 0, eyeSessions: 0, eye2020: 0, mindful: 0, mindfulSeconds: 0,
      posture: 0, stretch: 0, brushings: 0, flossDays: 0,
      sleepNights: (Hub.state.logs.sleep || []).length,
      workouts: fitnessDates().size,
      perfectDays: 0, activeDays: 0, totalLogs: 0,
      /* added modules */
      mobility: 0, restDays: 0, moodLogs: 0, spf: 0, spfReapply: 0,
      skinDays: 0, bodyLogs: 0,
      vitals: (Hub.state.logs.vitals || []).length,
      bpReadings: (Hub.state.logs.vitals || []).filter(function (v) { return v.sys && v.dia; }).length,
      checkupsCurrent: 0, checkupsTotal: 0, checkupsLogged: 0,
      /* v2 additions */
      customTicks: 0, customHabits: customHabits().length,
      naps: 0, nights: 0, labs: (Hub.state.logs.labs || []).length,
      photos: (Hub.state.logs.photos || []).length,
      caffeineFreeDays: 0, alcoholFreeDays: 0,
      /* v3 additions */
      standBreaks: 0, sitMinutes: 0, moveMinutes: 0, standGoalDays: 0,
      cycles: (Hub.state.logs.cycles || []).length,
      selfExams: 0
    };
    ["breastExamISO", "testisExamISO"].forEach(function (k) {
      if (Hub.state.logs[k]) t.selfExams++;
    });
    (Hub.state.logs.sleep || []).forEach(function (e) {
      if (e.kind === "nap") t.naps++; else t.nights++;
    });
    Hub.dayKeys().forEach(function (key) {
      var d = Hub.state.logs.days[key];
      t.water += d.water || 0;
      t.eyeSessions += d.eye || 0;
      t.eye2020 += d.eye2020 || 0;
      t.posture += d.posture || 0;
      t.stretch += d.stretch || 0;
      t.mindful += (d.mindful || []).length;
      (d.mindful || []).forEach(function (m) { t.mindfulSeconds += Number(m.sec) || 0; });
      if (d.brushAM) t.brushings++;
      if (d.brushPM) t.brushings++;
      if (d.floss) t.flossDays++;
      if (isPerfect(key)) t.perfectDays++;

      t.mobility += d.mobility || 0;
      t.standBreaks += d.stand || 0;
      t.sitMinutes += d.sitMin || 0;
      t.moveMinutes += d.moveMin || 0;
      if ((d.stand || 0) >= (Hub.state.settings.standGoal || 8)) t.standGoalDays++;
      t.spfReapply += d.spfReapply || 0;
      if (d.restDay) t.restDays++;
      if (d.mood) t.moodLogs++;
      var body = d.body || {};
      if (body.spf) t.spf++;
      if (body.skinAM && body.skinPM) t.skinDays++;
      t.bodyLogs += Object.keys(body).length;

      t.customTicks += Object.keys(d.custom || {}).length;
      /* Only count a "free" day among days that were actually logged at all,
         so an untouched month doesn't read as a hundred alcohol-free days. */
      var logged = Object.keys(d).length > 0;
      if (logged && !d.caffeineMg) t.caffeineFreeDays++;
      if (logged && !d.alcoholUnits) t.alcoholFreeDays++;

      var any = (d.water || d.eye || d.eye2020 || d.brushAM || d.brushPM || d.floss ||
                 d.posture || d.stretch || d.mobility || d.mood ||
                 (d.mindful || []).length || Object.keys(body).length ||
                 Object.keys(d.custom || {}).length);
      if (any) t.activeDays++;
      t.totalLogs += (d.water || 0) + (d.eye || 0) + (d.eye2020 || 0) + (d.posture || 0) +
                     (d.stretch || 0) + (d.mobility || 0) + (d.mindful || []).length +
                     (d.brushAM ? 1 : 0) + (d.brushPM ? 1 : 0) + (d.floss ? 1 : 0) +
                     (d.mood ? 1 : 0) +
                     Object.keys(d.nutrition || {}).length + Object.keys(body).length +
                     Object.keys(d.meds || {}).length;
    });
    t.totalLogs += t.sleepNights + t.workouts + t.vitals;

    /* Checkups: how many are inside their interval right now. */
    var checkups = Hub.state.logs.checkups || [];
    t.checkupsTotal = checkups.length;
    checkups.forEach(function (c) {
      if (c.lastISO) t.checkupsLogged++;
      if (checkupStatus(c).state === "ok") t.checkupsCurrent++;
    });
    return t;
  }

  /* Where a recurring appointment stands: never logged, due soon, or overdue.
     `dueISO` is the date it next falls due; `days` is signed — negative once
     it's overdue, which is what the UI colours on. */
  function checkupStatus(c) {
    var months = Number(c.intervalMonths) || 12;
    if (!c.lastISO) return { state: "never", days: null, dueISO: null, months: months };
    var last = Hub.parseYmd(c.lastISO);
    var due = new Date(last.getFullYear(), last.getMonth() + months, last.getDate());
    var dueISO = Hub.ymd(due);
    var days = Hub.daysBetween(Hub.today(), dueISO);
    var state = days < 0 ? "overdue" : (days <= 30 ? "soon" : "ok");
    return { state: state, days: days, dueISO: dueISO, months: months };
  }

  /* Days the current toothbrush has been in service (null if none logged). */
  function brushAgeDays() {
    var iso = Hub.state.logs.toothbrushISO;
    if (!iso) return null;
    return Hub.daysBetween(iso, Hub.today());
  }

  /* ======================================================================
     5. BADGES
     ----------------------------------------------------------------------
     Each badge gets a `test(ctx)` returning true when earned, plus an optional
     `progress(ctx)` string shown on the locked tile so goals feel reachable.
     ====================================================================== */
  /* BASALT's muscle engine, or null if the Fitness tab hasn't booted yet. */
  function ms() {
    return (window.App && window.App.muscles) || null;
  }

  var BADGES = [
    { id: "first-steps", emoji: "🌱", name: "First Steps", cat: "General",
      desc: "Log your very first habit.",
      test: function (c) { return c.t.totalLogs >= 1; },
      progress: function (c) { return c.t.totalLogs + "/1"; } },

    { id: "first-workout", emoji: "💪", name: "Iron Begins", cat: "Fitness",
      desc: "Complete your first workout.",
      test: function (c) { return c.t.workouts >= 1; },
      progress: function (c) { return c.t.workouts + "/1 workouts"; } },

    { id: "iron-week", emoji: "🔥", name: "Seven Straight", cat: "Fitness",
      desc: "Train 7 days in a row.",
      test: function (c) { return c.s.fitness.best >= 7; },
      progress: function (c) { return c.s.fitness.best + "/7 days"; } },

    { id: "twenty-workouts", emoji: "🏋️", name: "Twenty Sessions", cat: "Fitness",
      desc: "Log 20 workouts in total.",
      test: function (c) { return c.t.workouts >= 20; },
      progress: function (c) { return c.t.workouts + "/20 workouts"; } },

    /* ---- MUSCLES ----
       All five read through App.muscles, which only exists once BASALT has
       booted. `ms()` null-guards that; `recompute` runs again after boot
       (js/app.js), so a badge is never permanently missed.

       Two deliberate choices, both about rewarding the right thing:
       · Keyed on the MEDIAN group, not "any group". Keyed on any, these would
         all be won by whichever group the default program happens to hammer —
         three more badges for "you used the app", which Iron Begins and Twenty
         Sessions already cover. The median only moves when training broadens.
       · "Every group" reads the generated group list, so if a movement is ever
         added that reaches a new muscle, these stay correct without an edit. */
    { id: "muscle-first", emoji: "🩻", name: "Anatomy Lesson", cat: "Muscles",
      desc: "Bring any muscle group to conditioning level 2.",
      test: function () { var m = ms(); return !!m && m.countAtLeast(2) >= 1; },
      progress: function () { var m = ms(); return m ? m.countAtLeast(2) + "/1 groups at L2" : "Log a workout"; } },

    { id: "muscle-forged", emoji: "🔨", name: "Forged", cat: "Muscles",
      desc: "Get your median muscle group to conditioning level 5.",
      test: function () { var m = ms(); return !!m && m.medianLevel() >= 5; },
      progress: function () { var m = ms(); return m ? "median L" + m.medianLevel() + "/5" : "Log a workout"; } },

    { id: "muscle-obsidian", emoji: "🌋", name: "Obsidian", cat: "Muscles",
      desc: "Get your median muscle group to conditioning level 10.",
      test: function () { var m = ms(); return !!m && m.medianLevel() >= 10; },
      progress: function () { var m = ms(); return m ? "median L" + m.medianLevel() + "/10" : "Log a workout"; } },

    { id: "muscle-balanced", emoji: "⚖️", name: "Balanced Build", cat: "Muscles",
      desc: "Bring every muscle group to conditioning level 3.",
      test: function () { var m = ms(); return !!m && m.countAtLeast(3) >= m.GROUPS.length; },
      progress: function () { var m = ms(); return m ? m.countAtLeast(3) + "/" + m.GROUPS.length + " groups at L3" : "Log a workout"; } },

    { id: "muscle-full-week", emoji: "🗺️", name: "Full Sweep", cat: "Muscles",
      desc: "Train every muscle group inside a single week.",
      test: function () { var m = ms(); return !!m && m.trainedThisWeek() >= m.GROUPS.length; },
      progress: function () { var m = ms(); return m ? m.trainedThisWeek() + "/" + m.GROUPS.length + " this week" : "Log a workout"; } },

    { id: "eye-opener", emoji: "👁️", name: "Eye Opener", cat: "Eye care",
      desc: "Finish your first guided eye exercise.",
      test: function (c) { return c.t.eyeSessions >= 1; },
      progress: function (c) { return c.t.eyeSessions + "/1 sessions"; } },

    { id: "clear-sight", emoji: "🔭", name: "Clear Sight", cat: "Eye care",
      desc: "Keep a 7-day eye care streak.",
      test: function (c) { return c.s.eye.best >= 7; },
      progress: function (c) { return c.s.eye.best + "/7 days"; } },

    { id: "rule-of-twenty", emoji: "⏳", name: "Rule of Twenty", cat: "Eye care",
      desc: "Take 50 twenty-second eye breaks.",
      test: function (c) { return c.t.eye2020 >= 50; },
      progress: function (c) { return c.t.eye2020 + "/50 breaks"; } },

    { id: "bright-smile", emoji: "🦷", name: "Bright Smile", cat: "Dental",
      desc: "Brush morning and night on the same day.",
      test: function (c) { return c.s.dental.best >= 1; },
      progress: function () { return "AM + PM in one day"; } },

    { id: "enamel-guard", emoji: "🛡️", name: "Enamel Guard", cat: "Dental",
      desc: "Brush twice daily for 14 days running.",
      test: function (c) { return c.s.dental.best >= 14; },
      progress: function (c) { return c.s.dental.best + "/14 days"; } },

    { id: "floss-boss", emoji: "🧵", name: "Floss Boss", cat: "Dental",
      desc: "Floss 30 days in total.",
      test: function (c) { return c.t.flossDays >= 30; },
      progress: function (c) { return c.t.flossDays + "/30 days"; } },

    { id: "fresh-bristles", emoji: "🪥", name: "Fresh Bristles", cat: "Dental",
      desc: "Swap to a new toothbrush within 100 days of the last one.",
      /* Awarded on the swap itself — see dental.js, which stamps `brushSwapOnTime`. */
      test: function (c) { return !!c.state.meta.brushSwapOnTime; },
      progress: function () { return "Log a replacement in time"; } },

    { id: "hydro-30", emoji: "💧", name: "Thirty Glasses", cat: "Hydration",
      desc: "Log 30 cups of water.",
      test: function (c) { return c.t.water >= 30; },
      progress: function (c) { return c.t.water + "/30 cups"; } },

    { id: "well-watered", emoji: "🌊", name: "Well Watered", cat: "Hydration",
      desc: "Hit your hydration goal 7 days in a row.",
      test: function (c) { return c.s.hydration.best >= 7; },
      progress: function (c) { return c.s.hydration.best + "/7 days"; } },

    { id: "deep-breath", emoji: "🌬️", name: "First Breath", cat: "Mindfulness",
      desc: "Complete one breathing or meditation session.",
      test: function (c) { return c.t.mindful >= 1; },
      progress: function (c) { return c.t.mindful + "/1 sessions"; } },

    { id: "zen-ten", emoji: "🧘", name: "Ten Sittings", cat: "Mindfulness",
      desc: "Complete 10 mindfulness sessions.",
      test: function (c) { return c.t.mindful >= 10; },
      progress: function (c) { return c.t.mindful + "/10 sessions"; } },

    { id: "rested", emoji: "🌙", name: "Well Rested", cat: "Sleep",
      desc: "Log 7 nights of sleep.",
      test: function (c) { return c.t.sleepNights >= 7; },
      progress: function (c) { return c.t.sleepNights + "/7 nights"; } },

    { id: "tall-spine", emoji: "🧍", name: "Tall Spine", cat: "Wellness",
      desc: "Answer 25 posture check-ins.",
      test: function (c) { return c.t.posture >= 25; },
      progress: function (c) { return c.t.posture + "/25 check-ins"; } },

    { id: "perfect-day", emoji: "⭐", name: "Perfect Day", cat: "General",
      desc: "Complete every core habit in a single day.",
      test: function (c) { return c.t.perfectDays >= 1; },
      progress: function (c) { return c.t.perfectDays + "/1 days"; } },

    { id: "perfect-week", emoji: "👑", name: "Perfect Week", cat: "General",
      desc: "Seven perfect days in a row.",
      test: function (c) { return c.s.perfect.best >= 7; },
      progress: function (c) { return c.s.perfect.best + "/7 days"; } },

    { id: "centurion", emoji: "💯", name: "Centurion", cat: "General",
      desc: "Log 100 habits in total.",
      test: function (c) { return c.t.totalLogs >= 100; },
      progress: function (c) { return c.t.totalLogs + "/100 logs"; } },

    /* ---------- mobility & recovery ---------- */
    { id: "first-mobility", emoji: "🤸", name: "Loosen Up", cat: "Mobility",
      desc: "Complete your first mobility routine.",
      test: function (c) { return c.t.mobility >= 1; },
      progress: function (c) { return c.t.mobility + "/1 routines"; } },

    { id: "supple", emoji: "🧘‍♂️", name: "Supple", cat: "Mobility",
      desc: "Keep a 14-day mobility streak.",
      test: function (c) { return c.s.mobility.best >= 14; },
      progress: function (c) { return c.s.mobility.best + "/14 days"; } },

    { id: "wrist-ready", emoji: "🖐️", name: "Wrist Ready", cat: "Mobility",
      desc: "Complete 25 mobility routines in total.",
      test: function (c) { return c.t.mobility >= 25; },
      progress: function (c) { return c.t.mobility + "/25 routines"; } },

    { id: "knows-when-to-rest", emoji: "😴", name: "Knows When To Rest", cat: "Mobility",
      desc: "Log 10 deliberate rest days.",
      test: function (c) { return c.t.restDays >= 10; },
      progress: function (c) { return c.t.restDays + "/10 rest days"; } },

    /* ---------- desk & movement ---------- */
    { id: "first-stand", emoji: "🧍", name: "Off The Chair", cat: "Desk",
      desc: "Log your first stand break.",
      test: function (c) { return c.t.standBreaks >= 1; },
      progress: function (c) { return c.t.standBreaks + "/1 breaks"; } },

    { id: "hourly-riser", emoji: "⏱️", name: "Hourly Riser", cat: "Desk",
      desc: "Hit your stand-break goal on a single day.",
      test: function (c) { return c.t.standGoalDays >= 1; },
      progress: function (c) { return c.t.standGoalDays + "/1 days"; } },

    { id: "unstuck", emoji: "🚶", name: "Unstuck", cat: "Desk",
      desc: "Hit the stand-break goal 5 days running.",
      test: function (c) { return c.s.desk.best >= 5; },
      progress: function (c) { return c.s.desk.best + "/5 days"; } },

    { id: "hundred-breaks", emoji: "🔁", name: "Hundred Breaks", cat: "Desk",
      desc: "Take 100 stand breaks in total.",
      test: function (c) { return c.t.standBreaks >= 100; },
      progress: function (c) { return c.t.standBreaks + "/100 breaks"; } },

    { id: "snack-attack", emoji: "⚡", name: "Movement Snacker", cat: "Desk",
      desc: "Clock up 60 minutes of movement snacks.",
      test: function (c) { return c.t.moveMinutes >= 60; },
      progress: function (c) { return Math.round(c.t.moveMinutes) + "/60 min"; } },

    /* ---------- reproductive health ---------- */
    /* Deliberately about the habit of checking, never about what was found. */
    { id: "self-aware", emoji: "🔍", name: "Knows Their Normal", cat: "Reproductive",
      desc: "Log a monthly self-check.",
      test: function (c) { return c.t.selfExams >= 1; },
      progress: function (c) { return c.t.selfExams + "/1 checks"; } },

    { id: "cycle-tracked", emoji: "🌙", name: "Cycle Tracked", cat: "Reproductive",
      desc: "Log four periods, enough for a prediction worth trusting.",
      test: function (c) { return c.t.cycles >= 4; },
      progress: function (c) { return c.t.cycles + "/4 logged"; } },

    /* ---------- body care ---------- */
    { id: "first-skin", emoji: "🧴", name: "Clean Slate", cat: "Body care",
      desc: "Complete a morning and evening skin routine in one day.",
      test: function (c) { return c.t.skinDays >= 1; },
      progress: function (c) { return c.t.skinDays + "/1 days"; } },

    { id: "skin-deep", emoji: "✨", name: "Skin Deep", cat: "Body care",
      desc: "Keep a 14-day body care streak.",
      test: function (c) { return c.s.bodycare.best >= 14; },
      progress: function (c) { return c.s.bodycare.best + "/14 days"; } },

    { id: "sun-smart", emoji: "🧢", name: "Sun Smart", cat: "Body care",
      desc: "Apply sunscreen on 30 separate days.",
      test: function (c) { return c.t.spf >= 30; },
      progress: function (c) { return c.t.spf + "/30 days"; } },

    { id: "head-to-toe", emoji: "🦶", name: "Head To Toe", cat: "Body care",
      desc: "Log 100 body-care items across all areas.",
      test: function (c) { return c.t.bodyLogs >= 100; },
      progress: function (c) { return c.t.bodyLogs + "/100 items"; } },

    /* ---------- mind ---------- */
    { id: "first-mood", emoji: "🙂", name: "Checking In", cat: "Mind",
      desc: "Log your first mood check-in.",
      test: function (c) { return c.t.moodLogs >= 1; },
      progress: function (c) { return c.t.moodLogs + "/1 check-ins"; } },

    { id: "self-aware", emoji: "🪞", name: "Self Aware", cat: "Mind",
      desc: "Log 30 mood check-ins.",
      test: function (c) { return c.t.moodLogs >= 30; },
      progress: function (c) { return c.t.moodLogs + "/30 check-ins"; } },

    /* ---------- health records ---------- */
    { id: "first-vital", emoji: "🩺", name: "Baseline", cat: "Health records",
      desc: "Record your first set of vitals.",
      test: function (c) { return c.t.vitals >= 1; },
      progress: function (c) { return c.t.vitals + "/1 readings"; } },

    { id: "pressure-watch", emoji: "❤️", name: "Pressure Watch", cat: "Health records",
      desc: "Record 10 blood-pressure readings.",
      test: function (c) { return c.t.bpReadings >= 10; },
      progress: function (c) { return c.t.bpReadings + "/10 readings"; } },

    { id: "up-to-date", emoji: "📋", name: "Up To Date", cat: "Health records",
      desc: "Have every recurring check-up inside its interval at once.",
      test: function (c) { return c.t.checkupsTotal > 0 && c.t.checkupsCurrent === c.t.checkupsTotal; },
      progress: function (c) { return c.t.checkupsCurrent + "/" + c.t.checkupsTotal + " current"; } },

    { id: "adherent", emoji: "💊", name: "Adherent", cat: "Health records",
      desc: "Take everything on your list 14 days running.",
      test: function (c) { return c.s.meds.best >= 14; },
      progress: function (c) { return c.s.meds.best + "/14 days"; } },

    { id: "own-numbers", emoji: "🧪", name: "Own Your Numbers", cat: "Health records",
      desc: "Record a set of lab results.",
      test: function (c) { return c.t.labs >= 1; },
      progress: function (c) { return c.t.labs + "/1 panels"; } },

    { id: "in-case", emoji: "🆔", name: "In Case Of", cat: "Health records",
      desc: "Fill in a medical profile someone could actually use in an emergency.",
      test: function (c) {
        var p = c.state.logs.profile || {};
        return !!(p.bloodType && (p.emergency || []).length);
      },
      progress: function () { return "Blood type + a contact"; } },

    /* ---------- your own habits ---------- */
    { id: "made-it-mine", emoji: "🛠️", name: "Made It Mine", cat: "Your habits",
      desc: "Create a habit of your own.",
      test: function (c) { return c.t.customHabits >= 1; },
      progress: function (c) { return c.t.customHabits + "/1 habits"; } },

    { id: "own-way", emoji: "🧭", name: "Your Own Way", cat: "Your habits",
      desc: "Tick your own habits 50 times.",
      test: function (c) { return c.t.customTicks >= 50; },
      progress: function (c) { return c.t.customTicks + "/50 ticks"; } },

    /* ---------- sleep & intake ---------- */
    { id: "nap-taker", emoji: "😪", name: "Strategic Nap", cat: "Sleep",
      desc: "Log a nap.",
      test: function (c) { return c.t.naps >= 1; },
      progress: function (c) { return c.t.naps + "/1 naps"; } },

    { id: "thirty-nights", emoji: "🛌", name: "Thirty Nights", cat: "Sleep",
      desc: "Log 30 nights of sleep.",
      test: function (c) { return c.t.nights >= 30; },
      progress: function (c) { return c.t.nights + "/30 nights"; } },

    { id: "dry-fortnight", emoji: "🚫", name: "Dry Fortnight", cat: "Intake",
      desc: "14 logged days with no alcohol.",
      test: function (c) { return c.t.alcoholFreeDays >= 14; },
      progress: function (c) { return c.t.alcoholFreeDays + "/14 days"; } }
  ];

  var BADGE_BY_ID = {};
  BADGES.forEach(function (b) { BADGE_BY_ID[b.id] = b; });

  /* ======================================================================
     6. RECOMPUTE
     ====================================================================== */
  var booted = false;   // suppress badge popups during the very first pass

  /* One category's full streak picture, whichever cadence it's on.
     `unit` is what the number counts, so the UI can say "3 weeks" rather than
     silently showing weeks in a box labelled days. */
  function streakFor(key) {
    var cat = CATEGORIES[key];
    if (!cat) return { current: 0, best: 0, doneToday: false, unit: "day", cadence: "daily" };

    var doneFn = cat.done;
    var cad = cadenceFor(key);

    if (cad.type === "weekly") {
      var info = weeklyStreakInfo(doneFn, cad.perWeek);
      var monday = weekStart(Hub.today());
      var count = weekCount(doneFn, monday);
      return {
        current: info.current,
        best: weeklyBest(doneFn, cad.perWeek),
        doneToday: count >= cad.perWeek,      // "done" = this week's target met
        didToday: doneFn(Hub.today()),
        unit: "week", cadence: "weekly", perWeek: cad.perWeek,
        weekCount: count, graceUsed: 0, graceLeft: 0
      };
    }

    var d = currentStreakInfo(doneFn);
    return {
      current: d.current,
      best: bestStreak(doneFn),
      doneToday: doneFn(Hub.today()),
      didToday: doneFn(Hub.today()),
      unit: "day", cadence: "daily",
      graceUsed: d.graceUsed, graceLeft: d.graceLeft
    };
  }

  function recompute(opts) {
    opts = opts || {};
    invalidate();
    syncCustomCategories();

    var streaks = {};
    Object.keys(CATEGORIES).forEach(function (key) {
      streaks[key] = streakFor(key);
    });
    streaks.perfect = {
      current: currentStreak(isPerfect),
      best: bestStreak(isPerfect),
      doneToday: isPerfect(Hub.today()),
      cadence: "daily", graceUsed: 0, graceLeft: 0
    };
    Hub.state.streaks = streaks;

    /* Badge pass — award anything newly earned. */
    var ctx = { t: totals(), s: streaks, state: Hub.state };
    var freshly = [];
    BADGES.forEach(function (b) {
      if (Hub.state.badges[b.id]) return;
      var earned = false;
      try { earned = !!b.test(ctx); } catch (e) { earned = false; }
      if (earned) {
        Hub.state.badges[b.id] = new Date().toISOString();
        freshly.push(b);
      }
    });

    if (freshly.length && booted && !opts.silent) {
      /* Stagger so several at once read as a sequence, not a pile-up. */
      freshly.forEach(function (b, i) { setTimeout(function () { celebrate(b); }, i * 900); });
    }
    return freshly;
  }

  /* Mark the first pass complete: from here on, unlocks are celebrated. */
  function markBooted() { booted = true; }

  /* ======================================================================
     7. CELEBRATION
     ====================================================================== */
  function celebrate(badge) {
    var host = document.getElementById("wh-celebrate");
    if (!host) return;
    var el = document.createElement("div");
    el.className = "wh-unlock";
    el.setAttribute("role", "status");
    el.innerHTML =
      '<div class="wh-unlock__icon">' + badge.emoji + "</div>" +
      "<div>" +
        '<div class="wh-unlock__eyebrow">Badge unlocked</div>' +
        '<div class="wh-unlock__name">' + Hub.esc(badge.name) + "</div>" +
        '<div class="wh-unlock__desc">' + Hub.esc(badge.desc) + "</div>" +
      "</div>";
    host.appendChild(el);
    Hub.beep(784, 130); setTimeout(function () { Hub.beep(1046, 260); }, 140);
    setTimeout(function () { el.remove(); }, 3000);
  }

  /* Announce a streak milestone (7 / 14 / 30 / 50 / 100 …). Called by views
     right after they log something, so the nudge lands with the action. */
  var MILESTONES = [7, 14, 30, 50, 75, 100, 200, 365];
  var WEEK_MILESTONES = [2, 4, 8, 12, 26, 52];
  function checkMilestone(catKey) {
    var s = Hub.state.streaks[catKey];
    if (!s) return;
    var weekly = s.unit === "week";
    var list = weekly ? WEEK_MILESTONES : MILESTONES;
    if (list.indexOf(s.current) === -1) return;
    var label = catKey === "perfect" ? "perfect day" : (CATEGORIES[catKey] || {}).label || catKey;
    Hub.toast("🔥 " + s.current + "-" + (weekly ? "week" : "day") + " " + label.toLowerCase() + " streak!",
      "success", 4200);
    Hub.cueDone();
  }

  /* ======================================================================
     8. PUBLIC
     ====================================================================== */
  Hub.gamify = {
    CATEGORIES: CATEGORIES,
    PERFECT_PARTS: PERFECT_PARTS,
    BADGES: BADGES,
    badgeById: function (id) { return BADGE_BY_ID[id]; },

    recompute: recompute,
    markBooted: markBooted,
    invalidate: invalidate,

    /* cadence + grace */
    cadenceFor: cadenceFor,
    isWeekly: isWeekly,
    weekStart: weekStart,
    weekCount: weekCount,
    streakFor: streakFor,
    graceAllowance: graceAllowance,

    /* custom habits */
    customHabits: customHabits,
    syncCustomCategories: syncCustomCategories,
    /* Categories the user can put on a cadence — excludes the derived ones
       where "3 times a week" would be meaningless. */
    cadenceCandidates: function () {
      return Object.keys(CATEGORIES).filter(function (k) {
        return ["fitness", "meds"].indexOf(k) === -1;
      });
    },

    isPerfect: isPerfect,
    totals: totals,
    checkupStatus: checkupStatus,
    activeMeds: activeMeds,
    brushAgeDays: brushAgeDays,
    recentDays: recentDays,
    fitnessDates: fitnessDates,

    celebrate: celebrate,
    checkMilestone: checkMilestone,

    /* Everything a badge tile needs to render, unlocked or not. */
    badgeState: function () {
      var ctx = { t: totals(), s: Hub.state.streaks, state: Hub.state };
      return BADGES.map(function (b) {
        var at = Hub.state.badges[b.id];
        var prog = "";
        if (!at && b.progress) { try { prog = b.progress(ctx); } catch (e) {} }
        return { badge: b, unlocked: !!at, at: at || null, progress: prog };
      });
    }
  };

})();
