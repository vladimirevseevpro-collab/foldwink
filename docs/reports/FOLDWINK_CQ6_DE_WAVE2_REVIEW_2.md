# Foldwink CQ6 DE Wave 2 Review 2

**Role:** Independent German puzzle validator  
**Scope:** `de-0340.json`, `de-0352.json`, and `de-0361.json` only.  
**Verdict:** No draft is ready to enter the active pool in its current form.

## Validation Criteria

- Natural, idiomatic German for labels and items.
- Four intended groups that are mutually exclusive for an easy puzzle.
- No equally plausible alternative four-item grouping.
- Terms short enough to scan and fit reliably in the mobile 4x4 grid.
- Valid UTF-8 text: source text must not contain Unicode replacement characters (`U+FFFD`).

## `de-0340` - REVISE

The grouping is otherwise easy to read: dental-care items and grooming tools are well separated, and there is no equally strong alternative four-item solution.

**Blocking reason:** The label `Duschzubeh\uFFFDr` contains `U+FFFD` and is therefore corrupted German text. It must be restored to valid UTF-8 before the puzzle can ship.

**Editorial note:** `Handtuch` is naturally used after showering, but it is broader than the other three consumable washing products. This is not a reject-level ambiguity, though a more tightly matched fourth shower item would make the intended group cleaner.

**Mobile check:** Pass. Longest item strings are `Waschbecken`, `Mundsp\u00fclung`, and `Nagelschere` at 11 characters.

## `de-0352` - REVISE

The intended categories can be inferred, but the employee group is too generic for an easy puzzle and the source contains corrupted German text.

**Blocking reasons:**

- `Kom\uFFFDdie` and `Filmvorf\uFFFDrer` contain `U+FFFD`; neither is valid German text as stored.
- `Reinigungskraft` (15 characters) is a mobile-grid risk and is not cinema-specific. It weakens `Kinoangestellte`: the player must accept a generic job as belonging to a cinema, while `Filmvorf\uFFFDrer` is also dated and less familiar to a contemporary easy-puzzle audience.

**Exclusivity check:** No competing complete group is currently as strong as the intended solution. The issue is category precision and accessibility, not a second valid solution.

**Mobile check:** Revise. `Reinigungskraft` is too long for a conservative mobile card budget; `Platzanweiser` and `Filmvorf\uFFFDrer` are also long at 13 characters each.

## `de-0361` - REVISE

The beach equipment, sea-life, and swimming-equipment groups are clear and do not create an equally plausible alternative complete grouping.

**Blocking reasons:**

- `Strandausr\uFFFDstung` and `Schwimmzubeh\uFFFDr` contain `U+FFFD`; both labels are corrupted in the source.
- `Bademantel` is not `Badebekleidung` in the normal German meaning of swimwear. It is worn before or after bathing, rather than for swimming. That breaks the semantic strictness required for an easy group and creates a cross-category association with beach equipment / post-swim items.

**Mobile check:** Pass. The longest item strings are 13 characters (`Schwimmbrille`, `Schwimmfl\u00fcgel`), which remains within a reasonable mobile card budget.

## Required Disposition

Keep all three drafts out of the active pool until the listed UTF-8 defects are corrected. For the content revisions, retain the simple everyday themes and replace only the weak or overly broad terms identified above; a further independent validation pass is required after those edits.
