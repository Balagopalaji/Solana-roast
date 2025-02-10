import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './components/wallet/WalletProvider';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Roast } from './pages/Roast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ClipboardTest } from './pages/ClipboardTest';
import { environment } from './config/environment';

// Add future flags configuration
const routerConfig = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

// Test Cloudinary configuration
console.log('Environment check:', {
  cloudinary: {
    cloudName: environment.cloudinary.cloudName,
    uploadPreset: environment.cloudinary.uploadPreset
  },
  features: {
    twitter: environment.features.twitter
  }
});

const App = () => {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <Router {...routerConfig}>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/roast" element={<Roast />} />
              <Route path="/clipboard-test" element={<ClipboardTest />} />
            </Routes>
          </Layout>
        </Router>
      </WalletProvider>
    </ErrorBoundary>
  );
};

export default App;
