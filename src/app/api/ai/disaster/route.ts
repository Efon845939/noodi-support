import { NextRequest, NextResponse } from 'next/server'
import { askGeminiJson } from '../_client'
export const runtime = 'nodejs';

const BASE = `
Sadece geçerli JSON üret. Başka hiçbir metin yazma. Şema:
{ "reply":"kısa, düz metin yanıt", "risk":"low|medium|high", "nextSteps":["1. ...","2. ...","3. ..."] }
`;

function systemFor(type: string) {
  const t = type.toUpperCase();
  if (t.includes('SEL')) {
    return BASE + `
KONU: SEL (taşkın). İpucu: yüksek bölgeye geç, elektrik kaynaklarından uzak dur, suya girme.
Kısa, net ve eylem odaklı yanıt ver.
`;
  }
  if (t.includes('DEPREM')) {
    return BASE + `
KONU: DEPREM. İpucu: Çök-Kapan-Tutun, sarsıntı bitene kadar güvenli yerde kal, merdiven/asansör kullanma.
`;
  }
  if (t.includes('YANGIN')) {
    return BASE + `
KONU: YANGIN. İpucu: duman alçakta hareket et, kapı sıcaksa açma, ıslak bezle ağzını-burnunu kapat.
`;
  }
  return BASE + `KONU: ${t}.`
}

export async function POST(req: NextRequest) {
  const { message, type, context } = await req.json()
  const SYSTEM = systemFor(type || 'GENEL')
  const CONTEXT = `Konum=${JSON.stringify(context?.location||{})}
Mesaj=${message||''}`
  try {
    const out = await askGeminiJson(SYSTEM, CONTEXT)
    return NextResponse.json({ ...out, error:false })
  } catch (e:any) {
    return NextResponse.json({
      reply:'Kısa süreli bir sorun oluştu.',
      risk:'low', nextSteps:[], error:true, detail:e?.message||String(e)
    }, { status:200 })
  }
}
