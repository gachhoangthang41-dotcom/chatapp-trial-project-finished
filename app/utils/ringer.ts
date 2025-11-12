let ringbackEl: HTMLAudioElement | null = null;
let ringtoneEl: HTMLAudioElement | null = null;
let audioCtx: AudioContext | null = null;
let osc: OscillatorNode | null = null;
let gain: GainNode | null = null;

function playFile(path: string, loop: boolean) {
  const el = new Audio(path);
  el.loop = loop;
  el.preload = 'auto';
  el.autoplay = false;
  el.crossOrigin = 'anonymous';
  el.play().catch(() => {}); // có thể bị chặn autoplay
  return el;
}

function startTone() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    osc = audioCtx.createOscillator();
    gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.value = 0.06;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
  } catch {}
}

function stopTone() {
  try {
    osc?.stop();
    osc?.disconnect();
    gain?.disconnect();
    audioCtx?.close();
  } catch {}
  osc = null; gain = null; audioCtx = null;
}

export const Ringer = {
  async playRingback() {
    this.stopRingback();
    try { ringbackEl = playFile('/sounds/ringback.mp3', true); }
    catch { startTone(); }
  },
  stopRingback() {
    try { ringbackEl?.pause(); ringbackEl && (ringbackEl.currentTime = 0); } catch {}
    ringbackEl = null;
    stopTone();
  },
  async playRingtone() {
    this.stopRingtone();
    try { ringtoneEl = playFile('/sounds/ringtone.mp3', true); }
    catch { startTone(); }
  },
  stopRingtone() {
    try { ringtoneEl?.pause(); ringtoneEl && (ringtoneEl.currentTime = 0); } catch {}
    ringtoneEl = null;
    stopTone();
  },
  async resume() {
    try { await ringbackEl?.play(); } catch {}
    try { await ringtoneEl?.play(); } catch {}
    try { await audioCtx?.resume(); } catch {}
  }
};
