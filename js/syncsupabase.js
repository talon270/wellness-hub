/* ============================================================================
   WELLNESS HUB · SUPABASE SYNC
   ----------------------------------------------------------------------------
   The third sync transport, alongside vendor/sync.js (linked folder) and
   js/syncdrive.js (Google Drive). Same job, same contract — hold the state,
   merge it, keep rolling backups, refresh on focus — against a single Postgres
   row instead of a file. A machine uses one transport, never several;
   js/storage.js enforces that, not this file.

     · AUTH        Supabase email + password → JWT, refreshed silently.
                    Signed-in IS "linked" here — there is no folder to pick.
     · ROW         one row per user in public.wellness_state, found-or-created.
                    RLS (user_id = auth.uid()) is the whole security model:
                    the publishable key below ships in the binary and is public
                    by design — RLS is what stops it reading anyone else's row.
     · READ+WRITE   same debounce/stamp contract as the other two transports.
     · CONFLICT     one mutable row, like Drive's one mutable file. Every write
                    re-reads the row's rev; a write landing on top of another
                    device merges instead of clobbering (PLAN §A5), bounded.
     · BACKUPS      rolling, capped, in public.wellness_backups — the guard
                    against a bad merge overwriting the only copy of your history.

   What is NOT here: merge(). Same reason as the other two — only the app knows
   that a running timer must not sync, or that "last done" is a maximum.

   Public namespace: window.SyncSupabase — SyncSupabase.create(options) -> instance
   ========================================================================== */
"use strict";

window.SyncSupabase = (function () {
  /* ======================================================================
     CONFIGURATION — the two public project values (PLAN §B2/§B4)
     ----------------------------------------------------------------------
     Both are safe to ship: the URL is not a secret, and the publishable key
     is public by design — it can do nothing a signed-out stranger cannot,
     because every table has RLS scoped to auth.uid(). The service_role /
     secret key must NEVER appear here; it bypasses RLS.
     ====================================================================== */
  var SUPABASE_URL = "https://ppctfwcmconpbdylgqpq.supabase.co";
  var SUPABASE_KEY = "sb_publishable_ebSQQ0YyIWFrCDTuni-Ozg_huIHGp6p";

  var REST = SUPABASE_URL + "/rest/v1";
  var AUTH = SUPABASE_URL + "/auth/v1";
  var STATE_TABLE = "wellness_state";
  var BACKUP_TABLE = "wellness_backups";

  var BACKUP_KEEP = 10;
  var BACKUP_MIN_INTERVAL_MS = 5 * 60 * 1000;
  var WRITE_DEBOUNCE_MS = 800;
  var WRITE_RETRY_LIMIT = 3;      // bounded read-merge-write retries on a rev race
  var TOKEN_SKEW_MS = 60 * 1000;  // refresh a minute before expiry, never on the edge

  function configured() { return !!SUPABASE_URL && !!SUPABASE_KEY; }

  /* ======================================================================
     THE INSTANCE
     ====================================================================== */
  function create(opts) {
    var appId = opts.appId;
    var authKey = (opts.dbName || appId + "-supabase") + ".auth";

    var merge = opts.merge;                        // required, app-specific
    var serialize = opts.serialize || function (d) { return JSON.stringify(d); };
    var onStatus = opts.onStatus || function () {};
    var onRemoteChange = opts.onRemoteChange || function () {};

    var backupKeep = opts.backupKeep || BACKUP_KEEP;
    var backupInterval = opts.backupMinIntervalMs != null ? opts.backupMinIntervalMs : BACKUP_MIN_INTERVAL_MS;
    var debounceMs = opts.writeDebounceMs != null ? opts.writeDebounceMs : WRITE_DEBOUNCE_MS;

    var auth = null;                 // { access_token, refresh_token, expires_at, user_id, email }
    var refreshInFlight = null;
    var writeTimer = null;
    var lastBackupAt = 0;
    var lastWriteAt = null;
    var lastReadAt = null;
    var lastError = null;
    var lastKnownRev = null;
    var watching = false;
    var status = configured() ? "no-folder" : "not-configured";  // "no-folder" == not signed in,
                                                                  // reused so storage.js reads it uniformly

    function setStatus(s) { if (s === status) return; status = s; try { onStatus(s); } catch (e) {} }

    /* ---- auth token store ------------------------------------------------ */

    function loadAuth() {
      if (auth) return auth;
      try { auth = JSON.parse(localStorage.getItem(authKey) || "null"); } catch (e) { auth = null; }
      return auth;
    }
    function saveAuth(a) { auth = a; try { localStorage.setItem(authKey, JSON.stringify(a)); } catch (e) {} }
    function clearAuth() { auth = null; try { localStorage.removeItem(authKey); } catch (e) {} }
    function hasAuth() { var a = loadAuth(); return !!(a && a.refresh_token); }

    function storeSession(j) {
      saveAuth({
        access_token: j.access_token,
        refresh_token: j.refresh_token,
        expires_at: Date.now() + (j.expires_in || 3600) * 1000,
        user_id: j.user && j.user.id,
        email: j.user && j.user.email
      });
      return auth;
    }

    /* Password grant. The one place a human types credentials; everything
       after rides the refresh token. */
    function signIn(email, password) {
      return fetch(AUTH + "/token?grant_type=password", {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
      }).then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error((j && (j.msg || j.error_description || j.error)) || ("sign-in failed (" + r.status + ")"));
          return j;
        });
      }).then(function (j) { storeSession(j); return true; });
    }

    function refreshToken() {
      if (refreshInFlight) return refreshInFlight;
      var a = loadAuth();
      if (!a || !a.refresh_token) return Promise.reject(new Error("not signed in"));
      refreshInFlight = fetch(AUTH + "/token?grant_type=refresh_token", {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: a.refresh_token })
      }).then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error((j && (j.msg || j.error)) || "session expired");
          return j;
        });
      }).then(function (j) { storeSession(j); return auth.access_token; })
        .finally(function () { refreshInFlight = null; });
      return refreshInFlight;
    }

    /* A valid bearer token, refreshed if it is about to expire. Rejects if the
       user is not signed in — the caller turns that into "no-folder", never a
       silent no-op that would look like a successful empty sync. */
    function ensureToken() {
      var a = loadAuth();
      if (!a || !a.refresh_token) return Promise.reject(new Error("not signed in"));
      if (a.access_token && a.expires_at && a.expires_at - TOKEN_SKEW_MS > Date.now()) {
        return Promise.resolve(a.access_token);
      }
      return refreshToken();
    }

    /* ---- REST ------------------------------------------------------------ */

    function rest(method, path, body, prefer) {
      return ensureToken().then(function (token) {
        var headers = {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        };
        if (prefer) headers.Prefer = prefer;
        var init = { method: method, headers: headers };
        if (body !== undefined) init.body = serialize(body);
        return fetch(REST + path, init).then(function (r) {
          if (r.status === 401) { setStatus("disconnected"); throw new Error("session expired"); }
          return r.text().then(function (text) {
            var data = null;
            if (text) { try { data = JSON.parse(text); } catch (e) { data = text; } }
            if (!r.ok) {
              var msg = (data && data.message) || (data && data.error) || ("PostgREST " + r.status);
              var err = new Error(msg); err.status = r.status; err.code = data && data.code; throw err;
            }
            return data;
          });
        });
      });
    }

    /* ---- row read -------------------------------------------------------- */

    function getRow() {
      return rest("GET", "/" + STATE_TABLE + "?select=doc,rev&limit=1")
        .then(function (rows) { return (rows && rows[0]) || null; });
    }

    /* The stored doc already carries deviceId + writtenAt (see stamp), so it
       IS the payload the file transports would have written — merge() reads it
       exactly the same way. A row that will not shape-check is reported, never
       laundered into "no data". */
    function readFile() {
      if (!hasAuth()) return Promise.resolve(null);
      return getRow().then(function (row) {
        lastReadAt = new Date().toISOString();
        if (!row) { lastKnownRev = null; return null; }
        lastKnownRev = row.rev;
        return row.doc || null;
      }).catch(function (err) { lastError = String((err && err.message) || err); throw err; });
    }

    function stamp(data) {
      var out = {};
      Object.keys(data || {}).forEach(function (k) { out[k] = data[k]; });
      out.deviceId = window.Sync.deviceId();   // one device id, shared across all transports
      out.writtenAt = new Date().toISOString();
      return out;
    }

    function insertRow(stamped) {
      return rest("POST", "/" + STATE_TABLE, {
        user_id: auth.user_id, doc: stamped, device_id: stamped.deviceId, written_at: stamped.writtenAt, rev: 1
      }, "return=minimal").then(function () { return true; })
        .catch(function (err) {
          if (err && (err.status === 409 || err.code === "23505")) return false;  // row raced in — retry as update
          throw err;
        });
    }

    /* Compare-and-set on rev: PostgREST updates only the row whose rev still
       matches what we read. Zero rows back means another device wrote in the
       gap — the caller re-reads, merges, and retries (bounded). */
    function patchRow(expectedRev, stamped) {
      return rest("PATCH",
        "/" + STATE_TABLE + "?user_id=eq." + auth.user_id + "&rev=eq." + expectedRev,
        { doc: stamped, device_id: stamped.deviceId, written_at: stamped.writtenAt, rev: expectedRev + 1 },
        "return=representation"
      ).then(function (rows) { return !!(rows && rows.length); });
    }

    function afterWrite(stamped) {
      lastWriteAt = new Date().toISOString();
      lastError = null;
      setStatus("synced");
      return writeBackup(stamped).then(function () { return true; });
    }

    /* PLAN §A5: read the current rev, merge if the remote moved since we last
       knew it, then write with a rev guard — retrying, bounded, on a race. */
    function writeNow(data, attempt) {
      attempt = attempt || 0;
      if (!hasAuth()) { setStatus(configured() ? "no-folder" : "not-configured"); return Promise.resolve(false); }
      return ensureToken().then(function () { return getRow(); }).then(function (row) {
        if (!row) {
          var first = stamp(data);
          return insertRow(first).then(function (ok) {
            if (!ok) return writeNow(data, attempt + 1);
            lastKnownRev = 1;
            return afterWrite(first);
          });
        }
        /* An unknown rev (null — nothing read yet this session) counts as
           "moved": the row holds history this device has never seen, so it
           is merged, never overwritten. */
        var base = data;
        if (row.rev !== lastKnownRev) {
          if (attempt >= WRITE_RETRY_LIMIT) { lastError = "another device is writing at the same time"; return false; }
          base = row.doc ? merge(row.doc, data) : data;
          try { onRemoteChange(base, { from: row.doc && row.doc.deviceId, at: row.doc && row.doc.writtenAt }); } catch (e) {}
        }
        var stamped = stamp(base);
        return patchRow(row.rev, stamped).then(function (updated) {
          if (!updated) {
            if (attempt >= WRITE_RETRY_LIMIT) { lastError = "write race"; return false; }
            return writeNow(data, attempt + 1);
          }
          lastKnownRev = row.rev + 1;
          return afterWrite(stamped);
        });
      }).catch(function (err) {
        lastError = String((err && err.message) || err);
        setStatus(err && /not signed in/.test(String(err.message)) ? "no-folder" : "disconnected");
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

    /* ---- backups (PLAN §A5 guard — capped, spaced, same shape as the others) */

    function writeBackup(stamped) {
      if (!hasAuth()) return Promise.resolve(false);
      var now = Date.now();
      if (lastBackupAt && now - lastBackupAt < backupInterval) return Promise.resolve(false);
      lastBackupAt = now;
      return rest("POST", "/" + BACKUP_TABLE, {
        user_id: auth.user_id, doc: stamped, device_id: stamped.deviceId, written_at: stamped.writtenAt
      }, "return=minimal").then(function () { return prune(); })
        .then(function () { return true; })
        .catch(function (err) { console.warn("[syncsupabase:" + appId + "] backup failed", err); return false; });
    }

    /* Keep the newest `backupKeep`, delete the rest. Two calls rather than a
       subquery, because PostgREST has no DELETE-with-offset. */
    function prune() {
      return rest("GET", "/" + BACKUP_TABLE + "?select=id&order=written_at.desc&offset=" + backupKeep)
        .then(function (rows) {
          if (!rows || !rows.length) return 0;
          var ids = rows.map(function (r) { return r.id; });
          return rest("DELETE", "/" + BACKUP_TABLE + "?id=in.(" + ids.join(",") + ")", undefined, "return=minimal")
            .then(function () { return ids.length; });
        }).catch(function () { return 0; });
    }

    /* ---- refresh --------------------------------------------------------- */

    function refresh(getLocal, apply) {
      if (!hasAuth()) return Promise.resolve(false);
      return readFile().then(function (remote) {
        if (!remote) return false;
        var local = getLocal();
        var merged = merge(remote, local);
        var changed = JSON.stringify(merged) !== JSON.stringify(local);
        if (changed) {
          apply(merged);
          try { onRemoteChange(merged, { from: remote.deviceId || null, at: remote.writtenAt || null }); } catch (e) {}
        }
        return changed;
      }).catch(function (err) { lastError = String((err && err.message) || err); return false; });
    }

    function watch(getLocal, apply, isBusy) {
      if (watching) return;
      watching = true;
      var run = function () {
        if (document.visibilityState !== "visible") return;
        if (isBusy && isBusy()) return;
        if (hasAuth()) refresh(getLocal, apply);
      };
      document.addEventListener("visibilitychange", run);
      window.addEventListener("focus", run);
    }

    /* ---- connect / forget / reconnect ------------------------------------ */

    /* connect({ email, password }) — sign in. The row is created lazily on the
       first writeNow, exactly as Drive creates its file on first write. */
    function connect(o) {
      o = o || {};
      if (!configured()) return Promise.reject(new Error("Supabase isn't configured."));
      return signIn(o.email, o.password).then(function () { setStatus("synced"); return true; });
    }

    function forget() {
      var a = loadAuth();
      var done = function () { clearAuth(); lastKnownRev = null; setStatus(configured() ? "no-folder" : "not-configured"); return true; };
      if (a && a.access_token) {
        return fetch(AUTH + "/logout", {
          method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + a.access_token }
        }).then(done, done);   // local sign-out regardless of the server's answer
      }
      return Promise.resolve(done());
    }

    function reconnect() {
      if (!hasAuth()) { setStatus(configured() ? "no-folder" : "not-configured"); return Promise.resolve(status); }
      return ensureToken().then(function () { setStatus("synced"); return "synced"; })
        .catch(function () { setStatus("disconnected"); return "disconnected"; });
    }

    /* ---- init ------------------------------------------------------------ */

    function init(getLocal) {
      if (!configured()) return Promise.resolve({ status: "not-configured", data: null, merged: false });
      if (!hasAuth()) return Promise.resolve({ status: "no-folder", data: null, merged: false });
      return ensureToken().then(function () {
        setStatus("synced");
        return readFile().then(function (remote) {
          if (!remote) return { status: "synced", data: null, merged: false };
          var local = getLocal ? getLocal() : null;
          var merged = local ? merge(remote, local) : remote;
          return { status: "synced", data: merged, merged: true, from: remote.deviceId || null };
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
      hasFile: function () { return hasAuth(); },
      configured: configured,
      status: function () { return status; },
      account: function () { var a = loadAuth(); return a ? a.email : null; },
      info: function () {
        var a = loadAuth();
        return {
          appId: appId, deviceId: window.Sync.deviceId(),
          status: status, account: a ? a.email : null,
          lastWriteAt: lastWriteAt, lastReadAt: lastReadAt,
          lastError: lastError, hasFile: hasAuth()
        };
      }
    };
  }

  return { create: create, configured: configured };
})();
