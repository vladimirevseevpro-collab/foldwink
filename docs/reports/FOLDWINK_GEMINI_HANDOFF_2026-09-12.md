# Foldwink — Gemini Handoff Snapshot

**Captured:** 2026-09-12  
**Purpose:** preserve the current local project state for the Codex continuation. This is an evidence snapshot, not approval to retain or expand every feature listed below.

**Follow-up analysis (2026-09-12):** The architecture/balance audit in `reports/architecture-hooks-2026-09-12/AUDIT_RU.md` supersedes the blanket rollback recommendation below. Evaluate existing features by their contribution to the core loop and verified player experience; no feature removal has been authorized or performed. The historical snapshot and original recommendation remain below for traceability.

## Verified Current State

- The latest local commit is `e53ec33` (`2026-09-07`, `chore(format): ignore tests and scripts in prettier`).
- The recent implementation sequence is `0d4a339` through `e53ec33` (2026-09-05 to 2026-09-07).
- Active puzzle pools contain **1,000 boards each**, not the 500 per language stated in the older release documents:
  - EN: 1,000 (523 easy, 443 medium, 34 hard)
  - RU: 1,000 (621 easy, 379 medium, 0 hard)
  - DE: 1,000 (577 easy, 423 medium, 0 hard)
- The worktree also contains uncommitted documentation, E2E, Vite, mobile/iOS, monetization, asset, and TikTok-material changes. They are user-owned and must not be overwritten or discarded without an explicit instruction.

## September Product Delta Present in Source

The current source tree includes these implemented surfaces beyond the earlier minimalist Foldwink baseline:

- four selectable desk themes;
- Archivist Passport, XP, Ink, Wax, collectible stamps, and reward envelopes;
- Iron Contract high-stakes mode;
- shared-link Duel mode;
- Grace Wax / Kintsugi streak protection;
- Palimpsest dual-layer puzzle mode;
- QR passport transfer and wax-seal share assets;
- Zen mode and extended haptics/audio/visual effects.

The implementation evidence is in `src/progression/`, `src/puzzles/palimpsest.ts`, `src/components/`, `src/game/state/store.ts`, and the 2026-09-05/07 commits.

## Documentation Divergence

`README.md`, `docs/TODO.md`, and `docs/PROJECT_KNOWLEDGE.md` still describe the older v0.8.2 / 500-puzzle, minimal-product release track. They do not describe the September source state above.

This is a material product-scope conflict with the active project agreements: they prohibit additional game systems beyond Foldwink Tabs + Wink, casino/FOMO-style retention, and uncontrolled content-pool expansion. No rollback or removal was performed during this handoff.

## Verification Boundary

Older reports record successful checks for the former 500-puzzle product. They are not evidence that the newer September feature set has passed the same release gates. No fresh typecheck, test, validator, build, visual, device, or deployment result is implied by this snapshot.

## Required Product Decision Before Further Feature Work

Choose and document one direction before continuing implementation:

1. **Recommended — restore the approved minimalist Foldwink scope.** Audit and selectively remove or isolate the September systems, return content to the approved curated scope, then rerun the complete release-evidence gate.
2. **Adopt the expanded product.** Revise the product definition, privacy/monetization rules, content plan, accessibility requirements, and release criteria before treating the new systems as supported.

Until then, Codex should preserve the existing worktree and limit itself to evidence gathering, repair, or explicitly approved scope work.
