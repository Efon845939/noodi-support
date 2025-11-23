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

  const handleSubmit = async () => {
    if (!auth) return
    if (!email || !password) {
      setError('E-posta ve şifre boş olamaz.')
      return
    }

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
      setError(e?.message || 'Giriş sırasında bir hata oluştu.')
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
      setError(e?.message || 'Google ile giriş başarısız.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-white pb-[68px] flex flex-col">
      <HeaderBar title="Giriş / Kayıt" showBack />

      <main className="flex-1 flex items-center justify-center px-4 pt-4 pb-4">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-xl font-bold text-center">
            {mode === 'signup' ? 'Kayıt Ol' : 'Giriş Yap'}
          </h1>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
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

          {/* Email/şifre ile giriş veya kayıt */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#0B3B7A] text-white rounded-lg py-2 font-semibold disabled:opacity-60"
          >
            {loading
              ? 'İşleniyor...'
              : mode === 'signup'
              ? 'Kayıt Ol'
              : 'Giriş Yap'}
          </button>

          {/* Google ile giriş */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full bg-[#D73333] text-white rounded-lg py-2 font-semibold disabled:opacity-60"
          >
            Google ile Giriş Yap
          </button>

          {/* Gri e-posta butonu YOK artık */}
          <button
            className="w-full text-[#0B3B7A] mt-2 underline text-sm"
            type="button"
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
