# ===========================================
# Steam Ally - Frontend Setup Script (PowerShell)
# ===========================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "[*] Steam Ally - Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Blue

$nodeVersion = $null
try {
    $nodeVersion = node -v 2>$null
}
catch {
    # Node not found
}

if ($nodeVersion) {
    Write-Host "[OK] Node.js $nodeVersion found" -ForegroundColor Green
} else {
    Write-Host "Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Check if npm is installed
$npmVersion = $null
try {
    $npmVersion = npm -v 2>$null
}
catch {
    # npm not found
}

if ($npmVersion) {
    Write-Host "[OK] npm $npmVersion found" -ForegroundColor Green
} else {
    Write-Host "npm is not installed. Please install npm first." -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Blue
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to install dependencies" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Create .env file if it doesn't exist
$envPath = Join-Path $PSScriptRoot ".env"
$envExamplePath = Join-Path $PSScriptRoot ".env.example"

if (-not (Test-Path $envPath)) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Blue
    
    if (Test-Path $envExamplePath) {
        Copy-Item $envExamplePath $envPath
        Write-Host "[OK] .env file created" -ForegroundColor Green
        Write-Host "[!] Please edit .env and add your Steam API Key" -ForegroundColor Yellow
        Write-Host "   Get your key at: https://steamcommunity.com/dev/apikey" -ForegroundColor Yellow
    } else {
        Write-Host "[!] .env.example not found. Creating empty .env file..." -ForegroundColor Yellow
        New-Item -ItemType File -Path $envPath | Out-Null
    }
} else {
    Write-Host "[OK] .env file already exists" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "================================" -ForegroundColor Green
Write-Host "[OK] Setup completed successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "1. Edit .env file and add your Steam API Key"
Write-Host "2. Run: .\start.ps1 (or npm run dev)"
Write-Host "3. Open: http://localhost:3000"
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Blue
Write-Host "  npm run dev      - Start development server"
Write-Host "  npm run build    - Build for production"
Write-Host "  npm run preview  - Preview production build"
Write-Host "  npm run lint     - Run ESLint"
Write-Host "  npm run format   - Format code with Prettier"
Write-Host ""
Write-Host "Happy coding!" -ForegroundColor Green
