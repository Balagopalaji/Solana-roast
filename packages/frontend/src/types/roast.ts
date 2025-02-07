export interface RoastResponse {
  roast: string;
  meme_url: string;
  wallet: {
    address: string;
    balance?: number;
    nftCount?: number;
    transactionCount?: number;
  };
} 