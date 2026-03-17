FROM node:18-alpine

WORKDIR /app

# Установим зависимости
COPY package.json package-lock.json* ./
RUN npm install

# Скопируем исходный код
COPY . .

# Экспортируем порт
EXPOSE 5173

# Запускаем dev сервер
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
