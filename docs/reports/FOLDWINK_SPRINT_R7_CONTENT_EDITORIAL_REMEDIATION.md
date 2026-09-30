# Foldwink Sprint R7 - Content Editorial Remediation

Date: 2026-07-23

## Sprint Summary

- Converted the one-off language/logic review into a repeatable audit plus EN/RU/DE structural validation.
- Retired 11 unsound puzzles instead of preserving them with artificial fourth cards or ambiguous labels.
- Repaired four selected puzzles where the category could be made natural and fair.
- Fixed Foldwink Tabs so solved or winked labels use a fixed multi-line area rather than being silently truncated on narrow screens.

## Changed Files

- `puzzles/_retired/r1-editorial/` - nine R1 editorial retirements with rationale.
- `puzzles/_retired/r1-editorial/r2-validator-discoveries/` - two duplicate-card retirements surfaced by multilingual validation.
- `puzzles/pool/puzzle-0030.json` - reclassified as easy and removed medium-only hints.
- `puzzles/ru/pool/ru-0028.json`, `ru-0168.json`, `ru-0449.json` - approved category repairs.
- `scripts/audit-puzzle-logic.mjs`, `scripts/validate-puzzles.ts`, `package.json` - repeatable audit and locale validator scripts.
- `src/components/FoldwinkTabs.tsx` - fixed-height multi-line tab labels.
- `docs/reports/FOLDWINK_CONTENT_EDITORIAL_REVIEW_R1.md`, `docs/reports/FOLDWINK_CONTENT_LOGIC_AUDIT.md`, `docs/TODO.md` - decisions and queue state.

## Tests Run

- `npm run audit:logic` - passed; one reviewed non-defect signal remains for `ru-0205`.
- `npm run validate` - passed, EN 495.
- `npm run validate:ru` - passed, RU 500.
- `npm run validate:de` - passed, DE 499.
- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm test` - 23 files, 174 tests passed.
- `npm run build` - passed; sound-pack integrity check passed.
- `npm run test:e2e` - 45 browser scenarios passed, including mobile, embedded, PWA offline and RU loading.

## Manual QA Notes

- The tab surface now has a stable 56px height and chooses compact text classes by revealed-label length; this eliminates the previous single-line truncation path.
- Automated mobile scenarios confirm controls remain reachable at 320px, 390px and 430px widths. A physical iPhone homescreen/browser pass remains a human-only release gate.

## Open Risks

- Validator warnings remain a review queue, especially long card text and repeated labels; warnings are not waived as errors.
- The audit is heuristic. New content still requires a human-language and factual pass before promotion.
- No replacement content was generated for the 11 retired records; active pools remain sufficient for the current product scope.

## Go / No-Go

**GO** for the next release-readiness increment. Content structural checks now cover all shipped languages; the remaining blocker is human device QA, not an unresolved code or data failure.
