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

export interface RoastResponse {
  roast: string;
  meme_url: string;
  wallet: {
    address: string;
    balance: number;
    nftCount: number;
    transactionCount: number;
    lastActivity?: string;
  };
}

export interface WalletAnalysis {
  balance: number;
  nftCount: number;
  transactionCount: number;
  lastActivity?: string;
} 