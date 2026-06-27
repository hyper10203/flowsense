"""Shared pytest fixtures for backend tests."""

import os
import sys
import tempfile
from datetime import UTC, datetime
from pathlib import Path

import pytest

# Set test env vars BEFORE importing app
_tmp = Path(tempfile.mkdtemp())
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp / 'test.db'}"
os.environ["DATA_DIR"] = str(_tmp)
os.environ["GEMINI_API_KEY"] = ""

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient  # noqa: E402

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def _setup_db():
    """Create all tables before each test and drop them after."""
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
        "timestamp": datetime.now(UTC).isoformat(),
        "application": "Chrome",
        "window_title": "ChatGPT",
        "url": "https://chat.openai.com/",
        "event_type": "window_focus",
        "duration_ms": 4500,
    }
