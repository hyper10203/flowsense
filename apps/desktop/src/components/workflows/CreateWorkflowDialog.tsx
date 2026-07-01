import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { Button } from "../ui/Button.jsx";
import { ipc } from "../../lib/ipc.js";

interface Step {
  application: string;
  window_title?: string;
  url_pattern?: string;
}

export function CreateWorkflowDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<Step[]>([{ application: "", window_title: "" }]);

  if (!open) return null;

  const addStep = () => setSteps([...steps, { application: "", window_title: "" }]);
  const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));
  const updateStep = (index: number, field: keyof Step, value: string) => {
    const next = [...steps];
    next[index] = { ...next[index], [field]: value };
    setSteps(next);
  };

  const handleSave = async () => {
    if (!name.trim() || steps.length === 0) return;
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, steps }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch {
      console.error("Failed to create workflow");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-bg border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-fg">Create New Workflow</h3>
          <button onClick={onClose} className="text-fg-subtle hover:text-fg transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-fg-muted uppercase tracking-wider">Workflow Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Routine"
              className="w-full px-3 py-2 rounded-lg bg-bg-subtle border border-border text-sm text-fg outline-none focus:ring-1 focus:ring-accent/40 transition-all"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-fg-muted uppercase tracking-wider">Steps</label>
              <button
                type="button"
                onClick={addStep}
                className="text-accent hover:text-accent/80 text-[11px] font-medium flex items-center gap-1 transition-colors"
              >
                <Plus size={12} /> Add Step
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-bg-subtle border border-border/50">
                  <span className="text-[10px] font-mono text-fg-subtle w-4">{i + 1}.</span>
                  <input
                    value={step.application}
                    onChange={(e) => updateStep(i, "application", e.target.value)}
                    placeholder="Application name"
                    className="flex-1 px-2 py-1 rounded bg-bg border border-border text-xs text-fg outline-none focus:ring-1 focus:ring-accent/40"
                  />
                  <input
                    value={step.window_title}
                    onChange={(e) => updateStep(i, "window_title", e.target.value)}
                    placeholder="Window title (optional)"
                    className="flex-1 px-2 py-1 rounded bg-bg border border-border text-xs text-fg outline-none focus:ring-1 focus:ring-accent/40"
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    className="text-fg-subtle hover:text-danger transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 bg-bg-subtle border-t border-border flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>Create Workflow</Button>
        </div>
      </div>
    </div>
  );
}
