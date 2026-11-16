process.env.TZ = 'America/Los_Angeles';

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseICS, eventsOn } from '../lib/ics.js';
import { buildAgenda } from '../lib/agenda.js';
import { buildFortune } from '../lib/fortune-engine.js';

const records = parseICS(readFileSync(new URL('./fixtures/sample.ics', import.meta.url), 'utf8'));
const profile = { birthDate: '1990-07-15', role: 'engineer', workStart: '09:00', workEnd: '18:00', workDays: [1, 2, 3, 4, 5] };
const at = (h) => new Date(2026, 10, 16, Math.floor(h), Math.round((h % 1) * 60));
const ev = (title, h1, h2) => ({ title, start: at(h1), end: at(h2), allDay: false });
const hours = {
  best: { branch: 7, from: 13, to: 15 },
  caution: { branch: 9, from: 17, to: 19 },
  all: [
    { branch: 7, spirit: { zh: '明堂', good: true }, score: 6 },
    { branch: 9, spirit: { zh: '朱雀', good: false }, score: -3 },
    { branch: 5, spirit: { zh: '天牢', good: false }, score: -3 },
    { branch: 6, spirit: { zh: '金匮', good: true }, score: 3 },
  ],
};

test('flags meetings that clash with today’s almanac guidance', () => {
  const a = buildAgenda({
    events: [ev('Vendor contract negotiation', 14, 15)], hours, yiKeys: ['review'], jiKeys: ['negotiate', 'deploy'],
    real: null, profile, isWorkday: true,
  });
  assert.equal(a.items[0].flagged, true);
  assert.equal(a.items[0].quality, 'best');
  assert.match(a.doItem, /Over-prepare for “Vendor contract negotiation”/);
  assert.match(a.insights[0], /advises against negotiating/);
});

test('careful hours, focus block, heavy days, back-to-back, weather breaks', () => {
  const events = [
    ev('Standup', 9, 9.25), ev('Sprint planning', 9.25, 10.5), ev('Design sync', 10.5, 11.5),
    ev('Partner call', 17, 18), ev('Roadmap review', 11.5, 12.5), ev('Hiring loop', 15.5, 16.5),
  ];
  const a = buildAgenda({
    events, hours, yiKeys: ['plan'], jiKeys: [], profile, isWorkday: true,
    real: { verdict: 'great', window: { from: 13, to: 15 } },
  });
  assert.equal(a.items.find((i) => i.title === 'Partner call').quality, 'careful');
  assert.match(a.items.find((i) => i.title === 'Sprint planning').note, /Well timed/);
  assert.deepEqual(a.focus, { from: 12.5, to: 15.5 });
  assert.equal(a.load, 'heavy');
  assert.equal(a.skipItem, 'Accepting new meetings today');
  assert.ok(a.insights.some((s) => /back to back/.test(s)));
});

test('empty and out-of-office days', () => {
  const empty = buildAgenda({ events: [], hours, yiKeys: [], jiKeys: [], real: null, profile, isWorkday: true });
  assert.match(empty.insights[0], /No meetings/);
  const ooo = buildFortune(profile, new Date(2026, 10, 20), { events: eventsOn(records, new Date(2026, 10, 20)) });
  assert.equal(ooo.ooo, true);
  assert.equal(ooo.isWorkday, false, 'out of office overrides the work schedule');
  assert.match(ooo.agenda.insights[0], /out of office/);
  assert.match(ooo.agenda.insights[1], /still on your calendar/);
  assert.equal(ooo.agenda.focus, null, 'no deep-work advice on a day off');
  assert.equal(ooo.agenda.doItem, null);
});

test('the real sample calendar produces a full agenda', () => {
  const day = new Date(2026, 10, 17);
  const f = buildFortune(profile, day, { events: eventsOn(records, day) });
  assert.equal(f.agenda.items.length, 6);
  assert.ok(f.agenda.focus);
  assert.ok(f.agenda.insights.length >= 1);
  assert.ok(f.yi.length === 3 && f.ji.length >= 1);
});
