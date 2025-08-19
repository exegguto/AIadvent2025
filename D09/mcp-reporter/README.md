# MCP Reporter

Оркестратор для системы мониторинга активности GitHub с отправкой отчетов в Telegram через Model Context Protocol.

## Описание

MCP Reporter - это центральный оркестратор, который координирует работу между GitHub MCP сервером (для получения статистики пушей) и Telegram MCP сервером (для отправки сообщений). Система автоматически собирает статистику активности и отправляет почасовые и ежедневные отчеты.

## Архитектура

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

## Установка

```bash
npm install
```

## Сборка

```bash
# Сборка всех компонентов
./build-all.sh

# Или ручная сборка
npm install
cd minimal-push-mcp-server && npm install && npm run build && cd ..
cd mcp-telegram-server && npm install && npm run build && cd ..
```

## Запуск

```bash
# Локальный запуск
npm start

# Docker запуск
docker-compose up --build
```

## API Reference

### Основные функции

#### 1. `getPushStats(username, days = 1)`

Получает статистику пушей от GitHub MCP сервера.

**Параметры:**
- `username` (string) - GitHub username
- `days` (number, опциональный) - Количество дней для анализа (по умолчанию: 1)

**Возвращает:** Promise<string | null> - Отформатированная статистика или null

**Пример использования:**
```javascript
import { getPushStats } from './src/mcpOrchestrator.js';

const stats = await getPushStats('exegguto', 1);
console.log(stats);
// Вывод:
// D09
//
// 📊 Статистика пушей для пользователя **exegguto** за последний час:
//
// 🔢 **Количество пушей:** 12
// 📅 **Период:** с 2025-08-18 01:00 по 2025-08-18 02:00
```

#### 2. `sendTelegramMessage(text, chat_id = null)`

Отправляет произвольное сообщение через Telegram MCP сервер.

**Параметры:**
- `text` (string) - Текст сообщения
- `chat_id` (string, опциональный) - ID чата (если не указан, используется TG_CHAT_ID)

**Возвращает:** Promise<string | null> - Ответ от Telegram сервера или null

**Пример использования:**
```javascript
import { sendTelegramMessage } from './src/mcpOrchestrator.js';

const result = await sendTelegramMessage("🧪 Тестовое сообщение");
console.log(result);
// Вывод:
// ✅ Сообщение успешно отправлено в Telegram
//
// 📝 Текст: 🧪 Тестовое сообщение
// 💬 Chat ID: -1001234567890
```

#### 3. `sendPushStatsToTelegram(username, days = 1, chat_id = null)`

Получает статистику пушей и отправляет её в Telegram.

**Параметры:**
- `username` (string) - GitHub username
- `days` (number, опциональный) - Количество дней для анализа (по умолчанию: 1)
- `chat_id` (string, опциональный) - ID чата

**Возвращает:** Promise<string | null> - Результат отправки

**Пример использования:**
```javascript
import { sendPushStatsToTelegram } from './src/mcpOrchestrator.js';

const result = await sendPushStatsToTelegram('exegguto', 1);
console.log(result);
// Вывод:
// ✅ Push stats sent to telegram via MCP
```

#### 4. `getHourlyPushStats(username)`

Получает почасовую статистику пушей и отправляет её в Telegram.

**Параметры:**
- `username` (string) - GitHub username

**Возвращает:** Promise<string | null> - Статистика или null

**Пример использования:**
```javascript
import { getHourlyPushStats } from './src/mcpOrchestrator.js';

const stats = await getHourlyPushStats('exegguto');
console.log(stats);
```

#### 5. `cleanup()`

Закрывает соединения с MCP серверами.

**Пример использования:**
```javascript
import { cleanup } from './src/mcpOrchestrator.js';

// В конце работы приложения
cleanup();
```

## Конфигурация

### Переменные окружения

Создайте файл `.env` на основе `env.example`:

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

### Получение токенов

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

## Тестирование

### Тест всей системы

```bash
node test-orchestrator.js
```

### Тест реальной статистики

```bash
node test-stats.js
```

### Тест полного запуска

```bash
node test-run.js
```

### Тест отдельных серверов

```bash
# Тест GitHub сервера
cd minimal-push-mcp-server && node test-exegguto.js && cd ..

# Тест Telegram сервера
cd mcp-telegram-server && node test-telegram.js && cd ..
```

## Рабочий процесс

### Почасовая работа

1. Каждый час система запрашивает статистику пушей GitHub
2. Отправляет отчет в Telegram
3. Сохраняет данные для ежедневного отчета

### Ежедневная работа

1. В 22:00 - ежедневный отчет
2. В 10:00 - недельная статистика пушей

## Мониторинг

### Логи

Все компоненты используют структурированное логирование:

```bash
# Просмотр логов
docker-compose logs -f mcp-reporter
```

### Состояние

Состояние сохраняется в JSON файле:

```bash
# Просмотр состояния
cat data/state.json
```

## Docker

Система работает в одном контейнере:

- **mcp-reporter** - Основной оркестратор, который запускает MCP серверы как подпроцессы через stdio
  - Включает в себя GitHub MCP сервер для получения статистики пушей
  - Включает в себя Telegram MCP сервер для отправки сообщений
  - Координирует работу всех компонентов

### Быстрый запуск

```bash
# Запуск всех сервисов
./docker-start.sh

# Остановка всех сервисов
./docker-stop.sh

# Просмотр логов
./docker-logs.sh
```

### Детальное управление

```bash
# Сборка всех образов
docker-compose build --no-cache

# Запуск всех сервисов
docker-compose up -d

# Просмотр статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f

# Логи в реальном времени
./docker-logs.sh follow

# Остановка
docker-compose down
```

### Docker Compose

```yaml
version: '3.8'

services:
  # Main MCP Reporter Orchestrator (включает MCP серверы как подпроцессы)
  mcp-reporter:
    build: .
    container_name: mcp-reporter
    restart: unless-stopped
    volumes:
      - ./data:/data
    environment:
      - TG_BOT_TOKEN=${TG_BOT_TOKEN}
      - TG_CHAT_ID=${TG_CHAT_ID}
      - GITHUB_PAT=${GITHUB_PAT}
      - GITHUB_USER=${GITHUB_USER}
```

## Структура проекта

```
mcp-reporter/
├── src/
│   ├── index.js                 # Основное приложение
│   ├── mcpOrchestrator.js       # Оркестратор MCP серверов
│   ├── config.js                # Конфигурация
│   ├── logger.js                # Логирование
│   ├── storage.js               # Хранение состояния
│   └── time.js                  # Утилиты времени
├── minimal-push-mcp-server/     # MCP сервер для GitHub
├── mcp-telegram-server/         # MCP сервер для Telegram
├── data/                        # Данные состояния
├── docker-compose.yml           # Docker конфигурация
├── Dockerfile                   # Основной Dockerfile
├── build-all.sh                 # Скрипт сборки
├── test-orchestrator.js         # Тест оркестратора
└── README.md                    # Документация
```

## Ошибки и устранение неполадок

### Проблемы с подключением к MCP серверам

```bash
# Проверка доступности серверов
node test-orchestrator.js
```

### Проблемы с Telegram

```bash
# Проверка токена и chat_id
cd mcp-telegram-server && node test-telegram.js && cd ..
```

### Проблемы с GitHub

```bash
# Проверка GitHub PAT
cd minimal-push-mcp-server && node test-exegguto.js && cd ..
```

### Проблемы с Docker

```bash
# Пересборка образов
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Расширение системы

### Добавление нового MCP сервера

1. Создайте новый сервер в отдельной папке
2. Реализуйте MCP интерфейс
3. Добавьте подключение в `mcpOrchestrator.js`
4. Обновите Dockerfile

### Добавление новых инструментов

1. Добавьте инструмент в соответствующий MCP сервер
2. Обновите оркестратор для использования нового инструмента
3. Добавьте тесты

## Лицензия

MIT
