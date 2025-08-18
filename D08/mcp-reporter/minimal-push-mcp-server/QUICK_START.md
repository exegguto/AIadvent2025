# Быстрый старт

## 1. Настройка GitHub Personal Access Token

1. Перейдите на [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Нажмите "Generate new token (classic)"
3. Выберите разрешения:
   - `public_repo` (для публичных репозиториев)
   - `repo` (для приватных репозиториев)
   - `read:user` (для информации о пользователе)
4. Скопируйте токен

## 2. Настройка .env файла

Отредактируйте файл `.env` и замените placeholder на ваш токен:

```bash
# GitHub Configuration
GITHUB_USER=exegguto
GITHUB_PAT=ghp_your_actual_token_here
```

## 3. Запуск

```bash
# Установка зависимостей
npm install

# Сборка
npm run build

# Тест с вашим аккаунтом
node test-exegguto.js
```

## 4. Использование в других проектах

MCP сервер можно интегрировать в любые приложения, поддерживающие Model Context Protocol:

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["./path/to/minimal-push-mcp-server/dist/index.js"],
});

const client = new Client({
  name: "my-app",
  version: "1.0.0",
});

await client.connect(transport);

// Получить статистику пушей
const result = await client.callTool({
  name: "get_push_count",
  arguments: {
    username: "exegguto",
    days: 7
  }
});
```

## Доступные инструменты

- `get_push_count` - статистика пушей за период
- `get_user_stats` - общая информация о пользователе
