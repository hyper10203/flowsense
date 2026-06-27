import { useMemo, useState } from "react";
import { useActivityList } from "../hooks/use-api.js";
import { Card } from "../components/ui/Card.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { ErrorState } from "../components/ui/ErrorState.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import {
  FilterBar,
  type TimelineFilters,
} from "../components/timeline/FilterBar.jsx";
import { TimelineGroup } from "../components/timeline/TimelineGroup.jsx";
import { buildMockActivity } from "../lib/mock-data.js";
import { groupBy, startOfDay, startOfMonth, startOfWeek } from "../lib/utils.js";
import type { ActivityEvent } from "@flowsense/shared";

function filterEvents(
  events: ActivityEvent[],
  filters: TimelineFilters
): ActivityEvent[] {
  const now = new Date();
  return events.filter((e) => {
    if (filters.app !== "all" && e.application !== filters.app) return false;
    const d = new Date(e.timestamp);
    if (filters.date === "today") {
      if (d < startOfDay(now)) return false;
    } else if (filters.date === "week") {
      if (d < startOfWeek(now)) return false;
    } else if (filters.date === "month") {
      if (d < startOfMonth(now)) return false;
    }
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const hay = `${e.application} ${e.window_title} ${e.url ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function TimelinePage(): JSX.Element {
  const [filters, setFilters] = useState<TimelineFilters>({
    app: "all",
    date: "all",
    query: "",
  });
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data, isLoading, isError, refetch } = useActivityList({
    limit: pageSize * page,
  });

  const events = useMemo(() => data?.items ?? buildMockActivity(100).items, [data]);
  const apps = useMemo(
    () => Array.from(new Set(events.map((e) => e.application))).sort(),
    [events]
  );
  const filtered = useMemo(() => filterEvents(events, filters), [events, filters]);
  const grouped = useMemo(
    () => groupBy(filtered, (e) => startOfDay(new Date(e.timestamp)).toISOString()),
    [filtered]
  );
  const sortedKeys = useMemo(
    () => Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1)),
    [grouped]
  );

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Timeline</h1>
          <p className="text-sm text-fg-muted">
            Chronological stream of your activity.
          </p>
        </div>
      </div>

      <FilterBar value={filters} onChange={setFilters} apps={apps} />

      <Card padding="none" className="overflow-hidden">
        {isError && !isLoading && (
          <ErrorState
            title="Couldn't load timeline"
            onRetry={() => refetch()}
          />
        )}
        {isLoading && (
          <div className="p-4">
            <Skeleton lines={6} />
          </div>
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            title="No matching events"
            description="Try adjusting your filters."
          />
        )}
        {!isLoading &&
          sortedKeys.map((key) => (
            <TimelineGroup key={key} date={key} events={grouped[key]} />
          ))}
      </Card>

      {!isLoading && filtered.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="text-xs text-fg-muted hover:text-fg transition-colors px-3 py-1.5 rounded-md bg-bg-elevated border border-border"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
