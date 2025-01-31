import { environment, validateEnv } from '../config/environment';
import { openai } from '../config/environment';
import { Connection } from '@solana/web3.js';
import axios, { AxiosError } from 'axios';
import logger from '../utils/logger';

// Define interface for Solscan error response
interface SolscanErrorResponse {
  message?: string;
  error?: string;
}

async function verifySetup() {
  logger.info('🔍 Starting environment verification...');
  const results = {
    env: false,
    openai: false,
    solana: false,
    solscan: false
  };

  try {
    // 1. Check environment variables
    logger.info('Checking environment variables...');
    validateEnv();
    results.env = true;
    logger.info('✅ Environment variables validated');

    // 2. Test OpenAI connection
    try {
      logger.info('Testing OpenAI connection...');
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 5
      });
      if (completion.choices[0].message) {
        results.openai = true;
        logger.info('✅ OpenAI connection successful');
      }
    } catch (err) {
      const error = err as Error;
      logger.error('❌ OpenAI connection failed:', error.message);
    }

    // 3. Test Solana RPC connection
    try {
      logger.info('Testing Solana RPC connection...');
      const connection = new Connection(environment.solana.rpcUrl);
      const blockHeight = await connection.getBlockHeight();
      results.solana = true;
      logger.info(`✅ Solana connection successful (Block height: ${blockHeight})`);
    } catch (err) {
      const error = err as Error;
      logger.error('❌ Solana RPC connection failed:', error.message);
    }

    // 4. Test Solscan API
    try {
      logger.info('Testing Solscan API connection...');
      // Use a known mainnet address for testing
      const testWallet = '3YtmWfNtVyMGK2MfKdTwxXsXqd6GQVtJ8iNuVHJNHwRR';
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${environment.solana.solscanApiKey}`  // Changed to Bearer auth
      };

      const response = await axios.get(
        `${environment.solana.solscanApiUrl}/v2/account/${testWallet}`,  // Changed to v2 endpoint
        { 
          headers,
          validateStatus: (status) => status < 500
        }
      );
      
      if (response.status === 200) {
        results.solscan = true;
        logger.info('✅ Solscan API connection successful');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      const error = err as AxiosError<SolscanErrorResponse>;
      const statusCode = error.response?.status;
      const errorData = error.response?.data;
      
      // Get error message with proper type checking
      const errorMessage = errorData?.message || errorData?.error || error.message;
      
      logger.error('❌ Solscan API connection failed:', 
        statusCode ? `HTTP ${statusCode}: ${errorMessage}` : errorMessage
      );
      
      logger.debug('Request failed with:', {  // Added debug info
        statusCode,
        headers: error.response?.headers,
        data: error.response?.data
      });
      
      if (statusCode === 429) {
        logger.info('ℹ️  Note: Rate limit exceeded. Consider getting a Solscan API key');
      } else if (statusCode === 403) {
        logger.info('ℹ️  Note: Authentication failed. Check your Solscan API key format');
      } else {
        logger.info('ℹ️  Note: Solscan API issues won\'t prevent the app from working');
      }
    }

    // Summary
    logger.info('\n🔍 Verification Summary:');
    logger.info(`Environment Variables: ${results.env ? '✅' : '❌'}`);
    logger.info(`OpenAI Connection: ${results.openai ? '✅' : '❌'}`);
    logger.info(`Solana RPC: ${results.solana ? '✅' : '❌'}`);
    logger.info(`Solscan API: ${results.solscan ? '✅' : '❌'}`);

    // Exit with appropriate code
    const criticalServices = results.env && results.openai && results.solana;
    if (criticalServices) {
      logger.info('✅ Critical services operational!');
      process.exit(0);
    } else {
      logger.error('❌ Some critical services failed verification');
      process.exit(1);
    }

  } catch (err) {
    const error = err as Error;
    logger.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifySetup(); 