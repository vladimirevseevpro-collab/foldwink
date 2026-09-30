# Foldwink W6 — FW-029 PWA Update Safety

Date: 2026-09-14  
Status: locally implemented and verified; not a public-release approval.

## Sprint Summary

FW-029 replaces the hand-written shell worker with a worker generated after Vite has emitted the exact hashed `dist/` files. It precaches the functional shell (HTML, hashed JS/CSS/fonts and install icons). Once a worker is active, the client reads only the current language's runtime manifest and asks that worker to cache its matching immutable boot pack. Archive chunks remain demand-cached.

A new worker waits by default. There is no automatic `skipWaiting`, `clients.claim`, cache purge, `controllerchange` reload, or game-time update UI. Menu and Result show a deferred, lazy update notice. `Update now` first awaits `flushGamePersistence()`; a failed durable write keeps the update waiting and shows a localised error. `Later` only dismisses the prompt for the current page session.

Old versioned caches are intentionally retained for old controlled tabs. A worker checks its own cache first; it can fall back to retained caches only for immutable hashed assets/versioned boot or archive data. Stable HTML and manifest paths are never served from an older cache.

## Changed Files

- `scripts/generate-service-worker.ts`, `vite.config.ts`, `public/sw.js` — generated exact-output worker replaces the static worker.
- `src/pwa/registerServiceWorker.ts`, `src/pwa/updateLifecycle.ts` — selected-language boot caching and explicit update lifecycle.
- `src/components/PwaUpdateNotice.tsx`, `src/app/App.tsx`, `src/game/state/appStore.ts` — lazy Menu/Result notice and durable persistence gate; `StatsScreen` is also lazy.
- `src/pwa/__tests__/updateLifecycle.test.ts`, `tests/e2e/pwa-offline-qa.mjs`, `tests/visual/w6-pwa-update-qa.mjs` — TEST-36/37 and rendered fixtures.
- `reports/w6-offline-reliability-2026-09-14/visual/` — inspected desktop, tablet and mobile screenshots.

## Tests Run

- `npx vitest run src/pwa/__tests__/updateLifecycle.test.ts` — pass, 2 tests.
- `npm run build` — pass (runtime content, notices, audio gate, typecheck and Vite); generated worker reports 22 exact core assets and passes `node --check dist/sw.js`.
- `node tests/e2e/pwa-offline-qa.mjs` against local `vite preview` — pass, 3 scenarios: TEST-36 cold online install → offline reopen, TEST-37 real newer waiting worker while a game stays open, and install CTA regression.
- `node tests/visual/w6-pwa-update-qa.mjs` — pass; no horizontal overflow at 1440×900, 1024×768 and 390×844.
- `npm run typecheck` — pass.

## Manual QA Notes

Inspected the rendered update notice at all three required viewports. The notice is above Menu content, all actions remain visible at 390px, and no clipping/overlap or horizontal overflow was found. The screenshot fixture uses a real second service-worker file with a distinct cache name, not a mocked update state.

## Open Risks

- The selected boot pack currently contains the published 30-day release window, so it exceeds the later 7-day optimisation target; it is bounded and language-specific, but the narrower horizon remains a content-pipeline follow-up.
- Physical installed-PWA close/reopen and two-build behavior at the deployed `/foldwink/` base path remain external release evidence.
- Cache retirement is intentionally deferred until a policy can prove no old controlled client needs its immutable files.

## Go / No-Go for Next Sprint

**Go** for the remaining W6 implementation work. **No-Go** for public PWA release remains until FW-030/FW-031 and physical/deployed-base-path evidence are complete.
