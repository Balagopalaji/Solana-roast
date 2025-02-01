import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { environment } from '../config/environment';
import logger from '../utils/logger';

async function testConnection() {
  try {
    const connection = new Connection(environment.solana.rpcUrl);
    const testWallet = '6SdbvU6b7nMYf4sbsgghQ8sxsSS7pmqN8qUaDhi5N9RN';
    
    logger.info('Testing connection to Solana network...');
    const balance = await connection.getBalance(new PublicKey(testWallet));
    
    logger.info('Connection successful!', {
      rpcUrl: environment.solana.rpcUrl,
      balance: balance / LAMPORTS_PER_SOL
    });
  } catch (error) {
    logger.error('Connection test failed:', error);
  }
}

testConnection(); 