import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`Incoming ${req.method} request to ${req.path}`, {
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
}; 