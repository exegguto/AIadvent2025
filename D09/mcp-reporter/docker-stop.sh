#!/bin/bash

echo "🛑 Остановка D09 MCP Reporter"

# Останавливаем все контейнеры
docker-compose down

echo "✅ Все контейнеры остановлены"
echo ""
echo "📋 Статус:"
docker-compose ps
