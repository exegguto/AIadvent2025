import { getPushStats, getHourlyPushStats, sendTelegramMessage, sendPushStatsToTelegram, cleanup } from './src/mcpOrchestrator.js';

async function testOrchestrator() {
  console.log("🚀 Тест MCP оркестратора\n");

  try {
    const username = process.env.GITHUB_USER || 'exegguto';
    
    // Тест 1: Получение статистики пушей
    console.log("🔍 Тест 1: Получение статистики пушей");
    const pushStats = await getPushStats(username, 1);
    console.log("📊 Результат:", pushStats ? "Статистика получена" : "Статистика не найдена");
    console.log("\n" + "=".repeat(60) + "\n");

    // Тест 2: Отправка сообщения в Telegram
    console.log("🔍 Тест 2: Отправка сообщения в Telegram");
    const messageResult = await sendTelegramMessage("🧪 Тестовое сообщение от MCP оркестратора\n\n⏰ Время: " + new Date().toLocaleString('ru-RU'));
    console.log("📊 Результат:", messageResult ? "Сообщение отправлено" : "Ошибка отправки");
    console.log("\n" + "=".repeat(60) + "\n");

    // Тест 3: Отправка статистики пушей в Telegram
    console.log("🔍 Тест 3: Отправка статистики пушей в Telegram");
    const statsResult = await sendPushStatsToTelegram(username, 1);
    console.log("📊 Результат:", statsResult ? "Статистика отправлена" : "Ошибка отправки");
    console.log("\n" + "=".repeat(60) + "\n");

    // Тест 4: Получение почасовой статистики
    console.log("🔍 Тест 4: Получение почасовой статистики");
    const hourlyResult = await getHourlyPushStats(username);
    console.log("📊 Результат:", hourlyResult ? "Почасовая статистика получена" : "Почасовая статистика не найдена");

  } catch (error) {
    console.error("❌ Ошибка:", error.message);
  } finally {
    cleanup();
    console.log("\n🏁 Тест завершен");
  }
}

// Обработка ошибок
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка:', error);
  process.exit(1);
});

testOrchestrator();
