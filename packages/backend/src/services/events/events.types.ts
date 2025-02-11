import { AppEvent } from './base-event.service';

export enum EventType {
  // Roast Events
  ROAST_GENERATED = 'ROAST_GENERATED',
  ROAST_SHARED = 'ROAST_SHARED',
  
  // Twitter Events
  TWITTER_SHARE_STARTED = 'TWITTER_SHARE_STARTED',
  TWITTER_SHARE_COMPLETED = 'TWITTER_SHARE_COMPLETED',
  TWITTER_SHARE_FAILED = 'TWITTER_SHARE_FAILED',
  TWITTER_AUTH_STARTED = 'TWITTER_AUTH_STARTED',
  TWITTER_AUTH_COMPLETED = 'TWITTER_AUTH_COMPLETED',
  TWITTER_AUTH_FAILED = 'TWITTER_AUTH_FAILED',
  
  // Analytics Events
  WALLET_ROASTED = 'WALLET_ROASTED',
  LEADERBOARD_UPDATED = 'LEADERBOARD_UPDATED'
}

export interface RoastEvent extends AppEvent {
  type: EventType.ROAST_GENERATED | EventType.ROAST_SHARED;
  payload: {
    walletAddress: string;
    roastText: string;
    imageUrl?: string;
    timestamp: number;
    metadata?: {
      solanaTokens?: number;
      nftCount?: number;
    };
  };
}

export interface TwitterShareEvent extends AppEvent {
  type: EventType.TWITTER_SHARE_STARTED | 
        EventType.TWITTER_SHARE_COMPLETED | 
        EventType.TWITTER_SHARE_FAILED;
  payload: {
    walletAddress: string;
    tweetUrl?: string;
    error?: string;
    timestamp: number;
    shareMethod: 'dev' | 'user';
  };
}

export interface TwitterAuthEvent extends AppEvent {
  type: EventType.TWITTER_AUTH_STARTED | 
        EventType.TWITTER_AUTH_COMPLETED | 
        EventType.TWITTER_AUTH_FAILED;
  payload: {
    userId: string;
    error?: string;
    timestamp: number;
  };
}

export interface AnalyticsEvent extends AppEvent {
  type: EventType.WALLET_ROASTED | EventType.LEADERBOARD_UPDATED;
  payload: {
    walletAddress: string;
    timestamp: number;
    metadata: Record<string, any>;
  };
} 