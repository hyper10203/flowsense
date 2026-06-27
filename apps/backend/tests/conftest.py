"""Shared pytest fixtures for backend tests."""

import os
import sys
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import SessionLocal, engine, Base  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def _setup_db(tmp_path, monkeypatch):
    """Use a fresh in-memory SQLite database for each test."""
    db_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def sample_activity_payload():
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "application": "Chrome",
        "window_title": "ChatGPT",
        "url": "https://chat.openai.com/",
        "event_type": "window_focus",
        "duration_ms": 4500,
    }
