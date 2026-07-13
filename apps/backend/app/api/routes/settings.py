from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import settings_service

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("")
def get_settings(db: Session = Depends(get_db)):
    return settings_service.get_all_settings(db)


class SettingUpdate(BaseModel):
    key: str
    value: Any


@router.patch("")
def patch_setting(body: SettingUpdate, db: Session = Depends(get_db)):
    return update_setting(body, db)


@router.put("")
def update_setting(body: SettingUpdate, db: Session = Depends(get_db)):
    allowed = {
        "polling_interval",
        "dark_mode",
        "notifications",
        "retention_period",
        "gemini_enabled",
        "startup_launch",
        "browser_tracking",
        "ai_suggestions",
        "ai_provider",
        "ai_api_key",
        "ai_model",
        "terminal_tracking",
        "browser_url_tracking",
        "voice_feedback",
        "automation_enabled",
    }
    if body.key not in allowed:
        raise HTTPException(status_code=400, detail=f"Unknown setting: {body.key}")
    row = settings_service.update_setting(db, body.key, body.value)
    db.commit()
    return {"success": True, "key": row.key, "value": row.value}
