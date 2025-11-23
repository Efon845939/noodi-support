'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getFirebaseAuth, google } from '@/lib/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'

export default function LoginPage() {
  const router = useRouter()
  const auth = getFirebaseAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const mapFirebaseError = (e: any, mode: 'login' | 'signup') => {
    const code = e?.code || ''

    switch (code) {
      case 'auth/email-already-in-use':
        return 'Bu e-posta ile zaten bir hesap var.'
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'E-posta veya şifre hatalı.'
      case 'auth/user-not-found':
        return mode === 'login'
          ? 'Bu e-posta ile kayıt bulunamadı.'
          : 'Bu e-posta zaten kullanılıyor.'
      case 'auth/too-many-requests':
        return 'Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyin.'
      default:
        return 'Bir hata oluştu.'
    }
  }

  const handleSubmit = async () => {
    if (!auth) return

    try {
      setError('')
      setLoading(true)

      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }

      router.replace('/profile')
    } catch (e: any) {
      console.error(e)
      setError(mapFirebaseError(e, mode))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    if (!auth) return

    try {
      setError('')
      setLoading(true)

      await signInWithPopup(auth, google)
      router.replace('/profile')
    } catch (e: any) {
      console.error(e)
      setError('Google ile giriş yapılamadı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-white pb-[68px] flex flex-col">
      <HeaderBar title="Giriş / Kayıt" showBack />

      <main className="flex-1 flex items-center justify-center px-4 pt-6">
        <div className="w-full max-w-md space-y-4">

          <h1 className="text-xl font-bold text-center">
            {mode === 'signup' ? 'Kayıt Ol' : 'Giriş Yap'}
          </h1>

          {error && (
            <div className="text-sm text-red-600 bg-red-100 border border-red-300 p-2 rounded-lg">
              {error}
            </div>
          )}

          <input
            type="email"
            placeholder="E-posta"
            className="w-full border rounded-lg px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Şifre"
            className="w-full border rounded-lg px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#0B3B7A] text-white rounded-lg py-2 font-semibold disabled:opacity-60"
          >
            {loading ? 'İşleniyor...' : (mode === 'signup' ? 'Kayıt Ol' : 'Giriş Yap')}
          </button>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full bg-[#D73333] text-white rounded-lg py-2 font-semibold disabled:opacity-60"
          >
            Google ile Giriş Yap
          </button>

          <button
            className="w-full text-[#0B3B7A] mt-2 underline text-sm"
            onClick={() =>
              setMode(mode === 'signup' ? 'login' : 'signup')
            }
          >
            {mode === 'signup'
              ? 'Hesabın var mı? Giriş Yap'
              : 'Hesabın yok mu? Kayıt Ol'}
          </button>

        </div>
      </main>

      <BottomTabs />
    </div>
  )
}
