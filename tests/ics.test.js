process.env.TZ = 'America/Los_Angeles'; // make local-day boundaries deterministic

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseICS, eventsOn, wallToDate } from '../lib/ics.js';

const records = parseICS(readFileSync(new URL('./fixtures/sample.ics', import.meta.url), 'utf8'));
const titlesOn = (y, m, d) => eventsOn(records, new Date(y, m - 1, d)).map((e) => e.title);
const hhmm = (dt) => `${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`;

test('parses all events and unescapes text', () => {
  assert.equal(records.length, 10);
  assert.ok(records.some((r) => r.title === 'Design review, Q1 roadmap'));
});

test('time zones convert correctly', () => {
  const t = wallToDate({ y: 2026, m: 11, d: 17, h: 9, mi: 30 }, 'America/New_York');
  assert.equal(hhmm(t), '6:30'); // 9:30 New York = 6:30 Los Angeles
});

test('Tuesday Nov 17: recurring, moved, monthly, single, cancelled', () => {
  const ev = eventsOn(records, new Date(2026, 10, 17));
  const titles = ev.map((e) => e.title);
  assert.deepEqual(titles, [
    'Team standup (moved)', '1:1 with Dana', 'Vendor contract negotiation',
    'Monthly all-hands', 'Biweekly retro', 'Design review, Q1 roadmap',
  ]);
  assert.equal(hhmm(ev[0].start), '10:00');
  assert.ok(!titles.includes('Team standup'), 'original instance replaced by the moved one');
  assert.ok(!titles.includes('Cancelled sync'));
  assert.equal(hhmm(ev[5].end), '17:00', 'DURATION applied');
});

test('UTC times, EXDATE, COUNT, all-day', () => {
  const mon = eventsOn(records, new Date(2026, 10, 16));
  const planning = mon.find((e) => e.title === 'Sprint planning');
  assert.equal(hhmm(planning.start), '9:00'); // 17:00Z = 9:00 PST
  assert.ok(!titlesOn(2026, 11, 18).includes('Team standup'), 'EXDATE skips Wednesday');
  assert.ok(titlesOn(2026, 12, 1).includes('Biweekly retro'), 'third occurrence (Nov 3, 17, Dec 1)');
  assert.ok(!titlesOn(2026, 12, 15).includes('Biweekly retro'), 'COUNT=3 stops after Dec 1');
  const fri = eventsOn(records, new Date(2026, 10, 20));
  assert.ok(fri.some((e) => e.allDay && e.title === 'Out of office'));
  assert.equal(titlesOn(2026, 11, 21).includes('Out of office'), false, 'all-day ends at midnight');
  assert.equal(titlesOn(2026, 11, 15).length, 0, 'Sunday is empty');
});
