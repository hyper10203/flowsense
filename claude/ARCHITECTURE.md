# ARCHITECTURE.md

# FlowSense Architecture

## High-Level Architecture

```text
+----------------------+
| Electron Desktop App |
|  React + TypeScript  |
+----------+-----------+
           |
        Electron IPC
           |
+----------v-----------+
| Local Activity Agent |
+----------+-----------+
           |
 HTTP/WebSocket
           |
+----------v-----------+
| FastAPI Backend      |
| - Activity Service   |
| - Pattern Engine     |
| - AI Service         |
| - Export Service     |
+----------+-----------+
           |
      SQLAlchemy
           |
+----------v-----------+
| SQLite Database      |
+----------------------+

Chrome Extension
      |
      +------> FastAPI (/activity/browser)
```

## Monorepo

```text
flowsense/
├── apps/
│   ├── desktop/
│   │   ├── electron/
│   │   ├── src/
│   │   └── package.json
│   ├── backend/
│   │   ├── app/
│   │   ├── tests/
│   │   └── requirements.txt
│   └── extension/
├── packages/
│   └── shared/
├── docs/
└── README.md
```

## Desktop Responsibilities

- Launch Electron shell
- Host React UI
- Poll active window every 3–5 seconds
- Send activity to backend
- Display notifications
- Handle settings and export

## Backend Responsibilities

- Validate activity events
- Store events
- Aggregate analytics
- Detect repeated workflows
- Invoke Gemini after threshold reached
- Return dashboard data

## Chrome Extension

Capture only:
- Active tab URL
- Page title
- Domain
- Timestamp

Never capture:
- Passwords
- Form contents
- Page DOM
- Cookies

## Database Flow

1. Activity received
2. Validate
3. Persist
4. Trigger workflow detector
5. Store workflow if threshold met
6. Generate AI summary
7. Cache result

## IPC

Renderer must never access OS APIs directly.

Renderer → Main:
- startMonitoring
- stopMonitoring
- exportData
- openSettings

Main → Renderer:
- activityUpdate
- notification
- exportFinished

## Polling Strategy

- Default interval: 5 seconds
- Configurable: 2–30 seconds
- Ignore duplicate consecutive events unless duration changes.

## Pattern Detection Pipeline

```text
Activity
  ↓
Normalize
  ↓
Sliding Window
  ↓
Hash Sequence
  ↓
Frequency Count
  ↓
Threshold Check
  ↓
Gemini Naming
  ↓
Suggestion Stored
```

## AI Integration

Call Gemini only when:
- Frequency >= configurable threshold
- Workflow not previously named
- Sequence length between 3 and 10 events

Expect strict JSON responses.

## Security

- Local-first storage
- No cloud sync
- API keys loaded from .env
- Secrets never committed
- CORS restricted to desktop app

## Logging

Backend:
- request logs
- errors
- workflow detection

Desktop:
- monitoring lifecycle
- IPC errors

## Performance Targets

- Startup <3 seconds
- Dashboard load <500 ms
- Activity processing <100 ms/event
- Memory usage <250 MB for desktop app

## Extensibility

Future modules:
- Native automation generation
- Multi-browser support
- Weekly reports
- Plugin system
- Notion integration
- Slack integration

## Coding Constraints

- SOLID principles
- Dependency injection where practical
- Reusable services
- No business logic in React components
- Thin controllers, fat services
