import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Monitor, Pin, X } from "lucide-react";
import { ipc } from "../../lib/ipc.js";

interface SetupWizardProps {
  open: boolean;
  onClose: () => void;
}

/**
 * First-run wizard: shortcuts + AI key. Shown once until dismissed.
 * AI key is written to the backend settings store via IPC.
 */
export function SetupWizard({ open, onClose }: SetupWizardProps): JSX.Element | null {
  const [step, setStep] = useState<"shortcuts" | "apikey">("shortcuts");
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<"gemini" | "openrouter" | "nvidia_nim" | "deepseek">(
    "openrouter"
  );
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const handleSaveKey = async () => {
    await ipc().settings.set("ai_api_key", apiKey);
    await ipc().settings.set("ai_provider", provider);
    setSaved(true);
  };

  const handleSkip = () => {
    onClose();
  };

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
              <h2 className="text-base font-semibold text-fg">
                {step === "shortcuts" ? "Install shortcuts" : "Configure AI"}
              </h2>
              <button
                type="button"
                onClick={handleSkip}
                className="text-fg-subtle hover:text-fg transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {step === "shortcuts" ? (
              <div className="space-y-3">
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
                <button
                  type="button"
                  className="w-full mt-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white text-xs font-semibold transition-colors"
                  onClick={() => setStep("apikey")}
                >
                  Next: configure AI
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-fg-subtle leading-relaxed">
                  Enter an API key to enable AI-powered workflow naming. You can skip this
                  and configure later in Settings.
                </p>

                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as typeof provider)}
                  className="w-full px-2 py-1.5 text-xs bg-bg-subtle border border-border rounded-lg text-fg outline-none"
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="nvidia_nim">NVIDIA NIM</option>
                  <option value="deepseek">DeepSeek</option>
                </select>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-subtle border border-border focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/30">
                  <KeyRound size={13} className="text-fg-subtle" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1 bg-transparent text-xs text-fg outline-none placeholder:text-fg-subtle"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="flex-1 px-3 py-2 rounded-lg bg-bg-subtle hover:bg-border text-fg-subtle text-xs font-medium transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveKey}
                    disabled={!apiKey && !saved}
                    className="flex-1 px-3 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {saved ? "Saved" : "Save key"}
                  </button>
                </div>
              </div>
            )}

            {step === "apikey" && !saved && (
              <button
                type="button"
                onClick={handleSkip}
                className="w-full text-[11px] text-fg-subtle hover:text-fg transition-colors pt-1"
              >
                Done — configure later in Settings
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
