import test from 'node:test';
import assert from 'node:assert/strict';
import { seasonOf, moonPhase, PENTADS, TERMS } from '../lib/nature.js';
import { QUOTES, pickQuote } from '../lib/wisdom.js';
import { buildFortune } from '../lib/fortune-engine.js';

test('data sets are complete', () => {
  assert.equal(TERMS.length, 24);
  assert.equal(PENTADS.length, 72);
  for (const p of PENTADS) assert.ok(p.zh && p.en && p.note);
  for (const q of QUOTES) assert.ok(q.zh && q.en && q.src && q.apply);
});

test('solar terms and pentads land on the right dates', () => {
  const nov15 = seasonOf(2026, 11, 15);
  assert.equal(nov15.term.zh, '立冬');
  assert.equal(nov15.pentad.zh, '地始冻');
  assert.deepEqual(nov15.termStart, { m: 11, d: 7 });
  assert.equal(seasonOf(2026, 12, 22).term.zh, '冬至');
  assert.equal(seasonOf(2026, 2, 10).term.zh, '立春');
  assert.equal(seasonOf(2026, 6, 25).term.zh, '夏至');
});

test('moon phase matches known new and full moons', () => {
  const eclipse = moonPhase(2024, 4, 8); // total solar eclipse = new moon
  assert.equal(eclipse.name, 'New moon');
  assert.ok(eclipse.illumination < 3);
  const full = moonPhase(2024, 4, 23);
  assert.equal(full.name, 'Full moon');
  assert.ok(full.illumination > 95);
});

test('quote matching prefers the day officer', () => {
  const q = pickQuote({ band: 'bad', officerIndex: 6, rel: 'output' }, () => 0);
  assert.ok(q.officers.includes(6));
});

test('every day of a year has a complete explanation', () => {
  for (let i = 0; i < 366; i++) {
    const f = buildFortune({ birthDate: '1985-03-02', role: 'sales' }, new Date(2026, 0, 1 + i));
    assert.ok(f.why.calendar.length > 60 && f.why.you.length > 40 && f.why.hook);
    assert.ok(f.nature.pentad.zh && f.nature.moon.name);
    assert.ok(f.quote.zh);
    if (f.relationFlags.clash) assert.match(f.why.you, /clash/);
  }
});
