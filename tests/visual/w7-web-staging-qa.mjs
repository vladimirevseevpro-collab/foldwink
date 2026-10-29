/** Verify the frozen W7 web pilot as served by GitHub Pages and write rendered evidence. */
import { chromium } from "playwright";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { URL } from "node:url";

import { currentPilotManifestPath, evidenceToken } from "../../scripts/lib/web-pilot.mjs";

const manifestPath = resolve(
  process.env.FOLDWINK_PILOT_MANIFEST ?? (await currentPilotManifestPath()),
);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const playableUrl = process.env.FOLDWINK_PILOT_URL ?? manifest.url;
const publicUrl = new URL("../../", playableUrl).href;
const evidenceDir = resolve(`reports/w7-web-pilot-${manifest.version}`);
const recordPath = resolve(
  `docs/reports/assets/FOLDWINK_W7_WEB_PILOT_STAGING_V${evidenceToken(manifest.version)}.json`,
);

const profiles = [
  { name: "desktop-1440x900", width: 1440, height: 900, lang: "en", submit: "Submit", about: "About · Privacy" },
  { name: "tablet-1024x768", width: 1024, height: 768, lang: "de", submit: "Bestätigen", about: "Über · Datenschutz" },
  { name: "mobile-390x844", width: 390, height: 844, lang: "ru", submit: "Подтвердить", about: "О проекте · Приватность" },
];

const poolDirs = {
  en: resolve("puzzles/pool"),
  de: resolve("puzzles/de/pool"),
  ru: resolve("puzzles/ru/pool"),
};

async function loadPool(lang) {
  const directory = poolDirs[lang];
  const files = (await readdir(directory)).filter((name) => name.endsWith(".json"));
  return Promise.all(
    files.map(async (name) => JSON.parse(await readFile(resolve(directory, name), "utf8"))),
  );
}

const pools = Object.fromEntries(
  await Promise.all(Object.keys(poolDirs).map(async (lang) => [lang, await loadPool(lang)])),
);

function attachDiagnostics(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`PAGE ERROR ${error.message}`));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      const source = message.location().url;
      errors.push(
        `${message.type().toUpperCase()} ${message.text()}${source ? ` @ ${source}` : ""}`,
      );
    }
  });
  return errors;
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    viewportHeight: document.documentElement.clientHeight,
    documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    documentHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  }));
  if (metrics.documentWidth > metrics.viewportWidth + 1) {
    throw new Error(`${label}: horizontal overflow ${JSON.stringify(metrics)}`);
  }
  return metrics;
}

// The pool on disk may have moved on since the freeze, but the boards a
// frozen Daily serves are never removed, so the signature still resolves.
async function resolveRenderedPuzzle(page, lang) {
  const items = await page
    .locator('[role="grid"] button[data-key]')
    .evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("data-key")).filter(Boolean),
    );
  if (items.length !== 16) throw new Error(`${lang}: expected 16 cards, got ${items.length}`);
  const signature = [...items].sort().join("\u0000");
  const puzzle = pools[lang].find(
    (candidate) =>
      [...candidate.groups.flatMap((group) => group.items)].sort().join("\u0000") === signature,
  );
  if (!puzzle) throw new Error(`${lang}: rendered daily puzzle was not found in the pool`);
  return puzzle;
}

await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch();
const results = [];

try {
  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      reducedMotion: "reduce",
      locale: profile.lang === "de" ? "de-DE" : profile.lang === "ru" ? "ru-RU" : "en-US",
    });
    const main = await context.newPage();
    const publicResponse = await main.goto(publicUrl, { waitUntil: "domcontentloaded" });
    if (!publicResponse?.ok()) {
      throw new Error(
        `${profile.name}: main app returned ${publicResponse?.status() ?? "no response"}`,
      );
    }
    await main.close();

    const page = await context.newPage();
    const appErrors = attachDiagnostics(page);
    await page.addInitScript((lang) => {
      localStorage.setItem("foldwink:onboarded", "true");
      localStorage.setItem("foldwink:lang", lang);
    }, profile.lang);
    const playableResponse = await page.goto(playableUrl, { waitUntil: "domcontentloaded" });
    if (!playableResponse?.ok()) {
      throw new Error(
        `${profile.name}: pilot returned ${playableResponse?.status() ?? "no response"}`,
      );
    }
    await page.getByTestId("menu-today-card").waitFor({ state: "visible", timeout: 30_000 });
    await page.waitForFunction((lang) => document.documentElement.lang === lang, profile.lang, {
      timeout: 30_000,
    });
    // The pilot must install its own worker; the main app's worker (opened
    // first above) covers the parent path and must not stand in for it.
    await page.waitForFunction(
      async (scope) => {
        const registration = await navigator.serviceWorker.getRegistration(scope);
        return registration?.scope === scope && Boolean(registration.active);
      },
      playableUrl,
      { timeout: 30_000 },
    );
    const serviceWorkerScope = await page.evaluate(
      async (scope) => (await navigator.serviceWorker.getRegistration(scope))?.scope,
      playableUrl,
    );
    const menuMetrics = await assertNoHorizontalOverflow(page, `${profile.name} menu`);
    await page.screenshot({
      path: resolve(evidenceDir, `menu-${profile.lang}-${profile.name}.png`),
      fullPage: false,
    });

    await page.getByRole("button", { name: profile.about, exact: true }).click();
    const exportDownload = page.waitForEvent("download");
    await page.getByTestId("research-export").click();
    const downloadedExportPath = await (await exportDownload).path();
    if (!downloadedExportPath) {
      throw new Error(`${profile.name}: research export did not produce a local file`);
    }
    const researchExport = JSON.parse(await readFile(downloadedExportPath, "utf8"));
    if (researchExport.versions?.content !== manifest.versions.content) {
      throw new Error(
        `${profile.name}: research export content ${researchExport.versions?.content} does not match ${manifest.versions.content}`,
      );
    }
    await page.keyboard.press("Escape");

    await page.getByTestId("menu-daily-action").click();
    await page.locator('[role="grid"]').waitFor({ state: "visible", timeout: 30_000 });
    const puzzle = await resolveRenderedPuzzle(page, profile.lang);
    for (const item of puzzle.groups[0].items) {
      await page.getByRole("button", { name: item, exact: true }).click();
    }
    const submit = page.getByRole("button", { name: profile.submit, exact: true });
    if (!(await submit.isEnabled()))
      throw new Error(`${profile.name}: submit did not enable at four cards`);
    await submit.click();
    await page.waitForFunction(
      () => document.querySelectorAll('[role="grid"] button[data-state="solved"]').length === 4,
      undefined,
      { timeout: 10_000 },
    );
    await page.getByText(puzzle.groups[0].label, { exact: true }).first().waitFor({
      state: "visible",
      timeout: 10_000,
    });
    const gameMetrics = await assertNoHorizontalOverflow(page, `${profile.name} game`);
    await page.screenshot({
      path: resolve(evidenceDir, `game-correct-${profile.lang}-${profile.name}.png`),
      fullPage: false,
    });

    if (appErrors.length > 0) {
      throw new Error(`${profile.name}: app browser diagnostics ${JSON.stringify({ appErrors })}`);
    }
    results.push({
      viewport: `${profile.width}x${profile.height}@100%`,
      language: profile.lang,
      publicStatus: publicResponse.status(),
      playableStatus: playableResponse.status(),
      serviceWorkerScope,
      puzzleId: puzzle.id,
      solvedCategory: puzzle.groups[0].label,
      researchExportVersion: researchExport.versions.app,
      menuMetrics,
      gameMetrics,
      consoleErrors: 0,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

const record = {
  schema: "foldwink-web-pilot-staging-verification-v1",
  verifiedAt: new Date().toISOString(),
  publicUrl,
  playableUrl,
  channel: manifest.channel,
  artifact: {
    version: manifest.version,
    treeSha256: manifest.tree.treeSha256,
    files: manifest.tree.files,
    bytes: manifest.tree.bytes,
  },
  results,
  screenshots: profiles.flatMap((profile) =>
    [`menu-${profile.lang}-${profile.name}.png`, `game-correct-${profile.lang}-${profile.name}.png`].map(
      (name) => relative(process.cwd(), resolve(evidenceDir, name)).split("\\").join("/"),
    ),
  ),
};

await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
console.log(`W7 web pilot verified at three viewports; evidence: ${recordPath}`);
