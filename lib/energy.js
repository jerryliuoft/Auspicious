// Auspicious — Energy forecast: an estimate of how much you'll have in the tank
// through the day. Not a medical or biometric measurement; it combines:
//   • your circadian rhythm (sleep inertia, late-morning peak, post-lunch dip,
//     second wind, evening decline), shifted by chronotype,
//   • last night's sleep (one-tap check-in),
//   • calendar load (meetings drain; back-to-back drains more; breaks and lunch recharge),
//   • daylight (a good-weather outdoor window recharges).

export const CHRONOTYPES = {
  lark: { label: 'Morning person', wake: 6.5 },
  neutral: { label: 'Somewhere in between', wake: 7.5 },
  owl: { label: 'Night owl', wake: 9 },
};
export const SLEEP_START = { great: 96, ok: 84, poor: 64 };

const STEP = 0.25; // hours
const gauss = (x, mu, sd) => Math.exp(-((x - mu) ** 2) / (2 * sd * sd));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Alertness from the body clock alone (0.3–1), by hours since waking. */
export function circadian(h) {
  const inertia = 0.32 * Math.exp(-h / 0.9);              // grogginess right after waking
  const peak = 0.22 * gauss(h, 4, 2.1);                    // late-morning high
  const dip = 0.22 * gauss(h, 7.3, 1.1);                   // post-lunch dip
  const second = 0.15 * gauss(h, 10.3, 1.3);               // second wind
  const evening = 0.3 / (1 + Math.exp(-(h - 13) / 1.1));   // evening decline
  return clamp(0.8 + peak - dip + second - inertia - evening, 0.3, 1);
}

const toHour = (hhmm, dflt) => {
  if (!hhmm) return dflt;
  const [h, m] = hhmm.split(':').map(Number);
  return h + (m || 0) / 60;
};

/**
 * Forecast energy (0–100) in 15-minute steps from wake-up to bedtime.
 * @param items   timed meetings [{ from, to }] in local decimal hours (from the agenda)
 * @param real    weather assessment (or null)
 */
export function forecastEnergy({ profile = {}, sleep = 'ok', items = [], real = null, isWorkday = true }) {
  const chrono = CHRONOTYPES[profile.chronotype] ? profile.chronotype : 'neutral';
  const wake = toHour(profile.wakeTime, CHRONOTYPES[chrono].wake);
  const bed = wake + 16;
  const ws = toHour(profile.workStart, 9), we = toHour(profile.workEnd, 18);
  const meetings = [...items].sort((a, b) => a.from - b.from);
  const inMeeting = (t) => meetings.find((m) => t >= m.from && t < m.to);
  const lastEnd = (t) => meetings.filter((m) => m.to <= t).reduce((x, m) => Math.max(x, m.to), -Infinity);
  const outdoor = real?.window && (real.verdict === 'great' || real.verdict === 'fair') ? real.window : null;

  let tank = SLEEP_START[sleep] ?? SLEEP_START.ok;
  let drained = 0;
  const points = [];
  for (let t = wake; t <= bed + 1e-9; t += STEP) {
    const m = inMeeting(t);
    const working = isWorkday && t >= ws && t < we;
    let delta = -0.55; // being awake costs a little
    if (m) {
      delta -= 0.9;
      const prev = meetings.find((x) => x !== m && Math.abs(x.to - m.from) < 1 / 6);
      if (prev) delta -= 0.35; // no gap before this one
      drained += 0.9 + (prev ? 0.35 : 0);
    } else if (working) {
      delta -= 0.15; // focused work costs a bit more than idling
      const sinceMeeting = t - lastEnd(t);
      if (sinceMeeting >= 0 && sinceMeeting < 0.5) delta += 0.7; // breather after a meeting
    }
    if (!m && t >= 12 && t < 13) delta += 1.4; // lunch break
    if (!m && outdoor && t >= outdoor.from && t < outdoor.to) delta += 0.5; // daylight
    if (!isWorkday) delta += 0.35; // days off restore
    tank = clamp(tank + delta, 8, 100);
    const e = Math.round(clamp(tank * (0.5 + 0.5 * circadian(t - wake)), 5, 100));
    points.push({ h: Math.round(t * 100) / 100, e });
  }

  const at = (h) => {
    // Before your usual wake-up you'd be dragged out of bed early: well below even the groggy start.
    if (h < points[0].h) return Math.round(points[0].e * 0.6);
    const p = points.find((x) => x.h >= h - 1e-9);
    return p ? p.e : points[points.length - 1].e;
  };
  const avg = (a, b) => {
    const xs = points.filter((p) => p.h >= a - 1e-9 && p.h < b - 1e-9);
    return xs.length ? Math.round(xs.reduce((s, p) => s + p.e, 0) / xs.length) : at(a);
  };
  // Best 2-hour and lowest 1-hour stretch inside the day you're working (or awake, on days off).
  const lo = isWorkday ? Math.max(ws, wake + 1) : wake + 1.5;
  const hi = isWorkday ? Math.min(we, bed) : bed - 3;
  let peak = null, dip = null;
  for (let a = lo; a + 2 <= hi + 1e-9; a += STEP) { const v = avg(a, a + 2); if (!peak || v > peak.e) peak = { from: a, to: a + 2, e: v }; }
  // The classic slump sits 5–9.5 hours after waking (early-to-mid afternoon for most people).
  for (let a = Math.max(lo, wake + 5); a + 1 <= Math.min(hi, wake + 9.5) + 1e-9; a += STEP) { const v = avg(a, a + 1); if (!dip || v < dip.e) dip = { from: a, to: a + 1, e: v }; }

  return {
    points, wake, bed, sleep, chronotype: chrono, at, avg, peak, dip,
    meetingDrain: Math.round(drained),
    low: points.filter((p) => p.h >= lo && p.h < hi && p.e < 40).length > 0,
  };
}

// ---------- matching tasks to energy ----------

// Activities that need a full tank vs. ones that fit a low patch.
export const DEEP = new Set(['create', 'fix', 'kickoff', 'plan', 'pitch', 'negotiate', 'present', 'launch', 'decide', 'learn', 'sign', 'ask', 'hire', 'deploy', 'bigEmail']);
export const LIGHT = new Set(['declutter', 'review', 'followup', 'document', 'rest', 'network', 'oneonone', 'celebrate', 'travel']);
export const HARD_MEETINGS = new Set(['present', 'negotiate', 'pitch', 'interview', 'launch']);
