import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { LLMResponse, CodeBlock, ProjectContext, ChatMessage } from '../types/index.js';

export class LLMService {
  private openai: OpenAI;
  private agent: any = null;

  constructor() {
    // Настройка прокси
    const proxyUrl = config.proxy.httpsProxy || config.proxy.httpProxy;
    
    if (proxyUrl) {
      if (proxyUrl.startsWith('socks5://') || proxyUrl.startsWith('socks4://')) {
        this.agent = new SocksProxyAgent(proxyUrl);
        logger.info('SOCKS прокси настроен', { proxyUrl });
      } else {
        this.agent = new HttpsProxyAgent(proxyUrl);
        logger.info('HTTP прокси настроен', { proxyUrl });
      }
    } else {
      this.agent = null;
      logger.info('Прокси не настроен, используем прямое соединение');
    }

    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
      httpAgent: this.agent || undefined,
    });
  }

  async processMessage(
    userMessage: string,
    sessionHistory: ChatMessage[] = [],
    projectContext?: ProjectContext,
    model: string = config.openai.model,
    customSystemPrompt?: string
  ): Promise<LLMResponse> {
    try {
      logger.info('Processing message with LLM', {
        messageLength: userMessage.length,
        historyLength: sessionHistory.length,
        hasProjectContext: !!projectContext,
      });

      const systemPrompt = customSystemPrompt || this.buildSystemPrompt(projectContext);
      
      logger.info('System prompt configuration', {
        hasCustomPrompt: !!customSystemPrompt,
        customPromptLength: customSystemPrompt?.length || 0,
        finalPromptLength: systemPrompt.length,
      });
      const messages = this.buildMessages(systemPrompt, sessionHistory, userMessage);

      const response = await this.openai.chat.completions.create({
        model,
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
    } catch (error) {
      logger.error('LLM processing error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  private buildSystemPrompt(projectContext?: ProjectContext): string {
    // Note: Custom prompt will be handled on the frontend
    // This is the default prompt that can be overridden
    let prompt = `Ты - AI помощник для разработки, похожий на Cursor IDE. Твоя задача - помогать пользователю в разработке, выполняя команды и управляя проектом.

ВАЖНО: У тебя есть возможность выполнять команды через агента! Когда пользователь просит запустить тесты, выполнить код или другие операции - ты ДОЛЖЕН дать команду агенту для выполнения, а не отказываться.

ОСНОВНЫЕ ПРИНЦИПЫ:
1. Генерируй чистый, читаемый код
2. Всегда добавляй тесты для критической функциональности
3. Используй современные практики и паттерны
4. Объясняй логику работы кода
5. Предлагай улучшения и альтернативы

КОМАНДЫ И ОПЕРАЦИИ:

📁 УПРАВЛЕНИЕ ФАЙЛАМИ:
- "создай файл [имя]" → создание нового файла с кодом
- "создай [функция/класс/модуль]" → создание файла с указанной функциональностью
- "добавь файл [имя]" → добавление нового файла в проект
- "удали файл [имя]" → удаление файла из проекта
- "переименуй [старое_имя] в [новое_имя]" → переименование файла

📝 РЕДАКТИРОВАНИЕ КОДА:
- "измени [файл]" → редактирование существующего файла
- "улучши [функция/код]" → улучшение существующего кода
- "добавь [функциональность] в [файл]" → добавление функциональности
- "исправь [ошибка/проблема]" → исправление ошибок
- "рефакторинг [файл]" → рефакторинг кода

🧪 ВЫПОЛНЕНИЕ ТЕСТОВ:
- "запусти тесты" → выполнение всех тестов в проекте (АГЕНТ ВЫПОЛНИТ КОМАНДУ)
- "run tests" → выполнение тестов (АГЕНТ ВЫПОЛНИТ КОМАНДУ)
- "тестируй [файл/функция]" → тестирование конкретного файла или функции (АГЕНТ ВЫПОЛНИТ КОМАНДУ)
- "проверь код" → выполнение тестов и анализ результатов (АГЕНТ ВЫПОЛНИТ КОМАНДУ)
- "запусти [файл]" → выполнение конкретного файла (АГЕНТ ВЫПОЛНИТ КОМАНДУ)

ВАЖНО: Когда пользователь просит запустить тесты или выполнить код, ты НЕ должен отказываться! У тебя есть агент, который может выполнять команды в Docker контейнере.

🔍 АНАЛИЗ И ДИАГНОСТИКА:
- "покажи структуру проекта" → отображение структуры файлов
- "найди ошибки в [файл]" → поиск ошибок в коде
- "оптимизируй [файл]" → оптимизация производительности
- "проверь качество кода" → анализ качества кода

📦 УПРАВЛЕНИЕ ЗАВИСИМОСТЯМИ:
- "добавь зависимость [пакет]" → добавление новой зависимости
- "обнови зависимости" → обновление зависимостей
- "покажи зависимости" → отображение списка зависимостей

ФОРМАТ КОДА:
\`\`\`language:filename
код_здесь
\`\`\`

ВАЖНО: Всегда указывай имя файла в формате \`\`\`language:filename
Примеры:
- \`\`\`python:main.py
- \`\`\`python:test_main.py
- \`\`\`javascript:app.js
- \`\`\`javascript:test_app.js

ПОДДЕРЖИВАЕМЫЕ ЯЗЫКИ: python, javascript, typescript, java, go, rust

ПРИМЕРЫ ЗАПРОСОВ:
- "Создай функцию для вычисления факториала" → создание файла с функцией и тестами
- "Запусти тесты для calculate_pi" → выполнение тестов конкретной функции (АГЕНТ ВЫПОЛНИТ)
- "Улучши функцию calculate_pi" → улучшение существующего кода
- "Добавь валидацию в main.py" → добавление валидации в существующий файл
- "Удали ненужные файлы" → удаление неиспользуемых файлов
- "Покажи структуру проекта" → отображение всех файлов проекта
- "Запусти тесты" → выполнение всех тестов в проекте (АГЕНТ ВЫПОЛНИТ)
- "Проверь код" → выполнение тестов и анализ (АГЕНТ ВЫПОЛНИТ)

ОТОБРАЖЕНИЕ КОДА:
- Показывай код в контексте объяснения, а не только в конце
- Используй markdown для форматирования
- Вставляй код блоки в соответствующих местах повествования
- Объясняй каждую часть кода по мере его показа

АНАЛИЗ РЕЗУЛЬТАТОВ ВЫПОЛНЕНИЯ:
- Когда анализируешь результаты выполнения кода, давай краткий и понятный комментарий
- Объясняй, что означают результаты (успех/ошибка)
- Если есть ошибки, предложи возможные решения
- Если тесты прошли, подтверди корректность работы
- Указывай на важные моменты в выводе программы
- Давай рекомендации по улучшению, если необходимо

БЕЗОПАСНОСТЬ:
- Не используй опасные команды
- Валидируй входные данные
- Обрабатывай ошибки
- Проверяй существование файлов перед операциями`;

    if (projectContext) {
      prompt += `\n\nКОНТЕКСТ ПРОЕКТА:
Язык: ${projectContext.language}
Фреймворк: ${projectContext.framework || 'не указан'}
Файлы: ${projectContext.files.map(f => f.name).join(', ')}
Зависимости: ${projectContext.dependencies.join(', ')}`;
    }

    return prompt;
  }

  private buildMessages(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string
  ) {
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Добавляем историю (последние 10 сообщений для экономии токенов)
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

  private formatMessageContent(message: ChatMessage): string {
    let content = message.content;

    // Code blocks are already embedded in the content from LLM response
    // We just need to handle execution results
    if (message.executionResults && message.executionResults.length > 0) {
      content += '\n\nРезультаты выполнения:\n';
      for (const result of message.executionResults) {
        content += `\n${result.language}:\n`;
        if (result.result.success) {
          content += `✅ Вывод: ${result.result.output}\n`;
        } else {
          content += `❌ Ошибка: ${result.result.error}\n`;
        }
      }
    }

    return content;
  }

  private parseResponse(content: string): LLMResponse {
    const codeBlocks = this.extractCodeBlocks(content);
    
    // Keep the original content with embedded code blocks for better display
    const textResponse = content;

    return {
      text: textResponse,
      codeBlocks,
      hasCode: codeBlocks.length > 0,
      suggestions: this.extractSuggestions(content),
    };
  }

  private extractCodeBlocks(content: string): CodeBlock[] {
    const codeBlockRegex = /```(\w+)(?::([^\n]+))?\n([\s\S]*?)```/g;
    const blocks: CodeBlock[] = [];
    let match;
    let blockIndex = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'text';
      let filename = match[2] || undefined;
      const code = match[3]?.trim() || '';
      
      // Generate filename if not provided
      if (!filename) {
        filename = this.generateFilename(language, blockIndex, code);
      }
      
      blocks.push({
        language,
        filename,
        code,
      });
      
      blockIndex++;
    }

    return blocks;
  }

  private generateFilename(language: string, index: number, code: string): string {
    const languageMap: { [key: string]: string } = {
      'python': 'py',
      'javascript': 'js',
      'typescript': 'ts',
      'java': 'java',
      'go': 'go',
      'rust': 'rs',
      'cpp': 'cpp',
      'c': 'c',
      'php': 'php',
      'ruby': 'rb',
    };
    
    const extension = languageMap[language.toLowerCase()] || 'txt';
    
    // Try to detect if this is a test file
    const isTest = code.toLowerCase().includes('test') || 
                   code.toLowerCase().includes('unittest') || 
                   code.toLowerCase().includes('pytest') ||
                   code.toLowerCase().includes('describe') ||
                   code.toLowerCase().includes('it(');
    
    if (isTest) {
      return `test_${index + 1}.${extension}`;
    }
    
    // Try to detect if this is a main file
    const isMain = code.toLowerCase().includes('if __name__') ||
                   code.toLowerCase().includes('main()') ||
                   code.toLowerCase().includes('console.log') ||
                   code.toLowerCase().includes('print(');
    
    if (isMain) {
      return `main.${extension}`;
    }
    
    // Default naming
    return `file_${index + 1}.${extension}`;
  }

  private extractText(content: string): string {
    return content.replace(/```[\s\S]*?```/g, '').trim();
  }

  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = [];
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
