/* =====================================================================
   WELLNESS HUB · EXERCISE GUIDES · BATCH D — conditioning
   ---------------------------------------------------------------------
   · The written guide for each exercise in the conditioning slot (plan
     steps 2.4 and 3.4): 13 guides, written from the cards and the app's own
     cues. Every one names the red flags (chest pain, faintness, unusual
     breathlessness), as the DB injury line does.
   · Schema and style rules: fitness/content/STYLE.md. Checked by
     tools/check-exercise-content.js.
   · No prescriptions here: rep ranges, hold times and when to step up
     come from training.js, never from this text.
   Public: window.EXERCISE_CONTENT[id], window.EXERCISE_CONTENT_BATCHES.d
   ===================================================================== */
(function () {
  "use strict";
  var C = window.EXERCISE_CONTENT = window.EXERCISE_CONTENT || {};
  var B = window.EXERCISE_CONTENT_BATCHES = window.EXERCISE_CONTENT_BATCHES || {};
  B.d = "complete";

  var RED = "Stop at chest pain, faintness or breathlessness that is out of the ordinary for you, and get it looked at if it doesn't pass.";

  C.cond_jacks = {
    summary: "A jumping jack: hop your feet wide as your arms swing overhead, then back together, as easy rhythmic cardio.",
    setup: [
      "Stand tall on a flat, non-slip floor with your feet together and your arms by your sides.",
      "Clear the space around and above you so your arms can swing freely."
    ],
    steps: [
      "Hop your feet out wide as your arms swing overhead.",
      "Hop your feet back together as your arms return to your sides.",
      "Land softly through the whole foot with your knees slightly bent.",
      "Keep a pace you can hold for the whole set."
    ],
    breathing: "Breathe in and out in a steady rhythm that matches your pace, and don't hold your breath.",
    tempo: "Keep an even beat that you could hold through the set, and slow down before the landings turn heavy.",
    feel: {
      should: "As a rising warmth and a steady effort across your legs and shoulders.",
      shouldnt: "As jarring in your knees or heels, or a pinch at the top of your shoulders."
    },
    mistakes: [
      { mistake: "You land stiff-legged.",
        fix: "Let your knees and ankles give a little on every landing and stay on the balls of your feet." },
      { mistake: "You raise your arms high enough to pinch your shoulder.",
        fix: "Stop your arms where they swing without a pinch, and step your feet out instead of hopping." },
      { mistake: "You speed up until the rhythm falls apart.",
        fix: "Drop back to a pace where the beat stays even." }
    ],
    safety: [
      RED,
      "Stop at sharp joint pain, and if your shoulder or leg complains, step out one foot at a time and shorten the arm swing."
    ],
    prereq: [
      "Stepping or hopping sideways and raising your arms comfortably.",
      "A flat, non-slip floor with clear space around you."
    ]
  };

  C.cond_ropeless = {
    summary: "Jump rope without the rope: small, low hops while your wrists turn as if you held the handles.",
    setup: [
      "Stand on a flat, non-slip floor with room for your arms at each side.",
      "Hold your hands at your sides as if you held rope handles, with your elbows by your ribs.",
      "Wear supportive shoes if you can."
    ],
    steps: [
      "Hop on the balls of your feet, low to the floor.",
      "Turn your wrists in small circles, as if turning the rope.",
      "Land softly each time, with your knees slightly bent.",
      "Keep the rhythm even and build pace only once it is steady."
    ],
    breathing: "Breathe in a steady rhythm that follows your hops, and don't hold your breath.",
    tempo: "Keep the beat even and the hops small, and raise your pace only after the rhythm feels easy.",
    feel: {
      should: "As light, springy work in your calves and a rising warmth through your body.",
      shouldnt: "As stiff, heavy landings, or as aching in your Achilles tendon or the arch of your foot."
    },
    mistakes: [
      { mistake: "You land stiff-legged.",
        fix: "Hop lower and let your ankles and knees give on each landing." },
      { mistake: "You speed up before the rhythm is steady.",
        fix: "Slow down until the beat stays even, then speed up a little." },
      { mistake: "Your arms flail instead of your wrists turning.",
        fix: "Keep your elbows by your ribs and make small circles with your wrists." }
    ],
    safety: [
      RED,
      "If your calf or foot hurts, march in place instead of hopping."
    ],
    prereq: [
      "Low hops or alternating steps without a rope.",
      "A flat, non-slip floor and clear space around you."
    ]
  };

  C.cond_rope = {
    summary: "Jump rope: hop low as the rope passes under your feet, turning it with your wrists for steady cardio and calf work.",
    setup: [
      "Stand on the middle of the rope: the handles should reach about your armpits.",
      "Choose a flat, non-slip floor with clear space overhead and at your sides.",
      "Wear supportive shoes if you can."
    ],
    steps: [
      "Hold the handles with your elbows by your ribs and the rope behind you.",
      "Turn the rope mainly from your wrists.",
      "Hop just high enough for the rope to pass, landing softly on the balls of your feet.",
      "Keep the rhythm even for the whole set."
    ],
    breathing: "Breathe in a steady rhythm that follows your hops, and don't hold your breath.",
    tempo: "Keep an even beat, hop low, and slow down before the rope starts catching your feet.",
    feel: {
      should: "As light, springy work in your calves and a steady rise in your effort.",
      shouldnt: "As heavy, jarring landings, or as sharp pain in your Achilles tendon, calf or foot."
    },
    mistakes: [
      { mistake: "You jump much higher than the rope needs.",
        fix: "Hop only a couple of centimetres, enough to clear the rope." },
      { mistake: "You land stiff-legged.",
        fix: "Let your knees and ankles give on each landing and stay on the balls of your feet." },
      { mistake: "You turn the rope with your whole arms.",
        fix: "Pin your elbows near your ribs and spin from your wrists." }
    ],
    safety: [
      RED,
      "If your calf, Achilles tendon or foot hurts, march in place and cut the impact."
    ],
    prereq: [
      "Low hops, and coordinating a rope's timing with them.",
      "A rope sized to your height and a flat, non-slip floor."
    ],
    variations: {
      alternatives: [
        { id: "cond_ropeless", text: "No rope, or no room overhead: the same hop and wrist rhythm without the rope." }
      ]
    }
  };

  C.cond_ropealt = {
    summary: "Jump rope stepping from foot to foot, as if jogging on the spot, with the rope passing under on every step.",
    setup: [
      "Size the rope so the handles reach about your armpits when you stand on its middle.",
      "Choose a flat, non-slip floor with clear space overhead and at your sides.",
      "Wear supportive shoes if you can."
    ],
    steps: [
      "Start with a few basic two-foot hops to find the rhythm.",
      "Step over the rope with one foot, then the other, as if running on the spot.",
      "Keep your steps small and your arms close to your body.",
      "Hold an even beat for the whole set."
    ],
    breathing: "Breathe in a steady rhythm that follows your steps, and don't hold your breath.",
    tempo: "Keep the beat even and the steps small, and slow down if the rope starts catching your feet.",
    feel: {
      should: "As light, alternating effort through your calves, with the rope turning from your wrists.",
      shouldnt: "As high bounding, or as sharp pain in your calf, Achilles tendon or foot."
    },
    mistakes: [
      { mistake: "You bound high on each step.",
        fix: "Lift each foot only as far as the rope needs." },
      { mistake: "Your arms drift wide.",
        fix: "Pin your elbows near your ribs and turn the rope with your wrists." },
      { mistake: "The rhythm falls apart when you speed up.",
        fix: "Slow back to the pace where every step lands on the beat." }
    ],
    safety: [
      RED,
      "If your calf or foot hurts, march in place without hopping."
    ],
    prereq: [
      "A comfortable basic jump with a rope.",
      "Alternating your steps in time without the rope."
    ]
  };

  C.cond_ropeboxer = {
    summary: "Jump rope shifting your weight from foot to foot in a relaxed boxer's rhythm, hopping lightly on each turn of the rope.",
    setup: [
      "Size the rope so the handles reach about your armpits when you stand on its middle.",
      "Choose a flat, non-slip floor with clear space overhead and at your sides.",
      "Wear supportive shoes if you can."
    ],
    steps: [
      "Start from the basic jump until the rhythm is steady.",
      "Shift your weight onto one foot as the rope passes, then onto the other on the next turn.",
      "Stay low and loose through your shoulders.",
      "Keep an even beat for the whole set."
    ],
    breathing: "Breathe in a steady rhythm that follows the beat, and don't hold your breath.",
    tempo: "Keep a relaxed, even beat with light hops, and slow down if you start landing heavily.",
    feel: {
      should: "As light weight shifts through your feet and calves, with your shoulders relaxed.",
      shouldnt: "As big sideways jumps, or as sharp pain in your calf or ankle."
    },
    mistakes: [
      { mistake: "You jump wide from side to side.",
        fix: "Keep your feet under your hips and just shift your weight." },
      { mistake: "Your feet cross by accident.",
        fix: "Slow down and keep each foot in its own lane under your hip." },
      { mistake: "Your shoulders creep up and tense.",
        fix: "Drop your shoulders and turn the rope from your wrists." }
    ],
    safety: [
      RED,
      "If your calf or ankle hurts, lower the hop or march in place."
    ],
    prereq: [
      "A comfortable basic jump with a rope.",
      "Shifting your weight side to side easily."
    ]
  };

  C.cond_doubleunder = {
    summary: "Jump rope where the rope passes under your feet twice on each jump, so each hop is a little higher and the wrists spin faster.",
    setup: [
      "Size the rope so the handles reach about your armpits, and check that it clears the floor cleanly.",
      "Choose a flat, non-slip floor with clear space overhead.",
      "Wear supportive shoes."
    ],
    steps: [
      "Start with a few steady single jumps.",
      "Jump just high enough for the rope to pass twice under your feet.",
      "Spin the rope with your wrists and keep your arms close.",
      "Land softly with your knees bending, then reset your rhythm.",
      "Stop the set when the rhythm breaks down."
    ],
    breathing: "Breathe in short, steady breaths that follow your jumps, and don't hold your breath.",
    tempo: "Keep your steady singles going, then make the occasional double with a quick wrist spin, and slow down when it gets messy.",
    feel: {
      should: "As quick, springy work in your calves, with your wrists doing the spinning.",
      shouldnt: "As stiff-legged landings, or as sharp pain in your Achilles tendon or calf."
    },
    mistakes: [
      { mistake: "You jump with your knees locked.",
        fix: "Let your knees and ankles give on each landing." },
      { mistake: "You whip your arms wide to speed up the rope.",
        fix: "Keep your elbows close and spin the rope with your wrists." },
      { mistake: "You jump far higher than the rope needs.",
        fix: "Jump only a little higher than a single, and spin the rope faster instead." }
    ],
    safety: [
      RED,
      "If your Achilles tendon or calf hurts, go back to single jumps."
    ],
    prereq: [
      "Steady single jumps with a rope and a controlled landing.",
      "A rope sized to your height with clear space overhead."
    ]
  };

  C.cond_ropeweighted = {
    summary: "Jump rope with a weighted rope, so your shoulders and forearms work as well as your calves, at a steady even beat.",
    setup: [
      "Use a weighted rope with handles that suit your hands.",
      "Size it like a plain rope: the handles should reach about your armpits when you stand on its middle.",
      "Choose a flat, non-slip floor with clear space overhead and at your sides."
    ],
    steps: [
      "Hold the handles with your elbows by your ribs.",
      "Turn the rope from your wrists, keeping your shoulders relaxed.",
      "Hop low and land softly on the balls of your feet.",
      "Keep an even beat for the whole set."
    ],
    breathing: "Breathe in a steady rhythm that follows your hops, and don't hold your breath.",
    tempo: "Keep an even beat and let the rope's weight set the pace; slow down if your shoulders start doing the turning.",
    feel: {
      should: "As steady work in your forearms and shoulders along with your calves.",
      shouldnt: "As your shoulders whipping the rope, or as sharp pain in your wrist, shoulder or calf."
    },
    mistakes: [
      { mistake: "You use a rope that is too heavy for your form.",
        fix: "Go back to a lighter or plain rope until your hops and wrists stay smooth." },
      { mistake: "You whip the rope with your shoulders.",
        fix: "Pin your elbows near your ribs and turn from your wrists." },
      { mistake: "You land stiff-legged.",
        fix: "Hop low and let your knees and ankles give on every landing." }
    ],
    safety: [
      RED,
      "If your shoulder, wrist or calf hurts, go back to a plain rope or march in place."
    ],
    prereq: [
      "A comfortable basic jump with a plain rope.",
      "A weighted rope whose handles suit your hands."
    ]
  };

  C.cond_burpeenojump = {
    summary: "A burpee without the jumps: squat down, step back to a plank, step in, and stand, for lower-impact whole-body work.",
    setup: [
      "Stand on a flat, non-slip floor with room behind you to step back.",
      "Use a mat if the floor is hard on your hands or knees.",
      "Use a sturdy raised support for your hands if the floor is too much for your wrists or knees."
    ],
    steps: [
      "Squat down and put your hands on the floor in front of you.",
      "Step one foot back at a time into a plank, with your trunk braced.",
      "Step your feet back in under your hips, one at a time.",
      "Stand up without jumping."
    ],
    breathing: "Breathe out as you step back, and breathe in as you stand. Keep breathing as the set goes on.",
    tempo: "Move at a steady, controlled pace, and don't rush the stand-up at the end.",
    feel: {
      should: "As effort across your legs, trunk and shoulders, with your breathing rising.",
      shouldnt: "As a sagging low back in the plank, or as sharp pain in your wrists or knees."
    },
    mistakes: [
      { mistake: "Your hips drop in the plank.",
        fix: "Squeeze your glutes and brace your trunk before stepping back." },
      { mistake: "You rush the stand-up and wobble.",
        fix: "Take a beat at the bottom of the squat and stand with your chest tall." },
      { mistake: "Your feet land wide or far from your hands.",
        fix: "Step your feet in right beside your hands before you stand." }
    ],
    safety: [
      RED,
      "If your wrists or knees complain, put your hands on something higher or squat shallower."
    ],
    prereq: [
      "A step-back plank.",
      "Getting up from the floor comfortably."
    ]
  };

  C.cond_burpee = {
    summary: "A burpee: squat, step or jump back to a plank, bring your feet in and stand, with a small hop at the top if it feels right.",
    setup: [
      "Stand on a flat, non-slip floor with room behind you for your feet.",
      "Clear the space overhead if you plan to hop at the top.",
      "Use a mat if the floor is hard on your hands."
    ],
    steps: [
      "Squat down and put your hands on the floor in front of you.",
      "Step or jump your feet back into a plank, with your trunk braced.",
      "Bring your feet back in under your hips.",
      "Stand up, with a small hop at the top if it feels good."
    ],
    breathing: "Breathe out as your feet go back, and breathe in as you stand. Keep breathing between reps rather than holding.",
    tempo: "Keep a steady, even pace, and slow down when your plank starts to sag or the landings turn heavy.",
    feel: {
      should: "As effort across your legs, trunk and shoulders, with your breathing rising.",
      shouldnt: "As a sagging low back in the plank, or as heavy, jarring landings."
    },
    mistakes: [
      { mistake: "You sag through the middle in the plank.",
        fix: "Squeeze your glutes and brace your trunk before your feet go back." },
      { mistake: "You land hard on stiff legs.",
        fix: "Let your knees and ankles give as your feet arrive, or step instead of jumping." },
      { mistake: "Your hands drift forward and your reps get messy.",
        fix: "Put your hands down just ahead of your feet and keep the movement compact." }
    ],
    safety: [
      RED,
      "If your wrist, shoulder or knee hurts, step back instead of jumping, or go back to the no-jump burpee."
    ],
    prereq: [
      "A solid squat and plank.",
      "Getting up from the floor comfortably."
    ]
  };

  C.cond_burpeetuck = {
    summary: "A burpee finished with a tuck jump: you leave the floor, pull your knees toward your chest, and land softly.",
    setup: [
      "Stand on a flat, non-slip floor with clear space around and above you.",
      "Wear supportive shoes.",
      "Use a mat for your hands if the floor is hard."
    ],
    steps: [
      "Do a full burpee with your trunk braced, then stand.",
      "Jump straight up and pull your knees toward your chest.",
      "Open your legs before you land.",
      "Land softly with your knees in line with your toes, then reset on the ground."
    ],
    breathing: "Breathe out as you jump, and breathe in as you land. Reset your breath before the next rep.",
    tempo: "Take your time between reps so each jump and landing is clean, and end the set when the landings turn heavy.",
    feel: {
      should: "As a short, sharp burst through your legs, with your trunk holding steady.",
      shouldnt: "As jarring in your knees, ankles or Achilles tendons on landing."
    },
    mistakes: [
      { mistake: "You tuck by folding your torso forward.",
        fix: "Stay tall and bring your knees up to you instead of your chest down to them." },
      { mistake: "You land hard on stiff legs.",
        fix: "Land on the balls of your feet and let your knees and hips absorb it." },
      { mistake: "Your knees cave in on landing.",
        fix: "Point your knees the same way as your toes as your feet arrive." }
    ],
    safety: [
      RED,
      "If your knee, ankle or Achilles tendon hurts, drop the tuck jump and do a plain burpee."
    ],
    prereq: [
      "A controlled burpee.",
      "Repeated soft landings from a jump."
    ]
  };

  C.cond_burpeevest = {
    summary: "A burpee in a snug weighted vest, so the squat, plank and stand all carry extra load.",
    setup: [
      "Fit the vest snugly so it doesn't bounce or shift.",
      "Stand on a flat, non-slip floor with room behind you for your feet.",
      "Use a mat if the floor is hard on your hands."
    ],
    steps: [
      "Squat down and put your hands on the floor in front of you.",
      "Step or jump your feet back into a braced plank.",
      "Bring your feet back in under your hips.",
      "Stand tall, and slow down when your trunk starts to give out."
    ],
    breathing: "Breathe out as your feet go back, and breathe in as you stand. A vest makes breath-holding tempting, so check on it.",
    tempo: "Move at a steady pace slower than your plain burpee, and take your time standing up with the load.",
    feel: {
      should: "As heavier effort through your legs and trunk than a plain burpee.",
      shouldnt: "As a vest bouncing against you, or as your back sagging in the plank."
    },
    mistakes: [
      { mistake: "You wear a loose vest that shifts.",
        fix: "Tighten the vest so it sits close to your torso and doesn't move as you drop." },
      { mistake: "You collapse through your trunk as you tire.",
        fix: "End the set when your plank sags rather than pushing the form past that." },
      { mistake: "You land hard with the extra weight.",
        fix: "Step your feet back and in instead of jumping, and stand rather than hop." }
    ],
    safety: [
      RED,
      "If your wrist, back or knee hurts, take the vest off or go back to the no-jump burpee."
    ],
    prereq: [
      "A controlled burpee without a vest.",
      "A fitted vest that stays snug when you move."
    ]
  };

  C.cond_boxjump = {
    summary: "A box jump: swing your arms, jump onto a stable box, land softly with your whole foot on it, stand tall, and step down.",
    setup: [
      "Set a stable box that can't slide, lower than the height you can comfortably jump.",
      "Check that you have open space in front of the box and a safe way to step down.",
      "Wear supportive shoes."
    ],
    steps: [
      "Stand facing the box at a short distance, with your feet about hip-width apart.",
      "Swing your arms back, then forward as you jump onto the box.",
      "Land softly with your whole foot on the box and your knees bending.",
      "Stand tall on top, then step down one foot at a time.",
      "Reset before the next jump."
    ],
    breathing: "Breathe in as you load into the jump, breathe out as you leave the floor, and reset your breath between reps.",
    tempo: "Take your time between reps so each jump starts from stillness, and end the set when the landings get loud.",
    feel: {
      should: "As a quick, strong push through your legs, landing quietly on the box.",
      shouldnt: "As a heavy slam onto the box, or as jarring in your knees, ankles or Achilles tendons."
    },
    mistakes: [
      { mistake: "You choose a box higher than you can land on.",
        fix: "Use a lower box so you land with room to spare and your knees still bending." },
      { mistake: "You jump down to go again.",
        fix: "Step down one foot at a time and reset before each jump." },
      { mistake: "Only your toes reach the box.",
        fix: "Use a lower box and land with your whole foot on top." }
    ],
    safety: [
      RED,
      "If your knee, ankle or Achilles tendon hurts, use a step-up instead of jumping."
    ],
    prereq: [
      "A squat jump with a soft landing at a low height.",
      "A stable, non-slip box and space to land and step down."
    ],
    variations: {
      alternatives: [
        { id: "cond_broadjump", text: "No box, or a box that isn't stable enough: jump forward along the floor instead." }
      ]
    }
  };

  C.cond_broadjump = {
    summary: "A broad jump: swing your arms and jump forward as far as you can control, landing softly with your knees and hips bending together.",
    setup: [
      "Choose a flat, non-slip surface with clear ground in front of you.",
      "Mark your landing spot if you want to see how far you went.",
      "Wear supportive shoes."
    ],
    steps: [
      "Stand with your feet about hip-width apart and swing your arms back.",
      "Swing your arms forward as you jump out and up.",
      "Land with your knees and hips bending together and your feet under you.",
      "Stand up tall, then walk back and reset before the next jump."
    ],
    breathing: "Breathe in as you swing back, breathe out as you jump, and reset your breath as you walk back.",
    tempo: "Take your time between jumps so each one starts from stillness, and end the set when your landings get loud.",
    feel: {
      should: "As a quick drive through your legs, with a quiet landing.",
      shouldnt: "As straight-legged slamming onto the ground, or as jarring in your knees or ankles."
    },
    mistakes: [
      { mistake: "You reach your feet out in front of you on landing.",
        fix: "Jump a little shorter so your feet land under your hips." },
      { mistake: "You land with straight legs.",
        fix: "Bend your knees and hips together as your feet arrive." },
      { mistake: "You swing your arms little or not at all.",
        fix: "Swing your arms back and forward with the jump to help drive your hips." }
    ],
    safety: [
      RED,
      "If your knee, ankle or Achilles tendon hurts, switch to a low step-up instead."
    ],
    prereq: [
      "A squat jump with a soft landing.",
      "A controlled forward landing.",
      "A flat, non-slip runway with clear space to land."
    ]
  };
})();
