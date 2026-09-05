import { BrandMark } from "./BrandMark";

interface Props {
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  subtitle?: string;
  /** Show the "by Neural Void" sublabel under the wordmark. Default: true on lg. */
  showSublabel?: boolean;
}

const TITLE_CLS: Record<NonNullable<Props["size"]>, string> = {
  sm: "text-2xl sm:text-3xl",
  md: "text-4xl sm:text-5xl",
  lg: "text-5xl sm:text-6xl",
};

const MARK_PX: Record<NonNullable<Props["size"]>, number> = {
  sm: 32,
  md: 52,
  lg: 64,
};

/**
 * The Foldwink wordmark lockup: printed sheet mark + two-ink wordmark +
 * optional "by Neural Void" sublabel. One place, one lockup, reused on
 * Menu / Stats / Onboarding.
 */
export function Wordmark({ size = "md", animated = false, subtitle, showSublabel }: Props) {
  const sublabelOn = showSublabel ?? size === "lg";
  return (
    <div className="flex flex-col items-center text-center">
      <BrandMark size={MARK_PX[size]} animated={animated} />
      <h1 className={`mt-3 font-extrabold tracking-normal leading-none ${TITLE_CLS[size]}`}>
        <span>Fold</span>
        <span className="text-accent">wink</span>
      </h1>
      <div className="mt-2 flex items-center gap-2" aria-hidden="true">
        <span className="h-px w-5 bg-line" />
        <span className="h-2 w-2 rotate-45 border border-accent bg-bg" />
        <span className="h-px w-5 bg-line" />
      </div>
      {sublabelOn && (
        <div className="mt-2 text-[10px] uppercase text-muted">
          by Neural Void
        </div>
      )}
      {subtitle && <p className="mt-3 text-muted text-sm max-w-xs">{subtitle}</p>}
    </div>
  );
}
