import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { logger } from './logger.js';
import { aiAgent } from './ai-agent.js';
import routes from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware безопасности
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS настройки
app.use(cors({
  origin: config.security.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статические файлы
app.use(express.static(path.join(__dirname, '../public')));

// Логирование запросов
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// API маршруты
app.use('/api', routes);

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({
    name: 'AI Code Executor',
    version: '1.0.0',
    description: 'AI agent that executes code in Docker containers',
    endpoints: {
      execute: '/api/execute',
      history: '/api/history',
      stats: '/api/stats',
      health: '/api/health',
      languages: '/api/languages'
    }
  });
});

// Обработка необработанных ошибок
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await aiAgent.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await aiAgent.cleanup();
  process.exit(0);
});

// Запуск сервера
const server = app.listen(config.server.port, () => {
  logger.info('Server started', {
    port: config.server.port,
    nodeEnv: config.server.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Обработка ошибок сервера
server.on('error', (error) => {
  logger.error('Server error', { error: error.message });
  process.exit(1);
});

export default app;
