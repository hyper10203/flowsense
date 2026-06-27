# PROJECT.md

# FlowSense — Product Vision & Project Specification

## Mission

FlowSense is a local-first desktop productivity assistant that discovers repetitive digital workflows automatically and helps users reduce friction in their daily computer usage.

Unlike traditional automation tools that require users to define rules manually, FlowSense observes high-level activity (with explicit user permission), identifies recurring patterns, and proactively suggests improvements.

The application is intended to improve quality of life by:
1. Reducing repetitive manual work.
2. Reducing cognitive load by providing a searchable work timeline.
3. Increasing awareness of personal work habits through actionable insights.

---

# IMPORTANT IMPLEMENTATION INSTRUCTIONS FOR THE CODING AGENT

You are the primary software engineer for this repository.

Your objective is to deliver a production-quality MVP.

Do not repeatedly ask for confirmation for minor engineering decisions.

When multiple reasonable implementations exist:
- choose the simplest maintainable solution,
- document the decision,
- continue implementation.

Complete work incrementally.

After each completed milestone:
- commit changes with meaningful commit messages,
- use the GitHub account already authenticated on this machine,
- create a repository named `flowsense` (or `flowsense-app` if unavailable),
- push commits regularly,
- never expose API keys or secrets,
- generate a comprehensive README before final completion.

---

# Product Summary

FlowSense continuously records metadata such as:
- active application
- active window title
- timestamp
- duration
- browser tab title
- browser URL (domain + URL as configured)

It DOES NOT:
- record keystrokes
- capture screenshots
- inspect document contents
- read passwords
- spy on users

Privacy-first design is a core requirement.

---

# Primary Users

- Students
- Developers
- Designers
- Researchers
- Office workers
- Anyone performing repetitive computer workflows

---

# Core MVP

The MVP must include:

- Electron desktop application
- React + TypeScript frontend
- FastAPI backend
- SQLite database
- Chrome Extension (Manifest V3)
- Live activity timeline
- Workflow detection engine
- AI-generated workflow names
- AI suggestions
- Dashboard analytics
- Settings page
- Local notifications
- Export activity data (JSON)

---

# Quality of Life Improvements

## 1. Reduce Repetitive Work

Detect repeated workflows and recommend reusable routines.

Example:
Chrome → VS Code → Terminal → Chrome

Repeated 15+ times.

Generate:
"Debugging Workflow"

---

## 2. Reduce Cognitive Load

Provide a searchable timeline so users no longer need to remember:
- what they worked on,
- where they found a resource,
- which app they used.

---

## 3. Improve Productivity Awareness

Display:
- most used apps
- frequent workflows
- app-switch frequency
- hourly activity
- daily summaries

---

# Success Criteria

A successful MVP should allow a user to:

- install the desktop app
- install the Chrome extension
- see activity appear live
- browse historical activity
- detect repeated workflows
- receive AI-generated workflow names
- receive automation suggestions
- view analytics
- export their data

---

# Non-Goals

Do NOT build:
- cloud sync
- user authentication
- team collaboration
- OCR
- screenshot recording
- microphone recording
- keylogging
- remote monitoring

---

# Engineering Principles

- Local-first
- Modular architecture
- Clean code
- Type safety
- Strong documentation
- Reusable UI components
- Privacy by default
- Fast startup
- Low memory usage

---

# Deliverables

The finished repository must include:

- working Electron application
- working FastAPI backend
- Chrome extension
- SQLite database
- documentation
- README
- setup instructions
- screenshots placeholders
- sample data generator
- unit tests for backend services
- lint configuration
- formatting configuration

---

# Definition of Done

The project is complete only when:

- builds successfully
- launches without errors
- records activity
- detects workflows
- AI integration functions
- documentation is complete
- commits are clean
- repository has been pushed using the authenticated GitHub account available on the development machine.
