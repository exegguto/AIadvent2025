import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export interface Project {
  id: string;
  name: string;
  description?: string | undefined;
  language: string;
  framework?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
  files: ProjectFile[];
}

export interface ProjectFile {
  name: string;
  content: string;
  type: 'code' | 'test' | 'config' | 'other';
  path: string;
  lastModified: Date;
}

export class ProjectService {
  private projectsDir: string;
  private projects: Map<string, Project> = new Map();

  constructor() {
    this.projectsDir = path.join(process.cwd(), 'projects');
    this.ensureProjectsDir();
  }

  private async ensureProjectsDir(): Promise<void> {
    try {
      await fs.access(this.projectsDir);
    } catch {
      await fs.mkdir(this.projectsDir, { recursive: true });
      logger.info('Projects directory created', { path: this.projectsDir });
    }
  }

  async createProject(name: string, language: string, description?: string): Promise<Project> {
    const projectId = uuidv4();
    const projectDir = path.join(this.projectsDir, projectId);
    
    await fs.mkdir(projectDir, { recursive: true });

    const project: Project = {
      id: projectId,
      name,
      description: description || undefined,
      language,
      createdAt: new Date(),
      updatedAt: new Date(),
      files: [],
    };

    this.projects.set(projectId, project);
    await this.saveProjectMetadata(project);
    
    logger.info('Project created', { projectId, name, language });
    return project;
  }

  async getProject(projectId: string): Promise<Project | null> {
    if (this.projects.has(projectId)) {
      return this.projects.get(projectId)!;
    }

    // Попробуем загрузить с диска
    try {
      const project = await this.loadProjectMetadata(projectId);
      if (project) {
        this.projects.set(projectId, project);
        return project;
      }
    } catch (error) {
      logger.error('Failed to load project', { projectId, error: error instanceof Error ? error.message : 'Unknown error' });
    }

    return null;
  }

  async listProjects(): Promise<Project[]> {
    try {
      const projectIds = await fs.readdir(this.projectsDir);
      const projects: Project[] = [];

      for (const projectId of projectIds) {
        const project = await this.getProject(projectId);
        if (project) {
          projects.push(project);
        }
      }

      return projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      logger.error('Failed to list projects', { error: error instanceof Error ? error.message : 'Unknown error' });
      return [];
    }
  }

  async saveFile(projectId: string, filename: string, content: string, type: 'code' | 'test' | 'config' | 'other' = 'code'): Promise<ProjectFile> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const filePath = path.join(this.projectsDir, projectId, filename);
    const fileDir = path.dirname(filePath);
    
    // Создаем директории если нужно
    await fs.mkdir(fileDir, { recursive: true });
    
    // Сохраняем файл на диск
    await fs.writeFile(filePath, content, 'utf-8');

    const projectFile: ProjectFile = {
      name: filename,
      content,
      type,
      path: filePath,
      lastModified: new Date(),
    };

    // Обновляем проект
    const existingFileIndex = project.files.findIndex(f => f.name === filename);
    if (existingFileIndex >= 0) {
      project.files[existingFileIndex] = projectFile;
    } else {
      project.files.push(projectFile);
    }

    project.updatedAt = new Date();
    this.projects.set(projectId, project);
    await this.saveProjectMetadata(project);

    logger.info('File saved', { projectId, filename, type });
    return projectFile;
  }

  async readFile(projectId: string, filename: string): Promise<ProjectFile | null> {
    const project = await this.getProject(projectId);
    if (!project) {
      return null;
    }

    const file = project.files.find(f => f.name === filename);
    if (!file) {
      return null;
    }

    try {
      const content = await fs.readFile(file.path, 'utf-8');
      return {
        ...file,
        content,
        lastModified: new Date(),
      };
    } catch (error) {
      logger.error('Failed to read file', { projectId, filename, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  async deleteFile(projectId: string, filename: string): Promise<boolean> {
    const project = await this.getProject(projectId);
    if (!project) {
      return false;
    }

    const file = project.files.find(f => f.name === filename);
    if (!file) {
      return false;
    }

    try {
      await fs.unlink(file.path);
      project.files = project.files.filter(f => f.name !== filename);
      project.updatedAt = new Date();
      this.projects.set(projectId, project);
      await this.saveProjectMetadata(project);

      logger.info('File deleted', { projectId, filename });
      return true;
    } catch (error) {
      logger.error('Failed to delete file', { projectId, filename, error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      const projectDir = path.join(this.projectsDir, projectId);
      await fs.rm(projectDir, { recursive: true, force: true });
      this.projects.delete(projectId);

      logger.info('Project deleted', { projectId });
      return true;
    } catch (error) {
      logger.error('Failed to delete project', { projectId, error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  private async saveProjectMetadata(project: Project): Promise<void> {
    const metadataPath = path.join(this.projectsDir, project.id, '.project.json');
    const metadata = {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      files: project.files.map(f => ({
        ...f,
        lastModified: f.lastModified.toISOString(),
      })),
    };

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  private async loadProjectMetadata(projectId: string): Promise<Project | null> {
    try {
      const metadataPath = path.join(this.projectsDir, projectId, '.project.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent);

      return {
        ...metadata,
        createdAt: new Date(metadata.createdAt),
        updatedAt: new Date(metadata.updatedAt),
        files: metadata.files.map((f: any) => ({
          ...f,
          lastModified: new Date(f.lastModified),
        })),
      };
    } catch {
      return null;
    }
  }

  async getProjectStats(): Promise<{
    totalProjects: number;
    totalFiles: number;
    averageFilesPerProject: number;
  }> {
    const projects = await this.listProjects();
    const totalFiles = projects.reduce((sum, p) => sum + p.files.length, 0);

    return {
      totalProjects: projects.length,
      totalFiles,
      averageFilesPerProject: projects.length > 0 ? totalFiles / projects.length : 0,
    };
  }
}

export const projectService = new ProjectService();
