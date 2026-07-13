"""Capability discovery and explicitly confirmed desktop automation."""

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services import automation_service

router = APIRouter(prefix="/automation", tags=["automation"])


class PlanRequest(BaseModel):
    instruction: str = Field(min_length=1, max_length=2_000)


class ExecuteRequest(BaseModel):
    plan: dict[str, Any]
    confirmed: bool = False


@router.get("/capabilities")
def get_capabilities() -> dict[str, Any]:
    return {
        "capabilities": automation_service.capability_response(),
        "environment": automation_service.environment_summary(),
    }


@router.post("/plan")
def plan(body: PlanRequest) -> dict[str, Any]:
    return automation_service.plan_instruction(body.instruction)


@router.post("/execute")
def execute(body: ExecuteRequest) -> dict[str, Any]:
    return automation_service.execute_plan(body.plan, confirmed=body.confirmed)
