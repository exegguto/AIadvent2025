import axios from 'axios';
import { config } from './config.js';
import { logger } from './logger.js';

export async function sendTelegramMessage(text) {
	if (!config.telegram.token || !config.telegram.chatId) {
		logger.warn('Telegram token/chatId not configured, skipping send');
		return;
	}
	try {
		const url = `https://api.telegram.org/bot${config.telegram.token}/sendMessage`;
		await axios.post(url, { chat_id: config.telegram.chatId, text, parse_mode: 'Markdown' });
		logger.info('Telegram message sent');
	} catch (e) {
		logger.error({ err: e?.response?.data || e.message }, 'Failed to send Telegram message');
	}
}
