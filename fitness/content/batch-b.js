/* =====================================================================
   WELLNESS HUB · EXERCISE GUIDES · BATCH B — row, pull, squat, hinge, core
   ---------------------------------------------------------------------
   · The written guide for each exercise in the row, pull, squat, hinge
     and core slots (plan E2).
   · Schema and style rules: fitness/content/STYLE.md. Checked by
     tools/check-exercise-content.js.
   · No prescriptions here: rep ranges, hold times and when to step up
     come from training.js, never from this text.
   Public: window.EXERCISE_CONTENT[id], window.EXERCISE_CONTENT_BATCHES.b
   ===================================================================== */
(function () {
  "use strict";
  var C = window.EXERCISE_CONTENT = window.EXERCISE_CONTENT || {};
  var B = window.EXERCISE_CONTENT_BATCHES = window.EXERCISE_CONTENT_BATCHES || {};
  B.b = "complete";

  C.pull_4 = {
    summary: "A vertical pull from a dead hang until your chin clears the bar, the main bodyweight builder for your lats and upper back.",
    setup: [
      "Take an overhand grip, palms facing away, just wider than your shoulders.",
      "Hang with your arms straight and your feet off the floor, legs together and slightly in front of you.",
      "Brace your stomach and squeeze your glutes so your body doesn't swing."
    ],
    steps: [
      "Pull your shoulder blades down and back, lifting yourself slightly before your elbows bend.",
      "Drive your elbows down toward your back pockets and lead with your chest toward the bar.",
      "Finish with your chin over the bar, without craning your neck to get it there.",
      "Lower under control until your arms are straight again, keeping your shoulders active rather than hanging loose."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull up steadily, pause briefly at the top, and take about two seconds to lower to a straight-arm hang.",
    feel: {
      should: "In the sides of your back under your armpits and between your shoulder blades, with your biceps and grip helping.",
      shouldnt: "As a sharp pain on the inside of your elbow or at the top of your shoulder."
    },
    mistakes: [
      { mistake: "You swing or kick your legs to get past the hard part.",
        fix: "Squeeze your glutes and keep your legs still; a slower, smaller rep counts, a swung one doesn't." },
      { mistake: "You stop short at the bottom or the top, so each rep covers only the middle.",
        fix: "Start every rep from straight arms, and finish with your chin clearly over the bar." },
      { mistake: "You reach your chin forward to clear the bar.",
        fix: "Keep your neck long and pull your chest toward the bar instead." }
    ],
    safety: [
      "Always control the lowering; dropping into a hang is hard on the elbow tendons.",
      "Stop if you feel a sharp pain on the inside of the elbow or in the shoulder, and get a persistent one looked at."
    ]
  };

  C.pull_alt_tabledoor = {
    summary: "A row lying under a sturdy table or holding a braced door edge, so you can train your upper back without a bar.",
    setup: [
      "Use only a heavy table that won't tip, or a solid door opened fully and braced on its hinge side.",
      "Lie under the table edge, or stand close to the door edge, and grip it with both hands, shoulder-width apart.",
      "Straighten your body from shoulders to heels with your heels on the floor; bend your knees to make it easier."
    ],
    steps: [
      "Squeeze your shoulder blades together before your arms bend.",
      "Pull your chest up toward the edge, keeping your elbows close to your sides.",
      "Pause with your chest near the edge and your shoulder blades pinched.",
      "Lower with control until your arms are straight, keeping your body in one line."
    ],
    breathing: "Breathe out as you pull up, and in as you lower.",
    tempo: "Pull up steadily, hold the top for a moment, and lower over about two seconds.",
    feel: {
      should: "Between and around your shoulder blades, with your biceps and grip helping.",
      shouldnt: "In your lower back, which means your hips are sagging, or in your neck."
    },
    mistakes: [
      { mistake: "You use a light table or an unbraced door, which shifts as you pull.",
        fix: "Test the table or door with your full weight first, and use something heavier if it moves at all." },
      { mistake: "Your hips sag so only your chest moves.",
        fix: "Squeeze your glutes and pull your whole straight body up together." }
    ],
    safety: [
      "Stop at once if the table or door moves under you.",
      "Keep your neck in line with your body rather than reaching your chin toward the edge."
    ],
    variations: {
      alternatives: [
        { id: "pull_alt_towel", text: "If no table or door edge is safe to grip, a strong towel looped round a securely latched door handle does the same job." }
      ]
    }
  };

  C.squat_1 = {
    summary: "Sitting down and standing back up between your feet, the base pattern for every leg exercise that follows it.",
    setup: [
      "Stand with your feet about shoulder-width apart, toes turned out slightly.",
      "Spread your weight across your whole foot, so your heels, big toes and little toes all press down.",
      "Brace your stomach and hold your arms out in front of you for balance."
    ],
    steps: [
      "Sit your hips back and down, as if onto a low chair behind you.",
      "Push your knees outward so they stay in line with your toes.",
      "Go down until your hip crease is at least level with your knees, heels flat.",
      "Stand up by pushing the floor away, and finish tall with your glutes squeezed."
    ],
    breathing: "Breathe in and brace at the top, hold the brace on the way down, and breathe out as you stand.",
    tempo: "Lower over about two seconds, turn around at the bottom without collapsing into it, and stand up smoothly.",
    feel: {
      should: "In the fronts of your thighs and your glutes.",
      shouldnt: "As a pinch inside the knee or the front of the hip, or in your lower back."
    },
    mistakes: [
      { mistake: "Your knees cave in toward each other as you stand up.",
        fix: "Push your knees out over your toes all the way up, as if spreading the floor apart with your feet." },
      { mistake: "Your heels lift or your weight rolls onto your toes.",
        fix: "Keep your weight mid-foot and sit your hips back further; a slightly wider stance can help." },
      { mistake: "Your lower back rounds at the bottom.",
        fix: "Stop just above the depth where it rounds, and keep your chest up and your brace tight." }
    ],
    safety: [
      "Stop if a knee hurts rather than just working hard, and try a shallower depth before trying again."
    ],
    variations: {
      alternatives: [
        { id: "squat_alt_narrow", text: "Feet hip-width or closer, for a swap that asks more of your balance and control." }
      ]
    }
  };

  C.squat_3 = {
    summary: "A split squat with your rear foot raised on a bench, so your front leg lifts most of your bodyweight on its own.",
    setup: [
      "Stand about a stride in front of a bench, facing away from it.",
      "Reach one foot back and rest its top or toes on the bench.",
      "Shuffle your front foot forward until, at the bottom, your front shin would be close to vertical.",
      "Brace your stomach and lean your chest slightly forward."
    ],
    steps: [
      "Lower straight down by bending your front knee, keeping most of your weight on your front foot.",
      "Let your back knee drop toward the floor until it nearly touches.",
      "Keep your front knee over your toes, not caving inward.",
      "Push through your front heel to stand, then finish all the reps on that leg before switching."
    ],
    breathing: "Breathe in at the top, hold your brace as you lower, and breathe out as you stand.",
    tempo: "Lower over about two seconds, pause just above the floor, and stand up smoothly.",
    feel: {
      should: "In the front thigh and glute of the front leg, with a stretch at the front of the back hip.",
      shouldnt: "As a pinch in the front knee, or as strain in the back leg's knee or foot."
    },
    mistakes: [
      { mistake: "Your front knee caves inward as you stand.",
        fix: "Push the knee out over your little toes and slow the rep down." },
      { mistake: "You push off the back foot, so the bench leg does the work.",
        fix: "Keep the back foot light; you should be able to wiggle its toes at the bottom." },
      { mistake: "Your front foot is too close to the bench, so your heel lifts at the bottom.",
        fix: "Move your front foot further forward until your heel stays down." }
    ],
    safety: [
      "Stop if the front knee feels pinchy, and shorten the range before trying again.",
      "If balance is the limit, hold a wall or a chair with one hand; the legs still do the work."
    ]
  };

  C.hinge_2 = {
    summary: "Driving your hips up with your upper back on a bench, the most direct bodyweight exercise for your glutes.",
    setup: [
      "Sit on the floor with the bottom of your shoulder blades against the edge of a stable bench.",
      "Plant your feet flat, hip-width apart, close enough that your shins will be vertical at the top.",
      "Tuck your chin and bring your ribs down, so your spine stays neutral."
    ],
    steps: [
      "Push through your heels and drive your hips up.",
      "Rise until your body is flat from shoulders to knees, parallel to the floor.",
      "Squeeze your glutes hard at the top for a moment without arching your back.",
      "Lower your hips under control until they nearly touch the floor."
    ],
    breathing: "Breathe out as you drive up, and in as you lower.",
    tempo: "Drive up firmly, hold the top for a moment, and lower over about two seconds.",
    feel: {
      should: "In your glutes, with your hamstrings helping.",
      shouldnt: "In your lower back, which means you are arching instead of finishing with your hips, or in your neck."
    },
    mistakes: [
      { mistake: "You arch your lower back to get your hips higher.",
        fix: "Keep your chin tucked and your ribs down; stop when your body is flat." },
      { mistake: "Your knees cave inward on the way up.",
        fix: "Push your knees out slightly, in line with your feet, throughout the rep." },
      { mistake: "Your feet are too far away, so you feel it mostly in your hamstrings.",
        fix: "Walk your feet in until your shins are vertical at the top." }
    ],
    safety: [
      "Use a bench or sofa that won't slide, and keep your chin tucked so the neck isn't loaded."
    ]
  };

  C.hinge_4 = {
    summary: "Kneeling with your ankles anchored and lowering yourself forward as slowly as you can, one of the hardest bodyweight hamstring exercises.",
    setup: [
      "Kneel on a mat or folded towel, with your ankles anchored under a heavy sofa or held by a partner.",
      "Straighten your hips so your body is one line from knees to head.",
      "Hold your hands in front of your chest, ready to catch yourself."
    ],
    steps: [
      "Begin lowering forward from your knees, keeping your hips straight.",
      "Resist the fall with your hamstrings for as long as you can.",
      "When you can no longer hold it, catch yourself with your hands, as in the bottom of a push-up.",
      "Push yourself back up with your hands and return to kneeling for the next rep."
    ],
    breathing: "Breathe in at the top, brace and breathe steadily as you lower, and breathe out as you push back up.",
    tempo: "Lower as slowly as you can control; the lowering is the exercise, and the return is only a reset.",
    feel: {
      should: "In the backs of your thighs, working hard the whole way down.",
      shouldnt: "As a sudden sharp pain in the back of the thigh, or in your knees from the floor."
    },
    mistakes: [
      { mistake: "You bend at the hips to shorten the lever.",
        fix: "Squeeze your glutes and keep your body straight from knees to head." },
      { mistake: "You drop quickly once your hamstrings start to give.",
        fix: "Stop the rep earlier with your hands, at the point where you can still resist." }
    ],
    safety: [
      "This is very demanding on the hamstrings: start with a high catch point and expect soreness after the first sessions.",
      "Stop at once if you feel a sharp or pulling pain in the back of the thigh.",
      "Pad your knees, and make sure your anchor can't lift or slide."
    ]
  };

  C.core_1 = {
    summary: "Holding a straight line on your forearms and toes, which trains your stomach to resist sagging under your bodyweight.",
    setup: [
      "Place your forearms on the floor with your elbows under your shoulders.",
      "Step your feet back until your body is straight from ears to heels.",
      "Tilt your pelvis under slightly, as if pulling your belt buckle toward your chin, and squeeze your glutes.",
      "Push the floor away with your forearms so your upper back stays broad."
    ],
    steps: [
      "Brace your stomach before your knees leave the floor.",
      "Hold the line still, with your hips level with your shoulders.",
      "Keep your gaze on the floor just ahead of your hands, neck long.",
      "End the hold by lowering your knees to the floor, not by letting your hips drop."
    ],
    breathing: "Breathe shallowly and steadily through the whole hold without letting go of your brace; never hold your breath.",
    tempo: "There's no movement: set the position, then hold it still until the end of the set.",
    feel: {
      should: "Across your stomach, with your glutes and shoulders working to keep you straight.",
      shouldnt: "In your lower back, which means your hips are sagging."
    },
    mistakes: [
      { mistake: "Your hips sag toward the floor or pike up toward the ceiling.",
        fix: "Squeeze your glutes harder and check the line in a mirror or a photo." },
      { mistake: "You hold your breath, then lose the brace when you gasp.",
        fix: "Take short, steady breaths through your nose while keeping your stomach tight." }
    ],
    safety: [
      "If your lower back aches, tuck your pelvis harder; if it still aches, end the hold there.",
      "Stop if your shoulders or elbows hurt rather than your stomach working hard."
    ]
  };

  C.hinge_e2_rdl = {
    summary: "A hip hinge with a dumbbell in each hand, lowered down your legs to a hamstring stretch and back, which loads your hamstrings and glutes through a long range.",
    setup: [
      "Stand with your feet hip-width apart, a dumbbell in each hand in front of your thighs.",
      "Soften your knees slightly and keep that bend fixed throughout.",
      "Pull your shoulders back and brace your stomach so your back is flat."
    ],
    steps: [
      "Push your hips back, as if closing a car door with your backside.",
      "Let the dumbbells slide down the front of your legs, staying close to them.",
      "Stop when you feel a strong stretch in your hamstrings, or when your back would start to round.",
      "Drive your hips forward to stand tall, squeezing your glutes at the top."
    ],
    breathing: "Breathe in and brace at the top, hold it on the way down, and breathe out as you stand.",
    tempo: "Lower over about two to three seconds to the stretch, then stand up smoothly.",
    feel: {
      should: "In the backs of your thighs as a stretch on the way down, and in your glutes as you stand.",
      shouldnt: "In your lower back, which means it is rounding or doing the lifting."
    },
    mistakes: [
      { mistake: "Your back rounds as the dumbbells go down.",
        fix: "Stop higher, at the point where your back is still flat, and push your hips further back." },
      { mistake: "You bend your knees more and turn it into a squat.",
        fix: "Fix the slight knee bend at the start and move only at the hips." },
      { mistake: "The dumbbells drift forward, away from your legs.",
        fix: "Keep them brushing your thighs and shins the whole way." }
    ],
    safety: [
      "Keep the weights close and your back flat; stop if your lower back hurts rather than just working.",
      "Start with a weight you can lower with a flat back on every rep, not the heaviest you can lift."
    ],
    variations: {
      alternatives: [
        { id: "acc_hamstring_slrdldb", text: "One leg at a time with a single dumbbell, for the same hinge with a lighter weight and a balance challenge." }
      ]
    }
  };

  /* ---- row ---- */

  C.pull_alt_towel = {
    summary: "A row with a towel looped round a latched door handle, for training your upper back when you have no bar or table.",
    setup: [
      "Use a strong towel and a door that opens away from you, so your pull presses it into its frame.",
      "Close the door until the latch clicks, loop the towel round the handle and hold both ends.",
      "Stand close, feet about shoulder-width apart, and lean back until your arms are straight.",
      "Hold your body in one straight line from head to heels, with your stomach braced."
    ],
    steps: [
      "Squeeze your shoulder blades back and down before your elbows bend.",
      "Drive your elbows back and pull your chest toward the door.",
      "Pause with your hands beside your ribs and your shoulder blades pinched.",
      "Lean back under control until your arms are straight again."
    ],
    breathing: "Breathe out as you pull in, and breathe in as you lean back out.",
    tempo: "Pull steadily, pause at the top, and take about two seconds to lean back.",
    feel: {
      should: "Between and behind your shoulder blades, with your biceps and grip helping.",
      shouldnt: "In your lower back, which means your hips are bending, or as a sharp pain at the front of your shoulders."
    },
    mistakes: [
      { mistake: "You use a thin towel or a door that isn't latched, so something gives mid-rep.",
        fix: "Lean back slowly with your full weight before the first rep, and swap the towel or door if either shifts." },
      { mistake: "You bend at the hips instead of keeping one straight line.",
        fix: "Squeeze your glutes and brace your stomach so your body moves as one piece." }
    ],
    safety: [
      "Check the towel and the latch every session, and stop at once if the towel frays or the door moves.",
      "Lean back gradually on your first rep, so a failure drops you gently instead of suddenly."
    ],
    variations: {
      alternatives: [
        { id: "pull_alt_tabledoor", text: "A heavy table or a braced door edge gives the same pull with a firmer grip, if you have one that is safe." }
      ]
    }
  };

  C.pull_alt_australian = {
    summary: "A row lying under a bar at about hip height, with your body straight, which you can make easier or harder by changing your angle.",
    setup: [
      "Set a bar or a pair of rings at about hip height, secure enough to take your full weight.",
      "Lie underneath, grip shoulder-width, and hang with your arms straight and your heels on the floor.",
      "Squeeze your glutes and brace your stomach so you are one straight line from ears to heels.",
      "Bend your knees or stand more upright to make it easier; the flatter you lie, the harder it gets."
    ],
    steps: [
      "Pull your shoulder blades back and down before your elbows bend.",
      "Drive your elbows down and back, bringing your chest up to the bar.",
      "Pause with your chest at or near the bar and your body still straight.",
      "Lower with control until your arms are straight, without letting your hips sag."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull up smoothly, pause briefly at the top, and lower over about two seconds.",
    feel: {
      should: "Across your upper back and the backs of your shoulders, with your biceps and grip helping.",
      shouldnt: "In your lower back, which means your hips are sagging, or in your neck."
    },
    mistakes: [
      { mistake: "Your hips sag so your body bends in the middle.",
        fix: "Squeeze your glutes and keep your ribs down so you stay a straight plank." },
      { mistake: "You shrug toward your ears instead of leading with your shoulder blades.",
        fix: "Draw your shoulder blades down and back first, then bend your elbows." }
    ],
    safety: [
      "Test that the bar or rings can't roll, slide or tip before you hang under them.",
      "Keep your neck in line with your body, looking up at the bar without pushing your chin out."
    ],
    variations: {
      alternatives: [
        { id: "pull_alt_tabledoor", text: "With no bar or rings, a heavy table or a braced door edge gives a similar row." }
      ]
    }
  };

  C.pull_alt_row = {
    summary: "A two-dumbbell row from a hip hinge, working your lats and upper back while your lower back holds a flat position.",
    setup: [
      "Stand with your feet hip-width apart, a dumbbell in each hand, and soften your knees.",
      "Push your hips back and lean forward until your torso is well forward of upright, back flat.",
      "Let the dumbbells hang straight down beneath your shoulders and brace your stomach."
    ],
    steps: [
      "Pull your shoulder blades back, then row both elbows toward your hips.",
      "Squeeze your back at the top, with the dumbbells beside your lower ribs.",
      "Lower slowly until your arms are straight and you feel a stretch across your back.",
      "Keep your torso angle fixed the whole time; only your arms and shoulder blades move."
    ],
    breathing: "Breathe in and brace before each rep, and breathe out as you row up.",
    tempo: "Row up with a firm pull, pause briefly at the top, and lower over about two seconds.",
    feel: {
      should: "In your lats and between your shoulder blades, with your biceps helping.",
      shouldnt: "As strain in your lower back, which means it is rounding or doing the lifting."
    },
    mistakes: [
      { mistake: "You heave the weights up by swinging your torso.",
        fix: "Keep your torso still and use a lighter weight; if you can't, the weight is too heavy." },
      { mistake: "You stand too upright, so the rep turns into a shrug.",
        fix: "Hinge further, hips back, until the dumbbells hang beneath your shoulders." },
      { mistake: "Your back rounds as you lower the weights.",
        fix: "Stop the lowering where your back is still flat." }
    ],
    safety: [
      "Keep your back flat and braced throughout, and stop if your lower back hurts rather than just tiring.",
      "Choose a weight you can row without swinging, not the heaviest you can lift."
    ],
    variations: {
      alternatives: [
        { id: "pull_e2_dbrow", text: "One arm at a time with your other hand on a bench, which supports your back and lets you focus on one side." }
      ]
    }
  };

  C.pull_e2_dbrow = {
    summary: "A one-arm dumbbell row with a knee and a hand on a bench, working one side of your upper back at a time.",
    setup: [
      "Rest one knee and the same-side hand on a bench, with your other foot planted on the floor.",
      "Set your back flat and your hips square to the floor.",
      "Let the dumbbell hang straight down from your shoulder in your free hand."
    ],
    steps: [
      "Pull your shoulder blade back and down first.",
      "Row your elbow toward your hip, keeping your arm close to your side.",
      "Squeeze your back at the top, then lower until your arm is straight and your lat stretches.",
      "Finish all the reps on one side before switching."
    ],
    breathing: "Breathe out as you row up, and breathe in as you lower.",
    tempo: "Row smoothly, pause briefly at the top, and lower over about two seconds.",
    feel: {
      should: "In the side of your back under your armpit, with your biceps helping.",
      shouldnt: "In your lower back, or as a twist through your torso."
    },
    mistakes: [
      { mistake: "You yank the weight up and twist your torso to get it there.",
        fix: "Square your hips and shoulders to the floor and use a lighter weight." },
      { mistake: "You row up toward your shoulder, which turns it into a shrug.",
        fix: "Aim your elbow at your hip, as if putting the dumbbell in your back pocket." }
    ],
    safety: [
      "Brace your stomach so your lower back stays flat, and stop if it hurts rather than just working.",
      "Check the bench can't slide or tip before you lean on it."
    ],
    variations: {
      alternatives: [
        { id: "pull_alt_row", text: "Without a bench, rowing with both dumbbells from a hip hinge trains the same muscles." }
      ]
    }
  };

  C.skill_frontlever_1 = {
    summary: "A hanging hold with your knees tucked and your back horizontal, the first step toward the front lever and a hard test of your lats.",
    setup: [
      "Hang from a bar or rings with an overhand grip and your arms straight.",
      "Warm up your shoulders and elbows with easy hangs and pulls before you try the hold.",
      "Pull your shoulder blades down and back so you aren't hanging loose."
    ],
    steps: [
      "Tuck your knees tight to your chest.",
      "Lift your hips until your back is horizontal and your body faces the ceiling.",
      "Hold with your arms locked straight and your shoulders pulled down.",
      "Lower your legs and hips under control to finish."
    ],
    breathing: "Breathe in short, steady breaths through the hold; if you can't breathe, come down.",
    tempo: "Rise into the position slowly, hold it still, and lower out of it over a few seconds.",
    feel: {
      should: "Through your lats and your stomach, with your arms straight and your grip tight.",
      shouldnt: "As a sharp pain at your elbows or the tops of your shoulders."
    },
    mistakes: [
      { mistake: "You bend your elbows to pull yourself into position.",
        fix: "Lock your elbows; if you can't reach horizontal with straight arms, go back to easier hangs and pulls." },
      { mistake: "Your shoulders shrug up toward your ears.",
        fix: "Push your shoulders down away from your ears before you lift." }
    ],
    safety: [
      "Straight-arm holds load your elbows and biceps tendons heavily, so build up gradually and warm up first.",
      "Get comfortable with hangs and shoulder-blade pulls before you try this.",
      "Stop if you feel a sharp pain in your elbows or the front of your shoulders."
    ]
  };

  C.skill_frontlever_2 = {
    summary: "A front lever hold with your hips opened and your knees still bent, which lengthens the lever and asks more of your lats than the tuck.",
    setup: [
      "Hang from a bar or rings with an overhand grip and your arms straight.",
      "Warm up your shoulders and elbows first, and get into a tuck front lever.",
      "Pull your shoulder blades down and back and lock your elbows."
    ],
    steps: [
      "From the tuck, open your hips until your back and thighs form a flat line.",
      "Keep your knees bent, moving them away from your chest.",
      "Hold with your body horizontal, facing up, and your arms straight.",
      "Close back into the tuck, then lower under control."
    ],
    breathing: "Breathe in short, steady breaths through the hold; if you can't breathe, come down.",
    tempo: "Open your hips slowly, hold still, and close back into the tuck smoothly.",
    feel: {
      should: "Through your lats and your stomach, with your glutes squeezing to hold the line.",
      shouldnt: "As a sharp pain at your elbows, or in your lower back."
    },
    mistakes: [
      { mistake: "Your hips pike up to make the hold lighter.",
        fix: "Keep your hips level with your shoulders, even if that means a smaller shape." },
      { mistake: "Your chest drops because your lats lose tension.",
        fix: "Push your shoulders down and pull the bar toward your hips; go back to the tuck if you can't." }
    ],
    safety: [
      "Move on gradually from the tuck; the extra lever length puts more load on your elbows and shoulders.",
      "Stop if you feel a sharp or pulling pain in your elbows or shoulders."
    ]
  };

  C.skill_frontlever_3 = {
    summary: "A front lever hold with both legs extended in a wide straddle, which shortens the lever compared with the full version.",
    setup: [
      "Hang from a bar or rings with an overhand grip and your arms straight.",
      "Warm up your shoulders and elbows first, and get into an advanced tuck.",
      "Pull your shoulder blades down and back and lock your elbows."
    ],
    steps: [
      "From the advanced tuck, extend both legs out into a wide straddle, toes pointed.",
      "Keep your hips level with your shoulders and your body horizontal.",
      "Hold with your arms straight and your lats and stomach tight.",
      "Bring your legs back in to finish, then lower under control."
    ],
    breathing: "Breathe in short, steady breaths through the hold; if you can't breathe, come down.",
    tempo: "Extend your legs slowly, hold still, and bring them back in under control.",
    feel: {
      should: "Through your lats, stomach and glutes, working to hold the line.",
      shouldnt: "As a sharp pain at your elbows or shoulders, or in your lower back."
    },
    mistakes: [
      { mistake: "Your hips sag below your shoulders.",
        fix: "Squeeze your glutes and push your shoulders down; bring your legs closer in if you can't keep your hips up." },
      { mistake: "You bend your arms to hold the line.",
        fix: "Lock your elbows; if they bend, go back to an easier shape." }
    ],
    safety: [
      "Keep your elbows straight but don't force them back past straight.",
      "Progress gradually, and stop at a sharp or pulling pain in your elbows or shoulders."
    ]
  };

  C.skill_frontlever_4 = {
    summary: "A front lever with your legs together and your whole body horizontal under the bar, held by straight-arm strength alone.",
    setup: [
      "Hang from a bar or rings with an overhand grip and your arms straight.",
      "Warm up your shoulders, elbows and wrists thoroughly; don't attempt this cold.",
      "Pull your shoulder blades down and back and lock your elbows."
    ],
    steps: [
      "From a straddle front lever, bring your legs together.",
      "Hold your whole body in one rigid horizontal line, facing the ceiling.",
      "Squeeze your glutes, stomach and legs to keep the line.",
      "Lower under control to finish, without dropping."
    ],
    breathing: "Breathe in short, steady breaths through the hold; if you can't breathe, come down.",
    tempo: "Bring your legs together slowly, hold still, and lower out of it with control.",
    feel: {
      should: "Through your lats and your whole trunk, with your arms straight and your grip tight.",
      shouldnt: "As a sharp pain at your elbows or shoulders, or as a sag at your hips."
    },
    mistakes: [
      { mistake: "Your hips sag, which breaks the lever.",
        fix: "Squeeze your glutes and push your shoulders down; go back to the straddle if you can't hold the line." },
      { mistake: "You bend your arms to pull yourself into position.",
        fix: "Lock your elbows and build the position from straight-arm strength." }
    ],
    safety: [
      "This needs resilient shoulders and elbows; never grind through it cold.",
      "Stop at a sharp or pulling pain in your elbows or shoulders, and get a persistent one looked at."
    ]
  };

  /* ---- pull ---- */

  C.pull_1 = {
    summary: "Hanging from a bar with active shoulders, which builds grip endurance and the shoulder control that every later pull needs.",
    setup: [
      "Take a full overhand grip on the bar, slightly wider than your shoulders.",
      "Step up to the bar or use a box, so you don't have to jump into it.",
      "Hang with your arms straight, then brace your stomach and squeeze your glutes so you don't swing."
    ],
    steps: [
      "Lift your feet off the floor with your arms straight.",
      "Draw your shoulders slightly down, away from your ears, so they are engaged rather than slack.",
      "Hang still with your body in one long line.",
      "Step back down to the floor to finish, rather than dropping."
    ],
    breathing: "Breathe slowly and steadily through the hold, keeping your stomach braced as you breathe.",
    tempo: "There's no movement: set your shoulders, then hang still until the end of the hold.",
    feel: {
      should: "In your forearms and grip, with a stretch along the sides of your back.",
      shouldnt: "As a sharp pain in your elbows or the tops of your shoulders."
    },
    mistakes: [
      { mistake: "You hang with your shoulders shrugged up around your ears, completely slack.",
        fix: "Pull your shoulder blades gently down, so the hang is active rather than limp." },
      { mistake: "You swing or kick to stretch out the hold.",
        fix: "Squeeze your glutes and brace your stomach to stay still." }
    ],
    safety: [
      "Build your grip gradually, because forearm and elbow tendons take time to adapt.",
      "Step down before your grip fails, so you land under control instead of falling."
    ],
    variations: {
      alternatives: [
        { id: "pull_alt_passivehang", text: "A relaxed hang with loose shoulders, if you want to get used to the bar first." }
      ]
    }
  };

  C.pull_2 = {
    summary: "A hang where you lift yourself a few centimetres using only your shoulder blades, building the control that starts every pull-up.",
    setup: [
      "Take an overhand grip just wider than your shoulders and hang with your arms straight.",
      "Start in an active hang, with your shoulders slightly down and your stomach braced."
    ],
    steps: [
      "Without bending your elbows, pull your shoulder blades down and together.",
      "Let your body rise a few centimetres as they move.",
      "Pause at the top with your arms still straight.",
      "Let your shoulder blades rise back to the active hang under control."
    ],
    breathing: "Breathe out as you pull your shoulder blades down, and breathe in as they rise.",
    tempo: "Move slowly and deliberately: pull down, pause, then return over about two seconds.",
    feel: {
      should: "Under your armpits and in the muscles between and below your shoulder blades.",
      shouldnt: "In your elbows, which means your arms are bending, or as a pinch at the top of your shoulder."
    },
    mistakes: [
      { mistake: "Your elbows bend, so it turns into a small pull-up.",
        fix: "Keep your arms locked straight and move only your shoulder blades." },
      { mistake: "You rush and bounce out of the bottom.",
        fix: "Pause at the top and return slowly, so your shoulders do the work rather than momentum." }
    ],
    safety: [
      "Keep some tension in your shoulders at the bottom, rather than dropping into a slack hang."
    ]
  };

  C.pull_3 = {
    summary: "Starting with your chin over the bar and lowering yourself as slowly as you can, which builds the strength to pull yourself up.",
    setup: [
      "Place a box or sturdy chair under the bar, or be able to jump up to the top position.",
      "Take an overhand grip just wider than your shoulders.",
      "Start at the top with your chin over the bar, legs together and stomach braced."
    ],
    steps: [
      "Hold the top position with your shoulders pulled down.",
      "Lower yourself as slowly as you can, keeping your body still.",
      "Keep control all the way down to a straight-arm hang, without swinging.",
      "Step or jump back to the top to start the next rep."
    ],
    breathing: "Breathe in at the top, breathe steadily as you lower, and breathe out as you reset.",
    tempo: "The lowering is the exercise, so take as long as you can control, and treat the climb back up as a reset.",
    feel: {
      should: "In your lats, the backs of your shoulders and your biceps, working hard as you resist the drop.",
      shouldnt: "As a sharp pain on the inside of your elbow, or as a sudden drop at the bottom."
    },
    mistakes: [
      { mistake: "You drop fast instead of resisting the descent.",
        fix: "End the rep at the point where you can still slow it, and aim to lengthen it over time." },
      { mistake: "Your shoulders switch off and slump at the bottom.",
        fix: "Keep your shoulder blades pulled down until your arms are nearly straight." }
    ],
    safety: [
      "Don't relax at the bottom: keep some tension so the weight doesn't land on your shoulder joints.",
      "Lowering loads your elbow tendons heavily, so stop if the inside of your elbow gives a sharp pain."
    ]
  };

  C.pull_alt_bandassist = {
    summary: "A pull-up with a resistance band looped over the bar to help you out of the bottom, so you can practise the full range.",
    setup: [
      "Loop a strong band over the bar and check that it is firmly hooked before you put weight in it.",
      "Choose the lightest band that still lets you finish the movement with good form.",
      "Place a foot or knee in the loop, take an overhand grip just wider than your shoulders and hang with straight arms."
    ],
    steps: [
      "Pull your shoulder blades down and back.",
      "Drive your elbows toward your back pockets and lead with your chest toward the bar.",
      "Finish with your chin over the bar.",
      "Lower under control to a straight-arm hang, resisting the band's pull as you go."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull up steadily, pause at the top, and lower over about two seconds without letting the band bounce you.",
    feel: {
      should: "In the sides of your back and between your shoulder blades, with your biceps helping.",
      shouldnt: "As a sharp pain at the inside of your elbow or at the top of your shoulder."
    },
    mistakes: [
      { mistake: "You use a band so thick that it does most of the work.",
        fix: "Switch to the lightest band that still lets you finish the rep with good form." },
      { mistake: "You bounce out of the bottom on the band's recoil.",
        fix: "Start each rep from a still hang and begin pulling before the band does." }
    ],
    safety: [
      "Check the band for cracks or wear before every session, because a snapped band can hit you.",
      "Control the lowering; the band makes it tempting to drop fast."
    ]
  };

  C.pull_5 = {
    summary: "A pull-up with your palms facing you, which brings your biceps in more alongside your back.",
    setup: [
      "Take an underhand grip, palms facing you, about shoulder-width apart.",
      "Hang with your arms straight and your feet off the floor.",
      "Brace your stomach and squeeze your glutes so you don't swing."
    ],
    steps: [
      "Pull your shoulder blades down and back to start the rep.",
      "Pull your elbows down toward your ribs and bring your chest toward the bar.",
      "Finish with your chin over the bar and your neck long.",
      "Lower under control to straight arms."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull up steadily, pause briefly at the top, and lower over about two seconds.",
    feel: {
      should: "In your biceps and the sides of your back.",
      shouldnt: "As a sharp pain on the inside of your elbow, or in your wrists."
    },
    mistakes: [
      { mistake: "Your elbows drift forward, so your back stops contributing.",
        fix: "Think of pulling your elbows down and back to your ribs." },
      { mistake: "You cut the bottom short and never reach straight arms.",
        fix: "Start every rep from straight arms." }
    ],
    safety: [
      "The underhand grip loads the inside of your elbow more than an overhand one, so stop at a sharp pain there.",
      "Lower with control instead of dropping."
    ]
  };

  C.pull_6 = {
    summary: "A wide pull-up where you pull toward one hand while the other arm stays straight, loading one side at a time.",
    setup: [
      "Take a wide overhand grip, well outside your shoulders.",
      "Hang with your shoulders pulled down and your stomach braced.",
      "Choose which hand you will pull toward first, and alternate sides each rep."
    ],
    steps: [
      "Pull your shoulder blades down, then pull your chin up toward one hand.",
      "Keep the opposite arm straight, using it as a guide rather than a second puller.",
      "Return to the centre with control, then lower to straight arms.",
      "Repeat toward the other hand."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull steadily toward one hand, pause at the top, and lower over about two seconds.",
    feel: {
      should: "Mostly in the working side's back and biceps, with a stretch along the straight arm's side.",
      shouldnt: "As a sharp pain in either shoulder, or a pinch at the top of the working one."
    },
    mistakes: [
      { mistake: "You bend the guide arm, so both arms share the load.",
        fix: "Keep it locked straight and let your hand slide, or use a slightly narrower grip." },
      { mistake: "You shrug the working shoulder up toward your ear.",
        fix: "Push that shoulder down away from your ear before the pull." }
    ],
    safety: [
      "A one-sided pull loads one shoulder heavily, so stop at any sharp joint pain.",
      "Warm up your shoulders with easier pulls first."
    ]
  };

  C.pull_alt_passivehang = {
    summary: "A relaxed hang with straight arms and loose shoulders, a gentle way to build grip and get used to the bar.",
    setup: [
      "Take a full overhand grip on the bar, slightly wider than your shoulders.",
      "Step up to the bar or use a box, so you don't have to jump into it.",
      "Hang with your arms straight and let your body relax, with your shoulders rising toward your ears."
    ],
    steps: [
      "Let the tension out of your shoulders and hang long.",
      "Breathe slowly and keep your body still, without swinging.",
      "Hold still until the end of the hold, then step down before your grip fails."
    ],
    breathing: "Breathe slowly through your nose and let your ribs soften as you hang.",
    tempo: "There's no movement: let yourself hang still and loose until the end of the hold.",
    feel: {
      should: "In your forearms and grip, with a stretch through your shoulders and the sides of your back.",
      shouldnt: "As a pinch in the tops of your shoulders, or a sharp pain in your elbows."
    },
    mistakes: [
      { mistake: "You grip nervously and tense your whole body.",
        fix: "Relax your jaw and shoulders and breathe out slowly, keeping the tension only in your hands." },
      { mistake: "You swing around instead of hanging still.",
        fix: "Lower your feet close to the floor and squeeze your glutes lightly to steady yourself." }
    ],
    safety: [
      "Back off if your shoulders feel unstable rather than just stretched.",
      "Step down before your grip fails, so you land under control."
    ]
  };

  /* ---- squat ---- */

  C.squat_2 = {
    summary: "A bodyweight squat where you hold the bottom position before standing, building control in the hardest part of the rep.",
    setup: [
      "Stand with your feet about shoulder-width apart, toes turned out slightly.",
      "Spread your weight across your whole foot and brace your stomach.",
      "Hold your arms out in front of you for balance."
    ],
    steps: [
      "Sit your hips back and down, pushing your knees out over your toes.",
      "Go to full depth, keeping your heels flat and your chest up.",
      "Pause at the bottom, staying tight instead of relaxing into your hips.",
      "Stand up by pushing the floor away."
    ],
    breathing: "Breathe in and brace on the way down, hold the brace through the pause, and breathe out as you stand.",
    tempo: "Lower over about two seconds, hold the bottom still without bouncing, then stand up firmly.",
    feel: {
      should: "In your thighs and glutes, working throughout the pause.",
      shouldnt: "As a pinch in your knees or the fronts of your hips, or as your lower back rounding."
    },
    mistakes: [
      { mistake: "You relax or bounce in the bottom instead of holding tension.",
        fix: "Keep your stomach braced and your knees pushed out for the whole pause." },
      { mistake: "Your chest falls forward during the pause.",
        fix: "Keep your chest up and your eyes ahead; shorten the pause if you can't." }
    ],
    safety: [
      "Stop if a knee hurts rather than just working hard, and use a shallower depth before trying again."
    ]
  };

  C.squat_split = {
    summary: "A lunge-style squat where your back knee drops straight down, training one leg at a time without a bench.",
    setup: [
      "Stand in a long stride with your front foot flat and your back heel lifted.",
      "Keep your feet hip-width apart rather than on a tightrope line, so you can balance.",
      "Hold your torso tall and brace your stomach."
    ],
    steps: [
      "Drop your back knee straight down toward the floor.",
      "Stop when the knee hovers just above the ground and your front shin is near vertical.",
      "Drive through your whole front foot to stand.",
      "Finish all the reps on one leg before switching."
    ],
    breathing: "Breathe in at the top, hold your brace as you lower, and breathe out as you stand.",
    tempo: "Lower over about two seconds, pause just above the floor, and stand up smoothly.",
    feel: {
      should: "In the front thigh and glute, with a stretch at the front of the back hip.",
      shouldnt: "As a pinch in the front knee, or as strain in the back foot."
    },
    mistakes: [
      { mistake: "Your stride is too short, so your front knee shoves far past your toes.",
        fix: "Take a longer stride until your front shin is near vertical at the bottom." },
      { mistake: "You lean forward and your front heel lifts.",
        fix: "Keep your torso tall and press your whole front foot into the floor." },
      { mistake: "You push off the back leg to stand.",
        fix: "Treat the back leg as a kickstand and let the front leg do the lifting." }
    ],
    safety: [
      "If your front knee complains, lengthen the stride and shorten the depth.",
      "Rest a hand on a wall or chair if balance is the limit; the legs still do the work."
    ]
  };

  C.squat_4 = {
    summary: "A one-legged squat holding your rear foot behind you, lowering your rear knee toward the floor, which is very demanding on a single leg.",
    setup: [
      "Stand on one leg and bend the other knee, holding that foot behind you with the same-side hand.",
      "Put a folded towel or mat on the floor under your rear knee.",
      "Keep your chest up and your weight over the middle of your standing foot."
    ],
    steps: [
      "Sit back and down on your standing leg, lowering your rear knee toward the floor.",
      "Let your torso lean forward a little to stay balanced.",
      "Touch the rear knee lightly to the pad instead of dropping onto it.",
      "Drive through your standing foot to stand."
    ],
    breathing: "Breathe in as you lower, hold your brace at the bottom, and breathe out as you stand.",
    tempo: "Lower over about two seconds, touch the knee lightly, and stand up smoothly.",
    feel: {
      should: "In the thigh and glute of your standing leg.",
      shouldnt: "As a pinch in the standing knee, or as pressure from your rear knee hitting the floor."
    },
    mistakes: [
      { mistake: "You fall forward and lose your balance.",
        fix: "Keep your weight over your mid-foot, hold the rear foot close to your glute and sit back." },
      { mistake: "You slam your rear knee into the floor.",
        fix: "Lower more slowly and use a thicker pad, or stop just above the floor." }
    ],
    safety: [
      "Use a pad under the rear knee while you learn the movement.",
      "Stop at a sharp pain in the standing knee, and use a shallower depth before trying again."
    ]
  };

  C.squat_alt_assistedpistol = {
    summary: "A pistol squat where you hold a doorframe, pole or rings for just enough support, so you can practise the movement before doing it unaided.",
    setup: [
      "Hold a doorframe, pole or rings at about chest height with one or both hands.",
      "Stand on one leg with the other leg extended in front of you.",
      "Keep your standing heel flat and your stomach braced."
    ],
    steps: [
      "Sit straight down on the standing leg, reaching your free leg forward.",
      "Use your hands only as much as you need for balance, not to pull yourself up.",
      "Go as low as you can control, with your heel planted.",
      "Drive through your heel to stand, without touching your free foot down."
    ],
    breathing: "Breathe in as you lower, hold your brace at the bottom, and breathe out as you stand.",
    tempo: "Lower slowly, stay controlled at the bottom, and stand up smoothly without a bounce.",
    feel: {
      should: "In the thigh and glute of the standing leg, as a stretch at the back of your ankle.",
      shouldnt: "As a pinch in the front of the hip or knee."
    },
    mistakes: [
      { mistake: "You pull hard with your arms instead of letting your leg do the work.",
        fix: "Hold more lightly or use a lower support; if you're pulling up, your leg isn't doing the lifting." },
      { mistake: "Your standing heel lifts at the bottom.",
        fix: "Sit back further and stop at the depth where your heel stays down." }
    ],
    safety: [
      "Warm up your ankles and knees first.",
      "Stop at any sharp knee sensation."
    ]
  };

  C.squat_5 = {
    summary: "A full squat on one leg with the other held straight out in front, demanding balance, ankle flexibility and strength.",
    setup: [
      "Stand on one leg with the other leg extended straight out in front.",
      "Reach your arms forward as a counterbalance.",
      "Keep your standing foot flat and your chest up."
    ],
    steps: [
      "Sit all the way down on the standing leg, keeping your heel planted.",
      "Hold your free leg off the floor, arms reaching forward.",
      "Stay controlled at the bottom, without bouncing.",
      "Drive through your heel to stand, without touching your free foot down."
    ],
    breathing: "Breathe in as you lower, hold your brace at the bottom, and breathe out as you stand.",
    tempo: "Lower slowly with control, don't drop into the bottom, and stand up without using momentum.",
    feel: {
      should: "In the thigh and glute of the standing leg, and as a stretch at the back of your ankle.",
      shouldnt: "As a pinch in the front of your hip or knee."
    },
    mistakes: [
      { mistake: "Your standing heel lifts at the bottom.",
        fix: "Stop above the depth where your heel stays down, and work on ankle flexibility." },
      { mistake: "You collapse forward and bounce out of the bottom.",
        fix: "Slow the lowering and use your arms as a counterweight instead of using momentum." }
    ],
    safety: [
      "Warm up your ankles thoroughly first, because this needs a lot of ankle flexibility.",
      "Stop at a sharp knee pain, and use a shallower depth or some support."
    ]
  };

  C.squat_6 = {
    summary: "A pistol squat holding a dumbbell or kettlebell at your chest, adding load to a one-legged squat.",
    setup: [
      "Hold a dumbbell or kettlebell tight against your chest with both hands.",
      "Stand on one leg with the other extended in front of you.",
      "Keep your heel flat and your chest as tall as the weight allows."
    ],
    steps: [
      "Sit down on the standing leg, keeping the weight close to your chest.",
      "Control the lowering fully, without letting the weight pull you forward.",
      "Stay steady at the bottom with your heel planted.",
      "Drive through your heel to stand, without touching your free foot down."
    ],
    breathing: "Breathe in as you lower, hold your brace at the bottom, and breathe out as you stand.",
    tempo: "Lower slowly, stay controlled at the bottom, and stand up without using the weight's momentum.",
    feel: {
      should: "In the thigh and glute of the standing leg.",
      shouldnt: "As a pinch in the knee, or as your lower back rounding under the weight."
    },
    mistakes: [
      { mistake: "The weight pulls you off balance.",
        fix: "Hold it tight against your chest, and use a lighter weight." },
      { mistake: "You use the weight's momentum instead of leg strength.",
        fix: "Slow the lowering and pause briefly at the bottom before you stand." }
    ],
    safety: [
      "The added load magnifies any knee problem, so stop at the first sharp twinge.",
      "Make sure you can do a controlled pistol squat without weight first."
    ]
  };

  C.squat_alt_narrow = {
    summary: "A bodyweight squat with your feet close together, which asks more of your balance and your ankles.",
    setup: [
      "Stand with your feet about hip-width apart or closer, toes pointing mostly forward.",
      "Keep your heels down and brace your stomach.",
      "Hold your arms out in front of you for balance."
    ],
    steps: [
      "Sit straight down, keeping your heels flat and your knees over your toes.",
      "Go as low as you can while your heels stay down.",
      "Drive up through your whole foot with your chest tall."
    ],
    breathing: "Breathe in and brace on the way down, and breathe out as you stand.",
    tempo: "Move slowly: lower over about two seconds, and stand up smoothly without rushing.",
    feel: {
      should: "In the fronts of your thighs, with extra work around your knees and ankles to keep you balanced.",
      shouldnt: "As a pinch in your knees, or as your heels lifting."
    },
    mistakes: [
      { mistake: "You rush and tip forward.",
        fix: "Slow the lowering and sit your hips back." },
      { mistake: "Your heels lift to reach more depth.",
        fix: "Stop at the depth where your heels stay down, or widen your stance slightly." }
    ],
    safety: [
      "If your knees feel stressed, widen your stance slightly."
    ],
    variations: {
      alternatives: [
        { id: "squat_1", text: "A shoulder-width stance is more stable, and a better choice while you learn the pattern." }
      ]
    }
  };

  C.squat_alt_deep = {
    summary: "A bodyweight squat taken as low as you can go, hamstrings to calves, for a full range through your hips, knees and ankles.",
    setup: [
      "Stand with your feet about shoulder-width apart, toes turned out slightly.",
      "Hold your hands together at your chest, or out in front for balance.",
      "Brace your stomach and spread your weight across your whole foot."
    ],
    steps: [
      "Sit your hips back and down as low as your flexibility allows.",
      "Keep your heels on the floor and your chest as upright as you can.",
      "Spend a moment in the bottom, nudging your knees open with your elbows if you need to.",
      "Stand all the way up and squeeze your glutes."
    ],
    breathing: "Breathe in and brace on the way down, and breathe out as you stand.",
    tempo: "Lower over about two seconds, take a moment at the bottom, and stand up smoothly.",
    feel: {
      should: "In your thighs and glutes, with a stretch through your hips and ankles.",
      shouldnt: "As a pinch deep in the front of your hip or knee, or in your lower back."
    },
    mistakes: [
      { mistake: "Your heels lift in the bottom.",
        fix: "Stop above that depth for now and spend time on ankle flexibility." },
      { mistake: "Your lower back rounds in the hole.",
        fix: "Stop a little higher, where your back stays flat." }
    ],
    safety: [
      "Build your depth gradually, and don't force past a range that hurts.",
      "Stop at a pinch or sharp pain in the knee or the front of the hip."
    ]
  };

  C.squat_alt_cossack = {
    summary: "A side-to-side squat on a wide stance, sinking onto one leg while the other stays straight, working strength and hip flexibility together.",
    setup: [
      "Stand with your feet much wider than shoulder-width, toes turned out slightly.",
      "Hold your hands together at your chest, or out in front for balance.",
      "Brace your stomach and keep your chest up."
    ],
    steps: [
      "Shift your weight onto one leg and squat down over it, keeping the other leg straight.",
      "Keep the bent leg's heel down and your chest up.",
      "Push back up to the centre.",
      "Shift to the other side and repeat."
    ],
    breathing: "Breathe in as you sink to the side, and breathe out as you push back to the centre.",
    tempo: "Sink slowly over about two seconds, stay controlled at the bottom, and push back to the centre smoothly.",
    feel: {
      should: "In the thigh and glute of the bent leg, and as a stretch along the inside of the straight leg.",
      shouldnt: "As a pinch in the bent leg's knee, or as a sharp pull in your groin."
    },
    mistakes: [
      { mistake: "The bent leg's heel lifts off the floor.",
        fix: "Shorten the depth and keep your weight over the middle of that foot." },
      { mistake: "Your chest collapses toward the floor.",
        fix: "Keep your chest tall and look ahead." }
    ],
    safety: [
      "This needs a lot of hip and ankle flexibility, so ease the depth if your knees complain.",
      "Stop at a sharp pulling pain on the inside of your thigh."
    ]
  };

  C.squat_e2_goblet = {
    summary: "A squat holding a kettlebell or dumbbell at your chest, which counterbalances you and loads your legs without a barbell.",
    setup: [
      "Hold the kettlebell by its horns, or one end of the dumbbell, against your chest with your elbows tucked.",
      "Stand with your feet shoulder-width apart, toes turned out slightly.",
      "Brace your stomach against the weight."
    ],
    steps: [
      "Sit down between your knees, keeping the weight tight to your chest.",
      "Go to full depth with your chest tall and your heels flat.",
      "Stand up and squeeze your glutes at the top."
    ],
    breathing: "Breathe in and brace on the way down, and breathe out as you stand.",
    tempo: "Lower over about two seconds, turn around at the bottom without collapsing, and stand up smoothly.",
    feel: {
      should: "In your thighs and glutes, with your stomach and upper back working to hold the weight.",
      shouldnt: "As a pinch in your knees, or as your lower back rounding at the bottom."
    },
    mistakes: [
      { mistake: "Your elbows drift forward and your chest collapses.",
        fix: "Keep your elbows tucked and the weight close, and use a lighter one if you need to." },
      { mistake: "Your back rounds at the bottom under the load.",
        fix: "Stop above the depth where it rounds, and brace harder." }
    ],
    safety: [
      "Choose a weight you can hold at your chest with a tall back on every rep.",
      "Stop if a knee hurts rather than just working hard."
    ]
  };

  /* ---- hinge ---- */

  C.hinge_1 = {
    summary: "Lifting your hips from the floor with your feet planted, a simple first exercise for your glutes.",
    setup: [
      "Lie on your back with your knees bent and your feet flat, close enough to your hips that your shins are vertical at the top.",
      "Rest your arms by your sides, palms down.",
      "Tuck your chin and bring your ribs down so your lower back stays neutral."
    ],
    steps: [
      "Press through your heels and lift your hips.",
      "Rise until your body is a straight line from shoulders to knees.",
      "Squeeze your glutes at the top without arching your back.",
      "Lower with control, without resting your hips on the floor."
    ],
    breathing: "Breathe out as you lift your hips, and breathe in as you lower.",
    tempo: "Lift firmly, hold the top for a moment, and lower over about two seconds.",
    feel: {
      should: "In your glutes, with your hamstrings helping.",
      shouldnt: "In your lower back, which means you are arching to get higher."
    },
    mistakes: [
      { mistake: "You push through your toes instead of your heels.",
        fix: "Press your heels into the floor, and lift your toes to check." },
      { mistake: "You overarch your lower back to fake extra height.",
        fix: "Stop when your body is straight and keep your ribs down." }
    ],
    safety: [
      "Start the lift from your glutes, and stop if your lower back aches rather than your glutes working."
    ]
  };

  C.hinge_3 = {
    summary: "A hip thrust on one leg with your shoulders on a bench, which doubles the load on the working glute and tests your balance.",
    setup: [
      "Sit on the floor with your upper back against the edge of a stable bench.",
      "Plant one foot flat and extend the other leg straight out, level with your thigh.",
      "Tuck your chin and bring your ribs down."
    ],
    steps: [
      "Drive through the planted heel and lift your hips until they are level.",
      "Keep your hips square, without letting one side dip or turn.",
      "Squeeze your glute at the top without arching your back.",
      "Lower with control, and finish all the reps on one leg before switching."
    ],
    breathing: "Breathe out as you drive up, and breathe in as you lower.",
    tempo: "Drive up firmly, hold the top for a moment, and lower over about two seconds.",
    feel: {
      should: "In the glute of the planted leg, with your hamstring helping.",
      shouldnt: "In your lower back, or as a twist through your pelvis."
    },
    mistakes: [
      { mistake: "Your hips tilt or rotate toward the working side.",
        fix: "Slow down and keep both hip bones pointing at the ceiling." },
      { mistake: "You swing the extended leg to get momentum.",
        fix: "Hold that leg still, level with your other thigh, and let the working glute do the lifting." }
    ],
    safety: [
      "Use a bench that won't slide, and keep your chin tucked.",
      "Stop if your lower back, rather than your glute, takes the strain."
    ]
  };

  C.hinge_5 = {
    summary: "A full Nordic curl: lowering your body forward from your knees under control, then pulling yourself back up with your hamstrings.",
    setup: [
      "Kneel on a mat or folded towel, with your ankles anchored under a heavy sofa or held by a partner.",
      "Straighten your hips so your body is one line from knees to head.",
      "Hold your hands in front of you, ready to catch yourself.",
      "Warm up your hamstrings with easier work first."
    ],
    steps: [
      "Lower forward from your knees, keeping your hips straight.",
      "Resist the fall with your hamstrings through the whole range.",
      "Pull yourself back up with your hamstrings, using your hands as little as you can.",
      "Keep the line from knees to head rigid throughout."
    ],
    breathing: "Breathe in and brace at the top, breathe steadily as you lower, and breathe out as you pull back up.",
    tempo: "Lower slowly and under control, then come back up as smoothly as you can without a jerk.",
    feel: {
      should: "In the backs of your thighs, working hard the whole way down and back up.",
      shouldnt: "As a sudden sharp pain in the back of the thigh, or in your knees from the floor."
    },
    mistakes: [
      { mistake: "You fold at the hips on the way up.",
        fix: "Squeeze your glutes and keep your body straight, and catch yourself with your hands earlier if you need to." },
      { mistake: "Your arms do most of the lifting on the way up.",
        fix: "Use your hands only to help past the hardest point, and try to push less each time." }
    ],
    safety: [
      "Never train Nordics to exhaustion when cold: warm your hamstrings first.",
      "Stop at a sharp or pulling pain in the back of your thigh.",
      "Pad your knees, and make sure your anchor can't lift or slide."
    ]
  };

  C.hinge_6 = {
    summary: "A Nordic curl with deliberate pauses part-way through the range, where your hamstrings work hardest and begin to shake.",
    setup: [
      "Kneel on a mat or folded towel, with your ankles anchored under a heavy sofa or held by a partner.",
      "Straighten your hips so your body is one line from knees to head.",
      "Warm up your hamstrings well, and keep your hands in front of you ready to catch."
    ],
    steps: [
      "Lower slowly until you reach the hardest part of the range, where your hamstrings start to shake.",
      "Pause briefly there, keeping your line rigid.",
      "Carry on lowering, then catch yourself with your hands.",
      "Pull yourself back up with your hamstrings, using your hands as little as you can."
    ],
    breathing: "Breathe steadily through each pause without holding your breath, and breathe out as you pull back up.",
    tempo: "Move slowly through the range, stop deliberately where it is hardest, and don't speed up to get past it.",
    feel: {
      should: "In the backs of your thighs, shaking with effort at the hardest points.",
      shouldnt: "As a sudden sharp pain or pulling in the back of the thigh."
    },
    mistakes: [
      { mistake: "You speed through the hardest mid-range to avoid it.",
        fix: "Slow down exactly where it gets hard, and pause there." },
      { mistake: "You break the hip line when the effort rises.",
        fix: "Squeeze your glutes to keep the line, and catch yourself earlier instead of folding." }
    ],
    safety: [
      "Keep this for hamstrings already used to Nordic curls, and back off at any strain.",
      "Pad your knees, and make sure your anchor can't lift or slide."
    ]
  };

  C.hinge_e2_swing = {
    summary: "A hip-driven swing that floats a kettlebell to chest height, built on the hip hinge and trained with speed.",
    setup: [
      "Stand with your feet a little wider than your shoulders, the kettlebell on the floor a short distance in front of you.",
      "Hinge at your hips with a flat back and take the handle with both hands.",
      "Hike the bell back between your legs, so your forearms touch your thighs."
    ],
    steps: [
      "Snap your hips forward and stand tall, letting the bell float to chest height.",
      "Keep your arms relaxed, because the hips move the bell, not the arms.",
      "Let the bell fall and guide it back between your legs by hinging, not squatting.",
      "Set the bell down on the floor after the last rep."
    ],
    breathing: "Breathe out sharply as your hips snap forward, and breathe in as the bell falls back.",
    tempo: "The hip snap is quick, the bell floats at the top, and the hinge back is controlled; don't rush into the next rep.",
    feel: {
      should: "In your glutes and the backs of your thighs, with your stomach bracing at the top.",
      shouldnt: "In your lower back or your arms, which means you are lifting the bell instead of driving with your hips."
    },
    mistakes: [
      { mistake: "You squat the swing instead of hinging.",
        fix: "Push your hips back, not down, so your shins stay close to vertical." },
      { mistake: "You lift the bell with your shoulders or lower back.",
        fix: "Keep your arms loose and let the hips throw the bell." }
    ],
    safety: [
      "Learn the hinge first, because a squatty swing strains your lower back.",
      "Keep the area around you clear and your grip firm; a slipping kettlebell can do real damage."
    ],
    variations: {
      alternatives: [
        { id: "hinge_e2_rdl", text: "With dumbbells and no kettlebell, Romanian deadlifts train the same hinge at a slower pace." }
      ]
    }
  };

  /* ---- core ---- */

  C.core_2 = {
    summary: "Lying on your back with your shoulders and legs lifted in a shallow curve and your lower back pressed flat.",
    setup: [
      "Lie on your back with your arms reaching overhead.",
      "Press your lower back into the floor by tilting your pelvis under.",
      "Brace your stomach hard."
    ],
    steps: [
      "Lift your shoulders and legs off the floor, keeping your lower back pressed down.",
      "Hold a shallow banana shape, with constant tension through your stomach.",
      "Keep your arms by your ears and your toes pointed.",
      "Lower your arms and legs to the floor to finish."
    ],
    breathing: "Breathe shallowly and steadily through the hold while keeping your stomach braced; don't hold your breath.",
    tempo: "There's no movement: set the shape, then hold it still until the end of the hold.",
    feel: {
      should: "Across your stomach, with your hip flexors and thighs working too.",
      shouldnt: "In your lower back, which means it is arching off the floor, or in your neck."
    },
    mistakes: [
      { mistake: "Your lower back arches off the floor.",
        fix: "Bend your knees or raise your legs a little until your lower back stays flat." },
      { mistake: "You hold your breath instead of staying braced.",
        fix: "Take short, steady breaths while keeping your stomach tight." }
    ],
    safety: [
      "Keep your lower back pressed to the floor; if it lifts, change the shape before you continue.",
      "Keep your chin slightly tucked so your neck doesn't strain."
    ]
  };

  C.core_3 = {
    summary: "A supported hold with your hands pressing down and your knees tucked, so your whole bodyweight sits on your arms.",
    setup: [
      "Place your hands on parallettes, the edges of a bench or the floor, beside your hips with your fingers forward.",
      "Lock your elbows and push your shoulders down away from your ears.",
      "Use parallettes if your wrists complain on the floor."
    ],
    steps: [
      "Press down and lift your hips off the floor.",
      "Tuck your knees toward your chest, with your feet off the floor.",
      "Hold with your chest tall and your shoulders pushed down.",
      "Lower your feet back to the floor to finish."
    ],
    breathing: "Breathe steadily through the hold, keeping your stomach tight; don't hold your breath.",
    tempo: "Lift smoothly, hold still, and lower with control without dropping.",
    feel: {
      should: "In your stomach, hip flexors and triceps, with your shoulders pushing the floor away.",
      shouldnt: "As a sharp pain in your wrists or the fronts of your shoulders."
    },
    mistakes: [
      { mistake: "You shrug your shoulders up toward your ears.",
        fix: "Push the floor down until your shoulders move away from your ears." },
      { mistake: "You bend your elbows to fake the lift.",
        fix: "Lock your elbows, and if you can't lift with straight arms, practise the foot-supported version." }
    ],
    safety: [
      "Putting your hands flat on the floor is a heavy wrist load, so use parallettes if your wrists complain.",
      "Stop at a sharp pain in your wrists or shoulders."
    ]
  };

  C.core_4 = {
    summary: "A supported hold with both legs straight out in front, parallel to the floor, carried on your straight arms.",
    setup: [
      "Place your hands on parallettes, the edges of a bench or the floor, beside your hips with your fingers forward.",
      "Lock your elbows and push your shoulders down away from your ears.",
      "Warm up your wrists and hip flexors first."
    ],
    steps: [
      "Press down and lift your hips off the floor, knees tucked.",
      "Extend both legs straight out in front of you, parallel to the floor.",
      "Point your toes and keep your legs together.",
      "Hold without leaning back, then lower your feet to the floor."
    ],
    breathing: "Breathe steadily through the hold, keeping your stomach tight; don't hold your breath.",
    tempo: "Extend your legs smoothly, hold still, and lower with control without dropping.",
    feel: {
      should: "In your stomach, hip flexors and thighs, with your shoulders and triceps pushing down hard.",
      shouldnt: "As a sharp pain in your wrists or shoulders, or as a cramp that won't ease."
    },
    mistakes: [
      { mistake: "Your knees bend as you tire.",
        fix: "Squeeze your thighs together and tighten your stomach; return to the tuck when they bend." },
      { mistake: "Your back rounds and your hips drop below your hands.",
        fix: "Push the floor away to keep your hips level with or above your hands." }
    ],
    safety: [
      "Hip flexor cramps are common, so stretch them before and after.",
      "Stop at a sharp pain in your wrists or shoulders."
    ]
  };

  C.core_5 = {
    summary: "Lying on a bench and lowering your straight body from vertical as slowly as you can, building toward the full dragon flag.",
    setup: [
      "Lie on your back on a stable bench and grip the bench behind your head with both hands.",
      "Check the bench can't slide or tip.",
      "Lift your hips and legs until your body is vertical, supported on your shoulders."
    ],
    steps: [
      "Brace your stomach and squeeze your glutes so your body is one stiff line.",
      "Lower slowly, keeping your hips straight instead of folding.",
      "Stop just above the bench, or earlier if you can no longer hold the line.",
      "Bring your knees in and reset to start the next rep."
    ],
    breathing: "Breathe in at the top, brace, and breathe steadily as you lower; breathe out as you reset.",
    tempo: "The lowering is the exercise, so go as slowly as you can control, and treat the reset as just that.",
    feel: {
      should: "Through your whole stomach, with your glutes and shoulders also working.",
      shouldnt: "In your neck, which means you are pressing your head into the bench, or in your lower back."
    },
    mistakes: [
      { mistake: "You bend at the hips to make the lowering easier.",
        fix: "Squeeze your glutes and stop higher, where you can still hold the line." },
      { mistake: "You drop fast instead of resisting.",
        fix: "End the rep earlier, at the point where you can still resist." }
    ],
    safety: [
      "Keep your neck relaxed and neutral, and don't push your head into the bench.",
      "Brace your lower back, and stop if it aches rather than your stomach working.",
      "Don't attempt this cold or when you are tired."
    ]
  };

  C.core_6 = {
    summary: "Raising and lowering your whole rigid body from your shoulders on a bench, an advanced exercise for your stomach.",
    setup: [
      "Lie on your back on a stable bench and grip the bench behind your head with both hands.",
      "Check the bench can't slide or tip.",
      "Lift your hips and legs until your body is vertical, supported on your shoulders."
    ],
    steps: [
      "Brace your stomach and squeeze your glutes so your body is one stiff line.",
      "Lower your whole body as one line, hips straight, until it is just above the bench.",
      "Raise your body back up along the same line, with your hips still straight.",
      "Return to vertical before the next rep."
    ],
    breathing: "Breathe in and brace at the top, hold the brace through the lowering, and breathe out as you raise.",
    tempo: "Control both the lowering and the lift, keeping one steady speed without a swing.",
    feel: {
      should: "Through your whole stomach, with your glutes and shoulders working to hold the line.",
      shouldnt: "In your neck, or in your lower back."
    },
    mistakes: [
      { mistake: "You pike at the hips at some point in the rep.",
        fix: "Squeeze your glutes and shorten the range until you can keep the line." },
      { mistake: "You swing through the bottom using momentum.",
        fix: "Slow the lowering and stop higher until you can lift without a swing." }
    ],
    safety: [
      "This is a very demanding exercise, so never attempt it cold or with a tired back.",
      "Keep your neck neutral and stop at a sharp pain in your lower back or neck."
    ]
  };

  C.skill_lsit_1 = {
    summary: "A hold with your hips lifted by your hands and only your heels on the floor, the entry step toward the L-sit.",
    setup: [
      "Sit on the floor, or between two raised supports, with your hands beside your hips and fingers forward.",
      "Lock your elbows and push your shoulders down away from your ears.",
      "Use parallettes if pressing on flat ground bothers your wrists."
    ],
    steps: [
      "Press down and lift your hips off the floor.",
      "Keep your heels lightly on the floor, with your legs straight in front of you.",
      "Hold with your chest tall and your shoulders pushed down.",
      "Lower your hips to the floor to finish."
    ],
    breathing: "Breathe steadily through the hold, keeping your stomach tight; don't hold your breath.",
    tempo: "Lift smoothly, hold still, and lower with control without dropping.",
    feel: {
      should: "In your triceps and shoulders, with your stomach and hip flexors working.",
      shouldnt: "As a sharp pain in your wrists or the fronts of your shoulders."
    },
    mistakes: [
      { mistake: "Your shoulders shrug up toward your ears.",
        fix: "Push the floor down until your shoulders move away from your ears." },
      { mistake: "You bend your elbows to hold the lift.",
        fix: "Lock your elbows, and lift less if you can't keep them straight." }
    ],
    safety: [
      "Flat hands on the floor load your wrists heavily, so use parallettes if they complain.",
      "Stop at a sharp pain in your wrists or shoulders."
    ]
  };

  C.skill_lsit_2 = {
    summary: "A hold with your hips and feet off the floor and your knees tucked, carrying all your bodyweight on your hands.",
    setup: [
      "Place your hands on parallettes, the edges of a bench or the floor, beside your hips with your fingers forward.",
      "Lock your elbows and push your shoulders down away from your ears.",
      "Warm up your wrists first."
    ],
    steps: [
      "Press down and lift your hips off the floor.",
      "Tuck both knees toward your chest, with your feet off the floor.",
      "Hold with your chest tall and your shoulders driven down.",
      "Lower your feet to the floor to finish."
    ],
    breathing: "Breathe steadily through the hold, keeping your stomach tight; don't hold your breath.",
    tempo: "Lift smoothly, hold still, and lower with control without dropping.",
    feel: {
      should: "In your stomach, hip flexors and triceps, with your shoulders pressing down.",
      shouldnt: "As a sharp pain in your wrists or the fronts of your shoulders."
    },
    mistakes: [
      { mistake: "Your shoulders rise toward your ears.",
        fix: "Push down through your hands until your shoulders move away from your ears." },
      { mistake: "You lean back to make the balance easier.",
        fix: "Keep your chest tall and your shoulders over your hands." }
    ],
    safety: [
      "Stretch your hip flexors before and after, because cramping is common.",
      "Stop at a sharp pain in your wrists or shoulders."
    ]
  };

  C.skill_lsit_3 = {
    summary: "A hold with your legs straight out in front, parallel to the floor, carried entirely on your straight arms.",
    setup: [
      "Place your hands on parallettes, the edges of a bench or the floor, beside your hips with your fingers forward.",
      "Lock your elbows and push your shoulders down away from your ears.",
      "Start in a tuck hold."
    ],
    steps: [
      "From the tuck, extend both legs straight out in front, parallel to the floor.",
      "Push the supports down hard and keep your shoulders depressed.",
      "Point your toes and squeeze your legs together.",
      "Hold without leaning back to fake the angle, then lower to finish."
    ],
    breathing: "Breathe steadily through the hold, keeping your stomach tight; don't hold your breath.",
    tempo: "Extend your legs smoothly, hold still, and lower with control without dropping.",
    feel: {
      should: "In your stomach, hip flexors and thighs, with your triceps and shoulders pressing down.",
      shouldnt: "As a sharp pain in your wrists or shoulders, or as a cramp that won't ease."
    },
    mistakes: [
      { mistake: "Your knees bend as your core tires.",
        fix: "Squeeze your thighs together and tighten your stomach; go back to the tuck when they bend." },
      { mistake: "Your hips drop below your hands.",
        fix: "Push down harder through your hands to lift your hips level with or above them." }
    ],
    safety: [
      "This is a big demand on your hip flexors and core, so build up gradually.",
      "Stop at a sharp pain in your wrists or shoulders."
    ]
  };

  C.skill_vsit = {
    summary: "A hold from an L-sit where you lean back a little and raise your legs above hip height, making a V with your body.",
    setup: [
      "Place your hands on parallettes or a bench, beside your hips with your fingers forward.",
      "Get into a strong L-sit first.",
      "Warm up your wrists, hamstrings and hip flexors thoroughly."
    ],
    steps: [
      "Press down hard, locking your elbows and pushing your shoulders down.",
      "Lean back slightly so your legs can rise above hip height.",
      "Fold at your hips to lift your legs, keeping them straight and together, toes pointed.",
      "Hold without bending your knees, then lower back to an L-sit."
    ],
    breathing: "Breathe in short, steady breaths through the hold, keeping your stomach tight; don't hold your breath.",
    tempo: "Raise your legs slowly, hold still, and lower back to the L-sit with control.",
    feel: {
      should: "In your stomach and hip flexors, with a stretch in the backs of your thighs and strong pressure through your arms.",
      shouldnt: "As a sharp pain in your wrists, shoulders or the backs of your thighs."
    },
    mistakes: [
      { mistake: "You bend your knees to lift your legs higher.",
        fix: "Keep your legs straight, even if that means they rise less high." },
      { mistake: "You round your back instead of folding at the hips.",
        fix: "Fold from your hips and keep your chest tall and your shoulders pressing down." }
    ],
    safety: [
      "This needs serious hip flexor and hamstring flexibility and a lot of core strength, so warm up well.",
      "Stop at a sharp pain in your wrists, shoulders or the backs of your thighs."
    ]
  };
})();
