"""AI Forecasting module — LSTM model with heuristic fallback for energy predictions.

The model path loads `lstm_model.h5` trained on the UCI Appliances Energy
Prediction dataset.  When the model file is missing or corrupt, all predictions
fall back transparently to a rule-based heuristic.  The ``source`` field on
every forecast entry tells the frontend which path was used.
"""

import logging
import math
import os
from pathlib import Path
from typing import Dict, List

import numpy as np

from app.simulation.engine import Village, Weather

logger = logging.getLogger(__name__)

try:
    import tensorflow as tf

    _HAS_TF = True
except ImportError:
    _HAS_TF = False
    logger.info("TensorFlow not available — heuristic-only mode")

try:
    import joblib

    _HAS_JOBLIB = True
except ImportError:
    _HAS_JOBLIB = False

# Feature list matching training pipeline (UCI Appliances Energy Prediction)
FEATURE_LIST = ["Appliances", "T1", "RH_1", "T2", "RH_2", "T3", "RH_3", "T4", "T_out", "Press_mm_hg", "RH_out", "Windspeed", "Tdewpoint"]
SEQ_LENGTH = 96  # lookback window (hours) - matches training
N_FEATURES = len(FEATURE_LIST)  # 13 features


class Forecaster:
    """AI Forecaster — LSTM model path with automatic heuristic fallback."""

    def __init__(self, model_path: str = None, scaler_path: str = None):
        self.model = None
        self.scaler = None
        self.model_path = model_path or os.path.join(
            os.path.dirname(__file__), "../../lstm_model.h5"
        )
        self.scaler_path = scaler_path or os.path.join(
            os.path.dirname(__file__), "../ml/scaler.joblib"
        )
        self._model_input_shape: tuple = ()
        self._load_model()
        self._load_scaler()

    def _load_model(self):
        """Attempt to load the saved LSTM model."""
        if not _HAS_TF:
            logger.info("TensorFlow not installed — using heuristic path")
            return
        if not os.path.exists(self.model_path):
            logger.warning("Model file not found at %s — using heuristic path", self.model_path)
            return
        try:
            self.model = tf.keras.models.load_model(self.model_path, compile=False)
            self._model_input_shape = tuple(self.model.input_shape)
            logger.info("Loaded LSTM model from %s (input shape: %s)", self.model_path, self._model_input_shape)
        except Exception as exc:
            logger.error("Failed to load model from %s: %s — using heuristic path", self.model_path, exc)
            self.model = None

    def _load_scaler(self):
        """Attempt to load the saved MinMaxScaler."""
        if not _HAS_JOBLIB:
            logger.info("joblib not installed — scaler not available")
            return
        if not os.path.exists(self.scaler_path):
            logger.warning("Scaler not found at %s", self.scaler_path)
            return
        try:
            self.scaler = joblib.load(self.scaler_path)
            logger.info("Loaded scaler from %s", self.scaler_path)
        except Exception as exc:
            logger.error("Failed to load scaler: %s", exc)

    async def predict(self, villages: List[Village], weather: Weather) -> List[Dict]:
        """Generate 6-hour forecast (one entry per hour ahead).

        Each entry includes a ``source`` field: ``"model"`` or ``"heuristic"``.
        """
        forecasts: List[Dict] = []
        for hour_offset in range(1, 7):
            if self.model is not None and self.scaler is not None:
                try:
                    forecast_data = await self._model_predict(villages, weather, hour_offset)
                except Exception as exc:
                    logger.warning("Model predict failed at offset %d: %s — falling back", hour_offset, exc)
                    forecast_data = self._heuristic_predict(villages, weather, hour_offset)
            else:
                forecast_data = self._heuristic_predict(villages, weather, hour_offset)
            forecasts.append(forecast_data)
        return forecasts

    async def _model_predict(
        self, villages: List[Village], weather: Weather, hour_offset: int
    ) -> Dict:
        """LSTM model prediction with proper scaling and confidence estimation."""
        if not villages:
            return {"demand": 0, "generation": 0, "confidence": 0.5, "source": "heuristic", "timestamp": 0}

        # Build feature vector from current village state + weather
        # Matches training features: Appliances, T1, RH_1, T2, RH_2, T3, RH_3, T4, T_out, Press_mm_hg, RH_out, Windspeed, Tdewpoint
        avg_demand = float(np.mean([v.demand for v in villages]))
        avg_generation = float(np.mean([v.solarGeneration for v in villages]))

        temp = weather.temperature if weather else 25.0
        humidity = weather.humidity if weather else 65.0
        wind = weather.windSpeed if weather else 5.0

        # Use values within training distribution to avoid out-of-bounds predictions
        # Training ranges: T1~16-26, RH_1~27-63, T2~16-30, RH_2~20-56, T3~17-29, RH_3~28-50, T4~15-26
        # T_out~-5-26, Press_mm_hg~729-772, RH_out~24-100, Windspeed~0-14, Tdewpoint~-6.6-15.5
        press_mmhg = 750.0  # within training range [729, 772]
        t_dewpoint = max(-6.0, min(15.0, temp - 5.0))  # clamp to training range

        features = np.array([[
            avg_demand,                   # Appliances proxy
            temp + 2,                     # T1 (kitchen)
            humidity - 5,                 # RH_1
            temp,                         # T2 (living room)
            humidity,                     # RH_2
            temp - 1,                     # T3 (laundry)
            humidity + 3,                 # RH_3
            temp + 1,                     # T4 (office)
            temp,                         # T_out
            press_mmhg,                   # Press_mm_hg (within training range)
            humidity,                     # RH_out
            wind,                         # Windspeed
            t_dewpoint,                   # Tdewpoint (clamped)
        ]])

        # Scale with the saved scaler
        features_scaled = self.scaler.transform(features)

        # Build sequence: repeat last known timestep to fill (1, seq_length, n_features)
        # In production this would come from rolling history
        sequence = np.tile(features_scaled, (SEQ_LENGTH, 1)).reshape(1, SEQ_LENGTH, N_FEATURES)

        # Run inference
        prediction = self.model.predict(sequence, verbose=0)

        # Inverse-transform the prediction to physical units
        # The model predicts the next Appliances value (scaled)
        pred_scaled = float(prediction[0][0])

        # Build a dummy row to inverse-transform (only Appliances column matters)
        dummy = np.zeros((1, N_FEATURES))
        dummy[0, 0] = pred_scaled
        pred_real = float(self.scaler.inverse_transform(dummy)[0, 0])

        # Apply prediction to current values with hour-of-day modulation
        hour = (weather.hour + hour_offset) % 24 if weather else 12
        hour_factor_demand = 1.0 + 0.15 * math.sin((hour - 6) * math.pi / 12) if 6 <= hour <= 22 else 0.85
        hour_factor_gen = max(0, 1.0 - abs(hour - 13) / 8) if 6 <= hour <= 20 else 0.1

        forecast_demand = max(0, pred_real * hour_factor_demand)
        forecast_generation = max(0, avg_generation * hour_factor_gen * (1.0 + 0.05 * np.random.randn()))

        # Confidence: based on distance from training mean and hour offset
        distance_penalty = abs(pred_real - avg_demand) / max(avg_demand, 1)
        horizon_penalty = hour_offset * 0.03
        confidence = max(0.5, min(0.98, 0.92 - distance_penalty * 0.1 - horizon_penalty))

        return {
            "demand": round(float(forecast_demand), 2),
            "generation": round(float(forecast_generation), 2),
            "confidence": round(float(confidence), 4),
            "source": "model",
            "timestamp": 0,
        }

    def _heuristic_predict(
        self, villages: List[Village], weather: Weather, hour_offset: int
    ) -> Dict:
        """Rule-based heuristic forecast — used as fallback and baseline."""
        if not villages:
            return {"demand": 0, "generation": 0, "confidence": 0.5, "source": "heuristic", "timestamp": 0}

        avg_demand = float(np.mean([v.demand for v in villages]))
        avg_generation = float(np.mean([v.solarGeneration for v in villages]))

        forecast_demand = avg_demand
        forecast_generation = avg_generation

        actual_hour = (weather.hour + hour_offset) % 24 if weather else 12
        if 10 <= actual_hour <= 14:
            forecast_generation *= 1.1
        elif 16 <= actual_hour <= 20:
            forecast_demand *= 1.15
            forecast_generation *= 0.6

        forecast_demand *= np.random.uniform(0.9, 1.1)
        forecast_generation *= np.random.uniform(0.9, 1.1)

        # Heuristic confidence is lower and constant
        confidence = 0.75

        return {
            "demand": round(float(forecast_demand), 2),
            "generation": round(float(forecast_generation), 2),
            "confidence": round(float(confidence), 4),
            "source": "heuristic",
            "timestamp": 0,
        }

    async def calculate_deficit_probability(self, village: Village) -> float:
        """Calculate probability of this village entering deficit state in next 2 hours."""
        soc_trend = village.solarGeneration - village.demand

        if village.soc < 30:
            return 0.95
        elif village.soc < 50 and soc_trend < 0:
            return 0.7
        elif village.soc < 70 and soc_trend < -20:
            return 0.4
        else:
            return 0.05
