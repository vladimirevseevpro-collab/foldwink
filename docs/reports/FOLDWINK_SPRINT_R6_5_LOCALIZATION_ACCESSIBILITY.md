# Foldwink Sprint R6.5 - Language Integrity and Accessibility

## Sprint Summary

This increment closes a player-trust defect: choosing Russian changed the UI
language before the Russian puzzle pool finished loading. The menu then read
from its English fallback and could start an English board under Russian
chrome.

Implemented:

- language choice now waits for the selected DE/RU pool before changing the
  active locale
- loading has a busy state and prevents competing language clicks
- browser E2E proves that RU opens a Russian puzzle title and Russian cards
- game timer announcements are localised
- solved cards can announce their actual solved group rather than a colour
  number
- game result feedback includes a short live correct/incorrect status
- Daily Fold and Foldwink Tabs have explicit accessibility grouping semantics
- a repeatable three-pool content-logic audit was added as `npm run audit:logic`

No puzzle content was automatically edited by the heuristic. It produces a
human editorial queue only.

## Changed Files

- src/components/LanguageToggle.tsx
- src/components/Card.tsx
- src/components/GameTimer.tsx
- src/components/MistakesDots.tsx
- src/components/DailyFold.tsx
- src/components/FoldwinkTabs.tsx
- src/components/Grid.tsx
- src/screens/GameScreen.tsx
- src/i18n/strings.ts
- scripts/audit-puzzle-logic.mjs
- package.json
- tests/e2e/localization-qa.mjs
- tests/e2e/pwa-offline-qa.mjs
- tests/e2e/run-all.mjs
- docs/reports/FOLDWINK_CONTENT_LOGIC_AUDIT.md
- docs/TODO.md

## Tests Run

- npm run typecheck - PASS
- npm run lint - PASS
- npm test - PASS, 23 files / 174 tests
- npm run build - PASS; audio pack 9 cues / 278796 bytes
- npm run test:e2e - PASS, 45 browser scenarios
- Russian-language E2E - PASS: the switch waits for the RU pool, then starts
  a board whose title and cards contain Cyrillic content
- npm run audit:logic - PASS; EN=500, RU=505, DE=500 scanned

## Manual QA Notes

- Russian pool files were checked at the byte level and are valid UTF-8.
- The direct web/PWA flow no longer exposes an English board after the player
  intentionally chooses RU.
- The logic audit currently reports 11 narrow review candidates. Its strongest
  signals are nested category labels and adult/young animal pairs; all require
  an editor's decision before content changes.
- Screen-reader semantics have automated DOM coverage, but a real VoiceOver /
  TalkBack pass remains necessary.

## Open Risks

- Content editorial review and any resulting revisions are still in progress.
- The heuristic cannot determine every natural-language ambiguity; it narrows
  the queue and must remain paired with human playtesting.
- Physical iPhone/Android install, browser chrome, native share sheet, and
  safe-area checks remain human-only.
- Capacitor Android shell still requires the user-authorised package download
  and a local Android toolchain.

## Go / No-Go

**GO** for direct web/PWA Russian testing: the selected language and puzzle
content now move together and the browser test proves the invariant.

**NO-GO** for a content-quality release until the prioritised editor review is
completed and confirmed revisions pass content/mobile QA.
