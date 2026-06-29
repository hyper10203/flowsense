"""AI model listing endpoint."""

from fastapi import APIRouter, Query

router = APIRouter(prefix="/ai", tags=["ai"])

MODELS: dict[str, list[dict[str, str]]] = {
    "gemini": [
        {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash"},
        {"id": "gemini-2.0-flash-lite", "name": "Gemini 2.0 Flash Lite"},
        {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro"},
        {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash"},
    ],
    "openrouter": [
        {"id": "google/gemini-2.0-flash-001:free", "name": "Gemini 2.0 Flash (free)"},
        {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet"},
        {"id": "meta-llama/llama-4-maverick", "name": "Llama 4 Maverick"},
        {"id": "deepseek/deepseek-chat", "name": "DeepSeek V3"},
    ],
    "nvidia_nim": [
        {"id": "meta/llama-3.1-405b-instruct", "name": "Llama 3.1 405B"},
        {"id": "meta/llama-3.1-70b-instruct", "name": "Llama 3.1 70B"},
    ],
    "deepseek": [
        {"id": "deepseek-chat", "name": "DeepSeek V3"},
        {"id": "deepseek-reasoner", "name": "DeepSeek R1"},
    ],
}


@router.get("/models")
def list_models(provider: str = Query("gemini")) -> dict[str, list[dict[str, str]]]:
    return {"provider": provider, "models": MODELS.get(provider, MODELS["gemini"])}
