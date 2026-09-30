import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");
const language = process.env.FOLDWINK_BUDGET_LANG ?? "en";
const kib = 1024;

const limits = {
  initialJsAndPuzzleGzip: 250 * kib,
  cssGzip: 25 * kib,
  initialFontsAndRasterGzip: 180 * kib,
};

function assetPath(url) {
  const withoutQuery = url.split(/[?#]/, 1)[0].replace(/^\.\//, "").replace(/^\//, "");
  return join(dist, withoutQuery);
}

async function gzipBytes(file) {
  return gzipSync(await readFile(file)).byteLength;
}

function uniqueMatches(html, expression) {
  return [...new Set([...html.matchAll(expression)].map((match) => match[1]))];
}

const html = await readFile(join(dist, "index.html"), "utf8");
const moduleUrls = [
  ...uniqueMatches(html, /<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["']/giu),
  ...uniqueMatches(html, /<link[^>]+rel=["']modulepreload["'][^>]+href=["']([^"']+)["']/giu),
];
const cssUrls = uniqueMatches(
  html,
  /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/giu,
);
const preloadUrls = uniqueMatches(
  html,
  /<link[^>]+rel=["']preload["'][^>]+href=["']([^"']+)["']/giu,
).filter((url) => /\.(?:woff2?|png|jpe?g|webp|avif)(?:[?#]|$)/iu.test(url));

const runtimeManifestPath = join(dist, "runtime-content", "v1", `manifest.${language}.json`);
const runtimeManifest = JSON.parse(await readFile(runtimeManifestPath, "utf8"));
if (runtimeManifest.language !== language || !runtimeManifest.boot?.path) {
  throw new Error(`Runtime manifest for ${language} is missing a valid boot asset.`);
}
const bootPath = join(dirname(runtimeManifestPath), runtimeManifest.boot.path);
const runtimeManifestGzip = await gzipBytes(runtimeManifestPath);

const moduleEntries = await Promise.all(
  moduleUrls.map(async (url) => ({ url, gzip: await gzipBytes(assetPath(url)) })),
);
const cssEntries = await Promise.all(
  cssUrls.map(async (url) => ({ url, gzip: await gzipBytes(assetPath(url)) })),
);
const preloadEntries = await Promise.all(
  preloadUrls.map(async (url) => ({ url, gzip: await gzipBytes(assetPath(url)) })),
);
const bootGzip = await gzipBytes(bootPath);

const sum = (entries) => entries.reduce((total, entry) => total + entry.gzip, 0);
const result = {
  language,
  initialModules: moduleEntries,
  runtimeManifest: { path: `./manifest.${language}.json`, gzip: runtimeManifestGzip },
  bootPuzzle: { path: runtimeManifest.boot.path, gzip: bootGzip },
  css: cssEntries,
  initialFontsAndRaster: preloadEntries,
  totals: {
    initialJsAndPuzzleGzip: sum(moduleEntries) + runtimeManifestGzip + bootGzip,
    cssGzip: sum(cssEntries),
    initialFontsAndRasterGzip: sum(preloadEntries),
  },
  limits,
};

console.log(JSON.stringify(result, null, 2));

const failures = Object.entries(limits)
  .filter(([metric, limit]) => result.totals[metric] > limit)
  .map(
    ([metric, limit]) =>
      `${metric}: ${result.totals[metric]} bytes exceeds ${limit} bytes`,
  );
if (failures.length > 0) {
  throw new Error(`Foldwink build budget failed:\n${failures.join("\n")}`);
}
