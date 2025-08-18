import cron from 'node-cron';
import { config } from './config.js';
import { logger } from './logger.js';
import { listCommits, listRepositories, getPushStats, getUserStats, cleanup } from './mcpClient.js';
import { readJson, writeJson } from './storage.js';
import { getHourWindow, formatHourRangeLocal, getTodayDateKey } from './time.js';
import { sendTelegramMessage } from './telegram.js';

const statePath = config.storage.path;

// Обработка завершения процесса
process.on('SIGINT', async () => {
	logger.info('Received SIGINT, shutting down...');
	cleanup();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	logger.info('Received SIGTERM, shutting down...');
	cleanup();
	process.exit(0);
});

async function ensureState() {
	const defaultState = { hourly: {}, lastReportDate: '', repositories: [] };
	const state = await readJson(statePath, defaultState);
	return { ...defaultState, ...state };
}

async function getRepositories() {
	try {
		const repos = await listRepositories();
		return Array.isArray(repos) ? repos : (repos?.repositories || repos?.data || []);
	} catch (error) {
		logger.error({ err: error }, 'Failed to get repositories');
		return [];
	}
}

async function countCommitsHour() {
	const { start, end } = getHourWindow(new Date());
	logger.info({ since: start.toISOString(), until: end.toISOString() }, 'Minimal MCP server does not support commit counting');

	const state = await ensureState();
	
	// Минимальный MCP сервер не поддерживает подсчет коммитов, поэтому просто обновляем состояние
	const key = `${getTodayDateKey(end)} ${formatHourRangeLocal(start, end)}`;
	state.hourly[key] = 0; // Устанавливаем 0, так как не можем получить данные
	await writeJson(statePath, state);
	
	logger.info({ key }, 'Updated state for minimal MCP server (no commit counting)');
}

async function getCurrentCommitsStatus() {
	logger.info('Getting current status for initialization (minimal MCP server)');
	
	// Минимальный MCP сервер не поддерживает получение репозиториев и коммитов
	return { totalCommits: 0, repoStats: {}, repositories: 0 };
}

async function sendPushStatsMessage() {
	try {
		const username = process.env.GITHUB_USER || 'exegguto';
		logger.info({ username }, 'Sending push stats message to Telegram');
		
		const pushStats = await getPushStats(username, 7);
		const userStats = await getUserStats(username);
		
		let message = `📊 **Статистика пушей GitHub**\n\n`;
		
		if (pushStats) {
			message += pushStats + '\n\n';
		}
		
		if (userStats) {
			message += userStats + '\n\n';
		}
		
		message += `⏰ Отчет сгенерирован: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;
		
		await sendTelegramMessage(message);
		logger.info('Push stats message sent to Telegram');
	} catch (error) {
		logger.error({ err: error }, 'Failed to send push stats message');
		const errorMessage = `❌ **Ошибка при получении статистики пушей**\n\n${error.message}`;
		try {
			await sendTelegramMessage(errorMessage);
		} catch (sendError) {
			logger.error({ err: sendError }, 'Failed to send error message to Telegram');
		}
	}
}

async function sendInitializationMessage() {
	try {
		logger.info('Sending initialization message for minimal MCP server');
		
		const now = new Date();
		const timeStr = now.toLocaleString('ru-RU', { 
			timeZone: 'Europe/Moscow',
			hour: '2-digit', 
			minute: '2-digit' 
		});
		
		let message = `🚀 **MCP Reporter запущен**\n\n`;
		message += `📊 **Статус на ${timeStr}:**\n`;
		message += `• Используется минимальный MCP сервер\n`;
		message += `• Поддержка статистики пушей GitHub\n`;
		message += `• Поддержка информации о пользователях\n\n`;
		message += `⏰ Следующий отчет в ${config.aggregation.reportTime}`;
		
		await sendTelegramMessage(message);
		logger.info('Initialization message sent to Telegram');
		
	} catch (error) {
		logger.error({ err: error }, 'Failed to send initialization message');
		const errorMessage = `❌ **Ошибка запуска MCP Reporter**\n\n${error.message}`;
		try {
			await sendTelegramMessage(errorMessage);
		} catch (sendError) {
			logger.error({ err: sendError }, 'Failed to send error message to Telegram');
		}
	}
}

function buildDailyReport(state) {
	const today = getTodayDateKey(new Date());
	const entries = Object.entries(state.hourly)
		.filter(([k]) => k.startsWith(today))
		.sort();
	const total = entries.reduce((sum, [, c]) => sum + c, 0);
	const lines = entries.map(([k, c]) => `- ${k}: ${c}`);
	return `📊 **Ежедневный отчет MCP Reporter**\n\n📅 Дата: ${today}\n📈 Статистика: Минимальный MCP сервер активен\n\n${lines.join('\n')}\n\n**Итого:** ${total}`;
}

async function sendDailyReportIfDue() {
	const state = await ensureState();
	const today = getTodayDateKey(new Date());
	if (state.lastReportDate === today) {
		return; // already sent today
	}
	const report = buildDailyReport(state);
	await sendTelegramMessage(report);
	state.lastReportDate = today;
	await writeJson(statePath, state);
}

async function main() {
	if (!config.telegram.token || !config.telegram.chatId) {
		logger.warn('TG_BOT_TOKEN and TG_CHAT_ID are required. Exiting.');
		process.exit(1);
	}
	logger.info('MCP reporter starting');

	// Ждем 10 секунд перед инициализацией, чтобы MCP сервер успел запуститься
	logger.info('Waiting 10 seconds for MCP server to be ready...');
	await new Promise(resolve => setTimeout(resolve, 10000));

	// Отправляем сообщение о запуске
	await sendInitializationMessage();

	// Отправляем статистику пушей
	await sendPushStatsMessage();

	// hourly at minute 0
	cron.schedule('0 * * * *', async () => {
		try { await countCommitsHour(); } catch (e) { logger.error(e); }
	});

	// daily 22:00 local time
	const [hh, mm] = config.aggregation.reportTime.split(':');
	const cronExpr = `${Number(mm)} ${Number(hh)} * * *`;
	cron.schedule(cronExpr, async () => {
		try { await sendDailyReportIfDue(); } catch (e) { logger.error(e); }
	});

	// Отправляем статистику пушей каждый день в 10:00
	cron.schedule('0 10 * * *', async () => {
		try { await sendPushStatsMessage(); } catch (e) { logger.error(e); }
	});

	// initial run at startup to start accumulation for current hour
	try { await countCommitsHour(); } catch (e) { logger.error(e); }
}

main().catch((e) => {
	logger.error(e, 'Fatal error');
	process.exit(1);
});
