# ADR-003: Dependency-free CSS motion runtime

- **Status:** Accepted for W4–1.0
- **Date:** 2026-09-14
- **Canonical requirements:** UX-10, OPS-01 and FW-019/FW-020 in `docs/FOLDWINK_IMPLEMENTATION_SPEC_2026-09-12.md`

## Context

Foldwink already had enough motion to demonstrate the desired Paper Theatre feel, but it had three reproducible lifecycle defects: a per-card gyro subscription surface, a hover damping loop that could keep scheduling frames after reaching a non-zero target, and a manual Grid FLIP that wrote `style.transform` onto the same card element owned by press/tilt/solve transforms. Full-screen 2.8-second victory confetti could also obscure the Result heading.

Motion for React was listed only as a conditional candidate if an isolated comparison proved that it removed more complexity or fixed a defect that the CSS path could not solve.

## Decision

1. Foldwink keeps a dependency-free DOM/CSS motion path through 1.0. Motion for React is not installed.
2. Manual Grid FLIP is removed. Shuffle changes layout atomically; card press, selection, solve, Tabs and one-shot feedback remain CSS-owned.
3. Gyro/device-orientation is removed rather than permission-gated. Pointer tilt is decorative desktop feedback only, converges to an epsilon and stops its `requestAnimationFrame` loop.
4. JS particles are bounded one-shot effects, stop in hidden documents, clean up on unmount and do not render under `prefers-reduced-motion`.
5. Result confetti is capped at 900 ms and painted behind semantic content. It cannot delay or cover Next.
6. Ready/tension decoration is one-shot rather than infinite. `fw-deal` and all other motion classes have an explicit reduced-motion escape.
7. Duration tokens remain in `src/styles/motion.ts`; CSS keyframes mirror those tokens. New runtime motion dependencies require a new ADR and full OPS-01 evidence.

## Comparison evidence

- Package and compressed bundle delta: **0 bytes / 0 packages**.
- Removed runtime responsibilities: device-orientation subscription, manual Grid position snapshot map, FLIP rAF and timeout, overlapping transform ownership, and a 2.8-second result overlay.
- The CSS path directly fixes the known defects while preserving the accepted visual events. A library prototype would therefore add runtime weight and a second abstraction without a remaining evidence-backed defect to solve.
- Acceptance is verified by W4 reduced-motion, idle-frame, interruption, background/return, Next-latency and screenshot evidence; a green build alone is insufficient.

## Consequences

- Shuffle is intentionally crisp rather than spatially animated. This is lower spectacle but higher predictability and avoids ghost cards/focus drift.
- A future layout-animation request must separate layout and press transforms onto distinct elements and prove measurable value against this baseline.
- Rive, Three, Pixi, Phaser and other renderers remain outside the Foldwink 1.0 product.

## Rejected alternatives

- Installing Motion for React to replace already-removable custom code.
- Keeping manual FLIP and pointer transforms on the same DOM node.
- Re-enabling gyro behind an automatic permission request.
- Using long/full-screen confetti as a retention device.
