from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import flow_session_service

router = APIRouter(prefix="/flows", tags=["flows"])


class StartFlowRequest(BaseModel):
    workflow_id: int


class StopFlowRequest(BaseModel):
    steps_completed: int = 0


@router.post("/start")
def start_flow(body: StartFlowRequest, db: Session = Depends(get_db)):
    session = flow_session_service.start_session(db, body.workflow_id)
    db.commit()
    return {
        "id": session.id,
        "workflow_id": session.workflow_id,
        "status": session.status,
        "steps_completed": session.steps_completed,
        "started_at": session.started_at.isoformat(),
    }


@router.post("/{session_id}/stop")
def stop_flow(session_id: int, body: StopFlowRequest, db: Session = Depends(get_db)):
    session = flow_session_service.stop_session(db, session_id, body.steps_completed)
    if session is None:
        raise HTTPException(status_code=404, detail="Flow session not found")
    db.commit()
    return {
        "id": session.id,
        "workflow_id": session.workflow_id,
        "status": session.status,
        "steps_completed": session.steps_completed,
        "started_at": session.started_at.isoformat(),
        "ended_at": session.ended_at.isoformat() if session.ended_at else None,
        "duration_seconds": session.duration_seconds,
    }


@router.get("/active")
def get_active(db: Session = Depends(get_db)):
    session = flow_session_service.get_active_session(db)
    if session is None:
        return None
    wf = session.workflow
    return {
        "id": session.id,
        "workflow_id": session.workflow_id,
        "status": session.status,
        "steps_completed": session.steps_completed,
        "started_at": session.started_at.isoformat(),
        "workflow": {
            "id": wf.id,
            "ai_name": wf.ai_name,
            "steps": [
                {
                    "step_order": s.step_order,
                    "application": s.application,
                    "window_title": s.window_title,
                }
                for s in sorted(wf.steps, key=lambda x: x.step_order)
            ],
        } if wf else None,
    }


@router.get("/history")
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    sessions = flow_session_service.get_session_history(db, limit=limit)
    return [
        {
            "id": s.id,
            "workflow_id": s.workflow_id,
            "status": s.status,
            "steps_completed": s.steps_completed,
            "started_at": s.started_at.isoformat(),
            "ended_at": s.ended_at.isoformat() if s.ended_at else None,
            "duration_seconds": s.duration_seconds,
            "workflow_name": s.workflow.ai_name if s.workflow else None,
        }
        for s in sessions
    ]


@router.post("/{session_id}/step")
def update_step(session_id: int, steps_completed: int = 0, db: Session = Depends(get_db)):
    session = flow_session_service.update_step(db, session_id, steps_completed)
    if session is None:
        raise HTTPException(status_code=404, detail="Flow session not found")
    db.commit()
    return {"success": True, "steps_completed": session.steps_completed}
