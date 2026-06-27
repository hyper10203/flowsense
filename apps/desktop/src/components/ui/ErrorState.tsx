import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils.js";
import { Button } from "./Button.jsx";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  actionLabel?: string;
  icon?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this. Try again in a moment.",
  onRetry,
  actionLabel = "Retry",
  icon,
  className,
}: ErrorStateProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className
      )}
    >
      <div className="mb-3 text-danger">
        {icon ?? <AlertTriangle className="w-10 h-10" />}
      </div>
      <h3 className="text-sm font-medium text-fg">{title}</h3>
      <p className="mt-1 text-xs text-fg-muted max-w-sm">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
