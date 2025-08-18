import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

async function testTelegramServer() {
  console.log("🚀 Тест MCP Telegram сервера\n");

  // Запускаем MCP сервер как подпроцесс
  const serverProcess = spawn("node", ["./dist/index.js"], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Создаем транспорт для клиента
  const transport = new StdioClientTransport(serverProcess.stdin, serverProcess.stdout);
  
  // Создаем MCP клиент
  const client = new Client({
    name: "test-telegram-client",
    version: "1.0.0",
  });

  try {
    // Подключаемся к серверу
    await client.connect(transport);
    console.log("✅ Подключение к MCP Telegram серверу установлено\n");

    // Получаем список доступных инструментов
    const tools = await client.listTools();
    console.log("📋 Доступные инструменты:");
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Тест 1: Отправка простого сообщения
    console.log("🔍 Тест 1: Отправка простого сообщения");
    
    const messageResult = await client.callTool({
      name: "send_message",
      arguments: {
        text: "🧪 Тестовое сообщение от MCP Telegram сервера\n\n⏰ Время: " + new Date().toLocaleString('ru-RU'),
        parse_mode: "Markdown"
      }
    });

    console.log("📊 Результат:");
    messageResult.content.forEach(content => {
      if (content.type === "text") {
        console.log(content.text);
      }
    });
    console.log("\n" + "=".repeat(60) + "\n");

    // Тест 2: Отправка статистики пушей
    console.log("🔍 Тест 2: Отправка статистики пушей");
    
    const statsResult = await client.callTool({
      name: "send_push_stats",
      arguments: {
        username: "exegguto",
        days: 1
      }
    });

    console.log("📊 Результат:");
    statsResult.content.forEach(content => {
      if (content.type === "text") {
        console.log(content.text);
      }
    });
    console.log("\n" + "=".repeat(60) + "\n");

    // Тест 3: Отправка почасового отчета
    console.log("🔍 Тест 3: Отправка почасового отчета");
    
    const hourlyResult = await client.callTool({
      name: "send_hourly_report",
      arguments: {
        username: "exegguto"
      }
    });

    console.log("📊 Результат:");
    hourlyResult.content.forEach(content => {
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

// Обработка ошибок
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка:', error);
  process.exit(1);
});

testTelegramServer();
