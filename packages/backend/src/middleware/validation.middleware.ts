import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import logger from '../utils/logger';

const shareSchema = z.object({
  roastText: z.string().min(1),
  memeUrl: z.string().url(),
  walletAddress: z.string().min(32).max(44)
});

export const validateShareRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    shareSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid share request data' });
  }
};

const roastRequestSchema = z.object({
  walletAddress: z.string().min(32).max(44)
});

export const validateRoastRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    roastRequestSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid wallet address format' });
  }
};

export interface ValidationSchema {
  required?: string[];
  optional?: string[];
}

export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    logger.debug('Validating request:', {
      body: req.body,
      schema: schema
    });

    if (schema.required) {
      const missingFields = schema.required.filter(
        field => !req.body[field]
      );

      if (missingFields.length > 0) {
        logger.warn('Request validation failed:', {
          missingFields,
          body: req.body
        });

        return res.status(400).json({
          error: 'Invalid request',
          details: `Missing required fields: ${missingFields.join(', ')}`
        });
      }
    }

    next();
  };
}; 