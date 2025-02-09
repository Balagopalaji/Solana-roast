import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';

export const useWallet = () => {
  const { 
    connected,
    publicKey,
    connect,
    disconnect,
    select,
    wallet,
    wallets
  } = useSolanaWallet();

  return {
    connected,
    publicKey,
    connect,
    disconnect,
    select,
    wallet,
    wallets
  };
}; 