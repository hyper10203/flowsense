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

export function createOverlayWindow(): BrowserWindow {
  if (overlay) return overlay;

  const { width } = screen.getPrimaryDisplay().workAreaSize;

  overlay = new BrowserWindow({
    width: 320,
    height: 56,
    x: Math.floor((width - 320) / 2),
    y: 12,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false,
    hasShadow: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  overlay.on("closed", () => {
    overlay = null;
  });

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
  if (w.webContents.isLoading()) {
    w.webContents.once("did-fail-load", () => sendState(state));
    w.webContents.once("did-finish-load", () => sendState(state));
  } else {
    sendState(state);
  }
  // showInactive steals no focus — critical so the user's current app stays active
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
