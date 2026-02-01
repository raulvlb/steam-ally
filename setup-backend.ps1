# ===========================================
# Steam Ally - Backend Setup Script (PowerShell)
# ===========================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "[*] Steam Ally - Backend Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
$nodeVersion = $null
try {
    $nodeVersion = node -v 2>$null
}
catch {
    # Node not found
}

if ($nodeVersion) {
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($versionNumber -lt 18) {
        Write-Host "[!] Node.js versao $nodeVersion detectada. Recomendado: 18+" -ForegroundColor Yellow
    } else {
        Write-Host "[OK] Node.js $nodeVersion detectado" -ForegroundColor Green
    }
} else {
    Write-Host "[X] Node.js nao encontrado. Por favor, instale Node.js 18+" -ForegroundColor Red
    exit 1
}

# Navigate to server directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverPath = Join-Path $scriptPath "server"

if (-not (Test-Path $serverPath)) {
    Write-Host "[X] Diretorio 'server' nao encontrado" -ForegroundColor Red
    exit 1
}

Set-Location $serverPath

Write-Host ""
Write-Host "[*] Instalando dependencias..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Falha ao instalar dependencias" -ForegroundColor Red
    exit 1
}

# Check if .env exists
$envPath = Join-Path $serverPath ".env"
$envExamplePath = Join-Path $serverPath ".env.example"

if (-not (Test-Path $envPath)) {
    Write-Host ""
    Write-Host "[!] Arquivo .env nao encontrado" -ForegroundColor Yellow
    Write-Host "[*] Criando .env a partir do .env.example..." -ForegroundColor Cyan
    
    if (Test-Path $envExamplePath) {
        Copy-Item $envExamplePath $envPath
    } else {
        Write-Host "[X] Arquivo .env.example nao encontrado" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "[!] IMPORTANTE: Configure as variaveis em server\.env antes de iniciar:" -ForegroundColor Yellow
    Write-Host "   - DATABASE_URL: URL de conexao PostgreSQL" -ForegroundColor White
    Write-Host "   - JWT_SECRET: Chave secreta para tokens JWT" -ForegroundColor White
    Write-Host "   - STEAM_API_KEY: Sua Steam API Key" -ForegroundColor White
    Write-Host "   - FRONTEND_URL: URL do frontend" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "[OK] Arquivo .env encontrado" -ForegroundColor Green
}

# Check if DATABASE_URL is configured
$envContent = Get-Content $envPath -Raw -ErrorAction SilentlyContinue
if ($envContent -match "postgresql://username:password@localhost") {
    Write-Host ""
    Write-Host "[!] DATABASE_URL parece nao estar configurado corretamente" -ForegroundColor Yellow
    Write-Host "   Por favor, configure a URL do PostgreSQL em server\.env" -ForegroundColor White
    Write-Host ""
    Write-Host "   Opcoes de banco de dados gratuitas:" -ForegroundColor Cyan
    Write-Host "   - Neon: https://neon.tech" -ForegroundColor White
    Write-Host "   - Supabase: https://supabase.com" -ForegroundColor White
    Write-Host "   - Railway: https://railway.app" -ForegroundColor White
    Write-Host ""
}

# Build TypeScript
Write-Host ""
Write-Host "[*] Compilando TypeScript..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Falha ao compilar TypeScript" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[OK] Setup do backend concluido!" -ForegroundColor Green
Write-Host ""
Write-Host "[*] Proximos passos:" -ForegroundColor Cyan
Write-Host "   1. Configure as variaveis em server\.env" -ForegroundColor White
Write-Host "   2. Execute as migrations: cd server; npm run migrate:dev" -ForegroundColor White
Write-Host "   3. Inicie o servidor: .\start-backend.ps1" -ForegroundColor White
Write-Host ""
