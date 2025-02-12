export interface RoastShare {
  roast: string;
  memeUrl: string;
  walletAddress: string;
  createdAt: Date;
  expiresAt: Date;
  lastAccessed?: Date;
  shareCount: number;
}

export interface StorageMetrics {
  totalRoasts: number;
  totalStorage: number; // in MB
}

// Internal type for Redis storage
export interface StoredRoastResponse {
  roast: string;
  meme_url: string;
  meme_top_text?: string;
  meme_bottom_text?: string;
  wallet: {
    address: string;
    balance: number;
    nftCount: number;
    transactionCount: number;
    lastActivity?: string; // ISO string format
  };
  timestamp: number;
  walletAddress: string;
  createdAt: number;
}

export interface RoastResponse {
  roast: string;
  meme_url: string;
  meme_top_text?: string;
  meme_bottom_text?: string;
  wallet: {
    address: string;
    balance: number;
    nftCount: number;
    transactionCount: number;
    lastActivity?: Date;
  };
  timestamp: number;
  walletAddress: string;
  createdAt: number;
}

export interface WalletAnalysis {
  balance: number;
  nftCount: number;
  transactionCount: number;
  lastActivity?: string;
} 