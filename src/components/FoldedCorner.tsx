interface Props {
  className?: string;
}

/** The shared Foldwink signature: a lifted proofing-ink corner with a small wink slit and 2.5D shadow. */
export function FoldedCorner({ className = "" }: Props) {
  return (
    <span
      className={`pointer-events-none absolute right-0 top-0 h-[20px] w-[20px] overflow-hidden drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)] ${className}`}
      aria-hidden="true"
    >
      <span className="absolute inset-0 bg-accent [clip-path:polygon(0_0,100%_0,100%_100%)]" />
      <span className="absolute right-[3px] top-[5px] h-[2px] w-[7px] rotate-45 rounded-full bg-ink" />
    </span>
  );
}
