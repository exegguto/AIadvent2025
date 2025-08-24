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
    app;
    server;
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        this.app.use(helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
        }));
        this.app.use(cors({
            origin: config.server.corsOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        }));
        this.app.use(compression());
        const rateLimiter = new RateLimiterMemory({
            keyGenerator: (req) => req.ip || 'unknown',
            points: config.security.rateLimitMax,
            duration: config.security.rateLimitWindow / 1000,
        });
        this.app.use(async (req, res, next) => {
            try {
                await rateLimiter.consume(req.ip || 'unknown');
                next();
            }
            catch (error) {
                res.status(429).json({
                    success: false,
                    error: 'Too many requests',
                    retryAfter: Math.ceil(config.security.rateLimitWindow / 1000),
                });
            }
        });
        this.app.use(express.json({
            limit: `${config.security.maxCodeSize}kb`,
            verify: (req, res, buf) => {
                if (buf.length > config.security.maxCodeSize * 1024) {
                    throw new Error('Request too large');
                }
            },
        }));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use((req, res, next) => {
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
        this.app.use(express.static(path.join(__dirname, '../public')));
    }
    setupRoutes() {
        this.app.use('/api', routes);
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
        this.app.get('/health', (req, res) => {
            res.status(200).json({ status: 'ok' });
        });
    }
    setupErrorHandling() {
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found',
                path: req.originalUrl,
            });
        });
        this.app.use((error, req, res, next) => {
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
    async start() {
        try {
            await this.testDockerConnection();
            this.server = this.app.listen(config.server.port, () => {
                logger.info('Server started successfully', {
                    port: config.server.port,
                    nodeEnv: config.server.nodeEnv,
                    timestamp: new Date().toISOString(),
                    version: '2.0.0',
                });
            });
            this.setupGracefulShutdown();
        }
        catch (error) {
            logger.error('Failed to start server', { error: error instanceof Error ? error.message : 'Unknown error' });
            process.exit(1);
        }
    }
    async testDockerConnection() {
        try {
            await dockerService.getStats();
            logger.info('Docker connection successful');
        }
        catch (error) {
            logger.error('Docker connection failed', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw new Error('Docker is not available. Please ensure Docker is running and accessible.');
        }
    }
    setupGracefulShutdown() {
        const gracefulShutdown = async (signal) => {
            logger.info(`Received ${signal}, starting graceful shutdown`);
            if (this.server) {
                this.server.close(async () => {
                    logger.info('HTTP server closed');
                    try {
                        await dockerService.cleanupAllContainers();
                        logger.info('All containers cleaned up');
                    }
                    catch (error) {
                        logger.error('Error during container cleanup', { error: error instanceof Error ? error.message : 'Unknown error' });
                    }
                    process.exit(0);
                });
                setTimeout(() => {
                    logger.error('Forced shutdown after timeout');
                    process.exit(1);
                }, 30000);
            }
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
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
const app = new Application();
app.start().catch((error) => {
    logger.error('Application startup failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    process.exit(1);
});
export default app;
//# sourceMappingURL=index.js.map