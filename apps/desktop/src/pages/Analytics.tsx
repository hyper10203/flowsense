import { useMemo } from "react";
import {
  Activity,
  Clock,
  Layers,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  useAnalyticsSummary,
  useAppUsage,
  useDailyTrend,
  useWorkflows,
} from "../hooks/use-api.js";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ErrorState } from "../components/ui/ErrorState.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import { MetricCard } from "../components/analytics/MetricCard.jsx";
import { TrendChart } from "../components/analytics/TrendChart.jsx";
import {
  buildMockAnalytics,
  buildMockAppUsage,
  buildMockDailyTrend,
  buildMockWorkflows,
} from "../lib/mock-data.js";
import { formatMinutes } from "../lib/utils.js";

const COLORS = ["#7c5cff", "#3dd980", "#f5b731", "#ff5c7a", "#3aa0ff", "#9279ff"];

export function AnalyticsPage(): JSX.Element {
  const { data: summary, isLoading, isError, refetch } = useAnalyticsSummary();
  const { data: trend } = useDailyTrend(30);
  const { data: usage } = useAppUsage();
  const { data: workflows } = useWorkflows();

  const s = useMemo(() => summary ?? buildMockAnalytics(), [summary]);
  const t = useMemo(() => trend ?? buildMockDailyTrend(30), [trend]);
  const u = useMemo(() => usage ?? buildMockAppUsage(), [usage]);
  const w = useMemo(() => workflows ?? buildMockWorkflows(), [workflows]);

  if (isError && !summary) {
    return (
      <div className="p-6">
        <ErrorState
          title="Couldn't load analytics"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Analytics</h1>
          <p className="text-sm text-fg-muted">
            Trends, habits, and time allocation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <MetricCard
              label="Productive"
              value={formatMinutes(s.productive_minutes)}
              hint="last 24 hours"
              icon={<Clock size={20} />}
              accent="accent"
              delay={0}
            />
            <MetricCard
              label="Idle"
              value={formatMinutes(s.idle_minutes)}
              hint="last 24 hours"
              icon={<Activity size={20} />}
              accent="warning"
              delay={0.05}
            />
            <MetricCard
              label="App switches"
              value={s.app_switches}
              hint="today"
              icon={<Layers size={20} />}
              accent="success"
              delay={0.1}
            />
            <MetricCard
              label="Workflows"
              value={w.length}
              hint="detected"
              icon={<Zap size={20} />}
              delay={0.15}
            />
          </>
        )}
      </div>

      <TrendChart data={t} loading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-4">
          <div className="text-sm font-medium text-fg mb-2">App distribution</div>
          <div className="h-64">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={u}
                    dataKey="minutes"
                    nameKey="application"
                    innerRadius={64}
                    outerRadius={92}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {u.map((entry, i) => (
                      <Cell
                        key={entry.application}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#16161f",
                      border: "1px solid #23232f",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "#e8e8f0",
                    }}
                    formatter={(v: unknown, name: unknown) => [
                      formatMinutes(Number(v)),
                      String(name),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border-subtle bg-bg-surface p-4">
          <div className="text-sm font-medium text-fg mb-3">
            Top apps by time
          </div>
          <div className="space-y-3">
            {s.most_used_apps.map((app, i) => {
              const total = s.most_used_apps.reduce((a, b) => a + b.minutes, 0);
              const pct = total > 0 ? Math.round((app.minutes / total) * 100) : 0;
              return (
                <div key={app.application} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-fg">{app.application}</span>
                    <span className="text-fg-muted">
                      {formatMinutes(app.minutes)} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {s.most_used_apps.length === 0 && (
              <div className="text-xs text-fg-muted">No apps tracked yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border-subtle bg-bg-surface p-4">
        <div className="flex items-center gap-2 text-sm text-fg-muted mb-2">
          <TrendingUp size={14} />
          <span>Last 7 days summary</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg bg-bg-elevated p-3">
            <div className="text-xs text-fg-muted">Avg productive / day</div>
            <div className="text-lg font-semibold text-fg mt-0.5">
              {formatMinutes(
                Math.round(
                  t.slice(-7).reduce((a, b) => a + b.productive_minutes, 0) /
                    Math.max(1, t.slice(-7).length)
                )
              )}
            </div>
          </div>
          <div className="rounded-lg bg-bg-elevated p-3">
            <div className="text-xs text-fg-muted">Total productive</div>
            <div className="text-lg font-semibold text-fg mt-0.5">
              {formatMinutes(t.slice(-7).reduce((a, b) => a + b.productive_minutes, 0))}
            </div>
          </div>
          <div className="rounded-lg bg-bg-elevated p-3">
            <div className="text-xs text-fg-muted">Avg idle / day</div>
            <div className="text-lg font-semibold text-fg mt-0.5">
              {formatMinutes(
                Math.round(
                  t.slice(-7).reduce((a, b) => a + b.idle_minutes, 0) /
                    Math.max(1, t.slice(-7).length)
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
