/* ============================================================================
   WELLNESS HUB · INSIGHTS
   ----------------------------------------------------------------------------
     trends        multi-metric chart over 30 / 90 / 365 days
     heatmap       a year of done/not-done per category
     patterns      plain-language findings, each with its sample size
     review        this week against last week

   Charts use the Chart.js already vendored for the Fitness tab. Everything
   degrades: with no data you get an explanation of what to log, not an empty
   axis or a divide-by-zero.
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  var PILLS = [
    { id: "trends",   label: "Trends",   icon: "chart" },
    { id: "heatmap",  label: "Heatmap",  icon: "calendar" },
    { id: "patterns", label: "Patterns", icon: "lightbulb" },
    { id: "review",   label: "Review",   icon: "clockIc" },
    { id: "history",  label: "Day by day", icon: "grid" }
  ];

  function currentPill() {
    var p = Hub.uiGet("insightsPill", "trends");
    return PILLS.some(function (x) { return x.id === p; }) ? p : "trends";
  }

  var chart = null;   // the live Chart.js instance, destroyed between renders

  /* ======================================================================
     TRENDS
     ====================================================================== */
  var DEFAULT_METRICS = ["sleepHours", "mood", "energy"];

  function selectedMetrics() {
    var raw = Hub.uiGet("insightMetrics", null);
    var valid = (raw || DEFAULT_METRICS).filter(function (id) { return !!Hub.insights.SERIES[id]; });
    return valid.length ? valid : DEFAULT_METRICS;
  }

  function rangeDays() { return Number(Hub.uiGet("insightRange", 90)) || 90; }

  var trends = {
    render: function () {
      var days = rangeDays();
      var picked = selectedMetrics();

      /* How much of each metric actually exists in the window — a metric with
         two points shouldn't be silently plotted as a straight line. */
      var counts = {};
      Object.keys(Hub.insights.SERIES).forEach(function (id) {
        counts[id] = Hub.insights.series(id, days).filter(function (p) { return p.value != null; }).length;
      });
      var plotted = picked.filter(function (id) { return counts[id] >= 2; });

      return '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head">' +
            '<div class="wh-card__title">' + Hub.icon("chart") + "Metrics over time</div>" +
            '<div class="wh-row" style="gap:4px">' +
              [30, 90, 365].map(function (d) {
                return '<button type="button" class="wh-btn wh-btn--sm ' +
                  (d === days ? "wh-btn--primary" : "wh-btn--ghost") + '" data-range="' + d + '">' +
                  (d === 365 ? "1y" : d + "d") + "</button>";
              }).join("") +
            "</div>" +
          "</div>" +

          '<div class="wh-metricpick">' + Object.keys(Hub.insights.SERIES).map(function (id) {
            var s = Hub.insights.SERIES[id];
            var on = picked.indexOf(id) !== -1;
            var n = counts[id];
            return '<button type="button" class="wh-metricpick__btn' + (on ? " is-on" : "") +
                (n < 2 ? " is-empty" : "") + '" data-metric="' + id + '" ' +
                'style="--wh-m-c:' + s.color + '" aria-pressed="' + on + '" ' +
                'title="' + n + ' data points in this range">' +
              '<span class="wh-metricpick__dot"></span>' + Hub.esc(s.label) +
              '<span class="wh-metricpick__n mono">' + n + "</span></button>";
          }).join("") + "</div>" +

          (plotted.length
            ? '<div class="wh-chartbox"><canvas id="wh-trend-chart"></canvas></div>' +
              '<p class="wh-help wh-mt4">Each metric is drawn on its own scale so they can share one ' +
                "chart — compare the <em>shape</em> of the lines, not their height against each other.</p>"
            : '<div class="wh-empty">' + Hub.icon("chart") + "<strong>Not enough logged yet</strong>" +
              "Pick metrics above that have at least two data points, or widen the range. " +
              "Everything you log feeds this automatically.</div>") +
        "</div>" +

        /* ---------- per-metric summaries ---------- */
        '<div class="wh-grid wh-grid--auto">' + picked.map(function (id) {
          var s = Hub.insights.SERIES[id];
          var pts = Hub.insights.series(id, days).filter(function (p) { return p.value != null; });
          if (!pts.length) return "";
          var vals = pts.map(function (p) { return p.value; });
          var avg = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
          var first = vals[0], last = vals[vals.length - 1];
          var delta = last - first;
          return '<div class="wh-card wh-card--tight">' +
            '<div class="wh-stat__label" style="color:' + s.color + '">' + Hub.esc(s.label) + "</div>" +
            '<div class="wh-stat__value">' + round(avg) + "<small>avg" + s.unit + "</small></div>" +
            '<div class="wh-stat__sub mono">' + pts.length + " logged · " +
              (Math.abs(delta) < 0.05 ? "flat"
                : (delta > 0 ? "▲ " : "▼ ") + round(Math.abs(delta)) + s.unit + " over the range") +
            "</div></div>";
        }).join("") + "</div>";
    },

    wire: function (el) {
      Hub.delegate(el, "[data-range]", function (b) {
        Hub.uiSet("insightRange", Number(b.dataset.range));
        Hub.refresh();
      });
      Hub.delegate(el, "[data-metric]", function (b) {
        var id = b.dataset.metric;
        var picked = selectedMetrics().slice();
        var i = picked.indexOf(id);
        if (i === -1) picked.push(id); else picked.splice(i, 1);
        /* Beyond about five lines the chart stops being readable. */
        if (picked.length > 5) picked = picked.slice(picked.length - 5);
        Hub.uiSet("insightMetrics", picked);
        Hub.refresh();
      });
      drawChart(el);
    }
  };

  function round(n) { return Math.round(n * 10) / 10; }

  /* ---- palette bridge -------------------------------------------------
     Chart.js needs literal colour strings, so it can't be handed a custom
     property. Resolve against the live cascade instead of pinning hexes, or
     the trend chart stays Gruvbox after a theme switch (see js/theme.js). */
  function tok(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      if (v) return v;
    } catch (e) {}
    return fallback;
  }
  /* SERIES stores its colour as `var(--token)` so the same value can drive CSS;
     `chart` is the literal fallback for a token that doesn't resolve. */
  function seriesColour(s) {
    var m = /var\(\s*(--[\w-]+)\s*\)/.exec(s.color || "");
    return (m && tok(m[1], "")) || s.chart;
  }
  /* Chart.js accepts #rrggbbaa, but only if the value really is a six-digit
     hex — a themed token could resolve to anything. */
  function fade(c) { return (c.charAt(0) === "#" && c.length === 7) ? c + "22" : c; }

  function drawChart(el) {
    var canvas = el.querySelector("#wh-trend-chart");
    if (!canvas || !window.Chart) return;

    /* Chart.js keeps a registry per canvas; a stale instance would leak and
       then throw when the canvas is replaced on the next render. */
    if (chart) { try { chart.destroy(); } catch (e) {} chart = null; }
    var prior = window.Chart.getChart && window.Chart.getChart(canvas);
    if (prior) { try { prior.destroy(); } catch (e) {} }

    var days = rangeDays();
    var picked = selectedMetrics();
    var labels = Hub.insights.series(picked[0] || "mood", days).map(function (p) { return p.date; });

    var datasets = picked.map(function (id, i) {
      var s = Hub.insights.SERIES[id];
      var pts = Hub.insights.series(id, days);
      if (pts.filter(function (p) { return p.value != null; }).length < 2) return null;
      return {
        label: s.label,
        data: pts.map(function (p) { return p.value; }),
        borderColor: seriesColour(s),
        backgroundColor: fade(seriesColour(s)),
        yAxisID: "y" + i,
        spanGaps: true,              // a missed day is a gap, not a zero
        tension: 0.3,
        borderWidth: 2,
        pointRadius: days > 120 ? 0 : 2,
        pointHoverRadius: 4,
        fill: false
      };
    }).filter(Boolean);

    var scales = { x: {
      ticks: { color: tok("--fg4", "#a89984"), maxTicksLimit: 8, font: { size: 10 },
               callback: function (v, i) { return (labels[i] || "").slice(5); } },
      grid: { color: "rgba(" + tok("--fg4-rgb", "168,153,132") + ",.08)" }
    } };
    /* Every metric gets its own hidden axis — otherwise sleep hours and
       training volume on one scale flattens everything into a straight line. */
    datasets.forEach(function (d, i) {
      scales["y" + i] = { display: false, position: "left", grace: "10%" };
    });

    try {
      chart = new window.Chart(canvas, {
        type: "line",
        data: { labels: labels, datasets: datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: true, labels: { color: tok("--fg2", "#d5c4a1"), boxWidth: 10, font: { size: 11 } } },
            tooltip: {
              backgroundColor: tok("--bg0", "#282828"), borderColor: tok("--bg2", "#504945"), borderWidth: 1,
              titleColor: tok("--fg0", "#fbf1c7"), bodyColor: tok("--fg2", "#d5c4a1"), padding: 10, displayColors: true
            }
          },
          scales: scales
        }
      });
    } catch (e) {
      console.warn("Wellness Hub: trend chart failed.", e);
    }
  }

  /* ======================================================================
     HEATMAP
     ====================================================================== */
  function heatmapCategory() {
    var k = Hub.uiGet("heatmapCat", "perfect");
    return k;
  }

  var heatmap = {
    render: function () {
      var C = Hub.gamify.CATEGORIES;
      var keys = Object.keys(C);
      var sel = heatmapCategory();

      var days = 364;                       // 52 whole weeks
      var cells;
      if (sel === "perfect") {
        cells = [];
        for (var i = days - 1; i >= 0; i--) {
          var k = Hub.shiftDay(Hub.today(), -i);
          cells.push({ date: k, done: Hub.gamify.isPerfect(k) });
        }
      } else {
        cells = Hub.insights.heatmap(sel, days);
      }

      var doneCount = cells.filter(function (c) { return c.done; }).length;
      var color = sel === "perfect" ? "var(--yellow-bright)" : C[sel].color;

      /* Pad to a whole week so columns line up with weekdays. */
      var lead = Hub.parseYmd(cells[0].date).getDay();
      var padded = [];
      for (var p = 0; p < lead; p++) padded.push(null);
      padded = padded.concat(cells);

      var weeks = [];
      for (var w = 0; w < padded.length; w += 7) weeks.push(padded.slice(w, w + 7));

      return '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head">' +
            '<div class="wh-card__title">' + Hub.icon("calendar") + "A year at a glance</div>" +
            '<span class="wh-chip mono">' + doneCount + " days</span>" +
          "</div>" +

          '<div class="wh-heatpick">' +
            '<button type="button" class="wh-pill' + (sel === "perfect" ? " is-active" : "") + '" ' +
              'data-heatcat="perfect">' + Hub.icon("flame") + "<span>Perfect day</span></button>" +
            keys.map(function (key) {
              return '<button type="button" class="wh-pill' + (key === sel ? " is-active" : "") + '" ' +
                'data-heatcat="' + key + '">' + Hub.icon(C[key].icon) +
                "<span>" + C[key].label + "</span></button>";
            }).join("") +
          "</div>" +

          '<div class="wh-heatwrap"><div class="wh-heat" style="--wh-heat-c:' + color + '">' +
            weeks.map(function (week) {
              return '<div class="wh-heat__col">' + week.map(function (c) {
                if (!c) return '<span class="wh-heat__cell is-pad"></span>';
                return '<button type="button" class="wh-heat__cell' + (c.done ? " is-on" : "") + '" ' +
                  'data-heatday="' + c.date + '" ' +
                  'title="' + Hub.prettyDate(c.date) + (c.done ? " — done" : " — not logged") +
                  ' (open this day)"></button>';
              }).join("") + "</div>";
            }).join("") +
          "</div></div>" +

          '<div class="wh-row wh-row--between wh-mt4">' +
            '<span class="wh-help">' + Hub.prettyDate(cells[0].date) + "</span>" +
            '<span class="wh-help">Each column is a week · click any square to open that day</span>' +
            '<span class="wh-help">' + Hub.prettyDate(cells[cells.length - 1].date) + "</span>" +
          "</div>" +
        "</div>";
    },
    wire: function (el) {
      Hub.delegate(el, "[data-heatcat]", function (b) {
        Hub.uiSet("heatmapCat", b.dataset.heatcat);
        Hub.refresh();
      });
      Hub.delegate(el, "[data-heatday]", function (b) { openDay(b.dataset.heatday); });
    }
  };

  /* ======================================================================
     DAY DETAIL
     ----------------------------------------------------------------------
     The thing the charts were missing: "what actually happened on the 12th?".
     Reachable from the heatmap, the history list, and the trend chart.
     ====================================================================== */
  function openDay(key) {
    if (!key) return;
    var D = Hub.insights.dayDetail(key);
    var d = D.day;

    function row(label, value) {
      return '<div class="wh-row wh-row--between wh-sm" style="padding:5px 0;border-bottom:1px solid var(--bg1)">' +
        "<span>" + label + '</span><span class="mono" style="color:var(--fg0)">' + value + "</span></div>";
    }

    var lines = [];
    if (D.night) {
      lines.push(row("Sleep", (Math.round(D.night.hours * 10) / 10) + " h" +
        (D.night.quality ? " · quality " + D.night.quality + "/5" : "") +
        (D.night.bed ? " · " + Hub.esc(D.night.bed) + "→" + Hub.esc(D.night.wake || "?") : "")));
    }
    if (D.naps.length) {
      lines.push(row("Naps", D.naps.length + " · " +
        Math.round(D.naps.reduce(function (n, e) { return n + (e.hours || 0) * 60; }, 0)) + " min"));
    }
    if (d.mood) {
      lines.push(row("Mood / energy / stress",
        (d.mood.mood || "—") + " / " + (d.mood.energy || "—") + " / " + (d.mood.stress || "—")));
    }
    if (d.water) lines.push(row("Water", d.water + " cups"));
    if (d.caffeineMg) lines.push(row("Caffeine", d.caffeineMg + " mg"));
    if (d.alcoholUnits) lines.push(row("Alcohol", d.alcoholUnits + " units"));
    if (d.screenOff) lines.push(row("Screens off", Hub.esc(d.screenOff)));
    if (D.workouts) lines.push(row("Training", "session logged"));
    if (d.mobility || d.stretch) lines.push(row("Mobility", (d.mobility || 0) + " routines, " + (d.stretch || 0) + " stretches"));
    if (d.restDay) lines.push(row("Rest day", "yes"));
    if (D.mindful.length) {
      lines.push(row("Mindfulness", D.mindful.length + " · " +
        Math.round(D.mindful.reduce(function (n, m) { return n + (m.sec || 0); }, 0) / 60) + " min"));
    }
    if (d.loudMinutes) lines.push(row("Loud exposure", d.loudMinutes + " min"));
    D.vitals.forEach(function (v) {
      var bits = [];
      if (v.sys && v.dia) bits.push(v.sys + "/" + v.dia);
      if (v.hr) bits.push(v.hr + " bpm");
      if (v.weightKg) bits.push(Hub.units.massOut(v.weightKg) + Hub.units.massLabel());
      if (v.spo2) bits.push(v.spo2 + "%");
      if (bits.length) lines.push(row("Vitals" + (v.time ? " · " + Hub.esc(v.time) : ""), bits.join(" · ")));
    });
    D.labs.forEach(function (l) {
      lines.push(row("Labs · " + Hub.esc(l.panel || "panel"), (l.values || []).length + " markers"));
    });
    (D.vo2max || []).forEach(function (v) {
      lines.push(row("VO2 max", v.value + " ml/kg/min"));
    });

    Hub.modal({
      title: Hub.prettyDate(key),
      body:
        '<div class="wh-row wh-row--between wh-mb4">' +
          '<span class="wh-chip' + (D.perfect ? " wh-chip--good" : "") + '">' +
            (D.perfect ? "Perfect day" : D.doneCount + " of " + D.categories.length + " habits") + "</span>" +
          '<span class="wh-help">' + Hub.esc(Hub.relDay(key)) + "</span>" +
        "</div>" +

        '<div class="wh-daydots wh-mb4">' + D.categories.map(function (c) {
          return '<span class="wh-daydot' + (c.done ? " is-on" : "") + '" title="' + Hub.esc(c.label) +
            (c.done ? " — done" : " — not done") + '" style="--wh-dot-c:' + c.color + '">' +
            Hub.icon(c.icon) + "</span>";
        }).join("") + "</div>" +

        (lines.length
          ? '<div class="wh-mb4">' + lines.join("") + "</div>"
          : '<p class="wh-sm wh-faint">Nothing was logged on this day.</p>') +

        (D.soreness.length
          ? '<div class="wh-mt4"><div class="wh-xs wh-faint wh-mb4">Soreness</div>' +
            '<div class="wh-row" style="flex-wrap:wrap;gap:6px">' + D.soreness.map(function (s) {
              return '<span class="wh-chip mono">' + Hub.esc(s.part) + " " + s.level + "/5</span>";
            }).join("") + "</div></div>"
          : "") +

        (d.mood && d.mood.note
          ? '<p class="wh-sm wh-mt4" style="border-left:3px solid var(--wh-accent);padding-left:10px">' +
            Hub.esc(d.mood.note) + "</p>"
          : "") +

        (d.mood && (d.mood.gratitude || []).length
          ? '<div class="wh-mt4"><div class="wh-xs wh-faint">Three good things</div><ul class="wh-sm">' +
            d.mood.gratitude.map(function (g) { return "<li>" + Hub.esc(g) + "</li>"; }).join("") + "</ul></div>"
          : "") +

        (D.photos.length
          ? '<p class="wh-help wh-mt4">' + D.photos.length + " " + Hub.plural(D.photos.length, "photo") +
            " attached — see Body Care or Mobility.</p>"
          : ""),
      actions: [
        { label: "Close", variant: "ghost" },
        { label: "Log for this day", variant: "primary", onClick: function () {
          Hub.setViewDate(key);
          Hub.show("dashboard");
        } }
      ]
    });
  }

  /* ======================================================================
     HISTORY — browse every logged day
     ====================================================================== */
  var history = {
    render: function () {
      var days = Hub.insights.loggedDays(180);
      var total = Hub.gamify.CATEGORIES ? Object.keys(Hub.gamify.CATEGORIES).length : 1;

      if (!days.length) {
        return '<div class="wh-empty">' + Hub.icon("grid") + "<strong>No days logged yet</strong>" +
          "Once you've logged anything, every day shows up here and you can open it, " +
          "or go back and fill one in.</div>";
      }

      return '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head">' +
            '<div class="wh-card__title">' + Hub.icon("grid") + "Every logged day</div>" +
            '<span class="wh-chip mono">' + days.length + " days</span>" +
          "</div>" +
          '<p class="wh-sm wh-muted wh-mb4">Newest first. Open one to see everything on it, ' +
            "or pick <strong>Log for this day</strong> to fill in something you missed.</p>" +
          '<div class="wh-loglist">' + days.map(function (x) {
            return '<button type="button" class="wh-logrow wh-logrow--btn" data-openday="' + x.date + '">' +
              '<span class="wh-logrow__date">' + Hub.prettyDate(x.date) + "</span>" +
              '<span class="wh-grow"><span class="wh-bar" style="max-width:180px">' +
                '<span class="wh-bar__fill" style="width:' + Hub.pct(x.doneCount, total) + "%;background:" +
                (x.perfect ? "var(--yellow-bright)" : "var(--wh-accent)") + '"></span></span></span>' +
              '<span class="mono wh-xs wh-faint">' + x.doneCount + "/" + total + "</span>" +
              (x.perfect ? '<span class="wh-chip wh-chip--good">perfect</span>' : "") +
            "</button>";
          }).join("") + "</div>" +
        "</div>";
    },
    wire: function (el) {
      Hub.delegate(el, "[data-openday]", function (b) { openDay(b.dataset.openday); });
    }
  };

  /* ======================================================================
     PATTERNS
     ====================================================================== */
  var patterns = {
    render: function () {
      var found = Hub.insights.findings(180);
      var mult = Hub.insights.multiplicity(found);

      return '<div class="wh-card wh-card--accent wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("lightbulb") +
            "How to read this</div></div>" +
          '<p class="wh-sm wh-muted">Each card splits your history at the middle value of one metric ' +
            "and compares the other on either side. That's an <strong>association in your own data</strong> — " +
            "not a cause, and not a finding about people in general. Sample sizes here are small and your " +
            "own ratings are subjective, so treat these as hypotheses worth testing, not conclusions.</p>" +
          '<p class="wh-help wh-mt4">Nothing is shown until there are at least ' + Hub.insights.MIN_PAIRS +
            " paired days.</p>" +
        "</div>" +

        /* ---------- the caveat most trackers leave out ---------- */
        (mult.tested
          ? '<div class="wh-card wh-mb4">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("alert") +
              "You are looking at " + mult.tested + " questions at once</div></div>" +
            '<p class="wh-sm wh-muted">This page tested <strong>' + mult.tested + " comparisons</strong> " +
              "against your data and found <strong>" + mult.clear + "</strong> clear and <strong>" +
              mult.slight + "</strong> slight. Ask enough questions of random noise and some will come back " +
              "positive anyway — at these thresholds roughly <strong>" + mult.expectedByChance +
              "</strong> of " + mult.tested + " would be expected to look like signals by luck alone.</p>" +
            (mult.fragile && mult.clear > 0
              ? '<p class="wh-sm wh-mt4" style="color:var(--yellow-bright)">' + Hub.icon("alert") +
                " That's about what chance predicts here, so treat the clear result below as a lead to " +
                "watch over the next month rather than something you've established.</p>"
              : "") +
            (mult.clear > mult.expectedByChance + 1
              ? '<p class="wh-sm wh-mt4" style="color:var(--green-bright)">' + Hub.icon("check") +
                " More clear signals than chance alone would predict — worth taking seriously, though " +
                "still associations rather than causes.</p>"
              : "") +
            '<p class="wh-help wh-mt4">These are not corrected p-values, and this app deliberately ' +
              "doesn't pretend to compute one. It's the order of magnitude that matters: one positive " +
              "out of " + mult.tested + " is not a discovery.</p>" +
          "</div>"
          : "") +

        (found.length
          ? '<div class="wh-stack">' + found.map(function (f) {
              var tone = f.strength === "clear" ? "good" : (f.strength === "slight" ? "warn" : "");
              return '<div class="wh-finding wh-finding--' + f.strength + '">' +
                '<div class="wh-row wh-row--between">' +
                  '<div class="wh-finding__q">' + Hub.esc(f.question) + "</div>" +
                  '<span class="wh-chip' + (tone ? " wh-chip--" + tone : "") + '">' +
                    (f.strength === "clear" ? "clear signal"
                      : f.strength === "slight" ? "slight signal" : "no signal") + "</span>" +
                "</div>" +
                '<p class="wh-finding__body">' + Hub.insights.phrase(f) + "</p>" +
                '<div class="wh-finding__meta mono">' +
                  f.n + " paired days · r = " + (Math.round(f.r * 100) / 100) +
                  (f.lag ? " · next-day effect" : " · same day") +
                "</div>" +
              "</div>";
            }).join("") + "</div>"
          : '<div class="wh-empty">' + Hub.icon("lightbulb") + "<strong>Not enough history yet</strong>" +
            "Patterns need at least " + Hub.insights.MIN_PAIRS + " days where both things were logged. " +
            "Sleep and mood are the fastest pair to build up — log both for a couple of weeks and " +
            "the first cards appear here.</div>") +

        '<div class="wh-disclaimer wh-mt4">' + Hub.icon("alert") +
          "<span>These comparisons cannot separate cause from coincidence, and they don't adjust for " +
          "anything else going on in your life. Don't use them to make a medical decision — use them to " +
          "notice something worth paying attention to.</span></div>";
    },
    wire: function () {}
  };

  /* ======================================================================
     WEEKLY REVIEW
     ====================================================================== */
  function currentPeriod() {
    var p = Hub.uiGet("reviewPeriod", "week");
    return Hub.insights.PERIODS[p] ? p : "week";
  }

  var review = {
    render: function () {
      var periodKey = currentPeriod();
      var r = Hub.insights.review(periodKey);
      var perfectDelta = r.perfect.thisWeek - r.perfect.lastWeek;
      var vsPrev = "vs " + r.prevLabel;

      return '<div class="wh-pills wh-mb4">' +
          Object.keys(Hub.insights.PERIODS).map(function (k) {
            var p = Hub.insights.PERIODS[k];
            return '<button type="button" class="wh-pill' + (k === periodKey ? " is-active" : "") + '" ' +
              'data-period="' + k + '"><span>' + p.label + "</span></button>";
          }).join("") +
        "</div>" +

        '<div class="wh-grid wh-grid--3 wh-mb4">' +
          '<div class="wh-stat"><div class="wh-stat__label">Perfect days</div>' +
            '<div class="wh-stat__value">' + r.perfect.thisWeek + "<small>/" + r.span + "</small></div>" +
            '<div class="wh-stat__sub">' + deltaText(perfectDelta, vsPrev) + "</div></div>" +
          '<div class="wh-stat"><div class="wh-stat__label">Improved</div>' +
            '<div class="wh-stat__value" style="color:var(--green-bright)">' + r.improved.length + "</div>" +
            '<div class="wh-stat__sub">' + Hub.plural(r.improved.length, "category", "categories") + " up</div></div>" +
          '<div class="wh-stat"><div class="wh-stat__label">Slipped</div>' +
            '<div class="wh-stat__value" style="color:' + (r.slipped.length ? "var(--orange-bright)" : "var(--fg0)") + '">' +
              r.slipped.length + "</div>" +
            '<div class="wh-stat__sub">' + Hub.plural(r.slipped.length, "category", "categories") + " down</div></div>" +
        "</div>" +

        /* ---------- per-category, period on period ---------- */
        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("dashboard") +
            "Period on period</div><span class=\"wh-chip\">days completed, out of " + r.span + "</span></div>" +
          '<div class="wh-stack wh-stack--sm">' + r.categories.map(function (c) {
            return '<button type="button" class="wh-weekrow" data-goto="' + c.view + '">' +
              '<span class="wh-weekrow__ic" style="color:' + c.color + '">' + Hub.icon(c.icon) + "</span>" +
              '<span class="wh-weekrow__name">' + Hub.esc(c.label) + "</span>" +
              '<span class="wh-weekrow__bars">' +
                '<span class="wh-weekrow__bar" style="width:' + (c.prevRate * 100) + '%;background:var(--bg3)" ' +
                  'title="' + r.prevLabel + ": " + c.lastWeek + "/" + r.span + '"></span>' +
                '<span class="wh-weekrow__bar" style="width:' + (c.rate * 100) + '%;background:' + c.color + '" ' +
                  'title="now: ' + c.thisWeek + "/" + r.span + '"></span>' +
              "</span>" +
              '<span class="wh-weekrow__num mono">' + c.thisWeek + "/" + r.span + "</span>" +
              '<span class="wh-weekrow__delta mono ' + deltaClass(c.delta) + '">' + deltaShort(c.delta) + "</span>" +
            "</button>";
          }).join("") + "</div>" +
          '<p class="wh-help wh-mt4">The pale bar behind each is ' + r.prevLabel + ", for comparison.</p>" +
        "</div>" +

        /* ---------- averages ---------- */
        (r.metrics.length
          ? '<div class="wh-card wh-mb4">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("chart") + "Averages</div></div>" +
            '<div class="wh-grid wh-grid--auto" style="gap:var(--wh-s3)">' + r.metrics.map(function (m) {
              var s = Hub.insights.SERIES[m.id];
              var d = (m.now != null && m.prev != null) ? m.now - m.prev : null;
              return '<div><div class="wh-stat__label" style="color:' + s.color + '">' + s.label + "</div>" +
                '<div class="mono" style="font-size:19px;color:var(--fg0)">' +
                  (m.now != null ? round(m.now) + s.unit : "—") + "</div>" +
                '<div class="wh-stat__sub mono">' +
                  (d == null ? "no comparison" : deltaText(round(d), vsPrev)) + "</div></div>";
            }).join("") + "</div></div>"
          : "") +

        /* ---------- badges ---------- */
        (r.badges.length
          ? '<div class="wh-card wh-mb4">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("trophy") +
              "Earned in this window</div></div>" +
            '<div class="wh-badgestrip">' + r.badges.map(function (b) {
              return '<div class="wh-badgestrip__item"><div class="wh-badgestrip__emoji">' + b.emoji + "</div>" +
                '<div class="wh-badgestrip__name">' + Hub.esc(b.name) + "</div></div>";
            }).join("") + "</div></div>"
          : "") +

        /* ---------- the honest summary ---------- */
        '<div class="wh-card">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("lightbulb") +
            "In a sentence</div></div>" +
          '<p class="wh-sm wh-muted">' + summary(r) + "</p>" +
        "</div>";
    },
    wire: function (el) {
      Hub.delegate(el, "[data-goto]", function (b) { Hub.show(b.dataset.goto); });
      Hub.delegate(el, "[data-period]", function (b) {
        Hub.uiSet("reviewPeriod", b.dataset.period);
        Hub.refresh();
      });
    }
  };

  function summary(r) {
    var up = r.improved.slice(0, 2).map(function (c) { return c.label.toLowerCase(); });
    var down = r.slipped.slice(0, 2).map(function (c) { return c.label.toLowerCase(); });
    var window_ = r.period === "week" ? "week" : (r.period === "month" ? "month" : "quarter");
    var bits = [];

    var perfectRate = r.perfect.thisWeek / r.span;
    if (perfectRate >= 0.7) bits.push("A strong " + window_ + " — " + r.perfect.thisWeek + " perfect days.");
    else if (r.perfect.thisWeek === 0) bits.push("No perfect days this " + window_ + ".");
    else bits.push(r.perfect.thisWeek + " perfect " + Hub.plural(r.perfect.thisWeek, "day") + " this " + window_ + ".");

    if (up.length) bits.push(up.join(" and ") + " went up.");
    if (down.length) bits.push(down.join(" and ") + " slipped — worth one deliberate day rather than a whole plan.");
    if (!up.length && !down.length) bits.push("Everything held steady against " + r.prevLabel + ".");

    return bits.join(" ");
  }

  function deltaClass(d) { return d > 0 ? "is-up" : (d < 0 ? "is-down" : "is-flat"); }
  function deltaShort(d) { return d > 0 ? "+" + d : (d < 0 ? String(d) : "—"); }
  function deltaText(d, suffix) {
    if (d === 0 || d == null) return "same " + suffix;
    return (d > 0 ? "+" : "") + d + " " + suffix;
  }

  /* ======================================================================
     VIEW
     ====================================================================== */
  var SECTIONS = { trends: trends, heatmap: heatmap, patterns: patterns, review: review, history: history };

  function render(el) {
    var pill = currentPill();

    /* A chart from the previous render is about to have its canvas removed. */
    if (chart) { try { chart.destroy(); } catch (e) {} chart = null; }

    el.innerHTML =
      '<div class="wh-head">' +
        '<div class="wh-head__eyebrow">Insights</div>' +
        "<h1>What the data says</h1>" +
        "<p>Everything you've logged, read back to you — trends, the year at a glance, patterns worth " +
        "testing, an honest scorecard by week, month or quarter, and every day you've logged.</p>" +
      "</div>" +

      advicePanel() +

      '<div class="wh-pills" role="tablist">' + PILLS.map(function (p) {
        return '<button type="button" role="tab" class="wh-pill' + (p.id === pill ? " is-active" : "") + '" ' +
          'data-inspill="' + p.id + '" aria-selected="' + (p.id === pill) + '">' +
          Hub.icon(p.icon) + "<span>" + p.label + "</span></button>";
      }).join("") + "</div>" +

      '<div id="wh-insights-body">' + SECTIONS[pill].render() + "</div>";

    Hub.delegate(el, "[data-inspill]", function (b) {
      Hub.uiSet("insightsPill", b.dataset.inspill);
      Hub.refresh();
    });
    wireAdvice(el);
    SECTIONS[pill].wire(el.querySelector("#wh-insights-body"));
  }

  /* The workout ↔ recovery linkage, shown at the top where it can't be missed. */
  function advicePanel() {
    var list = Hub.insights.advice();
    if (!list.length) {
      return '<div class="wh-card wh-mb4">' +
        '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("check") +
          "Nothing needs your attention</div></div>" +
        '<p class="wh-sm wh-muted">No recovery flags from your recent training and soreness logs. ' +
        "Carry on.</p></div>";
    }
    return '<div class="wh-stack wh-stack--sm wh-mb4">' + list.map(adviceCard).join("") + "</div>";
  }

  function adviceCard(a) {
    return '<div class="wh-advice wh-advice--' + a.tone + '">' +
      '<span class="wh-advice__ic">' + Hub.icon(a.icon) + "</span>" +
      '<div class="wh-grow">' +
        '<div class="wh-advice__title">' + Hub.esc(a.title) + "</div>" +
        '<p class="wh-advice__body">' + Hub.esc(a.body) + "</p>" +
      "</div>" +
      (a.action ? '<button type="button" class="wh-btn wh-btn--sm" data-advice="' + a.id + '">' +
        Hub.esc(a.action.label) + "</button>" : "") +
    "</div>";
  }

  function wireAdvice(root) {
    Hub.delegate(root, "[data-advice]", function (b) {
      var a = Hub.insights.advice().filter(function (x) { return x.id === b.dataset.advice; })[0];
      if (!a || !a.action) return;
      if (a.action.pill) Hub.uiSet(a.action.pill[0], a.action.pill[1]);
      Hub.show(a.action.view);
    });
  }

  /* Reused by the dashboard and the mobility tab. */
  Hub.adviceUI = { panel: advicePanel, card: adviceCard, wire: wireAdvice };

  /* The day-detail modal is useful from anywhere, so it's public. */
  Hub.insightsUI = { openDay: openDay };

  Hub.registerView("insights", render);
})();
