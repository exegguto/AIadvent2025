import { dockerManager } from './docker-manager.js';
import { logger } from './logger.js';

class AIAgent {
  constructor() {
    this.executionHistory = new Map();
  }

  async processRequest(request) {
    const { language, code, sessionId } = request;
    
    try {
      logger.info('Processing AI request', { language, sessionId, codeLength: code.length });
      
      // Валидация входных данных
      this._validateRequest(language, code);
      
      // Создание контейнера
      const containerId = await dockerManager.createContainer(language, code);
      
      // Выполнение кода
      const result = await dockerManager.executeCode(containerId, language, code);
      
      // Очистка контейнера
      await dockerManager.cleanupContainer(containerId);
      
      // Сохранение результата в истории
      const executionResult = {
        id: containerId,
        language,
        code,
        result,
        timestamp: new Date(),
        sessionId
      };
      
      this.executionHistory.set(containerId, executionResult);
      
      // Ограничение размера истории
      this._cleanupHistory();
      
      logger.info('Request processed successfully', { containerId, success: result.success });
      
      return {
        success: true,
        containerId,
        result,
        timestamp: executionResult.timestamp
      };
      
    } catch (error) {
      logger.error('Failed to process request', { error: error.message, sessionId });
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async getExecutionHistory(sessionId = null) {
    const history = Array.from(this.executionHistory.values());
    
    if (sessionId) {
      return history.filter(execution => execution.sessionId === sessionId);
    }
    
    return history.slice(-50); // Последние 50 выполнений
  }

  async getExecutionById(executionId) {
    return this.executionHistory.get(executionId) || null;
  }

  async getStats() {
    const containerStats = await dockerManager.getContainerStats();
    const historyStats = this._getHistoryStats();
    
    return {
      containers: containerStats,
      history: historyStats,
      uptime: process.uptime()
    };
  }

  _validateRequest(language, code) {
    if (!language || typeof language !== 'string') {
      throw new Error('Language is required and must be a string');
    }
    
    if (!code || typeof code !== 'string') {
      throw new Error('Code is required and must be a string');
    }
    
    if (code.length > 10000) {
      throw new Error('Code size exceeds maximum limit of 10KB');
    }
    
    // Проверка на потенциально опасные команды
    const dangerousPatterns = [
      /rm\s+-rf/,
      /mkfs/,
      /dd\s+if=/,
      /:\(\)\{\s*:\|:\s*&\s*\}/, // Fork bomb
      /eval\s*\(/,
      /exec\s*\(/,
      /system\s*\(/,
      /subprocess\.call/,
      /os\.system/,
      /child_process\.exec/
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        throw new Error('Code contains potentially dangerous commands');
      }
    }
  }

  _cleanupHistory() {
    const maxHistorySize = 1000;
    
    if (this.executionHistory.size > maxHistorySize) {
      const entries = Array.from(this.executionHistory.entries());
      const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Удаляем старые записи
      const toRemove = sortedEntries.slice(0, this.executionHistory.size - maxHistorySize);
      
      for (const [key] of toRemove) {
        this.executionHistory.delete(key);
      }
      
      logger.info('History cleaned up', { removedCount: toRemove.length });
    }
  }

  _getHistoryStats() {
    const history = Array.from(this.executionHistory.values());
    
    const languageStats = {};
    const successStats = { success: 0, failure: 0 };
    
    history.forEach(execution => {
      // Статистика по языкам
      languageStats[execution.language] = (languageStats[execution.language] || 0) + 1;
      
      // Статистика по успешности
      if (execution.result.success) {
        successStats.success++;
      } else {
        successStats.failure++;
      }
    });
    
    return {
      totalExecutions: history.length,
      languageStats,
      successStats,
      averageCodeLength: history.reduce((sum, exec) => sum + exec.code.length, 0) / history.length
    };
  }

  async cleanup() {
    await dockerManager.cleanupAllContainers();
    this.executionHistory.clear();
    logger.info('AI Agent cleaned up');
  }
}

export const aiAgent = new AIAgent();
