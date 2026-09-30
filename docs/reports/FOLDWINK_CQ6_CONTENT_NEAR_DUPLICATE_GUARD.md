# Foldwink CQ6 Content Near-Duplicate Guard

## Summary

A draft can be structurally valid and still repeat an existing player experience.
The draft-to-active validator reports advisory near-duplicates when a candidate
group shares three or more of its four normalized items with an active group.
Exact four-item copies remain separately identified.

The comparison is now also conservative plural-insensitive for the final word of
an item. It handles simple forms such as Balloon/Balloons and
Streamer/Streamers without introducing a full stemming library or changing any
player-visible puzzle text.

## Evidence

The held draft for puzzle-0129 initially revealed why an overlap guard is needed:

- Baking Tools: 3/4 overlap with active puzzle-0513.
- Gardening Tools: 3/4 overlap with active puzzle-0105 and puzzle-0510.
- Painting Tools: exact match with active puzzle-0114, plus 3/4 overlaps with
  puzzle-0028 and puzzle-0514.

The held birthday draft for puzzle-0169 exposed the plural case:

- Gift Presentation exactly repeats active Gift Wrapping in puzzle-0193.
- Party Decorations exactly repeats the active group in puzzle-0193 once
  Balloon/Balloons and Streamer/Streamers are compared consistently.

No active puzzle was changed by this guard work.

## Changed Files

- scripts/validate-puzzles.ts
- docs/TODO.md
- docs/reports/FOLDWINK_CQ6_CONTENT_NEAR_DUPLICATE_GUARD.md

## How To Run

    npx tsx scripts/validate-puzzles.ts --dir=<draft-dir> --reference-dir=puzzles/pool

Use --verbose to print every advisory finding.

## Tests Run

- Draft/reference validation reported the expected exact and near-duplicate
  findings for the held drafts.
- TypeScript: passed.
- ESLint: passed.
- Vitest: 23 files, 174 tests passed.
- Active English pool validation: passed, 500 puzzles.
- Production build: passed; sound-pack check passed.

## Open Risks

- Item overlap cannot identify semantic near-duplicates with fully different
  wording. Independent editorial review remains mandatory before promotion.
- English drafts puzzle-0092, puzzle-0097, and puzzle-0169 remain in drafts
  and are not eligible for promotion.

## Go / No-Go

GO for using the guard in every future EN/RU/DE draft review.
NO-GO for promoting the current puzzle-0169 draft.
