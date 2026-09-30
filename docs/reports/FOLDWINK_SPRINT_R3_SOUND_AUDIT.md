# Foldwink Sprint R3 - Sound Audit

**Date:** 2026-07-22  
**Status:** Audit complete; implementation in progress  
**Direction:** One physical object - cool paper, bone ceramic, and walnut - rendered as a compact local WAV pack with a procedural fallback.

## Scope

The audit covers all nine sound events, their React call sites, persisted settings, iOS audio unlock, the existing standalone preview, asset delivery, and the first paid-Suno source session.

## Current System

- `src/audio/sound.ts` synthesizes every cue at runtime from random noise and low sine oscillators.
- `src/audio/useSound.ts` is a clean React boundary; components never instantiate `Audio` or `AudioContext` directly.
- The public API is already small and correct: `playSound`, mute, volume, and nine semantic events.
- Mute and volume persist under `foldwink:sound`; the default gain is restrained at `0.42`.
- Suspended `AudioContext` recovery is handled correctly for iOS Safari by waiting for `resume()` before scheduling the first cue.
- `scripts/preview-sounds.html` duplicates the synthesis recipes instead of exercising the production module.

## Findings

### High value

1. **The runtime palette is generic despite thoughtful recipes.** Noise plus sine bodies can describe paper, wood, and tile, but does not reproduce their transients or fibres. It also changes between sessions because the noise buffer is random.
2. **There is no static asset path or preload state.** The first sound depends entirely on real-time synthesis. A local decoded-buffer path is needed, with synthesis retained only as a fallback.
3. **The preview is stale by construction.** It copies recipes and can diverge from the game. R3 needs one audition surface that imports the production cue manifest.

### Already sound

1. The `useSound` boundary and gameplay call sites should stay unchanged.
2. Sound is feedback only; no puzzle state depends on audio.
3. Mute persistence, default volume, and iOS context recovery should be preserved.
4. Nine events are sufficient. No additional cue or gameplay mechanic is needed.

### Missing verification

1. No automated check proves that every event has a local asset.
2. No test covers decode failure and procedural fallback.
3. No listening page exposes individual replay, sequence replay, or waveform/duration information.
4. A physical iPhone Safari ear and latency pass remains necessary after integration.

## Source Session

Suno `Sounds`, model `v5.5`, generated three one-shot families on a paid account. Each prompt produced two variants, costing six credits total. Original stereo 48 kHz, 16-bit WAV files are retained under `assets/audio/sources/suno/`; exact prompts and song IDs are in `provenance.json`.

| Source | File duration | Useful signal | Peak | Decision |
| --- | ---: | ---: | ---: | --- |
| Ceramic A | 2.280 s | 0.173 s | 0.693 | Keep: two-part Wink gesture |
| Ceramic B | 2.000 s | 0.101 s | 0.727 | Keep: short selection accent |
| Wood A | 2.000 s | 0.104 s | 0.712 | Keep: clean walnut impact |
| Wood B | 2.000 s | nearly full file | 0.747 | Retain as source; reject from master because of tail/noise |
| Paper A | 2.640 s | 0.198 s | 0.719 | Keep: restrained fold body |
| Paper B | 2.000 s | 0.213 s | 0.754 | Keep selectively: brighter fibre accent |

`Useful signal` uses a conservative threshold of max(2% of peak, -60 dBFS). Suno correctly placed the intended one-shot near the start but padded files with silence; production assets must be trimmed.

## Implementation Decision

- Build nine deterministic mono 48 kHz PCM WAV cues from the six retained source files.
- Use only three material families so the whole product sounds like one handmade puzzle object.
- Trim silence, fade boundaries, level-match cues, and keep micro-feedback below the result cues.
- Decode and cache local buffers through Web Audio. Do not create an `HTMLAudioElement` per tap.
- Start preload when an audio context is first unlocked; play the existing procedural recipe until a requested buffer is ready or if decode fails.
- Keep production call sites and `useSound` unchanged.
- Replace the duplicated preview with a branded production audition page.

## Acceptance Gates

- All nine files exist, decode, and remain under a small aggregate payload budget.
- First-tap fallback works when buffers are not ready.
- Mute persistence and volume behavior remain unchanged.
- Rapid select/deselect playback does not serialize or clip.
- The audition page works at mobile and desktop widths.
- Typecheck, lint, unit tests, puzzle validation, build, production E2E, and a physical iPhone listening pass are recorded before R3 closes.

## Open Risks

- Signal measurements cannot replace a human ear pass on speakers, headphones, and iPhone hardware.
- Static buffer decode behavior must be checked on the oldest supported Safari target.
- Source provenance establishes generation context and paid-plan eligibility; it is not a substitute for jurisdiction-specific copyright advice.

