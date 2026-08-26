/* ============================================================================
   WELLNESS HUB · DESK & MOVEMENT
   ----------------------------------------------------------------------------
   The tab for people whose job is a chair. Three sections behind pills:

     today    the sitting clock, stand-up breaks, the reminder switch
     snacks   60–120 second movement routines you can do beside the desk
     setup    the one-off ergonomics checklist, which you do once and forget

   THE SITTING CLOCK is the piece that makes the rest work. It's an explicit
   session — you tell it when you sat down — because a browser tab cannot know
   whether you're at the desk, and a timer that silently assumes you are would
   spend the evening telling an empty chair to stand up.

   Its alert runs from a global tick handler registered at load, NOT from the
   view, so "you've been sitting for 45 minutes" arrives while you're on any
   tab, which is the entire point of the feature.
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  var PILLS = [
    { id: "today",  label: "Today",     icon: "stand" },
    { id: "snacks", label: "Movement",  icon: "walk" },
    { id: "setup",  label: "Desk setup", icon: "chair" }
  ];

  function currentPill() {
    var p = Hub.uiGet("deskPill", "today");
    return PILLS.some(function (x) { return x.id === p; }) ? p : "today";
  }

  /* ======================================================================
     1. SITTING SESSIONS
     ----------------------------------------------------------------------
     One open session at a time, persisted so a reload doesn't lose it.
     Everything else here is derived from it.
     ====================================================================== */
  var sit = {
    open: function () {
      var s = Hub.state.logs.deskSession;
      return (s && s.startedAt) ? s : null;
    },

    /* Minutes in the session currently running, 0 if none. */
    minutes: function () {
      var s = sit.open();
      if (!s) return 0;
      var ms = Date.now() - Date.parse(s.startedAt);
      return ms > 0 ? ms / 60000 : 0;
    },

    start: function (silent) {
      Hub.state.logs.deskSession = { startedAt: new Date().toISOString(), alertedAt: 0 };
      Hub.save();
      if (!silent) Hub.toast("Sitting clock started.", "info", 2200);
    },

    /* End the session and bank it. `stood` marks it as ended by actually
       getting up, which is what counts as a break — closing the laptop and
       going home should not award one. */
    stop: function (stood) {
      var s = sit.open();
      if (!s) return 0;
      var mins = Math.round(sit.minutes());
      Hub.state.logs.deskSession = null;

      /* A session is banked against the day it started on, so a stretch that
         crosses the rollover hour doesn't land on tomorrow. */
      var d = Hub.editDay(Hub.ymd(new Date(Date.parse(s.startedAt))));
      d.sitMin += mins;
      if (mins > d.sitLongest) d.sitLongest = mins;
      if (stood) {
        d.stand++;
        Hub.reminders.reset("stand");
        Hub.gamify.checkMilestone("desk");
      }
      Hub.commit();
      return mins;
    }
  };

  /* A stand break with no sitting session running — the common case for
     someone who never started the clock but does want the count. */
  function logStand(note) {
    var d = Hub.editDay();
    d.stand++;
    Hub.commit();
    Hub.reminders.reset("stand");
    Hub.gamify.checkMilestone("desk");
    Hub.beep(700, 90);
    Hub.toast(note || "Stand break logged — " + d.stand + " today.", "success", 2200);
  }

  /* ======================================================================
     2. THE ALERT
     ----------------------------------------------------------------------
     Fires from the master tick, so it reaches you on any tab. Deliberately
     NOT suppressed by quiet hours: it can only fire because you told the app
     you were sitting down, and being sat at a desk at one in the morning is
     the case where the nudge is most warranted, not least.
     ====================================================================== */
  var lastAlertMin = 0;

  Hub.onTick(function () {
    var s = sit.open();
    if (!s) { lastAlertMin = 0; updateLiveClock(0); return; }

    var mins = sit.minutes();
    updateLiveClock(mins);

    var limit = Number(Hub.state.settings.sitAlertMin) || 45;
    /* Re-alert every `limit` minutes, so ignoring the first one doesn't buy
       silence for the rest of the afternoon. */
    var step = Math.floor(mins / limit);
    if (step >= 1 && step > lastAlertMin) {
      lastAlertMin = step;
      Hub.notify.fire(
        "You've been sitting " + Math.round(mins) + " minutes",
        "Stand up for two minutes. Walk, stretch, refill your water — anything but the chair.",
        "desk", "stand"
      );
    }
  });

  /* The live clock is written straight into the DOM rather than re-rendering
     the view every second — a full re-render would fight with anything the
     user is in the middle of typing. */
  function updateLiveClock(mins) {
    var el = document.getElementById("dk-sitclock");
    if (!el) return;
    var limit = Number(Hub.state.settings.sitAlertMin) || 45;
    el.textContent = Hub.clock(mins * 60);
    el.classList.toggle("is-over", mins >= limit);
    var sub = document.getElementById("dk-sitsub");
    if (sub) {
      sub.textContent = mins >= limit
        ? "Over your " + limit + "-minute limit — time to stand."
        : Math.max(0, Math.round(limit - mins)) + " min until your next break is due";
    }
  }

  /* ======================================================================
     3. MOVEMENT SNACKS
     ----------------------------------------------------------------------
     Short enough to actually do between meetings, and specifically chosen for
     what sitting does: hip flexors shorten, glutes switch off, the mid-back
     stiffens, and the wrists take a beating from the keyboard.
     ====================================================================== */
  var SNACKS = [
    {
      id: "stand-walk", emoji: "🚶", name: "Stand & walk", tag: "60s",
      blurb: "The one that matters most. Getting upright and moving does more for circulation and " +
             "blood sugar than any stretch you can do in the chair.",
      steps: [
        { name: "Stand up fully", sec: 10, cue: "All the way up. Shake the legs out." },
        { name: "Walk", sec: 40, cue: "Anywhere — the kitchen, the corridor, the window and back." },
        { name: "Reach overhead", sec: 10, cue: "Arms up, ribs long, one big breath in." }
      ]
    },
    {
      id: "hip-reset", emoji: "🦵", name: "Hip flexor reset", tag: "90s",
      blurb: "Sitting holds the hip flexors short for hours. This is the direct antidote, and it's the " +
             "single most useful 90 seconds for anyone with a desk job and a sore lower back.",
      steps: [
        { name: "Standing hip flexor stretch — left", sec: 30, cue: "Step the left foot back, tuck the tailbone under, squeeze the left glute." },
        { name: "Swap sides", sec: 30, cue: "Swap: right foot back. Squeeze the glute, don't arch the back." },
        { name: "Glute squeezes", sec: 30, cue: "Stand tall and squeeze both glutes hard for 3 seconds at a time." }
      ]
    },
    {
      id: "back-open", emoji: "🔓", name: "Mid-back opener", tag: "75s",
      blurb: "Undoes the forward-rounded shape a keyboard builds in: extension through the mid-back, " +
             "then the shoulder blades back where they belong.",
      steps: [
        { name: "Standing back extension", sec: 25, cue: "Hands on the lower back, lean gently back. Move at the mid-back." },
        { name: "Wall or doorway chest stretch", sec: 25, cue: "Forearm on the frame, turn away. Swap arms at halfway." },
        { name: "Shoulder blade squeezes", sec: 25, cue: "Pinch the blades back and down. Five seconds on, five off." }
      ]
    },
    {
      id: "wrist-reset", emoji: "🖐️", name: "Wrist & forearm reset", tag: "70s",
      blurb: "For hands that type all day — and for anyone training with their weight on their wrists, " +
             "where desk-stiff forearms are the thing that actually holds the progression back.",
      steps: [
        { name: "Wrist flexor stretch", sec: 25, cue: "Arm straight, fingers up, pull back gently. Swap arms at halfway." },
        { name: "Wrist extensor stretch", sec: 25, cue: "Fingers down now, gentle pull. Swap at halfway." },
        { name: "Fist-and-spread", sec: 20, cue: "Squeeze a fist, then spread the fingers wide. Keep it moving." }
      ]
    },
    {
      id: "leg-pump", emoji: "🩸", name: "Circulation pump", tag: "60s",
      blurb: "Calf contractions are what push blood back up out of the legs. Sitting still switches that " +
             "pump off; this switches it back on without leaving your desk.",
      steps: [
        { name: "Calf raises", sec: 30, cue: "Up onto the toes, slow down. Hold a desk edge for balance if you need to." },
        { name: "Marching on the spot", sec: 20, cue: "Knees up. Breathe." },
        { name: "Ankle circles", sec: 10, cue: "Five each way, each foot." }
      ]
    },
    {
      id: "full-two", emoji: "⚡", name: "The full two minutes", tag: "2m",
      blurb: "When the reminder catches you at a natural break. Everything the shorter ones do, in one go.",
      steps: [
        { name: "Stand and walk", sec: 30, cue: "Get out of the chair and go somewhere." },
        { name: "Hip flexor stretch", sec: 30, cue: "One side, then swap at the halfway chime." },
        { name: "Chest & mid-back opener", sec: 30, cue: "Open the front, squeeze the blades back." },
        { name: "Calf raises", sec: 20, cue: "Slow up, slower down." },
        { name: "Neck release", sec: 10, cue: "Ear toward shoulder, both sides. No pulling." }
      ]
    }
  ];

  function snackById(id) {
    return SNACKS.filter(function (s) { return s.id === id; })[0];
  }

  /* ---------------------------------------------------------------------
     PLAYER — same shape as the mobility routine player: step list, chime on
     every transition, "swap" cues get a mid-point chime.
     ------------------------------------------------------------------- */
  var player = null;

  function runSnack(snack) {
    stopPlayer();
    var idx = 0;
    var total = snack.steps.reduce(function (n, s) { return n + s.sec; }, 0);
    var elapsedBefore = 0;

    var inner = Hub.focus.open(
      '<div class="wh-focus__title">' + snack.emoji + " " + Hub.esc(snack.name) + "</div>" +
      '<div class="wh-mob-progress"><div class="wh-mob-progress__fill" id="dk-prog"></div></div>' +
      '<div class="wh-mob-step" id="dk-step">' + Hub.esc(snack.steps[0].name) + "</div>" +
      '<div class="wh-clock" id="dk-clock">' + Hub.clock(snack.steps[0].sec) + "</div>" +
      '<div class="wh-focus__cue" id="dk-cue">' + Hub.esc(snack.steps[0].cue) + "</div>" +
      '<div class="wh-mob-next mono" id="dk-next"></div>' +
      '<div class="wh-focus__actions">' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="dk-skip">Skip step</button>' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="dk-quit">' + Hub.icon("stop") + "Stop</button>" +
      "</div>",
      function () { stopPlayer(); }
    );

    var stepEl = inner.querySelector("#dk-step");
    var clockEl = inner.querySelector("#dk-clock");
    var cueEl = inner.querySelector("#dk-cue");
    var nextEl = inner.querySelector("#dk-next");
    var progEl = inner.querySelector("#dk-prog");
    inner.querySelector("#dk-quit").addEventListener("click", function () { Hub.focus.close(); });
    inner.querySelector("#dk-skip").addEventListener("click", function () { advance(); });

    var timer = null;
    player = { stop: function () { if (timer) timer.stop(); } };
    startStep();

    function startStep() {
      var step = snack.steps[idx];
      stepEl.textContent = step.name;
      cueEl.textContent = step.cue;
      nextEl.textContent = idx + 1 < snack.steps.length ? "Next · " + snack.steps[idx + 1].name : "Last one";

      var halfCued = false, last = -1;
      timer = new Hub.Timer({
        duration: step.sec,
        interval: 150,
        onTick: function (remaining, elapsed) {
          var w = Math.ceil(remaining);
          if (w !== last) {
            last = w;
            clockEl.textContent = Hub.clock(w);
            if (w <= 3 && w > 0) Hub.beep(880, 60, 0.07);
          }
          progEl.style.width = ((elapsedBefore + elapsed) / total * 100).toFixed(1) + "%";
          if (!halfCued && elapsed >= step.sec / 2 && /swap/i.test(step.cue)) {
            halfCued = true;
            Hub.cueChange();
          }
        },
        onDone: advance
      });
      player.stop = function () { timer.stop(); };
      timer.start();
    }

    function advance() {
      if (timer) timer.stop();
      elapsedBefore += snack.steps[idx].sec;
      idx++;
      if (idx >= snack.steps.length) { finish(snack, total); return; }
      Hub.cueChange();
      startStep();
    }
  }

  function stopPlayer() { if (player) { player.stop(); player = null; } }

  function finish(snack, totalSec) {
    stopPlayer();
    Hub.cueDone();

    /* A movement snack IS a stand break — you were on your feet for it. If a
       sitting session is running, this ends it too, since you just got up.
       The break itself is always credited through logStandQuiet so that it
       lands on the same day record the rest of this function reads. */
    if (sit.open()) sit.stop(false);
    logStandQuiet();

    var d = Hub.editDay();
    d.moveMin += Math.round(totalSec / 60 * 10) / 10;
    d.stretch++;              // it counts toward the mobility streak as well
    Hub.commit();

    var goal = Number(Hub.state.settings.standGoal) || 8;
    var inner = Hub.focus.open(
      '<div class="wh-focus__title">✓ ' + Hub.esc(snack.name) + " done</div>" +
      '<p class="wh-muted wh-mt4">' + d.stand + " of " + goal + " stand breaks today. " +
        (d.stand >= goal ? "That's the day's target met." : "The next one is due in " +
          (Number(Hub.state.settings.reminders.stand.intervalMin) || 45) + " minutes.") + "</p>" +
      '<div class="wh-focus__actions">' +
        '<button type="button" class="wh-btn wh-btn--primary" id="dk-sit" data-focus-primary>Back to sitting</button>' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="dk-done">Close</button>' +
      "</div>"
    );
    inner.querySelector("#dk-sit").addEventListener("click", function () {
      sit.start(true);
      Hub.focus.close();
      Hub.refresh();
    });
    inner.querySelector("#dk-done").addEventListener("click", function () { Hub.focus.close(); });
  }

  /* The bookkeeping half of logStand, without the toast — the completion
     screen is already saying it. */
  function logStandQuiet() {
    var d = Hub.editDay();
    d.stand++;
    Hub.reminders.reset("stand");
    Hub.gamify.checkMilestone("desk");
  }

  /* ======================================================================
     4. DESK SETUP — the one-off checklist
     ====================================================================== */
  var ERGO = [
    { key: "screenHeight", label: "Top of the screen at eye level",
      sub: "So your neck is neutral rather than tipped forward. Books under the monitor are a valid solution." },
    { key: "armDistance", label: "Screen about an arm's length away",
      sub: "Closer than that and your eyes hold a strong focus all day, which is what eye strain actually is." },
    { key: "elbows", label: "Elbows at roughly 90°, shoulders down",
      sub: "Raise the chair until they are, then fix the feet with a footrest if they no longer reach." },
    { key: "feet", label: "Feet flat on the floor or a footrest",
      sub: "Dangling feet put the whole load through the back of the thighs." },
    { key: "back", label: "Hips right back in the chair, lumbar supported",
      sub: "A rolled towel does the same job as a lumbar cushion." },
    { key: "wrists", label: "Wrists straight, not bent up at the keyboard",
      sub: "A flat or negative-tilt keyboard beats one propped up on its legs." },
    { key: "mouse", label: "Mouse next to the keyboard, not out at arm's reach",
      sub: "Reaching for it all day is what makes one shoulder ache and not the other." },
    { key: "light", label: "No window or lamp directly behind the screen",
      sub: "Fighting a bright background is a guaranteed headache. Side-on light is best." },
    { key: "phone", label: "Headset or speaker for calls",
      sub: "Cradling a phone against your shoulder is the fastest route to a stiff neck." }
  ];

  /* ======================================================================
     5. SECTIONS
     ====================================================================== */
  var today = {
    render: function () {
      var d = Hub.day();
      var s = Hub.state.settings;
      var goal = Number(s.standGoal) || 8;
      var rem = s.reminders.stand;
      var st = (Hub.state.streaks && Hub.state.streaks.desk) || { current: 0, best: 0 };
      var running = sit.open();
      var mins = sit.minutes();
      var limit = Number(s.sitAlertMin) || 45;
      var backfill = Hub.isBackfilling();

      return '<div class="wh-grid wh-grid--2 wh-mb4">' +

          /* ---------- the sitting clock ---------- */
          '<div class="wh-card wh-card--accent">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("chair") + "Sitting clock</div>" +
              '<span class="wh-chip' + (running ? " wh-chip--accent" : "") + '">' +
                (running ? "running" : "stopped") + "</span></div>" +

            (running
              ? '<div class="wh-clock' + (mins >= limit ? " is-over" : "") + '" id="dk-sitclock">' +
                  Hub.clock(mins * 60) + "</div>" +
                '<p class="wh-sm wh-muted" id="dk-sitsub">' +
                  (mins >= limit
                    ? "Over your " + limit + "-minute limit — time to stand."
                    : Math.max(0, Math.round(limit - mins)) + " min until your next break is due") + "</p>" +
                '<div class="wh-row wh-mt4">' +
                  '<button type="button" class="wh-btn wh-btn--primary" id="dk-stood">' +
                    Hub.icon("stand") + "I stood up</button>" +
                  '<button type="button" class="wh-btn wh-btn--ghost wh-btn--sm" id="dk-sitstop">' +
                    Hub.icon("stop") + "Away from the desk</button>" +
                "</div>"
              : '<p class="wh-sm wh-muted">Start the clock when you sit down. It counts how long this ' +
                  "stretch has run and nudges you at <strong>" + limit + " minutes</strong> — on whichever " +
                  "tab you happen to be on.</p>" +
                '<div class="wh-row wh-mt4">' +
                  '<button type="button" class="wh-btn wh-btn--primary" id="dk-sitstart">' +
                    Hub.icon("play") + "I've just sat down</button>" +
                  '<button type="button" class="wh-btn wh-btn--ghost wh-btn--sm" id="dk-standonly">' +
                    Hub.icon("check") + "Log a stand break</button>" +
                "</div>") +

            '<p class="wh-help wh-mt4">Nothing here can see your chair, so the clock only knows what you ' +
              "tell it. Getting that wrong costs you a number in a log — it doesn't break anything.</p>" +
          "</div>" +

          /* ---------- today's breaks ---------- */
          '<div class="wh-card">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("stand") + "Stand breaks" +
              (backfill ? " · " + Hub.prettyDate(Hub.viewDate()) : "") + "</div>" +
              '<span class="wh-chip' + (d.stand >= goal ? " wh-chip--good" : "") + '">' +
                d.stand + " / " + goal + "</span></div>" +
            '<div class="wh-row" style="gap:var(--wh-s6);align-items:center">' +
              Hub.ring(Hub.pct(d.stand, goal), {
                size: 118, stroke: 10,
                color: d.stand >= goal ? "var(--green-bright)" : "var(--wh-c-desk)",
                aria: d.stand + " of " + goal + " stand breaks",
                center: '<div class="wh-ringwrap__val">' + d.stand + "</div>" +
                        '<div class="wh-ringwrap__lbl">breaks</div>'
              }) +
              '<div class="wh-grow">' +
                '<div class="wh-sm">Streak <strong class="mono">' + st.current + "d</strong>" +
                  '<span class="wh-faint"> · best ' + st.best + "d</span></div>" +
                '<div class="wh-xs wh-faint wh-mt4">Sat ' + Math.round(d.sitMin) + " min logged today" +
                  (d.sitLongest ? " · longest stretch " + Math.round(d.sitLongest) + " min" : "") + "</div>" +
                '<button type="button" class="wh-btn wh-btn--ghost wh-btn--sm wh-mt4" id="dk-addbreak">' +
                  Hub.icon("plus") + "Log a break</button>" +
              "</div>" +
            "</div>" +
            '<div class="wh-mt6"><div class="wh-xs wh-faint wh-mb4">Goal met, last 7 days</div>' +
              weekStrip() + "</div>" +
          "</div>" +
        "</div>" +

        /* ---------- reminder ---------- */
        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("bell") + "Stand-up reminders</div>" +
            '<span class="wh-chip' + (rem.enabled ? " wh-chip--good" : "") + '">' +
              (rem.enabled ? "every " + rem.intervalMin + " min" : "off") + "</span></div>" +
          '<label class="wh-switch">' +
            '<input type="checkbox" id="dk-remind"' + (rem.enabled ? " checked" : "") + " />" +
            '<span class="wh-switch__track"></span>' +
            '<span class="wh-switch__label">Tell me to stand every ' + rem.intervalMin + " minutes</span></label>" +
          '<div class="wh-row wh-mt4" style="align-items:center;gap:var(--wh-s3)">' +
            '<span class="wh-sm wh-muted">Interval</span>' +
            '<input class="wh-input" type="number" id="dk-interval" min="10" max="180" step="5" ' +
              'value="' + (rem.intervalMin || 45) + '" aria-label="Stand reminder interval in minutes" />' +
            '<span class="wh-help">min · weekdays by default, change the days in Settings</span>' +
          "</div>" +
          '<p class="wh-help wh-mt4">Two separate things, deliberately: this fires on a fixed interval ' +
            "whether or not the sitting clock is running, and the sitting clock nudges you based on how " +
            "long you've actually been down. Use either, or both.</p>" +
        "</div>" +

        /* ---------- why ---------- */
        '<div class="wh-card">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("info") + "Why breaks, not posture</div></div>" +
          '<p class="wh-sm wh-muted">There is no posture you can hold for eight hours that your body ' +
            "enjoys. What consistently shows up in the research is <strong>how long you stay in one " +
            "position</strong>, not which one you picked — long unbroken sitting tracks with worse " +
            "circulation, blood-sugar handling and back pain fairly independently of how much you " +
            "train in the evening.</p>" +
          '<p class="wh-sm wh-muted wh-mt4">So the target here is <strong>frequency</strong>. A minute on ' +
            "your feet every half hour beats a perfect chair, and beats one long walk at lunchtime.</p>" +
        "</div>";
    },

    wire: function (el) {
      var startBtn = el.querySelector("#dk-sitstart");
      if (startBtn) startBtn.addEventListener("click", function () {
        sit.start();
        Hub.refresh();
      });

      var standOnly = el.querySelector("#dk-standonly");
      if (standOnly) standOnly.addEventListener("click", function () { logStand(); });

      var stood = el.querySelector("#dk-stood");
      if (stood) stood.addEventListener("click", function () {
        var mins = sit.stop(true);
        Hub.beep(700, 90);
        Hub.toast("Good. That stretch was " + mins + " min.", "success", 2600);
        offerSnack();
      });

      var stop = el.querySelector("#dk-sitstop");
      if (stop) stop.addEventListener("click", function () {
        var mins = sit.stop(false);
        Hub.toast("Clock stopped — " + mins + " min banked, no break counted.", "info", 3000);
      });

      var add = el.querySelector("#dk-addbreak");
      if (add) add.addEventListener("click", function () { logStand(); });

      el.querySelector("#dk-remind").addEventListener("change", function (e) {
        var on = e.target.checked;
        Hub.state.settings.reminders.stand.enabled = on;
        Hub.save();
        Hub.reminders.sync();
        if (on && Hub.notify.permission() === "default") Hub.notify.request();
        Hub.toast(on ? "Stand reminders on." : "Stand reminders off.", on ? "success" : "info", 2200);
        Hub.refresh();
      });

      el.querySelector("#dk-interval").addEventListener("change", function (e) {
        var n = Hub.clamp(Math.round(Number(e.target.value) || 45), 10, 180);
        Hub.state.settings.reminders.stand.intervalMin = n;
        Hub.save();
        Hub.reminders.sync();
        Hub.refresh();
      });
    }
  };

  /* After a break is logged, offer to actually use it — one tap, no hunting
     through the Movement pill for something that takes 60 seconds. */
  function offerSnack() {
    var snack = SNACKS[Math.floor(Math.random() * 3)];   // one of the three shortest
    Hub.modal({
      title: "Use the two minutes?",
      body: "<p>You're up. <strong>" + Hub.esc(snack.name) + "</strong> takes " +
        Hub.clock(snack.steps.reduce(function (n, s) { return n + s.sec; }, 0)) +
        " and is designed for exactly this moment.</p>" +
        '<p class="wh-sm wh-muted">' + Hub.esc(snack.blurb) + "</p>",
      actions: [
        { label: "Not now", variant: "ghost" },
        { label: "Start it", variant: "primary", onClick: function () { runSnack(snack); } }
      ]
    });
  }

  var snacks = {
    render: function () {
      var d = Hub.day();
      return '<div class="wh-card wh-card--accent wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("walk") + "Movement snacks</div>" +
            '<span class="wh-chip">' + (Math.round(d.moveMin * 10) / 10) + " min today</span></div>" +
          '<p class="wh-sm wh-muted">Sixty to a hundred and twenty seconds each, none of them requiring ' +
            "floor space, a mat, or getting changed. Finishing one counts as a stand break and ends the " +
            "sitting clock, because you were on your feet for it.</p>" +
        "</div>" +

        '<div class="wh-exgrid">' + SNACKS.map(function (s) {
          var total = s.steps.reduce(function (n, x) { return n + x.sec; }, 0);
          return '<div class="wh-ex">' +
            '<div class="wh-ex__head"><div class="wh-ex__ic">' + s.emoji + "</div>" +
              '<div><div class="wh-ex__name">' + Hub.esc(s.name) + "</div>" +
              '<div class="wh-ex__dur">' + Hub.clock(total) + " · " + s.steps.length + " steps</div></div></div>" +
            '<span class="wh-chip wh-chip--accent" style="align-self:flex-start">' + Hub.esc(s.tag) + "</span>" +
            '<p class="wh-ex__desc">' + Hub.esc(s.blurb) + "</p>" +
            '<details class="wh-mob-details"><summary>See the ' + s.steps.length + " steps</summary>" +
              '<ol class="wh-ex__steps">' + s.steps.map(function (x) {
                return "<li>" + Hub.esc(x.name) + ' <span class="wh-faint mono">' + x.sec + "s</span></li>";
              }).join("") + "</ol></details>" +
            '<div class="wh-ex__foot">' +
              '<button type="button" class="wh-btn wh-btn--primary wh-btn--sm" data-snack="' + s.id + '">' +
                Hub.icon("play") + "Start</button>" +
            "</div>" +
          "</div>";
        }).join("") + "</div>";
    },

    wire: function (el) {
      Hub.delegate(el, "[data-snack]", function (btn) {
        var s = snackById(btn.dataset.snack);
        if (s) runSnack(s);
      });
    }
  };

  var setup = {
    render: function () {
      var done = Hub.state.settings.ergoChecklist || {};
      var n = ERGO.filter(function (e) { return done[e.key]; }).length;

      return '<div class="wh-card wh-card--accent wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("chair") + "Desk setup</div>" +
            '<span class="wh-chip' + (n === ERGO.length ? " wh-chip--good" : "") + '">' +
              n + " / " + ERGO.length + "</span></div>" +
          '<p class="wh-sm wh-muted">A one-off list, not a daily habit — you fix each of these once and ' +
            "it keeps paying out every day afterwards. Work down it with your actual chair and screen in " +
            "front of you.</p>" +
          '<div class="wh-mt4">' +
            Hub.ring(Hub.pct(n, ERGO.length), {
              size: 84, stroke: 8,
              color: n === ERGO.length ? "var(--green-bright)" : "var(--wh-c-desk)",
              aria: n + " of " + ERGO.length + " adjustments done",
              center: '<div class="wh-ringwrap__val">' + n + "</div>"
            }) +
          "</div>" +
        "</div>" +

        '<div class="wh-card wh-mb4">' +
          '<div class="wh-stack wh-stack--sm">' + ERGO.map(function (e) {
            var on = !!done[e.key];
            return '<button type="button" class="wh-check' + (on ? " is-done" : "") + '" data-ergo="' + e.key + '" ' +
                'aria-pressed="' + on + '">' +
              '<span class="wh-check__box">' + Hub.icon("check") + "</span>" +
              '<span class="wh-check__text">' + Hub.esc(e.label) +
                '<span class="wh-check__sub">' + Hub.esc(e.sub) + "</span></span></button>";
          }).join("") + "</div>" +
        "</div>" +

        '<div class="wh-card">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("lightbulb") + "If you have a sit-stand desk</div></div>" +
          '<p class="wh-sm wh-muted">Standing all day is its own problem, not the solution to sitting all ' +
            "day — it trades back ache for foot, knee and vein complaints. Alternate: roughly 30 minutes " +
            "standing per hour is the usual starting recommendation, and switching whenever you get " +
            "uncomfortable is a better rule than any timer.</p>" +
          '<p class="wh-sm wh-muted wh-mt4">Standing still also isn\'t movement. The stand breaks on the ' +
            "Today pill still apply — the point is changing position and using the leg muscles, not " +
            "which height the desk is at.</p>" +
        "</div>";
    },

    wire: function (el) {
      Hub.delegate(el, "[data-ergo]", function (btn) {
        var map = Hub.state.settings.ergoChecklist;
        var k = btn.dataset.ergo;
        if (map[k]) delete map[k]; else map[k] = true;
        Hub.commit();
        if (map[k]) Hub.beep(700, 80);
      });
    }
  };

  /* ======================================================================
     6. SHARED
     ====================================================================== */
  function weekStrip() {
    var goal = Number(Hub.state.settings.standGoal) || 8;
    var out = "";
    for (var i = 6; i >= 0; i--) {
      var key = Hub.shiftDay(Hub.today(), -i);
      var hit = Hub.day(key).stand >= goal;
      out += '<div title="' + Hub.prettyDate(key) + (hit ? " — goal met" : "") + '" ' +
        'style="flex:1;height:26px;border-radius:5px;border:1px solid ' +
        (hit ? "var(--green-bright)" : "var(--bg2)") + ";background:" +
        (hit ? "rgba(184,187,38,.22)" : "var(--bg0-soft)") + '"></div>';
    }
    return '<div class="wh-row" style="gap:6px">' + out + "</div>";
  }

  /* ======================================================================
     7. VIEW
     ====================================================================== */
  var SECTIONS = { today: today, snacks: snacks, setup: setup };

  function render(el) {
    var pill = currentPill();

    el.innerHTML =
      '<div class="wh-head">' +
        '<div class="wh-head__eyebrow">Desk &amp; movement</div>' +
        "<h1>Get out of the chair</h1>" +
        "<p>A sitting clock that nudges you before the stretch gets long, stand-up reminders, " +
        "two-minute movement routines you can do beside the desk, and the ergonomics list you " +
        "only have to work through once.</p>" +
      "</div>" +

      Hub.dateNav() +

      '<div class="wh-pills" role="tablist">' +
        PILLS.map(function (p) {
          return '<button type="button" role="tab" class="wh-pill' + (p.id === pill ? " is-active" : "") + '" ' +
            'data-pill="' + p.id + '" aria-selected="' + (p.id === pill) + '">' +
            Hub.icon(p.icon) + "<span>" + p.label + "</span></button>";
        }).join("") +
      "</div>" +
      '<div id="wh-desk-body">' + SECTIONS[pill].render() + "</div>";

    Hub.wireDateNav(el);
    Hub.delegate(el, "[data-pill]", function (btn) {
      Hub.uiSet("deskPill", btn.dataset.pill);
      Hub.refresh();
    });

    SECTIONS[pill].wire(el.querySelector("#wh-desk-body"));
  }

  /* Public hooks: the dashboard tile and the ?action=stand deep link both land
     here, so there is one implementation of "I stood up". */
  Hub.desk = {
    logStand: logStand,
    startSitting: function () { sit.start(); },
    sittingMinutes: function () { return sit.minutes(); },
    isSitting: function () { return !!sit.open(); },
    quickBreak: function () {
      /* Pill first: show() renders immediately, so setting it afterwards
         would land you on the previous section behind the overlay. */
      Hub.uiSet("deskPill", "snacks");
      Hub.show("desk");
      runSnack(SNACKS[0]);
    }
  };

  Hub.registerAction("stand", function () { Hub.desk.quickBreak(); });
  Hub.registerView("desk", render);
})();
