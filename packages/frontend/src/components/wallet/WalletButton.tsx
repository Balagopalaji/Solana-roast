import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const WalletButton: React.FC = () => {
  const { wallet, connected } = useWallet();

  return (
    <div className="relative">
      <WalletMultiButton className={`
        px-4 py-2 
        bg-win95-gray 
        shadow-win95-out 
        hover:shadow-win95-in 
        active:shadow-win95-in
        transition-shadow
        ${connected ? 'text-green-600' : 'text-black'}
      `} />
      {wallet && (
        <div className="absolute top-full mt-2 right-0 bg-win95-gray p-2 shadow-win95-out min-w-[200px]">
          <p className="text-sm truncate">
            {connected ? 'Connected' : 'Not connected'}
          </p>
        </div>
      )}
    </div>
  );
}; 