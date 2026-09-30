import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  BASE_URL,
  runCases,
  seedDismissedOnboarding,
  seedLocalStorage,
  startEasyPractice,
  waitForMenu,
} from "./lib/harness.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POOL_DIR = path.resolve(__dirname, "../../puzzles/pool");
const MOBILE = { width: 390, height: 844 };
const SMALL_MOBILE = { width: 320, height: 700 };

function formatLocalDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

const TODAY = formatLocalDate(new Date());

function localDateDaysAgo(days) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return formatLocalDate(d);
}

function buildSparseDailyHistory() {
  return {
    [localDateDaysAgo(6)]: {
      date: localDateDaysAgo(6),
      puzzleId: "seed-6",
      result: "win",
      mistakesUsed: 1,
      durationMs: 111000,
    },
    [localDateDaysAgo(4)]: {
      date: localDateDaysAgo(4),
      puzzleId: "seed-4",
      result: "loss",
      mistakesUsed: 4,
      durationMs: 201000,
    },
    [localDateDaysAgo(2)]: {
      date: localDateDaysAgo(2),
      puzzleId: "seed-2",
      result: "win",
      mistakesUsed: 0,
      durationMs: 98000,
    },
    [TODAY]: {
      date: TODAY,
      puzzleId: "seed-today",
      result: "win",
      mistakesUsed: 2,
      durationMs: 143000,
    },
  };
}

async function loadPuzzlesById() {
  const files = (await readdir(POOL_DIR)).filter((f) => f.endsWith(".json"));
  const map = new Map();
  for (const f of files) {
    const raw = await readFile(path.join(POOL_DIR, f), "utf8");
    const puzzle = JSON.parse(raw);
    map.set(puzzle.id, puzzle.groups.map((g) => g.items));
  }
  return map;
}

async function solutionForCurrentPuzzle(page, puzzles) {
  const puzzleId = await page.evaluate(() => {
    const raw = localStorage.getItem("foldwink:active-session");
    if (!raw) return null;
    try {
      return JSON.parse(raw)?.puzzleId ?? null;
    } catch {
      return null;
    }
  });
  if (!puzzleId) throw new Error("could not read active puzzle id");
  const groups = puzzles.get(puzzleId);
  if (!groups) throw new Error(`missing puzzle solution for "${puzzleId}"`);
  return groups;
}

async function clickCardByValue(page, value) {
  await page.locator(`button[aria-label="${value}"]`).first().click();
}

async function solveCurrentPuzzle(page, puzzles) {
  const groups = await solutionForCurrentPuzzle(page, puzzles);
  for (const group of groups) {
    for (const item of group) await clickCardByValue(page, item);
    await page.getByRole("button", { name: "Submit" }).click();
    await page.waitForTimeout(120);
  }
  await page.waitForSelector('[data-testid="result-screen"]', { timeout: 5_000 });
}

async function startDaily(page) {
  await page
    .locator("button", { hasText: /Play today|Replay daily/ })
    .first()
    .click();
  await page.waitForSelector("header h1");
}

async function assertNoHorizontalOverflow(page, label) {
  const dims = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (dims.scrollWidth > dims.clientWidth + 1) {
    throw new Error(`${label}: horizontal overflow ${dims.scrollWidth} > ${dims.clientWidth}`);
  }
}

async function assertStackReachable(page, selector, label) {
  const node = page.locator(selector);
  await node.scrollIntoViewIfNeeded();
  const box = await node.boundingBox();
  const vh = await page.evaluate(() => window.innerHeight);
  if (!box) throw new Error(`${label}: missing bounding box`);
  if (box.y < -1 || box.y + box.height > vh + 1) {
    throw new Error(`${label}: unreachable after scroll y=${box.y} h=${box.height} vh=${vh}`);
  }
}

const puzzles = await loadPuzzlesById();

await runCases("r4-retention-qa", [
  {
    name: "fresh menu shows Daily Fold with 7 neutral cells",
    viewport: MOBILE,
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      const fold = page.getByTestId("daily-fold");
      await fold.waitFor();
      const cells = fold.locator("[data-testid^='daily-fold-cell-']");
      if ((await cells.count()) !== 7) {
        throw new Error(`expected 7 daily cells, got ${await cells.count()}`);
      }
      for (let i = 0; i < 7; i += 1) {
        const state = await cells.nth(i).getAttribute("data-state");
        if (state !== "empty")
          throw new Error(`fresh cell ${i} state=${state}, expected empty`);
      }
      const today = fold.locator("[data-today='true']");
      if ((await today.count()) !== 1) throw new Error("expected exactly one today marker");
      await assertNoHorizontalOverflow(page, "fresh-menu");
    },
  },
  {
    name: "seeded sparse history maps wins losses gaps and today marker into 7 cells",
    viewport: MOBILE,
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      const history = buildSparseDailyHistory();
      await seedLocalStorage(page, {
        "foldwink:daily": history,
        "foldwink:archivistProfile": { version: 2, wax: 0 },
      });
      await page.goto(BASE_URL);
      await waitForMenu(page);
      const fold = page.getByTestId("daily-fold");
      await fold.waitFor();
      const expected = Array.from({ length: 7 }, (_, index) => {
        const date = localDateDaysAgo(6 - index);
        return {
          date,
          state:
            history[date]?.result === "win"
              ? "won"
              : history[date]?.result === "loss"
                ? "lost"
                : "empty",
          today: date === TODAY ? "true" : "false",
        };
      });
      for (const cell of expected) {
        const locator = page.getByTestId(`daily-fold-cell-${cell.date}`);
        const state = await locator.getAttribute("data-state");
        const today = await locator.getAttribute("data-today");
        if (state !== cell.state) {
          throw new Error(`cell ${cell.date} state=${state}, expected ${cell.state}`);
        }
        if (today !== cell.today) {
          throw new Error(`cell ${cell.date} data-today=${today}, expected ${cell.today}`);
        }
      }
    },
  },
  {
    name: "daily completion and replay remain one persisted logical record with stable stats",
    viewport: MOBILE,
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startDaily(page);
      await solveCurrentPuzzle(page, puzzles);
      const afterFirst = await page.evaluate(() => ({
        stats: JSON.parse(localStorage.getItem("foldwink:stats") ?? "null"),
        daily: JSON.parse(localStorage.getItem("foldwink:daily") ?? "null"),
      }));
      if (!afterFirst.daily || Object.keys(afterFirst.daily).length !== 1) {
        throw new Error(`expected exactly one daily record after first completion`);
      }
      const firstKey = Object.keys(afterFirst.daily)[0];
      const firstStats = afterFirst.stats;
      await page.getByRole("button", { name: "Back to menu" }).click();
      await waitForMenu(page);
      await startDaily(page);
      const subtitle = (await page.locator("header p").textContent()) ?? "";
      if (!subtitle.toLowerCase().includes("replay")) {
        throw new Error(`daily replay marker missing: "${subtitle}"`);
      }
      await solveCurrentPuzzle(page, puzzles);
      const afterReplay = await page.evaluate(() => ({
        stats: JSON.parse(localStorage.getItem("foldwink:stats") ?? "null"),
        daily: JSON.parse(localStorage.getItem("foldwink:daily") ?? "null"),
      }));
      if (Object.keys(afterReplay.daily ?? {}).length !== 1) {
        throw new Error(`replay created extra daily records`);
      }
      if (!afterReplay.daily[firstKey]) {
        throw new Error(`replay removed original daily record ${firstKey}`);
      }
      if (JSON.stringify(afterReplay.stats) !== JSON.stringify(firstStats)) {
        throw new Error("replay inflated stats");
      }
    },
  },
  {
    name: "daily personal moment exists only for daily mode and full CTA stack stays reachable at 320x700 and 390x844",
    viewport: SMALL_MOBILE,
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await seedLocalStorage(page, { "foldwink:daily": buildSparseDailyHistory() });
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startDaily(page);
      await solveCurrentPuzzle(page, puzzles);
      await page.getByTestId("daily-personal-moment").waitFor();
      await page.getByTestId("share-result-button").waitFor();
      await assertStackReachable(page, "[data-testid='daily-personal-moment']", "320-moment");
      await assertStackReachable(page, "[data-testid='share-result-button']", "320-share");
      await assertStackReachable(page, "[data-testid='result-cta-stack']", "320-cta-stack");
      await assertNoHorizontalOverflow(page, "320-daily-result");

      await page.getByRole("button", { name: "Back to menu" }).click();
      await waitForMenu(page);
      await page.setViewportSize(MOBILE);
      await startEasyPractice(page);
      await solveCurrentPuzzle(page, puzzles);
      if (await page.getByTestId("daily-personal-moment").count()) {
        throw new Error("personal moment leaked into standard result");
      }
      if ((await page.locator('[data-testid="result-next-puzzle"]').count()) !== 1) {
        throw new Error("standard result should expose Next puzzle");
      }
      await assertStackReachable(page, "[data-testid='share-result-button']", "390-share");
      await assertStackReachable(page, "[data-testid='result-cta-stack']", "390-cta-stack");
      await assertNoHorizontalOverflow(page, "390-standard-result");
    },
  },
]);
