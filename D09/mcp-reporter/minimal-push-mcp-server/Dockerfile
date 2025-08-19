FROM node:20-alpine

WORKDIR /app

# Копируем файлы конфигурации
COPY package*.json ./
COPY tsconfig.json ./

# Устанавливаем зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код
COPY src/ ./src/

# Собираем приложение
RUN npm run build

# Удаляем dev зависимости для уменьшения размера
RUN npm prune --production

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Меняем владельца файлов
RUN chown -R nodejs:nodejs /app
USER nodejs

# Экспонируем порт (хотя для stdio это не нужно)
EXPOSE 3000

# Запускаем сервер
CMD ["node", "dist/index.js"]
