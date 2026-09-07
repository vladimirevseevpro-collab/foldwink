import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "tmp-debug");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
const page = await ctx.newPage();

await page.goto("https://neural-void.com/foldwink/", {
  waitUntil: "networkidle",
  timeout: 30000,
});
await page.waitForTimeout(2000);
await page.screenshot({ path: join(outDir, "standalone-iphone.png"), fullPage: false });

const m = await page.evaluate(() => ({
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  bodyFontSize: getComputedStyle(document.body).fontSize,
  url: window.location.href,
}));
console.log(JSON.stringify(m, null, 2));
await browser.close();
