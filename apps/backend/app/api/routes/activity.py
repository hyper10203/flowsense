from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import activity_service

router = APIRouter(prefix="/activity", tags=["activity"])


class ActivityCreate(BaseModel):
    timestamp: datetime
    application: str = Field(min_length=1, max_length=255)
    window_title: str = Field(default="", max_length=512)
    url: str | None = Field(default=None, max_length=2048)
    event_type: str = Field(default="window_focus", max_length=50)
    duration_ms: int = Field(default=0, ge=0)
    session_id: str | None = Field(default=None, max_length=100)


class ActivityResponse(BaseModel):
    success: bool
    id: int | None = None


@router.post("", response_model=ActivityResponse)
def create_activity(body: ActivityCreate, db: Session = Depends(get_db)):
    try:
        activity = activity_service.create_activity(
            db,
            timestamp=body.timestamp,
            application=body.application,
            window_title=body.window_title,
            url=body.url,
            event_type=body.event_type,
            duration_ms=body.duration_ms,
            session_id=body.session_id,
        )
        db.commit()
        return ActivityResponse(success=True, id=activity.id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


class ActivityList(BaseModel):
    items: list[dict]
    total: int
    page: int
    limit: int


@router.get("", response_model=ActivityList)
def list_activities(
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    start: datetime | None = None,
    end: datetime | None = None,
    application: str | None = None,
    db: Session = Depends(get_db),
):
    items, total = activity_service.list_activities(
        db, page=page, limit=limit, start=start, end=end, application=application
    )
    return ActivityList(
        items=[
            {
                "id": a.id,
                "timestamp": a.timestamp.isoformat(),
                "application": a.application,
                "window_title": a.window_title,
                "url": a.url,
                "event_type": a.event_type,
                "duration_ms": a.duration_ms,
                "session_id": a.session_id,
            }
            for a in items
        ],
        total=total,
        page=page,
        limit=limit,
    )


@router.delete("")
def delete_all(db: Session = Depends(get_db)):
    count = activity_service.delete_all(db)
    db.commit()
    return {"success": True, "deleted": count}
