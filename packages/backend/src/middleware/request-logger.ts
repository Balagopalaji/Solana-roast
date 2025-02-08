import logger from '../utils/logger';
import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    headers: {
      'content-type': req.headers['content-type'],
      origin: req.headers.origin
    }
  });
  next();
}; 