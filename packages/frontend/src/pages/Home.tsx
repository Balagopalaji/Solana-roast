import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">SolanaRoast.lol</h1>
      <button
        onClick={() => navigate('/roast')}
        className="px-4 py-2 bg-win95-gray shadow-win95-out hover:shadow-win95-in active:shadow-win95-in"
      >
        Get Roasted
      </button>
    </div>
  );
}; 