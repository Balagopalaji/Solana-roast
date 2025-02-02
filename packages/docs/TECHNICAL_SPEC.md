# SolanaRoast Technical Specification

## Current State (2024-02-01)
- Backend: Stable, with OpenAI and basic Solana RPC integration
- Frontend: Experiencing Web3.js integration issues
- Solscan API: Unreliable, marked as non-critical

## Architecture Evolution

### Phase 1: Provider Abstraction (Current)
```typescript
interface WalletProvider {
  getWalletData(address: string): Promise<WalletData>;
  getTokens(address: string): Promise<TokenData[]>;
  getNFTs(address: string): Promise<NFTData[]>;
}

interface WalletData {
  address: string;
  balance: number;
  transactionCount: number;
  nftCount: number;
}
```

### Implementation Priority
1. Alchemy Integration (Primary)
2. Solana RPC (Fallback)
3. Solscan (Optional Enhancement)

### Migration Strategy
1. Create abstraction layer
2. Implement Alchemy provider
3. Migrate existing RPC logic
4. Add fallback mechanism

## Technical Debt
- Web3.js dependency issues
- Solscan API reliability
- Frontend build configuration

## Success Metrics
- Successful wallet connections
- API response times
- Error rates 