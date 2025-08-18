import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { logger } from './logger.js';
import { spawn } from 'child_process';
import { join } from 'path';

let client = null;
let serverProcess = null;

async function connectToMinimalMCPServer() {
	try {
		logger.info('Connecting to minimal MCP server via stdio');

		// Запускаем наш минимальный MCP сервер как подпроцесс
		const serverPath = join(process.cwd(), 'minimal-push-mcp-server', 'dist', 'index.js');
		serverProcess = spawn('node', [serverPath], {
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		const transport = new StdioClientTransport(serverProcess.stdin, serverProcess.stdout);

		client = new Client({
			name: 'mcp-reporter',
			version: '1.0.0'
		}, {
			capabilities: { tools: {} }
		});

		await client.connect(transport);
		logger.info('Connected to minimal MCP server via stdio');
		return true;
	} catch (error) {
		logger.error({ err: error.message }, 'Failed to connect to minimal MCP server');
		return false;
	}
}

export async function getPushStats(username, days = 7) {
	try {
		if (!client) {
			const ok = await connectToMinimalMCPServer();
			if (!ok) throw new Error('Failed to connect to minimal MCP server');
		}
		
		logger.info({ username, days }, 'Fetching push stats via minimal MCP');
		const result = await client.callTool({
			name: 'get_push_count',
			arguments: { username, days }
		});
		
		if (result.content && result.content.length > 0) {
			const stats = result.content[0].text;
			logger.info({ username, days }, 'Push stats fetched via minimal MCP');
			return stats;
		}
		
		logger.warn({ username }, 'No push stats found');
		return null;
	} catch (error) {
		logger.error({ err: error.message, username }, 'Failed to fetch push stats via minimal MCP');
		throw error;
	}
}

export async function getUserStats(username) {
	try {
		if (!client) {
			const ok = await connectToMinimalMCPServer();
			if (!ok) throw new Error('Failed to connect to minimal MCP server');
		}
		
		logger.info({ username }, 'Fetching user stats via minimal MCP');
		const result = await client.callTool({
			name: 'get_user_stats',
			arguments: { username }
		});
		
		if (result.content && result.content.length > 0) {
			const stats = result.content[0].text;
			logger.info({ username }, 'User stats fetched via minimal MCP');
			return stats;
		}
		
		logger.warn({ username }, 'No user stats found');
		return null;
	} catch (error) {
		logger.error({ err: error.message, username }, 'Failed to fetch user stats via minimal MCP');
		throw error;
	}
}

export function cleanup() {
	try {
		if (client) {
			client.close();
			logger.info('Minimal MCP client closed');
		}
		if (serverProcess) {
			serverProcess.kill();
			logger.info('Minimal MCP server process killed');
		}
	} catch (error) {
		logger.error({ err: error.message }, 'Error during minimal MCP cleanup');
	}
}
