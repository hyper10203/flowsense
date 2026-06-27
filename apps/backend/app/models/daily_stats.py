from datetime import date

from sqlalchemy import Date, Float, Index, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DailyStat(Base):
    __tablename__ = "daily_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    productive_minutes: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    idle_minutes: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    app_switches: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    workflows_detected: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("date", name="uq_daily_stats_date"),
        Index("ix_daily_stats_date", "date"),
    )

    def __repr__(self) -> str:
        return f"<DailyStat(date={self.date!r}, productive={self.productive_minutes}m)>"
