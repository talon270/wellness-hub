/* ============================================================================
   WELLNESS HUB · PROFILE & SETUP
   ----------------------------------------------------------------------------
   A six-step first-run wizard, and the suggestion engine it feeds.

   WHY ASK AT ALL. Every default in this app was, until now, a guess about a
   person the app had never met: reminders at times that suit somebody else's
   day, a hydration goal picked out of the air, and two whole modules (cycle
   tracking, self-exams) that only ever appeared if you went hunting for them.
   Six questions turn all of that into something aimed at the person answering.

   THE RULES IT PLAYS BY

     · Every question is skippable, and the app works fully with a blank
       profile. Nothing is gated behind an answer.
     · `gender` is asked once, and only to pick defaults: which monthly
       self-check to prompt for, which screenings have an age band, and
       whether cycle tracking is worth showing. "Other" and "prefer not to
       say" both mean the app offers everything instead of choosing for you,
       and every one of those modules stays reachable either way.
     · Answers become SUGGESTIONS, shown with their reasoning and a checkbox,
       never silent configuration. You can see exactly what it's about to
       switch on, and turn any of it off.
     · Nothing leaves the browser. There is no profile anywhere but here.

   The same suggestions stay available afterwards — on the dashboard while
   any are outstanding, and permanently from Settings → Your profile.
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  /* ======================================================================
     SMALL HELPERS
     ====================================================================== */
  function prof() { return Hub.state.settings.profile; }

  function ageNow() {
    var y = Number(prof().birthYear);
    return y ? new Date().getFullYear() - y : null;
  }

  /* "23:00" + 45 minutes -> "23:45", wrapping around midnight. */
  function shiftTime(hhmm, mins) {
    var p = String(hhmm || "07:00").split(":");
    var t = (Number(p[0]) || 0) * 60 + (Number(p[1]) || 0) + mins;
    t = ((t % 1440) + 1440) % 1440;
    return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
  }

  function rem(key) { return Hub.state.settings.reminders[key]; }

  function enableClock(key, time) {
    var r = rem(key);
    if (!r) return;
    r.enabled = true;
    if (time) r.time = time;
    delete Hub.state.meta.lastFired[key];
  }

  function enableInterval(key, mins, days) {
    var r = rem(key);
    if (!r) return;
    r.enabled = true;
    if (mins) r.intervalMin = mins;
    if (days) r.days = days;
  }

  var GOALS = [
    { key: "energy",   label: "More energy through the day" },
    { key: "sleep",    label: "Sleep better" },
    { key: "pain",     label: "Less back, neck or wrist pain" },
    { key: "move",     label: "Move more / sit less" },
    { key: "strength", label: "Get stronger" },
    { key: "stress",   label: "Handle stress better" },
    { key: "skin",     label: "Look after my skin and teeth" },
    { key: "checks",   label: "Stay on top of health checks" },
    { key: "cycle",    label: "Understand my cycle" }
  ];

  function hasGoal(k) { return (prof().goals || []).indexOf(k) !== -1; }

  /* ======================================================================
     THE SUGGESTION ENGINE
     ----------------------------------------------------------------------
     Each suggestion answers three questions: does it apply to this person,
     has it already been done, and what exactly would it change. `why` is
     shown verbatim in the UI — a suggestion you can't see the reasoning for
     is just an app changing your settings.
     ====================================================================== */
  function allSuggestions() {
    var s = Hub.state.settings;
    var p = prof();
    var deskish = p.workStyle === "desk" || (Number(p.sittingHours) || 0) >= 4;
    var age = ageNow();

    var list = [];

    /* ---- desk & movement ---- */
    if (deskish || hasGoal("move") || hasGoal("pain")) {
      list.push({
        id: "stand",
        title: "Stand-up reminders every 45 minutes",
        why: "You said you're seated for " + (p.sittingHours ? p.sittingHours + " hours" : "most of the day") +
             ". Unbroken sitting is the part that matters, more than which posture you hold, so the fix is " +
             "frequency: a minute on your feet every 45.",
        done: function () { return rem("stand").enabled; },
        apply: function () { enableInterval("stand", 45, [1, 2, 3, 4, 5]); }
      });
      list.push({
        id: "eye",
        title: "20-20-20 eye breaks every 20 minutes",
        why: "Screens all day is what causes eye strain — every 20 minutes, look 20 feet away for 20 " +
             "seconds. It's the one intervention with genuinely good evidence behind it.",
        done: function () { return rem("eye").enabled; },
        apply: function () { enableInterval("eye", 20, [1, 2, 3, 4, 5]); }
      });
      list.push({
        id: "posture",
        title: "Posture check-ins every hour",
        why: "A nudge to reset your position and screen height, plus the desk stretches that go with it.",
        done: function () { return rem("posture").enabled; },
        apply: function () { enableInterval("posture", 60, [1, 2, 3, 4, 5]); }
      });
    }

    /* ---- reminders anchored to the day you actually keep ---- */
    if (p.wakeTime && p.bedTime) {
      list.push({
        id: "times",
        title: "Reminder times built around your day",
        why: "Brushing and morning skincare 30 minutes after you wake (" + shiftTime(p.wakeTime, 30) +
             "), the evening routine and flossing before bed (" + shiftTime(p.bedTime, -45) + " and " +
             shiftTime(p.bedTime, -30) + "), and the mood check-in while the day is still fresh (" +
             shiftTime(p.bedTime, -90) + ").",
        done: function () {
          return rem("brushAM").time === shiftTime(p.wakeTime, 30) &&
                 rem("brushPM").time === shiftTime(p.bedTime, -45);
        },
        apply: function () {
          var wake = p.wakeTime, bed = p.bedTime;
          enableClock("brushAM", shiftTime(wake, 30));
          enableClock("brushPM", shiftTime(bed, -45));
          enableClock("floss", shiftTime(bed, -30));
          rem("skinAM").time = shiftTime(wake, 20);
          rem("skinPM").time = shiftTime(bed, -40);
          rem("mood").time = shiftTime(bed, -90);
        }
      });
      list.push({
        id: "quiet",
        title: "Quiet hours from " + p.bedTime + " to " + p.wakeTime,
        why: "Interval reminders — water, eye breaks, standing — stay silent while you're asleep. " +
             "Anything you set for a specific time still fires, because that was deliberate.",
        done: function () {
          var q = s.quietHours || {};
          return q.enabled && q.from === p.bedTime && q.to === p.wakeTime;
        },
        apply: function () {
          s.quietHours = { enabled: true, from: p.bedTime, to: p.wakeTime };
        }
      });
    }

    /* ---- hydration goal from bodyweight ---- */
    if (p.weightKg) {
      var cups = Hub.clamp(Math.round(p.weightKg * 33 / (s.cupSizeMl || 250)), 5, 16);
      list.push({
        id: "hydration",
        title: "Hydration goal of " + cups + " cups",
        why: "Roughly 33 ml per kg of bodyweight, at your " + (s.cupSizeMl || 250) + " ml cup size. It's a " +
             "starting point, not a rule — hot days and hard training both move it, and you can change it " +
             "any time in Settings.",
        done: function () { return s.hydrationGoalCups === cups; },
        apply: function () { s.hydrationGoalCups = cups; },
        optional: true
      });
    }

    /* ---- cycle & reproductive health ---- */
    if (p.gender === "female") {
      if (age == null || age < 60) {
        list.push({
          id: "cycle",
          title: "Cycle tracking",
          why: "Periods, flow and symptoms, with predictions based on your own history — and cycle day " +
               "fed into the Insights patterns, so you can see how it moves your energy, sleep, mood and " +
               "soreness. It's the biggest missing variable in everything else this app measures.",
          done: function () { return !!s.cycleTracking; },
          apply: function () { s.cycleTracking = true; s.reproTab = true; }
        });
      }
      list.push({
        id: "repro",
        title: "The Reproductive Health tab",
        why: "Monthly breast self-check with a due date, the screenings that come with age, and " +
             "contraception including a pill reminder that fires on time.",
        done: function () { return Hub.reproTabVisible(); },
        apply: function () { s.reproTab = true; }
      });
    }
    if (p.gender === "male") {
      list.push({
        id: "repro",
        title: "The Reproductive Health tab",
        why: "The monthly testicular self-check — one minute, and the thing that catches the most " +
             "treatable cancer in men your age early — plus the screenings that come with age.",
        done: function () { return Hub.reproTabVisible(); },
        apply: function () { s.reproTab = true; }
      });
    }

    /* ---- age-related screening ---- */
    if (age != null && (age >= 25 || hasGoal("checks"))) {
      list.push({
        id: "checkups",
        title: "Age-relevant screenings in your check-up schedule",
        why: "Adds the ones with an age band you're now inside to Health Records, which then tracks " +
             "when each is next due. Intervals vary by country — they're all editable.",
        done: function () {
          return (Hub.state.logs.checkups || []).some(function (c) { return c.id.indexOf("scr-") === 0; });
        },
        apply: addScreenings,
        optional: true
      });
    }

    /* ---- goals ---- */
    if (hasGoal("stress") || hasGoal("sleep")) {
      list.push({
        id: "mood",
        title: "Evening mood check-in",
        why: "Thirty seconds a day. On its own it's a diary; over a month it's the only way to see what " +
             "actually moves your stress and your sleep, which is what the Patterns tab is for.",
        done: function () { return rem("mood").enabled; },
        apply: function () { enableClock("mood", shiftTime(p.bedTime || "23:00", -90)); }
      });
    }
    if (hasGoal("pain") || hasGoal("strength")) {
      list.push({
        id: "mobility",
        title: "A daily mobility nudge",
        why: "Ten minutes of joint work, prompted once a day. For desk-stiff wrists and shoulders it's " +
             "worth more than an extra training set.",
        done: function () { return rem("mobility").enabled; },
        apply: function () { enableClock("mobility", "18:00"); },
        optional: true
      });
    }
    if (hasGoal("skin")) {
      list.push({
        id: "skin",
        title: "Morning and evening skincare reminders",
        why: "Sunscreen in the morning is the single highest-value thing on that tab; cleansing it off at " +
             "night is the half most people skip.",
        done: function () { return rem("skinAM").enabled && rem("skinPM").enabled; },
        apply: function () {
          enableClock("skinAM", shiftTime(p.wakeTime || "07:00", 20));
          enableClock("skinPM", shiftTime(p.bedTime || "23:00", -40));
        }
      });
    }
    if (hasGoal("sleep")) {
      list.push({
        id: "sleeptarget",
        title: "Sleep target of 8 hours",
        why: "What the sleep-balance figure is measured against. Most adults land between 7 and 9; " +
             "change it in Settings once you know yours.",
        done: function () { return s.sleepTargetHours === 8; },
        apply: function () { s.sleepTargetHours = 8; },
        optional: true
      });
    }

    return list;
  }

  /* Add whichever screenings this person is inside the age band for. Mirrors
     the list in repro.js — it's the same source of truth, reached from the
     other end, so a check added here shows as "tracked" there. */
  function addScreenings() {
    var age = ageNow();
    if (age == null) return;
    var p = prof();
    var add = [];

    if (p.gender === "female" && age >= 25 && age <= 65) {
      add.push({ id: "scr-cervical", name: "Cervical screening (smear / HPV test)", intervalMonths: 36,
        note: "Every 3–5 years depending on your country's programme and your age." });
    }
    if (p.gender === "female" && age >= 40) {
      add.push({ id: "scr-mammogram", name: "Breast screening (mammogram)", intervalMonths: 24,
        note: "Programmes usually start between 40 and 50. Earlier with a family history." });
    }
    if (p.gender === "male" && age >= 50) {
      add.push({ id: "scr-prostate", name: "Prostate discussion (PSA)", intervalMonths: 24,
        note: "A conversation to have rather than a routine test everywhere. From 45 with a family history." });
    }
    if (age >= 16 && age <= 70) {
      add.push({ id: "scr-sti", name: "Sexual health / STI screen", intervalMonths: 12,
        note: "Annually if sexually active, and with each new partner." });
    }

    var existing = Hub.state.logs.checkups || [];
    add.forEach(function (c) {
      if (existing.some(function (x) { return x.id === c.id; })) return;
      existing.push({ id: c.id, name: c.name, intervalMonths: c.intervalMonths, lastISO: null, note: c.note });
    });
  }

  /* Suggestions still worth showing: applicable, not already done, and not
     previously dismissed. */
  function pending() {
    var dis = Hub.state.settings.dismissedSuggestions || {};
    return allSuggestions().filter(function (s) {
      return !dis[s.id] && !s.done();
    });
  }

  /* ======================================================================
     THE WIZARD
     ----------------------------------------------------------------------
     Six steps in one modal. `draft` holds the answers until the last step, so
     abandoning halfway changes nothing.
     ====================================================================== */
  var draft = null;

  function start(opts) {
    opts = opts || {};
    var p = prof();
    draft = {
      name: Hub.state.settings.name || "",
      gender: p.gender,
      birthYear: p.birthYear,
      heightCm: p.heightCm,
      weightKg: p.weightKg,
      workStyle: p.workStyle,
      sittingHours: p.sittingHours,
      activity: p.activity,
      goals: (p.goals || []).slice(),
      wakeTime: p.wakeTime || "07:00",
      bedTime: p.bedTime || "23:00",
      units: Hub.state.settings.units || "metric",
      returning: !!opts.returning
    };
    step1();
  }

  /* ---- step 1: what this is ---- */
  function step1() {
    Hub.modal({
      title: draft.returning ? "Your profile" : "Let's set this up for you",
      body:
        stepHead(1) +
        "<p>Six short questions. They decide which reminders get switched on, at what times, and which " +
        "parts of the app are worth showing you at all — a desk worker and a builder need almost opposite " +
        "defaults, and until now everyone got the same guess.</p>" +
        "<p><strong>Every question is optional</strong>, and nothing here is a gate: skip the lot and the " +
        "whole app still works, you'll just be setting it up by hand.</p>" +
        '<p class="wh-sm wh-muted">All of it stays in this browser. There\'s no account, no server, and ' +
        "nothing to send anywhere — the same as every other thing this app stores.</p>",
      actions: [
        { label: draft.returning ? "Cancel" : "Skip for now", variant: "ghost", onClick: function () {
          if (!draft.returning) {
            prof().skipped = true;
            Hub.save();
            Hub.toast("Skipped — you can do this any time from Settings.", "info", 4000);
          }
        } },
        { label: "Start", variant: "primary", close: false, onClick: step2 }
      ]
    });
  }

  /* ---- step 2: who you are ---- */
  function step2() {
    var years = [];
    var now = new Date().getFullYear();
    for (var y = now - 12; y >= now - 100; y--) years.push(y);

    Hub.modal({
      title: "About you",
      body:
        stepHead(2) +
        '<label class="wh-field"><span class="wh-field__label">What should I call you?</span>' +
          '<input class="wh-input" id="ob-name" type="text" maxlength="24" value="' + Hub.esc(draft.name) +
            '" placeholder="optional — used for the greeting" /></label>' +

        '<div class="wh-field wh-mt4"><span class="wh-field__label">Year of birth</span>' +
          '<select class="wh-input" id="ob-year">' +
            '<option value="">Prefer not to say</option>' +
            years.map(function (y) {
              return '<option value="' + y + '"' + (draft.birthYear === y ? " selected" : "") + ">" + y + "</option>";
            }).join("") +
          "</select>" +
          '<span class="wh-help">Only the year, and only used to work out which screenings have an age ' +
            "band you're inside.</span></div>" +

        '<div class="wh-field wh-mt6"><span class="wh-field__label">Gender</span>' +
          '<div class="wh-row" style="flex-wrap:wrap" id="ob-gender">' +
            [["female", "Female"], ["male", "Male"], ["other", "Other"], ["", "Prefer not to say"]]
              .map(function (o) {
                var on = (draft.gender || "") === o[0];
                return '<button type="button" class="wh-btn wh-btn--sm' + (on ? " wh-btn--primary" : " wh-btn--ghost") +
                  '" data-gender="' + o[0] + '" aria-pressed="' + on + '">' + o[1] + "</button>";
              }).join("") +
          "</div>" +
          '<span class="wh-help">Used to pick defaults, nothing else: which monthly self-check to prompt ' +
            "for, which screenings apply at which age, and whether cycle tracking is worth putting in " +
            "front of you. <strong>Other</strong> or skipping it means the app offers you everything " +
            "instead of choosing — and whatever you pick, every module stays available and every " +
            "suggestion is yours to turn on or off.</span></div>",
      actions: [
        { label: "Back", variant: "ghost", close: false, onClick: function () { save2(); step1(); } },
        { label: "Next", variant: "primary", close: false, onClick: function () { save2(); step3(); } }
      ],
      onOpen: function (body) {
        Hub.delegate(body, "[data-gender]", function (btn) {
          draft.gender = btn.dataset.gender || null;
          body.querySelectorAll("[data-gender]").forEach(function (b) {
            var on = (draft.gender || "") === b.dataset.gender;
            b.classList.toggle("wh-btn--primary", on);
            b.classList.toggle("wh-btn--ghost", !on);
            b.setAttribute("aria-pressed", on);
          });
        });
      }
    });
  }

  function save2() {
    draft.name = (val("ob-name") || "").trim();
    var y = Number(val("ob-year"));
    draft.birthYear = y || null;
    /* Gender is held on the draft by the button handler — there's no input to
       read it back from. */
  }

  /* ---- step 3: the shape of your day ---- */
  function step3() {
    Hub.modal({
      title: "Your day",
      body:
        stepHead(3) +
        '<div class="wh-grid wh-grid--2" style="gap:var(--wh-s3)">' +
          '<label class="wh-field"><span class="wh-field__label">I usually wake at</span>' +
            '<input class="wh-input" id="ob-wake" type="time" value="' + Hub.esc(draft.wakeTime) + '" /></label>' +
          '<label class="wh-field"><span class="wh-field__label">I usually go to bed at</span>' +
            '<input class="wh-input" id="ob-bed" type="time" value="' + Hub.esc(draft.bedTime) + '" /></label>' +
        "</div>" +
        '<p class="wh-help">Every timed reminder gets anchored to these, and quiet hours fill the gap ' +
          "between them so nothing nudges you at 3am.</p>" +

        '<div class="wh-field wh-mt6"><span class="wh-field__label">A working day is mostly…</span>' +
          '<div class="wh-row" style="flex-wrap:wrap" id="ob-work">' +
            [["desk", "At a desk"], ["mixed", "A bit of both"], ["active", "On my feet"]].map(function (o) {
              var on = draft.workStyle === o[0];
              return '<button type="button" class="wh-btn wh-btn--sm' + (on ? " wh-btn--primary" : " wh-btn--ghost") +
                '" data-work="' + o[0] + '" aria-pressed="' + on + '">' + o[1] + "</button>";
            }).join("") +
          "</div></div>" +

        '<label class="wh-field wh-mt4"><span class="wh-field__label">Hours seated on a normal day</span>' +
          '<input class="wh-input" id="ob-sit" type="number" min="0" max="16" step="1" value="' +
            (draft.sittingHours == null ? "" : draft.sittingHours) + '" placeholder="e.g. 8" /></label>' +
        '<span class="wh-help">This sets how hard the desk module pushes. Six or more and stand-up ' +
          "reminders get switched on by default.</span>",
      actions: [
        { label: "Back", variant: "ghost", close: false, onClick: function () { save3(); step2(); } },
        { label: "Next", variant: "primary", close: false, onClick: function () { save3(); step4(); } }
      ],
      onOpen: function (body) {
        Hub.delegate(body, "[data-work]", function (btn) {
          draft.workStyle = btn.dataset.work;
          body.querySelectorAll("[data-work]").forEach(function (b) {
            var on = draft.workStyle === b.dataset.work;
            b.classList.toggle("wh-btn--primary", on);
            b.classList.toggle("wh-btn--ghost", !on);
            b.setAttribute("aria-pressed", on);
          });
          /* Desk work implies a sitting figure; fill it in rather than making
             them answer the obvious follow-up. */
          var sit = body.querySelector("#ob-sit");
          if (sit && !sit.value) sit.value = btn.dataset.work === "desk" ? 8 : (btn.dataset.work === "mixed" ? 4 : 2);
        });
      }
    });
  }

  function save3() {
    var w = val("ob-wake"), b = val("ob-bed");
    if (/^\d{2}:\d{2}$/.test(w)) draft.wakeTime = w;
    if (/^\d{2}:\d{2}$/.test(b)) draft.bedTime = b;
    var h = Number(val("ob-sit"));
    draft.sittingHours = (h >= 0 && h <= 16) ? Math.round(h) : null;
  }

  /* ---- step 4: body (entirely optional) ---- */
  function step4() {
    var U = Hub.units;
    var imperial = draft.units === "imperial";
    var hOut = draft.heightCm == null ? "" : (imperial ? Math.round(draft.heightCm / 2.54 * 10) / 10 : Math.round(draft.heightCm));
    var wOut = draft.weightKg == null ? "" : (imperial ? Math.round(draft.weightKg * 2.2046226 * 10) / 10 : Math.round(draft.weightKg * 10) / 10);

    Hub.modal({
      title: "Height & weight",
      body:
        stepHead(4) +
        "<p>Optional, and used for exactly two things: a hydration goal scaled to your size, and a " +
        "starting point for the weight chart on Health Records. Skip it and the goal stays at the " +
        "default eight cups.</p>" +

        '<div class="wh-field"><span class="wh-field__label">Units</span>' +
          '<div class="wh-row" id="ob-units">' +
            [["metric", "kg · cm"], ["imperial", "lb · in"]].map(function (o) {
              var on = draft.units === o[0];
              return '<button type="button" class="wh-btn wh-btn--sm' + (on ? " wh-btn--primary" : " wh-btn--ghost") +
                '" data-units="' + o[0] + '" aria-pressed="' + on + '">' + o[1] + "</button>";
            }).join("") +
          "</div></div>" +

        '<div class="wh-grid wh-grid--2 wh-mt4" style="gap:var(--wh-s3)">' +
          '<label class="wh-field"><span class="wh-field__label">Height (' + (imperial ? "in" : "cm") + ")</span>" +
            '<input class="wh-input" id="ob-h" type="number" step="0.1" value="' + hOut + '" /></label>' +
          '<label class="wh-field"><span class="wh-field__label">Weight (' + (imperial ? "lb" : "kg") + ")</span>" +
            '<input class="wh-input" id="ob-w" type="number" step="0.1" value="' + wOut + '" /></label>' +
        "</div>" +
        '<p class="wh-help">Stored in metric whatever you type, so switching units later never rewrites ' +
          "a number you saved.</p>",
      actions: [
        { label: "Back", variant: "ghost", close: false, onClick: function () { save4(); step3(); } },
        { label: "Next", variant: "primary", close: false, onClick: function () { save4(); step5(); } }
      ],
      onOpen: function (body) {
        Hub.delegate(body, "[data-units]", function (btn) {
          save4();
          draft.units = btn.dataset.units;
          step4();                        // re-render with the other unit labels
        });
      }
    });
  }

  function save4() {
    var imperial = draft.units === "imperial";
    var h = Number(val("ob-h"));
    var w = Number(val("ob-w"));
    draft.heightCm = h > 0 ? (imperial ? h * 2.54 : h) : null;
    draft.weightKg = w > 0 ? (imperial ? w / 2.2046226 : w) : null;
    if (draft.heightCm != null && (draft.heightCm < 80 || draft.heightCm > 260)) draft.heightCm = null;
    if (draft.weightKg != null && (draft.weightKg < 25 || draft.weightKg > 300)) draft.weightKg = null;
  }

  /* ---- step 5: goals ---- */
  function step5() {
    Hub.modal({
      title: "What are you here for?",
      body:
        stepHead(5) +
        "<p>Pick as many as apply. These decide which optional reminders get suggested on the next " +
        "screen — nothing more sinister than that.</p>" +
        '<div class="wh-row" style="flex-wrap:wrap" id="ob-goals">' +
          GOALS.map(function (g) {
            var on = draft.goals.indexOf(g.key) !== -1;
            return '<button type="button" class="wh-btn wh-btn--sm' + (on ? " wh-btn--primary" : " wh-btn--ghost") +
              '" data-goal="' + g.key + '" aria-pressed="' + on + '">' + Hub.esc(g.label) + "</button>";
          }).join("") +
        "</div>",
      actions: [
        { label: "Back", variant: "ghost", close: false, onClick: step4 },
        { label: "See what you suggest", variant: "primary", close: false, onClick: step6 }
      ],
      onOpen: function (body) {
        Hub.delegate(body, "[data-goal]", function (btn) {
          var k = btn.dataset.goal;
          var i = draft.goals.indexOf(k);
          if (i === -1) draft.goals.push(k); else draft.goals.splice(i, 1);
          var on = draft.goals.indexOf(k) !== -1;
          btn.classList.toggle("wh-btn--primary", on);
          btn.classList.toggle("wh-btn--ghost", !on);
          btn.setAttribute("aria-pressed", on);
        });
      }
    });
  }

  /* ---- step 6: the plan ---- */
  function step6() {
    /* Commit the profile first: the suggestion engine reads it from state, not
       from the draft, so that the same code produces the same list whether
       it's running here or from the dashboard a week later. */
    commitProfile();

    var list = pending();
    var checked = {};
    list.forEach(function (s) { checked[s.id] = !s.optional; });

    Hub.modal({
      title: "Suggested setup",
      body:
        stepHead(6) +
        (list.length
          ? "<p>Based on what you've told me. Untick anything you'd rather set up yourself — and all of " +
            "it is reversible from Settings afterwards.</p>" +
            '<div class="wh-stack wh-stack--sm" id="ob-sugg">' + list.map(function (s) {
              return '<button type="button" class="wh-check' + (checked[s.id] ? " is-done" : "") + '" ' +
                  'data-sugg="' + s.id + '" aria-pressed="' + !!checked[s.id] + '">' +
                '<span class="wh-check__box">' + Hub.icon("check") + "</span>" +
                '<span class="wh-check__text">' + Hub.esc(s.title) +
                  '<span class="wh-check__sub">' + Hub.esc(s.why) + "</span></span></button>";
            }).join("") + "</div>" +
            '<p class="wh-help wh-mt4">Reminders only fire while the app is open in a tab. Settings ' +
              "explains that properly, including how to install it as a real app so it stays open.</p>"
          : "<p>Nothing to suggest — either you've set it all up already, or you skipped the questions " +
            "that would have told me what to recommend. Everything is still available from Settings.</p>"),
      actions: [
        { label: "Back", variant: "ghost", close: false, onClick: step5 },
        { label: list.length ? "Apply and finish" : "Finish", variant: "primary", close: false,
          onClick: function () {
            var applied = 0;
            list.forEach(function (s) {
              if (checked[s.id]) { try { s.apply(); applied++; } catch (e) { console.warn("suggestion failed", s.id, e); } }
              else Hub.state.settings.dismissedSuggestions[s.id] = true;
            });

            prof().completedAt = new Date().toISOString();
            prof().skipped = false;
            Hub.closeModal();
            Hub.reminders.sync();
            Hub.commit();
            Hub.buildNav();
            Hub.updateChrome();

            if (applied) {
              Hub.toast(applied + " " + Hub.plural(applied, "thing") + " set up for you.", "success", 4000);
              /* Only ask for notification permission once there is actually
                 something to notify about. */
              var anyOn = Object.keys(Hub.state.settings.reminders).some(function (k) {
                return Hub.state.settings.reminders[k].enabled;
              });
              if (anyOn && Hub.notify.permission() === "default") {
                setTimeout(function () { Hub.notify.request(); }, 700);
              }
            } else {
              Hub.toast("Profile saved.", "success");
            }
          } }
      ],
      onOpen: function (body) {
        Hub.delegate(body, "[data-sugg]", function (btn) {
          var id = btn.dataset.sugg;
          checked[id] = !checked[id];
          btn.classList.toggle("is-done", checked[id]);
          btn.setAttribute("aria-pressed", !!checked[id]);
        });
      }
    });
  }

  function commitProfile() {
    var p = prof();
    var s = Hub.state.settings;
    s.name = draft.name;
    s.units = draft.units === "imperial" ? "imperial" : "metric";
    p.gender = draft.gender || null;
    p.birthYear = draft.birthYear;
    p.heightCm = draft.heightCm;
    p.weightKg = draft.weightKg;
    p.workStyle = draft.workStyle;
    p.sittingHours = draft.sittingHours;
    p.goals = draft.goals.slice();
    p.wakeTime = draft.wakeTime;
    p.bedTime = draft.bedTime;

    /* Height also belongs in the medical profile on Health Records, which is
       the copy a paramedic would be shown. One source, written to both. */
    if (p.heightCm) Hub.state.logs.profile.heightCm = Math.round(p.heightCm);
    Hub.save();
  }

  function stepHead(n) {
    return '<div class="wh-steps" aria-label="Step ' + n + ' of 6">' +
      [1, 2, 3, 4, 5, 6].map(function (i) {
        return '<span class="wh-steps__dot' + (i <= n ? " is-on" : "") + '"></span>';
      }).join("") +
      '<span class="wh-steps__label mono">' + n + " / 6</span></div>";
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value : "";
  }

  /* ======================================================================
     PUBLIC
     ====================================================================== */
  Hub.onboarding = {
    start: start,
    GOALS: GOALS,
    suggestions: allSuggestions,
    pending: pending,
    addScreenings: addScreenings,

    /* Has this person never answered and never declined? */
    needed: function () {
      var p = prof();
      return !p.completedAt && !p.skipped;
    },

    /* Apply one suggestion by id — used by the dashboard card and Settings. */
    applyOne: function (id) {
      var s = allSuggestions().filter(function (x) { return x.id === id; })[0];
      if (!s) return false;
      s.apply();
      Hub.reminders.sync();
      Hub.commit();
      Hub.buildNav();
      return true;
    },

    dismiss: function (id) {
      Hub.state.settings.dismissedSuggestions[id] = true;
      Hub.commit();
    },

    /* Bring back everything previously turned down. */
    resetDismissed: function () {
      Hub.state.settings.dismissedSuggestions = {};
      Hub.commit();
    },

    age: ageNow,
    shiftTime: shiftTime
  };
})();
