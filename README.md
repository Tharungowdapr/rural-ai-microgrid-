# Rural AI Microgrid

A full-stack AI-powered decentralized smart-grid simulation for 5 villages. Each village generates solar energy, stores it in batteries, and autonomously shares power through a mesh network using an Energy Management System (EMS) with LSTM-based AI predictions.

## Quick Start

```bash
# Setup (first time)
make setup

# Start backend (Terminal 1)
make backend

# Start frontend (Terminal 2)
make frontend-dev

# Open http://localhost:3000
```

## Features

### Dashboard
- **Network Topology** — Interactive Leaflet/OpenStreetMap map with 5 village markers at real Madhya Pradesh coordinates, animated power transfer polylines, status legend
- **AI Predictions** — 6-hour LSTM forecast (demand, generation, confidence) with model/heuristic source indicator
- **EMS Console** — Live transfer decisions and system alerts
- **Weather Panel** — Current conditions affecting solar generation
- **Village Bar** — SOC, demand, generation, temperature, frequency per village with status badges

### Controls
- **Predict Load** — Runs LSTM/heuristic forecast, updates AI panel chart, shows source and confidence
- **Random Mode** — Randomizes all village parameters + weather
- **Start / Pause** — Begins/stops real-time energy flow simulation
- **Village Config** — Click any node to adjust SOC, panel capacity, infrastructure loads, emergency spikes
- **System Settings** — Simulation speed (0.5x–5x), scenario triggers (heatwave, storm, blackout, etc.), EMS/battery parameters

### Connection Status
- WebSocket reconnect with exponential backoff (1s → 30s max)
- Online/Connecting/Offline indicator in header
- Error broadcast on simulation failure

## Architecture

```
backend/                    # FastAPI server
├── app/main.py             # Server + WebSocket + simulation loop
├── app/api/routes.py       # REST endpoints (validated with Pydantic)
├── app/config.py           # pydantic-settings (loads from .env)
├── app/db.py               # SQLite persistence (SQLAlchemy)
├── app/simulation/engine.py # Village/Weather/Transfer dataclasses + simulation engine
├── app/ems/controller.py   # Energy Management System decisions
├── app/ai/forecaster.py    # LSTM + heuristic forecaster (source field)
├── app/dependencies.py     # Shared singletons

ml/                         # Training pipeline
├── train.py                # End-to-end: UCI download → MinMaxScaler → LSTM → artifacts
├── inference.py            # Standalone inference script (reference)
├── metrics.json            # Real training metrics (MAE, RMSE, MAPE)
├── MODEL_CARD.md           # Model documentation
├── scaler.joblib           # Fitted MinMaxScaler
└── energydata_complete.csv # Cached UCI dataset

frontend/                   # Next.js 14 dashboard
├── src/app/page.tsx        # Main layout
├── src/components/
│   ├── Topology.tsx        # Leaflet map with real coordinates
│   ├── AIPanel.tsx         # AI forecast chart + model/heuristic indicator
│   ├── Header.tsx          # Controls + connection status
│   ├── VillageBar.tsx      # Village status cards
│   └── AlertCenter.tsx     # System alerts
├── src/hooks/
│   ├── useGridStore.ts     # Zustand state management
│   └── useWebSocket.ts     # WebSocket with reconnect + backoff
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | FastAPI (Python 3.11+), WebSocket, SQLAlchemy, Pydantic v2 |
| AI/ML | TensorFlow/Keras LSTM (96-step, 13 features) + heuristic fallback |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Map | react-leaflet + OpenStreetMap tiles |
| State | Zustand |
| Charts | Recharts |
| Testing | pytest (46 tests), vitest (17 tests) |
| CI | GitHub Actions |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check — returns `model_loaded`, `model_path` |
| `/api/villages` | GET | All village states |
| `/api/villages/{id}` | GET | Single village |
| `/api/villages/{id}` | PUT | Update village (validated: SOC 0–100, capacity > 0) |
| `/api/transfers` | GET | All transfers |
| `/api/alerts` | GET | All alerts |
| `/api/forecast` | GET | 6-hour demand/generation forecast |
| `/api/history/{id}` | GET | Village history (last N hours) |
| `/api/metrics/model` | GET | Model metrics (MAE, RMSE, MAPE) |
| `/api/simulation/toggle` | POST | Start/pause simulation |
| `/api/simulation/randomize` | POST | Randomize all parameters |
| `/api/control/simulation/speed/{speed}` | POST | Set simulation speed (0.1–5.0) |
| `/api/scenario/{id}` | POST | Trigger scenario event |
| `/api/weather` | PUT | Update weather conditions |
| `/api/control/emergency/{id}` | POST | Add emergency demand spike |
| `/api/control/load/{id}/shed` | POST | Trigger load shedding |
| `/api/control/transfer/request` | POST | Request manual power transfer |
| `/api/village/{id}/infrastructure` | POST | Update infrastructure loads |
| `/ws` | WS | Real-time state broadcasts |

## WebSocket Protocol

Connect to `ws://localhost:8000/ws`. Receives:
- `INIT_DATA` — Initial village states on connect
- `VILLAGES_UPDATE` — Periodically when simulation runs (every ~2s at 1x speed)
- `ERROR` — Broadcast on simulation failure

## AI Model

**Architecture:** Stacked LSTM (64→32 units) trained on UCI Appliances Energy Prediction dataset.

| Metric | LSTM | Naive Baseline |
|--------|------|----------------|
| MAE | 28.32 Wh | 26.21 Wh |
| RMSE | **59.49 Wh** | 65.74 Wh |
| MAPE | 27.12% | 21.88% |

The LSTM achieves **10% lower RMSE** than naive persistence, reducing catastrophic mispredictions that cause grid instability. See `RESULTS.md` for full analysis and `MODEL_CARD.md` for architecture details.

**Retraining:**
```bash
cd backend && python -m ml.train
```

## Testing

```bash
make test              # Run all tests
make test-backend      # Backend only (pytest)
make test-frontend     # Frontend only (vitest)
make lint              # Lint all
make format            # Format all
```

## Simulation States

| Status | Condition | Color |
|--------|-----------|-------|
| SURPLUS | Generation > Demand + 50kW | Green |
| BALANCED | SOC 50–100% | Blue |
| WARNING | SOC 30–50% | Yellow |
| DEFICIT | SOC < 30% | Red |

## Configuration

Copy `.env.example` to `.env` and customize:

```bash
MODEL_PATH=ml/lstm_model.h5     # Path to trained model
SCALER_PATH=ml/scaler.joblib    # Path to fitted scaler
CORS_ORIGINS=*                  # Allowed origins
LOG_LEVEL=INFO                  # Logging level
```

## License

MIT
