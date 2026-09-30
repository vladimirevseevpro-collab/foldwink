# Foldwink W4 — Tactile Audiovisual Materials

Date: 2026-09-14  
Status: **COMPLETE / GO for W5**

## Sprint Summary

W4 consolidates Foldwink's audiovisual layer into a quieter, bounded Paper Theatre system without adding a runtime dependency:

- the dependency-free CSS motion path is accepted in `ADR-003`; Motion for React and all other animation frameworks remain uninstalled;
- device-orientation/gyro behavior and Grid FLIP were removed, eliminating competing transform ownership and implicit sensor work;
- pointer tilt now converges and stops its `requestAnimationFrame` loop, resets on pointer leave, reduced-motion changes, hidden document and unmount;
- every CSS entrance/feedback animation is one-shot and has an explicit `prefers-reduced-motion` escape, including card deal;
- victory confetti is capped at 900 ms, stops in the background, runs behind semantic content and uses two side launch zones plus a protected title band so it frames rather than obscures the result hierarchy;
- the former procedural audio module and its second audio context were removed; local WAV playback and same-context generated fallback recipes now share one mixer, settings surface and lifecycle;
- `useFeedback` is the only component-level route for paired sound/haptics intent, with committed-event idempotency, rapid-tap rate limiting, background suspension and rejection-safe resume;
- persisted mute creates no AudioContext and fetches no audio assets; gameplay remains fully interactive with sound off;
- a new 3.4 kB warm charcoal paper texture, 12 project-owned inline icons and nine project-owned illustrated stamp treatments strengthen the material identity while preserving live text and accessible names;
- all audiovisual sources and fallbacks are recorded in `assets/ASSET_REGISTER.md`.

No package was added. The W4 bundle delta from dependencies is zero.

## Changed Files

Motion and lifecycle:

- `src/components/Card.tsx`
- `src/components/Grid.tsx`
- `src/components/OrigamiConfetti.tsx`
- `src/components/VictoryConfetti.tsx`
- `src/components/WinkSparkles.tsx`
- `src/components/ResultSummary.tsx`
- `src/styles/index.css`
- `src/styles/motion.ts`
- `docs/decisions/ADR-003-motion-runtime.md`

Feedback and audio:

- `src/audio/sound.ts`
- `src/audio/sound.test.ts`
- `src/audio/proceduralSynth.ts` — removed
- `src/audio/__tests__/proceduralSynth.test.ts` — removed with the obsolete second runtime
- `src/feedback/useFeedback.ts`
- `src/app/App.tsx`
- `src/screens/GameScreen.tsx`
- `src/screens/MenuScreen.tsx`
- `src/screens/ResultScreen.tsx`
- `src/components/ArchivistPassportModal.tsx`
- `src/components/DuelVerdictBanner.tsx`
- `src/components/EnvelopeUnboxingModal.tsx`
- `src/components/IronContractModal.tsx`
- `src/components/PalimpsestModal.tsx`
- `src/components/ThemeSelector.tsx`

Materials and controls:

- `textures/paper-theatre-w4.webp`
- `src/components/FoldwinkIcon.tsx`
- `src/components/StampArtwork.tsx`
- `src/components/SoundToggle.tsx`
- `src/components/HapticsToggle.tsx`
- `src/components/InstallFoldwink.tsx`
- `src/components/ShareButton.tsx`
- `assets/ASSET_REGISTER.md`

Acceptance evidence:

- `tests/e2e/w4-feedback-motion-qa.mjs`
- `tests/e2e/run-all.mjs`
- `tests/visual/w4-audiovisual-qa.mjs`
- `reports/w4-audiovisual-2026-09-14/`

## Tests Run

Final W4 gate on the production bundle:

- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — **318/318 pass**, 46 files. The total is five lower than W3 because the seven obsolete second-runtime synth tests were removed and five consolidated sound-runtime tests now cover the single mixer, including two new lifecycle/idempotency cases.
- `npm run validate` — pass, EN 1,000 puzzles; 1,903 advisory editorial items, no structural failure.
- `npm run validate:ru` — pass, RU 1,000 puzzles; 2,025 advisory items.
- `npm run validate:de` — pass, DE 1,000 puzzles; 1,554 advisory items.
- `npm run audio:check` — pass, 9 cues / 1,507,596 bytes.
- `npm run build` — pass; no new package, Vite's existing large-chunk warning remains assigned to W6.
- `npm run test:e2e` — **65/65 pass** across all 11 production-browser suites, including the five new W4 TEST-34/35 scenarios.
- `npm run release:preflight` — build GO; optional tip/supporter surfaces remain correctly hidden because public provider configuration is not present. Canonical URL warning remains an W8 deployment input.
- `node tests/visual/w4-audiovisual-qa.mjs` — **3/3 required viewport records pass**, 13 current screenshots, zero page/console errors and zero horizontal overflow.

Focused W4 acceptance proves:

- zero pending app `requestAnimationFrame` callbacks after idle pointer settle and pointer leave;
- hidden-tab interruption cancels pending pointer work; reduced motion disables deal/tilt/decorative frames;
- ten rapid Shuffle actions retain 16 cards and no residual frame loop;
- persisted mute creates zero AudioContexts and zero `/audio/` requests while selection continues to work;
- one committed event key produces one cue; active mute zeros the mixer gain; suspend/resume rejection is contained;
- Game-to-Result becomes observable below the 700 ms acceptance ceiling in both normal and reduced-motion profiles;
- the local sound pack still loads all nine cues when sound is enabled.

## Manual QA Notes

Rendered production evidence covers Home, Game, the complete Stamp Album and settled Result at 1440×900, 1024×768 and 390×844, plus an immediate confetti frame at 1440×900. Files and geometry records are in `reports/w4-audiovisual-2026-09-14/visual-evidence.json` and `screenshots/`.

The screenshots were inspected for horizontal overflow, clipping, unintended empty space, localized wrapping, result hierarchy, icon consistency, texture contrast and stamp recognizability. The first render exposed confetti crossing the Win heading; the final render shows two restrained side sprays with the heading and archetype band fully clear. The first full E2E pass also exposed an 11 px ordinary mobile card word introduced by the long-word classifier; the final production render restores 13 px for ordinary tokens while retaining controlled 10–11 px treatment only for genuinely long localized labels. German 390 px controls remain reachable and the stamp gallery remains inside the viewport.

The new paper texture stays deliberately subordinate to the high-contrast cards. The icons have a consistent monoline geometry, retain text/accessibility names, and do not become the only carrier of meaning. The nine stamp illustrations are visibly distinct by silhouette and colour as well as label.

## Open Risks

- Automated Web Audio and Chromium checks do not replace a physical listening pass. Speaker/headphone balance, iOS unlock behavior, Android vibration feel and OS-level reduced-motion must still be verified on real devices before public-release approval.
- The localized puzzle chunks and main bundle remain above the target operational budgets. W6 owns cold/warm waterfall measurement, boot-content strategy and cache/payload reduction.
- Passport/import is visually sampled here, but its full transfer semantics, hostile payload handling, QR bounds and collection flow belong to W5.
- Human puzzle satisfaction, fair difficulty progression and return behavior remain W7 evidence. Audiovisual polish and green automation do not prove commercial retention.
- Optional monetization provider URLs and the canonical deployment URL are intentionally absent; W8 must verify real configured return paths without weakening the free core.

## Go / No-Go for next sprint

**GO for W5 collection, share and transfer.** FW-019 through FW-022 and TEST-34/35 are complete with production-build, lifecycle and inspected visual evidence.

This is not a public-release GO. W5–W8, physical-device audio/share coverage, human balance evidence and staging acceptance remain mandatory.
