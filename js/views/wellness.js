/* ============================================================================
   WELLNESS HUB · WELLNESS
   ----------------------------------------------------------------------------
   Five habits that don't each justify a top-level tab, grouped behind pills:

     hydration   tap-to-log cups, ring toward a configurable goal, reminders
     posture     periodic check-ins + guided desk stretches
     sleep       bed/wake times, auto duration, 1–5 quality, hygiene tips
     mindfulness box breathing (4-4-4-4), 4-7-8, and 1/3/5-minute meditation
     nutrition   a daily habit checklist — habits, explicitly not a diet plan

   Each sub-section is a `SECTIONS[key].render()` returning HTML plus a
   `wire(el)` for its events, so they stay independently readable.

   Cycle tracking used to be a hidden pill in here. It's now its own tab
   (js/views/repro.js) alongside self-exams, screening and contraception —
   buried behind a switch inside another tab, nobody who needed it found it.
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  var PILLS = [
    { id: "hydration",   label: "Hydration",   icon: "water" },
    { id: "posture",     label: "Posture",     icon: "posture" },
    { id: "sleep",       label: "Sleep",       icon: "moon" },
    { id: "mindfulness", label: "Mindfulness", icon: "wind" },
    { id: "breathwork",  label: "Breathwork",  icon: "lungs" },
    { id: "mood",        label: "Mood",        icon: "mood" },
    { id: "nutrition",   label: "Nutrition",   icon: "apple" },
    { id: "intake",      label: "Intake",      icon: "coffee" },
    { id: "habits",      label: "My habits",   icon: "star" }
  ];

  function visiblePills() {
    return PILLS.filter(function (p) { return !p.shown || p.shown(); });
  }

  function currentPill() {
    var p = Hub.uiGet("wellnessPill", "hydration");
    /* Cycle tracking used to be a pill here and now has its own tab, so an
       older saved pill preference would otherwise land on nothing. */
    if (p === "cycle") return "hydration";
    return visiblePills().some(function (x) { return x.id === p; }) ? p : "hydration";
  }

  /* ======================================================================
     1. HYDRATION
     ====================================================================== */
  var hydration = {
    render: function () {
      var d = Hub.day();
      var goal = Hub.state.settings.hydrationGoalCups || 8;
      var ml = Hub.state.settings.cupSizeMl || 250;
      var st = (Hub.state.streaks && Hub.state.streaks.hydration) || { current: 0, best: 0 };
      var rem = Hub.state.settings.reminders.hydration;

      /* Draw one glass per goal cup, plus any overflow beyond the goal. */
      var slots = Math.max(goal, d.water);
      var cups = "";
      for (var i = 0; i < slots; i++) {
        var full = i < d.water;
        cups += '<button type="button" class="wh-cup' + (full ? " is-full" : "") + '" data-cup="' + (i + 1) + '" ' +
          'aria-label="' + (full ? "Remove" : "Log") + " cup " + (i + 1) + '" title="' + (i + 1) + ' cups">' +
          '<svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">' +
            '<path d="M4 3h16l-1.8 26a2 2 0 0 1-2 1.9H7.8a2 2 0 0 1-2-1.9L4 3z"/>' +
            (full ? '<path d="M5 12h14l-1.3 17a2 2 0 0 1-2 1.9H8.3a2 2 0 0 1-2-1.9L5 12z" fill="currentColor" opacity=".85" stroke="none"/>' : "") +
          "</svg></button>";
      }

      return '<div class="wh-grid wh-grid--2">' +
        '<div class="wh-card wh-card--accent">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("water") + "Today</div>" +
            '<span class="wh-chip wh-chip--accent">' + (d.water * ml / 1000).toFixed(2).replace(/\.?0+$/, "") + " L</span></div>" +
          '<div class="wh-row" style="gap:var(--wh-s6);align-items:center">' +
            Hub.ring(Hub.pct(d.water, goal), {
              size: 128, stroke: 11,
              color: d.water >= goal ? "var(--green-bright)" : "var(--blue-bright)",
              aria: d.water + " of " + goal + " cups",
              center: '<div class="wh-ringwrap__val">' + d.water + "/" + goal + "</div>" +
                      '<div class="wh-ringwrap__lbl">cups</div>'
            }) +
            '<div class="wh-grow">' +
              '<div class="wh-row"><button type="button" class="wh-btn wh-btn--primary" id="hy-plus">' +
                Hub.icon("plus") + "Log a cup</button>" +
                '<button type="button" class="wh-btn wh-btn--ghost wh-btn--sm" id="hy-minus" ' +
                  (d.water ? "" : "disabled") + ">" + Hub.icon("minus") + "</button></div>" +
              '<p class="wh-help wh-mt4">One cup = ' + ml + "ml. Change the goal or cup size in Settings.</p>" +
            "</div>" +
          "</div>" +
          '<div class="wh-cups wh-mt6">' + cups + "</div>" +
        "</div>" +

        '<div class="wh-stack">' +
          '<div class="wh-card">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("flame") + "Streak</div></div>" +
            '<div class="wh-row" style="gap:var(--wh-s6)">' +
              '<div><div class="wh-stat__value">' + st.current + '<small>days</small></div>' +
                '<div class="wh-stat__sub">best ' + st.best + "</div></div>" +
            "</div>" +
            '<div class="wh-mt4">' + weekStrip("hydration") + "</div>" +
          "</div>" +
          '<div class="wh-card">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("bell") + "Reminders</div></div>" +
            '<label class="wh-switch">' +
              '<input type="checkbox" id="hy-remind"' + (rem.enabled ? " checked" : "") + " />" +
              '<span class="wh-switch__track"></span>' +
              '<span class="wh-switch__label">Nudge me every ' + rem.intervalMin + " minutes</span></label>" +
            '<p class="wh-help wh-mt4">Space reminders across your waking hours rather than front-loading them — ' +
              "drinking a litre at once mostly just gets excreted. Adjust the interval in Settings.</p>" +
          "</div>" +
        "</div>" +
      "</div>";
    },

    wire: function (el) {
      el.querySelector("#hy-plus").addEventListener("click", function () { addCup(1); });
      el.querySelector("#hy-minus").addEventListener("click", function () { addCup(-1); });

      /* Tapping cup N sets the count to N — or clears back to N-1 if it's
         already the last full one, so a mis-tap is one tap to undo. */
      Hub.delegate(el, "[data-cup]", function (btn) {
        var n = Number(btn.dataset.cup);
        var d = Hub.editDay();
        d.water = (d.water === n) ? n - 1 : n;
        afterWater(d);
      });

      el.querySelector("#hy-remind").addEventListener("change", function (e) {
        toggleReminder("hydration", e.target.checked);
      });
    }
  };

  function addCup(n) {
    var d = Hub.editDay();
    d.water = Math.max(0, d.water + n);
    afterWater(d);
  }
  function afterWater(d) {
    Hub.commit();
    Hub.reminders.reset("hydration");
    if (d.water > 0) Hub.beep(720, 90);
    Hub.gamify.checkMilestone("hydration");
  }

  /* ======================================================================
     2. POSTURE
     ====================================================================== */
  var STRETCHES = [
    {
      id: "neck-rolls", emoji: "🔄", name: "Neck rolls", duration: 40,
      blurb: "Releases the muscles that shorten when your head drifts forward toward a screen.",
      steps: [
        "Sit or stand tall, shoulders relaxed and down.",
        "Drop your chin toward your chest.",
        "Roll slowly to one side, back through centre, then to the other.",
        "Keep it slow — three seconds per direction. Never roll backwards through the top."
      ]
    },
    {
      id: "blade-squeeze", emoji: "🎯", name: "Shoulder blade squeezes", duration: 45,
      blurb: "Wakes up the mid-back muscles that switch off during long sitting, which is what lets the shoulders round forward.",
      steps: [
        "Sit tall with arms relaxed at your sides.",
        "Draw your shoulder blades back and down, as if pinching a pencil between them.",
        "Hold for five seconds without shrugging or arching your lower back.",
        "Release slowly. Repeat for the full timer."
      ]
    },
    {
      id: "chest-opener", emoji: "🫁", name: "Chest opener", duration: 40,
      blurb: "Counters the closed-off front-of-chest position that hours of typing builds in.",
      steps: [
        "Clasp your hands behind your back, or hold a doorframe at shoulder height.",
        "Straighten your arms and lift your chest.",
        "Breathe into the front of your ribs; feel the stretch across your chest, not in your shoulders.",
        "Hold steadily and keep your ribs from flaring."
      ]
    },
    {
      id: "upper-trap", emoji: "↘️", name: "Upper trap stretch", duration: 60,
      blurb: "For the tight band running from neck to shoulder — usually the first place desk tension shows up.",
      steps: [
        "Sit tall. Let your right hand hang, or tuck it under your thigh.",
        "Tilt your left ear toward your left shoulder.",
        "Rest your left hand lightly on your head — its weight is enough, don't pull.",
        "Hold 30 seconds, then swap sides at the halfway chime."
      ]
    },
    {
      id: "thoracic-ext", emoji: "🪑", name: "Seated thoracic extension", duration: 40,
      blurb: "Restores extension to the mid-back, the segment that stiffens most from sitting.",
      steps: [
        "Sit forward on your chair with your feet flat.",
        "Lace your fingers behind your head, elbows wide.",
        "Extend your upper back over the chair's backrest, looking slightly up.",
        "Come back to neutral slowly. Move at the mid-back, not the lower back."
      ]
    }
  ];

  var posture = {
    render: function () {
      var d = Hub.day();
      var rem = Hub.state.settings.reminders.posture;

      return '<div class="wh-grid wh-grid--2 wh-mb4">' +
          '<div class="wh-card wh-card--accent">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("posture") + "Posture check-in</div>" +
              '<span class="wh-chip wh-chip--accent">' + d.posture + " today</span></div>" +
            '<p class="wh-sm wh-muted">Right now: are your <strong>feet flat</strong>, <strong>hips back in the ' +
              "chair</strong>, <strong>shoulders down</strong>, and is the <strong>top of your screen at eye " +
              "level</strong>? Fix whatever isn't, then log the check.</p>" +
            '<div class="wh-row wh-mt4">' +
              '<button type="button" class="wh-btn wh-btn--primary" id="po-check">' + Hub.icon("check") + "I've reset my posture</button>" +
            "</div>" +
            '<p class="wh-help wh-mt4">The best posture is the next one. Changing position often matters more ' +
              "than holding a perfect one.</p>" +
          "</div>" +
          '<div class="wh-card">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("bell") + "Reminders</div></div>" +
            '<label class="wh-switch">' +
              '<input type="checkbox" id="po-remind"' + (rem.enabled ? " checked" : "") + " />" +
              '<span class="wh-switch__track"></span>' +
              '<span class="wh-switch__label">Check in every ' + rem.intervalMin + " minutes</span></label>" +
            '<div class="wh-mt6"><div class="wh-xs wh-faint wh-mb4">Stretches completed this week</div>' +
              weekStrip("stretchDone") + "</div>" +
          "</div>" +
        "</div>" +

        '<h2 class="wh-h2 wh-mb4">Desk stretches</h2>' +
        '<div class="wh-exgrid">' +
          STRETCHES.map(function (s) {
            return '<div class="wh-ex">' +
              '<div class="wh-ex__head"><div class="wh-ex__ic">' + s.emoji + "</div>" +
                '<div><div class="wh-ex__name">' + Hub.esc(s.name) + "</div>" +
                '<div class="wh-ex__dur">' + Hub.clock(s.duration) + "</div></div></div>" +
              '<p class="wh-ex__desc">' + Hub.esc(s.blurb) + "</p>" +
              '<ol class="wh-ex__steps">' + s.steps.map(function (t) { return "<li>" + Hub.esc(t) + "</li>"; }).join("") + "</ol>" +
              '<div class="wh-ex__foot"><button type="button" class="wh-btn wh-btn--primary wh-btn--sm" data-stretch="' + s.id + '">' +
                Hub.icon("play") + "Start</button></div>" +
            "</div>";
          }).join("") +
        "</div>";
    },

    wire: function (el) {
      el.querySelector("#po-check").addEventListener("click", function () {
        var d = Hub.editDay();
        d.posture++;
        Hub.commit();
        Hub.reminders.reset("posture");
        Hub.beep(620, 90);
        Hub.toast("Posture check logged — " + d.posture + " today.", "success", 2200);
      });

      el.querySelector("#po-remind").addEventListener("change", function (e) {
        toggleReminder("posture", e.target.checked);
      });

      Hub.delegate(el, "[data-stretch]", function (btn) {
        var s = STRETCHES.filter(function (x) { return x.id === btn.dataset.stretch; })[0];
        if (s) runStretch(s);
      });
    }
  };

  function runStretch(s) {
    var timer = null;
    var inner = Hub.focus.open(
      '<div class="wh-focus__title">' + s.emoji + " " + Hub.esc(s.name) + "</div>" +
      '<div class="wh-clock" id="str-clock">' + Hub.clock(s.duration) + "</div>" +
      '<ol class="wh-ex__steps wh-mt4" style="text-align:left;max-width:420px;margin-inline:auto">' +
        s.steps.map(function (t) { return "<li>" + Hub.esc(t) + "</li>"; }).join("") + "</ol>" +
      '<div class="wh-focus__cue" id="str-cue">Breathe normally. Never stretch into pain.</div>' +
      '<div class="wh-focus__actions">' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="str-quit">' + Hub.icon("stop") + "Stop</button></div>",
      function () { if (timer) timer.stop(); }
    );
    var clockEl = inner.querySelector("#str-clock");
    var cueEl = inner.querySelector("#str-cue");
    inner.querySelector("#str-quit").addEventListener("click", function () { Hub.focus.close(); });

    var halfwayDone = false, last = -1;
    timer = new Hub.Timer({
      duration: s.duration,
      interval: 200,
      onTick: function (r, e) {
        var w = Math.ceil(r);
        if (w === last) return;
        last = w;
        clockEl.textContent = Hub.clock(w);
        /* Bilateral stretches get a swap-sides chime at the midpoint. */
        if (!halfwayDone && e >= s.duration / 2) {
          halfwayDone = true;
          if (s.id === "upper-trap" || s.id === "neck-rolls") {
            cueEl.textContent = "Swap sides.";
            Hub.cueChange();
          }
        }
      },
      onDone: function () {
        Hub.cueDone();
        var d = Hub.editDay();
        d.stretch++;
        d.posture++;   // a stretch counts as a posture reset too
        Hub.commit();
        Hub.focus.close();
        Hub.toast(s.name + " done.", "success");
      }
    });
    timer.start();
  }

  /* ======================================================================
     3. SLEEP
     ====================================================================== */
  var SLEEP_TIPS = [
    ["Keep one wake time", "A fixed wake time anchors the whole rhythm far more effectively than a fixed bedtime. Hold it even after a bad night."],
    ["Light is the signal", "Bright light within an hour of waking, dim light in the last hour before bed. That single contrast does more than most sleep aids."],
    ["Cool and dark", "Around 18°C and genuinely dark. Core temperature has to drop for sleep to start, and a warm room blocks it."],
    ["Caffeine has a long tail", "Its half-life is roughly 5–6 hours, so a 4pm coffee still has a quarter of its dose in you at midnight."],
    ["Alcohol isn't a sedative", "It shortens time to sleep but suppresses REM and fragments the second half of the night."],
    ["Beds are for sleeping", "If you're awake more than about 20 minutes, get up and do something dull in dim light. Lying there trains your brain to associate bed with being awake."],
    ["Wind down deliberately", "A 30-minute buffer of low-stimulation activity is the difference between lying down and actually falling asleep."],
    ["Consistency over duration", "Seven hours at the same time nightly beats a scattered mix of five and ten."]
  ];

  /* ---- sleep helpers ---------------------------------------------------- */

  function nightsOnly(list) {
    return (list || Hub.state.logs.sleep || []).filter(function (e) { return e.kind !== "nap"; });
  }
  function nightFor(dateKey) {
    return nightsOnly().filter(function (e) { return e.date === dateKey; })[0] || null;
  }
  function napsFor(dateKey) {
    return (Hub.state.logs.sleep || []).filter(function (e) {
      return e.kind === "nap" && e.date === dateKey;
    });
  }
  function sleepTarget() {
    var t = Number(Hub.state.settings.sleepTargetHours);
    return t >= 4 && t <= 12 ? t : 8;
  }

  /* Rolling average over the last n days that actually have a night logged. */
  function avgNights(n) {
    var vals = [];
    for (var i = 0; i < n; i++) {
      var e = nightFor(Hub.shiftDay(Hub.today(), -i));
      if (e && e.hours) vals.push(Number(e.hours));
    }
    return vals.length ? { avg: vals.reduce(function (a, b) { return a + b; }, 0) / vals.length, n: vals.length } : null;
  }

  /* Cumulative shortfall against the target over a window.
     Deliberately counts only nights you logged — inventing a deficit for
     nights with no data would make the number meaningless. */
  function sleepDebt(days) {
    var debt = 0, counted = 0, target = sleepTarget();
    for (var i = 0; i < days; i++) {
      var k = Hub.shiftDay(Hub.today(), -i);
      var e = nightFor(k);
      if (!e || !e.hours) continue;
      counted++;
      /* Naps genuinely pay some of it back, so they count toward the day. */
      var napH = napsFor(k).reduce(function (n, x) { return n + (Number(x.hours) || 0); }, 0);
      debt += target - (Number(e.hours) + napH);
    }
    return { debt: debt, nights: counted, target: target };
  }

  var sleep = {
    render: function () {
      var all = (Hub.state.logs.sleep || []).slice().sort(function (a, b) {
        return b.date < a.date ? -1 : (b.date > a.date ? 1 : 0);
      });
      var st = (Hub.state.streaks && Hub.state.streaks.sleep) || { current: 0, best: 0 };
      var target = sleepTarget();

      /* The night being edited follows the logging date, so backfilling a
         forgotten Tuesday is the same gesture as logging this morning. */
      var editKey = Hub.viewDate();
      var already = nightFor(editKey);
      var todaysNaps = napsFor(editKey);

      var a7 = avgNights(7), a30 = avgNights(30);
      var debt = sleepDebt(14);
      var mode = Hub.uiGet("sleepMode", "times");   // "times" | "hours"

      /* Last 14 nights as bars, so consistency is visible at a glance —
         which matters more than any single night. */
      var bars = [];
      for (var i = 13; i >= 0; i--) {
        var k = Hub.shiftDay(Hub.today(), -i);
        var e = nightFor(k);
        bars.push({ key: k, hours: e ? Number(e.hours) || 0 : 0, quality: e && e.quality });
      }
      var maxBar = Math.max(10, Math.max.apply(null, bars.map(function (b) { return b.hours; })));

      return '<div class="wh-grid wh-grid--2 wh-mb4">' +
          /* ---------------- entry ---------------- */
          '<div class="wh-card wh-card--accent">' +
            '<div class="wh-card__head">' +
              '<div class="wh-card__title">' + Hub.icon("moon") +
                (Hub.isBackfilling() ? "Night of " + Hub.prettyDate(editKey) : "Log last night") + "</div>" +
              (already ? '<span class="wh-chip wh-chip--good">logged</span>' : "") +
            "</div>" +

            /* Which night is this? Explicit, because "last night" is ambiguous
               the moment you're filling in a gap from three days ago. */
            '<label class="wh-field wh-mb4"><span class="wh-field__label">Night of (the morning you woke)</span>' +
              '<input class="wh-input" type="date" id="sl-date" value="' + editKey +
                '" max="' + Hub.today() + '" /></label>' +

            '<div class="wh-seg wh-mb4" role="group" aria-label="How to enter sleep">' +
              '<button type="button" class="wh-seg__btn' + (mode === "times" ? " is-on" : "") +
                '" data-sleepmode="times">Bed &amp; wake times</button>' +
              '<button type="button" class="wh-seg__btn' + (mode === "hours" ? " is-on" : "") +
                '" data-sleepmode="hours">Just the hours</button>' +
            "</div>" +

            (mode === "times"
              ? '<div class="wh-grid wh-grid--2" style="gap:var(--wh-s3)">' +
                  '<label class="wh-field"><span class="wh-field__label">Bedtime</span>' +
                    '<input class="wh-input" type="time" id="sl-bed" value="' +
                      Hub.esc((already && already.bed) || "23:00") + '" /></label>' +
                  '<label class="wh-field"><span class="wh-field__label">Wake time</span>' +
                    '<input class="wh-input" type="time" id="sl-wake" value="' +
                      Hub.esc((already && already.wake) || "07:00") + '" /></label>' +
                "</div>"
              /* Some people know they got about six hours and have no idea
                 when they went to bed. Making them invent two timestamps to
                 record that is how a sleep log stops getting filled in. */
              : '<div class="wh-grid wh-grid--2" style="gap:var(--wh-s3)">' +
                  '<label class="wh-field"><span class="wh-field__label">Hours slept</span>' +
                    '<input class="wh-input" type="number" id="sl-hours" min="0" max="20" step="0.25" ' +
                      'inputmode="decimal" value="' + (already && already.hours ? already.hours : "") +
                      '" placeholder="7.5" /></label>' +
                  '<label class="wh-field"><span class="wh-field__label">Woke at (optional)</span>' +
                    '<input class="wh-input" type="time" id="sl-wake" value="' +
                      Hub.esc((already && already.wake) || "") + '" /></label>' +
                "</div>") +

            '<div class="wh-row wh-row--between wh-mt4">' +
              '<span class="wh-sm wh-faint">Duration</span>' +
              '<span class="mono" id="sl-duration" style="font-size:19px;color:var(--fg0)">—</span>' +
            "</div>" +

            '<div class="wh-field wh-mt4"><span class="wh-field__label">Quality</span>' +
              '<div class="wh-rate" id="sl-rate" role="group" aria-label="Sleep quality, 1 to 5">' +
                [1, 2, 3, 4, 5].map(function (n) {
                  return '<button type="button" class="wh-rate__btn' +
                    (already && already.quality === n ? " is-on" : "") + '" data-rate="' + n + '" ' +
                    'aria-pressed="' + !!(already && already.quality === n) + '">' + n + "</button>";
                }).join("") +
              "</div>" +
              '<span class="wh-help">1 = wrecked · 5 = fully restored</span>' +
            "</div>" +

            '<label class="wh-field wh-mt4"><span class="wh-field__label">Note (optional)</span>' +
              '<input class="wh-input" type="text" id="sl-note" maxlength="90" value="' +
                Hub.esc((already && already.note) || "") + '" placeholder="woke at 3am, noisy street…" /></label>' +

            '<button type="button" class="wh-btn wh-btn--primary wh-btn--block wh-mt4" id="sl-save">' +
              Hub.icon("check") + (already ? "Update this night" : "Save this night") + "</button>" +

            /* ---- naps ---- */
            '<div class="wh-mt6">' +
              '<div class="wh-row wh-row--between wh-mb4">' +
                '<span class="wh-field__label">Naps on this day</span>' +
                '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" id="sl-addnap">' +
                  Hub.icon("plus") + "Add a nap</button>" +
              "</div>" +
              (todaysNaps.length
                ? '<div class="wh-loglist">' + todaysNaps.map(function (n) {
                    return '<div class="wh-logrow">' +
                      '<span class="wh-logrow__main">' + Math.round((Number(n.hours) || 0) * 60) + " min</span>" +
                      '<span class="wh-xs wh-faint">' + Hub.esc(n.note || "nap") + "</span>" +
                      '<button type="button" class="wh-logrow__del" style="margin-left:auto" ' +
                        'data-delsleepid="' + n.id + '" aria-label="Delete nap">' + Hub.icon("trash") + "</button>" +
                    "</div>";
                  }).join("") + "</div>"
                : '<p class="wh-help">None logged. Naps count toward the day\'s total but never ' +
                  "replace the night — they're kept separate on purpose.</p>") +
            "</div>" +
          "</div>" +

          /* ---------------- stats ---------------- */
          '<div class="wh-stack">' +
            '<div class="wh-grid wh-grid--2" style="gap:var(--wh-s3)">' +
              '<div class="wh-stat"><div class="wh-stat__label">7-night average</div>' +
                '<div class="wh-stat__value">' + (a7 ? a7.avg.toFixed(1) : "—") + "<small>h</small></div>" +
                '<div class="wh-stat__sub">' + (a7 ? a7.n + " of 7 nights logged" : "no data yet") + "</div></div>" +
              '<div class="wh-stat"><div class="wh-stat__label">30-night average</div>' +
                '<div class="wh-stat__value">' + (a30 ? a30.avg.toFixed(1) : "—") + "<small>h</small></div>" +
                '<div class="wh-stat__sub">target ' + target + "h</div></div>" +
              '<div class="wh-stat"><div class="wh-stat__label">Logged streak</div>' +
                '<div class="wh-stat__value">' + st.current + "<small>d</small></div>" +
                '<div class="wh-stat__sub">best ' + st.best + "</div></div>" +
              '<div class="wh-stat"><div class="wh-stat__label">14-night balance</div>' +
                '<div class="wh-stat__value" style="color:' +
                  (debt.debt > 4 ? "var(--red-bright)" : debt.debt > 0 ? "var(--yellow-bright)" : "var(--green-bright)") + '">' +
                  (debt.nights ? (debt.debt > 0 ? "−" : "+") + Math.abs(debt.debt).toFixed(1) : "—") + "<small>h</small></div>" +
                '<div class="wh-stat__sub">' + (debt.nights ? "over " + debt.nights + " logged nights" : "log some nights") + "</div></div>" +
            "</div>" +

            '<div class="wh-card">' +
              '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("chart") + "Last 14 nights</div>" +
                '<span class="wh-chip mono">target ' + target + "h</span></div>" +
              '<div class="wh-sleepbars">' + bars.map(function (b) {
                var h = b.hours ? Math.max(4, b.hours / maxBar * 100) : 3;
                var col = !b.hours ? "var(--bg2)"
                  : (b.hours >= target - 0.5 ? "var(--green-bright)"
                    : b.hours >= target - 1.5 ? "var(--yellow-bright)" : "var(--orange-bright)");
                return '<span class="wh-sleepbar" title="' + Hub.prettyDate(b.key) + " · " +
                  (b.hours ? b.hours.toFixed(1) + "h" + (b.quality ? " · Q" + b.quality : "") : "not logged") +
                  '" style="height:' + h + "%;background:" + col + '"></span>';
              }).join("") + "</div>" +
              '<p class="wh-help wh-mt4">Consistency shows up here more clearly than in any average — ' +
                "a flat row of sevens beats a mix of fives and tens.</p>" +
            "</div>" +
          "</div>" +
        "</div>" +

        /* ---------------- history ---------------- */
        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("clockIc") + "Recent entries</div>" +
            '<span class="wh-chip">' + all.length + " logged</span></div>" +
          (all.length
            ? '<div class="wh-loglist">' + all.slice(0, 20).map(function (e) {
                var isNap = e.kind === "nap";
                return '<div class="wh-logrow">' +
                  '<span class="wh-logrow__date">' + Hub.prettyDate(e.date) + "</span>" +
                  '<span class="wh-logrow__main">' +
                    (isNap ? Math.round((Number(e.hours) || 0) * 60) + " min" : (Number(e.hours) || 0).toFixed(1) + "h") +
                  "</span>" +
                  (isNap
                    ? '<span class="wh-chip">nap</span>'
                    : '<span class="wh-xs wh-faint">' + Hub.esc(e.bed || "?") + " → " + Hub.esc(e.wake || "?") + "</span>") +
                  (e.quality ? '<span class="wh-chip">Q' + e.quality + "</span>" : "") +
                  (e.note ? '<span class="wh-xs wh-faint">' + Hub.esc(e.note) + "</span>" : "") +
                  '<button type="button" class="wh-logrow__del" style="margin-left:auto" ' +
                    'data-delsleepid="' + Hub.esc(e.id) + '" ' +
                    'aria-label="Delete entry for ' + Hub.prettyDate(e.date) + '">' + Hub.icon("trash") + "</button>" +
                "</div>";
              }).join("") + "</div>"
            : '<div class="wh-empty">' + Hub.icon("moon") + "<strong>No nights logged yet</strong>" +
              "Log one above and the averages appear here.</div>") +
        "</div>" +

        '<h2 class="wh-h2 wh-mt6 wh-mb4">Sleep hygiene</h2>' +
        '<div class="wh-grid wh-grid--auto">' +
          SLEEP_TIPS.map(function (t) {
            return '<div class="wh-card wh-card--tight">' +
              '<div class="wh-h3 wh-mb4">' + Hub.esc(t[0]) + "</div>" +
              '<p class="wh-card__note">' + Hub.esc(t[1]) + "</p></div>";
          }).join("") +
        "</div>";
    },

    wire: function (el) {
      var mode = Hub.uiGet("sleepMode", "times");
      var bed = el.querySelector("#sl-bed");
      var wake = el.querySelector("#sl-wake");
      var hoursInput = el.querySelector("#sl-hours");
      var dateInput = el.querySelector("#sl-date");
      var out = el.querySelector("#sl-duration");
      var quality = 0;

      var on = el.querySelector(".wh-rate__btn.is-on");
      if (on) quality = Number(on.dataset.rate);

      function currentHours() {
        if (mode === "hours") {
          var v = parseFloat(hoursInput.value);
          return isFinite(v) && v > 0 ? Math.min(20, v) : 0;
        }
        return hoursBetween(bed.value, wake.value);
      }

      function recalc() {
        var h = currentHours();
        out.textContent = h ? h.toFixed(1) + " h" : "—";
        out.style.color = !h ? "var(--fg0)" : (h >= 7 && h <= 9 ? "var(--green-bright)" : "var(--yellow-bright)");
      }
      if (bed) bed.addEventListener("input", recalc);
      if (wake) wake.addEventListener("input", recalc);
      if (hoursInput) hoursInput.addEventListener("input", recalc);
      recalc();

      Hub.delegate(el, "[data-sleepmode]", function (b) {
        Hub.uiSet("sleepMode", b.dataset.sleepmode);
        Hub.refresh();
      });

      /* Changing the date here moves the whole app's logging date, so the
         rest of the tab agrees with what you're editing. */
      if (dateInput) dateInput.addEventListener("change", function () {
        Hub.setViewDate(dateInput.value);
      });

      Hub.delegate(el, "[data-rate]", function (btn) {
        quality = Number(btn.dataset.rate);
        el.querySelectorAll("[data-rate]").forEach(function (b) {
          var isOn = b === btn;
          b.classList.toggle("is-on", isOn);
          b.setAttribute("aria-pressed", isOn);
        });
      });

      el.querySelector("#sl-save").addEventListener("click", function () {
        var h = currentHours();
        if (!h) {
          Hub.toast(mode === "hours" ? "Enter how many hours you slept."
                                     : "Set both a bedtime and a wake time.", "warn");
          return;
        }

        var date = dateInput.value;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = Hub.viewDate();
        if (Hub.daysBetween(date, Hub.today()) < 0) {
          Hub.toast("That night hasn't happened yet.", "warn");
          return;
        }

        var list = Hub.state.logs.sleep;
        var existing = list.filter(function (e) { return e.date === date && e.kind !== "nap"; })[0];
        var rec = {
          kind: "night",
          date: date,
          bed: mode === "times" ? bed.value : (existing ? existing.bed : null),
          wake: wake ? (wake.value || null) : null,
          hours: Number(h.toFixed(2)),
          quality: quality || null,
          note: el.querySelector("#sl-note").value.trim() || null
        };

        if (existing) Object.assign(existing, rec);
        else list.push(Object.assign({ id: "s" + Date.now() }, rec));

        Hub.commit();
        Hub.gamify.checkMilestone("sleep");
        Hub.toast("Sleep logged for " + Hub.prettyDate(date) + " — " + h.toFixed(1) + " hours.", "success");
      });

      el.querySelector("#sl-addnap").addEventListener("click", function () { napDialog(); });

      Hub.delegate(el, "[data-delsleepid]", function (btn) {
        var id = btn.dataset.delsleepid;
        var e = (Hub.state.logs.sleep || []).filter(function (x) { return x.id === id; })[0];
        if (!e) return;
        Hub.confirm({
          title: "Delete this entry?",
          body: "The " + (e.kind === "nap" ? "nap" : "night") + " logged for <strong>" +
                Hub.prettyDate(e.date) + "</strong> will be removed.",
          confirmLabel: "Delete",
          onConfirm: function () {
            Hub.state.logs.sleep = Hub.state.logs.sleep.filter(function (x) { return x.id !== id; });
            Hub.commit();
            Hub.toast("Entry deleted.", "info", 2000);
          }
        });
      });
    }
  };

  function napDialog() {
    Hub.modal({
      title: "Log a nap",
      body:
        '<div class="wh-grid wh-grid--2" style="gap:var(--wh-s3)">' +
          '<label class="wh-field"><span class="wh-field__label">Length (minutes)</span>' +
            '<input class="wh-input" id="np-min" type="number" min="5" max="240" step="5" value="20" /></label>' +
          '<label class="wh-field"><span class="wh-field__label">Date</span>' +
            '<input class="wh-input" id="np-date" type="date" value="' + Hub.viewDate() +
              '" max="' + Hub.today() + '" /></label>' +
        "</div>" +
        '<label class="wh-field wh-mt4"><span class="wh-field__label">Note</span>' +
          '<input class="wh-input" id="np-note" type="text" maxlength="60" placeholder="post-lunch, after training…" /></label>' +
        '<p class="wh-help wh-mt4">Twenty minutes or a full ninety-minute cycle both work; the ' +
          "thirty-to-sixty range is the one that tends to leave you groggy.</p>",
      actions: [
        { label: "Cancel", variant: "ghost" },
        { label: "Save nap", variant: "primary", close: false, onClick: function () {
          var mins = Math.round(Number(document.getElementById("np-min").value));
          if (!(mins >= 5 && mins <= 240)) { Hub.toast("A nap is between 5 and 240 minutes.", "warn"); return; }
          var date = document.getElementById("np-date").value;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = Hub.viewDate();

          Hub.state.logs.sleep.push({
            id: "s" + Date.now(), kind: "nap", date: date,
            hours: Number((mins / 60).toFixed(3)),
            bed: null, wake: null, quality: null,
            note: document.getElementById("np-note").value.trim() || null
          });
          Hub.closeModal();
          Hub.commit();
          Hub.beep(660, 90);
          Hub.toast("Nap logged — " + mins + " minutes.", "success");
        } }
      ]
    });
  }

  /* Hours between two "HH:MM" clock times, wrapping past midnight. */
  function hoursBetween(bedStr, wakeStr) {
    if (!bedStr || !wakeStr) return 0;
    var b = bedStr.split(":"), w = wakeStr.split(":");
    var bm = Number(b[0]) * 60 + Number(b[1]);
    var wm = Number(w[0]) * 60 + Number(w[1]);
    var diff = wm - bm;
    if (diff <= 0) diff += 1440;      // went to bed before midnight, woke after
    return diff / 60;
  }

  /* ======================================================================
     4. MINDFULNESS
     ====================================================================== */
  var PATTERNS = {
    box: {
      id: "box", name: "Box breathing", emoji: "🔲", cycleLabel: "4-4-4-4",
      blurb: "Equal counts in, hold, out, hold. Used by people who need to stay calm and sharp at the same time — " +
             "it steadies you without making you drowsy.",
      phases: [
        { name: "Inhale", sec: 4, size: "big" },
        { name: "Hold",   sec: 4, size: "hold" },
        { name: "Exhale", sec: 4, size: "small" },
        { name: "Hold",   sec: 4, size: "hold" }
      ]
    },
    "478": {
      id: "478", name: "4-7-8 breathing", emoji: "🌙", cycleLabel: "4-7-8",
      blurb: "A long exhale relative to the inhale is what actually engages the parasympathetic response. " +
             "Strongly downshifting — good before sleep, less good before anything demanding.",
      phases: [
        { name: "Inhale", sec: 4, size: "big" },
        { name: "Hold",   sec: 7, size: "hold" },
        { name: "Exhale", sec: 8, size: "small" }
      ]
    }
  };

  var PATTERN_ORDER = ["box", "478"];

  var mindfulness = {
    render: function () {
      var d = Hub.day();
      var st = (Hub.state.streaks && Hub.state.streaks.mindful) || { current: 0, best: 0 };
      var t = Hub.gamify.totals();
      var todayList = d.mindful || [];

      return '<div class="wh-grid wh-grid--3 wh-mb4">' +
          '<div class="wh-stat"><div class="wh-stat__label">Streak</div>' +
            '<div class="wh-stat__value">' + st.current + "<small>days</small></div>" +
            '<div class="wh-stat__sub">best ' + st.best + "</div></div>" +
          '<div class="wh-stat"><div class="wh-stat__label">Today</div>' +
            '<div class="wh-stat__value">' + todayList.length + "</div>" +
            '<div class="wh-stat__sub">' + Hub.plural(todayList.length, "session") + "</div></div>" +
          '<div class="wh-stat"><div class="wh-stat__label">Total practice</div>' +
            '<div class="wh-stat__value">' + Math.round(t.mindfulSeconds / 60) + "<small>min</small></div>" +
            '<div class="wh-stat__sub">' + t.mindful + " sessions all time</div></div>" +
        "</div>" +

        '<h2 class="wh-h2 wh-mb4">Guided breathing</h2>' +
        '<div class="wh-grid wh-grid--2 wh-mb4">' +
          /* Explicit order: Object.keys puts integer-like keys ("478") first,
             which would bury box breathing below the more specialised 4-7-8. */
          PATTERN_ORDER.map(function (k) {
            var p = PATTERNS[k];
            var cycle = p.phases.reduce(function (n, ph) { return n + ph.sec; }, 0);
            return '<div class="wh-ex">' +
              '<div class="wh-ex__head"><div class="wh-ex__ic">' + p.emoji + "</div>" +
                '<div><div class="wh-ex__name">' + Hub.esc(p.name) + "</div>" +
                '<div class="wh-ex__dur">' + p.cycleLabel + " · " + cycle + "s per cycle</div></div></div>" +
              '<p class="wh-ex__desc">' + Hub.esc(p.blurb) + "</p>" +
              '<div class="wh-ex__foot" style="flex-wrap:wrap">' +
                [1, 3, 5].map(function (m) {
                  return '<button type="button" class="wh-btn wh-btn--sm ' + (m === 3 ? "wh-btn--primary" : "") + '" ' +
                    'data-breathe="' + p.id + '" data-min="' + m + '">' + m + " min</button>";
                }).join("") +
              "</div>" +
            "</div>";
          }).join("") +
        "</div>" +

        '<h2 class="wh-h2 wh-mt6 wh-mb4">Silent meditation</h2>' +
        '<div class="wh-card">' +
          '<p class="wh-sm wh-muted">A plain timer with a chime at each end. Sit, follow your breath without ' +
            "steering it, and when you notice you've wandered — which you will, constantly — come back. " +
            "The noticing <em>is</em> the practice.</p>" +
          '<div class="wh-row wh-mt4">' +
            [1, 3, 5, 10].map(function (m) {
              return '<button type="button" class="wh-btn ' + (m === 5 ? "wh-btn--primary" : "") + '" data-meditate="' + m + '">' +
                Hub.icon("play") + m + " min</button>";
            }).join("") +
          "</div>" +
        "</div>" +

        (todayList.length
          ? '<div class="wh-card wh-mt6"><div class="wh-card__head"><div class="wh-card__title">' +
            Hub.icon("check") + "Today's sessions</div></div><div class=\"wh-loglist\">" +
            todayList.map(function (m, i) {
              return '<div class="wh-logrow"><span class="wh-logrow__main">' + Hub.esc(labelFor(m.type)) + "</span>" +
                '<span class="wh-xs wh-faint">' + Math.round((m.sec || 0) / 60) + " min</span>" +
                '<button type="button" class="wh-logrow__del" data-delmind="' + i + '" aria-label="Delete session">' +
                  Hub.icon("trash") + "</button></div>";
            }).join("") + "</div></div>"
          : "");
    },

    wire: function (el) {
      Hub.delegate(el, "[data-breathe]", function (btn) {
        runBreathing(PATTERNS[btn.dataset.breathe], Number(btn.dataset.min) * 60);
      });
      Hub.delegate(el, "[data-meditate]", function (btn) {
        runMeditation(Number(btn.dataset.meditate) * 60);
      });
      Hub.delegate(el, "[data-delmind]", function (btn) {
        var d = Hub.editDay();
        d.mindful.splice(Number(btn.dataset.delmind), 1);
        Hub.commit();
        Hub.toast("Session removed.", "info", 2000);
      });
    }
  };

  function labelFor(type) {
    if (PATTERNS[type]) return PATTERNS[type].name;
    if (type === "meditation") return "Silent meditation";
    var drill = BREATH_DRILLS.filter(function (b) { return b.id === type; })[0];
    return drill ? drill.name : type;
  }

  /* --- breathing driver --------------------------------------------------
     The circle's CSS transition duration is set per phase to exactly match
     that phase's length, so the animation and the countdown can't drift. */
  function runBreathing(pattern, totalSec) {
    var timer = null;
    var inner = Hub.focus.open(
      '<div class="wh-focus__title">' + pattern.emoji + " " + Hub.esc(pattern.name) + "</div>" +
      '<div class="wh-focus__stage"><div class="wh-breath">' +
        '<div class="wh-breath__circle" id="br-circle"></div></div></div>' +
      '<div class="wh-breath__phase" id="br-phase">Get comfortable…</div>' +
      '<div class="wh-breath__count" id="br-count">–</div>' +
      '<div class="wh-focus__cue"><span class="mono" id="br-total">' + Hub.clock(totalSec) + "</span> remaining</div>" +
      '<div class="wh-focus__actions">' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="br-quit">' + Hub.icon("stop") + "Finish early</button></div>",
      function () { if (timer) timer.stop(); }
    );

    var circle = inner.querySelector("#br-circle");
    var phaseEl = inner.querySelector("#br-phase");
    var countEl = inner.querySelector("#br-count");
    var totalEl = inner.querySelector("#br-total");
    inner.querySelector("#br-quit").addEventListener("click", function () {
      /* Credit whatever was actually completed rather than discarding it. */
      var done = Math.round(timer ? timer.elapsed() : 0);
      Hub.focus.close();
      if (done >= 30) logMindful(pattern.id, done);
      else Hub.toast("Session too short to log.", "info", 2200);
    });

    var cycleLen = pattern.phases.reduce(function (n, p) { return n + p.sec; }, 0);
    var lastPhaseIdx = -1, lastCount = -1, lastTotal = -1;

    timer = new Hub.Timer({
      duration: totalSec,
      interval: 100,
      onTick: function (remaining, elapsed) {
        /* Which phase are we in, and how far through it? */
        var inCycle = elapsed % cycleLen;
        var idx = 0, acc = 0;
        for (var i = 0; i < pattern.phases.length; i++) {
          if (inCycle < acc + pattern.phases[i].sec) { idx = i; break; }
          acc += pattern.phases[i].sec;
        }
        var ph = pattern.phases[idx];
        var intoPhase = inCycle - acc;

        if (idx !== lastPhaseIdx) {
          lastPhaseIdx = idx;
          phaseEl.textContent = ph.name;
          /* Drive the scale change over exactly this phase's duration. */
          circle.style.transitionDuration = ph.sec + "s";
          if (ph.size === "big") circle.classList.add("is-big");
          else if (ph.size === "small") circle.classList.remove("is-big");
          /* "hold" deliberately leaves the current scale alone. */
          Hub.beep(ph.name === "Exhale" ? 480 : 640, 100, 0.08);
        }

        var countDown = Math.ceil(ph.sec - intoPhase);
        if (countDown !== lastCount) { lastCount = countDown; countEl.textContent = countDown; }

        var wholeLeft = Math.ceil(remaining);
        if (wholeLeft !== lastTotal) { lastTotal = wholeLeft; totalEl.textContent = Hub.clock(wholeLeft); }
      },
      onDone: function () {
        Hub.cueDone();
        Hub.focus.close();
        logMindful(pattern.id, totalSec);
      }
    });
    timer.start();
  }

  /* --- silent meditation ------------------------------------------------- */
  function runMeditation(totalSec) {
    var timer = null;
    var inner = Hub.focus.open(
      '<div class="wh-focus__title">🧘 Meditation</div>' +
      '<div class="wh-clock" id="md-clock">' + Hub.clock(totalSec) + "</div>" +
      '<div class="wh-focus__cue">Sit comfortably. Follow the breath. When you notice you\'ve drifted, ' +
        "come back — that noticing is the whole exercise.</div>" +
      '<div class="wh-focus__actions">' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="md-quit">' + Hub.icon("stop") + "Finish early</button></div>",
      function () { if (timer) timer.stop(); }
    );
    var clockEl = inner.querySelector("#md-clock");
    inner.querySelector("#md-quit").addEventListener("click", function () {
      var done = Math.round(timer ? timer.elapsed() : 0);
      Hub.focus.close();
      if (done >= 30) logMindful("meditation", done);
      else Hub.toast("Session too short to log.", "info", 2200);
    });

    Hub.beep(528, 400, 0.12);   // opening bell
    var last = -1;
    timer = new Hub.Timer({
      duration: totalSec,
      interval: 250,
      onTick: function (r) {
        var w = Math.ceil(r);
        if (w !== last) { last = w; clockEl.textContent = Hub.clock(w); }
      },
      onDone: function () {
        Hub.beep(528, 600, 0.14);
        setTimeout(function () { Hub.beep(396, 700, 0.12); }, 500);
        Hub.focus.close();
        logMindful("meditation", totalSec);
      }
    });
    timer.start();
  }

  function logMindful(type, sec) {
    var d = Hub.editDay();
    d.mindful.push({ type: type, sec: sec, at: new Date().toISOString() });
    Hub.commit();
    Hub.gamify.checkMilestone("mindful");
    Hub.toast("Session logged — " + Math.round(sec / 60) + " " + Hub.plural(Math.round(sec / 60), "minute") + ".", "success");
  }

  /* ======================================================================
     5. MOOD — a daily check-in, not a diagnostic instrument
     ----------------------------------------------------------------------
     Three quick scales plus a gratitude prompt. The value isn't any single
     day's number; it's noticing, weeks later, that the bad stretches line up
     with short sleep or skipped training.
     ====================================================================== */
  var SCALES = [
    { key: "mood",   label: "Mood",   low: "Rough", high: "Great",   color: "var(--yellow-bright)" },
    { key: "energy", label: "Energy", low: "Empty", high: "Buzzing", color: "var(--orange-bright)" },
    { key: "stress", label: "Stress", low: "Calm",  high: "Maxed",   color: "var(--red-bright)", inverted: true }
  ];

  var mood = {
    render: function () {
      var d = Hub.day();
      var cur = d.mood || {};
      var st = (Hub.state.streaks && Hub.state.streaks.mood) || { current: 0, best: 0 };
      var t = Hub.gamify.totals();
      var recent = recentMoods(30);

      return '<div class="wh-grid wh-grid--2 wh-mb4">' +
          '<div class="wh-card wh-card--accent">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("mood") + "Today's check-in</div>" +
              (d.mood ? '<span class="wh-chip wh-chip--good">logged</span>' : "") + "</div>" +

            SCALES.map(function (s) {
              return '<div class="wh-field wh-mt4"><span class="wh-field__label">' + s.label + "</span>" +
                '<div class="wh-rate" role="group" aria-label="' + s.label + ', 1 to 5">' +
                  [1, 2, 3, 4, 5].map(function (n) {
                    var on = cur[s.key] === n;
                    return '<button type="button" class="wh-rate__btn' + (on ? " is-on" : "") + '" ' +
                      'data-scale="' + s.key + '" data-val="' + n + '" ' +
                      'style="--wh-rate-c:' + s.color + '" aria-pressed="' + on + '">' + n + "</button>";
                  }).join("") +
                "</div>" +
                '<span class="wh-help">1 = ' + s.low + " · 5 = " + s.high + "</span></div>";
            }).join("") +

            '<label class="wh-field wh-mt4"><span class="wh-field__label">Anything worth noting?</span>' +
              '<input class="wh-input" id="mo-note" type="text" maxlength="140" ' +
              'value="' + Hub.esc(cur.note || "") + '" placeholder="optional" /></label>' +

            '<button type="button" class="wh-btn wh-btn--primary wh-btn--block wh-mt4" id="mo-save">' +
              Hub.icon("check") + (d.mood ? "Update check-in" : "Save check-in") + "</button>" +
          "</div>" +

          '<div class="wh-stack">' +
            '<div class="wh-grid wh-grid--2" style="gap:var(--wh-s3)">' +
              '<div class="wh-stat"><div class="wh-stat__label">Streak</div>' +
                '<div class="wh-stat__value">' + st.current + "<small>d</small></div>" +
                '<div class="wh-stat__sub">best ' + st.best + "</div></div>" +
              '<div class="wh-stat"><div class="wh-stat__label">Check-ins</div>' +
                '<div class="wh-stat__value">' + t.moodLogs + "</div>" +
                '<div class="wh-stat__sub">all time</div></div>' +
            "</div>" +

            '<div class="wh-card">' +
              '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("lightbulb") + "Three good things</div></div>" +
              '<p class="wh-sm wh-muted wh-mb4">The most consistently supported journalling exercise there is: ' +
                "write down three things that went well today, however small.</p>" +
              [0, 1, 2].map(function (i) {
                return '<input class="wh-input wh-mt4" id="mo-g' + i + '" type="text" maxlength="90" ' +
                  'value="' + Hub.esc((cur.gratitude || [])[i] || "") + '" ' +
                  'aria-label="Good thing ' + (i + 1) + '" placeholder="' + (i + 1) + '." />';
              }).join("") +
            "</div>" +
          "</div>" +
        "</div>" +

        /* ---------- 30-day trend ---------- */
        (recent.length >= 2
          ? '<div class="wh-card wh-mb4">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("clockIc") + "Last 30 days</div>" +
              '<span class="wh-chip mono">' + recent.length + " logged</span></div>" +
            '<div class="wh-moodtrend">' + SCALES.map(function (s) {
              return '<div class="wh-moodtrend__row">' +
                '<span class="wh-moodtrend__label" style="color:' + s.color + '">' + s.label + "</span>" +
                '<div class="wh-moodtrend__bars">' + recent.map(function (r) {
                  var v = r.mood[s.key];
                  var h = v ? (v / 5 * 100) : 0;
                  return '<span class="wh-moodtrend__bar" title="' + Hub.prettyDate(r.date) +
                    (v ? " · " + s.label + " " + v + "/5" : " · not logged") + '" ' +
                    'style="height:' + (h || 6) + "%;background:" + (v ? s.color : "var(--bg2)") + '"></span>';
                }).join("") + "</div>" +
                '<span class="mono wh-xs wh-faint">avg ' + avgOf(recent, s.key) + "</span>" +
              "</div>";
            }).join("") + "</div>" +
          "</div>"
          : "") +

        /* ---------- recent notes ---------- */
        (recent.filter(function (r) { return r.mood.note; }).length
          ? '<div class="wh-card wh-mb4">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("info") + "Recent notes</div></div>" +
            '<div class="wh-loglist">' + recent.slice().reverse().filter(function (r) { return r.mood.note; })
              .slice(0, 8).map(function (r) {
                return '<div class="wh-logrow"><span class="wh-logrow__date">' + Hub.prettyDate(r.date) + "</span>" +
                  '<span class="wh-grow wh-sm">' + Hub.esc(r.mood.note) + "</span></div>";
              }).join("") + "</div></div>"
          : "") +

        '<div class="wh-disclaimer">' + Hub.icon("alert") +
          "<span>This is a self-reflection log, <strong>not a mental-health assessment</strong>. It can't " +
          "screen for anything. If low mood, anxiety or hopelessness persists for more than a couple of weeks, " +
          "or starts affecting your sleep, work or relationships, please talk to a doctor or a mental-health " +
          "professional — that's a medical matter, not a discipline problem. If you're thinking about harming " +
          "yourself, contact your local emergency number or a crisis line now.</span></div>";
    },

    wire: function (el) {
      /* Held locally so a partial check-in doesn't write to storage on every tap. */
      var draft = Object.assign({}, Hub.day().mood || {});

      Hub.delegate(el, "[data-scale]", function (b) {
        var key = b.dataset.scale, val = Number(b.dataset.val);
        draft[key] = draft[key] === val ? null : val;   // tap again to clear
        el.querySelectorAll('[data-scale="' + key + '"]').forEach(function (x) {
          var on = Number(x.dataset.val) === draft[key];
          x.classList.toggle("is-on", on);
          x.setAttribute("aria-pressed", on);
        });
      });

      el.querySelector("#mo-save").addEventListener("click", function () {
        var any = SCALES.some(function (s) { return draft[s.key]; });
        var gratitude = [0, 1, 2].map(function (i) {
          return el.querySelector("#mo-g" + i).value.trim();
        }).filter(Boolean);
        var note = el.querySelector("#mo-note").value.trim();

        if (!any && !gratitude.length && !note) {
          Hub.toast("Rate at least one scale, or write something.", "warn");
          return;
        }
        var d = Hub.editDay();
        d.mood = {
          mood: draft.mood || null, energy: draft.energy || null, stress: draft.stress || null,
          note: note || null, gratitude: gratitude, at: new Date().toISOString()
        };
        Hub.commit();
        Hub.gamify.checkMilestone("mood");
        Hub.beep(680, 100);
        Hub.toast("Check-in saved.", "success");
      });
    }
  };

  /* The last N days that actually have a mood record, oldest first. */
  function recentMoods(n) {
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      var key = Hub.shiftDay(Hub.today(), -i);
      var m = Hub.day(key).mood;
      if (m) out.push({ date: key, mood: m });
    }
    return out;
  }

  function avgOf(list, key) {
    var vals = list.map(function (r) { return r.mood[key]; }).filter(function (v) { return v; });
    if (!vals.length) return "—";
    return (vals.reduce(function (a, b) { return a + b; }, 0) / vals.length).toFixed(1);
  }


  /* ======================================================================
     6. BREATHWORK — mechanics rather than meditation
     ----------------------------------------------------------------------
     Mindfulness uses the breath to settle the mind. This section trains the
     breathing itself: nasal habit, diaphragm mechanics, and CO2 tolerance —
     the thing that actually determines whether you're gasping at the top of a
     set of pull-ups.

     Sessions land in the same `mindful` array so they count toward that
     streak; breath-hold measurements go to `logs.breathTests` because they're
     data points, not sessions.
     ====================================================================== */
  var BREATH_DRILLS = [
    {
      id: "nasal", emoji: "👃", name: "Nasal breathing practice", sec: 300,
      tag: "The default to build",
      blurb: "Nose breathing filters, warms and humidifies air, and produces nitric oxide that helps " +
             "oxygen uptake. Most people mouth-breathe by habit, not necessity.",
      steps: ["Close your mouth and breathe only through your nose.",
              "Aim for slow, quiet, low breaths into the belly — you shouldn't hear yourself.",
              "If you feel air-hungry, slow down rather than opening your mouth.",
              "The goal is to make this unremarkable, including during easy training."]
    },
    {
      id: "diaphragm", emoji: "🫁", name: "Diaphragmatic breathing", sec: 300,
      tag: "Fix the mechanics",
      blurb: "Desk posture turns most people into shallow chest breathers, which keeps the neck and " +
             "shoulders working all day. This retrains the diaphragm to do its job.",
      steps: ["Lie on your back, knees bent. One hand on your chest, one on your belly.",
              "Breathe in through your nose so only the belly hand rises.",
              "Exhale slowly and completely — the exhale is the part most people rush.",
              "Aim for roughly six breaths per minute: in for four, out for six."]
    },
    {
      id: "coherent", emoji: "〰️", name: "Coherent breathing", sec: 300,
      tag: "5-5, steady",
      blurb: "Five seconds in, five out. Sits near the rate where heart-rate variability peaks — " +
             "useful between sets, before sleep, or any time you want to downshift without drowsiness.",
      steps: ["Sit upright, breathe through the nose.",
              "In for five, out for five, with no pause at either end.",
              "Keep it smooth — the aim is a continuous wave, not a series of steps.",
              "Let the shoulders stay down throughout."]
    },
    {
      id: "physio-sigh", emoji: "😮‍💨", name: "Physiological sigh", sec: 120,
      tag: "Fastest reset",
      blurb: "A double inhale followed by a long exhale. The quickest deliberate way to bring arousal " +
             "down — a few rounds work in under a minute.",
      steps: ["Inhale through the nose, then take a second short sip of air on top.",
              "Let it all out slowly through the mouth, longer than the inhale.",
              "Repeat. Three rounds is often enough.",
              "Use it before a hard set, or when something has wound you up."]
    }
  ];

  var breathwork = {
    render: function () {
      var tests = (Hub.state.logs.breathTests || []).slice()
        .sort(function (a, b) { return b.date < a.date ? -1 : 1; });
      var bolt = tests.filter(function (t) { return t.kind === "bolt"; });
      var best = bolt.length ? Math.max.apply(null, bolt.map(function (t) { return t.seconds; })) : null;
      var latest = bolt[0] || null;

      return '<div class="wh-card wh-card--accent wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("lungs") +
            "Why train breathing separately</div></div>" +
          '<p class="wh-sm wh-muted">Mindfulness uses the breath to settle the mind. This trains the ' +
            "breathing itself — nasal habit, diaphragm mechanics, and tolerance to rising CO₂. That last " +
            "one is what usually makes you feel out of breath, and it's trainable. Sessions here count " +
            "toward your mindfulness streak.</p>" +
        "</div>" +

        '<div class="wh-exgrid wh-mb4">' + BREATH_DRILLS.map(function (b) {
          return '<div class="wh-ex">' +
            '<div class="wh-ex__head"><div class="wh-ex__ic">' + b.emoji + "</div>" +
              '<div><div class="wh-ex__name">' + Hub.esc(b.name) + "</div>" +
              '<div class="wh-ex__dur">' + Hub.clock(b.sec) + "</div></div></div>" +
            '<span class="wh-chip wh-chip--accent" style="align-self:flex-start">' + Hub.esc(b.tag) + "</span>" +
            '<p class="wh-ex__desc">' + Hub.esc(b.blurb) + "</p>" +
            '<ol class="wh-ex__steps">' + b.steps.map(function (t) { return "<li>" + Hub.esc(t) + "</li>"; }).join("") + "</ol>" +
            '<div class="wh-ex__foot"><button type="button" class="wh-btn wh-btn--primary wh-btn--sm" ' +
              'data-drill="' + b.id + '">' + Hub.icon("play") + "Start</button></div>" +
          "</div>";
        }).join("") + "</div>" +

        /* ---------- BOLT / CO2 tolerance ---------- */
        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("clockIc") +
            "CO₂ tolerance (BOLT)</div>" +
            (best ? '<span class="wh-chip wh-chip--good">best ' + best + "s</span>" : "") + "</div>" +
          '<p class="wh-sm wh-muted">The <strong>Body Oxygen Level Test</strong>: after a normal breath out, ' +
            "hold until you feel the <em>first definite urge</em> to breathe — not until you're straining. " +
            "It measures how tolerant you are of rising CO₂, and it responds to practice over weeks.</p>" +
          '<ol class="wh-ex__steps wh-mt4">' +
            "<li>Sit quietly for a couple of minutes first.</li>" +
            "<li>Breathe in normally through the nose, then out normally.</li>" +
            "<li>Pinch your nose and start the timer.</li>" +
            "<li>Stop at the <strong>first real urge</strong> — a swallow, or the diaphragm twitching.</li>" +
            "<li>Your next breath should be calm. If you gasp, you held too long and the number is meaningless.</li>" +
          "</ol>" +
          '<div class="wh-row wh-mt4">' +
            '<button type="button" class="wh-btn wh-btn--primary" id="br-bolt">' + Hub.icon("play") + "Run the test</button>" +
            (latest ? '<span class="wh-help">Last: <strong class="mono">' + latest.seconds + "s</strong> · " +
              Hub.relDay(latest.date) + "</span>" : "") +
          "</div>" +
          (bolt.length >= 2
            ? '<div class="wh-mt6"><div class="wh-xs wh-faint wh-mb4">Recent tests</div>' +
              '<div class="wh-loglist">' + bolt.slice(0, 8).map(function (t) {
                return '<div class="wh-logrow"><span class="wh-logrow__date">' + Hub.prettyDate(t.date) + "</span>" +
                  '<span class="wh-logrow__main">' + t.seconds + "s</span>" +
                  '<button type="button" class="wh-logrow__del" data-delbolt="' + t.id + '" ' +
                    'aria-label="Delete test">' + Hub.icon("trash") + "</button></div>";
              }).join("") + "</div></div>"
            : "") +
          '<p class="wh-help wh-mt4">Rough guide: under 10s suggests a lot of room to improve; 20–30s is ' +
            "common; 40s+ is well trained. It's a relative measure — your own trend matters far more than the number.</p>" +
        "</div>" +

        '<div class="wh-disclaimer">' + Hub.icon("alert") +
          "<span>Breath-holds and intense breathing drills are <strong>not for everyone</strong>. Don't do " +
          "them in water, while driving, or standing up. Avoid them entirely if you're pregnant, or have " +
          "epilepsy, uncontrolled blood pressure, a heart condition, or a history of fainting — check with " +
          "a doctor first. Never push a hold to distress; light-headedness means stop.</span></div>";
    },

    wire: function (el) {
      Hub.delegate(el, "[data-drill]", function (b) {
        var d = BREATH_DRILLS.filter(function (x) { return x.id === b.dataset.drill; })[0];
        if (d) runDrill(d);
      });
      el.querySelector("#br-bolt").addEventListener("click", runBolt);
      Hub.delegate(el, "[data-delbolt]", function (b) {
        Hub.state.logs.breathTests = Hub.state.logs.breathTests.filter(function (t) {
          return t.id !== b.dataset.delbolt;
        });
        Hub.commit();
        Hub.toast("Test deleted.", "info", 2000);
      });
    }
  };

  /* A plain guided drill — instructions plus a countdown. */
  function runDrill(drill) {
    var timer = null;
    var inner = Hub.focus.open(
      '<div class="wh-focus__title">' + drill.emoji + " " + Hub.esc(drill.name) + "</div>" +
      '<div class="wh-clock" id="bw-clock">' + Hub.clock(drill.sec) + "</div>" +
      '<ol class="wh-ex__steps wh-mt4" style="text-align:left;max-width:440px;margin-inline:auto">' +
        drill.steps.map(function (t) { return "<li>" + Hub.esc(t) + "</li>"; }).join("") + "</ol>" +
      '<div class="wh-focus__cue">Slow and quiet. If you feel light-headed, stop.</div>' +
      '<div class="wh-focus__actions">' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="bw-quit">' + Hub.icon("stop") + "Finish early</button></div>",
      function () { if (timer) timer.stop(); }
    );
    var clockEl = inner.querySelector("#bw-clock");
    inner.querySelector("#bw-quit").addEventListener("click", function () {
      var done = Math.round(timer ? timer.elapsed() : 0);
      Hub.focus.close();
      if (done >= 30) logMindful(drill.id, done);
      else Hub.toast("Session too short to log.", "info", 2200);
    });

    var last = -1;
    timer = new Hub.Timer({
      duration: drill.sec, interval: 250,
      onTick: function (r) {
        var w = Math.ceil(r);
        if (w !== last) { last = w; clockEl.textContent = Hub.clock(w); }
      },
      onDone: function () {
        Hub.cueDone();
        Hub.focus.close();
        logMindful(drill.id, drill.sec);
      }
    });
    timer.start();
  }

  /* A count-UP timer: you stop it, it doesn't stop you. */
  function runBolt() {
    var started = Date.now();
    var tick = null;
    var inner = Hub.focus.open(
      '<div class="wh-focus__title">⏱️ BOLT — hold after a normal exhale</div>' +
      '<div class="wh-clock" id="bo-clock">0</div>' +
      '<div class="wh-focus__cue">Stop at the <strong>first definite urge</strong> to breathe — ' +
        "not at your limit. Your next breath should be calm.</div>" +
      '<div class="wh-focus__actions">' +
        '<button type="button" class="wh-btn wh-btn--primary" id="bo-stop" data-focus-primary>I need to breathe</button>' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="bo-cancel">Cancel</button></div>',
      function () { if (tick) clearInterval(tick); }
    );
    var clockEl = inner.querySelector("#bo-clock");
    tick = setInterval(function () {
      clockEl.textContent = Math.floor((Date.now() - started) / 1000);
    }, 200);

    inner.querySelector("#bo-cancel").addEventListener("click", function () { Hub.focus.close(); });
    inner.querySelector("#bo-stop").addEventListener("click", function () {
      var secs = Math.round((Date.now() - started) / 1000);
      clearInterval(tick);
      Hub.focus.close();
      if (secs < 3) { Hub.toast("That was too short to record.", "warn"); return; }
      Hub.state.logs.breathTests.push({
        id: "b" + Date.now(), date: Hub.today(), kind: "bolt", seconds: secs
      });
      Hub.commit();
      Hub.beep(660, 120);
      Hub.toast("BOLT recorded: " + secs + "s.", "success");
    });
  }

  /* ======================================================================
     7. NUTRITION — habit tracking, deliberately not a diet plan
     ====================================================================== */
  var NUTRITION_HABITS = [
    { key: "veg",      label: "Vegetables at 2+ meals",     sub: "Variety matters more than volume — different colours, different nutrients." },
    { key: "fruit",    label: "2 pieces of fruit",          sub: "Whole fruit rather than juice; the fibre is most of the point." },
    { key: "protein",  label: "Protein at every meal",      sub: "Keeps you full and supports recovery from training." },
    { key: "water",    label: "Hit my hydration goal",      sub: "Mirrors the Hydration tab automatically." },
    { key: "wholegrain", label: "A whole-grain source",     sub: "Oats, brown rice, whole wheat — steadier energy than refined." },
    { key: "nosugarlate", label: "No sugar within 3h of bed", sub: "Late glucose swings fragment the first half of the night." },
    { key: "mindful",  label: "Ate at least one meal away from a screen", sub: "Eating while distracted reliably means eating more." },
    { key: "noultra",  label: "Kept ultra-processed food low", sub: "A direction of travel, not a rule to be perfect about." }
  ];

  var nutrition = {
    render: function () {
      var d = Hub.day();
      var goal = Hub.state.settings.hydrationGoalCups || 8;
      var nut = d.nutrition || {};
      /* The hydration habit is derived, not clickable — one source of truth. */
      var derived = { water: d.water >= goal };
      var doneCount = NUTRITION_HABITS.filter(function (h) {
        return h.key in derived ? derived[h.key] : nut[h.key];
      }).length;

      return '<div class="wh-card wh-card--accent wh-mb4">' +
          '<div class="wh-card__head">' +
            '<div class="wh-card__title">' + Hub.icon("apple") + "Today's food habits</div>" +
            '<span class="wh-chip ' + (doneCount === NUTRITION_HABITS.length ? "wh-chip--good" : "wh-chip--accent") + '">' +
              doneCount + "/" + NUTRITION_HABITS.length + "</span>" +
          "</div>" +
          '<div class="wh-bar wh-mb4"><div class="wh-bar__fill" style="width:' +
            Hub.pct(doneCount, NUTRITION_HABITS.length) + "%;background:" +
            (doneCount === NUTRITION_HABITS.length ? "var(--green-bright)" : "var(--purple-bright)") + '"></div></div>' +
          '<div class="wh-stack wh-stack--sm">' +
            NUTRITION_HABITS.map(function (h) {
              var isDerived = h.key in derived;
              var on = isDerived ? derived[h.key] : !!nut[h.key];
              return '<button type="button" class="wh-check' + (on ? " is-done" : "") + '" ' +
                  (isDerived ? "disabled " : 'data-nut="' + h.key + '" ') +
                  'aria-pressed="' + on + '"' + (isDerived ? ' title="Tracked automatically from the Hydration tab"' : "") + ">" +
                '<span class="wh-check__box">' + Hub.icon("check") + "</span>" +
                '<span class="wh-check__text">' + Hub.esc(h.label) +
                  '<span class="wh-check__sub">' + Hub.esc(h.sub) +
                  (isDerived ? " · " + d.water + "/" + goal + " cups" : "") + "</span></span>" +
              "</button>";
            }).join("") +
          "</div>" +
        "</div>" +

        '<div class="wh-card">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("clockIc") + "This week</div></div>" +
          weekStrip("nutrition") +
          '<p class="wh-help wh-mt4">Shows days where you ticked at least half the list.</p>' +
        "</div>" +

        '<div class="wh-disclaimer wh-mt4">' + Hub.icon("info") +
          "<span>This is a <strong>habit checklist, not a diet prescription</strong>. It doesn't count calories, " +
          "set targets, or know anything about your circumstances. For anything to do with a medical condition, " +
          "an eating disorder, pregnancy, or a specific performance goal, talk to a qualified professional.</span></div>";
    },

    wire: function (el) {
      Hub.delegate(el, "[data-nut]", function (btn) {
        var d = Hub.editDay();
        var key = btn.dataset.nut;
        if (d.nutrition[key]) delete d.nutrition[key];
        else d.nutrition[key] = true;
        Hub.commit();
        Hub.beep(660, 80);
      });
    }
  };

  /* ======================================================================
     8. INTAKE — caffeine, alcohol, and when the screens went off
     ----------------------------------------------------------------------
     These three are the biggest levers on the sleep and mood this app already
     measures, and until now it collected none of them — which meant the
     pattern engine could tell you sleep affected your mood, but never that
     the 4pm coffee affected the sleep.

     Caffeine is logged by drink rather than by milligrams, because nobody
     knows the milligrams. The figures are rough averages and the UI says so.
     ====================================================================== */
  var DRINKS = [
    { id: "espresso", emoji: "☕", name: "Espresso", mg: 63, sub: "single shot" },
    { id: "coffee", emoji: "🍵", name: "Brewed coffee", mg: 95, sub: "one mug" },
    { id: "instant", emoji: "☕", name: "Instant coffee", mg: 62, sub: "one mug" },
    { id: "tea", emoji: "🫖", name: "Black tea", mg: 47, sub: "one mug" },
    { id: "green", emoji: "🍃", name: "Green tea", mg: 28, sub: "one mug" },
    { id: "cola", emoji: "🥤", name: "Cola", mg: 34, sub: "330ml" },
    { id: "energy", emoji: "⚡", name: "Energy drink", mg: 80, sub: "250ml" },
    { id: "preworkout", emoji: "💥", name: "Pre-workout", mg: 200, sub: "one scoop" }
  ];

  var DRINKS_ALC = [
    { id: "beer", emoji: "🍺", name: "Beer", units: 2, sub: "pint, 4%" },
    { id: "wine", emoji: "🍷", name: "Wine", units: 2.1, sub: "175ml glass" },
    { id: "spirit", emoji: "🥃", name: "Spirit", units: 1, sub: "25ml measure" },
    { id: "cocktail", emoji: "🍸", name: "Cocktail", units: 2, sub: "typical" }
  ];

  var intake = {
    render: function () {
      var d = Hub.day();
      var caff = d.caffeineMg || 0;
      var alc = d.alcoholUnits || 0;

      /* Weekly context: the number that actually matters for alcohol. */
      var weekUnits = 0, weekCaffDays = 0, weekAlcFreeDays = 0;
      for (var i = 0; i < 7; i++) {
        var dd = Hub.day(Hub.shiftDay(Hub.today(), -i));
        weekUnits += dd.alcoholUnits || 0;
        if ((dd.caffeineMg || 0) > 0) weekCaffDays++;
        if (!(dd.alcoholUnits || 0)) weekAlcFreeDays++;
      }

      var night = nightFor(Hub.viewDate());
      var gap = null;
      if (d.screenOff && night && night.bed) {
        gap = Hub.insights.SERIES.screenBeforeBed.get(Hub.viewDate());
      }

      return '<div class="wh-grid wh-grid--3 wh-mb4">' +
          '<div class="wh-stat"><div class="wh-stat__label">Caffeine today</div>' +
            '<div class="wh-stat__value" style="color:' +
              (caff > 400 ? "var(--red-bright)" : caff > 200 ? "var(--yellow-bright)" : "var(--fg0)") + '">' +
              Math.round(caff) + "<small>mg</small></div>" +
            '<div class="wh-stat__sub">' + (caff > 400 ? "above the usual 400mg guide" : "guide: under 400mg") + "</div></div>" +
          '<div class="wh-stat"><div class="wh-stat__label">Alcohol this week</div>' +
            '<div class="wh-stat__value" style="color:' +
              (weekUnits > 14 ? "var(--red-bright)" : weekUnits > 10 ? "var(--yellow-bright)" : "var(--fg0)") + '">' +
              (Math.round(weekUnits * 10) / 10) + "<small>units</small></div>" +
            '<div class="wh-stat__sub">' + weekAlcFreeDays + " drink-free " + Hub.plural(weekAlcFreeDays, "day") + "</div></div>" +
          '<div class="wh-stat"><div class="wh-stat__label">Screens off</div>' +
            '<div class="wh-stat__value" style="font-size:22px">' + (d.screenOff ? Hub.esc(d.screenOff) : "—") + "</div>" +
            '<div class="wh-stat__sub">' + (gap != null ? gap + " min before bed" : "not logged") + "</div></div>" +
        "</div>" +

        /* ---------- caffeine ---------- */
        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head">' +
            '<div class="wh-card__title">' + Hub.icon("coffee") + "Caffeine</div>" +
            '<span class="wh-chip' + (caff ? " wh-chip--accent" : "") + '">' + Math.round(caff) + " mg</span>" +
          "</div>" +
          '<p class="wh-sm wh-muted wh-mb4">Tap what you drank. These are rough averages — a strong ' +
            "flat white or a home brew can be double the figure shown, so treat the total as an estimate " +
            "you compare against yourself, not a measurement.</p>" +
          '<div class="wh-quick">' + DRINKS.map(function (dr) {
            return '<button type="button" class="wh-quickbtn" data-drink="' + dr.id + '" ' +
                'style="--wh-qc:var(--orange-bright)">' +
              '<span class="wh-quickbtn__ic">' + dr.emoji + "</span>" +
              '<span class="wh-grow"><span style="display:block">' + dr.name + "</span>" +
              '<span class="wh-quickbtn__meta">' + dr.sub + " · " + dr.mg + "mg</span></span>" +
            "</button>";
          }).join("") + "</div>" +
          '<div class="wh-row wh-mt4">' +
            '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" id="in-caff-clear"' +
              (caff ? "" : " disabled") + ">Clear today</button>" +
            '<span class="wh-help">Half-life is 5–6 hours: a 3pm coffee is still a quarter present at midnight.</span>' +
          "</div>" +
        "</div>" +

        /* ---------- alcohol ---------- */
        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head">' +
            '<div class="wh-card__title">' + Hub.icon("drop") + "Alcohol</div>" +
            '<span class="wh-chip' + (alc ? " wh-chip--accent" : "") + '">' +
              (Math.round(alc * 10) / 10) + " units</span>" +
          "</div>" +
          '<div class="wh-quick">' + DRINKS_ALC.map(function (dr) {
            return '<button type="button" class="wh-quickbtn" data-alc="' + dr.id + '" ' +
                'style="--wh-qc:var(--red-bright)">' +
              '<span class="wh-quickbtn__ic">' + dr.emoji + "</span>" +
              '<span class="wh-grow"><span style="display:block">' + dr.name + "</span>" +
              '<span class="wh-quickbtn__meta">' + dr.sub + " · " + dr.units + " units</span></span>" +
            "</button>";
          }).join("") + "</div>" +
          '<div class="wh-row wh-mt4">' +
            '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" id="in-alc-clear"' +
              (alc ? "" : " disabled") + ">Clear today</button>" +
            '<span class="wh-help">A unit is 10ml of pure alcohol. Sizes and strengths vary enormously — ' +
              "a craft IPA can be twice a standard pint.</span>" +
          "</div>" +
          (weekUnits > 14
            ? '<div class="wh-disclaimer wh-mt4">' + Hub.icon("alert") +
              "<span>You've logged " + (Math.round(weekUnits * 10) / 10) + " units this week. Most national " +
              "guidance sits around 14 a week spread over three or more days. This app isn't the right " +
              "place to work out what that means for you — a GP is.</span></div>"
            : "") +
        "</div>" +

        /* ---------- screens ---------- */
        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("moon") + "Wind-down</div></div>" +
          '<p class="wh-sm wh-muted wh-mb4">When did the screens actually go off? Paired with your bedtime, ' +
            "this becomes a number the Patterns tab can test against your sleep quality.</p>" +
          '<div class="wh-row">' +
            '<input class="wh-input" type="time" id="in-screen" value="' + Hub.esc(d.screenOff || "") +
              '" aria-label="Time screens went off" />' +
            '<button type="button" class="wh-btn wh-btn--primary wh-btn--sm" id="in-screen-now">Just now</button>' +
            (d.screenOff
              ? '<button type="button" class="wh-btn wh-btn--ghost wh-btn--sm" id="in-screen-clear">Clear</button>'
              : "") +
          "</div>" +
          (gap != null
            ? '<p class="wh-sm wh-mt4" style="color:' + (gap >= 45 ? "var(--green-bright)" : "var(--yellow-bright)") + '">' +
              gap + " minutes between screens off and bed" +
              (gap >= 45 ? " — that's a real wind-down." : " — most of the benefit shows up past about 45.") + "</p>"
            : '<p class="wh-help wh-mt4">Log a bedtime in the Sleep tab too and the gap is worked out for you.</p>') +
        "</div>" +

        /* ---------- history ---------- */
        '<div class="wh-card">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("clockIc") + "Last 14 days</div></div>" +
          '<div class="wh-intakegrid">' + (function () {
            var rows = "";
            for (var i = 13; i >= 0; i--) {
              var k = Hub.shiftDay(Hub.today(), -i);
              var dd = Hub.day(k);
              rows += '<div class="wh-intakerow">' +
                '<span class="wh-xs wh-faint mono">' + Hub.prettyDate(k) + "</span>" +
                '<span class="wh-intakebar"><span style="width:' +
                  Math.min(100, (dd.caffeineMg || 0) / 400 * 100) + "%;background:var(--orange-bright)\"></span></span>" +
                '<span class="mono wh-xs">' + (dd.caffeineMg ? Math.round(dd.caffeineMg) + "mg" : "—") + "</span>" +
                '<span class="wh-intakebar"><span style="width:' +
                  Math.min(100, (dd.alcoholUnits || 0) / 6 * 100) + "%;background:var(--red-bright)\"></span></span>" +
                '<span class="mono wh-xs">' + (dd.alcoholUnits ? (Math.round(dd.alcoholUnits * 10) / 10) + "u" : "—") + "</span>" +
              "</div>";
            }
            return rows;
          })() + "</div>" +
          '<p class="wh-help wh-mt4">Caffeine against a 400mg scale, alcohol against 6 units.</p>' +
        "</div>";
    },

    wire: function (el) {
      Hub.delegate(el, "[data-drink]", function (b) {
        var dr = DRINKS.filter(function (x) { return x.id === b.dataset.drink; })[0];
        if (!dr) return;
        var d = Hub.editDay();
        d.caffeineMg = Math.max(0, (d.caffeineMg || 0) + dr.mg);
        Hub.commit();
        Hub.beep(640, 80);
        Hub.toast(dr.name + " logged — " + Math.round(d.caffeineMg) + "mg today.", "success", 2200);
      });

      Hub.delegate(el, "[data-alc]", function (b) {
        var dr = DRINKS_ALC.filter(function (x) { return x.id === b.dataset.alc; })[0];
        if (!dr) return;
        var d = Hub.editDay();
        d.alcoholUnits = Math.round(Math.max(0, (d.alcoholUnits || 0) + dr.units) * 10) / 10;
        Hub.commit();
        Hub.beep(600, 80);
        Hub.toast(dr.name + " logged — " + d.alcoholUnits + " units today.", "success", 2200);
      });

      var caffClear = el.querySelector("#in-caff-clear");
      if (caffClear) caffClear.addEventListener("click", function () {
        Hub.editDay().caffeineMg = 0;
        Hub.commit();
        Hub.toast("Caffeine cleared.", "info", 2000);
      });

      var alcClear = el.querySelector("#in-alc-clear");
      if (alcClear) alcClear.addEventListener("click", function () {
        Hub.editDay().alcoholUnits = 0;
        Hub.commit();
        Hub.toast("Alcohol cleared.", "info", 2000);
      });

      el.querySelector("#in-screen").addEventListener("change", function (e) {
        var v = e.target.value;
        Hub.editDay().screenOff = /^\d{2}:\d{2}$/.test(v) ? v : null;
        Hub.commit();
      });
      el.querySelector("#in-screen-now").addEventListener("click", function () {
        var now = new Date();
        Hub.editDay().screenOff = String(now.getHours()).padStart(2, "0") + ":" +
                                  String(now.getMinutes()).padStart(2, "0");
        Hub.commit();
        Hub.toast("Wind-down started.", "success", 2000);
      });
      var sc = el.querySelector("#in-screen-clear");
      if (sc) sc.addEventListener("click", function () {
        Hub.editDay().screenOff = null;
        Hub.commit();
      });
    }
  };

  /* ======================================================================
     SHARED HELPERS
     ====================================================================== */

  /* A seven-dot strip of the last week for a given metric. */
  function weekStrip(kind) {
    var goal = Hub.state.settings.hydrationGoalCups || 8;
    var days = [];
    for (var i = 6; i >= 0; i--) {
      var key = Hub.shiftDay(Hub.today(), -i);
      var d = Hub.day(key);
      var done;
      if (kind === "hydration") done = d.water >= goal;
      else if (kind === "stretchDone") done = d.stretch > 0;
      else if (kind === "nutrition") done = Object.keys(d.nutrition || {}).length >= NUTRITION_HABITS.length / 2;
      else done = false;
      days.push({ key: key, done: done });
    }
    return '<div class="wh-row" style="gap:6px">' + days.map(function (x) {
      var label = Hub.prettyDate(x.key);
      return '<div title="' + label + (x.done ? " — done" : "") + '" ' +
        'style="flex:1;height:26px;border-radius:5px;border:1px solid ' +
        (x.done ? "var(--green-bright)" : "var(--bg2)") + ";background:" +
        (x.done ? "rgba(184,187,38,.22)" : "var(--bg0-soft)") + '"></div>';
    }).join("") + "</div>";
  }

  /* Shared toggle behaviour for the interval reminders exposed in this view. */
  function toggleReminder(key, on) {
    Hub.state.settings.reminders[key].enabled = on;
    Hub.save();
    Hub.reminders.sync();
    if (on && Hub.notify.permission() === "default") Hub.notify.request();
    Hub.toast(on ? "Reminders on." : "Reminders off.", on ? "success" : "info", 2200);
    Hub.refresh();
  }

  /* ======================================================================
     10. YOUR OWN HABITS
     ----------------------------------------------------------------------
     Everything else in this app is a habit somebody else decided mattered.
     These are yours: same streaks, same heatmap, same weekly review, same
     grace days — they register as real categories, not a second-class list.
     ====================================================================== */
  var HABIT_ICONS = ["check", "star", "flame", "water", "apple", "wind", "moon", "sun", "hand",
    "foot", "lungs", "pulse", "stretchIc", "bodycare", "trophy", "lightbulb"];

  var HABIT_COLORS = [
    ["var(--yellow-bright)", "Yellow"], ["var(--green-bright)", "Green"],
    ["var(--blue-bright)", "Blue"], ["var(--purple-bright)", "Purple"],
    ["var(--orange-bright)", "Orange"], ["var(--aqua-bright)", "Aqua"],
    ["var(--red-bright)", "Red"]
  ];

  var habits = {
    render: function () {
      var list = Hub.state.logs.customHabits || [];
      var active = list.filter(function (h) { return h.active !== false; });
      var d = Hub.day();
      var ticks = d.custom || {};

      return '<div class="wh-card wh-card--accent wh-mb4">' +
          '<div class="wh-card__head">' +
            '<div class="wh-card__title">' + Hub.icon("star") + "Your own habits" +
              (Hub.isBackfilling() ? " · " + Hub.prettyDate(Hub.viewDate()) : "") + "</div>" +
            '<button type="button" class="wh-btn wh-btn--sm wh-btn--primary" id="ha-add">' +
              Hub.icon("plus") + "New habit</button>" +
          "</div>" +

          (active.length
            ? '<div class="wh-stack wh-stack--sm">' + active.map(function (h) {
                var st = (Hub.state.streaks || {})["custom:" + h.id] || { current: 0, best: 0, unit: "day" };
                var on = !!ticks[h.id];
                var cad = Hub.gamify.cadenceFor("custom:" + h.id);
                return '<button type="button" class="wh-check' + (on ? " is-done" : "") + '" ' +
                    'data-habit="' + h.id + '" aria-pressed="' + on + '" ' +
                    'style="--wh-qc:' + (h.color || "var(--yellow-bright)") + '">' +
                  '<span class="wh-check__box">' + Hub.icon("check") + "</span>" +
                  '<span class="wh-check__text">' + Hub.esc(h.name) +
                    '<span class="wh-check__sub">' +
                      (cad.type === "weekly"
                        ? cad.perWeek + "× a week · " + (st.weekCount || 0) + " done this week · " +
                          st.current + " " + Hub.plural(st.current, "week") + " running"
                        : "daily · " + st.current + "-day streak, best " + st.best) +
                    "</span></span>" +
                  '<span class="wh-check__edit" data-edithabit="' + h.id + '" role="button" tabindex="0" ' +
                    'aria-label="Edit ' + Hub.esc(h.name) + '">' + Hub.icon("settings") + "</span>" +
                "</button>";
              }).join("") + "</div>"
            : '<div class="wh-empty">' + Hub.icon("star") + "<strong>No habits of your own yet</strong>" +
              "Add anything you want to keep: reading, a language, physio exercises, calling someone. " +
              "It gets the same streaks, heatmap and weekly review as everything built in.</div>") +
        "</div>" +

        (list.filter(function (h) { return h.active === false; }).length
          ? '<div class="wh-card wh-mb4">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("clockIc") + "Paused</div></div>" +
            '<div class="wh-stack wh-stack--sm">' +
              list.filter(function (h) { return h.active === false; }).map(function (h) {
                return '<div class="wh-logrow"><span class="wh-logrow__main">' + Hub.esc(h.name) + "</span>" +
                  '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" style="margin-left:auto" ' +
                    'data-edithabit="' + h.id + '">Edit</button></div>';
              }).join("") + "</div></div>"
          : "") +

        '<div class="wh-card">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("info") + "How these behave</div></div>" +
          '<p class="wh-sm wh-muted">A habit you add here is a first-class citizen: it appears in the ' +
            "Insights heatmap, in the weekly and monthly review, and in the day-detail view. It can be " +
            "daily or a number of times a week, and it uses the same grace-day allowance as everything else.</p>" +
          '<p class="wh-help wh-mt4">Deleting a habit removes it and its streak, but the individual days ' +
            "you ticked stay in your logs — so re-creating it with the same name won't resurrect them.</p>" +
        "</div>";
    },

    wire: function (el) {
      el.querySelector("#ha-add").addEventListener("click", function () { habitDialog(null); });

      Hub.delegate(el, "[data-habit]", function (b, e) {
        if (e.target.closest("[data-edithabit]")) return;
        var id = b.dataset.habit;
        var d = Hub.editDay();
        if (d.custom[id]) delete d.custom[id];
        else d.custom[id] = true;
        Hub.commit();
        if (d.custom[id]) {
          Hub.beep(700, 85);
          Hub.gamify.checkMilestone("custom:" + id);
        }
      });

      Hub.delegate(el, "[data-edithabit]", function (b) {
        var h = (Hub.state.logs.customHabits || []).filter(function (x) { return x.id === b.dataset.edithabit; })[0];
        if (h) habitDialog(h);
      });
    }
  };

  function habitDialog(existing) {
    var h = existing || {
      id: "h" + Date.now(), name: "", icon: "check", color: HABIT_COLORS[0][0],
      cadence: { type: "daily" }, active: true, createdISO: Hub.today()
    };
    var cad = h.cadence || { type: "daily" };

    Hub.modal({
      title: existing ? "Edit habit" : "New habit",
      body:
        '<label class="wh-field"><span class="wh-field__label">Name</span>' +
          '<input class="wh-input" id="ha-name" type="text" maxlength="32" value="' + Hub.esc(h.name) + '" ' +
          'placeholder="e.g. Read 20 pages" /></label>' +

        '<div class="wh-field wh-mt4"><span class="wh-field__label">How often</span>' +
          '<div class="wh-seg" id="ha-cad">' +
            '<button type="button" class="wh-seg__btn' + (cad.type !== "weekly" ? " is-on" : "") +
              '" data-cad="daily">Every day</button>' +
            '<button type="button" class="wh-seg__btn' + (cad.type === "weekly" ? " is-on" : "") +
              '" data-cad="weekly">Times a week</button>' +
          "</div></div>" +

        '<label class="wh-field wh-mt4" id="ha-perwrap"><span class="wh-field__label">Times per week</span>' +
          '<input class="wh-input" id="ha-per" type="number" min="1" max="7" step="1" value="' +
            (cad.perWeek || 3) + '" /></label>' +
        '<p class="wh-help">A weekly habit counts consecutive weeks that hit the target, and the ' +
          "current week is never counted as failed until it's over.</p>" +

        '<div class="wh-field wh-mt4"><span class="wh-field__label">Icon</span>' +
          '<div class="wh-row" id="ha-icons" style="flex-wrap:wrap;gap:6px">' + HABIT_ICONS.map(function (ic) {
            return '<button type="button" class="wh-iconpick' + (h.icon === ic ? " is-on" : "") + '" ' +
              'data-icon="' + ic + '" aria-label="' + ic + '" aria-pressed="' + (h.icon === ic) + '">' +
              Hub.icon(ic) + "</button>";
          }).join("") + "</div></div>" +

        '<div class="wh-field wh-mt4"><span class="wh-field__label">Colour</span>' +
          '<div class="wh-row" id="ha-colors" style="flex-wrap:wrap;gap:6px">' + HABIT_COLORS.map(function (c) {
            return '<button type="button" class="wh-colorpick' + (h.color === c[0] ? " is-on" : "") + '" ' +
              'data-color="' + c[0] + '" aria-label="' + c[1] + '" aria-pressed="' + (h.color === c[0]) + '" ' +
              'style="background:' + c[0] + '"></button>';
          }).join("") + "</div></div>" +

        (existing
          ? '<label class="wh-switch wh-mt6"><input type="checkbox" id="ha-active"' +
            (h.active !== false ? " checked" : "") + " />" +
            '<span class="wh-switch__track"></span><span class="wh-switch__label">Actively tracking this</span></label>'
          : ""),
      actions: [
        existing ? { label: "Delete", variant: "danger", onClick: function () {
          Hub.confirm({
            title: "Delete “" + h.name + "”?",
            body: "The habit and its streak go. The days you already ticked stay in your logs but " +
                  "stop being counted anywhere.",
            confirmLabel: "Delete habit",
            onConfirm: function () {
              Hub.state.logs.customHabits = Hub.state.logs.customHabits.filter(function (x) { return x.id !== h.id; });
              Hub.commit();
              Hub.toast("Habit deleted.", "info", 2200);
            }
          });
        } } : { label: "Cancel", variant: "ghost" },
        { label: "Save", variant: "primary", close: false, onClick: function () {
          var name = document.getElementById("ha-name").value.trim();
          if (!name) { Hub.toast("Give it a name.", "warn"); return; }

          var type = document.querySelector("#ha-cad .is-on").dataset.cad;
          var per = Math.round(Number(document.getElementById("ha-per").value) || 3);
          if (type === "weekly" && !(per >= 1 && per <= 7)) {
            Hub.toast("Pick between 1 and 7 times a week.", "warn");
            return;
          }

          h.name = name;
          h.cadence = type === "weekly" ? { type: "weekly", perWeek: per } : { type: "daily" };
          var ic = document.querySelector("#ha-icons .is-on");
          var co = document.querySelector("#ha-colors .is-on");
          h.icon = ic ? ic.dataset.icon : "check";
          h.color = co ? co.dataset.color : HABIT_COLORS[0][0];
          var act = document.getElementById("ha-active");
          h.active = act ? act.checked : true;
          if (!existing) Hub.state.logs.customHabits.push(h);

          Hub.closeModal();
          Hub.commit();
          Hub.toast("Saved.", "success", 2000);
        } }
      ],
      onOpen: function (body) {
        function pickOne(sel, cls) {
          body.querySelectorAll(sel).forEach(function (b) {
            b.addEventListener("click", function () {
              body.querySelectorAll(sel).forEach(function (x) {
                x.classList.remove(cls);
                x.setAttribute("aria-pressed", "false");
              });
              b.classList.add(cls);
              b.setAttribute("aria-pressed", "true");
            });
          });
        }
        pickOne("#ha-icons [data-icon]", "is-on");
        pickOne("#ha-colors [data-color]", "is-on");

        var perWrap = body.querySelector("#ha-perwrap");
        function syncCad() {
          var weekly = body.querySelector('#ha-cad [data-cad="weekly"]').classList.contains("is-on");
          perWrap.style.display = weekly ? "" : "none";
        }
        body.querySelectorAll("#ha-cad [data-cad]").forEach(function (b) {
          b.addEventListener("click", function () {
            body.querySelectorAll("#ha-cad [data-cad]").forEach(function (x) { x.classList.remove("is-on"); });
            b.classList.add("is-on");
            syncCad();
          });
        });
        syncCad();
      }
    });
  }

  /* ======================================================================
     VIEW
     ====================================================================== */
  var SECTIONS = {
    hydration: hydration, posture: posture, sleep: sleep,
    mindfulness: mindfulness, breathwork: breathwork, mood: mood, nutrition: nutrition,
    intake: intake, habits: habits
  };

  function render(el) {
    var pill = currentPill();

    el.innerHTML =
      '<div class="wh-head">' +
        '<div class="wh-head__eyebrow">Wellness</div>' +
        "<h1>The daily baseline</h1>" +
        "<p>Hydration, posture, sleep, mindfulness, mood, food, intake and whatever else you decide " +
        "to keep — the things that quietly decide how everything else feels.</p>" +
      "</div>" +

      /* Every logging control below writes to this date. */
      Hub.dateNav() +

      '<div class="wh-pills" role="tablist">' +
        visiblePills().map(function (p) {
          return '<button type="button" role="tab" class="wh-pill' + (p.id === pill ? " is-active" : "") + '" ' +
            'data-pill="' + p.id + '" aria-selected="' + (p.id === pill) + '">' +
            Hub.icon(p.icon) + "<span>" + p.label + "</span></button>";
        }).join("") +
      "</div>" +
      '<div id="wh-wellness-body">' + SECTIONS[pill].render() + "</div>";

    Hub.wireDateNav(el);
    Hub.delegate(el, "[data-pill]", function (btn) {
      Hub.uiSet("wellnessPill", btn.dataset.pill);
      Hub.refresh();
    });

    SECTIONS[pill].wire(el.querySelector("#wh-wellness-body"));
  }

  /* Public hook: the dashboard's "Breathe 1 min" quick action lands here so
     there's a single breathing implementation. */
  Hub.wellness = {
    quickBreathe: function () {
      Hub.uiSet("wellnessPill", "mindfulness");
      Hub.refresh();
      runBreathing(PATTERNS.box, 60);
    }
  };

  Hub.registerView("wellness", render);
})();
