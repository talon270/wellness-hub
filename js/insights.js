/* ============================================================================
   WELLNESS HUB · INSIGHTS ENGINE
   ----------------------------------------------------------------------------
   Turns the logs into things you can act on:

     SERIES     one named daily number per metric, so charts and correlations
                all read from the same definitions
     HEATMAP    a year of done/not-done per category
     FINDINGS   curated, lagged comparisons between pairs of metrics, reported
                in plain language with the sample size attached
     REVIEW     this week against last week, per category
     ADVICE     workout ↔ recovery rules — the linkage between what you trained
                and what your body is telling you

   On honesty: findings are ASSOCIATIONS in your own small sample, never causes.
   Every one carries its n, nothing is reported below a minimum sample, and the
   UI says so. A tracker that implies "sleeping more made you happier" from
   twelve days of self-report is lying to you.

   Public: Hub.insights
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  /* Below this many paired days, a comparison is noise. */
  var MIN_PAIRS = 10;

  /* ======================================================================
     1. SERIES — one definition per metric
     ====================================================================== */
  var SERIES = {
    sleepHours: {
      label: "Sleep", unit: "h", color: "var(--purple-bright)", chart: "#d3869b",
      get: function (k) { var e = sleepFor(k); return e ? Number(e.hours) || null : null; }
    },
    sleepQuality: {
      label: "Sleep quality", unit: "/5", color: "var(--purple)", chart: "#b16286",
      get: function (k) { var e = sleepFor(k); return e && e.quality ? e.quality : null; }
    },
    mood: {
      label: "Mood", unit: "/5", color: "var(--yellow-bright)", chart: "#fabd2f",
      get: function (k) { var m = Hub.day(k).mood; return m && m.mood ? m.mood : null; }
    },
    energy: {
      label: "Energy", unit: "/5", color: "var(--orange-bright)", chart: "#fe8019",
      get: function (k) { var m = Hub.day(k).mood; return m && m.energy ? m.energy : null; }
    },
    stress: {
      label: "Stress", unit: "/5", color: "var(--red-bright)", chart: "#fb4934",
      get: function (k) { var m = Hub.day(k).mood; return m && m.stress ? m.stress : null; }
    },
    water: {
      label: "Water", unit: " cups", color: "var(--blue-bright)", chart: "#83a598",
      get: function (k) { var d = Hub.day(k); return d.water || null; }
    },
    mobility: {
      label: "Mobility", unit: " sessions", color: "var(--yellow)", chart: "#d79921",
      get: function (k) { var d = Hub.day(k); return (d.mobility || 0) + (d.stretch || 0) || null; }
    },
    volume: {
      label: "Training volume", unit: "", color: "var(--orange-bright)", chart: "#fe8019",
      get: function (k) { return workoutVolume()[k] || null; }
    },
    soreness: {
      label: "Total soreness", unit: "", color: "var(--red)", chart: "#cc241d",
      get: function (k) {
        var s = Hub.day(k).soreness || {};
        var keys = Object.keys(s);
        if (!keys.length) return null;
        return keys.reduce(function (n, p) { return n + (Number(s[p]) || 0); }, 0);
      }
    },
    weight: {
      label: "Weight", unit: " kg", color: "var(--aqua-bright)", chart: "#8ec07c",
      get: function (k) { return weightByDate()[k] || null; }
    },
    restingHR: {
      label: "Resting HR", unit: " bpm", color: "var(--red-bright)", chart: "#fb4934",
      get: function (k) {
        var v = (Hub.state.logs.vitals || []).filter(function (e) { return e.date === k && e.hr; })[0];
        return v ? v.hr : null;
      }
    },
    /* Deliberately absent from PAIRS. VO2 max is measured a handful of times a
       year, so a lagged daily correlation would sit at "not enough data"
       forever — and if it ever cleared MIN_PAIRS, a same-day Pearson between a
       quarterly measurement and last night's sleep would be noise wearing a
       coefficient. As a chartable series it does the useful thing instead:
       overlay it on resting HR or training volume and the relationship is
       visible over months, which is the scale it actually moves on.
       Sparse like restingHR — a day with no reading is null, never carried
       forward, because inventing 200 days of a value you measured six times
       is the exact lie this engine exists to avoid. */
    vo2max: {
      label: "VO2 max", unit: " ml/kg/min", color: "var(--blue-bright)", chart: "#83a598",
      get: function (k) {
        var v = (Hub.state.logs.vo2max || []).filter(function (e) { return e.date === k; })[0];
        return v ? Number(v.value) || null : null;
      }
    },
    loudMinutes: {
      label: "Loud exposure", unit: " min", color: "var(--purple-bright)", chart: "#d3869b",
      get: function (k) { return Hub.day(k).loudMinutes || null; }
    },
    standBreaks: {
      label: "Stand breaks", unit: "", color: "var(--wh-c-desk)", chart: "#8ec07c",
      get: function (k) { return Hub.day(k).stand || null; }
    },
    sitMinutes: {
      label: "Time seated", unit: " min", color: "var(--orange)", chart: "#d65d0e",
      /* Only exists on days the sitting clock was actually used, which is the
         honest answer — a zero here would otherwise read as "didn't sit down". */
      get: function (k) { return Hub.day(k).sitMin || null; }
    },

    /* ---- intake: the three biggest levers on everything above ---- */
    caffeine: {
      label: "Caffeine", unit: " mg", color: "var(--orange)", chart: "#d65d0e",
      get: function (k) { var d = Hub.day(k); return d.caffeineMg || null; }
    },
    alcohol: {
      label: "Alcohol", unit: " units", color: "var(--red)", chart: "#cc241d",
      get: function (k) { var d = Hub.day(k); return d.alcoholUnits || null; }
    },
    screenBeforeBed: {
      label: "Screen before bed", unit: " min", color: "var(--blue)", chart: "#458588",
      /* Minutes between screens off and getting into bed. Needs both halves,
         so it only exists on days you logged the screen-off time AND a night. */
      get: function (k) {
        var d = Hub.day(k);
        if (!d.screenOff) return null;
        var night = sleepFor(k);
        if (!night || !night.bed) return null;
        var off = hhmm(d.screenOff), bed = hhmm(night.bed);
        var gap = bed - off;
        if (gap < -720) gap += 1440;        // screens off before midnight, bed after
        if (gap > 720) gap -= 1440;
        return gap < 0 ? 0 : gap;
      }
    },
    cycleDay: {
      label: "Cycle day", unit: "", color: "var(--purple)", chart: "#b16286",
      get: function (k) {
        if (!Hub.state.settings.cycleTracking) return null;
        var n = Hub.cycle ? Hub.cycle.dayOf(k) : null;
        return n || null;
      }
    }
  };

  function hhmm(s) {
    var p = String(s || "0:0").split(":");
    return (Number(p[0]) || 0) * 60 + (Number(p[1]) || 0);
  }

  /* ---- memoised cross-module lookups, cleared on each recompute ---- */
  var _sleepIdx = null, _volume = null, _weight = null;

  /* The night for a date. Naps are deliberately excluded: a 20-minute nap
     shouldn't be able to overwrite the night it followed. */
  function sleepFor(k) {
    if (!_sleepIdx) {
      _sleepIdx = {};
      (Hub.state.logs.sleep || []).forEach(function (e) {
        if (e && e.kind !== "nap") _sleepIdx[e.date] = e;
      });
    }
    return _sleepIdx[k];
  }

  /* Training volume per date, straight from the calisthenics session log. */
  function workoutVolume() {
    if (_volume) return _volume;
    _volume = {};
    try {
      ((window.App && window.App.STATE && window.App.STATE.sessions) || []).forEach(function (s) {
        if (!s || !s.dateISO) return;
        var k = String(s.dateISO).slice(0, 10);
        _volume[k] = (_volume[k] || 0) + (Number(s.volume) || 0);
      });
    } catch (e) {}
    return _volume;
  }

  /* Weight comes from either store — vitals here, bodyweight log in training. */
  function weightByDate() {
    if (_weight) return _weight;
    _weight = {};
    try {
      ((window.App && window.App.STATE && window.App.STATE.bodyweightLog) || []).forEach(function (e) {
        if (e && e.dateISO && e.kg) _weight[String(e.dateISO).slice(0, 10)] = Number(e.kg);
      });
    } catch (e) {}
    (Hub.state.logs.vitals || []).forEach(function (v) {
      if (v.weightKg) _weight[v.date] = Number(v.weightKg);   // hub entry wins
    });
    return _weight;
  }

  function invalidate() { _sleepIdx = null; _volume = null; _weight = null; }

  /* Last `days` values of a series, oldest first. */
  function series(id, days) {
    invalidate();
    var def = SERIES[id];
    if (!def) return [];
    var out = [], today = Hub.today();
    for (var i = days - 1; i >= 0; i--) {
      var k = Hub.shiftDay(today, -i);
      out.push({ date: k, value: def.get(k) });
    }
    return out;
  }

  /* ======================================================================
     2. HEATMAP
     ====================================================================== */
  function heatmap(categoryKey, days) {
    var cat = Hub.gamify.CATEGORIES[categoryKey];
    if (!cat) return [];
    var out = [], today = Hub.today();
    for (var i = days - 1; i >= 0; i--) {
      var k = Hub.shiftDay(today, -i);
      out.push({ date: k, done: cat.done(k) });
    }
    return out;
  }

  /* ======================================================================
     3. FINDINGS — curated, lagged comparisons
     ----------------------------------------------------------------------
     Each pair asks a specific question, with `lag` meaning "how many days
     after the cause do we look for the effect".
     ====================================================================== */
  var PAIRS = [
    { a: "sleepHours", b: "mood",    lag: 1, question: "Does a longer night lift the next day's mood?" },
    { a: "sleepHours", b: "energy",  lag: 1, question: "Does sleep show up as next-day energy?" },
    { a: "sleepHours", b: "volume",  lag: 1, question: "Do you train harder after sleeping well?" },
    { a: "stress",     b: "sleepHours", lag: 0, question: "Does a stressful day cost you sleep that night?" },
    { a: "volume",     b: "sleepQuality", lag: 0, question: "Does training change how well you sleep?" },
    { a: "mobility",   b: "soreness", lag: 1, question: "Does mobility work reduce next-day soreness?" },
    { a: "water",      b: "energy",  lag: 0, question: "Does hydration track with energy?" },
    { a: "volume",     b: "soreness", lag: 1, question: "How much soreness follows a hard session?" },
    { a: "loudMinutes", b: "stress", lag: 0, question: "Do loud days come with more stress?" },
    { a: "restingHR",  b: "energy",  lag: 0, question: "Does a raised resting heart rate show up as low energy?" },

    /* ---- intake ---- */
    { a: "caffeine", b: "sleepHours",   lag: 0, question: "Does caffeine cost you sleep that night?" },
    { a: "caffeine", b: "sleepQuality", lag: 0, question: "Does caffeine change how well you sleep?" },
    { a: "alcohol",  b: "sleepQuality", lag: 0, question: "Does drinking change your sleep quality?" },
    { a: "alcohol",  b: "energy",       lag: 1, question: "How does a drink show up in the next day's energy?" },
    { a: "alcohol",  b: "restingHR",    lag: 1, question: "Does alcohol raise your resting heart rate overnight?" },
    { a: "screenBeforeBed", b: "sleepQuality", lag: 0, question: "Does a longer screen-free wind-down improve your sleep?" },

    /* ---- desk & movement ---- */
    { a: "standBreaks", b: "energy",   lag: 0, question: "Do days with more stand breaks feel more energetic?" },
    { a: "sitMinutes",  b: "soreness", lag: 0, question: "Does a long day in the chair show up as soreness?" },
    { a: "sitMinutes",  b: "mood",     lag: 0, question: "Does time seated track with your mood?" },

    /* ---- cycle (only produces pairs when tracking is on) ---- */
    { a: "cycleDay", b: "energy",   lag: 0, question: "Does your energy track with where you are in your cycle?" },
    { a: "cycleDay", b: "soreness", lag: 0, question: "Does soreness track with your cycle?" },
    { a: "cycleDay", b: "sleepQuality", lag: 0, question: "Does your sleep quality move with your cycle?" }
  ];

  /* Pair up (cause on day D, effect on day D+lag) wherever BOTH exist. */
  function pairUp(aId, bId, lag, days) {
    var A = SERIES[aId], B = SERIES[bId];
    if (!A || !B) return [];
    var pairs = [], today = Hub.today();
    for (var i = days - 1; i >= lag; i--) {
      var kA = Hub.shiftDay(today, -i);
      var kB = Hub.shiftDay(today, -(i - lag));
      var va = A.get(kA), vb = B.get(kB);
      if (va != null && vb != null) pairs.push([va, vb]);
    }
    return pairs;
  }

  function mean(xs) { return xs.reduce(function (a, b) { return a + b; }, 0) / xs.length; }

  function median(xs) {
    var s = xs.slice().sort(function (a, b) { return a - b; });
    var m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function pearson(pairs) {
    var n = pairs.length;
    if (n < 3) return 0;
    var xs = pairs.map(function (p) { return p[0]; });
    var ys = pairs.map(function (p) { return p[1]; });
    var mx = mean(xs), my = mean(ys);
    var num = 0, dx = 0, dy = 0;
    for (var i = 0; i < n; i++) {
      var a = xs[i] - mx, b = ys[i] - my;
      num += a * b; dx += a * a; dy += b * b;
    }
    if (dx === 0 || dy === 0) return 0;          // one side never varied
    return num / Math.sqrt(dx * dy);
  }

  /* Split by the median of the cause and compare the effect's average in each
     half. Far more legible than a correlation coefficient, and it degrades
     honestly: if the split is lopsided or tiny, we simply don't report. */
  function findings(days) {
    invalidate();
    days = days || 120;
    var out = [];

    PAIRS.forEach(function (p) {
      var pairs = pairUp(p.a, p.b, p.lag, days);
      if (pairs.length < MIN_PAIRS) return;

      var causes = pairs.map(function (x) { return x[0]; });
      var cut = median(causes);
      var high = pairs.filter(function (x) { return x[0] > cut; }).map(function (x) { return x[1]; });
      var low = pairs.filter(function (x) { return x[0] <= cut; }).map(function (x) { return x[1]; });
      /* A median split that leaves one side nearly empty tells you nothing. */
      if (high.length < 4 || low.length < 4) return;

      var hi = mean(high), lo = mean(low);
      var r = pearson(pairs);
      var A = SERIES[p.a], B = SERIES[p.b];

      /* Relative to the effect's own spread, so "0.4 of a mood point" and
         "40 volume units" are judged on the same scale. */
      var spread = Math.max.apply(null, pairs.map(function (x) { return x[1]; })) -
                   Math.min.apply(null, pairs.map(function (x) { return x[1]; }));
      var delta = hi - lo;
      var relative = spread > 0 ? Math.abs(delta) / spread : 0;

      /* Strength has to clear THREE bars, not one. A median-split gap looks
         impressive on a 1–5 scale with eleven data points; requiring a real
         correlation and a real sample stops the app shouting about noise. */
      var absR = Math.abs(r);
      var strength = "none";
      if (pairs.length >= 30 && absR >= 0.35 && relative >= 0.20) strength = "clear";
      else if (pairs.length >= 15 && absR >= 0.20 && relative >= 0.10) strength = "slight";

      out.push({
        id: p.a + "-" + p.b,
        question: p.question,
        a: A, b: B, lag: p.lag,
        n: pairs.length,
        cut: cut,
        high: hi, low: lo, delta: delta,
        r: r,
        strength: strength,
        direction: delta > 0 ? "up" : (delta < 0 ? "down" : "flat")
      });
    });

    /* Strongest signal first, but never hide the weak ones — "no pattern" is
       a genuine result and worth seeing. */
    var rank = { clear: 0, slight: 1, none: 2 };
    return out.sort(function (x, y) {
      return rank[x.strength] - rank[y.strength] || Math.abs(y.r) - Math.abs(x.r);
    });
  }

  /* How many questions were actually asked, and how many came back positive.
     ----------------------------------------------------------------------
     This is the caveat that matters most and gets left out of every habit
     tracker: ask fourteen questions of noise and roughly one will look like a
     signal at any conventional threshold. The UI reports the arithmetic rather
     than burying it, so a lone "clear" result among many tests is read as what
     it is — a lead to re-check, not a finding.

     `expectedByChance` is a deliberately rough rule of thumb (~1 in 20 tests
     clearing a threshold this size by luck), not a corrected p-value. Calling
     it anything more precise would be its own kind of dishonesty. */
  function multiplicity(list) {
    var tested = list.length;
    var clear = list.filter(function (f) { return f.strength === "clear"; }).length;
    var slight = list.filter(function (f) { return f.strength === "slight"; }).length;
    return {
      tested: tested,
      clear: clear,
      slight: slight,
      expectedByChance: Math.round(tested * 0.05 * 10) / 10,
      /* One lone "clear" out of a dozen tests is exactly what chance looks like. */
      fragile: tested >= 8 && clear <= Math.max(1, Math.round(tested * 0.05))
    };
  }

  /* Human sentence for a finding. States the DIRECTION explicitly — a question
     phrased "does X lift Y?" with a negative result underneath is a good way to
     have someone read the opposite of what the data says. */
  function phrase(f) {
    var unitA = f.a.unit || "";
    var unitB = f.b.unit || "";
    var cut = Math.round(f.cut * 10) / 10;
    var hi = Math.round(f.high * 10) / 10;
    var lo = Math.round(f.low * 10) / 10;
    var when = f.lag ? "the next day" : "the same day";

    if (f.strength === "none") {
      return "<strong>No, not in your data.</strong> " + f.b.label + " " + when +
             " averaged around " + Math.round((hi + lo) / 2 * 10) / 10 + unitB +
             " whether " + f.a.label.toLowerCase() + " was high or low.";
    }

    var verdict = f.direction === "up"
      ? "<strong>Yes — higher.</strong> "
      : "<strong>The opposite, in fact.</strong> ";

    return verdict + "After days above " + cut + unitA + ", " + f.b.label.toLowerCase() + " " + when +
           " averaged <strong>" + hi + unitB + "</strong> — " +
           (f.direction === "up" ? "against " : "which is lower than the ") +
           "<strong>" + lo + unitB + "</strong> after days at or below that.";
  }

  /* ======================================================================
     4. PERIODIC REVIEW — this week / month / quarter against the last one
     ----------------------------------------------------------------------
     A week is short enough that one bad night dominates it. A month is where
     you can actually see whether something is drifting, and a quarter is where
     a training block or a season shows up. Same comparison either way: the
     window ending today, against the window immediately before it.
     ====================================================================== */
  var PERIODS = {
    week:    { days: 7,  label: "This week",    prevLabel: "last week" },
    month:   { days: 30, label: "This month",   prevLabel: "the month before" },
    quarter: { days: 90, label: "This quarter", prevLabel: "the quarter before" }
  };

  function review(periodKey) {
    invalidate();
    var period = PERIODS[periodKey] || PERIODS.week;
    var span = period.days;
    var C = Hub.gamify.CATEGORIES;
    var today = Hub.today();

    function countDone(catKey, offset) {
      var cat = C[catKey], n = 0;
      for (var i = 0; i < span; i++) {
        if (cat.done(Hub.shiftDay(today, -(i + offset)))) n++;
      }
      return n;
    }

    var cats = Object.keys(C).map(function (key) {
      var thisWeek = countDone(key, 0);
      var lastWeek = countDone(key, span);
      return {
        key: key, label: C[key].label, color: C[key].color, icon: C[key].icon, view: C[key].view,
        thisWeek: thisWeek, lastWeek: lastWeek, delta: thisWeek - lastWeek,
        /* As a rate, so a 30-day window and a 7-day one read the same way. */
        rate: thisWeek / span, prevRate: lastWeek / span
      };
    });

    /* Perfect days in each window. */
    function perfectIn(offset) {
      var n = 0;
      for (var i = 0; i < span; i++) if (Hub.gamify.isPerfect(Hub.shiftDay(today, -(i + offset)))) n++;
      return n;
    }

    /* Averages for the numeric series worth summarising. */
    function avg(id, offset) {
      var def = SERIES[id], vals = [];
      for (var i = 0; i < span; i++) {
        var v = def.get(Hub.shiftDay(today, -(i + offset)));
        if (v != null) vals.push(v);
      }
      return vals.length ? mean(vals) : null;
    }

    var badgesThisWeek = Object.keys(Hub.state.badges).filter(function (id) {
      var at = Hub.state.badges[id];
      return at && Hub.daysBetween(Hub.ymd(new Date(at)), today) < span;
    }).map(function (id) { return Hub.gamify.badgeById(id); }).filter(Boolean);

    var metricIds = ["sleepHours", "mood", "energy", "stress", "water", "caffeine", "alcohol"];

    return {
      period: periodKey || "week",
      span: span,
      label: period.label,
      prevLabel: period.prevLabel,
      categories: cats.sort(function (a, b) { return a.delta - b.delta; }),
      improved: cats.filter(function (c) { return c.delta > 0; }),
      slipped: cats.filter(function (c) { return c.delta < 0; }),
      perfect: { thisWeek: perfectIn(0), lastWeek: perfectIn(span) },
      badges: badgesThisWeek,
      metrics: metricIds.map(function (id) {
        return { id: id, now: avg(id, 0), prev: avg(id, span) };
      }).filter(function (m) { return m.now != null || m.prev != null; })
    };
  }

  /* ======================================================================
     4b. ONE DAY, IN FULL
     ----------------------------------------------------------------------
     What the heatmap and the charts were missing: the ability to ask "what
     actually happened on the 12th?" and get an answer.
     ====================================================================== */
  function dayDetail(key) {
    invalidate();
    var d = Hub.day(key);
    var C = Hub.gamify.CATEGORIES;

    var cats = Object.keys(C).map(function (k) {
      return { key: k, label: C[k].label, icon: C[k].icon, color: C[k].color, done: C[k].done(key) };
    });

    var night = (Hub.state.logs.sleep || []).filter(function (e) {
      return e.date === key && e.kind !== "nap";
    })[0] || null;
    var naps = (Hub.state.logs.sleep || []).filter(function (e) {
      return e.date === key && e.kind === "nap";
    });

    var metrics = Object.keys(SERIES).map(function (id) {
      return { id: id, def: SERIES[id], value: SERIES[id].get(key) };
    }).filter(function (m) { return m.value != null; });

    var sore = d.soreness || {};
    return {
      date: key,
      day: d,
      categories: cats,
      doneCount: cats.filter(function (c) { return c.done; }).length,
      perfect: Hub.gamify.isPerfect(key),
      night: night,
      naps: naps,
      metrics: metrics,
      soreness: Object.keys(sore).map(function (p) { return { part: p, level: Number(sore[p]) || 0 }; })
                  .filter(function (s) { return s.level > 0; })
                  .sort(function (a, b) { return b.level - a.level; }),
      vitals: (Hub.state.logs.vitals || []).filter(function (v) { return v.date === key; }),
      labs: (Hub.state.logs.labs || []).filter(function (l) { return l.date === key; }),
      vo2max: (Hub.state.logs.vo2max || []).filter(function (v) { return v.date === key; }),
      photos: (Hub.state.logs.photos || []).filter(function (p) { return p.date === key; }),
      mindful: d.mindful || [],
      workouts: Hub.gamify.fitnessDates().has(key)
    };
  }

  /* Days with anything at all on them, newest first — the backing list for
     "browse my history" and for jumping the date navigator somewhere useful. */
  function loggedDays(limit) {
    var C = Hub.gamify.CATEGORIES;
    var keys = Hub.dayKeys().slice().reverse();
    var out = [];
    for (var i = 0; i < keys.length && out.length < (limit || 120); i++) {
      var k = keys[i];
      var n = Object.keys(C).filter(function (c) { return C[c].done(k); }).length;
      out.push({ date: k, doneCount: n, perfect: Hub.gamify.isPerfect(k) });
    }
    return out;
  }

  /* ======================================================================
     5. ADVICE — the workout ↔ recovery linkage
     ----------------------------------------------------------------------
     Rules, not a model. Each returns null or a card; higher priority sorts
     first. Deliberately conservative: nothing here diagnoses anything, and
     every one is phrased as a suggestion you can ignore.
     ====================================================================== */
  var RULES = [
    /* --- long unbroken sitting --- */
    function longSitting() {
      var days = 0, longest = 0;
      for (var i = 1; i <= 7; i++) {
        var d = Hub.day(Hub.shiftDay(Hub.today(), -i));
        if (!d.sitMin) continue;
        var goal = Hub.state.settings.standGoal || 8;
        if (d.sitLongest >= 90 || (d.sitMin >= 240 && d.stand < goal / 2)) days++;
        if (d.sitLongest > longest) longest = d.sitLongest;
      }
      if (days < 3) return null;
      return {
        id: "long-sitting", priority: 8, tone: "warn", icon: "chair",
        title: "Long stretches in the chair",
        body: days + " of the last 7 days had a sitting run of " + Math.round(longest) + "+ minutes with " +
              "few breaks. It's the unbroken length that matters more than the daily total — a minute on " +
              "your feet every 45 undoes most of it.",
        action: { label: "Open desk breaks", view: "desk", pill: ["deskPill", "today"] }
      };
    },

    /* --- a self-check that has drifted --- */
    function selfCheckDue() {
      if (!Hub.reproTabVisible()) return null;
      var keys = [
        { k: "breastExamISO", label: "breast self-check" },
        { k: "testisExamISO", label: "testicular self-check" }
      ];
      var due = keys.filter(function (x) {
        var iso = Hub.state.logs[x.k];
        return iso && Hub.daysBetween(iso, Hub.today()) > 45;
      })[0];
      if (!due) return null;
      var days = Hub.daysBetween(Hub.state.logs[due.k], Hub.today());
      return {
        id: "selfcheck-due", priority: 6, tone: "info", icon: "magnify",
        title: "Monthly " + due.label + " is overdue",
        body: "It's been " + days + " days. It takes a minute, and the whole value of it is doing it " +
              "often enough to know what your normal feels like.",
        action: { label: "Open self-check", view: "repro", pill: ["reproPill", "selfexam"] }
      };
    },

    /* --- sore joints before the next pushing session --- */
    function wristPrep() {
      var sore = sorenessRecent(3);
      var hit = ["wrists", "shoulders"].filter(function (p) { return (sore[p] || 0) >= 2; });
      if (!hit.length) return null;
      return {
        id: "wrist-prep", priority: 10, tone: "warn", icon: "hand",
        title: cap(hit.join(" and ")) + " have been sore",
        body: "You logged soreness there in the last few days. Run the wrist prep routine before " +
              "your next pushing session — cold wrists under load is where most of these start.",
        action: { label: "Open wrist prep", view: "mobility", pill: ["mobilityPill", "routines"] }
      };
    },

    /* --- a body part that keeps flaring up --- */
    function recurringSoreness() {
      var counts = {};
      for (var i = 0; i < 14; i++) {
        var s = Hub.day(Hub.shiftDay(Hub.today(), -i)).soreness || {};
        Object.keys(s).forEach(function (p) {
          if (Number(s[p]) >= 3) counts[p] = (counts[p] || 0) + 1;
        });
      }
      var worst = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
      if (!worst || counts[worst] < 4) return null;
      return {
        id: "recurring-soreness", priority: 9, tone: "warn", icon: "alert",
        title: "Recurring soreness: " + worst,
        body: "Sore at 3+ on " + counts[worst] + " of the last 14 days. A spot that keeps flaring is " +
              "usually a range or a volume problem rather than something to push through. Worth logging " +
              "as a niggle so you can see whether it's trending anywhere.",
        action: { label: "Log a niggle", view: "mobility", pill: ["mobilityPill", "injuries"] }
      };
    },

    /* --- training with no rest --- */
    function needsRest() {
      var streak = 0;
      var fit = Hub.gamify.fitnessDates();
      for (var i = 0; i < 14; i++) {
        var k = Hub.shiftDay(Hub.today(), -i);
        if (fit.has(k) && !Hub.day(k).restDay) streak++;
        else break;
      }
      if (streak < 5) return null;
      return {
        id: "needs-rest", priority: 8, tone: "warn", icon: "snowflake",
        title: streak + " training days in a row",
        body: "No rest day logged in that stretch. Adaptation happens between sessions, not during them — " +
              "a deliberate day off now costs less than the fortnight an overuse injury will.",
        action: { label: "Mark a rest day", view: "mobility", pill: ["mobilityPill", "recovery"] }
      };
    },

    /* --- training hard on short sleep --- */
    function underSlept() {
      var hrs = [], vol = 0;
      for (var i = 0; i < 5; i++) {
        var k = Hub.shiftDay(Hub.today(), -i);
        var h = SERIES.sleepHours.get(k);
        if (h != null) hrs.push(h);
        vol += SERIES.volume.get(k) || 0;
      }
      if (hrs.length < 3 || vol <= 0) return null;
      var avgH = mean(hrs);
      if (avgH >= 7) return null;
      return {
        id: "under-slept", priority: 7, tone: "warn", icon: "moon",
        title: "Averaging " + (Math.round(avgH * 10) / 10) + "h while training",
        body: "Under seven hours across the last few nights, with sessions logged in the same window. " +
              "Sleep is where the training actually gets absorbed — this is the point where more volume " +
              "starts subtracting rather than adding.",
        action: { label: "Sleep hygiene", view: "wellness", pill: ["wellnessPill", "sleep"] }
      };
    },

    /* --- training without any mobility work --- */
    function mobilityGap() {
      var workouts = 0, mob = 0;
      var fit = Hub.gamify.fitnessDates();
      for (var i = 0; i < 7; i++) {
        var k = Hub.shiftDay(Hub.today(), -i);
        if (fit.has(k)) workouts++;
        var d = Hub.day(k);
        if ((d.mobility || 0) + (d.stretch || 0) > 0) mob++;
      }
      if (workouts < 3 || mob >= 2) return null;
      return {
        id: "mobility-gap", priority: 6, tone: "info", icon: "stretchIc",
        title: workouts + " sessions, " + (mob || "no") + " mobility work",
        body: "Strength is climbing faster than range. That gap is what eventually caps progressions " +
              "like pistol squats and handstands — and it's the cheapest thing on this page to fix.",
        action: { label: "Pick a routine", view: "mobility", pill: ["mobilityPill", "routines"] }
      };
    },

    /* --- an active niggle --- */
    function activeInjury() {
      var open = (Hub.state.logs.injuries || []).filter(function (n) { return n.status !== "resolved"; });
      if (!open.length) return null;
      var n = open[0];
      return {
        id: "active-injury", priority: 11, tone: "bad", icon: "alert",
        title: "Open niggle: " + n.area,
        body: "Logged " + Hub.relDay(n.startISO) + (n.note ? " — " + n.note : "") +
              ". Train around it rather than through it, and mark it resolved when it settles.",
        action: { label: "Review niggles", view: "mobility", pill: ["mobilityPill", "injuries"] }
      };
    },

    /* --- nothing logged for a while --- */
    function stale() {
      var fit = Hub.gamify.fitnessDates();
      var last = null;
      for (var i = 0; i < 30; i++) {
        var k = Hub.shiftDay(Hub.today(), -i);
        if (fit.has(k)) { last = i; break; }
      }
      if (last === null || last < 6) return null;
      return {
        id: "stale", priority: 5, tone: "info", icon: "fitness",
        title: "No session in " + last + " days",
        body: "Not a judgement — life happens. The way back in is one short, easy session, not the one " +
              "you were doing before you stopped.",
        action: { label: "Open training", view: "fitness" }
      };
    },

    /* --- caffeine landing too late in the day --- */
    function lateCaffeine() {
      var heavy = 0, nights = [];
      for (var i = 0; i < 7; i++) {
        var k = Hub.shiftDay(Hub.today(), -i);
        var mg = Hub.day(k).caffeineMg || 0;
        if (mg >= 300) heavy++;
        var h = SERIES.sleepHours.get(k);
        if (h != null && mg >= 300) nights.push(h);
      }
      if (heavy < 3) return null;
      var avgH = nights.length >= 2 ? mean(nights) : null;
      return {
        id: "caffeine", priority: 5, tone: "info", icon: "coffee",
        title: heavy + " days over 300mg of caffeine",
        body: "That's roughly three strong coffees. Caffeine's half-life is five to six hours, so an " +
              "afternoon cup still has a quarter of its dose in you at midnight" +
              (avgH != null ? " — you averaged " + (Math.round(avgH * 10) / 10) + "h on those nights." : ".") +
              " Moving the last one earlier is usually easier than cutting the total.",
        action: { label: "Log intake", view: "wellness", pill: ["wellnessPill", "intake"] }
      };
    },

    /* --- drinking close to training --- */
    function alcoholLoad() {
      var units = 0, days = 0;
      for (var i = 0; i < 7; i++) {
        var u = Hub.day(Hub.shiftDay(Hub.today(), -i)).alcoholUnits || 0;
        if (u) { units += u; days++; }
      }
      if (units < 14) return null;
      return {
        id: "alcohol", priority: 6, tone: "warn", icon: "alert",
        title: Math.round(units) + " units across " + days + " " + Hub.plural(days, "day"),
        body: "Above the level most guidance puts a week at. Beyond the general health side, alcohol " +
              "suppresses REM and blunts overnight protein synthesis — so it lands directly on the " +
              "recovery the rest of this app is trying to protect.",
        action: { label: "Log intake", view: "wellness", pill: ["wellnessPill", "intake"] }
      };
    },

    /* --- consistently loud days --- */
    function loudExposure() {
      var total = 0, days = 0;
      for (var i = 0; i < 7; i++) {
        var m = Hub.day(Hub.shiftDay(Hub.today(), -i)).loudMinutes || 0;
        if (m) { total += m; days++; }
      }
      if (days < 3 || total < 420) return null;      // 7h+ of logged loud exposure
      return {
        id: "loud", priority: 4, tone: "warn", icon: "alert",
        title: Math.round(total / 60) + " hours of loud exposure this week",
        body: "Noise damage is cumulative and permanent. Drop the volume a notch, and give your ears " +
              "some genuinely quiet time each day.",
        action: { label: "Hearing", view: "bodycare", pill: ["bodyPill", "hearing"] }
      };
    }
  ];

  function sorenessRecent(days) {
    var out = {};
    for (var i = 0; i < days; i++) {
      var s = Hub.day(Hub.shiftDay(Hub.today(), -i)).soreness || {};
      Object.keys(s).forEach(function (p) {
        out[p] = Math.max(out[p] || 0, Number(s[p]) || 0);
      });
    }
    return out;
  }

  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }

  function advice() {
    invalidate();
    var out = [];
    RULES.forEach(function (rule) {
      var r = null;
      try { r = rule(); } catch (e) { r = null; }
      if (r) out.push(r);
    });
    return out.sort(function (a, b) { return b.priority - a.priority; });
  }

  /* ======================================================================
     PUBLIC
     ====================================================================== */
  Hub.insights = {
    SERIES: SERIES,
    PERIODS: PERIODS,
    MIN_PAIRS: MIN_PAIRS,
    series: series,
    heatmap: heatmap,
    findings: findings,
    multiplicity: multiplicity,
    phrase: phrase,
    review: review,
    dayDetail: dayDetail,
    loggedDays: loggedDays,
    advice: advice,
    pearson: pearson,
    invalidate: invalidate
  };
})();
