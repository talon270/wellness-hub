/* ============================================================================
   WELLNESS HUB · TIMERS
   ----------------------------------------------------------------------------
   One rack for every countdown the app runs, in one place, all controllable.
     · CATALOGUE  the app's real timed protocols — durations read from the
                  settings that own them, never re-typed as magic numbers
     · CLOCK      wall-clock end stamps in the unversioned UI store, so several
                  timers run at once and a reload doesn't lose them
     · CUES       finish beep + vibration + toast, fired wherever you are in
                  the app, not only while the dashboard is on screen
     · RENDER     the dashboard card: start, stop, restart, per row

   Why this is a separate implementation from Hub.Timer: every guided flow
   (brushing, eye exercises, mobility holds, breathing) drives the single
   `#wh-focus` overlay, so those are exclusive by construction — one at a
   time, full screen. A rack is the opposite shape: many at once, in the
   background. Sharing one class between the two would force the overlay's
   assumptions onto both.

   THE TWO RULES THAT KEEP THIS HONEST, both added 2026-09-19 after the rack
   was found disagreeing with the rest of the app (see PLAN-timer-sync.md):

     1. A row never invents a second clock for something the app already
        clocks. `deskreset` is not a countdown of its own — it IS the Desk
        tab's sitting session, shown and controlled from here. One chair, one
        answer, one nudge.
     2. Doing the habit restarts the row. `Hub.reminders.reset(key)` is the
        call every logging path in the app already makes, so it calls
        `onHabitDone` below rather than each of its eighteen callers having to
        remember this file exists.

   Each catalogue entry can carry a `log` function, run when that timer
   finishes, that records the habit the same way its Quick log tile or
   guided flow would (Hub.editDay + Hub.commit + Hub.reminders.reset). A
   background countdown that finishes silently is a countdown you can't
   trust — this is what makes it worth trusting.

   Public namespace: window.Hub.timers
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  /* Running timers live outside the versioned schema. They are transient
     clock state, not health history — losing them must never be a migration
     problem, and they must never end up in a backup export. */
  var STORE_KEY = "timers";

  /* ======================================================================
     CATALOGUE
     ----------------------------------------------------------------------
     Both rows are the same shape: a countdown TO the moment you should stop
     what you're doing, not the break's own length.

     `sec` is a FALLBACK only — `durationOf()` below prefers the setting the
     user actually controls, so changing the eye interval to 30 minutes in
     Settings changes this row to 30 minutes too. Before that it silently
     kept counting 20 while the Eye Care tab said 30.

     `remKey` ties the row to the interval reminder for the same habit, which
     is what `onHabitDone()` matches on.

     `view` is where the guided version lives — every row offers it, because a
     bare countdown is the weaker option whenever you can afford the real one.

     `log` runs once, when the timer reaches zero, and records the habit the
     way its Quick log tile does — see the CUES section below for where it's
     called. A row backed by `ext` has no `log`: whatever owns the real clock
     owns the alert too.

     Deliberately just these two rows. The other six (brushing, both breathing
     patterns, stretch hold, meditation, set rest) already have a natural home
     in their own guided flow or don't get reached for as a background
     countdown the way these two do — add them back here if that changes. */
  var CATALOGUE = [
    {
      id: "eye20", name: "Eye break", sec: 20 * 60, remKey: "eye",
      icon: "eye", color: "var(--blue-bright)", view: "eyecare",
      note: "on screen now — counting to your next 20-20-20 break",
      /* The OS alert's text. Android arms it ahead of time (js/native.js), so
         it can't come from log(), which only runs once the page is awake. */
      alert: "Look 20 feet away for 20 seconds.",
      log: function () {
        /* Deliberately does NOT increment d.eye2020 here — the timer
           finishing proves the interval elapsed, not that you looked
           away. The look-away is the actual break, and Hub.eye.runBreak logs
           on its own completion. Same "conditioning, not strength" rule
           the rest of the app follows: name the metric for what it measures. */
        Hub.reminders.reset("eye");
        Hub.notify.os("Eye break", this.alert);
        /* No announcing toast on the offer — the button IS the announcement.
           If the user declines nothing is counted; if they accept the 20-sec
           overlay opens and its own completion increments d.eye2020. */
        /* The face offers the look-away itself (tap to start), so the modal
           would only pop up behind it. */
        if (Hub.face && Hub.face.isOpen()) return;
        if (Hub.eye && Hub.eye.runBreak) {
          Hub.modal({
            title: "Time for a 20-second look-away",
            body: "<p>Twenty minutes of screen time up. Look at something ~6 metres " +
                  "(20 feet) away for twenty seconds — that's all it takes.</p>",
            actions: [
              { label: "Skip", variant: "ghost" },
              { label: "Look away now", variant: "primary", onClick: function () { Hub.eye.runBreak(); } }
            ]
          });
        }
      }
    },
    {
      id: "deskreset", name: "Desk reset", sec: 45 * 60, remKey: "stand",
      icon: "stand", color: "var(--wh-c-desk)", view: "desk",
      note: "the Desk tab's sitting clock — start it when you sit down",

      /* `ext` means this row keeps NO clock of its own: it reads and writes
         js/views/desk.js's sitting session through Hub.desk's public surface.

         It used to be a plain 45-minute countdown sitting beside that
         session, and the two never spoke. Starting the sitting clock left
         this row reading a flat 45:00; starting this row left the Desk tab
         and the global "At Desk" button both saying "stopped". Running both —
         the obvious thing to do, since each looked like it was doing nothing —
         earned you two separate "stand up" nudges, one from desk.js's tick
         handler and one from this file's sweep().

         So there is no clock here to keep in step. There is one sitting
         session, and this is a second window onto it. The row has no Pause,
         because a chair has no pause: you are in it or you aren't. */
      ext: {
        total: function () { return (Number(Hub.state.settings.sitAlertMin) || 45) * 60; },
        running: function () { return !!(Hub.desk && Hub.desk.isSitting()); },
        /* Time left before the sitting alert is due. Clamps at zero rather
           than going negative — desk.js re-alerts every `sitAlertMin` from
           there, and a bar that stays full while you sit on past the limit is
           the honest picture. */
        left: function () {
          if (!Hub.desk || !Hub.desk.isSitting()) return null;
          return Math.max(0, this.total() - Hub.desk.sittingMinutes() * 60);
        },
        start: function () { if (Hub.desk) Hub.desk.startSitting(); },
        /* Stops the clock and banks the stretch without claiming a stand
           break — the same contract as the global "At Desk" toggle, which
           also only knows you switched it off. */
        stop: function () { if (Hub.desk) Hub.desk.stopSitting(); }
      }
    }
  ];

  function byId(id) {
    for (var i = 0; i < CATALOGUE.length; i++) if (CATALOGUE[i].id === id) return CATALOGUE[i];
    return null;
  }

  /* The row's length, taken from the setting the user actually edits rather
     than from a constant typed in here that drifts the moment they change it.
     `t.sec` is the fallback for a row whose setting has gone missing. */
  function durationOf(t) {
    if (t.ext) return t.ext.total();
    var cfg = t.remKey && Hub.state.settings.reminders[t.remKey];
    var mins = cfg && Number(cfg.intervalMin);
    return (mins >= 1 ? mins * 60 : t.sec);
  }

  /* ======================================================================
     CLOCK STATE
     ----------------------------------------------------------------------
     Shape: { id: { endAt: epochMs, sec: duration, paused: secondsLeft } }
     A paused timer keeps its remaining seconds instead of an end stamp, so
     pausing is not "stop and lose it" and time doesn't leak while paused.

     `ext` rows never appear in this map — their state lives in whichever
     module owns the real clock.
     ====================================================================== */
  function load() {
    var raw = Hub.uiGet(STORE_KEY, {});
    return (raw && typeof raw === "object") ? raw : {};
  }
  function persist(map) { Hub.uiSet(STORE_KEY, map); }

  function remaining(rec) {
    if (!rec) return 0;
    if (rec.paused != null) return Math.max(0, rec.paused);
    return Math.max(0, (rec.endAt - Date.now()) / 1000);
  }

  function isRunning(rec) { return !!rec && rec.paused == null; }

  /* ---- per-row readers, so render and controls ask the same question ---- */

  /* Counting down right now. */
  function rowRunning(t, map) {
    return t.ext ? t.ext.running() : isRunning(map[t.id]);
  }
  /* Started at all — running or paused. An ext row has no paused state. */
  function rowLive(t, map) {
    return t.ext ? t.ext.running() : map[t.id] != null;
  }
  /* Seconds left, or the full duration when the row hasn't been started. */
  function rowLeft(t, map) {
    if (t.ext) { var l = t.ext.left(); return l == null ? durationOf(t) : l; }
    return map[t.id] ? remaining(map[t.id]) : durationOf(t);
  }

  /* Write a fresh end stamp for a store-backed row. */
  function seed(map, t, left) {
    map[t.id] = { endAt: Date.now() + left * 1000, sec: durationOf(t) };
  }

  /* An earlier version kept a clock record for the desk row. It is backed by
     the sitting session now and never reads the store, so a leftover record
     would sit there forever doing nothing — and `Clear all` disables itself
     when no row is live, so nothing would ever remove it. Drop it once. */
  (function pruneExtRecords() {
    var map = load(), found = false;
    CATALOGUE.forEach(function (t) { if (t.ext && map[t.id]) { delete map[t.id]; found = true; } });
    if (found) persist(map);
  })();

  /* ======================================================================
     CONTROLS
     ====================================================================== */

  /* Re-entrancy guard. A rack start calls Hub.reminders.reset() so the
     invisible reminder countdown lines up with the visible one — and reset()
     calls onHabitDone() straight back here. Without this, resuming a paused
     row would have its remaining time clobbered back to the full duration on
     the way round. */
  var syncing = false;

  function alignReminder(t) {
    if (!t.remKey || !Hub.reminders) return;
    syncing = true;
    try { Hub.reminders.reset(t.remKey); } finally { syncing = false; }
  }

  function start(id) {
    var t = byId(id);
    if (!t) return;
    if (t.ext) { t.ext.start(); paint(); Hub.beep(660, 80); return; }
    var map = load();
    var rec = map[id];
    /* Resuming a paused timer keeps its remaining time; starting a fresh one
       takes the catalogue duration. */
    var left = (rec && rec.paused != null) ? rec.paused : durationOf(t);
    alignReminder(t);
    seed(map, t, left);
    persist(map);
    Hub.beep(660, 80);
    paint();
  }

  function pause(id) {
    var t = byId(id);
    if (!t) return;
    /* A chair has no pause — stopping the sitting clock is the honest verb. */
    if (t.ext) { t.ext.stop(); paint(); return; }
    var map = load();
    var rec = map[id];
    if (!isRunning(rec)) return;
    map[id] = { sec: rec.sec, paused: remaining(rec) };
    persist(map);
    paint();
  }

  function restart(id) {
    var t = byId(id);
    if (!t) return;
    /* Got up and sat back down. Banks the stretch, claims no stand break —
       Hub.desk.stopSitting() is deliberately the no-credit version. */
    if (t.ext) { t.ext.stop(); t.ext.start(); Hub.beep(660, 80); paint(); return; }
    alignReminder(t);
    var map = load();
    seed(map, t, durationOf(t));
    persist(map);
    Hub.beep(660, 80);
    paint();
  }

  function clear(id) {
    var t = byId(id);
    if (!t) return;
    if (t.ext) { t.ext.stop(); paint(); return; }
    var map = load();
    delete map[id];
    persist(map);
    paint();
  }

  function stopAll() {
    CATALOGUE.forEach(function (t) { if (t.ext && t.ext.running()) t.ext.stop(); });
    persist({});
    paint();
  }

  /* Start every timer that isn't already counting. Deliberately not the
     default action anywhere — but it is the honest answer to "start all
     timers", and the row controls make it recoverable. */
  function startAll() {
    var map = load(), added = 0;
    CATALOGUE.forEach(function (t) {
      if (rowRunning(t, map)) return;
      if (t.ext) { t.ext.start(); added++; return; }
      var rec = map[t.id];
      var left = (rec && rec.paused != null) ? rec.paused : durationOf(t);
      /* `syncing` keeps onHabitDone out of the store while this runs, so the
         seeds accumulated across the loop survive to the single persist(). */
      alignReminder(t);
      seed(map, t, left);
      added++;
    });
    persist(map);
    paint();
    if (added) {
      Hub.beep(700, 90);
      Hub.toast(added + " " + Hub.plural(added, "timer") + " started — finishing one logs it automatically.", "info", 4000);
    }
  }

  /* ======================================================================
     THE HABIT HOOK
     ----------------------------------------------------------------------
     Called from Hub.reminders.reset(key) — the one call every logging path
     in the app already makes. Doing the habit anywhere restarts the visible
     countdown for it: take the 20-second look-away from the Eye Care tab and
     this row starts its twenty minutes again, instead of finishing on its old
     deadline and nagging you for a break you already took.

     Only a LIVE row is touched. A row you never started stays idle — the hook
     keeps clocks honest, it doesn't start them behind your back.

     `ext` rows are skipped: whoever owns the real clock owns this decision
     too. desk.js already ends the sitting session when you say you stood up.
     ====================================================================== */
  function onHabitDone(key) {
    if (syncing) return;
    var map = load(), changed = false;
    CATALOGUE.forEach(function (t) {
      if (t.ext || t.remKey !== key) return;
      var rec = map[t.id];
      if (!rec) return;                       // not live — leave it alone
      if (rec.paused != null) { rec.paused = durationOf(t); rec.sec = durationOf(t); }
      else seed(map, t, durationOf(t));
      changed = true;
    });
    if (!changed) return;
    persist(map);
    paint();
  }

  /* ======================================================================
     COMPLETION — runs on the global tick, from any view
     ----------------------------------------------------------------------
     A timer you started before switching tabs still has to tell you it
     finished. So the finish check is not view-gated; only the repaint is.

     `ext` rows are never in the map, so they never reach here — their alert
     belongs to the module that owns them, which is what stopped the desk row
     nudging you a second time.
     ====================================================================== */
  function sweep() {
    var map = load(), done = [], changed = false;
    Object.keys(map).forEach(function (id) {
      var rec = map[id];
      if (!isRunning(rec)) return;
      if (remaining(rec) > 0) return;
      var t = byId(id);
      delete map[id];
      changed = true;
      if (t) done.push(t);
    });
    if (!changed) return;
    persist(map);
    done.forEach(function (t) {
      Hub.vibrate([120, 80, 120]);
      /* A logging entry owns its own beep + toast, phrased the way its
         Quick log tile already speaks (see the CATALOGUE entries above) —
         calling cueDone() as well would layer a second, unrelated chime
         over it. A future entry with no `log` still gets one. */
      if (t.log) {
        try { t.log(); } catch (e) { Hub.cueDone(); Hub.toast(t.name + " timer done.", "success", 5000); }
      } else {
        Hub.cueDone();
        Hub.toast(t.name + " timer done.", "success", 5000);
      }
    });
  }

  /* ======================================================================
     RENDER
     ====================================================================== */
  function card() {
    return '<div class="wh-card" id="wh-timers">' +
      '<div class="wh-card__head">' +
        '<div class="wh-card__title">' + Hub.icon("clockIc") + "Timers</div>" +
        '<span class="wh-chip" id="wh-timers-chip"></span>' +
      "</div>" +
      '<div class="wh-timers" id="wh-timers-list"></div>' +
      '<div class="wh-row wh-mt4" style="gap:var(--wh-s2)">' +
        '<button type="button" class="wh-btn wh-btn--sm wh-btn--primary" data-tm-all>' +
          Hub.icon("play") + "Start all</button>" +
        '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" data-tm-none>' +
          Hub.icon("stop") + "Clear all</button>" +
      "</div>" +
      '<p class="wh-help wh-mt4">Each row is the same clock the tab it belongs to uses — start ' +
        "<strong>Desk reset</strong> here and the Desk tab and the At Desk button say so too. They keep " +
        "counting on another tab, survive a reload, and doing the habit anywhere restarts the row for it. " +
        "The guided version of each is the arrow on its row.</p>" +
    "</div>";
  }

  function row(t, map) {
    var running = rowRunning(t, map);
    var live = rowLive(t, map);
    var total = durationOf(t);
    var left = rowLeft(t, map);
    var pct = live ? Hub.pct(total - left, total) : 0;

    /* An ext row's "stop" is not a pause, so it doesn't get a pause icon or
       a second button that would do the identical thing. */
    var stopVerb = t.ext ? "Stop" : "Pause";

    return '<div class="wh-timer' + (running ? " is-running" : live ? " is-paused" : "") +
        (t.ext ? " wh-timer--ext" : "") + '" ' +
        'style="--wh-tm-c:' + t.color + '" data-tm-row="' + t.id + '">' +
      '<span class="wh-timer__ic">' + Hub.icon(t.icon) + "</span>" +
      '<span class="wh-timer__body">' +
        '<span class="wh-timer__name">' + Hub.esc(t.name) + "</span>" +
        '<span class="wh-timer__note">' + Hub.esc(t.note) + "</span>" +
        '<span class="wh-timer__bar"><span class="wh-timer__fill" style="width:' + pct + '%"></span></span>' +
      "</span>" +
      '<span class="wh-timer__clock mono" data-tm-clock="' + t.id + '">' + Hub.clock(left) + "</span>" +
      '<span class="wh-timer__acts">' +
        '<button type="button" class="wh-timer__btn" data-tm-toggle="' + t.id + '" ' +
          'aria-label="' + (running ? stopVerb : "Start") + " " + Hub.esc(t.name) + ' timer" ' +
          'title="' + (running ? stopVerb : live ? "Resume" : "Start") + '">' +
          Hub.icon(running ? (t.ext ? "stop" : "minus") : "play") + "</button>" +
        '<button type="button" class="wh-timer__btn" data-tm-restart="' + t.id + '" ' +
          'aria-label="Restart ' + Hub.esc(t.name) + ' timer" title="Restart">' +
          Hub.icon("refresh") + "</button>" +
        (t.ext ? "" :
          '<button type="button" class="wh-timer__btn" data-tm-clear="' + t.id + '" ' +
            'aria-label="Clear ' + Hub.esc(t.name) + ' timer" title="Clear"' +
            (live ? "" : " disabled") + ">" + Hub.icon("stop") + "</button>") +
        '<button type="button" class="wh-timer__btn wh-timer__btn--go" data-tm-go="' + t.view + '" ' +
          'aria-label="Open the guided ' + Hub.esc(t.name) + '" title="Guided version">' +
          Hub.icon("right") + "</button>" +
      "</span>" +
    "</div>";
  }

  /* Repaints the rows in place rather than replacing the card, so the click
     handlers delegated onto #wh-timers are bound exactly once for the life of
     the view instead of being torn down and rebuilt on every button press. */
  function paint() {
    var list = document.getElementById("wh-timers-list");
    if (!list) return;
    var map = load();
    list.innerHTML = CATALOGUE.map(function (t) { return row(t, map); }).join("");

    var counting = CATALOGUE.filter(function (t) { return rowRunning(t, map); }).length;
    var live = CATALOGUE.filter(function (t) { return rowLive(t, map); }).length;

    var chip = document.getElementById("wh-timers-chip");
    if (chip) {
      chip.textContent = counting ? counting + " running" : live ? live + " paused" : "all idle";
      chip.classList.toggle("wh-chip--warn", counting > 0);
    }
    var clearBtn = document.querySelector("[data-tm-none]");
    if (clearBtn) clearBtn.disabled = !live;
  }

  /* Per-second update of just the digits and bars. Repainting the whole card
     every second would fight focus and make the buttons unclickable. */
  function tickPaint() {
    var host = document.getElementById("wh-timers");
    if (!host) return;
    var map = load(), stale = false;
    CATALOGUE.forEach(function (t) {
      var out = host.querySelector('[data-tm-clock="' + t.id + '"]');
      if (!out) return;
      var left = rowLeft(t, map);
      out.textContent = Hub.clock(left);
      var rowEl = host.querySelector('[data-tm-row="' + t.id + '"]');
      if (rowEl) {
        var fill = rowEl.querySelector(".wh-timer__fill");
        var total = durationOf(t);
        if (fill) fill.style.width = (rowLive(t, map) ? Hub.pct(total - left, total) : 0) + "%";
        /* The row's class carries the running state; if it disagrees with the
           store a timer just finished, or was changed in another tab, or — for
           the desk row — the sitting clock was started from the Desk tab or
           the At Desk button. That last case is how this row stays in step
           without desk.js having to know the rack exists. */
        if (rowEl.classList.contains("is-running") !== rowRunning(t, map)) stale = true;
      }
    });
    if (stale) paint();
  }

  function wireCard(host) {
    if (!host) return;
    /* Tapping the row body (not its buttons) opens the full-screen face —
       PLAN-android.md Part C's Entry. `ext` rows are excluded: the desk row
       has no end time of its own to draw a face around, its face is the Desk
       tab it's a window onto. A row that isn't running opens the face idle,
       where a long press starts it (js/face.js). */
    Hub.delegate(host, ".wh-timer__body", function (el) {
      var row = el.closest("[data-tm-row]");
      var t = row && byId(row.dataset.tmRow);
      if (t && !t.ext && Hub.face) Hub.face.open(t.id);
    });
    Hub.delegate(host, "[data-tm-toggle]", function (btn) {
      var id = btn.dataset.tmToggle;
      var t = byId(id);
      if (t && rowRunning(t, load())) pause(id); else start(id);
    });
    Hub.delegate(host, "[data-tm-restart]", function (btn) { restart(btn.dataset.tmRestart); });
    Hub.delegate(host, "[data-tm-clear]", function (btn) { clear(btn.dataset.tmClear); });
    Hub.delegate(host, "[data-tm-go]", function (btn) { Hub.show(btn.dataset.tmGo); });
    Hub.delegate(host, "[data-tm-all]", function () { startAll(); });
    Hub.delegate(host, "[data-tm-none]", function () {
      stopAll();
      Hub.toast("All timers cleared.", "info", 2500);
    });
    /* card() ships the shell empty; this is the first fill. */
    paint();
  }

  /* The finish check runs every second from every view; the repaint only on
     the dashboard, which is the only place the card is visible. Switching to
     the dashboard re-renders it, so nothing is stale on arrival. */
  Hub.onTick(function () {
    sweep();
    if (Hub.activeView() === "dashboard") tickPaint();
  });

  Hub.timers = {
    CATALOGUE: CATALOGUE,
    card: card, wire: wireCard, paint: paint,
    start: start, pause: pause, restart: restart, clear: clear, durationOf: durationOf,
    startAll: startAll, stopAll: stopAll,
    onHabitDone: onHabitDone,
    /* Seconds left on whichever row is counting for this habit, or null.
       Hub.remDue() folds this together with the interval reminder's own
       countdown so a tab shows the soonest real nudge rather than only the
       half of it that tab happens to know about. */
    dueIn: function (key) {
      var map = load(), out = null;
      CATALOGUE.forEach(function (t) {
        if (t.remKey !== key || !rowRunning(t, map)) return;
        var left = rowLeft(t, map);
        if (out == null || left < out) out = left;
      });
      return out;
    },
    running: function () {
      var map = load();
      return CATALOGUE.filter(function (t) { return rowRunning(t, map); }).length;
    }
  };
})();
