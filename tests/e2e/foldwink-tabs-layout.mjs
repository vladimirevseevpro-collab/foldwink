/**
 * Guards long solved/Wink labels on the smallest supported mobile screens.
 * The fixture resumes a real medium puzzle whose longest label is 47 chars.
 */

import { BASE_URL, runCases, seedDismissedOnboarding } from "./lib/harness.mjs";

const PUZZLE_ID = "puzzle-0323";
const LONG_LABEL = "Liquid-Medium Cooking Techniques";
const ORDER = [
  "Poaching",
  "Simmering",
  "Braising",
  "Blanching",
  "Baking",
  "Roasting",
  "Steaming",
  "Deep-Frying",
  "Pan-Frying",
  "Searing",
  "Griddle Cooking",
  "Plancha",
  "Grilling",
  "Broiling",
  "Barbecuing",
  "Tandoor Cooking",
];

const CONTENT_FIXTURES = [
  {
    id: "puzzle-0199",
    order: [
      "Flour",
      "Sugar",
      "Baking Soda",
      "Vanilla Extract",
      "Carrot",
      "Radish",
      "Beet",
      "Turnip",
      "Ketchup",
      "Mustard",
      "Relish",
      "Hot Sauce",
      "Basil",
      "Parsley",
      "Cilantro",
      "Dill",
    ],
  },
  {
    id: "puzzle-0276",
    order: [
      "Backpack",
      "Briefcase",
      "Tote",
      "Messenger Bag",
      "Bicycle",
      "Scooter",
      "Skateboard",
      "Moped",
      "Map",
      "Compass",
      "GPS",
      "Road Atlas",
      "Bus",
      "Train",
      "Tram",
      "Subway",
    ],
  },
  {
    id: "puzzle-0290",
    order: [
      "Dish Soap",
      "Bleach",
      "Detergent",
      "Glass Cleaner",
      "Towel",
      "Bedsheet",
      "Pillowcase",
      "Tablecloth",
      "Doormat",
      "Coat Rack",
      "Umbrella Stand",
      "Shoe Rack",
      "Jeans",
      "T-shirt",
      "Hoodie",
      "Shorts",
    ],
  },
  {
    id: "puzzle-0301",
    order: [
      "Popcorn",
      "Pretzel",
      "Candy",
      "Soda",
      "Date",
      "Showtime",
      "Price",
      "Barcode",
      "Director",
      "Actor",
      "Producer",
      "Editor",
      "Lobby",
      "Aisle",
      "Balcony",
      "Auditorium",
    ],
  },
  {
    id: "puzzle-0255",
    order: [
      "Light Bulb",
      "Extension Cord",
      "Plug",
      "Switch",
      "Glue",
      "Tape",
      "Epoxy",
      "Rubber Cement",
      "Goggles",
      "Hard Hat",
      "Earplugs",
      "Work Gloves",
      "Roller",
      "Brush",
      "Tray",
      "Drop Cloth",
    ],
  },
  {
    id: "puzzle-0316",
    order: [
      "Passport",
      "Visa",
      "Boarding Pass",
      "ID Card",
      "Carry-on",
      "Suitcase",
      "Duffel",
      "Garment Bag",
      "Gate",
      "Lounge",
      "Terminal",
      "Baggage Claim",
      "Seatbelt",
      "Overhead Bin",
      "Tray Table",
      "Call Button",
    ],
  },
  {
    id: "puzzle-0325",
    order: [
      "Americano",
      "Latte",
      "Cappuccino",
      "Espresso",
      "Black Tea",
      "Green Tea",
      "Chai",
      "Herbal Tea",
      "Apple",
      "Orange",
      "Banana",
      "Grapes",
      "Soup",
      "Salad",
      "Quiche",
      "Grilled Cheese",
    ],
  },
  {
    id: "puzzle-0317",
    order: [
      "Sunscreen",
      "Sun Hat",
      "Beach Umbrella",
      "Cover-up",
      "Bucket",
      "Spade",
      "Sieve",
      "Sand Mold",
      "Swim Goggles",
      "Snorkel",
      "Swim Fins",
      "Kickboard",
      "Shell",
      "Pebble",
      "Sea Glass",
      "Driftwood",
    ],
  },
  {
    id: "hard-024",
    expectTabs: false,
    order: [
      "Trellis",
      "Stake",
      "Plant Tie",
      "Tomato Cage",
      "Seeds",
      "Soil",
      "Fertilizer",
      "Pots",
      "Mulch",
      "Plant Cover",
      "Shade Cloth",
      "Netting",
      "Gloves",
      "Boots",
      "Sun Hat",
      "Raincoat",
    ],
  },
  {
    id: "puzzle-0394",
    order: [
      "Steering Wheel",
      "Dashboard",
      "Seatbelt",
      "Rearview Mirror",
      "Battery",
      "Radiator",
      "Spark Plug",
      "Oil Filter",
      "Jack",
      "Jumper Cables",
      "Warning Triangle",
      "Tire Gauge",
      "Car Shampoo",
      "Sponge",
      "Wax",
      "Microfiber Cloth",
    ],
  },
];

async function seedMediumSession(page, puzzleId = PUZZLE_ID, order = ORDER) {
  await seedDismissedOnboarding(page);
  await page.addInitScript(
    ({ puzzleId, order }) => {
      const now = Date.now();
      localStorage.setItem(
        "foldwink:active-session",
        JSON.stringify({
          puzzleId,
          savedAt: now,
          active: {
            puzzleId,
            mode: "standard",
            order,
            selection: [],
            solvedGroupIds: [],
            mistakesUsed: 0,
            startedAt: now,
            countsToStats: false,
            winkedGroupId: null,
          },
        }),
      );
    },
    { puzzleId, order },
  );
}

async function continueSeededSession(page) {
  await page.getByTestId("menu-continue-card").getByRole("button").click();
  await page.waitForSelector('[data-fw-screen="game"] .fw-card');
}

async function assertPromotedBoardFits(page, expectTabs = true) {
  await page.waitForSelector('[data-fw-screen="game"] .fw-card');
  const tabs = page.getByRole("group", { name: "Foldwink Tabs" });
  if (expectTabs) {
    await tabs.waitFor({ state: "visible" });
  } else if ((await tabs.count()) !== 0) {
    throw new Error("hard puzzle must not render Foldwink Tabs");
  }
  const cards = await page.locator(".fw-card").count();
  if (cards !== 16) throw new Error("expected 16 cards, got " + cards);
  const grid = await page.getByRole("grid", { name: "Puzzle grid" }).boundingBox();
  if (!grid || grid.width < 342)
    throw new Error("undersized 390px grid: " + JSON.stringify(grid));
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) throw new Error("promoted board causes page-level horizontal overflow");
}

async function assertExpandedLabelFits(page) {
  const wink = page
    .getByRole("button", {
      name: "Wink this tab to reveal the full category",
    })
    .nth(3);
  await wink.click();
  await wink.click();

  const tab = page.getByLabel(`Winked category: ${LONG_LABEL}`);
  await tab.waitFor({ state: "visible" });
  const geometry = await tab.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    offsetHeight: element.offsetHeight,
    height: element.getBoundingClientRect().height,
  }));
  if (geometry.scrollWidth > geometry.clientWidth + 1) {
    throw new Error(`long tab overflows horizontally: ${JSON.stringify(geometry)}`);
  }
  if (geometry.scrollHeight > geometry.clientHeight + 1) {
    throw new Error(`long tab is clipped vertically: ${JSON.stringify(geometry)}`);
  }
  if (geometry.offsetHeight < 56) {
    throw new Error(`long tab lost its fixed touch surface: ${JSON.stringify(geometry)}`);
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) throw new Error("long revealed label causes page-level horizontal overflow");
}

await runCases("foldwink-tabs-layout", [
  {
    name: "320px: a 32-character Wink label fits the fixed tab surface",
    viewport: { width: 320, height: 568 },
    fn: async ({ page }) => {
      await seedMediumSession(page);
      await page.goto(BASE_URL);
      await continueSeededSession(page);
      await assertExpandedLabelFits(page);
    },
  },
  {
    name: "390px: a 32-character Wink label fits the fixed tab surface",
    viewport: { width: 390, height: 844 },
    fn: async ({ page }) => {
      await seedMediumSession(page);
      await page.goto(BASE_URL);
      await continueSeededSession(page);
      await assertExpandedLabelFits(page);
    },
  },
  ...CONTENT_FIXTURES.map(({ id, order, expectTabs = true }) => ({
    name: "390px: promoted " + id + " keeps 16 cards, Tabs, and a full-width grid",
    viewport: { width: 390, height: 844 },
    fn: async ({ page }) => {
      await seedMediumSession(page, id, order);
      await page.goto(BASE_URL);
      await continueSeededSession(page);
      await assertPromotedBoardFits(page, expectTabs);
    },
  })),
]);
