import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { useActivityList } from "../hooks/use-api.js";
import { Card } from "../components/ui/Card.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import { SearchBar } from "../components/search/SearchBar.jsx";
import { TimelineItem } from "../components/timeline/TimelineItem.jsx";
import { buildMockActivity } from "../lib/mock-data.js";
import { ipc } from "../lib/ipc.js";

function fuzzy(haystack: string, needle: string): boolean {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (h.includes(n)) return true;
  let i = 0;
  for (let j = 0; j < h.length && i < n.length; j++) {
    if (h[j] === n[i]) i++;
  }
  return i === n.length;
}

export function SearchPage(): JSX.Element {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useActivityList({ limit: 200 });
  const events = useMemo(() => data?.items ?? buildMockActivity(200).items, [data]);

  const filtered = useMemo(() => {
    if (!query.trim()) return events.slice(0, 20);
    return events
      .filter(
        (e) =>
          fuzzy(e.application, query) ||
          fuzzy(e.window_title, query) ||
          (e.url && fuzzy(e.url, query))
      )
      .slice(0, 50);
  }, [query, events]);

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-fg">Search</h1>
        <p className="text-sm text-fg-muted">
          Find apps, URLs, and titles across your activity.
        </p>
      </div>

      <SearchBar
        value={query}
        onChange={setQuery}
        autoFocus
        placeholder="Search by app, URL, or title…"
      />

      <Card padding="none" className="overflow-hidden">
        {isLoading && (
          <div className="p-4">
            <Skeleton lines={6} />
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon={<SearchIcon />}
            title={query ? "No results" : "Start typing"}
            description={
              query
                ? `No activity matches "${query}".`
                : "Search across all your tracked activity."
            }
          />
        )}
        {!isLoading && filtered.length > 0 && (
          <div className="divide-y divide-border-subtle">
            {filtered.map((e, i) => (
              <button
                key={`${e.id ?? i}-${e.timestamp}`}
                type="button"
                onClick={() => e.url && ipc().system.openExternal(e.url)}
                className="w-full text-left hover:bg-bg-hover transition-colors"
              >
                <div className="px-3">
                  <TimelineItem event={e} index={i} variant="compact" />
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {filtered.length > 0 && (
        <div className="text-xs text-fg-subtle text-center">
          {filtered.length} result{filtered.length === 1 ? "" : "s"} · click an
          item with a URL to open it
        </div>
      )}
    </div>
  );
}
