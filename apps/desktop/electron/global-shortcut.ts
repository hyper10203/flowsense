import { app, globalShortcut, BrowserWindow } from "electron";
import type { FlowShortcut } from "@flowsense/shared";
import { showOverlay } from "./overlay-window.js";
import type { OverlayState } from "./overlay-window.js";

// ponytail: one map, re-registered on every settings change. Fine for <50 shortcuts.

const REGISTERED: Map<string, FlowShortcut> = new Map();

async function startFlowLocal(workflowId: number): Promise<OverlayState | null> {
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/v1/flows/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflow_id: workflowId }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.overlay_state;
  } catch {
    return null;
  }
}

export function rebuildGlobalShortcuts(
  shortcuts: FlowShortcut[],
  mainWindow: BrowserWindow | null,
): void {
  for (const accel of REGISTERED.keys()) {
    try {
      globalShortcut.unregister(accel);
    } catch {
      // ignore
    }
  }
  REGISTERED.clear();

  for (const sc of shortcuts) {
    const accel = sc.accelerator;
    if (!accel) continue;
    const ok = globalShortcut.register(accel, async () => {
      const state = await startFlowLocal(sc.workflow_id);
      if (state) {
        showOverlay(state);
        mainWindow?.webContents.send("flow:shortcut-triggered", sc.workflow_id);
      }
      mainWindow?.webContents.send("notification:show", {
        title: `Flow: ${sc.label}`,
        body: "Flow mode started via shortcut.",
        silent: true,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
    });
    if (ok) REGISTERED.set(accel, sc);
    else console.warn("[global-shortcut] failed to register:", accel);
  }
}

export function unregisterAllGlobalShortcuts(): void {
  for (const accel of REGISTERED.keys()) {
    try {
      globalShortcut.unregister(accel);
    } catch {
      // ignore
    }
  }
  REGISTERED.clear();
}

app.on("will-quit", unregisterAllGlobalShortcuts);
