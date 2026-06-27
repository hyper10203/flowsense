import { useMemo } from "react";
import {
  Clock,
  Layers,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useActivityList, useAnalyticsSummary } from "../hooks/use-api.js";
import { ActivityFeed } from "../components/dashboard/ActivityFeed.jsx";
import { AppUsageChart } from "../components/dashboard/AppUsageChart.jsx";
import { HourlyChart } from "../components/dashboard/HourlyChart.jsx";
import { StatCard } from "../components/dashboard/StatCard.jsx";
import { ErrorState } from "../components/ui/ErrorState.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import { buildMockActivity, buildMockAnalytics } from "../lib/mock-data.js";
import { formatMinutes } from "../lib/utils.js";

export function DashboardPage(): JSX.Element {
  const {
    data: activityData,
    isLoading: activityLoading,
    isError: activityError,
    refetch: refetchActivity,
  } = useActivityList({ limit: 50 });

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useAnalyticsSummary();

  const mockActivity = useMemo(() => buildMockActivity(50), []);
  const activity = useMemo(
    () => activityData ?? mockActivity,
    [activityData, mockActivity]
  );
  const activityItems = activity.items;
  const analytics = useMemo(
    () => analyticsData ?? buildMockAnalytics(),
    [analyticsData]
  );

  const todayMinutes = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return activityItems
      .filter((e) => e.timestamp.startsWith(today))
      .reduce((acc, e) => acc + e.duration_ms, 0);
  }, [activityItems]);

  const mostUsed = analytics.most_used_apps[0];

  if (activityError && analyticsError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Couldn't load dashboard"
          description="Backend is unreachable and mock data failed to load."
          onRetry={() => {
            refetchActivity();
            refetchAnalytics();
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Dashboard</h1>
          <p className="text-sm text-fg-muted">
            Today's focus at a glance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            refetchActivity();
            refetchAnalytics();
          }}
          className="text-fg-muted hover:text-fg transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsLoading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <StatCard
              label="Active time today"
              value={formatMinutes(Math.round(todayMinutes / 60000))}
              hint="across all apps"
              icon={<Clock size={20} />}
              accent="accent"
              delay={0}
            />
            <StatCard
              label="Most used"
              value={mostUsed?.application ?? "—"}
              hint={
                mostUsed ? formatMinutes(mostUsed.minutes) : "No data yet"
              }
              icon={<TrendingUp size={20} />}
              delay={0.05}
            />
            <StatCard
              label="App switches"
              value={analytics.app_switches}
              hint="today"
              icon={<Layers size={20} />}
              accent="success"
              delay={0.1}
            />
            <StatCard
              label="Workflows"
              value={analytics.workflow_count}
              hint="detected"
              icon={<Zap size={20} />}
              accent="warning"
              delay={0.15}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <HourlyChart loading={analyticsLoading} />
        </div>
        <div>
          <AppUsageChart loading={analyticsLoading} />
        </div>
      </div>

      <div className="max-h-96">
        <ActivityFeed
          events={activityItems}
          loading={activityLoading}
          title="Recent activity"
          limit={10}
        />
      </div>
    </div>
  );
}
