import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import {
  BASE_URL,
  runCases,
  seedDismissedOnboarding,
  seedLocalStorage,
  stubStats,
  waitForMenu,
} from "../e2e/lib/harness.mjs";

const EVIDENCE_DIR = resolve("reports/w5-collection-share-transfer-2026-09-14/visual");
await mkdir(EVIDENCE_DIR, { recursive: true });

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "tablet-1024x768", width: 1024, height: 768 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

const PUZZLE_REF = {
  language: "en",
  puzzleId: "puzzle-0004",
  lineageId: "puzzle-0004",
  contentVersion: "catalog-2026-09-v1",
};

function challengeUrl() {
  const payload = {
    v: 2,
    kind: "official-challenge",
    puzzle: PUZZLE_REF,
    rulesVersion: 1,
    creatorResult: {
      result: "win",
      mistakesUsed: 1,
      winkUsed: false,
      durationBucket: "1-3m",
    },
  };
  return `${BASE_URL}#c=${Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")}`;
}

async function assertNoHorizontalOverflow(page, label) {
  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  if (Math.max(geometry.document, geometry.body) > geometry.viewport + 1) {
    throw new Error(`${label} horizontal overflow: ${JSON.stringify(geometry)}`);
  }
}

async function assertDialogFits(page, testId) {
  const dialog = page.getByTestId(testId);
  await dialog.waitFor({ state: "visible" });
  const box = await dialog.locator('[role="dialog"]').boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error(`${testId} geometry unavailable`);
  if (box.x < -1 || box.y < -1 || box.x + box.width > viewport.width + 1 || box.height > viewport.height + 1) {
    throw new Error(`${testId} escaped viewport: ${JSON.stringify({ box, viewport })}`);
  }
}

async function solvePuzzle0004(page) {
  const puzzle = JSON.parse(await readFile(resolve("puzzles/pool/puzzle-0004.json"), "utf8"));
  for (const group of puzzle.groups) {
    for (const item of group.items) {
      await page.locator(`button[aria-label="${item}"]`).first().click();
    }
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await page.waitForTimeout(80);
  }
  await page.getByTestId("result-screen").waitFor({ timeout: 3_000 });
}

async function openPassport(page) {
  await page.getByRole("button", { name: /Passport/u }).first().click();
  await page.getByTestId("open-profile-transfer").waitFor();
}

const cases = [];
for (const viewport of VIEWPORTS) {
  cases.push({
    name: `share sheet — ${viewport.name}`,
    viewport: { width: viewport.width, height: viewport.height },
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(challengeUrl());
      await page.locator('[data-fw-screen="game"]').waitFor({ timeout: 20_000 });
      await solvePuzzle0004(page);
      const trigger = page.getByTestId("share-result-button");
      await trigger.click();
      await assertDialogFits(page, "share-sheet-dialog");
      await assertNoHorizontalOverflow(page, "share sheet");
      await page.screenshot({ path: resolve(EVIDENCE_DIR, `share-${viewport.name}.png`) });
      await page.keyboard.press("Escape");
      await page.getByTestId("share-sheet-dialog").waitFor({ state: "detached" });
      if (!(await trigger.evaluate((node) => node === document.activeElement))) {
        throw new Error("share sheet did not return keyboard focus to its trigger");
      }
    },
  });

  cases.push({
    name: `profile transfer preview — ${viewport.name}`,
    viewport: { width: viewport.width, height: viewport.height },
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await openPassport(page);
      await page.getByTestId("open-profile-transfer").click();
      await assertDialogFits(page, "profile-transfer-dialog");
      const activeId = await page.evaluate(() => document.activeElement?.id ?? "");
      if (activeId !== "profile-import-file") {
        throw new Error(`profile transfer initial focus is ${activeId || "missing"}`);
      }

      const downloadPromise = page.waitForEvent("download");
      await page.getByTestId("profile-transfer-export").click();
      const download = await downloadPromise;
      const backupPath = await download.path();
      const backupText = await readFile(backupPath, "utf8");
      await page.getByTestId("profile-transfer-import-text").fill(backupText);
      await page.getByTestId("profile-transfer-preview-action").click();
      const preview = page.getByTestId("profile-transfer-preview");
      await preview.waitFor();
      await assertNoHorizontalOverflow(page, "profile transfer preview");
      await page.screenshot({ path: resolve(EVIDENCE_DIR, `transfer-top-${viewport.name}.png`) });
      await preview.evaluate((node) => node.scrollIntoView({ block: "end" }));
      await page.getByTestId("profile-transfer-commit").waitFor({ state: "visible" });
      await page.screenshot({ path: resolve(EVIDENCE_DIR, `transfer-commit-${viewport.name}.png`) });
    },
  });

  cases.push({
    name: `collection hierarchy — ${viewport.name}`,
    viewport: { width: viewport.width, height: viewport.height },
    fn: async ({ page }) => {
      const stats = {
        ...stubStats({ wins: 10, losses: 2, mediumWins: 5, mediumLosses: 1, totalMistakes: 8 }),
        solvedPuzzleIds: Array.from({ length: 12 }, (_, index) => `puzzle-${String(index + 1).padStart(4, "0")}`),
        flawlessWins: 4,
        winkUses: 2,
      };
      await seedLocalStorage(page, {
        "foldwink:onboarded": true,
        "foldwink:stats": stats,
      });
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await page.getByRole("button", { name: /^Stats$/u }).click();
      await page.getByTestId("stats-collection-progress").waitFor();
      await assertNoHorizontalOverflow(page, "stats collection");
      await page.screenshot({ path: resolve(EVIDENCE_DIR, `collection-stats-${viewport.name}.png`) });
      await page.getByRole("button", { name: /Back to menu/u }).click();
      await openPassport(page);
      await page.getByRole("tab", { name: /Stamp Album/u }).click();
      await page.getByTestId("passport-milestone-pages").waitFor();
      await assertNoHorizontalOverflow(page, "passport milestones");
      await page.screenshot({ path: resolve(EVIDENCE_DIR, `collection-passport-${viewport.name}.png`) });
    },
  });
}

await runCases("w5-visual-acceptance", cases);
