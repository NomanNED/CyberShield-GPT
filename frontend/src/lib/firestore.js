/**
 * firestore.js
 * Helpers for reading and writing scan history to Firestore.
 * Only called when a user is signed in.
 */
import { db } from '../firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  deleteField,
  writeBatch,
} from 'firebase/firestore';

/**
 * Save a single scan result to the 'scans' collection.
 * @param {string} userId
 * @param {object} scanData  – { type, input, riskScore, verdict, confidence }
 */
export async function saveScan(userId, scanData) {
  try {
    await addDoc(collection(db, 'scans'), {
      userId,
      ...scanData,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Firestore] saveScan failed:', err.message);
  }
}

/**
 * Load the most recent `maxCount` scans for a user.
 * Returns an array in descending timestamp order.
 */
export async function getUserScans(userId, maxCount = 100) {
  const q = query(
    collection(db, 'scans'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxCount),
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    id:        doc.id,
    ...doc.data(),
    timestamp: doc.data().createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }));
}

/**
 * Delete all scans for a user (batch).
 */
export async function clearUserScans(userId) {
  const q    = query(collection(db, 'scans'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}
