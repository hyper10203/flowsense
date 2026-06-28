import { useMemo } from "react";
import { Workflow } from "lucide-react";
import {
  useAcceptWorkflow,
  useDismissWorkflow,
  useWorkflows,
} from "../hooks/use-api.js";
import { ErrorState } from "../components/ui/ErrorState.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import { WorkflowCard } from "../components/workflows/WorkflowCard.jsx";

export function WorkflowsPage(): JSX.Element {
  const { data, isLoading, isError, refetch } = useWorkflows();
  const accept = useAcceptWorkflow();
  const dismiss = useDismissWorkflow();

  const workflows = data ?? [];

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Workflows</h1>
          <p className="text-sm text-fg-muted">
            Detected patterns in your daily routine.
          </p>
        </div>
      </div>

      {isError && !isLoading && (
        <ErrorState
          title="Couldn't load workflows"
          onRetry={() => refetch()}
        />
      )}

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {!isLoading && !isError && workflows.length === 0 && (
        <EmptyState
          icon={<Workflow />}
          title="No workflows yet"
          description="Workflows appear once FlowSense detects repeated patterns across your apps."
        />
      )}

      <div className="space-y-3">
        {workflows.map((w, i) => (
          <WorkflowCard
            key={w.id}
            workflow={w}
            onAccept={(id) => accept.mutate(id)}
            onDismiss={(id) => dismiss.mutate(id)}
            delay={i * 0.05}
          />
        ))}
      </div>
    </div>
  );
}
