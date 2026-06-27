import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "../ui/Card.jsx";
import { cn } from "../../lib/utils.js";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: "default" | "accent" | "success" | "warning" | "danger";
  delay?: number;
}

const ACCENT_TEXT: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  default: "text-fg",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  accent = "default",
  delay = 0,
}: MetricCardProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut", delay }}
    >
      <Card>
        <CardContent>
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider text-fg-muted font-medium">
                {label}
              </div>
              <div className={cn("text-2xl font-semibold", ACCENT_TEXT[accent])}>
                {value}
              </div>
              {hint && <div className="text-xs text-fg-muted">{hint}</div>}
            </div>
            {icon && (
              <div className="text-fg-subtle [&>svg]:w-5 [&>svg]:h-5">
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
