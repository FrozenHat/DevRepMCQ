# 🚀 MyCityQuest — Quick Start Guide

Полный гайд по настройке и запуску разработки локально.

## 📋 Требования

- **Node.js**: v18+ (проверьте: `node -v`)
- **npm**: v9+ (проверьте: `npm -v`)
- **PostgreSQL**: 14+ (локально или Docker)
- **Git**: для версионирования

---

## 🐘 1. Установка PostgreSQL

### Вариант A: Docker (рекомендуется для разработки)

```bash
# Запустить PostgreSQL контейнер
docker run -d \
  --name mycityquest-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16

# Проверить статус
docker logs mycityquest-postgres

# Остановить контейнер (позже)
docker stop mycityquest-postgres

# Удалить контейнер (если нужно)
docker rm mycityquest-postgres
```

### Вариант B: Локальная установка

- **Windows**: [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql@16`
- **Linux**: `apt install postgresql-16` (Ubuntu/Debian)

После установки:
```bash
psql -U postgres -c "CREATE DATABASE mycityquest;"
```

---

## 🔌 2. Инициализация Base (Backend)

```bash
# Перейти в папку API
cd api

# Установить зависимости
npm install

# Создать миграции (создаст все таблицы)
npm run db:migrate

# Создать админ-пользователя
npm run admin:create -- --email admin@mycityquest.local --password admin123

# Запустить API (порт 3000)
npm run dev
```

**Результат:**
```
API listening on http://localhost:3000
```

---

## 🎨 3. Инициализация Admin (Frontend)

В **новом терминале**:

```bash
# Перейти в папку админа
cd admin

# Установить зависимости
npm install

# Запустить dev-сервер (порт 5174)
npm run dev
```

**Результат:**
```
  ➜  Local:   http://localhost:5174/
```

---

## 🎮 4. Инициализация Game Client

В **еще одном новом терминале**:

```bash
# Перейти в папку игры
cd game

# Установить зависимости (если еще нет)
npm install

# Запустить dev-сервер (порт 5173)
npm run dev
```

**Результат:**
```
  ➜  Local:   http://localhost:5173/
```

---

## 🌐 5. Открыть приложение

### Admin Panel (редактор квестов)
```
http://localhost:5174
```

**Вход:**
- Email: `admin@mycityquest.local`
- Password: `admin123`

### Game Client
```
http://localhost:5173
```

---

## 📊 Архитектура в разработке

```
┌─────────────────────────────────────────────────┐
│  Admin Panel (React)                            │
│  http://localhost:5174                          │
│  (Quest editor, версионирование)                │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓ fetch /api/*
┌─────────────────────────────────────────────────┐
│  API Server (Node.js/Express)                   │
│  http://localhost:3000                          │
│  (Routes: auth, quests, scenes, player)         │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓ postgresql
┌─────────────────────────────────────────────────┐
│  PostgreSQL Database                            │
│  (localhost:5432/mycityquest)                   │
│  Tables: users, quests, quest_versions, etc.    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Game Client (Phaser 3)                         │
│  http://localhost:5173                          │
│  (Point-and-click, quest engine)                │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓ fetch /api/*
                   (можно запускать на 5173 или 5174)
```

---

## 🛠️ Полезные Команды

### API

| Команда | Описание |
|---------|---------|
| `npm run dev` | Запустить с hot-reload |
| `npm run start` | Запустить production build |
| `npm run db:migrate` | Применить SQL-миграции |
| `npm run admin:create -- --email E --password P` | Создать админа |

### Admin

| Команда | Описание |
|---------|---------|
| `npm run dev` | Запустить на http://localhost:5174 |
| `npm run build` | Build для production |
| `npm run preview` | Preview production build |

### Game

| Команда | Описание |
|---------|---------|
| `npm run dev` | Запустить на http://localhost:5173 |
| `npm run build` | Build для production |

---

## 🐛 Troubleshooting

### ❌ "Cannot connect to database"

```bash
# Проверьте, запущен ли PostgreSQL
psql -U postgres -c "SELECT version();"

# Или через Docker
docker ps  # должен показать контейнер
docker logs mycityquest-postgres  # логи контейнера
```

### ❌ "Port 5432 already in use"

```bash
# Найдите процесс на порту 5432
lsof -i :5432  # macOS/Linux
netstat -ano | findstr :5432  # Windows

# Убейте процесс или используйте другой порт в DATABASE_URL
```

### ❌ "CORS error when accessing admin"

Убедитесь что в `api/src/index.js` добавлен CORS для 5174:

```javascript
origin: ['http://localhost:5173', 'http://localhost:5174'],
```

### ❌ "Cannot find migrations"

```bash
cd api
npm run db:migrate
```

---

## 🔐 Безопасность разработки

- JWT_SECRET в `.env` — это временный ключ для разработки
- В production **обязательно** установите длинный случайный ключ:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- Никогда не коммитьте `.env` в git (добавлен в `.gitignore`)

---

## 📚 Следующие Шаги

1. **Изучите структуру:**
   - `/api/src/routes` — API endpoints
   - `/admin/src/nodes` — Node types for quest editor
   - `/game/src/scenes` — Game scenes и системы

2. **Создайте первый квест:**
   - Откройте админ-панель
   - Создайте новый квест через UI
   - Используйте визуальный редактор

3. **Тестируйте в игре:**
   - Запустите game client
   - Кликните на зону с активным квестом
   - Пройдите диалог/задачу

---

## 📞 Помощь

Если что-то не работает:
1. Проверьте консоль (dev tools / npm вывод)
2. Убедитесь что PostgreSQL запущен
3. Проверьте `.env` файлы
4. Посмотрите логи в `docker logs mycityquest-postgres`

**Успешного развития! 🚀**
