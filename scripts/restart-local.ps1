<#
.SYNOPSIS
  Starts the entire RideNexa platform locally:
  - MySQL Database (Port 3307)
  - Python FastAPI ML Service (Port 8000)
  - Java Spring Boot API (Port 8081)
  - React + Vite Web App (Port 5173)
#>

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$apiPort = 8081
$mlPort = 8000
$databasePort = 3307
$frontendPort = 5173

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RideNexa End-to-End Platform Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Start MySQL Server (Port 3307)
$mysqlConfig = Join-Path $projectRoot 'database\local-my.cnf'
$mysqlExecutable = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe'

if (-not (Get-Process -Name "mysqld" -ErrorAction SilentlyContinue)) {
    if (-not (Test-Path -LiteralPath $mysqlExecutable)) {
        Write-Warning "MySQL was not found at $mysqlExecutable. Assuming Docker or system MySQL service."
    } else {
        Write-Host "Starting isolated MySQL Server on port $databasePort..." -ForegroundColor Yellow
        Start-Process -FilePath $mysqlExecutable -ArgumentList "--defaults-file=$mysqlConfig" -WindowStyle Hidden
        Start-Sleep -Seconds 2
    }
} else {
    Write-Host "MySQL Server is already running." -ForegroundColor Green
}

# 2. Start FastAPI ML Service (Port 8000)
$mlDir = Join-Path $projectRoot 'ml-service'
$mlVenvPython = Join-Path $mlDir '.venv\Scripts\python.exe'
$mlLog = Join-Path $mlDir 'ml.out.log'
$mlErr = Join-Path $mlDir 'ml.err.log'

if (Test-Path $mlVenvPython) {
    Write-Host "Starting FastAPI ML Recommendation Service on port $mlPort..." -ForegroundColor Yellow
    Start-Process -FilePath $mlVenvPython -ArgumentList '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', "$mlPort" -WorkingDirectory $mlDir -WindowStyle Hidden -RedirectStandardOutput $mlLog -RedirectStandardError $mlErr
} else {
    Write-Warning "ML virtual environment not found at $mlVenvPython. Run 'py -m venv .venv' inside ml-service to enable ML."
}

# 3. Start Spring Boot API (Port 8081)
$apiLog = Join-Path $projectRoot 'backend\ridenexa-api.out.log'
$apiError = Join-Path $projectRoot 'backend\ridenexa-api.err.log'

Write-Host "Starting Spring Boot Backend on port $apiPort..." -ForegroundColor Yellow
$env:BACKEND_PORT = "$apiPort"
$env:FRONTEND_ORIGIN = "http://localhost:$frontendPort"
Start-Process -FilePath 'mvn.cmd' -ArgumentList 'spring-boot:run' -WorkingDirectory (Join-Path $projectRoot 'backend') -WindowStyle Hidden -RedirectStandardOutput $apiLog -RedirectStandardError $apiError

# 4. Start Vite Frontend (Port 5173)
$webLog = Join-Path $projectRoot 'frontend\vite.out.log'
$webError = Join-Path $projectRoot 'frontend\vite.err.log'

Write-Host "Starting React + Vite Frontend on http://localhost:$frontendPort..." -ForegroundColor Yellow
Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'dev', '--', '--host', '127.0.0.1', '--port', "$frontendPort" -WorkingDirectory (Join-Path $projectRoot 'frontend') -WindowStyle Hidden -RedirectStandardOutput $webLog -RedirectStandardError $webError

Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "All RideNexa services initiated!" -ForegroundColor Green
Write-Host "  Web App:       http://localhost:$frontendPort" -ForegroundColor White
Write-Host "  Backend API:   http://localhost:$apiPort/api/v1/public/health" -ForegroundColor White
Write-Host "  ML Service:    http://localhost:$mlPort/health" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
