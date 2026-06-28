import { app, shell } from "electron";
import { exec } from "node:child_process";
import os from "node:os";
import path from "node:path";

/**
 * Creates a desktop shortcut and pins the app to the Windows taskbar.
 * Uses PowerShell + WScript.Shell COM — works on Windows 7+.
 */
export function createDesktopShortcutAndPinTaskbar(): void {
  if (process.platform !== "win32") return;

  const exePath = app.getPath("exe");
  const desktopPath = path.join(os.homedir(), "Desktop");
  const shortcutPath = path.join(desktopPath, "FlowSense.lnk");

  // PowerShell script to create .lnk and pin to taskbar
  const psScript = `
$ErrorActionPreference = "Continue"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut("${shortcutPath.replace(/"/g, '\\"')}")
$shortcut.TargetPath = "${exePath.replace(/"/g, '\\"')}"
$shortcut.WorkingDirectory = "${path.dirname(exePath).replace(/"/g, '\\"')}"
$shortcut.Description = "FlowSense — AI-powered desktop focus companion"
$shortcut.Save()

# Pin to taskbar (Windows 7+)
$taskbarPath = "$env:APPDATA\\Microsoft\\Internet Explorer\\Quick Launch\\User Pinned\\TaskBar"
if (-not (Test-Path $taskbarPath)) {
  New-Item -ItemType Directory -Path $taskbarPath -Force | Out-Null
}
$taskbarShortcut = $shell.CreateShortcut("\\"$taskbarPath\\FlowSense.lnk\\"")
$taskbarShortcut.TargetPath = "${exePath.replace(/"/g, '\\"')}"
$taskbarShortcut.WorkingDirectory = "${path.dirname(exePath).replace(/"/g, '\\"')}"
$taskbarShortcut.Save()
`;

  exec(
    `powershell -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, " ")}"`,
    { timeout: 10000, windowsHide: true },
    (err) => {
      if (err) console.warn("[shortcuts] failed to create shortcut:", err.message);
      else console.log("[shortcuts] desktop shortcut + taskbar pin created");
    }
  );
}

/**
 * Creates only a desktop shortcut (no taskbar pin).
 */
export function createDesktopShortcut(): void {
  if (process.platform !== "win32") return;

  const exePath = app.getPath("exe");
  const desktopPath = path.join(os.homedir(), "Desktop");
  const shortcutPath = path.join(desktopPath, "FlowSense.lnk");

  const psScript = `
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut("${shortcutPath.replace(/"/g, '\\"')}")
$shortcut.TargetPath = "${exePath.replace(/"/g, '\\"')}"
$shortcut.WorkingDirectory = "${path.dirname(exePath).replace(/"/g, '\\"')}"
$shortcut.Description = "FlowSense — AI-powered desktop focus companion"
$shortcut.Save()
`;

  exec(
    `powershell -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, " ")}"`,
    { timeout: 10000, windowsHide: true },
    (err) => {
      if (err) console.warn("[shortcuts] failed to create desktop shortcut:", err.message);
      else console.log("[shortcuts] desktop shortcut created");
    }
  );
}

/**
 * Pins the app to the Windows taskbar.
 */
export function pinToTaskbar(): void {
  if (process.platform !== "win32") return;

  const exePath = app.getPath("exe");
  const taskbarDir = path.join(
    os.homedir(),
    "AppData",
    "Roaming",
    "Microsoft",
    "Internet Explorer",
    "Quick Launch",
    "User Pinned",
    "TaskBar"
  );
  const shortcutPath = path.join(taskbarDir, "FlowSense.lnk");

  const psScript = `
$taskbarPath = "${taskbarDir.replace(/"/g, '\\"')}"
if (-not (Test-Path $taskbarPath)) {
  New-Item -ItemType Directory -Path $taskbarPath -Force | Out-Null
}
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut("${shortcutPath.replace(/"/g, '\\"')}")
$shortcut.TargetPath = "${exePath.replace(/"/g, '\\"')}"
$shortcut.WorkingDirectory = "${path.dirname(exePath).replace(/"/g, '\\"')}"
$shortcut.Save()
`;

  exec(
    `powershell -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, " ")}"`,
    { timeout: 10000, windowsHide: true },
    (err) => {
      if (err) console.warn("[shortcuts] failed to pin to taskbar:", err.message);
      else console.log("[shortcuts] pinned to taskbar");
    }
  );
}
