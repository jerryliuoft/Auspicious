// Auspicious — particle bursts as lightweight DOM elements animated with the
// Web Animations API (compositor-friendly, no canvas, no dependencies).
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || location.search.includes('nofx');

function layerFor(host) {
  let layer = host.querySelector(':scope > .fx-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'fx-layer';
    layer.setAttribute('aria-hidden', 'true');
    host.append(layer);
  }
  return layer;
}

const PRESETS = {
  confetti: { count: 70, speed: [220, 580], gravity: 620, size: [6, 12], life: [1700, 2400], spread: Math.PI * 1.25, dir: -Math.PI / 2 },
  sparkle: { count: 22, speed: [90, 250], gravity: 260, size: [2.5, 5.5], life: [900, 1300], spread: Math.PI * 1.25, dir: -Math.PI / 2 },
  ink: { count: 14, speed: [30, 100], gravity: 520, size: [4, 9], life: [1000, 1300], spread: 1.2, dir: Math.PI / 2 },
};
const rand = ([a, b]) => a + Math.random() * (b - a);

/**
 * Burst particles from (x, y) in host coordinates.
 * kind: 'confetti' (celebration), 'sparkle' (small lift), 'ink' (quiet falling drops).
 */
export function burst(host, x, y, { kind = 'confetti', colors = ['#b4232a', '#c9a227'], count } = {}) {
  if (reduced() || !host || typeof host.animate !== 'function') return;
  const P = PRESETS[kind];
  const layer = layerFor(host);
  const n = count ?? P.count;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('i');
    const size = rand(P.size);
    const shape = kind === 'confetti' ? (Math.random() < 0.7 ? 'rect' : 'dot') : kind === 'ink' ? 'drop' : 'dot';
    el.className = `fx-p ${shape}`;
    el.style.width = `${size}px`;
    el.style.height = `${shape === 'rect' ? size * 0.6 : shape === 'drop' ? size * 1.4 : size}px`;
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.left = `${x + (Math.random() - 0.5) * 30}px`;
    el.style.top = `${y + (Math.random() - 0.5) * 16}px`;
    layer.append(el);

    const a = P.dir + (Math.random() - 0.5) * P.spread;
    const v = rand(P.speed);
    const vx = Math.cos(a) * v, vy = Math.sin(a) * v;
    const life = rand(P.life);
    const spin = (Math.random() - 0.5) * 720;
    const flutter = 2 + Math.random() * 4;
    const frames = [];
    const STEPS = 10;
    for (let s = 0; s <= STEPS; s++) {
      const p = s / STEPS;
      const t = (p * life) / 1000;
      const dx = vx * t, dy = vy * t + 0.5 * P.gravity * t * t;
      const sy = shape === 'rect' ? Math.abs(Math.cos(p * flutter * Math.PI)) * 0.85 + 0.15 : 1;
      frames.push({
        transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${(spin * p).toFixed(0)}deg) scaleY(${sy.toFixed(2)})`,
        opacity: p < 0.65 ? 1 : Math.max(0, 1 - (p - 0.65) / 0.35),
      });
    }
    const anim = el.animate(frames, { duration: life, delay: kind === 'confetti' ? Math.random() * 60 : 0, easing: 'linear', fill: 'both' });
    anim.onfinish = () => el.remove();
    anim.oncancel = () => el.remove();
  }
}

/** Center of an element in host coordinates. */
export function centerOf(el, host) {
  const r = el.getBoundingClientRect(), h = host.getBoundingClientRect();
  return { x: r.left - h.left + r.width / 2, y: r.top - h.top + r.height / 2 };
}

/** Animate a number from 0 to `to`, calling onStep with each integer; returns a promise. */
export function countUp(to, { duration = 900, onStep } = {}) {
  return new Promise((resolve) => {
    if (reduced()) { onStep?.(to, true); resolve(); return; }
    const start = performance.now();
    let last = -1;
    const timer = setInterval(() => {
      const p = Math.min(1, (performance.now() - start) / duration);
      const v = Math.round(to * (1 - (1 - p) ** 3));
      if (v !== last) { last = v; onStep?.(v, p >= 1); }
      if (p >= 1) { clearInterval(timer); resolve(); }
    }, 16);
  });
}
