from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient


def _activity(timestamp: datetime, application: str, duration_ms: int) -> dict:
    return {
        "timestamp": timestamp.isoformat(),
        "application": application,
        "window_title": application,
        "event_type": "window_focus",
        "duration_ms": duration_ms,
    }


def test_recent_activity_timestamps_are_explicit_utc(client: TestClient):
    client.post("/api/v1/activity", json=_activity(datetime.now(UTC), "Chrome", 1_000))
    response = client.get("/api/v1/activity")
    assert response.status_code == 200
    assert response.json()["items"][0]["timestamp"].endswith("Z")


def test_analytics_uses_filtered_rows_without_cross_join(client: TestClient):
    now = datetime.now(UTC)
    client.post("/api/v1/activity", json=_activity(now - timedelta(minutes=2), "Chrome", 60_000))
    client.post("/api/v1/activity", json=_activity(now - timedelta(minutes=1), "Idle", 120_000))
    client.post("/api/v1/activity", json=_activity(now, "VS Code", 180_000))

    summary = client.get("/api/v1/analytics/summary").json()
    usage = client.get("/api/v1/analytics/app-usage").json()

    assert summary["productive_minutes"] == 4
    assert summary["idle_minutes"] == 2
    assert {item["application"]: item["minutes"] for item in usage} == {
        "Chrome": 1,
        "VS Code": 3,
    }
