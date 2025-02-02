import { logger } from './logger';

export function logAppInitialization() {
  logger.info('Application initializing:', {
    environment: process.env.NODE_ENV,
    buildTime: process.env.BUILD_TIME || 'development',
    version: process.env.npm_package_version,
    timestamp: new Date().toISOString()
  });
} 