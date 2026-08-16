/**
 * Firebase Client SDK Initialization & Safe Configuration
 *
 * This module safely initializes Firebase Auth, Firestore, and Storage
 * when environment variables are supplied.
 * If credentials are missing, it provides null handles and marks `isFirebaseActive = false`
 * without throwing errors, allowing the app to smoothly operate in High-Fidelity Local Simulation Mode.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const getEnv = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env;
  }
  return {};
};

const env = getEnv();

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigValid = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.trim() !== '' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId.trim() !== ''
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigValid) {
  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.info('[CivicConnect] Connected to Live Firebase Project:', firebaseConfig.projectId);
  } catch (error) {
    console.warn('[CivicConnect] Firebase initialization failed, falling back to Local Simulation Mode:', error);
    app = null;
    auth = null;
    db = null;
    storage = null;
  }
} else {
  console.info('[CivicConnect] Running in Local Simulation Mode (No Firebase keys detected)');
}

export { app, auth, db, storage };
