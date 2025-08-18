import { spawn } from "child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testExegguto() {
  console.log("🚀 Тест MCP сервера для аккаунта exegguto\n");

  // Создаем транспорт
  const transport = new StdioClientTransport({
    command: "node",
    args: ["./dist/index.js"],
  });
  
  // Создаем клиент
  const client = new Client({
    name: "exegguto-test-client",
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

    // Тест 1: Статистика пушей за последние 7 дней
    console.log("🔍 Тест 1: Статистика пушей для 'exegguto' за последние 7 дней");
    const pushResult = await client.callTool({
      name: "get_push_count",
      arguments: {
        username: "exegguto",
        days: 7
      }
    });

    console.log("📊 Результат:");
    pushResult.content.forEach(content => {
      if (content.type === "text") {
        console.log(content.text);
      }
    });
    console.log("\n" + "=".repeat(60) + "\n");

    // Тест 2: Общая статистика пользователя
    console.log("🔍 Тест 2: Общая статистика пользователя 'exegguto'");
    const userResult = await client.callTool({
      name: "get_user_stats",
      arguments: {
        username: "exegguto"
      }
    });

    console.log("📊 Результат:");
    userResult.content.forEach(content => {
      if (content.type === "text") {
        console.log(content.text);
      }
    });
    console.log("\n" + "=".repeat(60) + "\n");

    // Тест 3: Статистика за 30 дней
    console.log("🔍 Тест 3: Статистика пушей за 30 дней");
    const longTermResult = await client.callTool({
      name: "get_push_count",
      arguments: {
        username: "exegguto",
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
    await client.close();
    console.log("\n🏁 Тест завершен");
  }
}

testExegguto().catch(console.error);
