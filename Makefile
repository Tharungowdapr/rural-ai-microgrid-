.PHONY: help setup dev backend frontend build clean install logs test kill-all

# Default target
help:
	@echo "🏗️  Rural Microgrid Energy Management System"
	@echo "============================================="
	@echo ""
	@echo "Available Commands:"
	@echo ""
	@echo "  make setup          - Install all dependencies"
	@echo "  make dev            - Run frontend & backend locally"
	@echo "  make backend        - Run backend only (localhost:8000)"
	@echo "  make frontend       - Run frontend only (localhost:3000)"
	@echo "  make build          - Build frontend for production"
	@echo "  make install        - Install/update dependencies"
	@echo "  make logs           - Show system logs"
	@echo "  make clean          - Clean build files & caches"
	@echo "  make kill-all       - Stop all running processes"
	@echo ""
	@echo "Quick Start:"
	@echo "  1. make setup       # First time setup"
	@echo "  2. make dev         # Run everything"
	@echo "  3. Open http://localhost:3000"
	@echo ""

# Setup: Install all dependencies
setup:
	@echo "🚀 Running setup..."
	@bash setup.sh
	@echo "✅ Setup complete!"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	@cd backend && python3 -m venv venv 2>/dev/null || true
	@cd backend && . venv/bin/activate && pip install -q -r requirements.txt
	@cd frontend && npm install -q
	@echo "✅ Dependencies installed!"

# Run backend and frontend concurrently
dev:
	@echo "🌐 Starting development environment..."
	@echo "📍 Backend: http://localhost:8000"
	@echo "📍 Frontend: http://localhost:3000"
	@echo "📍 Docs: http://localhost:8000/docs"
	@echo ""
	@echo "Press Ctrl+C to stop"
	@echo ""
	@mkdir -p logs
	@$(MAKE) -j2 backend-dev frontend-dev

# Run backend server (development mode with auto-reload)
backend-dev:
	@cd backend && \
	. venv/bin/activate && \
	python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run backend server (production)
backend:
	@cd backend && \
	. venv/bin/activate && \
	python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Run frontend development server
frontend-dev:
	@sleep 2 && cd frontend && node node_modules/next/dist/bin/next dev

# Run frontend production build
frontend:
	@cd frontend && node node_modules/next/dist/bin/next build && node node_modules/next/dist/bin/next start

# Build frontend for production
build:
	@echo "🏗️  Building frontend for production..."
	@cd frontend && node node_modules/next/dist/bin/next build
	@echo "✅ Build complete! Output in ./frontend/.next"

# Clean build artifacts and caches
clean:
	@echo "🧹 Cleaning up..."
	@rm -rf frontend/.next
	@rm -rf frontend/node_modules/.cache
	@rm -rf backend/__pycache__
	@rm -rf backend/.pytest_cache
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Cleanup complete!"

# Show logs
logs:
	@tail -f logs/*.log 2>/dev/null || echo "No logs yet"

# Kill all running processes
kill-all:
	@echo "🛑 Stopping all processes..."
	@pkill -f "uvicorn" || true
	@pkill -f "next dev" || true
	@pkill -f "next dev" || true
	@echo "✅ All processes stopped"

# Docker targets
docker-build:
	@echo "🐳 Building Docker images..."
	@docker-compose build

docker-up:
	@echo "🐳 Starting Docker containers..."
	@docker-compose up -d
	@echo "✅ Containers started"
	@echo "📍 Frontend: http://localhost:3000"
	@echo "📍 Backend: http://localhost:8000"

docker-down:
	@echo "🛑 Stopping Docker containers..."
	@docker-compose down

docker-logs:
	@docker-compose logs -f

# Database/ML model targets
download-model:
	@echo "📥 Downloading LSTM model..."
	@mkdir -p ml
	@echo "✓ Model already included in repository"

train-model:
	@echo "🤖 Training LSTM model..."
	@cd backend && . venv/bin/activate && python ../ml/train_lstm.py
	@echo "✅ Model training complete!"

# Development utilities
lint:
	@echo "🔍 Running linter..."
	@cd frontend && npm run lint
	@echo "✅ Lint complete!"

format:
	@echo "📝 Formatting code..."
	@cd frontend && npm run format 2>/dev/null || true
	@echo "✅ Format complete!"

# All-in-one commands
reset: clean install
	@echo "✅ Project reset complete"

fresh: reset dev
	@echo "✅ Fresh start complete"

.DEFAULT_GOAL := help
