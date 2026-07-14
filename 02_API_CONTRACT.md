# API & WebSocket Contract Reference

Current shapes as they exist in the repo today (`backend/app/api/routes.py`, `backend/app/main.py`). Use this as the source of truth for what must keep working, and mark clearly in your PR/commit description anything you intentionally change.

## REST endpoints (prefix `/api` unless noted)

| Method | Path | Purpose | Notes |
|---|---|---|---|
| GET | `/health` | liveness | extend with `model_loaded`, `model_path` per task Section 1 |
| GET | `/` | root info | |
| GET | `/api/villages` | all village states | |
| GET | `/api/villages/{village_id}` | one village | 404 if missing |
| PUT | `/api/villages/{village_id}` | partial update of village params | add clamping/validation per task Section 1 |
| GET | `/api/transfers` | transfer log | |
| GET | `/api/alerts` | alert log | |
| GET | `/api/forecast` | 6-hour forecast | must indicate `source: "model" \| "heuristic"` per village-forecast entry after Section 2/3 changes |
| POST | `/api/scenario/{scenario_id}` | trigger scenario | valid ids: `heatwave, cloudcover, relay-failure, hospital-surge, blackout, storm` |
| POST | `/api/control/simulation/pause` | pause | |
| POST | `/api/control/simulation/resume` | resume | |
| POST | `/api/simulation/start` | start (resets speed to 1.0) | |
| POST | `/api/simulation/stop` | stop | |
| POST | `/api/simulation/toggle` | toggle pause state | |
| POST | `/api/simulation/randomize` | randomize all village/weather params | |
| POST | `/api/control/simulation/speed/{speed}` | set 0–4x speed | 400 if out of range |
| POST | `/api/control/transfer/request` | manual transfer (query params: source_id, destination_id, amount) | 400 if amount<=0 |
| POST | `/api/control/load/{village_id}/shed` | set shed percentage | 0–100, 404 if village missing |
| POST | `/api/control/emergency/{village_id}` | trigger emergency spike | default 80kW |
| PUT | `/api/weather` | partial weather update | |
| POST | `/api/village/{village_id}/infrastructure` | update infra demand fields | query params, not body — inconsistent with other PUT endpoints, consider normalizing to a Pydantic body model for consistency (note as a fix, don't silently change without updating frontend calls) |

**New endpoints to add (per task prompt):**
- `GET /api/history/{village_id}?hours=N` — rolling window of demand/generation/soc/weather for LSTM input and frontend trend charts.
- `GET /api/metrics/model` — surfaces current `metrics.json` (MAE/RMSE/MAPE) so the frontend/report can display it live.

## WebSocket `/ws`

**Client → server messages:**
```json
{"type": "SCENARIO", "scenario": "heatwave"}
```

**Server → client, on connect:**
```json
{
  "type": "INIT_DATA",
  "villages": [/* Village.dict() */],
  "paused": true,
  "timestamp": "2026-07-15T12:00:00"
}
```

**Server → client, periodic (every ~2s / simulation_speed, only when unpaused):**
```json
{
  "type": "VILLAGES_UPDATE",
  "villages": [/* Village.dict() */],
  "transfers": [/* Transfer.dict() */],
  "alerts": [/* last 20 Alert.dict() */],
  "forecasts": [/* 6 entries, Forecaster.predict() output */],
  "ai_insights": [/* {type, title, content, severity} */],
  "metrics": {
    "totalGeneration": 0, "totalDemand": 0, "gridStability": 0,
    "weatherCondition": "sunny", "temperature": 0, "humidity": 0,
    "windSpeed": 0, "cloudCover": 0, "simulationHour": 0, "is_paused": false
  },
  "timestamp": "2026-07-15T12:00:00"
}
```

**New message type to add:** on any unhandled exception in the simulation loop, broadcast:
```json
{"type": "ERROR", "message": "human-readable description", "timestamp": "..."}
```
Frontend `useWebSocket.ts` must handle this type (e.g., banner/toast) instead of ignoring unknown message types silently.

## Forecast entry shape (current, from `forecaster.py`)

```json
{
  "demand": 123.4,
  "generation": 98.7,
  "confidence": 0.92,
  "timestamp": 0
}
```
Per task Section 2/3, extend to:
```json
{
  "demand": 123.4,
  "generation": 98.7,
  "confidence": 0.87,
  "source": "model",
  "timestamp": 0
}
```
Keep `demand`/`generation`/`confidence`/`timestamp` keys stable — only add `source`, don't rename existing keys, since the frontend chart already binds to these field names.

## Validation rules to enforce (currently mostly missing)

- `soc`: 0–100
- `solarPanelCapacity`, `chargingRate`, all demand fields: >= 0
- `speed`: 0–4 (already enforced)
- `percentage` (load shed): 0–100 (already enforced)
- `amount` (transfer request): > 0 (already enforced)
- Any new field added to `VillageUpdate`/`WeatherUpdate` must use Pydantic `Field(...)` constraints, not manual `if` checks in the route body.
