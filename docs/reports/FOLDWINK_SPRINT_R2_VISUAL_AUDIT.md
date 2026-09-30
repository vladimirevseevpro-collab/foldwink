# Foldwink Sprint R2 - Visual Audit

**Date:** 2026-07-22  
**Stage:** Pre-implementation audit  
**Scope:** Visual identity, tactile game feel, brand coherence, share surfaces, and paid-product readiness.

## Product Reading

Foldwink is a two-to-five-minute word puzzle, not an immersive 3D game. Its strongest product object is the card: players scan, touch, group, and lock sixteen of them. The visual system should therefore make cards and tabs feel deliberate and ownable, while leaving language and reasoning in the foreground.

The appropriate target is contemporary print-studio tactility: ink, cool paper, registration marks, small physical edges, and a decisive stamped solve. This can produce depth and memorability with CSS transforms and shadows only. A 3D renderer would add load, spectacle, and camera problems without increasing puzzle comprehension.

## Existing Strengths

- R1 established the correct physical play surface: 366 px board at a 390 px viewport, 68 px cards, and stable 320 px fallbacks.
- The four solved colours already give each category a recognizable finish.
- Shape markers mean solved groups do not rely on colour alone.
- Tabs + one Wink are a legitimate signature interaction with an existing letter-reveal animation.
- Motion is centralized, short, and reduced-motion aware.
- The 2x2 brand mark mirrors grouping without adding a second mechanic.
- The share renderer is dependency-free and can be brought into the same visual system.

## Visual Problems

### Generic dark utility palette

The current UI is dominated by `#0f1115`, `#181b22`, `#22262f`, and adjacent blue-slate values. It is competent but visually interchangeable with developer tools and generic dark dashboards. The cyan accent reads as a control highlight rather than a brand asset.

### Flat core object

Idle cards are dark rectangles on a dark field. Their only material cues are a one-pixel border and selected-state shadow. On desktop, the larger R1 board amplifies the emptiness of each card rather than increasing perceived quality.

### Weak brand ownership

The mark is close to a generic four-square app icon. The system-font wordmark with `tracking-tight` has no Fold, Wink, paper, or registration behavior. It will not remain recognizable when detached from the product name.

### Inconsistent geometry and raw tokens

Many surfaces use `rounded-xl` while the game board uses `rounded-lg`; raw border colours are repeated throughout components. This prevents controlled global iteration and makes the result screen feel like a stack of unrelated panels.

### Signature mechanic is visually underclaimed

Foldwink Tabs behave differently from cards but use nearly the same dark rounded-rectangle language. Wink is mostly cyan text plus a sparkle. The product's named mechanic needs one distinctive visual gesture that also survives on a share card and in a short video.

### Share output does not yet sell the game

The canvas card uses a dark radial background, text, and coloured squares, but does not show the actual paper-card material or the brand mark. It communicates a result, not a recognizable product world.

## Chosen Direction - Night Print Studio

### Materials

- Background: neutral near-black graphite with a slight green ink bias, not blue slate.
- Idle cards: cool white paper, dark ink, a restrained lower paper edge, and one short soft shadow.
- Active card: saturated turquoise proofing ink with a darker physical edge.
- Solved cards: four stamp colours with dark ink and the existing four shape markers.
- Tabs: compact index tabs, visually thinner than cards, with a top registration rule and a physical pressed state.
- Supporter cosmetic: a small metallic registration seal/frame, never gameplay power.

### Colour Logic

- Neutral graphite carries the studio environment.
- Cool paper provides the dominant gameplay contrast and breaks the one-note dark palette.
- Turquoise is reserved for player agency: selection, primary action, Wink readiness, focus.
- Yellow, green, coral, and violet belong only to solved-category identity and the 2x2 mark.
- Danger and one-away remain semantically separate from the four solved colours.

### Typography

- UI and cards stay highly legible and language-safe.
- Wordmark gains a custom lockup treatment rather than negative letter spacing.
- Small uppercase metadata remains sparse; body text does not use decorative tracking.
- Long card labels keep R1 content-aware sizing and wrapping.

### Depth and Motion

- Depth is limited to a 2-4 px paper edge and one shadow layer.
- Press moves down toward the edge; selection lifts by 1 px; solve lands like a stamp.
- Wink assembles the category with a brief registration snap, not prolonged glow or particles.
- No parallax, perspective scene, motion framework, or continuous decorative animation.

## Priority Order

1. Centralize visual tokens and restyle the sixteen cards. This changes the object players spend the session touching.
2. Give Tabs + Wink an index-tab / registration gesture that is visually unique but mechanically unchanged.
3. Rebuild the mark and wordmark lockup around the same paper/stamp logic.
4. Propagate geometry and material rules to buttons, onboarding, results, stats, and monetization surfaces.
5. Redraw the share card and generate raster OG/store assets from the real product language.

## Invariants from R1

- 390 px board width must remain at least 350 px; target remains 366 px.
- Mobile cards remain at least 60 px at 320 and 64 px at 390.
- Every command remains at least 44 px high.
- Submit remains reachable at 320x568.
- No horizontal overflow at 320, 390, 430, or 1280.
- EN/DE/RU remain supported.
- `prefers-reduced-motion` remains complete.
- Core gameplay, daily determinism, stats, and monetization flags remain unchanged.

## Rejected Directions

- Full 3D board, physics, camera movement, or Three.js: wrong value-to-complexity ratio.
- Glossy glassmorphism: weak word contrast and generic SaaS aesthetics.
- Vintage beige scrapbook: conflicts with the restrained modern identity and overuses a prohibited tan/cream palette.
- Neon cyberpunk: turns the puzzle into a theme skin and competes with reading.
- Cartoon mascots or a second hint/twist system: breaks product focus.

## Independent GPT Critique

An independent GPT-5.4 product and art-direction pass agreed with the core direction: keep the direct site canonical, reject a 3D renderer, make the cards and Tabs the product object, and prioritize a recognizable share artifact before adding monetization pressure.

The critique's strongest addition was a reusable **folded wink corner**: a small lifted turquoise corner with an ink slit. It now acts as the signature for selected cards, the armed or revealed Wink tab, the brand mark, share output, and future supporter foil. This gives the name a visual behavior without introducing another game mechanic.

Two recommendations were deliberately modified:

- A warm beige stock was replaced by cool white paper so the interface avoids a one-note cream palette and keeps stronger mobile contrast.
- Dark risograph fills were replaced by light stamp colours with dark ink; all core card combinations retain at least WCAG AA contrast for normal text.

The critique also reinforced two product constraints for later sprints: supporter status must become visible in exported/shareable identity rather than only on the Stats screen, and any future rewarded ad may grant a peripheral cosmetic only. An active-puzzle Wink or retry reward is rejected as pay-to-win adjacent.

## Audit Gate

Implementation may proceed after one independent critique of the chosen direction. Every visual milestone must be shown as real 390 px and 1280 px screenshots before it is propagated further.
