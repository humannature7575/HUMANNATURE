import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Hardened Client-side Firebase Initialization.
 * Safe for SSR and build-time execution in Next.js.
 */
function getClientApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const isServer = typeof window === 'undefined';
  console.log(`[Firebase Client] Initializing App (Context: ${isServer ? 'Server' : 'Client'})`);

  return initializeApp(firebaseConfig);
}

const app = getClientApp();
const auth = getAuth(app);

const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID && process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID.trim() !== "" 
  ? process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID 
  : '(default)';

const db = getFirestore(app, databaseId);

export { app, auth, db };

