import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { llmService } from './llm.service.js';
import { dockerService } from './docker.service.js';
import { projectService } from './project.service.js';
import { 
  ChatMessage, 
  ChatSession, 
  CodeExecution, 
  ProjectContext,
  LLMResponse 
} from '../types/index.js';

export class ChatService {
  private sessions: Map<string, ChatSession> = new Map();

  async processMessage(
    sessionId: string,
    userMessage: string,
    projectId?: string,
    shouldExecute: boolean = false,
    model?: string,
    systemPrompt?: string
  ): Promise<{
    success: boolean;
    message: ChatMessage;
    executions: CodeExecution[];
    error?: string;
  }> {
    try {
      logger.info('Processing chat message', {
        sessionId,
        projectId,
        messageLength: userMessage.length,
        shouldExecute,
        hasCustomSystemPrompt: !!systemPrompt,
        customPromptLength: systemPrompt?.length || 0,
      });

      // Get or create session
      const session = await this.getOrCreateSession(sessionId, projectId);
      
      // Add user message to session
      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        sessionId,
      };
      
      session.messages.push(userMsg);
      session.updatedAt = new Date();

      // Process with LLM
      const llmResponse = await llmService.processMessage(
        userMessage,
        session.messages,
        session.projectContext,
        model,
        systemPrompt
      );

      // Save generated files to project if projectId is provided
      if (projectId && llmResponse.hasCode && llmResponse.codeBlocks.length > 0) {
        logger.info('Saving generated files to project', {
          projectId,
          codeBlocksCount: llmResponse.codeBlocks.length,
          codeBlocks: llmResponse.codeBlocks.map(block => ({
            filename: block.filename,
            language: block.language,
            codeLength: block.code.length
          }))
        });
        
        for (const block of llmResponse.codeBlocks) {
          if (block.filename) {
            const fileType = this.detectFileType(block.filename, block.code);
            logger.info('Saving file', {
              projectId,
              filename: block.filename,
              fileType,
              codeLength: block.code.length
            });
            
            try {
              await projectService.saveFile(projectId, block.filename, block.code, fileType);
              logger.info('File saved successfully', {
                projectId,
                filename: block.filename,
                fileType
              });
            } catch (error) {
              logger.error('Failed to save file', {
                projectId,
                filename: block.filename,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          } else {
            logger.warn('Code block has no filename, skipping save', {
              projectId,
              language: block.language,
              codeLength: block.code.length
            });
          }
        }
      } else {
        logger.info('No files to save', {
          projectId,
          hasCode: llmResponse.hasCode,
          codeBlocksCount: llmResponse.codeBlocks.length
        });
      }

      // Execute code only if explicitly requested
      let executions: CodeExecution[] = [];
      if (shouldExecute && llmResponse.hasCode && llmResponse.codeBlocks.length > 0) {
        logger.info('Agent executing code', {
          sessionId,
          projectId,
          language: llmResponse.codeBlocks[0]?.language,
          codeBlocksCount: llmResponse.codeBlocks.length,
          userMessage: userMessage.substring(0, 100) + '...'
        });

        // Get project files if projectId is provided
        let projectFiles: Array<{ name: string; content: string }> | undefined;
        if (projectId) {
          const project = await projectService.getProject(projectId);
          if (project) {
            projectFiles = project.files.map(file => ({
              name: file.name,
              content: file.content,
            }));
            logger.info('Project files loaded for execution', {
              projectId,
              filesCount: projectFiles.length,
              files: projectFiles.map(f => f.name)
            });
          }
        }
        
        executions = await dockerService.executeCode(
          llmResponse.codeBlocks[0]?.language || 'python',
          llmResponse.codeBlocks,
          sessionId,
          projectFiles
        );

        logger.info('Agent execution completed', {
          sessionId,
          projectId,
          executionsCount: executions.length,
          successCount: executions.filter(e => e.result.success).length,
          failureCount: executions.filter(e => !e.result.success).length
        });

        // Send execution results to LLM for analysis
        if (executions.length > 0) {
          logger.info('Sending execution results to LLM for analysis', {
            sessionId,
            projectId,
            executionsCount: executions.length
          });

          // Create execution summary for LLM
          const executionSummary = executions.map((exec, index) => {
            const status = exec.result.success ? '✅ УСПЕШНО' : '❌ ОШИБКА';
            const output = exec.result.output ? `\nВывод:\n${exec.result.output}` : '';
            const error = exec.result.error ? `\nОшибка:\n${exec.result.error}` : '';
            
            return `Выполнение ${index + 1} (${exec.language}): ${status}${output}${error}`;
          }).join('\n\n');

          // Create analysis request for LLM
          const analysisRequest = `Проанализируй результаты выполнения кода и дай краткий комментарий:

${executionSummary}

Пользовательский запрос: "${userMessage}"

Дай краткий анализ результатов выполнения.`;

          // Get LLM analysis of execution results
          const analysisResponse = await llmService.processMessage(
            analysisRequest,
            session.messages,
            session.projectContext,
            model,
            systemPrompt
          );

          // Update the assistant message with execution analysis
          llmResponse.text += '\n\n## 📊 Анализ результатов выполнения\n\n' + analysisResponse.text;
        }
      }

      // Create assistant message
      const assistantMsg: ChatMessage = {
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

      // Update project context if new files were created
      if (llmResponse.codeBlocks.length > 0) {
        this.updateProjectContextInternal(session, llmResponse.codeBlocks);
      }

      logger.info('Chat message processed successfully', {
        sessionId,
        projectId,
        hasCode: llmResponse.hasCode,
        executionsCount: executions.length,
      });

      return {
        success: true,
        message: assistantMsg,
        executions,
      };
    } catch (error) {
      logger.error('Chat processing error', {
        sessionId,
        projectId,
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

  private async getOrCreateSession(sessionId: string, projectId?: string): Promise<ChatSession> {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      let projectContext: ProjectContext | undefined;
      
      if (projectId) {
        const project = await projectService.getProject(projectId);
        if (project) {
          projectContext = {
            files: project.files.map(f => ({
              name: f.name,
              content: f.content,
              type: f.type,
            })),
            dependencies: [],
            language: project.language,
            framework: project.framework,
          };
        }
      }
      
      session = {
        id: sessionId,
        messages: [],
        projectContext,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.sessions.set(sessionId, session);
      
      logger.info('New chat session created', { sessionId, projectId });
    }

    return session;
  }

  private updateProjectContextInternal(session: ChatSession, codeBlocks: any[]): void {
    if (!session.projectContext) {
      session.projectContext = {
        files: [],
        dependencies: [],
        language: 'unknown',
      };
    }

    for (const block of codeBlocks) {
      if (block.filename) {
        const existingFileIndex = session.projectContext.files.findIndex(
          f => f.name === block.filename
        );

        const fileData = {
          name: block.filename,
          content: block.code,
          type: this.detectFileType(block.filename, block.code),
        };

        if (existingFileIndex >= 0) {
          session.projectContext.files[existingFileIndex] = fileData;
        } else {
          session.projectContext.files.push(fileData);
        }
      }
    }

    // Update language based on most common file type
    const languageCounts: Record<string, number> = {};
    for (const file of session.projectContext.files) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext) {
        languageCounts[ext] = (languageCounts[ext] || 0) + 1;
      }
    }

    const mostCommonLanguage = Object.entries(languageCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    if (mostCommonLanguage) {
      session.projectContext.language = this.mapExtensionToLanguage(mostCommonLanguage);
    }
  }

  private detectFileType(filename: string, content: string): 'code' | 'test' | 'config' | 'other' {
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

  private mapExtensionToLanguage(ext: string): string {
    const languageMap: Record<string, string> = {
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

  async getSessionHistory(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    return session.messages.slice(-limit);
  }

  async clearSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    logger.info('Chat session cleared', { sessionId });
  }

  async getSessionStats(): Promise<{
    totalSessions: number;
    totalMessages: number;
    averageMessagesPerSession: number;
    activeSessions: number;
  }> {
    const sessions = Array.from(this.sessions.values());
    const totalMessages = sessions.reduce((sum, session) => sum + session.messages.length, 0);
    const activeSessions = sessions.filter(session => 
      Date.now() - session.updatedAt.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    ).length;

    return {
      totalSessions: sessions.length,
      totalMessages,
      averageMessagesPerSession: sessions.length > 0 ? totalMessages / sessions.length : 0,
      activeSessions,
    };
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async updateProjectContext(sessionId: string, context: ProjectContext): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.projectContext = context;
      session.updatedAt = new Date();
      logger.info('Project context updated', { sessionId });
    }
  }
}

export const chatService = new ChatService();
