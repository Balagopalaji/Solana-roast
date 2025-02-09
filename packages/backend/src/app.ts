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

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/', routes);

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