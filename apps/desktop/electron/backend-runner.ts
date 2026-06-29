import { app, type BrowserWindow } from "electron";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

let backendProcess: ReturnType<typeof spawn> | null = null;

function backendSourceRoot(): string {
  const dev = path.join(__dirname, "..", "..", "..", "backend");
  const prod = path.join(process.resourcesPath ?? "", "backend");
  for (const c of [dev, prod]) {
    if (c && fs.existsSync(path.join(c, "app", "main.py"))) return c;
  }
  return dev;
}

function bundledPython(): string | null {
  const prod = path.join(process.resourcesPath ?? "", "vendor", "python", "python.exe");
  if (fs.existsSync(prod)) return prod;
  const dev = path.join(__dirname, "..", "..", "..", "..", "vendor", "python", "python.exe");
  if (fs.existsSync(dev)) return dev;
  return null;
}

function uvBinary(): string {
  const candidates = [
    path.join(process.env.HOME ?? process.env.USERPROFILE ?? "", ".local", "bin", "uv.exe"),
    path.join(process.env.LOCALAPPDATA ?? "", "uv", "uv.exe"),
    "uv",
  ];
  for (const c of candidates) {
    if (c === "uv" || fs.existsSync(c)) return c;
  }
  return "uv";
}

interface BackendOptions {
  window?: BrowserWindow;
  preferExternal?: boolean;
}

export function startBackend(opts: BackendOptions = {}): void {
  if (backendProcess) return;

  const root = backendSourceRoot();
  const scriptPath = path.join(root, "app", "main.py");
  if (!fs.existsSync(scriptPath)) {
    console.warn("[backend-runner] not found:", scriptPath);
    return;
  }

  const bundled = bundledPython();
  let python: string;
  let args: string[];
  let cwd: string;

  if (opts.preferExternal || !bundled) {
    python = uvBinary();
    args = ["run", "python", scriptPath];
    cwd = root;
  } else {
    python = bundled;
    cwd = root;
    args = [scriptPath];
  }

  const isBundled = !!bundled && !opts.preferExternal;
  backendProcess = spawn(python, args, {
    cwd,
    windowsHide: true,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: "1",
      ...(isBundled
        ? {
            PYTHONHOME: path.dirname(python),
            PYTHONPATH: [root, path.join(root, "app")].join(path.delimiter),
          }
        : {}),
    },
  });

  backendProcess.stdout?.on("data", (d) => {
    console.log("[backend]", d.toString().trim());
  });
  backendProcess.stderr?.on("data", (d) => {
    console.warn("[backend]", d.toString().trim());
  });
  backendProcess.on("exit", (code) => {
    console.warn("[backend-runner] exited with code", code);
    backendProcess = null;
  });
}

export function stopBackend(): void {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
    backendProcess = null;
  }
}
