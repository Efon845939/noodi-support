'use client'
import { useRouter } from 'next/navigation'

export default function ChatFab(){
  const r = useRouter()
  return (
    <button
      onClick={()=>r.push('/personal')}        // kişisel yardıma yönlendirip asistanı açıyoruz
      className="fixed right-4 bottom-[84px] z-40 w-14 h-14 rounded-full bg-[#0B3B7A]
                 text-white shadow-xl grid place-items-center active:scale-95 text-2xl"
      aria-label="Sohbeti aç"
      title="Sohbet"
    >
      💬
    </button>
  )
}
