#!/bin/bash
# ============================================================================
# MyCityQuest Development Setup
# Этот скрипт автоматизирует первую настройку проекта с PostgreSQL в Docker
# ============================================================================

set -e  # выход при ошибке

echo "🚀 MyCityQuest Development Setup"
echo "=================================="

# 1. Проверка Docker
echo "✓ Проверка Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    echo "   Скачайте: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# 2. Проверка Node
echo "✓ Проверка Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    echo "   Скачайте: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js версия 18+ требуется (у вас: $(node -v))"
    exit 1
fi
echo "   $(node -v) ✓"

# 3. Стартуем PostgreSQL в Docker
echo ""
echo "🐘 Запуск PostgreSQL контейнера..."
docker run -d \
  --name mycityquest-postgres-dev \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16 2>/dev/null || echo "   (контейнер уже запущен)"

echo "   Ожидание готовности БД..."
sleep 3

# 4. Создаем БД
echo "🗄️  Создание БД..."
psql -U postgres -h localhost << EOF > /dev/null 2>&1 || true
CREATE DATABASE mycityquest;
EOF
echo "   Готово ✓"

# 5. API Setup
echo ""
echo "⚙️  Установка зависимостей API..."
cd api
npm install > /dev/null 2>&1
echo "   Готово ✓"

echo "🔄 Применение миграций..."
npm run db:migrate > /dev/null 2>&1
echo "   Готово ✓"

echo "👤 Создание админ-пользователя..."
npm run admin:create -- --email admin@mycityquest.local --password admin123 > /dev/null 2>&1
echo "   Email:    admin@mycityquest.local"
echo "   Password: admin123 ✓"

cd ..

# 6. Admin Setup
echo ""
echo "💄 Установка зависимостей Admin..."
cd admin
npm install > /dev/null 2>&1
echo "   Готово ✓"
cd ..

# 7. Game Setup
echo ""
echo "🎮 Установка зависимостей Game..."
cd game
npm install > /dev/null 2>&1
echo "   Готово ✓"
cd ..

# 8. Инструкции запуска
echo ""
echo "=================================="
echo "✅ Установка завершена!"
echo "=================================="
echo ""
echo "📍 Следующие шаги:"
echo ""
echo "Откройте 3 новых терминала и запустите:"
echo ""
echo "1️⃣  API:"
echo "    cd api && npm run dev"
echo "    → http://localhost:3000"
echo ""
echo "2️⃣  Admin:"
echo "    cd admin && npm run dev"
echo "    → http://localhost:5174"
echo "    (Email: admin@mycityquest.local | Пароль: admin123)"
echo ""
echo "3️⃣  Game:"
echo "    cd game && npm run dev"
echo "    → http://localhost:5173"
echo ""
echo "📚 Подробно: cat QUICKSTART.md"
echo ""
echo "🛑 Остановить БД: docker stop mycityquest-postgres-dev"
echo "🗑️  Удалить БД:    docker rm mycityquest-postgres-dev"
