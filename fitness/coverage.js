/* ============================================================================
   BASALT · COVERAGE  (pure rules — no DOM, no storage, no App, no clock)
   ----------------------------------------------------------------------------
   Answers one question for the finisher and the mini-session (plan D3): which
   coverage slots should today's extra work go to? Per group it counts direct
   sets against the weekly floor, then picks the slots whose group falls
   furthest short and hasn't been trained directly in the last 48 h.

   · status(sessions, today, planned)   per group: floor, direct, planned,
                                        shortfall, lastDay, daysSince
   · pick(sessions, today, o)           the slots to train, best first, each
                                        with its rx and the reason in words.
                                        A `conditioning` slot trains no one
                                        group, so it is picked only when
                                        pinned for today, with group null

   GLOBALS EXPOSED
     window.Coverage   (needs TRAINING_DATA and the muscles.data.js globals)

   WHAT "DIRECT" MEANS, AND WHAT IT DOESN'T
     A direct set is a logged set above 0, on an exercise not skipped, where
     the group is a PRIMARY mover (muscles.data.js). Secondary and stabiliser
     work is real, but it's the reason biceps that only ever assist in rows
     read "On target" today (F7), so here it counts for nothing. A per-side
     hold or a unilateral set is one set: the cue says "repeat on the other
     side", so a logged set already means both. The floors are product
     choices (MUSCLE_FLOORS), not validated minimums, and the reason string
     says "of 6", never "you need 6".

   SHAPES
     sessions  APP_STATE.sessions — { dayKey, dateISO, completed, exercises:
               [{ key, pattern, sets: [{ reps }], skipped }] }
     today     the training day as a "YYYY-MM-DD" key (App.lib.today())
     planned   today's work not yet logged: [{ id, sets }] — the main slots a
               finisher is appended to. Counts toward the shortfall only
     o         { rxFor(slot) -> rx | null, planned, pins, n }
               rxFor is engine.prescriptionFor(slot).rx: null when the slot is
               off or nothing on it is allowed (C3), so a pick is always one
               you can do. pins is training.pins ({ slot: { days, at } });
               days are weekdays, 0 = Sunday, and an empty list is no pin
               (a clear is a stamped record, never null, so it syncs)
   ========================================================================== */
(function () {
  "use strict";

  /* The window direct sets are counted over: the Muscles screen's week. */
  var WINDOW_DAYS = 7;
  /* "Not trained directly in the last 48 h", in training days: a group
     trained today or yesterday is skipped, two days ago is fine. Read from
     logged sessions only. Today's planned main work doesn't count: on full
     body ×3 every session squats, so counting it would mean quads could never
     be topped up on a training day. */
  var REST_DAYS = 2;
  /* A finisher's size, about 20 minutes (plan D3). Mini-sessions pass 2–6. */
  var DEFAULT_PICKS = 4;

  var WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  /* A day key as a UTC day number, so day arithmetic never meets DST. */
  function dayNum(key) {
    var p = String(key).split("-");
    return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000;
  }
  /* A session's training day. dayKey is on every session since v4; the
     fallback is the local calendar date of its timestamp, as training.js's. */
  function dayOf(s) {
    if (s.dayKey) return s.dayKey;
    var d = new Date(s.dateISO);
    if (isNaN(d)) return null;
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function primaries(id, pattern) {
    var p = window.MUSCLE_MAP[id] || window.MUSCLE_FALLBACK[pattern];
    return (p && p.primary) || [];
  }

  /* Per group: { key, label, floor, direct, planned, shortfall, lastDay, daysSince }.
     daysSince and lastDay are null when the group has no direct set on record
     at all, not just this week. */
  function status(sessions, today, planned) {
    var out = {}, t = dayNum(today), seen = {};
    window.MUSCLE_GROUPS.forEach(function (g) {
      out[g.key] = { key: g.key, label: g.label, floor: (window.MUSCLE_FLOORS[g.key] || {}).sets || 0,
                     direct: 0, planned: 0, shortfall: 0, lastDay: null, daysSince: null };
    });
    (sessions || []).forEach(function (s) {
      var day = s && s.completed !== false && dayOf(s);
      if (!day || seen[s.id]) return;             /* one merge can hold a session twice */
      if (s.id) seen[s.id] = true;
      var ago = t - dayNum(day);
      if (ago < 0) return;
      (s.exercises || []).forEach(function (e) {
        if (e.skipped) return;
        var n = (e.sets || []).filter(function (st) { return Number(st && st.reps) > 0; }).length;
        if (!n) return;
        primaries(e.key, e.pattern).forEach(function (k) {
          var g = out[k];
          if (!g) return;
          if (ago < WINDOW_DAYS) g.direct += n;
          if (g.daysSince == null || ago < g.daysSince) { g.daysSince = ago; g.lastDay = day; }
        });
      });
    });
    (planned || []).forEach(function (p) {
      primaries(p.id).forEach(function (k) { if (out[k]) out[k].planned += Number(p.sets) || 0; });
    });
    Object.keys(out).forEach(function (k) {
      var g = out[k];
      g.shortfall = Math.max(0, g.floor - g.direct - g.planned);
    });
    return out;
  }

  function sentence(g) {
    return g.label + ": " + (g.direct + g.planned) + " of " + g.floor + " direct sets this week";
  }

  /* The coverage slots to train today, best first:
       1. pins for today's weekday, in slot order — your choice, so neither
          the shortfall nor the 48 h rule applies, and n doesn't cut them;
       2. then, up to n in all, slots whose group is short and wasn't trained
          directly in the last 48 h, ranked by shortfall ÷ floor, then days
          since last trained (never first), then slot order.
     A slot with no allowed prescription is never picked, pinned or not.
     Each pick: { slot, group, rx, pinned, shortfall, reason }. */
  function pick(sessions, today, o) {
    o = o || {};
    var SLOTS = window.TRAINING_DATA.SLOTS, n = o.n != null ? o.n : DEFAULT_PICKS;
    var st = status(sessions, today, o.planned), wd = new Date(dayNum(today) * 86400000).getUTCDay();
    var pins = o.pins || {}, picks = [], rest = [];
    Object.keys(SLOTS).forEach(function (slot, order) {
      if (!SLOTS[slot].coverage) return;
      /* A conditioning slot tops up no muscle, so no shortfall can ask for it:
         it runs only on a day you pinned it to. Every other slot trains at
         least one group, and the group it tops up is its most-short one. */
      var cond = !!SLOTS[slot].conditioning;
      var g = cond ? null : SLOTS[slot].trains.map(function (k) { return st[k]; })
        .sort(function (a, b) { return ratio(b) - ratio(a); })[0];
      var pin = pins[slot], pinned = !!(pin && Array.isArray(pin.days) && pin.days.indexOf(wd) >= 0);
      if (!pinned && (cond || g.shortfall <= 0 || (g.daysSince != null && g.daysSince < REST_DAYS))) return;
      var rx = o.rxFor ? o.rxFor(slot) : null;
      if (!rx) return;
      var row = { slot: slot, group: g ? g.key : null, rx: rx, pinned: pinned, shortfall: g ? g.shortfall : 0,
                  reason: (pinned ? "Pinned for " + pin.days.map(function (d) { return WEEKDAY[d]; }).join(", ") +
                           " — " : "") + (g ? sentence(g) : "conditioning, not picked for any one muscle"),
                  _r: g ? ratio(g) : 0, _d: !g || g.daysSince == null ? Infinity : g.daysSince, _o: order };
      (pinned ? picks : rest).push(row);
    });
    rest.sort(function (a, b) { return (b._r - a._r) || (b._d - a._d) || (a._o - b._o); });
    picks = picks.concat(rest.slice(0, Math.max(0, n - picks.length)));
    return picks.map(function (p) { delete p._r; delete p._d; delete p._o; return p; });
  }
  function ratio(g) { return g.floor > 0 ? g.shortfall / g.floor : 0; }

  window.Coverage = { status: status, pick: pick,
                      WINDOW_DAYS: WINDOW_DAYS, REST_DAYS: REST_DAYS, DEFAULT_PICKS: DEFAULT_PICKS };
})();
