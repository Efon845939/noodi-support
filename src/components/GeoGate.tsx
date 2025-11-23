'use client'
import { useEffect, useState } from 'react'

export default function GeoGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean>(false)
  const [err, setErr] = useState<string>('')

  useEffect(() => {
    const allowed = typeof window !== 'undefined' && localStorage.getItem('geoAllowed') === '1'
    if (allowed) { setOk(true); return }
  }, [])

  const ask = () => {
    if (!('geolocation' in navigator)) { setErr('Cihazda konum desteği yok.'); return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        try {
          localStorage.setItem('geoAllowed', '1')
          localStorage.setItem('lastGeo', JSON.stringify({
            lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy, t: Date.now()
          }))
        } catch {}
        setOk(true)
      },
      () => setErr('Konum izni gerekli. İzin verene kadar devam edemezsiniz.')
    )
  }

  if (ok) return <>{children}</>

  return (
    <div className="min-h-[100svh] grid place-items-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-5 text-center">
        <h2 className="text-lg font-semibold text-[#0B3B7A] mb-2">Konum İzni Gerekli</h2>
        <p className="text-sm text-gray-700 mb-4">
          Yardım gönderimi ve operatör bilgilendirmesi için konum paylaşımı zorunludur.
        </p>
        {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
        <button onClick={ask} className="w-full bg-[#0B3B7A] text-white rounded-lg py-2">İzin ver</button>
      </div>
    </div>
  )
}
