import type { ReactNode } from "react";
import { cn } from "../../lib/utils.js";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className
      )}
    >
      {icon && (
        <div className="mb-3 text-fg-subtle [&>svg]:w-10 [&>svg]:h-10">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-fg">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-fg-muted max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
