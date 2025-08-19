#!/bin/bash

echo "🚀 Запуск D09 MCP Reporter в Docker"

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден. Создайте его на основе env.example"
    exit 1
fi

# Останавливаем существующие контейнеры
echo "🛑 Остановка существующих контейнеров..."
docker-compose down

# Собираем образ
echo "🔨 Сборка Docker образа..."
docker-compose build --no-cache

# Запускаем сервис
echo "🚀 Запуск MCP Reporter..."
docker-compose up -d

# Ждем немного для запуска
echo "⏳ Ожидание запуска сервиса..."
sleep 10

# Показываем статус
echo "📊 Статус контейнера:"
docker-compose ps

echo ""
echo "📋 Полезные команды:"
echo "  Просмотр логов: ./docker-logs.sh"
echo "  Логи в реальном времени: ./docker-logs.sh follow"
echo "  Остановка: ./docker-stop.sh"
echo ""
echo "✅ D09 MCP Reporter запущен!"
