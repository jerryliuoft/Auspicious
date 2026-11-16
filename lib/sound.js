// Synthesized UI sounds (no audio files). Quiet by design: this plays at work.
let ctx = null;
let enabled = true;

export function setSoundEnabled(on) { enabled = on; }

function audio() {
  if (!enabled) return null;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function noiseBuffer(a, dur, shape) {
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * shape(i / data.length);
  return buf;
}

function tone(a, freq, { type = 'sine', at = 0, attack = 0.01, decay = 0.6, gain = 0.1, detune = 0 } = {}) {
  const o = a.createOscillator(); const g = a.createGain();
  o.type = type; o.frequency.value = freq; o.detune.value = detune;
  const t0 = a.currentTime + at;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  o.connect(g).connect(a.destination);
  o.start(t0); o.stop(t0 + attack + decay + 0.05);
}

/** A quiet paper flip / whoosh. */
export function flip() {
  const a = audio(); if (!a) return;
  const dur = 0.38;
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(a, dur, (t) => Math.sin(Math.PI * Math.min(1, t * 1.5)) * (1 - t));
  const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.7;
  bp.frequency.setValueAtTime(700, a.currentTime);
  bp.frequency.exponentialRampToValueAtTime(3800, a.currentTime + dur * 0.6);
  const g = a.createGain(); g.gain.value = 0.3;
  src.connect(bp).connect(g).connect(a.destination);
  src.start();
}

/** A light tick, like a pen tap. Optional pitch for count-ups. */
export function tick(pitch = 1) {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(); const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(1500 * pitch, a.currentTime);
  o.frequency.exponentialRampToValueAtTime(900 * pitch, a.currentTime + 0.04);
  g.gain.setValueAtTime(0.06, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.06);
  o.connect(g).connect(a.destination);
  o.start(); o.stop(a.currentTime + 0.07);
}

/** Soft low impact when the seal block lands. */
export function impact() {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(); const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, a.currentTime);
  o.frequency.exponentialRampToValueAtTime(48, a.currentTime + 0.22);
  g.gain.setValueAtTime(0.32, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.3);
  o.connect(g).connect(a.destination);
  o.start(); o.stop(a.currentTime + 0.32);
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(a, 0.08, (t) => (1 - t) ** 3);
  const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
  const ng = a.createGain(); ng.gain.value = 0.18;
  src.connect(lp).connect(ng).connect(a.destination);
  src.start();
}

/** Reveal chord, colored by the day: bright for good, open for steady, soft for careful. */
export function reveal(band = 'good') {
  const a = audio(); if (!a) return;
  const chords = {
    good: [523.25, 659.25, 783.99, 1046.5],    // C major, sparkling top
    neutral: [523.25, 783.99, 1046.5],          // open fifth
    bad: [440, 523.25, 659.25],                 // A minor, gentle
  };
  (chords[band] || chords.good).forEach((f, i) => {
    tone(a, f, { type: 'triangle', at: i * 0.045, attack: 0.012, decay: band === 'bad' ? 1.1 : 1.4, gain: 0.05 });
    tone(a, f * 2, { type: 'sine', at: i * 0.045 + 0.01, attack: 0.01, decay: 0.5, gain: 0.012 });
  });
}

/** Wooden clack: a moon block landing on the altar. `strength` 0–1 (bounces are softer). */
export function clack(strength = 1) {
  const a = audio(); if (!a) return;
  const t = a.currentTime;
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(a, 0.05, (x) => (1 - x) ** 4);
  const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800 + Math.random() * 500; bp.Q.value = 3;
  const g = a.createGain(); g.gain.value = 0.5 * strength;
  src.connect(bp).connect(g).connect(a.destination);
  src.start(t);
  const o = a.createOscillator(); const og = a.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(820 + Math.random() * 120, t);
  o.frequency.exponentialRampToValueAtTime(540, t + 0.07);
  og.gain.setValueAtTime(0.16 * strength, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
  o.connect(og).connect(a.destination);
  o.start(t); o.stop(t + 0.12);
}

/** Gentle two-note chime (fixes completed, milestones). */
export function chime() {
  const a = audio(); if (!a) return;
  tone(a, 880, { type: 'sine', attack: 0.02, decay: 0.8, gain: 0.1 });
  tone(a, 1318.5, { type: 'sine', at: 0.09, attack: 0.02, decay: 0.8, gain: 0.1 });
}

/** Rising tension while holding: returns { set(p), stop(completed) }. */
export function riser() {
  const a = audio();
  if (!a) return { set() {}, stop() {} };
  const o = a.createOscillator(); const o2 = a.createOscillator(); const g = a.createGain();
  o.type = 'sine'; o2.type = 'sine';
  o.frequency.value = 180; o2.frequency.value = 270;
  g.gain.value = 0.0001;
  o.connect(g); o2.connect(g); g.connect(a.destination);
  o.start(); o2.start();
  let stopped = false;
  return {
    set(p) {
      if (stopped) return;
      const t = a.currentTime;
      o.frequency.setTargetAtTime(180 + p * 260, t, 0.03);
      o2.frequency.setTargetAtTime(270 + p * 390, t, 0.03);
      g.gain.setTargetAtTime(0.0001 + p * 0.045, t, 0.04);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      const t = a.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(0.0001, t, 0.03);
      o.stop(t + 0.2); o2.stop(t + 0.2);
    },
  };
}
