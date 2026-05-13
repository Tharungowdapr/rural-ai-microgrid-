import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import os

class DataPreprocessor:
    """Preprocess energy data for LSTM model training"""
    
    def __init__(self):
        self.scaler = MinMaxScaler()
        self.url = "https://archive.ics.uci.edu/ml/machine-learning-databases/00374/energydata_complete.csv"
        self.df = None
        self.features = [
            'Appliances',
            'Temperature',
            'Humidity',
            'Pressure',
            'Windspeed',
            'Visibility',
            'Dewpoint'
        ]
    
    def load_data(self, use_url: bool = True) -> pd.DataFrame:
        """Load energy dataset"""
        if use_url:
            try:
                self.df = pd.read_csv(self.url)
                print(f"Loaded data from URL: {len(self.df)} rows")
            except Exception as e:
                print(f"Error loading from URL: {e}")
                return None
        else:
            local_path = "ml/data/energydata_complete.csv"
            if os.path.exists(local_path):
                self.df = pd.read_csv(local_path)
                print(f"Loaded local data: {len(self.df)} rows")
            else:
                print(f"Local file not found: {local_path}")
                return None
        
        return self.df
    
    def prepare_sequences(self, data: np.ndarray, seq_length: int = 24) -> tuple:
        """
        Prepare time-series sequences for LSTM
        
        Args:
            data: numpy array of features
            seq_length: length of each sequence (lookback window)
        
        Returns:
            X, y: sequences and targets
        """
        X, y = [], []
        
        for i in range(len(data) - seq_length):
            X.append(data[i:i + seq_length])
            y.append(data[i + seq_length, 0])  # Predict first feature (Appliances/demand)
        
        return np.array(X), np.array(y)
    
    def preprocess(self, test_size: float = 0.2):
        """
        Full preprocessing pipeline
        
        Returns:
            X_train, X_test, y_train, y_test, scaler
        """
        # Load data
        df = self.load_data()
        if df is None:
            return None
        
        # Select features
        data = df[self.features].values
        
        # Scale data
        data_scaled = self.scaler.fit_transform(data)
        
        # Create sequences
        X, y = self.prepare_sequences(data_scaled)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, shuffle=False
        )
        
        print(f"Training set: {X_train.shape}")
        print(f"Test set: {X_test.shape}")
        
        return X_train, X_test, y_train, y_test, self.scaler
