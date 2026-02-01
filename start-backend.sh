#!/bin/bash

# ===========================================
# Steam Ally - Backend Start Script
# ===========================================

set -e

echo "🚀 Steam Ally - Backend Server"
echo "==============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Navigate to server directory
cd "$(dirname "$0")/server"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependências não instaladas. Execute ./setup-backend.sh primeiro${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado${NC}"
    echo "   Execute ./setup-backend.sh para criar o arquivo .env"
    exit 1
fi

# Load environment variables for display
source .env 2>/dev/null || true

# Check required environment variables
MISSING_VARS=0

if [ -z "$DATABASE_URL" ] || [[ "$DATABASE_URL" == *"username:password"* ]]; then
    echo -e "${RED}❌ DATABASE_URL não configurado${NC}"
    MISSING_VARS=1
fi

if [ -z "$JWT_SECRET" ] || [[ "$JWT_SECRET" == *"change-in-production"* ]]; then
    echo -e "${YELLOW}⚠️  JWT_SECRET usando valor padrão (não recomendado para produção)${NC}"
fi

if [ -z "$STEAM_API_KEY" ] || [[ "$STEAM_API_KEY" == *"your-steam"* ]]; then
    echo -e "${RED}❌ STEAM_API_KEY não configurado${NC}"
    MISSING_VARS=1
fi

if [ $MISSING_VARS -eq 1 ]; then
    echo ""
    echo -e "${RED}Por favor, configure as variáveis obrigatórias em server/.env${NC}"
    exit 1
fi

# Determine mode (dev or production)
MODE="${1:-dev}"

echo -e "${CYAN}📍 Modo: $MODE${NC}"
echo -e "${CYAN}🌐 Frontend URL: ${FRONTEND_URL:-http://localhost:3000}${NC}"
echo -e "${CYAN}🔌 Porta: ${PORT:-3001}${NC}"
echo ""

if [ "$MODE" == "prod" ] || [ "$MODE" == "production" ]; then
    # Production mode - run compiled JavaScript
    if [ ! -d "dist" ]; then
        echo "🔨 Compilando TypeScript..."
        npm run build
    fi
    
    echo -e "${GREEN}▶ Iniciando servidor em modo produção...${NC}"
    echo ""
    npm start
else
    # Development mode - run with tsx (hot reload)
    echo -e "${GREEN}▶ Iniciando servidor em modo desenvolvimento...${NC}"
    echo ""
    npm run dev
fi
