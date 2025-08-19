import express from 'express';
import { aiAgent } from './ai-agent.js';
import { logger } from './logger.js';
import { config } from './config.js';

const router = express.Router();

// Middleware для валидации JSON
router.use(express.json({ limit: '10mb' }));

// Middleware для логирования запросов
router.use((req, res, next) => {
  logger.info('API Request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Выполнение кода
router.post('/execute', async (req, res) => {
  try {
    const { language, code, sessionId } = req.body;
    
    if (!language || !code) {
      return res.status(400).json({
        success: false,
        error: 'Language and code are required'
      });
    }
    
    const result = await aiAgent.processRequest({
      language,
      code,
      sessionId: sessionId || 'anonymous'
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Execute endpoint error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Получение истории выполнений
router.get('/history', async (req, res) => {
  try {
    const { sessionId, limit = 50 } = req.query;
    
    let history = await aiAgent.getExecutionHistory(sessionId);
    
    if (limit) {
      history = history.slice(-parseInt(limit));
    }
    
    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    logger.error('History endpoint error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Получение конкретного выполнения по ID
router.get('/execution/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const execution = await aiAgent.getExecutionById(id);
    
    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }
    
    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    logger.error('Execution detail endpoint error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Получение статистики
router.get('/stats', async (req, res) => {
  try {
    const stats = await aiAgent.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Stats endpoint error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Проверка здоровья сервиса
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Поддерживаемые языки
router.get('/languages', (req, res) => {
  res.json({
    success: true,
    data: {
      languages: [
        { name: 'Python', code: 'python', extensions: ['py'] },
        { name: 'JavaScript', code: 'javascript', extensions: ['js'] },
        { name: 'Bash', code: 'bash', extensions: ['sh'] },
        { name: 'Java', code: 'java', extensions: ['java'] },
        { name: 'Go', code: 'go', extensions: ['go'] },
        { name: 'Rust', code: 'rust', extensions: ['rs'] }
      ]
    }
  });
});

// Обработка ошибок 404
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Глобальный обработчик ошибок
router.use((error, req, res, next) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  
  res.status(500).json({
    success: false,
    error: config.server.nodeEnv === 'development' ? error.message : 'Internal server error'
  });
});

export default router;
