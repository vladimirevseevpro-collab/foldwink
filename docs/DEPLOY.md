# Deploy Foldwink

Foldwink is a static web/PWA. The canonical product is a direct web deployment;
itch.io is an optional discovery channel, not the primary payment path.

Release builds use the exact Node version in `.node-version`, the exact npm
version in `package.json`, and `npm ci`. Do not substitute an unrecorded local
runtime when producing a candidate.

## Free web/PWA deployment

1. Run the local gates:

   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run validate
   npm run validate:ru
   npm run validate:de
   npm run audio:check
   npm run content:check
   npm run notices:check
   npm run build
   npm run build:budget
   npm run test:e2e
   npm run release:preflight
   npm audit --omit=dev
   ```

2. For an exact W8 candidate, build and pack from a clean recorded commit,
   create its artifact manifest and acceptance record, then run an independent
   detached-worktree rebuild:

   ```bash
   npm run release:verify-rebuild -- docs/release-evidence/<release-id>/acceptance.json
   ```

   This runs `npm ci`, build and deterministic pack in a temporary worktree,
   compares every dist entry and the ZIP SHA-256 with the candidate, writes the
   BLD-01 receipt/log, and removes the worktree. Add the receipt SHA-256 to
   `candidate.exactCommitRebuild` and reference the receipt from the BLD-01
   attestation. `npm run release:check -- <record>` rejects missing, modified or
   mismatched rebuild receipts. CI also performs capture-only rebuilds on every
   checked commit and uploads the receipt/log as a workflow artifact.

3. Upload the contents of `dist/` to a static host at the canonical origin.
   The Vite `base: "./"` configuration supports root and subpath hosting.

4. On the deployed URL, complete the human checks in
   [ITCH_QA_CHECKLIST.md](ITCH_QA_CHECKLIST.md): iPhone Safari safe areas,
   Android Chrome, audio unlock, native sharing, PWA installation, and daily
   continuity.

Cloudflare Pages, Netlify, GitHub Pages, object storage/CDNs, and a normal
static web server all work. Use `npm run build` as the build command and
`dist` as the publish directory.

## Optional paid activation

Do not configure payment links until the direct free build is live and works on
real devices.

1. Configure the public `VITE_KOFI_HANDLE` and
   `VITE_SUPPORTER_CHECKOUT_URL` values at the host.
2. Set `FOLDWINK_CANONICAL_URL` locally and run:

   ```bash
   npm run release:preflight:paid
   ```

3. Set the hosted checkout success return to the exact printed URL.
4. Deploy and test the real flow:
   CTA -> hosted checkout -> `?supporter=success` -> cosmetic badge.

The supporter flag is trust-based and cosmetic. Never gate the daily puzzle,
Easy mode, archive, Winks, retries, or any active-puzzle advantage.

## Optional itch.io channel

Build an HTML5 upload archive:

```bash
npm run pack:itch
```

The archive is written to `itch.io/export/`. It uses relative asset URLs and
is covered by browser embed tests. Upload it as an HTML5 game with the embedded
viewport set generously; the app also offers a player-initiated full-size launch
from constrained embeds.

If butler is installed, logged in, and the local `.itch-target` is correct,
publish with:

```bash
npm run release:butler
```

This is a real public push. Confirm the target and channel before running it.
After upload, open the actual itch iframe on phone and desktop; local tests
cannot verify itch's dashboard sizing or cache propagation.

## Rollback and data compatibility

Asset rollback and data rollback are different operations. Never clear browser
storage, overwrite IndexedDB with defaults, or ask players to reinstall as a
normal rollback procedure.

Current compatibility tuple:

- authoritative IndexedDB aggregate schema: `2`;
- portable profile backup schema: `1`;
- content: `catalog-2026-09-v1`;
- Daily schedule: `daily-2026-09-14-2026-10-13-v1`;
- reward receipts: schema `2`, unique-solve keys remain idempotent.

Before promoting an artifact:

1. Freeze its ZIP and dist-tree SHA-256 plus channel/build ID in
   `docs/release-evidence/<release-id>/README.md`.
2. Keep a separately named previous artifact. Do not rebuild a file and call it
   the rollback target.
3. In an isolated staging browser profile, create or import a synthetic old
   profile, export a portable backup, migrate, win one board, reload, and verify
   the result, statistics, collection and reward receipt.
4. Deploy the candidate, resume an active board, complete it, then deploy the
   declared compatible rollback artifact to the same staging channel.
5. Verify resume/result/collection again, import the pre-deploy backup through
   preview + explicit confirmation, and prove that XP and the reward receipt are
   not duplicated.
6. Verify that today's published Daily and its content payload still exist in
   both candidate and rollback artifacts.
7. Record screenshots, commands, browser/device, artifact hashes and every
   failed or deferred check. A local unit test is not a staging rollback drill.

If the previous frontend does not understand aggregate schema `2`, it is not a
valid rollback target. Keep the migration-aware shell or publish a separately
verified compatibility build. A rollback during a research cohort pauses that
cohort; never merge records from different app/build identities.

For itch staging, verify the restored bytes rather than trusting the push log:

```bash
npm run pilot:verify-channel -- <channel> <manifest.json> <verification.json>
npm run pilot:verify-staging
```

Production rollback or canonical-host promotion is a separate operator action.
Confirm the exact target and authorization before pushing it.

## Content-only update

Puzzle content is bundled. For every active-pool change:

1. Run draft/reference validation.
2. Run `npm run validate`, `npm test`, and `npm run build`.
3. Rebuild the deployment artifact.
4. Deploy the new `dist/` or itch archive.
5. Smoke-test the deployed version.

## Release checklist

- [ ] Local gates passed on the exact artifact
- [ ] Detached exact-commit rebuild receipt matches dist and deterministic ZIP
- [ ] Source commit/worktree state and artifact/tree hashes recorded
- [ ] README and release notes match the artifact version and current counts
- [ ] Known limitations reviewed
- [ ] Direct web/PWA URL deployed and device-checked
- [ ] Staging backup/migrate/update/compatible-rollback/restore drill passed
- [ ] Three viewports, EN/RU/DE, keyboard, focus and error states accepted
- [ ] Physical iOS Safari/PWA and Android Chrome/PWA accepted
- [ ] Optional itch archive uploaded and iframe-checked
- [ ] Optional payment return tested before CTAs are enabled
