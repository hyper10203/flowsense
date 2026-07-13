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
PROVIDERS: dict[str, dict[str, Any]] = {
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
        "models_url": "https://openrouter.ai/api/v1/models",
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
        "models_url": "https://integrate.api.nvidia.com/v1/models",
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
        "models_url": "https://api.deepseek.com/v1/models",
    },
    "openai": {
        "url": "https://api.openai.com/v1/chat/completions",
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
        "models_url": "https://api.openai.com/v1/models",
    },
    "groq": {
        "url": "https://api.groq.com/openai/v1/chat/completions",
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
        "models_url": "https://api.groq.com/openai/v1/models",
    },
    "mistral": {
        "url": "https://api.mistral.ai/v1/chat/completions",
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
        "models_url": "https://api.mistral.ai/v1/models",
    },
    "together": {
        "url": "https://api.together.xyz/v1/chat/completions",
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
        "models_url": "https://api.together.xyz/v1/models",
    },
    "perplexity": {
        "url": "https://api.perplexity.ai/chat/completions",
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
        "models_url": "https://api.perplexity.ai/models",
    },
    "anthropic": {
        "url": "https://api.anthropic.com/v1/messages",
        "key_header": "x-api-key",
        "key_prefix": "",
        "body": lambda prompt, model: {
            "model": model,
            "max_tokens": 300,
            "temperature": 0.2,
            "messages": [{"role": "user", "content": prompt}],
        },
        "extract": lambda data: (data.get("content") or [{}])[0].get("text"),
    },
    "ollama": {
        "url": "http://127.0.0.1:11434/api/chat",
        "key_header": None,
        "body": lambda prompt, model: {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "format": "json",
            "stream": False,
        },
        "extract": lambda data: data.get("message", {}).get("content"),
        "models_url": "http://127.0.0.1:11434/api/tags",
    },
}

DEFAULT_MODELS = {
    "gemini": "gemini-2.0-flash",
    "openrouter": "google/gemini-2.0-flash-001:free",
    "nvidia_nim": "meta/llama-3.1-70b-instruct",
    "deepseek": "deepseek-chat",
    "openai": "gpt-4o-mini",
    "anthropic": "claude-3-5-haiku-latest",
    "groq": "llama-3.3-70b-versatile",
    "mistral": "mistral-small-latest",
    "together": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    "perplexity": "sonar",
    "ollama": "llama3.2",
}

ENV_KEYS = {
    "gemini": ("GEMINI_API_KEY",),
    "openrouter": ("OPENROUTER_API_KEY",),
    "nvidia_nim": ("NVIDIA_NIM_API_KEY",),
    "deepseek": ("DEEPSEEK_API_KEY",),
    "openai": ("OPENAI_API_KEY",),
    "anthropic": ("ANTHROPIC_API_KEY",),
    "groq": ("GROQ_API_KEY",),
    "mistral": ("MISTRAL_API_KEY",),
    "together": ("TOGETHER_API_KEY",),
    "perplexity": ("PERPLEXITY_API_KEY",),
    "ollama": (),
}


def _get_runtime_api_key() -> tuple[str, str, str]:
    """Read the selected provider's credential instead of picking an unrelated key."""
    provider = os.environ.get("AI_PROVIDER", settings.ai_provider).lower()
    if provider not in PROVIDERS:
        provider = "gemini"
    api_key = os.environ.get("AI_API_KEY", "")
    if not api_key:
        api_key = next((os.environ.get(key, "") for key in ENV_KEYS[provider] if os.environ.get(key)), "")
    if not api_key:
        provider_keys = {
            "gemini": settings.gemini_api_key,
            "openrouter": settings.openrouter_api_key,
            "nvidia_nim": settings.nvidia_nim_api_key,
            "deepseek": settings.deepseek_api_key,
        }
        api_key = provider_keys.get(provider) or settings.ai_api_key or ""
    model = os.environ.get("AI_MODEL") or settings.gemini_model or DEFAULT_MODELS[provider]
    return provider, api_key, model


class AIError(Exception):
    """Raised when an AI call fails with a user-actionable error."""
    rate_limit = "rate_limit"
    key_invalid = "key_invalid"
    token_exhausted = "token_exhausted"
    generic = "generic"

    def __init__(self, kind: str, message: str = ""):
        self.kind = kind
        super().__init__(message)


async def _call_ai(prompt: str) -> str:
    """Returns raw AI text, or raises AIError on failure."""
    provider_name, api_key, model = _get_runtime_api_key()

    if not api_key:
        raise AIError(AIError.key_invalid, "No AI API key configured")
    provider = PROVIDERS.get(provider_name) or PROVIDERS["gemini"]
    if not model:
        model = DEFAULT_MODELS[provider_name]

    url = provider["url"].format(model=model)
    body = provider["body"](prompt, model)

    headers = {"Content-Type": "application/json"}
    params = {}
    if provider.get("key_header"):
        prefix = provider.get("key_prefix", "")
        headers[provider["key_header"]] = f"{prefix}{api_key}"
    elif provider.get("key_query"):
        params[provider["key_query"]] = api_key
    if provider_name == "anthropic":
        headers["anthropic-version"] = "2023-06-01"

    try:
        async with httpx.AsyncClient(timeout=settings.gemini_timeout_seconds) as client:
            response = await client.post(url, headers=headers, params=params, json=body)
            if response.status_code == 429:
                raise AIError(AIError.rate_limit, "Rate limited")
            if response.status_code in (401, 403):
                # 401/403 often means invalid key or exhausted quota
                text = response.text.lower()
                if "quota" in text or "billing" in text or "insufficient" in text or "exhausted" in text:
                    raise AIError(AIError.token_exhausted, "Token budget exhausted")
                raise AIError(AIError.key_invalid, "API key rejected")
            response.raise_for_status()
            data = response.json()
            return provider["extract"](data)
    except AIError:
        raise
    except Exception as exc:
        logger.error("AI call failed (provider=%s): %s", provider_name, exc)
        raise AIError(AIError.generic, str(exc))


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


async def name_workflow(steps: list[str], frequency: int, confidence: float) -> dict[str, Any] | None:
    """Returns {name, description, suggestion} on success, or {error: "...", message: "..."} on failure."""
    prompt = (
        f"{WORKFLOW_NAMING_PROMPT}\n\n"
        f"Detected workflow: {' → '.join(steps)}\n"
        f"Frequency: {frequency}\n"
        f"Confidence: {confidence}\n"
    )
    try:
        for attempt in range(2):
            raw = await _call_ai(prompt)
            parsed = _parse_json(raw)
            if parsed is not None:
                return parsed
            logger.warning("AI returned invalid JSON (attempt %d)", attempt + 1)
        return None
    except AIError as exc:
        return {"error": exc.kind, "message": str(exc)}


async def discover_models(provider_name: str, api_key: str = "") -> tuple[list[dict[str, str]], str]:
    """Fetch models visible to the selected account, with a safe static fallback."""
    provider_name = provider_name.lower()
    provider = PROVIDERS.get(provider_name)
    if provider is None:
        return [], "unsupported"
    if not api_key:
        _runtime_provider, api_key, _model = _get_runtime_api_key()
    if provider_name == "gemini":
        url = "https://generativelanguage.googleapis.com/v1beta/models"
        params = {"key": api_key} if api_key else {}
    else:
        url = str(provider.get("models_url") or "")
        params = {}
    if not url:
        return [{"id": DEFAULT_MODELS[provider_name], "name": DEFAULT_MODELS[provider_name]}], "fallback"
    headers: dict[str, str] = {}
    if api_key and provider.get("key_header"):
        headers[provider["key_header"]] = f"{provider.get('key_prefix', '')}{api_key}"
    try:
        async with httpx.AsyncClient(timeout=settings.gemini_timeout_seconds) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
        if provider_name == "gemini":
            models = data.get("models", [])
            return [
                {"id": item["name"].removeprefix("models/"), "name": item.get("displayName") or item["name"]}
                for item in models
                if "generateContent" in item.get("supportedGenerationMethods", [])
            ], "account"
        if provider_name == "ollama":
            return [
                {"id": item["name"], "name": item["name"]}
                for item in data.get("models", [])
                if item.get("name")
            ], "local"
        return [
            {"id": item["id"], "name": item.get("name") or item["id"]}
            for item in data.get("data", [])
            if item.get("id")
        ], "account"
    except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
        logger.info("Model discovery failed for %s: %s", provider_name, exc)
        default = DEFAULT_MODELS[provider_name]
        return [{"id": default, "name": default}], "fallback"
