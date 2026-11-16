import test from 'node:test';
import assert from 'node:assert/strict';
import { forecastEnergy, circadian } from '../lib/energy.js';
import { buildFortune } from '../lib/fortune-engine.js';

const P = { workStart: '09:00', workEnd: '18:00' };
const meetings = [
  { from: 9, to: 10 }, { from: 10, to: 11 }, { from: 11, to: 12 },
  { from: 14, to: 15 }, { from: 15, to: 16 }, { from: 16, to: 17 },
];

test('body clock: groggy on waking, late-morning high, afternoon dip, evening decline', () => {
  assert.ok(circadian(0) < circadian(4), 'sleep inertia');
  assert.ok(circadian(7.3) < circadian(4), 'post-lunch dip');
  assert.ok(circadian(10.3) > circadian(7.3), 'second wind');
  assert.ok(circadian(15) < circadian(10.3), 'evening decline');
});

test('peak in the morning, dip after lunch for a typical day', () => {
  const f = forecastEnergy({ profile: P });
  assert.ok(f.peak.from >= 9 && f.peak.to <= 13, `peak ${f.peak.from}-${f.peak.to}`);
  assert.ok(f.dip.from >= 12.5 && f.dip.from <= 16, `dip at ${f.dip.from}`);
  assert.ok(f.peak.e > f.dip.e);
});

test('sleep, chronotype, meetings and days off move the curve the right way', () => {
  const ok = forecastEnergy({ profile: P });
  assert.ok(forecastEnergy({ profile: P, sleep: 'great' }).peak.e > ok.peak.e);
  assert.ok(forecastEnergy({ profile: P, sleep: 'poor' }).peak.e < ok.peak.e);
  const heavy = forecastEnergy({ profile: P, items: meetings });
  assert.ok(heavy.at(17) < ok.at(17) - 8, 'meetings drain');
  assert.ok(heavy.meetingDrain >= 20);
  assert.ok(forecastEnergy({ profile: P, isWorkday: false }).at(16) > ok.at(16), 'days off restore');
  const lark = forecastEnergy({ profile: { ...P, chronotype: 'lark' } });
  const owl = forecastEnergy({ profile: { ...P, chronotype: 'owl' } });
  assert.ok(lark.at(8) > owl.at(8) + 20, 'larks are up and running earlier');
  assert.ok(owl.at(21) > lark.at(21), 'owls hold up better at night');
  assert.ok(owl.wake > lark.wake);
});

test('fortune: every Do item gets energy timing where it applies, big meetings at low energy are flagged', () => {
  const day = new Date(2026, 10, 17);
  const events = [
    { title: 'Design review', start: new Date(2026, 10, 17, 16), end: new Date(2026, 10, 17, 17), allDay: false },
    { title: 'Standup', start: new Date(2026, 10, 17, 9, 30), end: new Date(2026, 10, 17, 9, 45), allDay: false },
  ];
  const f = buildFortune({ ...P, birthDate: '1990-07-15', role: 'engineer', workDays: [1, 2, 3, 4, 5] }, day, { events, sleep: 'poor' });
  assert.equal(f.yiEnergy.length, f.yi.length);
  assert.ok(f.yiEnergy.some(Boolean));
  const review = f.agenda.items.find((i) => i.title === 'Design review');
  assert.ok(review.energy < 45);
  assert.match(review.note, /energy will be low|Low energy/);
  assert.ok(f.energy.notes.some((n) => /Short on sleep/.test(n)));
});
