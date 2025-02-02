import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.debug('Incoming request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body,
    query: req.query
  });

  // Log response
  const originalSend = res.send;
  res.send = function (body) {
    logger.debug('Outgoing response:', {
      status: res.statusCode,
      body
    });
    return originalSend.call(this, body);
  };

  next();
}; 