"""Multi-provider AI integration for workflow naming and summarization.

Supports: Google Gemini, OpenRouter, NVIDIA NIM, DeepSeek.
Provider + API key are read from the runtime settings store (electron-store via /settings).
Falls back to env vars if not set in the store.
"""

import json
import logging
import os
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

# Provider endpoint + model config
PROVIDERS = {
    "gemini": {
        "url": "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        "key_header": None,  # Gemini uses ?key= query param
        "key_query": "key",
        "body": lambda prompt, model: {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 300, "responseMimeType": "application/json"},
        },
        "extract": lambda data: (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [{}])[0].get("text"),
    },
    "openrouter": {
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "key_header": "Authorization",
        "key_prefix": "Bearer ",
        "body": lambda prompt, model: {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": 300,
            "response_format": {"type": "json_object"},
        },
        "extract": lambda data: (data.get("choices") or [{}])[0].get("message", {}).get("content"),
    },
    "nvidia_nim": {
        "url": "https://integrate.api.nvidia.com/v1/chat/completions",
        "key_header": "Authorization",
        "key_prefix": "Bearer ",
        "body": lambda prompt, model: {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": 300,
        },
        "extract": lambda data: (data.get("choices") or [{}])[0].get("message", {}).get("content"),
    },
    "deepseek": {
        "url": "https://api.deepseek.com/v1/chat/completions",
        "key_header": "Authorization",
        "key_prefix": "Bearer ",
        "body": lambda prompt, model: {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": 300,
            "response_format": {"type": "json_object"},
        },
        "extract": lambda data: (data.get("choices") or [{}])[0].get("message", {}).get("content"),
    },
}


def _get_runtime_api_key() -> tuple[str, str, str]:
    """Read provider + key + model from env vars (backend reads from its own DB via the /settings endpoint,
    but for the AI naming service we use env vars for simplicity, since the backend is a separate process)."""
    provider = os.environ.get("AI_PROVIDER", "gemini")
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENROUTER_API_KEY") or os.environ.get("NVIDIA_NIM_API_KEY") or os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("AI_API_KEY") or ""
    model = os.environ.get("AI_MODEL", "")
    return provider, api_key, model


async def _call_ai(prompt: str) -> str | None:
    provider_name, api_key, model = _get_runtime_api_key()

    # Fallback to env if no key in store
    if not api_key:
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENROUTER_API_KEY") or os.environ.get("NVIDIA_NIM_API_KEY") or os.environ.get("DEEPSEEK_API_KEY") or ""
    if not api_key:
        logger.warning("No AI API key configured; skipping AI call.")
        return None

    provider = PROVIDERS.get(provider_name) or PROVIDERS["gemini"]
    if not model:
        model = "gemini-2.0-flash" if provider_name == "gemini" else "google/gemini-2.0-flash-001:free"

    url = provider["url"].format(model=model)
    body = provider["body"](prompt, model)

    headers = {"Content-Type": "application/json"}
    params = {}
    if provider.get("key_header"):
        prefix = provider.get("key_prefix", "")
        headers[provider["key_header"]] = f"{prefix}{api_key}"
    elif provider.get("key_query"):
        params[provider["key_query"]] = api_key

    try:
        async with httpx.AsyncClient(timeout=settings.gemini_timeout_seconds) as client:
            response = await client.post(url, headers=headers, params=params, json=body)
            response.raise_for_status()
            data = response.json()
            return provider["extract"](data)
    except Exception as exc:
        logger.error("AI call failed (provider=%s): %s", provider_name, exc)
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
        raw = await _call_ai(prompt)
        parsed = _parse_json(raw)
        if parsed is not None:
            return parsed
        logger.warning("AI returned invalid JSON (attempt %d)", attempt + 1)
    return None
