/* =====================================================================
   WELLNESS HUB · EXERCISE GUIDES · BATCH C1 — upper-body coverage
   ---------------------------------------------------------------------
   · The written guide for each exercise in the curl, lateral, reardelt,
     cuff, traps, neck and grip slots (plan E2). Written by step 4.6.
   · Schema and style rules: fitness/content/STYLE.md. Checked by
     tools/check-exercise-content.js.
   · No prescriptions here: rep ranges, hold times and when to step up
     come from training.js, never from this text.
   · The three neck guides carry plan D2's safety copy: slow, no jerking,
     stop at dizziness, pain or tingling.
   Public: window.EXERCISE_CONTENT[id], window.EXERCISE_CONTENT_BATCHES.c1
   ===================================================================== */
(function () {
  "use strict";
  var C = window.EXERCISE_CONTENT = window.EXERCISE_CONTENT || {};
  var B = window.EXERCISE_CONTENT_BATCHES = window.EXERCISE_CONTENT_BATCHES || {};
  B.c1 = "pending";

  /* ---- curl · biceps ---- */

  C.acc_curl_doorframe = {
    summary: "A bodyweight curl done by leaning back from a door frame and pulling your chest toward it, which trains your biceps with no equipment.",
    setup: [
      "Use a solid, fixed door frame, and lean on it gently first to check that it doesn't flex.",
      "Take hold of the frame's edge with both hands at chest height, palms turned toward you.",
      "Walk your feet forward and lean back with straight arms until your weight hangs on your hands.",
      "Make your body one rigid line from head to heels, with your glutes and stomach tight."
    ],
    steps: [
      "Start leaning back with your arms straight and your elbows pointing down.",
      "Bend your elbows and curl your chest toward the frame.",
      "Keep your elbows close to your ribs as you pull.",
      "Straighten your arms slowly until you are leaning back again."
    ],
    breathing: "Breathe out as you curl your chest in, and breathe in as you lean back out.",
    tempo: "Pull in steadily and lower slowly, taking about two seconds to straighten your arms.",
    feel: {
      should: "In the front of your upper arms, with your forearms and grip working to hold you.",
      shouldnt: "In your lower back, which means your hips are sagging, or as a sharp ache at the front of your elbow."
    },
    mistakes: [
      { mistake: "Your hips sag or bend, so your body stops being one line.",
        fix: "Squeeze your glutes and stomach; if you can't keep the line, stand more upright." },
      { mistake: "You swing your hips forward to cheat the pull.",
        fix: "Keep your hips still and move only at the elbows." }
    ],
    safety: [
      "Stop at once if the frame creaks or moves, and find a more solid one.",
      "If the front of your elbow aches, stand more upright and ease the pull, and stop if it persists."
    ],
    variations: {
      alternatives: [
        { id: "acc_curl_band", text: "Band Curl trains the same muscles standing upright, with a resistance band instead of a frame." }
      ]
    }
  };

  C.acc_curl_invrow = {
    summary: "A row lying under a low bar or rings with your palms facing you, which brings your biceps more into the pull than an overhand row does.",
    setup: [
      "Set a bar at waist height or hang rings low, and check that it is fixed and takes your full weight.",
      "Lie underneath it and take an underhand grip, palms toward you, hands shoulder-width apart.",
      "Straighten your body from shoulders to heels with your heels on the floor; bend your knees to make it easier."
    ],
    steps: [
      "Tighten your stomach and glutes so your body is one line.",
      "Pull your chest toward the bar by bending your elbows, keeping them close to your sides.",
      "Pause briefly with your chest at the bar.",
      "Lower until your arms are straight, under control."
    ],
    breathing: "Breathe out as you pull your chest up, and breathe in as you lower.",
    tempo: "Pull up steadily, pause for a beat, and lower over about two seconds.",
    feel: {
      should: "In your biceps and between your shoulder blades, with your grip working.",
      shouldnt: "In your lower back, or as an ache at the front of your elbow."
    },
    mistakes: [
      { mistake: "Your hips sag so your body bends in the middle.",
        fix: "Squeeze your glutes and keep your ribs down so your body stays one line." },
      { mistake: "You shrug toward your ears instead of bending your elbows.",
        fix: "Pull your shoulders down and back first, then bend your elbows." }
    ],
    safety: [
      "The underhand grip puts more work through the front of your elbow than a palms-down row, so stop if it aches and switch to a palms-down grip.",
      "Check the bar or rings before you lie under them, and stop if anything shifts."
    ]
  };

  C.acc_curl_band = {
    summary: "A standing curl against a resistance band, where the pull gets heavier as your hands rise toward your shoulders.",
    setup: [
      "Check the band for nicks or thin spots before you start.",
      "Stand on the middle of the band with your whole foot, feet hip-width apart, and hold an end in each hand.",
      "Stand tall with your palms forward, your elbows beside your ribs and your shoulders down."
    ],
    steps: [
      "Keep your elbows pinned beside your ribs.",
      "Curl your hands toward your shoulders against the band's pull.",
      "Squeeze at the top without letting your elbows drift forward.",
      "Lower slowly until your arms are straight, without letting the band snap your hands back."
    ],
    breathing: "Breathe out as you curl up, and breathe in as you lower.",
    tempo: "Curl up smoothly, and lower slowly, because the band pulls hardest at the top.",
    feel: {
      should: "In the front of your upper arms.",
      shouldnt: "In your shoulders or lower back, which means you are swinging."
    },
    mistakes: [
      { mistake: "You swing your torso backward to get your hands up.",
        fix: "Soften your knees, tighten your stomach and keep your upper body still; use a lighter band if you can't." },
      { mistake: "Your elbows drift forward, so your shoulders do the lifting.",
        fix: "Keep your elbows beside your ribs the whole way, as if they were hinges." }
    ],
    safety: [
      "Stand on the band with the whole foot so it can't slip out, and replace it if you see a nick.",
      "Stop if the front of your elbow aches rather than your biceps tiring."
    ],
    variations: {
      alternatives: [
        { id: "acc_curl_db", text: "Dumbbell Curl trains the same muscles if you own dumbbells instead of a band." }
      ]
    }
  };

  C.acc_curl_db = {
    summary: "A standing curl with a dumbbell in each hand, the most direct way to load your biceps once you own weights.",
    setup: [
      "Choose a weight you can lower under control, not one you have to heave up.",
      "Stand tall with a dumbbell in each hand and your palms facing forward.",
      "Pin your elbows beside your ribs and keep your shoulders down."
    ],
    steps: [
      "Curl both weights toward your shoulders without swinging.",
      "Keep your elbows beside your ribs the whole way up.",
      "Squeeze at the top for a beat.",
      "Lower until your arms are fully straight."
    ],
    breathing: "Breathe out as you curl up, and breathe in as you lower.",
    tempo: "Curl up smoothly, and take about two seconds to lower to straight arms.",
    feel: {
      should: "In the front of your upper arms.",
      shouldnt: "In your lower back or the fronts of your shoulders, which means you are rocking the weight up."
    },
    mistakes: [
      { mistake: "You rock your torso to heave the weight up.",
        fix: "Use a lighter weight, tighten your stomach and let only your elbows move." },
      { mistake: "You cut the lowering short, so only the top half of the range is worked.",
        fix: "Straighten your arms fully at the bottom of every rep." }
    ],
    safety: [
      "Drop to a lighter weight if the front of your elbow aches, and stop if it persists."
    ],
    variations: {
      alternatives: [
        { id: "acc_curl_hammer", text: "Hammer Curl keeps your palms facing in, which some elbows tolerate better than a palms-up curl." }
      ]
    }
  };

  C.acc_curl_hammer = {
    summary: "A curl with your palms facing each other, which works your biceps and the top of your forearms.",
    setup: [
      "Choose a weight you can lower under control.",
      "Stand tall with a dumbbell in each hand, your palms facing your thighs.",
      "Keep your elbows beside your ribs and your shoulders down."
    ],
    steps: [
      "Keep your palms facing in the whole way, as if holding a hammer.",
      "Curl the weights toward your shoulders without letting your elbows move forward.",
      "Squeeze at the top for a beat.",
      "Lower slowly until your arms are straight."
    ],
    breathing: "Breathe out as you curl up, and breathe in as you lower.",
    tempo: "Curl up smoothly, and take about two seconds to lower to straight arms.",
    feel: {
      should: "In the front of your upper arms and along the top of your forearms.",
      shouldnt: "In your wrists or your shoulders."
    },
    mistakes: [
      { mistake: "Your wrists bend backward under the weight.",
        fix: "Keep your wrists straight, in line with your forearms, and use a lighter weight if they won't stay there." },
      { mistake: "You swing your shoulders to get the weights moving.",
        fix: "Stand tall, keep your elbows still and start each rep from a stop." }
    ],
    safety: [
      "Stop if your wrist or the inside of your elbow aches rather than your arm tiring."
    ],
    variations: {
      alternatives: [
        { id: "acc_curl_db", text: "Dumbbell Curl turns your palms forward, a different grip on the same muscles." }
      ]
    }
  };

  /* ---- lateral · side delts ---- */

  C.acc_lateral_iso = {
    summary: "Pressing the back of your hand into a door frame without letting your arm move, which works the sides of your shoulders with no equipment.",
    setup: [
      "Stand upright inside a doorway with one arm hanging by your side.",
      "Place the back of your wrist against the frame, with your elbow nearly straight.",
      "Keep your shoulder down, away from your ear."
    ],
    steps: [
      "Press the back of your hand into the frame as if raising your arm out to the side.",
      "Build the push gradually rather than all at once.",
      "Hold the push steady while your arm stays still against the frame.",
      "Ease off slowly at the end, then repeat with the other arm."
    ],
    breathing: "Breathe steadily through the hold and never hold your breath, which makes you shrug.",
    tempo: "There is no movement: build the push over about two seconds, hold it steady, then release slowly.",
    feel: {
      should: "On the outside of your shoulder, just below the point of it.",
      shouldnt: "In your neck or the top of your shoulder, which means you are shrugging."
    },
    mistakes: [
      { mistake: "You hike your shoulder toward your ear.",
        fix: "Let your shoulder sink and push with less force until it stays down." },
      { mistake: "You lean your whole body into the frame.",
        fix: "Stand tall with your weight even on both feet, and let only your arm push." }
    ],
    safety: [
      "Push firmly, not with everything you have, and ease off if the top of your shoulder pinches.",
      "Stop if a sharp pain appears in your shoulder, and get a persistent one looked at."
    ],
    variations: {
      alternatives: [
        { id: "acc_lateral_band", text: "Band Lateral Raise works the same muscles through a full range of movement, if you own a band." }
      ]
    }
  };

  C.acc_lateral_band = {
    summary: "Raising your arms out to the sides against a band, to train the middle of your shoulders through a full range.",
    setup: [
      "Check the band for nicks, then stand on its middle with your whole foot, feet hip-width apart.",
      "Hold an end in each hand with your arms by your sides.",
      "Stand tall and keep your shoulders down."
    ],
    steps: [
      "Raise both arms out to the sides, keeping a slight bend in your elbows.",
      "Lead with your elbows and let your hands follow.",
      "Stop at about shoulder height.",
      "Lower slowly against the pull."
    ],
    breathing: "Breathe out as you raise your arms, and breathe in as you lower them.",
    tempo: "Raise smoothly and take about two seconds to lower, so the band doesn't pull your arms down.",
    feel: {
      should: "On the outside of your shoulders.",
      shouldnt: "In your neck and the tops of your shoulders, which means you are shrugging."
    },
    mistakes: [
      { mistake: "You shrug your shoulders to get your arms up.",
        fix: "Press your shoulders down, lead with your elbows and use a lighter band if you need one." },
      { mistake: "You raise your arms above shoulder height, where your neck and traps take over.",
        fix: "Stop when your elbows are level with your shoulders." }
    ],
    safety: [
      "Stop at shoulder height, and shorten the range if the top of your shoulder pinches on the way up.",
      "Replace a band that shows nicks, and stand on it with the whole foot."
    ],
    variations: {
      alternatives: [
        { id: "acc_lateral_db", text: "Dumbbell Lateral Raise does the same job with light dumbbells instead of a band." }
      ]
    }
  };

  C.acc_lateral_db = {
    summary: "Raising light dumbbells out to the sides to shoulder height, which works the middle of your shoulders directly.",
    setup: [
      "Choose a light weight, because your arms are at their longest lever here and heavy weights make you swing.",
      "Stand tall with a dumbbell in each hand at your sides, feet hip-width apart.",
      "Soften your elbows and keep your shoulders down."
    ],
    steps: [
      "Raise both arms out to the sides, with a soft bend in your elbows.",
      "Let your elbows lead and your hands follow.",
      "Stop at shoulder height.",
      "Lower slowly to your sides."
    ],
    breathing: "Breathe out as you raise your arms, and breathe in as you lower them.",
    tempo: "Raise smoothly and take about two seconds to lower.",
    feel: {
      should: "On the outside of your shoulders.",
      shouldnt: "In your neck and the tops of your shoulders, which means your traps have taken over."
    },
    mistakes: [
      { mistake: "You swing your body to get the weights up.",
        fix: "Use lighter weights, tighten your stomach and start each rep from a stop." },
      { mistake: "You pick a weight your shoulders can't lift, so your traps take over.",
        fix: "Go lighter until you can raise your arms without shrugging." }
    ],
    safety: [
      "Use a weight you can lift without shrugging, and stop at shoulder height.",
      "Stop if the top of your shoulder pinches rather than tires."
    ],
    variations: {
      alternatives: [
        { id: "acc_lateral_leanaway", text: "Lean-Away Lateral Raise changes the angle the weight pulls at by leaning away from a frame, one arm at a time." }
      ]
    }
  };

  C.acc_lateral_leanaway = {
    summary: "A one-arm dumbbell raise done while leaning away from a fixed support, which changes the angle the weight pulls on the side of your shoulder.",
    setup: [
      "Check that the door frame or post is solid, because you lean your weight on it.",
      "Hold the frame or post with one hand and lean your body away from it, with that arm straight.",
      "Hold a light dumbbell in your free hand, hanging by your side.",
      "Keep your body in one line and your feet planted."
    ],
    steps: [
      "Raise the dumbbell out to the side to shoulder height, with your elbow leading.",
      "Keep your leaning body still while the arm lifts.",
      "Pause briefly at the top.",
      "Lower slowly, and swap sides once you finish the set."
    ],
    breathing: "Breathe out as you raise the weight, and breathe in as you lower it.",
    tempo: "Raise smoothly and take about two seconds to lower, with your body still.",
    feel: {
      should: "On the outside of the shoulder of the arm that is lifting.",
      shouldnt: "In your neck, or in the lower back on the side you lean toward."
    },
    mistakes: [
      { mistake: "Your hips swing out to get the weight up.",
        fix: "Lean less, tighten your stomach and use a lighter weight." },
      { mistake: "You pull on the frame instead of just holding it.",
        fix: "Hold with a loose, steady hand and let your body weight do the leaning." }
    ],
    safety: [
      "Test the frame or post with your weight before you lift, and stop if it moves.",
      "Keep the weight light enough that your neck stays out of it."
    ],
    variations: {
      alternatives: [
        { id: "acc_lateral_db", text: "Dumbbell Lateral Raise raises both arms together while you stand upright, with no frame needed." }
      ]
    }
  };

  /* ---- reardelt · rear delts ---- */

  C.acc_reardelt_tdraise = {
    summary: "Lifting your arms out to the sides while lying face down, which trains the backs of your shoulders with no equipment.",
    setup: [
      "Lie face down on the floor with your arms straight out to the sides in a T, thumbs pointing up.",
      "Rest your forehead near the floor, so your head is in line with your spine.",
      "Put a folded towel under your hips if your lower back pinches."
    ],
    steps: [
      "Squeeze your shoulder blades together and back.",
      "Lift both arms off the floor, keeping your thumbs up.",
      "Pause at the top without lifting your head.",
      "Lower with control back to the floor."
    ],
    breathing: "Breathe out as you lift your arms, and breathe in as you lower them.",
    tempo: "Lift smoothly, pause for a beat at the top, and lower slowly.",
    feel: {
      should: "Across the backs of your shoulders and between your shoulder blades.",
      shouldnt: "In your lower back or the back of your neck."
    },
    mistakes: [
      { mistake: "You crank your neck up to look forward.",
        fix: "Keep your forehead near the floor and look straight down at it." },
      { mistake: "You lift from your lower back instead of your shoulder blades.",
        fix: "Keep the lift small and start it by squeezing your shoulder blades together." }
    ],
    safety: [
      "Keep the lift small and smooth, and stop if your lower back pinches.",
      "Stop if a sharp pain appears at the back of your shoulder."
    ],
    variations: {
      alternatives: [
        { id: "acc_reardelt_dbfly", text: "Bent-Over Reverse Fly trains the same muscles with light dumbbells if you own them." }
      ]
    }
  };

  C.acc_reardelt_snowangel = {
    summary: "A face-down sweep of your arms from your hips to overhead and back, which trains the backs of your shoulders through a long arc.",
    setup: [
      "Lie face down with your arms by your hips, palms down.",
      "Rest your forehead near the floor and keep your neck long.",
      "Lift your arms and chest slightly off the floor before you start moving."
    ],
    steps: [
      "Sweep your arms out and up overhead in a wide arc.",
      "Keep your arms off the floor for the whole arc.",
      "Sweep them back to your hips, pulling your shoulder blades down and in.",
      "Rest your arms on the floor only between sets."
    ],
    breathing: "Breathe steadily through the arc, out on the way overhead and in on the way back.",
    tempo: "Sweep slowly, taking about two seconds each way, so your arms never drop.",
    feel: {
      should: "Across the backs of your shoulders and between your shoulder blades.",
      shouldnt: "In your lower back, which means you are arching to get higher."
    },
    mistakes: [
      { mistake: "Your arms drop to the floor halfway through the arc.",
        fix: "Make the arc smaller until you can keep your arms up the whole way." },
      { mistake: "You lift your chest high by arching your lower back.",
        fix: "Keep your chest lift slight and your neck long, and let your shoulder blades do the work." }
    ],
    safety: [
      "Keep the sweep inside a range that stays smooth, and stop if your shoulder pinches overhead.",
      "Stop if your lower back hurts rather than tires."
    ]
  };

  C.acc_reardelt_bandpull = {
    summary: "Pulling a band apart in front of you at shoulder height, which trains the backs of your shoulders and the muscles between your shoulder blades.",
    setup: [
      "Check the band for nicks, because an end that slips snaps back.",
      "Hold the band in front of you at shoulder height with straight arms, hands about shoulder-width apart.",
      "Stand tall with your ribs down and your shoulders away from your ears."
    ],
    steps: [
      "Pull the band apart by moving your hands out to the sides.",
      "Squeeze your shoulder blades together as you pull.",
      "Keep your arms level with your shoulders.",
      "Return slowly until the band is taut but not slack."
    ],
    breathing: "Breathe out as you pull the band apart, and breathe in as you return.",
    tempo: "Pull smoothly, pause for a beat with your shoulder blades squeezed, and return slowly.",
    feel: {
      should: "Across the backs of your shoulders and between your shoulder blades.",
      shouldnt: "In your neck or the tops of your shoulders, which means you are shrugging."
    },
    mistakes: [
      { mistake: "You shrug up toward your ears.",
        fix: "Press your shoulders down before you pull, and use a lighter band if you can't keep them there." },
      { mistake: "You lean back to finish the pull.",
        fix: "Keep your ribs down and your body still, and stop the pull where your back stays straight." }
    ],
    safety: [
      "Replace a band that shows nicks, and hold it so that an end can't slip out of your hand."
    ],
    variations: {
      alternatives: [
        { id: "acc_reardelt_facepull", text: "Band Face Pull pulls the band toward your face from an anchor, working the same muscles from a different angle." }
      ]
    }
  };

  C.acc_reardelt_facepull = {
    summary: "Pulling a band from an anchor toward your face with your elbows high, which trains the backs of your shoulders and your upper back.",
    setup: [
      "Anchor a band at about face height on a closed door anchor or a solid post, and test it with a gentle tug before you step back.",
      "Hold an end in each hand with your arms straight.",
      "Step back until the band is taut, and stand tall."
    ],
    steps: [
      "Pull your hands toward your face with your elbows high and wide.",
      "Finish with your hands beside your ears.",
      "Squeeze your shoulder blades together for a beat.",
      "Return slowly until your arms are straight."
    ],
    breathing: "Breathe out as you pull toward your face, and breathe in as you return.",
    tempo: "Pull smoothly, squeeze for a beat, and return slowly so the band doesn't snatch your arms forward.",
    feel: {
      should: "Across the backs of your shoulders and between your shoulder blades.",
      shouldnt: "In your neck, or as a pinch at the front of your shoulders."
    },
    mistakes: [
      { mistake: "You pull to your chest with low elbows, which turns it into a row.",
        fix: "Lift your elbows to shoulder height or higher and pull toward your face." },
      { mistake: "The anchor slides or the band unwinds.",
        fix: "Close the anchor properly and tug it gently before every set." }
    ],
    safety: [
      "Make sure the anchor is closed and sound before you step back, because a band that comes loose snaps toward you.",
      "Replace a band that shows nicks."
    ],
    variations: {
      alternatives: [
        { id: "acc_reardelt_bandpull", text: "Band Pull-Apart needs no anchor, because you hold the band in front of you at shoulder height." }
      ]
    }
  };

  C.acc_reardelt_dbfly = {
    summary: "Raising light dumbbells out to the sides from a hinged position, which works the backs of your shoulders.",
    setup: [
      "Choose light weights and hold one in each hand.",
      "Hinge forward at your hips until your back is nearly flat, with your knees soft.",
      "Let your arms hang beneath your shoulders, palms facing each other.",
      "Rest your forehead on a chair if your lower back tires before your shoulders do."
    ],
    steps: [
      "Raise both arms out to the sides, keeping a slight bend in your elbows.",
      "Squeeze your shoulder blades together at the top.",
      "Keep your torso still while your arms move.",
      "Lower slowly without letting your torso drop."
    ],
    breathing: "Breathe out as you raise your arms, and breathe in as you lower them.",
    tempo: "Raise smoothly and take about two seconds to lower, keeping your torso still.",
    feel: {
      should: "Across the backs of your shoulders and between your shoulder blades.",
      shouldnt: "In your lower back or your neck, which means the hinge is doing too much."
    },
    mistakes: [
      { mistake: "You round your back, or your torso rises as the weights go up.",
        fix: "Lighten the weights and hold the hinge steady before you lift." },
      { mistake: "You use weights so heavy that your arms swing them.",
        fix: "Choose weights you can raise without swinging, and start each rep from a stop." }
    ],
    safety: [
      "The held hinge is the demanding part for your lower back, so keep the weights light.",
      "Stop if your lower back hurts rather than tires."
    ],
    variations: {
      alternatives: [
        { id: "acc_reardelt_tdraise", text: "Prone T-Raise trains the same muscles lying face down, with no weights." }
      ]
    }
  };

  /* ---- cuff · rotator cuff ---- */

  C.acc_cuff_walllift = {
    summary: "Sliding your forearms up a wall and lifting your hands off it at the top, a small movement for the rotator cuff muscles that steady your shoulder.",
    setup: [
      "Stand with your back, head and hips against a wall and your feet a short step out.",
      "Bend your elbows to 90° and rest your forearms and the backs of your hands on the wall.",
      "Keep your lower back close to the wall."
    ],
    steps: [
      "Slide your arms up the wall into a Y, keeping them in contact with it.",
      "At the top, lift your hands a few centimetres off the wall.",
      "Hold the lift for a beat.",
      "Lower your hands to the wall, then slide your arms back down against it."
    ],
    breathing: "Breathe steadily through the movement, and breathe out as you lift your hands off the wall.",
    tempo: "Slide slowly, pause for a beat at the lift, and come back down at the same pace.",
    feel: {
      should: "In the back of your shoulders and around your shoulder blades, as a small, steady effort.",
      shouldnt: "In your neck or the tops of your shoulders, or as a pinch at the front of your shoulder."
    },
    mistakes: [
      { mistake: "Your lower back arches away from the wall as your arms rise.",
        fix: "Tuck your ribs down and slide only as high as your lower back stays against the wall." },
      { mistake: "You shrug your shoulders toward your ears.",
        fix: "Press your shoulders down before you slide, and shorten the range until they stay down." }
    ],
    safety: [
      "Stay inside the range where your forearms still touch the wall; the work is in the small, controlled lift, not the reach.",
      "Stop if your shoulder pinches rather than tires."
    ]
  };

  C.acc_cuff_pronew = {
    summary: "A face-down lift of your elbows and hands in a W shape, for the small muscles around your shoulder blades that steady your shoulder.",
    setup: [
      "Lie face down with your forehead near the floor.",
      "Bend your elbows and place your hands beside your head, so your arms make a W.",
      "Keep your neck long and your head in line with your spine."
    ],
    steps: [
      "Draw your shoulder blades down and back.",
      "Lift your elbows and hands off the floor.",
      "Hold a beat at the top, with your thumbs pointing up and slightly back.",
      "Lower your elbows and hands slowly to the floor."
    ],
    breathing: "Breathe out as you lift, and breathe in as you lower.",
    tempo: "Lift smoothly, hold for a beat, and lower slowly.",
    feel: {
      should: "Around your shoulder blades and the backs of your shoulders.",
      shouldnt: "In your lower back or the back of your neck."
    },
    mistakes: [
      { mistake: "You crank your neck up to look forward.",
        fix: "Keep your forehead near the floor and look straight down at it." },
      { mistake: "You let your elbows flare so wide that it becomes a T-raise.",
        fix: "Keep your elbows bent at about a right angle, with your hands near your head." }
    ],
    safety: [
      "Keep the lift small; a short, smooth range is better than a big, shaky one.",
      "Stop if your lower back or your shoulder pinches."
    ]
  };

  C.acc_cuff_bander = {
    summary: "Rotating your forearm outward against a band with your elbow tucked in, a small movement for the rotator cuff muscles at the back of your shoulder.",
    setup: [
      "Anchor a band at elbow height, and check it for nicks.",
      "Stand sideways to the anchor and hold the end with the hand farthest from it.",
      "Tuck that elbow against your side, bent to 90°, with a folded towel between your elbow and your ribs if you like."
    ],
    steps: [
      "Keep your elbow tucked and your wrist straight.",
      "Rotate your forearm outward, away from your belly.",
      "Pause for a beat at the end of the turn.",
      "Return slowly to the start, and change sides once you finish the set."
    ],
    breathing: "Breathe out as you rotate outward, and breathe in as you return.",
    tempo: "Rotate smoothly and take about two seconds to come back.",
    feel: {
      should: "In the back of your shoulder, as a small, steady effort.",
      shouldnt: "In your neck, or as a pinch at the front of your shoulder."
    },
    mistakes: [
      { mistake: "Your elbow drifts away from your ribs.",
        fix: "Keep a folded towel between your elbow and your ribs, and notice when it drops." },
      { mistake: "You turn your whole torso instead of your arm.",
        fix: "Stand square to the anchor's side and move only your forearm." }
    ],
    safety: [
      "Keep the band light: this is a small muscle, and a pull that pinches your shoulder is too much.",
      "Replace a band that shows nicks, and check that the anchor is closed."
    ],
    variations: {
      alternatives: [
        { id: "acc_cuff_sidelying", text: "Side-Lying External Rotation does the same turn lying down, with a light dumbbell instead of a band." }
      ]
    }
  };

  C.acc_cuff_sidelying = {
    summary: "Rotating your forearm upward against a light dumbbell while lying on your side, which trains the rotator cuff muscles at the back of your shoulder.",
    setup: [
      "Lie on one side with your head resting on your lower arm.",
      "Hold a light dumbbell in your top hand, with your elbow bent to 90° against your ribs.",
      "Rest your forearm across your belly to start.",
      "Choose a weight lighter than you think you need."
    ],
    steps: [
      "Rotate your forearm up toward the ceiling, keeping your elbow on your side.",
      "Pause when your forearm is as high as it goes without your elbow moving.",
      "Lower slowly back across your belly.",
      "Finish all your reps on this side before you roll over."
    ],
    breathing: "Breathe out as you rotate up, and breathe in as you lower.",
    tempo: "Rotate up smoothly, and take about two seconds to lower the weight.",
    feel: {
      should: "In the back of your shoulder, as a small, steady effort.",
      shouldnt: "In your neck or the top of your shoulder, or as a pinch in the joint."
    },
    mistakes: [
      { mistake: "You lift your elbow away from your ribs.",
        fix: "Tuck a folded towel between your elbow and your ribs, and keep it there." },
      { mistake: "You use a weight so heavy that your body twists to lift it.",
        fix: "Go lighter until your torso stays still." }
    ],
    safety: [
      "Start lighter than feels necessary, and stop if your shoulder pinches rather than tires."
    ],
    variations: {
      alternatives: [
        { id: "acc_cuff_bander", text: "Band External Rotation does the same turn standing, with a band instead of a dumbbell." }
      ]
    }
  };

  /* ---- traps ---- */

  C.acc_traps_pike = {
    summary: "Shrugging your shoulders up and down from a pike position with straight arms, which trains your upper traps with just your bodyweight.",
    setup: [
      "Warm your wrists up first, because this loads them like a pike push-up.",
      "Start in a pike: hands on the floor, hips high and legs straight or knees slightly bent, so your body makes an inverted V.",
      "Straighten your arms and keep your head between them with your neck relaxed."
    ],
    steps: [
      "Keep your arms straight and push the floor away so your shoulders rise toward your ears.",
      "Pause for a beat at the top.",
      "Let your shoulders sink down between your arms.",
      "Shrug up again without bending your elbows."
    ],
    breathing: "Breathe out as you shrug up, and breathe in as you let your shoulders sink.",
    tempo: "Shrug up smoothly, hold for a beat, and sink slowly rather than dropping.",
    feel: {
      should: "Across the tops of your shoulders, between your neck and your shoulder joints.",
      shouldnt: "In your wrists as a sharp ache, or in your lower back."
    },
    mistakes: [
      { mistake: "You bend your elbows, which turns it into a pike push-up.",
        fix: "Keep your elbows locked straight and move only your shoulders." },
      { mistake: "You move at the hips instead of the shoulders.",
        fix: "Keep your hips high and still, and let only your shoulders rise and fall." }
    ],
    safety: [
      "Stop if your wrists ache sharply, and end the set there rather than pushing through."
    ]
  };

  C.acc_traps_band = {
    summary: "Lifting your shoulders straight up against a band under your feet, a simple way to train your upper traps with a band.",
    setup: [
      "Check the band for nicks, then stand on its middle with your whole foot, feet hip-width apart.",
      "Hold an end in each hand with your arms straight by your sides.",
      "Stand tall with your head still."
    ],
    steps: [
      "Lift your shoulders straight up toward your ears, as high as they go.",
      "Keep your elbows straight.",
      "Hold a beat at the top.",
      "Lower under control."
    ],
    breathing: "Breathe out as you shrug up, and breathe in as you lower.",
    tempo: "Lift smoothly, hold for a beat, and lower slowly against the band.",
    feel: {
      should: "Across the tops of your shoulders, between your neck and your shoulder joints.",
      shouldnt: "In your elbows or your lower back, which means you are pulling with your arms or leaning."
    },
    mistakes: [
      { mistake: "You roll your shoulders, which adds nothing.",
        fix: "Lift straight up and lower straight down, in a vertical line." },
      { mistake: "You bend your elbows to help.",
        fix: "Keep your arms straight like ropes and let only your shoulders move." }
    ],
    safety: [
      "Stand on the band with the whole foot, and replace it if you see a nick."
    ],
    variations: {
      alternatives: [
        { id: "acc_traps_shrug", text: "Shrug does the same lift with weights in your hands instead of a band." }
      ]
    }
  };

  C.acc_traps_shrug = {
    summary: "Lifting your shoulders straight up while holding a weight in each hand, which loads your upper traps directly.",
    setup: [
      "Pick the weights up from the floor with a flat back and bent knees.",
      "Hold one in each hand at your sides, with your feet hip-width apart.",
      "Stand tall with your arms straight and your head level."
    ],
    steps: [
      "Lift your shoulders straight up toward your ears without bending your elbows.",
      "Hold a beat at the top.",
      "Lower slowly, without letting the weights drag your shoulders down.",
      "Keep your head still throughout."
    ],
    breathing: "Breathe out as you shrug up, and breathe in as you lower.",
    tempo: "Lift smoothly, hold for a beat, and lower over about two seconds.",
    feel: {
      should: "Across the tops of your shoulders, between your neck and your shoulder joints.",
      shouldnt: "In your elbows, or as strain in the front of your neck."
    },
    mistakes: [
      { mistake: "You roll your shoulders instead of lifting them straight up.",
        fix: "Lift and lower in a straight vertical line." },
      { mistake: "Your head juts forward as the weight gets heavier.",
        fix: "Keep your head level over your shoulders, and lower the weight if it won't stay there." }
    ],
    safety: [
      "Heavy shrugs load your neck as well as your traps, so stop adding weight when your head starts to jut forward.",
      "Set the weights down while you still control them."
    ],
    variations: {
      alternatives: [
        { id: "acc_traps_band", text: "Band Shrug does the same lift with a band under your feet, if you own a band instead of weights." }
      ]
    }
  };

  /* ---- neck ---- */

  C.acc_neck_chintuck = {
    summary: "Sliding your head straight back and holding it, a gentle hold for the muscles at the front of your neck.",
    setup: [
      "Sit or stand tall with your eyes level.",
      "Relax your shoulders and your jaw."
    ],
    steps: [
      "Draw your chin straight back, as if making a double chin.",
      "Keep your head level, without tilting it up or down.",
      "Hold the position with the back of your neck long.",
      "Release slowly."
    ],
    breathing: "Keep breathing through the hold, in through your nose and out slowly; never hold your breath.",
    tempo: "There is no movement once you are set: slide your head back over about two seconds, hold it still, and release slowly.",
    feel: {
      should: "In the front of your neck beneath your chin, with a mild stretch at the back.",
      shouldnt: "As pain, tingling or dizziness, or as a clenched jaw."
    },
    mistakes: [
      { mistake: "You tilt your head down instead of sliding it back.",
        fix: "Picture your head sliding along a shelf behind you, with your eyes staying level." },
      { mistake: "You clench your jaw and hold your breath.",
        fix: "Let your teeth part slightly and breathe through your nose for the whole hold." }
    ],
    safety: [
      "Move slowly and never jerk, and stop at dizziness, pain or tingling in your neck, arms or hands.",
      "If you have a neck condition or a recent injury, get advice before you start."
    ]
  };

  C.acc_neck_fourway = {
    summary: "Pushing your head into your own hand in four directions without letting it move, which trains your neck from every side.",
    setup: [
      "Sit tall on a chair with your shoulders relaxed and your jaw soft.",
      "Start with your palm flat against your forehead.",
      "Keep the effort moderate, never maximal."
    ],
    steps: [
      "Push your head into your hand while your hand pushes back, so nothing moves.",
      "Build the push slowly over about two seconds.",
      "Hold the push steady, then release slowly over about two seconds.",
      "Repeat with your hand on each side of your head, then on the back of your head."
    ],
    breathing: "Breathe steadily through every hold, and never hold your breath.",
    tempo: "Build the push slowly, hold it steady, and release slowly; no part of it is quick.",
    feel: {
      should: "In the neck muscles on the side you are pushing toward, as a steady, moderate effort.",
      shouldnt: "As a sharp pain, a pinch, tingling in your arms or hands, or strain in your jaw."
    },
    mistakes: [
      { mistake: "You push hard and fast, which is how a neck gets strained.",
        fix: "Build the push gradually and stop well short of your maximum effort." },
      { mistake: "Your head drifts while you push.",
        fix: "Match your hand's resistance to your push so your head stays in place." }
    ],
    safety: [
      "Move slowly and never jerk, and stop at dizziness, pain or tingling in your neck, arms or hands.",
      "Keep the effort moderate in every direction."
    ]
  };

  C.acc_neck_lyingraise = {
    summary: "Lifting your head a few centimetres off a mat while lying on your back with your chin tucked, a small movement for the front of your neck.",
    setup: [
      "Lie face up on a mat or a bed with your knees bent.",
      "Rest your shoulders and your head on the surface, with your jaw relaxed."
    ],
    steps: [
      "Tuck your chin.",
      "Lift your head a few centimetres, keeping your chin tucked.",
      "Hold a beat at the top.",
      "Lower slowly back to the surface."
    ],
    breathing: "Breathe out as you lift your head, and breathe in as you lower it.",
    tempo: "Lift smoothly, hold for a beat, and lower slowly over about two seconds.",
    feel: {
      should: "In the front of your neck.",
      shouldnt: "As pain, tingling or a pinch, or as tension in your jaw and shoulders."
    },
    mistakes: [
      { mistake: "You jut your chin forward as your head lifts.",
        fix: "Tuck your chin before you lift, and stop the lift if it pokes out." },
      { mistake: "You lift your shoulders and shrug.",
        fix: "Keep your shoulders on the surface and let only your head move." }
    ],
    safety: [
      "Move slowly and never jerk, and stop at dizziness, pain or tingling in your neck, arms or hands.",
      "Keep the lift small; a few centimetres is enough."
    ]
  };

  /* ---- grip · forearms ---- */

  C.acc_grip_wring = {
    summary: "Twisting a dry towel as if wringing it out and holding that squeeze, which works your forearms and grip with no equipment.",
    setup: [
      "Use a strong, dry hand towel that won't tear.",
      "Grip it with both hands, about a fist's width apart.",
      "Hold your arms straight out in front of you with your wrists straight."
    ],
    steps: [
      "Twist your hands in opposite directions as if wringing out water.",
      "Squeeze hard and keep the twist steady, with your arms straight.",
      "Hold it without letting the towel unwind.",
      "Release, and twist the other way on the next set."
    ],
    breathing: "Breathe steadily through the hold and keep your shoulders relaxed.",
    tempo: "There is no movement once you are twisted: build the squeeze over about two seconds and hold it steady.",
    feel: {
      should: "Through your forearms and the muscles of your hands.",
      shouldnt: "As a sharp ache in your wrists or on the inside of your elbows."
    },
    mistakes: [
      { mistake: "You wring in short bursts instead of holding the squeeze.",
        fix: "Twist once until the towel is tight, then hold that tension steady." },
      { mistake: "You lock your wrists bent, so they tire before your forearms do.",
        fix: "Keep your wrists straight and in line with your forearms." }
    ],
    safety: [
      "Use a strong, dry towel and keep your wrists straight; stop if they ache sharply."
    ],
    variations: {
      alternatives: [
        { id: "acc_grip_towelhang", text: "Towel Hang trains your grip hanging from a pull-up bar, if you own one." }
      ]
    }
  };

  C.acc_grip_towelhang = {
    summary: "Hanging from a towel draped over a pull-up bar, which makes your grip work much harder than it does on a bare bar.",
    setup: [
      "Check that the bar is fixed, and that the towel is strong and not worn.",
      "Drape the towel over the bar and hold one end in each hand.",
      "Place a stool or step under your feet so you can step down."
    ],
    steps: [
      "Lift your feet and hang with your arms straight.",
      "Pull your shoulders slightly down, away from your ears.",
      "Hang still while your grip works.",
      "Step down while you still can, before your grip gives out."
    ],
    breathing: "Breathe steadily through the hang, and don't hold your breath.",
    tempo: "There is no movement: hang still without swinging, and step down under control.",
    feel: {
      should: "In your forearms and hands, with your upper back lightly working.",
      shouldnt: "As a pinch in your shoulders, or as the towel slipping through your fingers."
    },
    mistakes: [
      { mistake: "You let your shoulders shrug up to your ears.",
        fix: "Pull your shoulders slightly down before you lift your feet." },
      { mistake: "You use a thin or worn towel.",
        fix: "Choose a thick, strong towel and check it for fraying every time." }
    ],
    safety: [
      "Check the towel and the bar first, keep a stool or step under your feet, and end the set while you can still step down."
    ],
    variations: {
      alternatives: [
        { id: "acc_grip_wring", text: "Towel Wring Hold trains your grip with just a towel and no bar." },
        { id: "acc_grip_farmer", text: "Farmer Hold trains your grip standing, with a weight in each hand." }
      ]
    }
  };

  C.acc_grip_farmer = {
    summary: "Standing tall while holding a weight in each hand, which works your grip and forearms while your whole body braces.",
    setup: [
      "Place a dumbbell or kettlebell on the floor on each side of you.",
      "Pick them up with a flat back and bent knees.",
      "Stand tall with your shoulders down and back, and your arms straight."
    ],
    steps: [
      "Squeeze the handles hard.",
      "Stay tall without leaning to one side.",
      "Keep your ribs down and your breathing steady.",
      "Put the weights down while you still control them."
    ],
    breathing: "Breathe steadily through the hold, and don't hold your breath.",
    tempo: "There is no movement: stand still with a firm grip, and lower the weights under control at the end.",
    feel: {
      should: "In your forearms and hands, with your upper back and stomach bracing.",
      shouldnt: "In your lower back, or as your shoulders rolling forward."
    },
    mistakes: [
      { mistake: "You shrug your shoulders up and forward.",
        fix: "Pull your shoulders down and back, as if sliding them into your back pockets." },
      { mistake: "You lean back to take the weight off your hands.",
        fix: "Stand tall with your ribs down, and use lighter weights if you can't." }
    ],
    safety: [
      "Lift and lower with a flat back and bent knees, and set the weights down while you still control them."
    ],
    variations: {
      alternatives: [
        { id: "acc_grip_towelhang", text: "Towel Hang trains your grip hanging from a pull-up bar instead of carrying weights." }
      ]
    }
  };

  C.acc_grip_wristcurl = {
    summary: "Curling a dumbbell with your forearm resting on your thigh, so only your wrist and fingers move, to train the inside of your forearm.",
    setup: [
      "Sit with your forearm resting along your thigh and your hand hanging past your knee, palm up.",
      "Hold a light dumbbell in that hand."
    ],
    steps: [
      "Let the weight roll down to your fingertips.",
      "Curl your fingers closed.",
      "Lift your wrist, keeping your forearm on your thigh.",
      "Lower slowly, and swap arms once you finish the set."
    ],
    breathing: "Breathe out as you curl the weight up, and breathe in as you lower it.",
    tempo: "Curl up smoothly, and lower slowly without letting the weight bounce.",
    feel: {
      should: "Along the inside of your forearm.",
      shouldnt: "As a sharp ache in your wrist or on the inside of your elbow."
    },
    mistakes: [
      { mistake: "You lift your forearm off your thigh.",
        fix: "Press the forearm into your thigh and move only your hand." },
      { mistake: "You bounce the weight at the bottom.",
        fix: "Pause for a beat with your fingers open before each curl." }
    ],
    safety: [
      "Light weights are enough, and stop if your wrist or the inside of your elbow aches."
    ]
  };

  C.acc_grip_revwristcurl = {
    summary: "Lifting a dumbbell by bending your wrist upward, palm down, to train the top of your forearm.",
    setup: [
      "Sit with your forearm resting along your thigh and your hand hanging past your knee, palm down.",
      "Hold a light dumbbell in that hand."
    ],
    steps: [
      "Lift the back of your hand toward the ceiling by bending your wrist up.",
      "Keep your forearm on your thigh.",
      "Pause for a beat at the top.",
      "Lower slowly, and swap arms once you finish the set."
    ],
    breathing: "Breathe out as you lift your hand, and breathe in as you lower it.",
    tempo: "Lift smoothly, and lower slowly rather than letting the weight drop.",
    feel: {
      should: "Along the top of your forearm.",
      shouldnt: "As a sharp ache in your wrist or on the outside of your elbow."
    },
    mistakes: [
      { mistake: "You lift your forearm off your thigh.",
        fix: "Press the forearm into your thigh and move only your hand." },
      { mistake: "You let the weight drop instead of lowering it.",
        fix: "Take about two seconds to lower, and use a lighter weight if you can't control it." }
    ],
    safety: [
      "Use a lighter weight than you would for the palm-up curl, and stop if your wrist or the outside of your elbow aches."
    ]
  };
})();
