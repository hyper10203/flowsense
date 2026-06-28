from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FlowSession(Base):
    __tablename__ = "flow_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    workflow_id: Mapped[int] = mapped_column(Integer, ForeignKey("workflows.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    steps_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    workflow = relationship("Workflow")

    def __repr__(self) -> str:
        return f"<FlowSession(id={self.id}, wf={self.workflow_id}, status={self.status})>"
