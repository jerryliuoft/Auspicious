// Auspicious — fortune text. Classical almanac meanings translated into office life.

export const ROLES = {
  engineer: 'Engineer / Developer',
  sales: 'Sales / Business Dev',
  manager: 'Manager / Team Lead',
  creative: 'Designer / Creative',
  founder: 'Founder / Owner',
  ops: 'Operations / Support',
  student: 'Student / Researcher',
  general: 'Something else',
};

export const FOCUSES = {
  none: 'No particular focus',
  jobhunt: 'Finding a new job',
  promotion: 'Getting promoted',
  launch: 'Shipping a big project',
  deals: 'Closing deals / growing revenue',
  learning: 'Learning a new skill',
  balance: 'Work–life balance',
  survive: 'Just surviving the week',
};

// Activity keys → generic phrasing, plus per-role overrides.
export const ACTIVITIES = {
  kickoff: { g: 'Kick off a new project', engineer: 'Start the new repo or feature branch', sales: 'Open a fresh prospect list', manager: 'Run the project kickoff meeting', creative: 'Start a new concept from a blank canvas', founder: 'Start the initiative you keep postponing', student: 'Begin a new chapter or experiment' },
  launch: { g: 'Launch or announce your work', engineer: 'Merge and release the feature', sales: 'Announce the new offer to clients', manager: 'Announce the plan to the team', creative: 'Publish the portfolio piece', founder: 'Go live with the launch', ops: 'Roll out the new process', student: 'Submit the paper or assignment' },
  pitch: { g: 'Pitch an idea', sales: 'Make the big pitch', engineer: 'Propose the refactor you believe in', manager: 'Pitch headcount or budget upward', creative: 'Present your boldest concept', founder: 'Pitch investors or partners', student: 'Pitch your research idea to your advisor' },
  negotiate: { g: 'Negotiate terms', sales: 'Negotiate pricing with a key account', manager: 'Negotiate scope and deadlines', founder: 'Negotiate with partners or vendors', engineer: 'Negotiate the timeline with your PM' },
  sign: { g: 'Sign agreements or commit to decisions', sales: 'Get the contract signed', founder: 'Sign the deal', manager: 'Lock in the roadmap', engineer: 'Commit to the architecture choice' },
  network: { g: 'Reach out and connect', sales: 'Warm up new leads', engineer: 'Pair with someone outside your team', manager: 'Have skip-level coffee chats', creative: 'Share work with your community', founder: 'Reconnect with an old contact', student: 'Email a researcher you admire' },
  ask: { g: 'Ask for what you want', engineer: 'Ask for the review, the help, or the raise', sales: 'Ask for the referral', manager: 'Ask leadership for support', creative: 'Ask for honest feedback', student: 'Ask for the recommendation letter' },
  learn: { g: 'Learn something new', engineer: 'Read the docs you have been skimming', sales: 'Study a competitor’s playbook', manager: 'Read up on a management practice', creative: 'Study a style you have never tried', student: 'Go deep on the hardest topic' },
  plan: { g: 'Plan and set goals', engineer: 'Write the design doc', sales: 'Plan your territory for the quarter', manager: 'Draft next quarter’s goals', founder: 'Revisit the strategy' },
  declutter: { g: 'Declutter and clear out', engineer: 'Delete dead code and stale branches', sales: 'Clean up the CRM', manager: 'Cancel meetings that no longer serve', creative: 'Archive old drafts and assets', ops: 'Close out stale tickets', student: 'Tidy your notes and references' },
  review: { g: 'Review and double-check', engineer: 'Review PRs carefully', sales: 'Review the pipeline', manager: 'Review the metrics', creative: 'Critique your own work with fresh eyes', ops: 'Audit the runbooks', student: 'Proofread and verify citations' },
  followup: { g: 'Follow up and collect what you are owed', sales: 'Chase signatures and invoices', engineer: 'Ping blocked PRs and pending reviews', manager: 'Follow up on open action items', ops: 'Close the loop on escalations', founder: 'Collect outstanding payments' },
  present: { g: 'Present to an audience', engineer: 'Demo your work', sales: 'Run the product demo', manager: 'Present results to leadership', creative: 'Present to the client', student: 'Give the presentation' },
  hire: { g: 'Bring new people aboard', manager: 'Interview and extend offers', founder: 'Make the key hire', engineer: 'Onboard a new teammate', ops: 'Bring in a new vendor', student: 'Recruit collaborators' },
  decide: { g: 'Make the big decision', manager: 'Make the call you have been weighing', founder: 'Decide on the direction', engineer: 'Pick the tech stack' },
  create: { g: 'Make something original', engineer: 'Prototype the wild idea', creative: 'Do deep creative work', sales: 'Write a fresh outreach script', manager: 'Design a new team ritual', student: 'Write the first draft' },
  fix: { g: 'Fix what is broken', engineer: 'Squash the bugs', ops: 'Patch the broken process', manager: 'Address the team friction', sales: 'Repair a strained client relationship', creative: 'Fix the layout that has bugged you for weeks' },
  deploy: { g: 'Push risky changes live', engineer: 'Deploy to production', ops: 'Change production systems', manager: 'Reorganize the team', founder: 'Change pricing', sales: 'Change a client’s contract terms' },
  bigEmail: { g: 'Send the high-stakes message', engineer: 'Send the incident postmortem', sales: 'Send the final offer', manager: 'Send the all-hands email', founder: 'Send the investor update' },
  confront: { g: 'Pick fights or escalate conflicts', manager: 'Deliver harsh criticism in public', engineer: 'Start a flame war in code review', sales: 'Argue with a difficult client' },
  overcommit: { g: 'Overpromise or overcommit', engineer: 'Promise an aggressive deadline', sales: 'Promise features that do not exist', manager: 'Say yes to every request' },
  travel: { g: 'Travel for work', sales: 'Go on a long client trip', manager: 'Fly out for the offsite' },
  rest: { g: 'Rest and recharge', engineer: 'Take a real lunch away from the screen', manager: 'Block focus time with no meetings', student: 'Sleep before you study' },
  document: { g: 'Write things down', engineer: 'Write the README and docs', manager: 'Document decisions', ops: 'Update the runbook', creative: 'Write up your process' },
  oneonone: { g: 'Have honest one-on-ones', manager: 'Hold thoughtful 1:1s', engineer: 'Catch up 1:1 with your lead', sales: 'Check in personally with key clients' },
  celebrate: { g: 'Celebrate wins', manager: 'Shout out the team’s wins', sales: 'Celebrate the closed deal', engineer: 'Share what shipped' },
};

export const phrase = (key, role) => (ACTIVITIES[key][role] || ACTIVITIES[key].g);

export const OFFICER_CONTENT = [
  { // 建 Establish
    base: 1,
    gist: 'A day of foundations. Lay groundwork; good for meeting people above you.',
    yi: ['plan', 'kickoff', 'learn', 'network', 'ask'],
    ji: ['deploy', 'sign', 'declutter'],
  },
  { // 除 Remove
    base: 1,
    gist: 'A day for clearing out. What you remove today makes room for what comes next.',
    yi: ['declutter', 'fix', 'review', 'rest', 'followup'],
    ji: ['launch', 'negotiate', 'hire'],
  },
  { // 满 Full
    base: 1,
    gist: 'A day of abundance. Harvest and celebrate, but a full cup spills easily.',
    yi: ['celebrate', 'network', 'present', 'followup', 'pitch'],
    ji: ['overcommit', 'hire', 'deploy'],
  },
  { // 平 Balance
    base: 0,
    gist: 'An even, ordinary day. Steady routine work goes well; big swings do not.',
    yi: ['review', 'oneonone', 'document', 'followup', 'learn'],
    ji: ['launch', 'pitch', 'decide'],
  },
  { // 定 Stable
    base: 2,
    gist: 'A settling day. Decisions made today tend to hold.',
    yi: ['sign', 'decide', 'hire', 'plan', 'negotiate'],
    ji: ['travel', 'confront', 'deploy'],
  },
  { // 执 Grasp
    base: 0,
    gist: 'A day to hold on and get things done. Persistence beats novelty.',
    yi: ['followup', 'create', 'document', 'fix', 'hire'],
    ji: ['travel', 'overcommit', 'launch'],
  },
  { // 破 Break
    base: -3,
    gist: 'A breaking day. Things fall apart easily, so break old habits rather than new ground.',
    yi: ['declutter', 'fix', 'rest', 'review'],
    ji: ['sign', 'negotiate', 'launch', 'kickoff', 'deploy'],
  },
  { // 危 Danger
    base: -2,
    gist: 'A precarious day. Climb carefully and keep a hand on the rail.',
    yi: ['review', 'document', 'rest', 'learn'],
    ji: ['deploy', 'bigEmail', 'negotiate', 'confront', 'travel'],
  },
  { // 成 Success
    base: 3,
    gist: 'A day of completion. Efforts come together and agreements take hold.',
    yi: ['launch', 'sign', 'pitch', 'negotiate', 'present', 'kickoff', 'hire'],
    ji: ['confront'],
  },
  { // 收 Receive
    base: 1,
    gist: 'A gathering day. Collect what you have earned.',
    yi: ['followup', 'ask', 'negotiate', 'celebrate', 'review'],
    ji: ['kickoff', 'launch', 'travel'],
  },
  { // 开 Open
    base: 3,
    gist: 'An opening day. Doors swing wide for new beginnings.',
    yi: ['kickoff', 'launch', 'pitch', 'network', 'create', 'hire', 'learn'],
    ji: ['confront', 'declutter'],
  },
  { // 闭 Close
    base: -2,
    gist: 'A closing day. Energy turns inward; finish things rather than starting them.',
    yi: ['document', 'rest', 'review', 'declutter', 'learn'],
    ji: ['launch', 'kickoff', 'pitch', 'network', 'travel'],
  },
];

// Practical remedies (化解) for difficult officers.
export const OFFICER_REMEDIES = {
  6: [ // 破
    'Make a backup or snapshot before you change anything important.',
    'Start with three tiny tasks you can finish in five minutes. Small wins steady a breaking day.',
    'If a deal must happen today, sign it during your lucky hour and read every line twice.',
  ],
  7: [ // 危
    'Use schedule-send on anything important and reread it in an hour.',
    'Get a second pair of eyes before anything goes live.',
    'Double-check the recipients on every email before you hit send.',
  ],
  11: [ // 闭
    'Don’t force new starts. Pick one open loop and close it completely.',
    'Open the window or step outside for five minutes to let stale energy out.',
    'Write tomorrow’s first task on a sticky note so momentum carries over.',
  ],
};

// Ten-Gods themes (relationship of the day's element to your day master).
export const THEMES = {
  resource: { zh: '印', title: 'Support and learning', text: 'Mentors, documentation, and good advice are on your side today.', score: 1 },
  peer: { zh: '比', title: 'Peers and teamwork', text: 'Collaboration shines. Share credit generously and guard your own.', score: 0 },
  output: { zh: '食', title: 'Expression and ideas', text: 'Your voice carries. Writing, design, and speaking land well.', score: 0 },
  wealth: { zh: '财', title: 'Results and resources', text: 'Budgets, deals, and tangible wins are within reach.', score: 1 },
  officer: { zh: '官', title: 'Authority and pressure', text: 'Leadership is watching and deadlines bite. Be prepared and punctual.', score: -1 },
};

export const ELEMENT_INFO = {
  wood: { zh: '木', name: 'Wood', colors: ['green', 'teal'], swatch: '#3f7d4e', direction: 'East', items: ['a small potted plant', 'a green notebook', 'a wooden pen or coaster'] },
  fire: { zh: '火', name: 'Fire', colors: ['red', 'purple'], swatch: '#c0392b', direction: 'South', items: ['a warm desk lamp', 'a red pen', 'a candle (unlit is fine)'] },
  earth: { zh: '土', name: 'Earth', colors: ['yellow', 'tan'], swatch: '#c9a227', direction: 'Northeast', items: ['a ceramic mug', 'a smooth stone', 'a terracotta pot'] },
  metal: { zh: '金', name: 'Metal', colors: ['white', 'gold'], swatch: '#b8a26a', direction: 'West', items: ['a metal pen', 'your watch', 'a brass paperweight'] },
  water: { zh: '水', name: 'Water', colors: ['navy', 'black'], swatch: '#1f4e79', direction: 'North', items: ['a full glass of water', 'a blue mousepad', 'a glass bottle'] },
};

export const DIRECTIONS = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];

export const TIERS = [
  { min: 4, zh: '大吉', en: 'Great fortune', band: 'good' },
  { min: 2, zh: '吉', en: 'Good fortune', band: 'good' },
  { min: 1, zh: '小吉', en: 'Small fortune', band: 'good' },
  { min: 0, zh: '平', en: 'Steady', band: 'neutral' },
  { min: -2, zh: '小凶', en: 'Tread lightly', band: 'bad' },
  { min: -Infinity, zh: '凶', en: 'Take care', band: 'bad' },
];

export const INTROS = {
  traditional: {
    good: ['The heavens align with your work today.', 'Auspicious winds fill your sails.', 'Fortune smiles upon your desk.'],
    neutral: ['The day is balanced, neither high nor low.', 'Still waters: steady effort is rewarded.', 'An even day. Walk the middle path.'],
    bad: ['The energies are unsettled. Move with care.', 'Clouds gather, but they also pass.', 'A day to guard rather than conquer.'],
  },
  playful: {
    good: ['The office stars are throwing you a party. 🎉', 'Today your Wi-Fi and your luck are both full bars.', 'Main-character energy, fully charged.'],
    neutral: ['A perfectly fine, very normal, extremely Tuesday-ish day.', 'Not a boss level, not a bonus level. Just a level.', 'Steady as your favorite coffee mug.'],
    bad: ['Mercury isn’t even in retrograde and yet… 🙃', 'Today’s vibe: “reply-all” with caution.', 'The printer senses fear. Stay calm.'],
  },
  direct: {
    good: ['Strong day. Use it for important moves.', 'Conditions favor bold action.', 'High-leverage day. Don’t waste it.'],
    neutral: ['Average day. Execute the plan.', 'Routine day. Keep momentum.', 'No tailwind, no headwind.'],
    bad: ['Low day. Minimize risk.', 'Defensive day. Protect what you have.', 'Hold big moves until tomorrow.'],
  },
};

export const FOCUS_LINES = {
  jobhunt: { good: 'Send the applications and message the recruiter. Doors are open.', neutral: 'Polish the résumé and practice your story.', bad: 'Research companies today. Hold off on sending applications until tomorrow.' },
  promotion: { good: 'Make your wins visible and have the career conversation.', neutral: 'Quietly document your impact. You’ll need it.', bad: 'Stay steady and reliable. Today is for earning trust, not asking.' },
  launch: { good: 'Push toward the finish line. Momentum is with you.', neutral: 'Burn down the checklist, one item at a time.', bad: 'Test, verify, rehearse. Ship tomorrow if you can.' },
  deals: { good: 'Ask for the close. Buyers are receptive.', neutral: 'Nurture the pipeline and qualify carefully.', bad: 'Build relationships and avoid pressure tactics today.' },
  learning: { good: 'Tackle the hardest concept. It will click.', neutral: 'Steady practice compounds. Do your reps.', bad: 'Review what you know instead of forcing new material.' },
  balance: { good: 'Finish strong and leave on time. You’ve earned it.', neutral: 'Set one boundary today and keep it.', bad: 'Protect your energy. Decline the optional meeting.' },
  survive: { good: 'Good news: today might actually be easy. Enjoy it.', neutral: 'One task at a time. You’ve got this.', bad: 'Lower the bar, drink water, log off on time.' },
};
