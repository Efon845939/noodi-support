// src/app/api/ai/assist/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { askGeminiJson } from '../_client'
export const runtime = 'nodejs'

const SYSTEM = `
Sen bir ilk yardım ve acil durum asistanısın. Öncelikli görevin bilgi vermek ve kullanıcıyı yönlendirmektir.
Asla gerçek dünyada eylemde bulunduğunu iddia etme. Yardım gönderemez, ekip yönlendiremez veya acil servislerle iletişim kuramazsın.
Senin görevin, kullanıcıya NE YAPABİLECEĞİNİ anlatmaktır. Önemli bir detay daha, sen kullanıcılara namaz vakitlerini bildirirsin ve onlara acl durumlarda dua okumalarını önerirsin.
Kurallar:

- Müslüman kullanıcılara namaz vakitlerini bildir ve dua okumalarını öner.
- Kullanıcıyı net ve kısa bir durumda anla.
- Eğer kullanıcı acil bir tehlike altındaysa, ilk önceliğin ona 112'yi aramasını veya uygulamanın acil durum özelliklerini kullanmasını söylemektir.
- Uygulanabilir durumlarda, net ve adım adım ilk yardım talimatları sağla.
- Kullanıcının niyetini ve risk seviyesini belirlemek için mesajını analiz et.
- Cevaplarını kısa, öz ve stresli bir durumda anlaşılması kolay tut.
- Sadece geçerli JSON üretmelisin. Başka hiçbir metin yazma.

Şema:
{ "reply":"kısa, düz metin yanıt", "intent":"FIRST_AID_INFO|STATUS_CHECK|REPORT_CREATE|ESCALATE_EMERGENCY|SMALL_TALK", "risk":"low|medium|high", "nextSteps": ["string dizisi"] }
`

export async function POST(req: NextRequest) {
  const { message, context = {} } = await req.json().catch(() => ({}))
  const CONTEXT = `Profil=${JSON.stringify(context.profile || {})}
Ayarlar=${JSON.stringify(context.settings || {})}
Konum=${JSON.stringify(context.location || {})}
Mesaj=${message || ''}`

  try {
    const out = await askGeminiJson(CONTEXT)
    return NextResponse.json({ ...out, error: false })
  } catch (e: any) {
    const msg = String(e?.message || '')
    const is503 =
      msg.includes('HTTP_503') ||
      msg.includes('code": 503') ||
      msg.includes('UNAVAILABLE')

    // Özel 503 fallback
    if (is503) {
      return NextResponse.json(
        {
          reply:
            'Asistan şu anda yoğun. Birkaç dakika sonra tekrar deneyin. Gerçek acil durumda lütfen 112 Acil Çağrı hattını arayın.',
          risk: 'medium',
          nextSteps: [
            '1. Önce kendi güvenliğinizi sağlayın.',
            '2. Gerekliyse 112 Acil Çağrı’yı arayın.',
          ],
          error: true,
          detail: 'MODEL_OVERLOADED',
        },
        { status: 200 }
      )
    }

    // Diğer hatalar için kısa fallback (kanama/nefes/saldırı)
    const m = (message || '').toLowerCase()
    const rb =
      /(kanama|kanıyor)/.test(m)
        ? {
            reply:
              'Temiz bir bezle kesintisiz baskı uygulayın; uzvu mümkünse kalp seviyesinden yukarıda tutun.',
            intent: 'FIRST_AID_INFO',
            risk: 'high',
            nextSteps: [
              '1. Bez ıslanırsa üstüne yenisini koyun, eskiyi kaldırmayın.',
              '2. Şok belirtilerini izleyin (solukluk, soğuk ter, baş dönmesi).',
              '3. 112’yi arayın veya acil durum butonunu kullanın.',
            ],
          }
        : /(nefes|boğul)/.test(m)
        ? {
            reply:
              'Dik oturun, kıyafetinizi gevşetin ve temiz havaya geçin. Panik nefesi keskinleştirir, mümkün olduğunca yavaş nefes almaya çalışın.',
            intent: 'FIRST_AID_INFO',
            risk: 'high',
            nextSteps: [
              '1. Derin ve yavaş nefes almaya odaklanın.',
              '2. Astım ilacınız varsa düzenli kullandığınız şekilde uygulayın.',
              '3. Şikayet devam ederse 112’yi arayın.',
            ],
          }
        : /(saldırı|tehdit)/.test(m)
        ? {
            reply:
              'Güvenli bir çıkış noktasına yönelin; kalabalık ve aydınlık alanları tercih edin. Doğrudan çatışmaya girmekten kaçının.',
            intent: 'STATUS_CHECK',
            risk: 'high',
            nextSteps: [
              '1. Yakındakilerden yardım isteyin.',
              '2. Mümkünse polisle iletişime geçin (155).',
              '3. Güvendiğiniz birine konumunuzu paylaşın.',
            ],
          }
        : null

    return NextResponse.json(
      {
        ...(rb || {
          reply: 'Kısa süreli bir sorun oluştu. Biraz sonra tekrar deneyin.',
          risk: 'low',
          nextSteps: [],
        }),
        error: true,
        detail: 'GENERIC_FALLBACK',
      },
      { status: 200 }
    )
  }
}
