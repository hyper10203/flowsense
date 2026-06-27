"""Full-text search backed by SQLite FTS5 (graceful fallback to LIKE)."""


from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.workflow import Workflow


def _has_fts(db: Session) -> bool:
    try:
        db.execute(text("SELECT 1 FROM activities_fts LIMIT 1"))
        return True
    except Exception:
        return False


def build_fts(db: Session) -> None:
    db.execute(
        text(
            "CREATE VIRTUAL TABLE IF NOT EXISTS activities_fts USING fts5("
            "application, window_title, url, content='activities', content_rowid='id'"
            ")"
        )
    )
    db.execute(
        text(
            "INSERT INTO activities_fts(activities_fts) VALUES('rebuild')"
        )
    )
    db.commit()


def search(db: Session, query: str, *, limit: int = 20) -> dict:
    q = (query or "").strip()
    if not q:
        return {"activities": [], "workflows": []}
    if _has_fts(db):
        rows = db.execute(
            text(
                "SELECT rowid FROM activities_fts WHERE activities_fts MATCH :q LIMIT :limit"
            ),
            {"q": q, "limit": limit},
        ).all()
        ids = [r[0] for r in rows]
        activities = (
            db.execute(select(Activity).where(Activity.id.in_(ids))).scalars().all() if ids else []
        )
    else:
        like = f"%{q}%"
        activities = (
            db.execute(
                select(Activity)
                .where(
                    Activity.application.ilike(like)
                    | Activity.window_title.ilike(like)
                    | Activity.url.ilike(like),
                )
                .limit(limit)
            )
            .scalars()
            .all()
        )

    workflows = (
        db.execute(
            select(Workflow).where(
                Workflow.ai_name.ilike(f"%{q}%") | Workflow.description.ilike(f"%{q}%")
            )
        )
        .scalars()
        .all()
    )
    return {"activities": activities, "workflows": workflows}
