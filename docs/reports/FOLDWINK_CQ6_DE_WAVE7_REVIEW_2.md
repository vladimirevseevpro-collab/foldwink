# Foldwink CQ6 DE Wave 7 Review 2

**Reviewer role:** Independent German puzzle validator  
**Scope:** Re-review of the corrected drafts only:
`puzzles/_drafts/cq6-de-replacements-wave7/de-0494.json` and
`puzzles/_drafts/cq6-de-replacements-wave7/de-9049.json`.

The draft JSON, active pool, application code, `docs/TODO.md`, and existing
reports were not changed.

## Checks Applied

- Strict UTF-8 decoding; no Unicode replacement character (`U+FFFD`) in text
  and no `EF BF BD` replacement byte sequence.
- Exactly four groups of four, with 16 unique card texts per reviewed draft.
- Natural contemporary German, narrow intended categories, and no equally
  defensible competing four-card grouping or full alternative partition.
- Easy-tier suitability: everyday vocabulary, direct categorisation, no
  specialist knowledge, and no wordplay.
- Mobile card-length gate: every card is within the project's 22-character
  limit. Easy puzzles have no Foldwink Tab/reveal-hint requirement.

## Verdicts

| Draft | Verdict | Editorial review | Mobile lengths |
| --- | --- | --- | --- |
| `de-0494` - *Im Kleiderschrank* | **KEEP** | `Kopftuch` is a natural, unambiguous member of `Kopfbedeckungen`; it fixes the prior `Stirnband` issue. `Oberteile`, `Unterteile`, `Schuhe`, and `Kopfbedeckungen` are familiar, direct everyday categories. A loose sports association between `T-Shirt`, `Shorts`, `Leggings`, and `Sneaker` is not an equally strong rival row: those are generic clothing words rather than sport-specific terms, and it does not produce a competing full partition. No other four cards form an equally precise alternative group. Appropriate for Easy. | Longest card: `Hausschuh` (9/22). No length concern. |
| `de-9049` - *In der Küche* | **KEEP** | `Küchenthermometer` is a precise, natural `Messwerkzeug` alongside `Messbecher`, `Küchenwaage`, and `Messlöffel`; it fixes the prior category mismatch. The other rows are ordinary functional kitchen groups: `Kochgeschirr`, electric `Küchengeräte`, and `Schneidewerkzeuge`. Their members remain distinct, and no second four-card grouping is equally direct or supports an alternative partition. Appropriate for Easy. | Longest card: `Küchenthermometer` (17/22). No length concern. |

## Decision

- **Keep:** `de-0494`, `de-9049`.
- **Revise:** none.
- **Reject:** none.

## Verification Record

- Both reviewed files are valid UTF-8 JSON with no `U+FFFD`, four groups, and
  16 unique cards.
- `node scripts/validate-dir.mjs puzzles/_drafts/cq6-de-replacements-wave7`
  completed with 0 errors and 0 warnings. The command validates the draft
  directory as a whole; this editorial review covers only the two files named
  in the scope above.
- This is an editorial gate only. It does not promote or alter active-pool
  content.
