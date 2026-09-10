/* ============================================================================
   WELLNESS HUB · PWA LAYER
   ----------------------------------------------------------------------------
   Turns the page into something you launch from your app menu instead of
   opening a file:

     · registers the service worker (offline shell)
     · captures the install prompt so Settings can offer an Install button
     · offers a reload when a new version is waiting
     · handles ?go=<view> deep links from manifest shortcuts and notifications

   All of it is optional. On file:// there is no service worker and no install
   prompt, and the app carries on working exactly as before — this module just
   reports that state so Settings can explain it.

   Public: Hub.pwa
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  var deferredPrompt = null;   // the captured beforeinstallprompt event
  var registration = null;
  var waitingWorker = null;

  /* Service workers, like notifications, need a secure origin — and Chrome does
     not count file:// as one for this purpose. */
  function supported() {
    return "serviceWorker" in navigator && location.protocol !== "file:";
  }

  /* Already running as an installed app? */
  function isInstalled() {
    return window.matchMedia("(display-mode: standalone)").matches ||
           window.matchMedia("(display-mode: window-controls-overlay)").matches ||
           window.navigator.standalone === true;
  }

  /* ======================================================================
     REGISTRATION
     ====================================================================== */
  function register() {
    if (!supported()) return;

    navigator.serviceWorker.register("service-worker.js", { scope: "./" })
      .then(function (reg) {
        registration = reg;

        /* A worker sitting in `waiting` means a new version is ready but an old
           one is still controlling this page. */
        if (reg.waiting && navigator.serviceWorker.controller) {
          waitingWorker = reg.waiting;
          offerUpdate();
        }

        reg.addEventListener("updatefound", function () {
          var installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", function () {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              waitingWorker = installing;
              offerUpdate();
            }
          });
        });
      })
      .catch(function (err) {
        console.warn("Wellness Hub: service worker registration failed.", err);
      });

    /* A new worker took over — reload once so the page matches its assets.
       But NOT on the very first visit: the worker calls clients.claim(), which
       fires controllerchange on a page that was loaded without a controller.
       Reloading there would make every first load flash and restart for no
       reason, so only react when we're replacing an existing controller. */
    var hadController = !!navigator.serviceWorker.controller;
    var reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (!hadController || reloading) { hadController = true; return; }
      reloading = true;
      location.reload();
    });

    /* Notification clicks and their action buttons are handled by the worker,
       which relays them here — the page owns the scheduler and the logs. */
    navigator.serviceWorker.addEventListener("message", function (e) {
      var d = e.data || {};
      if (d.type === "NAVIGATE" && d.view) Hub.show(d.view);
      else if (d.type === "SNOOZE" && d.key) Hub.reminders.snooze(d.key);
      else if (d.type === "DID" && d.key) markDone(d.key, d.view);
    });
  }

  /* "Done" on a notification logs the thing, so the most common reminders are
     one tap from the notification shade instead of a trip into the app.
     Only reminders with an unambiguous single action are handled; anything
     that needs a choice (which meds? how much water?) opens the view instead. */
  var DONE_ACTIONS = {
    eye:       function (d) { d.eye2020++; return "Eye break logged."; },
    hydration: function (d) { d.water++; return "Water logged."; },
    posture:   function (d) { d.posture++; return "Posture check logged."; },
    spf:       function (d) { d.body.spf = true; d.spfReapply++; return "Sunscreen logged."; },
    brushAM:   function (d) { d.brushAM = true; return "Morning brush logged."; },
    brushPM:   function (d) { d.brushPM = true; return "Evening brush logged."; },
    floss:     function (d) { d.floss = true; return "Flossing logged."; },
    skinAM:    function (d) { d.body.skinAM = true; return "Morning routine logged."; },
    skinPM:    function (d) { d.body.skinPM = true; return "Evening routine logged."; }
  };

  function markDone(key, view) {
    var fn = DONE_ACTIONS[key];
    if (!fn) { if (view) Hub.show(view); return; }
    /* Always today, never the backfill date — this came from a live reminder. */
    var msg = fn(Hub.editDay(Hub.today()));
    Hub.commit();
    Hub.reminders.reset(key);
    Hub.toast(msg, "success", 2500);
  }

  function offerUpdate() {
    Hub.toast("A new version is ready — tap to reload.", "info", 15000);
    var host = document.getElementById("wh-toast-host");
    var last = host && host.lastElementChild;
    if (last) last.addEventListener("click", applyUpdate);
  }

  function applyUpdate() {
    if (!waitingWorker) { location.reload(); return; }
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }

  /* ======================================================================
     INSTALL PROMPT
     ====================================================================== */
  window.addEventListener("beforeinstallprompt", function (e) {
    /* Chrome would otherwise show its own mini-infobar; we'd rather offer the
       install from Settings, where there's room to explain what it does. */
    e.preventDefault();
    deferredPrompt = e;
    if (Hub.activeView() === "settings") Hub.refresh();
  });

  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    Hub.toast("Installed. You can launch it from your app menu now.", "success", 6000);
    if (Hub.activeView() === "settings") Hub.refresh();
  });

  function canInstall() { return !!deferredPrompt; }

  function promptInstall() {
    if (!deferredPrompt) return;
    var evt = deferredPrompt;
    deferredPrompt = null;                 // a prompt event is single-use
    evt.prompt();
    evt.userChoice.then(function (choice) {
      if (choice.outcome !== "accepted") {
        Hub.toast("No problem — you can install later from Settings.", "info", 4000);
      }
      if (Hub.activeView() === "settings") Hub.refresh();
    });
  }

  /* ======================================================================
     DEEP LINKS  (?go=view&pill=…)  from manifest shortcuts and notifications
     ====================================================================== */
  function handleLaunchUrl() {
    var params = new URLSearchParams(location.search);
    var go = params.get("go");
    if (!go) return;

    /* `pill` applies to whichever view is being opened, rather than always
       writing the wellness one — otherwise `?go=mobility&pill=routines`
       silently sets the wrong tab's sub-nav and lands on the wrong section. */
    var PILL_KEY = {
      wellness: "wellnessPill", mobility: "mobilityPill", bodycare: "bodyPill",
      health: "healthPill", insights: "insightsPill",
      desk: "deskPill", repro: "reproPill"
    };
    if (params.get("pill") && PILL_KEY[go]) Hub.uiSet(PILL_KEY[go], params.get("pill"));

    /* The older, view-specific parameters still work. */
    if (params.get("mob")) Hub.uiSet("mobilityPill", params.get("mob"));
    if (params.get("body")) Hub.uiSet("bodyPill", params.get("body"));
    if (params.get("hp")) Hub.uiSet("healthPill", params.get("hp"));

    Hub.show(go);

    var action = params.get("action");
    if (action && Hub.actions && typeof Hub.actions[action] === "function") {
      /* Let the view finish painting before an overlay opens on top of it. */
      setTimeout(function () { Hub.actions[action](); }, 120);
    }

    /* Strip the query so a refresh doesn't replay the shortcut. */
    if (history.replaceState) {
      history.replaceState(null, "", location.pathname + location.hash);
    }
  }

  /* ======================================================================
     STATUS — consumed by the Settings view
     ====================================================================== */
  function status() {
    return {
      supported: supported(),
      installed: isInstalled(),
      canInstall: canInstall(),
      registered: !!registration,
      offlineReady: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
      updateWaiting: !!waitingWorker,
      protocol: location.protocol
    };
  }

  /* Clear the offline cache and re-register — the "it's behaving oddly" button. */
  function refreshCache() {
    if (!supported()) return;
    Promise.resolve()
      .then(function () { return caches.keys(); })
      .then(function (names) {
        return Promise.all(names.filter(function (n) {
          return n.indexOf("wellness-hub-") === 0;
        }).map(function (n) { return caches.delete(n); }));
      })
      .then(function () { return registration ? registration.unregister() : null; })
      .then(function () {
        Hub.toast("Offline cache cleared — reloading…", "info", 2500);
        setTimeout(function () { location.reload(); }, 800);
      })
      .catch(function () { location.reload(); });
  }

  Hub.pwa = {
    register: register,
    status: status,
    canInstall: canInstall,
    promptInstall: promptInstall,
    applyUpdate: applyUpdate,
    refreshCache: refreshCache,
    handleLaunchUrl: handleLaunchUrl,
    isInstalled: isInstalled
  };
})();
