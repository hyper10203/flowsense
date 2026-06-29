import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Pin, X } from "lucide-react";
import { ipc } from "../../lib/ipc.js";

interface SetupWizardProps {
  open: boolean;
  onClose: () => void;
}

export function SetupWizard({ open, onClose }: SetupWizardProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/95"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-bg-elevated border border-border rounded-2xl shadow-2xl w-[420px] p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-fg">Install shortcuts</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-fg-subtle hover:text-fg transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-fg-subtle leading-relaxed">
              Create shortcuts for quick access to FlowSense.
            </p>

            <button
              type="button"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-bg-subtle hover:bg-accent/10 border border-border text-xs font-medium transition-colors"
              onClick={() => ipc().system.createDesktopShortcut()}
            >
              <Monitor size={14} className="text-accent" />
              Create desktop shortcut
            </button>

            <button
              type="button"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-bg-subtle hover:bg-accent/10 border border-border text-xs font-medium transition-colors"
              onClick={() => ipc().system.pinToTaskbar()}
            >
              <Pin size={14} className="text-accent" />
              Pin to taskbar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
