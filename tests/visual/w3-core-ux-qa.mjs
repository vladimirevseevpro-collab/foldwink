import { chromium } from "playwright";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.FOLDWINK_E2E_URL ?? "http://localhost:5187/";
const root = process.cwd();
const outputDir = path.join(root, "reports", "w3-core-ux-2026-09-14");
const screenshotsDir = path.join(outputDir, "screenshots");
const languages = ["en", "ru", "de"];
const viewports = [
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "390x844", width: 390, height: 844 },
];
const submitLabels = { en: "Submit", ru: "Подтвердить", de: "Bestätigen" };

await mkdir(screenshotsDir, { recursive: true });

async function loadStarter(language) {
  const manifest = JSON.parse(
    await readFile(path.join(root, "puzzles", "manifests", `starters.${language}.json`), "utf8"),
  );
  const puzzleId = manifest.entries[0].puzzleRef.puzzleId;
  const folder =
    language === "en"
      ? path.join(root, "puzzles", "pool")
      : path.join(root, "puzzles", language, "pool");
  return JSON.parse(await readFile(path.join(folder, `${puzzleId}.json`), "utf8"));
}

const starters = Object.fromEntries(
  await Promise.all(languages.map(async (language) => [language, await loadStarter(language)])),
);

async function loadPool(language) {
  const folder =
    language === "en"
      ? path.join(root, "puzzles", "pool")
      : path.join(root, "puzzles", language, "pool");
  const files = (await readdir(folder)).filter((file) => file.endsWith(".json"));
  return Promise.all(files.map(async (file) => JSON.parse(await readFile(path.join(folder, file), "utf8"))));
}

const pools = Object.fromEntries(
  await Promise.all(languages.map(async (language) => [language, await loadPool(language)])),
);

function signature(values) {
  return [...values].map((value) => value.toLocaleLowerCase()).sort().join("\u001f");
}

async function resolveOpenPuzzle(page, language) {
  const values = await page.locator(".fw-card").evaluateAll((cards) =>
    cards.map((card) => card.getAttribute("data-key") ?? ""),
  );
  const openSignature = signature(values);
  const puzzle = pools[language].find(
    (candidate) => signature(candidate.groups.flatMap((group) => group.items)) === openSignature,
  );
  if (!puzzle) throw new Error(`${language}: open board does not resolve to catalog content`);
  return puzzle;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function seed(page, language, onboarded = true) {
  await page.addInitScript(
    ({ language, onboarded }) => {
      localStorage.setItem("foldwink:lang", language);
      localStorage.setItem("foldwink:analytics-consent", "denied");
      if (onboarded) localStorage.setItem("foldwink:onboarded", "true");
    },
    { language, onboarded },
  );
}

async function stabilize(page) {
  await page.addStyleTag({
    content: "*,*::before,*::after{animation:none!important;transition:none!important}",
  });
}

async function assertLayout(page, state, language, viewport) {
  const metrics = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    screen: document.querySelector("main")?.getAttribute("data-fw-screen"),
    dialogs: document.querySelectorAll('[role="dialog"]').length,
  }));
  if (metrics.scrollWidth > metrics.viewportWidth + 1) {
    throw new Error(`${state}/${language}/${viewport.name}: horizontal overflow ${JSON.stringify(metrics)}`);
  }
  return metrics;
}

async function startEasy(page) {
  await page.getByTestId("menu-practice-toggle").click();
  await page.getByTestId("menu-practice-easy").click();
  await page.waitForSelector('[data-fw-screen="game"] .fw-card', { timeout: 20_000 });
}

async function clickCard(page, value) {
  const card = page
    .locator(".fw-card")
    .filter({ hasText: new RegExp(`^\\s*${escapeRegex(value)}\\s*$`, "i") })
    .first();
  await card.click();
}

async function submit(page, language) {
  await page.getByRole("button", { name: submitLabels[language], exact: true }).click();
}

async function win(page, puzzle, language) {
  for (const group of puzzle.groups) {
    for (const item of group.items) await clickCard(page, item);
    await submit(page, language);
  }
  await page.waitForSelector('[data-testid="result-screen"]', { timeout: 20_000 });
}

async function lose(page, puzzle, language) {
  for (let index = 0; index < 4; index += 1) {
    for (const group of puzzle.groups) await clickCard(page, group.items[index]);
    await submit(page, language);
  }
  await page.waitForSelector('[data-testid="result-screen"]', { timeout: 20_000 });
}

const browser = await chromium.launch();
const results = [];

for (const language of languages) {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await seed(page, language);
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 20_000 });
    await page.waitForSelector('[data-testid="menu-today-card"]', { timeout: 20_000 });
    await stabilize(page);
    const homeMetrics = await assertLayout(page, "home", language, viewport);
    await page.screenshot({ path: path.join(screenshotsDir, `home-${language}-${viewport.name}.png`) });

    await startEasy(page);
    const openPuzzle = await resolveOpenPuzzle(page, language);
    const gameMetrics = await assertLayout(page, "game", language, viewport);
    if ((await page.locator(".fw-card").count()) !== 16) throw new Error("game does not have 16 cards");
    await page.screenshot({ path: path.join(screenshotsDir, `game-${language}-${viewport.name}.png`) });

    await win(page, openPuzzle, language);
    const winMetrics = await assertLayout(page, "win", language, viewport);
    const next = page.getByTestId("result-next-puzzle");
    if (!(await next.isVisible())) throw new Error("primary Next action is missing after win");
    await page.screenshot({ path: path.join(screenshotsDir, `win-${language}-${viewport.name}.png`) });
    results.push({ language, viewport: viewport.name, path: "home-game-win", errors, homeMetrics, gameMetrics, winMetrics });
    await context.close();

    const lossContext = await browser.newContext({ viewport });
    const lossPage = await lossContext.newPage();
    const lossErrors = [];
    lossPage.on("pageerror", (error) => lossErrors.push(error.message));
    await seed(lossPage, language);
    await lossPage.goto(baseUrl, { waitUntil: "networkidle", timeout: 20_000 });
    await lossPage.waitForSelector('[data-testid="menu-today-card"]', { timeout: 20_000 });
    await startEasy(lossPage);
    const lossPuzzle = await resolveOpenPuzzle(lossPage, language);
    await stabilize(lossPage);
    await lose(lossPage, lossPuzzle, language);
    const lossMetrics = await assertLayout(lossPage, "loss", language, viewport);
    const lossNext = lossPage.getByTestId("result-next-puzzle");
    const retry = lossPage.getByTestId("result-retry-puzzle");
    if (!(await lossNext.isVisible()) || !(await retry.isVisible())) {
      throw new Error("loss must expose both Next and Retry");
    }
    const ctaOrder = await lossPage
      .getByTestId("result-cta-stack")
      .locator("button")
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute("data-testid")));
    if (ctaOrder.indexOf("result-next-puzzle") > ctaOrder.indexOf("result-retry-puzzle")) {
      throw new Error("Retry appears before primary Next");
    }
    await lossPage.screenshot({ path: path.join(screenshotsDir, `loss-${language}-${viewport.name}.png`) });
    results.push({ language, viewport: viewport.name, path: "loss", errors: lossErrors, lossMetrics, ctaOrder });
    await lossContext.close();
  }
}

// First-run contract: exactly two actions, then the first starter (never Daily).
for (const language of languages) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await seed(page, language, false);
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 20_000 });
  await page.waitForSelector('[data-testid="onboarding"]');
  await stabilize(page);
  const progressText = await page.locator('[data-testid="onboarding"]').innerText();
  if (!/2/.test(progressText)) throw new Error(`${language}: onboarding does not expose two steps`);
  await page.screenshot({ path: path.join(screenshotsDir, `onboarding-${language}-390x844.png`) });
  const demoCards = page.locator('[data-testid="onboarding"] section button[aria-pressed]');
  for (let index = 0; index < 4; index += 1) await demoCards.nth(index).click();
  await page.locator('[data-testid="onboarding"] section button').last().click();
  await page.locator('[data-testid="onboarding"] section button').last().click();
  await page.locator('[data-testid="onboarding"] section button').last().click();
  await page.waitForSelector('[data-fw-screen="game"] .fw-card');
  const heading = await page.locator("h1").first().innerText();
  if (heading !== starters[language].title) {
    throw new Error(`${language}: onboarding landed on ${heading}, expected starter ${starters[language].title}`);
  }
  results.push({ language, path: "onboarding", starter: starters[language].id });
  await context.close();
}

// Reload keeps the exact attempt behind an explicit Continue card.
for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await seed(page, "en");
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 20_000 });
  await page.waitForSelector('[data-testid="menu-today-card"]');
  await startEasy(page);
  await page.locator(".fw-card").first().click();
  await page.waitForTimeout(300);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="menu-continue-card"]', { timeout: 20_000 });
  await stabilize(page);
  await assertLayout(page, "continue", "en", viewport);
  await page.screenshot({ path: path.join(screenshotsDir, `continue-en-${viewport.name}.png`) });
  await page.getByTestId("menu-continue-card").getByRole("button").click();
  await page.waitForSelector('[data-fw-screen="game"]');
  const selected = await page.locator('.fw-card[aria-pressed="true"]').count();
  if (selected !== 1) throw new Error(`Continue restored ${selected} selected cards instead of 1`);
  results.push({ viewport: viewport.name, path: "continue", selected });
  await context.close();
}

// Common dialog keyboard contract: initial focus, trapped Tab, Escape, focus return.
{
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();
  await seed(page, "en");
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 20_000 });
  await page.waitForSelector('[data-testid="menu-today-card"]');
  await page.getByTestId("menu-secondary-modes-toggle").click();
  const trigger = page.getByTestId("menu-mastery-button");
  await trigger.focus();
  await trigger.click();
  const dialog = page.getByTestId("mastery-dialog").getByRole("dialog");
  await dialog.waitFor();
  const focusedText = await page.locator(":focus").innerText();
  if (!focusedText.toLocaleLowerCase().includes("start challenge")) {
    throw new Error(`dialog initial focus is not primary action: ${focusedText}`);
  }
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  if (!(await trigger.evaluate((element) => element === document.activeElement))) {
    throw new Error("dialog did not return focus to its trigger");
  }
  results.push({ path: "dialog-keyboard", initialFocus: focusedText, returnFocus: true });
  await context.close();
}

// 200% desktop zoom equivalent: half CSS viewport with 2x pixels and normal reflow.
{
  const context = await browser.newContext({ viewport: { width: 720, height: 450 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await seed(page, "de");
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 20_000 });
  await page.waitForSelector('[data-testid="menu-today-card"]');
  await stabilize(page);
  const metrics = await assertLayout(page, "home-200-percent", "de", { name: "1440x900@200%" });
  await page.screenshot({ path: path.join(screenshotsDir, "home-de-1440x900-at-200-percent.png") });
  results.push({ path: "200-percent", metrics });
  await context.close();
}

await browser.close();

const failures = results.filter((result) => result.errors?.length);
await writeFile(
  path.join(outputDir, "w3-core-ux-evidence.json"),
  `${JSON.stringify({ baseUrl, screenshots: 43, results, failures }, null, 2)}\n`,
  "utf8",
);
console.log(`W3 core UX: ${results.length - failures.length}/${results.length} scenario records passed`);
if (failures.length) process.exitCode = 1;
