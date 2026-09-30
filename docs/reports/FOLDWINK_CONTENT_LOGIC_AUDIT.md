# Foldwink Content Logic Audit

Generated: 2026-09-05

## Scope

- Pools scanned: en=1000, ru=1000, de=1000
- This is a human-review queue. Signals are not automatic rejections.
- High-priority rule: adult animals and their young must not create a false distinction or an accidental overlap between hidden groups.

## Findings

| Severity | Pool | Puzzle | Group(s) | Signal | Review note |
| --- | --- | --- | --- | --- | --- |
| review | ru | ru-0205 — Страны Азии | Восточная Азия / Юго-Восточная Азия | nested-labels | One label is a strict subset of the other: восточная, азия. Verify that the narrower group cannot leak into the broader one. |

## Editorial Decision Rule

1. Keep a signal only when an ordinary player can explain all four items with one natural, level-consistent category.
2. Revise when one item is a life stage, subtype, part, or near-synonym of another item without the label explicitly making that relation the point.
3. Reject when two plausible groupings compete and neither is clearly stronger from the items alone.
4. Verify every revised puzzle on a 390px mobile layout before promotion.
