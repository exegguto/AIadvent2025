# Minimal Push MCP Server

Минимальный MCP сервер на TypeScript для получения количества пушей пользователя GitHub.

## Возможности

- Получение количества пушей за указанный период
- Статистика по событиям GitHub
- Анализ топ репозиториев по активности
- Поддержка GitHub Personal Access Token для приватных репозиториев
- Общая статистика пользователя GitHub
- Простой и легкий в использовании

## Установка

```bash
cd minimal-push-mcp-server
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

## Использование

Сервер предоставляет два инструмента:

### `get_push_count`

Получает количество пушей для указанного пользователя GitHub.

**Параметры:**
- `username` (string, обязательный) - GitHub username
- `days` (number, опциональный) - Количество дней для анализа (по умолчанию: 7)
- `include_private` (boolean, опциональный) - Включать приватные репозитории (требует GitHub PAT)

**Пример использования:**
```json
{
  "name": "get_push_count",
  "arguments": {
    "username": "octocat",
    "days": 30,
    "include_private": false
  }
}
```

### `get_user_stats`

Получает общую статистику пользователя GitHub.

**Параметры:**
- `username` (string, обязательный) - GitHub username

**Пример использования:**
```json
{
  "name": "get_user_stats",
  "arguments": {
    "username": "octocat"
  }
}
```

## Конфигурация

### Переменные окружения

- `GITHUB_PAT` или `GITHUB_TOKEN` - GitHub Personal Access Token для доступа к приватным репозиториям

### Пример настройки

```bash
export GITHUB_PAT="your_github_personal_access_token_here"
```

## Тестирование

Запустите пример использования:

```bash
node example-usage.js
```

## Интеграция с MCP клиентом

Сервер использует stdio транспорт и может быть интегрирован с любым MCP клиентом.

## Ограничения

- Использует GitHub API (ограничения по rate limit: 60 запросов/час для публичного API, 5000/час с PAT)
- Получает только последние 100 событий за запрос
- Требует валидный GitHub username
- Для приватных репозиториев требуется GitHub Personal Access Token

## Docker

Соберите и запустите с помощью Docker:

```bash
docker build -t minimal-push-mcp-server .
docker run --rm minimal-push-mcp-server
```

## Лицензия

MIT
