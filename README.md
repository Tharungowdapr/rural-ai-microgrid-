# Rural AI Microgrid Energy Management System

A full-stack application to monitor, simulate, and optimize decentralized power distribution in remote areas. It provides a real-time "Digital Twin" of a mesh-based energy grid with AI-powered forecasting and autonomous energy management.

## Features

- **Real-Time Simulation** — Continuous simulation loop updating every 2–5 seconds
- **Interactive Mesh Topology** — SVG visualization with animated power flow
- **AI Predictive Analytics** — LSTM-based 6-hour forecasting for solar and load trends
- **Autonomous EMS Logic** — Intelligent load shedding and power routing
- **Live Dashboard** — Real-time metrics, alerts, and system state visualization
- **Scenario Testing** — Manually trigger realistic grid failure events

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- Make

### Setup & Run

```bash
# 1. Clone and enter the project
git clone https://github.com/Tharungowdapr/rural-ai-microgrid-.git
cd rural-ai-microgrid

# 2. One-time setup (creates venv, installs dependencies)
make setup

# 3. Start both backend and frontend
make dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Individual Commands

```bash
make help          # Show all commands
make backend       # Backend only (port 8000)
make frontend      # Frontend only (port 3000)
make build         # Build frontend for production
make clean         # Remove build artifacts
make kill-all      # Stop all running processes
make docker-up     # Run with Docker Compose
make docker-down   # Stop Docker containers
```

## Architecture

```
rural-ai-microgrid/
├── frontend/              # Next.js React dashboard
│   ├── src/app/           # App router, layout, globals
│   ├── src/components/    # React components
│   ├── src/hooks/         # Zustand store, WebSocket hooks
│   └── package.json
├── backend/               # FastAPI backend server
│   ├── app/
│   │   ├── main.py        # FastAPI app, WebSocket handler
│   │   ├── api/           # REST endpoints
│   │   ├── simulation/    # Grid simulation engine
│   │   ├── ems/           # Energy Management System
│   │   └── ai/            # LSTM forecaster
│   ├── ml/                # Model inference & preprocessing
│   └── requirements.txt
├── ml/                    # Pre-trained LSTM model
├── Makefile               # Build & dev orchestration
├── setup.sh               # One-click dependency installer
└── docker-compose.yml     # Docker Compose config
```

## AI/ML System

Pre-trained LSTM model (`ml/lstm_model.h5`) predicts future energy demand, solar generation trends, battery depletion risk, and optimal transfer windows.

**Model:** LSTM(64) → Dropout(0.2) → LSTM(32) → Dense(16) → Dense(1)

## Simulation Engine

### Village States
- **SURPLUS** — Generation > Demand
- **BALANCED** — SOC 50–100%
- **WARNING** — SOC 30–50%
- **DEFICIT** — SOC < 30%

### Scenario Triggers
Heatwave, Cloud Cover, Relay Failure, Hospital Surge, Blackout, Storm

## WebSocket Protocol

Connect to `ws://localhost:8000/ws`. Messages contain village states, active transfers, alerts, and system metrics.

## Configuration

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** (`.env`):
```
DATABASE_URL=postgresql://user:pass@localhost/microgrid
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_key_here
```

## Docker

```bash
make docker-build    # Build images
make docker-up       # Start containers
make docker-down     # Stop containers
make docker-logs     # View logs
```

## License

MIT
