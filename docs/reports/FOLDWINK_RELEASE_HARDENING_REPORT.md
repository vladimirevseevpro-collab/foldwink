# Foldwink — Release Hardening Report

**Date:** 2026-04-13
**Version:** 0.6.1 (from 0.6.0)
**Scope:** Disciplined release-hardening pass — UX fixes, browser QA, itch.io prep, asset pack, docs honesty.

---

## 1. What Was Done

### Phase 1 — UX / Front-End Fixes

| Fix                                        | Severity           | Detail                                                                                                                                                                                 |
| ------------------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onboarding overflow on 320px viewport      | HIGH               | Added `max-h-[calc(100vh-2rem)] overflow-y-auto` to modal inner container. "Got it" button now reachable on all viewports.                                                             |
| Wink indicator shown on Hard mode          | HIGH (found by QA) | `FoldwinkTabs` showed "wink ready" on Hard puzzles where Wink is disabled. Fixed: `winkAvailable` now checks `puzzle.difficulty === "medium"`. Wink chip hidden entirely on Hard/Easy. |
| Lint errors in `scripts/human-like-qa.mjs` | MEDIUM             | 24 ESLint errors from Node/browser globals not declared in config. Extended scripts eslint config to cover `.mjs` and `.js` files with proper globals.                                 |
| Header title overflow                      | LOW                | Added `min-w-0` + `truncate` safety on title text. Prevents long titles from pushing right-side controls off-screen on narrow viewports.                                               |
| Menu button container width                | LOW                | Changed `w-60` to `w-full max-w-60` for slightly better narrow viewport behavior.                                                                                                      |

### Phase 2 — Browser QA Hardening

| Improvement            | Detail                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Extended QA automation | Added 3 new test functions: `runMediumQA`, `runHardQA`, `runMobileMediumQA`                             |
| Seeded state testing   | Created `SEEDED_STATS` and `SEEDED_PROGRESS` to unlock Medium and Hard without playing through 5+ games |
| Medium flow coverage   | Foldwink Tabs visible, Wink indicator present, result screen reached, share button tested               |
| Hard flow coverage     | Master Challenge button enabled, Tabs visible, Wink correctly absent                                    |
| Mobile medium coverage | Tabs visible, no horizontal overflow                                                                    |
| Screenshot count       | 15 → **25** screenshots (10 new covering Medium, Hard, and mobile Medium)                               |
| Finding count          | 12 → **20** findings, **0 critical/high** (down from 1 high)                                            |
| Console errors         | **0** across all viewports and modes                                                                    |

### Phase 3-4 — Share Card + Sound Readiness

| Item                           | Status                                                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Share card preview tool        | `scripts/preview-share-cards.html` exists with 5 scenarios (easy win, medium wink, medium no-wink, hard loss, clutch) |
| Sound preview tool             | `scripts/preview-sounds.html` exists with all 9 cues                                                                  |
| iOS Safari AudioContext resume | Fix confirmed in code and prior manual session                                                                        |
| Sound mute persistence         | Confirmed working in automation                                                                                       |
| Share card visual quality      | **Unverified** — requires human eye                                                                                   |
| Sound quality                  | **Unverified** — requires human ear                                                                                   |

### Phase 5-6 — Itch.io Asset Pack + Package

| Deliverable               | Path                                        | Status                                                  |
| ------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| Itch.io zip package       | `dist/foldwink-itch.zip`                    | ~110 KB, ready to upload                                |
| Upload guide              | `docs/ITCH_UPLOAD_GUIDE.md`                 | Complete — settings, pricing, metadata                  |
| Page copy                 | `docs/ITCH_PAGE_COPY.md`                    | Complete — 200 puzzles, honest, accurate                |
| QA checklist              | `docs/ITCH_QA_CHECKLIST.md`                 | Complete — desktop, mobile, sound, share, itch-specific |
| Screenshot capture script | `scripts/capture-screenshots.mjs`           | 8 store screenshots generated                           |
| Store screenshots         | `docs/reports/artifacts/store-screenshots/` | 5 desktop + 3 mobile screenshots                        |

### Phase 7-8 — Readiness + PWYW Gate

See Final Verdict Table below.

### Phase 9 — Docs Update

| Document                    | Update                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/TODO.md`              | Full rewrite — reflects 0.6.1, 200 puzzles, current blockers                                                                                           |
| `docs/KNOWN_LIMITATIONS.md` | Updated: content counts (200 not 98), build/tooling (ESLint/CI exist), persistence (mid-game save works), Hard status (20 real puzzles not scaffolded) |
| `package.json`              | Version bumped to 0.6.1                                                                                                                                |

---

## 2. What Was NOT Done (Honestly)

| Item                             | Reason                                            |
| -------------------------------- | ------------------------------------------------- |
| Human browser QA pass            | Requires a real person on a real device           |
| Sound ear verification           | Requires human listening in speakers + headphones |
| Share card visual verification   | Requires human eye judgment                       |
| Raster OG image (PNG)            | Human art task                                    |
| Designed wordmark/logotype       | Human art task                                    |
| Colour-blind accessibility audit | Requires specialized testing                      |
| Screen-reader QA                 | Requires assistive technology testing             |
| Actual itch.io draft upload      | Requires itch.io account access                   |
| Content expansion beyond 200     | Out of scope for this pass                        |
| Payment/monetization             | Intentionally deferred                            |

---

## 3. Bugs Found and Fixed

| Bug                                   | Severity | Root Cause                                                                     | Fix                                                                                      |
| ------------------------------------- | -------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Wink indicator shown on Hard mode     | HIGH     | `FoldwinkTabs` didn't check `puzzle.difficulty` when computing `winkAvailable` | Added `puzzle.difficulty === "medium"` guard; hid entire wink chip on non-medium puzzles |
| Onboarding button off-screen at 320px | HIGH     | Modal inner container had no overflow or max-height constraints                | Added `max-h-[calc(100vh-2rem)] overflow-y-auto`                                         |

---

## 4. Automated Gate Results

| Gate                  | Result                                                   |
| --------------------- | -------------------------------------------------------- |
| `npm run typecheck`   | PASS                                                     |
| `npm test`            | 108/108 PASS                                             |
| `npm run lint`        | PASS (0 errors)                                          |
| `npm run validate`    | PASS (200 puzzles, 589 warnings — label collisions only) |
| `npm run build`       | PASS (321 kB JS / 103 kB gzip)                           |
| Browser QA automation | PASS (0 critical/high, 0 console errors, 25 screenshots) |

---

## 5. Asset / Page Pack Summary

### Screenshots (8)

| File                      | Content                            |
| ------------------------- | ---------------------------------- |
| `desktop-menu.png`        | Menu with seeded progression state |
| `desktop-easy-game.png`   | Easy puzzle gameplay               |
| `desktop-medium-game.png` | Medium puzzle with Foldwink Tabs   |
| `desktop-hard-game.png`   | Master Challenge gameplay          |
| `desktop-stats.png`       | Stats screen with depth metrics    |
| `mobile-menu.png`         | Mobile menu at 375px               |
| `mobile-easy-game.png`    | Mobile easy gameplay               |
| `mobile-medium-game.png`  | Mobile medium with Tabs            |

Location: `docs/reports/artifacts/store-screenshots/`

### Cover image

Not yet produced. Recommended: crop `desktop-menu.png` or generate from `scripts/preview-share-cards.html`. A designed 630×500 cover is a human art task.

### Favicon / Icons

- `public/favicon.svg` — SVG favicon (the 2×2 colored tiles motif)
- No raster icon PNGs yet — can be generated from the SVG

### OG / Social Preview

- `public/og.svg` — SVG OG image (1200×630 conceptual)
- No raster PNG/JPG yet — human art task, many social scrapers prefer raster

### Page Copy

Complete in `docs/ITCH_PAGE_COPY.md`:

- Title, tagline, short description, long description
- How to play, what's included, current status
- Credits, privacy, version text, tags

---

## 6. Final Verdict Table

| Level                       | Verdict         | Remaining Blockers                                                                                                             |
| --------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Friend test**             | **READY**       | None — app loads, plays, persists, shares. All 3 tiers tested by automation.                                                   |
| **Restricted itch.io test** | **READY**       | Upload the zip, verify in-iframe behavior, share itch.io link with testers.                                                    |
| **Public free**             | **CONDITIONAL** | Needs: (1) human browser QA pass, (2) human sound ear pass, (3) human share card visual pass. All 3 are quick — ~30 min total. |
| **PWYW**                    | **NOT READY**   | Needs everything for public free PLUS: raster OG image, designed cover, 300+ puzzles recommended, sound quality confirmed.     |
| **Fixed price**             | **NOT READY**   | Needs everything for PWYW PLUS: 500+ puzzles, sustained player retention evidence, mobile-native QA, professional store page.  |

---

## 7. PWYW Minimum Gate Checklist

Before enabling "Name your own price" on itch.io:

- [ ] Human browser QA complete (desktop + mobile)
- [ ] Human mobile QA complete (real phone, not emulated)
- [ ] Store screenshots ready (captured — need human review)
- [ ] Cover image ready (not yet produced)
- [ ] Share card visually checked by human
- [ ] Sound pass completed by human
- [ ] Page copy reviewed by human
- [ ] 300+ curated puzzles recommended (currently 200)
- [ ] Itch.io in-iframe verification complete

---

## 8. Changed Files

### Code

| File                              | Change                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `src/components/Onboarding.tsx`   | Added `max-h-[calc(100vh-2rem)] overflow-y-auto` to modal                         |
| `src/components/FoldwinkTabs.tsx` | Fixed wink indicator on Hard: added difficulty check, hid wink chip on non-medium |
| `src/components/Header.tsx`       | Added `min-w-0` + `truncate` safety on title                                      |
| `src/screens/MenuScreen.tsx`      | Button container `w-60` → `w-full max-w-60`                                       |
| `eslint.config.js`                | Extended scripts config to cover `.mjs`/`.js`, added `localStorage` global        |
| `package.json`                    | Version 0.6.0 → 0.6.1                                                             |

### Scripts

| File                              | Change                                                                      |
| --------------------------------- | --------------------------------------------------------------------------- |
| `scripts/human-like-qa.mjs`       | Added Medium/Hard/MobileMedium QA flows with seeded state; fixed unused var |
| `scripts/capture-screenshots.mjs` | **New** — store screenshot capture with seeded state                        |

### Docs

| File                                                | Change                                                          |
| --------------------------------------------------- | --------------------------------------------------------------- |
| `docs/TODO.md`                                      | Full rewrite for 0.6.1                                          |
| `docs/KNOWN_LIMITATIONS.md`                         | Updated content counts, build/tooling, persistence, Hard status |
| `docs/ITCH_UPLOAD_GUIDE.md`                         | **New** — complete itch.io upload instructions                  |
| `docs/reports/FOLDWINK_RELEASE_HARDENING_REPORT.md` | **New** — this report                                           |

### Artifacts

| Path                                        | Content                          |
| ------------------------------------------- | -------------------------------- |
| `docs/reports/artifacts/human-qa/`          | 25 QA screenshots + qa-data.json |
| `docs/reports/artifacts/store-screenshots/` | 8 store-ready screenshots        |
| `dist/foldwink-itch.zip`                    | ~110 KB ready-to-upload package  |

---

## 9. Handoff

### Done

- All code-doable UX blockers fixed
- Browser QA covers Easy/Medium/Hard on desktop + mobile
- Real bug found and fixed (Wink on Hard)
- Itch.io package ready to upload
- Store page copy ready
- Store screenshots captured
- All automated gates green
- Docs updated to reflect reality

### Not Done

- Human QA (browser, sound, share card, mobile)
- Raster assets (OG image, cover, icon PNGs)
- Itch.io draft upload
- Content expansion
- Monetization

### Next Recommended Action

Open `scripts/preview-sounds.html` and `scripts/preview-share-cards.html` in a real browser. Listen to the sounds, look at the cards. If they pass, run through `docs/ITCH_QA_CHECKLIST.md` on a phone and desktop. That's ~30 minutes of human work between current state and public free launch.

### Rerun Commands

```bash
npm run typecheck       # TypeScript check
npm test                # 108 unit tests
npm run lint            # ESLint
npm run validate        # Puzzle validator
npm run build           # Production build
node scripts/human-like-qa.mjs  # Browser QA (needs preview server)
node scripts/capture-screenshots.mjs  # Store screenshots (needs preview server)
```

### Key Paths

| What               | Path                                                |
| ------------------ | --------------------------------------------------- |
| Main report        | `docs/reports/FOLDWINK_RELEASE_HARDENING_REPORT.md` |
| QA screenshots     | `docs/reports/artifacts/human-qa/`                  |
| Store screenshots  | `docs/reports/artifacts/store-screenshots/`         |
| Itch.io package    | `dist/foldwink-itch.zip`                            |
| Upload guide       | `docs/ITCH_UPLOAD_GUIDE.md`                         |
| Page copy          | `docs/ITCH_PAGE_COPY.md`                            |
| QA checklist       | `docs/ITCH_QA_CHECKLIST.md`                         |
| Sound preview      | `scripts/preview-sounds.html`                       |
| Share card preview | `scripts/preview-share-cards.html`                  |
