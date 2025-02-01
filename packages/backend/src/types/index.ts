export { AppError } from './AppError';

export interface ErrorResponse {
  status: string;
  message: string;
  stack?: string;
}

export interface WalletData {
  address: string;
  balance: number;
  transactionCount: number;
  nftCount: number;
  lastActivity?: Date;
}

export interface RoastResponse {
  roast: string;
  meme_top_text: string;
  meme_bottom_text: string;
  meme_url?: string;
  wallet?: WalletData;
} 