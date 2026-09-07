/**
 * menu-daily-done-qa.mjs
 *
 * Seeds localStorage to mimic the real iPhone scenario the reviewer saw:
 * a daily solved today + a few easy plays → the "tallest menu" state
 * with DailyCompleteCard + Replay button + readiness caption all shown
 * at once. Measures whether Back-to-menu ... wait, no: menu is the bottom.
 * We measure whether the iOS-tip (last element) fits above a ~90px
 * Safari toolbar buffer.
 *
 * Output: reports/menu_daily_qa/*.png + summary.json
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.FOLDWINK_E2E_URL ?? "http://localhost:4175/";
const OUT_DIR = path.resolve(__dirname, "../reports/menu_daily_qa");

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();

await page.addInitScript(() => {
  localStorage.setItem("foldwink:onboarded", "true");
  // Mimic the screenshot: 3 easy wins (readiness = "Almost there, 2 more
  // easy wins unlocks Medium"), daily solved today with streak 3.
  localStorage.setItem(
    "foldwink:stats",
    JSON.stringify({
      gamesPlayed: 3,
      wins: 3,
      losses: 0,
      currentStreak: 3,
      bestStreak: 3,
      solvedPuzzleIds: [],
      totalMistakes: 1,
      flawlessWins: 2,
      mediumWins: 0,
      mediumLosses: 0,
      mediumLossStreak: 0,
      winksUsed: 0,
      recentSolves: [],
      hardWins: 0,
      hardLosses: 0,
      hardLossStreak: 0,
    }),
  );
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  localStorage.setItem(
    "foldwink:daily",
    JSON.stringify({
      [today]: {
        date: today,
        puzzleId: "puzzle-0001",
        result: "win",
        mistakesUsed: 1,
        durationMs: 38_000,
      },
    }),
  );
});

await page.goto(BASE_URL);
await page.waitForSelector("button:has-text('Replay daily')");
await page.screenshot({
  path: path.join(OUT_DIR, "menu-daily-done.png"),
  fullPage: false,
});
await page.screenshot({
  path: path.join(OUT_DIR, "menu-daily-done-fullpage.png"),
  fullPage: true,
});

const metrics = await page.evaluate(() => {
  const doc = document.scrollingElement ?? document.documentElement;
  const main = document.querySelector("main");
  const mainR = main?.getBoundingClientRect();
  // The *real* danger is the final visible element in the menu column.
  // On iPhone Safari that is the iOS "Add to Home Screen" tip paragraph;
  // elsewhere it is the last Stats button. Ignore <main>'s padding — it
  // always adds ~72px and would give a false-positive overlap.
  const menuKids = Array.from(main?.querySelectorAll(":scope > div > *") ?? []).filter(
    (el) => el.getBoundingClientRect().height > 0,
  );
  const lastEl = menuKids[menuKids.length - 1];
  const lastR = lastEl?.getBoundingClientRect();
  const iosTip = Array.from(document.querySelectorAll("p")).find((p) =>
    /iPhone tip/i.test(p.textContent ?? ""),
  );
  const tipR = iosTip?.getBoundingClientRect();
  const lastBottom = lastR ? lastR.bottom : null;
  return {
    vh: window.innerHeight,
    docH: doc.scrollHeight,
    mainBottom: mainR ? mainR.bottom : null,
    lastTag: lastEl?.tagName?.toLowerCase() ?? null,
    lastBottom,
    tipBottom: tipR ? tipR.bottom : null,
    // Danger zone = last 90px of viewport (Safari bottom toolbar).
    // Measure against the last real content element, not <main>'s padding.
    dangerOverlap: lastBottom ? Math.max(0, lastBottom - (window.innerHeight - 90)) : 0,
  };
});
console.log("metrics:", metrics);

await writeFile(path.join(OUT_DIR, "summary.json"), JSON.stringify(metrics, null, 2));
await browser.close();
console.log(`snapshot + summary in ${path.relative(process.cwd(), OUT_DIR)}`);
