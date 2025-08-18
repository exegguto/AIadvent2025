# MCP Telegram Server

MCP сервер для отправки сообщений в Telegram через Model Context Protocol.

## Описание

Сервер предоставляет инструменты для отправки различных типов сообщений в Telegram чаты, включая статистику пушей GitHub и почасовые отчеты.

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

#### 1. `send_message`

Отправляет произвольное сообщение в Telegram чат.

**Параметры:**
- `text` (string, обязательный) - Текст сообщения для отправки
- `chat_id` (string, опциональный) - ID чата (если не указан, используется TG_CHAT_ID из переменных окружения)
- `parse_mode` (string, опциональный) - Режим парсинга (Markdown, HTML, или plain text, по умолчанию: Markdown)

**Пример запроса:**
```json
{
  "name": "send_message",
  "arguments": {
    "text": "Привет, мир!",
    "parse_mode": "Markdown"
  }
}
```

**Пример ответа:**
```
✅ Сообщение успешно отправлено в Telegram

📝 Текст: Привет, мир!
💬 Chat ID: -1001234567890
```

#### 2. `send_push_stats`

Отправляет статистику пушей в Telegram (заглушка).

**Параметры:**
- `username` (string, обязательный) - GitHub username для получения статистики
- `days` (number, опциональный) - Количество дней для анализа (по умолчанию: 1)
- `chat_id` (string, опциональный) - ID чата (если не указан, используется TG_CHAT_ID из переменных окружения)

**Пример запроса:**
```json
{
  "name": "send_push_stats",
  "arguments": {
    "username": "exegguto",
    "days": 7
  }
}
```

**Пример ответа:**
```
✅ Статистика пушей отправлена в Telegram

👤 Пользователь: exegguto
📅 Период: 7 дней
```

#### 3. `send_hourly_report`

Отправляет почасовой отчет в Telegram (заглушка).

**Параметры:**
- `username` (string, обязательный) - GitHub username для получения статистики
- `chat_id` (string, опциональный) - ID чата (если не указан, используется TG_CHAT_ID из переменных окружения)

**Пример запроса:**
```json
{
  "name": "send_hourly_report",
  "arguments": {
    "username": "exegguto"
  }
}
```

**Пример ответа:**
```
✅ Почасовой отчет отправлен в Telegram

👤 Пользователь: exegguto
🕐 Время: 02:32
```

## Конфигурация

### Переменные окружения

- `TG_BOT_TOKEN` или `TELEGRAM_BOT_TOKEN` - Telegram Bot Token
- `TG_CHAT_ID` или `TELEGRAM_CHAT_ID` - ID чата для отправки сообщений

### Пример настройки

```bash
export TG_BOT_TOKEN="your_telegram_bot_token_here"
export TG_CHAT_ID="your_chat_id_here"
```

## Тестирование

### Тест Telegram сервера

```bash
node test-telegram.js
```

## Особенности

### Поддержка Markdown

Сервер поддерживает Markdown форматирование для сообщений:

```markdown
**Жирный текст**
*Курсив*
`Код`
[Ссылка](https://example.com)
```

### Автоматическое определение chat_id

Если `chat_id` не указан в параметрах, сервер использует значение из переменной окружения `TG_CHAT_ID`.

### Обработка ошибок

Сервер предоставляет детальную информацию об ошибках:

- Неверный Bot Token
- Неверный Chat ID
- Ошибки сети
- Ограничения Telegram API

## Ошибки

### HTTP 401 - Unauthorized
```
❌ Ошибка при отправке сообщения в Telegram: Неверный Telegram Bot Token
```

### HTTP 400 - Bad Request
```
❌ Ошибка при отправке сообщения в Telegram: Неверный Chat ID или формат сообщения
```

### Missing Configuration
```
❌ Telegram Bot Token не настроен. Установите переменную окружения TG_BOT_TOKEN или TELEGRAM_BOT_TOKEN
```

```
❌ Chat ID не указан. Укажите chat_id в параметрах или установите переменную окружения TG_CHAT_ID
```

## Docker

Соберите и запустите с помощью Docker:

```bash
docker build -t mcp-telegram-server .
docker run --rm -e TG_BOT_TOKEN=your_token -e TG_CHAT_ID=your_chat_id mcp-telegram-server
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

## Ограничения

- Требует валидный Telegram Bot Token
- Требует валидный Chat ID
- Поддерживает только текстовые сообщения
- Ограничения Telegram API по частоте отправки (30 сообщений в секунду)

## Безопасность

- Bot Token должен храниться в переменных окружения
- Chat ID должен быть валидным
- Рекомендуется использовать приватные чаты для конфиденциальной информации

## Лицензия

MIT
