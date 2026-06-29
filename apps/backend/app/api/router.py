from fastapi import APIRouter

from app.api.routes import (
    activity,
    ai,
    analytics,
    detect,
    extension,
    flow,
    search,
    settings,
    suggestion,
    workflow,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(activity.router)
api_router.include_router(ai.router)
api_router.include_router(workflow.router)
api_router.include_router(suggestion.router)
api_router.include_router(analytics.router)
api_router.include_router(flow.router)
api_router.include_router(search.router)
api_router.include_router(settings.router)
api_router.include_router(extension.router)
api_router.include_router(detect.router)
