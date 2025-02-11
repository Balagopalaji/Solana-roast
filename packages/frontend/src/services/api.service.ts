import { logger } from '../utils/logger';

export class ApiClient {
  private _baseUrl: string;

  constructor() {
    this._baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  get baseUrl(): string {
    return this._baseUrl;
  }

  async post(endpoint: string, data: any) {
    try {
      const response = await fetch(`${this._baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'  // Important for cookies if needed
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      logger.error('API request failed:', {
        endpoint,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  isTwitterEnabled(): boolean {
    const enabled = import.meta.env.VITE_ENABLE_TWITTER === 'true';
    logger.debug('Twitter enabled check:', {
      value: import.meta.env.VITE_ENABLE_TWITTER,
      enabled
    });
    return enabled;
  }
} 