from datetime import datetime, timezone

from fastapi.testclient import TestClient


def test_health(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_activity(client: TestClient, sample_activity_payload):
    response = client.post("/api/v1/activity", json=sample_activity_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["id"], int)


def test_create_activity_missing_app(client: TestClient):
    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "window_title": "No app",
    }
    response = client.post("/api/v1/activity", json=payload)
    assert response.status_code == 422


def test_list_activities(client: TestClient, sample_activity_payload):
    client.post("/api/v1/activity", json=sample_activity_payload)
    response = client.get("/api/v1/activity?page=1&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1


def test_delete_all(client: TestClient, sample_activity_payload):
    client.post("/api/v1/activity", json=sample_activity_payload)
    response = client.delete("/api/v1/activity")
    assert response.status_code == 200
    assert response.json()["deleted"] >= 1
