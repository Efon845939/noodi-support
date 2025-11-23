import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, doc, setDoc, serverTimestamp, collection } from 'firebase/firestore'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let db: any;

if (firebaseConfig.apiKey) {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
} else {
    console.warn("Firebase config is missing for server-side operations. API routes requiring Firebase will fail.");
}


export async function POST(req: NextRequest) {
  if (!db) {
    return new NextResponse("Firestore is not initialized on the server. Check Firebase configuration.", { status: 500 });
  }
    
  const { geo } = await req.json()
  const uid = 'CURRENT_UID'; 
  
  const reportRef = doc(collection(db, 'reports'));
  const rid = reportRef.id;

  try {
    await setDoc(reportRef, {
      uid: uid,
      phase: 'panic',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(geo ? { geo } : {})
    })
    return NextResponse.json({ reportId: rid })
  } catch (error) {
    console.error("Error creating panic report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
