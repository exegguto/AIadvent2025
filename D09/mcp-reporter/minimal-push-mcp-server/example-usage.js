import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

async function exampleUsage() {
  console.log("🚀 Пример использования минимального MCP сервера для пушей\n");

  // Запускаем MCP сервер как подпроцесс
  const serverProcess = spawn("node", ["./dist/index.js"], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Создаем транспорт для клиента
  const transport = new StdioClientTransport(serverProcess.stdin, serverProcess.stdout);
  
  // Создаем MCP клиент
  const client = new Client({
    name: "example-client",
    version: "1.0.0",
  });

  try {
    // Подключаемся к серверу
    await client.connect(transport);
    console.log("✅ Подключение к MCP серверу установлено\n");

    // Получаем список доступных инструментов
    const tools = await client.listTools();
    console.log("📋 Доступные инструменты:");
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Пример 1: Получаем статистику пушей для известного пользователя
    console.log("🔍 Пример 1: Статистика пушей для 'octocat' за последние 7 дней");
    
    const pushResult = await client.callTool({
      name: "get_push_count",
      arguments: {
        username: "octocat",
        days: 7
      }
    });

    console.log("📊 Результат:");
    pushResult.content.forEach(content => {
      if (content.type === "text") {
        console.log(content.text);
      }
    });
    console.log("\n" + "=".repeat(50) + "\n");

    // Пример 2: Получаем общую статистику пользователя
    console.log("🔍 Пример 2: Общая статистика пользователя 'octocat'");
    
    const userResult = await client.callTool({
      name: "get_user_stats",
      arguments: {
        username: "octocat"
      }
    });

    console.log("📊 Результат:");
    userResult.content.forEach(content => {
      if (content.type === "text") {
        console.log(content.text);
      }
    });
    console.log("\n" + "=".repeat(50) + "\n");

    // Пример 3: Статистика за 30 дней
    console.log("🔍 Пример 3: Статистика пушей за 30 дней");
    
    const longTermResult = await client.callTool({
      name: "get_push_count",
      arguments: {
        username: "octocat",
        days: 30
      }
    });

    console.log("📊 Результат:");
    longTermResult.content.forEach(content => {
      if (content.type === "text") {
        console.log(content.text);
      }
    });

  } catch (error) {
    console.error("❌ Ошибка:", error.message);
  } finally {
    // Закрываем соединение и завершаем процесс
    await client.close();
    serverProcess.kill();
    console.log("\n🏁 Пример завершен");
  }
}

// Обработка ошибок
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка:', error);
  process.exit(1);
});

exampleUsage();
