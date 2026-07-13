import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Mic, Play, X } from "lucide-react";
import type { ActiveFlowSession, ActivityEvent } from "@flowsense/shared";
import { useStopFlow } from "../../hooks/use-api.js";
import { ipc } from "../../lib/ipc.js";
import { api } from "../../lib/api.js";
import { useApp } from "../../store.jsx";

interface FlowOverlayProps {
  session: ActiveFlowSession;
  events: ActivityEvent[];
  onClose: () => void;
  onStepUpdate: (stepsCompleted: number) => void;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  return (window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }).SpeechRecognition ?? (window as unknown as {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }).webkitSpeechRecognition;
}

/**
 * Two layers:
 *  1. Universal overlay window (transparent, always-on-top) — the actual Dynamic Island pill that follows the user across all apps.
 *  2. This component — the in-app expanded panel visible when FlowSense is focused (shows step chips, progress list).
 */
export function FlowOverlay({ session, events, onClose, onStepUpdate }: FlowOverlayProps): JSX.Element | null {
  const stopFlow = useStopFlow();
  const { settings, pushToast } = useApp();
  const steps = session.workflow?.steps ?? [];
  const currentStep = session.steps_completed;
  const [expanded, setExpanded] = useState(false);
  const [listening, setListening] = useState(false);
  const isComplete = currentStep >= steps.length;
  const currentAppName = steps[currentStep]?.application ?? "";
  const hasOpenedFirstApp = useRef(false);
  const advancingEvent = useRef<string | null>(null);

  // Tell the universal overlay window to show on mount, hide on unmount
  useEffect(() => {
    void ipc().system.overlayShow({
      currentStep,
      totalSteps: steps.length,
      appName: currentAppName,
      workflowName: session.workflow?.ai_name ?? "Workflow",
      isComplete,
    });
    return () => {
      void ipc().system.overlayHide();
    };
  }, []);

  // Update overlay state on step change
  useEffect(() => {
    void ipc().system.overlayUpdate({
      currentStep,
      totalSteps: steps.length,
      appName: currentAppName,
      workflowName: session.workflow?.ai_name ?? "Workflow",
      isComplete,
    });
  }, [currentStep, steps.length, currentAppName, session.workflow?.ai_name, isComplete]);

  // Auto-open the first app when flow starts (first render only)
  useEffect(() => {
    if (currentStep === 0 && !hasOpenedFirstApp.current && steps.length > 0) {
      hasOpenedFirstApp.current = true;
      void ipc().system.openApp(steps[0].application);
    }
  }, [currentStep, steps]);

  // Listen for messages from the overlay window
  useEffect(() => {
    const unsubNext = ipc().system.onOverlayNext((appName: string) => {
      if (appName) void ipc().system.openApp(appName);
    });
    const unsubComplete = ipc().system.onOverlayComplete(() => {
      stopFlow.mutate({ sessionId: session.id, stepsCompleted: currentStep });
      onClose();
    });
    const unsubClose = ipc().system.onOverlayClose(() => {
      stopFlow.mutate({ sessionId: session.id, stepsCompleted: currentStep });
      onClose();
    });
    return () => {
      unsubNext();
      unsubComplete();
      unsubClose();
    };
  }, [session.id, currentStep, stopFlow, onClose]);

  // Auto-advance only for the event that actually activated the expected app.
  // Keeping a historical "active windows" set caused repeated app names to
  // complete future steps without the user returning to that app.
  const latestEvent = events[0];
  useEffect(() => {
    if (!latestEvent || currentStep >= steps.length) return;
    const expected = steps[currentStep]?.application;
    if (!expected) return;

    const currentApp = latestEvent.application.toLowerCase();
    const expectedApp = expected.toLowerCase();
    const matches = currentApp.includes(expectedApp) || expectedApp.includes(currentApp);
    const eventKey = `${latestEvent.timestamp}:${latestEvent.application}:${latestEvent.duration_ms}`;
    if (!matches || advancingEvent.current === eventKey) return;

    advancingEvent.current = eventKey;
    const nextStep = currentStep + 1;
    void api.flows
      .updateStep(session.id, nextStep)
      .then(() => onStepUpdate(nextStep))
      .catch(() => {
        // A later activity event can retry if the local backend is restarting.
        advancingEvent.current = null;
      });
  }, [latestEvent, currentStep, steps, session.id, onStepUpdate]);

  const handleNextStep = useCallback(() => {
    if (currentStep < steps.length) {
      void ipc().system.openApp(steps[currentStep].application);
    }
  }, [currentStep, steps]);

  const handleStop = useCallback(() => {
    stopFlow.mutate({ sessionId: session.id, stepsCompleted: currentStep });
    onClose();
  }, [session.id, currentStep, stopFlow, onClose]);

  const handleVoiceCommand = useCallback(() => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      pushToast({ title: "Voice input unavailable", body: "Use a Chromium build with speech recognition enabled.", silent: false });
      return;
    }
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (!transcript) return;
      void api.voice.command(transcript, settings.voice_feedback)
        .then((result) => {
          pushToast({ title: "Voice command", body: result.message, silent: false });
          if (result.action === "stop") onClose();
          else onStepUpdate(result.steps_completed);
        })
        .catch(() => {
          pushToast({ title: "Voice command failed", body: "The local backend could not process that command.", silent: false });
        });
    };
    recognition.onerror = () => {
      pushToast({ title: "Voice input failed", body: "Microphone access was denied or recognition stopped.", silent: false });
    };
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }, [onClose, onStepUpdate, pushToast, settings.voice_feedback]);

  const progress = steps.length > 0 ? (currentStep / steps.length) * 100 : 0;

  // In-app expanded panel — visible when FlowSense is the active window
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50"
        style={{ maxWidth: 480 }}
      >
        <motion.div
          layout
          className="bg-bg-elevated/95 backdrop-blur-xl border border-accent/20 rounded-2xl shadow-2xl shadow-accent/5 overflow-hidden"
        >
          {/* Progress line at top */}
          <div className="h-0.5 w-full bg-border">
            <motion.div
              className="h-full bg-accent"
              initial={false}
              animate={{ width: `${Math.min(100, isComplete ? 100 : progress)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Pill header — clicking expands to show step list */}
          <div className="flex items-center gap-2.5 px-4 py-2.5">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />

            <div className="flex-1 min-w-0">
              {isComplete ? (
                <span className="text-xs font-semibold text-success">Flow Complete</span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-fg-subtle">Step {currentStep + 1}/{steps.length}</span>
                  <span className="text-xs font-semibold text-fg truncate">{currentAppName}</span>
                </div>
              )}
            </div>

            {!isComplete ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-[11px] font-medium transition-colors shrink-0"
              >
                <Play size={10} className="fill-accent" />
                {currentStep === 0 ? "Start" : "Next"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStop}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success/10 hover:bg-success/20 text-success text-[11px] font-medium transition-colors shrink-0"
              >
                <Check size={10} />
                Done
              </button>
            )}

            {!isComplete && (
              <button
                type="button"
                onClick={handleVoiceCommand}
                disabled={listening}
                className="p-1.5 rounded-lg text-fg-subtle hover:text-accent hover:bg-accent/10 disabled:opacity-50 transition-colors shrink-0"
                aria-label={listening ? "Listening for a voice command" : "Use a voice command"}
                title="Voice commands: next, repeat, status, or stop"
              >
                <Mic size={13} className={listening ? "text-accent animate-pulse" : ""} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-fg-subtle hover:text-fg transition-colors shrink-0"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              <motion.div animate={{ rotate: expanded ? 0 : 180 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} />
              </motion.div>
            </button>

            <button
              type="button"
              onClick={handleStop}
              className="text-fg-subtle hover:text-fg transition-colors shrink-0"
              aria-label="Stop flow"
            >
              <X size={12} />
            </button>
          </div>

          {/* Expanded step list */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-border/50"
              >
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                      {isComplete ? "Complete" : "Flow Mode"}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-fg truncate">
                    {session.workflow?.ai_name ?? "Workflow"}
                  </h3>

                  <div className="flex flex-wrap gap-1.5">
                    {steps.map((step, i) => (
                      <div
                        key={step.step_order}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                          i < currentStep
                            ? "bg-success/10 text-success"
                            : i === currentStep
                            ? "bg-accent/10 text-accent ring-1 ring-accent/30"
                            : "bg-bg-subtle text-fg-subtle"
                        }`}
                      >
                        {i < currentStep ? <Check size={10} /> : <span className="w-[10px] text-center">{i + 1}</span>}
                        {step.application}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-fg-subtle">{currentStep}/{steps.length} done</span>
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={handleStop}
                      className="text-[10px] text-fg-subtle hover:text-fg transition-colors"
                    >
                      End Flow
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
