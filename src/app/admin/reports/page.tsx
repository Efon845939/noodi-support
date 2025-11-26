'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  doc,
  getDoc,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import {
  getFirebaseAuth,
  getFirebaseDb,
} from '@/lib/firebase'
import {
  approveReport,
  rejectReport,
  updateApprovedReportDetails,
  deleteReportCompletely,
  ReportType,
  ReportLocation,
  Severity,
} from '@/lib/reports'
import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'

const LOCATION_TEMPLATES = [
  'İlçe merkezi',
  'Zeytinburnu ormanlık alanı',
  'Ana cadde üzerinde',
  'Sanayi bölgesi',
  'Sahil şeridi',
]

type ReportItem = {
  id: string
  userId: string
  type: ReportType
  description: string
  location: ReportLocation
  createdAt?: any
  status: 'pending' | 'approved' | 'rejected'
  title?: string | null
  severity?: Severity | null
}

type EditMode = 'approve' | 'edit'

type Cluster = {
  key: string
  type: ReportType
  label: string
  reports: ReportItem[]
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  const [editingReport, setEditingReport] = useState<ReportItem | null>(null)
  const [editMode, setEditMode] = useState<EditMode>('approve')
  const [editTitle, setEditTitle] = useState('')
  const [editDisplayLocation, setEditDisplayLocation] = useState('')
  const [editSeverity, setEditSeverity] = useState<Severity>('medium')
  const [editDescription, setEditDescription] = useState('')

  const [openClusterKey, setOpenClusterKey] = useState<string | null>(null)

  const auth = getFirebaseAuth()
  const db = getFirebaseDb()
  const router = useRouter()

  // Admin mi?
  useEffect(() => {
    if (!auth || !db) {
      setIsAdmin(false)
      return
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false)
        return
      }

      try {
        const ref = doc(db, 'roles_admin', user.uid)
        const snap = await getDoc(ref)
        setIsAdmin(snap.exists())
      } catch (e) {
        console.error(e)
        setIsAdmin(false)
      }
    })

    return () => unsub()
  }, [auth, db])

  // Admin değilse 5 saniye sonra ana sayfaya at
  useEffect(() => {
    if (isAdmin === false) {
      const t = setTimeout(() => {
        router.replace('/')
      }, 5000)
      return () => clearTimeout(t)
    }
  }, [isAdmin, router])

  // Tüm ihbarları dinle
  useEffect(() => {
    if (!db) return

    const q = query(collection(db, 'reports'))

    const unsub = onSnapshot(q, (snap) => {
      const items: ReportItem[] = []
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any
        items.push({
          id: docSnap.id,
          userId: data.userId,
          type: data.type,
          description: data.description,
          location: data.location ?? {},
          createdAt: data.createdAt,
          status: (data.status as any) || 'pending',
          title: data.title ?? null,
          severity: (data.severity as Severity | null) ?? null,
        })
      })
      items.sort((a, b) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0
        const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0
        return tb - ta
      })
      setReports(items)
    })

    return () => unsub()
  }, [db])

  const pendingReports = reports.filter((r) => r.status === 'pending')
  const approvedReports = reports.filter((r) => r.status === 'approved')
  const rejectedReports = reports.filter((r) => r.status === 'rejected')

  // tür + konum bazlı cluster
  const clusters = useMemo<Cluster[]>(() => {
    const map = new Map<string, Cluster>()
    for (const r of reports) {
      const label = r.location?.address || 'Konum belirtilmemiş'
      const key = `${r.type}__${label}`

      const existing = map.get(key)
      if (existing) {
        existing.reports.push(r)
      } else {
        map.set(key, {
          key,
          type: r.type,
          label,
          reports: [r],
        })
      }
    }

    const arr = Array.from(map.values())
    // büyükten küçüğe
    arr.sort((a, b) => b.reports.length - a.reports.length)
    return arr
  }, [reports])

  function guessTitleFromReport(r: ReportItem) {
    const base = r.type.toUpperCase()
    if (!r.description) return base
    return `${base} - ${r.description.slice(0, 40)}`
  }

  function openEdit(report: ReportItem, mode: EditMode) {
    setEditMode(mode)
    setEditingReport(report)
    setEditTitle(report.title || guessTitleFromReport(report))
    setEditDisplayLocation(report.location?.address || '')
    setEditSeverity(report.severity || 'medium')
    setEditDescription(report.description || '')
  }

  function closeEdit() {
    setEditingReport(null)
  }

  async function handleSave() {
    if (!editingReport) return
    if (!auth?.currentUser) {
      alert('Admin olarak giriş yapman gerekiyor.')
      return
    }

    if (!editTitle.trim()) {
      alert('Başlık boş olamaz.')
      return
    }
    if (!editDisplayLocation.trim()) {
      alert('Gösterilecek konum boş olamaz.')
      return
    }
    if (!editDescription.trim()) {
      alert('Açıklama boş olamaz.')
      return
    }

    try {
      setIsProcessing(true)

      if (editMode === 'approve' && editingReport.status === 'pending') {
        await approveReport({
          reportId: editingReport.id,
          adminId: auth.currentUser.uid,
          type: editingReport.type,
          description: editDescription.trim(),
          location: editingReport.location,
          title: editTitle.trim(),
          displayLocation: editDisplayLocation.trim(),
          severity: editSeverity,
        })
      } else {
        await updateApprovedReportDetails({
          reportId: editingReport.id,
          adminId: auth.currentUser.uid,
          title: editTitle.trim(),
          description: editDescription.trim(),
          location: editingReport.location,
          displayLocation: editDisplayLocation.trim(),
          severity: editSeverity,
        })
      }
    } catch (e) {
      console.error(e)
      alert('Değişiklik uygulanırken hata oluştu.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleReject(report: ReportItem) {
    if (!auth?.currentUser) {
      alert('Admin olarak giriş yapman gerekiyor.')
      return
    }

    try {
      setIsProcessing(true)
      await rejectReport({
        reportId: report.id,
        adminId: auth.currentUser.uid,
      })
      closeEdit()
    } catch (e) {
      console.error(e)
      alert('İhbar reddedilirken hata oluştu.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleDelete(report: ReportItem) {
    if (!auth?.currentUser) {
      alert('Admin olarak giriş yapman gerekiyor.')
      return
    }

    const ok = confirm(
      `Bu ihbarı ve ona bağlı yakın olay kayıtlarını silmek istediğine emin misin?\n\nID: ${report.id}`
    )
    if (!ok) return

    try {
      setIsProcessing(true)
      await deleteReportCompletely({
        reportId: report.id,
        adminId: auth.currentUser.uid,
      })
      if (editingReport?.id === report.id) {
        closeEdit()
      }
    } catch (e) {
      console.error(e)
      alert('İhbar silinirken hata oluştu.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!auth || !db) {
    return (
      <div className="min-h-[100svh] bg-white px-4 py-6">
        <h1 className="text-2xl font-bold text-[#0B3B7A] mb-2">
          İhbarlar
        </h1>
        <p className="text-sm text-gray-600">
          Firebase yapılandırması eksik. Ortam değişkenlerini kontrol et.
        </p>
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-[100svh] bg-white px-4 py-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-[#0B3B7A] mb-2">
          İhbarlar
        </h1>
        <p className="text-sm text-gray-600 mb-2">
          Bu sayfaya sadece admin kullanıcılar erişebilir.
        </p>
        <p className="text-xs text-gray-500">
          5 saniye içinde ana sayfaya yönlendirileceksin…
        </p>
      </div>
    )
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-[100svh] bg-white px-4 py-6">
        <h1 className="text-2xl font-bold text-[#0B3B7A] mb-2">
          İhbarlar
        </h1>
        <p className="text-sm text-gray-600">Admin bilgisi yükleniyor...</p>
      </div>
    )
  }

  const Section = ({
    title,
    items,
    allowApprove,
    allowEdit,
  }: {
    title: string
    items: ReportItem[]
    allowApprove: boolean
    allowEdit: boolean
  }) => (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Kayıt yok.</p>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div
              key={r.id}
              className="border rounded-xl p-3 bg-white space-y-2 text-sm"
            >
              <div className="flex justify-between text-xs text-gray-500">
                <span>Kullanıcı: {r.userId}</span>
                <span>
                  {r.createdAt?.toDate
                    ? r.createdAt.toDate().toLocaleString()
                    : ''}
                </span>
              </div>
              <div className="font-semibold">
                Tür: {r.type.toUpperCase()}{' '}
                {r.status === 'approved' && '✅'}
                {r.status === 'rejected' && '❌'}
              </div>
              {r.title && (
                <div className="text-sm text-[#102A43] font-semibold">
                  Başlık: {r.title}
                </div>
              )}
              <div>{r.description}</div>
              {r.location?.address && (
                <div className="text-xs text-gray-600">
                  Konum: {r.location.address}
                </div>
              )}
              {r.severity && (
                <div className="text-xs text-gray-600">
                  Şiddet: {r.severity.toUpperCase()}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {allowApprove && r.status === 'pending' && (
                  <button
                    onClick={() => openEdit(r, 'approve')}
                    disabled={isProcessing}
                    className="px-3 py-1 text-xs rounded-md bg-[#0B3B7A] text-white disabled:opacity-60"
                    type="button"
                  >
                    Onayla / Düzenle
                  </button>
                )}
                {allowEdit && r.status !== 'pending' && (
                  <button
                    onClick={() => openEdit(r, 'edit')}
                    disabled={isProcessing}
                    className="px-3 py-1 text-xs rounded-md bg-blue-100 text-[#0B3B7A] border border-[#0B3B7A]/40"
                    type="button"
                  >
                    Düzenle
                  </button>
                )}
                {r.status === 'pending' && (
                  <button
                    onClick={() => handleReject(r)}
                    disabled={isProcessing}
                    className="px-3 py-1 text-xs rounded-md bg-gray-200 text-gray-800 disabled:opacity-60"
                    type="button"
                  >
                    {isProcessing ? 'İşleniyor...' : 'Reddet'}
                  </button>
                )}
                {/* HER İHBAR İÇİN SİL BUTONU */}
                <button
                  onClick={() => handleDelete(r)}
                  disabled={isProcessing}
                  className="px-3 py-1 text-xs rounded-md bg-red-100 text-red-700 border border-red-300 disabled:opacity-60"
                  type="button"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )

  return (
    <div className="min-h-[100svh] bg-white pb-[68px] flex flex-col">
      <HeaderBar title="İhbarlar" />

      <div className="px-4 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-[#0B3B7A]"
        >
          ← Geri dön
        </button>
      </div>

      <main className="flex-1 px-4 py-4 max-w-3xl mx-auto w-full space-y-6">
        <Section
          title="Bekleyen İhbarlar"
          items={pendingReports}
          allowApprove={true}
          allowEdit={false}
        />
        <Section
          title="Onaylanmış İhbarlar"
          items={approvedReports}
          allowApprove={false}
          allowEdit={true}
        />
        <Section
          title="Reddedilmiş İhbarlar"
          items={rejectedReports}
          allowApprove={false}
          allowEdit={true}
        />

        {/* YENİ: GRUPLANMIŞ İHBARLAR */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold mb-2">
            Gruplanmış İhbarlar (Tür + Konum)
          </h2>
          {clusters.length === 0 ? (
            <p className="text-sm text-gray-500">Gruplanacak ihbar yok.</p>
          ) : (
            <div className="space-y-3">
              {clusters.map((c) => {
                const isOpen = openClusterKey === c.key
                const count = c.reports.length
                return (
                  <div
                    key={c.key}
                    className="border rounded-xl bg-white p-3 text-sm space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs text-gray-500">
                          {c.type.toUpperCase()} • {c.label}
                        </div>
                        <div className="text-sm font-semibold text-[#102A43]">
                          {count} ihbar
                          {count >= 10 && (
                            <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              Yakın Olay eşiği aşıldı
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenClusterKey(isOpen ? null : c.key)
                        }
                        className="text-xs text-[#0B3B7A]"
                      >
                        {isOpen ? 'Listeyi Gizle' : 'Listeyi Göster'}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="mt-2 border-t pt-2 space-y-2">
                        {c.reports.map((r) => (
                          <div
                            key={r.id}
                            className="border rounded-lg px-3 py-2 bg-[#F9FAFB]"
                          >
                            <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                              <span>{r.userId}</span>
                              <span>
                                {r.createdAt?.toDate
                                  ? r.createdAt.toDate().toLocaleString()
                                  : ''}
                              </span>
                            </div>
                            <div className="text-xs font-semibold mb-1">
                              {r.title || guessTitleFromReport(r)}
                            </div>
                            <div className="text-xs text-gray-700 mb-1">
                              {r.description}
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    r,
                                    r.status === 'pending'
                                      ? 'approve'
                                      : 'edit'
                                  )
                                }
                                className="px-3 py-1 text-[11px] rounded-md bg-[#0B3B7A] text-white"
                              >
                                Ayrıntılı Aç
                              </button>
                              {r.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleReject(r)}
                                  className="px-3 py-1 text-[11px] rounded-md bg-gray-200 text-gray-800"
                                >
                                  Reddet
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {editingReport && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-t-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0B3B7A]">
                {editMode === 'approve'
                  ? 'İhbarı Onayla ve Düzenle'
                  : 'İhbarı Düzenle'}
              </h3>
              <button
                onClick={closeEdit}
                className="text-sm text-gray-500"
                type="button"
              >
                Kapat ✕
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Yakın Olaylar Başlığı
                </label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Gösterilecek Konum
                </label>
                <input
                  value={editDisplayLocation}
                  onChange={(e) => setEditDisplayLocation(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {LOCATION_TEMPLATES.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setEditDisplayLocation(loc)}
                      className="px-2 py-1 text-xs rounded-full border border-[#0B3B7A33] text-[#0B3B7A]"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Şiddet
                </label>
                <select
                  value={editSeverity}
                  onChange={(e) =>
                    setEditSeverity(e.target.value as Severity)
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Açıklama
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) =>
                    setEditDescription(e.target.value)
                  }
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={isProcessing}
                className="flex-1 px-3 py-2 text-sm rounded-md bg-[#0B3B7A] text-white disabled:opacity-60"
                type="button"
              >
                {editMode === 'approve'
                  ? isProcessing
                    ? 'Onaylanıyor...'
                    : 'Kaydet ve Onayla'
                  : isProcessing
                  ? 'Kaydediliyor...'
                  : 'Kaydet'}
              </button>
              <button
                onClick={closeEdit}
                disabled={isProcessing}
                className="px-3 py-2 text-sm rounded-md bg-gray-200 text-gray-800"
                type="button"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomTabs />
    </div>
  )
}
