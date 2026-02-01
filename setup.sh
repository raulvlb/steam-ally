#!/bin/bash

# Steam Ally - Setup Script
# This script sets up both frontend and backend

set -e  # Exit on error

echo "🎮 Steam Ally - Setup Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${BLUE}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} found${NC}"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm first.${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm ${NPM_VERSION} found${NC}"
echo ""

# Install frontend dependencies
echo -e "${BLUE}Installing frontend dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${RED}Failed to install frontend dependencies${NC}"
    exit 1
fi
echo ""

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd server
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${RED}Failed to install backend dependencies${NC}"
    exit 1
fi
cd ..
echo ""

# Create .env files if they don't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    echo "VITE_API_URL=http://localhost:3001" > .env
    echo -e "${GREEN}✓ Frontend .env created${NC}"
fi

if [ ! -f server/.env ]; then
    echo -e "${YELLOW}Creating backend .env file from example...${NC}"
    cp server/.env.example server/.env
    echo -e "${GREEN}✓ Backend .env created from .env.example${NC}"
    echo -e "${YELLOW}⚠ IMPORTANT: Edit server/.env with your actual values:${NC}"
    echo -e "${YELLOW}  - DATABASE_URL: Your PostgreSQL connection string${NC}"
    echo -e "${YELLOW}  - JWT_SECRET: A secure random string${NC}"
    echo -e "${YELLOW}  - STEAM_API_KEY: Get from https://steamcommunity.com/dev/apikey${NC}"
fi
echo ""

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ Setup complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Configure server/.env with your database and API keys"
echo "2. Run database migrations: cd server && npm run migrate:dev"
echo "3. Start the app: ./start.sh"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${BLUE}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please edit .env and add your Steam API Key${NC}"
    echo -e "${YELLOW}   Get your key at: https://steamcommunity.com/dev/apikey${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi
echo ""

# Make start.sh executable
if [ -f start.sh ]; then
    chmod +x start.sh
    echo -e "${GREEN}✓ start.sh is now executable${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ Setup completed successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Edit .env file and add your Steam API Key"
echo "2. Run: ./start.sh (or npm run dev)"
echo "3. Open: http://localhost:3000"
echo ""
echo -e "${BLUE}Available commands:${NC}"
echo "  npm run dev      - Start development server"
echo "  npm run build    - Build for production"
echo "  npm run preview  - Preview production build"
echo "  npm run lint     - Run ESLint"
echo "  npm run format   - Format code with Prettier"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
