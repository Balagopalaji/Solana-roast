export function validateFirebaseCredentials() {
  const required = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing Firebase environment variables: ${missing.join(', ')}`);
  }

  // Verify private key format
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey?.includes('BEGIN PRIVATE KEY') || !privateKey?.includes('END PRIVATE KEY')) {
    throw new Error('FIREBASE_PRIVATE_KEY is not in the correct format');
  }

  // Verify project ID format
  if (!/^[a-z0-9-]+$/.test(process.env.FIREBASE_PROJECT_ID!)) {
    throw new Error('FIREBASE_PROJECT_ID contains invalid characters');
  }

  // Verify client email format
  if (!process.env.FIREBASE_CLIENT_EMAIL?.endsWith('.iam.gserviceaccount.com')) {
    throw new Error('FIREBASE_CLIENT_EMAIL is not in the correct format');
  }
} 