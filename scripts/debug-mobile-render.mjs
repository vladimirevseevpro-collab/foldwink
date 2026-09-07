import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "tmp-debug");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
const page = await ctx.newPage();

// 1. Direct game URL — bypass itch wrapper entirely
console.log("--- 1. direct game on itch CDN ---");
await page.goto("https://html.itch.zone/html/17237271-1646073/index.html", {
  waitUntil: "networkidle",
  timeout: 30000,
});
await page.waitForTimeout(2000);
await page.screenshot({ path: join(outDir, "1-direct.png"), fullPage: false });
const meta1 = await page.evaluate(() => ({
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  devicePixelRatio: window.devicePixelRatio,
  rootW: document.documentElement.clientWidth,
  rootH: document.documentElement.clientHeight,
  bodyW: document.body.clientWidth,
  bodyH: document.body.clientHeight,
  viewport: document.querySelector('meta[name="viewport"]')?.getAttribute("content"),
  rootFontSize: getComputedStyle(document.documentElement).fontSize,
  bodyFontSize: getComputedStyle(document.body).fontSize,
}));
console.log(JSON.stringify(meta1, null, 2));

// 2. Itch wrapper page
console.log("\n--- 2. itch wrapper page ---");
await page.goto("https://neural-void.itch.io/foldwink", {
  waitUntil: "networkidle",
  timeout: 30000,
});
await page.waitForTimeout(2000);
await page.screenshot({ path: join(outDir, "2-itch-before-tap.png"), fullPage: false });

// Tap "Run game" button if present
const runBtn = page.locator(".load_iframe_btn").first();
if (await runBtn.isVisible().catch(() => false)) {
  console.log("Tapping Run game...");
  await runBtn.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(outDir, "3-itch-after-tap.png"), fullPage: false });

  // Try to read iframe content
  const frames = page.frames();
  console.log(`Frames: ${frames.length}`);
  for (const f of frames) {
    const u = f.url();
    if (u.includes("html.itch.zone")) {
      console.log(`Game iframe URL: ${u}`);
      const meta2 = await f
        .evaluate(() => ({
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          rootW: document.documentElement.clientWidth,
          rootH: document.documentElement.clientHeight,
          bodyFontSize: getComputedStyle(document.body).fontSize,
          rootFontSize: getComputedStyle(document.documentElement).fontSize,
        }))
        .catch((e) => ({ error: String(e) }));
      console.log("inside iframe:", JSON.stringify(meta2, null, 2));
    }
  }
}

await browser.close();
console.log(`\nScreenshots in ${outDir}/`);
