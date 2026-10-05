/* =====================================================================
   WELLNESS HUB · EXERCISE GUIDES · BATCH C2 — lower-body and trunk coverage
   ---------------------------------------------------------------------
   · The written guide for each exercise in the quad, hamstring, calf,
     shin, adductor, abductor, antirot and backext slots (plan E2).
     Written by step 4.7.
   · Schema and style rules: fitness/content/STYLE.md. Checked by
     tools/check-exercise-content.js.
   · No prescriptions here: rep ranges, hold times and when to step up
     come from training.js, never from this text.
   Public: window.EXERCISE_CONTENT[id], window.EXERCISE_CONTENT_BATCHES.c2
   ===================================================================== */
(function () {
  "use strict";
  var C = window.EXERCISE_CONTENT = window.EXERCISE_CONTENT || {};
  var B = window.EXERCISE_CONTENT_BATCHES = window.EXERCISE_CONTENT_BATCHES || {};
  B.c2 = "complete";

  /* ---- quad ---- */

  C.acc_quad_wallsit = {
    summary: "A timed hold against a wall with your thighs close to parallel with the floor, working your quads without any movement.",
    setup: [
      "Stand with your back flat against a smooth wall and walk your feet forward about 60 cm, hip-width apart.",
      "Check that the floor isn't slippery, because your feet carry the load and the wall only steadies you.",
      "Let your arms hang by your sides rather than resting on your legs."
    ],
    steps: [
      "Slide your back down the wall until your thighs are as close to parallel with the floor as you can manage.",
      "Check that your knees sit over your ankles and point the same way as your toes.",
      "Press your lower back and shoulders into the wall.",
      "Hold the position, breathing steadily, then slide up the wall slowly to finish."
    ],
    breathing: "Breathe slowly and steadily through the hold, and let each exhale relax your face and shoulders.",
    tempo: "Slide down smoothly, hold completely still, and slide up slowly instead of pushing off the wall in one jerk.",
    feel: {
      should: "Across the front of your thighs, building to a steady burn as the hold goes on.",
      shouldnt: "As pressure at the front of your knees, or as an arch in your lower back away from the wall."
    },
    mistakes: [
      { mistake: "You rest your hands on your thighs, which takes the load off them.",
        fix: "Let your arms hang by your sides or fold them across your chest." },
      { mistake: "Your knees drift inward or sit far past your toes.",
        fix: "Walk your feet a little farther out and keep your knees pointing the same way as your toes." },
      { mistake: "You creep up the wall as the hold goes on.",
        fix: "Start a little higher so you can keep the same depth to the end." }
    ],
    safety: [
      "Sit higher if the front of your knee aches; a shallower angle is still the same exercise.",
      "Stand up before your legs shake hard, and slide up slowly instead of dropping."
    ]
  };

  C.acc_quad_revlunge = {
    summary: "A lunge where you step backward and lower until the back knee hovers above the floor, working the quads of the front leg one side at a time.",
    setup: [
      "Stand tall with your feet hip-width apart, close enough to a wall or a chair back to take a hand for balance.",
      "Leave room behind you for a long stride.",
      "Brace your stomach lightly and keep your chest up."
    ],
    steps: [
      "Step one foot back in a long stride, landing on the ball of the foot.",
      "Lower straight down until the back knee hovers just above the floor.",
      "Keep your front foot flat, with most of your weight through the front heel and your torso upright.",
      "Press through the front foot to bring the back foot in to meet it.",
      "Do the set on one leg, then switch to the other."
    ],
    breathing: "Breathe in as you step back and lower, and breathe out as you press back up to standing.",
    tempo: "Step back smoothly, lower for about two seconds, and drive up without bouncing at the bottom.",
    feel: {
      should: "In the thigh and glute of the front leg, with the back leg mostly helping you balance.",
      shouldnt: "As a pinch at the front of the knee, or as most of the effort coming from the back foot."
    },
    mistakes: [
      { mistake: "You step back too short, which pushes the front knee far past your toes.",
        fix: "Take a longer stride so your front shin stays close to vertical at the bottom." },
      { mistake: "You push off the back foot to stand up.",
        fix: "Treat the back foot as a kickstand and drive up through the front heel." }
    ],
    safety: [
      "Keep a hand on a wall or a chair until the balance feels steady.",
      "Shorten the depth if your front knee complains, and stop if the pain is sharp."
    ]
  };

  C.acc_quad_stepup = {
    summary: "A single-leg climb onto a stair or a sturdy step, where the front leg lifts your whole body and lowers it again under control.",
    setup: [
      "Stand facing a stair or a sturdy step; a low step is easier, and one around knee height is hard.",
      "Check that the step can't slide or tip before you put weight on it.",
      "Put your whole front foot on the step so the heel doesn't hang off."
    ],
    steps: [
      "Press through the front foot to stand tall on the step, using the back leg only for balance.",
      "Pause at the top with your hips level and your torso upright.",
      "Lower slowly until the back foot just touches the floor, without dropping onto it.",
      "Do the set on one leg, then switch to the other."
    ],
    breathing: "Breathe out as you stand up onto the step, and breathe in as you lower back down.",
    tempo: "Stand up smoothly, pause briefly at the top, and take about two seconds to lower.",
    feel: {
      should: "In the thigh and glute of the leg on the step, through the whole climb.",
      shouldnt: "As a push from the back foot, or as a pinch at the front of the knee."
    },
    mistakes: [
      { mistake: "You push off the back foot, so the front leg does little.",
        fix: "Keep only the back toes in light contact with the floor and let the front leg do the lifting." },
      { mistake: "Your front knee caves inward as you stand up.",
        fix: "Push the knee out so it points the same way as your toes." }
    ],
    safety: [
      "Use a lower step if the front knee aches.",
      "Keep a hand near a wall or a rail if the step is high or your balance wobbles."
    ]
  };

  C.acc_quad_sissy = {
    summary: "A squat where your knees travel far forward while your torso leans back, putting the work on the front of your thighs.",
    setup: [
      "Stand beside a door frame or a solid post and hold it with one hand, feet about hip-width apart.",
      "Check that what you hold is fixed and won't move when you lean on it.",
      "Rise onto the balls of both feet before you start."
    ],
    steps: [
      "Bend your knees forward, letting them travel past your toes.",
      "Let your torso lean back as you lower your hips a short way.",
      "Go only as low as stays smooth.",
      "Push your knees back and stand tall, still on the balls of your feet."
    ],
    breathing: "Breathe in as you lower, and breathe out as you push your knees back and stand tall.",
    tempo: "Lower slowly at an even speed, and stand back up at the same pace with no bounce.",
    feel: {
      should: "Across the front of your thighs, working hard through a short range.",
      shouldnt: "As a sharp pain at the front of your knees, or as strain in your ankles."
    },
    mistakes: [
      { mistake: "You drop your hips back as in a normal squat, which skips the point of it.",
        fix: "Send your knees forward and let your torso lean back, with your hips roughly in line between them." },
      { mistake: "You pull on the frame instead of just steadying yourself.",
        fix: "Hold it lightly with one hand and let your legs do the work." }
    ],
    safety: [
      "Your knees travel far past your toes on purpose, which loads the front of the knee and the ankle hard, so start with a short range.",
      "Stop if the front of your knee or your ankle aches, instead of working through it."
    ]
  };

  C.acc_quad_dbsplit = {
    summary: "A split squat holding a dumbbell in each hand, dropping the back knee straight down while the front leg does most of the work.",
    setup: [
      "Hold a dumbbell in each hand at your sides and stand in a long stride, front foot flat and back heel lifted.",
      "Keep your torso tall, with your ribs over your hips.",
      "Rest a fingertip on a wall if the weights make you wobble."
    ],
    steps: [
      "Drop the back knee straight down toward the floor, keeping your torso upright.",
      "Stop just above the ground, with the front shin near vertical.",
      "Drive through the whole front foot to stand back up.",
      "Do the set on one leg, then switch to the other."
    ],
    breathing: "Breathe in as you lower, and breathe out as you drive up to standing.",
    tempo: "Lower under control, pause briefly just above the floor, and drive up steadily.",
    feel: {
      should: "In the front thigh and glute, with a stretch across the front of the back hip.",
      shouldnt: "As a pinch at the front knee, or as strain in your lower back from leaning."
    },
    mistakes: [
      { mistake: "You step too short, so the front knee is shoved far past your toes.",
        fix: "Lengthen the stride until the front shin is close to vertical at the bottom." },
      { mistake: "You lean forward and the front heel comes off the floor.",
        fix: "Stand tall and press through the whole front foot, heel included." }
    ],
    safety: [
      "Lift and set down the dumbbells with a flat back and bent knees.",
      "If the front knee complains, lengthen the stride and shorten the depth."
    ]
  };

  C.acc_quad_spanish = {
    summary: "A squat against a band that pulls your knees forward, letting you sit back with upright shins while your quads take the load.",
    setup: [
      "Anchor a band at knee height on a sturdy post, loop it around the backs of your knees and step away until it is taut.",
      "Face the post, with the band running from it to the backs of your knees.",
      "Stand with your feet about hip-width apart and your arms in front of you for balance."
    ],
    steps: [
      "Let the band pull your knees forward as you sit your hips back and down.",
      "Keep your shins upright and your torso tall as you sink.",
      "Lower until your thighs are about parallel with the floor.",
      "Press through your whole foot to stand, keeping the band taut throughout."
    ],
    breathing: "Breathe in as you sit down, and breathe out as you press up to stand.",
    tempo: "Sit down smoothly, pause briefly at the bottom, and stand at a steady pace without letting the band slacken.",
    feel: {
      should: "Across the fronts of your thighs, working against the band's pull on your knees.",
      shouldnt: "As pain at the front of the knee, or as the work moving into your hips because your shins tilt."
    },
    mistakes: [
      { mistake: "Your shins tilt forward, which shifts the work to your hips.",
        fix: "Let the band pull your knees forward and keep your shins close to vertical." },
      { mistake: "You stand so tall that the band goes slack at the top.",
        fix: "Stop just short of full standing so the band stays taut the whole way." }
    ],
    safety: [
      "Check the anchor and the band for nicks before you step back.",
      "The band pulls your knees forward, so stop if the front of your knee aches."
    ]
  };

  /* ---- hamstring ---- */

  C.acc_hamstring_slidecurl = {
    summary: "A bridge with your heels on a towel that you slide out and pull back, loading the backs of your thighs as your legs lengthen.",
    setup: [
      "Lie on your back on a smooth floor such as tile or wood, or in socks on a polished one, with your heels on a towel.",
      "Bend your knees and lift your hips into a bridge.",
      "Keep your arms by your sides, palms down, for balance."
    ],
    steps: [
      "Keep your hips up and slide both heels away until your legs are nearly straight.",
      "Pause at the far end with your hips still high.",
      "Pull your heels back toward your glutes without letting your hips drop.",
      "Finish with your knees bent and your hips still up."
    ],
    breathing: "Breathe in as your heels slide out, and breathe out as you pull them back in.",
    tempo: "Slide out slowly over about three seconds and pull back over about two, with no sudden drop.",
    feel: {
      should: "In the backs of your thighs and your glutes, strongest as your legs straighten.",
      shouldnt: "As a sharp pull in the back of the thigh, or as strain in your lower back from sagging hips."
    },
    mistakes: [
      { mistake: "Your hips sag as your legs straighten.",
        fix: "Slide out only as far as you can keep your hips high." },
      { mistake: "You pull back by bending at the hips instead of at the knees.",
        fix: "Keep the bridge fixed and let only your knees bend as the heels come back." }
    ],
    safety: [
      "The lengthening part is the demanding one, so go slowly and stop short of straight if it pulls sharply.",
      "Stop if you feel a sharp pull or a pop in the back of your thigh, and get it looked at."
    ],
    variations: {
      alternatives: [
        { id: "acc_hamstring_bandcurl", text: "Band Leg Curl trains the same muscles face down against a band, if you have one." }
      ]
    }
  };

  C.acc_hamstring_slidecurl1 = {
    summary: "The sliding leg curl on one leg at a time, so each hamstring takes a heavier share of the work.",
    setup: [
      "Set up as for the two-leg version: lie bridged on a smooth floor with a towel under one heel.",
      "Hold the other leg in the air with the knee bent, and keep it there.",
      "Keep your arms by your sides, palms down."
    ],
    steps: [
      "Keep your hips level and high.",
      "Slide the working heel out until the leg is nearly straight.",
      "Pull the heel back toward your glutes under control.",
      "Do the set on one leg, then switch to the other."
    ],
    breathing: "Breathe in as the heel slides out, and breathe out as you pull it back.",
    tempo: "Slide out slowly, pull back smoothly with no sudden catch, and keep the free leg still throughout.",
    feel: {
      should: "In the back of the working thigh and the glute on the same side.",
      shouldnt: "As your hips tilting toward the working side, or as a sharp pull behind the thigh."
    },
    mistakes: [
      { mistake: "Your hips tilt or drop toward the working side.",
        fix: "Slide out a shorter distance until you can keep your hips level." },
      { mistake: "You use the free leg to push.",
        fix: "Hold the free leg off the floor and keep it still." }
    ],
    safety: [
      "This is a hard load on one hamstring, so slide out only as far as you can pull back smoothly.",
      "Stop if you feel a sharp pull in the back of your thigh."
    ]
  };

  C.acc_hamstring_slrdl = {
    summary: "A one-legged hip hinge where your torso tips forward and your free leg sweeps back, training your hamstrings and your balance together.",
    setup: [
      "Stand on one foot with the knee slightly bent and your hands on your hips or reaching in front of you.",
      "Keep a wall or a chair back within reach until your balance is steady.",
      "Fix your eyes on a spot on the floor a short way ahead."
    ],
    steps: [
      "Hinge forward from the hip, sending the other leg straight back behind you.",
      "Let your torso tip toward parallel with the floor, keeping your back flat.",
      "Keep your hips square to the floor instead of opening toward the lifted leg.",
      "Stand by pushing the floor away through the standing foot.",
      "Do the set on one leg, then switch to the other."
    ],
    breathing: "Breathe in as you hinge forward, and breathe out as you push the floor away to stand.",
    tempo: "Hinge down slowly with control, pause briefly at the bottom, and stand at the same steady pace.",
    feel: {
      should: "Along the back of the standing leg, with the glute helping you stand.",
      shouldnt: "As rounding or strain in your lower back, or as the standing knee locking straight."
    },
    mistakes: [
      { mistake: "You round your back to reach lower.",
        fix: "Stop the hinge at the point where your back can still stay flat." },
      { mistake: "Your hips open, so the free leg swings out to the side.",
        fix: "Point your toes down and keep your hip bones level as the leg goes straight back." }
    ],
    safety: [
      "Hold a wall or a chair back with one hand until your balance is steady.",
      "Stop the hinge before your back starts to round."
    ]
  };

  C.acc_hamstring_slrdldb = {
    summary: "The single-leg hinge holding a dumbbell under your shoulder, which adds load to your hamstrings and makes balance the challenge.",
    setup: [
      "Hold one dumbbell in the hand opposite your standing leg, with the knee of that leg slightly bent.",
      "Let the dumbbell hang straight down from your shoulder.",
      "Keep a wall within reach of your free hand until you trust your balance."
    ],
    steps: [
      "Hinge from the hip, with the free leg sweeping straight back.",
      "Let your torso tip forward while the dumbbell stays under your shoulder.",
      "Keep your back flat and your hips square to the floor.",
      "Stand by driving through the standing foot.",
      "Do the set on one leg, then switch legs and hands."
    ],
    breathing: "Breathe in as you hinge forward, and breathe out as you drive through the standing foot.",
    tempo: "Lower slowly, pause briefly at the bottom, and stand without letting the dumbbell swing.",
    feel: {
      should: "In the back of the standing thigh and the glute, with your trunk working to stay level.",
      shouldnt: "As your lower back rounding, or your hips twisting toward the side holding the weight."
    },
    mistakes: [
      { mistake: "You round your back as the dumbbell drops.",
        fix: "Hinge only as far as your back stays flat, even if the dumbbell stops higher." },
      { mistake: "You twist your hips toward the side holding the weight.",
        fix: "Square your hips to the floor and let the dumbbell hang straight down." }
    ],
    safety: [
      "Start lighter than feels necessary, because balance is the limit.",
      "Touch a wall with your free hand if you need to, and stop the hinge before your back rounds."
    ]
  };

  C.acc_hamstring_bandcurl = {
    summary: "A face-down leg curl against a band anchored low, bending your knees to pull your heels toward your glutes.",
    setup: [
      "Anchor a band low on a sturdy post or heavy furniture and loop the other end around both heels.",
      "Lie face down facing the anchor, with your legs straight and the band taut.",
      "Check that the band sits securely so it can't slip off your heels."
    ],
    steps: [
      "Keep your hips pressed to the floor and bend both knees.",
      "Bring your heels toward your glutes against the pull of the band.",
      "Pause briefly with your heels close to your glutes.",
      "Lower slowly until your legs are straight again."
    ],
    breathing: "Breathe out as you curl your heels in, and breathe in as you lower them.",
    tempo: "Curl smoothly, pause briefly at the top, and take about two seconds to straighten your legs.",
    feel: {
      should: "In the backs of your thighs, strongest as your heels near your glutes.",
      shouldnt: "As your hips lifting off the floor, or a pinch behind the knee."
    },
    mistakes: [
      { mistake: "You lift your hips off the floor to help.",
        fix: "Press your hips down and curl using only your knees." },
      { mistake: "You let the band yank your legs straight.",
        fix: "Lower slowly and keep tension on the band the whole way." }
    ],
    safety: [
      "Check the anchor and the band for nicks, and loop it so it can't slip off your heels.",
      "If the back of your knee pinches, shorten the range."
    ],
    variations: {
      alternatives: [
        { id: "acc_hamstring_slidecurl", text: "Sliding Leg Curl trains the same muscles with just a towel on a smooth floor." }
      ]
    }
  };

  /* ---- calf ---- */

  C.acc_calf_raise = {
    summary: "A heel raise from the edge of a step, lowering below the step for a stretch and rising as high as you can onto your toes.",
    setup: [
      "Stand on the edge of a firm step with the balls of your feet on it and your heels hanging off.",
      "Hold a wall or a rail for balance.",
      "Keep your knees straight but not locked throughout."
    ],
    steps: [
      "Lower your heels below the step until you feel a stretch in your calves.",
      "Rise as high as you can onto your toes.",
      "Pause for a beat at the top.",
      "Lower slowly back into the stretch."
    ],
    breathing: "Breathe out as you rise onto your toes, and breathe in as you lower your heels.",
    tempo: "Rise steadily, pause for a beat at the top, and take about two seconds to lower without bouncing out of the bottom.",
    feel: {
      should: "In the bulk of your calves, with a stretch at the bottom and a squeeze at the top.",
      shouldnt: "As pain in the tendon above your heel, or as your ankles rolling outward."
    },
    mistakes: [
      { mistake: "You bounce out of the bottom instead of pausing.",
        fix: "Pause briefly in the stretch and start each rise from stillness." },
      { mistake: "Your ankles roll outward as you rise.",
        fix: "Keep your weight over the base of your big toe and rise straight up." }
    ],
    safety: [
      "Use a firm step and keep a hand on a rail.",
      "Take the bottom stretch gently, and shorten the range if the tendon above your heel aches."
    ],
    variations: {
      alternatives: [
        { id: "acc_calf_bentknee", text: "Bent-Knee Calf Raise keeps your knees bent to put more of the work on the lower calf." }
      ]
    }
  };

  C.acc_calf_single = {
    summary: "The calf raise on one leg at a time, so your whole bodyweight rests on one ankle.",
    setup: [
      "Stand on one foot on the edge of a step, with the other foot hooked behind the ankle or held off the floor.",
      "Rest a hand on a wall or a rail, using it only for balance.",
      "Let the heel of the working foot hang off the step."
    ],
    steps: [
      "Lower the heel below the step until you feel the stretch.",
      "Rise as high as you can on that foot.",
      "Pause at the top.",
      "Lower slowly back into the stretch.",
      "Do the set on one leg, then switch to the other."
    ],
    breathing: "Breathe out as you rise, and breathe in as you lower your heel.",
    tempo: "Rise steadily, pause at the top, and lower slowly into the stretch instead of dropping.",
    feel: {
      should: "In the calf of the working leg, with a stretch at the bottom.",
      shouldnt: "As pain in the tendon above the heel or in the heel itself."
    },
    mistakes: [
      { mistake: "You lean on the rail so the leg does less of the work.",
        fix: "Touch the rail with your fingertips only." },
      { mistake: "You drop fast into the stretch.",
        fix: "Lower slowly so the calf controls the way down." }
    ],
    safety: [
      "All your bodyweight is on one ankle, so build up gradually.",
      "Stop if the tendon above your heel or the heel itself aches."
    ]
  };

  C.acc_calf_bentknee = {
    summary: "A calf raise done with your knees held bent the whole time, which puts more of the work on the lower calf.",
    setup: [
      "Stand on the edge of a step with the balls of your feet on it and a hand on a wall.",
      "Bend your knees to about 30 degrees and keep that bend throughout.",
      "Let your heels hang off the step."
    ],
    steps: [
      "Hold the knee bend fixed and rise onto your toes.",
      "Pause briefly at the top.",
      "Lower your heels below the step, keeping your knees bent."
    ],
    breathing: "Breathe out as you rise onto your toes, and breathe in as you lower your heels.",
    tempo: "Rise steadily, pause at the top, and lower over about two seconds.",
    feel: {
      should: "In the lower calf, a little deeper than you feel it with straight knees.",
      shouldnt: "As your knees straightening toward the top, or as pain in the tendon above the heel."
    },
    mistakes: [
      { mistake: "You straighten your knees as you rise, which turns it into the straight-knee version.",
        fix: "Keep the same knee bend from the bottom to the top." },
      { mistake: "You cut the range short at the bottom.",
        fix: "Lower your heels fully below the step each time." }
    ],
    safety: [
      "Go gently until the position is familiar.",
      "Shorten the range if the tendon above your heel aches."
    ]
  };

  C.acc_calf_weighted = {
    summary: "A single-leg calf raise holding a dumbbell or kettlebell in one hand, which adds load to the calf.",
    setup: [
      "Hold a dumbbell or kettlebell in one hand and a wall or a rail with the other.",
      "Stand on one foot on the edge of a step with the heel hanging off.",
      "Let the weight hang straight down at your side, with your shoulders level."
    ],
    steps: [
      "Lower the heel below the step.",
      "Rise as high as you can and pause.",
      "Lower slowly back into the stretch.",
      "Do the set on one leg, then switch to the other."
    ],
    breathing: "Breathe out as you rise, and breathe in as you lower your heel.",
    tempo: "Rise steadily, pause at the top, and lower slowly with no bounce at the bottom.",
    feel: {
      should: "In the working calf, with the weight adding to the stretch at the bottom.",
      shouldnt: "As pain in the tendon above the heel or in the heel itself, or as your trunk leaning away."
    },
    mistakes: [
      { mistake: "You lean away from the weight so the standing leg does less.",
        fix: "Stand tall with your shoulders level and let the weight hang straight down." },
      { mistake: "You bounce out of the bottom.",
        fix: "Pause in the stretch and rise from stillness." }
    ],
    safety: [
      "Add weight in small steps, because the tendon above the heel is slow to adapt.",
      "Stop if that tendon or the heel aches."
    ]
  };

  /* ---- shin ---- */

  C.acc_shin_wall = {
    summary: "A back-to-the-wall lift of the fronts of your feet toward your shins, working the muscle along the front of your lower leg.",
    setup: [
      "Stand with your back against a wall and your feet shoulder-width apart, a short way from it.",
      "Keep your legs straight and your hips and shoulders against the wall.",
      "Remember that the farther your feet are from the wall, the harder the lift becomes."
    ],
    steps: [
      "Lift the fronts of both feet toward your shins as high as they go.",
      "Keep your heels on the floor throughout.",
      "Pause at the top.",
      "Lower your feet slowly until they are flat."
    ],
    breathing: "Breathe out as you lift your toes, and breathe in as you lower them.",
    tempo: "Lift steadily, pause briefly at the top, and lower slowly instead of letting your feet flop down.",
    feel: {
      should: "As a burn along the front of your lower legs, just outside the shin bone.",
      shouldnt: "As a sharp pain on the bone itself, or as your calves and thighs doing the work."
    },
    mistakes: [
      { mistake: "You bend your knees, which takes the work out of the shins.",
        fix: "Keep your legs straight and your hips against the wall." },
      { mistake: "You rush, so your feet flop down.",
        fix: "Lower slowly and pause at the top." }
    ],
    safety: [
      "Move slowly; a burn along the front of the shin is the target.",
      "Stop for a sharp pain on the bone itself."
    ]
  };

  C.acc_shin_single = {
    summary: "The wall tibialis raise on one foot at a time, lifting the front of the standing foot while the other foot stays off the floor.",
    setup: [
      "Stand with your back against a wall, one foot on the floor a short way from it and the other foot held just off the floor.",
      "Keep your standing leg straight and your hips against the wall.",
      "Hold the lifted foot still so it doesn't help."
    ],
    steps: [
      "Lift the front of the standing foot toward your shin as high as it goes.",
      "Keep the heel down on the floor.",
      "Pause at the top.",
      "Lower slowly until the foot is flat.",
      "Do the set on one foot, then switch to the other."
    ],
    breathing: "Breathe out as you lift your toes, and breathe in as you lower them.",
    tempo: "Lift steadily, pause briefly at the top, and lower slowly instead of letting the foot flop down.",
    feel: {
      should: "As a burn along the front of the lower leg on the standing side, just outside the shin bone.",
      shouldnt: "As a sharp pain on the bone itself, or as your calf and thigh doing the work."
    },
    mistakes: [
      { mistake: "You lean away from the wall, so the foot has less to lift.",
        fix: "Keep your hips and shoulders against the wall." },
      { mistake: "You let the foot flop down after each lift.",
        fix: "Lower slowly under control." }
    ],
    safety: [
      "Move slowly; a burn along the front of the shin is the target.",
      "Stop for a sharp pain on the bone itself."
    ]
  };

  /* ---- adductor ---- */

  C.acc_adductor_sidelying = {
    summary: "A side-lying lift of the bottom leg toward the top one, a small movement that works your inner thigh.",
    setup: [
      "Lie on your side with the bottom leg straight and the top leg bent, its foot on the floor in front of the bottom knee.",
      "Rest your head on your arm and keep your hips stacked.",
      "Keep the top foot planted so it steadies you."
    ],
    steps: [
      "Lift the bottom leg off the floor toward the top one, as high as you can without rolling your hips.",
      "Pause at the top.",
      "Lower the leg slowly to the floor.",
      "Do the set on one side, then roll over."
    ],
    breathing: "Breathe out as you lift the leg, and breathe in as you lower it.",
    tempo: "Lift smoothly, pause briefly at the top, and lower slowly instead of letting the leg drop.",
    feel: {
      should: "Along the inside of the lifted thigh, from the groin toward the knee.",
      shouldnt: "As your hips rolling backward, or as a sharp pull in the groin."
    },
    mistakes: [
      { mistake: "You roll your hips back to swing the leg up.",
        fix: "Keep your hips stacked and lift only as high as they stay still." },
      { mistake: "You drop the leg quickly instead of lowering it.",
        fix: "Take your time on the way down." }
    ],
    safety: [
      "Keep the lift small if your groin pulls; it is a smooth, short movement, not a swing.",
      "Stop if you feel a sharp pull in the groin."
    ],
    variations: {
      alternatives: [
        { id: "acc_adductor_band", text: "Band Adduction trains the same muscles standing, against a band." }
      ]
    }
  };

  C.acc_adductor_copknee = {
    summary: "A side plank with your top knee resting on a chair seat, pressing down into it to work the inner thigh while you hold your body level.",
    setup: [
      "Set a sturdy chair on a non-slip floor where it can't slide.",
      "Lie on your side with the forearm of your lower arm on the floor and the elbow under your shoulder.",
      "Rest your top knee on the seat, with your lower leg hanging free beneath you."
    ],
    steps: [
      "Lift your hips until your body makes a straight line from the top knee to your shoulder.",
      "Press the top knee down into the seat.",
      "Keep your hips from sagging or turning forward.",
      "Hold, breathing steadily, then lower your hips to the floor.",
      "Repeat on the other side."
    ],
    breathing: "Breathe slowly through the hold, without holding your breath, and keep your ribs relaxed.",
    tempo: "Lift into position smoothly, hold completely still, and lower with control instead of dropping.",
    feel: {
      should: "In the inner thigh of the leg pressing into the chair, with your trunk working along the side.",
      shouldnt: "As a sharp pull in the groin, or as pressure in the shoulder you lean on."
    },
    mistakes: [
      { mistake: "Your hips sag toward the floor.",
        fix: "Press the knee into the seat and lift your hips until your body is straight." },
      { mistake: "Your chest rotates toward the floor or the ceiling.",
        fix: "Keep your shoulders stacked one above the other." }
    ],
    safety: [
      "This loads the inner thigh hard, so start with short holds.",
      "Stop if your groin pulls sharply, and make sure the chair can't slide."
    ]
  };

  C.acc_adductor_copfoot = {
    summary: "A side plank with the inside of your top foot on a chair seat, pressing into it to hold your body in one straight line.",
    setup: [
      "Set a sturdy chair on a non-slip floor where it can't slide.",
      "Lie on your side with your forearm under your shoulder and the inside of your top foot on the seat, leg straight.",
      "Let your lower leg hang free beneath the seat."
    ],
    steps: [
      "Lift your hips until your body is one straight line from the top foot to your shoulder.",
      "Press the top foot into the seat.",
      "Keep your hips from sagging or turning forward.",
      "Hold, breathing steadily, then lower your hips to the floor.",
      "Repeat on the other side."
    ],
    breathing: "Breathe slowly through the hold, without holding your breath, and keep your ribs relaxed.",
    tempo: "Lift into position smoothly, hold completely still, and lower with control instead of dropping.",
    feel: {
      should: "In the inner thigh of the leg pressing into the chair, with the side of your trunk holding you level.",
      shouldnt: "As a sharp pull in the groin, or as pressure in the shoulder you lean on."
    },
    mistakes: [
      { mistake: "Your hips sag toward the floor.",
        fix: "Press the foot into the seat and lift your hips until your body is straight." },
      { mistake: "Your chest rotates toward the floor or the ceiling.",
        fix: "Keep your shoulders stacked one above the other." }
    ],
    safety: [
      "This is the hardest bodyweight inner-thigh hold here, so build up slowly.",
      "Stop if your groin pulls sharply, and make sure the chair can't slide."
    ]
  };

  C.acc_adductor_band = {
    summary: "A standing leg sweep across your body against a band anchored low, working the inner thigh of the moving leg.",
    setup: [
      "Anchor a band low on a sturdy post and loop the other end around one ankle.",
      "Stand sideways to the anchor, with the looped leg farther from it.",
      "Hold a wall or a chair for balance and stand tall on the other leg."
    ],
    steps: [
      "Sweep the looped leg across in front of your standing leg, against the band's pull.",
      "Pause with the legs crossed lightly.",
      "Return slowly until the leg is back out to the side.",
      "Do the set on one leg, then switch to the other."
    ],
    breathing: "Breathe out as you sweep the leg across, and breathe in as you return it.",
    tempo: "Sweep across smoothly, pause briefly, and let the band draw the leg back slowly instead of snapping.",
    feel: {
      should: "In the inner thigh of the moving leg, with the standing leg's hip steadying you.",
      shouldnt: "As your torso leaning away, or as a sharp pull in the groin."
    },
    mistakes: [
      { mistake: "You lean your torso away to get the leg across.",
        fix: "Stand tall and sweep only as far as your torso stays upright." },
      { mistake: "You let the band snap the leg back out.",
        fix: "Control the return so the band never takes the leg." }
    ],
    safety: [
      "Check the anchor and the band for nicks, and loop it so it can't slip off your ankle.",
      "Keep the sweep smooth and stop if your groin pulls."
    ],
    variations: {
      alternatives: [
        { id: "acc_adductor_sidelying", text: "Side-Lying Adduction trains the same muscles with no equipment." }
      ]
    }
  };

  /* ---- abductor ---- */

  C.acc_abductor_sidelying = {
    summary: "A side-lying lift of the top leg toward the ceiling, leading with the heel to work the muscles on the outside of your hip.",
    setup: [
      "Lie on your side with your hips stacked, the bottom knee bent for balance and the top leg straight in line with your torso.",
      "Rest your head on your arm.",
      "Keep the toes of the top foot level or pointing slightly down."
    ],
    steps: [
      "Lift the top leg toward the ceiling, leading with the heel.",
      "Stop when your hips start to roll backward.",
      "Pause briefly at the top.",
      "Lower slowly to the start.",
      "Do the set on one side, then roll over."
    ],
    breathing: "Breathe out as you lift the leg, and breathe in as you lower it.",
    tempo: "Lift smoothly, pause briefly at the top, and lower slowly instead of letting the leg drop.",
    feel: {
      should: "On the outside of your hip and the upper buttock of the lifting leg.",
      shouldnt: "At the front of your hip, which means your toes have turned up, or in your lower back."
    },
    mistakes: [
      { mistake: "You roll your hips backward to swing the leg higher.",
        fix: "Keep your hips stacked and stop where they start to turn." },
      { mistake: "You point your toes up, so the front of the hip takes over.",
        fix: "Keep your toes level or slightly down." }
    ],
    safety: [
      "Keep it smooth and small; it isn't a swing.",
      "If the outside of your hip pinches, shorten the range."
    ],
    variations: {
      alternatives: [
        { id: "acc_abductor_clamshell", text: "Banded Clamshell works the same hip muscles against a band, if you have one." }
      ]
    }
  };

  C.acc_abductor_sideplank = {
    summary: "A side plank on your forearm where you lift the top leg while your hips stay level, working the outside of the hip and the side of your trunk.",
    setup: [
      "Set up in a side plank on your forearm, with your elbow under your shoulder.",
      "Keep your body in one line, with your feet stacked.",
      "Rest your bottom knee on the floor if a full side plank is too much."
    ],
    steps: [
      "Lift the top leg toward the ceiling without letting your hips drop or turn.",
      "Pause at the top.",
      "Lower the leg until your feet are stacked again.",
      "Do the set on one side, then switch."
    ],
    breathing: "Breathe out as the leg lifts and breathe in as it lowers, keeping your body in one line.",
    tempo: "Lift smoothly, pause briefly at the top, and lower slowly without letting your hips move.",
    feel: {
      should: "On the outside of the top hip, with the side of your trunk working to hold you level.",
      shouldnt: "As a pinch in the shoulder under you, or as your lower back taking over."
    },
    mistakes: [
      { mistake: "Your hips sag as the leg lifts.",
        fix: "Press your forearm into the floor and lift your hips back into a straight line before the leg moves." },
      { mistake: "You lift the leg by tilting your torso.",
        fix: "Lift only as high as your torso stays still." }
    ],
    safety: [
      "The shoulder under you holds your weight, so stay on the forearm, not the hand.",
      "Stop if the shoulder pinches, and rest the bottom knee on the floor if a full side plank is too much."
    ]
  };

  C.acc_abductor_bandwalk = {
    summary: "A sideways walk in a quarter squat with a band around your legs, keeping the muscles on the outside of your hips working throughout.",
    setup: [
      "Loop a band around both legs just above your knees; a band on the ankles is harder.",
      "Stand with your feet hip-width apart and your knees slightly bent, in a quarter squat.",
      "Clear a line of floor to walk along, and keep your chest up."
    ],
    steps: [
      "Step sideways with the leading foot, keeping the band tight.",
      "Follow with the other foot, bringing it in only to hip-width.",
      "Keep your knees slightly bent and your toes pointing forward.",
      "Walk out along the line, then back the other way."
    ],
    breathing: "Breathe steadily and naturally as you walk, and don't hold your breath while the band is tight.",
    tempo: "Step at a slow, even pace, and keep the band tight instead of letting your feet snap together.",
    feel: {
      should: "On the outside of your hips and upper buttocks, with the band's pull just above your knees.",
      shouldnt: "As your knees collapsing inward, or as pain in your lower back."
    },
    mistakes: [
      { mistake: "Your knees fall inward as you step.",
        fix: "Push your knees out against the band and keep them over your feet." },
      { mistake: "You stand up tall, so the band goes slack.",
        fix: "Stay in the quarter squat and keep your feet apart enough to hold tension." }
    ],
    safety: [
      "Check the band for nicks and give yourself room to move.",
      "Keep the band above your knees at first, because a band on the ankles loads the hips and knees more."
    ]
  };

  C.acc_abductor_clamshell = {
    summary: "A side-lying movement with a band above your knees, lifting the top knee like a clamshell opening to work the outside of your hip.",
    setup: [
      "Lie on your side with a band looped around both legs just above the knees.",
      "Stack your hips and bend your knees, with your feet together.",
      "Rest your head on your arm and keep your trunk still."
    ],
    steps: [
      "Keep your feet touching and lift the top knee as far as it goes without rolling your hips backward.",
      "Pause for a beat at the top.",
      "Close the knee slowly against the band.",
      "Do the set on one side, then roll over."
    ],
    breathing: "Breathe out as you open the knee, and breathe in as you close it.",
    tempo: "Open smoothly, pause for a beat, and close slowly so the band never snaps the knee back.",
    feel: {
      should: "On the outside of your hip and the upper buttock of the top leg.",
      shouldnt: "In your lower back, which means your pelvis is rolling backward."
    },
    mistakes: [
      { mistake: "You roll your pelvis back, so the lower back does the lifting.",
        fix: "Stack your hips and open the knee only as far as your pelvis stays still." },
      { mistake: "You let the knee drop quickly.",
        fix: "Close the knee slowly against the band." }
    ],
    safety: [
      "A small range with no rolling is the target.",
      "Use a lighter band if your hip pinches."
    ],
    variations: {
      alternatives: [
        { id: "acc_abductor_sidelying", text: "Side-Lying Abduction works the same hip muscles with no band." }
      ]
    }
  };

  /* ---- antirot ---- */

  C.acc_antirot_knees = {
    summary: "A side plank held from your knees, building the sides of your trunk with a shorter lever than the full version.",
    setup: [
      "Lie on your side with your knees bent behind you and your forearm on the floor.",
      "Place your elbow directly under your shoulder.",
      "Stack your hips so your top hip sits over the bottom one."
    ],
    steps: [
      "Lift your hips until your body makes a straight line from your knees to your head.",
      "Keep your top hip stacked over the bottom one.",
      "Hold, breathing steadily, then lower with control.",
      "Repeat on the other side."
    ],
    breathing: "Breathe steadily through the hold, without holding your breath, and keep your ribs relaxed.",
    tempo: "Lift into position smoothly, hold completely still, and lower without dropping.",
    feel: {
      should: "Along the sides of your trunk, from your ribs down to your hips.",
      shouldnt: "As a pinch in the shoulder under you, or as your lower back sagging."
    },
    mistakes: [
      { mistake: "Your hips sag toward the floor.",
        fix: "Push your forearm into the floor and lift your hips until your body is straight." },
      { mistake: "You roll your chest toward the floor.",
        fix: "Stack your shoulders one above the other." }
    ],
    safety: [
      "Keep your elbow right under your shoulder.",
      "If the shoulder pinches, put a folded towel under your forearm or end the set early."
    ]
  };

  C.acc_antirot_sideplank = {
    summary: "A full side plank held on your forearm, with your body in one straight line from your ears to your ankles.",
    setup: [
      "Lie on your side with your legs straight and stacked and your forearm on the floor.",
      "Place your elbow directly under your shoulder.",
      "Stack your hips so your top hip sits over the bottom one."
    ],
    steps: [
      "Lift your hips until your body is one straight line from your ears to your ankles.",
      "Keep your top hip stacked over the bottom one and your neck long.",
      "Hold, breathing steadily, then lower with control.",
      "Repeat on the other side."
    ],
    breathing: "Breathe steadily through the hold, without holding your breath, and keep your ribs relaxed.",
    tempo: "Lift into position smoothly, hold completely still, and lower without dropping.",
    feel: {
      should: "Along the sides of your trunk, from your ribs down to your hips.",
      shouldnt: "As a pinch in the shoulder under you, or as your lower back sagging."
    },
    mistakes: [
      { mistake: "Your hips sag toward the floor.",
        fix: "Push your forearm into the floor and lift your hips until your body is straight." },
      { mistake: "You roll your chest toward the floor.",
        fix: "Stack your shoulders one above the other." }
    ],
    safety: [
      "Stay on your forearm, not your hand.",
      "If the shoulder pinches, go back to the knees version."
    ]
  };

  C.acc_antirot_leg = {
    summary: "A side plank with your top leg lifted a little above the bottom one, adding a balance demand to the hold.",
    setup: [
      "Get into a side plank on your forearm, with your elbow under your shoulder and your legs straight and stacked.",
      "Lift your hips into a straight line before the leg moves.",
      "Pick a spot to look at so your neck stays long."
    ],
    steps: [
      "Raise the top leg a little above the bottom one.",
      "Keep it in line with your body, without letting it drift forward or back.",
      "Keep your hips stacked.",
      "Hold, then lower both legs with control.",
      "Repeat on the other side."
    ],
    breathing: "Breathe steadily through the hold, without holding your breath, and keep your ribs relaxed.",
    tempo: "Raise the leg smoothly, hold completely still, and lower it with control.",
    feel: {
      should: "Along the sides of your trunk, with the top hip and leg working to hold the line.",
      shouldnt: "As a pinch in the shoulder under you, or as your hips twisting."
    },
    mistakes: [
      { mistake: "Your hips sag as the leg lifts.",
        fix: "Lift your hips higher before you raise the leg, and keep the leg low." },
      { mistake: "You swing the top leg forward, so your hips twist.",
        fix: "Keep the leg in line with your body and lift it only a little." }
    ],
    safety: [
      "If the shoulder pinches or the bottom hip aches, go back to a plain side plank.",
      "End the set early instead of twisting."
    ]
  };

  C.acc_antirot_deadbug = {
    summary: "A back-lying exercise where the opposite arm and leg lower toward the floor while your lower back stays pressed down.",
    setup: [
      "Lie on your back with your arms pointing at the ceiling.",
      "Bend your hips and knees to 90 degrees, with your shins parallel to the floor.",
      "Press your lower back gently into the floor and keep it there.",
      "Rest your head on a folded towel if your neck tires."
    ],
    steps: [
      "Lower one arm and the opposite leg slowly toward the floor.",
      "Stop before your lower back lifts away from the floor.",
      "Return the arm and leg to the start.",
      "Repeat with the other arm and leg, alternating sides."
    ],
    breathing: "Breathe out as the arm and leg lower, which helps keep your ribs down, and breathe in as they return.",
    tempo: "Move slowly and evenly, because speed hides the arch you are trying to avoid.",
    feel: {
      should: "In your deep stomach muscles, holding your lower back flat as the limbs move.",
      shouldnt: "As your lower back arching off the floor, or as tension in your neck."
    },
    mistakes: [
      { mistake: "Your lower back arches away from the floor as your limbs lower.",
        fix: "Lower the limbs less far so your back stays flat." },
      { mistake: "You move fast, which hides the arch.",
        fix: "Slow down until you can feel your back on the floor all the way." }
    ],
    safety: [
      "Lower only as far as your back stays flat.",
      "If your neck tires, rest your head on a folded towel."
    ]
  };

  C.acc_antirot_pallof = {
    summary: "A standing press against a band anchored at your side, where the job is to stop the band from twisting you toward the anchor.",
    setup: [
      "Anchor a band at chest height on a sturdy post and stand sideways to it, a step away.",
      "Hold the band in both hands at your chest, with your feet hip-width apart and your knees soft.",
      "Stand tall with your ribs down, and face straight ahead."
    ],
    steps: [
      "Press your hands straight out in front of you.",
      "Resist the band so your shoulders and hips keep facing forward.",
      "Pause with your arms straight.",
      "Bring your hands back in to your chest.",
      "Finish one side before you switch."
    ],
    breathing: "Breathe out as your arms extend and breathe in as they return, without holding your breath.",
    tempo: "Press out smoothly, pause with your arms straight, and return at the same steady pace.",
    feel: {
      should: "Along the sides of your trunk and across your stomach, working to stop the twist.",
      shouldnt: "As your shoulders turning toward the anchor, or as strain in your lower back."
    },
    mistakes: [
      { mistake: "Your shoulders rotate toward the anchor as your arms extend.",
        fix: "Step closer to the anchor or use a lighter band until your chest keeps facing forward." },
      { mistake: "You lean away to counter the pull.",
        fix: "Stand tall with your hips square, and step closer to the post if you can't stay upright." }
    ],
    safety: [
      "Check the anchor and the band for nicks.",
      "Step farther from the anchor for a harder pull, but not so far that you have to lean."
    ]
  };

  C.acc_antirot_suitcase = {
    summary: "A standing hold with a weight in one hand, where your trunk works to keep you upright instead of leaning toward the load.",
    setup: [
      "Pick up one dumbbell or kettlebell with your knees bent and your back flat.",
      "Stand tall with the weight at your side, held like a suitcase.",
      "Keep your shoulders level and your ribs over your hips."
    ],
    steps: [
      "Stand tall and hold the weight firmly at your side.",
      "Keep your shoulders level, without leaning toward or away from the weight.",
      "Breathe normally with a firm grip for the whole hold.",
      "Put the weight down while you still control it.",
      "Repeat with the other hand."
    ],
    breathing: "Breathe normally through the hold, with your ribs stacked over your hips, and don't hold your breath.",
    tempo: "Lift the weight smoothly, hold completely still, and lower it to the floor under control.",
    feel: {
      should: "In the side of your trunk opposite the weight, and in your grip.",
      shouldnt: "As leaning to one side, or as the loaded shoulder creeping up toward your ear."
    },
    mistakes: [
      { mistake: "You lean away from the weight to make it lighter.",
        fix: "Stand straight with your ribs over your hips, and use a lighter weight if you can't." },
      { mistake: "You shrug the loaded shoulder toward your ear.",
        fix: "Pull that shoulder down and keep both shoulders level." }
    ],
    safety: [
      "Lift and lower the weight with a flat back and bent knees.",
      "A one-sided load tires the side of your trunk before your grip, so end the set when you start to lean."
    ]
  };

  /* ---- backext ---- */

  C.acc_backext_birddog = {
    summary: "A hands-and-knees exercise where you reach one arm and the opposite leg out level with your torso while the rest of you stays still.",
    setup: [
      "Start on hands and knees with your hands under your shoulders and your knees under your hips.",
      "Keep your back flat, as if a glass of water sat on your lower back.",
      "Put a folded towel under your knees if they complain."
    ],
    steps: [
      "Reach one arm forward and the opposite leg straight back until both are level with your torso.",
      "Keep your hips and shoulders square to the floor.",
      "Pause briefly at full reach.",
      "Return to hands and knees.",
      "Finish one side before you switch."
    ],
    breathing: "Breathe out as you reach, and breathe in as you return to hands and knees.",
    tempo: "Reach slowly, pause briefly, and return at the same steady pace without letting your hips shift.",
    feel: {
      should: "In the muscles along your spine and the glute of the reaching leg, with your stomach bracing.",
      shouldnt: "As a pinch in the lower back, or as your hips twisting open."
    },
    mistakes: [
      { mistake: "You lift the leg higher than your torso, which arches the lower back.",
        fix: "Stop with the leg level with your torso." },
      { mistake: "Your hips twist open as the leg rises.",
        fix: "Square your hips to the floor and point your toes down." }
    ],
    safety: [
      "Keep your back flat and the reach level.",
      "Put a folded towel under your knees if they complain, and rest on your fists if your wrists do."
    ]
  };

  C.acc_backext_prone = {
    summary: "A face-down lift of your chest a few centimetres off the floor by squeezing the muscles along your spine.",
    setup: [
      "Lie face down with your legs straight and your toes on the floor.",
      "Place your hands beside your head or crossed on your chest.",
      "Look at the floor and keep your neck long."
    ],
    steps: [
      "Squeeze the muscles along your spine and lift your chest a few centimetres off the floor.",
      "Keep your gaze on the floor and your neck long.",
      "Pause briefly at the top.",
      "Lower slowly to the floor."
    ],
    breathing: "Breathe out as you lift, and breathe in as you lower, and keep breathing during the pause.",
    tempo: "Lift smoothly without swinging, pause briefly at the top, and lower slowly.",
    feel: {
      should: "In the muscles running along both sides of your spine, with your glutes assisting.",
      shouldnt: "As a pinch in your lower back, or as strain in your neck from lifting your head."
    },
    mistakes: [
      { mistake: "You lift your head high, which loads the neck instead of the back.",
        fix: "Keep your gaze on the floor and lift only your chest." },
      { mistake: "You swing up with momentum and arch hard at the top.",
        fix: "Lift only as high as stays smooth; a few centimetres is enough." }
    ],
    safety: [
      "Lift only as high as stays smooth.",
      "Put a folded towel under your hips if your lower back pinches."
    ]
  };

  C.acc_backext_revhyper = {
    summary: "A face-down lift of your straight legs from the end of a bench, squeezing your glutes and the muscles along your spine.",
    setup: [
      "Check that the bench can't slide or tip.",
      "Lie face down across it with your hips at the edge and your legs hanging straight down.",
      "Hold the sides of the bench for stability."
    ],
    steps: [
      "Squeeze your glutes and lift your legs until they are level with your torso.",
      "Pause at the top without arching your lower back.",
      "Lower slowly until your legs hang again."
    ],
    breathing: "Breathe out as you lift your legs, and breathe in as you lower them.",
    tempo: "Lift smoothly without swinging, pause at the top, and lower over about two seconds.",
    feel: {
      should: "In your glutes, the muscles along your spine and the backs of your thighs.",
      shouldnt: "As a pinch in your lower back, or as your legs swinging past the level of your torso."
    },
    mistakes: [
      { mistake: "You swing your legs up with momentum.",
        fix: "Lift under control and pause at the top." },
      { mistake: "You lift well above your torso, which arches your lower back.",
        fix: "Stop when your legs are level with your torso." }
    ],
    safety: [
      "Lift only to the level of your torso.",
      "Use a shorter range if your lower back pinches."
    ]
  };

  C.acc_backext_goodmorning = {
    summary: "A hip hinge holding one dumbbell against your chest, pushing your hips back with a flat back to work the backs of your thighs and glutes.",
    setup: [
      "Hold one dumbbell upright against your chest with both hands.",
      "Stand with your feet shoulder-width apart and your knees slightly bent.",
      "Look at a spot on the floor a short way ahead of your feet."
    ],
    steps: [
      "Push your hips back and let your torso tip forward with a flat back.",
      "Lower until you feel a stretch in the backs of your thighs.",
      "Keep the dumbbell against your chest and your gaze a little ahead of your feet.",
      "Drive your hips forward to stand tall.",
      "Squeeze your glutes at the top."
    ],
    breathing: "Breathe in as you push your hips back, and breathe out as you drive them forward to stand.",
    tempo: "Lower slowly, pause briefly at the bottom, and stand at the same steady pace with no bounce.",
    feel: {
      should: "In the backs of your thighs and your glutes, with the muscles along your spine holding you flat.",
      shouldnt: "As rounding or a sharp strain in your lower back, or as pressure at the front of your knees."
    },
    mistakes: [
      { mistake: "You round your back to reach lower.",
        fix: "Stop the lowering as soon as you feel your back start to round." },
      { mistake: "You bend your knees so much that it becomes a squat.",
        fix: "Keep a soft, fixed knee bend and move at the hips." }
    ],
    safety: [
      "Keep the dumbbell light until the movement is smooth.",
      "Stop the lowering before your back rounds."
    ]
  };
})();
