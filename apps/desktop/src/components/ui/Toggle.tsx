import { cn } from "../../lib/utils.js";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}: ToggleProps): JSX.Element {
  const toggleId = id ?? `toggle-${Math.random().toString(36).slice(2)}`;
  return (
    <label
      htmlFor={toggleId}
      className={cn(
        "flex items-start justify-between gap-3 group",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      )}
    >
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <div className="text-sm font-medium text-fg">{label}</div>
          )}
          {description && (
            <div className="text-xs text-fg-muted mt-0.5">{description}</div>
          )}
        </div>
      )}
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full",
          "transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          checked ? "bg-accent" : "bg-bg-hover border border-border"
        )}
      >
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </button>
    </label>
  );
}
