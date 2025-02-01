import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useRoast } from '../hooks/useRoast';
import { RoastDisplay } from '../components/roast/RoastDisplay';

export const Roast: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const { balance, loading: balanceLoading } = useWalletConnection();
  const { generateRoast, loading: roastLoading, error, roastData } = useRoast();
  const [showRoast, setShowRoast] = useState(false);

  const handleRoastClick = async () => {
    if (!publicKey) return;
    setShowRoast(true);
    await generateRoast(publicKey.toString());
  };

  const handleClose = () => {
    setShowRoast(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Get Roasted</h1>
      <div className="bg-win95-gray p-4 shadow-win95-out">
        {connected ? (
          <div>
            <p className="mb-2">✅ Wallet Connected!</p>
            <p className="text-sm mb-2">Address: {publicKey?.toBase58()}</p>
            {balanceLoading ? (
              <p>Loading balance...</p>
            ) : (
              <p className="mb-4">Balance: {balance?.toFixed(4)} SOL</p>
            )}
            <button
              onClick={handleRoastClick}
              disabled={roastLoading}
              className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in disabled:opacity-50"
            >
              {roastLoading ? 'Generating Roast...' : 'Generate Roast'}
            </button>
          </div>
        ) : (
          <p>Connect your wallet to get roasted!</p>
        )}
      </div>

      {showRoast && (
        <RoastDisplay
          roastData={roastData}
          loading={roastLoading}
          error={error}
          onClose={handleClose}
          onMinimize={handleClose}
        />
      )}
    </div>
  );
}; 