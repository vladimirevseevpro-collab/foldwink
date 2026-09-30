# Foldwink CQ6 DE Wave 4 Review 2

**Role:** Independent German puzzle validator  
**Scope:** Re-review of the corrected draft
`puzzles/_drafts/cq6-de-replacements-wave4/de-0413.json` only. The active
pool, source JSON, code, TODO, and existing reports were not changed.

## Checks Applied

- Valid UTF-8 JSON with exactly four groups of four and no duplicate card
  text.
- No Unicode replacement character (`U+FFFD`).
- Natural German, strict everyday group membership, and no equally
  defensible alternative four-card grouping.
- Easy-tier direct-recognition standard and the 22-Unicode-character mobile
  card advisory. Easy puzzles do not render Foldwink Tab labels.

| Draft | Verdict | Review | Mobile |
| --- | --- | --- | --- |
| `de-0413` -- *Obstsorten* | **KEEP** | No `U+FFFD`. `Zitrusfruechte`, `Melonen`, `Steinobst`, and `Beeren` are all natural everyday German fruit categories. The prior blocker is resolved: `Melonen` is a bounded category and does not overlap the citrus row as the former geographic class did. `Cantaloupe` and `Galiamelone` are ordinary German retail terms for melons. The usual culinary classification of `Erdbeere`, `Himbeere`, `Blaubeere`, and `Brombeere` as berries is clear; botanical exceptions are specialist knowledge and do not supply an equally defensible in-play alternative. No card naturally fits another displayed four-card class, and no rival complete partition arises. The board is direct general-vocabulary recognition, so easy is the correct tier. | Longest cards: `Wassermelone` (12 Unicode characters); `Honigmelone` and `Galiamelone` (11). All are well within 22 and readable on the mobile 4x4 grid. |

## Decision

- **Keep:** `de-0413`.
- **Revise:** none.
- **Reject:** none.

The corrected draft passes this independent editorial review. This report does
not promote or otherwise change active-pool content.
