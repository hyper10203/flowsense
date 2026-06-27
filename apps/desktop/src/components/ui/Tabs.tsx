import { cn } from "../../lib/utils.js";

interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  variant?: "underline" | "pill";
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  variant = "pill",
}: TabsProps<T>): JSX.Element {
  if (variant === "underline") {
    return (
      <div className={cn("flex border-b border-border", className)}>
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors duration-150",
                "border-b-2 -mb-px",
                active
                  ? "text-fg border-accent"
                  : "text-fg-muted border-transparent hover:text-fg hover:border-border-strong"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-lg bg-bg-elevated border border-border-subtle",
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium",
              "transition-colors duration-150",
              active
                ? "bg-bg text-fg shadow-sm"
                : "text-fg-muted hover:text-fg"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
