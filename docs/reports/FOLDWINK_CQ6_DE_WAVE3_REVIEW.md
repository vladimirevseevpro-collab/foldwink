# Foldwink CQ6 DE Wave 3 Review

**Role:** Independent German puzzle validator  
**Scope:** Native-language and fairness review of `de-0382`, `de-0389`,
`de-0390`, and `de-0410` under
`puzzles/_drafts/cq6-de-replacements-wave3/` only. No active-pool file was
reviewed or changed.

## Method

Each draft was checked for `U+FFFD`, idiomatic everyday German, strictly
exclusive four-item groups, equally defensible alternate four-card groupings,
easy-tier suitability, and mobile card lengths. The current card advisory
limit is 22 Unicode characters; easy puzzles do not expose Foldwink Tab
labels.

| Draft | Verdict | Native-language and fairness review | Mobile review |
| --- | --- | --- | --- |
| `de-0382` -- *Badregal* | **KEEP** | No `U+FFFD`. `Zahnpflege`, `Haarpflege`, `Rasur`, and `Handpflege` are idiomatic, ordinary bathroom classifications. `Nagellack` and `Nagelhautschere` sit naturally within the hand/nail-care set; neither creates a valid second row with the other cards. The board has one clear partition, uses common vocabulary throughout, and is an appropriate direct-recognition easy puzzle. | Longest card: `Nagelhautschere` (15 characters). No mobile concern. |
| `de-0389` -- *Kaffeepause* | **REVISE** | No `U+FFFD`. Three rows are clean and natural. The `Kleingebäck` row is not semantically exact: `Streuselkuchen` is ordinarily a Kuchen, not Kleingebäck. This breaks the required narrow, defensible category rather than creating an interesting false trail. Replace `Streuselkuchen` with an unequivocal Kleingebäck item such as `Donut`; then re-check the amended row. The remaining intended partition has no equally valid alternative. | Longest card: `Latte Macchiato` (15 characters). No mobile concern. |
| `de-0390` -- *Kleiderschrank* | **KEEP** | No `U+FFFD`. All four groups are common, mutually exclusive clothing classifications. `Stirnband` is a normal member of the headwear set in this everyday context; `Leggings` is a normal lower-body garment. `Fußbekleidung` is slightly more formal than `Schuhe`, but is correct and understandable. No competing four-card partition is defensible. The vocabulary and direct category recognition meet easy-tier requirements. | Longest card: `Hausschuhe` (10 characters). No mobile concern. |
| `de-0410` -- *Frühstück* | **REVISE** | No `U+FFFD`. `Brotaufstriche`, `Eiergerichte`, and `Frühstücksgetränke` are intelligible, familiar sets. The `Müsli-Zutaten` row mixes three ordinary components (`Haferflocken`, `Rosinen`, `Nüsse`) with `Cornflakes`, which is normally understood as a finished breakfast cereal rather than a Müsli ingredient. This creates a loose category and invites a competing breakfast-cereal reading, which is too imprecise for easy. Replace `Cornflakes` with a clear ingredient at the same lexical level, for example `Apfelstücke`, then re-check the amended board. | Longest card: `Haferflocken` and `Gekochtes Ei` (12 characters each). No mobile concern. |

## Decision

- **Keep:** `de-0382`, `de-0390`.
- **Revise and re-submit to validator:** `de-0389`, `de-0410`.
- **Reject:** none.

All four examined source files are free of the replacement character
`U+FFFD`. The requested revisions are editorial and narrowly scoped; neither
requires a change to the active pool.
