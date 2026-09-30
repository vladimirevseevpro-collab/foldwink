import { useEffect, useState } from "react";
import { formatCountdown, msUntilNextLocalMidnight } from "../utils/countdown";
import { useT } from "../i18n/useLanguage";

export function DailyCountdown() {
  const [ms, setMs] = useState(msUntilNextLocalMidnight());
  const t = useT();

  useEffect(() => {
    let id: number | null = null;
    const update = (): void => {
      setMs(msUntilNextLocalMidnight());
    };
    const start = (): void => {
      if (id !== null || document.hidden) return;
      update();
      id = window.setInterval(update, 1000);
    };
    const stop = (): void => {
      if (id !== null) window.clearInterval(id);
      id = null;
    };
    const visibility = (): void => {
      if (document.hidden) stop();
      else start();
    };
    start();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  return (
    <div className="text-center text-sm text-muted">
      {t.daily.nextDailyIn}{" "}
      <span className="text-text font-semibold tabular-nums">{formatCountdown(ms)}</span>
    </div>
  );
}
