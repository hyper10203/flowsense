from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    ai_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    purpose: Mapped[str | None] = mapped_column(String(512), nullable=True)
    automation_suggestion: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    frequency: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    first_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    steps = relationship("WorkflowStep", back_populates="workflow", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_workflows_frequency", "frequency"),
        Index("ix_workflows_confidence", "confidence"),
    )

    def __repr__(self) -> str:
        return f"<Workflow(id={self.id}, name={self.ai_name!r}, freq={self.frequency})>"


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    workflow_id: Mapped[int] = mapped_column(Integer, ForeignKey("workflows.id"), nullable=False)
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    application: Mapped[str] = mapped_column(String(255), nullable=False)
    window_title: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    url_pattern: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    workflow = relationship("Workflow", back_populates="steps")

    __table_args__ = (
        UniqueConstraint("workflow_id", "step_order", name="uq_workflow_step_order"),
    )

    def __repr__(self) -> str:
        return f"<WorkflowStep(wf={self.workflow_id}, order={self.step_order}, app={self.application!r})>"
