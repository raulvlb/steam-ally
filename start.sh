#!/bin/bash

# Steam Ally - Start Script
# This script starts both frontend and backend development servers

echo "🎮 Steam Ally - Starting Development Servers"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if server .env file exists
if [ ! -f server/.env ]; then
    echo -e "${RED}✗ server/.env file not found${NC}"
    echo -e "${YELLOW}Run ./setup.sh first${NC}"
    exit 1
fi

# Check if DATABASE_URL is configured
if grep -q "postgresql://username:password@localhost:5432/steam_ally" server/.env; then
    echo -e "${RED}✗ DATABASE_URL not configured in server/.env${NC}"
    echo -e "${YELLOW}Please update server/.env with your PostgreSQL connection string${NC}"
    exit 1
fi

# Check if STEAM_API_KEY is configured
if grep -q "your-steam-api-key-here" server/.env; then
    echo -e "${YELLOW}⚠ Warning: STEAM_API_KEY not configured in server/.env${NC}"
    echo -e "${YELLOW}  Get your key at: https://steamcommunity.com/dev/apikey${NC}"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Frontend node_modules not found. Running setup...${NC}"
    ./setup.sh
    echo ""
fi

if [ ! -d "server/node_modules" ]; then
    echo -e "${YELLOW}Backend node_modules not found. Installing...${NC}"
    cd server && npm install && cd ..
    echo ""
fi

echo -e "${GREEN}✓ Configuration verified${NC}"
echo ""

# Start backend server in background
echo -e "${BLUE}Starting backend server on port 3001...${NC}"
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend server
echo -e "${BLUE}Starting frontend server on port 3000...${NC}"
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}Backend:  http://localhost:3001${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Trap to kill backend when frontend stops
trap "kill $BACKEND_PID 2>/dev/null" EXIT

npm run dev
