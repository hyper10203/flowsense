"""Workflow persistence and detection orchestration."""

import uuid
from collections.abc import Sequence
from datetime import UTC, datetime

from sqlalchemy import and_, exists, select
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
    from app.models.suggestion import Suggestion
    query = (
        select(Workflow)
        .where(~exists().where(
            and_(
                Suggestion.workflow_id == Workflow.id,
                Suggestion.status == "dismissed"
            )
        ))
        .order_by(Workflow.frequency.desc(), Workflow.confidence.desc())
    )
    return db.execute(query).scalars().all()


def get_workflow(db: Session, workflow_id: int) -> Workflow | None:
    return db.execute(select(Workflow).where(Workflow.id == workflow_id)).scalar_one_or_none()


def get_workflow_by_hash(db: Session, hash_: str) -> Workflow | None:
    return db.execute(select(Workflow).where(Workflow.hash == hash_)).scalar_one_or_none()


def create_user_workflow(db: Session, name: str, steps: list[dict]) -> Workflow:
    workflow = Workflow(
        hash=f"user_{uuid.uuid4()}",
        ai_name=name,
        frequency=1,
        confidence=1.0,
        first_seen=datetime.now(UTC),
        last_seen=datetime.now(UTC),
    )
    db.add(workflow)
    db.flush()
    for order, step_data in enumerate(steps):
        step = WorkflowStep(
            workflow_id=workflow.id,
            step_order=order,
            application=step_data["application"],
            window_title=step_data.get("window_title", step_data["application"]),
            url_pattern=step_data.get("url_pattern"),
        )
        db.add(step)
    db.flush()
    db.refresh(workflow)
    return workflow


def save_detected_workflow(db: Session, detected: DetectedWorkflow) -> Workflow:
    existing = get_workflow_by_hash(db, detected.hash)
    if existing is not None:
        existing.frequency = detected.frequency
        existing.confidence = detected.confidence
        existing.last_seen = datetime.fromtimestamp(detected.last_seen, tz=UTC)
        db.flush()
        db.refresh(existing)
        return existing

    workflow = Workflow(
        hash=detected.hash,
        frequency=detected.frequency,
        confidence=detected.confidence,
        first_seen=datetime.fromtimestamp(detected.first_seen, tz=UTC),
        last_seen=datetime.fromtimestamp(detected.last_seen, tz=UTC),
    )
    db.add(workflow)
    db.flush()
    for order, (app, url) in enumerate(detected.steps):
        step = WorkflowStep(
            workflow_id=workflow.id,
            step_order=order,
            application=app,
            window_title=app,
            url_pattern=url,
        )
        db.add(step)
    db.flush()
    db.refresh(workflow)
    return workflow
