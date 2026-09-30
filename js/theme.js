/* ============================================================================
   WELLNESS HUB · THEME
   ----------------------------------------------------------------------------
   Owns the one attribute that reskins the whole app: `data-theme` on <html>.
   css/palettes.css does the rest — a theme is data, not behaviour — and
   css/neumorph.css draws every palette in the same soft-UI shape.

   Three things have to happen on a switch, and only the first is CSS:

     1. the attribute changes, so every token re-resolves;
     2. <meta name="theme-color"> follows, or an installed PWA keeps painting
        its status bar in the old palette's ground;
     3. Chart.js is re-themed and the open view re-rendered, because charts
        need literal colour strings and therefore hold a copy of the old ones.

   The palette list is js/palettes.data.js, generated with css/palettes.css by
   tools/build-palettes.py from the Themes/ folder. Both come from the same run,
   so a swatch in the picker can never disagree with the palette it applies.

   The stored preference lives in `wellnessHub.ui` (Hub.uiGet/uiSet) rather than
   the versioned state, so it survives "reset my data" and never rides along in
   a backup — a theme is about this browser, not about your records. That is
   also why replacing the old palette list needed no migration: a saved id that
   is no longer in the list (gruvbox, tokyo-night, paper-ochre …) fails byId()
   and falls back to DEFAULT. The same key is read by a tiny inline script in
   index.html <head>, which stamps the attribute before first paint.

   The switch crossfades (document.startViewTransition, GPU-composited) where
   the engine has it and the OS hasn't asked for reduced motion; anywhere else
   it is instant, which is also correct.

   Public: Hub.theme.list() / .active() / .apply(id) / .label(id)
   Event:  document → "wh:themechange" { detail: { id } }
   ========================================================================== */
(function () {
  "use strict";

  var KEY = "theme";
  var THEMES = window.WH_PALETTES || [];
  var DEFAULT = window.WH_PALETTE_DEFAULT || "selene";

  function byId(id) {
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
    return null;
  }

  function active() {
    var id = Hub.uiGet(KEY, DEFAULT);
    return byId(id) ? id : DEFAULT;
  }

  /* The page ground, read back from the cascade once the attribute is set, so
     the status bar always matches what the theme actually resolved to. */
  function setMetaColour() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    var v = getComputedStyle(document.documentElement).getPropertyValue("--bg0-hard").trim();
    if (v) meta.setAttribute("content", v);
  }

  /* Always stamped, including for the default: css/palettes.css makes the
     default palette :root as well, so the attribute is for the picker and the
     inline boot script, not for the first paint. */
  function stamp(id) {
    document.documentElement.setAttribute("data-theme", id);
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function apply(id, opts) {
    opts = opts || {};
    if (!byId(id)) id = DEFAULT;
    if (opts.save !== false) Hub.uiSet(KEY, id);

    function commit() {
      stamp(id);
      setMetaColour();
      /* Charts cached literal hexes from the palette that was in force when they
         were built; nothing short of a rebuild recolours them. Inside the commit
         so the crossfade lands on a page whose charts already match. */
      document.dispatchEvent(new CustomEvent("wh:themechange", { detail: { id: id } }));
      if (opts.rerender !== false) redrawCharts();
    }

    /* First paint and the boot re-stamp pass animate:false — there is nothing
       to fade from. A skipped or aborted transition rejects its promises; the
       commit has already run by then, so those rejections are noise. */
    if (opts.animate !== false && document.startViewTransition && !reducedMotion()) {
      try {
        var vt = document.startViewTransition(commit);
        if (vt.ready) vt.ready.catch(function () {});
        if (vt.finished) vt.finished.catch(function () {});
        return;
      } catch (e) { /* fall through to the instant path */ }
    }
    commit();
  }

  /* Re-render whichever chart-bearing surface is open — and only that one.
     Refreshing the whole app would also re-render Settings, throwing the user
     back to the top of the page they just clicked on. Insights is the hub's
     only Chart.js view; the calisthenics app draws in Progress and Evaluation,
     but App.refresh() re-renders just its own active section. */
  function redrawCharts() {
    try {
      if (window.Chart) window.Chart.__ironframeThemed = false;
      var view = Hub.activeView && Hub.activeView();
      if (view === "insights") Hub.refresh();
      else if (view === "fitness" && window.App && App.refresh) App.refresh();
    } catch (e) {}
  }

  Hub.theme = {
    list: function () { return THEMES.slice(); },
    active: active,
    apply: apply,
    label: function (id) { var t = byId(id); return t ? t.label : id; },
    DEFAULT: DEFAULT
  };

  /* The inline boot script in <head> already stamped the attribute; this only
     re-derives it (an unknown saved id becomes the default) and the meta
     colour, which needs the stylesheets to have loaded. */
  document.addEventListener("DOMContentLoaded", function () {
    stamp(active());
    setMetaColour();
  });
})();
