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
    prereq: [
      "A controlled assisted pull-up or negative.",
      "Full hanging shoulder control."
    ],
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
    prereq: [
      "A table or door that won't tip, slide or open.",
      "Enough floor grip under your feet."
    ],
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
    prereq: [
      "Standing comfortably and bending your hips and knees within a comfortable range."
    ],
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
    prereq: [
      "A controlled split squat.",
      "Balance on one leg."
    ],
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
    prereq: [
      "A comfortable glute bridge.",
      "A bench that won't slide."
    ],
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
    prereq: [
      "The ability to kneel comfortably.",
      "Controlled assisted hamstring lowering.",
      "Something secure holding your ankles."
    ],
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
    prereq: [
      "The ability to support yourself on forearms and toes.",
      "A brace that keeps your lower back from sagging."
    ],
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
    prereq: [
      "A comfortable hip hinge with a flat back.",
      "A pair of dumbbells you can hold without your grip giving out."
    ],
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
    prereq: [
      "A door and anchor that withstand your full weight.",
      "The ability to row at a shallow angle."
    ],
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
    prereq: [
      "Straight-body tension through your row.",
      "A bar or rings that hold your weight at an angle you can manage."
    ],
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
    prereq: [
      "A flat back in a hip hinge.",
      "Dumbbells you can control without your lower back rounding."
    ],
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
    prereq: [
      "A flat back while braced on a bench.",
      "A dumbbell you can control without twisting."
    ],
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
    prereq: [
      "An active hang with your shoulders pulled down.",
      "A strong trunk brace.",
      "A tucked, straight-arm hold."
    ],
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
    prereq: [
      "A stable tuck front lever.",
      "The control to keep your shoulder position as your hips open."
    ],
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
    prereq: [
      "A stable advanced tuck or one-leg front lever.",
      "Control of a wide-leg position."
    ],
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
    prereq: [
      "A stable straddle front lever.",
      "Straight arms and full body control."
    ],
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
    prereq: [
      "A comfortable passive hang.",
      "The ability to pull your shoulders down without bending your elbows."
    ],
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
    prereq: [
      "A comfortable hang.",
      "Controlled shoulder blade movement."
    ],
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
    prereq: [
      "The ability to reach the top position with a step.",
      "Control to lower yourself slowly."
    ],
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
    prereq: [
      "The ability to hang from a bar.",
      "Control of the assisted full range."
    ],
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
    prereq: [
      "A controlled assisted chin-up or negative.",
      "Wrists and elbows that tolerate an underhand grip."
    ],
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
    prereq: [
      "A strong, strict pull-up.",
      "Control as you move your weight toward one side."
    ],
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
    prereq: [
      "A bar you can reach safely.",
      "The ability to support your body weight briefly by your hands."
    ],
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
    prereq: [
      "A controlled bodyweight squat.",
      "The balance to pause at the depth you choose."
    ],
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
    prereq: [
      "The ability to stand in a staggered stance.",
      "Control as you lower."
    ],
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
    prereq: [
      "A controlled Bulgarian split squat.",
      "Balance and ankle range on one leg."
    ],
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
    prereq: [
      "A comfortable squat depth.",
      "Balance on one leg with a light hand on a support."
    ],
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
    prereq: [
      "A controlled shrimp squat, or controlled assisted and negative pistol squats.",
      "Balance and range on one leg."
    ],
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
    prereq: [
      "A controlled pistol squat.",
      "A weight you can hold close to your body."
    ],
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
    prereq: [
      "A comfortable standard squat.",
      "Balance with your feet closer together."
    ],
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
    prereq: [
      "A comfortable squat that you can take deeper a little at a time.",
      "Heels that stay down."
    ],
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
    prereq: [
      "The ability to shift your weight to one side.",
      "Hips and ankles with comfortable range for a wide stance."
    ],
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
    prereq: [
      "A controlled bodyweight squat.",
      "A weight you can hold close to your chest."
    ],
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
    prereq: [
      "The ability to lie on your back and lift your hips without back discomfort."
    ],
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
    prereq: [
      "A controlled hip thrust.",
      "A bench that won't slide."
    ],
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
    prereq: [
      "Controlled Nordic negatives.",
      "A safe way to push back up, such as your hands."
    ],
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
    prereq: [
      "A controlled Nordic curl.",
      "A hamstring that feels settled under strain."
    ],
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
    prereq: [
      "A comfortable hip hinge.",
      "A kettlebell you can control without your back rounding."
    ],
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
    prereq: [
      "The ability to lie on your back and brace.",
      "A lower back that stays controlled."
    ],
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
    prereq: [
      "The ability to support yourself on straight arms.",
      "Enough strength to lift your bent knees."
    ],
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
    prereq: [
      "A stable tuck L-sit.",
      "Enough compression to straighten your legs."
    ],
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
    prereq: [
      "A stable L-sit.",
      "A strong hollow body hold.",
      "A bench to hold on to."
    ],
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
    prereq: [
      "A strong hollow body hold.",
      "A controlled eccentric trunk lowering."
    ],
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
    prereq: [
      "Straight-arm support on your handles or bench.",
      "A comfortable hollow body hold."
    ],
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
    prereq: [
      "A stable foot-supported L-sit.",
      "Enough strength to lift your feet."
    ],
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
    prereq: [
      "A stable tuck L-sit.",
      "A controlled straight-leg lift."
    ],
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
    prereq: [
      "A stable full L-sit.",
      "Enough compression to lift your legs higher."
    ],
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

  C.pull_alt_australianfe = {
    summary: "An inverted row with your heels raised on a platform, so your body sits flatter and more of your weight goes through your arms.",
    prereq: [
      "A controlled inverted row, with a straight line from heels to head.",
      "A platform for your heels that can't slide, and a bar or rings that can't roll or tip."
    ],
    setup: [
      "Set a bar or a pair of rings at about hip height, secure enough to take your full weight.",
      "Put a bench or sturdy step under your heels, and test that it won't slide before you hang.",
      "Take an overhand grip at shoulder width and lie back with your arms straight.",
      "Squeeze your glutes and brace your stomach so you are one line from heels to head."
    ],
    steps: [
      "Draw your shoulder blades back and down before your elbows bend.",
      "Pull your chest toward the bar by driving your elbows back along your sides.",
      "Pause with your chest at or near the bar and your hips still level with your shoulders.",
      "Lower to straight arms without letting your hips fold or sag."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull up smoothly, pause briefly at the top, and lower over about two seconds.",
    feel: {
      should: "Across your upper back and the backs of your shoulders, with your biceps and grip helping.",
      shouldnt: "In your lower back, or as a sharp pain at your elbows or shoulders."
    },
    mistakes: [
      { mistake: "Your hips fold, so your body bends at the waist.",
        fix: "Squeeze your glutes and keep your ribs down so the line from heels to head stays straight." },
      { mistake: "Your feet slide off the platform as you pull.",
        fix: "Press your heels into the platform and use one that grips the floor and the soles of your shoes." }
    ],
    safety: [
      "Check that the platform and the bar or rings can't move before you lie under them.",
      "Stop at a sharp pain in your shoulders, elbows or lower back, and get a persistent one looked at."
    ]
  };

  C.pull_alt_archerrow = {
    summary: "An inverted row where one arm does most of the pulling and the other stays straight out to the side, a step toward a one-arm row.",
    prereq: [
      "A controlled inverted row, with a straight line from heels to head.",
      "Comfort shifting your weight toward one hand without twisting."
    ],
    setup: [
      "Set a low bar or a pair of rings at about hip height, with room to move sideways along them.",
      "Take an overhand grip a little wider than your shoulders and lie back with your arms straight.",
      "Squeeze your glutes and brace your stomach so you are one line from heels to head.",
      "Keep your hips square to the floor, and plan to work both sides evenly."
    ],
    steps: [
      "Draw your shoulder blades back and down.",
      "Shift your weight toward one hand and pull with that arm, letting the other arm straighten out to the side.",
      "Bring your chest toward the working hand, with your hips still square.",
      "Lower under control, return to the centre, then do the same toward the other side."
    ],
    breathing: "Breathe out as you pull, and breathe in as you lower back to the centre.",
    tempo: "Pull smoothly, pause briefly at the top, and lower over about two seconds on the working arm.",
    feel: {
      should: "Mostly in the working side of your upper back and lat, with the straight arm doing very little.",
      shouldnt: "As a twist through your hips, or a sharp pain in the working elbow or shoulder."
    },
    mistakes: [
      { mistake: "Your hips twist toward the working side.",
        fix: "Keep your belt buckle pointing at the floor and squeeze your glutes through the whole pull." },
      { mistake: "You yank through the working elbow to get the rep started.",
        fix: "Start each rep from a still hang and pull smoothly; let the straight arm help a little more if the pull stalls." }
    ],
    safety: [
      "Check that the bar or rings can't roll, slide or tip, because your weight moves to one side.",
      "Stop at a sharp pain in the working shoulder or elbow, or in your lower back."
    ]
  };

  C.pull_alt_tableweighted = {
    summary: "A table row with a vest or packed backpack fixed high on your back, adding load to a row you already control.",
    prereq: [
      "A controlled straight-body table row.",
      "A table heavy enough that it can't tip or creep, with an edge you can grip firmly."
    ],
    setup: [
      "Use a heavy table that can't tip or creep across the floor, and test it by pulling hard on it before you load yourself.",
      "Fix a snug vest, or a backpack with its straps pulled tight, high on your back so it can't slide.",
      "Lie under the table edge, grip it at shoulder width, and straighten your body from heels to head.",
      "Squeeze your glutes and brace your stomach so the load can't sag your hips."
    ],
    steps: [
      "Squeeze your shoulder blades together before your arms bend.",
      "Pull your chest up to the table edge, driving your elbows back.",
      "Pause with your chest at the edge while the load stays still on your back.",
      "Lower to straight arms under control, keeping your body in one line."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull up smoothly, pause briefly at the top, and lower over about two seconds with the load still.",
    feel: {
      should: "Across your upper back and rear shoulders, with your hips and stomach holding the line against the load.",
      shouldnt: "In your lower back, or at the front of your shoulders."
    },
    mistakes: [
      { mistake: "The pack slides toward your neck or hips as you pull.",
        fix: "Tighten the straps or switch to a fitted vest, and set the load high on your upper back." },
      { mistake: "The table creeps across the floor while you pull.",
        fix: "Stop, and move to a heavier table or brace its legs against a wall before the next rep." }
    ],
    safety: [
      "Stop at once if the table shifts or tips; a load on your back makes that worse.",
      "Stop at a sharp pain in your shoulders, elbows or lower back, and get a persistent one looked at."
    ]
  };

  C.pull_alt_bandrow = {
    summary: "A standing row against a band, hinged forward at the hips, which trains your upper back without a bar or a table.",
    prereq: [
      "A flat back while hinged forward at the hips.",
      "A band that is intact, with no nicks or tears, and that stays under your feet."
    ],
    setup: [
      "Check the band for nicks and tears before you use it.",
      "Stand on the middle of the band with both feet, and take an end in each hand.",
      "Hinge at your hips until your torso leans forward, with a flat back and soft knees.",
      "Let your arms hang straight, with the band already taut."
    ],
    steps: [
      "Brace your stomach so your torso stays still.",
      "Pull your hands toward your ribs, driving your elbows back past your sides.",
      "Squeeze your shoulder blades together at the top.",
      "Lower slowly until your arms are straight and the band is still taut."
    ],
    breathing: "Breathe out as you pull, and breathe in as you lower.",
    tempo: "Pull steadily, pause briefly at the top, and lower over about two seconds, keeping the band taut.",
    feel: {
      should: "Between your shoulder blades and across your upper back, with your hamstrings and lower back holding your hinge.",
      shouldnt: "As a rounded lower back, or a sharp pain at your elbows or shoulders."
    },
    mistakes: [
      { mistake: "You round your back to get the band moving.",
        fix: "Lift your chest, push your hips back, and end the set when your back starts to round." },
      { mistake: "The band slips out from under your feet.",
        fix: "Reset with your whole foot on the middle of the band before the next rep." }
    ],
    safety: [
      "Inspect the band first and never use one that is cracked or overstretched, because a snapping band can hit your face.",
      "Stop at a sharp pain in your lower back, shoulders or elbows."
    ],
    variations: {
      alternatives: [
        { id: "pull_e2_dbrow", text: "With a dumbbell instead of a band, the dumbbell row trains the same pull." }
      ]
    }
  };

  C.skill_frontlever_band = {
    summary: "A front lever with a band under your hips taking part of your weight, so you can hold a longer, flatter body than you could unassisted.",
    prereq: [
      "A stable tuck front lever, with straight arms.",
      "A rated bar and anchor you have checked, an intact band, and clear space below and behind you."
    ],
    setup: [
      "Use a rated overhead bar, with clear space below and behind you and a non-slip landing.",
      "Fix an intact band to the bar or an anchor so it takes your weight at the waist, and check both before you hang.",
      "Warm up your shoulders and elbows, then hang with straight arms.",
      "Pull your shoulder blades down and back and lock your elbows."
    ],
    steps: [
      "Lift your body toward horizontal, with the band under your hips.",
      "Open out of your tuck, lengthening your body only as far as your elbows stay straight.",
      "Hold a level body, with your shoulders pressing down.",
      "Lower back to a hang before the line breaks."
    ],
    breathing: "Breathe in short, steady breaths through the hold; if you can't breathe, come down.",
    tempo: "Lift smoothly, hold still, and lower out slowly instead of letting the band spring you back.",
    feel: {
      should: "Through your lats and stomach, with the band taking only part of the load.",
      shouldnt: "As a sharp pain at your elbows or shoulders, or from the band bouncing you."
    },
    mistakes: [
      { mistake: "You bend your elbows to pull into position.",
        fix: "Keep your arms straight and use a shorter lever until you can hold it that way." },
      { mistake: "You bounce off the band instead of holding the position.",
        fix: "Lift slowly into the hold, so the band's rebound isn't doing the work." },
      { mistake: "The band slides along your body.",
        fix: "Stop, reset it at your waist, and use a band that stays where you put it." }
    ],
    safety: [
      "Inspect the band and anchor before every session, because a snapping band can hit you.",
      "Stop at a sharp or pulling pain in your elbows or shoulders, and don't force straight-arm positions."
    ]
  };

  C.skill_frontlever_negative = {
    summary: "A slow lowering from an inverted position toward a horizontal front lever, building the strength to hold the position.",
    prereq: [
      "A front lever progression you can hold with straight arms.",
      "A rated bar or rings, with clear space below and behind you and a way to get safely inverted."
    ],
    setup: [
      "Use a rated overhead bar or anchored rings, with clear space below and behind you and a non-slip landing.",
      "Warm up your shoulders, elbows and wrists first.",
      "Get into a secure inverted position, with your body above the bar and in line with it.",
      "Pull your shoulder blades down and keep your arms straight."
    ],
    steps: [
      "Hold the inverted position with your body braced in one line.",
      "Lower toward horizontal slowly, with your arms straight and your shoulder blades down.",
      "Keep your hips and chest moving together so the line doesn't bend.",
      "Stop where the line would break, then return to a hang and reset."
    ],
    breathing: "Breathe steadily as you lower; don't hold your breath for the whole descent.",
    tempo: "Lower as slowly as you can control, with no drop through the hardest part of the range.",
    feel: {
      should: "Through your lats, the backs of your shoulders and your stomach, working hardest as you near horizontal.",
      shouldnt: "As a sharp pain at your elbows or shoulders, or a pinch in your lower back."
    },
    mistakes: [
      { mistake: "You drop through the hardest part of the range.",
        fix: "Use a shorter lever, such as a tuck, until you can control the whole descent." },
      { mistake: "You arch your lower back to slow the fall.",
        fix: "Squeeze your glutes and keep your ribs down so your body stays in one line." }
    ],
    safety: [
      "Keep a way out: if you lose control, bend your knees and return to the hang rather than dropping.",
      "Stop at a sharp or pulling pain in your elbows or shoulders, and don't force straight-arm positions."
    ]
  };

  C.skill_frontlever_oneleg = {
    summary: "A front lever with one leg extended and the other still tucked, a halfway lever between the advanced tuck and the straddle.",
    prereq: [
      "A stable advanced tuck front lever.",
      "Comfort extending one leg without your hips twisting."
    ],
    setup: [
      "Use a rated overhead bar or anchored rings, with clear space below and behind you and a non-slip landing.",
      "Warm up your shoulders, elbows and wrists first.",
      "Get into an advanced tuck front lever, with straight arms and level hips.",
      "Pull your shoulder blades down and keep them there."
    ],
    steps: [
      "From the advanced tuck, extend one leg straight out.",
      "Keep the other knee tucked and your hips level, without letting them twist.",
      "Hold your body horizontal with your arms straight.",
      "Tuck the leg back in, then extend the other leg on the next rep."
    ],
    breathing: "Breathe in short, steady breaths through the hold; if you can't breathe, come down.",
    tempo: "Extend the leg slowly, hold still, and bring it back in under control.",
    feel: {
      should: "Through your lats and stomach, with your hips and glutes holding the line.",
      shouldnt: "As a sharp pain at your elbows or shoulders, or a twist through your hips."
    },
    mistakes: [
      { mistake: "Your hips twist as the leg goes out.",
        fix: "Squeeze your glutes and keep your hips level with each other; go back to the tuck if you can't." },
      { mistake: "The extended leg drops below the line of your body.",
        fix: "Keep it in line with your torso, or shorten the lever until you can." }
    ],
    safety: [
      "Move out of the tuck gradually; the longer lever loads your elbows and shoulders more.",
      "Stop at a sharp or pulling pain in your elbows or shoulders."
    ]
  };

  C.skill_frontlever_raise = {
    summary: "A raise from a hang up to a horizontal body and back down, training how you reach a front lever as well as how you hold it.",
    prereq: [
      "A controlled tuck or advanced tuck front lever hold.",
      "A rated bar or rings, with clear space below and behind you."
    ],
    setup: [
      "Use a rated overhead bar or anchored rings, with clear space below and behind you and a non-slip landing.",
      "Warm up your shoulders, elbows and wrists, and choose a tuck you can control.",
      "Take an overhand grip and hang with your arms straight.",
      "Pull your shoulder blades down into an active hang."
    ],
    steps: [
      "Start from a still, active hang, with no swing.",
      "Lift your hips and legs toward horizontal in your chosen tuck, keeping your arms straight.",
      "Pause with your body level and facing up.",
      "Lower back to the hang under control, keeping your shoulder blades down."
    ],
    breathing: "Breathe out as you lift and breathe in as you lower; if you can't breathe, use a shorter lever.",
    tempo: "Lift smoothly with no kick, pause briefly at the top, and lower over about three seconds.",
    feel: {
      should: "Through your lats, the backs of your shoulders and your stomach, with your glutes squeezing.",
      shouldnt: "As a sharp pain at your elbows or shoulders, or in your lower back."
    },
    mistakes: [
      { mistake: "You swing into the raise to get started.",
        fix: "Settle into a still hang before each rep, and lift without any kick." },
      { mistake: "You bend your elbows to help the lift.",
        fix: "Keep your arms locked straight and use a shorter lever if you can't." },
      { mistake: "Your shoulders rise toward your ears as you lift.",
        fix: "Press your shoulder blades down and keep them there through the whole rep." }
    ],
    safety: [
      "Control the lowering; dropping out of the raise jolts your elbows and shoulders.",
      "Stop at a sharp or pulling pain in your elbows or shoulders."
    ]
  };

  C.pull_alt_ringassist = {
    summary: "A ring pull-up with your feet on the floor or a firm support taking part of your weight, so you can train the whole pull with less load.",
    prereq: [
      "Comfort hanging from rings with a steady grip.",
      "Rings anchored securely and hung low enough that your feet reach a firm surface."
    ],
    setup: [
      "Hang the rings from a secure anchor, low enough that your feet can rest on the floor or a firm support.",
      "Check the anchor and straps before you put your weight on them.",
      "Take a steady grip on both rings and start with your arms straight.",
      "Decide how much your feet will help, and keep it the same on every rep."
    ],
    steps: [
      "Pull your shoulder blades down and back.",
      "Pull yourself up, letting your feet take only as much weight as you need.",
      "Finish with your chin at or above ring level, with the rings level and quiet.",
      "Lower to straight arms under control, with the same amount of foot help."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull up steadily, pause briefly at the top, and lower over about two seconds.",
    feel: {
      should: "In the sides of your back and your biceps, with your grip and forearms working.",
      shouldnt: "As a sharp pain at your elbows, wrists or shoulders, or with your feet doing most of the lifting."
    },
    mistakes: [
      { mistake: "How much your feet help changes from rep to rep.",
        fix: "Set a foot position and push the same amount every time, so each rep means the same thing." },
      { mistake: "The rings twist or drift apart.",
        fix: "Pull them straight down toward your sides and keep them level and quiet." }
    ],
    safety: [
      "Check the anchor and straps before every session, because rings move under load.",
      "Stop at a sharp pain in your shoulders, elbows or wrists, and get a persistent one looked at."
    ]
  };

  C.pull_alt_neutral = {
    summary: "A pull-up with your palms facing each other on parallel handles or rings, the middle ground between an overhand and an underhand grip.",
    prereq: [
      "A comfortable strict pull-up.",
      "Parallel handles, or rings hung at the same height, that can't move."
    ],
    setup: [
      "Take parallel handles, or rings at the same height, with your palms facing each other.",
      "Hang from straight arms with your legs together and slightly in front of you.",
      "Pull your shoulder blades down and brace your stomach so you don't swing."
    ],
    steps: [
      "Pull your shoulder blades down and back, lifting yourself slightly before your elbows bend.",
      "Drive your elbows down toward your sides, keeping your palms facing each other.",
      "Pull until your chin passes the handles, without swinging.",
      "Lower under control until your arms are straight again."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull up steadily, pause briefly at the top, and take about two seconds to lower.",
    feel: {
      should: "In the sides of your back and your biceps, with your grip and forearms working.",
      shouldnt: "As a sharp pain at your elbows, wrists or shoulders."
    },
    mistakes: [
      { mistake: "You swing to get your chin over the handles.",
        fix: "Squeeze your glutes and keep your legs still; a slower, smaller rep counts, a swung one doesn't." },
      { mistake: "Your grip slips as you tire.",
        fix: "End the set while you can still lower under control, and step down instead of dropping." }
    ],
    safety: [
      "Always control the lowering; dropping into a hang is hard on your elbows.",
      "If you use rings, check they are anchored securely and hang at the same height."
    ]
  };

  C.pull_alt_wide = {
    summary: "A pull-up with your hands wider than your shoulders, which changes the angle of the pull and asks more of your lats.",
    prereq: [
      "A comfortable strict pull-up.",
      "A bar long enough to take a wider grip with a full, secure hold."
    ],
    setup: [
      "Take the bar wider than your shoulders, but only as wide as your shoulders tolerate.",
      "Make sure the bar lets you wrap your whole hand around it, thumb included.",
      "Hang from straight arms with your legs together and slightly in front of you, and brace your stomach."
    ],
    steps: [
      "Pull your shoulder blades down and back before your elbows bend.",
      "Drive your elbows down and out toward the floor.",
      "Pull until your chin clears the bar, without craning your neck.",
      "Lower slowly to a full hang with your arms straight."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull up steadily, pause briefly at the top, and take about two seconds to lower.",
    feel: {
      should: "Across the sides of your back under your armpits, with your arms helping.",
      shouldnt: "As a pinch at the top or front of your shoulder, or a sharp pain at your elbow."
    },
    mistakes: [
      { mistake: "You go wider than your shoulders tolerate.",
        fix: "Bring your hands in until the pull feels strong across your back and nothing pinches." },
      { mistake: "You cut the range short at the top or the bottom.",
        fix: "Start every rep from straight arms and finish with your chin clearly over the bar." }
    ],
    safety: [
      "A wide grip puts more stress on your shoulders, so narrow your hands if the front of the shoulder pinches.",
      "Stop at a sharp pain in your shoulders, elbows or wrists, and get a persistent one looked at."
    ]
  };

  C.pull_alt_close = {
    summary: "A pull-up with your hands closer than shoulder width, which keeps your elbows close to your sides and works your arms and lats together.",
    prereq: [
      "A comfortable strict pull-up.",
      "A bar with room for your hands to sit close together with your wrists staying straight."
    ],
    setup: [
      "Take the bar with your hands closer than shoulder width, at a spacing where your wrists stay straight.",
      "Hang from straight arms with your legs together and slightly in front of you.",
      "Pull your shoulder blades down and brace your stomach so you don't swing."
    ],
    steps: [
      "Pull your shoulder blades down and back before your elbows bend.",
      "Pull your chin over the bar with your trunk steady and your elbows close to your body.",
      "Pause briefly at the top with your wrists still straight.",
      "Lower to a full hang under control."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull up steadily, pause briefly at the top, and take about two seconds to lower.",
    feel: {
      should: "In your lats and biceps, with a little more work in your arms than a standard grip.",
      shouldnt: "As a sharp pain in your wrists or elbows, or from your wrists being bent inward."
    },
    mistakes: [
      { mistake: "You force your wrists inward to get your hands close together.",
        fix: "Widen your grip until your wrists sit straight over the bar." },
      { mistake: "You swing to start the first rep.",
        fix: "Settle into a still hang with your stomach braced before you pull." }
    ],
    safety: [
      "Always control the lowering; dropping into a hang is hard on your elbows.",
      "Stop at a sharp pain in your wrists, elbows or shoulders, and get a persistent one looked at."
    ]
  };

  C.pull_alt_hollow = {
    summary: "A pull-up done in a hollow-body shape, with your ribs down and your legs together in front, so your whole body moves as one unit.",
    prereq: [
      "A comfortable strict pull-up.",
      "A controlled hollow-body shape, held without letting your lower back arch.",
      "Clear space in front of and behind you."
    ],
    setup: [
      "Take an overhand grip a little wider than your shoulders and hang with your arms straight.",
      "Set a hollow shape: ribs down, glutes squeezed, and your legs together and slightly forward.",
      "Check that there's clear space in front of and behind you."
    ],
    steps: [
      "Keep the hollow shape and pull your shoulder blades down and back.",
      "Pull with your whole body moving as one unit, without letting your legs kick.",
      "Bring your chin over the bar.",
      "Lower to a full hang and reset the hollow before the next rep."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull up steadily, pause briefly at the top, and take about two seconds to lower while keeping the shape.",
    feel: {
      should: "In your lats and upper back, with your stomach working hard to hold the shape.",
      shouldnt: "In your lower back, which means the hollow has turned into an arch, or as a sharp pain at your elbows or shoulders."
    },
    mistakes: [
      { mistake: "You kick your legs to get up.",
        fix: "Squeeze your glutes and keep your legs still; a slower, smaller rep counts, a kicked one doesn't." },
      { mistake: "Your ribs flare and your back arches as you tire.",
        fix: "Pull your ribs down toward your hips, and end the set when you can't hold the shape." }
    ],
    safety: [
      "Control the lowering; dropping into a hang is hard on your elbows.",
      "Stop at a sharp pain in your lower back, shoulders or elbows."
    ]
  };

  C.pull_alt_arched = {
    summary: "A pull-up where your upper back extends a little and your chest leads toward the bar, a different path from the hollow-body version.",
    prereq: [
      "A comfortable strict pull-up.",
      "A controlled extended body line, with the arch in your upper back and not your lower back."
    ],
    setup: [
      "Take an overhand grip a little wider than your shoulders and hang with your arms straight.",
      "Pull your shoulder blades down and lift your chest slightly, with your legs together behind you.",
      "Squeeze your glutes so the arch comes from your upper back, not your lower back."
    ],
    steps: [
      "Pull while letting your upper back extend a little.",
      "Lead with your chest toward the bar rather than your chin.",
      "Drive your elbows down and back until your chest is near the bar.",
      "Lower under control to a full hang with your arms straight."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull up smoothly, pause briefly at the top, and take about two seconds to lower.",
    feel: {
      should: "Across your upper back and lats, with your chest rising toward the bar.",
      shouldnt: "In your lower back, or as a sharp pain at your elbows or shoulders."
    },
    mistakes: [
      { mistake: "You arch from your lower back instead of your upper back.",
        fix: "Squeeze your glutes and tuck your pelvis slightly, and keep the arch to your upper back." },
      { mistake: "You jerk your shoulders back to gain height.",
        fix: "Pull smoothly and let your chest rise on its own; use a smaller range if you can't." }
    ],
    safety: [
      "Keep your glutes squeezed so a hard lower-back arch doesn't take over.",
      "Stop at a sharp pain in your lower back, shoulders or elbows, and get a persistent one looked at."
    ]
  };

  C.pull_alt_towelgrip = {
    summary: "A pull-up gripping two towels draped over the bar, which makes your hands and forearms work harder than a bar grip does.",
    prereq: [
      "A comfortable strict pull-up.",
      "Two strong towels of equal length, and a fixed bar they can hang from without sliding off."
    ],
    setup: [
      "Use two strong towels of equal length, and check that neither is worn or thin.",
      "Drape them over a fixed bar so they hang evenly, and take one in each fist.",
      "Hang from straight arms with your legs together and slightly in front of you.",
      "Pull your shoulder blades down and brace your stomach so you don't swing."
    ],
    steps: [
      "Pull your shoulder blades down and keep both towels hanging evenly.",
      "Pull until your hands are near your chest, without swinging.",
      "Pause briefly at the top with your grip still tight.",
      "Lower to straight arms, and step down before your grip fades."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull up smoothly, pause briefly at the top, and take about two seconds to lower.",
    feel: {
      should: "In your forearms and hands as much as your back, with your lats and biceps pulling.",
      shouldnt: "As a sharp pain at your elbows, wrists or shoulders."
    },
    mistakes: [
      { mistake: "The towels slip through your fists.",
        fix: "Squeeze them harder, wrap them once around your hands, and lower the moment they start to slide." },
      { mistake: "You keep hanging on after your grip has gone.",
        fix: "End the set while you can still lower under control, and step down rather than drop." }
    ],
    safety: [
      "Check the towels before each set, because a worn one can tear or slip.",
      "Stop at a sharp pain in your elbows, shoulders or wrists, and get a persistent one looked at."
    ]
  };

  C.pull_alt_c2b = {
    summary: "A strict pull-up that goes higher, until your chest touches or nearly touches the bar instead of just your chin passing it.",
    prereq: [
      "A comfortable strict pull-up, with your chest rising toward the bar.",
      "A bar high enough that your chest and head clear it, with nothing in the way above."
    ],
    setup: [
      "Use a bar high enough that your chest and head clear it, with nothing above or in front to hit.",
      "Take an overhand grip a little wider than your shoulders and hang from straight arms.",
      "Brace your stomach and squeeze your glutes so your body doesn't swing."
    ],
    steps: [
      "Pull your shoulder blades down and back before your elbows bend.",
      "Pull your chest, not your chin, toward the bar, driving your elbows down and back.",
      "Touch or come close to the bar with your chest, without craning your neck.",
      "Lower under control to a full hang, keeping the rep strict."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull up fast enough to reach the bar, pause briefly, and take about two seconds to lower.",
    feel: {
      should: "In your lats and upper back, with your chest rising and your biceps and grip helping.",
      shouldnt: "In your neck, or as a sharp pain at your elbows or the front of your shoulders."
    },
    mistakes: [
      { mistake: "You crane your neck up toward the bar.",
        fix: "Keep your neck long and look straight ahead; pull your chest to the bar instead of reaching with your chin." },
      { mistake: "You let your body swing into a kip.",
        fix: "Squeeze your glutes and keep your legs still, and use a smaller range if you can't keep the rep strict." }
    ],
    safety: [
      "Make sure nothing above or beside the bar can catch your head or shoulders.",
      "Stop at a sharp pain in your shoulders, elbows or neck, and get a persistent one looked at."
    ]
  };

  C.pull_alt_onearm = {
    summary: "A pull-up on one arm, built up with help you can reduce, such as a band, your free hand or a hand on your wrist.",
    prereq: [
      "A strong archer pull-up, and a controlled one-arm hang.",
      "Elbows that tolerate heavy one-arm load, and someone qualified to watch your technique, since the app can't."
    ],
    setup: [
      "Use a fixed bar, with a step beneath you so you start each rep from the same place.",
      "Choose help you can reduce over time: your free hand on the bar, a band, or a hand on your wrist.",
      "Hang from the working arm with that shoulder blade pulled down.",
      "Brace your stomach and legs so your body doesn't twist."
    ],
    steps: [
      "Pull your working shoulder blade down and set your body so it doesn't twist.",
      "Pull until your chin passes the bar, with your trunk rotating as little as you can manage.",
      "Let the help take only as much as you need to.",
      "Lower slowly until your arm is straight, without dropping onto the working elbow."
    ],
    breathing: "Breathe out as you pull, and breathe in as you lower.",
    tempo: "Pull steadily with no jerk out of the hang, and lower as slowly as you can control.",
    feel: {
      should: "In the working side of your back and your biceps, with your grip and forearm holding on.",
      shouldnt: "As a sharp pain in the working elbow, shoulder or wrist."
    },
    mistakes: [
      { mistake: "You drop onto the working elbow at the bottom.",
        fix: "Lower under control and stop the rep short of a full drop, using more help if you need it." },
      { mistake: "You jerk out of the hang to start the pull.",
        fix: "Settle into a still hang and set your shoulder blade before each pull." }
    ],
    safety: [
      "This puts a heavy load through one elbow and shoulder, so warm up thoroughly and never train it tired.",
      "Stop at a sharp pain in your shoulder, elbow or wrist, and have someone qualified look at your technique."
    ]
  };

  C.pull_alt_weighted = {
    summary: "A strict pull-up with a vest or belt adding load, done through the same full range you use without it.",
    prereq: [
      "A controlled strict pull-up through a full range.",
      "A bar that can take your bodyweight plus the load, and a vest or belt that fits snugly."
    ],
    setup: [
      "Check that the bar can support your bodyweight plus the load.",
      "Wear a snug vest, or a belt with the weight held close to your body, so the load can't swing.",
      "Take an overhand grip just wider than your shoulders and hang from straight arms.",
      "Brace your stomach and squeeze your glutes before you pull."
    ],
    steps: [
      "Pull your shoulder blades down and back before your elbows bend.",
      "Pull until your chin clears the bar, with the load hanging still.",
      "Pause briefly at the top.",
      "Lower to a full hang with straight arms, using the same range as without load."
    ],
    breathing: "Breathe out as you pull up, and breathe in as you lower.",
    tempo: "Pull up steadily, pause briefly at the top, and lower over about two seconds.",
    feel: {
      should: "In the sides of your back and your biceps, with your grip working hard to hold the load.",
      shouldnt: "As a sharp pain at your elbows or shoulders, or from the load swinging under you."
    },
    mistakes: [
      { mistake: "The weight swings under you.",
        fix: "Fix it closer to your body, or switch to a snug vest, and keep your legs still." },
      { mistake: "Your range shrinks as the load goes up.",
        fix: "Take a lighter load and keep the full range; a shortened rep isn't the same exercise." }
    ],
    safety: [
      "Add load gradually; your elbows and shoulders carry the extra weight as well as your back.",
      "Stop at a sharp pain in your elbows, shoulders or wrists, and lower or step down before letting go if your grip fails."
    ]
  };

  C.skill_muscleup_explosive = {
    summary: "A pull-up done as fast as you can control, aiming your lower chest toward the bar, to build the height a muscle-up needs.",
    prereq: [
      "A strong strict pull-up, and a fast pull that doesn't turn into a swing.",
      "A high fixed bar, with clear space above and in front of it so you can pull past it."
    ],
    setup: [
      "Use a high fixed bar with clear space above it and in front of it.",
      "Take an overhand grip about shoulder width and hang from straight arms with your legs together.",
      "Pull your shoulder blades down and brace your stomach so you start from a still hang."
    ],
    steps: [
      "Start from a still hang, with no swing.",
      "Pull fast, aiming to bring your lower chest toward the bar.",
      "Keep your elbows driving down and back past your sides.",
      "Lower under control to a straight-arm hang, and reset before the next rep."
    ],
    breathing: "Breathe out hard as you pull, and breathe in as you lower.",
    tempo: "Pull up fast and with intent, then take about two seconds to lower under control.",
    feel: {
      should: "In your lats, upper back and biceps, with your whole body driving upward together.",
      shouldnt: "As a sharp pain at your elbows, shoulders or wrists, or from your body swinging out."
    },
    mistakes: [
      { mistake: "You keep doing high pulls after you are tired, so the speed fades.",
        fix: "Do them while you are fresh and end the set as soon as the pull slows." },
      { mistake: "Your body swings out of control.",
        fix: "Squeeze your glutes and keep your legs together, and lower each rep to a still hang before you pull again." }
    ],
    safety: [
      "Fast pulls load your elbows and shoulders harder than slow ones, so warm up first.",
      "Stop at a sharp pain in your elbows, shoulders or wrists, and get a persistent one looked at."
    ]
  };

  C.skill_muscleup_turnover = {
    summary: "A drill for the turn over the bar, bringing your chest over and settling into support, practised slowly with some help from the floor or a step.",
    prereq: [
      "A controlled pull until your chest meets the bar, and a stable straight-arm support on a bar.",
      "A bar low enough to reach with your feet on the floor or a step, so you can lower the demand."
    ],
    setup: [
      "Use a fixed bar you can reach with your feet on the floor or a step, so the drill is partly assisted.",
      "Check that the bar and the step can't move, and clear the space around you.",
      "Take an overhand grip and start from a deep pull, with your chest close to the bar."
    ],
    steps: [
      "From the deep pull, bring your chest over the bar slowly.",
      "Let your wrists rotate over the bar, keeping your hands from slamming down.",
      "Settle in a supported position, with your chest over the bar and your arms straight.",
      "Lower back out the same way, in control."
    ],
    breathing: "Breathe steadily through the drill; hold your breath only for a moment if you need to at the top.",
    tempo: "Move through the turn at a speed you control, not as a jump.",
    feel: {
      should: "In your chest, the fronts of your shoulders and your triceps, as the weight moves over the bar.",
      shouldnt: "As a sharp pain in your wrists, elbows or shoulders."
    },
    mistakes: [
      { mistake: "You slam your wrists over the bar.",
        fix: "Slow down and let your hands roll over the bar in a smooth movement." },
      { mistake: "You jump through a range you aren't ready for.",
        fix: "Use a lower bar or more help from your feet until you can control every phase." }
    ],
    safety: [
      "Your wrists and elbows carry a sharp load as you turn over, so go slowly and stop at any pain there.",
      "Stop if the turn goes out of control; don't try to rescue a failing rep by jumping through it."
    ]
  };

  C.skill_muscleup_band = {
    summary: "A muscle-up with a band taking part of your weight through the turn, so you can practise the pull, turn and press as one movement.",
    prereq: [
      "A strong assisted high pull, and a stable straight-bar dip.",
      "A high bar with clear space above it, and an intact band that you can fix securely."
    ],
    setup: [
      "Use a fixed high bar with clear space above it.",
      "Check the band for nicks and tears, fix it so it supports you through the turn, and test it before you hang.",
      "Take an overhand grip and start from a still hang with the band set."
    ],
    steps: [
      "Pull high, leading with your chest toward the bar.",
      "Bring your chest over the bar, turning your wrists over in one smooth movement.",
      "Press to a stable straight-arm support on the bar.",
      "Lower down under control, letting the band help without doing the turn for you."
    ],
    breathing: "Breathe out as you pull, and breathe in as you lower back down.",
    tempo: "Pull fast enough to reach the bar, but make the turn smooth, and lower under control.",
    feel: {
      should: "Across your lats and chest, then through your triceps as you press up to support.",
      shouldnt: "As a sharp pain in your wrists, elbows or shoulders, or from the band snapping you upward."
    },
    mistakes: [
      { mistake: "The band's rebound does the turn for you.",
        fix: "Use a lighter band, or turn more slowly so your own pull is doing the work." },
      { mistake: "One side turns over before the other.",
        fix: "Keep your hands level and bring both shoulders over the bar together." }
    ],
    safety: [
      "Inspect the band and its fixing before each session, because a snapping band can hit you.",
      "Stop at a sharp pain in your wrists, elbows or shoulders, or when the turn goes out of control."
    ]
  };

  C.skill_muscleup_full = {
    summary: "A pull from a hang over the bar and into a straight-arm support, joining a high pull, a turn and a press into one movement.",
    prereq: [
      "A high pull to your lower chest, a controlled turn over the bar, and a straight-bar dip.",
      "A fixed bar rated for your bodyweight, with plenty of clearance above and a safe place to land."
    ],
    setup: [
      "Use a fixed, bodyweight-rated high bar with plenty of room above it and a safe landing below.",
      "Warm up your wrists, elbows and shoulders thoroughly.",
      "Take an overhand grip and hang from straight arms, with your body still."
    ],
    steps: [
      "Pull high and fast, leading with your chest toward the bar.",
      "Turn over smoothly, bringing your chest over the bar with both hands level.",
      "Press to a straight-arm support on top of the bar.",
      "Lower under control by reversing the movement, or step down, and reset between reps."
    ],
    breathing: "Breathe out hard as you pull, and breathe in again once you're in support.",
    tempo: "Pull fast, turn smoothly, press steadily, and take your time on the way down.",
    feel: {
      should: "Through your lats, chest and triceps in turn, with your whole body moving as one unit.",
      shouldnt: "As a sharp pain in your wrists, elbows or shoulders."
    },
    mistakes: [
      { mistake: "You turn over with one arm trailing, a chicken wing.",
        fix: "Keep your hands level and drive both elbows over the bar together; go back to the band version if you can't." },
      { mistake: "You kip to get through the sticking point.",
        fix: "Stay with a strict pull and a high one, and go back to the drill that gave you the turn." }
    ],
    safety: [
      "Your wrists, elbows and shoulders take a lot of load in the turn, so never train it cold or tired.",
      "Stop at a sharp pain in your wrists, elbows or shoulders, or when the turn goes out of control."
    ]
  };

  C.skill_backlever_skinthecat = {
    summary: "A slow roll from a hang into an inverted tuck and back out, the entry move for the back lever that also shows how far your shoulders will go.",
    prereq: [
      "Comfort hanging and being upside down, with a safe way back out.",
      "Shoulders that rotate backward comfortably, without forcing them.",
      "A padded landing and a spotter for your first attempts."
    ],
    setup: [
      "Use a rated bar or anchored rings, with enough clearance to rotate fully and a padded landing below.",
      "Have a spotter for your first attempts, and warm up your shoulders and wrists.",
      "Hang with an overhand grip and your arms straight.",
      "Decide how you will exit: back the way you came in, or by lowering your feet down."
    ],
    steps: [
      "Tuck your knees up toward your chest.",
      "Rotate backward slowly, lifting your hips until your legs pass between your arms.",
      "Go only as far as your shoulders allow comfortably, then pause.",
      "Come back out the same way, slowly enough that you could stop at any point."
    ],
    breathing: "Breathe slowly and steadily; holding your breath tenses your neck and shoulders.",
    tempo: "Move slowly the whole way so you could stop or reverse at any point, and never drop into the stretch.",
    feel: {
      should: "As a stretch across the fronts of your shoulders, with your stomach and lats controlling the roll.",
      shouldnt: "As a sharp or pinching pain in your shoulders, elbows or neck, or from dropping into the bottom."
    },
    mistakes: [
      { mistake: "You drop into the stretch at the bottom.",
        fix: "Slow the roll and stop earlier, at a point where you can control the whole movement." },
      { mistake: "You twist while you are upside down.",
        fix: "Keep your hips and shoulders square and your knees together." }
    ],
    safety: [
      "Go slowly and stop at dizziness, pain or tingling, especially in your neck, arms or hands.",
      "Don't force your shoulders into the stretch; use a smaller range and work toward more."
    ]
  };

  C.skill_backlever_1 = {
    summary: "A hold upside down and facing the floor, with your knees tucked and your hips level with your shoulders, the first back lever shape.",
    prereq: [
      "A controlled skin the cat, and a tucked inverted position you can hold.",
      "A rated bar or rings, and a padded landing with a spotter for new inversions."
    ],
    setup: [
      "Use a rated bar or anchored rings, with enough clearance to rotate and a padded landing below.",
      "Warm up your shoulders, elbows and wrists thoroughly.",
      "Get into a tucked, inverted position, as in skin the cat.",
      "Know how you will exit: reverse the way you came in."
    ],
    steps: [
      "From the tucked, inverted position, rotate until your body faces the floor.",
      "Bring your hips level with your shoulders, with your knees tucked.",
      "Keep your elbows straight and your shoulders from sinking.",
      "Hold, then reverse out with control."
    ],
    breathing: "Breathe in short, steady breaths through the hold; if you can't breathe, come out.",
    tempo: "Rotate into the position slowly, hold still, and reverse out with the same control.",
    feel: {
      should: "Through your lats, the fronts of your shoulders and your stomach, with your glutes squeezing.",
      shouldnt: "As a sharp pain at your shoulders, elbows or neck, or a stretch that forces your shoulders to their limit."
    },
    mistakes: [
      { mistake: "You overextend your shoulders into the stretch.",
        fix: "Come up out of the stretch until your arms feel strong, and build the position gradually." },
      { mistake: "Your hips drop below your shoulders.",
        fix: "Squeeze your glutes and lift your hips level, or come out and reset." }
    ],
    safety: [
      "Go slowly and stop at dizziness, pain or tingling, especially in your neck, arms or hands.",
      "Don't force your shoulders into the stretch; use a smaller range and a spotter for new inversions."
    ]
  };

  C.skill_backlever_transition = {
    summary: "A tuck back lever where you open your legs toward a straddle and close them again, practising the change in leg shape.",
    prereq: [
      "A stable tuck back lever, and slow control of your legs.",
      "A rated bar or rings, and a padded landing below."
    ],
    setup: [
      "Use a rated bar or anchored rings, with enough clearance to rotate and a padded landing below.",
      "Warm up your shoulders, elbows and wrists thoroughly.",
      "Take a tuck back lever with straight arms and your hips level.",
      "Know how you will exit: close back to the tuck, then reverse out."
    ],
    steps: [
      "From the tuck back lever, open your legs slowly toward a straddle.",
      "Open one stage at a time, keeping your hips from twisting as your legs separate.",
      "Pause where you can still control your shoulders and hips.",
      "Close back to the tuck at the same slow speed, then rest before the next rep."
    ],
    breathing: "Breathe in short, steady breaths through the movement; if you can't breathe, come out.",
    tempo: "Open and close your legs slowly, with no fling at the end of either direction.",
    feel: {
      should: "Through your lats and stomach, with your glutes keeping your hips level.",
      shouldnt: "As a sharp pain at your shoulders, elbows or neck, or a twist through your hips."
    },
    mistakes: [
      { mistake: "You fling your legs open.",
        fix: "Open them a little at a time and stop wherever the speed starts to build." },
      { mistake: "Your shoulders drift forward or sink as your legs move.",
        fix: "Press your shoulders down, keep your arms straight, and open your legs less far." }
    ],
    safety: [
      "Go slowly and stop at dizziness, pain or tingling, especially in your neck, arms or hands.",
      "Stop at a sharp pain in your shoulders or elbows, and don't force the stretch."
    ]
  };

  C.skill_backlever_2 = {
    summary: "A back lever with your knees opened away from your chest, a longer lever than the tuck that holds your body closer to horizontal.",
    prereq: [
      "A stable tuck back lever.",
      "Shoulders that tolerate a longer lever, and a padded landing with a spotter for new positions."
    ],
    setup: [
      "Use a rated bar or anchored rings, with enough clearance to rotate and a padded landing below.",
      "Warm up your shoulders, elbows and wrists thoroughly.",
      "Get into a stable tuck back lever with straight arms.",
      "Know how you will exit: close back to the tuck, then reverse out."
    ],
    steps: [
      "From the tuck, open your knees away from your chest a little at a time.",
      "Keep your body line near horizontal, with your hips level with your shoulders.",
      "Hold your elbows straight and your shoulders pressed down.",
      "Return to the tuck before your hips begin to drop."
    ],
    breathing: "Breathe in short, steady breaths through the hold; if you can't breathe, come out.",
    tempo: "Open into the position slowly, hold still, and return to the tuck with control.",
    feel: {
      should: "Through your lats, the fronts of your shoulders and your stomach, with your glutes squeezing.",
      shouldnt: "As a sharp pain at your shoulders, elbows or neck, or in your lower back."
    },
    mistakes: [
      { mistake: "You arch your lower back to hold the line.",
        fix: "Squeeze your glutes and tuck your pelvis slightly, or go back to the tight tuck." },
      { mistake: "You bend your elbows.",
        fix: "Lock your arms straight and use a shorter lever until you can hold it that way." }
    ],
    safety: [
      "Go slowly and stop at dizziness, pain or tingling, especially in your neck, arms or hands.",
      "Move out of the tuck gradually; the longer lever loads your shoulders and elbows more."
    ]
  };

  C.skill_backlever_straddleneg = {
    summary: "A slow lowering from an inverted position into a wide straddle back lever, building the strength to hold the straddle.",
    prereq: [
      "A stable advanced tuck back lever, and slow control of your legs in a straddle.",
      "A rated bar or rings, and a padded landing with a spotter for new positions."
    ],
    setup: [
      "Use a rated bar or anchored rings, with enough clearance to rotate and a padded landing below.",
      "Warm up your shoulders, elbows and wrists thoroughly.",
      "Get into a secure inverted position, with your arms straight.",
      "Know how you will exit: reverse out, or tuck and rotate back to the hang."
    ],
    steps: [
      "From the secure inverted position, open your legs in a wide, even straddle.",
      "Lower slowly toward horizontal, with your elbows straight.",
      "Keep your legs equally apart and your hips level.",
      "Stop where you lose control, and exit safely."
    ],
    breathing: "Breathe steadily as you lower; don't hold your breath for the whole descent.",
    tempo: "Lower as slowly as you can control, with no free fall through any part of the range.",
    feel: {
      should: "Through your lats, the fronts of your shoulders and your stomach, working hardest near horizontal.",
      shouldnt: "As a sharp pain at your shoulders, elbows or neck, or a stretch that forces your shoulders to their limit."
    },
    mistakes: [
      { mistake: "You free-fall through the lowering.",
        fix: "Stop higher up, where you can control the descent, and lower from there." },
      { mistake: "Your shoulders extend further than is comfortable.",
        fix: "Stop short of that point and build the range gradually." }
    ],
    safety: [
      "Go slowly and stop at dizziness, pain or tingling, especially in your neck, arms or hands.",
      "Don't force the stretch; stop at a sharp pain in your shoulders or elbows."
    ]
  };

  C.skill_backlever_3 = {
    summary: "A back lever hold with your legs in a wide, even straddle, a longer lever than the advanced tuck.",
    prereq: [
      "A controlled straddle negative, and a stable straight-arm shoulder position.",
      "A rated bar or rings, and a padded landing below."
    ],
    setup: [
      "Use a rated bar or anchored rings, with enough clearance to rotate and a padded landing below.",
      "Warm up your shoulders, elbows and wrists thoroughly.",
      "Get into an inverted position, with your arms straight.",
      "Know how you will exit: close your legs back into a tuck, then reverse out."
    ],
    steps: [
      "From a controlled straddle lowering, take a wide, even straddle.",
      "Hold your hips and trunk level and your arms straight.",
      "Keep your chest and hips from dropping.",
      "Leave by closing your legs back into a tuck."
    ],
    breathing: "Breathe in short, steady breaths through the hold; if you can't breathe, come out.",
    tempo: "Settle into the straddle slowly, hold still, and close back to the tuck smoothly.",
    feel: {
      should: "Through your lats, the fronts of your shoulders and your stomach, with your glutes squeezing.",
      shouldnt: "As a sharp pain at your shoulders, elbows or neck, or as your lower back caving."
    },
    mistakes: [
      { mistake: "Your legs spread unevenly.",
        fix: "Look at your legs in a mirror or on video and open each side by the same amount." },
      { mistake: "Your chest or hips sink below the line.",
        fix: "Press your shoulders down, squeeze your glutes, and close back to the tuck before the line breaks." }
    ],
    safety: [
      "Go slowly and stop at dizziness, pain or tingling, especially in your neck, arms or hands.",
      "Stop at a sharp pain in your shoulders or elbows, and don't force the stretch."
    ]
  };

  C.skill_backlever_fullneg = {
    summary: "A slow lowering from an inverted position with your legs together toward a full back lever, building the strength to hold it.",
    prereq: [
      "A stable straddle back lever, and controlled lowering with your legs together.",
      "A rated bar or rings, and a padded landing with a spotter for new positions."
    ],
    setup: [
      "Use a rated bar or anchored rings, with enough clearance to rotate and a padded landing below.",
      "Warm up your shoulders, elbows and wrists thoroughly.",
      "Get into a secure inverted position, with your legs together and your arms straight.",
      "Know how you will exit: reverse out, or tuck and rotate back to the hang."
    ],
    steps: [
      "From the secure inverted position, keep your legs together.",
      "Lower slowly with your elbows straight.",
      "Keep your body in one even line, without arching.",
      "Stop and exit when your control fades."
    ],
    breathing: "Breathe steadily as you lower; don't hold your breath for the whole descent.",
    tempo: "Lower as slowly as you can control, with no free fall through any part of the range.",
    feel: {
      should: "Through your lats, the fronts of your shoulders and your stomach, working hardest near horizontal.",
      shouldnt: "As a sharp pain at your shoulders, elbows or neck, or an arch pinching your lower back."
    },
    mistakes: [
      { mistake: "You drop too fast.",
        fix: "Stop higher up, where you can control the descent, and lower from there." },
      { mistake: "You arch through your back.",
        fix: "Squeeze your glutes and keep your ribs down so your body stays in one line." }
    ],
    safety: [
      "Go slowly and stop at dizziness, pain or tingling, especially in your neck, arms or hands.",
      "Stop at a sharp pain in your shoulders or elbows, and don't force the stretch."
    ]
  };

  C.skill_backlever_4 = {
    summary: "A back lever with your whole body straight and level and your legs together, facing the floor behind you.",
    prereq: [
      "A controlled full back lever negative, and a stable straight-arm hold of the full body.",
      "A rated bar or rings, and a padded landing below."
    ],
    setup: [
      "Use a rated bar or anchored rings, with enough clearance to rotate and a padded landing below.",
      "Warm up your shoulders, elbows and wrists thoroughly.",
      "Plan a deliberate exit before you start: tuck, then reverse out.",
      "Take a controlled full-length lever from your negative, with your legs together."
    ],
    steps: [
      "From a controlled lowering, take the full lever with your legs together.",
      "Keep your body level and your arms straight.",
      "Press your shoulders down and squeeze your glutes to hold the line.",
      "Leave by tucking your knees and reversing out, before the line breaks."
    ],
    breathing: "Breathe in short, steady breaths through the hold; if you can't breathe, come out.",
    tempo: "Settle into the lever slowly, hold only as long as the line stays, and exit with control.",
    feel: {
      should: "Through your lats, the fronts of your shoulders and your stomach, with your glutes squeezing.",
      shouldnt: "As a sharp pain at your shoulders, elbows or neck, or an over-stretch at the fronts of your shoulders."
    },
    mistakes: [
      { mistake: "You over-stretch your shoulders.",
        fix: "Come out of the lever as soon as the stretch feels like strain, and build the hold gradually." },
      { mistake: "Your hips drop.",
        fix: "Squeeze your glutes and press your shoulders down, or tuck before the line breaks." }
    ],
    safety: [
      "Go slowly and stop at dizziness, pain or tingling, especially in your neck, arms or hands.",
      "Stop at a sharp pain in your shoulders or elbows, and never force a position the line can't hold."
    ]
  };

  C.squat_alt_box = {
    summary: "Sitting back onto a stable box and standing up from it, a squat with a fixed depth to aim at and a pause on the box.",
    prereq: [
      "You can sit onto a box and stand back up with control.",
      "A box or sturdy chair that can't slide, at a height you can rise from comfortably."
    ],
    setup: [
      "Place a stable box or sturdy chair directly behind you, against a wall if it might slide.",
      "Pick a height you can sit onto and rise from with control; go higher if your knees or hips complain.",
      "Stand about shoulder-width apart with your toes turned slightly out.",
      "Brace your stomach and hold your arms out in front for balance."
    ],
    steps: [
      "Sit your hips back and down toward the box, with your chest tall.",
      "Lower until you touch the box lightly, with your weight still through the middle of your feet.",
      "Pause for a moment without relaxing your stomach or letting your back round.",
      "Press through your whole foot to stand, without rocking back first."
    ],
    breathing: "Breathe in as you sit back, hold your brace as you touch the box, and breathe out as you stand.",
    tempo: "Sit down slowly, pause briefly on the box without dropping onto it, then stand up smoothly.",
    feel: {
      should: "In your thighs and glutes, with your stomach braced and your whole foot pressed into the floor.",
      shouldnt: "As a jolt through your lower back when you land on the box, or as pain at the front of your knees."
    },
    mistakes: [
      { mistake: "You drop onto the box and bounce off it.",
        fix: "Lower more slowly and touch the box instead of landing on it." },
      { mistake: "You rock backward to build momentum before standing.",
        fix: "Lean your chest slightly forward and press your whole foot into the floor to stand." }
    ],
    safety: [
      "Make sure the box can't slide or tip before you sit, and pick a height your knees and hips tolerate.",
      "Stop at pain in your knees, hips or lower back, and use a higher box."
    ]
  };

  C.squat_alt_jump = {
    summary: "A bodyweight squat that ends in a jump straight up, used to train fast, springy leg power and soft landings.",
    prereq: [
      "A controlled bodyweight squat, and a quiet landing from small hops.",
      "A non-slip floor and clear space above and around you."
    ],
    setup: [
      "Clear the space above and around you, and stand on a non-slip floor.",
      "Wear shoes that grip, or stand barefoot on a firm mat.",
      "Stand about shoulder-width apart with your toes turned slightly out.",
      "Decide a squat depth you can control before you start, and use the same one each time."
    ],
    steps: [
      "Squat down to your chosen depth with your chest tall and your weight over the middle of your feet.",
      "Drive through the floor and jump straight up, with your arms swinging to help.",
      "Land softly on your whole foot, hips back and knees tracking over your toes.",
      "Settle into the squat as you land, then stand tall and reset before the next jump."
    ],
    breathing: "Breathe in as you squat down and out as you jump; take a normal breath as you reset.",
    tempo: "Squat down quickly but under control, jump as fast as you can, and land quietly and slowly through your legs.",
    feel: {
      should: "In your thighs and glutes as you push off, then as a soft, springy absorption through your whole foot on landing.",
      shouldnt: "As a hard jolt in your knees or heels, or a thud that you can hear from the next room."
    },
    mistakes: [
      { mistake: "You land stiff-legged.",
        fix: "Bend your knees and hips as soon as your feet touch, and keep the landing quiet." },
      { mistake: "Your knees cave inward on the landing.",
        fix: "Push your knees out over your toes, and end the set when you can't." },
      { mistake: "You chain the jumps and the landings get louder.",
        fix: "Reset fully between jumps, and stop the set as soon as the landings get worse." }
    ],
    safety: [
      "Jumping loads your knees, ankles and Achilles tendons; stop at pain in any of them and do a plain squat instead.",
      "Stop as soon as your landings get noisy or uncontrolled."
    ]
  };

  C.squat_alt_bulgarianw = {
    summary: "A rear-foot-elevated split squat with a dumbbell in each hand, loading each leg on its own through a deep range.",
    prereq: [
      "A steady unweighted Bulgarian split squat, with a front foot that doesn't wobble.",
      "A bench that can't slide, and dumbbells you can set down safely."
    ],
    setup: [
      "Place a bench behind you and make sure it can't slide.",
      "Hold a dumbbell in each hand at your sides, with your arms straight.",
      "Rest the top of your back foot on the bench and step your front foot far enough forward that your shin stays near vertical at the bottom.",
      "Stand tall with your stomach braced, and keep the dumbbells clear of the bench."
    ],
    steps: [
      "Lower under control until your back knee is just above the floor.",
      "Keep your weight through the middle of your front foot, with your chest tall.",
      "Pause for a moment at the bottom without bouncing.",
      "Drive through your whole front foot to stand, with the dumbbells level and still."
    ],
    breathing: "Breathe in as you lower, hold your brace at the bottom, and breathe out as you stand.",
    tempo: "Lower slowly, pause briefly without bouncing, then stand smoothly; the weights should never swing.",
    feel: {
      should: "In the thigh and glute of your front leg, with your back leg steadying you and your grip holding the weights.",
      shouldnt: "As pain in the front of your front knee, or a pull in your lower back."
    },
    mistakes: [
      { mistake: "You add weight while your front foot still wobbles.",
        fix: "Go back to the lighter weight until the whole front foot stays flat and still." },
      { mistake: "You cut your depth short as the weights get heavier.",
        fix: "Use the lighter weight and keep the same depth on every rep." },
      { mistake: "The dumbbells swing or bump into the bench.",
        fix: "Let them hang straight down at your sides, and step further forward if they touch." }
    ],
    safety: [
      "Fix the bench so it can't slide, and set the dumbbells down at your sides, not behind you, when you finish.",
      "Stop and shorten the range if your knee, hip or back complains."
    ]
  };

  C.squat_alt_deficit = {
    summary: "A Bulgarian split squat with your front foot raised on a low, solid riser, so you lower through extra depth.",
    prereq: [
      "A steady Bulgarian split squat, with a comfortable range of motion at the bottom.",
      "A low, solid riser for your front foot, and a bench that can't slide."
    ],
    setup: [
      "Place a bench behind you and a low, solid riser in front of it, in a line.",
      "Rest the top of your back foot on the bench and your front foot flat on the riser, a little above the floor.",
      "Check that the riser can't tip, and that you aren't stacking anything unstable.",
      "Stand tall with your stomach braced and your hands on your hips or held in front."
    ],
    steps: [
      "Lower slowly through the extra depth, keeping your whole front foot pressed into the riser.",
      "Stay upright and let your front knee travel over your toes at an angle you can control.",
      "Pause for a moment at the bottom without bouncing.",
      "Stand by driving through your front foot, then step off the riser to reset between sets."
    ],
    breathing: "Breathe in as you lower, hold your brace at the bottom, and breathe out as you stand.",
    tempo: "Lower slowly through the extra range, pause briefly, then stand smoothly without bouncing.",
    feel: {
      should: "In the thigh and glute of your front leg, with a deeper stretch than the floor version.",
      shouldnt: "As pain at the front of your knee or in your hip, or your front heel lifting off the riser."
    },
    mistakes: [
      { mistake: "You stack unstable risers to chase more depth.",
        fix: "Use one solid, low riser, and let your control, not your depth, set how far you go." },
      { mistake: "Your front heel lifts at the bottom.",
        fix: "Shorten the range until your whole foot stays pressed into the riser." }
    ],
    safety: [
      "A riser that tips is a fall: use a solid one and check it before every set.",
      "Stop and lower the riser, or shorten the range, if your knee or hip complains."
    ]
  };

  C.squat_alt_boxpistol = {
    summary: "A one-leg squat down to a box and back up, with the box catching you and setting how deep you go.",
    prereq: [
      "A controlled assisted pistol squat, and a slow one-leg sit onto a box.",
      "A stable box or bench that can't slide, behind your hips."
    ],
    setup: [
      "Set a stable box or bench behind your hips, against a wall if it might slide.",
      "Start with a high box and lower it a little at a time as your control improves.",
      "Stand on one foot with the other leg held out in front, and your arms out for balance.",
      "Keep a wall, rail or doorframe within reach in case you need a hand."
    ],
    steps: [
      "Sit down onto the box on one leg, slowly, with your weight over the middle of your foot.",
      "Touch the box gently instead of dropping onto it.",
      "Keep your free leg held out in front, without letting it touch the floor.",
      "Stand up on the same leg without rocking, then repeat on the other leg."
    ],
    breathing: "Breathe in as you sit, hold your brace as you touch the box, and breathe out as you stand.",
    tempo: "Lower slowly, touch the box gently, and stand without any swing of the free leg.",
    feel: {
      should: "In the thigh and glute of your standing leg, with your foot gripping the floor for balance.",
      shouldnt: "As a twist at your knee or ankle, or a jolt when you reach the box."
    },
    mistakes: [
      { mistake: "You fall onto the box at the bottom.",
        fix: "Use a higher box, and lower slowly enough that you can stop above it." },
      { mistake: "You swing the free leg or rock to get up.",
        fix: "Hold the free leg out still, or use a hand on the wall for the stand." }
    ],
    safety: [
      "Single-leg squats twist the knee if your foot or hip drifts; stop at pain in your knee, hip or ankle.",
      "Go back to a higher box or more support, and make sure the box can't slide."
    ]
  };

  C.squat_alt_pistolneg = {
    summary: "Lowering on one leg as slowly as you can, then using a rail, a box or your free foot to get back up.",
    prereq: [
      "A controlled assisted pistol squat, and a one-leg lowering you can slow down on purpose.",
      "A rail, post or box within reach to reset on."
    ],
    setup: [
      "Stand on one leg beside a rail, post or box you can use to get back up.",
      "Hold your other leg out in front of you.",
      "Keep your standing heel flat and your standing knee over your toes.",
      "Keep a rail or box in reach for the whole set."
    ],
    steps: [
      "Lower slowly on the standing leg with your heel flat and your knee tracking over your toes.",
      "Stop the descent where your control ends, instead of dropping through the last part.",
      "Reach for the rail, the box or the floor with your free foot, to catch yourself.",
      "Use that support to stand back up, not the working leg, and repeat on the other side."
    ],
    breathing: "Breathe in at the top, then breathe steadily as you lower; don't hold your breath through the descent.",
    tempo: "Lower as slowly as you can control, with no drop at the bottom; the standing back up is only a reset.",
    feel: {
      should: "In the thigh and glute of your standing leg, working hardest through the lower half of the descent.",
      shouldnt: "As a twist at your knee or ankle, or sudden pain at the front of your knee."
    },
    mistakes: [
      { mistake: "You drop through the bottom of the squat.",
        fix: "Stop the rep higher up and catch yourself with your support." },
      { mistake: "You force a depth that hurts.",
        fix: "Stop the lowering at a depth that feels comfortable, and go lower only as control comes." }
    ],
    safety: [
      "Warm up your ankles and knees first, and keep a rail or box in reach for the whole set.",
      "Stop at pain in your knee, hip or ankle, or if your knee twists under you."
    ]
  };

  C.squat_alt_barbell = {
    summary: "A loaded squat with a barbell across your upper back, the heaviest way in this app to train your legs and trunk together.",
    prereq: [
      "A controlled unloaded squat, and a rack and bar set up with someone who has used them.",
      "A rack with safeties set just below your lowest squat."
    ],
    setup: [
      "Set the rack safeties just below your lowest squat, and set the bar at about the height of your upper chest.",
      "Load the bar evenly with plates, and put collars on both ends.",
      "Step under the bar with it resting across your upper back, hands gripping it just wider than your shoulders.",
      "Brace before you unrack, and walk the bar out with short steps into a settled stance."
    ],
    steps: [
      "Brace again, then sit your hips down and back, keeping the bar over the middle of your foot.",
      "Lower to a depth you can control, with your knees tracking over your toes and your chest tall.",
      "Drive through the whole foot to stand, keeping the bar over the same spot.",
      "Walk the bar back in and re-rack it only when it is clearly touching the rack."
    ],
    breathing: "Take a big breath and brace before you descend, hold it through the rep, and breathe out once you are standing again.",
    tempo: "Lower under control, with no dive at the bottom, and drive up smoothly at a speed the bar allows.",
    feel: {
      should: "In your thighs, glutes and trunk together, with the bar still and settled across your back.",
      shouldnt: "As pain in your lower back, a pinching at the front of your hips, or a bar rolling on your neck."
    },
    mistakes: [
      { mistake: "You lose your brace at the bottom.",
        fix: "Take a fresh breath and brace before each descent, and lower the weight until you can keep it." },
      { mistake: "You squat without safeties or a spotter.",
        fix: "Set the safeties just below your lowest squat before you unrack, every time." },
      { mistake: "The bar drifts forward over your toes.",
        fix: "Keep the bar over the middle of your foot, and lower the weight until it stays there." }
    ],
    safety: [
      "A loaded bar is the heaviest thing in this app: use the safeties, and have someone who has used a rack check your setup.",
      "Stop at pain in your knee, hip or lower back, and lower the bar onto the safeties if you can't stand."
    ],
    variations: {
      alternatives: [
        { id: "squat_alt_bulgarianw", text: "With no rack, a weighted Bulgarian split squat with dumbbells loads the same muscles using a bench and dumbbells." }
      ]
    }
  };

  C.squat_alt_cossackw = {
    summary: "A side-to-side squat with one weight held at your chest, sinking over one leg while the other stays long.",
    prereq: [
      "A smooth unweighted Cossack squat, with a comfortable range in your hips and groin.",
      "A clear space to move sideways and set the weight down."
    ],
    setup: [
      "Hold one dumbbell or kettlebell against your chest with both hands.",
      "Take a wide stance with your toes turned slightly out.",
      "Clear the floor on both sides, and put a spot to set the weight down within reach.",
      "Brace your stomach and stand tall before you shift."
    ],
    steps: [
      "Shift your weight onto one leg and squat down over it while the other leg stays long.",
      "Keep the weight close to your chest so it doesn't pull your torso forward.",
      "Sink only as far as your hip allows, with your heel flat on the bending side.",
      "Push back through that foot to the middle, then shift smoothly to the other side."
    ],
    breathing: "Breathe in as you shift and sink, and breathe out as you drive back to the middle.",
    tempo: "Sink slowly, pause briefly at your lowest comfortable point, and push back smoothly without a bounce.",
    feel: {
      should: "In the thigh and glute of the bending leg, and as a stretch along the inside of the long leg.",
      shouldnt: "As a sharp pinch in your groin or hip, or pain at the inside of your knee."
    },
    mistakes: [
      { mistake: "The weight drags your torso forward.",
        fix: "Hold it tight against your chest and keep your chest tall as you sink." },
      { mistake: "You force more depth than your hip can give.",
        fix: "Stop where the hip is comfortable, and let the range grow over time." }
    ],
    safety: [
      "Stop at pain in your groin, knee or hip, and shorten the range instead of forcing the hip.",
      "Use a weight you can set down safely at any point."
    ]
  };

  C.squat_alt_dragonassist = {
    summary: "A one-leg squat where the free leg sweeps behind you, with a rail or post to share your weight while you practise the path.",
    prereq: [
      "A controlled pistol squat or split squat, and a leg path you can run slowly with a hand on a support.",
      "A fixed rail or post at a comfortable reach, and clear floor around it."
    ],
    setup: [
      "Stand on one leg next to a fixed rail or post you can hold with one hand.",
      "Check that the support can't move, and that you can reach it without leaning.",
      "Keep your standing foot flat, and your standing knee over your toes.",
      "Note how much help you use, so you can aim to use less."
    ],
    steps: [
      "Sit down on the standing leg, slowly, with a hand on the support.",
      "Sweep the free leg behind the standing leg as you go down, so you can practise the path.",
      "Let the support take some of your weight, instead of hanging on it.",
      "Stand back up on the same leg, using the support only as much as you need."
    ],
    breathing: "Breathe in as you sink and breathe out as you stand; keep your breathing steady through the leg sweep.",
    tempo: "Move slowly through the whole path, because the point is to rehearse it, and stand without bouncing.",
    feel: {
      should: "In the thigh and glute of your standing leg, with a light, steady hold on the support.",
      shouldnt: "As a twist at your planted knee, or pain in your hip or ankle."
    },
    mistakes: [
      { mistake: "You twist the planted knee as the other leg passes behind.",
        fix: "Keep your knee over your toes, and shorten the range until it stays there." },
      { mistake: "You let the support slip, or hang on it.",
        fix: "Use a fixed support, and hold it lightly, only as much as the balance needs." }
    ],
    safety: [
      "The planted knee turns under load here: stop at pain in your knee, hip or ankle.",
      "Shrink the range instead of forcing it, and keep the support within reach."
    ]
  };

  C.squat_alt_dragon = {
    summary: "A one-leg squat where the free leg sweeps behind you as you sink, an expert move that asks for balance and hip control.",
    prereq: [
      "A strong assisted dragon squat, with steady balance, hip rotation and knee control.",
      "Open floor with a support within reach, and a coach or spotter if you can."
    ],
    setup: [
      "Stand on one leg in open space, with a rail, post or wall within reach.",
      "Keep your standing foot flat, with your standing knee over your toes.",
      "Don't force any rotation: the leg path should feel comfortable at every point.",
      "Warm up your hips, knees and ankles before you start."
    ],
    steps: [
      "Sit down on the standing leg while the other leg sweeps behind it.",
      "Keep your working knee over its toes, and control the depth.",
      "Stop where your balance and your knee stay in control, and no lower.",
      "Stand back up without hopping or swinging the free leg."
    ],
    breathing: "Breathe in as you sink, hold a light brace at the bottom, and breathe out as you stand.",
    tempo: "Move slowly through the whole path, with no drop at the bottom and no swing to stand.",
    feel: {
      should: "In the thigh and glute of your standing leg, with your balance working through your whole foot.",
      shouldnt: "As a twist or pinch at your knee, hip or ankle."
    },
    mistakes: [
      { mistake: "You force the knee to twist.",
        fix: "Keep your knee over your toes, and go back to the assisted version if it won't stay there." },
      { mistake: "You lose balance because the free leg swings.",
        fix: "Sweep the free leg slowly and keep a support within reach." }
    ],
    safety: [
      "This move rotates your knee and hip under load: stop at any pain in your knee, hip or ankle, and never force the rotation.",
      "Keep a support within reach, and go back to the assisted version when your control fades."
    ]
  };

  C.hinge_alt_nordicband = {
    summary: "A Nordic curl where a band takes part of your weight, so you can lower further than you could unassisted and at a steady pace.",
    prereq: [
      "A controlled Nordic lowering with steady knees, even if your hands catch you early.",
      "A secure ankle anchor and a secure anchor point for the band, both checked before you start."
    ],
    setup: [
      "Pad your knees on a mat or folded towel, and fix your ankles under a secure anchor.",
      "Attach the band to a secure point in front of you so it takes part of your weight as you lower.",
      "Start with a heavier band, which gives more help, and use the same band and the same setup every time.",
      "Keep clear floor in front of you, in case you need to catch yourself."
    ],
    steps: [
      "Straighten your body into one line from knees to head, with your hips open.",
      "Lower forward with your hamstrings holding you back, and let the band slow the descent.",
      "Keep your hips steady, and your body in that one line, all the way down.",
      "Catch yourself with your hands if you need to, then push back up."
    ],
    breathing: "Breathe in at the top, breathe steadily as you lower without holding your breath, and breathe out as you push back up.",
    tempo: "Lower as slowly as the band lets you control; the lowering is the exercise, and the return is only a reset.",
    feel: {
      should: "In the backs of your thighs, working the whole way down while the band takes some of the load.",
      shouldnt: "As a sharp or pulling pain in the back of your thigh, or pain in your knees from the floor."
    },
    mistakes: [
      { mistake: "The band recoils you upward faster than you can control.",
        fix: "Use a lighter band, or a shorter range, and lower at a pace you can hold." },
      { mistake: "You change the assistance from one rep to the next.",
        fix: "Use the same band, anchor and distance every time, and change only one thing at once." }
    ],
    safety: [
      "Inspect the ankle anchor and the band's anchor before every set, because either one letting go is a fall.",
      "Stop at a sharp or pulling feeling in a hamstring, or at pain in your knees."
    ]
  };

  C.hinge_alt_nordicarm = {
    summary: "A Nordic curl where you lower forward and catch yourself softly with your hands, using them only as much as you need.",
    prereq: [
      "A controlled Nordic lowering where your hands catch you, and steady knees.",
      "A secure ankle anchor, padded knees and clear floor in front of you."
    ],
    setup: [
      "Pad your knees on a mat or folded towel, and fix your ankles under a secure anchor.",
      "Check that the anchor can't lift or slide, and that nothing is in front of your hands.",
      "Kneel tall with your hips open and your hands in front of your chest.",
      "Leave clear floor ahead of you for your hands to land on."
    ],
    steps: [
      "Straighten your body into one line from knees to head.",
      "Lower forward with your hamstrings holding you back, for as long as you can.",
      "Catch the floor softly with your hands, and use them only as much as you need.",
      "Push back to the start, and ask your hands for a little less each time."
    ],
    breathing: "Breathe in at the top, breathe steadily as you lower, and breathe out as you push back up.",
    tempo: "Lower as slowly as you can control, catch softly instead of crashing, and treat the push back as a reset.",
    feel: {
      should: "In the backs of your thighs, working hard as you lower, with your hands only softening the catch.",
      shouldnt: "As a sharp or pulling pain in the back of your thigh, or pain in your knees."
    },
    mistakes: [
      { mistake: "You collapse onto your hands.",
        fix: "Slow the lowering and catch earlier, at the point where your hamstrings can still hold you." },
      { mistake: "The return becomes a push-up while your hamstrings sit idle.",
        fix: "Push back with your hands only as much as needed, and keep your hips open as you return." }
    ],
    safety: [
      "Inspect the ankle anchor before every set, and pad your knees.",
      "Stop at a sharp or pulling feeling in a hamstring, or at pain in your knees."
    ]
  };

  C.core_alt_onefoot = {
    summary: "A plank with one foot lifted just off the floor, which makes your trunk resist the urge to twist toward the lifted side.",
    prereq: [
      "A steady standard plank where your hips stay still when you shift.",
      "Enough floor around you to place both feet and lift one."
    ],
    setup: [
      "Take a standard plank with your hands or forearms under your shoulders.",
      "Step your feet back until your body is one line from ears to heels.",
      "Tilt your pelvis under slightly and squeeze your glutes before you lift anything.",
      "Practise both sides, and swap the lifted foot between sets."
    ],
    steps: [
      "Brace your stomach and hold the plank still.",
      "Lift one foot a few centimetres off the floor, no higher.",
      "Keep your hips level, so your pelvis doesn't rotate toward the lifted side.",
      "Hold the line still, then lower the foot before your hips start to twist."
    ],
    breathing: "Breathe shallowly and steadily through the hold without letting go of your brace; never hold your breath.",
    tempo: "Lift the foot slowly, hold the position still, and lower it with the same control.",
    feel: {
      should: "Across your stomach and the side of your hips, with the standing leg's glute working to keep you level.",
      shouldnt: "In your lower back, which means your hips are sagging or your leg is too high."
    },
    mistakes: [
      { mistake: "Your pelvis rotates open as the foot lifts.",
        fix: "Lift the foot lower, and squeeze your glutes to keep your hips square to the floor." },
      { mistake: "You raise the leg high, which arches your lower back.",
        fix: "Keep the foot just off the floor, and tuck your pelvis under." }
    ],
    safety: [
      "If your lower back aches, tuck your pelvis harder; if it still aches, end the hold there.",
      "Stop at neck strain or pain in your shoulders, and go back to the plain plank."
    ]
  };

  C.core_alt_plankweighted = {
    summary: "A plank with a snug weighted vest on, which asks your trunk to resist sagging under a load you can raise a step at a time.",
    prereq: [
      "A solid standard plank, with your lower back quiet.",
      "A fitted weighted vest that can't shift as you move."
    ],
    setup: [
      "Fit the weighted vest snugly, so it can't slide or swing.",
      "Brace your trunk before you take your plank position, not after.",
      "Place your forearms or hands under your shoulders and step your feet back into one line from ears to heels.",
      "Start with a small load, and add the smallest step in weight over time."
    ],
    steps: [
      "Brace first, then take your plank position with the vest on.",
      "Keep your pelvis level and your ribs down, so your lower back doesn't sag.",
      "Hold the line still, with your glutes squeezed.",
      "Come down before the form goes, not after."
    ],
    breathing: "Breathe shallowly and steadily through the hold without letting go of your brace; never hold your breath.",
    tempo: "There's no movement: set the position, then hold it still until you stop, and lower under control.",
    feel: {
      should: "Across your stomach, with your glutes and shoulders working to keep the line straight under the extra weight.",
      shouldnt: "In your lower back, which means your hips are sagging under the load."
    },
    mistakes: [
      { mistake: "A loose load slides across your back.",
        fix: "Fit the vest tighter, or use a lighter, better-fitting load." },
      { mistake: "Your lower back arches under the weight.",
        fix: "Tuck your pelvis harder and lower the load until your line stays straight." }
    ],
    safety: [
      "Stop at low-back pain or neck strain, take the weight off, and go back to the plain plank.",
      "Add load only once your plank stays clean, and in the smallest steps you have."
    ]
  };

  C.core_alt_hollowrock = {
    summary: "Rocking forward and back in a hollow body hold, as one rigid shape, so your stomach keeps the curve while you move.",
    prereq: [
      "A steady hollow body hold, with your lower back flat.",
      "A firm, lightly padded floor with room to rock."
    ],
    setup: [
      "Lie on your back on a firm, lightly padded floor with room behind and ahead of you.",
      "Take a hollow body hold: lower back pressed flat, arms overhead, legs straight and low.",
      "Keep your head and neck relaxed, with your chin slightly tucked.",
      "Brace your stomach before you start to rock."
    ],
    steps: [
      "Hold the hollow shape, with your lower back pressed into the floor.",
      "Rock backward a little, as one rigid shape.",
      "Rock forward again, keeping the brace and the same curve.",
      "Keep rocking in small, even beats, and stop when the shape breaks."
    ],
    breathing: "Breathe shallowly and steadily without letting go of your brace, and don't hold your breath.",
    tempo: "Rock smoothly and evenly, as one shape, with no sudden kick of the legs or snap of the neck.",
    feel: {
      should: "Across your stomach and the fronts of your hips, with your lower back staying pressed down.",
      shouldnt: "In your lower back, which lifts, or in your neck, which snaps with each rock."
    },
    mistakes: [
      { mistake: "You kick your legs independently of your trunk.",
        fix: "Rock as one shape, and bend your knees if the shape won't hold." },
      { mistake: "Your neck snaps on every rock.",
        fix: "Keep your chin slightly tucked and your neck relaxed, and make the rock smaller." }
    ],
    safety: [
      "Go slowly, and stop at neck strain, dizziness or tingling.",
      "Stop at low-back pain, and go back to the hollow body hold."
    ]
  };

  C.core_alt_floorlsit = {
    summary: "Pressing the floor away to lift your thighs and heels, with no handles under you, and holding that L shape.",
    prereq: [
      "A steady L-sit on parallettes or a bench, with enough hip compression to lift from the floor.",
      "A flat floor with room for your fingers to point forward."
    ],
    setup: [
      "Sit on a flat floor with your legs straight in front of you.",
      "Place your hands beside your hips with your fingers pointing forward and spread.",
      "Press the floor down hard and straighten your elbows.",
      "Check how your wrists feel before you lift, since hand shape changes how high you can go."
    ],
    steps: [
      "Press down through your hands and lift your thighs actively to get your heels off the floor.",
      "Keep your legs straight and your elbows locked.",
      "Hold that shape with your shoulders pushed down away from your ears.",
      "Lower under control, before your heels drag along the floor."
    ],
    breathing: "Breathe in short, steady breaths through the hold; don't hold your breath.",
    tempo: "Lift smoothly, hold the shape still, and lower with control; a short clean hold beats a long one with dragging heels.",
    feel: {
      should: "Across your stomach and the fronts of your hips, with your shoulders and triceps pressing you up.",
      shouldnt: "As sharp pain in your wrists or shoulders, or a pinch at the front of your hips."
    },
    mistakes: [
      { mistake: "Your heels drag along the floor.",
        fix: "Press the floor harder and lift your thighs, or bend your knees for a smaller lift." },
      { mistake: "You force your wrists past a comfortable bend.",
        fix: "Turn your hands slightly, or use handles or parallettes until your wrists feel fine." }
    ],
    safety: [
      "Stop at wrist or shoulder pain, or a pinching at the front of your hip.",
      "Bend your knees or lift a smaller amount instead of forcing the position."
    ]
  };

  C.core_alt_chairlegraise = {
    summary: "Supporting yourself between two chairs and raising your legs, so your arms hold you up while your stomach lifts the legs.",
    prereq: [
      "A steady support on two chairs, and a controlled knee raise.",
      "Two heavy, non-slip chairs at the same height, with room for your legs to travel."
    ],
    setup: [
      "Set two heavy, non-slip chairs at the same height, a little wider than your hips.",
      "Check that neither chair can slide or tip before you take your weight.",
      "Place your hands on the seats and press down through locked arms.",
      "Leave clear space in front of you so your legs can travel."
    ],
    steps: [
      "Press down through your hands until your arms are straight and your shoulders are away from your ears.",
      "Raise your legs without swinging, with your knees bent at first.",
      "Keep your torso still and your elbows straight as the legs rise.",
      "Lower the legs under control before the next rep."
    ],
    breathing: "Breathe out as you raise your legs and in as you lower them; keep your brace through the whole rep.",
    tempo: "Raise the legs smoothly with no swing, pause briefly at the top, and lower more slowly than you lifted.",
    feel: {
      should: "Across your stomach and the fronts of your hips, with your shoulders and triceps holding you up.",
      shouldnt: "As pain in your wrists or shoulders, or a pinch at the front of your hips."
    },
    mistakes: [
      { mistake: "You bend your elbows as your legs rise.",
        fix: "Press down harder through straight arms, and raise your knees a smaller amount." },
      { mistake: "You swing your legs for momentum.",
        fix: "Raise them slowly with your knees bent, and keep your torso still." }
    ],
    safety: [
      "Check that the chairs can't slide or tip before you take your weight.",
      "Stop at wrist or shoulder pain, or a pinching at the hip, and bend your knees."
    ],
    variations: {
      alternatives: [
        { id: "core_alt_pikelift", text: "With no chairs, a seated pike leg lift on the floor works the same hip compression with less demand on your arms." }
      ]
    }
  };

  C.core_alt_pikelift = {
    summary: "Sitting tall with your legs straight and lifting one leg at a time, to train active hip compression on the floor.",
    prereq: [
      "You can sit tall with your legs straight and lift one leg with control.",
      "A firm floor, with blocks beside your thighs if your hands don't reach comfortably."
    ],
    setup: [
      "Sit tall on a firm floor with your legs straight in front of you.",
      "Place your hands beside your thighs, on the floor or on blocks.",
      "Press your hands down and sit up tall, without leaning far back.",
      "Bend your knee a little if your back rounds as you reach your legs out."
    ],
    steps: [
      "Lift one leg, keeping it straight, without leaning back.",
      "Hold it up for a moment, with your back tall.",
      "Lower the leg without bouncing your heel off the floor.",
      "Lift the other leg, and alternate sides."
    ],
    breathing: "Breathe out as you lift the leg and in as you lower it; don't hold your breath.",
    tempo: "Lift slowly and lower slowly, with no bounce of the heel at the bottom.",
    feel: {
      should: "In the front of your hip and your stomach, as you lift the leg actively.",
      shouldnt: "As a pinch at the front of your hip, or pain in your wrists or lower back."
    },
    mistakes: [
      { mistake: "You round your back to fake the height.",
        fix: "Sit tall, and bend the knee until you can lift the leg while keeping your back tall." },
      { mistake: "You bounce your heels off the floor.",
        fix: "Lower slowly and place the heel down gently before the next lift." }
    ],
    safety: [
      "Stop at wrist or shoulder pain, or a pinching at the front of your hip.",
      "Bend the knee, or lift a smaller amount, instead of forcing the height."
    ]
  };

  C.core_alt_hangknee = {
    summary: "Hanging from a bar and raising your knees toward your chest, which trains your stomach and hip flexors with your grip holding you.",
    prereq: [
      "A comfortable hang from a fixed bar, and the ability to raise your knees without swinging.",
      "A fixed bar with clear space around your body, and a step for getting down."
    ],
    setup: [
      "Hang from a fixed bar with a step nearby for getting down.",
      "Check that the bar is fixed and that nothing is in front of your legs.",
      "Set your shoulders down, away from your ears, with your arms straight.",
      "Let any swing settle before your first rep."
    ],
    steps: [
      "Tilt your pelvis gently and raise your knees toward your chest.",
      "Lift without kicking, so your body doesn't swing.",
      "Pause for a moment at the top, with your shoulders still.",
      "Lower the knees under control, and let the swing settle before the next rep."
    ],
    breathing: "Breathe out as you raise your knees and in as you lower them; don't hold your breath.",
    tempo: "Raise the knees smoothly, pause briefly, and lower them more slowly than you lifted.",
    feel: {
      should: "In your stomach and the fronts of your hips, with your grip and shoulders holding you steady.",
      shouldnt: "As pain in your shoulders or wrists, or a pull in your lower back."
    },
    mistakes: [
      { mistake: "You kip through the reps.",
        fix: "Let the swing settle before each rep, and raise your knees slowly." },
      { mistake: "Your grip gives out before your stomach does.",
        fix: "End the set when your grip tires, or use straps or a hold you can keep, and rest more." }
    ],
    safety: [
      "Stop at shoulder or wrist pain, a failing grip, or low-back pain, and do a floor leg raise instead.",
      "Use a step to get down, rather than dropping from the bar."
    ],
    variations: {
      alternatives: [
        { id: "core_alt_lyingleg", text: "With no bar, a lying leg raise on the floor trains the same hip flexion with no grip needed." }
      ]
    }
  };

  C.core_alt_hangleg = {
    summary: "Hanging from a bar and lifting your straight legs forward, a longer lever than the knee raise that asks for more stomach control.",
    prereq: [
      "A stable hang and steady hanging knee raises.",
      "A fixed bar with clear space in front of your legs."
    ],
    setup: [
      "Hang from a fixed bar with clear space in front of your legs.",
      "Check that the bar is fixed, and keep a step nearby to get down.",
      "Set your shoulders down, away from your ears, with your arms straight.",
      "Let any swing settle before your first rep, and decide to keep it strict."
    ],
    steps: [
      "Lift your straight legs as high as you can control, without swinging.",
      "Keep your shoulders from shrugging up toward your ears.",
      "Pause briefly at the top, with your legs together.",
      "Lower your legs slowly, and let the swing settle before the next rep."
    ],
    breathing: "Breathe out as you lift your legs and in as you lower them; don't hold your breath.",
    tempo: "Lift without throwing your legs, pause briefly, and lower more slowly than you lifted.",
    feel: {
      should: "Through your stomach and the fronts of your hips, with your lats keeping your shoulders down.",
      shouldnt: "As pain in your shoulders or wrists, or a pull in your lower back."
    },
    mistakes: [
      { mistake: "You throw your legs up with momentum.",
        fix: "Let the swing settle before each rep, and lift only as high as you can control." },
      { mistake: "You shrug passively into your shoulders.",
        fix: "Press your shoulders down away from your ears before you lift." }
    ],
    safety: [
      "Stop at shoulder or wrist pain, a failing grip, or low-back pain, and do a floor leg raise instead.",
      "Use a step to get down, rather than dropping from the bar."
    ]
  };

  C.core_alt_t2b = {
    summary: "Hanging from a bar and lifting your straight legs all the way until your toes touch it, a strict stomach and hip-compression move.",
    prereq: [
      "A stable hanging straight-leg raise, and enough flexibility in your hamstrings and hips to reach the bar.",
      "A high bar with clear space in front of and behind your legs."
    ],
    setup: [
      "Hang from a high bar with clear space in front of and behind your legs.",
      "Check that the bar is fixed, and keep a step nearby to get down.",
      "Set your shoulders down, away from your ears, with your arms straight.",
      "Decide to keep it strict: no deliberate kip."
    ],
    steps: [
      "Compress your hips and lift your straight legs toward the bar.",
      "Reach until your toes touch it, without yanking on your shoulders.",
      "Pause briefly if you can, with your body quiet.",
      "Lower under control instead of dropping, then let the swing settle."
    ],
    breathing: "Breathe out as you lift your legs and in as you lower them; don't hold your breath.",
    tempo: "Lift smoothly and strictly, touch the bar, and lower more slowly than you lifted.",
    feel: {
      should: "Through your stomach and the fronts of your hips, with your lats and grip holding you steady.",
      shouldnt: "As pain in your shoulders or wrists, or a pull in your lower back."
    },
    mistakes: [
      { mistake: "You kip by accident as your legs drop.",
        fix: "Lower slowly and let the swing settle fully before the next rep." },
      { mistake: "You yank on your shoulders to pull your feet up.",
        fix: "Press your shoulders down first, and drive your toes up with your stomach and hips." }
    ],
    safety: [
      "Stop at shoulder or wrist pain, a failing grip, or low-back pain, and use a controlled floor variation.",
      "Use a step to get down, rather than dropping from the bar."
    ]
  };

  C.core_alt_lyingleg = {
    summary: "Lying on your back and raising your straight legs, then lowering them only as far as your lower back stays down.",
    prereq: [
      "You can lie flat and lower your legs without your trunk shifting.",
      "A firm floor, with a mat if you like."
    ],
    setup: [
      "Lie on your back on a firm floor, with a mat if you like.",
      "Place your arms by your sides, or your hands under your hips.",
      "Press your lower back gently toward the floor before you start.",
      "Bend your knees to shorten the lever whenever your back lifts."
    ],
    steps: [
      "Press your lower back toward the floor and raise your legs.",
      "Keep your trunk steady as the legs rise toward the ceiling.",
      "Lower your legs slowly, only as far as your lower back stays down.",
      "Raise them again from that point, without swinging."
    ],
    breathing: "Breathe out as you raise your legs and in as you lower them; keep your brace through the whole rep.",
    tempo: "Raise the legs smoothly and lower them slowly, with no swing at the bottom.",
    feel: {
      should: "Across your stomach and the fronts of your hips, with your lower back staying pressed down.",
      shouldnt: "In your lower back, which lifts off the floor, or in your neck, which strains."
    },
    mistakes: [
      { mistake: "Your lower back lifts off the floor as you lower.",
        fix: "Stop the lowering higher up, or bend your knees to shorten the lever." },
      { mistake: "You swing your legs up with momentum.",
        fix: "Pause at the bottom, and raise them slowly from a still start." }
    ],
    safety: [
      "Stop at low-back pain or neck strain, and bend your knees.",
      "Lower only as far as your back stays down, and no further."
    ]
  };

  C.core_alt_situp = {
    summary: "Curling all the way up from lying to sitting, then lowering back down, a trunk-flexion move done without anyone holding your feet.",
    prereq: [
      "You can curl your trunk up from the floor without neck strain.",
      "A lightly padded floor, with nothing holding your feet down."
    ],
    setup: [
      "Lie on your back on a lightly padded floor, with your knees bent and your feet flat.",
      "Leave your feet free: don't anchor them under anything.",
      "Cross your arms over your chest, or rest your hands lightly by your ears.",
      "Keep your neck relaxed, with your chin slightly tucked."
    ],
    steps: [
      "Curl up smoothly, one section of your back at a time, until you are sitting.",
      "Keep your neck relaxed, and don't pull on your head.",
      "Pause briefly at the top, with your back tall.",
      "Lower with the same control, without bouncing off the floor."
    ],
    breathing: "Breathe out as you curl up and in as you lower; don't hold your breath.",
    tempo: "Curl up smoothly and lower with the same control, with no bounce at the bottom.",
    feel: {
      should: "Across your stomach, and at the fronts of your hips as you reach sitting.",
      shouldnt: "In your neck, which means you are pulling on your head, or in your lower back."
    },
    mistakes: [
      { mistake: "You pull on your head or neck.",
        fix: "Cross your arms over your chest, and keep your chin slightly tucked." },
      { mistake: "You bounce off the floor to get started.",
        fix: "Pause at the bottom, and start each rep from a still, relaxed position." }
    ],
    safety: [
      "Go slowly, and stop at neck or back pain, dizziness or tingling.",
      "Avoid pulling on your head, and choose a shorter range, like a crunch, if you need one."
    ]
  };

  C.core_alt_crunch = {
    summary: "Curling just your head, neck and shoulders off the floor, the smallest trunk-flexion move and the easiest one on your neck.",
    prereq: [
      "You can curl your upper trunk gently without pulling on your neck.",
      "A lightly padded floor, with your knees comfortable."
    ],
    setup: [
      "Lie on your back with your knees bent and your feet flat on the floor.",
      "Rest your hands lightly by your ears, or across your chest.",
      "Keep your neck long, with your chin slightly tucked.",
      "Don't anchor your feet under anything."
    ],
    steps: [
      "Lift just your head, neck and shoulders off the floor, breathing out as you curl.",
      "Keep your neck long, and don't pull on it with your hands.",
      "Pause briefly at the top, with your lower back still on the floor.",
      "Lower slowly, without letting your head drop."
    ],
    breathing: "Breathe out gently as you curl up and in as you lower; don't hold your breath.",
    tempo: "Curl up smoothly, pause briefly, and lower more slowly than you lifted.",
    feel: {
      should: "Across the front of your stomach, near your ribs.",
      shouldnt: "In your neck, which means you are pulling on your head, or in your lower back."
    },
    mistakes: [
      { mistake: "You pull your head forward with your hands.",
        fix: "Rest your hands lightly by your ears, or cross them over your chest." },
      { mistake: "You turn the crunch into a full sit-up.",
        fix: "Lift only your head, neck and shoulders, and keep your lower back on the floor." }
    ],
    safety: [
      "Go slowly, and stop at neck or back pain, dizziness or tingling.",
      "Avoid pulling on your head, and choose a shorter range if you need one."
    ]
  };

  C.core_alt_bicycle = {
    summary: "A crunch that turns your chest toward the opposite knee as your legs alternate, trained slowly so your trunk does the turning.",
    prereq: [
      "A controlled crunch, and comfortable turning your trunk with your hips still.",
      "A lightly padded floor with room for your legs to alternate."
    ],
    setup: [
      "Lie on your back with your hands lightly by your ears and your knees raised.",
      "Keep your elbows wide, rather than pulling them toward your knees.",
      "Keep your neck long, with your chin slightly tucked.",
      "Leave room for your legs to alternate without hitting anything."
    ],
    steps: [
      "Curl up and turn your chest toward the opposite knee as it comes in.",
      "Extend the other leg at the same time, with your elbows wide.",
      "Switch sides slowly, turning your chest each time.",
      "Keep your neck long and don't drag your elbows toward your knees."
    ],
    breathing: "Breathe out as you turn toward each knee and in as you switch; keep it steady and slow.",
    tempo: "Switch sides slowly, so that your trunk does the turning, not the fast pedalling of your legs.",
    feel: {
      should: "Across your stomach and along your sides, as your trunk turns.",
      shouldnt: "In your neck, which means you are pulling with your elbows, or in your lower back."
    },
    mistakes: [
      { mistake: "You yank an elbow toward the knee.",
        fix: "Keep your elbows wide and turn your chest, not your arms." },
      { mistake: "You pedal fast with no trunk rotation.",
        fix: "Slow down, and turn your chest toward each knee as it comes in." }
    ],
    safety: [
      "Go slowly, and stop at neck or back pain, dizziness or tingling.",
      "Avoid pulling on your head, and slow the movement down."
    ]
  };

  C.core_alt_legshold = {
    summary: "Lying on your back and holding your straight legs raised, with your lower back kept where it started.",
    prereq: [
      "You can hold your straight legs raised while your back stays comfortable.",
      "A firm floor, with a mat if you like."
    ],
    setup: [
      "Lie on your back with your legs straight, on a firm floor.",
      "Raise your legs to an angle you can hold with your lower back comfortable.",
      "Note the angle you used, because lower legs are harder, and keep it the same each time.",
      "Rest your hands by your sides or under your hips."
    ],
    steps: [
      "Brace your trunk, so your lower back stays where it started.",
      "Raise your straight legs to your chosen angle.",
      "Hold the position still, breathing through it instead of tensing your neck.",
      "Lower your legs under control, before your back arches."
    ],
    breathing: "Breathe steadily through the hold, without letting go of your brace; don't hold your breath.",
    tempo: "There's no movement: set the angle, then hold it still until you stop, and lower under control.",
    feel: {
      should: "Across your stomach and the fronts of your hips, with your lower back staying flat.",
      shouldnt: "In your lower back, which arches, or in your neck, which tenses."
    },
    mistakes: [
      { mistake: "Your lower back arches as your legs tire.",
        fix: "Raise your legs higher, or bend your knees, so your back stays where it started." },
      { mistake: "You tense your neck.",
        fix: "Let your head rest on the floor, and breathe steadily through the hold." }
    ],
    safety: [
      "Stop at low-back pain or neck strain, and bend your knees or raise your legs.",
      "Keep your lower back where it started, and end the hold when it moves."
    ]
  };

  C.core_alt_flutter = {
    summary: "Lying on your back with your legs just off the floor, kicking them up and down in small alternating beats.",
    prereq: [
      "A controlled straight-leg hold, with your lower back still as your legs alternate.",
      "Open floor, with a mat if you like."
    ],
    setup: [
      "Lie on your back on an open floor, with your legs straight.",
      "Raise your legs just off the floor, and put your hands under your hips if it helps.",
      "Note how high you hold your legs, and keep it the same from one set to the next.",
      "Press your lower back toward the floor before you start."
    ],
    steps: [
      "Brace your trunk, so your lower back stays where it started.",
      "Kick your legs up and down in small, alternating beats.",
      "Keep your trunk still, with your lower back in the same place.",
      "End the set when your lower back starts to arch."
    ],
    breathing: "Breathe steadily through the whole set, in time with the kicks if you like; don't hold your breath.",
    tempo: "Keep the kicks small and even, and steady enough that your trunk never moves with them.",
    feel: {
      should: "Across your stomach and the fronts of your hips, with your lower back staying flat.",
      shouldnt: "In your lower back, which arches, or in your neck, which tenses."
    },
    mistakes: [
      { mistake: "You make large swinging kicks.",
        fix: "Keep the kicks small, and the movement coming from your hips, not your knees." },
      { mistake: "Your lower back arches as your legs tire.",
        fix: "Raise your legs higher, or bend your knees, so your back stays where it started." }
    ],
    safety: [
      "Stop at low-back pain or neck strain, and raise your legs or bend your knees.",
      "End the set when your lower back starts to arch."
    ]
  };

  C.core_alt_abwheelknee = {
    summary: "Kneeling and rolling an ab wheel out in front of you, then pulling it back, so your trunk resists your back sagging.",
    prereq: [
      "A steady plank, and a short rollout where your back doesn't sag.",
      "A non-slip floor, a pad for your knees, and ideally a wall to limit how far you roll."
    ],
    setup: [
      "Kneel on a pad on a non-slip floor, with the wheel on the floor under your shoulders.",
      "Put a wall ahead of you if you want to limit how far the wheel can go.",
      "Hold the wheel's handles with both hands, with your arms straight.",
      "Brace your stomach before you roll, and keep your ribs and hips in line."
    ],
    steps: [
      "Roll the wheel out slowly, keeping your ribs and hips in line.",
      "Stop at the point where your back is still flat, and no further.",
      "Pause briefly, with your stomach braced.",
      "Pull the wheel back with your trunk, not by pushing your hips back."
    ],
    breathing: "Breathe in and brace before you roll, hold the brace as you roll out, and breathe out as you pull back.",
    tempo: "Roll out slowly, pause briefly, and pull back at the same pace, with no sudden drop at the far end.",
    feel: {
      should: "Across your stomach, with your lats and shoulders working to steer the wheel.",
      shouldnt: "In your lower back, which sags, or as pain in your wrists or shoulders."
    },
    mistakes: [
      { mistake: "You roll out further than you can pull back from.",
        fix: "Roll out only as far as your back stays flat, and use a wall to mark the limit." },
      { mistake: "Your lower back sags.",
        fix: "Brace harder before you roll, and shorten the roll until your back stays flat." }
    ],
    safety: [
      "The wheel loads your wrists and shoulders as well as your trunk: stop at low-back, wrist or shoulder pain, and shorten the roll.",
      "Roll only as far as you can pull back from, and use a non-slip floor."
    ]
  };

  C.core_alt_abwheelstand = {
    summary: "Standing and rolling an ab wheel out in front of you, a long lever that asks for full trunk control and a roll you stop short.",
    prereq: [
      "Strong kneeling rollouts, with full trunk control through the whole range.",
      "A non-slip floor and a clear path ahead of you, with a wall or mark to limit the roll."
    ],
    setup: [
      "Stand with the wheel on a non-slip floor in front of your feet, with a clear path ahead.",
      "Mark or use a wall to limit how far you roll, and keep to that limit.",
      "Hold the wheel's handles with both hands, and stand tall with your stomach braced.",
      "Check the floor isn't slick, because a slipping wheel is a fall."
    ],
    steps: [
      "Brace and keep your ribs and pelvis connected as you roll.",
      "Roll out only as far as your brace holds, and stop short of where it goes.",
      "Pause briefly, with your stomach still braced.",
      "Pull back with your trunk and stand up without a sudden arch."
    ],
    breathing: "Breathe in and brace before you roll, hold the brace as you roll out, and breathe out as you pull back.",
    tempo: "Roll out slowly, with no drop at the far end, and pull back at the same pace.",
    feel: {
      should: "Across your whole stomach, with your lats and shoulders steering the wheel.",
      shouldnt: "In your lower back, which arches suddenly, or as pain in your wrists or shoulders."
    },
    mistakes: [
      { mistake: "Your lower back suddenly arches.",
        fix: "Roll out a shorter distance, and keep your ribs and pelvis connected." },
      { mistake: "The wheel slips on a slick floor.",
        fix: "Use a non-slip surface, and roll out only as far as you can control." }
    ],
    safety: [
      "Stop at low-back, wrist or shoulder pain, and shorten the roll.",
      "Stop short of the point where your brace goes, and use a non-slip floor."
    ]
  };
})();
