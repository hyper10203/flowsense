import { app, BrowserWindow, ipcMain, shell } from "electron";
import { exec } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ActivityMonitor } from "./activity-monitor.js";
import { NotificationManager } from "./notification-manager.js";
import { TrayManager } from "./tray-manager.js";
import { IPC } from "./ipc-channels.js";
import { showOverlay, updateOverlay, hideOverlay, type OverlayState } from "./overlay-window.js";
import { createDesktopShortcut, pinToTaskbar, createDesktopShortcutAndPinTaskbar } from "./shortcuts.js";
import { DEFAULT_SETTINGS, type FlowShortcut } from "@flowsense/shared";

export interface IpcDependencies {
  monitor: ActivityMonitor;
  notifications: NotificationManager;
  tray: TrayManager;
  settingsStore: {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
    store: () => unknown;
  };
  mainWindow: BrowserWindow;
}

export function registerIpcHandlers(deps: IpcDependencies): void {
  const { monitor, notifications, tray, settingsStore, mainWindow } = deps;

  ipcMain.handle(IPC.MONITORING_START, () => {
    monitor.start();
    tray.setMonitoring(true);
    notifications.notifyTrackingStarted();
    return true;
  });

  ipcMain.handle(IPC.MONITORING_STOP, () => {
    monitor.stop();
    tray.setMonitoring(false);
    notifications.notifyTrackingStopped();
    return true;
  });

  ipcMain.handle(IPC.MONITORING_STATUS, () => ({
    active: monitor.active,
    interval: monitor["intervalMs"],
  }));

  ipcMain.handle(IPC.VERSION_GET, () => ({
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    platform: process.platform,
  }));

  ipcMain.handle(IPC.SETTINGS_GET, (_e, key: string) => {
    if (key && key in DEFAULT_SETTINGS) {
      const stored = settingsStore.get(key);
      return stored ?? DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS];
    }
    return settingsStore.store();
  });

  ipcMain.handle(IPC.SETTINGS_SET, (_e, key: string, value: unknown) => {
    settingsStore.set(key, value);
    mainWindow.webContents.send(IPC.SETTINGS_CHANGED, { key, value });
    if (key === "flow_shortcuts" && Array.isArray(value)) {
      // Lazy import to avoid a cycle at module load
      void import("./global-shortcut.js").then((m) =>
        m.rebuildGlobalShortcuts(value as FlowShortcut[], mainWindow),
      );
    }
    return true;
  });

  ipcMain.handle(IPC.EXPORT_DATA, async () => {
    try {
      const defaultPath = path.join(
        os.homedir(),
        `flowsense-export-${Date.now()}.json`
      );
      const result = await dialogSaveFile(defaultPath);
      if (result.canceled || !result.filePath) return { ok: false };
      const payload = {
        exportedAt: new Date().toISOString(),
        appVersion: app.getVersion(),
        settings: settingsStore.store(),
      };
      fs.writeFileSync(result.filePath, JSON.stringify(payload, null, 2), "utf8");
      notifications.notifyDataExported(result.filePath);
      return { ok: true, path: result.filePath };
    } catch (err) {
      console.error("[IPC] export failed:", err);
      return { ok: false, error: String(err) };
    }
  });

  ipcMain.handle(IPC.NOTIFICATION_SHOW, (_e, payload) => {
    notifications.show(payload);
    return true;
  });

  ipcMain.handle("settings:reset", () => {
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      settingsStore.set(
        key,
        DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS]
      );
    }
    mainWindow.webContents.send(IPC.SETTINGS_CHANGED, { key: "all", value: null });
    return true;
  });

  ipcMain.handle("app:openExternal", (_e, url: string) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
      return true;
    }
    return false;
  });

  // Open an app by name — tries common Windows paths, falls back to `start`
  // Forward overlay control from renderer → overlay window
  ipcMain.handle(IPC.OVERLAY_SHOW, (_e, state: OverlayState) => {
    showOverlay(state);
  });
  ipcMain.handle(IPC.OVERLAY_UPDATE, (_e, state: OverlayState) => {
    updateOverlay(state);
  });
  ipcMain.handle(IPC.OVERLAY_HIDE, () => {
    hideOverlay();
  });

  // Shortcut creation
  ipcMain.handle("shortcut:desktop", () => {
    try { createDesktopShortcut(); return true; } catch { return false; }
  });
  ipcMain.handle("shortcut:taskbar", () => {
    try { pinToTaskbar(); return true; } catch { return false; }
  });
  ipcMain.handle("shortcut:install", () => {
    try { createDesktopShortcutAndPinTaskbar(); return true; } catch { return false; }
  });

  ipcMain.handle(IPC.APP_OPEN, (_e, appName: string) => {
    const platform = process.platform;
    try {
      if (platform === "win32") {
        // Map friendly names to executable names
        const appMap: Record<string, string> = {
          edge: "msedge",
          chrome: "chrome",
          firefox: "firefox",
          terminal: "wt",
          "windows terminal": "wt",
          "vs code": "code",
          "visual studio code": "code",
          explorer: "explorer",
          "file explorer": "explorer",
          discord: "discord",
          slack: "slack",
          spotify: "spotify",
          notion: "notion",
          figma: "figma",
          cursor: "cursor",
        };
        const exe = appMap[appName.toLowerCase()] ?? appName;
        exec(`start "" "${exe}"`, { timeout: 5000, windowsHide: true });
      } else if (platform === "darwin") {
        exec(`open -a "${appName}"`, { timeout: 5000 });
      } else {
        exec(`nohup "${appName}" &`, { timeout: 5000 });
      }
      return true;
    } catch {
      return false;
    }
  });
}

async function dialogSaveFile(defaultPath: string): Promise<{
  canceled: boolean;
  filePath?: string;
}> {
  const { dialog } = await import("electron");
  return dialog.showSaveDialog({
    title: "Export FlowSense data",
    defaultPath,
    filters: [{ name: "JSON", extensions: ["json"] }],
    properties: ["createDirectory"],
  });
}
