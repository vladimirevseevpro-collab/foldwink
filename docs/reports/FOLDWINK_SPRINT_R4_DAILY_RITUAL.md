# Foldwink Sprint R4 - Daily Ritual

## Sprint Summary

Sprint R4 is closed on 2026-07-22. The shipped retention layer stays fully local-only and keeps the product's anti-pressure line intact: a pure daily ritual with replay-safe accounting, a compact 7-day Daily Fold surfaced in Menu and Stats, the restored full archive, and one daily-only personal moment on the result flow.

The sprint also completed the language pass for EN/DE/RU, kept the archive and daily history readable on narrow mobile widths, and added new end-to-end coverage around the daily ritual surfaces without changing production scope beyond the documented retention slice.

## Changed Files

- `src/components/DailyArchive.tsx`
- `src/components/DailyFold.tsx`
- `src/components/DailyCompleteCard.tsx`
- `src/screens/MenuScreen.tsx`
- `src/screens/StatsScreen.tsx`
- `src/screens/ResultScreen.tsx`
- `src/stats/dailyRitual.ts`
- `src/stats/__tests__/dailyRitual.test.ts`
- `src/game/state/store.ts`
- `src/game/state/__tests__/store.test.ts`
- `src/game/state/persistence/__tests__/observers.test.ts`
- `src/i18n/strings.ts`
- `tests/e2e/r4-retention-qa.mjs`
- `tests/e2e/run-all.mjs`
- `docs/TODO.md`
- `docs/reports/FOLDWINK_SPRINT_R4_DAILY_RITUAL.md`

## Tests Run

- `npm run typecheck` -> PASS
- `npm run lint` -> PASS
- `npm test` -> PASS, 160/160 tests across 20 files
- `npm run audio:check` -> PASS, 9 cues, 278796 bytes
- `npm run validate` -> PASS, 500 puzzles validated, 1349 known warnings, diversity 0.968
- `npm run build` -> PASS
- `npm run test:e2e` -> PASS, 40/40 scenarios
- `npm audit --omit=dev` -> PASS, 0 vulnerabilities

Build output:

- Main app bundle: 421.47 kB / 97.83 kB gzip
- Main CSS bundle: 36.18 kB / 10.01 kB gzip

## Manual QA Notes

Visual QA was completed at:

- `320x700`
- `390x844`
- `430x932`
- `1280x800`

Verified R4 surfaces:

- 7-day Daily Fold reads cleanly in Menu and Stats
- full archive remains accessible after the recent-week promotion
- daily-only personal moment appears only on the daily result path
- replaying the same daily remains stats-safe
- EN/DE/RU strings fit the mobile layout without breaking the ritual cards

Reference screenshots in `docs/reports/assets`:

- `foldwink-r4-menu-390.png`
- `foldwink-r4-result-390.png`
- `foldwink-r4-stats-390.png`

## Open Risks

- Real iPhone and Android safe areas plus browser chrome still need a physical-device pass.
- Native share sheets still need a human check on actual mobile hardware.
- The audio pack is gate-clean, but a physical ear pass on speakers/headphones remains outstanding.

## Go / No-Go for next sprint

Go for Sprint R5 honest monetization and measurable funnel.

Reasoning:

- the daily ritual is now coherent, local-only, and replay-safe
- Menu, Stats, archive, and result surfaces hold together across the tested widths
- unit, validate, build, E2E, and audit gates are green
- remaining risk is human device/audio verification, not a blocker for platform/monetization planning

