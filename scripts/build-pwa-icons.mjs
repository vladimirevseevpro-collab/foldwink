import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "public", "favicon.svg");
const iconsDir = path.join(root, "public", "icons");
const source = await readFile(sourcePath, "utf8");
const dataUrl = "data:image/svg+xml;base64," + Buffer.from(source).toString("base64");
const targets = [
  { name: "apple-touch-icon.png", size: 180 },
  { name: path.join("icons", "icon-192.png"), size: 192 },
  { name: path.join("icons", "icon-512.png"), size: 512 },
];

await mkdir(iconsDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const target of targets) {
    const page = await browser.newPage({
      viewport: { width: target.size, height: target.size },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      '<style>html,body{margin:0;width:100%;height:100%;background:#101310}img{display:block;width:100%;height:100%}</style><img alt="" src="' +
        dataUrl +
        '">',
    );
    await page.screenshot({
      path: path.join(root, "public", target.name),
      type: "png",
    });
    await page.close();
  }
} finally {
  await browser.close();
}

console.log("Built Foldwink PWA icons: apple 180, 192, 512.");
