import { ChatMessage, ChatSession, CodeExecution, ProjectContext } from '../types/index.js';
export declare class ChatService {
    private sessions;
    processMessage(sessionId: string, userMessage: string, projectContext?: ProjectContext): Promise<{
        success: boolean;
        message: ChatMessage;
        executions: CodeExecution[];
        error?: string;
    }>;
    private getOrCreateSession;
    private updateProjectContextInternal;
    private detectFileType;
    private mapExtensionToLanguage;
    getSessionHistory(sessionId: string, limit?: number): Promise<ChatMessage[]>;
    clearSession(sessionId: string): Promise<void>;
    getSessionStats(): Promise<{
        totalSessions: number;
        totalMessages: number;
        averageMessagesPerSession: number;
        activeSessions: number;
    }>;
    getSession(sessionId: string): Promise<ChatSession | null>;
    updateProjectContext(sessionId: string, context: ProjectContext): Promise<void>;
}
export declare const chatService: ChatService;
//# sourceMappingURL=chat.service.d.ts.map