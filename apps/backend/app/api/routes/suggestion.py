from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import suggestion_service

router = APIRouter(prefix="/suggestions", tags=["suggestions"])


@router.get("")
def list_suggestions(db: Session = Depends(get_db)):
    items = suggestion_service.list_all_suggestions(db)
    return [
        {
            "id": s.id,
            "workflow_id": s.workflow_id,
            "status": s.status,
            "shown_at": s.shown_at.isoformat() if s.shown_at else None,
            "action_at": s.action_at.isoformat() if s.action_at else None,
            "workflow": (
                {
                    "id": s.workflow.id,
                    "ai_name": s.workflow.ai_name,
                    "frequency": s.workflow.frequency,
                    "confidence": s.workflow.confidence,
                    "description": s.workflow.description,
                    "automation_suggestion": s.workflow.automation_suggestion,
                }
                if s.workflow
                else None
            ),
        }
        for s in items
    ]


@router.post("/{suggestion_id}/accept")
def accept_suggestion(suggestion_id: int, db: Session = Depends(get_db)):
    s = suggestion_service.set_suggestion_status(db, suggestion_id, "accepted")
    if s is None:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    db.commit()
    return {"success": True}


@router.post("/{suggestion_id}/dismiss")
def dismiss_suggestion(suggestion_id: int, db: Session = Depends(get_db)):
    s = suggestion_service.set_suggestion_status(db, suggestion_id, "dismissed")
    if s is None:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    db.commit()
    return {"success": True}
