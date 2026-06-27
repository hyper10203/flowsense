import { cn } from "../../lib/utils.js";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface AccentSelectProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  className?: string;
  placeholder?: string;
}

export function AccentSelect<T extends string>({
  value,
  onChange,
  options,
  className,
  placeholder,
}: AccentSelectProps<T>): JSX.Element {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn(
        "h-9 px-3 pr-8 rounded-lg text-sm appearance-none",
        "bg-bg border border-border",
        "text-fg",
        "transition-colors duration-150",
        "focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
