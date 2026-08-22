/* ============================================================================
   WELLNESS HUB · SETTINGS
   ----------------------------------------------------------------------------
   · Reminder switches, intervals and times (per category)
   · Hydration goal and cup size
   · Notification permission, with an honest explanation of what it can and
     can't do — see the "How reminders work" card
   · Backup: export everything (habits AND training) to one JSON file, and
     import it back
   · Reset, behind a typed confirmation step
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  var IRONFRAME_KEY = "ironframe.state.v1";   // the calisthenics app's own key

  /* Grouped so the reminder list reads by area rather than as a flat wall. */
  var REMINDER_GROUPS = [
    {
      title: "Eye care", icon: "eye",
      items: [{ key: "eye", name: "20-20-20 eye breaks",
                desc: "Look 20 feet away for 20 seconds, at a set interval.", type: "interval",
                min: 5, max: 120 }]
    },
    {
      title: "Hydration & posture", icon: "water",
      items: [
        { key: "hydration", name: "Water reminders",
          desc: "Spread across your waking hours rather than bunched up.", type: "interval", min: 15, max: 240 },
        { key: "posture", name: "Posture check-ins",
          desc: "A nudge to reset your position and screen height.", type: "interval", min: 15, max: 240 }
      ]
    },
    {
      title: "Desk & movement", icon: "stand",
      items: [
        { key: "stand", name: "Stand-up breaks",
          desc: "Get out of the chair. Defaults to weekdays only — set the days below if your week " +
                "looks different.", type: "interval", min: 10, max: 180 }
      ]
    },
    {
      title: "Dental", icon: "dental",
      items: [
        { key: "brushAM", name: "Morning brush", desc: "Fires once a day at this time.", type: "clock" },
        { key: "brushPM", name: "Evening brush", desc: "Fires once a day at this time.", type: "clock" },
        { key: "floss",   name: "Flossing",      desc: "Fires once a day at this time.", type: "clock" }
      ]
    },
    {
      title: "Body care", icon: "sun",
      items: [
        { key: "spf", name: "Sunscreen re-application",
          desc: "Interval-based — switch it on when you're outdoors, off when you're not.",
          type: "interval", min: 30, max: 240 },
        { key: "skinAM", name: "Morning skin routine", desc: "Fires once a day at this time.", type: "clock" },
        { key: "skinPM", name: "Evening skin routine", desc: "Fires once a day at this time.", type: "clock" }
      ]
    },
    {
      title: "Mobility & mind", icon: "stretchIc",
      items: [
        { key: "mobility", name: "Mobility session", desc: "A daily nudge to do ten minutes of joint work.", type: "clock" },
        { key: "mood",     name: "Mood check-in",    desc: "Best late enough to reflect on the whole day.", type: "clock" }
      ]
    },
    {
      title: "Medication & supplements", icon: "pill",
      items: [
        { key: "medsAM",   name: "Morning doses", desc: "Fires once a day at this time.", type: "clock" },
        { key: "medsNoon", name: "Midday doses",  desc: "For anything on the midday slot.", type: "clock" },
        { key: "medsPM",   name: "Evening doses", desc: "Fires once a day at this time.", type: "clock" },
        { key: "contraceptive", name: "Contraceptive pill",
          desc: "Separate from the general medication slots, because this is the one where being an " +
                "hour late actually matters. Fires even inside quiet hours.", type: "clock" }
      ]
    }
  ];

  var DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  /* ======================================================================
     RENDER
     ====================================================================== */
  function render(el) {
    var s = Hub.state;
    var perm = Hub.notify.permission();
    var canNotify = Hub.notify.availableHere();

    el.innerHTML =
      '<div class="wh-head">' +
        '<div class="wh-head__eyebrow">Settings</div>' +
        "<h1>Preferences &amp; data</h1>" +
        "<p>Everything is stored in this browser only. No account, no server, nothing leaves your machine.</p>" +
      "</div>" +

      /* ---------- who's using this ---------- */
      profileCard() +

      /* ---------- palette ---------- */
      themeCard() +

      /* ---------- how reminders work ---------- */
      '<div class="wh-card wh-mb4">' +
        '<div class="wh-card__head">' +
          '<div class="wh-card__title">' + Hub.icon("bell") + "How reminders work</div>" +
          '<span class="wh-chip ' + permChipClass(perm, canNotify) + '">' + permLabel(perm, canNotify) + "</span>" +
        "</div>" +
        '<p class="wh-sm wh-muted"><strong>Reminders only fire while this tab is open.</strong> The tab can be ' +
          "in the background, and the window can be minimised — but if you close the tab or quit the browser, " +
          "reminders stop until you open the page again. This is a static page with no server behind it, so " +
          "there's nothing to push notifications from when it isn't running.</p>" +
        (canNotify
          ? (perm === "granted"
              ? '<p class="wh-sm wh-mt4" style="color:var(--green-bright)">' + Hub.icon("check") +
                " Desktop notifications are allowed. You'll also see an in-app toast for every reminder.</p>"
              : '<div class="wh-row wh-mt4">' +
                '<button type="button" class="wh-btn wh-btn--primary" id="st-perm">' + Hub.icon("bell") +
                  "Enable desktop notifications</button>" +
                '<span class="wh-help">' + (perm === "denied"
                  ? "Currently blocked — you'll need to re-allow it from the padlock icon in the address bar."
                  : "We'll explain what happens before your browser asks.") + "</span></div>")
          : '<div class="wh-disclaimer wh-mt4">' + Hub.icon("alert") +
            "<span>This page is open directly from disk (<code class='mono'>file://</code>), and browsers only " +
            "permit desktop notifications on secure origins. <strong>In-app reminders still work</strong> — you'll " +
            "get a toast in the corner instead. To get real desktop notifications, serve the folder locally: " +
            "<code class='mono'>python3 -m http.server</code> then open <code class='mono'>http://localhost:8000</code>." +
            "</span></div>") +
      "</div>" +

      /* ---------- install / offline ---------- */
      appCard() +

      /* ---------- reminders when the app is closed ---------- */
      '<div class="wh-card wh-mb4">' +
        '<div class="wh-card__head">' +
          '<div class="wh-card__title">' + Hub.icon("calendar") + "Reminders when the app is closed</div>" +
        "</div>" +
        '<p class="wh-sm wh-muted">No web app can notify you while it isn\'t running — there\'s no reliable ' +
          "scheduled-notification API. The practical fix is to hand your <strong>daily, clock-based</strong> " +
          "reminders to the calendar your system already nags you through.</p>" +
        '<p class="wh-sm wh-muted wh-mt4">This exports them as a standard <code class="mono">.ics</code> file. ' +
          "Import it once and those reminders fire whether or not this app is open. Upcoming check-ups come " +
          "along too, with a day's warning.</p>" +
        '<div class="wh-row wh-mt4">' +
          '<button type="button" class="wh-btn wh-btn--primary" id="st-ics">' +
            Hub.icon("download") + "Export reminders (.ics)</button>" +
          '<span class="wh-help">' + clockReminderCount() + " daily " +
            Hub.plural(clockReminderCount(), "reminder") + " enabled</span>" +
        "</div>" +
        '<p class="wh-help wh-mt4">Interval reminders (eye breaks, sunscreen) aren\'t exported — a calendar ' +
          "entry every 20 minutes would be unusable, and those only make sense while you're actually at a screen.</p>" +
      "</div>" +

      /* ---------- quiet hours ---------- */
      quietCard() +

      /* ---------- reminder switches ---------- */
      REMINDER_GROUPS.map(function (g) {
        return '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon(g.icon) + Hub.esc(g.title) + "</div></div>" +
          g.items.map(function (item) { return reminderRow(item, s.settings.reminders[item.key]); }).join("") +
        "</div>";
      }).join("") +

      /* ---------- how the app counts ---------- */
      countingCard() +

      /* ---------- your own habits ---------- */
      habitsCard() +

      /* ---------- goals ---------- */
      '<div class="wh-card wh-mb4">' +
        '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("water") + "Daily goals</div></div>" +

        '<div class="wh-setrow">' +
          '<div class="wh-setrow__info">' +
            '<div class="wh-setrow__name">Hydration goal</div>' +
            '<div class="wh-setrow__desc">Cups per day. Roughly ' +
              ((s.settings.hydrationGoalCups * s.settings.cupSizeMl) / 1000).toFixed(1) + "L at your current cup size.</div>" +
          "</div>" +
          '<div class="wh-setrow__ctl">' +
            '<input class="wh-input" type="number" id="st-goal" min="1" max="30" step="1" value="' +
              s.settings.hydrationGoalCups + '" aria-label="Hydration goal in cups" />' +
            '<span class="wh-help">cups</span>' +
          "</div>" +
        "</div>" +

        '<div class="wh-setrow">' +
          '<div class="wh-setrow__info">' +
            '<div class="wh-setrow__name">Sleep target</div>' +
            '<div class="wh-setrow__desc">What the sleep balance is measured against. Most adults land ' +
              "between 7 and 9 hours; use what leaves you functional, not a round number.</div>" +
          "</div>" +
          '<div class="wh-setrow__ctl">' +
            '<input class="wh-input" type="number" id="st-sleep" min="4" max="12" step="0.5" value="' +
              (s.settings.sleepTargetHours || 8) + '" aria-label="Sleep target in hours" />' +
            '<span class="wh-help">hours</span>' +
          "</div>" +
        "</div>" +

        '<div class="wh-setrow">' +
          '<div class="wh-setrow__info">' +
            '<div class="wh-setrow__name">Cup size</div>' +
            '<div class="wh-setrow__desc">Used only to show your intake in litres.</div>' +
          "</div>" +
          '<div class="wh-setrow__ctl">' +
            '<input class="wh-input" type="number" id="st-cup" min="50" max="1000" step="10" value="' +
              s.settings.cupSizeMl + '" aria-label="Cup size in millilitres" />' +
            '<span class="wh-help">ml</span>' +
          "</div>" +
        "</div>" +

        '<div class="wh-setrow">' +
          '<div class="wh-setrow__info">' +
            '<div class="wh-setrow__name">Your name</div>' +
            '<div class="wh-setrow__desc">Only used for the dashboard greeting. Leave blank to skip it.</div>' +
          "</div>" +
          '<div class="wh-setrow__ctl">' +
            '<input class="wh-input" type="text" id="st-name" maxlength="24" value="' +
              Hub.esc(s.settings.name || "") + '" placeholder="optional" aria-label="Your name" style="width:150px" />' +
          "</div>" +
        "</div>" +

        '<div class="wh-setrow">' +
          '<div class="wh-setrow__info">' +
            '<div class="wh-setrow__name">Sound &amp; vibration cues</div>' +
            '<div class="wh-setrow__desc">Chimes on timer phase changes and completions, plus a buzz on devices ' +
              "that support it.</div>" +
          "</div>" +
          '<div class="wh-setrow__ctl">' +
            '<label class="wh-switch"><input type="checkbox" id="st-sound"' + (s.settings.sound ? " checked" : "") + " />" +
            '<span class="wh-switch__track"></span></label>' +
          "</div>" +
        "</div>" +
      "</div>" +

      /* ---------- durable storage ---------- */
      durabilityCard() +

      /* ---------- backup ---------- */
      '<div class="wh-card wh-mb4">' +
        '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("download") + "Manual backup</div></div>" +
        '<p class="wh-sm wh-muted">A one-off snapshot file containing <strong>everything</strong>: habits, ' +
          "streaks, badges, health records and your training data.</p>" +
        '<div class="wh-row wh-mt4">' +
          '<button type="button" class="wh-btn wh-btn--primary" id="st-export">' + Hub.icon("download") + "Export all data</button>" +
          '<button type="button" class="wh-btn" id="st-import">' + Hub.icon("upload") + "Import from file</button>" +
          '<input type="file" id="st-file" accept="application/json,.json" hidden />' +
        "</div>" +
        '<p class="wh-help wh-mt4">Importing replaces everything currently stored. Export first if you\'re unsure. ' +
          "Photos are included in the export and restored with it.</p>" +
      "</div>" +

      /* ---------- spreadsheet export ---------- */
      '<div class="wh-card wh-mb4">' +
        '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("grid") + "Export as a spreadsheet</div></div>" +
        '<p class="wh-sm wh-muted">JSON is the honest backup format, but nobody opens JSON. These are ' +
          "the same data as CSV — one row per day, or per reading — for a spreadsheet, or for a clinician " +
          "who wants the numbers rather than a screenshot.</p>" +
        '<div class="wh-row wh-mt4">' +
          '<button type="button" class="wh-btn wh-btn--sm" data-csv="days">' + Hub.icon("download") + "Daily habits</button>" +
          '<button type="button" class="wh-btn wh-btn--sm" data-csv="vitals">' + Hub.icon("download") + "Vitals</button>" +
          '<button type="button" class="wh-btn wh-btn--sm" data-csv="sleep">' + Hub.icon("download") + "Sleep</button>" +
          '<button type="button" class="wh-btn wh-btn--sm" data-csv="labs">' + Hub.icon("download") + "Lab results</button>" +
          (s.settings.cycleTracking
            ? '<button type="button" class="wh-btn wh-btn--sm" data-csv="cycles">' + Hub.icon("download") +
              "Cycles</button>"
            : "") +
        "</div>" +
        '<p class="wh-help wh-mt4">Vitals are exported in your currently selected units (' +
          Hub.units.massLabel() + " · " + Hub.units.lenLabel() + " · " + Hub.units.tempLabel() +
          "), with the unit named in each column header.</p>" +
      "</div>" +

      /* ---------- storage snapshot ---------- */
      '<div class="wh-card wh-mb4">' +
        '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("info") + "Your data</div></div>" +
        '<div class="wh-grid wh-grid--4" style="gap:var(--wh-s3)">' +
          miniStat("Days logged", Hub.dayKeys().length) +
          miniStat("Sleep entries", (s.logs.sleep || []).length) +
          miniStat("Vitals readings", (s.logs.vitals || []).length) +
          miniStat("Badges", Object.keys(s.badges).length) +
          miniStat("Check-ups", (s.logs.checkups || []).length) +
          miniStat("Meds tracked", (s.logs.meds || []).length) +
          miniStat("Mood check-ins", Hub.gamify.totals().moodLogs) +
          miniStat("Storage", storageSize()) +
        "</div>" +
        '<p class="wh-help wh-mt4 mono">Keys: ' + Hub.STORAGE_KEY + " · " + IRONFRAME_KEY + "</p>" +
      "</div>" +

      /* ---------- danger zone ---------- */
      '<div class="wh-card wh-danger-zone">' +
        '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("alert") + "Reset</div></div>" +
        '<div class="wh-setrow">' +
          '<div class="wh-setrow__info">' +
            '<div class="wh-setrow__name">Reset habit data</div>' +
            '<div class="wh-setrow__desc">Wipes all habit logs, streaks and badges. Leaves your training ' +
              "records in the Fitness tab untouched.</div>" +
          "</div>" +
          '<div class="wh-setrow__ctl">' +
            '<button type="button" class="wh-btn wh-btn--danger wh-btn--sm" id="st-reset-hub">Reset habits</button>' +
          "</div>" +
        "</div>" +
        '<div class="wh-setrow">' +
          '<div class="wh-setrow__info">' +
            '<div class="wh-setrow__name">Reset everything</div>' +
            '<div class="wh-setrow__desc">Wipes habits <em>and</em> all training data, then reloads the app as ' +
              "a fresh install. This cannot be undone.</div>" +
          "</div>" +
          '<div class="wh-setrow__ctl">' +
            '<button type="button" class="wh-btn wh-btn--danger wh-btn--sm" id="st-reset-all">Reset everything</button>' +
          "</div>" +
        "</div>" +
      "</div>" +

      '<p class="wh-help wh-mt6 mono">Wellness Hub · schema v' + Hub.SCHEMA_VERSION + "</p>";

    wire(el);
  }

  /* ---------- fragments ---------- */

  /* ---------- the palette ----------------------------------------------
     Swatches are drawn from the values in js/theme.js rather than from CSS,
     because a custom property only ever reports the theme currently applied —
     four of the five previews would otherwise all paint the active palette. */
  function themeCard() {
    if (!Hub.theme) return "";
    var cur = Hub.theme.active();

    return '<div class="wh-card wh-mb4">' +
      '<div class="wh-card__head">' +
        '<div class="wh-card__title">' + Hub.icon("sun") + "Palette</div>" +
        '<span class="wh-chip">' + Hub.esc(Hub.theme.label(cur)) + "</span>" +
      "</div>" +
      '<p class="wh-sm wh-muted">Applies straight away, across every tab including Fitness. Kept in this ' +
        "browser only — it isn't part of your records, so a backup won't carry it and a reset won't clear it.</p>" +
      '<div class="wh-themes wh-mt4" role="radiogroup" aria-label="Colour palette">' +
        Hub.theme.list().map(function (t) {
          var on = t.id === cur;
          return '<button type="button" class="wh-theme' + (on ? " is-active" : "") + '" ' +
              'data-theme-pick="' + t.id + '" role="radio" aria-checked="' + on + '">' +
            '<span class="wh-theme__prev" style="background:' + t.bg + '" aria-hidden="true">' +
              '<span class="wh-theme__surface" style="background:' + t.surface + '">' +
                '<span class="wh-theme__dots">' +
                  t.dots.map(function (d) { return '<i style="background:' + d + '"></i>'; }).join("") +
                "</span>" +
                '<span class="wh-theme__rule" style="background:' + t.text + '"></span>' +
                '<span class="wh-theme__rule wh-theme__rule--short" style="background:' + t.text + '"></span>' +
              "</span>" +
            "</span>" +
            '<span class="wh-theme__name">' + Hub.esc(t.label) + "</span>" +
            '<span class="wh-theme__note">' + Hub.esc(t.note) + "</span>" +
          "</button>";
        }).join("") +
      "</div>" +
      '<p class="wh-help wh-mt4">' + Hub.icon("info") +
        " Each palette assigns its own colour to every section, spaced far enough apart that no two tabs " +
        "read as the same. Charts and the muscle heat map follow along." +
      "</p>" +
    "</div>";
  }

  /* ---------- your profile, and what it suggested ---------- */
  var GENDER_LABELS = { female: "Female", male: "Male", other: "Other" };
  var WORK_LABELS = { desk: "Desk-based", mixed: "A bit of both", active: "On my feet" };

  function profileCard() {
    if (!Hub.onboarding) return "";
    var p = Hub.state.settings.profile;
    var age = Hub.onboarding.age();
    var pend = Hub.onboarding.pending();
    var dismissed = Object.keys(Hub.state.settings.dismissedSuggestions || {}).length;

    var facts = [
      ["Name", Hub.state.settings.name || "—"],
      ["Age", age == null ? "not given" : age + " (born " + p.birthYear + ")"],
      ["Gender", GENDER_LABELS[p.gender] || "not given"],
      ["Work", WORK_LABELS[p.workStyle] || "not given"],
      ["Seated", p.sittingHours == null ? "not given" : p.sittingHours + " h/day"],
      ["Day", (p.wakeTime || "—") + " → " + (p.bedTime || "—")],
      ["Goals", (p.goals || []).length
        ? (p.goals || []).map(function (g) {
            var def = Hub.onboarding.GOALS.filter(function (x) { return x.key === g; })[0];
            return def ? def.label : g;
          }).join(", ")
        : "none picked"]
    ];

    return '<div class="wh-card wh-mb4">' +
      '<div class="wh-card__head">' +
        '<div class="wh-card__title">' + Hub.icon("idCard") + "Your profile</div>" +
        '<span class="wh-chip' + (p.completedAt ? "" : " wh-chip--warn") + '">' +
          (p.completedAt ? "set up" : "not set up") + "</span>" +
      "</div>" +
      '<p class="wh-sm wh-muted">What the app knows about who\'s using it. It decides which reminders get ' +
        "suggested and at what times, whether the Reproductive Health tab appears, and which monthly " +
        "self-check it prompts for — and nothing else. Every module stays reachable whatever is in here, " +
        "and each switch it sets is one you can see and reverse below.</p>" +

      '<div class="wh-loglist wh-mt4">' + facts.map(function (f) {
        return '<div class="wh-logrow">' +
          '<span class="wh-logrow__date" style="min-width:96px">' + f[0] + "</span>" +
          '<span class="wh-logrow__main">' + Hub.esc(String(f[1])) + "</span></div>";
      }).join("") + "</div>" +

      '<div class="wh-row wh-mt4">' +
        '<button type="button" class="wh-btn wh-btn--primary" id="st-profile">' + Hub.icon("edit") +
          (p.completedAt ? "Edit profile" : "Set up now") + "</button>" +
        (dismissed
          ? '<button type="button" class="wh-btn wh-btn--ghost wh-btn--sm" id="st-sugg-reset">' +
            "Bring back " + dismissed + " dismissed " + Hub.plural(dismissed, "suggestion") + "</button>"
          : "") +
      "</div>" +

      (pend.length
        ? '<div class="wh-h3 wh-mt6 wh-mb4">Suggestions you haven\'t acted on</div>' +
          '<div class="wh-stack wh-stack--sm">' + pend.map(function (sg) {
            return '<div class="wh-logrow" style="align-items:flex-start;gap:var(--wh-s3)">' +
              '<span class="wh-grow"><strong class="wh-sm">' + Hub.esc(sg.title) + "</strong>" +
                '<span class="wh-xs wh-faint" style="display:block">' + Hub.esc(sg.why) + "</span></span>" +
              '<span class="wh-row" style="gap:var(--wh-s2)">' +
                '<button type="button" class="wh-btn wh-btn--sm wh-btn--primary" data-sugg-apply="' + sg.id + '">Turn on</button>' +
                '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" data-sugg-no="' + sg.id +
                  '" aria-label="Dismiss">' + Hub.icon("x") + "</button>" +
              "</span></div>";
          }).join("") + "</div>"
        : "") +

      '<p class="wh-help wh-mt4">Stored in this browser with everything else. Clearing the profile is ' +
        "part of Reset, and it's included in a backup.</p>" +
    "</div>";
  }

  /* How many clock-based reminders are on — the ones .ics export can carry. */
  function clockReminderCount() {
    var meta = Hub.reminders.meta;
    return Object.keys(meta).filter(function (k) {
      var cfg = Hub.state.settings.reminders[k];
      return meta[k].kind === "clock" && cfg && cfg.enabled;
    }).length;
  }

  /* ---------- quiet hours ---------- */
  function quietCard() {
    var q = Hub.state.settings.quietHours || {};
    return '<div class="wh-card wh-mb4">' +
      '<div class="wh-card__head">' +
        '<div class="wh-card__title">' + Hub.icon("moon") + "Quiet hours</div>" +
        '<span class="wh-chip' + (q.enabled ? " wh-chip--good" : "") + '">' +
          (q.enabled ? q.from + " – " + q.to : "off") + "</span>" +
      "</div>" +
      '<p class="wh-sm wh-muted">Interval reminders — eye breaks, water, posture, sunscreen — stay ' +
        "silent inside this window. Without it, an app left open overnight will nudge you for water at " +
        "three in the morning.</p>" +
      '<p class="wh-sm wh-muted wh-mt4">Reminders you set for a <strong>specific time</strong> still fire, ' +
        "even inside the window. A 22:00 skin routine set deliberately for 22:00 is an instruction, not " +
        "an accident.</p>" +
      '<div class="wh-setrow wh-mt4">' +
        '<div class="wh-setrow__info"><div class="wh-setrow__name">Silence interval reminders</div>' +
          '<div class="wh-setrow__desc">Between these times, every day.</div></div>' +
        '<div class="wh-setrow__ctl">' +
          '<input class="wh-input" type="time" id="st-quiet-from" value="' + Hub.esc(q.from || "22:00") + '" ' +
            'aria-label="Quiet hours start" />' +
          '<span class="wh-help">to</span>' +
          '<input class="wh-input" type="time" id="st-quiet-to" value="' + Hub.esc(q.to || "07:00") + '" ' +
            'aria-label="Quiet hours end" />' +
          '<label class="wh-switch"><input type="checkbox" id="st-quiet"' + (q.enabled ? " checked" : "") + " />" +
          '<span class="wh-switch__track"></span></label>' +
        "</div>" +
      "</div>" +
      '<div class="wh-setrow">' +
        '<div class="wh-setrow__info"><div class="wh-setrow__name">Snooze length</div>' +
          '<div class="wh-setrow__desc">How long the Snooze button on a reminder waits before it ' +
            "comes back.</div></div>" +
        '<div class="wh-setrow__ctl">' +
          '<input class="wh-input" type="number" id="st-snooze" min="1" max="180" step="5" value="' +
            (Hub.state.settings.snoozeMin || 15) + '" aria-label="Snooze minutes" />' +
          '<span class="wh-help">min</span>' +
        "</div>" +
      "</div>" +
    "</div>";
  }

  /* ---------- day boundary, units, grace, cadence ---------- */
  function countingCard() {
    var s = Hub.state.settings;
    var G = Hub.gamify;
    var start = Number(s.dayStartHour) || 0;

    var cadenceRows = G.cadenceCandidates().map(function (key) {
      var cat = G.CATEGORIES[key];
      if (!cat || cat.custom) return "";      // custom habits set their own
      var cad = G.cadenceFor(key);
      return '<div class="wh-setrow">' +
        '<div class="wh-setrow__info">' +
          '<div class="wh-setrow__name">' + Hub.icon(cat.icon) + " " + Hub.esc(cat.label) + "</div>" +
        "</div>" +
        '<div class="wh-setrow__ctl">' +
          '<select class="wh-input" data-cadence="' + key + '" aria-label="' + Hub.esc(cat.label) + ' cadence">' +
            '<option value="daily"' + (cad.type === "daily" ? " selected" : "") + ">Every day</option>" +
            [1, 2, 3, 4, 5, 6].map(function (n) {
              return '<option value="' + n + '"' +
                (cad.type === "weekly" && cad.perWeek === n ? " selected" : "") + ">" +
                n + "× a week</option>";
            }).join("") +
          "</select>" +
        "</div>" +
      "</div>";
    }).join("");

    return '<div class="wh-card wh-mb4">' +
      '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("clockIc") +
        "How the app counts</div></div>" +

      /* --- day boundary --- */
      '<div class="wh-setrow">' +
        '<div class="wh-setrow__info">' +
          '<div class="wh-setrow__name">My day starts at</div>' +
          '<div class="wh-setrow__desc">Anything logged before this hour counts toward the previous ' +
            "day. If you train at 11pm and log it at half past midnight, set this to 3 or 4 and that " +
            "session lands on the day you actually did it.</div>" +
        "</div>" +
        '<div class="wh-setrow__ctl">' +
          '<select class="wh-input" id="st-daystart" aria-label="Hour the day rolls over">' +
            [0, 1, 2, 3, 4, 5, 6].map(function (h) {
              return '<option value="' + h + '"' + (start === h ? " selected" : "") + ">" +
                (h === 0 ? "Midnight" : String(h).padStart(2, "0") + ":00") + "</option>";
            }).join("") +
          "</select>" +
        "</div>" +
      "</div>" +
      (start > 0
        ? '<p class="wh-help">Right now it\'s ' + Hub.prettyDate(Hub.today()) +
          " as far as your logs are concerned.</p>"
        : "") +

      /* --- units --- */
      '<div class="wh-setrow">' +
        '<div class="wh-setrow__info">' +
          '<div class="wh-setrow__name">Units</div>' +
          '<div class="wh-setrow__desc">Changes what you type and what you see. Everything is stored ' +
            "in metric either way, so switching can never alter a reading you already saved.</div>" +
        "</div>" +
        '<div class="wh-setrow__ctl">' +
          '<div class="wh-seg">' +
            '<button type="button" class="wh-seg__btn' + (s.units !== "imperial" ? " is-on" : "") +
              '" data-units="metric">kg · cm · °C</button>' +
            '<button type="button" class="wh-seg__btn' + (s.units === "imperial" ? " is-on" : "") +
              '" data-units="imperial">lb · in · °F</button>' +
          "</div>" +
        "</div>" +
      "</div>" +

      /* --- grace days --- */
      '<div class="wh-setrow">' +
        '<div class="wh-setrow__info">' +
          '<div class="wh-setrow__name">Grace days each month</div>' +
          '<div class="wh-setrow__desc">Missed days a streak may survive per calendar month. The day ' +
            "still doesn't count as done — the streak just doesn't reset to zero. Set it to 0 for the " +
            "strict version.</div>" +
        "</div>" +
        '<div class="wh-setrow__ctl">' +
          '<input class="wh-input" type="number" id="st-grace" min="0" max="10" step="1" value="' +
            (s.graceDaysPerMonth == null ? 1 : s.graceDaysPerMonth) + '" aria-label="Grace days per month" />' +
          '<span class="wh-help">days</span>' +
        "</div>" +
      "</div>" +

      /* --- desk & movement --- */
      '<div class="wh-setrow">' +
        '<div class="wh-setrow__info">' +
          '<div class="wh-setrow__name">Stand breaks a day</div>' +
          '<div class="wh-setrow__desc">What the Desk tab counts as a full day, and what the stand-break ' +
            "streak is judged on. Eight is roughly one an hour across a working day.</div>" +
        "</div>" +
        '<div class="wh-setrow__ctl">' +
          '<input class="wh-input" type="number" id="st-standgoal" min="1" max="24" step="1" value="' +
            (s.standGoal || 8) + '" aria-label="Stand breaks per day" />' +
          '<span class="wh-help">breaks</span>' +
        "</div>" +
      "</div>" +

      '<div class="wh-setrow">' +
        '<div class="wh-setrow__info">' +
          '<div class="wh-setrow__name">Nudge me after sitting for</div>' +
          '<div class="wh-setrow__desc">How long one unbroken sitting session can run before the sitting ' +
            "clock says something. Only applies while that clock is actually running.</div>" +
        "</div>" +
        '<div class="wh-setrow__ctl">' +
          '<input class="wh-input" type="number" id="st-sitalert" min="15" max="180" step="5" value="' +
            (s.sitAlertMin || 45) + '" aria-label="Sitting alert threshold in minutes" />' +
          '<span class="wh-help">min</span>' +
        "</div>" +
      "</div>" +

      /* --- cycle tracking --- */
      '<div class="wh-setrow">' +
        '<div class="wh-setrow__info">' +
          '<div class="wh-setrow__name">Cycle tracking</div>' +
          '<div class="wh-setrow__desc">Period, flow and symptom logging on the Reproductive Health tab, ' +
            "and cycle day in the Insights patterns. Your entries are kept if you switch it off again.</div>" +
        "</div>" +
        '<div class="wh-setrow__ctl">' +
          '<label class="wh-switch"><input type="checkbox" id="st-cycle"' +
            (s.cycleTracking ? " checked" : "") + " />" +
          '<span class="wh-switch__track"></span></label>' +
        "</div>" +
      "</div>" +

      /* --- the reproductive health tab --- */
      '<div class="wh-setrow">' +
        '<div class="wh-setrow__info">' +
          '<div class="wh-setrow__name">Reproductive Health tab</div>' +
          '<div class="wh-setrow__desc">Cycle, the monthly self-check, age-related screening and ' +
            "contraception. Follows your profile by default" +
            (s.reproTab == null
              ? " — currently " + (Hub.reproTabVisible() ? "shown" : "hidden") + ", because your profile " +
                (s.profile && s.profile.gender ? "records a gender" : "doesn't record a gender") + "."
              : ", but you've set it explicitly.") + "</div>" +
        "</div>" +
        '<div class="wh-setrow__ctl">' +
          '<select class="wh-input" id="st-repro" aria-label="Reproductive health tab visibility">' +
            '<option value="auto"' + (s.reproTab == null ? " selected" : "") + ">Follow my profile</option>" +
            '<option value="on"' + (s.reproTab === true ? " selected" : "") + ">Always show</option>" +
            '<option value="off"' + (s.reproTab === false ? " selected" : "") + ">Always hide</option>" +
          "</select>" +
        "</div>" +
      "</div>" +

      /* --- cadence --- */
      '<div class="wh-h3 wh-mt6 wh-mb4">How often each habit should happen</div>' +
      '<p class="wh-sm wh-muted wh-mb4">Not everything is a daily habit. A weekly cadence counts ' +
        "consecutive <em>weeks</em> that hit the target, and the current week is never treated as failed " +
        "while it's still running.</p>" +
      cadenceRows +
    "</div>";
  }

  /* ---------- custom habits ---------- */
  function habitsCard() {
    var list = Hub.state.logs.customHabits || [];
    return '<div class="wh-card wh-mb4">' +
      '<div class="wh-card__head">' +
        '<div class="wh-card__title">' + Hub.icon("star") + "Your own habits</div>" +
        '<span class="wh-chip">' + list.length + " defined</span>" +
      "</div>" +
      '<p class="wh-sm wh-muted">Anything this app doesn\'t already track. Habits you add get the same ' +
        "streaks, heatmap, grace days and weekly review as everything built in.</p>" +
      (list.length
        ? '<div class="wh-stack wh-stack--sm wh-mt4">' + list.map(function (h) {
            var cad = h.cadence && h.cadence.type === "weekly"
              ? h.cadence.perWeek + "× a week" : "daily";
            return '<div class="wh-logrow">' +
              '<span style="color:' + (h.color || "var(--wh-accent)") + '">' + Hub.icon(h.icon || "check") + "</span>" +
              '<span class="wh-logrow__main">' + Hub.esc(h.name) + "</span>" +
              '<span class="wh-xs wh-faint">' + cad + (h.active === false ? " · paused" : "") + "</span>" +
            "</div>";
          }).join("") + "</div>"
        : "") +
      '<button type="button" class="wh-btn wh-btn--primary wh-mt4" id="st-habits">' +
        Hub.icon("star") + (list.length ? "Manage habits" : "Add your first habit") + "</button>" +
    "</div>";
  }

  /* The install / offline card. Says plainly what installing does and, just as
     importantly, what it doesn't. */
  function appCard() {
    var st = Hub.pwa ? Hub.pwa.status() : { supported: false, protocol: location.protocol };

    var badge, body;

    if (st.installed) {
      badge = '<span class="wh-chip wh-chip--good">installed</span>';
      body =
        '<p class="wh-sm" style="color:var(--green-bright)">' + Hub.icon("check") +
          " Running as an installed app — its own window, launched from your app menu.</p>" +
        '<p class="wh-sm wh-muted wh-mt4">The whole app is cached locally, so it opens instantly and works ' +
          "with no network at all.</p>";
    } else if (!st.supported) {
      badge = '<span class="wh-chip wh-chip--warn">not available here</span>';
      body =
        '<div class="wh-disclaimer">' + Hub.icon("alert") +
          "<span>You've opened this straight from disk (<code class='mono'>file://</code>), and browsers only " +
          "allow apps to be installed from a served origin. Serve the folder and this becomes installable:" +
          "<br><code class='mono'>python3 -m http.server 8777</code> then open " +
          "<code class='mono'>http://localhost:8777</code>." +
          "<br><br>See <code class='mono'>tools/</code> in this folder for a one-command setup that starts " +
          "the server automatically at login.</span></div>";
    } else if (st.canInstall) {
      badge = '<span class="wh-chip wh-chip--accent">ready to install</span>';
      body =
        '<p class="wh-sm wh-muted">Install it and you get an icon in your app menu, its own window with no ' +
          "browser chrome, and the whole app cached for offline use. Same data, same storage — it's the same " +
          "app, just not living in a tab.</p>" +
        '<button type="button" class="wh-btn wh-btn--primary wh-mt4" id="st-install">' +
          Hub.icon("download") + "Install Wellness Hub</button>";
    } else {
      badge = st.offlineReady
        ? '<span class="wh-chip wh-chip--good">offline ready</span>'
        : '<span class="wh-chip">caching…</span>';
      body =
        '<p class="wh-sm wh-muted">' +
          (st.offlineReady
            ? "The app is cached locally and will open with no network."
            : "Caching the app for offline use — this finishes in the background.") +
          "</p>" +
        '<p class="wh-help wh-mt4">To install it as a standalone app, use your browser\'s menu — in Chrome ' +
          'that\'s <strong>⋮ → Cast, save and share → Install page as app</strong>. If you don\'t see it, the ' +
          "browser may have already installed it, or may not support installing from this origin.</p>";
    }

    return '<div class="wh-card wh-mb4">' +
      '<div class="wh-card__head">' +
        '<div class="wh-card__title">' + Hub.icon("dashboard") + "App &amp; offline</div>" + badge +
      "</div>" + body +
      (st.updateWaiting
        ? '<button type="button" class="wh-btn wh-btn--primary wh-mt4" id="st-update">' +
          Hub.icon("refresh") + "A new version is ready — reload</button>"
        : "") +
      (st.supported
        ? '<div class="wh-row wh-mt6"><button type="button" class="wh-btn wh-btn--ghost wh-btn--sm" id="st-recache">' +
          Hub.icon("refresh") + "Clear offline cache</button>" +
          '<span class="wh-help">Use this if the app seems stuck on an old version.</span></div>'
        : "") +
      '<p class="wh-help wh-mt4">' + Hub.icon("info") +
        " Installing does <strong>not</strong> make reminders fire while the app is closed — see the card below." +
      "</p>" +
    "</div>";
  }

  /* Storage durability: eviction protection + the linked backup file.
     Rendered synchronously from cached values; the async bits (persisted?,
     quota) fill themselves in via `refreshDurability` once resolved. */
  function durabilityCard() {
    var st = Hub.storage ? Hub.storage.status() : { fsSupported: false, linked: false };

    var linkBlock;
    if (!st.fsSupported) {
      linkBlock =
        '<div class="wh-disclaimer">' + Hub.icon("info") +
          "<span>Your browser doesn't support linking a file that updates itself " +
          "(that's Chrome, Edge and Opera only for now). Use <strong>Export all data</strong> below " +
          "instead — the app will remind you if it's been a while.</span></div>" +
        (st.lastDownload
          ? '<p class="wh-help wh-mt4">Last manual backup: <strong class="mono">' +
            Hub.relDay(Hub.ymd(new Date(st.lastDownload))) + "</strong></p>"
          : '<p class="wh-help wh-mt4">No manual backup taken yet.</p>');
    } else if (st.linked) {
      linkBlock =
        '<div class="wh-row wh-row--between">' +
          '<div class="wh-grow"><div class="wh-setrow__name">' + Hub.icon("check") +
            " Linked to <span class=\"mono\">" + Hub.esc(st.fileName || "a file") + "</span></div>" +
            '<div class="wh-setrow__desc">Rewritten automatically a few seconds after anything changes. ' +
              (st.lastWrite
                ? "Last written " + new Date(st.lastWrite).toLocaleString() + "."
                : "Not written yet this session.") + "</div></div>" +
        "</div>" +
        (st.lastError === "permission-needed"
          ? '<div class="wh-disclaimer wh-mt4">' + Hub.icon("alert") +
            "<span>The browser has dropped write permission for that file — that happens after a restart. " +
            "Click <strong>Reconnect</strong> to grant it again.</span></div>" +
            '<button type="button" class="wh-btn wh-btn--primary wh-mt4" id="st-reconnect">Reconnect file</button>'
          : "") +
        '<div class="wh-row wh-mt4">' +
          '<button type="button" class="wh-btn wh-btn--sm" id="st-writenow">' + Hub.icon("download") + "Write now</button>" +
          '<button type="button" class="wh-btn wh-btn--sm" id="st-restorefile">' + Hub.icon("upload") + "Restore from it</button>" +
          '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" id="st-unlink">Unlink</button>' +
        "</div>";
    } else {
      linkBlock =
        '<p class="wh-sm wh-muted">Pick a file once — ideally somewhere already synced or backed up — and ' +
          "the app keeps it up to date by itself. If this browser's data is ever cleared, it offers to " +
          "restore from that file automatically.</p>" +
        '<button type="button" class="wh-btn wh-btn--primary wh-mt4" id="st-link">' +
          Hub.icon("download") + "Link a backup file</button>";
    }

    return '<div class="wh-card wh-mb4">' +
      '<div class="wh-card__head">' +
        '<div class="wh-card__title">' + Hub.icon("shield") + "Keeping your data</div>" +
        '<span class="wh-chip" id="st-persist-chip">checking…</span>' +
      "</div>" +

      '<div class="wh-setrow">' +
        '<div class="wh-setrow__info">' +
          '<div class="wh-setrow__name">Eviction protection</div>' +
          '<div class="wh-setrow__desc" id="st-persist-desc">Asking the browser to keep this data even ' +
            "when it's short on space.</div>" +
        "</div>" +
        '<div class="wh-setrow__ctl">' +
          '<button type="button" class="wh-btn wh-btn--sm" id="st-persist">Request</button>' +
        "</div>" +
      "</div>" +

      '<div class="wh-setrow">' +
        '<div class="wh-setrow__info">' +
          '<div class="wh-setrow__name">Automatic file backup</div>' +
          '<div class="wh-setrow__desc" id="st-quota">—</div>' +
        "</div>" +
      "</div>" +
      linkBlock +

      '<p class="wh-help wh-mt4">' + Hub.icon("alert") +
        " Neither of these protects against you deliberately clearing site data while nothing is linked. " +
        "The file is the real safety net.</p>" +
    "</div>";
  }

  /* Fill in the two asynchronous facts once the browser answers. */
  function refreshDurability(el) {
    if (!Hub.storage) return;

    Hub.storage.isPersisted().then(function (yes) {
      var chip = el.querySelector("#st-persist-chip");
      var desc = el.querySelector("#st-persist-desc");
      var btn = el.querySelector("#st-persist");
      if (!chip) return;
      chip.textContent = yes ? "protected" : "not protected";
      chip.className = "wh-chip " + (yes ? "wh-chip--good" : "wh-chip--warn");
      if (desc) {
        desc.textContent = yes
          ? "Granted. The browser won't evict this data to reclaim space."
          : "Not granted yet. Browsers may clear unprotected data when storage runs low.";
      }
      if (btn) {
        btn.textContent = yes ? "Granted" : "Request";
        btn.disabled = yes;
      }
    });

    Hub.storage.estimate().then(function (est) {
      var q = el.querySelector("#st-quota");
      if (!q || !est) return;
      var usedMb = (est.usage || 0) / 1048576;
      var quotaMb = (est.quota || 0) / 1048576;
      q.textContent = "Using " + usedMb.toFixed(1) + " MB of roughly " +
        (quotaMb > 1024 ? (quotaMb / 1024).toFixed(1) + " GB" : Math.round(quotaMb) + " MB") +
        " available to this site.";
    });
  }

  function reminderRow(item, cfg) {
    var ctl = item.type === "interval"
      ? '<input class="wh-input" type="number" data-int="' + item.key + '" min="' + item.min + '" max="' + item.max +
        '" step="5" value="' + cfg.intervalMin + '" aria-label="' + Hub.esc(item.name) + ' interval in minutes" />' +
        '<span class="wh-help">min</span>'
      : '<input class="wh-input" type="time" data-time="' + item.key + '" value="' + Hub.esc(cfg.time) +
        '" aria-label="' + Hub.esc(item.name) + ' time" />';

    var days = cfg.days || [0, 1, 2, 3, 4, 5, 6];
    var everyDay = days.length === 7;

    return '<div class="wh-setrow' + (cfg.enabled ? "" : " is-off") + '">' +
      '<div class="wh-setrow__info">' +
        '<div class="wh-setrow__name">' + Hub.esc(item.name) + "</div>" +
        '<div class="wh-setrow__desc">' + Hub.esc(item.desc) + "</div>" +
        /* Weekday mask: a brushing nudge at 07:00 on a Sunday is how people
           end up switching reminders off altogether. */
        '<div class="wh-daypick" role="group" aria-label="' + Hub.esc(item.name) + ' days">' +
          DAY_LABELS.map(function (l, i) {
            var on = days.indexOf(i) !== -1;
            return '<button type="button" class="wh-daypick__d' + (on ? " is-on" : "") + '" ' +
              'data-day="' + item.key + ":" + i + '" aria-pressed="' + on + '" ' +
              'aria-label="' + DAY_NAMES[i] + '" title="' + DAY_NAMES[i] + '">' + l + "</button>";
          }).join("") +
          '<span class="wh-daypick__note">' + (everyDay ? "every day" : days.length + " days") + "</span>" +
        "</div>" +
      "</div>" +
      '<div class="wh-setrow__ctl">' + ctl +
        '<label class="wh-switch"><input type="checkbox" data-rem="' + item.key + '"' +
          (cfg.enabled ? " checked" : "") + ' aria-label="Enable ' + Hub.esc(item.name) + '" />' +
        '<span class="wh-switch__track"></span></label>' +
      "</div>" +
    "</div>";
  }

  function miniStat(label, value) {
    return '<div><div class="wh-stat__label">' + label + "</div>" +
      '<div class="mono" style="font-size:19px;color:var(--fg0)">' + value + "</div></div>";
  }

  function permLabel(perm, canNotify) {
    if (!canNotify) return "in-app only";
    if (perm === "granted") return "enabled";
    if (perm === "denied") return "blocked";
    return "not enabled";
  }
  function permChipClass(perm, canNotify) {
    if (!canNotify) return "wh-chip--warn";
    if (perm === "granted") return "wh-chip--good";
    if (perm === "denied") return "wh-chip--bad";
    return "";
  }

  function storageSize() {
    try {
      var n = (localStorage.getItem(Hub.STORAGE_KEY) || "").length +
              (localStorage.getItem(IRONFRAME_KEY) || "").length;
      return n > 1024 ? (n / 1024).toFixed(1) + " KB" : n + " B";
    } catch (e) { return "—"; }
  }

  /* ======================================================================
     EVENTS
     ====================================================================== */
  /* Bind a handler only if the element is actually on the page — several of
     these appear conditionally depending on browser support and link state. */
  function on(root, sel, handler) {
    var el = root.querySelector(sel);
    if (el) el.addEventListener("click", handler);
  }

  function wire(el) {
    var permBtn = el.querySelector("#st-perm");
    if (permBtn) permBtn.addEventListener("click", function () { Hub.notify.request(); });

    /* --- palette ---
       Repaint the picker in place rather than re-rendering the view: a full
       refresh would scroll the user back to the top of Settings mid-choice. */
    el.querySelectorAll("[data-theme-pick]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.dataset.themePick;
        if (!Hub.theme || id === Hub.theme.active()) return;
        Hub.theme.apply(id);
        el.querySelectorAll("[data-theme-pick]").forEach(function (x) {
          var on = x.dataset.themePick === id;
          x.classList.toggle("is-active", on);
          x.setAttribute("aria-checked", on);
        });
        var chip = el.querySelector(".wh-themes").closest(".wh-card").querySelector(".wh-chip");
        if (chip) chip.textContent = Hub.theme.label(id);
        Hub.toast(Hub.theme.label(id), "success", 2200);
      });
    });

    /* --- app / offline --- */
    var installBtn = el.querySelector("#st-install");
    if (installBtn) installBtn.addEventListener("click", function () { Hub.pwa.promptInstall(); });

    var updateBtn = el.querySelector("#st-update");
    if (updateBtn) updateBtn.addEventListener("click", function () { Hub.pwa.applyUpdate(); });

    var recacheBtn = el.querySelector("#st-recache");
    if (recacheBtn) recacheBtn.addEventListener("click", function () {
      Hub.confirm({
        title: "Clear the offline cache?",
        body: "This re-downloads the app files next time it loads. <strong>Your data isn't touched</strong> — " +
              "habits, streaks and training records all live in separate storage.",
        confirmLabel: "Clear and reload",
        variant: "primary",
        onConfirm: function () { Hub.pwa.refreshCache(); }
      });
    });

    /* --- calendar export --- */
    var icsBtn = el.querySelector("#st-ics");
    if (icsBtn) icsBtn.addEventListener("click", function () { Hub.calendar.download(); });

    /* --- durable storage --- */
    refreshDurability(el);
    on(el, "#st-persist", function () {
      Hub.storage.requestPersist().then(function (ok) {
        Hub.toast(ok
          ? "Granted — this data is now protected from automatic eviction."
          : "The browser declined. Installing the app usually makes it grant this.",
          ok ? "success" : "warn", 6000);
        refreshDurability(el);
      });
    });
    on(el, "#st-link", function () { Hub.storage.link(); });
    on(el, "#st-unlink", function () {
      Hub.confirm({
        title: "Unlink the backup file?",
        body: "The file stays exactly where it is — it just stops being updated.",
        confirmLabel: "Unlink",
        onConfirm: function () { Hub.storage.unlink(); }
      });
    });
    on(el, "#st-writenow", function () {
      Hub.storage.writeNow().then(function (ok) {
        Hub.toast(ok ? "Written." : "Couldn't write — try Reconnect.", ok ? "success" : "warn");
        Hub.refresh();
      });
    });
    on(el, "#st-reconnect", function () {
      Hub.storage.ensurePermission("readwrite").then(function (ok) {
        if (ok) return Hub.storage.writeNow().then(function () {
          Hub.toast("Reconnected and written.", "success");
          Hub.refresh();
        });
        Hub.toast("Permission not granted.", "warn");
      });
    });
    on(el, "#st-restorefile", function () { Hub.storage.restoreFromFile(); });

    /* --- reminders --- */
    Hub.delegate(el, "[data-rem]", function () { /* label click passthrough */ });
    el.querySelectorAll("[data-rem]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var key = cb.dataset.rem;
        Hub.state.settings.reminders[key].enabled = cb.checked;
        Hub.save();
        Hub.reminders.sync();
        if (cb.checked && Hub.notify.permission() === "default" && Hub.notify.availableHere()) {
          Hub.notify.request();
        }
        Hub.refresh();
      });
    });

    el.querySelectorAll("[data-int]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var key = inp.dataset.int;
        var v = Math.round(Number(inp.value));
        var min = Number(inp.min), max = Number(inp.max);
        if (!(v >= min && v <= max)) {
          Hub.toast("Interval must be between " + min + " and " + max + " minutes.", "warn");
          Hub.refresh();
          return;
        }
        Hub.state.settings.reminders[key].intervalMin = v;
        Hub.save();
        /* Drop the pending countdown so the new interval takes effect now. */
        Hub.reminders.reset(key);
        Hub.reminders.sync();
        Hub.toast("Interval updated to " + v + " minutes.", "success", 2200);
        Hub.refresh();
      });
    });

    el.querySelectorAll("[data-time]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var key = inp.dataset.time;
        if (!/^\d{2}:\d{2}$/.test(inp.value)) { Hub.refresh(); return; }
        Hub.state.settings.reminders[key].time = inp.value;
        /* A changed time should be able to fire again today. */
        delete Hub.state.meta.lastFired[key];
        Hub.save();
        Hub.toast("Time updated.", "success", 2000);
        Hub.refresh();
      });
    });

    /* --- per-reminder weekdays --- */
    Hub.delegate(el, "[data-day]", function (b) {
      var parts = b.dataset.day.split(":");
      var cfg = Hub.state.settings.reminders[parts[0]];
      var day = Number(parts[1]);
      if (!cfg) return;
      var days = (cfg.days || [0, 1, 2, 3, 4, 5, 6]).slice();
      var i = days.indexOf(day);
      if (i === -1) days.push(day);
      else days.splice(i, 1);
      /* A reminder with no days would be enabled and permanently silent — the
         worst possible state, because it looks like it's working. */
      if (!days.length) {
        Hub.toast("A reminder needs at least one day. Switch it off instead.", "warn", 4000);
        return;
      }
      cfg.days = days.sort();
      Hub.save();
      Hub.reminders.sync();
      Hub.refresh();
    });

    /* --- quiet hours + snooze --- */
    var quiet = el.querySelector("#st-quiet");
    if (quiet) quiet.addEventListener("change", function (e) {
      Hub.state.settings.quietHours.enabled = e.target.checked;
      Hub.save();
      Hub.refresh();
    });
    ["from", "to"].forEach(function (which) {
      var inp = el.querySelector("#st-quiet-" + which);
      if (!inp) return;
      inp.addEventListener("change", function () {
        if (!/^\d{2}:\d{2}$/.test(inp.value)) { Hub.refresh(); return; }
        Hub.state.settings.quietHours[which] = inp.value;
        Hub.save();
        Hub.refresh();
      });
    });
    var snooze = el.querySelector("#st-snooze");
    if (snooze) snooze.addEventListener("change", function () {
      var v = Math.round(Number(snooze.value));
      if (!(v >= 1 && v <= 180)) { Hub.toast("Snooze must be 1–180 minutes.", "warn"); Hub.refresh(); return; }
      Hub.state.settings.snoozeMin = v;
      Hub.save();
      Hub.refresh();
    });

    /* --- day boundary --- */
    var dayStart = el.querySelector("#st-daystart");
    if (dayStart) dayStart.addEventListener("change", function () {
      var h = Number(dayStart.value) || 0;
      var before = Hub.today();
      Hub.state.settings.dayStartHour = h;
      Hub.save();
      var after = Hub.today();
      /* Streaks are derived from date keys, so moving the boundary can shift
         which day "now" belongs to — recompute rather than leave a stale cache. */
      Hub.commit();
      Hub.toast(before === after
        ? "Day now starts at " + (h === 0 ? "midnight" : h + ":00") + "."
        : "Day boundary moved — today is now " + Hub.prettyDate(after) + ".",
        "success", 4000);
    });

    /* --- units --- */
    Hub.delegate(el, "[data-units]", function (b) {
      Hub.state.settings.units = b.dataset.units;
      Hub.save();
      Hub.refresh();
      Hub.toast("Showing " + (b.dataset.units === "imperial" ? "pounds, inches and °F" : "kilograms, centimetres and °C") +
        ". Nothing stored has changed.", "success", 4000);
    });

    /* --- grace days --- */
    var grace = el.querySelector("#st-grace");
    if (grace) grace.addEventListener("change", function () {
      var v = Math.round(Number(grace.value));
      if (!(v >= 0 && v <= 10)) { Hub.toast("Between 0 and 10.", "warn"); Hub.refresh(); return; }
      Hub.state.settings.graceDaysPerMonth = v;
      Hub.commit();                 // changes every streak, so recompute
      Hub.toast(v === 0 ? "Strict streaks: any missed day resets." : v + " grace " + Hub.plural(v, "day") + " a month.",
        "success", 3000);
    });

    /* --- desk & movement --- */
    var standGoal = el.querySelector("#st-standgoal");
    if (standGoal) standGoal.addEventListener("change", function () {
      var v = Math.round(Number(standGoal.value));
      if (!(v >= 1 && v <= 24)) { Hub.toast("Between 1 and 24.", "warn"); Hub.refresh(); return; }
      Hub.state.settings.standGoal = v;
      Hub.commit();                 // it's a streak definition, so recompute
      Hub.toast("Stand-break goal set to " + v + " a day.", "success", 2200);
    });

    var sitAlert = el.querySelector("#st-sitalert");
    if (sitAlert) sitAlert.addEventListener("change", function () {
      var v = Math.round(Number(sitAlert.value));
      if (!(v >= 15 && v <= 180)) { Hub.toast("Between 15 and 180 minutes.", "warn"); Hub.refresh(); return; }
      Hub.state.settings.sitAlertMin = v;
      Hub.save();
      Hub.refresh();
    });

    /* --- cycle tracking --- */
    var cyc = el.querySelector("#st-cycle");
    if (cyc) cyc.addEventListener("change", function (e) {
      Hub.state.settings.cycleTracking = e.target.checked;
      Hub.save();
      Hub.buildNav();               // it can bring the Reproductive tab with it
      Hub.refresh();
      Hub.toast(e.target.checked
        ? "Cycle tracking on — it's on the Reproductive Health tab."
        : "Cycle tracking hidden. Your entries are kept.", "info", 3500);
    });

    /* --- reproductive health tab --- */
    var repro = el.querySelector("#st-repro");
    if (repro) repro.addEventListener("change", function (e) {
      var v = e.target.value;
      Hub.state.settings.reproTab = v === "on" ? true : (v === "off" ? false : null);
      Hub.save();
      Hub.buildNav();
      /* Hiding the tab you're standing on would leave the app on a view with
         no way back to it in the nav. */
      if (!Hub.reproTabVisible() && Hub.activeView() === "repro") Hub.show("settings");
      else Hub.refresh();
    });

    /* --- profile & suggestions --- */
    var profBtn = el.querySelector("#st-profile");
    if (profBtn) profBtn.addEventListener("click", function () {
      Hub.onboarding.start({ returning: !!Hub.state.settings.profile.completedAt });
    });

    var suggReset = el.querySelector("#st-sugg-reset");
    if (suggReset) suggReset.addEventListener("click", function () {
      Hub.onboarding.resetDismissed();
      Hub.toast("Dismissed suggestions are back.", "info", 2500);
    });

    Hub.delegate(el, "[data-sugg-apply]", function (btn) {
      if (Hub.onboarding.applyOne(btn.dataset.suggApply)) Hub.toast("Turned on.", "success", 2500);
    });
    Hub.delegate(el, "[data-sugg-no]", function (btn) { Hub.onboarding.dismiss(btn.dataset.suggNo); });

    /* --- cadence --- */
    el.querySelectorAll("[data-cadence]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var key = sel.dataset.cadence;
        var v = sel.value;
        if (v === "daily") delete Hub.state.settings.cadence[key];
        else Hub.state.settings.cadence[key] = { type: "weekly", perWeek: Number(v) };
        Hub.commit();
        Hub.toast("Cadence updated.", "success", 2000);
      });
    });

    /* --- custom habits --- */
    var habitsBtn = el.querySelector("#st-habits");
    if (habitsBtn) habitsBtn.addEventListener("click", function () {
      Hub.uiSet("wellnessPill", "habits");
      Hub.show("wellness");
    });

    /* --- csv --- */
    Hub.delegate(el, "[data-csv]", function (b) { Hub.storage.downloadCsv(b.dataset.csv); });

    /* --- sleep target --- */
    var sleepT = el.querySelector("#st-sleep");
    if (sleepT) sleepT.addEventListener("change", function () {
      var v = Number(sleepT.value);
      if (!(v >= 4 && v <= 12)) { Hub.toast("Between 4 and 12 hours.", "warn"); Hub.refresh(); return; }
      Hub.state.settings.sleepTargetHours = v;
      Hub.save();
      Hub.refresh();
    });

    /* --- goals --- */
    el.querySelector("#st-goal").addEventListener("change", function (e) {
      var v = Math.round(Number(e.target.value));
      if (!(v >= 1 && v <= 30)) { Hub.toast("Pick a goal between 1 and 30 cups.", "warn"); Hub.refresh(); return; }
      Hub.state.settings.hydrationGoalCups = v;
      Hub.commit();     // changes the hydration streak, so recompute
      Hub.toast("Hydration goal set to " + v + " cups.", "success", 2200);
    });

    el.querySelector("#st-cup").addEventListener("change", function (e) {
      var v = Math.round(Number(e.target.value));
      if (!(v >= 50 && v <= 1000)) { Hub.refresh(); return; }
      Hub.state.settings.cupSizeMl = v;
      Hub.save();
      Hub.refresh();
    });

    el.querySelector("#st-name").addEventListener("change", function (e) {
      Hub.state.settings.name = e.target.value.trim().slice(0, 24);
      Hub.save();
      Hub.toast("Saved.", "success", 1800);
    });

    el.querySelector("#st-sound").addEventListener("change", function (e) {
      Hub.state.settings.sound = e.target.checked;
      Hub.save();
      if (e.target.checked) Hub.cueChange();
    });

    /* --- backup --- */
    el.querySelector("#st-export").addEventListener("click", exportAll);
    el.querySelector("#st-import").addEventListener("click", function () { el.querySelector("#st-file").click(); });
    el.querySelector("#st-file").addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) importAll(e.target.files[0]);
      e.target.value = "";
    });

    /* --- reset --- */
    el.querySelector("#st-reset-hub").addEventListener("click", function () {
      Hub.confirm({
        title: "Reset habit data?",
        body: "This permanently deletes every habit log, streak and badge in this browser. " +
              "Your <strong>training data stays</strong>. There's no undo — export a backup first if you're unsure.",
        confirmLabel: "Yes, wipe habits",
        onConfirm: function () {
          Hub.setState(Hub.defaultState());
          Hub.commit();
          Hub.toast("Habit data reset.", "info");
          Hub.show("dashboard");
        }
      });
    });

    el.querySelector("#st-reset-all").addEventListener("click", function () {
      Hub.confirm({
        title: "Reset absolutely everything?",
        body: "This deletes <strong>all habit data and all training data</strong> from this browser, then " +
              "reloads the app as a fresh install. This cannot be undone.",
        confirmLabel: "Yes, wipe everything",
        onConfirm: function () {
          try {
            localStorage.removeItem(Hub.STORAGE_KEY);
            localStorage.removeItem(IRONFRAME_KEY);
            localStorage.removeItem("wellnessHub.ui");
            localStorage.removeItem("ironframe.ui");
            localStorage.removeItem("ironframe.theme");
          } catch (e) {}
          location.reload();
        }
      });
    });
  }

  /* ======================================================================
     EXPORT / IMPORT
     ----------------------------------------------------------------------
     One file covers both stores. The calisthenics app keeps its own
     localStorage key, so a backup that only carried the hub's data would
     quietly lose every workout.
     ====================================================================== */
  /* One implementation, in storage.js, so the manual export and the linked
     file can't drift apart — and so both carry the photos. */
  function exportAll() { Hub.storage.downloadBackup(); }

  function importAll(file) {
    var reader = new FileReader();
    reader.onerror = function () { Hub.toast("Couldn't read that file.", "danger"); };
    reader.onload = function () {
      var parsed;
      try { parsed = JSON.parse(reader.result); }
      catch (e) { Hub.toast("That isn't valid JSON.", "danger"); return; }

      /* Accept either the combined wrapper or a bare hub state, so an older
         or hand-edited file still imports. */
      var hub = parsed.wellnessHub || (parsed.version && parsed.logs ? parsed : null);
      var iron = parsed.ironframe || null;
      if (!hub && !iron) { Hub.toast("No recognisable backup data in that file.", "danger", 5000); return; }

      Hub.confirm({
        title: "Replace your current data?",
        body: "This overwrites everything stored in this browser with the contents of " +
              "<strong>" + Hub.esc(file.name) + "</strong>" +
              (parsed.exportedAt ? " (exported " + new Date(parsed.exportedAt).toLocaleDateString() + ")" : "") + ".",
        confirmLabel: "Import and replace",
        variant: "primary",
        onConfirm: function () {
          if (hub) { Hub.setState(hub); Hub.commit({ render: false }); }
          if (iron) {
            try { localStorage.setItem(IRONFRAME_KEY, JSON.stringify(iron)); }
            catch (e) { Hub.toast("Habit data imported, but training data wouldn't fit in storage.", "warn", 6000); }
          }
          /* Photos live in IndexedDB, so they're restored separately — and
             the reload waits for that rather than racing it. */
          Hub.storage.restorePhotoData(parsed.photoData).then(function (n) {
            Hub.toast("Data imported" + (n ? " with " + n + " " + Hub.plural(n, "photo") : "") + " — reloading…", "success");
            /* A reload is the honest way to re-seed the calisthenics app from
               its restored state, rather than patching it live. */
            setTimeout(function () { location.reload(); }, 900);
          });
        }
      });
    };
    reader.readAsText(file);
  }

  Hub.registerView("settings", render);
})();
