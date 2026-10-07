/* The catalogue is the roadmap. Keep this view read-only: choosing a step still
   happens in Workout, where the recommendation can use the user's logged sets. */
(function () {
  "use strict";
  if (!window.App || !window.TRAINING_DATA || !window.Training) return;

  var App = window.App, TD = window.TRAINING_DATA, Training = window.Training;
  var esc = App.util.escapeHtml;
  var MAIN = ["push", "row", "pull", "squat", "hinge", "core", "shoulder", "dip"];

  function name(id) { return (window.EXERCISE_DB[id] || {}).name || id; }
  function setup(rx) {
    var S = TD.SETUPS[rx.exerciseId], out = [], st = rx.setup || {};
    if (S) {
      var v = S.values.filter(function (x) { return x.id === st[S.key]; })[0];
      if (v) out.push(v.label + (v.cm ? " · about " + v.cm + " cm" : ""));
    }
    if (st.loadMode) out.push(st.loadKg == null ? "weight not set" : st.loadKg + " kg " + (st.loadMode === "perHand" ? "per hand" : "total"));
    return out.join(" · ");
  }
  function prescription(rx) {
    if (!rx || !rx.range) return "No set target";
    /* A skill's range has no bottom: its standard is a ceiling ("up to 45 s"),
       as Skills and the workout card print it. */
    var range = rx.range[0] != null ? rx.range[0] + "–" + rx.range[1] : rx.range[1] != null ? "up to " + rx.range[1] : "attempts";
    var unit = rx.range[1] == null ? "" : rx.unit === "sec" ? " sec" : " reps";
    return rx.sets + " sets × " + range + unit + (setup(rx) ? " · " + setup(rx) : "");
  }
  function title(id, rx) { return name(id) + (rx && setup(rx) ? " · " + setup(rx) : ""); }
  function skillTracks() {
    var tracks = App.skills && App.skills.tracks || {};
    return Object.keys(tracks).filter(function (k) { return k !== "variations" && Array.isArray(tracks[k].ids); });
  }
  function choices() {
    return MAIN.map(function (slot) { return { key: slot, label: TD.SLOTS[slot].label, group: "Main workouts" }; })
      .concat(Object.keys(TD.SLOTS).filter(function (slot) { return TD.SLOTS[slot].coverage; }).map(function (slot) {
        return { key: slot, label: TD.SLOTS[slot].label, group: "Accessory and conditioning" };
      }))
      .concat(skillTracks().map(function (track) {
        return { key: "skill:" + track, label: App.skills.tracks[track].label, group: "Skills" };
      }));
  }
  function orderedIds(slot) {
    var seen = {}, path = [];
    function visit(id) {
      var ex = TD.EXERCISES[id];
      if (!ex || seen[id] || ex.slot !== slot || ex.branch !== "main") return;
      seen[id] = true; path.push(id);
      ex.next.forEach(visit);
    }
    (TD.SLOTS[slot].first || []).forEach(visit);
    var others = Object.keys(TD.EXERCISES).filter(function (id) {
      return TD.EXERCISES[id].slot === slot && !seen[id];
    });
    return {
      path: path,
      alternates: others.filter(function (id) { return TD.EXERCISES[id].branch === "main"; }),
      optional: others.filter(function (id) { return TD.EXERCISES[id].branch !== "main"; })
    };
  }
  function node(id, index, currentId, s, group) {
    var ex = TD.EXERCISES[id], rx = Training.startOf(id, { goal: (s.profile || {}).goal || "both" });
    var S = TD.SETUPS[id], miss = App.ui.gearMissing(id, s.equipment || {});
    var next = ex.next.map(name).join(" · ");
    var options = ex.offer.map(name).join(" · ");
    var label = currentId === id ? "Planned now" : "";
    var setupLine = S ? '<div class="roadmap-setups"><span>Setup steps:</span> ' +
      S.values.map(function (v) { return esc(v.label); }).join(' → ') + '</div>' : "";
    return '<li class="roadmap-node' + (label ? ' is-current' : '') + '">' +
      '<div class="roadmap-node__top"><span class="roadmap-node__number">' + (index + 1) + '</span>' +
      '<strong>' + esc(name(id)) + '</strong>' +
      (label ? '<span class="badge badge--primary">Planned now</span>' : '') +
      (miss ? '<span class="badge">Needs ' + esc(miss) + '</span>' : '') + '</div>' +
      '<p class="roadmap-node__rx">' + esc(prescription(rx)) + '</p>' + setupLine +
      (next ? '<p class="roadmap-node__link"><b>Next:</b> ' + esc(next) + '</p>' :
        (ex.loadMode ? '<p class="roadmap-node__link">Keep adding available weight while reps stay controlled.</p>' :
          group === "path" ? '<p class="roadmap-node__link">End of this route.</p>' : '')) +
      (options ? '<p class="roadmap-node__link"><b>Optional branches:</b> ' + esc(options) + '</p>' : '') +
      '<button class="btn btn--ghost btn--sm mt-2" type="button" data-roadmap-guide="' + esc(id) + '">See exercise guide</button>' +
      '</li>';
  }
  function nodes(ids, currentId, s, group) {
    return '<ol class="roadmap-list">' + ids.map(function (id, i) { return node(id, i, currentId, s, group); }).join("") + '</ol>';
  }
  function selection(s, key) {
    var track = key.indexOf("skill:") === 0 ? key.slice(6) : null;
    var saved = track ? ((s.training || {}).skills || {})[track] : ((s.training || {}).slots || {})[key];
    var off = !!(saved && saved.off);
    if (off) saved = null;
    var prescribed = !track && App.engine.prescriptionFor(key);
    return { saved: saved, rx: track ? saved : (prescribed && prescribed.rx) || saved,
      note: prescribed && prescribed.note, off: off };
  }
  function nextStep(s, rx) {
    if (!rx) return "Choose an exercise in Program or Skills to see your next personal step.";
    var ctx = App.engine.ctx();
    var step = Training.stepUp(rx, ctx);
    if (step) return title(step.rx.exerciseId, step.rx);
    if (TD.EXERCISES[rx.exerciseId] && TD.EXERCISES[rx.exerciseId].loadMode &&
        (!rx.setup || rx.setup.loadKg == null)) return "Log a working weight first; then the next available load can be shown.";
    return "This route has no further step with your current equipment and limits.";
  }
  function personalCard(s, key, selected) {
    var rx = selected.rx, rec = selected.saved && App.engine.recommendFor(key);
    var status = selected.saved && App.ui.slotStatus && key.indexOf("skill:") !== 0 ? App.ui.slotStatus(key) : "";
    var different = selected.saved && rx && selected.saved.exerciseId !== rx.exerciseId;
    var heading = selected.off ? "This slot is turned off" : rx ? name(rx.exerciseId) : "No exercise available";
    return '<div class="card card--accent roadmap-current"><div class="eyebrow">' +
      (selected.off ? 'Off your plan' : selected.saved ? 'Your current route' : rx ? 'Suggested starting point' : 'Choose a route') + '</div>' +
      '<h2 class="display h3">' + esc(heading) + '</h2>' +
      (rx ? '<p class="muted text-sm">' + (selected.saved ? 'Planned now: ' : 'Start with: ') + esc(prescription(rx)) + '</p>' : '') +
      (different ? '<p class="muted text-sm">Saved progression: ' + esc(name(selected.saved.exerciseId)) + '. ' + esc(selected.note || 'Workout is using an easier movement for now.') + '</p>' : '') +
      (!selected.off ? '<p class="text-sm"><b>If you improve:</b> ' + esc(nextStep(s, rx)) + '</p>' : '') +
      (status ? '<p class="muted text-sm">' + esc(status) + '</p>' : '') +
      (rec && rec.action === "ready" && rec.step && !rec.decision ? '<span class="badge badge--primary">Ready to choose in Workout</span>' : '') +
      '<button class="btn btn--secondary btn--sm" type="button" data-roadmap-edit="' + esc(key) + '">' +
        (key.indexOf("skill:") === 0 ? 'Choose a rung in Skills' : 'Edit your plan in Program') + '</button>' +
      '<p class="faint text-xs">When a step is available, it becomes eligible after ' + TD.EVIDENCE_SESSIONS +
      ' comparable sessions on different days with every set at the top of its range, rated easy or just right. You choose whether to take it; the app cannot judge your form.</p></div>';
  }
  function render(el, s) {
    var list = choices(), key = App.util.uiGet("roadmap.slot", "push");
    if (!list.some(function (x) { return x.key === key; })) key = "push";
    var track = key.indexOf("skill:") === 0 ? key.slice(6) : null;
    var def = track ? App.skills.tracks[track] : TD.SLOTS[key];
    var selected = selection(s, key), currentId = selected.saved && selected.rx && selected.rx.exerciseId;
    var order = track ? { path: def.ids, alternates: [], optional: [] } : orderedIds(key);
    var grouped = ["Main workouts", "Accessory and conditioning", "Skills"].map(function (group) {
      return '<optgroup label="' + group + '">' + list.filter(function (x) { return x.group === group; }).map(function (x) {
        return '<option value="' + esc(x.key) + '"' + (x.key === key ? ' selected' : '') + '>' + esc(x.label) + '</option>';
      }).join("") + '</optgroup>';
    }).join("");
    el.innerHTML = '<div class="page-head"><div class="eyebrow">Training map</div><h1 class="display h2">Progression</h1>' +
      '<p class="muted text-sm">See where each exercise leads. Setup changes come before a new movement; optional branches and loaded alternatives are shown separately.</p></div>' +
      '<label class="field roadmap-picker"><span class="field__label">Exercise family or skill</span><select class="select" id="roadmap-select">' + grouped + '</select></label>' +
      personalCard(s, key, selected) +
      '<div class="page-head mt-6"><div class="eyebrow">Full roadmap</div><h2 class="display h3">' + esc(def.label) + '</h2>' +
      (track ? '<p class="muted text-sm">' + esc(def.intro) + ' Follow each Next link for the actual upgrade; some listed rungs are optional.</p>' :
        '<p class="muted text-sm">Follow the main route below. Arrows show possible next exercises; some branches are choices, not required stages.</p>') + '</div>' +
      nodes(order.path, currentId, s, "path") +
      (order.alternates.length ? '<details class="roadmap-extra"' + (order.alternates.indexOf(currentId) >= 0 ? ' open' : '') +
        '><summary>Other strength routes · ' + order.alternates.length + '</summary>' +
        nodes(order.alternates, currentId, s, "alternate") + '</details>' : '') +
      (order.optional.length ? '<details class="roadmap-extra"' + (order.optional.indexOf(currentId) >= 0 ? ' open' : '') +
        '><summary>Optional skills and variations · ' + order.optional.length + '</summary>' +
        nodes(order.optional, currentId, s, "optional") + '</details>' : '') +
      '<p class="faint text-xs mt-4">Targets and available steps use your goal, equipment and saved prescription. The full map includes exercises you may not own the gear for.</p>';
    el.querySelector("#roadmap-select").addEventListener("change", function (e) {
      App.util.uiSet("roadmap.slot", e.target.value);
      render(el, App.getState());
      el.querySelector("#roadmap-select").focus();
    });
    el.querySelector("[data-roadmap-edit]").addEventListener("click", function () {
      if (track && App.skills && App.skills.openTrack) App.skills.openTrack(track);
      else App.showSection("program", { focus: true });
    });
    el.querySelectorAll("[data-roadmap-guide]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (App.directory && App.directory.open) App.directory.open(button.dataset.roadmapGuide);
      });
    });
  }
  function mount() { App.registerView("progression", render); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
