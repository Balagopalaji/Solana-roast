import React, { useMemo } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { environment } from '../../config/environment';

export const WalletButton: React.FC = () => {
  const { wallet, connected, publicKey } = useWallet();

  const explorerUrl = useMemo(() => {
    if (!publicKey) return '#';
    return `https://explorer.solana.com/address/${publicKey.toString()}${
      environment.nodeEnv === 'development' ? '?cluster=devnet' : ''
    }`;
  }, [publicKey]);

  const renderExplorerLink = connected && publicKey && explorerUrl !== '#';

  return (
    <div className="relative">
      <WalletMultiButton className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in" />
      {renderExplorerLink && (
        <div className="absolute top-full right-0 mt-2 bg-white p-2 rounded shadow">
          <div className="text-sm">
            {wallet?.adapter?.name}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-500 hover:text-blue-700"
            >
              <svg
                className="inline-block"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}; 