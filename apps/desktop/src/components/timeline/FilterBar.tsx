import { Search, X } from "lucide-react";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { AccentSelect } from "../ui/AccentSelect.jsx";

export interface TimelineFilters {
  app: string;
  date: string;
  query: string;
}

interface FilterBarProps {
  value: TimelineFilters;
  onChange: (v: TimelineFilters) => void;
  apps: string[];
}

export function FilterBar({ value, onChange, apps }: FilterBarProps): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-xs">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
        />
        <Input
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Search apps, URLs, titles…"
          className="pl-9"
        />
        {value.query && (
          <button
            type="button"
            onClick={() => onChange({ ...value, query: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <AccentSelect
        value={value.app}
        onChange={(v) => onChange({ ...value, app: v })}
        options={[
          { value: "all", label: "All apps" },
          ...apps.map((a) => ({ value: a, label: a })),
        ]}
      />
      <AccentSelect
        value={value.date}
        onChange={(v) => onChange({ ...value, date: v })}
        options={[
          { value: "all", label: "All time" },
          { value: "today", label: "Today" },
          { value: "week", label: "This week" },
          { value: "month", label: "This month" },
        ]}
      />
      {(value.query || value.app !== "all" || value.date !== "all") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({ app: "all", date: "all", query: "" })
          }
          aria-label="Reset filters"
        >
          Reset
        </Button>
      )}
    </div>
  );
}
