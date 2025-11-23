'use client';
// İstemci tarafında güvenli başlatma için 'use client' eklendi.

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

// Uygulama başlatmayı yöneten tekil fonksiyon
function getFirebaseApp(): FirebaseApp | null {
    if (firebaseApp) {
        return firebaseApp;
    }
    
    if (getApps().length === 0) {
        // Yalnızca config geçerliyse başlat
        if (firebaseConfig.apiKey) {
            firebaseApp = initializeApp(firebaseConfig);
        } else {
            // This is a configuration issue, a warning is appropriate.
            console.warn("Firebase config is missing (e.g., NEXT_PUBLIC_FIREBASE_API_KEY). Firebase features will be disabled.");
            return null;
        }
    } else {
        firebaseApp = getApp();
    }
    
    return firebaseApp;
}


// Auth servisini yalnızca gerektiğinde başlatan fonksiyon
export function getFirebaseAuth(): Auth | null {
    const app = getFirebaseApp();
    if (!app) {
        // Yapılandırma eksikse, sahte bir Auth nesnesi gibi davranarak
        // uygulamanın çökmesini engelle ama konsola hata bas.
        console.warn("Firebase is not initialized. Auth features are unavailable.");
        // Bu, uygulamanın çökmesini önler ancak auth işlemleri başarısız olur.
        return null; 
    }
    return getAuth(app);
}

// Storage servisini yalnızca gerektiğinde başlatan fonksiyon
// Storage servisini yalnızca gerektiğinde başlatan fonksiyon
export function getFirebaseStorage(): FirebaseStorage | null {
    const app = getFirebaseApp();
    if (!app) {
        return null;
    }
    return getStorage(app);
}

// Firestore (veritabanı) için helper
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

// Google Auth provider'ını dışa aktar
export const google = new GoogleAuthProvider();
