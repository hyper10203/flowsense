
# TASKS.md

# FlowSense Master Implementation Checklist

> Execute tasks in order. Complete, test, commit, and push after each milestone using the GitHub account already authenticated on the development machine.

---

# Phase 1 — Repository Setup

- [ ] Create monorepo structure
- [ ] Configure Electron
- [ ] Configure React + TypeScript
- [ ] Configure FastAPI
- [ ] Configure SQLite
- [ ] Configure ESLint
- [ ] Configure Prettier
- [ ] Configure Python formatter (Ruff/Black)
- [ ] Configure environment variables
- [ ] Verify local startup

---

# Phase 2 — Database

- [ ] Create migrations
- [ ] Create activities table
- [ ] Create workflows table
- [ ] Create workflow_steps table
- [ ] Create suggestions table
- [ ] Create settings table
- [ ] Create daily_stats table
- [ ] Add indexes
- [ ] Seed sample data
- [ ] Test CRUD operations

---

# Phase 3 — Desktop Activity Monitor

- [ ] Poll active window every 3–5 seconds
- [ ] Capture application name
- [ ] Capture window title
- [ ] Detect idle time
- [ ] Record timestamps
- [ ] Persist activity events
- [ ] Handle unsupported windows
- [ ] Add monitoring toggle

---

# Phase 4 — Chrome Extension

- [ ] Create Manifest V3 extension
- [ ] Capture active tab URL
- [ ] Capture page title
- [ ] Send events to backend
- [ ] Reconnect on restart
- [ ] Handle permission errors

---

# Phase 5 — Backend APIs

- [ ] Activity endpoints
- [ ] Workflow endpoints
- [ ] Suggestion endpoints
- [ ] Analytics endpoints
- [ ] Search endpoint
- [ ] Settings endpoint
- [ ] Health endpoint
- [ ] OpenAPI verification

---

# Phase 6 — Pattern Detection

- [ ] Normalize events
- [ ] Remove duplicates
- [ ] Generate sliding windows
- [ ] Hash sequences
- [ ] Count frequency
- [ ] Score confidence
- [ ] Merge similar workflows
- [ ] Save detected workflows

---

# Phase 7 — Gemini Integration

- [ ] Create prompt templates
- [ ] Validate JSON output
- [ ] Retry invalid responses
- [ ] Cache AI responses
- [ ] Store workflow names
- [ ] Store workflow summaries
- [ ] Store optimization suggestions

---

# Phase 8 — Frontend

## Dashboard
- [ ] Summary cards
- [ ] Activity feed
- [ ] Charts
- [ ] Quick actions

## Timeline
- [ ] Infinite scroll
- [ ] Filters
- [ ] Search
- [ ] Date picker

## Workflows
- [ ] Workflow cards
- [ ] Expanded details
- [ ] Accept/Dismiss actions

## Suggestions
- [ ] Suggestion cards
- [ ] Notification integration

## Analytics
- [ ] Daily charts
- [ ] Weekly charts
- [ ] Monthly charts
- [ ] Heatmap

## Settings
- [ ] General
- [ ] Privacy
- [ ] AI
- [ ] Appearance
- [ ] Storage

---

# Phase 9 — Search

- [ ] Full-text search
- [ ] Workflow search
- [ ] URL search
- [ ] Keyboard shortcut (Ctrl+K)

---

# Phase 10 — Notifications

- [ ] New workflow alerts
- [ ] Daily summary
- [ ] Weekly report
- [ ] Suggestion reminders

---

# Phase 11 — Testing

- [ ] Backend unit tests
- [ ] API integration tests
- [ ] Algorithm tests
- [ ] UI component tests
- [ ] Performance benchmarks
- [ ] Accessibility audit

---

# Phase 12 — Documentation

- [ ] Update README
- [ ] API documentation
- [ ] Architecture diagrams
- [ ] Screenshots
- [ ] Demo GIF/video

---

# Phase 13 — Release

- [ ] Production build
- [ ] Package Electron app
- [ ] Verify Windows build
- [ ] Verify clean installation
- [ ] Final regression test
- [ ] Tag v1.0.0
- [ ] Push repository

---

# Stretch Goals

- [ ] AutoHotkey export
- [ ] AppleScript export
- [ ] Focus mode
- [ ] Weekly productivity report
- [ ] Keyboard shortcut sequence detection
- [ ] Notion integration
- [ ] Slack integration

---

# Milestone Rules

After every completed phase:
1. Run linting
2. Run tests
3. Fix issues
4. Commit with conventional commit messages
5. Push to the authenticated GitHub account
6. Update README if functionality changed

---

# Final Definition of Done

- [ ] All required features implemented
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Application packages successfully
- [ ] Performance targets achieved
- [ ] Privacy requirements satisfied
- [ ] Repository pushed to GitHub
