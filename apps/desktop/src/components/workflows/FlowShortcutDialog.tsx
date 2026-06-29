import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { Button } from "../ui/Button.jsx";
import { Card, CardContent } from "../ui/Card.jsx";

interface FlowShortcutDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (accelerator: string) => void;
  initial?: string;
}

// Convert a KeyboardEvent to an Electron accelerator string.
// Returns null if the combo is unusable (e.g. bare modifier).
function eventToAccelerator(e: React.KeyboardEvent): string | null {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  const key = e.key;
  if (key === "Control" || key === "Alt" || key === "Shift" || key === "Meta") {
    return null; // lone modifier — not a complete combo
  }
  const normalized =
    key.length === 1
      ? key.toUpperCase()
      : key.replace(/^Arrow/, "");
  parts.push(normalized);
  return parts.join("+");
}

export function FlowShortcutDialog({
  open,
  onClose,
  onSave,
  initial,
}: FlowShortcutDialogProps): JSX.Element | null {
  const [captured, setCaptured] = useState<string | null>(initial ?? null);
  const [listening, setListening] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setCaptured(initial ?? null);
      setListening(false);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!listening) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const accel = eventToAccelerator(e as unknown as React.KeyboardEvent);
      if (accel) {
        setCaptured(accel);
        setListening(false);
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [listening]);

  useEffect(() => {
    if (listening) boxRef.current?.focus();
  }, [listening]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card className="w-96 max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-fg font-semibold text-sm">
              <Keyboard size={16} className="text-accent" />
              Assign keyboard shortcut
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-fg-subtle hover:text-fg"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div
            ref={boxRef}
            tabIndex={0}
            className="rounded-lg border border-border-subtle bg-bg-subtle p-6 text-center cursor-pointer outline-none focus:border-accent/40"
            onClick={() => setListening(true)}
          >
            {captured ? (
              <div className="text-fg font-mono text-lg tracking-wide">{captured}</div>
            ) : listening ? (
              <div className="text-accent text-sm animate-pulse">
                Press a key combination…
              </div>
            ) : (
              <div className="text-fg-muted text-sm">
                Click here, then press a key combination
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!captured}
              onClick={() => captured && onSave(captured)}
            >
              Save shortcut
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
