declare class Application {
    private app;
    private server;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    start(): Promise<void>;
    private testDockerConnection;
    private setupGracefulShutdown;
}
declare const app: Application;
export default app;
//# sourceMappingURL=index.d.ts.map