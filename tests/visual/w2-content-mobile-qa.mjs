import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.FOLDWINK_E2E_URL ?? "http://localhost:5187/";
const root = process.cwd();
const outputDir = path.join(root, "reports", "w2-content-2026-09-14");
const languages = ["en", "ru", "de"];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch();
const results = [];

for (const language of languages) {
  const daily = JSON.parse(
    await readFile(
      path.join(root, "puzzles", "manifests", `daily.${language}.2026-09-14.json`),
      "utf8",
    ),
  );
  const starters = JSON.parse(
    await readFile(path.join(root, "puzzles", "manifests", `starters.${language}.json`), "utf8"),
  );
  const starterIds = new Set(starters.entries.map((entry) => entry.puzzleRef.puzzleId));

  for (let offset = 0; offset < daily.entries.length; offset += 6) {
    await Promise.all(daily.entries.slice(offset, offset + 6).map(async (entry) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.addInitScript((lang) => {
      localStorage.setItem("foldwink:lang", lang);
      localStorage.setItem("foldwink:onboarded", "true");
      localStorage.setItem("foldwink:analytics-consent", "denied");
    }, language);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${baseUrl}?vs=${encodeURIComponent(entry.puzzleId)}&m=0&t=0`, {
      waitUntil: "networkidle",
      timeout: 20_000,
    });
    await page.waitForSelector(".fw-card", { timeout: 20_000 });
    await page.addStyleTag({
      content: "*,*::before,*::after{animation:none!important;transition:none!important}",
    });
    const metrics = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const cards = [...document.querySelectorAll(".fw-card")];
      const grid = document.querySelector('[role="grid"]');
      const gridRect = grid?.getBoundingClientRect();
      const cardIssues = cards.flatMap((card) => {
        const rect = card.getBoundingClientRect();
        const label = card.querySelector("span.relative");
        const labelRect = label?.getBoundingClientRect();
        const clipped = labelRect
          ? labelRect.left < rect.left + 2 ||
            labelRect.right > rect.right - 2 ||
            labelRect.top < rect.top + 2 ||
            labelRect.bottom > rect.bottom - 2
          : false;
        return rect.width < 44 || rect.height < 44 || clipped
          ? [{ value: card.getAttribute("data-key"), width: rect.width, height: rect.height, clipped }]
          : [];
      });
      return {
        title: document.title,
        cardCount: cards.length,
        bodyOverflow: document.documentElement.scrollWidth > viewportWidth + 1,
        gridOverflow: gridRect ? gridRect.left < -1 || gridRect.right > viewportWidth + 1 : true,
        cardIssues,
      };
    });
    const starter = starterIds.has(entry.puzzleId);
    if (starter) {
      await page.screenshot({
        path: path.join(outputDir, `${language}-${entry.puzzleId}-390x844.png`),
        fullPage: false,
      });
    }
    results.push({ language, puzzleId: entry.puzzleId, starter, errors, ...metrics });
      await context.close();
    }));
  }
}

await browser.close();
const failures = results.filter(
  (item) =>
    item.errors.length > 0 ||
    item.cardCount !== 16 ||
    item.bodyOverflow ||
    item.gridOverflow ||
    item.cardIssues.length > 0,
);
await writeFile(
  path.join(outputDir, "mobile-fit.json"),
  `${JSON.stringify({ viewport: "390x844@100%", boards: results.length, failures }, null, 2)}\n`,
  "utf8",
);
console.log(`W2 mobile fit: ${results.length - failures.length}/${results.length} passed`);
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
