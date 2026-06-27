import { Toggle } from "../ui/Toggle.jsx";

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: ToggleRowProps): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-fg">{label}</div>
        {description && (
          <div className="text-xs text-fg-muted mt-0.5">{description}</div>
        )}
      </div>
      <Toggle
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
