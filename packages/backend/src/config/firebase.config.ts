import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';

const serviceAccountPath = path.join(__dirname, '../../../../solana-roast-firebase-adminsdk-fbsvc-500f66820e.json');
const serviceAccount = require(serviceAccountPath);

const app = initializeApp({
  credential: cert(serviceAccount)
});

export const db = getFirestore(app); 