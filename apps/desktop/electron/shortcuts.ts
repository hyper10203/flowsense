import { app } from "electron";
import { exec } from "node:child_process";
import path from "node:path";

function desktopPath(): string {
  return path.join(app.getPath("home"), "Desktop");
}

function exePath(): string {
  return app.getPath("exe");
}

function escaped(p: string): string {
  return p.replace(/"/g, '\\"');
}

function runPs(script: string, label: string): void {
  const cmd = `powershell -ExecutionPolicy Bypass -Command "${script.replace(/"/g, '\\"').replace(/\n/g, " ")}"`;
  exec(cmd, { timeout: 15000, windowsHide: true }, (err) => {
    if (err) console.warn(`[shortcuts] ${label} failed:`, err.message);
    else console.log(`[shortcuts] ${label} created`);
  });
}

export function createDesktopShortcut(): void {
  if (process.platform !== "win32") return;
  const shortcut = path.join(desktopPath(), "FlowSense.lnk");
  runPs(`
$shell = New-Object -ComObject WScript.Shell
$s = $shell.CreateShortcut("${escaped(shortcut)}")
$s.TargetPath = "${escaped(exePath())}"
$s.WorkingDirectory = "${escaped(path.dirname(exePath()))}"
$s.Description = "FlowSense"
$s.Save()
`, "desktop shortcut");
}

export function pinToTaskbar(): void {
  if (process.platform !== "win32") return;
  // Use Shell.Application to invoke the "Pin to Taskbar" verb
  runPs(`
$shell = New-Object -ComObject Shell.Application
$folder = $shell.Namespace("${escaped(path.dirname(exePath()))}")
$item = $folder.ParseName("${escaped(path.basename(exePath()))}")
$verb = $item.Verbs() | Where-Object { $_.Name -like "*Pin to Taskbar*" -or $_.Name -like "*taskbar*" }
if ($verb) { $verb.DoIt() }
`, "taskbar pin");
}

export function createDesktopShortcutAndPinTaskbar(): void {
  if (process.platform !== "win32") return;
  createDesktopShortcut();
  pinToTaskbar();
}
