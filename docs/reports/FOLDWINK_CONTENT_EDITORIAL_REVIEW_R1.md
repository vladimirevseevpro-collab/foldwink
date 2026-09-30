# Foldwink Content Editorial Review R1

Date: 2026-07-23  
Reviewer: human-language and fairness pass  
Decision vocabulary: **KEEP** = may remain in its present tier; **REVISE** = remove from rotation until the stated edit is made and re-reviewed; **REJECT** = retire the board rather than patching one card.

## Scope and standard

This is a deliberately narrow, deep editorial pass, not a superficial survey of every JSON file. I reviewed the active English and Russian pools, the existing mechanical-risk queue, and the specified high-risk records. The working standard is stricter than schema validity:

1. A player must be able to give each four-card set one natural, level-consistent name.
2. An easy puzzle cannot require specialist taxonomy, disputed classification, or a distinction between near-synonyms, life stages, and breeds unless that relation is plainly the category itself.
3. A medium puzzle may offer a false trail, but not two defensible canonical solutions. Its Wink labels must clarify rather than conceal a weak taxonomy.
4. Labels such as "other X" or an arbitrary split of one real class into two four-item piles fail even where every individual fact is true.

Active-pool reference: `puzzles/pool/` has 500 English puzzles and `puzzles/ru/pool/` has 505 Russian puzzles. This review examines fourteen concrete boards: the seven requested records plus seven high-signal comparators. No application code or puzzle JSON was changed.

## Decisions: required records

| Puzzle | Tier | Decision | Editorial finding | Required action |
| --- | --- | --- | --- | --- |
| `puzzle-0184` — *Down on the farm* | easy | **REJECT** | The board makes four animal families look parallel while three families are filled by sex, life-stage and breed terms (`Cow/Bull/Calf/Ox`, `Sow/Boar/Piglet/Hog`, `Ewe/Ram/Lamb/Merino`) and poultry is a set of species. `Hog` is also a broad synonym, while `Merino` is a breed. This is exactly the artificial distinction that makes a player wonder why cow and calf are separate cards. It is not a clean easy recognition task. | Retire the board; do not solve it by merely changing the label. If the farm theme returns, re-author it with four uniform everyday categories rather than animal families padded with life stages, sex terms or breeds. |
| `ru-0145` — *Молочные продукты* | easy | **REJECT** | The four categories overlap at their core. Айран, катык and мацони are fermented dairy products as well as beverages; "Твёрдые" incorrectly contains масло, творог and сметану; "Напитки" contains сливки and сгущёнку, which ordinary language does not call drinks. Several regional terms are also too specialised for easy. | Retire and re-author from a single non-overlapping axis. Do not keep a board that asks a player to distinguish beverage status from fermentation status. |
| `ru-0157` — *Злаки и крупы* | easy | **REJECT** | The taxonomy is factually and linguistically unstable. Сорго and тефф are cereal grains, not pseudocereals; the other rows mix botanical plants, edible grains and processed products. Киноа and амарант are the actual pseudocereal direction, but the row as written is wrong. The full board requires food-science vocabulary, not easy recognition. | Retire rather than swap one item. A future grain board needs one explicit axis only, with common food terms and no botanical/processing mixture. |
| `ru-0168` — *Советское кино* | easy | **REVISE** | The first three rows are recognizable themes, but the last row is not a stable genre: `Берегись автомобиля`, `Москва слезам не верит`, `Ирония судьбы` and `Служебный роман` are not one clean set of "лирических комедий". The board also demands identification of sixteen films, directors and genres, so its current easy tier is wrong. | Move to **medium** after re-authoring the last row. A defensible repair is: rename the first row to `Комедии Гайдая`; replace `Москва слезам не верит` with `Гараж`; rename the last row `Фильмы Эльдара Рязанова`. Re-check all four Wink hints and mobile card fit after the change. |
| `ru-0228` — *Литературные жанры* | easy | **REJECT** | `Документальная проза` is literally a subtype of `Проза`; essay, memoir, diary and sketch can fit the wider prose set. This is not a false trail but a nested-category contradiction. The rows also mix form, genre, mode and medium. | Retire and rebuild from four mutually exclusive literary axes. A tier change cannot repair a board with a valid second grouping. |
| `ru-0449` — *Культура Японии* | medium | **REVISE** | `Искусства` is a parent class of `Боевые искусства`, so the distinction is linguistic rather than categorical. `Поклон` is both social etiquette and a conventional act in martial arts. The theme is attractive and the food row is sound, but the taxonomy needs precision before a Wink reveals it. | Keep the theme, but replace labels and one item: `Искусства` -> `Традиционные визуальные искусства`; `Боевые искусства` -> `Будо`; `Кухня` -> `Японские блюда`; `Обычаи` -> `Праздники и ритуалы`; replace `Поклон` with `Сёгацу` or another broadly recognisable Japanese ritual. Use non-giveaway Wink hints such as `ВИЗУАЛ`, `БУДО`, `БЛЮДА`, `РИТУАЛ`, then re-review. |
| `ru-0489` — *Великая Отечественная — города* | easy | **REJECT** | `Города-герои` and `Ещё города-герои` are two arbitrary partitions of the same category, so no player can infer which four were intended. The third row changes the object type from cities to `Berlin 1945`-style historical events, and the fourth mixes blockade, defence, fortress and siege. It is also a specialist history board incorrectly marked easy. | Retire in full. Do not patch labels or move it to medium: the canonical grouping is absent. |

## Additional high-priority sample

| Puzzle | Tier | Decision | Why it matters | Required action |
| --- | --- | --- | --- | --- |
| `puzzle-0281` — *World Cup Nations* | easy | **REJECT** | The title calls everything nations even though `West Indies` is a cricket team, not a sovereign nation. More seriously, the Netherlands have been FIFA Women's World Cup runners-up, not winners, so the board contains a factual error. It is sports-history recall, not easy recognition. | Retire the record; rebuilding it needs a fact-checked sports editor and a higher tier. |
| `puzzle-0289` — *Island State* | easy | **REJECT** | The board relies on regional geography and contested/common-language labels for island states: Singapore, Timor-Leste and Indonesia are not four parallel instances of one simple island-country type. Palau, Comoros and Timor-Leste also violate the easy common-vocabulary requirement. | Remove from easy rotation. Re-author a geography board only after choosing one unambiguous axis and an appropriate higher tier. |
| `puzzle-0408` — *Musical Tempo* | easy | **REJECT** | It is a specialist Italian-tempo taxonomy presented as easy. `Andantino`, `Allegretto`, `Animato` and several speed boundaries vary by musical tradition and score context; the board tests conservatory vocabulary, not natural language. | Retire. It should not be promoted merely by re-labelling it medium, because the categories remain too technical and unstable. |
| `puzzle-0489` — *Sort It Out* | medium | **REJECT** | The puzzle requires algorithm-specialist knowledge (`Stooge Sort`, `Library Sort`, `Smooth Sort`, `Pigeonhole Sort`) and uses non-exclusive classifications: for example, implementation and textbook taxonomy can place Shell/Heap/Cycle-family algorithms differently. It also has no `revealHint` fields despite being medium. | Retire; a technical category board needs a separate, fully source-checked content policy before re-entry. |
| `puzzle-0030` — *Sound off* | medium | **REVISE** | The repeated label shape is a harmless automated signal, not an overlap: dog, cat, cow and bird sounds form clean groups. But it is too direct for medium and supplies no meaningful false trail; its four Wink hints merely announce the answer. | Reclassify as **easy** after a quick mobile read-through. Keep the cards; do not treat the repeated label wording as a fairness fault. |
| `ru-0028` — *Одежда* | easy | **REVISE** | The main classification is natural. The weak card is `Сорочка`: without `ночная`, it can be an ordinary upper-body shirt and competes with the upper-body row. `Тапочки` are footwear but can defensibly sit in a homewear row. | Replace `Сорочка` with `Ночная сорочка` and relabel the row `Одежда для дома и сна`; then the board is fit to keep as easy. |
| `ru-0205` — *Страны Азии* | easy | **KEEP** | The regions form one accepted geographic axis; all items are countries and there is no cross-row membership under the intended UN-style regional scheme. The repeated word `Азия` is only a label-template signal, not a competing solution. | Keep. Future geography additions should remain at this common-country vocabulary level and avoid border/disputed-region cases. |

## Priority remediation order

1. Immediately remove the nine reject boards from the selectable pools: `puzzle-0184`, `puzzle-0281`, `puzzle-0289`, `puzzle-0408`, `puzzle-0489`, `ru-0145`, `ru-0157`, `ru-0228`, `ru-0489`.
2. Repair and re-review `ru-0168`, `ru-0449`, `puzzle-0030` and `ru-0028` before their next promotion. No status change counts as approval without a second human read.
3. Treat the automated logic report as a queue, not a verdict. It correctly surfaced the adult/young and nested-label risks, but it also flags harmless repeated wording (`puzzle-0030`, `ru-0205`).
4. Before future batches: reject any easy group whose fourth card is only a breed, life stage, synonym, regional term or specialist sub-type added to fill four slots.

## Fact checks used in this pass

- FIFA documents the 2019 USA victory over the Netherlands and describes the Netherlands as runners-up, which confirms the error in `puzzle-0281`: [FIFA, France 2019](https://www.fifa.com/en/tournaments/womens/womensworldcup/fifa-womens-world-cup-france-2019).
- USDA classifies sorghum and teff as cereal grains, supporting the correction required for `ru-0157`: [USDA Agricultural Research Service](https://aglab.ars.usda.gov/sights-and-sounds/cooking-science-ancient-grains).

## Changed files

- `docs/reports/FOLDWINK_CONTENT_EDITORIAL_REVIEW_R1.md` (new)

## Applied remediation (2026-07-23)

- Retired all nine R1 **REJECT** records to `puzzles/_retired/r1-editorial/`; they no longer enter active EN/RU selection.
- Applied and re-read the four **REVISE** records: `puzzle-0030` is now easy without Tabs; `ru-0028` uses `Ночная сорочка`; `ru-0168` is medium with unambiguous Gaidai/Ryazanov groups and hints; `ru-0449` separates visual arts, budo, food, and rituals.
- Added multilingual validator entry points. They exposed two pre-existing duplicate-card defects: `de-0204` had only three genuine German emperors and a duplicated Wilhelm I.; `ru-0333` duplicated Sukhovo-Kobylin. Both were retired to `puzzles/_retired/r1-editorial/r2-validator-discoveries/` rather than given artificial fourth cards.
- Re-validated all active EN, RU and DE pools. `ru-0205` was re-read and retained: East Asia and Southeast Asia are standard peer regions, not nested playable groups.

## Changed files (applied)

- Active pools and retirement archives under `puzzles/`
- `scripts/validate-puzzles.ts`, `package.json`
- `src/components/FoldwinkTabs.tsx`
- `docs/TODO.md` and `docs/reports/FOLDWINK_SPRINT_R7_CONTENT_EDITORIAL_REMEDIATION.md`
