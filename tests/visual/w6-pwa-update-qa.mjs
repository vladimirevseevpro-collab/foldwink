/** Render the player-controlled PWA update notice at required acceptance sizes. */
import { chromium } from "playwright";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = process.env.FOLDWINK_E2E_URL ?? "http://localhost:4175/";
const evidenceDir = resolve("reports/w6-offline-reliability-2026-09-14/visual");
const fixture = resolve("dist/sw-test37.js");
const viewports = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "tablet-1024x768", width: 1024, height: 768 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

await mkdir(evidenceDir, { recursive: true });
const workerSource = await readFile(resolve("dist/sw.js"), "utf8");
await writeFile(
  fixture,
  `${workerSource.replace(/foldwink-precache-[a-f0-9]{12}/u, "foldwink-precache-visual37")}
// W6 visual fixture: an installed newer worker remains waiting.`,
  "utf8",
);

const browser = await chromium.launch();
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.setItem("foldwink:onboarded", "true"));
    await page.goto(baseUrl);
    await page.getByTestId("menu-today-card").waitFor({ timeout: 20_000 });
    await page.evaluate(async () => navigator.serviceWorker.ready);
    await page.reload();
    await page.getByTestId("menu-today-card").waitFor({ timeout: 20_000 });
    await page.evaluate(async () => {
      await navigator.serviceWorker.register("./sw-test37.js", { scope: "./" });
    });
    await page.getByTestId("pwa-update-notice").waitFor({ timeout: 15_000 });
    const metrics = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    }));
    if (metrics.width > metrics.viewport + 1) {
      throw new Error(`${viewport.name}: horizontal overflow ${JSON.stringify(metrics)}`);
    }
    await page.screenshot({
      path: resolve(evidenceDir, `update-menu-${viewport.name}.png`),
      fullPage: false,
    });
    await context.close();
  }
} finally {
  await browser.close();
  await rm(fixture, { force: true });
}

console.log(`W6 update notice screenshots written to ${evidenceDir}`);
