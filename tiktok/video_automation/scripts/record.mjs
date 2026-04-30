/**
 * Foldwink video pipeline — recorder.
 *
 * Drives the built app through deterministic scenarios and saves raw webm
 * clips via Playwright recordVideo. Each scenario writes one clip into
 * reports/video_automation/raw/<scenario_id>.webm and a metadata JSON.
 */
import { chromium } from "playwright";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { startPreviewServer } from "./lib/server.mjs";
import {
  loadPuzzlePool,
  matchPuzzleByCards,
  buildSolvePlan,
  findCardLocatorTexts,
} from "./lib/solver.mjs";

const ROOT = resolve(process.cwd());
const OUT_DIR = resolve(ROOT, "reports/video_automation/raw");
const WORK_DIR = resolve(ROOT, "reports/video_automation/work");
const CONFIG = JSON.parse(
  readFileSync(resolve(ROOT, "reports/video_automation/configs/scenarios.json"), "utf-8"),
);
const POOL_DIR = resolve(ROOT, "puzzles/pool");

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
if (!existsSync(WORK_DIR)) mkdirSync(WORK_DIR, { recursive: true });

const SEEDED_STATS = {
  gamesPlayed: 20,
  wins: 18,
  losses: 2,
  currentStreak: 5,
  bestStreak: 8,
  solvedPuzzleIds: [],
  mediumWins: 6,
  mediumLosses: 1,
  totalMistakes: 6,
  winkUses: 2,
  flawlessWins: 4,
  mediumLossStreak: 0,
  recentSolves: Array.from({ length: 6 }).map(() => ({
    difficulty: "easy",
    result: "win",
    mistakesUsed: 0,
    durationMs: 90000,
  })),
  hardWins: 2,
  hardLosses: 0,
  hardLossStreak: 0,
};
const SEEDED_PROGRESS = { cursor: 0, easyCursor: 0, mediumCursor: 0, hardCursor: 0 };

async function jitter(min, max) {
  const ms = min + Math.random() * (max - min);
  await new Promise((r) => setTimeout(r, ms));
}

async function dismissOnboarding(page) {
  const dlg = page.locator('[role="dialog"]');
  if (await dlg.count()) {
    const ok = page.locator("button", { hasText: /Got it/i });
    if (await ok.count()) {
      try {
        await ok.click({ timeout: 1500 });
      } catch {}
    }
  }
}

async function seedLocalStorage(page) {
  await page.addInitScript(
    ([stats, progress]) => {
      localStorage.setItem("foldwink:stats", stats);
      localStorage.setItem("foldwink:progress", progress);
      localStorage.setItem("foldwink:onboarded", "1");
      localStorage.removeItem("foldwink:active-session");
      const style = document.createElement("style");
      style.textContent = "*,*:hover{cursor:none !important}";
      (document.head || document.documentElement).appendChild(style);
    },
    [JSON.stringify(SEEDED_STATS), JSON.stringify(SEEDED_PROGRESS)],
  );
}

async function openDifficulty(page, difficulty) {
  const selectors = {
    easy: /Easy puzzle/i,
    medium: /Medium puzzle/i,
    hard: /Master Challenge/i,
  };
  const btn = page.locator("button", { hasText: selectors[difficulty] }).first();
  await btn.waitFor({ state: "visible", timeout: 10_000 });
  const disabled = await btn.isDisabled();
  if (disabled) throw new Error(`${difficulty} button disabled — seeded state insufficient`);
  await btn.click();
  await page.waitForSelector('[role="grid"]', { timeout: 10_000 });
}

async function getCardTexts(page) {
  return findCardLocatorTexts(page);
}

async function clickByText(page, text) {
  const locator = page.locator('[role="grid"] button', { hasText: text }).first();
  await locator.scrollIntoViewIfNeeded();
  await locator.click();
}

async function playScenario(page, scenario, pool, clock) {
  await openDifficulty(page, scenario.difficulty);

  const cadenceMap = {
    snappy: { clickMin: 90, clickMax: 170, betweenMin: 140, betweenMax: 240, postSubmit: 520 },
    fast: { clickMin: 110, clickMax: 220, betweenMin: 180, betweenMax: 320, postSubmit: 620 },
    medium: { clickMin: 150, clickMax: 260, betweenMin: 260, betweenMax: 460, postSubmit: 780 },
    confident: {
      clickMin: 130,
      clickMax: 230,
      betweenMin: 200,
      betweenMax: 360,
      postSubmit: 700,
    },
  };
  const c = cadenceMap[scenario.cadence] ?? cadenceMap.fast;

  const cardTexts = await getCardTexts(page);
  const puzzle = matchPuzzleByCards(pool, cardTexts);
  if (!puzzle) throw new Error(`could not match puzzle for scenario ${scenario.id}`);

  const plan = buildSolvePlan(puzzle, { plannedMistakes: scenario.plannedMistakes ?? 0 });
  const submit = page.locator("button", { hasText: /Submit/i });

  let roundsRun = 0;
  let lastOutcomeT = 0;
  for (const step of plan) {
    if (roundsRun >= (scenario.maxRounds ?? 4) + (scenario.plannedMistakes ?? 0)) break;
    roundsRun++;
    await jitter(c.betweenMin, c.betweenMax);
    for (const item of step.items) {
      try {
        await clickByText(page, item);
        clock.log("select");
      } catch {}
      await jitter(c.clickMin, c.clickMax);
    }
    await jitter(c.betweenMin, c.betweenMax);
    if (await submit.count()) {
      try {
        await submit.first().click({ timeout: 2000 });
        clock.log("submit");
      } catch {}
    }
    // The outcome animation fires ~300-400 ms after submit in Foldwink. Wait
    // exactly that long so the logged outcome event lands on the animation
    // beat rather than when the engine finished resolving.
    await page.waitForTimeout(340);
    clock.log(step.type === "mistake" ? "wrong" : "correct");
    lastOutcomeT = clock.now();
    await page.waitForTimeout(Math.max(0, c.postSubmit - 340));
    const remaining = await page.locator('[role="grid"] button:not([disabled])').count();
    if (remaining < 4) break;
  }
  // Win chime at the point the result screen mounts. The engine shows it
  // roughly 600 ms after the last correct solve.
  await page.waitForTimeout(600);
  if (clock.now() - lastOutcomeT >= 450) clock.log("win");
  await page.waitForTimeout(800);
}

function findSingleWebm(dir) {
  const walk = (p, out = []) => {
    for (const f of readdirSync(p)) {
      const full = join(p, f);
      const s = statSync(full);
      if (s.isDirectory()) walk(full, out);
      else if (f.endsWith(".webm")) out.push(full);
    }
    return out;
  };
  return walk(dir);
}

function makeClock() {
  // t0 is set when Playwright starts writing frames — approximated by the
  // time of the first viewport navigation, because recordVideo begins at
  // context creation but the first meaningful frame is the loaded app.
  const events = [];
  let t0 = null;
  return {
    mark() {
      t0 = Date.now();
    },
    now() {
      return t0 === null ? 0 : (Date.now() - t0) / 1000;
    },
    log(type) {
      if (t0 === null) return;
      events.push({ t: Number(((Date.now() - t0) / 1000).toFixed(3)), type });
    },
    events,
  };
}

async function recordOne(browser, scenario, pool) {
  const tmpDir = join(WORK_DIR, `ctx-${scenario.id}`);
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    recordVideo: { dir: tmpDir, size: CONFIG.viewport },
    userAgent: "FoldwinkVideoBot/1.0",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.warn(`[${scenario.id}] pageerror:`, e.message));
  await seedLocalStorage(page);
  const clock = makeClock();
  clock.mark(); // recordVideo started ~here (context creation); use goto as t0
  await page.goto(CONFIG.baseUrl, { waitUntil: "networkidle" });
  await dismissOnboarding(page);
  try {
    await playScenario(page, scenario, pool, clock);
  } catch (err) {
    console.warn(`[${scenario.id}] scenario error:`, err.message);
  }
  await page.waitForTimeout(500);
  await context.close();
  const files = findSingleWebm(tmpDir);
  if (!files.length) throw new Error(`no webm recorded for ${scenario.id}`);
  const target = join(OUT_DIR, `${scenario.id}.webm`);
  renameSync(files[0], target);
  const meta = {
    scenarioId: scenario.id,
    difficulty: scenario.difficulty,
    plannedMistakes: scenario.plannedMistakes,
    viewport: CONFIG.viewport,
    recordedAt: new Date().toISOString(),
    file: target.replace(ROOT + "\\", "").replace(ROOT + "/", ""),
  };
  writeFileSync(join(OUT_DIR, `${scenario.id}.meta.json`), JSON.stringify(meta, null, 2));
  writeFileSync(
    join(OUT_DIR, `${scenario.id}.events.json`),
    JSON.stringify({ scenarioId: scenario.id, events: clock.events }, null, 2),
  );
  console.log(`[${scenario.id}] recorded → ${target}  events=${clock.events.length}`);
}

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const scenarios = only.length
    ? CONFIG.scenarios.filter((s) => only.includes(s.id))
    : CONFIG.scenarios;
  if (!scenarios.length) throw new Error("no scenarios selected");

  const pool = loadPuzzlePool(POOL_DIR);
  console.log(
    `[record] pool size=${pool.length} scenarios=${scenarios.map((s) => s.id).join(",")}`,
  );

  const server = await startPreviewServer({ port: 4174, cwd: ROOT });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const s of scenarios) {
      try {
        await recordOne(browser, s, pool);
      } catch (err) {
        console.error(`[${s.id}] FAILED:`, err.message);
      }
    }
  } finally {
    await browser.close();
    await server.stop();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
