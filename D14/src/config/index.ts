import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  server: z.object({
    port: z.coerce.number().default(3010),
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
    corsOrigins: z.string().transform(val => val.split(',')).default('http://localhost:3000'),
  }),
  
  docker: z.object({
    host: z.string().default('unix:///var/run/docker.sock'),
    timeout: z.coerce.number().default(30000),
    maxContainers: z.coerce.number().default(10),
    memoryLimit: z.coerce.number().default(512), // MB
    cpuLimit: z.coerce.number().default(50), // percentage
  }),
  
  openai: z.object({
    apiKey: z.string().min(1, 'OpenAI API key is required'),
    model: z.string().default('gpt-4o-mini'),
    maxTokens: z.coerce.number().default(4000),
    temperature: z.coerce.number().default(0.7),
  }),
  
  security: z.object({
    rateLimitWindow: z.coerce.number().default(900000), // 15 minutes
    rateLimitMax: z.coerce.number().default(100),
    maxCodeSize: z.coerce.number().default(10000), // 10KB
  }),
  
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    format: z.enum(['json', 'simple']).default('json'),
  }),
  
  proxy: z.object({
    httpProxy: z.string().optional(),
    httpsProxy: z.string().optional(),
  }),
});

const config = configSchema.parse({
  server: {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    corsOrigins: process.env.CORS_ORIGINS,
  },
  docker: {
    host: process.env.DOCKER_HOST,
    timeout: process.env.CONTAINER_TIMEOUT,
    maxContainers: process.env.MAX_CONTAINERS,
    memoryLimit: process.env.MEMORY_LIMIT,
    cpuLimit: process.env.CPU_LIMIT,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL,
    maxTokens: process.env.OPENAI_MAX_TOKENS,
    temperature: process.env.OPENAI_TEMPERATURE,
  },
  security: {
    rateLimitWindow: process.env.RATE_LIMIT_WINDOW,
    rateLimitMax: process.env.RATE_LIMIT_MAX,
    maxCodeSize: process.env.MAX_CODE_SIZE,
  },
  logging: {
    level: process.env.LOG_LEVEL,
    format: process.env.LOG_FORMAT,
  },
  proxy: {
    httpProxy: process.env.HTTP_PROXY,
    httpsProxy: process.env.HTTPS_PROXY,
  },
});

export { config };
