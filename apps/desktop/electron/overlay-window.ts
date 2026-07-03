import { BrowserWindow, screen } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV !== "production";

export interface OverlayState {
  currentStep: number;
  totalSteps: number;
  appName: string;
  workflowName: string;
  isComplete: boolean;
}

let overlay: BrowserWindow | null = null;

function resolveOverlayPath(): string {
  if (isDev) return "http://localhost:5173/overlay.html";
  return path.join(__dirname, "..", "dist", "overlay.html");
}

function positionOverlay(): void {
  if (!overlay || overlay.isDestroyed()) return;
  const { width } = screen.getPrimaryDisplay().bounds;
  overlay.setBounds({
    width: 340,
    height: 52,
    x: Math.floor((width - 340) / 2),
    y: 0,
  });
}

export function createOverlayWindow(): BrowserWindow {
  if (overlay && !overlay.isDestroyed()) return overlay;

  overlay = new BrowserWindow({
    width: 340,
    height: 52,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    focusable: false,
    hasShadow: false,
    thickFrame: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      sandbox: false,
      backgroundThrottling: false,
    },
    show: false,
  });

  // Stay on top even over fullscreen apps
  overlay.setAlwaysOnTop(true, "floating", 1);
  overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  overlay.on("closed", () => {
    overlay = null;
  });

  // Reposition if display changes
  screen.on("display-metrics-changed", positionOverlay);

  const url = resolveOverlayPath();
  if (url.startsWith("http")) {
    overlay.loadURL(url);
  } else {
    overlay.loadFile(url);
  }

  return overlay;
}

export function showOverlay(state: OverlayState): void {
  const w = createOverlayWindow();
  positionOverlay();
  if (w.webContents.isLoading()) {
    w.webContents.once("did-fail-load", () => sendState(state));
    w.webContents.once("did-finish-load", () => sendState(state));
  } else {
    sendState(state);
  }
  w.showInactive();
}

export function updateOverlay(state: OverlayState): void {
  if (!overlay || overlay.isDestroyed()) return;
  sendState(state);
}

export function hideOverlay(): void {
  if (!overlay || overlay.isDestroyed()) return;
  overlay.hide();
}

export function destroyOverlay(): void {
  if (!overlay || overlay.isDestroyed()) return;
  overlay.destroy();
  overlay = null;
}

function sendState(state: OverlayState): void {
  if (!overlay || overlay.isDestroyed()) return;
  overlay.webContents.send("overlay:state", state);
}
