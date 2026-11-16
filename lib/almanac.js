// Auspicious — almanac calculations (Tong Shu / 黄历 essentials).
// Pure functions, no DOM or chrome APIs, so they can be unit-tested in Node.

export const STEMS = [
  { zh: '甲', py: 'Jia', element: 'wood', yin: false },
  { zh: '乙', py: 'Yi', element: 'wood', yin: true },
  { zh: '丙', py: 'Bing', element: 'fire', yin: false },
  { zh: '丁', py: 'Ding', element: 'fire', yin: true },
  { zh: '戊', py: 'Wu', element: 'earth', yin: false },
  { zh: '己', py: 'Ji', element: 'earth', yin: true },
  { zh: '庚', py: 'Geng', element: 'metal', yin: false },
  { zh: '辛', py: 'Xin', element: 'metal', yin: true },
  { zh: '壬', py: 'Ren', element: 'water', yin: false },
  { zh: '癸', py: 'Gui', element: 'water', yin: true },
];

export const BRANCHES = [
  { zh: '子', animal: 'Rat', emoji: '🐀', element: 'water', hours: [23, 1] },
  { zh: '丑', animal: 'Ox', emoji: '🐂', element: 'earth', hours: [1, 3] },
  { zh: '寅', animal: 'Tiger', emoji: '🐅', element: 'wood', hours: [3, 5] },
  { zh: '卯', animal: 'Rabbit', emoji: '🐇', element: 'wood', hours: [5, 7] },
  { zh: '辰', animal: 'Dragon', emoji: '🐉', element: 'earth', hours: [7, 9] },
  { zh: '巳', animal: 'Snake', emoji: '🐍', element: 'fire', hours: [9, 11] },
  { zh: '午', animal: 'Horse', emoji: '🐎', element: 'fire', hours: [11, 13] },
  { zh: '未', animal: 'Goat', emoji: '🐐', element: 'earth', hours: [13, 15] },
  { zh: '申', animal: 'Monkey', emoji: '🐒', element: 'metal', hours: [15, 17] },
  { zh: '酉', animal: 'Rooster', emoji: '🐓', element: 'metal', hours: [17, 19] },
  { zh: '戌', animal: 'Dog', emoji: '🐕', element: 'earth', hours: [19, 21] },
  { zh: '亥', animal: 'Pig', emoji: '🐖', element: 'water', hours: [21, 23] },
];

// 建除十二神 — the Twelve Day Officers.
export const OFFICERS = [
  { zh: '建', en: 'Establish' }, { zh: '除', en: 'Remove' }, { zh: '满', en: 'Full' },
  { zh: '平', en: 'Balance' }, { zh: '定', en: 'Stable' }, { zh: '执', en: 'Grasp' },
  { zh: '破', en: 'Break' }, { zh: '危', en: 'Danger' }, { zh: '成', en: 'Success' },
  { zh: '收', en: 'Receive' }, { zh: '开', en: 'Open' }, { zh: '闭', en: 'Close' },
];

// 黄道/黑道 hour spirits, in order starting from 青龙.
export const HOUR_SPIRITS = [
  { zh: '青龙', en: 'Azure Dragon', good: true },
  { zh: '明堂', en: 'Bright Hall', good: true },
  { zh: '天刑', en: 'Heavenly Punishment', good: false },
  { zh: '朱雀', en: 'Vermilion Bird', good: false },
  { zh: '金匮', en: 'Golden Coffer', good: true },
  { zh: '天德', en: 'Heavenly Virtue', good: true },
  { zh: '白虎', en: 'White Tiger', good: false },
  { zh: '玉堂', en: 'Jade Hall', good: true },
  { zh: '天牢', en: 'Heavenly Prison', good: false },
  { zh: '玄武', en: 'Black Tortoise', good: false },
  { zh: '司命', en: 'Life Keeper', good: true },
  { zh: '勾陈', en: 'Hook Array', good: false },
];

export const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'];
const mod = (n, m) => ((n % m) + m) % m;

/** Element that `e` produces (wood → fire → earth → metal → water → wood). */
export const produces = (e) => ELEMENTS[mod(ELEMENTS.indexOf(e) + 1, 5)];
/** Element that produces `e`. */
export const producedBy = (e) => ELEMENTS[mod(ELEMENTS.indexOf(e) - 1, 5)];
/** Element that `e` controls (wood → earth → water → fire → metal → wood). */
export const controls = (e) => ELEMENTS[mod(ELEMENTS.indexOf(e) + 2, 5)];

/**
 * Relationship of `other` element to the day master `self` (simplified Ten Gods):
 * 'peer' 比劫, 'output' 食伤, 'wealth' 财, 'officer' 官杀, 'resource' 印.
 */
export function relation(self, other) {
  if (self === other) return 'peer';
  if (produces(self) === other) return 'output';
  if (controls(self) === other) return 'wealth';
  if (controls(other) === self) return 'officer';
  return 'resource';
}

/** Julian Day Number for a civil (proleptic Gregorian) date. */
export function jdn(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4)
    - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

/** Sexagenary index (0 = 甲子) of a civil date's day pillar. */
export function dayCycleIndex(y, m, d) {
  return mod(jdn(y, m, d) + 49, 60);
}

/** Apparent solar ecliptic longitude in degrees for a Julian Date (low precision, ~0.01°). */
export function solarLongitude(jd) {
  const n = jd - 2451545.0;
  const L = mod(280.460 + 0.9856474 * n, 360);
  const g = (mod(357.528 + 0.9856003 * n, 360) * Math.PI) / 180;
  return mod(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g), 360);
}

/**
 * Solar-month branch index for a civil date. Solar months begin at the 12 "jie" terms
 * (立春 at 315° begins the 寅 month). The day on which a term falls counts as the new
 * month, so the longitude is sampled at the end of that day in China time (UTC+8).
 */
export function monthBranchIndex(y, m, d) {
  const jd = jdn(y, m, d) - 0.5 + (23.99 - 8) / 24;
  const lon = solarLongitude(jd);
  const monthFromYin = Math.floor(mod(lon - 315, 360) / 30); // 0 = 寅 month
  return mod(2 + monthFromYin, 12);
}

/** Solar-year (立春-based) year number for a civil date, as used by BaZi. */
export function solarYear(y, m, d) {
  if (m <= 2) {
    const lon = solarLongitude(jdn(y, m, d) - 0.5 + (12 - 8) / 24);
    if (lon < 315 && lon > 250) return y - 1;
  }
  return y;
}

export const yearBranchIndex = (solarYr) => mod(solarYr - 4, 12);
export const yearStemIndex = (solarYr) => mod(solarYr - 4, 10);

/** Twelve Day Officer index for a date. */
export function officerIndex(y, m, d) {
  const dayBranch = dayCycleIndex(y, m, d) % 12;
  return mod(dayBranch - monthBranchIndex(y, m, d), 12);
}

export const isClash = (a, b) => mod(a - b, 12) === 6;
export const isSixHarmony = (a, b) => mod(a + b, 12) === 1;
export const isThreeHarmony = (a, b) => a !== b && mod(a - b, 4) === 0;
/** The 六合 partner of a branch. */
export const sixHarmonyOf = (b) => mod(1 - b, 12);

/** Hour branch index for a clock hour (0–23). 23:00 belongs to 子. */
export const hourBranchOf = (hour) => Math.floor(mod(hour + 1, 24) / 2);

/** Hour spirit (黄道/黑道) for a given day branch and hour branch. */
export function hourSpirit(dayBranch, hourBranch) {
  const start = mod(8 + 2 * (dayBranch % 6), 12); // branch where 青龙 sits
  return HOUR_SPIRITS[mod(hourBranch - start, 12)];
}

/**
 * Personal chart essentials from a birth date (and optional "HH:MM" time).
 * BaZi days begin at 23:00, so a late-night birth uses the next day's pillar.
 */
export function natalChart(birthDate, birthTime) {
  const [y, m, d] = birthDate.split('-').map(Number);
  let dy = y, dm = m, dd = d;
  let hourBranch = null;
  if (birthTime) {
    const hour = Number(birthTime.split(':')[0]);
    hourBranch = hourBranchOf(hour);
    if (hour >= 23) {
      const next = new Date(Date.UTC(y, m - 1, d + 1));
      dy = next.getUTCFullYear(); dm = next.getUTCMonth() + 1; dd = next.getUTCDate();
    }
  }
  const sYear = solarYear(y, m, d);
  const dayIdx = dayCycleIndex(dy, dm, dd);
  const dayStem = dayIdx % 10;
  return {
    yearBranch: yearBranchIndex(sYear),
    yearStem: yearStemIndex(sYear),
    dayStem,
    dayBranch: dayIdx % 12,
    dayMaster: STEMS[dayStem].element,
    hourBranch,
  };
}

/** Almanac facts for a civil date (not personalized). */
export function dayInfo(y, m, d) {
  const idx = dayCycleIndex(y, m, d);
  const dayStem = idx % 10;
  const dayBranch = idx % 12;
  return {
    cycleIndex: idx,
    dayStem,
    dayBranch,
    stem: STEMS[dayStem],
    branch: BRANCHES[dayBranch],
    pillar: STEMS[dayStem].zh + BRANCHES[dayBranch].zh,
    monthBranch: monthBranchIndex(y, m, d),
    officerIndex: officerIndex(y, m, d),
    officer: OFFICERS[officerIndex(y, m, d)],
    clashBranch: mod(dayBranch + 6, 12),
  };
}
