/* ============================================================================
   WELLNESS HUB · ANDROID UPDATE
   ----------------------------------------------------------------------------
   Checks GitHub Releases for a newer Android build and hands the download to
   MainActivity's bridge (Updater.kt), which verifies it and gives it to Android's
   own installer. PLAN-android-updater.md. Inert everywhere but the Android app:
   window.WHNative exists only there.

     · CHECK     a plain fetch, here, so it runs under a mocked bridge in tests
     · DOWNLOAD  Kotlin — https-only redirects, size and SHA-256 checked
     · INSTALL   PackageInstaller. Android refuses any APK not signed with this
                 copy's key; that signature, not the hash, is what authenticates
                 an update. The hash catches a truncated or corrupt download.

   THE ONE RULE OF THE CARD: never say "up to date" unless a check succeeded, and
   say when. A failed check never overwrites the last good one, so the card can
   print both ("couldn't check — last good check 3 days ago").

   State lives in `wellnessHub.ui` (Hub.uiGet/uiSet): per device, never synced,
   never in a backup, no SCHEMA_VERSION involved.

   Public: Hub.androidUpdate.status() / .summary(st) / .check() / .install() /
           .setAuto(bool) / .openInstallSettings() / .on(fn) -> off()
   Event:  every change calls the subscribers; js/views/settings.js repaints.
   ========================================================================== */
(function () {
  "use strict";

  var Hub = window.Hub;
  var WH = window.WHNative;   // MainActivity's JS bridge; absent off Android

  /* The one place the source of updates is named. */
  var RELEASES_URL = "https://api.github.com/repos/talon270/wellness-hub/releases?per_page=10";
  /* `android-v` is not `v`: .github/workflows/build.yml fires on v* tags only, so
     cutting an Android release does not start the desktop CI. Do not "simplify". */
  var TAG_RE = /^android-v(\d+)\.(\d+)\.(\d+)$/;
  var SHA_RE = /sha256:\s*([0-9a-f]{64})/i;
  var STORE_KEY = "androidUpdate";

  var CHECK_EVERY_MS = 24 * 60 * 60 * 1000;      // one automatic check a day...
  var RETRY_AFTER_FAIL_MS = 60 * 60 * 1000;      // ...but a phone that was offline at 8am is retried at 9
  var FETCH_TIMEOUT_MS = 15000;
  var BOOT_DELAY_MS = 4000;                      // after first paint; a check is never why the app is slow to open
  var POLL_MS = 500;                             // only while an install is running
  var NOTES_MAX = 800;
  var TERMINAL = ["idle", "success", "error", "needs-permission"];

  /* ---------------------------------------------------------------------------
     PURE — no DOM, no bridge; tools/check-androidupdate.js runs these under node
     ------------------------------------------------------------------------- */

  /* Tauri derives versionCode as major*1,000,000 + minor*1,000 + patch, so 1.0.0
     is 1000000 — the number every build so far already carries. A component of
     1000 or more would run into the next one, so it is refused, not wrapped. */
  function versionCode(major, minor, patch) {
    if (minor >= 1000 || patch >= 1000) return null;
    return major * 1000000 + minor * 1000 + patch;
  }

  function parseTag(tag) {
    var m = TAG_RE.exec(String(tag || ""));
    if (!m) return null;
    var code = versionCode(+m[1], +m[2], +m[3]);
    return code === null ? null : { name: m[1] + "." + m[2] + "." + m[3], code: code };
  }

  /* Highest-versioned, published Android release with an https .apk asset.
     Compared as numbers: 1.0.10 outranks 1.0.9, which a string sort gets wrong.
     null  -> nothing published yet.
     {error} -> the newest release is unusable (no hash line), so it is NOT offered:
                an update the app cannot check is not one it will install. */
  function pickRelease(list) {
    var best = null;
    (Array.isArray(list) ? list : []).forEach(function (r) {
      if (!r || r.draft || r.prerelease) return;
      var v = parseTag(r.tag_name);
      if (!v) return;
      var asset = (r.assets || []).filter(function (a) {
        return a && /\.apk$/i.test(a.name || "") && /^https:\/\//.test(a.browser_download_url || "") && a.size > 0;
      })[0];
      if (!asset) return;
      if (!best || v.code > best.v.code) best = { r: r, v: v, asset: asset };
    });
    if (!best) return null;
    var body = String(best.r.body || "");
    var sha = SHA_RE.exec(body);
    if (!sha) return { error: "release " + best.r.tag_name + " has no \"sha256:\" line in its notes, so it is not offered" };
    return {
      tag: best.r.tag_name, name: best.v.name, code: best.v.code,
      url: best.asset.browser_download_url, size: best.asset.size, sha256: sha[1].toLowerCase(),
      notes: body.replace(SHA_RE, "").trim().slice(0, NOTES_MAX)
    };
  }

  /* Automatic checks: due once the last good one is a day old, and never more than
     once an hour while they are failing. Off means only the button checks. */
  function due(s, now) {
    if (!s.auto) return false;
    var lastGood = s.lastOk ? s.lastOk.at : 0;
    return now - lastGood >= CHECK_EVERY_MS && now - (s.lastAttemptAt || 0) >= RETRY_AFTER_FAIL_MS;
  }

  function describeError(err) {
    if (err && err.rateLimited) return "GitHub's rate limit (60 requests an hour without signing in) is used up";
    if (err && err.status) return "GitHub answered HTTP " + err.status;
    if (err && err.name === "AbortError") return "GitHub did not answer within " + (FETCH_TIMEOUT_MS / 1000) + " s";
    return "no connection to GitHub (offline, or it is unreachable)";
  }

  function mb(bytes) { return (bytes / 1048576).toFixed(1) + " MB"; }
  function when(ts) { return new Date(ts).toLocaleString(); }

  /* One of: unsupported · checking · never · failed · available · uptodate. */
  function summary(st) {
    if (!st.supported) return { kind: "unsupported", chip: "not on Android", line: "" };
    if (st.checking) return { kind: "checking", chip: "checking…", line: "Asking GitHub for the latest Android release…" };
    var inst = st.installed ? st.installed.name : "unknown";
    var good = st.lastOk
      ? "Last good check " + when(st.lastOk.at) + ": " +
        (st.lastOk.latest ? "latest release was " + st.lastOk.latest.name + "." : "no Android release was published.")
      : "It has never succeeded on this phone.";
    if (st.lastErr) return { kind: "failed", chip: "couldn't check", line: "Couldn't check — " + st.lastErr.msg + ". " + good };
    if (!st.lastOk) return { kind: "never", chip: "not checked", line: "Not checked yet on this phone." };
    if (st.available) {
      return { kind: "available", chip: "update available",
        line: "Version " + st.latest.name + " (" + mb(st.latest.size) + ") is out; this copy is " + inst + ". Checked " + when(st.lastOk.at) + "." };
    }
    return { kind: "uptodate", chip: "up to date",
      line: "Up to date as of " + when(st.lastOk.at) + (st.latest ? " — latest release is " + st.latest.name + "." : " — no Android release has been published yet.") };
  }

  /* ---------------------------------------------------------------------------
     STATE
     ------------------------------------------------------------------------- */
  var subs = [];
  var checking = false;
  var checkPromise = null;
  var inst = { phase: "idle", bytes: 0, total: 0, error: null };
  var pollTimer = null;

  function load() {
    var s = (Hub.uiGet(STORE_KEY, null)) || {};
    return { auto: s.auto !== false, announced: !!s.announced, lastAttemptAt: s.lastAttemptAt || 0,
             lastOk: s.lastOk || null, lastErr: s.lastErr || null };
  }
  function save(s) { Hub.uiSet(STORE_KEY, s); }

  function emit() { subs.slice().forEach(function (fn) { try { fn(); } catch (e) {} }); }
  function on(fn) {
    subs.push(fn);
    return function () { subs = subs.filter(function (f) { return f !== fn; }); };
  }

  function bridge(name, fallback) {
    try { return WH && typeof WH[name] === "function" ? WH[name]() : fallback; } catch (e) { return fallback; }
  }

  function installed() {
    var code = bridge("versionCode", null);
    return code === null ? null : { code: Number(code), name: String(bridge("versionName", "")) };
  }

  function status() {
    var s = load(), i = installed();
    var latest = s.lastOk ? s.lastOk.latest : null;
    return {
      supported: !!WH, installed: i, auto: s.auto, checking: checking,
      lastOk: s.lastOk, lastErr: s.lastErr, latest: latest,
      available: !!(i && latest && latest.code > i.code),
      canInstall: bridge("canInstall", false) === true,
      install: { phase: inst.phase, bytes: inst.bytes, total: inst.total, error: inst.error }
    };
  }

  /* ---------------------------------------------------------------------------
     CHECK
     ------------------------------------------------------------------------- */
  function fetchReleases() {
    var ctl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, FETCH_TIMEOUT_MS) : null;
    /* No custom headers: any of them turns this into a CORS preflight. */
    return fetch(RELEASES_URL, ctl ? { signal: ctl.signal } : undefined).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) {
        var limited = (res.status === 403 || res.status === 429) && res.headers.get("x-ratelimit-remaining") === "0";
        throw { status: res.status, rateLimited: limited };
      }
      return res.json();
    }, function (e) { if (timer) clearTimeout(timer); throw e; });
  }

  function check() {
    if (!WH) return Promise.resolve(status());
    if (checking) return checkPromise;
    checking = true; emit();
    var attemptAt = Date.now();
    checkPromise = fetchReleases().then(function (list) {
      var picked = pickRelease(list), s = load();
      s.lastAttemptAt = attemptAt;
      if (picked && picked.error) s.lastErr = { at: attemptAt, msg: picked.error };
      else { s.lastOk = { at: attemptAt, latest: picked }; s.lastErr = null; }
      save(s);
    }, function (err) {
      var s = load();                      // lastOk is deliberately left as it was
      s.lastAttemptAt = attemptAt; s.lastErr = { at: attemptAt, msg: describeError(err) };
      save(s);
    }).then(function () { checking = false; emit(); return status(); });
    return checkPromise;
  }

  /* No emit(): the switch already shows the new value, and a repaint would rebuild
     the card under the keyboard focus of the person who just toggled it. */
  function setAuto(on_) {
    var s = load(); s.auto = !!on_; save(s);
  }

  /* ---------------------------------------------------------------------------
     INSTALL — the download and the installer run in Kotlin; this only starts them
     and reads their status back until it is terminal.
     ------------------------------------------------------------------------- */
  function setInstall(patch) {
    inst = { phase: patch.phase, bytes: patch.bytes || 0, total: patch.total || 0, error: patch.error || null };
    emit();
  }

  function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  function poll() {
    var raw;
    try { raw = JSON.parse(WH.installStatus()); }
    catch (e) { raw = { phase: "error", error: "couldn't read the installer's status" }; }
    setInstall(raw);
    if (TERMINAL.indexOf(raw.phase) >= 0) stopPolling();
  }

  function explainStart(r) {
    if (r === "bad-url") return "the release's download address isn't https, so it was refused";
    if (r === "bad-hash") return "the release's SHA-256 isn't a 64-digit hex string, so it was refused";
    return "the installer refused to start (" + r + ")";
  }

  function install() {
    var st = status();
    if (!WH || !st.available) return;
    if (!st.canInstall) { setInstall({ phase: "needs-permission" }); return; }
    var r = String(WH.install(st.latest.url, st.latest.sha256, st.latest.size));
    if (r === "needs-permission") { setInstall({ phase: "needs-permission" }); return; }
    if (r !== "started" && r !== "busy") { setInstall({ phase: "error", error: explainStart(r) }); return; }
    setInstall({ phase: "downloading", total: st.latest.size });
    stopPolling();
    pollTimer = setInterval(poll, POLL_MS);
  }

  function openInstallSettings() { if (WH && typeof WH.openInstallSettings === "function") WH.openInstallSettings(); }

  /* Android can refuse to open its confirmation screen from the background and gives no
     sign that it did. The card offers this button instead of guessing. */
  function reshow() { if (WH && typeof WH.reshow === "function") WH.reshow(); }

  /* ---------------------------------------------------------------------------
     BOOT — one automatic check a day, announced the first time it happens
     ------------------------------------------------------------------------- */
  Hub.androidUpdate = {
    supported: !!WH, status: status, summary: summary, check: check, install: install,
    setAuto: setAuto, openInstallSettings: openInstallSettings, reshow: reshow, on: on,
    /* pure, exposed for the node check */
    parseTag: parseTag, pickRelease: pickRelease, versionCode: versionCode, due: due,
    describeError: describeError, RELEASES_URL: RELEASES_URL
  };

  if (WH) {
    setTimeout(function () {
      var s = load();
      if (!due(s, Date.now())) return;
      if (!s.announced) {
        s.announced = true; save(s);
        Hub.toast("Checking GitHub for an app update, at most once a day. Turn it off in Settings → Reminders & devices → Android app.", "info", 9000);
      }
      check().then(function (st) {
        if (st.available) Hub.toast("Update available: " + st.latest.name + ". Settings → Reminders & devices → Android app.", "info", 9000);
      });
    }, BOOT_DELAY_MS);
  }
})();
