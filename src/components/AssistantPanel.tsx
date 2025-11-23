'use client'
import { useEffect, useRef, useState } from 'react'

type Msg = { role:'user'|'assistant'; text:string }
const welcome: Msg = { role:'assistant', text:'Size yardımcı olacağım. Kısaca durumu yazın veya üstteki hazır seçeneklerden birini seçin.' };

function HistoryDropdown({sessions, load}:{sessions:any; load:(id:string)=>void}){
  const entries = Object.values(sessions||{}).sort((a:any,b:any)=>b.ts-a.ts).slice(0,20)
  return (
    <div className="relative">
      <details className="text-xs" onToggle={e => { if(e.currentTarget.open) e.currentTarget.querySelector('button')?.focus()}}>
        <summary className="cursor-pointer select-none px-2 py-1.5 rounded-lg bg-gray-100">Geçmiş</summary>
        <div className="absolute z-10 mt-1 w-60 max-h-64 overflow-auto bg-white border rounded-lg shadow">
          {entries.length===0 && <div className="px-3 py-2 text-gray-500 text-xs">Kayıt yok</div>}
          {entries.map((s:any)=>(
            <button key={s.id} onClick={()=>{load(s.id); (document.activeElement as HTMLElement)?.blur()}} className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-xs">
              {new Date(s.ts).toLocaleString()} — {s.msgs?.[1]?.text?.slice(0,24) || s.msgs?.[0]?.text?.slice(0,24) || 'Sohbet'}
            </button>
          ))}
        </div>
      </details>
    </div>
  )
}

export default function AssistantPanel({
  open,
  onClose,
  mode='personal'
}:{
  open:boolean; onClose:()=>void; mode?:'personal'|'disaster'
}) {
  const [sid,setSid]=useState<string>('')
  const [msgs, setMsgs] = useState<Msg[]>([welcome])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr]   = useState('')
  const [ttsOn, setTtsOn] = useState(true)
  const [sessions,setSessions]=useState({})
  const scRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const saveSession = (id:string, currentMsgs:Msg[]) => {
    if (!id) return;
    try {
      // Save all sessions
      const raw = localStorage.getItem('chat_sessions');
      const all = raw ? JSON.parse(raw) : {};
      all[id] = { id, ts: Date.now(), msgs: currentMsgs };
      localStorage.setItem('chat_sessions', JSON.stringify(all));
      setSessions(all);
      // Save the last active session ID
      localStorage.setItem('chat_last_sid', id);
    } catch {}
  }

  const loadChat = (id:string) => {
    try {
      const raw = localStorage.getItem('chat_sessions');
      const all = raw ? JSON.parse(raw) : {};
      const s = all[id];
      if(s){
        setSid(id);
        setMsgs(s.msgs);
        localStorage.setItem('chat_last_sid', id); // Update last active SID
      }
    } catch {}
  }
  
  const newChat = () => {
    const id = crypto.randomUUID();
    setSid(id);
    setMsgs([welcome]);
    saveSession(id, [welcome]);
  }

  useEffect(() => {
    if (open) {
      try {
        const allSessionsRaw = localStorage.getItem('chat_sessions');
        if(allSessionsRaw) setSessions(JSON.parse(allSessionsRaw));
  
        const lastSid = localStorage.getItem('chat_last_sid');
        if (lastSid) {
          loadChat(lastSid);
        } else {
          newChat();
        }

        const savedTts = localStorage.getItem('tts_enabled');
        setTtsOn(savedTts !== 'false'); // Default to true if not found

      } catch {
        newChat();
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Otomatik kaydırma
  useEffect(() => {
    scRef.current?.scrollTo({ top: scRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, busy])

  // Klavye kısayolları
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && !(e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send() // Ctrl/⌘+Enter
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, input, busy, sid])

  const tts = (t:string) => {
    try {
      if (!ttsOn || !('speechSynthesis' in window)) return
      const u = new SpeechSynthesisUtterance(t)
      const v = speechSynthesis.getVoices().find(x => /tr-|Turkish/i.test(x.lang))
      if (v) u.voice = v; u.lang = v?.lang || 'tr-TR'
      speechSynthesis.cancel(); speechSynthesis.speak(u)
    } catch {}
  }

  const safe = (raw:any) => { try { return raw ? JSON.parse(raw) : null } catch { return null } }

  const gather = async () => {
    const profile = safe(localStorage.getItem('profile_health')) || {};
    const settings = safe(localStorage.getItem('alert_settings_v3')) || {};
    
    // Asenkron olarak konumu al ve bekle
    const location = await new Promise<any>((resolve) => {
      if (!navigator.geolocation) {
        return resolve(safe(localStorage.getItem('lastGeo'))); // Destek yoksa localStorage'ı dene
      }
      
      let resolved = false;
      const timer = setTimeout(() => {
          if (!resolved) {
              resolved = true;
              // Zaman aşımında localStorage'daki eski veriyi kullan
              resolve(safe(localStorage.getItem('lastGeo')));
          }
      }, 7000); // 7 saniye zaman aşımı

      navigator.geolocation.getCurrentPosition(
        (p) => {
          if (resolved) return;
          clearTimeout(timer);
          resolved = true;
          const geoData = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() };
          try {
            localStorage.setItem('lastGeo', JSON.stringify(geoData));
          } catch {}
          resolve(geoData);
        },
        () => { // İzin reddedildiğinde
          if (resolved) return;
          clearTimeout(timer);
          resolved = true;
          // İzin reddedilirse localStorage'ı dene
          resolve(safe(localStorage.getItem('lastGeo')));
        },
        { enableHighAccuracy: true, timeout: 6000 } // timeout'u promise'den kısa tut
      );
    });

    return { profile, settings, location };
  }

  const send = async (text?:string) => {
    const msg = (text ?? input).trim()
    if (!msg || busy) return
    setErr(''); setBusy(true)
    const newMsgs: Msg[] = [...msgs, { role:'user', text: msg }];
    setMsgs(newMsgs);
    setInput('');
    saveSession(sid, newMsgs);

    const context = await gather()
    const r = await fetch('/api/ai/assist', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ message: msg, context })
    }).catch(()=>null)

    if (!r) {
      setErr('Bağlantı sorunu. Lütfen tekrar deneyin.')
      setBusy(false)
      return
    }

    const j = await r.json().catch(()=>({ error:true, detail:'JSON_PARSE' }))
    const reply = [j?.reply, ...(Array.isArray(j?.nextSteps) ? j.nextSteps : [])]
      .filter(Boolean).join('\n')

    if (reply) {
      const finalMsgs = [...newMsgs, { role: 'assistant', text: reply }];
      setMsgs(finalMsgs);
      saveSession(sid, finalMsgs);
      tts(reply);
    } else {
      if(!j?.error) {
        const finalMsgs = [...newMsgs, { role: 'assistant', text: 'Şu an yanıt üretemedim. Biraz sonra tekrar deneyin.' }];
        setMsgs(finalMsgs);
        saveSession(sid, finalMsgs);
      }
    }
    if (j?.error) {
      setErr(j.detail || 'Bilinmeyen hata');
    }

    setBusy(false)
  }

  const handleTtsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setTtsOn(isChecked);
    try {
      localStorage.setItem('tts_enabled', String(isChecked));
    } catch {}
  }

  const quick = mode==='personal'
    ? ['Kanama var, ne yapmalıyım?','Nefes almakta zorlanıyorum.','Saldırı tehdidi var.','Başım dönüyor.','Bayılacak gibiyim.']
    : ['Deprem sonrası ilk adım?','Yangında ne yapmalıyım?','Selde güvenli nokta?']

  return open ? (
    <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]" onClick={onClose}>
      <div className="min-h-[100svh] flex items-center justify-center p-4">
        <div className="w-full max-w-[720px] bg-white rounded-2xl shadow-2xl overflow-hidden"
             onClick={(e)=>e.stopPropagation()}>
          {/* Başlık */}
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <div className="font-semibold text-[#0B3B7A]">
              {mode==='personal' ? 'Kişisel Yardım Asistanı' : 'Asistan'}
            </div>
           <div className="flex items-center gap-3 text-sm">
  <a
    href="tel:112"
    className="px-3 py-1.5 rounded-lg bg-[#D32F2F] text-white text-xs font-semibold"
  >
    112’yi Ara
  </a>
  <a
    href="tel:155"
    className="px-3 py-1.5 rounded-lg bg-[#0B3B7A] text-white text-xs font-semibold"
  >
    155’i Ara
  </a>
  <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600">
    {/* buradan sonrası sende ne varsa aynı kalsın */}
                    <input type="checkbox" checked={ttsOn} onChange={handleTtsChange} />
                    <span>Sesli okuma</span>
                </label>
                <button onClick={onClose} className="hover:underline text-gray-600">Kapat</button>
            </div>
          </div>

          {/* Araç çubuğu */}
           <div className="px-5 pt-3 pb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={()=>newChat()} className="px-3 py-1.5 rounded-lg bg-[#0B3B7A] text-white text-xs">Yeni sohbet</button>
                <HistoryDropdown sessions={sessions} load={loadChat} />
              </div>
           </div>

          {/* Hızlı seçenekler */}
          <div className="px-5 pt-1 pb-1 flex flex-wrap gap-2">
            {quick.map(q => (
              <button key={q} onClick={()=>send(q)}
                className="px-3 py-1.5 rounded-full bg-[#E9EEF5] text-[#0B3B7A] text-xs active:scale-95">
                {q}
              </button>
            ))}
          </div>

          {/* Hata bandı */}
          {err && (
            <div className="mx-5 my-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs">
              Asistan geçici olarak yanıt veremedi.
              <details className="mt-1 text-[11px] text-red-600/80">
                <summary>Detayı göster</summary>
                <pre className="whitespace-pre-wrap break-words">{err}</pre>
              </details>
            </div>
          )}

          {/* Mesaj listesi */}
          <div ref={scRef} className="px-4 pb-3 h-[46vh] overflow-y-auto space-y-2">
            {msgs.map((m,i)=>(
              <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line
                    ${m.role==='user'
                      ? 'bg-[#0B3B7A] text-white'
                      : 'bg-[#F6F7F9] text-[#102A43] border border-[#E7EAF0]'}
                `}>
                  {m.text}
                </div>
              </div>
            ))}
            {busy && <div className="px-3 py-2 text-sm text-gray-500">yazıyor…</div>}
          </div>

          {/* Giriş alanı */}
          <div className="p-4 border-t bg-white">
            <form
              onSubmit={(e)=>{ e.preventDefault(); send(); }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={e=>setInput(e.target.value)}
                placeholder="Kısaca durumunuzu yazın…"
                aria-label="Mesaj"
                className="flex-1 border rounded-xl px-3 py-2 text-sm focus-visible:outline-none focus:ring-2 focus:ring-[#0B3B7A]"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className={`px-4 py-2 rounded-xl text-white ${busy||!input.trim() ? 'bg-gray-300' : 'bg-[#D32F2F] active:scale-95'}`}
              >
                {busy ? 'Gönderiliyor…' : 'Gönder'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  ) : null
}
