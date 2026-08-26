import { type ReactNode, useCallback, useRef, useLayoutEffect } from "react";
import { MOTION_CLASS } from "../styles/motion";

interface Props {
  children: ReactNode;
  shake?: boolean;
  label: string;
}

/**
 * 4x4 puzzle grid with arrow-key navigation.
 *
 * Children are expected to be 16 card buttons. Arrow keys move focus
 * between them in a 4-column layout. Focus wraps at edges.
 */
export function Grid({ children, shake, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const previousPositions = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    if (!ref.current) return;
    const parent = ref.current;
    const childrenNodes = Array.from(parent.children) as HTMLElement[];
    
    // Smooth DOM reordering using FLIP technique
    childrenNodes.forEach(child => {
      const key = child.dataset.key;
      if (!key) return;
      const prev = previousPositions.current.get(key);
      const current = child.getBoundingClientRect();
      
      if (prev && (prev.left !== current.left || prev.top !== current.top)) {
        const deltaX = prev.left - current.left;
        const deltaY = prev.top - current.top;
        
        child.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        child.style.transition = "none";
        child.style.zIndex = "10";
        
        requestAnimationFrame(() => {
          child.style.transform = "";
          // smooth, slightly bouncy spring
          child.style.transition = "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
          setTimeout(() => { child.style.zIndex = ""; }, 500);
        });
      }
      
      previousPositions.current.set(key, current);
    });
  });

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const grid = ref.current;
    if (!grid) return;
    const buttons = Array.from(grid.querySelectorAll<HTMLElement>("button"));
    const idx = buttons.indexOf(document.activeElement as HTMLElement);
    if (idx === -1) return;

    const len = buttons.length;
    let step: number | null = null;

    if (e.key === "ArrowRight") step = 1;
    else if (e.key === "ArrowLeft") step = -1;
    else if (e.key === "ArrowDown") step = 4;
    else if (e.key === "ArrowUp") step = -4;

    if (step === null) return;
    e.preventDefault();

    // Solved cards are deliberately disabled. Keep the 4x4 spatial move,
    // but continue in the same direction until a playable card is found.
    for (let attempts = 0, target = idx; attempts < len; attempts += 1) {
      target = (target + step + len) % len;
      const button = buttons[target];
      if (button && !button.hasAttribute("disabled")) {
        button.focus();
        return;
      }
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty("--mouse-x", `${x}px`);
    ref.current.style.setProperty("--mouse-y", `${y}px`);
  }, []);

  const classes = `relative grid grid-cols-4 gap-2 sm:gap-2.5 w-full max-w-[760px] mx-auto fw-grid-glow ${
    shake ? MOTION_CLASS.shake : ""
  }`;

  return (
    <div className="relative mx-auto w-full max-w-[760px] rounded-2xl bg-surface p-2.5 sm:p-4 border border-line shadow-mat">
      <div className="pointer-events-none absolute inset-1.5 sm:inset-2.5 rounded-xl border border-dashed border-line/50" aria-hidden="true" />
      <div 
        ref={ref} 
        className={classes} 
        role="grid" 
        aria-label={label} 
        onKeyDown={handleKeyDown}
        onMouseMove={handleMouseMove}
      >
        {children}
      </div>
    </div>
  );
}
