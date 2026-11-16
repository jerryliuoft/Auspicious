// Auspicious — personal stats that make each page feel earned:
// how today ranks against your year, how rare its tier is, and your streak.
import { buildFortune, dateKey } from './fortune-engine.js';

/** Almanac-only scores for every day of the year (cached per profile + year). */
const yearCache = new Map();
function yearScores(profile, year) {
  const k = `${profile.birthDate}|${profile.birthTime || ''}|${year}`;
  if (yearCache.has(k)) return yearCache.get(k);
  const out = [];
  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    const f = buildFortune(profile, new Date(d));
    out.push({ score: f.score, tier: f.tier.zh });
  }
  yearCache.set(k, out);
  return out;
}

/**
 * Luck percentile (0–100): share of your days this year that today beats (ties count half).
 * Rarity: how often today's tier (or better) shows up for you.
 */
export function luckStats(profile, now, fortune) {
  const days = yearScores(profile, now.getFullYear());
  const below = days.filter((x) => x.score < fortune.score).length;
  const ties = days.filter((x) => x.score === fortune.score).length;
  const luck = Math.max(1, Math.min(99, Math.round(((below + ties / 2) / days.length) * 100)));
  const sameTier = days.filter((x) => x.tier === fortune.tier.zh).length;
  const oneIn = sameTier ? Math.max(1, Math.round(days.length / sameTier)) : days.length;
  return { luck, oneIn, rare: oneIn >= 8 };
}

/** Update the turned-days history and return the current streak. */
export function nextHistory(history = [], todayKey) {
  const set = new Set(history);
  set.add(todayKey);
  const sorted = [...set].sort().slice(-120);
  let streak = 0;
  const d = new Date(`${todayKey}T12:00:00`);
  while (set.has(dateKey(d))) { streak++; d.setDate(d.getDate() - 1); }
  return { history: sorted, streak, total: sorted.length };
}

export const MILESTONES = [3, 7, 14, 30, 50, 100];
