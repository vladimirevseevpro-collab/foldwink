# Foldwink CQ6 DE Wave 7 Review

**Reviewer role:** Independent German puzzle validator  
**Scope:** Strict native-language and fairness review of only
`puzzles/_drafts/cq6-de-replacements-wave7/de-0446.json`, `de-0471.json`,
`de-0494.json`, `de-9020.json`, and `de-9049.json`. The draft JSON, active
pool, code, TODO, and existing reports were not changed.

## Checks Applied

- Valid UTF-8 JSON, exactly four groups of four, and 16 unique card texts per
  draft.
- No Unicode replacement character (`U+FFFD`), checked both as Unicode text
  and as the UTF-8 byte sequence `EF BF BD`.
- Natural contemporary German; narrow, mutually exclusive group membership;
  and no equally defensible alternative four-card solution.
- Easy-tier standard: familiar vocabulary, direct categorisation, and no
  unfair false trail.
- Mobile advisory: every card text is at or below the project's 22-character
  validator threshold. Easy puzzles have no Foldwink Tab labels.

| Draft | Verdict | Review | Mobile |
| --- | --- | --- | --- |
| `de-0446` -- *Einkauf im Supermarkt* | **KEEP** | Valid UTF-8 JSON, 4 x 4 unique cards, and no `U+FFFD`. `Backwaren`, `Milchprodukte`, `Obstsorten`, and `Gemüsesorten` are immediate, familiar supermarket categories. `Quark` and `Käse` do not create a rival four-card dairy row because no other intended row contributes two comparably direct members. The broad fact that all cards are groceries is only the board theme, not an equal-strength solution. Appropriate for Easy. | Longest card: `Croissant` (9 Unicode characters). The longest visible non-card text is the title, `Einkauf im Supermarkt` (21); no mobile concern. |
| `de-0471` -- *Frühstückstisch* | **KEEP** | Valid UTF-8 JSON, 4 x 4 unique cards, and no `U+FFFD`. `Besteck`, `Geschirr`, `Aufstriche`, and `Backwaren` are natural German everyday categories. `Teelöffel` remains ordinary `Besteck`; `Becher` remains ordinary `Geschirr`. `Butter` and `Frischkäse` also being milk products is only a two-card overlap, not a competing four-card group. The shared breakfast setting does not yield an alternative partition. Appropriate for Easy. | Longest cards: `Teelöffel` and `Frischkäse` (10 Unicode characters). No mobile concern. |
| `de-0494` -- *Im Kleiderschrank* | **REVISE** | Valid UTF-8 JSON, 4 x 4 unique cards, and no `U+FFFD`, but `Stirnband` is a weak member of `Kopfbedeckungen`: it is normally a head accessory, not a covering. More importantly, `T-Shirt`, `Shorts`, `Sneaker`, and `Stirnband` form a readily perceived four-card `Sportbekleidung` false trail. The cards are not exclusively athletic in every use, but that alternative is too strong for an Easy board. Replace `Stirnband` with an unambiguously non-sport head covering, for example `Kopftuch`, then re-review. The intended rows otherwise use natural, familiar German. | Current longest card: `Stirnband` / `Hausschuh` (9 Unicode characters). The proposed `Kopftuch` is 8; no layout blocker. |
| `de-9020` -- *Am Schreibtisch* | **KEEP** | Valid UTF-8 JSON, 4 x 4 unique cards, and no `U+FFFD`. Writing instruments, paper goods, computer hardware, and fastening materials are clean, concrete desk categories. `Drucker` is a familiar computer peripheral in this everyday context; `Klebeband` naturally belongs with materials used to attach or secure things. The general desk context is not a rival category, and no four cards form an equally specific alternative row. Appropriate for Easy. | Longest cards: `Kugelschreiber` and `Briefumschlag` (14 Unicode characters). No mobile concern. |
| `de-9049` -- *In der Küche* | **REVISE** | Valid UTF-8 JSON, 4 x 4 unique cards, and no `U+FFFD`, but `Eieruhr` is idiomatically a `Zeitmesser` or kitchen timer, not a `Messwerkzeug`. The other three cards in that row measure quantities or mass, so the category needs an avoidable abstraction jump from “measurement” to “anything that can measure”. This makes the row less direct than Easy requires, even though it does not create a complete rival partition. Replace `Eieruhr` with a clearly culinary measuring instrument such as `Küchenthermometer`, then re-review. The remaining three groups are natural and mutually distinct. | Current longest card: `Pizzaschneider` (14 Unicode characters). `Küchenthermometer` is also below the 22-character threshold; no layout blocker. |

## Decision

- **Keep:** `de-0446`, `de-0471`, `de-9020`.
- **Revise:** `de-0494` -- remove the sportswear false trail and make the
  headwear row taxonomically exact; `de-9049` -- replace the timer with a
  proper culinary measuring instrument.
- **Reject:** none.

The local validator passes all five drafts structurally. Its only advisory
warnings are cross-draft repetition of `Brötchen`, `Brezel`, `Croissant`, and
the label `Backwaren` between `de-0446` and `de-0471`; these do not affect the
within-board fairness decisions above.

This review is an editorial gate only. It neither promotes nor alters active
pool content.
