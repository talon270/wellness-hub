/* ============================================================================
   WELLNESS HUB · GUIDE
   ----------------------------------------------------------------------------
   The same spotlight-tour mechanic as Docket's guide and the Hub's, adapted
   to Wellness Hub's actual sidebar/topbar layout and its own view router
   (Hub.show). Third build of this exact pattern today — see
   Hub/PLAN-guide.md for the two fixes that pattern needed once it met real
   conditional DOM (targets that skip themselves honestly, a focus trap).
   Both are carried over here rather than re-discovered.

   Opt-in only, button-triggered, never auto-started — a tour that turns
   itself on for you is the "silent configuration" this house avoids
   everywhere else.

   Public: none. Wires its own button on DOMContentLoaded.
   ========================================================================== */
"use strict";

(function () {
  var Hub = window.Hub;
  if (!Hub) return;

  var STEPS = [
    {
      target: "#wh-logo-sidebar, #wh-logo-mobile",
      title: "The heart mark",
      body: "Click it from anywhere in the app to jump straight back to the Dashboard."
    },
    {
      target: "#wh-nav-desktop, #wh-nav-mobile",
      title: "Every area, one list",
      body: "Fitness, Desk & Movement, Eye care, Dental, Body care, Wellness, Health, Insights, Settings — " +
            "all logging lives behind one of these. A small dot marks anything already done today."
    },
    {
      target: "#wh-atdesk-sidebar, #wh-atdesk-mobile",
      title: "At Desk",
      body: "One click starts the sitting clock from wherever you are — no need to open Desk & Movement " +
            "first. Click again to stop it. It turns amber and shows the minutes while it's running.",
      onEnter: function () { Hub.show("dashboard"); }
    },
    {
      target: "#wh-view-dashboard .wh-streak, #wh-topbar-streak",
      title: "Streaks",
      body: "A perfect day, not a partial one — every habit you've turned on has to be done. Grace days " +
            "cover a missed one without zeroing the count.",
      onEnter: function () { Hub.show("dashboard"); }
    },
    {
      target: "#wh-nav-desktop [data-view=\"settings\"], #wh-nav-mobile [data-view=\"settings\"]",
      title: "Reminders live in Settings",
      body: "Water, eye breaks, posture, standing, dental, skin — each one is its own switch with its own " +
            "interval and days. A reminder now sounds and vibrates distinctly from an in-session timer, and " +
            "stays on screen until you act on it, so it reaches you even in a different tab."
    },
    {
      target: "#st-folder-link, #st-drive-link",
      title: "Keeping your data",
      body: "Link a synced folder or connect Google Drive, and this browser stops being the only copy. " +
            "Everything also exports as one JSON file and as CSV per data set, any time, from right here.",
      onEnter: function () { Hub.show("settings"); }
    },
    {
      target: "#wh-nav-desktop [data-view=\"fitness\"], #wh-nav-mobile [data-view=\"fitness\"]",
      title: "Fitness runs its own program",
      body: "BASALT, integrated: an adaptive calisthenics ladder with its own onboarding, phase tracking, " +
            "and — in each exercise's guide — a phase-by-phase muscle visualiser."
    },
    {
      target: "#wh-guide-btn-sidebar, #wh-guide-btn-mobile",
      title: "That's Wellness Hub",
      body: "Nothing here is required to start logging — every habit switches on independently, and the " +
            "app works exactly the same with two of them on as with twenty. Come back to this tour any time."
    }
  ];

  var index = 0, active = false, restoreFocus = null;
  function $(id) { return document.getElementById(id); }

  /* Present in the DOM is not the same as on screen — Settings' two sync
     blocks (#st-folder-link / #st-drive-link) each only render when THAT
     transport isn't already linked, so a step naming both needs to accept
     either, and skip only if genuinely neither is present. */
  function targetEl(step) {
    var sels = step.target.split(",").map(function (s) { return s.trim(); });
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (!el) continue;
      var r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
    return null;
  }

  function visibleSteps() { return STEPS.filter(function (s) { return !!targetEl(s); }); }

  function positionSpot(rect) {
    var pad = 8;
    var spot = $("wh-tour-spot");
    spot.style.top = (rect.top - pad) + "px";
    spot.style.left = (rect.left - pad) + "px";
    spot.style.width = (rect.width + pad * 2) + "px";
    spot.style.height = (rect.height + pad * 2) + "px";
  }

  function positionCard(rect) {
    var card = $("wh-tour-card");
    var margin = 16;
    var cardRect = card.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;

    var top = rect.bottom + margin;
    if (top + cardRect.height > vh - margin) top = rect.top - cardRect.height - margin;
    if (top < margin) top = Math.max(margin, (vh - cardRect.height) / 2);

    var left = rect.right + margin;
    if (left + cardRect.width > vw - margin) left = rect.left;
    if (left + cardRect.width > vw - margin) left = vw - cardRect.width - margin;
    if (left < margin) left = margin;

    card.style.top = top + "px";
    card.style.left = left + "px";
  }

  function pad2(n) { return String(n).length < 2 ? "0" + n : String(n); }

  function renderStep() {
    var step = STEPS[index];
    var el = targetEl(step);
    if (!el) {
      if (index < STEPS.length - 1) { next(); } else { end(); }
      return;
    }

    /* `behavior: "auto"` defers to CSS `scroll-behavior`, which this app sets
       to `smooth` globally (css/hub.css) — so "auto" here is a real animated
       scroll, not an instant jump. Measuring the target's position right
       after starting it (as the next line does) reads the PRE-scroll
       position on a page as long as Settings, landing the card hundreds of
       pixels into empty space. "instant" bypasses CSS scroll-behavior
       entirely and is synchronous, which is what actually fixes it. */
    el.scrollIntoView({ block: "center", behavior: "instant" });
    var rect = el.getBoundingClientRect();
    positionSpot(rect);

    var shown = visibleSteps();
    var pos = shown.indexOf(step) + 1;
    $("wh-tour-step-label").textContent = "GUIDE " + pad2(pos) + "/" + pad2(shown.length);
    $("wh-tour-title").textContent = step.title;
    $("wh-tour-body").textContent = step.body;
    $("wh-tour-back").disabled = index === 0;
    $("wh-tour-next").textContent = index === STEPS.length - 1 ? "Done" : "Next";

    requestAnimationFrame(function () { positionCard(el.getBoundingClientRect()); });
  }

  function goToStep(newIndex) {
    var leaving = STEPS[index];
    if (leaving.onExit) leaving.onExit();
    index = newIndex;
    var entering = STEPS[index];
    if (entering.onEnter) entering.onEnter();
    requestAnimationFrame(renderStep);
  }

  function next() { if (index >= STEPS.length - 1) { end(); return; } goToStep(index + 1); }
  function back() {
    if (index === 0) return;
    var i = index - 1;
    while (i > 0 && !targetEl(STEPS[i])) i--;
    goToStep(i);
  }

  function start() {
    if (active) return;
    active = true;
    index = 0;
    restoreFocus = document.activeElement;
    $("wh-tour").hidden = false;
    document.addEventListener("keydown", onKeydown, true);
    window.addEventListener("resize", onResize);
    var first = STEPS[0];
    if (first.onEnter) first.onEnter();
    requestAnimationFrame(function () {
      renderStep();
      var n = $("wh-tour-next");
      if (n) n.focus();
    });
  }

  function end() {
    if (!active) return;
    var leaving = STEPS[index];
    if (leaving.onExit) leaving.onExit();
    active = false;
    $("wh-tour").hidden = true;
    document.removeEventListener("keydown", onKeydown, true);
    window.removeEventListener("resize", onResize);
    if (restoreFocus && restoreFocus.focus) restoreFocus.focus();
  }

  function onResize() { if (active) renderStep(); }

  function trapFocus(e) {
    var focusables = $("wh-tour-card").querySelectorAll(
      "button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    if (!focusables.length) return;
    var first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!$("wh-tour-card").contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  }

  function onKeydown(e) {
    if (e.key === "Escape") { e.preventDefault(); end(); return; }
    if (e.key === "Tab") { trapFocus(e); return; }
    if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); next(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); back(); }
  }

  document.addEventListener("DOMContentLoaded", function () {
    [$("wh-guide-btn-sidebar"), $("wh-guide-btn-mobile")].forEach(function (b) {
      if (b) b.addEventListener("click", start);
    });
    $("wh-tour-next").addEventListener("click", next);
    $("wh-tour-back").addEventListener("click", back);
    $("wh-tour-skip").addEventListener("click", end);
  });
})();
