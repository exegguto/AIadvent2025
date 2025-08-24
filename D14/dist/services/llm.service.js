import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
export class LLMService {
    openai;
    agent = null;
    constructor() {
        const proxyUrl = config.proxy.httpsProxy || config.proxy.httpProxy;
        if (proxyUrl) {
            if (proxyUrl.startsWith('socks5://') || proxyUrl.startsWith('socks4://')) {
                this.agent = new SocksProxyAgent(proxyUrl);
                logger.info('SOCKS прокси настроен', { proxyUrl });
            }
            else {
                this.agent = new HttpsProxyAgent(proxyUrl);
                logger.info('HTTP прокси настроен', { proxyUrl });
            }
        }
        else {
            this.agent = null;
            logger.info('Прокси не настроен, используем прямое соединение');
        }
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey,
            httpAgent: this.agent || undefined,
        });
    }
    async processMessage(userMessage, sessionHistory = [], projectContext) {
        try {
            logger.info('Processing message with LLM', {
                messageLength: userMessage.length,
                historyLength: sessionHistory.length,
                hasProjectContext: !!projectContext,
            });
            const systemPrompt = this.buildSystemPrompt(projectContext);
            const messages = this.buildMessages(systemPrompt, sessionHistory, userMessage);
            const response = await this.openai.chat.completions.create({
                model: config.openai.model,
                messages,
                max_completion_tokens: config.openai.maxTokens,
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('Empty response from OpenAI');
            }
            const parsedResponse = this.parseResponse(content);
            logger.info('LLM response processed', {
                textLength: parsedResponse.text.length,
                codeBlocksCount: parsedResponse.codeBlocks.length,
                hasCode: parsedResponse.hasCode,
            });
            return parsedResponse;
        }
        catch (error) {
            logger.error('LLM processing error', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
    buildSystemPrompt(projectContext) {
        let prompt = `Ты - AI помощник для разработки, похожий на Cursor. Твоя задача - понимать запросы пользователя и генерировать рабочий код с тестами.

ОСНОВНЫЕ ПРИНЦИПЫ:
1. Генерируй чистый, читаемый код
2. Всегда добавляй тесты для критической функциональности
3. Используй современные практики и паттерны
4. Объясняй логику работы кода
5. Предлагай улучшения и альтернативы

ФОРМАТ КОДА:
\`\`\`language:filename
код_здесь
\`\`\`

ПОДДЕРЖИВАЕМЫЕ ЯЗЫКИ: python, javascript, typescript, java, go, rust

ПРИМЕРЫ ЗАПРОСОВ:
- "Создай функцию для вычисления факториала" → код + тесты
- "Напиши класс для работы с JSON" → код + тесты
- "Создай простой HTTP сервер" → код + тесты
- "Добавь валидацию к существующему коду" → модификация + тесты

БЕЗОПАСНОСТЬ:
- Не используй опасные команды
- Валидируй входные данные
- Обрабатывай ошибки`;
        if (projectContext) {
            prompt += `\n\nКОНТЕКСТ ПРОЕКТА:
Язык: ${projectContext.language}
Фреймворк: ${projectContext.framework || 'не указан'}
Файлы: ${projectContext.files.map(f => f.name).join(', ')}
Зависимости: ${projectContext.dependencies.join(', ')}`;
        }
        return prompt;
    }
    buildMessages(systemPrompt, history, userMessage) {
        const messages = [
            { role: 'system', content: systemPrompt },
        ];
        const recentHistory = history.slice(-10);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role,
                content: this.formatMessageContent(msg),
            });
        }
        messages.push({ role: 'user', content: userMessage });
        return messages;
    }
    formatMessageContent(message) {
        let content = message.content;
        if (message.codeBlocks && message.codeBlocks.length > 0) {
            content += '\n\nКод:\n';
            for (const block of message.codeBlocks) {
                content += `\`\`\`${block.language}${block.filename ? ':' + block.filename : ''}\n${block.code}\n\`\`\`\n`;
            }
        }
        if (message.executionResults && message.executionResults.length > 0) {
            content += '\n\nРезультаты выполнения:\n';
            for (const result of message.executionResults) {
                content += `\n${result.language}:\n`;
                if (result.result.success) {
                    content += `✅ Вывод: ${result.result.output}\n`;
                }
                else {
                    content += `❌ Ошибка: ${result.result.error}\n`;
                }
            }
        }
        return content;
    }
    parseResponse(content) {
        const codeBlocks = this.extractCodeBlocks(content);
        const textResponse = this.extractText(content);
        return {
            text: textResponse,
            codeBlocks,
            hasCode: codeBlocks.length > 0,
            suggestions: this.extractSuggestions(content),
        };
    }
    extractCodeBlocks(content) {
        const codeBlockRegex = /```(\w+)(?::([^\n]+))?\n([\s\S]*?)```/g;
        const blocks = [];
        let match;
        while ((match = codeBlockRegex.exec(content)) !== null) {
            const language = match[1] || 'text';
            const filename = match[2] || undefined;
            const code = match[3]?.trim() || '';
            blocks.push({
                language,
                filename,
                code,
            });
        }
        return blocks;
    }
    extractText(content) {
        return content.replace(/```[\s\S]*?```/g, '').trim();
    }
    extractSuggestions(content) {
        const suggestions = [];
        const suggestionRegex = /💡\s*(.+)/g;
        let match;
        while ((match = suggestionRegex.exec(content)) !== null) {
            const suggestion = match[1]?.trim();
            if (suggestion) {
                suggestions.push(suggestion);
            }
        }
        return suggestions;
    }
}
export const llmService = new LLMService();
//# sourceMappingURL=llm.service.js.map