// src/lib/reports.ts
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  limit,
  writeBatch,
  Timestamp,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase'

export type ReportType =
  | 'deprem'
  | 'yangin'
  | 'sel'
  | 'trafik'
  | 'kayip'
  | 'gaz'
  | 'diger'

export type Severity = 'low' | 'medium' | 'high'

export interface ReportLocation {
  lat?: number | null
  lng?: number | null
  address?: string
}

export interface CreateReportInput {
  userId: string
  type: ReportType
  description: string
  location: ReportLocation
}

function requireDb() {
  const db = getFirebaseDb()
  if (!db) {
    throw new Error(
      'NO_DB: Firestore başlatılamadı (Firebase config eksik olabilir).'
    )
  }
  return db
}

/**
 * Anti-spam:
 * Aynı kullanıcı, aynı türde ihbarı 2 dakika içinde tekrar yollamaya çalışırsa
 * hata fırlatıyoruz.
 */
async function assertNotSpam(input: CreateReportInput) {
  const db = requireDb()
  const since = Timestamp.fromDate(
    new Date(Date.now() - 2 * 60 * 1000) // 2 dakika
  )

  const qSpam = query(
    collection(db, 'reports'),
    where('userId', '==', input.userId),
    where('type', '==', input.type),
    where('createdAt', '>=', since)
  )

  const snap = await getDocs(qSpam)
  if (!snap.empty) {
    throw new Error(
      'SPAM_LIMIT: Aynı tür ihbarı çok sık gönderiyorsun. Birkaç dakika bekle ve tekrar dene.'
    )
  }
}

export async function createReport(input: CreateReportInput) {
  const db = requireDb()

  await assertNotSpam(input)

  await addDoc(collection(db, 'reports'), {
    userId: input.userId,
    type: input.type,
    description: input.description,
    location: {
      lat: input.location.lat ?? null,
      lng: input.location.lng ?? null,
      address: input.location.address ?? '',
    },
    images: [],
    createdAt: serverTimestamp(),
    status: 'pending',
    adminId: null,
    reviewedAt: null,
    title: null,
    severity: null,
  })
}

export interface ApproveRejectInput {
  reportId: string
  adminId: string
}

export interface ApproveExtras {
  type: ReportType
  description: string
  location: ReportLocation
  title: string
  displayLocation: string
  severity: Severity
}

function mapReportTypeToCategory(
  t: ReportType
):
  | 'earthquake'
  | 'fire'
  | 'flood'
  | 'landslide'
  | 'storm'
  | 'assault'
  | 'robbery'
  | 'abduction'
  | 'other' {
  switch (t) {
    case 'deprem':
      return 'earthquake'
    case 'yangin':
      return 'fire'
    case 'sel':
      return 'flood'
    case 'kayip':
      return 'abduction'
    case 'trafik':
      return 'assault'
    case 'gaz':
      return 'other'
    case 'diger':
      return 'other'
    default:
      return 'other'
  }
}

/** pending ihbarı onaylar + nearbyEvents + auditLogs */
export async function approveReport(
  params: ApproveRejectInput & ApproveExtras
) {
  const db = requireDb()
  const ref = doc(db, 'reports', params.reportId)
  const category = mapReportTypeToCategory(params.type)

  await updateDoc(ref, {
    status: 'approved',
    adminId: params.adminId,
    reviewedAt: serverTimestamp(),
    description: params.description,
    location: {
      lat: params.location.lat ?? null,
      lng: params.location.lng ?? null,
      address: params.location.address ?? '',
    },
    title: params.title,
    severity: params.severity,
  })

  await addDoc(collection(db, 'nearbyEvents'), {
    reportId: params.reportId,
    type: category,
    title: params.title,
    description: params.description,
    location: {
      lat: params.location.lat ?? null,
      lng: params.location.lng ?? null,
      address: params.location.address ?? '',
      label: params.displayLocation,
    },
    severity: params.severity,
    createdAt: serverTimestamp(),
    source: 'report',
  })

  await addDoc(collection(db, 'auditLogs'), {
    adminId: params.adminId,
    reportId: params.reportId,
    action: 'approve',
    timestamp: serverTimestamp(),
    title: params.title,
    severity: params.severity,
  })
}

/** onaylanmış / reddedilmiş ihbarı düzeltir + nearbyEvents’e yansıtır */
export async function updateApprovedReportDetails(params: {
  reportId: string
  adminId: string
  title: string
  description: string
  location: ReportLocation
  displayLocation: string
  severity: Severity
}) {
  const db = requireDb()

  const reportRef = doc(db, 'reports', params.reportId)
  await updateDoc(reportRef, {
    description: params.description,
    location: {
      lat: params.location.lat ?? null,
      lng: params.location.lng ?? null,
      address: params.location.address ?? '',
    },
    title: params.title,
    severity: params.severity,
    reviewedAt: serverTimestamp(),
  })

  const qNearby = query(
    collection(db, 'nearbyEvents'),
    where('reportId', '==', params.reportId),
    limit(1)
  )
  const snap = await getDocs(qNearby)
  if (!snap.empty) {
    const evDoc = snap.docs[0]
    await updateDoc(evDoc.ref, {
      title: params.title,
      description: params.description,
      location: {
        lat: params.location.lat ?? null,
        lng: params.location.lng ?? null,
        address: params.location.address ?? '',
        label: params.displayLocation,
      },
      severity: params.severity,
      updatedAt: serverTimestamp(),
    })
  }

  await addDoc(collection(db, 'auditLogs'), {
    adminId: params.adminId,
    reportId: params.reportId,
    action: 'edit',
    timestamp: serverTimestamp(),
    title: params.title,
    severity: params.severity,
  })
}

export async function rejectReport(params: ApproveRejectInput) {
  const db = requireDb()
  const ref = doc(db, 'reports', params.reportId)

  await updateDoc(ref, {
    status: 'rejected',
    adminId: params.adminId,
    reviewedAt: serverTimestamp(),
  })

  await addDoc(collection(db, 'auditLogs'), {
    adminId: params.adminId,
    reportId: params.reportId,
    action: 'reject',
    timestamp: serverTimestamp(),
  })
}

/** Sadece bu ihbara bağlı yakın olayları (nearbyEvents) siler */
export async function clearNearbyEventsForReport(reportId: string) {
  const db = requireDb()

  const qNearby = query(
    collection(db, 'nearbyEvents'),
    where('reportId', '==', reportId)
  )
  const snap = await getDocs(qNearby)

  if (snap.empty) return

  const batch = writeBatch(db)
  snap.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

/** İhbarı tamamen siler + ona bağlı nearByEvents’i temizler + auditLog’a delete yazar */
export async function deleteReportCompletely(params: {
  reportId: string
  adminId: string
}) {
  const db = requireDb()

  const batch = writeBatch(db)

  const reportRef = doc(db, 'reports', params.reportId)
  batch.delete(reportRef)

  const qNearby = query(
    collection(db, 'nearbyEvents'),
    where('reportId', '==', params.reportId)
  )
  const nearbySnap = await getDocs(qNearby)
  nearbySnap.forEach((d) => batch.delete(d.ref))

  await batch.commit()

  await addDoc(collection(db, 'auditLogs'), {
    adminId: params.adminId,
    reportId: params.reportId,
    action: 'delete',
    timestamp: serverTimestamp(),
  })
}
