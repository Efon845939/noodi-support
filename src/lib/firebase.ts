'use client'

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
} as const

let firebaseApp: FirebaseApp | null = null
let firestoreDb: Firestore | null = null

function ensureConfig() {
  if (!firebaseConfig.apiKey) {
    console.error('🔥 Firebase config eksik. .env değerlerini kontrol et.')
    throw new Error('Firebase env config missing')
  }
}

function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp

  ensureConfig()

  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig)
  } else {
    firebaseApp = getApp()
  }

  return firebaseApp!
}

export function getFirebaseAuth(): Auth | null {
  try {
    const app = getFirebaseApp()
    return getAuth(app)
  } catch (e) {
    console.warn('Firebase Auth başlatılamadı.', e)
    return null
  }
}

export function getFirebaseStorage(): FirebaseStorage | null {
  try {
    const app = getFirebaseApp()
    return getStorage(app)
  } catch {
    return null
  }
}

export function getFirebaseDb(): Firestore | null {
  try {
    if (firestoreDb) return firestoreDb
    const app = getFirebaseApp()
    firestoreDb = getFirestore(app)
    return firestoreDb
  } catch (e) {
    console.warn('Firebase Firestore başlatılamadı.', e)
    return null
  }
}

// Google provider
export const google = new GoogleAuthProvider()
google.setCustomParameters({
  prompt: 'select_account',
})
