import { motion } from "framer-motion";
import { Globe, Monitor } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../ui/Card.jsx";
import { EmptyState } from "../ui/EmptyState.jsx";
import { Skeleton } from "../ui/Skeleton.jsx";
import type { ActivityEvent } from "@flowsense/shared";
import { formatRelative, formatDuration } from "../../lib/utils.js";

interface ActivityFeedProps {
  events: ActivityEvent[];
  loading?: boolean;
  title?: string;
  limit?: number;
}

export function ActivityFeed({
  events,
  loading,
  title = "Recent activity",
  limit = 8,
}: ActivityFeedProps): JSX.Element {
  const visible = events.slice(0, limit);
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <div className="flex-1 overflow-auto px-4 pb-4 space-y-1">
        {loading && <Skeleton lines={5} />}
        {!loading && visible.length === 0 && (
          <EmptyState
            title="No activity yet"
            description="Start monitoring to see your app usage here."
          />
        )}
        {!loading &&
          visible.map((e, i) => (
            <motion.div
              key={`${e.id ?? i}-${e.timestamp}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: i * 0.03 }}
              className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-bg-hover transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-bg-elevated border border-border-subtle flex items-center justify-center text-fg-subtle">
                {e.url ? <Globe size={13} /> : <Monitor size={13} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-fg truncate">{e.window_title}</div>
                <div className="text-xs text-fg-muted truncate">
                  {e.application} · {formatDuration(e.duration_ms)}
                </div>
              </div>
              <div className="text-[10px] text-fg-subtle whitespace-nowrap">
                {formatRelative(e.timestamp)}
              </div>
            </motion.div>
          ))}
      </div>
    </Card>
  );
}
