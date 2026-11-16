// Auspicious — nature layer: the 24 solar terms, the 72 pentads (七十二候), and the moon.
// Pentad names follow the traditional Chinese list; English renderings and the
// workday reflections are our own.
import { jdn, solarLongitude } from './almanac.js';

const mod = (n, m) => ((n % m) + m) % m;

// Ordered from 立春 (Start of Spring, solar longitude 315°).
export const TERMS = [
  { zh: '立春', en: 'Start of Spring' }, { zh: '雨水', en: 'Rain Water' },
  { zh: '惊蛰', en: 'Awakening of Insects' }, { zh: '春分', en: 'Spring Equinox' },
  { zh: '清明', en: 'Clear and Bright' }, { zh: '谷雨', en: 'Grain Rain' },
  { zh: '立夏', en: 'Start of Summer' }, { zh: '小满', en: 'Grain Buds' },
  { zh: '芒种', en: 'Grain in Ear' }, { zh: '夏至', en: 'Summer Solstice' },
  { zh: '小暑', en: 'Minor Heat' }, { zh: '大暑', en: 'Major Heat' },
  { zh: '立秋', en: 'Start of Autumn' }, { zh: '处暑', en: 'End of Heat' },
  { zh: '白露', en: 'White Dew' }, { zh: '秋分', en: 'Autumn Equinox' },
  { zh: '寒露', en: 'Cold Dew' }, { zh: '霜降', en: 'Frost’s Descent' },
  { zh: '立冬', en: 'Start of Winter' }, { zh: '小雪', en: 'Minor Snow' },
  { zh: '大雪', en: 'Major Snow' }, { zh: '冬至', en: 'Winter Solstice' },
  { zh: '小寒', en: 'Minor Cold' }, { zh: '大寒', en: 'Major Cold' },
];

// Three pentads per term, same order as TERMS.
export const PENTADS = [
  ['东风解冻', 'East wind melts the ice', 'Thaw before you push. Warm up relationships before asking for anything big.'],
  ['蛰虫始振', 'Hibernating insects stir', 'Dormant things twitch back to life. Check in on the project you shelved.'],
  ['鱼陟负冰', 'Fish rise up to the ice', 'Movement is starting under the surface. Get close to where change is happening.'],
  ['獭祭鱼', 'Otters lay out their catch', 'Otters line up fish before they eat. Lay out what you have before you decide.'],
  ['候雁北', 'Wild geese fly north', 'Geese travel in formation. Align the team before heading off.'],
  ['草木萌动', 'Plants begin to sprout', 'New shoots are fragile. Protect fresh ideas from early criticism.'],
  ['桃始华', 'Peach trees begin to blossom', 'First blossoms draw the eye. Show early work and invite interest.'],
  ['仓庚鸣', 'Orioles sing', 'Voices carry in spring air. Speak up about what you are building.'],
  ['鹰化为鸠', 'Hawks turn into doves', 'The ancients believed hawks became doves in spring. Persuade instead of push.'],
  ['玄鸟至', 'Swallows return', 'Swallows come back to old nests. Revisit old contacts and past wins.'],
  ['雷乃发声', 'Thunder finds its voice', 'Spring thunder wakes everything up. A bold announcement lands well.'],
  ['始电', 'Lightning first appears', 'Ideas strike fast this week. Write them down before they vanish.'],
  ['桐始华', 'Paulownia trees bloom', 'A season of clarity. Rewrite your plan so anyone could follow it.'],
  ['田鼠化为鴽', 'Field mice become quail', 'Old texts saw creatures change form now. Let a habit or role change shape.'],
  ['虹始见', 'Rainbows first appear', 'Rain and sun together make rainbows. Mixed news can still turn out well.'],
  ['萍始生', 'Duckweed begins to grow', 'Small things spread fast now. Watch what is multiplying, good or bad.'],
  ['鸣鸠拂其羽', 'Turtledoves preen their feathers', 'Preen before you present. Polish the details.'],
  ['戴胜降于桑', 'Hoopoes land in the mulberry trees', 'Hoopoes once signaled silkworm season. Settle into a productive routine.'],
  ['蝼蝈鸣', 'Mole crickets chirp', 'The noise of summer begins. Expect more meetings and guard your focus time.'],
  ['蚯蚓出', 'Earthworms come out', 'Worms loosen the soil unseen. Quiet groundwork pays off later.'],
  ['王瓜生', 'Snake gourds climb', 'Vines climb fast in the heat. Steady daily progress compounds.'],
  ['苦菜秀', 'Bitter herbs flourish', 'Bitter greens are good for you. Take the hard feedback.'],
  ['靡草死', 'Delicate grasses wither', 'Weak growth fades in strong sun. Drop projects that cannot take the heat.'],
  ['麦秋至', 'The wheat harvest arrives', 'An early harvest. Collect quick wins before the big push.'],
  ['螳螂生', 'Praying mantises hatch', 'Mantises wait, then strike. Prepare, then move decisively.'],
  ['鵙始鸣', 'Shrikes begin to call', 'Sharp calls cut through the noise. Be clear and direct.'],
  ['反舌无声', 'Mockingbirds fall silent', 'Even the mimics go quiet. Stop echoing others and form your own view.'],
  ['鹿角解', 'Deer shed their antlers', 'At the peak of summer, deer drop their antlers. At the top, let go of what you have outgrown.'],
  ['蜩始鸣', 'Cicadas begin to sing', 'Cicadas surface after years underground. Long effort shows up now.'],
  ['半夏生', 'Crow-dipper sprouts', 'This herb is named for midsummer. Halfway through the year: check your goals.'],
  ['温风至', 'Warm winds arrive', 'Heat builds and tempers rise with it. Pace yourself.'],
  ['蟋蟀居壁', 'Crickets shelter in the walls', 'Crickets hide from the heat. Retreat into deep work.'],
  ['鹰始挚', 'Young hawks learn to hunt', 'Fledglings practice their skills. Teach someone junior what you know.'],
  ['腐草为萤', 'Fireflies rise from fallen grass', 'The ancients thought rotting grass became fireflies. Old failures can light the way.'],
  ['土润溽暑', 'Damp soil, heavy air', 'Heavy air makes heavy days. Lighten your load where you can.'],
  ['大雨时行', 'Great rains sweep through', 'Summer storms clear the air. Have the overdue frank conversation.'],
  ['凉风至', 'Cool winds arrive', 'The first cool breath. Step back for a cooler, longer view.'],
  ['白露降', 'White dew descends', 'Dew forms overnight. Let ideas settle before you decide.'],
  ['寒蝉鸣', 'Autumn cicadas sing', 'A last song before the quiet. Finish what you started this summer.'],
  ['鹰乃祭鸟', 'Hawks lay out their prey', 'Hawks display their catch. Review and share your results.'],
  ['天地始肃', 'Heaven and earth grow solemn', 'The year turns serious. Tighten your priorities.'],
  ['禾乃登', 'The grain ripens', 'Harvest season. Collect on long-running efforts.'],
  ['鸿雁来', 'Wild geese arrive', 'Travelers arrive. Welcome newcomers and new ideas.'],
  ['玄鸟归', 'Swallows depart', 'Swallows head south. Let go gracefully of what is ending.'],
  ['群鸟养羞', 'Birds store food for winter', 'Birds stock up before the cold. Build reserves of time, budget, and energy.'],
  ['雷始收声', 'Thunder lowers its voice', 'Thunder goes quiet. Speak less, listen more.'],
  ['蛰虫坯户', 'Insects seal their burrows', 'Insects close their doors. Protect your focus time.'],
  ['水始涸', 'Waters begin to dry', 'Rivers shrink. Conserve resources and cut waste.'],
  ['鸿雁来宾', 'Wild geese come as guests', 'Guests arrive. Be a gracious host to visitors and new hires.'],
  ['雀入大水为蛤', 'Sparrows enter the sea and become clams', 'An old belief about transformation. A good week to reinvent a process.'],
  ['菊有黄华', 'Chrysanthemums bloom yellow', 'Chrysanthemums bloom when everything else fades. Late efforts still flower.'],
  ['豺乃祭兽', 'Jackals lay out their prey', 'Jackals gather food for winter. Collect what you are owed.'],
  ['草木黄落', 'Leaves yellow and fall', 'Trees drop what they cannot sustain. Prune your commitments.'],
  ['蛰虫咸俯', 'Insects bow into hibernation', 'Creatures go underground. Keep a low profile and do quiet work.'],
  ['水始冰', 'Water begins to freeze', 'Water firms into ice. Lock in decisions that have stayed fluid.'],
  ['地始冻', 'The earth begins to freeze', 'The ground hardens and holds its warmth inside. A week for finishing, not breaking new ground.'],
  ['雉入大水为蜃', 'Pheasants enter the sea and become clams', 'The ancients pictured pheasants turning into clams. Close your shell and conserve energy.'],
  ['虹藏不见', 'Rainbows hide', 'No rainbows in winter air. Don’t wait for the perfect moment; work with what is here.'],
  ['天气上升地气下降', 'Heaven’s energy rises, earth’s sinks', 'Sky and earth drift apart. Expect disconnects and over-communicate.'],
  ['闭塞而成冬', 'Everything closes in; winter sets', 'The world shuts in. Close out the year’s loose ends.'],
  ['鹖鴠不鸣', 'Night birds stop calling', 'Even the night birds go silent. Quiet hours are productive hours.'],
  ['虎始交', 'Tigers begin to mate', 'In the deepest cold, new life stirs. Plant seeds for next year.'],
  ['荔挺出', 'Iris shoots appear', 'Green shoots in the cold. Small signs of progress count.'],
  ['蚯蚓结', 'Earthworms curl up', 'Worms knot tight against the cold. Pull in and protect the core.'],
  ['麋角解', 'Elk shed their antlers', 'At the turn of the year, shed what is heavy.'],
  ['水泉动', 'Springs begin to flow', 'Underground water moves again. Quiet momentum is returning.'],
  ['雁北乡', 'Wild geese turn north', 'Geese sense the coming spring. Point toward next quarter’s goals.'],
  ['鹊始巢', 'Magpies begin to nest', 'Magpies build early. Set up structures before you need them.'],
  ['雉始鸲', 'Pheasants begin to call', 'First calls in the cold. Reach out before others do.'],
  ['鸡始乳', 'Hens begin to lay', 'New life before spring. Small new beginnings are welcome.'],
  ['征鸟厉疾', 'Birds of prey fly fierce and fast', 'Hunters are sharpest in the cold. Be focused and decisive.'],
  ['水泽腹坚', 'Lakes freeze solid to the center', 'The ice is at its thickest. Your foundations are solid; build on them.'],
].map(([zh, en, note]) => ({ zh, en, note }));

const lonAt = (y, m, d) => solarLongitude(jdn(y, m, d)); // noon UTC

/** Solar term + pentad for a civil date, including when the current term began. */
export function seasonOf(y, m, d) {
  const off = mod(lonAt(y, m, d) - 315, 360);
  const termIndex = Math.floor(off / 15);
  const pentadInTerm = Math.min(2, Math.floor((off - termIndex * 15) / 5));
  // Walk back to the first day of this term.
  let start = new Date(Date.UTC(y, m - 1, d));
  for (let i = 0; i < 20; i++) {
    const prev = new Date(start.getTime() - 86400000);
    const t = Math.floor(mod(lonAt(prev.getUTCFullYear(), prev.getUTCMonth() + 1, prev.getUTCDate()) - 315, 360) / 15);
    if (t !== termIndex) break;
    start = prev;
  }
  return {
    term: TERMS[termIndex],
    termIndex,
    termStart: { m: start.getUTCMonth() + 1, d: start.getUTCDate() },
    pentad: PENTADS[termIndex * 3 + pentadInTerm],
    pentadIndex: termIndex * 3 + pentadInTerm,
    pentadInTerm,
  };
}

const SYNODIC = 29.530588853;
const KNOWN_NEW_MOON_JD = 2451550.25972; // 2000-01-06 18:14 UTC

const MOON_NOTES = {
  'New moon': 'Traditionally a clean slate: set intentions before you act.',
  'Waxing crescent': 'Traditionally a time of building momentum: start small.',
  'First quarter': 'Traditionally a decision point: push through friction.',
  'Waxing gibbous': 'Traditionally a time to refine and polish.',
  'Full moon': 'Traditionally peak visibility: present and celebrate, but tempers run high.',
  'Waning gibbous': 'Traditionally a time to share and teach what you learned.',
  'Last quarter': 'Traditionally a time to cut what isn’t working.',
  'Waning crescent': 'Traditionally a time to wrap up and rest before the next cycle.',
};

/** Name the phase by how much of the disc is lit, so it matches what you see. */
function phaseName(illumination, waxing) {
  if (illumination <= 3) return 'New moon';
  if (illumination >= 97) return 'Full moon';
  if (illumination < 40) return waxing ? 'Waxing crescent' : 'Waning crescent';
  if (illumination <= 60) return waxing ? 'First quarter' : 'Last quarter';
  return waxing ? 'Waxing gibbous' : 'Waning gibbous';
}

/** Moon phase at local noon of a civil date (age in days, 0–1 cycle fraction, % lit). */
export function moonPhase(y, m, d) {
  const jd = jdn(y, m, d); // noon UTC
  const age = mod(jd - KNOWN_NEW_MOON_JD, SYNODIC);
  const fraction = age / SYNODIC;
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * fraction)) / 2) * 100);
  const name = phaseName(illumination, fraction < 0.5);
  return { age: Math.round(age * 10) / 10, fraction, illumination, name, note: MOON_NOTES[name] };
}
