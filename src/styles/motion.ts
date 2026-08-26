/**
 * Foldwink motion tokens — one source of truth.
 *
 * Rules:
 *   - CSS / transform-only. No animation library, ever.
 *   - Durations live here. Components reference these constants or the
 *     matching class names, they do not hardcode ms values.
 *   - Every animated surface must have a `prefers-reduced-motion` escape
 *     hatch in `src/styles/index.css`.
 */

export const MOTION_DURATION = {
  /** Quick tactile card press compression */
  press: 80,
  /** Tactile press return settle */
  pressReturn: 150,
  /** Foldwink Tabs reveal polish */
  tab: 200,
  /** Correct-guess card 3D flip / pop */
  pop: 220,
  /** 3D card flip settlement */
  flip3D: 300,
  /** Dynamic light sheen sweep */
  sheen: 550,
  /** 3D mechanical tab split-flap */
  tabFlap: 220,
  /** Staggered wink letter reveal per character */
  winkLetterStagger: 24,
  /** One-away tension alert pulse */
  oneAway: 480,
  /** Result screen arrival */
  result: 320,
  /** Wrong-guess gentle wooden tap / nudge */
  woodenTap: 180,
  /** Wrong-guess grid shake */
  shake: 380,
  /** Streak pulse on result screen */
  streak: 1800,
} as const;

export const MOTION_CLASS = {
  /** Scale-down on active press with 3D compression. Apply to any tactile button/card. */
  press: "active:translate-y-[2px] active:scale-[0.985] active:shadow-paperPressed",
  /** Subtle 2.5D lift for a selected card. Transform + shadow only. */
  selectedLift: "-translate-y-[2px]",
  /** One-shot pop when a card becomes solved. */
  solvedPop: "fw-pop",
  /** 3D flip when entering solved state. */
  cardFlip: "fw-card-flip",
  /** Dynamic light sheen sweep. */
  sheen: "fw-sheen",
  /** 3D mechanical split-flap for tabs. */
  tabFlap: "fw-tab-flap",
  /** One-away pulse tension. */
  oneAway: "fw-one-away",
  /** Wrong-guess gentle wooden tap. */
  woodenTap: "fw-wooden-tap",
  /** Wrong-guess shake, apply to the grid wrapper. */
  shake: "fw-shake",
  /** Result-summary arrival. */
  resultPop: "fw-result-pop",
  /** Tab reveal polish. */
  tabReveal: "fw-tab-reveal",
  /** Streak celebration pulse. */
  streakPulse: "fw-streak-pulse",
  /** Standard transition for color/shadow/transform changes. */
  baseTransition:
    "transition-[transform,box-shadow,background-color,border-color,color] duration-150 ease-out",
} as const;

export type MotionClassKey = keyof typeof MOTION_CLASS;
