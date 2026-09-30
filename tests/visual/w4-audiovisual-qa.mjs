/** Rendered W4 evidence at the three mandatory acceptance viewports. */
import { chromium } from "playwright";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.FOLDWINK_E2E_URL ?? "http://localhost:4175/";
const root = process.cwd();
const outputDir = path.join(root, "reports", "w4-audiovisual-2026-09-14");
const screenshotsDir = path.join(outputDir, "screenshots");
const profiles = [
  { language: "en", name: "1440x900", width: 1440, height: 900, submit: "Submit" },
  { language: "ru", name: "1024x768", width: 1024, height: 768, submit: "Подтвердить" },
  { language: "de", name: "390x844", width: 390, height: 844, submit: "Bestätigen" },
];

await mkdir(screenshotsDir, { recursive: true });

async function loadPool(language) {
  const dir = path.join(root, "puzzles", language === "en" ? "pool" : `${language}/pool`);
  const files = (await readdir(dir)).filter((file) => file.endsWith(".json"));
  return Promise.all(
    files.map(async (file) => JSON.parse(await readFile(path.join(dir, file), "utf8"))),
  );
}

const pools = Object.fromEntries(
  await Promise.all(
    ["en", "ru", "de"].map(async (language) => [language, await loadPool(language)]),
  ),
);

function signature(values) {
  return [...values].map((value) => value.toLocaleLowerCase()).sort().join("\u001f");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function currentPuzzle(page, language) {
  const values = await page.locator(".fw-card").evaluateAll((cards) =>
    cards.map((card) => card.getAttribute("data-key") ?? ""),
  );
  const target = signature(values);
  const puzzle = pools[language].find(
    (candidate) => signature(candidate.groups.flatMap((group) => group.items)) === target,
  );
  if (!puzzle) throw new Error(`${language}: could not resolve the rendered board`);
  return puzzle;
}

async function assertNoOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    screen: document.querySelector("main")?.getAttribute("data-fw-screen"),
  }));
  if (metrics.scroll > metrics.viewport + 1) {
    throw new Error(`${label}: horizontal overflow ${JSON.stringify(metrics)}`);
  }
  return metrics;
}

async function seed(page, language) {
  await page.addInitScript(
    ({ language }) => {
      localStorage.setItem("foldwink:onboarded", "true");
      localStorage.setItem("foldwink:lang", language);
      localStorage.setItem("foldwink:analytics-consent", "denied");
      localStorage.setItem(
        "foldwink:archivistProfile",
        JSON.stringify({
          version: 2,
          level: 8,
          xp: 5200,
          ink: 125,
          wax: 14,
          prestige: 2,
          discipline: "scribe",
          sealId: "seal_raven",
          nibId: "nib_brass",
          titleId: "title_truths",
          collectedStampIds: [
            "stamp_morning_brew",
            "stamp_raven_seal",
            "stamp_midori_compass",
            "stamp_ink_well",
            "stamp_flawless_sun",
            "stamp_iron_contract",
            "stamp_gold_charter",
            "stamp_botanical_fern",
            "stamp_palimpsest",
          ],
          contractsAttempted: 0,
          contractsWon: 0,
          activeContract: null,
          consumedRewardKeys: [],
          rewardReceipts: {},
          migrationReceipts: [],
        }),
      );
    },
    { language },
  );
}

const browser = await chromium.launch();
const results = [];

for (const profile of profiles) {
  const context = await browser.newContext({
    viewport: { width: profile.width, height: profile.height },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await seed(page, profile.language);
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 20_000 });
  await page.getByTestId("menu-today-card").waitFor({ timeout: 20_000 });
  await page.waitForTimeout(400);

  const home = await assertNoOverflow(page, `${profile.name}/home`);
  await page.screenshot({
    path: path.join(screenshotsDir, `home-${profile.language}-${profile.name}.png`),
  });

  await page.getByRole("button", { name: /Passport|Паспорт|Pass/i }).click();
  const modal = page.locator(".fixed.inset-0.z-50").last();
  await modal.waitFor();
  await modal.locator("button").nth(1).click();
  await page.waitForTimeout(250);
  const passport = await assertNoOverflow(page, `${profile.name}/passport-stamps`);
  await page.screenshot({
    path: path.join(screenshotsDir, `passport-stamps-${profile.language}-${profile.name}.png`),
  });
  await modal.getByRole("button", { name: "✕" }).click();

  await page.getByTestId("menu-practice-toggle").click();
  await page.getByTestId("menu-practice-easy").click();
  await page.waitForSelector('[data-fw-screen="game"] .fw-card', { timeout: 20_000 });
  await page.waitForTimeout(500);
  const puzzle = await currentPuzzle(page, profile.language);
  const game = await assertNoOverflow(page, `${profile.name}/game`);
  await page.screenshot({
    path: path.join(screenshotsDir, `game-${profile.language}-${profile.name}.png`),
  });

  for (const group of puzzle.groups) {
    for (const item of group.items) {
      await page
        .locator(".fw-card")
        .filter({ hasText: new RegExp(`^\\s*${escapeRegex(item)}\\s*$`, "i") })
        .first()
        .click();
    }
    await page.getByRole("button", { name: profile.submit, exact: true }).click();
    await page.waitForTimeout(70);
  }
  await page.getByTestId("result-screen").waitFor({ state: "visible", timeout: 3_000 });
  if (profile.language === "en") {
    await page.screenshot({
      path: path.join(screenshotsDir, `result-immediate-${profile.language}-${profile.name}.png`),
    });
  }
  await page.waitForTimeout(1_050);
  const result = await assertNoOverflow(page, `${profile.name}/result-settled`);
  await page.screenshot({
    path: path.join(screenshotsDir, `result-settled-${profile.language}-${profile.name}.png`),
  });

  if (errors.length > 0) throw new Error(`${profile.name}: ${errors.join(" | ")}`);
  results.push({ profile, home, passport, game, result, errors });
  await context.close();
}

await browser.close();
await writeFile(
  path.join(outputDir, "visual-evidence.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl, results }, null, 2)}\n`,
  "utf8",
);
console.log(`W4 visual evidence: ${results.length} viewport records, ${screenshotsDir}`);
