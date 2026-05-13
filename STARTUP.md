# Quick Start Guide

## Prerequisites

- Python 3.9+
- Node.js 18+
- Make

## Setup & Run

```bash
# One-time setup
make setup

# Start everything
make dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## All Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all commands |
| `make setup` | Install all dependencies |
| `make dev` | Run backend + frontend |
| `make backend` | Backend only (port 8000) |
| `make frontend` | Frontend only (port 3000) |
| `make build` | Build frontend for production |
| `make clean` | Remove build artifacts |
| `make kill-all` | Stop all processes |
| `make docker-up` | Start Docker containers |
| `make docker-down` | Stop Docker containers |
| `make docker-logs` | View Docker logs |
| `make reset` | Clean + reinstall |

## Manual Setup (if make is unavailable)

**Terminal 1 — Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting

- **Port in use:** `lsof -ti:8000 \| xargs kill -9`
- **Model missing:** The app falls back to synthetic forecasts
- **npm fails:** `npm cache clean --force && npm install`
- **Backend can't connect:** Check frontend `.env.local` has correct WS/API URLs

## Scenarios

- **Heatwave** — Extreme temperature, increased cooling load
- **Cloud Cover** — Reduced solar generation
- **Relay Failure** — Force transfer rerouting
- **Hospital Surge** — Sudden critical load spike
- **Blackout** — Complete village offline
- **Storm** — Extreme weather conditions

Happy microgrid management!
