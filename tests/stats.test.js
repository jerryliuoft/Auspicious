import test from 'node:test';
import assert from 'node:assert/strict';
import { luckStats, nextHistory } from '../lib/stats.js';
import { buildFortune } from '../lib/fortune-engine.js';

const profile = { birthDate: '1990-07-15', role: 'engineer' };

test('luck percentile ranks days sensibly', () => {
  const great = new Date(2026, 10, 17); // 大吉
  const bad = new Date(2026, 10, 15); // 凶
  const g = luckStats(profile, great, buildFortune(profile, great));
  const b = luckStats(profile, bad, buildFortune(profile, bad));
  assert.ok(g.luck > 80, `great day luck ${g.luck}`);
  assert.ok(b.luck < 25, `bad day luck ${b.luck}`);
  assert.ok(g.oneIn >= 8 && g.rare);
});

test('streak counts consecutive days ending today', () => {
  let h = nextHistory([], '2026-11-13');
  h = nextHistory(h.history, '2026-11-14');
  h = nextHistory(h.history, '2026-11-15');
  assert.equal(h.streak, 3);
  const gap = nextHistory(['2026-11-10', '2026-11-11'], '2026-11-15');
  assert.equal(gap.streak, 1);
  assert.equal(gap.total, 3);
  assert.equal(nextHistory(h.history, '2026-11-15').streak, 3, 'idempotent');
});
