import type {
  ActivityEvent,
  ActivityListResponse,
  AnalyticsSummary,
  AppUsagePoint,
  ActiveFlowSession,
  DailyTrendPoint,
  FlowSession,
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
    rename: async (id: number, name: string) => {
      const r = await request<{ success: boolean; name: string }>(`/workflows/${id}/rename`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      return r;
    },
  },
  flows: {
    start: (workflowId: number) =>
      request<{ id: number; workflow_id: number; status: string; steps_completed: number; started_at: string }>("/flows/start", {
        method: "POST",
        body: JSON.stringify({ workflow_id: workflowId }),
      }),
    stop: (sessionId: number, stepsCompleted = 0) =>
      request<FlowSession>(`/flows/${sessionId}/stop`, {
        method: "POST",
        body: JSON.stringify({ steps_completed: stepsCompleted }),
      }),
    active: () => request<ActiveFlowSession | null>("/flows/active"),
    history: (limit = 50) => request<FlowSession[]>(`/flows/history?limit=${limit}`),
    updateStep: (sessionId: number, stepsCompleted: number) =>
      request<{ success: boolean; steps_completed: number }>(`/flows/${sessionId}/step?steps_completed=${stepsCompleted}`, { method: "POST" }),
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
