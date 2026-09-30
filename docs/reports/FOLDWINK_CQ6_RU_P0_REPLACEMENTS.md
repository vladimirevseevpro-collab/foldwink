# Foldwink CQ6 - Russian P0 Replacement Batch

## Decision

Four Russian P0 boards were retired after the native-language Tabs audit. They were replaced one-for-one with four prevalidated local drafts so the active Russian pool remains at 500. The replacements use clear everyday categories; the single medium board carries four explicit short Tabs hints.

## Replacements

| Retired ID | Reason | Replacement ID | Title | Difficulty |
| --- | --- | --- | --- | --- |
| ru-0139 | Overlapping regional and demographic categories created an unfair, specialist classification. | ru-0505 | Ð”Ð¾Ð¼Ð°ÑˆÐ½ÑÑ Ð¾Ð±ÑÑ‚Ð°Ð½Ð¾Ð²ÐºÐ° | easy |
| ru-0193 | Historical eras and architectural styles used non-parallel, specialist categories. | ru-0506 | Ð Ð°Ð±Ð¾Ñ‡ÐµÐµ Ð¼ÐµÑÑ‚Ð¾ | easy |
| ru-0229 | Medical specialties overlapped and mixed professions with roles. | ru-0507 | ÐŸÑ€Ð°Ð·Ð´Ð½Ð¸Ñ‡Ð½Ð¾Ðµ ÑƒÐ³Ð¾Ñ‰ÐµÐ½Ð¸Ðµ | easy |
| ru-0240 | A duplicate architecture taxonomy had non-parallel historical labels. | ru-0508 | ÐŸÑƒÑ‚ÑŒ Ðº Ð²Ñ‹Ð»ÐµÑ‚Ñƒ | medium |

## Validation

- Draft set: `npx tsx scripts/validate-puzzles.ts --dir=puzzles/_drafts/r3-backfill/ru` passed before promotion.
- Active Russian pool must be revalidated after promotion.
- The four retired JSON files remain in `puzzles/_retired/cq6-quality/` for traceability.
