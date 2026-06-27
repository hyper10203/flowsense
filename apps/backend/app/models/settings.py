from sqlalchemy import Column, String, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(String(1024), nullable=False, default="")

    __table_args__ = (Index("ix_settings_key", "key"),)

    def __repr__(self) -> str:
        return f"<Setting(key={self.key!r}, value={self.value!r})>"
