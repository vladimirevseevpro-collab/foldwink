import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath =
  "file:///" +
  resolve(__dirname, "../itch.io/foldwink-cover-generator.html").replace(/\\/g, "/");
const outPath = resolve(__dirname, "../itch.io/export/foldwink-cover-630x500.png");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 700 } });
const page = await ctx.newPage();
await page.goto(htmlPath, { waitUntil: "networkidle" });
await page.waitForTimeout(600);

const dataUrl = await page.evaluate(() =>
  document.getElementById("cover").toDataURL("image/png"),
);
const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
writeFileSync(outPath, Buffer.from(base64, "base64"));
console.log("wrote", outPath);
await browser.close();
