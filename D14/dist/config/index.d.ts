declare const config: {
    server: {
        port: number;
        nodeEnv: "development" | "production" | "test";
        corsOrigins: string[];
    };
    docker: {
        host: string;
        timeout: number;
        maxContainers: number;
        memoryLimit: number;
        cpuLimit: number;
    };
    openai: {
        apiKey: string;
        model: string;
        maxTokens: number;
        temperature: number;
    };
    security: {
        rateLimitWindow: number;
        rateLimitMax: number;
        maxCodeSize: number;
    };
    logging: {
        level: "error" | "warn" | "info" | "debug";
        format: "json" | "simple";
    };
    proxy: {
        httpProxy?: string | undefined;
        httpsProxy?: string | undefined;
    };
};
export { config };
//# sourceMappingURL=index.d.ts.map