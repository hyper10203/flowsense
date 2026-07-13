"""Settings CRUD backed by the key-value Setting table."""

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.settings import Setting

DEFAULTS: dict[str, Any] = {
    "polling_interval": 5,
    "dark_mode": True,
    "notifications": True,
    "retention_period": "unlimited",
    "gemini_enabled": False,
    "startup_launch": False,
    "browser_tracking": True,
    "ai_suggestions": True,
    "ai_provider": "gemini",
    "ai_api_key": "",
    "ai_model": "gemini-2.0-flash",
    "terminal_tracking": True,
    "browser_url_tracking": True,
    "voice_feedback": True,
    "automation_enabled": False,
}


def get_all_settings(db: Session) -> dict[str, Any]:
    query = select(Setting)
    rows = db.execute(query).scalars().all()
    result = dict(DEFAULTS)
    for row in rows:
        value: Any = row.value
        if isinstance(DEFAULTS.get(row.key), bool):
            value = value.lower() in ("1", "true", "yes", "on")
        elif isinstance(DEFAULTS.get(row.key), int):
            try:
                value = int(value)
            except (TypeError, ValueError):
                value = DEFAULTS[row.key]
        result[row.key] = value
    return result


def update_setting(db: Session, key: str, value: Any) -> Setting:
    row = db.execute(select(Setting).where(Setting.key == key)).scalar_one_or_none()
    str_value = str(value).lower() if isinstance(value, bool) else str(value)
    if row is None:
        row = Setting(key=key, value=str_value)
        db.add(row)
    else:
        row.value = str_value
    db.flush()
    db.refresh(row)
    return row
