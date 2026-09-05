import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "default" | "icon";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center rounded-lg border font-bold text-base transition-[transform,box-shadow,background-color,border-color,color] duration-150 select-none active:translate-y-[2px] disabled:translate-y-0 disabled:shadow-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const sizes: Record<Size, string> = {
  default: "px-5 py-3 min-h-12",
  icon: "w-12 h-12 p-0 shrink-0",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-ink border-accentBorder shadow-accentControl hover:bg-accentHi active:shadow-accentControlPressed",
  secondary:
    "bg-surfaceHi text-text border-line shadow-control hover:bg-surfaceHover active:shadow-controlPressed",
  ghost: "bg-transparent text-text border-transparent shadow-none hover:bg-surfaceHi",
  danger:
    "bg-danger text-ink border-dangerBorder shadow-dangerControl hover:bg-dangerHi active:shadow-dangerControlPressed",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "default", className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});
