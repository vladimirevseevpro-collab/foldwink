# Foldwink CQ6 DE Wave 6 Review

**Role:** Independent German puzzle validator  
**Scope:** Strict native-language and fairness review of the four draft files
only: `puzzles/_drafts/cq6-de-replacements-wave6/de-0430.json`,
`de-0433.json`, `de-0435.json`, and `de-0445.json`. The active pool, draft
JSON, code, TODO, and pre-existing reports were not changed.

## Checks Applied

- Strict UTF-8 decoding, valid JSON, exactly four groups of four, and 16
  unique card texts per draft.
- No Unicode replacement character (`U+FFFD`).
- Natural contemporary German; narrow, mutually exclusive everyday groups;
  no equally defensible alternative four-card row or complete partition.
- Easy-tier direct-recognition standard: familiar vocabulary, minimal
  accidental cross-pollination, no specialist knowledge.
- Mobile card advisory: 22 Unicode characters maximum. Easy puzzles do not
  render Foldwink Tab labels.

| Draft | Verdict | Review | Mobile |
| --- | --- | --- | --- |
| `de-0430` -- *Frühstück zu Hause* | **KEEP** | Valid UTF-8 JSON, 4 x 4 unique cards, no `U+FFFD`. `Brotaufstriche`, `Müslizutaten`, breakfast drinks, and fruit are natural, directly recognisable everyday groups. `Cornflakes` is a normal component of a breakfast cereal/muesli mix in this context; it does not create a rival four-card group. Broad breakfast associations apply to the whole board, while sweet or edible-item associations are too broad to be an equal-strength solution. No displayed item naturally belongs in another intended row. Appropriate for Easy. | Longest card: `Nuss-Nougat-Creme` (17 Unicode characters). It is below 22 and can use the supported two-line card layout; no mobile blocker. |
| `de-0433` -- *Im Badezimmer* | **REVISE** | Valid UTF-8 JSON, 4 x 4 unique cards, no `U+FFFD`, but the row labelled `Duschpflege` is not strictly bounded. A `Duschschwamm` is a shower accessory, not a care product; unqualified `Peeling` can naturally mean a facial or hair product, rather than a body product used in the shower. This is a small but real Easy-tier membership defect, because the intended category promises products while one card is a tool and another is semantically underspecified. Replace `Duschschwamm` with a clear shower-care product such as `Duschschaum`, and qualify `Peeling` as `Körperpeeling`; then re-review. The remaining three rows are natural and do not yield an equally defensible rival partition. | Current longest card: `Duschschwamm` (12 Unicode characters). The proposed `Körperpeeling` is 13; both are below 22. No layout blocker, but editorial revision is required. |
| `de-0435` -- *Auf dem Schreibtisch* | **KEEP** | Valid UTF-8 JSON, 4 x 4 unique cards, no `U+FFFD`. Writing instruments, fastening materials, paper goods, and computer hardware are clear everyday desk categories. `Gummiband` is naturally used to bundle or secure papers; it does not make the fastening row vague. The board-level desk theme is broad, but it cannot substitute for a rival four-card partition. No card has an equally strong membership in another displayed row. Direct, familiar Easy content. | Longest card: `Kugelschreiber` (14 Unicode characters). All cards are below 22; no mobile concern. |
| `de-0445` -- *Im Kleiderschrank* | **KEEP** | Valid UTF-8 JSON, 4 x 4 unique cards, no `U+FFFD`. Tops, legwear, shoes, and clothing accessories are ordinary German wardrobe categories with clean membership. `Shorts` and `Leggings` are normal examples of `Beinbekleidung`; no alternative category can reassign four cards with equal plausibility. The vocabulary is immediate and the solution path is suitable for Easy. | Longest cards: `Turnschuhe` and `Hausschuhe` (10 Unicode characters). All cards are comfortably below 22; no mobile concern. |

## Decision

- **Keep:** `de-0430`, `de-0435`, `de-0445`.
- **Revise:** `de-0433` -- make the shower-care row lexically and
  ontologically consistent, then submit that draft for re-review.
- **Reject:** none.

This review is an editorial gate only. It neither promotes nor alters active
pool content.
