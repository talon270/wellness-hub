/* ============================================================================
   WELLNESS HUB · REPRODUCTIVE HEALTH
   ----------------------------------------------------------------------------
   The area the rest of the app kept needing and didn't have. Four sections
   behind pills, and which of them appear depends on the profile:

     cycle          periods, flow, symptoms, phase estimates, predictions
     selfexam       the monthly self-check — breast or testicular
     screening      the age-related screenings, and what's actually due
     contraception  method, the daily pill tick, and its own reminder

   WHY IT'S A TAB. Cycle phase is the single biggest missing variable in an app
   that correlates sleep, mood, energy and training capacity — it moves all
   four. It lived as a hidden pill inside Wellness, which meant nobody who
   needed it ever found it. Its maths (`Hub.cycle`) is unchanged and still
   feeds the Insights patterns.

   WHAT THIS IS NOT. It is not contraception, not a fertility method, and not a
   diagnosis. Predictions are arithmetic over your own past cycles and the
   screening intervals are general population guidance that varies by country.
   Every panel here says so where it matters rather than in one buried footer.
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  /* Which defaults the self-exam and screening panels should start from.
     Null ("prefer not to say") and "other" both mean the same thing here: the
     panels offer everything rather than guessing, which is the right answer
     whenever the app doesn't know and the wrong one to guess at. */
  function gender() {
    var p = Hub.state.settings.profile || {};
    var g = p.gender;
    return (g === "female" || g === "male") ? g : null;
  }
  function age() {
    var y = Number((Hub.state.settings.profile || {}).birthYear);
    if (!y) return null;
    return new Date().getFullYear() - y;
  }

  var PILLS = [
    { id: "cycle", label: "Cycle", icon: "cycleIc",
      shown: function () { return gender() !== "male" || Hub.state.settings.cycleTracking; } },
    { id: "selfexam", label: "Self-exam", icon: "magnify" },
    { id: "screening", label: "Screening", icon: "calendar" },
    { id: "contraception", label: "Contraception", icon: "pill",
      shown: function () { return gender() !== "male"; } }
  ];

  function visiblePills() {
    return PILLS.filter(function (p) { return !p.shown || p.shown(); });
  }

  function currentPill() {
    var p = Hub.uiGet("reproPill", "");
    var vis = visiblePills();
    if (vis.some(function (x) { return x.id === p; })) return p;
    return vis.length ? vis[0].id : "selfexam";
  }

  /* ======================================================================
     1. CYCLE MATHS
     ----------------------------------------------------------------------
     Exposed on Hub so the insights engine can read cycle day without knowing
     anything about this view. Moved here verbatim from wellness.js.
     ====================================================================== */
  var cycleApi = {
    sorted: function () {
      return (Hub.state.logs.cycles || []).slice().sort(function (a, b) {
        return a.startISO < b.startISO ? -1 : 1;
      });
    },

    /* The period a date falls in or after — i.e. which cycle it belongs to. */
    currentAt: function (dateKey) {
      var list = cycleApi.sorted();
      var found = null;
      list.forEach(function (c) {
        if (c.startISO <= dateKey) found = c;
      });
      return found;
    },

    /* Day 1 is the first day of bleeding. Returns null before the first
       logged period, or if the gap is implausibly long (a missed log). */
    dayOf: function (dateKey) {
      var c = cycleApi.currentAt(dateKey);
      if (!c) return null;
      var n = Hub.daysBetween(c.startISO, dateKey) + 1;
      return n >= 1 && n <= 60 ? n : null;
    },

    /* Observed cycle lengths, most recent last. */
    lengths: function () {
      var list = cycleApi.sorted();
      var out = [];
      for (var i = 1; i < list.length; i++) {
        var n = Hub.daysBetween(list[i - 1].startISO, list[i].startISO);
        if (n >= 15 && n <= 60) out.push(n);      // implausible gaps are missed logs
      }
      return out;
    },

    stats: function () {
      var lens = cycleApi.lengths();
      if (!lens.length) {
        return { avg: Number(Hub.state.settings.cycleAvgLength) || 28, n: 0, min: null, max: null, spread: null };
      }
      var recent = lens.slice(-6);
      var avg = recent.reduce(function (a, b) { return a + b; }, 0) / recent.length;
      return {
        avg: Math.round(avg),
        n: recent.length,
        min: Math.min.apply(null, recent),
        max: Math.max.apply(null, recent),
        spread: Math.max.apply(null, recent) - Math.min.apply(null, recent)
      };
    },

    /* Next expected start, with an honest window rather than a false point. */
    prediction: function () {
      var list = cycleApi.sorted();
      if (!list.length) return null;
      var last = list[list.length - 1];
      var s = cycleApi.stats();
      var due = Hub.shiftDay(last.startISO, s.avg);
      var slack = s.spread != null ? Math.max(1, Math.ceil(s.spread / 2)) : 4;
      return {
        dueISO: due,
        from: Hub.shiftDay(due, -slack),
        to: Hub.shiftDay(due, slack),
        inDays: Hub.daysBetween(Hub.today(), due),
        confident: s.n >= 3 && (s.spread == null || s.spread <= 5),
        stats: s
      };
    },

    /* Rough phase, named honestly as an estimate. */
    phaseAt: function (dateKey) {
      var day = cycleApi.dayOf(dateKey);
      if (!day) return null;
      var c = cycleApi.currentAt(dateKey);
      var bleedDays = c && c.endISO ? Hub.daysBetween(c.startISO, c.endISO) + 1 : 5;
      var s = cycleApi.stats();
      var ovulation = s.avg - 14;               // luteal phase is the stable one
      if (day <= bleedDays) return { key: "menstrual", label: "Period", day: day };
      if (day < ovulation - 1) return { key: "follicular", label: "Follicular", day: day };
      if (day <= ovulation + 1) return { key: "ovulation", label: "Around ovulation", day: day };
      return { key: "luteal", label: "Luteal", day: day };
    }
  };
  Hub.cycle = cycleApi;

  /* ======================================================================
     2. CYCLE
     ====================================================================== */
  var CYCLE_SYMPTOMS = [
    { key: "cramps", label: "Cramps" },
    { key: "headache", label: "Headache" },
    { key: "bloating", label: "Bloating" },
    { key: "tender", label: "Breast tenderness" },
    { key: "lowmood", label: "Low mood" },
    { key: "irritable", label: "Irritable" },
    { key: "cravings", label: "Cravings" },
    { key: "insomnia", label: "Poor sleep" },
    { key: "acne", label: "Skin flare" },
    { key: "backache", label: "Back ache" },
    { key: "nausea", label: "Nausea" },
    { key: "dizzy", label: "Light-headed" }
  ];

  var FLOWS = [
    { key: "spotting", label: "Spotting" },
    { key: "light", label: "Light" },
    { key: "medium", label: "Medium" },
    { key: "heavy", label: "Heavy" }
  ];

  /* What each phase tends to mean for the things this app already tracks.
     Written as tendencies, because the between-person variation is larger than
     the effect — the Insights tab is what tells you whether YOURS does this. */
  var PHASE_NOTES = {
    menstrual: {
      expect: "Energy is often lowest on days 1–2 and recovers quickly after. Iron losses are real if " +
              "your flow is heavy.",
      training: "Train if you want to — there's no good evidence that resting is required. Lower the " +
                "volume rather than skipping, and let how you feel on the day decide.",
      care: "Heat helps cramps as much as most over-the-counter options. Keep the water up: it blunts " +
            "the headaches that come with it."
    },
    follicular: {
      expect: "Rising oestrogen. This is where most people report the best energy, mood and appetite for " +
              "hard sessions.",
      training: "The window to push. Personal bests, new progressions, heavier or longer work.",
      care: "Good time to start anything that needs momentum — a new routine, a harder habit."
    },
    ovulation: {
      expect: "A short window around mid-cycle. Some people notice a temperature bump, changes in " +
              "discharge, or one-sided twinges.",
      training: "Still a strong window. A minority notice joint laxity around here; if you're one of " +
                "them, be deliberate about warming up.",
      care: "If you're tracking this for conception or avoidance, calendar maths alone is not the tool — " +
            "see the note at the bottom of this page."
    },
    luteal: {
      expect: "Progesterone rises, then falls if there's no pregnancy. Sleep is often lighter, resting " +
              "heart rate a little higher, appetite up, and PMS symptoms cluster in the last few days.",
      training: "Perceived effort tends to rise for the same work. Judge sessions by effort, not by the " +
                "number on the plan.",
      care: "Sleep and food carry more weight here than usual. Cutting caffeine late in the day helps " +
            "the sleep fragmentation this phase brings."
    }
  };

  var cycle = {
    render: function () {
      if (!Hub.state.settings.cycleTracking) {
        return '<div class="wh-card wh-card--accent">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("cycleIc") + "Cycle tracking</div></div>" +
          '<p class="wh-sm wh-muted">Off until you switch it on. Switched on, this logs periods, flow and ' +
            "symptoms, estimates where you are in your cycle, and — the actually useful part — feeds cycle " +
            "day into the Insights patterns, so you can see how your energy, sleep, mood and soreness " +
            "move with it.</p>" +
          '<p class="wh-sm wh-muted wh-mt4">Everything stays in this browser, like the rest of the app. ' +
            "Nothing is sent anywhere and there is no account.</p>" +
          '<button type="button" class="wh-btn wh-btn--primary wh-mt4" id="cy-enable">' +
            Hub.icon("check") + "Turn on cycle tracking</button>" +
          '<p class="wh-help wh-mt4">You can switch it off again in Settings at any time; your entries ' +
            "are kept unless you delete them.</p>" +
        "</div>";
      }

      var list = cycleApi.sorted().slice().reverse();
      var s = cycleApi.stats();
      var pred = cycleApi.prediction();
      var todayKey = Hub.viewDate();
      var phase = cycleApi.phaseAt(todayKey);
      var today = Hub.day(todayKey).cycle || {};
      var open = list.filter(function (c) { return !c.endISO; })[0];

      /* Symptom frequency by cycle day, over the last few cycles — the thing
         you can't see from a calendar. */
      var byDay = {};
      Hub.dayKeys().forEach(function (k) {
        var day = cycleApi.dayOf(k);
        if (!day) return;
        var syms = Object.keys((Hub.day(k).cycle || {}).symptoms || {});
        if (!syms.length) return;
        byDay[day] = (byDay[day] || 0) + syms.length;
      });

      var note = phase ? PHASE_NOTES[phase.key] : null;

      return '<div class="wh-grid wh-grid--3 wh-mb4">' +
          '<div class="wh-stat"><div class="wh-stat__label">Cycle day</div>' +
            '<div class="wh-stat__value">' + (phase ? phase.day : "—") + "</div>" +
            '<div class="wh-stat__sub">' + (phase ? Hub.esc(phase.label) + " (estimated)" : "log a period to start") + "</div></div>" +
          '<div class="wh-stat"><div class="wh-stat__label">Average length</div>' +
            '<div class="wh-stat__value">' + s.avg + "<small>d</small></div>" +
            '<div class="wh-stat__sub">' + (s.n ? "from " + s.n + " " + Hub.plural(s.n, "cycle") +
              (s.spread != null ? " · varies by " + s.spread + "d" : "") : "assumed — log two periods") + "</div></div>" +
          '<div class="wh-stat"><div class="wh-stat__label">Next expected</div>' +
            '<div class="wh-stat__value" style="font-size:20px">' +
              (pred ? (pred.inDays >= 0 ? "in " + pred.inDays + "d" : Math.abs(pred.inDays) + "d late") : "—") + "</div>" +
            '<div class="wh-stat__sub">' + (pred ? Hub.prettyDate(pred.from) + " – " + Hub.prettyDate(pred.to) : "no data") + "</div></div>" +
        "</div>" +

        /* ---------- log ---------- */
        '<div class="wh-card wh-card--accent wh-mb4">' +
          '<div class="wh-card__head">' +
            '<div class="wh-card__title">' + Hub.icon("drop") + "Today" +
              (Hub.isBackfilling() ? " · " + Hub.prettyDate(todayKey) : "") + "</div>" +
            (open ? '<span class="wh-chip wh-chip--accent">period in progress</span>' : "") +
          "</div>" +

          '<div class="wh-row wh-mb4">' +
            (open
              ? '<button type="button" class="wh-btn wh-btn--primary" id="cy-end">' + Hub.icon("check") +
                "Period ended" + (Hub.isBackfilling() ? " on this day" : " today") + "</button>"
              : '<button type="button" class="wh-btn wh-btn--primary" id="cy-start">' + Hub.icon("plus") +
                "Period started" + (Hub.isBackfilling() ? " on this day" : " today") + "</button>") +
            '<button type="button" class="wh-btn wh-btn--ghost wh-btn--sm" id="cy-manual">Add one by date</button>' +
          "</div>" +

          '<div class="wh-field"><span class="wh-field__label">Flow</span>' +
            '<div class="wh-row" style="flex-wrap:wrap">' + FLOWS.map(function (f) {
              var on = today.flow === f.key;
              return '<button type="button" class="wh-btn wh-btn--sm' + (on ? " wh-btn--primary" : " wh-btn--ghost") + '" ' +
                'data-flow="' + f.key + '" aria-pressed="' + on + '">' + f.label + "</button>";
            }).join("") + "</div></div>" +

          '<div class="wh-field wh-mt4"><span class="wh-field__label">Symptoms</span>' +
            '<div class="wh-row" style="flex-wrap:wrap">' + CYCLE_SYMPTOMS.map(function (sym) {
              var on = !!((today.symptoms || {})[sym.key]);
              return '<button type="button" class="wh-btn wh-btn--sm' + (on ? " wh-btn--primary" : " wh-btn--ghost") + '" ' +
                'data-sym="' + sym.key + '" aria-pressed="' + on + '">' + sym.label + "</button>";
            }).join("") + "</div></div>" +
        "</div>" +

        /* ---------- what this phase tends to mean ---------- */
        (note
          ? '<div class="wh-card wh-mb4">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("lightbulb") +
              Hub.esc(phase.label) + " · what it tends to mean</div>" +
              '<span class="wh-chip">day ' + phase.day + "</span></div>" +
            '<div class="wh-stack wh-stack--sm">' +
              phaseRow("What to expect", note.expect) +
              phaseRow("Training", note.training) +
              phaseRow("Worth doing", note.care) +
            "</div>" +
            '<p class="wh-help wh-mt4">Tendencies across populations, not predictions about you. The ' +
              "between-person variation is bigger than the effect — <strong>Insights → Patterns</strong> " +
              "is where you find out whether your own numbers actually do this.</p>" +
          "</div>"
          : "") +

        /* ---------- history ---------- */
        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("clockIc") + "Periods</div>" +
            '<span class="wh-chip">' + list.length + " logged</span></div>" +
          (list.length
            ? '<div class="wh-loglist">' + list.slice(0, 14).map(function (c, i) {
                var len = c.endISO ? Hub.daysBetween(c.startISO, c.endISO) + 1 : null;
                var next = list[i - 1];
                var cycleLen = next ? Hub.daysBetween(c.startISO, next.startISO) : null;
                return '<div class="wh-logrow">' +
                  '<span class="wh-logrow__date">' + Hub.prettyDate(c.startISO) + "</span>" +
                  '<span class="wh-logrow__main">' + (len ? len + " " + Hub.plural(len, "day") : "ongoing") + "</span>" +
                  (cycleLen ? '<span class="wh-chip mono">' + cycleLen + "d cycle</span>" : "") +
                  '<button type="button" class="wh-logrow__del" style="margin-left:auto" ' +
                    'data-delcycle="' + c.id + '" aria-label="Delete period starting ' +
                    Hub.prettyDate(c.startISO) + '">' + Hub.icon("trash") + "</button>" +
                "</div>";
              }).join("") + "</div>"
            : '<div class="wh-empty">' + Hub.icon("drop") + "<strong>Nothing logged yet</strong>" +
              "Log the first day of your next period and the estimates start from there. Two logged " +
              "periods is enough for a rough prediction; four makes it worth trusting.</div>") +
        "</div>" +

        /* ---------- symptom pattern ---------- */
        (Object.keys(byDay).length
          ? '<div class="wh-card wh-mb4">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("chart") +
              "Where symptoms cluster</div></div>" +
            '<p class="wh-sm wh-muted wh-mb4">Symptoms logged, by cycle day, across everything you\'ve ' +
              "recorded. Useful for spotting that the bad days are predictable — and for planning around them.</p>" +
            '<div class="wh-cycdays">' + (function () {
              var max = Math.max.apply(null, Object.keys(byDay).map(function (k) { return byDay[k]; }));
              var out = "";
              for (var i = 1; i <= Math.max(28, s.avg); i++) {
                var n = byDay[i] || 0;
                out += '<span class="wh-cycday" title="Day ' + i + ": " + n + ' symptom logs" ' +
                  'style="--h:' + (n ? Math.max(12, n / max * 100) : 4) + "%;--c:" +
                  (n ? "var(--purple-bright)" : "var(--bg2)") + '"></span>';
              }
              return out;
            })() + "</div>" +
            '<div class="wh-row wh-row--between wh-mt4"><span class="wh-help">Day 1</span>' +
              '<span class="wh-help">Day ' + Math.max(28, s.avg) + "</span></div>" +
          "</div>"
          : "") +

        /* ---------- when to actually see someone ---------- */
        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("alert") +
            "Worth a doctor rather than a longer log</div></div>" +
          '<ul class="wh-ex__steps wh-sm">' +
            "<li>Bleeding so heavy you're changing protection hourly, passing large clots, or going through " +
              "the night.</li>" +
            "<li>Pain that stops you doing normal things, or that painkillers don't touch.</li>" +
            "<li>Bleeding between periods, after sex, or after menopause.</li>" +
            "<li>Periods that stop for three months or more without an obvious reason.</li>" +
            "<li>A cycle that changes markedly in length or pattern and stays changed.</li>" +
          "</ul>" +
          '<p class="wh-help wh-mt4">Bring this log with you — a screenshot of the history above answers ' +
            "the first three questions you'll be asked.</p>" +
        "</div>" +

        '<div class="wh-disclaimer">' + Hub.icon("alert") +
          "<span><strong>This is not contraception and cannot be used as it.</strong> The phase and the " +
          "predicted date are arithmetic on your own past cycles — they don't measure ovulation, they don't " +
          "know about illness, stress, travel, medication or a changing cycle, and fertile-window estimates " +
          "from calendar maths are wrong often enough to be unsafe. For contraception or conception, use a " +
          "method designed for it and talk to a clinician.</span></div>";
    },

    wire: function (el) {
      var enable = el.querySelector("#cy-enable");
      if (enable) {
        enable.addEventListener("click", function () {
          Hub.state.settings.cycleTracking = true;
          Hub.commit();
          Hub.toast("Cycle tracking on.", "success");
        });
        return;
      }

      var start = el.querySelector("#cy-start");
      if (start) start.addEventListener("click", function () {
        addCycle(Hub.viewDate());
      });

      var end = el.querySelector("#cy-end");
      if (end) end.addEventListener("click", function () {
        var open = cycleApi.sorted().filter(function (c) { return !c.endISO; })[0];
        if (!open) return;
        if (Hub.daysBetween(open.startISO, Hub.viewDate()) < 0) {
          Hub.toast("That's before the period started.", "warn");
          return;
        }
        open.endISO = Hub.viewDate();
        Hub.commit();
        Hub.toast("Period marked as ended.", "success");
      });

      el.querySelector("#cy-manual").addEventListener("click", function () {
        Hub.modal({
          title: "Add a period",
          body:
            '<div class="wh-grid wh-grid--2" style="gap:var(--wh-s3)">' +
              '<label class="wh-field"><span class="wh-field__label">First day</span>' +
                '<input class="wh-input" id="cy-s" type="date" value="' + Hub.viewDate() +
                  '" max="' + Hub.today() + '" /></label>' +
              '<label class="wh-field"><span class="wh-field__label">Last day (optional)</span>' +
                '<input class="wh-input" id="cy-e" type="date" max="' + Hub.today() + '" /></label>' +
            "</div>",
          actions: [
            { label: "Cancel", variant: "ghost" },
            { label: "Add", variant: "primary", close: false, onClick: function () {
              var st = document.getElementById("cy-s").value;
              var en = document.getElementById("cy-e").value;
              if (!/^\d{4}-\d{2}-\d{2}$/.test(st)) { Hub.toast("Pick a start date.", "warn"); return; }
              if (en && Hub.daysBetween(st, en) < 0) { Hub.toast("The last day can't be before the first.", "warn"); return; }
              Hub.closeModal();
              addCycle(st, en || null);
            } }
          ]
        });
      });

      Hub.delegate(el, "[data-flow]", function (b) {
        var d = Hub.editDay();
        d.cycle = d.cycle || {};
        d.cycle.flow = d.cycle.flow === b.dataset.flow ? null : b.dataset.flow;
        Hub.commit();
      });

      Hub.delegate(el, "[data-sym]", function (b) {
        var d = Hub.editDay();
        d.cycle = d.cycle || {};
        d.cycle.symptoms = d.cycle.symptoms || {};
        var k = b.dataset.sym;
        if (d.cycle.symptoms[k]) delete d.cycle.symptoms[k];
        else d.cycle.symptoms[k] = true;
        Hub.commit();
      });

      Hub.delegate(el, "[data-delcycle]", function (b) {
        var id = b.dataset.delcycle;
        Hub.confirm({
          title: "Delete this period?",
          body: "It'll be removed, and the cycle-length averages will be recalculated without it.",
          confirmLabel: "Delete",
          onConfirm: function () {
            Hub.state.logs.cycles = Hub.state.logs.cycles.filter(function (c) { return c.id !== id; });
            Hub.commit();
            Hub.toast("Deleted.", "info", 2000);
          }
        });
      });
    }
  };

  function phaseRow(label, text) {
    return '<div class="wh-logrow" style="align-items:flex-start">' +
      '<span class="wh-logrow__date" style="min-width:110px">' + Hub.esc(label) + "</span>" +
      '<span class="wh-logrow__main wh-sm">' + Hub.esc(text) + "</span></div>";
  }

  function addCycle(startISO, endISO) {
    var dupe = (Hub.state.logs.cycles || []).filter(function (c) {
      return Math.abs(Hub.daysBetween(c.startISO, startISO)) < 10;
    })[0];
    if (dupe) {
      Hub.toast("There's already a period logged within 10 days of that date.", "warn", 5000);
      return;
    }
    Hub.state.logs.cycles.push({
      id: "cy" + Date.now(), startISO: startISO, endISO: endISO || null, note: ""
    });
    /* Day 1 is bleeding by definition, so pre-fill the flow rather than
       making it a second tap. */
    var d = Hub.editDay(startISO);
    d.cycle = d.cycle || {};
    if (!d.cycle.flow) d.cycle.flow = "medium";
    Hub.commit();
    Hub.beep(660, 90);
    Hub.toast("Period logged from " + Hub.prettyDate(startISO) + ".", "success");
  }

  /* ======================================================================
     3. SELF-EXAM
     ----------------------------------------------------------------------
     Monthly, tracked as a date rather than a daily tick — the same shape the
     skin self-exam uses in Body Care. The value of these is familiarity: what
     you're looking for is a change from your own normal, which is only
     visible if you've been looking.
     ====================================================================== */
  var EXAMS = {
    breast: {
      key: "breastExamISO",
      title: "Breast self-check",
      icon: "ribbon",
      when: "Once a month. If you have periods, a few days after one ends is best — breast tissue is " +
            "lumpier and more tender in the days before.",
      how: [
        "Look first, in a mirror, arms down: shape, symmetry, skin, nipples.",
        "Then again with arms raised, and with hands pressed on your hips to tense the chest.",
        "Feel with the flat pads of three fingers, in small circles, using light, medium and firm pressure.",
        "Cover the whole area in a system you repeat: up-and-down strips, or spiralling in.",
        "Include the armpit and up to the collarbone — breast tissue extends further than people expect.",
        "Lying down flattens the tissue and is easier for larger breasts. Standing in the shower with soap works too."
      ],
      flags: [
        "A new lump or thickened area that doesn't come and go with your cycle",
        "A change in size or shape, or one that's newly different from the other",
        "Skin dimpling, puckering, or an orange-peel texture",
        "A nipple that has newly turned inward, or discharge you didn't cause",
        "Persistent rash, redness or crusting on or around the nipple",
        "Pain in one spot that doesn't go away over a cycle"
      ]
    },
    testicular: {
      key: "testisExamISO",
      title: "Testicular self-check",
      icon: "magnify",
      when: "Once a month, ideally after a warm shower or bath — the scrotum is relaxed and everything " +
            "is easier to feel.",
      how: [
        "Do one side at a time, standing.",
        "Roll each testicle gently between thumb and fingers, covering the whole surface.",
        "It should feel smooth and firm, like a hard-boiled egg without the shell.",
        "Find the epididymis — the soft, tube-like ridge at the back and top. That's meant to be there.",
        "One hanging lower, or being slightly larger, is normal. What matters is a change from your normal.",
        "It takes about a minute. The point is knowing what yours feel like so a change is obvious."
      ],
      flags: [
        "A hard, painless lump on the surface — the most common first sign, and usually painless",
        "A change in size, firmness or weight of one testicle",
        "A dull ache or heaviness in the scrotum, groin or lower abdomen",
        "Sudden severe pain or swelling — that one is an emergency, not a wait-and-see",
        "Fluid collecting in the scrotum, or a vein cluster that feels like a bag of worms"
      ]
    }
  };

  function examFor() {
    var g = gender();
    if (g === "male") return ["testicular"];
    if (g === "female") return ["breast"];
    return ["breast", "testicular"];      // not recorded — offer both
  }

  var selfexam = {
    render: function () {
      var which = examFor();

      return '<div class="wh-card wh-card--accent wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("magnify") + "Monthly self-check</div></div>" +
          '<p class="wh-sm wh-muted">These work by <strong>familiarity</strong>, not by finding something ' +
            "on any one occasion. Almost everything you feel will be normal for you — the value is that " +
            "when something isn't, you notice quickly, and that's the part that changes outcomes.</p>" +
          (gender() ? "" :
            '<p class="wh-help wh-mt4">Both are shown, because your profile doesn\'t pick one out. ' +
              "Do whichever applies — or set a gender in <strong>Settings → Your profile</strong> and " +
              "this page narrows itself.</p>") +
        "</div>" +

        which.map(function (k) { return examCard(EXAMS[k]); }).join("") +

        '<div class="wh-card">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("info") + "Related checks elsewhere</div></div>" +
          '<ul class="wh-ex__steps wh-sm">' +
            "<li><strong>Skin and moles</strong> — monthly, tracked in Body Care.</li>" +
            "<li><strong>Blood pressure</strong> — Health Records, if you have a cuff.</li>" +
            "<li><strong>Dental and eye checks</strong> — in the check-up schedule on Health Records.</li>" +
          "</ul>" +
        "</div>";
    },

    wire: function (el) {
      Hub.delegate(el, "[data-exam]", function (btn) {
        var key = btn.dataset.exam;
        Hub.state.logs[key] = Hub.viewDate();
        Hub.commit();
        Hub.beep(700, 90);
        Hub.toast("Logged. Next one in about a month.", "success");
      });
      Hub.delegate(el, "[data-examclear]", function (btn) {
        Hub.state.logs[btn.dataset.examclear] = null;
        Hub.commit();
        Hub.toast("Cleared.", "info", 2000);
      });
    }
  };

  function examCard(ex) {
    var last = Hub.state.logs[ex.key];
    var days = last ? Hub.daysBetween(last, Hub.today()) : null;
    var left = days == null ? null : 30 - days;
    var color = left == null ? "var(--wh-accent)"
      : (left > 2 ? "var(--wh-accent)" : (left >= 0 ? "var(--yellow-bright)" : "var(--orange-bright)"));

    return '<div class="wh-card wh-mb4">' +
      '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon(ex.icon) + Hub.esc(ex.title) + "</div>" +
        (last ? '<span class="wh-chip' + (left < 0 ? " wh-chip--warn" : "") + '">last ' + Hub.relDay(last) + "</span>" : "") +
      "</div>" +

      (last
        ? '<div class="wh-brushage">' +
            Hub.ring(Hub.pct(Math.min(days, 30), 30), {
              size: 92, stroke: 8, color: color,
              aria: days + " days since the last " + ex.title,
              center: '<div class="wh-ringwrap__val">' + Math.max(0, left) + "</div>" +
                      '<div class="wh-ringwrap__lbl">days left</div>'
            }) +
            '<div class="wh-grow"><div class="wh-sm">' + Hub.esc(ex.when) + "</div>" +
            '<div class="wh-xs wh-faint wh-mt4">' +
              (left > 0 ? "Next due " + Hub.prettyDate(Hub.shiftDay(last, 30))
                        : "Due now — it's been " + days + " days.") + "</div></div>" +
          "</div>"
        : '<p class="wh-sm wh-muted">' + Hub.esc(ex.when) + "</p>") +

      '<details class="wh-mob-details wh-mt4"><summary>How to do it</summary>' +
        '<ol class="wh-ex__steps">' + ex.how.map(function (h) {
          return "<li>" + Hub.esc(h) + "</li>";
        }).join("") + "</ol></details>" +

      '<div class="wh-h3 wh-mt6 wh-mb4">Get it looked at if you find</div>' +
      '<ul class="wh-ex__steps wh-sm">' + ex.flags.map(function (f) {
        return "<li>" + Hub.esc(f) + "</li>";
      }).join("") + "</ul>" +
      '<p class="wh-help wh-mt4">Most of these turn out to be nothing. Getting one checked costs an ' +
        "appointment; not getting it checked is the expensive option.</p>" +

      '<div class="wh-row wh-mt4">' +
        '<button type="button" class="wh-btn ' + (left != null && left <= 0 ? "wh-btn--primary" : "wh-btn--ghost") +
          '" data-exam="' + ex.key + '">' + Hub.icon("check") + "I did this check" +
          (Hub.isBackfilling() ? " on this day" : " today") + "</button>" +
        (last ? '<button type="button" class="wh-btn wh-btn--ghost wh-btn--sm" data-examclear="' + ex.key +
          '">Clear</button>' : "") +
      "</div>" +
    "</div>";
  }

  /* ======================================================================
     4. SCREENING
     ----------------------------------------------------------------------
     These are the ones with an age band attached. Intervals differ by country
     and by personal risk, so every row says what it's based on and the panel
     says plainly that your own programme wins. Adding one drops it into the
     check-up schedule on Health Records, which already does the "due in N
     months" arithmetic — no second system.
     ====================================================================== */
  var SCREENINGS = [
    { id: "cervical", gender: "female", from: 25, to: 65, intervalMonths: 36,
      name: "Cervical screening (smear / HPV test)",
      why: "Detects HPV and cell changes years before they could become cancer. The single highest-value " +
           "screening on this list.",
      note: "Typically every 3 years from 25, moving to every 5 years after 30–50 depending on the country " +
            "and on whether the programme is HPV-primary." },
    { id: "mammogram", gender: "female", from: 40, to: 75, intervalMonths: 24,
      name: "Breast screening (mammogram)",
      why: "Finds tumours smaller than anything a self-check can feel.",
      note: "Programmes usually start between 40 and 50 and run every 1–3 years. Earlier and more often " +
            "if you have a family history — worth raising before the invitation arrives." },
    { id: "sti", gender: null, from: 16, to: 100, intervalMonths: 12,
      name: "Sexual health / STI screen",
      why: "Most STIs are symptomless for long stretches, and the untreated ones are what cause lasting " +
           "damage to fertility.",
      note: "Annually if you're sexually active, and with each new partner. Free and confidential in most " +
            "countries." },
    { id: "prostate", gender: "male", from: 50, to: 100, intervalMonths: 24,
      name: "Prostate discussion (PSA)",
      why: "Not a routine screen everywhere — the test has real false-positive costs — but a conversation " +
           "worth having from 50, or 45 with a family history.",
      note: "Ask about it rather than assume it's included in a general check-up." },
    { id: "fertility", gender: null, from: 18, to: 100, intervalMonths: 0,
      name: "Fertility / preconception check",
      why: "Only relevant if you're planning a pregnancy, or have been trying for a while without success.",
      note: "Usually raised after 12 months of trying, or 6 months over the age of 35. Not a scheduled " +
            "screen — this row is a reminder that it exists." }
  ];

  function relevantScreenings() {
    var g = gender(), a = age();
    return SCREENINGS.filter(function (x) {
      if (x.gender && g && x.gender !== g) return false;
      if (x.gender && !g) return true;          // not recorded: show everything
      if (a != null && (a < x.from - 5 || a > x.to + 10)) return false;
      return true;
    });
  }

  function checkupFor(id) {
    return (Hub.state.logs.checkups || []).filter(function (c) { return c.id === "scr-" + id; })[0];
  }

  var screening = {
    render: function () {
      var a = age();
      var list = relevantScreenings();

      return '<div class="wh-card wh-card--accent wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("calendar") + "Screening</div>" +
            (a != null ? '<span class="wh-chip">age ' + a + "</span>" : "") + "</div>" +
          '<p class="wh-sm wh-muted">The checks with an age band attached. <strong>Intervals vary by ' +
            "country and by your own risk</strong> — if your health service has invited you on a different " +
            "schedule, theirs is the one to follow, and you can edit any of these once they're added.</p>" +
          (a == null
            ? '<p class="wh-help wh-mt4">Add your birth year in <strong>Settings → Your profile</strong> ' +
              "and this list narrows to what's actually relevant to you now.</p>"
            : "") +
        "</div>" +

        '<div class="wh-stack wh-mb4">' + list.map(function (x) {
          var existing = checkupFor(x.id);
          var due = a != null && a >= x.from && a <= x.to;
          return '<div class="wh-card">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.esc(x.name) + "</div>" +
              (existing
                ? '<span class="wh-chip wh-chip--good">tracked</span>'
                : (due ? '<span class="wh-chip wh-chip--accent">relevant now</span>'
                       : '<span class="wh-chip">age ' + x.from + (x.to < 100 ? "–" + x.to : "+") + "</span>")) +
            "</div>" +
            '<p class="wh-sm wh-muted">' + Hub.esc(x.why) + "</p>" +
            '<p class="wh-xs wh-faint wh-mt4">' + Hub.esc(x.note) + "</p>" +
            (existing
              ? '<p class="wh-sm wh-mt4" style="color:var(--green-bright)">' + Hub.icon("check") +
                " In your check-up schedule" +
                (existing.lastISO ? " · last done " + Hub.prettyDate(existing.lastISO) : " · never logged") +
                '. <button type="button" class="wh-btn wh-btn--ghost wh-btn--sm" data-goch>Open Health Records</button></p>'
              : (x.intervalMonths
                  ? '<button type="button" class="wh-btn wh-btn--ghost wh-btn--sm wh-mt4" data-addscr="' + x.id + '">' +
                    Hub.icon("plus") + "Track this in my check-ups</button>"
                  : "")) +
          "</div>";
        }).join("") + "</div>" +

        '<div class="wh-disclaimer">' + Hub.icon("info") +
          "<span>Nothing here is an invitation, a booking or a substitute for your national programme. " +
          "It's a list of what exists and roughly when, so that a check you're eligible for doesn't pass " +
          "you by unnoticed. The dates are yours to keep accurate.</span></div>";
    },

    wire: function (el) {
      Hub.delegate(el, "[data-addscr]", function (btn) {
        var x = SCREENINGS.filter(function (s) { return s.id === btn.dataset.addscr; })[0];
        if (!x || checkupFor(x.id)) return;
        Hub.state.logs.checkups.push({
          id: "scr-" + x.id,
          name: x.name,
          intervalMonths: x.intervalMonths,
          lastISO: null,
          note: x.note
        });
        Hub.commit();
        Hub.toast("Added to your check-up schedule.", "success");
      });
      Hub.delegate(el, "[data-goch]", function () {
        Hub.uiSet("healthPill", "checkups");
        Hub.show("health");
      });
    }
  };

  /* ======================================================================
     5. CONTRACEPTION
     ----------------------------------------------------------------------
     The pill is the only method where a daily tick and a punctual reminder
     genuinely change how well it works, so that's the part that's tracked.
     Everything else is recorded so the app knows what you're on — which
     matters when you're looking at a cycle log and wondering why it's regular.
     ====================================================================== */
  var METHODS = [
    { key: "none", label: "None / not tracking" },
    { key: "pill-combined", label: "Combined pill", daily: true },
    { key: "pill-progestogen", label: "Progestogen-only pill", daily: true },
    { key: "patch", label: "Patch" },
    { key: "ring", label: "Vaginal ring" },
    { key: "injection", label: "Injection" },
    { key: "implant", label: "Implant" },
    { key: "iud", label: "IUD / IUS (coil)" },
    { key: "condom", label: "Condoms" },
    { key: "other", label: "Something else" }
  ];

  function methodDef() {
    var m = (Hub.state.settings.contraception || {}).method || "none";
    return METHODS.filter(function (x) { return x.key === m; })[0] || METHODS[0];
  }

  /* Which day of the pack today is, if a pack start is recorded. */
  function packDay() {
    var c = Hub.state.settings.contraception || {};
    if (!c.packStartISO) return null;
    var cycleLen = (Number(c.packDays) || 21) + (Number(c.breakDays) || 7);
    var n = Hub.daysBetween(c.packStartISO, Hub.viewDate());
    if (n < 0) return null;
    var day = (n % cycleLen) + 1;
    return { day: day, total: cycleLen, active: day <= (Number(c.packDays) || 21) };
  }

  var contraception = {
    render: function () {
      var c = Hub.state.settings.contraception || {};
      var def = methodDef();
      var rem = Hub.state.settings.reminders.contraceptive;
      var d = Hub.day();
      var taken = !!(d.repro || {}).pill;
      var pack = packDay();

      /* Last 14 days of ticks — the thing you actually want to see when you
         can't remember whether you took yesterday's. */
      var strip = "";
      for (var i = 13; i >= 0; i--) {
        var key = Hub.shiftDay(Hub.today(), -i);
        var on = !!(Hub.day(key).repro || {}).pill;
        strip += '<div title="' + Hub.prettyDate(key) + (on ? " — taken" : " — not logged") + '" ' +
          'style="flex:1;height:26px;border-radius:5px;border:1px solid ' +
          (on ? "var(--green-bright)" : "var(--bg2)") + ";background:" +
          (on ? "rgba(184,187,38,.22)" : "var(--bg0-soft)") + '"></div>';
      }

      return '<div class="wh-card wh-card--accent wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("pill") + "Method</div>" +
            '<span class="wh-chip">' + Hub.esc(def.label) + "</span></div>" +
          '<label class="wh-field"><span class="wh-field__label">What you\'re using</span>' +
            '<select class="wh-input" id="ct-method">' + METHODS.map(function (m) {
              return '<option value="' + m.key + '"' + (m.key === def.key ? " selected" : "") + ">" +
                Hub.esc(m.label) + "</option>";
            }).join("") + "</select></label>" +
          '<label class="wh-field wh-mt4"><span class="wh-field__label">Note (optional)</span>' +
            '<input class="wh-input" id="ct-note" type="text" maxlength="120" value="' + Hub.esc(c.note || "") +
              '" placeholder="brand, when it was fitted, when it needs replacing…" /></label>' +
          '<p class="wh-help wh-mt4">Recorded so the rest of the app has context — a hormonal method is ' +
            "the most common reason a cycle log looks unusually regular, or stops entirely.</p>" +
        "</div>" +

        (def.daily
          ? /* ---------- daily pill ---------- */
            '<div class="wh-card wh-mb4">' +
              '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("check") + "Today" +
                (Hub.isBackfilling() ? " · " + Hub.prettyDate(Hub.viewDate()) : "") + "</div>" +
                (pack ? '<span class="wh-chip' + (pack.active ? " wh-chip--accent" : "") + '">' +
                  "day " + pack.day + " of " + pack.total + (pack.active ? "" : " · break") + "</span>" : "") +
              "</div>" +
              '<button type="button" class="wh-check' + (taken ? " is-done" : "") + '" id="ct-take" ' +
                  'aria-pressed="' + taken + '">' +
                '<span class="wh-check__box">' + Hub.icon("check") + "</span>" +
                '<span class="wh-check__text">Taken' +
                  '<span class="wh-check__sub">' +
                    (def.key === "pill-progestogen"
                      ? "The progestogen-only pill has a narrow window — same time every day matters more here than with any other method."
                      : "Same time each day. Set the reminder below and stop thinking about it.") +
                  "</span></span></button>" +

              '<div class="wh-mt6"><div class="wh-xs wh-faint wh-mb4">Last 14 days</div>' +
                '<div class="wh-row" style="gap:4px">' + strip + "</div></div>" +

              '<div class="wh-setrow wh-mt6">' +
                '<div class="wh-setrow__info"><div class="wh-setrow__name">Daily reminder</div>' +
                  '<div class="wh-setrow__desc">Fires at this time every day, quiet hours included — ' +
                    "being on time is the whole point of this one.</div></div>" +
                '<div class="wh-setrow__ctl">' +
                  '<input class="wh-input" type="time" id="ct-time" value="' + Hub.esc(rem.time || "21:00") + '" ' +
                    'aria-label="Contraceptive reminder time" />' +
                  '<label class="wh-switch"><input type="checkbox" id="ct-remind"' +
                    (rem.enabled ? " checked" : "") + " />" +
                  '<span class="wh-switch__track"></span></label>' +
                "</div>" +
              "</div>" +

              '<div class="wh-grid wh-grid--3 wh-mt4">' +
                '<label class="wh-field"><span class="wh-field__label">Pack started</span>' +
                  '<input class="wh-input" id="ct-packstart" type="date" value="' + Hub.esc(c.packStartISO || "") +
                    '" max="' + Hub.today() + '" /></label>' +
                '<label class="wh-field"><span class="wh-field__label">Active days</span>' +
                  '<input class="wh-input" id="ct-packdays" type="number" min="1" max="120" value="' +
                    (Number(c.packDays) || 21) + '" /></label>' +
                '<label class="wh-field"><span class="wh-field__label">Break days</span>' +
                  '<input class="wh-input" id="ct-breakdays" type="number" min="0" max="14" value="' +
                    (c.breakDays == null ? 7 : Number(c.breakDays)) + '" /></label>' +
              "</div>" +
              '<p class="wh-help wh-mt4">Optional — it just labels which day of the pack you\'re on. ' +
                "Continuous or tailored regimes: set the break to 0.</p>" +
            "</div>" +

            '<div class="wh-disclaimer">' + Hub.icon("alert") +
              "<span><strong>If you miss one, this app is the wrong place to look for what to do.</strong> " +
              "The answer depends on which pill, how late, and where in the pack you are, and getting it " +
              "wrong matters. Check the leaflet in the pack, or ring a pharmacist — they will answer this " +
              "question over the phone in a minute, and it's a question they get every day.</span></div>"

          : /* ---------- non-daily methods ---------- */
            '<div class="wh-card">' +
              '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("info") + "Nothing daily to log</div></div>" +
              '<p class="wh-sm wh-muted">' +
                (def.key === "none"
                  ? "Pick a method above if you'd like it recorded. Only the pill gets a daily tick here — " +
                    "for anything with a replacement or repeat date, add it as a check-up on Health " +
                    "Records and it'll tell you when it's due."
                  : Hub.esc(def.label) + " doesn't need a daily tick. For its replacement or repeat date — " +
                    "an implant, coil, injection or repeat prescription — add it as a check-up on Health " +
                    "Records, which does the \"due in N months\" arithmetic for you.") + "</p>" +
              '<button type="button" class="wh-btn wh-btn--ghost wh-mt4" data-goch>' +
                Hub.icon("calendar") + "Open check-ups</button>" +
            "</div>");
    },

    wire: function (el) {
      var c = Hub.state.settings.contraception;

      el.querySelector("#ct-method").addEventListener("change", function (e) {
        c.method = e.target.value;
        /* Switching off a daily method leaves an orphaned reminder firing for
           something you no longer take. */
        if (!methodDef().daily) Hub.state.settings.reminders.contraceptive.enabled = false;
        Hub.commit();
      });

      var note = el.querySelector("#ct-note");
      if (note) note.addEventListener("change", function (e) {
        c.note = e.target.value.trim().slice(0, 120);
        Hub.save();
      });

      var take = el.querySelector("#ct-take");
      if (take) take.addEventListener("click", function () {
        var d = Hub.editDay();
        d.repro = d.repro || {};
        if (d.repro.pill) delete d.repro.pill;
        else d.repro.pill = true;
        Hub.commit();
        if (d.repro.pill) Hub.beep(700, 90);
      });

      var remind = el.querySelector("#ct-remind");
      if (remind) remind.addEventListener("change", function (e) {
        var on = e.target.checked;
        Hub.state.settings.reminders.contraceptive.enabled = on;
        Hub.save();
        Hub.reminders.sync();
        if (on && Hub.notify.permission() === "default") Hub.notify.request();
        Hub.toast(on ? "Reminder on." : "Reminder off.", on ? "success" : "info", 2200);
        Hub.refresh();
      });

      var time = el.querySelector("#ct-time");
      if (time) time.addEventListener("change", function (e) {
        if (!/^\d{2}:\d{2}$/.test(e.target.value)) return;
        Hub.state.settings.reminders.contraceptive.time = e.target.value;
        /* A time edited today has already "fired" for today as far as the
           scheduler is concerned; clearing that lets the new time still run. */
        delete Hub.state.meta.lastFired.contraceptive;
        Hub.save();
        Hub.refresh();
      });

      ["ct-packstart", "ct-packdays", "ct-breakdays"].forEach(function (id) {
        var inp = el.querySelector("#" + id);
        if (!inp) return;
        inp.addEventListener("change", function (e) {
          if (id === "ct-packstart") {
            c.packStartISO = /^\d{4}-\d{2}-\d{2}$/.test(e.target.value) ? e.target.value : null;
          } else if (id === "ct-packdays") {
            c.packDays = Hub.clamp(Math.round(Number(e.target.value) || 21), 1, 120);
          } else {
            c.breakDays = Hub.clamp(Math.round(Number(e.target.value) || 0), 0, 14);
          }
          Hub.commit();
        });
      });

      Hub.delegate(el, "[data-goch]", function () {
        Hub.uiSet("healthPill", "checkups");
        Hub.show("health");
      });
    }
  };

  /* ======================================================================
     6. VIEW
     ====================================================================== */
  var SECTIONS = {
    cycle: cycle, selfexam: selfexam, screening: screening, contraception: contraception
  };

  function render(el) {
    /* Reachable while hidden — from a deep link, or from a last-view restore
       after the tab was switched off. Explain rather than show an empty page. */
    if (!Hub.reproTabVisible()) {
      el.innerHTML =
        '<div class="wh-head">' +
          '<div class="wh-head__eyebrow">Reproductive health</div>' +
          "<h1>Not switched on</h1>" +
        "</div>" +
        '<div class="wh-card wh-card--accent">' +
          '<p class="wh-sm wh-muted">This tab covers cycle tracking and periods, the monthly self-check, ' +
            "age-related screening, and contraception. It appears in the nav once your profile records a " +
            "gender, since that's what decides which half of it is relevant — or you can just switch it " +
            "on here and leave the profile alone.</p>" +
          '<div class="wh-row wh-mt4">' +
            '<button type="button" class="wh-btn wh-btn--primary" id="rp-on">' + Hub.icon("check") +
              "Show this tab</button>" +
            '<button type="button" class="wh-btn wh-btn--ghost" id="rp-profile">' + Hub.icon("idCard") +
              "Fill in my profile</button>" +
          "</div>" +
        "</div>";

      el.querySelector("#rp-on").addEventListener("click", function () {
        Hub.state.settings.reproTab = true;
        Hub.commit();
        Hub.buildNav();
        Hub.toast("Reproductive health is in your nav now.", "success");
      });
      el.querySelector("#rp-profile").addEventListener("click", function () {
        if (Hub.onboarding) Hub.onboarding.start();
        else Hub.show("settings");
      });
      return;
    }

    var pill = currentPill();

    el.innerHTML =
      '<div class="wh-head">' +
        '<div class="wh-head__eyebrow">Reproductive health</div>' +
        "<h1>" + (gender() === "male" ? "Checks worth keeping up" : "Your cycle, and the checks around it") + "</h1>" +
        "<p>" + (gender() === "male"
          ? "The monthly self-check, and the screenings that come with age. Two minutes a month, and a " +
            "list you can stop trying to remember."
          : "Periods, flow and symptoms with honest predictions, the monthly self-check, age-related " +
            "screening, and contraception — including a pill reminder that actually fires on time.") + "</p>" +
      "</div>" +

      Hub.dateNav() +

      '<div class="wh-pills" role="tablist">' +
        visiblePills().map(function (p) {
          return '<button type="button" role="tab" class="wh-pill' + (p.id === pill ? " is-active" : "") + '" ' +
            'data-pill="' + p.id + '" aria-selected="' + (p.id === pill) + '">' +
            Hub.icon(p.icon) + "<span>" + p.label + "</span></button>";
        }).join("") +
      "</div>" +
      '<div id="wh-repro-body">' + SECTIONS[pill].render() + "</div>";

    Hub.wireDateNav(el);
    Hub.delegate(el, "[data-pill]", function (btn) {
      Hub.uiSet("reproPill", btn.dataset.pill);
      Hub.refresh();
    });

    SECTIONS[pill].wire(el.querySelector("#wh-repro-body"));
  }

  Hub.registerView("repro", render);
})();
