import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
export class DockerService {
    docker;
    activeContainers = new Map();
    constructor() {
        this.docker = new Docker({
            socketPath: config.docker.host.replace('unix://', ''),
        });
    }
    async executeCode(language, codeBlocks, sessionId) {
        const executions = [];
        for (const block of codeBlocks) {
            try {
                const startTime = Date.now();
                const executionId = uuidv4();
                logger.info('Starting code execution', {
                    executionId,
                    language: block.language,
                    filename: block.filename,
                    codeLength: block.code.length,
                });
                const dockerConfig = this.getDockerConfig(block.language);
                const containerId = await this.createContainer(dockerConfig, executionId);
                const result = await this.runCode(containerId, dockerConfig, block);
                const duration = Date.now() - startTime;
                const execution = {
                    id: executionId,
                    language: block.language,
                    code: block.code,
                    result,
                    timestamp: new Date(),
                    sessionId,
                    duration,
                };
                executions.push(execution);
                logger.info('Code execution completed', {
                    executionId,
                    success: result.success,
                    duration,
                    outputLength: result.output.length,
                });
                await this.cleanupContainer(containerId);
            }
            catch (error) {
                logger.error('Code execution failed', {
                    language: block.language,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                const failedExecution = {
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
    getDockerConfig(language) {
        const configs = {
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
            return configs.python;
        }
        return config;
    }
    async createContainer(dockerConfig, executionId) {
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
                Memory: config.docker.memoryLimit * 1024 * 1024,
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
        for (const setupCmd of dockerConfig.setupCommands) {
            await this.runCommand(container, setupCmd);
        }
        return executionId;
    }
    async runCode(containerId, dockerConfig, codeBlock) {
        const containerInfo = this.activeContainers.get(containerId);
        if (!containerInfo) {
            throw new Error('Container not found');
        }
        const { container } = containerInfo;
        const filename = codeBlock.filename || this.getDefaultFilename(codeBlock.language);
        try {
            await this.writeFile(container, filename, codeBlock.code);
            const hasTests = this.detectTests(codeBlock.code);
            let output = '';
            let error = '';
            let exitCode = 0;
            if (hasTests) {
                const testResult = await this.runCommand(container, `${dockerConfig.testCommand} ${filename}`);
                output = testResult.output;
                error = testResult.error;
                exitCode = testResult.exitCode;
            }
            else {
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
        }
        catch (error) {
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Unknown error',
                exitCode: -1,
                containerId,
            };
        }
    }
    async runCommand(container, command) {
        const exec = await container.exec({
            Cmd: ['/bin/bash', '-c', command],
            AttachStdout: true,
            AttachStderr: true,
        });
        return new Promise((resolve, reject) => {
            let output = '';
            let error = '';
            let stream;
            exec.start({}, (err, streamData) => {
                if (err) {
                    reject(err);
                    return;
                }
                stream = streamData;
                stream?.on('data', (chunk) => {
                    if (chunk.length >= 8) {
                        const streamType = chunk.readUInt8(0);
                        const data = chunk.slice(8).toString();
                        if (streamType === 1) {
                            output += data;
                        }
                        else if (streamType === 2) {
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
            setTimeout(() => {
                stream?.destroy();
                reject(new Error('Command execution timeout'));
            }, config.docker.timeout);
        });
    }
    async writeFile(container, filename, content) {
        const escapedContent = content.replace(/'/g, "'\"'\"'");
        await this.runCommand(container, `echo '${escapedContent}' > ${filename}`);
    }
    getDefaultFilename(language) {
        const extensions = {
            python: 'main.py',
            javascript: 'main.js',
            typescript: 'main.ts',
            java: 'Main.java',
            go: 'main.go',
            rust: 'main.rs',
        };
        return extensions[language.toLowerCase()] || 'main.txt';
    }
    detectTests(code) {
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
    async cleanupContainer(containerId) {
        const containerInfo = this.activeContainers.get(containerId);
        if (!containerInfo) {
            return;
        }
        try {
            await containerInfo.container.stop();
            await containerInfo.container.remove();
            this.activeContainers.delete(containerId);
            logger.info('Container cleaned up', { containerId });
        }
        catch (error) {
            logger.error('Failed to cleanup container', { containerId, error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async getStats() {
        return {
            activeContainers: this.activeContainers.size,
            maxContainers: config.docker.maxContainers,
        };
    }
    async cleanupAllContainers() {
        const cleanupPromises = Array.from(this.activeContainers.keys())
            .map(containerId => this.cleanupContainer(containerId));
        await Promise.allSettled(cleanupPromises);
        logger.info('All containers cleaned up');
    }
}
export const dockerService = new DockerService();
//# sourceMappingURL=docker.service.js.map