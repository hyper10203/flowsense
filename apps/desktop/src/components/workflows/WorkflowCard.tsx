import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Keyboard, Pencil, Play, Sparkles, X } from "lucide-react";
import type { FlowShortcut, Workflow } from "@flowsense/shared";
import { Card, CardContent } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { ConfidenceBadge } from "./ConfidenceBadge.jsx";
import { WorkflowSteps } from "./WorkflowSteps.jsx";
import { FlowShortcutDialog } from "./FlowShortcutDialog.jsx";
import { formatDate } from "../../lib/utils.js";
import { useFlowShortcuts } from "../../hooks/use-flow-shortcuts.js";

interface WorkflowCardProps {
  workflow: Workflow;
  onAccept?: (id: number) => void;
  onDismiss?: (id: number) => void;
  onRename?: (name: string) => void;
  onStartFlow?: (workflowId: number) => void;
  delay?: number;
}

export function WorkflowCard({
  workflow,
  onAccept,
  onDismiss,
  onRename,
  onStartFlow,
  delay = 0,
}: WorkflowCardProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<"pending" | "accepted" | "dismissed">("pending");
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const { shortcuts, setShortcuts } = useFlowShortcuts();

  const existing: FlowShortcut | undefined = shortcuts.find(
    (s) => s.workflow_id === workflow.id,
  );

  const startEdit = () => {
    setDraftName(workflow.ai_name ?? "");
    setEditing(true);
  };

  const commitEdit = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== workflow.ai_name) {
      onRename?.(trimmed);
    }
    setEditing(false);
  };

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
                {editing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      commitEdit();
                    }}
                    className="flex items-center gap-1"
                  >
                    <input
                      autoFocus
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onBlur={commitEdit}
                      className="text-sm font-semibold text-fg bg-bg-subtle border border-accent/30 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-accent/40 w-48"
                    />
                  </form>
                ) : (
                  <h3 className="text-sm font-semibold text-fg truncate cursor-pointer hover:text-accent transition-colors" onClick={startEdit} title="Click to rename">
                    {workflow.ai_name ?? "Untitled workflow"}
                  </h3>
                )}
                {!editing && onRename && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="text-fg-subtle hover:text-accent transition-colors"
                    aria-label="Rename workflow"
                  >
                    <Pencil size={11} />
                  </button>
                )}
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
                  onDismiss?.(workflow.id);
                }}
              >
                <X size={14} /> Dismiss
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setStatus("accepted");
                  onAccept?.(workflow.id);
                }}
              >
                <Check size={14} /> Accept
              </Button>
            </div>
          ) : status === "accepted" && onStartFlow ? (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-subtle">
              <span className="text-xs text-success font-medium">Saved</span>
              {existing && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-fg-subtle bg-bg-subtle rounded px-1.5 py-0.5">
                    {existing.accelerator}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShortcuts(shortcuts.filter((s) => s.workflow_id !== workflow.id));
                    }}
                    className="text-fg-subtle hover:text-danger transition-colors"
                    title="Clear shortcut"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShortcutOpen(true)}
              >
                <Keyboard size={14} /> Shortcut
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onStartFlow(workflow.id)}
              >
                <Play size={14} /> Start Flow
              </Button>
              <FlowShortcutDialog
                open={shortcutOpen}
                onClose={() => setShortcutOpen(false)}
                initial={existing?.accelerator}
                onSave={(accel) => {
                  const next = shortcuts.filter((s) => s.workflow_id !== workflow.id);
                  next.push({
                    workflow_id: workflow.id,
                    accelerator: accel,
                    label: workflow.ai_name ?? `Workflow #${workflow.id}`,
                  });
                  setShortcuts(next);
                  setShortcutOpen(false);
                }}
              />
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
