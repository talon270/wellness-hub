/* ============================================================================
   WELLNESS HUB · HEALTH RECORDS
   ----------------------------------------------------------------------------
     vitals    log blood pressure, resting heart rate, weight, waist, temperature
               and SpO2; see the trend and where a reading sits against the
               usual general-population reference bands
     checkups  recurring appointments with an interval, showing what's due
     meds      your medication and supplement list, ticked off daily

   Reference bands are shown because a number with no context is useless — but
   they are general adult guidance, they are labelled as such, and nothing here
   interprets a reading for you. The app never says "you are hypertensive"; it
   says which band a number falls in and tells you to talk to a doctor.
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  var PILLS = [
    { id: "vitals",   label: "Vitals",       icon: "pulse" },
    { id: "vo2max",   label: "VO2 Max",      icon: "wind" },
    { id: "labs",     label: "Lab results",  icon: "flask" },
    { id: "checkups", label: "Check-ups",    icon: "calendar" },
    { id: "meds",     label: "Meds & Supps", icon: "pill" },
    { id: "profile",  label: "Profile",      icon: "idCard" }
  ];

  function currentPill() {
    var p = Hub.uiGet("healthPill", "vitals");
    return PILLS.some(function (x) { return x.id === p; }) ? p : "vitals";
  }

  /* ======================================================================
     VITALS
     ====================================================================== */

  /* Each metric knows how to read itself out of an entry and roughly where the
     usual adult reference bands sit. `bands` are ordered; the first match wins. */
  var METRICS = [
    {
      key: "bp", label: "Blood pressure", short: "BP", unit: "mmHg", icon: "pulse", color: "var(--red-bright)",
      value: function (v) { return v.sys && v.dia ? v.sys + "/" + v.dia : null; },
      chartValue: function (v) { return v.sys || null; },
      band: function (v) {
        if (!v.sys || !v.dia) return null;
        if (v.sys >= 180 || v.dia >= 120) return { label: "Very high — seek advice now", tone: "bad" };
        if (v.sys >= 140 || v.dia >= 90) return { label: "High range", tone: "bad" };
        if (v.sys >= 130 || v.dia >= 80) return { label: "Raised", tone: "warn" };
        if (v.sys >= 120) return { label: "Slightly elevated", tone: "warn" };
        if (v.sys < 90 || v.dia < 60) return { label: "Low range", tone: "warn" };
        return { label: "Usual range", tone: "good" };
      },
      note: "Sit still for five minutes first, feet flat, arm supported at heart height. " +
            "A single high reading means very little — it's the pattern across days that matters."
    },
    {
      key: "hr", label: "Resting heart rate", short: "HR", unit: "bpm", icon: "pulse", color: "var(--orange-bright)",
      value: function (v) { return v.hr || null; },
      chartValue: function (v) { return v.hr || null; },
      band: function (v) {
        if (!v.hr) return null;
        if (v.hr < 40) return { label: "Very low", tone: "warn" };
        if (v.hr <= 60) return { label: "Low — typical of trained people", tone: "good" };
        if (v.hr <= 100) return { label: "Usual range", tone: "good" };
        return { label: "Above the usual resting range", tone: "warn" };
      },
      note: "Measure first thing, before getting out of bed. As your conditioning improves this " +
            "generally drifts down — a sudden jump often means you're under-recovered or coming down with something."
    },
    {
      /* Stored in kg; shown in whichever system is selected. The band logic
         always reasons in metric, so a unit switch can't move a threshold. */
      key: "weightKg", label: "Weight", short: "Weight", icon: "fitness", color: "var(--aqua-bright)",
      unit: function () { return Hub.units.massLabel(); },
      value: function (v) { return v.weightKg ? Hub.units.massOut(v.weightKg) : null; },
      chartValue: function (v) { return v.weightKg ? Hub.units.massOut(v.weightKg) : null; },
      band: function () { return null; },
      note: "Same time of day, same conditions — ideally on waking, after the toilet, before eating. " +
            "Day-to-day swings are mostly water; only the weekly trend means anything."
    },
    {
      key: "waistCm", label: "Waist", short: "Waist", icon: "bodycare", color: "var(--purple-bright)",
      unit: function () { return Hub.units.lenLabel(); },
      value: function (v) { return v.waistCm ? Hub.units.lenOut(v.waistCm) : null; },
      chartValue: function (v) { return v.waistCm ? Hub.units.lenOut(v.waistCm) : null; },
      band: function () { return null; },
      note: "Measured at the navel, relaxed, at the end of a normal breath out. Often tracks changes " +
            "in body composition better than the scale does."
    },
    {
      key: "tempC", label: "Temperature", short: "Temp", icon: "snowflake", color: "var(--yellow-bright)",
      unit: function () { return Hub.units.tempLabel(); },
      value: function (v) { return v.tempC ? Hub.units.tempOut(v.tempC) : null; },
      chartValue: function (v) { return v.tempC ? Hub.units.tempOut(v.tempC) : null; },
      band: function (v) {
        if (!v.tempC) return null;
        if (v.tempC >= 38) return { label: "Fever range", tone: "bad" };
        if (v.tempC >= 37.5) return { label: "Slightly raised", tone: "warn" };
        if (v.tempC < 35) return { label: "Low — seek advice", tone: "bad" };
        return { label: "Usual range", tone: "good" };
      },
      note: function () {
        return Hub.units.isImperial()
          ? "Normal sits around 97–99°F and moves through the day. Method matters — oral, ear and " +
            "forehead readings aren't directly comparable."
          : "Normal sits around 36.1–37.2°C and moves through the day. Method matters — oral, ear and " +
            "forehead readings aren't directly comparable.";
      }
    },
    {
      key: "spo2", label: "Blood oxygen", short: "SpO₂", unit: "%", icon: "wind", color: "var(--blue-bright)",
      value: function (v) { return v.spo2 || null; },
      chartValue: function (v) { return v.spo2 || null; },
      band: function (v) {
        if (!v.spo2) return null;
        if (v.spo2 < 92) return { label: "Low — seek advice", tone: "bad" };
        if (v.spo2 < 95) return { label: "Below usual", tone: "warn" };
        return { label: "Usual range", tone: "good" };
      },
      note: "Consumer pulse oximeters are least accurate exactly where it matters — at low readings, " +
            "on cold hands, and on darker skin. Treat a worrying number as a prompt to get checked, not as a measurement."
    }
  ];

  /* `unit` and `note` may be plain strings or functions of the active unit
     system — resolve either shape at the point of use. */
  function unitOf(m) { return typeof m.unit === "function" ? m.unit() : (m.unit || ""); }
  function noteOf(m) { return typeof m.note === "function" ? m.note() : (m.note || ""); }

  var vitals = {
    render: function () {
      var entries = (Hub.state.logs.vitals || []).slice().sort(function (a, b) {
        return (b.date + (b.time || "")) < (a.date + (a.time || "")) ? -1 : 1;
      });
      var latest = {};
      METRICS.forEach(function (m) {
        latest[m.key] = entries.filter(function (e) { return m.value(e) != null; })[0] || null;
      });

      var U = Hub.units;
      var mass = U.range("mass", 20, 350);
      var len = U.range("len", 40, 200);
      var temp = U.range("temp", 30, 43);
      var ph = U.isImperial()
        ? { w: "128", waist: "30", t: "98.0" }
        : { w: "58", waist: "76", t: "36.6" };

      return '<div class="wh-grid wh-grid--2 wh-mb4">' +
          /* ---------- entry form ---------- */
          '<div class="wh-card wh-card--accent">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("plus") + "New reading</div>" +
              '<span class="wh-chip">' + U.massLabel() + " · " + U.tempLabel() + "</span></div>" +
            '<p class="wh-sm wh-muted wh-mb4">Fill in whatever you measured — every field is optional. ' +
              "The date defaults to today; change it to enter something you took earlier.</p>" +
            '<div class="wh-grid wh-grid--2" style="gap:var(--wh-s3)">' +
              '<label class="wh-field"><span class="wh-field__label">Date</span>' +
                '<input class="wh-input" type="date" id="hv-date" value="' + Hub.viewDate() +
                  '" max="' + Hub.today() + '" /></label>' +
              '<label class="wh-field"><span class="wh-field__label">Time</span>' +
                '<input class="wh-input" type="time" id="hv-time" /></label>' +
              '<label class="wh-field"><span class="wh-field__label">Systolic</span>' +
                '<input class="wh-input" type="number" id="hv-sys" min="50" max="260" inputmode="numeric" placeholder="120" /></label>' +
              '<label class="wh-field"><span class="wh-field__label">Diastolic</span>' +
                '<input class="wh-input" type="number" id="hv-dia" min="30" max="180" inputmode="numeric" placeholder="80" /></label>' +
              '<label class="wh-field"><span class="wh-field__label">Resting HR</span>' +
                '<input class="wh-input" type="number" id="hv-hr" min="25" max="220" inputmode="numeric" placeholder="60" /></label>' +
              '<label class="wh-field"><span class="wh-field__label">Weight (' + U.massLabel() + ")</span>" +
                '<input class="wh-input" type="number" id="hv-weight" min="' + mass.min + '" max="' + mass.max +
                  '" step="0.1" inputmode="decimal" placeholder="' + ph.w + '" /></label>' +
              '<label class="wh-field"><span class="wh-field__label">Waist (' + U.lenLabel() + ")</span>" +
                '<input class="wh-input" type="number" id="hv-waist" min="' + len.min + '" max="' + len.max +
                  '" step="0.5" inputmode="decimal" placeholder="' + ph.waist + '" /></label>' +
              '<label class="wh-field"><span class="wh-field__label">Temp (' + U.tempLabel() + ")</span>" +
                '<input class="wh-input" type="number" id="hv-temp" min="' + temp.min + '" max="' + temp.max +
                  '" step="0.1" inputmode="decimal" placeholder="' + ph.t + '" /></label>' +
              '<label class="wh-field"><span class="wh-field__label">SpO₂ (%)</span>' +
                '<input class="wh-input" type="number" id="hv-spo2" min="50" max="100" inputmode="numeric" placeholder="98" /></label>' +
            "</div>" +
            '<label class="wh-field wh-mt4"><span class="wh-field__label">Note (optional)</span>' +
              '<input class="wh-input" type="text" id="hv-note" maxlength="80" placeholder="after coffee, post-run…" /></label>' +
            '<button type="button" class="wh-btn wh-btn--primary wh-btn--block wh-mt4" id="hv-save">' +
              Hub.icon("check") + "Save reading</button>" +
          "</div>" +

          /* ---------- latest values ---------- */
          '<div class="wh-card">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("pulse") + "Latest</div></div>" +
            (entries.length
              ? '<div class="wh-stack wh-stack--sm">' + METRICS.map(function (m) {
                  var e = latest[m.key];
                  if (!e) return "";
                  var band = m.band(e);
                  return '<div class="wh-vital">' +
                    '<span class="wh-vital__ic" style="color:' + m.color + '">' + Hub.icon(m.icon) + "</span>" +
                    '<span class="wh-grow"><span class="wh-vital__label">' + m.label + "</span>" +
                      '<span class="wh-vital__meta">' + Hub.relDay(e.date) + (e.time ? " · " + e.time : "") + "</span></span>" +
                    '<span class="wh-vital__value">' + m.value(e) + "<small>" + unitOf(m) + "</small></span>" +
                    (band ? '<span class="wh-chip wh-chip--' + band.tone + '">' + Hub.esc(band.label) + "</span>" : "") +
                  "</div>";
                }).join("") + "</div>"
              : '<div class="wh-empty">' + Hub.icon("pulse") + "<strong>Nothing recorded yet</strong>" +
                "Save a reading and your latest values and trends appear here.</div>") +
          "</div>" +
        "</div>" +

        /* ---------- trends ---------- */
        (entries.length >= 2 ? '<h2 class="wh-h2 wh-mb4">Trends</h2>' +
          '<div class="wh-grid wh-grid--2 wh-mb4">' + METRICS.map(function (m) {
            var series = entries.slice().reverse()
              .map(function (e) { return { date: e.date, v: m.chartValue(e) }; })
              .filter(function (p) { return p.v != null; });
            if (series.length < 2) return "";
            return '<div class="wh-card wh-card--tight">' +
              '<div class="wh-card__head"><div class="wh-card__title" style="color:' + m.color + '">' +
                m.label + "</div>" +
                '<span class="wh-chip mono">' + series.length + " readings</span></div>" +
              sparkline(series, m.color, unitOf(m)) +
              '<p class="wh-help wh-mt4">' + Hub.esc(noteOf(m)) + "</p>" +
            "</div>";
          }).join("") + "</div>" : "") +

        /* ---------- history ---------- */
        '<div class="wh-card">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("clockIc") + "History</div>" +
            '<span class="wh-chip">' + entries.length + " " + Hub.plural(entries.length, "entry", "entries") + "</span></div>" +
          (entries.length
            ? '<div class="wh-loglist">' + entries.slice(0, 20).map(function (e) {
                var bits = METRICS.map(function (m) {
                  var v = m.value(e);
                  return v == null ? "" : '<span class="wh-chip mono">' + m.short + " " + v + "</span>";
                }).join("");
                return '<div class="wh-logrow">' +
                  '<span class="wh-logrow__date">' + Hub.prettyDate(e.date) + "</span>" +
                  '<span class="wh-grow">' + bits +
                    (e.note ? ' <span class="wh-xs wh-faint">' + Hub.esc(e.note) + "</span>" : "") + "</span>" +
                  '<button type="button" class="wh-logrow__del" data-delvital="' + e.id + '" ' +
                    'aria-label="Delete reading from ' + Hub.prettyDate(e.date) + '">' + Hub.icon("trash") + "</button>" +
                "</div>";
              }).join("") + "</div>"
            : '<p class="wh-sm wh-faint">No readings yet.</p>') +
        "</div>" +

        '<div class="wh-disclaimer wh-mt4">' + Hub.icon("alert") +
          "<span>The ranges shown are <strong>general adult reference bands, not a diagnosis</strong>. " +
          "They don't account for your age, medication, conditions or context, and consumer devices vary in " +
          "accuracy. Use this to spot patterns and to have a better-informed conversation with a clinician — " +
          "never to decide whether something needs attention. If you feel unwell, seek care regardless of what " +
          "a number says.</span></div>";
    },

    wire: function (el) {
      el.querySelector("#hv-save").addEventListener("click", function () {
        var U = Hub.units;
        function num(id) {
          var v = parseFloat(el.querySelector(id).value);
          return isFinite(v) ? v : null;
        }
        var date = el.querySelector("#hv-date").value;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = Hub.viewDate();
        if (Hub.daysBetween(date, Hub.today()) < 0) {
          Hub.toast("You can't record a reading in the future.", "warn");
          return;
        }

        /* Typed values are in the user's units; storage is always metric. */
        var rec = {
          id: "v" + Date.now(),
          date: date,
          time: el.querySelector("#hv-time").value || null,
          sys: num("#hv-sys"), dia: num("#hv-dia"), hr: num("#hv-hr"),
          weightKg: round3(U.massIn(num("#hv-weight"))),
          waistCm: round3(U.lenIn(num("#hv-waist"))),
          tempC: round3(U.tempIn(num("#hv-temp"))),
          spo2: num("#hv-spo2"),
          note: el.querySelector("#hv-note").value.trim() || null
        };

        var hasAny = METRICS.some(function (m) { return m.value(rec) != null; });
        if (!hasAny) { Hub.toast("Fill in at least one measurement.", "warn"); return; }
        /* Half a blood-pressure reading is not a blood-pressure reading. */
        if ((rec.sys && !rec.dia) || (rec.dia && !rec.sys)) {
          Hub.toast("Blood pressure needs both numbers.", "warn");
          return;
        }

        Hub.state.logs.vitals.push(rec);
        Hub.commit();
        Hub.beep(700, 90);
        Hub.toast("Reading saved for " + Hub.prettyDate(date) + ".", "success");
      });

      /* A reading is a measurement you can't retake — worth one confirmation. */
      Hub.delegate(el, "[data-delvital]", function (b) {
        var id = b.dataset.delvital;
        var e = (Hub.state.logs.vitals || []).filter(function (x) { return x.id === id; })[0];
        if (!e) return;
        Hub.confirm({
          title: "Delete this reading?",
          body: "The reading from <strong>" + Hub.prettyDate(e.date) + "</strong> will be removed. " +
                "This can't be undone.",
          confirmLabel: "Delete",
          onConfirm: function () {
            Hub.state.logs.vitals = Hub.state.logs.vitals.filter(function (x) { return x.id !== id; });
            Hub.commit();
            Hub.toast("Reading deleted.", "info", 2000);
          }
        });
      });
    }
  };

  /* Conversion leaves long tails (58 lb -> 26.308342…kg); three decimals is
     far below any scale's precision and keeps the JSON readable. */
  function round3(v) { return v == null ? null : Math.round(v * 1000) / 1000; }

  /* A small inline SVG trend line. Chart.js is loaded for the Fitness tab, but
     a six-point sparkline doesn't warrant a chart instance per metric. */
  function sparkline(series, color, unit) {
    var W = 300, H = 68, PAD = 4;
    var vals = series.map(function (p) { return p.v; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    /* A flat series would divide by zero — give it a nominal band. */
    if (max - min < 0.001) { max = max + 1; min = min - 1; }

    var pts = series.map(function (p, i) {
      var x = PAD + (i / (series.length - 1)) * (W - PAD * 2);
      var y = H - PAD - ((p.v - min) / (max - min)) * (H - PAD * 2);
      return [x, y];
    });
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var area = line + " L" + pts[pts.length - 1][0].toFixed(1) + " " + (H - PAD) + " L" + pts[0][0].toFixed(1) + " " + (H - PAD) + " Z";
    var last = series[series.length - 1], first = series[0];
    var delta = last.v - first.v;

    return '<svg class="wh-spark" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img" ' +
        'aria-label="Trend from ' + first.v + " to " + last.v + " " + unit + '">' +
        '<path d="' + area + '" fill="' + color + '" opacity=".12"/>' +
        '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2" ' +
          'stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
        '<circle cx="' + pts[pts.length - 1][0].toFixed(1) + '" cy="' + pts[pts.length - 1][1].toFixed(1) +
          '" r="3" fill="' + color + '"/>' +
      "</svg>" +
      '<div class="wh-row wh-row--between mono wh-xs wh-mt4">' +
        '<span class="wh-faint">' + Hub.relDay(first.date) + " · " + first.v + unit + "</span>" +
        '<span style="color:' + color + '">' + last.v + unit +
          (Math.abs(delta) > 0.001 ? " (" + (delta > 0 ? "+" : "") + Math.round(delta * 10) / 10 + ")" : "") + "</span>" +
      "</div>";
  }

  /* ======================================================================
     VO2 MAX
     ----------------------------------------------------------------------
     A VO2max number is only as good as how it was obtained, so every entry
     carries a `source` and that source stays visible next to the value
     everywhere it's shown. A watch estimate and a lab test differ by more
     than the change you'd be looking for between them, so a history that
     mixed them without saying which was which would be worse than no
     history. The Cooper test calculator below fills the form; it never
     saves on its own.
     ====================================================================== */

  /* The plausible human range. Below ~10 is incompatible with walking to the
     kitchen; the highest values ever measured in elite endurance athletes sit
     in the high 90s. Anything outside this is a data-entry error, not a
     reading — and the Cooper calculator is held to the same range as the save
     path so it can never print a number the form would then refuse. */
  var VO2_MIN = 10, VO2_MAX = 95;

  var VO2_SOURCES = [
    { key: "device", label: "Device/watch estimate" },
    { key: "field",  label: "Field-test estimate" },
    { key: "lab",    label: "Lab-measured" }
  ];
  function vo2SourceLabel(key) {
    return (VO2_SOURCES.filter(function (s) { return s.key === key; })[0] || {}).label || "Unknown source";
  }

  /* Cooper-Institute-style general-population norms, ml/kg/min, by sex and
     ten-year age band (`max` is the last age the row covers: ≤29, ≤39, ≤49,
     ≤59, then everyone older). These are widely published approximations,
     not a lab-calibrated reference — the disclaimer on the tab says so.

     Published norms start at 20. Anyone younger falls into the ≤29 row,
     which is the closest available and is flagged in the UI rather than
     passed off as a band that was written for them. */
  var VO2_NORMS = {
    male: [
      { max: 29, bands: [25, 34, 43, 53, 60] },
      { max: 39, bands: [23, 31, 39, 49, 56] },
      { max: 49, bands: [20, 27, 36, 45, 53] },
      { max: 59, bands: [18, 25, 34, 43, 50] },
      { max: 999, bands: [16, 23, 31, 41, 46] }
    ],
    female: [
      { max: 29, bands: [24, 31, 38, 49, 55] },
      { max: 39, bands: [20, 28, 34, 45, 50] },
      { max: 49, bands: [17, 24, 31, 42, 48] },
      { max: 59, bands: [15, 21, 28, 38, 44] },
      { max: 999, bands: [13, 18, 24, 35, 41] }
    ]
  };
  var VO2_CATS = ["Very poor", "Poor", "Fair", "Good", "Excellent", "Superior"];

  function vo2Age() {
    var dob = (Hub.state.logs.profile || {}).dob;
    return dob ? Math.floor(Hub.daysBetween(dob, Hub.today()) / 365.25) : null;
  }

  function vo2Band(value, sex, age) {
    var table = VO2_NORMS[sex] || VO2_NORMS.male;
    var row = table.filter(function (r) { return age <= r.max; })[0] || table[table.length - 1];
    var idx = row.bands.filter(function (b) { return value >= b; }).length; // 0..5
    var tones = ["bad", "bad", "warn", "good", "good", "good"];
    return { label: VO2_CATS[idx], tone: tones[idx] };
  }

  function vo2BandLine(value) {
    var age = vo2Age();
    if (age == null) return '<p class="wh-help wh-mt4">Add your date of birth on the ' +
      '<strong>Profile</strong> pill to see where this sits against age-based reference bands.</p>';

    /* Published norms begin at 20, so a younger reader is being compared
       against the nearest table rather than one written for their age. */
    var young = age < 20
      ? '<p class="wh-help">These norms start at age 20, so you\'re being read against the ' +
        "20–29 band — treat the category as rough.</p>"
      : "";

    var gender = (Hub.state.settings.profile || {}).gender;
    if (gender === "male" || gender === "female") {
      var b = vo2Band(value, gender, age);
      return '<p class="wh-sm wh-mt4"><span class="wh-chip wh-chip--' + b.tone + '">' + b.label +
        '</span> <span class="wh-faint">for a ' + age + '-year-old ' + gender + ' (general population norms)</span></p>' + young;
    }

    /* No gender on file, or "other" — an identity answer picks a default,
       it never gates content, so both categories are shown rather than guessed. */
    var bm = vo2Band(value, "male", age), bf = vo2Band(value, "female", age);
    return '<p class="wh-sm wh-mt4">' +
      '<span class="wh-chip wh-chip--' + bm.tone + '">' + bm.label + ' (male norms)</span> ' +
      '<span class="wh-chip wh-chip--' + bf.tone + '">' + bf.label + ' (female norms)</span></p>' +
      '<p class="wh-help">No sex on file to pick one table, so both are shown — set it in ' +
      'Settings if you\'d rather see one.</p>' + young;
  }

  /* ----------------------------------------------------------------------
     RAISING IT
     The training half. The protocols and the 8-week plan live in the running
     module (`fitness/basalt.js`, goal `vo2max`) because that's where plan
     generation, the interval timer, the calendar and the run log already are.
     This card is the guide plus a way in, so the number and the thing that
     moves the number aren't in two tabs pretending the other doesn't exist.
     -------------------------------------------------------------------- */

  var VO2_PROTOCOLS = [
    ["Norwegian 4×4", "4 min hard / 3 min easy × 4",
     "The most-studied VO2 max session there is. Roughly a 7% gain over 8 weeks in Helgerud's 2007 trial, beating the same volume run continuously."],
    ["30/30", "30s hard / 30s easy × 12–20",
     "Billat's protocol. Reaches the same territory as 4×4 at a fraction of the mental cost, which makes it the way in rather than a weaker option."],
    ["Threshold", "20 min comfortably hard",
     "Raises how much of your ceiling you can actually hold. Supports the number; doesn't move it much alone."],
    ["Zone 2 base", "45–70 min conversational",
     "The unglamorous 80%. Stroke volume and mitochondrial density get built here, and they're what let the hard days be hard enough to count."]
  ];

  function vo2TrainingCard() {
    var R = (window.App && App.run) ? App.run : null;
    var active = R && R.isActive() ? R.goalDef() : null;
    var onVo2 = active && active.id === "vo2max";

    var status;
    if (!R) {
      status = '<p class="wh-sm wh-faint">The training plan lives in the Fitness tab.</p>';
    } else if (onVo2) {
      var wk = R.currentWeek() + 1, total = R.totalWeeks();
      var next = R.nextRun && R.nextRun();
      status = '<div class="wh-row wh-row--between wh-mb4">' +
          '<span class="wh-chip wh-chip--good">Week ' + wk + " of " + total + "</span>" +
          (wk >= total ? '<span class="wh-chip wh-chip--warn">Re-test week</span>' : "") +
        "</div>" +
        (next && next.sess
          ? '<p class="wh-sm">Next: <strong>' + Hub.esc(next.sess.title) + "</strong>" +
            (next.dateISO ? ' <span class="wh-faint">· ' + Hub.esc(Hub.relDay(next.dateISO)) + "</span>" : "") + "</p>"
          : "") +
        '<button type="button" class="wh-btn wh-btn--sm wh-btn--primary wh-mt4" id="hc-goplan">Open the plan</button>';
    } else if (active) {
      status = '<p class="wh-sm wh-muted">You\'re running the <strong>' + Hub.esc(active.name) +
        "</strong> plan right now. Finish it before switching — a half-done block is worth more " +
        "than two started ones.</p>" +
        '<button type="button" class="wh-btn wh-btn--sm wh-mt4" id="hc-goplan">See running plans</button>';
    } else {
      status = '<p class="wh-sm wh-muted">An 8-week plan is ready: two base weeks, then one hard ' +
        "session a week, a deload at week 4, and a Cooper re-test at week 8 that logs straight back " +
        "into this page.</p>" +
        '<button type="button" class="wh-btn wh-btn--sm wh-btn--primary wh-mt4" id="hc-goplan">Start the 8-week plan</button>';
    }

    return '<div class="wh-card wh-mb4">' +
        '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("flame") + "Raising it</div>" +
          '<span class="wh-chip">8 weeks · 3 runs/week</span></div>' +

        '<div class="wh-stack wh-stack--sm wh-mb4">' + VO2_PROTOCOLS.map(function (p) {
          return '<div class="wh-vital">' +
            '<span class="wh-grow"><span class="wh-vital__label">' + p[0] + "</span>" +
              '<span class="wh-vital__meta">' + Hub.esc(p[2]) + "</span></span>" +
            '<span class="wh-chip mono">' + Hub.esc(p[1]) + "</span>" +
          "</div>";
        }).join("") + "</div>" +

        status +

        '<div class="wh-disclaimer wh-mt4">' + Hub.icon("alert") +
          "<span><strong>How much this will do for you is genuinely unknown until you re-test.</strong> " +
          "Given identical training, measured gains across people range from around zero to over 40% — " +
          "in the HERITAGE study, 20 weeks of the same prescription produced almost the full spread, and " +
          "a real minority barely moved. Most people gain something. Nobody can tell you in advance which " +
          "group you're in, which is exactly why week 8 is a re-test and not a congratulations screen. " +
          "Hard intervals also need a base under them: if you're not already running easily for 25 minutes, " +
          "do the First 5K or Stamina plan first.</span></div>" +
      "</div>";
  }

  var vo2max = {
    render: function () {
      var entries = (Hub.state.logs.vo2max || []).slice().sort(function (a, b) {
        return b.date < a.date ? -1 : 1;
      });
      var latest = entries[0] || null;
      var series = entries.slice().reverse().map(function (e) { return { date: e.date, v: e.value }; });

      return vo2TrainingCard() +

        '<div class="wh-grid wh-grid--2 wh-mb4">' +
          /* ---------- Cooper test calculator ---------- */
          '<div class="wh-card">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("wind") + "Cooper test estimate</div></div>" +
            '<p class="wh-sm wh-muted wh-mb4">Run as far as you can in <strong>12 minutes</strong>, flat out but ' +
              "sustainable, then enter the distance. No watch estimate or lab test needed.</p>" +
            '<label class="wh-field"><span class="wh-field__label">Distance covered (km)</span>' +
              '<input class="wh-input" type="number" id="hc-dist" min="0.5" max="6" step="0.01" ' +
              'inputmode="decimal" placeholder="2.40" /></label>' +
            '<button type="button" class="wh-btn wh-btn--sm wh-mt4" id="hc-calc">' + Hub.icon("lungs") + "Calculate</button>" +
            '<div id="hc-result" class="wh-mt4"></div>' +
          "</div>" +

          /* ---------- entry form ---------- */
          '<div class="wh-card wh-card--accent">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("plus") + "New reading</div></div>" +
            '<div class="wh-grid wh-grid--2" style="gap:var(--wh-s3)">' +
              '<label class="wh-field"><span class="wh-field__label">Date</span>' +
                '<input class="wh-input" type="date" id="hc-date" value="' + Hub.viewDate() +
                  '" max="' + Hub.today() + '" /></label>' +
              '<label class="wh-field"><span class="wh-field__label">VO2max (ml/kg/min)</span>' +
                '<input class="wh-input" type="number" id="hc-value" min="' + VO2_MIN + '" max="' + VO2_MAX + '" step="0.1" ' +
                'inputmode="decimal" placeholder="42.0" /></label>' +
            "</div>" +
            '<label class="wh-field wh-mt4"><span class="wh-field__label">Source</span>' +
              '<select class="wh-input" id="hc-source">' + VO2_SOURCES.map(function (s) {
                return '<option value="' + s.key + '">' + s.label + "</option>";
              }).join("") + "</select></label>" +
            '<label class="wh-field wh-mt4"><span class="wh-field__label">Note (optional)</span>' +
              '<input class="wh-input" type="text" id="hc-note" maxlength="80" placeholder="race, treadmill test…" /></label>' +
            '<button type="button" class="wh-btn wh-btn--primary wh-btn--block wh-mt4" id="hc-save">' +
              Hub.icon("check") + "Save reading</button>" +
          "</div>" +
        "</div>" +

        /* ---------- latest + trend ---------- */
        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("wind") + "Latest</div></div>" +
          (latest
            ? '<div class="wh-vital">' +
                '<span class="wh-vital__ic" style="color:var(--blue-bright)">' + Hub.icon("wind") + "</span>" +
                '<span class="wh-grow"><span class="wh-vital__label">VO2max</span>' +
                  '<span class="wh-vital__meta">' + Hub.relDay(latest.date) + " · " + vo2SourceLabel(latest.source) + "</span></span>" +
                '<span class="wh-vital__value">' + latest.value + "<small> ml/kg/min</small></span>" +
              "</div>" + vo2BandLine(latest.value) +
              (series.length >= 2 ? sparkline(series, "var(--blue-bright)", " ml/kg/min") : "")
            : '<div class="wh-empty">' + Hub.icon("wind") + "<strong>Nothing recorded yet</strong>" +
              "Run the Cooper test above, copy a number from your watch, or enter a lab result.</div>") +
        "</div>" +

        /* ---------- history ---------- */
        '<div class="wh-card">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("clockIc") + "History</div>" +
            '<span class="wh-chip">' + entries.length + " " + Hub.plural(entries.length, "reading") + "</span></div>" +
          (entries.length
            ? '<div class="wh-loglist">' + entries.slice(0, 20).map(function (e) {
                return '<div class="wh-logrow">' +
                  '<span class="wh-logrow__date">' + Hub.prettyDate(e.date) + "</span>" +
                  '<span class="wh-grow"><span class="wh-chip mono">' + e.value + " ml/kg/min</span> " +
                    '<span class="wh-chip">' + vo2SourceLabel(e.source) + "</span>" +
                    (e.note ? ' <span class="wh-xs wh-faint">' + Hub.esc(e.note) + "</span>" : "") + "</span>" +
                  '<button type="button" class="wh-logrow__del" data-delvo2="' + e.id + '" ' +
                    'aria-label="Delete reading from ' + Hub.prettyDate(e.date) + '">' + Hub.icon("trash") + "</button>" +
                "</div>";
              }).join("") + "</div>"
            : '<p class="wh-sm wh-faint">No readings yet.</p>') +
        "</div>" +

        '<div class="wh-disclaimer wh-mt4">' + Hub.icon("alert") +
          "<span>The reference bands are <strong>general adult population norms, not a diagnosis</strong>, " +
          "and don't account for training history, altitude or health conditions. The Cooper test formula " +
          "carries a real margin of error — commonly cited at around <strong>±3.5 ml/kg/min</strong> against a " +
          "lab-measured value — and a watch estimate has its own, usually undisclosed, error. That's why every " +
          "reading keeps its source: a device estimate, a field test and a lab test are not the same precision, " +
          "and treating them as interchangeable would hide that.</span></div>";
    },

    wire: function (el) {
      /* Hand off to the running module. If no plan is running, pre-select the
         VO2 max goal so the chooser opens on the one they came here for —
         but never auto-start it: picking a training block is the user's call,
         not a side effect of tapping a link. */
      var go = el.querySelector("#hc-goplan");
      if (go) go.addEventListener("click", function () {
        Hub.show("fitness");
        setTimeout(function () {
          if (window.App && App.showSection) App.showSection("running");
        }, 60);
      });

      el.querySelector("#hc-calc").addEventListener("click", function () {
        var km = parseFloat(el.querySelector("#hc-dist").value);
        var out = el.querySelector("#hc-result");
        if (!isFinite(km) || km <= 0) {
          out.innerHTML = '<p class="wh-sm wh-faint">Enter the distance you covered.</p>';
          return;
        }
        var vo2 = (km * 1000 - 504.9) / 44.73;
        vo2 = Math.round(vo2 * 10) / 10;

        /* The formula has a 504.9m intercept, so anything under about half a
           kilometre goes negative — and the field is in km while every
           published version of the test states the distance in metres, which
           makes "2400" a genuinely easy thing to type. Say which it is rather
           than printing an impossible number. */
        if (vo2 < VO2_MIN || vo2 > VO2_MAX) {
          out.innerHTML = '<p class="wh-sm wh-chip wh-chip--warn" style="display:inline-block">' +
              "That gives " + vo2 + " ml/kg/min</p>" +
            '<p class="wh-help wh-mt4">Outside the plausible range of ' + VO2_MIN + "–" + VO2_MAX +
              " ml/kg/min, so it hasn't been offered. " +
              (km > 100
                ? "Did you mean <strong>" + (Math.round(km / 10) / 100) + " km</strong>? This field is in " +
                  "kilometres — the test is usually written up in metres."
                : "Check the distance — the Cooper test is 12 minutes of running.") + "</p>";
          return;
        }

        out.innerHTML = '<div class="wh-vital">' +
            '<span class="wh-vital__value">' + vo2 + "<small> ml/kg/min</small></span>" +
          "</div>" +
          '<p class="wh-help">±3.5 ml/kg/min against a lab test. ' +
            '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" id="hc-use">Use this value</button></p>';
        el.querySelector("#hc-use").addEventListener("click", function () {
          el.querySelector("#hc-value").value = vo2;
          el.querySelector("#hc-source").value = "field";
          el.querySelector("#hc-value").focus();
        });
      });

      el.querySelector("#hc-save").addEventListener("click", function () {
        var date = el.querySelector("#hc-date").value;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = Hub.viewDate();
        if (Hub.daysBetween(date, Hub.today()) < 0) {
          Hub.toast("You can't record a reading in the future.", "warn");
          return;
        }
        var value = parseFloat(el.querySelector("#hc-value").value);
        if (!isFinite(value) || value < VO2_MIN || value > VO2_MAX) {
          Hub.toast("Enter a VO2max between " + VO2_MIN + " and " + VO2_MAX + " ml/kg/min.", "warn");
          return;
        }

        Hub.state.logs.vo2max.push({
          id: "o" + Date.now(),
          date: date,
          value: Math.round(value * 10) / 10,
          source: el.querySelector("#hc-source").value,
          note: el.querySelector("#hc-note").value.trim() || null
        });
        Hub.commit();
        Hub.beep(700, 90);
        Hub.toast("Reading saved for " + Hub.prettyDate(date) + ".", "success");
      });

      Hub.delegate(el, "[data-delvo2]", function (b) {
        var id = b.dataset.delvo2;
        var e = (Hub.state.logs.vo2max || []).filter(function (x) { return x.id === id; })[0];
        if (!e) return;
        Hub.confirm({
          title: "Delete this reading?",
          body: "The reading from <strong>" + Hub.prettyDate(e.date) + "</strong> will be removed. This can't be undone.",
          confirmLabel: "Delete",
          onConfirm: function () {
            Hub.state.logs.vo2max = Hub.state.logs.vo2max.filter(function (x) { return x.id !== id; });
            Hub.commit();
            Hub.toast("Reading deleted.", "info", 2000);
          }
        });
      });
    }
  };

  /* ======================================================================
     LAB RESULTS
     ----------------------------------------------------------------------
     You could already schedule "Blood work" every twelve months and record
     precisely nothing from it. This is the other half: the actual numbers,
     kept over years, which is the only way a drifting marker ever becomes
     visible to you rather than to whoever happens to read this year's printout.

     Reference ranges are shown as text exactly as your lab printed them —
     deliberately NOT interpreted, because reference intervals are
     lab-specific, assay-specific, and often age- and sex-specific.
     ====================================================================== */

  /* Common markers, so the usual panel is picking from a list rather than
     typing "haemoglobin" correctly six times over six years. Any marker not
     here can still be entered freehand. */
  var MARKER_LIBRARY = [
    { group: "Lipids", items: [
      { key: "chol", label: "Total cholesterol", unit: "mmol/L" },
      { key: "ldl", label: "LDL cholesterol", unit: "mmol/L" },
      { key: "hdl", label: "HDL cholesterol", unit: "mmol/L" },
      { key: "trig", label: "Triglycerides", unit: "mmol/L" }
    ] },
    { group: "Metabolic", items: [
      { key: "glucose", label: "Fasting glucose", unit: "mmol/L" },
      { key: "hba1c", label: "HbA1c", unit: "mmol/mol" },
      { key: "insulin", label: "Fasting insulin", unit: "pmol/L" }
    ] },
    { group: "Blood count", items: [
      { key: "hb", label: "Haemoglobin", unit: "g/L" },
      { key: "wbc", label: "White cells", unit: "10⁹/L" },
      { key: "plt", label: "Platelets", unit: "10⁹/L" },
      { key: "ferritin", label: "Ferritin", unit: "µg/L" }
    ] },
    { group: "Organs & hormones", items: [
      { key: "alt", label: "ALT", unit: "U/L" },
      { key: "creat", label: "Creatinine", unit: "µmol/L" },
      { key: "egfr", label: "eGFR", unit: "mL/min" },
      { key: "tsh", label: "TSH", unit: "mIU/L" },
      { key: "vitd", label: "Vitamin D", unit: "nmol/L" },
      { key: "b12", label: "Vitamin B12", unit: "pmol/L" },
      { key: "testosterone", label: "Testosterone", unit: "nmol/L" },
      { key: "crp", label: "CRP", unit: "mg/L" }
    ] }
  ];

  function markerByKey(key) {
    var found = null;
    MARKER_LIBRARY.forEach(function (g) {
      g.items.forEach(function (m) { if (m.key === key) found = m; });
    });
    return found;
  }

  var labs = {
    render: function () {
      var list = (Hub.state.logs.labs || []).slice().sort(function (a, b) {
        return a.date < b.date ? 1 : -1;
      });

      /* Which markers have more than one reading — those are the ones with a
         trend worth drawing. */
      var byMarker = {};
      list.slice().reverse().forEach(function (l) {
        (l.values || []).forEach(function (v) {
          var n = parseFloat(v.value);
          if (!isFinite(n)) return;
          (byMarker[v.key || v.label] = byMarker[v.key || v.label] || {
            label: v.label || v.key, unit: v.unit || "", points: []
          }).points.push({ date: l.date, v: n });
        });
      });
      var trended = Object.keys(byMarker).filter(function (k) { return byMarker[k].points.length >= 2; });

      return '<div class="wh-grid wh-grid--3 wh-mb4">' +
          '<div class="wh-stat"><div class="wh-stat__label">Panels</div>' +
            '<div class="wh-stat__value">' + list.length + "</div>" +
            '<div class="wh-stat__sub">recorded</div></div>' +
          '<div class="wh-stat"><div class="wh-stat__label">Markers tracked</div>' +
            '<div class="wh-stat__value">' + Object.keys(byMarker).length + "</div>" +
            '<div class="wh-stat__sub">' + trended.length + " with a trend</div></div>" +
          '<div class="wh-stat"><div class="wh-stat__label">Most recent</div>' +
            '<div class="wh-stat__value" style="font-size:20px">' +
              (list.length ? Hub.esc(Hub.relDay(list[0].date)) : "—") + "</div>" +
            '<div class="wh-stat__sub">' + (list.length ? Hub.prettyDate(list[0].date) : "nothing yet") + "</div></div>" +
        "</div>" +

        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head">' +
            '<div class="wh-card__title">' + Hub.icon("flask") + "Results</div>" +
            '<button type="button" class="wh-btn wh-btn--sm wh-btn--primary" id="hl-add">' +
              Hub.icon("plus") + "Add a panel</button>" +
          "</div>" +

          (list.length
            ? '<div class="wh-stack wh-stack--sm">' + list.map(function (l) {
                return '<div class="wh-labpanel">' +
                  '<div class="wh-row wh-row--between">' +
                    "<div><div class=\"wh-setrow__name\">" + Hub.esc(l.panel || "Blood work") + "</div>" +
                      '<div class="wh-setrow__desc mono">' + Hub.prettyDate(l.date) + " · " +
                        Hub.esc(Hub.relDay(l.date)) + "</div></div>" +
                    '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" data-editlab="' + l.id + '">' +
                      Hub.icon("edit") + "Edit</button>" +
                  "</div>" +
                  '<div class="wh-labvals">' + (l.values || []).map(function (v) {
                    return '<div class="wh-labval">' +
                      '<span class="wh-labval__name">' + Hub.esc(v.label || v.key) + "</span>" +
                      '<span class="wh-labval__num mono">' + Hub.esc(String(v.value)) +
                        '<small> ' + Hub.esc(v.unit || "") + "</small></span>" +
                      (v.ref ? '<span class="wh-labval__ref mono">ref ' + Hub.esc(v.ref) + "</span>" : "") +
                    "</div>";
                  }).join("") + "</div>" +
                  (l.note ? '<p class="wh-help wh-mt4">' + Hub.esc(l.note) + "</p>" : "") +
                "</div>";
              }).join("") + "</div>"
            : '<div class="wh-empty">' + Hub.icon("flask") + "<strong>No results recorded</strong>" +
              "Next time you get blood work back, put the numbers in here. Two sets a year apart is " +
              "where this starts being worth more than the printout in a drawer.</div>") +
        "</div>" +

        /* ---------- trends across panels ---------- */
        (trended.length
          ? '<h2 class="wh-h2 wh-mb4">Markers over time</h2>' +
            '<div class="wh-grid wh-grid--2 wh-mb4">' + trended.map(function (k) {
              var m = byMarker[k];
              var series = m.points.map(function (p) { return { date: p.date, v: p.v }; });
              return '<div class="wh-card wh-card--tight">' +
                '<div class="wh-card__head"><div class="wh-card__title">' + Hub.esc(m.label) + "</div>" +
                  '<span class="wh-chip mono">' + series.length + " results</span></div>" +
                sparkline(series, "var(--wh-c-health)", m.unit ? " " + m.unit : "") +
              "</div>";
            }).join("") + "</div>"
          : "") +

        '<div class="wh-disclaimer">' + Hub.icon("alert") +
          "<span>Reference ranges are <strong>whatever your own lab printed</strong> — this app stores them " +
          "as text and never judges a value against them. Ranges differ between laboratories and assays, and " +
          "many depend on age, sex, pregnancy, medication and time of day. A result outside a range is often " +
          "normal for the person, and one inside it can still matter. <strong>Only the clinician who ordered " +
          "the test can interpret it.</strong> Keeping your own copy is about continuity across years and " +
          "practices — not about diagnosing yourself.</span></div>";
    },

    wire: function (el) {
      el.querySelector("#hl-add").addEventListener("click", function () { labDialog(null); });
      Hub.delegate(el, "[data-editlab]", function (b) {
        var l = (Hub.state.logs.labs || []).filter(function (x) { return x.id === b.dataset.editlab; })[0];
        if (l) labDialog(l);
      });
    }
  };

  function labDialog(existing) {
    var l = existing || {
      id: "lab" + Date.now(), date: Hub.viewDate(), panel: "Blood work", note: "", values: []
    };
    /* Work on a copy so cancelling really cancels. */
    var draft = { values: (l.values || []).map(function (v) { return Object.assign({}, v); }) };

    Hub.modal({
      title: existing ? "Edit results" : "Add lab results",
      body:
        '<div class="wh-grid wh-grid--2" style="gap:var(--wh-s3)">' +
          '<label class="wh-field"><span class="wh-field__label">Date drawn</span>' +
            '<input class="wh-input" id="lb-date" type="date" value="' + (l.date || Hub.today()) +
              '" max="' + Hub.today() + '" /></label>' +
          '<label class="wh-field"><span class="wh-field__label">Panel</span>' +
            '<input class="wh-input" id="lb-panel" type="text" maxlength="48" value="' + Hub.esc(l.panel || "") +
              '" placeholder="e.g. Annual bloods" /></label>' +
        "</div>" +

        '<div class="wh-field wh-mt4"><span class="wh-field__label">Add a marker</span>' +
          '<select class="wh-input" id="lb-pick">' +
            '<option value="">Choose from the usual list…</option>' +
            MARKER_LIBRARY.map(function (g) {
              return '<optgroup label="' + Hub.esc(g.group) + '">' + g.items.map(function (m) {
                return '<option value="' + m.key + '">' + Hub.esc(m.label) + " (" + Hub.esc(m.unit) + ")</option>";
              }).join("") + "</optgroup>";
            }).join("") +
            '<option value="__custom">Something else…</option>' +
          "</select></div>" +

        '<div id="lb-rows" class="wh-mt4"></div>' +

        '<label class="wh-field wh-mt4"><span class="wh-field__label">Note</span>' +
          '<input class="wh-input" id="lb-note" type="text" maxlength="120" value="' + Hub.esc(l.note || "") +
            '" placeholder="fasting, which clinic, anything the doctor said" /></label>',
      actions: [
        existing ? { label: "Delete", variant: "danger", onClick: function () {
          Hub.state.logs.labs = Hub.state.logs.labs.filter(function (x) { return x.id !== l.id; });
          Hub.commit();
          Hub.toast("Panel removed.", "info", 2000);
        } } : { label: "Cancel", variant: "ghost" },
        { label: "Save", variant: "primary", close: false, onClick: function () {
          var date = document.getElementById("lb-date").value;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { Hub.toast("Pick a date.", "warn"); return; }
          readRows();
          var values = draft.values.filter(function (v) {
            return v.label && String(v.value).trim() !== "" && isFinite(parseFloat(v.value));
          });
          if (!values.length) { Hub.toast("Add at least one marker with a number.", "warn"); return; }

          l.date = date;
          l.panel = document.getElementById("lb-panel").value.trim() || "Blood work";
          l.note = document.getElementById("lb-note").value.trim();
          l.values = values;
          if (!existing) Hub.state.logs.labs.push(l);

          Hub.closeModal();
          Hub.commit();
          Hub.toast("Results saved.", "success", 2200);
        } }
      ],
      onOpen: function (body) {
        var rows = body.querySelector("#lb-rows");
        var pick = body.querySelector("#lb-pick");

        function paint() {
          rows.innerHTML = draft.values.length
            ? '<div class="wh-xs wh-faint wh-mb4">Markers in this panel</div>' +
              draft.values.map(function (v, i) {
                return '<div class="wh-labrow" data-i="' + i + '">' +
                  '<input class="wh-input wh-labrow__name" data-f="label" value="' + Hub.esc(v.label) +
                    '" aria-label="Marker name" />' +
                  '<input class="wh-input wh-labrow__v" data-f="value" inputmode="decimal" value="' +
                    Hub.esc(String(v.value == null ? "" : v.value)) + '" aria-label="Value" placeholder="0" />' +
                  '<input class="wh-input wh-labrow__u" data-f="unit" value="' + Hub.esc(v.unit || "") +
                    '" aria-label="Unit" placeholder="unit" />' +
                  '<input class="wh-input wh-labrow__r" data-f="ref" value="' + Hub.esc(v.ref || "") +
                    '" aria-label="Reference range from your lab" placeholder="ref range" />' +
                  '<button type="button" class="wh-logrow__del" data-rm="' + i + '" ' +
                    'aria-label="Remove marker">' + Hub.icon("trash") + "</button>" +
                "</div>";
              }).join("")
            : '<p class="wh-help">Nothing added yet — pick a marker above.</p>';
        }

        /* Pull whatever is currently typed back into the draft before any
           re-render, so adding a second marker can't wipe the first. */
        function readRows() {
          rows.querySelectorAll(".wh-labrow").forEach(function (row) {
            var i = Number(row.dataset.i);
            if (!draft.values[i]) return;
            row.querySelectorAll("[data-f]").forEach(function (inp) {
              draft.values[i][inp.dataset.f] = inp.value.trim();
            });
          });
        }
        labDialog._read = readRows;

        pick.addEventListener("change", function () {
          var v = pick.value;
          if (!v) return;
          readRows();
          if (v === "__custom") draft.values.push({ key: "", label: "", value: "", unit: "", ref: "" });
          else {
            var m = markerByKey(v);
            if (m) draft.values.push({ key: m.key, label: m.label, value: "", unit: m.unit, ref: "" });
          }
          pick.value = "";
          paint();
          /* Focus the value box of the row just added — the label and unit are
             already filled in, so the number is the only thing to type. */
          var last = rows.querySelector(".wh-labrow:last-child [data-f='value']");
          if (last) last.focus();
        });

        rows.addEventListener("click", function (e) {
          var btn = e.target.closest("[data-rm]");
          if (!btn) return;
          readRows();
          draft.values.splice(Number(btn.dataset.rm), 1);
          paint();
        });

        paint();
      }
    });

    function readRows() { if (typeof labDialog._read === "function") labDialog._read(); }
  }

  /* ======================================================================
     CHECK-UPS
     ====================================================================== */
  var checkups = {
    render: function () {
      var list = Hub.state.logs.checkups || [];
      var rows = list.map(function (c) {
        var s = Hub.gamify.checkupStatus(c);
        var tone = s.state === "overdue" ? "bad" : (s.state === "soon" ? "warn" : (s.state === "ok" ? "good" : ""));
        var status = s.state === "never" ? "never logged"
          : (s.state === "overdue" ? Math.abs(s.days) + " days overdue"
          : "due in " + s.days + " days");

        return '<div class="wh-checkup' + (s.state === "overdue" ? " is-overdue" : "") + '">' +
          '<div class="wh-grow">' +
            '<div class="wh-checkup__name">' + Hub.esc(c.name) + "</div>" +
            '<div class="wh-checkup__note">' + Hub.esc(c.note || "") + "</div>" +
            '<div class="wh-checkup__meta mono">every ' + s.months + " months" +
              (c.lastISO ? " · last " + Hub.prettyDate(c.lastISO) : "") + "</div>" +
          "</div>" +
          '<span class="wh-chip' + (tone ? " wh-chip--" + tone : "") + '">' + status + "</span>" +
          '<div class="wh-checkup__actions">' +
            '<button type="button" class="wh-btn wh-btn--sm wh-btn--primary" data-didcheck="' + c.id + '">Done today</button>' +
            '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" data-editcheck="' + c.id + '">Edit</button>' +
          "</div>" +
        "</div>";
      }).join("");

      var overdue = list.filter(function (c) { return Hub.gamify.checkupStatus(c).state === "overdue"; }).length;
      var never = list.filter(function (c) { return !c.lastISO; }).length;

      return '<div class="wh-grid wh-grid--3 wh-mb4">' +
          '<div class="wh-stat"><div class="wh-stat__label">Tracked</div>' +
            '<div class="wh-stat__value">' + list.length + "</div>" +
            '<div class="wh-stat__sub">recurring items</div></div>' +
          '<div class="wh-stat"><div class="wh-stat__label">Overdue</div>' +
            '<div class="wh-stat__value" style="color:' + (overdue ? "var(--red-bright)" : "var(--green-bright)") + '">' +
              overdue + "</div>" +
            '<div class="wh-stat__sub">' + (overdue ? "worth booking" : "all current") + "</div></div>" +
          '<div class="wh-stat"><div class="wh-stat__label">Never logged</div>' +
            '<div class="wh-stat__value">' + never + "</div>" +
            '<div class="wh-stat__sub">add a last date to start</div></div>' +
        "</div>" +

        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("calendar") + "Recurring check-ups</div>" +
            '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" id="hc-add">' + Hub.icon("plus") + "Add</button></div>" +
          '<div class="wh-stack wh-stack--sm">' + rows + "</div>" +
        "</div>" +

        '<div class="wh-disclaimer">' + Hub.icon("alert") +
          "<span>These intervals are <strong>common general-population defaults, not personal medical " +
          "advice</strong>. What's right for you depends on your age, history, risk factors and where you live — " +
          "your doctor or dentist may recommend something quite different, and you should follow them over this. " +
          "Edit any interval to match what you've actually been told. Screenings this list doesn't cover " +
          "(cervical, bowel, breast, prostate and others) are age- and country-specific — ask your clinician " +
          "which apply to you.</span></div>";
    },

    wire: function (el) {
      Hub.delegate(el, "[data-didcheck]", function (b) {
        var c = find(b.dataset.didcheck);
        if (!c) return;
        c.lastISO = Hub.today();
        Hub.commit();
        Hub.beep(700, 90);
        Hub.toast(c.name + " logged for today.", "success");
      });

      Hub.delegate(el, "[data-editcheck]", function (b) { editDialog(find(b.dataset.editcheck)); });
      el.querySelector("#hc-add").addEventListener("click", function () { editDialog(null); });

      function find(id) {
        return (Hub.state.logs.checkups || []).filter(function (c) { return c.id === id; })[0];
      }
    }
  };

  function editDialog(existing) {
    var c = existing || { id: "c" + Date.now(), name: "", intervalMonths: 12, lastISO: null, note: "" };
    Hub.modal({
      title: existing ? "Edit check-up" : "Add a check-up",
      body:
        '<label class="wh-field"><span class="wh-field__label">Name</span>' +
          '<input class="wh-input" id="ck-name" type="text" maxlength="48" value="' + Hub.esc(c.name) + '" ' +
          'placeholder="e.g. Physiotherapy review" /></label>' +
        '<div class="wh-grid wh-grid--2 wh-mt4" style="gap:var(--wh-s3)">' +
          '<label class="wh-field"><span class="wh-field__label">Every (months)</span>' +
            '<input class="wh-input" id="ck-int" type="number" min="1" max="120" value="' + c.intervalMonths + '" /></label>' +
          '<label class="wh-field"><span class="wh-field__label">Last done</span>' +
            '<input class="wh-input" id="ck-last" type="date" value="' + (c.lastISO || "") + '" /></label>' +
        "</div>" +
        '<label class="wh-field wh-mt4"><span class="wh-field__label">Note</span>' +
          '<input class="wh-input" id="ck-note" type="text" maxlength="120" value="' + Hub.esc(c.note || "") + '" /></label>',
      actions: [
        existing ? { label: "Delete", variant: "danger", onClick: function () {
          Hub.state.logs.checkups = Hub.state.logs.checkups.filter(function (x) { return x.id !== c.id; });
          Hub.commit();
          Hub.toast("Removed.", "info", 2000);
        } } : { label: "Cancel", variant: "ghost" },
        { label: "Save", variant: "primary", close: false, onClick: function () {
          var name = document.getElementById("ck-name").value.trim();
          var interval = Math.round(Number(document.getElementById("ck-int").value));
          var last = document.getElementById("ck-last").value;
          if (!name) { Hub.toast("Give it a name.", "warn"); return; }
          if (!(interval >= 1 && interval <= 120)) { Hub.toast("Interval must be 1–120 months.", "warn"); return; }

          c.name = name;
          c.intervalMonths = interval;
          c.lastISO = /^\d{4}-\d{2}-\d{2}$/.test(last) ? last : null;
          c.note = document.getElementById("ck-note").value.trim();
          if (!existing) Hub.state.logs.checkups.push(c);

          Hub.closeModal();
          Hub.commit();
          Hub.toast("Saved.", "success", 2000);
        } }
      ]
    });
  }

  /* ======================================================================
     MEDS & SUPPLEMENTS
     ====================================================================== */
  var SLOTS = [
    { key: "am", label: "Morning" },
    { key: "noon", label: "Midday" },
    { key: "pm", label: "Evening" },
    { key: "bed", label: "Bedtime" }
  ];

  /* Scheduled items only — a PRN ("as needed") item has no daily slot and
     must never count against an adherence streak. */
  function scheduledMeds() {
    return Hub.gamify.activeMeds().filter(function (m) { return !m.prn; });
  }
  function prnMeds() {
    return Hub.gamify.activeMeds().filter(function (m) { return !!m.prn; });
  }

  /* How many days of supply are left at the current rate, or null if the item
     isn't being counted. */
  function supplyDays(m) {
    if (m.supply == null || !isFinite(m.supply)) return null;
    var perDay = m.prn ? (Number(m.typicalPerDay) || 0) : (m.slots || ["am"]).length * (Number(m.perDose) || 1);
    if (!perDay) return null;
    return Math.floor(Number(m.supply) / perDay);
  }

  var meds = {
    render: function () {
      var list = Hub.state.logs.meds || [];
      var active = scheduledMeds();
      var prn = prnMeds();
      var d = Hub.day();
      var ticks = d.meds || {};
      var st = (Hub.state.streaks && Hub.state.streaks.meds) || { current: 0, best: 0 };

      var totalDue = active.reduce(function (n, m) { return n + (m.slots || ["am"]).length; }, 0);
      var taken = active.reduce(function (n, m) {
        return n + (m.slots || ["am"]).filter(function (s) { return ticks[m.id + ":" + s]; }).length;
      }, 0);

      /* Anything about to run out, soonest first. */
      var running = Hub.gamify.activeMeds().map(function (m) {
        return { m: m, days: supplyDays(m) };
      }).filter(function (x) { return x.days != null && x.days <= 14; })
        .sort(function (a, b) { return a.days - b.days; });

      return '<div class="wh-grid wh-grid--3 wh-mb4">' +
          '<div class="wh-stat"><div class="wh-stat__label">Today</div>' +
            '<div class="wh-stat__value">' + taken + "/" + totalDue + "</div>" +
            '<div class="wh-stat__sub">doses ticked off</div></div>' +
          '<div class="wh-stat"><div class="wh-stat__label">Streak</div>' +
            '<div class="wh-stat__value">' + st.current + "<small>days</small></div>" +
            '<div class="wh-stat__sub">best ' + st.best + "</div></div>" +
          '<div class="wh-stat"><div class="wh-stat__label">Tracked</div>' +
            '<div class="wh-stat__value">' + active.length + "</div>" +
            '<div class="wh-stat__sub">of ' + list.length + " " + Hub.plural(list.length, "item") + "</div></div>" +
        "</div>" +

        /* ---------- running out ---------- */
        (running.length
          ? '<div class="wh-card wh-mb4">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("alert") +
              "Running low</div></div>" +
            '<div class="wh-stack wh-stack--sm">' + running.map(function (x) {
              var tone = x.days <= 3 ? "bad" : (x.days <= 7 ? "warn" : "");
              return '<div class="wh-logrow">' +
                '<span class="wh-logrow__main">' + Hub.esc(x.m.name) + "</span>" +
                '<span class="wh-xs wh-faint">' + Hub.esc(x.m.dose || "") + "</span>" +
                '<span class="wh-chip' + (tone ? " wh-chip--" + tone : "") + '" style="margin-left:auto">' +
                  (x.days <= 0 ? "out" : x.days + " " + Hub.plural(x.days, "day") + " left") + "</span>" +
                '<button type="button" class="wh-btn wh-btn--sm" data-refill="' + x.m.id + '">Refilled</button>' +
              "</div>";
            }).join("") + "</div>" +
            '<p class="wh-help wh-mt4">Counted down from the quantity you entered, at your ' +
              "scheduled rate. Tap <strong>Refilled</strong> when you pick up a new pack.</p>" +
          "</div>"
          : "") +

        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("pill") + "Today's doses</div>" +
            '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" id="hm-add">' + Hub.icon("plus") + "Add item</button></div>" +
          (active.length
            ? SLOTS.map(function (slot) {
                var inSlot = active.filter(function (m) { return (m.slots || ["am"]).indexOf(slot.key) !== -1; });
                if (!inSlot.length) return "";
                return '<div class="wh-mt4"><div class="wh-h3 wh-mb4">' + slot.label + "</div>" +
                  '<div class="wh-stack wh-stack--sm">' + inSlot.map(function (m) {
                    var key = m.id + ":" + slot.key;
                    var on = !!ticks[key];
                    return '<button type="button" class="wh-check' + (on ? " is-done" : "") + '" ' +
                        'data-dose="' + key + '" aria-pressed="' + on + '">' +
                      '<span class="wh-check__box">' + Hub.icon("check") + "</span>" +
                      '<span class="wh-check__text">' + Hub.esc(m.name) +
                        '<span class="wh-check__sub">' + Hub.esc(m.dose || "") +
                        (m.note ? " · " + Hub.esc(m.note) : "") + "</span></span>" +
                      '<span class="wh-check__edit" data-editmed="' + m.id + '" role="button" tabindex="0" ' +
                        'aria-label="Edit ' + Hub.esc(m.name) + '">' + Hub.icon("settings") + "</span>" +
                    "</button>";
                  }).join("") + "</div></div>";
              }).join("")
            : '<div class="wh-empty">' + Hub.icon("pill") + "<strong>Nothing tracked yet</strong>" +
              "Add your medications, vitamins or supplements and they'll appear here as a daily checklist.</div>") +
        "</div>" +

        /* ---------- as-needed ---------- */
        (prn.length
          ? '<div class="wh-card wh-mb4">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("clockIc") +
              "As needed</div>" +
              '<span class="wh-chip">' + prnTakenToday(prn, ticks) + " taken today</span></div>" +
            '<p class="wh-sm wh-muted wh-mb4">These have no schedule, so they never count for or against ' +
              "your adherence streak. Log a dose when you actually take one — a painkiller you're reaching " +
              "for four days a week is worth noticing.</p>" +
            '<div class="wh-stack wh-stack--sm">' + prn.map(function (m) {
              var n = Number(ticks["prn:" + m.id]) || 0;
              var week = prnCountLastDays(m.id, 7);
              return '<div class="wh-check' + (n ? " is-done" : "") + '">' +
                '<span class="wh-check__text">' + Hub.esc(m.name) +
                  '<span class="wh-check__sub">' + Hub.esc(m.dose || "") +
                  (m.note ? " · " + Hub.esc(m.note) : "") +
                  (week ? " · " + week + " in the last 7 days" : "") + "</span></span>" +
                '<span class="wh-row" style="margin-left:auto;gap:6px">' +
                  '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" data-prn="' + m.id +
                    '" data-delta="-1"' + (n ? "" : " disabled") + ">" + Hub.icon("minus") + "</button>" +
                  '<span class="mono" style="min-width:2ch;text-align:center">' + n + "</span>" +
                  '<button type="button" class="wh-btn wh-btn--sm" data-prn="' + m.id + '" data-delta="1">' +
                    Hub.icon("plus") + "</button>" +
                  '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" data-editmed="' + m.id + '" ' +
                    'aria-label="Edit ' + Hub.esc(m.name) + '">' + Hub.icon("settings") + "</button>" +
                "</span>" +
              "</div>";
            }).join("") + "</div>" +
          "</div>"
          : "") +

        (list.filter(function (m) { return m.active === false; }).length
          ? '<div class="wh-card wh-mb4">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("clockIc") + "Paused</div></div>" +
            '<div class="wh-stack wh-stack--sm">' + list.filter(function (m) { return m.active === false; }).map(function (m) {
              return '<div class="wh-logrow"><span class="wh-logrow__main">' + Hub.esc(m.name) + "</span>" +
                '<span class="wh-xs wh-faint">' + Hub.esc(m.dose || "") + "</span>" +
                '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" style="margin-left:auto" ' +
                  'data-editmed="' + m.id + '">Edit</button></div>';
            }).join("") + "</div></div>"
          : "") +

        '<div class="wh-disclaimer">' + Hub.icon("alert") +
          "<span>This is a <strong>reminder checklist, not a medication manager</strong>. It doesn't know your " +
          "doses, won't check interactions, and can't tell you whether to take something. Never start, stop or " +
          "change a medication based on this app — that's a conversation with your doctor or pharmacist. " +
          "Supplements interact with medications too; mention everything you take.</span></div>";
    },

    wire: function (el) {
      Hub.delegate(el, "[data-dose]", function (b, e) {
        /* The edit affordance lives inside the row, so don't toggle when it's
           the thing that was clicked. */
        if (e.target.closest("[data-editmed]")) return;
        var d = Hub.editDay();
        var key = b.dataset.dose;
        var med = medById(key.split(":")[0]);
        if (d.meds[key]) {
          delete d.meds[key];
          adjustSupply(med, +1);          // un-ticking puts the dose back
        } else {
          d.meds[key] = true;
          adjustSupply(med, -1);
        }
        Hub.commit();
        if (d.meds[key]) { Hub.beep(700, 85); Hub.gamify.checkMilestone("meds"); }
      });

      /* As-needed doses are a count, not a tick. */
      Hub.delegate(el, "[data-prn]", function (b) {
        var id = b.dataset.prn;
        var delta = Number(b.dataset.delta) || 1;
        var d = Hub.editDay();
        var key = "prn:" + id;
        var next = Math.max(0, (Number(d.meds[key]) || 0) + delta);
        if (next) d.meds[key] = next; else delete d.meds[key];
        adjustSupply(medById(id), -delta);
        Hub.commit();
        if (delta > 0) Hub.beep(690, 85);
      });

      Hub.delegate(el, "[data-refill]", function (b) {
        var m = medById(b.dataset.refill);
        if (!m) return;
        refillDialog(m);
      });

      Hub.delegate(el, "[data-editmed]", function (b) {
        var m = medById(b.dataset.editmed);
        if (m) medDialog(m);
      });

      el.querySelector("#hm-add").addEventListener("click", function () { medDialog(null); });
    }
  };

  function medById(id) {
    return (Hub.state.logs.meds || []).filter(function (x) { return x.id === id; })[0];
  }

  /* Keep the supply count honest as doses are ticked, but only when the user
     asked for a count in the first place. */
  function adjustSupply(m, delta) {
    if (!m || m.supply == null || !isFinite(m.supply)) return;
    var per = Number(m.perDose) || 1;
    m.supply = Math.max(0, Math.round((Number(m.supply) + delta * per) * 100) / 100);
  }

  function prnTakenToday(list, ticks) {
    return list.reduce(function (n, m) { return n + (Number(ticks["prn:" + m.id]) || 0); }, 0);
  }

  function prnCountLastDays(id, days) {
    var n = 0;
    for (var i = 0; i < days; i++) {
      var d = Hub.day(Hub.shiftDay(Hub.today(), -i));
      n += Number((d.meds || {})["prn:" + id]) || 0;
    }
    return n;
  }

  function refillDialog(m) {
    Hub.modal({
      title: "Refilled " + m.name,
      body:
        '<p class="wh-sm wh-muted">How many are in the new pack? This replaces the running count ' +
          "rather than adding to it, which is what you want if the old pack ran out.</p>" +
        '<label class="wh-field wh-mt4"><span class="wh-field__label">Quantity</span>' +
          '<input class="wh-input" id="rf-qty" type="number" min="0" max="10000" step="1" ' +
          'value="' + (Number(m.packSize) || 30) + '" /></label>',
      actions: [
        { label: "Cancel", variant: "ghost" },
        { label: "Save", variant: "primary", close: false, onClick: function () {
          var q = Math.round(Number(document.getElementById("rf-qty").value));
          if (!(q >= 0 && q <= 10000)) { Hub.toast("Enter a quantity between 0 and 10000.", "warn"); return; }
          m.supply = q;
          m.packSize = q;
          m.lastRefillISO = Hub.today();
          Hub.closeModal();
          Hub.commit();
          Hub.toast("Supply updated.", "success", 2200);
        } }
      ]
    });
  }

  function medDialog(existing) {
    var m = existing || {
      id: "m" + Date.now(), name: "", dose: "", note: "", slots: ["am"], active: true,
      prn: false, perDose: 1, supply: null, packSize: null
    };
    Hub.modal({
      title: existing ? "Edit item" : "Add medication or supplement",
      body:
        '<label class="wh-field"><span class="wh-field__label">Name</span>' +
          '<input class="wh-input" id="md-name" type="text" maxlength="48" value="' + Hub.esc(m.name) + '" ' +
          'placeholder="e.g. Vitamin D3" /></label>' +
        '<label class="wh-field wh-mt4"><span class="wh-field__label">Dose</span>' +
          '<input class="wh-input" id="md-dose" type="text" maxlength="32" value="' + Hub.esc(m.dose || "") + '" ' +
          'placeholder="e.g. 1000 IU" /></label>' +

        '<label class="wh-switch wh-mt6"><input type="checkbox" id="md-prn"' + (m.prn ? " checked" : "") + " />" +
          '<span class="wh-switch__track"></span>' +
          '<span class="wh-switch__label">Take as needed, not on a schedule</span></label>' +
        '<p class="wh-help">An as-needed item is logged when you take one, and is left out of the ' +
          "adherence streak entirely — missing a painkiller you didn't need isn't a miss.</p>" +

        '<div class="wh-field wh-mt4" id="md-slotwrap"><span class="wh-field__label">When</span>' +
          '<div class="wh-row" id="md-slots" style="flex-wrap:wrap">' + SLOTS.map(function (s) {
            var on = (m.slots || []).indexOf(s.key) !== -1;
            return '<button type="button" class="wh-btn wh-btn--sm' + (on ? " wh-btn--primary" : " wh-btn--ghost") + '" ' +
              'data-slot="' + s.key + '" aria-pressed="' + on + '">' + s.label + "</button>";
          }).join("") + "</div></div>" +

        '<div class="wh-grid wh-grid--2 wh-mt4" style="gap:var(--wh-s3)">' +
          '<label class="wh-field"><span class="wh-field__label">Units per dose</span>' +
            '<input class="wh-input" id="md-per" type="number" min="1" max="20" step="1" value="' +
              (Number(m.perDose) || 1) + '" /></label>' +
          '<label class="wh-field"><span class="wh-field__label">How many left</span>' +
            '<input class="wh-input" id="md-supply" type="number" min="0" max="10000" step="1" value="' +
              (m.supply == null ? "" : m.supply) + '" placeholder="optional" /></label>' +
        "</div>" +
        '<p class="wh-help">Fill in a quantity and the app counts it down as you tick doses off, ' +
          "then warns you a fortnight before it runs out. Leave it blank to skip that.</p>" +

        '<label class="wh-field wh-mt4"><span class="wh-field__label">Note</span>' +
          '<input class="wh-input" id="md-note" type="text" maxlength="80" value="' + Hub.esc(m.note || "") + '" ' +
          'placeholder="with food, etc." /></label>' +
        (existing
          ? '<label class="wh-switch wh-mt6"><input type="checkbox" id="md-active"' + (m.active !== false ? " checked" : "") + " />" +
            '<span class="wh-switch__track"></span><span class="wh-switch__label">Currently taking this</span></label>'
          : ""),
      actions: [
        existing ? { label: "Delete", variant: "danger", onClick: function () {
          Hub.state.logs.meds = Hub.state.logs.meds.filter(function (x) { return x.id !== m.id; });
          Hub.commit();
          Hub.toast("Removed.", "info", 2000);
        } } : { label: "Cancel", variant: "ghost" },
        { label: "Save", variant: "primary", close: false, onClick: function () {
          var name = document.getElementById("md-name").value.trim();
          if (!name) { Hub.toast("Give it a name.", "warn"); return; }
          var prn = document.getElementById("md-prn").checked;
          var slots = Array.prototype.map.call(
            document.querySelectorAll('#md-slots [data-slot][aria-pressed="true"]'),
            function (b) { return b.dataset.slot; });
          if (!prn && !slots.length) { Hub.toast("Pick at least one time of day.", "warn"); return; }

          var supplyRaw = document.getElementById("md-supply").value.trim();
          var supply = supplyRaw === "" ? null : Math.round(Number(supplyRaw));
          if (supply != null && !(supply >= 0 && supply <= 10000)) {
            Hub.toast("Quantity must be between 0 and 10000.", "warn");
            return;
          }

          m.name = name;
          m.dose = document.getElementById("md-dose").value.trim();
          m.note = document.getElementById("md-note").value.trim();
          m.prn = prn;
          m.slots = prn ? [] : slots;
          m.perDose = Math.max(1, Math.round(Number(document.getElementById("md-per").value) || 1));
          m.supply = supply;
          if (supply != null && !m.packSize) m.packSize = supply;
          var act = document.getElementById("md-active");
          m.active = act ? act.checked : true;
          if (!existing) Hub.state.logs.meds.push(m);

          Hub.closeModal();
          Hub.commit();
          Hub.toast("Saved.", "success", 2000);
        } }
      ],
      onOpen: function (body) {
        body.querySelectorAll("[data-slot]").forEach(function (b) {
          b.addEventListener("click", function () {
            var on = b.getAttribute("aria-pressed") !== "true";
            b.setAttribute("aria-pressed", on);
            b.classList.toggle("wh-btn--primary", on);
            b.classList.toggle("wh-btn--ghost", !on);
          });
        });
        /* Slots are meaningless for an as-needed item — hide rather than
           leave a control that silently does nothing. */
        var prnBox = body.querySelector("#md-prn");
        var wrap = body.querySelector("#md-slotwrap");
        function sync() { wrap.style.display = prnBox.checked ? "none" : ""; }
        prnBox.addEventListener("change", sync);
        sync();
      }
    });
  }

  /* ======================================================================
     MEDICAL PROFILE
     ----------------------------------------------------------------------
     The static facts. A tab called "Health Records" that couldn't tell you
     your own blood type or who to call was missing the part that matters
     most on the worst day.
     ====================================================================== */
  var BLOOD_TYPES = ["", "O−", "O+", "A−", "A+", "B−", "B+", "AB−", "AB+", "Unknown"];

  var SEVERITIES = [
    { key: "mild", label: "Mild" },
    { key: "moderate", label: "Moderate" },
    { key: "severe", label: "Severe / anaphylaxis" }
  ];

  var profile = {
    render: function () {
      var p = Hub.state.logs.profile || {};
      var U = Hub.units;
      var age = p.dob ? Math.floor(Hub.daysBetween(p.dob, Hub.today()) / 365.25) : null;

      function listCard(opts) {
        return '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head">' +
            '<div class="wh-card__title">' + Hub.icon(opts.icon) + opts.title + "</div>" +
            '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" data-addprofile="' + opts.kind + '">' +
              Hub.icon("plus") + "Add</button>" +
          "</div>" +
          (opts.items.length
            ? '<div class="wh-stack wh-stack--sm">' + opts.items.join("") + "</div>"
            : '<p class="wh-sm wh-faint">' + opts.empty + "</p>") +
          (opts.note ? '<p class="wh-help wh-mt4">' + opts.note + "</p>" : "") +
        "</div>";
      }

      var allergies = (p.allergies || []).map(function (a) {
        var tone = a.severity === "severe" ? "bad" : (a.severity === "moderate" ? "warn" : "");
        return '<div class="wh-logrow">' +
          '<span class="wh-logrow__main">' + Hub.esc(a.what) + "</span>" +
          '<span class="wh-xs wh-faint">' + Hub.esc(a.reaction || "") + "</span>" +
          '<span class="wh-chip' + (tone ? " wh-chip--" + tone : "") + '" style="margin-left:auto">' +
            Hub.esc((SEVERITIES.filter(function (s) { return s.key === a.severity; })[0] || {}).label || "—") + "</span>" +
          '<button type="button" class="wh-logrow__del" data-delprofile="allergies:' + a.id + '" ' +
            'aria-label="Remove ' + Hub.esc(a.what) + '">' + Hub.icon("trash") + "</button>" +
        "</div>";
      });

      var conditions = (p.conditions || []).map(function (c) {
        return '<div class="wh-logrow">' +
          '<span class="wh-logrow__main">' + Hub.esc(c.what) + "</span>" +
          '<span class="wh-xs wh-faint">' + (c.since ? "since " + Hub.esc(c.since) : "") +
            (c.note ? " · " + Hub.esc(c.note) : "") + "</span>" +
          '<button type="button" class="wh-logrow__del" style="margin-left:auto" ' +
            'data-delprofile="conditions:' + c.id + '" aria-label="Remove ' + Hub.esc(c.what) + '">' +
            Hub.icon("trash") + "</button>" +
        "</div>";
      });

      var emergency = (p.emergency || []).map(function (e) {
        return '<div class="wh-logrow">' +
          '<span class="wh-logrow__main">' + Hub.esc(e.name) + "</span>" +
          '<span class="wh-xs wh-faint">' + Hub.esc(e.relation || "") + "</span>" +
          '<span class="mono wh-sm" style="margin-left:auto">' + Hub.esc(e.phone || "") + "</span>" +
          '<button type="button" class="wh-logrow__del" data-delprofile="emergency:' + e.id + '" ' +
            'aria-label="Remove ' + Hub.esc(e.name) + '">' + Hub.icon("trash") + "</button>" +
        "</div>";
      });

      var vaccinations = (p.vaccinations || []).slice().sort(function (a, b) {
        return (b.dateISO || "") < (a.dateISO || "") ? -1 : 1;
      }).map(function (v) {
        var due = null;
        if (v.dateISO && v.boosterMonths) {
          var d = Hub.parseYmd(v.dateISO);
          due = Hub.ymd(new Date(d.getFullYear(), d.getMonth() + Number(v.boosterMonths), d.getDate()));
        }
        var overdue = due && Hub.daysBetween(Hub.today(), due) < 0;
        return '<div class="wh-logrow">' +
          '<span class="wh-logrow__main">' + Hub.esc(v.name) + "</span>" +
          '<span class="wh-xs wh-faint">' + (v.dateISO ? Hub.prettyDate(v.dateISO) : "date unknown") +
            (v.note ? " · " + Hub.esc(v.note) : "") + "</span>" +
          (due ? '<span class="wh-chip' + (overdue ? " wh-chip--warn" : "") + '" style="margin-left:auto">' +
            (overdue ? "booster due" : "next " + Hub.prettyDate(due)) + "</span>" : "") +
          '<button type="button" class="wh-logrow__del" ' + (due ? "" : 'style="margin-left:auto" ') +
            'data-delprofile="vaccinations:' + v.id + '" aria-label="Remove ' + Hub.esc(v.name) + '">' +
            Hub.icon("trash") + "</button>" +
        "</div>";
      });

      return '<div class="wh-card wh-card--accent wh-mb4">' +
          '<div class="wh-card__head">' +
            '<div class="wh-card__title">' + Hub.icon("idCard") + "The basics</div>" +
            '<button type="button" class="wh-btn wh-btn--sm" id="hp-print">' +
              Hub.icon("printer") + "Summary for an appointment</button>" +
          "</div>" +
          '<div class="wh-grid wh-grid--3" style="gap:var(--wh-s3)">' +
            '<label class="wh-field"><span class="wh-field__label">Date of birth</span>' +
              '<input class="wh-input" type="date" id="hp-dob" value="' + (p.dob || "") +
                '" max="' + Hub.today() + '" /></label>' +
            '<label class="wh-field"><span class="wh-field__label">Blood type</span>' +
              '<select class="wh-input" id="hp-blood">' + BLOOD_TYPES.map(function (b) {
                return '<option value="' + b + '"' + (p.bloodType === b ? " selected" : "") + ">" +
                  (b || "—") + "</option>";
              }).join("") + "</select></label>" +
            '<label class="wh-field"><span class="wh-field__label">Height (' + U.lenLabel() + ")</span>" +
              '<input class="wh-input" type="number" id="hp-height" step="0.5" value="' +
                (p.heightCm ? U.lenOut(p.heightCm) : "") + '" placeholder="optional" /></label>' +
          "</div>" +
          '<div class="wh-row wh-row--between wh-mt4">' +
            '<span class="wh-sm wh-muted">' + (age != null ? age + " years old" : "Age fills in from your date of birth") + "</span>" +
            '<label class="wh-switch"><input type="checkbox" id="hp-donor"' + (p.organDonor ? " checked" : "") + " />" +
              '<span class="wh-switch__track"></span><span class="wh-switch__label">Registered organ donor</span></label>' +
          "</div>" +
          '<label class="wh-field wh-mt4"><span class="wh-field__label">Anything else worth knowing</span>' +
            '<input class="wh-input" type="text" id="hp-notes" maxlength="200" value="' + Hub.esc(p.notes || "") +
              '" placeholder="implants, devices, a condition a paramedic should know about" /></label>' +
          '<button type="button" class="wh-btn wh-btn--primary wh-mt4" id="hp-save">' +
            Hub.icon("check") + "Save basics</button>" +
        "</div>" +

        listCard({
          kind: "allergies", icon: "alert", title: "Allergies &amp; intolerances", items: allergies,
          empty: "Nothing recorded. Worth filling in even if it's only hay fever — the ones that matter are drug allergies.",
          note: "If you carry adrenaline, say so in the note. This app can't call anyone for you."
        }) +

        listCard({
          kind: "conditions", icon: "pulse", title: "Ongoing conditions", items: conditions,
          empty: "Nothing recorded."
        }) +

        listCard({
          kind: "emergency", icon: "bell", title: "Emergency contacts", items: emergency,
          empty: "No contacts yet. One name and one number is enough."
        }) +

        listCard({
          kind: "vaccinations", icon: "shield", title: "Vaccinations", items: vaccinations,
          empty: "Nothing recorded. Tetanus and the seasonal flu are the two most people can never remember.",
          note: "Set a booster interval and the next date is worked out for you."
        }) +

        '<div class="wh-disclaimer">' + Hub.icon("alert") +
          "<span>This is <strong>your own note to yourself</strong>, not a medical record. Nobody else can " +
          "see it, no emergency service can read it off your phone, and it isn't verified by anyone. Keep the " +
          "official version with your doctor, and if you rely on something here in an emergency — a severe " +
          "allergy, an implanted device — carry it on a card or a bracelet as well.</span></div>";
    },

    wire: function (el) {
      var U = Hub.units;
      el.querySelector("#hp-save").addEventListener("click", function () {
        var p = Hub.state.logs.profile;
        var dob = el.querySelector("#hp-dob").value;
        p.dob = /^\d{4}-\d{2}-\d{2}$/.test(dob) ? dob : null;
        p.bloodType = el.querySelector("#hp-blood").value;
        var h = parseFloat(el.querySelector("#hp-height").value);
        p.heightCm = isFinite(h) ? round3(U.lenIn(h)) : null;
        p.organDonor = el.querySelector("#hp-donor").checked;
        p.notes = el.querySelector("#hp-notes").value.trim();
        Hub.commit();
        Hub.toast("Profile saved.", "success", 2200);
      });

      el.querySelector("#hp-print").addEventListener("click", printSummary);

      Hub.delegate(el, "[data-addprofile]", function (b) { profileDialog(b.dataset.addprofile); });

      Hub.delegate(el, "[data-delprofile]", function (b) {
        var parts = b.dataset.delprofile.split(":");
        var kind = parts[0], id = parts[1];
        Hub.confirm({
          title: "Remove this entry?",
          body: "It'll be deleted from your profile.",
          confirmLabel: "Remove",
          onConfirm: function () {
            var p = Hub.state.logs.profile;
            p[kind] = (p[kind] || []).filter(function (x) { return x.id !== id; });
            Hub.commit();
            Hub.toast("Removed.", "info", 2000);
          }
        });
      });
    }
  };

  var PROFILE_FORMS = {
    allergies: {
      title: "Add an allergy",
      fields: [
        { id: "what", label: "What to", placeholder: "e.g. Penicillin, peanuts", max: 60, required: true },
        { id: "reaction", label: "Reaction", placeholder: "e.g. rash, swelling", max: 80 }
      ],
      extra: function () {
        return '<div class="wh-field wh-mt4"><span class="wh-field__label">Severity</span>' +
          '<select class="wh-input" id="pf-severity">' + SEVERITIES.map(function (s) {
            return '<option value="' + s.key + '">' + s.label + "</option>";
          }).join("") + "</select></div>";
      },
      collect: function (rec) { rec.severity = document.getElementById("pf-severity").value; }
    },
    conditions: {
      title: "Add a condition",
      fields: [
        { id: "what", label: "Condition", placeholder: "e.g. Asthma", max: 60, required: true },
        { id: "since", label: "Since", placeholder: "e.g. 2019", max: 20 },
        { id: "note", label: "Note", placeholder: "how it's managed", max: 120 }
      ]
    },
    emergency: {
      title: "Add an emergency contact",
      fields: [
        { id: "name", label: "Name", placeholder: "", max: 60, required: true },
        { id: "relation", label: "Relationship", placeholder: "e.g. partner, sister", max: 40 },
        { id: "phone", label: "Phone", placeholder: "", max: 32, required: true }
      ]
    },
    vaccinations: {
      title: "Add a vaccination",
      fields: [
        { id: "name", label: "Vaccine", placeholder: "e.g. Tetanus, Influenza", max: 60, required: true },
        { id: "note", label: "Note", placeholder: "batch, clinic, dose number", max: 80 }
      ],
      extra: function () {
        return '<div class="wh-grid wh-grid--2 wh-mt4" style="gap:var(--wh-s3)">' +
          '<label class="wh-field"><span class="wh-field__label">Date given</span>' +
            '<input class="wh-input" id="pf-date" type="date" max="' + Hub.today() + '" /></label>' +
          '<label class="wh-field"><span class="wh-field__label">Booster after (months)</span>' +
            '<input class="wh-input" id="pf-booster" type="number" min="0" max="600" placeholder="optional" /></label>' +
        "</div>";
      },
      collect: function (rec) {
        var d = document.getElementById("pf-date").value;
        rec.dateISO = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
        var b = Math.round(Number(document.getElementById("pf-booster").value));
        rec.boosterMonths = b > 0 ? b : null;
      }
    }
  };

  function profileDialog(kind) {
    var form = PROFILE_FORMS[kind];
    if (!form) return;

    Hub.modal({
      title: form.title,
      body: form.fields.map(function (f, i) {
        return '<label class="wh-field' + (i ? " wh-mt4" : "") + '"><span class="wh-field__label">' +
          Hub.esc(f.label) + "</span>" +
          '<input class="wh-input" id="pf-' + f.id + '" type="text" maxlength="' + f.max + '" ' +
          'placeholder="' + Hub.esc(f.placeholder || "") + '" /></label>';
      }).join("") + (form.extra ? form.extra() : ""),
      actions: [
        { label: "Cancel", variant: "ghost" },
        { label: "Add", variant: "primary", close: false, onClick: function () {
          var rec = { id: "p" + Date.now() + Math.random().toString(36).slice(2, 5) };
          var missing = null;
          form.fields.forEach(function (f) {
            var v = document.getElementById("pf-" + f.id).value.trim();
            if (f.required && !v && !missing) missing = f.label;
            rec[f.id] = v;
          });
          if (missing) { Hub.toast(missing + " is needed.", "warn"); return; }
          if (form.collect) form.collect(rec);

          Hub.state.logs.profile[kind].push(rec);
          Hub.closeModal();
          Hub.commit();
          Hub.toast("Added.", "success", 2000);
        } }
      ]
    });
  }

  /* ======================================================================
     PRINTABLE SUMMARY
     ----------------------------------------------------------------------
     The tab claims you should "turn up to appointments with data". A JSON
     backup is not that. This is one page a clinician will actually read:
     who you are, what you take, what you're allergic to, and the recent
     numbers with their dates.
     ====================================================================== */
  function printSummary() {
    var s = Hub.state;
    var p = s.logs.profile || {};
    var U = Hub.units;
    var age = p.dob ? Math.floor(Hub.daysBetween(p.dob, Hub.today()) / 365.25) : null;

    function esc(v) { return Hub.esc(v == null ? "" : v); }
    function section(title, inner) {
      return inner ? "<h2>" + title + "</h2>" + inner : "";
    }
    function ul(items) {
      return items.length ? "<ul>" + items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul>" : "";
    }

    /* Recent vitals: the latest of each metric, with its date, because a
       number without a date is useless in a consultation. */
    var entries = (s.logs.vitals || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var latest = METRICS.map(function (m) {
      var e = entries.filter(function (x) { return m.value(x) != null; })[0];
      return e ? "<li><b>" + esc(m.label) + ":</b> " + esc(m.value(e)) + " " + esc(unitOf(m)) +
        " <i>(" + esc(Hub.prettyDate(e.date)) + ")</i></li>" : "";
    }).filter(Boolean).join("");

    var medsList = Hub.gamify.activeMeds().map(function (m) {
      return "<li><b>" + esc(m.name) + "</b> " + esc(m.dose || "") +
        (m.prn ? " — as needed" : " — " + (m.slots || []).map(function (k) {
          return (SLOTS.filter(function (x) { return x.key === k; })[0] || {}).label || k;
        }).join(", ")) +
        (m.note ? " (" + esc(m.note) + ")" : "") + "</li>";
    });

    var allergyList = (p.allergies || []).map(function (a) {
      return "<li><b>" + esc(a.what) + "</b>" + (a.reaction ? " — " + esc(a.reaction) : "") +
        (a.severity ? " (" + esc(a.severity) + ")" : "") + "</li>";
    });

    var conditionList = (p.conditions || []).map(function (c) {
      return "<li><b>" + esc(c.what) + "</b>" + (c.since ? " since " + esc(c.since) : "") +
        (c.note ? " — " + esc(c.note) : "") + "</li>";
    });

    var vaccList = (p.vaccinations || []).slice().sort(function (a, b) {
      return (b.dateISO || "") < (a.dateISO || "") ? -1 : 1;
    }).map(function (v) {
      return "<li><b>" + esc(v.name) + "</b>" + (v.dateISO ? " — " + esc(Hub.prettyDate(v.dateISO)) : "") + "</li>";
    });

    var labList = (s.logs.labs || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; })
      .slice(0, 3).map(function (l) {
        return "<li><b>" + esc(l.panel || "Blood work") + "</b> — " + esc(Hub.prettyDate(l.date)) + "<br>" +
          (l.values || []).map(function (v) {
            return esc(v.label || v.key) + ": " + esc(v.value) + " " + esc(v.unit || "") +
              (v.ref ? " (ref " + esc(v.ref) + ")" : "");
          }).join("; ") + "</li>";
      });

    /* Most recent first, capped at three. Each one names how it was obtained —
       handing a clinician a bare number would imply a precision that a watch
       estimate doesn't have. */
    var vo2List = (s.logs.vo2max || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; })
      .slice(0, 3).map(function (v) {
        return "<li><b>" + esc(v.value) + " ml/kg/min</b> — " + esc(Hub.prettyDate(v.date)) +
          " (" + esc(vo2SourceLabel(v.source).toLowerCase()) + ")" +
          (v.note ? " — " + esc(v.note) : "") + "</li>";
      });

    var checkupList = (s.logs.checkups || []).map(function (c) {
      var st = Hub.gamify.checkupStatus(c);
      return "<li>" + esc(c.name) + " — " +
        (st.state === "never" ? "never logged"
          : st.state === "overdue" ? "<b>overdue by " + Math.abs(st.days) + " days</b>"
          : "last " + esc(Hub.prettyDate(c.lastISO))) + "</li>";
    });

    /* Recent sleep and mood, as context rather than as a claim. */
    var sleep7 = [];
    for (var i = 0; i < 14; i++) {
      var v = Hub.insights.SERIES.sleepHours.get(Hub.shiftDay(Hub.today(), -i));
      if (v != null) sleep7.push(v);
    }
    var avgSleep = sleep7.length
      ? (sleep7.reduce(function (a, b) { return a + b; }, 0) / sleep7.length).toFixed(1)
      : null;

    var html =
      "<!doctype html><html><head><meta charset='utf-8'><title>Health summary — " +
        esc(s.settings.name || "Wellness Hub") + "</title><style>" +
        "body{font:13px/1.55 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:760px;margin:28px auto;padding:0 20px}" +
        "h1{font-size:20px;margin:0 0 2px}h2{font-size:13px;text-transform:uppercase;letter-spacing:.07em;" +
        "color:#555;margin:20px 0 6px;border-bottom:1px solid #ddd;padding-bottom:3px}" +
        "ul{margin:6px 0;padding-left:20px}li{margin:2px 0}" +
        ".meta{color:#666;font-size:12px;margin-bottom:4px}" +
        ".note{margin-top:26px;padding:10px 12px;background:#f4f4f4;border-left:3px solid #999;" +
        "color:#333;font-size:11.5px}" +
        "@media print{body{margin:0}.noprint{display:none}}" +
        "</style></head><body>" +

        "<h1>" + esc(s.settings.name || "Health summary") + "</h1>" +
        "<div class='meta'>" +
          (age != null ? age + " years old · " : "") +
          (p.dob ? "born " + esc(Hub.prettyDate(p.dob)) + " · " : "") +
          (p.bloodType ? "blood type " + esc(p.bloodType) + " · " : "") +
          (p.heightCm ? esc(U.lenOut(p.heightCm)) + esc(U.lenLabel()) + " · " : "") +
          "prepared " + esc(new Date().toLocaleDateString()) +
        "</div>" +
        (p.notes ? "<div class='meta'><b>Note:</b> " + esc(p.notes) + "</div>" : "") +

        section("Allergies", ul(allergyList) || "<p>None recorded.</p>") +
        section("Ongoing conditions", ul(conditionList) || "<p>None recorded.</p>") +
        section("Current medication &amp; supplements", ul(medsList) || "<p>None recorded.</p>") +
        section("Recent measurements", latest ? "<ul>" + latest + "</ul>" : "<p>None recorded.</p>") +
        section("Recent lab results", ul(labList)) +
        section("VO2 max", ul(vo2List)) +
        section("Vaccinations", ul(vaccList)) +
        section("Check-ups", ul(checkupList)) +
        (avgSleep ? section("Context", "<ul><li>Sleep averaged <b>" + avgSleep +
          " h</b> over the last fortnight (self-reported, " + sleep7.length + " nights logged).</li></ul>") : "") +
        ((p.emergency || []).length
          ? section("Emergency contacts", ul((p.emergency || []).map(function (e) {
              return "<b>" + esc(e.name) + "</b>" + (e.relation ? " (" + esc(e.relation) + ")" : "") +
                " — " + esc(e.phone);
            })))
          : "") +

        "<div class='note'><b>Self-reported.</b> Every figure here was entered by hand into a personal " +
        "tracking app and measured with consumer devices. Nothing has been verified, and none of it comes " +
        "from a clinical system. Treat it as the patient's own account — useful for dates, trends and " +
        "what they're taking, not as a source of clinical measurements.</div>" +

        "<p class='noprint' style='margin-top:20px'>" +
        "<button onclick='window.print()'>Print</button></p>" +
        "</body></html>";

    var w = window.open("", "_blank");
    if (!w) {
      /* Pop-up blocked — fall back to a download so the work isn't lost. */
      Hub.storage.saveBlob(new Blob([html], { type: "text/html" }),
        "health-summary-" + Hub.today() + ".html");
      Hub.toast("Pop-up blocked — the summary was downloaded instead.", "warn", 5000);
      return;
    }
    w.document.write(html);
    w.document.close();
  }

  /* ======================================================================
     VIEW
     ====================================================================== */
  var SECTIONS = { vitals: vitals, vo2max: vo2max, labs: labs, checkups: checkups, meds: meds, profile: profile };

  function render(el) {
    var pill = currentPill();

    el.innerHTML =
      '<div class="wh-head">' +
        '<div class="wh-head__eyebrow">Health records</div>' +
        "<h1>Numbers and appointments</h1>" +
        "<p>A private place for the measurements and the medical admin — so you turn up to appointments " +
        "with data instead of guesses, and don't lose two years to a check-up you forgot to book.</p>" +
      "</div>" +

      '<div class="wh-pills" role="tablist">' + PILLS.map(function (p) {
        return '<button type="button" role="tab" class="wh-pill' + (p.id === pill ? " is-active" : "") + '" ' +
          'data-healthpill="' + p.id + '" aria-selected="' + (p.id === pill) + '">' +
          Hub.icon(p.icon) + "<span>" + p.label + "</span></button>";
      }).join("") + "</div>" +

      '<div id="wh-health-body">' + SECTIONS[pill].render() + "</div>";

    Hub.delegate(el, "[data-healthpill]", function (b) {
      Hub.uiSet("healthPill", b.dataset.healthpill);
      Hub.refresh();
    });
    SECTIONS[pill].wire(el.querySelector("#wh-health-body"));
  }

  Hub.registerView("health", render);
})();
