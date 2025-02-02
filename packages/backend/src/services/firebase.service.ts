import { getFirestore, Timestamp, Firestore } from 'firebase-admin/firestore';
import type { RoastShare, StorageMetrics } from '../types/roast';
import logger from '../utils/logger';
import { initializeFirebase } from '../config/firebase.init';

const MAX_AGE_DAYS = 7;
const STORAGE_LIMIT_MB = 500;
const MIN_SHARES_TO_KEEP = 5;

class FirebaseService {
  private db: Firestore | null = null;
  private initialized = false;

  constructor() {
    this.initializeDb();
  }

  private async initializeDb() {
    try {
      this.db = initializeFirebase();
      if (this.db) {
        this.initialized = true;
        logger.info('Firebase service initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize Firebase service:', error);
      this.initialized = false;
    }
  }

  private ensureInitialized() {
    if (!this.initialized || !this.db) {
      throw new Error('Firebase service not initialized');
    }
  }

  async storeRoast(roastData: Omit<RoastShare, 'createdAt' | 'expiresAt' | 'shareCount'>): Promise<string> {
    this.ensureInitialized();
    
    try {
      // Check storage limits before storing
      const metrics = await this.getStorageMetrics();
      if (metrics.totalStorage > STORAGE_LIMIT_MB) {
        await this.cleanupOldRoasts();
      }

      const docRef = await this.db!.collection('roasts').add({
        ...roastData,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + (MAX_AGE_DAYS * 24 * 60 * 60 * 1000))),
        shareCount: 0
      });
      
      logger.info('Roast stored successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      logger.error('Failed to store roast:', error);
      throw error;
    }
  }

  async getRoast(shareId: string): Promise<RoastShare | null> {
    this.ensureInitialized();
    
    try {
      const docRef = this.db!.collection('roasts').doc(shareId);
      const doc = await docRef.get();
      
      if (!doc.exists) return null;
      
      const data = doc.data() as FirebaseRoastData;
      
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        expiresAt: data.expiresAt.toDate(),
        lastAccessed: data.lastAccessed?.toDate()
      };
    } catch (error) {
      logger.error('Failed to get roast:', error);
      throw error;
    }
  }

  private async cleanupOldRoasts(): Promise<void> {
    const batch = this.db!.batch();
    const now = Timestamp.now();

    // Delete expired roasts
    const expiredSnapshot = await this.db!.collection('roasts')
      .where('expiresAt', '<', now)
      .get();

    // Delete unshared roasts (older than 24h with no shares)
    const unsharedSnapshot = await this.db!.collection('roasts')
      .where('shareCount', '<', MIN_SHARES_TO_KEEP)
      .where('createdAt', '<', Timestamp.fromDate(new Date(Date.now() - (24 * 60 * 60 * 1000))))
      .get();

    [...expiredSnapshot.docs, ...unsharedSnapshot.docs].forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  async getStorageMetrics(): Promise<StorageMetrics> {
    this.ensureInitialized();
    
    try {
      const snapshot = await this.db!.collection('roasts').get();
      return snapshot.docs.reduce((acc: StorageMetrics, doc) => {
        const data = doc.data();
        return {
          totalRoasts: acc.totalRoasts + 1,
          totalStorage: acc.totalStorage + JSON.stringify(data).length / 1024 / 1024 // Convert to MB
        };
      }, { totalRoasts: 0, totalStorage: 0 });
    } catch (error) {
      logger.error('Failed to get storage metrics:', error);
      throw error;
    }
  }
}

// Add this interface to handle Firestore Timestamp types
interface FirebaseRoastData extends Omit<RoastShare, 'createdAt' | 'expiresAt' | 'lastAccessed'> {
  createdAt: Timestamp;
  expiresAt: Timestamp;
  lastAccessed?: Timestamp;
}

export const firebaseService = new FirebaseService(); 