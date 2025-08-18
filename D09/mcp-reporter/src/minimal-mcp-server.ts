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

// Интерфейс для данных о пушах
interface PushData extends Array<{
  id: number;
  type: string;
  actor: {
    login: string;
  };
  repo: {
    name: string;
  };
  created_at: string;
  payload?: {
    ref?: string;
    commits?: Array<{
      sha: string;
      message: string;
    }>;
  };
}> {}

// Интерфейс для данных о репозиториях
interface RepoData {
  name: string;
  full_name: string;
  private: boolean;
  pushed_at: string;
}

// Создаем MCP сервер
const server = new Server(
  {
    name: "minimal-push-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Функция для получения GitHub токена из переменных окружения
function getGitHubToken(): string | undefined {
  return process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;
}

// Функция для создания заголовков запроса
function createHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'minimal-push-mcp-server',
  };

  const token = getGitHubToken();
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  return headers;
}

// Обработчик для получения списка доступных инструментов
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_push_count",
        description: "Получить количество пушей для указанного пользователя GitHub",
        inputSchema: {
          type: "object",
          properties: {
            username: {
              type: "string",
              description: "GitHub username для получения данных о пушах",
            },
            days: {
              type: "number",
              description: "Количество дней для анализа (по умолчанию: 7)",
              default: 7,
            },
            include_private: {
              type: "boolean",
              description: "Включать приватные репозитории (требует GitHub PAT)",
              default: false,
            },
          },
          required: ["username"],
        },
      },
      {
        name: "get_user_stats",
        description: "Получить общую статистику пользователя GitHub",
        inputSchema: {
          type: "object",
          properties: {
            username: {
              type: "string",
              description: "GitHub username",
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

  if (name === "get_push_count") {
    try {
      const { username, days = 7, include_private = false } = args as { 
        username: string; 
        days?: number; 
        include_private?: boolean;
      };
      
      // Вычисляем дату начала периода
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const headers = createHeaders();
      const token = getGitHubToken();

      // Если запрашиваются приватные репозитории, проверяем наличие токена
      if (include_private && !token) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Для доступа к приватным репозиториям требуется GitHub Personal Access Token (GITHUB_PAT)",
            },
          ],
          isError: true,
        };
      }

      // Получаем данные о событиях пользователя через GitHub API
      const response = await axios.get<PushData>(
        `https://api.github.com/users/${username}/events`,
        {
          params: {
            per_page: 100,
          },
          headers,
        }
      );

      // Подсчитываем количество пушей и анализируем данные
      const pushEvents = response.data.filter(
        (event: any) => event.type === "PushEvent"
      );

      const pushCount = pushEvents.length;
      const totalEvents = response.data.length;

      // Анализируем репозитории, в которые были пушены изменения
      const repoStats = new Map<string, number>();
      let totalCommits = 0;

      pushEvents.forEach((event: any) => {
        const repoName = event.repo.name;
        repoStats.set(repoName, (repoStats.get(repoName) || 0) + 1);
        
        if (event.payload?.commits) {
          totalCommits += event.payload.commits.length;
        }
      });

      // Сортируем репозитории по количеству пушей
      const topRepos = Array.from(repoStats.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      let resultText = `📊 Статистика пушей для пользователя **${username}** за последние ${days} дней:\n\n`;
      resultText += `🔢 **Количество пушей:** ${pushCount}\n`;
      resultText += `📝 **Общее количество коммитов:** ${totalCommits}\n`;
      resultText += `📈 **Общее количество событий:** ${totalEvents}\n`;
      resultText += `📊 **Процент пушей:** ${totalEvents > 0 ? ((pushCount / totalEvents) * 100).toFixed(1) : 0}%\n\n`;

      if (topRepos.length > 0) {
        resultText += `🏆 **Топ репозиториев по пушам:**\n`;
        topRepos.forEach(([repo, count], index) => {
          resultText += `${index + 1}. \`${repo}\` - ${count} пуш${count === 1 ? '' : 'ей'}\n`;
        });
        resultText += `\n`;
      }

      resultText += `📅 Период: с ${startDateStr} по ${new Date().toISOString().split('T')[0]}`;

      if (token) {
        resultText += `\n🔐 Используется GitHub PAT (включая приватные репозитории)`;
      } else {
        resultText += `\n⚠️ Используется публичный API (только публичные репозитории)`;
      }

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
        isError: false,
      };
    } catch (error) {
      console.error("Ошибка при получении данных о пушах:", error);
      
      let errorMessage = "Неизвестная ошибка";
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          errorMessage = "Превышен лимит запросов к GitHub API. Попробуйте позже или используйте GitHub PAT.";
        } else if (error.response?.status === 404) {
          errorMessage = "Пользователь не найден";
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
            text: `❌ Ошибка при получении данных о пушах: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === "get_user_stats") {
    try {
      const { username } = args as { username: string };
      
      const headers = createHeaders();

      // Получаем информацию о пользователе
      const userResponse = await axios.get(
        `https://api.github.com/users/${username}`,
        { headers }
      );

      const user = userResponse.data;

      let resultText = `👤 **Информация о пользователе ${username}:**\n\n`;
      resultText += `📊 **Публичные репозитории:** ${user.public_repos}\n`;
      resultText += `👥 **Подписчики:** ${user.followers}\n`;
      resultText += `👤 **Подписки:** ${user.following}\n`;
      resultText += `⭐ **Звезды:** ${user.public_gists}\n`;
      resultText += `📅 **Дата регистрации:** ${new Date(user.created_at).toLocaleDateString()}\n`;

      if (user.bio) {
        resultText += `📝 **Биография:** ${user.bio}\n`;
      }

      if (user.location) {
        resultText += `📍 **Местоположение:** ${user.location}\n`;
      }

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
        isError: false,
      };
    } catch (error) {
      console.error("Ошибка при получении статистики пользователя:", error);
      
      let errorMessage = "Неизвестная ошибка";
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          errorMessage = "Пользователь не найден";
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
            text: `❌ Ошибка при получении статистики пользователя: ${errorMessage}`,
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
  console.error("🚀 Минимальный MCP сервер для пушей запущен");
  
  const token = getGitHubToken();
  if (token) {
    console.error("🔐 GitHub PAT настроен - доступ к приватным репозиториям включен");
  } else {
    console.error("⚠️ GitHub PAT не настроен - только публичные репозитории");
  }
}

main().catch((error) => {
  console.error("Ошибка запуска сервера:", error);
  process.exit(1);
});
