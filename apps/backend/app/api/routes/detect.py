"""Trigger workflow detection over stored activity and persist results."""

import asyncio
import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings as app_settings
from app.core.database import get_db
from app.core.time import utc_iso
from app.models.activity import Activity
from app.services import workflow_service
from app.services.ai_service import name_workflow
from app.services.suggestion_service import create_suggestion_for_workflow

router = APIRouter(prefix="/detect", tags=["detect"])

logger = logging.getLogger(__name__)


@router.post("")
def run_detection(db: Session = Depends(get_db)):
    events = db.query(Activity).order_by(Activity.timestamp.asc()).limit(5000).all()
    normalized = [
        {
            "application": e.application,
            "window_title": e.window_title,
            "url": e.url,
            "timestamp": utc_iso(e.timestamp),
        }
        for e in events
    ]
    from app.algorithms.normalizer import normalize_events

    norm_events = normalize_events(normalized)
    detected = workflow_service.run_detection(db, norm_events)
    saved = []
    for det in detected:
        wf = workflow_service.save_detected_workflow(db, det)

        # AI naming for unnamed workflows
        if wf.ai_name is None and app_settings.gemini_api_key:
            try:
                result = asyncio.run(
                    name_workflow(det.applications, det.frequency, det.confidence)
                )
                if result:
                    wf.ai_name = result.get("name")
                    wf.description = result.get("description")
                    wf.automation_suggestion = result.get("suggestion")
            except Exception as exc:
                logger.warning("AI naming failed for workflow %s: %s", wf.id, exc)

        # Fallback: generate a name from steps if AI didn't provide one
        if wf.ai_name is None:
            step_names = " → ".join(det.applications)
            wf.ai_name = step_names if len(step_names) <= 100 else step_names[:97] + "..."
            wf.description = f"You switch between {', '.join(det.applications)} {det.frequency} times."

        # Auto-create suggestion for detected workflows
        create_suggestion_for_workflow(db, wf)

        saved.append({
            "id": wf.id,
            "hash": wf.hash,
            "frequency": wf.frequency,
            "name": wf.ai_name,
        })
    db.commit()
    return {"success": True, "detected": len(detected), "workflows": saved}
