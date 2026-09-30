# Foldwink Content Backfill Validation R3

Date: 2026-07-23  
Reviewer: independent puzzle-quality pass

## Scope and decision rule

Reviewed exactly these 18 drafts:

- EN: `puzzle-0505`–`puzzle-0514` in `puzzles/_drafts/r3-backfill/en/`
- RU: `ru-0501`–`ru-0504` in `puzzles/_drafts/r4-500-backfill/ru/`
- DE: `de-0501`–`de-0504` in `puzzles/_drafts/r3-backfill/de/`

The superseded `puzzles/_drafts/r3-backfill/ru/` folder was not assessed.

Decision policy is deliberately strict: a board is rejected when ordinary play can plausibly support a competing four-card partition. A `REVISE` board has one contained, repairable problem but no demonstrated rival full partition.

## Structural and pool checks

- All 18 files parse and have exactly four groups of four non-empty cards.
- Each board has 16 unique cards and unique internal group IDs. No card exceeds the 22-character mobile limit.
- The completed structural audit found no ID collision in the active EN, RU, or DE pools.
- In particular, the promoted RU IDs `ru-0501`–`ru-0504` are fresh active-pool IDs, not the reused retired-board IDs in the excluded R3 RU draft folder.
- Cross-puzzle card reuse exists, mostly for intentionally common vocabulary. It is not an in-board duplicate or an automatic promotion blocker.

## Per-puzzle decisions

| Draft | Verdict | Critical issues / fairness finding | Suggested fix | Fairness | Publication recommendation |
| --- | --- | --- | --- | ---: | --- |
| `puzzle-0505` | **ACCEPT** | Four elementary sets are exclusive, fluent, and stable. No meaningful false trail, which is appropriate at this easy level. | None. | 9/10 | Promote. |
| `puzzle-0506` | **ACCEPT** | Household-place vocabulary is concrete and categories remain distinct; no credible rival quartet. | None. | 8/10 | Promote. |
| `puzzle-0507` | **ACCEPT** | `Button` and `Mirror` have broad meanings, but their three companions make Sewing Kit and Car Parts canonical. No player should reasonably feel penalised. | None. | 8/10 | Promote. |
| `puzzle-0508` | **ACCEPT** | Wallet, office, cleaning, and lighting sets are clear and mobile-friendly. The board is straightforward rather than deceptive. | None. | 8/10 | Promote. |
| `puzzle-0509` | **ACCEPT** | Furniture, fabrics, instruments, and farm animals are clean natural kinds. Home-context overlap is only a light, fair false trail. | None. | 9/10 | Promote. |
| `puzzle-0510` | **ACCEPT** | All four outdoor categories are conventional and exclusive; vocabulary is broad and factually stable. | None. | 9/10 | Promote. |
| `puzzle-0511` | **ACCEPT** | `Pepper` is botanically a fruit but is unambiguously a culinary vegetable in this ordinary-market context. The remaining food groups do not create a rival partition. | Keep the culinary reading; do not relabel as botanical taxonomy. | 8/10 | Promote. |
| `puzzle-0512` | **ACCEPT** | Grooming groups are coherent. `Brush` and `Polish` create a brief but resolved medium false trail. Tabs (`Smooth`, `Fresh`, `Finish`, `Glow`) are short, distinct, and useful without solving the board. | None. | 8/10 | Promote. |
| `puzzle-0513` | **ACCEPT** | Kitchen routines have stable four-card clusters. Tabs (`Morning`, `Measure`, `After`, `Gather`) give meaningful contextual nudges and Wink remains informative. | None. | 8/10 | Promote. |
| `puzzle-0514` | **REVISE** | The grid itself is fair, but the Tabs are not meaningful category cues: `Go`, `Care`, and `Make` remain far too generic when Wink reveals them, while `Pack` is only weakly camping-specific. This underdelivers the medium-only Wink contract. | Replace all four hints with concise, distinguishing category keywords, e.g. `Cycling`, `Camping`, `Garden`, `Painting`. | 7/10 | Hold pending hint revision and a quick Tabs/Wink recheck. |
| `ru-0501` | **ACCEPT** | Natural travel packing categories; all vocabulary is familiar and fluent. Electronics/accessories are sufficiently anchored by the four-card cluster. | None. | 8/10 | Promote. |
| `ru-0502` | **REJECT** | The situational food labels leak heavily: мёд, ягоды, орехи, печенье, лимон and варенье can all naturally be “к чаю”; several can also accompany porridge. A player can form believable but non-intended quartets and spend a mistake without a fair textual discriminator. | Replace with four mutually exclusive food types, or rebuild around ingredients whose ordinary use is singular. Do not retain broad “к чаю” / “к каше” group labels on this board. | 4/10 | Do not promote; replace and revalidate. |
| `ru-0503` | **ACCEPT** | Крепёж, measuring tools, hand tools, and protective equipment are stable practical categories. `Дюбель` is a defensible fastener and does not create a competing group. | None. | 8/10 | Promote. |
| `ru-0504` | **REVISE** | The intended postal groups are recoverable, but `Подтверждения` is too loose (`квитанция`, two near-synonymous notices, and `трек-номер`), and three Wink hints are uninformative or inaccurate for their groups: `ВИДЫ`, `ПАКЕТ`, `НОМЕР`. This makes a medium hint unreliable. | Tighten the fourth group to one natural document/reference class and replace hints with specific, accurate cues such as `Адрес`, `Отправка`, `Упаковка`, `Отслеживание`. Ensure the two notice cards are not redundant. | 6/10 | Hold pending category and Tab revision. |
| `de-0501` | **REVISE** | `Schnecke` alone normally means a snail and is not uniformly a pastry name; `Berliner` is regionally variable. This is avoidable vocabulary friction in an easy board, not a good false trail. | Change `Schnecke` to `Zimtschnecke`; retain `Berliner` only if regional vocabulary is accepted, otherwise use a nationally clearer pastry. | 6/10 | Hold pending vocabulary clarification. |
| `de-0502` | **ACCEPT** | Garden tools, flowers, culinary vegetables, and planting materials form clean groups. `Kürbis` is a familiar culinary vegetable despite botanical terminology. | Keep the culinary reading. | 8/10 | Promote. |
| `de-0503` | **REJECT** | A rival complete partition is plausible: `Fahrplan`, `Abfahrt`, `Ankunft`, `Verspätung` naturally form travel information, leaving `Umstieg` to join `Gleis`, `Wartebank`, `Kiosk` as platform-related. The intended placement of `Fahrplan` and `Umstieg` is therefore not uniquely defensible. | Replace at least one of `Fahrplan` / `Umstieg` and rebuild the affected two groups so location and information cards cannot be swapped into a full alternative solution. | 3/10 | Do not promote; rebuild and revalidate. |
| `de-0504` | **REVISE** | The cinema partition is fair, but the `FILM` Tab ambiguously points to Filmarten as readily as to Ablauf. A Wink on that tab does not reliably identify its intended group. | Change the Ablauf hint to `ABLAUF` (or another short process-specific cue) and rerun a Tabs/Wink check. | 7/10 | Hold pending Tab revision. |

## Overall promotion verdict

**NO-GO for promoting the 18-board batch unchanged.**

- **Promote now:** 12 accepted boards.
- **Hold for contained revisions:** `puzzle-0514`, `ru-0504`, `de-0501`, `de-0504`.
- **Do not promote; replace/rebuild:** `ru-0502`, `de-0503`.

The accepted boards are safe to promote individually. The held boards need a post-edit validation pass; the two rejects need a new canonical partition before they return to the queue.

## R3.1 post-revision acceptance (2026-07-23)

A focused senior-editor re-read was performed after the six required revisions, together with a fresh structural audit of all 18 files.

| Draft | R3 issue resolved | R3.1 decision |
| --- | --- | --- |
| `puzzle-0514` | Tabs changed from generic activity verbs to `Cycle`, `Camp`, `Garden`, `Paint`. | **ACCEPT** |
| `ru-0502` | Rebuilt from overlapping breakfast uses into playground, picnic, trees, and birds. | **ACCEPT** |
| `ru-0504` | Tracking row rebuilt as `Трек-номер / Статус / Дата / Маршрут`; all Tabs are specific. | **ACCEPT** |
| `de-0501` | Regional/ambiguous pastry terms replaced with `Zimtschnecke` and `Windbeutel`. | **ACCEPT** |
| `de-0503` | Information cards removed; train types, platform, carriage, and ticket groups are now non-interchangeable. | **ACCEPT** |
| `de-0504` | The process Tab is now `ABLAUF`, not the ambiguous `FILM`. | **ACCEPT** |

**Final promotion verdict: GO.** All 18 backfill boards were promoted after this acceptance. Active counts are now exactly EN 500, RU 500 and DE 500.

