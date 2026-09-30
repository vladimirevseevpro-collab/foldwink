# Foldwink CQ6 DE Wave 3 Review 2

**Role:** Independent German puzzle validator  
**Scope:** Re-review of the corrected draft files `de-0389.json` and
`de-0410.json` in `puzzles/_drafts/cq6-de-replacements-wave3/` only. No
active-pool content was inspected or changed.

## Checks Applied

- Valid UTF-8 JSON, exactly four groups of four, and no duplicated card text.
- No replacement character (`U+FFFD`).
- Natural everyday German, strict intended group membership, and no equally
  defensible alternate four-card partition.
- Easy-tier directness and the current 22-character mobile card advisory
  limit. Easy puzzles do not render Foldwink Tab labels.

| Draft | Verdict | Review | Mobile |
| --- | --- | --- | --- |
| `de-0389` -- *Kaffeepause* | **KEEP** | No `U+FFFD`. The revision from `Streuselkuchen` to `Donut` makes `Kleingebäck` a precise, everyday four-item set: `Keks`, `Muffin`, `Zimtschnecke`, and `Donut`. `Kaffeevarianten`, `Teesorten`, and `Kaffeegeschirr` are equally natural and mutually distinct in the complete board. No other four cards form an equally specific, defensible group, so the intended partition is unique. The vocabulary and direct recognition fit easy. | Longest card: `Latte Macchiato` (15 characters), within 22. |
| `de-0410` -- *Frühstück* | **KEEP** | No `U+FFFD`. The replacement of `Cornflakes` with `Apfelstücke` resolves the former lexical-level mismatch: `Haferflocken`, `Rosinen`, `Nüsse`, and `Apfelstücke` are all ordinary Müsli ingredients. `Brotaufstriche`, `Eiergerichte`, and `Frühstücksgetränke` are clear, idiomatic, and distinct. Individual items such as `Honig` or `Milch` can be used more broadly at breakfast, but they do not create a competing, equally valid four-card partition. This remains a straightforward easy puzzle. | Longest cards: `Haferflocken` and `Gekochtes Ei` (12 characters each), within 22. |

## Decision

- **Keep:** `de-0389`, `de-0410`.
- **Revise:** none.
- **Reject:** none.

Both corrected drafts pass this independent editorial review. They are not
promoted by this report; the active pool remains unchanged.
