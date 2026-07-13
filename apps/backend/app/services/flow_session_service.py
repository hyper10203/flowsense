"""Flow session lifecycle: start, track, stop."""

from collections.abc import Sequence
from datetime import UTC, datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.time import as_utc
from app.models.flow_session import FlowSession


def start_session(db: Session, workflow_id: int) -> FlowSession:
    # End any existing active session
    active = db.execute(
        select(FlowSession).where(FlowSession.status == "active")
    ).scalars().all()
    now = datetime.now(UTC)
    for s in active:
        s.status = "abandoned"
        s.ended_at = now
        if s.started_at:
            s.duration_seconds = (now - as_utc(s.started_at)).total_seconds()
    db.flush()

    session = FlowSession(
        workflow_id=workflow_id,
        status="active",
        steps_completed=0,
        started_at=now,
    )
    db.add(session)
    db.flush()
    db.refresh(session)
    return session


def stop_session(db: Session, session_id: int, steps_completed: int = 0) -> FlowSession | None:
    session = db.execute(
        select(FlowSession).where(FlowSession.id == session_id)
    ).scalar_one_or_none()
    if session is None:
        return None
    now = datetime.now(UTC)
    session.status = "completed"
    session.ended_at = now
    session.steps_completed = steps_completed
    session.duration_seconds = (now - as_utc(session.started_at)).total_seconds() if session.started_at else 0
    db.flush()
    db.refresh(session)
    return session


def get_active_session(db: Session) -> FlowSession | None:
    return db.execute(
        select(FlowSession).where(FlowSession.status == "active")
    ).scalar_one_or_none()


def get_session_history(db: Session, limit: int = 50) -> Sequence[FlowSession]:
    return db.execute(
        select(FlowSession).order_by(FlowSession.started_at.desc()).limit(limit)
    ).scalars().all()


def update_step(db: Session, session_id: int, steps_completed: int) -> FlowSession | None:
    session = db.execute(
        select(FlowSession).where(FlowSession.id == session_id)
    ).scalar_one_or_none()
    if session is None:
        return None
    session.steps_completed = steps_completed
    db.flush()
    db.refresh(session)
    return session


def delete_all(db: Session) -> int:
    stmt = delete(FlowSession)
    result = db.execute(stmt)
    db.flush()
    return int(getattr(result, "rowcount", 0) or 0)

