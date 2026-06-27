import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils.js";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover active:bg-accent-muted shadow-sm",
  secondary:
    "bg-bg-elevated text-fg border border-border hover:bg-bg-hover active:bg-bg-subtle",
  ghost:
    "bg-transparent text-fg-muted hover:bg-bg-hover hover:text-fg active:bg-bg-subtle",
  danger:
    "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 active:bg-danger/30",
  outline:
    "bg-transparent text-fg border border-border hover:bg-bg-hover active:bg-bg-subtle",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2.5",
  icon: "h-9 w-9 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      className,
      children,
      type = "button",
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "disabled:opacity-50 disabled:pointer-events-none",
          "cursor-pointer select-none",
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
