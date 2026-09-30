# Foldwink Sprint R8 - Editorial Remediation and Mobile Tabs QA

Date: 2026-07-23

## Sprint Summary

- Applied the second worst-first editorial review across EN/RU/DE pools.
- Retired 12 further boards whose categories were structurally ambiguous, fact-sensitive, specialist-only, or unsuitable for their stated tier.
- Added an automated mobile regression for a 47-character revealed Foldwink Tab.
- Fixed the Wink letter animation so text wraps at word boundaries without losing its tactile stagger effect.

## Changed Files

- `puzzles/_retired/r1-editorial/r3-editorial-r2/` - 12 retired records with editorial rationale.
- `docs/reports/FOLDWINK_CONTENT_EDITORIAL_REVIEW_R2.md` - applied decision record.
- `src/components/FoldwinkTabs.tsx`, `src/styles/index.css` - word-boundary wrapping for animated Wink labels.
- `tests/e2e/foldwink-tabs-layout.mjs`, `tests/e2e/run-all.mjs` - 320px and 390px expanded-label coverage.
- `docs/TODO.md` - content-pipeline state and current active-library counts.

## Tests Run

- `npm run validate` - passed, EN 490.
- `npm run validate:ru` - passed, RU 496.
- `npm run validate:de` - passed, DE 496.
- `npm run audit:logic` - passed; one previously reviewed non-defect signal remains.
- `npm run build` - passed; sound assets verified.
- `npm run test:e2e` - 47 browser scenarios passed, including 2 new long-tab checks at 320px and 390px.

## Manual QA Notes

- The 47-character label `Flags: Horizontal Red, White and Blue Tricolour` now wraps without horizontal or vertical clipping inside a 56px tab at both tested mobile widths.
- Physical iPhone Safari verification remains required before public release, especially with browser chrome and the installed PWA shell.

## Open Risks

- Editorial warnings remain intentionally non-fatal review queues. The next pass should sample the remaining specialist and long-card warnings rather than bulk-remove by heuristic.
- English is the 1.0 product language; RU/DE content remains technically supported but needs ongoing native-language editorial review before public promotion.
- This sprint reduces active pool count rather than replacing content. Future replacement boards must pass validator plus editorial review before entry.

## Go / No-Go

**GO** for release-readiness work. The long-tab mobile bug is now regression-tested, and the current pool has no known unresolved structural failures from the R1/R2 queues.
