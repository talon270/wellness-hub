/* ============================================================================
   WELLNESS HUB · SERVICE WORKER
   ----------------------------------------------------------------------------
   Makes the app installable and genuinely offline: the whole shell is cached on
   install, so after the first visit it launches with no network at all.

   Strategy
     · Precache every file the app is built from (it's a fixed, small set).
     · Navigations: network-first with a cache fallback, so a freshly edited
       index.html is picked up when the server is reachable, and the app still
       opens when it isn't.
     · Everything else: cache-first, revalidating in the background. Assets are
       versioned by CACHE_NAME, so bumping the version is what ships an update.

   IMPORTANT: this worker does NOT make reminders fire while the app is closed.
   A service worker is only woken for events the browser sends it, and the web
   platform has no reliable scheduled-notification API. See README → "Reminders
   when the app is closed".

   BUMP CACHE_VERSION whenever you change any file in PRECACHE.
   ========================================================================== */

const CACHE_VERSION = "v22";
const CACHE_NAME = `wellness-hub-${CACHE_VERSION}`;

/* Relative paths so the app works from any sub-directory. */
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",

  "./css/hub.css",
  "./css/basalt-gruvbox.css",
  "./css/basalt-makeover.css",
  "./css/muscles.css",
  "./css/themes.css",
  "./fitness/basalt.css",

  "./vendor/sync.js",
  "./js/syncdrive.js",
  "./js/core.js",
  "./js/syncmerge.js",
  "./js/theme.js",
  "./js/gamify.js",
  "./js/insights.js",
  "./js/pwa.js",
  "./js/calendar.js",
  "./js/storage.js",
  "./js/photos.js",
  "./js/onboarding.js",
  "./js/app.js",
  "./js/views/dashboard.js",
  "./js/views/desk.js",
  "./js/views/mobility.js",
  "./js/views/eyecare.js",
  "./js/views/dental.js",
  "./js/views/bodycare.js",
  "./js/views/wellness.js",
  "./js/views/repro.js",
  "./js/views/health.js",
  "./js/views/insights.js",
  "./js/views/achievements.js",
  "./js/views/settings.js",
  "./js/guide.js",
  "./fitness/basalt.js",
  "./fitness/muscles.data.js",
  "./fitness/phases.data.js",
  "./fitness/phases.js",
  "./fitness/muscles.js",

  "./vendor/chart.umd.min.js",

  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

/* ---------------------------------------------------------------------------
   INSTALL — precache the shell
   ------------------------------------------------------------------------- */
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    /* addAll is atomic: one 404 fails the whole install. That's the behaviour
       we want for a shell, but request each with cache:"reload" so a stale HTTP
       cache can't poison a fresh install. */
    await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" })));
  })());
  /* Don't wait for existing tabs to close before this version takes over — the
     page asks the user first (see js/app.js), so activation is safe. */
  self.skipWaiting();
});

/* ---------------------------------------------------------------------------
   ACTIVATE — drop caches from previous versions
   ------------------------------------------------------------------------- */
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((n) => n.startsWith("wellness-hub-") && n !== CACHE_NAME)
        .map((n) => caches.delete(n))
    );
    /* Navigation preload shaves latency off the network-first path. */
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

/* ---------------------------------------------------------------------------
   FETCH
   ------------------------------------------------------------------------- */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  /* Only ever handle same-origin GETs. The app makes no cross-origin requests,
     so anything else is not ours to touch. */
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  /* --- navigations: network-first, fall back to the cached shell --- */
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const preloaded = await event.preloadResponse;
        if (preloaded) {
          putInCache(req, preloaded.clone());
          return preloaded;
        }
        const fresh = await fetch(req);
        putInCache(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cache = await caches.open(CACHE_NAME);
        /* A shortcut URL carries a query string; fall back to the bare shell. */
        return (await cache.match(req)) ||
               (await cache.match("./index.html")) ||
               (await cache.match("./")) ||
               offlineResponse();
      }
    })());
    return;
  }

  /* --- everything else: cache-first, refresh in the background --- */
  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: false });
    if (cached) {
      /* Stale-while-revalidate: serve instantly, quietly update for next time. */
      event.waitUntil(
        fetch(req).then((res) => putInCache(req, res)).catch(() => {})
      );
      return cached;
    }
    try {
      const res = await fetch(req);
      putInCache(req, res.clone());
      return res;
    } catch (e) {
      return new Response("", { status: 504, statusText: "Offline" });
    }
  })());
});

async function putInCache(req, res) {
  /* Opaque and error responses are not worth persisting. */
  if (!res || !res.ok || res.type === "opaque") return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(req, res);
}

function offlineResponse() {
  return new Response(
    "<!doctype html><meta charset=utf-8>" +
    "<title>Wellness Hub — offline</title>" +
    "<style>body{background:#1d2021;color:#ebdbb2;font:16px/1.6 system-ui;" +
    "display:grid;place-items:center;height:100dvh;margin:0;text-align:center;padding:24px}" +
    "h1{color:#fbf1c7;font-size:20px}code{color:#fabd2f}</style>" +
    "<div><h1>Wellness Hub isn't cached yet</h1>" +
    "<p>Open the app once while the local server is running and it will work " +
    "offline from then on.</p></div>",
    { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
  );
}

/* ---------------------------------------------------------------------------
   MESSAGES from the page
   ------------------------------------------------------------------------- */
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") self.skipWaiting();
  if (data.type === "GET_VERSION" && event.ports && event.ports[0]) {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

/* ---------------------------------------------------------------------------
   NOTIFICATION CLICKS
   Focus an existing window rather than opening a second one, and pass the
   target view along so the app can route to it.
   ------------------------------------------------------------------------- */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const view = data.view || "dashboard";
  const key = data.key || null;
  const action = event.action || "";

  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

    /* Snooze and Done are handled entirely by the page — it owns the
       scheduler and the log. If no window is open there is nothing to tell,
       and the reminder simply comes round again on its own schedule. */
    if (action === "snooze" || action === "done") {
      for (const client of all) {
        client.postMessage({ type: action === "snooze" ? "SNOOZE" : "DID", key, view });
      }
      /* Deliberately does NOT focus the window: the whole point of tapping
         Snooze is to not be pulled into the app. */
      if (all.length) return;
      if (action === "snooze" && self.clients.openWindow) return;   // nothing we can do
      return;
    }

    for (const client of all) {
      if ("focus" in client) {
        client.postMessage({ type: "NAVIGATE", view });
        return client.focus();
      }
    }
    if (self.clients.openWindow) {
      return self.clients.openWindow("./?go=" + encodeURIComponent(view));
    }
  })());
});
