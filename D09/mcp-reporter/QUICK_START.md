# D09 MCP Reporter - Быстрый старт

## 🚀 Быстрая установка

### 1. Клонирование и сборка

```bash
# Перейдите в папку проекта
cd D09/mcp-reporter

# Быстрая сборка всех компонентов
./build-all.sh
```

### 2. Настройка переменных окружения

Создайте файл `.env` на основе `env.example`:

```bash
cp env.example .env
```

Отредактируйте `.env` файл:

```bash
# GitHub Configuration
GITHUB_PAT=your_github_personal_access_token_here
GITHUB_USER=your_github_username_here

# Telegram Configuration
TG_BOT_TOKEN=your_telegram_bot_token_here
TG_CHAT_ID=your_telegram_chat_id_here

# Application Configuration
NODE_ENV=production
HOURLY_WINDOW_HOURS=1
REPORT_TIME=22:00
STATE_PATH=/data/state.json
```

### 3. Получение токенов

#### GitHub Personal Access Token
1. Перейдите на [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Нажмите "Generate new token (classic)"
3. Выберите разрешения: `public_repo`, `repo`, `read:user`
4. Скопируйте токен в `GITHUB_PAT`

#### Telegram Bot Token
1. Найдите @BotFather в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям для создания бота
4. Скопируйте токен в `TG_BOT_TOKEN`

#### Telegram Chat ID
1. Добавьте бота в нужный чат
2. Отправьте сообщение в чат
3. Перейдите по ссылке: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Найдите `chat.id` в ответе и скопируйте в `TG_CHAT_ID`

### 4. Тестирование

```bash
# Тест всей системы
node test-orchestrator.js

# Тест отдельных компонентов
cd minimal-push-mcp-server && node test-exegguto.js && cd ..
cd mcp-telegram-server && node test-telegram.js && cd ..
```

### 5. Запуск

#### Локальный запуск
```bash
npm start
```

#### Docker запуск
```bash
docker-compose up --build
```

## 📊 Что происходит

### Почасовая работа
- Каждый час система запрашивает статистику пушей GitHub
- Отправляет отчет в Telegram
- Сохраняет данные для ежедневного отчета

### Ежедневная работа
- В 22:00 - ежедневный отчет
- В 10:00 - недельная статистика пушей

## 🔧 Архитектура

```
mcp-reporter (оркестратор)
    │
    ├── minimal-push-mcp-server ──► GitHub API
    │         │
    │         └── Статистика пушей
    │
    └── mcp-telegram-server ──► Telegram API
              │
              └── Отправка сообщений
```

## 📁 Структура проекта

```
mcp-reporter/
├── src/                          # Основное приложение
├── minimal-push-mcp-server/      # MCP сервер для GitHub
├── mcp-telegram-server/          # MCP сервер для Telegram
├── data/                         # Данные состояния
├── build-all.sh                  # Скрипт сборки
├── test-orchestrator.js          # Тест системы
└── docker-compose.yml            # Docker конфигурация
```

## 🛠️ Устранение неполадок

### Проблемы с GitHub
```bash
cd minimal-push-mcp-server
node test-exegguto.js
```

### Проблемы с Telegram
```bash
cd mcp-telegram-server
node test-telegram.js
```

### Проблемы с оркестратором
```bash
node test-orchestrator.js
```

### Просмотр логов
```bash
# Локальный запуск
npm start

# Docker
docker-compose logs -f mcp-reporter
```

## 📈 Мониторинг

### Состояние системы
```bash
cat data/state.json
```

### Логи в реальном времени
```bash
docker-compose logs -f mcp-reporter
```

## 🔄 Обновление

```bash
# Остановить систему
docker-compose down

# Обновить код
git pull

# Пересобрать и запустить
./build-all.sh
docker-compose up --build
```

## 📚 Дополнительная документация

- [README.md](README.md) - Подробная документация
- [minimal-push-mcp-server/README.md](minimal-push-mcp-server/README.md) - Документация GitHub сервера
- [mcp-telegram-server/README.md](mcp-telegram-server/README.md) - Документация Telegram сервера

## 🎯 Готово!

Система настроена и готова к работе! Вы будете получать:
- Почасовые отчеты о пушах GitHub
- Ежедневные сводки
- Недельную статистику активности

Все отчеты будут приходить в указанный Telegram чат с префиксом "D09".
