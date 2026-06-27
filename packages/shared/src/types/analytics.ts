export interface AnalyticsSummary {
  productive_minutes: number;
  idle_minutes: number;
  app_switches: number;
  most_used_apps: { application: string; minutes: number }[];
  workflow_count: number;
}

export interface TimelinePoint {
  timestamp: string;
  application: string;
  duration_ms: number;
}

export interface AppUsagePoint {
  application: string;
  minutes: number;
  percentage: number;
}

export interface DailyTrendPoint {
  date: string;
  productive_minutes: number;
  idle_minutes: number;
}

export interface HeatmapCell {
  day: number;
  hour: number;
  value: number;
}
