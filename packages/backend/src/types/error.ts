export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  API_ERROR = 'API_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export interface ApiError {
  code: ErrorType;
  message: string;
  details?: unknown;
  timestamp: string;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorType,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }

  toResponse(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString()
    };
  }
} 