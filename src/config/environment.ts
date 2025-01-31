import dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Create a global OpenAI instance
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const environment = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    solscanApiUrl: process.env.SOLSCAN_API_URL || 'https://api.solscan.io',
    solscanApiKey: process.env.SOLSCAN_API_KEY, // Optional: for higher rate limits
  }
};

// Validate required environment variables
export const validateEnv = (): void => {
  const requiredEnvVars: string[] = [
    'NODE_ENV',
    'PORT',
    'CORS_ORIGIN',
    'OPENAI_API_KEY',
    'SOLANA_RPC_URL',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
};