import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils.js";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export function Skeleton({
  className,
  lines,
  style,
  ...rest
}: SkeletonProps): JSX.Element {
  if (lines && lines > 1) {
    return (
      <div
        className={cn("space-y-2", className)}
        aria-busy="true"
        aria-live="polite"
        {...rest}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded bg-bg-hover animate-pulse"
            style={{
              width: i === lines - 1 ? "70%" : undefined,
              ...style,
            }}
          />
        ))}
      </div>
    );
  }
  return (
    <div
      className={cn("rounded bg-bg-hover animate-pulse", className)}
      aria-busy="true"
      aria-live="polite"
      style={style}
      {...rest}
    />
  );
}

