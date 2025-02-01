import { openai } from '../config/environment';
import { SolanaService } from './solana.service';
import { RoastResponse, WalletData } from '../types';
import { imgflipService } from './imgflip.service';
import logger from '../utils/logger';

export class RoastService {
  constructor(private solanaService: SolanaService) {}

  async generateRoast(walletAddress: string): Promise<RoastResponse> {
    try {
      logger.info('Starting roast generation for wallet:', walletAddress);
      
      // 1. Get wallet data
      const walletData = await this.solanaService.getWalletData(walletAddress);
      logger.info('Wallet data retrieved:', walletData);

      // 2. Generate roast and meme text in one call
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a savage crypto comedian roasting Solana wallets. Your style combines 
              technical knowledge with brutal honesty and wit. Think of a mix between Vitalik Buterin's 
              technical insight and WSB's humor.

              You MUST respond with a valid JSON object in this format:
              {
                "roast": "Technical yet savage roast using actual wallet stats",
                "meme_top_text": "Setup (crypto culture reference)",
                "meme_bottom_text": "Punchline (wallet-specific burn)"
              }

              Guidelines for the JSON response:
              - Be specific: reference exact numbers from the wallet
              - Use crypto/web3 culture references
              - If balance < 1 SOL: roast their "micro wallet energy"
              - If no NFTs: mock their "right-click save" mentality
              - If inactive: joke about "diamond hands or forgot seed phrase"
              - If high balance but no activity: "whale watching or just stuck?"
              
              Example bad roast: "This wallet is inactive"
              Example good roast: "0.0001 SOL and no NFTs? Your wallet's so poor it's applying for a Celsius refund!"
              
              Remember to return ONLY valid JSON!`
          },
          {
            role: "user",
            content: `Generate a JSON roast for this Solana wallet:
              Balance: ${walletData.balance} SOL
              Transactions: ${walletData.transactionCount}
              NFTs: ${walletData.nftCount}
              ${walletData.lastActivity ? `Last Active: ${walletData.lastActivity.toLocaleDateString()}` : 'Never active'}
              
              Return the roast in the specified JSON format!`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0].message.content;
      logger.info('OpenAI response received:', responseText);

      if (!responseText) {
        throw new Error('Empty response from OpenAI');
      }

      try {
        const response = JSON.parse(responseText) as RoastResponse;
        
        // Validate all required fields exist
        if (!response.roast || !response.meme_top_text || !response.meme_bottom_text) {
          throw new Error('Missing required fields in response');
        }

        // Generate meme image
        logger.info('Generating meme with text:', { 
          top: response.meme_top_text, 
          bottom: response.meme_bottom_text 
        });
        
        const memeUrl = await imgflipService.generateMeme(
          response.meme_top_text,
          response.meme_bottom_text,
          response.roast
        );

        logger.info('Meme generated successfully:', memeUrl);

        return {
          ...response,
          wallet: walletData,
          meme_url: memeUrl
        };
      } catch (error) {
        logger.error('Failed to parse OpenAI response:', responseText);
        throw new Error('Invalid response format from OpenAI');
      }
    } catch (error) {
      logger.error('Error in generateRoast:', error);
      throw error;
    }
  }
} 