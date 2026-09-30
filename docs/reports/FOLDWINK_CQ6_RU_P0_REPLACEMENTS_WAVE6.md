# Foldwink CQ6 Russian P0 Replacements Wave 6

## Sprint Summary

Promoted the final three independently reviewed Russian P0 replacement boards into the active RU pool and archived the prior versions:

- ru-0490
- ru-0497
- ru-9020

The active RU pool remains at 500 boards. All 27 audited Russian P0 boards have now been rebuilt. RU full-label Tabs fallback boards decrease from 12 to 9, and the global fallback total decreases from 61 to 58.

## Changed Files

- puzzles/ru/pool/ru-0490.json
- puzzles/ru/pool/ru-0497.json
- puzzles/ru/pool/ru-9020.json
- puzzles/_retired/cq6-quality/ru-0490.json
- puzzles/_retired/cq6-quality/ru-0497.json
- puzzles/_retired/cq6-quality/ru-9020.json
- docs/TODO.md
- docs/KNOWN_LIMITATIONS.md
- docs/reports/FOLDWINK_CQ6_RU_WAVE6_REVIEW.md

## Tests Run

- Draft validation against active RU reference pool: 3 puzzles, 0 warnings.
- Active RU validation: 500 puzzles, easy=372, medium=128, hard=0; advisory queue retained for legacy review.
- typecheck: passed.
- lint: passed.
- test: 23 files, 174 tests passed.
- audit:logic: one legacy ru-0205 label-nesting signal, independently reviewed KEEP.
- build: passed; 9 local audio cues verified.
- test:e2e: 47 checks passed, including iPhone 390x844, Pixel 6, narrow 320px, itch embed, PWA offline, and RU localisation.

## Manual QA Notes

The ru-0497 bakery group was revised when an independent editor caught an accidental all-B letter pattern. The final board passed both the reference validator and the recheck.

## Open Risks

- 58 active Medium/Hard boards still fall back to full Tabs labels; this is a mobile readability backlog, not an audited Russian P0 fairness queue.
- Public monetisation still requires real hosted payment links, public deployment, and physical-device verification.

## Go / No-Go For Next Sprint

GO for final release-readiness audit. Content fairness work is ready for closed beta. Public paid launch remains NO-GO until hosted payment and deployment evidence exists.
