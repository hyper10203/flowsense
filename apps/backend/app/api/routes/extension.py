from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import activity_service

router = APIRouter(prefix="/extension", tags=["extension"])


class ExtensionActivity(BaseModel):
    url: str = Field(max_length=2048)
    title: str = Field(max_length=512)
    domain: str = Field(max_length=255)
    timestamp: datetime | None = None


@router.post("/activity")
def ingest_extension_activity(body: ExtensionActivity, db: Session = Depends(get_db)):
    try:
        ts = body.timestamp or datetime.now(timezone.utc)
        activity = activity_service.create_activity(
            db,
            timestamp=ts,
            application=body.domain or "Browser",
            window_title=body.title,
            url=body.url,
            event_type="browser_tab",
            duration_ms=0,
        )
        db.commit()
        return {"success": True, "id": activity.id}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
