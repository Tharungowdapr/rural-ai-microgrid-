.PHONY: help setup backend frontend-dev build clean kill-all test test-backend test-frontend lint format

help:
	@echo "Rural AI Microgrid"
	@echo ""
	@echo "Commands:"
	@echo "  make setup           Install all dependencies"
	@echo "  make backend         Start backend (port 8000)"
	@echo "  make frontend-dev    Start frontend (port 3000)"
	@echo "  make build           Build frontend for production"
	@echo "  make test            Run all tests (backend + frontend)"
	@echo "  make test-backend    Run backend tests only"
	@echo "  make test-frontend   Run frontend tests only"
	@echo "  make lint            Run linters (ruff + eslint)"
	@echo "  make format          Auto-format code (black + isort)"
	@echo "  make kill-all        Stop all processes"
	@echo "  make clean           Remove build caches"
	@echo ""
	@echo "Quick Start:"
	@echo "  1. cp .env.example .env"
	@echo "  2. make setup"
	@echo "  3. make backend &"
	@echo "  4. make frontend-dev"
	@echo "  5. Open http://localhost:3000"

setup:
	@echo "Installing dependencies..."
	@cd backend && python3 -m venv venv 2>/dev/null || true
	@cd backend && . venv/bin/activate && pip install -q -r requirements.txt
	@cd frontend && npm install --prefer-offline 2>/dev/null || npm install
	@echo "Setup complete — copy .env.example to .env if not done"

backend:
	@cd backend && . venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

frontend-dev:
	@sleep 2 && cd frontend && node node_modules/next/dist/bin/next dev

build:
	@cd frontend && node node_modules/next/dist/bin/next build

test: test-backend test-frontend

test-backend:
	@cd backend && . venv/bin/activate && python -m pytest tests/ -v --tb=short

test-frontend:
	@cd frontend && npx vitest run --reporter=verbose

lint:
	@cd backend && . venv/bin/activate && ruff check app/ ml/ tests/
	@cd frontend && npx next lint

format:
	@cd backend && . venv/bin/activate && black app/ ml/ tests/ && isort app/ ml/ tests/

clean:
	@rm -rf frontend/.next frontend/node_modules/.cache
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true

kill-all:
	@pkill -f uvicorn 2>/dev/null || true
	@pkill -f "next dev" 2>/dev/null || true
	@echo "All processes stopped"

.DEFAULT_GOAL := help
