# FEATURES.md

# FlowSense — Complete Feature Specification

> This document defines every user-facing and system feature for FlowSense.
> It is intended for autonomous coding agents (Claude Code, Codex, Cursor, etc.).
> Implement all features unless explicitly marked as future scope.

## Mission

FlowSense is a **local-first desktop productivity assistant** that observes high-level computer activity, discovers repetitive workflows, visualizes work habits, and recommends productivity improvements while respecting user privacy.

## Guiding Principles

- Local-first by default.
- Never capture keystroke contents or sensitive input.
- AI is used only for summarization and workflow naming.
- Pattern detection must be deterministic.
- Every feature should degrade gracefully if AI is unavailable.

---

# Feature 1 — Desktop Activity Monitoring

## Purpose

Collect high-level desktop activity without recording sensitive user data.

## Data Collected

- Active application
- Window title
- Process name
- Time opened
- Time closed
- Active duration
- Idle duration

## Supported Applications

- Chrome
- Edge
- Firefox
- VS Code
- Cursor
- IntelliJ
- Terminal
- Explorer/Finder
- Discord
- Slack
- Spotify
- Notion
- Figma
- Word
- Excel
- PowerPoint

## Functional Requirements

- Poll active window every 3–5 seconds.
- Merge consecutive identical activities.
- Ignore system windows.
- Pause when computer is locked.

Acceptance Criteria:
- No duplicate activity spam.
- Accurate duration tracking.
- <5% CPU usage.

---

# Feature 2 — Browser Activity

Use a Chrome Extension (Manifest V3).

Collect:
- URL
- Domain
- Tab title
- Timestamp

Never collect:
- Passwords
- Form contents
- Cookies
- Authentication tokens

Only active tab events are stored.

---

# Feature 3 — Activity Timeline

Provide a chronological history of work.

Capabilities:
- Infinite scrolling
- Date grouping
- Search
- Filters
- Icons by application
- Duration display

Filters:
- App
- Date
- Website
- Duration
- Workflow

---

# Feature 4 — Dashboard

Cards:
- Today's Active Time
- Most Used App
- Total App Switches
- Top Workflow
- Suggestions
- Productivity Score

Charts:
- Hourly Activity
- Application Usage
- Website Usage
- Daily Trend

---

# Feature 5 — Workflow Detection

Core innovation.

Pipeline:

1. Normalize events.
2. Remove duplicates.
3. Sliding window generation.
4. Hash sequences.
5. Count frequency.
6. Merge similar patterns.
7. Score confidence.

Example:

Chrome
→ VS Code
→ Terminal
→ Chrome

Repeated 19 times.

Generate workflow.

---

# Feature 6 — AI Naming

After deterministic detection:

Prompt Gemini to produce:

- Workflow Name
- Description
- Purpose
- Automation Suggestion

Expected JSON:

```json
{
  "name":"",
  "purpose":"",
  "description":"",
  "automationSuggestion":""
}
```

Retry malformed JSON up to 3 times.

---

# Feature 7 — Suggestions

Suggestions page displays:

- Workflow
- Frequency
- Last Used
- Estimated Time Saved
- Accept
- Dismiss

Accepted suggestions become saved workflows.

Dismissed suggestions should not reappear immediately.

---

# Feature 8 — Saved Workflows

Store:

- Name
- Steps
- Frequency
- Created Date
- AI Summary

Future support:
- Export to AutoHotkey
- Export to AppleScript

---

# Feature 9 — Analytics

Provide:

- Hourly Heatmap
- Weekly Trends
- Monthly Usage
- App Breakdown
- Website Breakdown
- Longest Session
- Focus Time
- Context Switch Count

---

# Feature 10 — Notifications

Examples:

"You've repeated this workflow 8 times today."

"Looks like your morning routine is ready to automate."

Notifications must be rate limited.

---

# Feature 11 — Settings

Options:

Privacy
- Enable Monitoring
- Browser Tracking
- AI Suggestions

Performance
- Polling Interval
- Startup Launch
- Notifications

Appearance
- Dark Mode
- Light Mode
- Accent Color

Data
- Export Database
- Import Database
- Delete All Data

---

# Feature 12 — Search

Search across:

- Applications
- Websites
- Window Titles
- Workflow Names

Support fuzzy matching.

---

# Feature 13 — Productivity Score

Calculated using:

- Focus sessions
- App switching
- Repeated workflows
- Idle time

Display trends instead of judging users.

---

# Feature 14 — Privacy

Requirements:

- No cloud sync.
- No authentication.
- SQLite stored locally.
- AI receives only anonymized workflow sequences.
- Never upload browsing history verbatim.

---

# Feature 15 — Error Handling

Handle:

- Extension disconnected
- SQLite unavailable
- AI timeout
- Electron restart
- Backend crash

Application should recover automatically.

---

# Feature 16 — Git Integration

The coding agent should:

- Initialize Git.
- Use the GitHub account already authenticated on the development machine.
- Commit after every completed milestone.
- Use clear Conventional Commit messages.
- Push changes to the remote repository after stable milestones.
- Never overwrite existing Git configuration unless required.

---

# Feature 17 — Accessibility

Support:

- Keyboard navigation
- High contrast
- Screen readers
- Scalable fonts

---

# Future Features

- AutoHotkey export
- AppleScript export
- Slack integration
- Notion integration
- Weekly reports
- Focus Mode
- Multi-monitor awareness
- Keyboard shortcut pattern detection
- Plugin system

---

# Definition of Done

A feature is complete only if:

- UI implemented
- Backend complete
- Tests written
- Errors handled
- Documentation updated
- Responsive layout verified
- No TypeScript or lint errors
- Successfully committed and pushed to GitHub

