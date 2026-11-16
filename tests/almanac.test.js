import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dayCycleIndex, dayInfo, natalChart, solarYear, monthBranchIndex, relation,
  isClash, isSixHarmony, sixHarmonyOf, hourBranchOf, hourSpirit, BRANCHES,
} from '../lib/almanac.js';

test('known day pillars', () => {
  assert.equal(dayCycleIndex(1949, 10, 1), 0, '1949-10-01 is a 甲子 day');
  assert.equal(dayInfo(2000, 1, 1).pillar, '戊午');
});

test('solar year switches at 立春 (~Feb 4)', () => {
  assert.equal(solarYear(2024, 1, 20), 2023);
  assert.equal(solarYear(2024, 2, 3), 2023);
  assert.equal(solarYear(2024, 2, 5), 2024);
  assert.equal(solarYear(2024, 6, 1), 2024);
});

test('month branches follow the jie terms', () => {
  assert.equal(BRANCHES[monthBranchIndex(2024, 2, 1)].zh, '丑');
  assert.equal(BRANCHES[monthBranchIndex(2024, 2, 10)].zh, '寅');
  assert.equal(BRANCHES[monthBranchIndex(2024, 6, 15)].zh, '午');
  assert.equal(BRANCHES[monthBranchIndex(2026, 11, 15)].zh, '亥');
  assert.equal(BRANCHES[monthBranchIndex(2026, 12, 20)].zh, '子');
});

test('natal chart zodiac and day master', () => {
  const c = natalChart('1990-07-15');
  assert.equal(BRANCHES[c.yearBranch].animal, 'Horse');
  const early = natalChart('1990-01-20'); // before 立春 → Snake year
  assert.equal(BRANCHES[early.yearBranch].animal, 'Snake');
  const late = natalChart('1990-07-15', '23:30'); // after 23:00 → next day pillar
  assert.equal(late.dayStem, (c.dayStem + 1) % 10);
});

test('relations, clashes, harmonies, hours', () => {
  assert.equal(relation('wood', 'metal'), 'officer');
  assert.equal(relation('wood', 'water'), 'resource');
  assert.equal(relation('wood', 'fire'), 'output');
  assert.equal(relation('wood', 'earth'), 'wealth');
  assert.ok(isClash(0, 6));
  assert.ok(isSixHarmony(0, 1) && isSixHarmony(2, 11));
  assert.equal(sixHarmonyOf(4), 9); // 辰–酉
  assert.equal(hourBranchOf(23), 0);
  assert.equal(hourBranchOf(0), 0);
  assert.equal(hourBranchOf(10), 5); // 巳
  assert.equal(hourSpirit(0, 8).zh, '青龙'); // 子 day: 青龙 at 申
  assert.equal(hourSpirit(2, 0).zh, '青龙'); // 寅 day: 青龙 at 子
});
