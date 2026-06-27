
# IPC.md

# Electron Communication Architecture

## Processes

Main Process
- Window lifecycle
- Native APIs
- Notifications
- Activity monitor

Renderer
- React UI
- State management
- REST calls

Preload
- Safe bridge
- Expose limited APIs

FastAPI
- Business logic
- SQLite
- Pattern detection

---

## Flow

Activity Monitor
    ↓
Electron Main
    ↓
IPC
    ↓
Renderer
    ↓
FastAPI
    ↓
SQLite

---

## Exposed APIs

window.flowSense

Methods:
- startMonitoring()
- stopMonitoring()
- getVersion()
- openSettings()
- exportData()
- importData()
- showNotification()

Never expose Node APIs directly.

---

## Events

Main → Renderer
- monitoring-started
- monitoring-stopped
- workflow-detected
- database-updated

Renderer → Main
- toggle-monitoring
- open-dialog
- export-request
- import-request

---

## Rules

- Context Isolation ON
- Node Integration OFF
- Validate all IPC payloads
- Strong typing for IPC events
- No business logic in preload
