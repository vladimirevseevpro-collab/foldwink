import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = process.env.FOLDWINK_E2E_URL ?? "http://127.0.0.1:5187/";
const here = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(here, "screenshots");
const profiles = [
  ["desktop", 1440, 900],
  ["tablet", 1024, 768],
  ["mobile", 390, 844],
];

async function measure(page) {
  return page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    documentWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    alertText: document.querySelector('[role="alert"]')?.textContent?.trim() ?? null,
  }));
}

await mkdir(screenshotsDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];

try {
  for (const [name, width, height] of profiles) {
    const unavailableContext = await browser.newContext({ viewport: { width, height } });
    const unavailablePage = await unavailableContext.newPage();
    await unavailablePage.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("foldwink:onboarded", "true");
      Object.defineProperty(window, "indexedDB", { value: undefined, configurable: true });
    });
    await unavailablePage.goto(baseUrl, { waitUntil: "networkidle" });
    await unavailablePage.getByTestId("persistence-warning").waitFor();
    const unavailablePath = path.join(screenshotsDir, `${name}-storage-unavailable.png`);
    await unavailablePage.screenshot({ path: unavailablePath, fullPage: true });
    report.push({ profile: name, state: "unavailable", path: unavailablePath, ...(await measure(unavailablePage)) });
    await unavailableContext.close();

    const conflictContext = await browser.newContext({ viewport: { width, height } });
    const pageA = await conflictContext.newPage();
    await pageA.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("foldwink:onboarded", "true");
    });
    await pageA.goto(baseUrl, { waitUntil: "networkidle" });
    const pageB = await conflictContext.newPage();
    await pageB.goto(baseUrl, { waitUntil: "networkidle" });
    await Promise.all([
      pageA.getByRole("button", { name: "Easy puzzle", exact: true }).click(),
      pageB.getByRole("button", { name: "Easy puzzle", exact: true }).click(),
    ]);
    await Promise.race([
      pageA.getByTestId("persistence-warning").waitFor(),
      pageB.getByTestId("persistence-warning").waitFor(),
    ]);
    const warnedPage = (await pageA.getByTestId("persistence-warning").count()) > 0 ? pageA : pageB;
    await warnedPage.getByRole("button", { name: "Reload", exact: true }).waitFor();
    await warnedPage.waitForTimeout(650);
    const conflictPath = path.join(screenshotsDir, `${name}-storage-conflict.png`);
    await warnedPage.screenshot({ path: conflictPath, fullPage: true });
    report.push({ profile: name, state: "conflict", path: conflictPath, ...(await measure(warnedPage)) });
    await conflictContext.close();
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(here, "persistence-warning-evidence.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), report }, null, 2),
);
console.log(JSON.stringify(report, null, 2));
