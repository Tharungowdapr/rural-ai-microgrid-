"""Tests for AI forecaster — heuristic and model paths."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import asyncio
from app.ai.forecaster import Forecaster
from app.simulation.engine import Village, Weather


def test_heuristic_predict():
    f = Forecaster.__new__(Forecaster)
    f.model = None
    f.scaler = None
    f.model_path = ""
    f.scaler_path = ""
    f._model_input_shape = ()

    villages = [
        Village(id="v0", name="A", soc=70, solarGeneration=150, demand=120),
        Village(id="v1", name="B", soc=50, solarGeneration=100, demand=130),
    ]
    weather = Weather(hour=12, temperature=30, humidity=60, windSpeed=5, cloudCover=30)

    result = f._heuristic_predict(villages, weather, 1)
    assert "demand" in result
    assert "generation" in result
    assert "confidence" in result
    assert result["source"] == "heuristic"
    assert result["demand"] >= 0
    assert result["generation"] >= 0
    assert 0 <= result["confidence"] <= 1


def test_empty_villages_predict():
    f = Forecaster.__new__(Forecaster)
    f.model = None
    f.scaler = None
    f.model_path = ""
    f.scaler_path = ""
    f._model_input_shape = ()

    result = f._heuristic_predict([], None, 1)
    assert result["demand"] == 0
    assert result["generation"] == 0
    assert result["source"] == "heuristic"


def test_deficit_probability():
    f = Forecaster.__new__(Forecaster)
    f.model = None
    f.scaler = None
    f.model_path = ""
    f.scaler_path = ""
    f._model_input_shape = ()

    v_low = Village(id="v0", name="A", soc=20, solarGeneration=30, demand=100)
    v_ok = Village(id="v1", name="B", soc=80, solarGeneration=200, demand=100)

    prob_low = asyncio.get_event_loop().run_until_complete(f.calculate_deficit_probability(v_low))
    prob_ok = asyncio.get_event_loop().run_until_complete(f.calculate_deficit_probability(v_ok))

    assert prob_low > prob_ok
    assert 0 <= prob_low <= 1
    assert 0 <= prob_ok <= 1


def test_forecast_source_field():
    """Every forecast entry must have a source field."""
    f = Forecaster.__new__(Forecaster)
    f.model = None
    f.scaler = None
    f.model_path = ""
    f.scaler_path = ""
    f._model_input_shape = ()

    villages = [Village(id="v0", name="A", soc=60, solarGeneration=150, demand=120)]
    weather = Weather(hour=10)
    result = f._heuristic_predict(villages, weather, 1)
    assert result["source"] in ("model", "heuristic")
