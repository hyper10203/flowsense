from fastapi.testclient import TestClient


def test_get_settings(client: TestClient):
    response = client.get("/api/v1/settings")
    assert response.status_code == 200
    data = response.json()
    assert "polling_interval" in data
    assert "dark_mode" in data


def test_update_setting(client: TestClient):
    response = client.put("/api/v1/settings", json={"key": "polling_interval", "value": 10})
    assert response.status_code == 200
    assert response.json()["success"] is True

    get = client.get("/api/v1/settings")
    assert get.json()["polling_interval"] == 10


def test_update_invalid_setting(client: TestClient):
    response = client.put("/api/v1/settings", json={"key": "unknown_key", "value": "x"})
    assert response.status_code == 400
