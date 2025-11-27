// src/app/settings/page.tsx
'use client'
import { useEffect, useState } from 'react'
import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'
import { ChevronRight } from 'lucide-react'
import { DEFAULT_SETTINGS, type AllSettings, type Channel } from '@/types/alert'
import NearbyFeed from '@/components/NearbyFeed'
import { triggerTestAlertWeb } from '@/lib/test-alert'
import { addSimIncident, clearSimIncidents } from '@/lib/nearby-sim'

export default function Settings() {
  const [tab, setTab] = useState<Channel>('disaster')
  const [st, setSt] = useState<AllSettings>(DEFAULT_SETTINGS)
  // NearbyFeed'i zorla yeniden render etmek için key
  const [feedKey, setFeedKey] = useState(Date.now())
  // Yakın olaylar health check çıktısı
  const [nearbyDebug, setNearbyDebug] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('alert_settings_v3')
      if (raw) setSt(JSON.parse(raw))
    } catch {}
  }, [])

  const save = (ns: AllSettings) => {
    setSt(ns)
    try {
      localStorage.setItem('alert_settings_v3', JSON.stringify(ns))
    } catch {}
  }

  const setG = (k: keyof AllSettings['general'], v: any) =>
    save({ ...st, general: { ...st.general, [k]: v } })

  const handleClearHistory = async () => {
    try {
      await clearSimIncidents()
    } catch (e) {
      console.error('Geçmiş temizlenirken hata:', e)
    } finally {
      setFeedKey(Date.now())
    }
  }

    const handleNearbyHealthCheck = () => {
    setNearbyDebug('Test başlatılıyor…')
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setNearbyDebug('Tarayıcın konum desteği vermiyor.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude

          const body = {
            lat,
            lng,
            radiusKm: st.personal.nearby.radiusKm,
            window: st.personal.nearby.window as '24h' | '3d' | '7d',
          }

          const res = await fetch('/api/incidents/nearby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }).catch(() => null)

          if (!res) {
            setNearbyDebug('API isteği yapılamadı (fetch null döndü).')
            return
          }

          const j = await res.json().catch(() => ({
            error: 'JSON_PARSE',
          }))

          const count = Array.isArray(j?.items) ? j.items.length : 0
          const first = count > 0 ? j.items[0] : null

          setNearbyDebug(
            JSON.stringify(
              {
                request: body,
                count,
                first,
                rawError: j?.error || null,
              },
              null,
              2
            )
          )
        } catch (e: any) {
          console.error('nearby health check error:', e)
          setNearbyDebug(
            'Health check sırasında hata oluştu: ' +
              String(e?.message || e)
          )
        }
      },
      (err) => {
        setNearbyDebug(
          'Konum alınamadı / reddedildi: ' + String(err?.message || '')
        )
      }
    )
  }


  return (
    <div className="min-h-[100svh] bg-white pb-[68px]">
      <HeaderBar title="Ayarlar" />
      {/* Segment control */}
      <div className="px-4 pt-4">
        <div className="bg-[#E9EEF5] rounded-xl p-1 flex gap-1">
          <Seg
            label="Afet Uyarıları"
            active={tab === 'disaster'}
            onClick={() => setTab('disaster')}
          />
          <Seg
            label="Kişisel Uyarılar"
            active={tab === 'personal'}
            onClick={() => setTab('personal')}
          />
        </div>
      </div>

      <Section title="GENEL">
        <RowToggle
          label="Konum paylaşımı zorunlu"
          value={st.general.locationOn}
          onChange={(v) => setG('locationOn', v)}
        />
        <RowToggle
          label="Kritik uyarıları yapılandır (iOS/Android)"
          value={st.general.criticalTry}
          onChange={(v) => setG('criticalTry', v)}
        />
        <RowToggle
          label="Güç tasarrufunda uyarıları zorla"
          value={st.general.batteryBypassAttempt}
          onChange={(v) => setG('batteryBypassAttempt', v)}
        />
        <RowTimeRange
          label="Sessiz Saatler"
          fromKey="quietFrom"
          toKey="quietTo"
          store={st}
          setStore={save}
        />
      </Section>

      {tab === 'disaster' && (
        <>
          <Section title="BİLDİRİMLER">
            <RowSelect
              label="Minimum büyüklük"
              value={st.disaster.minMag}
              onClick={() =>
                cycle(
                  ['3.5+', '4.0+', '4.5+', '5.0+'],
                  st.disaster.minMag,
                  (v) =>
                    save({
                      ...st,
                      disaster: { ...st.disaster, minMag: v as any },
                    })
                )
              }
            />
            <RowSelect
              label="Azami mesafe"
              value={labelKm(st.disaster.maxDistanceKm)}
              onClick={() =>
                cycle(
                  [50, 100, 250, 500],
                  st.disaster.maxDistanceKm,
                  (v) =>
                    save({
                      ...st,
                      disaster: { ...st.disaster, maxDistanceKm: v as any },
                    })
                )
              }
            />
            <RowSelect
              label="Bildirim sesi"
              value={st.disaster.sound}
              onClick={() =>
                cycle(
                  ['Alarm', 'Siren', 'Beep'],
                  st.disaster.sound,
                  (v) =>
                    save({
                      ...st,
                      disaster: { ...st.disaster, sound: v as any },
                    })
                )
              }
            />
            <RowToggle
              label="Tekrar çal"
              value={st.disaster.repeat}
              onChange={(v) =>
                save({
                  ...st,
                  disaster: { ...st.disaster, repeat: v },
                })
              }
            />
            {st.disaster.repeat && (
              <RowSelect
                label="Tekrar aralığı"
                value={labelSec(st.disaster.repeatSec)}
                onClick={() =>
                  cycle(
                    ['30 sn', '1 dk', '2 dk'],
                    labelSec(st.disaster.repeatSec),
                    (v) =>
                      save({
                        ...st,
                        disaster: {
                          ...st.disaster,
                          repeatSec:
                            v === '30 sn'
                              ? 30
                              : v === '1 dk'
                              ? 60
                              : (120 as any),
                        },
                      })
                  )
                }
              />
            )}
          </Section>

          <Section title="UYARI SEÇENEKLERİ">
            <RowToggle
              label="Titreşim"
              value={st.disaster.vibrate}
              onChange={(v) =>
                save({
                  ...st,
                  disaster: { ...st.disaster, vibrate: v },
                })
              }
            />
            <RowToggle
              label="Flaş (SOS)"
              value={st.disaster.flash}
              onChange={(v) =>
                save({
                  ...st,
                  disaster: { ...st.disaster, flash: v },
                })
              }
            />
            <RowToggle
              label="Sesli talimat (TTS)"
              value={st.disaster.tts}
              onChange={(v) =>
                save({
                  ...st,
                  disaster: { ...st.disaster, tts: v },
                })
              }
            />
            <RowToggle
              label="Rahatsız Etmeyin'i baypas etmeyi dene"
              value={st.disaster.dnd}
              onChange={(v) =>
                save({
                  ...st,
                  disaster: { ...st.disaster, dnd: v },
                })
              }
            />
          </Section>

          {st.general.locationOn && (
            <>
              <Section title="YAKIN OLAYLAR (AFET)">
                <RowToggle
                  label="Yakın afet olaylarını göster"
                  value={st.general.focusNearest}
                  onChange={(v) => setG('focusNearest', v)}
                />
              </Section>

              {st.general.focusNearest && (
                <Section title="AKIŞ">
                  <NearbyFeed
                    key={feedKey}
                    radiusKm={st.disaster.maxDistanceKm}
                    windowRange="24h"
                    categories={[
                      'earthquake',
                      'fire',
                      'flood',
                      'landslide',
                      'storm',
                    ]}
                  />
                </Section>
              )}
            </>
          )}
        </>
      )}

      {tab === 'personal' && (
        <>
          <Section title="YAKIN OLAYLAR">
            <RowToggle
              label="Yakın olayları göster"
              value={st.personal.nearby.enabled}
              onChange={(v) =>
                save({
                  ...st,
                  personal: {
                    ...st.personal,
                    nearby: { ...st.personal.nearby, enabled: v },
                  },
                })
              }
            />
            <RowSelect
              label="Yarıçap"
              value={`${st.personal.nearby.radiusKm} km`}
              onClick={() =>
                cycle(
                  [50, 100, 250, 500],
                  st.personal.nearby.radiusKm,
                  (v) =>
                    save({
                      ...st,
                      personal: {
                        ...st.personal,
                        nearby: {
                          ...st.personal.nearby,
                          radiusKm: v as any,
                        },
                      },
                    })
                )
              }
            />
            <RowSelect
              label="Zaman aralığı"
              value={labelWindow(st.personal.nearby.window)}
              onClick={() =>
                cycle(
                  ['24h', '3d', '7d'],
                  st.personal.nearby.window,
                  (v) =>
                    save({
                      ...st,
                      personal: {
                        ...st.personal,
                        nearby: {
                          ...st.personal.nearby,
                          window: v as any,
                        },
                      },
                    })
                )
              }
            />
            <RowSelect
              label="Yenileme sıklığı"
              value={`${st.personal.nearby.refreshMins} dk`}
              onClick={() =>
                cycle(
                  [15, 30, 60],
                  st.personal.nearby.refreshMins,
                  (v) =>
                    save({
                      ...st,
                      personal: {
                        ...st.personal,
                        nearby: {
                          ...st.personal.nearby,
                          refreshMins: v as any,
                        },
                      },
                    })
                )
              }
            />
            <RowToggle
              label="Kritik olayda ekranı otomatik aç"
              value={st.personal.nearby.autoOpenOnCritical}
              onChange={(v) =>
                save({
                  ...st,
                  personal: {
                    ...st.personal,
                    nearby: {
                      ...st.personal.nearby,
                      autoOpenOnCritical: v,
                    },
                  },
                })
              }
            />
          </Section>

          {st.personal.nearby.enabled && (
            <Section title="YAKIN OLAYLAR AKIŞI">
              <NearbyFeed
                key={feedKey}
                radiusKm={st.personal.nearby.radiusKm}
                windowRange={st.personal.nearby.window}
                categories={st.personal.nearby.categories}
              />
            </Section>
          )}

          <Section title="ESKALASYON">
            <RowToggle
              label="Tekrar çal"
              value={st.personal.escalation.repeat}
              onChange={(v) =>
                save({
                  ...st,
                  personal: {
                    ...st.personal,
                    escalation: {
                      ...st.personal.escalation,
                      repeat: v,
                    },
                  },
                })
              }
            />
            {st.personal.escalation.repeat && (
              <RowSelect
                label="Tekrar aralığı"
                value={labelSec(st.personal.escalation.repeatSec)}
                onClick={() =>
                  cycle(
                    ['30 sn', '1 dk', '2 dk'],
                    labelSec(st.personal.escalation.repeatSec),
                    (v) =>
                      save({
                        ...st,
                        personal: {
                          ...st.personal,
                          escalation: {
                            ...st.personal.escalation,
                            repeatSec:
                              v === '30 sn'
                                ? 30
                                : v === '1 dk'
                                ? 60
                                : (120 as any),
                          },
                        },
                      })
                  )
                }
              />
            )}
            <RowToggle
              label="Bildirim kapatılmadan önce onay iste"
              value={st.personal.escalation.requireAcknowledge}
              onChange={(v) =>
                save({
                  ...st,
                  personal: {
                    ...st.personal,
                    escalation: {
                      ...st.personal.escalation,
                      requireAcknowledge: v,
                    },
                  },
                })
              }
            />
            <RowToggle
              label="3. tekrarda acil kişilere haber ver"
              value={st.personal.escalation.notifyContacts}
              onChange={(v) =>
                save({
                  ...st,
                  personal: {
                    ...st.personal,
                    escalation: {
                      ...st.personal.escalation,
                      notifyContacts: v,
                    },
                  },
                })
              }
            />
          </Section>

          <Section title="GİZLİLİK">
            <RowSelect
              label="Kilit ekranı önizlemesi"
              value={labelPreview(st.personal.privacy.lockscreenPreview)}
              onClick={() =>
                cycle(
                  ['show', 'sender_only', 'hidden'],
                  st.personal.privacy.lockscreenPreview,
                  (v) =>
                    save({
                      ...st,
                      personal: {
                        ...st.personal,
                        privacy: {
                          ...st.personal.privacy,
                          lockscreenPreview: v as any,
                        },
                      },
                    })
                )
              }
            />
            <RowToggle
              label="Kalıcı uyarı bandı"
              value={st.personal.privacy.persistentBanner}
              onChange={(v) =>
                save({
                  ...st,
                  personal: {
                    ...st.personal,
                    privacy: {
                      ...st.personal.privacy,
                      persistentBanner: v,
                    },
                  },
                })
              }
            />
            <RowToggle
              label="Bildirimleri grupla"
              value={st.personal.privacy.groupNotifications}
              onChange={(v) =>
                save({
                  ...st,
                  personal: {
                    ...st.personal,
                    privacy: {
                      ...st.personal.privacy,
                      groupNotifications: v,
                    },
                  },
                })
              }
            />
          </Section>
        </>
      )}

            <div className="px-4 pt-3 pb-6 max-w-md mx-auto space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            className="bg-[#D32F2F] text-white rounded-lg py-2 font-semibold"
            type="button"
            onClick={() =>
              triggerTestAlertWeb({
                sound: st[tab].tts || true,
                vibrate: (st as any)[tab].vibrate,
                tts: (st as any)[tab].tts,
              })
            }
          >
            Uyarıyı Test Et
          </button>

          <button
            className="bg-[#0B3B7A] text-white rounded-lg py-2 font-semibold"
            type="button"
            onClick={() => {
              addSimIncident({
                type: 'earthquake',
                title: 'Simülasyon: M 4.2, 12 km kuzeydoğu',
                distKm: 12,
                severity: 'high',
                meta: { magnitude: 4.2 },
              })
              setFeedKey(Date.now())
              alert(
                'Simülasyon olayı eklendi. Kişisel Uyarılar > Yakın Olaylar listesine yansıdı.'
              )
            }}
          >
            Olayı Simüle Et
          </button>
        </div>

        <button
          className="w-full bg-gray-800 text-white rounded-lg py-2 text-sm font-semibold"
          type="button"
          onClick={handleNearbyHealthCheck}
        >
          Yakın Olaylar Sağlık Testi
        </button>

        {nearbyDebug && (
          <div className="mt-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl p-2 max-h-64 overflow-auto">
            <div className="text-xs font-semibold mb-1 text-gray-700">
              Health check çıktısı
            </div>
            <pre className="text-[11px] whitespace-pre-wrap break-words text-gray-700">
              {nearbyDebug}
            </pre>
          </div>
        )}
      </div>

      <BottomTabs />
    </div>
  )
}


/* ——— küçük bileşenler ——— */
function Seg({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex-1 py-2 rounded-lg text-sm ${
        active
          ? 'bg-white text-[#0B3B7A] font-semibold'
          : 'text-[#0B3B7A]/80'
      }`}
    >
      {label}
    </button>
  )
}

function Section({
  title,
  children,
  actionButton,
}: {
  title: string
  children: React.ReactNode
  actionButton?: React.ReactNode
}) {
  return (
    <div className="px-4 pt-5">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-semibold tracking-wide text-[#6B7280]">
          {title}
        </div>
        {actionButton}
      </div>
      <div className="bg-[#F6F7F9] rounded-2xl overflow-hidden border border-[#E7EAF0]">
        {children}
      </div>
    </div>
  )
}

function RowSelect({
  label,
  value,
  onClick,
}: {
  label: string
  value: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="w-full h-12 px-4 flex items-center justify-between active:bg-[#ECEFF5]"
    >
      <span className="text-[15px] text-[#102A43]">{label}</span>
      <span className="flex items-center gap-2 text-[#6B7280] text-[15px]">
        {value} <ChevronRight className="w-4 h-4 opacity-70" />
      </span>
    </button>
  )
}

function RowToggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="w-full h-12 px-4 flex items-center justify-between">
      <span className="text-[15px] text-[#102A43]">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-[#2b8a3e] transition" />
        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition" />
      </label>
    </div>
  )
}

function RowTimeRange({
  label,
  fromKey,
  toKey,
  store,
  setStore,
}: {
  label: string
  fromKey: 'quietFrom'
  toKey: 'quietTo'
  store: any
  setStore: (ns: any) => void
}) {
  const from = store.general[fromKey] || '00:00'
  const to = store.general[toKey] || '06:00'

  return (
    <div className="w-full h-12 px-4 flex items-center justify-between">
      <span className="text-[15px] text-[#102A43]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={from}
          onChange={(e) =>
            setStore({
              ...store,
              general: { ...store.general, [fromKey]: e.target.value },
            })
          }
          className="border rounded-lg px-2 py-1 bg-white"
        />
        <span className="text-sm text-gray-500">–</span>
        <input
          type="time"
          value={to}
          onChange={(e) =>
            setStore({
              ...store,
              general: { ...store.general, [toKey]: e.target.value },
            })
          }
          className="border rounded-lg px-2 py-1 bg-white"
        />
      </div>
    </div>
  )
}

function cycle<T extends string | number>(
  arr: T[],
  cur: T,
  set: (v: T) => void
) {
  const i = arr.indexOf(cur)
  const next = arr[(i + 1) % arr.length]
  set(next)
}

function labelSec(v: 30 | 60 | 120) {
  return v === 30 ? '30 sn' : v === 60 ? '1 dk' : '2 dk'
}

function labelKm(v: 50 | 100 | 250 | 500) {
  return `${v} km`
}

function labelWindow(w: '24h' | '3d' | '7d') {
  if (w === '24h') return '24 saat'
  if (w === '3d') return '3 gün'
  return '7 gün'
}

function labelPreview(p: 'show' | 'sender_only' | 'hidden') {
  if (p === 'show') return 'Tam'
  if (p === 'sender_only') return 'Yalnızca gönderici'
  return 'Gizli'
}
