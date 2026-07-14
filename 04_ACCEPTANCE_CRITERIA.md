# Acceptance Criteria — How the Agent Verifies Its Own Work

Before considering any numbered section of the main task prompt "done," verify the following concretely (run the command / check the file — don't just assert it in prose).

## Section 0 — Audit
- [ ] `AUDIT.md` exists and lists every error/mismatch found while exercising every control once.

## Section 1 — Backend fixes
- [ ] `backend/app/config.py` exists; `.env.example` exists; `app/main.py` reads CORS origins from config, not a hardcoded `"*"`.
- [ ] Sending an out-of-range value (e.g., `soc: 150`) to `PUT /api/villages/{id}` returns `422`, not `200`.
- [ ] Killing the WebSocket mid-broadcast doesn't crash the server process (check logs, not just "doesn't visibly fail").
- [ ] Restarting the backend process preserves prior village/transfer/alert state (persistence works).
- [ ] `GET /health` returns `model_loaded: true` when `lstm_model.h5` is present and loads successfully, `false` otherwise.

## Section 2 — LSTM integration
- [ ] `backend/ml/MODEL_CARD.md` documents actual confirmed input shape, output shape, feature list, and training metrics — not placeholders.
- [ ] `backend/ml/train.py` runs end-to-end and produces `lstm_model.h5` + `scaler.joblib` + `metrics.json` with real numeric MAE/RMSE/MAPE.
- [ ] `forecaster.py`'s model path uses the saved scaler (not a manual `* 0.1` fudge factor) and produces forecasts in real physical units (kW), not scaled/normalized values leaking into the API response.
- [ ] Deleting/renaming `lstm_model.h5` and restarting the backend causes a clean fallback to heuristic forecasting — verify by checking `/api/forecast` still returns valid data and `/health` reports `model_loaded: false`.
- [ ] Confidence values differ across villages/forecast horizons — not a hardcoded constant.

## Section 3 — Frontend / map
- [ ] With the backend stopped, the frontend shows an explicit "no data / connecting" state — not 5 fabricated demo villages with fake stats.
- [ ] The topology view renders on an actual map (visible OpenStreetMap/MapLibre tiles), with village markers at real lat/lng coordinates, not a synthetic SVG polygon layout.
- [ ] A visible UI element (label, badge, tooltip) indicates whether the current forecast is from `model` or `heuristic`.
- [ ] Reconnect works: kill and restart the backend while frontend is open; the frontend WebSocket reconnects (check Network tab) without requiring a manual page refresh.

## Section 4 — Testing
- [ ] `make test` (or documented equivalent) runs both backend `pytest` and frontend `vitest`/`jest` suites and exits 0 on a clean checkout.
- [ ] CI workflow file exists and is syntactically valid (`.github/workflows/ci.yml`); if you can't run GitHub Actions locally, at minimum validate YAML syntax and that the commands in it match `make test`.
- [ ] Every route in `02_API_CONTRACT.md`'s table has at least one passing test exercising a success case and one exercising an error case (404/422/400 as applicable).

## Section 5 — Metrics & benefit evidence
- [ ] `RESULTS.md` contains an actual table with real numbers for: LSTM MAE/RMSE/MAPE vs. naive-persistence baseline vs. heuristic baseline.
- [ ] `RESULTS.md` contains a second table comparing simulated 7-day run outcomes (LSTM-driven EMS vs. heuristic-driven EMS): total kWh shed, DEFICIT-minutes per village, emergency transfers triggered, average SOC.
- [ ] `RESULTS.md` reports actual measured p50/p95 latency numbers for forecast inference and WS broadcast — not estimates.
- [ ] At least one robustness test result (missing model file, malformed WS payload, invalid API payload) is logged with the observed behavior.

## Final submission check
- [ ] `README.md` updated: architecture section, API table, and feature list match current code exactly.
- [ ] Fresh clone + `make setup && make backend && make frontend-dev` works with no manual intervention beyond copying `.env.example` to `.env`.
- [ ] Git history shows one commit per section (per `01_CONTEXT_AND_CONSTRAINTS.md` conventions), not one giant commit.
- [ ] Nothing in `RESULTS.md`/`MODEL_CARD.md` is an unverified claim — every number traces to a file (`metrics.json`, a saved benchmark log, or test output) that also exists in the repo.
