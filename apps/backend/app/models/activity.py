from datetime import UTC, datetime

from sqlalchemy import DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    application: Mapped[str] = mapped_column(String(255), nullable=False)
    window_title: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    command_line: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, default="window_focus")
    duration_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    session_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    __table_args__ = (
        Index("ix_activities_timestamp", "timestamp"),
        Index("ix_activities_application", "application"),
        Index("ix_activities_session_id", "session_id"),
    )

    def __repr__(self) -> str:
        return f"<Activity(id={self.id}, app={self.application!r}, ts={self.timestamp!r})>"
