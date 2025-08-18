import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosError } from "axios";
import { readFileSync } from "fs";
import { join } from "path";

// Загружаем переменные окружения из .env файла
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    // .env файл не найден или не может быть прочитан - это нормально
  }
}

// Загружаем .env файл при запуске
loadEnvFile();

// Интерфейс для ответа Telegram API
interface TelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
}

// Создаем MCP сервер
const server = new Server(
  {
    name: "mcp-telegram-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Функция для получения Telegram токена из переменных окружения
function getTelegramToken(): string | undefined {
  return process.env.TG_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
}

// Функция для получения Telegram Chat ID из переменных окружения
function getTelegramChatId(): string | undefined {
  return process.env.TG_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
}

// Обработчик для получения списка доступных инструментов
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "send_message",
        description: "Отправить сообщение в Telegram чат",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Текст сообщения для отправки",
            },
            chat_id: {
              type: "string",
              description: "ID чата (если не указан, используется TG_CHAT_ID из переменных окружения)",
            },
            parse_mode: {
              type: "string",
              description: "Режим парсинга (Markdown, HTML, или plain text)",
              enum: ["Markdown", "HTML", "text"],
              default: "Markdown",
            },
          },
          required: ["text"],
        },
      },
      {
        name: "send_push_stats",
        description: "Отправить статистику пушей в Telegram",
        inputSchema: {
          type: "object",
          properties: {
            username: {
              type: "string",
              description: "GitHub username для получения статистики",
            },
            days: {
              type: "number",
              description: "Количество дней для анализа",
              default: 1,
            },
            chat_id: {
              type: "string",
              description: "ID чата (если не указан, используется TG_CHAT_ID из переменных окружения)",
            },
          },
          required: ["username"],
        },
      },
      {
        name: "send_hourly_report",
        description: "Отправить почасовой отчет в Telegram",
        inputSchema: {
          type: "object",
          properties: {
            username: {
              type: "string",
              description: "GitHub username для получения статистики",
            },
            chat_id: {
              type: "string",
              description: "ID чата (если не указан, используется TG_CHAT_ID из переменных окружения)",
            },
          },
          required: ["username"],
        },
      },
    ],
  };
});

// Обработчик для выполнения инструмента
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  if (name === "send_message") {
    try {
      const { text, chat_id, parse_mode = "Markdown" } = args as { 
        text: string; 
        chat_id?: string; 
        parse_mode?: string;
      };
      
      const token = getTelegramToken();
      const targetChatId = chat_id || getTelegramChatId();

      if (!token) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Telegram Bot Token не настроен. Установите переменную окружения TG_BOT_TOKEN или TELEGRAM_BOT_TOKEN",
            },
          ],
          isError: true,
        };
      }

      if (!targetChatId) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Chat ID не указан. Укажите chat_id в параметрах или установите переменную окружения TG_CHAT_ID",
            },
          ],
          isError: true,
        };
      }

      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const payload: any = {
        chat_id: targetChatId,
        text: text,
      };

      if (parse_mode !== "text") {
        payload.parse_mode = parse_mode;
      }

      const response = await axios.post<TelegramResponse>(url, payload);

      if (response.data.ok) {
        return {
          content: [
            {
              type: "text",
              text: `✅ Сообщение успешно отправлено в Telegram\n\n📝 Текст: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}\n💬 Chat ID: ${targetChatId}`,
            },
          ],
          isError: false,
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ Ошибка отправки сообщения: ${response.data.description}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error("Ошибка при отправке сообщения в Telegram:", error);
      
      let errorMessage = "Неизвестная ошибка";
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = "Неверный Telegram Bot Token";
        } else if (error.response?.status === 400) {
          errorMessage = "Неверный Chat ID или формат сообщения";
        } else {
          errorMessage = `HTTP ${error.response?.status}: ${error.response?.statusText}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        content: [
          {
            type: "text",
            text: `❌ Ошибка при отправке сообщения в Telegram: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === "send_push_stats") {
    try {
      const { username, days = 1, chat_id } = args as { 
        username: string; 
        days?: number; 
        chat_id?: string;
      };
      
      const token = getTelegramToken();
      const targetChatId = chat_id || getTelegramChatId();

      if (!token) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Telegram Bot Token не настроен",
            },
          ],
          isError: true,
        };
      }

      if (!targetChatId) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Chat ID не указан",
            },
          ],
          isError: true,
        };
      }

      // Формируем сообщение со статистикой
      const now = new Date();
      const timeStr = now.toLocaleString('ru-RU', { 
        timeZone: 'Europe/Moscow',
        hour: '2-digit', 
        minute: '2-digit' 
      });

      let message = `📊 **Статистика пушей GitHub**\n\n`;
      message += `👤 **Пользователь:** ${username}\n`;
      message += `📅 **Период:** последние ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}\n`;
      message += `⏰ **Время отчета:** ${timeStr}\n\n`;
      message += `ℹ️ Для получения детальной статистики используйте minimal-push-mcp-server`;

      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await axios.post<TelegramResponse>(url, {
        chat_id: targetChatId,
        text: `D09\n\n${message}`,
        parse_mode: "Markdown"
      });

      if (response.data.ok) {
        return {
          content: [
            {
              type: "text",
              text: `✅ Статистика пушей отправлена в Telegram\n\n👤 Пользователь: ${username}\n📅 Период: ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`,
            },
          ],
          isError: false,
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ Ошибка отправки статистики: ${response.data.description}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error("Ошибка при отправке статистики пушей:", error);
      
      let errorMessage = "Неизвестная ошибка";
      if (axios.isAxiosError(error)) {
        errorMessage = `HTTP ${error.response?.status}: ${error.response?.statusText}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        content: [
          {
            type: "text",
            text: `❌ Ошибка при отправке статистики пушей: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === "send_hourly_report") {
    try {
      const { username, chat_id } = args as { 
        username: string; 
        chat_id?: string;
      };
      
      const token = getTelegramToken();
      const targetChatId = chat_id || getTelegramChatId();

      if (!token) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Telegram Bot Token не настроен",
            },
          ],
          isError: true,
        };
      }

      if (!targetChatId) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Chat ID не указан",
            },
          ],
          isError: true,
        };
      }

      // Формируем почасовой отчет
      const now = new Date();
      const timeStr = now.toLocaleString('ru-RU', { 
        timeZone: 'Europe/Moscow',
        hour: '2-digit', 
        minute: '2-digit' 
      });

      let message = `⏰ **Почасовой отчет**\n\n`;
      message += `👤 **Пользователь:** ${username}\n`;
      message += `🕐 **Время:** ${timeStr}\n`;
      message += `📊 **Статус:** Запрос статистики за последний час\n\n`;
      message += `ℹ️ Для получения детальной статистики используйте minimal-push-mcp-server`;

      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await axios.post<TelegramResponse>(url, {
        chat_id: targetChatId,
        text: `D09\n\n${message}`,
        parse_mode: "Markdown"
      });

      if (response.data.ok) {
        return {
          content: [
            {
              type: "text",
              text: `✅ Почасовой отчет отправлен в Telegram\n\n👤 Пользователь: ${username}\n🕐 Время: ${timeStr}`,
            },
          ],
          isError: false,
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ Ошибка отправки отчета: ${response.data.description}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error("Ошибка при отправке почасового отчета:", error);
      
      let errorMessage = "Неизвестная ошибка";
      if (axios.isAxiosError(error)) {
        errorMessage = `HTTP ${error.response?.status}: ${error.response?.statusText}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        content: [
          {
            type: "text",
            text: `❌ Ошибка при отправке почасового отчета: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Неизвестный инструмент: ${name}`);
});

// Запускаем сервер
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 MCP Telegram сервер запущен");
  
  const token = getTelegramToken();
  const chatId = getTelegramChatId();
  
  if (token) {
    console.error("🔐 Telegram Bot Token настроен");
  } else {
    console.error("⚠️ Telegram Bot Token не настроен");
  }
  
  if (chatId) {
    console.error("💬 Chat ID настроен");
  } else {
    console.error("⚠️ Chat ID не настроен");
  }
}

main().catch((error) => {
  console.error("Ошибка запуска сервера:", error);
  process.exit(1);
});
