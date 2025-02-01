export interface RoastResponse {
  roast: string;
  meme_top_text: string;
  meme_bottom_text: string;
  meme_url?: string;
  wallet?: {
    address: string;
    balance: number;
    transactionCount: number;
    nftCount: number;
    lastActivity?: Date;
  };
} 