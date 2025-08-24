export interface CodeExecution {
    id: string;
    language: string;
    code: string;
    tests?: string;
    result: ExecutionResult;
    timestamp: Date;
    sessionId: string;
    duration: number;
}
export interface ExecutionResult {
    success: boolean;
    output: string;
    error: string;
    exitCode: number;
    containerId: string;
}
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    sessionId: string;
    codeBlocks?: CodeBlock[];
    executionResults?: CodeExecution[];
}
export interface CodeBlock {
    language: string;
    code: string;
    filename?: string | undefined;
}
export interface LLMResponse {
    text: string;
    codeBlocks: CodeBlock[];
    hasCode: boolean;
    suggestions?: string[];
}
export interface ProjectContext {
    files: ProjectFile[];
    dependencies: string[];
    language: string;
    framework?: string | undefined;
}
export interface ProjectFile {
    name: string;
    content: string;
    type: 'code' | 'test' | 'config' | 'other';
}
export interface DockerConfig {
    image: string;
    language: string;
    setupCommands: string[];
    runCommand: string;
    testCommand?: string | undefined;
}
export interface SystemStats {
    activeContainers: number;
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    uptime: number;
}
export interface ChatSession {
    id: string;
    messages: ChatMessage[];
    projectContext?: ProjectContext | undefined;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=index.d.ts.map