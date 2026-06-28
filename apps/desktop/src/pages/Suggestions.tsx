import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import {
  useAcceptSuggestion,
  useDismissSuggestion,
  useSuggestions,
} from "../hooks/use-api.js";
import { ErrorState } from "../components/ui/ErrorState.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import { SuggestionCard } from "../components/suggestions/SuggestionCard.jsx";

export function SuggestionsPage(): JSX.Element {
  const { data, isLoading, isError, refetch } = useSuggestions();
  const accept = useAcceptSuggestion();
  const dismiss = useDismissSuggestion();

  const suggestions = data ?? [];
  const pending = useMemo(
    () => suggestions.filter((s) => s.status === "pending"),
    [suggestions]
  );
  const past = useMemo(
    () => suggestions.filter((s) => s.status !== "pending"),
    [suggestions]
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Suggestions</h1>
          <p className="text-sm text-fg-muted">
            AI-generated ideas for your workflows.
          </p>
        </div>
      </div>

      {isError && !isLoading && (
        <ErrorState
          title="Couldn't load suggestions"
          onRetry={() => refetch()}
        />
      )}

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      )}

      {!isLoading && !isError && suggestions.length === 0 && (
        <EmptyState
          icon={<Sparkles />}
          title="No suggestions yet"
          description="AI suggestions will appear here when FlowSense learns your patterns."
        />
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-fg-muted font-medium">
            Pending
          </h2>
          {pending.map((s, i) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onAccept={(id) => accept.mutate(id)}
              onDismiss={(id) => dismiss.mutate(id)}
              delay={i * 0.05}
            />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-fg-muted font-medium">
            Past
          </h2>
          {past.map((s, i) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onAccept={(id) => accept.mutate(id)}
              onDismiss={(id) => dismiss.mutate(id)}
              delay={i * 0.05}
            />
          ))}
        </div>
      )}
    </div>
  );
}
