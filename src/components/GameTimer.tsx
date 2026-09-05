import { useEffect, useState } from "react";

interface Props {
  startedAt: number;
  endedAt?: number;
  ariaLabel: (time: string) => string;
}

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function GameTimer({ startedAt, endedAt, ariaLabel }: Props) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (endedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endedAt]);

  const elapsed = (endedAt ?? now) - startedAt;

  return (
    <span
      className="text-sm font-semibold tabular-nums text-text"
      aria-label={ariaLabel(format(elapsed))}
    >
      {format(elapsed)}
    </span>
  );
}
