import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "public", "favicon.svg");
const appIconPath = path.join(
  root,
  "ios",
  "App",
  "App",
  "Assets.xcassets",
  "AppIcon.appiconset",
  "AppIcon-512@2x.png",
);
const splashDir = path.join(root, "ios", "App", "App", "Assets.xcassets", "Splash.imageset");
const splashFiles = [
  "splash-2732x2732.png",
  "splash-2732x2732-1.png",
  "splash-2732x2732-2.png",
];

const force = process.argv.includes("--force");
const allSplashExist = splashFiles.every((f) => existsSync(path.join(splashDir, f)));
const allAssetsExist = existsSync(appIconPath) && allSplashExist;

if (allAssetsExist && !force) {
  console.log(
    "Foldwink iOS assets already present (1024x1024 icon + splash). Skipping rebuild. Use --force to regenerate.",
  );
  process.exit(0);
}

let playwright;
try {
  playwright = await import("playwright");
} catch {
  if (allAssetsExist) {
    console.warn("Playwright package not found; retaining existing iOS assets.");
    process.exit(0);
  }
  console.error("Playwright is required to generate iOS assets. Please run npm install.");
  process.exit(1);
}

const source = await readFile(sourcePath, "utf8");
const dataUrl = "data:image/svg+xml;base64," + Buffer.from(source).toString("base64");

let browser;
try {
  browser = await playwright.chromium.launch();
} catch (err) {
  if (allAssetsExist) {
    console.warn("Playwright chromium browser not installed; using existing iOS assets.");
    process.exit(0);
  }
  console.error(
    "Cannot generate iOS assets: Playwright Chromium browser is not installed.\n" +
      "Run 'npx playwright install chromium' or ensure assets exist in ios/App/App/Assets.xcassets.\n",
    err,
  );
  process.exit(1);
}

try {
  // 1. Build 1024x1024 AppIcon
  const iconPage = await browser.newPage({
    viewport: { width: 1024, height: 1024 },
    deviceScaleFactor: 1,
  });
  await iconPage.setContent(
    '<style>html,body{margin:0;width:100%;height:100%;background:#101310;overflow:hidden;}img{display:block;width:100%;height:100%}</style><img alt="" src="' +
      dataUrl +
      '">',
  );
  await iconPage.screenshot({
    path: appIconPath,
    type: "png",
  });
  await iconPage.close();

  // 2. Build 2732x2732 Universal Splash
  const splashPage = await browser.newPage({
    viewport: { width: 2732, height: 2732 },
    deviceScaleFactor: 1,
  });
  await splashPage.setContent(
    "<style>" +
      "html,body{margin:0;width:100%;height:100%;background:#101310;display:flex;align-items:center;justify-content:center;overflow:hidden;}" +
      "img{width:512px;height:512px;display:block;}" +
      "</style>" +
      '<img alt="" src="' +
      dataUrl +
      '">',
  );
  for (const filename of splashFiles) {
    await splashPage.screenshot({
      path: path.join(splashDir, filename),
      type: "png",
    });
  }
  await splashPage.close();
  console.log("Built Foldwink iOS assets: 1024x1024 icon + universal splash screens.");
} finally {
  await browser.close();
}
