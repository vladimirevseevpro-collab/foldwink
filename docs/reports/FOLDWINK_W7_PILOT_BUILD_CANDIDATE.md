# Foldwink W7 Pilot Build Candidate

Updated: 2026-09-16 12:04 Europe/Berlin  
Purpose: exact FW-033 staging candidate and human-pilot freeze record  
Status: **browser-staged immutable pilot artifact — participant 001 still waits for physical iOS/Android smoke and the real roster**

## Artifact identity

- Artifact: `itch.io/export/foldwink-itch-upload-v0.8.4-2026-09-16.zip`
- SHA-256: `B9E5DDE25558E27DC9F846F28E8AD4B9DBB0D134136E2EFA2BB8C9D7CF7FC645`
- Size: 2,359,604 bytes
- ZIP entries: 137; paths are relative and include `index.html` plus the generated runtime content and service worker.
- Per-file manifest: `docs/reports/assets/FOLDWINK_W7_PILOT_BUILD_CANDIDATE_V084.manifest.json`
- Dist files / bytes: 137 / 5,382,077
- Canonical dist tree SHA-256: `b41e3ce52dd56f28e96719a6e4872bc7701e6305cbfe270a5e8f02bdd64eb385`
- Build runtime: Node `v24.14.1`, npm `11.11.0`
- App version: `0.8.4`
- Content version: `catalog-2026-09-v1`
- Daily schedule: `daily-2026-09-14-2026-10-13-v1`
- Event schema: `ops-06-v1`
- Privacy policy: `privacy-v1`
- Balance policy: `balance-2026-09-v1`
- Languages: EN, RU, DE

## Source identity and limitation

- Git base commit: `e53ec332df81bc01b5159375ddd7b21a04487e0c`
- Branch: `main`
- Worktree at build time: **dirty**, containing the integrated W0–W7 development state and unrelated historical/user-owned changes.

The ZIP checksum is the exact runnable identity for this candidate. The base commit alone cannot reproduce it, so it must not be presented as a commit-frozen release.

**W7 freeze decision:** accept the exact ZIP, per-file manifest, dist-tree hash and two independently fetched matching itch channels as the immutable pilot identity. The dirty-source limitation is retained explicitly and clean source provenance remains a W8 release gate; it does not block participant 001 once physical mobile smoke passes.

**Supersession record:** immutable candidate `0.8.3` / build `#1981655` remains preserved as historical evidence but is not participant-ready. Before participant 001, the staged bundle was proven to emit research app version `0.8.2` while the artifact was labelled `0.8.3`. Version `0.8.4` fixes the source of truth, adds unit/local-E2E/live-staging parity checks and starts a separate clean pilot identity; no human records need migration because recruitment had not started.

## Verified local evidence

- lint and typecheck pass;
- 55 files / 362 unit tests pass;
- 74/74 production-browser E2E scenarios plus 4/4 pilot/release-operations suites pass, including the verified 1,000-board per-language menu count, a negative frozen-identity test and fail-closed coverage for the complete 47-gate W8 acceptance schema;
- EN/RU/DE structural validation passes for 1,000 puzzles per language;
- content/notices/audio/build-budget gates pass;
- production dependency audit reports zero known vulnerabilities;
- six FW-032 screenshots and the affected W6 reliability screens were rendered and inspected at 1440×900, 1024×768 and 390×844.

## Staging verification and remaining external evidence

- The exact ZIP was pushed on 2026-09-16 to itch.io channel `neural-void/foldwink:pilot-2026-09` as upload `#19242763`, processed build `#1984826`, version `0.8.4`.
- A clean authenticated `butler fetch` matches the frozen dist: 137 files, 5,382,077 bytes and tree SHA-256 `b41e3ce52dd56f28e96719a6e4872bc7701e6305cbfe270a5e8f02bdd64eb385`. Evidence: `docs/reports/assets/FOLDWINK_W7_ITCH_CHANNEL_VERIFICATION_V084.json`.
- The legacy downloadable channel `html` was updated to the identical artifact as upload `#17237271`, build `#1984827`, version `0.8.4`; its independent fetch matches the same 137-file tree. Evidence: `docs/reports/assets/FOLDWINK_W7_ITCH_DOWNLOAD_CHANNEL_VERIFICATION_V084.json`.
- The browser-playable flag is active. Public **Run game** serves `https://html.itch.zone/html/19242763-1984826/index.html`.
- External Playwright smoke passed at 1440×900 EN, 1024×768 DE and 390×844 RU: HTTP 200, localized menu, verified 1,000-board language count, Daily start, exact 16-card board, one correct group and zero page/console errors. The live consent-safe export was downloaded in every locale and reported exact app `0.8.4` plus content `catalog-2026-09-v1`. Fifteen public-listing/menu/game screenshots were inspected without horizontal overflow, overlap or unintended clipping. Evidence: `docs/reports/assets/FOLDWINK_W7_ITCH_STAGING_VERIFICATION.json`.
- Public itch copy now states 3,000 puzzles and the consent-only privacy/export contract. The editor's AI disclosure is **Yes** for Graphics, Text & Dialog and Code.
- The direct canonical route `https://neural-void.com/foldwink/` remains an older deployment; itch.io is the verified W7 pilot staging surface, not proof that the direct route is current.
- a real Windows 11 Chrome `152.0.7977.84` public-iframe smoke was repeated on exact `0.8.4/#1984826`: RU Daily correct group, two-step quit, EN/DE/RU menu localization and zero console errors;
- no real iOS Safari/PWA or Android Chrome/PWA run has been recorded; ADB is not installed/on PATH and no Android device is available through this host;
- no participant has consented or completed a session;
- D1/D7 windows have not started;
- public monetization configuration is intentionally not activated or tested here.

## Freeze checklist before participant 001

1. Run physical iOS Safari/PWA and Android Chrome/PWA smoke against build `#1984826`.
2. Record those devices alongside the completed exact-build Windows Chrome coverage.
3. Lock product, rules, copy, manifests and balance policy for the baseline cohort.
4. Use the exact invite marker `utm_medium=research_invite` only for researcher-invited visits.
5. Start the external consented roster; never place participant codes in Foldwink storage or export.

Until those steps are complete, FW-033 and W7 remain NO-GO.

## Release tooling hardening

- `scripts/release-butler.mjs` no longer invokes `npm` or `butler` through a shell; target/channel arguments cannot be reinterpreted as shell syntax.
- Channel names are restricted to the safe 1–64 character itch channel alphabet.
- `scripts/verify-butler-channel.mjs` downloads a channel into an isolated temporary directory, compares file count, byte count and tree SHA-256 against the frozen manifest, writes durable evidence, and removes only its validated temporary directory.
- `node --check`, malformed-target/channel negative checks, Prettier and the full ESLint gate pass for the hardened tooling.
