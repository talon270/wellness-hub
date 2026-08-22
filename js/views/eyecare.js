/* ============================================================================
   WELLNESS HUB · EYE CARE
   ----------------------------------------------------------------------------
   · The 20-20-20 rule: explanation, reminder toggle, and a 20-second break timer
   · Five guided exercises, each with instructions and its own animated stage:
       palming · figure-eight tracing · near-far focus · blinking · eye rolls

   All five run through one `runExercise()` driver: it owns the focus overlay,
   the countdown and the completion bookkeeping, while each exercise supplies
   only its stage markup and a per-frame update. Adding a sixth exercise means
   adding one object to EXERCISES — nothing else.
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  /* ======================================================================
     EXERCISE DEFINITIONS
     ====================================================================== */
  var EXERCISES = [
    /* ---------------------------------------------------------------- */
    {
      id: "palming",
      emoji: "🤲",
      name: "Palming",
      duration: 60,
      blurb: "Warms and rests the eyes in complete darkness — the closest thing to a reset after long screen time.",
      steps: [
        "Rub your palms together for a few seconds until they feel warm.",
        "Cup them gently over your closed eyes — no pressure on the eyeballs.",
        "Rest the edges of your hands on your cheekbones and brow, blocking all light.",
        "Breathe slowly and let your eyes relax into the darkness."
      ],
      stage: function () {
        return '<div class="wh-focus__stage">' +
          '<div class="wh-eyecue" id="ex-stage" style="width:180px;height:180px">🤲</div></div>';
      },
      frame: function (el, elapsed) {
        /* A slow pulse gives the eye something to breathe along with. */
        el.classList.toggle("is-cue", Math.floor(elapsed / 4) % 2 === 0);
      },
      cue: function (elapsed, total) {
        if (elapsed < 8) return "Rub your palms together until they feel warm.";
        if (elapsed < 16) return "Cup them over your closed eyes. No pressure.";
        if (elapsed > total - 10) return "Almost there — keep breathing slowly.";
        return "Rest in the darkness. Let your jaw and forehead soften.";
      }
    },

    /* ---------------------------------------------------------------- */
    {
      id: "figure8",
      emoji: "∞",
      name: "Figure-Eight Tracing",
      duration: 60,
      blurb: "Moves the eyes through their full range in a smooth path, loosening the muscles that get stuck holding one fixed distance.",
      steps: [
        "Keep your head still — only your eyes move.",
        "Follow the dot as it traces the figure of eight.",
        "Track it smoothly rather than jumping ahead of it.",
        "If your eyes tire, blink; don't strain to keep up."
      ],
      stage: function () {
        /* A lemniscate drawn as two mirrored cubic curves. The dot is placed
           with getPointAtLength(), so the motion follows the exact path. */
        return '<div class="wh-focus__stage">' +
          '<svg class="wh-fig8" viewBox="0 0 400 200" id="ex-stage" aria-hidden="true">' +
            '<path class="wh-fig8__path" id="ex-fig8-path" ' +
              'd="M200 100 C 200 30, 340 30, 340 100 C 340 170, 200 170, 200 100 ' +
                 'C 200 30, 60 30, 60 100 C 60 170, 200 170, 200 100 Z"/>' +
            '<circle class="wh-fig8__dot" id="ex-fig8-dot" cx="200" cy="100" r="9"/>' +
          "</svg></div>";
      },
      frame: function (stageEl, elapsed) {
        var path = stageEl.querySelector("#ex-fig8-path");
        var dot = stageEl.querySelector("#ex-fig8-dot");
        if (!path || !dot || !path.getTotalLength) return;
        var len = path.getTotalLength();
        var LOOP = 8;                                  // seconds per full figure-eight
        var p = path.getPointAtLength(((elapsed % LOOP) / LOOP) * len);
        dot.setAttribute("cx", p.x);
        dot.setAttribute("cy", p.y);
      },
      cue: function (elapsed) {
        if (elapsed < 6) return "Head still. Eyes only.";
        if (elapsed > 28 && elapsed < 34) return "Halfway — keep it smooth.";
        return "Follow the dot around the loop.";
      }
    },

    /* ---------------------------------------------------------------- */
    {
      id: "nearfar",
      emoji: "🔭",
      name: "Near-Far Focus Shifting",
      duration: 60,
      blurb: "Trains the focusing muscle to actually change shape, instead of locking at screen distance all day.",
      steps: [
        "Hold your thumb up about 25cm (10in) from your face.",
        "When the near circle lights up, focus sharply on your thumb.",
        "When the far circle lights up, focus on something across the room — ideally out of a window.",
        "Let each image come fully sharp before the switch."
      ],
      stage: function () {
        return '<div class="wh-focus__stage"><div class="wh-nearfar" id="ex-stage">' +
          '<div class="wh-nearfar__mark wh-nearfar__mark--near" data-mark="near">NEAR<br>~25cm</div>' +
          '<div class="wh-nearfar__mark wh-nearfar__mark--far" data-mark="far">FAR</div>' +
        "</div></div>";
      },
      frame: function (stageEl, elapsed) {
        var near = Math.floor(elapsed / 5) % 2 === 0;   // swap every 5 seconds
        stageEl.querySelector('[data-mark="near"]').classList.toggle("is-active", near);
        stageEl.querySelector('[data-mark="far"]').classList.toggle("is-active", !near);
      },
      cue: function (elapsed) {
        return Math.floor(elapsed / 5) % 2 === 0
          ? "Focus on your thumb, ~25cm away."
          : "Now focus on something far across the room.";
      }
    },

    /* ---------------------------------------------------------------- */
    {
      id: "blink",
      emoji: "😌",
      name: "Deliberate Blinking",
      duration: 45,
      blurb: "Screen use cuts blink rate sharply, which is why eyes go dry and gritty. This restores the tear film on purpose.",
      steps: [
        "When the circle lights, close your eyes gently and hold for two seconds.",
        "Squeeze lightly at the end of the hold, then open.",
        "Don't force it — a hard clench defeats the point.",
        "Repeat through the set."
      ],
      stage: function () {
        return '<div class="wh-focus__stage"><div class="wh-eyecue" id="ex-stage">Open</div></div>';
      },
      frame: function (el, elapsed) {
        /* 5s cycle: 2s closed, 3s open. */
        var closed = (elapsed % 5) < 2;
        el.classList.toggle("is-cue", closed);
        var want = closed ? "Close" : "Open";
        if (el.textContent !== want) {
          el.textContent = want;
          Hub.beep(closed ? 520 : 700, 70, 0.08);
        }
      },
      cue: function () { return "Close gently for two, then open. Let the tear film spread."; }
    },

    /* ---------------------------------------------------------------- */
    {
      id: "rolls",
      emoji: "🔄",
      name: "Eye Rolls",
      duration: 60,
      blurb: "Takes each of the six muscles around the eye through its full range — clockwise, then counter-clockwise.",
      steps: [
        "Keep your head completely still.",
        "Follow the dot all the way around the circle with your eyes.",
        "Reach the edge of comfortable range, never past it.",
        "The direction reverses halfway through."
      ],
      stage: function () {
        return '<div class="wh-focus__stage"><div class="wh-orbit" id="ex-stage">' +
          '<div class="wh-orbit__ring"></div><div class="wh-orbit__dot" id="ex-orbit-dot"></div>' +
        "</div></div>";
      },
      frame: function (stageEl, elapsed, total) {
        var dot = stageEl.querySelector("#ex-orbit-dot");
        if (!dot) return;
        var PERIOD = 6;                                  // seconds per revolution
        var dir = elapsed < total / 2 ? 1 : -1;          // reverse at halfway
        var a = (elapsed / PERIOD) * Math.PI * 2 * dir - Math.PI / 2;
        var r = 82;
        dot.style.transform = "translate(" + (Math.cos(a) * r) + "px," + (Math.sin(a) * r) + "px)";
      },
      cue: function (elapsed, total) {
        return elapsed < total / 2
          ? "Clockwise — head still, eyes wide."
          : "Now counter-clockwise.";
      }
    }
  ];

  var BY_ID = {};
  EXERCISES.forEach(function (e) { BY_ID[e.id] = e; });

  /* ======================================================================
     EXERCISE DRIVER
     ====================================================================== */
  var active = null;   // { timer, ex }

  function runExercise(ex) {
    stopExercise(false);

    var inner = Hub.focus.open(
      '<div class="wh-focus__title">' + ex.emoji + " " + Hub.esc(ex.name) + "</div>" +
      '<div class="wh-clock" id="ex-clock">' + Hub.clock(ex.duration) + "</div>" +
      ex.stage() +
      '<div class="wh-focus__cue" id="ex-cue"></div>' +
      '<div class="wh-focus__actions">' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="ex-quit">' + Hub.icon("x") + "Stop</button>" +
      "</div>",
      function () { stopExercise(false); }   // Escape / overlay close
    );

    var clockEl = inner.querySelector("#ex-clock");
    var cueEl = inner.querySelector("#ex-cue");
    var stageEl = inner.querySelector("#ex-stage");
    inner.querySelector("#ex-quit").addEventListener("click", function () { Hub.focus.close(); });

    var lastWhole = -1;
    var timer = new Hub.Timer({
      duration: ex.duration,
      interval: 50,                       // smooth enough for the moving stages
      onTick: function (remaining, elapsed) {
        var whole = Math.ceil(remaining);
        if (whole !== lastWhole) {
          lastWhole = whole;
          clockEl.textContent = Hub.clock(whole);
          if (ex.cue) cueEl.textContent = ex.cue(elapsed, ex.duration);
          /* Count the last three seconds down audibly. */
          if (whole <= 3 && whole > 0) Hub.beep(880, 70, 0.09);
        }
        if (ex.frame && stageEl) ex.frame(stageEl, elapsed, ex.duration);
      },
      onDone: function () { finishExercise(ex); }
    });

    active = { timer: timer, ex: ex };
    timer.start();
  }

  function stopExercise(silent) {
    if (!active) return;
    active.timer.stop();
    active = null;
    if (!silent) { /* nothing to log — an abandoned session doesn't count */ }
  }

  function finishExercise(ex) {
    if (active) { active.timer.stop(); active = null; }
    Hub.cueDone();

    var d = Hub.editDay();
    d.eye++;
    /* Per-exercise tally, so each card can show "×2 today". */
    if (!d.eyeBreakdown) d.eyeBreakdown = {};
    d.eyeBreakdown[ex.id] = (d.eyeBreakdown[ex.id] || 0) + 1;
    Hub.commit();
    Hub.reminders.reset("eye");

    /* Swap the overlay to a short completion state rather than snapping the
       user straight back — a finished timer should feel finished. */
    var inner = Hub.focus.open(
      '<div class="wh-focus__title">✓ ' + Hub.esc(ex.name) + " complete</div>" +
      '<p class="wh-muted wh-mt4">That\'s ' + d.eye + " eye " + Hub.plural(d.eye, "session") + " today.</p>" +
      '<div class="wh-focus__actions">' +
        '<button type="button" class="wh-btn wh-btn--primary" id="ex-again" data-focus-primary>Do it again</button>' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="ex-done">Back to Eye Care</button>' +
      "</div>"
    );
    inner.querySelector("#ex-again").addEventListener("click", function () { runExercise(ex); });
    inner.querySelector("#ex-done").addEventListener("click", function () { Hub.focus.close(); });

    Hub.gamify.checkMilestone("eye");
  }

  /* ======================================================================
     20-20-20 BREAK TIMER
     ====================================================================== */
  function runBreak() {
    var DURATION = 20;
    var inner = Hub.focus.open(
      '<div class="wh-focus__title">👁️ Look 20 feet away</div>' +
      '<div class="wh-clock" id="brk-clock">' + Hub.clock(DURATION) + "</div>" +
      '<p class="wh-focus__cue">Find something roughly 6 metres (20 feet) off — out of a window is ideal — ' +
        "and let your eyes rest on it until the timer ends.</p>" +
      '<div class="wh-focus__actions">' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="brk-quit">Cancel</button>' +
      "</div>",
      function () { if (breakTimer) breakTimer.stop(); }
    );
    var clockEl = inner.querySelector("#brk-clock");
    inner.querySelector("#brk-quit").addEventListener("click", function () { Hub.focus.close(); });

    var breakTimer = new Hub.Timer({
      duration: DURATION,
      interval: 200,
      onTick: function (r) { clockEl.textContent = Hub.clock(Math.ceil(r)); },
      onDone: function () {
        Hub.cueDone();
        var d = Hub.editDay();
        d.eye2020++;
        Hub.commit();
        Hub.reminders.reset("eye");
        Hub.gamify.checkMilestone("eye");
        Hub.focus.close();
        Hub.toast("Eye break done — " + d.eye2020 + " today.", "success");
      }
    });
    breakTimer.start();
  }

  /* ======================================================================
     RENDER
     ====================================================================== */
  function render(el) {
    var d = Hub.day();
    var st = (Hub.state.streaks && Hub.state.streaks.eye) || { current: 0, best: 0, doneToday: false };
    var rem = Hub.state.settings.reminders.eye;
    var counts = sessionCounts();

    el.innerHTML =
      '<div class="wh-head">' +
        '<div class="wh-head__eyebrow">Eye care</div>' +
        "<h1>Rest, focus, blink</h1>" +
        "<p>Screens hold your eyes at one distance and cut your blink rate. These take a few minutes " +
        "a day and undo most of that.</p>" +
      "</div>" +

      /* ---------- status row ---------- */
      '<div class="wh-grid wh-grid--3 wh-mb4">' +
        '<div class="wh-stat"><div class="wh-stat__label">Streak</div>' +
          '<div class="wh-stat__value">' + st.current + "<small>days</small></div>" +
          '<div class="wh-stat__sub">best ' + st.best + " · " + (st.doneToday ? "done today" : "not yet today") + "</div></div>" +
        '<div class="wh-stat"><div class="wh-stat__label">Breaks today</div>' +
          '<div class="wh-stat__value">' + d.eye2020 + "</div>" +
          '<div class="wh-stat__sub">3 counts as a full day</div></div>' +
        '<div class="wh-stat"><div class="wh-stat__label">Exercises today</div>' +
          '<div class="wh-stat__value">' + d.eye + "</div>" +
          '<div class="wh-stat__sub">any one counts as a full day</div></div>' +
      "</div>" +

      /* ---------- 20-20-20 ---------- */
      '<div class="wh-card wh-card--accent">' +
        '<div class="wh-card__head">' +
          '<div class="wh-card__title">' + Hub.icon("clockIc") + "The 20-20-20 rule</div>" +
          '<span class="wh-chip wh-chip--accent">every ' + (rem.intervalMin || 20) + " min</span>" +
        "</div>" +
        '<p class="wh-sm wh-muted">Every <strong>20 minutes</strong>, look at something <strong>20 feet</strong> ' +
          "(about 6 metres) away for <strong>20 seconds</strong>. That's long enough for the ciliary muscle — the one " +
          "that bends your lens to focus close up — to fully release. It's the single highest-value habit for screen work.</p>" +
        '<div class="wh-row wh-mt4">' +
          '<button type="button" class="wh-btn wh-btn--primary" id="eye-break">' + Hub.icon("play") + "Take a 20s break now</button>" +
          '<label class="wh-switch">' +
            '<input type="checkbox" id="eye-remind"' + (rem.enabled ? " checked" : "") + " />" +
            '<span class="wh-switch__track"></span>' +
            '<span class="wh-switch__label">Remind me every ' + (rem.intervalMin || 20) + " minutes</span>" +
          "</label>" +
        "</div>" +
        '<p class="wh-help wh-mt4">' + Hub.icon("info") +
          " Reminders are generated by this page, so they only fire while the tab is open — " +
          "minimised is fine, closed is not. Change the interval in Settings.</p>" +
      "</div>" +

      /* ---------- exercises ---------- */
      '<h2 class="wh-h2 wh-mt6 wh-mb4">Guided exercises</h2>' +
      '<div class="wh-exgrid">' +
        EXERCISES.map(function (ex) {
          return '<div class="wh-ex">' +
            '<div class="wh-ex__head">' +
              '<div class="wh-ex__ic">' + ex.emoji + "</div>" +
              "<div><div class=\"wh-ex__name\">" + Hub.esc(ex.name) + "</div>" +
              '<div class="wh-ex__dur">' + Hub.clock(ex.duration) + "</div></div>" +
            "</div>" +
            '<p class="wh-ex__desc">' + Hub.esc(ex.blurb) + "</p>" +
            '<ol class="wh-ex__steps">' + ex.steps.map(function (s) { return "<li>" + Hub.esc(s) + "</li>"; }).join("") + "</ol>" +
            '<div class="wh-ex__foot">' +
              '<button type="button" class="wh-btn wh-btn--primary wh-btn--sm" data-ex="' + ex.id + '">' +
                Hub.icon("play") + "Start</button>" +
              (counts[ex.id] ? '<span class="wh-ex__count">×' + counts[ex.id] + " today</span>" : "") +
            "</div>" +
          "</div>";
        }).join("") +
      "</div>" +

      /* ---------- extra guidance ---------- */
      '<div class="wh-disclaimer wh-mt6">' + Hub.icon("alert") +
        "<span>These are general eye-comfort exercises, not treatment. Persistent pain, blurring, " +
        "flashes, floaters or vision changes are worth a proper eye examination.</span></div>";

    wire(el);
  }

  /* Per-exercise counts for today, so a card can show "×2 today". */
  function sessionCounts() { return Hub.day().eyeBreakdown || {}; }

  function wire(el) {
    el.querySelector("#eye-break").addEventListener("click", runBreak);

    el.querySelector("#eye-remind").addEventListener("change", function (e) {
      var on = e.target.checked;
      Hub.state.settings.reminders.eye.enabled = on;
      Hub.save();
      Hub.reminders.sync();
      if (on && Hub.notify.permission() === "default") Hub.notify.request();
      Hub.toast(on ? "Eye break reminders on." : "Eye break reminders off.", on ? "success" : "info", 2200);
      Hub.refresh();
    });

    Hub.delegate(el, "[data-ex]", function (btn) {
      var ex = BY_ID[btn.dataset.ex];
      if (ex) runExercise(ex);
    });
  }

  Hub.registerView("eyecare", render);
})();
