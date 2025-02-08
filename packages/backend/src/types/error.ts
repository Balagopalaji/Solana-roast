export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  OPENAI_ERROR = 'OPENAI_ERROR',
  SOLANA_ERROR = 'SOLANA_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: unknown;
  timestamp: string;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
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