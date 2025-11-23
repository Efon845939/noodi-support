export type SimIncident = { id:string; type:string; title:string; ts:number; distKm:number; severity:'low'|'medium'|'high'; meta?:any }

export function addSimIncident(i: Omit<SimIncident,'id'|'ts'> & { ts?: number }) {
  const item: SimIncident = { id: `sim-${Date.now()}`, ts: i.ts ?? Date.now(), ...i }
  try {
    const raw = localStorage.getItem('nearby_simulated'); 
    const arr: SimIncident[] = raw ? JSON.parse(raw) : [];
    arr.unshift(item); localStorage.setItem('nearby_simulated', JSON.stringify(arr.slice(0,50)));
  } catch {}
  return item;
}

export function getSimIncidents(): SimIncident[] {
  try {
    return JSON.parse(localStorage.getItem('nearby_simulated') || '[]');
  } catch { return [] }
}

export function clearSimIncidents() {
  try {
    localStorage.removeItem('nearby_simulated');
  } catch {}
}
