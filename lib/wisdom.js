// Auspicious — classic lines matched to the day.
// Original Chinese texts are public domain; the English renderings are our own.
// Tags: bands (good/neutral/bad), officers (Twelve Day Officer indices), rels (Ten-Gods theme).
// Officer indices: 0建 1除 2满 3平 4定 5执 6破 7危 8成 9收 10开 11闭

export const QUOTES = [
  { zh: '图难于其易，为大于其细', en: 'Tackle the hard while it is still easy; do the great while it is still small.', src: 'Laozi, Tao Te Ching 63', apply: 'Cut the big task down to a first step you can finish today.', bands: ['bad', 'neutral'], officers: [6, 7, 3] },
  { zh: '千里之行，始于足下', en: 'A journey of a thousand miles begins beneath your feet.', src: 'Laozi, Tao Te Ching 64', apply: 'Don’t wait for the whole plan. Take the first concrete step.', bands: ['good'], officers: [0, 10] },
  { zh: '合抱之木，生于毫末', en: 'A tree too wide to hug grew from a tiny sprout.', src: 'Laozi, Tao Te Ching 64', apply: 'What you start today can grow into something big. Plant it.', bands: ['good', 'neutral'], officers: [10, 0, 5] },
  { zh: '慎终如始，则无败事', en: 'Be as careful at the end as at the beginning, and nothing will fail.', src: 'Laozi, Tao Te Ching 64', apply: 'Give the last ten percent the same attention as the first.', bands: ['good', 'neutral'], officers: [8, 9, 11] },
  { zh: '知足不辱，知止不殆', en: 'Know what is enough and avoid disgrace; know when to stop and avoid danger.', src: 'Laozi, Tao Te Ching 44', apply: 'Set a clear stopping point for today and keep it.', bands: ['bad'], officers: [2, 7] },
  { zh: '持而盈之，不如其已', en: 'Filling a cup to the brim is worse than stopping in time.', src: 'Laozi, Tao Te Ching 9', apply: 'Don’t overload the plan. Leave room for the unexpected.', bands: ['good', 'neutral'], officers: [2] },
  { zh: '功遂身退，天之道', en: 'When the work is done, step back. That is the way of heaven.', src: 'Laozi, Tao Te Ching 9', apply: 'Ship it, hand it off, and let it stand on its own.', bands: ['good', 'neutral'], officers: [8, 9, 11] },
  { zh: '上善若水', en: 'The highest good is like water.', src: 'Laozi, Tao Te Ching 8', apply: 'Flow around obstacles instead of pushing through them.', bands: ['neutral', 'bad'], officers: [3], rels: ['output'] },
  { zh: '大器晚成', en: 'The greatest vessels take the longest to finish.', src: 'Laozi, Tao Te Ching 41', apply: 'If progress feels slow, the work may simply be big.', bands: ['bad', 'neutral'], officers: [5] },
  { zh: '柔弱胜刚强', en: 'The soft and yielding overcome the hard and strong.', src: 'Laozi, Tao Te Ching 36', apply: 'In a tense discussion, giving a little wins more than pushing.', bands: ['bad'], officers: [7, 6], rels: ['officer'] },
  { zh: '知人者智，自知者明', en: 'Knowing others is wisdom; knowing yourself is clarity.', src: 'Laozi, Tao Te Ching 33', apply: 'Before reacting to anyone, check what you actually want.', bands: ['neutral'], rels: ['peer'] },
  { zh: '曲则全', en: 'Bend, and you stay whole.', src: 'Laozi, Tao Te Ching 22', apply: 'Flexibility today keeps the project in one piece.', bands: ['bad'], officers: [6] },
  { zh: '祸兮福之所倚，福兮祸之所伏', en: 'Good fortune leans on misfortune; misfortune hides inside good fortune.', src: 'Laozi, Tao Te Ching 58', apply: 'A rough day often sets up a good one, and a great day still needs care.', bands: ['bad', 'good'] },
  { zh: '知彼知己，百战不殆', en: 'Know the other side and know yourself, and a hundred battles hold no danger.', src: 'Sunzi, The Art of War, Strategic Attack', apply: 'Prepare for the meeting by learning what the other side needs.', bands: ['good'], officers: [4, 8], rels: ['wealth'] },
  { zh: '胜兵先胜而后求战', en: 'Winning armies win first, then go to battle.', src: 'Sunzi, The Art of War, Disposition', apply: 'Do the prep so the outcome is settled before you walk in.', bands: ['good', 'neutral'], officers: [8, 4, 0] },
  { zh: '其疾如风，其徐如林', en: 'Swift as the wind, calm as the forest.', src: 'Sunzi, The Art of War, Maneuvering', apply: 'Move fast where it counts and stay calm everywhere else.', bands: ['good'], officers: [10] },
  { zh: '先为不可胜，以待敌之可胜', en: 'First make yourself unbeatable, then wait for the chance to win.', src: 'Sunzi, The Art of War, Disposition', apply: 'Strengthen your position today. The opening will come.', bands: ['bad'], officers: [7, 11] },
  { zh: '多算胜，少算不胜', en: 'More calculation wins; less calculation loses.', src: 'Sunzi, The Art of War, Laying Plans', apply: 'Run the numbers one more time before you commit.', bands: ['neutral', 'good'], officers: [4, 3], rels: ['wealth'] },
  { zh: '工欲善其事，必先利其器', en: 'A craftsman who wants good work must first sharpen the tools.', src: 'Confucius, Analects 15', apply: 'Fix your setup, tools, and templates. It pays back all week.', bands: ['neutral', 'bad'], officers: [1, 11, 3] },
  { zh: '欲速则不达', en: 'Rush, and you will not arrive.', src: 'Confucius, Analects 13', apply: 'Slow down on anything with consequences.', bands: ['bad'], officers: [7, 6] },
  { zh: '三人行，必有我师焉', en: 'Walking with any three people, one of them can teach me.', src: 'Confucius, Analects 7', apply: 'Ask a colleague how they would approach your problem.', bands: ['neutral', 'good'], rels: ['peer', 'resource'] },
  { zh: '学而时习之，不亦说乎', en: 'To learn and practice it often: isn’t that a joy?', src: 'Confucius, Analects 1', apply: 'Spend thirty minutes practicing a skill, not just reading about it.', bands: ['neutral', 'good'], rels: ['resource'] },
  { zh: '君子欲讷于言而敏于行', en: 'The noble person is slow to speak and quick to act.', src: 'Confucius, Analects 4', apply: 'Promise less and deliver more today.', bands: ['neutral', 'bad'], officers: [5], rels: ['output'] },
  { zh: '人无远虑，必有近忧', en: 'Without thought for the distance, worries arrive close at hand.', src: 'Confucius, Analects 15', apply: 'Block fifteen minutes to look at next month.', bands: ['neutral'], officers: [0, 3] },
  { zh: '温故而知新', en: 'Review the old to discover the new.', src: 'Confucius, Analects 2', apply: 'Reread old notes or past projects. The next idea is in there.', bands: ['neutral', 'bad'], officers: [9, 11, 1], rels: ['resource'] },
  { zh: '过而不改，是谓过矣', en: 'To err and not correct it: that is the real error.', src: 'Confucius, Analects 15', apply: 'Fix the thing you know is wrong, even if no one has noticed.', bands: ['bad', 'neutral'], officers: [1, 6] },
  { zh: '天行健，君子以自强不息', en: 'Heaven moves with vigor; the noble person strives without rest.', src: 'I Ching, Hexagram 1', apply: 'Keep your momentum. Show up and push.', bands: ['good'], officers: [10, 8] },
  { zh: '地势坤，君子以厚德载物', en: 'The earth is receptive; the noble person carries all things with generous virtue.', src: 'I Ching, Hexagram 2', apply: 'Support someone else’s work today. It comes back.', bands: ['neutral'], rels: ['resource', 'peer'] },
  { zh: '穷则变，变则通，通则久', en: 'At a dead end, change; change opens a way; an open way endures.', src: 'I Ching, Great Commentary', apply: 'If you are stuck, change the approach, not the effort level.', bands: ['bad'], officers: [6, 11] },
  { zh: '君子藏器于身，待时而动', en: 'The noble person keeps the tools close and moves when the time is right.', src: 'I Ching, Great Commentary', apply: 'Prepare now and act when the window opens.', bands: ['bad', 'neutral'], officers: [11, 7, 5] },
  { zh: '二人同心，其利断金', en: 'When two share one heart, their edge can cut metal.', src: 'I Ching, Great Commentary', apply: 'Pair up on the hardest problem today.', bands: ['good', 'neutral'], officers: [2], rels: ['peer'] },
  { zh: '不积跬步，无以至千里', en: 'Without piling up small steps, no one travels a thousand miles.', src: 'Xunzi, Encouraging Learning', apply: 'Small, steady progress beats one big push today.', bands: ['neutral'], officers: [5, 3] },
];

/** Score quotes against the day and return the best match (ties broken by rng). */
export function pickQuote({ band, officerIndex, rel }, rng) {
  const scored = QUOTES.map((q) => ({
    q,
    s: (q.officers?.includes(officerIndex) ? 3 : 0) + (q.bands?.includes(band) ? 2 : 0) + (q.rels?.includes(rel) ? 1 : 0),
  }));
  const top = Math.max(...scored.map((x) => x.s));
  const best = scored.filter((x) => x.s === top);
  return best[Math.floor(rng() * best.length)].q;
}
