// Auspicious — calendar insights: how today's meetings line up with the day's
// hours, its do/skip guidance, your focus time, and the weather.
import { hourBranchOf } from './almanac.js';
import { fmtClock } from './weather.js';

export const SPIRIT_NOTES = {
  天刑: 'Disputes and strict judgment',
  朱雀: 'Gossip and miscommunication',
  白虎: 'Sharp words and accidents',
  天牢: 'Delays and getting stuck',
  玄武: 'Mix-ups and lost files',
  勾陈: 'Red tape and entanglement',
};

export const OOO_RE = /\b(out of (the )?office|ooo|vacation|holiday|pto|annual leave|day off|sick)\b/i;

// Meeting type → the almanac activity it corresponds to.
const TYPES = [
  { type: 'interview', re: /interview|candidate|phone screen|onsite loop/i, keys: ['hire'], noun: 'hiring' },
  { type: 'negotiate', re: /negotiat|contract|pricing|procurement|vendor|legal review|renewal|terms/i, keys: ['negotiate', 'sign'], noun: 'negotiating and signing' },
  { type: 'pitch', re: /pitch|sales|client|customer|prospect|investor|partner/i, keys: ['pitch', 'negotiate'], noun: 'pitching' },
  { type: 'present', re: /demo|present|design review|showcase|all[- ]hands|town ?hall|readout|keynote|review/i, keys: ['present'], noun: 'presenting' },
  { type: 'launch', re: /release|launch|deploy|go[- ]live|cutover|migration|ship/i, keys: ['launch', 'deploy'], noun: 'shipping' },
  { type: 'plan', re: /plan|roadmap|strategy|okr|kick-?off|brainstorm|offsite/i, keys: ['plan', 'kickoff'], noun: 'planning and kicking off' },
  { type: 'oneonone', re: /\b1[:\-]1\b|1 ?on ?1|one[- ]on[- ]one|1-on-1/i, keys: ['oneonone'], noun: 'one-on-ones' },
  { type: 'social', re: /lunch|coffee|happy hour|celebrat|party|drinks/i, keys: ['network', 'celebrate'], noun: 'connecting' },
  { type: 'sync', re: /standup|stand-up|sync|check-?in|scrum|huddle|retro/i, keys: [], noun: '' },
];

const classify = (title) => TYPES.find((t) => t.re.test(title)) || { type: 'other', keys: [], noun: '' };
const decHour = (d) => d.getHours() + d.getMinutes() / 60;
const fmtSpan = (from, to) => `${fmtClock(from).replace(':00', '')}–${fmtClock(to).replace(':00', '')}`;
const fmtDur = (h) => (h >= 1 ? `${Math.round(h * 10) / 10} h` : `${Math.round(h * 60)} min`).replace('.0 h', ' h');

/**
 * @param events  today's events from lib/ics.js
 * @param hours   { best, caution, all } from the fortune engine
 * @param yiKeys / jiKeys  activity keys the almanac favors / flags today
 * @param real    weather assessment (or null)
 */
export function buildAgenda({ events, hours, yiKeys, jiKeys, real, profile, isWorkday }) {
  const allDay = events.filter((e) => e.allDay);
  const timed = events.filter((e) => !e.allDay);
  const ooo = allDay.some((e) => OOO_RE.test(e.title));
  const ws = Number((profile.workStart || '09:00').split(':')[0]);
  const we = Number((profile.workEnd || '18:00').split(':')[0]);

  const items = timed.map((e) => {
    const from = decHour(e.start), to = Math.min(24, from + (e.end - e.start) / 3600000);
    const branch = hourBranchOf(e.start.getHours());
    const cand = hours.all?.find((c) => c.branch === branch);
    let quality = null;
    if (hours.best && branch === hours.best.branch) quality = 'best';
    else if (cand && cand.spirit.good && cand.score > 0) quality = 'good';
    else if ((hours.caution && branch === hours.caution.branch) || (cand && cand.score <= -4)) quality = 'careful';
    const kind = classify(e.title);
    const flagged = kind.keys.find((k) => jiKeys.includes(k));
    const favored = kind.keys.find((k) => yiKeys.includes(k));
    let note = null, tone = null;
    if (flagged) { note = `The almanac advises against ${kind.noun} today. Over-prepare, or move it if it can wait.`; tone = 'warn'; }
    else if (quality === 'careful') { note = `Careful hour: ${(SPIRIT_NOTES[cand?.spirit.zh] || 'friction').toLowerCase()}. Leave some buffer.`; tone = 'warn'; }
    else if (favored) { note = `Well timed: today favors ${kind.noun}.`; tone = 'good'; }
    else if (quality === 'best') { note = 'Lands in your best hour of the day.'; tone = 'good'; }
    return { title: e.title, start: e.start, end: e.end, from, to, type: kind.type, quality, spirit: cand?.spirit || null, note, tone, flagged: !!flagged };
  });

  // Meeting load within the workday.
  const inWork = items.filter((i) => i.to > ws && i.from < we);
  const meetingHours = inWork.reduce((s, i) => s + (Math.min(i.to, we) - Math.max(i.from, ws)), 0);
  // Load counts every meeting today: evening calls drain you too.
  const totalHours = items.reduce((t, i) => t + (i.to - i.from), 0);
  const load = !items.length ? 'none' : totalHours > 4.5 ? 'heavy' : totalHours >= 2 ? 'moderate' : 'light';

  // Free gaps inside work hours.
  const busy = inWork.map((i) => [Math.max(i.from, ws), Math.min(i.to, we)]).sort((a, b) => a[0] - b[0]);
  const gaps = [];
  let cursor = ws;
  for (const [a, b] of busy) { if (a - cursor >= 0.5) gaps.push([cursor, a]); cursor = Math.max(cursor, b); }
  if (we - cursor >= 0.5) gaps.push([cursor, we]);
  const longest = gaps.reduce((best, g) => (!best || g[1] - g[0] > best[1] - best[0] ? g : best), null);
  const focus = !ooo && longest && longest[1] - longest[0] >= 0.75 && inWork.length ? { from: longest[0], to: longest[1] } : null;

  // Back-to-back chains (gaps under 10 minutes).
  let chain = 1, bestChain = { n: 1, at: null };
  for (let k = 1; k < busy.length; k++) {
    if (busy[k][0] - busy[k - 1][1] < 1 / 6) { chain++; if (chain > bestChain.n) bestChain = { n: chain, at: busy[k - chain + 1][0] }; } else chain = 1;
  }

  const insights = [];
  const conflict = items.find((i) => i.flagged);
  if (ooo) {
    insights.push('You’re marked out of office. Treat today as a day off.');
    if (items.length) {
      const names = items.slice(0, 2).map((i) => `“${i.title}”`).join(' and ');
      insights.push(`${names}${items.length > 2 ? ` and ${items.length - 2} more` : ''} ${items.length === 1 ? 'is' : 'are'} still on your calendar. Decline so no one waits for you.`);
    }
    return {
      items, allDay: allDay.map((e) => e.title), ooo, count: items.length, meetingHours: 0, load: 'none', focus: null,
      insights, doItem: null, skipItem: 'Checking work messages',
    };
  }
  if (conflict) insights.push(`“${conflict.title}” at ${fmtClock(conflict.from)}: ${conflict.note}`);
  if (!ooo && isWorkday && load === 'none') insights.push('No meetings on your calendar. A rare open day: go deep on your hardest problem.');
  if (focus) {
    const b = hours.best;
    const overlapsBest = b && b.from < focus.to && b.to > focus.from;
    insights.push(`Clearest focus block: ${fmtSpan(focus.from, focus.to)} (${fmtDur(focus.to - focus.from)}).${overlapsBest ? ' It overlaps your best hour.' : ''}`);
  }
  if (load === 'heavy') insights.push(`Heavy meeting day: ${fmtDur(totalHours)} across ${items.length} meetings. Protect a real lunch break.`);
  if (bestChain.n >= 3) insights.push(`${bestChain.n} meetings back to back from ${fmtClock(bestChain.at)}. Stand up and stretch between them.`);
  if (real?.window && (real.verdict === 'great' || real.verdict === 'fair')) {
    const g = gaps.find((x) => x[0] < real.window.to && x[1] > real.window.from);
    if (g && inWork.length) insights.push(`Your ${fmtSpan(Math.max(g[0], real.window.from), Math.min(g[1], real.window.to))} break lines up with the nicest weather. Step outside.`);
  }

  let doItem = null, skipItem = null, doKind = null;
  if (conflict) { doItem = `Over-prepare for “${conflict.title}” at ${fmtClock(conflict.from)}`; doKind = 'conflict'; }
  else if (focus) { doItem = `Guard ${fmtSpan(focus.from, focus.to)} for deep work`; doKind = 'focus'; }
  if (load === 'heavy') skipItem = 'Accepting new meetings today';

  return {
    items, allDay: allDay.map((e) => e.title), ooo, count: items.length,
    meetingHours: Math.round(items.reduce((s, i) => s + (i.to - i.from), 0) * 10) / 10,
    load, focus, insights: insights.slice(0, 3), doItem, skipItem, doKind, conflictAt: conflict?.from ?? null,
  };
}
