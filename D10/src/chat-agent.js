import { llmService } from './llm-service.js';
import { dockerManager } from './docker-manager.js';
import { logger } from './logger.js';

class ChatAgent {
  constructor() {
    this.conversationHistory = new Map();
  }

  async processChatMessage(sessionId, userMessage) {
    try {
      logger.info('Processing chat message', { sessionId, messageLength: userMessage.length });
      
      // Получаем историю разговора
      const history = this.conversationHistory.get(sessionId) || [];
      
      // Обрабатываем сообщение через LLM
      const llmResponse = await llmService.processMessage(userMessage);
      
      // Отладочная информация
      logger.info('LLM Response received', { 
        textLength: llmResponse.text?.length || 0,
        codeBlocksCount: llmResponse.codeBlocks?.length || 0,
        hasCode: llmResponse.hasCode
      });
      
      // Добавляем сообщение пользователя в историю
      history.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });
      
      // Добавляем ответ LLM в историю
      history.push({
        role: 'assistant',
        content: llmResponse.text,
        codeBlocks: llmResponse.codeBlocks,
        timestamp: new Date()
      });
      
      // Если есть код для выполнения
      const executionResults = [];
      if (llmResponse.hasCode) {
        for (const codeBlock of llmResponse.codeBlocks) {
          try {
            const result = await this._executeCode(codeBlock.language, codeBlock.code, sessionId);
            executionResults.push({
              language: codeBlock.language,
              code: codeBlock.code,
              result: result
            });
            
            // Добавляем результат выполнения в историю
            history.push({
              role: 'system',
              content: `Код выполнен (${codeBlock.language}):`,
              executionResult: result,
              timestamp: new Date()
            });
          } catch (error) {
            logger.error('Code execution failed', { error: error.message, language: codeBlock.language });
            executionResults.push({
              language: codeBlock.language,
              code: codeBlock.code,
              error: error.message
            });
            
            history.push({
              role: 'system',
              content: `Ошибка выполнения кода (${codeBlock.language}): ${error.message}`,
              timestamp: new Date()
            });
          }
        }
      }
      
      // Сохраняем обновленную историю
      this.conversationHistory.set(sessionId, history.slice(-50)); // Ограничиваем историю
      
      return {
        success: true,
        llmResponse: llmResponse.text,
        codeBlocks: llmResponse.codeBlocks,
        executionResults: executionResults,
        hasCode: llmResponse.hasCode,
        timestamp: new Date()
      };
      
    } catch (error) {
      logger.error('Chat processing error', { error: error.message, sessionId });
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async _executeCode(language, code, sessionId) {
    logger.info('Executing code from chat', { language, codeLength: code.length, sessionId });
    
    // Создаем контейнер
    const containerId = await dockerManager.createContainer(language, code);
    
    try {
      // Выполняем код
      const result = await dockerManager.executeCode(containerId, language, code);
      
      return {
        output: result.output,
        error: result.error,
        success: result.success,
        containerId: containerId
      };
    } finally {
      // Очищаем контейнер
      await dockerManager.cleanupContainer(containerId);
    }
  }

  async getConversationHistory(sessionId, limit = 20) {
    const history = this.conversationHistory.get(sessionId) || [];
    return history.slice(-limit);
  }

  async clearConversation(sessionId) {
    this.conversationHistory.delete(sessionId);
    logger.info('Conversation cleared', { sessionId });
  }

  async getStats() {
    const activeConversations = this.conversationHistory.size;
    const totalMessages = Array.from(this.conversationHistory.values())
      .reduce((sum, history) => sum + history.length, 0);
    
    return {
      activeConversations,
      totalMessages,
      averageMessagesPerConversation: activeConversations > 0 ? totalMessages / activeConversations : 0
    };
  }
}

export const chatAgent = new ChatAgent();
