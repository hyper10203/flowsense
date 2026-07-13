import { useMemo } from "react";
import {
  Clock,
  Layers,
  Play,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  useActivityList,
  useAnalyticsSummary,
  useHourlyActivity,
  useWorkflows,
} from "../hooks/use-api.js";
import { ActivityFeed } from "../components/dashboard/ActivityFeed.jsx";
import { AppUsageChart } from "../components/dashboard/AppUsageChart.jsx";
import { HourlyChart } from "../components/dashboard/HourlyChart.jsx";
import { StatCard } from "../components/dashboard/StatCard.jsx";
import { ErrorState } from "../components/ui/ErrorState.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import { formatMinutes } from "../lib/utils.js";
import { useApp } from "../store.jsx";
import { useStartFlow } from "../hooks/use-api.js";

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

  const { data: hourlyData } = useHourlyActivity();
  const { data: workflows } = useWorkflows();
  const startFlow = useStartFlow();
  const { setRoute } = useApp();

  const activityItems = activityData?.items ?? [];
  const analytics = analyticsData;
  const savedWorkflows = (workflows ?? []).slice(0, 6);

  const todayMinutes = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return activityItems
      .filter((e) => e.timestamp.startsWith(today))
      .reduce((acc, e) => acc + e.duration_ms, 0);
  }, [activityItems]);

  if (activityError && analyticsError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Couldn't load dashboard"
          description="Backend is unreachable. Start the backend and refresh."
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
              value={analytics?.most_used_apps[0]?.application ?? "—"}
              hint={
                analytics?.most_used_apps[0]
                  ? formatMinutes(analytics.most_used_apps[0].minutes)
                  : "No data yet"
              }
              icon={<TrendingUp size={20} />}
              delay={0.05}
            />
            <StatCard
              label="App switches"
              value={analytics?.app_switches ?? 0}
              hint="today"
              icon={<Layers size={20} />}
              accent="success"
              delay={0.1}
            />
            <StatCard
              label="Workflows"
              value={analytics?.workflow_count ?? 0}
              hint="detected"
              icon={<Zap size={20} />}
              accent="warning"
              delay={0.15}
            />
          </>
        )}
      </div>

      {/* Saved workflows — front and center on the home screen */}
      {savedWorkflows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg-subtle uppercase tracking-wider">
              Your workflows
            </h2>
            <button
              type="button"
              onClick={() => setRoute("workflows")}
              className="text-[11px] text-accent hover:text-accent/80 transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedWorkflows.map((wf) => (
              <div
                key={wf.id}
                className="group flex items-center gap-3 p-3 rounded-xl bg-bg-elevated/60 border border-border/50 hover:border-accent/30 hover:bg-bg-elevated transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Zap size={14} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-fg truncate">
                    {wf.ai_name ?? "Untitled workflow"}
                  </div>
                  <div className="text-[10px] text-fg-subtle">
                    {wf.frequency}× · {Math.round(wf.confidence * 100)}% conf
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => startFlow.mutate(wf.id)}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 hover:bg-accent/20 text-accent text-[10px] font-medium transition-all shrink-0"
                  aria-label={`Start ${wf.ai_name ?? "workflow"}`}
                >
                  <Play size={9} className="fill-accent" />
                  Start
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <HourlyChart data={hourlyData} loading={analyticsLoading} />
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
