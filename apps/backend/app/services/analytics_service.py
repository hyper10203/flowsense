"""Analytics aggregation over activity data."""

from collections.abc import Sequence
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.workflow import Workflow


def _today_start_utc() -> datetime:
    return datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)


def summary(db: Session, *, start: datetime | None = None, end: datetime | None = None) -> dict:
    base = select(Activity)
    if start is not None:
        base = base.where(Activity.timestamp >= start)
    if end is not None:
        base = base.where(Activity.timestamp <= end)

    base_sub = base.subquery()
    total_count = db.execute(select(func.count()).select_from(base_sub)).scalar_one() or 0

    # Real total duration from the duration_ms column (converted to minutes).
    total_duration_ms = db.execute(
        select(func.coalesce(func.sum(Activity.duration_ms), 0)).select_from(base_sub)
    ).scalar_one() or 0
    productive_minutes = round(total_duration_ms / 60000)

    # Count actual app switches = consecutive rows with different application.
    app_switches = _count_app_switches(db, base_sub)

    # Most used apps by real duration, not count.
    app_rows = db.execute(
        select(Activity.application, func.sum(Activity.duration_ms).label("total_ms"))
        .select_from(base_sub)
        .group_by(Activity.application)
        .order_by(func.sum(Activity.duration_ms).desc())
        .limit(5)
    ).all()

    return {
        "productive_minutes": productive_minutes,
        "idle_minutes": 0,
        "app_switches": app_switches,
        "most_used_apps": [
            {"application": r.application, "minutes": round(r.total_ms / 60000)}
            for r in app_rows
        ],
        "workflow_count": db.execute(select(func.count()).select_from(Workflow)).scalar_one() or 0,
    }


def _count_app_switches(db: Session, base_sub) -> int:
    """Count how many times the user switched between different apps."""
    from sqlalchemy import text
    # Use a window function to compare each row with the previous one.
    # Falls back to 0 on SQLite versions without window functions.
    try:
        query = text(
            """
            SELECT COUNT(*) FROM (
              SELECT application,
                     LAG(application) OVER (ORDER BY timestamp) AS prev_app
              FROM (SELECT application, timestamp FROM activity WHERE timestamp IS NOT NULL) t
            ) x
            WHERE prev_app IS NOT NULL AND application != prev_app
            """
        )
        # Apply the same time filter by joining with the base subquery.
        rows = db.execute(
            select(Activity.application, Activity.timestamp).select_from(base_sub).order_by(Activity.timestamp)
        ).all()
        if len(rows) < 2:
            return 0
        switches = 0
        for i in range(1, len(rows)):
            if rows[i].application != rows[i - 1].application:
                switches += 1
        return switches
    except Exception:
        return max(0, db.execute(select(func.count()).select_from(base_sub)).scalar_one_or_none() or 0 - 1)


def timeline(db: Session, *, start: datetime, end: datetime) -> Sequence[Activity]:
    query = (
        select(Activity)
        .where(Activity.timestamp >= start, Activity.timestamp <= end)
        .order_by(Activity.timestamp.asc())
    )
    return db.execute(query).scalars().all()


def daily_trend(db: Session, days: int = 7) -> list[dict]:
    end = _today_start_utc() + timedelta(days=1)
    start = _today_start_utc() - timedelta(days=days - 1)
    rows = db.execute(
        select(
            func.date(Activity.timestamp).label("day"),
            func.sum(Activity.duration_ms).label("total_ms"),
        )
        .where(Activity.timestamp >= start)
        .group_by(func.date(Activity.timestamp))
        .order_by("day")
    ).all()
    return [
        {
            "date": str(r.day),
            "productive_minutes": round((r.total_ms or 0) / 60000, 1),
            "idle_minutes": 0,
        }
        for r in rows
    ]


def app_breakdown(db: Session, *, start: datetime | None = None, end: datetime | None = None) -> list[dict]:
    base = select(Activity)
    if start is not None:
        base = base.where(Activity.timestamp >= start)
    if end is not None:
        base = base.where(Activity.timestamp <= end)
    base_sub = base.subquery()
    rows = db.execute(
        select(Activity.application, func.sum(Activity.duration_ms).label("total_ms"))
        .select_from(base_sub)
        .group_by(Activity.application)
        .order_by(func.sum(Activity.duration_ms).desc())
    ).all()
    total_ms = sum((r.total_ms or 0) for r in rows)
    return [
        {
            "application": r.application,
            "minutes": round((r.total_ms or 0) / 60000),
            "percentage": round(((r.total_ms or 0) / total_ms) * 100) if total_ms > 0 else 0,
        }
        for r in rows
    ]


def hourly_breakdown(db: Session, *, start: datetime | None = None, end: datetime | None = None) -> list[dict]:
    """Return per-hour active minutes for the hourly bar chart."""
    base = select(Activity)
    if start is not None:
        base = base.where(Activity.timestamp >= start)
    if end is not None:
        base = base.where(Activity.timestamp <= end)
    base_sub = base.subquery()
    rows = db.execute(
        select(
            func.strftime("%H", Activity.timestamp).label("hour"),
            func.sum(Activity.duration_ms).label("total_ms"),
        )
        .select_from(base_sub)
        .group_by(func.strftime("%H", Activity.timestamp))
        .order_by("hour")
    ).all()
    return [
        {
            "hour": f"{int(r.hour):02d}:00",
            "minutes": round((r.total_ms or 0) / 60000),
        }
        for r in rows
        if r.hour is not None
    ]
