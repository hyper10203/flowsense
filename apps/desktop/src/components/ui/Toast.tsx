import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useApp, type ToastEntry } from "../../store.jsx";

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastEntry;
  onDismiss: (id: string) => void;
}): JSX.Element {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="pointer-events-auto w-80 rounded-xl border border-border bg-bg-elevated shadow-lg p-3"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-fg truncate">
            {toast.title}
          </div>
          <div className="text-xs text-fg-muted mt-0.5 line-clamp-2">
            {toast.body}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-fg-subtle hover:text-fg transition-colors"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export function ToastViewport(): JSX.Element {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
