#!/bin/bash

echo "🤖 AI Code Executor - Quick Start"
echo "=================================="

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и попробуйте снова."
    exit 1
fi

# Проверка статуса Docker
if ! docker info &> /dev/null; then
    echo "❌ Docker не запущен. Запустите Docker и попробуйте снова."
    exit 1
fi

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 18+ и попробуйте снова."
    exit 1
fi

# Проверка версии Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js 18+. Текущая версия: $(node -v)"
    exit 1
fi

echo "✅ Проверки пройдены успешно"

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

# Создание .env файла если не существует
if [ ! -f .env ]; then
    echo "⚙️  Создание файла конфигурации..."
    cp env.example .env
fi

# Сборка Docker образа
echo "🐳 Сборка Docker образа..."
docker build -t ai-code-executor .

if [ $? -eq 0 ]; then
    echo "✅ Docker образ создан успешно"
else
    echo "❌ Ошибка при создании Docker образа"
    exit 1
fi

# Запуск сервера
echo "🚀 Запуск сервера..."
echo "📱 Веб-интерфейс будет доступен по адресу: http://localhost:3000"
echo "📚 API документация: http://localhost:3000/api"
echo ""
echo "Для остановки сервера нажмите Ctrl+C"
echo ""

npm start
