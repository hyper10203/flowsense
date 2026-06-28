<div align="center">

# FlowSense

### **Stop repeating yourself. Your computer already noticed.**

<p>
  <img src="https://img.shields.io/badge/Built%20with-Electron-47848F?logo=electron&logoColor=white">
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black">
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white">
  <img src="https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite&logoColor=white">
  <img src="https://img.shields.io/badge/AI-Multi--Provider-8E75FF">
  <img src="https://img.shields.io/badge/License-MIT-success">
</p>

**FlowSense quietly watches your high-level desktop activity and discovers repetitive workflows on its own.**

</div>

---

## Why FlowSense?

Most automation tools ask: *"What do you want to automate?"*

FlowSense asks: *"Why are you still doing this manually?"*

```text
Chrome
   ↓
VS Code
   ↓
Terminal
   ↓
Chrome

Seen 23 times this week.

[Create Workflow]
```

No scripting. No programming. No cloud accounts. No setup.

---

## What's New

- **Dynamic Island overlay** — a persistent pill that floats above *every* app on your screen, showing your current workflow step with a Continue button. Travels with you across all windows.
- **Multi-provider AI** — choose Google Gemini, OpenRouter, NVIDIA NIM, or DeepSeek for workflow naming. Configure in Settings → AI features.
- **Terminal + URL tracking** — captures active terminal context (command line) and browser URLs, not just app names.
- **Workflow rename** — click any workflow title to rename it inline.
- **Merged workflows + suggestions** — single page with tabs: your saved workflows and AI suggestions.
- **First-launch installer** — prompts to create desktop shortcut and pin to taskbar.
- **Workflow cards on dashboard** — your saved workflows are front-and-center on the home screen.

---

## Features

| | |
|---|---|
| Desktop Activity Tracking | Detects active applications, windows, terminal commands, and browser URLs |
| Workflow Detection | Finds repeated sequences automatically via sliding-window mining |
| AI Workflow Naming | Names and describes your workflows using your choice of LLM provider |
| Flow Mode | Step-by-step workflow launcher with Dynamic Island-style overlay |
| Analytics | Usage trends, heatmaps, hourly breakdown, workflow frequency |
| Universal Search | Apps, URLs, workflows, and titles |
| Smart Suggestions | AI-generated workflow suggestions — accept or dismiss |
| Workflow Rename | Click to rename any workflow inline |
| Dark Mode | Because your eyes deserve rights |
| Local-first Privacy | Everything stays on your machine |

---

## Architecture

```text
Electron Desktop App
      │
      ▼
  FastAPI Backend
      │
      ▼
   SQLite (WAL)
      │
      ▼
Pattern Detection Engine  ← deterministic, no AI
      │
      ▼
  AI Provider (optional)  ← Gemini / OpenRouter / NVIDIA NIM / DeepSeek
```

---

## Project Structure

```text
flowsense/
├─ apps/
│  ├─ desktop/     Electron + React + Tailwind + shadcn + Framer Motion + Recharts
│  ├─ backend/     FastAPI + SQLAlchemy + Pydantic + SQLite
│  └─ extension/   Chrome Manifest V3
├─ packages/
│  └─ shared/      Cross-app TypeScript types
├─ scripts/        Seed data and utilities
└─ docs/           Documentation
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- Python ≥ 3.12
- npm ≥ 10

### Install

```bash
git clone https://github.com/hyper10203/flowsense.git
cd flowsense
npm install
```

### Run Backend

```bash
cd apps/backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env        # optional: add AI API key for AI naming
python -m app.main          # starts on http://127.0.0.1:8000
```

### Run Desktop App

```bash
npm run dev:desktop
```

### Load Chrome Extension

1. Visit `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `apps/extension/dist`
4. Click the FlowSense toolbar icon to start tracking

---

## Configuration

Backend settings live in `apps/backend/.env`:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./data/flowsense.db` | SQLite database path |
| `PORT` | `8000` | Backend port |
| `AI_PROVIDER` | `gemini` | AI provider: `gemini`, `openrouter`, `nvidia_nim`, `deepseek` |
| `AI_API_KEY` | (unset) | API key for the selected AI provider |
| `AI_MODEL` | (provider default) | Model name for the AI provider |
| `GEMINI_API_KEY` | (unset) | Legacy: Gemini-specific key (use AI_API_KEY instead) |
| `WORKFLOW_MIN_CONFIDENCE` | `0.3` | Minimum confidence to surface a workflow |
| `WORKFLOW_MIN_FREQUENCY` | `2` | Minimum repetitions before detection |

### AI Providers

| Provider | env var | Default model |
|---|---|---|
| Google Gemini | `GEMINI_API_KEY` | `gemini-2.0-flash` |
| OpenRouter | `OPENROUTER_API_KEY` | `google/gemini-2.0-flash-001:free` |
| NVIDIA NIM | `NVIDIA_NIM_API_KEY` | `google/gemma-2-27b-it` |
| DeepSeek | `DEEPSEEK_API_KEY` | `deepseek-chat` |

You can also configure the provider, API key, and model from the desktop app under **Settings → AI features**.

---

## Development

```bash
# Run all services concurrently
npm run dev

# Run tests
npm run test

# Type check
npm run typecheck

# Lint
npm run lint

# Seed sample data
python scripts/seed.py

# Build for production (creates NSIS installer on Windows)
npm run build:desktop
```

---

## Privacy

FlowSense is **local-first**.

Your activity stays on your computer.

The AI never receives:
- Keystrokes
- Clipboard contents
- Passwords
- Personal files
- Browser history

If AI is enabled, it only receives a tiny normalized workflow summary like `Chrome → VS Code → Terminal`.

---

## AI Usage Declaration

FlowSense uses AI in one narrow, optional role: **naming and summarizing detected workflows** (e.g. turning `Slack → Linear → Notion` into "Morning standup routine").

- **Providers:** Google Gemini, OpenRouter, NVIDIA NIM, or DeepSeek (your choice).
- **What is sent:** Only a normalized sequence of application names — no window titles, URLs, keystrokes, or personal content.
- **What is NOT sent:** Everything else. Your raw activity log never leaves your machine.
- **Control:** AI is fully optional. Set your API key in Settings → AI features or via env vars to enable it; without it, FlowSense still tracks, detects, and reports — just with auto-generated names.
- **No telemetry, no tracking, no cloud accounts.** The only outbound call is the one you explicitly configure.

---

## Roadmap

- [x] Local activity tracking
- [x] Workflow detection
- [x] AI naming
- [x] Chrome extension
- [x] Desktop app
- [x] Dynamic Island flow overlay
- [x] Multi-provider AI support
- [x] Terminal + URL tracking
- [x] Workflow rename
- [x] Merged workflows + suggestions
- [x] First-launch installer prompts
- [ ] Firefox support
- [ ] Weekly reports
- [ ] Focus mode
- [ ] Export to AutoHotkey / AppleScript

---

## Contributing

Found a bug? Open an issue.
Got a cool idea? Open a PR.

---

## License

MIT

<div align="center">

**Work smarter. Or at least let your computer point out you're doing the same thing 47 times.**

</div>
