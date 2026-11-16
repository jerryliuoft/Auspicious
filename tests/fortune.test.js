import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFortune } from '../lib/fortune-engine.js';

const profile = { birthDate: '1990-07-15', role: 'engineer', focus: 'launch', tone: 'playful' };

test('fortune is deterministic per person and date', () => {
  const a = buildFortune(profile, new Date(2026, 10, 15));
  const b = buildFortune(profile, new Date(2026, 10, 15, 18, 30));
  assert.deepEqual(a, b);
});

test('fortune has the expected shape', () => {
  const f = buildFortune(profile, new Date(2026, 10, 15));
  assert.equal(f.yi.length, 3);
  assert.equal(f.ji.length, 2);
  assert.ok(f.tier.zh);
  assert.ok(f.hours.best);
  assert.ok(f.boosts.length === 3);
});

test('a year of fortunes: every day renders, all tiers occur, bad days get remedies', () => {
  const tiers = new Set();
  for (let i = 0; i < 366; i++) {
    const f = buildFortune(profile, new Date(2026, 0, 1 + i));
    tiers.add(f.tier.zh);
    if (f.tier.band === 'bad') assert.ok(f.remedies.length >= 2, `remedies on ${f.dateKey}`);
    if (f.relationFlags.clash) assert.ok(f.remedies.some((r) => r.includes('clashes')));
    for (const s of [...f.yi, ...f.ji, ...f.remedies]) assert.equal(typeof s, 'string');
  }
  assert.ok(tiers.size >= 5, `tiers seen: ${[...tiers].join(' ')}`);
});
