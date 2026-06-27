import { Badge } from "../ui/Badge.jsx";
import { cn } from "../../lib/utils.js";

interface ConfidenceBadgeProps {
  value: number;
  className?: string;
}

export function ConfidenceBadge({ value, className }: ConfidenceBadgeProps): JSX.Element {
  const pct = Math.round(value * 100);
  const variant = pct >= 80 ? "success" : pct >= 50 ? "warning" : "default";
  return (
    <Badge variant={variant} className={cn("font-mono", className)}>
      {pct}%
    </Badge>
  );
}
