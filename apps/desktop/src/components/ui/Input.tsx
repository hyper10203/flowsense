import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils.js";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, error, ...rest }, ref) {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            "w-full h-9 px-3 rounded-lg text-sm",
            "bg-bg border border-border",
            "text-fg placeholder:text-fg-subtle",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-danger/60 focus:ring-danger/40",
            className
          )}
          {...rest}
        />
        {error && (
          <p className="mt-1 text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }
);
