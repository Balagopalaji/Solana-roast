interface Environment {
  nodeEnv: string;
  solana: {
    cluster: 'devnet' | 'mainnet-beta';
    explorerUrl: string;
  };
}

export const environment: Environment = {
  nodeEnv: import.meta.env.MODE || 'development',
  solana: {
    cluster: import.meta.env.MODE === 'production' ? 'mainnet-beta' : 'devnet',
    explorerUrl: 'https://explorer.solana.com'
  }
}; 