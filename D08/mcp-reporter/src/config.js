export const config = {
	telegram: {
		token: process.env.TG_BOT_TOKEN || process.env.TG_TOKEN || '',
		chatId: process.env.TG_CHAT_ID || ''
	},
	aggregation: {
		hourlyWindowHours: Number(process.env.HOURLY_WINDOW_HOURS || 1),
		reportTime: process.env.REPORT_TIME || '22:00'
	},
	storage: {
		path: process.env.STATE_PATH || '/data/state.json'
	}
};
