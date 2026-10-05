/* =====================================================================
   WELLNESS HUB · EXERCISE GUIDES · BATCH A — push, shoulder, dip
   ---------------------------------------------------------------------
   · The written guide for each exercise in the push, shoulder and dip
     slots (plan E2): setup, steps, breathing, tempo, feel, mistakes,
     safety, and a knuckles section on the six grip-capable push-ups.
   · Schema and style rules: fitness/content/STYLE.md. Checked by
     tools/check-exercise-content.js.
   · No prescriptions here: rep ranges, hold times and when to step up
     come from training.js, never from this text.
   Public: window.EXERCISE_CONTENT[id], window.EXERCISE_CONTENT_BATCHES.a
   ===================================================================== */
(function () {
  "use strict";
  var C = window.EXERCISE_CONTENT = window.EXERCISE_CONTENT || {};
  var B = window.EXERCISE_CONTENT_BATCHES = window.EXERCISE_CONTENT_BATCHES || {};
  B.a = "complete";

  C.push_2 = {
    summary: "A horizontal press from the floor that trains your chest and triceps while your whole body holds one rigid line.",
    setup: [
      "Place your hands on the floor just wider than your shoulders, fingers spread, index fingers pointing forward.",
      "Step your feet back until your body is straight from ears to ankles, feet together or hip-width apart.",
      "Squeeze your glutes and brace your stomach as if about to be poked, so your hips can't sag.",
      "Stack your shoulders over your hands or slightly ahead of them."
    ],
    steps: [
      "Bend your elbows and lower your chest toward the floor, elbows angled about 45° from your sides.",
      "Keep your head in line with your body; your chest, not your chin or hips, leads the way down.",
      "Stop with your chest a fist's height from the floor or lightly touching it, elbows at roughly a right angle or deeper.",
      "Push the floor away until your arms are straight, letting your shoulder blades spread apart at the top."
    ],
    breathing: "Breathe in as you lower, and breathe out as you press up through the hardest part of the rep.",
    tempo: "Lower over about two seconds, touch or pause briefly at the bottom without resting, then press up smoothly.",
    feel: {
      should: "Across your chest and in the backs of your arms, with your stomach and glutes working to hold you straight.",
      shouldnt: "In your lower back, which means your hips have dropped, or sharply at the front of your shoulder."
    },
    mistakes: [
      { mistake: "Your hips sag or pike, so your body bends in the middle instead of moving as one piece.",
        fix: "Squeeze your glutes harder and film a set from the side; ears, hips and ankles should stay on one line." },
      { mistake: "Your elbows flare straight out to the sides, making a T with your body.",
        fix: "Turn your hands slightly outward and aim your elbows back toward your hips, about 45° from your sides." },
      { mistake: "You stop halfway down, so each rep covers only the top of the movement.",
        fix: "Put a fist or a rolled towel under your chest and touch it every rep." }
    ],
    safety: [
      "If your wrists ache in the bent position, try knuckles, below, or move to an incline, which loads the wrists less.",
      "Stop if you feel a sharp or pinching pain at the front of the shoulder, and shorten the range before trying again."
    ],
    variations: {
      grip: {
        knuckles: [
          "Make loose fists and rest on the front two knuckles of each hand, the ones below your index and middle fingers.",
          "Keep each wrist straight, so your forearm and the back of your hand form one line.",
          "Start on a mat or a folded towel; bare knuckles on a hard floor will hurt before your chest tires.",
          "Your fists raise you a few centimetres, so each rep travels slightly further than it does on palms."
        ]
      },
      alternatives: [
        { id: "push_alt_wide", text: "Hands wider than your shoulders: a sideways swap that shifts work from your triceps toward your chest." }
      ]
    }
  };

  C.push_incline = {
    summary: "A push-up with your hands raised on a sturdy surface, so you press a smaller share of your bodyweight while learning the full movement.",
    setup: [
      "Choose a surface that cannot slide or tip, such as a kitchen counter, a heavy table, a chair against a wall or a stair.",
      "Test it by leaning your full weight on it before the first rep.",
      "Place your hands on the edge, just wider than your shoulders, and walk your feet back until your body is one straight line from ears to heels.",
      "Brace your stomach and squeeze your glutes to lock that line in."
    ],
    steps: [
      "Bend your elbows and lower your chest toward the edge, elbows angled about 45° from your sides.",
      "Keep your body straight; your hips move with your chest, not after it.",
      "Stop with your chest just short of the edge.",
      "Press back until your arms are straight and your shoulder blades spread apart."
    ],
    breathing: "Breathe in on the way down, and out as you press away from the surface.",
    tempo: "Lower over about two seconds, pause for a moment near the edge, then press up smoothly.",
    feel: {
      should: "In your chest and the backs of your arms, with your stomach holding your body straight.",
      shouldnt: "In your lower back or neck, or as a pinch at the front of your shoulder."
    },
    mistakes: [
      { mistake: "Your hips sag toward the floor, so the angle stops meaning what the surface height says it does.",
        fix: "Walk your feet in a little and squeeze your glutes before every set." },
      { mistake: "You use a surface that shifts when you push, such as a light chair or a wheeled table.",
        fix: "Use a counter, a stair or a chair pushed back against a wall, and test it with your full weight first." }
    ],
    safety: [
      "The lower the surface, the more load your wrists and shoulders take, so move down one surface at a time.",
      "Stop if the surface moves under you, or if a shoulder pinches at the bottom of the rep."
    ],
    variations: {
      grip: {
        knuckles: [
          "Rest on the front two knuckles of each fist, the ones below your index and middle fingers, on the edge of the surface.",
          "Keep each wrist straight, so your forearm and the back of your hand form one line.",
          "Lay a folded towel on a hard edge first, and make sure your fists sit fully on the surface, not half over it."
        ]
      }
    }
  };

  C.shoulder_1 = {
    summary: "A push-up done from a hips-high pike so you press upward rather than forward, the first step toward overhead strength without weights.",
    setup: [
      "Start in a push-up position, hands just wider than your shoulders.",
      "Walk your feet in and lift your hips high, so your body makes an upside-down V.",
      "Shift your shoulders over your hands as far as you can while keeping your hips up."
    ],
    steps: [
      "Bend your elbows and lower the top of your head toward a spot on the floor just ahead of your hands.",
      "Let your elbows travel back toward your knees, not straight out to the sides.",
      "Stop when your head lightly touches the floor or as low as you can control.",
      "Press back up to the pike until your arms are straight and your shoulders are back over your hands."
    ],
    breathing: "Breathe in as you lower your head, and out as you press back up to the pike.",
    tempo: "Lower slowly, over about two seconds; there's no bounce off the floor, and you press back up smoothly.",
    feel: {
      should: "In the front and top of your shoulders and in the backs of your arms.",
      shouldnt: "In your chest, which means your hips have dropped, or in your neck."
    },
    mistakes: [
      { mistake: "Your hips sink as you lower, turning it into a flat push-up with a bent body.",
        fix: "Walk your feet closer to your hands and keep your hips over your shoulders throughout." },
      { mistake: "Your elbows flare straight out, putting the load on the front of the shoulder.",
        fix: "Aim your elbows back toward your knees, as if your forearms were sliding along rails." },
      { mistake: "You look forward and arch your neck as your head approaches the floor.",
        fix: "Keep your neck long and look between your hands; the top of your head, not your face, leads." }
    ],
    safety: [
      "Lower onto your head lightly, never with weight on it; if you can't control the bottom, stop higher.",
      "Stop if a shoulder pinches or your wrists hurt in the bent position."
    ]
  };

  C.dip_3 = {
    summary: "A press on two parallel bars that lifts your whole bodyweight, mostly with your triceps and lower chest.",
    setup: [
      "Grip the bars with your palms facing in and jump or step up until your arms are straight.",
      "Push your shoulders down away from your ears and lean your chest slightly forward.",
      "Bend your knees and cross your ankles if your feet would otherwise touch the floor."
    ],
    steps: [
      "Bend your elbows and lower your body, letting your elbows travel back rather than out to the sides.",
      "Keep the slight forward lean all the way down.",
      "Stop when your shoulders are just below your elbows, or higher if that depth pinches.",
      "Press the bars down until your arms are straight and your shoulders are pushed down again."
    ],
    breathing: "Breathe in on the way down, and out as you press back to straight arms.",
    tempo: "Lower over about two seconds, turn around at the bottom without bouncing, then press up smoothly.",
    feel: {
      should: "In the backs of your arms and the lower part of your chest.",
      shouldnt: "As a stretch or ache deep in the front of the shoulder at the bottom."
    },
    mistakes: [
      { mistake: "You sink well below parallel, so the front of the shoulder takes the load in its most stretched position.",
        fix: "Stop when your shoulders are just below your elbows; a box or chair under your feet marks the depth." },
      { mistake: "Your elbows flare out to the sides as you lower.",
        fix: "Keep your elbows pointing back, close to your body." },
      { mistake: "Your shoulders creep up toward your ears at the top.",
        fix: "Finish every rep by pushing the bars down and making your neck long." }
    ],
    safety: [
      "The bottom of the dip is the vulnerable position: build depth gradually over weeks, not within a set.",
      "Stop if you feel a sharp pain at the front of the shoulder or at the breastbone."
    ]
  };

  C.push_1 = {
    summary: "A push-up done standing against a wall, the lightest way to learn the pressing pattern and the rigid body line.",
    setup: [
      "Stand about an arm's length from a wall, feet hip-width apart.",
      "Place your hands on the wall at shoulder height and just wider than your shoulders.",
      "Squeeze your glutes and brace your stomach so your body is one straight line from ears to heels."
    ],
    steps: [
      "Bend your elbows and bring your chest toward the wall, elbows angled about 45° from your sides.",
      "Keep your hips moving with your chest; your body tilts as one piece.",
      "Stop with your nose a few centimetres from the wall.",
      "Push the wall away until your arms are straight, letting your shoulder blades spread apart at the top."
    ],
    breathing: "Breathe in as you lean toward the wall, and out as you push away.",
    tempo: "Lean in over about two seconds, pause for a beat near the wall, then press away smoothly.",
    feel: {
      should: "Across your chest and in the backs of your arms, with your stomach lightly working to keep you straight.",
      shouldnt: "In your lower back, or as a pinch at the front of your shoulder."
    },
    mistakes: [
      { mistake: "Your hips push back toward the room so your body folds at the waist.",
        fix: "Squeeze your glutes and keep ears, hips and ankles on one slanted line." },
      { mistake: "Your elbows point straight out to the sides.",
        fix: "Turn your hands slightly outward and aim your elbows back toward your hips." }
    ],
    safety: [
      "Keep your wrists warm; if they ache, try the knuckles version below.",
      "Stop if the front of your shoulder pinches, and take a shorter range."
    ],
    variations: {
      grip: {
        knuckles: [
          "Make loose fists and press the front two knuckles of each hand, below your index and middle fingers, against the wall.",
          "Keep each wrist straight, so your forearm and the back of your hand form one line.",
          "Hang a folded towel on the wall at hand height first, because bare knuckles on a hard wall dig in.",
          "Your fists sit a little closer to your chest than flat palms do, so stand slightly further back."
        ]
      }
    }
  };

  C.push_3 = {
    summary: "A push-up with your hands together under your chest, which shifts more of the work onto your triceps.",
    setup: [
      "Start in a push-up position and bring your hands together under your chest.",
      "Touch your thumbs and index fingers to form a diamond, fingers spread.",
      "Squeeze your glutes and brace your stomach so you're one straight line from ears to heels."
    ],
    steps: [
      "Bend your elbows and lower your chest toward your hands, keeping your elbows tucked close to your ribs.",
      "Keep your body straight; your hips don't lead and don't sag.",
      "Touch your chest lightly to your hands, or stop just above them.",
      "Press up until your arms are straight."
    ],
    breathing: "Breathe in on the way down, and out as you press up.",
    tempo: "Lower over about two seconds, touch your hands without resting on them, then press up smoothly.",
    feel: {
      should: "In the backs of your arms first, then your chest, with your stomach holding your body level.",
      shouldnt: "As a sharp ache on the inside of your elbows or wrists."
    },
    mistakes: [
      { mistake: "Your elbows flare wide, turning it into an ordinary push-up.",
        fix: "Brush your elbows along your ribs on the way down." },
      { mistake: "Your hips hike up to shorten the range.",
        fix: "Squeeze your glutes and film a set from the side; ears, hips and ankles should stay level." }
    ],
    safety: [
      "Stop if you feel a sharp pain on the inside of the elbow, and widen your hands a little.",
      "If the diamond bothers your wrists, spread your hands to a narrow shape instead of a closed one."
    ]
  };

  C.push_4 = {
    summary: "A push-up with your feet raised on a bench, so more of your bodyweight loads your shoulders and upper chest.",
    setup: [
      "Place your feet on a stable bench and your hands on the floor just wider than your shoulders.",
      "Walk your hands in until your body is angled head-down but your arms are roughly vertical.",
      "Squeeze your glutes and brace hard, so your back stays neutral instead of arching."
    ],
    steps: [
      "Bend your elbows and lower your head and chest toward the floor, elbows about 45° from your sides.",
      "Keep your head in line with your body, not craned forward.",
      "Stop when your chest is close to the floor.",
      "Press back up until your arms are straight and your shoulder blades spread apart."
    ],
    breathing: "Breathe in as you lower, and out as you press up.",
    tempo: "Lower over about two seconds, pause briefly without resting, then press up smoothly.",
    feel: {
      should: "In your upper chest, the front of your shoulders and the backs of your arms.",
      shouldnt: "In your lower back, which means your ribs have flared, or in your neck."
    },
    mistakes: [
      { mistake: "Your lower back arches as your feet rise.",
        fix: "Tuck your tailbone slightly and brace your stomach before the first rep." },
      { mistake: "Your head cranes forward to look at the floor.",
        fix: "Look at a spot just ahead of your hands and keep your neck long." },
      { mistake: "The bench wobbles or slides.",
        fix: "Put it against a wall, or use a heavier surface, before you start." }
    ],
    safety: [
      "The higher your feet, the more load your shoulders take; lower them if the front of a shoulder pinches.",
      "Stop if the bench moves, or if your wrists ache in the bottom position."
    ],
    variations: {
      grip: {
        knuckles: [
          "Make loose fists and rest on the front two knuckles of each hand, the ones below your index and middle fingers.",
          "Keep each wrist straight, so your forearm and the back of your hand form one line.",
          "Use a mat or a folded towel, because the steeper angle presses your knuckles harder into the floor.",
          "Your fists lift your hands a little, so you travel slightly further than you do on palms."
        ]
      }
    }
  };

  C.push_5 = {
    summary: "A wide push-up where you lower toward one arm while the other stays straight, a step toward pressing on a single arm.",
    setup: [
      "Start in a push-up position with your hands much wider than your shoulders.",
      "Turn your fingers slightly outward and keep your feet about hip-width apart.",
      "Squeeze your glutes and brace your stomach so your hips stay square to the floor."
    ],
    steps: [
      "Shift your weight toward one hand and bend that elbow, lowering your chest beside that hand.",
      "Keep the other arm straight, using it only as a prop.",
      "Stop when your chest is near the floor, hips and shoulders still facing straight down.",
      "Press back to the middle, then lower toward the other side on the next rep."
    ],
    breathing: "Breathe in as you lower toward one side, and out as you press back to the centre.",
    tempo: "Lower over about two seconds, pause briefly at the bottom, then press back to centre smoothly.",
    feel: {
      should: "Mostly in the chest and arm of the side you lower toward, with your stomach resisting any twist.",
      shouldnt: "In the front of the shoulder of the straight arm, or as a sharp pinch anywhere."
    },
    mistakes: [
      { mistake: "Your torso twists open toward the working arm.",
        fix: "Keep your belt buckle pointing at the floor and lower a little less far." },
      { mistake: "The straight arm bends and takes half the work.",
        fix: "Turn that hand outward and think of it as a kickstand; move to a higher surface if it keeps bending." }
    ],
    safety: [
      "This loads one shoulder far more than a normal push-up; stop if the front of the working shoulder pinches.",
      "Keep the range short on the first rep of a session and build depth as it warms up."
    ]
  };

  C.push_6 = {
    summary: "A push-up with your hands near your hips and your shoulders leaning well forward, which loads your shoulders and wrists far more.",
    setup: [
      "Start in a push-up position, then move your hands back until they sit beside your lower ribs or hips.",
      "Turn your fingers backward or out to the sides, whichever your wrists tolerate.",
      "Lean your shoulders forward past your hands and round your upper back slightly, spreading your shoulder blades."
    ],
    steps: [
      "Hold the forward lean and bend your elbows, keeping them tucked close to your sides.",
      "Lower your chest toward your hands without letting your shoulders drift back.",
      "Stop when your chest is near your hands.",
      "Press back up, keeping the same lean the whole way."
    ],
    breathing: "Breathe in as you lower, and out as you press; keep it steady rather than holding your breath.",
    tempo: "Lower over about two seconds, pause briefly, then press up smoothly while keeping the lean.",
    feel: {
      should: "In the front of your shoulders, your chest and your stomach, with firm pressure through your hands.",
      shouldnt: "As a sharp ache in the front of your wrists, or in your lower back."
    },
    mistakes: [
      { mistake: "You lose the lean during the rep and slide back into an ordinary push-up.",
        fix: "Keep your shoulders over or ahead of your fingertips before you bend your elbows." },
      { mistake: "Your lower back arches as your shoulders tire.",
        fix: "Squeeze your glutes and tuck your tailbone slightly, so your ribs stay down." }
    ],
    safety: [
      "This is a heavy wrist position; warm your wrists first and stop if they ache sharply.",
      "Stop if the front of your shoulder pinches or your elbows ache, and go back to the previous push-up."
    ]
  };

  C.push_e2_weighted = {
    summary: "A push-up with extra weight resting across your upper back, for when bodyweight push-ups no longer challenge you.",
    setup: [
      "Choose a weight you can place across your upper back without it sliding, such as a plate or a loaded backpack.",
      "Have someone place it, or lower yourself under it into a push-up position.",
      "Squeeze your glutes and brace your stomach so you hold the same straight line as a normal push-up."
    ],
    steps: [
      "Bend your elbows and lower your chest toward the floor, elbows about 45° from your sides.",
      "Keep the weight still on your upper back; it must not slide toward your neck or hips.",
      "Stop with your chest a fist's height from the floor.",
      "Press up with intent until your arms are straight, keeping the same body line."
    ],
    breathing: "Breathe in as you lower, and out as you press up; take a breath and brace before each rep.",
    tempo: "Lower over about two seconds, pause without resting, then press up firmly but without jerking.",
    feel: {
      should: "Across your chest and in the backs of your arms, with your stomach and glutes holding the line.",
      shouldnt: "In your lower back, or as a pinch in the front of your shoulder."
    },
    mistakes: [
      { mistake: "The weight slides toward your neck or hips mid-rep.",
        fix: "Use something wide and flat, or a snug backpack, and place it between your shoulder blades." },
      { mistake: "Your depth shrinks to cope with the load.",
        fix: "Use a lighter weight and keep every rep to the same depth." }
    ],
    safety: [
      "Only add weight once plain push-ups are clean; the added load goes straight through your shoulders and wrists.",
      "Stop if the weight shifts, or if a shoulder or wrist pinches."
    ]
  };

  C.push_e2_dbpress = {
    summary: "A press lying on a bench or the floor with a dumbbell in each hand, easy on the wrists and simple to load in small steps.",
    setup: [
      "Lie on a bench or the floor with a dumbbell in each hand, held above your chest with your palms facing your feet.",
      "Plant your feet and set your shoulder blades back and down into the bench or floor.",
      "Stack each wrist over its elbow so the dumbbells sit directly above your chest."
    ],
    steps: [
      "Lower the dumbbells slowly, elbows about 45° from your sides, until your upper arms reach the bench or floor.",
      "Keep your wrists stacked over your elbows the whole way down.",
      "Pause briefly without bouncing.",
      "Press the dumbbells up and slightly together until your arms are straight."
    ],
    breathing: "Breathe in as you lower the weights, and out as you press them up.",
    tempo: "Lower over about two seconds, pause at the bottom, then press up smoothly without letting the weights clang.",
    feel: {
      should: "Across your chest, with your shoulders and the backs of your arms helping.",
      shouldnt: "In your lower back, which means you're arching, or as a sharp pinch in the front of a shoulder."
    },
    mistakes: [
      { mistake: "Your elbows flare straight out from your sides as you lower.",
        fix: "Tuck your elbows to about 45° and lower with control until your upper arms touch down." },
      { mistake: "You bounce the weights off your chest or the floor.",
        fix: "Pause for a beat when your upper arms touch down, then press." },
      { mistake: "Your back arches off the bench to help the press.",
        fix: "Plant your feet, squeeze your glutes and keep your ribs down; use lighter weights if you can't." }
    ],
    safety: [
      "Use a weight you can control in both directions, and lower it with care if you tire; a heavy dumbbell can't be stopped mid-air.",
      "Stop if the front of a shoulder pinches at the bottom, and shorten the range."
    ]
  };

  C.push_alt_scapula = {
    summary: "A small movement in a straight-arm plank that trains your shoulder blades to move on their own, without bending your elbows.",
    setup: [
      "Start in a tall plank with your hands under your shoulders and your arms straight.",
      "Squeeze your glutes and brace your stomach so your body is one straight line.",
      "Lock your elbows for the whole movement; only your shoulder blades will move."
    ],
    steps: [
      "Let your chest sink slightly toward the floor so your shoulder blades squeeze together.",
      "Keep your elbows locked straight.",
      "Push the floor away until your shoulder blades spread apart and your upper back rounds a little.",
      "Lower back into the squeezed position and repeat."
    ],
    breathing: "Breathe in as your chest sinks, and out as you push the floor away.",
    tempo: "Move slowly, about two seconds each way, because the range is small and control is the point.",
    feel: {
      should: "Around your shoulder blades and the sides of your ribs, with your stomach holding the plank.",
      shouldnt: "In your elbows, which means they've started to bend, or in your lower back."
    },
    mistakes: [
      { mistake: "Your elbows bend and it becomes a tiny push-up.",
        fix: "Press your palms into the floor and keep your elbows locked as if they were straight bars." },
      { mistake: "You move too fast, so your shoulder blades never fully squeeze or spread.",
        fix: "Slow down and pause for a beat at each end." }
    ],
    safety: [
      "Keep the range small and controlled; stop if a shoulder pinches or a wrist aches.",
      "If your wrists hurt on the floor, do it with your hands on a wall or a raised surface."
    ]
  };

  C.push_alt_wide = {
    summary: "A push-up with your hands wider than your shoulders, which shifts more of the work onto your chest and away from your triceps.",
    setup: [
      "Place your hands on the floor noticeably wider than your shoulders, fingers turned slightly outward.",
      "Step your feet back until your body is a straight line from ears to heels.",
      "Squeeze your glutes and brace your stomach so your hips can't sag."
    ],
    steps: [
      "Bend your elbows and lower your chest toward the floor, letting your elbows angle out a little more than a standard push-up.",
      "Keep your head in line with your body and your hips level with your shoulders.",
      "Stop when your chest is near the floor.",
      "Press up until your arms are straight and your shoulder blades spread apart."
    ],
    breathing: "Breathe in as you lower, and out as you press up.",
    tempo: "Lower over about two seconds, pause briefly at the bottom, then press up smoothly.",
    feel: {
      should: "Across your chest, with the backs of your arms helping and your stomach holding you straight.",
      shouldnt: "As a pinch at the front of your shoulder, or in your lower back."
    },
    mistakes: [
      { mistake: "Your hands are so wide that your shoulders feel pinched at the bottom.",
        fix: "Bring your hands in a few centimetres until the bottom feels comfortable." },
      { mistake: "Your elbows bow straight out and your chest collapses toward the floor.",
        fix: "Keep your ribs lifted and your elbows pointing diagonally back, not directly sideways." }
    ],
    safety: [
      "A wider stance stretches the chest and front shoulder more; stop if the front of a shoulder pinches.",
      "Narrow your hands slightly if the pinch comes back."
    ],
    variations: {
      grip: {
        knuckles: [
          "Make loose fists and rest on the front two knuckles of each hand, below your index and middle fingers.",
          "Keep each wrist straight, so your forearm and the back of your hand form one line.",
          "Start on a mat or a folded towel, and keep your fists under your wrists rather than leaning on their outer edge.",
          "Your fists raise your hands a few centimetres, so your chest travels slightly further than on palms."
        ]
      }
    }
  };

  C.push_alt_negative = {
    summary: "A push-up where you take the lowering part as slowly as you can, which builds the strength to complete a full rep.",
    setup: [
      "Start at the top of a push-up with your arms straight and hands just wider than your shoulders.",
      "Squeeze your glutes and brace your stomach so your body is one straight line.",
      "Plan how you'll get back up: reset to the top by pushing up from your knees, or by pressing up however you can."
    ],
    steps: [
      "Bend your elbows and lower yourself as slowly as you can, elbows about 45° from your sides.",
      "Keep your whole body in one line as you descend; your hips don't drop early.",
      "Touch your chest to the floor under control.",
      "Reset to the top by pressing up from your knees, then lower again."
    ],
    breathing: "Breathe in slowly through the lowering, and out as you reset to the top.",
    tempo: "The lowering is the whole point: take about four to five seconds, steady the whole way, with no drop at the end.",
    feel: {
      should: "Across your chest and in the backs of your arms, working to hold you back from the floor.",
      shouldnt: "In your lower back, or as a sharp ache in your elbows."
    },
    mistakes: [
      { mistake: "The descent speeds up near the bottom, so you drop the last part.",
        fix: "Lower more slowly early on, so you have strength left for the last few centimetres." },
      { mistake: "Your hips drop first and your body bends.",
        fix: "Squeeze your glutes and keep your ribs down so your body lowers as one piece." }
    ],
    safety: [
      "Slow lowering loads the elbows' tendons; stop if your elbows ache and finish the session with something easier.",
      "Reset from your knees rather than jumping or twisting back up."
    ],
    variations: {
      grip: {
        knuckles: [
          "Make loose fists and rest on the front two knuckles of each hand, below your index and middle fingers.",
          "Keep each wrist straight, so your forearm and the back of your hand form one line.",
          "Use a mat or folded towel; the slow lowering keeps your weight on your knuckles for longer."
        ]
      }
    }
  };

  C.push_alt_explosive = {
    summary: "A push-up pressed up fast enough that your hands leave the floor, which trains speed in the press rather than slow strength.",
    setup: [
      "Start in a strong push-up position, hands just wider than your shoulders, on a surface that won't slip.",
      "Squeeze your glutes and brace your stomach so you hold one straight line.",
      "Leave room around you and keep your fingers spread, ready to land."
    ],
    steps: [
      "Lower under control until your chest is close to the floor.",
      "Press up as fast as you can, until your hands leave the floor.",
      "Land with soft, slightly bent elbows and your fingers spread.",
      "Absorb the landing by bending your elbows into the next rep, or reset before going again."
    ],
    breathing: "Breathe in as you lower, and out sharply as you drive up.",
    tempo: "Lower over about two seconds, then press up as fast as you can; land softly instead of crashing.",
    feel: {
      should: "In your chest, the backs of your arms and your stomach, with a quick snap through your hands.",
      shouldnt: "In your wrists on landing, or in your lower back."
    },
    mistakes: [
      { mistake: "You land with stiff, locked arms.",
        fix: "Bend your elbows slightly as your hands touch down and let your chest travel down to absorb it." },
      { mistake: "You cut the depth or let your hips sag to chase height.",
        fix: "Keep the same depth as a strict push-up and press faster only if the line stays rigid." }
    ],
    safety: [
      "Your wrists and shoulders take a sharp landing load; skip this if either is irritated.",
      "Stop the set when the push gets slow or the landing gets harsh, not when you're completely spent."
    ]
  };

  C.push_alt_onearm = {
    summary: "A push-up pressed on a single arm, the hardest horizontal press you can do without equipment.",
    setup: [
      "Start in a push-up position with your feet wider than your shoulders for a stable base.",
      "Move one hand under the centre of your chest and tuck the other behind your back or along your side.",
      "Squeeze your glutes and brace your stomach to resist twisting."
    ],
    steps: [
      "Bend the working elbow and lower your chest toward the floor, elbow close to your body.",
      "Keep your hips and shoulders square to the floor; don't let them turn open.",
      "Stop when your chest is near the floor.",
      "Press back up through the working arm until it's straight."
    ],
    breathing: "Breathe in as you lower, and out as you press up; brace hard before each rep.",
    tempo: "Lower over about two seconds, pause briefly, then press up steadily without twisting.",
    feel: {
      should: "In the chest and arm you're pressing with, and in your stomach, which fights the twist.",
      shouldnt: "As a sharp pinch at the front of the working shoulder, or in your lower back."
    },
    mistakes: [
      { mistake: "Your torso twists open to help the press.",
        fix: "Widen your feet and keep your belt buckle pointing at the floor throughout." },
      { mistake: "The working elbow flares far from your body.",
        fix: "Aim it back along your ribs rather than out to the side." }
    ],
    safety: [
      "One shoulder carries nearly your whole upper-body weight; build up with hands elevated before trying it on the floor.",
      "Stop if the front of the working shoulder pinches, and try the other side only if it feels fine."
    ]
  };

  C.push_alt_tricep = {
    summary: "A plank-lean extension against a bench that bends only at the elbows, to isolate your triceps.",
    setup: [
      "Place your hands on the edge of a stable bench, a little narrower than your shoulders.",
      "Walk your feet back into a plank lean and keep your body in one rigid line.",
      "Hold your upper arms still; only your forearms will move."
    ],
    steps: [
      "Bend only at the elbows, lowering your head toward the bench while your upper arms stay fixed.",
      "Feel a stretch in the backs of your arms at the bottom.",
      "Straighten your elbows to push yourself back to the start.",
      "Keep your body rigid throughout; only your forearms move."
    ],
    breathing: "Breathe in as you lower your head, and out as you straighten your elbows.",
    tempo: "Lower over about two seconds, pause briefly at the stretch, then extend smoothly.",
    feel: {
      should: "In the backs of your arms, with your stomach holding the plank.",
      shouldnt: "In your shoulders, which means they've started to move, or as a sharp ache at the elbow."
    },
    mistakes: [
      { mistake: "Your shoulders do the work and your upper arms swing back and forth.",
        fix: "Think of your upper arms as fixed bars and hinge only at the elbow." },
      { mistake: "Your hips sag out of the plank line.",
        fix: "Squeeze your glutes and walk your feet in a little." }
    ],
    safety: [
      "Ease the range if your elbows feel tender at the full stretch.",
      "Use a bench that can't slide, and stop if your wrists ache."
    ]
  };

  C.shoulder_2 = {
    summary: "A pike push-up with your feet raised on a bench, which stacks your hips over your shoulders and moves the press closer to vertical.",
    setup: [
      "Place your feet on a stable bench and your hands on the floor just wider than your shoulders.",
      "Walk your hands back toward the bench until your hips are stacked high above your shoulders.",
      "Keep your legs fairly straight and your torso as upright as you can hold it."
    ],
    steps: [
      "Bend your elbows and lower the top of your head toward the floor between your hands.",
      "Keep your hips stacked over your shoulders instead of drifting back toward your feet.",
      "Stop when your head lightly touches the floor, or as low as you can control.",
      "Press back up with force until your arms are straight and your shoulders are over your hands."
    ],
    breathing: "Breathe in as you lower your head, and out as you press back up.",
    tempo: "Lower over about two seconds with no bounce at the bottom, then press up smoothly.",
    feel: {
      should: "In the tops and fronts of your shoulders and in the backs of your arms.",
      shouldnt: "In your neck, or in your lower back, which means your ribs have flared."
    },
    mistakes: [
      { mistake: "Your hips drift back and your weight shifts onto your feet, flattening the press.",
        fix: "Walk your hands closer to the bench until your shoulders stay over your hands at the bottom." },
      { mistake: "You stop well short of the floor, so each rep covers only the top of the movement.",
        fix: "Set a folded towel under your head as a target and touch it each rep." }
    ],
    safety: [
      "This is more overhead load than the floor pike; warm your shoulders thoroughly first.",
      "Lower onto your head lightly, never with weight resting on it, and stop if a shoulder pinches."
    ]
  };

  C.shoulder_3 = {
    summary: "A held handstand with your feet resting on a wall, to build the shoulder strength and straight line a free handstand needs.",
    setup: [
      "Choose a clear stretch of wall and a floor that won't slip, and warm up your wrists first.",
      "Kick up with your chest facing the wall, which makes a straight line easier to find, or with your back to it.",
      "Place your hands about shoulder-width apart, fingers spread, a short distance from the wall."
    ],
    steps: [
      "Kick up until your feet rest on the wall and your arms are straight.",
      "Stack your wrists, shoulders and hips in one line, and point your toes.",
      "Push tall through your shoulders as if pushing the floor away from you.",
      "Squeeze your glutes and keep your ribs down so your back doesn't arch into a banana shape.",
      "Come down by lowering one foot at a time, or step out sideways."
    ],
    breathing: "Breathe steadily through the hold; if you catch yourself holding your breath, come down.",
    tempo: "Kick up smoothly, hold still, and take your time coming down; no flopping out of it.",
    feel: {
      should: "In your shoulders as they push tall, with your stomach and glutes keeping your line straight.",
      shouldnt: "In your lower back, which means you've arched, or sharply in your wrists."
    },
    mistakes: [
      { mistake: "Your back arches and your ribs flare into a banana shape.",
        fix: "Squeeze your glutes, tuck your ribs down and move your feet slightly lower on the wall if you must." },
      { mistake: "You sink into your shoulders and shrug toward your ears.",
        fix: "Push the floor away until your shoulders are lifted tall, and keep your head between your arms." }
    ],
    safety: [
      "Learn to exit safely by stepping out or cartwheeling away before you hold it longer; clear everything from the floor around you.",
      "Stop and come down if your wrists, shoulders or head feel strained, or you feel dizzy."
    ]
  };

  C.shoulder_4 = {
    summary: "The entry into a handstand: kick up from a lunge and find your balance, using the wall to stop you falling over.",
    setup: [
      "Clear the floor and place your hands a short distance from the wall, shoulder-width apart, fingers spread.",
      "Step into a lunge with your hands on the floor and your shoulders over them.",
      "Decide how you'll exit before you go up, by stepping down or cartwheeling out."
    ],
    steps: [
      "Kick your back leg up and let your front leg follow, aiming for a tall stacked line.",
      "Keep your body tight and slightly hollow as you rise.",
      "Press your fingertips into the floor to make small balance corrections.",
      "Step down one foot at a time with control, then repeat the entry."
    ],
    breathing: "Breathe out as you kick, and breathe steadily as you balance rather than holding your breath.",
    tempo: "Kick firmly but not wildly, balance as long as you can control, and come down slowly.",
    feel: {
      should: "In your shoulders and fingertips, with your stomach and glutes holding the line.",
      shouldnt: "In your lower back, or as a jolt through your wrists on the way up."
    },
    mistakes: [
      { mistake: "You kick too hard and crash over the top into the wall or the floor.",
        fix: "Use less leg drive and let your back leg lead; the aim is to arrive near the wall, not to slam into it." },
      { mistake: "You arch into a banana shape the moment you find balance.",
        fix: "Squeeze your glutes, tuck your ribs down and keep your toes pointed." }
    ],
    safety: [
      "Practise bailing safely, by stepping down or cartwheeling out, before you attempt balance away from the wall.",
      "Do it on a clear, non-slip floor, and stop if you feel dizzy or your wrists hurt."
    ]
  };

  C.shoulder_5 = {
    summary: "The lowering half of a handstand push-up, taken as slowly as you can, to build the strength for the full press.",
    setup: [
      "Clear the floor and set a mat or folded towels beneath your head so you can touch down lightly.",
      "Kick up to a wall handstand in a straight line, hands about shoulder-width apart.",
      "Stack your wrists, shoulders and hips, and squeeze your stomach and glutes."
    ],
    steps: [
      "Bend your elbows to lower your head toward the floor as slowly as you can, elbows tracking forward rather than flaring.",
      "Keep your body in one hollow line as you descend.",
      "Touch your head lightly to the mat.",
      "Come down from the wall and reset before the next negative."
    ],
    breathing: "Breathe in slowly through the lowering, and breathe out as you reset.",
    tempo: "Lower slowly and steadily, taking your time all the way down, then touch gently without dropping.",
    feel: {
      should: "In your shoulders and the backs of your arms, working to slow your descent.",
      shouldnt: "In your neck, or as a sharp pinch at the front of your shoulder."
    },
    mistakes: [
      { mistake: "You drop quickly instead of resisting the descent.",
        fix: "Start the descent more slowly than feels necessary, and stop higher until you can control the whole range." },
      { mistake: "Your back arches to shorten the range.",
        fix: "Squeeze your glutes and keep your ribs down; stack mats higher so you can reach the floor without arching." }
    ],
    safety: [
      "Stack mats beneath your head while you're learning the descent, so a failed rep ends on something soft.",
      "Stop if your neck or shoulders strain, and don't practise it tired."
    ]
  };

  C.shoulder_6 = {
    summary: "A push-up upside down against a wall: you lower your head to the floor and press back up to straight arms.",
    setup: [
      "Clear the floor, place a mat under your head, and kick up to a wall handstand with your hands about shoulder-width apart.",
      "Stack your wrists, shoulders and hips, and squeeze your stomach and glutes into a tight hollow line.",
      "Keep your head neutral, looking between your hands."
    ],
    steps: [
      "Lower your head toward the floor by bending your elbows, keeping them tracking forward rather than flaring.",
      "Keep your whole body tight throughout.",
      "Lightly touch the mat, or stop just short of it.",
      "Press back to straight arms and push tall through your shoulders at the top."
    ],
    breathing: "Breathe in as you lower, and out as you press up; don't hold your breath at the bottom.",
    tempo: "Lower over about two seconds, touch lightly, then press up steadily without kicking off the wall.",
    feel: {
      should: "In the tops of your shoulders and the backs of your arms, with your stomach and glutes holding you tight.",
      shouldnt: "In your neck, or as a sharp pinch at the front of your shoulder."
    },
    mistakes: [
      { mistake: "You kip with your legs off the wall to get up.",
        fix: "Keep your feet in contact with the wall and take a shorter range until you can press without the swing." },
      { mistake: "Your elbows flare wide and the load drops onto the front of the shoulder.",
        fix: "Aim your elbows forward, toward the wall, and keep your hands about shoulder-width apart." }
    ],
    safety: [
      "This is a heavy shoulder and wrist load; warm up fully and never grind through a cold session.",
      "Keep the mat under your head, and stop if you feel dizzy or your neck strains."
    ]
  };

  C.shoulder_e2_ohp = {
    summary: "A dumbbell press overhead from shoulder height, a direct way to load your shoulders and triceps with weights you can adjust.",
    setup: [
      "Stand or sit tall with a dumbbell in each hand at shoulder height, palms facing forward or toward each other.",
      "Squeeze your glutes and brace your stomach to lock your ribs down.",
      "Place your elbows slightly in front of your body and your wrists stacked over them."
    ],
    steps: [
      "Press the dumbbells straight up until your arms are locked out beside your ears.",
      "Keep your ribs down so you don't lean back to finish.",
      "Pause briefly at the top with your shoulders pushed up toward the ceiling.",
      "Lower the dumbbells under control back to shoulder height."
    ],
    breathing: "Breathe in at the bottom and brace, then breathe out as you press up.",
    tempo: "Press up smoothly, pause at the top, and lower over about two seconds.",
    feel: {
      should: "In the tops of your shoulders and the backs of your arms, with your stomach braced.",
      shouldnt: "In your lower back, or as a pinch at the top of your shoulder."
    },
    mistakes: [
      { mistake: "You lean back and turn the press into an incline press.",
        fix: "Squeeze your glutes and keep your ribs down; use lighter dumbbells if you can't." },
      { mistake: "Your elbows flare out sideways and your brace goes soft.",
        fix: "Keep your elbows slightly forward and brace before each rep." }
    ],
    safety: [
      "Don't arch your lower back to push the weight up; stop the set when you have to.",
      "Stop if a shoulder pinches at the top of the press."
    ]
  };

  C.dip_1 = {
    summary: "A dip with your hands on a bench behind you and your legs out front, a gentler way to learn the pattern.",
    setup: [
      "Sit on the edge of a stable bench with your hands gripping it beside your hips, fingers forward.",
      "Walk your feet out and slide your hips off the bench, with your legs out in front.",
      "Keep your chest up and your shoulders pushed down, away from your ears."
    ],
    steps: [
      "Bend your elbows to lower your hips toward the floor, keeping your back close to the bench.",
      "Stop when your elbows reach about a right angle.",
      "Press back up until your arms are straight.",
      "Keep your shoulders away from your ears the whole way."
    ],
    breathing: "Breathe in as you lower, and out as you press back up.",
    tempo: "Lower over about two seconds, turn around at the bottom without bouncing, then press up smoothly.",
    feel: {
      should: "In the backs of your arms, with a mild stretch across the front of your chest.",
      shouldnt: "As a deep ache in the front of your shoulder, or in your wrists."
    },
    mistakes: [
      { mistake: "Your shoulders shrug up toward your ears.",
        fix: "Push your shoulders down before every rep and keep your neck long." },
      { mistake: "You lower too deep, so your shoulders roll forward.",
        fix: "Stop when your elbows reach a right angle, even if you could go lower." }
    ],
    safety: [
      "Limit the depth so your shoulders stay comfortable; stop before they roll forward.",
      "Make sure the bench can't slide, and stop if you feel a sharp pain at the front of the shoulder."
    ]
  };

  C.dip_2 = {
    summary: "A dip on a single straight bar at hip height, where you press yourself up with the bar close to your body.",
    setup: [
      "Find a straight bar at about hip height that can't move, such as a sturdy rail or a rack.",
      "Take a grip on the bar with your hands about shoulder-width apart and lock your arms straight.",
      "Lean slightly forward and push your shoulders down."
    ],
    steps: [
      "Bend your elbows and lower your body so the bar slides toward your lower chest.",
      "Keep the bar close to your body rather than letting it drift away.",
      "Stop when the bar reaches your lower chest.",
      "Press back up to a strong lockout with your chest proud."
    ],
    breathing: "Breathe in as you lower, and out as you press back up.",
    tempo: "Lower over about two seconds, turn around at the bottom without bouncing, then press up smoothly.",
    feel: {
      should: "In the backs of your arms and the lower chest, with your shoulders held down.",
      shouldnt: "As a pinch at the top or front of your shoulder, or a sharp ache in your wrists."
    },
    mistakes: [
      { mistake: "The bar drifts away from your torso as you lower.",
        fix: "Think of dragging the bar down your body, and keep your elbows close." },
      { mistake: "Your chest collapses forward at the bottom.",
        fix: "Keep your chest lifted and your shoulders pushed down, and stop a little higher." }
    ],
    safety: [
      "Keep your shoulders pushed down; stop if the top of a shoulder pinches.",
      "Check that the bar is fixed and rated for your weight before leaning on it."
    ]
  };

  C.dip_4 = {
    summary: "A dip on a straight bar with your body behind it, so the bar travels up toward your upper chest and neck.",
    setup: [
      "Use a fixed straight bar at about hip height, with your body positioned behind it.",
      "Take a grip with your hands about shoulder-width apart and your arms locked straight.",
      "Keep your shoulders and lats tight, since the deep position stretches your shoulders far."
    ],
    steps: [
      "Bend your elbows and lower so the bar tracks up toward your upper chest and neck.",
      "Keep tension through your shoulders and lats the whole way.",
      "Stop at a depth you can control; don't drop into the stretch.",
      "Press back to lockout under control."
    ],
    breathing: "Breathe in as you lower, and out as you press back up.",
    tempo: "Lower slowly, over about three seconds, with no bounce out of the bottom, then press up steadily.",
    feel: {
      should: "In the backs of your arms and the front of your chest, with your lats working to hold your shoulders.",
      shouldnt: "As a sharp stretch or ache deep in the front of your shoulder."
    },
    mistakes: [
      { mistake: "You lose shoulder control in the deep stretched position.",
        fix: "Stop higher, keep your shoulders pushed down and build depth gradually." },
      { mistake: "You bounce out of the bottom using momentum.",
        fix: "Pause for a beat at the bottom of every rep." }
    ],
    safety: [
      "This is an advanced shoulder stretch; earn it with solid straight bar dips first.",
      "Stop if you feel a sharp pain at the front of the shoulder or a pull in your chest or neck."
    ]
  };

  C.dip_5 = {
    summary: "A dip on gymnastic rings, which move freely and force your shoulders and arms to stabilise as well as press.",
    setup: [
      "Hang the rings at hip height or higher from a fixed support, and check the straps and attachment points.",
      "Support yourself on the rings with your arms locked and your wrists turned slightly outward.",
      "Squeeze the rings tight to your body to stop them wobbling."
    ],
    steps: [
      "Lower your body under control, fighting the rings' wobble with your arms and shoulders.",
      "Keep the rings close to your body as you descend.",
      "Stop at a depth you can control, with your shoulders around elbow height.",
      "Press back to lockout and turn the rings out at the top."
    ],
    breathing: "Breathe in as you lower, and out as you press back up.",
    tempo: "Lower slowly, over about two seconds, then press up steadily; rushing makes the rings wobble more.",
    feel: {
      should: "In the backs of your arms, your chest and your shoulders, which are working to stay stable.",
      shouldnt: "As a sharp pinch in the front of your shoulder, or as a feeling of the shoulder slipping."
    },
    mistakes: [
      { mistake: "The rings drift wide and become unstable.",
        fix: "Squeeze the rings toward your body and start with a smaller range." },
      { mistake: "You rush your reps and lose control of the wobble.",
        fix: "Slow down and pause for a beat at the top of every rep." }
    ],
    safety: [
      "Instability is the point, but back off if your shoulders feel loose or unstable.",
      "Check the rings and their anchor before every session, and stop if your shoulders ache."
    ]
  };

  C.dip_6 = {
    summary: "A parallel-bar dip with added weight hung from a belt or held between your feet, for when bodyweight dips no longer challenge you.",
    setup: [
      "Secure the weight with a dip belt, or hold a dumbbell between your feet with your ankles crossed over it.",
      "Grip the bars with your palms facing in and lock your arms straight.",
      "Lean slightly forward and push your shoulders down away from your ears."
    ],
    steps: [
      "Bend your elbows and lower under full control, elbows travelling back.",
      "Keep the same strict mechanics as a bodyweight dip, with no swinging of the weight.",
      "Stop when your shoulders are just below your elbows.",
      "Press up to a complete lockout."
    ],
    breathing: "Breathe in as you lower, and out as you press back up; brace before each rep.",
    tempo: "Lower over about two seconds, turn around at the bottom without bouncing, then press up smoothly.",
    feel: {
      should: "In the backs of your arms and the lower chest, with your shoulders held down.",
      shouldnt: "As a deep ache at the front of your shoulder, or in your lower back from the hanging weight."
    },
    mistakes: [
      { mistake: "Your depth shrinks to manage the weight.",
        fix: "Use a lighter weight and keep every rep to the same depth." },
      { mistake: "The weight swings and you use the momentum to get up.",
        fix: "Cross your ankles tightly or tighten the belt, and pause for a beat at the bottom." }
    ],
    safety: [
      "Extra weight loads your shoulders hard; only add it once strict bodyweight dips are clean.",
      "Stop if the weight slips, or if you feel sharp pain at the front of the shoulder."
    ]
  };

  C.dip_alt_chair = {
    summary: "A dip off the edge of a chair, with your hands beside your hips and your legs out front; easy to scale by bending or straightening your knees.",
    setup: [
      "Sit on the edge of a stable chair, preferably against a wall, with your hands beside your hips, fingers forward.",
      "Walk your feet out and slide your hips off the front edge.",
      "Keep your shoulders down and your chest up."
    ],
    steps: [
      "Bend your elbows and lower your hips toward the floor, staying close to the chair.",
      "Stop when your elbows reach about a right angle.",
      "Press back up to a full lockout.",
      "Bend your knees to make it easier, or straighten your legs to make it harder."
    ],
    breathing: "Breathe in as you lower, and out as you press up.",
    tempo: "Lower over about two seconds, turn around at the bottom without bouncing, then press up smoothly.",
    feel: {
      should: "In the backs of your arms, with a mild stretch across the front of your chest.",
      shouldnt: "As a deep ache in the front of your shoulder, or in your wrists."
    },
    mistakes: [
      { mistake: "Your shoulders shrug up toward your ears.",
        fix: "Push your shoulders down before each rep and keep your neck long." },
      { mistake: "You drop too deep and overstretch your shoulders.",
        fix: "Stop at a right angle at the elbow; a smaller range is better than a deeper one." }
    ],
    safety: [
      "Limit the depth so your shoulders stay comfortable, and use a chair that can't slide; put it against a wall if unsure.",
      "Stop if you feel a sharp pain at the front of the shoulder."
    ]
  };

  C.dip_alt_twochair = {
    summary: "A dip between two sturdy chairs set side by side, with your arms locked and your legs free, as a stand-in for parallel bars.",
    setup: [
      "Set two sturdy chairs of equal height facing each other, about shoulder-width apart, preferably against a wall.",
      "Place a hand on each seat and lift yourself until your arms are locked, with your legs bent or crossed behind you.",
      "Lean your body slightly forward and push your shoulders down."
    ],
    steps: [
      "Bend your elbows and lower your body between the chairs, elbows travelling back.",
      "Stop when your elbows reach about a right angle.",
      "Press back up to a full lockout.",
      "Keep your shoulders down and your body slightly forward throughout."
    ],
    breathing: "Breathe in as you lower, and out as you press up.",
    tempo: "Lower over about two seconds, turn around at the bottom without bouncing, then press up smoothly.",
    feel: {
      should: "In the backs of your arms and the lower chest.",
      shouldnt: "As a pinch at the front of your shoulder, or from the chairs moving beneath you."
    },
    mistakes: [
      { mistake: "You use light chairs that can tip or slide.",
        fix: "Use heavy, stable chairs and test each with your full weight before the first rep." },
      { mistake: "You go too deep and stress your shoulders.",
        fix: "Stop at a right angle at the elbow, even though the gap between the chairs allows more." }
    ],
    safety: [
      "Make sure both chairs are rock solid; place them against a wall if you're unsure.",
      "Stop if a chair moves, or if the front of a shoulder pinches."
    ]
  };

  C.skill_planche_1 = {
    summary: "A held plank with your shoulders pushed far past your hands, the first step toward the planche and a heavy test of your wrists.",
    setup: [
      "Warm up your wrists first, then start in a push-up plank with your hands turned slightly outward.",
      "Place your hands under your shoulders, fingers turned slightly outward.",
      "Squeeze your glutes and brace your stomach so your body is one straight line."
    ],
    steps: [
      "Lean your shoulders forward past your hands, rising onto the front of your feet.",
      "Push the floor away hard and round your upper back, spreading your shoulder blades.",
      "Hold the lean with your elbows straight and your hips level with your shoulders.",
      "Rock back to a normal plank to finish."
    ],
    breathing: "Breathe steadily through the hold; don't hold your breath, and come out of it if you can't breathe.",
    tempo: "Lean forward slowly, hold still and rock back gently; the further forward you go, the less you should rush.",
    feel: {
      should: "In the fronts of your shoulders, your wrists and your stomach, with a strong push through your hands.",
      shouldnt: "As a sharp ache in the front of your wrists, or in your lower back."
    },
    mistakes: [
      { mistake: "Your hips pike up instead of staying in a straight line.",
        fix: "Squeeze your glutes and tuck your pelvis, even if that means leaning less far." },
      { mistake: "Your elbows bend to cheat the lean.",
        fix: "Lock your elbows and press the floor away; lean less if they bend." }
    ],
    safety: [
      "Heavy wrist load: warm your wrists thoroughly, build the lean gradually and stop if they ache sharply.",
      "Keep the lean modest if the fronts of your shoulders feel strained."
    ]
  };

  C.skill_planche_2 = {
    summary: "A hold balanced on your hands alone with your knees tucked to your chest and your feet off the floor.",
    setup: [
      "Warm up your wrists, then start from a planche lean with your hands turned slightly outward.",
      "Make sure the floor is clear and non-slip, and that you can rock back to your feet if needed.",
      "Brace your stomach and push the floor away to spread your shoulder blades."
    ],
    steps: [
      "Lean your shoulders forward past your hands and lift both feet off the floor.",
      "Pull your knees tight to your chest and keep your hips at shoulder height.",
      "Hold with your elbows straight and your shoulder blades spread apart.",
      "Lower your feet back to the floor under control."
    ],
    breathing: "Breathe steadily through the hold; if you start holding your breath, come down.",
    tempo: "Lift your feet smoothly, hold still, and lower them gently; no jumping or dropping.",
    feel: {
      should: "In the fronts of your shoulders and your stomach, with a strong push through your hands.",
      shouldnt: "As a sharp ache in the wrists, or in your lower back."
    },
    mistakes: [
      { mistake: "Your knees rest on your elbows instead of being held by your shoulders and stomach.",
        fix: "Keep your knees just clear of your arms; if they need to rest, go back to the lean." },
      { mistake: "Your shoulders drift back behind your hands.",
        fix: "Lean further forward before you lift your feet." }
    ],
    safety: [
      "Heavy wrist and shoulder demand; stop at any joint pain.",
      "Train on a soft, clear floor so you can come down safely."
    ]
  };

  C.skill_planche_3 = {
    summary: "A tuck planche with your hips opened so your back is flat, which makes the hold much harder without extending your legs.",
    setup: [
      "Warm up your wrists, then get into a tuck planche with your hands turned slightly outward.",
      "Clear the floor and know how you'll come down.",
      "Spread your shoulder blades wide and brace your stomach before you open your hips."
    ],
    steps: [
      "From the tuck, open your hips so your back becomes flat and parallel to the floor.",
      "Keep your knees tucked, but move them away from your chest.",
      "Hold a strong forward lean with your shoulder blades spread apart.",
      "Return to the tuck, then lower your feet to the floor under control."
    ],
    breathing: "Breathe steadily through the hold; don't let it turn into a held breath.",
    tempo: "Open your hips slowly, hold still, and close them again gently; no jerking in or out.",
    feel: {
      should: "In the fronts of your shoulders, your stomach and the muscles that hold your arms straight.",
      shouldnt: "As a sharp pain in your wrists or the front of your upper arms."
    },
    mistakes: [
      { mistake: "Your hips stay piked high to make it easier.",
        fix: "Aim to lower your hips toward shoulder height, even if you can only manage a little at a time." },
      { mistake: "Your shoulder blades collapse and you sink between your arms.",
        fix: "Keep pushing the floor away, and return to the tuck as soon as that push fades." }
    ],
    safety: [
      "Build your wrists and the tendons of your upper arms slowly at this stage; stop at a sharp pain.",
      "Don't train it when you're tired, and keep the floor clear."
    ]
  };

  C.skill_planche_4 = {
    summary: "A planche held with your legs spread wide and straight, shortening the lever compared with a full planche.",
    setup: [
      "Warm up your wrists, then get into an advanced tuck planche on a clear, non-slip floor.",
      "Know how you'll come down: lower your feet and rock back onto them.",
      "Spread your shoulder blades wide and brace your stomach and glutes."
    ],
    steps: [
      "From the advanced tuck, extend both legs out into a wide straddle.",
      "Keep your body parallel to the floor with your shoulders well forward of your hands.",
      "Point your toes and keep everything rigid.",
      "Bring your legs back in to a tuck, then lower your feet."
    ],
    breathing: "Breathe steadily through the hold; if you catch yourself holding your breath, come down.",
    tempo: "Extend your legs slowly, hold still and bring them back in gently; avoid kicking out.",
    feel: {
      should: "In the fronts of your shoulders, your stomach, your glutes and the muscles holding your arms straight.",
      shouldnt: "As a sharp pain in your wrists, elbows or the front of your upper arms."
    },
    mistakes: [
      { mistake: "Your hips rise above shoulder height.",
        fix: "Squeeze your glutes and tuck your pelvis; if the hips still rise, bring your legs closer in." },
      { mistake: "Your elbows bend under the load.",
        fix: "Lock your elbows and push the floor away; go back to the tuck if they keep bending." }
    ],
    safety: [
      "Elite-level load; never train it cold or fatigued.",
      "Stop at any sharp pain in your wrists, elbows or shoulders."
    ]
  };

  C.skill_planche_5 = {
    summary: "The full planche: your whole body held straight and parallel to the floor, supported on your hands alone.",
    setup: [
      "Warm up your wrists, shoulders and elbows thoroughly before you try this.",
      "Clear a non-slip floor and place a mat beneath you, in case you drop.",
      "Start from a straddle planche, with your hands turned slightly outward."
    ],
    steps: [
      "From the straddle, bring your legs together and extend them fully.",
      "Lean your shoulders far forward of your hands and spread your shoulder blades as wide as you can.",
      "Squeeze your glutes and point your toes so your body is one rigid line.",
      "Lower your feet to the floor under control."
    ],
    breathing: "Breathe steadily through the hold; if you can't breathe, you've held too long.",
    tempo: "Extend your legs slowly, hold still and lower them gently; no kicking or dropping.",
    feel: {
      should: "In the fronts of your shoulders, your stomach, your glutes and your arms, working together.",
      shouldnt: "As a sharp pain in your wrists, elbows or the front of your shoulders."
    },
    mistakes: [
      { mistake: "Your hips pike and the line breaks.",
        fix: "Squeeze your glutes and tuck your pelvis; go back to the straddle if you can't keep the line." },
      { mistake: "Your shoulders fall back behind your hands.",
        fix: "Lean further forward before you extend your legs." }
    ],
    safety: [
      "Attempt this only once your wrists, elbows and shoulders are fully conditioned.",
      "Never train it cold or tired, and stop at any sharp joint pain."
    ]
  };

  C.skill_handstand_1 = {
    summary: "A plank with your feet walked up a wall, giving you a steadier, safer way to practise the inverted shoulder position.",
    setup: [
      "Place your feet against the base of a wall and start in a plank with your hands a little in front of your shoulders.",
      "Make sure the floor is clear and non-slip, and warm your wrists first.",
      "Squeeze your stomach and glutes to hold a tight, hollow line."
    ],
    steps: [
      "Walk your feet up the wall while walking your hands closer in.",
      "Stop at an incline you can hold with a tight body.",
      "Push tall through your shoulders and keep your ribs down.",
      "Walk your feet back down, and your hands back out, to finish."
    ],
    breathing: "Breathe steadily through the hold; don't hold your breath.",
    tempo: "Walk up slowly with control, hold still, and walk back down at the same pace.",
    feel: {
      should: "In your shoulders, which are pushing tall, with your stomach and glutes keeping you straight.",
      shouldnt: "In your lower back, or as a sharp ache in your wrists."
    },
    mistakes: [
      { mistake: "Your lower back overarches.",
        fix: "Squeeze your glutes, tuck your ribs down and walk your feet back down a little." },
      { mistake: "You shrug your shoulders instead of pushing tall.",
        fix: "Push the floor away until your shoulders feel lifted, with a gap between them and your ears." }
    ],
    safety: [
      "Come down if your wrists tire; the position eases you into being inverted, but it's not for pushing through pain.",
      "Stop if you feel dizzy or your head feels heavy."
    ]
  };

  C.skill_handstand_2 = {
    summary: "A handstand held facing a wall, with your chest and toes touching it, which teaches the straight stacked line.",
    setup: [
      "Place your hands a short distance from the wall, shoulder-width apart, and warm your wrists first.",
      "Clear the floor, and know how you'll come down, by walking your feet back down the wall.",
      "Face the wall so your chest and toes will touch it."
    ],
    steps: [
      "Walk your feet up the wall while walking your hands closer to it, until your chest and toes touch.",
      "Stack your wrists, shoulders and hips in one tall, straight line.",
      "Push the floor away hard and keep your ribs tucked in.",
      "Walk your feet back down to finish."
    ],
    breathing: "Breathe steadily through the hold; if you hold your breath, come down.",
    tempo: "Walk up in small, controlled steps, hold still, and come down at the same pace.",
    feel: {
      should: "In your shoulders as they push tall, with your stomach and glutes keeping you straight.",
      shouldnt: "In your lower back, which means you've arched, or sharply in your wrists."
    },
    mistakes: [
      { mistake: "Your back arches into a banana shape.",
        fix: "Tuck your ribs down, squeeze your glutes and walk your hands a little closer to the wall." },
      { mistake: "You sink into your shoulders instead of pushing tall.",
        fix: "Push the floor away until your shoulders feel lifted toward your ears, then hold that." }
    ],
    safety: [
      "Actively push through your shoulders so they and your wrists stay stable under the load.",
      "Come down if you feel dizzy, or your wrists or shoulders feel strained."
    ]
  };

  C.skill_handstand_3 = {
    summary: "A handstand held with your back to the wall and your heels resting on it, so you can practise balance with a safety net.",
    setup: [
      "Place your hands about a forearm's length from the wall, shoulder-width apart, and warm your wrists first.",
      "Clear the floor, and learn to exit by stepping down or cartwheeling out before you hold it long.",
      "Kick up so only your heels touch the wall."
    ],
    steps: [
      "Kick up until your heels rest lightly on the wall.",
      "Find a tall, stacked line, with your wrists, shoulders and hips over each other.",
      "Take some pressure off the wall, and make small balance corrections through your fingers.",
      "Come down by stepping one foot at a time."
    ],
    breathing: "Breathe steadily through the hold; holding your breath ruins your balance.",
    tempo: "Kick up smoothly, hold still, and come down slowly; avoid a hard kick or a quick drop.",
    feel: {
      should: "In your shoulders and fingertips, with your stomach and glutes holding the line.",
      shouldnt: "In your lower back, or as a jolt through your wrists."
    },
    mistakes: [
      { mistake: "You lean your whole body weight into the wall.",
        fix: "Find the point where only your heels touch, and push the floor away to lift away from the wall." },
      { mistake: "Your hips pike away from the wall.",
        fix: "Squeeze your glutes and tuck your ribs so your body stays in one line." }
    ],
    safety: [
      "Learn to bail safely, by stepping or cartwheeling out, before you try to balance away from the wall.",
      "Stop if you feel dizzy or your wrists hurt."
    ]
  };

  C.skill_handstand_4 = {
    summary: "A handstand balanced with no wall at all, held by constant small corrections through your hands.",
    setup: [
      "Choose a clear, soft or non-slip floor with plenty of room, and warm your wrists first.",
      "Learn your bail-out, by stepping down or cartwheeling out, before you try it.",
      "Place your hands about shoulder-width apart, fingers spread."
    ],
    steps: [
      "Kick up and try to find the balance point, with your hips stacked over your shoulders.",
      "Press your fingertips down to stop yourself falling forward, and your palms to stop falling back.",
      "Squeeze your glutes, tuck your ribs and point your toes to keep one tall, hollow line.",
      "Come down by stepping or cartwheeling out; don't fight a fall."
    ],
    breathing: "Breathe steadily; holding your breath stiffens you and wrecks your balance.",
    tempo: "Kick with control, make small smooth balance corrections, and come down calmly.",
    feel: {
      should: "In your fingers and wrists as they make constant corrections, with your stomach and glutes holding the line.",
      shouldnt: "In your lower back, or as a sharp ache in your wrists."
    },
    mistakes: [
      { mistake: "You stiffen up instead of making smooth balance corrections.",
        fix: "Relax your arms slightly and let your fingers do small, quick adjustments." },
      { mistake: "You hold your breath, which kills your balance.",
        fix: "Breathe steadily, in short breaths if you need to, through the whole hold." }
    ],
    safety: [
      "Always know your bail-out, and practise on a soft, clear surface while you're learning.",
      "Stop if you feel dizzy or your wrists hurt."
    ]
  };
})();
