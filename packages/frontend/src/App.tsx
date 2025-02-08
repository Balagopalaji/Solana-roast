import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './components/wallet/WalletProvider';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Roast } from './pages/Roast';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/roast" element={<Roast />} />
            </Routes>
          </Layout>
        </Router>
      </WalletProvider>
    </ErrorBoundary>
  );
}

export default App;
