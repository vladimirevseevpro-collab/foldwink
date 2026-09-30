# Foldwink W2 — Content, Daily and Balance

Date: 2026-09-14  
Status: **COMPLETE / GO for W3**

## Sprint Summary

W2 replaces mutable pool-position assumptions with explicit, versioned content identity and a reviewed release-entry layer:

- runtime catalog contracts now separate puzzle payloads, stable `PuzzleRef` identity, editorial readiness, starter manifests and Daily calendar entries;
- six deliberately ordered starter boards are published for each of EN, RU and DE, with the same editorial band recorded in the starter and editorial manifests;
- each released language has an explicit 30-day calendar from 2026-09-14 through 2026-10-13; the calendar is independent of local unlocks, statistics and random pool order;
- all 90 published Daily boards have ready editorial records and passed automated 390×844 rendering checks; the final EN calendar spans B0–B4, including four independently reviewed Hard candidates;
- an attempt pins language, lineage, content version, rules and the exact puzzle payload; completed W2 Daily records also keep that exact payload, so a later manifest or content edit cannot change a replay;
- item identity/signatures no longer depend on an array position, and repeated item/group references are validated;
- Practice selection is deterministic from player seed plus `selectionSequence`, uses ready editorial content only, tracks seen lineages separately from solved lineages, and applies recent topic/item diversity guards;
- promotion/calm-down thresholds live in one versioned balance configuration with focused tests; they remain pilot hypotheses rather than claimed human-calibrated constants;
- Retry and Another puzzle remain different actions, with lineage exposure and selection sequence advanced only by a new selection;
- RU/DE Hard no longer silently opens English content. Empty local tiers are hidden/disabled, while Daily still opens the exact published same-language entry;
- Medium alone exposes Foldwink Tabs and Wink. Easy and Hard do not display or enable that mechanism;
- Daily outside the currently published horizon is visibly unavailable instead of silently substituting a pool puzzle;
- mobile layout fixes remove the accidental short-viewport desktop compression and keep long German/English labels inside 64px phone cards.

No runtime dependency was added. The balance algorithm and the 90 release entries are structurally ready for integration, but human difficulty calibration remains a W7 gate.

## Changed Files

Catalog, calendar and editorial data:

- `src/puzzles/catalog/types.ts`
- `src/puzzles/catalog/validation.ts`
- `src/puzzles/catalog/loaders.ts`
- `src/puzzles/catalog/registry.ts`
- `src/puzzles/catalog/index.ts`
- `puzzles/manifests/starters.en.json`
- `puzzles/manifests/starters.ru.json`
- `puzzles/manifests/starters.de.json`
- `puzzles/manifests/editorial.en.json`
- `puzzles/manifests/editorial.ru.json`
- `puzzles/manifests/editorial.de.json`
- `puzzles/manifests/daily.en.2026-09-14_2026-10-13.json`
- `puzzles/manifests/daily.ru.2026-09-14_2026-10-13.json`
- `puzzles/manifests/daily.de.2026-09-14_2026-10-13.json`
- `puzzles/pool/puzzle-0165.json`
- `puzzles/ru/pool/ru-0025.json`
- `puzzles/ru-drafts/ru-0025.json`

Game identity, selection and persistence:

- `src/game/types/puzzle.ts`
- `src/game/types/game.ts`
- `src/game/types/stats.ts`
- `src/game/config/balance.ts`
- `src/game/engine/progress.ts`
- `src/game/engine/foldwinkTabs.ts`
- `src/game/state/store.ts`
- `src/game/state/appStore.ts`
- `src/puzzles/byLang.ts`
- `src/puzzles/daily.ts`
- `src/puzzles/progression.ts`
- `src/persistence/gameRepository.ts`
- `src/persistence/gamePersistenceCoordinator.ts`

Presentation and validation:

- `src/components/Card.tsx`
- `src/components/Header.tsx`
- `src/screens/GameScreen.tsx`
- `src/screens/MenuScreen.tsx`
- `src/i18n/strings.ts`
- `src/styles/index.css`
- `scripts/validate-puzzles.ts`
- `tests/visual/w2-content-mobile-qa.mjs`
- associated catalog, engine, store and persistence tests under `src/**/__tests__/` and `src/puzzles/catalog/*.test.ts`
- `reports/w2-content-2026-09-14/`

## Tests Run

Final W2 gate on 2026-09-14:

- `npm run lint` — pass.
- `npm run typecheck` — pass (also run inside the final build).
- `npm test` — **320/320 pass**, 47 files.
- `npm run validate` — pass, EN 1,000 puzzles: 523 easy / 443 medium / 34 hard. The 1,903 reported items are the existing advisory editorial queue, not structural failures.
- `npm run validate:ru` — pass, RU 1,000: 621 easy / 379 medium / 0 hard. The 2,025 reported items are advisory.
- `npm run validate:de` — pass, DE 1,000: 577 easy / 423 medium / 0 hard. The 1,554 reported items are advisory.
- `node tests/visual/w2-content-mobile-qa.mjs` — **90/90 Daily boards pass** at 390×844: 16 cards present, no horizontal/grid overflow, minimum 44px targets, labels within card bounds.
- `npm run build` — pass; 9 sound cues / 1,507,596 bytes; production Vite bundle emitted.

Focused regressions additionally prove:

- a completed Daily replay keeps its original puzzle snapshot after the published calendar points at another puzzle;
- a mismatched Daily snapshot/puzzle ID is rejected as malformed persistence;
- Daily snapshot, attempt identity and calendar identity are written in the same terminal aggregate;
- starter/editorial bands agree and every calendar entry resolves to a ready same-language payload;
- EN calendar band coverage is exactly B0–B4;
- Tabs/Wink availability follows puzzle rules rather than a fallback label heuristic;
- deterministic practice selection records `selectionSequence`, seen lineage and bounded recent topic/item history.

## Manual QA Notes

Actual rendered PNGs were inspected after the automated geometry assertions:

- all 18 starter boards at 390×844;
- EN Hard Daily candidates `hard-010`, `hard-012`, `hard-014` and `hard-015` at 390×844, confirming 16 cards and no Tabs/Wink surface;
- German game `de-0407` at 1440×900, 1024×768 and 390×844;
- unavailable-Daily Menu state at 1440×900, 1024×768 and 390×844.

The short-tablet action remains visible, mobile action/header rows wrap without horizontal overflow, and long single-token labels use the compact mobile type treatment without breaking the 4×4 grid. Evidence is stored in `reports/w2-content-2026-09-14/`, including `mobile-fit.json` and the corresponding screenshots.

Independent content review results used for the last EN Hard entries:

- `hard-010` — pass, 9/10, B3;
- `hard-012` — pass, 9/10, B4;
- `hard-014` — pass, 8/10, B4;
- `hard-015` — pass, 8/10, B4.

The RU and DE 30-day sets were independently checked for language, group uniqueness, ontology and ambiguity. Human play is still required to validate felt difficulty and retention rather than only structural/editorial fairness.

## Open Risks

- **Human balance evidence is not complete.** Promotion thresholds (5 recent first encounters, 4 wins, median mistakes at most 1; calm-down after 2 losses; recommendation cooldown 5) are versioned hypotheses for W7. They must not be described as proven retention tuning.
- `hard-014` and `hard-015` are the highest-priority EN human playtest boards because their independent review scores were lower than the other two Hard candidates.
- RU and DE intentionally have no Hard practice tier. This is honest absence, not missing fallback behavior.
- Legacy pre-W2 Daily records do not contain a puzzle payload and therefore cannot reconstruct historical content after it changes. Every W2+ completion is self-contained.
- Full-pool validators still report a large advisory review queue outside the 90 release entries. Release selection is guarded by ready manifests; the wider archive is not thereby certified as uniformly commercial-grade.
- Vite reports content chunks larger than 500 kB. This does not fail W2, but route/language chunk loading and offline cache cost require W6 measurement and optimization.
- Real-device touch, safe-area and browser-chrome checks remain external evidence. Local Chromium screenshots do not replace them.

## Go / No-Go for next sprint

**GO for W3 core UX slice.** W2's code, manifests, deterministic contracts, persistence identity and required local/mobile gates are complete.

This is not a public-release GO. W7 human balance testing and W8 staging/release acceptance remain mandatory, along with the W3–W6 product work.
