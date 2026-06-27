
# API.md

# FlowSense Backend API Specification

## Overview
The backend is a local FastAPI service. All endpoints are localhost-only and require no authentication in the MVP.

Base URL:
```
http://127.0.0.1:8000/api/v1
```

---

# Activity

## POST /activity
Ingest a new activity event.

Request
```json
{
  "timestamp":"2026-06-27T10:30:00Z",
  "application":"Chrome",
  "window_title":"ChatGPT",
  "url":"https://chat.openai.com/",
  "event_type":"window_focus",
  "duration_ms":4500
}
```

Response
```json
{
  "success": true,
  "id": 1523
}
```

Validation
- timestamp required
- application required
- duration_ms >= 0

---

## GET /activity

Query Parameters
- page
- limit
- start
- end
- application

Returns paginated activity history.

---

## DELETE /activity

Delete all activity history.

---

# Workflows

## GET /workflows

Returns detected workflows sorted by frequency.

Response
```json
[
  {
    "id":1,
    "name":"Morning Workspace",
    "frequency":18,
    "confidence":0.93
  }
]
```

---

## GET /workflows/{id}

Returns workflow details including ordered steps.

---

## POST /workflows/{id}/accept

Marks workflow as accepted.

---

## POST /workflows/{id}/dismiss

Dismiss recommendation.

---

# Suggestions

## GET /suggestions

Returns pending AI suggestions.

---

# Analytics

## GET /analytics/summary

Returns
- productive time
- idle time
- app switches
- most used apps
- workflow count

---

## GET /analytics/timeline

Returns timeline events for charts.

---

## GET /analytics/apps

Returns application usage statistics.

---

# Search

## GET /search

Supports searching:
- applications
- URLs
- workflow names
- window titles

---

# Settings

## GET /settings

Returns all user settings.

## PUT /settings

Update settings.

Supported keys:
- polling_interval
- dark_mode
- notifications
- retention_period
- gemini_enabled

---

# Health

## GET /health

Returns

```json
{
 "status":"ok"
}
```

---

# Extension Endpoint

## POST /extension/activity

Chrome extension posts:
- URL
- tab title
- timestamp

---

# IPC Contracts

Electron communicates with backend through REST.

Frontend never accesses SQLite directly.

---

# Error Format

```json
{
 "success":false,
 "error":"Validation Error",
 "details":"application field missing"
}
```

HTTP Codes

- 200 OK
- 201 Created
- 400 Bad Request
- 404 Not Found
- 422 Validation Error
- 500 Internal Error

---

# Versioning

All APIs under:

```
/api/v1/
```

Future breaking changes use v2.

---

# Performance Targets

- GET requests <100ms
- POST activity <25ms
- Support continuous ingestion every 3–5 seconds.

---

# Implementation Rules for Claude/Codex

- Generate OpenAPI automatically.
- Use Pydantic models.
- Validate every request.
- Return consistent JSON.
- Add unit tests for every endpoint.
- Commit after completing each API module.
- Push changes using the GitHub account already authenticated on the machine.

---

# Definition of Done

- All endpoints implemented
- Validation complete
- OpenAPI docs available
- Tests passing
- No endpoint returns unhandled exceptions
