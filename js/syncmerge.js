/* ==========================================================================
   WELLNESS HUB · SYNC MERGE

   Helth's half of the folder-sync design: the part that vendor/sync.js
   deliberately does not contain, because only this app knows what its own
   data means.

     · SHAPES        the 25 fields under `logs`, grouped into four kinds
     · STAMPING      set `updatedAt` on records that actually changed
     · BACKFILL      give a v3 save the stamps a v4 merge needs
     · MERGE         combine a file payload with the local one

   The merge is per-shape rather than per-field. Twenty-five fields collapse
   into four kinds with no remainder, so a per-field table would be 25 rows
   saying the same four things — and would need editing every time a field is
   added.

   Public namespace: window.Hub.syncMerge
   ========================================================================== */
(function () {
  "use strict";

  var Hub = window.Hub = window.Hub || {};

  /* ======================================================================
     1. THE SHAPES
     ====================================================================== */

  /* Union by id, newest `updatedAt` wins. Same rule as Docket's reconcile:
     two machines touching different rows both keep their work. */
  var ID_ARRAYS = [
    "sleep", "vitals", "checkups", "meds", "injuries",
    "breathTests", "vo2max", "labs", "cycles", "customHabits", "photos"
  ];

  /* "Last done" dates. The later date wins, and that rule cannot be wrong —
     when you last did a thing genuinely IS the maximum of the two answers.
     These need no stamp of their own. */
  var ISO_SCALARS = [
    "toothbrushISO", "skinCheckISO", "haircutISO", "nailsHandsISO",
    "nailsFeetISO", "callusISO", "shoesISO", "breastExamISO", "testisExamISO"
  ];

  /* Never synced. A sitting session belongs to the chair you are in —
     uploading it lets a machine you are not sitting at "discover" that you
     have been seated for two hours. Study hit exactly this with its running
     timer (Study/PLAN-server-sync.md, deviation 2) and the reasoning is the
     same one. */
  var LOCAL_ONLY = ["deskSession"];

  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }

  /* A record's identity for change detection, with the stamp itself removed —
     otherwise every record differs from its own previous version. */
  function stable(rec) {
    if (!isObj(rec)) return JSON.stringify(rec);
    var copy = {};
    Object.keys(rec).forEach(function (k) {
      if (k !== "updatedAt") copy[k] = rec[k];
    });
    return JSON.stringify(copy);
  }

  function newer(a, b) {
    /* Missing stamps sort as oldest, so a record that has one always beats a
       record that does not. A v3 record reaching a v4 merge unstamped must
       never outrank a live edit. */
    return (a || "") > (b || "") ? a : b;
  }

  /* ======================================================================
     2. STAMPING
     ----------------------------------------------------------------------
     `commit()` does not know what changed — the views mutate
     `Hub.state.logs.days[key]` directly in dozens of places. Rather than
     touch every one of those call sites, the stamp is derived by comparing
     each record against how it looked at the last save.

     That costs roughly one extra serialisation per save, on top of the one
     `save()` already does. Photos are not in this object (they live in
     IndexedDB), so the state being walked is small.
     ====================================================================== */

  function index(state) {
    var out = { days: {}, arrays: {} };
    if (!state || !state.logs) return out;
    var days = state.logs.days || {};
    Object.keys(days).forEach(function (k) { out.days[k] = stable(days[k]); });
    ID_ARRAYS.forEach(function (field) {
      var arr = state.logs[field];
      if (!Array.isArray(arr)) return;
      var m = out.arrays[field] = {};
      arr.forEach(function (item) { if (item && item.id != null) m[item.id] = stable(item); });
    });
    return out;
  }

  /* Mutates `state`, returns the fresh index to hold for next time. */
  function stampChanges(state, prev) {
    var now = new Date().toISOString();
    if (!state || !state.logs) return index(state);
    prev = prev || { days: {}, arrays: {} };

    var days = state.logs.days || {};
    Object.keys(days).forEach(function (k) {
      var rec = days[k];
      if (!isObj(rec)) return;
      var s = stable(rec);
      if (prev.days[k] !== s) rec.updatedAt = now;
    });

    ID_ARRAYS.forEach(function (field) {
      var arr = state.logs[field];
      if (!Array.isArray(arr)) return;
      var pm = prev.arrays[field] || {};
      arr.forEach(function (item) {
        if (!isObj(item) || item.id == null) return;
        var s = stable(item);
        if (pm[item.id] !== s) item.updatedAt = now;
      });
    });

    return index(state);
  }

  /* ======================================================================
     3. BACKFILL — the v3 → v4 migration's data half
     ----------------------------------------------------------------------
     Day records are stamped from their own key at midday local, and array
     items from their `date` field. Deliberately conservative: every
     pre-migration record ends up older than anything written after the
     migration, so the first merge after upgrading can never let a historical
     record outrank a live edit.

     `date` is when a reading was TAKEN. `updatedAt` is when the row was last
     EDITED. Correcting Monday's weight on Friday changes one and not the
     other, which is exactly why the merge cannot key on `date`.
     ====================================================================== */

  function backfillStamps(state) {
    if (!state || !state.logs) return state;
    var fallback = (state.meta && state.meta.updatedAt) || "1970-01-01T00:00:00.000Z";

    var days = state.logs.days || {};
    Object.keys(days).forEach(function (k) {
      var rec = days[k];
      if (isObj(rec) && !rec.updatedAt) {
        rec.updatedAt = /^\d{4}-\d{2}-\d{2}$/.test(k) ? k + "T12:00:00.000Z" : fallback;
      }
    });

    ID_ARRAYS.forEach(function (field) {
      var arr = state.logs[field];
      if (!Array.isArray(arr)) return;
      arr.forEach(function (item) {
        if (!isObj(item) || item.updatedAt) return;
        var d = item.date || item.startISO || item.dateISO || null;
        item.updatedAt = (d && /^\d{4}-\d{2}-\d{2}/.test(d))
          ? (d.length === 10 ? d + "T12:00:00.000Z" : d)
          : fallback;
      });
    });

    return state;
  }

  /* ======================================================================
     4. MERGE
     ====================================================================== */

  function mergeDays(a, b) {
    var out = {};
    Object.keys(a || {}).forEach(function (k) { out[k] = a[k]; });
    Object.keys(b || {}).forEach(function (k) {
      var mine = b[k], theirs = out[k];
      if (!theirs) { out[k] = mine; return; }
      out[k] = ((mine && mine.updatedAt) || "") > ((theirs && theirs.updatedAt) || "")
        ? mine : theirs;
    });
    return out;
  }

  /* Union by id. A row deleted on one machine reappears from the other until
     both have merged — the known cost of union-by-presence, weighed against
     never-delete and accepted, because a correction that will not stick is
     worse than a row that comes back once. The rolling backups in the sync
     folder are the recovery path if that goes wrong. */
  function mergeById(a, b) {
    var byId = new Map();
    (a || []).forEach(function (it) { if (it && it.id != null) byId.set(it.id, it); });
    (b || []).forEach(function (it) {
      if (!it || it.id == null) return;
      var cur = byId.get(it.id);
      if (!cur || (it.updatedAt || "") > (cur.updatedAt || "")) byId.set(it.id, it);
    });
    return Array.from(byId.values());
  }

  function isEmpty(v) {
    return v == null || v === "" ||
      (Array.isArray(v) && v.length === 0) ||
      (isObj(v) && Object.keys(v).length === 0);
  }

  /* Field level, non-empty newest wins. Fill in blood type on the Mac and
     allergies on the desktop and you end up with both, which whole-object
     replacement would not give you. `preferB` says which side is the newer
     payload, and only decides ties where both sides are non-empty. */
  function mergeFields(a, b, preferB) {
    var out = {};
    var keys = {};
    Object.keys(a || {}).forEach(function (k) { keys[k] = 1; });
    Object.keys(b || {}).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (k) {
      var av = a ? a[k] : undefined, bv = b ? b[k] : undefined;
      if (isObj(av) && isObj(bv)) { out[k] = mergeFields(av, bv, preferB); return; }
      if (isEmpty(av) && !isEmpty(bv)) { out[k] = bv; return; }
      if (isEmpty(bv) && !isEmpty(av)) { out[k] = av; return; }
      out[k] = preferB ? bv : av;
    });
    return out;
  }

  /* A badge earned on either machine is earned, and it was earned when it was
     first earned — so the union keeps the EARLIER timestamp. Study reached the
     same conclusion the same way. */
  function mergeBadges(a, b) {
    var out = {};
    Object.keys(a || {}).forEach(function (k) { out[k] = a[k]; });
    Object.keys(b || {}).forEach(function (k) {
      out[k] = out[k] ? (out[k] < b[k] ? out[k] : b[k]) : b[k];
    });
    return out;
  }

  /* Merge two Wellness Hub state objects. `local` wins ties: the machine you
     are sitting at is the one whose reading of its own state is current. */
  function mergeState(file, local) {
    if (!file) return local;
    if (!local) return file;

    var localNewer = ((local.meta && local.meta.updatedAt) || "") >=
                     ((file.meta && file.meta.updatedAt) || "");

    var out = {};
    Object.keys(local).forEach(function (k) { out[k] = local[k]; });

    out.version = local.version || file.version;
    out.meta = mergeFields(file.meta, local.meta, localNewer);
    out.settings = mergeFields(file.settings, local.settings, localNewer);
    out.badges = mergeBadges(file.badges, local.badges);

    /* Never merged. gamify.js:9 says `streaks` is recomputed from `logs` on
       every write — merging a cache means combining two possibly-wrong
       answers instead of computing the right one. The caller recomputes. */
    out.streaks = local.streaks;

    var fl = file.logs || {}, ll = local.logs || {};
    var logs = {};
    Object.keys(ll).forEach(function (k) { logs[k] = ll[k]; });

    logs.days = mergeDays(fl.days, ll.days);
    ID_ARRAYS.forEach(function (f) { logs[f] = mergeById(fl[f], ll[f]); });
    ISO_SCALARS.forEach(function (f) { logs[f] = newer(fl[f], ll[f]); });
    logs.profile = mergeFields(fl.profile, ll.profile, localNewer);
    LOCAL_ONLY.forEach(function (f) { logs[f] = ll[f]; });

    out.logs = logs;
    return out;
  }

  /* Merge two whole backup payloads — the shape Helth actually writes to disk
     (see storage.js `payload()` / `fullPayload()`). */
  function mergePayload(file, local) {
    if (!file) return local;
    if (!local) return file;
    return {
      app: local.app || file.app,
      formatVersion: Math.max(local.formatVersion || 0, file.formatVersion || 0),
      exportedAt: new Date().toISOString(),
      wellnessHub: mergeState(file.wellnessHub, local.wellnessHub),
      /* BASALT keeps its own key. Treated as one nested object rather than
         given a bespoke merge, because nothing in it is keyed by id and a
         field-level union is the honest generic answer. */
      ironframe: mergeFields(file.ironframe, local.ironframe, true),
      /* Photo bytes never change once written, so there is nothing to
         resolve — union by id and keep everything. */
      photoData: (function () {
        var out = {};
        Object.keys(file.photoData || {}).forEach(function (k) { out[k] = file.photoData[k]; });
        Object.keys(local.photoData || {}).forEach(function (k) { out[k] = local.photoData[k]; });
        return out;
      })()
    };
  }

  Hub.syncMerge = {
    ID_ARRAYS: ID_ARRAYS,
    ISO_SCALARS: ISO_SCALARS,
    LOCAL_ONLY: LOCAL_ONLY,
    index: index,
    stampChanges: stampChanges,
    backfillStamps: backfillStamps,
    mergeState: mergeState,
    mergePayload: mergePayload
  };
})();
