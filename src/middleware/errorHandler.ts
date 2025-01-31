import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorResponse } from '../types';
import logger from '../utils/logger';
import { environment } from '../config/environment';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response<ErrorResponse>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  logger.error('Error:', err);

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const status = err instanceof AppError ? err.status : 'error';
  const message = err.message || 'Something went wrong';

  res.status(statusCode).json({
    status,
    message,
    ...(environment.nodeEnv === 'development' && { stack: err.stack }),
  });
}; 