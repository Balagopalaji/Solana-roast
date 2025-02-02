import logger from '../utils/logger';
import { WalletService } from '../services/wallet/wallet.service';

async function verifyProviders() {
  const testAddresses = [
    'DfiQtKqNupeHDDZzWfqHjDpGfAGKNiZfVGwoBEhYAjZe',  // Known address with NFTs
    '6SdbvU6b7nMYf4sbsgghQ8sxsSS7pmqN8qUaDhi5N9RN'   // Test address
  ];

  const service = new WalletService();

  for (const address of testAddresses) {
    try {
      logger.info(`Testing wallet data fetch for ${address}...`);
      const data = await service.getWalletData(address);
      logger.info('✅ Success:', data);
    } catch (error) {
      logger.error(`❌ Failed for ${address}:`, error);
      return false;
    }
  }

  return true;
}

// Run if called directly
if (require.main === module) {
  verifyProviders()
    .then(success => {
      if (success) {
        logger.info('✅ All provider tests passed');
        process.exit(0);
      } else {
        logger.error('❌ Provider tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('❌ Verification failed with error:', error);
      process.exit(1);
    });
}

export { verifyProviders }; 