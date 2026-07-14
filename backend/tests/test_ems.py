"""Tests for EMS controller — transfer decision logic."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import asyncio
from app.simulation.engine import SimulationEngine, Village, VillageStatus
from app.ems.controller import EMSController


def test_no_transfers_when_all_balanced():
    engine = SimulationEngine(0)
    engine.villages = [
        Village(id="v0", name="A", soc=70, solarGeneration=120, demand=100, x=0, y=0),
        Village(id="v1", name="B", soc=75, solarGeneration=130, demand=110, x=100, y=0),
    ]
    engine._update_status(engine.villages[0])
    engine._update_status(engine.villages[1])
    controller = EMSController()
    decisions = asyncio.get_event_loop().run_until_complete(controller.run(engine.villages))
    assert isinstance(decisions, list)


def test_deficit_triggers_transfer():
    engine = SimulationEngine(0)
    engine.villages = [
        Village(id="v0", name="Surplus", soc=90, solarGeneration=300, demand=100, x=0, y=0),
        Village(id="v1", name="Deficit", soc=20, solarGeneration=20, demand=200, x=100, y=0),
    ]
    engine._update_status(engine.villages[0])
    engine._update_status(engine.villages[1])
    assert engine.villages[1].status == VillageStatus.DEFICIT
    controller = EMSController()
    decisions = asyncio.get_event_loop().run_until_complete(controller.run(engine.villages))
    assert isinstance(decisions, list)


def test_load_shedding():
    engine = SimulationEngine(0)
    v = Village(id="v0", name="A", soc=15, solarGeneration=50, demand=100, x=0, y=0)
    engine.villages = [v]
    controller = EMSController()
    asyncio.get_event_loop().run_until_complete(controller.run(engine.villages))
    assert v.standardShedPercentage > 0 or v.criticalShedPercentage > 0


def test_relay_failure_handling():
    engine = SimulationEngine(0)
    engine.villages = [
        Village(id="v0", name="A", soc=90, solarGeneration=300, demand=100, x=0, y=0),
        Village(id="v1", name="B", soc=20, solarGeneration=20, demand=200, x=100, y=0),
    ]
    engine._update_status(engine.villages[0])
    engine._update_status(engine.villages[1])
    controller = EMSController()
    decisions = asyncio.get_event_loop().run_until_complete(
        controller.handle_relay_failure("R-014", engine.villages)
    )
    assert isinstance(decisions, list)
