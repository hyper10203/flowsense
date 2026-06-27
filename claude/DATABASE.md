
# DATABASE.md

## Purpose
This document defines the complete local database design for FlowSense.

## Database
- SQLite (single local database)
- WAL mode enabled
- Foreign keys enabled
- Indexed for fast timeline and workflow lookup

## Tables

### activities
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK |
| timestamp | DATETIME |
| application | TEXT |
| window_title | TEXT |
| url | TEXT NULL |
| event_type | TEXT |
| duration_ms | INTEGER |
| session_id | TEXT |
| created_at | DATETIME |

Indexes:
- timestamp
- application
- session_id

### workflows
Stores detected repeated sequences.

Columns:
- id
- hash (unique)
- ai_name
- description
- frequency
- confidence
- first_seen
- last_seen

### workflow_steps
Stores each step belonging to a workflow.

Columns:
- id
- workflow_id (FK)
- step_order
- application
- window_title
- url_pattern

### suggestions
Columns:
- id
- workflow_id
- status (pending/accepted/dismissed)
- shown_at
- action_at

### settings
Stores local application preferences.

Columns:
- key
- value

### daily_stats
Pre-computed analytics.

Columns:
- date
- productive_minutes
- idle_minutes
- app_switches
- workflows_detected

## Relationships
activities -> workflow detector -> workflows -> workflow_steps -> suggestions

## Data Retention
- Default retention: unlimited
- User may delete:
  - last hour
  - today
  - last week
  - all history

## Migration Strategy
Use versioned SQL migrations.
Never modify existing migrations.

## Performance Requirements
- Timeline query <100 ms
- Dashboard load <500 ms
- Support at least 1 million activity records.

## Backup
- Manual export/import
- JSON export
- SQLite backup
- No cloud sync in MVP

## Privacy
Everything remains on-device.
No activity leaves the computer except optional Gemini prompts used only for workflow naming.

## Git Instructions for Coding Agent
When implementing:
1. Create migrations first.
2. Seed development data.
3. Test indexes.
4. Commit after completion.
5. Push to the GitHub account already authenticated on the local machine.

## Definition of Done
- All tables created
- Foreign keys validated
- Indexes added
- Migrations working
- CRUD operations tested
- Export/import functional
