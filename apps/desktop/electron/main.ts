import { app, BrowserWindow, ipcMain, session } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ElectronStore from "electron-store";
import { ActivityMonitor } from "./activity-monitor.js";
import { registerIpcHandlers, type IpcDependencies } from "./ipc-handlers.js";
import { NotificationManager } from "./notification-manager.js";
import { TrayManager } from "./tray-manager.js";
import { IPC } from "./ipc-channels.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged && process.env.NODE_ENV !== "production";

let mainWindow: BrowserWindow | null = null;
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
  return path.join(__dirname, "..", "dist", "index.html");
}

function resolvePreloadPath(): string {
  return path.join(__dirname, "preload.js");
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    title: "FlowSense",
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
    if (!app.isQuitting) {
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
  } else {
    monitor.start();
    tray.setMonitoring(true);
    notifications.notifyTrackingStarted();
  }
}

function setupLifecycle(): void {
  const ses = session.defaultSession;
  ses.on("lock-screen", () => {
    monitor.pause();
    mainWindow?.webContents.send("system:locked");
  });
  ses.on("unlock-screen", () => {
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
}

app.whenReady().then(() => {
  setupSingleInstance();
  setupLifecycle();
  setupAutoLaunch();
  setupIpc();
  tray.create();
  createMainWindow();
});

app.on("window-all-closed", () => {
  // Stay alive in tray on Windows/Linux
  if (process.platform === "darwin") app.quit();
});

app.on("before-quit", () => {
  app.isQuitting = true;
  monitor.stop();
  tray.destroy();
});

app.on("activate", () => {
  showMainWindow();
});
