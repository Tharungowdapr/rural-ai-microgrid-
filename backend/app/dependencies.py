"""Shared application instances — created once at import time."""

from app.simulation.engine import SimulationEngine
from app.ems.controller import EMSController
from app.ai.forecaster import Forecaster
from app.config import settings

simulation_engine = SimulationEngine(5)
ems_controller = EMSController()
forecaster = Forecaster(model_path=settings.MODEL_PATH, scaler_path=settings.SCALER_PATH)
