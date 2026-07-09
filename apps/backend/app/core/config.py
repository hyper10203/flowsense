"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "FlowSense"
    app_version: str = "2.0.7"
    host: str = "127.0.0.1"
    port: int = 8000
    database_url: str = "sqlite:///./data/flowsense.db"
    data_dir: str = "./data"

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"
    gemini_temperature: float = 0.2
    gemini_max_tokens: int = 300
    gemini_timeout_seconds: int = 15

    ai_provider: str = "gemini"
    ai_api_key: str | None = None
    openrouter_api_key: str | None = None
    nvidia_nim_api_key: str | None = None
    deepseek_api_key: str | None = None

    workflow_min_confidence: float = 0.3
    workflow_min_frequency: int = 2
    workflow_min_steps: int = 2
    workflow_max_steps: int = 8
    workflow_max_gap_minutes: int = 60

    default_polling_interval: int = 5
    log_level: str = "INFO"


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
