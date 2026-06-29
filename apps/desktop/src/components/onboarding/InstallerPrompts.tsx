import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Pin, X } from "lucide-react";
import { ipc } from "../../lib/ipc.js";

interface InstallerPromptsProps {
  open: boolean;
  onClose: () => void;
}

/**
 * First-launch prompt: offer desktop shortcut + taskbar pin.
 * Called once on app startup if the user hasn't dismissed it before.
 */
export function InstallerPrompts({ open, onClose }: InstallerPromptsProps): JSX.Element | null {
  const [desktopDone, setDesktopDone] = useState(false);
  const [taskbarDone, setTaskbarDone] = useState(false);

  if (!open) return null;

  const handleDesktop = async () => {
    await ipc().system.createDesktopShortcut();
    setDesktopDone(true);
  };

  const handleTaskbar = async () => {
    await ipc().system.pinToTaskbar();
    setTaskbarDone(true);
  };

  const handleBoth = async () => {
    await ipc().system.installShortcuts();
    setDesktopDone(true);
    setTaskbarDone(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-50 w-72"
        >
          <div className="bg-bg-elevated/95 backdrop-blur-xl border border-accent/20 rounded-2xl shadow-2xl shadow-accent/10 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg">Install shortcuts</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-fg-subtle hover:text-fg transition-colors"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-fg-subtle leading-relaxed">
              Quick access to FlowSense from your desktop or taskbar.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleDesktop}
                disabled={desktopDone}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-bg-subtle hover:bg-accent/10 border border-border hover:border-accent/30 text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Monitor size={14} className="text-accent" />
                {desktopDone ? "✓ Desktop shortcut created" : "Create desktop shortcut"}
              </button>

              <button
                type="button"
                onClick={handleTaskbar}
                disabled={taskbarDone}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-bg-subtle hover:bg-accent/10 border border-border hover:border-accent/30 text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Pin size={14} className="text-accent" />
                {taskbarDone ? "✓ Pinned to taskbar" : "Pin to taskbar"}
              </button>

              {!desktopDone && !taskbarDone && (
                <button
                  type="button"
                  onClick={handleBoth}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white text-xs font-semibold transition-colors"
                >
                  Do both
                </button>
              )}
            </div>

            {(desktopDone || taskbarDone) && (
              <button
                type="button"
                onClick={onClose}
                className="w-full text-[11px] text-fg-subtle hover:text-fg transition-colors pt-1"
              >
                Done
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
