import type { ReactNode } from "react";
import { cn } from "../../lib/utils.js";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "accent";

const STYLES: Record<BadgeVariant, string> = {
  default: "bg-bg-hover text-fg-muted border-border",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  accent: "bg-accent/10 text-accent border-accent/20",
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps): JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
