/* ============================================================================
   WELLNESS HUB · COUNTDOWN FACE
   ----------------------------------------------------------------------------
   The full-screen dark face for the eye timer (PLAN-android.md Part C), and
   the whole 20-20-20 cycle run inside it, so you never leave the dark screen:
     · IDLE     the full duration, dimmed. Hold to start it.
     · RUN      laid out like an always-on display, top left: the clock in
                Ndot 57 (Doto off the phone), then the timer and its end
                time, a small countdown, and the 20-dot row whose next dot
                breathes. Last-minute red. PAUSE / RESET at the bottom.
     · DUE      the timer ran out. Tap for the 20-second look-away; hold to
                skip it and start the next 20 minutes.
     · LOOK     the 20-second look-away. Finishing it counts the break
                (Hub.eye.logBreak, the same call the Eye Care overlay makes)
                and starts the next 20 minutes on its own, so the cycle
                runs until you close the face.
     · GESTURES a press held HOLD_MS is a long press; anything shorter is a
                tap. Buttons (close, pause, reset) are excluded.
     · QUIET    while counting, close and PAUSE / RESET fade out after
                QUIET_MS without a touch. Any touch brings them back. The
                countdown stays dimmed until the last minute.

   RUN reads the store timers.js owns (Hub.timers), never a copy. DUE, LOOK
   and IDLE have no record in that store, so they live in `phase` here and
   end when the face closes: closing mid-look-away counts nothing.

   On Android this doubles as the app-drawn AOD: Hub.native.face(true/false)
   shows the app over the lock screen for as long as the face is open.
   Keep-awake (Hub.native.awake) is on only while something is counting or
   waiting for your tap. An idle or paused face lets the screen time out,
   and pressing power brings it back over the lock screen.

   Only non-`ext` catalogue rows get a face. `deskreset` is a window onto the
   Desk tab's sitting clock, with no end time to draw a face around.

   Public: Hub.face.open(id) / .close() / .isOpen()
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  /* 20 dots, one drops per 5% elapsed. */
  var DOT_COUNT = 20;
  var DOT_STEP_PCT = 100 / DOT_COUNT;
  /* The accent is a last-minute-only signal, whatever the timer's length. */
  var LAST_MINUTE_SEC = 60;
  /* How far the burn-in drift can move the block. A few px is invisible in
     normal use and is what OLED pixel-shift actually needs. */
  var DRIFT_PX = 3;
  /* 20 feet for 20 seconds: the 20-20-20 rule's own number, and the same
     length as the Eye Care tab's look-away overlay. */
  var LOOK_SEC = 20;
  /* Android's own long-press timeout (ViewConfiguration), so a hold here
     feels like a hold everywhere else on the phone. */
  var HOLD_MS = 500;
  /* How long the controls stay up after a touch while the face counts. */
  var QUIET_MS = 5000;

  var el, inner, unsub, openId = null, reducedMotion = false;
  var phase = "idle", lookEnd = 0, doneToday = null, awakeNow = null;
  var holdTimer = null, held = false, quietTimer = null;

  function q(sel) { return inner.querySelector(sel); }

  function catalogue(id) {
    var t = null;
    Hub.timers.CATALOGUE.forEach(function (row) { if (row.id === id) t = row; });
    return t;
  }

  function record(id) { return (Hub.uiGet("timers", {}) || {})[id]; }

  function two(n) { return String(n).padStart(2, "0"); }

  /* Only call the bridge when the answer changes; render() runs every second. */
  function setAwake(on) {
    if (awakeNow === on) return;
    awakeNow = on;
    Hub.native.awake(on);
  }

  function render() {
    var t = catalogue(openId);
    if (!t) { close(); return; }
    var rec = record(openId);
    if (rec) phase = "run";
    /* The record vanished while it was counting: sweep() finished it. */
    else if (phase === "run") phase = "due";
    if (phase === "look" && Date.now() >= lookEnd) {
      doneToday = Hub.eye && Hub.eye.logBreak ? Hub.eye.logBreak() : null;
      Hub.timers.start(openId);
      rec = record(openId);
      phase = "run";
    }

    var full = Hub.timers.durationOf(t);
    var paused = phase === "run" && rec.paused != null;
    var total = full, left = full, label = t.name.toUpperCase(), hint = "";
    var hhmm = { hour: "2-digit", minute: "2-digit" };
    if (phase === "run") {
      total = rec.sec || full;
      left = paused ? rec.paused : Math.max(0, (rec.endAt - Date.now()) / 1000);
      if (paused) label += " · PAUSED";
      else if (doneToday != null) label += " · " + doneToday + " TODAY";
      if (!paused) label += " · ENDS " + new Date(Date.now() + left * 1000).toLocaleTimeString([], hhmm);
    } else if (phase === "look") {
      total = LOOK_SEC;
      left = Math.max(0, (lookEnd - Date.now()) / 1000);
      label = "LOOK 20 FEET AWAY";
    } else if (phase === "due") {
      left = 0;
      label += " · DONE";
      hint = "tap · 20-second look-away<br>hold · skip it, start " + Math.round(full / 60) + " min";
    } else {
      hint = "hold to start " + Math.round(full / 60) + " min";
    }

    var hot = (phase === "run" && !paused && left <= LAST_MINUTE_SEC) || phase === "due";
    var whole = Math.round(left); // same rounding as Hub.clock on the dashboard row
    var num = q(".wh-face__num");
    num.textContent = phase === "due" ? "LOOK AWAY" : two(Math.floor(whole / 60)) + ":" + two(whole % 60);
    num.classList.toggle("is-hot", hot);
    q(".wh-face__clock").textContent = new Date().toLocaleTimeString([], hhmm);
    num.classList.toggle("is-idle", phase === "idle");
    num.classList.toggle("is-dim", phase === "run" && !hot);
    /* Only a counting face goes quiet: idle and done need their hint. */
    if (phase !== "run" && phase !== "look") el.classList.remove("is-quiet");

    q(".wh-face__label").textContent = label;
    q(".wh-face__hint").innerHTML = hint;
    q(".wh-face__hint").hidden = !hint;
    q(".wh-face__acts").hidden = phase !== "run";
    q("[data-face-pause]").textContent = paused ? "RESUME" : "PAUSE";

    var dotsOn = phase === "run" || phase === "look"
      ? Math.max(0, DOT_COUNT - Math.floor(Hub.pct(total - left, total) / DOT_STEP_PCT))
      : phase === "idle" ? DOT_COUNT : 0;
    var dots = q(".wh-face__dots");
    if (dots.childElementCount !== DOT_COUNT) {
      dots.innerHTML = "";
      for (var i = 0; i < DOT_COUNT; i++) {
        var d = document.createElement("span");
        d.className = "wh-face__dot";
        dots.appendChild(d);
      }
    }
    dots.classList.toggle("is-due", phase === "due");
    /* The next dot to drop breathes, only while the clock is actually moving. */
    var live = (phase === "look" || (phase === "run" && !paused)) ? dotsOn - 1 : -1;
    Array.prototype.forEach.call(dots.children, function (d, i) {
      d.classList.toggle("is-on", i < dotsOn);
      d.classList.toggle("is-hot", hot && i < dotsOn);
      d.classList.toggle("is-live", i === live);
    });

    setAwake(phase === "look" || phase === "due" || (phase === "run" && !paused));

    /* Burn-in drift: a new stable offset each minute, skipped under reduced
       motion — a screen that's supposed to hold still shouldn't crawl. */
    if (!reducedMotion) {
      var minute = Math.floor(Date.now() / 60000);
      var dx = (minute % 7 - 3) / 3 * DRIFT_PX;
      var dy = (minute % 5 - 2) / 2 * DRIFT_PX;
      inner.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
    }
  }

  function shell() {
    return (
      '<div class="wh-face__inner">' +
        '<button type="button" class="wh-face__close" data-face-close aria-label="Close">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
            '<path d="M18 6 6 18M6 6l12 12"/></svg>' +
        "</button>" +
        '<div class="wh-face__clock"></div>' +
        '<div class="wh-face__label"></div>' +
        '<div class="wh-face__num" role="timer"></div>' +
        '<div class="wh-face__dots"></div>' +
        '<div class="wh-face__spacer"></div>' +
        '<div class="wh-face__hint" hidden></div>' +
        '<div class="wh-face__acts">' +
          '<button type="button" class="wh-face__btn" data-face-pause>PAUSE</button>' +
          '<button type="button" class="wh-face__btn" data-face-reset>RESET</button>' +
        "</div>" +
      "</div>"
    );
  }

  function open(id) {
    var t = catalogue(id);
    if (!t || t.ext) return;
    el = el || document.getElementById("wh-face");
    if (!el) return;

    openId = id;
    phase = record(id) ? "run" : "idle";
    doneToday = null;
    reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.innerHTML = shell();
    inner = el.querySelector(".wh-face__inner");
    el.hidden = false;
    document.body.style.overflow = "hidden";
    Hub.native.face(true);
    awakeNow = true;
    render();
    wake();
    if (!unsub) unsub = Hub.onTick(render);
    q("[data-face-close]").focus();
  }

  /* Brings the controls back and restarts the countdown to hiding them. */
  function wake() {
    el.classList.remove("is-quiet");
    clearTimeout(quietTimer);
    quietTimer = setTimeout(function () {
      if (phase === "run" || phase === "look") el.classList.add("is-quiet");
    }, QUIET_MS);
  }

  function close() {
    if (!el || el.hidden) return;
    clearTimeout(holdTimer);
    clearTimeout(quietTimer);
    el.classList.remove("is-quiet");
    el.hidden = true;
    el.innerHTML = "";
    inner = null;
    document.body.style.overflow = "";
    openId = null;
    phase = "idle";
    awakeNow = null;
    Hub.native.face(false);
  }

  /* Long press: start the timer, from IDLE or (skipping the look-away) DUE.
     Ignored while something is counting, so a stray hold can't reset it. */
  function onHold() {
    held = true;
    if (phase !== "idle" && phase !== "due") return;
    Hub.vibrate(40);
    Hub.timers.start(openId);
    phase = "run";
    render();
  }

  /* Short tap: only DUE listens, and starts the look-away. */
  function onTap() {
    if (phase !== "due") return;
    Hub.beep(660, 80);
    phase = "look";
    lookEnd = Date.now() + LOOK_SEC * 1000;
    render();
  }

  function wire() {
    el = document.getElementById("wh-face");
    if (!el) return;
    /* On the phone this face is the AOD: it must stay black whatever the OS
       theme, or a light-mode phone gets a near-white screen held awake. */
    if (Hub.androidShell) el.classList.add("wh-face--aod");
    Hub.delegate(el, "[data-face-close]", close);
    Hub.delegate(el, "[data-face-pause]", function () {
      var rec = record(openId);
      if (!rec) return;
      if (rec.paused != null) Hub.timers.start(openId); else Hub.timers.pause(openId);
      render();
    });
    Hub.delegate(el, "[data-face-reset]", function () {
      if (openId) { Hub.timers.restart(openId); render(); }
    });

    el.addEventListener("pointerdown", function (e) {
      wake();
      if (e.target.closest("button")) return;
      held = false;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(onHold, HOLD_MS);
    });
    el.addEventListener("pointerup", function (e) {
      if (e.target.closest("button")) return;
      clearTimeout(holdTimer);
      if (!held) onTap();
    });
    el.addEventListener("pointercancel", function () { clearTimeout(holdTimer); });
    /* A long press would otherwise open the WebView's text-selection menu. */
    el.addEventListener("contextmenu", function (e) { e.preventDefault(); });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && el && !el.hidden) close();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();

  Hub.face = { open: open, close: close, isOpen: function () { return !!openId; } };
})();
