import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const BASE_URL = "http://localhost:4174/";
const OUT_DIR = join(process.cwd(), "tiktok/batch_02/exports/screenshots");
mkdirSync(OUT_DIR, { recursive: true });

const SEEDED_STATS = {
  gamesPlayed: 28,
  wins: 22,
  losses: 6,
  currentStreak: 7,
  bestStreak: 12,
  solvedPuzzleIds: [],
  mediumWins: 9,
  mediumLosses: 2,
  totalMistakes: 19,
  winkUses: 5,
  flawlessWins: 7,
  mediumLossStreak: 0,
  recentSolves: [],
  hardWins: 3,
  hardLosses: 1,
  hardLossStreak: 0,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickCard(page, label) {
  const btn = page.locator(`button:has-text("${label}")`).first();
  await btn.scrollIntoViewIfNeeded();
  await btn.click({ delay: 30 });
  await sleep(120);
}

async function submit(page) {
  const submit = page.getByRole("button", { name: /^Submit$/ });
  await submit.first().click();
  await sleep(900);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // 9:16 portrait at retina-ish density → output PNG is 1080×1920
  const context = await browser.newContext({
    viewport: { width: 540, height: 960 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  await page.addInitScript((stats) => {
    localStorage.setItem("foldwink:stats", JSON.stringify(stats));
    localStorage.setItem(
      "foldwink:progress",
      JSON.stringify({ cursor: 0, easyCursor: 0, mediumCursor: 0, hardCursor: 0 }),
    );
    localStorage.setItem("foldwink:onboarded", "true");
    localStorage.removeItem("foldwink:active-session");
    localStorage.setItem("foldwink:sound", JSON.stringify({ muted: true }));
  }, SEEDED_STATS);

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await sleep(500);

  // Enter Master Challenge (Hard)
  await page
    .getByRole("button", { name: /^Master Challenge$/ })
    .first()
    .click();
  await sleep(800);

  // Read the cards currently on the board, then find the matching puzzle file.
  const cardTexts = (await page.locator('button[class*="aspect"]').allInnerTexts()).map((t) =>
    t.trim(),
  );
  console.log("CARDS ON BOARD:", JSON.stringify(cardTexts));

  const { readFileSync, readdirSync } = await import("fs");
  const allPuzzleFiles = readdirSync("puzzles/pool").filter(
    (f) => f.startsWith("puzzle-") && f.endsWith(".json"),
  );
  let puzzle = null;
  for (const f of allPuzzleFiles) {
    const p = JSON.parse(readFileSync(`puzzles/pool/${f}`, "utf-8"));
    if (!p.groups || p.groups.length !== 4) continue;
    const items = p.groups.flatMap((g) => g.items);
    if (items.length === 16 && items.every((it) => cardTexts.includes(it))) {
      puzzle = p;
      console.log(`MATCHED: ${p.id} — "${p.title}" (difficulty: ${p.difficulty})`);
      break;
    }
  }
  if (!puzzle) {
    console.error("Could not find matching puzzle file for the cards on screen.");
    await page.screenshot({ path: join(OUT_DIR, "_debug_unmatched.png") });
    process.exit(1);
  }

  // Solve the first 3 groups, leave the 4th unsolved.
  const groups = puzzle.groups.slice(0, 3).map((g) => g.items);
  const unsolvedLabel = puzzle.groups[3].label;
  console.log(`Will leave unsolved: "${unsolvedLabel}" — ${puzzle.groups[3].items.join(", ")}`);

  for (const items of groups) {
    for (const item of items) await clickCard(page, item);
    await submit(page);
  }

  // Tiny pause so the lock-in animations of the third group settle
  await sleep(1200);

  const outPath = join(OUT_DIR, "foldwink_hard_almost_solved_1080x1920.png");
  await page.screenshot({ path: outPath, fullPage: false });
  console.log(`✓ ${outPath}`);

  await context.close();
  await browser.close();
})();
