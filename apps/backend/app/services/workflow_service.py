"""Workflow persistence and detection orchestration."""

from datetime import datetime, timezone
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.algorithms.detector import DetectedWorkflow, detect_workflows
from app.algorithms.normalizer import NormalizedEvent
from app.core.config import settings
from app.models.workflow import Workflow, WorkflowStep


def run_detection(db: Session, events: list[NormalizedEvent]) -> Sequence[DetectedWorkflow]:
    return detect_workflows(
        events,
        min_steps=settings.workflow_min_steps,
        max_steps=settings.workflow_max_steps,
        min_frequency=settings.workflow_min_frequency,
        min_confidence=settings.workflow_min_confidence,
        max_gap_seconds=settings.workflow_max_gap_minutes * 60,
    )


def get_workflows(db: Session) -> Sequence[Workflow]:
    query = select(Workflow).order_by(Workflow.frequency.desc(), Workflow.confidence.desc())
    return db.execute(query).scalars().all()


def get_workflow(db: Session, workflow_id: int) -> Workflow | None:
    return db.execute(select(Workflow).where(Workflow.id == workflow_id)).scalar_one_or_none()


def get_workflow_by_hash(db: Session, hash_: str) -> Workflow | None:
    return db.execute(select(Workflow).where(Workflow.hash == hash_)).scalar_one_or_none()


def save_detected_workflow(db: Session, detected: DetectedWorkflow) -> Workflow:
    existing = get_workflow_by_hash(db, detected.hash)
    now = datetime.now(timezone.utc)
    if existing is not None:
        existing.frequency = detected.frequency
        existing.confidence = detected.confidence
        existing.last_seen = datetime.fromtimestamp(detected.last_seen, tz=timezone.utc)
        db.flush()
        db.refresh(existing)
        return existing

    workflow = Workflow(
        hash=detected.hash,
        frequency=detected.frequency,
        confidence=detected.confidence,
        first_seen=datetime.fromtimestamp(detected.first_seen, tz=timezone.utc),
        last_seen=datetime.fromtimestamp(detected.last_seen, tz=timezone.utc),
    )
    db.add(workflow)
    db.flush()
    for order, app in enumerate(detected.steps):
        step = WorkflowStep(
            workflow_id=workflow.id,
            step_order=order,
            application=app,
            window_title=app,
            url_pattern=None,
        )
        db.add(step)
    db.flush()
    db.refresh(workflow)
    return workflow
