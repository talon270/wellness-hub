/* ============================================================================
   BASALT · TRAINING  (pure rules — no DOM, no storage, no App, no clock)
   ----------------------------------------------------------------------------
   Answers one question per exercise: from the sessions you've logged, should
   the next one step up, repeat, or step back? Every answer is recomputed from
   history and names the sessions it rests on. Nothing here writes anything;
   the caller stores only your choice.

   · comparable(sessions, rx)   the sessions that count as evidence for rx
   · exposures(sessions, id)    every logged appearance of one exercise
   · recommend(sessions, rx, o) ready | repeat | reduce, with its evidence
   · startOf(id, o)             a fresh prescription at the bottom of its range
   · owns(equipment, id)        whether your equipment covers an exercise
   · allowed(o, id, grip)       owned, not excluded, not avoided for a joint
   · blocked(o, id, grip)       why not: "equipment" | "excluded" | a joint | null
   · stress(id, grip)           an exercise's joint stress at a grip
   · customError(custom, unit)  why custom sets/range are out of bounds, or null
   · recoverySets(n)            a recovery block's set count for n sets

   GLOBALS EXPOSED
     window.Training   (needs window.TRAINING_DATA loaded first)

   WHAT A RECOMMENDATION IS, AND ISN'T
     A product rule over self-reported sets and effort: two sessions at the top
     of the range, on different days, rated easy or just right. It can't see
     form, pain you didn't flag, or recovery. Ready means "offer the step", and
     you choose — it is never applied for you.

   SHAPES
     rx       { exerciseId, setup, sets, range: [lo, hi], unit, acceptedAt, why,
                hold, custom: { sets, range, unit } }   — setup.grip absent is palms
     session  { id, dayKey, dateISO, exercises: [{ key, rx, sets: [{ reps, weight }],
                difficulty, skipped, flag }] }   — `reps` holds seconds for a hold
     exposure { sessionId, day, at, rx, values, weights, total, effort, flagged, skipped }
     o        what recommend and the steps read, all optional: { equipment,
                decisions, goal, exclusions, limitations, grip, loads } —
                APP_STATE.equipment, training.decisions, profile.goal,
                training.exclusions, training.limitations, training.grip
                ({ push: "knuckles", at }, or a grip id) and equipmentLoads
   ========================================================================== */
(function () {
  "use strict";

  var TD = window.TRAINING_DATA;
  var EX = TD.EXERCISES, SETUPS = TD.SETUPS;

  /* --------------------------------------------------------------------------
     1) READING SESSIONS
     ------------------------------------------------------------------------ */

  /* A session's training day. Stage 1 writes dayKey on every new session and
     the v4 migration writes it onto legacy ones, so the fallback — the local
     calendar date, without the rollover hour — only covers un-migrated input.
     Legacy sessions carry no rx and never count as evidence anyway. */
  function dayOf(s) {
    if (s.dayKey) return s.dayKey;
    var d = new Date(s.dateISO);
    if (isNaN(d)) return "";
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  /* Every logged appearance of one exercise, oldest first: by training day,
     then session id. A session id seen twice (two devices, one merge) counts
     once. An exercise is matched by its saved prescription's id, else by its
     key, so legacy sessions without rx still show as history.

     Without rx, "moderate" reads as unknown effort (plan C6): the build before
     Stage 1 saved it for a blank rating, so it can't be told from "just
     right". Applied here, at read time, rather than marked by the migration,
     so it also covers sessions a Stage 1 device saves after the upgrade. */
  function exposures(sessions, exerciseId) {
    var seen = {}, out = [];
    (sessions || []).forEach(function (s) {
      if (!s || seen[s.id]) return;
      var ex = (s.exercises || []).filter(function (e) {
        return (e.rx ? e.rx.exerciseId : e.key) === exerciseId;
      })[0];
      if (!ex) return;
      seen[s.id] = true;
      var values = (ex.sets || []).map(function (st) { return Number(st.reps) || 0; });
      /* The weight on each set as logged; null where none was saved. */
      var weights = (ex.sets || []).map(function (st) {
        var w = st.weight == null || st.weight === "" ? NaN : Number(st.weight);
        return isNaN(w) ? null : w;
      });
      out.push({
        sessionId: s.id, day: dayOf(s), at: s.dateISO || null, rx: ex.rx || null, values: values, weights: weights,
        total: values.reduce(function (a, b) { return a + b; }, 0),
        effort: !ex.rx && ex.difficulty === "moderate" ? null : ex.difficulty || null,
        flagged: !!(ex.flag && ex.flag.bodyPart), skipped: !!ex.skipped,
        recovery: !!s.recovery
      });
    });
    return out.sort(function (a, b) {
      return a.day < b.day ? -1 : a.day > b.day ? 1 :
             a.sessionId < b.sessionId ? -1 : a.sessionId > b.sessionId ? 1 : 0;
    });
  }

  /* Setups compare by value, with keys in any order; null and {} are equal.
     `drop` lists keys left out of the comparison. */
  function setupKey(setup, drop) {
    var o = setup || {};
    return JSON.stringify(Object.keys(o).filter(function (k) { return (drop || []).indexOf(k) < 0; })
      .sort().map(function (k) { return [k, o[k]]; }));
  }

  /* Grips run easiest first (GRIPS.values), and absent is palms. Done on a
     grip at least as hard as the rx's, a session is the rx's work (plan C1):
     knuckles count for palms, palms never for knuckles. An unknown grip
     matches nothing. */
  var GRIP_IDS = TD.GRIPS.values.map(function (g) { return g.id; });
  function gripRank(setup) { return GRIP_IDS.indexOf((setup && setup.grip) || "palms"); }
  function sameWork(done, rx, drop) {
    var d = gripRank(done), r = gripRank(rx);
    return d >= 0 && r >= 0 && d >= r && setupKey(done, ["grip"].concat(drop || [])) === setupKey(rx, ["grip"].concat(drop || []));
  }

  /* A loaded prescription whose weight was never logged: "3 × 12" at an
     unknown load says nothing about the next load, and there's no load to
     step from. */
  function noLoad(rx) { return !!(rx && rx.setup && rx.setup.loadMode && rx.setup.loadKg == null); }

  /* The one weight every performed set (a value above 0) was logged at, or
     null: nothing performed, a set without a weight, or mixed weights. */
  function loggedKg(e) {
    var kgs = e.weights.filter(function (w, i) { return e.values[i] > 0; });
    return kgs.length && kgs[0] != null && kgs.every(function (k) { return k === kgs[0]; }) ? kgs[0] : null;
  }

  /* A loaded exposure counts only when every performed set was at its rx
     load (F1): a session prescribed 10 kg and lifted at 5 kg is evidence for
     5 kg, not 10. A build before this fix saved the prescribed load whatever
     you lifted, so the saved rx alone can't be trusted. Unloaded work, and a
     session with nothing performed, pass. */
  function atLoad(e) {
    if (!e.rx.setup || !e.rx.setup.loadMode) return true;
    var kg = e.rx.setup.loadKg;
    return e.values.every(function (v, i) { return !(v > 0) || e.weights[i] === kg; });
  }

  /* Comparable: the same exercise, unit, setup and set count, done as
     prescribed — not flagged, not skipped, and at a known load that every
     performed set was lifted at. A session without rx is unknown evidence
     and never comparable.

     The range is deliberately not part of the key. Changing goal changes the
     range (plan D2), but 3 × 12 at table height is the same work whatever
     range it was aimed at, so older sessions are judged against the current
     top: switch Size → Strength and 3 × 15 already clears 8, which is the
     right answer — that setup is too easy for a 4–8 range.

     A session done inside a recovery block (`session.recovery`, plan D3) is
     never evidence: its sets were cut on purpose, and at one set a block
     leaves the count unchanged, so the set count alone can't exclude it. */
  function comparable(sessions, rx) {
    return exposures(sessions, rx.exerciseId).filter(function (e) {
      return e.rx && !e.flagged && !e.skipped && !e.recovery && !noLoad(e.rx) &&
             e.rx.unit === rx.unit && e.rx.sets === rx.sets &&
             sameWork(e.rx.setup, rx.setup) && atLoad(e);
    });
  }

  /* The latest session of a loaded rx's exercise, done as prescribed apart
     from the weight, when every performed set used one weight that isn't the
     rx's load: "logged at 5 kg, not 10 kg". null when the latest such session
     was at the rx load, or its weights were mixed.

     Sessions finished before the rx was accepted belong to an earlier
     prescription (R1-1): after a load step from 10 kg to 12.5 kg, the 10 kg
     sessions that earned it aren't "logged at 10 kg, not 12.5 kg". An rx
     without `acceptedAt` has no such limit. */
  function offLoad(sessions, rx) {
    if (!rx.setup || !rx.setup.loadMode || rx.setup.loadKg == null) return null;
    var near = exposures(sessions, rx.exerciseId).filter(function (e) {
      return e.rx && !e.flagged && !e.skipped && !e.recovery &&
             !(rx.acceptedAt && e.at && e.at < rx.acceptedAt) &&
             e.rx.unit === rx.unit && e.rx.sets === rx.sets && sameWork(e.rx.setup, rx.setup, ["loadKg"]);
    });
    var e = near[near.length - 1], kg = e ? loggedKg(e) : null;
    return kg > 0 && kg !== rx.setup.loadKg ? { exposure: e, kg: kg } : null;
  }

  /* A recovery block's working sets: n x 0.6 rounded, never below the floor
     (3 -> 2, 4 -> 2, 2 -> 1). Never raises a count. */
  function recoverySets(n) {
    var R = TD.RECOVERY_BLOCK;
    return Math.min(n, Math.max(R.minSets, Math.round(n * R.setFactor)));
  }

  /* --------------------------------------------------------------------------
     2) EQUIPMENT AND STEPS
     ------------------------------------------------------------------------ */

  /* `equipment` is APP_STATE.equipment ({ pullupBar: false, bench: true, … }).
     Omitted, everything counts as owned. An array entry is any-of. */
  function owns(equipment, id) {
    if (!equipment) return true;
    return (EX[id].equipment || []).every(function (t) {
      return Array.isArray(t) ? t.some(function (u) { return !!equipment[u]; }) : !!equipment[t];
    });
  }

  /* Your standing grip for an exercise's slot: `o.grip` is training.grip
     ({ push: "knuckles", at }) or a grip id. null when you haven't chosen. */
  function standingGrip(o, id) {
    var g = o && o.grip;
    return typeof g === "string" ? g : (g && EX[id] && g[EX[id].slot]) || null;
  }
  function gripCapable(id) { return TD.GRIPS.exercises.indexOf(id) >= 0; }

  /* JOINT_STRESS at a grip: knuckles take GRIPS' relief off the wrist, on
     the push-ups that take a grip. A copy; zeros are left out. */
  function stress(id, grip) {
    var base = TD.JOINT_STRESS[id] || {}, out = {};
    var G = gripCapable(id) && TD.GRIPS.values.filter(function (v) { return v.id === grip; })[0];
    Object.keys(base).forEach(function (j) {
      var n = base[j] - ((G && G.relief && G.relief[j]) || 0);
      if (n > 0) out[j] = n;
    });
    return out;
  }

  /* Why an exercise can't be prescribed, or null (plan C3): equipment you
     don't own, an exclusion, or a joint you said to avoid that it loads at
     stress 2 (the joint's name). "Allow anyway" is an exclusion record in
     state "allowed": it lets the exercise past a limitation. `grip` defaults
     to your standing grip. A filter over a rubric, not an assessment of an
     injury. */
  function blocked(o, id, grip) {
    o = o || {};
    if (!owns(o.equipment, id)) return "equipment";
    var x = o.exclusions && o.exclusions[id];
    if (x && x.state === "excluded") return "excluded";
    if (x && x.state === "allowed") return null;
    var L = o.limitations || {}, st = stress(id, grip !== undefined ? grip : standingGrip(o, id));
    return TD.JOINTS.filter(function (j) { return L[j] === "avoid" && st[j] >= 2; })[0] || null;
  }
  function allowed(o, id, grip) { return !blocked(o, id, grip); }

  /* The weights you have for the implement a loaded exercise steps by: the
     first owned one it lists, from `o.loads` (APP_STATE.equipmentLoads), else
     today's default — adjustable in LOAD_STEP_KG steps, no maximum. */
  function loadSpec(id, o) {
    var eq = o && o.equipment;
    var toks = [].concat.apply([], (EX[id].equipment || []).map(function (t) { return Array.isArray(t) ? t : [t]; }));
    var impl = toks.filter(function (t) { return TD.LOAD_STEP_KG[t] && (!eq || eq[t]); })[0];
    if (!impl) return null;
    return (o && o.loads && o.loads[impl]) || { mode: "adjustable", stepKg: TD.LOAD_STEP_KG[impl] };
  }

  /* The next weight up (dir 1) or down (dir -1) that you have, or null:
     fixed weights go to the next one listed; adjustable ones by their step,
     never above maxKg or down to 0. */
  function loadAfter(id, kg, dir, o) {
    var L = loadSpec(id, o);
    if (!L || kg == null) return null;
    if (L.mode === "fixed") {
      var ks = (L.kg || []).filter(function (k) { return k > 0 && (dir > 0 ? k > kg : k < kg); })
        .sort(function (a, b) { return a - b; });
      return ks.length ? ks[dir > 0 ? 0 : ks.length - 1] : null;
    }
    if (!(L.stepKg > 0)) return null;
    var n = Math.round((kg + dir * L.stepKg) * 1000) / 1000;
    return n <= 0 || (dir > 0 && L.maxKg != null && n > L.maxKg) ? null : n;
  }

  /* Why custom sets/range (plan C4) are out of bounds, or null. Either part
     may be left out. Sets 1–6; range lo ≥ 1, hi ≥ lo + 2, hi ≤ 50 reps or
     300 s. The bounds are product choices, like every number here. */
  var CUSTOM_MAX = { reps: 50, sec: 300 }, CUSTOM_SETS = [1, 6];
  function customError(c, unit) {
    if (!c) return null;
    if (c.sets != null && !(c.sets % 1 === 0 && c.sets >= CUSTOM_SETS[0] && c.sets <= CUSTOM_SETS[1]))
      return "Sets go from " + CUSTOM_SETS[0] + " to " + CUSTOM_SETS[1] + ".";
    if (c.range != null) {
      var lo = c.range[0], hi = c.range[1], max = CUSTOM_MAX[unit] || CUSTOM_MAX.reps;
      if (!(lo % 1 === 0 && hi % 1 === 0 && lo >= 1)) return "The range needs two whole numbers from 1.";
      if (hi < lo + 2) return "The top needs to be at least 2 above the bottom.";
      if (hi > max) return "The top can be at most " + max + (unit === "sec" ? " s." : " reps.");
    }
    return null;
  }

  /* o: { setup, loadKg, why, at, goal, grip, custom }. `goal` picks the
     range (D2). `grip` (or setup.grip) is kept only on a push-up that takes
     one, and only when it isn't palms. `custom` overrides the set count and
     range where it's in bounds; its range applies only to an exercise in the
     same unit, so a hold's seconds never become a rep range. */
  function startOf(exerciseId, o) {
    o = o || {};
    var r = TD.rangeFor(exerciseId, o.goal);
    if (!r) return null;
    var e = EX[exerciseId], setup = {}, S = SETUPS[exerciseId];
    if (S) {
      var want = o.setup && o.setup[S.key];
      setup[S.key] = S.values.some(function (v) { return v.id === want; }) ? want : S.values[0].id;
    }
    var grip = o.grip || (o.setup && o.setup.grip);
    if (grip && grip !== "palms" && gripCapable(exerciseId) && GRIP_IDS.indexOf(grip) >= 0) setup.grip = grip;
    if (e.loadMode) {
      setup.loadKg = o.loadKg != null ? o.loadKg : null;
      setup.loadMode = e.loadMode;
    }
    var rx = { exerciseId: exerciseId, setup: setup, sets: r.sets, range: [r.lo, r.hi],
               unit: r.unit, acceptedAt: o.at || null, why: o.why || null };
    var c = o.custom, custom = {};
    if (c && c.sets != null && !customError({ sets: c.sets }, r.unit)) custom.sets = rx.sets = c.sets;
    if (c && c.range && (!c.unit || c.unit === r.unit) && !customError({ range: c.range }, r.unit)) {
      custom.range = c.range.slice(); rx.range = c.range.slice();
    }
    if (Object.keys(custom).length) { custom.unit = r.unit; rx.custom = custom; }
    return rx;
  }

  /* What a step keeps from the rx it leaves: the goal, your grip (standing,
     else the rx's own) and custom sets/range. */
  function carry(rx, o) {
    return { goal: o.goal, grip: standingGrip(o, rx.exerciseId) || (rx.setup && rx.setup.grip) || null,
             custom: rx.custom ? { sets: rx.custom.sets, range: rx.custom.range, unit: rx.unit } : null };
  }
  function also(base, extra) {
    var out = {}; [base, extra].forEach(function (x) { Object.keys(x).forEach(function (k) { out[k] = x[k]; }); });
    return out;
  }
  /* A grip applies to a candidate only if it takes one. */
  function okAt(o, id, grip) { return allowed(o, id, gripCapable(id) ? grip : null); }

  /* One step harder: the next setup, then the next weight you have, then the
     first allowed main-path successor at its easiest setup. A blocked rung
     (not owned, excluded, avoided) is walked round: its own successors are
     tried, nearest first (K3). */
  function stepUp(rx, o) {
    o = o || {};
    var id = rx.exerciseId, S = SETUPS[id], setup = rx.setup || {}, keep = carry(rx, o);
    if (S) {
      var i = S.values.map(function (v) { return v.id; }).indexOf(setup[S.key]);
      if (i >= 0 && i < S.values.length - 1) {
        var up = {}; up[S.key] = S.values[i + 1].id;
        return { kind: "setup", rx: startOf(id, also(keep, { setup: up })) };
      }
    }
    if (EX[id].loadMode) {
      if (setup.loadKg == null) return null;
      var kg = loadAfter(id, setup.loadKg, 1, o);
      if (kg != null) return { kind: "load", rx: startOf(id, also(keep, { loadKg: kg })) };
    }
    var seen = {}, level = EX[id].next.slice();
    while (level.length) {
      var hit = level.filter(function (x) { return okAt(o, x, keep.grip); })[0];
      if (hit) return { kind: "movement", rx: startOf(hit, keep) };
      var further = [];
      level.forEach(function (x) {
        if (!seen[x]) { seen[x] = true; further = further.concat(EX[x].next); }
      });
      level = further;
    }
    return null;
  }

  /* One step easier: the previous setup, then the next lighter weight you
     have, then a predecessor at its hardest setup. A predecessor is an
     exercise whose `next` or `offer` names this one, so a branch move steps
     back to the exercise that offered it (Archer → Decline). Blocked ones
     are walked round, nearest first. Of several at the same distance
     (Negative or band-assisted before Pull-up), the one you trained most
     recently; on a tie, one whose `next` names it before one that only
     offers it (Archer Pull-up → Chin-up, not Pull-up). */
  function stepDown(rx, sessions, o) {
    o = o || {};
    var id = rx.exerciseId, S = SETUPS[id], setup = rx.setup || {}, keep = carry(rx, o);
    if (S) {
      var i = S.values.map(function (v) { return v.id; }).indexOf(setup[S.key]);
      if (i > 0) {
        var dn = {}; dn[S.key] = S.values[i - 1].id;
        return { kind: "setup", rx: startOf(id, also(keep, { setup: dn })) };
      }
    }
    if (EX[id].loadMode) {
      if (setup.loadKg == null) return null;
      var kg = loadAfter(id, setup.loadKg, -1, o);
      if (kg != null) return { kind: "load", rx: startOf(id, also(keep, { loadKg: kg })) };
    }
    var lastDay = function (p) { var h = exposures(sessions, p); return h.length ? h[h.length - 1].day : ""; };
    var onPath = function (p) { return level.some(function (c) { return EX[p].next.indexOf(c) >= 0; }) ? 0 : 1; };
    var seen = {}, level = [id];
    seen[id] = true;
    while (level.length) {
      var preds = Object.keys(EX).filter(function (p) {
        return !seen[p] && level.some(function (c) { return EX[p].next.indexOf(c) >= 0 || EX[p].offer.indexOf(c) >= 0; });
      });
      preds.forEach(function (p) { seen[p] = true; });
      var ok = preds.filter(function (p) { return okAt(o, p, keep.grip); });
      if (ok.length) {
        ok.sort(function (a, b) { var x = lastDay(a), y = lastDay(b); return x > y ? -1 : x < y ? 1 : onPath(a) - onPath(b); });
        var P = SETUPS[ok[0]], hard = {};
        if (P) hard[P.key] = P.values[P.values.length - 1].id;
        return { kind: "movement", rx: startOf(ok[0], also(keep, { setup: hard })) };
      }
      level = preds;
    }
    return null;
  }

  /* --------------------------------------------------------------------------
     3) THE RECOMMENDATION
     ------------------------------------------------------------------------ */

  /* o: see SHAPES. decisions maps "exerciseId|sessionId" to
     { choice, at }, keyed by the latest comparable session — new evidence is a
     new key, so an old "Repeat" never hides a new offer.

     Returns { action, why, key, decision, atTop, history, evidence, step,
     double, steps, options, optionSteps, heaviest, unowned }:
       action    "ready" | "reduce" | "repeat"
       why       ready · declining · no-load (a loaded rx with no weight
                 logged yet) · off-load (the latest session was lifted at
                 another weight, `loggedKg`; key and evidence are that
                 session) · no-history · one-session · same-day ·
                 below-top (with belowSet, a 0-based index, and hi) · effort ·
                 no-standard (a skill whose text names no number) · hold
                 (ready, but rx.hold pauses step-ups: no step, no options;
                 step back is still offered)
       atTop     the most recent comparable sessions at the top, up to N
       history   every comparable exposure, oldest first ("Last: 10 / 9 / 8")
       evidence  the exposures the action rests on (their days are the dates
                 the card names)
       step      ready: { kind, rx } one step harder, or null at the end of a
                 path; reduce: one step easier
       double    ready: true when both evidence sessions reached
                 DOUBLE_STEP_AT × the top on every set and a second step
                 exists; `steps` is then [step, the step after it]
       options   ready: optional branch entries allowed for you (never
                 compulsory)
       optionSteps  ready: the options you can step into, as
                 [{ kind: "option", rx }] — not skill-kind ones, which stay
                 in Skills
       heaviest  ready on a loaded rx: true when no heavier weight you have
                 is listed, so the step (if any) is to the next movement
       unowned   ready: main-path successors that need equipment you don't own */
  function recommend(sessions, rx, o) {
    o = o || {};
    var N = TD.EVIDENCE_SESSIONS, hi = rx.range ? rx.range[1] : null;
    var hist = comparable(sessions, rx);
    var latest = hist[hist.length - 1];
    var key = latest ? rx.exerciseId + "|" + latest.sessionId : null;
    var out = { action: "repeat", why: null, key: key,
                decision: (key && o.decisions && o.decisions[key]) || null,
                history: hist, evidence: hist.slice(-N), step: null, double: false, steps: null,
                options: [], optionSteps: [], heaviest: false, unowned: [] };

    var last = hist.slice(-N), days = {};
    last.forEach(function (e) { days[e.day] = true; });
    /* The first prescribed set under `at`, or -1. A set left blank saves as
       0, so a missing set is a set below the top. */
    var under = function (e, at) {
      for (var i = 0; i < rx.sets; i++) if (!(e.values[i] >= at)) return i;
      return -1;
    };
    var below = function (e) { return under(e, hi); };
    var off = noLoad(rx) ? null : offLoad(sessions, rx);
    /* How many of the most recent comparable sessions, up to N, were at the
       top: the card's "1 of 2 at 3 × 12". */
    out.atTop = 0;
    for (var j = hist.length - 1; j >= 0 && out.atTop < N && hi != null && below(hist[j]) < 0; j--) out.atTop++;

    if (noLoad(rx)) out.why = "no-load";
    else if (off) {
      /* What you lift now is the question, not older sessions at the rx load:
         no step, no step back. The card offers to set the slot to `loggedKg`. */
      out.why = "off-load"; out.loggedKg = off.kg; out.evidence = [off.exposure];
      out.key = rx.exerciseId + "|" + off.exposure.sessionId;
      out.decision = (o.decisions && o.decisions[out.key]) || null;
      return out;
    }
    else if (!hist.length) out.why = "no-history";
    else if (hi == null) out.why = "no-standard";
    else if (below(latest) >= 0) { out.why = "below-top"; out.hi = hi; out.belowSet = below(latest); }
    else if (out.atTop < N) out.why = "one-session";
    else if (Object.keys(days).length < N) out.why = "same-day";
    else if (!last.every(function (e) { return TD.READY_EFFORTS.indexOf(e.effort) >= 0; })) out.why = "effort";
    else if (rx.hold) out.why = "hold";
    else {
      var ex = EX[rx.exerciseId], keep = carry(rx, o);
      out.action = "ready"; out.why = "ready";
      out.step = stepUp(rx, o);
      if (ex.loadMode && rx.setup && rx.setup.loadKg != null && loadSpec(rx.exerciseId, o))
        out.heaviest = loadAfter(rx.exerciseId, rx.setup.loadKg, 1, o) == null;
      /* Far past the top in both sessions (F9): offer the step after it too.
         The first step is the normal one; without a second, it's one step. */
      var big = TD.DOUBLE_STEP_AT * hi;
      var second = out.step && last.every(function (e) { return under(e, big) < 0; })
        ? stepUp(out.step.rx, o) : null;
      if (second) { out.double = true; out.steps = [out.step, second]; }
      out.options = ex.offer.filter(function (x) { return okAt(o, x, keep.grip); });
      out.optionSteps = out.options.filter(function (x) { return EX[x].kind !== "skill"; })
        .map(function (x) { return { kind: "option", rx: startOf(x, keep) }; });
      out.unowned = ex.next.filter(function (x) { return !owns(o.equipment, x); });
      return out;
    }

    /* Reduce (F2): three sessions, two falling totals — and a real fall, not
       noise. The latest isn't at the top on every set (still at or over the
       top is an effort question, not a step back), and either its total is
       REDUCE_MIN_DROP or more below the best of the three, or a set fell
       under the bottom of the range. With no top (a skill without a
       standard), only the size of the fall decides. */
    var run = hist.slice(-(N + 1)), lo = rx.range ? rx.range[0] : null;
    var falling = run.length === N + 1 && run.every(function (e, i) { return i === 0 || e.total < run[i - 1].total; });
    var realFall = function () {
      if (hi != null && below(latest) < 0) return false;
      var best = Math.max.apply(null, run.map(function (e) { return e.total; }));
      /* The epsilon keeps a fall of exactly REDUCE_MIN_DROP a fall when the
         product rounds up in floating point (3 × 0.1 is 0.30000000000000004). */
      return best - latest.total >= best * TD.REDUCE_MIN_DROP - 1e-9 ||
             (lo != null && under(latest, lo) >= 0);
    };
    if (falling && realFall()) {
      var down = stepDown(rx, sessions, o);
      if (down) {
        out.action = "reduce"; out.why = "declining";
        out.step = down; out.evidence = run;
      }
    }
    return out;
  }

  window.Training = {
    comparable: comparable, exposures: exposures,
    recommend: recommend, startOf: startOf, stepUp: stepUp, owns: owns, recoverySets: recoverySets,
    allowed: allowed, blocked: blocked, stress: stress, customError: customError
  };
})();
