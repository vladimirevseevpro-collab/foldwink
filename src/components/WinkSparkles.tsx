import { useEffect, useRef } from "react";

export function WinkSparkles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = (canvas.width = canvas.offsetWidth);
    const h = (canvas.height = canvas.offsetHeight);

    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) return;

    const particles: { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[] = [];
    const colors = ["#d4af37", "#ffdf00", "#fff8e7"];

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: w / 2,
        y: h / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1.0,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3 + 1,
      });
    }

    let animationId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = (time - lastTime) / 16.6;
      lastTime = time;

      ctx.clearRect(0, 0, w, h);
      let active = false;

      for (const p of particles) {
        if (p.life <= 0) continue;
        active = true;
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.vy += 0.1 * delta; // gravity
        p.life -= 0.02 * delta;

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (active) {
        animationId = requestAnimationFrame(render);
      }
    };

    animationId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 h-full w-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
