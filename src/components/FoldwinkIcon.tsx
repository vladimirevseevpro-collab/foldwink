import type { SVGProps } from "react";

export type FoldwinkIconName =
  | "today"
  | "practice"
  | "stats"
  | "passport"
  | "sound"
  | "haptics"
  | "share"
  | "back"
  | "shuffle"
  | "clear"
  | "wink"
  | "install";

interface Props extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: FoldwinkIconName;
  size?: number;
}

/** Project-owned mono icon vocabulary. Icons deliberately share the same
 * rounded paper-fold geometry and inherit the surrounding text colour. */
export function FoldwinkIcon({ name, size = 18, className = "", ...props }: Props) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
      {...common}
      {...props}
    >
      {name === "today" && (
        <>
          <path d="M6.5 3.5v3M17.5 3.5v3M4 8.5h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
          <path d="m9 14 2 2 4-5" />
        </>
      )}
      {name === "practice" && (
        <>
          <path d="m12 3 8 4-8 4-8-4 8-4Z" />
          <path d="m4 12 8 4 8-4M4 17l8 4 8-4" />
        </>
      )}
      {name === "stats" && <path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7M3 20.5h18" />}
      {name === "passport" && (
        <>
          <path d="M6 3.5h11a2 2 0 0 1 2 2v15H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 1-1.73V19a1.5 1.5 0 0 0 1.5 1.5" />
          <circle cx="12" cy="10" r="3" />
          <path d="M9 10h6M12 7c1 1.6 1 4.4 0 6M12 7c-1 1.6-1 4.4 0 6" />
        </>
      )}
      {name === "sound" && (
        <>
          <path d="M4 10h4l4-4v12l-4-4H4v-4Z" />
          <path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" />
        </>
      )}
      {name === "haptics" && (
        <path d="M8 7c-2 1.3-2 3.7 0 5s2 3.7 0 5M12 5c-2.8 2-2.8 5 0 7s2.8 5 0 7M16 7c2 1.3 2 3.7 0 5s-2 3.7 0 5" />
      )}
      {name === "share" && (
        <>
          <circle cx="18" cy="5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" />
        </>
      )}
      {name === "back" && <path d="m10 5-7 7 7 7M3 12h12a6 6 0 0 1 6 6" />}
      {name === "shuffle" && (
        <>
          <path d="M4 7h3c5 0 5 10 10 10h3M17 14l3 3-3 3" />
          <path d="M4 17h3c2.2 0 3.4-1.9 4.5-4M15 7h5M17 4l3 3-3 3" />
        </>
      )}
      {name === "clear" && (
        <>
          <path d="m8 5 11 11-4 4H8L3 15 13 5h-5Z" />
          <path d="m11 8-5 5" />
        </>
      )}
      {name === "wink" && (
        <>
          <path d="M4 12s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z" />
          <path d="M9.5 12a2.5 2.5 0 0 0 5 0M17.5 4.5l.7-2M20 6l1.8-1.2" />
        </>
      )}
      {name === "install" && (
        <>
          <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M5 19h14" />
        </>
      )}
    </svg>
  );
}
