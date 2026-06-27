import { useEffect, useState } from "react";
import { ipc } from "../lib/ipc.js";

export function useMonitoringState(): {
  active: boolean;
  setActive: (v: boolean) => Promise<void>;
} {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ipc()
      .monitoring.status()
      .then((s) => {
        if (!cancelled) setActive(Boolean(s?.active));
      })
      .catch(() => void 0);
    return () => {
      cancelled = true;
    };
  }, []);

  const setActiveValue = async (v: boolean): Promise<void> => {
    if (v) await ipc().monitoring.start();
    else await ipc().monitoring.stop();
    setActive(v);
  };

  return { active, setActive: setActiveValue };
}

export function useKeyboardShortcuts(handlers: {
  onSearch: () => void;
  onRefresh: () => void;
  onSettings: () => void;
}): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        handlers.onSearch();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handlers.onRefresh();
      } else if (e.key === ",") {
        e.preventDefault();
        handlers.onSettings();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers]);
}
