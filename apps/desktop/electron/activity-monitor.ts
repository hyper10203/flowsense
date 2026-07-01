import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import type { BrowserWindow } from "electron";
import { IPC } from "./ipc-channels.js";

export interface ActiveWindowInfo {
  application: string;
  windowTitle: string;
  url: string | null;
  commandLine: string | null;
}

export interface ActivityPayload {
  timestamp: string;
  application: string;
  window_title: string;
  url: string | null;
  command_line: string | null;
  event_type: "window_focus" | "browser_tab" | "terminal" | "idle_resume" | "idle_start";
  duration_ms: number;
  session_id: string | null;
}

const TERMINAL_APPS = new Set([
  "windowsterminal",
  "wt",
  "cmd",
  "powershell",
  "pwsh",
  "bash",
  "zsh",
  "git bash",
  "alacritty",
  "wezterm",
  "tabby",
  "conemu",
  "cmder",
]);

// Apps we never track — FlowSense tracking itself is a feedback loop.
const EXCLUDED_APPS = new Set(["flowsense", "flowsense.exe"]);

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
  private lastUrl: string | null = null;
  private lastCommandLine: string | null = null;
  private lastTimestamp = Date.now();
  private isRunning = false;
  private isPaused = false;
  private mainWindow: BrowserWindow | null = null;
  private sessionId = crypto.randomUUID();

  setInterval(ms: number): void {
    this.intervalMs = Math.max(1000, Math.min(30_000, ms));
    if (this.isRunning && this.timer) {
      clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), this.intervalMs);
    }
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

      if (EXCLUDED_APPS.has(info.application.toLowerCase())) {
        this.lastTimestamp = Date.now();
        return;
      }

      const now = Date.now();
      const rawDuration = now - this.lastTimestamp;
      const duration = Math.min(rawDuration, 30 * 60 * 1000); // cap at 30min

      const sameWindow =
        info.application === this.lastApplication &&
        info.windowTitle === this.lastWindow;

      if (sameWindow) {
        this.lastTimestamp = now;
        return;
      }

      // Window changed! Record the duration for the PREVIOUS window.
      if (this.lastApplication) {
        const isPrevTerminal = TERMINAL_APPS.has(this.lastApplication.toLowerCase());
        const prevPayload: ActivityPayload = {
          timestamp: new Date(now - duration).toISOString(),
          application: this.lastApplication,
          window_title: this.lastWindow,
          url: this.lastUrl,
          command_line: this.lastCommandLine,
          event_type: isPrevTerminal ? "terminal" : this.lastUrl ? "browser_tab" : "window_focus",
          duration_ms: duration,
          session_id: this.sessionId,
        };
        this.mainWindow.webContents.send(IPC.ACTIVITY_TRACKED, prevPayload);
      }

      // Now start tracking the NEW window.
      this.lastApplication = info.application;
      this.lastWindow = info.windowTitle;
      this.lastUrl = info.url;
      this.lastCommandLine = info.commandLine;
      this.lastTimestamp = now;

      const isTerminal = TERMINAL_APPS.has(info.application.toLowerCase());
      const payload: ActivityPayload = {
        timestamp: new Date().toISOString(),
        application: info.application,
        window_title: info.windowTitle,
        url: info.url,
        command_line: info.commandLine,
        event_type: isTerminal ? "terminal" : info.url ? "browser_tab" : "window_focus",
        duration_ms: 0, // New window just started
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
    const script = `Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
}
"@
$hwnd = [Win]::GetForegroundWindow()
$targetPid = 0
[Win]::GetWindowThreadProcessId($hwnd, [ref]$targetPid) | Out-Null
$sb = New-Object System.Text.StringBuilder 512
[Win]::GetWindowText($hwnd, $sb, 512) | Out-Null
$title = $sb.ToString()
$proc = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
$name = if ($proc) { $proc.ProcessName } else { "Unknown" }
$cmdLine = ""
try {
  $cim = Get-CimInstance Win32_Process -Filter "ProcessId = $targetPid" -ErrorAction SilentlyContinue
  if ($cim) { $cmdLine = $cim.CommandLine }
} catch {}
Write-Output "APP|$name"
Write-Output "TITLE|$title"
Write-Output "CMD|$cmdLine"`;
    const out = execFileSync(ps, ["-NoProfile", "-Command", script], {
      encoding: "utf8",
      timeout: 4000,
      windowsHide: true,
    })
      .trim()
      .split(/\r?\n/);
    const app = out.find((l) => l.startsWith("APP|"))?.slice(4) ?? "Unknown";
    const title = out.find((l) => l.startsWith("TITLE|"))?.slice(6) ?? "";
    const cmd = out.find((l) => l.startsWith("CMD|"))?.slice(4) ?? "";
    return this.buildWindowInfo(app, title, cmd);
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
    return this.buildWindowInfo(app, title, null);
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
    return this.buildWindowInfo(out.split("\\n")[0] ?? "Unknown", title, null);
  }

  private buildWindowInfo(
    rawApp: string,
    title: string,
    commandLine: string | null = null
  ): ActiveWindowInfo {
    const application = rawApp.trim() || "Unknown";
    const windowTitle = title.trim() || application;
    let url: string | null = null;
    const m = windowTitle.match(URL_REGEX);
    if (m) url = m[0];
    if (!url && BROWSERS.has(application.toLowerCase())) {
      url = this.guessBrowserUrl(application, windowTitle);
    }
    // Extract command from terminal command line if present
    let cmd: string | null = null;
    if (TERMINAL_APPS.has(application.toLowerCase()) && commandLine) {
      cmd = this.extractTerminalCommand(commandLine, application);
    }
    return { application, windowTitle, url, commandLine: cmd };
  }

  private extractTerminalCommand(cmdLine: string, app: string): string | null {
    if (!cmdLine) return null;
    // Strip the executable path, keep the arguments
    const parts = cmdLine.split(/\\s+/).filter(Boolean);
    if (parts.length <= 1) return null;
    // Remove the exe path (first part)
    const args = parts.slice(1).join(" ").trim();
    // For cmd/powershell, extract the actual command being run
    if (app === "cmd" || app === "powershell" || app === "pwsh") {
      const match = args.match(/^\/c\s+(.+)$/i) || args.match(/^-Command\s+(.+)$/i);
      if (match) return match[1].trim();
    }
    return args || null;
  }

  private guessBrowserUrl(_app: string, title: string): string | null {
    const cleaned = title
      .replace(/\s*[-–—]\s*(Google Chrome|Mozilla Firefox|Microsoft Edge|Brave|Arc|Vivaldi|Opera)\s*$/i, "")
      .trim();
    if (/^https?:\/\//i.test(cleaned)) return cleaned;
    if (/^[\w-]+\.[a-z]{2,}/i.test(cleaned)) return `https://${cleaned}`;
    return null;
  }

  private fallbackWindow(): ActiveWindowInfo | null {
    return null;
  }
}
