export class AppError extends Error {
  constructor(
    public statusCode: number,
    public status: string,
    message: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

export interface ErrorResponse {
  status: string;
  message: string;
  stack?: string;
}

export interface WalletData {
  address: string;
  balance: number;
  isActive: boolean;
  lastActivity: string | null;
  nftCount?: number;
  tokenCount?: number;
} 