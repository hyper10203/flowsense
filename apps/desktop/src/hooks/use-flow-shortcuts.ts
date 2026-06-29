import { useCallback, useEffect, useState } from "react";
import type { FlowShortcut } from "@flowsense/shared";
import { ipc } from "../lib/ipc.js";

// ponytail: single source of truth held in electron-store,
// mirrored into React state. Settings change IPC keeps other windows in sync.
export function useFlowShortcuts(): {
  shortcuts: FlowShortcut[];
  setShortcuts: (next: FlowShortcut[]) => void;
} {
  const [shortcuts, setShortcutsState] = useState<FlowShortcut[]>([]);

  useEffect(() => {
    let cancel = false;
    ipc()
      .settings.get("flow_shortcuts")
      .then((v) => {
        if (!cancel && Array.isArray(v)) setShortcutsState(v as FlowShortcut[]);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    const unsub = ipc().settings.onChanged((payload: { key: string; value: unknown }) => {
      if (payload.key === "flow_shortcuts" && Array.isArray(payload.value)) {
        setShortcutsState(payload.value as FlowShortcut[]);
      }
    });
    return () => {
      unsub();
    };
  }, []);

  const setShortcuts = useCallback((next: FlowShortcut[]) => {
    setShortcutsState(next);
    void ipc().settings.set("flow_shortcuts", next);
  }, []);

  return { shortcuts, setShortcuts };
}
