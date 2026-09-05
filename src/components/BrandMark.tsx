interface Props {
  size?: number;
  animated?: boolean;
}

/** Four stamped groups on one sheet, finished by the shared folded Wink corner. */
export function BrandMark({ size = 56, animated = false }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={`shrink-0 drop-shadow-[0_7px_8px_rgba(0,0,0,0.28)] ${animated ? "fw-brand-arrive" : ""}`}
    >
      <rect x="4" y="6" width="56" height="54" rx="8" className="fill-paperEdge" />
      <rect
        x="4"
        y="2"
        width="56"
        height="54"
        rx="8"
        className="fill-paper stroke-line"
        strokeWidth="1.5"
      />
      <rect x="10" y="9" width="18" height="18" rx="3" className="fill-solved1" />
      <rect x="34" y="9" width="18" height="18" rx="3" className="fill-solved2" />
      <rect x="10" y="33" width="18" height="18" rx="3" className="fill-solved3" />
      <rect x="34" y="33" width="18" height="18" rx="3" className="fill-solved4" />
      <path d="M46 2H60V16Z" className="fill-accent" />
      <path
        d="M52 7L57 12"
        className="stroke-ink"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
