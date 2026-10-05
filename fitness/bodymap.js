/* ============================================================================
   BASALT · BODY MAP  —  the front-and-back figure that colours muscle groups
   ----------------------------------------------------------------------------
   Draws fitness/bodymap.data.js (one region per muscle group and body side) as
   two inline SVGs and colours the regions from a spec. Two modes, one drawing:

     · tiers   a movement's profile: primary, secondary, stabiliser
     · heat    one number per group, 0..1 (the Muscles screen's 7-day view)

   WHAT IT DOES AND DOESN'T CLAIM
     · The figure is a stylised drawing, not anatomy. Where one drawn shape
       holds two groups (deltoids, trapezius, upper back, glutes) the data file
       was cut by judgement; the credit line below each map says so.
     · Colour is never the only channel. A lit region carries an aria-label
       with its tier or number, the legend names every step, and each caller
       keeps a text list of the same groups beside the map.
     · Shapes are small: under 24 px in one dimension at 390 px for every group
       (W13 measured it). A tappable map therefore adds a transparent hit pad
       under each region, and the caller must keep a list of groups as the
       reliable way in. This file doesn't add one.

   THE COLOURS MEAN SOMETHING, SO THEY DON'T FOLLOW THE THEME
     Fills come from App.phases.ramp, the same grey -> amber -> red the muscle
     phase view uses, and tier weights come from App.phases.tier, so the three
     views can't disagree about what "secondary" looks like. Only the figure
     around them (silhouette, unlit regions, focus ring) uses theme tokens.

   PUBLIC:  App.bodymap.render(host, spec, opts)
     spec  { mode: "tiers", profile: { primary[], secondary[], stabiliser[] } }
           { mode: "heat",  values: { group: 0..1 },
             label(group, value) -> string   optional; the aria text and title
             legend: [lowText, highText]     optional; defaults to Low / High;
                     false draws none (a two-state filter has no ramp) }
     opts  { onTap(groupKey) }                 optional; makes regions buttons
   ========================================================================== */
(function () {
  "use strict";

  var App = window.App;
  if (!App) return;

  var VIEWS = [["front", "Front"], ["back", "Back"]];

  var TIER_ORDER = ["primary", "secondary", "stabiliser"];
  var TIER_LABEL = { primary: "Primary", secondary: "Secondary", stabiliser: "Stabiliser" };

  var esc = App.util.escapeHtml;

  function groupLabels() {
    var out = {};
    (window.MUSCLE_GROUPS || []).forEach(function (g) { out[g.key] = g.label; });
    return out;
  }

  /* group -> { v: 0..1, text } for the regions to light, from either spec. */
  function levelsFor(spec, labels) {
    var out = {};
    if (spec.mode === "heat") {
      var say = spec.label || function (k, v) { return Math.round(v * 100) + "%"; };
      Object.keys(spec.values || {}).forEach(function (k) {
        var v = Math.max(0, Math.min(1, +spec.values[k] || 0));
        out[k] = { v: v, text: say(k, v) };
      });
      return out;
    }
    var weight = (App.phases && App.phases.tier) || {};
    var prof = spec.profile || {};
    /* Lowest tier first so a group listed twice ends on its highest. */
    TIER_ORDER.slice().reverse().forEach(function (t) {
      (prof[t] || []).forEach(function (k) {
        out[k] = { v: weight[t] || 0, text: TIER_LABEL[t].toLowerCase() };
      });
    });
    return out;
  }

  function legendHtml(spec, ramp, opacityFor) {
    if (spec.legend === false) return "";
    if (spec.mode === "heat") {
      var lo = (spec.legend && spec.legend[0]) || "Low";
      var hi = (spec.legend && spec.legend[1]) || "High";
      var stops = [];
      for (var s = 0; s <= 10; s++) stops.push(ramp(s / 10));
      return '<div class="bm-legend">' +
        '<span class="bm-legend__l">' + esc(lo) + '</span>' +
        '<span class="bm-legend__ramp" style="background:linear-gradient(90deg,' + stops.join(",") + ')"></span>' +
        '<span class="bm-legend__l">' + esc(hi) + '</span></div>';
    }
    var weight = App.phases.tier;
    return '<div class="bm-legend">' + TIER_ORDER.map(function (t) {
      var v = weight[t];
      return '<span class="bm-legend__k"><i class="bm-swatch" style="background:' + ramp(v) +
        ';opacity:' + opacityFor(v) + '"></i>' + TIER_LABEL[t] + '</span>';
    }).join("") + '</div>';
  }

  function figureHtml(view, caption, M, lit, labels, interactive, ramp, opacityFor) {
    var regions = M[view];
    var out = M.outline[view];
    var seen = {};

    var parts = out.parts.map(function (d) { return '<path class="bm-part" d="' + d + '"/>'; }).join("");
    var pads = interactive
      ? '<g class="bm-pads">' + regions.map(function (r) {
          return '<path class="bm-pad" data-g="' + r.group + '" d="' + r.d + '"/>';
        }).join("") + '</g>'
      : "";

    var shapes = regions.map(function (r) {
      var l = lit[r.group];
      var on = !!l && l.v > 0;   // a heat value of 0 has a label but no colour
      var name = labels[r.group] || r.group;
      var attrs = ' data-g="' + r.group + '" d="' + r.d + '"';
      attrs += ' aria-label="' + esc(name + " — " + (l ? l.text : "not worked")) + '"';
      if (on) attrs += ' style="fill:' + ramp(l.v) + ';fill-opacity:' + opacityFor(l.v) + '"';
      var cls = "bm-r" + (on ? "" : " bm-r--off");
      if (interactive) {
        /* One tab stop per group and view: left and right are the same group. */
        attrs += ' role="button" tabindex="' + (seen[r.group] ? "-1" : "0") + '"';
        seen[r.group] = true;
        cls += " bm-r--tap";
      } else {
        /* Unlit regions are decoration; the lit ones are the content. */
        attrs += on ? ' role="img"' : ' aria-hidden="true"';
      }
      return '<path class="' + cls + '"' + attrs + '/>';
    }).join("");

    return '<figure class="bm-figwrap">' +
      '<svg class="bm-fig" viewBox="' + M.viewBox[view] + '" role="group" aria-label="' + caption + ' view">' +
        '<path class="bm-body" d="' + out.body + '"/>' + parts + pads + shapes +
      '</svg><figcaption>' + caption + '</figcaption></figure>';
  }

  function render(host, spec, opts) {
    if (!host) return;
    var M = window.BODY_MAP;
    var P = App.phases;
    if (!M || !P || !P.ramp) { host.innerHTML = ""; return; }
    opts = opts || {};

    var labels = groupLabels();
    var lit = levelsFor(spec, labels);
    var interactive = typeof opts.onTap === "function";
    var ramp = P.ramp;
    var opacityFor = P.opacityFor;

    host.innerHTML =
      '<div class="bm" data-bm-mode="' + esc(spec.mode) + '">' +
        '<div class="bm-figs">' +
          VIEWS.map(function (v) {
            return figureHtml(v[0], v[1], M, lit, labels, interactive, ramp, opacityFor);
          }).join("") +
        '</div>' +
        legendHtml(spec, ramp, opacityFor) +
        '<p class="bm-credit">A simplified drawing, not anatomy: some shapes are cut in two by judgement. ' +
          'Adapted from react-native-body-highlighter (MIT, © 2022 ELABBASSI Hicham); licence in vendor/LICENSES/.</p>' +
      '</div>';

    if (!interactive) return;
    var fire = function (el) {
      var g = el && el.getAttribute && el.getAttribute("data-g");
      if (g) opts.onTap(g);
    };
    host.querySelector(".bm").addEventListener("click", function (e) {
      fire(e.target.closest("[data-g]"));
    });
    host.querySelector(".bm").addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var el = e.target.closest && e.target.closest(".bm-r--tap");
      if (!el) return;
      e.preventDefault();
      fire(el);
    });
  }

  App.bodymap = { render: render };
})();
