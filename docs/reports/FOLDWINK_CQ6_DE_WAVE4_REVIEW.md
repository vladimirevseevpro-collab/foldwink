# Foldwink CQ6 DE Wave 4 Review

**Role:** Independent German puzzle validator  
**Scope:** Native-language and fairness review of `de-0413`, `de-0420`,
`de-0425`, and `de-0427` in
`puzzles/_drafts/cq6-de-replacements-wave4/` only. The active pool was not
inspected, changed, or promoted.

## Checks Applied

- Valid UTF-8 JSON, four groups of four, and no duplicate card text within a
  board.
- No replacement character (`U+FFFD`).
- Idiomatic, everyday German; narrow and mutually exclusive intended groups;
  no equally defensible alternative grouping or cross-group membership.
- Easy-tier direct-recognition standard: no specialist knowledge, wordplay, or
  fragile classification boundary.
- The current mobile-card advisory of 22 Unicode characters. These are easy
  puzzles, so Foldwink Tab labels are not rendered during play.

| Draft | Verdict | Native-language and fairness review | Mobile review |
| --- | --- | --- | --- |
| `de-0413` -- *Obstsorten* | **REVISE** | No `U+FFFD`; every individual word is natural German. `Zitrusfrüchte`, `Steinobst`, and `Beeren` are clean sets. `Tropische Früchte`, however, is a geographic/retail umbrella rather than a mutually exclusive fruit class: citrus fruits, especially `Grapefruit` and often `Orange` or `Mandarine`, are also tropical or subtropical fruits. A solver can therefore reasonably place citrus cards with `Banane`, `Mango`, `Ananas`, and `Papaya`; the board then penalises a defensible classification. This violates the easy red line even without a second complete four-card partition. Rebuild that row as a genuinely disjoint class, for example `Kernobst` with four everyday members, and re-submit the amended board. Renaming it to another broad geographic label does not fix the overlap. | Longest card: `Grapefruit` (10 characters), within 22. |
| `de-0420` -- *Gemüsearten* | **KEEP** | No `U+FFFD`. `Kohlsorten`, `Wurzelgemüse`, `Hülsenfrüchte`, and `Salatsorten` are ordinary, defensible food classifications. `Rote Bete` and `Rettich` are natural members of the root-vegetable row; `Erbsen`, `Bohnen`, `Linsen`, and `Kichererbsen` form the familiar culinary legume set. No item belongs naturally to another displayed category, and no equally strong alternative four-card grouping arises. The vocabulary is everyday and directly recognisable, so easy is the correct tier. | Longest cards: `Kichererbsen` and `Eisbergsalat` (12 characters each), within 22. |
| `de-0425` -- *Schreibwaren* | **KEEP** | No `U+FFFD`. The four rows are idiomatic and functionally distinct: writing implements, measuring tools, paper goods, and fastening supplies. `Geodreieck` is a normal school measuring tool; `Heftklammer` and `Gummiband` are ordinary office fastening supplies. Although all cards share the broad stationery theme, none creates a competing membership in another displayed four-card class. This is a plain, common-vocabulary easy puzzle with one defensible partition. | Longest card: `Kugelschreiber` (14 characters), within 22. |
| `de-0427` -- *Am Esstisch* | **KEEP** | No `U+FFFD`. `Besteckteile`, `Trinkgefäße`, `Tischwäsche`, and `Würzgefäße` are natural everyday table categories. `Platzset` is commonly grouped with `Tischdecke`, `Tischläufer`, and `Stoffserviette` as table linen/textiles in household use; its possible non-textile materials do not make it a member of any other displayed row. `Ölflasche` and `Essigflasche` are standard table condiment containers. The board has no equally defensible alternate four-card partition and remains a direct-recognition easy puzzle. | Longest card: `Stoffserviette` (14 characters), within 22. |

## Decision

- **Keep:** `de-0420`, `de-0425`, `de-0427`.
- **Revise and re-submit to validator:** `de-0413`.
- **Reject:** none.

All four drafts are valid UTF-8 JSON and contain no `U+FFFD`. Only the
cross-category taxonomy in `de-0413` prevents immediate acceptance; no
active-pool content was changed by this review.
