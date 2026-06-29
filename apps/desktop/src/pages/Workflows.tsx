import { useState } from "react";
import { Brain, Pencil, Sparkles, Workflow } from "lucide-react";
import {
  useAcceptSuggestion,
  useAiErrorToasts,
  useDismissSuggestion,
  useRenameWorkflow,
  useStartFlow,
  useSuggestions,
  useWorkflows,
} from "../hooks/use-api.js";
import { useApp } from "../store.jsx";
import { ErrorState } from "../components/ui/ErrorState.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import { WorkflowCard } from "../components/workflows/WorkflowCard.jsx";
import type { Workflow as WorkflowType } from "@flowsense/shared";

type Tab = "workflows" | "suggestions";

export function WorkflowsPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>("workflows");
  const { data: workflows, isLoading: wfLoading, isError: wfError, refetch: refetchWf } = useWorkflows();
  const { data: suggestions, isLoading: sgLoading, refetch: refetchSg } = useSuggestions();
  const rename = useRenameWorkflow();
  const acceptSuggestion = useAcceptSuggestion();
  const dismissSuggestion = useDismissSuggestion();
  const startFlow = useStartFlow();
  const { setActiveFlow } = useApp();
  useAiErrorToasts();

  const handleStartFlow = (workflowId: number) => {
    startFlow.mutate(workflowId, {
      onSuccess: () => {
        fetch("http://127.0.0.1:8000/api/v1/flows/active")
          .then((r) => r.json())
          .then((data) => {
            if (data) setActiveFlow(data);
          })
          .catch(() => {});
      },
    });
  };

  const handleRename = (wf: WorkflowType, newName: string) => {
    rename.mutate({ id: wf.id, name: newName });
  };

  const allWorkflows = workflows ?? [];
  const allSuggestions = suggestions ?? [];
  // Merge: show accepted workflows + pending suggestions together
  const mergedItems = [
    ...allWorkflows.map((w) => ({ type: "workflow" as const, data: w })),
    ...allSuggestions
      .filter((s) => s.status === "pending")
      .map((s) => ({ type: "suggestion" as const, data: s.workflow })),
  ];

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Workflows</h1>
          <p className="text-sm text-fg-muted">
            Detected patterns and AI suggestions — all in one place.
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-subtle border border-border w-fit">
        <button
          type="button"
          onClick={() => setTab("workflows")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            tab === "workflows"
              ? "bg-accent/10 text-accent"
              : "text-fg-subtle hover:text-fg"
          }`}
        >
          <Workflow size={13} />
          Saved ({allWorkflows.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("suggestions")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            tab === "suggestions"
              ? "bg-accent/10 text-accent"
              : "text-fg-subtle hover:text-fg"
          }`}
        >
          <Sparkles size={13} />
          AI suggestions ({allSuggestions.filter((s) => s.status === "pending").length})
        </button>
      </div>

      {wfError && tab === "workflows" && !wfLoading && (
        <ErrorState title="Couldn't load workflows" onRetry={() => refetchWf()} />
      )}

      {wfLoading && tab === "workflows" && (
        <div className="space-y-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {sgLoading && tab === "suggestions" && (
        <div className="space-y-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {/* Workflows tab */}
      {tab === "workflows" && !wfLoading && !wfError && allWorkflows.length === 0 && (
        <EmptyState
          icon={<Workflow />}
          title="No workflows yet"
          description="Workflows appear once FlowSense detects repeated patterns across your apps."
        />
      )}

      {tab === "workflows" && (
        <div className="space-y-3">
          {allWorkflows.map((w, i) => (
            <WorkflowCard
              key={w.id}
              workflow={w}
              onRename={(name) => handleRename(w, name)}
              onStartFlow={handleStartFlow}
              delay={i * 0.05}
            />
          ))}
        </div>
      )}

      {/* Suggestions tab */}
      {tab === "suggestions" && !sgLoading && allSuggestions.length === 0 && (
        <EmptyState
          icon={<Brain />}
          title="No AI suggestions"
          description="AI suggestions appear when FlowSense finds new patterns worth naming."
        />
      )}

      {tab === "suggestions" && (
        <div className="space-y-3">
          {allSuggestions.map((s, i) =>
            s.workflow ? (
              <div
                key={s.id}
                className="relative p-4 rounded-xl bg-bg-elevated/60 border border-border/50 space-y-2"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-2 text-[10px] font-semibold text-accent uppercase tracking-wider">
                  <Sparkles size={11} />
                  AI suggestion
                </div>
                <div className="text-sm font-semibold text-fg">
                  {s.workflow.ai_name ?? "Untitled"}
                </div>
                {s.workflow.description && (
                  <p className="text-xs text-fg-subtle">{s.workflow.description}</p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => acceptSuggestion.mutate(s.id)}
                    className="px-3 py-1 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissSuggestion.mutate(s.id)}
                    className="px-3 py-1 rounded-lg bg-bg-subtle hover:bg-border text-fg-subtle text-xs font-medium transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
