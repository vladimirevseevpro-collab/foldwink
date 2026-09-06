import { useEffect, useRef } from "react";

interface Props {
  triggerKey: number;
  colorIndex?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vRot: number;
  color: string;
  alpha: number;
}

const PALETTE_GROUPS = [
  ["#ffd700", "#e0b25e", "#fbf5ea", "#b87b22"], // Gold
  ["#75c88a", "#529f65", "#d6f5dc", "#2e5c38"], // Olive/Green
  ["#67d7d0", "#45a39d", "#e1fbf9", "#246662"], // Teal/Blue
  ["#b9a2f2", "#8b6ed6", "#f3effd", "#53389e"], // Purple/Rose
];

export function OrigamiConfetti({ triggerKey, colorIndex = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!triggerKey || typeof window === "undefined") return;

    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const colors = PALETTE_GROUPS[colorIndex % PALETTE_GROUPS.length];
    const particles: Particle[] = [];
    const count = 32;

    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) / 2 + Math.PI / 4; // upward spread
      const speed = Math.random() * 4 + 3;
      particles.push({
        x: canvas.width * 0.5 + (Math.random() * 60 - 30),
        y: canvas.height * 0.35 + (Math.random() * 20 - 10),
        vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
        vy: -Math.sin(angle) * speed,
        w: Math.random() * 6 + 4,
        h: Math.random() * 4 + 3,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }

    let rafId: number;
    let startTime: number | null = null;
    const duration = 1000;

    const render = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // subtle gravity
        p.vx *= 0.98; // air resistance
        p.rot += p.vRot;
        p.alpha = Math.max(0, 1 - progress * 1.2);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        // Draw paper shred
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    rafId = requestAnimationFrame(render);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [triggerKey, colorIndex]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-30 w-full h-full"
      aria-hidden="true"
    />
  );
}
