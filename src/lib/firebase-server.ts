// src/lib/firebase-server.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

// Bu config'i firebase.ts'deki ile aynı yap.
// ENV'den okuyorsan oradaki değişken adlarını kullan.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

let app: FirebaseApp | null = null
let db: Firestore | null = null

function getServerApp(): FirebaseApp {
  if (app) return app
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApp()
  }
  return app!
}

export function getServerDb(): Firestore {
  if (db) return db!
  const app = getServerApp()
  db = getFirestore(app)
  return db!
}
