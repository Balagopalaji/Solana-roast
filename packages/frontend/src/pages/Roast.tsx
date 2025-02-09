import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { RoastGenerator } from '../components/roast/RoastGenerator';
import { WalletConnect } from '../components/wallet/WalletConnect';

export const Roast: React.FC = () => {
  const { connected } = useWallet();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Get Roasted</h1>
      
      {!connected ? (
        <div className="bg-win95-gray border-2 border-win95-gray-darker p-4 max-w-xl mx-auto">
          <WalletConnect message="Connect your wallet to get roasted!" />
        </div>
      ) : (
        <RoastGenerator />
      )}
    </div>
  );
}; 