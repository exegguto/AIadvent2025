import { getPushStats, sendPushStatsToTelegram, cleanup } from './src/mcpOrchestrator.js';

async function testStats() {
  console.log("🚀 D09 - Тест реальной статистики пушей\n");

  try {
    const username = 'exegguto';
    
    console.log("📊 Получение статистики пушей GitHub...");
    const pushStats = await getPushStats(username, 1);
    
    if (pushStats) {
      console.log("✅ Статистика получена:");
      console.log("=".repeat(60));
      console.log(pushStats);
      console.log("=".repeat(60));
      
      console.log("\n📱 Отправка статистики в Telegram...");
      const result = await sendPushStatsToTelegram(username, 1);
      console.log("✅ Результат отправки:", result ? "Успешно" : "Ошибка");
    } else {
      console.log("❌ Статистика не получена");
    }
    
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

testStats();
