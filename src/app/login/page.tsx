'use client'

import { useState } from 'react'
import { getFirebaseAuth, google } from '@/lib/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const auth = getFirebaseAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')

  const submit = async () => {
    if (!auth) return
    try {
      setError('')
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      router.replace('/')
    } catch (e: any) {
      setError(e.message)
    }
  }

  const googleLogin = async () => {
    if (!auth) return
    try {
      await signInWithPopup(auth, google)
      router.replace('/')
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-white">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold text-center">{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</h1>

        {error && <div className="text-red-600 text-sm">{error}</div>}

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
          onClick={submit}
          className="w-full bg-[#0B3B7A] text-white py-2 rounded-lg font-semibold"
        >
          {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
        </button>

        <button
          onClick={googleLogin}
          className="w-full bg-red-500 text-white py-2 rounded-lg"
        >
          Google ile Giriş Yap
        </button>

        <button
  onClick={() => router.push('/login')}
  className="w-full bg-gray-300 text-gray-700 rounded-lg py-2"
>
  E-posta ile Giriş Yap
</button>

        <button
          className="w-full text-[#0B3B7A] mt-2 underline"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        >
          {mode === 'login' ? 'Hesabın yok mu? Kayıt Ol' : 'Hesabın var mı? Giriş Yap'}
        </button>
      </div>
    </div>
  )
}
