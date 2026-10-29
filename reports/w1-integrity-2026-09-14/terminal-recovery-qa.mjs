import { chromium } from "playwright";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = process.env.FOLDWINK_E2E_URL ?? "http://127.0.0.1:5187/";
const here = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(here, "screenshots");
const poolDir = path.resolve(here, "../../puzzles/pool");
const pool = await Promise.all(
  (await readdir(poolDir))
    .filter((file) => file.endsWith(".json"))
    .map(async (file) => JSON.parse(await readFile(path.join(poolDir, file), "utf8"))),
);
const profiles = [
  ["desktop", 1440, 900],
  ["tablet", 1024, 768],
  ["mobile", 390, 844],
].filter(([name]) => !process.env.FOLDWINK_PROFILE || process.env.FOLDWINK_PROFILE === name);

function findPuzzle(words) {
  const visible = new Set(words.map((word) => word.trim()));
  return pool.find((puzzle) =>
    puzzle.groups.flatMap((group) => group.items).every((item) => visible.has(item)),
  );
}

async function readAggregate(page) {
  return page.evaluate(async () => {
    const { IndexedDbGameRepository } = await import("/src/persistence/gameRepository.ts");
    const repository = new IndexedDbGameRepository();
    const value = await repository.load();
    repository.close();
    return value;
  });
}

async function geometry(page) {
  return page.evaluate(() => ({
    width: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    focused: document.activeElement?.textContent?.trim().slice(0, 80) ?? null,
  }));
}

await mkdir(screenshotsDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];

try {
  for (const [name, width, height] of profiles) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("foldwink:onboarded", "true");
      localStorage.setItem("foldwink:lang", "en");
    });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Easy puzzle", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-state="idle"]').length === 16);
    const words = await page.locator('[data-state="idle"]').allTextContents();
    const puzzle = findPuzzle(words);
    if (!puzzle) throw new Error(`${name}: puzzle fixture not found`);
    for (const group of puzzle.groups) {
      for (const word of group.items) {
        await page.getByRole("button", { name: word, exact: true }).click();
      }
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await page.waitForTimeout(180);
    }
    await page.getByTestId("result-screen").waitFor();
    const beforeReload = await readAggregate(page);
    await page.reload({ waitUntil: "networkidle" });
    await page.getByTestId("result-screen").waitFor();
    const afterReload = await readAggregate(page);
    const restoredPath = path.join(screenshotsDir, `${name}-terminal-result-restored.png`);
    await page.screenshot({ path: restoredPath, fullPage: true });
    report.push({
      profile: name,
      state: "terminal-result-restored",
      path: restoredPath,
      pendingBeforeReload: beforeReload?.pendingResultAttemptId ?? null,
      pendingAfterReload: afterReload?.pendingResultAttemptId ?? null,
      xpBeforeReload: beforeReload?.archivistProfile.xp ?? null,
      xpAfterReload: afterReload?.archivistProfile.xp ?? null,
      terminalCountBefore: Object.keys(beforeReload?.terminalAttempts ?? {}).length,
      terminalCountAfter: Object.keys(afterReload?.terminalAttempts ?? {}).length,
      rewardCountBefore: Object.keys(beforeReload?.archivistProfile.rewardReceipts ?? {}).length,
      rewardCountAfter: Object.keys(afterReload?.archivistProfile.rewardReceipts ?? {}).length,
      ...(await geometry(page)),
    });

    await page.locator('[data-testid="result-cta-stack"] button').last().click();
    await page.waitForTimeout(250);
    const acknowledged = await readAggregate(page);
    report.push({
      profile: name,
      state: "terminal-result-acknowledged",
      pendingResultAttemptId: acknowledged?.pendingResultAttemptId ?? null,
      terminalCount: Object.keys(acknowledged?.terminalAttempts ?? {}).length,
      xp: acknowledged?.archivistProfile.xp ?? null,
    });
    await context.close();

    const corruptContext = await browser.newContext({ viewport: { width, height }, acceptDownloads: true });
    const corruptPage = await corruptContext.newPage();
    await corruptPage.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("foldwink:onboarded", "true");
      localStorage.setItem("foldwink:lang", "en");
    });
    await corruptPage.goto(baseUrl, { waitUntil: "networkidle" });
    await corruptPage.evaluate(async () => {
      const request = indexedDB.open("foldwink", 1);
      const db = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const transaction = db.transaction("game-aggregate", "readwrite");
      transaction.objectStore("game-aggregate").put(
        { schemaVersion: 2, profileRevision: -4, stats: { gamesPlayed: Number.NaN } },
        "profile",
      );
      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
    });
    await corruptPage.reload({ waitUntil: "networkidle" });
    await corruptPage.getByTestId("persistence-recovery").waitFor();
    const corruptPath = path.join(screenshotsDir, `${name}-corrupt-recovery.png`);
    await corruptPage.screenshot({ path: corruptPath, fullPage: true });
    const recoveryKeys = await corruptPage.evaluate(() =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith("foldwink:corrupt-aggregate-recovery:v1:"),
      ),
    );
    const downloadPromise = corruptPage.waitForEvent("download");
    await corruptPage.getByRole("button", { name: "Download copy", exact: true }).click();
    const download = await downloadPromise;
    const downloadPath = path.join(here, `${name}-${download.suggestedFilename()}`);
    await download.saveAs(downloadPath);
    report.push({
      profile: name,
      state: "corrupt-recovery",
      path: corruptPath,
      recoveryKeys: recoveryKeys.length,
      downloadPath,
      ...(await geometry(corruptPage)),
    });
    if (name === "desktop") {
      const stalePage = await corruptContext.newPage();
      await stalePage.goto(baseUrl, { waitUntil: "networkidle" });
      await stalePage.getByTestId("persistence-recovery").waitFor();
      corruptPage.once("dialog", (dialog) => dialog.accept());
      await corruptPage.getByRole("button", { name: "Clear record", exact: true }).click();
      await corruptPage.waitForLoadState("networkidle");
      await corruptPage.getByTestId("persistence-recovery").waitFor({ state: "detached" });
      await corruptPage.getByRole("button", { name: "Easy puzzle", exact: true }).waitFor();
      await corruptPage.waitForTimeout(500);
      stalePage.once("dialog", (dialog) => dialog.accept());
      await stalePage.getByRole("button", { name: "Clear record", exact: true }).click();
      await stalePage.waitForTimeout(250);
      const aggregateAfterStaleClear = await readAggregate(stalePage);
      report.push({
        profile: name,
        state: "corrupt-clear-cas",
        staleBannerRemains: await stalePage.getByTestId("persistence-recovery").isVisible(),
        validAggregateSurvived: aggregateAfterStaleClear?.schemaVersion === 2,
      });
    }
    await corruptContext.close();
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(here, "terminal-recovery-evidence.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl, report }, null, 2),
);
console.log(JSON.stringify(report, null, 2));
