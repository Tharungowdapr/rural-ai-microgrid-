# Context & Constraints

Read this before touching any code. It exists so the agent doesn't have to re-derive project intent from scratch or make silent assumptions that conflict with how this project will be graded/demoed.

## What this project is

A student AIM (AI/ML) project: a simulated decentralized rural microgrid (5 villages) with solar generation, batteries, mesh power-sharing, an EMS (Energy Management System) controller, and an LSTM-based demand/generation forecaster. Backend: FastAPI + WebSocket. Frontend: Next.js 14 + TypeScript + Zustand + Recharts. There is no real hardware — everything is simulated, but the AI forecasting and the engineering practice around it (testing, metrics, validation) must be real and defensible in a viva/demo.

## Non-negotiable constraints

1. **Don't break the dev loop.** `make setup`, `make backend`, `make frontend-dev` must keep working after every change. If a command's behavior changes, update the `Makefile` and `README.md` in the same commit.
2. **No breaking API/WebSocket contract changes without updating both sides.** If you change a response shape in `routes.py` or the `VILLAGES_UPDATE`/`INIT_DATA` WebSocket messages, update `useGridStore.ts`/`useWebSocket.ts` and any TypeScript types in the same commit. See `02_API_CONTRACT.md` for the shapes to preserve or intentionally evolve.
3. **Keep the heuristic fallback.** The LSTM must never be a hard dependency that crashes the app if the model file is missing/corrupted — `forecaster.py` must always degrade gracefully to the heuristic path, and the UI must visibly indicate which path is active (see main task prompt, Section 3).
4. **No secrets committed.** API keys, DB credentials, etc. go in `.env` (gitignored) with a checked-in `.env.example`.
5. **India-context theming stays.** Existing project framing (SEBI/RBI-adjacent rural-India setting, village names, etc.) should be preserved/extended, not replaced with a generic/US-default setting, since it's part of the existing project identity.
6. **Prefer boring, well-supported libraries** over cutting-edge ones for anything grading depends on (e.g., `react-leaflet`/MapLibre over an exotic mapping lib, `pytest`/`vitest` over niche test runners) — an examiner should be able to `git clone` and run this without exotic setup steps.
7. **Every change that touches the model or metrics must produce an artifact**, not just a claim: a saved `metrics.json`, a `MODEL_CARD.md`, or a `RESULTS.md` entry with actual numbers from an actual run. Do not write summary prose asserting improvement without a corresponding logged number.
8. **Commit granularity:** one commit per numbered section of the task prompt, with a message summarizing what changed and why. Don't squash everything into one commit — the commit history is part of what demonstrates process for an academic submission.

## Definitions used throughout (keep consistent)

- **Village states:** `SURPLUS` (generation > demand + 50kW), `BALANCED` (SOC 50–100%), `WARNING` (SOC 30–50%), `DEFICIT` (SOC < 30%) — as already defined in `README.md`. Don't invent a fifth state without updating the README table and the frontend color legend together.
- **"Model path" vs "heuristic path":** whenever forecaster logic is discussed, always be explicit about which one produced a given number — this distinction is central to the AIM grading story.
- **"Forecast" vs "prediction":** used interchangeably in this project; no need to unify, but don't introduce a third term.

## Explicit non-goals (don't do these unless separately asked)

- Do not build real hardware/IoT integration — this stays a simulation.
- Do not add user authentication/multi-tenancy beyond the basic auth mentioned as an optional future-work item.
- Do not migrate off Next.js/FastAPI to a different framework.
- Do not attempt to source real rural-India smart-grid datasets — the UCI Appliances Energy Prediction dataset already used in `preprocess.py` is the accepted data source; keep using it unless told otherwise.
