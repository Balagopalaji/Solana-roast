import dotenv from 'dotenv';
import path from 'path';
import { OpenAI } from 'openai';

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

// Validate required environment variables
export function validateEnv() {
  const required = [
    'NODE_ENV',
    'PORT',
    'CORS_ORIGIN',
    'OPENAI_API_KEY',
    'SOLANA_RPC_URL'
  ];

  // Add Twitter validation in development mode
  if (process.env.NODE_ENV === 'development') {
    const twitterVars = [
      'TWITTER_API_KEY',
      'TWITTER_API_SECRET',
      'TWITTER_ACCESS_TOKEN',
      'TWITTER_ACCESS_SECRET'
    ];

    for (const name of twitterVars) {
      if (!process.env[name]) {
        console.warn(`⚠️  Warning: Missing Twitter environment variable: ${name}`);
        console.warn('Twitter integration will be disabled until all credentials are provided');
      }
    }
  }

  for (const name of required) {
    if (!process.env[name]) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }
}

// Create OpenAI client with global variable workaround for sk-proj format
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is required');
}

// Export environment configuration
export interface RedisConfig {
  url: string;
  host: string;
  port: number;
  password?: string;
  tls: boolean;
  maxRetriesPerRequest: number;
  healthCheckInterval: number;
  connectionTimeout: number;
  maxPoolSize: number;
}

export const environment = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  appUrl: process.env.APP_URL || 'https://solanaroast.lol',
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    solscanApiUrl: process.env.SOLSCAN_API_URL || 'https://api.solscan.io',
    solscanApiKey: process.env.SOLSCAN_API_KEY
  },
  imgflip: {
    username: process.env.IMGFLIP_USERNAME || '',
    password: process.env.IMGFLIP_PASSWORD || ''
  },
  fallbacks: {
    memeUrl: 'https://i.imgflip.com/default-meme.jpg'
  },
  twitter: {
    // OAuth 1.0a for dev account
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
    
    // OAuth 2.0 for user authentication
    oauth2: {
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      scopes: [
        'tweet.read',
        'tweet.write',
        'users.read',
        'offline.access'
      ]
    },
    
    // URL configuration
    urls: {
      callback: process.env.NODE_ENV === 'production'
        ? 'https://solanaroast.lol/api/twitter/callback'
        : process.env.VITE_TWITTER_CALLBACK_URL || 'http://localhost:5173/api/twitter/callback',
      website: process.env.NODE_ENV === 'production'
        ? 'https://solanaroast.lol'
        : process.env.VITE_API_URL || 'http://localhost:5173'
    },
    
    // Rate limits
    rateLimits: {
      WINDOW_MS: parseInt(process.env.TWITTER_RATE_LIMIT_WINDOW_MS || '900000', 10),
      UPLOAD_LIMIT: parseInt(process.env.TWITTER_UPLOAD_LIMIT || '30', 10),
      TWEET_LIMIT: parseInt(process.env.TWITTER_TWEET_LIMIT || '50', 10),
    }
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.NODE_ENV === 'production',
    maxRetriesPerRequest: 3,
    healthCheckInterval: 30000,
    connectionTimeout: 5000,
    maxPoolSize: 20
  } as RedisConfig,
  // Add development-specific configuration
  development: {
    ngrok: {
      enabled: process.env.NODE_ENV === 'development',
      tunnelUrl: process.env.VITE_API_URL,
      checkUrl: 'http://localhost:4040/api/tunnels'
    }
  }
} as const;

// Create and export OpenAI client
export const openai = new OpenAI({
  apiKey: apiKey
});

export interface TwitterConfig {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  accessSecret?: string;
  clientId?: string;
  clientSecret?: string;
  urls: {
    callback: string;
    website: string;
  };
  rateLimits: {
    maxRetries: number;
    retryDelay: number;
  };
} 