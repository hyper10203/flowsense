import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle } from "../ui/Card.jsx";
import { Skeleton } from "../ui/Skeleton.jsx";
import { formatMinutes } from "../../lib/utils.js";

const COLORS = ["#7c5cff", "#3dd980", "#f5b731", "#ff5c7a", "#3aa0ff", "#9279ff"];

interface AppUsageChartProps {
  data?: { application: string; minutes: number; percentage: number }[];
  loading?: boolean;
}

export function AppUsageChart({ data, loading }: AppUsageChartProps): JSX.Element {
  const chartData = data ?? [];
  const total = useMemo(
    () => chartData.reduce((acc, p) => acc + p.minutes, 0),
    [chartData]
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>App usage</CardTitle>
      </CardHeader>
      <div className="flex gap-4 px-4 pb-4 items-center">
        <div className="w-36 h-36 shrink-0">
          {loading ? (
            <Skeleton className="w-full h-full rounded-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="minutes"
                  nameKey="application"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={2}
                  stroke="none"
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
        <div className="flex-1 space-y-2 min-w-0">
          {chartData.map((item, i) => (
            <div
              key={item.application}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="text-fg truncate flex-1">{item.application}</span>
              <span className="text-fg-muted whitespace-nowrap">
                {formatMinutes(item.minutes)} · {Math.round((item.minutes / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
