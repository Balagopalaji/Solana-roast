import { Link } from 'react-router-dom';
import { WalletButton } from './wallet/WalletButton';
import '@solana/wallet-adapter-react-ui/styles.css';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-win95-gray">
      <header className="bg-win95-blue text-white p-2">
        <nav className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">SolanaRoast.lol</Link>
          <div className="flex gap-4 items-center">
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/roast" className="hover:underline">Get Roasted</Link>
            <Link to="/clipboard-test" className="hover:underline">Clipboard Test</Link>
            <WalletButton />
          </div>
        </nav>
      </header>
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  );
}; 