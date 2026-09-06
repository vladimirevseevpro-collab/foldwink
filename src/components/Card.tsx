import { useRef, useCallback, useState, useEffect, type CSSProperties } from "react";
import {
  SOLVED_CARD_DEPTH_CLASSES,
  SOLVED_COLOR_CLASSES,
  SOLVED_GROUP_MARKERS,
} from "../game/solvedColors";
import { MOTION_CLASS } from "../styles/motion";
import { FoldedCorner } from "./FoldedCorner";

interface Props {
  value: string;
  state: "idle" | "selected" | "solved";
  solvedColorIndex?: number;
  solvedIndex?: number;
  dealIndex?: number;
  disabled?: boolean;
  onClick: () => void;
  solvedAria?: string;
  isWobbling?: boolean;
  wobblePhase?: number;
}

export function Card({
  value,
  state,
  solvedColorIndex = 0,
  solvedIndex = 0,
  dealIndex,
  disabled,
  onClick,
  solvedAria,
  isWobbling,
  wobblePhase = 0,
}: Props) {
  const glyphCount = Array.from(value).length;
  const textSize =
    glyphCount > 18
      ? "text-[10px] sm:text-[13px]"
      : glyphCount > 13
        ? "text-[11px] sm:text-[14px]"
        : "text-[13px] sm:text-[16px]";
  const base = `relative w-full h-[64px] min-h-[48px] max-[340px]:h-[56px] sm:h-[90px] lg:h-[100px] flex items-center justify-center text-center px-1.5 py-2 sm:px-2 rounded-lg font-bold ${textSize} leading-[1.08] select-none will-change-transform overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface touch-manipulation`;

  const ref = useRef<HTMLButtonElement>(null);
  const [isPressed, setIsPressed] = useState(false);

  // High-performance direct CSS transform parallax with S-curve damping
  const targetTilt = useRef({ x: 0, y: 0 });
  const currentTilt = useRef({ x: 0, y: 0 });
  const targetGlare = useRef({ x: 50, y: 50, opacity: 0 });
  const currentGlare = useRef({ x: 50, y: 50, opacity: 0 });
  const rafId = useRef<number | null>(null);
  const isAnimating = useRef(false);

  const updateFrame = useCallback(() => {
    if (!ref.current) {
      isAnimating.current = false;
      return;
    }

    // S-curve smooth damping: s(t) = t * t * (3 - 2 * t)
    const dx = targetTilt.current.x - currentTilt.current.x;
    const dy = targetTilt.current.y - currentTilt.current.y;
    const dgOp = targetGlare.current.opacity - currentGlare.current.opacity;

    // Custom S-curve velocity modulation
    const dist = Math.sqrt(dx * dx + dy * dy);
    const normalizedDist = Math.min(1, dist / 16);
    const easeFactor = 0.12 + 0.16 * (normalizedDist * normalizedDist * (3 - 2 * normalizedDist));

    currentTilt.current.x += dx * easeFactor;
    currentTilt.current.y += dy * easeFactor;
    currentGlare.current.x += (targetGlare.current.x - currentGlare.current.x) * easeFactor;
    currentGlare.current.y += (targetGlare.current.y - currentGlare.current.y) * easeFactor;
    currentGlare.current.opacity += dgOp * 0.2;

    const el = ref.current;
    el.style.setProperty("--tilt-x", `${currentTilt.current.x.toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${currentTilt.current.y.toFixed(2)}deg`);
    el.style.setProperty("--glare-x", `${currentGlare.current.x.toFixed(1)}%`);
    el.style.setProperty("--glare-y", `${currentGlare.current.y.toFixed(1)}%`);
    el.style.setProperty("--glare-opacity", currentGlare.current.opacity.toFixed(3));

    const settled =
      Math.abs(dx) < 0.05 &&
      Math.abs(dy) < 0.05 &&
      Math.abs(dgOp) < 0.01 &&
      targetGlare.current.opacity === 0;

    if (!settled) {
      rafId.current = requestAnimationFrame(updateFrame);
    } else {
      isAnimating.current = false;
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
      el.style.setProperty("--glare-opacity", "0");
    }
  }, []);

  const startAnimation = useCallback(() => {
    if (!isAnimating.current) {
      isAnimating.current = true;
      rafId.current = requestAnimationFrame(updateFrame);
    }
  }, [updateFrame]);

  // Clean teardown invariant: always cancel rAF on unmount
  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled || state === "solved") return;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;

      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      targetTilt.current = { x: -normY * 8.5, y: normX * 8.5 };
      targetGlare.current = {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
        opacity: 0.35,
      };

      startAnimation();
    },
    [disabled, state, startAnimation]
  );

  const handlePointerLeave = useCallback(() => {
    if (state === "solved") return;
    targetTilt.current = { x: 0, y: 0 };
    targetGlare.current = { x: 50, y: 50, opacity: 0 };
    setIsPressed(false);
    startAnimation();
  }, [state, startAnimation]);

  const handlePointerDown = useCallback(() => {
    if (disabled || state === "solved") return;
    setIsPressed(true);
  }, [disabled, state]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  let variant: string;
  let motion: string = MOTION_CLASS.baseTransition;
  if (state === "solved") {
    variant = `${SOLVED_COLOR_CLASSES[solvedColorIndex % SOLVED_COLOR_CLASSES.length]} ${SOLVED_CARD_DEPTH_CLASSES[solvedColorIndex % SOLVED_CARD_DEPTH_CLASSES.length]} ${MOTION_CLASS.cardFlip} ${MOTION_CLASS.solvedPop}`;
    motion = "";
  } else if (state === "selected") {
    variant = `bg-paperHi text-ink border-2 border-accent shadow-paperSelected`;
  } else {
    variant =
      "bg-paper text-ink border border-paperBorder shadow-paper hover:shadow-paperHover hover:bg-paperHi";
  }

  const wobbleClass = isWobbling ? "fw-tension-wobble" : "";
  const classes = `fw-card ${base} ${motion} ${variant} ${wobbleClass}${disabled ? " pointer-events-none" : ""}`;
  const marker =
    state === "solved"
      ? SOLVED_GROUP_MARKERS[solvedColorIndex % SOLVED_GROUP_MARKERS.length]
      : null;

  const ariaLabel = state === "solved" ? solvedAria ?? `${value} - solved` : value;

  const style: CSSProperties = {
    ...(state === "selected" ? { "--lift": "-2px" } : {}),
    ...(state === "solved" ? ({ "--flip-delay": solvedIndex } as CSSProperties) : {}),
    ...(dealIndex !== undefined && state === "idle"
      ? { animationDelay: `${dealIndex * 25}ms` }
      : {}),
    ...(isWobbling ? { animationDelay: `${wobblePhase * 55}ms` } : {}),
  } as CSSProperties;

  const letterpress = state === "solved" ? "fw-letterpress-dark" : "fw-letterpress-paper";

  return (
    <button
      ref={ref}
      data-key={value}
      data-state={state}
      data-pressed={isPressed}
      type="button"
      className={`${classes} ${dealIndex !== undefined ? "fw-deal" : ""}`}
      style={style}
      aria-pressed={state === "selected"}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerLeave}
    >
      {state === "selected" && <FoldedCorner />}
      {state === "selected" && <span className="fw-sheen-glare" aria-hidden="true" />}
      <span
        className={`hyphens-auto [overflow-wrap:anywhere] [word-break:break-word] max-w-full relative z-10 tracking-tight ${letterpress}`}
        style={{ wordBreak: "break-word" }}
      >
        {marker && (
          <span className="mr-0.5 text-xs opacity-90" aria-hidden="true">
            {marker}
          </span>
        )}
        {value}
      </span>
    </button>
  );
}

