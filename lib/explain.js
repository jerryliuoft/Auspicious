// Auspicious — "Why today": turns the almanac calculation into plain-language reasons.
import { BRANCHES, isSixHarmony, isThreeHarmony } from './almanac.js';
import { ELEMENT_INFO } from './content.js';

const NAME = (e) => ELEMENT_INFO[e].name;

// Generating cycle, keyed by the element that gives.
const FEEDS = {
  wood: 'Wood feeds Fire',
  fire: 'Fire makes Earth, as ash',
  earth: 'Earth bears Metal, as ore',
  metal: 'Metal gathers Water, as dew',
  water: 'Water nourishes Wood',
};
// Controlling cycle, keyed by the element that controls.
const CONTROLS = {
  wood: 'Wood breaks up Earth, the way roots split soil',
  earth: 'Earth holds back Water, the way a dam does',
  water: 'Water puts out Fire',
  fire: 'Fire melts Metal',
  metal: 'Metal cuts Wood',
};

// Where the day's branch sits relative to the month's branch, for each officer.
const OFFICER_REASON = [
  'the same sign as the month itself. The month’s energy is at full strength, so the almanac calls it 建 Establish.',
  'one step past the month’s own sign. The peak has passed and things clear out: 除 Remove.',
  'two steps on, where the month’s energy pools: 满 Full.',
  'three steps on, a level point in the cycle: 平 Balance.',
  'four steps on, forming a harmony triangle with the month, so things settle: 定 Stable.',
  'five steps on, where the energy grips and holds: 执 Grasp.',
  'directly opposite the month on the zodiac wheel. The day pulls against its season: 破 Break.',
  'just past the opposite point, where footing is unsure: 危 Danger.',
  'eight steps on, completing a harmony triangle with the month: 成 Success.',
  'nine steps on, where the cycle gathers in: 收 Receive.',
  'ten steps on, where the cycle opens toward renewal: 开 Open.',
  'one step before the month’s own sign returns, so the cycle shuts: 闭 Close.',
];

export function fmtRange(from, to) {
  const h = (x) => ((x % 24) + 24) % 24;
  const part = (x) => ({ n: h(x) % 12 || 12, m: h(x) < 12 ? 'am' : 'pm' });
  const a = part(from), b = part(to);
  return a.m === b.m ? `${a.n}–${b.n} ${b.m}` : `${a.n} ${a.m}–${b.n} ${b.m}`;
}

export function buildWhy({ day, natal, rel, flags, hours, season, gist }) {
  const dayAnimal = BRANCHES[day.dayBranch].animal;
  const monthAnimal = BRANCHES[day.monthBranch].animal;
  const userAnimal = BRANCHES[natal.yearBranch].animal;
  const dayEl = day.stem.element;
  const dm = natal.dayMaster;

  const calendar = `It’s the ${monthAnimal} month, in the ${season.term.en} season. Today is a ${dayAnimal} day, ${OFFICER_REASON[day.officerIndex]} ${gist}`;

  const relLine = {
    peer: `Same element: like meets like. Confidence rises, and so does competition.`,
    output: `${FEEDS[dm]}, so your energy flows outward. Ideas carry well, but you tire faster.`,
    wealth: `${CONTROLS[dm]}. You have the upper hand, which the old system reads as results you can grasp.`,
    officer: `${CONTROLS[dayEl]}. That means pressure from above: structure, deadlines, people watching.`,
    resource: `${FEEDS[dayEl]}. Today supports you, so help and good advice come more easily.`,
  }[rel];
  let you = `Today’s element is ${NAME(dayEl)} (from the day’s stem, ${day.stem.zh}). Your core element is ${NAME(dm)}. ${relLine}`;
  if (flags.clash) you += ` On top of that, today’s ${dayAnimal} sits directly opposite your ${userAnimal} on the zodiac wheel. That clash is the main reason the luck drops.`;
  else if (flags.harmony) you += ` Today’s ${dayAnimal} is also a natural ally (六合) of your ${userAnimal}, which lifts the day.`;
  else if (flags.trine) you += ` Today’s ${dayAnimal} also sits in your ${userAnimal}’s harmony triangle (三合), a small boost.`;

  let hour = null;
  if (hours.best) {
    const b = hours.best;
    hour = `${fmtRange(b.from, b.to)} is the ${b.spirit.en} (${b.spirit.zh}) hour, one of six “yellow-path” hours the almanac marks as clear on a ${dayAnimal} day.`;
    if (isSixHarmony(b.branch, natal.yearBranch) || isThreeHarmony(b.branch, natal.yearBranch)) {
      hour += ` It’s also a ${b.animal} hour, which gets along with your ${userAnimal}.`;
    }
  }

  const hook = `${dayAnimal} day ${day.officerIndex === 6 ? 'against' : 'in'} a ${monthAnimal} month · ${season.pentad.en}`;
  return { hook, calendar, you, hour };
}
