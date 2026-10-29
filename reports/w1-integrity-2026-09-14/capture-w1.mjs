import { chromium } from "playwright";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = process.env.FOLDWINK_E2E_URL ?? "http://127.0.0.1:5187/";
const here = path.dirname(fileURLToPath(import.meta.url));
const poolDir = path.resolve(here, "../../puzzles/pool");
const screenshotsDir = path.join(here, "screenshots");

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
  return pool.find((puzzle) => puzzle.groups.flatMap((group) => group.items).every((item) => visible.has(item)));
}

async function geometry(page) {
  return page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    scrollX,
    document: {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    },
    focused: document.activeElement?.textContent?.trim().slice(0, 80) ?? null,
    dialogs: document.querySelectorAll('[role="dialog"]').length,
    overflowElements: [...document.querySelectorAll("body *")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          className: typeof element.className === "string" ? element.className : "",
          text: element.textContent?.trim().slice(0, 60) ?? "",
          left: Math.round(rect.left + scrollX),
          right: Math.round(rect.right + scrollX),
          width: Math.round(rect.width),
        };
      })
      .filter((entry) => entry.right > innerWidth + 1 || entry.left < -1)
      .slice(0, 12),
  }));
}

await mkdir(screenshotsDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];

try {
  for (const [name, width, height] of profiles) {
    const context = await browser.newContext({
      viewport: { width, height },
      locale: "en-US",
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12_000);
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("foldwink:onboarded", "true");
      localStorage.setItem("foldwink:lang", "en");
    });
    await page.goto(baseUrl, { waitUntil: "networkidle" });

    await page.getByRole("button", { name: /Mastery Challenge/ }).click();
    await page.getByRole("dialog", { name: "Mastery Challenge" }).waitFor();
    const masteryPath = path.join(screenshotsDir, `${name}-mastery.png`);
    await page.screenshot({ path: masteryPath });
    await page.keyboard.press("Shift+Tab");
    const reverseWrapFocus = await page.evaluate(() => document.activeElement?.textContent?.trim());
    await page.keyboard.press("Tab");
    const forwardWrapFocus = await page.evaluate(() => document.activeElement?.textContent?.trim());
    const masteryEvidence = {
      profile: name,
      state: "mastery",
      path: masteryPath,
      focusTrap: { reverseWrapFocus, forwardWrapFocus },
      ...(await geometry(page)),
    };
    await page.getByRole("button", { name: "Not now", exact: true }).click();
    masteryEvidence.returnFocus = await page.evaluate(() => document.activeElement?.textContent?.trim());
    report.push(masteryEvidence);

    await page.getByRole("button", { name: "Easy puzzle", exact: true }).click();
    await page.locator('[data-state="idle"]').first().waitFor();
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-state="idle"]').length === 16 &&
        [...document.querySelectorAll('[data-state="idle"]')].every(
          (element) => Number(getComputedStyle(element).opacity) > 0.99,
        ),
    );
    const words = await page.locator('[data-state="idle"]').allTextContents();
    const puzzle = findPuzzle(words);
    if (!puzzle) throw new Error(`${name}: displayed puzzle was not found in the local EN pool`);

    const wrongQuartet = puzzle.groups.map((group) => group.items[0]);
    for (const word of wrongQuartet) {
      await page.getByRole("button", { name: word, exact: true }).click();
    }
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await page.waitForTimeout(520);
    for (const word of [...wrongQuartet].reverse()) {
      await page.getByRole("button", { name: word, exact: true }).click();
    }
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await page.getByText("Already tried — change one card", { exact: true }).waitFor();
    const repeatPath = path.join(screenshotsDir, `${name}-repeat-guess.png`);
    await page.screenshot({ path: repeatPath });
    const statusLabels = await page.locator('[role="status"]').evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("aria-label")).filter(Boolean),
    );
    report.push({
      profile: name,
      state: "repeat-guess",
      path: repeatPath,
      puzzleId: puzzle.id,
      repeatMessageVisible: true,
      statusLabels,
      ...(await geometry(page)),
    });

    // Remove the compatibility session mirror before reload: the four-card
    // selection must still resume from the authoritative IndexedDB aggregate.
    await page.evaluate(() => localStorage.removeItem("foldwink:active-session"));
    await page.reload({ waitUntil: "networkidle" });
    await page.locator('[data-state="selected"]').first().waitFor();
    const resumedPath = path.join(screenshotsDir, `${name}-indexeddb-resume.png`);
    await page.screenshot({ path: resumedPath });
    report.push({
      profile: name,
      state: "indexeddb-resume",
      path: resumedPath,
      selectedCards: await page.locator('[data-state="selected"]').count(),
      statusLabels: await page.locator('[role="status"]').evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("aria-label")).filter(Boolean),
      ),
      ...(await geometry(page)),
    });

    for (const word of wrongQuartet) {
      await page.getByRole("button", { name: word, exact: true }).click();
    }
    for (const group of puzzle.groups) {
      for (const word of group.items) {
        await page.getByRole("button", { name: word, exact: true }).click();
      }
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await page.waitForTimeout(160);
    }
    await page.getByTestId("result-screen").waitFor();
    await page.getByTestId("result-reward-receipt").waitFor();
    const rewardPath = path.join(screenshotsDir, `${name}-reward-receipt.png`);
    await page.screenshot({ path: rewardPath, fullPage: true });
    const profile = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("foldwink:archivistProfile") ?? "null"),
    );
    const aggregate = await page.evaluate(async () => {
      const { IndexedDbGameRepository } = await import("/src/persistence/gameRepository.ts");
      const repository = new IndexedDbGameRepository();
      const value = await repository.load();
      repository.close();
      return value;
    });
    report.push({
      profile: name,
      state: "reward-receipt",
      path: rewardPath,
      awardedXp: profile?.xp ?? null,
      rewardKeys: profile?.consumedRewardKeys ?? [],
      indexedDb: {
        xp: aggregate?.archivistProfile.xp ?? null,
        rewardKeys: aggregate?.archivistProfile.consumedRewardKeys ?? [],
        activeAttemptId: aggregate?.activeSession?.active.attemptId ?? null,
        terminalAttemptCount: Object.keys(aggregate?.terminalAttempts ?? {}).length,
        statsGamesPlayed: aggregate?.stats.gamesPlayed ?? null,
      },
      ...(await geometry(page)),
    });

    const clearResult = await page.evaluate(async () => {
      const { clearAllLocalData } = await import("/src/stats/persistence.ts");
      const { IndexedDbGameRepository } = await import("/src/persistence/gameRepository.ts");
      await clearAllLocalData();
      const repository = new IndexedDbGameRepository();
      const aggregateAfterClear = await repository.load();
      repository.close();
      return {
        indexedDbCleared: aggregateAfterClear === null,
        remainingFoldwinkKeys: Object.keys(localStorage).filter((key) => key.startsWith("foldwink:")),
      };
    });
    report.push({ profile: name, state: "clear-all-data", ...clearResult });

    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(here, "visual-evidence.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl, report }, null, 2),
);
console.log(JSON.stringify(report, null, 2));
