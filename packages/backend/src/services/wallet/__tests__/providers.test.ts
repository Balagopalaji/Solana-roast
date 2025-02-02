import { AlchemyProvider } from '../providers/alchemy';
import { SolanaRPCProvider } from '../providers/solana-rpc';
import { WalletService } from '../wallet.service';

describe('Wallet Providers', () => {
  const testAddress = 'DfiQtKqNupeHDDZzWfqHjDpGfAGKNiZfVGwoBEhYAjZe';

  describe('AlchemyProvider', () => {
    let provider: AlchemyProvider;

    beforeEach(() => {
      provider = new AlchemyProvider();
    });

    it('should fetch wallet data', async () => {
      const data = await provider.getWalletData(testAddress);
      expect(data).toBeDefined();
      expect(data.address).toBe(testAddress);
      expect(typeof data.balance).toBe('number');
    });
  });

  describe('WalletService Fallback', () => {
    let service: WalletService;

    beforeEach(() => {
      service = new WalletService();
    });

    it('should fallback to RPC provider if Alchemy fails', async () => {
      const data = await service.getWalletData(testAddress);
      expect(data).toBeDefined();
      expect(data.address).toBe(testAddress);
    });
  });
}); 