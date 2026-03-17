# MyCityQuest - START HERE 🚀

Welcome to **MyCityQuest** — an open-source point-and-click quest game platform with visual quest editor.

## ⚡ Quick Start (2 minutes)

### Windows
```bash
setup.bat
```

### Linux / macOS
```bash
bash setup.sh
```

Then open:
- **Admin Panel**: http://localhost:5174 (admin@mycityquest.local / admin123)
- **Game**: http://localhost:5173
- **API**: http://localhost:3000

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `DOCKER_SETUP.md` | How Docker automation works & troubleshooting |
| `QUICKSTART.md` | Manual setup without Docker |
| `SETUP.md` | Full architecture & project overview |
| `README.md` | Technical architecture documentation |

---

## What's Included

✅ **Admin Quest Editor**
- Visual node graph editor (drag-drop)
- 8 node types (dialogue, choice, task, etc.)
- Version management
- Import/export quest JSON

✅ **Game Client**
- Phaser 3 game engine
- Point-and-click navigation
- Quest system with A* pathfinding
- Pseudo-3D perspective

✅ **REST API**
- Node.js/Express backend
- PostgreSQL database
- JWT authentication
- Full quest & player tracking

✅ **Database**
- PostgreSQL with migrations
- Pre-configured schema
- Docker containerized

---

## System Requirements

### Option 1: Docker (Recommended)
- Docker Desktop installed
- 2GB RAM available
- Internet connection (for Docker images)
- **No need to install Node, PostgreSQL, etc.**

### Option 2: Manual Setup (Advanced)
- Node.js 18+
- PostgreSQL 14+
- npm 9+
- See `QUICKSTART.md`

---

## 🎯 First Steps After Setup

1. **Open Admin Panel**
   - URL: http://localhost:5174
   - Login: admin@mycityquest.local / admin123

2. **Create a Quest**
   - Click "+ Новый квест"
   - Give it a name & slug
   - Click "Редактировать"

3. **Design Quest Graph**
   - Drag nodes from left palette
   - Connect nodes
   - Edit node properties
   - Save draft → Publish

4. **Test in Game**
   - Open http://localhost:5173
   - Click on quest zone
   - Play through quest

---

## 🏗️ Architecture at a Glance

```
Admin Panel (React)     →  API Server (Node.js)  →  Database (PostgreSQL)
http://5174            http://3000              port 5432
  ↓
Game Client (Phaser)   →  (same API)
http://5173
```

All running in Docker containers for consistency.

---

## 🆘 Troubleshooting

### Can't start setup?
```bash
# Check Docker
docker --version

# Start Docker Desktop (Windows/macOS)
# Or: sudo systemctl start docker (Linux)
```

### Containers won't start?
```bash
# Check logs
docker-compose logs

# Rebuild
docker-compose down
docker-compose up -d
```

### Can't login to admin?
Wait 30 seconds for database to initialize, then:
- Email: `admin@mycityquest.local`
- Password: `admin123`

### Port conflicts?
Services use: 3000, 5173, 5174, 5432
If these are in use, see `DOCKER_SETUP.md`

---

## 📖 More Info

- **Full Setup Guide**: `SETUP.md`
- **Docker Help**: `DOCKER_SETUP.md`
- **Manual Setup**: `QUICKSTART.md`
- **Architecture**: `README.md`
- **Useful Commands**: See `DOCKER_SETUP.md` → "Useful Commands"

---

## 🤔 What Happens When You Run Setup?

1. Checks you have Docker
2. Builds 4 Docker images (API, Admin, Game, PostgreSQL)
3. Starts 4 containers
4. Initializes PostgreSQL database
5. Runs migrations
6. Creates admin user
7. All services ready to use

Takes ~2-5 minutes on first run, then instant on restarts.

---

## 🎓 Architecture Highlights

- **Extensible Quest Engine**: Add new node types easily
- **Graph-based Quests**: Directed acyclic graph (DAG) for non-linear storytelling
- **Version Control**: Draft/published/archived quest versions
- **Hybrid Architecture**: Local execution + API persistence
- **Docker-first**: Develops locally, deploys anywhere

---

## 📞 Next Steps

1. Run setup: `setup.bat` or `bash setup.sh`
2. Open http://localhost:5174
3. Create & edit your first quest!

**That's it!** Everything else is documented in the files above. 🚀

---

**MyCityQuest** — Making quest game creation simple & fun.
