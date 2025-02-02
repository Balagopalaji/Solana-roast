import { PublicKey } from '@solana/web3.js';

export const validateWalletAddress = (address: string): { valid: boolean; error?: string } => {
  try {
    if (!address) {
      return { valid: false, error: 'Wallet address is required' };
    }
    
    // Validate Solana address format
    new PublicKey(address);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: 'Invalid Solana wallet address format'
    };
  }
}; 