"""Trigger workflow detection over stored activity and persist results."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.activity import Activity
from app.services import workflow_service

router = APIRouter(prefix="/detect", tags=["detect"])


@router.post("")
def run_detection(db: Session = Depends(get_db)):
    events = db.query(Activity).order_by(Activity.timestamp.asc()).limit(5000).all()
    normalized = [
        {
            "application": e.application,
            "window_title": e.window_title,
            "url": e.url,
            "timestamp": e.timestamp,
        }
        for e in events
    ]
    from app.algorithms.normalizer import normalize_events

    norm_events = normalize_events(normalized)
    detected = workflow_service.run_detection(db, norm_events)
    saved = []
    for det in detected:
        wf = workflow_service.save_detected_workflow(db, det)
        saved.append({"id": wf.id, "hash": wf.hash, "frequency": wf.frequency})
    db.commit()
    return {"success": True, "detected": len(detected), "workflows": saved}
