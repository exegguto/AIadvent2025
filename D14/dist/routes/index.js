import { Router } from 'express';
import { z } from 'zod';
import { chatService } from '../services/chat.service.js';
import { dockerService } from '../services/docker.service.js';
import { projectService } from '../services/project.service.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
const router = Router();
const chatMessageSchema = z.object({
    message: z.string().min(1, 'Message is required').max(10000, 'Message too long'),
    sessionId: z.string().optional(),
    projectContext: z.object({
        files: z.array(z.object({
            name: z.string(),
            content: z.string(),
            type: z.enum(['code', 'test', 'config', 'other']),
        })),
        dependencies: z.array(z.string()),
        language: z.string(),
        framework: z.string().optional(),
    }).optional(),
});
const executeCodeSchema = z.object({
    language: z.string().min(1, 'Language is required'),
    code: z.string().min(1, 'Code is required').max(10000, 'Code too long'),
    sessionId: z.string().optional(),
});
const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
    language: z.string().min(1, 'Language is required'),
    description: z.string().optional(),
});
const errorHandler = (error, req, res, next) => {
    logger.error('Route error', {
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
    });
    if (error instanceof z.ZodError) {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            details: error.errors,
        });
    }
    res.status(500).json({
        success: false,
        error: config.server.nodeEnv === 'development'
            ? (error instanceof Error ? error.message : 'Unknown error')
            : 'Internal server error',
    });
};
router.post('/chat', async (req, res, next) => {
    try {
        const { message, sessionId, projectContext } = chatMessageSchema.parse(req.body);
        const sessionIdToUse = sessionId || `session-${Date.now()}`;
        const result = await chatService.processMessage(sessionIdToUse, message, projectContext || undefined);
        res.json({
            success: result.success,
            message: result.message,
            executions: result.executions,
            sessionId: sessionIdToUse,
            error: result.error,
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/chat/history/:sessionId', async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const history = await chatService.getSessionHistory(sessionId, limit);
        res.json({
            success: true,
            data: history,
            count: history.length,
            sessionId,
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/chat/session/:sessionId', async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        await chatService.clearSession(sessionId);
        res.json({
            success: true,
            message: 'Session cleared successfully',
            sessionId,
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/chat/stats', async (req, res, next) => {
    try {
        const stats = await chatService.getSessionStats();
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/execute', async (req, res, next) => {
    try {
        const { language, code, sessionId } = executeCodeSchema.parse(req.body);
        const sessionIdToUse = sessionId || `exec-${Date.now()}`;
        const executions = await dockerService.executeCode(language, [{ language, code }], sessionIdToUse);
        res.json({
            success: true,
            executions,
            sessionId: sessionIdToUse,
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/projects', async (req, res, next) => {
    try {
        const { name, language, description } = createProjectSchema.parse(req.body);
        const project = await projectService.createProject(name, language, description);
        res.json({
            success: true,
            data: project,
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/projects', async (req, res, next) => {
    try {
        const projects = await projectService.listProjects();
        res.json({
            success: true,
            data: projects,
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/projects/:projectId', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const project = await projectService.getProject(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }
        return res.json({
            success: true,
            data: project,
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/projects/:projectId', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const deleted = await projectService.deleteProject(projectId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }
        return res.json({
            success: true,
            message: 'Project deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/projects/:projectId/files/:filename', async (req, res, next) => {
    try {
        const { projectId, filename } = req.params;
        const file = await projectService.readFile(projectId, filename);
        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found',
            });
        }
        return res.json({
            success: true,
            data: file,
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/projects/:projectId/files/:filename', async (req, res, next) => {
    try {
        const { projectId, filename } = req.params;
        const deleted = await projectService.deleteFile(projectId, filename);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'File not found',
            });
        }
        return res.json({
            success: true,
            message: 'File deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '2.0.0',
    });
});
router.get('/stats', async (req, res, next) => {
    try {
        const [dockerStats, chatStats] = await Promise.all([
            dockerService.getStats(),
            chatService.getSessionStats(),
        ]);
        res.json({
            success: true,
            data: {
                docker: dockerStats,
                chat: chatStats,
                system: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    nodeVersion: process.version,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/languages', (req, res) => {
    res.json({
        success: true,
        data: {
            languages: [
                { name: 'Python', code: 'python', extensions: ['py'] },
                { name: 'JavaScript', code: 'javascript', extensions: ['js'] },
                { name: 'TypeScript', code: 'typescript', extensions: ['ts'] },
                { name: 'Java', code: 'java', extensions: ['java'] },
                { name: 'Go', code: 'go', extensions: ['go'] },
                { name: 'Rust', code: 'rust', extensions: ['rs'] },
            ],
        },
    });
});
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
    });
});
router.use(errorHandler);
export default router;
//# sourceMappingURL=index.js.map