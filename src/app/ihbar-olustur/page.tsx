'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getFirebaseAuth } from '@/lib/firebase'
import { createReport, ReportType } from '@/lib/reports'
import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'
import DisasterAssistant from '@/components/DisasterAssistant'
import placesTr from '@/data/places-tr.json' assert { type: 'json' }

type Place = {
  id: string
  cityCode: number
  cityName: string
  districtName: string
  label: string
  lat: number
  lng: number
}

const PLACES = placesTr as Place[]

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'yangin', label: 'Yangın' },
  { value: 'trafik', label: 'Trafik Kazası' },
  { value: 'kayip', label: 'Kayıp Kişi' },
  { value: 'gaz', label: 'Gaz Kaçağı / Koku' },
  { value: 'diger', label: 'Diğer' },
]

// küçük haversine helper
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// mevcut konuma en yakın il/ilçe kaydını bul
function findNearestPlace(lat: number, lng: number): Place | null {
  if (!PLACES.length) return null
  let best: Place | null = null
  let bestDist = Number.POSITIVE_INFINITY

  for (const p of PLACES) {
    const d = haversineKm(lat, lng, p.lat, p.lng)
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }
  return best
}

export default function IhbarOlusturPage() {
  const [type, setType] = useState<ReportType>('yangin')
  const [customType, setCustomType] = useState('')
  const [description, setDescription] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [geoBusy, setGeoBusy] = useState(false)

  const auth = getFirebaseAuth()
  const router = useRouter()

  const suggestions = useMemo(() => {
    if (!locationQuery.trim()) return []
    const q = locationQuery.toLowerCase()
    return PLACES.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.cityName.toLowerCase().includes(q) ||
        p.districtName.toLowerCase().includes(q)
    ).slice(0, 5)
  }, [locationQuery])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!auth) {
      setError('İhbar oluşturmak için Firebase yapılandırması eksik.')
      return
    }

    const user = auth.currentUser
    if (!user) {
      setError('İhbar oluşturmak için önce giriş yapmalısın.')
      return
    }

    if (type === 'diger' && !customType.trim()) {
      setError('Diğer seçtiysen, ihbar türünü de yazmalısın.')
      return
    }

    if (!description.trim()) {
      setError('Olayı kısaca da olsa anlatman gerekiyor.')
      return
    }

    if (!selectedPlace) {
      setError('Konum listesinden bir yer seç veya konumunu kullan.')
      return
    }

    try {
      setIsSubmitting(true)

      const finalDescription =
        type === 'diger'
          ? `[${customType.trim()}] ${description.trim()}`
          : description.trim()

      await createReport({
        userId: user.uid, // RULES İLE %100 UYUMLU
        type,
        description: finalDescription,
        location: {
          address: selectedPlace.label,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
        },
      })

      setInfo(
        'İhbarın alındı. Onaylandıktan sonra Yakın Olaylar bölümünde görünecek.'
      )
      setDescription('')
      setCustomType('')
      setLocationQuery('')
      setSelectedPlace(null)
    } catch (err: any) {
      console.error('IHBAR ERROR', err?.code, err?.message ?? err)
      setError(
        err?.code === 'permission-denied'
          ? 'İhbar oluşturma iznin yok (Firestore rules).'
          : 'İhbar oluşturulurken bir hata oluştu.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleLocationChange(v: string) {
    setLocationQuery(v)
    setSelectedPlace(null)
  }

  function handleSelectPlace(p: Place) {
    setSelectedPlace(p)
    setLocationQuery(p.label)
  }

  async function useMyLocation() {
    setError(null)
    if (!navigator.geolocation) {
      setError('Tarayıcın konum desteği vermiyor.')
      return
    }
    setGeoBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude

        const nearest = findNearestPlace(lat, lng)
        if (nearest) {
          setSelectedPlace(nearest)
          setLocationQuery(nearest.label)
          setInfo(
            `Konumun '${nearest.label}' ile eşleştirildi.`
          )
        } else {
          setInfo('Konuma en yakın yer bulunamadı, elle yaz.')
        }
        setGeoBusy(false)
      },
      () => {
        setError('Konum izni verilmedi.')
        setGeoBusy(false)
      }
    )
  }

  return (
    <div className="min-h-[100svh] bg-white pb-[68px] flex flex-col">
      <HeaderBar title="İhbar Oluştur" />
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 space-y-4">
        <p className="text-xs text-gray-700">
          Yaptığın ihbar, <strong>Yakın Olaylar</strong> bölümüne eklenir. 
          Acil durumlarda her zaman önce <strong>112</strong>&apos;yi ara.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tür */}
          <div>
            <label className="block text-sm font-medium mb-1">
              İhbar türü
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {type === 'diger' && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-600">
                  Diğer: yıkılan bina, kavga, hırsızlık, şüpheli paket vb.
                </p>
                <input
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Örn: Yıkılan bina"
                />
              </div>
            )}
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Olayı kısaca anlat
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Konum */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">
                Konum (il / ilçe yazarak seç)
              </label>
              <button
                type="button"
                onClick={useMyLocation}
                disabled={geoBusy}
                className="text-[11px] px-2 py-1 rounded-full border border-[#0B3B7A33] text-[#0B3B7A]"
              >
                {geoBusy ? 'Alınıyor…' : 'Konumumu kullan'}
              </button>
            </div>
            <input
              value={locationQuery}
              onChange={(e) => handleLocationChange(e.target.value)}
              className={
                'w-full border rounded-lg px-3 py-2 text-sm' +
                (error?.includes('Konum') ? ' border-red-500' : '')
              }
              placeholder="Örn: İstanbul / Zeytinburnu"
            />
            {locationQuery && suggestions.length > 0 && (
              <div className="mt-1 border rounded-lg bg-white shadow-sm max-h-40 overflow-y-auto text-sm">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPlace(p)}
                    className="w-full text-left px-3 py-1 hover:bg-blue-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
            {locationQuery && suggestions.length === 0 && !selectedPlace && (
              <p className="text-xs text-red-600 mt-1">
                Bu isimde kayıtlı bir konum yok. Daha genel yaz (örn: şehir /
                ilçe) ya da “Konumumu kullan”ı dene.
              </p>
            )}
            {selectedPlace && (
              <p className="text-[11px] text-green-700 mt-1">
                Seçilen konum: <strong>{selectedPlace.label}</strong>
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0B3B7A] text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60"
          >
            {isSubmitting ? 'Gönderiliyor...' : 'İhbarı Gönder'}
          </button>
        </form>

        {/* Asistan */}
        <section className="mt-6 border-t pt-4 space-y-3">
          <button
            onClick={() => setAssistantOpen((v) => !v)}
            className="w-full bg-[#0B3B7A] text-white rounded-lg py-2 font-semibold"
            type="button"
          >
            {assistantOpen ? 'Asistanı Gizle' : 'Asistanı Aç'}
          </button>
          {assistantOpen && (
            <div className="border rounded-2xl p-3 space-y-2 bg-[#F9FAFB]">
              <p className="text-sm text-gray-700">
                Sorunu yaz; asistan <strong>İHBAR</strong> bağlamına göre yanıt
                versin.
              </p>
              <DisasterAssistant type="IHBAR" />
            </div>
          )}
        </section>
      </main>

      <BottomTabs />
    </div>
  )
}
