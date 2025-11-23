export async function vibrate(ms = 120) {
  if (typeof window === 'undefined' || !window.navigator) return;
  try { navigator.vibrate?.(ms); } catch {}
}

export async function getGeo(opts: PositionOptions = { enableHighAccuracy: true, timeout: 8000 }) {
  return new Promise<GeolocationPosition | null>(resolve => {
    if (typeof window === 'undefined' || !window.navigator || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(p => resolve(p), () => resolve(null), opts);
  });
}

export function playAlarm() {
  if (typeof window === 'undefined') return;
  try {
    // Note: A real implementation would need an /alarm.mp3 file in the /public directory.
    // const el = new Audio('/alarm.mp3');
    // el.loop = false;
    // el.play().catch(() => {});
    console.log("Alarm sound would play here.");
  } catch {}
}
