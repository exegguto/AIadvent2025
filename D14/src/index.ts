import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import routes from './routes/index.js';
import { dockerService } from './services/docker.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Application {
  private app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }));

    // CORS
    this.app.use(cors({
      origin: config.server.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const rateLimiter = new RateLimiterMemory({
      keyGenerator: (req: any) => req.ip || 'unknown',
      points: config.security.rateLimitMax,
      duration: config.security.rateLimitWindow / 1000,
    } as any);

    this.app.use(async (req: any, res: any, next: any) => {
      try {
        await rateLimiter.consume(req.ip || 'unknown');
        next();
      } catch (error) {
        res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: Math.ceil(config.security.rateLimitWindow / 1000),
        });
      }
    });

    // Body parsing
    this.app.use(express.json({ 
      limit: `${config.security.maxCodeSize}kb`,
      verify: (req: any, res: any, buf: Buffer) => {
        if (buf.length > config.security.maxCodeSize * 1024) {
          throw new Error('Request too large');
        }
      },
    }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: any, res: any, next: any) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
      });

      next();
    });

    // Static files
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api', routes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Cursor-like Code Executor',
        version: '2.0.0',
        description: 'AI-powered code execution with Docker isolation',
        endpoints: {
          chat: '/api/chat',
          execute: '/api/execute',
          health: '/api/health',
          stats: '/api/stats',
          languages: '/api/languages',
        },
        documentation: '/api/docs',
      });
    });

    // Health check for load balancers
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
      });
    });

    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        error: config.server.nodeEnv === 'development' ? error.message : 'Internal server error',
        ...(config.server.nodeEnv === 'development' && { stack: error.stack }),
      });
    });
  }

  async start(): Promise<void> {
    try {
      // Test Docker connection
      await this.testDockerConnection();

      this.server = this.app.listen(config.server.port, () => {
        logger.info('Server started successfully', {
          port: config.server.port,
          nodeEnv: config.server.nodeEnv,
          timestamp: new Date().toISOString(),
          version: '2.0.0',
        });
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server', { error: error instanceof Error ? error.message : 'Unknown error' });
      process.exit(1);
    }
  }

  private async testDockerConnection(): Promise<void> {
    try {
      await dockerService.getStats();
      logger.info('Docker connection successful');
    } catch (error) {
      logger.error('Docker connection failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Docker is not available. Please ensure Docker is running and accessible.');
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);
      
      if (this.server) {
        this.server.close(async () => {
          logger.info('HTTP server closed');
          
          try {
            await dockerService.cleanupAllContainers();
            logger.info('All containers cleaned up');
          } catch (error) {
            logger.error('Error during container cleanup', { error: error instanceof Error ? error.message : 'Unknown error' });
          }
          
          process.exit(0);
        });

        // Force close after 30 seconds
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 30000);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      process.exit(1);
    });
  }
}

// Start the application
const app = new Application();
app.start().catch((error) => {
  logger.error('Application startup failed', { error: error instanceof Error ? error.message : 'Unknown error' });
  process.exit(1);
});

export default app;
