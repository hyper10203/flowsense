import { motion } from "framer-motion";
import { Globe, Monitor } from "lucide-react";
import type { ActivityEvent } from "@flowsense/shared";
import { formatTime, formatDuration } from "../../lib/utils.js";
import { cn } from "../../lib/utils.js";

interface TimelineItemProps {
  event: ActivityEvent;
  index: number;
  variant?: "compact" | "full";
}

export function TimelineItem({
  event,
  index,
  variant = "full",
}: TimelineItemProps): JSX.Element {
  const isCompact = variant === "compact";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      className={cn(
        "group flex items-start gap-3 rounded-lg",
        isCompact ? "py-1.5 px-2" : "py-2.5 px-3",
        "hover:bg-bg-hover transition-colors"
      )}
    >
      <div className="relative flex flex-col items-center pt-1">
        <div
          className={cn(
            "rounded-md flex items-center justify-center shrink-0",
            isCompact ? "w-6 h-6" : "w-8 h-8",
            "bg-bg-elevated border border-border-subtle text-fg-subtle"
          )}
        >
          {event.url ? <Globe size={isCompact ? 11 : 13} /> : <Monitor size={isCompact ? 11 : 13} />}
        </div>
        <div className="w-px flex-1 bg-border-subtle mt-1" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={cn("text-fg truncate", isCompact ? "text-xs" : "text-sm")}>
            {event.window_title}
          </span>
          <span className="text-[10px] text-fg-subtle font-mono whitespace-nowrap">
            {formatTime(event.timestamp)}
          </span>
        </div>
        <div className="text-xs text-fg-muted truncate">
          {event.application}
          {event.url && (
            <span className="ml-2 text-fg-subtle">· {event.url}</span>
          )}
        </div>
      </div>
      <div className="text-xs text-fg-muted whitespace-nowrap font-mono">
        {formatDuration(event.duration_ms)}
      </div>
    </motion.div>
  );
}
