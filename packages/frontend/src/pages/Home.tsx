import React from 'react';

export const Home: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to SolanaRoast.lol</h1>
      <p className="text-lg mb-8">Get your Solana wallet roasted in style!</p>
      <div className="bg-win95-gray p-4 shadow-win95-out max-w-md mx-auto">
        <p className="mb-4">Click "Get Roasted" to start!</p>
      </div>
    </div>
  );
}; 