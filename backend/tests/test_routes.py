"""Tests for API routes — valid/invalid inputs, 404s, boundary values."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# --- GET endpoints ---

def test_get_villages():
    r = client.get("/api/villages")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_village_found():
    r = client.get("/api/villages/village-0")
    assert r.status_code == 200
    assert r.json()["id"] == "village-0"


def test_get_village_not_found():
    r = client.get("/api/villages/nonexistent")
    assert r.status_code == 404


def test_get_transfers():
    r = client.get("/api/transfers")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_get_alerts():
    r = client.get("/api/alerts")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_get_forecast():
    r = client.get("/api/forecast")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 6
    for entry in data:
        assert "demand" in entry
        assert "generation" in entry
        assert "confidence" in entry
        assert "source" in entry
        assert entry["source"] in ("model", "heuristic")


# --- PUT /api/villages validation ---

def test_update_village_valid():
    r = client.put("/api/villages/village-0", json={"soc": 75})
    assert r.status_code == 200
    assert r.json()["soc"] == 75.0


def test_update_village_soc_too_high():
    r = client.put("/api/villages/village-0", json={"soc": 150})
    assert r.status_code == 422


def test_update_village_soc_negative():
    r = client.put("/api/villages/village-0", json={"soc": -10})
    assert r.status_code == 422


def test_update_village_not_found():
    r = client.put("/api/villages/nonexistent", json={"soc": 50})
    assert r.status_code == 404


def test_update_village_solar_panel_capacity_negative():
    r = client.put("/api/villages/village-0", json={"solarPanelCapacity": -50})
    assert r.status_code == 422


# --- POST endpoints ---

def test_trigger_scenario_valid():
    r = client.post("/api/scenario/heatwave")
    assert r.status_code == 200
    assert r.json()["status"] == "triggered"


def test_trigger_scenario_invalid():
    r = client.post("/api/scenario/tornado")
    assert r.status_code == 400


def test_simulation_toggle():
    r = client.post("/api/simulation/toggle")
    assert r.status_code == 200
    assert "paused" in r.json()


def test_simulation_speed_valid():
    r = client.post("/api/control/simulation/speed/2.0")
    assert r.status_code == 200


def test_simulation_speed_out_of_range():
    r = client.post("/api/control/simulation/speed/5.0")
    assert r.status_code == 400


def test_transfer_request_invalid_amount():
    r = client.post("/api/control/transfer/request?source_id=village-0&destination_id=village-1&amount=-5")
    assert r.status_code == 400


def test_shed_load_valid():
    r = client.post("/api/control/load/village-0/shed?percentage=50")
    assert r.status_code == 200


def test_shed_load_out_of_range():
    r = client.post("/api/control/load/village-0/shed?percentage=150")
    assert r.status_code == 400


def test_emergency_spike():
    r = client.post("/api/control/emergency/village-0?spike_kw=60")
    assert r.status_code == 200
    assert r.json()["spike_kw"] == 60


def test_emergency_spike_village_not_found():
    r = client.post("/api/control/emergency/nonexistent?spike_kw=60")
    assert r.status_code == 404


def test_weather_update():
    r = client.put("/api/weather", json={"temperature": 35, "cloudCover": 80})
    assert r.status_code == 200


def test_health_endpoint():
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert "model_loaded" in data
    assert "model_path" in data
    assert isinstance(data["model_loaded"], bool)


def test_randomize():
    r = client.post("/api/simulation/randomize")
    assert r.status_code == 200


def test_model_metrics_endpoint():
    r = client.get("/api/metrics/model")
    assert r.status_code == 200
    data = r.json()
    assert "mae" in data or "error" in data


def test_history_endpoint():
    r = client.get("/api/history/village-0?hours=24")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_infrastructure_update():
    r = client.post("/api/village/village-0/infrastructure?hospital=40&residential=60")
    assert r.status_code == 200
    assert r.json()["hospitalDemand"] == 40
