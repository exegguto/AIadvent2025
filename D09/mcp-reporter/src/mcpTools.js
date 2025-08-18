import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { config } from './config.js';

let client;

async function ensureClient() {
	if (client) return client;
	const transport = new SSEClientTransport(new URL(config.mcp.url));
	client = new Client({ name: 'mcp-reporter', version: '1.0.0' }, { capabilities: {} }, transport);
	await client.connect();
	return client;
}

export async function findCommitToolName() {
	const c = await ensureClient();
	const tools = await c.listTools();
	const candidates = ['list_commits', 'commits.list', 'github.list_commits'];
	const match = tools.tools.find(t => candidates.includes(t.name)) || tools.tools.find(t => /commit/i.test(t.name));
	return match?.name || 'list_commits';
}
