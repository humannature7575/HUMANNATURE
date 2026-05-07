import "server-only";
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Hardened Singleton for Firebase Admin App.
 * Ensures initializeApp is only called once and returns the default app.
 */
function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  try {
    if (clientEmail && privateKey) {
      console.log('[Admin] Initializing Firebase Admin with Service Account credentials.');
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        projectId,
      });
    } else {
      console.log('[Admin] Initializing Firebase Admin with Application Default Credentials.');
      return admin.initializeApp({ projectId });
    }
  } catch (error: any) {
    // Handle potential race conditions where another thread/module initialized it simultaneously
    if (error.code === 'app/duplicate-app' || admin.apps.length > 0) {
      console.log('[Admin] Reusing existing Firebase Admin app.');
      return admin.apps[0]!;
    }
    console.error('[Admin] Firebase Admin initialization error:', error);
    throw error;
  }
}

// Initialize once at module load
const app = getAdminApp();

// Ensure we target the correct database instance
const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || '(default)';
console.log(`[Admin] Initialized Firestore for database: "${databaseId}"`);

export const adminDb = getFirestore(app, databaseId);
export const adminAuth = app.auth();

