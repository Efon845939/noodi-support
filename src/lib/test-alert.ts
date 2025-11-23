// Basit web test alert (tarayıcıda). Native olduğunda Capacitor'a bağlayacağız.
export async function triggerTestAlertWeb({
  sound = true, vibrate = true, tts = true
}: { sound?: boolean; vibrate?: boolean; tts?: boolean } = {}) {
  // Titreşim
  try { if (vibrate && navigator.vibrate) navigator.vibrate([150, 80, 300, 80, 300]); } catch {}

  // Geliştirilmiş ses: Türkiye tarzı Hi-Lo Siren efekti
  try {
    if (sound) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      gain.gain.value = 1.0; // Sesi maksimuma çıkar (tarayıcı limiti dahilinde)
      osc.connect(gain).connect(ctx.destination);
      
      const now = ctx.currentTime;
      const highTone = 960; // Yüksek ton (Hz)
      const lowTone = 770;  // Düşük ton (Hz)
      const cycleDuration = 1.2; // Her bir ton döngüsü (sn)
      const totalDuration = 4.8; // Toplam siren süresi

      osc.frequency.setValueAtTime(lowTone, now);

      for (let i = 0; i < totalDuration / cycleDuration; i++) {
        const cycleStart = now + i * cycleDuration;
        osc.frequency.setValueAtTime(highTone, cycleStart);
        osc.frequency.setValueAtTime(lowTone, cycleStart + cycleDuration / 2);
      }

      osc.start(now);
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, totalDuration * 1000);
    }
  } catch {}

  // TTS
  try {
    if (tts && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('Bu bir test uyarısıdır. Noodi uyarıları çalışıyor.');
      const v = speechSynthesis.getVoices().find(x => /tr-|Turkish/i.test(x.lang));
      if (v) u.voice = v; u.lang = v?.lang || 'tr-TR'; u.rate = 1;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  } catch {}
}
