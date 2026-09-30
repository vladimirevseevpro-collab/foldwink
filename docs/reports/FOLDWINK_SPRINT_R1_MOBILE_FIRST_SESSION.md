# Foldwink Sprint R1 - Mobile-First First Session

**Date:** 2026-07-22  
**Status:** Complete  
**Decision:** The canonical product is the direct standalone web build. itch.io is optional discovery, not the primary play surface.

## Sprint Summary

R1 fixes the commercial blocker observed on iPhone: Foldwink no longer relies on a host-page setting to make the game readable. The direct game uses nearly the full phone width, the 4x4 board has stable physical dimensions, controls remain reachable at 320 px, and a constrained touch iframe offers an explicit direct full-size launch.

The static rules wall was replaced by a three-step playable tutorial. A new player selects four demo cards, submits the group, sees a correct lock, and tries the one-per-puzzle Wink. This tutorial is isolated from daily selection, stats, progress, and active-session persistence. Repeat help opens as a dialog and no longer resets the first-run flag.

itch.io's documentation says mobile HTML5 projects should launch fullscreen, but the observed production behavior proved that Foldwink cannot make its paid funnel depend on the host wrapper. The in-game escape hatch opens the exact iframe build in a separate tab, while the direct site remains unaffected: <https://itch.io/docs/creators/html5>.

## Changed Files

- `src/app/App.tsx` - screen-specific shell, first-run page, separate repeat-help dialog, embedded-mobile launch.
- `src/components/Onboarding.tsx` - interactive accessible tutorial with EN/DE/RU content.
- `src/components/EmbeddedMobileLaunch.tsx` - touch-iframe full-size escape.
- `src/components/Grid.tsx`, `Card.tsx`, `FoldwinkTabs.tsx`, `Button.tsx`, `Header.tsx` - larger board, stable tap targets, responsive text and controls.
- `src/screens/GameScreen.tsx`, `MenuScreen.tsx` - stable control row and separate help action.
- `src/game/state/store.ts` - first-run completion separated from repeat help.
- `src/utils/platform.ts` - embed, coarse-pointer, and full-size-offer detection.
- `src/i18n/strings.ts` - complete tutorial and embed copy in EN/DE/RU.
- `tests/e2e/gameplay-smoke.mjs`, `responsive-smoke.mjs`, `lib/harness.mjs` - tutorial, 320/390/430/1280, tap-size, board-size, and iframe regression coverage.
- `src/utils/__tests__/platform.test.ts` and store observer tests - pure-condition and state-separation coverage.

## Tests Run

- `npm run typecheck` - pass.
- `npm test` - 146/146 pass across 17 files.
- `npm run lint` - pass.
- `npm run validate` - pass; 500 puzzles, easy=272, medium=194, hard=34, diversity=0.968.
- `npm run build` - pass; main JS 410.77 kB / 94.36 kB gzip.
- `npm run test:e2e` - pass, including mobile iframe full-size escape.

## Manual QA Notes

- 390x844: board width 366 px; cards 85.5x68 px; ordinary card text 13 px; Submit height 49.3 px; no horizontal overflow.
- 320x568: cards remain 60 px tall; title wraps instead of truncating; timer and all four mistake indicators remain visible; Submit and Quit are reachable with vertical scroll only.
- The three tutorial states were visually inspected in the in-app browser. Selection, correct-group feedback, Wink reveal, focus rings, and button states render coherently.
- Full-page screenshot capture in the browser plugin distorted DPR output; viewport screenshots and DOM bounding boxes were used for visual and geometric verification.
- Real iPhone Safari and a real itch project page remain hardware/channel QA, not code-verifiable claims.

## Open Risks

- Some curated items exceed 22 characters. R1 uses content-aware text sizing and wrapping, but the longest outliers still need a dedicated visual fixture sweep.
- The validator reports 1,349 existing editorial warnings. It exits successfully; these warnings predate R1 and are not structural failures.
- Opening the iframe URL in a new tab depends on the host allowing user-initiated new tabs. The secondary "continue here" path remains available.
- The product still needs a stronger visual identity, raster social assets, and production-quality recorded sound before paid acquisition.

## Go / No-Go for Next Sprint

**GO for Sprint R2.** The mobile play surface and first-session comprehension are no longer blockers. Keep direct hosting as the canonical sales URL and retain itch.io only if it contributes measurable discovery.
