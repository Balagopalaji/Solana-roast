import React from 'react';
import { useWallet } from '../../hooks/useWallet';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface WalletConnectProps {
  message?: string;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ 
  message = "Connect Wallet"
}) => {
  return (
    <div className="text-center">
      <p className="mb-4">{message}</p>
      <WalletMultiButton className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in" />
    </div>
  );
}; 