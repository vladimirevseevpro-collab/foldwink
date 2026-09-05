import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  rotationSpeed: number;
  flipSpeed: number;
  flip: number;
  color: string;
  opacity: number;
}

const PALETTE = [
  "#67d7d0", // accent mint
  "#ffd700", // radiant gold
  "#f1c75b", // solved 1 yellow
  "#75c88a", // solved 2 green
  "#ec8b7d", // solved 3 coral
  "#b9a2f2", // solved 4 lavender
  "#ffffff", // pure white shimmer
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  rotationSpeed: number;
  flipSpeed: number;
  flip: number;
  color: string;
  isDiamond: boolean;
  opacity: number;
}

export function VictoryConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Honor reduced-motion preference
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

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const PARTICLE_COUNT = Math.min(55, Math.floor(width / 16));
    const particles: Particle[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.random() * Math.PI) / 3 + Math.PI / 3; // spread downwards and outward
      const speed = Math.random() * 7 + 4;
      particles.push({
        x: width * 0.5 + (Math.random() * 140 - 70),
        y: height * 0.22 + (Math.random() * 50 - 25),
        vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
        vy: -Math.sin(angle) * speed * 0.75 - Math.random() * 3,
        width: Math.random() * 9 + 6,
        height: Math.random() * 7 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.14,
        flip: Math.random() * Math.PI * 2,
        flipSpeed: Math.random() * 0.09 + 0.04,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        isDiamond: Math.random() > 0.65,
        opacity: 1,
      });
    }

    let animationFrameId: number;
    let startTime: number | null = null;
    const DURATION = 2800; // ms

    const render = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = elapsed / DURATION;

      ctx.clearRect(0, 0, width, height);

      if (progress >= 1) {
        return;
      }

      const fade = progress > 0.68 ? 1 - (progress - 0.68) / 0.32 : 1;

      for (const p of particles) {
        // Physics update
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.17; // gravity
        p.vx *= 0.985; // air drag
        p.rotation += p.rotationSpeed;
        p.flip += p.flipSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        // 2.5D tumbling effect via scale
        ctx.scale(Math.cos(p.flip), 1);
        ctx.globalAlpha = p.opacity * Math.max(0, fade);
        ctx.fillStyle = p.color;

        if (p.isDiamond) {
          ctx.beginPath();
          ctx.moveTo(0, -p.height);
          ctx.lineTo(p.width / 2, 0);
          ctx.lineTo(0, p.height);
          ctx.lineTo(-p.width / 2, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          // Draw paper confetti rectangle
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      aria-hidden="true"
    />
  );
}
