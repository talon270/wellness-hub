/* ============================================================================
   WELLNESS HUB · MOBILITY & RECOVERY
   ----------------------------------------------------------------------------
   The half of training that isn't training. Three sub-sections:

     routines   guided, timed sequences that step you through joint work
     flexibility longer static holds, timed with a swap-sides chime
     recovery   rest-day marker, soreness map, and recovery-habit checklist

   The routines are sequences of steps, driven by one player that owns the
   overlay, the countdown, the per-step cues and the completion bookkeeping —
   so adding a routine means adding data, not code.

   Wrist and shoulder work is weighted heavily here on purpose: those are the
   joints that limit calisthenics progress and the ones most often skipped.
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  var PILLS = [
    { id: "routines",    label: "Routines",    icon: "stretchIc" },
    { id: "flexibility", label: "Flexibility", icon: "wellness" },
    { id: "recovery",    label: "Recovery",    icon: "snowflake" },
    { id: "injuries",    label: "Niggles",     icon: "bandage" }
  ];

  function currentPill() {
    var p = Hub.uiGet("mobilityPill", "routines");
    return PILLS.some(function (x) { return x.id === p; }) ? p : "routines";
  }

  /* ======================================================================
     ROUTINES — ordered sequences of timed steps
     ====================================================================== */
  var ROUTINES = [
    {
      id: "wrist-prep",
      emoji: "🖐️",
      name: "Wrist Prep",
      tag: "Before pushing",
      blurb: "Do this before any push-up, dip or handstand work. Wrists carry load they " +
             "aren't used to in calisthenics, and almost every wrist complaint traces back " +
             "to loading them cold.",
      steps: [
        { name: "Wrist circles", sec: 30, cue: "Fingers interlaced, circle slowly both directions. Full range, no force." },
        { name: "Palms down, rock forward", sec: 30, cue: "Hands flat on the floor, fingers forward. Rock weight over the heels of your hands." },
        { name: "Palms down, fingers back", sec: 30, cue: "Rotate hands so fingers point at your knees. Rock back gently — this one bites." },
        { name: "Backs of hands down", sec: 25, cue: "Flip to the backs of your hands. Very light pressure only." },
        { name: "Fingertip pushes", sec: 25, cue: "Fingertips on the floor, press and release. Builds the small stabilisers." },
        { name: "Prayer stretch", sec: 30, cue: "Palms together at chest, lower the hands until you feel the forearms open." },
        { name: "Reverse prayer", sec: 30, cue: "Backs of the hands together, fingers down. Ease into it." }
      ]
    },
    {
      id: "morning-flow",
      emoji: "🌅",
      name: "Morning Joint Flow",
      tag: "Wake everything up",
      blurb: "A top-to-bottom pass through every major joint. Best thing you can do in the " +
             "first ten minutes of the day, and it doubles as a general warm-up.",
      steps: [
        { name: "Neck rotations", sec: 30, cue: "Slow half-circles, chin to chest. Never roll backwards through the top." },
        { name: "Shoulder rolls", sec: 30, cue: "Big, slow circles. Back for 15 seconds, then forward." },
        { name: "Arm circles", sec: 30, cue: "Straight arms, small circles growing to as large as you can reach." },
        { name: "Thoracic rotations", sec: 40, cue: "Hands on shoulders, rotate the upper back left and right. Hips stay still." },
        { name: "Cat–cow", sec: 40, cue: "On all fours. Arch and round the spine one vertebra at a time, with the breath." },
        { name: "Hip circles", sec: 40, cue: "Hands on hips, draw the biggest circle you can with your pelvis. Swap direction halfway." },
        { name: "Leg swings", sec: 40, cue: "Hold something. Swing one leg front-to-back, then the other. Relaxed, not forced." },
        { name: "Ankle circles", sec: 30, cue: "Lift one foot, circle the ankle both ways. Then swap." },
        { name: "Deep squat hold", sec: 45, cue: "Sit into the bottom of a squat, heels down if you can. Breathe. This is the goal position." }
      ]
    },
    {
      id: "desk-reset",
      emoji: "💻",
      name: "Desk Reset",
      tag: "5 minutes, mid-day",
      blurb: "Undoes the specific shape sitting puts you in: forward head, rounded shoulders, " +
             "closed hips, stiff mid-back.",
      steps: [
        { name: "Chin tucks", sec: 30, cue: "Draw your chin straight back, making a double chin. Hold 3, release. Repeat." },
        { name: "Shoulder blade squeezes", sec: 40, cue: "Pull the blades back and down. Hold 5 seconds without shrugging." },
        { name: "Doorway chest opener", sec: 40, cue: "Forearm on the frame at shoulder height, step through. Swap sides at the chime." },
        { name: "Thoracic extension", sec: 40, cue: "Hands behind head, extend the upper back over the chair. Move at the mid-back." },
        { name: "Seated figure-four", sec: 60, cue: "Ankle on opposite knee, lean forward with a flat back. Swap at the chime." },
        { name: "Hip flexor lunge", sec: 60, cue: "Half-kneeling, tuck the pelvis under, then press forward. Swap at the chime." },
        { name: "Standing forward fold", sec: 40, cue: "Soft knees, let the head hang. Nod yes and no to release the neck." }
      ]
    },
    {
      id: "hip-shoulder",
      emoji: "🎯",
      name: "Hips & Shoulders",
      tag: "The two limiters",
      blurb: "The joints that gate almost every calisthenics skill — pistol squats need hip " +
             "and ankle range, handstands need overhead shoulder range. Slow, controlled, " +
             "actively driven.",
      steps: [
        { name: "Shoulder CARs (right)", sec: 45, cue: "Draw the biggest slow circle you can with your arm. Fight for range at the edges." },
        { name: "Shoulder CARs (left)", sec: 45, cue: "Same on the other side. Body still — the movement is at the shoulder only." },
        { name: "Wall slides", sec: 45, cue: "Back to the wall, arms in a goalpost. Slide up and down keeping contact." },
        { name: "Band / towel dislocates", sec: 45, cue: "Wide grip on a towel, pass it overhead and behind. Widen the grip if it pinches." },
        { name: "90/90 hip switches", sec: 60, cue: "Seated, both knees at 90°. Rotate the legs side to side without using your hands." },
        { name: "Cossack squat", sec: 60, cue: "Wide stance, shift over one leg keeping the other straight. Swap at the chime." },
        { name: "Couch stretch", sec: 60, cue: "Rear foot elevated, pelvis tucked. Swap at the chime. Intense — breathe through it." },
        { name: "Ankle rocks", sec: 45, cue: "Knee over toes, heel glued down. Rock forward and back, swap halfway." }
      ]
    },
    {
      id: "spine-decomp",
      emoji: "🌀",
      name: "Spine Decompression",
      tag: "End of the day",
      blurb: "Ten minutes to unload a spine that's been vertical and compressed all day. " +
             "Pairs well with going to bed.",
      steps: [
        { name: "Dead hang", sec: 45, cue: "Hang from a bar, shoulders relaxed, let gravity do the work. Skip if you have no bar." },
        { name: "Child's pose", sec: 60, cue: "Knees wide, arms long, hips back to heels. Breathe into the lower back." },
        { name: "Supine twist (right)", sec: 45, cue: "On your back, knees dropped to one side, arms wide. Let it settle." },
        { name: "Supine twist (left)", sec: 45, cue: "Other side. Don't force the knees down — let the exhale do it." },
        { name: "Knees to chest", sec: 40, cue: "Hug both knees in and rock gently side to side." },
        { name: "Legs up the wall", sec: 90, cue: "Lie down, legs vertical against a wall. Nothing to do but breathe." }
      ]
    }
  ];

  var ROUTINE_BY_ID = {};
  ROUTINES.forEach(function (r) { ROUTINE_BY_ID[r.id] = r; });

  /* ---------------------------------------------------------------------
     ROUTINE PLAYER
     Walks the step list, showing what's now and what's next, with a chime at
     every transition. One implementation for all five routines.
     ------------------------------------------------------------------- */
  var player = null;

  function runRoutine(routine, startIndex) {
    stopPlayer();
    var idx = startIndex || 0;
    var total = routine.steps.reduce(function (n, s) { return n + s.sec; }, 0);
    var elapsedBefore = routine.steps.slice(0, idx).reduce(function (n, s) { return n + s.sec; }, 0);

    var inner = Hub.focus.open(
      '<div class="wh-focus__title">' + routine.emoji + " " + Hub.esc(routine.name) + "</div>" +
      '<div class="wh-mob-progress"><div class="wh-mob-progress__fill" id="mb-prog"></div></div>' +
      '<div class="wh-mob-step" id="mb-step">' + Hub.esc(routine.steps[idx].name) + "</div>" +
      '<div class="wh-clock" id="mb-clock">' + Hub.clock(routine.steps[idx].sec) + "</div>" +
      '<div class="wh-focus__cue" id="mb-cue">' + Hub.esc(routine.steps[idx].cue) + "</div>" +
      '<div class="wh-mob-next mono" id="mb-next"></div>' +
      '<div class="wh-focus__actions">' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="mb-skip">Skip step</button>' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="mb-quit">' + Hub.icon("stop") + "Stop</button>" +
      "</div>",
      function () { stopPlayer(); }
    );

    var stepEl = inner.querySelector("#mb-step");
    var clockEl = inner.querySelector("#mb-clock");
    var cueEl = inner.querySelector("#mb-cue");
    var nextEl = inner.querySelector("#mb-next");
    var progEl = inner.querySelector("#mb-prog");
    inner.querySelector("#mb-quit").addEventListener("click", function () { Hub.focus.close(); });
    inner.querySelector("#mb-skip").addEventListener("click", function () { advance(); });

    var timer = null;
    player = { stop: function () { if (timer) timer.stop(); } };
    startStep();

    function startStep() {
      var step = routine.steps[idx];
      stepEl.textContent = step.name;
      cueEl.textContent = step.cue;
      nextEl.textContent = idx + 1 < routine.steps.length
        ? "Next · " + routine.steps[idx + 1].name
        : "Last one";

      var halfCued = false, last = -1;
      timer = new Hub.Timer({
        duration: step.sec,
        interval: 150,
        onTick: function (remaining, elapsed) {
          var w = Math.ceil(remaining);
          if (w !== last) {
            last = w;
            clockEl.textContent = Hub.clock(w);
            if (w <= 3 && w > 0) Hub.beep(880, 60, 0.07);
          }
          progEl.style.width = ((elapsedBefore + elapsed) / total * 100).toFixed(1) + "%";
          /* Steps whose cue mentions swapping get a mid-point chime. */
          if (!halfCued && elapsed >= step.sec / 2 && /swap/i.test(step.cue)) {
            halfCued = true;
            Hub.cueChange();
          }
        },
        onDone: advance
      });
      player.stop = function () { timer.stop(); };
      timer.start();
    }

    function advance() {
      if (timer) timer.stop();
      elapsedBefore += routine.steps[idx].sec;
      idx++;
      if (idx >= routine.steps.length) { finish(routine); return; }
      Hub.cueChange();
      startStep();
    }
  }

  function stopPlayer() {
    if (player) { player.stop(); player = null; }
  }

  function finish(routine) {
    stopPlayer();
    Hub.cueDone();

    var d = Hub.editDay();
    d.mobility++;
    Hub.commit();
    Hub.gamify.checkMilestone("mobility");

    var inner = Hub.focus.open(
      '<div class="wh-focus__title">✓ ' + Hub.esc(routine.name) + " complete</div>" +
      '<p class="wh-muted wh-mt4">That\'s ' + d.mobility + " mobility " +
        Hub.plural(d.mobility, "session") + " today. Range you don't use, you lose.</p>" +
      '<div class="wh-focus__actions">' +
        '<button type="button" class="wh-btn wh-btn--primary" id="mb-again" data-focus-primary>Run it again</button>' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="mb-done">Back to Mobility</button>' +
      "</div>"
    );
    inner.querySelector("#mb-again").addEventListener("click", function () { runRoutine(routine, 0); });
    inner.querySelector("#mb-done").addEventListener("click", function () { Hub.focus.close(); });
  }

  /* ======================================================================
     FLEXIBILITY — single long holds
     ====================================================================== */
  var HOLDS = [
    { id: "hamstring", emoji: "🦵", name: "Seated hamstring", sec: 120, bilateral: true,
      blurb: "The one that gates forward folds, pike work and clean deadlift positions.",
      steps: ["Sit with one leg straight, the other tucked in.",
              "Hinge from the hip with a flat back — don't round to reach further.",
              "Stop where you feel a firm stretch, not pain, and breathe.",
              "Swap legs at the halfway chime."] },
    { id: "pancake", emoji: "🪁", name: "Pancake / straddle", sec: 120, bilateral: false,
      blurb: "Opens the adductors and hips — the base position for a lot of floor skills.",
      steps: ["Sit with legs as wide as is comfortable, toes pointing up.",
              "Keep a long spine and hinge forward from the hips.",
              "Rest on your forearms or a cushion; there's no prize for the floor.",
              "Relax into it — this one responds to time, not effort."] },
    { id: "shoulder-ext", emoji: "🙆", name: "Shoulder extension", sec: 90, bilateral: false,
      blurb: "Essential for dips, back levers and anything that puts your arms behind you.",
      steps: ["Sit with hands on the floor behind you, fingers pointing away.",
              "Slide your hips forward, keeping your palms planted.",
              "Chest tall, shoulders down — don't let them shrug up to your ears.",
              "Ease off the moment you feel anything sharp at the front of the shoulder."] },
    { id: "couch", emoji: "🛋️", name: "Couch stretch", sec: 120, bilateral: true,
      blurb: "The strongest hip-flexor and quad stretch there is. Sitting all day makes it necessary.",
      steps: ["Half-kneel with your rear foot up against a wall or sofa.",
              "Squeeze the glute on the rear leg and tuck your pelvis under.",
              "Only then bring your torso upright.",
              "Swap sides at the halfway chime. Breathe — don't hold your breath."] },
    { id: "calf", emoji: "🦶", name: "Calf & ankle", sec: 90, bilateral: true,
      blurb: "Ankle range is the hidden limiter in deep squats and pistol squats.",
      steps: ["Step one foot back, heel pressed down, back leg straight.",
              "Then bend the back knee slightly to reach the deeper soleus.",
              "Keep the heel glued to the floor throughout.",
              "Swap at the halfway chime."] },
    { id: "thoracic", emoji: "🌉", name: "Thoracic bridge", sec: 90, bilateral: false,
      blurb: "Restores extension to the mid-back, which is where desk posture stiffens first.",
      steps: ["Lie back over a foam roller or rolled towel placed across the mid-back.",
              "Support your head with your hands and let the upper back drape over it.",
              "Breathe out and let gravity extend you a little further.",
              "Move the roller a few centimetres and repeat if you like."] }
  ];

  function runHold(hold) {
    var timer = null;
    var inner = Hub.focus.open(
      '<div class="wh-focus__title">' + hold.emoji + " " + Hub.esc(hold.name) + "</div>" +
      '<div class="wh-clock" id="fx-clock">' + Hub.clock(hold.sec) + "</div>" +
      '<ol class="wh-ex__steps wh-mt4" style="text-align:left;max-width:430px;margin-inline:auto">' +
        hold.steps.map(function (s) { return "<li>" + Hub.esc(s) + "</li>"; }).join("") + "</ol>" +
      '<div class="wh-focus__cue" id="fx-cue">Breathe slowly. Never stretch into sharp pain.</div>' +
      '<div class="wh-focus__actions">' +
        '<button type="button" class="wh-btn wh-btn--ghost" id="fx-quit">' + Hub.icon("stop") + "Stop</button></div>",
      function () { if (timer) timer.stop(); }
    );
    var clockEl = inner.querySelector("#fx-clock");
    var cueEl = inner.querySelector("#fx-cue");
    inner.querySelector("#fx-quit").addEventListener("click", function () { Hub.focus.close(); });

    var swapped = false, last = -1;
    timer = new Hub.Timer({
      duration: hold.sec,
      interval: 200,
      onTick: function (r, e) {
        var w = Math.ceil(r);
        if (w === last) return;
        last = w;
        clockEl.textContent = Hub.clock(w);
        if (hold.bilateral && !swapped && e >= hold.sec / 2) {
          swapped = true;
          cueEl.textContent = "Swap sides.";
          Hub.cueChange();
        }
      },
      onDone: function () {
        Hub.cueDone();
        var d = Hub.editDay();
        d.mobility++;
        Hub.commit();
        Hub.gamify.checkMilestone("mobility");
        Hub.focus.close();
        Hub.toast(hold.name + " held. Nice.", "success");
      }
    });
    timer.start();
  }

  /* ======================================================================
     RECOVERY
     ====================================================================== */
  var BODY_PARTS = [
    { key: "neck", label: "Neck" }, { key: "shoulders", label: "Shoulders" },
    { key: "chest", label: "Chest" }, { key: "back", label: "Back" },
    { key: "arms", label: "Arms" }, { key: "wrists", label: "Wrists" },
    { key: "core", label: "Core" }, { key: "hips", label: "Hips" },
    { key: "quads", label: "Quads" }, { key: "hamstrings", label: "Hamstrings" },
    { key: "calves", label: "Calves" }, { key: "ankles", label: "Ankles" }
  ];

  var RECOVERY_TIPS = [
    ["Sleep is the recovery tool", "Nothing else on this page comes close. Muscle repair and growth hormone release are concentrated in deep sleep — training hard on six hours is spending money you haven't earned."],
    ["Soreness isn't the scoreboard", "Delayed soreness tracks novelty, not effectiveness. A session that leaves you fine can be the more productive one."],
    ["Move on rest days", "Complete rest stiffens you up. A walk, an easy mobility routine or a swim clears more than lying still does."],
    ["Protein and total calories", "You can't recover from a deficit you keep digging. Under-eating shows up as stalled progress long before it shows up on the scale."],
    ["Foam rolling buys minutes, not days", "It reduces the feeling of tightness short-term. Useful before a session, not a substitute for actually resting."],
    ["Deload before you have to", "Backing off a week every 6–8 weeks costs less than the four weeks an overuse injury will."],
    ["Pain vs. discomfort", "Sharp, localised, joint-centred, or lingering the next morning is pain — that's a stop signal. Diffuse muscular ache is not."],
    ["Contrast showers are optional", "Pleasant and mildly stimulating, but the evidence is thin. Don't let it displace sleep or food."]
  ];

  var RECOVERY_HABITS = [
    { key: "foamRoll", label: "Foam rolled / soft-tissue work", sub: "5–10 minutes on whatever felt tight" },
    { key: "walk",     label: "Easy walk or light movement",     sub: "Recovery is active, not horizontal" },
    { key: "protein",  label: "Hit protein for the day",          sub: "The raw material for repair" },
    { key: "coolDown", label: "Cooled down after training",       sub: "A few minutes of easy movement and breathing" },
    { key: "elevate",  label: "Legs up / decompression",          sub: "Especially after running or long standing" }
  ];


  /* ======================================================================
     NIGGLES & INJURIES
     ----------------------------------------------------------------------
     A dated record turns "my shoulder's been off for a while" into something
     you can actually look at — and hand to a physio. Each entry carries a
     running log so you can see whether it's improving, plateaued, or creeping.
     ====================================================================== */
  var INJURY_AREAS = BODY_PARTS.map(function (p) { return p.label; })
    .concat(["Elbows", "Knees", "Lower back", "Neck", "Foot / arch", "Other"]);

  var injuries = {
    render: function () {
      var all = (Hub.state.logs.injuries || []).slice().sort(function (a, b) {
        /* Open ones first, then most recent. */
        if ((a.status === "resolved") !== (b.status === "resolved")) return a.status === "resolved" ? 1 : -1;
        return b.startISO < a.startISO ? -1 : 1;
      });
      var open = all.filter(function (n) { return n.status !== "resolved"; });
      var closed = all.filter(function (n) { return n.status === "resolved"; });

      return '<div class="wh-card wh-card--accent wh-mb4">' +
          '<div class="wh-card__head">' +
            '<div class="wh-card__title">' + Hub.icon("bandage") + "Niggles &amp; injuries</div>" +
            '<button type="button" class="wh-btn wh-btn--sm wh-btn--primary" id="mb-newinj">' +
              Hub.icon("plus") + "Log a niggle</button>" +
          "</div>" +
          '<p class="wh-sm wh-muted">Log anything that hurts, feels off, or keeps interrupting training — ' +
            "however minor. The point isn't to catastrophise; it's that six weeks from now you'll be able to " +
            "say exactly when it started, what it followed, and whether it's actually getting better.</p>" +
        "</div>" +

        (open.length
          ? '<h2 class="wh-h2 wh-mb4">Open</h2><div class="wh-stack wh-mb4">' + open.map(injuryCard).join("") + "</div>"
          : '<div class="wh-empty wh-mb4">' + Hub.icon("check") + "<strong>Nothing open</strong>" +
            "No active niggles logged. Long may it last.</div>") +

        (closed.length
          ? '<h2 class="wh-h2 wh-mb4">Resolved</h2><div class="wh-stack wh-mb4">' +
            closed.slice(0, 10).map(injuryCard).join("") + "</div>"
          : "") +

        /* ---------- photo log ---------- */
        Hub.photoUI.card({
          kind: "injury",
          icon: "camera",
          title: "Photo log",
          intro: "For anything visible — swelling, bruising, a torn callus, a rash. Severity ratings " +
                 "drift; a photo from three weeks ago doesn't. Name each one after the area so the " +
                 "series lines up.",
          help: "Stored on this device only, and included in your backups.",
          disclaimer: "Photographs help you and a clinician see change over time. They can't tell you " +
                      "what something is. Anything spreading, hot, weeping, or accompanied by fever needs " +
                      "to be seen rather than photographed again tomorrow."
        }) +

        '<div class="wh-disclaimer">' + Hub.icon("alert") +
          "<span>This is a diary, not an assessment — it can't tell you what's wrong. See a professional " +
          "for anything that involves sharp or joint-centred pain, swelling, numbness, giving way, pain at " +
          "night or at rest, or anything that hasn't improved in a couple of weeks. Training through a " +
          "structural problem is how a three-week issue becomes a three-month one.</span></div>";
    },

    wire: function (el) {
      el.querySelector("#mb-newinj").addEventListener("click", function () { injuryDialog(null); });
      Hub.delegate(el, "[data-editinj]", function (b) { injuryDialog(findInjury(b.dataset.editinj)); });
      Hub.delegate(el, "[data-updinj]", function (b) { updateDialog(findInjury(b.dataset.updinj)); });
      Hub.delegate(el, "[data-resolveinj]", function (b) {
        var n = findInjury(b.dataset.resolveinj);
        if (!n) return;
        n.status = "resolved";
        n.endISO = Hub.today();
        Hub.commit();
        Hub.beep(720, 110);
        Hub.toast(n.area + " marked resolved. Good.", "success");
      });
      Hub.delegate(el, "[data-reopeninj]", function (b) {
        var n = findInjury(b.dataset.reopeninj);
        if (!n) return;
        n.status = "open";
        n.endISO = null;
        Hub.commit();
        Hub.toast("Reopened.", "info", 2000);
      });
      Hub.photoUI.wire(el, "injury");
    }
  };

  function findInjury(id) {
    return (Hub.state.logs.injuries || []).filter(function (n) { return n.id === id; })[0];
  }

  function injuryCard(n) {
    var days = Hub.daysBetween(n.startISO, n.endISO || Hub.today());
    var log = (n.log || []).slice().sort(function (a, b) { return b.date < a.date ? -1 : 1; });
    var latest = log[0];
    var sev = latest ? latest.severity : n.severity;
    /* Compare the newest entry with the oldest to show a direction. */
    var trend = null;
    if (log.length >= 2) {
      var first = log[log.length - 1].severity;
      trend = sev < first ? "improving" : (sev > first ? "worse" : "unchanged");
    }

    return '<div class="wh-injury' + (n.status === "resolved" ? " is-resolved" : "") + '">' +
      '<div class="wh-row wh-row--between">' +
        '<div><div class="wh-injury__area">' + Hub.esc(n.area) + "</div>" +
          '<div class="wh-injury__meta mono">' +
            (n.status === "resolved"
              ? "resolved after " + days + " " + Hub.plural(days, "day")
              : "day " + (days + 1) + " · since " + Hub.prettyDate(n.startISO)) +
          "</div></div>" +
        '<div class="wh-row" style="gap:6px">' +
          (trend ? '<span class="wh-chip wh-chip--' +
            (trend === "improving" ? "good" : trend === "worse" ? "bad" : "") + '">' + trend + "</span>" : "") +
          '<span class="wh-chip' + (sev >= 4 ? " wh-chip--bad" : sev >= 3 ? " wh-chip--warn" : "") + '">' +
            sev + "/5</span>" +
        "</div>" +
      "</div>" +

      (n.note ? '<p class="wh-injury__note">' + Hub.esc(n.note) + "</p>" : "") +

      (log.length
        ? '<div class="wh-injury__log">' + log.slice(0, 5).map(function (e) {
            return '<div class="wh-injury__logrow mono">' +
              '<span>' + Hub.prettyDate(e.date) + "</span>" +
              '<span style="color:var(--fg1)">' + e.severity + "/5</span>" +
              (e.note ? '<span class="wh-injury__lognote">' + Hub.esc(e.note) + "</span>" : "") +
            "</div>";
          }).join("") + "</div>"
        : "") +

      '<div class="wh-row wh-mt4" style="gap:6px">' +
        (n.status === "resolved"
          ? '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" data-reopeninj="' + n.id + '">Reopen</button>'
          : '<button type="button" class="wh-btn wh-btn--sm wh-btn--primary" data-updinj="' + n.id + '">Add update</button>' +
            '<button type="button" class="wh-btn wh-btn--sm wh-btn--success" data-resolveinj="' + n.id + '">Resolved</button>') +
        '<button type="button" class="wh-btn wh-btn--sm wh-btn--ghost" data-editinj="' + n.id + '">Edit</button>' +
      "</div>" +
    "</div>";
  }

  function severityPicker(id, value) {
    return '<div class="wh-rate" id="' + id + '" role="group" aria-label="Severity 1 to 5">' +
      [1, 2, 3, 4, 5].map(function (k) {
        var on = value === k;
        return '<button type="button" class="wh-rate__btn' + (on ? " is-on" : "") + '" ' +
          'data-sev="' + k + '" aria-pressed="' + on + '">' + k + "</button>";
      }).join("") + "</div>";
  }

  function wireSeverity(body, id, initial) {
    var current = { value: initial };
    body.querySelectorAll("#" + id + " [data-sev]").forEach(function (b) {
      b.addEventListener("click", function () {
        current.value = Number(b.dataset.sev);
        body.querySelectorAll("#" + id + " [data-sev]").forEach(function (x) {
          var on = Number(x.dataset.sev) === current.value;
          x.classList.toggle("is-on", on);
          x.setAttribute("aria-pressed", on);
        });
      });
    });
    return current;
  }

  function injuryDialog(existing) {
    var n = existing || {
      id: "n" + Date.now(), area: "", startISO: Hub.today(), severity: 2,
      note: "", status: "open", endISO: null, log: []
    };
    var sev;

    Hub.modal({
      title: existing ? "Edit niggle" : "Log a niggle",
      body:
        '<label class="wh-field"><span class="wh-field__label">Where</span>' +
          '<input class="wh-input" id="inj-area" list="inj-areas" type="text" maxlength="40" ' +
          'value="' + Hub.esc(n.area) + '" placeholder="e.g. Left shoulder" />' +
          '<datalist id="inj-areas">' + INJURY_AREAS.map(function (a) {
            return '<option value="' + Hub.esc(a) + '"></option>';
          }).join("") + "</datalist></label>" +
        '<label class="wh-field wh-mt4"><span class="wh-field__label">Started</span>' +
          '<input class="wh-input" id="inj-start" type="date" value="' + Hub.esc(n.startISO) + '" /></label>' +
        '<div class="wh-field wh-mt4"><span class="wh-field__label">How bad, right now</span>' +
          severityPicker("inj-sev", n.severity) +
          '<span class="wh-help">1 = notice it occasionally · 5 = stopping me training</span></div>' +
        '<label class="wh-field wh-mt4"><span class="wh-field__label">What happened / what makes it worse</span>' +
          '<input class="wh-input" id="inj-note" type="text" maxlength="140" ' +
          'value="' + Hub.esc(n.note || "") + '" placeholder="optional but useful later" /></label>',
      actions: [
        existing ? { label: "Delete", variant: "danger", onClick: function () {
          Hub.state.logs.injuries = Hub.state.logs.injuries.filter(function (x) { return x.id !== n.id; });
          Hub.commit();
          Hub.toast("Removed.", "info", 2000);
        } } : { label: "Cancel", variant: "ghost" },
        { label: "Save", variant: "primary", close: false, onClick: function () {
          var area = document.getElementById("inj-area").value.trim();
          if (!area) { Hub.toast("Where is it?", "warn"); return; }
          var start = document.getElementById("inj-start").value;
          n.area = area;
          n.startISO = /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : Hub.today();
          n.severity = sev.value;
          n.note = document.getElementById("inj-note").value.trim();
          if (!existing) {
            n.log = [{ date: Hub.today(), severity: sev.value, note: "First logged" }];
            Hub.state.logs.injuries.push(n);
          }
          Hub.closeModal();
          Hub.commit();
          Hub.toast("Logged. Train around it.", "success");
        } }
      ],
      onOpen: function (body) { sev = wireSeverity(body, "inj-sev", n.severity); }
    });
  }

  function updateDialog(n) {
    if (!n) return;
    var last = (n.log || [])[n.log.length - 1];
    var sev;
    Hub.modal({
      title: "Update: " + n.area,
      body:
        '<p class="wh-sm wh-muted">How is it today? Even "no change" is worth recording — a flat line ' +
          "over three weeks is itself the finding.</p>" +
        '<div class="wh-field wh-mt4"><span class="wh-field__label">Severity today</span>' +
          severityPicker("upd-sev", last ? last.severity : n.severity) + "</div>" +
        '<label class="wh-field wh-mt4"><span class="wh-field__label">Note</span>' +
          '<input class="wh-input" id="upd-note" type="text" maxlength="140" ' +
          'placeholder="e.g. fine warming up, sore after dips" /></label>',
      actions: [
        { label: "Cancel", variant: "ghost" },
        { label: "Add update", variant: "primary", close: false, onClick: function () {
          if (!Array.isArray(n.log)) n.log = [];
          /* One entry per day: a second update replaces the first. */
          n.log = n.log.filter(function (e) { return e.date !== Hub.today(); });
          n.log.push({
            date: Hub.today(), severity: sev.value,
            note: document.getElementById("upd-note").value.trim()
          });
          Hub.closeModal();
          Hub.commit();
          Hub.toast("Update added.", "success", 2200);
        } }
      ],
      onOpen: function (body) { sev = wireSeverity(body, "upd-sev", last ? last.severity : n.severity); }
    });
  }

  /* ======================================================================
     SECTION RENDERERS
     ====================================================================== */
  var routines = {
    render: function () {
      var d = Hub.day();
      return '<div class="wh-card wh-card--accent wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("info") + "Why this tab exists</div></div>" +
          '<p class="wh-sm wh-muted">Strength without range is a smaller ceiling. Every calisthenics ' +
            "progression you're chasing — pistol squats, handstands, dips, L-sits — is gated by joint " +
            "range at least as much as by strength, and wrists and shoulders are where most people stall. " +
            "Ten minutes here is worth more than an extra set almost anywhere else.</p>" +
        "</div>" +

        '<div class="wh-exgrid">' + ROUTINES.map(function (r) {
          var total = r.steps.reduce(function (n, s) { return n + s.sec; }, 0);
          return '<div class="wh-ex">' +
            '<div class="wh-ex__head"><div class="wh-ex__ic">' + r.emoji + "</div>" +
              '<div><div class="wh-ex__name">' + Hub.esc(r.name) + "</div>" +
              '<div class="wh-ex__dur">' + Hub.clock(total) + " · " + r.steps.length + " steps</div></div></div>" +
            '<span class="wh-chip wh-chip--accent" style="align-self:flex-start">' + Hub.esc(r.tag) + "</span>" +
            '<p class="wh-ex__desc">' + Hub.esc(r.blurb) + "</p>" +
            '<details class="wh-mob-details"><summary>See the ' + r.steps.length + " steps</summary>" +
              '<ol class="wh-ex__steps">' + r.steps.map(function (s) {
                return "<li>" + Hub.esc(s.name) + ' <span class="wh-faint mono">' + s.sec + "s</span></li>";
              }).join("") + "</ol></details>" +
            '<div class="wh-ex__foot">' +
              '<button type="button" class="wh-btn wh-btn--primary wh-btn--sm" data-routine="' + r.id + '">' +
                Hub.icon("play") + "Start</button>" +
            "</div>" +
          "</div>";
        }).join("") + "</div>" +

        (d.mobility ? '<p class="wh-help wh-mt4">' + d.mobility + " mobility " +
          Hub.plural(d.mobility, "session") + " logged today.</p>" : "");
    },
    wire: function (el) {
      Hub.delegate(el, "[data-routine]", function (b) { runRoutine(ROUTINE_BY_ID[b.dataset.routine], 0); });
    }
  };

  var flexibility = {
    render: function () {
      return '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("clockIc") + "How to use these</div></div>" +
          '<p class="wh-sm wh-muted">Static holds work on <strong>time under tension, not force</strong>. ' +
            "Find the edge where you feel a firm stretch, then stop pushing and let the nervous system " +
            "release into it — that release is most of the gain, and it takes 60–120 seconds. " +
            "Best done <em>after</em> training or on its own, not as a warm-up before heavy work.</p>" +
        "</div>" +
        '<div class="wh-exgrid">' + HOLDS.map(function (h) {
          return '<div class="wh-ex">' +
            '<div class="wh-ex__head"><div class="wh-ex__ic">' + h.emoji + "</div>" +
              '<div><div class="wh-ex__name">' + Hub.esc(h.name) + "</div>" +
              '<div class="wh-ex__dur">' + Hub.clock(h.sec) + (h.bilateral ? " · both sides" : "") + "</div></div></div>" +
            '<p class="wh-ex__desc">' + Hub.esc(h.blurb) + "</p>" +
            '<ol class="wh-ex__steps">' + h.steps.map(function (s) { return "<li>" + Hub.esc(s) + "</li>"; }).join("") + "</ol>" +
            '<div class="wh-ex__foot"><button type="button" class="wh-btn wh-btn--primary wh-btn--sm" data-hold="' + h.id + '">' +
              Hub.icon("play") + "Start</button></div>" +
          "</div>";
        }).join("") + "</div>";
    },
    wire: function (el) {
      Hub.delegate(el, "[data-hold]", function (b) {
        runHold(HOLDS.filter(function (h) { return h.id === b.dataset.hold; })[0]);
      });
    }
  };

  var recovery = {
    render: function () {
      var d = Hub.day();
      var sore = d.soreness || {};
      var t = Hub.gamify.totals();

      return (Hub.adviceUI ? Hub.adviceUI.panel() : "") +

        '<div class="wh-grid wh-grid--2 wh-grid--top wh-mb4">' +
          '<div class="wh-card wh-card--accent">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("snowflake") + "Rest day</div>" +
              (d.restDay ? '<span class="wh-chip wh-chip--good">resting</span>' : "") + "</div>" +
            '<p class="wh-sm wh-muted">Marking a rest day keeps your mobility streak intact — recovery ' +
              "counts as showing up. It doesn't affect your training records.</p>" +
            '<button type="button" class="wh-btn ' + (d.restDay ? "wh-btn--success" : "wh-btn--primary") +
              ' wh-mt4" id="mb-rest">' + Hub.icon(d.restDay ? "check" : "moon") +
              (d.restDay ? "Marked as a rest day" : "Mark today as a rest day") + "</button>" +
            '<p class="wh-help wh-mt4">' + t.restDays + " rest " + Hub.plural(t.restDays, "day") + " logged all time.</p>" +
          "</div>" +

          '<div class="wh-card">' +
            '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("check") + "Recovery habits</div></div>" +
            '<div class="wh-stack wh-stack--sm">' + RECOVERY_HABITS.map(function (h) {
              var on = !!(d.body || {})[h.key];
              return '<button type="button" class="wh-check' + (on ? " is-done" : "") + '" data-rec="' + h.key + '" ' +
                  'aria-pressed="' + on + '">' +
                '<span class="wh-check__box">' + Hub.icon("check") + "</span>" +
                '<span class="wh-check__text">' + Hub.esc(h.label) +
                  '<span class="wh-check__sub">' + Hub.esc(h.sub) + "</span></span></button>";
            }).join("") + "</div>" +
          "</div>" +
        "</div>" +

        /* ---------- soreness map ---------- */
        '<div class="wh-card wh-mb4">' +
          '<div class="wh-card__head"><div class="wh-card__title">' + Hub.icon("bodycare") + "Soreness check</div>" +
            '<span class="wh-chip">tap a level</span></div>' +
          '<p class="wh-sm wh-muted wh-mb4">Rate anything that\'s sore today. Over time this shows you which ' +
            "areas keep flaring up — usually a sign the programme is unbalanced or the range isn't there yet.</p>" +
          '<div class="wh-sore">' + BODY_PARTS.map(function (p) {
            var v = Number(sore[p.key]) || 0;
            return '<div class="wh-sore__row">' +
              '<span class="wh-sore__label">' + p.label + "</span>" +
              '<div class="wh-sore__scale" role="group" aria-label="' + p.label + ' soreness">' +
                [1, 2, 3, 4, 5].map(function (n) {
                  return '<button type="button" class="wh-sore__dot' + (v >= n ? " is-on" : "") + '" ' +
                    'data-sore="' + p.key + '" data-level="' + n + '" ' +
                    'aria-label="' + p.label + " level " + n + '" aria-pressed="' + (v >= n) + '"></button>';
                }).join("") +
              "</div></div>";
          }).join("") + "</div>" +
          '<p class="wh-help wh-mt4">Tap the same level again to clear it. 1 = barely notice · 5 = properly sore.</p>' +
        "</div>" +

        /* ---------- tips ---------- */
        '<h2 class="wh-h2 wh-mb4">Recovery principles</h2>' +
        '<div class="wh-grid wh-grid--auto">' + RECOVERY_TIPS.map(function (t2) {
          return '<div class="wh-card wh-card--tight"><div class="wh-h3 wh-mb4">' + Hub.esc(t2[0]) + "</div>" +
            '<p class="wh-card__note">' + Hub.esc(t2[1]) + "</p></div>";
        }).join("") + "</div>" +

        '<div class="wh-disclaimer wh-mt4">' + Hub.icon("alert") +
          "<span>Soreness tracking is a training aid, not a diagnosis. Sharp or joint-centred pain, " +
          "swelling, numbness, or anything that doesn't settle within a few days is worth getting " +
          "looked at rather than stretched.</span></div>";
    },

    wire: function (el) {
      if (Hub.adviceUI) Hub.adviceUI.wire(el);

      el.querySelector("#mb-rest").addEventListener("click", function () {
        var d = Hub.editDay();
        d.restDay = !d.restDay;
        Hub.commit();
        if (d.restDay) { Hub.gamify.checkMilestone("mobility"); Hub.beep(560, 120); }
        Hub.toast(d.restDay ? "Rest day logged. That counts." : "Rest day removed.", d.restDay ? "success" : "info", 2400);
      });

      Hub.delegate(el, "[data-rec]", function (b) {
        var d = Hub.editDay();
        var k = b.dataset.rec;
        if (d.body[k]) delete d.body[k]; else d.body[k] = true;
        Hub.commit();
        if (d.body[k]) Hub.beep(660, 80);
      });

      Hub.delegate(el, "[data-sore]", function (b) {
        var d = Hub.editDay();
        var part = b.dataset.sore, level = Number(b.dataset.level);
        /* Tapping the level you're already on clears it — otherwise there'd be
           no way back to "not sore". */
        if (Number(d.soreness[part]) === level) delete d.soreness[part];
        else d.soreness[part] = level;
        Hub.commit();
      });
    }
  };

  /* ======================================================================
     VIEW
     ====================================================================== */
  var SECTIONS = { routines: routines, flexibility: flexibility, recovery: recovery, injuries: injuries };

  function render(el) {
    var pill = currentPill();
    var st = (Hub.state.streaks && Hub.state.streaks.mobility) || { current: 0, best: 0, doneToday: false };
    var t = Hub.gamify.totals();

    el.innerHTML =
      '<div class="wh-head">' +
        '<div class="wh-head__eyebrow">Mobility &amp; recovery</div>' +
        "<h1>Range, then strength</h1>" +
        "<p>The joints that limit calisthenics are the ones nobody trains. This is the maintenance " +
        "work that keeps the rest of it possible.</p>" +
      "</div>" +

      '<div class="wh-grid wh-grid--3 wh-mb4">' +
        '<div class="wh-stat"><div class="wh-stat__label">Streak</div>' +
          '<div class="wh-stat__value">' + st.current + "<small>days</small></div>" +
          '<div class="wh-stat__sub">best ' + st.best + " · " + (st.doneToday ? "done today" : "not yet today") + "</div></div>" +
        '<div class="wh-stat"><div class="wh-stat__label">Sessions</div>' +
          '<div class="wh-stat__value">' + t.mobility + "</div>" +
          '<div class="wh-stat__sub">all time</div></div>' +
        '<div class="wh-stat"><div class="wh-stat__label">Rest days</div>' +
          '<div class="wh-stat__value">' + t.restDays + "</div>" +
          '<div class="wh-stat__sub">recovery counts</div></div>' +
      "</div>" +

      '<div class="wh-pills" role="tablist">' + PILLS.map(function (p) {
        return '<button type="button" role="tab" class="wh-pill' + (p.id === pill ? " is-active" : "") + '" ' +
          'data-mobpill="' + p.id + '" aria-selected="' + (p.id === pill) + '">' +
          Hub.icon(p.icon) + "<span>" + p.label + "</span></button>";
      }).join("") + "</div>" +

      '<div id="wh-mobility-body">' + SECTIONS[pill].render() + "</div>";

    Hub.delegate(el, "[data-mobpill]", function (b) {
      Hub.uiSet("mobilityPill", b.dataset.mobpill);
      Hub.refresh();
    });
    SECTIONS[pill].wire(el.querySelector("#wh-mobility-body"));
  }

  Hub.registerView("mobility", render);
})();
