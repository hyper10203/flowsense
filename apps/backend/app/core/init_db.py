"""Initialize the database file, create tables, and ensure indexes exist."""

from pathlib import Path

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.models import (  # noqa: F401
    Activity,
    DailyStat,
    FlowSession,
    Setting,
    Suggestion,
    Workflow,
    WorkflowStep,
)


def init_db() -> None:
    data_dir = Path(settings.data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    if engine.dialect.name == "sqlite":
        from app.services.search_service import build_fts

        with SessionLocal() as db:
            build_fts(db)


if __name__ == "__main__":
    init_db()
    print("Database initialized.")
