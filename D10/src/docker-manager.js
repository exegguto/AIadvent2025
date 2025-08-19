import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config.js';
import { logger } from './logger.js';

class DockerManager {
  constructor() {
    this.docker = new Docker({
      socketPath: config.docker.host.replace('unix://', '')
    });
    this.activeContainers = new Map();
  }

  async createContainer(language, code) {
    const containerId = uuidv4();
    const containerName = `ai-executor-${containerId}`;
    
    try {
      const container = await this.docker.createContainer({
        Image: 'ai-code-executor:latest',
        name: containerName,
        Cmd: ['/bin/bash'],
        Tty: true,
        OpenStdin: true,
        StdinOnce: false,
        WorkingDir: '/workspace',
        HostConfig: {
          Memory: 512 * 1024 * 1024, // 512MB
          MemorySwap: 0,
          CpuPeriod: 100000,
          CpuQuota: 50000, // 50% CPU
          NetworkMode: 'none',
          ReadonlyRootfs: false,
          SecurityOpt: ['no-new-privileges'],
          CapDrop: ['ALL']
        }
      });

      this.activeContainers.set(containerId, {
        container,
        name: containerName,
        createdAt: new Date()
      });

      logger.info('Container created', { containerId, containerName });
      return containerId;
    } catch (error) {
      logger.error('Failed to create container', { error: error.message });
      throw error;
    }
  }

  async executeCode(containerId, language, code) {
    const containerInfo = this.activeContainers.get(containerId);
    if (!containerInfo) {
      throw new Error('Container not found');
    }

    try {
      await containerInfo.container.start();
      
      const execCommand = this._buildExecCommand(language, code);
      const exec = await containerInfo.container.exec({
        Cmd: ['/bin/bash', '-c', execCommand],
        AttachStdout: true,
        AttachStderr: true
      });

      const stream = await exec.start();
      
      return new Promise((resolve, reject) => {
        let output = '';
        let error = '';
        
        stream.on('data', (chunk) => {
          // Docker exec возвращает данные в формате [stream_type, data]
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

        stream.on('end', () => {
          resolve({
            output: output.trim(),
            error: error.trim(),
            success: !error.trim()
          });
        });

        stream.on('error', (err) => {
          reject(err);
        });

        // Timeout
        setTimeout(() => {
          stream.destroy();
          reject(new Error('Execution timeout'));
        }, config.docker.timeout);
      });
    } catch (error) {
      logger.error('Failed to execute code', { containerId, error: error.message });
      throw error;
    }
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
    } catch (error) {
      logger.error('Failed to cleanup container', { containerId, error: error.message });
    }
  }

  _buildExecCommand(language, code) {
    const escapedCode = code.replace(/'/g, "'\"'\"'");
    
    switch (language.toLowerCase()) {
      case 'python':
      case 'py':
        return `python3 -c '${escapedCode}' 2>&1`;
      
      case 'javascript':
      case 'js':
      case 'node':
        return `node -e '${escapedCode}' 2>&1`;
      
      case 'bash':
      case 'shell':
        return `${escapedCode} 2>&1`;
      
      case 'java':
        return `echo '${escapedCode}' > Main.java && javac Main.java && java Main 2>&1`;
      
      case 'go':
        return `echo '${escapedCode}' > main.go && go run main.go 2>&1`;
      
      case 'rust':
        return `echo '${escapedCode}' > main.rs && rustc main.rs && ./main 2>&1`;
      
      default:
        return `echo '${escapedCode}' 2>&1`;
    }
  }

  async getContainerStats() {
    return {
      activeContainers: this.activeContainers.size,
      maxContainers: config.docker.maxSize
    };
  }

  async cleanupAllContainers() {
    const cleanupPromises = Array.from(this.activeContainers.keys())
      .map(containerId => this.cleanupContainer(containerId));
    
    await Promise.allSettled(cleanupPromises);
    logger.info('All containers cleaned up');
  }
}

export const dockerManager = new DockerManager();
