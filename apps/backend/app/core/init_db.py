"""Initialize the database file, create tables, and ensure indexes exist."""

from pathlib import Path

from app.core.config import settings
from app.core.database import engine, Base
from app.models import Activity, Workflow, WorkflowStep, Suggestion, Setting, DailyStat  # noqa: F401


def init_db() -> None:
    data_dir = Path(settings.data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database initialized.")
