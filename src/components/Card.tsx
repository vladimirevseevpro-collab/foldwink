import { useRef, useCallback, useState, type CSSProperties } from "react";
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
}: Props) {
  const glyphCount = Array.from(value).length;
  const textSize =
    glyphCount > 18
      ? "text-[10px] sm:text-[13px]"
      : glyphCount > 13
        ? "text-[11px] sm:text-[14px]"
        : "text-[13px] sm:text-[16px]";
  const base = `relative w-full h-[68px] max-[340px]:h-[60px] sm:h-[90px] lg:h-[100px] flex items-center justify-center text-center px-1.5 py-2 sm:px-2 rounded-lg font-bold ${textSize} leading-[1.08] select-none will-change-transform overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface`;
  
  // Custom magnetic tilt & tactile press state
  const ref = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [glare, setGlare] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });
  const [isPressed, setIsPressed] = useState(false);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || state === "solved") return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Normalize coordinates from center: -1 to 1
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    const gx = ((e.clientX - rect.left) / rect.width) * 100;
    const gy = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Rotate slightly away from pointer for 3D press feel
    setTilt({ x: -y * 8, y: x * 8 });
    setGlare({ x: gx, y: gy, opacity: 0.35 });
  }, [disabled, state]);

  const handleMouseLeave = useCallback(() => {
    if (state === "solved") return;
    setTilt({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
    setIsPressed(false);
  }, [state]);

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
    motion = ""; // handled by keyframes
  } else if (state === "selected") {
    variant = `bg-paperHi text-ink border-2 border-accent shadow-paperSelected`;
  } else {
    variant =
      "bg-paper text-ink border border-paperBorder shadow-paper hover:shadow-paperHover hover:bg-paperHi";
  }

  const classes = `fw-card ${base} ${motion} ${variant}${disabled ? " pointer-events-none" : ""}`;
  const marker =
    state === "solved"
      ? SOLVED_GROUP_MARKERS[solvedColorIndex % SOLVED_GROUP_MARKERS.length]
      : null;

  const ariaLabel = state === "solved" ? solvedAria ?? `${value} - solved` : value;

  const style: CSSProperties = {
    "--tilt-x": `${tilt.x}deg`,
    "--tilt-y": `${tilt.y}deg`,
    "--glare-x": `${glare.x}%`,
    "--glare-y": `${glare.y}%`,
    "--glare-opacity": glare.opacity,
    ...(state === "selected" ? { "--lift": "-2px" } : {}),
    ...(state === "solved" ? { "--flip-delay": solvedIndex } as CSSProperties : {}),
    ...(dealIndex !== undefined && state === "idle" ? { animationDelay: `${dealIndex * 25}ms` } : {}),
  } as CSSProperties;

  const letterpress = state === "solved" ? "fw-letterpress-dark" : "fw-letterpress-paper";

  return (
    <button
      ref={ref}
      data-key={value}
      data-state={state}
      data-pressed={isPressed}
      type="button"
      className={`${classes} ${dealIndex !== undefined ? 'fw-deal' : ''}`}
      style={style}
      aria-pressed={state === "selected"}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
