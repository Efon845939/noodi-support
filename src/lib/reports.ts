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

export async function createReport(input: CreateReportInput) {
  const db = requireDb()

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

function mapReportTypeToCategory(t: ReportType):
  'earthquake' | 'fire' | 'flood' | 'landslide' | 'storm' | 'assault' | 'robbery' | 'abduction' | 'other' {
  switch (t) {
    case 'deprem': return 'earthquake'
    case 'yangin': return 'fire'
    case 'sel': return 'flood'
    case 'kayip': return 'abduction'
    case 'trafik': return 'assault'
    case 'gaz': return 'other'
    case 'diger': return 'other'
    default: return 'other'
  }
}

/** pending ihbarı onaylar + nearByEvents + auditLogs */
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

  const q = query(
    collection(db, 'nearbyEvents'),
    where('reportId', '==', params.reportId),
    limit(1),
  )
  const snap = await getDocs(q)
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
