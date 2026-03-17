FROM node:18-alpine

WORKDIR /app

# Установим зависимости
COPY package.json package-lock.json* ./
RUN npm install

# Скопируем исходный код
COPY . .

# Экспортируем порт
EXPOSE 3000

# По умолчанию запускаем миграции и затем dev сервер
CMD ["sh", "-c", "npm run db:migrate && npm run admin:create -- --email admin@mycityquest.local --password admin123 2>/dev/null || true && npm run dev"]
