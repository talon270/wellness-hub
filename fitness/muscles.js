/* ============================================================================
   BASALT · MUSCLES  —  engine + the "Muscles" section
   ----------------------------------------------------------------------------
   Answers three questions BASALT could not answer before:
     · which muscle groups did I actually work?
     · which ones have I been neglecting?
     · how much has each one accumulated over all time?

   DERIVED, NEVER STORED
     Every number here is a pure function of App.STATE.sessions, exactly like
     js/gamify.js derives every streak from the logs. Consequences, all good:
     nothing to migrate, nothing to keep in sync, an imported backup is instantly
     correct, deleting a session adjusts history honestly — and existing training
     history retro-fills the moment this file loads.

   THE ONE PIECE OF STATE
     "have I already celebrated this level?" is not derivable. It lives in
     `ironframe.ui` via App.util.uiSet — the same disposable store as
     `today.workout` and `section` — because losing it costs an animation, never
     a number. It is seeded silently on first run, otherwise a user with a year
     of history would open the update to fourteen simultaneous celebrations.

   READ `reps`, NOT `value`
     engine.sessionVolume uses `st.value` because it only ever sees the LIVE
     workout object. What finalizeSession persists is `{reps, weight}`. Deriving
     from history with `.value` yields NaN for every set, silently. See workOf().

   NO WEIGHT MULTIPLIER
     sessionVolume applies x1.5 when weight > 0 — a binary flag, so typing "1"
     in the weight field would buy +50%, and because everything is derived it
     would retroactively re-level all history. This is a volume counter, so it
     counts volume: 12 reps is 12 reps.

   PUBLIC:  window.App.muscles
   ========================================================================== */
(function () {
  "use strict";
  if (!window.App) return;

  var App = window.App;
  var esc = App.util.escapeHtml;

  var GROUPS = window.MUSCLE_GROUPS || [];
  var MAP    = window.MUSCLE_MAP || {};
  var FALL   = window.MUSCLE_FALLBACK || {};
  var RANKS  = window.MUSCLE_RANKS || [];

  var GROUP_BY_KEY = {};
  GROUPS.forEach(function (g) { GROUP_BY_KEY[g.key] = g; });

  /* Contribution weights. Named, adjacent, and the only place they appear. */
  var PRIMARY_SHARE    = 1.00;
  var SECONDARY_SHARE  = 0.40;
  var STABILISER_SHARE = 0.15;

  /* Level curve: cumulative work units required to REACH level L. */
  var CURVE_SCALE = 120;
  var CURVE_POWER = 1.7;
  var MAX_LEVEL   = RANKS.length;   /* 10 */

  var SEEN_KEY = "muscle.seenLevels";

  /* ======================================================================
     1. CURVE
     ==================================================================== */
  function xpForLevel(level) {
    if (level <= 1) return 0;
    return Math.round(CURVE_SCALE * Math.pow(level - 1, CURVE_POWER));
  }

  /* Level from accumulated work. Returns the full picture so no caller has to
     recompute thresholds to draw a bar. */
  function levelInfo(work) {
    var lvl = 1;
    while (lvl < MAX_LEVEL && work >= xpForLevel(lvl + 1)) lvl++;
    var floorXp = xpForLevel(lvl);
    var nextXp  = lvl < MAX_LEVEL ? xpForLevel(lvl + 1) : null;
    var span    = nextXp == null ? 0 : (nextXp - floorXp);
    return {
      level: lvl,
      rank: RANKS[lvl - 1] || "",
      work: work,
      floorXp: floorXp,
      nextXp: nextXp,
      toNext: nextXp == null ? 0 : Math.max(0, nextXp - work),
      pct: nextXp == null ? 100 : (span > 0 ? Math.min(100, Math.round(((work - floorXp) / span) * 100)) : 0),
      maxed: lvl >= MAX_LEVEL
    };
  }

  /* ======================================================================
     2. WORK UNITS
     ==================================================================== */

  /* One set's contribution. Holds convert at 5 s per rep-unit, matching
     sessionVolume's convention (and its rounding). */
  function setWork(set, mode) {
    var v = Number(set && set.reps) || 0;
    if (v <= 0) return 0;                       /* unlogged sets don't count */
    return mode === "hold" ? Math.round(v / 5) : v;
  }

  /* The muscle profile for a logged exercise record. Falls back to the pattern
     if the id is unmapped — and says so once, so gaps surface in development
     instead of silently degrading. */
  var warned = {};
  function profileFor(ex) {
    var p = MAP[ex.key];
    if (p) return p;
    if (ex.key && !warned[ex.key]) {
      warned[ex.key] = true;
      if (window.console) console.warn("BASALT muscles: unmapped exercise id '" + ex.key + "' — using pattern fallback.");
    }
    return FALL[ex.pattern] || null;
  }

  function addWork(out, keys, units, share) {
    (keys || []).forEach(function (k) {
      if (!GROUP_BY_KEY[k]) return;             /* group was cut — ignore */
      out[k] = (out[k] || 0) + units * share;
    });
  }

  /* Work per muscle across a set of session records. */
  function workByMuscle(sessions) {
    var out = {};
    (sessions || []).forEach(function (s) {
      (s.exercises || []).forEach(function (ex) {
        var prof = profileFor(ex);
        if (!prof) return;
        var units = 0;
        (ex.sets || []).forEach(function (st) { units += setWork(st, ex.mode); });
        if (units <= 0) return;
        addWork(out, prof.primary,    units, PRIMARY_SHARE);
        addWork(out, prof.secondary,  units, SECONDARY_SHARE);
        addWork(out, prof.stabiliser, units, STABILISER_SHARE);
      });
    });
    Object.keys(out).forEach(function (k) { out[k] = Math.round(out[k]); });
    return out;
  }

  /* ======================================================================
     3. SESSION SELECTION + MEMOISATION
     Recompute is linear in sets and cheap, but every render asks for it, so
     cache against a signature that changes whenever history changes — the same
     shape as gamify's _fitnessDates cache.
     ==================================================================== */
  function completed(s) {
    return (s.sessions || []).filter(function (x) { return x && x.completed !== false && x.dateISO; });
  }

  var _cache = {};
  var _sig = null;

  function signature(s) {
    var arr = s.sessions || [];
    var last = arr.length ? arr[arr.length - 1] : null;
    return arr.length + "|" + (last ? (last.id || last.dateISO) : "-");
  }

  function cached(s, key, fn) {
    var sig = signature(s);
    if (sig !== _sig) { _cache = {}; _sig = sig; }
    if (!(key in _cache)) _cache[key] = fn();
    return _cache[key];
  }

  function invalidate() { _cache = {}; _sig = null; }

  /* Sessions within the last N days (by day key, so a session logged at 23:50
     and one at 00:10 aren't a day apart by accident). */
  function sessionsWithin(s, days) {
    if (days == null) return completed(s);
    var today = App.lib.dayKey(App.lib.iso());
    return completed(s).filter(function (x) {
      return App.lib.daysBetween(App.lib.dayKey(x.dateISO), today) < days;
    });
  }

  /* ======================================================================
     4. THE VIEW MODEL — one call, everything a row needs
     ==================================================================== */

  /* Heat bucket, measured against the group's own weekly target so a light
     week looks light. Targets come from the default program, so ratio ~1.0
     means "you followed the plan" rather than "you beat an arbitrary number". */
  function bucketFor(ratio, work) {
    if (work <= 0) return "cold";
    if (ratio < 0.5) return "low";
    if (ratio < 1.0) return "on";
    if (ratio < 1.75) return "high";
    return "peak";
  }
  var BUCKET_LABEL = {
    cold: "Not trained",
    low:  "Under target",
    on:   "On target",
    high: "Above target",
    peak: "Well above"
  };

  /* Days since a group was last trained; null if never. */
  function lastTrainedMap(s) {
    return cached(s, "last", function () {
      var out = {};
      var today = App.lib.dayKey(App.lib.iso());
      completed(s).forEach(function (sess) {
        var d = App.lib.daysBetween(App.lib.dayKey(sess.dateISO), today);
        (sess.exercises || []).forEach(function (ex) {
          var prof = profileFor(ex);
          if (!prof) return;
          var units = 0;
          (ex.sets || []).forEach(function (st) { units += setWork(st, ex.mode); });
          if (units <= 0) return;
          /* Every tier counts. Counting only primary+secondary let a group
             report "never trained" in the same row as a non-zero week figure —
             stabiliser work is still work, and the number beside it says so. */
          prof.primary.concat(prof.secondary, prof.stabiliser).forEach(function (k) {
            if (!GROUP_BY_KEY[k]) return;
            if (out[k] == null || d < out[k]) out[k] = d;
          });
        });
      });
      return out;
    });
  }

  function allTimeWork(s) { return cached(s, "all", function () { return workByMuscle(completed(s)); }); }
  function weekWork(s)    { return cached(s, "w7",  function () { return workByMuscle(sessionsWithin(s, 7)); }); }

  /* The full per-group model, sorted by the caller's choice. */
  function model(s, windowDays) {
    var all  = allTimeWork(s);
    var win  = windowDays == null ? all : workByMuscle(sessionsWithin(s, windowDays));
    var week = weekWork(s);
    var last = lastTrainedMap(s);

    return GROUPS.map(function (g) {
      var total   = all[g.key] || 0;
      var inWin   = win[g.key] || 0;
      var w7      = week[g.key] || 0;
      var ratio   = g.weeklyTarget > 0 ? w7 / g.weeklyTarget : 0;
      var info    = levelInfo(total);
      return {
        key: g.key, label: g.label, short: g.short, region: g.region,
        target: g.weeklyTarget,
        work: total, windowWork: inWin, week: w7,
        ratio: ratio, bucket: bucketFor(ratio, w7), bucketLabel: BUCKET_LABEL[bucketFor(ratio, w7)],
        lastDays: last[g.key] == null ? null : last[g.key],
        level: info.level, rank: info.rank, pct: info.pct,
        toNext: info.toNext, nextXp: info.nextXp, maxed: info.maxed
      };
    });
  }

  /* Groups untouched for 7+ days, worst first. Drives the Neglected list. */
  function neglected(s) {
    return model(s, 7).filter(function (r) {
      return r.lastDays == null || r.lastDays >= 7;
    }).sort(function (a, b) {
      var av = a.lastDays == null ? 9999 : a.lastDays;
      var bv = b.lastDays == null ? 9999 : b.lastDays;
      return bv - av;
    });
  }

  /* Which muscles a single session record worked, biggest first. */
  function sessionBreakdown(session) {
    var w = workByMuscle([session]);
    return Object.keys(w).map(function (k) {
      return { key: k, label: (GROUP_BY_KEY[k] || {}).label || k, work: w[k] };
    }).sort(function (a, b) { return b.work - a.work; });
  }

  /* ======================================================================
     5. LEVEL-UP DETECTION
     ==================================================================== */
  function seenLevels() {
    var v = App.util.uiGet(SEEN_KEY, null);
    return (v && typeof v === "object") ? v : null;
  }
  function storeSeen(levels) { App.util.uiSet(SEEN_KEY, levels); }

  function currentLevels(s) {
    var all = allTimeWork(s);
    var out = {};
    GROUPS.forEach(function (g) { out[g.key] = levelInfo(all[g.key] || 0).level; });
    return out;
  }

  /* Returns the groups that rose since last check, and updates the cache.
     On the very first call there is nothing to compare against, so it seeds
     silently and reports nothing — otherwise shipping this would fire a
     celebration for every group at once. */
  function collectLevelUps() {
    var s = App.getState();
    invalidate();
    var now = currentLevels(s);
    var seen = seenLevels();
    if (!seen) { storeSeen(now); return []; }

    var ups = [];
    GROUPS.forEach(function (g) {
      var was = Number(seen[g.key]) || 1;
      if (now[g.key] > was) {
        ups.push({ key: g.key, label: g.label, level: now[g.key], rank: RANKS[now[g.key] - 1] || "" });
      }
    });
    storeSeen(now);
    return ups;
  }

  /* Hook the session finalizer. App.engine is a public object and
     completeSession resolves finalizeSession by property lookup at call time,
     so wrapping it here — at parse time, before any session can be logged —
     is enough. No edit to basalt.js. */
  function hookFinalize() {
    if (!App.engine || App.engine.__musclesHooked) return;
    var original = App.engine.finalizeSession;
    if (typeof original !== "function") return;
    App.engine.finalizeSession = function (workout) {
      var result = original.apply(this, arguments);
      try {
        var ups = collectLevelUps();
        var s = App.getState();
        var last = (s.sessions || [])[s.sessions.length - 1];
        if (last) {
          var parts = sessionBreakdown(last).slice(0, 3).map(function (p) { return p.label.toLowerCase(); });
          if (parts.length) App.toast("Worked " + parts.join(", ") + ".", "info", 4000);
        }
        /* One session can legitimately push several groups over a threshold,
           and a restored backup clears the seen-cache entirely. Fourteen
           stacked toasts is not a celebration, it is a wall — so name the
           three biggest and count the rest. */
        var MAX_TOASTS = 3;
        ups.sort(function (a, b) { return b.level - a.level; });
        ups.slice(0, MAX_TOASTS).forEach(function (u, i) {
          setTimeout(function () {
            App.toast(u.label + " conditioning reached L" + u.level + " — " + u.rank, "success", 5000);
          }, 500 + i * 700);
        });
        if (ups.length > MAX_TOASTS) {
          var rest = ups.length - MAX_TOASTS;
          setTimeout(function () {
            App.toast("+" + rest + " more group" + (rest === 1 ? "" : "s") + " levelled up — see Muscles.", "success", 5000);
          }, 500 + MAX_TOASTS * 700);
        }
      } catch (e) { /* never let a cosmetic layer break a logged session */ }
      return result;
    };
    App.engine.__musclesHooked = true;
  }

  /* ======================================================================
     6. RENDER
     ==================================================================== */
  var WINDOWS = [
    { id: "7",   label: "7 days",   days: 7 },
    { id: "30",  label: "30 days",  days: 30 },
    { id: "all", label: "All time", days: null }
  ];

  function activeWindow() { return App.util.uiGet("muscles.window", "7"); }
  function windowDays() {
    var id = activeWindow();
    var w = WINDOWS.filter(function (x) { return x.id === id; })[0];
    return w ? w.days : 7;
  }

  /* Two different quantities were being drawn in one mark: bar LENGTH is
     progress toward the next level, but bar COLOUR was the week's heat. Same
     bar, two unrelated meanings. Heat now lives only on the dot + status text,
     and the bar is a plain progress bar. */
  function bar(pct, work) {
    /* A group with no work must render an EMPTY bar. Flooring the width at 2%
       to keep small values visible also painted a stub on groups sitting at
       zero, which reads as "a little progress" when the honest answer is none. */
    var w = work === 0 ? 0 : Math.max(2, pct);
    return '<div class="ms-bar" role="presentation">' +
           (w > 0 ? '<span class="ms-bar__fill" style="width:' + w + '%"></span>' : "") +
           '</div>';
  }

  function lastText(days) {
    if (days == null) return "never";
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    return days + "d ago";
  }

  function renderMuscles(el, s) {
    var days = windowDays();
    var rows = model(s, days);
    var totalSessions = completed(s).length;
    var neg = neglected(s);

    /* Ranked by the window's work, because "what am I working" is the question
       this screen exists for — the level column is the long-run answer. */
    var sorted = rows.slice().sort(function (a, b) { return b.windowWork - a.windowWork; });

    var totalWork = rows.reduce(function (n, r) { return n + r.work; }, 0);
    var avgLevel = rows.length
      ? (rows.reduce(function (n, r) { return n + r.level; }, 0) / rows.length)
      : 0;
    var trainedThisWeek = rows.filter(function (r) { return r.week > 0; }).length;

    var head =
      '<div class="page-head">' +
        '<div class="eyebrow">Coverage</div>' +
        '<h1 class="display h2">Muscles</h1>' +
      '</div>';

    if (totalSessions === 0) {
      el.innerHTML = head +
        '<div class="card"><div class="placeholder">' +
          '<svg class="placeholder__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
          '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M4 4h4M16 4h4M12 16v4"/></svg>' +
          '<h4>Nothing logged yet</h4>' +
          '<p class="text-sm">Finish a session in <b>Today</b> and this fills in — every muscle group your work touched, ' +
          'how much each one got, and which ones you have been skipping.</p>' +
          '<div class="row" style="justify-content:center;margin-top:var(--sp-4)">' +
            '<button class="btn btn--primary btn--sm" data-ms-go="today">Go to Today →</button>' +
          '</div>' +
        '</div></div>';
      wire(el);
      return;
    }

    var winLabel = (WINDOWS.filter(function (w) { return w.id === activeWindow(); })[0] || WINDOWS[0]).label;

    var tiles =
      '<div class="grid grid-4 mt-4">' +
        App.util.statTile("Groups trained", trainedThisWeek + "<small>/" + rows.length + "</small>", "in the last 7 days") +
        App.util.statTile("Avg conditioning", "L" + avgLevel.toFixed(1), "across all groups") +
        App.util.statTile("Total work", String(totalWork), "work units, all time") +
        App.util.statTile("Neglected", String(neg.length), neg.length ? "7+ days untouched" : "nothing overdue") +
      '</div>';

    var seg = '<div class="seg ms-seg" id="ms-window">' + WINDOWS.map(function (w) {
      return '<button class="seg__btn' + (w.id === activeWindow() ? " is-active" : "") +
             '" data-ms-window="' + w.id + '" type="button">' + w.label + '</button>';
    }).join("") + '</div>';

    var tableRows = sorted.map(function (r) {
      return '<button class="ms-row" data-ms-detail="' + r.key + '" type="button">' +
          '<span class="ms-row__name">' + esc(r.label) + '</span>' +
          '<span class="ms-row__lvl"><b>L' + r.level + '</b> ' + esc(r.rank) + '</span>' +
          '<span class="ms-row__bar">' + bar(r.pct, r.work) +
            '<span class="ms-row__units mono">' + r.work + ' units</span></span>' +
          '<span class="ms-row__win mono">' + r.windowWork + '</span>' +
          '<span class="ms-row__heat"><span class="ms-dot ms-dot--' + r.bucket + '"></span>' + r.bucketLabel + '</span>' +
          '<span class="ms-row__last mono">' + lastText(r.lastDays) + '</span>' +
        '</button>';
    }).join("");

    var table =
      '<div class="card mt-4 stack">' +
        '<div class="card__head">' +
          '<div class="card__title">Every group</div>' + seg +
        '</div>' +
        '<div class="ms-table">' +
          '<div class="ms-row ms-row--head">' +
            '<span>Group</span><span>Conditioning</span><span>Progress</span>' +
            '<span class="ms-row__win">' + esc(winLabel) + '</span>' +
            '<span>Vs. target</span><span>Last</span>' +
          '</div>' +
          tableRows +
        '</div>' +
        '<p class="faint text-xs">Conditioning is accumulated training volume, not a strength measurement — ' +
        'the work-unit count next to each level is the whole of it. A rep is one unit; five seconds of a hold is one unit. ' +
        'Levels never decay; "this week" is what tells you whether something has gone cold.</p>' +
      '</div>';

    var negCard = "";
    if (neg.length) {
      negCard =
        '<div class="card mt-4 stack">' +
          '<div class="card__head"><div class="card__title">Neglected</div>' +
            '<span class="badge">' + neg.length + ' group' + (neg.length === 1 ? "" : "s") + '</span></div>' +
          '<p class="muted text-sm">Nothing here for a week or more. Each one lists the movements that would fix it.</p>' +
          '<div class="ms-neg">' + neg.map(function (r) {
            return '<button class="ms-neg__item" data-ms-detail="' + r.key + '" type="button">' +
              '<span class="ms-neg__name">' + esc(r.label) + '</span>' +
              '<span class="ms-neg__meta mono">' + lastText(r.lastDays) + '</span>' +
              '<span class="ms-neg__go">Show movements →</span>' +
            '</button>';
          }).join("") + '</div>' +
        '</div>';
    }

    el.innerHTML = head + tiles + table + negCard;
    wire(el);
  }

  /* --- detail modal: what trains this group, and where it stands ---------- */
  function openDetail(key) {
    var g = GROUP_BY_KEY[key];
    if (!g) return;
    var s = App.getState();
    var row = model(s, windowDays()).filter(function (r) { return r.key === key; })[0];
    if (!row) return;

    /* Movements that train it, primary first, then by ladder level. */
    var DB = window.EXERCISE_DB || {};
    var hits = Object.keys(DB).map(function (id) {
      var prof = MAP[id] || FALL[(DB[id] || {}).pattern];
      if (!prof) return null;
      var role = prof.primary.indexOf(key) >= 0 ? 0
               : prof.secondary.indexOf(key) >= 0 ? 1
               : prof.stabiliser.indexOf(key) >= 0 ? 2 : -1;
      if (role < 0) return null;
      return { ex: DB[id], role: role };
    }).filter(Boolean).sort(function (a, b) {
      if (a.role !== b.role) return a.role - b.role;
      return (a.ex.level || 99) - (b.ex.level || 99);
    });

    var ROLE = ["Primary", "Secondary", "Stabiliser"];
    var list = hits.slice(0, 14).map(function (h) {
      return '<li class="ms-ex"><span class="ms-ex__name">' + esc(h.ex.name) + '</span>' +
             '<span class="ms-ex__role ms-ex__role--' + h.role + '">' + ROLE[h.role] + '</span></li>';
    }).join("");

    var progress = row.maxed
      ? '<p class="muted text-sm">Maxed at L' + row.level + ' — ' + esc(row.rank) + '.</p>'
      : '<p class="muted text-sm"><b>' + row.toNext + '</b> more work units to L' + (row.level + 1) +
        ' — ' + esc(RANKS[row.level] || "") + '.</p>';

    var body =
      '<div class="ms-detail">' +
        '<div class="ms-detail__lvl">' +
          '<div class="ms-detail__num">L' + row.level + '</div>' +
          '<div><div class="ms-detail__rank">' + esc(row.rank) + '</div>' +
          '<div class="faint text-xs mono">' + row.work + ' work units total</div></div>' +
        '</div>' +
        bar(row.pct, row.work) +
        progress +
        '<div class="ms-detail__grid">' +
          '<div><div class="ms-detail__k">This week</div><div class="ms-detail__v mono">' + row.week + '</div></div>' +
          '<div><div class="ms-detail__k">Weekly target</div><div class="ms-detail__v mono">' + row.target + '</div></div>' +
          '<div><div class="ms-detail__k">Status</div><div class="ms-detail__v">' + row.bucketLabel + '</div></div>' +
          '<div><div class="ms-detail__k">Last trained</div><div class="ms-detail__v mono">' + lastText(row.lastDays) + '</div></div>' +
        '</div>' +
        '<div class="ms-detail__k mt-3">Movements that train it</div>' +
        '<ul class="ms-exlist">' + list + '</ul>' +
        (hits.length > 14 ? '<p class="faint text-xs">+ ' + (hits.length - 14) + ' more in the exercise library.</p>' : "") +
      '</div>';

    if (window.Hub && Hub.modal) {
      Hub.modal({ title: g.label, body: body, actions: [{ label: "Close" }] });
    }
  }

  function wire(el) {
    el.querySelectorAll("[data-ms-window]").forEach(function (b) {
      b.addEventListener("click", function () {
        App.util.uiSet("muscles.window", b.dataset.msWindow);
        App.refresh();
      });
    });
    el.querySelectorAll("[data-ms-detail]").forEach(function (b) {
      b.addEventListener("click", function () { openDetail(b.dataset.msDetail); });
    });
    el.querySelectorAll("[data-ms-go]").forEach(function (b) {
      b.addEventListener("click", function () { App.showSection(b.dataset.msGo); });
    });
  }

  /* ======================================================================
     6b. THE TODAY STRIP — "what does today work?"
     ----------------------------------------------------------------------
     Shown at the top of the Today tab, in both of its states:

       · session in progress — the real exercises, with how much of each
         muscle's planned work you have actually logged
       · ready screen        — what the selected focus would hit

     SHARES, NOT UNITS. The strip answers "where is this session's work
     going", so it shows each muscle's share of the session. That is also
     what makes it immune to set counts, volume mode and rep targets — the
     three things the ready screen changes under you without a re-render.

     WHY IT IS BOLTED ON THE WAY IT IS
     renderActive/renderToday are private to Part 3's IIFE and do a wholesale
     `el.innerHTML =`, and App.registerView only overwrites — it hands back no
     reference to what was registered. So registerView is wrapped at PARSE
     time (this file runs after basalt.js parses but before DOMContentLoaded,
     and Part 3 registers inside its DOMContentLoaded handler), which catches
     `today` on its way in. No edit to basalt.js.
     ==================================================================== */

  /* Live workout sets are {value, weight}; persisted sets are {reps, weight}.
     This is the live side of that boundary. */
  function liveUnits(ex) {
    var n = 0;
    (ex.sets || []).forEach(function (st) {
      var v = Number(st && st.value) || 0;
      if (v > 0) n += (ex.mode === "hold" ? Math.round(v / 5) : v);
    });
    return n;
  }
  function plannedUnits(ex) {
    var t = Number(ex.target) || 0;
    var sets = (ex.sets || []).length || 3;
    return (ex.mode === "hold" ? Math.round(t / 5) : t) * sets;
  }

  /* Accumulate a {planned, logged} pair per muscle from live workout exercises. */
  function stripDataFrom(exercises, withLogged) {
    var planned = {}, logged = {};
    (exercises || []).forEach(function (ex) {
      var prof = MAP[ex.id] || FALL[ex.pattern];
      if (!prof) return;
      var p = plannedUnits(ex);
      var l = withLogged ? liveUnits(ex) : 0;
      addWork(planned, prof.primary,    p, PRIMARY_SHARE);
      addWork(planned, prof.secondary,  p, SECONDARY_SHARE);
      addWork(planned, prof.stabiliser, p, STABILISER_SHARE);
      if (withLogged && l > 0) {
        addWork(logged, prof.primary,    l, PRIMARY_SHARE);
        addWork(logged, prof.secondary,  l, SECONDARY_SHARE);
        addWork(logged, prof.stabiliser, l, STABILISER_SHARE);
      }
    });
    return { planned: planned, logged: logged };
  }

  /* The exercises the ready screen would build for a day type. Uses the
     engine's own movement chooser so it tracks the user's tier levels. A
     per-session swap made in the preview isn't visible from out here, so the
     strip stays at the pattern's default — right for a preview, and it
     re-renders the moment a session actually starts. */
  function previewExercises(dayType) {
    var s = App.getState();
    var pats = (App.engine.DAY_PATTERNS || {})[dayType] || [];
    return pats.map(function (p) {
      var mv = App.engine.movementFor ? App.engine.movementFor(p) : null;
      var tier = (s.tiers || {})[p] || {};
      return {
        id: mv ? mv.id : null,
        pattern: p,
        mode: mv ? mv.mode : "reps",
        target: tier.repsTarget || 10,
        sets: [0, 0, 0]
      };
    });
  }

  function stripHtml(data, opts) {
    var planned = data.planned, logged = data.logged;
    var total = 0;
    Object.keys(planned).forEach(function (k) { total += planned[k]; });
    if (total <= 0) return "";

    var rows = Object.keys(planned).map(function (k) {
      var g = GROUP_BY_KEY[k];
      return {
        key: k,
        label: g ? g.label : k,
        share: planned[k] / total,
        done: planned[k] > 0 ? Math.min(1, (logged[k] || 0) / planned[k]) : 0
      };
    }).sort(function (a, b) { return b.share - a.share; });

    var top = rows.slice(0, 8);
    var maxShare = top[0].share || 1;

    var lead = top.slice(0, 3).map(function (r) { return r.label.toLowerCase(); }).join(", ");

    /* With a session started but no sets in yet, every bar is at its planned
       width and none is filled — which reads as "already done" unless the
       caption says otherwise. */
    var anyLogged = false;
    Object.keys(logged).forEach(function (k) { if (logged[k] > 0) anyLogged = true; });
    var note = !opts.live ? "."
      : anyLogged ? " — solid fill is what you have logged so far."
                  : " — nothing logged yet; bars are the planned split.";

    return '<div class="card mt-4 ms-strip">' +
      '<div class="card__head">' +
        '<div class="card__title">What today works</div>' +
        '<span class="badge">' + (opts.live ? "live" : "planned") + '</span>' +
      '</div>' +
      '<p class="muted text-sm ms-strip__lead">Mostly <b>' + esc(lead) + '</b>' + note + '</p>' +
      '<div class="ms-strip__rows">' +
        top.map(function (r) {
          var w = Math.max(4, Math.round((r.share / maxShare) * 100));
          return '<div class="ms-strip__row">' +
            '<span class="ms-strip__name">' + esc(r.label) + '</span>' +
            '<span class="ms-strip__track"><span class="ms-strip__plan" style="width:' + w + '%">' +
              (opts.live ? '<span class="ms-strip__done" style="width:' + Math.round(r.done * 100) + '%"></span>' : "") +
            '</span></span>' +
            '<span class="ms-strip__pct mono">' + Math.round(r.share * 100) + '%</span>' +
          '</div>';
        }).join("") +
      '</div>' +
      (rows.length > 8 ? '<p class="faint text-xs">+ ' + (rows.length - 8) + ' more getting a smaller share.</p>' : "") +
    '</div>';
  }

  /* Which focus is selected on the ready screen. Read from the DOM because
     that selection lives in a closure and changes without a view re-render. */
  function selectedDay() {
    var btn = document.querySelector("#day-seg .seg__btn.is-active");
    return btn ? btn.dataset.day : null;
  }

  function buildStrip() {
    var w = App.util.uiGet("today.workout", null);
    if (w && w.dayType && w.exercises) {
      return stripHtml(stripDataFrom(w.exercises, true), { live: true });
    }
    var day = selectedDay();
    if (!day) return "";
    return stripHtml(stripDataFrom(previewExercises(day), false), { live: false });
  }

  function injectStrip(el) {
    var existing = el.querySelector(".ms-strip");
    if (existing) existing.remove();
    var html = buildStrip();
    if (!html) return;
    var host = document.createElement("div");
    host.innerHTML = html;
    var node = host.firstChild;
    var headEl = el.querySelector(".page-head");
    if (headEl && headEl.nextSibling) headEl.parentNode.insertBefore(node, headEl.nextSibling);
    else el.insertBefore(node, el.firstChild);
  }

  /* The ready screen re-renders #today-preview in place when the focus or the
     volume mode changes — no view re-render, so nothing would tell us to
     update. Watch that subtree instead. */
  var previewObserver = null;
  function watchPreview(el) {
    if (previewObserver) { previewObserver.disconnect(); previewObserver = null; }
    var preview = el.querySelector("#today-preview");
    if (!preview || !window.MutationObserver) return;
    var pending = false;
    previewObserver = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      /* The mutation that triggers us is inside #today-preview; injecting
         outside it can't re-enter, but debounce anyway so a burst of DOM
         writes costs one rebuild. */
      setTimeout(function () { pending = false; injectStrip(el); }, 0);
    });
    previewObserver.observe(preview, { childList: true, subtree: true });
  }

  /* Wrap registerView at parse time so Part 3's `today` renderer is captured
     as it registers. */
  (function wrapRegisterView() {
    var originalRegister = App.registerView;
    App.registerView = function (name, fn) {
      if (name === "today" && typeof fn === "function") {
        var inner = fn;
        fn = function (el, s) {
          inner(el, s);
          try { injectStrip(el); watchPreview(el); }
          catch (e) { if (window.console) console.warn("BASALT muscles: Today strip failed.", e); }
        };
      }
      return originalRegister.call(App, name, fn);
    };
  })();

  /* ======================================================================
     7. PUBLIC API — consumed by js/gamify.js badges and anything else
     ==================================================================== */
  App.muscles = {
    GROUPS: GROUPS,
    RANKS: RANKS,
    xpForLevel: xpForLevel,
    levelInfo: levelInfo,
    workByMuscle: workByMuscle,
    sessionBreakdown: sessionBreakdown,
    invalidate: invalidate,

    /* Full per-group model. `days` null = all time. */
    model: function (days) { return model(App.getState(), days === undefined ? 7 : days); },
    neglected: function () { return neglected(App.getState()); },

    /* key -> level, for badge tests. */
    levels: function () { return currentLevels(App.getState()); },

    /* Level of the median group — the balance-aware summary. Keying badges on
       "any group" just rewards whichever group the program hits hardest. */
    medianLevel: function () {
      var lv = currentLevels(App.getState());
      var arr = GROUPS.map(function (g) { return lv[g.key] || 1; }).sort(function (a, b) { return a - b; });
      if (!arr.length) return 1;
      var mid = Math.floor(arr.length / 2);
      return arr.length % 2 ? arr[mid] : Math.floor((arr[mid - 1] + arr[mid]) / 2);
    },

    /* Groups at or above a level — for "Balanced Build". */
    countAtLeast: function (level) {
      var lv = currentLevels(App.getState());
      return GROUPS.filter(function (g) { return (lv[g.key] || 1) >= level; }).length;
    },

    /* Groups trained at least once in the last 7 days. */
    trainedThisWeek: function () {
      var w = weekWork(App.getState());
      return GROUPS.filter(function (g) { return (w[g.key] || 0) > 0; }).length;
    }
  };

  /* ======================================================================
     8. MOUNT
     The nav entry is pushed at PARSE TIME, not on DOMContentLoaded: the core's
     own handler (registered while basalt.js parsed, i.e. before this file) is
     what calls bootstrap() -> buildNav(), and it reads the live SECTIONS array.
     Registering the view can wait for DOMContentLoaded — registerView re-renders
     if its section is already on screen.
     ==================================================================== */
  if (App.SECTIONS && !App.SECTIONS.some(function (x) { return x.id === "muscles"; })) {
    App.ICONS.muscle = '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M4 4h4M16 4h4"/><path d="M12 16v4M9 20h6"/>';
    /* After Skills, before Running — it belongs with the training content. */
    var at = App.SECTIONS.map(function (x) { return x.id; }).indexOf("skills");
    App.SECTIONS.splice(at >= 0 ? at + 1 : App.SECTIONS.length, 0,
      { id: "muscles", label: "Muscles", icon: "muscle" });
  }

  function mount() {
    App.registerView("muscles", renderMuscles);
    hookFinalize();
    /* Seed the celebration cache on first ever load so an existing user's
       backlog of levels doesn't all fire at once. */
    if (!seenLevels()) { try { storeSeen(currentLevels(App.getState())); } catch (e) {} }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

})();
