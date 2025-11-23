export const runtime = 'nodejs';
export async function GET() {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('NO_KEY');
    const r = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
    const j = await r.json();
    return new Response(JSON.stringify({ ok:true, count:j?.models?.length||0, sample:(j?.models||[]).slice(0,5).map((m:any)=>m.name) }), { status: 200 });
  } catch(e:any) {
    return new Response(JSON.stringify({ ok:false, error: e?.message||String(e) }), { status: 200 });
  }
}
