import app from './app';
import { environment, validateEnv } from './config/environment';
import logger from './utils/logger';

// Validate environment variables
validateEnv();

const server = app.listen(environment.port, () => {
  logger.info(`Server running in ${environment.nodeEnv} mode on port ${environment.port}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
}); 