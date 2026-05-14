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
- **Network Topology** — SVG mesh map with 5 village nodes, animated power flow lines
- **AI Predictions** — 6-hour LSTM forecast (demand, generation, confidence)
- **EMS Console** — Live transfer decisions and system alerts
- **Weather Panel** — Current conditions affecting solar generation
- **Village Bar** — SOC, demand, generation, temperature, frequency per village

### Controls
- **Predict Load** — Runs LSTM/heuristic forecast, updates AI panel chart
- **Random Mode** — Randomizes all village parameters + weather
- **Start / Pause** — Begins/stops real-time energy flow simulation
- **Village Config** — Click any node to adjust SOC, panel capacity, infrastructure loads, emergency spikes
- **System Settings** — Simulation speed (0.5x–4x), scenario triggers (heatwave, storm, blackout, etc.), EMS/battery parameters

## Architecture

```
backend/                  # FastAPI server
├── app/main.py           # Server + WebSocket + simulation loop
├── app/api/routes.py     # REST endpoints (villages, forecast, scenarios, etc.)
├── app/simulation/       # Grid simulation engine
├── app/ems/              # Energy Management System
├── app/ai/               # LSTM forecaster (heuristic fallback)
└── app/data/             # UCI energy dataset patterns

frontend/                 # Next.js 14 dashboard
├── src/app/page.tsx      # Main layout
├── src/components/       # React components
└── src/hooks/            # Zustand store + WebSocket hook
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | FastAPI (Python), WebSocket, NumPy |
| AI/ML | TensorFlow/Keras LSTM (fallback: heuristic) |
| Frontend | Next.js 14, React, TypeScript |
| State | Zustand |
| Charts | Recharts |
| Styling | Tailwind CSS |

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/villages` | All village states |
| `PUT /api/villages/{id}` | Update village parameters |
| `GET /api/forecast` | 6-hour demand/generation forecast |
| `POST /api/simulation/start` | Start simulation |
| `POST /api/simulation/stop` | Stop simulation |
| `POST /api/simulation/randomize` | Randomize all parameters |
| `POST /api/scenario/{id}` | Trigger scenario event |
| `PUT /api/weather` | Update weather conditions |
| `WS /ws` | Real-time state broadcasts |

## WebSocket Protocol

Connect to `ws://localhost:8000/ws`. Receives:
- `INIT_DATA` — Initial village states on connect
- `VILLAGES_UPDATE` — Periodically when simulation runs (every ~2s)

## Simulation States

| Status | Condition | Color |
|--------|-----------|-------|
| SURPLUS | Generation > Demand + 50kW | Green |
| BALANCED | SOC 50–100% | Blue |
| WARNING | SOC 30–50% | Yellow |
| DEFICIT | SOC < 30% | Red |

## Scenarios

Heatwave, Heavy Clouds, Hospital Surge, Relay Failure, Blackout, Storm — trigger from System Settings panel.

## License

MIT
