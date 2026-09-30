# Foldwink CQ6 - Russian P0 Replacement Wave 1

## Sprint Summary

Four Russian P0 candidates were retired and replaced one-for-one by independently reviewed easy boards. The active Russian pool remains exactly 500 puzzles.

## Replaced Boards

| Puzzle ID | Status |
| --- | --- |
| ru-0258 | replaced |
| ru-0274 | replaced |
| ru-0286 | replaced |
| ru-0326 | replaced |

The prior active JSON files are preserved in puzzles/_retired/cq6-quality/.

## Editorial Evidence

- First review: docs/reports/FOLDWINK_CQ6_RU_WAVE1_REVIEW.md
- Independent repeat review: docs/reports/FOLDWINK_CQ6_RU_WAVE1_REVIEW_2.md
- Final repeat verdict: all four boards KEEP.
- The two returned issues were corrected before promotion: the packaging set in ru-0286 no longer creates a fifth baking candidate; ru-0326 now has a coherent wardrobe title and clothing-accessory category.

## Tests Run

- Draft structural validation: 4/4 valid, zero warnings.
- Active Russian pool validation: 500/500 valid; 353 easy and 147 medium.
- Active English pool validation: 500/500 valid.
- Active German pool validation: 500/500 valid.
- TypeScript: passed.
- ESLint: passed.
- Vitest: 23 files and 174 tests passed.
- Content logic audit: completed; one pre-existing review signal remains.
- Production build: passed.
- Browser E2E: 47 scenarios passed, including Russian localisation and 390px responsive flows.

## Manual QA Notes

- These are easy boards, so no Foldwink Tabs hint is expected.
- The next content step is a focused 390px phone-layout review of the remaining Medium/Hard fallback boards before promotion.

## Open Risks

- 64 active Medium/Hard boards still use the full category-label fallback.
- 19 audited Russian P0 candidates remain for native-language replacement.

## Go / No-Go

Go. The replacement wave is validated and ready for the next editorial batch.
