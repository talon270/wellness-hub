/* ============================================================================
   WELLNESS HUB · NATIVE ALARMS (Android only)
   ----------------------------------------------------------------------------
   Android freezes the app's page within seconds of it leaving the screen, so
   the in-page tick can't be what reaches you. Everything that must arrive
   with the app closed is handed to AlarmManager ahead of time:

     · PLAN   what should be armed right now: each running timer's live
              countdown plus an alert at its end, and the next 24h of reminder
              fires (quiet hours, weekdays and snoozes applied the same way
              core.js reminders.check() applies them)
     · DIFF   arm what's new or moved, cancel what's gone. It runs on the
              master tick, so no timer control, reminder reset or settings
              edit has to remember this file exists (PLAN-android.md A5)
     · TAPS   a tapped notification opens the view it belongs to
     · FACE   keeps the screen awake over the lock screen while the countdown
              face is up. That's the app-drawn AOD (PLAN-android.md A13)

   Off Android every entry point is a harmless no-op.

   Public: Hub.native
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;
  var WH = window.WHNative;   // MainActivity's JS bridge; absent off Android

  Hub.native = {
    armedUntil: null,                              // epoch ms, or null off Android
    exactAlarms: function () { return null; },     // true / false / null (unknown)
    batteryExempt: function () { return null; },
    maker: function () { return ""; },
    sdk: function () { return 0; },
    openSettings: function () {},
    face: function () {},
    awake: function () {},
    /* PLAN-android.md B6: settings names this per Android version, since the
       menu path changed in 15. Reads sdk() live rather than caching it, so it
       tracks whichever function is assigned below (real bridge, or the
       no-op stub off Android). */
    batteryLabel: function () {
      return Hub.native.sdk() >= 35
        ? "App battery usage → Allow background usage"
        : "Battery → Unrestricted";
    },
    /* PLAN-android.md B6 first-run card: each reminder ticked by default to
       whether it actually suits a phone, with the reason shown alongside —
       "suggest, explain, let it be unticked", never a silent switch. Desk
       habits (eye/posture/stand) are suggested off because the phone isn't
       where the desk habit happens; everything else travels with the phone,
       so it stays on. */
    reminderAdvice: {
      eye:      { on: false, reason: "Desk habit: it's about the distance to a screen, which a phone doesn't change." },
      posture:  { on: false, reason: "Desk habit: about how you're sitting at a desk, not this phone." },
      stand:    { on: false, reason: "Desk habit: a nudge to leave a chair you're less often in when you're on the phone." },
      spf:      { on: true,  reason: "An outdoor habit — the phone is more likely to be with you in the sun than the desk is." },
      hydration:{ on: true,  reason: "The phone goes everywhere, so a second nudge to drink water is worth having here." },
      brushAM:  { on: true,  reason: "Same routine wherever you are — no reason to lose it on this device." },
      brushPM:  { on: true,  reason: "Same routine wherever you are — no reason to lose it on this device." },
      floss:    { on: true,  reason: "A daily habit that doesn't depend on being at a desk." },
      skinAM:   { on: true,  reason: "A daily routine that happens wherever you get ready, not at a desk." },
      skinPM:   { on: true,  reason: "A daily routine that happens wherever you wind down, not at a desk." },
      medsAM:   { on: true,  reason: "Medication timing matters regardless of which device reminds you." },
      medsNoon: { on: true,  reason: "Medication timing matters regardless of which device reminds you." },
      medsPM:   { on: true,  reason: "Medication timing matters regardless of which device reminds you." },
      contraceptive: { on: true, reason: "Timing matters here more than almost any other reminder — worth every device." },
      mobility: { on: true,  reason: "Ten minutes of joint work doesn't need a desk to do it." },
      mood:     { on: true,  reason: "An end-of-day check-in works from wherever you are." }
    }
  };
  if (!Hub.androidShell) return;

  /* A6: re-armed on every run, so 24h is how long the app can stay closed
     before reminders stop. Settings says "armed until …" rather than hiding it. */
  var HORIZON_MS = 24 * 3600e3;
  /* Id ranges, so a cancel can never hit a notification this file didn't post:
     countdowns 900 + catalogue index, timer alerts 1000 + index, reminders
     2000 + reminder index × PER_KEY + slot. */
  var COUNTDOWN_ID = 900, TIMER_ID = 1000, REMINDER_ID = 2000, PER_KEY = 100;
  /* Android refuses more than 500 armed alarms per app. 400 leaves room. */
  var MAX_ALARMS = 400;
  /* The plugin silently drops a schedule whose time has already passed, so
     nothing new is armed this close to its fire time. Applied only when
     arming: an alarm already armed stays in the plan up to the second it
     fires, or the diff would cancel it. That's what happened on the 2a,
     2026-09-23: the timer alert dropped out 2 s before zero and was cancelled. */
  var MIN_LEAD_MS = 2000;
  /* A fired reminder keeps its id this long, so re-arming never reuses the
     id of one still sitting in the shade — reuse would dismiss it. */
  var KEEP_FIRED_MS = 3 * 3600e3;
  /* Readable on a lock screen set to hide sensitive content, except these. */
  var PRIVATE_KEYS = { contraceptive: 1, medsAM: 1, medsNoon: 1, medsPM: 1 };
  var STORE_KEY = "nativeArmed";

  var invoke = window.__TAURI__.core.invoke;

  function hhmm(ms) {
    var d = new Date(ms);
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  /* ======================================================================
     PLAN
     ====================================================================== */
  function timerEntries(now, out) {
    var map = Hub.uiGet("timers", {}) || {};
    Hub.timers.CATALOGUE.forEach(function (t, i) {
      var rec = map[t.id];
      /* `ext` rows (the desk sitting clock) live in synced state, so they
         could have been started on the PC. Only timers started on this
         phone ring it, as decided in the interview. */
      if (t.ext || !rec || rec.paused != null || !(rec.endAt > now)) return;
      var view = "timer:" + t.id;
      out.push({ id: COUNTDOWN_ID + i, fire: "c" + i, countdown: rec.endAt,
                 title: t.name.toLowerCase(), body: "ends " + hhmm(rec.endAt), view: view, pub: true });
      out.push({ id: TIMER_ID + i, fire: "t" + i, at: rec.endAt,
                 title: t.name, body: t.alert || t.name + " timer done.", view: view, pub: true });
    });
  }

  /* Every fire time for one reminder inside the horizon. */
  function fireTimes(key, m, cfg, now, end) {
    var c = Hub.reminders.clocks(key), times = [];
    /* A snooze comes back regardless of quiet hours or weekday — the user
       asked for it — exactly as reminders.check() treats it. */
    if (c.snoozedUntil) times.push(c.snoozedUntil);
    if (m.kind === "interval") {
      var step = Math.max(1, Number(cfg.intervalMin) || 20) * 60000;
      /* After a snooze fires, check() resets the interval from that moment. */
      var t = c.snoozedUntil ? c.snoozedUntil + step : c.nextAt;
      for (; t && t <= end && times.length < PER_KEY; t += step) {
        var d = new Date(t);
        /* A quiet-hours fire is skipped but the clock still restarts, so the
           next one keeps its place in the sequence. */
        if (Hub.reminders.runsOn(cfg, d) && !Hub.reminders.inQuietHours(d)) times.push(t);
      }
    } else {
      var p = String(cfg.time || "00:00").split(":");
      for (var day = 0; day <= 1; day++) {
        var at = new Date(now);
        at.setDate(at.getDate() + day);
        at.setHours(Number(p[0]) || 0, Number(p[1]) || 0, 0, 0);
        var ms = at.getTime();
        if (c.snoozedUntil && ms <= c.snoozedUntil) continue;
        if (day === 0 && Hub.state.meta.lastFired[key] === Hub.calendarToday()) continue;
        /* Clock reminders ignore quiet hours on purpose; see check(). */
        if (ms <= end && Hub.reminders.runsOn(cfg, at)) times.push(ms);
      }
    }
    return times;
  }

  function reminderEntries(now, out) {
    var end = now + HORIZON_MS;
    Object.keys(Hub.reminders.meta).forEach(function (key, ki) {
      var m = Hub.reminders.meta[key], cfg = Hub.state.settings.reminders[key];
      /* PLAN-android.md A7: the device override, not the synced flag —
         arming an alarm for a reminder this phone has turned off is exactly
         the silent-miss-in-reverse A8's whole section exists to avoid. */
      if (!cfg || !Hub.reminders.on(key)) return;
      fireTimes(key, m, cfg, now, end).forEach(function (t) {
        if (t <= now) return;
        out.push({ key: key, ki: ki, fire: key + "@" + t, at: t,
                   title: m.title, body: m.body, view: m.view, pub: !PRIVATE_KEYS[key] });
      });
    });
  }

  /* ======================================================================
     DIFF
     ====================================================================== */
  var armed = Hub.uiGet(STORE_KEY, {}) || {};   // id -> { fire, at, countdown, sig }
  /* This record can outlive the alarms themselves: a force-stop (Settings →
     Force stop, or some cleaner apps) wipes every alarm and notification the
     app owns, and a reinstall can too. Trusting the record would then re-arm
     nothing on the next launch. So each launch treats every not-yet-fired
     entry as unarmed and re-arms it once. The ids are kept so slots stay stable.
     Seen on the 2a, 2026-09-23: 49 alarms before force-stop, 0 after. */
  (function forgetOnLaunch() {
    var now = Date.now();
    Object.keys(armed).forEach(function (id) {
      if ((armed[id].at || armed[id].countdown) > now) armed[id].sig = "";
    });
  })();
  var channelsReady = null;
  var busy = false, warned = false;

  function channels() {
    if (!channelsReady) {
      channelsReady = Promise.all([
        /* High importance is what makes Android show a heads-up with sound. */
        invoke("plugin:notification|create_channel", {
          id: "alerts", name: "Timers and reminders", importance: 4, visibility: 1, vibration: true,
          description: "Timer ends and reminders. Respects Do Not Disturb."
        }),
        /* Default importance, not Low: Nothing OS hides the whole "Silent"
           section on the lock screen, which took the countdown off it (seen on
           the 2a, 2026-09-23). The post itself is silent (setSilent in the
           plugin patch), so starting a timer still doesn't ding. */
        invoke("plugin:notification|create_channel", {
          id: "running", name: "Running timers", importance: 3, visibility: 1,
          description: "The live countdown for a running timer."
        }),
        /* The Low channel an earlier build created. A channel's importance
           can't be raised once it exists, hence the new id. */
        invoke("plugin:notification|delete_channel", { id: "countdown" }).catch(function () {})
      ]);
    }
    return channelsReady;
  }

  function sigOf(e) {
    return JSON.stringify([e.at || 0, e.countdown || 0, e.title, e.body, e.view, e.pub]);
  }

  function payload(e) {
    var n = {
      id: e.id, title: e.title, body: e.body, visibility: e.pub ? 1 : 0,
      /* res/drawable/ic_stat_wellness.xml; without it the plugin falls back to
         Android's stock "i" info glyph. */
      icon: "ic_stat_wellness",
      extra: { view: e.view }
    };
    if (e.countdown) {
      n.channelId = "running";
      n.ongoing = true;
      n.autoCancel = false;
      n.extra.countdownTo = e.countdown;
      /* Asks for a Live Update; ignored until the OS supports it (A13). */
      n.extra.promoted = true;
    } else {
      n.channelId = "alerts";
      n.autoCancel = true;
      n.schedule = { at: { date: new Date(e.at).toISOString(), repeating: false, allowWhileIdle: true } };
    }
    return n;
  }

  function plan(now) {
    var timers = [], rems = [];
    timerEntries(now, timers);
    reminderEntries(now, rems);
    rems.sort(function (a, b) { return a.at - b.at; });

    /* Stable ids per fire: a fire already armed keeps its id, a new fire takes
       a free slot in its reminder's range. */
    var byFire = {}, used = {};
    Object.keys(armed).forEach(function (id) { byFire[armed[id].fire] = +id; used[id] = true; });

    var until = now + HORIZON_MS, kept = [];
    for (var i = 0; i < rems.length; i++) {
      var e = rems[i];
      var id = byFire[e.fire];
      if (id == null) {
        var base = REMINDER_ID + e.ki * PER_KEY;
        for (var s = 0; s < PER_KEY && used[base + s]; s++) {}
        if (s === PER_KEY || kept.length >= MAX_ALARMS - timers.length) { until = Math.min(until, e.at); continue; }
        id = base + s;
      }
      used[id] = true;
      e.id = id;
      kept.push(e);
    }
    /* A6: the last fire before the horizon says how to keep them coming. */
    var last = null;
    kept.forEach(function (e) { if (e.at < until && (!last || e.at > last.at)) last = e; });
    if (last) last.body += " Open Wellness Hub to keep reminders coming.";
    Hub.native.armedUntil = until;
    return timers.concat(kept.filter(function (e) { return e.at < until; }));
  }

  function sync() {
    if (busy) return;
    var now = Date.now();
    var want = plan(now), wantIds = {}, arm = [], show = [], cancel = [];

    want.forEach(function (e) {
      wantIds[e.id] = true;
      var prev = armed[e.id], sig = sigOf(e);
      if (prev && prev.sig === sig) return;
      if (!e.countdown && e.at <= now + MIN_LEAD_MS) return;
      (e.countdown ? show : arm).push(e);
    });
    Object.keys(armed).forEach(function (id) {
      if (wantIds[id]) return;
      var a = armed[id];
      /* Still in the future: it was paused, reset, snoozed or switched off. */
      if ((a.at || a.countdown) > now) { cancel.push(+id); delete armed[id]; }
      /* Already fired: leave it in the shade, and hold its id for a while. */
      else if ((a.at || a.countdown) < now - KEEP_FIRED_MS) delete armed[id];
    });
    if (!arm.length && !show.length && !cancel.length) return;

    busy = true;
    channels().then(function () {
      var jobs = [];
      if (cancel.length) jobs.push(invoke("plugin:notification|cancel", { notifications: cancel }));
      if (arm.length) jobs.push(invoke("plugin:notification|batch", { notifications: arm.map(payload) }));
      show.forEach(function (e) { jobs.push(invoke("plugin:notification|show", payload(e))); });
      return Promise.all(jobs);
    }).then(function () {
      arm.concat(show).forEach(function (e) {
        armed[e.id] = { fire: e.fire, at: e.at || 0, countdown: e.countdown || 0, sig: sigOf(e) };
      });
      Hub.uiSet(STORE_KEY, armed);
    }).catch(function (err) {
      /* Nothing is recorded as armed, so the next tick retries. Warn once,
         not once a second. */
      if (!warned) { warned = true; console.warn("Wellness Hub: arming native alarms failed.", err); }
    }).then(function () { busy = false; });
  }

  Hub.onTick(sync);

  /* ======================================================================
     TAPS — cold start included: the plugin patch holds a tap that launched
     the app until this listener registers (NotificationPlugin.kt).
     ====================================================================== */
  function route(view) {
    if (!view) return;
    if (view.indexOf("timer:") === 0) {
      var id = view.slice(6);
      /* A finished timer has no countdown left to draw, so its alert opens
         the dashboard, where its row is. */
      Hub.show("dashboard");
      if (Hub.face && Hub.face.open) Hub.face.open(id);
      return;
    }
    Hub.show(view);
  }

  window.addEventListener("load", function () {
    var api = window.__TAURI__.notification;
    if (!api || !api.onAction) return;
    api.onAction(function (p) {
      var n = p && p.notification;
      route(n && n.extra && n.extra.view);
    }).catch(function () {});
  });

  /* ======================================================================
     BRIDGE
     ====================================================================== */
  function ask(fn, fallback) {
    return function () { try { return WH ? WH[fn]() : fallback; } catch (e) { return fallback; } };
  }
  Hub.native.exactAlarms = ask("exactAlarms", null);
  Hub.native.batteryExempt = ask("batteryExempt", null);   // true / false / null
  Hub.native.maker = ask("maker", "");                     // "Nothing", "samsung", …
  Hub.native.sdk = ask("sdk", 0);                          // 31 = Android 12, 36 = 16
  /* "notifications" | "exactAlarms" | "battery"; anything else opens the app's page. */
  Hub.native.openSettings = function (what) { try { if (WH) WH.openSettings(String(what)); } catch (e) {} };
  /* On: show over the lock screen, keep the display awake, drop the
     brightness. Off: back to normal. The face calls this on open and close. */
  Hub.native.face = function (on) {
    try { if (WH) WH.face(!!on); } catch (e) {}
  };
  /* Just the keep-awake half: an idle or paused face stays over the lock
     screen but lets the display time out, so a face left on the desk
     doesn't hold the screen lit all night. */
  Hub.native.awake = function (on) {
    try { if (WH) WH.awake(!!on); } catch (e) {}
  };
})();
