/**
 * Minimal Playwright harness shared by every e2e agent.
 *
 * We deliberately do not depend on @playwright/test. The repo already
 * installs the `playwright` package for the human-like QA script, and
 * duplicating the devDependency set would be a cost-for-nothing.
 *
 * Each agent is a plain Node script. It exits 0 on success, 1 on any
 * assertion failure. The CI smoke is `node tests/e2e/run-all.mjs`.
 */

import { chromium } from "playwright";

export const BASE_URL = process.env.FOLDWINK_E2E_URL ?? "http://localhost:4175/";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";

export function label(name) {
  return `${DIM}[${name}]${RESET}`;
}

export function pass(name, msg) {
  console.log(`${label(name)} ${GREEN}PASS${RESET} ${msg}`);
}

export function fail(name, msg) {
  console.log(`${label(name)} ${RED}FAIL${RESET} ${msg}`);
}

/**
 * Small test runner. Each case is `{ name, fn }`. The harness counts
 * passes / fails, prints a summary, and process.exit(code) at the end.
 */
export async function runCases(suiteName, cases) {
  const browser = await chromium.launch();
  let passed = 0;
  let failed = 0;
  const failures = [];
  for (const c of cases) {
    const context = await browser.newContext({
      viewport: c.viewport ?? { width: 1280, height: 800 },
      ...(c.contextOptions ?? {}),
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("pageerror", (err) => consoleErrors.push(`PAGE ERROR ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    try {
      await c.fn({ page, context, consoleErrors });
      pass(suiteName, c.name);
      passed++;
    } catch (err) {
      fail(suiteName, `${c.name} — ${err?.message ?? err}`);
      failures.push({ name: c.name, error: err?.message ?? String(err) });
      failed++;
    } finally {
      await context.close();
    }
  }
  await browser.close();
  console.log(`${label(suiteName)} ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  return { passed, failed, failures };
}

/**
 * Inject arbitrary localStorage state before the page loads. The game
 * reads settings during module init (store dispatch) so this must run
 * as an init script, not after navigation.
 */
export async function seedLocalStorage(page, entries) {
  await page.addInitScript((payload) => {
    for (const [k, v] of Object.entries(payload)) {
      try {
        window.localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
      } catch {
        /* storage unavailable */
      }
    }
  }, entries);
}

/** Convenience: mark onboarding dismissed so tests don't need to click through it. */
export async function seedDismissedOnboarding(page) {
  await seedLocalStorage(page, { "foldwink:onboarded": true });
}

/**
 * Builds a Stats object with the fields that matter for unlock gating. All
 * other defaults come from `INITIAL_STATS` at runtime.
 */
export function stubStats({
  wins = 0,
  losses = 0,
  mediumWins = 0,
  mediumLosses = 0,
  recentSolves = [],
  totalMistakes = 0,
} = {}) {
  return {
    gamesPlayed: wins + losses,
    wins,
    losses,
    currentStreak: 0,
    bestStreak: 0,
    solvedPuzzleIds: [],
    totalMistakes,
    flawlessWins: 0,
    mediumWins,
    mediumLosses,
    mediumLossStreak: 0,
    winksUsed: 0,
    recentSolves,
    hardWins: 0,
    hardLosses: 0,
    hardLossStreak: 0,
  };
}

/**
 * Wait until W3's stable Today hero is rendered. Its action label changes
 * across fresh, replay and unavailable calendar states.
 */
export async function waitForMenu(page) {
  await page.waitForSelector(
    '[data-testid="menu-today-card"]',
    // Cold preview starts also load the localized puzzle chunk. Allow a real browser
    // enough time so a slow CI disk is not misreported as a gameplay failure.
    { timeout: 20_000 },
  );
}

/** Open W3's Practice difficulty picker without toggling it closed. */
export async function openPracticePicker(page) {
  const toggle = page.getByTestId("menu-practice-toggle");
  await toggle.waitFor({ state: "visible" });
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
  await page.getByTestId("menu-practice-easy").waitFor({ state: "visible" });
}

export async function startEasyPractice(page) {
  await openPracticePicker(page);
  await page.getByTestId("menu-practice-easy").click();
  await page.waitForSelector("header h1");
}
