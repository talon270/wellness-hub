/* ============================================================================
   WELLNESS HUB · DENTAL CARE
   ----------------------------------------------------------------------------
   · A 2-minute brushing timer split into four 30-second quadrants, with a
     progress ring and an audio + vibration cue at every quadrant change
   · AM/PM brushing log (streak) and a separate daily flossing log (own streak)
   · Toothbrush replacement tracker — log the swap date, see time remaining
   · A tips library, framed explicitly as general education

   Nothing here is medical advice, and the UI says so where it matters.
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  var QUADRANTS = [
    { key: "ur", label: "Upper right", hint: "Outer, inner, then the chewing surfaces." },
    { key: "ul", label: "Upper left",  hint: "Small circles, 45° to the gum line." },
    { key: "ll", label: "Lower left",  hint: "Don't forget the inside of the front teeth." },
    { key: "lr", label: "Lower right", hint: "Finish with the chewing surfaces." }
  ];
  var QUAD_SECONDS = 30;
  var TOTAL_SECONDS = QUADRANTS.length * QUAD_SECONDS;   // 120s
  var BRUSH_LIFE_DAYS = 90;                              // ~3 months

  /* ======================================================================
     BRUSHING TIMER
     ====================================================================== */
  var brushTimer = null;

  function runBrushTimer() {
    var inner = Hub.focus.open(
      '<div class="wh-focus__title">🪥 Brushing — 2 minutes</div>' +
      '<div class="wh-focus__stage">' +
        Hub.ring(0, {
          size: 200, stroke: 12, color: "var(--aqua-bright)", aria: "Brushing progress",
          center: '<div class="wh-clock wh-clock--sm" id="br-clock">2:00</div>' +
                  '<div class="wh-ringwrap__lbl" id="br-quad">Upper right</div>'
        }) +
      "</div>" +
      '<div class="wh-brush__quadrants" id="br-quads">' +
        QUADRANTS.map(function (q, i) {
          return '<div class="wh-quad" data-q="' + i + '">' +
            '<span class="wh-quad__n">' + (i + 1) + " / 4</span>" + Hub.esc(q.label) + "</div>";
        }).join("") +
      "</div>" +
      '<div class="wh-focus__cue" id="br-cue">' + Hub.esc(QUADRANTS[0].hint) + "</div>" +
      '<div class="wh-focus__actions">' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="br-quit">' + Hub.icon("stop") + "Stop</button>" +
      "</div>",
      function () { if (brushTimer) { brushTimer.stop(); brushTimer = null; } }
    );

    var clockEl = inner.querySelector("#br-clock");
    var quadEl = inner.querySelector("#br-quad");
    var cueEl = inner.querySelector("#br-cue");
    var ringBar = inner.querySelector(".wh-ring__bar");
    var quadEls = inner.querySelectorAll("[data-q]");
    var circumference = parseFloat(ringBar.getAttribute("stroke-dasharray"));
    inner.querySelector("#br-quit").addEventListener("click", function () { Hub.focus.close(); });

    var currentQuad = -1;
    var lastWhole = -1;

    brushTimer = new Hub.Timer({
      duration: TOTAL_SECONDS,
      interval: 100,
      onTick: function (remaining, elapsed) {
        /* ring */
        ringBar.style.strokeDashoffset = (circumference * (1 - elapsed / TOTAL_SECONDS)).toFixed(2);

        /* clock, once per whole second */
        var whole = Math.ceil(remaining);
        if (whole !== lastWhole) {
          lastWhole = whole;
          clockEl.textContent = Hub.clock(whole);
        }

        /* quadrant change */
        var q = Math.min(QUADRANTS.length - 1, Math.floor(elapsed / QUAD_SECONDS));
        if (q !== currentQuad) {
          currentQuad = q;
          quadEl.textContent = QUADRANTS[q].label;
          cueEl.textContent = QUADRANTS[q].hint;
          quadEls.forEach(function (n, i) {
            n.classList.toggle("is-active", i === q);
            n.classList.toggle("is-done", i < q);
          });
          /* Gentle cue on every change except the very first paint. */
          if (q > 0) Hub.cueChange();
        }
      },
      onDone: function () { finishBrush(); }
    });
    brushTimer.start();
  }

  function finishBrush() {
    brushTimer = null;
    Hub.cueDone();

    /* Fill whichever slot is still open; before 14:00 that's the morning one. */
    var d = Hub.editDay();
    var slot = new Date().getHours() < 14 ? "brushAM" : "brushPM";
    if (d[slot]) slot = slot === "brushAM" ? "brushPM" : "brushAM";   // already logged — take the other
    d[slot] = true;
    Hub.commit();
    Hub.gamify.checkMilestone("dental");

    var both = d.brushAM && d.brushPM;
    var inner = Hub.focus.open(
      '<div class="wh-focus__title">✓ Two minutes done</div>' +
      '<p class="wh-muted wh-mt4">Logged as your ' + (slot === "brushAM" ? "morning" : "evening") + " brush. " +
        (both ? "That's both today — dental streak is safe." : "One more later today completes the day.") + "</p>" +
      '<div class="wh-focus__actions">' +
        (d.floss ? "" : '<button type="button" class="wh-btn wh-btn--primary" id="br-floss" data-focus-primary>Log flossing too</button>') +
        '<button type="button" class="wh-btn wh-btn--ghost" id="br-close">Done</button>' +
      "</div>"
    );
    inner.querySelector("#br-close").addEventListener("click", function () { Hub.focus.close(); });
    var flossBtn = inner.querySelector("#br-floss");
    if (flossBtn) flossBtn.addEventListener("click", function () {
      var day = Hub.editDay();
      day.floss = true;
      Hub.commit();
      Hub.gamify.checkMilestone("floss");
      Hub.focus.close();
      Hub.toast("Brushing and flossing logged.", "success");
    });
  }

  /* ======================================================================
     TIPS LIBRARY — general education, not clinical guidance
     ====================================================================== */
  var TIPS = [
    {
      emoji: "🪥", title: "Brushing technique",
      html:
        "<ul>" +
        "<li>Angle the bristles at about <strong>45° toward the gum line</strong>, not flat against the tooth — " +
        "that's where plaque actually collects.</li>" +
        "<li>Use short, gentle circles or tiny back-and-forth strokes. <strong>Scrubbing hard wears enamel and " +
        "recedes gums</strong>; pressure isn't what cleans.</li>" +
        "<li>Spend roughly 30 seconds per quadrant — the timer above enforces this.</li>" +
        "<li>Cover all three surfaces: outer, inner, chewing. The inner surfaces of the lower front teeth are the " +
        "most commonly missed spot in the mouth.</li>" +
        "<li>Spit, don't rinse. Rinsing washes away the fluoride you just applied.</li>" +
        "<li>After anything acidic (citrus, soda, wine), <strong>wait 30 minutes</strong> before brushing — enamel " +
        "is temporarily softened and brushing straight away scrubs it away.</li>" +
        "</ul>"
    },
    {
      emoji: "🧵", title: "Flossing & between the teeth",
      html:
        "<ul>" +
        "<li>Roughly <strong>35% of each tooth's surface</strong> sits between teeth where a brush simply cannot reach.</li>" +
        "<li>Curve the floss into a C-shape against each tooth and slide it gently under the gum line, rather than " +
        "snapping it straight down.</li>" +
        "<li>Use a fresh section of floss for each gap.</li>" +
        "<li>Interdental brushes or a water flosser are fine substitutes — the one you'll actually use daily beats the " +
        "theoretically ideal one you won't.</li>" +
        "<li>A little bleeding when you first start is common and usually settles within a week or two of consistent " +
        "flossing. Bleeding that persists is worth mentioning to a dentist.</li>" +
        "</ul>"
    },
    {
      emoji: "👅", title: "Tongue scraping",
      html:
        "<ul>" +
        "<li>The tongue's surface traps bacteria and debris — it's the <strong>main source of most bad breath</strong>.</li>" +
        "<li>Use a dedicated scraper or the back of your brush: from the back forward, a few light passes, rinsing between.</li>" +
        "<li>Don't push so far back that you gag, and don't press hard enough to irritate the surface.</li>" +
        "<li>Once a day, usually in the morning, is plenty.</li>" +
        "</ul>"
    },
    {
      emoji: "🔄", title: "Replacing your toothbrush",
      html:
        "<ul>" +
        "<li>Replace roughly <strong>every 3 months</strong>, or sooner if the bristles splay.</li>" +
        "<li>Splayed bristles clean noticeably worse long before they look worn out — flattening is the signal.</li>" +
        "<li>Replace after any illness such as flu or strep, since bristles can harbour organisms.</li>" +
        "<li>Let it air-dry upright and uncovered; a sealed cap keeps it damp, which is worse.</li>" +
        "<li>Use the tracker on this page to log each swap and see the countdown.</li>" +
        "</ul>"
    },
    {
      emoji: "🍎", title: "Diet for enamel & gums",
      html:
        "<ul>" +
        "<li>It's <strong>frequency, not quantity</strong>, that drives decay. Sipping a sugary drink over an hour is " +
        "far worse than drinking it in five minutes, because each sip restarts the acid attack.</li>" +
        "<li>Water between meals helps clear acid and sugar; plain water is the best default drink for teeth.</li>" +
        "<li>Cheese, plain yoghurt and other calcium sources help buffer acid and support remineralisation.</li>" +
        "<li>Crunchy raw vegetables and fruit stimulate saliva, which is your natural defence system.</li>" +
        "<li>Watch the hidden acids: sparkling water, citrus, sports drinks and vinegar dressings are all erosive even " +
        "when there's no sugar involved.</li>" +
        "<li>Saliva does the repair work, so anything that dries your mouth out — some medications, mouth breathing, " +
        "alcohol-heavy rinses — raises risk.</li>" +
        "</ul>"
    },
    {
      emoji: "🩺", title: "Signs worth watching for",
      html:
        "<p>General education only — this is not a diagnosis, and a dentist is the right person to look at any of it.</p>" +
        "<ul>" +
        "<li>Gums that <strong>bleed routinely</strong> when brushing or flossing, beyond the first week or two of a new habit.</li>" +
        "<li>Gums that look puffy, shiny or noticeably red rather than firm and pale pink.</li>" +
        "<li>Persistent bad breath or a persistent bad taste that brushing doesn't shift.</li>" +
        "<li>Gums receding, or teeth that look longer than they used to.</li>" +
        "<li>New sensitivity to hot, cold or sweet.</li>" +
        "<li>Any tooth that feels loose, or a change in how your teeth meet when you bite.</li>" +
        "<li>Any sore, lump or patch in the mouth that hasn't healed within about two weeks.</li>" +
        "</ul>"
    }
  ];

  /* ======================================================================
     RENDER
     ====================================================================== */
  function render(el) {
    var d = Hub.day();
    var st = Hub.state.streaks || {};
    var dental = st.dental || { current: 0, best: 0, doneToday: false };
    var floss = st.floss || { current: 0, best: 0, doneToday: false };
    var age = Hub.gamify.brushAgeDays();
    var left = age == null ? null : BRUSH_LIFE_DAYS - age;

    el.innerHTML =
      '<div class="wh-head">' +
        '<div class="wh-head__eyebrow">Dental care</div>' +
        "<h1>Two minutes, twice a day</h1>" +
        "<p>Timed brushing by quadrant, a flossing log, and a toothbrush that actually gets replaced on time.</p>" +
      "</div>" +

      /* ---------- streak stats ---------- */
      '<div class="wh-grid wh-grid--3 wh-mb4">' +
        '<div class="wh-stat"><div class="wh-stat__label">Brushing streak</div>' +
          '<div class="wh-stat__value">' + dental.current + "<small>days</small></div>" +
          '<div class="wh-stat__sub">AM + PM · best ' + dental.best + "</div></div>" +
        '<div class="wh-stat"><div class="wh-stat__label">Flossing streak</div>' +
          '<div class="wh-stat__value">' + floss.current + "<small>days</small></div>" +
          '<div class="wh-stat__sub">best ' + floss.best + "</div></div>" +
        '<div class="wh-stat"><div class="wh-stat__label">Brush age</div>' +
          '<div class="wh-stat__value">' + (age == null ? "—" : age) + "<small>days</small></div>" +
          '<div class="wh-stat__sub">' + (age == null ? "log a start date below" :
            (left > 0 ? left + " days until swap" : "overdue by " + (-left) + " days")) + "</div></div>" +
      "</div>" +

      /* ---------- timer ---------- */
      '<div class="wh-card wh-card--accent">' +
        '<div class="wh-card__head">' +
          '<div class="wh-card__title">' + Hub.icon("clockIc") + "Brushing timer</div>" +
          '<span class="wh-chip wh-chip--accent">4 × 30s</span>' +
        "</div>" +
        '<div class="wh-row wh-row--between">' +
          '<p class="wh-sm wh-muted wh-grow" style="min-width:220px">Two minutes split evenly across the four ' +
            "quadrants of your mouth, with a chime and a buzz each time it's time to move on. " +
            "Most people stop at around 45 seconds unaided — the timer is the whole trick.</p>" +
          '<button type="button" class="wh-btn wh-btn--primary wh-btn--lg" id="dn-start">' +
            Hub.icon("play") + "Start brushing</button>" +
        "</div>" +
        '<div class="wh-brush__quadrants wh-mt4" style="width:100%;max-width:none;grid-template-columns:repeat(4,1fr)">' +
          QUADRANTS.map(function (q, i) {
            return '<div class="wh-quad"><span class="wh-quad__n">' + (i + 1) + "</span>" + Hub.esc(q.label) + "</div>";
          }).join("") +
        "</div>" +
      "</div>" +

      /* ---------- daily log ---------- */
      '<div class="wh-grid wh-grid--2 wh-mt6">' +
        '<div class="wh-card">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("check") + "Today's log</div>" +
          '<span class="wh-chip">' + Hub.prettyDate(Hub.today()) + "</span></div>" +
          '<div class="wh-stack wh-stack--sm">' +
            checkRow("brushAM", "Morning brush", "Two minutes, all four quadrants", d.brushAM) +
            checkRow("brushPM", "Evening brush", "The more important of the two — plaque matures overnight", d.brushPM) +
            checkRow("floss", "Flossed", "Reaches the third of each tooth a brush can't", d.floss) +
            checkRow("tongue", "Tongue scraped", "Optional, but it's where most bad breath comes from", d.tongue) +
          "</div>" +
        "</div>" +

        /* ---------- toothbrush tracker ---------- */
        '<div class="wh-card">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("refresh") + "Toothbrush tracker</div></div>" +
          (age == null
            ? '<p class="wh-sm wh-muted">Log when your current toothbrush went into service and this will count ' +
              "down the ~3 months until it's due for replacement.</p>"
            : '<div class="wh-brushage">' +
                Hub.ring(Hub.pct(Math.min(age, BRUSH_LIFE_DAYS), BRUSH_LIFE_DAYS), {
                  size: 104, stroke: 9,
                  color: left > 14 ? "var(--aqua-bright)" : (left > 0 ? "var(--yellow-bright)" : "var(--red-bright)"),
                  aria: "Toothbrush " + age + " days old of " + BRUSH_LIFE_DAYS,
                  center: '<div class="wh-ringwrap__val">' + Math.max(0, left) + "</div>" +
                          '<div class="wh-ringwrap__lbl">days left</div>'
                }) +
                '<div class="wh-grow"><div class="wh-sm">In service since <strong class="mono">' +
                  Hub.prettyDate(Hub.state.logs.toothbrushISO) + "</strong></div>" +
                  '<div class="wh-xs wh-faint wh-mt4">' +
                    (left > 0
                      ? "Replace around " + Hub.prettyDate(Hub.shiftDay(Hub.state.logs.toothbrushISO, BRUSH_LIFE_DAYS)) + "."
                      : "Overdue — bristles this old clean noticeably worse.") +
                  "</div></div>" +
              "</div>") +
          '<div class="wh-row wh-mt4">' +
            '<button type="button" class="wh-btn ' + (left != null && left <= 0 ? "wh-btn--primary" : "wh-btn--ghost") + '" id="dn-newbrush">' +
              Hub.icon("plus") + "I started a new brush today</button>" +
          "</div>" +
          '<p class="wh-help wh-mt4">Swap within 100 days of the last one to earn the <strong>Fresh Bristles</strong> badge.</p>' +
        "</div>" +
      "</div>" +

      /* ---------- tips ---------- */
      '<h2 class="wh-h2 wh-mt6 wh-mb4">Tips library</h2>' +
      '<div id="dn-tips">' +
        TIPS.map(function (t, i) {
          return '<div class="wh-acc" data-acc="' + i + '">' +
            '<button type="button" class="wh-acc__btn" aria-expanded="false">' +
              '<span class="wh-acc__emoji">' + t.emoji + "</span>" + Hub.esc(t.title) + "</button>" +
            '<div class="wh-acc__body">' + t.html + "</div>" +
          "</div>";
        }).join("") +
      "</div>" +

      '<div class="wh-disclaimer wh-mt4">' + Hub.icon("alert") +
        "<span>Everything in this tab is <strong>general education, not medical or dental advice</strong>. " +
        "It can't diagnose anything, and it isn't a substitute for regular check-ups. If something in your mouth " +
        "hurts, bleeds persistently or has changed, see a dentist.</span></div>";

    wire(el);
  }

  function checkRow(key, label, sub, on) {
    return '<button type="button" class="wh-check' + (on ? " is-done" : "") + '" data-toggle="' + key + '" ' +
        'aria-pressed="' + (on ? "true" : "false") + '">' +
      '<span class="wh-check__box">' + Hub.icon("check") + "</span>" +
      '<span class="wh-check__text">' + Hub.esc(label) +
        '<span class="wh-check__sub">' + Hub.esc(sub) + "</span></span>" +
    "</button>";
  }

  /* ======================================================================
     EVENTS
     ====================================================================== */
  function wire(el) {
    el.querySelector("#dn-start").addEventListener("click", runBrushTimer);

    Hub.delegate(el, "[data-toggle]", function (btn) {
      var key = btn.dataset.toggle;
      var d = Hub.editDay();
      d[key] = !d[key];
      Hub.commit();
      if (key === "floss" && d.floss) Hub.gamify.checkMilestone("floss");
      if ((key === "brushAM" || key === "brushPM") && d.brushAM && d.brushPM) Hub.gamify.checkMilestone("dental");
      if (d[key]) Hub.beep(700, 90);
    });

    el.querySelector("#dn-newbrush").addEventListener("click", function () {
      var prev = Hub.state.logs.toothbrushISO;
      var age = prev ? Hub.daysBetween(prev, Hub.today()) : null;

      Hub.confirm({
        title: "Start a new toothbrush?",
        body: prev
          ? "Your current brush has been in service for <strong>" + age + " days</strong>. " +
            "This resets the countdown to today."
          : "This records today as the start date for your current toothbrush and begins the ~3 month countdown.",
        confirmLabel: "Yes, it's new",
        variant: "primary",
        onConfirm: function () {
          /* The badge rewards swapping *before* things get grim — only stamp it
             when there was a previous brush and it was replaced in good time. */
          if (prev && age != null && age <= 100) Hub.state.meta.brushSwapOnTime = true;
          Hub.state.logs.toothbrushISO = Hub.today();
          Hub.commit();
          Hub.toast("New toothbrush logged. Next swap in " + BRUSH_LIFE_DAYS + " days.", "success");
        }
      });
    });

    /* Tips accordion */
    Hub.delegate(el, ".wh-acc__btn", function (btn) {
      var acc = btn.closest(".wh-acc");
      var open = acc.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  Hub.registerView("dental", render);
  /* Reachable from the "Brushing timer" app shortcut (?go=dental&action=brush). */
  Hub.registerAction("brush", runBrushTimer);
})();
