import { config } from './config.js';
import { logger } from './logger.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Загружаем переменные окружения из .env файла
dotenv.config();

class LLMService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    
    // Настройка прокси
    this.proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.https_proxy;
    
    // Создаем соответствующий агент в зависимости от типа прокси
    if (this.proxyUrl) {
      if (this.proxyUrl.startsWith('socks5://') || this.proxyUrl.startsWith('socks4://')) {
        this.agent = new SocksProxyAgent(this.proxyUrl);
        logger.info('SOCKS прокси настроен', { proxyUrl: this.proxyUrl });
      } else {
        this.agent = new HttpsProxyAgent(this.proxyUrl);
        logger.info('HTTP прокси настроен', { proxyUrl: this.proxyUrl });
      }
    } else {
      this.agent = null;
    }
  }

  async processMessage(userMessage) {
    try {
      logger.info('Processing message with LLM', { messageLength: userMessage.length });
      
      const systemPrompt = `Ты - AI помощник, который может выполнять код. Твоя задача - понимать запросы пользователя и генерировать соответствующий код для выполнения.

ПРАВИЛА:
1. Всегда давай понятный ответ на естественном языке
2. Если запрос требует вычислений или демонстрации, добавляй код
3. Используй Python для большинства задач, если не указан другой язык
4. Код должен быть рабочим и безопасным

ФОРМАТ КОДА:
\`\`\`language
код_здесь
\`\`\`

ПОДДЕРЖИВАЕМЫЕ ЯЗЫКИ: python, javascript, bash, java, go, rust

ПРИМЕРЫ:
- "Сложи 2+2" → "Сумма 2 + 2 = 4" + \`\`\`python\nprint(2+2)\n\`\`\`
- "Покажи числа от 1 до 5" → "Вот числа от 1 до 5:" + \`\`\`python\nfor i in range(1, 6):\n    print(i)\n\`\`\`
- "Вычисли число π до 10 знаков" → "Число π до 10 знаков:" + \`\`\`python\nimport math\nprint(f"{math.pi:.10f}")\n\`\`\`
- "Создай функцию для факториала" → "Функция для вычисления факториала:" + \`\`\`python\ndef factorial(n):\n    return 1 if n <= 1 else n * factorial(n-1)\nprint(factorial(5))\n\`\`\`

СЛОЖНЫЕ ЗАДАЧИ:
- Для математических вычислений используй библиотеки (math, numpy)
- Для алгоритмов пиши понятные функции
- Для тестирования создавай отдельные блоки кода
- Объясняй логику работы кода

БЕЗОПАСНОСТЬ:
- Не используй опасные команды (rm, mkfs, dd)
- Ограничивай рекурсию и циклы
- Проверяй входные данные`;

      const response = await this._callOpenAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]);

      return this._parseResponse(response);
    } catch (error) {
      logger.error('LLM processing error', { error: error.message });
      throw error;
    }
  }

  async _callOpenAI(messages) {
    // Проверяем наличие API ключа
    if (!this.apiKey || this.apiKey === 'your_openai_api_key_here' || this.apiKey.trim() === '') {
      logger.error('OpenAI API ключ не настроен');
      throw new Error('OpenAI API ключ не настроен. Установите переменную окружения OPENAI_API_KEY');
    }

    try {
      logger.info('Отправляем запрос к OpenAI API', { 
        model: this.model, 
        messageLength: messages[messages.length - 1].content.length 
      });

      const fetchOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_completion_tokens: 4000
        })
      };

      // Добавляем прокси агент если настроен
      if (this.agent) {
        fetchOptions.agent = this.agent;
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('OpenAI API ошибка', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`OpenAI API ошибка: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      logger.info('OpenAI API ответ получен', { 
        model: data.model,
        usage: data.usage 
      });
      
      return data.choices[0].message.content;
    } catch (error) {
      logger.error('Ошибка при вызове OpenAI API', { error: error.message });
      throw error;
    }
  }

  _fallbackResponse(userMessage) {
    // Простой fallback без API ключа
    const lowerMessage = userMessage.toLowerCase();
    
    // Сложение
    if (lowerMessage.includes('сложи') || lowerMessage.includes('+')) {
      const numbers = userMessage.match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        const a = parseInt(numbers[0]);
        const b = parseInt(numbers[1]);
        const result = a + b;
        return `Сумма ${a} + ${b} = ${result}\n\n\`\`\`python\nprint(${a} + ${b})\n\`\`\``;
      }
    }
    
    // Умножение
    if (lowerMessage.includes('умножь') || lowerMessage.includes('*')) {
      const numbers = userMessage.match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        const a = parseInt(numbers[0]);
        const b = parseInt(numbers[1]);
        const result = a * b;
        return `Произведение ${a} * ${b} = ${result}\n\n\`\`\`python\nprint(${a} * ${b})\n\`\`\``;
      }
    }
    
    // Вычитание
    if (lowerMessage.includes('вычти') || lowerMessage.includes('-')) {
      const numbers = userMessage.match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        const a = parseInt(numbers[0]);
        const b = parseInt(numbers[1]);
        const result = a - b;
        return `Разность ${a} - ${b} = ${result}\n\n\`\`\`python\nprint(${a} - ${b})\n\`\`\``;
      }
    }
    
    // Деление
    if (lowerMessage.includes('раздели') || lowerMessage.includes('/')) {
      const numbers = userMessage.match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        const a = parseInt(numbers[0]);
        const b = parseInt(numbers[1]);
        if (b !== 0) {
          const result = a / b;
          return `Частное ${a} / ${b} = ${result}\n\n\`\`\`python\nprint(${a} / ${b})\n\`\`\``;
        } else {
          return `Ошибка: деление на ноль невозможно\n\n\`\`\`python\nprint("Ошибка: деление на ноль")\n\`\`\``;
        }
      }
    }
    
    // Квадрат числа
    if (lowerMessage.includes('квадрат') || lowerMessage.includes('в квадрате')) {
      const numbers = userMessage.match(/\d+/g);
      if (numbers && numbers.length >= 1) {
        const a = parseInt(numbers[0]);
        const result = a * a;
        return `Квадрат числа ${a} = ${result}\n\n\`\`\`python\nprint(${a} ** 2)\n\`\`\``;
      }
    }
    
    // Числа от 1 до N
    if (lowerMessage.includes('числа') || lowerMessage.includes('цикл') || lowerMessage.includes('от 1 до')) {
      const numbers = userMessage.match(/\d+/g);
      if (numbers && numbers.length >= 1) {
        const n = parseInt(numbers[0]);
        return `Вот числа от 1 до ${n}:\n\n\`\`\`python\nfor i in range(1, ${n + 1}):\n    print(i)\n\`\`\``;
      } else {
        return `Вот числа от 1 до 5:\n\n\`\`\`python\nfor i in range(1, 6):\n    print(i)\n\`\`\``;
      }
    }
    
    // Квадраты чисел
    if (lowerMessage.includes('квадраты') || lowerMessage.includes('квадрат чисел')) {
      const numbers = userMessage.match(/\d+/g);
      if (numbers && numbers.length >= 1) {
        const n = parseInt(numbers[numbers.length - 1]); // Берем последнее число
        return `Квадраты чисел от 1 до ${n}:\n\n\`\`\`python\nfor i in range(1, ${n + 1}):\n    print(f"{i}² = {i**2}")\n\`\`\``;
      }
    }
    
    // Факториал
    if (lowerMessage.includes('факториал')) {
      const numbers = userMessage.match(/\d+/g);
      if (numbers && numbers.length >= 1) {
        const n = parseInt(numbers[0]);
        if (n <= 10) { // Ограничиваем для безопасности
          return `Факториал числа ${n}:\n\n\`\`\`python\nimport math\nprint(f"Факториал {n} = {math.factorial(${n})}")\n\`\`\``;
        }
      }
    }
    
    // Приветствие
    if (lowerMessage.includes('привет') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return `Привет! Я AI помощник. Могу помочь с вычислениями и кодом. Попробуйте: "Сложи 2+2" или "Покажи числа от 1 до 5"`;
    }
    
    // Помощь
    if (lowerMessage.includes('помощь') || lowerMessage.includes('help')) {
      return `Я могу помочь с:\n- Математическими операциями (сложи, умножь, вычти, раздели)\n- Циклами и последовательностями\n- Квадратами чисел\n- Факториалами\n\nПримеры: "Сложи 5+7", "Покажи квадраты чисел от 1 до 3"`;
    }
    
    return `Я понимаю ваш вопрос: "${userMessage}". Попробуйте простые математические операции: "Сложи 2+2", "Умножь 3*4", "Покажи числа от 1 до 5". Для полной функциональности установите OPENAI_API_KEY.`;
  }

  _parseResponse(llmResponse) {
    const codeBlocks = this._extractCodeBlocks(llmResponse);
    const textResponse = this._extractText(llmResponse);
    
    // Отладочная информация
    logger.info('Parsing LLM response', { 
      originalLength: llmResponse?.length || 0,
      textLength: textResponse?.length || 0,
      codeBlocksCount: codeBlocks?.length || 0,
      hasCode: codeBlocks.length > 0
    });
    
    return {
      text: textResponse,
      codeBlocks: codeBlocks,
      hasCode: codeBlocks.length > 0
    };
  }

  _extractCodeBlocks(response) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;
    
    while ((match = codeBlockRegex.exec(response)) !== null) {
      blocks.push({
        language: match[1] || 'python',
        code: match[2].trim()
      });
    }
    
    return blocks;
  }

  _extractText(response) {
    // Удаляем код блоки из текста
    return response.replace(/```[\s\S]*?```/g, '').trim();
  }
}

export const llmService = new LLMService();
