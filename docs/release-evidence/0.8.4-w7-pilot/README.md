# Foldwink 0.8.4 W7 Pilot Evidence

Evidence cut: 2026-09-16 12:04 Europe/Berlin  
Decision: **W7 instrumented pilot artifact accepted; W8/commercial release NO-GO**

This record identifies the exact external pilot build. It is deliberately not a
W8 release acceptance record: human balance/return evidence, exact-build
physical devices, clean source provenance and the staging rollback drill remain
open.

## Source and artifact identity

- Branch/base commit: `main` / `e53ec332df81bc01b5159375ddd7b21a04487e0c`.
- Worktree: dirty; the base commit alone does not reproduce this build.
- App: `0.8.4`.
- ZIP: `itch.io/export/foldwink-itch-upload-v0.8.4-2026-09-16.zip`.
- ZIP bytes/SHA-256: 2,359,604 / `b9e5dde25558e27dc9f846f28e8ad4b9dbb0d134136e2efa2bb8c9d7cf7fc645`.
- Dist files/bytes/tree SHA-256: 137 / 5,382,077 / `b41e3ce52dd56f28e96719a6e4872bc7701e6305cbfe270a5e8f02bdd64eb385`.
- Manifest: `docs/reports/assets/FOLDWINK_W7_PILOT_BUILD_CANDIDATE_V084.manifest.json`.

The previous immutable `0.8.3` artifact is historical only. Before participant
001, its runtime research export was proven to report app `0.8.2`; it is not an
allowed source for the `0.8.4` cohort.

## External staging identity

- Listing: `https://neural-void.itch.io/foldwink`.
- Playable: `https://html.itch.zone/html/19242763-1984826/index.html`.
- Pilot channel: upload `#19242763`, build `#1984826`, version `0.8.4`.
- Download channel: upload `#17237271`, build `#1984827`, version `0.8.4`.
- Both independently fetched channel trees match the frozen 137-file manifest:
  - `docs/reports/assets/FOLDWINK_W7_ITCH_CHANNEL_VERIFICATION_V084.json`;
  - `docs/reports/assets/FOLDWINK_W7_ITCH_DOWNLOAD_CHANNEL_VERIFICATION_V084.json`.
- Browser evidence: `docs/reports/assets/FOLDWINK_W7_ITCH_STAGING_VERIFICATION.json`.

The direct canonical URL is not equivalent to this artifact and is not accepted
as W8 staging.

## Version tuple

- content: `catalog-2026-09-v1`;
- Daily: `daily-2026-09-14-2026-10-13-v1`;
- event schema: `ops-06-v1`;
- privacy: `privacy-v1`;
- balance: `balance-2026-09-v1`;
- IndexedDB aggregate: `2`;
- portable profile backup: `1`.

## Automated gates

All commands below passed on the `0.8.4` moving worktree before packaging:

- `npm run lint -- --quiet`;
- `npm run typecheck`;
- `npm test` — 55 files / 362 tests;
- `npm run validate`, `validate:ru`, `validate:de` — 1,000 records per language;
- `npm run audio:check`, `content:check`, `notices:check`;
- `npm run build`, `build:budget`, `release:preflight`;
- `npm run test:e2e` — 74/74 production-browser scenarios plus 4/4 pilot/release-operations suites;
- `npm run pilot:check-contract` — exact ZIP/dist, package/runtime analytics, public staging, both fetched channels and operator tooling agree on the frozen `0.8.4` identity; the negative regression test proves version drift exits non-zero;
- `npm run release:check` is intentionally NO-GO until a release-specific copy of the 47-gate W8 acceptance record has exact clean-commit, human, device, accessibility and rollback evidence. Production mode separately requires publication authorization;
- operator export/observation suites and offline form acceptance.

`npm run pilot:verify-staging` passed against build `#1984826` for EN desktop
1440×900, DE tablet 1024×768 and RU mobile 390×844. Each run received HTTP
200, downloaded a research export reporting exact app `0.8.4` and content
`catalog-2026-09-v1`, started the reviewed Daily, solved one group and produced
zero page/console errors.

## Visual evidence

Public listing, menu/footer and solved-board captures are under
`reports/w7-balance-retention-2026-09-14/itch-staging/`. All 15 were rendered at
100% zoom; the three solved-board captures were manually reinspected after the
`0.8.4` deployment. No horizontal overflow, overlap, clipped control/text or
broken hierarchy was observed.

The offline researcher form was regenerated and reinspected at the same three
required viewports under `reports/w7-balance-retention-2026-09-14/operator-form/`.

## Privacy, monetization and dependencies

- Research export is voluntary, coarse and locally downloaded; live staging
  version parity is now enforced.
- External analytics remains off unless explicitly configured and consented.
- Tip/supporter URLs and rewarded ads are inactive; free gameplay is not gated.
- Production dependency notices are generated; production audit has no known
  vulnerability in the recorded W7 gate.
- The full development dependency audit reports 17 advisories (2 low, 9
  moderate, 5 high, 1 critical). The critical item requires a listening Vitest
  UI server, which this project neither installs nor runs, so it is not shipped
  in the static pilot. Toolchain upgrade or explicit residual-risk acceptance,
  followed by clean-build revalidation, remains a W8 gate.

## Rollback and recovery

- Rollback procedure is documented in `docs/DEPLOY.md`.
- Backup/import, migration, reward idempotency, offline and service-worker
  update paths have automated coverage.
- The required real staging sequence — old profile → migration → win → update →
  compatible rollback → resume/result/collection → backup restore — has not
  been performed. There is no accepted W8 rollback artifact yet.
- Rolling back to `0.8.3` would also pause and version-split the research cohort
  because its export identity is wrong.

## Open mandatory gates

- 20–30 real observed first sessions with EN/RU/DE denominators;
- confirmed-friction fixes and independent retest if the pilot finds issues;
- full D1/D7 local-day windows with organic/invited split;
- physical iOS Safari/PWA and Android Chrome/PWA on exact `#1984826`; Windows Chrome `152.0.7977.84` already passes RU correct-group, two-step quit and EN/DE/RU localization with zero console errors;
- screen-reader/assistive-technology, audio and native-share human passes;
- clean exact source commit and reproducible exact-commit gates;
- current canonical direct deployment;
- compatible staging rollback plus backup/restore drill;
- final W8 Go/No-Go and separately authorized production publication.

Until every applicable item is evidenced or explicitly deferred by an accepted
release decision, Foldwink is a W7 pilot candidate, not a commercially accepted
release.
