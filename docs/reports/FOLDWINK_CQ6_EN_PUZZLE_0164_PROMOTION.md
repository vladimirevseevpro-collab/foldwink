# Foldwink CQ6 EN Puzzle-0164 Promotion

## Sprint Summary

Retired the specialist botany board "Plant kingdom" and promoted "Online and
Overnight" as an honest easy replacement.

The retired board depended on plant taxonomy and mixed mosses with lichens.
The replacement uses four exact everyday classifications with short card copy.

## Editorial Evidence

- Draft/reference validation found no exact or 3-of-4 group overlap.
- Independent English editorial review returned KEEP for the final easy board.
- Two earlier candidates were held rather than promoted: the app-navigation
  version had an imprecise digital split, and the sleepwear version used a weak
  bedtime category.

## Changed Files

- puzzles/pool/puzzle-0164.json
- puzzles/_retired/cq6-quality/puzzle-0164.json
- docs/TODO.md
- docs/KNOWN_LIMITATIONS.md
- docs/reports/FOLDWINK_RELEASE_READINESS_CQ6.md
- docs/reports/FOLDWINK_CQ6_EN_PUZZLE_0164_PROMOTION.md

## Validation

- English active pool: 500 puzzles, easy=275, medium=191, hard=34.
- Exact fallback count after promotion: 32 boards total, consisting of 31 English
  boards (124 unresolved group hints) and ru-0465 in Russian (4 group hints).
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

- All replacement items fit the current mobile card limit.
- The board adds no new mechanic and retains the 4x4 core loop.

## Open Risks

- The remaining four English P0 repairs are puzzle-0092, puzzle-0097,
  puzzle-0169, and puzzle-0197.
- Full release gates are run after promotion.

## Go / No-Go

GO for final release gates and the next English replacement.
