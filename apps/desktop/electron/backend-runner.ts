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

function bundledPythonZip(pythonDir: string): string | null {
  try {
    const zip = fs.readdirSync(pythonDir).find((file) => /^python\d+\.zip$/i.test(file));
    return zip ? path.join(pythonDir, zip) : null;
  } catch {
    return null;
  }
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
  let pythonDir = "";

  if (opts.preferExternal || !bundled) {
    python = uvBinary();
    args = ["run", "python", scriptPath];
    cwd = root;
  } else {
    python = bundled;
    cwd = root;
    pythonDir = path.dirname(python);
    // Embeddable Python may ignore PYTHONPATH when a python3xx._pth file is
    // present. Add the backend root explicitly instead of modifying files in
    // the installed application directory (which can be read-only).
    args = [
      "-c",
      `import runpy, sys; sys.path.insert(0, ${JSON.stringify(root)}); runpy.run_module("app.main", run_name="__main__")`,
    ];
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
            PYTHONPATH: [
              root,
              path.join(root, "app"),
              path.join(pythonDir, "Lib", "site-packages"),
              pythonDir,
              bundledPythonZip(pythonDir),
            ].filter((entry): entry is string => Boolean(entry)).join(path.delimiter),
          }
        : {}),
    },
  });

  const child = backendProcess;
  child.stdout?.on("data", (d) => {
    console.log("[backend]", d.toString().trim());
  });
  child.stderr?.on("data", (d) => {
    console.warn("[backend]", d.toString().trim());
  });
  child.on("error", (err) => {
    console.error("[backend-runner] failed to start:", err);
    if (backendProcess === child) backendProcess = null;
  });
  child.on("exit", (code) => {
    console.warn("[backend-runner] exited with code", code);
    if (backendProcess === child) backendProcess = null;
  });
}

export function stopBackend(): void {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
    backendProcess = null;
  }
}
