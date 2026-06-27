"""Analytics aggregation over activity data."""

from collections.abc import Sequence
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.workflow import Workflow


def summary(db: Session, *, start: datetime | None = None, end: datetime | None = None) -> dict:
    base = select(Activity)
    if start is not None:
        base = base.where(Activity.timestamp >= start)
    if end is not None:
        base = base.where(Activity.timestamp <= end)

    base_sub = base.subquery()
    total_count = db.execute(select(func.count()).select_from(base_sub)).scalar_one()

    app_rows = db.execute(
        select(Activity.application, func.count().label("cnt"))
        .select_from(base_sub)
        .group_by(Activity.application)
        .order_by(func.count().desc())
        .limit(5)
    ).all()

    return {
        "productive_minutes": round(total_count * settings_default_interval_minutes(), 1),
        "idle_minutes": 0,
        "app_switches": max(0, total_count - 1),
        "most_used_apps": [{"application": r.application, "minutes": r.cnt} for r in app_rows],
        "workflow_count": db.execute(select(func.count()).select_from(Workflow)).scalar_one(),
    }


def settings_default_interval_minutes() -> float:
    return 5 / 60


def timeline(db: Session, *, start: datetime, end: datetime) -> Sequence[Activity]:
    query = (
        select(Activity)
        .where(Activity.timestamp >= start, Activity.timestamp <= end)
        .order_by(Activity.timestamp.asc())
    )
    return db.execute(query).scalars().all()


def daily_trend(db: Session, days: int = 7) -> list[dict]:
    end = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
    start = end - timedelta(days=days)
    query = (
        select(
            func.date(Activity.timestamp).label("day"),
            func.count().label("cnt"),
        )
        .where(Activity.timestamp >= start)
        .group_by(func.date(Activity.timestamp))
        .order_by("day")
    )
    rows = db.execute(query).all()
    return [{"date": str(r.day), "count": r.cnt} for r in rows]


def app_breakdown(db: Session, *, start: datetime | None = None, end: datetime | None = None) -> list[dict]:
    base = select(Activity)
    if start is not None:
        base = base.where(Activity.timestamp >= start)
    if end is not None:
        base = base.where(Activity.timestamp <= end)
    base_sub = base.subquery()
    rows = db.execute(
        select(Activity.application, func.count().label("cnt"))
        .select_from(base_sub)
        .group_by(Activity.application)
        .order_by(func.count().desc())
    ).all()
    return [{"application": r.application, "count": r.cnt} for r in rows]
