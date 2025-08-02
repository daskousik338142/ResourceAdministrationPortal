# Resource Management Portal Setup Script
# This script helps you set up and run the Resource Management Portal

param(
    [Parameter()]
    [ValidateSet('setup', 'dev', 'build', 'start')]
    [string]$Action = 'setup'
)

function Write-Header {
    param([string]$Text)
    Write-Host "`n" -NoNewline
    Write-Host "="*60 -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Yellow
    Write-Host "="*60 -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Text)
    Write-Host "`n✓ " -NoNewline -ForegroundColor Green
    Write-Host $Text -ForegroundColor White
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ " -NoNewline -ForegroundColor Blue
    Write-Host $Text -ForegroundColor Gray
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ " -NoNewline -ForegroundColor Green
    Write-Host $Text -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "❌ " -NoNewline -ForegroundColor Red
    Write-Host $Text -ForegroundColor Red
}

function Test-NodeJS {
    try {
        $nodeVersion = node --version
        Write-Success "Node.js is installed: $nodeVersion"
        return $true
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js from https://nodejs.org/"
        return $false
    }
}

function Install-Dependencies {
    Write-Header "Installing Dependencies"
    
    # Install root dependencies for concurrently
    Write-Step "Installing root dependencies..."
    npm install
    
    # Install backend dependencies
    Write-Step "Installing backend dependencies..."
    Set-Location "backend"
    npm install
    Set-Location ".."
    
    # Install frontend dependencies
    Write-Step "Installing frontend dependencies..."
    Set-Location "frontend"
    npm install
    Set-Location ".."
    
    Write-Success "All dependencies installed successfully!"
}

function Start-Development {
    Write-Header "Starting Development Environment"
    Write-Info "Starting both backend and frontend servers..."
    Write-Info "Backend will run on: http://localhost:5000"
    Write-Info "Frontend will run on: http://localhost:3000"
    Write-Info "Press Ctrl+C to stop both servers"
    
    npm run dev
}

function Build-Frontend {
    Write-Header "Building Frontend for Production"
    Set-Location "frontend"
    npm run build
    Set-Location ".."
    Write-Success "Frontend built successfully!"
}

function Start-Production {
    Write-Header "Starting Production Environment"
    Write-Step "Starting backend server..."
    Set-Location "backend"
    Start-Process -NoNewWindow -FilePath "node" -ArgumentList "server.js"
    Set-Location ".."
    Write-Info "Backend started on http://localhost:5000"
    Write-Info "Make sure to serve the frontend build folder with a web server"
}

function Show-Help {
    Write-Header "Resource Management Portal - Setup Script"
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\setup.ps1 [action]" -ForegroundColor White
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Yellow
    Write-Host "  setup   - Install all dependencies (default)" -ForegroundColor White
    Write-Host "  dev     - Start development environment" -ForegroundColor White
    Write-Host "  build   - Build frontend for production" -ForegroundColor White
    Write-Host "  start   - Start production environment" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\setup.ps1           # Install dependencies" -ForegroundColor Gray
    Write-Host "  .\setup.ps1 dev       # Start development" -ForegroundColor Gray
    Write-Host "  .\setup.ps1 build     # Build for production" -ForegroundColor Gray
    Write-Host ""
}

# Main execution
Clear-Host
Write-Header "Resource Management Portal"

# Check if Node.js is installed
if (-not (Test-NodeJS)) {
    exit 1
}

switch ($Action) {
    'setup' {
        Install-Dependencies
        Write-Host ""
        Write-Info "Setup complete! Next steps:"
        Write-Host "  1. Run './setup.ps1 dev' to start development environment" -ForegroundColor Gray
        Write-Host "  2. Open http://localhost:3000 in your browser" -ForegroundColor Gray
        Write-Host "  3. Create an account and start managing resources!" -ForegroundColor Gray
    }
    
    'dev' {
        Start-Development
    }
    
    'build' {
        Build-Frontend
    }
    
    'start' {
        Start-Production
    }
    
    default {
        Show-Help
    }
}

Write-Host ""
