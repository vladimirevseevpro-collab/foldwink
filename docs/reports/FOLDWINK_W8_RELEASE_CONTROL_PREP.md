# Foldwink W8 — Release Control and Toolchain Preparation

Date: 2026-09-19  
Status: **W8 preparation accepted; W7 human gate and W8 release acceptance remain NO-GO**

## Sprint Summary

This preparation slice added a fail-closed machine-readable W8 acceptance
contract and modernized the build/test toolchain without replacing or
republishing the frozen `0.8.4` W7 pilot. It does not claim human balance,
retention, physical-mobile, assistive-technology, rollback or exact-clean-
commit evidence.

The acceptance template represents all 47 operator checklist items. Candidate
mode requires the 46 non-publication gates; production mode also requires the
separate explicit publication-authorization gate. The checker verifies the
recorded Git commit directly, compares the commit package version and the
SHA-256 of `package-lock.json` read from that commit, and requires the artifact
manifest to record a clean source tree. It does
not incorrectly require the later evidence-authoring worktree itself to remain
at the candidate commit.

A passed gate must reference its own `foldwink-release-evidence-v1`
attestation inside the release-specific directory with an exact SHA-256. The
attestation binds release, gate, owner and time, contains a summary and points
to at least one separately hashed attachment. Each gate owns a separate
`<release-id>/<gate-id>/` directory; shared generic files cannot satisfy two
gates. The checker rejects missing, outside-directory, symlinked, modified or
semantically misbound evidence.

The checker also validates HTTPS staging identity, verifies that the recorded
branch exists locally and contains the commit, re-hashes the candidate ZIP and
compares every archive path, byte count and SHA-256 with the manifest dist
entries. It requires `index.html`, rejects unsafe/duplicate paths and
recomputes the dist tree. A renamed non-ZIP or a self-consistent forged manifest
therefore cannot reach GO.

The dev toolchain moved to exact Vite `8.3.0`, `@vitejs/plugin-react` `6.1.1`,
Vitest `5.0.1`, PostCSS `8.5.28` and Anthropic SDK `0.126.0`. `npm audit fix`
updated compatible transitive packages. Full-tree advisories fell from 17
(including one critical and five high) to four (one low and three moderate),
with no critical or high advisories. Production remains at zero known
vulnerabilities.

## Changed Files

- `scripts/check-release-acceptance.mjs` — 47-gate candidate/production
  verifier with exact Git/lock/archive/evidence identity and path-boundary
  enforcement.
- `docs/release-evidence/W8_RELEASE_ACCEPTANCE.template.json` — canonical
  evidence record template.
- `tests/e2e/w8-release-acceptance-qa.mjs` — schema completeness, missing
  rollback, pending human/mobile, forged ZIP binding, nonexistent branch,
  tampered/misbound evidence, non-circular candidate GO and separate
  production-authorization regressions.
- `scripts/build-pilot-artifact-manifest.mjs` — records both working-file and
  commit-sourced package-lock SHA-256 for a future clean candidate and verifies every
  ZIP entry against `dist` before writing a manifest.
- `scripts/verify-exact-commit-build.mjs` — reconstructs the recorded commit in
  a temporary detached worktree, runs pinned `npm ci`, build and deterministic
  pack, compares every dist entry and ZIP hash, writes a receipt/log and removes
  the worktree.
- `scripts/pack-itch.mjs`, `scripts/pack-itch.test.mjs` — normalize and sort
  every archive path, reject non-regular inputs, create the output exclusively,
  and prove byte-identical ZIPs for equivalent trees created in different
  filesystem order.
- `scripts/release-path-safety.mjs`, `scripts/release-path-safety.test.mjs` —
  create receipt parents one component at a time, reject junction/symlink
  traversal and refuse overwrite of any existing receipt or log.
- `tests/e2e/r4-retention-qa.mjs` — resolves the active board by stable
  `puzzleId`, eliminating duplicate-title solution drift in the 1,000-board
  pool.
- `tests/e2e/run-all.mjs` — waits for readiness from the preview process it
  owns, so an occupied port cannot silently make the suite test a stale server.
- `vite.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json` — Vite
  8/Vitest 5 compatibility and pinned toolchain; `.node-version` pins Node
  `24.14.1` and package metadata pins npm `11.11.0`.
- `.github/workflows/ci.yml`, `.github/workflows/deploy.yml` — use the pinned
  runtime; CI records and uploads a capture-only exact-commit rebuild artifact.
- Release checklist, TODO, limitations and W7 evidence references — current
  gate accounting.

## Tests Run

- `npm run lint -- --quiet` — pass.
- `npm run typecheck` — pass after using `vitest/config`, explicit `.ts`
  config import and `allowImportingTsExtensions`.
- `npm test` — 57 files / 367 tests pass on Vitest 5.
- `npm run validate`, `validate:ru`, `validate:de` — 1,000 records per
  language pass using the upgraded `tsx` path.
- `npm run build` — Vite 8 production build passes; generated service worker
  contains 31 exact assets.
- `npm run build:budget` on the Vite 8 diagnostic build — 154,126 bytes
  initial JS+puzzle gzip and 19,012
  bytes CSS gzip, both below the 256,000 / 25,600 limits.
- `npm run test:e2e:diagnostic` on the Vite 8 diagnostic build — all 74
  production-browser scenarios and the three applicable operations suites
  pass. Diagnostic mode explicitly omits only the frozen W7 identity suite,
  because that suite must reject any newly generated non-pilot `dist`.
- R4 retention suite — 4/4, repeated three consecutive times after the stable
  `puzzleId` repair.
- W8 acceptance QA — candidate GO, production GO, missing rollback,
  human/mobile pending, forged ZIP/dist binding, nonexistent branch,
  capture-only receipt rejection, tampered rebuild log, tampered/misbound
  evidence and missing publication authorization paths all pass.
- Pilot manifest builder re-read the frozen `0.8.4` archive and matched all 137
  paths, byte counts and SHA-256 values to `dist`; artifact and tree hashes
  remained unchanged.
- Final post-hardening `npm run test:e2e` after restoring the frozen `0.8.4`
  tree — 74/74 browser scenarios and 4/4 pilot/release operations suites pass.
  The pilot contract confirms build `#1984826`, ZIP SHA-256
  `b9e5dde25558e27dc9f846f28e8ad4b9dbb0d134136e2efa2bb8c9d7cf7fc645`
  and dist-tree SHA-256
  `b41e3ce52dd56f28e96719a6e4872bc7701e6305cbfe270a5e8f02bdd64eb385`.
  An explicit occupied-
  port check also proves the runner exits before executing scenarios against a
  server it did not start.
- Two independent detached-worktree rebuilds of commit
  `e53ec332df81bc01b5159375ddd7b21a04487e0c` both produced dist tree
  `7f4304b096d8eb177f9bd4153230eb8c09d8695528e8d627293bfed8dc848eea`
  and deterministic ZIP
  `92645f6a94b3920b7d4e572d724dd79655841d83ce747d6d76b83bf152e217dc`;
  both temporary worktrees were removed. This deliberately reconstructs the
  old committed `0.8.2` and therefore does not legitimize the dirty-source
  `0.8.4` pilot.
- Frozen `0.8.4` ZIP SHA-256 was rechecked, its 137-file tree restored to
  local `dist`, and `npm run pilot:check-contract` plus
  `npm run release:preflight` pass again.
- A post-remediation detached capture of `e53ec332df81bc01b5159375ddd7b21a04487e0c`
  again produced dist tree `7f4304b096d8eb177f9bd4153230eb8c09d8695528e8d627293bfed8dc848eea`
  and ZIP `92645f6a94b3920b7d4e572d724dd79655841d83ce747d6d76b83bf152e217dc`;
  its receipt recorded `capture-only`, `temporaryWorktreeRemoved=true`, and no
  registered or temporary worktree remained afterward.
- `npm run format:check`, final lint, typecheck and 57-file / 367-test unit
  regression all pass after the runtime/lockfile changes.
- `npm audit --omit=dev` — zero production vulnerabilities.

## Manual QA Notes

No product UI or runtime behavior was intentionally changed in this slice, and
the upgraded build is not a release candidate. The existing public pilot and
its previously inspected screenshots remain tied to exact build `#1984826`.
A future clean candidate built with Vite 8 must receive the complete visual
matrix and physical-device acceptance again; source compatibility tests do not
transfer visual acceptance to a new artifact.

## Open Risks

- Full dev audit retains four build-only advisories:
  - low: `tsx` pins `esbuild 0.27.7`; the advisory concerns a locally running
    Windows development server and untrusted paths. Foldwink uses `tsx` for
    trusted repository scripts, not a public server;
  - moderate: Capacitor CLI `8.5.2` pulls `xcode 3.0.1` and `uuid 7.0.3`.
    These are not shipped in the static web build and the xcode path cannot run
    on this Windows host. npm's offered fix is a CLI downgrade to `8.4.3`, so
    it is not applied without an exact macOS/iOS compatibility run.
- W7 still lacks real participants, closed D1/D7 windows and exact-build
  physical iOS/Android evidence.
- W8 still lacks a clean candidate commit, current canonical deployment,
  staging rollback/restore drill, physical/mobile/accessibility/audio/share
  acceptance and production authorization.
- Exact-commit rebuild verification is now implemented and mandatory in the W8
  acceptance contract. The remaining risk is evidence absence: no clean
  `0.8.4+` candidate has yet been selected and rebuilt, so the current W7 pilot
  still cannot pass BLD-01 provenance.
- Evidence integrity is machine-checked, but the factual meaning of screenshots,
  device logs and human test reports still requires operator/reviewer judgment.

An independent release-manager review found two P1 defects: unsorted archive
input and verifier receipt/log symlink traversal. Both are remediated, covered
by regression tests and accepted by the follow-up review; no P0/P1 remains in
the exact-rebuild path. The follow-up's residual P2 note about recursive ZIP
parent creation was also closed by routing the packer's output through the same
component-by-component path-safety helper.

## Go / No-Go

**GO** to retain the upgraded source toolchain and the W8 release-control
contract. **NO-GO** for W8 completion, commercial acceptance or production
publication. The next candidate must be built from a clean commit and repeat
all gates; W7 human evidence remains the earlier mandatory wave gate.
