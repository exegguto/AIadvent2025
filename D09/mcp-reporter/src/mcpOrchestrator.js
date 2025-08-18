import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { logger } from './logger.js';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let pushClient = null;
let telegramClient = null;

async function connectToPushMCPServer() {
	try {
		logger.info('Connecting to minimal push MCP server via stdio');

		// Запускаем минимальный push MCP сервер как подпроцесс
		const pushServerPath = 'minimal-push-mcp-server/dist/index.js';
		logger.info({ pushServerPath }, 'Push server path');

		const transport = new StdioClientTransport({
			command: 'node',
			args: [pushServerPath],
			cwd: join(__dirname, '..')
		});

		pushClient = new Client({
			name: 'mcp-reporter',
			version: '1.0.0'
		}, {
			capabilities: { tools: {} }
		});

		await pushClient.connect(transport);
		logger.info('Connected to minimal push MCP server via stdio');
		return true;
	} catch (error) {
		logger.error({ err: error.message }, 'Failed to connect to minimal push MCP server');
		return false;
	}
}

async function connectToTelegramMCPServer() {
	try {
		logger.info('Connecting to telegram MCP server via stdio');

		// Запускаем telegram MCP сервер как подпроцесс
		const telegramServerPath = 'mcp-telegram-server/dist/index.js';

		const transport = new StdioClientTransport({
			command: 'node',
			args: [telegramServerPath],
			cwd: join(__dirname, '..')
		});

		telegramClient = new Client({
			name: 'mcp-reporter',
			version: '1.0.0'
		}, {
			capabilities: { tools: {} }
		});

		await telegramClient.connect(transport);
		logger.info('Connected to telegram MCP server via stdio');
		return true;
	} catch (error) {
		logger.error({ err: error.message }, 'Failed to connect to telegram MCP server');
		return false;
	}
}

export async function getPushStats(username, days = 1) {
	try {
		if (!pushClient) {
			const ok = await connectToPushMCPServer();
			if (!ok) throw new Error('Failed to connect to minimal push MCP server');
		}
		
		logger.info({ username, days }, 'Fetching push stats via minimal push MCP');
		const result = await pushClient.callTool({
			name: 'get_push_count',
			arguments: { username, days }
		});
		
		if (result.content && result.content.length > 0) {
			const stats = result.content[0].text;
			logger.info({ username, days }, 'Push stats fetched via minimal push MCP');
			return stats;
		}
		
		logger.warn({ username }, 'No push stats found');
		return null;
	} catch (error) {
		logger.error({ err: error.message, username }, 'Failed to fetch push stats via minimal push MCP');
		throw error;
	}
}

export async function sendTelegramMessage(text, chat_id = null) {
	try {
		if (!telegramClient) {
			const ok = await connectToTelegramMCPServer();
			if (!ok) throw new Error('Failed to connect to telegram MCP server');
		}
		
		logger.info('Sending message via telegram MCP');
		const result = await telegramClient.callTool({
			name: 'send_message',
			arguments: { 
				text,
				chat_id,
				parse_mode: 'Markdown'
			}
		});
		
		if (result.content && result.content.length > 0) {
			const response = result.content[0].text;
			logger.info('Message sent via telegram MCP');
			return response;
		}
		
		logger.warn('No response from telegram MCP');
		return null;
	} catch (error) {
		logger.error({ err: error.message }, 'Failed to send message via telegram MCP');
		throw error;
	}
}

export async function sendPushStatsToTelegram(username, days = 1, chat_id = null) {
	try {
		// Сначала получаем реальную статистику пушей от GitHub сервера
		const pushStats = await getPushStats(username, days);
		
		if (!pushStats) {
			logger.warn({ username, days }, 'No push stats available to send');
			return null;
		}
		
		// Подключаемся к Telegram серверу
		if (!telegramClient) {
			const ok = await connectToTelegramMCPServer();
			if (!ok) throw new Error('Failed to connect to telegram MCP server');
		}
		
		logger.info({ username, days }, 'Sending push stats to telegram via MCP');
		
		// Отправляем реальную статистику через Telegram сервер
		const result = await telegramClient.callTool({
			name: 'send_message',
			arguments: { 
				text: pushStats,
				chat_id,
				parse_mode: 'Markdown'
			}
		});
		
		if (result.content && result.content.length > 0) {
			const response = result.content[0].text;
			logger.info({ username, days }, 'Push stats sent to telegram via MCP');
			return response;
		}
		
		logger.warn('No response from telegram MCP for push stats');
		return null;
	} catch (error) {
		logger.error({ err: error.message, username }, 'Failed to send push stats to telegram via MCP');
		throw error;
	}
}

export async function sendHourlyReportToTelegram(username, chat_id = null) {
	try {
		if (!telegramClient) {
			const ok = await connectToTelegramMCPServer();
			if (!ok) throw new Error('Failed to connect to telegram MCP server');
		}
		
		logger.info({ username }, 'Sending hourly report to telegram via MCP');
		const result = await telegramClient.callTool({
			name: 'send_hourly_report',
			arguments: { 
				username,
				chat_id
			}
		});
		
		if (result.content && result.content.length > 0) {
			const response = result.content[0].text;
			logger.info({ username }, 'Hourly report sent to telegram via MCP');
			return response;
		}
		
		logger.warn('No response from telegram MCP for hourly report');
		return null;
	} catch (error) {
		logger.error({ err: error.message, username }, 'Failed to send hourly report to telegram via MCP');
		throw error;
	}
}

export async function getHourlyPushStats(username) {
	try {
		// Получаем статистику пушей за последний час (1 день для простоты)
		const pushStats = await getPushStats(username, 1);
		
		if (pushStats) {
			// Отправляем статистику в Telegram
			await sendPushStatsToTelegram(username, 1);
			return pushStats;
		}
		
		// Если статистика не получена, отправляем почасовой отчет
		await sendHourlyReportToTelegram(username);
		return null;
	} catch (error) {
		logger.error({ err: error.message, username }, 'Failed to get hourly push stats');
		throw error;
	}
}

export function cleanup() {
	try {
		if (pushClient) {
			pushClient.close();
			logger.info('Minimal push MCP client closed');
		}
		if (telegramClient) {
			telegramClient.close();
			logger.info('Telegram MCP client closed');
		}
	} catch (error) {
		logger.error({ err: error.message }, 'Error during MCP orchestrator cleanup');
	}
}
