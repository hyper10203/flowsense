import { app, BrowserWindow, ipcMain, powerMonitor } from "electron";
import type { FlowShortcut } from "@flowsense/shared";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ElectronStore from "electron-store";
import { ActivityMonitor } from "./activity-monitor.js";
import { registerIpcHandlers, type IpcDependencies } from "./ipc-handlers.js";
import { NotificationManager } from "./notification-manager.js";
import { TrayManager } from "./tray-manager.js";
import { IPC } from "./ipc-channels.js";
import {
  createOverlayWindow,
  showOverlay,
  updateOverlay,
  hideOverlay,
  destroyOverlay,
  type OverlayState,
} from "./overlay-window.js";
import { startBackend, stopBackend } from "./backend-runner.js";
import { rebuildGlobalShortcuts } from "./global-shortcut.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged && process.env.NODE_ENV !== "production";

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;
const monitor = new ActivityMonitor();
const notifications = new NotificationManager();
const store = new ElectronStore({ clearInvalidConfig: true });

const tray = new TrayManager({
  onToggleMonitoring: () => toggleMonitoring(),
  onOpenApp: () => showMainWindow(),
  onQuit: () => app.quit(),
});

function resolveRendererPath(): string {
  if (isDev) return "http://localhost:5173";
  return path.join(__dirname, "..", "..", "dist", "index.html");
}

function resolvePreloadPath(): string {
  return path.join(__dirname, "..", "preload", "preload.mjs");
}

function resolveAppIcon(): string {
  const root = app.isPackaged ? app.getAppPath() : path.join(__dirname, "..", "..", "..");
  return path.join(root, "public", "icon.png");
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    title: "FlowSense",
    icon: resolveAppIcon(),
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: "hidden",
    backgroundColor: "#0a0a0f",
    webPreferences: {
      preload: resolvePreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
    },
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("focus", () => {
    mainWindow?.webContents.send(IPC.WINDOW_FOCUS);
  });
  mainWindow.on("blur", () => {
    mainWindow?.webContents.send(IPC.WINDOW_BLUR);
  });

  monitor.setWindow(mainWindow);
  notifications.setWindow(mainWindow);

  const url = resolveRendererPath();
  if (url.startsWith("http")) {
    mainWindow.loadURL(url);
  } else {
    mainWindow.loadFile(url);
  }
}

function showMainWindow(): void {
  if (!mainWindow) {
    createMainWindow();
    return;
  }
  mainWindow.show();
  mainWindow.focus();
}

function toggleMonitoring(): void {
  if (monitor.active) {
    monitor.stop();
    tray.setMonitoring(false);
    notifications.notifyTrackingStopped();
    mainWindow?.webContents.send(IPC.MONITORING_STATE_CHANGED, false);
  } else {
    monitor.start();
    tray.setMonitoring(true);
    notifications.notifyTrackingStarted();
    mainWindow?.webContents.send(IPC.MONITORING_STATE_CHANGED, true);
  }
}

function setupLifecycle(): void {
  powerMonitor.on("suspend", () => {
    monitor.pause();
    mainWindow?.webContents.send("system:locked");
  });
  powerMonitor.on("resume", () => {
    monitor.resume();
    mainWindow?.webContents.send("system:unlocked");
  });
}

function setupAutoLaunch(): void {
  const shouldLaunch = store.get("startup_launch");
  app.setLoginItemSettings({
    openAtLogin: Boolean(shouldLaunch),
  });
}

function setupSingleInstance(): void {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }
  app.on("second-instance", () => {
    showMainWindow();
  });
}

function setupIpc(): void {
  registerIpcHandlers({
    monitor,
    notifications,
    tray,
    settingsStore: store as unknown as IpcDependencies["settingsStore"],
    mainWindow: mainWindow!,
  });
  ipcMain.handle("monitoring:toggle", () => {
    toggleMonitoring();
    return monitor.active;
  });
  ipcMain.handle("app:hide", () => mainWindow?.hide());
  ipcMain.handle("app:restartBackend", () => {
    stopBackend();
    if (mainWindow) startBackend({ window: mainWindow });
  });

  // Messages from the overlay window (rendered in the transparent top window)
  ipcMain.on("overlay:next", (_e, appName: string) => {
    mainWindow?.webContents.send("overlay:next", appName);
  });
  ipcMain.on("overlay:complete", () => {
    mainWindow?.webContents.send("overlay:complete");
  });
  ipcMain.on("overlay:close", () => {
    mainWindow?.webContents.send("overlay:close");
  });
}

app.whenReady().then(() => {
  setupSingleInstance();
  setupLifecycle();
  setupAutoLaunch();
  setupIpc();
  tray.create();
  createMainWindow();
  if (mainWindow) startBackend({ window: mainWindow });
  // Register persisted flow shortcuts
  try {
    const stored = store.get("flow_shortcuts") as unknown;
    if (Array.isArray(stored)) rebuildGlobalShortcuts(stored, mainWindow!);
  } catch {
    // ignore
  }
  // Auto-start tracking once the window is ready so activity data flows
  // without requiring the user to click the tray/button.
  mainWindow?.once("ready-to-show", () => {
    const pollingInterval = store.get("polling_interval") as number;
    if (pollingInterval) {
      monitor.setInterval(pollingInterval * 1000);
    }
    monitor.start();
    tray.setMonitoring(true);
    mainWindow?.webContents.send(IPC.MONITORING_STATE_CHANGED, true);
  });
});


app.on("window-all-closed", () => {
  // Stay alive in tray on Windows/Linux
  if (process.platform === "darwin") app.quit();
});

app.on("before-quit", () => {
  isQuitting = true;
  monitor.stop();
  tray.destroy();
  stopBackend();
});

app.on("activate", () => {
  showMainWindow();
});
