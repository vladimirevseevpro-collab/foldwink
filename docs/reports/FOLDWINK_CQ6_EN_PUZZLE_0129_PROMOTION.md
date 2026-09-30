# Foldwink CQ6 EN Puzzle-0129 Promotion

## Sprint Summary

Retired the unsuitable English medium puzzle "Root cause" and promoted a
one-for-one replacement, "Ready for the Day", as an honest easy puzzle.

The original board mixed plant morphology, mathematics, linguistics, and dental
anatomy under the word "root". It required specialist knowledge and used
categories with inconsistent ontology. The replacement uses four ordinary,
exact classifications and does not pretend to be a medium puzzle.

## Editorial Evidence

- Draft-to-active validation found no exact or 3-of-4 group overlap.
- Independent English editorial review returned KEEP for the final easy board.
- The reviewer found no credible alternative quartet and confirmed mobile-friendly
  wording.
- Earlier medium attempts were rejected rather than promoted:
  travel groups were too easy and semantically uneven; practical-tool groups
  repeated active content; the personal-routine medium version was honest easy.

## Changed Files

- puzzles/pool/puzzle-0129.json
- puzzles/_retired/cq6-quality/puzzle-0129.json
- scripts/validate-puzzles.ts
- docs/TODO.md
- docs/KNOWN_LIMITATIONS.md
- docs/reports/FOLDWINK_RELEASE_READINESS_CQ6.md
- docs/reports/FOLDWINK_CQ6_CONTENT_NEAR_DUPLICATE_GUARD.md
- docs/reports/FOLDWINK_CQ6_EN_PUZZLE_0129_PROMOTION.md

## Validation

- English active pool: 500 puzzles, easy=274, medium=192, hard=34.
- The promoted board has no revealHint fields because easy puzzles deliberately
  have no Foldwink Tabs.
- Exact fallback count after promotion: 33 boards total, consisting of 32 English
  boards (128 unresolved group hints) and ru-0465 in Russian (4 group hints).
  German has none.

## Tests Run

- Draft/reference validator: passed with no exact or 3-of-4 overlap.
- Active English validator: passed.
- TypeScript: passed.
- ESLint: passed.
- Vitest: 23 files, 174 tests passed.
- Production build: passed; sound-pack check passed.
- Production browser E2E: 47 checks passed, including iPhone 390x844, Pixel 6, itch embed, PWA offline, and RU localisation.

## Manual QA Notes

- Every new item is short enough for the current mobile card limit.
- The replacement remains a 4x4 board and has no dependency on sound, tabs, or
  any new mechanic.

## Open Risks

- The remaining five English P0 repairs still require one-at-a-time editorial
  work: puzzle-0092, puzzle-0097, puzzle-0164, puzzle-0169, puzzle-0197.
- The remaining Tabs fallback count is a readability backlog, not a reason to
  force weak short hints.

## Go / No-Go

GO for the next English content replacement.
