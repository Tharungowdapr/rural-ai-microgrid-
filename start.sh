#!/bin/bash
set -e

echo "Starting Rural Microgrid Energy Management System..."
echo ""

# Check if setup has been done
if [ ! -d "backend/venv" ]; then
    echo "Running setup first..."
    bash setup.sh
fi

# Start backend in background
echo "Starting backend on http://localhost:8000..."
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend
echo "Starting frontend on http://localhost:3000..."
cd frontend
node node_modules/next/dist/bin/next dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"

# Trap Ctrl+C and kill both processes
trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Wait for background processes
wait
