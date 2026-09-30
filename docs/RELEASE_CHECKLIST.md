# Foldwink Release Acceptance Checklist

This checklist is the W8 operator gate. Every checked item needs a command,
artifact, screenshot, device or staging record under
`docs/release-evidence/<release-id>/`. A green local build alone is not release
acceptance.

Copy `docs/release-evidence/W8_RELEASE_ACCEPTANCE.template.json` into that
release directory and attach evidence to every matching gate. Run
`npm run release:check -- <record.json>` for release-candidate acceptance and
`npm run release:check:production -- <record.json>` only after explicit
publication authorization. Both commands fail closed on missing, pending,
deferred, identity-mismatched or dirty-worktree evidence.

Every passed gate uses local immutable evidence references, not unchecked prose
or URLs: `{"path":"docs/release-evidence/<release-id>/<gate-id>/attestation.json","sha256":"..."}`.
Each attestation must use schema `foldwink-release-evidence-v1`, bind itself to
the release ID, gate ID, owner and verification time, state a non-empty summary
and reference at least one separately hashed attachment in the same gate
directory. The checker rejects shared/out-of-gate files, symlinks/path escapes
and recomputes every attestation and attachment SHA-256.

The candidate manifest and acceptance record also live directly in that
release directory. The manifest must point to a real ZIP with `index.html`,
prove an empty source status, match an existing local Git branch containing the
recorded commit and its lock blob, and match the ZIP path/byte/SHA-256 tuple for
every dist entry. A self-consistent manifest cannot substitute for the actual
archive bytes.

BLD-01 additionally requires `candidate.exactCommitRebuild`, produced with
`npm run release:verify-rebuild -- <record>`. The receipt and log must live in
the BLD-01 evidence directory. The checker binds their hashes to the release,
commit, branch, lock, pinned Node/npm runtime, dist tree and deterministic ZIP;
capture-only receipts cannot satisfy acceptance.

## Exact identity

- [ ] Clean commit SHA, branch and dependency lock recorded.
- [ ] Built artifact and dist-tree SHA-256 recorded.
- [ ] App/content/Daily/event/privacy/balance/schema versions recorded.
- [ ] Staging URL, base path, host build/channel ID and deployment time recorded.
- [ ] Remotely fetched staging bytes match the frozen artifact.

## Exact-commit gates

- [ ] `npm ci` succeeds from the recorded commit and an isolated CI/rebuild
      reproduces the recorded dist tree (and deterministic ZIP where used).
- [ ] Typecheck, lint and all 367+ unit tests pass.
- [ ] EN/RU/DE validators pass for the exact 1,000-board pools.
- [ ] Content, notices, audio, build and budget checks pass.
- [ ] All production E2E scenarios pass.
- [ ] Production dependency audit and free release preflight pass.

## Product scenarios on real staging

- [ ] Fresh onboarding → first board → correct group → win → Result.
- [ ] Incorrect, one-away, repeated quartet, loss and Retry paths.
- [ ] Daily replay does not alter stats/reward.
- [ ] Practice Easy/Medium/Hard lock/recommendation semantics.
- [ ] Tabs reveal and one-shot Medium Wink; no Wink on Easy/Hard.
- [ ] Mid-game reload/resume and terminal-result recovery.
- [ ] Storage denied/quota/conflict recovery is understandable.
- [ ] Share success/cancel/fallback and bounded challenge payload.
- [ ] Backup preview/cancel/merge-or-replace/restore.
- [ ] Offline cold reopen, selected-language content and SW update decision.

## Visual and accessibility acceptance

- [ ] 1440×900 desktop, 1024×768 tablet and 390×844 mobile at 100% zoom.
- [ ] EN, RU and DE represented across the matrix.
- [ ] Menu, Game, solved state, Result, errors, dialogs, Stats and collection.
- [ ] No horizontal overflow, clipping, overlap, broken wrap or unintended gap.
- [ ] Keyboard-only grid/dialog/result flow, focus return and visible focus.
- [ ] Labels, live errors/status, contrast and reduced motion checked.
- [ ] Real screen-reader/assistive-technology walkthrough recorded.

## Physical devices and human gates

- [ ] Windows Chrome on the exact artifact.
- [ ] iOS Safari plus installed PWA: safe areas, audio unlock, share, update.
- [ ] Android Chrome plus installed PWA: safe areas, audio unlock, share, update.
- [ ] Human sound pass on phone speaker and headphones.
- [ ] W7 20–30 participant first-session cohort complete.
- [ ] Confirmed friction/ambiguity fixed and independently retested.
- [ ] Complete D1/D7 windows reported with organic/invited denominators.

## Privacy, monetization and operations

- [ ] Denied/revoked/offline analytics sends and queues nothing forbidden.
- [ ] Voluntary research export is minimized and version-identical to artifact.
- [ ] Tip/supporter/rewarded-ad config matches the intended release channel.
- [ ] No banner/interstitial/autoplay or paid active-puzzle advantage.
- [ ] Third-party notices, privacy text and AI disclosures are current.
- [ ] Synthetic old profile → migration → win → update → compatible rollback →
      resume/result/collection → backup restore passes on staging.
- [ ] Rollback target hash and schema compatibility are recorded.
- [ ] Monitoring, operator owner and rollback decision authority are named.

## Decision

- [ ] Every failed, deferred or unavailable gate is listed with severity/owner.
- [ ] Known limitations, README, release notes and TODO match the artifact.
- [ ] Go/No-Go is written in the final W8 sprint report.
- [ ] Production publication has separate explicit authorization.
