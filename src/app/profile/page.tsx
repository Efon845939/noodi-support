'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  getFirebaseAuth,
  getFirebaseStorage,
  google,
  getFirebaseDb,
} from '@/lib/firebase'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, getDoc } from 'firebase/firestore'
import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const auth = useMemo(() => getFirebaseAuth(), [])
  const db = useMemo(() => getFirebaseDb(), [])
  const router = useRouter()

  // Auth state
  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [auth])

  // Admin kontrolü (roles_admin/{uid})
  useEffect(() => {
    if (!auth || !db) {
      setIsAdmin(false)
      return
    }
    if (!user) {
      setIsAdmin(false)
      return
    }

    ;(async () => {
      try {
        const refDoc = doc(db, 'roles_admin', user.uid)
        const snap = await getDoc(refDoc)
        setIsAdmin(snap.exists())
      } catch (e) {
        console.error('Admin kontrolü hatası:', e)
        setIsAdmin(false)
      }
    })()
  }, [auth, db, user])

  const login = () => {
    if (!auth) return
    signInWithPopup(auth, google).catch(console.error)
  }

  const logout = () => {
    if (!auth) return
    signOut(auth).catch(console.error)
  }

  const uploadAvatar = async (f: File) => {
    const storage = getFirebaseStorage()
    if (!auth?.currentUser || !storage) return

    const r = ref(storage, `avatars/${auth.currentUser.uid}`)
    await uploadBytes(r, f)
    const url = await getDownloadURL(r)
    await updateProfile(auth.currentUser, { photoURL: url })
    setUser({ ...auth.currentUser })
  }

  // Firebase hiç başlatılamamışsa
  if (!auth) {
    return (
      <div className="min-h-[100svh] bg-white pb-[68px]">
        <HeaderBar title="Profil" />
        <div className="max-w-md mx-auto p-5 space-y-4 text-center">
          <p className="text-sm text-gray-600">
            Firebase yapılandırması eksik. Lütfen ortam değişkenlerinizi kontrol
            edin.
          </p>
          <button
            disabled
            className="w-full bg-gray-300 text-white rounded-lg py-2 cursor-not-allowed"
          >
            Giriş Yapılamıyor
          </button>
        </div>
        <BottomTabs />
      </div>
    )
  }

  return (
    <div className="min-h-[100svh] bg-white pb-[68px]">
      <HeaderBar
        title="Profil"
        name={user?.displayName || null}
        avatarUrl={user?.photoURL || null}
      />

      <div className="max-w-md mx-auto p-5 space-y-4">
        {!user ? (
          <>
            {/* Giriş yapmamış kullanıcı */}
            <button
              onClick={login}
              className="w-full bg-[#0B3B7A] text-white rounded-lg py-2"
            >
              Google ile Giriş Yap
            </button>

            <button
              onClick={() => router.push('/edevlet')}
              className="w-full bg-gray-300 text-gray-700 rounded-lg py-2"
            >
              e-Devlet ile Giriş (Yakında)
            </button>
          </>
        ) : (
          <>
            {/* Kullanıcı bilgileri */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 relative">
                <Image
                  src={user.photoURL || '/avatar-default.svg'}
                  alt="Profil fotoğrafı"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div>
                <div className="font-semibold">{user.displayName}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            </div>

            {/* Profil fotoğrafı yükleme */}
            <label className="block text-sm">
              Profil fotoğrafı yükle
              <input
                className="mt-1 block w-full text-sm text-slate-500
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-full file:border-0
                           file:text-sm file:font-semibold
                           file:bg-violet-50 file:text-violet-700
                           hover:file:bg-violet-100"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] && uploadAvatar(e.target.files[0])
                }
              />
            </label>

            {/* Admin ise: İhbar Yönetimi butonu */}
            {isAdmin && (
              <button
                onClick={() => router.push('/admin/reports')}
                className="w-full bg-[#0B3B7A] text-white rounded-lg py-2 font-semibold"
              >
                İhbar Yönetimi (Admin)
              </button>
            )}

            {/* İsteğe bağlı özel bilgiler */}
            <div className="space-y-4 bg-[#F5F7FA] p-4 rounded-xl border">
              <h2 className="text-lg font-semibold text-[#0B3B7A]">
                Kişisel Bilgiler (İsteğe Bağlı)
              </h2>
              <p className="text-sm text-gray-600 -mt-2">
                Bu bilgiler yalnızca acil durum yönlendirmeleri ve risk analizi
                için kullanılır.
              </p>

              {/* Yaş */}
              <label className="block text-sm font-medium">Yaş</label>
              <input
                type="number"
                min={1}
                max={120}
                placeholder="Örn: 17"
                className="w-full border rounded-lg px-3 py-2"
              />

              {/* Boy / Kilo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Boy (cm)</label>
                  <input
                    type="number"
                    min={50}
                    max={230}
                    placeholder="Örn: 170"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Kilo (kg)
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={250}
                    placeholder="Örn: 60"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Kan grubu */}
              <label className="block text-sm font-medium">Kan Grubu</label>
              <input
                type="text"
                placeholder="0 Rh+, A Rh-, AB Rh+ ..."
                className="w-full border rounded-lg px-3 py-2"
              />

              {/* Kronik hastalıklar */}
              <label className="block text-sm font-medium">
                Kronik Hastalıklar
              </label>
              <textarea
                placeholder="Astım, diyabet, epilepsi..."
                className="w-full border rounded-lg px-3 py-2"
              />

              {/* Düzenli kullanılan ilaçlar */}
              <label className="block text-sm font-medium">
                Düzenli Kullanılan İlaçlar
              </label>
              <textarea
                placeholder="Örn: Kan sulandırıcı, tansiyon ilacı..."
                className="w-full border rounded-lg px-3 py-2"
              />

              {/* Hareket kısıtı / engel durumu */}
              <label className="block text-sm font-medium">
                Hareket Kısıtı / Engel Durumu
              </label>
              <textarea
                placeholder="Örn: Tekerlekli sandalye, baston, görme/işitme engeli..."
                className="w-full border rounded-lg px-3 py-2"
              />

              {/* Acil durumda aranacak kişi */}
              <label className="block text-sm font-medium">
                Acil Durum Kişisi
              </label>
              <input
                type="text"
                placeholder="İsim"
                className="w-full border rounded-lg px-3 py-2 mb-2"
              />
              <input
                type="tel"
                placeholder="Telefon (örn: 05xx xxx xx xx)"
                className="w-full border rounded-lg px-3 py-2"
              />

              {/* Acil durum notu */}
              <label className="block text-sm font-medium mt-2">Ek Not</label>
              <textarea
                placeholder="Örn: Panik atağım var, kalabalıkta hızlı nefes alıyorum; sakinleştirici yaklaşım önemli."
                className="w-full border rounded-lg px-3 py-2"
              />

              <button className="w-full bg-[#0B3B7A] text-white rounded-lg py-2 font-semibold">
                Kaydet
              </button>
            </div>

            <button
              onClick={() => router.push('/edevlet')}
              className="w-full bg-gray-300 text-gray-700 rounded-lg py-2"
            >
              e-Devlet ile Giriş (Yakında)
            </button>

            <button
              onClick={logout}
              className="w-full bg-gray-200 text-gray-700 rounded-lg py-2"
            >
              Çıkış Yap
            </button>
          </>
        )}
      </div>

      <BottomTabs />
    </div>
  )
}
