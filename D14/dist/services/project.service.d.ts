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
export declare class ProjectService {
    private projectsDir;
    private projects;
    constructor();
    private ensureProjectsDir;
    createProject(name: string, language: string, description?: string): Promise<Project>;
    getProject(projectId: string): Promise<Project | null>;
    listProjects(): Promise<Project[]>;
    saveFile(projectId: string, filename: string, content: string, type?: 'code' | 'test' | 'config' | 'other'): Promise<ProjectFile>;
    readFile(projectId: string, filename: string): Promise<ProjectFile | null>;
    deleteFile(projectId: string, filename: string): Promise<boolean>;
    deleteProject(projectId: string): Promise<boolean>;
    private saveProjectMetadata;
    private loadProjectMetadata;
    getProjectStats(): Promise<{
        totalProjects: number;
        totalFiles: number;
        averageFilesPerProject: number;
    }>;
}
export declare const projectService: ProjectService;
//# sourceMappingURL=project.service.d.ts.map