import { chromium } from "playwright";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = process.env.FOLDWINK_E2E_URL ?? "http://127.0.0.1:5187/";
const here = path.dirname(fileURLToPath(import.meta.url));
const poolDir = path.resolve(here, "../../puzzles/pool");
const screenshotsDir = path.join(here, "screenshots");
const pool = await Promise.all(
  (await readdir(poolDir))
    .filter((file) => file.endsWith(".json"))
    .map(async (file) => JSON.parse(await readFile(path.join(poolDir, file), "utf8"))),
);
const profiles = [
  ["desktop", 1440, 900],
  ["tablet", 1024, 768],
  ["mobile", 390, 844],
];

function findPuzzle(words) {
  const visible = new Set(words.map((word) => word.trim()));
  return pool.find((puzzle) =>
    puzzle.groups.flatMap((group) => group.items).every((item) => visible.has(item)),
  );
}

await mkdir(screenshotsDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for (const [name, width, height] of profiles) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("foldwink:onboarded", "true");
      localStorage.setItem("foldwink:lang", "en");
      Object.defineProperty(window, "indexedDB", { value: undefined, configurable: true });
    });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Easy puzzle", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-state="idle"]').length === 16);
    const puzzle = findPuzzle(await page.locator('[data-state="idle"]').allTextContents());
    if (!puzzle) throw new Error(`${name}: puzzle fixture not found`);
    for (const group of puzzle.groups) {
      for (const word of group.items) {
        await page.getByRole("button", { name: word, exact: true }).click();
      }
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await page.waitForTimeout(180);
    }
    await page.waitForTimeout(900);
    const autoResultVisible = await page.getByTestId("result-screen").isVisible().catch(() => false);
    const temporaryButton = page.getByRole("button", { name: "View unsaved result", exact: true });
    await temporaryButton.waitFor();
    const warningPath = path.join(screenshotsDir, `${name}-terminal-unsaved-warning.png`);
    await page.screenshot({ path: warningPath, fullPage: true });
    await temporaryButton.click();
    await page.getByTestId("result-screen").waitFor();
    report.push({
      profile: name,
      state: "terminal-storage-failure",
      path: warningPath,
      autoResultVisible,
      explicitTemporaryAction: true,
      documentWidth: await page.evaluate(() => document.documentElement.scrollWidth),
      horizontalOverflow: await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    });
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(here, "unsaved-terminal-evidence.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), report }, null, 2),
);
console.log(JSON.stringify(report, null, 2));
