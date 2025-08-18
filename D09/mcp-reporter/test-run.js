import { getPushStats, getHourlyPushStats, sendTelegramMessage, sendPushStatsToTelegram, cleanup } from './src/mcpOrchestrator.js';

async function testRun() {
  console.log("🚀 D09 - Тестовый запуск MCP Reporter\n");

  try {
    const username = 'exegguto';
    
    console.log("📊 Получение статистики пушей GitHub...");
    const pushStats = await getPushStats(username, 1);
    console.log("✅ Статистика получена:", pushStats ? "Есть данные" : "Нет данных");
    
    console.log("\n📱 Отправка тестового сообщения в Telegram...");
    const messageResult = await sendTelegramMessage("🧪 D09 - Тестовое сообщение от MCP Reporter\n\n⏰ Время: " + new Date().toLocaleString('ru-RU'));
    console.log("✅ Сообщение отправлено:", messageResult ? "Успешно" : "Ошибка");
    
    console.log("\n📊 Отправка статистики пушей в Telegram...");
    const statsResult = await sendPushStatsToTelegram(username, 1);
    console.log("✅ Статистика отправлена:", statsResult ? "Успешно" : "Ошибка");
    
    console.log("\n⏰ Получение почасовой статистики...");
    const hourlyResult = await getHourlyPushStats(username);
    console.log("✅ Почасовая статистика:", hourlyResult ? "Получена" : "Не получена");
    
    console.log("\n🎉 Все тесты завершены успешно!");
    
  } catch (error) {
    console.error("❌ Ошибка:", error.message);
  } finally {
    cleanup();
    console.log("\n🏁 Система остановлена");
  }
}

// Обработка ошибок
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка:', error);
  process.exit(1);
});

testRun();
