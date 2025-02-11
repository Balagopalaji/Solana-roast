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
    'SOLANA_RPC_URL',
    // Add if Twitter is required:
    // 'TWITTER_API_KEY',
    // 'TWITTER_API_SECRET',
    // 'TWITTER_ACCESS_TOKEN',
    // 'TWITTER_ACCESS_SECRET'
  ];

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
    memeUrl: 'https://i.imgflip.com/default-meme.jpg' // Add a default fallback meme URL
  },
  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET
  }
} as const;

// Create and export OpenAI client
export const openai = new OpenAI({
  apiKey: apiKey
}); 