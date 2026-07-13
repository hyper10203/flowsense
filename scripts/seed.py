"""Seed the local SQLite database with sample activity data for development."""

import os
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "apps" / "backend"))

from app.core.database import SessionLocal, engine, Base  # noqa: E402
from app.models import Activity, Workflow, WorkflowStep, Suggestion, Setting, DailyStat  # noqa: E402


APPS = [
    ("Chrome", "ChatGPT - Google Chat"),
    ("Chrome", "GitHub"),
    ("VS Code", "FlowSense — main.py"),
    ("Terminal", "zsh"),
    ("Chrome", "Stack Overflow"),
    ("VS Code", "FlowSense — App.tsx"),
    ("Discord", "general"),
    ("Spotify", "Liked Songs"),
    ("Notion", "Weekly Plan"),
    ("Figma", "Design System"),
]

# Keep each workflow step paired with a realistic window title.  The seeding
# loop below expects `(application, title)` pairs, rather than bare app names.
WORKFLOW = [APPS[1], APPS[2], APPS[3], APPS[4]]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
        events: list[Activity] = []
        for day_offset in range(7):
            day = now - timedelta(days=day_offset)
            for _ in range(20):
                for app, title in WORKFLOW:
                    ts = day.replace(hour=9, minute=0) + timedelta(
                        minutes=random.randint(0, 480)
                    )
                    events.append(
                        Activity(
                            timestamp=ts,
                            application=app,
                            window_title=title,
                            url="https://example.com" if app == "Chrome" else None,
                            event_type="window_focus" if app != "Chrome" else "browser_tab",
                            duration_ms=3000,
                            session_id=f"seed-{day_offset}",
                        )
                    )
        db.add_all(events)
        db.commit()
        print(f"Seeded {len(events)} activity events.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
