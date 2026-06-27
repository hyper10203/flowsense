import { cn } from "../../lib/utils.js";

interface SpinnerProps {
  className?: string;
  size?: number;
}

export function Spinner({ className, size = 16 }: SpinnerProps): JSX.Element {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block rounded-full border-2 border-fg-subtle border-t-accent animate-spin",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
