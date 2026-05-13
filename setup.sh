#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Rural Microgrid Energy Management System - Setup"
echo "================================================="

# Check Python
echo -e "${BLUE}Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed"
    exit 1
fi
echo -e "${GREEN}Python $(python3 --version | awk '{print $2}')${NC}"

# Check Node.js
echo -e "${BLUE}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed"
    exit 1
fi
echo -e "${GREEN}Node.js $(node --version)${NC}"

# Backend setup
echo ""
echo -e "${BLUE}Setting up Backend...${NC}"
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
echo -e "${GREEN}Backend ready${NC}"

# Frontend setup
echo ""
echo -e "${BLUE}Setting up Frontend...${NC}"
cd ../frontend
npm install -q
echo -e "${GREEN}Frontend ready${NC}"

# Directories
cd ..
mkdir -p backend/ml/data logs

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next:${NC} make dev"
echo "Open: http://localhost:3000"
