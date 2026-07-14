"""Training script for the LSTM demand forecaster.

Downloads the UCI Appliances Energy Prediction dataset, preprocesses with
MinMaxScaler, trains a stacked-LSTM, and saves:
  - lstm_model.h5     (Keras model)
  - scaler.joblib     (fitted MinMaxScaler)
  - metrics.json      (MAE / RMSE / MAPE on held-out test set)

Usage:
    cd backend && python -m ml.train
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

import numpy as np

# Deterministic seeds for reproducibility
np.random.seed(42)
try:
    import tensorflow as tf
    tf.random.set_seed(42)
except ImportError:
    print("ERROR: TensorFlow is required for training. Install it first.")
    sys.exit(1)

from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import joblib

# ---------- Paths ----------

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
MODEL_PATH = PROJECT_ROOT / "lstm_model.h5"
SCALER_PATH = SCRIPT_DIR / "scaler.joblib"
METRICS_PATH = SCRIPT_DIR / "metrics.json"

# ---------- Feature configuration ----------

# 13 features matching the original model's training schema
FEATURES = [
    "Appliances",
    "T1", "RH_1",
    "T2", "RH_2",
    "T3", "RH_3",
    "T4",
    "T_out",
    "Press_mm_hg",
    "RH_out",
    "Windspeed",
    "Tdewpoint",
]

SEQ_LENGTH = 96   # 4 days of hourly lookback
N_FEATURES = len(FEATURES)

# ---------- Data loading ----------

UCI_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00374/energydata_complete.csv"
LOCAL_CACHE = SCRIPT_DIR / "energydata_complete.csv"


def load_data():
    """Load UCI Appliances Energy dataset."""
    import pandas as pd

    if LOCAL_CACHE.exists():
        print(f"Loading cached data from {LOCAL_CACHE}")
        df = pd.read_csv(LOCAL_CACHE)
    else:
        print(f"Downloading from {UCI_URL}...")
        try:
            df = pd.read_csv(UCI_URL)
            df.to_csv(LOCAL_CACHE, index=False)
            print(f"Cached to {LOCAL_CACHE}")
        except Exception as e:
            print(f"Download failed: {e}")
            print("Attempting to generate synthetic training data...")
            df = _generate_synthetic_data()

    # Select the 13 features
    missing = [f for f in FEATURES if f not in df.columns]
    if missing:
        print(f"WARNING: Missing columns {missing}, generating synthetic data")
        df = _generate_synthetic_data()

    return df[FEATURES].values


def _generate_synthetic_data():
    """Generate synthetic energy data if UCI download fails."""
    import pandas as pd
    n = 19735  # same row count as UCI dataset
    hours = np.tile(np.arange(24), n // 24 + 1)[:n]
    data = {
        "Appliances": np.clip(50 + 80 * np.sin(hours * np.pi / 12) + np.random.normal(0, 30, n), 10, 900),
        "T1": 20 + 2 * np.sin(hours * np.pi / 12) + np.random.normal(0, 0.5, n),
        "RH_1": 40 + 10 * np.sin(hours * np.pi / 14) + np.random.normal(0, 2, n),
        "T2": 19 + 2 * np.sin(hours * np.pi / 12) + np.random.normal(0, 0.5, n),
        "RH_2": 43 + 10 * np.sin(hours * np.pi / 14) + np.random.normal(0, 2, n),
        "T3": 21 + 1.5 * np.sin(hours * np.pi / 12) + np.random.normal(0, 0.5, n),
        "RH_3": 38 + 8 * np.sin(hours * np.pi / 14) + np.random.normal(0, 2, n),
        "T4": 20 + 1.5 * np.sin(hours * np.pi / 12) + np.random.normal(0, 0.5, n),
        "T_out": 5 + 10 * np.sin(hours * np.pi / 12) + np.random.normal(0, 2, n),
        "Press_mm_hg": 760 + np.random.normal(0, 3, n),
        "RH_out": 60 + 20 * np.sin(hours * np.pi / 14) + np.random.normal(0, 5, n),
        "Windspeed": 3 + 2 * np.sin(hours * np.pi / 12) + np.random.normal(0, 1, n),
        "Tdewpoint": 3 + 8 * np.sin(hours * np.pi / 12) + np.random.normal(0, 1, n),
    }
    return pd.DataFrame(data)


# ---------- Sequence preparation ----------


def prepare_sequences(data: np.ndarray, seq_length: int = SEQ_LENGTH):
    """Create sliding-window sequences for LSTM."""
    X, y = [], []
    for i in range(len(data) - seq_length):
        X.append(data[i : i + seq_length])
        y.append(data[i + seq_length, 0])  # predict Appliances
    return np.array(X), np.array(y)


# ---------- Model building ----------


def build_model(seq_length: int = SEQ_LENGTH, n_features: int = N_FEATURES):
    """Build the stacked-LSTM architecture matching the original model."""
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(seq_length, n_features)),
        tf.keras.layers.LSTM(64, return_sequences=True, name="lstm"),
        tf.keras.layers.LSTM(32, return_sequences=False, name="lstm_1"),
        tf.keras.layers.Dense(1, name="dense"),
    ])
    model.compile(optimizer="adam", loss="mse", metrics=["mae"])
    return model


# ---------- Training ----------


def train():
    """Full training pipeline."""
    print("=" * 60)
    print("LSTM Demand Forecaster — Training Pipeline")
    print("=" * 60)

    # 1. Load data
    print("\n[1/5] Loading data...")
    raw_data = load_data()
    print(f"  Raw data shape: {raw_data.shape}")

    # 2. Scale
    print("\n[2/5] Fitting MinMaxScaler...")
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(raw_data)
    joblib.dump(scaler, SCALER_PATH)
    print(f"  Scaler saved to {SCALER_PATH}")

    # 3. Prepare sequences
    print(f"\n[3/5] Preparing sequences (seq_length={SEQ_LENGTH})...")
    X, y = prepare_sequences(data_scaled)
    print(f"  X shape: {X.shape}, y shape: {y.shape}")

    # 4. Split (chronological)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    print(f"  Train: {X_train.shape[0]} samples, Test: {X_test.shape[0]} samples")

    # 5. Build and train model
    print("\n[4/5] Training LSTM...")
    model = build_model()
    model.summary()

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=5, restore_best_weights=True
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6
        ),
    ]

    history = model.fit(
        X_train, y_train,
        validation_split=0.1,
        epochs=50,
        batch_size=64,
        callbacks=callbacks,
        verbose=1,
    )

    # 6. Evaluate
    print("\n[5/5] Evaluating on test set...")
    y_pred_scaled = model.predict(X_test, verbose=0).flatten()

    # Inverse transform predictions and actuals
    def inverse_target(values):
        """Inverse-transform only the Appliances column (index 0)."""
        dummy = np.zeros((len(values), N_FEATURES))
        dummy[:, 0] = values
        return scaler.inverse_transform(dummy)[:, 0]

    y_test_real = inverse_target(y_test)
    y_pred_real = inverse_target(y_pred_scaled)

    mae = float(mean_absolute_error(y_test_real, y_pred_real))
    rmse = float(np.sqrt(mean_squared_error(y_test_real, y_pred_real)))
    mape = float(np.mean(np.abs((y_test_real - y_pred_real) / np.maximum(y_test_real, 1))) * 100)

    print(f"\n  MAE:  {mae:.2f} Wh")
    print(f"  RMSE: {rmse:.2f} Wh")
    print(f"  MAPE: {mape:.2f}%")

    # 7. Save model
    model.save(MODEL_PATH)
    print(f"\n  Model saved to {MODEL_PATH}")

    # 8. Save metrics
    metrics = {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "mape": round(mape, 4),
        "train_size": int(X_train.shape[0]),
        "test_size": int(X_test.shape[0]),
        "seq_length": SEQ_LENGTH,
        "n_features": N_FEATURES,
        "features": FEATURES,
        "epochs_trained": len(history.history["loss"]),
        "best_val_loss": round(float(min(history.history["val_loss"])), 6),
        "trained_at": datetime.utcnow().isoformat(),
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"  Metrics saved to {METRICS_PATH}")

    # 9. Baselines for comparison
    print("\n--- Baseline comparisons ---")

    # Naive persistence (last value repeated)
    y_naive = y_test_real[:-1]  # shift by 1
    y_actual_naive = y_test_real[1:]
    naive_mae = float(mean_absolute_error(y_actual_naive, y_naive))
    naive_rmse = float(np.sqrt(mean_squared_error(y_actual_naive, y_naive)))
    naive_mape = float(np.mean(np.abs((y_actual_naive - y_naive) / np.maximum(y_actual_naive, 1))) * 100)
    print(f"  Naive persistence — MAE: {naive_mae:.2f}, RMSE: {naive_rmse:.2f}, MAPE: {naive_mape:.2f}%")

    metrics["baselines"] = {
        "naive_persistence": {
            "mae": round(naive_mae, 4),
            "rmse": round(naive_rmse, 4),
            "mape": round(naive_mape, 4),
        }
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    print("\nTraining complete!")
    return metrics


if __name__ == "__main__":
    train()
