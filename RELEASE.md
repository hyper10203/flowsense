# FlowSense v1.0.0

## Release Date

2026-06-29

## Upgrade Notes

This is a minor version bump from 0.1.0. No breaking changes. Existing user settings and database are preserved.

---

## Bug Fixes

- **Blank screen when switching to Workflows tab** — The `/api/v1/workflows` list endpoint returned `name` instead of `ai_name` and omitted the `steps` array. The frontend `Workflow` type expected both, causing a render-time crash with no Error Boundary (blank black screen). Fixed by aligning the API response with the `Workflow` interface.
- **App icon missing in packaged build** — The Electron window icon was resolved via a relative path from `__dirname`, which breaks inside the asar archive. Fixed by using `app.getAppPath()` in production. The NSIS installer now also uses the FlowSense icon (`public/icon.ico`) instead of the Electron default.
- **Topbar crash on unmounted window** — `startBackend(mainWindow)` was called before `mainWindow` was guaranteed non-null. Now called after `createMainWindow()`.

---

## New Features

### Backend Auto-Start with Desktop App

The FastAPI backend now launches automatically when the user opens FlowSense. No separate terminal or manual setup required.

- New module `apps/desktop/electron/backend-runner.ts` manages the backend lifecycle.
- Three-tier runtime detection:
  1. **Bundled embeddable Python** (`vendor/python/`) — shipped with the installer for users who have no Python.
  2. **`uv run`** — for users with the `uv` package manager.
  3. **System `python`** — fallback.
- Backend is killed cleanly on app quit.

### Bundled Backend Runtime (No Python Required)

`electron-builder` now ships the backend source and a vendored Python runtime as `extraResources`:

- `apps/desktop/package.json` — `extraResources` entries for `backend/` and `vendor/python/`.
- Setup script `scripts/setup-python.ps1` downloads embeddable Python 3.14, runs `ensurepip`, and installs the backend in editable mode into `vendor/python/`. Run once before `npm run build:desktop`.

### First-Run Setup Wizard

Replaces the old shortcut-only onboarding popup with a two-step wizard shown on first launch:

1. **Shortcuts** — Create desktop shortcut and pin to taskbar.
2. **AI Configuration** — Select provider (OpenRouter / Gemini / NVIDIA NIM / DeepSeek) and paste an API key. Saved directly to the backend settings store via IPC. Skippable; configurable later in Settings.

New component: `apps/desktop/src/components/onboarding/SetupWizard.tsx`.

### Error Boundary

A React Error Boundary (`apps/desktop/src/components/ui/ErrorBoundary.tsx`) now wraps the active page. Future render-time crashes display a red error box with the message instead of a blank black screen, making debugging possible without a console.

### Windows Installer Improvements

- `createDesktopShortcut: true` and `createStartMenuShortcut: true` — shortcuts created automatically by the NSIS installer.
- `icon: "public/icon.ico"` — installer and uninstaller show the FlowSense logo.
- `runAfterFinish: true` — option to launch FlowSense after install.
- `deleteAppDataOnUninstall: true` — cleans up on uninstall.

### API Key Configuration in Setup

Users no longer need to navigate to files or settings menus to configure the AI key. The setup wizard handles it on first launch, writing directly to the backend settings store.

---

## Changed Files

- `apps/backend/app/api/routes/workflow.py` — list endpoint now returns `ai_name` and `steps`.
- `apps/desktop/electron/main.ts` — backend start/stop on app lifecycle; icon resolution via `app.getAppPath()`.
- `apps/desktop/electron/backend-runner.ts` — new module for backend process management.
- `apps/desktop/src/App.tsx` — setup wizard + error boundary wiring.
- `apps/desktop/src/components/onboarding/SetupWizard.tsx` — new first-run wizard.
- `apps/desktop/src/components/onboarding/InstallerPrompts.tsx` — removed (replaced by SetupWizard).
- `apps/desktop/src/components/ui/ErrorBoundary.tsx` — new error boundary component.
- `apps/desktop/package.json` — extraResources, win.icon, public/* in files.
- `scripts/setup-python.ps1` — new setup script for vendored Python.
- All `package.json` / `pyproject.toml` / `manifest.json` — version bumped 0.1.0 → 1.0.0.

---

## Known Issues

- **OpenRouter "No endpoints found that support image input"** — non-fatal. The free image model is unavailable; workflow naming is skipped. Tracking image input separately.
- **Pin to taskbar requires user interaction** — Windows does not allow silent taskbar pinning; the setup wizard prompts the user to click.
- **Bundled Python is Windows x64 only** — arm64 and Linux/macOS users must provide their own Python runtime.

---

## Building

```bash
# One-time: vendor the Python runtime (Windows)
powershell scripts/setup-python.ps1

# Build the desktop app (creates NSIS installer on Windows)
cd apps/desktop
npm run build
```

The installer is output to `apps/desktop/release/FlowSense Setup 1.0.0.exe`.
