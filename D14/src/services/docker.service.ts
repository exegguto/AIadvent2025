import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { CodeExecution, ExecutionResult, DockerConfig, CodeBlock } from '../types/index.js';

export class DockerService {
  private docker: Docker;
  private activeContainers: Map<string, { container: Docker.Container; createdAt: Date }> = new Map();

  constructor() {
    this.docker = new Docker({
      socketPath: config.docker.host.replace('unix://', ''),
    });
  }

  async executeCode(
    language: string,
    codeBlocks: CodeBlock[],
    sessionId: string,
    projectFiles?: Array<{ name: string; content: string }>
  ): Promise<CodeExecution[]> {
    const executions: CodeExecution[] = [];

    for (const block of codeBlocks) {
      try {
        const startTime = Date.now();
        const executionId = uuidv4();
        
        logger.info('Agent starting code execution', {
          executionId,
          language: block.language,
          filename: block.filename,
          codeLength: block.code.length,
          hasProjectFiles: projectFiles && projectFiles.length > 0,
          projectFilesCount: projectFiles?.length || 0
        });

        const dockerConfig = this.getDockerConfig(block.language);
        
        // Log Docker container creation
        logger.info('Creating Docker container', {
          executionId,
          image: dockerConfig.image,
          language: dockerConfig.language
        });
        const containerId = await this.createContainer(dockerConfig, executionId);
        
        logger.info('Docker container created successfully', {
          executionId,
          containerId,
          image: dockerConfig.image
        });
        
        // Copy project files to container if provided
        if (projectFiles && projectFiles.length > 0) {
          logger.info('Copying project files to container', {
            executionId,
            containerId,
            filesCount: projectFiles.length,
            files: projectFiles.map(f => f.name)
          });
          await this.copyProjectFiles(containerId, projectFiles);
        }
        
        logger.info('Starting code execution in container', {
          executionId,
          containerId,
          language: block.language,
          filename: block.filename || 'main',
          isTest: block.code.toLowerCase().includes('test') || block.code.toLowerCase().includes('unittest') || block.code.toLowerCase().includes('pytest')
        });
        
        const result = await this.runCode(containerId, dockerConfig, block);
        const duration = Date.now() - startTime;

        const execution: CodeExecution = {
          id: executionId,
          language: block.language,
          code: block.code,
          result,
          timestamp: new Date(),
          sessionId,
          duration,
        };

        executions.push(execution);
        
        logger.info('Agent code execution completed', {
          executionId,
          success: result.success,
          duration,
          outputLength: result.output.length,
          exitCode: result.exitCode,
          hasError: !!result.error,
          isTestExecution: result.output.toLowerCase().includes('test') || result.output.toLowerCase().includes('unittest') || result.output.toLowerCase().includes('pytest')
        });

        await this.cleanupContainer(containerId);
      } catch (error) {
        logger.error('Code execution failed', {
          language: block.language,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        const failedExecution: CodeExecution = {
          id: uuidv4(),
          language: block.language,
          code: block.code,
          result: {
            success: false,
            output: '',
            error: error instanceof Error ? error.message : 'Unknown error',
            exitCode: -1,
            containerId: '',
          },
          timestamp: new Date(),
          sessionId,
          duration: 0,
        };

        executions.push(failedExecution);
      }
    }

    return executions;
  }

  private getDockerConfig(language: string): DockerConfig {
    const configs: Record<string, DockerConfig> = {
      python: {
        image: 'python:3.11-slim',
        language: 'python',
        setupCommands: [
          'apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*',
          'pip install pytest',
        ],
        runCommand: 'python3',
        testCommand: 'python3 -m pytest',
      },
      javascript: {
        image: 'node:18-slim',
        language: 'javascript',
        setupCommands: [
          'npm install -g jest',
        ],
        runCommand: 'node',
        testCommand: 'jest',
      },
      typescript: {
        image: 'node:18-slim',
        language: 'typescript',
        setupCommands: [
          'npm install -g typescript jest @types/jest ts-jest',
        ],
        runCommand: 'npx ts-node',
        testCommand: 'npx jest',
      },
      java: {
        image: 'openjdk:11-slim',
        language: 'java',
        setupCommands: [
          'apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*',
        ],
        runCommand: 'java',
        testCommand: 'mvn test',
      },
      go: {
        image: 'golang:1.21-alpine',
        language: 'go',
        setupCommands: [
          'apk add --no-cache git',
        ],
        runCommand: 'go run',
        testCommand: 'go test',
      },
      rust: {
        image: 'rust:1.75-slim',
        language: 'rust',
        setupCommands: [],
        runCommand: 'cargo run',
        testCommand: 'cargo test',
      },
    };

    const config = configs[language.toLowerCase()];
    if (!config) {
      return configs.python!;
    }
    return config;
  }

  private async createContainer(dockerConfig: DockerConfig, executionId: string): Promise<string> {
    const containerName = `code-executor-${executionId}`;
    
    const container = await this.docker.createContainer({
      Image: dockerConfig.image,
      name: containerName,
      Cmd: ['/bin/bash'],
      Tty: true,
      OpenStdin: true,
      StdinOnce: false,
      WorkingDir: '/workspace',
      HostConfig: {
        Memory: config.docker.memoryLimit * 1024 * 1024, // Convert MB to bytes
        MemorySwap: 0,
        CpuPeriod: 100000,
        CpuQuota: Math.floor(100000 * (config.docker.cpuLimit / 100)),
        NetworkMode: 'none',
        ReadonlyRootfs: false,
        SecurityOpt: ['no-new-privileges'],
        CapDrop: ['ALL'],
        Binds: [],
      },
    });

    this.activeContainers.set(executionId, {
      container,
      createdAt: new Date(),
    });

    await container.start();
    
    // Run setup commands
    for (const setupCmd of dockerConfig.setupCommands) {
      await this.runCommand(container, setupCmd);
    }

    return executionId;
  }

  private async runCode(
    containerId: string,
    dockerConfig: DockerConfig,
    codeBlock: CodeBlock
  ): Promise<ExecutionResult> {
    const containerInfo = this.activeContainers.get(containerId);
    if (!containerInfo) {
      throw new Error('Container not found');
    }

    const { container } = containerInfo;
    const filename = codeBlock.filename || this.getDefaultFilename(codeBlock.language);
    
    try {
      // Write code to file
      await this.writeFile(container, filename, codeBlock.code);
      
      // Check if there are tests in the code
      const hasTests = this.detectTests(codeBlock.code);
      
      let output = '';
      let error = '';
      let exitCode = 0;

      if (hasTests) {
        // Run tests
        const testResult = await this.runCommand(container, `${dockerConfig.testCommand} ${filename}`);
        output = testResult.output;
        error = testResult.error;
        exitCode = testResult.exitCode;
      } else {
        // Run code
        const runResult = await this.runCommand(container, `${dockerConfig.runCommand} ${filename}`);
        output = runResult.output;
        error = runResult.error;
        exitCode = runResult.exitCode;
      }

      return {
        success: exitCode === 0 && !error,
        output: output.trim(),
        error: error.trim(),
        exitCode,
        containerId,
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1,
        containerId,
      };
    }
  }

  private async runCommand(container: Docker.Container, command: string): Promise<{ output: string; error: string; exitCode: number }> {
    const exec = await container.exec({
      Cmd: ['/bin/bash', '-c', command],
      AttachStdout: true,
      AttachStderr: true,
    });

    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';
      let stream: any;
      
      exec.start({}, (err: any, streamData: any) => {
        if (err) {
          reject(err);
          return;
        }

        stream = streamData;
        stream?.on('data', (chunk: Buffer) => {
          // Docker exec returns data in format [stream_type, data]
          // stream_type: 1 = stdout, 2 = stderr
          if (chunk.length >= 8) {
            const streamType = chunk.readUInt8(0);
            const data = chunk.slice(8).toString();
            
            if (streamType === 1) {
              output += data;
            } else if (streamType === 2) {
              error += data;
            }
          }
        });

        stream?.on('end', async () => {
          const inspect = await exec.inspect();
          resolve({
            output: output.trim(),
            error: error.trim(),
            exitCode: inspect.ExitCode || 0,
          });
        });

        stream?.on('error', reject);
      });

      // Timeout
      setTimeout(() => {
        stream?.destroy();
        reject(new Error('Command execution timeout'));
      }, config.docker.timeout);
    });
  }

  private async writeFile(container: Docker.Container, filename: string, content: string): Promise<void> {
    const escapedContent = content.replace(/'/g, "'\"'\"'");
    await this.runCommand(container, `echo '${escapedContent}' > ${filename}`);
  }

  private async copyProjectFiles(containerId: string, projectFiles: Array<{ name: string; content: string }>): Promise<void> {
    const containerInfo = this.activeContainers.get(containerId);
    if (!containerInfo) {
      throw new Error('Container not found');
    }

    const { container } = containerInfo;
    
    for (const file of projectFiles) {
      const escapedContent = file.content.replace(/'/g, "'\"'\"'");
      await this.runCommand(container, `echo '${escapedContent}' > ${file.name}`);
    }
    
    logger.info('Project files copied to container', {
      containerId,
      filesCount: projectFiles.length,
      files: projectFiles.map(f => f.name),
    });
  }

  private getDefaultFilename(language: string): string {
    const extensions: Record<string, string> = {
      python: 'main.py',
      javascript: 'main.js',
      typescript: 'main.ts',
      java: 'Main.java',
      go: 'main.go',
      rust: 'main.rs',
    };

    return extensions[language.toLowerCase()] || 'main.txt';
  }

  private detectTests(code: string): boolean {
    const testPatterns = [
      /def test_/,
      /it\(/,
      /describe\(/,
      /@Test/,
      /func Test/,
      /#\[test\]/,
      /assert/,
      /expect/,
    ];

    return testPatterns.some(pattern => pattern.test(code));
  }

  private async cleanupContainer(containerId: string): Promise<void> {
    const containerInfo = this.activeContainers.get(containerId);
    if (!containerInfo) {
      return;
    }

    try {
      await containerInfo.container.stop();
      await containerInfo.container.remove();
      this.activeContainers.delete(containerId);
      
      logger.info('Container cleaned up', { containerId });
    } catch (error) {
      logger.error('Failed to cleanup container', { containerId, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getStats() {
    return {
      activeContainers: this.activeContainers.size,
      maxContainers: config.docker.maxContainers,
    };
  }

  async cleanupAllContainers(): Promise<void> {
    const cleanupPromises = Array.from(this.activeContainers.keys())
      .map(containerId => this.cleanupContainer(containerId));
    
    await Promise.allSettled(cleanupPromises);
    logger.info('All containers cleaned up');
  }
}

export const dockerService = new DockerService();
