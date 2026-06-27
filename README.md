<div align="center">

# FlowSense

### **Stop repeating yourself. Your computer already noticed.**

<p>
  <img src="https://img.shields.io/badge/Built%20with-Electron-47848F?logo=electron&logoColor=white">
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black">
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white">
  <img src="https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite&logoColor=white">
  <img src="https://img.shields.io/badge/AI-Gemini-8E75FF">
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

[✨ Create Workflow]
```

No scripting. No programming. No cloud accounts. No setup.

---

## Features

| | |
|---|---|
| Desktop Activity Tracking | Detects active applications and windows |
| Browser Companion | Tracks active tabs via Chrome extension |
| Workflow Detection | Finds repeated sequences automatically |
| AI Summaries | Gives workflows human-readable names |
| Analytics | Usage trends, heatmaps, workflow frequency |
| Universal Search | Apps, URLs, workflows, and titles |
| Smart Suggestions | Helpful notifications — not annoying ones |
| Dark Mode | Because your eyes deserve rights |

---

## Architecture

```text
Chrome Extension
      │
      ▼
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
  Gemini (optional)       ← naming + summaries only
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
cp .env.example .env        # optional: add GEMINI_API_KEY for AI naming
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

## Configuration

Backend settings live in `apps/backend/.env`:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./data/flowsense.db` | SQLite database path |
| `PORT` | `8000` | Backend port |
| `GEMINI_API_KEY` | (unset) | Optional Gemini API key for AI naming |
| `WORKFLOW_MIN_CONFIDENCE` | `0.75` | Minimum confidence to surface a workflow |
| `WORKFLOW_MIN_FREQUENCY` | `3` | Minimum repetitions before detection |

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
```

---

## Roadmap

- [x] Local activity tracking
- [x] Workflow detection
- [x] AI naming
- [x] Chrome extension
- [x] Desktop app
- [ ] One-click workflow launcher
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
