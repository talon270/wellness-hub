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
    prereq: [
      "A controlled incline or knee push-up.",
      "A straight-body plank you can hold without your hips sagging."
    ],
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
    prereq: [
      "A comfortable wall push-up.",
      "A firm, high support for your hands that won't slide."
    ],
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
    prereq: [
      "A stable pike hold on the floor.",
      "Shoulders and wrists that tolerate loading overhead."
    ],
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
    prereq: [
      "A comfortable support hold on straight arms.",
      "A controlled dip on an easier support, such as chairs or a bench."
    ],
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
    prereq: [
      "Comfortable standing, with your hands lightly loaded against a wall."
    ],
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
    prereq: [
      "A comfortable close-hand push-up.",
      "Wrists that tolerate the narrower hand position."
    ],
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
    prereq: [
      "A comfortable standard push-up.",
      "A controlled plank with your feet raised on a firm support."
    ],
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
    prereq: [
      "A strong, clean push-up.",
      "The control to shift your weight toward one arm without twisting."
    ],
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
    prereq: [
      "A comfortable push-up.",
      "Wrists that tolerate leaning forward over your hands."
    ],
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
    prereq: [
      "A comfortable standard push-up.",
      "A load you can keep secure on your back without it sliding or your hips sagging."
    ],
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
    prereq: [
      "Comfortable shoulders when pressing a pair of dumbbells away from your chest.",
      "A bench or floor position that holds you steady."
    ],
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
    prereq: [
      "The strength to hold a straight-arm plank.",
      "Enough control to move your shoulder blades without bending your elbows."
    ],
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
    prereq: [
      "A comfortable standard push-up.",
      "Shoulders that tolerate a wider hand position."
    ],
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
    prereq: [
      "The ability to reach the top push-up position.",
      "The control to lower slowly rather than drop."
    ],
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
    prereq: [
      "Fast, clean standard push-ups.",
      "A controlled landing on your hands when they leave the floor."
    ],
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
    prereq: [
      "A strong archer push-up or assisted one-arm push-up.",
      "The control to resist rotation through your full range."
    ],
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
    prereq: [
      "A controlled plank.",
      "Elbows that extend without pain."
    ],
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
    prereq: [
      "A controlled floor pike push-up.",
      "A firm support for your feet that won't slide."
    ],
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
    prereq: [
      "A stable elevated pike position.",
      "A clear wall and a safe way to come back down."
    ],
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
    prereq: [
      "A steady wall handstand hold.",
      "A clear floor and wall, and a safe way out if you lose balance."
    ],
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
    prereq: [
      "A stable wall handstand.",
      "Pike pressing that feels controlled.",
      "A clear space to bail out of if you tire."
    ],
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
    prereq: [
      "Controlled handstand push-up negatives.",
      "A reliable way to bail out of the position."
    ],
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
    prereq: [
      "Comfortable shoulders when pressing a weight overhead.",
      "A braced stance that keeps your ribs down."
    ],
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
    prereq: [
      "A comfortable plank and wrists that tolerate your weight behind you.",
      "A bench that won't slide."
    ],
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
    prereq: [
      "A stable support on a straight bar.",
      "The control to lower under your own power."
    ],
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
    prereq: [
      "A controlled parallel bar dip.",
      "Wrists and elbows that tolerate a bar passing close to your body."
    ],
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
    prereq: [
      "A controlled parallel bar dip.",
      "Stable support on rings that you can hold still."
    ],
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
    prereq: [
      "Full, controlled bodyweight dips before adding any load.",
      "A load that hangs or sits secure without swinging."
    ],
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
    prereq: [
      "Shoulders that tolerate a supported dip range.",
      "A chair that is firm and won't slide."
    ],
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
    prereq: [
      "A stable support between two chairs that won't slide.",
      "A controlled shallow dip first."
    ],
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
    prereq: [
      "A straight-arm plank.",
      "Wrists that tolerate a small lean forward."
    ],
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
    prereq: [
      "A stable planche lean.",
      "Your shoulder blades pushing the floor away as your feet get light."
    ],
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
    prereq: [
      "A stable tuck planche.",
      "The control to open your hips and knees on purpose."
    ],
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
    prereq: [
      "A stable advanced tuck planche.",
      "Straight-arm loading that your wrists and elbows tolerate."
    ],
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
    prereq: [
      "A stable straddle planche.",
      "Full-body straight-arm strength and balance."
    ],
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
    prereq: [
      "Comfortable shoulders when bearing weight overhead.",
      "A controlled elevated pike position."
    ],
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
    prereq: [
      "A controlled wall walk.",
      "Straight-arm support overhead."
    ],
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
    prereq: [
      "A steady chest-to-wall handstand.",
      "A clear space and a safe way down."
    ],
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
    prereq: [
      "Stable holds against the wall.",
      "Weight shifts that feel controlled.",
      "A safe way out, such as a cartwheel or a step-out."
    ],
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

  /* ---- Yellow Dude catalogue, Group A (plan step 3.1): 27 guides. Each is
     written from the card's Prerequisites, Gear, Cues, Errors and Pain lines
     and the exercise's own cues, in original words; never from a Practice line. */

  C.push_alt_knee = {
    summary: "A push-up from your knees: the same press and the same straight line, with a shorter lever so you can control every rep.",
    prereq: [
      "You can hold a straight line from knees to head on your hands and knees without your hips folding.",
      "Your wrists are comfortable taking your weight with your hands flat on the floor."
    ],
    setup: [
      "Pad the floor under your knees with a mat or a folded towel.",
      "Put your hands just wider than your shoulders, fingers spread, then walk your knees back until your body is one line from knees to head.",
      "Squeeze your glutes and brace your stomach so your hips stay in that line."
    ],
    steps: [
      "Bend your elbows and lower your chest toward the floor, elbows about 45° from your sides.",
      "Keep your head in line with your spine; your chest leads the way down, not your chin.",
      "Stop with your chest a fist's height from the floor, or lightly touching it.",
      "Press the floor away until your arms are straight, without letting your hips pike up."
    ],
    breathing: "Breathe in as you lower, and breathe out as you press up.",
    tempo: "Lower over about two seconds, pause briefly at the bottom without resting, then press up smoothly.",
    feel: {
      should: "Across your chest and in the backs of your arms, with your stomach and glutes keeping the line.",
      shouldnt: "In your lower back, which means your hips have folded, or sharply in your wrists."
    },
    mistakes: [
      { mistake: "You fold at the hips, so the line from your knees to your head breaks.",
        fix: "Squeeze your glutes and brace your stomach, and film a set from the side to check the line." },
      { mistake: "You drop onto your knees at the bottom instead of lowering under control.",
        fix: "Slow the last part of the descent and stop with your chest just above the floor." }
    ],
    safety: [
      "Pad your knees, and ease off if your wrists ache; a higher surface under your hands loads them less.",
      "Stop at a sharp pain in your wrists, elbows or the front of your shoulders."
    ]
  };

  C.push_alt_kneeassist = {
    summary: "A full-body lowering from a toes plank, then a press from your knees, so the slow lowering does most of the work.",
    prereq: [
      "You can lower under control in a knee push-up and press back up with your body in one line.",
      "Your wrists and elbows are comfortable with a long, slow lowering."
    ],
    setup: [
      "Clear room for your full body length, with a mat under your knees if the floor is hard.",
      "Start in a full plank on your toes, with your hands just wider than your shoulders.",
      "Squeeze your glutes and brace your stomach so you lower as one piece."
    ],
    steps: [
      "Lower your whole body in one line over about three seconds, until your chest nears the floor.",
      "Settle your knees onto the floor while your hands stay planted exactly where they are.",
      "Press up from your knees until your arms are straight.",
      "Lift your knees back into the toes plank and repeat."
    ],
    breathing: "Breathe in as you lower, keep a steady brace as your knees land, and breathe out as you press.",
    tempo: "Take the lowering slowly, about three seconds, set your knees down gently, then press up at an even pace.",
    feel: {
      should: "In your chest and triceps through the long lowering, with your stomach holding the line.",
      shouldnt: "As a crash at the bottom, or a sharp ache in your elbows or wrists."
    },
    mistakes: [
      { mistake: "You crash down at the bottom instead of lowering under control.",
        fix: "Slow the lowering until your chest hovers just above the floor before your knees touch." },
      { mistake: "You shuffle your hands when your knees go down.",
        fix: "Plant your hands and keep them still; if they move, you lowered too fast." }
    ],
    safety: [
      "The long lowering loads your elbows and wrists; stop if either turns sharp.",
      "Pad the floor under your knees so landing on them never jars you."
    ]
  };

  C.push_alt_partial = {
    summary: "A push-up done to a fixed depth that you choose, so every rep matches and you can deepen the range a little at a time.",
    prereq: [
      "You can hold a straight plank on your hands and toes.",
      "You can stop a rep at a depth you set in advance, without bouncing."
    ],
    setup: [
      "Put a depth marker under your chest, such as a folded towel or a stack of books, at a height you can reach with control.",
      "Take a plank with your hands just wider than your shoulders and your body in one line.",
      "Squeeze your glutes and brace your stomach."
    ],
    steps: [
      "Lower until your chest touches the marker, with your elbows about 45° from your sides.",
      "Keep your body rigid the whole way down.",
      "Press back up until your arms are straight.",
      "Use the same depth on every rep."
    ],
    breathing: "Breathe in as you lower to the marker, and breathe out as you press up.",
    tempo: "Lower over about two seconds, touch the marker lightly without bouncing, then press up smoothly.",
    feel: {
      should: "In your chest and triceps, with the same effort at the same depth on every rep.",
      shouldnt: "As a bounce off the marker, or a pinch at the front of your shoulder."
    },
    mistakes: [
      { mistake: "You change the depth from rep to rep, so the reps can't be compared.",
        fix: "Keep the marker in place and touch it every rep; if you can't reach it, the marker is too low." },
      { mistake: "You bounce off the marker instead of touching it and pressing.",
        fix: "Pause for a beat on the marker with your weight still on your arms, then press." }
    ],
    safety: [
      "Stay inside a range that feels strong at your shoulders and elbows, and deepen it gradually, never by forcing it.",
      "Stop if the front of your shoulder pinches, and raise the marker."
    ]
  };

  C.push_alt_staggered = {
    summary: "A push-up with one hand set ahead of the other, which loads the two sides unevenly and is done on each side in turn.",
    prereq: [
      "A clean standard push-up, with your body in one line from top to bottom.",
      "Comfort with your hands loaded unevenly, one ahead of the other."
    ],
    setup: [
      "Place one hand under your chest and the other about a hand's length ahead of it.",
      "Set your feet hip-width apart for balance and take a plank, with your hips and shoulders square to the floor.",
      "Squeeze your glutes and brace your stomach, then mark your hand positions so you can repeat them.",
      "Plan the same work with the other hand forward."
    ],
    steps: [
      "Lower your chest between your hands, with your elbows about 45° from your sides.",
      "Keep your hips and shoulders level; don't twist toward the forward hand.",
      "Press up evenly through both hands until your arms are straight.",
      "Finish your reps, then swap which hand is forward and repeat."
    ],
    breathing: "Breathe in as you lower, and breathe out as you press up.",
    tempo: "Lower over about two seconds, pause briefly at the bottom, then press up smoothly and evenly.",
    feel: {
      should: "In your chest and triceps, a little more on the forward side, with your stomach stopping any twist.",
      shouldnt: "As a twist through your torso, or a pinch at the front of the shoulder on the forward-hand side."
    },
    mistakes: [
      { mistake: "You set your hands so far apart that your body twists.",
        fix: "Shorten the stagger until your hips and shoulders stay level through the whole rep." },
      { mistake: "You always put the same hand forward.",
        fix: "Do the same work with each hand forward, and start with your weaker side." }
    ],
    safety: [
      "The forward-hand shoulder takes more strain; shorten the stagger if it pinches.",
      "Stop at a sharp pain in your wrists, elbows or the front of your shoulders."
    ]
  };

  C.push_alt_onearmassist = {
    summary: "A one-arm push-up with your other hand resting on a low support as a light prop, so you can practise the single-arm press under control.",
    prereq: [
      "Strong, level staggered-hand push-ups on both sides.",
      "You can lower on one working arm while the other hand only props."
    ],
    setup: [
      "Set a low, stable support beside your torso, such as a firm step or a stack of books that won't slide.",
      "Take a wide foot stance so you can resist rotating.",
      "Put your working hand under your chest and rest the other hand lightly on the support.",
      "Square your hips and shoulders to the floor, then brace your stomach and glutes."
    ],
    steps: [
      "Lower under control on your working arm, using the helper hand only as a prop.",
      "Keep your hips and shoulders square; the free side must not turn you open.",
      "Press up through the working arm until it is straight.",
      "Let the helper hand do less as you get stronger, then repeat on the other side."
    ],
    breathing: "Breathe in as you lower, and breathe out as you press, keeping your stomach braced throughout.",
    tempo: "Lower slowly, about three seconds, with no drop at the bottom, then press up without rushing.",
    feel: {
      should: "In the chest, triceps and front of the shoulder of your working arm, with your stomach resisting rotation.",
      shouldnt: "Mostly through the helper hand, or as a twist in your lower back."
    },
    mistakes: [
      { mistake: "You press mostly through the helper hand, so the working arm does little.",
        fix: "Rest only your fingertips on the support, so the working arm has to do the lowering." },
      { mistake: "You twist your torso open to get up.",
        fix: "Widen your feet, square your hips and shorten the range until you can stay square." }
    ],
    safety: [
      "A heavy single-shoulder load; keep the helper hand on its support until the working arm controls the whole lowering.",
      "Stop at a sharp pain in your wrist, elbow or the front of your shoulder."
    ]
  };

  C.push_alt_pseudoweighted = {
    summary: "A pseudo planche push-up with a load worn close to your torso, for building strength in a deep forward lean.",
    prereq: [
      "A controlled pseudo planche push-up with no load, with the same lean on every rep.",
      "Wrists and elbows that are comfortable in a deep forward lean."
    ],
    setup: [
      "Put on a snug vest, or a packed backpack worn high on your back, so the load sits close to your body.",
      "Place your hands beside your hips on a stable, flat surface, with your fingers turned out.",
      "Lean your shoulders well ahead of your hands, the same lean as your unweighted version.",
      "Brace your stomach and squeeze your glutes."
    ],
    steps: [
      "Hold the lean and bend your elbows, keeping them tight against your ribs.",
      "Lower until your chest is close to the floor, with your body in one line.",
      "Press up while holding the same forward lean.",
      "Keep the lean the same on every rep, so the load is the only thing that changes."
    ],
    breathing: "Breathe in as you lower, and breathe out through the press without letting your lean slip.",
    tempo: "Lower over about two seconds, keep the lean through the bottom, then press up smoothly; no bouncing under the load.",
    feel: {
      should: "In the fronts of your shoulders, your chest and triceps, with your wrists loaded and your stomach tight.",
      shouldnt: "As an arch in your lower back, or a sharp ache in your wrists, elbows or the fronts of your shoulders."
    },
    mistakes: [
      { mistake: "You add lean and load in the same session, so you can't tell which one is too much.",
        fix: "Fix the lean first, then change the load in small steps with the lean unchanged." },
      { mistake: "You arch your lower back to get the press up.",
        fix: "Squeeze your glutes, tuck your ribs down and drop the load if you can't keep the line." }
    ],
    safety: [
      "High load on your wrists, elbows and the fronts of your shoulders; stop at any sharp pain.",
      "Wear the load snug against your body, and warm up your wrists thoroughly first."
    ]
  };

  C.push_alt_parallette = {
    summary: "A push-up on raised handles, which keeps your wrists straight and lets your chest travel a little lower than the floor allows.",
    prereq: [
      "A solid floor push-up, with your shoulders in control at the bottom.",
      "Parallettes that stay put and don't flex under your full weight."
    ],
    setup: [
      "Set the parallettes shoulder-width apart on level, non-slip ground, and press each one to check it doesn't rock.",
      "Grip the handles with your wrists straight, then take a plank with your body in one line.",
      "Squeeze your glutes and brace your stomach."
    ],
    steps: [
      "Lower between the handles with your elbows about 45° from your sides.",
      "Stop where your shoulders still feel in control, even if the handles allow more.",
      "Press up without letting the handles rock.",
      "Finish with straight arms and your shoulder blades spread."
    ],
    breathing: "Breathe in as you lower, and breathe out as you press up.",
    tempo: "Lower over about two seconds, pause briefly at the bottom without sinking, then press up smoothly.",
    feel: {
      should: "In your chest and triceps, with your wrists comfortable and straight.",
      shouldnt: "As a stretch that pinches the front of your shoulder at the bottom, or as handles wobbling under you."
    },
    mistakes: [
      { mistake: "You set up on handles that wobble or sit unevenly.",
        fix: "Check both handles on level ground before the first rep, and stop if either moves." },
      { mistake: "You go deeper than your shoulders control, just because the handles allow it.",
        fix: "Stop at the depth where you can still press out smoothly, even if that's no deeper than the floor." }
    ],
    safety: [
      "The handles let you go deeper, which stretches the front of your shoulder; stay inside your range.",
      "Stop if a handle moves or if the front of your shoulder pinches."
    ]
  };

  C.push_alt_slider = {
    summary: "A push-up with a towel or slider under each hand, where you resist your hands sliding apart and so brace your chest and shoulders harder.",
    prereq: [
      "A controlled floor push-up, with your body in one line.",
      "You can stop your hands sliding apart on a smooth floor."
    ],
    setup: [
      "Use a smooth floor, such as tile or wood, and put a towel or slider under each hand.",
      "Take a plank with your hands about shoulder-width apart and your body in one line.",
      "Clear space on both sides, so your hands have room to travel.",
      "Test the slide with a very small lowering before your first full rep."
    ],
    steps: [
      "Lower your chest while drawing your hands toward each other, so they don't slide out.",
      "Keep your body straight and your ribs from sagging.",
      "Press back up, letting your hands return to shoulder width under control.",
      "Reset your hands if they have drifted before the next rep."
    ],
    breathing: "Breathe in as you lower, and breathe out as you press up.",
    tempo: "Lower over about two seconds, keep the squeeze steady at the bottom, then press up smoothly.",
    feel: {
      should: "Across your chest and in your shoulders, with your hands pulling in as if to squeeze the floor.",
      shouldnt: "As your hands sliding out from under you, or a sharp tug at the front of your shoulder."
    },
    mistakes: [
      { mistake: "You let your hands slide out and your chest collapses.",
        fix: "Draw your hands toward each other from the first moment, and shorten the range until they stay put." },
      { mistake: "You use a floor so slick, or so grippy, that your two sides slide unevenly.",
        fix: "Change the surface or the cloth until both hands move together." }
    ],
    safety: [
      "A sudden slide can wrench the shoulder; keep the slide short and controlled.",
      "Keep the area around you clear in case a hand slips, and stop at a sharp pain in your shoulder or elbow."
    ]
  };

  C.push_alt_ringcross = {
    summary: "A ring push-up where you reach one ring across your body at the top, so your chest and shoulders must control a moving load.",
    prereq: [
      "A steady ring push-up with no wobble at the bottom.",
      "Shoulders that stay stable when the rings move.",
      "Rings hung from a point that holds your full weight without shifting."
    ],
    setup: [
      "Set the rings at equal height, low enough that your feet carry most of your weight.",
      "Check the straps and the anchor before the first rep, since a slipping ring drops you.",
      "Take a ring push-up plank with your hands under your shoulders and your body in one line.",
      "Square your hips, and brace your stomach and glutes."
    ],
    steps: [
      "Lower with control, with your elbows about 45° from your sides.",
      "Press up, then reach one ring across your body toward the other side, only as far as you can keep it steady.",
      "Bring it back under control and set your hand beside your chest again.",
      "Cross with the other side next, keeping both rings steady throughout."
    ],
    breathing: "Breathe in as you lower, and breathe out as you press and reach.",
    tempo: "Lower over about two seconds, then move the reach slowly; a quick swing is how the rings get away from you.",
    feel: {
      should: "In your chest, the front of your shoulder and your stomach, as they hold the rings still.",
      shouldnt: "As a wrench at the front of your shoulder, or from the rings swinging out of your control."
    },
    mistakes: [
      { mistake: "You let the rings fly apart or swing as you cross.",
        fix: "Cross a shorter distance and slow the movement until both rings stay quiet." },
      { mistake: "You twist your hips to make the reach.",
        fix: "Keep your hips square; if you can't reach without twisting, reach less far." }
    ],
    safety: [
      "Unstable rings load your shoulders from awkward angles; keep the crossing small.",
      "Keep your feet on the floor, and stop at a sharp pain in your shoulder, elbow or wrist."
    ]
  };

  C.push_alt_fingertip = {
    summary: "A push-up with your weight on the pads of your fingers, which loads your fingers and forearms far more than flat hands do.",
    prereq: [
      "A strong standard push-up.",
      "Fingers that take your weight gradually without any pain."
    ],
    setup: [
      "Begin against a wall or a high, stable support, so only part of your weight lands on your fingers.",
      "Spread your fingers wide with your weight on the finger pads.",
      "Brace into a straight line from your head to your heels."
    ],
    steps: [
      "Lower your chest toward the support, keeping your fingers from folding flat.",
      "Spread the load across all your fingers, not just your thumbs and index fingers.",
      "Press back up until your arms are straight.",
      "Reset your fingers on the support before the next rep."
    ],
    breathing: "Breathe in as you lower, and breathe out as you press up.",
    tempo: "Lower slowly, about two seconds, with no drop at the bottom, then press up smoothly.",
    feel: {
      should: "In the pads of your fingers and your forearms, along with your chest and triceps.",
      shouldnt: "As a sharp ache in the finger joints or tendons, or fingers collapsing flat."
    },
    mistakes: [
      { mistake: "You let your finger joints cave in at the bottom.",
        fix: "Move to a higher surface, so less weight sits on your fingers." },
      { mistake: "You jump straight to the floor with your full bodyweight.",
        fix: "Start high and lower the surface gradually across many sessions." }
    ],
    safety: [
      "Stop if your finger joints or tendons ache; they adapt more slowly than muscle.",
      "Build up on a high surface first, and lower it only if your fingers stay comfortable."
    ]
  };

  C.skill_planche_band = {
    summary: "A planche lean with a band taking part of your weight, so you can lean further than your arms alone allow.",
    prereq: [
      "A straight-arm plank held with your body in one line and your wrists comfortable.",
      "A band that is intact and anchored to something solid that won't move."
    ],
    setup: [
      "Inspect the band for nicks and wear, then anchor it to something that can't move.",
      "Loop the band so it takes part of your weight as you lean forward.",
      "Take a straight-arm plank, on the floor or on parallettes, with your hands turned slightly outward.",
      "Clear space ahead of you, and know how you'll put your feet down."
    ],
    steps: [
      "Squeeze your glutes, brace your stomach and push the floor away with straight elbows.",
      "Lean your shoulders forward past your hands, letting the band take some of the weight.",
      "Hold the lean with your elbows locked and your body in one line.",
      "Put your feet down before the band goes slack, and ease out of the lean slowly."
    ],
    breathing: "Breathe steadily through the hold; if you catch yourself holding your breath, ease out of the lean.",
    tempo: "Lean forward slowly, hold still, and come out gently; never let the band snap you back.",
    feel: {
      should: "In the fronts of your shoulders, your wrists and your stomach, with the band taking some weight.",
      shouldnt: "As a sharp ache in your wrists, or from bent elbows letting you sag."
    },
    mistakes: [
      { mistake: "You bend your elbows to reach a deeper lean.",
        fix: "Lock your elbows and lean only as far as you can with them straight." },
      { mistake: "You let the band recoil suddenly when you come out.",
        fix: "Put your feet down before the band goes slack, and ease out under control." }
    ],
    safety: [
      "Heavy wrist loading: build the lean a little at a time, and stop if your wrists ache sharply.",
      "Check the band for wear and the anchor for movement before every session."
    ]
  };

  C.skill_planche_boxtuck = {
    summary: "A tuck planche with your feet resting lightly on a box, so you can practise the position with some of your weight off your hands.",
    prereq: [
      "A planche lean with straight elbows and your shoulders well past your hands.",
      "You can rest your feet on a box without pushing off it.",
      "A box that doesn't slide or tip when you push on it."
    ],
    setup: [
      "Set the parallettes on level, non-slip ground, with a sturdy box behind them at a height your feet can rest on.",
      "Push on the box and the parallettes with your full weight to check neither slides or tips.",
      "Support yourself on straight arms with your hands fixed on the handles.",
      "Clear space ahead of you, and know how you'll put your feet down."
    ],
    steps: [
      "Rest your feet lightly on the box with your elbows locked.",
      "Lean your shoulders forward past your hands, pushing the floor away.",
      "Tuck your knees toward your chest, taking as little weight on the box as you can.",
      "Settle your feet back on the box before you come down."
    ],
    breathing: "Breathe steadily through the hold; if you catch yourself holding your breath, put your feet back on the box.",
    tempo: "Lean and tuck slowly, hold still, and settle your feet back gently; no jumping onto or off the box.",
    feel: {
      should: "In the fronts of your shoulders, your wrists and your stomach, with the box taking only a little.",
      shouldnt: "From your feet pushing hard on the box, or as a sharp ache in your wrists or elbows."
    },
    mistakes: [
      { mistake: "You push hard off the box with your feet, so your arms do little.",
        fix: "Let your feet rest on the box and lean further forward, so your arms and shoulders carry the weight." },
      { mistake: "You use a box that slides or tips.",
        fix: "Test it with your full weight before the first rep, and put it against a wall if it slides." }
    ],
    safety: [
      "Check that the box and parallettes are stable, and stop on any wrist or elbow pain.",
      "Heavy wrist load: warm up first, and stop at a sharp ache."
    ]
  };

  C.skill_planche_boxpushup = {
    summary: "A push-up from a straddle planche with your feet resting lightly on a box, so you practise lowering and pressing with some weight taken off.",
    prereq: [
      "A stable box-supported planche hold and a controlled bent-arm descent in your push-ups.",
      "Parallettes and a box that stay put under your full weight."
    ],
    setup: [
      "Set the parallettes in front of a stable box, and check that neither slides.",
      "Rest your feet lightly on the box in a wide straddle.",
      "Lean forward over your hands with straight elbows, taking most of your weight on your arms.",
      "Clear space ahead of you, and know how you'll put your feet down."
    ],
    steps: [
      "Lean your shoulders ahead of your hands with your elbows straight.",
      "Bend your elbows slowly, to a depth you can reverse.",
      "Press back up to straight arms, keeping your feet light on the box.",
      "Settle your feet back on the box before you come down."
    ],
    breathing: "Breathe in as you lower, and breathe out as you press; don't hold your breath at the bottom.",
    tempo: "Lower over about three seconds, with no drop, then press up smoothly without kicking off the box.",
    feel: {
      should: "In the fronts of your shoulders, your chest and triceps, with your wrists taking a heavy load.",
      shouldnt: "As a sharp pain in your wrists, elbows or shoulders, or from your feet pushing off the box."
    },
    mistakes: [
      { mistake: "You let the box slide, or you push off it with your feet.",
        fix: "Brace the box against a wall, and keep your feet resting on it rather than pushing." },
      { mistake: "Your elbows flare or collapse during the descent.",
        fix: "Cut the depth and keep your elbows close to your ribs, so you can reverse every rep." }
    ],
    safety: [
      "Very high wrist, elbow and shoulder load; stop at any sharp pain.",
      "Never train it tired, and check the box and handles before each set."
    ]
  };

  C.skill_planche_pushup = {
    summary: "A push-up from a full planche, bending your elbows while your body stays flat and parallel to the floor.",
    prereq: [
      "A stable full planche with a controlled exit.",
      "A controlled pseudo planche push-up, with the same lean on every rep.",
      "Someone qualified to watch your technique, since the app can't."
    ],
    setup: [
      "Warm up your wrists, elbows and shoulders thoroughly.",
      "Use a flat, non-slip floor or stable parallettes, with a mat and clear space ahead of you.",
      "Know how you'll put your feet down if you lose the line.",
      "Get into your full planche with your shoulders well ahead of your hands."
    ],
    steps: [
      "From a full planche, bend your elbows while your body stays parallel to the floor.",
      "Lower in one rigid line, without letting your hips rise.",
      "Reverse the descent under control; don't kick or drop into the bottom.",
      "Press back to a straight-arm planche, then lower your feet."
    ],
    breathing: "Breathe steadily through the movement; if you can't breathe, you've held the position too long.",
    tempo: "Lower and press slowly and evenly, with no drop at the bottom and no kick on the way up.",
    feel: {
      should: "In the fronts of your shoulders, your chest, triceps and stomach, all working together.",
      shouldnt: "As a sharp pain in your wrists, elbows or shoulders, or from your hips rising to help."
    },
    mistakes: [
      { mistake: "You drop into the bottom position instead of lowering under control.",
        fix: "Cut the depth until you can reverse every rep without kicking." },
      { mistake: "Your hips rise to ease the press.",
        fix: "Squeeze your glutes and tuck your pelvis, and go back to a shallower range if the line breaks." }
    ],
    safety: [
      "Elite load on your wrists, elbows and shoulders; never train it cold or tired.",
      "Have a coach watch you, and stop at any sharp joint pain."
    ]
  };

  C.shoulder_alt_pikeneg = {
    summary: "A slow lowering from a pike position toward the floor, building the strength you need for a pike push-up.",
    prereq: [
      "A steady pike hold on your hands and feet.",
      "You can control a slow lowering, in a shallow range at first.",
      "Clear floor ahead of your hands for your head to travel into."
    ],
    setup: [
      "Clear the floor ahead of your hands, since your head travels there.",
      "Use a non-slip floor or a mat that stays put.",
      "Place your hands shoulder-width apart and walk your feet in until your hips are high.",
      "Press your hands into the floor and push your shoulders tall."
    ],
    steps: [
      "Bend your elbows and lower your head slowly toward the floor over about four seconds.",
      "Keep your hips high and your elbows from flaring.",
      "Stop before you lose control; keep the range shallow at first.",
      "Reset to the top by pressing up or walking your feet back, and repeat."
    ],
    breathing: "Breathe in as you lower, and breathe out as you press or walk back to the top.",
    tempo: "Lower slowly, about four seconds, without stopping dead, then reset at the top before the next one.",
    feel: {
      should: "In your shoulders and triceps, working to slow the descent, with your stomach keeping your body tight.",
      shouldnt: "As weight dropping onto your head, or a sharp pinch in your neck, wrists or shoulders."
    },
    mistakes: [
      { mistake: "You drop onto your head instead of lowering under control.",
        fix: "Stop higher, where you can control the speed, and go a little lower only as the control holds." },
      { mistake: "Your elbows flare and your shoulders lose their position.",
        fix: "Keep your elbows angled back toward your hips and your shoulders pushed tall." }
    ],
    safety: [
      "Keep the landing area clear and the range shallow at first; stop if your neck or wrists complain.",
      "Go slowly, and stop at dizziness, or at pain or tingling in your neck or arms."
    ]
  };

  C.skill_handstand_pike = {
    summary: "A held pike with your hips high over your shoulders, the first step toward carrying your weight upside down.",
    prereq: [
      "A comfortable pike position with your hands on the floor.",
      "Shoulders that tolerate your weight pressing down through your hands."
    ],
    setup: [
      "Clear a non-slip floor, with a mat only if it doesn't slip.",
      "Place your hands shoulder-width apart and walk your feet in until your hips are high and your body is an upside-down V.",
      "Press your hands into the floor and push your shoulders tall, away from your ears.",
      "Leave clear space to one side, so you can step out of the position."
    ],
    steps: [
      "Press the floor away until your arms are straight and your shoulders are tall.",
      "Stack your hips toward being over your shoulders, without forcing your back to round.",
      "Keep your chest from sagging and your head relaxed between your arms.",
      "Hold still, then walk your feet back out to a plank."
    ],
    breathing: "Breathe steadily through the hold; don't hold your breath, and keep your neck relaxed.",
    tempo: "Walk your feet in slowly, hold still without bouncing, and walk out at the same pace.",
    feel: {
      should: "In your shoulders as they push tall, with the backs of your legs stretching and your stomach engaged.",
      shouldnt: "In your neck from shrugging, or as a sharp ache in your wrists."
    },
    mistakes: [
      { mistake: "You shrug into your neck.",
        fix: "Push the floor away until there's a gap between your shoulders and your ears." },
      { mistake: "You let your trunk sag, so your hips drop.",
        fix: "Press your hips up and back, and bring your feet in a little if you can't keep them high." }
    ],
    safety: [
      "The hold is heavy on your wrists; shift your weight back toward your feet if they complain.",
      "Come out if you feel dizzy, or if your wrists, shoulders or neck hurt."
    ]
  };

  C.skill_handstand_pikeelev = {
    summary: "A pike hold with your feet raised on a platform, so more of your weight sits over your hands and shoulders.",
    prereq: [
      "A steady pike hold on the floor.",
      "A low platform that stays still when you put your full weight on it."
    ],
    setup: [
      "Put your feet on a stable low platform, such as a bench, that won't slide.",
      "Place your hands on the floor shoulder-width apart and walk them in until your hips rise above your shoulders.",
      "Press through your hands and push your shoulders tall.",
      "Warm up your wrists, and leave space to one side for a safe exit."
    ],
    steps: [
      "Walk your hands in until your hips are stacked over your shoulders.",
      "Keep your feet planted on the platform and the platform still.",
      "Press the floor away and hold, without letting your shoulders collapse.",
      "Walk your hands back out, then lower your feet to the floor."
    ],
    breathing: "Breathe steadily through the hold; if you catch yourself holding your breath, come down.",
    tempo: "Walk in slowly, hold still without bouncing, and come out at the same pace.",
    feel: {
      should: "In your shoulders and triceps, working harder than in the floor pike, with your stomach holding the line.",
      shouldnt: "From your shoulders sinking toward your ears, or as an ache in your wrists or neck."
    },
    mistakes: [
      { mistake: "The platform shifts under your feet.",
        fix: "Use a platform that can't slide, or push it against a wall, and test it before you hold." },
      { mistake: "You collapse through your shoulders as the load builds.",
        fix: "Keep pushing the floor away until your shoulders feel tall; if they sink, come down." }
    ],
    safety: [
      "More weight on your wrists and shoulders than the floor pike; come down if either feels unstable.",
      "Stop at dizziness, or at pain or tingling in your neck, wrists or shoulders."
    ]
  };

  C.skill_handstand_wallwalk = {
    summary: "A walk up a wall from a plank into a steep pike, then back down, which builds comfort with your weight overhead.",
    prereq: [
      "A strong plank and a steady pike hold.",
      "You can climb up and down a wall in small, controlled steps.",
      "A clear wall and a non-slip floor."
    ],
    setup: [
      "Start in a plank with your feet at the base of a wall, and warm up your wrists first.",
      "Use a non-slip floor or a mat that stays put, with clear space to the side.",
      "Know which side you would step out to before you start."
    ],
    steps: [
      "Walk your feet up the wall while your hands walk toward it, in small steps.",
      "Keep your arms straight and your stomach braced.",
      "Stop where you still feel in control, even if that's far from the wall.",
      "Walk back down the same way, one hand and one foot at a time."
    ],
    breathing: "Breathe steadily all the way up and down; holding your breath is how people tense up and rush.",
    tempo: "Move in small steps at an even pace going up, pause where you stop, then come down at the same speed.",
    feel: {
      should: "In your shoulders as they hold you up, with your stomach and glutes keeping a tight line.",
      shouldnt: "As a sag in your lower back, or a sharp ache in your wrists or neck."
    },
    mistakes: [
      { mistake: "You walk too close to the wall before you're ready.",
        fix: "Stop at the height where you can control the descent, and go closer only a little at a time." },
      { mistake: "You hold your breath on the way up.",
        fix: "Breathe through every step, and slow down if you can't." }
    ],
    safety: [
      "The walk back down loads your wrists and shoulders heavily; stay in a range you can reverse.",
      "Stop if you feel dizzy, or if your wrists, shoulders or neck hurt."
    ]
  };

  C.skill_handstand_cartwheel = {
    summary: "A sideways exit from a handstand: you turn toward open floor and put one foot down at a time, like a cartwheel.",
    prereq: [
      "A comfortable wall handstand, and a cartwheel on the floor.",
      "Open floor with a clear lane to one side."
    ],
    setup: [
      "Use open, non-slip floor with a clear lane to one side and nothing you could hit.",
      "Practise at low height first, from a wall-supported handstand or a low kick-up.",
      "Decide which way you'll turn before you go up."
    ],
    steps: [
      "From a low or wall-supported handstand, turn your body sideways toward the open space.",
      "Lower one leg toward the floor and place that foot down first.",
      "Place the other foot down, coming out like a cartwheel.",
      "Stand up and reset before the next try."
    ],
    breathing: "Breathe steadily through the turn; don't hold your breath as you leave the handstand.",
    tempo: "Turn smoothly and place each foot down in turn, with no hurry and no stalling halfway.",
    feel: {
      should: "In your shoulders as they steer the turn, with your legs controlled rather than flung.",
      shouldnt: "As a jolt through your wrists, or from aiming toward the wall."
    },
    mistakes: [
      { mistake: "You try to roll toward the wall.",
        fix: "Turn your body sideways every time; the exit always goes toward the open space." },
      { mistake: "You cross your legs without turning your body.",
        fix: "Turn your hips and chest sideways as your legs come down." }
    ],
    safety: [
      "Keep the floor clear of objects, and use a non-slip floor or a mat that doesn't slide.",
      "Stop if you feel dizzy, or if your wrists, shoulders or neck hurt."
    ]
  };

  C.skill_handstand_toetap = {
    summary: "A chest-to-wall handstand where you lift one toe off the wall and tap it back, practising balance with the wall still beside you.",
    prereq: [
      "A stable chest-to-wall handstand.",
      "You can release one foot a small distance from the wall, under control.",
      "A safe exit that you have already practised."
    ],
    setup: [
      "Warm up your wrists, then place your hands a short way from the wall, shoulder-width apart.",
      "Use a non-slip floor with clear space to the side for your exit.",
      "Walk your feet up the wall until your chest and toes touch it."
    ],
    steps: [
      "Hold a stable chest-to-wall handstand with your toes against the wall.",
      "Lift one toe lightly off the wall, keeping your shoulders stacked over your hands.",
      "Tap it back to the wall and switch sides.",
      "Walk your feet back down to finish."
    ],
    breathing: "Breathe steadily through the whole hold; holding your breath ruins your balance.",
    tempo: "Lift and tap slowly and lightly, hold still between taps, and come down at the same pace.",
    feel: {
      should: "In your shoulders and fingers as they balance, with your stomach and glutes holding the line.",
      shouldnt: "From a twist in your pelvis, or as a sharp ache in your wrists."
    },
    mistakes: [
      { mistake: "You kick away from the wall.",
        fix: "Lift the toe only a little; the tap is a small release, not a push-off." },
      { mistake: "You twist your pelvis as the leg lifts.",
        fix: "Keep your hips square to the wall by squeezing your glutes before you lift." }
    ],
    safety: [
      "Know a safe exit before you start, and step down if your wrists tire.",
      "Stop if you feel dizzy, or if your wrists, shoulders or neck hurt."
    ]
  };

  C.skill_handstand_split = {
    summary: "A handstand balanced with your legs in a gentle split, one near the wall for control, to prepare for balancing free.",
    prereq: [
      "A stable wall handstand.",
      "You can balance with one leg near the wall and exit safely."
    ],
    setup: [
      "Warm up your wrists, then place your hands about a forearm's length from the wall.",
      "Clear a non-slip floor with open space to the side for your exit.",
      "Decide your exit before you go up."
    ],
    steps: [
      "Go up to a handstand with one leg near the wall and the other held forward.",
      "Push the floor away and keep your shoulders tall.",
      "Hold your legs in a gentle split, without scissoring them.",
      "Look at the floor between your hands, then come down by stepping out."
    ],
    breathing: "Breathe steadily through the hold; holding your breath stiffens you and wrecks your balance.",
    tempo: "Kick up smoothly, hold still, and come down slowly; avoid a hard kick or a quick drop.",
    feel: {
      should: "In your shoulders and fingers as they balance, with your stomach and glutes holding the line.",
      shouldnt: "In your lower back, or as a jolt through your wrists."
    },
    mistakes: [
      { mistake: "You scissor your legs wildly.",
        fix: "Keep the leg near the wall in light contact and move the other leg only a little." },
      { mistake: "You look far ahead of your hands.",
        fix: "Look at the floor between your hands and keep your neck long." }
    ],
    safety: [
      "Practise on a non-slip surface, with clear space to the side.",
      "Stop if you feel dizzy, or if your wrists, shoulders or neck hurt."
    ]
  };

  C.skill_handstand_parallette = {
    summary: "A handstand held on parallette handles, which keeps your wrists straight but makes the balance narrower and the fall higher.",
    prereq: [
      "A stable freestanding handstand on the floor.",
      "A secure grip on the handles, and parallettes that stay still under your full weight."
    ],
    setup: [
      "Set the parallettes on non-slip ground, with plenty of clear space on both sides.",
      "Press on each one to check it doesn't rock or slide.",
      "Grip the handles evenly, with your hands shoulder-width apart.",
      "Know your exit, and warm up your wrists first."
    ],
    steps: [
      "Go up to a handstand with your shoulders stacked over the handles.",
      "Grip evenly and keep the handles still.",
      "Balance through your fingers and your grip, with small corrections.",
      "Come down by stepping or cartwheeling out, away from the handles."
    ],
    breathing: "Breathe steadily through the hold; holding your breath ruins your balance.",
    tempo: "Kick up with control, make small smooth corrections, and come down calmly.",
    feel: {
      should: "In your fingers and grip as they correct your balance, with your stomach and glutes holding the line.",
      shouldnt: "In your lower back, or as a sharp ache in your wrists."
    },
    mistakes: [
      { mistake: "The handles rock because they were set up unevenly.",
        fix: "Set both on level ground and press on them before you go up; stop if either moves." },
      { mistake: "You over-grip while your shoulder line collapses.",
        fix: "Grip firmly but not hard, and keep pushing the floor away so your shoulders stay tall." }
    ],
    safety: [
      "A fall from raised handles is higher; choose a stable floor and know your exit.",
      "Stop if you feel dizzy, or if your wrists, shoulders or neck hurt."
    ]
  };

  C.skill_handstand_bentarm = {
    summary: "A handstand held with your elbows bent through a small range, which builds the strength for a handstand push-up.",
    prereq: [
      "A strong handstand balance, and a controlled bent-arm position in your pike push-ups.",
      "A padded surface, with a wall or a spotter beside you.",
      "Someone qualified who can watch you, since a loss of control here puts your head at risk."
    ],
    setup: [
      "Put a mat down that doesn't slide, with a wall or a spotter within reach.",
      "Warm up your wrists and shoulders thoroughly.",
      "Go up to a stable handstand before you bend your elbows."
    ],
    steps: [
      "From a stable handstand, bend your elbows slowly through a small range.",
      "Keep your head clear of the floor and your shoulders active.",
      "Push the floor away rather than sinking into it.",
      "Press back up to straight arms before you tire, then come down."
    ],
    breathing: "Breathe steadily through the hold; holding your breath makes you stiff and throws off your balance.",
    tempo: "Bend slowly, pause only as long as you stay in control, and press back up without bouncing.",
    feel: {
      should: "In your shoulders and triceps, working to hold the position, with your stomach and glutes keeping the line.",
      shouldnt: "As weight dropping toward your head, or a sharp pain in your neck, wrists or shoulders."
    },
    mistakes: [
      { mistake: "You drop onto your head.",
        fix: "Keep the range small, and press back up before your elbows pass the point you can reverse." },
      { mistake: "Your elbows flare out of control.",
        fix: "Keep your elbows moving back along your sides, and shorten the range until they stay put." }
    ],
    safety: [
      "Your head and neck are at risk if control goes; use a padded surface and keep the range small.",
      "Stop at dizziness, or at pain or tingling in your neck, wrists or shoulders."
    ]
  };

  C.skill_handstand_onearm = {
    summary: "A handstand held on one hand, built by shifting your weight gradually over your supporting hand while your free shoulder stays up.",
    prereq: [
      "A consistent freestanding handstand, and practised weight shifts onto one hand.",
      "A cartwheel exit that you can do toward both sides.",
      "A coach or a spotter, where you can."
    ],
    setup: [
      "Warm up your wrists and shoulders thoroughly; the load on a single wrist is very high.",
      "Use a non-slip floor with a wall and open space to the side, ideally with a coach or spotter.",
      "Know your cartwheel exit before you go up."
    ],
    steps: [
      "Go up to a steady freestanding handstand.",
      "Shift your weight gradually over your supporting hand.",
      "Keep your free shoulder up rather than letting it drop.",
      "Come out by cartwheeling toward the open space."
    ],
    breathing: "Breathe steadily through the hold; holding your breath stiffens you and ends the balance.",
    tempo: "Shift your weight in small, slow steps, stay only as long as it's controlled, and exit before a wobble gets away from you.",
    feel: {
      should: "In your supporting wrist, shoulder and fingers as they take the load, with your stomach and glutes holding the line.",
      shouldnt: "As a dropped free shoulder or a twist, or a sharp pain in your wrist or shoulder."
    },
    mistakes: [
      { mistake: "You drop your free shoulder.",
        fix: "Keep pushing it up toward your ear, and shift less weight until you can." },
      { mistake: "You twist out of control.",
        fix: "Keep your hips and chest square, and exit before the twist starts." }
    ],
    safety: [
      "Very high single-wrist and shoulder load; keep sessions short and always know your exit.",
      "Work with a coach or a spotter where you can, and stop at any sharp pain or dizziness."
    ]
  };

  C.dip_alt_negative = {
    summary: "A slow lowering from a straight-arm support on dip bars or a straight bar, building the strength for a full dip.",
    prereq: [
      "A steady straight-arm support on bars, without shrugging.",
      "You can lower yourself under control, to a depth you set in advance.",
      "Bars that are stable, with a step to reset on."
    ],
    setup: [
      "Use dip bars or a straight bar that don't move under your full weight.",
      "Put a step or a box within reach, so you can reset without dropping.",
      "Step or jump up into a straight-arm support, with your shoulders pressed down away from your ears.",
      "Check whether you're on parallel bars or a straight bar, since they feel different."
    ],
    steps: [
      "Start in a stable straight-arm support.",
      "Lower yourself slowly, with your elbows pointing back, to a depth you can control.",
      "Keep your shoulders from shrugging as you go down.",
      "Step down or onto the step rather than dropping, then return to the top for the next rep."
    ],
    breathing: "Breathe in as you lower, and breathe out when you reach the bottom or reset.",
    tempo: "Lower slowly over about four seconds, with no drop at the bottom, then reset without rushing.",
    feel: {
      should: "In your chest, the fronts of your shoulders and the backs of your arms, resisting the descent.",
      shouldnt: "As a pinch at the front of your shoulder at the bottom, or an ache in your wrists."
    },
    mistakes: [
      { mistake: "You jump into an unstable support.",
        fix: "Step up into the support calmly, and check the bars don't move before you lower." },
      { mistake: "You lose control and drop at the bottom.",
        fix: "Stop higher, where you can still control the speed, and go deeper gradually." }
    ],
    safety: [
      "The bottom of a dip stretches the front of your shoulder; stay above the depth where it pinches.",
      "Stop at a sharp pain in your wrist, elbow or shoulder, and choose a comfortable push-up instead."
    ]
  };

  C.dip_alt_support = {
    summary: "A straight-arm hold on parallel bars with your shoulders pressed down, the base position for every dip.",
    prereq: [
      "You can bear your weight through straight arms with steady shoulders.",
      "Bars that are stable and low enough that you can step down safely."
    ],
    setup: [
      "Use parallel bars low enough to step down from, or put a stable step beside them.",
      "Take a straight-arm support with your hands beside your hips.",
      "Press down into the bars so your shoulders stay away from your ears.",
      "Rest your feet lightly on the floor if you need to take some weight off."
    ],
    steps: [
      "Press down through the bars until your elbows are straight.",
      "Keep your shoulders low, away from your ears, and your body still.",
      "Lock your elbows without collapsing into the joints.",
      "Hold, then step down to finish."
    ],
    breathing: "Breathe steadily through the hold; if you catch yourself holding your breath, step down.",
    tempo: "Get into the support smoothly, hold still without swinging, and step down gently at the end.",
    feel: {
      should: "In your shoulders as they push down and in the backs of your arms, with your stomach keeping your body steady.",
      shouldnt: "As shrugging into your ears, or an ache in your wrists or at the backs of your elbows."
    },
    mistakes: [
      { mistake: "You shrug up into your ears.",
        fix: "Push the bars down until there's a gap between your shoulders and your ears." },
      { mistake: "You hang on your joints at the end of their range.",
        fix: "Keep a light muscle effort in your arms and shoulders instead of relaxing into the joints." }
    ],
    safety: [
      "The wrists take the load; stop if they or your shoulders ache.",
      "Unload through your feet if your arms tire, and step down rather than dropping."
    ]
  };

  C.dip_alt_ringsupport = {
    summary: "A straight-arm support on rings, where the rings can move, so your shoulders and arms must work to hold still.",
    prereq: [
      "A comfortable support on parallel bars, held with straight arms and your shoulders low.",
      "You can steady rings that move under your hands.",
      "Rings hung from a point that holds your full weight without shifting."
    ],
    setup: [
      "Set the rings at equal height, with safe access to the floor or a step.",
      "Check the straps and the anchor before you put your weight on them.",
      "Take a straight-arm support with your hands beside your hips and the rings close to your body.",
      "Keep your feet lightly on the floor at first if you need to share the load."
    ],
    steps: [
      "Press down until your elbows are straight and your shoulders are low.",
      "Keep the rings close to your body and stop them drifting apart.",
      "Control any rotation, letting your hands turn out only as far as is comfortable.",
      "Hold still, then step down."
    ],
    breathing: "Breathe steadily through the hold; if you catch yourself holding your breath, step down.",
    tempo: "Move into the support smoothly, hold still as the rings settle, and step down gently.",
    feel: {
      should: "In your shoulders and the backs of your arms, with small corrections keeping the rings still.",
      shouldnt: "As rings drifting apart, or an ache in your wrists, elbows or the fronts of your shoulders."
    },
    mistakes: [
      { mistake: "You let the rings drift apart.",
        fix: "Squeeze the rings in toward your hips, and step down when you can't keep them there." },
      { mistake: "You force your hands to turn out.",
        fix: "Let them turn only as far as is comfortable, and keep the rings close to your body." }
    ],
    safety: [
      "Unstable rings load your shoulders and elbows from awkward angles; step down if control goes.",
      "Stop at pain in your wrists, elbows or shoulders."
    ]
  };
})();
