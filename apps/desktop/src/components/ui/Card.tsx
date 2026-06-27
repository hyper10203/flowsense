import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils.js";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const PADDING: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  children,
  className,
  interactive = false,
  padding = "md",
  ...rest
}: CardProps): JSX.Element {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-subtle bg-bg-surface",
        PADDING[padding],
        interactive &&
          "cursor-pointer transition-colors duration-150 hover:bg-bg-hover hover:border-border",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 mb-3", className)}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <h3 className={cn("text-sm font-medium text-fg", className)}>{children}</h3>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <p className={cn("text-xs text-fg-muted", className)}>{children}</p>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return <div className={cn("space-y-2", className)}>{children}</div>;
}
