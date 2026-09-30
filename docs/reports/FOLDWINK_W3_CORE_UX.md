# Foldwink W3 — Core UX Slice and Design System

Date: 2026-09-14  
Status: **COMPLETE / GO for W4**

## Sprint Summary

W3 turns the previously crowded mode menu into one coherent, explicit path from Home through Game to Win/Loss and the next voluntary action:

- Home now leads with a single Today hero, followed by the seven-day Daily Fold, a collapsed Practice difficulty picker, and a quiet secondary layer for statistics, Passport and advanced modes;
- an unfinished attempt remains pinned and is surfaced as an explicit Continue card instead of silently reopening or being replaced;
- first-run onboarding now teaches only the two load-bearing actions — select four, then Submit — and hands the player to the curated starter path without mutating statistics or Daily history;
- responsive host presentation distinguishes an ordinary web/standalone phone from compact extension/embed hosts instead of applying desktop-extension compression solely from viewport width;
- shared typography utilities establish kicker, screen-title and body-copy hierarchy without adding another font or runtime dependency;
- the Game path preserves a full 4×4 board, long-word wrapping, Medium-only Tabs/Wink and spatial keyboard movement; Enter on a focused native control no longer leaks into the global Submit shortcut;
- Result places Next puzzle first for Practice wins and losses, then Retry on loss, with statistics/menu/share remaining voluntary; reward receipt is inline and no ceremony blocks continuation;
- `DialogShell` centralizes dialog role/labels, Escape, focus trap, focus return, backdrop close and body scroll locking; Privacy and Mastery dialogs now use it;
- production regression exposed and fixed a service-worker lifecycle race: a cold async bootstrap can finish after `load`, so production registration now runs immediately when the document is already complete. The offline test has a bounded readiness timeout.

No new package or animation framework was added.

## Changed Files

Primary W3 implementation:

- `src/app/App.tsx`
- `src/screens/MenuScreen.tsx`
- `src/screens/GameScreen.tsx`
- `src/screens/ResultScreen.tsx`
- `src/components/Onboarding.tsx`
- `src/components/DialogShell.tsx`
- `src/components/IronContractModal.tsx`
- `src/components/PrivacyControl.tsx`
- `src/components/Header.tsx`
- `src/components/ResultSummary.tsx`
- `src/game/state/store.ts`
- `src/game/state/appStore.ts`
- `src/i18n/strings.ts`
- `src/styles/index.css`
- `src/utils/platform.ts`
- `src/pwa/registerServiceWorker.ts`

Verification and regression coverage:

- `src/game/state/__tests__/store.test.ts`
- `src/utils/__tests__/platform.test.ts`
- `tests/e2e/lib/harness.mjs`
- `tests/e2e/progression-validator.mjs`
- `tests/e2e/gameplay-smoke.mjs`
- `tests/e2e/responsive-smoke.mjs`
- `tests/e2e/foldwink-tabs-layout.mjs`
- `tests/e2e/itch-embed-smoke.mjs`
- `tests/e2e/results-next-flow.mjs`
- `tests/e2e/r4-retention-qa.mjs`
- `tests/e2e/localization-qa.mjs`
- `tests/e2e/pwa-offline-qa.mjs`
- `tests/visual/w3-core-ux-qa.mjs`
- `reports/w3-core-ux-2026-09-14/`

## Tests Run

Final W3 gate on the production build:

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm test` — **323/323 pass**, 47 files.
- `npm run validate` — pass, EN 1,000 puzzles; 1,903 existing advisory editorial items, no structural failure.
- `npm run validate:ru` — pass, RU 1,000 puzzles; 2,025 advisory items.
- `npm run validate:de` — pass, DE 1,000 puzzles; 1,554 advisory items.
- `npm run build` — pass; all 9 sound cues verified, production assets emitted. Vite still reports the documented large-chunk warning for W6.
- `npm run test:e2e` — **60/60 pass** across progression, gameplay, responsive, Tabs/layout, itch embed, repeated Next flow, Daily retention, privacy-aware monetization, PWA offline and localization suites.
- `node tests/visual/w3-core-ux-qa.mjs` against the production preview — **26/26 scenario records pass**, producing 43 screenshots.

Focused acceptance proves:

- an unfinished attempt opens only through Continue and keeps its exact pinned puzzle;
- two-step onboarding does not create gameplay statistics or Daily records;
- keyboard focus skips disabled solved cards and returns after closing Help;
- Enter on Clear clears only; rapid Submit does not double-transition;
- all nine local WAV cues load successfully;
- long 32-character revealed Tabs remain unclipped at 320 and 390 px;
- Hard renders no Tabs by contract, while promoted Medium fixtures retain Tabs and a full-width board;
- Practice Next remains reachable for three consecutive rounds on desktop, iPhone and Pixel fixtures;
- production service worker controls a warm reload and reopens the app offline.

## Manual QA Notes

The complete rendered matrix covers Home, initial Game, Win and Loss for EN, RU and DE at 1440×900, 1024×768 and 390×844. It also includes all three localized onboarding screens at 390×844, Continue at all three required viewports, shared-dialog keyboard behavior and a German 200% reflow equivalent. Evidence and geometry results are in `reports/w3-core-ux-2026-09-14/w3-core-ux-evidence.json` and its `screenshots/` directory.

Rendered screenshots were inspected for horizontal overflow, clipping, overlap, whitespace, line wrapping, visual hierarchy and CTA order. The current Home hierarchy reads clearly on phone and desktop; long German and Russian strings remain inside their surfaces; Game keeps all 16 cards legible; Win/Loss expose Next before share; 200% reflow scrolls vertically without horizontal overflow.

The inspection also found a transient confetti frame overlapping the Win heading. The result remains readable and Next remains immediately available, but this visual timing issue is explicitly carried into FW-019 rather than hidden by the green geometry checks.

## Open Risks

- Motion still contains overlapping historical FLIP, pointer/gyro and confetti paths. Confetti can visually cross the result heading in a captured frame. W4 must consolidate lifecycle, reduced-motion and interruption behavior.
- The production app and localized puzzle chunks remain larger than the target budgets. W6 must measure cold/warm paths and reduce payload/cache cost rather than suppressing the warning.
- The W3 matrix proves the core Home/Game/Result slice. Full share/import error-dialog and legacy-theme matrices remain their owning W5/W8 gates; they are not claimed complete here.
- Automated Chromium keyboard checks and manual screenshot inspection do not replace screen-reader and real-device evidence. iOS Safari, Android Chrome, native share/audio unlock/safe areas and available desktop reader checks remain required before public-release approval.
- Human difficulty and retention calibration remains W7. Passing structural and UI tests does not prove that the puzzle curve is commercially engaging.

## Go / No-Go for next sprint

**GO for W4 tactile audiovisual materials.** FW-014 through FW-018 and the W3 core-slice gate are complete with current production-build evidence.

This is not a public-release GO. W4–W8, human balance evidence and real-device/staging acceptance remain mandatory.
