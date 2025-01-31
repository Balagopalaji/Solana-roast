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
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    solscanApiUrl: process.env.SOLSCAN_API_URL || 'https://api.solscan.io',
    solscanApiKey: process.env.SOLSCAN_API_KEY
  }
};

// Create and export OpenAI client
export const openai = new OpenAI({
  apiKey: apiKey
}); 