@echo off
REM ============================================================================
REM MyCityQuest Development Setup (Windows)
REM ============================================================================

echo.
echo =========================================
echo MyCityQuest Development Setup (Windows)
echo =========================================
echo.

REM 1. Проверка Docker
echo Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed!
    echo Download: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM 2. Проверка Node
echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node -v') do set NODE_VER=%%i
echo   %NODE_VER% OK

REM 3. Запуск PostgreSQL контейнера
echo.
echo Starting PostgreSQL container...
docker ps -a | findstr mycityquest-postgres-dev >nul
if errorlevel 1 (
    docker run -d ^
      --name mycityquest-postgres-dev ^
      -e POSTGRES_PASSWORD=postgres ^
      -p 5432:5432 ^
      postgres:16
    timeout /t 3 /nobreak
) else (
    echo (container already running)
)

REM 4. API Setup
echo.
echo Installing API dependencies...
cd api
call npm install
echo Running migrations...
call npm run db:migrate
echo Creating admin user...
call npm run admin:create -- --email admin@mycityquest.local --password admin123
cd ..

REM 5. Admin Setup
echo.
echo Installing Admin dependencies...
cd admin
call npm install
cd ..

REM 6. Game Setup
echo.
echo Installing Game dependencies...
cd game
call npm install
cd ..

REM 7. Итоговые инструкции
echo.
echo =========================================
echo SUCCESS! Setup complete.
echo =========================================
echo.
echo Open 3 NEW terminal windows and run:
echo.
echo 1. API (port 3000):
echo    cd api ^&^& npm run dev
echo.
echo 2. Admin (port 5174):
echo    cd admin ^&^& npm run dev
echo    Login: admin@mycityquest.local / admin123
echo.
echo 3. Game (port 5173):
echo    cd game ^&^& npm run dev
echo.
echo Stop database: docker stop mycityquest-postgres-dev
echo Delete database: docker rm mycityquest-postgres-dev
echo.
pause
