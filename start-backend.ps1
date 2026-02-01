# ===========================================
# Steam Ally - Backend Start Script (PowerShell)
# ===========================================

param(
    [string]$Mode = "dev"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "[*] Steam Ally - Backend Server" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Navigate to server directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverPath = Join-Path $scriptPath "server"

if (-not (Test-Path $serverPath)) {
    Write-Host "[X] Diretorio 'server' nao encontrado" -ForegroundColor Red
    exit 1
}

Set-Location $serverPath

# Check if node_modules exists
$nodeModulesPath = Join-Path $serverPath "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "[!] Dependencias nao instaladas. Execute .\setup-backend.ps1 primeiro" -ForegroundColor Yellow
    exit 1
}

# Check if .env exists
$envPath = Join-Path $serverPath ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "[X] Arquivo .env nao encontrado" -ForegroundColor Red
    Write-Host "   Execute .\setup-backend.ps1 para criar o arquivo .env" -ForegroundColor White
    exit 1
}

# Load and check environment variables
$envContent = Get-Content $envPath
$envVars = @{}

foreach ($line in $envContent) {
    if ($line -match "^\s*([^#][^=]+)=(.*)$") {
        $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
}

$missingVars = $false

# Check DATABASE_URL
if (-not $envVars["DATABASE_URL"] -or $envVars["DATABASE_URL"] -match "username:password") {
    Write-Host "[X] DATABASE_URL nao configurado" -ForegroundColor Red
    $missingVars = $true
}

# Check JWT_SECRET
if (-not $envVars["JWT_SECRET"] -or $envVars["JWT_SECRET"] -match "change-in-production") {
    Write-Host "[!] JWT_SECRET usando valor padrao (nao recomendado para producao)" -ForegroundColor Yellow
}

# Check STEAM_API_KEY
if (-not $envVars["STEAM_API_KEY"] -or $envVars["STEAM_API_KEY"] -match "your-steam") {
    Write-Host "[X] STEAM_API_KEY nao configurado" -ForegroundColor Red
    $missingVars = $true
}

if ($missingVars) {
    Write-Host ""
    Write-Host "Por favor, configure as variaveis obrigatorias em server\.env" -ForegroundColor Red
    exit 1
}

# Display configuration
$frontendUrl = if ($envVars["FRONTEND_URL"]) { $envVars["FRONTEND_URL"] } else { "http://localhost:3000" }
$port = if ($envVars["PORT"]) { $envVars["PORT"] } else { "3001" }

Write-Host "[*] Modo: $Mode" -ForegroundColor Cyan
Write-Host "[*] Frontend URL: $frontendUrl" -ForegroundColor Cyan
Write-Host "[*] Porta: $port" -ForegroundColor Cyan
Write-Host ""

if ($Mode -eq "prod" -or $Mode -eq "production") {
    # Production mode - run compiled JavaScript
    $distPath = Join-Path $serverPath "dist"
    if (-not (Test-Path $distPath)) {
        Write-Host "[*] Compilando TypeScript..." -ForegroundColor Cyan
        npm run build
    }
    
    Write-Host "[>] Iniciando servidor em modo producao..." -ForegroundColor Green
    Write-Host ""
    npm start
} else {
    # Development mode - run with tsx (hot reload)
    Write-Host "[>] Iniciando servidor em modo desenvolvimento..." -ForegroundColor Green
    Write-Host ""
    npm run dev
}
