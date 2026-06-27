from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    return analytics_service.summary(db)


@router.get("/timeline")
def timeline(
    start: datetime | None = None,
    end: datetime | None = None,
    db: Session = Depends(get_db),
):
    if start is None:
        start = datetime.now(UTC) - timedelta(days=1)
    if end is None:
        end = datetime.now(UTC)
    items = analytics_service.timeline(db, start=start, end=end)
    return [
        {
            "timestamp": a.timestamp.isoformat(),
            "application": a.application,
            "window_title": a.window_title,
            "url": a.url,
            "duration_ms": a.duration_ms,
        }
        for a in items
    ]


@router.get("/apps")
def apps(
    start: datetime | None = None,
    end: datetime | None = None,
    db: Session = Depends(get_db),
):
    return analytics_service.app_breakdown(db, start=start, end=end)


@router.get("/trend")
def trend(
    days: Annotated[int, Query(ge=1, le=90)] = 7,
    db: Session = Depends(get_db),
):
    return analytics_service.daily_trend(db, days=days)
