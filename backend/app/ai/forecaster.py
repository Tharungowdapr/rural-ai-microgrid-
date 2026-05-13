import numpy as np
import os
from typing import List, Dict
from app.simulation.engine import Village, Weather
import tensorflow as tf

class Forecaster:
    """AI Forecasting module using LSTM model for energy predictions"""
    
    def __init__(self, model_path: str = None):
        self.model = None
        self.model_path = model_path or "/Users/tharungowdapr/Documents/college/projects/mlflow/rural-ai-microgrid/ml/lstm_model.h5"
        
        try:
            if os.path.exists(self.model_path):
                self.model = tf.keras.models.load_model(self.model_path)
                print(f"Loaded LSTM model from {self.model_path}")
            else:
                print(f"Model not found at {self.model_path}, using synthetic forecasts")
        except Exception as e:
            print(f"Error loading model: {e}, using synthetic forecasts")
    
    async def predict(self, villages: List[Village], weather: Weather) -> List[Dict]:
        """
        Predict future energy demand and generation for the next 6 hours
        
        Returns:
            List of forecasts with timestamps, demand, generation, and confidence
        """
        forecasts = []
        
        # Generate 6-hour forecast (every hour)
        for hour_offset in range(1, 7):
            # Use model if available, otherwise use heuristic
            if self.model:
                forecast_data = await self._model_predict(villages, hour_offset)
            else:
                forecast_data = self._heuristic_predict(villages, weather, hour_offset)
            
            forecasts.append(forecast_data)
        
        return forecasts
    
    async def _model_predict(self, villages: List[Village], hour_offset: int) -> Dict:
        """Use LSTM model for prediction"""
        try:
            # Prepare input features
            # In a real system, this would include historical data
            features = np.array([
                [
                    v.solarGeneration,
                    v.demand,
                    v.soc,
                    v.temperature,
                    v.frequency,
                ]
                for v in villages
            ])
            
            # Flatten and reshape for LSTM (batch_size, timesteps, features)
            features = features.flatten().reshape(1, -1, 1)
            
            # Make prediction
            prediction = self.model.predict(features, verbose=0)
            
            # Average across villages
            avg_demand = np.mean([v.demand for v in villages])
            avg_generation = np.mean([v.solarGeneration for v in villages])
            
            return {
                "demand": float(avg_demand * (1 + prediction[0][0] * 0.1)),
                "generation": float(avg_generation * (1 + prediction[0][1] * 0.1) if prediction.shape[1] > 1 else avg_generation),
                "confidence": 0.92,
                "timestamp": 0,  # Will be set by frontend
            }
        except Exception as e:
            print(f"Model prediction error: {e}, falling back to heuristic")
            return self._heuristic_predict(villages, None, hour_offset)
    
    def _heuristic_predict(self, villages: List[Village], weather: Weather, hour_offset: int) -> Dict:
        """Heuristic-based prediction (no model)"""
        
        # Average current state
        avg_demand = np.mean([v.demand for v in villages])
        avg_generation = np.mean([v.solarGeneration for v in villages])
        avg_soc = np.mean([v.soc for v in villages])
        
        # Simple trend-based forecast
        # Morning peak: increase demand
        # Afternoon peak: high generation but increasing demand
        # Evening: decreasing generation, increasing demand
        
        forecast_demand = avg_demand
        forecast_generation = avg_generation
        
        # Adjust based on time of day (assuming current hour is in simulation)
        if 10 <= hour_offset <= 14:
            forecast_generation *= 1.1  # Peak solar hours
        elif 16 <= hour_offset <= 20:
            forecast_demand *= 1.15  # Evening peak
            forecast_generation *= 0.6  # Sunset
        
        # Add randomness for realism
        forecast_demand *= np.random.uniform(0.9, 1.1)
        forecast_generation *= np.random.uniform(0.9, 1.1)
        
        return {
            "demand": float(forecast_demand),
            "generation": float(forecast_generation),
            "confidence": 0.85,
            "timestamp": 0,  # Will be set by frontend
        }
    
    async def calculate_deficit_probability(self, village: Village) -> float:
        """Calculate probability of this village entering deficit state in next 2 hours"""
        
        # Simple heuristic based on current SOC and trend
        soc_trend = village.solarGeneration - village.demand
        
        if village.soc < 30:
            return 0.95
        elif village.soc < 50 and soc_trend < 0:
            return 0.7
        elif village.soc < 70 and soc_trend < -20:
            return 0.4
        else:
            return 0.05
