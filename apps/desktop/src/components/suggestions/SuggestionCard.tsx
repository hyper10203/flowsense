import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, X } from "lucide-react";
import type { Suggestion } from "@flowsense/shared";
import { Card, CardContent } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { ConfidenceBadge } from "../workflows/ConfidenceBadge.jsx";
import { formatRelative } from "../../lib/utils.js";

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: (id: number) => void;
  onDismiss: (id: number) => void;
  delay?: number;
}

export function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
  delay = 0,
}: SuggestionCardProps): JSX.Element | null {
  const [status, setStatus] = useState<"pending" | "accepted" | "dismissed">(
    suggestion.status === "accepted"
      ? "accepted"
      : suggestion.status === "dismissed"
      ? "dismissed"
      : "pending"
  );
  const wf = suggestion.workflow;
  if (!wf) return null;

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
                  {wf.ai_name ?? "AI suggestion"}
                </h3>
                <ConfidenceBadge value={wf.confidence} />
              </div>
              <p className="text-xs text-fg-muted mt-0.5 line-clamp-2">
                {wf.description}
              </p>
              {wf.automation_suggestion && (
                <div className="mt-3 rounded-lg bg-accent/5 border border-accent/10 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-accent mb-1">
                    AI explanation
                  </div>
                  <div className="text-xs text-fg">
                    {wf.automation_suggestion}
                  </div>
                </div>
              )}
              <div className="mt-2 text-[10px] text-fg-subtle">
                {wf.frequency} runs · suggested {formatRelative(suggestion.shown_at)}
              </div>
            </div>
          </div>

          {status === "pending" ? (
            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border-subtle">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatus("dismissed");
                  onDismiss(suggestion.id);
                }}
              >
                <X size={14} /> Dismiss
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setStatus("accepted");
                  onAccept(suggestion.id);
                }}
              >
                <Check size={14} /> Accept
              </Button>
            </div>
          ) : (
            <div
              className={`mt-4 pt-3 border-t border-border-subtle text-xs font-medium ${
                status === "accepted" ? "text-success" : "text-fg-muted"
              }`}
            >
              {status === "accepted" ? "Suggestion applied" : "Dismissed"}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
