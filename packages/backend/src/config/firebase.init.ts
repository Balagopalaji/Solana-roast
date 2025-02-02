import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import logger from '../utils/logger';
import { validateFirebaseCredentials } from '../utils/firebase-validator';

export function initializeFirebase() {
  try {
    // Check if already initialized
    if (getApps().length > 0) {
      logger.info('Firebase already initialized, reusing existing instance');
      return getFirestore();
    }

    validateFirebaseCredentials();
    
    let credentials;

    try {
      const serviceAccountPath = path.join(__dirname, '../../../../solana-roast-firebase-adminsdk-fbsvc-500f66820e.json');
      credentials = require(serviceAccountPath);
      logger.info('Using Firebase credentials from service account file');
    } catch (error) {
      logger.info('Using environment variables for Firebase credentials');
      
      credentials = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      };
    }

    const app = initializeApp({
      credential: cert(credentials as any)
    });

    const db = getFirestore(app);
    logger.info('Firebase initialized successfully');
    return db;
  } catch (error) {
    logger.error('Firebase initialization failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Don't throw error during development to prevent nodemon crashes
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Continuing despite Firebase error in development mode');
      return null;
    }
    
    throw error;
  }
} 