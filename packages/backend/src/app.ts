import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error.middleware';
import roastRoutes from './routes/roast.routes';
import { environment } from './config/environment';
import logger from './utils/logger';
import { requestLogger } from './middleware/logging.middleware';
import routes from './routes';
import twitterRouter from './routes/api/twitter';
import { RedisMonitorService } from './services/monitoring/redis-monitor.service';
import twitterAuthRoutes from './routes/twitter-auth.routes';
import { DevTwitterService } from './services/twitter/dev-twitter.service';
import { TwitterOAuthService } from './services/twitter/twitter-oauth.service';
import { RedisAlert } from './types/redis.types';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://solanaroast.lol',
    // Allow ngrok URLs with updated domain
    /^https:\/\/.*\.ngrok-free\.app$/
  ],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(requestLogger);

// Initialize services
const redisMonitor = RedisMonitorService.getInstance();
const oauthService = TwitterOAuthService.getInstance();
const devTwitterService = new DevTwitterService();

// Start Redis monitoring in production
if (process.env.NODE_ENV === 'production') {
  redisMonitor.start();
  redisMonitor.on('alert', (alert: RedisAlert) => {
    logger.warn('Redis alert:', alert);
  });
}

// Initialize dev Twitter service
devTwitterService.initialize().catch((error: Error) => {
  logger.error('Failed to initialize dev Twitter service:', error);
});

// Before routes
logger.info('Available routes:', {
  base: '/',
  twitter: '/api/twitter'
});

// Mount routes in correct order
app.use('/api/twitter', twitterRouter);  // Mount specific routes first
app.use('/', routes);                    // Mount catch-all routes last

// Register routes
app.use('/api', twitterAuthRoutes);

// After routes - add path info to debug logging
app.use((req, res, next) => {
  logger.debug('Request received:', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    mountPath: req.route?.path
  });
  next();
});

// Health check endpoint
app.get('/health', async (_: Request, res: Response) => {
  const redisMetrics = redisMonitor.getMetrics();
  const twitterStatus = await devTwitterService.getStatus();
  
  res.json({
    status: 'ok',
    redis: {
      connected: redisMetrics.isConnected,
      metrics: redisMetrics
    },
    twitter: {
      dev: twitterStatus,
      oauth: {
        configured: !!(
          process.env.TWITTER_CLIENT_ID &&
          process.env.TWITTER_CLIENT_SECRET
        )
      }
    }
  });
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal, cleaning up...');
  redisMonitor.stop();
  await devTwitterService.quit();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  redisMonitor.stop();
  process.exit(0);
});

export default app;