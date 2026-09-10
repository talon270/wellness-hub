/* ============================================================================
   WELLNESS HUB · THEME
   ----------------------------------------------------------------------------
   Owns the one attribute that reskins the whole app: `data-theme` on <html>.
   css/themes.css does the rest — a theme is data, not behaviour.

   Three things have to happen on a switch, and only the first is CSS:

     1. the attribute changes, so every token re-resolves;
     2. <meta name="theme-color"> follows, or an installed PWA keeps painting
        its status bar in the old palette's ground;
     3. Chart.js is re-themed and the open view re-rendered, because charts
        need literal colour strings and therefore hold a copy of the old ones.

   The stored preference lives in `wellnessHub.ui` (Hub.uiGet/uiSet) rather than
   the versioned state, so it survives "reset my data" and never rides along in
   a backup — a theme is about this browser, not about your records. The same
   key is read by a tiny inline script in index.html <head>, which stamps the
   attribute before first paint; without it every load would flash Gruvbox.

   Public: Hub.theme.list() / .active() / .apply(id) / .label(id)
   Event:  document → "wh:themechange" { detail: { id } }
   ========================================================================== */
(function () {
  "use strict";

  var KEY = "theme";
  var DEFAULT = "gruvbox";

  /* Preview colours are duplicated from css/themes.css on purpose: the picker
     has to draw a swatch for a theme that isn't applied, and a CSS custom
     property only ever reports the value of the theme currently in force. */
  var THEMES = [
    {
      id: "gruvbox", label: "Gruvbox Dark",
      note: "The original. Warm, high-contrast, unmistakably a terminal theme.",
      bg: "#1d2021", surface: "#282828", text: "#ebdbb2",
      dots: ["#fe8019", "#b8bb26", "#fabd2f", "#83a598", "#d3869b"]
    },
    {
      id: "gruvbox-material", label: "Gruvbox Material",
      note: "Same identity, evened out. Accents stop competing for attention.",
      bg: "#232323", surface: "#282828", text: "#d4be98",
      dots: ["#e78a4e", "#a9b665", "#d8a657", "#7daea3", "#d3869b"]
    },
    {
      id: "everforest", label: "Everforest",
      note: "Green-grey grounds and softer accents. The calmest of the five.",
      bg: "#232a2e", surface: "#2d353b", text: "#d3c6aa",
      dots: ["#e69875", "#a7c080", "#dbbc7f", "#7fbbb3", "#d699b6"]
    },
    {
      id: "rose-pine", label: "Rosé Pine Moon",
      note: "Plum-tinted and low-heat. Reads as a product rather than an editor.",
      bg: "#232136", surface: "#2a273f", text: "#e0def4",
      dots: ["#ea9a97", "#9ccfd8", "#f6c177", "#6cb6d4", "#c4a7e7"]
    },
    {
      id: "tokyo-night", label: "Tokyo Night",
      note: "Cool and deep, with real blues. The biggest departure here.",
      bg: "#16161e", surface: "#1a1b26", text: "#c0caf5",
      dots: ["#ff9e64", "#9ece6a", "#e0af68", "#7aa2f7", "#bb9af7"]
    }
  ];

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

  function stamp(id) {
    var root = document.documentElement;
    /* Gruvbox is what :root already says in css/hub.css, so it is the absence
       of an attribute rather than a block of its own. */
    if (id === DEFAULT) root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", id);
  }

  function apply(id, opts) {
    opts = opts || {};
    if (!byId(id)) id = DEFAULT;
    stamp(id);
    setMetaColour();
    if (opts.save !== false) Hub.uiSet(KEY, id);

    /* Charts cached literal hexes from the palette that was in force when they
       were built; nothing short of a rebuild recolours them. */
    document.dispatchEvent(new CustomEvent("wh:themechange", { detail: { id: id } }));
    if (opts.rerender !== false) redrawCharts();
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
     re-derives the meta colour, which needs the stylesheets to have loaded. */
  document.addEventListener("DOMContentLoaded", function () {
    stamp(active());
    setMetaColour();
  });
})();
