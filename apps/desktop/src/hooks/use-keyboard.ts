import { useEffect } from "react";

export function useKeyboardShortcuts(handlers: {
  onSearch: () => void;
  onRefresh: () => void;
  onSettings: () => void;
  onToggleFlow?: () => void;
}): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      // Ctrl+Shift+F → toggle flow mode
      if (meta && e.shiftKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        handlers.onToggleFlow?.();
        return;
      }
      if (!meta) return;
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
