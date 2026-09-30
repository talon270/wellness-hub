#!/usr/bin/env node
/* Self-check for js/androidupdate.js (PLAN-android-updater.md B1).
   Runs the module under node with a stub Hub, a stub bridge and a mocked fetch,
   so the logic that decides "is there an update?" is exercised without a phone.
   Usage:  node tools/check-androidupdate.js      (exit 1 on any failure) */
"use strict";
const fs = require("fs"), path = require("path"), assert = require("assert");

let installedCode = 1000001, installedName = "1.0.1";
const store = {};
global.window = global;
global.Hub = { uiGet: (k, d) => (k in store ? JSON.parse(store[k]) : d), uiSet: (k, v) => { store[k] = JSON.stringify(v); }, toast() {} };
global.WHNative = { versionCode: () => installedCode, versionName: () => installedName, canInstall: () => true };
let fetchImpl;
global.fetch = (...a) => fetchImpl(...a);
// eslint-disable-next-line no-eval
eval(fs.readFileSync(path.join(__dirname, "../js/androidupdate.js"), "utf8"));
const AU = Hub.androidUpdate;

let n = 0;
const ok = (name, fn) => { try { fn(); n++; console.log("PASS " + name); } catch (e) { console.log("FAIL " + name + " — " + e.message); process.exitCode = 1; } };

const SHA = "a".repeat(64);
const rel = (tag, extra = {}) => Object.assign({
  tag_name: tag, draft: false, prerelease: false, body: "Adds things.\nsha256: " + SHA,
  assets: [{ name: "wellness-hub.apk", size: 13000000, browser_download_url: "https://github.com/x/y/releases/download/" + tag + "/wellness-hub.apk" }]
}, extra);

ok("tag -> versionCode matches Tauri's formula (1.0.0 is 1000000)", () => {
  assert.strictEqual(AU.parseTag("android-v1.0.0").code, 1000000);
  assert.strictEqual(AU.parseTag("android-v1.0.2").code, 1000002);
  assert.strictEqual(AU.parseTag("android-v1.2.3").code, 1002003);
});
ok("a tag that is not android-vX.Y.Z is not a release of this app", () => {
  ["v1.0.2", "android-v1.0", "android-v1.0.2-beta", "android-1.0.2", "", null].forEach(t => assert.strictEqual(AU.parseTag(t), null, String(t)));
});
ok("a component of 1000 would run into the next one, so it is refused", () => {
  assert.strictEqual(AU.parseTag("android-v1.0.1000"), null);
  assert.strictEqual(AU.parseTag("android-v1.1000.0"), null);
});
ok("1.0.10 outranks 1.0.9 (numbers, not strings)", () => {
  const p = AU.pickRelease([rel("android-v1.0.9"), rel("android-v1.0.10"), rel("android-v1.0.2")]);
  assert.strictEqual(p.name, "1.0.10");
});
ok("drafts, prereleases, desktop tags and releases without an https .apk are skipped", () => {
  const p = AU.pickRelease([
    rel("android-v1.0.9", { draft: true }), rel("android-v1.0.8", { prerelease: true }), rel("v1.0.7"),
    rel("android-v1.0.6", { assets: [] }),
    rel("android-v1.0.5", { assets: [{ name: "x.apk", size: 1, browser_download_url: "http://insecure/x.apk" }] }),
    rel("android-v1.0.3")
  ]);
  assert.strictEqual(p.name, "1.0.3");
});
ok("nothing published -> null, not an error", () => {
  assert.strictEqual(AU.pickRelease([]), null);
  assert.strictEqual(AU.pickRelease(undefined), null);
});
ok("the newest release with no sha256 line is NOT offered, and says why", () => {
  const p = AU.pickRelease([rel("android-v1.0.4", { body: "no hash here" }), rel("android-v1.0.3")]);
  assert.ok(p.error && /android-v1\.0\.4/.test(p.error), JSON.stringify(p));
});
ok("the hash is lower-cased and removed from the notes", () => {
  const p = AU.pickRelease([rel("android-v1.0.2", { body: "Fixes.\nSHA256: " + "A".repeat(64) })]);
  assert.strictEqual(p.sha256, SHA); assert.strictEqual(p.notes, "Fixes.");
});
ok("automatic checks: off means never; a day old and not failing means due", () => {
  const H = 3600000, now = 1e12;
  assert.strictEqual(AU.due({ auto: false, lastOk: null, lastAttemptAt: 0 }, now), false);
  assert.strictEqual(AU.due({ auto: true, lastOk: null, lastAttemptAt: 0 }, now), true);
  assert.strictEqual(AU.due({ auto: true, lastOk: { at: now - 2 * H }, lastAttemptAt: now - 2 * H }, now), false);
  assert.strictEqual(AU.due({ auto: true, lastOk: { at: now - 25 * H }, lastAttemptAt: now - H / 2 }, now), false);
  assert.strictEqual(AU.due({ auto: true, lastOk: { at: now - 25 * H }, lastAttemptAt: now - 2 * H }, now), true);
});

const jsonRes = (body, status = 200, headers = {}) => ({ ok: status < 400, status, headers: { get: k => headers[k.toLowerCase()] || null }, json: async () => body });

(async () => {
  fetchImpl = async () => jsonRes([rel("android-v1.0.2")]);
  let st = await AU.check();
  ok("a newer release is offered and summarised as available", () => {
    assert.strictEqual(st.available, true); assert.strictEqual(AU.summary(st).kind, "available"); assert.strictEqual(st.latest.size, 13000000);
  });

  fetchImpl = async () => { throw new TypeError("Failed to fetch"); };
  st = await AU.check();
  ok("offline: reported as failed, and the last good result is KEPT (never fake freshness)", () => {
    const s = AU.summary(st);
    assert.strictEqual(s.kind, "failed"); assert.ok(/no connection/.test(s.line), s.line);
    assert.ok(/Last good check/.test(s.line) && /1\.0\.2/.test(s.line), s.line);
    assert.strictEqual(st.available, true);
  });

  fetchImpl = async () => jsonRes({ message: "rate limited" }, 403, { "x-ratelimit-remaining": "0" });
  st = await AU.check();
  ok("a 403 with no requests left is named as GitHub's rate limit", () => assert.ok(/rate limit/.test(st.lastErr.msg), st.lastErr.msg));

  fetchImpl = async () => jsonRes({}, 500);
  st = await AU.check();
  ok("any other HTTP error says which", () => assert.ok(/HTTP 500/.test(st.lastErr.msg), st.lastErr.msg));

  fetchImpl = async () => jsonRes([rel("android-v1.0.1")]);
  st = await AU.check();
  ok("a good check clears the failure; same version is up to date, with a time", () => {
    assert.strictEqual(st.lastErr, null); assert.strictEqual(st.available, false);
    const s = AU.summary(st); assert.strictEqual(s.kind, "uptodate"); assert.ok(/Up to date as of/.test(s.line), s.line);
  });

  fetchImpl = async () => jsonRes([]);
  st = await AU.check();
  ok("no Android release yet reads as that, not as an error", () => {
    const s = AU.summary(st); assert.strictEqual(s.kind, "uptodate"); assert.ok(/no Android release has been published/.test(s.line), s.line);
  });

  installedCode = 1000005; installedName = "1.0.5";
  fetchImpl = async () => jsonRes([rel("android-v1.0.2")]);
  st = await AU.check();
  ok("never offers a downgrade", () => assert.strictEqual(st.available, false));

  ok("never checked on a fresh phone", () => {
    Object.keys(store).forEach(k => delete store[k]);
    assert.strictEqual(AU.summary(AU.status()).kind, "never");
  });

  console.log(`\n${n} passed${process.exitCode ? ", with failures" : ", 0 failed"}`);
  process.exit(process.exitCode || 0);
})();
