import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader, CardTitle } from "../ui/Card.jsx";
import { Skeleton } from "../ui/Skeleton.jsx";

interface HourlyPoint {
  hour: string;
  minutes: number;
}

interface HourlyChartProps {
  data?: HourlyPoint[];
  loading?: boolean;
}

export function HourlyChart({ data, loading }: HourlyChartProps): JSX.Element {
  const hasData = data && data.length > 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Hourly activity</CardTitle>
      </CardHeader>
      <div className="h-56 px-2 pb-2">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : !hasData ? (
          <div className="h-full flex items-center justify-center text-xs text-fg-muted">
            No hourly data yet — keep tracking to see your activity by hour.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fill: "#6a6a80", fontSize: 10 }}
                axisLine={{ stroke: "#23232f" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6a6a80", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#16161f",
                  border: "1px solid #23232f",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#e8e8f0",
                }}
                cursor={{ fill: "rgba(124,92,255,0.06)" }}
                formatter={(v: unknown) => [`${v} min`, "Active"]}
              />
              <Bar
                dataKey="minutes"
                fill="#7c5cff"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
