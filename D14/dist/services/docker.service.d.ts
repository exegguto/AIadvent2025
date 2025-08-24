import { CodeExecution, CodeBlock } from '../types/index.js';
export declare class DockerService {
    private docker;
    private activeContainers;
    constructor();
    executeCode(language: string, codeBlocks: CodeBlock[], sessionId: string): Promise<CodeExecution[]>;
    private getDockerConfig;
    private createContainer;
    private runCode;
    private runCommand;
    private writeFile;
    private getDefaultFilename;
    private detectTests;
    private cleanupContainer;
    getStats(): Promise<{
        activeContainers: number;
        maxContainers: number;
    }>;
    cleanupAllContainers(): Promise<void>;
}
export declare const dockerService: DockerService;
//# sourceMappingURL=docker.service.d.ts.map