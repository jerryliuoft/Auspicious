// Auspicious — combines almanac facts + the user's profile into a daily fortune.
// Deterministic: the same person on the same date always gets the same page.
import {
  BRANCHES, dayInfo, natalChart, relation, producedBy, produces, hourSpirit,
  isClash, isSixHarmony, isThreeHarmony, sixHarmonyOf,
} from './almanac.js';
import {
  OFFICER_CONTENT, OFFICER_REMEDIES, THEMES, ELEMENT_INFO, TIERS, INTROS,
  FOCUS_LINES, phrase,
} from './content.js';
import { seasonOf, moonPhase, TERMS } from './nature.js';
import {
  assessWeather, weatherDo, weatherSkip, weatherHeadline, weatherWhy, fmtTemp, fmtClock,
} from './weather.js';
import { pickQuote } from './wisdom.js';
import { buildWhy } from './explain.js';
import { buildAgenda, OOO_RE } from './agenda.js';
import { forecastEnergy, DEEP, LIGHT, HARD_MEETINGS } from './energy.js';

export const DEFAULT_PROFILE = {
  birthDate: '',
  birthTime: '',
  role: 'general',
  workStart: '09:00',
  workEnd: '18:00',
  workDays: [1, 2, 3, 4, 5],
  focus: 'none',
  desk: '',
  tone: 'traditional',
  chronotype: 'neutral',
  wakeTime: '',
};

export const dateKey = (dt) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

function hashString(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function pickN(rng, arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

const fmtHour = (h) => `${((h % 24) + 24) % 24}:00`;
const toHour = (hhmm) => Number((hhmm || '0').split(':')[0]);

/** Pick the best and the riskiest double-hours, preferring the user's work window. */
function luckyHours(day, natal, luckyElement, profile) {
  const start = toHour(profile.workStart);
  const end = Math.max(toHour(profile.workEnd), start + 1);
  const candidates = [];
  for (let b = 0; b < 12; b++) {
    const [from, to] = BRANCHES[b].hours;
    const spirit = hourSpirit(day.dayBranch, b);
    const fromN = b === 0 ? -1 : from; // 子 spans midnight
    const inWork = fromN < end && to > start;
    let score = spirit.good ? 3 : -3;
    if (isClash(b, natal.yearBranch)) score -= 4;
    if (isClash(b, day.dayBranch)) score -= 4; // hour that breaks the day itself (日破时)
    if (isSixHarmony(b, natal.yearBranch)) score += 2;
    if (isThreeHarmony(b, natal.yearBranch)) score += 1;
    if (BRANCHES[b].element === luckyElement) score += 1;
    candidates.push({
      branch: b, zh: BRANCHES[b].zh, animal: BRANCHES[b].animal, spirit,
      label: `${fmtHour(from)}–${fmtHour(to)}`, from, to, inWork, score,
    });
  }
  const work = candidates.filter((c) => c.inWork);
  const sorted = (list) => [...list].sort((a, b) => b.score - a.score);
  let best = sorted(work.filter((c) => c.spirit.good && c.score > 0))[0];
  let bestOutside = false;
  if (!best) { best = sorted(candidates.filter((c) => c.spirit.good))[0]; bestOutside = true; }
  const caution = sorted(work.filter((c) => !c.spirit.good)).reverse()[0] || null;
  return { best, bestOutside, caution, all: candidates };
}

export function buildFortune(profile, now = new Date(), opts = {}) {
  const p = { ...DEFAULT_PROFILE, ...profile };
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  const key = dateKey(now);
  const rng = mulberry32(hashString(`${p.birthDate}|${p.birthTime}|${key}`));

  const day = dayInfo(y, m, d);
  const natal = natalChart(p.birthDate, p.birthTime || null);
  const officerText = OFFICER_CONTENT[day.officerIndex];
  const rel = relation(natal.dayMaster, day.stem.element);
  const theme = THEMES[rel];

  const userAnimal = BRANCHES[natal.yearBranch];
  const clash = isClash(day.dayBranch, natal.yearBranch);
  const harmony = isSixHarmony(day.dayBranch, natal.yearBranch);
  const trine = isThreeHarmony(day.dayBranch, natal.yearBranch);

  let score = officerText.base + theme.score;
  if (clash) score -= 3;
  if (harmony) score += 1;
  if (trine) score += 1;
  const almanacScore = score;
  const almanacTier = TIERS.find((t) => almanacScore >= t.min);

  // Real life outranks tradition: today's actual weather adjusts the reading.
  const weekday = now.getDay();
  // Real calendar first: an out-of-office day is a day off whatever the work schedule says.
  const events = Array.isArray(opts.events) ? opts.events : null;
  const ooo = !!events?.some((e) => e.allDay && OOO_RE.test(e.title));
  const isWorkday = p.workDays.includes(weekday) && !ooo;
  const real = assessWeather(opts.weather, key, p, isWorkday);
  if (real) score += real.mod;
  const tier = TIERS.find((t) => score >= t.min);

  // Favourable element: support a pressured or drained day master, otherwise channel it.
  let luckyElement;
  if (rel === 'officer' || rel === 'output' || rel === 'wealth') luckyElement = producedBy(natal.dayMaster);
  else if (rel === 'resource') luckyElement = natal.dayMaster;
  else luckyElement = produces(natal.dayMaster);
  const el = ELEMENT_INFO[luckyElement];
  const luckyColor = pick(rng, el.colors);
  const luckyItem = pick(rng, el.items);

  const hours = luckyHours(day, natal, luckyElement, p);

  const yiKeys = pickN(rng, officerText.yi, 3);
  const jiKeys = pickN(rng, officerText.ji, 2);
  if (clash && !jiKeys.includes('confront')) jiKeys[jiKeys.length - 1] = 'confront';
  let yi = yiKeys.map((k) => phrase(k, p.role));
  let ji = jiKeys.map((k) => phrase(k, p.role));
  const wDo = weatherDo(real, isWorkday);
  const wSkip = weatherSkip(real);
  const agenda = events ? buildAgenda({ events, hours, yiKeys, jiKeys, real, profile: p, isWorkday }) : null;
  // Real life leads: weather and calendar items first, at least one almanac item kept.
  const almanacYi = yi, almanacJi = ji;
  yi = [...[wDo, agenda?.doItem].filter(Boolean), ...almanacYi].slice(0, 3);
  const yiKinds = [...(wDo ? ['weather'] : []), ...(agenda?.doItem ? [agenda.doKind] : []), ...yiKeys].slice(0, 3);

  // Energy forecast, then time every suggestion and meeting against it.
  const energy = forecastEnergy({ profile: p, sleep: opts.sleep || 'ok', items: agenda?.items || [], real, isWorkday });
  const span = (w) => `${fmtClock(w.from).replace(':00', '')}–${fmtClock(w.to).replace(':00', '')}`;
  const yiEnergy = yiKinds.map((k) => {
    if (k === 'weather') return real?.window && energy.dip && real.window.from < energy.dip.to && real.window.to > energy.dip.from ? 'Daylight recharges your afternoon dip' : null;
    if (k === 'focus' && agenda?.focus) {
      const e = energy.avg(agenda.focus.from, agenda.focus.to);
      return e >= 65 ? `High energy then (≈${e})` : e < 45 ? `Energy runs low then (≈${e}): start with the easiest part` : `Energy ≈${e} then`;
    }
    if (k === 'conflict' && agenda?.conflictAt != null) return `Energy ≈${energy.at(agenda.conflictAt)} at that time`;
    if (DEEP.has(k) && energy.peak) return `Best at your peak, ${span(energy.peak)}`;
    if (LIGHT.has(k) && energy.dip) return `Fits your ${span(energy.dip)} dip`;
    return null;
  });
  if (agenda) {
    for (const it of agenda.items) {
      it.energy = energy.at(it.from);
      if (HARD_MEETINGS.has(it.type) && it.energy < 45 && it.tone !== 'warn') {
        it.note = it.tone === 'good'
          ? `Well timed for the almanac, but your energy will be low (≈${it.energy}). Prep notes and grab water first.`
          : `Low energy (≈${it.energy}) for a big meeting. Prep notes and grab water first.`;
        it.tone = 'warn';
      }
    }
  }
  const energyNotes = [];
  if (energy.peak) energyNotes.push(`Peaks ${span(energy.peak)} (≈${energy.peak.e}). Save your hardest work for then.`);
  if (energy.dip) energyNotes.push(`Dips ${span(energy.dip)} (≈${energy.dip.e}). Good for routine tasks or a short walk.`);
  if (energy.meetingDrain >= 10) energyNotes.push(`Meetings will take about ${energy.meetingDrain} points out of you today.`);
  if (energy.sleep === 'poor') energyNotes.push('Short on sleep: expect less in the tank all day. Push big decisions to tomorrow if you can.');
  if (energy.sleep === 'great') energyNotes.push('Well rested: you have more reserve than usual.');
  ji = [...[agenda?.skipItem, wSkip].filter(Boolean).slice(0, 1), ...almanacJi].slice(0, 2);

  let deskNote = `Face ${el.direction} for important calls.`;
  if (p.desk && p.desk === el.direction) deskNote = `Your desk already faces ${el.direction}. Lean into it today.`;
  else if (p.desk) deskNote = `Your desk faces ${p.desk}. Angle your chair toward ${el.direction} for important calls.`;

  // Remedies (化解) for weak spots, boosts (开运) for strong days.
  const remedies = [];
  if (clash) {
    const ally = BRANCHES[sixHarmonyOf(day.dayBranch)];
    const article = /^[AEIOU]/.test(ally.animal) ? 'an' : 'a';
    remedies.push(`Today’s ${day.branch.animal} clashes with your ${userAnimal.animal}. Put ${article} ${ally.animal} ${ally.emoji} near your screen (a figurine, sticker, or wallpaper). It is the ${day.branch.animal}’s ally and calms the clash.`);
  }
  if (rel === 'officer') {
    remedies.push(`Today’s ${ELEMENT_INFO[day.stem.element].name} pressures your ${ELEMENT_INFO[natal.dayMaster].name} nature. ${el.name} turns pressure into support: wear ${luckyColor} or keep ${luckyItem} on your desk.`);
  }
  if (OFFICER_REMEDIES[day.officerIndex]) remedies.push(...pickN(rng, OFFICER_REMEDIES[day.officerIndex], 2));
  if (hours.best && (clash || tier.band === 'bad')) {
    remedies.push(`Move your riskiest task to ${hours.best.label} (${hours.best.zh} hour, ${hours.best.spirit.en}).`);
  }
  const needsRemedy = remedies.length > 0 || tier.band === 'bad';
  if (needsRemedy && remedies.length < 3) {
    remedies.push(`Before your most important meeting, face ${el.direction} and take three slow breaths.`);
  }
  if (needsRemedy && remedies.length < 3) remedies.push('Clear your desk surface. Clutter traps stagnant energy.');

  const almanacTask = almanacYi[0];
  const boosts = [
    `Wear something ${luckyColor} to amplify today’s ${el.name} luck.`,
    hours.best ? `Do “${almanacTask.toLowerCase()}” during ${hours.best.label}.` : `Do “${almanacTask.toLowerCase()}” early.`,
    `Keep ${luckyItem} within reach.`,
  ];
  if (real && (real.verdict === 'great' || real.verdict === 'fair')) {
    const daylight = `Get ten minutes of daylight before your hardest task. The sun sets at ${fmtClock(real.sunset)}.`;
    boosts.unshift(daylight);
    boosts.length = 3;
    if (needsRemedy) remedies.unshift('Take your hardest thinking on a walk outside. Good weather is today’s best remedy.');
  }

  const season = seasonOf(y, m, d);
  const moon = moonPhase(y, m, d);
  const quote = pickQuote({ band: tier.band, officerIndex: day.officerIndex, rel }, rng);
  const why = buildWhy({
    day, natal, rel, flags: { clash, harmony, trine }, hours, season, gist: officerText.gist,
  });

  // Real-life explanation and how it changed the almanac's reading.
  const units = opts.units || 'c';
  if (real) {
    const moved = tier.zh !== almanacTier.zh;
    const dir = real.mod > 0 ? 'lift' : 'lower';
    why.verdict = moved
      ? `On its own, the almanac reads ${almanacTier.zh} ${almanacTier.en}. Real conditions ${dir} it to ${tier.zh} ${tier.en}.`
      : `The almanac reads ${almanacTier.zh} ${almanacTier.en}, and real conditions ${real.mod === 0 ? 'don’t change that' : 'keep it there'}.`;
    why.outside = weatherWhy(real, units, almanacTier.band);
    if (real.verdict !== 'ok') why.hook = `${real.cond.label}, ${fmtTemp(real.tmax, units)} · ${why.hook.split(' · ')[0]}`;
  }
  // Southern Hemisphere: the old calendar's seasons run opposite.
  const southern = typeof opts.lat === 'number' && opts.lat < 0;
  const localTerm = southern ? TERMS[(season.termIndex + 12) % 24] : null;
  let pentadReality = null;
  if (southern) pentadReality = `These signs describe northern China. Where you are, it’s the ${localTerm.en} season.`;
  else if (real) {
    const wintry = season.termIndex >= 18 || season.termIndex === 0;
    const summery = season.termIndex >= 6 && season.termIndex <= 11;
    if (wintry && real.tmax >= 15) pentadReality = `Here it’s ${fmtTemp(real.tmax, units)}, so read this one as poetry rather than a forecast.`;
    else if (summery && real.tmax <= 12) pentadReality = `Here it’s only ${fmtTemp(real.tmax, units)}, so read this one as poetry rather than a forecast.`;
  }

  const almanacIntro = pick(rng, INTROS[p.tone] ? INTROS[p.tone][tier.band] : INTROS.traditional[tier.band]);
  return {
    why,
    real,
    units,
    almanacTier,
    nature: { ...season, moon, localTerm, pentadReality },
    quote,
    dateKey: key,
    date: { y, m, d, weekday },
    isWorkday,
    day: {
      pillar: day.pillar,
      stem: day.stem,
      branch: day.branch,
      officer: day.officer,
      officerIndex: day.officerIndex,
      gist: officerText.gist,
      clashAnimal: BRANCHES[day.clashBranch].animal,
    },
    user: { animal: userAnimal, dayMaster: natal.dayMaster, dayMasterInfo: ELEMENT_INFO[natal.dayMaster] },
    score,
    tier,
    intro: weatherHeadline(real, almanacTier.band) || almanacIntro,
    theme: { key: rel, ...theme },
    relationFlags: { clash, harmony, trine },
    agenda,
    ooo,
    yiEnergy,
    energy: {
      points: energy.points, peak: energy.peak, dip: energy.dip, wake: energy.wake, bed: energy.bed,
      sleep: energy.sleep, chronotype: energy.chronotype, meetingDrain: energy.meetingDrain, notes: energyNotes,
    },
    yi,
    ji,
    lucky: { element: luckyElement, info: el, color: luckyColor, item: luckyItem, direction: el.direction, deskNote },
    hours,
    focusLine: p.focus && FOCUS_LINES[p.focus] ? FOCUS_LINES[p.focus][tier.band] : null,
    remedyMode: needsRemedy,
    remedies: remedies.slice(0, 4),
    boosts,
  };
}
