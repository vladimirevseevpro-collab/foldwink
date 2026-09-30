# Foldwink W5 — Collection, Share and Transfer

Date: 2026-09-14  
Scope: FW-023–FW-027, TEST-28–TEST-32  
Status: implementation and local acceptance complete; real-device QR camera scan remains an external release-evidence item.

## Sprint Summary

- Replaced variable/random collectible rewards with six deterministic archive-page milestones derived from unique solved puzzle IDs. Collection progress is visible in Stats and the Passport without introducing a new currency or a second gameplay mechanic.
- Consolidated Result sharing into one accessible share sheet with result text, a versioned official challenge link, and square/story images. Native-share cancellation no longer cascades into clipboard writes, and a truthful manual fallback is shown when clipboard/download APIs fail.
- Added bounded versioned official-challenge and custom-puzzle payloads. Invalid/unknown links show a safe error and never fall back to a random board. Challenge results are explicitly described as sender-supplied and not server-verified.
- Replaced the home-grown/truncating QR path with `@ribpay/qr-code-generator` (Nayuki implementation, MIT), ECC M, versions 1–10, a 213-byte hard ceiling, typed oversize errors and a four-module quiet zone. `jsqr` is a development-only independent pixel decoder.
- Added versioned full-profile JSON export/import with a 2 MiB ceiling, preview, Merge/Replace safeguards, mandatory legacy-XP baseline choice where required, receipt/consumed-key union, bounded terminal history, atomic pre-import recovery and a privacy-safe portable payload.
- Made the legacy `FWSEAL1` path cosmetic-only. It may atomically import a validated player seed, known title/seal/nib and a union of known stamps. It cannot represent or overwrite XP, level, Ink/Wax, prestige, contracts, stats, Daily history, attempts or the reward ledger.
- Kept valid long legacy seeds import-compatible while making certificate export fail-safe: a seal above the camera-friendly QR ceiling renders an explicit manual-copy certificate and accessible notice instead of throwing.
- Persisted the exact Palimpsest layer/order/selection/solved groups/mistakes in the same IndexedDB aggregate. Completion atomically clears the resumable session and grants the one cosmetic stamp idempotently, without XP or currencies.
- Kept a first unique incorrect quartet selected after charging its mistake, so a player can replace one card instead of rebuilding the whole hypothesis. Re-submitting the unchanged quartet remains non-consuming.
- Kept Zen, Mastery and Palimpsest subordinate to the main Daily/Practice loop; no new twist, backend, account, motion framework or pay-to-win surface was added.

## Changed Files

Principal implementation zones:

- `src/progression/milestones.ts`, `src/screens/StatsScreen.tsx`, `src/components/ArchivistPassportModal.tsx`, `src/screens/ResultScreen.tsx`
- `src/components/ShareSheet.tsx`, `src/components/ShareButton.tsx`, `src/share/shareCard.ts`, `src/share/challengeLink.ts`, `src/components/DuelVerdictBanner.tsx`
- `src/share/urlHashPuzzle.ts`, `src/progression/qr.ts`, `src/progression/waxSealTransfer.ts`
- `src/persistence/profileBackup.ts`, `src/components/ProfileTransferDialog.tsx`
- `src/persistence/gameRepository.ts`, `src/persistence/gamePersistenceCoordinator.ts`, `src/game/state/appStore.ts`, `src/game/state/store.ts`, `src/game/engine/progress.ts`
- `src/components/PalimpsestModal.tsx`, `src/progression/archivistProfile.ts`
- `THIRD_PARTY_NOTICES.md`, `assets/ASSET_REGISTER.md`, `package.json`, `package-lock.json`
- Unit, E2E and visual acceptance fixtures under `src/**/__tests__/`, `tests/e2e/` and `tests/visual/`.

The focused FW-026 UI implementation history is retained in `docs/reports/FOLDWINK_W5_PROFILE_TRANSFER_UI.md`; this report is the consolidated W5 acceptance record.

## Tests Run

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm test` — 49 files, 339 tests, all pass.
- `npm run validate` — 1,000 EN puzzles validated; 1,903 advisory editorial signals remain non-blocking and are not treated as human approval.
- `npm run build` — pass; 9 sound cues checked, 1,507,596 bytes. The build still reports oversized app/locale chunks; this is the explicit FW-028 input for W6.
- `node tests/e2e/run-all.mjs` — 71/71 production-preview scenarios pass, including six W5 scenarios.
- `node tests/visual/w5-visual-acceptance.mjs` — 9/9 scenarios pass and produced 15 screenshots.
- `npm audit --omit=dev --json` — zero production dependency vulnerabilities. The full development tree still reports inherited audit findings and must be resolved or dispositioned during FW-031/W8; no forced upgrade was applied.

Critical W5 browser evidence includes:

- unknown challenge version → visible safe error and no random game;
- exact catalog reference challenge → sender result labelled not server-verified;
- native Share `AbortError` → no clipboard side effect;
- JSON backup → preview, atomic commit and pre-import recovery slot;
- deliberately checksummed legacy seal containing 999,999,999 XP and large currencies → economic/reward fields unchanged after reload while safe passport details persist;
- valid 128-character legacy seed → safe import, reload and manual-copy certificate fallback without a page error;
- reload after one solved Palimpsest group plus an active selection → exact state restored; final completion → one stamp, no XP/Ink/Wax/prestige change.

## Manual QA Notes

Rendered evidence directory: `reports/w5-collection-share-transfer-2026-09-14/`.

The following surfaces were inspected at 100% zoom in 1440×900, 1024×768 and 390×844:

- the single share sheet;
- profile-transfer top and scrolled commit states;
- Stats collection hierarchy;
- Passport archive-page and early-collection hierarchy.

Inspection found no horizontal overflow, clipped primary actions, modal escape from the viewport, overlap or unreachable scrolled commit control. Share and transfer dialogs return/contain keyboard focus through the shared dialog shell. The mobile profile-transfer panel intentionally scrolls inside the viewport; both its opening context and final commit control were captured separately.

QR matrices were decoded from rendered pixels through an independent decoder at the supported boundary. A physical camera scan on representative iOS/Android devices has not been performed on this machine and is not represented as passed.

## Open Risks

- Real phone-camera QR scanning at small/large certificate sizes is still external evidence.
- The main JavaScript and each locale content chunk are substantially above the 500 kB raw warning threshold. FW-028 must reduce initial delivery and prove a production waterfall without breaking pinned Daily/content identity.
- The old certificate artwork still displays legacy XP/currency as historical decoration, but import copy and the repository mutation explicitly exclude those values. The full JSON backup is the only progress-transfer mechanism.
- Human comprehension, balance and return-rate claims remain unproven until W7 cohorts are actually observed; automated tests are not substitutes.
- Development-only dependency audit findings need evidence-backed disposition; production dependency audit is currently clean.

## Go / No-Go for Next Sprint

**GO for W6 implementation.** W5 local integrity, regression and three-viewport gates pass. Foldwink is not yet release-ready: real-device QR evidence, W6 performance/offline/reliability, W7 human observation and W8 exact-staging acceptance remain open.
