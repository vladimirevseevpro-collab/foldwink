# ADR-001: Current product baseline and dependency policy

- **Status:** Accepted for W0–W8 execution
- **Date:** 2026-09-14
- **Supersedes:** product-scope defaults in the historical MVP bootstrap prompt where they conflict with the current repository
- **Canonical plan:** `docs/FOLDWINK_IMPLEMENTATION_SPEC_2026-09-12.md`

## Context

Foldwink has grown beyond its original English-only MVP. On 2026-09-14 the filesystem contains exactly 1,000 puzzle JSON files in each active language pool: EN, RU and DE (3,000 total). The application also contains Daily, tiered Standard practice, Zen, Palimpsest, archive/history, collection/profile, friend/share links and local-only monetization surfaces.

Several older planning documents still describe a 30- or 500-puzzle English-only product and prohibit every animation dependency. They remain useful historical records but cannot govern the current implementation when they contradict the shipped source tree and the September 2026 implementation specification.

## Decision

1. The supported product languages are EN, RU and DE. A fourth language requires a new product decision and its own content/readiness evidence.
2. The active content inventory is 1,000 files per language. Inventory is not editorial approval: starter and daily manifests require narrower human review.
3. Existing user-facing surfaces are preserved while their rules and hierarchy are corrected. W0/W1 do not remove Daily, Standard tiers, Zen, Palimpsest, archive/history, collection/profile, friend/share links, supporter status or configured local-only monetization surfaces.
4. The architecture remains local-first web/PWA: React 18, TypeScript, Vite, Zustand, pure game logic and local persistence. No backend, account, cloud sync, leaderboard, multiplayer or runtime puzzle generation is introduced.
5. Unlock-dependent Daily selection and silent EN Hard fallback for missing native RU/DE Hard are known defects scheduled for W2. W1 may preserve their current UI behavior only where needed to isolate the persistence migration; it must not describe them as correct product behavior.
6. W1 adds no package. Existing dependencies are retained; no broad React/Vite/TypeScript upgrade is bundled with integrity work.
7. DOM/CSS remains the default motion approach. Motion for React is not approved now. It requires a later W4 spike, CSS comparison, bundle evidence, removal of competing manual motion code and a separate accepted ADR.
8. Radix Dialog, Vite PWA/Workbox and a standard QR generator remain scoped candidates for their respective later waves. Rive remains optional/deferred. None is installed during W1.
9. No analytics/ad SDK, general UI framework, routing layer, game engine or storage/sync framework is added by implication.

## Consequences

- The active execution sequence is W0–W8 in the September specification, not the original MVP phase order.
- Historical reports are not rewritten to look current. Their stale invariants are explicitly labelled when surfaced in active indexes.
- W1 focuses on attempt identity, idempotent finalization, migration and persistence integrity. It does not redesign the collection, menu or content progression.
- W2 owns versioned Daily identity, starter manifests, calibrated progression and removal of silent language fallback.
- Every later dependency is accepted independently with version, compatibility, license, bundle, fallback and removal evidence.

## Rejected alternatives

- Rolling the repository back to the old English-only MVP.
- Treating the existence of 3,000 files as proof that all 3,000 boards are fair or release-ready.
- Installing the full proposed library list before the relevant product slice exists.
- Adding a backend to make local rewards authoritative.

