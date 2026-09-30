# Foldwink asset register

Updated: 2026-09-14

Runtime visual/audio assets accepted for the Paper Theatre release path. UI text remains live HTML; decorative assets never carry gameplay meaning.

| ID / path | Type | Source / authoring | Rights / license record | Runtime size | Fallback / notes |
|---|---|---|---|---:|---|
| `paper-theatre-w4` / `textures/paper-theatre-w4.webp` | seamless paper texture | Generated specifically for Foldwink with OpenAI built-in image generation on 2026-09-14; exact prompt below | Original generated output for this project; no source image, third-party mark or embedded text | 3,426 B | Plain `--theme-bg` remains underneath if the image is absent |
| `foldwink-wordmark` / `Wordmark.tsx`, `FoldwinkMark.tsx`, `favicon.svg` | code/vector brand mark + mono-capable fallback | Existing original Foldwink project artwork | Copyright Foldwink / Neural Void | inline / 694 B favicon | Live text remains available to assistive technology |
| `fw-icon-*` / `src/components/FoldwinkIcon.tsx` | 12 mono inline SVG icons | Original W4 project code: today, practice, stats, passport, sound, haptics, share, back, shuffle, clear, Wink, install | Copyright Foldwink / Neural Void | inline | Every control retains a text or accessible name; icons are decorative |
| `fw-stamp-*` / `src/components/StampArtwork.tsx` | project-owned inline SVG stamp system | Original W4 project code; W5 adds six deterministic archive pages derived from unique official solves | Copyright Foldwink / Neural Void | inline | Locked artwork, localized names and numeric progress remain available |
| `qr-ecc-m` / `src/progression/qr.ts` | QR Model 2 module generator | Project Nayuki via `@ribpay/qr-code-generator` 1.0.6 | MIT; full notice in `THIRD_PARTY_NOTICES.md` | tree-shaken runtime module | ECC M, versions 1–10, four-module quiet zone, typed oversize instead of truncation |
| `share-cover-light/dark` / `src/share/shareCard.ts` | canvas-authored share composition | Original repository canvas renderer, adapted to current theme tokens | Copyright Foldwink / Neural Void | zero external asset | Text share path remains when canvas/file sharing is unavailable |
| `audio/*.wav` | nine tactile WAV cues | Deterministic project sound pack; editable source/provenance in `assets/audio/sources/suno/provenance.json` and `scripts/build-sound-pack.mjs` | See the per-source provenance file; release pack is generated locally | 1,507,596 B total | Same-context recipes in `src/audio/sound.ts` are the offline/decode fallback |

## Generated texture prompt

> Use case: stylized-concept. Asset type: seamlessly tileable web-game background texture for Foldwink's Paper Theatre visual system. Create a square, genuinely seamless tile of very subtle warm graphite-black handmade paper, suitable behind high-contrast UI cards. Macro scan of premium uncoated paper, restrained fibers and faint irregular grain, nearly flat and matte. Uniform edge-to-edge tile with no center focus, no vignette, no borders, seamless on all four edges. Even diffuse light; near-black warm charcoal; no text, logo, objects, folds, directional lighting, bright spots or watermark.

The generated PNG was downscaled offline to a 512×512 WebP at quality 72. The original remains in the local Codex generated-image store; only the 3.4 kB release derivative ships with the app.
