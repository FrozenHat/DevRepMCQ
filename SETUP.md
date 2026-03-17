# MyCityQuest — Project Status & Setup

## ✅ What's Ready

### Game Client ✓
- Phaser 3 game engine
- Point-and-click navigation with pathfinding (A*)
- Location scenes with perspective pseudo-3D
- Quest system with dialogue & choices
- Player movement, animations, zones
- **Location:** `game/`

### API Backend ✓
- Node.js/Express server
- PostgreSQL integration
- JWT authentication
- Routes: auth, quests, scenes, player
- Database migrations system
- **Location:** `api/`

### Admin Quest Editor ✓
- React SPA with React Flow (node graph editor)
- 8 node types: start, end, dialogue, choice, task, flag, item_grant, condition
- Visual quest designer with drag-drop
- Dialogue/choice sub-editors
- Version management (draft/published/archived)
- Import/export quest JSON
- **Location:** `admin/`

---

## 🚀 Quick Start (Windows)

### Option 1: Automated Setup (Recommended)
```bash
# Run setup script
setup-dev.bat
```

### Option 2: Manual Setup

**Step 1: Start PostgreSQL**
```bash
# Using Docker (easiest)
docker run -d --name mycityquest-postgres-dev ^
  -e POSTGRES_PASSWORD=postgres ^
  -p 5432:5432 postgres:16

# Or use local PostgreSQL
psql -U postgres -c "CREATE DATABASE mycityquest;"
```

**Step 2: Setup API**
```bash
cd api
npm install
npm run db:migrate
npm run admin:create -- --email admin@mycityquest.local --password admin123
npm run dev
```

**Step 3: Setup Admin (new terminal)**
```bash
cd admin
npm install
npm run dev
```

**Step 4: Setup Game (new terminal)**
```bash
cd game
npm install
npm run dev
```

**Step 5: Open & Login**
- Admin: http://localhost:5174
- Game: http://localhost:5173
- API: http://localhost:3000

**Credentials:**
- Email: `admin@mycityquest.local`
- Password: `admin123`

---

## 📁 Project Structure

```
MyCityQuest/
├── api/
│   ├── src/
│   │   ├── index.js (Express app)
│   │   ├── config.js
│   │   ├── routes/ (auth, quests, scenes, player)
│   │   ├── services/ (questService, playerService)
│   │   ├── middleware/ (auth, rbac)
│   │   └── db/
│   │       ├── index.js (PostgreSQL connection)
│   │       ├── migrate.js (migration runner)
│   │       ├── create-admin.js (admin user creation)
│   │       └── migrations/
│   │           └── 001_initial.sql (schema)
│   ├── package.json
│   ├── .env (development config)
│   └── .gitignore
│
├── admin/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/ (questApi, authApi)
│   │   ├── store/ (authStore, questStore with Zustand)
│   │   ├── nodes/ (NodeRegistry + 8 node types)
│   │   ├── editor/
│   │   │   ├── QuestGraph.jsx (React Flow canvas)
│   │   │   ├── NodeInspector.jsx (properties panel)
│   │   │   ├── NodePalette.jsx (drag-drop palette)
│   │   │   ├── EditorToolbar.jsx
│   │   │   ├── DialogueEditor.jsx
│   │   │   ├── ChoiceEditor.jsx
│   │   │   ├── questSerializer.js
│   │   │   └── questDeserializer.js
│   │   ├── pages/ (LoginPage, QuestListPage, QuestEditorPage)
│   │   └── styles/ (global, editor, nodes CSS)
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env (development config)
│   └── .gitignore
│
├── game/
│   ├── public/assets/ (PNG images)
│   ├── src/
│   │   ├── main.js (Phaser config)
│   │   ├── api/ (ApiClient.js)
│   │   ├── systems/ (QuestEngine, DialogSystem, NavigationSystem)
│   │   ├── scenes/ (BootScene, PreloadScene, LocationScene)
│   │   ├── entities/ (Player + animations)
│   │   └── data/
│   │       ├── scenes/hub.json
│   │       └── quests/taxi-quest.json
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .gitignore
│
├── .gitignore
├── .gitattributes
├── README.md (Russians: Архитектурная документация)
├── QUICKSTART.md (Гайд установки)
├── setup-dev.sh (Linux/macOS автоматическая установка)
├── setup-dev.bat (Windows автоматическая установка)
└── README.md
```

---

## 🎯 Architecture Overview

```
Game Client                Admin Panel              API Server            Database
(Phaser 3)                (React+React Flow)      (Node/Express)        (PostgreSQL)
port 5173                 port 5174               port 3000

     ↓                          ↓                       ↓                    ↓
  [Quest                 [Visual Editor]          [REST Endpoints]     [Tables]
   Engine]               - Drag-drop               - /auth/login        - users
   - Dialogue            - 8 node types           - /quests/list       - quests
   - Choices             - Import/Export          - /quests/{id}       - quest_versions
   - Flags                    ↓                   - /scenes             - player_progress
        ↓                 [Zustand Store]         - /player/{id}       - scenes
  [API Client]           [questStore]                  ↓
        ↓                 [React Flow]        [Services]
   fetch /api/*          [NodeRegistry]         - questService
                                                 - playerService
```

---

## 🔑 Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend (Admin)** | React 18, React Flow v12, Zustand v5, Vite | Quest editor SPA |
| **Frontend (Game)** | Phaser 3, Canvas/WebGL | Game rendering |
| **Backend** | Node.js, Express | REST API |
| **Database** | PostgreSQL 14+ | Data persistence |
| **Auth** | JWT (jsonwebtoken), bcryptjs | User authentication |
| **Build** | Vite | Fast bundling |

---

## 📊 Database Schema

### users
```
id, email (UNIQUE), password_hash, role (player|admin), created_at, updated_at
```

### quests
```
id, slug (UNIQUE), title, created_by (FK users), created_at, updated_at
```

### quest_versions
```
id, quest_id (FK), version_number, status (draft|published|archived),
data (JSONB quest graph), created_by (FK), published_at, created_at
```

### player_progress
```
id, user_id (FK), quest_id (FK), quest_version,
current_node_id, context (JSONB), status, started_at, updated_at
```

### scenes
```
id, key (UNIQUE), title, data (JSONB config), created_at, updated_at
```

---

## 🧪 Environment Variables

### API (.env)
```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mycityquest
JWT_SECRET=dev-secret-key-change-in-production
JWT_ACCESS_EXPIRES=15m
```

### Admin (.env)
```
VITE_API_BASE=http://localhost:3000/api
```

---

## 🎓 Key Concepts

### Quest Engine (Game)
- State machine: `(currentNodeId, context) → next state`
- Auto-nodes resolve locally: flag, item_grant, condition
- Blocking nodes wait for player: dialogue, choice, task, end

### Node Registry (Admin)
- Extensible pattern for adding new node types
- Central definition: label, color, handles, inspector widget
- Adding node type = 1 file + 1 registry entry

### Serialization
- `questSerializer.js`: Quest JSON → React Flow nodes+edges
- `questDeserializer.js`: React Flow nodes+edges → Quest JSON
- Edges are source of truth (ignore outdated node.data.next)
- Positions stored in `_editorMeta.positions`

---

## 🚦 Next Features (Future)

- [ ] Admin panel permission system (viewer/editor/publisher)
- [ ] Multi-language support (i18n)
- [ ] Dialogue character avatars
- [ ] Item/inventory system
- [ ] Player rankings & statistics
- [ ] Analytics (quest completion rates)
- [ ] Mobile support
- [ ] Production deployment (Nginx, SSL)

---

## 📚 Documentation

- **[README.md](README.md)** — Архитектурная документация (Russian)
- **[QUICKSTART.md](QUICKSTART.md)** — Детальный гайд установки
- **setup-dev.sh** — Linux/macOS автоматическая установка
- **setup-dev.bat** — Windows автоматическая установка

---

## 💾 Database Backups

```bash
# Экспорт БД
pg_dump -U postgres mycityquest > backup.sql

# Восстановление БД
psql -U postgres -d mycityquest < backup.sql
```

---

## 🔐 Security Notes

- JWT_SECRET в разработке — временный ключ
- В production используйте длинный случайный ключ
- Пароли хешируются bcryptjs (10 rounds)
- CORS настроен только для localhost в разработке

---

## 📞 Support

**Windows issues?** Run `setup-dev.bat`

**Linux/macOS?** Run `sh setup-dev.sh`

**Manual setup?** See `QUICKSTART.md`

---

**Status: ✅ Ready for Development**

Last updated: March 2026
