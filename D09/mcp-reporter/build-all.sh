#!/bin/bash

echo "🚀 Сборка всех компонентов MCP Reporter"

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен"
    exit 1
fi

# Проверяем наличие npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен"
    exit 1
fi

echo "📦 Установка зависимостей основного приложения..."
npm install

echo "🔨 Сборка minimal-push-mcp-server..."
cd minimal-push-mcp-server
npm install
npm run build
cd ..

echo "🔨 Сборка mcp-telegram-server..."
cd mcp-telegram-server
npm install
npm run build
cd ..

echo "✅ Все компоненты собраны успешно!"

echo ""
echo "📋 Следующие шаги:"
echo "1. Создайте файл .env с вашими настройками"
echo "2. Запустите тесты: node test-orchestrator.js"
echo "3. Запустите приложение: npm start"
echo "4. Или используйте Docker: docker-compose up --build"
