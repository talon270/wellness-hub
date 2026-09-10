/* ============================================================================
   BASALT · PHASE DATA  (pure data module — no UI, no state writes)
   ----------------------------------------------------------------------------
   muscles.data.js answers "which muscles does this exercise train". This file
   answers the next question down: "and WHEN, within the rep".

   A static map cannot say that the grip works hardest at the bottom of a
   pull-up and the biceps hardest at the top, or that a plank's abs are fine
   for ten seconds and screaming at thirty. That is what phases are for.

   GLOBALS EXPOSED
     window.PHASE_MAP    exerciseId -> { kind, phases[], muscles{} }
     window.POSE_RIGS    pattern    -> pose geometry, interpolated by `pos`

   HOW MUCH TO TRUST THESE NUMBERS
     They are ILLUSTRATIVE. They encode the general exercise-science
     understanding of each movement's biomechanics — which muscle leads, which
     takes over, where peak contraction sits — and they are NOT EMG readings
     from a specific study on a specific population. A 0.90 here means "this is
     among the hardest-working muscles at this point in the rep", not "90% of
     maximum voluntary contraction was measured".

     Every screen that renders this data states that inline, next to the bars.
     It is not a footnote. A tool that draws a precise-looking bar chart off
     estimated numbers, and only admits it somewhere else, is lying with its
     confidence rather than its values.

   TAXONOMY
     The 14 groups in muscles.data.js, unchanged. That file deliberately folds
     traps and rear delts into `upper_back` and has no teres major, because a
     group no exercise can train is a dead tile. Splitting them here would put
     a second vocabulary in the app and print bars that no muscle-map tile
     could ever match.

   TWO KINDS OF EXERCISE
     "rep"  — a real cycle. Phases are positions: hang, pull, top, lower.
     "hold" — isometric. There is no mid-rep, so phases are TIME instead:
              what changes between second 2 and second 30. The bracing cost of
              a plank genuinely climbs and the compensation pattern shifts;
              that is a real thing to show, not a filler.

   `pos` is 0..1 and drives the pose rig: 0 is the rig's start position, 1 its
   end. For holds it expresses drift/sag rather than travel.
   ========================================================================== */
(function () {
  "use strict";

  /* --------------------------------------------------------------------------
     1) POSE RIGS — one per movement pattern, not per exercise.
     Every exercise in the pull ladder hangs from a bar; every push exercise is
     prone against the floor. Eight rigs cover all eight patterns, and each
     interpolates between two keyframes by `pos`.

     Joint positions are in a 0..100 box, origin top-left, and are mirrored for
     the two views. `front`/`back` differ only in which muscle shapes are drawn
     over them — the skeleton is shared, so a pose can never disagree with
     itself between views.
     ------------------------------------------------------------------------ */

  /* Each rig gives head, torso line, and limb joints at pos 0 and pos 1.
     Interpolation is linear: these are diagrams, not animation rigs, and an
     eased joint path would imply a precision the rest of this file disclaims. */
  var POSE_RIGS = {
    pull: {
      label: "Hanging from a bar",
      bar: { y: 8 },
      a: { /* dead hang: arms straight overhead, body long */
        head: [50, 30], neck: [50, 36], hip: [50, 62], knee: [50, 78], foot: [50, 92],
        shoulderL: [42, 40], shoulderR: [58, 40],
        elbowL: [40, 25], elbowR: [60, 25],
        handL: [38, 9], handR: [62, 9]
      },
      b: { /* top: chin over bar, elbows down and back */
        head: [50, 15], neck: [50, 21], hip: [50, 47], knee: [50, 63], foot: [50, 77],
        shoulderL: [41, 25], shoulderR: [59, 25],
        elbowL: [33, 33], elbowR: [67, 33],
        handL: [38, 9], handR: [62, 9]
      }
    },
    /* Side-view rigs share one floor line at y=84, and their hands and feet
       actually touch it. An earlier pass had the feet 20 units above the
       floor, which drew a person hovering. */
    push: {
      label: "Prone, hands under shoulders",
      floor: { y: 84 },
      a: { /* top of the push-up: arms extended */
        head: [20, 40], neck: [26, 43], hip: [56, 57], knee: [70, 67], foot: [84, 77],
        shoulderL: [30, 45], shoulderR: [30, 45],
        elbowL: [30, 64], elbowR: [30, 64],
        handL: [30, 83], handR: [30, 83]
      },
      b: { /* bottom: chest to floor, elbows bent back */
        head: [20, 60], neck: [26, 63], hip: [56, 71], knee: [70, 76], foot: [84, 80],
        shoulderL: [30, 65], shoulderR: [30, 65],
        elbowL: [17, 75], elbowR: [17, 75],
        handL: [30, 83], handR: [30, 83]
      }
    },
    dip: {
      label: "Supported on bars, upright",
      a: { /* lockout */
        head: [50, 22], neck: [50, 28], hip: [50, 55], knee: [52, 70], foot: [56, 84],
        shoulderL: [42, 32], shoulderR: [58, 32],
        elbowL: [40, 46], elbowR: [60, 46],
        handL: [39, 60], handR: [61, 60]
      },
      b: { /* bottom: shoulders below elbows */
        head: [50, 40], neck: [50, 46], hip: [50, 72], knee: [52, 86], foot: [56, 96],
        shoulderL: [42, 50], shoulderR: [58, 50],
        elbowL: [34, 52], elbowR: [66, 52],
        handL: [39, 60], handR: [61, 60]
      }
    },
    /* Squat is drawn from the SIDE. A squat's whole story is depth and the
       hip/knee travel that produces it, and neither is visible from the front
       — a frontal squat rig just gets shorter. */
    squat: {
      label: "Standing, feet planted",
      floor: { y: 88 },
      a: { /* standing tall */
        head: [44, 14], neck: [44, 22], hip: [44, 50], knee: [44, 69], foot: [44, 87],
        shoulderL: [44, 24], shoulderR: [44, 24],
        elbowL: [44, 38], elbowR: [44, 38],
        handL: [44, 50], handR: [44, 50]
      },
      b: { /* bottom: hips back and down, knees forward, torso leaning */
        head: [53, 34], neck: [51, 40], hip: [38, 62], knee: [53, 70], foot: [44, 87],
        shoulderL: [50, 42], shoulderR: [50, 42],
        elbowL: [57, 50], elbowR: [57, 50],
        handL: [61, 45], handR: [61, 45]
      }
    },
    hinge: {
      label: "Hips as the hinge",
      floor: { y: 84 },
      a: { /* hips down / start */
        head: [18, 64], neck: [24, 65], hip: [56, 74], knee: [72, 68], foot: [80, 82],
        shoulderL: [28, 66], shoulderR: [28, 66],
        elbowL: [26, 74], elbowR: [26, 74],
        handL: [24, 83], handR: [24, 83]
      },
      b: { /* hips extended / lockout */
        head: [18, 64], neck: [24, 65], hip: [56, 60], knee: [72, 62], foot: [80, 82],
        shoulderL: [28, 66], shoulderR: [28, 66],
        elbowL: [26, 74], elbowR: [26, 74],
        handL: [24, 83], handR: [24, 83]
      }
    },
    core: {
      label: "Braced against the floor",
      floor: { y: 84 },
      a: { /* held line: forearms flat on the floor, body straight */
        head: [20, 50], neck: [26, 53], hip: [56, 64], knee: [70, 72], foot: [84, 79],
        shoulderL: [30, 55], shoulderR: [30, 55],
        elbowL: [30, 80], elbowR: [30, 80],
        handL: [46, 82], handR: [46, 82]
      },
      b: { /* the sag a failing brace lets in — hips drop toward the floor */
        head: [20, 54], neck: [26, 57], hip: [56, 77], knee: [70, 80], foot: [84, 81],
        shoulderL: [30, 59], shoulderR: [30, 59],
        elbowL: [30, 80], elbowR: [30, 80],
        handL: [46, 82], handR: [46, 82]
      }
    },
    shoulder: {
      label: "Pressing overhead / inverted",
      a: { /* head high, arms extended */
        head: [50, 26], neck: [50, 33], hip: [50, 58], knee: [50, 74], foot: [50, 90],
        shoulderL: [42, 36], shoulderR: [58, 36],
        elbowL: [39, 24], elbowR: [61, 24],
        handL: [40, 12], handR: [60, 12]
      },
      b: { /* bottom: head near hands, elbows bent wide */
        head: [50, 18], neck: [50, 25], hip: [50, 52], knee: [50, 68], foot: [50, 84],
        shoulderL: [42, 28], shoulderR: [58, 28],
        elbowL: [31, 20], elbowR: [69, 20],
        handL: [40, 12], handR: [60, 12]
      }
    },
    skill: {
      label: "Held shape",
      a: {
        head: [50, 24], neck: [50, 31], hip: [50, 58], knee: [56, 72], foot: [62, 86],
        shoulderL: [42, 34], shoulderR: [58, 34],
        elbowL: [40, 48], elbowR: [60, 48],
        handL: [39, 62], handR: [61, 62]
      },
      b: {
        head: [50, 28], neck: [50, 35], hip: [50, 62], knee: [62, 68], foot: [76, 70],
        shoulderL: [42, 38], shoulderR: [58, 38],
        elbowL: [40, 52], elbowR: [60, 52],
        handL: [39, 66], handR: [61, 66]
      }
    }
  };

  /* --------------------------------------------------------------------------
     2) PHASE MAP
     `muscles` values are arrays in phase order, 0..1, using muscles.data.js
     group keys. Only groups the movement genuinely involves are listed — a bar
     sitting at 0.05 for every phase is noise, not information.
     ------------------------------------------------------------------------ */
  var PHASE_MAP = {};

  function p(id, kind, phases, muscles) {
    PHASE_MAP[id] = { kind: kind, phases: phases, muscles: muscles };
  }

  /* ---- PULL: the worked example ---- */
  p("pull_4", "rep", [
    { name: "Dead hang", pos: 0.00,
      desc: "Arms fully extended below the bar. Grip is working hardest here at full stretch, and the shoulder stabilisers switch on before any pulling starts." },
    { name: "Initiate pull", pos: 0.25,
      desc: "The scapula depresses and retracts first. Lats and lower traps set the shoulder before the elbows bend much at all." },
    { name: "Mid-pull", pos: 0.55,
      desc: "Elbows drive down and back. The lats and biceps take over as the main movers through the hardest part of the range." },
    { name: "Top", pos: 0.88,
      desc: "Peak contraction with the chin over the bar. Lats, biceps and the whole upper back squeeze hardest here." },
    { name: "Lower (eccentric)", pos: 0.40,
      desc: "The same muscles lengthen under control on the way down. This is where a lot of real pulling strength is actually built." }
  ], {
    forearms:   [0.85, 0.70, 0.65, 0.60, 0.75],
    lats:       [0.30, 0.65, 0.90, 1.00, 0.85],
    upper_back: [0.25, 0.80, 0.60, 0.75, 0.55],
    biceps:     [0.20, 0.30, 0.70, 0.90, 0.75],
    chest:      [0.10, 0.20, 0.40, 0.50, 0.30],
    abs:        [0.40, 0.50, 0.50, 0.60, 0.50]
  });

  /* ---- PUSH ---- */
  p("push_2", "rep", [
    { name: "Top / plank", pos: 0.00,
      desc: "Arms locked, body one rigid line. The chest and triceps are barely loaded here; the abs and glutes are doing the work of not sagging." },
    { name: "Descent", pos: 0.35,
      desc: "Lowering under control with the elbows tracking back around 45 degrees. Chest and front delts lengthen under load." },
    { name: "Bottom", pos: 0.90,
      desc: "Chest just off the floor at full stretch. Peak demand on the chest and front delts, with the triceps loaded and ready to reverse." },
    { name: "Press", pos: 0.50,
      desc: "Driving back up. Chest and triceps share the work, and the triceps peak as the elbows approach lockout." },
    { name: "Lockout", pos: 0.05,
      desc: "Back to the rigid line, shoulder blades protracted. Triceps finish the rep, the serratus and abs hold the plank." }
  ], {
    chest:       [0.25, 0.70, 0.90, 0.85, 0.40],
    triceps:     [0.30, 0.55, 0.75, 0.90, 0.70],
    delts_front: [0.25, 0.60, 0.80, 0.70, 0.40],
    abs:         [0.60, 0.60, 0.65, 0.65, 0.60],
    glutes:      [0.40, 0.40, 0.45, 0.45, 0.40],
    forearms:    [0.25, 0.30, 0.35, 0.30, 0.25]
  });

  /* ---- DIP ---- */
  p("dip_3", "rep", [
    { name: "Support hold", pos: 0.00,
      desc: "Locked out on straight arms, shoulders down away from the ears. Triceps hold the lockout while the scapular stabilisers keep the shoulder safe." },
    { name: "Descent", pos: 0.40,
      desc: "Lowering with a slight forward lean. The chest and front delts take an increasing stretch as the elbows bend." },
    { name: "Bottom", pos: 0.95,
      desc: "Shoulders at or just below elbow height. The deepest, most vulnerable position — peak chest and front delt demand." },
    { name: "Press", pos: 0.55,
      desc: "Driving up out of the hole. Chest and triceps work together; this is where most people stall." },
    { name: "Lockout", pos: 0.05,
      desc: "Elbows straight, chest proud. The triceps finish, and the lower traps keep the shoulders from shrugging up." }
  ], {
    triceps:     [0.55, 0.65, 0.85, 0.95, 0.80],
    chest:       [0.30, 0.70, 0.90, 0.85, 0.45],
    delts_front: [0.30, 0.65, 0.85, 0.70, 0.40],
    upper_back:  [0.45, 0.50, 0.55, 0.50, 0.45],
    abs:         [0.40, 0.45, 0.50, 0.50, 0.40],
    forearms:    [0.45, 0.45, 0.50, 0.45, 0.40]
  });

  /* ---- SQUAT ---- */
  p("squat_1", "rep", [
    { name: "Standing", pos: 0.00,
      desc: "Tall, feet planted, weight through the mid-foot. Almost nothing is loaded yet beyond a light postural brace." },
    { name: "Descent", pos: 0.45,
      desc: "Hips travel back and down. Quads and glutes lengthen under load while the abs and lower back hold the torso angle." },
    { name: "Bottom", pos: 0.95,
      desc: "Deepest position, knees tracking over the toes. Peak stretch on the quads and glutes, and the most bracing the trunk will do." },
    { name: "Drive", pos: 0.55,
      desc: "Pushing the floor away. Quads and glutes are the movers; the hamstrings assist in stabilising the knee." },
    { name: "Lockout", pos: 0.10,
      desc: "Standing again with the hips fully extended. A brief glute squeeze finishes the rep." }
  ], {
    quads:       [0.20, 0.70, 0.95, 0.90, 0.35],
    glutes:      [0.20, 0.60, 0.85, 0.90, 0.50],
    hamstrings:  [0.15, 0.40, 0.55, 0.50, 0.30],
    abs:         [0.25, 0.50, 0.60, 0.55, 0.30],
    lower_back:  [0.25, 0.55, 0.65, 0.60, 0.35]
  });

  /* ---- HINGE (bilateral) ---- */
  p("hinge_2", "rep", [
    { name: "Hips down", pos: 0.00,
      desc: "Starting with the hips low and the shoulders supported. The glutes are stretched and largely unloaded." },
    { name: "Drive up", pos: 0.45,
      desc: "Pushing through the heels and driving the hips upward. Glutes and hamstrings take over immediately." },
    { name: "Lockout", pos: 0.95,
      desc: "Hips fully extended, ribs down, body in a straight line from knee to shoulder. Peak glute contraction is here, not at the bottom." },
    { name: "Hold", pos: 0.90,
      desc: "A deliberate pause at the top. The glutes stay under tension and the abs stop the lower back from taking over." },
    { name: "Lower", pos: 0.35,
      desc: "Controlled descent back to the start. The hamstrings and glutes lengthen under load rather than dropping." }
  ], {
    glutes:      [0.25, 0.80, 1.00, 0.95, 0.70],
    hamstrings:  [0.25, 0.65, 0.75, 0.70, 0.60],
    lower_back:  [0.20, 0.45, 0.55, 0.55, 0.40],
    abs:         [0.30, 0.45, 0.60, 0.60, 0.45],
    quads:       [0.15, 0.35, 0.40, 0.35, 0.25]
  });

  /* ---- HINGE (knee-flexion dominant) ---- */
  p("hinge_5", "rep", [
    { name: "Upright", pos: 0.00,
      desc: "Kneeling tall with the ankles anchored, hips extended. The hamstrings are already loaded just holding this position." },
    { name: "Break", pos: 0.30,
      desc: "The first few degrees forward. Hamstring demand climbs steeply and immediately — this is the point most people lose control." },
    { name: "Mid-descent", pos: 0.65,
      desc: "The hardest part of the range. The hamstrings are lengthening under near-maximal eccentric load with a long lever arm." },
    { name: "Catch", pos: 0.95,
      desc: "Near the floor, catching with the hands. Hamstring tension finally drops as the arms take the load." },
    { name: "Return", pos: 0.40,
      desc: "Pushing back up. Most people need hand assistance here; the hamstrings work concentrically at whatever they can contribute." }
  ], {
    hamstrings:  [0.55, 0.85, 1.00, 0.70, 0.80],
    glutes:      [0.45, 0.60, 0.70, 0.50, 0.60],
    abs:         [0.40, 0.55, 0.70, 0.60, 0.55],
    lower_back:  [0.35, 0.50, 0.60, 0.50, 0.50],
    quads:       [0.20, 0.25, 0.30, 0.35, 0.30]
  });

  /* ---- SHOULDER ---- */
  p("shoulder_1", "rep", [
    { name: "Pike top", pos: 0.00,
      desc: "Hips high, body folded, arms straight. The shoulders carry the load; the position itself is the setup, not the work." },
    { name: "Descent", pos: 0.40,
      desc: "Lowering the crown of the head toward the floor. Front delts and triceps lengthen under load as the elbows bend." },
    { name: "Bottom", pos: 0.92,
      desc: "Head just off the floor. Peak front-delt demand, with the triceps loaded and the upper back stabilising the scapula." },
    { name: "Press", pos: 0.50,
      desc: "Driving back up. Front delts and triceps share the work, triceps peaking toward lockout." },
    { name: "Lockout", pos: 0.05,
      desc: "Arms straight, shoulders pushed away from the ears. The triceps finish and the serratus protracts." }
  ], {
    delts_front: [0.40, 0.75, 0.95, 0.85, 0.50],
    triceps:     [0.35, 0.60, 0.80, 0.90, 0.65],
    delts_side:  [0.30, 0.50, 0.65, 0.55, 0.35],
    upper_back:  [0.35, 0.45, 0.55, 0.50, 0.40],
    abs:         [0.35, 0.40, 0.45, 0.45, 0.40],
    chest:       [0.15, 0.30, 0.40, 0.35, 0.20]
  });

  p("shoulder_6", "rep", [
    { name: "Handstand", pos: 0.00,
      desc: "Fully inverted and locked out, body stacked over the hands. The grip and forearms are constantly correcting balance." },
    { name: "Descent", pos: 0.40,
      desc: "Lowering under control with the elbows tracking slightly forward. Front delts take an enormous eccentric load." },
    { name: "Bottom", pos: 0.92,
      desc: "Head lightly touching the floor. The hardest position in the movement — near-maximal front delt and tricep demand." },
    { name: "Press", pos: 0.50,
      desc: "Driving back to the stack. Triceps and front delts fight through the sticking point together." },
    { name: "Lockout", pos: 0.05,
      desc: "Back to the full handstand. Triceps finish while the whole trunk keeps the line from breaking." }
  ], {
    delts_front: [0.55, 0.85, 1.00, 0.95, 0.65],
    triceps:     [0.50, 0.75, 0.90, 1.00, 0.75],
    delts_side:  [0.45, 0.60, 0.75, 0.65, 0.50],
    upper_back:  [0.50, 0.60, 0.70, 0.65, 0.55],
    abs:         [0.60, 0.65, 0.70, 0.70, 0.65],
    forearms:    [0.70, 0.70, 0.75, 0.75, 0.70],
    chest:       [0.20, 0.35, 0.45, 0.40, 0.25]
  });

  /* ---- HOLDS ----
     Time-based phases. The claim is not that a plank's abs get stronger over
     30 seconds — it is that the DEMAND climbs as the brace fatigues, and that
     the supporting muscles pick up an increasing share as it does. That is the
     honest thing a hold has to show, and it is why these exist rather than one
     flat bar chart. */
  p("core_1", "hold", [
    { name: "Set up", pos: 0.00,
      desc: "Forearms down, body one line, ribs pulled toward the hips. Everything is in position and nothing is tired yet." },
    { name: "First 10s", pos: 0.05,
      desc: "A settled, well-braced plank. The abs hold the pelvis in place and the shoulders carry a steady, unremarkable load." },
    { name: "20s", pos: 0.30,
      desc: "Ab demand climbs noticeably. The glutes start contributing more to stop the hips from drifting upward or sagging." },
    { name: "30s+", pos: 0.65,
      desc: "The brace is fatiguing. The lower back and shoulders take an increasing share as the abs struggle to hold the line." },
    { name: "Failure point", pos: 1.00,
      desc: "The hips drop and the lower back takes over. This is the rep ending, not a harder rep — stop here rather than holding a broken position." }
  ], {
    abs:         [0.50, 0.65, 0.80, 0.95, 1.00],
    obliques:    [0.35, 0.45, 0.55, 0.70, 0.80],
    glutes:      [0.35, 0.45, 0.60, 0.70, 0.75],
    delts_front: [0.30, 0.40, 0.50, 0.60, 0.70],
    lower_back:  [0.25, 0.30, 0.40, 0.60, 0.80],
    quads:       [0.25, 0.30, 0.35, 0.40, 0.45]
  });

  p("core_4", "hold", [
    { name: "Support", pos: 0.00,
      desc: "Hands down, shoulders depressed, body still on the floor. The triceps and shoulders lock the support position first." },
    { name: "Lift off", pos: 0.20,
      desc: "Legs come up to horizontal. Ab demand jumps immediately and the hip flexors engage hard to hold the legs there." },
    { name: "Held", pos: 0.35,
      desc: "The actual L-sit. Abs, hip flexors, triceps and lats all working at once — this is why it is so much harder than it looks." },
    { name: "Fatigue", pos: 0.70,
      desc: "The legs start to drop and the shoulders creep up toward the ears. Everything is working harder to hold a degrading shape." },
    { name: "Break", pos: 1.00,
      desc: "The knees bend and the hips sink. Come down deliberately rather than collapsing out of it." }
  ], {
    abs:         [0.40, 0.85, 0.95, 1.00, 0.90],
    quads:       [0.25, 0.70, 0.80, 0.85, 0.70],
    triceps:     [0.60, 0.70, 0.75, 0.85, 0.80],
    lats:        [0.40, 0.55, 0.65, 0.75, 0.65],
    upper_back:  [0.45, 0.55, 0.60, 0.70, 0.65],
    obliques:    [0.30, 0.45, 0.55, 0.65, 0.60],
    forearms:    [0.35, 0.40, 0.45, 0.55, 0.55]
  });

  /* Dead hang earns its place: it is the pull ladder's L1 and the single best
     illustration of grip as a limiting factor rather than a supporting one. */
  p("pull_1", "hold", [
    { name: "Grip the bar", pos: 0.00,
      desc: "Hands on, feet off. Grip switches on immediately and the shoulders are still loose at the top of the hang." },
    { name: "Settle", pos: 0.15,
      desc: "The shoulder stabilisers engage to stop the passive sag. This is an active hang, not just dangling from the joints." },
    { name: "20s", pos: 0.35,
      desc: "Forearm demand is climbing steadily and is already the limiting factor. The lats and upper back work to keep the shoulders packed." },
    { name: "Grip fading", pos: 0.75,
      desc: "The fingers start to open. Everything else is still comfortable — the grip is what ends this, which is exactly the point of the exercise." },
    { name: "Let go", pos: 1.00,
      desc: "Drop off deliberately before the hands fail on their own. Grip strength is built right up against this edge, not past it." }
  ], {
    forearms:    [0.70, 0.85, 0.95, 1.00, 1.00],
    upper_back:  [0.30, 0.55, 0.60, 0.60, 0.55],
    lats:        [0.25, 0.50, 0.55, 0.55, 0.50],
    abs:         [0.20, 0.35, 0.40, 0.45, 0.40],
    biceps:      [0.15, 0.25, 0.30, 0.35, 0.35]
  });

  p("shoulder_3", "hold", [
    { name: "Kick up", pos: 0.00,
      desc: "Getting inverted with the heels resting against the wall. Shoulders take the whole bodyweight the moment you arrive." },
    { name: "Stack", pos: 0.20,
      desc: "Finding the line — hands, shoulders and hips stacked. Front delts carry the load and the forearms correct constantly." },
    { name: "Held", pos: 0.40,
      desc: "A settled hold. Shoulders and forearms work continuously; the abs stop the lower back from arching off the wall." },
    { name: "Fatigue", pos: 0.75,
      desc: "The shoulders start to burn and the line drifts into an arch. Ab and lower-back demand rise to fight it." },
    { name: "Come down", pos: 1.00,
      desc: "Step down under control. A handstand held past the point the line breaks trains the arch, not the handstand." }
  ], {
    delts_front: [0.70, 0.85, 0.90, 1.00, 0.90],
    forearms:    [0.60, 0.75, 0.80, 0.90, 0.85],
    triceps:     [0.55, 0.65, 0.70, 0.80, 0.75],
    upper_back:  [0.50, 0.60, 0.65, 0.75, 0.70],
    abs:         [0.45, 0.60, 0.65, 0.80, 0.75],
    lower_back:  [0.25, 0.30, 0.35, 0.55, 0.55]
  });

  window.PHASE_MAP = PHASE_MAP;
  window.POSE_RIGS = POSE_RIGS;
})();
