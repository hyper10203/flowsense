"""Suggestion lifecycle management."""

from collections.abc import Sequence
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.suggestion import Suggestion
from app.models.workflow import Workflow


def create_suggestion_for_workflow(db: Session, workflow: Workflow) -> Suggestion | None:
    existing = db.execute(
        select(Suggestion).where(
            Suggestion.workflow_id == workflow.id,
            Suggestion.status == "pending",
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing
    suggestion = Suggestion(
        workflow_id=workflow.id,
        status="pending",
        shown_at=datetime.now(UTC),
    )
    db.add(suggestion)
    db.flush()
    db.refresh(suggestion)
    return suggestion


def list_all_suggestions(db: Session) -> Sequence[Suggestion]:
    query = (
        select(Suggestion)
        .order_by(Suggestion.shown_at.desc())
    )
    return db.execute(query).scalars().all()


def set_suggestion_status(db: Session, suggestion_id: int, status: str) -> Suggestion | None:
    suggestion = db.execute(select(Suggestion).where(Suggestion.id == suggestion_id)).scalar_one_or_none()
    if suggestion is None:
        return None
    suggestion.status = status
    suggestion.action_at = datetime.now(UTC)
    db.flush()
    db.refresh(suggestion)
    return suggestion


def dismiss_for_workflow(db: Session, workflow_id: int) -> None:
    suggestion = db.execute(
        select(Suggestion).where(Suggestion.workflow_id == workflow_id)
    ).scalar_one_or_none()

    now = datetime.now(UTC)
    if suggestion is None:
        suggestion = Suggestion(
            workflow_id=workflow_id,
            status="dismissed",
            shown_at=now,
            action_at=now,
        )
        db.add(suggestion)
    else:
        suggestion.status = "dismissed"
        suggestion.action_at = now
    db.flush()
