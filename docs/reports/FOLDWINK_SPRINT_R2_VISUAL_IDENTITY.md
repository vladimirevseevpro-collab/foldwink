# Foldwink Sprint R2 - Tactile Visual Identity

**Date:** 2026-07-22  
**Status:** Complete  
**Direction:** Night Print Studio - cool paper, graphite, proofing turquoise, four stamp colours, and one folded Wink corner.

## Sprint Summary

R2 replaces the generic dark utility presentation with a coherent product identity while preserving the R1 mobile dimensions. The 4x4 board is now a tactile paper object: idle cards sit on a small paper edge, selection lifts the sheet and folds its turquoise corner, and solved groups land as four accessible coloured stamps with shape markers.

The same folded-corner behavior now connects the product name to the UI, Tabs + Wink, brand mark, onboarding, share card, favicon, Open Graph image, and vertical social asset. This produces recognizable output without adding a 3D renderer, a motion dependency, or another gameplay mechanic.

An independent GPT-5.4 critique supported the direct-site-first, no-3D, card-first direction and proposed the reusable folded corner. Warm beige and dark stamp recommendations were deliberately changed to cool paper and light high-contrast stamps.

## Changed Files

### Product UI

- `tailwind.config.js`, `src/styles/index.css`, `src/styles/motion.ts`: centralized Night Print Studio colours, physical edges, short motion, self-hosted font, and low-opacity paper texture.
- `src/components/Card.tsx`, `FoldedCorner.tsx`, `FoldwinkTabs.tsx`, `Button.tsx`, `Grid.tsx`: tactile card, tab, selection, Wink, control, and desktop scale system.
- `src/components/BrandMark.tsx`, `Wordmark.tsx`: folded-corner product mark and two-colour Fold/wink lockup.
- `src/components/Onboarding.tsx`: tutorial demo now reproduces real paper selection, solved stamping, and Wink behavior.
- `src/components/ResultSummary.tsx`, `StatStrip.tsx`, `DailyCompleteCard.tsx`, `DailyArchive.tsx`: unified result and record surfaces.
- `src/screens/MenuScreen.tsx`, `GameScreen.tsx`, `ResultScreen.tsx`, `StatsScreen.tsx`: hierarchy, geometry, share labels, Supporter export state, and responsive surface propagation.

### Share And Brand Assets

- `src/share/shareCard.ts`: full 1080x1080 canvas redesign with real mark, metrics, paper grid, Wink corner, localized labels, and optional Supporter stamp.
- `public/og.png`: production 1200x630 Open Graph image rendered from the actual product language.
- `public/social/foldwink-story.png`: production 1080x1920 social/story frame.
- `public/favicon.svg`, `public/manifest.webmanifest`, `index.html`: new icon, corrected graphite theme colour, canonical direct URL, raster social metadata, and image dimensions.
- `public/textures/graphite-paper.webp`: 1024x1024, 46.4 kB optimized graphite paper texture.
- `tests/visual/*.html`, `tests/visual/*.ts`: deterministic share, Supporter, OG, and story preview harnesses.
- `docs/reports/assets/*-r2.png`: mobile, desktop, result, stats, share, and social visual records.

### Infrastructure

- `package.json`, `package-lock.json`, `src/main.tsx`: self-hosted variable Manrope with Latin, Cyrillic, and German coverage.
- `tests/e2e/run-all.mjs`: direct Node-based Vite launch and awaited shutdown; Windows no longer leaves a stale preview process behind.
- `docs/reports/FOLDWINK_SPRINT_R2_VISUAL_AUDIT.md`, `docs/TODO.md`: audit, critique synthesis, decisions, completion, and R3 handoff.

## Generated Texture Provenance

Image generation produced the source at:

`C:\Users\Vladimir\.codex\generated_images\019e1759-11f4-70b2-846f-1bbf23245e97\exec-935f43df-8142-4dd8-a326-d8ff88ab21e9.png`

Prompt: seamless near-black graphite printmaking paper; subtle cool-green undertone; fine recycled fibres and microscopic ink speckles; even illumination; no gradient, vignette, objects, cards, symbols, text, logo, border, or bokeh. The 1254x1254 source was resized to 1024x1024 and compressed to WebP quality 62. Only the 46.4 kB optimized asset ships.

## Tests Run

- `npm audit --omit=dev` - PASS, 0 production vulnerabilities.
- `npm run typecheck` - PASS.
- `npm run lint` - PASS.
- `npm test` - PASS, 146/146 tests across 17 suites.
- `npm run validate` - PASS, 500 puzzles; easy=272, medium=194, hard=34; diversity 0.968; 1,349 existing editorial warnings.
- `npm run build` - PASS.
- `npm run test:e2e` - PASS, 35/35 production scenarios across progression, gameplay, responsive, itch embed, and multi-round result flow.
- Post-E2E port check - PASS; preview port 4175 released.

Production build: main JS 414.60 kB / 95.60 kB gzip; CSS 35.60 kB / 9.90 kB gzip. Manrope language subsets are emitted as separate WOFF2 assets.

## Manual QA Notes

- 390x844: menu, onboarding, Medium Tabs/Wink, full board, selection, results, and stats remain readable with no horizontal overflow.
- 320x568: cards remain at least 60 px high; Medium needs a short vertical scroll but game controls remain reachable and the E2E reachability assertion passes.
- 1280x800: board expanded from 680 to 760 px and cards to 100 px high, reducing unused space without changing mobile geometry.
- Selected cards visibly lift and show the folded corner; solved rows retain dark-ink contrast and four non-colour markers.
- Reduced motion remains supported; all decorative keyframes are disabled by `prefers-reduced-motion`.
- Share card reviewed at 1080x1080 in normal and Supporter variants; OG verified at 1200x630; story verified at exactly 1080x1920.
- Graphite texture is intentionally near-invisible at 11% opacity and does not reduce text or card contrast.

## Open Risks

- A physical iPhone Safari pass is still required for safe-area chrome, native share-sheet preview, and real touch/audio behavior.
- The final share card still needs human inspection for loss state and unusually long localized strings; the visual harness supports `?loss=1`.
- The validator's 1,349 editorial warnings predate R2. They are content debt, not build failures, but should be triaged before paid acquisition scales traffic.
- Ko-fi/checkout values are not configured and the direct purchase-return loop cannot be certified until hosted URLs exist.
- The new identity must be propagated into existing TikTok video templates; R2 only supplies the new 9:16 source frame.

## Go / No-Go For Next Sprint

**GO for Sprint R3 - tactile sound identity.** Visual identity and responsive behavior are stable enough to tune sound against them. **NO-GO for paid public launch** until the physical iPhone pass and direct checkout return test are complete.
