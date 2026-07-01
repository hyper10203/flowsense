import { ArrowRight } from "lucide-react";
import type { WorkflowStep } from "@flowsense/shared";

interface WorkflowStepsProps {
  steps: WorkflowStep[];
}

export function WorkflowSteps({ steps }: WorkflowStepsProps): JSX.Element {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-fg-muted uppercase tracking-wider mb-2">
        Steps
      </div>
      {steps.map((step, i) => (
        <div
          key={`${step.step_order}-${i}`}
          className="flex items-center gap-2 text-sm"
        >
          <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-[10px] font-mono flex items-center justify-center shrink-0">
            {step.step_order}
          </span>
          <span className="text-fg truncate">{step.application}</span>
          <span className="text-fg-muted truncate flex-1">
            · {step.url_pattern || step.window_title}
          </span>
          {i < steps.length - 1 && (
            <ArrowRight size={12} className="text-fg-subtle shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
