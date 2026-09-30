# Foldwink CQ6 DE Wave 5 Review 2

**Role:** Independent German puzzle validator  
**Scope:** Re-review of the corrected drafts only:
`puzzles/_drafts/cq6-de-replacements-wave5/de-0366.json` and
`puzzles/_drafts/cq6-de-replacements-wave5/de-0372.json`. The active pool,
source JSON, code, TODO, and existing reports were not changed.

## Checks Applied

- Strict UTF-8 decoding and valid JSON; exactly four groups of four and no
  duplicate card text.
- No Unicode replacement character (`U+FFFD`).
- Natural contemporary German, strict everyday group membership, and no
  equally defensible alternative four-card grouping or full partition.
- Easy-tier direct-recognition standard and the 22-Unicode-character mobile
  card advisory. Easy puzzles do not render Foldwink Tab labels.

| Draft | Verdict | Review | Mobile |
| --- | --- | --- | --- |
| `de-0366` -- *Im Badezimmer* | **KEEP** | Valid UTF-8 JSON; 4 x 4 unique cards; no `U+FFFD`. The prior membership faults are resolved. `Duschschaum` is unambiguously a shower product, and `Haaröl` is a standard hair-care product. The four rows are natural and strictly bounded: dental-care products, hair-care products, shower products, and nail-care tools. `Körperpeeling` is a normal product used while showering and does not create a competing four-card class. Broad bathroom associations apply to the whole board, not to a rival equal-strength partition. The solution is direct everyday recognition, appropriate for Easy. | Longest card: `Körperpeeling` (13 Unicode characters). It is well below 22; no mobile concern. |
| `de-0372` -- *Am Frühstückstisch* | **KEEP** | Valid UTF-8 JSON; 4 x 4 unique cards; no `U+FFFD`. The prior issue is resolved: `Apfelstücke`, alongside oats, raisins, and almonds, is an ordinary muesli ingredient rather than a finished cereal product. Bread spreads, muesli ingredients, hot drinks, and egg dishes are familiar, mutually exclusive categories in the displayed set. Secondary breakfast associations do not form another coherent four-card row or an equally defensible full partition. The vocabulary and solution path are direct enough for Easy. | Longest card: `Nuss-Nougat-Creme` (17 Unicode characters). It is within the 22-character advisory and supported by the card's two-line mobile layout; no mobile blocker. |

## Decision

- **Keep:** `de-0366`, `de-0372`.
- **Revise:** none.
- **Reject:** none.

Both corrected drafts pass this independent review and may proceed through the
normal content workflow. This report does not promote or otherwise change
active-pool content.
