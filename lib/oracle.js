// Auspicious — moon blocks (筊杯, jiaobei): the temple ritual for yes/no questions.
// Two crescent blocks are tossed. One flat + one round face up = 聖筊 (yes);
// both flat = 笑筊 (the gods laugh: ask again); both round = 陰筊 (no).
// Tradition asks for three yeses in a row before an answer is confirmed.

export const OUTCOMES = {
  yes: { zh: '聖筊', en: 'Yes', sub: 'Holy blocks' },
  laugh: { zh: '笑筊', en: 'Ask again', sub: 'Laughing blocks' },
  no: { zh: '陰筊', en: 'Not today', sub: 'Silent blocks' },
};

export const PROMPTS = [
  'A great card pull',
  'Nailing my presentation',
  'The deal closing',
  'A parking spot',
  'My code passing review',
  'A reply from them',
];

/**
 * Toss the blocks. Fair blocks give yes 50%, laugh 25%, no 25%; a lucky day
 * tilts yes up to about 56% (and a rough one down to about 46%).
 */
export function toss(luck = 50, rng = Math.random) {
  const pYes = 0.45 + 0.11 * (Math.max(0, Math.min(100, luck)) / 100);
  const r = rng();
  const kind = r < pYes ? 'yes' : r < pYes + (1 - pYes) / 2 ? 'laugh' : 'no';
  const flatFirst = rng() < 0.5;
  const faces = kind === 'yes' ? (flatFirst ? ['flat', 'round'] : ['round', 'flat'])
    : kind === 'laugh' ? ['flat', 'flat'] : ['round', 'round'];
  return { kind, faces };
}

const clean = (wish) => (wish || '').trim().replace(/[?？.!]+$/, '') || 'your wish';

const LINES = {
  yes: [
    'The blocks say yes to {w}.',
    'Heaven nods at {w}.',
    'A clear yes for {w}.',
  ],
  laugh: [
    'The gods are laughing. Maybe {w} needs a better question.',
    'A laugh from above. Rephrase and toss again.',
    'Amused, not decided. Ask about {w} once more.',
  ],
  no: [
    'Not today for {w}. Try again tomorrow, or change the question.',
    'The blocks stay quiet on {w}. Save it for a luckier day.',
    'A soft no. Give {w} some time.',
  ],
};

export function verdictLine(kind, wish, rng = Math.random) {
  const pool = LINES[kind];
  return pool[Math.floor(rng() * pool.length)].replace('{w}', `“${clean(wish)}”`);
}

/** Advance the yes-chain: three yeses in a row confirm the answer. */
export function nextChain(chain, kind) {
  if (kind !== 'yes') return { chain: 0, confirmed: false };
  const c = Math.min(3, chain + 1);
  return { chain: c, confirmed: c === 3 };
}
