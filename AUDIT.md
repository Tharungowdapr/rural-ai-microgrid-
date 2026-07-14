# Baseline Audit — Rural AI Microgrid

## Exercise Log

All controls were exercised once against the default backend (`make backend`) and frontend (`make frontend-dev`).

### Controls Tested

| Control | Action | Result |
|---------|--------|--------|
| Predict Load | Header button | Calls `GET /api/forecast`, returns 6 entries. AI panel shows chart. No source indicator. |
| Random Mode | Header button | Calls `POST /api/simulation/randomize`, re-fetches villages. Works. |
| Start/Pause | Header button | Calls `POST /api/simulation/toggle`. Toggles correctly. |
| Village Config | Click any node | Opens CityControlModal. Sliders work. Save calls `PUT /api/villages/{id}`. No validation feedback. |
| System Settings | Bottom button | Opens modal with 7 tabs. Scenario triggers call `POST /api/scenario/{id}`. Speed calls `POST /api/control/simulation/speed/{speed}`. All work. |
| Scenario: heatwave | Settings > Scenarios | Sets temp=45, adds CRITICAL alert. Works. |
| Scenario: cloudcover | Settings > Scenarios | Sets cloudCover=95. Works. |
| Scenario: hospital-surge | Settings > Scenarios | Adds 100kW demand to village-0. Works. |
| Scenario: relay-failure | Settings > Scenarios | Adds CRITICAL alert. No actual topology change (simplified). Works as designed. |
| Scenario: blackout | Settings > Scenarios | Sets random village SOC=0, generation=0. Works. |
| Scenario: storm | Settings > Scenarios | Sets wind=80, cloud=100. Works. |
| Weather Panel | Sliders | Calls `PUT /api/weather` on each change. Works. |
| Load Shed | `POST /api/control/load/{id}/shed` | Manual test via curl: works, no validation on backend beyond range check. |

### Console/Server Errors

1. **`main.py:run_simulation`** — bare `except Exception as e: print(...)` on line ~140. Failures are printed to stdout only; no WS error broadcast, no structured logging.
2. **`forecaster.py:_model_predict`** — when model loads but input shape mismatches (5 villages → flatten to `(1, 25, 1)` vs model's expected `(1, 24, 7)`), catches exception and falls back silently. No user-visible indication that heuristic path was used.
3. **`Weather.hour` attribute** — `Weather` dataclass has no `hour` field. `forecaster.py:_heuristic_predict` accesses `weather.hour` which will raise `AttributeError` if weather is `None` (the fallback path in `_model_predict` passes `None`).
4. **No structured logging** — all backend errors go to `print()`, invisible in production.

### WebSocket Mismatches

1. **`VILLAGES_UPDATE`** shape matches `useGridStore` expectations. ✅
2. **`INIT_DATA`** shape matches `useWebSocket` handler. ✅
3. **No `ERROR` message type** handled by frontend — unknown message types are silently ignored by the `switch` in `useWebSocket.ts`.
4. **Forecasts in `VILLAGES_UPDATE`** — no `source` field in forecast entries, frontend cannot distinguish model vs heuristic.

### Unmatched Endpoints

| Endpoint | Called by frontend? |
|----------|-------------------|
| `GET /api/transfers` | No (transfers come via WS `VILLAGES_UPDATE`) |
| `GET /api/alerts` | No (alerts come via WS) |
| `GET /api/forecast` | Yes (Header "Predict Load" button) |
| `POST /api/control/simulation/pause` | No (uses toggle instead) |
| `POST /api/control/simulation/resume` | No (uses toggle instead) |
| `POST /api/simulation/start` | No (uses toggle instead) |
| `POST /api/simulation/stop` | No (uses toggle instead) |
| `POST /api/control/transfer/request` | No (EMS handles transfers) |
| `POST /api/control/load/{id}/shed` | No (EMS handles shedding) |
| `POST /api/control/emergency/{id}` | Yes (CityControlModal) |
| `POST /api/village/{id}/infrastructure` | No (CityControlModal uses PUT /api/villages/{id}) |

### Known Issues Confirmed

1. **LSTM model is decorative.** `_model_predict` flattens 5 raw unscaled features into `(1, -1, 1)` — no scaler, no lookback window, no relation to `preprocess.py` pipeline. Output multiplied by `* 0.1` as fudge factor. `inference.py` (`LSTMInference`) is never imported.
2. **"Map" is not a map.** `Topology.tsx` computes synthetic polygon/circle layouts. Demo fallback shows 5 fake nodes when `villages.length === 0`.
3. **Zero automated tests** in both backend and frontend.
4. **No `.env`/config layer** — CORS is `["*"]`, ports/URLs hardcoded.
5. **Bare `except Exception`** in `run_simulation` loop — failures silent.
6. **No validation** on village config updates — `soc` not clamped to 0–100, negative capacities accepted.
7. **No persistence** — all state in-memory, resets on restart.
