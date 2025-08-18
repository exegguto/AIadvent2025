import { spawn } from 'child_process';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

async function testMCPServer() {
    try {
        console.log('Testing MCP server...');
        
        const mcpServerPath = '/app/github-mcp-server/github-mcp-server';
        console.log('MCP server path:', mcpServerPath);
        
        // Запускаем GitHub MCP сервер как подпроцесс
        const mcpProcess = spawn(mcpServerPath, ['stdio'], {
            env: {
                ...process.env,
                GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PAT
            },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        console.log('MCP process started');

        // Создаем транспорт для stdio
        const transport = new StdioClientTransport(mcpProcess.stdin, mcpProcess.stdout);
        
        // Создаем MCP клиент
        const client = new Client({
            name: 'mcp-reporter',
            version: '1.0.0'
        }, {
            capabilities: {
                tools: {}
            }
        });

        console.log('Connecting to MCP server...');
        
        // Подключаемся к серверу
        await client.connect(transport);
        
        console.log('Successfully connected to GitHub MCP server');
        
        // Тестируем получение репозиториев
        const result = await client.callTool({
            name: 'search_repositories',
            arguments: {
                query: 'user:test',
                perPage: 10
            }
        });

        console.log('Result:', result);
        
        client.close();
        mcpProcess.kill();
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testMCPServer();

