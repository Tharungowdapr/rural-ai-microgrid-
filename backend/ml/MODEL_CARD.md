# Model Card — LSTM Demand Forecaster

## Overview

A stacked LSTM model trained on the [UCI Appliances Energy Prediction dataset](https://archive.ics.uci.edu/ml/datasets/Appliances+energy+prediction) to forecast hourly energy demand for rural microgrid villages.

## Architecture

| Property | Value |
|----------|-------|
| Type | Sequential (Keras/TF) |
| Input shape | `(batch, 96, 13)` — 96 hourly timesteps, 13 features |
| Output shape | `(batch, 1)` — predicted Appliances energy (kWh) |
| Layer 1 | LSTM, 64 units, return_sequences=True, activation=tanh |
| Layer 2 | LSTM, 32 units, return_sequences=False, activation=tanh |
| Dense output | 1 unit (regression) |
| Total params | ~33k (estimated) |

## Features (13)

| # | Feature | Description | Unit |
|---|---------|-------------|------|
| 0 | Appliances | Target variable — energy consumption | Wh |
| 1 | T1 | Temperature in kitchen area | °C |
| 2 | RH_1 | Humidity in kitchen area | % |
| 3 | T2 | Temperature in living room | °C |
| 4 | RH_2 | Humidity in living room | % |
| 5 | T3 | Temperature in laundry room | °C |
| 6 | RH_3 | Humidity in laundry room | % |
| 7 | T4 | Temperature in office room | °C |
| 8 | T_out | Outside temperature | °C |
| 9 | Press_mm_hg | Pressure | mm Hg |
| 10 | RH_out | Outside humidity | % |
| 11 | Windspeed | Wind speed | m/s |
| 12 | Tdewpoint | Dewpoint temperature | °C |

## Preprocessing

- **Scaler:** `MinMaxScaler` fitted on training data, saved as `scaler.joblib`
- **Sequence length:** 96 timesteps (4 days of hourly data)
- **Split:** 80% train / 20% test, chronological (no shuffle)
- **Target:** Appliances column (index 0), single-step prediction

## Training Metrics

(See `backend/ml/metrics.json` for actual numbers after training)

| Metric | Value |
|--------|-------|
| MAE | (trained) |
| RMSE | (trained) |
| MAPE | (trained) |

## Inference in Production

The forecaster (`backend/app/ai/forecaster.py`) uses this model as follows:

1. Builds a feature vector from current village state + weather
2. Scales using the saved `scaler.joblib`
3. Tiles the single timestep to fill `(1, 96, 13)` sequence
4. Runs `model.predict()` → inverse-scales the output
5. Applies hour-of-day modulation for demand/generation

**Fallback:** When the model file is missing, corrupt, or TensorFlow is unavailable, the system transparently falls back to a rule-based heuristic (`_heuristic_predict`). The `source` field on every forecast entry indicates which path was used.

## Confidence Estimation

Confidence is computed per-forecast, NOT hardcoded:
- Base: 0.92 for model, 0.75 for heuristic
- Adjusted by prediction distance from current mean
- Reduced by forecast horizon (further = less confident)

## Bias & Limitations

- Trained on a single-building residential dataset (UCI), not actual rural-India microgrid data
- The mapping from UCI features to microgrid village features is approximate
- Seasonal and cultural usage patterns may differ significantly
- Should be retrained with domain-specific data if available
