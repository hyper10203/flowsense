"""AI provider and account-visible model discovery endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import ai_service, settings_service

router = APIRouter(prefix="/ai", tags=["ai"])

@router.get("/models")
async def list_models(
    provider: str = Query("gemini"), db: Session = Depends(get_db)
) -> dict[str, object]:
    stored = settings_service.get_all_settings(db)
    models, source = await ai_service.discover_models(provider, str(stored.get("ai_api_key", "")))
    return {"provider": provider, "models": models, "source": source}


@router.get("/providers")
def list_providers() -> dict[str, list[dict[str, str]]]:
    return {
        "providers": [
            {"id": provider, "default_model": ai_service.DEFAULT_MODELS[provider]}
            for provider in ai_service.PROVIDERS
        ]
    }
