'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (firebaseApp) return firebaseApp;

  if (getApps().length === 0) {
    if (firebaseConfig.apiKey) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      console.warn("Firebase config is missing (e.g., NEXT_PUBLIC_FIREBASE_API_KEY). Firebase features will be disabled.");
      return null;
    }
  } else {
    firebaseApp = getApp();
  }

  return firebaseApp;
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) {
    console.warn("Firebase is not initialized. Auth features are unavailable.");
    return null;
  }
  return getAuth(app);
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const app = getFirebaseApp();
  if (!app) return null;
  return getStorage(app);
}

let firestoreDb: Firestore | null = null;

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) {
    console.warn('Firebase app yok, Firestore başlatılamıyor.');
    return null;
  }
  if (!firestoreDb) {
    firestoreDb = getFirestore(app);
  }
  return firestoreDb;
}

export const google = new GoogleAuthProvider();
