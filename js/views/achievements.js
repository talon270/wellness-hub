/* ============================================================================
   WELLNESS HUB · ACHIEVEMENTS
   ----------------------------------------------------------------------------
   The trophy case. Unlocked badges show in full colour with their unlock date;
   locked ones are desaturated and show how far along you are, so the next one
   always feels reachable rather than mysterious.

   Also surfaces every streak's current/best in one place.
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  function render(el) {
    var G = Hub.gamify;
    var all = G.badgeState();
    var unlocked = all.filter(function (b) { return b.unlocked; });
    var st = Hub.state.streaks || {};
    var t = G.totals();

    /* Group by category so the case reads as sections, not one long wall. */
    var groups = {};
    all.forEach(function (b) {
      (groups[b.badge.cat] = groups[b.badge.cat] || []).push(b);
    });
    var catOrder = ["General", "Fitness", "Eye care", "Dental", "Hydration", "Mindfulness", "Sleep", "Wellness"];
    var cats = catOrder.filter(function (c) { return groups[c]; })
      .concat(Object.keys(groups).filter(function (c) { return catOrder.indexOf(c) === -1; }));

    el.innerHTML =
      '<div class="wh-head">' +
        '<div class="wh-head__eyebrow">Achievements</div>' +
        "<h1>Trophy case</h1>" +
        "<p>" + unlocked.length + " of " + all.length + " badges earned. " +
        (unlocked.length === all.length
          ? "That's all of them. Genuinely impressive."
          : "The locked ones show how close you are.") + "</p>" +
      "</div>" +

      /* ---------- headline numbers ---------- */
      '<div class="wh-grid wh-grid--4 wh-mb4">' +
        stat("Badges", unlocked.length + "/" + all.length, "unlocked") +
        stat("Perfect days", t.perfectDays, "all core habits done") +
        stat("Best perfect run", (st.perfect && st.perfect.best) || 0, "consecutive days") +
        stat("Habits logged", t.totalLogs, "all time") +
      "</div>" +

      /* ---------- overall progress ---------- */
      '<div class="wh-card wh-mb4">' +
        '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("trophy") + "Collection progress</div>" +
          '<span class="wh-chip wh-chip--good">' + Hub.pct(unlocked.length, all.length) + "%</span></div>" +
        '<div class="wh-bar"><div class="wh-bar__fill" style="width:' + Hub.pct(unlocked.length, all.length) +
          '%;background:var(--green-bright)"></div></div>' +
      "</div>" +

      /* ---------- streak summary ---------- */
      '<div class="wh-card wh-mb4">' +
        '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("flame") + "Every streak</div></div>" +
        '<div class="wh-grid wh-grid--auto" style="gap:var(--wh-s3)">' +
          streakRows(st) +
        "</div>" +
      "</div>" +

      /* ---------- the case itself ---------- */
      cats.map(function (cat) {
        var got = groups[cat].filter(function (b) { return b.unlocked; }).length;
        return '<div class="wh-mt6">' +
          '<div class="wh-row wh-row--between wh-mb4">' +
            '<h2 class="wh-h2">' + Hub.esc(cat) + "</h2>" +
            '<span class="wh-chip' + (got === groups[cat].length ? " wh-chip--good" : "") + '">' +
              got + "/" + groups[cat].length + "</span>" +
          "</div>" +
          '<div class="wh-trophies">' + groups[cat].map(trophy).join("") + "</div>" +
        "</div>";
      }).join("");
  }

  function trophy(b) {
    return '<div class="wh-trophy ' + (b.unlocked ? "wh-trophy--unlocked" : "wh-trophy--locked") + '" ' +
        'title="' + Hub.esc(b.badge.desc) + '">' +
      '<span class="wh-trophy__emoji">' + (b.unlocked ? b.badge.emoji : "🔒") + "</span>" +
      '<div class="wh-trophy__name">' + Hub.esc(b.badge.name) + "</div>" +
      '<div class="wh-trophy__desc">' + Hub.esc(b.badge.desc) + "</div>" +
      (b.unlocked
        ? '<div class="wh-trophy__date">✓ ' + new Date(b.at).toLocaleDateString(undefined,
            { year: "numeric", month: "short", day: "numeric" }) + "</div>"
        : '<div class="wh-trophy__progress">' + Hub.esc(b.progress || "locked") + "</div>") +
    "</div>";
  }

  function stat(label, value, sub) {
    return '<div class="wh-stat"><div class="wh-stat__label">' + label + "</div>" +
      '<div class="wh-stat__value">' + value + "</div>" +
      '<div class="wh-stat__sub">' + sub + "</div></div>";
  }

  function streakRows(st) {
    var C = Hub.gamify.CATEGORIES;
    var rows = Object.keys(C).map(function (key) {
      return { key: key, label: C[key].label, color: C[key].color, s: st[key] || { current: 0, best: 0 } };
    });
    rows.unshift({ key: "perfect", label: "Perfect day", color: "var(--yellow-bright)", s: st.perfect || { current: 0, best: 0 } });

    return rows.map(function (r) {
      return '<div class="wh-row wh-row--between" style="padding:8px 0;border-bottom:1px solid var(--wh-line)">' +
        '<span class="wh-sm" style="color:' + r.color + '">' + Hub.esc(r.label) + "</span>" +
        '<span class="mono wh-sm">' + r.s.current + "<span class=\"wh-faint\"> now · " + r.s.best + " best</span></span>" +
      "</div>";
    }).join("");
  }

  Hub.registerView("achievements", render);
})();
