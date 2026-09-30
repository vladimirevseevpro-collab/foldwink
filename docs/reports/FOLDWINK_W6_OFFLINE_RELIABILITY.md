# Foldwink W6 — Delivery, Offline and Reliability

Date: 2026-09-14  
Scope: FW-028–FW-031, TEST-15/24/33/36–39  
Status: local W6 implementation complete and accepted; public release remains gated by W7 human evidence and W8 deployed/physical-device acceptance.

## Sprint Summary

The W6 entry audit found four release-critical gaps:

- the initial runtime plus eagerly preloaded English content is roughly 376 KiB gzip, above the accepted 250 KiB JS+required-content budget;
- each language currently hydrates its complete 1,000-board pool, while first render is blocked by storage and selected-language loading;
- the static service worker does not precache hashed runtime/content and can automatically reload an active game during activation;
- wall-clock duration, silent storage failure and incomplete namespace clearing do not yet satisfy lifecycle/quota/reset acceptance.

The accepted implementation slice was deliberately narrow: generated stripped and versioned content chunks; strict reference-aware loading; generated build precache and player-controlled updates; foreground-active timing and awaited storage recovery; privacy/monetization/budget regression gates. No backend, account, runtime puzzle generation, Workbox, motion framework, analytics SDK or ad SDK was added.

The production build now ships a 30-board selected-language boot pack plus 31 archive chunks of at most 32 boards for each of EN/RU/DE. The full 1,000-board library per language remains available without being bundled into the initial JS. Exact language, puzzle reference, content version and SHA-256 integrity are checked before content enters the runtime catalogue; failure produces an honest localized retry state and never falls back to English or a random board.

The generated service worker precaches the exact built core and then pins only the selected language manifest and immutable boot pack. A newer worker waits. It cannot activate or reload during a game, and the Menu/Result action first awaits the persistence flush. Foreground-active timing, visibility/pagehide checkpoints, awaited all-store reset, revoked-consent behavior and missing rewarded-ad SDK behavior are covered by regression tests.

## Execution Plan

1. FW-028 — generate immutable selected-language boot packs and 20–50-board archive chunks from the unchanged authoring JSON; validate full puzzle references and provide honest loading/retry/unavailable states.
2. FW-028 — lazy-load defensible rare UI boundaries and load audio cues on demand; measure the production waterfall against OPS-04.
3. FW-029 — generate the service worker from exact build output; precache functional core/boot content and replace automatic activation/reload with a Menu/Result-only player decision.
4. FW-030 — use persisted foreground-active deltas, visibility lifecycle, rollback-safe duration, explicit persistence errors and an awaited Foldwink namespace clear.
5. FW-031 — add build/dependency/privacy/monetization regression gates, then run unit, validation, production E2E, cold-offline/update and three-viewport visual acceptance.

## Changed Files

- Runtime delivery: `scripts/build-runtime-content.mjs`, `src/puzzles/runtimeContent.ts`, `src/puzzles/byLang.ts`, `src/puzzles/catalog/registry.ts`, generated `public/runtime-content/v1/` and their tests.
- Loading boundaries: `src/app/App.tsx`, `src/screens/MenuScreen.tsx`, `src/components/ShareButton.tsx`, `src/audio/sound.ts` and audio/runtime tests.
- PWA lifecycle: `scripts/generate-service-worker.ts`, `vite.config.ts`, `src/pwa/registerServiceWorker.ts`, `src/pwa/updateLifecycle.ts`, `src/components/PwaUpdateNotice.tsx`, PWA unit/E2E/visual fixtures; the old hand-maintained `public/sw.js` is removed.
- Lifecycle and persistence: `src/game/timing/foreground.ts`, `src/game/state/lifecycle.ts`, `src/game/state/appStore.ts`, `src/components/GameTimer.tsx`, `src/components/DailyCountdown.tsx`, `src/utils/storageAdapter.ts`, `src/stats/persistence.ts`, `src/components/AboutFooter.tsx` and focused tests.
- Privacy/monetization/compliance: `src/analytics/eventLog.ts`, `src/monetization/__tests__/ads.test.ts`, `scripts/build-third-party-notices.mjs`, generated `public/third-party-notices.txt`, `scripts/check-build-budget.mjs` and `package.json`.
- Evidence: `tests/e2e/pwa-offline-qa.mjs`, `tests/visual/w6-pwa-update-qa.mjs`, `tests/visual/w6-reliability-states-qa.mjs`, `reports/w6-offline-reliability-2026-09-14/visual/` and this report.

## Tests Run

Entry evidence:

- `npm test` — 49 files, 339 tests, pass before W6 implementation.
- `npm run lint` — pass before W6 implementation.
- `npm run typecheck` — pass before W6 implementation.
- `npm run validate` — 1,000 EN puzzles validated; 1,903 non-blocking advisory signals.
- `npm run build` — pass, but initial `index` was 188.08 KiB gzip and eagerly preloaded EN was 188.34 KiB gzip; the accepted budget failed before W6.
- `npm audit --omit=dev --json` — zero production vulnerabilities.

Final integrated evidence after all W6 changes:

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm test` — 54 files, 355 tests, pass.
- `npm run validate`, `npm run validate:ru`, `npm run validate:de` — 1,000 puzzles per language, pass; 1,903 EN / 2,025 RU / 1,554 DE advisory signals remain in the editorial queue.
- `npm run build` — pass; 99 runtime-content files generated, 12 production dependency notices generated, 9 audio cues verified and the service worker generated from 22 exact build assets.
- `npm run content:check` and `npm run notices:check` — pass; checked-in/generated artifacts are reproducible.
- `npm run build:budget` — pass: initial JS + EN runtime manifest + EN boot pack = 146,488 bytes gzip of 256,000; CSS = 19,217 of 25,600; initial decorative raster/font budget charged by the gate = 0 of 184,320.
- `npm audit --omit=dev --json` — zero production vulnerabilities.
- `npm run test:e2e` — 72/72 production-browser scenarios pass, including TEST-36 cold-offline reopen, TEST-37 waiting-worker active-game safety, language switching and all earlier W1–W5 regressions.
- Focused TEST-15/24/38 fixtures cover clock rollback, foreground accumulation, visibility/focus/pagehide checkpoints, simulated terminal IndexedDB abort without partial result/reward, and reset failure without reload.
- Focused TEST-33/39 fixtures cover denied/revoked/offline analytics without forbidden dispatch/replay and inert rewarded ads with empty config or missing SDK.
- `node tests/visual/w6-pwa-update-qa.mjs` plus `node tests/visual/w6-reliability-states-qa.mjs` — pass; 15 current screenshots across 1440×900, 1024×768 and 390×844.

## Manual QA Notes

The current screenshots were manually inspected. The update notice, content-unavailable retry card, reset confirmation, reset-busy and reset-failed states have no horizontal overflow, clipping, overlap or unreachable actions at 1440×900, 1024×768 and 390×844. Copy wraps cleanly, hierarchy remains coherent and the failed reset explicitly says that no reload occurred.

Local browser automation cannot substitute for installed-PWA checks on physical iOS and Android devices; those remain explicit W8 release evidence.

## Open Risks

- Exact Daily/pinned integrity requires immutable content-versioned assets to survive deploy and rollback horizons.
- The selected boot pack covers the published 30-day window. This is bounded and within the accepted 20–50 board chunk size, but a later seven-day boot optimisation can reduce it further if real waterfall evidence justifies the complexity.
- Two-build service-worker behavior must still be exercised at the actual deployment base path and on installed iOS/Android PWAs, not inferred from localhost alone.
- W7 human comprehension/balance/return-rate evidence and W8 exact-staging evidence remain open regardless of W6 automation.

## Go / No-Go for Next Sprint

**GO for W7.** The local W6 acceptance gate passes. **NO-GO for public release** remains until W7 supplies real human balance/retention evidence and W8 verifies the exact deployed commit, base path, rollback and physical installed-PWA behavior.
