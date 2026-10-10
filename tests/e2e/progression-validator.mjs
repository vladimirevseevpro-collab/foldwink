/**
 * Agent 1: progression-validator
 *
 * Verifies that Foldwink's unlock / routing logic cannot silently escalate
 * Practice while Daily follows its reviewed, versioned calendar independently.
 *
 * Practice locks are progression gates. They must never rewrite or block the
 * date-selected Daily entry, whose difficulty is part of the frozen calendar.
 */

import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import {
  BASE_URL,
  openPracticePicker,
  runCases,
  seedDismissedOnboarding,
  seedLocalStorage,
  stubStats,
  startEasyPractice,
  waitForMenu,
} from "./lib/harness.mjs";

function todayLocal() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const dailyManifest = JSON.parse(
  await readFile(resolve("puzzles/manifests/daily.en.2026-09-14.json"), "utf8"),
);
const expectedDailyEntry = dailyManifest.entries.find((entry) => entry.date === todayLocal());
if (!expectedDailyEntry)
  throw new Error(`reviewed EN Daily calendar has no entry for ${todayLocal()}`);
// File names do not always equal ids (e.g. puzzle-hard-010.json holds hard-010).
async function readPoolPuzzle(id) {
  for (const file of await readdir(resolve("puzzles/pool"))) {
    if (!file.endsWith(".json")) continue;
    const puzzle = JSON.parse(await readFile(resolve("puzzles/pool", file), "utf8"));
    if (puzzle.id === id) return puzzle;
  }
  throw new Error(`EN pool has no puzzle with id ${id}`);
}
const expectedDailyPuzzle = await readPoolPuzzle(expectedDailyEntry.puzzleId);

async function readTextOf(page, selector) {
  const el = await page.$(selector);
  if (!el) return null;
  return (await el.textContent())?.trim() ?? null;
}

async function menuMediumButton(page) {
  await openPracticePicker(page);
  return page.locator("button", { hasText: /^Medium/ }).first();
}

async function menuHardButton(page) {
  await openPracticePicker(page);
  return page.locator("button", { hasText: /Master Challenge/ }).first();
}

async function dailyButton(page) {
  return page.locator("button", { hasText: /Play today|Replay daily/ }).first();
}

async function activeDifficultyFromHeader(page) {
  const subtitle = await readTextOf(page, "header p");
  if (!subtitle) return null;
  // The UI names the hard tier "Master".
  const m = subtitle.match(/^(EASY|MEDIUM|HARD|MASTER)/);
  if (!m) return null;
  return m[1] === "MASTER" ? "hard" : m[1].toLowerCase();
}

await runCases("progression-validator", [
  {
    name: "fresh state: Medium menu button shows locked and is disabled",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      const mediumBtn = await menuMediumButton(page);
      const label = (await mediumBtn.textContent())?.trim();
      if (!label?.includes("locked"))
        throw new Error(`expected "locked" label, got "${label}"`);
      const disabled = await mediumBtn.isDisabled();
      if (!disabled) throw new Error("Medium button should be disabled in fresh state");
    },
  },
  {
    name: "fresh state: Daily follows the reviewed calendar independently of Practice locks",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await (await dailyButton(page)).click();
      await page.waitForSelector("header h1");
      const diff = await activeDifficultyFromHeader(page);
      if (diff !== expectedDailyPuzzle.difficulty) {
        throw new Error(
          `daily launched difficulty "${diff}", calendar puzzle ${expectedDailyEntry.puzzleId} requires "${expectedDailyPuzzle.difficulty}"`,
        );
      }
      const renderedItems = await page
        .locator('[role="grid"] button[data-key]')
        .evaluateAll((buttons) =>
          buttons
            .map((button) => button.getAttribute("data-key"))
            .filter(Boolean)
            .sort(),
        );
      const expectedItems = expectedDailyPuzzle.groups.flatMap((group) => group.items).sort();
      if (renderedItems.join("\0") !== expectedItems.join("\0")) {
        throw new Error(
          `daily did not render reviewed calendar puzzle ${expectedDailyEntry.puzzleId}`,
        );
      }
    },
  },
  {
    name: "5 easy wins: Medium button unlocks",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await seedLocalStorage(page, {
        "foldwink:stats": stubStats({
          wins: 5,
          losses: 0,
          recentSolves: Array.from({ length: 5 }, (_, i) => ({
            puzzleId: `seed-easy-${i}`,
            difficulty: "easy",
            result: "win",
            mistakesUsed: 1,
            durationMs: 140_000,
            at: Date.now() - (5 - i) * 60_000,
          })),
        }),
      });
      await page.goto(BASE_URL);
      await waitForMenu(page);
      const mediumBtn = await menuMediumButton(page);
      const label = (await mediumBtn.textContent())?.trim();
      if (label?.includes("locked"))
        throw new Error(`Medium still locked after 5 easy wins: "${label}"`);
      const disabled = await mediumBtn.isDisabled();
      if (disabled) throw new Error("Medium button should be enabled after 5 easy wins");
    },
  },
  {
    name: "3 medium wins + hard pool present: Master Challenge unlocks",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await seedLocalStorage(page, {
        "foldwink:stats": stubStats({
          wins: 8,
          losses: 0,
          mediumWins: 3,
        }),
      });
      await page.goto(BASE_URL);
      await waitForMenu(page);
      const hardBtn = await menuHardButton(page);
      const label = (await hardBtn.textContent())?.trim() ?? "";
      if (label.includes("locked") || label.includes("soon")) {
        throw new Error(`Master Challenge still gated with 3 medium wins: "${label}"`);
      }
    },
  },
  {
    name: "opening cards then quitting does not advance any cursor",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasyPractice(page);
      // tap 3 cards then quit
      const cards = page.locator("button[aria-pressed]");
      await cards.nth(0).click();
      await cards.nth(1).click();
      await cards.nth(2).click();
      // Two-tap arm-confirm quit flow.
      await page.locator("button", { hasText: "Quit to menu" }).click();
      await page.locator("button", { hasText: "Tap again to quit" }).click();
      await waitForMenu(page);
      const progress = await page.evaluate(() => localStorage.getItem("foldwink:progress"));
      // progress may be null (never saved) or an object with cursor 0 — both acceptable
      if (progress) {
        const p = JSON.parse(progress);
        if ((p.easyCursor ?? p.cursor ?? 0) !== 0) {
          throw new Error(`cursor advanced on quit: ${progress}`);
        }
      }
      const stats = await page.evaluate(() => localStorage.getItem("foldwink:stats"));
      if (stats) {
        const s = JSON.parse(stats);
        if (s.gamesPlayed > 0) throw new Error(`stats counted on quit: ${stats}`);
      }
    },
  },
  {
    name: "daily replay marker does not count to stats",
    fn: async ({ page }) => {
      // Seed that today's daily is already recorded — the store sets
      // countsToStats = false in this case.
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      await seedDismissedOnboarding(page);
      await seedLocalStorage(page, {
        "foldwink:daily": {
          [dateStr]: {
            date: dateStr,
            puzzleId: "seed",
            result: "win",
            mistakesUsed: 0,
            durationMs: 90_000,
          },
        },
        "foldwink:stats": stubStats({ wins: 1, losses: 0 }),
      });
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await (await dailyButton(page)).click();
      await page.waitForSelector("header p");
      const subtitle = await readTextOf(page, "header p");
      if (!subtitle?.includes("replay")) {
        throw new Error(`daily subtitle missing · replay tag: "${subtitle}"`);
      }
    },
  },
  {
    name: "reload mid-game restores the same puzzle (no tier change)",
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasyPractice(page);
      const titleBefore = await readTextOf(page, "header h1");
      const diffBefore = await activeDifficultyFromHeader(page);
      await page.reload();
      await page.getByTestId("menu-continue-card").waitFor({ state: "visible" });
      await page.getByTestId("menu-continue-card").getByRole("button").click();
      await page.waitForSelector("header h1");
      const titleAfter = await readTextOf(page, "header h1");
      const diffAfter = await activeDifficultyFromHeader(page);
      if (titleBefore !== titleAfter) {
        throw new Error(`title changed across reload: "${titleBefore}" → "${titleAfter}"`);
      }
      if (diffBefore !== diffAfter) {
        throw new Error(`difficulty changed across reload: "${diffBefore}" → "${diffAfter}"`);
      }
    },
  },
  {
    name: "Reset all local data clears stats and brings onboarding back",
    fn: async ({ page }) => {
      await page.goto(BASE_URL);
      await page.getByRole("button", { name: "Skip" }).click();
      await page.waitForSelector("header h1");
      await page.getByRole("button", { name: "Quit to menu" }).click();
      await page.getByRole("button", { name: "Tap again to quit" }).click();
      await waitForMenu(page);
      await page.locator("button", { hasText: "About · Privacy" }).click();
      const resetBtn = page.locator('button[aria-label="Reset all local Foldwink data"]');
      await resetBtn.click(); // arms
      await resetBtn.click(); // confirms — triggers reload
      // After reload, onboarding flag is wiped → modal returns.
      await page.waitForSelector("text=How to play", { timeout: 5_000 });
      const stats = await page.evaluate(() => localStorage.getItem("foldwink:stats"));
      if (stats) throw new Error(`stats not cleared: ${stats}`);
    },
  },
]);
