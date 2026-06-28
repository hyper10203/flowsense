import type {
  ActivityEvent,
  ActivityListResponse,
  AnalyticsSummary,
  AppUsagePoint,
  DailyTrendPoint,
  Settings,
  Suggestion,
  Workflow,
} from "@flowsense/shared";
import { ipc } from "./ipc.js";

const BASE_URL = "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  try {
    const res = await fetch(url, { ...init, headers });
    if (!res.ok) {
      throw new ApiError(`Request failed: ${res.statusText}`, res.status);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Backend unreachable", 0);
  }
}

export const api = {
  activity: {
    list: (params: { limit?: number; offset?: number; app?: string } = {}) =>
      request<ActivityListResponse>(
        `/activity?${new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).map(([k, v]) => [k, String(v)])
          )
        )}`
      ),
    create: (event: Partial<ActivityEvent>) =>
      request<ActivityEvent>("/activity", {
        method: "POST",
        body: JSON.stringify(event),
      }),
  },
  analytics: {
    summary: () => request<AnalyticsSummary>("/analytics/summary"),
    dailyTrend: (days = 30) =>
      request<DailyTrendPoint[]>(`/analytics/trend?days=${days}`),
    appUsage: () => request<AppUsagePoint[]>(`/analytics/app-usage`),
    hourly: () => request<{ hour: string; minutes: number }[]>("/analytics/hourly"),
  },
  workflows: {
    list: () => request<Workflow[]>("/workflows"),
    dismiss: async (id: number) => { await request<void>(`/workflows/${id}/dismiss`, { method: "POST" }); },
    accept: async (id: number) => { await request<void>(`/workflows/${id}/accept`, { method: "POST" }); },
  },
  suggestions: {
    list: () => request<Suggestion[]>("/suggestions"),
    accept: async (id: number) => { await request<void>(`/suggestions/${id}/accept`, { method: "POST" }); },
    dismiss: async (id: number) => { await request<void>(`/suggestions/${id}/dismiss`, { method: "POST" }); },
  },
  settings: {
    get: () => request<Settings>("/settings"),
    update: async (key: keyof Settings, value: Settings[keyof Settings]) => {
      await request<void>("/settings", {
        method: "PATCH",
        body: JSON.stringify({ key, value }),
      });
    },
  },
};

export async function isBackendReachable(): Promise<boolean> {
  try {
    await fetch(`${BASE_URL}/health`, { method: "GET" });
    return true;
  } catch {
    return false;
  }
}

export async function trackActivityLocally(
  payload: Partial<ActivityEvent>
): Promise<void> {
  try {
    await api.activity.create(payload);
  } catch {
    // Backend unreachable — silently drop; renderer shows mock data.
  }
}

export { ipc };
