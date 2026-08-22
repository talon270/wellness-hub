/* ============================================================================
   WELLNESS HUB · DURABLE STORAGE
   ----------------------------------------------------------------------------
   localStorage is not a safe place to keep a year of your health history. By
   default the browser is allowed to evict it whenever it feels like reclaiming
   space, and "Clear browsing data" wipes it without ceremony. This module
   closes both gaps:

     1. PERSISTENT STORAGE — asks the browser to mark this origin's data as
        persistent, which exempts it from automatic eviction under pressure.
        One call, permanent effect, no downside.

     2. LINKED BACKUP FILE — with the File System Access API you can pick a real
        file on disk once. From then on the app rewrites it automatically as you
        log things, debounced. The handle survives restarts in IndexedDB, so
        this keeps working with no further prompts.

     3. RESTORE — if storage ever does get cleared, the app notices it's empty,
        finds the linked file still there, and offers to restore from it.

     4. FALLBACK — browsers without the File System Access API (Firefox, Safari)
        get periodic reminders and a one-click download instead. Honest about
        being second best, rather than pretending nothing is different.

   Public: Hub.storage
   ========================================================================== */
(function () {
  "use strict";
  var Hub = window.Hub;

  var IRONFRAME_KEY = "ironframe.state.v1";
  var DB_NAME = "wellnessHubFS";
  var STORE = "handles";
  var PHOTO_STORE = "photos";
  var HANDLE_KEY = "backupFile";
  var DB_VERSION = 2;

  /* Photos are downscaled hard before they're stored. A mole photo only has to
     be good enough to compare against the same mole a month later; a 12MP
     original would fill the origin's quota in a fortnight. */
  var PHOTO_MAX_PX = 1024;
  var PHOTO_QUALITY = 0.72;

  /* Writing on every keystroke would thrash the disk; this is long enough to
     coalesce a burst of logging, short enough that you can't lose much. */
  var WRITE_DEBOUNCE_MS = 4000;

  var writeTimer = null;
  var handle = null;          // FileSystemFileHandle, once linked
  var lastWrite = null;       // ISO of the last successful write
  var lastError = null;

  /* ======================================================================
     1. PERSISTENT STORAGE
     ====================================================================== */
  function canPersist() {
    return !!(navigator.storage && navigator.storage.persist);
  }

  function isPersisted() {
    if (!navigator.storage || !navigator.storage.persisted) return Promise.resolve(false);
    return navigator.storage.persisted().catch(function () { return false; });
  }

  /* Chrome grants this silently when the site looks "installed or engaged";
     Firefox shows a prompt. Either way it's request-and-see. */
  function requestPersist() {
    if (!canPersist()) return Promise.resolve(false);
    return navigator.storage.persist().catch(function () { return false; });
  }

  function estimate() {
    if (!navigator.storage || !navigator.storage.estimate) return Promise.resolve(null);
    return navigator.storage.estimate().catch(function () { return null; });
  }

  /* ======================================================================
     2. HANDLE PERSISTENCE (IndexedDB)
     ----------------------------------------------------------------------
     A FileSystemFileHandle can't go in localStorage — it's a structured object
     that only IndexedDB can hold onto across sessions.
     ====================================================================== */
  function openDB() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error("no indexedDB")); return; }
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
        if (!req.result.objectStoreNames.contains(PHOTO_STORE)) req.result.createObjectStore(PHOTO_STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function idbSet(key, value, store) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(store || STORE, "readwrite");
        tx.objectStore(store || STORE).put(value, key);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function idbGet(key, store) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(store || STORE, "readonly");
        var req = tx.objectStore(store || STORE).get(key);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function idbDel(key, store) {
    return openDB().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(store || STORE, "readwrite");
        tx.objectStore(store || STORE).delete(key);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { resolve(false); };
      });
    });
  }

  /* ======================================================================
     2b. PHOTOS
     ----------------------------------------------------------------------
     A month-old photo of a mole is the only thing that makes an ABCDE
     self-exam mean anything, and the same is true of a healing niggle. The
     bytes live in IndexedDB (localStorage would be full after four of them);
     only the metadata goes in the main state object.
     ====================================================================== */

  /* Downscale through a canvas and re-encode as JPEG. Returns a data URL,
     which is the one representation that survives a JSON backup unchanged. */
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var scale = Math.min(1, PHOTO_MAX_PX / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * scale));
          var h = Math.max(1, Math.round(img.height * scale));
          var c = document.createElement("canvas");
          c.width = w; c.height = h;
          var ctx = c.getContext("2d");
          /* A white ground: JPEG has no alpha, and a transparent PNG would
             otherwise come out with a black background. */
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);
          resolve({ dataUrl: c.toDataURL("image/jpeg", PHOTO_QUALITY), w: w, h: h });
        } catch (e) { URL.revokeObjectURL(url); reject(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("not an image")); };
      img.src = url;
    });
  }

  /* Store a photo and return its metadata record (already pushed to state). */
  function addPhoto(file, meta) {
    meta = meta || {};
    if (!file || !/^image\//.test(file.type)) {
      Hub.toast("That isn't an image file.", "warn");
      return Promise.resolve(null);
    }
    return shrink(file).then(function (out) {
      var rec = {
        id: "ph" + Date.now() + Math.random().toString(36).slice(2, 6),
        date: meta.date || Hub.viewDate(),
        kind: meta.kind || "skin",         // "skin" | "injury"
        subject: meta.subject || "",       // which mole / which niggle
        note: meta.note || "",
        w: out.w, h: out.h,
        bytes: Math.round(out.dataUrl.length * 0.75)
      };
      return idbSet(rec.id, out.dataUrl, PHOTO_STORE).then(function () {
        Hub.state.logs.photos.push(rec);
        Hub.commit();
        return rec;
      });
    }).catch(function (err) {
      Hub.toast("Couldn't read that image: " + (err && err.message || err), "danger", 5000);
      return null;
    });
  }

  function getPhoto(id) { return idbGet(id, PHOTO_STORE).catch(function () { return null; }); }

  function deletePhoto(id) {
    return idbDel(id, PHOTO_STORE).then(function () {
      Hub.state.logs.photos = (Hub.state.logs.photos || []).filter(function (p) { return p.id !== id; });
      /* Drop the reference from any niggle that pointed at it. */
      (Hub.state.logs.injuries || []).forEach(function (n) {
        if (Array.isArray(n.photos)) n.photos = n.photos.filter(function (p) { return p !== id; });
      });
      Hub.commit();
      return true;
    });
  }

  /* Every stored image, as { id: dataUrl } — used by the backup payload. */
  function allPhotoData() {
    var ids = (Hub.state.logs.photos || []).map(function (p) { return p.id; });
    if (!ids.length) return Promise.resolve({});
    return Promise.all(ids.map(function (id) {
      return getPhoto(id).then(function (d) { return [id, d]; });
    })).then(function (pairs) {
      var out = {};
      pairs.forEach(function (p) { if (p[1]) out[p[0]] = p[1]; });
      return out;
    }).catch(function () { return {}; });
  }

  /* Put photo bytes back after a restore. */
  function restorePhotoData(map) {
    var ids = Object.keys(map || {});
    if (!ids.length) return Promise.resolve(0);
    return Promise.all(ids.map(function (id) {
      return idbSet(id, map[id], PHOTO_STORE).catch(function () { return false; });
    })).then(function () { return ids.length; });
  }

  /* ======================================================================
     3. THE BACKUP PAYLOAD
     ====================================================================== */
  function payload() {
    var iron = null;
    try {
      var raw = localStorage.getItem(IRONFRAME_KEY);
      iron = raw ? JSON.parse(raw) : null;
    } catch (e) {}
    return {
      app: "wellness-hub",
      formatVersion: 2,
      exportedAt: new Date().toISOString(),
      wellnessHub: Hub.state,
      ironframe: iron
    };
  }

  /* The same payload with the image bytes folded in. Async because the photos
     live in IndexedDB — a backup that silently omitted them would be the
     nastiest kind of incomplete. */
  function fullPayload() {
    var base = payload();
    return allPhotoData().then(function (photos) {
      base.photoData = photos;
      return base;
    }).catch(function () {
      base.photoData = {};
      return base;
    });
  }

  function fsSupported() {
    return typeof window.showSaveFilePicker === "function";
  }

  /* ======================================================================
     4. LINKING A FILE
     ====================================================================== */
  function link() {
    if (!fsSupported()) return Promise.resolve(false);
    return window.showSaveFilePicker({
      suggestedName: "wellness-hub-backup.json",
      types: [{ description: "Wellness Hub backup", accept: { "application/json": [".json"] } }]
    }).then(function (h) {
      handle = h;
      return idbSet(HANDLE_KEY, h);
    }).then(function () {
      return writeNow();
    }).then(function () {
      Hub.toast("Backup file linked. It'll keep itself up to date from now on.", "success", 5000);
      Hub.refresh();
      return true;
    }).catch(function (err) {
      /* AbortError just means they closed the picker. */
      if (err && err.name === "AbortError") return false;
      lastError = String(err && err.message || err);
      Hub.toast("Couldn't link that file: " + lastError, "danger", 6000);
      return false;
    });
  }

  function unlink() {
    handle = null;
    lastWrite = null;
    return idbDel(HANDLE_KEY).then(function () {
      Hub.toast("Backup file unlinked. Nothing was deleted.", "info", 4000);
      Hub.refresh();
    });
  }

  /* Restore the handle at boot. Permission may need re-granting after a
     browser restart — we check without prompting, and only prompt on demand. */
  function restoreHandle() {
    if (!fsSupported()) return Promise.resolve(null);
    return idbGet(HANDLE_KEY).then(function (h) {
      if (!h) return null;
      handle = h;
      return h;
    }).catch(function () { return null; });
  }

  function permission(mode) {
    if (!handle || !handle.queryPermission) return Promise.resolve("granted");
    return handle.queryPermission({ mode: mode || "readwrite" });
  }

  function ensurePermission(mode) {
    if (!handle) return Promise.resolve(false);
    return permission(mode).then(function (state) {
      if (state === "granted") return true;
      if (!handle.requestPermission) return false;
      /* Must be called from a user gesture, which is why the UI has an
         explicit "reconnect" button rather than trying this on a timer. */
      return handle.requestPermission({ mode: mode || "readwrite" })
        .then(function (s) { return s === "granted"; });
    }).catch(function () { return false; });
  }

  /* ======================================================================
     5. WRITING
     ====================================================================== */
  function writeNow() {
    if (!handle) return Promise.resolve(false);
    return permission("readwrite").then(function (state) {
      if (state !== "granted") {
        /* Silent failure here is correct: we can't prompt without a gesture,
           and the Settings card surfaces the reconnect button. */
        lastError = "permission-needed";
        return false;
      }
      return fullPayload()
        .then(function (data) {
          return handle.createWritable().then(function (w) {
            return w.write(JSON.stringify(data, null, 2)).then(function () { return w.close(); });
          });
        })
        .then(function () {
          lastWrite = new Date().toISOString();
          lastError = null;
          try { Hub.uiSet("lastFileBackup", lastWrite); } catch (e) {}
          return true;
        });
    }).catch(function (err) {
      lastError = String(err && err.message || err);
      return false;
    });
  }

  /* Called by Hub.commit on every change. Debounced so a burst of taps is one
     write, and quiet when nothing is linked. */
  function scheduleWrite() {
    if (!handle) return;
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(function () {
      writeTimer = null;
      writeNow();
    }, WRITE_DEBOUNCE_MS);
  }

  /* Flush before the page goes away, so the last few taps aren't lost. */
  function flush() {
    if (writeTimer) { clearTimeout(writeTimer); writeTimer = null; }
    return writeNow();
  }

  /* ======================================================================
     6. RESTORING
     ====================================================================== */
  function readLinkedFile() {
    if (!handle) return Promise.resolve(null);
    return ensurePermission("read").then(function (ok) {
      if (!ok) return null;
      return handle.getFile().then(function (f) { return f.text(); }).then(function (text) {
        try { return JSON.parse(text); } catch (e) { return null; }
      });
    }).catch(function () { return null; });
  }

  function restoreFromFile() {
    return readLinkedFile().then(function (data) {
      if (!data) {
        Hub.toast("Couldn't read the linked file.", "danger");
        return false;
      }
      var hub = data.wellnessHub || (data.version && data.logs ? data : null);
      if (!hub) { Hub.toast("That file has no recognisable data.", "danger"); return false; }

      Hub.confirm({
        title: "Restore from the linked file?",
        body: "This replaces everything currently in the browser with the contents of your backup file" +
              (data.exportedAt ? ", last written " + new Date(data.exportedAt).toLocaleString() : "") + ".",
        confirmLabel: "Restore",
        variant: "primary",
        onConfirm: function () {
          Hub.setState(hub);
          if (data.ironframe) {
            try { localStorage.setItem(IRONFRAME_KEY, JSON.stringify(data.ironframe)); } catch (e) {}
          }
          Hub.commit({ render: false });
          restorePhotoData(data.photoData).then(function () {
            Hub.toast("Restored — reloading…", "success");
            setTimeout(function () { location.reload(); }, 900);
          });
        }
      });
      return true;
    });
  }

  /* If the app looks brand new but a backup file is still linked, that's almost
     certainly cleared site data rather than a genuine first run. Offer the
     rescue instead of silently starting from zero. */
  function offerRescueIfEmpty() {
    if (!handle) return;
    var looksEmpty = Hub.dayKeys().length === 0 &&
                     (Hub.state.logs.sleep || []).length === 0 &&
                     Object.keys(Hub.state.badges).length === 0;
    if (!looksEmpty) return;

    readLinkedFile().then(function (data) {
      var hub = data && (data.wellnessHub || data);
      if (!hub || !hub.logs) return;
      var days = Object.keys(hub.logs.days || {}).length;
      if (!days) return;

      Hub.modal({
        title: "Your history is still on disk",
        body: "<p>This browser has no data, but your linked backup file still holds <strong>" + days +
              " " + Hub.plural(days, "day") + "</strong> of history" +
              (data.exportedAt ? ", last written " + new Date(data.exportedAt).toLocaleString() : "") + ".</p>" +
              "<p>That usually means site data was cleared. Restore it?</p>",
        actions: [
          { label: "Start fresh", variant: "ghost" },
          { label: "Restore my data", variant: "primary", onClick: restoreFromFile }
        ]
      });
    });
  }

  /* ======================================================================
     7. FALLBACK — plain download for browsers without the FS API
     ====================================================================== */
  function saveBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function downloadBackup() {
    return fullPayload().then(function (data) {
      saveBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
               "wellness-hub-backup-" + Hub.today() + ".json");
      try { Hub.uiSet("lastDownloadBackup", new Date().toISOString()); } catch (e) {}
      var n = Object.keys(data.photoData || {}).length;
      Hub.toast("Backup downloaded" + (n ? " (including " + n + " " + Hub.plural(n, "photo") + ")" : "") + ".",
        "success", 4000);
      return true;
    });
  }

  /* ======================================================================
     7b. CSV EXPORT
     ----------------------------------------------------------------------
     JSON is the honest backup format, but nobody opens JSON. This is the one
     you can hand to a spreadsheet, or to a clinician who wants the numbers.
     ====================================================================== */
  function csvCell(v) {
    if (v == null) return "";
    var s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function csvRows(rows) {
    return rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n") + "\r\n";
  }

  /* One wide row per day: every daily habit, side by side. */
  function daysCsv() {
    var U = Hub.units;
    var customs = (Hub.state.logs.customHabits || []);
    var head = ["date", "water_cups", "eye_exercises", "eye_breaks", "brush_am", "brush_pm",
      "floss", "posture_checks", "stretches", "mobility", "rest_day",
      "stand_breaks", "sat_minutes", "longest_sit_minutes", "movement_minutes",
      "mindful_sessions", "mindful_minutes", "mood", "energy", "stress",
      "sleep_hours", "sleep_quality", "naps", "caffeine_mg", "alcohol_units",
      "loud_minutes", "soreness_total", "skin_am", "skin_pm", "spf",
      "meds_taken", "nutrition_ticks"]
      .concat(customs.map(function (h) { return "habit_" + h.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase(); }));

    var sleepIdx = {};
    (Hub.state.logs.sleep || []).forEach(function (e) {
      if (e.kind === "nap") { sleepIdx[e.date] = sleepIdx[e.date] || {}; sleepIdx[e.date].naps = (sleepIdx[e.date].naps || 0) + 1; }
      else { sleepIdx[e.date] = Object.assign(sleepIdx[e.date] || {}, { hours: e.hours, quality: e.quality }); }
    });

    var rows = [head];
    Hub.dayKeys().forEach(function (k) {
      var d = Hub.state.logs.days[k];
      var s = sleepIdx[k] || {};
      var sore = Object.keys(d.soreness || {}).reduce(function (n, p) { return n + (Number(d.soreness[p]) || 0); }, 0);
      var mindMin = Math.round((d.mindful || []).reduce(function (n, m) { return n + (Number(m.sec) || 0); }, 0) / 60);
      var body = d.body || {};
      rows.push([
        k, d.water || 0, d.eye || 0, d.eye2020 || 0, d.brushAM ? 1 : 0, d.brushPM ? 1 : 0,
        d.floss ? 1 : 0, d.posture || 0, d.stretch || 0, d.mobility || 0, d.restDay ? 1 : 0,
        d.stand || 0, Math.round(d.sitMin || 0), Math.round(d.sitLongest || 0),
        Math.round((d.moveMin || 0) * 10) / 10,
        (d.mindful || []).length, mindMin,
        (d.mood && d.mood.mood) || "", (d.mood && d.mood.energy) || "", (d.mood && d.mood.stress) || "",
        s.hours == null ? "" : Math.round(s.hours * 100) / 100, s.quality || "", s.naps || 0,
        d.caffeineMg || 0, d.alcoholUnits || 0,
        d.loudMinutes || 0, sore || "", body.skinAM ? 1 : 0, body.skinPM ? 1 : 0, body.spf ? 1 : 0,
        Object.keys(d.meds || {}).length, Object.keys(d.nutrition || {}).length
      ].concat(customs.map(function (h) { return (d.custom || {})[h.id] ? 1 : 0; })));
    });
    return { name: "days", csv: csvRows(rows), count: rows.length - 1 };
  }

  function vitalsCsv() {
    var U = Hub.units;
    var rows = [["date", "time", "systolic_mmHg", "diastolic_mmHg", "resting_hr_bpm",
                 "weight_" + U.massLabel(), "waist_" + U.lenLabel(), "temp_" + U.tempLabel(),
                 "spo2_pct", "note"]];
    (Hub.state.logs.vitals || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; })
      .forEach(function (v) {
        rows.push([v.date, v.time || "", v.sys || "", v.dia || "", v.hr || "",
          U.massOut(v.weightKg) == null ? "" : U.massOut(v.weightKg),
          U.lenOut(v.waistCm) == null ? "" : U.lenOut(v.waistCm),
          U.tempOut(v.tempC) == null ? "" : U.tempOut(v.tempC),
          v.spo2 || "", v.note || ""]);
      });
    return { name: "vitals", csv: csvRows(rows), count: rows.length - 1 };
  }

  function sleepCsv() {
    var rows = [["date", "kind", "bed", "wake", "hours", "quality", "note"]];
    (Hub.state.logs.sleep || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; })
      .forEach(function (e) {
        rows.push([e.date, e.kind || "night", e.bed || "", e.wake || "",
          Math.round((Number(e.hours) || 0) * 100) / 100, e.quality || "", e.note || ""]);
      });
    return { name: "sleep", csv: csvRows(rows), count: rows.length - 1 };
  }

  function labsCsv() {
    var rows = [["date", "panel", "marker", "value", "unit", "reference", "note"]];
    (Hub.state.logs.labs || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; })
      .forEach(function (l) {
        (l.values || []).forEach(function (v) {
          rows.push([l.date, l.panel || "", v.label || v.key, v.value, v.unit || "", v.ref || "", l.note || ""]);
        });
      });
    return { name: "labs", csv: csvRows(rows), count: rows.length - 1 };
  }

  /* One row per period, with the derived cycle length and the flow and symptoms
     logged inside it. Exported separately from `days` because it's the sheet
     you'd actually hand to a clinician. */
  function cyclesCsv() {
    var rows = [["start", "end", "bleed_days", "cycle_length_days", "flows", "symptoms"]];
    var list = (Hub.state.logs.cycles || []).slice().sort(function (a, b) {
      return a.startISO < b.startISO ? -1 : 1;
    });
    list.forEach(function (c, i) {
      var next = list[i + 1];
      var bleed = c.endISO ? Hub.daysBetween(c.startISO, c.endISO) + 1 : "";
      var len = next ? Hub.daysBetween(c.startISO, next.startISO) : "";
      /* Walk the days this cycle covers and gather what was logged on them. */
      var span = next ? Hub.daysBetween(c.startISO, next.startISO) : 40;
      var flows = [], syms = {};
      for (var n = 0; n < span; n++) {
        var day = Hub.day(Hub.shiftDay(c.startISO, n)).cycle || {};
        if (day.flow) flows.push(day.flow);
        Object.keys(day.symptoms || {}).forEach(function (s) { syms[s] = true; });
      }
      rows.push([c.startISO, c.endISO || "", bleed, len, flows.join(" "), Object.keys(syms).join(" ")]);
    });
    return { name: "cycles", csv: csvRows(rows), count: rows.length - 1 };
  }

  var CSV_SETS = { days: daysCsv, vitals: vitalsCsv, sleep: sleepCsv, labs: labsCsv, cycles: cyclesCsv };

  function downloadCsv(which) {
    var build = CSV_SETS[which];
    if (!build) return false;
    var out = build();
    if (!out.count) { Hub.toast("Nothing to export in that set yet.", "warn"); return false; }
    saveBlob(new Blob(["﻿" + out.csv], { type: "text/csv;charset=utf-8" }),
             "wellness-hub-" + out.name + "-" + Hub.today() + ".csv");
    Hub.toast("Exported " + out.count + " " + Hub.plural(out.count, "row") + ".", "success");
    return true;
  }

  /* Nag, gently, if it's been a while and nothing is linked. */
  function checkBackupAge() {
    if (handle) return;                       // linked file keeps itself current
    var last = Hub.uiGet("lastDownloadBackup", null);
    var days = last ? Hub.daysBetween(Hub.ymd(new Date(last)), Hub.today()) : null;
    if (Hub.dayKeys().length < 7) return;     // nothing worth losing yet
    if (days !== null && days < 14) return;

    Hub.toast(
      days === null
        ? "You've never backed up. One click in Settings protects all of this."
        : "Last backup was " + days + " days ago.",
      "warn", 8000
    );
  }

  /* ======================================================================
     8. STATUS + BOOT
     ====================================================================== */
  function status() {
    return {
      fsSupported: fsSupported(),
      linked: !!handle,
      fileName: handle ? handle.name : null,
      lastWrite: lastWrite || Hub.uiGet("lastFileBackup", null),
      lastDownload: Hub.uiGet("lastDownloadBackup", null),
      lastError: lastError,
      canPersist: canPersist()
    };
  }

  function init() {
    /* Ask for persistent storage once. Silent if granted, silent if refused —
       the Settings card reports the real state either way. */
    isPersisted().then(function (already) {
      if (already) return true;
      return requestPersist();
    });

    restoreHandle().then(function () {
      if (!handle) { checkBackupAge(); return; }
      offerRescueIfEmpty();
    });

    /* Don't lose the last few taps when the tab closes or is backgrounded.
       visibilitychange is the reliable one on mobile; pagehide covers the rest. */
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") flush();
    });
    window.addEventListener("pagehide", flush);
  }

  Hub.storage = {
    init: init,
    status: status,
    payload: payload,
    fullPayload: fullPayload,

    /* photos */
    addPhoto: addPhoto,
    getPhoto: getPhoto,
    deletePhoto: deletePhoto,
    restorePhotoData: restorePhotoData,

    /* csv */
    downloadCsv: downloadCsv,
    csvSets: Object.keys(CSV_SETS),
    saveBlob: saveBlob,

    estimate: estimate,
    isPersisted: isPersisted,
    requestPersist: requestPersist,
    link: link,
    unlink: unlink,
    writeNow: writeNow,
    scheduleWrite: scheduleWrite,
    flush: flush,
    ensurePermission: ensurePermission,
    restoreFromFile: restoreFromFile,
    downloadBackup: downloadBackup,
    fsSupported: fsSupported
  };
})();
