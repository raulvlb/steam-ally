#!/bin/bash

# ===========================================
# Steam Ally - Backend Setup Script
# ===========================================

set -e

echo "🚀 Steam Ally - Backend Setup"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Por favor, instale Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Node.js versão $NODE_VERSION detectada. Recomendado: 18+${NC}"
fi

echo -e "${GREEN}✓ Node.js $(node -v) detectado${NC}"

# Navigate to server directory
cd "$(dirname "$0")/server"

echo ""
echo "📦 Instalando dependências..."
npm install

# Check if .env exists
if [ ! -f ".env" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    echo "📝 Criando .env a partir do .env.example..."
    cp .env.example .env
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE: Configure as variáveis em server/.env antes de iniciar:${NC}"
    echo "   - DATABASE_URL: URL de conexão PostgreSQL"
    echo "   - JWT_SECRET: Chave secreta para tokens JWT"
    echo "   - STEAM_API_KEY: Sua Steam API Key"
    echo "   - FRONTEND_URL: URL do frontend"
    echo ""
else
    echo -e "${GREEN}✓ Arquivo .env encontrado${NC}"
fi

# Check if DATABASE_URL is configured
if grep -q "postgresql://username:password@localhost" .env 2>/dev/null; then
    echo ""
    echo -e "${YELLOW}⚠️  DATABASE_URL parece não estar configurado corretamente${NC}"
    echo "   Por favor, configure a URL do PostgreSQL em server/.env"
    echo ""
    echo "   Opções de banco de dados gratuitas:"
    echo "   - Neon: https://neon.tech"
    echo "   - Supabase: https://supabase.com"
    echo "   - Railway: https://railway.app"
    echo ""
fi

# Build TypeScript
echo ""
echo "🔨 Compilando TypeScript..."
npm run build

echo ""
echo -e "${GREEN}✅ Setup do backend concluído!${NC}"
echo ""
echo "📋 Próximos passos:"
echo "   1. Configure as variáveis em server/.env"
echo "   2. Execute as migrations: cd server && npm run migrate:dev"
echo "   3. Inicie o servidor: ./start-backend.sh"
echo ""
