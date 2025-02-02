import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

export const cleanupExpiredRoasts = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const db = getFirestore();
    const now = new Date();
    
    const snapshot = await db
      .collection('roasts')
      .where('expiresAt', '<', now)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }); 