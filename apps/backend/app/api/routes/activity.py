import logging
from datetime import datetime, timezone

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.activity import Activity
from app.services import activity_service


def _ai_key_configured() -> bool:
    return bool(
        settings.gemini_api_key
        or settings.openrouter_api_key
        or settings.nvidia_nim_api_key
        or settings.deepseek_api_key
        or settings.ai_api_key
    )

router = APIRouter(prefix="/activity", tags=["activity"])

logger = logging.getLogger(__name__)

_DETECTION_COUNTER = 0
_DETECTION_INTERVAL = 20


class ActivityCreate(BaseModel):
    timestamp: datetime
    application: str = Field(min_length=1, max_length=255)
    window_title: str = Field(default="", max_length=512)
    url: str | None = Field(default=None, max_length=2048)
    command_line: str | None = Field(default=None, max_length=1024)
    event_type: str = Field(default="window_focus", max_length=50)
    duration_ms: int = Field(default=0, ge=0)
    session_id: str | None = Field(default=None, max_length=100)


class ActivityResponse(BaseModel):
    success: bool
    id: int | None = None


def _maybe_run_detection(db: Session) -> None:
    global _DETECTION_COUNTER
    _DETECTION_COUNTER += 1
    if _DETECTION_COUNTER % _DETECTION_INTERVAL != 0:
        return
    try:
        from app.algorithms.normalizer import normalize_events
        from app.services import workflow_service
        from app.services.ai_service import name_workflow
        from app.services.suggestion_service import create_suggestion_for_workflow

        events = db.query(Activity).order_by(Activity.timestamp.asc()).limit(5000).all()
        normalized = [
            {
                "application": e.application,
                "window_title": e.window_title,
                "url": e.url,
                "timestamp": e.timestamp.astimezone(timezone.utc).isoformat() if hasattr(e.timestamp, "astimezone") else str(e.timestamp),
            }
            for e in events
        ]
        norm_events = normalize_events(normalized)
        detected = workflow_service.run_detection(db, norm_events)

        if not detected:
            return

        # Lower thresholds for auto-detection: accept fewer observations
        for det in detected:
            wf = workflow_service.save_detected_workflow(db, det)

            # AI naming if not yet named and any AI key is configured
            if wf.ai_name is None and _ai_key_configured():
                import asyncio
                try:
                    result = asyncio.run(
                        name_workflow(det.steps, det.frequency, det.confidence)
                    )
                    if result and "error" not in result:
                        wf.ai_name = result.get("name")
                        wf.description = result.get("description")
                        wf.automation_suggestion = result.get("suggestion")
                    elif result and "error" in result:
                        # Surface error to frontend via workflow row
                        wf.description = f"ai_error:{result['error']}"
                except Exception:
                    pass

            # Fallback: generate a name from steps if AI didn't provide one
            if wf.ai_name is None:
                step_names = " → ".join(det.steps)
                if step_names and len(step_names) > 0:
                    wf.ai_name = step_names if len(step_names) <= 100 else step_names[:97] + "..."
                else:
                    wf.ai_name = f"Workflow #{wf.id}"
                wf.description = f"You switch between {', '.join(det.steps)} {det.frequency} times."

            # Auto-create suggestion for detected workflows
            create_suggestion_for_workflow(db, wf)

        db.commit()
        logger.info("Auto-detected %d workflows", len(detected))
    except Exception as exc:
        logger.error("Auto-detection failed: %s", exc)


@router.post("", response_model=ActivityResponse)
def create_activity(body: ActivityCreate, db: Session = Depends(get_db)):
    try:
        activity = activity_service.create_activity(
            db,
            timestamp=body.timestamp,
            application=body.application,
            window_title=body.window_title,
            url=body.url,
            command_line=body.command_line,
            event_type=body.event_type,
            duration_ms=body.duration_ms,
            session_id=body.session_id,
        )
        db.commit()
        _maybe_run_detection(db)
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
                "timestamp": a.timestamp.astimezone(timezone.utc).isoformat() if hasattr(a.timestamp, "astimezone") else str(a.timestamp),
                "application": a.application,
                "window_title": a.window_title,
                "url": a.url,
                "command_line": a.command_line,
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
