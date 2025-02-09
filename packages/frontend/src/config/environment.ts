interface Environment {
  nodeEnv: string;
  solanaNetwork: 'devnet' | 'mainnet-beta';
  solana: {
    cluster: 'devnet' | 'mainnet-beta';
    explorerUrl: string;
  };
}

export const environment = {
  nodeEnv: import.meta.env.MODE || 'development',
  solanaNetwork: import.meta.env.VITE_SOLANA_NETWORK || 'devnet',
  solana: {
    cluster: import.meta.env.MODE === 'production' ? 'mainnet-beta' : 'devnet',
    explorerUrl: 'https://explorer.solana.com'
  }
} as const; 