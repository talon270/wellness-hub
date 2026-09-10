/* ============================================================================
   WELLNESS HUB · BOOT
   ----------------------------------------------------------------------------
   Runs last of the hub scripts, before the calisthenics engine loads. Its job:

     1. load saved state, build the nav, restore the last view
     2. run the first gamification pass silently (so opening the app doesn't
        replay every badge you already own)
     3. start the reminder scheduler
     4. show the one-time first-run note explaining how reminders behave
     5. bridge the calisthenics app in once it has booted, so workouts feed the
        fitness streak and its badges
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  function boot() {
    Hub.load();
    Hub.buildNav();

    /* First pass is silent: existing badges are already earned, not new. */
    Hub.gamify.recompute({ silent: true });
    Hub.save();
    Hub.gamify.markBooted();

    Hub.reminders.sync();
    Hub.startTick();

    /* Offline shell + install prompt. A no-op on file://, which has no
       service worker — the app just runs as a plain page there. */
    if (Hub.pwa) Hub.pwa.register();

    /* Durable storage: ask the browser not to evict us, reconnect any linked
       backup file, and offer a rescue if this looks like cleared site data. */
    if (Hub.storage) Hub.storage.init();

    Hub.show(Hub.uiGet("view", "dashboard"));
    /* A manifest shortcut or notification may want a specific tab; this runs
       after the default route so it wins. */
    if (Hub.pwa) Hub.pwa.handleLaunchUrl();
    Hub.updateChrome();

    if (!Hub.state.meta.firstRunSeen) showFirstRun();

    watchForFitnessApp();
    wireGlobalKeys();
    wireGlobalNav();
  }

  /* ======================================================================
     GLOBAL NAV — the heart mark and the "At Desk" toggle
     ----------------------------------------------------------------------
     Both logo marks (mobile topbar, desktop sidebar) go to Dashboard: a
     brand mark that does nothing is a wasted click target on every screen
     of the app.

     "At Desk" surfaces js/views/desk.js's sitting clock (Hub.desk) from
     everywhere, not just the Desk tab it lives in — the point of a global
     control is starting the clock without a detour through nav first.
     ====================================================================== */
  function wireGlobalNav() {
    [document.getElementById("wh-logo-mobile"), document.getElementById("wh-logo-sidebar")]
      .forEach(function (btn) {
        if (btn) btn.addEventListener("click", function () { Hub.show("dashboard"); });
      });

    var atDeskBtns = [document.getElementById("wh-atdesk-mobile"), document.getElementById("wh-atdesk-sidebar")]
      .filter(Boolean);
    if (!atDeskBtns.length || !Hub.desk) return;

    function paintAtDesk() {
      var on = Hub.desk.isSitting();
      var mins = on ? Math.round(Hub.desk.sittingMinutes()) : 0;
      atDeskBtns.forEach(function (btn) {
        btn.classList.toggle("is-running", on);
        var t = btn.querySelector(".wh-atdesk-btn__t");
        if (t) t.textContent = on ? (mins + "m at desk") : "At Desk";
        btn.title = on
          ? "Sitting " + mins + "m — click to stop the clock"
          : "Start the sitting clock";
      });
    }

    atDeskBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (Hub.desk.isSitting()) {
          var mins = Hub.desk.stopSitting();
          Hub.toast("Clock stopped — " + mins + " min banked, no break counted.", "info", 3000);
        } else {
          Hub.desk.startSitting();
        }
        paintAtDesk();
      });
    });

    paintAtDesk();
    /* Piggybacks the same tick every reminder check already runs on — no
       second interval just to keep a minute counter honest. */
    Hub.onTick(paintAtDesk);
  }

  /* ======================================================================
     FIRST-RUN NOTE
     ----------------------------------------------------------------------
     Shown once. Deliberately does NOT trigger the browser's notification
     prompt — that only happens when the user actually turns a reminder on.
     ====================================================================== */
  function showFirstRun() {
    Hub.state.meta.firstRunSeen = true;
    Hub.save();

    var served = Hub.notify.availableHere();

    Hub.modal({
      title: "Welcome to your Wellness Hub",
      body:
        "<p>Nine areas — <strong>fitness, desk &amp; movement, mobility, eye care, dental, body care, " +
        "daily wellness, reproductive health and health records</strong> — with timers, trackers, streaks " +
        "and badges. Everything is stored in this browser; there's no account and nothing is sent " +
        "anywhere.</p>" +

        "<p><strong>About reminders:</strong> they're generated by this page, so they only fire while this " +
        "tab is open. Backgrounding the tab or minimising the window is fine — closing it isn't. " +
        "Nothing here can reach you once the browser is shut.</p>" +

        (served
          ? "<p>Turn reminders on from <strong>Settings</strong> or from any category tab. Your browser will " +
            "ask for notification permission at that point, not now.</p>" +
            "<p>Settings can also <strong>install this as a proper app</strong> — its own window and an icon " +
            "in your app menu, no browser tab to keep track of.</p>"
          : "<p>You've opened this from disk (<code class='mono'>file://</code>), so desktop notifications " +
            "aren't available — browsers reserve those for secure origins. <strong>In-app reminders still " +
            "work</strong> as toasts. To get desktop notifications, serve the folder: " +
            "<code class='mono'>python3 -m http.server</code>, then open " +
            "<code class='mono'>http://localhost:8000</code>.</p>") +

        "<p class='wh-help'>Back up from Settings now and then — clearing site data would otherwise take " +
        "your history with it.</p>",
      actions: [
        { label: "Explore first", variant: "ghost", onClick: function () {
          Hub.toast("Setup is on the dashboard whenever you want it.", "info", 4000);
        } },
        /* Straight into the profile wizard, which is what actually turns the
           reminders on — sending someone to a settings screen with forty
           switches and no context was never the right first move. */
        { label: "Set it up for me", variant: "primary", onClick: function () {
          if (Hub.onboarding) Hub.onboarding.start();
          else Hub.show("settings");
        } }
      ]
    });
  }

  /* ======================================================================
     FITNESS BRIDGE
     ----------------------------------------------------------------------
     The calisthenics app (window.App) boots from its own DOMContentLoaded
     handler, which may land after ours. Streaks read its session log directly,
     so all we need is to recompute once it exists — and again whenever the
     user leaves the Fitness tab, in case they logged a session while there.
     ====================================================================== */
  function watchForFitnessApp() {
    var tries = 0;
    var poll = setInterval(function () {
      if (window.App && window.App.STATE) {
        clearInterval(poll);
        /* Still part of boot: any fitness badge this reveals was already earned
           by past workouts, so award it quietly. Celebrating here would also
           try to play a sound before the page has seen a user gesture, which
           browsers refuse anyway. */
        syncFitness({ silent: true });
      } else if (++tries > 40) {          // ~10s; the engine isn't coming
        clearInterval(poll);
        console.warn("Wellness Hub: calisthenics engine didn't load — the Fitness tab will be empty.");
      }
    }, 250);

    /* Re-derive whenever the Fitness tab loses focus or the window regains it,
       so a workout logged in there shows up on the dashboard immediately. */
    var lastView = Hub.activeView();
    Hub.onTick(function () {
      var now = Hub.activeView();
      if (lastView === "fitness" && now !== "fitness") syncFitness();
      lastView = now;
    });
    window.addEventListener("focus", syncFitness);
  }

  var lastFitnessCount = -1;
  function syncFitness(opts) {
    if (!window.App || !window.App.STATE) return;
    var n = (window.App.STATE.sessions || []).length;
    if (n === lastFitnessCount) return;   // nothing new, skip the work
    lastFitnessCount = n;
    Hub.gamify.recompute(opts);
    Hub.save();
    Hub.updateChrome();
    if (Hub.activeView() !== "fitness") Hub.refresh();
  }

  /* Exposed so the calisthenics app can announce a completed session the
     moment it happens, rather than waiting for the tab change. */
  window.WellnessHub = {
    onWorkoutLogged: function () {
      lastFitnessCount = -1;
      syncFitness();
      Hub.gamify.checkMilestone("fitness");
    }
  };

  /* ======================================================================
     KEYBOARD
     ====================================================================== */
  function wireGlobalKeys() {
    document.addEventListener("keydown", function (e) {
      /* Alt+<n> jumps to the nth tab. Alt avoids clashing with browser
         shortcuts and with typing in any of the app's inputs.

         There are more tabs than digits, so 0 is the tenth, "-" the eleventh
         and "=" the twelfth — otherwise the last tabs would be documented as
         reachable and simply not be. The list is the VISIBLE one: counting
         positions a hidden tab occupies would make every shortcut after it
         land somewhere the user can't see. */
      if (!e.altKey || e.ctrlKey || e.metaKey) return;

      var nav = Hub.visibleNav();
      var idx = -1;
      if (e.key === "0") idx = 9;
      else if (e.key === "-") idx = 10;
      else if (e.key === "=") idx = 11;
      else {
        var n = Number(e.key);
        if (n >= 1 && n <= 9) idx = n - 1;
      }
      if (idx < 0 || idx >= nav.length) return;

      e.preventDefault();
      Hub.show(nav[idx].id);
    });
  }

  /* ---------------------------------------------------------------------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
