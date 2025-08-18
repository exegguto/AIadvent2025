import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

async function testPushServer() {
  console.log("🚀 Запуск тестового клиента для MCP сервера пушей...\n");

  // Запускаем MCP сервер как подпроцесс
  const serverProcess = spawn("node", ["dist/index.js"], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Создаем транспорт для клиента
  const transport = new StdioClientTransport(serverProcess.stdin, serverProcess.stdout);
  
  // Создаем MCP клиент
  const client = new Client({
    name: "test-client",
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

    // Тестируем получение количества пушей
    console.log("🔍 Тестируем получение количества пушей для пользователя 'octocat'...");
    
    const result = await client.callTool({
      name: "get_push_count",
      arguments: {
        username: "octocat",
        days: 7
      }
    });

    console.log("📊 Результат:");
    result.content.forEach(content => {
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
    console.log("\n🏁 Тест завершен");
  }
}

// Обработка ошибок сервера
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка:', error);
  process.exit(1);
});

testPushServer();
