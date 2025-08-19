# D09 MCP Reporter - Docker Guide

## 🐳 Архитектура Docker

Система работает в одном контейнере с подпроцессами:

```
┌─────────────────────────────────────────────────────────────┐
│                    mcp-reporter                             │
│                     (контейнер)                             │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ GitHub MCP      │    │ Telegram MCP    │                │
│  │ Server          │    │ Server          │                │
│  │ (подпроцесс)    │    │ (подпроцесс)    │                │
│  │                 │    │                 │                │
│  │ • GitHub API    │    │ • Telegram API  │                │
│  │ • Статистика    │    │ • Отправка      │                │
│  │   пушей         │    │   сообщений     │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Оркестратор                                │ │
│  │        • Координация                                    │ │
│  │        • Планирование                                   │ │
│  │        • Логирование                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Быстрый старт

### 1. Подготовка

```bash
# Клонирование и настройка
cd D09/mcp-reporter
cp env.example .env
# Отредактируйте .env файл с вашими токенами
```

### 2. Запуск

```bash
# Быстрый запуск всех сервисов
./docker-start.sh
```

### 3. Проверка

```bash
# Статус контейнеров
docker-compose ps

# Просмотр логов
./docker-logs.sh
```

## 📋 Управление контейнерами

### Запуск

```bash
# Автоматический запуск
./docker-start.sh

# Ручной запуск
docker-compose up -d

# Запуск с пересборкой
docker-compose up --build -d
```

### Остановка

```bash
# Остановка всех сервисов
./docker-stop.sh

# Или вручную
docker-compose down
```

### Логи

```bash
# Логи MCP Reporter
./docker-logs.sh

# Логи в реальном времени
./docker-logs.sh follow
```

## 🔧 Детальное управление

### Сборка образов

```bash
# Сборка всех образов
docker-compose build

# Сборка с пересозданием кэша
docker-compose build --no-cache

# Сборка конкретного сервиса
docker-compose build mcp-github-server
docker-compose build mcp-telegram-server
docker-compose build mcp-reporter
```

### Управление контейнером

```bash
# Запуск контейнера
docker-compose up -d

# Перезапуск контейнера
docker-compose restart mcp-reporter

# Остановка контейнера
docker-compose stop mcp-reporter

# Просмотр логов
docker-compose logs -f mcp-reporter
```

### Мониторинг

```bash
# Статус всех контейнеров
docker-compose ps

# Использование ресурсов
docker stats

# Информация о контейнерах
docker-compose top
```

## 📁 Структура файлов

```
D09/mcp-reporter/
├── docker-compose.yml      # Конфигурация контейнера
├── docker-start.sh         # Скрипт запуска
├── docker-stop.sh          # Скрипт остановки
├── docker-logs.sh          # Скрипт просмотра логов
├── Dockerfile              # Образ с оркестратором и MCP серверами
├── minimal-push-mcp-server/ # GitHub MCP сервер (включается в образ)
├── mcp-telegram-server/    # Telegram MCP сервер (включается в образ)
└── data/                   # Данные состояния (volume)
```

## 🔍 Отладка

### Проблемы с запуском

```bash
# Проверка конфигурации
docker-compose config

# Проверка образов
docker images | grep mcp

# Проверка сетей
docker network ls | grep mcp
```

### Проблемы с подключением

```bash
# Проверка логов
docker-compose logs mcp-reporter

# Вход в контейнер
docker-compose exec mcp-reporter sh
```

### Очистка

```bash
# Удаление контейнеров
docker-compose down

# Удаление образов
docker-compose down --rmi all

# Полная очистка
docker-compose down --rmi all --volumes --remove-orphans
```

## 🔐 Переменные окружения

### mcp-reporter (основной контейнер)
- `TG_BOT_TOKEN` - Telegram Bot Token
- `TG_CHAT_ID` - Telegram Chat ID
- `GITHUB_PAT` - GitHub Personal Access Token
- `GITHUB_USER` - GitHub username
- `HOURLY_WINDOW_HOURS` - Часовое окно (по умолчанию: 1)
- `REPORT_TIME` - Время ежедневного отчета (по умолчанию: 22:00)
- `STATE_PATH` - Путь к файлу состояния (по умолчанию: /data/state.json)

> **Примечание:** MCP серверы получают переменные окружения от основного контейнера

## 📊 Мониторинг и логи

### Структура логов

Все логи объединены в одном контейнере:

- **mcp-reporter** - Логи оркестрации, планирования и MCP серверов
  - Логи запросов к GitHub API
  - Логи отправки сообщений в Telegram
  - Логи координации между серверами

### Полезные команды

```bash
# Логи в реальном времени
docker-compose logs -f

# Логи с временными метками
docker-compose logs -f --timestamps

# Логи последних 100 строк
docker-compose logs --tail=100

# Логи конкретного сервиса
docker-compose logs -f mcp-reporter
```

## 🚀 Продакшн развертывание

### Рекомендации

1. **Используйте Docker volumes** для данных состояния
2. **Настройте логирование** в файлы или внешнюю систему
3. **Используйте Docker secrets** для токенов в продакшне
4. **Настройте мониторинг** контейнеров
5. **Используйте Docker Swarm или Kubernetes** для масштабирования

### Пример продакшн конфигурации

```yaml
version: '3.8'

services:
  mcp-reporter:
    image: mcp-reporter:latest
    restart: unless-stopped
    volumes:
      - mcp_data:/data
    secrets:
      - github_pat
      - telegram_bot_token
      - telegram_chat_id
    networks:
      - mcp-network

volumes:
  mcp_data:

networks:
  mcp-network:

secrets:
  github_pat:
    external: true
  telegram_bot_token:
    external: true
  telegram_chat_id:
    external: true
```
