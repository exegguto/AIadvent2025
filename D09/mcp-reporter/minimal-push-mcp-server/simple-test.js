import { spawn } from "child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function simpleTest() {
  console.log("🚀 Простой тест MCP сервера для пушей\n");

  // Создаем транспорт
  const transport = new StdioClientTransport({
    command: "node",
    args: ["./dist/index.js"],
  });
  
  // Создаем клиент
  const client = new Client({
    name: "simple-test-client",
    version: "1.0.0",
  });

  try {
    // Подключаемся
    await client.connect(transport);
    console.log("✅ Подключение установлено\n");

    // Получаем список инструментов
    const tools = await client.listTools();
    console.log("📋 Доступные инструменты:");
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Тестируем получение статистики пушей
    console.log("🔍 Тестируем get_push_count...");
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
    await client.close();
    console.log("\n🏁 Тест завершен");
  }
}

simpleTest().catch(console.error);
