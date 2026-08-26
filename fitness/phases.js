/* ============================================================================
   BASALT · PHASE VISUALISER
   ----------------------------------------------------------------------------
   Renders phases.data.js into the exercise guide modal: two silhouettes
   (front and back), phase tabs, and an activation bar per muscle.

     · SKELETON   joints interpolated from the pattern's pose rig by `pos`
     · MUSCLES    shapes ANCHORED TO JOINTS, not drawn per pose — a bicep sits
                  halfway along the upper arm whatever the arm is doing, so a
                  new pose can never leave the muscles behind the figure
     · TWEEN      one rAF loop interpolates pose AND activation together, so
                  the figure and the bars can never disagree mid-transition
     · FALLBACK   the ~72 exercises with no authored phases still get their
                  real primary/secondary/stabiliser breakdown from
                  muscles.data.js, labelled as exactly that

   The activation numbers are illustrative and the UI says so on screen, beside
   the bars, every time. See the header of phases.data.js for what that means.

   Public: App.phases.render(hostEl, exerciseId)
   ========================================================================== */
(function () {
  "use strict";

  var App = window.App;
  if (!App) return;

  /* Tier weights from muscles.data.js, reused so the fallback view and the
     muscle map can never drift apart on what "secondary" is worth. */
  var TIER = { primary: 1.00, secondary: 0.40, stabiliser: 0.15 };

  var TWEEN_MS = 420;

  /* --------------------------------------------------------------------------
     COLOUR RAMP — cool grey at rest, amber in the middle, red at peak.
     Hue and saturation both move: hue alone reads as a rainbow, and a low
     value that is merely a cool RED still looks like effort.
     ------------------------------------------------------------------------ */
  /* Interpolated in RGB between three anchors, NOT by rotating hue. Rotating
     210 -> 0 passes through green at about 0.3, so a barely-working muscle
     rendered bright green and read as its own signal. Grey -> amber -> red in
     RGB never crosses a hue that means something else. */
  var RAMP = [
    [0.0, [108, 116, 128]],   // slate grey — at rest
    [0.5, [224, 160,  32]],   // amber — genuinely working
    [1.0, [220,  38,  38]]    // red — peak demand
  ];

  function ramp(v) {
    v = Math.max(0, Math.min(1, v));
    for (var i = 1; i < RAMP.length; i++) {
      if (v <= RAMP[i][0]) {
        var lo = RAMP[i - 1], hi = RAMP[i];
        var t = (v - lo[0]) / (hi[0] - lo[0]);
        var c = [0, 1, 2].map(function (k) {
          return Math.round(lerp(lo[1][k], hi[1][k], t));
        });
        return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
      }
    }
    return "rgb(220,38,38)";
  }

  /* Resting muscle fill needs to read on both themes without being a colour
     that means "working". Low activation therefore also drops opacity, so a
     quiet muscle recedes rather than sitting there in confident grey. */
  function fillFor(v) { return ramp(v); }
  function opacityFor(v) { return (0.22 + 0.68 * Math.max(0, Math.min(1, v))).toFixed(3); }

  /* --------------------------------------------------------------------------
     GEOMETRY
     ------------------------------------------------------------------------ */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpPt(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; }

  /* Interpolate a whole joint set between the rig's two keyframes. */
  function poseAt(rig, pos) {
    var out = {};
    Object.keys(rig.a).forEach(function (k) {
      out[k] = lerpPt(rig.a[k], rig.b[k] || rig.a[k], pos);
    });
    return out;
  }

  /* A point a fraction `t` along a segment, plus the segment's angle. This is
     what lets muscle shapes ride the skeleton instead of being redrawn. */
  function along(p1, p2, t) {
    var x = lerp(p1[0], p2[0], t);
    var y = lerp(p1[1], p2[1], t);
    var ang = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180 / Math.PI;
    return { x: x, y: y, a: ang };
  }

  function mid(p1, p2) { return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]; }

  /* --------------------------------------------------------------------------
     MUSCLE PLACEMENT
     Each entry returns one or more ellipses in skeleton space. `a` is the
     ellipse's own rotation; limb muscles take the limb's angle + 90 so the
     long axis runs ALONG the bone.
     ------------------------------------------------------------------------ */
  var PLACE = {
    chest: function (j) {
      var c = along(j.shoulderL, j.shoulderR, 0.5);
      var down = along(mid(j.shoulderL, j.shoulderR), j.hip, 0.22);
      return [{ x: down.x, y: down.y, a: 0, rx: 9, ry: 6 }];
    },
    delts_front: function (j) {
      return [
        { x: j.shoulderL[0], y: j.shoulderL[1], a: 0, rx: 4.2, ry: 4.2 },
        { x: j.shoulderR[0], y: j.shoulderR[1], a: 0, rx: 4.2, ry: 4.2 }
      ];
    },
    delts_side: function (j) {
      var dx = (j.shoulderR[0] - j.shoulderL[0]) * 0.16;
      return [
        { x: j.shoulderL[0] - dx, y: j.shoulderL[1] - 1, a: 0, rx: 3, ry: 3.4 },
        { x: j.shoulderR[0] + dx, y: j.shoulderR[1] - 1, a: 0, rx: 3, ry: 3.4 }
      ];
    },
    biceps: function (j) {
      var l = along(j.shoulderL, j.elbowL, 0.5), r = along(j.shoulderR, j.elbowR, 0.5);
      return [
        { x: l.x, y: l.y, a: l.a + 90, rx: 2.8, ry: 5.5 },
        { x: r.x, y: r.y, a: r.a + 90, rx: 2.8, ry: 5.5 }
      ];
    },
    triceps: function (j) {
      var l = along(j.shoulderL, j.elbowL, 0.55), r = along(j.shoulderR, j.elbowR, 0.55);
      return [
        { x: l.x, y: l.y, a: l.a + 90, rx: 3, ry: 5.8 },
        { x: r.x, y: r.y, a: r.a + 90, rx: 3, ry: 5.8 }
      ];
    },
    forearms: function (j) {
      var l = along(j.elbowL, j.handL, 0.5), r = along(j.elbowR, j.handR, 0.5);
      return [
        { x: l.x, y: l.y, a: l.a + 90, rx: 2.6, ry: 5.5 },
        { x: r.x, y: r.y, a: r.a + 90, rx: 2.6, ry: 5.5 }
      ];
    },
    abs: function (j) {
      var c = along(j.neck, j.hip, 0.62);
      return [{ x: c.x, y: c.y, a: c.a + 90, rx: 5.2, ry: 8 }];
    },
    obliques: function (j) {
      var c = along(j.neck, j.hip, 0.6);
      var perp = (c.a + 90) * Math.PI / 180;
      var ox = Math.cos(perp) * 0, oy = 0;
      var dx = Math.cos((c.a) * Math.PI / 180) * 0;
      /* Offset perpendicular to the torso line so the obliques flank the abs
         whichever way the torso is oriented. */
      var nx = Math.cos((c.a + 90) * Math.PI / 180);
      var ny = Math.sin((c.a + 90) * Math.PI / 180);
      /* perpendicular to the torso = along the torso normal */
      var px = -Math.sin((c.a + 90) * Math.PI / 180);
      var py = Math.cos((c.a + 90) * Math.PI / 180);
      return [
        { x: c.x - px * 6.2, y: c.y - py * 6.2, a: c.a + 90, rx: 2.4, ry: 6.5 },
        { x: c.x + px * 6.2, y: c.y + py * 6.2, a: c.a + 90, rx: 2.4, ry: 6.5 }
      ];
    },
    quads: function (j) {
      var c = along(j.hip, j.knee, 0.5);
      var px = -Math.sin((c.a + 90) * Math.PI / 180) * 2.6;
      var py = Math.cos((c.a + 90) * Math.PI / 180) * 2.6;
      return [
        { x: c.x - px, y: c.y - py, a: c.a + 90, rx: 3.2, ry: 7 },
        { x: c.x + px, y: c.y + py, a: c.a + 90, rx: 3.2, ry: 7 }
      ];
    },
    hamstrings: function (j) {
      var c = along(j.hip, j.knee, 0.55);
      var px = -Math.sin((c.a + 90) * Math.PI / 180) * 2.6;
      var py = Math.cos((c.a + 90) * Math.PI / 180) * 2.6;
      return [
        { x: c.x - px, y: c.y - py, a: c.a + 90, rx: 3.2, ry: 7 },
        { x: c.x + px, y: c.y + py, a: c.a + 90, rx: 3.2, ry: 7 }
      ];
    },
    glutes: function (j) {
      var c = along(j.hip, j.knee, 0.12);
      var px = -Math.sin((c.a + 90) * Math.PI / 180) * 3.2;
      var py = Math.cos((c.a + 90) * Math.PI / 180) * 3.2;
      return [
        { x: c.x - px, y: c.y - py, a: c.a + 90, rx: 4, ry: 4.6 },
        { x: c.x + px, y: c.y + py, a: c.a + 90, rx: 4, ry: 4.6 }
      ];
    },
    lats: function (j) {
      var l = along(j.shoulderL, j.hip, 0.42), r = along(j.shoulderR, j.hip, 0.42);
      return [
        { x: l.x, y: l.y, a: l.a + 90, rx: 4, ry: 8.5 },
        { x: r.x, y: r.y, a: r.a + 90, rx: 4, ry: 8.5 }
      ];
    },
    upper_back: function (j) {
      var c = along(mid(j.shoulderL, j.shoulderR), j.hip, 0.16);
      return [{ x: c.x, y: c.y, a: c.a + 90, rx: 8, ry: 6 }];
    },
    lower_back: function (j) {
      var c = along(j.neck, j.hip, 0.86);
      return [{ x: c.x, y: c.y, a: c.a + 90, rx: 5, ry: 5.5 }];
    }
  };

  /* Which view each group is drawn on. Matches muscles.data.js `region`, with
     forearms and abs deliberately on BOTH: the grip is what the arms are doing
     in either view, and a braced trunk is visible from behind too. */
  var VIEW = {
    chest: ["front"], delts_front: ["front"], delts_side: ["front"],
    biceps: ["front"], quads: ["front"], obliques: ["front"],
    triceps: ["back"], lats: ["back"], upper_back: ["back"],
    lower_back: ["back"], glutes: ["back"], hamstrings: ["back"],
    forearms: ["front", "back"], abs: ["front", "back"]
  };

  function groupsMeta() {
    var out = {};
    (window.MUSCLE_GROUPS || []).forEach(function (g) { out[g.key] = g; });
    return out;
  }

  /* --------------------------------------------------------------------------
     SVG BUILDING
     ------------------------------------------------------------------------ */
  var NS = "http://www.w3.org/2000/svg";
  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  function buildFigure(view, rig, activeKeys) {
    var svg = el("svg", {
      viewBox: "0 0 100 104", class: "phz-fig", role: "img",
      "aria-label": view === "front" ? "Front view" : "Back view"
    });

    /* Bar / floor reference, so a hang reads as hanging and a push-up as
       being on the ground. */
    if (rig.bar) svg.appendChild(el("line", { class: "phz-ref", x1: 14, y1: rig.bar.y, x2: 86, y2: rig.bar.y }));
    if (rig.floor) svg.appendChild(el("line", { class: "phz-ref", x1: 6, y1: rig.floor.y, x2: 94, y2: rig.floor.y }));

    var gSkel = el("g", { class: "phz-skel" });
    /* Torso as a filled quad rather than a line: a stick torso makes the
       trunk muscles look like they are floating beside the figure instead of
       on it. */
    gSkel.appendChild(el("polygon", { class: "phz-trunk", "data-trunk": "1", points: "" }));
    ["torso", "shoulders", "armL", "armR", "legL", "legR"].forEach(function (id) {
      gSkel.appendChild(el("polyline", { class: "phz-bone", "data-bone": id, points: "" }));
    });
    gSkel.appendChild(el("circle", { class: "phz-head", "data-head": "1", cx: 50, cy: 20, r: 6 }));
    svg.appendChild(gSkel);

    var gMus = el("g", { class: "phz-muscles" });
    activeKeys.forEach(function (key) {
      if (!PLACE[key] || (VIEW[key] || []).indexOf(view) === -1) return;
      /* Two ellipses for a paired muscle, one for a midline one — the
         placement function decides, so this loop never has to know. */
      var probe = PLACE[key](poseAt(rig, 0));
      probe.forEach(function (_, i) {
        gMus.appendChild(el("ellipse", { class: "phz-mus", "data-mus": key, "data-i": i, rx: 1, ry: 1, cx: 0, cy: 0 }));
      });
    });
    svg.appendChild(gMus);
    return svg;
  }

  function paintFigure(svg, view, rig, pos, acts) {
    var j = poseAt(rig, pos);

    function setBone(id, pts) {
      var n = svg.querySelector('[data-bone="' + id + '"]');
      if (n) n.setAttribute("points", pts.map(function (p) { return p[0] + "," + p[1]; }).join(" "));
    }
    /* A rig whose two shoulders share a point is drawn from the side, and a
       side view has one visible leg. Offsetting them there would draw a
       person standing in two places at once. */
    var halfW = (j.shoulderR[0] - j.shoulderL[0]) / 2;
    var frontal = Math.abs(halfW) > 1;
    var off = frontal ? Math.abs(halfW) * 0.5 : 0;

    function shift(pt, d) { return [pt[0] + d, pt[1]]; }

    setBone("torso", [j.neck, j.hip]);
    setBone("shoulders", [j.shoulderL, j.shoulderR]);
    setBone("armL", [j.shoulderL, j.elbowL, j.handL]);
    setBone("armR", [j.shoulderR, j.elbowR, j.handR]);
    setBone("legL", [shift(j.hip, -off * 0.5), shift(j.knee, -off), shift(j.foot, -off)]);
    setBone("legR", [shift(j.hip, off * 0.5), shift(j.knee, off), shift(j.foot, off)]);

    var trunk = svg.querySelector("[data-trunk]");
    if (trunk) {
      var w = frontal ? Math.abs(halfW) * 0.8 : 3.2;
      trunk.setAttribute("points", [
        shift(j.shoulderL, frontal ? 0 : -w),
        shift(j.shoulderR, frontal ? 0 : w),
        shift(j.hip, w * 0.7),
        shift(j.hip, -w * 0.7)
      ].map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "));
    }

    var head = svg.querySelector("[data-head]");
    if (head) { head.setAttribute("cx", j.head[0]); head.setAttribute("cy", j.head[1]); }

    svg.querySelectorAll("[data-mus]").forEach(function (n) {
      var key = n.getAttribute("data-mus");
      var i = +n.getAttribute("data-i");
      var shapes = PLACE[key](j);
      var s = shapes[i];
      if (!s) return;
      n.setAttribute("cx", s.x.toFixed(2));
      n.setAttribute("cy", s.y.toFixed(2));
      n.setAttribute("rx", s.rx);
      n.setAttribute("ry", s.ry);
      n.setAttribute("transform", "rotate(" + s.a.toFixed(1) + " " + s.x.toFixed(2) + " " + s.y.toFixed(2) + ")");
      var v = acts[key] == null ? 0 : acts[key];
      n.setAttribute("fill", fillFor(v));
      n.setAttribute("fill-opacity", opacityFor(v));
    });
  }

  /* --------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */
  function esc(s) { return App.util.escapeHtml(String(s == null ? "" : s)); }

  /* Fallback for the ~72 exercises without authored phases: their real static
     map, shown as what it is. Real data, no phases, said plainly — rather than
     an empty panel or a borrowed curve from a different movement. */
  function renderStatic(host, exId, ex) {
    var map = (window.MUSCLE_MAP && window.MUSCLE_MAP[exId]) ||
              (window.MUSCLE_FALLBACK && window.MUSCLE_FALLBACK[ex && ex.pattern]);
    if (!map) { host.innerHTML = ""; return; }

    var meta = groupsMeta();
    var rows = [];
    ["primary", "secondary", "stabiliser"].forEach(function (tier) {
      (map[tier] || []).forEach(function (k) {
        rows.push({ key: k, v: TIER[tier], tier: tier });
      });
    });
    rows.sort(function (a, b) { return b.v - a.v; });

    host.innerHTML =
      '<div class="phz phz--static">' +
        '<div class="phz-head"><div class="phz-head__t">Muscles worked</div>' +
          '<div class="phz-head__s">Phase-by-phase detail isn\'t written for this movement yet — ' +
          'this is the muscle map BASALT already uses to credit your work.</div></div>' +
        '<div class="phz-bars">' +
          rows.map(function (r) {
            var g = meta[r.key] || { label: r.key };
            return '<div class="phz-bar">' +
              '<span class="phz-bar__l">' + esc(g.label) + '</span>' +
              '<span class="phz-bar__t"><i style="width:' + Math.round(r.v * 100) + '%;background:' + fillFor(r.v) + '"></i></span>' +
              '<span class="phz-bar__v">' + esc(r.tier) + '</span>' +
            '</div>';
          }).join("") +
        '</div>' +
      '</div>';
  }

  function render(host, exId) {
    if (!host) return;
    var ex = (window.EXERCISE_DB && window.EXERCISE_DB[exId]) ||
             (App.DB && App.DB.getExercise && App.DB.getExercise(exId)) || null;
    var data = window.PHASE_MAP && window.PHASE_MAP[exId];

    if (!data) { renderStatic(host, exId, ex); return; }

    var rig = (window.POSE_RIGS || {})[ex && ex.pattern] || (window.POSE_RIGS || {}).skill;
    if (!rig) { renderStatic(host, exId, ex); return; }

    var meta = groupsMeta();
    var keys = Object.keys(data.muscles);
    /* Ordered by peak demand so the bar list leads with what the movement is
       actually about, instead of by whatever order the data was typed in. */
    keys.sort(function (a, b) {
      return Math.max.apply(null, data.muscles[b]) - Math.max.apply(null, data.muscles[a]);
    });

    var isHold = data.kind === "hold";

    host.innerHTML =
      '<div class="phz">' +
        '<div class="phz-tabs" role="tablist" aria-label="Movement phases">' +
          data.phases.map(function (ph, i) {
            return '<button class="phz-tab' + (i === 0 ? " is-active" : "") + '" role="tab" type="button" ' +
              'aria-selected="' + (i === 0) + '" data-phz="' + i + '">' + esc(ph.name) + '</button>';
          }).join("") +
        '</div>' +
        '<p class="phz-desc" id="phz-desc"></p>' +
        '<div class="phz-figs">' +
          '<figure class="phz-figwrap"><div data-fig="front"></div><figcaption>Front</figcaption></figure>' +
          '<figure class="phz-figwrap"><div data-fig="back"></div><figcaption>Back</figcaption></figure>' +
        '</div>' +
        '<div class="phz-legend">' +
          '<span class="phz-legend__l">Low</span>' +
          '<span class="phz-legend__ramp"></span>' +
          '<span class="phz-legend__l">High</span>' +
          '<span class="phz-legend__note">' +
            (isHold ? "Phases are points in TIME — a hold has no rep cycle." : "Phases are points in the rep.") +
          '</span>' +
        '</div>' +
        '<div class="phz-bars" id="phz-bars">' +
          keys.map(function (k) {
            var g = meta[k] || { label: k };
            return '<div class="phz-bar" data-bar="' + k + '">' +
              '<span class="phz-bar__l">' + esc(g.label) + '</span>' +
              '<span class="phz-bar__t"><i></i></span>' +
              '<span class="phz-bar__v">0%</span>' +
            '</div>';
          }).join("") +
        '</div>' +
        '<p class="phz-caveat">' +
          '<strong>Illustrative, not measured.</strong> These values encode the general ' +
          'biomechanics of the movement — which muscle leads, which takes over, where peak ' +
          'contraction sits. They are not EMG readings from a study. Read them as ' +
          '"this is among the hardest-working muscles here", never as a percentage of your maximum.' +
        '</p>' +
      '</div>';

    var ramp_el = host.querySelector(".phz-legend__ramp");
    if (ramp_el) {
      var stops = [];
      for (var s = 0; s <= 10; s++) stops.push(ramp(s / 10));
      ramp_el.style.background = "linear-gradient(90deg," + stops.join(",") + ")";
    }

    var figs = {};
    ["front", "back"].forEach(function (view) {
      var wrap = host.querySelector('[data-fig="' + view + '"]');
      var svg = buildFigure(view, rig, keys);
      wrap.appendChild(svg);
      figs[view] = svg;
    });

    var descEl = host.querySelector("#phz-desc");
    var barEls = {};
    keys.forEach(function (k) {
      var row = host.querySelector('[data-bar="' + k + '"]');
      barEls[k] = { fill: row.querySelector("i"), val: row.querySelector(".phz-bar__v") };
    });

    /* ---- tween ----
       Pose and activation are interpolated by the SAME clock in the SAME
       frame. Driving the bars off a CSS transition and the figure off rAF
       would let them disagree for 400ms on every switch. */
    var cur = { pos: data.phases[0].pos, acts: {} };
    keys.forEach(function (k) { cur.acts[k] = data.muscles[k][0]; });
    var from = null, to = null, t0 = 0, raf = 0;

    function paint(pos, acts) {
      paintFigure(figs.front, "front", rig, pos, acts);
      paintFigure(figs.back, "back", rig, pos, acts);
      keys.forEach(function (k) {
        var v = acts[k] || 0;
        barEls[k].fill.style.width = (v * 100).toFixed(1) + "%";
        barEls[k].fill.style.background = fillFor(v);
        barEls[k].val.textContent = Math.round(v * 100) + "%";
      });
    }

    function step(ts) {
      if (!t0) t0 = ts;
      var t = Math.min(1, (ts - t0) / TWEEN_MS);
      /* easeOutCubic: the figure should arrive and settle, not coast. */
      var e = 1 - Math.pow(1 - t, 3);
      var pos = lerp(from.pos, to.pos, e);
      var acts = {};
      keys.forEach(function (k) { acts[k] = lerp(from.acts[k], to.acts[k], e); });
      paint(pos, acts);
      cur = { pos: pos, acts: acts };
      if (t < 1) raf = requestAnimationFrame(step);
      else raf = 0;
    }

    function goTo(i) {
      var ph = data.phases[i];
      from = { pos: cur.pos, acts: {} };
      keys.forEach(function (k) { from.acts[k] = cur.acts[k]; });
      to = { pos: ph.pos, acts: {} };
      keys.forEach(function (k) { to.acts[k] = data.muscles[k][i]; });
      descEl.textContent = ph.desc;
      t0 = 0;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(step);
    }

    host.querySelectorAll("[data-phz]").forEach(function (b) {
      b.addEventListener("click", function () {
        host.querySelectorAll("[data-phz]").forEach(function (x) {
          var on = x === b;
          x.classList.toggle("is-active", on);
          x.setAttribute("aria-selected", on);
        });
        goTo(+b.dataset.phz);
      });
    });

    /* First paint with no animation, so opening the modal shows the movement
       already in position rather than sliding into it. */
    descEl.textContent = data.phases[0].desc;
    paint(data.phases[0].pos, cur.acts);
  }

  App.phases = { render: render, ramp: ramp, hasPhases: function (id) { return !!(window.PHASE_MAP && window.PHASE_MAP[id]); } };
})();
