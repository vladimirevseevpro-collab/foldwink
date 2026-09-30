/** Render FW-032 board-feedback and voluntary-export states at acceptance sizes. */
import { chromium } from "playwright";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = process.env.FOLDWINK_E2E_URL ?? "http://localhost:4175/";
const evidenceDir = resolve("reports/w7-balance-retention-2026-09-14/visual");
const puzzleFiles = (await readdir(resolve("puzzles/pool"))).filter((name) => name.endsWith(".json"));
const englishPuzzles = await Promise.all(
  puzzleFiles.map(async (name) => JSON.parse(await readFile(resolve("puzzles/pool", name), "utf8"))),
);
const viewports = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "tablet-1024x768", width: 1024, height: 768 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

async function assertNoHorizontalOverflow(page, name) {
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  if (metrics.width > metrics.viewport + 1) {
    throw new Error(`${name}: horizontal overflow ${JSON.stringify(metrics)}`);
  }
}

async function currentPuzzle(page) {
  const values = await page.locator('[role="grid"] button[data-key]').evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute("data-key")).filter(Boolean),
  );
  const signature = [...values].sort().join("\u0000");
  const puzzle = englishPuzzles.find(
    (candidate) => [...candidate.groups.flatMap((group) => group.items)].sort().join("\u0000") === signature,
  );
  if (!puzzle) throw new Error(`could not resolve active puzzle from ${values.length} rendered cards`);
  return puzzle;
}

await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.setItem("foldwink:onboarded", "true"));
    await page.goto(baseUrl);
    await page.getByTestId("menu-today-card").waitFor({ timeout: 20_000 });
    await page.getByTestId("menu-practice-toggle").click();
    await page.getByTestId("menu-practice-easy").click();
    const puzzle = await currentPuzzle(page);
    for (const group of puzzle.groups) {
      for (const item of group.items) {
        await page.locator(`button[aria-label="${item}"]`).first().click();
      }
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await page.waitForTimeout(80);
    }
    await page.getByTestId("result-screen").waitFor({ timeout: 5_000 });
    await page.getByTestId("board-feedback-yes").click();
    await page.getByTestId("board-feedback").scrollIntoViewIfNeeded();
    await assertNoHorizontalOverflow(page, `${viewport.name} board feedback`);
    await page.screenshot({
      path: resolve(evidenceDir, `board-feedback-${viewport.name}.png`),
      fullPage: false,
    });

    await page.getByRole("button", { name: "Back to menu", exact: true }).click();
    await page.getByTestId("menu-today-card").waitFor();
    await page.getByRole("button", { name: "About · Privacy", exact: true }).click();
    await page.getByTestId("research-export").scrollIntoViewIfNeeded();
    await assertNoHorizontalOverflow(page, `${viewport.name} research export`);
    await page.screenshot({
      path: resolve(evidenceDir, `research-export-${viewport.name}.png`),
      fullPage: false,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`W7 FW-032 screenshots written to ${evidenceDir}`);
