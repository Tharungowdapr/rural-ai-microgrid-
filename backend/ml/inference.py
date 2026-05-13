import tensorflow as tf
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import os

class LSTMInference:
    """Load and run inference with pre-trained LSTM model"""
    
    def __init__(self, model_path: str = None):
        self.model = None
        self.scaler = None
        self.model_path = model_path or "/Users/tharungowdapr/Documents/college/projects/mlflow/rural-ai-microgrid/ml/lstm_model.h5"
        
        self._load_model()
    
    def _load_model(self):
        """Load the saved LSTM model"""
        if os.path.exists(self.model_path):
            try:
                self.model = tf.keras.models.load_model(self.model_path)
                print(f"✓ Loaded model: {self.model_path}")
            except Exception as e:
                print(f"✗ Error loading model: {e}")
        else:
            print(f"✗ Model not found: {self.model_path}")
    
    def predict_demand(self, historical_data: np.ndarray) -> float:
        """
        Predict future energy demand
        
        Args:
            historical_data: Recent energy consumption values (shape: [seq_len])
        
        Returns:
            Predicted demand value
        """
        if self.model is None:
            print("Model not loaded, returning baseline forecast")
            return float(np.mean(historical_data))
        
        try:
            # Reshape for LSTM: (batch_size, timesteps, features)
            X = historical_data.reshape(1, len(historical_data), 1)
            prediction = self.model.predict(X, verbose=0)
            return float(prediction[0][0])
        except Exception as e:
            print(f"Prediction error: {e}")
            return float(np.mean(historical_data))
    
    def predict_batch(self, batch_sequences: np.ndarray) -> np.ndarray:
        """
        Predict for multiple sequences
        
        Args:
            batch_sequences: Multiple sequences (shape: [batch_size, seq_len, features])
        
        Returns:
            Predictions for each sequence
        """
        if self.model is None:
            return np.mean(batch_sequences, axis=1)
        
        try:
            predictions = self.model.predict(batch_sequences, verbose=0)
            return predictions.flatten()
        except Exception as e:
            print(f"Batch prediction error: {e}")
            return np.mean(batch_sequences, axis=1).flatten()
    
    def get_model_summary(self):
        """Print model architecture"""
        if self.model:
            self.model.summary()
        else:
            print("Model not loaded")
