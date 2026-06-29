import { app, globalShortcut, BrowserWindow } from "electron";
import type { FlowShortcut } from "@flowsense/shared";

// ponytail: one map, re-registered on every settings change. Fine for <50 shortcuts.

const REGISTERED: Map<string, FlowShortcut> = new Map();

function startFlowLocal(workflowId: number): void {
  // Hit the backend directly — same origin as the app, no auth needed.
  fetch(`http://127.0.0.1:8000/api/v1/flows/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow_id: workflowId }),
  }).catch(() => {});
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
    const ok = globalShortcut.register(accel, () => {
      startFlowLocal(sc.workflow_id);
      mainWindow?.webContents.send("flow:shortcut-triggered", sc.workflow_id);
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
