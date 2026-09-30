interface Props {
  stampId: string;
  color: string;
  locked?: boolean;
  size?: number;
}

/** Project-owned SVG stamp plate. The perforation/double rule is shared;
 * the centre glyph identifies the milestone without an emoji dependency. */
export function StampArtwork({ stampId, color, locked = false, size = 36 }: Props) {
  const glyph = locked ? (
    <>
      <rect x="9" y="11" width="6" height="6" rx="1.2" />
      <path d="M10.5 11V9.7a2.5 2.5 0 0 1 5 0V11M12 14h0" />
    </>
  ) : stampId === "stamp_morning_brew" ? (
    <>
      <path d="M7 10h8v3a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-3Z" />
      <path d="M15 11h1a2 2 0 0 1 0 4h-2M9 7c0 1 1 1.2 1 2M12 7c0 1 1 1.2 1 2" />
    </>
  ) : stampId === "stamp_raven_seal" ? (
    <>
      <path d="M6 16c4-7 7-8 12-9-2 4-5 8-10 10M9 14l5-3M8 17l-2 1" />
    </>
  ) : stampId === "stamp_midori_compass" ? (
    <>
      <circle cx="12" cy="12" r="6" />
      <path d="m14.5 9.5-1.6 3.4-3.4 1.6 1.6-3.4 3.4-1.6Z" />
    </>
  ) : stampId === "stamp_ink_well" ? (
    <>
      <path d="M8 10h8l1 8H7l1-8ZM9 10V7h6v3M10 14h4" />
      <path d="m15.5 6.5 2-2" />
    </>
  ) : stampId === "stamp_flawless_sun" ? (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 5V3M12 21v-2M5 12H3M21 12h-2M7 7 5.5 5.5M18.5 18.5 17 17M17 7l1.5-1.5M5.5 18.5 7 17" />
    </>
  ) : stampId === "stamp_iron_contract" ? (
    <>
      <path d="m7 6 10 12M17 6 7 18M6 5l3 1-2 2M18 5l-3 1 2 2" />
    </>
  ) : stampId === "stamp_gold_charter" ? (
    <>
      <path d="m6 16-1-8 4 3 3-5 3 5 4-3-1 8H6ZM7 18h10" />
    </>
  ) : stampId === "stamp_botanical_fern" ? (
    <>
      <path d="M8 18c2-6 4-9 8-12M10 14 7 12M12 11 9 9M14 9l3 1M11 16l3 1" />
    </>
  ) : (
    <>
      <path d="M7 6h10v12H7zM9 9h6M9 12h6M9 15h4" />
      <path d="m14 6 3 3" />
    </>
  );

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
      style={{ color }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" strokeDasharray="1.4 1.6" opacity=".8" />
      <circle cx="12" cy="12" r="8.3" opacity=".5" />
      {glyph}
    </svg>
  );
}
