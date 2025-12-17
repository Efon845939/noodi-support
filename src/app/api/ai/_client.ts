const SUPPORT_SYSTEM_PROMPT = `
Sen bir ACİL DURUM İLK YARDIM asistanısın.
Uzmanlık seviyen TEMEL ve ORTA seviye ilk yardım bilgisidir ayrica namaz saatlerini de biliyorsun. Doktor, hemşire, paramedik rolü YOK. 

Görevin:
- Kullanıcıya bulunduğu duruma göre NET ve DOĞRU ilk yardım adımları vermek.
- Konudan SAPMAMAK (Kanama = kanama; nefes darlığı = nefes darlığı).
= Namaz saatlerini bilmek ve bilgini aktarmak
- Kullanıcı sormadan farklı acil durum senaryosu üretmemek.
- Cevapların 3–5 adımı geçmeyecek şekilde KISA ve NET olmalı.
- Gereksiz tekrardan kaçınmak.
- Tavsiyeler SADECE evrensel “temel ilk yardım” kılavuzlarına uygun olmalı.
- Asla tıbbi tanı koyma, ilaç önerme, derin tıbbi açıklamalar verme.
- 112 çağırılması gereken durumları sakin şekilde belirt.
- Cevap her zaman geçerli JSON formatında olmalı.

Şema:
{
  "reply": "kısa net metin",
  "intent": "FIRST_AID_INFO | STATUS_CHECK | REPORT_CREATE | ESCALATE_EMERGENCY | SMALL_TALK",
  "risk": "low | medium | high",
  "nextSteps": ["1", "2", "3 gibi adım adım yönlendirme"]
}
`;


const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error('NO_KEY: GEMINI_API_KEY yok veya okunmuyor.');

function parseStrictJson(raw: string) {
  if (!raw || !raw.trim()) throw new Error('EMPTY_RESPONSE');
  try { return JSON.parse(raw); } catch {}

  const code = raw.match(/```json([\s\S]*?)```/i)?.[1] 
            || raw.match(/```([\s\S]*?)```/)?.[1];

  if (code) try { return JSON.parse(code); } catch {}

  const i = raw.indexOf('{'); 
  const j = raw.lastIndexOf('}');
  if (i>=0 && j>i) { 
    const s = raw.slice(i, j+1); 
    try { return JSON.parse(s); } catch {} 
  }

  throw new Error('NON_JSON_RESPONSE');
}

async function fetchOnce(model:string, payload:any, ms=10000) {
  const ctrl = new AbortController(); 
  const t = setTimeout(()=>ctrl.abort(), ms);
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${API_KEY}`;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    });

    const txt = await r.text().catch(()=> '');
    return { ok:r.ok, status:r.status, txt };
  } finally {
    clearTimeout(t);
  }
}

let availableModels: string[] | null = null;
async function listAndCacheModels() {
  if (availableModels) return availableModels;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    if (!r.ok) return [];

    const { models = [] } = await r.json();

    const contentModels = (models || [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => m.name.replace('models/', ''));

    contentModels.sort((a, b) => {
      if (a.includes('flash')) return -1;
      if (b.includes('flash')) return 1;
      return 0;
    });

    availableModels = contentModels;
    console.log('[AI] Available models:', availableModels);
    return availableModels;

  } catch {
    return [];
  }
}


// ---------------------
// ASIL FONKSİYON BURADA
// ---------------------
export async function askGeminiJson(user: string) {
  const payload = {
  contents: [
    { role: "model", parts: [{ text: SUPPORT_SYSTEM_PROMPT }] },
    { role: "user", parts: [{ text: user }] }
  ]
};


  const all = await listAndCacheModels();
  if (!all.length) {
    throw new Error('NO_MODELS_AVAILABLE: Hiçbir uygun model bulunamadı.');
  }

  // Sadece hızlı model
  const lineup = ['gemini-2.5-flash-lite'];

  let lastError = 'NO_ATTEMPT';

  for (const model of lineup) {
    for (let k = 0; k < 2; k++) {
      const { ok, status, txt } =
        await fetchOnce(model, payload).catch(() => ({ ok: false, status: 0, txt: '' }));

      if (!ok) { 
        lastError = `HTTP_${status}:${txt.slice(0,180)}`; 
        await new Promise(r=>setTimeout(r, 350*(k+1))); 
        continue; 
      }

      try {
        const root = JSON.parse(txt);
        const raw  = root?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        return parseStrictJson(raw || txt);
      } catch (e:any) { 
        lastError = `PARSE:${e?.message||e} (model: ${model})`; 
      }
    }
  }

  throw new Error(lastError);
}
