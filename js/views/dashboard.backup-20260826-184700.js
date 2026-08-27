/* ============================================================================
   WELLNESS HUB · DASHBOARD
   ----------------------------------------------------------------------------
   The landing view. Answers three questions in one screen:
     1. How are my streaks doing?     (streak grid + perfect-day ring)
     2. What's coming up?             (next reminder countdown)
     3. What can I log right now?     (one-tap quick actions)
   Plus a recent-badges strip and a rotating tip.
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  /* ======================================================================
     ROTATING TIPS
     ====================================================================== */
  var TIPS = [
    "The best posture is your next posture — change position every 30 minutes.",
    "Blinking rate drops by up to two thirds when you stare at a screen. Blink on purpose.",
    "Brush before breakfast, or wait 30 minutes after — acid softens enamel and brushing straight away scrubs it.",
    "Thirst lags behind dehydration. Drink on a schedule, not on a signal.",
    "A 20-second look into the distance is enough to relax the focusing muscle. It doesn't need to be longer.",
    "Consistency beats intensity. Three short sessions a week you actually do beat five you don't.",
    "Flossing reaches the 35% of tooth surface a brush never touches.",
    "Slow exhales are the lever — a long out-breath is what actually calms the nervous system.",
    "Light in the morning, dark at night. That single pairing does more for sleep than most supplements.",
    "Your neck holds about 5kg. Every 15° you tilt forward roughly doubles the load it carries.",
    "Progress is a trend line, not a data point. One skipped day is noise.",
    "Bristles splay before they wear out — a frayed brush is cleaning maybe half as well.",
    "You can't stretch your way out of a position you hold for eight hours. Move more often instead.",
    "Rest days are part of the program, not a gap in it.",
    "Deep sleep does most of the tissue repair. Training hard and sleeping badly cancel out.",
    "Hydration affects focus before it affects thirst.",
    "Two minutes of brushing feels much longer than you think. Time it — most people stop around 45 seconds.",
    "Box breathing works because it's boring. That's the point.",
    "Strength is a skill. Practise the movement, don't just survive the set.",
    "Screens at eye level, elbows at 90°, feet flat. Fix the desk once and stop fighting it daily."
  ];

  /* ======================================================================
     QUICK-LOG ACTIONS
     ----------------------------------------------------------------------
     `done(d)` decides whether the tile reads as already-satisfied today;
     `meta(d)` is the small monospace status under the label.
     ====================================================================== */
  function quickActions() {
    var goal = Hub.state.settings.hydrationGoalCups || 8;
    /* Before 14:00 the brush tile targets the morning slot, after it the
       evening. Backfilling a past day has no "now" to read, so it fills the
       morning slot first and the evening once that's done. */
    var pmSlot = Hub.isBackfilling()
      ? !!Hub.day().brushAM
      : new Date().getHours() >= 14;

    return [
      {
        id: "water", label: "Log water", icon: "water", color: "var(--blue-bright)",
        meta: function (d) { return d.water + "/" + goal + " cups"; },
        done: function (d) { return d.water >= goal; },
        run: function () {
          var d = Hub.editDay();
          d.water++;
          Hub.commit();
          Hub.reminders.reset("hydration");
          Hub.gamify.checkMilestone("hydration");
          Hub.toast("Water logged — " + d.water + "/" + goal + " cups.", "success", 2000);
          Hub.beep(720, 90);
        }
      },
      {
        id: "eye", label: "Eye break", icon: "eye", color: "var(--blue-bright)",
        meta: function (d) { return d.eye2020 + " breaks today"; },
        done: function (d) { return d.eye2020 >= 3 || d.eye >= 1; },
        run: function () {
          var d = Hub.editDay();
          d.eye2020++;
          Hub.commit();
          Hub.reminders.reset("eye");
          Hub.gamify.checkMilestone("eye");
          Hub.toast("Eye break logged.", "success", 2000);
          Hub.beep(660, 90);
        }
      },
      {
        id: "brush", label: pmSlot ? "Brushed (PM)" : "Brushed (AM)", icon: "dental", color: "var(--aqua-bright)",
        meta: function (d) { return (d.brushAM ? "AM ✓ " : "AM — ") + (d.brushPM ? "PM ✓" : "PM —"); },
        done: function (d) { return pmSlot ? d.brushPM : d.brushAM; },
        run: function () {
          var d = Hub.editDay();
          var key = pmSlot ? "brushPM" : "brushAM";
          d[key] = !d[key];
          Hub.commit();
          Hub.gamify.checkMilestone("dental");
          Hub.toast(d[key] ? "Brushing logged." : "Brushing un-logged.", d[key] ? "success" : "info", 2000);
          if (d[key]) Hub.beep(700, 90);
        }
      },
      {
        id: "floss", label: "Flossed", icon: "check", color: "var(--aqua-bright)",
        meta: function (d) { return d.floss ? "done today" : "not yet"; },
        done: function (d) { return !!d.floss; },
        run: function () {
          var d = Hub.editDay();
          d.floss = !d.floss;
          Hub.commit();
          Hub.gamify.checkMilestone("floss");
          Hub.toast(d.floss ? "Flossing logged." : "Flossing un-logged.", d.floss ? "success" : "info", 2000);
          if (d.floss) Hub.beep(700, 90);
        }
      },
      {
        id: "stand", label: "Stand break", icon: "stand", color: "var(--wh-c-desk)",
        meta: function (d) { return d.stand + "/" + (Hub.state.settings.standGoal || 8) + " breaks"; },
        done: function (d) { return d.stand >= (Hub.state.settings.standGoal || 8); },
        /* Hands off to the desk module so "I stood up" has one implementation,
           including ending an open sitting session. */
        run: function () {
          if (Hub.desk) Hub.desk.logStand();
          else { var d = Hub.editDay(); d.stand++; Hub.commit(); }
        }
      },
      {
        id: "posture", label: "Posture check", icon: "posture", color: "var(--purple-bright)",
        meta: function (d) { return d.posture + " check-ins"; },
        done: function (d) { return d.posture >= 3; },
        run: function () {
          var d = Hub.editDay();
          d.posture++;
          Hub.commit();
          Hub.reminders.reset("posture");
          Hub.toast("Sit tall — check-in logged.", "success", 2000);
          Hub.beep(620, 90);
        }
      },
      {
        id: "breathe", label: "Breathe 1 min", icon: "wind", color: "var(--purple-bright)",
        meta: function (d) { return (d.mindful || []).length + " sessions"; },
        done: function (d) { return (d.mindful || []).length > 0; },
        /* Hands off to the wellness module so there's one breathing
           implementation, not two that can drift apart. */
        run: function () {
          Hub.show("wellness");
          if (Hub.wellness && Hub.wellness.quickBreathe) Hub.wellness.quickBreathe();
        }
      },
      {
        id: "spf", label: "Sunscreen", icon: "sun", color: "var(--green-bright)",
        meta: function (d) { return d.body && d.body.spf ? d.spfReapply + " today" : "not yet"; },
        done: function (d) { return !!(d.body && d.body.spf); },
        run: function () {
          var d = Hub.editDay();
          d.body.spf = true;
          d.spfReapply++;
          Hub.commit();
          Hub.reminders.reset("spf");
          Hub.toast("Sunscreen logged.", "success", 2000);
          Hub.beep(700, 90);
        }
      },
      {
        id: "mobility", label: "Mobility", icon: "stretchIc", color: "var(--yellow)",
        meta: function (d) { return d.mobility + " today"; },
        done: function (d) { return d.mobility > 0 || d.restDay; },
        /* Sends you to the routines rather than silently incrementing a
           counter — "I did mobility" should mean you actually did it. */
        run: function () {
          Hub.uiSet("mobilityPill", "routines");
          Hub.show("mobility");
        }
      },
      {
        id: "mood", label: "Mood check-in", icon: "mood", color: "var(--yellow-bright)",
        meta: function (d) { return d.mood ? "logged" : "not yet"; },
        done: function (d) { return !!d.mood; },
        run: function () {
          Hub.uiSet("wellnessPill", "mood");
          Hub.show("wellness");
        }
      }
    ].concat(
      /* The user's own habits are one-tap too — they'd be second-class if the
         quick log only covered the built-ins. */
      Hub.gamify.customHabits().map(function (h) {
        return {
          id: "custom:" + h.id,
          label: h.name,
          icon: h.icon || "check",
          color: h.color || "var(--yellow-bright)",
          meta: function (d) { return (d.custom || {})[h.id] ? "done" : "not yet"; },
          done: function (d) { return !!(d.custom || {})[h.id]; },
          run: function () {
            var d = Hub.editDay();
            if (d.custom[h.id]) delete d.custom[h.id];
            else d.custom[h.id] = true;
            Hub.commit();
            if (d.custom[h.id]) {
              Hub.beep(700, 90);
              Hub.gamify.checkMilestone("custom:" + h.id);
              Hub.toast(h.name + " logged.", "success", 2000);
            } else {
              Hub.toast(h.name + " un-logged.", "info", 2000);
            }
          }
        };
      })
    );
  }

  /* ======================================================================
     RENDER
     ====================================================================== */
  function render(el) {
    var s = Hub.state;
    var d = Hub.day();
    var st = s.streaks || {};
    var goal = s.settings.hydrationGoalCups || 8;
    var G = Hub.gamify;

    var name = (s.settings.name || "").trim();
    var perfect = st.perfect || { current: 0, best: 0, doneToday: false };
    var partsDone = G.PERFECT_PARTS.filter(function (k) { return st[k] && st[k].doneToday; }).length;

    el.innerHTML =
      /* ---------- hero ---------- */
      '<section class="wh-hero">' +
        "<div>" +
          '<div class="wh-hero__greet">' +
            (Hub.isBackfilling() ? "Filling in " + Hub.prettyDate(Hub.viewDate())
                                 : greeting() + (name ? ", " + Hub.esc(name) : "")) + "</div>" +
          '<div class="wh-hero__sub">' +
            (Hub.isBackfilling()
              ? Hub.esc(Hub.relDay(Hub.viewDate())) + " · everything you log goes to that day"
              : new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) +
                " · " + (perfect.doneToday
                  ? "All core habits done. Nice."
                  : partsDone + " of " + G.PERFECT_PARTS.length + " core habits done today")) +
          "</div>" +
        "</div>" +
        '<div class="wh-hero__perfect">' +
          Hub.ring(Hub.pct(partsDone, G.PERFECT_PARTS.length), {
            size: 96, stroke: 8,
            color: perfect.doneToday ? "var(--green-bright)" : "var(--yellow-bright)",
            aria: partsDone + " of " + G.PERFECT_PARTS.length + " core habits complete",
            center: '<div class="wh-ringwrap__val">' + perfect.current + "</div>" +
                    '<div class="wh-ringwrap__lbl">day streak</div>'
          }) +
        "</div>" +
      "</section>" +

      /* ---------- the logging date ---------- */
      Hub.dateNav() +

      /* ---------- profile & suggestions ---------- */
      profileCard() +

      /* ---------- what needs attention ---------- */
      topAdvice() +

      /* ---------- streaks ---------- */
      '<div class="wh-row wh-row--between wh-mb4">' +
        '<h2 class="wh-h2" style="margin:0">Streaks</h2>' + graceNote(st) +
      "</div>" +
      '<div class="wh-streaks wh-mb4">' + streakTiles(st) + "</div>" +

      /* ---------- next reminder + quick log ---------- */
      '<div class="wh-grid wh-grid--2 wh-mt6">' +
        '<div class="wh-card">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("bell") + "Next reminder</div></div>" +
          '<div id="wh-next-reminder"></div>' +
        "</div>" +
        '<div class="wh-card">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("water") + "Today at a glance</div></div>" +
          '<div class="wh-stack wh-stack--sm">' +
            miniBar("Water", d.water, goal, "cups", "var(--blue-bright)") +
            miniBar("Eye breaks", d.eye2020, 3, "breaks", "var(--blue-bright)") +
            miniBar("Brushing", (d.brushAM ? 1 : 0) + (d.brushPM ? 1 : 0), 2, "times", "var(--aqua-bright)") +
            miniBar("Mindfulness", (d.mindful || []).length, 1, "sessions", "var(--purple-bright)") +
          "</div>" +
        "</div>" +
      "</div>" +

      /* ---------- quick log ---------- */
      '<div class="wh-card wh-mt6">' +
        '<div class="wh-card__head">' +
          '<div class="wh-card__title">' + Hub.icon("plus") + "Quick log</div>" +
          '<span class="wh-chip">one tap</span>' +
        "</div>" +
        '<div class="wh-quick">' + quickTiles(d) + "</div>" +
      "</div>" +

      /* ---------- badges ---------- */
      '<div class="wh-card wh-mt6">' +
        '<div class="wh-card__head">' +
          '<div class="wh-card__title">' + Hub.icon("trophy") + "Recently earned</div>" +
          '<button type="button" class="wh-btn wh-btn--ghost wh-btn--sm" data-goto="achievements">Trophy case</button>' +
        "</div>" +
        recentBadges() +
      "</div>" +

      /* ---------- tip ---------- */
      '<div class="wh-tip wh-mt6">' +
        '<span class="wh-tip__ic">' + Hub.icon("lightbulb") + "</span>" +
        '<span class="wh-tip__text" id="wh-tip-text">' + Hub.esc(TIPS[s.meta.tipIndex % TIPS.length]) + "</span>" +
        '<button type="button" class="wh-tip__cycle" id="wh-tip-next" aria-label="Show another tip">' + Hub.icon("refresh") + "</button>" +
      "</div>";

    paintNextReminder();
    wire(el);
  }

  /* ---------- fragments ---------- */

  /* Either "you never finished setting up", or the suggestions that setup
     produced and you haven't acted on. Both disappear entirely once dealt
     with — a permanent nag card is how people learn to ignore a whole area
     of a screen. */
  function profileCard() {
    if (!Hub.onboarding) return "";
    var p = Hub.state.settings.profile;

    if (!p.completedAt) {
      return '<div class="wh-card wh-card--accent wh-mb4">' +
        '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("idCard") +
          "Set this up for you</div></div>" +
        '<p class="wh-sm wh-muted">Six questions — your day, your goals, and the couple of things that ' +
          "decide which parts of the app are worth showing you. It picks reminder times around your own " +
          "waking hours instead of somebody else's defaults.</p>" +
        '<div class="wh-row wh-mt4">' +
          '<button type="button" class="wh-btn wh-btn--primary" data-onboard>' + Hub.icon("check") +
            (p.skipped ? "Do it now" : "Start") + "</button>" +
          (p.skipped ? "" : '<button type="button" class="wh-btn wh-btn--ghost wh-btn--sm" data-onboard-skip>Not now</button>') +
        "</div>" +
      "</div>";
    }

    var pend = Hub.onboarding.pending();
    if (!pend.length) return "";
    var top = pend.slice(0, 3);

    return '<div class="wh-card wh-mb4">' +
      '<div class="wh-card__head">' +
        '<div class="wh-card__title">' + Hub.icon("lightbulb") + "Suggested for you</div>" +
        '<span class="wh-chip">' + pend.length + " left</span>" +
      "</div>" +
      '<div class="wh-stack wh-stack--sm">' + top.map(function (s) {
        return '<div class="wh-logrow" style="align-items:flex-start;gap:var(--wh-s3)">' +
          '<span class="wh-grow"><strong class="wh-sm">' + Hub.esc(s.title) + "</strong>" +
            '<span class="wh-xs wh-faint" style="display:block">' + Hub.esc(s.why) + "</span></span>" +
          '<span class="wh-row" style="gap:var(--wh-s2)">' +
            '<button type="button" class="wh-btn wh-btn--sm wh-btn--primary" data-sugg-apply="' + s.id + '">' +
              "Turn on</button>" +
            '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" data-sugg-no="' + s.id +
              '" aria-label="Dismiss suggestion">' + Hub.icon("x") + "</button>" +
          "</span>" +
        "</div>";
      }).join("") + "</div>" +
      (pend.length > top.length
        ? '<p class="wh-help wh-mt4">' + (pend.length - top.length) + " more in Settings → Your profile.</p>"
        : "") +
    "</div>";
  }

  /* The two most pressing recovery flags. The rest live in Insights — the
     dashboard shouldn't turn into a wall of nagging. */
  function topAdvice() {
    if (!Hub.insights || !Hub.adviceUI) return "";
    var list = Hub.insights.advice().slice(0, 2);
    if (!list.length) return "";
    return '<div class="wh-stack wh-stack--sm wh-mb4">' +
      list.map(Hub.adviceUI.card).join("") +
      (Hub.insights.advice().length > 2
        ? '<button type="button" class="wh-btn wh-btn--ghost wh-btn--sm" data-goto="insights">' +
          "See all " + Hub.insights.advice().length + " in Insights</button>"
        : "") +
    "</div>";
  }

  function greeting() {
    var h = new Date().getHours();
    if (h < 5) return "Still up";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }

  /* Say how much grace is left, once it's actually in play — a streak that
     survived a miss should say so rather than looking like an unbroken run. */
  function graceNote(st) {
    var allowance = Hub.gamify.graceAllowance();
    if (!allowance) return "";
    var used = Object.keys(st).some(function (k) { return (st[k] || {}).graceUsed > 0; });
    var left = Math.min.apply(null, Object.keys(st).map(function (k) {
      var g = (st[k] || {}).graceLeft;
      return g == null ? allowance : g;
    }).concat([allowance]));
    return '<span class="wh-chip' + (used ? " wh-chip--warn" : "") + '" ' +
      'title="A missed day doesn\'t reset a streak while you have grace left this month.">' +
      left + " of " + allowance + " grace " + Hub.plural(allowance, "day") + " left</span>";
  }

  function streakTiles(st) {
    var C = Hub.gamify.CATEGORIES;
    var order = ["fitness", "desk", "mobility", "eye", "dental", "bodycare", "hydration", "sleep", "mindful", "mood"]
      .concat(Hub.gamify.customHabits().map(function (h) { return "custom:" + h.id; }));

    var tiles = order.filter(function (key) { return !!C[key]; }).map(function (key) {
      var c = C[key], s = st[key] || { current: 0, best: 0, doneToday: false, unit: "day" };
      var weekly = s.unit === "week";
      return '<button type="button" class="wh-streak' + (s.doneToday ? " is-done" : "") + '" ' +
          'style="--wh-streak-c:' + c.color + '" data-goto="' + c.view + '">' +
        '<div class="wh-streak__top">' + Hub.icon(c.icon) +
          '<span class="wh-streak__name">' + Hub.esc(c.label) + "</span></div>" +
        '<div class="wh-streak__val">' + s.current + "<small> " + (weekly ? "w" : "d") + "</small></div>" +
        '<div class="wh-streak__sub">' +
          (weekly
            ? (s.weekCount || 0) + "/" + s.perWeek + " this week"
            : (s.doneToday ? "done today" : "best " + s.best) +
              (s.graceUsed ? " · " + s.graceUsed + " grace" : "")) +
        "</div>" +
      "</button>";
    });

    /* Perfect-day tile leads the row visually but sits last in source order so
       the category tiles keep their natural reading order on a narrow screen. */
    var p = st.perfect || { current: 0, best: 0, doneToday: false };
    tiles.unshift(
      '<div class="wh-streak' + (p.doneToday ? " is-done" : "") + '" style="--wh-streak-c:var(--yellow-bright)" ' +
        'title="A perfect day means every core habit done: ' + Hub.gamify.PERFECT_PARTS.join(", ") + '">' +
        '<div class="wh-streak__top">' + Hub.icon("flame") + '<span class="wh-streak__name">Perfect day</span></div>' +
        '<div class="wh-streak__val">' + p.current + "<small> d</small></div>" +
        '<div class="wh-streak__sub">best ' + p.best + "</div>" +
      "</div>"
    );
    return tiles.join("");
  }

  function miniBar(label, val, target, unit, color) {
    var p = Hub.pct(val, target);
    return '<div>' +
      '<div class="wh-row wh-row--between" style="gap:8px">' +
        '<span class="wh-sm">' + label + "</span>" +
        '<span class="mono wh-xs ' + (p >= 100 ? "" : "wh-faint") + '" ' +
          (p >= 100 ? 'style="color:var(--green-bright)"' : "") + ">" + val + "/" + target + " " + unit + "</span>" +
      "</div>" +
      '<div class="wh-bar" style="margin-top:4px"><div class="wh-bar__fill" style="width:' + p + "%;background:" +
        (p >= 100 ? "var(--green-bright)" : color) + '"></div></div>' +
    "</div>";
  }

  function quickTiles(d) {
    return quickActions().map(function (a) {
      return '<button type="button" class="wh-quickbtn' + (a.done(d) ? " is-done" : "") + '" ' +
          'data-quick="' + a.id + '" style="--wh-qc:' + a.color + '">' +
        '<span class="wh-quickbtn__ic">' + Hub.icon(a.icon) + "</span>" +
        '<span class="wh-grow"><span style="display:block">' + a.label + "</span>" +
        '<span class="wh-quickbtn__meta">' + a.meta(d) + "</span></span>" +
      "</button>";
    }).join("");
  }

  function recentBadges() {
    var earned = Hub.gamify.badgeState()
      .filter(function (b) { return b.unlocked; })
      .sort(function (a, b) { return new Date(b.at) - new Date(a.at); })
      .slice(0, 8);

    if (!earned.length) {
      return '<p class="wh-sm wh-faint">No badges yet — log anything at all and the first one is yours.</p>';
    }
    return '<div class="wh-badgestrip">' + earned.map(function (b) {
      return '<div class="wh-badgestrip__item" title="' + Hub.esc(b.badge.desc) + '">' +
        '<div class="wh-badgestrip__emoji">' + b.badge.emoji + "</div>" +
        '<div class="wh-badgestrip__name">' + Hub.esc(b.badge.name) + "</div>" +
        '<div class="wh-badgestrip__date">' + new Date(b.at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) + "</div>" +
      "</div>";
    }).join("") + "</div>";
  }

  /* The countdown block is repainted every second by the tick subscriber
     below, so it lives in its own function and its own container. */
  function paintNextReminder() {
    var host = document.getElementById("wh-next-reminder");
    if (!host) return;
    var n = Hub.reminders.next();

    if (!n) {
      host.innerHTML =
        '<p class="wh-sm wh-muted">No reminders are switched on yet.</p>' +
        '<button type="button" class="wh-btn wh-btn--primary wh-btn--sm wh-mt4" data-goto="settings">' +
          Hub.icon("bell") + "Set up reminders</button>" +
        '<p class="wh-help wh-mt4">Reminders run in this page, so they only fire while the tab is open.</p>';
      return;
    }
    var perm = Hub.notify.permission();
    host.innerHTML =
      '<div class="wh-nextrem">' +
        '<span class="wh-nextrem__time" id="wh-next-count">' + Hub.clock(n.inSec) + "</span>" +
        "<span>until <strong>" + Hub.esc(n.label) + "</strong></span>" +
      "</div>" +
      '<button type="button" class="wh-btn wh-btn--ghost wh-btn--sm wh-mt4" data-goto="' + n.view + '">Go there now</button>' +
      '<p class="wh-help wh-mt4">' +
        (perm === "granted"
          ? "Desktop notifications are on. They only fire while this tab is open."
          : "Showing in-app reminders only — enable desktop notifications in Settings.") +
      "</p>";
  }

  /* ---------- events ---------- */
  function wire(el) {
    var actions = {};
    quickActions().forEach(function (a) { actions[a.id] = a; });

    Hub.wireDateNav(el);

    Hub.delegate(el, "[data-quick]", function (btn) {
      var a = actions[btn.dataset.quick];
      if (a) a.run();
    });

    Hub.delegate(el, "[data-goto]", function (btn) { Hub.show(btn.dataset.goto); });
    if (Hub.adviceUI) Hub.adviceUI.wire(el);

    /* --- profile & suggestions --- */
    Hub.delegate(el, "[data-onboard]", function () { Hub.onboarding.start(); });
    Hub.delegate(el, "[data-onboard-skip]", function () {
      Hub.state.settings.profile.skipped = true;
      Hub.commit();
      Hub.toast("Hidden. Settings → Your profile has it whenever you want it.", "info", 4000);
    });
    Hub.delegate(el, "[data-sugg-apply]", function (btn) {
      if (Hub.onboarding.applyOne(btn.dataset.suggApply)) {
        Hub.toast("Done — change it any time in Settings.", "success", 3000);
      }
    });
    Hub.delegate(el, "[data-sugg-no]", function (btn) { Hub.onboarding.dismiss(btn.dataset.suggNo); });

    var tipBtn = el.querySelector("#wh-tip-next");
    if (tipBtn) tipBtn.addEventListener("click", function () {
      Hub.state.meta.tipIndex = (Hub.state.meta.tipIndex + 1) % TIPS.length;
      Hub.save();
      var t = document.getElementById("wh-tip-text");
      if (t) t.textContent = TIPS[Hub.state.meta.tipIndex];
    });
  }

  /* Update just the countdown digits each second — repainting the whole view
     once a second would fight the user's scroll position and focus. */
  Hub.onTick(function () {
    if (Hub.activeView() !== "dashboard") return;
    var out = document.getElementById("wh-next-count");
    var n = Hub.reminders.next();
    if (!out || !n) {
      /* The set of active reminders changed — repaint the whole block. */
      if ((!out) !== (!n)) paintNextReminder();
      return;
    }
    out.textContent = Hub.clock(n.inSec);
  });

  Hub.registerView("dashboard", render);
})();
