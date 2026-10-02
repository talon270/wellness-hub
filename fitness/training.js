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
   · recoverySets(n)            a recovery block's set count for n sets

   GLOBALS EXPOSED
     window.Training   (needs window.TRAINING_DATA loaded first)

   WHAT A RECOMMENDATION IS, AND ISN'T
     A product rule over self-reported sets and effort: two sessions at the top
     of the range, on different days, rated easy or just right. It can't see
     form, pain you didn't flag, or recovery. Ready means "offer the step", and
     you choose — it is never applied for you.

   SHAPES
     rx       { exerciseId, setup, sets, range: [lo, hi], unit, acceptedAt, why }
     session  { id, dayKey, dateISO, exercises: [{ key, rx, sets: [{ reps }],
                difficulty, skipped, flag }] }   — `reps` holds seconds for a hold
     exposure { sessionId, day, rx, values, total, effort, flagged, skipped }
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
      out.push({
        sessionId: s.id, day: dayOf(s), rx: ex.rx || null, values: values,
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

  /* Setups compare by value, with keys in any order; null and {} are equal. */
  function setupKey(setup) {
    var o = setup || {};
    return JSON.stringify(Object.keys(o).sort().map(function (k) { return [k, o[k]]; }));
  }

  /* A loaded prescription whose weight was never logged: "3 × 12" at an
     unknown load says nothing about the next load, and there's no load to
     step from. */
  function noLoad(rx) { return !!(rx && rx.setup && rx.setup.loadMode && rx.setup.loadKg == null); }

  /* Comparable: the same exercise, unit, setup and set count, done as
     prescribed — not flagged, not skipped, and at a known load. A session
     without rx is unknown evidence and never comparable.

     The range is deliberately not part of the key. Changing goal changes the
     range (plan D2), but 3 × 12 at table height is the same work whatever
     range it was aimed at, so older sessions are judged against the current
     top: switch Size → Strength and 3 × 15 already clears 8, which is the
     right answer — that setup is too easy for a 4–8 range.

     A session done inside a recovery block (`session.recovery`, plan D3) is
     never evidence: its sets were cut on purpose, and at one set a block
     leaves the count unchanged, so the set count alone can't exclude it. */
  function comparable(sessions, rx) {
    var key = setupKey(rx.setup);
    return exposures(sessions, rx.exerciseId).filter(function (e) {
      return e.rx && !e.flagged && !e.skipped && !e.recovery && !noLoad(e.rx) &&
             e.rx.unit === rx.unit && e.rx.sets === rx.sets &&
             setupKey(e.rx.setup) === key;
    });
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

  /* The implement a loaded exercise steps by: the first owned one it lists. */
  function loadStep(id, equipment) {
    var toks = [].concat.apply([], (EX[id].equipment || []).map(function (t) { return Array.isArray(t) ? t : [t]; }));
    var impl = toks.filter(function (t) { return TD.LOAD_STEP_KG[t] && (!equipment || equipment[t]); })[0];
    return impl ? TD.LOAD_STEP_KG[impl] : null;
  }

  /* o: { setup, loadKg, why, at, goal }. `goal` picks the range (D2). */
  function startOf(exerciseId, o) {
    o = o || {};
    var r = TD.rangeFor(exerciseId, o.goal);
    if (!r) return null;
    var e = EX[exerciseId], setup = {}, S = SETUPS[exerciseId];
    if (S) {
      var want = o.setup && o.setup[S.key];
      setup[S.key] = S.values.some(function (v) { return v.id === want; }) ? want : S.values[0].id;
    }
    if (e.loadMode) {
      setup.loadKg = o.loadKg != null ? o.loadKg : null;
      setup.loadMode = e.loadMode;
    }
    return { exerciseId: exerciseId, setup: setup, sets: r.sets, range: [r.lo, r.hi],
             unit: r.unit, acceptedAt: o.at || null, why: o.why || null };
  }

  /* One step harder: the next setup, then +one load step, then the first
     owned main-path successor at its easiest setup. */
  function stepUp(rx, equipment, goal) {
    var id = rx.exerciseId, S = SETUPS[id], setup = rx.setup || {};
    if (S) {
      var i = S.values.map(function (v) { return v.id; }).indexOf(setup[S.key]);
      if (i >= 0 && i < S.values.length - 1) {
        var up = {}; up[S.key] = S.values[i + 1].id;
        return { kind: "setup", rx: startOf(id, { setup: up, goal: goal }) };
      }
    }
    if (EX[id].loadMode) {
      var kg = loadStep(id, equipment);
      return setup.loadKg != null && kg ? { kind: "load", rx: startOf(id, { loadKg: setup.loadKg + kg, goal: goal }) } : null;
    }
    var n = EX[id].next.filter(function (x) { return owns(equipment, x); })[0];
    return n ? { kind: "movement", rx: startOf(n, { goal: goal }) } : null;
  }

  /* One step easier: the previous setup, then −one load step, then a
     predecessor at its hardest setup. Of several predecessors (Negative or
     band-assisted before Pull-up), the one you trained most recently. */
  function stepDown(rx, sessions, equipment, goal) {
    var id = rx.exerciseId, S = SETUPS[id], setup = rx.setup || {};
    if (S) {
      var i = S.values.map(function (v) { return v.id; }).indexOf(setup[S.key]);
      if (i > 0) {
        var dn = {}; dn[S.key] = S.values[i - 1].id;
        return { kind: "setup", rx: startOf(id, { setup: dn, goal: goal }) };
      }
    }
    if (EX[id].loadMode) {
      var kg = loadStep(id, equipment);
      return setup.loadKg != null && kg && setup.loadKg - kg > 0 ?
        { kind: "load", rx: startOf(id, { loadKg: setup.loadKg - kg, goal: goal }) } : null;
    }
    var preds = Object.keys(EX).filter(function (p) {
      return EX[p].next.indexOf(id) >= 0 && owns(equipment, p);
    });
    var lastDay = function (p) { var h = exposures(sessions, p); return h.length ? h[h.length - 1].day : ""; };
    preds.sort(function (a, b) { var x = lastDay(a), y = lastDay(b); return x > y ? -1 : x < y ? 1 : 0; });
    if (!preds.length) return null;
    var P = SETUPS[preds[0]], hard = {};
    if (P) hard[P.key] = P.values[P.values.length - 1].id;
    return { kind: "movement", rx: startOf(preds[0], { setup: hard, goal: goal }) };
  }

  /* --------------------------------------------------------------------------
     3) THE RECOMMENDATION
     ------------------------------------------------------------------------ */

  /* o: { equipment, decisions, goal }. decisions maps "exerciseId|sessionId" to
     { choice, at }, keyed by the latest comparable session — new evidence is a
     new key, so an old "Repeat" never hides a new offer.

     Returns { action, why, key, decision, atTop, history, evidence, step,
     options, unowned }:
       action    "ready" | "reduce" | "repeat"
       why       ready · declining · no-load (a loaded rx with no weight
                 logged yet) · no-history · one-session · same-day ·
                 below-top (with belowSet, a 0-based index, and hi) · effort ·
                 no-standard (a skill whose text names no number)
       atTop     the most recent comparable sessions at the top, up to N
       history   every comparable exposure, oldest first ("Last: 10 / 9 / 8")
       evidence  the exposures the action rests on (their days are the dates
                 the card names)
       step      ready: { kind, rx } one step harder, or null at the end of a
                 path; reduce: one step easier
       options   ready: optional branch entries you own (never compulsory)
       unowned   ready: main-path successors that need equipment you don't own */
  function recommend(sessions, rx, o) {
    o = o || {};
    var N = TD.EVIDENCE_SESSIONS, hi = rx.range ? rx.range[1] : null;
    var hist = comparable(sessions, rx);
    var latest = hist[hist.length - 1];
    var key = latest ? rx.exerciseId + "|" + latest.sessionId : null;
    var out = { action: "repeat", why: null, key: key,
                decision: (key && o.decisions && o.decisions[key]) || null,
                history: hist, evidence: hist.slice(-N), step: null, options: [], unowned: [] };

    var last = hist.slice(-N), days = {};
    last.forEach(function (e) { days[e.day] = true; });
    /* A set left blank saves as 0, so a missing set is a set below the top. */
    var below = function (e) {
      for (var i = 0; i < rx.sets; i++) if (!(e.values[i] >= hi)) return i;
      return -1;
    };
    /* How many of the most recent comparable sessions, up to N, were at the
       top: the card's "1 of 2 at 3 × 12". */
    out.atTop = 0;
    for (var j = hist.length - 1; j >= 0 && out.atTop < N && hi != null && below(hist[j]) < 0; j--) out.atTop++;

    if (noLoad(rx)) out.why = "no-load";
    else if (!hist.length) out.why = "no-history";
    else if (hi == null) out.why = "no-standard";
    else if (below(latest) >= 0) { out.why = "below-top"; out.hi = hi; out.belowSet = below(latest); }
    else if (out.atTop < N) out.why = "one-session";
    else if (Object.keys(days).length < N) out.why = "same-day";
    else if (!last.every(function (e) { return TD.READY_EFFORTS.indexOf(e.effort) >= 0; })) out.why = "effort";
    else {
      var ex = EX[rx.exerciseId];
      out.action = "ready"; out.why = "ready";
      out.step = stepUp(rx, o.equipment, o.goal);
      out.options = ex.offer.filter(function (x) { return owns(o.equipment, x); });
      out.unowned = ex.next.filter(function (x) { return !owns(o.equipment, x); });
      return out;
    }

    /* Reduce: each of the two most recent comparable sessions totals less
       than the one before it — three sessions, two drops. */
    var run = hist.slice(-(N + 1));
    if (run.length === N + 1 && run.every(function (e, i) { return i === 0 || e.total < run[i - 1].total; })) {
      var down = stepDown(rx, sessions, o.equipment, o.goal);
      if (down) {
        out.action = "reduce"; out.why = "declining";
        out.step = down; out.evidence = run;
      }
    }
    return out;
  }

  window.Training = {
    comparable: comparable, exposures: exposures,
    recommend: recommend, startOf: startOf, owns: owns, recoverySets: recoverySets
  };
})();
