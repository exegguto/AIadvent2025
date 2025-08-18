FROM node:20-alpine

WORKDIR /app

# Копируем файлы конфигурации
COPY package*.json ./
COPY tsconfig.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY src/ ./src/

# Собираем приложение
RUN npm run build

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
