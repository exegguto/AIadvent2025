import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: process.env.PORT || 3010,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  docker: {
    host: process.env.DOCKER_HOST || 'unix:///var/run/docker.sock',
    timeout: parseInt(process.env.CONTAINER_TIMEOUT) || 30000,
    maxSize: parseInt(process.env.MAX_CONTAINER_SIZE) || 100
  },
  
  security: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
