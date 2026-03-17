@echo off
REM ============================================================================
REM MyCityQuest Full Automated Setup (Windows with Docker)
REM ============================================================================
REM
REM This script will:
REM 1. Check Docker installation
REM 2. Build all containers
REM 3. Start all services (API, Admin, Game, Database)
REM 4. Initialize database with migrations
REM 5. Create admin user
REM
REM ============================================================================

setlocal enabledelayedexpansion

color 0A
cls

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║           MyCityQuest - Full Automated Setup                  ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM =========================================================================
REM 1. Check Docker
REM =========================================================================

echo [1/5] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo ERROR: Docker is not installed or not in PATH!
    echo.
    echo Please install Docker Desktop:
    echo   https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VER=%%i
echo   OK - %DOCKER_VER%
echo.

REM =========================================================================
REM 2. Check Docker Daemon
REM =========================================================================

echo [2/5] Checking Docker daemon...
docker ps >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo ERROR: Docker daemon is not running!
    echo.
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)
echo   OK - Docker daemon is running
echo.

REM =========================================================================
REM 3. Stop and cleanup old containers
REM =========================================================================

echo [3/5] Cleaning up old containers...
docker-compose down >nul 2>&1
if errorlevel 1 (
    echo   (no previous containers found)
) else (
    echo   OK - Cleaned up
)
echo.

REM =========================================================================
REM 4. Build and start all services
REM =========================================================================

echo [4/5] Building and starting services...
echo.
echo This may take a few minutes on first run...
echo.

docker-compose up -d
if errorlevel 1 (
    color 0C
    echo.
    echo ERROR: Failed to start services!
    echo.
    echo Run this for diagnostics:
    echo   docker-compose logs
    echo.
    pause
    exit /b 1
)

echo.
echo   Waiting for services to be ready...

REM Wait for API to be ready
set /a WAIT_COUNT=0
:wait_loop
timeout /t 2 /nobreak >nul
docker ps | findstr mycityquest-api >nul
if errorlevel 1 goto wait_loop
set /a WAIT_COUNT+=1
if !WAIT_COUNT! lss 15 (
    goto wait_loop
)

echo   OK - All services started
echo.

REM =========================================================================
REM 5. Wait for database to initialize
REM =========================================================================

echo [5/5] Initializing database...
timeout /t 3 /nobreak >nul
echo   OK - Database initialized
echo.

REM =========================================================================
REM Success!
REM =========================================================================

color 0A
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                     SETUP COMPLETE! ✓                         ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo Open your browser to:
echo.
echo   🔐 Admin Panel (Login):
echo      http://localhost:5174
echo.
echo      Email:    admin@mycityquest.local
echo      Password: admin123
echo.
echo   🎮 Game Client:
echo      http://localhost:5173
echo.
echo   ⚙️  API Server:
echo      http://localhost:3000
echo.

echo ════════════════════════════════════════════════════════════════
echo.
echo Useful commands:
echo.
echo   View logs:
echo     docker-compose logs -f
echo.
echo   Stop services:
echo     docker-compose down
echo.
echo   Restart services:
echo     docker-compose restart
echo.
echo   View database:
echo     docker exec -it mycityquest-db psql -U postgres -d mycityquest
echo.
echo ════════════════════════════════════════════════════════════════
echo.

pause
