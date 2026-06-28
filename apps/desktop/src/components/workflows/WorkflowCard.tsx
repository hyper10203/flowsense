import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Play, Sparkles, X, Check } from "lucide-react";
import type { Workflow } from "@flowsense/shared";
import { Card, CardContent } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { ConfidenceBadge } from "./ConfidenceBadge.jsx";
import { WorkflowSteps } from "./WorkflowSteps.jsx";
import { formatDate } from "../../lib/utils.js";

interface WorkflowCardProps {
  workflow: Workflow;
  onAccept: (id: number) => void;
  onDismiss: (id: number) => void;
  onStartFlow?: (workflowId: number) => void;
  delay?: number;
}

export function WorkflowCard({
  workflow,
  onAccept,
  onDismiss,
  onStartFlow,
  delay = 0,
}: WorkflowCardProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<"pending" | "accepted" | "dismissed">(
    "pending"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut", delay }}
    >
      <Card className="overflow-hidden">
        <CardContent>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-fg truncate">
                  {workflow.ai_name ?? "Untitled workflow"}
                </h3>
                <ConfidenceBadge value={workflow.confidence} />
              </div>
              <p className="text-xs text-fg-muted mt-0.5 line-clamp-2">
                {workflow.description}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-fg-subtle">
                <span>×{workflow.frequency} runs</span>
                <span>· last seen {formatDate(workflow.last_seen)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-fg-subtle hover:text-fg transition-colors"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.18 }}
                className="block"
              >
                <ChevronDown size={16} />
              </motion.span>
            </button>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-border-subtle space-y-3">
                  {workflow.purpose && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-fg-subtle mb-1">
                        Purpose
                      </div>
                      <div className="text-xs text-fg">{workflow.purpose}</div>
                    </div>
                  )}
                  {workflow.automation_suggestion && (
                    <div className="rounded-lg bg-accent/5 border border-accent/10 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-accent mb-1">
                        AI suggestion
                      </div>
                      <div className="text-xs text-fg">
                        {workflow.automation_suggestion}
                      </div>
                    </div>
                  )}
                  <WorkflowSteps steps={workflow.steps} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {status === "pending" ? (
            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border-subtle">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatus("dismissed");
                  onDismiss(workflow.id);
                }}
              >
                <X size={14} /> Dismiss
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setStatus("accepted");
                  onAccept(workflow.id);
                }}
              >
                <Check size={14} /> Accept
              </Button>
            </div>
          ) : status === "accepted" && onStartFlow ? (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-subtle">
              <span className="text-xs text-success font-medium">Saved</span>
              <div className="flex-1" />
              <Button
                variant="primary"
                size="sm"
                onClick={() => onStartFlow(workflow.id)}
              >
                <Play size={14} /> Start Flow
              </Button>
            </div>
          ) : (
            <div
              className={`mt-4 pt-3 border-t border-border-subtle text-xs font-medium ${
                status === "accepted" ? "text-success" : "text-fg-muted"
              }`}
            >
              {status === "accepted"
                ? "Saved to your workflows"
                : "Dismissed"}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
