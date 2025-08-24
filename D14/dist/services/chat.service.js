import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { llmService } from './llm.service.js';
import { dockerService } from './docker.service.js';
export class ChatService {
    sessions = new Map();
    async processMessage(sessionId, userMessage, projectContext) {
        try {
            logger.info('Processing chat message', {
                sessionId,
                messageLength: userMessage.length,
                hasProjectContext: !!projectContext,
            });
            const session = this.getOrCreateSession(sessionId, projectContext);
            const userMsg = {
                id: uuidv4(),
                role: 'user',
                content: userMessage,
                timestamp: new Date(),
                sessionId,
            };
            session.messages.push(userMsg);
            session.updatedAt = new Date();
            const llmResponse = await llmService.processMessage(userMessage, session.messages, session.projectContext);
            let executions = [];
            if (llmResponse.hasCode && llmResponse.codeBlocks.length > 0) {
                executions = await dockerService.executeCode(llmResponse.codeBlocks[0]?.language || 'python', llmResponse.codeBlocks, sessionId);
            }
            const assistantMsg = {
                id: uuidv4(),
                role: 'assistant',
                content: llmResponse.text,
                timestamp: new Date(),
                sessionId,
                codeBlocks: llmResponse.codeBlocks,
                executionResults: executions,
            };
            session.messages.push(assistantMsg);
            session.updatedAt = new Date();
            if (llmResponse.codeBlocks.length > 0) {
                this.updateProjectContextInternal(session, llmResponse.codeBlocks);
            }
            logger.info('Chat message processed successfully', {
                sessionId,
                hasCode: llmResponse.hasCode,
                executionsCount: executions.length,
            });
            return {
                success: true,
                message: assistantMsg,
                executions,
            };
        }
        catch (error) {
            logger.error('Chat processing error', {
                sessionId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                success: false,
                message: {
                    id: uuidv4(),
                    role: 'system',
                    content: `Ошибка обработки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
                    timestamp: new Date(),
                    sessionId,
                },
                executions: [],
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    getOrCreateSession(sessionId, projectContext) {
        let session = this.sessions.get(sessionId);
        if (!session) {
            session = {
                id: sessionId,
                messages: [],
                projectContext,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.sessions.set(sessionId, session);
            logger.info('New chat session created', { sessionId });
        }
        return session;
    }
    updateProjectContextInternal(session, codeBlocks) {
        if (!session.projectContext) {
            session.projectContext = {
                files: [],
                dependencies: [],
                language: 'unknown',
            };
        }
        for (const block of codeBlocks) {
            if (block.filename) {
                const existingFileIndex = session.projectContext.files.findIndex(f => f.name === block.filename);
                const fileData = {
                    name: block.filename,
                    content: block.code,
                    type: this.detectFileType(block.filename, block.code),
                };
                if (existingFileIndex >= 0) {
                    session.projectContext.files[existingFileIndex] = fileData;
                }
                else {
                    session.projectContext.files.push(fileData);
                }
            }
        }
        const languageCounts = {};
        for (const file of session.projectContext.files) {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (ext) {
                languageCounts[ext] = (languageCounts[ext] || 0) + 1;
            }
        }
        const mostCommonLanguage = Object.entries(languageCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0];
        if (mostCommonLanguage) {
            session.projectContext.language = this.mapExtensionToLanguage(mostCommonLanguage);
        }
    }
    detectFileType(filename, content) {
        const lowerFilename = filename.toLowerCase();
        const lowerContent = content.toLowerCase();
        if (lowerFilename.includes('test') || lowerFilename.includes('spec')) {
            return 'test';
        }
        if (lowerFilename.includes('config') || lowerFilename.includes('json') || lowerFilename.includes('yaml')) {
            return 'config';
        }
        if (lowerContent.includes('test') || lowerContent.includes('assert') || lowerContent.includes('expect')) {
            return 'test';
        }
        return 'code';
    }
    mapExtensionToLanguage(ext) {
        const languageMap = {
            'py': 'python',
            'js': 'javascript',
            'ts': 'typescript',
            'java': 'java',
            'go': 'go',
            'rs': 'rust',
            'cpp': 'cpp',
            'c': 'c',
            'php': 'php',
            'rb': 'ruby',
        };
        return languageMap[ext] || ext;
    }
    async getSessionHistory(sessionId, limit = 50) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return [];
        }
        return session.messages.slice(-limit);
    }
    async clearSession(sessionId) {
        this.sessions.delete(sessionId);
        logger.info('Chat session cleared', { sessionId });
    }
    async getSessionStats() {
        const sessions = Array.from(this.sessions.values());
        const totalMessages = sessions.reduce((sum, session) => sum + session.messages.length, 0);
        const activeSessions = sessions.filter(session => Date.now() - session.updatedAt.getTime() < 24 * 60 * 60 * 1000).length;
        return {
            totalSessions: sessions.length,
            totalMessages,
            averageMessagesPerSession: sessions.length > 0 ? totalMessages / sessions.length : 0,
            activeSessions,
        };
    }
    async getSession(sessionId) {
        return this.sessions.get(sessionId) || null;
    }
    async updateProjectContext(sessionId, context) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.projectContext = context;
            session.updatedAt = new Date();
            logger.info('Project context updated', { sessionId });
        }
    }
}
export const chatService = new ChatService();
//# sourceMappingURL=chat.service.js.map