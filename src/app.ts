import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { environment } from './config/environment';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import healthRoutes from './routes/health';
import roastRoutes from './routes/roast.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: environment.corsOrigin,
  credentials: true,
}));

// Rate limiting
app.use(rateLimit({
  windowMs: environment.rateLimitWindow,
  max: environment.rateLimitMax,
  message: 'Too many requests from this IP, please try again later.',
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging
app.use(requestLogger);

// Routes
app.use('/health', healthRoutes);
app.use('/roast', roastRoutes);

// Error handling
app.use(errorHandler);

export default app; 