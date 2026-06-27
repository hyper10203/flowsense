import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import type { BrowserWindow } from "electron";
import { IPC } from "./ipc-channels.js";

export interface ActiveWindowInfo {
  application: string;
  windowTitle: string;
  url: string | null;
}

export interface ActivityPayload {
  timestamp: string;
  application: string;
  window_title: string;
  url: string | null;
  event_type: "window_focus" | "browser_tab" | "idle_resume" | "idle_start";
  duration_ms: number;
  session_id: string | null;
}

const URL_REGEX = /https?:\/\/[^\s]+/i;
const BROWSERS = new Set([
  "chrome",
  "firefox",
  "edge",
  "brave",
  "arc",
  "safari",
  "opera",
  "vivaldi",
]);

export class ActivityMonitor {
  private timer: NodeJS.Timeout | null = null;
  private intervalMs = 5000;
  private lastWindow = "";
  private lastApplication = "";
  private lastTimestamp = Date.now();
  private isRunning = false;
  private isPaused = false;
  private mainWindow: BrowserWindow | null = null;
  private sessionId = crypto.randomUUID();

  setInterval(ms: number): void {
    this.intervalMs = Math.max(1000, Math.min(30_000, ms));
  }

  setWindow(win: BrowserWindow): void {
    this.mainWindow = win;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = Date.now();
    this.timer = setInterval(() => this.tick(), this.intervalMs);
    this.tick();
  }

  stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTimestamp = Date.now();
  }

  get active(): boolean {
    return this.isRunning && !this.isPaused;
  }

  private async tick(): Promise<void> {
    if (!this.isRunning || this.isPaused || !this.mainWindow) return;
    try {
      const info = this.getActiveWindow();
      if (!info) return;
      const now = Date.now();
      const duration = now - this.lastTimestamp;
      const sameWindow =
        info.application === this.lastApplication &&
        info.windowTitle === this.lastWindow;
      if (sameWindow) return;
      this.lastWindow = info.windowTitle;
      this.lastApplication = info.application;
      this.lastTimestamp = now;
      const payload: ActivityPayload = {
        timestamp: new Date().toISOString(),
        application: info.application,
        window_title: info.windowTitle,
        url: info.url,
        event_type: info.url ? "browser_tab" : "window_focus",
        duration_ms: duration,
        session_id: this.sessionId,
      };
      this.mainWindow.webContents.send(IPC.ACTIVITY_TRACKED, payload);
    } catch (err) {
      console.error("[ActivityMonitor] tick failed:", err);
    }
  }

  private getActiveWindow(): ActiveWindowInfo | null {
    const os = platform();
    try {
      if (os === "win32") return this.getActiveWindowWindows();
      if (os === "darwin") return this.getActiveWindowMac();
      return this.getActiveWindowLinux();
    } catch {
      return this.fallbackWindow();
    }
  }

  private getActiveWindowWindows(): ActiveWindowInfo | null {
    const ps = existsSync("C:/Windows/System32/windowsPowerShell/v1.0/powershell.exe")
      ? "C:/Windows/System32/windowsPowerShell/v1.0/powershell.exe"
      : "powershell";
    const script = `
      Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      public struct RECT { public int Left, Top, Right, Bottom; }
      public class Win {
        [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
        [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
        [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
      }
      "@
      $hwnd = [Win]::GetForegroundWindow()
      $pid = 0
      [Win]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
      $sb = New-Object System.Text.StringBuilder 512
      [Win]::GetWindowText($hwnd, $sb, 512) | Out-Null
      $title = $sb.ToString()
      $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
      $name = if ($proc) { $proc.ProcessName } else { "Unknown" }
      Write-Output "APP|$name"
      Write-Output "TITLE|$title"
    `;
    const out = execFileSync(ps, ["-NoProfile", "-Command", script], {
      encoding: "utf8",
      timeout: 4000,
      windowsHide: true,
    })
      .trim()
      .split(/\r?\n/);
    const app = out.find((l) => l.startsWith("APP|"))?.slice(4) ?? "Unknown";
    const title = out.find((l) => l.startsWith("TITLE|"))?.slice(6) ?? "";
    return this.buildWindowInfo(app, title);
  }

  private getActiveWindowMac(): ActiveWindowInfo | null {
    const script = `
      tell application "System Events"
        set frontApp to name of first application process whose frontmost is true
      end tell
      return frontApp
    `;
    const app = execFileSync("osascript", ["-e", script], {
      encoding: "utf8",
      timeout: 4000,
    }).trim();
    const titleScript = `
      tell application "System Events"
        tell (first application process whose frontmost is true)
          try
            set windowTitle to name of front window
          on error
            set windowTitle to ""
          end try
        end tell
      end tell
      return windowTitle
    `;
    const title = execFileSync("osascript", ["-e", titleScript], {
      encoding: "utf8",
      timeout: 4000,
    }).trim();
    return this.buildWindowInfo(app, title);
  }

  private getActiveWindowLinux(): ActiveWindowInfo | null {
    const out = execFileSync(
      "sh",
      [
        "-c",
        "xdotool getactivewindow getwindowclassname 2>/dev/null || xdotool getactivewindow getwindowname 2>/dev/null || echo Unknown",
      ],
      { encoding: "utf8", timeout: 4000 }
    ).trim();
    const title = execFileSync(
      "sh",
      ["-c", "xdotool getactivewindow getwindowname 2>/dev/null || echo"],
      { encoding: "utf8", timeout: 4000 }
    ).trim();
    return this.buildWindowInfo(out.split("\n")[0] ?? "Unknown", title);
  }

  private buildWindowInfo(
    rawApp: string,
    title: string
  ): ActiveWindowInfo {
    const application = rawApp.trim() || "Unknown";
    const windowTitle = title.trim() || application;
    let url: string | null = null;
    const m = windowTitle.match(URL_REGEX);
    if (m) url = m[0];
    if (!url && BROWSERS.has(application.toLowerCase())) {
      url = this.guessBrowserUrl(application, windowTitle);
    }
    return { application, windowTitle, url };
  }

  private guessBrowserUrl(_app: string, title: string): string | null {
    const cleaned = title
      .replace(/\s*[-–—]\s*(Google Chrome|Mozilla Firefox|Microsoft Edge|Brave|Arc|Vivaldi|Opera)\s*$/i, "")
      .trim();
    if (/^https?:\/\//i.test(cleaned)) return cleaned;
    if (/^[\w-]+\.[a-z]{2,}/i.test(cleaned)) return `https://${cleaned}`;
    return null;
  }

  private fallbackWindow(): ActiveWindowInfo {
    return {
      application: "FlowSense",
      windowTitle: "FlowSense",
      url: null,
    };
  }
}
