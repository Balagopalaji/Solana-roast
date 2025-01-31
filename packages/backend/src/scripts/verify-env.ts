import { environment, validateEnv } from '../config/environment';
import { openai } from '../config/environment';
import { Connection } from '@solana/web3.js';
import axios, { AxiosError } from 'axios';
import logger from '../utils/logger';

interface SolscanErrorResponse {
  message?: string;
  error?: string;
}

// Add a test log to verify logger is working
logger.info('Starting verification script...');

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

    // 4. Test Solscan API if key is provided
    if (environment.solana.solscanApiKey) {
      try {
        logger.info('Testing Solscan API connection...');
        const testWallet = 'DRtqaYHyXFPVD5hzKHk3f9JF5GwEjAHgtqzxVHnM8u9Y';
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'Authorization': `Bearer ${environment.solana.solscanApiKey}`
        };

        const response = await axios.get(
          `${environment.solana.solscanApiUrl}/v2/account/${testWallet}`,
          { headers }
        );
        
        if (response.status === 200) {
          results.solscan = true;
          logger.info('✅ Solscan API connection successful');
        }
      } catch (err) {
        const error = err as AxiosError<SolscanErrorResponse>;
        logger.error('❌ Solscan API connection failed:', 
          error.response?.status || error.message);
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

  } catch (error) {
    logger.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifySetup();
