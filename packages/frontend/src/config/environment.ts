interface Environment {
  nodeEnv: string;
  solana: {
    cluster: 'devnet' | 'mainnet-beta';
    explorerUrl: string;
  };
  features: {
    twitter: boolean;
  };
  cloudinary: {
    cloudName: string;
    uploadPreset: string;
  };
  twitter?: {
    clientId?: string;
    callbackUrl?: string;
  };
  apiUrl: string;
}

export const environment: Environment = {
  nodeEnv: import.meta.env.MODE || 'development',
  solana: {
    cluster: import.meta.env.MODE === 'production' ? 'mainnet-beta' : 'devnet',
    explorerUrl: 'https://explorer.solana.com'
  },
  features: {
    twitter: import.meta.env.VITE_ENABLE_TWITTER === 'true'
  },
  cloudinary: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''
  },
  twitter: {
    clientId: import.meta.env.VITE_TWITTER_CLIENT_ID,
    callbackUrl: import.meta.env.VITE_TWITTER_CALLBACK_URL
  },
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000'
};

export default environment; 