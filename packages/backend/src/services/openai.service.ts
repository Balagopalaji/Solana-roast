import OpenAI from 'openai';
import type { APIError } from 'openai';
import NodeCache from 'node-cache';
import { PublicKey } from '@solana/web3.js';
import { AppError, WalletData } from '../types';
import logger from '../utils/logger';
import { openai } from '../config/environment';

interface RoastResponse {
  roast: string;
  meme_top_text: string;
  meme_bottom_text: string;
}

export class OpenAIService {
  private cache: NodeCache;

  constructor() {
    // Cache roasts for 24 hours
    this.cache = new NodeCache({ stdTTL: 86400 });
  }

  private isValidSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  private async generateRoastPrompt(walletData: WalletData): Promise<string> {
    return `Generate a humorous roast for a Solana wallet address. Be creative and funny, but keep it light-hearted.
    
Wallet Data:
- Address: ${walletData.address}
- Balance: ${walletData.balance} SOL
- NFTs: ${walletData.nftCount || 0}
- Tokens: ${walletData.tokenCount || 0}
- Last Activity: ${walletData.lastActivity || 'Unknown'}

The response should be in JSON format with three fields:
- roast: A witty one-liner roasting the wallet based on its data
- meme_top_text: Top text for a meme
- meme_bottom_text: Bottom text for a meme

Keep the roast Solana-themed and reference the wallet's actual data. Consider:
- Low/high balance
- NFT collection size
- Token holdings
- Activity level
${walletData.balance < 1 ? '- Make a joke about being down bad' : ''}
${walletData.nftCount === 0 ? '- Reference missing the NFT wave' : ''}
${!walletData.lastActivity ? '- Joke about wallet inactivity' : ''}

Example response:
{
  "roast": "Your wallet's so rekt even SafeMoon holders feel bad for you",
  "meme_top_text": "BUYS EVERY SOL DIP",
  "meme_bottom_text": "STILL DOWN 90%"
}

Important: Respond only with the JSON object, no additional text.`;
  }

  public async generateRoast(walletData: WalletData): Promise<RoastResponse> {
    if (!this.isValidSolanaAddress(walletData.address)) {
      throw new AppError(400, 'error', 'Invalid Solana wallet address');
    }

    // Check cache first
    const cachedRoast = this.cache.get<RoastResponse>(walletData.address);
    if (cachedRoast) {
      logger.debug('Returning cached roast for wallet:', walletData.address);
      return cachedRoast;
    }

    try {
      const prompt = await this.generateRoastPrompt(walletData);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a witty roast generator for Solana wallets. Keep responses funny but not mean-spirited. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 150,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0].message.content;
      if (!responseText) {
        throw new Error('Empty response from OpenAI');
      }

      let response: RoastResponse;
      try {
        response = JSON.parse(responseText);
      } catch (parseError) {
        logger.error('Failed to parse OpenAI response:', responseText);
        throw new Error('Invalid JSON response from OpenAI');
      }

      // Validate response format
      if (!response.roast || !response.meme_top_text || !response.meme_bottom_text) {
        logger.error('Invalid response format:', response);
        throw new Error('Invalid response format from OpenAI');
      }

      // Cache the result
      this.cache.set(walletData.address, response);

      return response;
    } catch (error) {
      logger.error('Error generating roast:', error);
      
      if (error instanceof Error) {
        const isOpenAIError = (err: any): err is APIError => {
          return 'status' in err && 'message' in err && 'code' in err;
        };

        if (isOpenAIError(error)) {
          logger.error('OpenAI API Error:', {
            status: error.status,
            message: error.message,
            code: error.code,
            type: error.type
          });
          
          throw new AppError(
            error.status || 500,
            'error',
            'OpenAI API error: ' + error.message
          );
        }
      }

      throw new AppError(
        500,
        'error',
        'Failed to generate roast. Please try again later.'
      );
    }
  }

  public async testRoastGeneration(): Promise<RoastResponse> {
    const testWallet = 'DRtqaYHyXFPVD5hzKHk3f9JF5GwEjAHgtqzxVHnM8u9Y';
    return this.generateRoast({ address: testWallet, balance: 0, nftCount: 0, tokenCount: 0, lastActivity: null } as WalletData);
  }
}

export const openAIService = new OpenAIService(); 