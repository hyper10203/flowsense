<div align="center">

# FlowSense

> **Stop repeating yourself. Your computer already noticed.**

A local-first desktop app that learns how you work, discovers repetitive workflows, and helps you move through them with less friction.

<p>
  <img src="https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white">
  <img src="https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white">
  <img src="https://img.shields.io/badge/License-MIT-success">
</p>

</div>

---

## What is FlowSense?

Most automation tools ask you to build workflows first.

FlowSense takes the opposite approach.

It quietly watches how you already use your computer, looks for repeated patterns, and suggests turning them into reusable workflows.

```text
Chrome
   ↓
VS Code
   ↓
Terminal
   ↓
Chrome

Repeated 18 times
```

No scripting. No complicated setup.
Just install it and keep working.

---

## Project Screenshot

> <img width="1280" height="922" alt="Screenshot 2026-07-02 15-04-48" src="https://github.com/user-attachments/assets/a65ed58a-8215-404d-b3fe-0a88a9d1921c" />

---

## Features

### Automatic workflow detection

FlowSense watches your desktop activity and detects workflows you repeat over time.

The detection engine runs locally and doesn't require AI.

---

### Flow Mode

Start any saved workflow and FlowSense guides you through each step using a floating overlay that stays above every application.

---

### Activity tracking

Track:

- Applications
- Browser URLs
- Terminal sessions
- Active window titles
- Time spent in each app

---

### AI workflow naming

Optionally connect your preferred model to generate names and summaries for detected workflows.

Supported providers:Google Gemini

No AI is compulsorily required to use FlowSense.

p.s.- Updates in future for more wider number of providers 

---

### Analytics

See how you spend your time with:

- Activity timeline
- Hourly usage
- App statistics
- Workflow frequency
- Productivity heatmaps

---

### Search

Search across:

- Applications
- Browser hosts
- Workflows
- Window titles

---

### Local-first

Your activity stays on your computer. FlowSense doesn't require an account or a cloud service.
The only external requests are optional AI calls that you explicitly configure. (I hate orgs invading our privacy and data for their use and income)

---

## How it works

```text
Desktop Activity
        │
        ▼
 Activity Monitor
        │
        ▼
 SQLite Database
        │
        ▼
 Pattern Detection
        │
        ▼
 Workflow Suggestions
        │
        ▼
      Flow Mode
```

---

## Tech Stack

### Desktop

- Electron
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Recharts

### Backend

- FastAPI
- SQLAlchemy
- SQLite
- Chrome Extension
  
---

## Project Structure

```text
flowsense/
├── apps/
│   ├── desktop/
│   ├── backend/
│   └── extension/
├── packages/
│   └── shared/
├── docs/
└── scripts/
```

---

## Getting Started

Clone the repository.

```bash
git clone https://github.com/hyper10203/flowsense.git
cd flowsense
```

Install dependencies.

```bash
npm install
```

Run the development environment.

```bash
npm run dev
```

---

## Privacy

FlowSense is designed to work locally. (again I hate invasion of my privacy hope yall appreciate it)

It never uploads:

- Keystrokes
- Clipboard contents
- Passwords
- Files
- Browser history

If AI naming is enabled, only a normalized workflow such as:

```text
Chrome → VS Code → Terminal
```

is sent to the selected provider.

---

## Roadmap

- [x] Desktop activity tracking
- [x] Workflow detection
- [x] Manual workflows
- [x] AI workflow naming
- [x] Chrome extension
- [x] Flow Mode
- [x] Browser URL tracking
- [x] Terminal tracking
- [x] Dynamic overlay
- [ ] Firefox extension
- [ ] Weekly reports
- [ ] Focus mode
- [ ] AutoHotkey export
- [ ] Conversational mode


---

## AI Usage Declaration

FlowSense uses AI in one narrow, optional role: **naming and summarizing detected workflows** (e.g. turning `Slack → Linear → Notion` into "Morning standup routine").

- **Providers:** Google Gemini.
- **What is sent:** Only a normalized sequence of application names — no window titles, URLs, keystrokes, or personal content.
- **What is NOT sent:** Everything else. Your raw activity log never leaves your machine.
- **Control:** AI is fully optional. Set your API key in Settings → AI features or via env vars to enable it; without it, FlowSense still tracks, detects, and reports — just with auto-generated names.

### Development Tools

This app was built using **Claude Code CLI** for code completion and **Stitch** for UI design. All logic, architecture, and shipping decisions, base coding was also done by me, only the extremely difficut debugging etc was done with help of ai models that also I had to help AI with lowk(humans better than ai). The tools helped me move fast and look good doing it.

---

## Contributing

If you find a bug, have an idea, or want to improve something, feel free to open an issue or submit a pull request.

---

## License

MIT

---

<div align="center">

Built by **Subham Paul Choudhury**

Started as a personal project to answer one question:

*"Where does all my time actually go?"*

</div>
