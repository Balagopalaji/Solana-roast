import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Roast } from './pages/Roast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ClipboardTest } from './pages/ClipboardTest';

const App = () => {
  const wallets = [new PhantomWalletAdapter()];

  return (
    <ErrorBoundary>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/roast" element={<Roast />} />
                <Route path="/clipboard-test" element={<ClipboardTest />} />
              </Routes>
            </Layout>
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ErrorBoundary>
  );
};

export default App;
