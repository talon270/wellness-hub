# Exercise guides — schema and style guide

Written 2026-10-06 (plan step 4.3) for the batch files beside it. Read this and the 12 exemplars before writing a guide. `node tools/check-exercise-content.js` enforces everything marked **(checked)**. A reviewer has to read for the rest.

**A guide teaches the movement and nothing else.** The app already knows your prescription, your ladder and your muscles. The guide covers what the app can't work out: how to set up, how a good rep moves, where you should feel it, and when to stop. If a sentence could go out of date when the rules change, it doesn't belong here.

## What a guide holds

`window.EXERCISE_CONTENT[id]`, one per id in `EXERCISE_DB`:

| Field | Shape | Bounds | Contents |
|---|---|---|---|
| `summary` | text | 40–180 characters, one sentence | What the movement is and what it's for, in plain words |
| `setup` | list | 2–5 items | Everything before the first rep: equipment, position, grip, brace |
| `steps` | list | 3–6 items | One rep, from start to finish, in order |
| `breathing` | text | 15–240 | When to breathe in and out, or how to breathe through a hold |
| `tempo` | text | 15–240 | The speed of each part of the rep, **in words** |
| `feel` | `{ should, shouldnt }` | 15–240 each | Where the work should land, and where it shouldn't |
| `mistakes` | list of `{ mistake, fix }` | 2–4 | The error as you'd notice it, and the one change that fixes it |
| `safety` | list | 1–3 items | Who should skip or change it, and the sign to stop |
| `prereq` | list | 1–3 items, **required** (checked) | What you should already be able to do, and what a support must be, in words |
| `variations` | `{ grip?, alternatives? }` | optional | See below |

Every string is 15–240 characters unless the table says otherwise, has no stray whitespace and ends with a full stop, question mark or exclamation mark **(checked)**. No other fields **(checked)**.

**`prereq`** prints first on the page as **Before you start**, and prints nothing when a record has none, which the checker no longer lets a guide do. It is a self-check written down: text, never a gate, and nothing in the app reads it. **No numbers (checked):** "a clean set of the rung before" is allowed, "ten push-ups" is not. Name a support by what it must do ("a table that doesn't slide"), because furniture is never an equipment token. It is required on every guide since plan step 3.5.

**`variations.grip.knuckles`**: 2–4 lines, on the six grip-capable push-ups and only there (`GRIPS.exercises`) **(checked both ways)**. It covers the front two knuckles, a straight wrist, starting on a mat or folded towel, and what changes compared with palms.

**`variations.alternatives`**: 1–4 `{ id, text }`, each a real exercise id other than this one **(checked)**. Use it for a sideways swap: the same job with different equipment or a different setup. Don't use it for the next easier or harder exercise, because the directory takes those from the ladder.

**Not written, because the app derives them:** easier and harder versions, muscles, joint stress, equipment, "in your program", and every number in a prescription.

## The rules

1. **Original wording.** Never copy from a book, a site or a video transcript, and don't paraphrase one closely either. `EXERCISE_DB`'s cues are the app's own, so reuse their facts, not their sentences.
2. **Plain English, second person, imperative.** "Set your hands under your shoulders." Not "the athlete should" and not "we".
3. **Metric only** **(checked)**: cm and kg, never inches or pounds.
4. **No prescription** **(checked)**: no rep ranges, set counts, hold times or progression thresholds, in digits or in words ("twelve reps", "a 60-second hold", "advance at", "sets of"). The app's rule is the only source of those. Tempo is written in words ("about two seconds down"), never as a figure.
5. **No medical claims** **(checked for the common ones)**: nothing prevents injury, fixes posture, heals, cures or rehabilitates. "Stop and get it looked at" is fine. Saying what it treats is not.
6. **No hype** **(checked)**: never "powerful", "ultimate", "revolutionary", "seamless", "leverage", "game-changer".
7. **Consistent with the cues.** If `EXERCISE_DB[id].cues` says elbows at about 45°, the guide doesn't say tucked. If you think a cue is wrong, say so in your progress entry instead of contradicting it here.
8. **Safety names a sign, not a diagnosis.** "Stop if the front of the shoulder pinches" names a sign. "This can tear your rotator cuff" makes a diagnosis. Neck guides must say to go slowly and to stop at dizziness, pain or tingling **(checked)**.
9. **Concrete over general.** "Squeeze as if pinching a pencil between your shoulder blades" beats "engage your back". Where a cue or a mistake has a measurable form, use it: a straight line from ears to heels, shins vertical.
10. **One idea per list item.** If a step needs "and then", it's two steps.

## Batch files

Each file adds to the same global and marks its own state. The checker owns which slots belong to which file **(checked: a guide in the wrong file fails)**.

```js
(function () {
  "use strict";
  var C = window.EXERCISE_CONTENT = window.EXERCISE_CONTENT || {};
  var B = window.EXERCISE_CONTENT_BATCHES = window.EXERCISE_CONTENT_BATCHES || {};
  B.a = "pending";        // "complete" once every exercise in the batch has a guide

  C.push_2 = { summary: "…", setup: [ … ], … };
})();
```

| File | Slots | Exercises |
|---|---|---|
| `batch-a.js` | push, shoulder, dip | 66 |
| `batch-b.js` | row, pull, squat, hinge, core | 106 |
| `batch-c1.js` | curl, lateral, reardelt, cuff, traps, neck, grip | 35 |
| `batch-c2.js` | quad, hamstring, calf, shin, adductor, abductor, antirot, backext | 43 |
| `batch-d.js` | conditioning | 13 |

The counts are as of the Yellow Dude catalogue (2026-10-06). The checker's "shipped" line is the live figure.

**Mark the batch `"complete"` in the same edit that writes its last guide.** A pending batch with every guide written fails, and so does a complete batch with one missing **(checked)**.

Skill-kind entries (planche, lever, handstand and L-sit attempts) get guides too: they sit in the push, row, shoulder and core slots, and the directory lists every exercise in the DB.

## The 12 exemplars

Push-up (with knuckles), Incline Push-up (with knuckles), Pike Push-up and Parallel Bar Dip are in `batch-a.js`. Pull-up, Table / Door-Edge Row, Bodyweight Squat, Bulgarian Split Squat, Hip Thrust, Nordic Curl Negative, Plank and Dumbbell Romanian Deadlift are in `batch-b.js`. Between them they cover every kind a batch will meet: reps, unilateral, eccentric, hold, loaded (per hand) and a setup ladder (Incline's surfaces).
