/**
 * W4 acceptance: TEST-34 (sound lifecycle) and TEST-35 (motion lifecycle).
 * This suite measures the shipped production bundle, not component mocks.
 */

import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  BASE_URL,
  runCases,
  seedDismissedOnboarding,
  seedLocalStorage,
  startEasyPractice,
  waitForMenu,
} from "./lib/harness.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POOL_DIR = path.resolve(__dirname, "../../puzzles/pool");

async function loadEasyPuzzlesByTitle() {
  const files = (await readdir(POOL_DIR)).filter((file) => file.endsWith(".json"));
  const map = new Map();
  for (const file of files) {
    const puzzle = JSON.parse(await readFile(path.join(POOL_DIR, file), "utf8"));
    if (puzzle.difficulty === "easy") {
      map.set(
        puzzle.title,
        puzzle.groups.map((group) => group.items),
      );
    }
  }
  return map;
}

async function instrumentAnimationFrames(page) {
  await page.addInitScript(() => {
    const nativeRequest = window.requestAnimationFrame.bind(window);
    const nativeCancel = window.cancelAnimationFrame.bind(window);
    const active = new Set();
    window.__foldwinkActiveAnimationFrames = active;
    window.requestAnimationFrame = (callback) => {
      let id = 0;
      id = nativeRequest((time) => {
        active.delete(id);
        callback(time);
      });
      active.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      active.delete(id);
      nativeCancel(id);
    };
  });
}

async function activeAnimationFrames(page) {
  return page.evaluate(() => window.__foldwinkActiveAnimationFrames?.size ?? -1);
}

async function openEasyGame(page) {
  await seedDismissedOnboarding(page);
  await page.goto(BASE_URL);
  await waitForMenu(page);
  await startEasyPractice(page);
  await page.waitForSelector(".fw-card");
}

async function groupsForCurrentPuzzle(page, puzzles) {
  const title = (await page.locator("header h1").textContent())?.trim();
  const groups = puzzles.get(title);
  if (!groups) throw new Error(`no easy-puzzle fixture for visible title "${title}"`);
  return groups;
}

async function selectGroup(page, group) {
  for (const item of group) {
    await page.locator(`button[aria-label="${item}"]`).first().click();
  }
}

async function measureTerminalTransition(page, puzzles) {
  const groups = await groupsForCurrentPuzzle(page, puzzles);
  for (const group of groups.slice(0, 3)) {
    await selectGroup(page, group);
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await page.waitForTimeout(80);
  }
  await selectGroup(page, groups[3]);
  await page.evaluate(() => {
    window.__foldwinkResultElapsed = null;
    const submit = [...document.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Submit" && !button.disabled,
    );
    if (!submit) throw new Error("enabled Submit button not found");
    submit.addEventListener(
      "click",
      () => {
        const startedAt = globalThis.performance.now();
        const observer = new globalThis.MutationObserver(() => {
          if (!document.querySelector('[data-testid="result-screen"]')) return;
          window.__foldwinkResultElapsed = globalThis.performance.now() - startedAt;
          observer.disconnect();
        });
        observer.observe(document.body, { childList: true, subtree: true });
      },
      { once: true },
    );
  });
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await page.waitForFunction(() => typeof window.__foldwinkResultElapsed === "number", null, {
    timeout: 2_000,
  });
  return page.evaluate(() => window.__foldwinkResultElapsed);
}

const puzzles = await loadEasyPuzzlesByTitle();

await runCases("w4-feedback-motion", [
  {
    name: "reduced motion disables deal, tilt and decorative animation frames",
    contextOptions: { reducedMotion: "reduce" },
    fn: async ({ page }) => {
      await instrumentAnimationFrames(page);
      await openEasyGame(page);
      await page.waitForTimeout(500);

      const cardState = await page.locator(".fw-card").evaluateAll((cards) =>
        cards.map((card) => {
          const style = getComputedStyle(card);
          return {
            animationName: style.animationName,
            opacity: style.opacity,
            tiltX: style.getPropertyValue("--tilt-x").trim(),
            tilting: card.getAttribute("data-tilting"),
          };
        }),
      );
      if (cardState.length !== 16) throw new Error(`expected 16 cards, got ${cardState.length}`);
      if (
        cardState.some(
          (card) =>
            card.animationName !== "none" ||
            card.opacity !== "1" ||
            card.tiltX !== "0deg" ||
            card.tilting !== null,
        )
      ) {
        throw new Error(`motion remained active: ${JSON.stringify(cardState[0])}`);
      }

      const box = await page.locator(".fw-card").first().boundingBox();
      if (!box) throw new Error("first card has no box");
      await page.mouse.move(box.x + box.width - 2, box.y + 2);
      for (let index = 0; index < 10; index += 1) {
        await page.getByRole("button", { name: "Shuffle" }).click();
      }
      await page.waitForTimeout(250);
      if ((await activeAnimationFrames(page)) !== 0) {
        throw new Error(`reduced-motion page retained ${await activeAnimationFrames(page)} rAF`);
      }
      if ((await page.locator(".fw-card").count()) !== 16) {
        throw new Error("rapid Shuffle changed the card count");
      }
    },
  },
  {
    name: "pointer tilt settles, pointer leave resets, hidden tab cancels pending rAF",
    fn: async ({ page }) => {
      await instrumentAnimationFrames(page);
      await openEasyGame(page);
      await page.waitForTimeout(650);
      if ((await activeAnimationFrames(page)) !== 0) {
        throw new Error(`idle game began with ${await activeAnimationFrames(page)} pending rAF`);
      }

      const card = page.locator(".fw-card").first();
      const box = await card.boundingBox();
      if (!box) throw new Error("first card has no box");
      await page.mouse.move(box.x + box.width - 2, box.y + 2);
      await page.waitForTimeout(700);
      if ((await activeAnimationFrames(page)) !== 0) {
        throw new Error(`settled hover retained ${await activeAnimationFrames(page)} pending rAF`);
      }

      await page.mouse.move(1, 1);
      await page.waitForTimeout(700);
      const reset = await card.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          tiltX: style.getPropertyValue("--tilt-x").trim(),
          tiltY: style.getPropertyValue("--tilt-y").trim(),
          tilting: element.getAttribute("data-tilting"),
        };
      });
      if (reset.tiltX !== "0deg" || reset.tiltY !== "0deg" || reset.tilting !== null) {
        throw new Error(`pointer leave left a stale transform: ${JSON.stringify(reset)}`);
      }

      await page.mouse.move(box.x + box.width - 2, box.y + 2);
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
        document.dispatchEvent(new globalThis.Event("visibilitychange"));
      });
      await page.waitForTimeout(80);
      if ((await activeAnimationFrames(page)) !== 0) {
        throw new Error(`hidden page retained ${await activeAnimationFrames(page)} pending rAF`);
      }
    },
  },
  {
    name: "persisted mute creates no AudioContext and gameplay remains interactive",
    fn: async ({ page }) => {
      await seedLocalStorage(page, {
        "foldwink:onboarded": true,
        "foldwink:sound": { muted: true, volume: 0.75 },
      });
      await page.addInitScript(() => {
        const NativeAudioContext = window.AudioContext;
        window.__foldwinkAudioContextCount = 0;
        if (!NativeAudioContext) return;
        window.AudioContext = new Proxy(NativeAudioContext, {
          construct(target, args) {
            window.__foldwinkAudioContextCount += 1;
            return Reflect.construct(target, args, target);
          },
        });
      });
      const audioRequests = [];
      page.on("request", (request) => {
        if (new globalThis.URL(request.url()).pathname.includes("/audio/")) {
          audioRequests.push(request.url());
        }
      });

      await page.goto(BASE_URL);
      await waitForMenu(page);
      await startEasyPractice(page);
      const card = page.locator(".fw-card").first();
      await card.click();
      if ((await card.getAttribute("aria-pressed")) !== "true") {
        throw new Error("muted gameplay did not select a card");
      }
      const count = await page.evaluate(() => window.__foldwinkAudioContextCount);
      if (count !== 0 || audioRequests.length !== 0) {
        throw new Error(`mute initialized audio: contexts=${count}, requests=${audioRequests.length}`);
      }
    },
  },
  {
    name: "result transition stays under 700 ms with normal motion",
    fn: async ({ page }) => {
      await openEasyGame(page);
      const elapsed = await measureTerminalTransition(page, puzzles);
      if (elapsed > 700) throw new Error(`result transition took ${elapsed.toFixed(1)} ms`);
    },
  },
  {
    name: "result transition stays under 700 ms with reduced motion",
    contextOptions: { reducedMotion: "reduce" },
    fn: async ({ page }) => {
      await openEasyGame(page);
      const elapsed = await measureTerminalTransition(page, puzzles);
      if (elapsed > 700) throw new Error(`reduced-motion transition took ${elapsed.toFixed(1)} ms`);
    },
  },
]);
