export interface WalletProvider {
  getWalletData(address: string): Promise<WalletData>;
  getTokens(address: string): Promise<TokenData[]>;
  getNFTs(address: string): Promise<NFTData[]>;
}

export interface WalletData {
  address: string;
  balance: number;
  transactionCount: number;
  nftCount: number;
  tokenCount: number;
}

export interface TokenData {
  mint: string;
  amount: number;
  decimals: number;
}

export interface NFTData {
  mint: string;
  name: string;
  image?: string;
} 