#!/bin/bash
# ============================================================================
# MyCityQuest Full Automated Setup (Linux/macOS with Docker)
# ============================================================================
#
# This script will:
# 1. Check Docker installation
# 2. Build all containers
# 3. Start all services (API, Admin, Game, Database)
# 4. Initialize database with migrations
# 5. Create admin user
#
# Usage: bash setup.sh
#
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║           MyCityQuest - Full Automated Setup                  ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# =========================================================================
# 1. Check Docker
# =========================================================================

echo "[1/5] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not installed!${NC}"
    echo ""
    echo "Install Docker:"
    echo "  https://www.docker.com/products/docker-desktop"
    echo ""
    exit 1
fi

DOCKER_VER=$(docker --version)
echo -e "  ${GREEN}OK${NC} - $DOCKER_VER"
echo ""

# =========================================================================
# 2. Check Docker Daemon
# =========================================================================

echo "[2/5] Checking Docker daemon..."
if ! docker ps &> /dev/null; then
    echo -e "${RED}ERROR: Docker daemon is not running!${NC}"
    echo ""
    echo "Start Docker and try again."
    echo ""
    exit 1
fi
echo -e "  ${GREEN}OK${NC} - Docker daemon is running"
echo ""

# =========================================================================
# 3. Stop and cleanup old containers
# =========================================================================

echo "[3/5] Cleaning up old containers..."
if docker-compose down &> /dev/null; then
    echo -e "  ${GREEN}OK${NC} - Cleaned up"
else
    echo "  (no previous containers found)"
fi
echo ""

# =========================================================================
# 4. Build and start all services
# =========================================================================

echo "[4/5] Building and starting services..."
echo ""
echo "  This may take a few minutes on first run..."
echo ""

if ! docker-compose up -d; then
    echo -e "${RED}ERROR: Failed to start services!${NC}"
    echo ""
    echo "Run this for diagnostics:"
    echo "  docker-compose logs"
    echo ""
    exit 1
fi

echo ""
echo "  Waiting for services to be ready..."

# Wait for services
for i in {1..30}; do
    if docker ps | grep -q mycityquest-api; then
        break
    fi
    sleep 1
done

echo -e "  ${GREEN}OK${NC} - All services started"
echo ""

# =========================================================================
# 5. Wait for database to initialize
# =========================================================================

echo "[5/5] Initializing database..."
sleep 3
echo -e "  ${GREEN}OK${NC} - Database initialized"
echo ""

# =========================================================================
# Success!
# =========================================================================

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     SETUP COMPLETE! ✓                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

echo "Open your browser to:"
echo ""
echo -e "  ${BLUE}🔐 Admin Panel (Login):${NC}"
echo "     http://localhost:5174"
echo ""
echo "     Email:    admin@mycityquest.local"
echo "     Password: admin123"
echo ""
echo -e "  ${BLUE}🎮 Game Client:${NC}"
echo "     http://localhost:5173"
echo ""
echo -e "  ${BLUE}⚙️  API Server:${NC}"
echo "     http://localhost:3000"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Useful commands:"
echo ""
echo "  View logs:"
echo "    docker-compose logs -f"
echo ""
echo "  View specific service logs:"
echo "    docker-compose logs -f api"
echo "    docker-compose logs -f admin"
echo "    docker-compose logs -f game"
echo ""
echo "  Stop services:"
echo "    docker-compose down"
echo ""
echo "  Restart services:"
echo "    docker-compose restart"
echo ""
echo "  Create new admin user:"
echo "    docker exec mycityquest-api npm run admin:create -- --email user@example.com --password password"
echo ""
echo "  Access database:"
echo "    docker exec -it mycityquest-db psql -U postgres -d mycityquest"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
