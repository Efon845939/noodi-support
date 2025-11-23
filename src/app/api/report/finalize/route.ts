import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { initializeApp, getApps, getApp } from 'firebase/app'

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
  try {
    if (!db) {
        throw new Error("Firestore is not initialized. Check server-side Firebase configuration.");
    }
    const { reportId, decision } = await req.json();

    if (!reportId || !decision) {
        return new NextResponse("Missing reportId or decision", { status: 400 });
    }

    const { entities = {}, risk, confidence, nextSteps } = decision || {};
    
    await updateDoc(doc(db, 'reports', reportId), {
      phase: 'classified',
      category: entities.category || null,
      subtype: entities.subtype || null,
      aiSummary: JSON.stringify(decision),
      aiConfidence: confidence ?? null,
      risk: risk ?? 'medium',
      nextSteps: nextSteps || [],
      updatedAt: serverTimestamp()
    });
    
    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error("Error finalizing report:", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
