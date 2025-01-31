import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletConnection } from '../hooks/useWalletConnection';

export const Roast: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const { balance, loading, error } = useWalletConnection();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Get Roasted</h1>
      <div className="bg-win95-gray p-4 shadow-win95-out">
        {connected ? (
          <div>
            <p className="mb-2">✅ Wallet Connected!</p>
            <p className="text-sm mb-2">Address: {publicKey?.toBase58()}</p>
            {loading ? (
              <p>Loading balance...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <p>Balance: {balance?.toFixed(4)} SOL</p>
            )}
          </div>
        ) : (
          <p>Connect your wallet to get roasted!</p>
        )}
      </div>
    </div>
  );
}; 