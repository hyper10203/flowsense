import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Circle, X } from "lucide-react";
import type { ActiveFlowSession } from "@flowsense/shared";
import { useActivityStream, useStopFlow } from "../../hooks/use-api.js";
import { Card } from "../ui/Card.jsx";

interface FlowOverlayProps {
  session: ActiveFlowSession;
  onClose: () => void;
}

export function FlowOverlay({ session, onClose }: FlowOverlayProps): JSX.Element {
  const stopFlow = useStopFlow();
  const events = useActivityStream();
  const steps = session.workflow?.steps ?? [];
  const currentStep = session.steps_completed;

  // Detect when user switches to the expected app → advance step
  const currentApp = events[0]?.application;
  useEffect(() => {
    if (!currentApp || currentStep >= steps.length) return;
    const expected = steps[currentStep]?.application;
    if (!expected) return;
    // Normalized match: case-insensitive, trim
    const isMatch =
      currentApp.toLowerCase().includes(expected.toLowerCase()) ||
      expected.toLowerCase().includes(currentApp.toLowerCase());
    if (isMatch && currentStep < steps.length) {
      const nextStep = currentStep + 1;
      void fetch(
        `http://127.0.0.1:8000/api/v1/flows/${session.id}/step?steps_completed=${nextStep}`,
        { method: "POST" }
      );
    }
  }, [currentApp, currentStep, steps, session.id]);

  const isComplete = currentStep >= steps.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50 w-80"
      >
        <Card className="shadow-2xl border-accent/30">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  {isComplete ? "Flow Complete" : "Flow Mode"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopFlow.mutate({
                    sessionId: session.id,
                    stepsCompleted: currentStep,
                  });
                  onClose();
                }}
                className="text-fg-muted hover:text-fg transition-colors"
                aria-label="Stop flow"
              >
                <X size={14} />
              </button>
            </div>

            <h3 className="text-sm font-semibold text-fg mb-2 truncate">
              {session.workflow?.ai_name ?? "Workflow"}
            </h3>

            {/* Step progress */}
            <div className="space-y-1.5 mb-3">
              {steps.map((step, i) => (
                <div key={step.step_order} className="flex items-center gap-2">
                  {i < currentStep ? (
                    <Check size={12} className="text-success shrink-0" />
                  ) : i === currentStep ? (
                    <Circle size={12} className="text-accent fill-accent/30 shrink-0" />
                  ) : (
                    <Circle size={12} className="text-fg-subtle shrink-0" />
                  )}
                  <span
                    className={`text-xs ${
                      i < currentStep
                        ? "text-fg-muted line-through"
                        : i === currentStep
                        ? "text-fg font-medium"
                        : "text-fg-subtle"
                    }`}
                  >
                    {step.application}
                  </span>
                  {i < steps.length - 1 && (
                    <ArrowRight size={10} className="text-fg-subtle ml-auto shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (currentStep / steps.length) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-fg-subtle">
                {currentStep}/{steps.length} steps
              </span>
              {isComplete && (
                <button
                  type="button"
                  onClick={() => {
                    stopFlow.mutate({
                      sessionId: session.id,
                      stepsCompleted: currentStep,
                    });
                    onClose();
                  }}
                  className="text-[10px] font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  Finish Session
                </button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
