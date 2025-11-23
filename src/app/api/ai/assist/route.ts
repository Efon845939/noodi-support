import { NextRequest, NextResponse } from 'next/server'
import { askGeminiJson } from '../_client'
export const runtime = 'nodejs';

const SYSTEM = `
Sen bir ilk yardım ve acil durum asistanısın. Öncelikli görevin bilgi vermek ve kullanıcıyı yönlendirmektir.
Asla gerçek dünyada eylemde bulunduğunu iddia etme. Yardım gönderemez, ekip yönlendiremez veya acil servislerle iletişim kuramazsın.
Senin görevin, kullanıcıya NE YAPABİLECEĞİNİ anlatmaktır.

- Eğer kullanıcı acil bir tehlike altındaysa, ilk önceliğin ona 112'yi aramasını veya uygulamanın acil durum özelliklerini kullanmasını söylemektir.
- Uygulanabilir durumlarda, net ve adım adım ilk yardım talimatları sağla.
- Kullanıcının niyetini ve risk seviyesini belirlemek için mesajını analiz et.
- Cevaplarını kısa, öz ve stresli bir durumda anlaşılması kolay tut.
- Sadece geçerli JSON üretmelisin. Başka hiçbir metin yazma.

Şema:
{ "reply":"kısa, düz metin yanıt", "intent":"FIRST_AID_INFO|STATUS_CHECK|REPORT_CREATE|ESCALATE_EMERGENCY|SMALL_TALK", "risk":"low|medium|high", "nextSteps": ["string dizisi"] }
`;

export async function POST(req: NextRequest) {
  const { message, context={} } = await req.json().catch(()=>({}));
  const CONTEXT = `Profil=${JSON.stringify(context.profile||{})}
Ayarlar=${JSON.stringify(context.settings||{})}
Konum=${JSON.stringify(context.location||{})}
Mesaj=${message||''}`;
  try {
    const out = await askGeminiJson(CONTEXT);
    return NextResponse.json({ ...out, error:false });
  } catch (e:any) {
    // Kısa ama faydalı fallback (kanama/nefes/saldırı)
    const m = (message||'').toLowerCase();
    const rb =
      /(kanama|kanıyor)/.test(m) ? {
        reply:'Temiz bir bezle kesintisiz baskı uygulayın; uzvu yukarıda tutun.',
        intent:'FIRST_AID_INFO', risk:'high',
        nextSteps:['1. Bez ıslanırsa üstüne yenisini koyun.','2. Şok belirtilerini izleyin.','3. 112’yi arayın veya Acil Yardım’a basın.']
      } :
      /(nefes|boğul)/.test(m) ? {
        reply:'Dik oturun, kıyafeti gevşetin; temiz havaya geçin.',
        intent:'FIRST_AID_INFO', risk:'high',
        nextSteps:['1. Derin ve yavaş nefes alın.','2. Astım ilacınız varsa uygulayın.','3. Kötüleşirse 112.']
      } :
      /(saldırı|tehdit)/.test(m) ? {
        reply:'Güvenli çıkışa yönelin; kalabalık ve aydınlık alan seçin.',
        intent:'STATUS_CHECK', risk:'high',
        nextSteps:['1. Yakındakilerden yardım isteyin.','2. Mümkünse polisle iletişime geçin.','3. Konumunuzu paylaşın.']
      } : null;

    return NextResponse.json({
      ...(rb || { reply:'Kısa süreli bir sorun oluştu.', risk:'low', nextSteps:[] }),
      error:true, detail:e?.message||String(e)
    }, { status:200 });
  }
}
