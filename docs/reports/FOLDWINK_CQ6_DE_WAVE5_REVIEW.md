# Foldwink CQ6 DE Wave 5 Review

**Role:** Independent German puzzle validator  
**Scope:** Native-language and fairness audit of these drafts only:
`puzzles/_drafts/cq6-de-replacements-wave5/de-0366.json`,
`de-0368.json`, `de-0372.json`, and `de-0378.json`. The active pool, source
JSON, code, TODO, and existing reports were not changed.

## Checks Applied

- Valid UTF-8 JSON with exactly four groups of four and no duplicate card
  text.
- No Unicode replacement character (`U+FFFD`).
- Natural contemporary German; narrow, mutually exclusive everyday groups;
  and no equally defensible alternative four-card partition.
- Easy-tier direct-recognition standard and the 22-Unicode-character mobile
  card advisory. Easy puzzles do not render Foldwink Tab labels.

| Draft | Verdict | Review | Mobile |
| --- | --- | --- | --- |
| `de-0366` -- *Im Badezimmer* | **REVISE** | No `U+FFFD`. The intended partition is readily visible and no equally strong second full partition arises, but two labels are narrower than their card sets. `Badeschaum` is for a bath, not a shower, so it is not a clean member of `Duschprodukte`. `Haargel` is ordinarily a styling product, whereas `Shampoo`, `Spülung`, and `Haarkur` are care products; its membership in `Haarpflegeprodukte` is therefore loose. These are category-definition faults, not fair Easy false trails. Re-author the affected rows with strictly matching everyday terms, then re-check the whole board. | Longest card: `Körperpeeling` (13 Unicode characters). Well within 22; no mobile concern. |
| `de-0368` -- *Beim Backen* | **KEEP** | No `U+FFFD`. `Teigzutaten`, `Triebmittel`, `Backformen`, and `Kuchendekorationen` are natural, recognizable everyday German categories. `Sauerteig` is a standard natural leavening agent; `Muffinblech` is an ordinary baking form; and `Marzipan` is a conventional cake-decoration material as well as a baking ingredient. Those secondary uses do not create a rival four-card group or make the displayed rows ambiguous. The partition is direct, general-vocabulary Easy content. | Longest cards: `Gugelhupfform` and `Schokoglasur` (13 Unicode characters). Well within 22; no mobile concern. |
| `de-0372` -- *Am Frühstückstisch* | **REVISE** | No `U+FFFD`. `Brotaufstriche`, `Heißgetränke`, and `Eierspeisen` are clean, familiar groups. The `Müslizutaten` row is not yet at the same lexical level: `Haferflocken`, `Rosinen`, and `Mandeln` are ordinary components added to muesli, while `Cornflakes` normally denotes a finished breakfast cereal. Cornflakes can occur in an individual mixture, but that contextual possibility is too loose for a narrow Easy group and invites a competing cereal reading. Replace it with an unequivocal muesli component and re-check the amended board. No other equally valid complete partition is present. | Longest card: `Nuss-Nougat-Creme` (17 Unicode characters). Within 22 and readable with the card's normal two-line layout; no mobile blocker. |
| `de-0378` -- *Im Büro* | **KEEP** | No `U+FFFD`. `Schreibgeräte`, `Büromöbel`, `Befestigungsmittel`, and `Papierwaren` are idiomatic everyday office classifications. `Gummiband` is a normal office fastening item, while `Klebezettel` is a standard paper good. Minor broad associations, such as a text marker being used on paper, do not yield an equally defensible rival row or partition. The vocabulary is common and the solution is suitably direct for Easy. | Longest card: `Kugelschreiber` (14 Unicode characters). Well within 22; no mobile concern. |

## Decision

- **Keep:** `de-0368`, `de-0378`.
- **Revise:** `de-0366`, `de-0372`.
- **Reject:** none.

`de-0366` and `de-0372` must not be promoted until their stated
category-level repairs receive a fresh independent review. This report does
not promote or otherwise change active-pool content.
