import { cn } from "../../lib/utils.js";

interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  formatValue?: (v: number) => string;
  className?: string;
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  formatValue,
  className,
}: SliderProps): JSX.Element {
  const display = formatValue ? formatValue(value) : String(value);
  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || display) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-fg-muted">{label}</span>}
          <span className="text-xs font-mono text-fg">{display}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "w-full h-1.5 rounded-full appearance-none cursor-pointer",
          "bg-bg-hover",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110",
          "[&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
        )}
      />
    </div>
  );
}
