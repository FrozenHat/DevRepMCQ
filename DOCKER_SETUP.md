# MyCityQuest Setup Guide

## 🚀 Automated One-Click Setup

The easiest way to get everything running:

### Windows
```bash
setup.bat
```

### Linux / macOS
```bash
bash setup.sh
```

---

## ✨ What the Setup Script Does

1. ✅ Checks Docker installation
2. ✅ Cleans up old containers
3. ✅ Builds Docker images for all services
4. ✅ Starts all containers:
   - PostgreSQL database (port 5432)
   - API server (port 3000)
   - Admin panel (port 5174)
   - Game client (port 5173)
5. ✅ Runs database migrations
6. ✅ Creates default admin user

---

## 📋 Prerequisites

- **Docker & Docker Compose** installed
  - Windows/macOS: [Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Linux: `apt install docker.io docker-compose-plugin` (Ubuntu/Debian)

That's it! Everything else is automated.

---

## 🎯 After Setup Completes

### Admin Panel
- URL: `http://localhost:5174`
- Email: `admin@mycityquest.local`
- Password: `admin123`
- Use this to create and edit quests

### Game Client
- URL: `http://localhost:5173`
- This is the game where players experience quests

### API Server
- URL: `http://localhost:3000`
- REST endpoints for backend operations

### Database
- PostgreSQL running in Docker
- Automatically initialized with schema
- Data persists in Docker volume

---

## 🛠️ Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f admin
docker-compose logs -f game
docker-compose logs -f postgres
```

### Stop Everything
```bash
docker-compose down
```

### Start Again
```bash
docker-compose up -d
```

### Create New Admin User
```bash
docker exec mycityquest-api npm run admin:create -- --email newadmin@example.com --password password123
```

### Access Database
```bash
docker exec -it mycityquest-db psql -U postgres -d mycityquest

# Common SQL queries:
SELECT * FROM users;
SELECT * FROM quests;
SELECT * FROM quest_versions;
```

### Rebuild Services (if you made code changes)
```bash
docker-compose build
docker-compose up -d
```

### Full Cleanup (remove everything including data)
```bash
docker-compose down -v
```

⚠️ Warning: `-v` flag removes all database data!

---

## 📁 Docker Architecture

```
docker-compose.yml
├── postgres:16 (PostgreSQL database)
├── api (Node.js/Express)
├── admin (React SPA)
└── game (Phaser 3)
```

Each service:
- Runs in isolated container
- Has its own Dockerfile
- Hot-reloads on code changes (dev mode)
- Communicates via internal Docker network

---

## 🔧 Troubleshooting

### "Docker daemon is not running"
- Start Docker Desktop (Windows/macOS)
- Or: `sudo systemctl start docker` (Linux)

### Port already in use
Check what's using the port:
```bash
# Windows
netstat -ano | findstr :5174

# Linux/macOS
lsof -i :5174
```

### Containers keep crashing
Check logs:
```bash
docker-compose logs
```

### Slow startup on first run
- First build takes time (downloading base images, npm install)
- Subsequent runs are faster
- Be patient! ☕

### Database won't initialize
```bash
# Check database logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres

# Force full rebuild
docker-compose down -v
docker-compose up -d
```

---

## 📦 Environment Variables

All configured in `docker-compose.yml`:

### API
```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/mycityquest
JWT_SECRET=dev-secret-key-change-this-in-production
```

### Admin
```
VITE_API_BASE=http://localhost:3000/api
```

To change, edit `docker-compose.yml` and run:
```bash
docker-compose down
docker-compose up -d
```

---

## 🌐 About Docker

Docker is a containerization tool that:
- Packages each service with its dependencies
- Ensures "works on my machine" = "works everywhere"
- Makes development environment identical to production
- No need to manually install PostgreSQL, Node versions, etc.

Think of it as:
- **Virtual machine** (but lighter)
- Each service runs in its own isolated environment
- All communicate via network bridge

---

## 🚀 Production Deployment

When ready to deploy:

1. Push code to Git/GitHub
2. Deploy to server with Docker support:
   - AWS ECS
   - DigitalOcean Docker
   - Railway
   - Render
   - Vercel (frontend only)
   - Or your own server with Docker

3. Use production environment variables
4. Modify `docker-compose.yml` for production (remove volumes, use specific image tags)

More on production setup: `SETUP.md`

---

## ✅ Success Checklist

After running setup, verify:

- [ ] Admin panel loads at http://localhost:5174
- [ ] Can log in with admin@mycityquest.local / admin123
- [ ] Game client loads at http://localhost:5173
- [ ] API server responds at http://localhost:3000
- [ ] Can create a new quest in admin panel
- [ ] Can see quest data in game client

---

## 📞 Need Help?

1. Check **Troubleshooting** section above
2. Read logs: `docker-compose logs -f`
3. Read full setup guide: `SETUP.md`
4. Read architecture docs: `README.md`

---

**Ready to go!** 🎉

Run `setup.bat` (Windows) or `bash setup.sh` (Linux/macOS) and you're done!
