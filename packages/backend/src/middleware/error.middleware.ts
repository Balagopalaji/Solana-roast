import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorResponse } from '../types';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) => {
  logger.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong. Please try again later.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}; 