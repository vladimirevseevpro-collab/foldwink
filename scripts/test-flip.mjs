import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("http://localhost:5173");

  // Wait for Play button
  await page.waitForSelector("button");
  const buttons = await page.$$("button");
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text.includes("Play") || text.includes("Играть")) {
      await btn.click();
      break;
    }
  }

  // Wait for game board
  await page.waitForSelector('[role="grid"] button');
  console.log("Game board loaded.");

  // Try to click first 4 cards
  const cards = await page.$$('[role="grid"] button');
  for (let i = 0; i < 4; i++) {
    await cards[i].click();
    await new Promise((r) => setTimeout(r, 100)); // wait a bit
  }

  // Press enter to submit
  await page.keyboard.press("Enter");
  console.log("Submitted first 4 cards.");

  await new Promise((r) => setTimeout(r, 500));

  // Check if shake or pop happened
  const hasShake = await page
    .$eval('[role="grid"]', (el) => el.className.includes("shake"))
    .catch(() => false);
  console.log("Grid shook:", hasShake);

  await browser.close();
})();
