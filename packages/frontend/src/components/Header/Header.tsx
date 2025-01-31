import React from 'react';
import { Link } from 'react-router-dom';
import { WalletButton } from '../wallet/WalletButton';

export const Header: React.FC = () => {
  return (
    <header className="bg-win95-blue text-white p-4 shadow-win95-out">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          SolanaRoast.lol
        </Link>
        <div className="flex items-center gap-4">
          <nav className="mr-4">
            <Link to="/" className="px-4 py-2 hover:bg-win95-cyan">
              Home
            </Link>
            <Link to="/roast" className="px-4 py-2 hover:bg-win95-cyan">
              Get Roasted
            </Link>
          </nav>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}; 