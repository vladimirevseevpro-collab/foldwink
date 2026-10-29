# Foldwink 0.8.5 W7 Pilot Evidence

Evidence cut: 2026-10-29
Decision: **W7 pilot build frozen and served on the web; W8/commercial release NO-GO**

This build replaces `0.8.4` before participant 001. `0.8.4` was frozen on
2026-09-16, before the October content cleanup removed or replaced boards that
duplicated another board's groups; a cohort on it would test content the game no
longer ships. No participant records exist for `0.8.4`, so nothing is split.

The pilot is no longer served from itch.io. Per the 2026-07-24 market decision
(direct web/PWA is the product; itch is at most a discovery surface) the frozen
tree is committed to the repository and served by the GitHub Pages deploy beside
the moving main app.

## Source and artifact identity

- Source commit: `c874de79d9e75c4011295a325216594ac2cdda14` on `main`, clean
  worktree (the freeze script refuses a dirty one).
- App: `0.8.5`; Node `24.14.1`; npm `11.11.0`.
- Frozen tree: `pilot/0.8.5/` — 146 files, 5,477,890 bytes.
- Tree SHA-256 (sorted `<sha256>  <path>` lines, code-unit path order):
  `d91e97fe42d65532cb9a067bc6f851f2e9f1ef19db0b8810ade61f5850a47567`.
- Manifest: `pilot/0.8.5.manifest.json`.
- Clean rebuild: `npm run release:verify-rebuild -- --capture c874de7…` in a
  detached worktree with `npm ci` reproduced all 146 files byte for byte
  (`exact-commit-rebuild-c874de79d9e7.json` in this folder; that receipt orders
  paths with `localeCompare`, so its tree hash reads `1370d295…` for the same
  files).

## Served identity

- Pilot URL: `https://vladimirevseevpro-collab.github.io/foldwink/pilot/0.8.5/`
- Invited first-entry URL: the same with `?utm_medium=research_invite`.
- Channel token in operator records: `pages:pilot-0.8.5`.
- Deployment: DEPLOY_PENDING.
- Live file-by-file verification: DEPLOY_VERIFY_PENDING.
- Browser evidence: STAGING_PENDING.

Every Pages deploy guards this identity (`scripts/stage-web-pilots.mjs`):

- the tree must match its manifest byte for byte;
- once committed, a pilot's tree and manifest may never change or be deleted
  (checked against full git history); a changed build needs a new version;
- after the deploy, the `verify-pilots` job fetches every live file and fails
  the workflow on any mismatch.

## Version tuple

- content: `catalog-2026-09-v1` (label unchanged; the October cleanup kept the
  label, so the tree hash, not the label, identifies the content);
- Daily: `daily-2026-10-14-2026-12-12-v1` + `daily-2026-12-13-2027-02-10-v1`;
  the frozen build has **no Daily after 2027-02-10**, so every D7 window must
  close by then;
- event schema: `ops-06-v1`; privacy: `privacy-v1`; balance:
  `balance-2026-09-v1`.

## Same-origin constraints for the cohort

The pilot shares the `vladimirevseevpro-collab.github.io` origin with the main
app, as the itch pilot shared `html.itch.zone` with the public itch build:

- each build registers its own service worker scoped to its own folder; the
  staging run proves the pilot is controlled by `…/pilot/0.8.5/`;
- `localStorage` and IndexedDB are shared. While a cohort is open, main must not
  ship a persistence schema or storage-migration change, or a participant who
  also opens the main app could leave data the frozen pilot cannot read;
- the PWA manifest id is `/foldwink` in both builds, so a browser treats an
  installed pilot and an installed main app from this origin as the same app.
  The github.io main app is an unadvertised mirror (the public URL is
  neural-void.com), so this only matters on a device that already installed
  Foldwink from github.io; such a participant uses the browser tab;
- participants are invited to the pilot URL only.

## Open mandatory gates

- deploy, live verification and three-viewport browser evidence (above);
- physical iOS Safari/PWA and Android Chrome/PWA smoke on the exact pilot URL;
- 20–30 real observed first sessions with EN/RU/DE denominators;
- full D1/D7 local-day windows, closed before 2027-02-10;
- everything listed as open for W8 in `../0.8.4-w7-pilot/README.md` that is not
  about the superseded itch build.
