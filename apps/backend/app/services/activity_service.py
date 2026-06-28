"""Activity ingestion, retrieval, and deletion."""

from collections.abc import Sequence
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.activity import Activity


def create_activity(
    db: Session,
    *,
    timestamp: datetime,
    application: str,
    window_title: str,
    url: str | None = None,
    command_line: str | None = None,
    event_type: str = "window_focus",
    duration_ms: int = 0,
    session_id: str | None = None,
) -> Activity:
    activity = Activity(
        timestamp=timestamp,
        application=application.strip(),
        window_title=window_title.strip(),
        url=url,
        command_line=command_line[:1024] if command_line else None,
        event_type=event_type,
        duration_ms=duration_ms,
        session_id=session_id,
        created_at=datetime.now(UTC),
    )
    db.add(activity)
    db.flush()
    db.refresh(activity)
    return activity


def list_activities(
    db: Session,
    *,
    page: int = 1,
    limit: int = 50,
    start: datetime | None = None,
    end: datetime | None = None,
    application: str | None = None,
) -> tuple[Sequence[Activity], int]:
    query = select(Activity)
    if start is not None:
        query = query.where(Activity.timestamp >= start)
    if end is not None:
        query = query.where(Activity.timestamp <= end)
    if application:
        query = query.where(Activity.application == application)

    count_query = select(func.count()).select_from(query.subquery())
    total = db.execute(count_query).scalar_one()

    query = query.order_by(Activity.timestamp.desc()).offset((page - 1) * limit).limit(limit)
    items = db.execute(query).scalars().all()
    return items, total


def delete_all(db: Session) -> int:
    count = db.query(Activity).delete() or 0
    db.flush()
    return count
