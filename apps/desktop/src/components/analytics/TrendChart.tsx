import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader, CardTitle } from "../ui/Card.jsx";
import { Skeleton } from "../ui/Skeleton.jsx";
import { Tabs } from "../ui/Tabs.jsx";
import type { DailyTrendPoint } from "@flowsense/shared";

interface TrendChartProps {
  data?: DailyTrendPoint[];
  loading?: boolean;
}

type Range = "7d" | "30d" | "90d";

export function TrendChart({ data, loading }: TrendChartProps): JSX.Element {
  const [range, setRange] = useState<Range>("30d");

  const filtered = useMemo(() => {
    if (!data || data.length === 0) return [];
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    return data.slice(-days);
  }, [data, range]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Productivity trend</CardTitle>
        <Tabs<Range>
          items={[
            { value: "7d", label: "7d" },
            { value: "30d", label: "30d" },
            { value: "90d", label: "90d" },
          ]}
          value={range}
          onChange={setRange}
        />
      </CardHeader>
      <div className="h-72 px-2 pb-2">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filtered}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="productiveFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="idleFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff5c7a" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ff5c7a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6a6a80", fontSize: 10 }}
                axisLine={{ stroke: "#23232f" }}
                tickLine={false}
                tickFormatter={(v: string) => v.slice(5)}
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
                formatter={(v: unknown, name: unknown) => [
                  `${v} min`,
                  name === "productive_minutes" ? "Productive" : "Idle",
                ]}
                labelFormatter={(l: unknown) => String(l)}
              />
              <Area
                type="monotone"
                dataKey="productive_minutes"
                stroke="#7c5cff"
                strokeWidth={2}
                fill="url(#productiveFill)"
              />
              <Area
                type="monotone"
                dataKey="idle_minutes"
                stroke="#ff5c7a"
                strokeWidth={2}
                fill="url(#idleFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

