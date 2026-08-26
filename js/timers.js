/* ============================================================================
   WELLNESS HUB · TIMERS
   ----------------------------------------------------------------------------
   One rack for every countdown the app runs, in one place, all controllable.
     · CATALOGUE  the app's real timed protocols — durations taken from the
                  modules that own them, not re-typed as magic numbers
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
     The two rows mean two different things, deliberately:
       - Eye break counts UP TO the moment you should stop looking at the
         screen: 20 minutes, mirroring the "eye" reminder's own default
         interval (REMINDER_META.eye in js/core.js). Press it when you sit
         down; it logs and cues you when the 20 minutes are up.
       - Desk reset counts THE BREAK ITSELF: 90s of actually standing and
         walking, same as the guided flow in js/views/desk.js.
     Don't average these into one "duration" concept — one is a countdown to
     an action, the other is the action's own length.

     `view` is where the guided version lives — every row offers it, because a
     bare countdown is the weaker option whenever you can afford the real one.

     `log` runs once, when the timer reaches zero, and records the habit the
     way its Quick log tile does — see the CUES section below for where it's
     called.

     Deliberately just these two rows. The other six (brushing, both breathing
     patterns, stretch hold, meditation, set rest) already have a natural home
     in their own guided flow or don't get reached for as a background
     countdown the way these two do — add them back here if that changes. */
  var CATALOGUE = [
    {
      id: "eye20", name: "Eye break", sec: 20 * 60,
      icon: "eye", color: "var(--blue-bright)", view: "eyecare",
      note: "on screen now — 20 min to your next 20-20-20 break",
      log: function () {
        var d = Hub.editDay();
        d.eye2020++;
        Hub.commit();
        Hub.reminders.reset("eye");
        if (Hub.gamify) Hub.gamify.checkMilestone("eye");
        Hub.beep(660, 90);
        Hub.toast("Eye break logged — " + d.eye2020 + " today. Look 20 feet away for 20 seconds.", "success", 5000);
      }
    },
    {
      id: "deskreset", name: "Desk reset", sec: 90,
      icon: "stand", color: "var(--wh-c-desk)", view: "desk",
      note: "stand, walk, look away",
      log: function () {
        /* Hub.desk.logStand already does the commit, the reminder reset, the
           milestone check, the beep and its own toast — one implementation
           of "a stand break happened," not a second one drifting beside it. */
        if (Hub.desk && Hub.desk.logStand) Hub.desk.logStand("Desk reset done — stand break logged.");
        else {
          var d = Hub.editDay();
          d.stand++;
          Hub.commit();
          Hub.reminders.reset("stand");
          Hub.beep(700, 90);
          Hub.toast("Stand break logged.", "success", 2200);
        }
      }
    }
  ];

  function byId(id) {
    for (var i = 0; i < CATALOGUE.length; i++) if (CATALOGUE[i].id === id) return CATALOGUE[i];
    return null;
  }

  /* ======================================================================
     CLOCK STATE
     ----------------------------------------------------------------------
     Shape: { id: { endAt: epochMs, sec: duration, paused: secondsLeft } }
     A paused timer keeps its remaining seconds instead of an end stamp, so
     pausing is not "stop and lose it" and time doesn't leak while paused.
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

  /* ======================================================================
     CONTROLS
     ====================================================================== */
  function start(id) {
    var t = byId(id);
    if (!t) return;
    var map = load();
    var rec = map[id];
    /* Resuming a paused timer keeps its remaining time; starting a fresh one
       takes the catalogue duration. */
    var left = (rec && rec.paused != null) ? rec.paused : t.sec;
    map[id] = { endAt: Date.now() + left * 1000, sec: t.sec };
    persist(map);
    Hub.beep(660, 80);
    paint();
  }

  function pause(id) {
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
    var map = load();
    map[id] = { endAt: Date.now() + t.sec * 1000, sec: t.sec };
    persist(map);
    Hub.beep(660, 80);
    paint();
  }

  function clear(id) {
    var map = load();
    delete map[id];
    persist(map);
    paint();
  }

  function stopAll() {
    persist({});
    paint();
  }

  /* Start every timer that isn't already counting. Deliberately not the
     default action anywhere — eight countdowns at once is almost never what
     someone means — but it is the honest answer to "start all timers", and
     the row controls make it recoverable. */
  function startAll() {
    var map = load(), now = Date.now(), added = 0;
    CATALOGUE.forEach(function (t) {
      if (isRunning(map[t.id])) return;
      var left = (map[t.id] && map[t.id].paused != null) ? map[t.id].paused : t.sec;
      map[t.id] = { endAt: now + left * 1000, sec: t.sec };
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
     COMPLETION — runs on the global tick, from any view
     ----------------------------------------------------------------------
     A timer you started before switching tabs still has to tell you it
     finished. So the finish check is not view-gated; only the repaint is.
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
      '<p class="wh-help wh-mt4">Finishing a timer logs it automatically, the same as its ' +
        "Quick log tile. Several run at once, they keep counting while you're on another " +
        "tab, and they survive a reload. The guided version of each is the arrow on its row.</p>" +
    "</div>";
  }

  function row(t, map) {
    var rec = map[t.id];
    var running = isRunning(rec);
    var left = rec ? remaining(rec) : t.sec;
    var pct = rec ? Hub.pct(t.sec - left, t.sec) : 0;

    return '<div class="wh-timer' + (running ? " is-running" : rec ? " is-paused" : "") + '" ' +
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
          'aria-label="' + (running ? "Pause" : "Start") + " " + Hub.esc(t.name) + ' timer" ' +
          'title="' + (running ? "Pause" : rec ? "Resume" : "Start") + '">' +
          Hub.icon(running ? "minus" : "play") + "</button>" +
        '<button type="button" class="wh-timer__btn" data-tm-restart="' + t.id + '" ' +
          'aria-label="Restart ' + Hub.esc(t.name) + ' timer" title="Restart">' +
          Hub.icon("refresh") + "</button>" +
        '<button type="button" class="wh-timer__btn" data-tm-clear="' + t.id + '" ' +
          'aria-label="Clear ' + Hub.esc(t.name) + ' timer" title="Clear"' +
          (rec ? "" : " disabled") + ">" + Hub.icon("stop") + "</button>" +
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

    var counting = CATALOGUE.filter(function (t) { return isRunning(map[t.id]); }).length;
    var live = CATALOGUE.filter(function (t) { return map[t.id] != null; }).length;

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
      var rec = map[t.id];
      var out = host.querySelector('[data-tm-clock="' + t.id + '"]');
      if (!out) return;
      var left = rec ? remaining(rec) : t.sec;
      out.textContent = Hub.clock(left);
      var rowEl = host.querySelector('[data-tm-row="' + t.id + '"]');
      if (rowEl) {
        var fill = rowEl.querySelector(".wh-timer__fill");
        if (fill) fill.style.width = (rec ? Hub.pct(t.sec - left, t.sec) : 0) + "%";
        /* The row's class carries the running state; if it disagrees with the
           store a timer just finished or was changed in another tab. */
        if (rowEl.classList.contains("is-running") !== isRunning(rec)) stale = true;
      }
    });
    if (stale) paint();
  }

  function wireCard(host) {
    if (!host) return;
    Hub.delegate(host, "[data-tm-toggle]", function (btn) {
      var id = btn.dataset.tmToggle;
      var rec = load()[id];
      if (isRunning(rec)) pause(id); else start(id);
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

  /* The finish check runs every second from every view; the repaint only
     where the card exists. */
  Hub.onTick(function () {
    sweep();
    tickPaint();
  });

  Hub.timers = {
    CATALOGUE: CATALOGUE,
    card: card, wire: wireCard, paint: paint,
    start: start, pause: pause, restart: restart, clear: clear,
    startAll: startAll, stopAll: stopAll,
    running: function () {
      var map = load();
      return CATALOGUE.filter(function (t) { return isRunning(map[t.id]); }).length;
    }
  };
})();
