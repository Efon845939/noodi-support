'use client'
import { useState } from 'react'

export default function DisasterAssistant({ type }:{ type:string }) {
  const [msg,setMsg]=useState('')
  const [busy,setBusy]=useState(false)
  const [out,setOut]=useState<any>(null)
  const [err,setErr]=useState('')

  const ask = async () => {
    const m = msg.trim(); if(!m||busy) return
    setBusy(true); setErr(''); setOut(null)
    const loc = await new Promise<any>(res=>{
      if(!navigator.geolocation) return res({})
      navigator.geolocation.getCurrentPosition(p=>res({location:{lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy}}),()=>res({}),{enableHighAccuracy:true,timeout:7000})
    })
    const r = await fetch('/api/ai/disaster', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ message:m, type, context: loc })
    }).catch(()=>null)
    const j = await r?.json().catch(()=>({error:true}))
    if(!j){ setErr('Bağlantı hatası'); setBusy(false); return }
    setOut(j); setBusy(false)
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="text-sm text-[#0B3B7A]">Sorunuzu yazın; asistan <b>{type}</b> bağlamına göre yanıtlasın.</div>
      {err && <div className="px-3 py-2 bg-red-50 text-red-700 rounded text-xs">{err}</div>}
      <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={3}
        className="w-full border rounded-xl p-3" placeholder={`Örn. ${type} sonrası bodrumdayım, ne yapmalıyım?`} />
      <button disabled={busy||!msg.trim()} onClick={ask}
        className={`w-full rounded-lg py-2 text-white ${busy||!msg.trim()?'bg-gray-300':'bg-[#D32F2F]'}`}>
        {busy?'Gönderiliyor…':'Gönder'}
      </button>
      {out && (
        <div className="bg-[#F6F7F9] rounded-xl p-3 text-sm space-y-2">
          {out.reply && <div><b>Cevap:</b> {out.reply}</div>}
          {Array.isArray(out.nextSteps) && out.nextSteps.length>0 && (
            <ul className="list-decimal pl-5">{out.nextSteps.map((x:string,i:number)=><li key={i}>{x}</li>)}</ul>
          )}
          {out.error && <details className="text-xs text-gray-500"><summary>Detay</summary>{out.detail}</details>}
        </div>
      )}
    </div>
  )
}
