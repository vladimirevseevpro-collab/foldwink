/**
 * Agent: results-next-flow
 *
 * Regression coverage for the post-solve Result screen and "Next puzzle"
 * flow across three platform profiles:
 *
 *   A — Desktop HTML (Chromium 1280x800, desktop UA)
 *   B — Apple simulation (iPhone 14 390x844, iOS Safari UA + mobile emu)
 *   C — Android simulation (Pixel 6 412x915, Android Chrome UA)
 *
 * Historical symptoms:
 *   - iOS Safari: scroll sometimes stops working on the result screen,
 *     making "Next puzzle" unreachable.
 *   - Android Chrome: "Next puzzle" gradually drifts off-screen after each
 *     Next puzzle round (scrollY preserved across unmount + content grows).
 *
 * The fix landed in the CSS root-height pattern (`min-height: 100dvh`
 * instead of fixed `height: 100%`), a `env(safe-area-inset-bottom)` aware
 * bottom padding on the main column, and an explicit `window.scrollTo(0)`
 * on every screen transition in `src/app/App.tsx`.
 *
 * These tests guard all three regressions and must pass on every build.
 */

import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  BASE_URL,
  runCases,
  seedDismissedOnboarding,
  startEasyPractice,
  waitForMenu,
} from "./lib/harness.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POOL_DIR = path.resolve(__dirname, "../../puzzles/pool");

/**
 * Load every easy puzzle in the pool keyed by title. The active Result
 * screen exposes the current puzzle's title in the game header, so we can
 * always pair the visible puzzle with its solution without caring about
 * pool ordering.
 */
async function loadEasyPuzzlesByTitle() {
  const files = (await readdir(POOL_DIR)).filter((f) => f.endsWith(".json"));
  const map = new Map();
  for (const f of files) {
    const raw = await readFile(path.join(POOL_DIR, f), "utf8");
    const puzzle = JSON.parse(raw);
    if (puzzle.difficulty === "easy") {
      map.set(
        puzzle.title,
        puzzle.groups.map((g) => g.items),
      );
    }
  }
  return map;
}

async function solutionForCurrentPuzzle(page, puzzles) {
  const title = (await page.locator("header h1").textContent())?.trim();
  if (!title) throw new Error("could not read puzzle title from header");
  const groups = puzzles.get(title);
  if (!groups) throw new Error(`no solution known for puzzle titled "${title}"`);
  return groups;
}

async function clickCardByValue(page, value) {
  // Match the exact aria-label (idle / selected). Solved cards get a
  // " — solved, group N" suffix but by then they are also `disabled`, so
  // we never try to re-click them. Sticking to strict equality keeps the
  // selector robust against future aria-label tweaks.
  const card = page.locator(`button[aria-label="${value}"]`);
  await card.first().click();
}

async function solveCurrentPuzzle(page, puzzles) {
  const groups = await solutionForCurrentPuzzle(page, puzzles);
  // groups: array of 4 arrays of 4 item strings. We submit each group in
  // order. The engine accepts any ordering — matching is by set.
  for (const group of groups) {
    for (const item of group) await clickCardByValue(page, item);
    await page.locator("button", { hasText: "Submit" }).click();
    // Between submits, selection clears and the next solved ring animates.
    // No hard state marker to wait on, but a tiny frame tick is enough.
    await page.waitForTimeout(120);
  }
  // After the last correct submit, the store flips screen -> "result".
  await page.waitForSelector('[data-testid="result-screen"]', { timeout: 5_000 });
  await assertResultFocus(page, "result transition");
}

async function assertResultFocus(page, label) {
  const focused = await page.evaluate(() =>
    document.activeElement?.getAttribute("data-testid"),
  );
  if (focused !== "result-screen") {
    throw new Error(label + ": expected result screen focus, got " + focused);
  }
}

async function assertNextPuzzleReachable(page, label) {
  const btn = page.locator('[data-testid="result-next-puzzle"]');
  await btn.waitFor({ state: "visible", timeout: 5_000 });
  const box = await btn.boundingBox();
  if (!box) throw new Error(`${label}: Next puzzle has no bounding box`);
  const vh = await page.evaluate(() => window.innerHeight);
  // The button must be reachable: either already inside the viewport, or
  // reachable via a document scroll. The regression was that document
  // height got locked to viewport, so a scroll could not expose the CTA.
  await btn.scrollIntoViewIfNeeded();
  const after = await btn.boundingBox();
  if (!after) throw new Error(`${label}: Next puzzle disappeared after scroll`);
  if (after.y < 0 || after.y > vh) {
    throw new Error(
      `${label}: Next puzzle still off-screen after scroll: y=${after.y}, vh=${vh}`,
    );
  }
  // And after scrollIntoView it must actually be clickable — a sanity
  // guard against invisible overlays.
  if (!(await btn.isVisible())) {
    throw new Error(`${label}: Next puzzle not visible post-scroll`);
  }
}

async function runOnePuzzleRound(page, puzzles, roundLabel) {
  await solveCurrentPuzzle(page, puzzles);
  await assertNextPuzzleReachable(page, roundLabel);
}

async function advanceToNextPuzzle(page) {
  const btn = page.locator('[data-testid="result-next-puzzle"]');
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await page.waitForSelector("header h1", { timeout: 5_000 });
}

async function assertNoScrollTrap(page, label) {
  // Regression: iOS Safari had `html,body,#root { height: 100% }` which
  // could lock document scroll when the result screen was taller than
  // the viewport. After the fix, `document.scrollingElement` must either
  // already show content in-viewport or allow scrolling when content
  // exceeds the viewport height.
  const info = await page.evaluate(() => {
    const doc = document.scrollingElement ?? document.documentElement;
    return {
      scrollHeight: doc.scrollHeight,
      clientHeight: doc.clientHeight,
      scrollTop: doc.scrollTop,
    };
  });
  if (info.scrollHeight < info.clientHeight - 1) {
    throw new Error(
      `${label}: document shorter than viewport (scrollHeight=${info.scrollHeight}, clientHeight=${info.clientHeight})`,
    );
  }
  // If content overflows, try scrolling and confirm scrollTop actually
  // changes. This catches the "scroll is frozen" symptom.
  if (info.scrollHeight > info.clientHeight + 4) {
    await page.evaluate(() => window.scrollTo(0, 200));
    const after = await page.evaluate(() => ({
      scrollTop: (document.scrollingElement ?? document.documentElement).scrollTop,
    }));
    if (after.scrollTop === 0) {
      throw new Error(
        `${label}: document scroll is frozen (overflow exists but scrollTop stayed 0)`,
      );
    }
  }
}

async function assertSafeAreaPadding(page, label) {
  // The main column must extend its bottom padding to include the safe
  // area inset (or at least a baseline). Without it, the last CTA can
  // sit flush against the home indicator on iPhone.
  const computed = await page.evaluate(() => {
    const main = document.querySelector("main");
    if (!main) return null;
    const style = getComputedStyle(main);
    return {
      paddingBottom: style.paddingBottom,
    };
  });
  if (!computed) throw new Error(`${label}: <main> missing`);
  const px = parseFloat(computed.paddingBottom);
  if (!Number.isFinite(px) || px < 12) {
    throw new Error(
      `${label}: main padding-bottom unexpectedly small: ${computed.paddingBottom}`,
    );
  }
}

const DESKTOP = { width: 1280, height: 800 };
// iPhone 14 portrait; iOS Safari UA string used by Playwright's devices.
const IPHONE = {
  viewport: { width: 390, height: 844 },
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
};
// Pixel 6 portrait; Android Chrome UA.
const PIXEL = {
  viewport: { width: 412, height: 915 },
  userAgent:
    "Mozilla/5.0 (Linux; Android 14; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36",
  deviceScaleFactor: 2.625,
  isMobile: true,
  hasTouch: true,
};

// The harness only wires `viewport`; inline deep-override for mobile
// emulation by routing UA/isMobile/hasTouch via a custom runner wrapper.
async function runMobileFlow({ page, context }, profile, puzzles, label) {
  // `runCases` already created the context with a plain viewport. We
  // patch the UA + viewport per profile on the fly. Touch flags come
  // from context options and can't be mutated after creation, but clicks
  // still fire — the critical assertions are layout/scroll, not touch
  // dispatch. Future work: thread `device` into `runCases` if we need
  // native touch.
  await page.setViewportSize(profile.viewport);
  await context.setExtraHTTPHeaders({ "user-agent": profile.userAgent });
  await page.setExtraHTTPHeaders({ "user-agent": profile.userAgent });

  await seedDismissedOnboarding(page);
  await page.goto(BASE_URL);
  await waitForMenu(page);

  await assertSafeAreaPadding(page, `${label}:menu`);

  await startEasyPractice(page);

  // Round 1
  await runOnePuzzleRound(page, puzzles, `${label}:round1`);
  await assertNoScrollTrap(page, `${label}:round1-result`);

  // Round 2
  await advanceToNextPuzzle(page);
  await runOnePuzzleRound(page, puzzles, `${label}:round2`);
  await assertNoScrollTrap(page, `${label}:round2-result`);

  // Round 3
  await advanceToNextPuzzle(page);
  await runOnePuzzleRound(page, puzzles, `${label}:round3`);
  await assertNoScrollTrap(page, `${label}:round3-result`);
}

const puzzles = await loadEasyPuzzlesByTitle();

await runCases("results-next-flow", [
  {
    name: "Track A — desktop: 3 consecutive Next puzzle rounds stay reachable",
    viewport: DESKTOP,
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await assertSafeAreaPadding(page, "desktop:menu");
      await startEasyPractice(page);

      await runOnePuzzleRound(page, puzzles, "desktop:round1");
      await assertNoScrollTrap(page, "desktop:round1-result");

      await advanceToNextPuzzle(page);
      await runOnePuzzleRound(page, puzzles, "desktop:round2");
      await assertNoScrollTrap(page, "desktop:round2-result");

      await advanceToNextPuzzle(page);
      await runOnePuzzleRound(page, puzzles, "desktop:round3");
      await assertNoScrollTrap(page, "desktop:round3-result");
    },
  },
  {
    name: "Track B — iPhone 390x844: 3 rounds, Next puzzle reachable, no scroll trap",
    viewport: IPHONE.viewport,
    fn: async (ctx) => {
      await runMobileFlow(ctx, IPHONE, puzzles, "ios");
    },
  },
  {
    name: "Track C — Pixel 6 412x915: 3 rounds, Next puzzle never drifts off-screen",
    viewport: PIXEL.viewport,
    fn: async (ctx) => {
      await runMobileFlow(ctx, PIXEL, puzzles, "android");
    },
  },
  {
    name: "screen transition resets scroll: scroll-down-then-Next lands at top",
    viewport: IPHONE.viewport,
    fn: async ({ page }) => {
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasyPractice(page);

      await solveCurrentPuzzle(page, puzzles);
      // Scroll the result screen to the very bottom, then tap Next puzzle.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await advanceToNextPuzzle(page);
      // After mount, the new game screen should be scrolled to top, not
      // inherit the previous page's scrollY.
      const y = await page.evaluate(
        () => (document.scrollingElement ?? document.documentElement).scrollTop,
      );
      if (y > 8) {
        throw new Error(`game screen inherited scrollY=${y} after Next puzzle`);
      }
    },
  },
  {
    name: "second round Result CTA reachable even with streak-celebration block",
    viewport: IPHONE.viewport,
    fn: async ({ page }) => {
      // Streak >= 2 is the trigger for the celebration block. Round 1 sets
      // streak=1, round 2 sets streak=2 and renders the celebration — the
      // historic Android symptom was that this extra block pushed the CTA
      // out of reach. Re-verify the CTA is still reachable in round 2.
      await seedDismissedOnboarding(page);
      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasyPractice(page);
      await solveCurrentPuzzle(page, puzzles);
      await advanceToNextPuzzle(page);
      await solveCurrentPuzzle(page, puzzles);
      await assertNextPuzzleReachable(page, "ios:round2-celebration");
    },
  },
]);
