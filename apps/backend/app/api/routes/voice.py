"""Voice-command control for the active FlowSense workflow."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import flow_session_service, voice_service

router = APIRouter(prefix="/voice", tags=["voice"])


class VoiceCommand(BaseModel):
    transcript: str = Field(min_length=1, max_length=1_000)
    speak_feedback: bool = True


@router.post("/command")
def command(body: VoiceCommand, db: Session = Depends(get_db)) -> dict:
    action = voice_service.parse_command(body.transcript)
    session = flow_session_service.get_active_session(db)
    if session is None:
        raise HTTPException(status_code=409, detail="No active flow session")

    workflow = session.workflow
    total_steps = len(workflow.steps) if workflow else 0
    message = "I did not understand that command. Try next, repeat, status, or stop."
    if action == "next":
        next_step = min(session.steps_completed + 1, total_steps)
        flow_session_service.update_step(db, session.id, next_step)
        db.commit()
        message = "Flow complete." if next_step >= total_steps else f"Moving to step {next_step + 1}."
    elif action == "repeat":
        step = workflow.steps[session.steps_completed] if workflow and session.steps_completed < total_steps else None
        message = f"Current step: {step.application}." if step else "The flow is complete."
    elif action == "status":
        message = f"You are on step {session.steps_completed + 1} of {total_steps}."
    elif action == "stop":
        flow_session_service.stop_session(db, session.id, session.steps_completed)
        db.commit()
        message = "Flow stopped."

    voice = voice_service.speak(message) if body.speak_feedback else {"spoken": False, "engine": "none"}
    return {
        "success": action != "unknown",
        "action": action,
        "message": message,
        "steps_completed": session.steps_completed if action not in {"next", "stop"} else (next_step if action == "next" else session.steps_completed),
        "voice": voice,
    }
