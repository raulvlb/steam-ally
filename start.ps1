# ===========================================
# Steam Ally - Frontend Start Script (PowerShell)
# ===========================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "[*] Steam Ally - Starting Development Server" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
$envPath = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envPath)) {
    Write-Host "[X] .env file not found" -ForegroundColor Red
    Write-Host "Run .\setup.ps1 first or create .env manually" -ForegroundColor Yellow
    exit 1
}

# Check if Steam API Key is set
$envContent = Get-Content $envPath -Raw
if ($envContent -match "VITE_STEAM_API_KEY=YOUR_STEAM_API_KEY_HERE") {
    Write-Host "[!] Warning: Steam API Key not configured in .env" -ForegroundColor Yellow
    Write-Host "  The app will not work without a valid API key" -ForegroundColor Yellow
    Write-Host "  Get your key at: https://steamcommunity.com/dev/apikey" -ForegroundColor Yellow
    Write-Host ""
    
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -notmatch "^[Yy]$") {
        exit 1
    }
} else {
    Write-Host "[OK] Steam API Key appears to be configured" -ForegroundColor Green
}
Write-Host ""

# Check if node_modules exists
$nodeModulesPath = Join-Path $PSScriptRoot "node_modules"

if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Start development server
Write-Host "Starting Vite development server..." -ForegroundColor Blue
Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev
