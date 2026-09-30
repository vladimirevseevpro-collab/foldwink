# ADR-002: Atomic local persistence for attempts and rewards

- **Status:** Accepted target; delivered incrementally in W1
- **Date:** 2026-09-14
- **Canonical requirements:** ARCH-01 through ARCH-04 in `docs/FOLDWINK_IMPLEMENTATION_SPEC_2026-09-12.md`

## Context

The current application writes stats, progress, Daily history, active session and Archivist rewards through separate localStorage operations. ResultScreen grants profile rewards while rendering. This permits duplicate rewards on remount and split state if the page closes between independent writes. The extension storage adapter also hydrates after the game store has already read defaults.

## Decision

1. Native browser IndexedDB is the target authoritative store for the atomic W1 aggregate: active attempt, terminal result, stats delta, Daily slot, profile delta and reward receipt.
2. The implementation uses a small project-owned repository module over the browser API. W1 adds no IndexedDB wrapper, sync framework, service or backend.
3. localStorage and extension storage remain migration inputs during the compatibility period. They are not silently deleted or treated as a second independently writable authoritative aggregate after successful migration.
4. Start/finalize/import operations use a compare-and-set boundary over profile revision and active attempt identity. Attempt revision protects individual commands. Unique reward keys and Daily slot keys are inserted in the same read-write transaction as the terminal state.
5. The store renders only committed state and receipts. React render/effects may present them but may not create economic or statistical side effects.
6. Existing stats, solved IDs, Daily history, active session, supporter state, settings, earned cosmetics and historical Ink/Wax/prestige are preserved or explicitly migrated. No destructive reset is an acceptable migration strategy.
7. A versioned pre-migration backup and deterministic migration receipts make migration retryable. Invalid core data opens recovery instead of being overwritten by defaults.
8. Browser tabs coordinate with committed revisions. BroadcastChannel is notification only, not the correctness mechanism.
9. If IndexedDB is unavailable, the UI must state that progress cannot be persisted and offer an explicit temporary session. It must not claim success after a failed write.

## Delivery boundary

W1 may land in small verified steps:

1. Pure attempt and reward contracts plus regression tests.
2. ResultScreen becomes read-only and rewards move to terminal finalization.
3. Versioned repository, migration fixtures and bootstrap-before-store.
4. Atomic terminal transaction, cross-tab conflict tests and removal of obsolete independent writers for the migrated aggregate.

An intermediate commit may improve idempotency before the full repository switch, but its report must call out the remaining non-atomic boundary. It cannot be labelled W1-complete until the IndexedDB transaction, migration and failure tests pass.

## Consequences

- The current synchronous Zustand API may keep UI commands synchronous only until the persistence boundary is reached; terminal transition must ultimately await a committed repository result.
- The 600 ms result hold is presentation after commit, not a transaction delay.
- Detailed history can be bounded, but reward markers and self-contained Daily records must remain durable.
- Old open clients require a compatibility/rollback strategy; publishing an older bundle that writes incompatible data is not a safe rollback.

## Rejected alternatives

- Separate localStorage writes described as atomic.
- BroadcastChannel locking without transactional storage.
- A server/account solely to prevent a local user editing their own progress.
- Losing or resetting the profile because legacy fields are incomplete.

