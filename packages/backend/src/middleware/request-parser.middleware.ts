import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestParser = (req: Request, res: Response, next: NextFunction) => {
  const rawBody: Buffer[] = [];
  
  req.on('data', (chunk: Buffer) => {
    rawBody.push(chunk);
  });

  req.on('end', () => {
    const body = Buffer.concat(rawBody).toString();
    logger.debug('Raw request body:', {
      contentType: req.headers['content-type'],
      rawBody: body,
      parsedBody: req.body // Already parsed by express.json()
    });
    next();
  });

  req.on('error', (error) => {
    logger.error('Error reading request body:', error);
    next(error);
  });
}; 