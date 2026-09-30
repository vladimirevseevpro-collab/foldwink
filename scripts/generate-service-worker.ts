import { createHash } from "node:crypto";
import { readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

type GenerateOptions = {
  outDir: string;
  base: string;
};

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return nested.flat();
}

function toPrecachePath(file: string, outDir: string, base: string): string {
  const path = relative(outDir, file).split(sep).join("/");
  if (base === "./") return `./${path}`;
  return `${base.replace(/\/$/u, "")}/${path}`;
}

function isCoreAsset(path: string): boolean {
  return (
    path === "index.html" ||
    path === "manifest.webmanifest" ||
    path === "favicon.svg" ||
    path === "apple-touch-icon.png" ||
    path.startsWith("assets/") ||
    path === "icons/icon-192.png" ||
    path === "icons/icon-512.png"
  );
}

function renderServiceWorker(precache: string[], cacheVersion: string): string {
  return `/* This file is generated from the exact Vite output. Do not edit. */
const CACHE_NAME = "foldwink-precache-${cacheVersion}";
const PRECACHE_URLS = ${JSON.stringify(precache, null, 2)};
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
    (path.includes("/assets/") && /-[A-Za-z0-9_-]{8,}\\.[^.]+$/u.test(path)) ||
    (path.includes("/runtime-content/v") &&
      /(?:boot|archive)\\.[^.]+\\.[a-f0-9]{12}\\.json$/u.test(path));
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
`;
}

/** Generate the shipped worker only after Vite has written its final hashes. */
export async function generateServiceWorker({ outDir, base }: GenerateOptions): Promise<void> {
  const resolvedOutDir = resolve(outDir);
  const files = await listFiles(resolvedOutDir);
  const selected = files
    .map((file) => relative(resolvedOutDir, file).split(sep).join("/"))
    .filter(isCoreAsset)
    .sort();

  if (!selected.includes("index.html")) {
    throw new Error("Cannot generate service worker: Vite output has no index.html");
  }
  if (!selected.some((path) => path.startsWith("assets/"))) {
    throw new Error("Cannot generate service worker: Vite output has no hashed assets");
  }
  const precache = selected.map((path) => toPrecachePath(join(resolvedOutDir, path), resolvedOutDir, base));
  const cacheVersion = createHash("sha256").update(precache.join("\n")).digest("hex").slice(0, 12);
  await writeFile(join(resolvedOutDir, "sw.js"), renderServiceWorker(precache, cacheVersion), "utf8");
  console.log(`Generated service worker (${precache.length} exact build assets; cache ${cacheVersion}).`);
}
