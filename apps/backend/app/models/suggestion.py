from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Suggestion(Base):
    __tablename__ = "suggestions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    workflow_id: Mapped[int] = mapped_column(Integer, ForeignKey("workflows.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    shown_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    action_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    workflow = relationship("Workflow")

    __table_args__ = (
        Index("ix_suggestions_status", "status"),
        Index("ix_suggestions_workflow_id", "workflow_id"),
    )

    def __repr__(self) -> str:
        return f"<Suggestion(id={self.id}, wf={self.workflow_id}, status={self.status!r})>"
