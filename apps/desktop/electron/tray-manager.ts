import { app, Menu, nativeImage, Tray } from "electron";
import path from "node:path";

export interface TrayCallbacks {
  onToggleMonitoring: () => void;
  onOpenApp: () => void;
  onQuit: () => void;
}

export class TrayManager {
  private tray: Tray | null = null;
  private isMonitoring = false;
  private callbacks: TrayCallbacks;

  constructor(callbacks: TrayCallbacks) {
    this.callbacks = callbacks;
  }

  create(): void {
    const iconPath = this.resolveIcon();
    const icon = nativeImage.createFromPath(iconPath);
    const resized = icon.resize({ width: 16, height: 16 });
    resized.setTemplateImage(true);
    this.tray = new Tray(resized);
    this.tray.setToolTip("FlowSense");
    this.tray.on("double-click", () => this.callbacks.onOpenApp());
    this.refreshMenu();
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  setMonitoring(active: boolean): void {
    this.isMonitoring = active;
    this.refreshMenu();
  }

  private refreshMenu(): void {
    if (!this.tray) return;
    const menu = Menu.buildFromTemplate([
      {
        label: this.isMonitoring ? "Pause monitoring" : "Start monitoring",
        click: () => this.callbacks.onToggleMonitoring(),
      },
      { type: "separator" },
      { label: "Open FlowSense", click: () => this.callbacks.onOpenApp() },
      { type: "separator" },
      { label: "Quit", click: () => this.callbacks.onQuit() },
    ]);
    this.tray.setContextMenu(menu);
    this.tray.setToolTip(
      this.isMonitoring
        ? "FlowSense — monitoring active"
        : "FlowSense — monitoring paused"
    );
  }

  private resolveIcon(): string {
    const publicDir = app.isPackaged
      ? path.join(process.resourcesPath, "public")
      : path.join(process.cwd(), "public");
    const candidate = path.join(publicDir, "icon.png");
    try {
      return candidate;
    } catch {
      return path.join(publicDir, "icon.svg");
    }
  }
}
