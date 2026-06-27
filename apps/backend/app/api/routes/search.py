from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import search_service

router = APIRouter(prefix="/search", tags=["search"])


def _activity_dict(a) -> dict:
    return {
        "id": a.id,
        "timestamp": a.timestamp.isoformat() if a.timestamp else None,
        "application": a.application,
        "window_title": a.window_title,
        "url": a.url,
        "event_type": a.event_type,
        "duration_ms": a.duration_ms,
        "session_id": a.session_id,
    }


@router.get("")
def search(
    q: Annotated[str, Query(min_length=1, max_length=200)] = "",
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    db: Session = Depends(get_db),
):
    result = search_service.search(db, q, limit=limit)
    return {
        "activities": [_activity_dict(a) for a in result["activities"]],
        "workflows": result["workflows"],
    }
