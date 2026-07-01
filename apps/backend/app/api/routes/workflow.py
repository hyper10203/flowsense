
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import workflow_service

router = APIRouter(prefix="/workflows", tags=["workflows"])


class RenameWorkflowRequest(BaseModel):
    name: str


class CreateWorkflowRequest(BaseModel):
    name: str
    steps: list[dict]


@router.get("")
def list_workflows(db: Session = Depends(get_db)):
    workflows = workflow_service.get_workflows(db)
    return [
        {
            "id": w.id,
            "hash": w.hash,
            "ai_name": w.ai_name,
            "description": w.description,
            "purpose": w.purpose,
            "automation_suggestion": w.automation_suggestion,
            "frequency": w.frequency,
            "confidence": w.confidence,
            "first_seen": w.first_seen.isoformat() if w.first_seen else None,
            "last_seen": w.last_seen.isoformat() if w.last_seen else None,
            "steps": [
                {
                    "step_order": s.step_order,
                    "application": s.application,
                    "window_title": s.window_title,
                    "url_pattern": s.url_pattern,
                }
                for s in sorted(w.steps, key=lambda x: x.step_order)
            ],
        }
        for w in workflows
    ]

@router.post("")
def create_workflow(body: CreateWorkflowRequest, db: Session = Depends(get_db)):
    wf = workflow_service.create_user_workflow(db, body.name, body.steps)
    db.commit()
    return {"success": True, "id": wf.id}



@router.get("/{workflow_id}")
def get_workflow(workflow_id: int, db: Session = Depends(get_db)):
    wf = workflow_service.get_workflow(db, workflow_id)
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {
        "id": wf.id,
        "hash": wf.hash,
        "name": wf.ai_name,
        "description": wf.description,
        "purpose": wf.purpose,
        "automation_suggestion": wf.automation_suggestion,
        "frequency": wf.frequency,
        "confidence": wf.confidence,
        "first_seen": wf.first_seen.isoformat() if wf.first_seen else None,
        "last_seen": wf.last_seen.isoformat() if wf.last_seen else None,
        "steps": [
            {
                "step_order": s.step_order,
                "application": s.application,
                "window_title": s.window_title,
                "url_pattern": s.url_pattern,
            }
            for s in sorted(wf.steps, key=lambda x: x.step_order)
        ],
    }


@router.patch("/{workflow_id}/rename")
def rename_workflow(workflow_id: int, body: RenameWorkflowRequest, db: Session = Depends(get_db)):
    wf = workflow_service.get_workflow(db, workflow_id)
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if not body.name or not body.name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    wf.ai_name = body.name.strip()[:255]
    db.commit()
    return {"success": True, "name": wf.ai_name}


@router.post("/{workflow_id}/accept")
def accept_workflow(workflow_id: int, db: Session = Depends(get_db)):
    wf = workflow_service.get_workflow(db, workflow_id)
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    from app.services import suggestion_service
    suggestion_service.create_suggestion_for_workflow(db, wf)
    db.commit()
    return {"success": True}


@router.post("/{workflow_id}/dismiss")
def dismiss_workflow(workflow_id: int, db: Session = Depends(get_db)):
    wf = workflow_service.get_workflow(db, workflow_id)
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    from app.services import suggestion_service
    suggestion_service.dismiss_for_workflow(db, workflow_id)
    db.commit()
    return {"success": True}
