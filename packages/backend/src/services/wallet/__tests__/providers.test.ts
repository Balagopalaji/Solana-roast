import { SolanaRPCProvider } from '../providers/solana-rpc';
import { WalletService } from '../wallet.service';

describe('Wallet Providers', () => {
  const testAddress = 'DfiQtKqNupeHDDZzWfqHjDpGfAGKNiZfVGwoBEhYAjZe';

  describe('SolanaRPCProvider', () => {
    let provider: SolanaRPCProvider;

    beforeEach(() => {
      provider = new SolanaRPCProvider();
    });

    it('should fetch wallet data', async () => {
      const data = await provider.getWalletData(testAddress);
      expect(data).toBeDefined();
      expect(data.address).toBe(testAddress);
      expect(typeof data.balance).toBe('number');
    });
  });

  describe('WalletService', () => {
    let service: WalletService;

    beforeEach(() => {
      service = new WalletService();
    });

    it('should fetch wallet data successfully', async () => {
      const data = await service.getWalletData(testAddress);
      expect(data).toBeDefined();
      expect(data.address).toBe(testAddress);
    });
  });
}); 