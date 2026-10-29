/* This file is generated from the exact Vite output. Do not edit. */
const CACHE_NAME = "foldwink-precache-9dccda392908";
const PRECACHE_URLS = [
  "./apple-touch-icon.png",
  "./assets/ArchivistPassportModal-NzXnXeWk.js",
  "./assets/Button-sVJKboB6.js",
  "./assets/DialogShell-BYZ-dBTO.js",
  "./assets/IronContractModal-Cq-oQdRn.js",
  "./assets/MistakesDots-adHCSA2b.js",
  "./assets/PalimpsestModal-9uQTzK1e.js",
  "./assets/PwaUpdateNotice-BXf5vnrS.js",
  "./assets/ShareSheet-vrVicyrz.js",
  "./assets/StampArtwork-1Yvu6XUI.js",
  "./assets/StatStrip-1-i08YTk.js",
  "./assets/StatsScreen-wl5T5XYi.js",
  "./assets/appStore-BWAfviwY.js",
  "./assets/apple-touch-icon-DT-KdzKt.png",
  "./assets/favicon-BDjwWch0.svg",
  "./assets/index-CJk1mW5x.css",
  "./assets/index-DvOe24b2.js",
  "./assets/jsx-runtime-IrYFhk0w.js",
  "./assets/manifest-B8pPnLZ5.webmanifest",
  "./assets/manrope-cyrillic-wght-normal-Dvxsihut.woff2",
  "./assets/manrope-greek-wght-normal-DL7QRZyv.woff2",
  "./assets/manrope-latin-ext-wght-normal-Ch3YOpNY.woff2",
  "./assets/manrope-latin-wght-normal-DHIcAJRg.woff2",
  "./assets/manrope-vietnamese-wght-normal-usUDDRr7.woff2",
  "./assets/updateLifecycle-D6PXXHIf.js",
  "./assets/useFeedback-LaK7vq_W.js",
  "./favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./index.html",
  "./manifest.webmanifest"
];
const APP_SHELL = PRECACHE_URLS.find((url) => url.endsWith("index.html"));

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

// Versioned caches deliberately remain available. An older controlled tab may
// still need its own hashed files; a later retention policy can remove only
// caches proven unused, never all caches during a new worker install.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => clients.forEach((client) => client.postMessage({ type: "FOLDWINK_UPDATE_ACTIVATED" }))),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "FOLDWINK_SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "FOLDWINK_CACHE_URLS" && Array.isArray(event.data.urls)) {
    const urls = event.data.urls.filter(
      (url) => typeof url === "string" && new URL(url, self.location.origin).origin === self.location.origin,
    );
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then((cache) => cache.addAll(urls))
        .then(() => event.source?.postMessage({ type: "FOLDWINK_CONTENT_CACHED", urls })),
    );
  }
});

async function cacheFirst(request) {
  const currentCache = await caches.open(CACHE_NAME);
  const cached = await currentCache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const path = new URL(request.url).pathname;
  const immutable =
    (path.includes("/assets/") && /-[A-Za-z0-9_-]{8,}\.[^.]+$/u.test(path)) ||
    (path.includes("/runtime-content/v") &&
      /(?:boot|archive)\.[^.]+\.[a-f0-9]{12}\.json$/u.test(path));
  // Retained old caches are only a fallback for URLs whose hash/version makes
  // their bytes immutable. Stable manifests and shell paths must revalidate
  // against this worker's cache or the network, never an older release.
  if (immutable) {
    const retained = await caches.match(request, { ignoreSearch: true });
    if (retained) return retained;
  }
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      await currentCache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}

async function navigationResponse(request) {
  try {
    return await fetch(request);
  } catch {
    // HTML is only ever a navigation fallback. Asset failures stay failures so
    // a missing script can never be answered with index.html.
    return (await caches.match(APP_SHELL)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});
