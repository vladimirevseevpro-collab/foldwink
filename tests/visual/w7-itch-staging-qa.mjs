/** Verify the immutable W7 candidate as served by itch.io and write rendered evidence. */
import { chromium } from "playwright";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const publicUrl =
  process.env.FOLDWINK_ITCH_PUBLIC_URL ?? "https://neural-void.itch.io/foldwink";
const uploadId = Number(process.env.FOLDWINK_ITCH_UPLOAD_ID ?? "19242763");
const buildId = Number(process.env.FOLDWINK_ITCH_BUILD_ID ?? "1984826");
const playableIdentity = `${uploadId}-${buildId}`;
const playableUrl =
  process.env.FOLDWINK_ITCH_PLAYABLE_URL ??
  `https://html.itch.zone/html/${playableIdentity}/index.html`;
const evidenceDir = resolve("reports/w7-balance-retention-2026-09-14/itch-staging");
const recordPath = resolve("docs/reports/assets/FOLDWINK_W7_ITCH_STAGING_VERIFICATION.json");
const manifestPath = resolve(
  process.env.FOLDWINK_PILOT_MANIFEST ??
    "docs/reports/assets/FOLDWINK_W7_PILOT_BUILD_CANDIDATE_V084.manifest.json",
);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

const profiles = [
  {
    name: "desktop-1440x900",
    width: 1440,
    height: 900,
    lang: "en",
    submit: "Submit",
    about: "About · Privacy",
    catalog: "1,000 puzzles",
  },
  {
    name: "tablet-1024x768",
    width: 1024,
    height: 768,
    lang: "de",
    submit: "Bestätigen",
    about: "Über · Datenschutz",
    catalog: "1.000 Rätsel",
  },
  {
    name: "mobile-390x844",
    width: 390,
    height: 844,
    lang: "ru",
    submit: "Подтвердить",
    about: "О проекте · Приватность",
    catalog: "1 000 пазлов",
  },
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
  if (!puzzle)
    throw new Error(`${lang}: rendered daily puzzle was not found in the frozen pool`);
  return puzzle;
}

await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch();
const results = [];
let publicRunGameTarget;
let publicEmbedWarnings;

try {
  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      reducedMotion: "reduce",
      locale: profile.lang === "de" ? "de-DE" : profile.lang === "ru" ? "ru-RU" : "en-US",
    });
    const listing = await context.newPage();
    const listingErrors = attachDiagnostics(listing);
    const listingResponse = await listing.goto(publicUrl, { waitUntil: "domcontentloaded" });
    if (!listingResponse?.ok()) {
      throw new Error(
        `${profile.name}: public page returned ${listingResponse?.status() ?? "no response"}`,
      );
    }
    const publicCopy = listing.getByText("3,000 curated puzzles", { exact: false }).first();
    await publicCopy.waitFor({
      state: "visible",
      timeout: 20_000,
    });
    await listing.getByText("Run game", { exact: true }).waitFor({ state: "visible" });
    const listingMetrics = await assertNoHorizontalOverflow(listing, `${profile.name} listing`);
    await listing.screenshot({
      path: resolve(evidenceDir, `listing-${profile.name}.png`),
      fullPage: false,
    });
    await publicCopy.scrollIntoViewIfNeeded();
    await listing.screenshot({
      path: resolve(evidenceDir, `listing-copy-${profile.name}.png`),
      fullPage: false,
    });

    const page = await context.newPage();
    const appErrors = attachDiagnostics(page);
    await page.addInitScript((lang) => {
      localStorage.setItem("foldwink:onboarded", "true");
      localStorage.setItem("foldwink:lang", lang);
    }, profile.lang);
    const playableResponse = await page.goto(playableUrl, { waitUntil: "domcontentloaded" });
    if (!playableResponse?.ok()) {
      throw new Error(
        `${profile.name}: playable returned ${playableResponse?.status() ?? "no response"}`,
      );
    }
    await page.getByTestId("menu-today-card").waitFor({ state: "visible", timeout: 30_000 });
    await page.waitForFunction((lang) => document.documentElement.lang === lang, profile.lang, {
      timeout: 30_000,
    });
    const catalogCount = page.getByText(profile.catalog, { exact: true });
    await catalogCount.waitFor({
      state: "visible",
      timeout: 30_000,
    });
    const menuMetrics = await assertNoHorizontalOverflow(page, `${profile.name} menu`);
    await page.screenshot({
      path: resolve(evidenceDir, `menu-${profile.lang}-${profile.name}.png`),
      fullPage: false,
    });
    await catalogCount.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: resolve(evidenceDir, `menu-footer-${profile.lang}-${profile.name}.png`),
      fullPage: false,
    });

    await page.getByRole("button", { name: profile.about, exact: true }).click();
    const exportDownload = page.waitForEvent("download");
    await page.getByTestId("research-export").click();
    const downloadedExport = await exportDownload;
    const downloadedExportPath = await downloadedExport.path();
    if (!downloadedExportPath) {
      throw new Error(`${profile.name}: research export did not produce a local file`);
    }
    const researchExport = JSON.parse(await readFile(downloadedExportPath, "utf8"));
    if (researchExport.versions?.app !== manifest.versions.app) {
      throw new Error(
        `${profile.name}: research export app version ${researchExport.versions?.app} does not match artifact ${manifest.versions.app}`,
      );
    }
    if (researchExport.versions?.content !== manifest.versions.content) {
      throw new Error(
        `${profile.name}: research export content version ${researchExport.versions?.content} does not match artifact ${manifest.versions.content}`,
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
      throw new Error(
        `${profile.name}: app browser diagnostics ${JSON.stringify({ appErrors })}`,
      );
    }
    results.push({
      viewport: `${profile.width}x${profile.height}@100%`,
      language: profile.lang,
      publicStatus: listingResponse.status(),
      playableStatus: playableResponse.status(),
      puzzleId: puzzle.id,
      solvedCategory: puzzle.groups[0].label,
      researchExportVersion: researchExport.versions.app,
      listingMetrics,
      menuMetrics,
      gameMetrics,
      consoleErrors: 0,
      listingDiagnostics: listingErrors,
    });
    await context.close();
  }

  const embedContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const embedPage = await embedContext.newPage();
  const embedErrors = attachDiagnostics(embedPage);
  await embedPage.goto(publicUrl, { waitUntil: "domcontentloaded" });
  await embedPage.getByText("Run game", { exact: true }).click();
  const liveFrame = embedPage.locator(`iframe[src*="${playableIdentity}"]`).first();
  await liveFrame.waitFor({ state: "visible", timeout: 30_000 });
  publicRunGameTarget = await liveFrame.getAttribute("src");
  if (!publicRunGameTarget?.includes(playableIdentity)) {
    throw new Error(`public Run game targeted ${JSON.stringify(publicRunGameTarget)}`);
  }
  publicEmbedWarnings = embedErrors;
  const unexpectedEmbedDiagnostics = embedErrors.filter(
    (message) =>
      ![
        "Unrecognized feature: 'monetization'.",
        "Unrecognized feature: 'xr'.",
        "Unrecognized feature: 'web-share'.",
        "Allow attribute will take precedence over 'allowfullscreen'.",
        "status of 429",
      ].some((expected) => message.includes(expected)),
  );
  if (unexpectedEmbedDiagnostics.length > 0) {
    throw new Error(
      `public Run game diagnostics ${JSON.stringify(unexpectedEmbedDiagnostics)}`,
    );
  }
  await embedContext.close();
} finally {
  await browser.close();
}

const record = {
  verifiedAt: new Date().toISOString(),
  publicUrl,
  playableUrl,
  publicRunGameTarget,
  publicEmbedWarnings,
  itch: {
    project: "neural-void/foldwink",
    channel: "pilot-2026-09",
    uploadId,
    buildId,
  },
  artifact: {
    version: manifest.versions.app,
    zipSha256: manifest.artifact.sha256,
    treeSha256: manifest.dist.treeSha256,
    files: manifest.dist.files,
    bytes: manifest.dist.bytes,
  },
  results,
  screenshots: profiles.flatMap((profile) => [
    `reports/w7-balance-retention-2026-09-14/itch-staging/listing-${profile.name}.png`,
    `reports/w7-balance-retention-2026-09-14/itch-staging/listing-copy-${profile.name}.png`,
    `reports/w7-balance-retention-2026-09-14/itch-staging/menu-${profile.lang}-${profile.name}.png`,
    `reports/w7-balance-retention-2026-09-14/itch-staging/menu-footer-${profile.lang}-${profile.name}.png`,
    `reports/w7-balance-retention-2026-09-14/itch-staging/game-correct-${profile.lang}-${profile.name}.png`,
  ]),
};

await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
console.log(`W7 itch staging verified at three viewports; evidence: ${recordPath}`);
