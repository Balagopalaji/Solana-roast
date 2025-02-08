import { Request } from 'express';
import { AppError } from '../types';
import logger from '../utils/logger';

export class AuthService {
  validateApiKey(req: Request): void {
    const apiKey = req.headers['x-api-key'];
    
    if (!process.env.API_KEY) {
      logger.warn('API_KEY not configured in environment');
      return; // Skip validation if API key is not configured
    }

    if (!apiKey) {
      throw new AppError(401, 'error', 'Missing API key');
    }

    if (apiKey !== process.env.API_KEY) {
      throw new AppError(401, 'error', 'Invalid API key');
    }
  }
}

export const authService = new AuthService(); 