import { useEffect, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  api,
  isBackendReachable,
  trackActivityLocally,
  type ApiError,
} from "../lib/api.js";
import type {
  ActivityEvent,
  ActivityListResponse,
  ActiveFlowSession,
  AnalyticsSummary,
  AppUsagePoint,
  DailyTrendPoint,
  FlowSession,
  Settings,
  Suggestion,
  Workflow,
} from "@flowsense/shared";
import { ipc } from "../lib/ipc.js";

export function useBackendReachable(): boolean {
  const { data } = useQuery({
    queryKey: ["backend-reachable"],
    queryFn: isBackendReachable,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  return Boolean(data);
}

export function useActivityList(params: {
  limit?: number;
  offset?: number;
  app?: string;
}) {
  return useQuery<ActivityListResponse, ApiError>({
    queryKey: ["activity-list", params],
    queryFn: () => api.activity.list(params),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}

export function useAnalyticsSummary() {
  return useQuery<AnalyticsSummary, ApiError>({
    queryKey: ["analytics-summary"],
    queryFn: api.analytics.summary,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useDailyTrend(days = 30) {
  return useQuery<DailyTrendPoint[], ApiError>({
    queryKey: ["daily-trend", days],
    queryFn: () => api.analytics.dailyTrend(days),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useAppUsage() {
  return useQuery<AppUsagePoint[], ApiError>({
    queryKey: ["app-usage"],
    queryFn: api.analytics.appUsage,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useHourlyActivity() {
  return useQuery<{ hour: string; minutes: number }[], ApiError>({
    queryKey: ["hourly-activity"],
    queryFn: api.analytics.hourly,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useWorkflows() {
  return useQuery<Workflow[], ApiError>({
    queryKey: ["workflows"],
    queryFn: api.workflows.list,
    refetchInterval: 30_000,
  });
}

export function useSuggestions() {
  return useQuery<Suggestion[], ApiError>({
    queryKey: ["suggestions"],
    queryFn: api.suggestions.list,
    refetchInterval: 30_000,
  });
}

export function useSettings() {
  return useQuery<Settings, ApiError>({
    queryKey: ["settings"],
    queryFn: api.settings.get,
    staleTime: Infinity,
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation<
    void,
    ApiError,
    { key: keyof Settings; value: Settings[keyof Settings] }
  >({
    mutationFn: (input) => api.settings.update(input.key, input.value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useAcceptWorkflow() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: (id) => api.workflows.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      ipc().notifications.show({
        title: "Workflow saved",
        body: "Workflow accepted and saved.",
        silent: true,
      });
    },
  });
}

export function useDismissWorkflow() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: (id) => api.workflows.dismiss(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
}

export function useAcceptSuggestion() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: (id) => api.suggestions.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suggestions"] });
      ipc().notifications.show({
        title: "Suggestion applied",
        body: "AI suggestion accepted.",
        silent: true,
      });
    },
  });
}

export function useDismissSuggestion() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: (id) => api.suggestions.dismiss(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suggestions"] }),
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: () => ipc().data.export(),
  });
}

export function useTrackActivity() {
  return useMutation<void, ApiError, Partial<ActivityEvent>>({
    mutationFn: (event) => trackActivityLocally(event),
  });
}

export function useActivityStream(): ActivityEvent[] {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  useEffect(() => {
    const unsub = ipc().activity.onTracked((payload) => {
      const p = payload as ActivityEvent;
      setEvents((prev) => [p, ...prev].slice(0, 200));
      void trackActivityLocally(p);
    });
    return () => {
      unsub();
    };
  }, []);
  return events;
}

export function useActiveFlow() {
  return useQuery<ActiveFlowSession | null, ApiError>({
    queryKey: ["active-flow"],
    queryFn: api.flows.active,
    refetchInterval: 5_000,
    staleTime: 2_000,
  });
}

export function useFlowHistory(limit = 50) {
  return useQuery<FlowSession[], ApiError>({
    queryKey: ["flow-history", limit],
    queryFn: () => api.flows.history(limit),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useStartFlow() {
  const qc = useQueryClient();
  return useMutation<{ id: number; workflow_id: number; status: string; steps_completed: number; started_at: string }, ApiError, number>({
    mutationFn: (workflowId) => api.flows.start(workflowId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active-flow"] });
      qc.invalidateQueries({ queryKey: ["flow-history"] });
      ipc().notifications.show({
        title: "Flow mode started",
        body: "Follow the steps to complete your workflow.",
        silent: true,
      });
    },
  });
}

export function useStopFlow() {
  const qc = useQueryClient();
  return useMutation<FlowSession, ApiError, { sessionId: number; stepsCompleted?: number }>({
    mutationFn: ({ sessionId, stepsCompleted = 0 }) => api.flows.stop(sessionId, stepsCompleted),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active-flow"] });
      qc.invalidateQueries({ queryKey: ["flow-history"] });
      ipc().notifications.show({
        title: "Flow mode ended",
        body: "Great session! Check your history for details.",
        silent: true,
      });
    },
  });
}
