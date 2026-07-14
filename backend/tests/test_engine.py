"""Tests for simulation engine — state transitions and village initialization."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.simulation.engine import SimulationEngine, Village, VillageStatus, Weather


def test_village_initialization():
    engine = SimulationEngine(5)
    assert len(engine.villages) == 5
    for v in engine.villages:
        assert v.id.startswith("village-")
        assert 0 <= v.soc <= 100
        assert v.solarPanelCapacity > 0
        assert v.lat != 0 or v.lng != 0  # should have real coords


def test_village_status_surplus():
    v = Village(id="t", name="T", soc=80, solarGeneration=200, demand=100)
    engine = SimulationEngine(0)
    engine.villages = [v]
    engine._update_status(v)
    assert v.status == VillageStatus.SURPLUS


def test_village_status_balanced():
    v = Village(id="t", name="T", soc=70, solarGeneration=100, demand=120)
    engine = SimulationEngine(0)
    engine.villages = [v]
    engine._update_status(v)
    assert v.status == VillageStatus.BALANCED


def test_village_status_warning():
    v = Village(id="t", name="T", soc=40, solarGeneration=50, demand=100)
    engine = SimulationEngine(0)
    engine.villages = [v]
    engine._update_status(v)
    assert v.status == VillageStatus.WARNING


def test_village_status_deficit():
    v = Village(id="t", name="T", soc=25, solarGeneration=30, demand=100)
    engine = SimulationEngine(0)
    engine.villages = [v]
    engine._update_status(v)
    assert v.status == VillageStatus.DEFICIT


def test_battery_soc_clamped():
    v = Village(id="t", name="T", soc=5, solarGeneration=300, demand=10, maxCapacity=100, chargingRate=0.5)
    engine = SimulationEngine(0)
    engine.villages = [v]
    engine._update_battery(v)
    assert v.soc >= 0
    assert v.soc <= 100


def test_grid_metrics():
    engine = SimulationEngine(3)
    engine._calculate_grid_metrics()
    assert 0 <= engine.grid_stability <= 100
    assert engine.total_generation >= 0
    assert engine.total_demand >= 0


def test_village_dict_serialization():
    v = Village(id="test", name="Test Village", soc=75.0, lat=23.26, lng=77.41)
    d = v.dict()
    assert d["id"] == "test"
    assert d["status"] in ["SURPLUS", "BALANCED", "WARNING", "DEFICIT"]
    assert d["lat"] == 23.26
    assert d["lng"] == 77.41


def test_transfer_creation():
    import asyncio

    engine = SimulationEngine(3)
    initial_count = len(engine.transfers)
    asyncio.get_event_loop().run_until_complete(
        engine.create_transfer("village-0", "village-1", 25.0, "test note")
    )
    assert len(engine.transfers) == initial_count + 1
    t = engine.transfers[-1]
    assert t.source == "village-0"
    assert t.destination == "village-1"
    assert t.rate == 25.0


def test_scenario_trigger():
    import asyncio

    engine = SimulationEngine(3)
    initial_alerts = len(engine.alerts)
    asyncio.get_event_loop().run_until_complete(
        engine.trigger_scenario("heatwave")
    )
    assert len(engine.alerts) > initial_alerts
    assert engine.weather.temperature == 45


def test_restore_from_db():
    from app.db import VillageRow

    engine = SimulationEngine(0)
    rows = [
        VillageRow(
            id="village-0", name="Village-A", soc=72.0, solar_generation=200.0,
            demand=150.0, status="SURPLUS", temperature=28.0, frequency=50.0,
            critical_load=50.0, standard_load=100.0, x=400.0, y=300.0,
            max_capacity=500.0, charging_rate=0.1, degradation=0.0,
            standard_shed_percentage=0.0, critical_shed_percentage=0.0,
            hospital_demand=30.0, water_pump_demand=20.0,
            residential_demand=50.0, school_demand=25.0,
            emergency_spike=0.0, solar_panel_capacity=300.0,
            lat=23.26, lng=77.41,
        )
    ]
    engine.restore_from_db(rows)
    assert len(engine.villages) == 1
    assert engine.villages[0].soc == 72.0
    assert engine.villages[0].lat == 23.26
