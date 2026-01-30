#!/bin/bash

# Steam Ally - Start Script
# This script starts the development server

set -e  # Exit on error

echo "🎮 Steam Ally - Starting Development Server"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}✗ .env file not found${NC}"
    echo -e "${YELLOW}Run ./setup.sh first or create .env manually${NC}"
    exit 1
fi

# Check if Steam API Key is set
if ! grep -q "VITE_STEAM_API_KEY=YOUR_STEAM_API_KEY_HERE" .env; then
    echo -e "${GREEN}✓ Steam API Key appears to be configured${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Steam API Key not configured in .env${NC}"
    echo -e "${YELLOW}  The app will not work without a valid API key${NC}"
    echo -e "${YELLOW}  Get your key at: https://steamcommunity.com/dev/apikey${NC}"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules not found. Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Start development server
echo -e "${BLUE}Starting Vite development server...${NC}"
echo -e "${GREEN}Server will be available at: http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

npm run dev
