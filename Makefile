.PHONY: help setup dev backend frontend build clean kill-all

help:
	@echo "Rural AI Microgrid"
	@echo ""
	@echo "Commands:"
	@echo "  make setup           Install all dependencies"
	@echo "  make backend         Start backend (port 8000)"
	@echo "  make frontend-dev    Start frontend (port 3000)"
	@echo "  make build           Build frontend for production"
	@echo "  make kill-all        Stop all processes"
	@echo "  make clean           Remove build caches"
	@echo ""
	@echo "Quick Start:"
	@echo "  1. make setup"
	@echo "  2. make backend &"
	@echo "  3. make frontend-dev"
	@echo "  4. Open http://localhost:3000"

setup:
	@echo "Installing dependencies..."
	@cd backend && python3 -m venv venv 2>/dev/null || true
	@cd backend && . venv/bin/activate && pip install -q -r requirements.txt
	@cd frontend && npm install --prefer-offline 2>/dev/null || npm install
	@echo "Setup complete"

backend:
	@cd backend && . venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

frontend-dev:
	@sleep 2 && cd frontend && node node_modules/next/dist/bin/next dev

build:
	@cd frontend && node node_modules/next/dist/bin/next build

clean:
	@rm -rf frontend/.next frontend/node_modules/.cache
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

kill-all:
	@pkill -f uvicorn 2>/dev/null || true
	@pkill -f "next dev" 2>/dev/null || true
	@echo "All processes stopped"

.DEFAULT_GOAL := help
