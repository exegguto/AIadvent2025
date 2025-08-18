# Minimal Push MCP Server

MCP сервер для получения статистики пушей GitHub через Model Context Protocol.

## Описание

Сервер предоставляет инструменты для получения статистики активности пользователей GitHub, включая количество пушей, коммитов и информацию о репозиториях.

## Установка

```bash
npm install
```

## Сборка

```bash
npm run build
```

## Запуск

```bash
# Для разработки
npm run dev

# Для продакшена
npm start
```

## API Reference

### Инструменты (Tools)

#### 1. `get_push_count`

Получает статистику пушей для указанного пользователя GitHub.

**Параметры:**
- `username` (string, обязательный) - GitHub username для получения данных о пушах
- `days` (number, опциональный) - Количество дней для анализа (по умолчанию: 7)
- `include_private` (boolean, опциональный) - Включать приватные репозитории (требует GitHub PAT, по умолчанию: false)

**Пример запроса:**
```json
{
  "name": "get_push_count",
  "arguments": {
    "username": "exegguto",
    "days": 1,
    "include_private": false
  }
}
```

**Пример ответа для почасового отчета (days=1):**
```
D09

📊 Статистика пушей для пользователя **exegguto** за последний час:

🔢 **Количество пушей:** 12
📅 **Период:** с 2025-08-18 01:00 по 2025-08-18 02:00
```

**Пример ответа для долгосрочного отчета (days=7):**
```
D09

📊 Статистика пушей для пользователя **exegguto** за последние 7 дней:

🔢 **Количество пушей:** 45
📝 **Общее количество коммитов:** 67
📈 **Общее количество событий:** 89
📊 **Процент пушей:** 50.6%

🏆 **Топ репозиториев по пушам:**
1. `exegguto/AIadvent2025` - 23 пушей
2. `exegguto/other-repo` - 12 пушей

📅 Период: с 2025-08-11 по 2025-08-18
🔐 Используется GitHub PAT (включая приватные репозитории)
```

#### 2. `get_user_stats`

Получает общую статистику пользователя GitHub.

**Параметры:**
- `username` (string, обязательный) - GitHub username

**Пример запроса:**
```json
{
  "name": "get_user_stats",
  "arguments": {
    "username": "exegguto"
  }
}
```

**Пример ответа:**
```
👤 **Информация о пользователе exegguto:**

📊 **Публичные репозитории:** 15
👥 **Подписчики:** 42
👤 **Подписки:** 23
⭐ **Звезды:** 8
📅 **Дата регистрации:** 01.01.2020
📝 **Биография:** Full-stack developer
📍 **Местоположение:** Moscow, Russia
```

## Конфигурация

### Переменные окружения

- `GITHUB_PAT` или `GITHUB_TOKEN` - GitHub Personal Access Token для доступа к приватным репозиториям

### Пример настройки

```bash
export GITHUB_PAT="your_github_personal_access_token_here"
```

## Тестирование

### Тест с известным пользователем

```bash
node test-exegguto.js
```

### Простой тест

```bash
node simple-test.js
```

### Тест клиента

```bash
node test-client.js
```

## Особенности

### Почасовые отчеты (days=1)

- Показывает статистику за последний завершенный час
- Фильтрует события по времени создания
- Отображает только количество пушей и период
- Формат: "с YYYY-MM-DD HH:00 по YYYY-MM-DD HH:00"

### Долгосрочные отчеты (days>1)

- Показывает детальную статистику за указанный период
- Включает количество коммитов, событий, процент пушей
- Отображает топ репозиториев по количеству пушей
- Показывает информацию о использовании GitHub PAT

### Ограничения GitHub API

- Без токена: только публичные репозитории, лимит 60 запросов/час
- С токеном: доступ к приватным репозиториям, лимит 5000 запросов/час

## Ошибки

### HTTP 403 - Rate Limit Exceeded
```
❌ Ошибка при получении данных о пушах: Превышен лимит запросов к GitHub API. Попробуйте позже или используйте GitHub PAT.
```

### HTTP 404 - User Not Found
```
❌ Ошибка при получении данных о пушах: Пользователь не найден
```

### Missing GitHub PAT
```
❌ Для доступа к приватным репозиториям требуется GitHub Personal Access Token (GITHUB_PAT)
```

## Docker

Соберите и запустите с помощью Docker:

```bash
docker build -t minimal-push-mcp-server .
docker run --rm -e GITHUB_PAT=your_token minimal-push-mcp-server
```

## Интеграция с MCP клиентом

Сервер использует stdio транспорт и может быть интегрирован с любым MCP клиентом:

```javascript
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['./dist/index.js']
});

const client = new Client({
  name: 'mcp-client',
  version: '1.0.0'
});

await client.connect(transport);
```

## Лицензия

MIT
