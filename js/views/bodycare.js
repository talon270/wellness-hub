/* ============================================================================
   WELLNESS HUB · BODY CARE
   ----------------------------------------------------------------------------
   The parts of "looking after yourself" that don't belong to teeth or eyes:

     skin    AM/PM routines, sunscreen with a re-apply counter, monthly self-exam
     hair    wash cadence and scalp care
     nails   hand and toe nail trims on an interval, with due-date nudges
     hands   grip and callus care — the specific failure point in calisthenics
     feet    daily check, footwear rotation, and intrinsic foot strength

   Every routine is a checklist of items stored in the day record under `body`,
   so adding an item is a one-line data change.
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  var PILLS = [
    { id: "skin",  label: "Skin & Sun", icon: "sun" },
    { id: "hair",  label: "Hair & Scalp", icon: "hair" },
    { id: "nails", label: "Nails", icon: "hand" },
    { id: "hands", label: "Hands & Grip", icon: "hand" },
    { id: "feet",  label: "Feet", icon: "foot" },
    { id: "hearing", label: "Hearing", icon: "ear" }
  ];

  function currentPill() {
    var p = Hub.uiGet("bodyPill", "skin");
    return PILLS.some(function (x) { return x.id === p; }) ? p : "skin";
  }

  /* Shared helper: a checklist bound to keys inside `day.body`. */
  function checklist(items) {
    var body = Hub.day().body || {};
    return '<div class="wh-stack wh-stack--sm">' + items.map(function (it) {
      var on = !!body[it.key];
      return '<button type="button" class="wh-check' + (on ? " is-done" : "") + '" data-body="' + it.key + '" ' +
          'aria-pressed="' + on + '">' +
        '<span class="wh-check__box">' + Hub.icon("check") + "</span>" +
        '<span class="wh-check__text">' + Hub.esc(it.label) +
          '<span class="wh-check__sub">' + Hub.esc(it.sub) + "</span></span></button>";
    }).join("") + "</div>";
  }

  /* Shared helper: "last done N days ago, next due in M" for interval tasks
     tracked as a date in settings rather than a daily tick. */
  function intervalCard(opts) {
    var last = Hub.state.logs[opts.stateKey];
    var days = last ? Hub.daysBetween(last, Hub.today()) : null;
    var left = days == null ? null : opts.intervalDays - days;
    var color = left == null ? "var(--wh-accent)"
      : (left > 2 ? "var(--wh-accent)" : (left >= 0 ? "var(--yellow-bright)" : "var(--orange-bright)"));

    return '<div class="wh-card">' +
      '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon(opts.icon) + Hub.esc(opts.title) + "</div></div>" +
      (last
        ? '<div class="wh-brushage">' +
            Hub.ring(Hub.pct(Math.min(days, opts.intervalDays), opts.intervalDays), {
              size: 92, stroke: 8, color: color,
              aria: days + " days since " + opts.title,
              center: '<div class="wh-ringwrap__val">' + Math.max(0, left) + "</div>" +
                      '<div class="wh-ringwrap__lbl">days left</div>'
            }) +
            '<div class="wh-grow"><div class="wh-sm">Last done <strong class="mono">' + Hub.relDay(last) + "</strong></div>" +
            '<div class="wh-xs wh-faint wh-mt4">' +
              (left > 0 ? "Next due " + Hub.prettyDate(Hub.shiftDay(last, opts.intervalDays))
                        : "Due now — it's been " + days + " days.") + "</div></div>" +
          "</div>"
        : '<p class="wh-sm wh-muted">' + Hub.esc(opts.empty) + "</p>") +
      '<button type="button" class="wh-btn ' + (left != null && left <= 0 ? "wh-btn--primary" : "wh-btn--ghost") +
        ' wh-mt4" data-interval="' + opts.stateKey + '">' + Hub.icon("check") + Hub.esc(opts.action) + "</button>" +
      (opts.help ? '<p class="wh-help wh-mt4">' + opts.help + "</p>" : "") +
    "</div>";
  }

  /* ======================================================================
     SKIN & SUN
     ====================================================================== */
  var SKIN_AM = [
    { key: "skinAM",     label: "Morning routine done", sub: "Cleanse (or just water), moisturise, then sunscreen" },
    { key: "spf",        label: "Sunscreen applied",    sub: "The single highest-value thing on this page for long-term skin" },
    { key: "lips",       label: "Lip balm with SPF",    sub: "Lips have almost no natural melanin protection" }
  ];
  var SKIN_PM = [
    { key: "skinPM",     label: "Evening routine done", sub: "Cleanse off sunscreen, sweat and the day, then moisturise" },
    { key: "bodyMoist",  label: "Body moisturiser",     sub: "Best applied within a few minutes of a shower" },
    { key: "noPick",     label: "Left my skin alone",   sub: "Picking is what turns a spot into a scar" }
  ];

  var SKIN_TIPS = [
    ["Sunscreen is the whole game", "Cumulative UV drives most visible ageing and the majority of skin-cancer risk. Broad-spectrum SPF 30+ daily, on anything the sun reaches, does more than every other product combined."],
    ["Reapply, don't just apply", "Sunscreen degrades. Every two hours outdoors, and straight after swimming or heavy sweating — a morning application is not a day's protection."],
    ["UV goes through cloud and glass", "Up to 80% of UV penetrates cloud, and UVA passes through window glass. Overcast days and desk-by-a-window count."],
    ["Lukewarm, short showers", "Hot water strips the skin barrier. Cooler and shorter, then moisturise while still slightly damp."],
    ["Simple beats elaborate", "Cleanse, moisturise, protect. A short routine you do daily beats a ten-step one you abandon in a fortnight."],
    ["Introduce one thing at a time", "If something reacts, you can only identify the culprit if you changed one variable. Give each new product two weeks."],
    ["Sweat is not the enemy — leaving it on is", "Rinse after training. Sitting in salt and friction is what causes most exercise-related breakouts."]
  ];

  var skin = {
    render: function () {
      var d = Hub.day();
      var st = (Hub.state.streaks && Hub.state.streaks.bodycare) || { current: 0, best: 0 };
      var rem = Hub.state.settings.reminders.spf;

      return '<div class="wh-grid wh-grid--2 wh-mb4">' +
          '<div class="wh-card wh-card--accent">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("sun") + "Morning</div>" +
              '<span class="wh-chip">' + Hub.prettyDate(Hub.today()) + "</span></div>" +
            checklist(SKIN_AM) +
          "</div>" +
          '<div class="wh-card">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("moon") + "Evening</div>" +
              '<span class="wh-chip' + (st.current ? " wh-chip--good" : "") + '">' + st.current + "d streak</span></div>" +
            checklist(SKIN_PM) +
          "</div>" +
        "</div>" +

        /* ---------- sunscreen reapply ---------- */
        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("shield") + "Sunscreen re-application</div>" +
            '<span class="wh-chip wh-chip--accent">' + d.spfReapply + " today</span></div>" +
          '<p class="wh-sm wh-muted">Sunscreen breaks down as it absorbs UV. If you\'re outdoors, ' +
            "reapply <strong>every two hours</strong>, and immediately after swimming or heavy sweating. " +
            "Roughly a teaspoon for the face and neck, a shot glass for the whole body — most people " +
            "apply a quarter of what they need.</p>" +
          '<div class="wh-row wh-mt4">' +
            '<button type="button" class="wh-btn wh-btn--primary" id="bc-spf">' + Hub.icon("plus") + "Reapplied just now</button>" +
            '<label class="wh-switch"><input type="checkbox" id="bc-spf-remind"' + (rem.enabled ? " checked" : "") + " />" +
              '<span class="wh-switch__track"></span>' +
              '<span class="wh-switch__label">Remind me every ' + rem.intervalMin + " minutes</span></label>" +
          "</div>" +
          '<p class="wh-help wh-mt4">Turn the reminder off when you go indoors for the day — it doesn\'t ' +
            "know where you are.</p>" +
        "</div>" +

        /* ---------- monthly self-exam ---------- */
        intervalCard({
          stateKey: "skinCheckISO", intervalDays: 30, icon: "eye",
          title: "Monthly skin self-exam",
          empty: "Check your skin once a month in good light, including your back, scalp and the soles " +
                 "of your feet. Log it here and this will remind you when the next one is due.",
          action: "I checked my skin today",
          help: "<strong>ABCDE</strong> — <strong>A</strong>symmetry · irregular <strong>B</strong>orders · " +
                "uneven <strong>C</strong>olour · <strong>D</strong>iameter over ~6mm · " +
                "<strong>E</strong>volving (changing size, shape, colour, or newly itching or bleeding). " +
                "Any of these, or anything that simply looks different from your other moles, is worth a doctor's opinion."
        }) +

        /* ---------- mole photo log ---------- */
        Hub.photoUI.card({
          kind: "skin",
          icon: "camera",
          title: "Mole &amp; skin photo log",
          intro: "A self-exam only tells you something if you can compare it with last time. " +
                 "Photograph anything you're keeping an eye on, name it (\"left shoulder\", \"back, " +
                 "below the blade\"), and the app lines up the same subject over time. Include " +
                 "something for scale — a ruler or a coin — and use the same light if you can.",
          help: "Photos stay on this device, in the app's own storage, and are included in your backups. " +
                "They are never uploaded anywhere.",
          disclaimer: "A photo series is a memory aid, not a diagnosis, and no app can tell a harmless " +
                      "mole from a melanoma. If something is new, changing, itching, bleeding or simply " +
                      "looks unlike your others, get it seen — don't wait for the next photo."
        }) +

        '<h2 class="wh-h2 wh-mt6 wh-mb4">Skin principles</h2>' +
        '<div class="wh-grid wh-grid--auto">' + SKIN_TIPS.map(function (t) {
          return '<div class="wh-card wh-card--tight"><div class="wh-h3 wh-mb4">' + Hub.esc(t[0]) + "</div>" +
            '<p class="wh-card__note">' + Hub.esc(t[1]) + "</p></div>";
        }).join("") + "</div>" +

        '<div class="wh-disclaimer wh-mt4">' + Hub.icon("alert") +
          "<span>General skin-care information only. A self-exam is not a screening — it's a prompt to get " +
          "something looked at. Any new, changing, non-healing or unusual lesion should be seen by a doctor.</span></div>";
    },

    wire: function (el) {
      el.querySelector("#bc-spf").addEventListener("click", function () {
        var d = Hub.editDay();
        d.spfReapply++;
        d.body.spf = true;
        Hub.commit();
        Hub.reminders.reset("spf");
        Hub.beep(700, 90);
        Hub.toast("Sunscreen logged — " + d.spfReapply + " today.", "success", 2200);
      });
      el.querySelector("#bc-spf-remind").addEventListener("change", function (e) {
        toggleReminder("spf", e.target.checked);
      });
      Hub.photoUI.wire(el, "skin");
    }
  };

  /* ======================================================================
     HAIR & SCALP
     ====================================================================== */
  var HAIR_ITEMS = [
    { key: "hairWash",  label: "Washed hair",           sub: "Frequency depends entirely on your hair and scalp — there's no universal number" },
    { key: "scalpCare", label: "Scalp attended to",     sub: "Massage while washing; the scalp is skin and gets dry and flaky too" },
    { key: "hairDry",   label: "Dried gently",          sub: "Blot rather than rub; hair is at its most fragile when wet" },
    { key: "noHeat",    label: "Skipped heat styling",  sub: "Or used a heat protectant if you didn't" }
  ];

  var HAIR_TIPS = [
    ["Wash frequency is personal", "Oily scalps may need daily washing; dry or coarse hair often does better every few days. Flaking, itching or greasiness are your signals — not a rule you read somewhere."],
    ["Condition the lengths, not the roots", "The ends are the oldest and most damaged part. The roots make their own oil."],
    ["Heat is the main cause of damage", "Air-dry when you can. When you can't, use the lowest effective heat and a protectant."],
    ["Tight styles cost you hair", "Persistent tension from tight ponytails, buns or braids causes traction hair loss, often at the hairline. Vary where the tension sits."],
    ["Dandruff is usually treatable", "Persistent flaking with itch is commonly seborrhoeic dermatitis, which responds to medicated shampoos. Worth a pharmacist or GP conversation rather than more washing."],
    ["Sudden shedding is worth investigating", "Gradual thinning is often genetic. Sudden diffuse shedding can follow illness, stress, or a nutritional gap and is usually reversible — but get it looked at."]
  ];

  var hair = {
    render: function () {
      return '<div class="wh-grid wh-grid--2 wh-mb4">' +
          '<div class="wh-card wh-card--accent">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("hair") + "Today</div></div>" +
            checklist(HAIR_ITEMS) +
          "</div>" +
          intervalCard({
            stateKey: "haircutISO", intervalDays: 56, icon: "calendar",
            title: "Haircut / trim",
            empty: "Log your last cut and this will count down the usual 6–8 weeks. Regular trims " +
                   "remove split ends before they travel up the shaft.",
            action: "I got it cut today",
            help: "Six to eight weeks is typical for short styles; longer hair can go considerably further."
          }) +
        "</div>" +

        '<h2 class="wh-h2 wh-mb4">Hair &amp; scalp notes</h2>' +
        '<div class="wh-grid wh-grid--auto">' + HAIR_TIPS.map(function (t) {
          return '<div class="wh-card wh-card--tight"><div class="wh-h3 wh-mb4">' + Hub.esc(t[0]) + "</div>" +
            '<p class="wh-card__note">' + Hub.esc(t[1]) + "</p></div>";
        }).join("") + "</div>";
    },
    wire: function () {}
  };

  /* ======================================================================
     NAILS
     ====================================================================== */
  var nails = {
    render: function () {
      return '<div class="wh-grid wh-grid--2 wh-mb4">' +
          intervalCard({
            stateKey: "nailsHandsISO", intervalDays: 10, icon: "hand",
            title: "Fingernails",
            empty: "Trim roughly every 7–10 days. Long nails tear during pulling work and trap dirt.",
            action: "Trimmed my fingernails",
            help: "Cut straight across then round the corners slightly with a file. Never cut cuticles — " +
                  "push them back gently after a shower instead; they're a seal against infection."
          }) +
          intervalCard({
            stateKey: "nailsFeetISO", intervalDays: 21, icon: "foot",
            title: "Toenails",
            empty: "Trim roughly every 2–3 weeks. Overlong toenails bruise and blacken during running.",
            action: "Trimmed my toenails",
            help: "Cut <strong>straight across</strong> and don't round the corners — rounding is what drives " +
                  "nails to grow into the skin. Leave a little white edge showing."
          }) +
        "</div>" +

        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("check") + "Today</div></div>" +
          checklist([
            { key: "cuticle",  label: "Cuticles moisturised", sub: "A drop of oil or cream; they crack and catch when dry" },
            { key: "nailsDry", label: "Dried hands and feet properly", sub: "Especially between the toes — damp skin is where fungus starts" }
          ]) +
        "</div>" +

        '<div class="wh-card">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("info") + "What nails can tell you</div></div>" +
          '<p class="wh-sm wh-muted">Nails grow slowly, so changes reflect the last several months. ' +
            "None of the following is diagnostic on its own, but each is worth mentioning to a doctor if it's new " +
            "and persistent:</p>" +
          '<ul class="wh-ex__steps wh-mt4">' +
            "<li>Deep horizontal ridges across the nail, which can follow a period of illness or stress.</li>" +
            "<li>Persistent white or yellow thickening and crumbling, often fungal.</li>" +
            "<li>A dark streak running the length of a nail that's new or changing.</li>" +
            "<li>Marked spooning or clubbing of the nail shape.</li>" +
            "<li>Redness, swelling or pain around the nail fold that doesn't settle.</li>" +
          "</ul>" +
          '<p class="wh-help wh-mt4">Vertical ridges and the occasional white spot are extremely common ' +
            "and generally mean nothing at all.</p>" +
        "</div>";
    },
    wire: function () {}
  };

  /* ======================================================================
     HANDS & GRIP  — the calisthenics-specific one
     ====================================================================== */
  var HAND_ITEMS = [
    { key: "handMoist",  label: "Moisturised hands",        sub: "Dry, cracked skin tears far more easily on a bar" },
    { key: "callusCare", label: "Filed calluses back",      sub: "Keep them flat and smooth — raised ridges are what rip" },
    { key: "gripRelease", label: "Released forearms & grip", sub: "Massage the forearms and open the fingers wide after pulling work" },
    { key: "handWash",   label: "Washed hands properly",     sub: "20 seconds, including between the fingers and under the nails" }
  ];

  var hands = {
    render: function () {
      return '<div class="wh-card wh-card--accent wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("hand") + "Grip &amp; callus care</div></div>" +
          '<p class="wh-sm wh-muted">If you\'re doing pull-ups and hangs, your hands are training equipment. ' +
            "A torn callus costs a week of pulling work, and it's entirely preventable: calluses tear when they're " +
            "<strong>raised</strong> and catch on the bar, not when they're thick and flat.</p>" +
          '<div class="wh-mt4">' + checklist(HAND_ITEMS) + "</div>" +
        "</div>" +

        '<div class="wh-grid wh-grid--2 wh-mb4">' +
          intervalCard({
            stateKey: "callusISO", intervalDays: 14, icon: "hand",
            title: "Callus maintenance",
            empty: "File your calluses flat every week or two, after a shower when the skin is soft. " +
                   "Log it here to keep the cadence.",
            action: "Filed them down today",
            help: "Use a pumice stone or a fine file, and take off the raised ridge only. Don't remove the " +
                  "callus entirely — that thickened skin is protection you've earned."
          }) +
          '<div class="wh-card">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("shield") + "If one tears</div></div>" +
            '<ul class="wh-ex__steps">' +
              "<li>Trim the loose flap flush rather than pulling it off.</li>" +
              "<li>Clean it, and keep it covered and moist while it closes.</li>" +
              "<li>Stay off the bar until it's sealed — a few days now beats a fortnight later.</li>" +
              "<li>Chalk keeps hands dry but dries the skin; moisturise afterwards.</li>" +
              "<li>Spreading redness, heat or pus means see a doctor, not more tape.</li>" +
            "</ul>" +
          "</div>" +
        "</div>" +

        '<div class="wh-card">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("stretchIc") + "Wrist &amp; hand health</div></div>" +
          '<p class="wh-sm wh-muted">Gripping is only half the equation. The muscles that <em>open</em> the ' +
            "hand almost never get worked, and that imbalance shows up as forearm and elbow pain.</p>" +
          '<ul class="wh-ex__steps wh-mt4">' +
            "<li><strong>Finger extensions</strong> — a rubber band around all five fingertips, open against it. 2–3 sets of 15.</li>" +
            "<li><strong>Wrist curls both ways</strong> — light weight, full range, flexion and extension.</li>" +
            "<li><strong>Dead hangs</strong> — decompress the shoulders and build grip endurance at once.</li>" +
            "<li><strong>Wrist prep before pushing</strong> — the routine in the Mobility tab takes three minutes.</li>" +
          "</ul>" +
          '<button type="button" class="wh-btn wh-btn--ghost wh-btn--sm wh-mt4" data-goto="mobility">' +
            Hub.icon("stretchIc") + "Open wrist prep routine</button>" +
        "</div>";
    },
    wire: function (el) {
      Hub.delegate(el, "[data-goto]", function (b) {
        Hub.uiSet("mobilityPill", "routines");
        Hub.show(b.dataset.goto);
      });
    }
  };

  /* ======================================================================
     FEET
     ====================================================================== */
  var FOOT_ITEMS = [
    { key: "footCheck",  label: "Checked my feet",        sub: "Blisters, hot spots, cracks, anything between the toes" },
    { key: "footDry",    label: "Dried between the toes", sub: "The most-skipped step, and where athlete's foot begins" },
    { key: "footMoist",  label: "Moisturised heels",      sub: "Everywhere except between the toes, which should stay dry" },
    { key: "sockChange", label: "Fresh socks",            sub: "Twice on heavy training days" },
    { key: "barefoot",   label: "Time barefoot",          sub: "Lets the intrinsic foot muscles actually do their job" }
  ];

  var FOOT_TIPS = [
    ["Rotate your shoes", "Foam needs 24 hours to decompress. Alternating two pairs makes both last longer and cushions better than wearing one into the ground."],
    ["Replace running shoes on distance", "Roughly every 500–800km, or when the midsole stops springing back. Uppers usually look fine long after the cushioning is gone."],
    ["Blisters come from friction and moisture", "Fix the fit and manage sweat. If one forms, leave the roof on where you can — it's the best dressing available."],
    ["Toe splay is trainable", "Toe spreads, toe yoga and short-foot drills rebuild muscles that decades of narrow shoes switched off."],
    ["Heel pain in the first steps of the morning", "That specific pattern is the classic plantar fasciitis signal. Calf and foot mobility help; persistent pain needs proper assessment."],
    ["Athlete's foot is common and treatable", "Itchy, scaly, often between the fourth and fifth toes. Antifungal from a pharmacy, plus keeping the area genuinely dry."],
    ["Never ignore numbness", "Persistent numbness, tingling or a wound that isn't healing — particularly if you have diabetes — needs medical attention promptly, not a foot soak."]
  ];

  var feet = {
    render: function () {
      return '<div class="wh-grid wh-grid--2 wh-mb4">' +
          '<div class="wh-card wh-card--accent">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("foot") + "Daily foot check</div></div>" +
            '<p class="wh-sm wh-muted wh-mb4">Thirty seconds. Your feet take every step and every jump, ' +
              "and they're the body part people look at least.</p>" +
            checklist(FOOT_ITEMS) +
          "</div>" +
          '<div class="wh-stack">' +
            intervalCard({
              stateKey: "shoesISO", intervalDays: 180, icon: "calendar",
              title: "Training shoes",
              empty: "Log when your current training shoes went into service. Midsole foam packs out " +
                     "long before the upper looks worn.",
              action: "Started a new pair today",
              help: "Roughly 500–800km for running shoes. If they feel flat or you're picking up new aches, " +
                    "that's the signal regardless of the number."
            }) +
            '<div class="wh-card">' +
              '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("stretchIc") + "Foot strength drills</div></div>" +
              '<ul class="wh-ex__steps">' +
                "<li><strong>Toe spreads</strong> — actively fan the toes apart and hold. 10 reps.</li>" +
                "<li><strong>Toe yoga</strong> — lift the big toe alone, then the other four alone.</li>" +
                "<li><strong>Short foot</strong> — pull the ball of the foot toward the heel to raise the arch, without curling the toes.</li>" +
                "<li><strong>Calf raises</strong> — slow, full range, over a step edge. Directly transfers to jumping and running.</li>" +
                "<li><strong>Ball roll</strong> — a tennis or lacrosse ball under the arch for a minute per side.</li>" +
              "</ul>" +
            "</div>" +
          "</div>" +
        "</div>" +

        '<h2 class="wh-h2 wh-mb4">Foot care notes</h2>' +
        '<div class="wh-grid wh-grid--auto">' + FOOT_TIPS.map(function (t) {
          return '<div class="wh-card wh-card--tight"><div class="wh-h3 wh-mb4">' + Hub.esc(t[0]) + "</div>" +
            '<p class="wh-card__note">' + Hub.esc(t[1]) + "</p></div>";
        }).join("") + "</div>";
    },
    wire: function () {}
  };


  /* ======================================================================
     HEARING
     ----------------------------------------------------------------------
     The one form of damage on this page that is genuinely permanent and
     entirely preventable. Noise-induced hearing loss doesn't heal, so the
     framing here is prevention and exposure awareness rather than treatment.
     ====================================================================== */
  var HEARING_ITEMS = [
    { key: "volume60",   label: "Kept headphones under ~60%", sub: "The 60/60 rule: no more than 60% volume for 60 minutes at a time" },
    { key: "earRest",    label: "Gave my ears quiet time",    sub: "After loud exposure, quiet is what lets the hair cells recover" },
    { key: "earPlugs",   label: "Wore hearing protection",    sub: "Gigs, power tools, motorbikes — anywhere you'd have to shout" },
    { key: "noCotton",   label: "Didn't put anything in my ears", sub: "Cotton buds push wax deeper and risk the eardrum" }
  ];

  var HEARING_TIPS = [
    ["Damage is cumulative and permanent", "Hair cells in the cochlea don't regenerate. Every loud exposure spends a little of a budget you can never top up — which is why prevention is the entire game."],
    ["The 60/60 rule", "Under 60% volume, under 60 minutes at a stretch, then a break. If someone an arm's length away can hear your headphones, they're too loud."],
    ["85 decibels is the line", "Around 85dB, damage starts accruing after about eight hours. Every 3dB above that roughly halves the safe time — at 100dB you're into minutes, not hours."],
    ["Noise-cancelling helps, indirectly", "Not because it's gentler, but because it removes the background noise you'd otherwise be turning the volume up to beat."],
    ["Ringing after an event is a warning", "Temporary tinnitus or muffled hearing after a loud night means you exceeded a safe dose. It usually settles — but the wear it represents doesn't undo."],
    ["Earplugs don't ruin live music", "Musicians' filter plugs cut volume fairly evenly across frequencies rather than muffling. You lose loudness, not fidelity."],
    ["Ears are self-cleaning", "Wax migrates out on its own. Cotton buds compact it against the eardrum, which is how most impactions and perforations happen."],
    ["Worth getting checked", "Persistent or one-sided tinnitus, sudden hearing loss, ear pain, discharge, or dizziness with hearing change — sudden loss especially is treated as urgent."]
  ];

  var hearing = {
    render: function () {
      var d = Hub.day();
      var loud = d.loudMinutes || 0;
      /* Seven-day exposure, which is the window that actually matters. */
      var week = 0, ratedDays = [];
      for (var i = 0; i < 7; i++) {
        var k = Hub.shiftDay(Hub.today(), -i);
        var day = Hub.day(k);
        week += day.loudMinutes || 0;
        if (day.tinnitus != null) ratedDays.push({ date: k, level: day.tinnitus });
      }

      var tone = week >= 600 ? "bad" : (week >= 300 ? "warn" : "good");
      var verdict = week >= 600
        ? "That's a lot of loud time. Worth protecting."
        : (week >= 300 ? "Moderate — keep an eye on it." : "Light exposure this week.");

      return '<div class="wh-grid wh-grid--2 wh-grid--top wh-mb4">' +
          '<div class="wh-card wh-card--accent">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("ear") + "Loud exposure today</div>" +
              '<span class="wh-chip wh-chip--' + tone + '">' + Math.round(week / 60 * 10) / 10 + "h this week</span></div>" +
            '<p class="wh-sm wh-muted">Roughly how long you spent somewhere you had to raise your voice — ' +
              "headphones included. This is an estimate, not a measurement.</p>" +
            '<div class="wh-row wh-mt4">' +
              [15, 30, 60].map(function (m) {
                return '<button type="button" class="wh-btn wh-btn--sm" data-loud="' + m + '">+' + m + " min</button>";
              }).join("") +
              (loud ? '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" data-loud="reset">Clear</button>' : "") +
            "</div>" +
            '<div class="wh-row wh-row--between wh-mt4">' +
              '<span class="wh-sm wh-faint">Today</span>' +
              '<span class="mono" style="font-size:19px;color:var(--fg0)">' + loud + " min</span>" +
            "</div>" +
            '<p class="wh-help wh-mt4">' + verdict + "</p>" +
          "</div>" +

          '<div class="wh-card">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("check") + "Today's habits</div></div>" +
            checklist(HEARING_ITEMS) +
          "</div>" +
        "</div>" +

        /* ---------- tinnitus ---------- */
        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("pulse") + "Ringing / tinnitus</div>" +
            '<span class="wh-chip">optional</span></div>' +
          '<p class="wh-sm wh-muted">If you get ringing, rate it. A record of when it spikes — and what ' +
            "you were doing the day before — is genuinely useful to bring to an audiologist.</p>" +
          '<div class="wh-rate wh-mt4" role="group" aria-label="Tinnitus level today">' +
            [0, 1, 2, 3, 4, 5].map(function (n) {
              var on = d.tinnitus === n;
              return '<button type="button" class="wh-rate__btn' + (on ? " is-on" : "") + '" ' +
                'data-tinnitus="' + n + '" aria-pressed="' + on + '">' + n + "</button>";
            }).join("") +
          "</div>" +
          '<span class="wh-help">0 = none · 5 = intrusive. Tap the same number again to clear it.</span>' +
          (ratedDays.length
            ? '<div class="wh-mt6"><div class="wh-xs wh-faint wh-mb4">Last 7 days</div>' +
              '<div class="wh-loglist">' + ratedDays.map(function (r) {
                return '<div class="wh-logrow"><span class="wh-logrow__date">' + Hub.prettyDate(r.date) + "</span>" +
                  '<span class="wh-logrow__main">' + r.level + "/5</span></div>";
              }).join("") + "</div></div>"
            : "") +
        "</div>" +

        '<h2 class="wh-h2 wh-mb4">Hearing notes</h2>' +
        '<div class="wh-grid wh-grid--auto">' + HEARING_TIPS.map(function (t) {
          return '<div class="wh-card wh-card--tight"><div class="wh-h3 wh-mb4">' + Hub.esc(t[0]) + "</div>" +
            '<p class="wh-card__note">' + Hub.esc(t[1]) + "</p></div>";
        }).join("") + "</div>" +

        '<div class="wh-disclaimer wh-mt4">' + Hub.icon("alert") +
          "<span>General hearing-health information, not an assessment. <strong>Sudden hearing loss is a " +
          "medical emergency</strong> — treated within days it often recovers, left alone it frequently " +
          "doesn't. Persistent or one-sided tinnitus, ear pain, discharge or dizziness all warrant a " +
          "proper examination.</span></div>";
    },

    wire: function (el) {
      Hub.delegate(el, "[data-loud]", function (b) {
        var d = Hub.editDay();
        if (b.dataset.loud === "reset") d.loudMinutes = 0;
        else d.loudMinutes = (d.loudMinutes || 0) + Number(b.dataset.loud);
        Hub.commit();
        Hub.beep(560, 80);
      });
      Hub.delegate(el, "[data-tinnitus]", function (b) {
        var d = Hub.editDay();
        var n = Number(b.dataset.tinnitus);
        d.tinnitus = d.tinnitus === n ? null : n;
        Hub.commit();
      });
    }
  };

  /* ======================================================================
     SHARED
     ====================================================================== */
  function toggleReminder(key, on) {
    Hub.state.settings.reminders[key].enabled = on;
    Hub.save();
    Hub.reminders.sync();
    if (on && Hub.notify.permission() === "default") Hub.notify.request();
    Hub.toast(on ? "Reminders on." : "Reminders off.", on ? "success" : "info", 2200);
    Hub.refresh();
  }

  var SECTIONS = { skin: skin, hair: hair, nails: nails, hands: hands, feet: feet, hearing: hearing };

  function render(el) {
    var pill = currentPill();
    var st = (Hub.state.streaks && Hub.state.streaks.bodycare) || { current: 0, best: 0, doneToday: false };
    var t = Hub.gamify.totals();

    el.innerHTML =
      '<div class="wh-head">' +
        '<div class="wh-head__eyebrow">Body care</div>' +
        "<h1>The rest of you</h1>" +
        "<p>Skin, hair, nails, hands, feet and hearing — the maintenance that isn't teeth or eyes, and " +
        "the parts that quietly limit training, or don't grow back, when they're neglected.</p>" +
      "</div>" +

      '<div class="wh-grid wh-grid--3 wh-mb4">' +
        '<div class="wh-stat"><div class="wh-stat__label">Streak</div>' +
          '<div class="wh-stat__value">' + st.current + "<small>days</small></div>" +
          '<div class="wh-stat__sub">AM + PM skin · best ' + st.best + "</div></div>" +
        '<div class="wh-stat"><div class="wh-stat__label">Sunscreen days</div>' +
          '<div class="wh-stat__value">' + t.spf + "</div>" +
          '<div class="wh-stat__sub">all time</div></div>' +
        '<div class="wh-stat"><div class="wh-stat__label">Items logged</div>' +
          '<div class="wh-stat__value">' + t.bodyLogs + "</div>" +
          '<div class="wh-stat__sub">across all areas</div></div>' +
      "</div>" +

      '<div class="wh-pills" role="tablist">' + PILLS.map(function (p) {
        return '<button type="button" role="tab" class="wh-pill' + (p.id === pill ? " is-active" : "") + '" ' +
          'data-bodypill="' + p.id + '" aria-selected="' + (p.id === pill) + '">' +
          Hub.icon(p.icon) + "<span>" + p.label + "</span></button>";
      }).join("") + "</div>" +

      '<div id="wh-body-body">' + SECTIONS[pill].render() + "</div>";

    Hub.delegate(el, "[data-bodypill]", function (b) {
      Hub.uiSet("bodyPill", b.dataset.bodypill);
      Hub.refresh();
    });

    var body = el.querySelector("#wh-body-body");

    /* Checklist toggles and interval "done today" buttons are shared across
       every sub-section, so they're wired once here. */
    Hub.delegate(body, "[data-body]", function (b) {
      var d = Hub.editDay();
      var k = b.dataset.body;
      if (d.body[k]) delete d.body[k]; else d.body[k] = true;
      Hub.commit();
      if (d.body[k]) {
        Hub.beep(660, 80);
        if (k === "skinAM" || k === "skinPM") Hub.gamify.checkMilestone("bodycare");
      }
    });

    Hub.delegate(body, "[data-interval]", function (b) {
      var key = b.dataset.interval;
      Hub.state.logs[key] = Hub.today();
      Hub.commit();
      Hub.beep(700, 90);
      Hub.toast("Logged for today.", "success", 2000);
    });

    SECTIONS[pill].wire(body);
  }

  Hub.registerView("bodycare", render);
})();
