import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/firebase-server";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export const runtime = "nodejs";

/**
 * Yeni ihbar kaydedildikten sonra çağrılır.
 * Aynı tür + aynı location.label için kaç ihbar var → hesaplar.
 * 10+ ise: nearbyEvents içinde tek bir event oluşturur/günceller.
 */
export async function POST(req: NextRequest) {
  try {
    const { type, locationLabel } = await req.json();

    const db = getServerDb();

    const q = query(
      collection(db, "reports"),
      where("type", "==", type),
      where("location.address", "==", locationLabel)
    );

    const snap = await getDocs(q);
    const count = snap.size;

    // 10’dan azsa event oluşturma
    if (count < 10) {
      return NextResponse.json({ clustered: false, count });
    }

    // cluster key
    const key = `${type}__${locationLabel.replace(/\s+/g, "_").toLowerCase()}`;

    const eventRef = doc(db, "nearbyEvents", key);

    await setDoc(eventRef, {
      type,
      title: `${type.toUpperCase()} - ${locationLabel}`,
      count,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      severity: "medium",
      location: {
        label: locationLabel,
      },
    });

    return NextResponse.json({ clustered: true, count });
  } catch (err: any) {
    console.error("CLUSTER ERROR:", err);
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
