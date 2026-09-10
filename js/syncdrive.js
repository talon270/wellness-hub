/* ============================================================================
   WELLNESS HUB · GOOGLE DRIVE SYNC
   ----------------------------------------------------------------------------
   The Drive half of PLAN-drive-sync.md. Same job as vendor/sync.js — hold a
   file, merge it, keep rolling backups, refresh on focus — done with the
   Drive REST API instead of a File System Access folder, because a real API
   sync needs no daemon running on any machine. Syncthing's folder transport
   stays exactly as it is; this is a second, independent one. A machine uses
   one or the other, never both — js/storage.js enforces that, not this file.

     · AUTH        Google Identity Services token client, loaded lazily —
                    never fetched unless Drive is actually used
     · FOLDER+FILE  found-or-created once, ids kept in localStorage (not
                    secret — just where the file lives)
     · READ+WRITE   same debounce/stamp contract as vendor/sync.js
     · CONFLICT     Drive has one mutable file, not "keep both and rename".
                    Every write re-checks the file's revision first; a write
                    that lands on top of another device's write merges instead
                    of clobbering it (PLAN-drive-sync.md §A3)
     · BACKUPS      rolling, capped, same shape as the folder transport

   What is NOT here: merge(). Same reason as vendor/sync.js — only the app
   knows its own data.

   Public namespace: window.SyncDrive  —  SyncDrive.create(options) -> instance
   ========================================================================== */
"use strict";

window.SyncDrive = (function () {
  /* ======================================================================
     CONFIGURATION — fill this in once (PLAN-drive-sync.md §B5)
     ----------------------------------------------------------------------
     A Google Cloud OAuth 2.0 Client ID (Web application type), with
     http://localhost:<your port> (see tools/install-service.sh) added as an
     authorized JavaScript origin, and your own Google account added as a
     test user. Until this is set, Drive sync reports status "not-configured"
     everywhere rather than showing a broken Connect button.
     ====================================================================== */
  var DRIVE_CLIENT_ID = "368245611097-al2g2j6h45jamu9s3ko4v8tgf7eddvb5.apps.googleusercontent.com";

  var SCOPE = "https://www.googleapis.com/auth/drive.file";
  var API = "https://www.googleapis.com/drive/v3/files";
  var UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";
  var GIS_SRC = "https://accounts.google.com/gsi/client";

  var BACKUP_KEEP = 10;
  var BACKUP_MIN_INTERVAL_MS = 5 * 60 * 1000;
  var WRITE_DEBOUNCE_MS = 800;
  var WRITE_RETRY_LIMIT = 3;   // PLAN §A3: bounded read-merge-write retries on a revision race

  /* ======================================================================
     GIS LOADER — one script tag, one token client, shared by every instance
     ====================================================================== */
  var gisReady = null;
  function loadGis() {
    if (gisReady) return gisReady;
    gisReady = new Promise(function (resolve, reject) {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) { resolve(); return; }
      var s = document.createElement("script");
      s.src = GIS_SRC;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("Couldn't load Google's sign-in script — check the network.")); };
      document.head.appendChild(s);
    });
    return gisReady;
  }

  /* ======================================================================
     THE INSTANCE
     ====================================================================== */
  function create(opts) {
    var appId = opts.appId;
    var fileName = opts.fileName;
    var folderName = opts.folderName || (appId + " Sync");
    var backupPrefix = opts.backupPrefix || appId + ".backup-";
    var idsKey = (opts.dbName || appId + "-drive") + ".ids";

    var merge = opts.merge;                        // required, app-specific
    var serialize = opts.serialize || function (d) { return JSON.stringify(d, null, 2); };
    var parse = opts.parse || function (t) { return JSON.parse(t); };
    var onStatus = opts.onStatus || function () {};
    var onRemoteChange = opts.onRemoteChange || function () {};

    var backupKeep = opts.backupKeep || BACKUP_KEEP;
    var backupInterval = opts.backupMinIntervalMs != null ? opts.backupMinIntervalMs : BACKUP_MIN_INTERVAL_MS;
    var debounceMs = opts.writeDebounceMs != null ? opts.writeDebounceMs : WRITE_DEBOUNCE_MS;

    var tokenClient = null;
    var accessToken = null;
    var tokenExpiresAt = 0;

    var ids = { folderId: null, fileId: null, backupsFolderId: null };
    var lastKnownRevision = null;
    var writeTimer = null, lastBackupAt = 0;
    var lastWriteAt = null, lastReadAt = null, lastError = null;
    var status = configured() ? "no-folder" : "not-configured";   // "no-folder" reused deliberately —
                                                                    // storage.js's checks (`=== "synced"`,
                                                                    // `=== "corrupt"`) work unchanged across
                                                                    // both transports because the vocabulary
                                                                    // is shared with vendor/sync.js
    var watching = false;

    function configured() { return !!DRIVE_CLIENT_ID; }
    function setStatus(s) { if (s === status) return; status = s; try { onStatus(s); } catch (e) {} }

    function loadIds() {
      try { var raw = localStorage.getItem(idsKey); if (raw) ids = JSON.parse(raw); } catch (e) {}
    }
    function saveIds() { try { localStorage.setItem(idsKey, JSON.stringify(ids)); } catch (e) {} }
    function clearIds() { ids = { folderId: null, fileId: null, backupsFolderId: null }; try { localStorage.removeItem(idsKey); } catch (e) {} }

    /* ---- token -------------------------------------------------------- */

    function ensureTokenClient() {
      return loadGis().then(function () {
        if (tokenClient) return tokenClient;
        return new Promise(function (resolve) {
          tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: DRIVE_CLIENT_ID,
            scope: SCOPE,
            callback: function () {}   // overridden per-call below
          });
          resolve(tokenClient);
        });
      });
    }

    /* interactive=true must be called from a user gesture (Chrome enforces
       this) — the "Connect"/"Reconnect" buttons in Settings are that gesture.
       interactive=false is what boot and the focus-refresh use: silent, and
       expected to fail quietly whenever the browser has no live Google
       session, which is a normal state, not an error. */
    function ensureToken(interactive) {
      if (!configured()) return Promise.reject(new Error("Google Drive isn't set up yet."));
      if (accessToken && Date.now() < tokenExpiresAt - 30000) return Promise.resolve(accessToken);
      return ensureTokenClient().then(function (client) {
        return new Promise(function (resolve, reject) {
          client.callback = function (resp) {
            if (resp && resp.access_token) {
              accessToken = resp.access_token;
              tokenExpiresAt = Date.now() + (Number(resp.expires_in) || 3600) * 1000;
              resolve(accessToken);
            } else {
              reject(new Error((resp && resp.error) || "no token"));
            }
          };
          client.error_callback = function (err) { reject(new Error((err && err.type) || "auth failed")); };
          client.requestAccessToken({ prompt: interactive ? "consent" : "" });
        });
      });
    }

    /* ---- low-level Drive calls ----------------------------------------- */

    function api(url, options) {
      options = options || {};
      var headers = options.headers || {};
      headers["Authorization"] = "Bearer " + accessToken;
      return fetch(url, { method: options.method || "GET", headers: headers, body: options.body })
        .then(function (r) {
          if (r.status === 401) { accessToken = null; setStatus("disconnected"); throw new Error("Drive session expired"); }
          if (!r.ok) return r.text().then(function (t) { throw new Error("Drive API " + r.status + ": " + t.slice(0, 200)); });
          return r;
        });
    }

    function findChild(name, parentId, isFolder) {
      var mime = isFolder ? "application/vnd.google-apps.folder" : null;
      var q = "name='" + name.replace(/'/g, "\\'") + "' and '" + parentId + "' in parents and trashed=false" +
        (mime ? " and mimeType='" + mime + "'" : "");
      return api(API + "?q=" + encodeURIComponent(q) + "&fields=files(id,name)&spaces=drive")
        .then(function (r) { return r.json(); })
        .then(function (j) { return (j.files && j.files[0]) || null; });
    }

    function createChild(name, parentId, isFolder) {
      var body = { name: name, parents: [parentId] };
      if (isFolder) body.mimeType = "application/vnd.google-apps.folder";
      return api(API + "?fields=id", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (r) { return r.json(); })
        .then(function (j) { return j.id; });
    }

    /* PLAN §A5: search before create, so two machines connecting inside the
       same window can't each mint their own copy of the same file. */
    function findOrCreate(name, parentId, isFolder) {
      return findChild(name, parentId, isFolder).then(function (found) {
        if (found) return found.id;
        return createChild(name, parentId, isFolder);
      });
    }

    /* ---- connect -------------------------------------------------------- */

    function connect() {
      if (!configured()) return Promise.reject(new Error("Google Drive isn't set up yet — see PLAN-drive-sync.md §B5."));
      return ensureToken(true)
        .then(function () { return findOrCreate(folderName, "root", true); })
        .then(function (folderId) {
          ids.folderId = folderId;
          return Promise.all([
            findOrCreate(fileName, folderId, false),
            findOrCreate("backups", folderId, true)
          ]);
        })
        .then(function (pair) {
          ids.fileId = pair[0];
          ids.backupsFolderId = pair[1];
          saveIds();
          setStatus("synced");
          return true;
        })
        .catch(function (err) {
          lastError = String(err && err.message || err);
          throw err;
        });
    }

    function forget() {
      var tok = accessToken;
      accessToken = null; tokenExpiresAt = 0; lastKnownRevision = null;
      clearIds();
      setStatus(configured() ? "no-folder" : "not-configured");
      try {
        if (tok && window.google && google.accounts && google.accounts.oauth2) google.accounts.oauth2.revoke(tok, function () {});
      } catch (e) {}
      return Promise.resolve(true);
    }

    /* Silent first (covers the common case: boot, focus-refresh), a real
       prompt only when called as the explicit "Reconnect" gesture. */
    function reconnect() {
      loadIds();
      if (!ids.fileId) { setStatus(configured() ? "no-folder" : "not-configured"); return Promise.resolve(status); }
      return ensureToken(false)
        .then(function () { setStatus("synced"); return "synced"; })
        .catch(function () {
          return ensureToken(true)
            .then(function () { setStatus("synced"); return "synced"; })
            .catch(function () { setStatus("disconnected"); return "disconnected"; });
        });
    }

    /* ---- read / write ---------------------------------------------------- */

    function metaRevision() {
      return api(API + "/" + ids.fileId + "?fields=headRevisionId")
        .then(function (r) { return r.json(); })
        .then(function (j) { return j.headRevisionId || null; });
    }

    function readFile() {
      if (!ids.fileId) return Promise.resolve(null);
      return ensureToken(false).then(function () {
        return metaRevision().then(function (rev) {
          lastKnownRevision = rev;
          return api(API + "/" + ids.fileId + "?alt=media");
        });
      }).then(function (r) { return r.text(); })
        .then(function (text) {
          lastReadAt = new Date().toISOString();
          if (!text || !text.trim()) return null;
          return parse(text);
        })
        .catch(function (err) {
          /* A parse failure must not be laundered into "no data" — see
             vendor/sync.js's readFile, same reasoning. */
          lastError = String((err && err.message) || err);
          throw err;
        });
    }

    function stamp(data) {
      var out = {};
      Object.keys(data || {}).forEach(function (k) { out[k] = data[k]; });
      out.deviceId = window.Sync.deviceId();   // one device id, shared with the folder transport
      out.writtenAt = new Date().toISOString();
      return out;
    }

    function putContent(stamped) {
      return api(UPLOAD_API + "/" + ids.fileId + "?uploadType=media&fields=headRevisionId", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: serialize(stamped)
      }).then(function (r) { return r.json(); })
        .then(function (j) { lastKnownRevision = j.headRevisionId || null; return true; });
    }

    /* PLAN §A3: Drive has one mutable file, so "read → merge → write" can
       land on top of a write from another machine that happened in the gap.
       Re-check the revision immediately before writing; if it moved, merge
       the newer remote copy in and retry, bounded, rather than overwrite it. */
    function writeNow(data, attempt) {
      attempt = attempt || 0;
      if (!ids.fileId) { setStatus(configured() ? "no-folder" : "not-configured"); return Promise.resolve(false); }
      return ensureToken(false).then(function () {
        return metaRevision();
      }).then(function (rev) {
        if (lastKnownRevision && rev && rev !== lastKnownRevision) {
          if (attempt >= WRITE_RETRY_LIMIT) {
            lastError = "another device is writing at the same time";
            return false;
          }
          return readFile().then(function (remote) {
            var merged = remote ? merge(remote, data) : data;
            try { onRemoteChange(merged, { from: remote && remote.deviceId, at: remote && remote.writtenAt }); } catch (e) {}
            return writeNow(merged, attempt + 1);
          });
        }
        var stamped = stamp(data);
        return putContent(stamped).then(function () {
          lastWriteAt = new Date().toISOString();
          lastError = null;
          setStatus("synced");
          return writeBackup(stamped).then(function () { return true; });
        });
      }).catch(function (err) {
        lastError = String((err && err.message) || err);
        setStatus("disconnected");
        return false;
      });
    }

    function save(data) {
      if (writeTimer) clearTimeout(writeTimer);
      writeTimer = setTimeout(function () { writeTimer = null; writeNow(data); }, debounceMs);
    }
    function flush(data) {
      if (writeTimer) { clearTimeout(writeTimer); writeTimer = null; }
      return writeNow(data);
    }

    /* ---- backups (PLAN §A4 — same shape as vendor/sync.js) --------------- */

    function writeBackup(data) {
      if (!ids.backupsFolderId) return Promise.resolve(false);
      var now = Date.now();
      if (lastBackupAt && now - lastBackupAt < backupInterval) return Promise.resolve(false);
      lastBackupAt = now;
      var name = backupPrefix + new Date(now).toISOString().replace(/[:.]/g, "-") + ".json";
      return createChild(name, ids.backupsFolderId, false)
        .then(function (fileId) {
          return api(UPLOAD_API + "/" + fileId + "?uploadType=media", {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: serialize(data)
          });
        })
        .then(function () { return prune(); })
        .then(function () { return true; })
        .catch(function (err) { console.warn("[syncdrive:" + appId + "] backup failed", err); return false; });
    }

    function prune() {
      return api(API + "?q=" + encodeURIComponent("'" + ids.backupsFolderId + "' in parents and trashed=false") +
        "&fields=files(id,name)&orderBy=name&pageSize=1000")
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var files = j.files || [];
          var excess = files.length - backupKeep;
          if (excess <= 0) return 0;
          var toDelete = files.slice(0, excess);
          return Promise.all(toDelete.map(function (f) {
            return api(API + "/" + f.id, { method: "DELETE" }).catch(function () {});
          })).then(function () { return excess; });
        });
    }

    /* ---- refresh --------------------------------------------------------- */

    function refresh(getLocal, apply) {
      if (!ids.fileId) return Promise.resolve(false);
      return readFile().then(function (fileData) {
        if (!fileData) return false;
        var local = getLocal();
        var merged = merge(fileData, local);
        var changed = JSON.stringify(merged) !== JSON.stringify(local);
        if (changed) {
          apply(merged);
          try { onRemoteChange(merged, { from: fileData.deviceId || null, at: fileData.writtenAt || null }); } catch (e) {}
        }
        return changed;
      }).catch(function (err) {
        lastError = String((err && err.message) || err);
        return false;
      });
    }

    function watch(getLocal, apply, isBusy) {
      if (watching) return;
      watching = true;
      var run = function () {
        if (document.visibilityState !== "visible") return;
        if (isBusy && isBusy()) return;
        if (ids.fileId) refresh(getLocal, apply);
      };
      document.addEventListener("visibilitychange", run);
      window.addEventListener("focus", run);
    }

    /* ---- init -------------------------------------------------------------- */

    function init(getLocal) {
      loadIds();
      if (!configured()) return Promise.resolve({ status: "not-configured", data: null, merged: false });
      if (!ids.fileId) return Promise.resolve({ status: "no-folder", data: null, merged: false });
      return ensureToken(false).then(function () {
        setStatus("synced");
        return readFile().then(function (fileData) {
          if (!fileData) return { status: "synced", data: null, merged: false };
          var local = getLocal ? getLocal() : null;
          var merged = local ? merge(fileData, local) : fileData;
          return { status: "synced", data: merged, merged: true, from: fileData.deviceId || null };
        }).catch(function (err) {
          lastError = String((err && err.message) || err);
          return { status: "corrupt", data: null, merged: false, error: lastError };
        });
      }).catch(function () {
        setStatus("disconnected");
        return { status: "disconnected", data: null, merged: false };
      });
    }

    return {
      appId: appId,
      deviceId: window.Sync.deviceId,
      init: init,
      connect: connect,
      forget: forget,
      reconnect: reconnect,
      readFile: readFile,
      save: save,
      flush: flush,
      writeNow: writeNow,
      refresh: refresh,
      watch: watch,
      hasFile: function () { loadIds(); return !!ids.fileId; },
      configured: configured,
      status: function () { return status; },
      info: function () {
        return {
          appId: appId, fileName: fileName, deviceId: window.Sync.deviceId(),
          status: status, lastWriteAt: lastWriteAt, lastReadAt: lastReadAt,
          lastError: lastError, hasFile: !!ids.fileId
        };
      }
    };
  }

  return { create: create, configured: function () { return !!DRIVE_CLIENT_ID; } };
})();
