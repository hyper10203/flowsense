"""Gemini integration for workflow naming and summarization."""

import json
import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

WORKFLOW_NAMING_PROMPT = (
    "You are a productivity assistant. You receive an already detected workflow.\n"
    "Your task is to generate:\n"
    "1. A short workflow name (max 5 words).\n"
    "2. A one-sentence description.\n"
    "3. A practical optimization suggestion.\n"
    "Return JSON only, no markdown.\n"
    'Example: {"name":"","description":"","suggestion":""}'
)


async def _call_gemini(prompt: str) -> str | None:
    if not settings.gemini_api_key:
        logger.warning("Gemini API key not configured; skipping AI call.")
        return None
    try:
        async with httpx.AsyncClient(timeout=settings.gemini_timeout_seconds) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent",
                params={"key": settings.gemini_api_key},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": settings.gemini_temperature,
                        "maxOutputTokens": settings.gemini_max_tokens,
                        "responseMimeType": "application/json",
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return None
            parts = candidates[0].get("content", {}).get("parts", [])
            return parts[0].get("text") if parts else None
    except Exception as exc:
        logger.error("Gemini call failed: %s", exc)
        return None


def _parse_json(text: str) -> dict[str, Any] | None:
    if not text:
        return None
    try:
        data = json.loads(text)
        if not isinstance(data, dict):
            return None
        for key in ("name", "description", "suggestion"):
            if key not in data or not isinstance(data[key], str):
                return None
        return data
    except json.JSONDecodeError:
        return None


async def name_workflow(steps: list[str], frequency: int, confidence: float) -> dict[str, str] | None:
    prompt = (
        f"{WORKFLOW_NAMING_PROMPT}\n\n"
        f"Detected workflow: {' → '.join(steps)}\n"
        f"Frequency: {frequency}\n"
        f"Confidence: {confidence}\n"
    )
    for attempt in range(2):
        raw = await _call_gemini(prompt)
        parsed = _parse_json(raw)
        if parsed is not None:
            return parsed
        logger.warning("Gemini returned invalid JSON (attempt %d)", attempt + 1)
    return None
