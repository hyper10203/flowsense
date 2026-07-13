"""Analytics aggregation over activity data."""

from collections.abc import Sequence
from datetime import UTC, datetime, timedelta

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.workflow import Workflow


def _local_day_bounds_utc(days: int) -> tuple[datetime, datetime]:
    """Return local-calendar day bounds as UTC for accurate user-facing charts."""
    local_now = datetime.now().astimezone()
    local_start = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
    start = (local_start - timedelta(days=days - 1)).astimezone(UTC)
    end = (local_start + timedelta(days=1)).astimezone(UTC)
    return start, end


def summary(db: Session, *, start: datetime | None = None, end: datetime | None = None) -> dict:
    if start is None:
        start = datetime.now(UTC) - timedelta(days=1)
    if end is None:
        end = datetime.now(UTC)

    base = select(Activity)
    if start is not None:
        base = base.where(Activity.timestamp >= start)
    if end is not None:
        base = base.where(Activity.timestamp <= end)

    base_sub = base.subquery()
    activity = base_sub.c
    # Productive: exclude Idle
    prod_ms = db.execute(
        select(func.coalesce(func.sum(activity.duration_ms), 0))
        .select_from(base_sub)
        .where(activity.application != "Idle")
    ).scalar_one() or 0
    productive_minutes = round(prod_ms / 60000)

    # Idle: include only Idle
    idle_ms = db.execute(
        select(func.coalesce(func.sum(activity.duration_ms), 0))
        .select_from(base_sub)
        .where(activity.application == "Idle")
    ).scalar_one() or 0
    idle_minutes = round(idle_ms / 60000)

    # Count actual app switches = consecutive rows with different application.
    # For switches, we only care about productive apps.
    app_switches = _count_app_switches(db, base_sub)

    # Most used apps by real duration, not count.
    app_rows = db.execute(
        select(activity.application, func.sum(activity.duration_ms).label("total_ms"))
        .select_from(base_sub)
        .where(activity.application != "Idle")
        .group_by(activity.application)
        .order_by(func.sum(activity.duration_ms).desc())
        .limit(5)
    ).all()

    return {
        "productive_minutes": productive_minutes,
        "idle_minutes": idle_minutes,
        "app_switches": app_switches,
        "most_used_apps": [
            {"application": r.application, "minutes": round(r.total_ms / 60000)}
            for r in app_rows
        ],
        "workflow_count": db.execute(select(func.count()).select_from(Workflow)).scalar_one() or 0,
    }


def _count_app_switches(db: Session, base_sub) -> int:
    """Count how many times the user switched between different apps."""
    rows = db.execute(
        select(base_sub.c.application)
        .where(base_sub.c.application != "Idle")
        .order_by(base_sub.c.timestamp)
    ).scalars().all()
    return sum(current != previous for previous, current in zip(rows, rows[1:], strict=False))


def timeline(db: Session, *, start: datetime, end: datetime) -> Sequence[Activity]:
    query = (
        select(Activity)
        .where(Activity.timestamp >= start, Activity.timestamp <= end, Activity.application != "Idle")
        .order_by(Activity.timestamp.asc())
    )
    return db.execute(query).scalars().all()


def daily_trend(db: Session, days: int = 7) -> list[dict]:
    start, end = _local_day_bounds_utc(days)
    rows = db.execute(
        select(
            func.date(Activity.timestamp, "localtime").label("day"),
            func.sum(case((Activity.application != "Idle", Activity.duration_ms), else_=0)).label("prod_ms"),
            func.sum(case((Activity.application == "Idle", Activity.duration_ms), else_=0)).label("idle_ms"),
        )
        .where(Activity.timestamp >= start, Activity.timestamp < end)
        .group_by(func.date(Activity.timestamp, "localtime"))
        .order_by("day")
    ).all()
    return [
        {
            "date": str(r.day),
            "productive_minutes": round((r.prod_ms or 0) / 60000, 1),
            "idle_minutes": round((r.idle_ms or 0) / 60000, 1),
        }
        for r in rows
    ]


def app_breakdown(db: Session, *, start: datetime | None = None, end: datetime | None = None) -> list[dict]:
    base = select(Activity).where(Activity.application != "Idle")
    if start is not None:
        base = base.where(Activity.timestamp >= start)
    if end is not None:
        base = base.where(Activity.timestamp <= end)
    base_sub = base.subquery()
    activity = base_sub.c
    rows = db.execute(
        select(activity.application, func.sum(activity.duration_ms).label("total_ms"))
        .select_from(base_sub)
        .group_by(activity.application)
        .order_by(func.sum(activity.duration_ms).desc())
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
    base = select(Activity).where(Activity.application != "Idle")
    if start is not None:
        base = base.where(Activity.timestamp >= start)
    if end is not None:
        base = base.where(Activity.timestamp <= end)
    base_sub = base.subquery()
    activity = base_sub.c
    rows = db.execute(
        select(
            func.strftime("%H", activity.timestamp, "localtime").label("hour"),
            func.sum(activity.duration_ms).label("total_ms"),
        )
        .select_from(base_sub)
        .group_by(func.strftime("%H", activity.timestamp, "localtime"))
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
