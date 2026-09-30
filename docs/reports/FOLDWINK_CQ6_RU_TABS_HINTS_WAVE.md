# Foldwink CQ6 Russian Tabs Hints Wave

## Sprint Summary

Added independently reviewed thematic Tabs hints to eight Russian medium boards: ru-0108, ru-0185, ru-0250, ru-0284, ru-0293, ru-0339, ru-0354, and ru-0402.

The remaining ru-0465 architecture board intentionally retains its full-label fallback. Several short alternatives were either overly direct, too vague, or unnatural; the full label is clearer than a compromised hint.

## Verification

- RU validator: 500 puzzles, tabs=4, representing the one retained board.
- All eight changed boards received independent KEEP decisions after editorial iterations.
- The existing 47-character Tabs E2E layout coverage exceeds every newly added hint length.

## Result

- Russian full-label fallback boards: 9 -> 1.
- Global full-label fallback boards: 58 -> 50 (49 EN, 1 RU, 0 DE).

## Open Risks

- English remains the material mobile-readability queue and needs small editorial waves, not bulk replacement.
- The retained ru-0465 full label remains suitable for 320px coverage but should be revisited only if a genuinely useful short association is found.

## Tests Run

- typecheck: passed.
- lint: passed.
- unit tests: 23 files, 174 tests passed.
- production build: passed; 9 local audio cues verified.
- browser E2E: 47 checks passed, including 320px, iPhone 390x844, Pixel 6, itch embed, PWA offline, and RU localisation.

## Go / No-Go

GO for the English Tabs review wave. The Russian Tabs queue is reduced to one intentionally retained full-label board.
