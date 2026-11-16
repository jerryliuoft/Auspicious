// Auspicious — reads the user's calendar from its private iCal (.ics) address.
// The address and event titles stay in this browser; only the calendar provider is contacted.
import { local, isExtension } from './storage.js';
import { parseICS, eventsOn } from './ics.js';

const FRESH_MS = 30 * 60 * 1000;
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Accept https:// and webcal:// links; returns a normalized https URL or throws. */
export function normalizeIcsUrl(raw) {
  let u = String(raw || '').trim();
  if (/^webcals?:\/\//i.test(u)) u = u.replace(/^webcals?:/i, 'https:');
  const url = new URL(u); // throws on garbage
  if (url.protocol !== 'https:' && !/^(localhost|127\.0\.0\.1)$/.test(url.hostname)) throw new Error('not-https');
  return url.href;
}

const originPattern = (url) => `${new URL(url).origin}/*`;
const canAskPermissions = () => isExtension && typeof chrome.permissions?.request === 'function';

/** Must be called directly from a click handler (Chrome requires a user gesture). */
export function requestCalendarPermission(url) {
  if (!canAskPermissions()) return Promise.resolve(true);
  return chrome.permissions.request({ origins: [originPattern(url)] });
}

export async function hasCalendarPermission(url) {
  if (!canAskPermissions()) return true;
  return chrome.permissions.contains({ origins: [originPattern(url)] });
}

export async function releaseCalendarPermission(url) {
  if (!canAskPermissions()) return;
  try { await chrome.permissions.remove({ origins: [originPattern(url)] }); } catch { /* ignore */ }
}

async function fetchText(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, credentials: 'omit', cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!/BEGIN:VCALENDAR/.test(text)) throw new Error('not-ics');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch and parse a calendar; used by settings to validate a link. */
export async function loadCalendar(url, { timeoutMs = 8000 } = {}) {
  return parseICS(await fetchText(url, timeoutMs));
}

const revive = (list) => list.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) }));

/**
 * Today's events for the connected calendar, cached for 30 minutes.
 * Returns null when no calendar is connected or it can't be read.
 */
export async function getEventsFor(day, { timeoutMs = 3000, force = false } = {}) {
  const { calendar, calCache } = await local.get(['calendar', 'calCache']);
  if (!calendar?.url) return null;
  const key = dayKey(day);
  const cached = calCache && calCache.url === calendar.url && calCache.day === key ? calCache : null;
  if (cached && !force && Date.now() - cached.at < FRESH_MS) return revive(cached.events);
  if (!(await hasCalendarPermission(calendar.url))) return cached ? revive(cached.events) : null;
  try {
    const events = eventsOn(parseICS(await fetchText(calendar.url, timeoutMs)), day);
    await local.set({
      calCache: { url: calendar.url, day: key, at: Date.now(), events: events.map((e) => ({ ...e, start: e.start.toISOString(), end: e.end.toISOString() })) },
    });
    return events;
  } catch {
    return cached ? revive(cached.events) : null;
  }
}
