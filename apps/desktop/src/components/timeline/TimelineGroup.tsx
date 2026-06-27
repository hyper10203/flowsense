import type { ActivityEvent } from "@flowsense/shared";
import { TimelineItem } from "./TimelineItem.jsx";
import { formatDate } from "../../lib/utils.js";

interface TimelineGroupProps {
  date: string;
  events: ActivityEvent[];
  compact?: boolean;
}

export function TimelineGroup({
  date,
  events,
  compact = false,
}: TimelineGroupProps): JSX.Element {
  if (events.length === 0) return null;
  return (
    <div className="space-y-0.5">
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-sm px-3 py-2 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-fg-muted uppercase tracking-wider">
            {formatDate(date)}
          </div>
          <div className="text-[10px] text-fg-subtle font-mono">
            {events.length} events
          </div>
        </div>
      </div>
      <div className="py-1">
        {events.map((e, i) => (
          <TimelineItem
            key={`${e.id ?? i}-${e.timestamp}`}
            event={e}
            index={i}
            variant={compact ? "compact" : "full"}
          />
        ))}
      </div>
    </div>
  );
}
