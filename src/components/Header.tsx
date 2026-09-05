import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function Header({ title, subtitle, right }: Props) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-2 gap-y-2 sm:gap-4 mb-4">
      <div className="min-w-0 flex-1 max-[359px]:basis-full">
        <h1 className="text-lg min-[360px]:text-xl sm:text-2xl font-bold leading-tight break-words line-clamp-2">
          {title}
        </h1>
        {subtitle && <p className="text-muted text-sm mt-0.5">{subtitle}</p>}
      </div>
      {right && (
        <div className="shrink-0 max-[359px]:flex max-[359px]:basis-full max-[359px]:justify-end">
          {right}
        </div>
      )}
    </header>
  );
}
