/* ============================================================================
   BASALT · EXERCISES  —  the directory: every movement, one page each
   ----------------------------------------------------------------------------
   Lists all 150 movements in EXERCISE_DB (warm-ups, cool-downs and mobility
   routines are not in it, so they are not here) and gives each one a page:

     · a search and filters, plus the body map as a muscle filter
     · the written guide (fitness/content/*.js), the muscles in tiers, the
       joint load, easier and harder moves from the ladder, and what your own
       program and history say about it
     · three actions: Train this in my slot, Exclude / Include / Allow anyway,
       and Pin to my finisher (coverage movements)

   WHAT IS WRITTEN AND WHAT IS DERIVED
     The guide teaches the movement and nothing else (STYLE.md). Everything
     that can change when the rules change is read live from the catalogue, the
     muscle map, your state and your history, so this file holds no ranges, no
     progression thresholds and no muscle lists of its own.

   WHAT EACH LABEL CLAIMS
     · "Where on its path" is the position on the slot's ladder (starting rung,
       on the path, branch), not a rating of how strong you must be.
     · The joint load line is the catalogue's own rubric, scored by judgement
       at the setup the movement starts at. It filters movements; it can't
       assess an injury, and the page says so beside the line.

   THE MAP IS NOT THE ONLY WAY IN
     The shapes are 9-30 px at 390 px (bodymap.js says so). The Muscle select
     beside the map does the same job, so no one needs to hit a 10 px strip.

   LEAVING A WORKOUT
     "How to do this" in a workout opens a page here. Nothing on the way is
     lost: the draft lives in `ironframe.ui`, not in the screen, and Back
     returns to the section you left. Leaving any other way (the nav, Begin)
     forgets the page, so the nav always opens the list.

   PUBLIC:  App.directory = { has(id), open(id, { from }) }
   ========================================================================== */
(function () {
  "use strict";

  var App = window.App;
  var TD = window.TRAINING_DATA;
  if (!App || !TD || !window.EXERCISE_DB) return;

  var esc = App.util.escapeHtml;
  var EX = TD.EXERCISES;
  var SLOT_ORDER = Object.keys(TD.SLOTS);
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  /* Names people search for that the DB doesn't use. Only the knuckle grip has
     one: the plan's example, and the six push-ups that take it. */
  var KNUCKLE_ALIASES = ["knuckle push-up", "fist push-up"];

  var KIND_LABEL = {
    reps: "Reps", loaded: "Loaded", unilateral: "One side at a time",
    eccentric: "Lowering (eccentric)", hold: "Timed hold", skill: "Skill attempt"
  };
  var WHERE_LABEL = { start: "Starting rung", path: "On the path", branch: "Branch or optional" };
  var JOINT_LABEL = {
    wrist: "wrist", elbow: "elbow", shoulder: "shoulder", neck: "neck",
    lowerBack: "lower back", hip: "hip", knee: "knee", ankle: "ankle"
  };
  var STRESS_WORD = { 1: "moderate", 2: "heavy" };
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var TIER_RANK = { primary: 0, secondary: 1, stabiliser: 2 };
  var TIER_ORDER = ["primary", "secondary", "stabiliser"];
  /* Past this depth a movement isn't on any path from a first rung (the loaded
     options run beside the bodyweight path), so it sorts after the path. */
  var OFF_PATH_DEPTH = 99;

  /* The screen's own state. Nothing here is saved: a reload opens the list. */
  var V = { q: "", slot: "", kind: "", where: "", muscle: "", ownedOnly: false, showExcluded: false,
            page: null, from: null, msg: null };

  /* ------------------------------------------------------------------------
     The ladder, read once: depth from each slot's first rung, and the easier
     and harder neighbours. An offer is half a step further than its parent.
     ---------------------------------------------------------------------- */
  var GRAPH = null;
  function graph() {
    if (GRAPH) return GRAPH;
    var depth = {}, harder = {}, easier = {}, queue = [];
    Object.keys(EX).forEach(function (id) { harder[id] = []; easier[id] = []; });
    Object.keys(EX).forEach(function (id) {
      (EX[id].next || []).concat(EX[id].offer || []).forEach(function (to) {
        if (!EX[to] || harder[id].indexOf(to) >= 0) return;
        harder[id].push(to);
        easier[to].push(id);
      });
    });
    SLOT_ORDER.forEach(function (slot) {
      TD.SLOTS[slot].first.forEach(function (id) { depth[id] = 0; queue.push(id); });
    });
    while (queue.length) {
      var id = queue.shift(), e = EX[id];
      (e.next || []).forEach(function (to) { relax(to, depth[id] + 1); });
      (e.offer || []).forEach(function (to) { relax(to, depth[id] + 0.5); });
    }
    function relax(to, d) {
      if (!EX[to] || (depth[to] != null && depth[to] <= d)) return;
      depth[to] = d; queue.push(to);
    }
    GRAPH = { depth: depth, harder: harder, easier: easier };
    return GRAPH;
  }
  function depthOf(id) { var d = graph().depth[id]; return d == null ? OFF_PATH_DEPTH : d; }

  function whereOf(id) {
    var e = EX[id];
    if (TD.SLOTS[e.slot].first.indexOf(id) >= 0) return "start";
    return e.branch === "main" && e.kind !== "loaded" && !e.loadMode ? "path" : "branch";
  }

  function dbOf(id) { return window.EXERCISE_DB[id] || {}; }
  function nameOf(id) { return dbOf(id).name || id; }
  function slotLabel(slot) { return TD.SLOTS[slot].label; }
  function content(id) { return (window.EXERCISE_CONTENT || {})[id] || null; }
  function groupLabel(key) {
    var g = (window.MUSCLE_GROUPS || []).filter(function (x) { return x.key === key; })[0];
    return g ? g.label : key;
  }
  /* A movement's muscles; a movement without a row falls back to its pattern's. */
  function profileOf(id) {
    return (window.MUSCLE_MAP || {})[id] || (window.MUSCLE_FALLBACK || {})[dbOf(id).pattern] || null;
  }
  function tierOf(id, group) {
    var p = profileOf(id);
    if (!p) return null;
    for (var i = 0; i < TIER_ORDER.length; i++) {
      if ((p[TIER_ORDER[i]] || []).indexOf(group) >= 0) return TIER_ORDER[i];
    }
    return null;
  }
  function hasGrip(id) { return TD.GRIPS.exercises.indexOf(id) >= 0; }

  function norm(t) { return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  var HAY = {};
  function haystack(id) {
    if (HAY[id]) return HAY[id];
    var p = profileOf(id) || {}, c = content(id);
    HAY[id] = norm([
      nameOf(id), hasGrip(id) ? KNUCKLE_ALIASES.join(" ") : "", slotLabel(EX[id].slot),
      (p.primary || []).map(groupLabel).join(" "), c ? c.summary : ""
    ].join(" "));
    return HAY[id];
  }

  function gearText(list) {
    var label = function (t) { return (window.EQUIP_LABEL_GLOBAL || {})[t] || t; };
    var parts = (list || []).map(function (t) { return Array.isArray(t) ? t.map(label).join(" or ") : label(t); });
    return parts.length ? parts.join(" and ") : "No equipment";
  }

  /* ------------------------------------------------------------------------
     Your standing with a movement. One call per row; engine.swapStatus reads
     your equipment, exclusions, limits and grip the way the swap lists do.
     ---------------------------------------------------------------------- */
  function exclusionState(s, id) {
    var r = s.training && s.training.exclusions && s.training.exclusions[id];
    return r ? r.state : "none";
  }
  function standing(s, id) {
    var st = App.engine.swapStatus(EX[id].slot, id);
    return { missing: st.missing, blocked: st.blocked, careful: st.careful, excl: exclusionState(s, id) };
  }
  function currentFor(slot) {
    var pr = App.engine.prescriptionFor(slot);
    return pr ? pr.rx : null;
  }

  /* ------------------------------------------------------------------------
     Filtering and order
     ---------------------------------------------------------------------- */
  function results(s) {
    var tokens = norm(V.q).split(" ").filter(Boolean);
    var cur = {};
    var out = [];
    Object.keys(EX).forEach(function (id) {
      if (!window.EXERCISE_DB[id]) return;
      var e = EX[id];
      if (V.slot && e.slot !== V.slot) return;
      if (V.kind && e.kind !== V.kind) return;
      if (V.where && whereOf(id) !== V.where) return;
      var tier = V.muscle ? tierOf(id, V.muscle) : null;
      if (V.muscle && !tier) return;
      if (tokens.length) {
        var hay = haystack(id);
        if (!tokens.every(function (t) { return hay.indexOf(t) >= 0; })) return;
      }
      var st = standing(s, id);
      if (V.ownedOnly && st.missing) return;
      if (st.excl === "excluded" && !V.showExcluded) return;
      if (!(e.slot in cur)) cur[e.slot] = currentFor(e.slot);
      out.push({ id: id, st: st, tier: tier, current: !!cur[e.slot] && cur[e.slot].exerciseId === id });
    });
    out.sort(function (a, b) {
      if (V.muscle && a.tier !== b.tier) return TIER_RANK[a.tier] - TIER_RANK[b.tier];
      /* Within a tier, the slot that exists to train this muscle leads: Biceps
         lists the curls before the chin-ups that also work it. */
      if (V.muscle) {
        var ta = builtFor(a.id), tb = builtFor(b.id);
        if (ta !== tb) return ta ? -1 : 1;
      }
      var sa = SLOT_ORDER.indexOf(EX[a.id].slot), sb = SLOT_ORDER.indexOf(EX[b.id].slot);
      if (sa !== sb) return sa - sb;
      if (depthOf(a.id) !== depthOf(b.id)) return depthOf(a.id) - depthOf(b.id);
      return nameOf(a.id) < nameOf(b.id) ? -1 : 1;
    });
    return out;
  }

  function builtFor(id) {
    return (TD.SLOTS[EX[id].slot].trains || []).indexOf(V.muscle) >= 0;
  }

  function excludedCount(s) {
    return Object.keys(EX).filter(function (id) { return exclusionState(s, id) === "excluded"; }).length;
  }

  /* ------------------------------------------------------------------------
     The list
     ---------------------------------------------------------------------- */
  function rowHtml(r) {
    var id = r.id, e = EX[id];
    var bits = [slotLabel(e.slot), KIND_LABEL[e.kind] || e.kind, WHERE_LABEL[whereOf(id)].toLowerCase()];
    var tags = "";
    if (r.tier) tags += '<span class="badge badge--primary">' + esc(r.tier) + '</span>';
    if (r.current) tags += '<span class="badge badge--success">in your program</span>';
    if (r.st.excl === "excluded") tags += '<span class="badge badge--warn">excluded</span>';
    if (r.st.missing) tags += '<span class="badge badge--secondary">needs ' + esc(r.st.missing) + '</span>';
    return '<li><button type="button" class="dx-row" data-dx-open="' + esc(id) + '">' +
      '<span class="dx-row__main"><span class="dx-row__name">' + esc(nameOf(id)) + '</span>' +
      '<span class="dx-row__sub">' + esc(bits.join(" · ")) + '</span></span>' +
      '<span class="dx-row__tags">' + tags + '</span></button></li>';
  }

  function listHtml(rows) {
    if (!rows.length) {
      return '<div class="placeholder"><h4>Nothing matches</h4>' +
        '<p class="text-sm">Clear a filter or the search. Excluded movements stay hidden until you tick <b>Show excluded</b>.</p></div>';
    }
    var out = "", last = null;
    rows.forEach(function (r) {
      var slot = EX[r.id].slot;
      /* With a muscle chosen the order is by tier, so slot headings would repeat. */
      if (!V.muscle && slot !== last) {
        if (last !== null) out += '</ul>';
        var n = rows.filter(function (x) { return EX[x.id].slot === slot; }).length;
        out += '<h3 class="dx-slot">' + esc(slotLabel(slot)) +
          (TD.SLOTS[slot].coverage ? ' <span class="dx-slot__n">coverage</span>' : '') +
          ' <span class="dx-slot__n">' + n + '</span></h3><ul class="dx-list">';
        last = slot;
      } else if (V.muscle && last === null) {
        out += '<ul class="dx-list">'; last = "all";
      }
      out += rowHtml(r);
    });
    return out + '</ul>';
  }

  function optionHtml(val, label, cur) {
    return '<option value="' + esc(val) + '"' + (val === cur ? " selected" : "") + '>' + esc(label) + '</option>';
  }
  function selectHtml(attr, label, first, pairs, cur) {
    return '<label class="field"><span class="field__label">' + esc(label) + '</span>' +
      '<select class="select" ' + attr + '>' + optionHtml("", first, cur) +
      pairs.map(function (p) { return optionHtml(p[0], p[1], cur); }).join("") + '</select></label>';
  }

  function controlsHtml(s) {
    var slots = SLOT_ORDER.map(function (k) { return [k, slotLabel(k) + (TD.SLOTS[k].coverage ? " (coverage)" : "")]; });
    var kinds = Object.keys(KIND_LABEL).map(function (k) { return [k, KIND_LABEL[k]]; });
    var wheres = Object.keys(WHERE_LABEL).map(function (k) { return [k, WHERE_LABEL[k]]; });
    var groups = (window.MUSCLE_GROUPS || []).map(function (g) { return [g.key, g.label]; });
    var nx = excludedCount(s);
    return '<div class="card dx-controls">' +
      '<label class="field"><span class="field__label">Search</span>' +
        '<input class="input" type="search" data-dx-q placeholder="Name, muscle or slot — try &quot;knuckle&quot;" ' +
        'autocomplete="off" value="' + esc(V.q) + '"></label>' +
      '<div class="dx-selects">' +
        selectHtml("data-dx-sel=\"muscle\"", "Muscle", "Any muscle", groups, V.muscle) +
        selectHtml("data-dx-sel=\"slot\"", "Slot", "Any slot", slots, V.slot) +
        selectHtml("data-dx-sel=\"kind\"", "Kind", "Any kind", kinds, V.kind) +
        selectHtml("data-dx-sel=\"where\"", "Where on its path", "Anywhere", wheres, V.where) +
      '</div>' +
      '<p class="muted text-xs dx-note">Where on its path is the position on the slot\'s ladder, not a strength rating.</p>' +
      '<label class="dx-check"><input type="checkbox" data-dx-chk="ownedOnly"' + (V.ownedOnly ? " checked" : "") + '> ' +
        'Doable with my equipment</label>' +
      '<label class="dx-check"><input type="checkbox" data-dx-chk="showExcluded"' + (V.showExcluded ? " checked" : "") + '> ' +
        'Show excluded (' + nx + ')</label>' +
      '</div>';
  }

  function mapCaption() {
    return V.muscle
      ? 'Showing <b>' + esc(groupLabel(V.muscle)) + '</b>. Tap it again, or pick Any muscle, to clear.'
      : 'Tap a muscle to list the movements that work it, primary first.';
  }

  function renderMap(host) {
    if (!host || !App.bodymap) return;
    /* A filter, not a week: every group is either selected or not, so each
       gets a value (0 is drawn unlit but still labelled) and there's no heat
       ramp. bodymap.js puts the group's name in front of the label. */
    var values = {};
    (window.MUSCLE_GROUPS || []).forEach(function (g) { values[g.key] = g.key === V.muscle ? 1 : 0; });
    App.bodymap.render(host, {
      mode: "heat", values: values, legend: false,
      label: function (g) { return g === V.muscle ? "selected" : "not selected"; }
    }, { onTap: function (g) { setMuscle(V.muscle === g ? "" : g); } });
  }

  function setMuscle(g) {
    V.muscle = g;
    var root = document.getElementById("view-exercises");
    if (!root) return;
    var sel = root.querySelector('[data-dx-sel="muscle"]');
    if (sel) sel.value = g;
    renderMap(root.querySelector("[data-dx-map]"));
    var cap = root.querySelector("[data-dx-mapcap]");
    if (cap) cap.innerHTML = mapCaption();
    refreshList(root);
  }

  function refreshList(root) {
    var s = App.getState();
    var rows = results(s);
    var host = root.querySelector("[data-dx-results]");
    var count = root.querySelector("[data-dx-count]");
    if (host) host.innerHTML = listHtml(rows);
    if (count) count.textContent = rows.length + " of " + Object.keys(window.EXERCISE_DB).filter(function (id) { return EX[id]; }).length + " movements";
  }

  function renderList(el, s) {
    el.innerHTML =
      '<div class="page-head"><div class="eyebrow">Directory</div><h1 class="display h2">Exercises</h1></div>' +
      '<div class="dx-layout">' +
        '<aside class="dx-side">' + controlsHtml(s) +
          '<div class="card dx-mapcard"><div data-dx-map></div>' +
          '<p class="muted text-xs dx-note" data-dx-mapcap>' + mapCaption() + '</p></div></aside>' +
        '<section class="dx-main"><div class="row between wrap dx-count-row">' +
          '<span class="muted text-sm" data-dx-count></span></div>' +
          '<div data-dx-results></div></section>' +
      '</div>';
    renderMap(el.querySelector("[data-dx-map]"));
    refreshList(el);

    var q = el.querySelector("[data-dx-q]");
    q.addEventListener("input", function () { V.q = q.value; refreshList(el); });
    el.querySelectorAll("[data-dx-sel]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var k = sel.getAttribute("data-dx-sel");
        if (k === "muscle") setMuscle(sel.value); else { V[k] = sel.value; refreshList(el); }
      });
    });
    el.querySelectorAll("[data-dx-chk]").forEach(function (c) {
      c.addEventListener("change", function () { V[c.getAttribute("data-dx-chk")] = c.checked; refreshList(el); });
    });
    /* onclick, not addEventListener: the view element outlives every render,
       so a listener added here would stack one more per visit, and this also
       replaces the page's handler (renderPage sets the same property). */
    el.onclick = function (e) {
      var b = e.target.closest("[data-dx-open]");
      if (b) openPage(b.getAttribute("data-dx-open"));
    };
  }

  /* ------------------------------------------------------------------------
     The exercise page
     ---------------------------------------------------------------------- */
  function listItems(arr, tag) {
    return '<' + tag + ' class="dx-steps">' + (arr || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("") + '</' + tag + '>';
  }
  function block(title, inner) {
    return '<section class="dx-block"><h3 class="dx-h">' + esc(title) + '</h3>' + inner + '</section>';
  }

  function guideHtml(id) {
    var c = content(id), db = dbOf(id);
    if (!c) {
      /* Every id has a guide (check-exercise-content.js), so this is only a
         build gone wrong. Show the DB's cues rather than an empty page. */
      return '<div class="card"><p class="muted text-sm">No written guide for this movement yet.</p>' +
        block("Cues", listItems(db.cues, "ul")) + '</div>';
    }
    var v = c.variations || {};
    var out = '<p class="dx-summary">' + esc(c.summary) + '</p>' +
      block("Set up", listItems(c.setup, "ol")) +
      block("One rep", listItems(c.steps, "ol")) +
      '<div class="dx-two">' +
        block("Breathing", '<p>' + esc(c.breathing) + '</p>') +
        block("Tempo", '<p>' + esc(c.tempo) + '</p>') +
      '</div>' +
      block("What you should feel",
        '<p><b>Should:</b> ' + esc(c.feel.should) + '</p><p><b>Shouldn\'t:</b> ' + esc(c.feel.shouldnt) + '</p>') +
      block("Common mistakes", '<ul class="dx-steps">' + c.mistakes.map(function (m) {
        return '<li><b>' + esc(m.mistake) + '</b> ' + esc(m.fix) + '</li>';
      }).join("") + '</ul>') +
      block("Safety", listItems(c.safety, "ul"));
    if (v.grip && v.grip.knuckles) out += block("On your knuckles", listItems(v.grip.knuckles, "ul"));
    if (v.alternatives && v.alternatives.length) {
      out += block("Sideways swaps", '<ul class="dx-steps">' + v.alternatives.map(function (a) {
        return '<li><button type="button" class="dx-link" data-dx-open="' + esc(a.id) + '">' + esc(nameOf(a.id)) + '</button> ' + esc(a.text) + '</li>';
      }).join("") + '</ul>');
    }
    return out;
  }

  function musclesHtml(id) {
    var p = profileOf(id);
    if (!p) return '<p class="muted text-sm">No muscle map for this movement.</p>';
    var rows = TIER_ORDER.filter(function (t) { return (p[t] || []).length; }).map(function (t) {
      return '<li><span class="dx-tier">' + t + '</span> ' + esc(p[t].map(groupLabel).join(", ")) + '</li>';
    }).join("");
    return '<div data-dx-pmap></div><ul class="dx-tiers">' + rows + '</ul>';
  }

  function jointHtml(id) {
    var js = TD.JOINT_STRESS[id] || {};
    var parts = TD.JOINTS.filter(function (j) { return js[j]; }).map(function (j) {
      return '<span class="badge ' + (js[j] === 2 ? "badge--warn" : "badge--secondary") + '">' +
        esc(JOINT_LABEL[j]) + ': ' + STRESS_WORD[js[j]] + '</span>';
    });
    return '<div class="dx-joints">' + (parts.length ? parts.join(" ") : '<span class="muted text-sm">No joint scored as loaded.</span>') + '</div>' +
      '<p class="muted text-xs dx-note">Scored by judgement at the setup this movement starts at. It filters movements; it can\'t assess an injury.</p>';
  }

  function stepsHtml(id) {
    var g = graph(), link = function (x) {
      return '<button type="button" class="dx-link" data-dx-open="' + esc(x) + '">' + esc(nameOf(x)) + '</button>';
    };
    var e = g.easier[id].filter(function (x) { return dbOf(x).name; }), h = g.harder[id].filter(function (x) { return dbOf(x).name; });
    return '<div class="dx-two">' +
      block("Easier", e.length ? '<ul class="dx-steps">' + e.map(function (x) { return '<li>' + link(x) + '</li>'; }).join("") + '</ul>'
        : '<p class="muted text-sm">Nothing easier on this path.</p>') +
      block("Harder", h.length ? '<ul class="dx-steps">' + h.map(function (x) { return '<li>' + link(x) + '</li>'; }).join("") + '</ul>'
        : '<p class="muted text-sm">Nothing harder on this path.</p>') +
      '</div>';
  }

  function fmtDay(dayKey) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dayKey || ""));
    return m ? (+m[3]) + " " + MONTHS[+m[2] - 1] : "";
  }

  function rxLine(rx) {
    var unit = rx.unit === "sec" ? " s" : " reps";
    var bits = [rx.sets + " × " + (rx.range[0] != null ? rx.range[0] + "–" : "") + rx.range[1] + unit];
    var st = rx.setup || {};
    if (st.loadMode) bits.push(st.loadKg != null ? st.loadKg + " kg " + (st.loadMode === "perHand" ? "per hand" : "total") : "load not set yet");
    if (st.grip === "knuckles") bits.push("knuckles");
    return bits.join(" · ");
  }

  function historyFor(s, id) {
    var rows = [];
    (s.sessions || []).forEach(function (se) {
      if (se.completed === false) return;
      (se.exercises || []).forEach(function (ex) {
        if (ex.key !== id || ex.skipped) return;
        var sets = (ex.sets || []).filter(function (st) { return (+st.reps || 0) > 0; })
          .map(function (st) { return { n: +st.reps, kg: +st.weight || 0 }; });
        if (sets.length) rows.push({ day: se.dayKey || String(se.dateISO || "").slice(0, 10), at: se.dateISO || "", sets: sets, unit: ex.unit });
      });
    });
    rows.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    return rows.slice(0, 3);
  }

  /* One session's sets as logged. The weight is printed whenever one was
     logged: on a loaded movement it is the progression, and 12 reps at 5 kg
     and at 12.5 kg must not read the same. */
  function setsText(h, loadMode) {
    var unit = h.unit === "sec" ? " s" : "", per = loadMode === "perHand" ? " per hand" : "";
    var kgs = h.sets.map(function (x) { return x.kg; });
    var reps = h.sets.map(function (x) { return x.n + unit; });
    if (!kgs.some(Boolean)) return reps.join(" / ");
    if (kgs.every(function (k) { return k === kgs[0]; })) return reps.join(" / ") + " at " + kgs[0] + " kg" + per;
    return h.sets.map(function (x, i) { return reps[i] + (x.kg ? " at " + x.kg + " kg" : ""); }).join(" / ") + per;
  }

  function programHtml(s, id) {
    var e = EX[id], rx = currentFor(e.slot), rec = s.training.slots[e.slot], out = "";
    if (rx && rx.exerciseId === id) {
      out += '<p><b>Your ' + esc(slotLabel(e.slot)) + ' slot trains this now:</b> ' + esc(rxLine(rx)) + '.</p>';
    } else if (rx) {
      out += '<p>Your ' + esc(slotLabel(e.slot)) + ' slot trains <b>' + esc(nameOf(rx.exerciseId)) + '</b> now.</p>';
    } else if (rec && rec.off) {
      out += '<p>Your ' + esc(slotLabel(e.slot)) + ' slot is left out of your program. Add it under <b>Your prescriptions</b> in Program to train anything here.</p>';
    } else {
      out += '<p>Your ' + esc(slotLabel(e.slot)) + ' slot has nothing prescribed' +
        (TD.SLOTS[e.slot].coverage ? ' yet: a finisher or accessory session starts it.' : ' — it is off, or nothing in it is allowed.') + '</p>';
    }
    var hist = historyFor(s, id);
    out += hist.length
      ? '<p class="muted text-sm">Last ' + hist.length + ' session' + (hist.length === 1 ? "" : "s") + ': ' +
        hist.map(function (h) { return esc(fmtDay(h.day)) + ' — ' + esc(setsText(h, e.loadMode)); }).join("; ") + '.</p>'
      : '<p class="muted text-sm">Not logged yet.</p>';
    var pr = (s.prs || []).filter(function (p) { return p.exerciseId === id; })[0];
    /* The record is the most reps (or seconds) in one set and stores no load,
       so on a loaded movement the line says so rather than imply a weight. */
    if (pr) out += '<p class="muted text-sm">Best: ' + esc(pr.value + (pr.kind === "hold" ? " s hold" : " reps")) +
      (pr.dateISO ? ' (' + esc(fmtDay(String(pr.dateISO).slice(0, 10))) + ')' : '') +
      (e.loadMode ? ', at any weight: the record counts reps, not load' : '') + '.</p>';
    return out;
  }

  function actionsHtml(s, id) {
    var e = EX[id], st = standing(s, id), rx = currentFor(e.slot), rec = s.training.slots[e.slot];
    /* Program's rule (slotRow): a left-out slot has nothing to choose into, and
       Add brings it back; a coverage slot with no record can be chosen for. A
       choice here would otherwise switch the slot back on without a word. */
    var choosable = (rec && !rec.off) || (!!TD.SLOTS[e.slot].coverage && !rec);
    var out = '<div class="row wrap dx-actions">';
    if (e.kind === "skill") {
      out += '<p class="muted text-sm">Skill attempts stay in Skills, so they can\'t be a slot\'s exercise.</p>';
    } else if (rx && rx.exerciseId === id) {
      out += '<span class="badge badge--success">in your ' + esc(slotLabel(e.slot)) + ' slot</span>';
    } else if (!choosable) {
      /* programHtml above already says why; no button to say it twice. */
    } else {
      out += '<button type="button" class="btn btn--primary btn--sm" data-dx-train>Train this in my ' + esc(slotLabel(e.slot)) + ' slot</button>';
    }
    if (st.excl === "excluded") {
      out += '<button type="button" class="btn btn--ghost btn--sm" data-dx-excl="none">Include again</button>';
    } else {
      out += '<button type="button" class="btn btn--ghost btn--sm" data-dx-excl="excluded">Exclude</button>';
    }
    if (st.blocked && st.blocked !== "equipment" && st.blocked !== "excluded" && st.excl !== "allowed") {
      out += '<button type="button" class="btn btn--ghost btn--sm" data-dx-excl="allowed">Allow anyway</button>';
    }
    out += '</div>';
    if (st.missing) out += '<p class="muted text-xs dx-note">Needs ' + esc(st.missing) + ', which isn\'t in your equipment.</p>';
    if (st.blocked && st.blocked !== "equipment" && st.blocked !== "excluded") {
      out += '<p class="muted text-xs dx-note">This loads your ' + esc(JOINT_LABEL[st.blocked] || st.blocked) +
        ' heavily and you asked to avoid that. A filter by exercise, not a check of your ' + esc(JOINT_LABEL[st.blocked] || st.blocked) + '.</p>';
    } else if (st.careful && st.careful.length) {
      out += '<p class="muted text-xs dx-note">Careful: ' + esc(st.careful.map(function (j) { return JOINT_LABEL[j] || j; }).join(", ")) + ' (your joint limits).</p>';
    }
    if (TD.SLOTS[e.slot].coverage) {
      var pins = (s.training.pins && s.training.pins[e.slot] && s.training.pins[e.slot].days) || [];
      out += '<div class="dx-pin"><span class="field__label">Pin the ' + esc(slotLabel(e.slot)) + ' slot to my finisher on</span>' +
        '<div class="pg-pins" role="group" aria-label="Pin to weekdays">' + DAYS.map(function (d, i) {
          return '<button type="button" class="btn btn--ghost btn--sm' + (pins.indexOf(i) >= 0 ? " is-on" : "") +
            '" data-dx-pin="' + i + '" aria-pressed="' + (pins.indexOf(i) >= 0) + '">' + d + '</button>';
        }).join("") + '</div>' +
        '<p class="muted text-xs dx-note">A pin puts the slot first in the finisher and the accessory session on those days. ' +
        'It never overrides your equipment, exclusions or joint limits.</p></div>';
    }
    return out;
  }

  function pageHtml(s, id) {
    var e = EX[id], db = dbOf(id);
    var meta = App.SECTIONS.filter(function (x) { return x.id === V.from; })[0];
    var back = V.from
      ? '<button type="button" class="btn btn--ghost btn--sm" data-dx-back>← Back to ' + esc(meta ? meta.label : "where you were") + '</button>'
      : '<button type="button" class="btn btn--ghost btn--sm" data-dx-back>← All exercises</button>';
    var st = standing(s, id);
    var tags = [slotLabel(e.slot), KIND_LABEL[e.kind] || e.kind, WHERE_LABEL[whereOf(id)]]
      .map(function (t) { return '<span class="badge badge--secondary">' + esc(t) + '</span>'; }).join(" ");
    if (st.excl === "excluded") tags += ' <span class="badge badge--warn">excluded</span>';
    var msg = V.msg ? '<p class="dx-msg dx-msg--' + V.msg.kind + '" role="status">' + esc(V.msg.text) + '</p>' : "";
    V.msg = null;
    var animated = App.phases && App.phases.hasPhases && App.phases.hasPhases(id);
    return '<div class="page-head dx-head">' + back +
        '<div class="eyebrow">' + esc(slotLabel(e.slot)) + '</div>' +
        '<h1 class="display h2">' + esc(db.name || id) + '</h1>' +
        '<div class="dx-tags">' + tags + '</div>' +
        '<p class="muted text-sm">' + esc(gearText(e.equipment)) + (e.loadMode ? ' · ' + (e.loadMode === "perHand" ? 'kg per hand' : 'kg total') : '') + '</p>' +
      '</div>' + msg +
      '<div class="dx-layout dx-layout--page">' +
        '<div class="dx-main"><div class="card">' + guideHtml(id) + '</div>' + stepsHtml(id) + '</div>' +
        '<aside class="dx-side">' +
          (animated ? '<div class="card"><h3 class="dx-h">What\'s working, phase by phase</h3><div data-dx-phases></div></div>' : '') +
          '<div class="card"><h3 class="dx-h">Muscles</h3>' + musclesHtml(id) + '</div>' +
          '<div class="card"><h3 class="dx-h">Joint load</h3>' + jointHtml(id) + '</div>' +
          '<div class="card"><h3 class="dx-h">In your program</h3>' + programHtml(s, id) + actionsHtml(s, id) + '</div>' +
        '</aside>' +
      '</div>';
  }

  function say(kind, text) { V.msg = { kind: kind, text: text }; }

  function renderPage(el, s, id) {
    el.innerHTML = pageHtml(s, id);
    var ph = el.querySelector("[data-dx-phases]");
    if (ph && App.phases) App.phases.render(ph, id);
    var pm = el.querySelector("[data-dx-pmap]");
    if (pm && App.bodymap && profileOf(id)) App.bodymap.render(pm, { mode: "tiers", profile: profileOf(id) });

    el.onclick = function (e) {
      var t = e.target.closest("button");
      if (!t) return;
      if (t.hasAttribute("data-dx-back")) return back();
      if (t.hasAttribute("data-dx-open")) return openPage(t.getAttribute("data-dx-open"));
      if (t.hasAttribute("data-dx-train")) {
        var r = App.engine.chooseExercise(EX[id].slot, id);
        say(r && r.error ? "bad" : "ok", r && r.error ? r.error : nameOf(id) + " is now your " + slotLabel(EX[id].slot) + " slot's exercise, at the bottom of its range.");
        return App.refresh();
      }
      if (t.hasAttribute("data-dx-excl")) {
        var to = t.getAttribute("data-dx-excl");
        var x = App.engine.setExcluded(id, to, "from the directory");
        say(x && x.error ? "bad" : "ok", x && x.error ? x.error :
          to === "excluded" ? nameOf(id) + " is excluded. Swap lists hide it; a one-off swap to it still works." :
          to === "allowed" ? nameOf(id) + " is allowed past your joint limit." : nameOf(id) + " is included again.");
        return App.refresh();
      }
      if (t.hasAttribute("data-dx-pin")) {
        var slot = EX[id].slot, day = +t.getAttribute("data-dx-pin");
        var cur = ((App.getState().training.pins || {})[slot] || {}).days || [];
        var days = cur.indexOf(day) >= 0 ? cur.filter(function (d) { return d !== day; }) : cur.concat(day);
        var p = App.engine.setPins(slot, days);
        say(p && p.error ? "bad" : "ok", p && p.error ? p.error :
          p.days.length ? "The " + slotLabel(slot) + " slot is pinned to " + p.days.map(function (d) { return DAYS[d]; }).join(", ") + "." : "The " + slotLabel(slot) + " slot is no longer pinned.");
        return App.refresh();
      }
    };
  }

  /* ------------------------------------------------------------------------
     Navigation
     ---------------------------------------------------------------------- */
  function openPage(id) {
    if (!EX[id] || !window.EXERCISE_DB[id]) return false;
    /* Opened from another section: that is where Back goes, whatever page was
       open before. Within the section (the list, Easier, Harder) it stays. */
    var here = App.util.uiGet("section", "dashboard");
    if (here !== "exercises") V.from = here || null;
    else if (!V.page) V.from = null;
    V.page = id;
    if (App.util.uiGet("section", "") === "exercises") { App.refresh(); window.scrollTo(0, 0); }
    else App.showSection("exercises");
    return true;
  }

  function back() {
    var to = V.from;
    V.page = null; V.from = null;
    if (to) App.showSection(to); else { App.refresh(); window.scrollTo(0, 0); }
  }

  function renderExercises(el, s) {
    if (s && s.training && V.page && EX[V.page]) renderPage(el, s, V.page);
    else { V.page = null; renderList(el, s); }
  }

  App.directory = {
    has: function (id) { return !!(EX[id] && window.EXERCISE_DB[id]); },
    open: function (id) { return openPage(id); }
  };

  /* Pushed at parse time, like Muscles: the core builds its nav from the live
     SECTIONS array on DOMContentLoaded, which fires before mount() runs. */
  if (App.SECTIONS && !App.SECTIONS.some(function (x) { return x.id === "exercises"; })) {
    App.ICONS.exercises = '<path d="M4 5h11a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3z"/><path d="M4 16a3 3 0 0 1 3-3h11"/>';
    var at = App.SECTIONS.map(function (x) { return x.id; }).indexOf("muscles");
    App.SECTIONS.splice(at >= 0 ? at + 1 : App.SECTIONS.length, 0,
      { id: "exercises", label: "Exercises", icon: "exercises", group: "Plan", rank: 7.5,
        blurb: "Every movement: guide, muscles, your history" });
  }

  /* Leaving the section by any route but Back (the nav, Begin, a data-go
     button) forgets the page, so the nav opens the list next time and a page
     never offers Back to somewhere you have since left. The router only hides
     and shows views, so the view's class is the one signal every route shares. */
  function watchLeave() {
    var view = document.getElementById("view-exercises");
    if (!view || !window.MutationObserver) return;
    new MutationObserver(function () {
      if (view.classList.contains("hide")) { V.page = null; V.from = null; }
    }).observe(view, { attributes: true, attributeFilter: ["class"] });
  }

  function mount() { App.registerView("exercises", renderExercises); watchLeave(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
