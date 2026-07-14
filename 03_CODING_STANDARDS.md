# Coding Standards & Conventions

## Python (backend)

- Python 3.11+, type hints on all new function signatures.
- Formatting: `black` + `isort`; linting: `ruff`. Add both to `backend/requirements.txt` (dev group) and a `pyproject.toml` config if not present.
- Pydantic v2 models for all request/response bodies — no bare `dict` payloads for new endpoints.
- Use `logging` (module-level logger per file: `logger = logging.getLogger(__name__)`), never bare `print()` for anything added or touched going forward. Existing `print()` calls in touched files should be converted while you're in there; don't do a blanket repo-wide rewrite unrelated to your task.
- Async all the way: new I/O (DB, model inference if it becomes a bottleneck) should not block the event loop — use `asyncio.to_thread` for CPU-bound model inference calls if latency testing (Section 5 of task) shows blocking.
- No bare `except Exception: pass`/`print` — always log with context (which operation, which village/id) and either re-raise, return a typed error, or broadcast a WS `ERROR` message as specified in `02_API_CONTRACT.md`.
- File organization: keep the existing `app/{api,ai,data,ems,simulation}` structure; new modules (e.g., `app/config.py`, `app/db.py`) go at the `app/` level, not nested inside unrelated existing packages.

## TypeScript / React (frontend)

- Strict TypeScript — no new `any`; if a third-party type is missing, write a minimal local `.d.ts` instead of suppressing.
- Functional components + hooks only, consistent with existing code.
- Keep Zustand as the single source of truth for grid state (`useGridStore.ts`) — don't introduce a second state manager (e.g., Redux, Context-based duplication) for the same data.
- Component props: explicit `interface Props {...}`, no inline anonymous prop types for anything non-trivial.
- Styling: Tailwind utility classes consistent with existing dark theme; if you add a mapping library (react-leaflet/MapLibre), scope its CSS import to the component that needs it, don't add global overrides that could affect other components.
- Keep bundle size sane: prefer `maplibre-gl` (no token required) over `mapbox-gl` (requires an API key) unless the project already has a Mapbox token configured — a rural-India student project demo should not depend on a paid/keyed service.

## ML (backend/ml)

- Every training run must produce, at minimum: `lstm_model.h5`, `scaler.joblib`, `metrics.json` (with `mae`, `rmse`, `mape`, `train_size`, `test_size`, `trained_at` timestamp, `feature_list`, `seq_length`).
- Training script (`train.py`) must be deterministic where possible (`np.random.seed`, `tf.random.set_seed`) so results are reproducible for a viva demo.
- Never hardcode absolute file paths — use `pathlib.Path(__file__).parent` relative resolution, consistent with existing `forecaster.py` pattern (`os.path.dirname(__file__)`).

## Git / commit conventions

- One logical change per commit; commit message format: `<section>: <what changed>` e.g. `backend: add pydantic field validation to VillageUpdate`.
- Don't commit generated artifacts that are large binaries unless intentional (the `.h5` model file is already tracked — new scaler/metrics files are small and fine to track too; don't commit `node_modules`, `__pycache__`, `.venv`, training datasets downloaded from the UCI URL).
- Update `.gitignore` if new build/cache directories are introduced (e.g., `.pytest_cache/`, `coverage/`).

## Testing conventions

- Backend: `pytest` + `pytest-asyncio` for async routes/WebSocket tests, `httpx.AsyncClient` for API tests. Test files mirror source structure: `backend/tests/test_routes.py`, `backend/tests/test_forecaster.py`, `backend/tests/test_engine.py`.
- Frontend: `vitest` + `@testing-library/react`, colocated as `ComponentName.test.tsx` next to each component, or under `frontend/src/__tests__/`.
- Every bug fix must include a regression test that would have failed before the fix.
- Target coverage isn't a hard number here, but every new/changed function in `simulation/engine.py`, `ems/controller.py`, `ai/forecaster.py`, and every route in `routes.py` needs at least one direct test.

## Documentation conventions

- Any new module gets a top-of-file docstring/comment explaining its role, consistent with the existing style in `forecaster.py`/`preprocess.py`.
- `README.md` architecture diagram and API table must stay in sync with actual code — treat mismatches as bugs.
