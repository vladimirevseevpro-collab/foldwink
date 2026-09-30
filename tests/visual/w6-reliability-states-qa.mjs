/** Render W6 loading and destructive-reset states at required acceptance sizes. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = process.env.FOLDWINK_E2E_URL ?? "http://localhost:4175/";
const evidenceDir = resolve("reports/w6-offline-reliability-2026-09-14/visual");
const viewports = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "tablet-1024x768", width: 1024, height: 768 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

function assertNoHorizontalOverflow(metrics, state, viewport) {
  if (metrics.width > metrics.viewport + 1) {
    throw new Error(`${viewport.name} ${state}: horizontal overflow ${JSON.stringify(metrics)}`);
  }
}

async function pageMetrics(page) {
  return page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
}

await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const viewport of viewports) {
    const unavailableContext = await browser.newContext({ viewport });
    const unavailablePage = await unavailableContext.newPage();
    await unavailablePage.addInitScript(() => localStorage.setItem("foldwink:onboarded", "true"));
    await unavailablePage.route("**/runtime-content/v1/**", (route) => route.abort("failed"));
    await unavailablePage.goto(baseUrl);
    await unavailablePage.getByText("Puzzle content unavailable", { exact: true }).waitFor({ timeout: 20_000 });
    assertNoHorizontalOverflow(await pageMetrics(unavailablePage), "content-unavailable", viewport);
    await unavailablePage.screenshot({
      path: resolve(evidenceDir, `content-unavailable-${viewport.name}.png`),
      fullPage: false,
    });
    await unavailableContext.close();

    const resetContext = await browser.newContext({ viewport });
    const resetPage = await resetContext.newPage();
    await resetPage.addInitScript(() => localStorage.setItem("foldwink:onboarded", "true"));
    await resetPage.goto(baseUrl);
    await resetPage.getByTestId("menu-today-card").waitFor({ timeout: 20_000 });
    await resetPage.getByRole("button", { name: "About · Privacy", exact: true }).click();
    const resetButton = resetPage.getByRole("button", { name: "Reset all local Foldwink data" });
    await resetButton.scrollIntoViewIfNeeded();
    await resetButton.click();
    await resetPage.getByText("Tap again to reset all data", { exact: false }).waitFor();
    assertNoHorizontalOverflow(await pageMetrics(resetPage), "reset-confirmation", viewport);
    await resetPage.screenshot({
      path: resolve(evidenceDir, `reset-confirmation-${viewport.name}.png`),
      fullPage: false,
    });

    await resetPage.evaluate(() => {
      const originalDelete = globalThis.caches.delete.bind(globalThis.caches);
      globalThis.caches.delete = async (name) => {
        if (name.startsWith("foldwink-")) {
          await new Promise((resolveDelay) => window.setTimeout(resolveDelay, 1200));
          throw new Error("W6 visual fixture: simulated cache deletion failure");
        }
        return originalDelete(name);
      };
    });
    await resetButton.click();
    await resetPage.getByText("Clearing local data…", { exact: true }).waitFor();
    assertNoHorizontalOverflow(await pageMetrics(resetPage), "reset-busy", viewport);
    await resetPage.screenshot({
      path: resolve(evidenceDir, `reset-busy-${viewport.name}.png`),
      fullPage: false,
    });
    await resetPage.getByText("Could not clear every local store", { exact: false }).waitFor({ timeout: 10_000 });
    assertNoHorizontalOverflow(await pageMetrics(resetPage), "reset-failed", viewport);
    await resetPage.screenshot({
      path: resolve(evidenceDir, `reset-failed-${viewport.name}.png`),
      fullPage: false,
    });
    await resetContext.close();
  }
} finally {
  await browser.close();
}

console.log(`W6 reliability-state screenshots written to ${evidenceDir}`);
