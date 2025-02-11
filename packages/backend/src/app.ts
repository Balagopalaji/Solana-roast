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

// Before routes
logger.info('Available routes:', {
  base: '/',
  twitter: '/api/twitter'
});

// Mount routes in correct order
app.use('/api/twitter', twitterRouter);  // Mount specific routes first
app.use('/', routes);                    // Mount catch-all routes last

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
app.get('/health', (_: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;